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
    return { twoTheta, intensity, hkl };
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
export const extractPeaksFromRawPoints = (points: { twoTheta: number; intensity: number }[], maxPeaks = 25): PeakItem[] => {
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
    if (curr.intensity < 5) continue; // Noise cutoff

    let isPeak = true;
    for (let j = i - window; j <= i + window; j++) {
      if (j !== i && normalized[j].intensity >= curr.intensity) {
        isPeak = false;
        break;
      }
    }

    if (isPeak) {
      // Sub-bin centroid quadratic interpolation
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

      peaks.push({
        twoTheta: Number(refinedTheta.toFixed(3)),
        intensity: Number(curr.intensity.toFixed(1))
      });
    }
  }

  // Sort descending by intensity
  return peaks.sort((a, b) => b.intensity - a.intensity).slice(0, maxPeaks).sort((a, b) => a.twoTheta - b.twoTheta);
};

/**
 * Extracts PeakItem array from any material format
 */
export const extractMaterialPeaks = (material: any): PeakItem[] => {
  if (!material) return [];
  if (material.isUserSample) {
    return (material.results || []).map((r: any) => ({
      twoTheta: r.twoTheta,
      intensity: r.intensity !== undefined ? r.intensity : 100,
      hkl: r.hkl || ''
    }));
  }
  const pattern = material.pattern || '';
  return parseCustomPattern(pattern);
};

/**
 * Generates continuous synthetic diffraction profiles for Sample A, Sample B (with shift & scale),
 * and optional secondary phase Sample C.
 */
export const generateSynthesizedProfile = (
  matA: any,
  matB: any,
  matC: any = null,
  options: {
    shiftTwoThetaB?: number;
    scaleSampleB?: number;
    scaleSampleC?: number;
    peakShape?: 'pseudoVoigt' | 'gaussian' | 'lorentzian';
    eta?: number; // pseudo-Voigt mix parameter
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
    scaleSampleC = 0.0,
    eta = 0.5,
    fwhm = 0.14,
    minTheta = 10,
    maxTheta = 90,
    step = 0.1,
    background = 1.5,
    noiseLevel = 0.4
  } = options;

  const peaksA = extractMaterialPeaks(matA);
  const peaksB = extractMaterialPeaks(matB);
  const peaksC = matC ? extractMaterialPeaks(matC) : [];

  const rawPoints: ProfilePoint[] = [];
  const log2 = Math.log(2);

  // Peak shape evaluation helper
  const calcPeakContrib = (diffTheta: number, peakFwhm: number, peakInt: number) => {
    if (Math.abs(diffTheta) > 3.0) return 0;
    const hw = peakFwhm / 2;
    const ratio = diffTheta / hw;
    const g = Math.exp(-log2 * ratio * ratio);
    const l = 1 / (1 + ratio * ratio);
    return peakInt * (eta * l + (1 - eta) * g);
  };

  for (let x = minTheta; x <= maxTheta; x += step) {
    const twoTheta = Number(x.toFixed(2));
    let iA = background + (Math.random() - 0.5) * noiseLevel;
    let iB = background + (Math.random() - 0.5) * noiseLevel;
    let iC = 0;

    // Angle-dependent Caglioti broadening simulation: FWHM(2theta) = sqrt(U*tan^2 + V*tan + W)
    const thetaRad = (x / 2) * (Math.PI / 180);
    const tanTheta = Math.tan(thetaRad);
    const localFwhm = Math.sqrt(Math.max(0.005, 0.008 * tanTheta * tanTheta - 0.002 * tanTheta + fwhm * fwhm));

    peaksA.forEach(p => {
      iA += calcPeakContrib(x - p.twoTheta, localFwhm, p.intensity);
    });

    peaksB.forEach(p => {
      iB += calcPeakContrib(x - (p.twoTheta + shiftTwoThetaB), localFwhm, p.intensity * scaleSampleB);
    });

    if (peaksC.length > 0 && scaleSampleC > 0) {
      peaksC.forEach(p => {
        iC += calcPeakContrib(x - p.twoTheta, localFwhm, p.intensity * scaleSampleC);
      });
    }

    const finalA = Math.max(0, Math.min(120, iA));
    const finalB = Math.max(0, Math.min(120, iB));
    const finalC = Math.max(0, Math.min(120, iC));
    const finalTotalModel = Number((finalB + finalC).toFixed(1));

    const diff = Number((finalA - finalTotalModel).toFixed(1));
    const posDiff = Math.max(0, diff);
    const negDiff = Math.max(0, -diff);
    const toleranceUpper = Number((finalTotalModel + 4.0).toFixed(1));
    const toleranceLower = Number(Math.max(0, finalTotalModel - 4.0).toFixed(1));

    rawPoints.push({
      twoTheta,
      intensityA: Number(finalA.toFixed(1)),
      intensityB: Number(finalB.toFixed(1)),
      intensityC: Number(finalC.toFixed(1)),
      intensityTotalModel: finalTotalModel,
      mirroredB: Number((-finalB).toFixed(1)),
      difference: diff,
      posDiff: Number(posDiff.toFixed(1)),
      negDiff: Number(negDiff.toFixed(1)),
      toleranceUpper,
      toleranceLower,
      derivA: 0,
      derivB: 0
    });
  }

  // Calculate 1st derivatives dI/d2Theta with central difference
  const points = rawPoints.map((pt, i, arr) => {
    const prevA = arr[Math.max(0, i - 1)].intensityA;
    const nextA = arr[Math.min(arr.length - 1, i + 1)].intensityA;
    const derivA = Number(((nextA - prevA) / (2 * step)).toFixed(2));

    const prevB = arr[Math.max(0, i - 1)].intensityTotalModel || arr[Math.max(0, i - 1)].intensityB;
    const nextB = arr[Math.min(arr.length - 1, i + 1)].intensityTotalModel || arr[Math.min(arr.length - 1, i + 1)].intensityB;
    const derivB = Number(((nextB - prevB) / (2 * step)).toFixed(2));

    return {
      ...pt,
      derivA,
      derivB
    };
  });

  const peaksBWithShift = peaksB.map(p => ({
    twoTheta: Number((p.twoTheta + shiftTwoThetaB).toFixed(2)),
    intensity: Number((p.intensity * scaleSampleB).toFixed(1)),
    hkl: p.hkl
  }));

  const peaksCWithScale = peaksC.map(p => ({
    twoTheta: Number(p.twoTheta.toFixed(2)),
    intensity: Number((p.intensity * scaleSampleC).toFixed(1)),
    hkl: p.hkl
  }));

  return { points, peaksA, peaksB, peaksC, peaksBWithShift, peaksCWithScale };
};

/**
 * Calculates crystallographic goodness-of-fit metrics (Rp, Rwp, Pearson r, RMSD, chi^2)
 */
export const computeSpectralMetrics = (points: ProfilePoint[]): SpectralMetrics => {
  if (!points || points.length === 0) {
    return { rP: '0.00', rWP: '0.00', pearsonR: '0.0', maxDiff: '0.0', rmsd: '0.00', chiSquared: '0.00' };
  }

  let sumAbsDiff = 0;
  let sumObsA = 0;
  let sumSqDiff = 0;
  let sumSqObsA = 0;
  let sumA = 0;
  let sumB = 0;
  let maxDiff = 0;

  points.forEach(p => {
    const modelVal = p.intensityTotalModel !== undefined ? p.intensityTotalModel : p.intensityB;
    const diff = Math.abs(p.intensityA - modelVal);
    sumAbsDiff += diff;
    sumObsA += p.intensityA;
    sumSqDiff += diff * diff;
    sumSqObsA += p.intensityA * p.intensityA;
    sumA += p.intensityA;
    sumB += modelVal;
    if (diff > maxDiff) maxDiff = diff;
  });

  const n = points.length;
  const meanA = sumA / n;
  const meanB = sumB / n;

  let numPearson = 0;
  let denA = 0;
  let denB = 0;

  points.forEach(p => {
    const modelVal = p.intensityTotalModel !== undefined ? p.intensityTotalModel : p.intensityB;
    const dA = p.intensityA - meanA;
    const dB = modelVal - meanB;
    numPearson += dA * dB;
    denA += dA * dA;
    denB += dB * dB;
  });

  const rP = sumObsA > 0 ? (sumAbsDiff / sumObsA) * 100 : 0;
  const rWP = sumSqObsA > 0 ? Math.sqrt(sumSqDiff / sumSqObsA) * 100 : 0;
  const pearsonR = (denA > 0 && denB > 0) ? (numPearson / Math.sqrt(denA * denB)) * 100 : 0;
  const rmsd = Math.sqrt(sumSqDiff / n);
  const varianceEst = Math.max(0.5, meanA * 0.05);
  const chiSquared = sumSqDiff / (n * varianceEst);

  return {
    rP: rP.toFixed(2),
    rWP: rWP.toFixed(2),
    pearsonR: pearsonR.toFixed(1),
    maxDiff: maxDiff.toFixed(1),
    rmsd: rmsd.toFixed(2),
    chiSquared: chiSquared.toFixed(2)
  };
};

/**
 * Performs peak-by-peak indexing between Sample A and Reference Sample B
 */
export const computePeakIndexing = (peaksA: PeakItem[], peaksB: PeakItem[], lambda = CU_KA_WAVELENGTH) => {
  const shifts: { peak: number; shift: number; type: string; strain: number }[] = [];
  const missingInA: number[] = [];
  const extraInA: number[] = [];
  const indexedPeaks: IndexedPeakMatch[] = [];

  let peakId = 1;
  const matchedRefIndices = new Set<number>();

  peaksA.forEach(peakA => {
    const thetaRadA = (peakA.twoTheta / 2) * (Math.PI / 180);
    const dA = thetaRadA > 0 ? (lambda / (2 * Math.sin(thetaRadA))).toFixed(4) : '-';

    let closestRef: PeakItem | null = null;
    let closestIndex = -1;
    let minDistance = Infinity;

    peaksB.forEach((peakB, idx) => {
      const dist = Math.abs(peakB.twoTheta - peakA.twoTheta);
      if (dist < minDistance) {
        minDistance = dist;
        closestRef = peakB;
        closestIndex = idx;
      }
    });

    if (closestRef && minDistance <= 0.65) {
      matchedRefIndices.add(closestIndex);
      const shiftVal = peakA.twoTheta - closestRef.twoTheta;
      const thetaRadB = (closestRef.twoTheta / 2) * (Math.PI / 180);
      const dB = thetaRadB > 0 ? (lambda / (2 * Math.sin(thetaRadB))).toFixed(4) : '-';

      const deltaRad = shiftVal * (Math.PI / 180);
      const microstrain = -0.5 * deltaRad / Math.tan(thetaRadA || 0.1) * 100;

      if (Math.abs(shiftVal) >= 0.005) {
        shifts.push({
          peak: peakA.twoTheta,
          shift: shiftVal,
          type: shiftVal > 0 ? 'higher' : 'lower',
          strain: microstrain
        });
      }

      indexedPeaks.push({
        id: peakId++,
        twoThetaA: peakA.twoTheta,
        twoThetaB: closestRef.twoTheta,
        hklA: peakA.hkl,
        hklB: closestRef.hkl,
        dSpacingA: dA,
        dSpacingB: dB,
        shift: Number(shiftVal.toFixed(3)),
        intensityA: peakA.intensity,
        intensityB: closestRef.intensity,
        status: Math.abs(shiftVal) >= 0.02 ? 'shifted' : 'matched'
      });
    } else {
      extraInA.push(peakA.twoTheta);
      indexedPeaks.push({
        id: peakId++,
        twoThetaA: peakA.twoTheta,
        twoThetaB: null,
        hklA: peakA.hkl,
        dSpacingA: dA,
        dSpacingB: '-',
        shift: null,
        intensityA: peakA.intensity,
        intensityB: 0,
        status: 'extra'
      });
    }
  });

  peaksB.forEach((peakB, idx) => {
    if (!matchedRefIndices.has(idx)) {
      missingInA.push(peakB.twoTheta);
      const thetaRadB = (peakB.twoTheta / 2) * (Math.PI / 180);
      const dB = thetaRadB > 0 ? (lambda / (2 * Math.sin(thetaRadB))).toFixed(4) : '-';

      indexedPeaks.push({
        id: peakId++,
        twoThetaA: 0,
        twoThetaB: peakB.twoTheta,
        hklB: peakB.hkl,
        dSpacingA: '-',
        dSpacingB: dB,
        shift: null,
        intensityA: 0,
        intensityB: peakB.intensity,
        status: 'missing'
      });
    }
  });

  let meanShift = 0;
  let avgStrain = 0;
  if (shifts.length > 0) {
    meanShift = shifts.reduce((acc, s) => acc + s.shift, 0) / shifts.length;
    avgStrain = shifts.reduce((acc, s) => acc + s.strain, 0) / shifts.length;
  }

  let matchQuality: 'exact' | 'strained' | 'multiphase' | 'poor' = 'exact';
  if (extraInA.length > 1 && missingInA.length > 1) {
    matchQuality = 'poor';
  } else if (extraInA.length > 0) {
    matchQuality = 'multiphase';
  } else if (Math.abs(meanShift) > 0.03 || shifts.length > 0) {
    matchQuality = 'strained';
  }

  const sumIntA = peaksA.reduce((acc, p) => acc + p.intensity, 0);
  const matchedIntA = indexedPeaks
    .filter(p => p.status === 'matched' || p.status === 'shifted')
    .reduce((acc, p) => acc + p.intensityA, 0);

  const primaryPhasePurity = sumIntA > 0 ? Math.round((matchedIntA / sumIntA) * 100) : 100;
  const secondaryPhaseEst = Math.max(0, 100 - primaryPhasePurity);

  return {
    shifts,
    missingInA,
    extraInA,
    meanShift,
    avgStrain,
    matchQuality,
    indexedPeaks,
    primaryPhasePurity,
    secondaryPhaseEst
  };
};

/**
 * 2-Phase or 3-Phase Linear Least-Squares solver for relative phase fractions
 */
export const solveMultiPhaseFractions = (
  pointsA: number[],
  pointsB: number[],
  pointsC: number[] = []
): { fracB: number; fracC: number; scaleB: number; scaleC: number } => {
  const n = pointsA.length;
  if (n === 0 || pointsB.length === 0) {
    return { fracB: 100, fracC: 0, scaleB: 1, scaleC: 0 };
  }

  // 1-Phase fit
  if (pointsC.length === 0) {
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += pointsA[i] * pointsB[i];
      den += pointsB[i] * pointsB[i];
    }
    const scaleB = den > 0 ? Math.max(0, num / den) : 1.0;
    return { fracB: 100, fracC: 0, scaleB: Number(scaleB.toFixed(2)), scaleC: 0 };
  }

  // 2-Component Non-negative Least Squares: min || A - (wB*B + wC*C) ||^2
  let sBB = 0, sCC = 0, sBC = 0, sAB = 0, sAC = 0;
  for (let i = 0; i < n; i++) {
    const a = pointsA[i];
    const b = pointsB[i];
    const c = pointsC[i];
    sBB += b * b;
    sCC += c * c;
    sBC += b * c;
    sAB += a * b;
    sAC += a * c;
  }

  const det = sBB * sCC - sBC * sBC;
  let wB = 1.0;
  let wC = 0.0;

  if (Math.abs(det) > 1e-5) {
    wB = (sCC * sAB - sBC * sAC) / det;
    wC = (sBB * sAC - sBC * sAB) / det;
  }

  wB = Math.max(0, wB);
  wC = Math.max(0, wC);

  const total = wB + wC;
  const fracB = total > 0 ? Math.round((wB / total) * 100) : 100;
  const fracC = Math.max(0, 100 - fracB);

  return {
    fracB,
    fracC,
    scaleB: Number(wB.toFixed(2)),
    scaleC: Number(wC.toFixed(2))
  };
};

/**
 * Automated Database Search & Match cross-correlation algorithm against `MATERIAL_DB`
 */
export const performDatabaseSearchMatch = (
  targetPeaks: PeakItem[],
  materialsDb: any[],
  limit = 12
): SearchMatchCandidate[] => {
  if (!targetPeaks || targetPeaks.length === 0 || !materialsDb || materialsDb.length === 0) {
    return [];
  }

  const candidates: SearchMatchCandidate[] = [];

  materialsDb.forEach(mat => {
    const matPeaks = extractMaterialPeaks(mat);
    if (matPeaks.length === 0) return;

    let matchedCount = 0;
    let sumWeight = 0;
    let score = 0;

    targetPeaks.forEach(tp => {
      const closest = matPeaks.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - tp.twoTheta) < Math.abs(prev.twoTheta - tp.twoTheta) ? curr : prev;
      }, null);

      if (closest) {
        const delta = Math.abs(closest.twoTheta - tp.twoTheta);
        if (delta <= 0.5) {
          matchedCount++;
          // Gaussian proximity weight
          const posWeight = Math.exp(-0.5 * Math.pow(delta / 0.15, 2));
          // Intensity ratio similarity
          const intSim = 1 - Math.abs(tp.intensity - closest.intensity) / Math.max(100, tp.intensity, closest.intensity);
          const peakScore = posWeight * 0.7 + Math.max(0, intSim) * 0.3;
          score += peakScore * (tp.intensity / 100);
        }
      }
      sumWeight += (tp.intensity / 100);
    });

    const normalizedScore = sumWeight > 0 ? Math.min(100, (score / sumWeight) * 100) : 0;
    const peakCoverage = (matchedCount / Math.max(1, targetPeaks.length)) * 100;
    const finalScore = Number((normalizedScore * 0.7 + peakCoverage * 0.3).toFixed(1));

    if (finalScore >= 10 && matchedCount >= 1) {
      candidates.push({
        material: mat,
        pearsonR: finalScore,
        rP: Number(Math.max(2, 100 - finalScore).toFixed(1)),
        matchedPeaksCount: matchedCount,
        totalPeaksCount: targetPeaks.length
      });
    }
  });

  return candidates.sort((a, b) => b.pearsonR - a.pearsonR).slice(0, limit);
};
