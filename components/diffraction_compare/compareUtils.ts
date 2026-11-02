import { 
  PeakItem, 
  ProfilePoint, 
  IndexedPeakMatch, 
  SpectralMetrics, 
  SearchMatchCandidate,
  DiffTheme,
  CurveColorPalette,
  StrainRegressionAnalysis,
  StrainRegressionPoint,
  PhaseQuantificationResult
} from './types';

// Standard Cu-Ka1 & Cu-Ka2 X-ray wavelengths in Angstroms (NIST reference values)
export const CU_KA_WAVELENGTH = 1.540598;
export const CU_KA2_WAVELENGTH = 1.544426;

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
 * Estimates Reference Intensity Ratio (I/Ic relative to alpha-Al2O3 Corundum)
 * based on phase name/formula or explicit database metadata.
 */
export const estimateMaterialRir = (material: any): number => {
  if (!material) return 1.0;
  if (typeof material.rir === 'number' && material.rir > 0) return material.rir;

  const key = `${material.name || ''} ${material.formula || ''}`.toLowerCase();
  if (key.includes('corundum') || key.includes('al2o3')) return 1.0;
  if (key.includes('quartz') || key.includes('sio2')) return 3.6;
  if (key.includes('anatase')) return 3.3;
  if (key.includes('rutile')) return 3.4;
  if (key.includes('brookite')) return 2.1;
  if (key.includes('tio2')) return 3.3;
  if (key.includes('hydroxyapatite') || key.includes('hap') || key.includes('ca10(po4)6')) return 1.5;
  if (key.includes('tcp') || key.includes('ca3(po4)2')) return 1.2;
  if (key.includes('lifepo4') || key.includes('triphylite')) return 1.8;
  if (key.includes('fepo4') || key.includes('heterosite')) return 1.6;
  if (key.includes('batio3') || key.includes('perovskite')) return 4.8;
  if (key.includes('graphite') || key.includes('graphene') || key === ' c ') return 1.9;
  if (key.includes('zno') || key.includes('zincite')) return 5.2;
  if (key.includes('ceo2') || key.includes('ceria')) return 7.5;
  if (key.includes('silicon') || key.includes('si ')) return 4.7;
  if (key.includes('nacl') || key.includes('halite')) return 4.4;
  if (key.includes('calcite') || key.includes('caco3')) return 3.1;
  if (key.includes('fe3o4') || key.includes('magnetite')) return 4.9;
  if (key.includes('fe2o3') || key.includes('hematite')) return 2.8;
  return 2.0;
};

/**
 * Caglioti Instrumental Resolution Function:
 * FWHM^2(theta) = U * tan^2(theta) + V * tan(theta) + W
 */
export const computeCagliotiFwhm = (
  twoThetaDeg: number,
  baseFwhm: number,
  enableCaglioti = false,
  u = 0.04,
  v = -0.02,
  wOverride?: number
): number => {
  const safeBase = Math.max(0.04, baseFwhm);
  if (!enableCaglioti) return safeBase;

  const thetaRad = (Math.max(1, Math.min(170, twoThetaDeg)) / 2) * (Math.PI / 180);
  const tanTheta = Math.tan(thetaRad);
  const w = wOverride !== undefined ? wOverride : safeBase * safeBase;
  const fwhmSq = u * tanTheta * tanTheta + v * tanTheta + w;
  return Math.sqrt(Math.max(0.0016, fwhmSq));
};

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
 * and parabolic 3-point sub-step centroid interpolation + half-maximum FWHM estimation
 */
export const extractPeaksFromRawPoints = (points: { twoTheta: number; intensity: number }[], maxPeaks = 30): PeakItem[] => {
  if (points.length < 5) return [];
  const maxI = Math.max(...points.map(p => p.intensity), 1);
  const minI = Math.min(...points.map(p => p.intensity), 0);
  const normalized = points.map(p => ({
    twoTheta: p.twoTheta,
    intensity: ((p.intensity - minI) / Math.max(1e-6, maxI - minI)) * 100
  }));

  const peaks: PeakItem[] = [];
  const window = 3;
  for (let i = window; i < normalized.length - window; i++) {
    const curr = normalized[i];
    if (curr.intensity < 3.5) continue; // Noise cutoff

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
        if (Math.abs(delta) < 0.25) refinedTheta += delta;
      }

      // Estimate local FWHM by walking left and right to half-max
      const halfMax = y2 * 0.5;
      let leftX = x2 - 0.14;
      for (let l = i; l > Math.max(0, i - 25); l--) {
        if (normalized[l].intensity <= halfMax) {
          leftX = normalized[l].twoTheta;
          break;
        }
      }
      let rightX = x2 + 0.14;
      for (let r = i; r < Math.min(normalized.length - 1, i + 25); r++) {
        if (normalized[r].intensity <= halfMax) {
          rightX = normalized[r].twoTheta;
          break;
        }
      }
      const estFwhm = Math.max(0.08, Math.min(1.5, rightX - leftX));

      const thetaRad = (refinedTheta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? Number((CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4)) : undefined;

      peaks.push({
        twoTheta: Number(refinedTheta.toFixed(3)),
        intensity: Number(curr.intensity.toFixed(1)),
        fwhm: Number(estFwhm.toFixed(3)),
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
        fwhm: r.fwhm,
        dSpacing
      };
    });
  }
  const pattern = material.pattern || '';
  return parseCustomPattern(pattern);
};

/**
 * Sonneveld-Visser / SNIP iterative concave baseline estimation and stripping
 */
const stripConcaveBaseline = (arr: number[], iterations = 24): number[] => {
  const n = arr.length;
  if (n === 0) return [];
  let bg = [...arr];
  const nextBg = new Array(n);

  for (let w = iterations; w >= 1; w--) {
    for (let i = 0; i < n; i++) {
      const leftIdx = Math.max(0, i - w);
      const rightIdx = Math.min(n - 1, i + w);
      const neighborAvg = 0.5 * (bg[leftIdx] + bg[rightIdx]);
      nextBg[i] = Math.min(bg[i], neighborAvg);
    }
    bg = [...nextBg];
  }

  return arr.map((val, i) => Math.max(0, val - bg[i]));
};

/**
 * Analytical Rachinger Cu Ka2 stripping on a uniform 2Theta grid
 */
const applyRachingerKa2Strip = (twoThetas: number[], intensities: number[], step: number): number[] => {
  const n = intensities.length;
  const stripped = [...intensities];
  const deltaLambdaRatio = (CU_KA2_WAVELENGTH - CU_KA_WAVELENGTH) / CU_KA_WAVELENGTH; // ~0.002485

  for (let i = 0; i < n; i++) {
    const thetaRad = (twoThetas[i] / 2) * (Math.PI / 180);
    if (thetaRad <= 0.01 || thetaRad >= 1.5) continue;
    // Delta(2Theta) in degrees between Ka1 and Ka2
    const deltaTwoThetaDeg = 2 * Math.tan(thetaRad) * deltaLambdaRatio * (180 / Math.PI);
    const indexOffset = deltaTwoThetaDeg / step;
    const prevIdx = i - indexOffset;
    if (prevIdx >= 0 && prevIdx < n - 1) {
      const i0 = Math.floor(prevIdx);
      const frac = prevIdx - i0;
      const interpAlpha1 = stripped[i0] * (1 - frac) + stripped[i0 + 1] * frac;
      stripped[i] = Math.max(0, intensities[i] - 0.5 * interpAlpha1);
    }
  }
  return stripped;
};

/**
 * Generates continuous synthetic diffraction profiles for Sample A, Sample B (with shift & scale),
 * and optional secondary phases Sample C and Sample D.
 * Supports Caglioti (U, V, W) angle-dependent FWHM, Cu Ka1/Ka2 doublet splitting, Rachinger stripping,
 * Sonneveld-Visser baseline stripping, and Max100 / UnitArea / Raw normalization modes.
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
    differenceMode?: 'residual' | 'relative' | 'chi' | 'squared';
    smoothingFilter?: 'none' | 'savitzky-golay' | 'moving-avg';
    stripBackground?: boolean;
    enableCaglioti?: boolean;
    cagliotiU?: number;
    cagliotiV?: number;
    cagliotiW?: number;
    enableKa2Doublet?: boolean;
    stripKa2?: boolean;
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
    normalizationMode = 'max100',
    enableCaglioti = false,
    cagliotiU = 0.04,
    cagliotiV = -0.02,
    cagliotiW,
    enableKa2Doublet = false,
    stripKa2 = false
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
      // Thompson-Cox-Hastings / Pseudo-Voigt
      const g = Math.exp(-Math.LN2 * Math.pow(dx / halfW, 2));
      const l = 1 / (1 + Math.pow(dx / halfW, 2));
      const safeEta = Math.max(0, Math.min(1, eta));
      return height * (safeEta * l + (1 - safeEta) * g);
    }
  };

  // Evaluates a Bragg reflection including optional Cu Ka2 companion doublet
  const evalReflectionWithDoublet = (twoTheta: number, centerTwoTheta: number, peakFwhm: number, height: number): number => {
    let val = 0;
    const cutoff = peakFwhm * 5.0;
    if (Math.abs(twoTheta - centerTwoTheta) < cutoff) {
      val += evalPeakShape(twoTheta, centerTwoTheta, peakFwhm, height);
    }
    if (enableKa2Doublet) {
      const theta1Rad = (centerTwoTheta / 2) * (Math.PI / 180);
      const sinTheta2 = (CU_KA2_WAVELENGTH / CU_KA_WAVELENGTH) * Math.sin(theta1Rad);
      if (sinTheta2 > 0 && sinTheta2 < 0.999) {
        const twoTheta2 = 2 * Math.asin(sinTheta2) * (180 / Math.PI);
        if (Math.abs(twoTheta - twoTheta2) < cutoff) {
          val += evalPeakShape(twoTheta, twoTheta2, peakFwhm, height * 0.5);
        }
      }
    }
    return val;
  };

  const numPoints = Math.floor((maxTheta - minTheta) / step) + 1;
  const twoThetaGrid = new Array<number>(numPoints);
  const rawA = new Array<number>(numPoints);
  const rawB = new Array<number>(numPoints);
  const rawC = new Array<number>(numPoints);
  const rawD = new Array<number>(numPoints);
  const cagliotiCurve = new Array<number>(numPoints);

  const maxIntensityA = normalizationMode === 'raw' ? 100 : (peaksA.length > 0 ? Math.max(...peaksA.map(p => p.intensity), 1) : 100);
  const maxIntensityB = normalizationMode === 'raw' ? 100 : (peaksB.length > 0 ? Math.max(...peaksB.map(p => p.intensity), 1) : 100);
  const maxIntensityC = normalizationMode === 'raw' ? 100 : (peaksC.length > 0 ? Math.max(...peaksC.map(p => p.intensity), 1) : 100);
  const maxIntensityD = normalizationMode === 'raw' ? 100 : (peaksD.length > 0 ? Math.max(...peaksD.map(p => p.intensity), 1) : 100);

  for (let i = 0; i < numPoints; i++) {
    const twoTheta = Number((minTheta + i * step).toFixed(2));
    twoThetaGrid[i] = twoTheta;

    const localCaglioti = computeCagliotiFwhm(twoTheta, fwhm, enableCaglioti, cagliotiU, cagliotiV, cagliotiW);
    cagliotiCurve[i] = Number(localCaglioti.toFixed(4));

    // Deterministic instrumental counting noise
    const noise = noiseLevel > 0 
      ? (Math.sin(twoTheta * 97.3) * Math.cos(twoTheta * 31.7) * noiseLevel * 2) 
      : 0;

    // Sample A continuous profile
    let iA = background + noise;
    for (const p of peaksA) {
      const relH = (p.intensity / maxIntensityA) * 100;
      const peakFwhm = p.fwhm || computeCagliotiFwhm(p.twoTheta, fwhm, enableCaglioti, cagliotiU, cagliotiV, cagliotiW);
      iA += evalReflectionWithDoublet(twoTheta, p.twoTheta, peakFwhm, relH);
    }

    // Sample B continuous profile
    let iB = background + noise;
    for (const p of peaksB) {
      const relH = (p.intensity / maxIntensityB) * 100 * scaleSampleB;
      const targetCenter = p.twoTheta + shiftTwoThetaB;
      const peakFwhm = p.fwhm || computeCagliotiFwhm(targetCenter, fwhm, enableCaglioti, cagliotiU, cagliotiV, cagliotiW);
      iB += evalReflectionWithDoublet(twoTheta, targetCenter, peakFwhm, relH);
    }

    // Phase C profile
    let iC = 0;
    if (matC && scaleSampleC > 0) {
      for (const p of peaksC) {
        const relH = (p.intensity / maxIntensityC) * 100 * scaleSampleC;
        const peakFwhm = p.fwhm || computeCagliotiFwhm(p.twoTheta, fwhm, enableCaglioti, cagliotiU, cagliotiV, cagliotiW);
        iC += evalReflectionWithDoublet(twoTheta, p.twoTheta, peakFwhm, relH);
      }
    }

    // Phase D profile
    let iD = 0;
    if (matD && scaleSampleD > 0) {
      for (const p of peaksD) {
        const relH = (p.intensity / maxIntensityD) * 100 * scaleSampleD;
        const peakFwhm = p.fwhm || computeCagliotiFwhm(p.twoTheta, fwhm, enableCaglioti, cagliotiU, cagliotiV, cagliotiW);
        iD += evalReflectionWithDoublet(twoTheta, p.twoTheta, peakFwhm, relH);
      }
    }

    rawA[i] = Math.max(0, iA);
    rawB[i] = Math.max(0, iB);
    rawC[i] = Math.max(0, iC);
    rawD[i] = Math.max(0, iD);
  }

  // Optional Rachinger Ka2 Stripping
  let procA = stripKa2 ? applyRachingerKa2Strip(twoThetaGrid, rawA, step) : rawA;
  let procB = stripKa2 ? applyRachingerKa2Strip(twoThetaGrid, rawB, step) : rawB;

  // Optional Savitzky-Golay (5-pt quadratic) or Moving Average smoothing
  if (options.smoothingFilter === 'savitzky-golay' || options.smoothingFilter === 'moving-avg') {
    const isSg = options.smoothingFilter === 'savitzky-golay';
    const smoothedA = [...procA];
    for (let i = 2; i < numPoints - 2; i++) {
      if (isSg) {
        smoothedA[i] = Math.max(
          0,
          (-3 * procA[i - 2] + 12 * procA[i - 1] + 17 * procA[i] + 12 * procA[i + 1] - 3 * procA[i + 2]) / 35
        );
      } else {
        smoothedA[i] = Math.max(0, (procA[i - 1] + procA[i] + procA[i + 1]) / 3);
      }
    }
    procA = smoothedA;
  }

  // Optional Sonneveld-Visser / SNIP Baseline Stripping
  if (options.stripBackground) {
    procA = stripConcaveBaseline(procA, 22);
    procB = stripConcaveBaseline(procB, 22);
  }

  // Apply Normalization Mode ('max100' | 'unitArea' | 'raw')
  if (normalizationMode === 'unitArea') {
    const areaA = procA.reduce((s, v) => s + v * step, 0);
    const areaB = procB.reduce((s, v) => s + v * step, 0);
    const targetArea = 100; // Normalized integrated intensity = 100
    const factorA = areaA > 1e-6 ? targetArea / areaA : 1;
    const factorB = areaB > 1e-6 ? (targetArea * scaleSampleB) / areaB : 1;
    procA = procA.map(v => v * factorA);
    procB = procB.map(v => v * factorB);
  }

  const points: ProfilePoint[] = new Array(numPoints);

  for (let i = 0; i < numPoints; i++) {
    const twoTheta = twoThetaGrid[i];
    const iA = procA[i];
    const iB = procB[i];
    const iC = rawC[i];
    const iD = rawD[i];
    const totalModel = iB + iC + iD;

    // Difference calculation based on mode
    let diff = iA - totalModel;
    if (options.differenceMode === 'relative') {
      diff = (Math.abs(iA - totalModel) / Math.max(totalModel, 1)) * 100;
    } else if (options.differenceMode === 'chi') {
      diff = (iA - totalModel) / Math.sqrt(Math.max(iA, 1));
    } else if (options.differenceMode === 'squared') {
      diff = Math.pow(iA - totalModel, 2) / 100;
    }

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
      derivA: 0,
      derivB: 0,
      cagliotiFwhm: cagliotiCurve[i]
    };
  }

  // Fast O(N) central difference numerical derivatives
  for (let i = 0; i < numPoints; i++) {
    const prevA = i > 0 ? points[i - 1].intensityA : points[i].intensityA;
    const nextA = i < numPoints - 1 ? points[i + 1].intensityA : points[i].intensityA;
    const prevB = i > 0 ? points[i - 1].intensityB : points[i].intensityB;
    const nextB = i < numPoints - 1 ? points[i + 1].intensityB : points[i].intensityB;
    const dx = (i > 0 && i < numPoints - 1) ? 2 * step : step;

    points[i].derivA = Number(((nextA - prevA) / dx).toFixed(2));
    points[i].derivB = Number(((nextB - prevB) / dx).toFixed(2));
  }

  return { points, peaksA, peaksB, peaksC, peaksD };
};

/**
 * Calculates high-precision crystallographic difference and strain metrics between two caliper points
 */
export const calculateCaliperMetrics = (p1: { twoTheta: number; intensity: number }, p2: { twoTheta: number; intensity: number }) => {
  const theta1Rad = (p1.twoTheta / 2) * (Math.PI / 180);
  const theta2Rad = (p2.twoTheta / 2) * (Math.PI / 180);

  const d1 = theta1Rad > 0 ? CU_KA_WAVELENGTH / (2 * Math.sin(theta1Rad)) : 0;
  const d2 = theta2Rad > 0 ? CU_KA_WAVELENGTH / (2 * Math.sin(theta2Rad)) : 0;

  const q1 = theta1Rad > 0 ? (4 * Math.PI * Math.sin(theta1Rad)) / CU_KA_WAVELENGTH : 0;
  const q2 = theta2Rad > 0 ? (4 * Math.PI * Math.sin(theta2Rad)) / CU_KA_WAVELENGTH : 0;

  const deltaTwoTheta = Number((p2.twoTheta - p1.twoTheta).toFixed(3));
  const deltaTwoThetaArcmin = Number((deltaTwoTheta * 60).toFixed(1));
  const deltaD = Number((d2 - d1).toFixed(4));
  const strainPercent = d1 > 0 ? Number((((d2 - d1) / d1) * 100).toFixed(3)) : 0;
  const intensityRatio = p1.intensity > 0 ? Number((p2.intensity / p1.intensity).toFixed(2)) : 1;
  const deltaQ = Number((q2 - q1).toFixed(4));

  return {
    deltaTwoTheta,
    deltaTwoThetaArcmin,
    deltaD,
    strainPercent,
    intensityRatio,
    deltaQ,
    d1: d1.toFixed(4),
    d2: d2.toFixed(4),
    q1: q1.toFixed(3),
    q2: q2.toFixed(3)
  };
};

/**
 * Helper to compute Spearman rank correlation coefficient rho
 */
const computeSpearmanRankCorrelation = (arrX: number[], arrY: number[]): number => {
  const n = arrX.length;
  if (n < 3) return 0;

  const rankArray = (arr: number[]) => {
    const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && indexed[j + 1].v === indexed[i].v) j++;
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
      i = j + 1;
    }
    return ranks;
  };

  const rX = rankArray(arrX);
  const rY = rankArray(arrY);

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += rX[i];
    sumY += rY[i];
    sumXY += rX[i] * rY[i];
    sumX2 += rX[i] * rX[i];
    sumY2 += rY[i] * rY[i];
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt(Math.max(0, (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)));
  return den > 1e-9 ? Math.max(0, (num / den) * 100) : 0;
};

/**
 * Computes statistical cross-correlation, Rietveld residual metrics, Cosine similarity,
 * Spearman rank correlation, Bragg R-factor, and Durbin-Watson serial correlation statistic.
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
      goodnessOfFit: '1.00',
      cosineSimilarity: '0.0',
      spearmanRho: '0.0',
      braggR: '0.0',
      durbinWatson: '2.00'
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

  // Bragg peak region intensity sums (where yObs or yCalc > 8% above floor)
  let sumBraggDiff = 0;
  let sumBraggObs = 0;

  // Durbin-Watson serial correlation accumulators
  let sumResidualSq = 0;
  let sumSerialDiffSq = 0;
  let prevRes = 0;

  const N = points.length;
  const obsList = new Array<number>(N);
  const calcList = new Array<number>(N);

  for (let i = 0; i < N; i++) {
    const yObs = points[i].intensityA;
    const yCalc = points[i].intensityTotalModel ?? points[i].intensityB;
    obsList[i] = yObs;
    calcList[i] = yCalc;

    const rawRes = yObs - yCalc;
    const diff = Math.abs(rawRes);

    sumDiff += diff;
    sumObs += Math.abs(yObs);

    // Poisson counting weight w_i = 1 / max(yObs, 1)
    const w = 1 / Math.max(yObs, 1);
    sumDiffSq += w * Math.pow(diff, 2);
    sumObsSq += w * Math.pow(yObs, 2);

    if (diff > maxDiff) maxDiff = diff;

    sumA += yObs;
    sumB += yCalc;
    sumAA += yObs * yObs;
    sumBB += yCalc * yCalc;
    sumAB += yObs * yCalc;

    if (yObs > 6 || yCalc > 6) {
      sumBraggDiff += diff;
      sumBraggObs += Math.max(yObs, 1);
    }

    sumResidualSq += rawRes * rawRes;
    if (i > 0) {
      const dRes = rawRes - prevRes;
      sumSerialDiffSq += dRes * dRes;
    }
    prevRes = rawRes;
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

  // Pearson linear correlation coefficient (r)
  const numerator = (N * sumAB) - (sumA * sumB);
  const denom = Math.sqrt(Math.max(0, (N * sumAA - sumA * sumA) * (N * sumBB - sumB * sumB)));
  const pearsonR = denom !== 0 ? Math.max(0, (numerator / denom) * 100) : 0;

  // Cosine spectral similarity = (A . B) / (||A|| ||B||)
  const cosDenom = Math.sqrt(sumAA * sumBB);
  const cosineSimilarity = cosDenom > 0 ? Math.max(0, Math.min(100, (sumAB / cosDenom) * 100)) : 0;

  // Spearman rank correlation (rho)
  const spearmanRho = computeSpearmanRankCorrelation(obsList, calcList);

  // Bragg R-factor (R_B)
  const braggR = sumBraggObs > 0 ? (sumBraggDiff / sumBraggObs) * 100 : rP;

  // Durbin-Watson statistic d_DW in [0, 4] (2.0 = zero serial correlation)
  const durbinWatson = sumResidualSq > 1e-6 ? (sumSerialDiffSq / sumResidualSq) : 2.0;

  // Figure of Merit (FOM) combining Pearson, Cosine, R_wp, and R_p (0-100 scale)
  const rmsd = Math.sqrt(sumDiffSq / N);
  const fom = Math.max(
    0,
    Math.min(100, (pearsonR * 0.45) + (cosineSimilarity * 0.25) + ((100 - Math.min(100, rP)) * 0.30))
  );

  return {
    rP: rP.toFixed(2),
    rWP: rWP.toFixed(2),
    rExp: rExp.toFixed(2),
    chiSquared: chiSquared.toFixed(2),
    pearsonR: pearsonR.toFixed(2),
    fom: fom.toFixed(1),
    maxDiff: maxDiff.toFixed(1),
    rmsd: rmsd.toFixed(2),
    goodnessOfFit: Math.sqrt(chiSquared).toFixed(2),
    cosineSimilarity: cosineSimilarity.toFixed(2),
    spearmanRho: spearmanRho.toFixed(2),
    braggR: braggR.toFixed(2),
    durbinWatson: durbinWatson.toFixed(2)
  };
};

/**
 * Multi-phase peak-by-peak indexing (Reference B, Secondary Phase C, Tertiary Phase D)
 * and linear-regression separation of instrumental zero-shift (Delta 2Theta_0),
 * specimen displacement (cos Theta), and true isotropic lattice macrostrain (Delta d / d).
 */
export const computePeakIndexing = (
  peaksA: PeakItem[],
  peaksB: PeakItem[],
  peaksC: PeakItem[] = [],
  peaksD: PeakItem[] = [],
  baseFwhm = 0.28
): {
  indexedPeaks: IndexedPeakMatch[];
  meanShift: number;
  avgStrain: number;
  primaryPhasePurity: number;
  secondaryPhaseEst: number;
  extraInA: number[];
  missingInA: number[];
  strainRegression: StrainRegressionAnalysis;
} => {
  const defaultRegression: StrainRegressionAnalysis = {
    zeroShiftDeg: 0,
    specimenDisplacementCos: 0,
    trueMacrostrainPercent: 0,
    apparentStrainPercent: 0,
    regressionR2: 1,
    pairedPoints: []
  };

  if (!peaksA || !peaksB) {
    return {
      indexedPeaks: [],
      meanShift: 0,
      avgStrain: 0,
      primaryPhasePurity: 100,
      secondaryPhaseEst: 0,
      extraInA: [],
      missingInA: [],
      strainRegression: defaultRegression
    };
  }

  const indexedPeaks: IndexedPeakMatch[] = [];
  const tolerance = 0.65; // degrees 2Theta matching window
  const matchedBIndices = new Set<number>();
  const shifts: number[] = [];
  const apparentStrains: number[] = [];
  const extraInA: number[] = [];
  const regressionInputs: {
    twoTheta: number;
    tanTheta: number;
    cosTheta: number;
    shiftDeg: number;
    peakStrainPercent: number;
    weight: number;
    hkl: string;
    phaseOrigin: string;
  }[] = [];

  peaksA.forEach((pA, idx) => {
    let bestMatchBIdx = -1;
    let minDiffB = Infinity;

    peaksB.forEach((pB, bIdx) => {
      const diff = Math.abs(pA.twoTheta - pB.twoTheta);
      if (diff <= tolerance && diff < minDiffB) {
        minDiffB = diff;
        bestMatchBIdx = bIdx;
      }
    });

    // Also check Phase C and Phase D if not matched to B (or if much closer to C/D)
    let bestMatchPhase: 'Phase B' | 'Phase C' | 'Phase D' | 'Unknown' = 'Unknown';
    let matchedRefPeak: PeakItem | null = null;

    if (bestMatchBIdx !== -1) {
      bestMatchPhase = 'Phase B';
      matchedRefPeak = peaksB[bestMatchBIdx];
    }

    let minDiffRef = minDiffB;
    peaksC.forEach((pC) => {
      const diff = Math.abs(pA.twoTheta - pC.twoTheta);
      if (diff <= tolerance && diff < minDiffRef - 0.08) {
        minDiffRef = diff;
        bestMatchPhase = 'Phase C';
        matchedRefPeak = pC;
      }
    });

    peaksD.forEach((pD) => {
      const diff = Math.abs(pA.twoTheta - pD.twoTheta);
      if (diff <= tolerance && diff < minDiffRef - 0.08) {
        minDiffRef = diff;
        bestMatchPhase = 'Phase D';
        matchedRefPeak = pD;
      }
    });

    if (bestMatchPhase === 'Phase B' && bestMatchBIdx !== -1) {
      matchedBIndices.add(bestMatchBIdx);
    }

    const thetaRadA = (pA.twoTheta / 2) * (Math.PI / 180);
    const dValA = thetaRadA > 0 ? CU_KA_WAVELENGTH / (2 * Math.sin(thetaRadA)) : 0;
    const dSpacingA = dValA > 0 ? dValA.toFixed(4) : '-';

    // Estimate Scherrer Crystallite Size D = (K * lambda) / (beta_rad * cos(theta)) in nm (1 Angstrom = 0.1 nm)
    const fwhmRad = ((pA.fwhm || baseFwhm) * Math.PI) / 180;
    const scherrerSizeNm = (fwhmRad > 0 && Math.cos(thetaRadA) > 0.05)
      ? Number(((0.9 * CU_KA_WAVELENGTH) / (fwhmRad * Math.cos(thetaRadA)) * 0.1).toFixed(1))
      : null;

    if (matchedRefPeak) {
      const shift = Number((pA.twoTheta - matchedRefPeak.twoTheta).toFixed(3));
      const thetaRadRef = (matchedRefPeak.twoTheta / 2) * (Math.PI / 180);
      const dValRef = thetaRadRef > 0 ? CU_KA_WAVELENGTH / (2 * Math.sin(thetaRadRef)) : 0;
      const dSpacingB = dValRef > 0 ? dValRef.toFixed(4) : '-';

      // Exact interplanar strain epsilon = (d_exp - d_ref) / d_ref * 100%
      const peakStrain = dValRef > 0 ? Number((((dValA - dValRef) / dValRef) * 100).toFixed(4)) : 0;

      if (bestMatchPhase === 'Phase B') {
        shifts.push(shift);
        apparentStrains.push(peakStrain);
        regressionInputs.push({
          twoTheta: pA.twoTheta,
          tanTheta: Math.tan(thetaRadRef),
          cosTheta: Math.cos(thetaRadRef),
          shiftDeg: shift,
          peakStrainPercent: peakStrain,
          weight: Math.max(0.1, pA.intensity / 100),
          hkl: pA.hkl || matchedRefPeak.hkl || `Peak #${idx + 1}`,
          phaseOrigin: bestMatchPhase
        });
      }

      const isShifted = Math.abs(shift) > 0.05;
      indexedPeaks.push({
        id: idx + 1,
        twoThetaA: pA.twoTheta,
        twoThetaB: matchedRefPeak.twoTheta,
        hklA: pA.hkl,
        hklB: matchedRefPeak.hkl,
        dSpacingA,
        dSpacingB,
        shift,
        intensityA: pA.intensity,
        intensityB: matchedRefPeak.intensity,
        status: isShifted ? 'shifted' : 'matched',
        phaseOrigin: bestMatchPhase,
        strainPercent: peakStrain,
        scherrerSizeNm
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
        phaseOrigin: 'Unknown',
        strainPercent: null,
        scherrerSizeNm
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
        phaseOrigin: 'Phase B',
        strainPercent: null,
        scherrerSizeNm: null
      });
    }
  });

  const meanShift = shifts.length > 0 ? Number((shifts.reduce((a, b) => a + b, 0) / shifts.length).toFixed(3)) : 0;
  const apparentStrainPercent = apparentStrains.length > 0
    ? Number((apparentStrains.reduce((a, b) => a + b, 0) / apparentStrains.length).toFixed(4))
    : 0;

  // Perform Weighted Linear Regression of Shift(2Theta) vs tan(Theta) to separate Zero-Shift from True Lattice Strain:
  // Model: Delta(2Theta)_deg = Delta(2Theta)_0 + slope * tan(theta)
  // Where true macrostrain epsilon = -slope / (2 * (180 / pi))
  let zeroShiftDeg = meanShift;
  let trueMacrostrainPercent = apparentStrainPercent;
  let specimenDisplacementCos = 0;
  let regressionR2 = 1.0;

  if (regressionInputs.length >= 2) {
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0, scos = 0, scosy = 0, scos2 = 0;
    for (const pt of regressionInputs) {
      const w = pt.weight;
      const x = pt.tanTheta;
      const y = pt.shiftDeg;
      sw += w;
      sx += w * x;
      sy += w * y;
      sxx += w * x * x;
      sxy += w * x * y;
      scos += w * pt.cosTheta;
      scosy += w * pt.cosTheta * y;
      scos2 += w * pt.cosTheta * pt.cosTheta;
    }

    const det = sw * sxx - sx * sx;
    if (Math.abs(det) > 1e-7) {
      const intercept = (sxx * sy - sx * sxy) / det;
      const slope = (sw * sxy - sx * sy) / det;
      zeroShiftDeg = Number(intercept.toFixed(4));
      // Since Delta(2Theta)_deg = -2 * epsilon * (180/pi) * tan(theta), epsilon(%) = (-slope * pi / 360) * 100
      trueMacrostrainPercent = Number(((-slope * Math.PI) / 3.6).toFixed(4));

      // Estimate specimen displacement coefficient on residuals after strain removal
      const detCos = sw * scos2 - scos * scos;
      if (Math.abs(detCos) > 1e-7) {
        specimenDisplacementCos = Number((((sw * scosy - scos * sy) / detCos) * 0.25).toFixed(4));
      }

      const yMean = sy / sw;
      let ssTot = 0;
      let ssRes = 0;
      for (const pt of regressionInputs) {
        const yPred = intercept + slope * pt.tanTheta;
        ssTot += pt.weight * Math.pow(pt.shiftDeg - yMean, 2);
        ssRes += pt.weight * Math.pow(pt.shiftDeg - yPred, 2);
      }
      regressionR2 = ssTot > 1e-8 ? Number(Math.max(0, Math.min(1, 1 - ssRes / ssTot)).toFixed(3)) : 1.0;
    }
  }

  const slopeDeg = -2 * (trueMacrostrainPercent / 100) * (180 / Math.PI);
  const pairedPoints: StrainRegressionPoint[] = regressionInputs.map(pt => ({
    twoTheta: Number(pt.twoTheta.toFixed(2)),
    tanTheta: Number(pt.tanTheta.toFixed(4)),
    cosTheta: Number(pt.cosTheta.toFixed(4)),
    observedShift: Number(pt.shiftDeg.toFixed(4)),
    modeledShift: Number((zeroShiftDeg + slopeDeg * pt.tanTheta).toFixed(4)),
    strainOnlyShift: Number((slopeDeg * pt.tanTheta).toFixed(4)),
    peakStrainPercent: Number(pt.peakStrainPercent.toFixed(4)),
    hkl: pt.hkl,
    phaseOrigin: pt.phaseOrigin
  }));

  const avgStrain = Number(apparentStrainPercent.toFixed(3));

  const totalExpIntensity = peaksA.reduce((sum, p) => sum + p.intensity, 0);
  const matchedBIntensity = indexedPeaks
    .filter(p => (p.status === 'matched' || p.status === 'shifted') && p.phaseOrigin === 'Phase B')
    .reduce((sum, p) => sum + p.intensityA, 0);
  
  const primaryPhasePurity = totalExpIntensity > 0 ? Number(((matchedBIntensity / totalExpIntensity) * 100).toFixed(1)) : 100;
  const secondaryPhaseEst = Number(Math.max(0, 100 - primaryPhasePurity).toFixed(1));

  return {
    indexedPeaks: indexedPeaks.sort((a, b) => (a.twoThetaA || a.twoThetaB || 0) - (b.twoThetaA || b.twoThetaB || 0)),
    meanShift,
    avgStrain,
    primaryPhasePurity,
    secondaryPhaseEst,
    extraInA,
    missingInA,
    strainRegression: {
      zeroShiftDeg,
      specimenDisplacementCos,
      trueMacrostrainPercent,
      apparentStrainPercent,
      regressionR2,
      pairedPoints
    }
  };
};

/**
 * Solves Analytical Non-Negative Least Squares (NNLS) multi-phase fractions
 * and converts spectral scale factors into RIR (I/Ic) semi-quantitative weight percentages:
 * wt%_k = (S_k / RIR_k) / sum_j(S_j / RIR_j) * 100
 */
export const solveMultiPhaseFractions = (
  arrA: number[], 
  arrB: number[], 
  arrC: number[] = [], 
  arrD: number[] = [],
  rirOptions: { rirB?: number; rirC?: number; rirD?: number } = {}
): PhaseQuantificationResult => {
  const rirB = Math.max(0.1, rirOptions.rirB ?? 1.8);
  const rirC = Math.max(0.1, rirOptions.rirC ?? 1.5);
  const rirD = Math.max(0.1, rirOptions.rirD ?? 1.2);

  if (arrA.length === 0 || arrB.length === 0) {
    return {
      fracB: 100, fracC: 0, fracD: 0,
      wtPercentB: 100, wtPercentC: 0, wtPercentD: 0,
      scaleFactorB: 1, scaleFactorC: 0, scaleFactorD: 0,
      rirB, rirC, rirD,
      residualNorm: 0
    };
  }

  const hasC = arrC.length === arrA.length && arrC.some(v => v > 0);
  const hasD = arrD.length === arrA.length && arrD.some(v => v > 0);

  if (!hasC && !hasD) {
    // 1-phase analytical least squares scale factor
    let dotAB = 0, dotBB = 0, resSq = 0;
    for (let i = 0; i < arrA.length; i++) {
      dotAB += arrA[i] * arrB[i];
      dotBB += arrB[i] * arrB[i];
    }
    const sB = dotBB > 1e-6 ? Math.max(0.01, dotAB / dotBB) : 1.0;
    for (let i = 0; i < arrA.length; i++) {
      resSq += Math.pow(arrA[i] - sB * arrB[i], 2);
    }
    return {
      fracB: 100, fracC: 0, fracD: 0,
      wtPercentB: 100, wtPercentC: 0, wtPercentD: 0,
      scaleFactorB: Number(sB.toFixed(3)),
      scaleFactorC: 0,
      scaleFactorD: 0,
      rirB, rirC, rirD,
      residualNorm: Number(Math.sqrt(resSq / arrA.length).toFixed(2))
    };
  }

  // Construct Normal Equations Gram Matrix G = X^T X and RHS b = X^T y
  const cols: number[][] = [arrB];
  if (hasC) cols.push(arrC);
  if (hasD) cols.push(arrD);
  const K = cols.length;

  const G: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  const rhs: number[] = new Array(K).fill(0);

  for (let i = 0; i < arrA.length; i++) {
    const y = arrA[i];
    for (let r = 0; r < K; r++) {
      rhs[r] += cols[r][i] * y;
      for (let c = r; c < K; c++) {
        G[r][c] += cols[r][i] * cols[c][i];
      }
    }
  }
  for (let r = 0; r < K; r++) {
    for (let c = 0; c < r; c++) {
      G[r][c] = G[c][r];
    }
    // Small Tikhonov regularization for numerical stability
    G[r][r] += 1e-6;
  }

  // Projected Gauss-Seidel / Coordinate Descent NNLS solver (converges to exact KKT optimum for K <= 3)
  const weights = new Array(K).fill(1 / K);
  for (let iter = 0; iter < 120; iter++) {
    let maxChange = 0;
    for (let k = 0; k < K; k++) {
      let sigma = 0;
      for (let j = 0; j < K; j++) {
        if (j !== k) sigma += G[k][j] * weights[j];
      }
      const nextW = Math.max(0, (rhs[k] - sigma) / G[k][k]);
      maxChange = Math.max(maxChange, Math.abs(nextW - weights[k]));
      weights[k] = nextW;
    }
    if (maxChange < 1e-7) break;
  }

  const sB = weights[0] || 0;
  const sC = hasC ? (weights[1] || 0) : 0;
  const sD = hasD ? (weights[hasC ? 2 : 1] || 0) : 0;

  // Compute integrated spectral contribution of each phase
  const intB = arrB.reduce((s, v) => s + v, 0) * sB;
  const intC = hasC ? arrC.reduce((s, v) => s + v, 0) * sC : 0;
  const intD = hasD ? arrD.reduce((s, v) => s + v, 0) * sD : 0;
  const totalInt = intB + intC + intD;

  const fracB = totalInt > 1e-6 ? Number(((intB / totalInt) * 100).toFixed(1)) : 100;
  const fracC = totalInt > 1e-6 ? Number(((intC / totalInt) * 100).toFixed(1)) : 0;
  const fracD = totalInt > 1e-6 ? Number(Math.max(0, 100 - fracB - fracC).toFixed(1)) : 0;

  // Convert to RIR (Reference Intensity Ratio I/Ic) semi-quantitative weight percentages:
  // W_k = (I_k / RIR_k) / sum_j (I_j / RIR_j)
  const rirWeightedB = intB / rirB;
  const rirWeightedC = hasC ? intC / rirC : 0;
  const rirWeightedD = hasD ? intD / rirD : 0;
  const totalRirWeighted = rirWeightedB + rirWeightedC + rirWeightedD;

  const wtPercentB = totalRirWeighted > 1e-6 ? Number(((rirWeightedB / totalRirWeighted) * 100).toFixed(1)) : 100;
  const wtPercentC = totalRirWeighted > 1e-6 ? Number(((rirWeightedC / totalRirWeighted) * 100).toFixed(1)) : 0;
  const wtPercentD = totalRirWeighted > 1e-6 ? Number(Math.max(0, 100 - wtPercentB - wtPercentC).toFixed(1)) : 0;

  let resSq = 0;
  for (let i = 0; i < arrA.length; i++) {
    const calc = sB * arrB[i] + (hasC ? sC * arrC[i] : 0) + (hasD ? sD * arrD[i] : 0);
    resSq += Math.pow(arrA[i] - calc, 2);
  }

  return {
    fracB,
    fracC,
    fracD,
    wtPercentB,
    wtPercentC,
    wtPercentD,
    scaleFactorB: Number(sB.toFixed(3)),
    scaleFactorC: Number(sC.toFixed(3)),
    scaleFactorD: Number(sD.toFixed(3)),
    rirB,
    rirC,
    rirD,
    residualNorm: Number(Math.sqrt(resSq / arrA.length).toFixed(2))
  };
};

/**
 * Hanawalt 3-strongest peak + Fink Figure-of-Merit search-match cross-correlation
 */
export const performDatabaseSearchMatch = (
  targetPeaks: PeakItem[], 
  materialsDb: any[], 
  maxResults = 25
): SearchMatchCandidate[] => {
  if (!targetPeaks || targetPeaks.length === 0 || !materialsDb) return [];

  const sortedByIntensity = [...targetPeaks].sort((a, b) => b.intensity - a.intensity);
  const topTarget = sortedByIntensity.slice(0, 10);
  const hanawaltThree = sortedByIntensity.slice(0, 3);
  const candidates: SearchMatchCandidate[] = [];

  for (const mat of materialsDb) {
    const refPeaks = extractMaterialPeaks(mat);
    if (refPeaks.length === 0) continue;

    const refSortedByInt = [...refPeaks].sort((a, b) => b.intensity - a.intensity);
    const refHanawalt = refSortedByInt.slice(0, 3);

    let matchedCount = 0;
    let weightedSimilarity = 0;
    let totalWeight = 0;
    let deltaSum = 0;

    for (const tPeak of topTarget) {
      let closestDiff = Infinity;
      let closestRef: PeakItem | null = null;
      for (const rPeak of refPeaks) {
        const diff = Math.abs(tPeak.twoTheta - rPeak.twoTheta);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestRef = rPeak;
        }
      }

      const w = Math.max(0.15, tPeak.intensity / 100);
      totalWeight += w;

      if (closestDiff <= 0.65 && closestRef) {
        matchedCount++;
        deltaSum += closestDiff;
        const posSim = Math.max(0, 1 - closestDiff / 0.65);
        const intSim = 1 - Math.min(1, Math.abs(tPeak.intensity - closestRef.intensity) / 110);
        weightedSimilarity += w * (0.72 * posSim + 0.28 * intSim);
      }
    }

    // Check Hanawalt 3 strongest peaks match
    let hanawaltHits = 0;
    for (const rStrong of refHanawalt) {
      const hit = hanawaltThree.some(t => Math.abs(t.twoTheta - rStrong.twoTheta) <= 0.6);
      if (hit) hanawaltHits++;
    }
    const hanawaltScore = (hanawaltHits / Math.max(1, refHanawalt.length)) * 100;

    const matchFraction = matchedCount / Math.max(1, Math.min(topTarget.length, refPeaks.length));
    const profileTerm = totalWeight > 0 ? (weightedSimilarity / totalWeight) * 100 : 0;
    const score = Math.max(
      0,
      Math.min(100, profileTerm * 0.55 + matchFraction * 30 + hanawaltScore * 0.15)
    );

    if (score > 12 || matchedCount >= 1) {
      candidates.push({
        material: mat,
        pearsonR: Number(score.toFixed(1)),
        rP: Number(Math.max(4.5, (100 - score) * 0.75).toFixed(1)),
        fom: Number(score.toFixed(1)),
        matchedPeaksCount: matchedCount,
        totalPeaksCount: refPeaks.length,
        hanawaltScore: Number(hanawaltScore.toFixed(0)),
        estimatedRir: estimateMaterialRir(mat),
        meanDeltaTwoTheta: matchedCount > 0 ? Number((deltaSum / matchedCount).toFixed(3)) : 0
      });
    }
  }

  return candidates.sort((a, b) => b.pearsonR - a.pearsonR).slice(0, maxResults);
};

/**
 * Full-Profile & Peak Cross-Correlation 2Theta shift & scale optimization engine
 */
export const optimizeAlignmentAndScale = (
  peaksA: PeakItem[],
  peaksB: PeakItem[]
): { optimalShift: number; optimalScale: number; bestCorrelation: number } => {
  if (!peaksA.length || !peaksB.length) {
    return { optimalShift: 0, optimalScale: 1.0, bestCorrelation: 0 };
  }

  const topA = [...peaksA].sort((a, b) => b.intensity - a.intensity).slice(0, 8);
  const topB = [...peaksB].sort((a, b) => b.intensity - a.intensity).slice(0, 8);

  let coarseShift = 0;
  let maxScore = -Infinity;

  // Stage 1: Coarse sweep from -2.00 to +2.00 in 0.02 deg steps
  for (let shift = -2.00; shift <= 2.00; shift += 0.02) {
    let score = 0;
    for (const pa of topA) {
      for (const pb of topB) {
        const diff = Math.abs(pa.twoTheta - (pb.twoTheta + shift));
        if (diff <= 0.5) {
          // Gaussian kernel overlap between peak centroids
          const kernel = Math.exp(-Math.pow(diff / 0.18, 2));
          score += kernel * Math.sqrt(pa.intensity * pb.intensity);
        }
      }
    }
    if (score > maxScore) {
      maxScore = score;
      coarseShift = shift;
    }
  }

  // Stage 2: Fine parabolic refinement in [coarseShift - 0.04, coarseShift + 0.04] at 0.005 deg resolution
  let bestShift = coarseShift;
  for (let shift = coarseShift - 0.04; shift <= coarseShift + 0.04; shift += 0.005) {
    let score = 0;
    for (const pa of topA) {
      for (const pb of topB) {
        const diff = Math.abs(pa.twoTheta - (pb.twoTheta + shift));
        if (diff <= 0.45) {
          const kernel = Math.exp(-Math.pow(diff / 0.15, 2));
          score += kernel * Math.sqrt(pa.intensity * pb.intensity);
        }
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestShift = shift;
    }
  }
  bestShift = Number(bestShift.toFixed(2));

  // Analytical least-squares scale factor s = sum(I_A * I_B) / sum(I_B^2) across matched pairs
  let numAB = 0;
  let denBB = 0;
  const maxA = Math.max(...peaksA.map(p => p.intensity), 1);
  const maxB = Math.max(...peaksB.map(p => p.intensity), 1);

  for (const pa of topA) {
    const normA = (pa.intensity / maxA) * 100;
    const matchB = topB.find(pb => Math.abs(pa.twoTheta - (pb.twoTheta + bestShift)) < 0.35);
    if (matchB) {
      const normB = (matchB.intensity / maxB) * 100;
      numAB += normA * normB;
      denBB += normB * normB;
    }
  }

  let bestScale = denBB > 1e-6 ? Number((numAB / denBB).toFixed(2)) : 1.0;
  bestScale = Math.max(0.2, Math.min(3.0, bestScale));

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
    'Q_invAngstrom',
    `Intensity_A_${nameA.replace(/[^a-zA-Z0-9]/g, '_')}`,
    `Intensity_B_${nameB.replace(/[^a-zA-Z0-9]/g, '_')}`,
    nameC ? `Intensity_C_${nameC.replace(/[^a-zA-Z0-9]/g, '_')}` : null,
    nameD ? `Intensity_D_${nameD.replace(/[^a-zA-Z0-9]/g, '_')}` : null,
    'Intensity_TotalModel',
    'Difference_Residual',
    'Caglioti_FWHM_deg',
    'Deriv_A',
    'Deriv_B'
  ].filter(Boolean).join(',');

  const rows = points.map(pt => {
    const thetaRad = (pt.twoTheta / 2) * (Math.PI / 180);
    const dVal = thetaRad > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4) : '';
    const qVal = thetaRad > 0 ? ((4 * Math.PI * Math.sin(thetaRad)) / CU_KA_WAVELENGTH).toFixed(4) : '';
    
    const rowVals = [
      pt.twoTheta.toFixed(2),
      dVal,
      qVal,
      pt.intensityA.toFixed(2),
      pt.intensityB.toFixed(2),
      nameC ? (pt.intensityC !== undefined ? pt.intensityC.toFixed(2) : '') : null,
      nameD ? (pt.intensityD !== undefined ? pt.intensityD.toFixed(2) : '') : null,
      pt.intensityTotalModel?.toFixed(2) ?? '',
      pt.difference.toFixed(2),
      pt.cagliotiFwhm !== undefined ? pt.cagliotiFwhm.toFixed(4) : '',
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
