import { PawleyPreset } from './PawleyLeBailTypes';

export const PAWLEY_PRESETS: PawleyPreset[] = [
  {
    id: 'si_srm640',
    name: 'Silicon (NIST SRM 640e)',
    formula: 'Si',
    system: 'Cubic',
    spaceGroup: 'Fd-3m',
    spaceGroupNumber: 227,
    lattice: {
      a: 5.43119,
      b: 5.43119,
      c: 5.43119
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0045,
      v: -0.0022,
      w: 0.0082,
      eta: 0.38,
      zeroShift: 0.015
    },
    background: {
      bg0: 110,
      bg1: -14,
      bg2: 4,
      bg3: -1
    },
    description:
      'NIST Standard Reference Material for line position and profile calibration. Diamond cubic Fd-3m structure with strict systematic absences on (200), (222), and (420), plus exact (511)/(333) accidental superposition.'
  },
  {
    id: 'lab6_srm660a',
    name: 'Lanthanum Hexaboride (NIST SRM 660a)',
    formula: 'LaB6',
    system: 'Cubic',
    spaceGroup: 'Pm-3m',
    spaceGroupNumber: 221,
    lattice: {
      a: 4.15689,
      b: 4.15689,
      c: 4.15689
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0038,
      v: -0.0018,
      w: 0.0065,
      eta: 0.42,
      zeroShift: -0.008
    },
    background: {
      bg0: 95,
      bg1: -10,
      bg2: 3,
      bg3: 0
    },
    description:
      'Primitive cubic profile standard with exceptionally narrow instrumental FWHM and no systematic centering absences.'
  },
  {
    id: 'rutile_tio2',
    name: 'Rutile Titanium Dioxide',
    formula: 'TiO2',
    system: 'Tetragonal',
    spaceGroup: 'P4_2/mnm',
    spaceGroupNumber: 136,
    lattice: {
      a: 4.5937,
      b: 4.5937,
      c: 2.9587
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0062,
      v: -0.0028,
      w: 0.0094,
      eta: 0.45,
      zeroShift: 0.022
    },
    background: {
      bg0: 125,
      bg1: -16,
      bg2: 5,
      bg3: -1
    },
    description:
      'Primitive tetragonal P4_2/mnm mineral archetype with strong (110) and (101) doublets and n-glide zonal extinctions.'
  },
  {
    id: 'anatase_tio2',
    name: 'Anatase Titanium Dioxide',
    formula: 'TiO2',
    system: 'Tetragonal',
    spaceGroup: 'I4_1/amd',
    spaceGroupNumber: 141,
    lattice: {
      a: 3.7845,
      b: 3.7845,
      c: 9.5143
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0075,
      v: -0.0035,
      w: 0.0112,
      eta: 0.48,
      zeroShift: 0.018
    },
    background: {
      bg0: 140,
      bg1: -18,
      bg2: 6,
      bg3: -1.5
    },
    description:
      'Body-centered tetragonal polymorph with high c/a ratio (~2.51), yielding dense peak multiplets at mid-to-high angles.'
  },
  {
    id: 'corundum_al2o3',
    name: 'Alpha-Alumina Corundum',
    formula: 'Al2O3',
    system: 'Trigonal',
    spaceGroup: 'R-3c',
    spaceGroupNumber: 167,
    lattice: {
      a: 4.7587,
      b: 4.7587,
      c: 12.9929
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0051,
      v: -0.0022,
      w: 0.0078,
      eta: 0.40,
      zeroShift: 0.012
    },
    background: {
      bg0: 105,
      bg1: -12,
      bg2: 4,
      bg3: 0
    },
    description:
      'Rhombohedral R-3c internal standard indexed on hexagonal axes. Ideal testbed for obverse centering (-h+k+l = 3n) and c-glide constraints.'
  },
  {
    id: 'quartz_sio2',
    name: 'Alpha-Quartz Low Quartz',
    formula: 'SiO2',
    system: 'Trigonal',
    spaceGroup: 'P3_1 2 1',
    spaceGroupNumber: 152,
    lattice: {
      a: 4.9134,
      b: 4.9134,
      c: 5.4052
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0058,
      v: -0.0025,
      w: 0.0086,
      eta: 0.43,
      zeroShift: 0.02
    },
    background: {
      bg0: 115,
      bg1: -15,
      bg2: 4.5,
      bg3: -1
    },
    description:
      'Chiral trigonal silicate displaying strong (100), (101), and (110) reflections with 3_1 screw axis extinctions along 00l.'
  },
  {
    id: 'zno_wurtzite',
    name: 'Zinc Oxide Wurtzite',
    formula: 'ZnO',
    system: 'Hexagonal',
    spaceGroup: 'P6_3mc',
    spaceGroupNumber: 186,
    lattice: {
      a: 3.2498,
      b: 3.2498,
      c: 5.2066
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0068,
      v: -0.0031,
      w: 0.0098,
      eta: 0.46,
      zeroShift: 0.016
    },
    background: {
      bg0: 130,
      bg1: -16,
      bg2: 5,
      bg3: -1
    },
    description:
      'Hexagonal P6_3mc semiconductor showcasing the hallmark (100), (002), (101) low-angle cluster between 31° and 37° 2Theta.'
  },
  {
    id: 'forsterite_mg2sio4',
    name: 'Forsterite Olivine',
    formula: 'Mg2SiO4',
    system: 'Orthorhombic',
    spaceGroup: 'Pbnm',
    spaceGroupNumber: 62,
    lattice: {
      a: 4.752,
      b: 10.198,
      c: 5.978
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0072,
      v: -0.0032,
      w: 0.0105,
      eta: 0.45,
      zeroShift: 0.024
    },
    background: {
      bg0: 135,
      bg1: -18,
      bg2: 6,
      bg3: -1.5
    },
    description:
      'Orthorhombic silicate (a ≠ b ≠ c) generating dozens of closely overlapping doublets ideal for testing Pawley covariance vs Le Bail stability.'
  },
  {
    id: 'baddeleyite_zro2',
    name: 'Monoclinic Zirconia Baddeleyite',
    formula: 'ZrO2',
    system: 'Monoclinic',
    spaceGroup: 'P2_1/c',
    spaceGroupNumber: 14,
    lattice: {
      a: 5.1505,
      b: 5.2116,
      c: 5.3173,
      beta: 99.23
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0085,
      v: -0.0038,
      w: 0.012,
      eta: 0.5,
      zeroShift: 0.025
    },
    background: {
      bg0: 150,
      bg1: -20,
      bg2: 7,
      bg3: -2
    },
    description:
      'Monoclinic P2_1/c phase with β ≈ 99.23°, splitting equivalent peaks into characteristic (-111) and (111) reflection doublets.'
  },
  {
    id: 'microcline_feldspar',
    name: 'Microcline Potassium Feldspar',
    formula: 'KAlSi3O8',
    system: 'Triclinic',
    spaceGroup: 'C-1',
    spaceGroupNumber: 2,
    lattice: {
      a: 8.56,
      b: 12.96,
      c: 7.22,
      alpha: 90.6,
      beta: 115.8,
      gamma: 87.7
    },
    wavelength: 1.54056,
    profile: {
      u: 0.0092,
      v: -0.004,
      w: 0.0135,
      eta: 0.52,
      zeroShift: 0.028
    },
    background: {
      bg0: 160,
      bg1: -22,
      bg2: 8,
      bg3: -2
    },
    description:
      'Low-symmetry triclinic C-1 framework silicate with oblique inter-axial angles, showcasing dense multiplet overlap and extreme normal-matrix coupling.'
  }
];
