// Scientific X-Ray Attenuation, Absorption Edges, Anodes, and Penetration Physics Engine
// Based on NIST XCOM, International Tables for Crystallography (Vol. C), and McMaster Cross Sections.

export interface XRayAnodeSource {
  id: string;
  name: string;
  symbol: string;
  energyKeV: number;
  wavelengthAngstrom: number;
  filterMaterial: string;
  filterKEdgeKeV: number;
  description: string;
}

export const XRAY_ANODE_SOURCES: XRayAnodeSource[] = [
  {
    id: 'Cu_Ka',
    name: 'Copper (Cu Kα)',
    symbol: 'Cu',
    energyKeV: 8.048,
    wavelengthAngstrom: 1.54056,
    filterMaterial: 'Ni (Nickel)',
    filterKEdgeKeV: 8.333,
    description: 'Universal standard for powder & single-crystal laboratory XRD'
  },
  {
    id: 'Mo_Ka',
    name: 'Molybdenum (Mo Kα)',
    symbol: 'Mo',
    energyKeV: 17.479,
    wavelengthAngstrom: 0.70930,
    filterMaterial: 'Zr (Zirconium)',
    filterKEdgeKeV: 17.998,
    description: 'Hard X-rays for heavy elements, capillary transmission & high reciprocal space'
  },
  {
    id: 'Co_Ka',
    name: 'Cobalt (Co Kα)',
    symbol: 'Co',
    energyKeV: 6.930,
    wavelengthAngstrom: 1.78897,
    filterMaterial: 'Fe (Iron)',
    filterKEdgeKeV: 7.112,
    description: 'Preferred for Fe-bearing minerals, steels & magnetic alloys (avoids Fe fluorescence)'
  },
  {
    id: 'Fe_Ka',
    name: 'Iron (Fe Kα)',
    symbol: 'Fe',
    energyKeV: 6.404,
    wavelengthAngstrom: 1.93604,
    filterMaterial: 'Mn (Manganese)',
    filterKEdgeKeV: 6.539,
    description: 'Longer wavelength for large unit cells & low-angle phase separation'
  },
  {
    id: 'Cr_Ka',
    name: 'Chromium (Cr Kα)',
    symbol: 'Cr',
    energyKeV: 5.415,
    wavelengthAngstrom: 2.28970,
    filterMaterial: 'V (Vanadium)',
    filterKEdgeKeV: 5.465,
    description: 'High 2θ dispersion, residual stress analysis & surface diffraction'
  },
  {
    id: 'Ag_Ka',
    name: 'Silver (Ag Kα)',
    symbol: 'Ag',
    energyKeV: 22.163,
    wavelengthAngstrom: 0.55941,
    filterMaterial: 'Pd / Rh (Rhodium)',
    filterKEdgeKeV: 23.220,
    description: 'Ultra-penetrating radiation for Pair Distribution Function (PDF) & high-pressure DAC'
  }
];

export interface ElementAbsorptionData {
  z: number;
  symbol: string;
  name: string;
  atomicWeight: number;
  density: number; // g/cm³
  kEdgeKeV?: number;
  l1EdgeKeV?: number;
  l2EdgeKeV?: number;
  l3EdgeKeV?: number;
  // NIST XCOM mass attenuation coefficients (cm²/g) at standard characteristic energies
  muRhoCuKa: number; // 8.048 keV
  muRhoMoKa: number; // 17.479 keV
  muRhoCoKa: number; // 6.930 keV
  muRhoFeKa: number; // 6.404 keV
  muRhoCrKa: number; // 5.415 keV
  muRhoAgKa: number; // 22.163 keV
}

// Complete atomic properties and experimental NIST XCOM attenuation benchmarks
export const ELEMENT_ATTENUATION_DB: Record<string, ElementAbsorptionData> = {
  H: { z: 1, symbol: 'H', name: 'Hydrogen', atomicWeight: 1.008, density: 0.089, muRhoCuKa: 0.39, muRhoMoKa: 0.37, muRhoCoKa: 0.40, muRhoFeKa: 0.41, muRhoCrKa: 0.43, muRhoAgKa: 0.35 },
  He: { z: 2, symbol: 'He', name: 'Helium', atomicWeight: 4.003, density: 0.179, muRhoCuKa: 0.21, muRhoMoKa: 0.19, muRhoCoKa: 0.23, muRhoFeKa: 0.24, muRhoCrKa: 0.28, muRhoAgKa: 0.18 },
  Li: { z: 3, symbol: 'Li', name: 'Lithium', atomicWeight: 6.94, density: 0.534, kEdgeKeV: 0.055, muRhoCuKa: 0.72, muRhoMoKa: 0.24, muRhoCoKa: 1.05, muRhoFeKa: 1.28, muRhoCrKa: 2.01, muRhoAgKa: 0.21 },
  Be: { z: 4, symbol: 'Be', name: 'Beryllium', atomicWeight: 9.012, density: 1.85, kEdgeKeV: 0.112, muRhoCuKa: 1.45, muRhoMoKa: 0.31, muRhoCoKa: 2.18, muRhoFeKa: 2.70, muRhoCrKa: 4.38, muRhoAgKa: 0.24 },
  B: { z: 5, symbol: 'B', name: 'Boron', atomicWeight: 10.81, density: 2.34, kEdgeKeV: 0.188, muRhoCuKa: 2.65, muRhoMoKa: 0.44, muRhoCoKa: 4.09, muRhoFeKa: 5.11, muRhoCrKa: 8.42, muRhoAgKa: 0.28 },
  C: { z: 6, symbol: 'C', name: 'Carbon', atomicWeight: 12.011, density: 2.26, kEdgeKeV: 0.284, muRhoCuKa: 4.54, muRhoMoKa: 0.63, muRhoCoKa: 7.02, muRhoFeKa: 8.81, muRhoCrKa: 14.65, muRhoAgKa: 0.33 },
  N: { z: 7, symbol: 'N', name: 'Nitrogen', atomicWeight: 14.007, density: 1.25, kEdgeKeV: 0.410, muRhoCuKa: 7.51, muRhoMoKa: 0.81, muRhoCoKa: 11.60, muRhoFeKa: 14.60, muRhoCrKa: 24.50, muRhoAgKa: 0.39 },
  O: { z: 8, symbol: 'O', name: 'Oxygen', atomicWeight: 15.999, density: 1.43, kEdgeKeV: 0.543, muRhoCuKa: 11.5, muRhoMoKa: 1.15, muRhoCoKa: 17.80, muRhoFeKa: 22.40, muRhoCrKa: 37.80, muRhoAgKa: 0.47 },
  F: { z: 9, symbol: 'F', name: 'Fluorine', atomicWeight: 18.998, density: 1.70, kEdgeKeV: 0.697, muRhoCuKa: 16.8, muRhoMoKa: 1.54, muRhoCoKa: 26.20, muRhoFeKa: 33.10, muRhoCrKa: 56.10, muRhoAgKa: 0.58 },
  Ne: { z: 10, symbol: 'Ne', name: 'Neon', atomicWeight: 20.18, density: 0.90, kEdgeKeV: 0.870, muRhoCuKa: 23.6, muRhoMoKa: 2.05, muRhoCoKa: 36.90, muRhoFeKa: 46.70, muRhoCrKa: 79.40, muRhoAgKa: 0.72 },
  Na: { z: 11, symbol: 'Na', name: 'Sodium', atomicWeight: 22.99, density: 0.968, kEdgeKeV: 1.072, muRhoCuKa: 30.1, muRhoMoKa: 2.58, muRhoCoKa: 46.80, muRhoFeKa: 59.40, muRhoCrKa: 101.5, muRhoAgKa: 0.88 },
  Mg: { z: 12, symbol: 'Mg', name: 'Magnesium', atomicWeight: 24.305, density: 1.738, kEdgeKeV: 1.303, muRhoCuKa: 38.6, muRhoMoKa: 3.25, muRhoCoKa: 60.20, muRhoFeKa: 76.50, muRhoCrKa: 131.0, muRhoAgKa: 1.08 },
  Al: { z: 13, symbol: 'Al', name: 'Aluminum', atomicWeight: 26.982, density: 2.70, kEdgeKeV: 1.560, muRhoCuKa: 49.3, muRhoMoKa: 4.10, muRhoCoKa: 77.00, muRhoFeKa: 98.00, muRhoCrKa: 168.0, muRhoAgKa: 1.32 },
  Si: { z: 14, symbol: 'Si', name: 'Silicon', atomicWeight: 28.085, density: 2.33, kEdgeKeV: 1.839, muRhoCuKa: 61.8, muRhoMoKa: 5.08, muRhoCoKa: 96.50, muRhoFeKa: 123.0, muRhoCrKa: 211.5, muRhoAgKa: 1.61 },
  P: { z: 15, symbol: 'P', name: 'Phosphorus', atomicWeight: 30.974, density: 1.82, kEdgeKeV: 2.146, muRhoCuKa: 74.5, muRhoMoKa: 6.12, muRhoCoKa: 116.0, muRhoFeKa: 148.0, muRhoCrKa: 255.0, muRhoAgKa: 1.93 },
  S: { z: 16, symbol: 'S', name: 'Sulfur', atomicWeight: 32.06, density: 2.07, kEdgeKeV: 2.472, muRhoCuKa: 91.2, muRhoMoKa: 7.41, muRhoCoKa: 142.0, muRhoFeKa: 181.5, muRhoCrKa: 312.0, muRhoAgKa: 2.32 },
  Cl: { z: 17, symbol: 'Cl', name: 'Chlorine', atomicWeight: 35.45, density: 3.20, kEdgeKeV: 2.822, muRhoCuKa: 106.0, muRhoMoKa: 8.65, muRhoCoKa: 165.0, muRhoFeKa: 211.0, muRhoCrKa: 363.0, muRhoAgKa: 2.72 },
  Ar: { z: 18, symbol: 'Ar', name: 'Argon', atomicWeight: 39.948, density: 1.78, kEdgeKeV: 3.206, muRhoCuKa: 123.0, muRhoMoKa: 10.05, muRhoCoKa: 191.0, muRhoFeKa: 245.0, muRhoCrKa: 421.0, muRhoAgKa: 3.16 },
  K: { z: 19, symbol: 'K', name: 'Potassium', atomicWeight: 39.098, density: 0.862, kEdgeKeV: 3.608, muRhoCuKa: 143.0, muRhoMoKa: 11.6, muRhoCoKa: 222.0, muRhoFeKa: 285.0, muRhoCrKa: 489.0, muRhoAgKa: 3.68 },
  Ca: { z: 20, symbol: 'Ca', name: 'Calcium', atomicWeight: 40.078, density: 1.55, kEdgeKeV: 4.038, muRhoCuKa: 165.0, muRhoMoKa: 13.4, muRhoCoKa: 256.0, muRhoFeKa: 329.0, muRhoCrKa: 565.0, muRhoAgKa: 4.25 },
  Sc: { z: 21, symbol: 'Sc', name: 'Scandium', atomicWeight: 44.956, density: 2.985, kEdgeKeV: 4.493, muRhoCuKa: 188.0, muRhoMoKa: 15.3, muRhoCoKa: 292.0, muRhoFeKa: 375.0, muRhoCrKa: 645.0, muRhoAgKa: 4.88 },
  Ti: { z: 22, symbol: 'Ti', name: 'Titanium', atomicWeight: 47.867, density: 4.506, kEdgeKeV: 4.966, muRhoCuKa: 213.0, muRhoMoKa: 17.4, muRhoCoKa: 331.0, muRhoFeKa: 425.0, muRhoCrKa: 730.0, muRhoAgKa: 5.57 },
  V: { z: 23, symbol: 'V', name: 'Vanadium', atomicWeight: 50.942, density: 6.11, kEdgeKeV: 5.465, muRhoCuKa: 241.0, muRhoMoKa: 19.7, muRhoCoKa: 374.0, muRhoFeKa: 480.0, muRhoCrKa: 104.0, muRhoAgKa: 6.32 },
  Cr: { z: 24, symbol: 'Cr', name: 'Chromium', atomicWeight: 51.996, density: 7.19, kEdgeKeV: 5.989, muRhoCuKa: 269.0, muRhoMoKa: 22.1, muRhoCoKa: 418.0, muRhoFeKa: 538.0, muRhoCrKa: 119.0, muRhoAgKa: 7.12 },
  Mn: { z: 25, symbol: 'Mn', name: 'Manganese', atomicWeight: 54.938, density: 7.21, kEdgeKeV: 6.539, muRhoCuKa: 298.0, muRhoMoKa: 24.6, muRhoCoKa: 463.0, muRhoFeKa: 96.0, muRhoCrKa: 135.0, muRhoAgKa: 7.97 },
  Fe: { z: 26, symbol: 'Fe', name: 'Iron', atomicWeight: 55.845, density: 7.874, kEdgeKeV: 7.112, muRhoCuKa: 308.0, muRhoMoKa: 27.2, muRhoCoKa: 60.5, muRhoFeKa: 76.0, muRhoCrKa: 117.0, muRhoAgKa: 8.87 },
  Co: { z: 27, symbol: 'Co', name: 'Cobalt', atomicWeight: 58.933, density: 8.90, kEdgeKeV: 7.709, muRhoCuKa: 339.0, muRhoMoKa: 30.1, muRhoCoKa: 67.5, muRhoFeKa: 85.0, muRhoCrKa: 131.0, muRhoAgKa: 9.83 },
  Ni: { z: 28, symbol: 'Ni', name: 'Nickel', atomicWeight: 58.693, density: 8.908, kEdgeKeV: 8.333, muRhoCuKa: 47.8, muRhoMoKa: 33.1, muRhoCoKa: 75.0, muRhoFeKa: 94.0, muRhoCrKa: 145.0, muRhoAgKa: 10.8 },
  Cu: { z: 29, symbol: 'Cu', name: 'Copper', atomicWeight: 63.546, density: 8.96, kEdgeKeV: 8.979, muRhoCuKa: 52.9, muRhoMoKa: 36.3, muRhoCoKa: 82.5, muRhoFeKa: 104.0, muRhoCrKa: 160.0, muRhoAgKa: 11.9 },
  Zn: { z: 30, symbol: 'Zn', name: 'Zinc', atomicWeight: 65.38, density: 7.14, kEdgeKeV: 9.659, muRhoCuKa: 58.3, muRhoMoKa: 39.7, muRhoCoKa: 91.0, muRhoFeKa: 114.0, muRhoCrKa: 176.0, muRhoAgKa: 13.0 },
  Ga: { z: 31, symbol: 'Ga', name: 'Gallium', atomicWeight: 69.723, density: 5.91, kEdgeKeV: 10.367, muRhoCuKa: 64.1, muRhoMoKa: 43.2, muRhoCoKa: 100.0, muRhoFeKa: 125.0, muRhoCrKa: 193.0, muRhoAgKa: 14.2 },
  Ge: { z: 32, symbol: 'Ge', name: 'Germanium', atomicWeight: 72.63, density: 5.323, kEdgeKeV: 11.103, muRhoCuKa: 70.1, muRhoMoKa: 47.0, muRhoCoKa: 109.0, muRhoFeKa: 137.0, muRhoCrKa: 211.0, muRhoAgKa: 15.5 },
  As: { z: 33, symbol: 'As', name: 'Arsenic', atomicWeight: 74.922, density: 5.727, kEdgeKeV: 11.867, muRhoCuKa: 76.5, muRhoMoKa: 50.9, muRhoCoKa: 119.0, muRhoFeKa: 149.0, muRhoCrKa: 230.0, muRhoAgKa: 16.8 },
  Se: { z: 34, symbol: 'Se', name: 'Selenium', atomicWeight: 78.971, density: 4.819, kEdgeKeV: 12.658, muRhoCuKa: 83.1, muRhoMoKa: 55.0, muRhoCoKa: 129.0, muRhoFeKa: 162.0, muRhoCrKa: 249.0, muRhoAgKa: 18.2 },
  Br: { z: 35, symbol: 'Br', name: 'Bromine', atomicWeight: 79.904, density: 3.12, kEdgeKeV: 13.474, muRhoCuKa: 90.0, muRhoMoKa: 59.3, muRhoCoKa: 140.0, muRhoFeKa: 175.0, muRhoCrKa: 270.0, muRhoAgKa: 19.7 },
  Kr: { z: 36, symbol: 'Kr', name: 'Krypton', atomicWeight: 83.798, density: 3.75, kEdgeKeV: 14.326, muRhoCuKa: 97.2, muRhoMoKa: 63.8, muRhoCoKa: 151.0, muRhoFeKa: 189.0, muRhoCrKa: 291.0, muRhoAgKa: 21.2 },
  Rb: { z: 37, symbol: 'Rb', name: 'Rubidium', atomicWeight: 85.468, density: 1.532, kEdgeKeV: 15.200, muRhoCuKa: 105.0, muRhoMoKa: 68.5, muRhoCoKa: 163.0, muRhoFeKa: 204.0, muRhoCrKa: 314.0, muRhoAgKa: 22.8 },
  Sr: { z: 38, symbol: 'Sr', name: 'Strontium', atomicWeight: 87.62, density: 2.64, kEdgeKeV: 16.105, muRhoCuKa: 113.0, muRhoMoKa: 73.4, muRhoCoKa: 175.0, muRhoFeKa: 219.0, muRhoCrKa: 337.0, muRhoAgKa: 24.5 },
  Y: { z: 39, symbol: 'Y', name: 'Yttrium', atomicWeight: 88.906, density: 4.472, kEdgeKeV: 17.038, muRhoCuKa: 121.0, muRhoMoKa: 78.6, muRhoCoKa: 187.0, muRhoFeKa: 235.0, muRhoCrKa: 362.0, muRhoAgKa: 26.2 },
  Zr: { z: 40, symbol: 'Zr', name: 'Zirconium', atomicWeight: 91.224, density: 6.52, kEdgeKeV: 17.998, muRhoCuKa: 129.0, muRhoMoKa: 15.4, muRhoCoKa: 200.0, muRhoFeKa: 251.0, muRhoCrKa: 387.0, muRhoAgKa: 28.0 },
  Nb: { z: 41, symbol: 'Nb', name: 'Niobium', atomicWeight: 92.906, density: 8.57, kEdgeKeV: 18.986, muRhoCuKa: 138.0, muRhoMoKa: 16.8, muRhoCoKa: 214.0, muRhoFeKa: 268.0, muRhoCrKa: 413.0, muRhoAgKa: 29.9 },
  Mo: { z: 42, symbol: 'Mo', name: 'Molybdenum', atomicWeight: 95.95, density: 10.28, kEdgeKeV: 20.000, muRhoCuKa: 147.0, muRhoMoKa: 18.2, muRhoCoKa: 228.0, muRhoFeKa: 285.0, muRhoCrKa: 440.0, muRhoAgKa: 31.8 },
  Tc: { z: 43, symbol: 'Tc', name: 'Technetium', atomicWeight: 98.0, density: 11.5, kEdgeKeV: 21.044, muRhoCuKa: 156.0, muRhoMoKa: 19.7, muRhoCoKa: 242.0, muRhoFeKa: 303.0, muRhoCrKa: 468.0, muRhoAgKa: 33.8 },
  Ru: { z: 44, symbol: 'Ru', name: 'Ruthenium', atomicWeight: 101.07, density: 12.45, kEdgeKeV: 22.117, muRhoCuKa: 166.0, muRhoMoKa: 21.2, muRhoCoKa: 257.0, muRhoFeKa: 322.0, muRhoCrKa: 497.0, muRhoAgKa: 5.75 },
  Rh: { z: 45, symbol: 'Rh', name: 'Rhodium', atomicWeight: 102.91, density: 12.41, kEdgeKeV: 23.220, muRhoCuKa: 176.0, muRhoMoKa: 22.8, muRhoCoKa: 272.0, muRhoFeKa: 341.0, muRhoCrKa: 526.0, muRhoAgKa: 6.25 },
  Pd: { z: 46, symbol: 'Pd', name: 'Palladium', atomicWeight: 106.42, density: 12.023, kEdgeKeV: 24.350, muRhoCuKa: 186.0, muRhoMoKa: 24.5, muRhoCoKa: 288.0, muRhoFeKa: 361.0, muRhoCrKa: 556.0, muRhoAgKa: 6.78 },
  Ag: { z: 47, symbol: 'Ag', name: 'Silver', atomicWeight: 107.87, density: 10.49, kEdgeKeV: 25.514, muRhoCuKa: 197.0, muRhoMoKa: 26.2, muRhoCoKa: 304.0, muRhoFeKa: 381.0, muRhoCrKa: 588.0, muRhoAgKa: 7.35 },
  Cd: { z: 48, symbol: 'Cd', name: 'Cadmium', atomicWeight: 112.41, density: 8.65, kEdgeKeV: 26.711, muRhoCuKa: 208.0, muRhoMoKa: 28.0, muRhoCoKa: 321.0, muRhoFeKa: 402.0, muRhoCrKa: 620.0, muRhoAgKa: 7.95 },
  In: { z: 49, symbol: 'In', name: 'Indium', atomicWeight: 114.82, density: 7.31, kEdgeKeV: 27.940, muRhoCuKa: 219.0, muRhoMoKa: 29.9, muRhoCoKa: 338.0, muRhoFeKa: 424.0, muRhoCrKa: 653.0, muRhoAgKa: 8.58 },
  Sn: { z: 50, symbol: 'Sn', name: 'Tin', atomicWeight: 118.71, density: 7.265, kEdgeKeV: 29.200, muRhoCuKa: 231.0, muRhoMoKa: 31.8, muRhoCoKa: 356.0, muRhoFeKa: 446.0, muRhoCrKa: 687.0, muRhoAgKa: 9.24 },
  Sb: { z: 51, symbol: 'Sb', name: 'Antimony', atomicWeight: 121.76, density: 6.697, kEdgeKeV: 30.491, muRhoCuKa: 243.0, muRhoMoKa: 33.8, muRhoCoKa: 374.0, muRhoFeKa: 469.0, muRhoCrKa: 722.0, muRhoAgKa: 9.94 },
  Te: { z: 52, symbol: 'Te', name: 'Tellurium', atomicWeight: 127.60, density: 6.24, kEdgeKeV: 31.814, muRhoCuKa: 255.0, muRhoMoKa: 35.9, muRhoCoKa: 393.0, muRhoFeKa: 492.0, muRhoCrKa: 758.0, muRhoAgKa: 10.7 },
  I: { z: 53, symbol: 'I', name: 'Iodine', atomicWeight: 126.90, density: 4.933, kEdgeKeV: 33.169, muRhoCuKa: 268.0, muRhoMoKa: 38.0, muRhoCoKa: 412.0, muRhoFeKa: 516.0, muRhoCrKa: 795.0, muRhoAgKa: 11.5 },
  Xe: { z: 54, symbol: 'Xe', name: 'Xenon', atomicWeight: 131.29, density: 5.89, kEdgeKeV: 34.561, muRhoCuKa: 281.0, muRhoMoKa: 40.2, muRhoCoKa: 432.0, muRhoFeKa: 541.0, muRhoCrKa: 833.0, muRhoAgKa: 12.3 },
  Cs: { z: 55, symbol: 'Cs', name: 'Cesium', atomicWeight: 132.91, density: 1.93, kEdgeKeV: 35.985, muRhoCuKa: 294.0, muRhoMoKa: 42.5, muRhoCoKa: 452.0, muRhoFeKa: 566.0, muRhoCrKa: 872.0, muRhoAgKa: 13.1 },
  Ba: { z: 56, symbol: 'Ba', name: 'Barium', atomicWeight: 137.33, density: 3.51, kEdgeKeV: 37.441, l1EdgeKeV: 5.989, l2EdgeKeV: 5.624, l3EdgeKeV: 5.247, muRhoCuKa: 308.0, muRhoMoKa: 44.8, muRhoCoKa: 473.0, muRhoFeKa: 592.0, muRhoCrKa: 912.0, muRhoAgKa: 14.0 },
  La: { z: 57, symbol: 'La', name: 'Lanthanum', atomicWeight: 138.91, density: 6.162, kEdgeKeV: 38.925, l1EdgeKeV: 6.266, l2EdgeKeV: 5.891, l3EdgeKeV: 5.483, muRhoCuKa: 322.0, muRhoMoKa: 47.2, muRhoCoKa: 494.0, muRhoFeKa: 619.0, muRhoCrKa: 953.0, muRhoAgKa: 14.9 },
  Ce: { z: 58, symbol: 'Ce', name: 'Cerium', atomicWeight: 140.12, density: 6.77, kEdgeKeV: 40.443, l1EdgeKeV: 6.549, l2EdgeKeV: 6.164, l3EdgeKeV: 5.723, muRhoCuKa: 337.0, muRhoMoKa: 49.7, muRhoCoKa: 516.0, muRhoFeKa: 646.0, muRhoCrKa: 995.0, muRhoAgKa: 15.9 },
  Nd: { z: 60, symbol: 'Nd', name: 'Neodymium', atomicWeight: 144.24, density: 7.01, kEdgeKeV: 43.569, l1EdgeKeV: 7.126, l2EdgeKeV: 6.722, l3EdgeKeV: 6.208, muRhoCuKa: 367.0, muRhoMoKa: 54.9, muRhoCoKa: 561.0, muRhoFeKa: 703.0, muRhoCrKa: 1083.0, muRhoAgKa: 17.9 },
  Sm: { z: 62, symbol: 'Sm', name: 'Samarium', atomicWeight: 150.36, density: 7.52, kEdgeKeV: 46.834, l1EdgeKeV: 7.737, l2EdgeKeV: 7.312, l3EdgeKeV: 6.716, muRhoCuKa: 398.0, muRhoMoKa: 60.4, muRhoCoKa: 608.0, muRhoFeKa: 762.0, muRhoCrKa: 1175.0, muRhoAgKa: 20.1 },
  Eu: { z: 63, symbol: 'Eu', name: 'Europium', atomicWeight: 151.96, density: 5.244, kEdgeKeV: 48.519, l1EdgeKeV: 8.052, l2EdgeKeV: 7.617, l3EdgeKeV: 6.977, muRhoCuKa: 414.0, muRhoMoKa: 63.3, muRhoCoKa: 632.0, muRhoFeKa: 792.0, muRhoCrKa: 1222.0, muRhoAgKa: 21.3 },
  Gd: { z: 64, symbol: 'Gd', name: 'Gadolinium', atomicWeight: 157.25, density: 7.90, kEdgeKeV: 50.239, l1EdgeKeV: 8.376, l2EdgeKeV: 7.930, l3EdgeKeV: 7.243, muRhoCuKa: 430.0, muRhoMoKa: 66.2, muRhoCoKa: 657.0, muRhoFeKa: 823.0, muRhoCrKa: 1270.0, muRhoAgKa: 22.5 },
  Tb: { z: 65, symbol: 'Tb', name: 'Terbium', atomicWeight: 158.93, density: 8.23, kEdgeKeV: 51.996, l1EdgeKeV: 8.708, l2EdgeKeV: 8.252, l3EdgeKeV: 7.514, muRhoCuKa: 447.0, muRhoMoKa: 69.2, muRhoCoKa: 683.0, muRhoFeKa: 855.0, muRhoCrKa: 1319.0, muRhoAgKa: 23.8 },
  Dy: { z: 66, symbol: 'Dy', name: 'Dysprosium', atomicWeight: 162.50, density: 8.54, kEdgeKeV: 53.789, l1EdgeKeV: 9.046, l2EdgeKeV: 8.581, l3EdgeKeV: 7.790, muRhoCuKa: 464.0, muRhoMoKa: 72.3, muRhoCoKa: 709.0, muRhoFeKa: 888.0, muRhoCrKa: 1370.0, muRhoAgKa: 25.1 },
  Ta: { z: 73, symbol: 'Ta', name: 'Tantalum', atomicWeight: 180.95, density: 16.69, kEdgeKeV: 67.416, l1EdgeKeV: 11.682, l2EdgeKeV: 11.136, l3EdgeKeV: 9.881, muRhoCuKa: 168.0, muRhoMoKa: 96.0, muRhoCoKa: 258.0, muRhoFeKa: 323.0, muRhoCrKa: 498.0, muRhoAgKa: 35.5 },
  W: { z: 74, symbol: 'W', name: 'Tungsten', atomicWeight: 183.84, density: 19.25, kEdgeKeV: 69.525, l1EdgeKeV: 12.100, l2EdgeKeV: 11.544, l3EdgeKeV: 10.207, muRhoCuKa: 175.0, muRhoMoKa: 99.8, muRhoCoKa: 268.0, muRhoFeKa: 336.0, muRhoCrKa: 518.0, muRhoAgKa: 37.2 },
  Re: { z: 75, symbol: 'Re', name: 'Rhenium', atomicWeight: 186.21, density: 21.02, kEdgeKeV: 71.676, l1EdgeKeV: 12.527, l2EdgeKeV: 11.959, l3EdgeKeV: 10.535, muRhoCuKa: 182.0, muRhoMoKa: 104.0, muRhoCoKa: 279.0, muRhoFeKa: 350.0, muRhoCrKa: 539.0, muRhoAgKa: 39.0 },
  Pt: { z: 78, symbol: 'Pt', name: 'Platinum', atomicWeight: 195.08, density: 21.45, kEdgeKeV: 78.395, l1EdgeKeV: 13.880, l2EdgeKeV: 13.273, l3EdgeKeV: 11.564, muRhoCuKa: 204.0, muRhoMoKa: 116.0, muRhoCoKa: 312.0, muRhoFeKa: 391.0, muRhoCrKa: 602.0, muRhoAgKa: 44.5 },
  Au: { z: 79, symbol: 'Au', name: 'Gold', atomicWeight: 196.97, density: 19.30, kEdgeKeV: 80.725, l1EdgeKeV: 14.353, l2EdgeKeV: 13.734, l3EdgeKeV: 11.919, muRhoCuKa: 211.0, muRhoMoKa: 121.0, muRhoCoKa: 323.0, muRhoFeKa: 405.0, muRhoCrKa: 624.0, muRhoAgKa: 46.5 },
  Pb: { z: 82, symbol: 'Pb', name: 'Lead', atomicWeight: 207.2, density: 11.34, kEdgeKeV: 88.005, l1EdgeKeV: 15.861, l2EdgeKeV: 15.200, l3EdgeKeV: 13.035, muRhoCuKa: 232.0, muRhoMoKa: 134.0, muRhoCoKa: 355.0, muRhoFeKa: 445.0, muRhoCrKa: 686.0, muRhoAgKa: 52.8 },
  Bi: { z: 83, symbol: 'Bi', name: 'Bismuth', atomicWeight: 208.98, density: 9.78, kEdgeKeV: 90.526, l1EdgeKeV: 16.388, l2EdgeKeV: 15.711, l3EdgeKeV: 13.419, muRhoCuKa: 240.0, muRhoMoKa: 139.0, muRhoCoKa: 367.0, muRhoFeKa: 460.0, muRhoCrKa: 709.0, muRhoAgKa: 55.1 },
  U: { z: 92, symbol: 'U', name: 'Uranium', atomicWeight: 238.03, density: 19.1, kEdgeKeV: 115.606, l1EdgeKeV: 21.757, l2EdgeKeV: 20.948, l3EdgeKeV: 17.166, muRhoCuKa: 310.0, muRhoMoKa: 182.0, muRhoCoKa: 475.0, muRhoFeKa: 595.0, muRhoCrKa: 918.0, muRhoAgKa: 77.2 }
};

// Computes mass attenuation coefficient mu/rho for any element at any custom energy E (in keV)
export function getElementMuRhoAtEnergy(el: ElementAbsorptionData, energyKeV: number): number {
  const e = Math.max(0.5, energyKeV);
  const z = el.z;

  // Exact known tabulated anchor checks
  if (Math.abs(e - 8.048) < 0.05) return el.muRhoCuKa;
  if (Math.abs(e - 17.479) < 0.05) return el.muRhoMoKa;
  if (Math.abs(e - 6.930) < 0.05) return el.muRhoCoKa;
  if (Math.abs(e - 6.404) < 0.05) return el.muRhoFeKa;
  if (Math.abs(e - 5.415) < 0.05) return el.muRhoCrKa;
  if (Math.abs(e - 22.163) < 0.05) return el.muRhoAgKa;

  // Standard power-law cross section with K & L absorption edge jumps
  // Below K-edge, photoelectric absorption jumps down by ~K-jump ratio (typically 5 to 8)
  let kFactor = 1.0;
  if (el.kEdgeKeV) {
    if (e < el.kEdgeKeV) {
      kFactor = 0.14 + (z < 20 ? 0.08 : 0.02);
    }
  }

  let lFactor = 1.0;
  if (el.l3EdgeKeV && e < el.l3EdgeKeV) {
    lFactor = 0.35;
  }

  // Anchor to Cu K-alpha (8.048 keV) base value
  const cuBase = el.muRhoCuKa;
  const cuE = 8.048;
  const cuInKRegion = !el.kEdgeKeV || cuE >= el.kEdgeKeV;
  const targetInKRegion = !el.kEdgeKeV || e >= el.kEdgeKeV;

  let baseMultiplier = Math.pow(cuE / e, 2.85);

  if (cuInKRegion && !targetInKRegion) {
    baseMultiplier *= kFactor;
  } else if (!cuInKRegion && targetInKRegion) {
    baseMultiplier /= Math.max(0.01, kFactor);
  }

  // Add Compton scattering floor for high energies
  const comptonFloor = 0.15 * (z / Math.max(1, el.atomicWeight));
  const result = Math.max(comptonFloor, cuBase * baseMultiplier * lFactor);

  return Number(result.toFixed(2));
}

// Full stoichiometry parser with parentheses e.g. Ca5(PO4)3(OH), Li(Ni0.8Co0.1Mn0.1)O2, YBa2Cu3O6.95
export interface ParsedElementRatioExtended {
  z: number;
  symbol: string;
  name: string;
  count: number;
  atomicWeight: number;
  weightFraction: number;
  atomicFraction: number;
  muRho: number; // cm²/g at selected energy
  linearContribution: number; // cm⁻¹
  absorptionSharePercent: number; // % contribution to total sample attenuation
  kEdgeKeV?: number;
  hasFluorescenceWarning: boolean;
  fluorescenceSeverity: 'none' | 'critical' | 'moderate';
  warningMessage?: string;
}

export interface CompoundCalculationResult {
  formula: string;
  normalizedFormula: string;
  formulaWeight: number;
  totalAtoms: number;
  totalElectrons: number;
  elements: ParsedElementRatioExtended[];
  densityGPerCm3: number;
  packingFraction: number; // 0.1 to 1.0 (1 = solid, 0.5 = loose powder)
  effectiveDensity: number;
  energyKeV: number;
  wavelengthAngstrom: number;
  selectedAnodeName: string;
  
  // Attenuation Metrics
  massAttenuationMuRho: number; // cm²/g
  linearAttenuationMu: number; // cm⁻¹ (effective)
  solidLinearAttenuationMu: number; // cm⁻¹ (100% dense)
  
  // Penetration Lengths (μm)
  oneOverMuDepthUm: number; // 1/μ (63.2% absorbed)
  halfValueLayerUm: number; // HVL (50% absorbed) = ln(2)/μ
  ninetyPercentDepthUm: number; // 90% absorbed = ln(10)/μ = 2.303/μ
  ninetyNinePercentDepthUm: number; // 99% absorbed = ln(100)/μ = 4.605/μ
  
  // Capillary / Debye-Scherrer Transmission
  optimumCapillaryDiameterMm: number; // d = 1/μ
  capillaryTransmissions: { diameterMm: number; transmissionPercent: number; muTimesD: number; status: 'optimal' | 'acceptable' | 'too_thick' | 'too_thin' }[];
  
  // Fluorescence Warnings
  hasAnyFluorescenceWarning: boolean;
  criticalFluorescenceElements: string[];
}

export function parseChemicalFormulaWithParentheses(rawFormula: string): { symbol: string; count: number }[] | null {
  if (!rawFormula || !rawFormula.trim()) return null;

  // Clean formula: replace hydrate dots with plus or split
  let cleaned = rawFormula.trim().replace(/\s+/g, '').replace(/·/g, '.');

  // Handle hydrate notation like CuSO4.5H2O
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const mainPart = parts[0];
    const hydrateParts = parts.slice(1);

    const mainCounts = parseSubFormula(mainPart);
    if (!mainCounts) return null;

    const merged: Record<string, number> = { ...mainCounts };

    for (const hPart of hydrateParts) {
      // e.g. 5H2O or H2O
      const match = hPart.match(/^(\d*\.?\d*)(.*)$/);
      const mult = match && match[1] ? parseFloat(match[1]) : 1.0;
      const subForm = match && match[2] ? match[2] : hPart;

      const subCounts = parseSubFormula(subForm);
      if (subCounts) {
        for (const [sym, c] of Object.entries(subCounts)) {
          merged[sym] = (merged[sym] || 0) + c * mult;
        }
      }
    }

    return Object.entries(merged).map(([symbol, count]) => ({ symbol, count }));
  }

  const countsMap = parseSubFormula(cleaned);
  if (!countsMap) return null;

  return Object.entries(countsMap).map(([symbol, count]) => ({ symbol, count }));
}

function parseSubFormula(str: string): Record<string, number> | null {
  // Recursively expand parentheses: (X)N or [X]N
  let current = str;
  const parenRegex = /\(([^()]+)\)(\d*\.?\d*)|\[([^\[\]]+)\](\d*\.?\d*)/g;

  while (parenRegex.test(current)) {
    current = current.replace(parenRegex, (_, p1, m1, p2, m2) => {
      const content = p1 || p2;
      const mult = parseFloat(m1 || m2 || '1') || 1.0;
      
      // Expand elements inside content by mult
      return content.replace(/([A-Z][a-z]*)(\d*\.?\d*)/g, (__, sym, cnt) => {
        const subCount = parseFloat(cnt || '1') || 1.0;
        return `${sym}${Number((subCount * mult).toFixed(6))}`;
      });
    });
  }

  // Now extract all element counts
  const elemRegex = /([A-Z][a-z]*)(\d*\.?\d*)/g;
  let match;
  const result: Record<string, number> = {};
  let totalFound = 0;

  while ((match = elemRegex.exec(current)) !== null) {
    const sym = match[1];
    const cnt = match[2] ? parseFloat(match[2]) : 1.0;
    if (isNaN(cnt) || cnt <= 0) continue;
    result[sym] = (result[sym] || 0) + cnt;
    totalFound++;
  }

  return totalFound > 0 ? result : null;
}

// Master Compound Attenuation Calculation Engine
export function calculateExtendedCompoundAttenuation(
  formulaOrAlloy: string,
  densityGPerCm3: number,
  energyKeV: number,
  anodeName: string,
  packingFraction: number = 1.0
): CompoundCalculationResult | null {
  const parsedElements = parseChemicalFormulaWithParentheses(formulaOrAlloy);
  if (!parsedElements || parsedElements.length === 0) return null;

  let formulaWeight = 0;
  let totalAtoms = 0;
  let totalElectrons = 0;

  const validElements: { elemData: ElementAbsorptionData; count: number }[] = [];

  for (const item of parsedElements) {
    const data = ELEMENT_ATTENUATION_DB[item.symbol];
    if (!data) {
      // Element not found in DB
      return null;
    }
    validElements.push({ elemData: data, count: item.count });
    formulaWeight += data.atomicWeight * item.count;
    totalAtoms += item.count;
    totalElectrons += data.z * item.count;
  }

  if (formulaWeight <= 0 || validElements.length === 0) return null;

  const wavelengthAngstrom = Number((12.3984 / Math.max(0.1, energyKeV)).toFixed(5));
  let compoundMuRho = 0;
  const parsedExtended: ParsedElementRatioExtended[] = [];
  const criticalFluorescenceElements: string[] = [];

  for (const item of validElements) {
    const { elemData, count } = item;
    const weightFraction = (elemData.atomicWeight * count) / formulaWeight;
    const atomicFraction = count / totalAtoms;
    const muRhoEl = getElementMuRhoAtEnergy(elemData, energyKeV);

    compoundMuRho += weightFraction * muRhoEl;

    // Check for Secondary Fluorescence Danger
    // Happens when incident photon energy is slightly above elemental absorption edge
    let hasFluorescenceWarning = false;
    let fluorescenceSeverity: 'none' | 'critical' | 'moderate' = 'none';
    let warningMessage: string | undefined = undefined;

    if (elemData.kEdgeKeV) {
      const deltaE = energyKeV - elemData.kEdgeKeV;
      if (deltaE > 0 && deltaE < 2.5) {
        // Critical fluorescence (e.g. Cu Ka 8.048 on Fe 7.112 or Co 7.709)
        hasFluorescenceWarning = true;
        fluorescenceSeverity = 'critical';
        criticalFluorescenceElements.push(elemData.symbol);
        warningMessage = `Incident energy (${energyKeV.toFixed(2)} keV) is just above ${elemData.symbol} K-edge (${elemData.kEdgeKeV.toFixed(2)} keV). Strong incoherent XRF background noise will flood detector!`;
      } else if (deltaE >= 2.5 && deltaE < 6.0) {
        hasFluorescenceWarning = true;
        fluorescenceSeverity = 'moderate';
        warningMessage = `Secondary fluorescence from ${elemData.symbol} is active. Use energy-dispersive detector or secondary monochromator.`;
      }
    }

    parsedExtended.push({
      z: elemData.z,
      symbol: elemData.symbol,
      name: elemData.name,
      count,
      atomicWeight: elemData.atomicWeight,
      weightFraction,
      atomicFraction,
      muRho: muRhoEl,
      linearContribution: 0, // Calculated below
      absorptionSharePercent: 0, // Calculated below
      kEdgeKeV: elemData.kEdgeKeV,
      hasFluorescenceWarning,
      fluorescenceSeverity,
      warningMessage
    });
  }

  // Calculate elemental shares of linear absorption
  const dens = Math.max(0.01, densityGPerCm3 || 4.5);
  const pack = Math.max(0.1, Math.min(1.0, packingFraction));
  const effectiveDensity = dens * pack;

  const solidLinearMu = compoundMuRho * dens; // cm⁻¹
  const effectiveLinearMu = compoundMuRho * effectiveDensity; // cm⁻¹

  for (const el of parsedExtended) {
    const linearEl = el.weightFraction * el.muRho * effectiveDensity;
    el.linearContribution = linearEl;
    el.absorptionSharePercent = compoundMuRho > 0 ? (el.weightFraction * el.muRho / compoundMuRho) * 100 : 0;
  }

  // Penetration Lengths in micrometers (1 cm = 10,000 μm)
  const oneOverMuDepthUm = effectiveLinearMu > 0 ? (1 / effectiveLinearMu) * 10000 : 0;
  const halfValueLayerUm = effectiveLinearMu > 0 ? (0.69315 / effectiveLinearMu) * 10000 : 0;
  const ninetyPercentDepthUm = effectiveLinearMu > 0 ? (2.30259 / effectiveLinearMu) * 10000 : 0;
  const ninetyNinePercentDepthUm = effectiveLinearMu > 0 ? (4.60517 / effectiveLinearMu) * 10000 : 0;

  // Optimum Capillary Diameter (d = 1/μ in mm)
  const optCapMm = effectiveLinearMu > 0 ? (1 / effectiveLinearMu) * 10 : 0.5;

  const standardCapillarySizes = [0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0];
  const capillaryTransmissions = standardCapillarySizes.map(dMm => {
    const dCm = dMm / 10;
    const muD = effectiveLinearMu * dCm;
    const transmission = Math.exp(-muD) * 100;
    let status: 'optimal' | 'acceptable' | 'too_thick' | 'too_thin' = 'acceptable';

    if (muD >= 0.8 && muD <= 1.5) status = 'optimal';
    else if (muD > 2.5) status = 'too_thick';
    else if (muD < 0.2) status = 'too_thin';

    return {
      diameterMm: dMm,
      transmissionPercent: Number(transmission.toFixed(2)),
      muTimesD: Number(muD.toFixed(3)),
      status
    };
  });

  return {
    formula: formulaOrAlloy,
    normalizedFormula: parsedExtended.map(e => `${e.symbol}${e.count > 1 ? Number(e.count.toFixed(3)) : ''}`).join(''),
    formulaWeight,
    totalAtoms,
    totalElectrons,
    elements: parsedExtended,
    densityGPerCm3: dens,
    packingFraction: pack,
    effectiveDensity,
    energyKeV,
    wavelengthAngstrom,
    selectedAnodeName: anodeName,
    massAttenuationMuRho: compoundMuRho,
    linearAttenuationMu: effectiveLinearMu,
    solidLinearAttenuationMu: solidLinearMu,
    oneOverMuDepthUm,
    halfValueLayerUm,
    ninetyPercentDepthUm,
    ninetyNinePercentDepthUm,
    optimumCapillaryDiameterMm: optCapMm,
    capillaryTransmissions,
    hasAnyFluorescenceWarning: parsedExtended.some(e => e.hasFluorescenceWarning),
    criticalFluorescenceElements
  };
}
