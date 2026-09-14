import { CrystalElement, ElementCategory, CrystalStructureType, FamousCompound } from './types';
import { getFactualProperties } from '../ChemicalPhysicalPropertiesDb';
import { getElementMetrology } from '../../utils/elementMetrology';

// Base metadata definitions for all 118 elements
interface RawElementDef {
  num: number;
  sym: string;
  name: string;
  period: number;
  group: number;
  block: 's' | 'p' | 'd' | 'f';
  cat: ElementCategory;
  struct: CrystalStructureType;
  sg: string;
  a: number;
  b?: number;
  c?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  weight: number;
  density: number;
  mp: number; // °C
  bp?: number; // °C
  config: string;
  compounds?: FamousCompound[];
}

const RAW_ELEMENTS: RawElementDef[] = [
  // Period 1
  { num: 1, sym: 'H', name: 'Hydrogen', period: 1, group: 1, block: 's', cat: 'nonmetal', struct: 'Hexagonal', sg: 'P6_3/mmc', a: 4.70, c: 7.79, weight: 1.008, density: 0.089, mp: -259.16, bp: -252.87, config: '1s¹' },
  { num: 2, sym: 'He', name: 'Helium', period: 1, group: 18, block: 's', cat: 'noble_gas', struct: 'HCP', sg: 'P6_3/mmc', a: 3.53, c: 5.69, weight: 4.003, density: 0.179, mp: -272.2, bp: -268.93, config: '1s²' },

  // Period 2
  { num: 3, sym: 'Li', name: 'Lithium', period: 2, group: 1, block: 's', cat: 'alkali', struct: 'BCC', sg: 'Im-3m', a: 3.51, weight: 6.94, density: 0.534, mp: 180.5, bp: 1342, config: '[He] 2s¹' },
  { num: 4, sym: 'Be', name: 'Beryllium', period: 2, group: 2, block: 's', cat: 'alkaline_earth', struct: 'HCP', sg: 'P6_3/mmc', a: 2.29, c: 3.58, weight: 9.012, density: 1.85, mp: 1287, bp: 2469, config: '[He] 2s²' },
  { num: 5, sym: 'B', name: 'Boron', period: 2, group: 13, block: 'p', cat: 'metalloid', struct: 'Rhombohedral', sg: 'R-3m', a: 5.06, alpha: 58.06, weight: 10.81, density: 2.34, mp: 2076, bp: 3927, config: '[He] 2s² 2p¹' },
  { num: 6, sym: 'C', name: 'Carbon', period: 2, group: 14, block: 'p', cat: 'nonmetal', struct: 'Diamond', sg: 'Fd-3m', a: 3.567, weight: 12.011, density: 3.51, mp: 3550, bp: 4827, config: '[He] 2s² 2p²', compounds: [
    { formula: 'C (Graphite)', name: 'Hexagonal Graphite', crystalSystem: 'Hexagonal', spaceGroup: 'P6_3/mmc', latticeParams: { a: 2.46, c: 6.70 }, typicalPeaks: [{ twoTheta: 26.54, intensity: 100 }, { twoTheta: 42.41, intensity: 6 }, { twoTheta: 44.57, intensity: 9 }, { twoTheta: 54.69, intensity: 21 }], relevance: 'Secondary carbon phase in energy storage and battery anodes.', shortDesc: 'Hexagonal carbon graphite sheet layering.' },
    { formula: 'C (Diamond)', name: 'Cubic Diamond', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', latticeParams: { a: 3.567 }, typicalPeaks: [{ twoTheta: 43.92, intensity: 100 }, { twoTheta: 75.31, intensity: 25 }, { twoTheta: 91.53, intensity: 16 }], relevance: 'Superhard materials and semiconductor heat sinks.', shortDesc: 'FCC lattice with diamond cubic tetrahedral basis.' }
  ]},
  { num: 7, sym: 'N', name: 'Nitrogen', period: 2, group: 15, block: 'p', cat: 'nonmetal', struct: 'Hexagonal', sg: 'P6_3/mmc', a: 3.86, c: 6.27, weight: 14.007, density: 1.25, mp: -210.0, bp: -195.79, config: '[He] 2s² 2p³' },
  { num: 8, sym: 'O', name: 'Oxygen', period: 2, group: 16, block: 'p', cat: 'nonmetal', struct: 'Monoclinic', sg: 'C2/m', a: 5.40, b: 3.43, c: 5.09, beta: 132.5, weight: 15.999, density: 1.43, mp: -218.79, bp: -182.96, config: '[He] 2s² 2p⁴' },
  { num: 9, sym: 'F', name: 'Fluorine', period: 2, group: 17, block: 'p', cat: 'nonmetal', struct: 'Monoclinic', sg: 'C2/c', a: 5.50, b: 3.28, c: 7.28, beta: 102.2, weight: 18.998, density: 1.70, mp: -219.67, bp: -188.11, config: '[He] 2s² 2p⁵' },
  { num: 10, sym: 'Ne', name: 'Neon', period: 2, group: 18, block: 'p', cat: 'noble_gas', struct: 'FCC', sg: 'Fm-3m', a: 4.43, weight: 20.18, density: 0.90, mp: -248.59, bp: -246.08, config: '[He] 2s² 2p⁶' },

  // Period 3
  { num: 11, sym: 'Na', name: 'Sodium', period: 3, group: 1, block: 's', cat: 'alkali', struct: 'BCC', sg: 'Im-3m', a: 4.29, weight: 22.99, density: 0.968, mp: 97.79, bp: 882.85, config: '[Ne] 3s¹', compounds: [
    { formula: 'NaCl (Halite)', name: 'Rock Salt', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', latticeParams: { a: 5.64 }, typicalPeaks: [{ twoTheta: 27.37, intensity: 30 }, { twoTheta: 31.69, intensity: 100 }, { twoTheta: 45.45, intensity: 55 }, { twoTheta: 56.48, intensity: 15 }], relevance: 'Archetype rock-salt structure and primary standard for calibration.', shortDesc: 'FCC array of chloride anions with sodium cations in all octahedral interstitials.' }
  ]},
  { num: 12, sym: 'Mg', name: 'Magnesium', period: 3, group: 2, block: 's', cat: 'alkaline_earth', struct: 'HCP', sg: 'P6_3/mmc', a: 3.21, c: 5.21, weight: 24.305, density: 1.738, mp: 650, bp: 1090, config: '[Ne] 3s²', compounds: [
    { formula: 'MgO (Periclase)', name: 'Magnesium Oxide', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', latticeParams: { a: 4.21 }, typicalPeaks: [{ twoTheta: 36.94, intensity: 10 }, { twoTheta: 42.92, intensity: 100 }, { twoTheta: 62.31, intensity: 52 }], relevance: 'High-temperature refractory ceramic standard.', shortDesc: 'Cubic rock-salt refractory crystal lattice.' }
  ]},
  { num: 13, sym: 'Al', name: 'Aluminum', period: 3, group: 13, block: 'p', cat: 'post_transition', struct: 'FCC', sg: 'Fm-3m', a: 4.05, weight: 26.982, density: 2.70, mp: 660.32, bp: 2519, config: '[Ne] 3s² 3p¹', compounds: [
    { formula: 'Al2O3 (Corundum)', name: 'Alpha-Alumina', crystalSystem: 'Hexagonal', spaceGroup: 'R-3c', latticeParams: { a: 4.76, c: 12.99 }, typicalPeaks: [{ twoTheta: 25.58, intensity: 65 }, { twoTheta: 35.15, intensity: 100 }, { twoTheta: 37.78, intensity: 45 }, { twoTheta: 43.35, intensity: 90 }, { twoTheta: 57.50, intensity: 85 }], relevance: 'NIST SRM 1976 / 676a standard reference material for XRD instrument broadening calibration.', shortDesc: 'Corundum-type trigonal close packing of oxide ions with 2/3 octahedral occupancy by aluminum.' }
  ]},
  { num: 14, sym: 'Si', name: 'Silicon', period: 3, group: 14, block: 'p', cat: 'metalloid', struct: 'Diamond', sg: 'Fd-3m', a: 5.431, weight: 28.085, density: 2.33, mp: 1414, bp: 3265, config: '[Ne] 3s² 3p²', compounds: [
    { formula: 'Si (NIST SRM 640)', name: 'Silicon Standard Powder', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', latticeParams: { a: 5.431 }, typicalPeaks: [{ twoTheta: 28.44, intensity: 100 }, { twoTheta: 47.30, intensity: 55 }, { twoTheta: 56.12, intensity: 30 }, { twoTheta: 69.13, intensity: 8 }, { twoTheta: 76.38, intensity: 12 }, { twoTheta: 88.03, intensity: 16 }], relevance: 'Universal NIST standard reference material for 2θ line-position & profile calibration in powder XRD.', shortDesc: 'FCC array with four tetrahedral interstitial carbon-type sites.' },
    { formula: 'SiO2 (Quartz)', name: 'Low Quartz', crystalSystem: 'Hexagonal', spaceGroup: 'P3_221', latticeParams: { a: 4.91, c: 5.40 }, typicalPeaks: [{ twoTheta: 20.86, intensity: 22 }, { twoTheta: 26.64, intensity: 100 }, { twoTheta: 36.54, intensity: 12 }, { twoTheta: 39.46, intensity: 8 }, { twoTheta: 50.14, intensity: 14 }], relevance: 'Pervasive geomineral and quartz silica polymorph identification.', shortDesc: 'Corner-sharing SiO4 tetrahedra forming a chiral helical network along the c-axis.' }
  ]},
  { num: 15, sym: 'P', name: 'Phosphorus', period: 3, group: 15, block: 'p', cat: 'nonmetal', struct: 'Orthorhombic', sg: 'Cmca', a: 3.31, b: 10.48, c: 4.38, weight: 30.974, density: 2.69, mp: 44.15, bp: 280.5, config: '[Ne] 3s² 3p³' },
  { num: 16, sym: 'S', name: 'Sulfur', period: 3, group: 16, block: 'p', cat: 'nonmetal', struct: 'Orthorhombic', sg: 'Fddd', a: 10.44, b: 12.87, c: 24.37, weight: 32.06, density: 2.07, mp: 115.21, bp: 444.6, config: '[Ne] 3s² 3p⁴' },
  { num: 17, sym: 'Cl', name: 'Chlorine', period: 3, group: 17, block: 'p', cat: 'nonmetal', struct: 'Orthorhombic', sg: 'Cmca', a: 6.24, b: 4.48, c: 8.26, weight: 35.45, density: 3.21, mp: -101.5, bp: -34.04, config: '[Ne] 3s² 3p⁵' },
  { num: 18, sym: 'Ar', name: 'Argon', period: 3, group: 18, block: 'p', cat: 'noble_gas', struct: 'FCC', sg: 'Fm-3m', a: 5.26, weight: 39.948, density: 1.784, mp: -189.35, bp: -185.85, config: '[Ne] 3s² 3p⁶' },

  // Period 4
  { num: 19, sym: 'K', name: 'Potassium', period: 4, group: 1, block: 's', cat: 'alkali', struct: 'BCC', sg: 'Im-3m', a: 5.33, weight: 39.098, density: 0.862, mp: 63.38, bp: 759, config: '[Ar] 4s¹' },
  { num: 20, sym: 'Ca', name: 'Calcium', period: 4, group: 2, block: 's', cat: 'alkaline_earth', struct: 'FCC', sg: 'Fm-3m', a: 5.58, weight: 40.078, density: 1.54, mp: 842, bp: 1484, config: '[Ar] 4s²', compounds: [
    { formula: 'CaCO3 (Calcite)', name: 'Calcite', crystalSystem: 'Hexagonal', spaceGroup: 'R-3c', latticeParams: { a: 4.99, c: 17.06 }, typicalPeaks: [{ twoTheta: 23.05, intensity: 12 }, { twoTheta: 29.41, intensity: 100 }, { twoTheta: 35.97, intensity: 14 }, { twoTheta: 39.42, intensity: 18 }], relevance: 'Biominerals and geological calcite standard.', shortDesc: 'Trigonal carbonate mineral structure.' }
  ]},
  { num: 21, sym: 'Sc', name: 'Scandium', period: 4, group: 3, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 3.31, c: 5.27, weight: 44.956, density: 2.985, mp: 1541, bp: 2836, config: '[Ar] 3d¹ 4s²' },
  { num: 22, sym: 'Ti', name: 'Titanium', period: 4, group: 4, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.95, c: 4.68, weight: 47.867, density: 4.506, mp: 1668, bp: 3287, config: '[Ar] 3d² 4s²', compounds: [
    { formula: 'TiO2 (Rutile)', name: 'Rutile Titanium Dioxide', crystalSystem: 'Tetragonal', spaceGroup: 'P4_2/mnm', latticeParams: { a: 4.59, c: 2.96 }, typicalPeaks: [{ twoTheta: 27.44, intensity: 100 }, { twoTheta: 36.08, intensity: 50 }, { twoTheta: 39.19, intensity: 8 }, { twoTheta: 41.22, intensity: 25 }, { twoTheta: 54.32, intensity: 60 }], relevance: 'Photocatalysis, pigment manufacturing, and high-dielectric optical coatings.', shortDesc: 'Tetragonal unit cell featuring edge-sharing TiO6 octahedra running parallel to the c-axis.' },
    { formula: 'BaTiO3', name: 'Barium Titanate', crystalSystem: 'Tetragonal', spaceGroup: 'P4mm', latticeParams: { a: 3.99, c: 4.03 }, typicalPeaks: [{ twoTheta: 22.18, intensity: 30 }, { twoTheta: 31.52, intensity: 100 }, { twoTheta: 38.85, intensity: 22 }, { twoTheta: 45.24, intensity: 45 }], relevance: 'Prototypical ferroelectric and piezoelectric perovskite.', shortDesc: 'Perovskite structure with spontaneous titanium ion displacement.' }
  ]},
  { num: 23, sym: 'V', name: 'Vanadium', period: 4, group: 5, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.03, weight: 50.942, density: 6.11, mp: 1910, bp: 3407, config: '[Ar] 3d³ 4s²' },
  { num: 24, sym: 'Cr', name: 'Chromium', period: 4, group: 6, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 2.88, weight: 51.996, density: 7.19, mp: 1907, bp: 2671, config: '[Ar] 3d⁵ 4s¹' },
  { num: 25, sym: 'Mn', name: 'Manganese', period: 4, group: 7, block: 'd', cat: 'transition_metal', struct: 'Cubic', sg: 'I-43m', a: 8.91, weight: 54.938, density: 7.21, mp: 1246, bp: 2061, config: '[Ar] 3d⁵ 4s²' },
  { num: 26, sym: 'Fe', name: 'Iron', period: 4, group: 8, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 2.866, weight: 55.845, density: 7.874, mp: 1538, bp: 2862, config: '[Ar] 3d⁶ 4s²', compounds: [
    { formula: 'Fe (alpha-Ferrite)', name: 'Alpha-Iron', crystalSystem: 'Cubic', spaceGroup: 'Im-3m', latticeParams: { a: 2.866 }, typicalPeaks: [{ twoTheta: 44.67, intensity: 100 }, { twoTheta: 65.02, intensity: 20 }, { twoTheta: 82.33, intensity: 30 }], relevance: 'Structural metallurgy, steel phase identification, and magnetic core materials.', shortDesc: 'Body-Centered Cubic (BCC) ferrite phase stable below 912 °C.' },
    { formula: 'Fe2O3 (Hematite)', name: 'Alpha-Hematite', crystalSystem: 'Hexagonal', spaceGroup: 'R-3c', latticeParams: { a: 5.03, c: 13.74 }, typicalPeaks: [{ twoTheta: 24.14, intensity: 30 }, { twoTheta: 33.15, intensity: 100 }, { twoTheta: 35.61, intensity: 70 }], relevance: 'Corrosion product analysis and magnetic geomineralogy.', shortDesc: 'Corundum-type rhombohedral crystal lattice.' },
    { formula: 'Fe3O4 (Magnetite)', name: 'Magnetite', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', latticeParams: { a: 8.39 }, typicalPeaks: [{ twoTheta: 30.10, intensity: 30 }, { twoTheta: 35.42, intensity: 100 }, { twoTheta: 43.05, intensity: 20 }], relevance: 'Inverse spinel magnetic nanomaterials.', shortDesc: 'FCC oxygen sub-lattice with mixed Fe2+/Fe3+ occupancy.' }
  ]},
  { num: 27, sym: 'Co', name: 'Cobalt', period: 4, group: 9, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.51, c: 4.07, weight: 58.933, density: 8.90, mp: 1495, bp: 2927, config: '[Ar] 3d⁷ 4s²' },
  { num: 28, sym: 'Ni', name: 'Nickel', period: 4, group: 10, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.52, weight: 58.693, density: 8.908, mp: 1455, bp: 2913, config: '[Ar] 3d⁸ 4s²' },
  { num: 29, sym: 'Cu', name: 'Copper', period: 4, group: 11, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.615, weight: 63.546, density: 8.96, mp: 1084.62, bp: 2562, config: '[Ar] 3d¹⁰ 4s¹', compounds: [
    { formula: 'Cu (Standard Metal)', name: 'Face-Centered Cubic Copper', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', latticeParams: { a: 3.615 }, typicalPeaks: [{ twoTheta: 43.30, intensity: 100 }, { twoTheta: 50.43, intensity: 46 }, { twoTheta: 74.13, intensity: 20 }, { twoTheta: 89.93, intensity: 17 }], relevance: 'Conductivity calibration, electrical interconnects, and XRD anode standard.', shortDesc: 'Face-Centered Cubic close-packed metallic lattice.' }
  ]},
  { num: 30, sym: 'Zn', name: 'Zinc', period: 4, group: 12, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.66, c: 4.95, weight: 65.38, density: 7.14, mp: 419.53, bp: 907, config: '[Ar] 3d¹⁰ 4s²', compounds: [
    { formula: 'ZnO (Wurtzite)', name: 'Zinc Oxide', crystalSystem: 'Hexagonal', spaceGroup: 'P6_3mc', latticeParams: { a: 3.25, c: 5.20 }, typicalPeaks: [{ twoTheta: 31.77, intensity: 57 }, { twoTheta: 34.42, intensity: 44 }, { twoTheta: 36.25, intensity: 100 }, { twoTheta: 47.54, intensity: 23 }], relevance: 'Wide-bandgap transparent semiconductor and piezotronics.', shortDesc: 'Non-centrosymmetric hexagonal polar wurtzite crystal structure.' }
  ]},
  { num: 31, sym: 'Ga', name: 'Gallium', period: 4, group: 13, block: 'p', cat: 'post_transition', struct: 'Orthorhombic', sg: 'Cmce', a: 4.52, b: 7.66, c: 4.53, weight: 69.723, density: 5.91, mp: 29.76, bp: 2204, config: '[Ar] 3d¹⁰ 4s² 4p¹' },
  { num: 32, sym: 'Ge', name: 'Germanium', period: 4, group: 14, block: 'p', cat: 'metalloid', struct: 'Diamond', sg: 'Fd-3m', a: 5.658, weight: 72.63, density: 5.323, mp: 938.25, bp: 2833, config: '[Ar] 3d¹⁰ 4s² 4p²' },
  { num: 33, sym: 'As', name: 'Arsenic', period: 4, group: 15, block: 'p', cat: 'metalloid', struct: 'Rhombohedral', sg: 'R-3m', a: 4.13, alpha: 54.17, weight: 74.922, density: 5.727, mp: 817, bp: 614, config: '[Ar] 3d¹⁰ 4s² 4p³' },
  { num: 34, sym: 'Se', name: 'Selenium', period: 4, group: 16, block: 'p', cat: 'nonmetal', struct: 'Hexagonal', sg: 'P3_121', a: 4.36, c: 4.95, weight: 78.971, density: 4.819, mp: 221, bp: 685, config: '[Ar] 3d¹⁰ 4s² 4p⁴' },
  { num: 35, sym: 'Br', name: 'Bromine', period: 4, group: 17, block: 'p', cat: 'nonmetal', struct: 'Orthorhombic', sg: 'Cmca', a: 6.67, b: 4.48, c: 8.72, weight: 79.904, density: 3.1028, mp: -7.2, bp: 58.8, config: '[Ar] 3d¹⁰ 4s² 4p⁵' },
  { num: 36, sym: 'Kr', name: 'Krypton', period: 4, group: 18, block: 'p', cat: 'noble_gas', struct: 'FCC', sg: 'Fm-3m', a: 5.72, weight: 83.798, density: 3.749, mp: -157.36, bp: -153.22, config: '[Ar] 3d¹⁰ 4s² 4p⁶' },

  // Period 5
  { num: 37, sym: 'Rb', name: 'Rubidium', period: 5, group: 1, block: 's', cat: 'alkali', struct: 'BCC', sg: 'Im-3m', a: 5.59, weight: 85.468, density: 1.532, mp: 39.3, bp: 688, config: '[Kr] 5s¹' },
  { num: 38, sym: 'Sr', name: 'Strontium', period: 5, group: 2, block: 's', cat: 'alkaline_earth', struct: 'FCC', sg: 'Fm-3m', a: 6.08, weight: 87.62, density: 2.64, mp: 777, bp: 1382, config: '[Kr] 5s²' },
  { num: 39, sym: 'Y', name: 'Yttrium', period: 5, group: 3, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 3.65, c: 5.73, weight: 88.906, density: 4.472, mp: 1526, bp: 3345, config: '[Kr] 4d¹ 5s²' },
  { num: 40, sym: 'Zr', name: 'Zirconium', period: 5, group: 4, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 3.23, c: 5.15, weight: 91.224, density: 6.52, mp: 1855, bp: 4409, config: '[Kr] 4d² 5s²' },
  { num: 41, sym: 'Nb', name: 'Niobium', period: 5, group: 5, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.30, weight: 92.906, density: 8.57, mp: 2477, bp: 4744, config: '[Kr] 4d⁴ 5s¹' },
  { num: 42, sym: 'Mo', name: 'Molybdenum', period: 5, group: 6, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.15, weight: 95.95, density: 10.28, mp: 2623, bp: 4639, config: '[Kr] 4d⁵ 5s¹' },
  { num: 43, sym: 'Tc', name: 'Technetium', period: 5, group: 7, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.74, c: 4.40, weight: 98, density: 11.0, mp: 2157, bp: 4265, config: '[Kr] 4d⁵ 5s²' },
  { num: 44, sym: 'Ru', name: 'Ruthenium', period: 5, group: 8, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.70, c: 4.28, weight: 101.07, density: 12.45, mp: 2334, bp: 4150, config: '[Kr] 4d⁷ 5s¹' },
  { num: 45, sym: 'Rh', name: 'Rhodium', period: 5, group: 9, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.80, weight: 102.91, density: 12.41, mp: 1964, bp: 3695, config: '[Kr] 4d⁸ 5s¹' },
  { num: 46, sym: 'Pd', name: 'Palladium', period: 5, group: 10, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.89, weight: 106.42, density: 12.023, mp: 1554.9, bp: 2963, config: '[Kr] 4d¹⁰' },
  { num: 47, sym: 'Ag', name: 'Silver', period: 5, group: 11, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 4.09, weight: 107.87, density: 10.49, mp: 961.78, bp: 2162, config: '[Kr] 4d¹⁰ 5s¹' },
  { num: 48, sym: 'Cd', name: 'Cadmium', period: 5, group: 12, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.98, c: 5.62, weight: 112.41, density: 8.65, mp: 321.07, bp: 767, config: '[Kr] 4d¹⁰ 5s²' },
  { num: 49, sym: 'In', name: 'Indium', period: 5, group: 13, block: 'p', cat: 'post_transition', struct: 'Tetragonal', sg: 'I4/mmm', a: 3.25, c: 4.95, weight: 114.82, density: 7.31, mp: 156.6, bp: 2072, config: '[Kr] 4d¹⁰ 5s² 5p¹' },
  { num: 50, sym: 'Sn', name: 'Tin', period: 5, group: 14, block: 'p', cat: 'post_transition', struct: 'Tetragonal', sg: 'I4_1/amd', a: 5.83, c: 3.18, weight: 118.71, density: 7.265, mp: 231.93, bp: 2602, config: '[Kr] 4d¹⁰ 5s² 5p²' },
  { num: 51, sym: 'Sb', name: 'Antimony', period: 5, group: 15, block: 'p', cat: 'metalloid', struct: 'Rhombohedral', sg: 'R-3m', a: 4.51, alpha: 57.11, weight: 121.76, density: 6.697, mp: 630.63, bp: 1635, config: '[Kr] 4d¹⁰ 5s² 5p³' },
  { num: 52, sym: 'Te', name: 'Tellurium', period: 5, group: 16, block: 'p', cat: 'metalloid', struct: 'Hexagonal', sg: 'P3_121', a: 4.46, c: 5.93, weight: 127.6, density: 6.24, mp: 449.51, bp: 988, config: '[Kr] 4d¹⁰ 5s² 5p⁴' },
  { num: 53, sym: 'I', name: 'Iodine', period: 5, group: 17, block: 'p', cat: 'nonmetal', struct: 'Orthorhombic', sg: 'Cmca', a: 7.27, b: 4.79, c: 9.79, weight: 126.9, density: 4.933, mp: 113.7, bp: 184.3, config: '[Kr] 4d¹⁰ 5s² 5p⁵' },
  { num: 54, sym: 'Xe', name: 'Xenon', period: 5, group: 18, block: 'p', cat: 'noble_gas', struct: 'FCC', sg: 'Fm-3m', a: 6.20, weight: 131.29, density: 5.894, mp: -111.75, bp: -108.09, config: '[Kr] 4d¹⁰ 5s² 5p⁶' },

  // Period 6: 55 to 56
  { num: 55, sym: 'Cs', name: 'Cesium', period: 6, group: 1, block: 's', cat: 'alkali', struct: 'BCC', sg: 'Im-3m', a: 6.14, weight: 132.91, density: 1.93, mp: 28.44, bp: 671, config: '[Xe] 6s¹' },
  { num: 56, sym: 'Ba', name: 'Barium', period: 6, group: 2, block: 's', cat: 'alkaline_earth', struct: 'BCC', sg: 'Im-3m', a: 5.02, weight: 137.33, density: 3.51, mp: 727, bp: 1897, config: '[Xe] 6s²' },

  // Lanthanides: 57 to 71
  { num: 57, sym: 'La', name: 'Lanthanum', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.77, c: 12.16, weight: 138.91, density: 6.162, mp: 920, bp: 3464, config: '[Xe] 5d¹ 6s²' },
  { num: 58, sym: 'Ce', name: 'Cerium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'FCC', sg: 'Fm-3m', a: 5.16, weight: 140.12, density: 6.77, mp: 798, bp: 3443, config: '[Xe] 4f¹ 5d¹ 6s²' },
  { num: 59, sym: 'Pr', name: 'Praseodymium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.67, c: 11.84, weight: 140.91, density: 6.77, mp: 931, bp: 3520, config: '[Xe] 4f³ 6s²' },
  { num: 60, sym: 'Nd', name: 'Neodymium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.66, c: 11.80, weight: 144.24, density: 7.01, mp: 1021, bp: 3074, config: '[Xe] 4f⁴ 6s²' },
  { num: 61, sym: 'Pm', name: 'Promethium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.65, c: 11.65, weight: 145, density: 7.26, mp: 1042, bp: 3000, config: '[Xe] 4f⁵ 6s²' },
  { num: 62, sym: 'Sm', name: 'Samarium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'Rhombohedral', sg: 'R-3m', a: 9.00, alpha: 23.2, weight: 150.36, density: 7.52, mp: 1072, bp: 1794, config: '[Xe] 4f⁶ 6s²' },
  { num: 63, sym: 'Eu', name: 'Europium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'BCC', sg: 'Im-3m', a: 4.58, weight: 151.96, density: 5.244, mp: 822, bp: 1529, config: '[Xe] 4f⁷ 6s²' },
  { num: 64, sym: 'Gd', name: 'Gadolinium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.64, c: 5.78, weight: 157.25, density: 7.90, mp: 1313, bp: 3273, config: '[Xe] 4f⁷ 5d¹ 6s²' },
  { num: 65, sym: 'Tb', name: 'Terbium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.60, c: 5.69, weight: 158.93, density: 8.23, mp: 1356, bp: 3230, config: '[Xe] 4f⁹ 6s²' },
  { num: 66, sym: 'Dy', name: 'Dysprosium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.59, c: 5.65, weight: 162.50, density: 8.54, mp: 1412, bp: 2567, config: '[Xe] 4f¹⁰ 6s²' },
  { num: 67, sym: 'Ho', name: 'Holmium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.58, c: 5.62, weight: 164.93, density: 8.79, mp: 1474, bp: 2700, config: '[Xe] 4f¹¹ 6s²' },
  { num: 68, sym: 'Er', name: 'Erbium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.56, c: 5.59, weight: 167.26, density: 9.066, mp: 1529, bp: 2868, config: '[Xe] 4f¹² 6s²' },
  { num: 69, sym: 'Tm', name: 'Thulium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.54, c: 5.55, weight: 168.93, density: 9.32, mp: 1545, bp: 1950, config: '[Xe] 4f¹³ 6s²' },
  { num: 70, sym: 'Yb', name: 'Ytterbium', period: 6, group: 3, block: 'f', cat: 'lanthanoid', struct: 'FCC', sg: 'Fm-3m', a: 5.49, weight: 173.05, density: 6.90, mp: 819, bp: 1196, config: '[Xe] 4f¹⁴ 6s²' },
  { num: 71, sym: 'Lu', name: 'Lutetium', period: 6, group: 3, block: 'd', cat: 'lanthanoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.51, c: 5.55, weight: 174.97, density: 9.841, mp: 1663, bp: 3402, config: '[Xe] 4f¹⁴ 5d¹ 6s²' },

  // Period 6: 72 to 86
  { num: 72, sym: 'Hf', name: 'Hafnium', period: 6, group: 4, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 3.20, c: 5.06, weight: 178.49, density: 13.31, mp: 2233, bp: 4603, config: '[Xe] 4f¹⁴ 5d² 6s²' },
  { num: 73, sym: 'Ta', name: 'Tantalum', period: 6, group: 5, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.31, weight: 180.95, density: 16.69, mp: 3017, bp: 5458, config: '[Xe] 4f¹⁴ 5d³ 6s²' },
  { num: 74, sym: 'W', name: 'Tungsten', period: 6, group: 6, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.16, weight: 183.84, density: 19.25, mp: 3422, bp: 5555, config: '[Xe] 4f¹⁴ 5d⁴ 6s²', compounds: [
    { formula: 'WC (Tungsten Carbide)', name: 'Tungsten Carbide', crystalSystem: 'Hexagonal', spaceGroup: 'P-6m2', latticeParams: { a: 2.91, c: 2.84 }, typicalPeaks: [{ twoTheta: 31.51, intensity: 50 }, { twoTheta: 35.64, intensity: 100 }, { twoTheta: 48.30, intensity: 60 }], relevance: 'Extreme-hardness cutting tools and high-pressure anvils.', shortDesc: 'Simple hexagonal tungsten lattice with interstitial carbon.' }
  ]},
  { num: 75, sym: 'Re', name: 'Rhenium', period: 6, group: 7, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.76, c: 4.46, weight: 186.21, density: 21.02, mp: 3186, bp: 5596, config: '[Xe] 4f¹⁴ 5d⁵ 6s²' },
  { num: 76, sym: 'Os', name: 'Osmium', period: 6, group: 8, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.73, c: 4.32, weight: 190.23, density: 22.59, mp: 3033, bp: 5012, config: '[Xe] 4f¹⁴ 5d⁶ 6s²' },
  { num: 77, sym: 'Ir', name: 'Iridium', period: 6, group: 9, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.84, weight: 192.22, density: 22.56, mp: 2446, bp: 4428, config: '[Xe] 4f¹⁴ 5d⁷ 6s²' },
  { num: 78, sym: 'Pt', name: 'Platinum', period: 6, group: 10, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.92, weight: 195.08, density: 21.45, mp: 1768.3, bp: 3825, config: '[Xe] 4f¹⁴ 5d⁹ 6s¹' },
  { num: 79, sym: 'Au', name: 'Gold', period: 6, group: 11, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 4.08, weight: 196.97, density: 19.30, mp: 1064.18, bp: 2856, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹' },
  { num: 80, sym: 'Hg', name: 'Mercury', period: 6, group: 12, block: 'd', cat: 'post_transition', struct: 'Rhombohedral', sg: 'R-3m', a: 2.99, alpha: 70.5, weight: 200.59, density: 13.534, mp: -38.83, bp: 356.73, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s²' },
  { num: 81, sym: 'Tl', name: 'Thallium', period: 6, group: 13, block: 'p', cat: 'post_transition', struct: 'HCP', sg: 'P6_3/mmc', a: 3.46, c: 5.53, weight: 204.38, density: 11.85, mp: 304, bp: 1473, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹' },
  { num: 82, sym: 'Pb', name: 'Lead', period: 6, group: 14, block: 'p', cat: 'post_transition', struct: 'FCC', sg: 'Fm-3m', a: 4.95, weight: 207.2, density: 11.34, mp: 327.46, bp: 1749, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²' },
  { num: 83, sym: 'Bi', name: 'Bismuth', period: 6, group: 15, block: 'p', cat: 'post_transition', struct: 'Rhombohedral', sg: 'R-3m', a: 4.75, alpha: 57.24, weight: 208.98, density: 9.78, mp: 271.4, bp: 1564, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³' },
  { num: 84, sym: 'Po', name: 'Polonium', period: 6, group: 16, block: 'p', cat: 'post_transition', struct: 'Cubic', sg: 'Pm-3m', a: 3.35, weight: 209, density: 9.196, mp: 254, bp: 962, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴' },
  { num: 85, sym: 'At', name: 'Astatine', period: 6, group: 17, block: 'p', cat: 'metalloid', struct: 'FCC', sg: 'Fm-3m', a: 5.60, weight: 210, density: 6.35, mp: 302, bp: 337, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵' },
  { num: 86, sym: 'Rn', name: 'Radon', period: 6, group: 18, block: 'p', cat: 'noble_gas', struct: 'FCC', sg: 'Fm-3m', a: 6.54, weight: 222, density: 9.73, mp: -71, bp: -61.7, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶' },

  // Period 7: 87 to 88
  { num: 87, sym: 'Fr', name: 'Francium', period: 7, group: 1, block: 's', cat: 'alkali', struct: 'BCC', sg: 'Im-3m', a: 6.05, weight: 223, density: 1.87, mp: 27, bp: 677, config: '[Rn] 7s¹' },
  { num: 88, sym: 'Ra', name: 'Radium', period: 7, group: 2, block: 's', cat: 'alkaline_earth', struct: 'BCC', sg: 'Im-3m', a: 5.15, weight: 226, density: 5.5, mp: 700, bp: 1737, config: '[Rn] 7s²' },

  // Actinides: 89 to 103
  { num: 89, sym: 'Ac', name: 'Actinium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'FCC', sg: 'Fm-3m', a: 5.31, weight: 227, density: 10.07, mp: 1050, bp: 3198, config: '[Rn] 6d¹ 7s²' },
  { num: 90, sym: 'Th', name: 'Thorium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'FCC', sg: 'Fm-3m', a: 5.08, weight: 232.04, density: 11.72, mp: 1750, bp: 4788, config: '[Rn] 6d² 7s²' },
  { num: 91, sym: 'Pa', name: 'Protactinium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'Tetragonal', sg: 'I4/mmm', a: 3.92, c: 3.24, weight: 231.04, density: 15.37, mp: 1568, bp: 4027, config: '[Rn] 5f² 6d¹ 7s²' },
  { num: 92, sym: 'U', name: 'Uranium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'Orthorhombic', sg: 'Cmcm', a: 2.85, b: 5.87, c: 4.95, weight: 238.03, density: 19.1, mp: 1132.2, bp: 4131, config: '[Rn] 5f³ 6d¹ 7s²', compounds: [
    { formula: 'UO2 (Uraninite)', name: 'Uranium Dioxide', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', latticeParams: { a: 5.47 }, typicalPeaks: [{ twoTheta: 28.21, intensity: 100 }, { twoTheta: 32.70, intensity: 45 }, { twoTheta: 46.95, intensity: 50 }], relevance: 'Nuclear fuel cycles and actinide fluorite structure.', shortDesc: 'FCC uranium cations with fluorite eight-fold coordinated oxygens.' }
  ]},
  { num: 93, sym: 'Np', name: 'Neptunium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'Orthorhombic', sg: 'Pnma', a: 4.72, b: 4.89, c: 6.66, weight: 237, density: 20.45, mp: 644, bp: 3902, config: '[Rn] 5f⁴ 6d¹ 7s²' },
  { num: 94, sym: 'Pu', name: 'Plutonium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'Monoclinic', sg: 'P2_1/m', a: 6.18, b: 4.82, c: 5.36, beta: 101.8, weight: 244, density: 19.84, mp: 640, bp: 3228, config: '[Rn] 5f⁶ 7s²' },
  { num: 95, sym: 'Am', name: 'Americium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.47, c: 11.24, weight: 243, density: 12.0, mp: 1176, bp: 2011, config: '[Rn] 5f⁷ 7s²' },
  { num: 96, sym: 'Cm', name: 'Curium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.49, c: 11.33, weight: 247, density: 13.51, mp: 1345, bp: 3110, config: '[Rn] 5f⁷ 6d¹ 7s²' },
  { num: 97, sym: 'Bk', name: 'Berkelium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.41, c: 11.07, weight: 247, density: 14.78, mp: 986, bp: 2627, config: '[Rn] 5f⁹ 7s²' },
  { num: 98, sym: 'Cf', name: 'Californium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.38, c: 11.02, weight: 251, density: 15.1, mp: 900, bp: 1470, config: '[Rn] 5f¹⁰ 7s²' },
  { num: 99, sym: 'Es', name: 'Einsteinium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'FCC', sg: 'Fm-3m', a: 5.75, weight: 252, density: 8.84, mp: 860, bp: 996, config: '[Rn] 5f¹¹ 7s²' },
  { num: 100, sym: 'Fm', name: 'Fermium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'FCC', sg: 'Fm-3m', a: 5.70, weight: 257, density: 9.7, mp: 1527, config: '[Rn] 5f¹² 7s²' },
  { num: 101, sym: 'Md', name: 'Mendelevium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'FCC', sg: 'Fm-3m', a: 5.68, weight: 258, density: 10.3, mp: 827, config: '[Rn] 5f¹³ 7s²' },
  { num: 102, sym: 'No', name: 'Nobelium', period: 7, group: 3, block: 'f', cat: 'actinoid', struct: 'FCC', sg: 'Fm-3m', a: 5.65, weight: 259, density: 9.9, mp: 827, config: '[Rn] 5f¹⁴ 7s²' },
  { num: 103, sym: 'Lr', name: 'Lawrencium', period: 7, group: 3, block: 'd', cat: 'actinoid', struct: 'HCP', sg: 'P6_3/mmc', a: 3.42, c: 5.50, weight: 266, density: 15.6, mp: 1627, config: '[Rn] 5f¹⁴ 7s² 7p¹' },

  // Transactinides: 104 to 118
  { num: 104, sym: 'Rf', name: 'Rutherfordium', period: 7, group: 4, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 3.32, c: 5.25, weight: 267, density: 23.2, mp: 2100, config: '[Rn] 5f¹⁴ 6d² 7s²' },
  { num: 105, sym: 'Db', name: 'Dubnium', period: 7, group: 5, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.41, weight: 268, density: 29.3, mp: 2200, config: '[Rn] 5f¹⁴ 6d³ 7s²' },
  { num: 106, sym: 'Sg', name: 'Seaborgium', period: 7, group: 6, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.38, weight: 269, density: 35.0, mp: 2400, config: '[Rn] 5f¹⁴ 6d⁴ 7s²' },
  { num: 107, sym: 'Bh', name: 'Bohrium', period: 7, group: 7, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.85, c: 4.52, weight: 270, density: 37.1, mp: 2600, config: '[Rn] 5f¹⁴ 6d⁵ 7s²' },
  { num: 108, sym: 'Hs', name: 'Hassium', period: 7, group: 8, block: 'd', cat: 'transition_metal', struct: 'HCP', sg: 'P6_3/mmc', a: 2.81, c: 4.45, weight: 277, density: 40.7, mp: 2700, config: '[Rn] 5f¹⁴ 6d⁶ 7s²' },
  { num: 109, sym: 'Mt', name: 'Meitnerium', period: 7, group: 9, block: 'd', cat: 'transition_metal', struct: 'FCC', sg: 'Fm-3m', a: 3.86, weight: 278, density: 37.4, mp: 2600, config: '[Rn] 5f¹⁴ 6d⁷ 7s²' },
  { num: 110, sym: 'Ds', name: 'Darmstadtium', period: 7, group: 10, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.34, weight: 281, density: 34.8, mp: 2500, config: '[Rn] 5f¹⁴ 6d⁸ 7s²' },
  { num: 111, sym: 'Rg', name: 'Roentgenium', period: 7, group: 11, block: 'd', cat: 'transition_metal', struct: 'BCC', sg: 'Im-3m', a: 3.42, weight: 282, density: 28.7, mp: 2400, config: '[Rn] 5f¹⁴ 6d⁹ 7s²' },
  { num: 112, sym: 'Cn', name: 'Copernicium', period: 7, group: 12, block: 'd', cat: 'post_transition', struct: 'HCP', sg: 'P6_3/mmc', a: 3.01, c: 5.68, weight: 285, density: 23.7, mp: 10, bp: 67, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s²' },
  { num: 113, sym: 'Nh', name: 'Nihonium', period: 7, group: 13, block: 'p', cat: 'post_transition', struct: 'HCP', sg: 'P6_3/mmc', a: 3.48, c: 5.56, weight: 286, density: 16.0, mp: 430, bp: 1130, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹' },
  { num: 114, sym: 'Fl', name: 'Flerovium', period: 7, group: 14, block: 'p', cat: 'post_transition', struct: 'FCC', sg: 'Fm-3m', a: 4.98, weight: 289, density: 14.0, mp: -60, bp: -60, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²' },
  { num: 115, sym: 'Mc', name: 'Moscovium', period: 7, group: 15, block: 'p', cat: 'post_transition', struct: 'BCC', sg: 'Im-3m', a: 4.80, weight: 290, density: 13.5, mp: 400, bp: 1100, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³' },
  { num: 116, sym: 'Lv', name: 'Livermorium', period: 7, group: 16, block: 'p', cat: 'post_transition', struct: 'BCC', sg: 'Im-3m', a: 4.75, weight: 293, density: 12.9, mp: 450, bp: 800, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴' },
  { num: 117, sym: 'Ts', name: 'Tennessine', period: 7, group: 17, block: 'p', cat: 'metalloid', struct: 'FCC', sg: 'Fm-3m', a: 5.65, weight: 294, density: 7.2, mp: 450, bp: 610, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵' },
  { num: 118, sym: 'Og', name: 'Oganesson', period: 7, group: 18, block: 'p', cat: 'noble_gas', struct: 'FCC', sg: 'Fm-3m', a: 6.62, weight: 294, density: 5.0, mp: 80, bp: 100, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶' }
];

// Helper to compute standard IUPAC grid coordinates
export function getIUPACGridCoordinates(num: number, period: number, group: number, cat: ElementCategory): { gridX: number; gridY: number } {
  // Lanthanides series: row 8, columns 4 to 18 (La 57 to Lu 71)
  if (cat === 'lanthanoid') {
    return { gridX: num - 57 + 4, gridY: 8 };
  }
  // Actinides series: row 9, columns 4 to 18 (Ac 89 to Lr 103)
  if (cat === 'actinoid') {
    return { gridX: num - 89 + 4, gridY: 9 };
  }
  // Standard grid
  return { gridX: group, gridY: period };
}

// Build complete high-fidelity dataset of all 118 elements
export const COMPLETE_PERIODIC_TABLE: CrystalElement[] = RAW_ELEMENTS.map(raw => {
  const { gridX, gridY } = getIUPACGridCoordinates(raw.num, raw.period, raw.group, raw.cat);
  const factual = getFactualProperties(raw.num);
  const metrology = getElementMetrology(raw.sym);

  return {
    number: raw.num,
    symbol: raw.sym,
    name: raw.name,
    weight: raw.weight,
    period: raw.period,
    group: raw.group,
    block: raw.block,
    category: raw.cat,
    gridX,
    gridY,
    crystalStructure: raw.struct,
    spaceGroup: raw.sg,
    a: raw.a,
    b: raw.b,
    c: raw.c,
    alpha: raw.alpha || 90,
    beta: raw.beta || 90,
    gamma: raw.gamma || (raw.struct === 'Hexagonal' || raw.struct === 'HCP' ? 120 : 90),
    density: raw.density,
    meltingPoint: raw.mp,
    boilingPoint: raw.bp,
    electronConfig: raw.config || factual.electronConfig || '',
    famousCompounds: raw.compounds || [],
    // X-ray absorption metrology
    kEdgeKeV: metrology.kEdgeKeV,
    kAlpha1KeV: metrology.kAlpha1KeV,
    muOverRhoCu: metrology.muOverRhoCu,
    // Scientific properties
    valenceElectrons: metrology.valenceElectrons || factual.valenceElectrons || 1,
    electronegativity: metrology.electronegativity || factual.electronegativity || 0,
    ionizationEnergy: factual.ionizationEnergy || 7.0,
    electronAffinity: factual.electronAffinity || 0.5,
    metallicCharacter: factual.metallicCharacter || (raw.cat === 'transition_metal' || raw.cat === 'alkali' || raw.cat === 'alkaline_earth' ? 'Very High' : 'Non-metallic'),
    nonMetallicCharacter: factual.nonMetallicCharacter || (raw.cat === 'nonmetal' || raw.cat === 'noble_gas' ? 'High' : 'None'),
    atomicRadius: factual.atomicRadius || metrology.covalentRadiusPm || 120,
    ionicRadius: factual.ionicRadius || `${metrology.ionicRadiusPm} pm`,
    electricalConductivity: factual.electricalConductivity || 0,
    thermalConductivity: factual.thermalConductivity || 0,
    mohsHardness: factual.mohsHardness || 2.5,
    speedOfSound: factual.speedOfSound,
    thermalExpansion: factual.thermalExpansion,
    specificHeat: factual.specificHeat,
    factEn: factual.factEn || `Atomic number ${raw.num} element with ${raw.struct} crystal structure.`,
    factFa: factual.factFa
  };
});
