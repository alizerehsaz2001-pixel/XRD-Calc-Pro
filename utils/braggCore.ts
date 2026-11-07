import { BraggResult } from '../types';

export const calculateBragg = (wavelength: number, twoTheta: number): BraggResult | null => {
  if (wavelength <= 0 || twoTheta <= 0 || twoTheta >= 180) return null;
  const thetaRad = (twoTheta / 2) * (Math.PI / 180);
  const sinTheta = Math.sin(thetaRad);
  if (sinTheta <= 1e-9) return null;
  const dSpacing = wavelength / (2 * sinTheta);
  const qVector = (4 * Math.PI * sinTheta) / wavelength;
  const sinThetaOverLambda = sinTheta / wavelength;
  return { twoTheta, dSpacing, qVector, sinThetaOverLambda };
};

export function parseSingleHKL(hklStr: string): { h: number; k: number; l: number } | null {
  const cleaned = (hklStr || '').trim();
  if (!cleaned) return null;

  // Try to find 3 separate numbers (positive or negative)
  const parts = cleaned.split(/[\s,]+/);
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const k = parseInt(parts[1], 10);
    const l = parseInt(parts[2], 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      return { h, k, l };
    }
  }

  // Bracket/clean symbols: (111) -> 111, {220} -> 220, [311] -> 311
  const bracketCleaned = cleaned.replace(/[(){}[\]]/g, '');

  // 3-digit number (e.g., 111, 220, 311)
  const match3 = bracketCleaned.match(/^([+-]?\d)([+-]?\d)([+-]?\d)$/);
  if (match3) {
    const h = parseInt(match3[1], 10);
    const k = parseInt(match3[2], 10);
    const l = parseInt(match3[3], 10);
    return { h, k, l };
  }

  return null;
}

export function validateHKLAgainstCrystalSystem(
  h: number,
  k: number,
  l: number,
  system: string
): { valid: boolean; reason?: string } {
  // 1. (0, 0, 0) is physically invalid for a diffracted plane
  if (h === 0 && k === 0 && l === 0) {
    return {
      valid: false,
      reason: "(0, 0, 0) is physically invalid (direct beam, not a diffracted plane)."
    };
  }

  const sys = system.toUpperCase();

  // 2. Body-Centered (BCC, Tetragonal_I, or I-centered)
  // Rule: h + k + l must be even
  if (sys.includes("BCC") || sys.includes("BODY") || sys.includes("TETRAGONAL_I") || sys.includes("I-CENTERED")) {
    const sum = h + k + l;
    if (Math.abs(sum) % 2 !== 0) {
      return {
        valid: false,
        reason: `h + k + l must be even for Body-Centered (BCC/I) lattices due to destructive interference (got ${h}+${k}+${l}=${sum}).`
      };
    }
  }

  // 3. Face-Centered (FCC, Orthorhombic_F, or F-centered)
  // Rule: h, k, l must be all even or all odd
  if (sys.includes("FCC") || sys.includes("FACE") || sys.includes("F-CENTERED") || sys.includes("ORTHORHOMBIC_F")) {
    const hOdd = Math.abs(h) % 2 !== 0;
    const kOdd = Math.abs(k) % 2 !== 0;
    const lOdd = Math.abs(l) % 2 !== 0;
    if (!((hOdd && kOdd && lOdd) || (!hOdd && !kOdd && !lOdd))) {
      return {
        valid: false,
        reason: `h, k, l must be unmixed (all even or all odd) for Face-Centered (FCC/F) lattices (got ${h},${k},${l}).`
      };
    }
  }

  // 4. Diamond Cubic
  // Rule: FCC rules + if all even, h+k+l must be divisible by 4
  if (sys.includes("DIAMOND") || sys === "DC") {
    const hOdd = Math.abs(h) % 2 !== 0;
    const kOdd = Math.abs(k) % 2 !== 0;
    const lOdd = Math.abs(l) % 2 !== 0;
    if (!((hOdd && kOdd && lOdd) || (!hOdd && !kOdd && !lOdd))) {
      return {
        valid: false,
        reason: `h, k, l must be unmixed (all even or all odd) for Diamond lattices (got ${h},${k},${l}).`
      };
    }
    if (!hOdd && !kOdd && !lOdd) {
      const sum = h + k + l;
      if (Math.abs(sum) % 4 !== 0) {
        return {
          valid: false,
          reason: `For Diamond Cubic, if even, h + k + l must be divisible by 4 (got sum ${sum}; e.g., 200, 222 are forbidden).`
        };
      }
    }
  }

  // 5. Hexagonal / HCP
  // Rule: Forbidden if l is odd AND (h + 2k) is divisible by 3
  if (sys.includes("HEXAGONAL") || sys.includes("HCP")) {
    const h2k = h + 2 * k;
    if (Math.abs(l) % 2 !== 0 && Math.abs(h2k) % 3 === 0) {
      return {
        valid: false,
        reason: `Forbidden for Hexagonal/HCP structure because l is odd (${l}) and h + 2k is a multiple of 3 (${h}+2*${k}=${h2k}).`
      };
    }
  }

  // 6. Base-Centered (Orthorhombic_C / C-centered)
  // Rule: h + k must be even
  if (sys.includes("ORTHORHOMBIC_C") || sys.includes("C-CENTERED") || sys.includes("BASE")) {
    const sum = h + k;
    if (Math.abs(sum) % 2 !== 0) {
      return {
        valid: false,
        reason: `h + k must be even for Base-Centered (C) lattices (got ${h}+${k}=${sum}).`
      };
    }
  }

  return { valid: true };
}
