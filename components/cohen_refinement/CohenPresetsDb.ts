export type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic' | 'Monoclinic';
export type DriftFunctionType = 'nelson_riley' | 'bradley_jay' | 'sample_displacement' | 'hess_hagg' | 'zero_shift';

export interface PeakInput {
  id: string;
  twoTheta: number;
  h: number;
  k: number;
  l: number;
  intensity?: number;
  enabled?: boolean; // toggle peak inclusion
}

export interface PresetSample {
  name: string;
  chemicalFormula?: string;
  system: CrystalSystem;
  refLattice?: { a?: number; b?: number; c?: number; betaDeg?: number };
  wavelength: number;
  molarMass?: number; // g/mol
  formulaUnitsZ?: number; // Z
  description?: string;
  peaks: PeakInput[];
}

export const COHEN_PRESET_SAMPLES: PresetSample[] = [
  {
    name: 'Silicon (NIST SRM 640e)',
    chemicalFormula: 'Si',
    system: 'Cubic',
    refLattice: { a: 5.4311946 },
    wavelength: 1.54056,
    molarMass: 28.0855,
    formulaUnitsZ: 8,
    description: 'NIST Standard Reference Material for 2θ calibration and unit cell precision benchmarks.',
    peaks: [
      { id: 'si-1', twoTheta: 28.442, h: 1, k: 1, l: 1, intensity: 100, enabled: true },
      { id: 'si-2', twoTheta: 47.302, h: 2, k: 2, l: 0, intensity: 55, enabled: true },
      { id: 'si-3', twoTheta: 56.121, h: 3, k: 1, l: 1, intensity: 30, enabled: true },
      { id: 'si-4', twoTheta: 69.130, h: 4, k: 0, l: 0, intensity: 6, enabled: true },
      { id: 'si-5', twoTheta: 76.377, h: 3, k: 3, l: 1, intensity: 11, enabled: true },
      { id: 'si-6', twoTheta: 88.031, h: 4, k: 2, l: 2, intensity: 12, enabled: true },
      { id: 'si-7', twoTheta: 94.953, h: 5, k: 1, l: 1, intensity: 6, enabled: true },
      { id: 'si-8', twoTheta: 106.709, h: 4, k: 4, l: 0, intensity: 3, enabled: true },
      { id: 'si-9', twoTheta: 114.093, h: 5, k: 3, l: 1, intensity: 7, enabled: true },
      { id: 'si-10', twoTheta: 127.546, h: 6, k: 2, l: 0, intensity: 8, enabled: true },
      { id: 'si-11', twoTheta: 136.895, h: 5, k: 3, l: 3, intensity: 3, enabled: true }
    ]
  },
  {
    name: 'Lanthanum Hexaboride (NIST SRM 660c)',
    chemicalFormula: 'LaB6',
    system: 'Cubic',
    refLattice: { a: 4.15689 },
    wavelength: 1.54056,
    molarMass: 203.78,
    formulaUnitsZ: 1,
    description: 'NIST instrument line profile and high-angle line position reference material.',
    peaks: [
      { id: 'lab-1', twoTheta: 21.356, h: 1, k: 0, l: 0, intensity: 48, enabled: true },
      { id: 'lab-2', twoTheta: 30.385, h: 1, k: 1, l: 0, intensity: 100, enabled: true },
      { id: 'lab-3', twoTheta: 37.441, h: 1, k: 1, l: 1, intensity: 27, enabled: true },
      { id: 'lab-4', twoTheta: 43.506, h: 2, k: 0, l: 0, intensity: 32, enabled: true },
      { id: 'lab-5', twoTheta: 48.961, h: 2, k: 1, l: 0, intensity: 42, enabled: true },
      { id: 'lab-6', twoTheta: 53.993, h: 2, k: 1, l: 1, intensity: 20, enabled: true },
      { id: 'lab-7', twoTheta: 63.220, h: 2, k: 2, l: 0, intensity: 17, enabled: true },
      { id: 'lab-8', twoTheta: 67.533, h: 3, k: 0, l: 0, intensity: 11, enabled: true },
      { id: 'lab-9', twoTheta: 71.693, h: 3, k: 1, l: 0, intensity: 15, enabled: true },
      { id: 'lab-10', twoTheta: 79.734, h: 3, k: 1, l: 1, intensity: 9, enabled: true },
      { id: 'lab-11', twoTheta: 87.525, h: 3, k: 2, l: 0, intensity: 14, enabled: true }
    ]
  },
  {
    name: 'Cerium Dioxide (CeO2 - Fluorite)',
    chemicalFormula: 'CeO2',
    system: 'Cubic',
    refLattice: { a: 5.41110 },
    wavelength: 1.54056,
    molarMass: 172.115,
    formulaUnitsZ: 4,
    description: 'Face-centered cubic fluorite structure with sharp diffraction profiles.',
    peaks: [
      { id: 'ceo-1', twoTheta: 28.553, h: 1, k: 1, l: 1, intensity: 100, enabled: true },
      { id: 'ceo-2', twoTheta: 33.082, h: 2, k: 0, l: 0, intensity: 28, enabled: true },
      { id: 'ceo-3', twoTheta: 47.483, h: 2, k: 2, l: 0, intensity: 52, enabled: true },
      { id: 'ceo-4', twoTheta: 56.342, h: 3, k: 1, l: 1, intensity: 44, enabled: true },
      { id: 'ceo-5', twoTheta: 59.088, h: 2, k: 2, l: 2, intensity: 5, enabled: true },
      { id: 'ceo-6', twoTheta: 69.406, h: 4, k: 0, l: 0, intensity: 7, enabled: true },
      { id: 'ceo-7', twoTheta: 76.701, h: 3, k: 3, l: 1, intensity: 14, enabled: true },
      { id: 'ceo-8', twoTheta: 79.070, h: 4, k: 2, l: 0, intensity: 12, enabled: true },
      { id: 'ceo-9', twoTheta: 88.423, h: 4, k: 2, l: 2, intensity: 10, enabled: true }
    ]
  },
  {
    name: 'Rutile Titanium Dioxide (TiO2)',
    chemicalFormula: 'TiO2',
    system: 'Tetragonal',
    refLattice: { a: 4.5937, c: 2.9587 },
    wavelength: 1.54056,
    molarMass: 79.866,
    formulaUnitsZ: 2,
    description: 'Standard tetragonal oxide, P4_2/mnm space group.',
    peaks: [
      { id: 'tio-1', twoTheta: 27.446, h: 1, k: 1, l: 0, intensity: 100, enabled: true },
      { id: 'tio-2', twoTheta: 36.085, h: 1, k: 0, l: 1, intensity: 50, enabled: true },
      { id: 'tio-3', twoTheta: 39.187, h: 2, k: 0, l: 0, intensity: 8, enabled: true },
      { id: 'tio-4', twoTheta: 41.225, h: 1, k: 1, l: 1, intensity: 25, enabled: true },
      { id: 'tio-5', twoTheta: 54.322, h: 2, k: 1, l: 1, intensity: 60, enabled: true },
      { id: 'tio-6', twoTheta: 56.640, h: 2, k: 2, l: 0, intensity: 20, enabled: true },
      { id: 'tio-7', twoTheta: 62.740, h: 0, k: 0, l: 2, intensity: 10, enabled: true },
      { id: 'tio-8', twoTheta: 64.038, h: 3, k: 1, l: 0, intensity: 10, enabled: true },
      { id: 'tio-9', twoTheta: 69.010, h: 3, k: 0, l: 1, intensity: 20, enabled: true },
      { id: 'tio-10', twoTheta: 69.789, h: 1, k: 1, l: 2, intensity: 12, enabled: true }
    ]
  },
  {
    name: 'Anatase Titanium Dioxide (TiO2)',
    chemicalFormula: 'TiO2',
    system: 'Tetragonal',
    refLattice: { a: 3.7845, c: 9.5143 },
    wavelength: 1.54056,
    molarMass: 79.866,
    formulaUnitsZ: 4,
    description: 'Elongated tetragonal unit cell, I4_1/amd space group.',
    peaks: [
      { id: 'ana-1', twoTheta: 25.281, h: 1, k: 0, l: 1, intensity: 100, enabled: true },
      { id: 'ana-2', twoTheta: 36.947, h: 1, k: 0, l: 3, intensity: 10, enabled: true },
      { id: 'ana-3', twoTheta: 37.801, h: 0, k: 0, l: 4, intensity: 20, enabled: true },
      { id: 'ana-4', twoTheta: 38.576, h: 1, k: 1, l: 2, intensity: 10, enabled: true },
      { id: 'ana-5', twoTheta: 48.050, h: 2, k: 0, l: 0, intensity: 35, enabled: true },
      { id: 'ana-6', twoTheta: 53.891, h: 1, k: 0, l: 5, intensity: 20, enabled: true },
      { id: 'ana-7', twoTheta: 55.061, h: 2, k: 1, l: 1, intensity: 20, enabled: true },
      { id: 'ana-8', twoTheta: 62.689, h: 2, k: 0, l: 4, intensity: 15, enabled: true },
      { id: 'ana-9', twoTheta: 68.761, h: 1, k: 1, l: 6, intensity: 6, enabled: true },
      { id: 'ana-10', twoTheta: 70.309, h: 2, k: 2, l: 0, intensity: 6, enabled: true }
    ]
  },
  {
    name: 'Zinc Oxide (ZnO Wurtzite)',
    chemicalFormula: 'ZnO',
    system: 'Hexagonal',
    refLattice: { a: 3.2498, c: 5.2066 },
    wavelength: 1.54056,
    molarMass: 81.38,
    formulaUnitsZ: 2,
    description: 'Hexagonal wurtzite structure P6_3mc.',
    peaks: [
      { id: 'zno-1', twoTheta: 31.770, h: 1, k: 0, l: 0, intensity: 57, enabled: true },
      { id: 'zno-2', twoTheta: 34.422, h: 0, k: 0, l: 2, intensity: 44, enabled: true },
      { id: 'zno-3', twoTheta: 36.253, h: 1, k: 0, l: 1, intensity: 100, enabled: true },
      { id: 'zno-4', twoTheta: 47.538, h: 1, k: 0, l: 2, intensity: 23, enabled: true },
      { id: 'zno-5', twoTheta: 56.603, h: 1, k: 1, l: 0, intensity: 32, enabled: true },
      { id: 'zno-6', twoTheta: 62.862, h: 1, k: 0, l: 3, intensity: 29, enabled: true },
      { id: 'zno-7', twoTheta: 66.380, h: 2, k: 0, l: 0, intensity: 4, enabled: true },
      { id: 'zno-8', twoTheta: 67.963, h: 1, k: 1, l: 2, intensity: 23, enabled: true },
      { id: 'zno-9', twoTheta: 69.100, h: 2, k: 0, l: 1, intensity: 11, enabled: true },
      { id: 'zno-10', twoTheta: 72.561, h: 0, k: 0, l: 4, intensity: 2, enabled: true }
    ]
  },
  {
    name: 'Alumina Corundum (α-Al2O3 NIST SRM 674a)',
    chemicalFormula: 'Al2O3',
    system: 'Hexagonal',
    refLattice: { a: 4.7587, c: 12.9929 },
    wavelength: 1.54056,
    molarMass: 101.96,
    formulaUnitsZ: 6,
    description: 'Trigonal/Hexagonal R-3c corundum standard.',
    peaks: [
      { id: 'al-1', twoTheta: 25.578, h: 0, k: 1, l: 2, intensity: 65, enabled: true },
      { id: 'al-2', twoTheta: 35.152, h: 1, k: 0, l: 4, intensity: 100, enabled: true },
      { id: 'al-3', twoTheta: 37.776, h: 1, k: 1, l: 0, intensity: 45, enabled: true },
      { id: 'al-4', twoTheta: 43.355, h: 1, k: 1, l: 3, intensity: 90, enabled: true },
      { id: 'al-5', twoTheta: 52.549, h: 0, k: 2, l: 4, intensity: 50, enabled: true },
      { id: 'al-6', twoTheta: 57.496, h: 1, k: 1, l: 6, intensity: 80, enabled: true },
      { id: 'al-7', twoTheta: 66.519, h: 2, k: 1, l: 4, intensity: 40, enabled: true },
      { id: 'al-8', twoTheta: 68.212, h: 3, k: 0, l: 0, intensity: 60, enabled: true }
    ]
  },
  {
    name: 'YBCO High-Tc Superconductor (YBa2Cu3O7)',
    chemicalFormula: 'YBa2Cu3O7',
    system: 'Orthorhombic',
    refLattice: { a: 3.822, b: 3.891, c: 11.681 },
    wavelength: 1.54056,
    molarMass: 666.19,
    formulaUnitsZ: 1,
    description: 'Orthorhombic perovskite cuprate high-temperature superconductor.',
    peaks: [
      { id: 'ybco-1', twoTheta: 22.82, h: 0, k: 0, l: 3, intensity: 15, enabled: true },
      { id: 'ybco-2', twoTheta: 27.88, h: 1, k: 0, l: 2, intensity: 20, enabled: true },
      { id: 'ybco-3', twoTheta: 32.51, h: 1, k: 0, l: 3, intensity: 100, enabled: true },
      { id: 'ybco-4', twoTheta: 32.84, h: 0, k: 1, l: 3, intensity: 85, enabled: true },
      { id: 'ybco-5', twoTheta: 38.51, h: 1, k: 0, l: 4, intensity: 25, enabled: true },
      { id: 'ybco-6', twoTheta: 46.54, h: 2, k: 0, l: 0, intensity: 35, enabled: true },
      { id: 'ybco-7', twoTheta: 47.47, h: 0, k: 2, l: 0, intensity: 35, enabled: true },
      { id: 'ybco-8', twoTheta: 58.12, h: 2, k: 1, l: 3, intensity: 30, enabled: true },
      { id: 'ybco-9', twoTheta: 68.32, h: 2, k: 2, l: 0, intensity: 15, enabled: true }
    ]
  },
  {
    name: 'Baddeleyite Monoclinic Zirconia (ZrO2)',
    chemicalFormula: 'ZrO2',
    system: 'Monoclinic',
    refLattice: { a: 5.150, b: 5.212, c: 5.317, betaDeg: 99.23 },
    wavelength: 1.54056,
    molarMass: 123.22,
    formulaUnitsZ: 4,
    description: 'Monoclinic room-temperature zirconia phase P2_1/c.',
    peaks: [
      { id: 'zro-1', twoTheta: 24.048, h: 0, k: 1, l: 1, intensity: 22, enabled: true },
      { id: 'zro-2', twoTheta: 28.175, h: -1, k: 1, l: 1, intensity: 100, enabled: true },
      { id: 'zro-3', twoTheta: 31.468, h: 1, k: 1, l: 1, intensity: 68, enabled: true },
      { id: 'zro-4', twoTheta: 34.167, h: 2, k: 0, l: 0, intensity: 25, enabled: true },
      { id: 'zro-5', twoTheta: 34.398, h: 0, k: 2, l: 0, intensity: 20, enabled: true },
      { id: 'zro-6', twoTheta: 35.309, h: 0, k: 0, l: 2, intensity: 18, enabled: true },
      { id: 'zro-7', twoTheta: 40.731, h: -1, k: 2, l: 1, intensity: 14, enabled: true },
      { id: 'zro-8', twoTheta: 41.173, h: 1, k: 2, l: 1, intensity: 16, enabled: true },
      { id: 'zro-9', twoTheta: 49.278, h: -2, k: 2, l: 1, intensity: 18, enabled: true },
      { id: 'zro-10', twoTheta: 50.124, h: 2, k: 2, l: 0, intensity: 22, enabled: true }
    ]
  }
];
