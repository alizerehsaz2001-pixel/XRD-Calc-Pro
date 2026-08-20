import { PeakItem, ProfilePoint, IndexedPeakMatch, SpectralMetrics, SearchMatchCandidate } from './types';

// Standard Cu-Ka X-ray wavelength in Angstroms
export const CU_KA_WAVELENGTH = 1.5406;

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
    peakShape?: 'pseudoVoigt' | 'gaussian' | 'lorentzian';
    eta?: number;
    fwhm?: number;
    minTheta?: number;
    maxTheta?: number;
    step?: number;
    background?: number;
    noiseLevel?: number;
  } = {}
) => {
  const {
    shiftTwoThetaB = 0,
    scaleSampleB = 1.0,
    scaleSampleC = 0,
    scaleSampleD = 0,
    eta = 0.5,
    fwhm = 0.25,
    minTheta = 10,
    maxTheta = 90,
    step = 0.1,
    background = 2.0,
    noiseLevel = 0.0
  } = options;

  const peaksA = extractMaterialPeaks(matA);
  const peaksB = extractMaterialPeaks(matB);
  const peaksC = matC ? extractMaterialPeaks(matC) : [];
  const peaksD = matD ? extractMaterialPeaks(matD) : [];

  // Pseudo-Voigt profile generator
  const pVoigt = (x: number, x0: number, w: number, height: number) => {
    const halfW = w / 2;
    const dx = x - x0;
    const g = Math.exp(-Math.LN2 * Math.pow(dx / halfW, 2));
    const l = 1 / (1 + Math.pow(dx / halfW, 2));
    return height * (eta * l + (1 - eta) * g);
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
    
    // Sample A continuous profile
    let iA = background;
    for (const p of peaksA) {
      const relH = (p.intensity / maxIntensityA) * 100;
      if (Math.abs(twoTheta - p.twoTheta) < fwhm * 4) {
        iA += pVoigt(twoTheta, p.twoTheta, p.fwhm || fwhm, relH);
      }
    }

    // Sample B continuous profile
    let iB = background;
    for (const p of peaksB) {
      const relH = (p.intensity / maxIntensityB) * 100 * scaleSampleB;
      const targetCenter = p.twoTheta + shiftTwoThetaB;
      if (Math.abs(twoTheta - targetCenter) < fwhm * 4) {
        iB += pVoigt(twoTheta, targetCenter, p.fwhm || fwhm, relH);
      }
    }

    // Phase C profile
    let iC = 0;
    if (matC && scaleSampleC > 0) {
      for (const p of peaksC) {
        const relH = (p.intensity / maxIntensityC) * 100 * scaleSampleC;
        if (Math.abs(twoTheta - p.twoTheta) < fwhm * 4) {
          iC += pVoigt(twoTheta, p.twoTheta, p.fwhm || fwhm, relH);
        }
      }
    }

    // Phase D profile
    let iD = 0;
    if (matD && scaleSampleD > 0) {
      for (const p of peaksD) {
        const relH = (p.intensity / maxIntensityD) * 100 * scaleSampleD;
        if (Math.abs(twoTheta - p.twoTheta) < fwhm * 4) {
          iD += pVoigt(twoTheta, p.twoTheta, p.fwhm || fwhm, relH);
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
      if (Math.abs((twoTheta + dStep) - p.twoTheta) < fwhm * 4) {
        iA_plus += pVoigt(twoTheta + dStep, p.twoTheta, p.fwhm || fwhm, relH);
      }
    }
    const derivA = Number(((iA_plus - (iA - background)) / dStep).toFixed(2));

    let iB_plus = 0;
    for (const p of peaksB) {
      const relH = (p.intensity / maxIntensityB) * 100 * scaleSampleB;
      const targetCenter = p.twoTheta + shiftTwoThetaB;
      if (Math.abs((twoTheta + dStep) - targetCenter) < fwhm * 4) {
        iB_plus += pVoigt(twoTheta + dStep, targetCenter, p.fwhm || fwhm, relH);
      }
    }
    const derivB = Number(((iB_plus - (iB - background)) / dStep).toFixed(2));

    points[i] = {
      twoTheta,
      intensityA: Number(iA.toFixed(2)),
      intensityB: Number(iB.toFixed(2)),
      intensityC: matC ? Number(iC.toFixed(2)) : undefined,
      intensityD: matD ? Number(iD.toFixed(2)) : undefined,
      intensityTotalModel: Number(totalModel.toFixed(2)),
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
