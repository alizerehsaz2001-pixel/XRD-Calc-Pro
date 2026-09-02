import { LatticeParameters, CrystalSystem } from '../types';
import { calculateDSpacing, calculateCellVolume } from './physics';

// ============================================================================
// NIST Center for Neutron Research (NCNR) Isotope Database
// ============================================================================

export interface IsotopeData {
  symbol: string;
  name: string;
  Z: number;
  A: number | string; // mass number or 'Nat' for natural abundance
  b_c: number; // Bound coherent scattering length (fm = 10^-15 m)
  b_inc?: number; // Incoherent scattering length (fm)
  sigma_coh: number; // Coherent scattering cross-section (barns = 10^-24 cm^2)
  sigma_inc: number; // Incoherent scattering cross-section (barns)
  sigma_scat: number; // Total scattering cross section (barns)
  sigma_abs_thermal: number; // Absorption cross section at 2200 m/s (1.798 Å) (barns)
  abundance?: number; // % Natural abundance if single isotope
  category: 'Light' | 'Transition' | 'RareEarth' | 'Actinide' | 'Halogen' | 'Alkali' | 'Other';
}

export const NIST_ISOTOPE_DB: Record<string, IsotopeData> = {
  'H': {
    symbol: 'H',
    name: 'Hydrogen (Protium)',
    Z: 1,
    A: 1,
    b_c: -3.7406,
    b_inc: 25.274,
    sigma_coh: 1.7583,
    sigma_inc: 80.27,
    sigma_scat: 82.03,
    sigma_abs_thermal: 0.3326,
    abundance: 99.985,
    category: 'Light'
  },
  'D': {
    symbol: 'D',
    name: 'Deuterium (2H)',
    Z: 1,
    A: 2,
    b_c: 6.671,
    b_inc: 4.04,
    sigma_coh: 5.592,
    sigma_inc: 2.05,
    sigma_scat: 7.64,
    sigma_abs_thermal: 0.000519,
    abundance: 0.015,
    category: 'Light'
  },
  '3He': {
    symbol: '3He',
    name: 'Helium-3',
    Z: 2,
    A: 3,
    b_c: 5.74,
    sigma_coh: 4.14,
    sigma_inc: 1.6,
    sigma_scat: 5.74,
    sigma_abs_thermal: 5333.0,
    category: 'Light'
  },
  '4He': {
    symbol: '4He',
    name: 'Helium-4',
    Z: 2,
    A: 4,
    b_c: 3.26,
    sigma_coh: 1.335,
    sigma_inc: 0.0,
    sigma_scat: 1.335,
    sigma_abs_thermal: 0.0,
    category: 'Light'
  },
  '6Li': {
    symbol: '6Li',
    name: 'Lithium-6',
    Z: 3,
    A: 6,
    b_c: 2.00,
    sigma_coh: 0.50,
    sigma_inc: 0.46,
    sigma_scat: 0.96,
    sigma_abs_thermal: 940.0,
    abundance: 7.5,
    category: 'Alkali'
  },
  '7Li': {
    symbol: '7Li',
    name: 'Lithium-7',
    Z: 3,
    A: 7,
    b_c: -2.22,
    sigma_coh: 0.62,
    sigma_inc: 0.78,
    sigma_scat: 1.40,
    sigma_abs_thermal: 0.0454,
    abundance: 92.5,
    category: 'Alkali'
  },
  'Li': {
    symbol: 'Li',
    name: 'Lithium (Nat)',
    Z: 3,
    A: 'Nat',
    b_c: -1.90,
    sigma_coh: 0.454,
    sigma_inc: 0.92,
    sigma_scat: 1.37,
    sigma_abs_thermal: 70.5,
    category: 'Alkali'
  },
  'Be': {
    symbol: 'Be',
    name: 'Beryllium',
    Z: 4,
    A: 9,
    b_c: 7.79,
    sigma_coh: 7.63,
    sigma_inc: 0.003,
    sigma_scat: 7.63,
    sigma_abs_thermal: 0.0076,
    abundance: 100,
    category: 'Light'
  },
  '10B': {
    symbol: '10B',
    name: 'Boron-10',
    Z: 5,
    A: 10,
    b_c: -0.1,
    sigma_coh: 0.14,
    sigma_inc: 3.0,
    sigma_scat: 3.14,
    sigma_abs_thermal: 3837.0,
    abundance: 19.9,
    category: 'Light'
  },
  '11B': {
    symbol: '11B',
    name: 'Boron-11',
    Z: 5,
    A: 11,
    b_c: 6.65,
    sigma_coh: 5.56,
    sigma_inc: 0.21,
    sigma_scat: 5.77,
    sigma_abs_thermal: 0.0055,
    abundance: 80.1,
    category: 'Light'
  },
  'B': {
    symbol: 'B',
    name: 'Boron (Nat)',
    Z: 5,
    A: 'Nat',
    b_c: 5.30,
    sigma_coh: 3.54,
    sigma_inc: 1.7,
    sigma_scat: 5.24,
    sigma_abs_thermal: 767.0,
    category: 'Light'
  },
  '12C': {
    symbol: '12C',
    name: 'Carbon-12',
    Z: 6,
    A: 12,
    b_c: 6.6511,
    sigma_coh: 5.559,
    sigma_inc: 0.0,
    sigma_scat: 5.559,
    sigma_abs_thermal: 0.0035,
    abundance: 98.93,
    category: 'Light'
  },
  '13C': {
    symbol: '13C',
    name: 'Carbon-13',
    Z: 6,
    A: 13,
    b_c: 6.19,
    sigma_coh: 4.81,
    sigma_inc: 0.034,
    sigma_scat: 4.84,
    sigma_abs_thermal: 0.00137,
    abundance: 1.07,
    category: 'Light'
  },
  'C': {
    symbol: 'C',
    name: 'Carbon (Nat)',
    Z: 6,
    A: 'Nat',
    b_c: 6.6460,
    sigma_coh: 5.551,
    sigma_inc: 0.001,
    sigma_scat: 5.551,
    sigma_abs_thermal: 0.0035,
    category: 'Light'
  },
  '14N': {
    symbol: '14N',
    name: 'Nitrogen-14',
    Z: 7,
    A: 14,
    b_c: 9.37,
    sigma_coh: 11.03,
    sigma_inc: 0.50,
    sigma_scat: 11.53,
    sigma_abs_thermal: 1.91,
    abundance: 99.63,
    category: 'Light'
  },
  '15N': {
    symbol: '15N',
    name: 'Nitrogen-15',
    Z: 7,
    A: 15,
    b_c: 6.44,
    sigma_coh: 5.21,
    sigma_inc: 0.0001,
    sigma_scat: 5.21,
    sigma_abs_thermal: 0.000024,
    abundance: 0.37,
    category: 'Light'
  },
  'N': {
    symbol: 'N',
    name: 'Nitrogen (Nat)',
    Z: 7,
    A: 'Nat',
    b_c: 9.36,
    sigma_coh: 11.01,
    sigma_inc: 0.50,
    sigma_scat: 11.51,
    sigma_abs_thermal: 1.90,
    category: 'Light'
  },
  '16O': {
    symbol: '16O',
    name: 'Oxygen-16',
    Z: 8,
    A: 16,
    b_c: 5.803,
    sigma_coh: 4.232,
    sigma_inc: 0.0,
    sigma_scat: 4.232,
    sigma_abs_thermal: 0.0001,
    abundance: 99.76,
    category: 'Light'
  },
  'O': {
    symbol: 'O',
    name: 'Oxygen (Nat)',
    Z: 8,
    A: 'Nat',
    b_c: 5.803,
    sigma_coh: 4.232,
    sigma_inc: 0.0008,
    sigma_scat: 4.232,
    sigma_abs_thermal: 0.00019,
    category: 'Light'
  },
  'F': {
    symbol: 'F',
    name: 'Fluorine',
    Z: 9,
    A: 19,
    b_c: 5.654,
    sigma_coh: 4.017,
    sigma_inc: 0.0008,
    sigma_scat: 4.018,
    sigma_abs_thermal: 0.0096,
    category: 'Halogen'
  },
  'Na': {
    symbol: 'Na',
    name: 'Sodium',
    Z: 11,
    A: 23,
    b_c: 3.63,
    sigma_coh: 1.66,
    sigma_inc: 1.62,
    sigma_scat: 3.28,
    sigma_abs_thermal: 0.53,
    category: 'Alkali'
  },
  'Mg': {
    symbol: 'Mg',
    name: 'Magnesium',
    Z: 12,
    A: 'Nat',
    b_c: 5.375,
    sigma_coh: 3.631,
    sigma_inc: 0.08,
    sigma_scat: 3.71,
    sigma_abs_thermal: 0.063,
    category: 'Other'
  },
  'Al': {
    symbol: 'Al',
    name: 'Aluminium',
    Z: 13,
    A: 27,
    b_c: 3.449,
    sigma_coh: 1.495,
    sigma_inc: 0.009,
    sigma_scat: 1.503,
    sigma_abs_thermal: 0.231,
    category: 'Other'
  },
  'Si': {
    symbol: 'Si',
    name: 'Silicon',
    Z: 14,
    A: 'Nat',
    b_c: 4.149,
    sigma_coh: 2.163,
    sigma_inc: 0.004,
    sigma_scat: 2.167,
    sigma_abs_thermal: 0.171,
    category: 'Other'
  },
  'P': {
    symbol: 'P',
    name: 'Phosphorus',
    Z: 15,
    A: 31,
    b_c: 5.13,
    sigma_coh: 3.307,
    sigma_inc: 0.005,
    sigma_scat: 3.312,
    sigma_abs_thermal: 0.172,
    category: 'Other'
  },
  'S': {
    symbol: 'S',
    name: 'Sulfur',
    Z: 16,
    A: 'Nat',
    b_c: 2.847,
    sigma_coh: 1.018,
    sigma_inc: 0.007,
    sigma_scat: 1.026,
    sigma_abs_thermal: 0.53,
    category: 'Other'
  },
  'Cl': {
    symbol: 'Cl',
    name: 'Chlorine',
    Z: 17,
    A: 'Nat',
    b_c: 9.577,
    sigma_coh: 11.53,
    sigma_inc: 3.86,
    sigma_scat: 15.39,
    sigma_abs_thermal: 33.5,
    category: 'Halogen'
  },
  'K': {
    symbol: 'K',
    name: 'Potassium',
    Z: 19,
    A: 'Nat',
    b_c: 3.67,
    sigma_coh: 1.69,
    sigma_inc: 0.27,
    sigma_scat: 1.96,
    sigma_abs_thermal: 2.1,
    category: 'Alkali'
  },
  'Ca': {
    symbol: 'Ca',
    name: 'Calcium',
    Z: 20,
    A: 'Nat',
    b_c: 4.70,
    sigma_coh: 2.78,
    sigma_inc: 0.05,
    sigma_scat: 2.83,
    sigma_abs_thermal: 0.43,
    category: 'Other'
  },
  'Sc': {
    symbol: 'Sc',
    name: 'Scandium',
    Z: 21,
    A: 45,
    b_c: 12.29,
    sigma_coh: 19.0,
    sigma_inc: 4.5,
    sigma_scat: 23.5,
    sigma_abs_thermal: 27.2,
    category: 'Transition'
  },
  '46Ti': {
    symbol: '46Ti',
    name: 'Titanium-46',
    Z: 22,
    A: 46,
    b_c: 4.72,
    sigma_coh: 2.8,
    sigma_inc: 0.0,
    sigma_scat: 2.8,
    sigma_abs_thermal: 0.59,
    abundance: 8.25,
    category: 'Transition'
  },
  '48Ti': {
    symbol: '48Ti',
    name: 'Titanium-48 (Neg b)',
    Z: 22,
    A: 48,
    b_c: -5.84,
    sigma_coh: 4.29,
    sigma_inc: 0.0,
    sigma_scat: 4.29,
    sigma_abs_thermal: 7.84,
    abundance: 73.72,
    category: 'Transition'
  },
  'Ti': {
    symbol: 'Ti',
    name: 'Titanium (Nat Neg b)',
    Z: 22,
    A: 'Nat',
    b_c: -3.438,
    sigma_coh: 1.485,
    sigma_inc: 2.87,
    sigma_scat: 4.35,
    sigma_abs_thermal: 6.09,
    category: 'Transition'
  },
  'V': {
    symbol: 'V',
    name: 'Vanadium (Incoherent)',
    Z: 23,
    A: 51,
    b_c: -0.3824,
    sigma_coh: 0.0184,
    sigma_inc: 5.08,
    sigma_scat: 5.10,
    sigma_abs_thermal: 5.08,
    category: 'Transition'
  },
  'Cr': {
    symbol: 'Cr',
    name: 'Chromium',
    Z: 24,
    A: 'Nat',
    b_c: 3.635,
    sigma_coh: 1.66,
    sigma_inc: 1.83,
    sigma_scat: 3.49,
    sigma_abs_thermal: 3.05,
    category: 'Transition'
  },
  '55Mn': {
    symbol: '55Mn',
    name: 'Manganese-55 (Neg b)',
    Z: 25,
    A: 55,
    b_c: -3.73,
    sigma_coh: 1.75,
    sigma_inc: 0.4,
    sigma_scat: 2.15,
    sigma_abs_thermal: 13.3,
    abundance: 100,
    category: 'Transition'
  },
  'Mn': {
    symbol: 'Mn',
    name: 'Manganese (Nat Neg b)',
    Z: 25,
    A: 'Nat',
    b_c: -3.73,
    sigma_coh: 1.75,
    sigma_inc: 0.4,
    sigma_scat: 2.15,
    sigma_abs_thermal: 13.3,
    category: 'Transition'
  },
  '54Fe': {
    symbol: '54Fe',
    name: 'Iron-54',
    Z: 26,
    A: 54,
    b_c: 4.2,
    sigma_coh: 2.22,
    sigma_inc: 0.0,
    sigma_scat: 2.22,
    sigma_abs_thermal: 2.25,
    abundance: 5.84,
    category: 'Transition'
  },
  '56Fe': {
    symbol: '56Fe',
    name: 'Iron-56',
    Z: 26,
    A: 56,
    b_c: 9.94,
    sigma_coh: 12.42,
    sigma_inc: 0.0,
    sigma_scat: 12.42,
    sigma_abs_thermal: 2.59,
    abundance: 91.75,
    category: 'Transition'
  },
  'Fe': {
    symbol: 'Fe',
    name: 'Iron (Nat)',
    Z: 26,
    A: 'Nat',
    b_c: 9.45,
    sigma_coh: 11.22,
    sigma_inc: 0.40,
    sigma_scat: 11.62,
    sigma_abs_thermal: 2.56,
    category: 'Transition'
  },
  'Co': {
    symbol: 'Co',
    name: 'Cobalt',
    Z: 27,
    A: 59,
    b_c: 2.49,
    sigma_coh: 0.779,
    sigma_inc: 4.8,
    sigma_scat: 5.58,
    sigma_abs_thermal: 37.18,
    category: 'Transition'
  },
  '58Ni': {
    symbol: '58Ni',
    name: 'Nickel-58 (High b)',
    Z: 28,
    A: 58,
    b_c: 14.4,
    sigma_coh: 26.1,
    sigma_inc: 0.0,
    sigma_scat: 26.1,
    sigma_abs_thermal: 4.6,
    abundance: 68.08,
    category: 'Transition'
  },
  '60Ni': {
    symbol: '60Ni',
    name: 'Nickel-60',
    Z: 28,
    A: 60,
    b_c: 2.8,
    sigma_coh: 0.99,
    sigma_inc: 0.0,
    sigma_scat: 0.99,
    sigma_abs_thermal: 2.9,
    abundance: 26.22,
    category: 'Transition'
  },
  '62Ni': {
    symbol: '62Ni',
    name: 'Nickel-62 (Neg b)',
    Z: 28,
    A: 62,
    b_c: -8.7,
    sigma_coh: 9.5,
    sigma_inc: 0.0,
    sigma_scat: 9.5,
    sigma_abs_thermal: 14.5,
    abundance: 3.63,
    category: 'Transition'
  },
  'Ni': {
    symbol: 'Ni',
    name: 'Nickel (Nat)',
    Z: 28,
    A: 'Nat',
    b_c: 10.3,
    sigma_coh: 13.3,
    sigma_inc: 5.2,
    sigma_scat: 18.5,
    sigma_abs_thermal: 4.49,
    category: 'Transition'
  },
  'Cu': {
    symbol: 'Cu',
    name: 'Copper',
    Z: 29,
    A: 'Nat',
    b_c: 7.718,
    sigma_coh: 7.485,
    sigma_inc: 0.55,
    sigma_scat: 8.03,
    sigma_abs_thermal: 3.78,
    category: 'Transition'
  },
  'Zn': {
    symbol: 'Zn',
    name: 'Zinc',
    Z: 30,
    A: 'Nat',
    b_c: 5.68,
    sigma_coh: 4.054,
    sigma_inc: 0.077,
    sigma_scat: 4.131,
    sigma_abs_thermal: 1.11,
    category: 'Transition'
  },
  'Ga': {
    symbol: 'Ga',
    name: 'Gallium',
    Z: 31,
    A: 'Nat',
    b_c: 7.288,
    sigma_coh: 6.675,
    sigma_inc: 0.16,
    sigma_scat: 6.83,
    sigma_abs_thermal: 2.75,
    category: 'Other'
  },
  'Ge': {
    symbol: 'Ge',
    name: 'Germanium',
    Z: 32,
    A: 'Nat',
    b_c: 8.185,
    sigma_coh: 8.42,
    sigma_inc: 0.18,
    sigma_scat: 8.60,
    sigma_abs_thermal: 2.2,
    category: 'Other'
  },
  'Sr': {
    symbol: 'Sr',
    name: 'Strontium',
    Z: 38,
    A: 'Nat',
    b_c: 7.02,
    sigma_coh: 6.19,
    sigma_inc: 0.06,
    sigma_scat: 6.25,
    sigma_abs_thermal: 1.28,
    category: 'Alkali'
  },
  'Y': {
    symbol: 'Y',
    name: 'Yttrium',
    Z: 39,
    A: 89,
    b_c: 7.75,
    sigma_coh: 7.55,
    sigma_inc: 0.15,
    sigma_scat: 7.70,
    sigma_abs_thermal: 1.28,
    category: 'Transition'
  },
  'Zr': {
    symbol: 'Zr',
    name: 'Zirconium (Low Abs)',
    Z: 40,
    A: 'Nat',
    b_c: 7.16,
    sigma_coh: 6.44,
    sigma_inc: 0.02,
    sigma_scat: 6.46,
    sigma_abs_thermal: 0.185,
    category: 'Transition'
  },
  'Nb': {
    symbol: 'Nb',
    name: 'Niobium',
    Z: 41,
    A: 93,
    b_c: 7.054,
    sigma_coh: 6.253,
    sigma_inc: 0.0024,
    sigma_scat: 6.255,
    sigma_abs_thermal: 1.15,
    category: 'Transition'
  },
  'Mo': {
    symbol: 'Mo',
    name: 'Molybdenum',
    Z: 42,
    A: 'Nat',
    b_c: 6.715,
    sigma_coh: 5.67,
    sigma_inc: 0.04,
    sigma_scat: 5.71,
    sigma_abs_thermal: 2.48,
    category: 'Transition'
  },
  '113Cd': {
    symbol: '113Cd',
    name: 'Cadmium-113 (Shield)',
    Z: 48,
    A: 113,
    b_c: 5.1,
    sigma_coh: 3.3,
    sigma_inc: 0.0,
    sigma_scat: 3.3,
    sigma_abs_thermal: 20600.0,
    abundance: 12.22,
    category: 'Transition'
  },
  'Cd': {
    symbol: 'Cd',
    name: 'Cadmium (Nat Shield)',
    Z: 48,
    A: 'Nat',
    b_c: 5.1,
    sigma_coh: 3.3,
    sigma_inc: 3.2,
    sigma_scat: 6.5,
    sigma_abs_thermal: 2520.0,
    category: 'Transition'
  },
  'Ba': {
    symbol: 'Ba',
    name: 'Barium',
    Z: 56,
    A: 'Nat',
    b_c: 5.07,
    sigma_coh: 3.23,
    sigma_inc: 0.15,
    sigma_scat: 3.38,
    sigma_abs_thermal: 1.17,
    category: 'Alkali'
  },
  'La': {
    symbol: 'La',
    name: 'Lanthanum',
    Z: 57,
    A: 139,
    b_c: 8.24,
    sigma_coh: 8.53,
    sigma_inc: 1.13,
    sigma_scat: 9.66,
    sigma_abs_thermal: 8.97,
    category: 'RareEarth'
  },
  'Ce': {
    symbol: 'Ce',
    name: 'Cerium',
    Z: 58,
    A: 'Nat',
    b_c: 4.84,
    sigma_coh: 2.94,
    sigma_inc: 0.01,
    sigma_scat: 2.95,
    sigma_abs_thermal: 0.63,
    category: 'RareEarth'
  },
  '149Sm': {
    symbol: '149Sm',
    name: 'Samarium-149 (Absorber)',
    Z: 62,
    A: 149,
    b_c: 0.8,
    sigma_coh: 0.08,
    sigma_inc: 0.0,
    sigma_scat: 0.08,
    sigma_abs_thermal: 40140.0,
    abundance: 13.8,
    category: 'RareEarth'
  },
  '157Gd': {
    symbol: '157Gd',
    name: 'Gadolinium-157 (Ultra Abs)',
    Z: 64,
    A: 157,
    b_c: 2.4,
    sigma_coh: 0.72,
    sigma_inc: 0.0,
    sigma_scat: 0.72,
    sigma_abs_thermal: 254000.0,
    abundance: 15.65,
    category: 'RareEarth'
  },
  'Gd': {
    symbol: 'Gd',
    name: 'Gadolinium (Nat Shield)',
    Z: 64,
    A: 'Nat',
    b_c: 6.5,
    sigma_coh: 5.3,
    sigma_inc: 151.0,
    sigma_scat: 156.0,
    sigma_abs_thermal: 49700.0,
    category: 'RareEarth'
  },
  'Dy': {
    symbol: 'Dy',
    name: 'Dysprosium',
    Z: 66,
    A: 'Nat',
    b_c: 16.9,
    sigma_coh: 35.9,
    sigma_inc: 3.4,
    sigma_scat: 39.3,
    sigma_abs_thermal: 994.0,
    category: 'RareEarth'
  },
  'Pt': {
    symbol: 'Pt',
    name: 'Platinum',
    Z: 78,
    A: 'Nat',
    b_c: 9.60,
    sigma_coh: 11.58,
    sigma_inc: 0.13,
    sigma_scat: 11.71,
    sigma_abs_thermal: 10.3,
    category: 'Transition'
  },
  'Au': {
    symbol: 'Au',
    name: 'Gold',
    Z: 79,
    A: 197,
    b_c: 7.63,
    sigma_coh: 7.32,
    sigma_inc: 0.43,
    sigma_scat: 7.75,
    sigma_abs_thermal: 98.65,
    category: 'Transition'
  },
  'Pb': {
    symbol: 'Pb',
    name: 'Lead',
    Z: 82,
    A: 'Nat',
    b_c: 9.405,
    sigma_coh: 11.11,
    sigma_inc: 0.003,
    sigma_scat: 11.11,
    sigma_abs_thermal: 0.171,
    category: 'Other'
  },
  'Bi': {
    symbol: 'Bi',
    name: 'Bismuth',
    Z: 83,
    A: 209,
    b_c: 8.532,
    sigma_coh: 9.148,
    sigma_inc: 0.0084,
    sigma_scat: 9.156,
    sigma_abs_thermal: 0.0338,
    category: 'Other'
  }
};

// ============================================================================
// Core Neutron Diffraction Types & Interfaces
// ============================================================================

export interface NeutronAtomExtended {
  id: string;
  element: string; // e.g. 'O', 'D', '48Ti', '56Fe'
  label: string;
  b: number; // Bound coherent scattering length in fm
  x: number;
  y: number;
  z: number;
  B_iso: number; // Debye-Waller thermal factor in Å^2
  occupancy?: number;
  isotopeKey?: string;
}

export interface ReciprocalPoint {
  h: number;
  k: number;
  l: number;
  hklKey: string;
  dSpacing: number; // Å
  twoTheta: number; // deg
  qMag: number; // Å^-1
  qx: number; // Projection in current plane
  qy: number; // Projection in current plane
  qz: number;
  F_nuc_real: number;
  F_nuc_imag: number;
  F_nuc_sq: number;
  phase_nuc: number; // radians [-π, π]
  F_xray_sq: number;
  intensity_nuc: number;
  intensity_xray: number;
  isAllowed: boolean;
  isInEwaldSphere: boolean;
}

export interface DetailedDiffractionSpectrum {
  hkl: [number, number, number];
  hklStr: string;
  twoTheta: number;
  dSpacing: number;
  qMag: number;
  F_nuc_sq: number;
  phase_nuc_deg: number;
  F_xray_sq: number;
  intensity_nuc: number; // normalized %
  intensity_xray: number; // normalized %
  multiplicity: number;
  raw_nuc_int: number;
  raw_xray_int: number;
}

export interface NuclearMetrics {
  cellVolume: number; // Å³
  totalBoundScatLength: number; // Σ b_j (fm)
  cellSLD: number; // 10^-6 Å^-2 (Nuclear SLD = Σ b_j / V)
  xraySLD: number; // 10^-6 Å^-2 (Electron SLD = Σ Z_j * r_e / V)
  totalCoherentSigma: number; // barns per unit cell
  totalIncoherentSigma: number; // barns per unit cell
  totalAbsorptionSigmaThermal: number; // barns per unit cell at 1.798 Å
  absorptionAtWavelength: number; // barns per unit cell scaled by λ/1.798
  incoherentHazeRatio: number; // Ratio of incoherent noise to coherent peak strength
  transmission1mm: number; // % transmission through 1 mm bulk crystal
  attenuationLength1_e: number; // mm (1/e penetration depth)
  peakCount: number;
}

// Preset Benchmark Crystals for Nuclear Neutron Scatter
export interface NuclearPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  scientificInsight: string;
  crystalSystem: CrystalSystem;
  wavelength: number;
  lattice: LatticeParameters;
  atoms: NeutronAtomExtended[];
}

export const NUCLEAR_PRESETS: NuclearPreset[] = [
  {
    id: 'mgo_rocksalt',
    name: 'MgO (Magnesium Oxide)',
    category: 'Refractory Oxide',
    description: 'Prototypical rock-salt standard with positive scattering lengths for both cation and anion.',
    scientificInsight: 'Both Mg (b = 5.38 fm) and O (b = 5.80 fm) have comparable positive nuclear scattering lengths. In X-rays, Mg (Z=12) and O (Z=8) also scatter similarly, yielding an identical rock-salt extinction pattern.',
    crystalSystem: 'Cubic',
    wavelength: 1.54,
    lattice: { a: 4.21, b: 4.21, c: 4.21, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { id: '1', element: 'Mg', label: 'Mg1', b: 5.38, x: 0, y: 0, z: 0, B_iso: 0.35 },
      { id: '2', element: 'O', label: 'O1', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.45 }
    ]
  },
  {
    id: 'srtio3_perovskite',
    name: 'SrTiO₃ (Titanium Negative b Interference)',
    category: 'Perovskite Ferroelectric',
    description: 'Classic perovskite showing destructive nuclear phase interference from Titanium (b_Ti = -3.44 fm).',
    scientificInsight: 'Titanium possesses a rare negative bound scattering length (b = -3.44 fm). While X-rays show intense (111) and (100) peaks, neutrons exhibit stark intensity shifts because the negative Ti phase subtracts from the positive Sr (7.02 fm) and O (5.80 fm) amplitudes.',
    crystalSystem: 'Cubic',
    wavelength: 1.54,
    lattice: { a: 3.905, b: 3.905, c: 3.905, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { id: '1', element: 'Sr', label: 'Sr', b: 7.02, x: 0, y: 0, z: 0, B_iso: 0.4 },
      { id: '2', element: 'Ti', label: 'Ti (Neg b)', b: -3.44, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 },
      { id: '3', element: 'O', label: 'O_x', b: 5.80, x: 0.5, y: 0.5, z: 0.0, B_iso: 0.6 },
      { id: '4', element: 'O', label: 'O_y', b: 5.80, x: 0.5, y: 0.0, z: 0.5, B_iso: 0.6 },
      { id: '5', element: 'O', label: 'O_z', b: 5.80, x: 0.0, y: 0.5, z: 0.5, B_iso: 0.6 }
    ]
  },
  {
    id: 'd2o_ice',
    name: 'D₂O (Heavy Water Ice-Ih)',
    category: 'Hydrogen Bonded Network',
    description: 'Hexagonal heavy water ice demonstrating why deuteration is essential for neutron crystallography.',
    scientificInsight: 'Protonated ice (H₂O) has massive incoherent background haze (σ_inc = 80.27 barns) and negative b (-3.74 fm). Deuterated ice (D₂O) replaces H with D (b = +6.67 fm, σ_inc = 2.05 barns), producing sharp, high-contrast coherent Bragg peaks.',
    crystalSystem: 'Hexagonal',
    wavelength: 1.54,
    lattice: { a: 4.51, b: 4.51, c: 7.35, alpha: 90, beta: 90, gamma: 120 },
    atoms: [
      { id: '1', element: 'O', label: 'O1', b: 5.80, x: 0.333, y: 0.667, z: 0.063, B_iso: 1.2 },
      { id: '2', element: 'O', label: 'O2', b: 5.80, x: 0.333, y: 0.667, z: 0.937, B_iso: 1.2 },
      { id: '3', element: 'D', label: 'D1', b: 6.67, x: 0.333, y: 0.667, z: 0.198, B_iso: 1.8 },
      { id: '4', element: 'D', label: 'D2', b: 6.67, x: 0.445, y: 0.889, z: 0.018, B_iso: 1.8 }
    ]
  },
  {
    id: 'lifepo4_olivine',
    name: 'LiFePO₄ (Lithium Battery Cathode)',
    category: 'Energy Storage / Battery',
    description: 'Orthorhombic battery cathode where light Li+ ions are easily localized between FeO6 and PO4 polyhedra.',
    scientificInsight: 'Lithium (Z=3) has only 3 electrons and is nearly invisible to laboratory X-rays next to heavy Fe (Z=26). But in neutron diffraction, 7Li (b = -2.22 fm) and Fe (b = +9.45 fm) have strong contrasting nuclear amplitudes, making in-situ neutron diffraction the gold standard for tracking Li insertion pathways.',
    crystalSystem: 'Orthorhombic',
    wavelength: 1.54,
    lattice: { a: 10.33, b: 6.01, c: 4.69, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { id: '1', element: '7Li', label: 'Li1 (7Li)', b: -2.22, x: 0.0, y: 0.0, z: 0.0, B_iso: 0.9 },
      { id: '2', element: 'Fe', label: 'Fe1', b: 9.45, x: 0.28, y: 0.25, z: 0.97, B_iso: 0.4 },
      { id: '3', element: 'P', label: 'P1', b: 5.13, x: 0.09, y: 0.25, z: 0.42, B_iso: 0.4 },
      { id: '4', element: 'O', label: 'O1', b: 5.80, x: 0.09, y: 0.25, z: 0.74, B_iso: 0.6 },
      { id: '5', element: 'O', label: 'O2', b: 5.80, x: 0.45, y: 0.25, z: 0.20, B_iso: 0.6 },
      { id: '6', element: 'O', label: 'O3', b: 5.80, x: 0.16, y: 0.04, z: 0.28, B_iso: 0.6 }
    ]
  },
  {
    id: 'tih2_hydride',
    name: 'TiH₂ / TiD₂ (Metal Hydride Contrast)',
    category: 'Hydrogen Storage',
    description: 'Fluorite hydride where Titanium (-3.44 fm) and Hydrogen (-3.74 fm) both possess negative scattering lengths.',
    scientificInsight: 'In TiH2, both Ti and H scatter with a 180° phase flip (negative b). When swapped to TiD2 (Deuterium b = +6.67 fm), the phase of the tetrahedral interstitial sites flips completely, causing dramatic peak intensity inversions.',
    crystalSystem: 'Cubic',
    wavelength: 1.54,
    lattice: { a: 4.45, b: 4.45, c: 4.45, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { id: '1', element: 'Ti', label: 'Ti (FCC)', b: -3.44, x: 0, y: 0, z: 0, B_iso: 0.5 },
      { id: '2', element: 'H', label: 'H1 (Tetra)', b: -3.74, x: 0.25, y: 0.25, z: 0.25, B_iso: 1.5 },
      { id: '3', element: 'H', label: 'H2 (Tetra)', b: -3.74, x: 0.75, y: 0.75, z: 0.75, B_iso: 1.5 }
    ]
  },
  {
    id: 'nio_isotopic',
    name: 'NiO (58Ni vs 62Ni Isotopic Contrast)',
    category: 'Isotopic Substitution Benchmark',
    description: 'Rock-salt oxide showing dramatic contrast variation between 58Ni (+14.4 fm) and 62Ni (-8.7 fm).',
    scientificInsight: 'Natural Nickel (b = 10.3 fm) can be isotopically engineered: 58Ni has an enormous positive b (+14.4 fm), while 62Ni has a large negative b (-8.7 fm). This enables zero-matrix contrast matching in nuclear alloys.',
    crystalSystem: 'Cubic',
    wavelength: 1.54,
    lattice: { a: 4.18, b: 4.18, c: 4.18, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { id: '1', element: 'Ni', label: 'Ni (Nat)', b: 10.3, x: 0, y: 0, z: 0, B_iso: 0.4 },
      { id: '2', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 }
    ]
  },
  {
    id: 'ybco_cuprate',
    name: 'YBa₂Cu₃O₇ (High-Tc Superconductor)',
    category: 'High-Tc Superconductor',
    description: 'Orthorhombic high-Tc superconductor where neutron diffraction accurately mapped oxygen chain occupancies.',
    scientificInsight: 'X-rays struggle to differentiate O(1) chain vacancies from fully oxygenated Cu-O basal planes amidst heavy Ba (Z=56) and Y (Z=39). Neutrons solved the exact orthorhombic Cu-O chain structure that governs superconductivity at 93 K.',
    crystalSystem: 'Orthorhombic',
    wavelength: 1.54,
    lattice: { a: 3.82, b: 3.89, c: 11.68, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { id: '1', element: 'Y', label: 'Y', b: 7.75, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.3 },
      { id: '2', element: 'Ba', label: 'Ba', b: 5.07, x: 0.5, y: 0.5, z: 0.184, B_iso: 0.5 },
      { id: '3', element: 'Cu', label: 'Cu1 (Chain)', b: 7.72, x: 0.0, y: 0.0, z: 0.0, B_iso: 0.4 },
      { id: '4', element: 'Cu', label: 'Cu2 (Plane)', b: 7.72, x: 0.0, y: 0.0, z: 0.355, B_iso: 0.4 },
      { id: '5', element: 'O', label: 'O1 (Chain)', b: 5.80, x: 0.0, y: 0.5, z: 0.0, B_iso: 0.8 },
      { id: '6', element: 'O', label: 'O2 (Plane)', b: 5.80, x: 0.5, y: 0.0, z: 0.378, B_iso: 0.6 },
      { id: '7', element: 'O', label: 'O3 (Plane)', b: 5.80, x: 0.0, y: 0.5, z: 0.378, B_iso: 0.6 },
      { id: '8', element: 'O', label: 'O4 (Apical)', b: 5.80, x: 0.0, y: 0.0, z: 0.158, B_iso: 0.7 }
    ]
  }
];

// ============================================================================
// Comprehensive Calculation Functions
// ============================================================================

/**
 * Computes full nuclear metrics (SLDs, coherent/incoherent cross sections, absorption, penetration depth)
 */
export function calculateComprehensiveNuclearMetrics(
  lattice: LatticeParameters,
  atoms: NeutronAtomExtended[],
  wavelength: number
): NuclearMetrics {
  const cellVolume = calculateCellVolume ? calculateCellVolume(lattice) : (lattice.a * lattice.b * lattice.c);
  if (cellVolume <= 0 || atoms.length === 0) {
    return {
      cellVolume: 1,
      totalBoundScatLength: 0,
      cellSLD: 0,
      xraySLD: 0,
      totalCoherentSigma: 0,
      totalIncoherentSigma: 0,
      totalAbsorptionSigmaThermal: 0,
      absorptionAtWavelength: 0,
      incoherentHazeRatio: 0,
      transmission1mm: 100,
      attenuationLength1_e: 100,
      peakCount: 0
    };
  }

  let totalB = 0;
  let totalZ = 0;
  let totalCohSigma = 0;
  let totalIncSigma = 0;
  let totalAbsSigma = 0;

  atoms.forEach(a => {
    const b = a.b;
    totalB += b;

    // Look up isotope data if present
    const iso = NIST_ISOTOPE_DB[a.element];
    const Z = iso ? iso.Z : (a.element === 'H' || a.element === 'D' ? 1 : 10);
    totalZ += Z;

    const coh = iso ? iso.sigma_coh : (4 * Math.PI * b * b * 0.01);
    const inc = iso ? iso.sigma_inc : (a.element === 'H' ? 80.27 : (a.element === 'D' ? 2.05 : 0.1));
    const abs = iso ? iso.sigma_abs_thermal : 0.5;

    totalCohSigma += coh;
    totalIncSigma += inc;
    totalAbsSigma += abs;
  });

  // Nuclear SLD (10^-6 Å^-2): (10 * sum(b_i in fm)) / (V_cell in Å^3)
  const cellSLD = (10 * totalB) / cellVolume;

  // X-ray electron SLD (10^-6 Å^-2): (r_e * sum(Z_i)) / V_cell, where r_e = 2.818 fm
  const xraySLD = (10 * (totalZ * 2.818)) / cellVolume;

  // 1/v thermal neutron absorption scaling: sigma_abs(lambda) = sigma_abs(1.798 Å) * (lambda / 1.798)
  const lambdaRef = 1.798; // Å (2200 m/s thermal velocity)
  const absorptionAtWavelength = totalAbsSigma * (wavelength / lambdaRef);

  // Total macroscopic cross-section Sigma_t (cm^-1): N_v * sigma_total
  // N_v = 1 / (V_cell * 10^-24 cm^3) = 1e24 / V_cell
  // sigma in barns = 10^-24 cm^2
  // Sigma_t (cm^-1) = (sigma_coh + sigma_inc + sigma_abs) / V_cell [in Å^3]
  const sigmaTotalBarns = totalCohSigma + totalIncSigma + absorptionAtWavelength;
  const mu_cm = sigmaTotalBarns / cellVolume; // cm^-1
  const mu_mm = mu_cm / 10; // mm^-1

  const transmission1mm = Math.exp(-mu_mm * 1.0) * 100; // % transmission for 1 mm
  const attenuationLength1_e = mu_mm > 0 ? (1 / mu_mm) : 999; // mm

  const incoherentHazeRatio = totalCohSigma > 0 ? (totalIncSigma / totalCohSigma) : 0;

  return {
    cellVolume,
    totalBoundScatLength: totalB,
    cellSLD,
    xraySLD,
    totalCoherentSigma: totalCohSigma,
    totalIncoherentSigma: totalIncSigma,
    totalAbsorptionSigmaThermal: totalAbsSigma,
    absorptionAtWavelength,
    incoherentHazeRatio,
    transmission1mm: Math.max(0, Math.min(100, transmission1mm)),
    attenuationLength1_e,
    peakCount: 0
  };
}

export type ScatterPlaneType = 'HK0' | 'H0L' | '0KL' | 'HHL' | 'H-HL' | 'HK1' | 'HK2' | 'custom';

export interface ReciprocalLineCutPoint {
  index: number;
  h: number;
  k: number;
  l: number;
  hklStr: string;
  qMag: number;
  dSpacing: number;
  intensity_nuc: number;
  intensity_xray: number;
  F_nuc_sq: number;
  F_xray_sq: number;
}

/**
 * Calculates 2D Reciprocal Scatter Plane slice (e.g. HK0, H0L, 0KL, HHL, H-HL, HK1, HK2, custom) with exact structure factors
 */
export function calculateReciprocalScatterPlane(
  planeType: ScatterPlaneType,
  maxIndex: number,
  lattice: LatticeParameters,
  atoms: NeutronAtomExtended[],
  wavelength: number,
  layerOffset: number = 0
): { points: ReciprocalPoint[]; qMax: number } {
  const points: ReciprocalPoint[] = [];
  const { a, b, c } = lattice;
  if (a <= 0 || b <= 0 || c <= 0 || wavelength <= 0) return { points: [], qMax: 5 };

  const k_incident = (2 * Math.PI) / wavelength; // Ewald sphere radius (Å^-1)

  for (let u = -maxIndex; u <= maxIndex; u++) {
    for (let v = -maxIndex; v <= maxIndex; v++) {
      let h = 0; let k = 0; let l = 0;
      let qx = 0; let qy = 0;

      if (planeType === 'HK0') {
        h = u; k = v; l = layerOffset;
        qx = (2 * Math.PI / a) * h;
        qy = (2 * Math.PI / b) * k;
      } else if (planeType === 'H0L') {
        h = u; k = layerOffset; l = v;
        qx = (2 * Math.PI / a) * h;
        qy = (2 * Math.PI / c) * l;
      } else if (planeType === '0KL') {
        h = layerOffset; k = u; l = v;
        qx = (2 * Math.PI / b) * k;
        qy = (2 * Math.PI / c) * l;
      } else if (planeType === 'HHL') {
        h = u; k = u; l = v;
        // qx along [110]*
        qx = (2 * Math.PI / Math.sqrt(a * a + b * b)) * u * Math.SQRT2;
        qy = (2 * Math.PI / c) * l;
      } else if (planeType === 'H-HL') {
        h = u; k = -u; l = v;
        qx = (2 * Math.PI / Math.sqrt(a * a + b * b)) * u * Math.SQRT2;
        qy = (2 * Math.PI / c) * l;
      } else if (planeType === 'HK1') {
        h = u; k = v; l = 1;
        qx = (2 * Math.PI / a) * h;
        qy = (2 * Math.PI / b) * k;
      } else if (planeType === 'HK2') {
        h = u; k = v; l = 2;
        qx = (2 * Math.PI / a) * h;
        qy = (2 * Math.PI / b) * k;
      } else if (planeType === 'custom') {
        h = u; k = v; l = layerOffset;
        qx = (2 * Math.PI / a) * h;
        qy = (2 * Math.PI / b) * k;
      }

      if (h === 0 && k === 0 && l === 0 && layerOffset === 0) continue;

      const d = calculateDSpacing(h, k, l, lattice);
      const qMag = d > 0 ? (2 * Math.PI) / d : 0;
      const sinTheta = d > 0 ? wavelength / (2 * d) : 0;
      const isBraggReachable = sinTheta <= 1.0;
      const twoTheta = isBraggReachable ? 2 * Math.asin(sinTheta) * (180 / Math.PI) : 180;

      // Check if within Ewald sphere boundary (Q <= 2 * k_i = 4π/λ)
      const isInEwaldSphere = qMag <= 2 * k_incident;

      // Calculate Nuclear Structure Factor F_nuc
      let F_nuc_real = 0;
      let F_nuc_imag = 0;
      let F_xray_real = 0;
      let F_xray_imag = 0;
      const s = isBraggReachable ? (sinTheta / wavelength) : (qMag / (4 * Math.PI));

      for (const atom of atoms) {
        const phase = 2 * Math.PI * (h * atom.x + k * atom.y + l * atom.z);
        const dw = Math.exp(-atom.B_iso * s * s);
        const b_eff = atom.b * dw;

        F_nuc_real += b_eff * Math.cos(phase);
        F_nuc_imag += b_eff * Math.sin(phase);

        // X-ray approximation: atomic form factor f_xray ~ Z * exp(-1.5 * s^2)
        const iso = NIST_ISOTOPE_DB[atom.element];
        const Z = iso ? iso.Z : (atom.element === 'H' || atom.element === 'D' ? 1 : 12);
        const f_xray = Z * Math.exp(-2.0 * s * s) * dw;

        F_xray_real += f_xray * Math.cos(phase);
        F_xray_imag += f_xray * Math.sin(phase);
      }

      const F_nuc_sq = F_nuc_real * F_nuc_real + F_nuc_imag * F_nuc_imag;
      const F_xray_sq = F_xray_real * F_xray_real + F_xray_imag * F_xray_imag;
      const phase_nuc = Math.atan2(F_nuc_imag, F_nuc_real);

      // Lorentz-Polarization factor for powder/single crystal kinematic intensity
      const lp = isBraggReachable && sinTheta > 0.001
        ? 1 / (sinTheta * Math.sin(2 * Math.asin(sinTheta)))
        : 1;

      const int_nuc = F_nuc_sq * lp;
      const int_xray = F_xray_sq * lp;
      const isAllowed = F_nuc_sq > 0.001;

      points.push({
        h,
        k,
        l,
        hklKey: `(${h} ${k} ${l})`,
        dSpacing: d,
        twoTheta,
        qMag,
        qx,
        qy,
        qz: (2 * Math.PI / c) * l,
        F_nuc_real,
        F_nuc_imag,
        F_nuc_sq,
        phase_nuc,
        F_xray_sq,
        intensity_nuc: int_nuc,
        intensity_xray: int_xray,
        isAllowed,
        isInEwaldSphere
      });
    }
  }

  // Max Q dimension for coordinate scaling
  const qMax = (2 * Math.PI / Math.min(a, b, c)) * (maxIndex + 0.5);

  return { points, qMax };
}

/**
 * Calculates continuous 1D Line-Cut in Reciprocal Space between start and end (H, K, L)
 */
export function calculateReciprocalLineCut(
  startHkl: [number, number, number],
  endHkl: [number, number, number],
  numSteps: number,
  lattice: LatticeParameters,
  atoms: NeutronAtomExtended[],
  wavelength: number,
  peakSigma: number = 0.08
): ReciprocalLineCutPoint[] {
  const result: ReciprocalLineCutPoint[] = [];
  const [h1, k1, l1] = startHkl;
  const [h2, k2, l2] = endHkl;

  // Precompute reciprocal lattice points in vicinity
  const maxIdx = Math.max(Math.abs(h1), Math.abs(h2), Math.abs(k1), Math.abs(k2), Math.abs(l1), Math.abs(l2)) + 2;
  const discretePoints: { h: number; k: number; l: number; F_nuc_sq: number; F_xray_sq: number }[] = [];

  for (let h = -maxIdx; h <= maxIdx; h++) {
    for (let k = -maxIdx; k <= maxIdx; k++) {
      for (let l = -maxIdx; l <= maxIdx; l++) {
        let F_nuc_r = 0; let F_nuc_i = 0;
        let F_xray_r = 0; let F_xray_i = 0;
        const d = calculateDSpacing(h, k, l, lattice);
        const s = d > 0 ? 1 / (2 * d) : 0;

        for (const atom of atoms) {
          const phase = 2 * Math.PI * (h * atom.x + k * atom.y + l * atom.z);
          const dw = Math.exp(-atom.B_iso * s * s);
          const b_eff = atom.b * dw;

          F_nuc_r += b_eff * Math.cos(phase);
          F_nuc_i += b_eff * Math.sin(phase);

          const iso = NIST_ISOTOPE_DB[atom.element];
          const Z = iso ? iso.Z : (atom.element === 'H' || atom.element === 'D' ? 1 : 12);
          const f_xray = Z * Math.exp(-2.0 * s * s) * dw;

          F_xray_r += f_xray * Math.cos(phase);
          F_xray_i += f_xray * Math.sin(phase);
        }

        const F_nuc_sq = F_nuc_r * F_nuc_r + F_nuc_i * F_nuc_i;
        const F_xray_sq = F_xray_r * F_xray_r + F_xray_i * F_xray_i;
        if (F_nuc_sq > 0.001 || F_xray_sq > 0.001) {
          discretePoints.push({ h, k, l, F_nuc_sq, F_xray_sq });
        }
      }
    }
  }

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const curH = h1 + t * (h2 - h1);
    const curK = k1 + t * (k2 - k1);
    const curL = l1 + t * (l2 - l1);

    const d = calculateDSpacing(curH, curK, curL, lattice);
    const qMag = d > 0 ? (2 * Math.PI) / d : 0;

    // Sum Gaussian contribution from discrete Bragg nodes to simulate real continuous measurement
    let totalNucInt = 0.5; // Small thermal diffuse scattering background
    let totalXrayInt = 0.5;
    let closestF_nuc_sq = 0;
    let closestF_xray_sq = 0;

    for (const dp of discretePoints) {
      const dh = curH - dp.h;
      const dk = curK - dp.k;
      const dl = curL - dp.l;
      const distSq = dh * dh + dk * dk + dl * dl;
      if (distSq < 0.25) {
        const weight = Math.exp(-distSq / (2 * peakSigma * peakSigma));
        totalNucInt += dp.F_nuc_sq * weight;
        totalXrayInt += dp.F_xray_sq * weight;
        if (distSq < 0.04) {
          closestF_nuc_sq = dp.F_nuc_sq;
          closestF_xray_sq = dp.F_xray_sq;
        }
      }
    }

    result.push({
      index: i,
      h: parseFloat(curH.toFixed(3)),
      k: parseFloat(curK.toFixed(3)),
      l: parseFloat(curL.toFixed(3)),
      hklStr: `(${curH.toFixed(2)} ${curK.toFixed(2)} ${curL.toFixed(2)})`,
      qMag,
      dSpacing: d,
      intensity_nuc: totalNucInt,
      intensity_xray: totalXrayInt,
      F_nuc_sq: closestF_nuc_sq,
      F_xray_sq: closestF_xray_sq
    });
  }

  return result;
}

/**
 * Calculates high-resolution powder diffraction spectrum with separate nuclear & X-ray intensities
 */
export function calculateDetailedNuclearDiffraction(
  wavelength: number,
  lattice: LatticeParameters,
  atoms: NeutronAtomExtended[],
  maxTwoTheta: number = 110
): DetailedDiffractionSpectrum[] {
  const results: Map<string, DetailedDiffractionSpectrum> = new Map();
  const { a, b, c } = lattice;
  if (a <= 0 || b <= 0 || c <= 0 || wavelength <= 0) return [];

  const maxSinTheta = Math.sin((maxTwoTheta / 2) * (Math.PI / 180));
  const maxDim = Math.max(a, b, c);
  const maxIndex = Math.ceil((2 * maxDim * maxSinTheta) / wavelength) + 1;

  for (let h = -maxIndex; h <= maxIndex; h++) {
    for (let k = -maxIndex; k <= maxIndex; k++) {
      for (let l = -maxIndex; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue;

        const d = calculateDSpacing(h, k, l, lattice);
        const sinTheta = wavelength / (2 * d);
        if (sinTheta > 1 || sinTheta > maxSinTheta) continue;

        const theta = Math.asin(sinTheta);
        const twoTheta = 2 * theta * (180 / Math.PI);
        const s = sinTheta / wavelength;
        const qMag = (4 * Math.PI * sinTheta) / wavelength;

        let F_nuc_r = 0; let F_nuc_i = 0;
        let F_xray_r = 0; let F_xray_i = 0;

        for (const atom of atoms) {
          const phase = 2 * Math.PI * (h * atom.x + k * atom.y + l * atom.z);
          const dw = Math.exp(-atom.B_iso * s * s);
          const b_eff = atom.b * dw;

          F_nuc_r += b_eff * Math.cos(phase);
          F_nuc_i += b_eff * Math.sin(phase);

          const iso = NIST_ISOTOPE_DB[atom.element];
          const Z = iso ? iso.Z : (atom.element === 'H' || atom.element === 'D' ? 1 : 12);
          const f_xray = Z * Math.exp(-2.0 * s * s) * dw;

          F_xray_r += f_xray * Math.cos(phase);
          F_xray_i += f_xray * Math.sin(phase);
        }

        const F_nuc_sq = F_nuc_r * F_nuc_r + F_nuc_i * F_nuc_i;
        const F_xray_sq = F_xray_r * F_xray_r + F_xray_i * F_xray_i;
        const phase_nuc_deg = Math.atan2(F_nuc_i, F_nuc_r) * (180 / Math.PI);

        // Lorentz polarization for unpolarized neutrons
        const lp = 1 / (sinTheta * Math.sin(2 * theta));
        const raw_nuc = F_nuc_sq * lp;
        const raw_xray = F_xray_sq * lp;

        if (raw_nuc > 1e-4 || raw_xray > 1e-4) {
          // Group by identical 2theta / dSpacing
          const rounded2Th = (Math.round(twoTheta * 100) / 100).toFixed(2);
          const existing = results.get(rounded2Th);

          const posH = Math.abs(h);
          const posK = Math.abs(k);
          const posL = Math.abs(l);

          if (existing) {
            existing.raw_nuc_int += raw_nuc;
            existing.raw_xray_int += raw_xray;
            existing.F_nuc_sq += F_nuc_sq;
            existing.F_xray_sq += F_xray_sq;
            existing.multiplicity += 1;
          } else {
            results.set(rounded2Th, {
              hkl: [posH, posK, posL],
              hklStr: `(${posH} ${posK} ${posL})`,
              twoTheta,
              dSpacing: d,
              qMag,
              F_nuc_sq,
              phase_nuc_deg,
              F_xray_sq,
              intensity_nuc: 0,
              intensity_xray: 0,
              multiplicity: 1,
              raw_nuc_int: raw_nuc,
              raw_xray_int: raw_xray
            });
          }
        }
      }
    }
  }

  const list = Array.from(results.values()).sort((a, b) => a.twoTheta - b.twoTheta);
  if (list.length === 0) return [];

  const maxNuc = Math.max(...list.map(r => r.raw_nuc_int), 1);
  const maxXray = Math.max(...list.map(r => r.raw_xray_int), 1);

  return list.map(r => ({
    ...r,
    intensity_nuc: (r.raw_nuc_int / maxNuc) * 100,
    intensity_xray: (r.raw_xray_int / maxXray) * 100
  }));
}

// ============================================================================
// Neutron Kinematics & Energy Converter
// ============================================================================

export interface NeutronKinematics {
  wavelength: number; // Å
  energy_meV: number; // meV
  energy_J: number; // Joules
  velocity_ms: number; // m/s
  wavevector_k: number; // Å^-1 (k = 2π/λ)
  temperature_K: number; // Kelvin (E = k_B T)
  frequency_THz: number; // THz (E = h ν)
  wavenumber_cm1: number; // cm^-1
  tof_per_meter_us: number; // μs/m
  regime: 'Ultra-Cold' | 'Cold' | 'Thermal' | 'Epithermal' | 'Fast';
}

export function calculateNeutronKinematics(wavelength_angstrom: number): NeutronKinematics {
  const lambda = Math.max(0.01, wavelength_angstrom);
  // Constants
  // E (meV) = 81.8048 / lambda^2
  const energy_meV = 81.8048 / (lambda * lambda);
  const energy_J = energy_meV * 1.602176634e-22; // 1 meV = 1.602e-22 J
  // Velocity v = 3956.03 / lambda (m/s)
  const velocity_ms = 3956.0336 / lambda;
  // Wavevector k = 2π / lambda (Å^-1)
  const wavevector_k = (2 * Math.PI) / lambda;
  // Temperature T (K) = E (meV) * 11.604518
  const temperature_K = energy_meV * 11.604518;
  // Frequency ν (THz) = E (meV) / 4.135667 = 0.2417989 * E (meV)
  const frequency_THz = energy_meV * 0.2417989;
  // Wavenumber (cm^-1) = E (meV) * 8.06554
  const wavenumber_cm1 = energy_meV * 8.06554;
  // TOF per meter (μs/m) = 1e6 / velocity_ms = lambda * 252.778
  const tof_per_meter_us = lambda * 252.7784;

  let regime: 'Ultra-Cold' | 'Cold' | 'Thermal' | 'Epithermal' | 'Fast' = 'Thermal';
  if (energy_meV < 0.001) regime = 'Ultra-Cold';
  else if (energy_meV < 10) regime = 'Cold';
  else if (energy_meV <= 100) regime = 'Thermal';
  else if (energy_meV <= 10000) regime = 'Epithermal';
  else regime = 'Fast';

  return {
    wavelength: lambda,
    energy_meV,
    energy_J,
    velocity_ms,
    wavevector_k,
    temperature_K,
    frequency_THz,
    wavenumber_cm1,
    tof_per_meter_us,
    regime
  };
}
