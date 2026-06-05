import React, { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, 
  Zap, 
  ChevronRight, 
  Database, 
  Info, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  X, 
  SlidersHorizontal,
  Layers,
  Sparkles,
  ClipboardCheck,
  Eye,
  Download,
  Upload,
  FileJson
} from 'lucide-react';

interface MaterialPreset {
  name: string;
  formula: string;
  wavelength: number;
  peaks: number[];
  hkls: string[];
  description: string;
  category: 'Standard' | 'Metal' | 'Ceramic' | 'Perovskite' | 'Biomaterial' | 'Nuclear' | 'Thermoelectric' | 'Metallurgy' | 'Polymer' | 'Semiconductor' | 'Custom';
  crystalSystem?: string;
  spaceGroup?: string;
  latticeParams?: string;
  database?: 'ICDD' | 'COD' | 'RRUFF' | 'ICSD' | 'CSD';
  databaseId?: string;
}

const PRESETS: MaterialPreset[] = [
  {
    name: 'Silicon Standard',
    formula: 'Si',
    wavelength: 1.5406,
    peaks: [28.442, 47.302, 56.123, 69.131, 76.38, 88.03, 94.89],
    hkls: ['111', '220', '311', '400', '331', '422', '511'],
    description: 'Internal reference standard used globally for peak position and line-broadening calibration.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 5.4311 Å',
    database: 'ICDD',
    databaseId: 'PDF 00-027-1402'
  },
  {
    name: 'Corundum Standard (Al2O3)',
    formula: 'Al2O3',
    wavelength: 1.5406,
    peaks: [25.58, 35.15, 37.78, 43.36, 52.55, 57.50, 61.30, 66.52, 68.21],
    hkls: ['012', '104', '110', '113', '024', '116', '018', '214', '300'],
    description: 'NIST Standard Reference Material SRM 676a used for quantitative analysis and instrument calibration.',
    category: 'Standard',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c (No. 167)',
    latticeParams: 'a = 4.7587 Å, c = 12.993 Å',
    database: 'ICDD',
    databaseId: 'SRM 676a'
  },
  {
    name: 'Lanthanum Hexaboride (LaB6)',
    formula: 'LaB6',
    wavelength: 1.5406,
    peaks: [21.36, 30.38, 37.44, 43.51, 48.96, 53.99, 58.71, 63.19],
    hkls: ['100', '110', '111', '200', '210', '211', '220', '300'],
    description: 'NIST Standard Reference Material SRM 660c, world-wide high-accuracy line profile calibrator.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m (No. 221)',
    latticeParams: 'a = 4.1569 Å',
    database: 'ICDD',
    databaseId: 'SRM 660c'
  },
  {
    name: 'Polyethylene (HDPE)',
    formula: '(C2H4)n',
    wavelength: 1.5406,
    peaks: [21.5, 24.0, 30.1, 36.3, 39.7],
    hkls: ['110', '200', '210', '020', '011'],
    description: 'High-density semi-crystalline polymer showing strong crystalline reflections superimposed on amorphous halo.',
    category: 'Polymer',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnam (No. 62)',
    latticeParams: 'a = 7.42 Å, b = 4.96 Å, c = 2.54 Å',
    database: 'CSD',
    databaseId: 'POLYET01'
  },
  {
    name: 'Polypropylene (Isotactic)',
    formula: '(C3H6)n',
    wavelength: 1.5406,
    peaks: [14.1, 16.9, 18.6, 21.2, 21.8],
    hkls: ['110', '040', '130', '111', '041'],
    description: 'Alpha-form isotactic PP, showing multiple sharp characteristic reflections due to its monoclinic packing.',
    category: 'Polymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c (No. 14)',
    latticeParams: 'a = 6.65 Å, b = 20.96 Å, c = 6.50 Å, β = 99.3°',
    database: 'CSD',
    databaseId: 'PPOL01'
  },
  {
    name: 'Benzoic Acid',
    formula: 'C7H6O2',
    wavelength: 1.5406,
    peaks: [8.15, 11.95, 15.62, 17.48, 20.15, 23.85, 27.50],
    hkls: ['001', '100', '101', '110', '111', '200', '202'],
    description: 'Monoclinic molecular crystal of benzoic acid, classic sublimation standard.',
    category: 'Polymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c (No. 14)',
    latticeParams: 'a = 5.51 Å, b = 5.12 Å, c = 21.90 Å, β = 97.3°',
    database: 'CSD',
    databaseId: 'BENZAC01'
  },
  {
    name: 'L-Alanine',
    formula: 'C3H7NO2',
    wavelength: 1.5406,
    peaks: [13.06, 17.52, 20.58, 22.18, 25.10, 29.45, 32.10],
    hkls: ['100', '011', '110', '111', '200', '021', '211'],
    description: 'Orthorhombic chiral amino acid crystal structure from CSD file reference.',
    category: 'Polymer',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'P212121 (No. 19)',
    latticeParams: 'a = 6.02 Å, b = 12.35 Å, c = 5.78 Å',
    database: 'CSD',
    databaseId: 'LALNIN12'
  },
  {
    name: 'Paracetamol (Form I)',
    formula: 'C8H9NO2',
    wavelength: 1.5406,
    peaks: [12.15, 15.65, 18.20, 20.35, 23.51, 26.54, 27.20],
    hkls: ['001', '110', '020', '111', '022', '120', '200'],
    description: 'Most stable monoclinic polymorph of acetaminophen, CSD reference standard.',
    category: 'Polymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/a (No. 14)',
    latticeParams: 'a = 7.10 Å, b = 9.38 Å, c = 11.75 Å, β = 97.4°',
    database: 'CSD',
    databaseId: 'HXACAN01'
  },
  {
    name: 'PTFE (Teflon)',
    formula: '(CF2)n',
    wavelength: 1.5406,
    peaks: [18.1, 31.5, 36.6, 41.2],
    hkls: ['100', '110', '200', '107'],
    description: 'Highly helical crystalline polymer with a prominent reflection at 18.1° corresponding to interchain packing.',
    category: 'Polymer',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P3121 (No. 152)',
    latticeParams: 'a = 5.66 Å, c = 19.50 Å'
  },
  {
    name: 'Nylon 6',
    formula: '(C6H11NO)n',
    wavelength: 1.5406,
    peaks: [20.3, 23.7],
    hkls: ['200', '002'],
    description: 'Alpha crystalline monoclinic phase structured by hydrogen-bonded molecular chains.',
    category: 'Polymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/b (No. 14)',
    latticeParams: 'a = 9.56 Å, b = 17.24 Å, c = 8.01 Å, β = 67.5°'
  },
  {
    name: 'Polyethylene Terephthalate',
    formula: '(C10H8O4)n',
    wavelength: 1.5406,
    peaks: [16.2, 17.5, 22.8, 26.1],
    hkls: ['010', '110', '100', '110'],
    description: 'Semi-crystalline PET showing structural peaks induced via thermal holding or stretch orientation.',
    category: 'Polymer',
    crystalSystem: 'Triclinic',
    spaceGroup: 'P-1 (No. 2)',
    latticeParams: 'a = 4.56 Å, b = 5.94 Å, c = 10.75 Å'
  },
  {
    name: 'Aluminum',
    formula: 'Al',
    wavelength: 1.5406,
    peaks: [38.47, 44.72, 65.10, 78.23, 82.44],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Face-centered cubic metal, ideal for standard cell calculation and educational indexing.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0494 Å',
    database: 'COD',
    databaseId: '9008460'
  },
  {
    name: 'Gold Powder',
    formula: 'Au',
    wavelength: 1.5406,
    peaks: [38.19, 44.39, 64.58, 77.55, 81.72],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Heavy chemical standard. Very high electron density creates brilliant reflections for instrument calibration.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0786 Å',
    database: 'ICSD',
    databaseId: '52249'
  },
  {
    name: 'Alpha Iron',
    formula: 'Fe',
    wavelength: 1.5406,
    peaks: [44.67, 65.02, 82.33, 98.94],
    hkls: ['110', '200', '211', '220'],
    description: 'Body-centered cubic Ferrite matrix, standard for structural steel alloying and phase analysis.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 2.8664 Å',
    database: 'COD',
    databaseId: '9006597'
  },
  {
    name: 'Cerium Oxide',
    formula: 'CeO2',
    wavelength: 1.5406,
    peaks: [28.55, 33.08, 47.48, 56.33, 59.08, 69.41, 76.70, 79.07],
    hkls: ['111', '200', '220', '311', '222', '400', '331', '420'],
    description: 'Fluorite cubic oxide displaying high catalytic action; excellent for line profile grain size evaluations.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.4110 Å',
    database: 'ICSD',
    databaseId: '28709'
  },
  {
    name: 'Titanium Dioxide (Rutile)',
    formula: 'TiO2',
    wavelength: 1.5406,
    peaks: [27.44, 36.08, 39.18, 41.22, 44.05, 54.31, 56.62, 62.73, 64.03, 68.99],
    hkls: ['110', '101', '200', '111', '210', '211', '220', '002', '310', '301'],
    description: 'Thermally stable tetragonal polymorph of titanium dioxide showing high refractive index.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm (No. 136)',
    latticeParams: 'a = 4.5937 Å, c = 2.9587 Å',
    database: 'COD',
    databaseId: '9004143'
  },
  {
    name: 'Titanium Dioxide (Anatase)',
    formula: 'TiO2',
    wavelength: 1.5406,
    peaks: [25.28, 37.80, 48.05, 53.89, 55.06, 62.69, 68.76, 70.31, 75.03],
    hkls: ['101', '004', '200', '105', '211', '204', '116', '220', '215'],
    description: 'Metastable photoactive polymorph of titania, standard for thin-film solar cell validation and nanotechnology.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I41/amd (No. 141)',
    latticeParams: 'a = 3.7852 Å, c = 9.5139 Å',
    database: 'COD',
    databaseId: '9015929'
  },
  {
    name: 'Calcite (CaCO3)',
    formula: 'CaCO3',
    wavelength: 1.5406,
    peaks: [23.06, 29.40, 31.42, 35.96, 39.40, 43.16, 47.50, 48.50],
    hkls: ['012', '104', '006', '110', '113', '202', '018', '116'],
    description: 'Highly crystalline trigonal polymorph of calcium carbonate. COD open benchmark mineral data.',
    category: 'Ceramic',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c (No. 167)',
    latticeParams: 'a = 4.989 Å, c = 17.062 Å',
    database: 'COD',
    databaseId: '9016142'
  },
  {
    name: 'Graphite',
    formula: 'C',
    wavelength: 1.5406,
    peaks: [26.54, 42.43, 44.59, 54.67, 77.54],
    hkls: ['002', '100', '101', '004', '110'],
    description: 'In-plane hexagonal sp² carbon displaying enormous basal orientation anisotropy.',
    category: 'Standard',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.464 Å, c = 6.708 Å',
    database: 'COD',
    databaseId: '9008569'
  },
  {
    name: 'Sodium Chloride',
    formula: 'NaCl',
    wavelength: 1.5406,
    peaks: [27.35, 31.69, 45.45, 53.89, 56.48, 66.23, 75.31],
    hkls: ['111', '200', '220', '311', '222', '400', '420'],
    description: 'Prototypical rock salt ionic structure, perfect for demonstrating structural factor absences.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.6402 Å',
    database: 'COD',
    databaseId: '9011119'
  },
  {
    name: 'Copper',
    formula: 'Cu',
    wavelength: 1.5406,
    peaks: [43.30, 50.43, 74.13, 89.93, 116.92],
    hkls: ['111', '200', '220', '311', '400'],
    description: 'Highly ordered metallic wire alloy substrate, showing characteristic intense peak shifts.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.6149 Å',
    database: 'COD',
    databaseId: '9013014'
  },
  {
    name: 'Silver',
    formula: 'Ag',
    wavelength: 1.5406,
    peaks: [38.12, 44.30, 64.44, 77.40, 81.54],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Brilliant conductive silver nanoparticles for studying size-strain properties through full-width indices.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0862 Å',
    database: 'COD',
    databaseId: '9012431'
  },
  {
    name: 'Zinc Oxide',
    formula: 'ZnO',
    wavelength: 1.5406,
    peaks: [31.77, 34.42, 36.25, 47.54, 56.60, 62.86, 66.38, 67.96, 69.10],
    hkls: ['100', '002', '101', '102', '110', '103', '200', '112', '201'],
    description: 'Hexagonal wurtzite crystal system, important optoelectronic material that shows multiple diagnostic reflections.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.2498 Å, c = 5.2066 Å',
    database: 'COD',
    databaseId: '2107059'
  },
  {
    name: 'Quartz (Alpha)',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [20.86, 26.64, 36.54, 39.46, 40.29, 42.45, 45.79, 50.14, 54.87, 59.95, 60.14],
    hkls: ['100', '101', '110', '102', '111', '200', '201', '112', '202', '211', '103'],
    description: 'Trigonal quartz matrix. Extremely rich in low-symmetry peaks, frequently chosen for indexing exercises.',
    category: 'Ceramic',
    crystalSystem: 'Trigonal',
    spaceGroup: 'P3221 (No. 154)',
    latticeParams: 'a = 4.9134 Å, c = 5.4052 Å',
    database: 'RRUFF',
    databaseId: 'R040003'
  },
  {
    name: 'Beta-Quartz (High Quartz)',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [20.6, 25.8, 36.4, 38.8, 42.3, 45.5, 50.0],
    hkls: ['100', '101', '110', '102', '200', '201', '112'],
    description: 'The high-temperature polymorph of quartz, stable above 573 °C (at ambient pressure).',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6222 (No. 180)',
    database: 'ICSD',
  },
  {
    name: 'Alpha-Cristobalite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [21.9, 31.4, 36.1, 42.7, 44.8, 48.6],
    hkls: ['101', '102', '200', '211', '202', '113'],
    description: 'Low-temperature, tetragonal polymorph of cristobalite.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P41212 (No. 92)',
    database: 'ICSD',
  },
  {
    name: 'Beta-Cristobalite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [21.5, 35.8, 44.3, 48.2],
    hkls: ['111', '220', '311', '222'],
    description: 'High-temperature cubic polymorph of cristobalite.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    database: 'ICSD',
  },
  {
    name: 'Alpha-Tridymite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [20.5, 21.6, 23.2, 28.8, 35.9, 43.1],
    hkls: ['-111', '200', '111', '220', '-311', '040'],
    description: 'Low-symmetry monoclinic polymorph of tridymite.',
    category: 'Ceramic',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'Cc (No. 9)',
    database: 'ICSD',
  },
  {
    name: 'Beta-Tridymite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [21.2, 35.6, 42.5],
    hkls: ['100', '110', '200'],
    description: 'High-temperature hexagonal polymorph of tridymite.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    database: 'ICSD',
  },
  {
    name: 'Stishovite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [28.5, 33.2, 41.2, 43.8, 47.2, 53.8],
    hkls: ['110', '101', '111', '210', '211', '220'],
    description: 'Extremely dense, high-pressure rutile-structured silica.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm (No. 136)',
    database: 'ICSD',
  },
  {
    name: 'Keatite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [23.8, 27.5, 33.5, 38.4, 45.6],
    hkls: ['101', '110', '111', '200', '210'],
    description: 'Synthetic tetragonal polymorph of silica.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P41212 (No. 92)',
    database: 'ICSD',
  },
  {
    name: 'Moganite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [20.1, 26.6, 36.4, 39.5, 42.3],
    hkls: ['110', '020', '200', '112', '022'],
    description: 'Monoclinic polymorph of silica.',
    category: 'Ceramic',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'I2/a (No. 15)',
    database: 'ICSD',
  },
  {
    name: 'Seifertite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [30.1, 31.5, 34.2, 42.1, 48.5],
    hkls: ['110', '111', '020', '200', '121'],
    description: 'Ultra-high-pressure polymorph of silica.',
    category: 'Ceramic',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pbcn (No. 60)',
    database: 'ICSD',
  },
  {
    name: 'Coesite',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [26.0, 27.2, 28.3, 30.2, 34.1],
    hkls: ['020', '111', '021', '002', '120'],
    description: 'A high-pressure monoclinic polymorph of silica.',
    category: 'Ceramic',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'C2/c (No. 15)',
    database: 'ICSD',
  },
  {
    name: 'Magnetite (Fe3O4)',
    formula: 'Fe3O4',
    wavelength: 1.5406,
    peaks: [30.10, 35.42, 43.05, 53.48, 56.94, 62.51],
    hkls: ['220', '311', '400', '422', '511', '440'],
    description: 'Superparamagnetic spinel structure magnetite mineral standard from RRUFF archive.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 8.397 Å',
    database: 'RRUFF',
    databaseId: 'R061111'
  },
  {
    name: 'Beryl (Be3Al2Si6O18)',
    formula: 'Be3Al2Si6O18',
    wavelength: 1.5406,
    peaks: [11.02, 19.15, 22.14, 25.32, 28.18, 30.65, 34.60],
    hkls: ['100', '110', '111', '201', '202', '300', '212'],
    description: 'Rare hexagonal ring silicate mineral structure from the RRUFF physical database.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6/mcc (No. 192)',
    latticeParams: 'a = 9.215 Å, c = 9.192 Å',
    database: 'RRUFF',
    databaseId: 'R040018'
  },
  {
    name: 'Diamond',
    formula: 'C',
    wavelength: 1.5406,
    peaks: [43.92, 75.30, 91.50, 119.52],
    hkls: ['111', '220', '311', '400'],
    description: 'Sp³ carbon diamond-cubic framework with ultra-small unit cell sizes and sparse peaks.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 3.5671 Å',
    database: 'ICSD',
    databaseId: '26911'
  },
  {
    name: 'Hydroxyapatite',
    formula: 'Ca10(PO4)6(OH)2',
    wavelength: 1.5406,
    peaks: [25.87, 31.77, 32.19, 32.90, 34.04, 39.81],
    hkls: ['002', '211', '112', '300', '202', '310'],
    description: 'Highly relevant bio-mineral form of calcium phosphate used in bone implants and scaffolds.',
    category: 'Biomaterial',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/m (No. 176)',
    latticeParams: 'a = 9.418 Å, c = 6.884 Å',
    database: 'ICSD',
    databaseId: '16182'
  },
  {
    name: 'Barium Titanate',
    formula: 'BaTiO3',
    wavelength: 1.5406,
    peaks: [22.20, 31.50, 38.90, 45.30, 50.90, 56.20],
    hkls: ['100', '110', '111', '200', '210', '211'],
    description: 'Classic ferroelectric perovskite demonstrating structural transitions between cubic and tetragonal.',
    category: 'Perovskite',
    crystalSystem: 'Tetragonal / Cubic',
    spaceGroup: 'P4mm / Pm-3m',
    latticeParams: 'a = 3.996 Å, c = 4.036 Å',
    database: 'ICSD',
    databaseId: '74125'
  },
  {
    name: 'Methylammonium Lead Iodide (MAPbI3) [ICSD]',
    formula: 'CH3NH3PbI3',
    wavelength: 1.5406,
    peaks: [14.08, 24.46, 28.41, 31.85, 40.64, 43.18],
    hkls: ['110', '200', '220', '310', '224', '314'],
    description: 'Hybrid organic-inorganic perovskite solar cell material from the ICSD database.',
    category: 'Perovskite',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I4/mcm (No. 140)',
    latticeParams: 'a = 8.855 Å, c = 12.659 Å',
    database: 'ICSD',
    databaseId: '238610'
  },
  {
    name: 'Lithium Iron Phosphate (LiFePO4)',
    formula: 'LiFePO4',
    wavelength: 1.5406,
    peaks: [17.14, 20.78, 25.56, 29.68, 32.12, 35.62, 42.15],
    hkls: ['020', '101', '111', '201', '121', '311', '131'],
    description: 'Olivine structure high-safety lithium-ion battery cathode material, ICSD reference.',
    category: 'Ceramic',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnma (No. 62)',
    latticeParams: 'a = 10.33 Å, b = 6.01 Å, c = 4.69 Å',
    database: 'ICSD',
    databaseId: '96738'
  },
  {
    name: 'Uranium Dioxide',
    formula: 'UO2',
    wavelength: 1.5406,
    peaks: [28.2, 32.7, 47.0, 55.8, 58.5],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Fluorite cubic structure. The baseline primary oxide fuel for light water nuclear reactions.',
    category: 'Nuclear',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.470 Å',
    database: 'ICSD',
    databaseId: '644550'
  },
  {
    name: 'Thorium Dioxide',
    formula: 'ThO2',
    wavelength: 1.5406,
    peaks: [27.6, 31.9, 45.8, 54.4, 57.0],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'High thermal conductivity nuclear breeding material featuring extremely high melt stability.',
    category: 'Nuclear',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.600 Å'
  },
  {
    name: 'Zircaloy-4',
    formula: 'Zr Alloy',
    wavelength: 1.5406,
    peaks: [31.9, 34.8, 36.5, 47.9],
    hkls: ['100', '002', '101', '102'],
    description: 'Corrosion-resistant Zr-matrix alloy for reactor cladding showing Hexagonal-Close-Packed (HCP) structural modes.',
    category: 'Nuclear',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.232 Å, c = 5.147 Å'
  },
  {
    name: 'Stainless Steel 316L',
    formula: 'Fe-Cr-Ni',
    wavelength: 1.5406,
    peaks: [43.6, 50.8, 74.7, 90.7, 95.9],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Low-carbon austenitic alloy with added molybdenum to resist localized pitting corrosion.',
    category: 'Metallurgy',
    crystalSystem: 'Cubic (Austenite)',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.596 Å'
  },
  {
    name: 'Stainless Steel 304',
    formula: 'Fe-Cr-Ni (304)',
    wavelength: 1.5406,
    peaks: [43.5, 50.7, 74.5, 90.5, 95.7],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Classic austenitic alloy highly structured for general structural and household applications.',
    category: 'Metallurgy',
    crystalSystem: 'Cubic (Austenite)',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.590 Å'
  },
  {
    name: 'Ti-6Al-4V (Grade 5)',
    formula: 'Ti-6Al-4V',
    wavelength: 1.5406,
    peaks: [35.1, 38.4, 40.2, 53.0, 63.3, 70.6, 76.2],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Standard workhorse aerospace grade alloy highlighting dual HCP alpha and BCC beta crystal mixtures.',
    category: 'Metallurgy',
    crystalSystem: 'Dual Phase HCP + BCC',
    spaceGroup: 'P63/mmc + Im-3m',
    latticeParams: 'a(hcp) = 2.93 Å, a(bcc) = 3.22 Å'
  },
  {
    name: 'Bismuth Telluride',
    formula: 'Bi2Te3',
    wavelength: 1.5406,
    peaks: [17.5, 27.6, 37.8, 41.2, 44.6, 50.3],
    hkls: ['006', '015', '1010', '110', '0015', '205'],
    description: 'Layered rhombohedral structure, foundational thermoelectric and pioneering topological insulator.',
    category: 'Thermoelectric',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3m (No. 166)',
    latticeParams: 'a = 4.384 Å, c = 30.49 Å',
    database: 'ICSD',
    databaseId: '23554'
  },
  {
    name: 'Gallium Nitride',
    formula: 'GaN',
    wavelength: 1.5406,
    peaks: [32.39, 34.56, 36.84, 48.08, 57.77, 63.34],
    hkls: ['100', '002', '101', '102', '110', '103'],
    description: 'High-power wide-bandgap semiconductor configured extensively for modern solid-state green/blue lasers and power grids.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal (Wurtzite)',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.189 Å, c = 5.185 Å',
    database: 'ICSD',
    databaseId: '51432'
  },
  {
    name: 'Molybdenum Disulfide',
    formula: 'MoS2',
    wavelength: 1.5406,
    peaks: [14.38, 29.02, 32.67, 33.51, 35.87, 39.54, 44.15],
    hkls: ['002', '004', '100', '101', '102', '103', '006'],
    description: 'Monolayer transition metal dichalcogenide; prominent hexagonal structural shifts indicate solid-state shearing.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.16 Å, c = 12.29 Å'
  },
  {
    name: 'Titanium Carbide MXene (Ti3C2Tx)',
    formula: 'Ti3C2Tx',
    wavelength: 1.5406,
    peaks: [9.10, 18.25, 27.42, 36.35, 41.80, 60.48],
    hkls: ['002', '004', '006', '101', '103', '110'],
    description: 'A leading 2D transition metal carbide (MXene) nanomaterial showing highly characteristic basal plane (002) reflection at ultra-low angles due to expanded interlayer spacing. Highly prized for energy storage and electromagnetic shielding.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.05 Å, c = 19.40'
  },
  {
    name: 'Single-Walled Carbon Nanotubes (SWCNTs)',
    formula: 'C (SWCNT)',
    wavelength: 1.5406,
    peaks: [5.85, 26.15, 42.82, 44.50],
    hkls: ['Bundle', '002', '100', '101'],
    description: 'A superb 1D carbon nanomaterial showing a characteristic low-angle packing peak of rolled graphene sheets and broad bundle reflections.',
    category: 'Standard',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6/mmm (No. 191)',
    latticeParams: 'a = 2.46 Å, c = 20.2 Å',
    database: 'COD',
    databaseId: '9012290'
  },
  {
    name: 'Graphene Oxide Nanosheets',
    formula: 'C_x_O_y_H_z',
    wavelength: 1.5406,
    peaks: [10.60, 26.54, 42.43, 54.67],
    hkls: ['001', '002', '100', '004'],
    description: 'Two-dimensional oxide-functionalized graphene sheet displaying a diagnostic interlayer (001) reflection at ultra-low angles. Ideal for graphene reduction studies.',
    category: 'Standard',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.46 Å, c = 16.6 Å (Interlayer Spacing: 0.83 nm)',
    database: 'COD',
    databaseId: '9008569'
  },
  {
    name: 'Colloidal Gold Nanoparticles',
    formula: 'Au (Nano)',
    wavelength: 1.5406,
    peaks: [38.18, 44.38, 64.57, 77.54, 81.72],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Ultra-small face-centered cubic gold crystallites (12nm Average Size) exhibiting notable Scherrer peak broadening. Extensively used as reference models in size-broadening deconvolution.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0786 Å',
    database: 'ICDD',
    databaseId: 'PDF 00-004-0784'
  },
  {
    name: 'Silver Nanowires (1D NWs)',
    formula: 'Ag (Nano)',
    wavelength: 1.5406,
    peaks: [38.12, 44.30, 64.44, 77.40, 81.54],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Highly crystalline, high aspect ratio 1D silver nanowires showing strong preferred orientation along the (111) fiber normal. Essential for flexible transparent conductors.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0862 Å',
    database: 'COD',
    databaseId: '9012431'
  },
  {
    name: 'Superparamagnetic Iron Oxide (SPIONs)',
    formula: 'Fe3O4 (Nano)',
    wavelength: 1.5406,
    peaks: [30.10, 35.42, 43.05, 53.48, 56.94, 62.51],
    hkls: ['220', '311', '400', '422', '511', '440'],
    description: 'Nanosized magnetite spherical crystallites showcasing significant finite-size broadening corresponding to 8nm core grain diameters. Frequently monitored for bio-targeted magnetic resonance contrast agents and hyperthermia.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 8.397 Å',
    database: 'RRUFF',
    databaseId: 'R061111'
  },
  {
    name: 'Zinc Oxide Quantum Dots (ZnO QDs)',
    formula: 'ZnO (QD)',
    wavelength: 1.5406,
    peaks: [31.77, 34.42, 36.25, 47.54, 56.60, 62.86],
    hkls: ['100', '002', '101', '102', '110', '103'],
    description: 'Highly confined hexagonal wurtzite zinc oxide nanocrystals. Ideal for investigating size/strain broadening effects on wide-bandgap quantum structures.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.2498 Å, c = 5.2066 Å',
    database: 'COD',
    databaseId: '2107059'
  },
  {
    name: 'Titanium Dioxide Nanotubes (TiO2 NTs)',
    formula: 'TiO2 (Nano)',
    wavelength: 1.5406,
    peaks: [25.28, 37.80, 48.05, 53.89, 55.06, 62.69],
    hkls: ['101', '004', '200', '105', '211', '204'],
    description: 'Anodized 1D anatase nanotube arrays with dominant (101) texturing. Benchmark photocatalyst database profile.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I41/amd (No. 141)',
    latticeParams: 'a = 3.7852 Å, c = 9.5139 Å',
    database: 'COD',
    databaseId: '9015929'
  },
  {
    name: 'Cadmium Selenide Quantum Dots (CdSe QDs)',
    formula: 'CdSe',
    wavelength: 1.5406,
    peaks: [25.35, 27.10, 28.15, 35.12, 42.18, 45.72, 49.65],
    hkls: ['100', '002', '101', '110', '103', '200', '112'],
    description: 'Pristine hexagonal wurtzite optoelectronic quantum dots showcasing highly symmetric grain core broadening. From standard ICSD databases.',
    category: 'Thermoelectric',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 4.299 Å, c = 7.011 Å',
    database: 'ICSD',
    databaseId: '41578'
  },
  {
    name: 'Cesium Lead Bromide Nanocrystals (CsPbBr3)',
    formula: 'CsPbBr3',
    wavelength: 1.5406,
    peaks: [15.15, 21.52, 30.38, 34.35, 37.76, 43.82],
    hkls: ['100', '110', '200', '210', '211', '220'],
    description: 'Colloidal lead halide perovskite nanocubes showing supreme photoluminescent efficiency. Fingerprint orthorhombic database reference.',
    category: 'Perovskite',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnma (No. 62)',
    latticeParams: 'a = 8.207 Å, b = 8.242 Å, c = 11.759 Å',
    database: 'ICSD',
    databaseId: '97851'
  },
  {
    name: 'Quantum-Confined Silicon NPs',
    formula: 'Si (Nano)',
    wavelength: 1.5406,
    peaks: [28.44, 47.30, 56.12, 69.13, 76.38],
    hkls: ['111', '220', '311', '400', '331'],
    description: 'Quantum-confined silicon nanoparticles showing diagnostic amorphous core-shell scattering. Excellent validation profile from standard ICDD catalogs.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 5.4311 Å',
    database: 'ICDD',
    databaseId: 'PDF 00-027-1402'
  },
  {
    name: 'Exfoliated 2D MoS2 Nanosheets',
    formula: 'MoS2',
    wavelength: 1.5406,
    peaks: [14.40, 32.70, 39.50, 49.80, 58.30],
    hkls: ['002', '100', '103', '105', '110'],
    description: 'High-surface-area exfoliated transition metal dichalcogenide nanosheets show significant dampening and shifting of basal plane peak intensities.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.160 Å, c = 12.300 Å',
    database: 'COD',
    databaseId: '9008451'
  },
  {
    name: 'Zeolitic Imidazolate Framework-8 (ZIF-8)',
    formula: 'Zn(C4H5N2)2',
    wavelength: 1.5406,
    peaks: [7.32, 10.37, 12.72, 14.70, 16.44, 18.01],
    hkls: ['011', '002', '112', '022', '013', '222'],
    description: 'Highly porous crystalline metal-organic framework (MOF) nanocrystals built for gas separation, showing signature low-angle nodes.',
    category: 'Biomaterial',
    crystalSystem: 'Cubic',
    spaceGroup: 'I-43m (No. 217)',
    latticeParams: 'a = 16.99 Å',
    database: 'CSD',
    databaseId: 'VELVOY'
  },
  {
    name: 'HKUST-1 MOF Nanocrystals',
    formula: 'Cu3(C9H3O6)2',
    wavelength: 1.5406,
    peaks: [5.82, 6.74, 9.48, 11.62, 13.43, 14.98],
    hkls: ['200', '220', '400', '422', '440', '620'],
    description: 'Highly ordered porous coordination framework featuring copper acetate wheels. Prevalent porous standard reference in the Cambridge Structural Database (CSD).',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 26.34 Å',
    database: 'CSD',
    databaseId: 'FIQCEN'
  },
  {
    name: 'High-Purity Platinum (Pt)',
    formula: 'Pt',
    wavelength: 1.5406,
    peaks: [39.76, 46.24, 67.45, 81.28, 85.71],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Catalytically active precious face-centered cubic metal. Frequently used as a reliable high-pressure internal calibrant from COD database.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.9231 Å',
    database: 'COD',
    databaseId: '9012957'
  },
  {
    name: 'Cobalt Nanoparticles (Hexagonal)',
    formula: 'Co (Hex)',
    wavelength: 1.5406,
    peaks: [41.65, 44.42, 47.51, 75.85],
    hkls: ['100', '002', '101', '110'],
    description: 'Fine hexagonal close-packed cobalt grains showing clear size-related visual broadening. Essential reference from Crystallography Open Database.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.507 Å, c = 4.070 Å',
    database: 'COD',
    databaseId: '9012435'
  },
  {
    name: 'Tungsten Heavy Refractory (W)',
    formula: 'W',
    wavelength: 1.5406,
    peaks: [40.26, 58.25, 73.18, 86.97, 100.74, 114.93],
    hkls: ['110', '200', '211', '220', '310', '222'],
    description: 'Ultra-dense body-centered cubic tungsten element exhibiting immense high-temperature stabilization and minimal thermal expansion. Reference database index.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 3.1652 Å',
    database: 'COD',
    databaseId: '9008558'
  },
  {
    name: 'Alpha Titanium (α-Ti)',
    formula: 'Ti',
    wavelength: 1.5406,
    peaks: [35.10, 38.42, 40.18, 53.01, 63.00, 70.66, 76.22],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Hexagonal close-packed room temperature allotrope of titanium exhibiting premier structural rigidity and biocompatibility. ICDD benchmark entry.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.951 Å, c = 4.686 Å',
    database: 'ICDD',
    databaseId: 'PDF 01-089-5009'
  },
  {
    name: 'Nickel Nanospheres (Ni)',
    formula: 'Ni',
    wavelength: 1.5406,
    peaks: [44.51, 51.85, 76.37, 92.94, 98.44],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Pristine ferromagnetic face-centered cubic nickel nanocrystalline powder showing slight strain-induced asymmetry. COD reference.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.524 Å',
    database: 'COD',
    databaseId: '9013019'
  },
  {
    name: 'High-Entropy Cantor Alloy',
    formula: 'FeCoNiCrMn',
    wavelength: 1.5406,
    peaks: [43.62, 50.81, 74.72, 90.75, 95.91],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Equiatomic robust single-phase austenitic high-entropy alloy (HEA). Displays excellent cryogenic toughness and mechanical strength under high stress.',
    category: 'Metal',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.593 Å',
    database: 'ICSD',
    databaseId: '109244'
  },
  {
    name: 'Pure Magnesium Sheet (Mg)',
    formula: 'Mg',
    wavelength: 1.5406,
    peaks: [32.22, 34.40, 36.62, 47.83, 57.38, 63.07, 68.62],
    hkls: ['100', '002', '101', '102', '110', '103', '200'],
    description: 'Ultra-lightweight elemental magnesium showing clear close-packed hexagonal symmetry. Crucial standard for battery anodes and lightweight alloy designs.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.209 Å, c = 5.211 Å',
    database: 'ICSD',
    databaseId: '52254'
  },
  {
    name: 'Zinc Foil Standards (Zn)',
    formula: 'Zn',
    wavelength: 1.5406,
    peaks: [36.31, 39.02, 43.25, 54.34, 70.09, 70.63, 77.01],
    hkls: ['002', '100', '101', '102', '103', '110', '004'],
    description: 'Hexagonal zinc structures displaying large anisotropic lattice coordinates. Important base standard from the Crystallography Open Database.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.665 Å, c = 4.947 Å',
    database: 'COD',
    databaseId: '9008492'
  },
  {
    name: 'Refractory Tantalum Foil (Ta)',
    formula: 'Ta',
    wavelength: 1.5406,
    peaks: [38.47, 55.55, 69.58, 82.44, 94.94],
    hkls: ['110', '200', '211', '220', '310'],
    description: 'Corrosion resistant refractory cubic tantalum metal showing superb ductility and melting points above 3000°C.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 3.305 Å',
    database: 'COD',
    databaseId: '9006611'
  },
  {
    name: 'Palladium Catalyst (Pd)',
    formula: 'Pd',
    wavelength: 1.5406,
    peaks: [40.12, 46.66, 68.12, 82.10, 86.62],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Prominent FCC heavy-metal catalyst nanocrystals optimized for organic synthesis, hydrogenation, and hydrogen filtration.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.890 Å',
    database: 'COD',
    databaseId: '9012437'
  },
  {
    name: 'Refractory Niobium (Nb)',
    formula: 'Nb',
    wavelength: 1.5406,
    peaks: [38.47, 55.48, 69.45, 82.26, 94.75],
    hkls: ['110', '200', '211', '220', '310'],
    description: 'Premier body-centered cubic refractory metal. Widely used in superconducting cavities and high-temperature alloys.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 3.3008 Å',
    database: 'COD',
    databaseId: '9008518'
  },
  {
    name: 'Iridium Noble Metal (Ir)',
    formula: 'Ir',
    wavelength: 1.5406,
    peaks: [40.66, 47.31, 69.14, 83.47, 88.01],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'The most corrosion-resistant metal known. FCC iridium is a standard reference for high-density metallic scattering.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.8394 Å',
    database: 'COD',
    databaseId: '9008485'
  },
  {
    name: 'Aluminum 6061-T6 Alloy',
    formula: 'Al Alloy (6061)',
    wavelength: 1.5406,
    peaks: [38.44, 44.70, 65.08, 78.20, 82.40],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Precipitation-hardened structural aluminum alloy containing magnesium and silicon. Benchmark for aerospace structural characterization.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.049 Å',
    database: 'ICDD',
    databaseId: 'PDF 04-001-2692'
  },
  {
    name: 'Nickel-Iron Permalloy (Ni80Fe20)',
    formula: 'Ni80Fe20',
    wavelength: 1.5406,
    peaks: [44.20, 51.50, 75.80, 92.15, 97.45],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Extremely high magnetic permeability Nickel-Iron alloy (Permalloy). Crucial standard for soft magnetic thin-film research.',
    category: 'Metal',
    crystalSystem: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.548 Å',
    database: 'ICSD',
    databaseId: '102913'
  },
  {
    name: 'Copper Nanowires (1D Cu NWs)',
    formula: 'Cu (NW)',
    wavelength: 1.5406,
    peaks: [43.32, 50.45, 74.15, 89.95],
    hkls: ['111', '200', '220', '311'],
    description: 'Ultra-high aspect ratio 1D copper nanowires. Profiles exhibit strong (111) texturing and characteristic size/strain broadening from the ICDD nanomaterial database.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.615 Å',
    database: 'ICDD',
    databaseId: 'NANO-Cu-01'
  },
  {
    name: 'Silver Nanocubes (Plasmonic)',
    formula: 'Ag (NC)',
    wavelength: 1.5406,
    peaks: [38.15, 44.32, 64.51, 77.45],
    hkls: ['111', '200', '220', '311'],
    description: 'Shape-controlled silver nanocubes optimized for SERS and plasmonics. Shows distinct cubic symmetry and finite-size broadening fingerprints.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.086 Å',
    database: 'COD',
    databaseId: '9012431'
  },
  {
    name: 'Tantalum Carbide (TaC)',
    formula: 'TaC',
    wavelength: 1.5406,
    peaks: [34.90, 40.50, 58.65, 70.15, 73.78, 87.82, 99.45],
    hkls: ['111', '200', '220', '311', '222', '400', '331'],
    description: 'Ultra-refractory interstitial carbide with extremely high melting point and metallic conductivity. Standard FCC-type interstitial reference.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.455 Å',
    database: 'COD',
    databaseId: '9008761'
  },
  {
    name: 'Hardened Chromium Steel (S600)',
    formula: 'Fe-Cr-V-W',
    wavelength: 1.5406,
    peaks: [44.75, 65.12, 82.45, 99.12],
    hkls: ['110', '200', '211', '220'],
    description: 'High-speed hardened tool steel containing complex carbides in a tempered martensitic BCC matrix.',
    category: 'Metal',
    crystalSystem: 'Cubic (Martensite/BCC)',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 2.871 Å',
    database: 'ICDD',
    databaseId: 'PDF 04-001-2695'
  },
  {
    name: 'Chromium Standard (Cr)',
    formula: 'Cr',
    wavelength: 1.5406,
    peaks: [44.39, 64.58, 81.72],
    hkls: ['110', '200', '211'],
    description: 'BCC transition metal standard often used as an alloying element in high-strength steels. Exhibits sharp Bragg nodes for lattice calibration.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 2.8839 Å',
    database: 'COD',
    databaseId: '9008532'
  },
  {
    name: 'Molybdenum Refractory (Mo)',
    formula: 'Mo',
    wavelength: 1.5406,
    peaks: [40.52, 58.62, 73.52, 87.42, 101.42],
    hkls: ['110', '200', '211', '220', '310'],
    description: 'High-temperature body-centered cubic refractory metal. Essential for calibrating thermal expansion and high-pressure XRD suites.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 3.1472 Å',
    database: 'COD',
    databaseId: '9008545'
  },
  {
    name: 'Pure Vanadium (V)',
    formula: 'V',
    wavelength: 1.5406,
    peaks: [41.13, 59.56, 74.83, 89.15],
    hkls: ['110', '200', '211', '220'],
    description: 'BCC transition metal with unique hydrogen absorption properties. Standard reference for group 5 metal characterization.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 3.030 Å',
    database: 'COD',
    databaseId: '9008544'
  },
  {
    name: 'Rhodium Noble Metal (Rh)',
    formula: 'Rh',
    wavelength: 1.5406,
    peaks: [41.07, 47.78, 69.87, 84.34, 88.92],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Face-centered cubic platinum-group metal. Highly effective catalyst reference with distinctive high-angle diffraction signatures.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.8034 Å',
    database: 'COD',
    databaseId: '9008486'
  },
  {
    name: 'Ruthenium (Ru)',
    formula: 'Ru',
    wavelength: 1.5406,
    peaks: [38.39, 42.18, 44.01, 58.33, 69.41, 78.35, 84.68],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Hard HCP platinum-group metal. Crucial for heterogeneous catalysis and resistive thin-film standards.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.7057 Å, c = 4.2815 Å',
    database: 'COD',
    databaseId: '9008517'
  },
  {
    name: 'Hafnium (Hf)',
    formula: 'Hf',
    wavelength: 1.5406,
    peaks: [31.54, 33.87, 35.78, 46.90, 56.45, 62.81],
    hkls: ['100', '002', '101', '102', '110', '103'],
    description: 'HCP refractory transition metal. High thermal neutron absorption cross-section makes it a vital nuclear-grade reference.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.1946 Å, c = 5.0510 Å',
    database: 'COD',
    databaseId: '9008514'
  },
  {
    name: 'Lead Standard (Pb)',
    formula: 'Pb',
    wavelength: 1.5406,
    peaks: [31.33, 36.31, 52.27, 62.24, 65.31],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Soft FCC metallic standard. High atomic number (Z=82) results in intense X-ray scattering and significant absorption factors.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.9508 Å',
    database: 'COD',
    databaseId: '9008487'
  },
  {
    name: 'Bismuth Element (Bi)',
    formula: 'Bi',
    wavelength: 1.5406,
    peaks: [22.48, 27.16, 37.98, 39.65, 45.86, 48.74, 56.02],
    hkls: ['003', '012', '104', '110', '015', '113', '202'],
    description: 'Post-transition metal with rhombohedral symmetry. Large diamagnetism and low thermal conductivity baseline standard.',
    category: 'Metal',
    crystalSystem: 'Rhombohedral',
    spaceGroup: 'R-3m (No. 166)',
    latticeParams: 'a = 4.546 Å, c = 11.861 Å',
    database: 'COD',
    databaseId: '9008573'
  },
  {
    name: 'Beryllium Standard (Be)',
    formula: 'Be',
    wavelength: 1.5406,
    peaks: [45.82, 50.84, 52.74, 82.52, 95.88],
    hkls: ['100', '002', '101', '110', '103'],
    description: 'Ultra-lightweight HCP elemental standard. High X-ray transparency makes it ideal for beam-window calibration.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.2858 Å, c = 3.5843 Å',
    database: 'COD',
    databaseId: '9012433'
  },
  {
    name: 'Alpha Manganese (α-Mn)',
    formula: 'Mn',
    wavelength: 1.5406,
    peaks: [42.15, 43.12, 44.85, 46.52, 75.12, 82.44],
    hkls: ['330', '411', '420', '332', '631', '721'],
    description: 'Complex cubic α-phase manganese containing 58 atoms per unit cell. Exhibits a unique and extremely rich diffraction fingerprint.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'I-43m (No. 217)',
    latticeParams: 'a = 8.913 Å',
    database: 'COD',
    databaseId: '9008507'
  },
  {
    name: 'Scandium (Sc)',
    formula: 'Sc',
    wavelength: 1.5406,
    peaks: [31.42, 35.15, 36.24, 51.52, 63.85, 71.42],
    hkls: ['100', '002', '101', '102', '110', '103'],
    description: 'Lightweight HCP transition metal used in aerospace aluminum alloys. Essential elemental reference.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.3090 Å, c = 5.2680 Å',
    database: 'COD',
    databaseId: '9008516'
  },
  {
    name: 'Yttrium (Y)',
    formula: 'Y',
    wavelength: 1.5406,
    peaks: [28.15, 31.05, 32.54, 46.85, 58.62, 64.91],
    hkls: ['100', '002', '101', '102', '110', '103'],
    description: 'HCP transition metal standard. Critical for investigating rare-earth mineral substitutes and yttria-stabilized ceramics.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.6474 Å, c = 5.7306 Å',
    database: 'COD',
    databaseId: '9008511'
  },
  {
    name: 'Indium Standard (In)',
    formula: 'In',
    wavelength: 1.5406,
    peaks: [32.95, 36.32, 39.15, 54.42, 67.05, 69.12],
    hkls: ['101', '002', '110', '112', '200', '103'],
    description: 'Post-transition tetragonal soft metal. Low melting point makes it a premier standard for cryogenic and thermal XRD calibration.',
    category: 'Metal',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I4/mmm (No. 139)',
    latticeParams: 'a = 3.2517 Å, c = 4.9459 Å',
    database: 'COD',
    databaseId: '9011116'
  },
  {
    name: 'Rhenium Refractory (Re)',
    formula: 'Re',
    wavelength: 1.5406,
    peaks: [40.48, 42.85, 43.91, 58.74, 70.12, 79.15, 84.42],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Ultra-refractory HCP metal with one of the highest melting points. Critical for high-stress aerospace engine component characterization.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.761 Å, c = 4.456 Å',
    database: 'COD',
    databaseId: '9008512'
  },
  {
    name: 'Osmium Element (Os)',
    formula: 'Os',
    wavelength: 1.5406,
    peaks: [40.15, 43.62, 44.82, 59.45, 71.02, 80.52, 86.15],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'The densest naturally occurring element. HCP noble metal standard exhibiting extreme hardness and oxidation resistance.',
    category: 'Metal',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.7344 Å, c = 4.3176 Å',
    database: 'COD',
    databaseId: '9008521'
  },
  {
    name: 'Alpha-Uranium Metal (α-U)',
    formula: 'U',
    wavelength: 1.5406,
    peaks: [35.08, 36.25, 38.74, 39.24, 50.15, 50.21],
    hkls: ['110', '002', '021', '111', '131', '112'],
    description: 'The standard orthorhombic allotrope of elemental uranium. Exhibits complex anisotropic thermal expansion and unique metallic bonding characteristics.',
    category: 'Metal',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Cmcm (No. 63)',
    latticeParams: 'a = 2.854 Å, b = 5.867 Å, c = 4.954 Å',
    database: 'COD',
    databaseId: '9008503'
  },
  {
    name: 'Uranium Dioxide (UO2)',
    formula: 'UO2',
    wavelength: 1.5406,
    peaks: [28.25, 32.74, 47.01, 55.78, 58.55, 68.62],
    hkls: ['111', '200', '220', '311', '222', '400'],
    description: 'Highly stable fluorite-structured oxide. The primary ceramic nuclear fuel used in commercial light-water reactors worldwide.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.470 Å',
    database: 'COD',
    databaseId: '9009028'
  },
  {
    name: 'Triuranium Octoxide (U3O8)',
    formula: 'U3O8',
    wavelength: 1.5406,
    peaks: [21.44, 25.95, 26.45, 34.32, 43.15, 44.50],
    hkls: ['001', '130', '111', '201', '240', '002'],
    description: 'The most stable form of uranium oxide under ambient conditions. Commonly known as "yellowcake" in its crude concentrated form.',
    category: 'Ceramic',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Ammm or Pnma',
    latticeParams: 'a = 6.716 Å, b = 11.95 Å, c = 4.142 Å',
    database: 'COD',
    databaseId: '1010344'
  },
  {
    name: 'Uranium Trioxide (UO3)',
    formula: 'UO3',
    wavelength: 1.5406,
    peaks: [15.20, 26.10, 33.40, 46.50, 52.80],
    hkls: ['110', '220', '001', '330', '111'],
    description: 'Orange-colored uranium trioxide (Gamma phase). A critical intermediate in the industrial conversion of uranium ore to nuclear-grade fuel.',
    category: 'Ceramic',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Fddd',
    latticeParams: 'a = 9.70 Å, b = 19.93 Å, c = 10.22 Å',
    database: 'ICSD',
    databaseId: '23625'
  },
  {
    name: 'Gallium Nitride (GaN)',
    formula: 'GaN',
    wavelength: 1.5406,
    peaks: [32.39, 34.56, 36.84, 48.08, 57.78, 63.45, 67.89],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Direct bandgap semiconductor with Wurtzite structure. Crucial for blue/green LEDs and power amplifiers.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.189 Å, c = 5.185 Å',
    database: 'COD',
    databaseId: '9008902'
  },
  {
    name: 'Silicon Carbide (6H-SiC)',
    formula: 'SiC',
    wavelength: 1.5406,
    peaks: [34.15, 35.65, 38.15, 41.42, 45.35, 60.05, 71.85],
    hkls: ['101', '102', '103', '104', '105', '110', '108'],
    description: 'Wide bandgap semiconductor with exceptional thermal conductivity and hardness. Used in EV power modules.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.081 Å, c = 15.117 Å',
    database: 'COD',
    databaseId: '1011032'
  },
  {
    name: 'Barium Titanate (BaTiO3)',
    formula: 'BaTiO3',
    wavelength: 1.5406,
    peaks: [22.25, 31.55, 38.89, 45.32, 51.05, 56.12],
    hkls: ['100', '110', '111', '200', '210', '211'],
    description: 'Ferroelectric tetragonal perovskite. High dielectric constant standard for MLCC capacitors.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4mm (No. 99)',
    latticeParams: 'a = 3.992 Å, c = 4.036 Å',
    database: 'COD',
    databaseId: '1507757'
  },
  {
    name: 'Strontium Titanate (SrTiO3)',
    formula: 'SrTiO3',
    wavelength: 1.5406,
    peaks: [22.84, 32.42, 40.01, 46.52, 57.85, 67.88],
    hkls: ['100', '110', '111', '200', '211', '220'],
    description: 'Cubic perovskite substrate material. Excellent model system for complex oxide interface research.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m (No. 221)',
    latticeParams: 'a = 3.905 Å',
    database: 'COD',
    databaseId: '1511910'
  },
  {
    name: 'Gallium Arsenide (GaAs)',
    formula: 'GaAs',
    wavelength: 1.5406,
    peaks: [27.30, 45.32, 53.71, 65.98, 72.82, 84.48],
    hkls: ['111', '220', '311', '400', '331', '422'],
    description: 'Device-grade Gallium Arsenide, the classic III-V binary semiconductor. Highly valued for high-frequency microelectronics, solar cells, and optoelectronics.',
    category: 'Semiconductor',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m (No. 216)',
    latticeParams: 'a = 5.653 Å',
    database: 'COD',
    databaseId: '1541246'
  },
  {
    name: 'Wurtzite Gallium Nitride (GaN)',
    formula: 'GaN',
    wavelength: 1.5406,
    peaks: [32.39, 34.56, 36.84, 48.08, 57.78, 63.45, 67.89],
    hkls: ['100', '002', '101', '102', '110', '103', '200'],
    description: 'Hexagonal wurtzite Gallium Nitride. Essential wide bandgap semiconductor for power electronics, blue LEDs, and laser diodes.',
    category: 'Semiconductor',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.189 Å, c = 5.185 Å',
    database: 'COD',
    databaseId: '1533654'
  },
  {
    name: 'Silicon Carbide (3C-SiC)',
    formula: 'SiC',
    wavelength: 1.5406,
    peaks: [35.60, 41.40, 60.00, 71.70, 75.50],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Beta structural polytype 3C-SiC. A crucial wide-bandgap compound semiconductor for high-temperature and high-power electronics.',
    category: 'Semiconductor',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m (No. 216)',
    latticeParams: 'a = 4.360 Å',
    database: 'COD',
    databaseId: '1011032'
  },
  {
    name: 'Methylammonium Lead Iodide (MAPbI3) [COD]',
    formula: 'CH3NH3PbI3',
    wavelength: 1.5406,
    peaks: [14.08, 19.98, 24.47, 28.41, 31.84, 35.15, 40.56, 43.19],
    hkls: ['110', '112', '211', '202', '220', '310', '224', '314'],
    description: 'The prototypical organic-inorganic hybrid halide perovskite. Revolutionized the field of low-cost solid-state solar cell absorbers.',
    category: 'Semiconductor',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I4/mcm (No. 140)',
    latticeParams: 'a = 8.855 Å, c = 12.659 Å',
    database: 'COD',
    databaseId: '4335637'
  },
  {
    name: 'Indium Phosphide (InP)',
    formula: 'InP',
    wavelength: 1.5406,
    peaks: [26.28, 43.51, 51.53, 63.20, 69.69, 80.50],
    hkls: ['111', '220', '311', '400', '331', '422'],
    description: 'High electron velocity semiconductor. Extensively used in high-speed electronics and fiber-optic communication laser sources.',
    category: 'Semiconductor',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m (No. 216)',
    latticeParams: 'a = 5.869 Å',
    database: 'COD',
    databaseId: '1011244'
  },
  {
    name: 'Monolayer Molybdenum Disulfide (MoS2)',
    formula: 'MoS2',
    wavelength: 1.5406,
    peaks: [14.40, 32.70, 39.50, 49.80, 58.30, 60.10],
    hkls: ['002', '100', '103', '105', '110', '008'],
    description: '2D layered transition metal dichalcogenide semiconductor with a direct bandgap when isolated to monolayer thickness.',
    category: 'Semiconductor',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.160 Å, c = 12.300 Å',
    database: 'COD',
    databaseId: '1010993'
  },
  {
    name: 'Zinc Oxide Nanorods (ZnO)',
    formula: 'ZnO',
    wavelength: 1.5406,
    peaks: [31.77, 34.42, 36.25, 47.54, 56.60, 62.86, 67.96],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Transparent wide-bandgap semiconductor. Exaggerated (002) reflection intensity when aligned vertically as nanorod architectures.',
    category: 'Semiconductor',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.250 Å, c = 5.207 Å',
    database: 'COD',
    databaseId: '1011258'
  },
  {
    name: 'Cadmium Telluride (CdTe)',
    formula: 'CdTe',
    wavelength: 1.5406,
    peaks: [23.75, 39.29, 46.43, 56.76, 62.45, 71.18],
    hkls: ['111', '220', '311', '400', '331', '422'],
    description: 'A major crystalline compound semiconductor for thin-film photovoltaic technology and infrared optical components.',
    category: 'Semiconductor',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m (No. 216)',
    latticeParams: 'a = 6.482 Å',
    database: 'COD',
    databaseId: '1521994'
  }
];

interface TestMaterialsModuleProps {
  onLoadMaterial: (peaks: number[], wavelength: number, hkls: string[], name: string) => void;
}

type TabGroup = 'All' | 'Standards' | 'Metals' | 'Ceramics' | 'Polymers' | 'Semiconductors' | 'Custom';
type DatabaseRef = 'All' | 'ICDD' | 'COD' | 'RRUFF' | 'ICSD' | 'CSD';

export const TestMaterialsModule: React.FC<TestMaterialsModuleProps> = ({ onLoadMaterial }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabGroup>('All');
  const [activeDatabase, setActiveDatabase] = useState<DatabaseRef>('All');
  const [customPresets, setCustomPresets] = useState<MaterialPreset[]>([]);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  
  // Custom Preset Creation Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [newWavelength, setNewWavelength] = useState('1.5406');
  const [newPeaks, setNewPeaks] = useState('');
  const [newHkls, setNewHkls] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Standard' | 'Metal' | 'Ceramic' | 'Polymer' | 'Semiconductor'>('Standard');
  const [newCrystalSystem, setNewCrystalSystem] = useState('');
  const [newSpaceGroup, setNewSpaceGroup] = useState('');
  const [newLattice, setNewLattice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('xrd_custom_presets');
      if (stored) {
        setCustomPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse custom presets', e);
    }
  }, []);

  // Save custom presets
  const saveCustomPresets = (updated: MaterialPreset[]) => {
    setCustomPresets(updated);
    localStorage.setItem('xrd_custom_presets', JSON.stringify(updated));
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(customPresets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xrd_custom_presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          // Additional validation can be done here.
          // Merge with existing avoiding duplicates by name
          const newPresetsMap = new Map();
          [...customPresets, ...json].forEach(p => newPresetsMap.set(p.name, p));
          const updated = Array.from(newPresetsMap.values());
          saveCustomPresets(updated);
          setSuccessMsg('Successfully imported custom suites!');
          setTimeout(() => setSuccessMsg(null), 3000);
          setActiveTab('Custom');
        } else {
          setFormError('Invalid JSON format. Expected an array of presets.');
        }
      } catch (err) {
        setFormError('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Convert categories into TabGroups
  const getTabOfPreset = (preset: MaterialPreset): TabGroup => {
    if (preset.category === 'Custom') return 'Custom';
    if (['Standard'].includes(preset.category)) return 'Standards';
    if (['Metal', 'Metallurgy'].includes(preset.category)) return 'Metals';
    if (['Ceramic', 'Perovskite', 'Thermoelectric', 'Biomaterial'].includes(preset.category)) return 'Ceramics';
    if (['Polymer'].includes(preset.category)) return 'Polymers';
    if (['Semiconductor'].includes(preset.category)) return 'Semiconductors';
    return 'All';
  };

  const handleAddCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!newName.trim()) {
      setFormError('Please enter a material standard name.');
      return;
    }
    if (!newFormula.trim()) {
      setFormError('Please provide a chemical formula (e.g., Al2O3).');
      return;
    }

    const wavelengthFloat = parseFloat(newWavelength);
    if (isNaN(wavelengthFloat) || wavelengthFloat <= 0) {
      setFormError('Please enter a valid radiation wavelength in Angstroms.');
      return;
    }

    // Parse peaks
    const parsedPeaks = newPeaks
      .split(',')
      .map(p => parseFloat(p.trim()))
      .filter(p => !isNaN(p));

    if (parsedPeaks.length === 0) {
      setFormError('Please input at least one numeric diffraction peak (2θ).');
      return;
    }

    // Check peak ranges
    const badPeaks = parsedPeaks.filter(p => p <= 2 || p >= 180);
    if (badPeaks.length > 0) {
      setFormError('Peaks must be in the valid physical 2θ diffraction range (2° to 178°).');
      return;
    }

    // Parse HKLs
    const parsedHkls = newHkls
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    if (parsedHkls.length > 0 && parsedHkls.length !== parsedPeaks.length) {
      setFormError(`HKL count (${parsedHkls.length}) must match the Peak count (${parsedPeaks.length}).`);
      return;
    }

    // Prepare hkls matching length
    const finalHkls = parsedHkls.length > 0 
      ? parsedHkls 
      : Array(parsedPeaks.length).fill('?');

    const newPreset: MaterialPreset = {
      name: newName.trim(),
      formula: newFormula.trim(),
      wavelength: wavelengthFloat,
      peaks: parsedPeaks,
      hkls: finalHkls,
      description: newDesc.trim() || 'Custom user calibration standard.',
      category: 'Custom',
      crystalSystem: newCrystalSystem.trim() || undefined,
      spaceGroup: newSpaceGroup.trim() || undefined,
      latticeParams: newLattice.trim() || undefined,
    };

    const updated = [...customPresets, newPreset];
    saveCustomPresets(updated);

    // Reset Form
    setNewName('');
    setNewFormula('');
    setNewPeaks('');
    setNewHkls('');
    setNewDesc('');
    setNewCrystalSystem('');
    setNewSpaceGroup('');
    setNewLattice('');
    setSuccessMsg('Material suite successfully added directly to local register!');
    setTimeout(() => {
      setIsAdding(false);
      setSuccessMsg(null);
      setActiveTab('Custom');
    }, 1200);
  };

  const handleDeleteCustomPreset = (nameToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${nameToDelete}"?`)) return;
    
    const updated = customPresets.filter(p => p.name !== nameToDelete);
    saveCustomPresets(updated);
    if (expandedMaterial === nameToDelete) {
      setExpandedMaterial(null);
    }
  };

  // Combine standard and custom presets
  const allPresets = [...PRESETS, ...customPresets];

  // Filter based on Tab + Database + Search Query
  const filteredPresets = allPresets.filter(preset => {
    // Tab filtering
    if (activeTab !== 'All') {
      const g = getTabOfPreset(preset);
      if (g !== activeTab) return false;
    }

    // Database filtering
    if (activeDatabase !== 'All') {
      if (preset.database !== activeDatabase) return false;
    }

    // Search query filtering
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const inName = preset.name.toLowerCase().includes(q);
      const inFormula = preset.formula.toLowerCase().includes(q);
      const inDesc = preset.description.toLowerCase().includes(q);
      const inCat = preset.category.toLowerCase().includes(q);
      const inHkls = preset.hkls.some(h => h.toLowerCase().includes(q));
      const inSystem = preset.crystalSystem?.toLowerCase().includes(q) || false;
      const inDatabase = preset.database?.toLowerCase().includes(q) || false;
      const inDatabaseId = preset.databaseId?.toLowerCase().includes(q) || false;
      return (inName || inFormula || inDesc || inCat || inHkls || inSystem || inDatabase || inDatabaseId);
    }

    return true;
  });

  const getCountForTab = (tab: TabGroup): number => {
    if (tab === 'All') return allPresets.length;
    return allPresets.filter(p => getTabOfPreset(p) === tab).length;
  };

  const getCountForDatabase = (db: DatabaseRef): number => {
    if (db === 'All') return allPresets.length;
    return allPresets.filter(p => p.database === db).length;
  };

  // Calculate dynamic d-spacings for a peak array and wavelength
  const calculateDSpacings = (peaks: number[], wl: number) => {
    return peaks.map(twoTheta => {
      const thetaRad = (twoTheta / 2) * (Math.PI / 180);
      if (Math.sin(thetaRad) <= 0) return 0;
      return wl / (2 * Math.sin(thetaRad));
    });
  };

  // Helper code to copy peaks list to clipboard
  const handleCopyPeaksText = (preset: MaterialPreset, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const txt = preset.peaks.join(', ');
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleExportConfigText = (preset: MaterialPreset, computedD: number[], e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `====================================================
TEST DATA SUITE CONFIGURATION: ${preset.name}
====================================================
Formula: ${preset.formula}
Category: ${preset.category}
Wavelength: ${preset.wavelength} Å
Description: ${preset.description}

[CRYSTALLOGRAPHIC DATA]
Crystal System: ${preset.crystalSystem || 'N/A'}
Space Group: ${preset.spaceGroup || 'N/A'}
Lattice Parameters: ${preset.latticeParams || 'N/A'}

[DIFFRACTION PEAKS]
====================================================
 2θ (°)     |  d-spacing (Å) |  Miller (hkl)
----------------------------------------------------`;
    
    preset.peaks.forEach((peak, i) => {
      const d = computedD[i] > 0 ? computedD[i].toFixed(4) : 'N/A';
      const hkl = preset.hkls[i] || '?';
      text += `\n ${peak.toFixed(3).padEnd(10)} |  ${d.padEnd(13)} |  ${hkl}`;
    });
    
    text += '\n====================================================\n';
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Suite_${preset.name.replace(/\s+/g, '_')}_Config.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0A101C]/95 rounded-[2rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden transition-all text-left">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none">Test Data Suites</h3>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">Experimental Presets & Register</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            style={{ display: 'none' }} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            title="Import custom suites from JSON"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
          
          {customPresets.length > 0 && (
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              title="Export custom suites to JSON"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          )}

          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setFormError(null);
              setSuccessMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border ${
              isAdding 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30' 
                : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/30'
            }`}
          >
            {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {isAdding ? 'Close Builder' : 'Build Custom Suite'}
          </button>
        </div>
      </div>

      {/* Add Custom Preset Form Block */}
      {isAdding && (
        <div className="mb-6 p-5 rounded-2xl bg-[#0F172A]/90 border border-indigo-500/20 shadow-inner relative z-10 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleAddCustomPreset} className="space-y-4">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Define Custom Crystal Suite
            </h4>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] leading-relaxed">
                ⚠ {formError}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-sans text-[10px] flex items-center gap-1.5">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Standard Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Zinc Nitride Reference"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Chemical Formula *</label>
                <input
                  type="text"
                  placeholder="e.g. Zn3N2"
                  value={newFormula}
                  onChange={e => setNewFormula(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Wavelength (Å)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newWavelength}
                  onChange={e => setNewWavelength(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white font-mono focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Crystal System (Opt)</label>
                <input
                  type="text"
                  placeholder="e.g. Cubic"
                  value={newCrystalSystem}
                  onChange={e => setNewCrystalSystem(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Space Group (Opt)</label>
                <input
                  type="text"
                  placeholder="e.g. Ia-3 (No. 206)"
                  value={newSpaceGroup}
                  onChange={e => setNewSpaceGroup(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Lattice Dimensions (Opt)</label>
              <input
                type="text"
                placeholder="e.g. a = 9.78 Å"
                value={newLattice}
                onChange={e => setNewLattice(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Diffraction Peaks (2θ, comma separated) *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 21.24, 30.56, 35.88"
                  value={newPeaks}
                  onChange={e => setNewPeaks(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">HKL Indices (comma separated, matching peaks counter)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 110, 200, 211"
                  value={newHkls}
                  onChange={e => setNewHkls(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Description (Opt)</label>
              <input
                type="text"
                placeholder="Refractory nitride powder prepared by chemical synthesis."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" /> Save Suite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-5 z-10 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search suite by element, formula, structural space group, HKL..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-950/60 border border-white/5 text-slate-200 outline-none rounded-xl focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/10 placeholder:text-slate-600 transition-all text-xs font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pill Filters */}
      <div className="relative z-10 flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none select-none max-w-full">
        {(['All', 'Standards', 'Metals', 'Ceramics', 'Polymers', 'Semiconductors', 'Custom'] as TabGroup[]).map(tab => {
          const count = getCountForTab(tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                  : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-300 hover:bg-black/40'
              }`}
            >
              {tab}
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab 
                  ? 'bg-indigo-400/20 text-indigo-300' 
                  : 'bg-white/5 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Database Registry Filters */}
      <div className="relative z-10 border-t border-white/5 pt-3 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none max-w-full items-center">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-1.5 shrink-0 flex items-center gap-1">
            <Database className="w-2.5 h-2.5 text-slate-500" /> Registry Filter:
          </span>
          {(['All', 'ICDD', 'COD', 'RRUFF', 'ICSD', 'CSD'] as DatabaseRef[]).map(db => {
            const count = getCountForDatabase(db);
            const theme = db === 'All' 
              ? { activeClass: 'bg-slate-500/20 border-slate-500/40 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.1)]', badgeClass: 'bg-slate-400/20 text-slate-300' }
              : db === 'ICDD'
              ? { activeClass: 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]', badgeClass: 'bg-amber-400/20 text-amber-300' }
              : db === 'COD'
              ? { activeClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]', badgeClass: 'bg-emerald-400/20 text-emerald-300' }
              : db === 'RRUFF'
              ? { activeClass: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]', badgeClass: 'bg-cyan-400/20 text-cyan-300' }
              : db === 'ICSD'
              ? { activeClass: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]', badgeClass: 'bg-indigo-400/20 text-indigo-300' }
              : { activeClass: 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]', badgeClass: 'bg-rose-400/20 text-rose-300' };

            return (
              <button
                key={db}
                type="button"
                onClick={() => setActiveDatabase(db)}
                className={`py-1 px-2.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-1 ${
                  activeDatabase === db
                    ? theme.activeClass
                    : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-400 hover:bg-black/35 hover:border-slate-800'
                }`}
              >
                {db}
                <span className={`text-[8px] px-1 py-0.2 rounded-full ${
                  activeDatabase === db 
                    ? theme.badgeClass 
                    : 'bg-white/5 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Database context banner card */}
        <div className="mt-1 pb-1">
          <div className={`p-3 rounded-lg border text-[9.5px] leading-relaxed transition-all duration-300 ${
            activeDatabase === 'All'
              ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              : activeDatabase === 'ICDD'
              ? 'bg-amber-950/10 border-amber-900/20 text-amber-300/80'
              : activeDatabase === 'COD'
              ? 'bg-[#10b98115] border-emerald-950 text-emerald-300/80'
              : activeDatabase === 'RRUFF'
              ? 'bg-[#06b6d415] border-cyan-950 text-cyan-300/80'
              : activeDatabase === 'ICSD'
              ? 'bg-[#6366f115] border-indigo-950 text-indigo-300/80'
              : 'bg-[#f43f5e15] border-rose-950 text-rose-300/80'
          }`}>
            <span className="font-bold underline uppercase tracking-wider mr-1.5">
              {activeDatabase === 'All' && 'Combined Catalog:'}
              {activeDatabase === 'ICDD' && 'International Centre for Diffraction Data (PDF):'}
              {activeDatabase === 'COD' && 'Crystallography Open Database (COD):'}
              {activeDatabase === 'RRUFF' && 'RRUFF Project Mineral Matrix:'}
              {activeDatabase === 'ICSD' && 'Inorganic Crystal Structure Database (ICSD):'}
              {activeDatabase === 'CSD' && 'Cambridge Structural Database (CSD):'}
            </span>
            {activeDatabase === 'All' && 'Accesses all standard phase records across composite experimental and simulated indexing registries.'}
            {activeDatabase === 'ICDD' && 'Global powder patterns reference index containing primary synthetic inorganic diffraction vectors.'}
            {activeDatabase === 'COD' && 'Fully open-access structures with coordinate values for experimental materials analysis.'}
            {activeDatabase === 'RRUFF' && 'High-resolution XRD parameters paired with natural mineral chemistry references.'}
            {activeDatabase === 'ICSD' && 'Completely evaluated structures encompassing purely inorganic crystals, ceramic compounds, and engineering metals.'}
            {activeDatabase === 'CSD' && 'The sovereign structural coordinate registry for organic, polymer, and pharmaceutical materials.'}
          </div>
        </div>
      </div>

      {/* Presets List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-800">
        {filteredPresets.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-black/20 border border-white/5 text-slate-500 text-xs flex flex-col items-center gap-2">
            <SlidersHorizontal className="w-8 h-8 text-slate-600 stroke-1" />
            <p className="uppercase font-mono tracking-widest text-[10px]">No material suites found matching terms</p>
            <p className="text-[9px] text-slate-600 font-sans italic">Try resetting query filter parameters</p>
          </div>
        ) : (
          filteredPresets.map((material, idx) => {
            const isExpanded = expandedMaterial === material.name;
            const computedD = calculateDSpacings(material.peaks, material.wavelength);

            return (
              <div
                key={material.name}
                onClick={() => setExpandedMaterial(isExpanded ? null : material.name)}
                className={`group flex flex-col p-4 bg-slate-950/40 border rounded-2xl cursor-pointer hover:bg-slate-950/70 transition-all relative overflow-hidden select-none ${
                  isExpanded 
                    ? 'border-indigo-500/40 ring-1 ring-indigo-500/10' 
                    : 'border-white/5 hover:border-indigo-500/20'
                }`}
              >
                {/* Visual accent left line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
                  isExpanded ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-500/30'
                }`} />

                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                    <span className="text-xs font-black text-white hover:text-indigo-400 transition-colors">
                      {material.name}
                    </span>
                    <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded leading-none">
                      {material.formula}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {material.database && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border leading-none transition-all ${
                        material.database === 'ICDD' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                        material.database === 'COD' ? 'bg-[#10b98115] text-emerald-400 border-[#10b98130]' :
                        material.database === 'RRUFF' ? 'bg-[#06b6d415] text-cyan-400 border-[#06b6d430]' :
                        material.database === 'ICSD' ? 'bg-[#6366f115] text-indigo-400 border-[#6366f130]' :
                        'bg-[#f43f5e15] text-rose-400 border-[#f43f5e30]'
                      }`} title={`Scientific registry reference: ${material.database}`}>
                        {material.database} {material.databaseId ? `#${material.databaseId}` : ''}
                      </span>
                    )}
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      material.category === 'Standard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      material.category === 'Metal' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      material.category === 'Ceramic' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      material.category === 'Perovskite' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      material.category === 'Biomaterial' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      material.category === 'Nuclear' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      material.category === 'Polymer' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                      material.category === 'Semiconductor' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' :
                      material.category === 'Custom' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {material.category}
                    </span>

                    {material.category === 'Custom' && (
                      <button
                        onClick={(e) => handleDeleteCustomPreset(material.name, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors hover:bg-rose-500/10 rounded-md"
                        title="Delete Custom Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal mb-3 pr-4">
                  {material.description}
                </p>

                {/* Micro metrics view in main state */}
                <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-3">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> λ = {material.wavelength}Å
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" /> {material.peaks.length} Reflections
                    </span>
                    {material.crystalSystem && (
                      <span className="hidden sm:inline-block px-1.5 py-0.2 bg-white/5 text-[9px] font-sans font-bold text-slate-400 rounded">
                        {material.crystalSystem}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-indigo-400 font-sans font-bold uppercase tracking-wider">
                    {isExpanded ? (
                      <span className="flex items-center gap-1"><X className="w-3 h-3 text-rose-400" /> Collapse</span>
                    ) : (
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-indigo-400 animate-pulse" /> Inspect</span>
                    )}
                  </div>
                </div>

                {/* Expanded Crystallographic Details Table */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-4 pt-4 border-t border-white/5 space-y-4 cursor-default animate-in fade-in duration-200"
                  >
                    {/* Structure stats */}
                    {(material.crystalSystem || material.spaceGroup || material.latticeParams) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-black/30 p-3 rounded-xl border border-white/5 text-[10px] leading-tight">
                        {material.crystalSystem && (
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">System</span>
                            <span className="font-sans text-slate-300 font-bold block mt-0.5">{material.crystalSystem}</span>
                          </div>
                        )}
                        {material.spaceGroup && (
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Space Group</span>
                            <span className="font-mono text-indigo-300 font-bold block mt-0.5">{material.spaceGroup}</span>
                          </div>
                        )}
                        {material.latticeParams && (
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Dimensions</span>
                            <span className="font-mono text-emerald-400 font-bold block mt-0.5">{material.latticeParams}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reflection Table */}
                    <div className="bg-[#050B14] p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Bragg reflection calculations ({material.wavelength} Å):</span>
                      <div className="overflow-x-auto max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        <table className="w-full text-left font-mono text-[10px]">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[8px] text-slate-500 tracking-wider font-sans uppercase">
                              <th className="px-3 py-1.5 text-indigo-400">Reflection (2θ)</th>
                              <th className="px-3 py-1.5">Miller (hkl)</th>
                              <th className="px-3 py-1.5 text-right font-sans font-black text-emerald-400">d-spacing (Å)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {material.peaks.map((peak, pidx) => (
                              <tr key={pidx} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-indigo-300 font-bold">{peak.toFixed(3)}°</td>
                                <td className="px-3 py-2 text-slate-400">{material.hkls[pidx] || '?'}</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-400">
                                  {computedD[pidx] > 0 ? `${computedD[pidx].toFixed(4)} Å` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadMaterial(material.peaks, material.wavelength, material.hkls, material.name);
                        }}
                        className="flex-1 py-2 px-3 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-sans font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Initialize Session
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyPeaksText(material, idx, e)}
                        className="py-2 px-3 bg-slate-900 border border-white/5 text-slate-300 hover:text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                        title="Copy peaks list to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" /> List Peaks
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExportConfigText(material, computedD, e)}
                        className="py-2 px-3 bg-slate-900 border border-white/5 text-slate-300 hover:text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                        title="Export suite data to text file"
                      >
                        <FileJson className="w-3.5 h-3.5 text-slate-500" /> Export Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 relative z-10 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-[10px] text-slate-400 leading-normal font-sans text-left">
          <strong>Suite Reference calibration:</strong> Presets default to traditional copper K-alpha (1.5406 Å) wavelengths unless specified. You can load these standards into your active calculator session to test indexing logic, calculate exact grain sizes, or cross-calibrate.
        </div>
      </div>
    </div>
  );
};
