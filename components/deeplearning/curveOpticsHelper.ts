// Crystallographic Peak Profile Shapes & Curve Rendering Helpers
export type ProfileShapeType = "pseudoVoigt" | "gaussian" | "lorentzian" | "pearsonVII";

/**
 * Computes normalized peak profile value at deltaT from peak center.
 * Supports Pseudo-Voigt, Pearson VII, Gaussian, and Lorentzian profiles with optional asymmetry.
 */
export function calculatePeakProfile(
  deltaT: number,
  fwhm: number,
  shape: ProfileShapeType = "pseudoVoigt",
  eta: number = 0.35,
  asymmetryFactor: number = 0,
  mExponent: number = 1.8
): number {
  const safeFwhm = Math.max(0.008, fwhm);
  const ratio = deltaT / safeFwhm;
  const ratioSq = ratio * ratio;

  // Gaussian: exp(-ln2 * (2 * deltaT / FWHM)^2)
  const g = Math.exp(-2.77258872 * ratioSq);
  
  // Lorentzian: 1 / (1 + 4 * (deltaT / FWHM)^2)
  const l = 1 / (1 + 4 * ratioSq);

  if (shape === "gaussian") return g;
  if (shape === "lorentzian") return l;
  
  if (shape === "pearsonVII") {
    // Pearson VII profile: [1 + 4*(2^(1/m) - 1) * (delta/fwhm)^2]^(-m)
    const safeM = Math.max(0.6, mExponent);
    const factor = Math.pow(2, 1 / safeM) - 1;
    let val = Math.pow(1 + 4 * factor * ratioSq, -safeM);
    if (asymmetryFactor !== 0 && deltaT < 0) {
      val *= Math.exp(-asymmetryFactor * Math.abs(deltaT));
    }
    return val;
  }

  // Pseudo-Voigt
  let pv = eta * l + (1 - eta) * g;
  if (asymmetryFactor !== 0 && deltaT < 0) {
    pv *= (1 + asymmetryFactor * Math.abs(ratio));
  }
  return pv;
}

/**
 * Approximates Cu-Kα2 position given a Kα1 position (in 2θ).
 * Cu Kα1 = 1.54060 Å, Kα2 = 1.54439 Å
 */
export function getKa2Position(twoThetaKa1: number): number | null {
  const lambda1 = 1.54060;
  const lambda2 = 1.54439;
  
  const theta1 = (twoThetaKa1 / 2) * (Math.PI / 180);
  const sinT1 = Math.sin(theta1);
  const d = lambda1 / (2 * sinT1);
  
  if (d <= 0) return null;
  
  const sinT2 = lambda2 / (2 * d);
  if (sinT2 >= 1) return null; // out of bounds
  
  return (2 * Math.asin(sinT2) * 180) / Math.PI;
}

/**
 * Palette color definitions for multi-phase curves and color themes
 */
export const PHASE_CURVE_PALETTES = [
  { stroke: "#0ea5e9", name: "Sky Azure" },
  { stroke: "#ef4444", name: "Rose Crimson" },
  { stroke: "#f59e0b", name: "Amber Gold" },
  { stroke: "#10b981", name: "Emerald Mint" },
  { stroke: "#8b5cf6", name: "Violet Nebula" },
];

export const COLOR_THEMES = {
  scientific: { 
    expStroke: "#000000", 
    refStroke: "#dc2626", 
    resStroke: "#64748b",
    bg: "#ffffff"
  },
  darkScientific: {
    expStroke: "#e2e8f0",
    refStroke: "#ef4444",
    resStroke: "#94a3b8",
    bg: "#0f172a"
  }
};
