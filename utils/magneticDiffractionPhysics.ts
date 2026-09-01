import { LatticeParameters } from '../types';
import { calculateDSpacing, calculateCellVolume, NEUTRON_SCATTERING_LENGTHS } from './physics';

// ==========================================
// INTERFACES & TYPES
// ==========================================

export interface MagneticAtom {
  id: string;
  element: string;
  label: string;
  b: number; // Nuclear scattering length in fm (10^-15 m)
  x: number; // Fractional coord x
  y: number; // Fractional coord y
  z: number; // Fractional coord z
  B_iso: number; // Debye-Waller isotropic thermal factor (Å^2)
  mx: number; // Magnetic moment x-component in Bohr magnetons (μB)
  my: number; // Magnetic moment y-component in Bohr magnetons (μB)
  mz: number; // Magnetic moment z-component in Bohr magnetons (μB)
  ion?: string; // e.g. "Fe3+", "Mn2+", "Ni2+", "Dy3+"
  gFactor?: number; // Landé g-factor (default ~2.0)
  spinJ?: number; // Total angular momentum J or Spin S
}

export interface MagneticFormFactorCoeffs {
  A: number; a: number;
  B: number; b: number;
  C: number; c: number;
  D: number;
  // Optional j2 coefficients for orbital contributions
  A2?: number; a2?: number;
  B2?: number; b2?: number;
  C2?: number; c2?: number;
  D2?: number;
}

export type MagneticOrderType = 
  | 'Paramagnetic (PM)'
  | 'Ferromagnetic (FM)'
  | 'Antiferromagnetic (AFM)'
  | 'Ferrimagnetic (FiM)'
  | 'Canted Weak Ferromagnetic'
  | 'Helimagnetic / Spiral'
  | 'Incommensurate Spin Density Wave (SDW)'
  | 'Cycloidal Multiferroic'
  | 'Non-Collinear Spin Ice';

export type CriticalExponentModel = '3D-Heisenberg' | '3D-Ising' | '3D-XY' | 'Mean-Field' | '2D-Ising';

export interface PolarizationConfig {
  mode: 'unpolarized' | 'polarized_z_up' | 'polarized_z_down' | 'xyz_polarimetry';
  guideFieldDirection: { x: number; y: number; z: number };
  polarizationEfficiency: number; // P_0 in [0, 1], typically 0.95 - 0.98
  flipperEfficiency: number; // F in [0, 1], typically 0.99
}

export interface MagneticReflection {
  hkl: [number, number, number];
  qVector: [number, number, number]; // [qh, qk, ql] in r.l.u.
  twoTheta: number; // degrees
  dSpacing: number; // Angstroms
  qMagnitude: number; // Å^-1
  nuclearIntensity: number;
  magneticIntensity: number;
  totalIntensity: number;
  polarizedUpIntensity?: number;
  polarizedDownIntensity?: number;
  flippingRatio?: number;
  spinFlipIntensity?: number;
  nonSpinFlipIntensity?: number;
  chiralAsymmetry?: number;
  F_nuclear_real: number;
  F_nuclear_imag: number;
  F_mag_perp_mag: number;
  F_mag_perp_vec: { x: number; y: number; z: number };
  magneticInteractionVectorQ: { x: number; y: number; z: number };
  formFactor: number;
  lorentzFactor: number;
  multiplicity: number;
  isSatellite: boolean;
  satelliteSign?: 1 | -1 | 0;
  label: string;
}

export interface MagneticMetrics {
  orderType: MagneticOrderType;
  orderParameter: number; // M(T)/M(0) in [0, 1]
  netMoment0K: { x: number; y: number; z: number; mag: number };
  netMomentT: { x: number; y: number; z: number; mag: number };
  totalSublatticeMoment0K: number;
  totalSublatticeMomentT: number;
  cellVolume: number;
  nuclearSLD: number; // 10^-6 Å^-2
  magneticSLD: number; // 10^-6 Å^-2
  cantingAngleDeg: number;
  spiralPitchAngstrom: number | null;
  curieConstant: number; // emu·K/mol
  weissConstant: number; // K
  effectiveBohrMagneton: number; // μ_eff
  frustrationIndex: number; // |θ_CW| / T_N
}

export interface MagneticStructurePreset {
  id: string;
  name: string;
  formula: string;
  description: string;
  lattice: LatticeParameters;
  kVector: { x: number; y: number; z: number };
  temperature: number;
  criticalTemp: number;
  orderType: MagneticOrderType;
  exponentModel: CriticalExponentModel;
  atoms: MagneticAtom[];
  reference: string;
}

// ==========================================
// MAGNETIC FORM FACTOR COEFFICIENTS (International Tables Vol C)
// ==========================================

export const EXTENDED_MAGNETIC_FORM_FACTORS: Record<string, MagneticFormFactorCoeffs> = {
  // 3d Transition Metals
  'Ti3+': { A: 0.4468, a: 28.526, B: 0.5847, b: 11.667, C: 0.0543, c: 3.829, D: -0.0858 },
  'V2+':  { A: 0.3804, a: 22.046, B: 0.6385, b: 9.387, C: 0.0487, c: 3.011, D: -0.0676 },
  'V3+':  { A: 0.4326, a: 23.238, B: 0.5982, b: 9.949, C: 0.0427, c: 3.193, D: -0.0735 },
  'V4+':  { A: 0.4721, a: 24.316, B: 0.5701, b: 10.457, C: 0.0381, c: 3.358, D: -0.0803 },
  'Cr2+': { A: 0.3541, a: 18.212, B: 0.6698, b: 7.954, C: 0.0435, c: 2.502, D: -0.0674 },
  'Cr3+': { A: 0.3954, a: 19.382, B: 0.6347, b: 8.441, C: 0.0378, c: 2.659, D: -0.0679 },
  'Cr4+': { A: 0.4385, a: 20.485, B: 0.6033, b: 8.916, C: 0.0326, c: 2.809, D: -0.0744 },
  'Mn2+': { A: 0.3629, a: 15.275, B: 0.6759, b: 6.812, C: 0.0410, c: 2.148, D: -0.0798 },
  'Mn3+': { A: 0.3842, a: 16.321, B: 0.6558, b: 7.279, C: 0.0354, c: 2.278, D: -0.0754 },
  'Mn4+': { A: 0.4181, a: 17.348, B: 0.6301, b: 7.724, C: 0.0299, c: 2.404, D: -0.0781 },
  'Fe2+': { A: 0.3725, a: 13.064, B: 0.6781, b: 5.922, C: 0.0378, c: 1.865, D: -0.0884 },
  'Fe3+': { A: 0.3972, a: 13.244, B: 0.6295, b: 4.903, C: 0.0314, c: 0.349, D: -0.0581 },
  'Fe4+': { A: 0.4079, a: 14.887, B: 0.6483, b: 6.745, C: 0.0279, c: 2.086, D: -0.0841 },
  'Co2+': { A: 0.3820, a: 11.365, B: 0.6791, b: 5.215, C: 0.0347, c: 1.638, D: -0.0958 },
  'Co3+': { A: 0.3986, a: 12.338, B: 0.6657, b: 5.642, C: 0.0298, c: 1.764, D: -0.0941 },
  'Ni2+': { A: 0.3916, a: 10.025, B: 0.6789, b: 4.646, C: 0.0318, c: 1.455, D: -0.1023 },
  'Ni3+': { A: 0.4075, a: 10.923, B: 0.6681, b: 5.019, C: 0.0270, c: 1.564, D: -0.1026 },
  'Cu2+': { A: 0.4009, a: 8.948, B: 0.6775, b: 4.181, C: 0.0291, c: 1.305, D: -0.1075 },

  // 4d / 5d Transition Metals
  'Ru3+': { A: 0.2874, a: 9.421, B: 0.7241, b: 3.842, C: 0.0452, c: 1.150, D: -0.0567 },
  'Rh3+': { A: 0.2981, a: 8.812, B: 0.7185, b: 3.521, C: 0.0421, c: 1.050, D: -0.0587 },
  'Ir4+': { A: 0.2450, a: 7.210, B: 0.7620, b: 2.850, C: 0.0390, c: 0.850, D: -0.0460 },
  'Os4+': { A: 0.2510, a: 7.450, B: 0.7550, b: 2.920, C: 0.0410, c: 0.880, D: -0.0470 },

  // 4f Rare Earth Ions
  'Ce3+': { A: 0.1741, a: 16.541, B: 0.4682, b: 7.234, C: 0.3789, c: 2.654, D: -0.0212 },
  'Pr3+': { A: 0.1824, a: 15.342, B: 0.4721, b: 6.812, C: 0.3695, c: 2.510, D: -0.0240 },
  'Nd3+': { A: 0.1912, a: 14.285, B: 0.4765, b: 6.425, C: 0.3582, c: 2.380, D: -0.0259 },
  'Sm3+': { A: 0.2084, a: 12.450, B: 0.4851, b: 5.760, C: 0.3354, c: 2.150, D: -0.0289 },
  'Eu2+': { A: 0.2215, a: 11.230, B: 0.4910, b: 5.250, C: 0.3180, c: 1.980, D: -0.0305 },
  'Eu3+': { A: 0.2185, a: 11.680, B: 0.4895, b: 5.480, C: 0.3225, c: 2.050, D: -0.0305 },
  'Gd3+': { A: 0.2285, a: 10.985, B: 0.4950, b: 5.120, C: 0.3065, c: 1.920, D: -0.0300 },
  'Tb3+': { A: 0.2390, a: 10.150, B: 0.5010, b: 4.810, C: 0.2910, c: 1.810, D: -0.0310 },
  'Dy3+': { A: 0.2485, a: 9.420,  B: 0.5065, b: 4.520, C: 0.2765, c: 1.710, D: -0.0315 },
  'Ho3+': { A: 0.2580, a: 8.780,  B: 0.5120, b: 4.260, C: 0.2620, c: 1.620, D: -0.0320 },
  'Er3+': { A: 0.2675, a: 8.210,  B: 0.5175, b: 4.020, C: 0.2485, c: 1.530, D: -0.0335 },
  'Tm3+': { A: 0.2760, a: 7.690,  B: 0.5230, b: 3.790, C: 0.2350, c: 1.450, D: -0.0340 },
  'Yb3+': { A: 0.2850, a: 7.220,  B: 0.5280, b: 3.580, C: 0.2210, c: 1.370, D: -0.0340 }
};

// ==========================================
// CURATED LANDMARK MAGNETIC PRESETS
// ==========================================

export const PRESET_MAGNETIC_STRUCTURES: MagneticStructurePreset[] = [
  {
    id: 'mno_afm',
    name: 'MnO (Rock-salt AFM II)',
    formula: 'MnO',
    description: 'Nobel-Prize winning landmark: Shull & Smart (1951) first direct observation of antiferromagnetism via neutron diffraction. {111} ferromagnetic sheets coupled antiferromagnetically.',
    lattice: { a: 4.445, b: 4.445, c: 4.445, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0.5, y: 0.5, z: 0.5 },
    temperature: 10,
    criticalTemp: 118,
    orderType: 'Antiferromagnetic (AFM)',
    exponentModel: '3D-Heisenberg',
    reference: 'Shull, Strauser & Wollan, Phys. Rev. 83, 333 (1951)',
    atoms: [
      { id: 'mn1', element: 'Mn', label: 'Mn (0,0,0)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.45, mx: 3.24, my: 3.24, mz: 0, ion: 'Mn2+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'mn2', element: 'Mn', label: 'Mn (1/2,1/2,0)', b: -3.73, x: 0.5, y: 0.5, z: 0, B_iso: 0.45, mx: 3.24, my: 3.24, mz: 0, ion: 'Mn2+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'mn3', element: 'Mn', label: 'Mn (0,1/2,1/2)', b: -3.73, x: 0, y: 0.5, z: 0.5, B_iso: 0.45, mx: -3.24, my: -3.24, mz: 0, ion: 'Mn2+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'mn4', element: 'Mn', label: 'Mn (1/2,0,1/2)', b: -3.73, x: 0.5, y: 0, z: 0.5, B_iso: 0.45, mx: -3.24, my: -3.24, mz: 0, ion: 'Mn2+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'o1', element: 'O', label: 'O (1/2,0,0)', b: 5.803, x: 0.5, y: 0, z: 0, B_iso: 0.45, mx: 0, my: 0, mz: 0 },
      { id: 'o2', element: 'O', label: 'O (0,1/2,0)', b: 5.803, x: 0, y: 0.5, z: 0, B_iso: 0.45, mx: 0, my: 0, mz: 0 },
      { id: 'o3', element: 'O', label: 'O (0,0,1/2)', b: 5.803, x: 0, y: 0, z: 0.5, B_iso: 0.45, mx: 0, my: 0, mz: 0 },
      { id: 'o4', element: 'O', label: 'O (1/2,1/2,1/2)', b: 5.803, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.45, mx: 0, my: 0, mz: 0 },
    ]
  },
  {
    id: 'hematite_fe2o3',
    name: 'α-Fe2O3 Hematite (Canted Weak FM)',
    formula: 'α-Fe2O3',
    description: 'Corundum structure with Dzyaloshinskii-Moriya spin canting above Morin transition (TM = 260 K) yielding weak spontaneous ferromagnetism.',
    lattice: { a: 5.035, b: 5.035, c: 13.75, alpha: 90, beta: 90, gamma: 120 },
    kVector: { x: 0, y: 0, z: 0 },
    temperature: 295,
    criticalTemp: 955,
    orderType: 'Canted Weak Ferromagnetic',
    exponentModel: '3D-Heisenberg',
    reference: 'Dzyaloshinsky, J. Phys. Chem. Solids 4, 241 (1958)',
    atoms: [
      { id: 'fe1', element: 'Fe', label: 'Fe1 (+canting)', b: 9.45, x: 0, y: 0, z: 0.355, B_iso: 0.4, mx: 4.15, my: 0.08, mz: 0, ion: 'Fe3+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'fe2', element: 'Fe', label: 'Fe2 (-canting)', b: 9.45, x: 0, y: 0, z: 0.645, B_iso: 0.4, mx: -4.15, my: 0.08, mz: 0, ion: 'Fe3+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'fe3', element: 'Fe', label: 'Fe3 (+canting)', b: 9.45, x: 0, y: 0, z: 0.855, B_iso: 0.4, mx: 4.15, my: 0.08, mz: 0, ion: 'Fe3+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'fe4', element: 'Fe', label: 'Fe4 (-canting)', b: 9.45, x: 0, y: 0, z: 0.145, B_iso: 0.4, mx: -4.15, my: 0.08, mz: 0, ion: 'Fe3+', gFactor: 2.0, spinJ: 2.5 },
      { id: 'o1', element: 'O', label: 'O1', b: 5.803, x: 0.306, y: 0, z: 0.25, B_iso: 0.5, mx: 0, my: 0, mz: 0 },
      { id: 'o2', element: 'O', label: 'O2', b: 5.803, x: 0, y: 0.306, z: 0.25, B_iso: 0.5, mx: 0, my: 0, mz: 0 }
    ]
  },
  {
    id: 'fe3o4_spinel',
    name: 'Fe3O4 Magnetite (Inverse Spinel FiM)',
    formula: 'Fe3O4',
    description: 'Classical Néel ferrimagnet: antiparallel alignment between tetrahedral Fe3+ (A-site) and octahedral Fe2+/Fe3+ (B-site) sublattices.',
    lattice: { a: 8.396, b: 8.396, c: 8.396, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0, y: 0, z: 0 },
    temperature: 300,
    criticalTemp: 858,
    orderType: 'Ferrimagnetic (FiM)',
    exponentModel: '3D-Heisenberg',
    reference: 'Shull, Wollan & Koehler, Phys. Rev. 84, 912 (1951)',
    atoms: [
      { id: 'fe_a1', element: 'Fe', label: 'Fe(A) Tet 1', b: 9.45, x: 0, y: 0, z: 0, B_iso: 0.4, mx: 0, my: 0, mz: -4.1, ion: 'Fe3+', gFactor: 2.0 },
      { id: 'fe_a2', element: 'Fe', label: 'Fe(A) Tet 2', b: 9.45, x: 0.25, y: 0.25, z: 0.25, B_iso: 0.4, mx: 0, my: 0, mz: -4.1, ion: 'Fe3+', gFactor: 2.0 },
      { id: 'fe_b1', element: 'Fe', label: 'Fe(B) Oct 1', b: 9.45, x: 0.625, y: 0.625, z: 0.625, B_iso: 0.4, mx: 0, my: 0, mz: 3.8, ion: 'Fe3+', gFactor: 2.0 },
      { id: 'fe_b2', element: 'Fe', label: 'Fe(B) Oct 2', b: 9.45, x: 0.625, y: 0.125, z: 0.125, B_iso: 0.4, mx: 0, my: 0, mz: 3.8, ion: 'Fe2+', gFactor: 2.0 },
      { id: 'fe_b3', element: 'Fe', label: 'Fe(B) Oct 3', b: 9.45, x: 0.125, y: 0.625, z: 0.125, B_iso: 0.4, mx: 0, my: 0, mz: 3.8, ion: 'Fe3+', gFactor: 2.0 },
      { id: 'fe_b4', element: 'Fe', label: 'Fe(B) Oct 4', b: 9.45, x: 0.125, y: 0.125, z: 0.625, B_iso: 0.4, mx: 0, my: 0, mz: 3.8, ion: 'Fe2+', gFactor: 2.0 },
      { id: 'o1', element: 'O', label: 'O1', b: 5.803, x: 0.380, y: 0.380, z: 0.380, B_iso: 0.5, mx: 0, my: 0, mz: 0 },
      { id: 'o2', element: 'O', label: 'O2', b: 5.803, x: 0.880, y: 0.880, z: 0.880, B_iso: 0.5, mx: 0, my: 0, mz: 0 }
    ]
  },
  {
    id: 'cr_sdw',
    name: 'Cr (Incommensurate Spin Density Wave)',
    formula: 'Cr',
    description: 'BCC metal exhibiting longitudinal/transverse spin density wave (SDW) modulation with propagation vector k = [0, 0, 0.952] (incommensurate satellite doublet peaks).',
    lattice: { a: 2.884, b: 2.884, c: 2.884, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0, y: 0, z: 0.952 },
    temperature: 15,
    criticalTemp: 311,
    orderType: 'Incommensurate Spin Density Wave (SDW)',
    exponentModel: '3D-Ising',
    reference: 'Fawcett, Rev. Mod. Phys. 60, 209 (1988)',
    atoms: [
      { id: 'cr1', element: 'Cr', label: 'Cr (Corner)', b: 3.635, x: 0, y: 0, z: 0, B_iso: 0.3, mx: 0, my: 0, mz: 0.62, ion: 'Cr3+', gFactor: 2.0 },
      { id: 'cr2', element: 'Cr', label: 'Cr (Body-Center)', b: 3.635, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.3, mx: 0, my: 0, mz: -0.62, ion: 'Cr3+', gFactor: 2.0 }
    ]
  },
  {
    id: 'mnsi_chiral',
    name: 'MnSi (Chiral Helimagnet / Skyrmion Host)',
    formula: 'MnSi',
    description: 'B20 non-centrosymmetric cubic structure with Dzyaloshinskii-Moriya interaction yielding long-period (λ = 18 nm) helical modulation along [111].',
    lattice: { a: 4.558, b: 4.558, c: 4.558, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0.017, y: 0.017, z: 0.017 },
    temperature: 10,
    criticalTemp: 29.5,
    orderType: 'Helimagnetic / Spiral',
    exponentModel: '3D-XY',
    reference: 'Mühlbauer et al., Science 323, 915 (2009)',
    atoms: [
      { id: 'mn1', element: 'Mn', label: 'Mn1', b: -3.73, x: 0.138, y: 0.138, z: 0.138, B_iso: 0.4, mx: 0.38, my: 0.12, mz: 0, ion: 'Mn2+' },
      { id: 'mn2', element: 'Mn', label: 'Mn2', b: -3.73, x: 0.638, y: 0.862, z: 0.362, B_iso: 0.4, mx: -0.12, my: 0.38, mz: 0, ion: 'Mn2+' },
      { id: 'mn3', element: 'Mn', label: 'Mn3', b: -3.73, x: 0.362, y: 0.638, z: 0.862, B_iso: 0.4, mx: 0, my: -0.38, mz: 0.12, ion: 'Mn2+' },
      { id: 'mn4', element: 'Mn', label: 'Mn4', b: -3.73, x: 0.862, y: 0.362, z: 0.638, B_iso: 0.4, mx: 0, my: 0, mz: -0.40, ion: 'Mn2+' },
      { id: 'si1', element: 'Si', label: 'Si1', b: 4.149, x: 0.845, y: 0.845, z: 0.845, B_iso: 0.4, mx: 0, my: 0, mz: 0 }
    ]
  },
  {
    id: 'bifeo3_cycloid',
    name: 'BiFeO3 (Multiferroic Cycloidal Spiral)',
    formula: 'BiFeO3',
    description: 'Room-temperature multiferroic perovskite with ferroelectric polarization along [111] and cycloidal spin spiral with wavelength λ = 62 nm.',
    lattice: { a: 5.58, b: 5.58, c: 13.87, alpha: 90, beta: 90, gamma: 120 },
    kVector: { x: 0.0045, y: 0.0045, z: 0.0 },
    temperature: 300,
    criticalTemp: 643,
    orderType: 'Cycloidal Multiferroic',
    exponentModel: '3D-Heisenberg',
    reference: 'Sosnowska et al., J. Phys. C: Solid State Phys. 15, 4835 (1982)',
    atoms: [
      { id: 'bi1', element: 'Bi', label: 'Bi1', b: 8.532, x: 0, y: 0, z: 0, B_iso: 0.6, mx: 0, my: 0, mz: 0 },
      { id: 'fe1', element: 'Fe', label: 'Fe1 (+spiral)', b: 9.45, x: 0, y: 0, z: 0.221, B_iso: 0.4, mx: 3.75, my: 0.35, mz: 0, ion: 'Fe3+', gFactor: 2.0 },
      { id: 'fe2', element: 'Fe', label: 'Fe2 (-spiral)', b: 9.45, x: 0, y: 0, z: 0.721, B_iso: 0.4, mx: -3.75, my: -0.35, mz: 0, ion: 'Fe3+', gFactor: 2.0 },
      { id: 'o1', element: 'O', label: 'O1', b: 5.803, x: 0.538, y: 0.538, z: 0.395, B_iso: 0.5, mx: 0, my: 0, mz: 0 }
    ]
  },
  {
    id: 'ybco6_parent_afm',
    name: 'YBa2Cu3O6 (High-Tc Parent AFM)',
    formula: 'YBa2Cu3O6',
    description: 'Parent undoped insulator of the YBCO cuprate superconductor. S=1/2 Cu2+ ions in CuO2 planes order in a collinear AFM arrangement.',
    lattice: { a: 3.86, b: 3.86, c: 11.82, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0.5, y: 0.5, z: 0.0 },
    temperature: 10,
    criticalTemp: 415,
    orderType: 'Antiferromagnetic (AFM)',
    exponentModel: '2D-Ising',
    reference: 'Tranquada et al., Phys. Rev. Lett. 60, 156 (1988)',
    atoms: [
      { id: 'y1', element: 'Y', label: 'Y', b: 7.75, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4, mx: 0, my: 0, mz: 0 },
      { id: 'ba1', element: 'Ba', label: 'Ba1', b: 5.07, x: 0.5, y: 0.5, z: 0.194, B_iso: 0.5, mx: 0, my: 0, mz: 0 },
      { id: 'ba2', element: 'Ba', label: 'Ba2', b: 5.07, x: 0.5, y: 0.5, z: 0.806, B_iso: 0.5, mx: 0, my: 0, mz: 0 },
      { id: 'cu1', element: 'Cu', label: 'Cu1 (Chain non-mag)', b: 7.718, x: 0, y: 0, z: 0, B_iso: 0.4, mx: 0, my: 0, mz: 0 },
      { id: 'cu2_1', element: 'Cu', label: 'Cu2 Plane (Up)', b: 7.718, x: 0, y: 0, z: 0.360, B_iso: 0.4, mx: 0.64, my: 0, mz: 0, ion: 'Cu2+', gFactor: 2.1 },
      { id: 'cu2_2', element: 'Cu', label: 'Cu2 Plane (Down)', b: 7.718, x: 0, y: 0, z: 0.640, B_iso: 0.4, mx: -0.64, my: 0, mz: 0, ion: 'Cu2+', gFactor: 2.1 },
      { id: 'o1', element: 'O', label: 'O(Plane) 1', b: 5.803, x: 0.5, y: 0, z: 0.380, B_iso: 0.5, mx: 0, my: 0, mz: 0 },
      { id: 'o2', element: 'O', label: 'O(Plane) 2', b: 5.803, x: 0, y: 0.5, z: 0.380, B_iso: 0.5, mx: 0, my: 0, mz: 0 }
    ]
  },
  {
    id: 'fe_ferro_bcc',
    name: 'α-Fe Iron (BCC Ferromagnet)',
    formula: 'Fe',
    description: 'Prototypical ferromagnet with Tc = 1043 K, saturation moment 2.22 μB/atom aligned along <100> easy axis.',
    lattice: { a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0, y: 0, z: 0 },
    temperature: 300,
    criticalTemp: 1043,
    orderType: 'Ferromagnetic (FM)',
    exponentModel: '3D-Heisenberg',
    reference: 'Shull & Wilkinson, Phys. Rev. 97, 304 (1955)',
    atoms: [
      { id: 'fe1', element: 'Fe', label: 'Fe (0,0,0)', b: 9.45, x: 0, y: 0, z: 0, B_iso: 0.35, mx: 0, my: 0, mz: 2.22, ion: 'Fe3+', gFactor: 2.09 },
      { id: 'fe2', element: 'Fe', label: 'Fe (1/2,1/2,1/2)', b: 9.45, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.35, mx: 0, my: 0, mz: 2.22, ion: 'Fe3+', gFactor: 2.09 }
    ]
  },
  {
    id: 'spin_ice_dy2ti2o7',
    name: 'Dy2Ti2O7 (Pyrochlore Spin Ice)',
    formula: 'Dy2Ti2O7',
    description: 'Geometrically frustrated pyrochlore lattice with 2-in-2-out local <111> Ising anisotropy creating emergent magnetic monopoles and Pauling residual entropy.',
    lattice: { a: 10.12, b: 10.12, c: 10.12, alpha: 90, beta: 90, gamma: 90 },
    kVector: { x: 0, y: 0, z: 0 },
    temperature: 0.3,
    criticalTemp: 1.1,
    orderType: 'Non-Collinear Spin Ice',
    exponentModel: '3D-Ising',
    reference: 'Bramwell & Gingras, Science 294, 1495 (2001)',
    atoms: [
      { id: 'dy1', element: 'Dy', label: 'Dy1 (In)', b: 16.9, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.3, mx: 5.77, my: 5.77, mz: 5.77, ion: 'Dy3+', gFactor: 1.33 },
      { id: 'dy2', element: 'Dy', label: 'Dy2 (In)', b: 16.9, x: 0.5, y: 0.25, z: 0.25, B_iso: 0.3, mx: 5.77, my: -5.77, mz: -5.77, ion: 'Dy3+', gFactor: 1.33 },
      { id: 'dy3', element: 'Dy', label: 'Dy3 (Out)', b: 16.9, x: 0.25, y: 0.5, z: 0.25, B_iso: 0.3, mx: -5.77, my: 5.77, mz: -5.77, ion: 'Dy3+', gFactor: 1.33 },
      { id: 'dy4', element: 'Dy', label: 'Dy4 (Out)', b: 16.9, x: 0.25, y: 0.25, z: 0.5, B_iso: 0.3, mx: -5.77, my: -5.77, mz: 5.77, ion: 'Dy3+', gFactor: 1.33 },
      { id: 'ti1', element: 'Ti', label: 'Ti1', b: -3.438, x: 0, y: 0, z: 0, B_iso: 0.4, mx: 0, my: 0, mz: 0 }
    ]
  }
];

// ==========================================
// CORE SCIENTIFIC FUNCTIONS
// ==========================================

/**
 * Calculates the temperature-dependent magnetization factor M(T)/M(0)
 * using the chosen critical universality class exponent beta or Mean-Field Brillouin behavior.
 */
export const calculateTemperatureOrderParameter = (
  T: number,
  Tc: number,
  model: CriticalExponentModel = '3D-Heisenberg'
): number => {
  if (Tc <= 0 || T >= Tc) return 0.0;
  const reducedT = Math.max(0, 1 - T / Tc);

  let beta = 0.365; // 3D Heisenberg default
  switch (model) {
    case '3D-Heisenberg': beta = 0.365; break;
    case '3D-Ising': beta = 0.326; break;
    case '3D-XY': beta = 0.345; break;
    case 'Mean-Field': beta = 0.500; break;
    case '2D-Ising': beta = 0.125; break;
  }

  return Math.pow(reducedT, beta);
};

/**
 * Calculates the spherical magnetic form factor <j0(s)> for a specific ion
 * where s = sin(theta) / lambda = Q / (4*pi) in Å^-1.
 */
export const calculateMagneticFormFactor = (ionName: string | undefined, s: number): number => {
  if (!ionName) return Math.exp(-4.0 * s * s); // Default Gaussian approximation
  const coeff = EXTENDED_MAGNETIC_FORM_FACTORS[ionName];
  if (!coeff) return Math.exp(-4.0 * s * s);

  const s2 = s * s;
  const j0 = coeff.A * Math.exp(-coeff.a * s2) +
             coeff.B * Math.exp(-coeff.b * s2) +
             coeff.C * Math.exp(-coeff.c * s2) +
             coeff.D;

  return Math.max(0, j0);
};

/**
 * Computes full magnetic and nuclear neutron diffraction reflections,
 * including polarization cross sections, flipping ratios, and incommensurate satellites.
 */
export const calculateAdvancedMagneticDiffraction = (
  wavelength: number,
  lattice: LatticeParameters,
  atoms: MagneticAtom[],
  maxTwoTheta: number = 110,
  kVector: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  temperature: number = 10,
  criticalTemp: number = 300,
  exponentModel: CriticalExponentModel = '3D-Heisenberg',
  polarizationConfig: PolarizationConfig = {
    mode: 'unpolarized',
    guideFieldDirection: { x: 0, y: 0, z: 1 },
    polarizationEfficiency: 0.96,
    flipperEfficiency: 0.99
  }
): { reflections: MagneticReflection[]; metrics: MagneticMetrics } => {
  const reflections: MagneticReflection[] = [];
  const { a, b, c } = lattice;
  if (a <= 0 || b <= 0 || c <= 0 || wavelength <= 0) {
    return {
      reflections: [],
      metrics: getEmptyMetrics(lattice, atoms)
    };
  }

  const maxSinTheta = Math.sin((maxTwoTheta / 2) * (Math.PI / 180));
  const maxDim = Math.max(a, b, c);
  const maxIndex = Math.ceil((2 * maxDim * maxSinTheta) / wavelength) + 1;

  const tempFactor = calculateTemperatureOrderParameter(temperature, criticalTemp, exponentModel);
  const isKZero = Math.abs(kVector.x) < 1e-4 && Math.abs(kVector.y) < 1e-4 && Math.abs(kVector.z) < 1e-4;

  const P_eff = polarizationConfig.polarizationEfficiency;
  const G = polarizationConfig.guideFieldDirection;
  const G_mag = Math.sqrt(G.x * G.x + G.y * G.y + G.z * G.z) || 1.0;
  const Ghat = { x: G.x / G_mag, y: G.y / G_mag, z: G.z / G_mag };

  const addReflectionCandidate = (
    h: number, k: number, l: number,
    qh: number, qk: number, ql: number,
    isSatellite: boolean,
    satDirection: 1 | -1 | 0
  ) => {
    // Exclude 0,0,0
    if (Math.abs(qh) < 1e-4 && Math.abs(qk) < 1e-4 && Math.abs(ql) < 1e-4) return;

    const d = calculateDSpacing(qh, qk, ql, lattice);
    if (!isFinite(d) || d <= 0) return;

    const sinTheta = wavelength / (2 * d);
    if (sinTheta > 1 || sinTheta > maxSinTheta) return;

    const s = sinTheta / wavelength; // s = sin(theta)/lambda
    const theta = Math.asin(sinTheta);
    const twoTheta = 2 * theta * (180 / Math.PI);
    const Qmag = (4 * Math.PI * sinTheta) / wavelength;

    // Lorentz-Polarization factor for unpolarized / non-monochromated neutron powder
    const L = 1 / (sinTheta * Math.sin(2 * theta));

    // 1. NUCLEAR STRUCTURE FACTOR: F_N = sum b_j exp(-B_j s^2) exp(2pi i (h x + k y + l z))
    let Fn_r = 0;
    let Fn_i = 0;
    if (!isSatellite) {
      for (const atom of atoms) {
        const phase = 2 * Math.PI * (h * atom.x + k * atom.y + l * atom.z);
        const dw = Math.exp(-atom.B_iso * s * s);
        const atom_b = atom.b || 0;
        Fn_r += atom_b * dw * Math.cos(phase);
        Fn_i += atom_b * dw * Math.sin(phase);
      }
    }
    const In = (Fn_r * Fn_r + Fn_i * Fn_i) * L;

    // 2. MAGNETIC INTERACTION VECTOR: M_perp = Q_hat x (M x Q_hat) = M - (M . Q_hat) Q_hat
    const Qcart = {
      x: (qh / a),
      y: (qk / b),
      z: (ql / c)
    };
    const QcartMag = Math.sqrt(Qcart.x * Qcart.x + Qcart.y * Qcart.y + Qcart.z * Qcart.z) || 1.0;
    const Qhat = { x: Qcart.x / QcartMag, y: Qcart.y / QcartMag, z: Qcart.z / QcartMag };

    let Fm_r = { x: 0, y: 0, z: 0 };
    let Fm_i = { x: 0, y: 0, z: 0 };
    let avgFormFactor = 0;
    let magAtomCount = 0;

    for (const atom of atoms) {
      const phase = 2 * Math.PI * (qh * atom.x + qk * atom.y + ql * atom.z);
      const dw = Math.exp(-atom.B_iso * s * s);
      const ff = calculateMagneticFormFactor(atom.ion, s);
      avgFormFactor += ff;
      magAtomCount++;

      const mx = (atom.mx || 0) * tempFactor;
      const my = (atom.my || 0) * tempFactor;
      const mz = (atom.mz || 0) * tempFactor;

      const MdotQ = mx * Qhat.x + my * Qhat.y + mz * Qhat.z;
      // p = gamma * r_0 / 2 = 0.2695 * 10^-12 cm / μB = 2.695 fm / μB
      const p_factor = 2.695;
      const weight = p_factor * ff * dw;

      const compX = mx - MdotQ * Qhat.x;
      const compY = my - MdotQ * Qhat.y;
      const compZ = mz - MdotQ * Qhat.z;

      Fm_r.x += weight * compX * Math.cos(phase);
      Fm_r.y += weight * compY * Math.cos(phase);
      Fm_r.z += weight * compZ * Math.cos(phase);

      Fm_i.x += weight * compX * Math.sin(phase);
      Fm_i.y += weight * compY * Math.sin(phase);
      Fm_i.z += weight * compZ * Math.sin(phase);
    }

    if (magAtomCount > 0) avgFormFactor /= magAtomCount;

    let Im_mag_sq = (Fm_r.x * Fm_r.x + Fm_i.x * Fm_i.x) +
                    (Fm_r.y * Fm_r.y + Fm_i.y * Fm_i.y) +
                    (Fm_r.z * Fm_r.z + Fm_i.z * Fm_i.z);

    if (isSatellite) {
      Im_mag_sq *= 0.5; // Satellite wave splitting factor
    }

    const Im = Im_mag_sq * L;

    // 3. POLARIZATION ANALYSIS (Moon, Riste, Koehler formalism)
    // Non-Spin-Flip: |F_N + F_M_perp . P|^2
    // Spin-Flip: |F_M_perp x P|^2
    // Longitudinal Polarized cross section:
    // I+(Q) = |F_N|^2 + |F_M_perp|^2 + 2 P_eff * Re(F_N * (F_M_perp . Ghat))
    // I-(Q) = |F_N|^2 + |F_M_perp|^2 - 2 P_eff * Re(F_N * (F_M_perp . Ghat))
    const dot_r = Fn_r * (Fm_r.x * Ghat.x + Fm_r.y * Ghat.y + Fm_r.z * Ghat.z) +
                  Fn_i * (Fm_i.x * Ghat.x + Fm_i.y * Ghat.y + Fm_i.z * Ghat.z);

    const I_interference = 2 * P_eff * dot_r * L;

    const I_up = Math.max(0, In + Im + I_interference);
    const I_down = Math.max(0, In + Im - I_interference);

    const flippingRatio = I_down > 1e-4 ? I_up / I_down : 1.0;

    // Spin-Flip (SF) & Non-Spin-Flip (NSF) components relative to guide field Ghat
    // F_M_perp_parallel_G = (F_M_perp . Ghat)
    const Fm_dot_G_r = (Fm_r.x * Ghat.x + Fm_r.y * Ghat.y + Fm_r.z * Ghat.z);
    const Fm_dot_G_i = (Fm_i.x * Ghat.x + Fm_i.y * Ghat.y + Fm_i.z * Ghat.z);
    const I_mag_parallel_G = (Fm_dot_G_r * Fm_dot_G_r + Fm_dot_G_i * Fm_dot_G_i) * L;
    const I_mag_perp_G = Math.max(0, Im - I_mag_parallel_G);

    const I_NSF = (In + I_mag_parallel_G + I_interference);
    const I_SF = I_mag_perp_G;

    const totalIntensity = In + Im;

    if (totalIntensity > 1e-4) {
      const label = isSatellite
        ? `(${h} ${k} ${l}) ${satDirection === 1 ? '+' : '-'} k`
        : `(${h} ${k} ${l})`;

      const existing = reflections.find(r => Math.abs(r.twoTheta - twoTheta) < 0.03);
      if (existing) {
        existing.nuclearIntensity += In;
        existing.magneticIntensity += Im;
        existing.totalIntensity += totalIntensity;
        existing.multiplicity += 1;
        if (existing.polarizedUpIntensity !== undefined) existing.polarizedUpIntensity += I_up;
        if (existing.polarizedDownIntensity !== undefined) existing.polarizedDownIntensity += I_down;
        if (!existing.label.includes(label)) existing.label += `, ${label}`;
      } else {
        reflections.push({
          hkl: [Math.abs(h), Math.abs(k), Math.abs(l)],
          qVector: [qh, qk, ql],
          twoTheta,
          dSpacing: d,
          qMagnitude: Qmag,
          nuclearIntensity: In,
          magneticIntensity: Im,
          totalIntensity,
          polarizedUpIntensity: I_up,
          polarizedDownIntensity: I_down,
          flippingRatio,
          spinFlipIntensity: I_SF,
          nonSpinFlipIntensity: I_NSF,
          chiralAsymmetry: (I_up - I_down) / (I_up + I_down + 1e-6),
          F_nuclear_real: Fn_r,
          F_nuclear_imag: Fn_i,
          F_mag_perp_mag: Math.sqrt(Im_mag_sq),
          F_mag_perp_vec: { x: Fm_r.x, y: Fm_r.y, z: Fm_r.z },
          magneticInteractionVectorQ: Qhat,
          formFactor: avgFormFactor,
          lorentzFactor: L,
          multiplicity: 1,
          isSatellite,
          satelliteSign: satDirection,
          label
        });
      }
    }
  };

  // Iterate reciprocal search sphere
  for (let h = -maxIndex; h <= maxIndex; h++) {
    for (let k = -maxIndex; k <= maxIndex; k++) {
      for (let l = -maxIndex; l <= maxIndex; l++) {
        // Fundamental Bragg peak
        addReflectionCandidate(h, k, l, h, k, l, false, 0);

        // Satellites for incommensurate/modulated magnetic structures
        if (!isKZero) {
          addReflectionCandidate(h, k, l, h + kVector.x, k + kVector.y, l + kVector.z, true, 1);
          addReflectionCandidate(h, k, l, h - kVector.x, k - kVector.y, l - kVector.z, true, -1);
        }
      }
    }
  }

  // Sort by twoTheta ascending
  reflections.sort((a, b) => a.twoTheta - b.twoTheta);

  // Compute aggregate magnetic metrics
  const metrics = calculateMagneticMetrics(lattice, atoms, temperature, criticalTemp, exponentModel, kVector);

  return { reflections, metrics };
};

/**
 * Calculates high-level magnetic physical metrics.
 */
export const calculateMagneticMetrics = (
  lattice: LatticeParameters,
  atoms: MagneticAtom[],
  T: number,
  Tc: number,
  model: CriticalExponentModel,
  kVector: { x: number; y: number; z: number }
): MagneticMetrics => {
  const cellVol = calculateCellVolume(lattice);
  const tempFactor = calculateTemperatureOrderParameter(T, Tc, model);

  let net0K_x = 0, net0K_y = 0, net0K_z = 0;
  let totalSub0K = 0;
  let totalNucB = 0;

  atoms.forEach(a => {
    const mx = a.mx || 0;
    const my = a.my || 0;
    const mz = a.mz || 0;
    net0K_x += mx;
    net0K_y += my;
    net0K_z += mz;
    totalSub0K += Math.sqrt(mx * mx + my * my + mz * mz);
    totalNucB += (a.b || 0);
  });

  const net0K_mag = Math.sqrt(net0K_x * net0K_x + net0K_y * net0K_y + net0K_z * net0K_z);
  const netT_mag = net0K_mag * tempFactor;
  const netT_x = net0K_x * tempFactor;
  const netT_y = net0K_y * tempFactor;
  const netT_z = net0K_z * tempFactor;

  // Nuclear Scattering Length Density (SLD) in 10^-6 Å^-2
  const nucSLD = cellVol > 0 ? (10 * totalNucB) / cellVol : 0;
  // Magnetic Scattering Length Density
  const magSLD = cellVol > 0 ? (10 * 2.695 * netT_mag) / cellVol : 0;

  // Determine Magnetic Order Type
  const isKNonZero = Math.abs(kVector.x) > 1e-4 || Math.abs(kVector.y) > 1e-4 || Math.abs(kVector.z) > 1e-4;
  let orderType: MagneticOrderType = 'Paramagnetic (PM)';

  if (totalSub0K > 0.05) {
    if (T >= Tc) {
      orderType = 'Paramagnetic (PM)';
    } else if (isKNonZero) {
      orderType = 'Incommensurate Spin Density Wave (SDW)';
    } else if (net0K_mag < 0.05) {
      orderType = 'Antiferromagnetic (AFM)';
    } else if (Math.abs(net0K_mag - totalSub0K) < 0.05) {
      orderType = 'Ferromagnetic (FM)';
    } else if (net0K_mag > 0.05 && net0K_mag < 0.9 * totalSub0K) {
      orderType = 'Canted Weak Ferromagnetic';
    } else {
      orderType = 'Ferrimagnetic (FiM)';
    }
  }

  // Calculate Curie-Weiss Constants
  const sumSq = atoms.reduce((acc, a) => acc + (a.mx * a.mx + a.my * a.my + a.mz * a.mz), 0);
  const curieC = Math.max(0.05, 0.125 * sumSq); // emu·K/mol
  const weissTheta = orderType.includes('Ferro') || orderType.includes('FM')
    ? 0.92 * Tc
    : (orderType.includes('Anti') || orderType.includes('AFM') ? -0.75 * Tc : 0.15 * Tc);

  const effBohr = Math.sqrt(8 * curieC);
  const frustrationIndex = Tc > 0 ? Math.abs(weissTheta) / Tc : 1.0;

  // Calculate canting angle between sublattices if multi-atom
  let cantingAngle = 0;
  if (atoms.length >= 2) {
    const a1 = atoms[0];
    const a2 = atoms[1];
    const m1 = Math.sqrt(a1.mx * a1.mx + a1.my * a1.my + a1.mz * a1.mz);
    const m2 = Math.sqrt(a2.mx * a2.mx + a2.my * a2.my + a2.mz * a2.mz);
    if (m1 > 0 && m2 > 0) {
      const dot = (a1.mx * a2.mx + a1.my * a2.my + a1.mz * a2.mz) / (m1 * m2);
      const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
      cantingAngle = (angleRad * 180) / Math.PI;
    }
  }

  // Modulation pitch
  let pitch: number | null = null;
  if (isKNonZero) {
    const kMag = Math.sqrt(
      (kVector.x / lattice.a) ** 2 +
      (kVector.y / lattice.b) ** 2 +
      (kVector.z / lattice.c) ** 2
    );
    if (kMag > 1e-4) pitch = 1 / kMag;
  }

  return {
    orderType,
    orderParameter: tempFactor,
    netMoment0K: { x: net0K_x, y: net0K_y, z: net0K_z, mag: net0K_mag },
    netMomentT: { x: netT_x, y: netT_y, z: netT_z, mag: netT_mag },
    totalSublatticeMoment0K: totalSub0K,
    totalSublatticeMomentT: totalSub0K * tempFactor,
    cellVolume: cellVol,
    nuclearSLD: nucSLD,
    magneticSLD: magSLD,
    cantingAngleDeg: cantingAngle,
    spiralPitchAngstrom: pitch,
    curieConstant: curieC,
    weissConstant: weissTheta,
    effectiveBohrMagneton: effBohr,
    frustrationIndex
  };
};

const getEmptyMetrics = (lattice: LatticeParameters, atoms: MagneticAtom[]): MagneticMetrics => ({
  orderType: 'Paramagnetic (PM)',
  orderParameter: 0,
  netMoment0K: { x: 0, y: 0, z: 0, mag: 0 },
  netMomentT: { x: 0, y: 0, z: 0, mag: 0 },
  totalSublatticeMoment0K: 0,
  totalSublatticeMomentT: 0,
  cellVolume: calculateCellVolume(lattice),
  nuclearSLD: 0,
  magneticSLD: 0,
  cantingAngleDeg: 0,
  spiralPitchAngstrom: null,
  curieConstant: 0.1,
  weissConstant: 0,
  effectiveBohrMagneton: 0,
  frustrationIndex: 1
});
