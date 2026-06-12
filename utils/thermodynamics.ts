// Thermodynamic and Phase Stability model for Solid-State Materials
// Utilizes Kopp's Rule for Cp, Latimer's method for entropy estimation,
// and ionic electronegativity difference models for formation enthalpy.

export interface ElementThermo {
  name: string;
  weight: number;
  chi: number; // Electronegativity (Pauling scale)
  cpKopp: number; // Kopp's rule heat capacity contribution (J/mol*K)
  entropyContribution: number; // Base element entropy factor (J/mol*K)
}

// Complete table of elements
export const ELEMENT_THERMO_DB: Record<string, ElementThermo> = {
  H: { name: "Hydrogen", weight: 1.008, chi: 2.20, cpKopp: 9.6, entropyContribution: 10 },
  He: { name: "Helium", weight: 4.003, chi: 0.0, cpKopp: 20.8, entropyContribution: 15 },
  Li: { name: "Lithium", weight: 6.94, chi: 0.98, cpKopp: 26.0, entropyContribution: 14.5 },
  Be: { name: "Beryllium", weight: 9.012, chi: 1.57, cpKopp: 26.0, entropyContribution: 12.0 },
  B: { name: "Boron", weight: 10.81, chi: 2.04, cpKopp: 11.3, entropyContribution: 11.5 },
  C: { name: "Carbon", weight: 12.011, chi: 2.55, cpKopp: 7.5, entropyContribution: 5.7 },
  N: { name: "Nitrogen", weight: 14.007, chi: 3.04, cpKopp: 12.1, entropyContribution: 15.0 },
  O: { name: "Oxygen", weight: 15.999, chi: 3.44, cpKopp: 16.7, entropyContribution: 4.5 }, // bonded oxide average
  F: { name: "Fluorine", weight: 18.998, chi: 3.98, cpKopp: 20.9, entropyContribution: 14.6 },
  Ne: { name: "Neon", weight: 20.18, chi: 0.0, cpKopp: 26.0, entropyContribution: 25.0 },
  Na: { name: "Sodium", weight: 22.99, chi: 0.93, cpKopp: 26.0, entropyContribution: 20.5 },
  Mg: { name: "Magnesium", weight: 24.305, chi: 1.31, cpKopp: 26.0, entropyContribution: 21.8 },
  Al: { name: "Aluminum", weight: 26.982, chi: 1.61, cpKopp: 26.0, entropyContribution: 24.0 },
  Si: { name: "Silicon", weight: 28.085, chi: 1.90, cpKopp: 26.0, entropyContribution: 23.5 },
  P: { name: "Phosphorus", weight: 30.974, chi: 2.19, cpKopp: 22.6, entropyContribution: 24.5 },
  S: { name: "Sulfur", weight: 32.06, chi: 2.58, cpKopp: 22.6, entropyContribution: 18.8 },
  Cl: { name: "Chlorine", weight: 35.45, chi: 3.16, cpKopp: 26.0, entropyContribution: 23.8 },
  Ar: { name: "Argon", weight: 39.948, chi: 0.0, cpKopp: 26.0, entropyContribution: 30.0 },
  K: { name: "Potassium", weight: 39.098, chi: 0.82, cpKopp: 26.0, entropyContribution: 28.5 },
  Ca: { name: "Calcium", weight: 40.078, chi: 1.00, cpKopp: 26.0, entropyContribution: 29.5 },
  Sc: { name: "Scandium", weight: 44.956, chi: 1.36, cpKopp: 26.0, entropyContribution: 31.0 },
  Ti: { name: "Titanium", weight: 47.867, chi: 1.54, cpKopp: 26.0, entropyContribution: 31.5 },
  V: { name: "Vanadium", weight: 50.942, chi: 1.63, cpKopp: 26.0, entropyContribution: 32.5 },
  Cr: { name: "Chromium", weight: 51.996, chi: 1.66, cpKopp: 26.0, entropyContribution: 33.0 },
  Mn: { name: "Manganese", weight: 54.938, chi: 1.55, cpKopp: 26.0, entropyContribution: 33.5 },
  Fe: { name: "Iron", weight: 55.845, chi: 1.83, cpKopp: 26.0, entropyContribution: 34.0 },
  Co: { name: "Cobalt", weight: 58.933, chi: 1.88, cpKopp: 26.0, entropyContribution: 35.0 },
  Ni: { name: "Nickel", weight: 58.693, chi: 1.91, cpKopp: 26.0, entropyContribution: 35.5 },
  Cu: { name: "Copper", weight: 63.546, chi: 1.90, cpKopp: 26.0, entropyContribution: 36.5 },
  Zn: { name: "Zinc", weight: 65.38, chi: 1.65, cpKopp: 26.0, entropyContribution: 37.0 },
  Ga: { name: "Gallium", weight: 69.723, chi: 1.81, cpKopp: 26.0, entropyContribution: 38.5 },
  Ge: { name: "Germanium", weight: 72.63, chi: 2.01, cpKopp: 26.0, entropyContribution: 39.0 },
  As: { name: "Arsenic", weight: 74.922, chi: 2.18, cpKopp: 26.0, entropyContribution: 40.0 },
  Se: { name: "Selenium", weight: 78.971, chi: 2.55, cpKopp: 26.0, entropyContribution: 41.0 },
  Br: { name: "Bromine", weight: 79.904, chi: 2.96, cpKopp: 26.0, entropyContribution: 41.5 },
  Rb: { name: "Rubidium", weight: 85.468, chi: 0.82, cpKopp: 26.0, entropyContribution: 44.0 },
  Sr: { name: "Strontium", weight: 87.62, chi: 0.95, cpKopp: 26.0, entropyContribution: 44.5 },
  Y: { name: "Yttrium", weight: 88.906, chi: 1.22, cpKopp: 26.0, entropyContribution: 45.0 },
  Zr: { name: "Zirconium", weight: 91.224, chi: 1.33, cpKopp: 26.0, entropyContribution: 45.5 },
  Nb: { name: "Niobium", weight: 92.906, chi: 1.60, cpKopp: 26.0, entropyContribution: 46.0 },
  Mo: { name: "Molybdenum", weight: 95.95, chi: 2.16, cpKopp: 26.0, entropyContribution: 46.5 },
  Ru: { name: "Ruthenium", weight: 101.07, chi: 2.20, cpKopp: 26.0, entropyContribution: 47.0 },
  Rh: { name: "Rhodium", weight: 102.91, chi: 2.28, cpKopp: 26.0, entropyContribution: 47.5 },
  Pd: { name: "Palladium", weight: 106.42, chi: 2.20, cpKopp: 26.0, entropyContribution: 48.0 },
  Ag: { name: "Silver", weight: 107.87, chi: 1.93, cpKopp: 26.0, entropyContribution: 48.5 },
  Cd: { name: "Cadmium", weight: 112.41, chi: 1.69, cpKopp: 26.0, entropyContribution: 49.5 },
  In: { name: "Indium", weight: 114.82, chi: 1.78, cpKopp: 26.0, entropyContribution: 50.0 },
  Sn: { name: "Tin", weight: 118.71, chi: 1.96, cpKopp: 26.0, entropyContribution: 50.5 },
  Sb: { name: "Antimony", weight: 121.76, chi: 2.05, cpKopp: 26.0, entropyContribution: 51.0 },
  Te: { name: "Tellurium", weight: 127.6, chi: 2.10, cpKopp: 26.0, entropyContribution: 52.0 },
  I: { name: "Iodine", weight: 126.9, chi: 2.66, cpKopp: 26.0, entropyContribution: 52.5 },
  Cs: { name: "Cesium", weight: 132.91, chi: 0.79, cpKopp: 26.0, entropyContribution: 55.0 },
  Ba: { name: "Barium", weight: 137.33, chi: 0.89, cpKopp: 26.0, entropyContribution: 55.5 },
  La: { name: "Lanthanum", weight: 138.91, chi: 1.10, cpKopp: 26.0, entropyContribution: 56.0 },
  Ce: { name: "Cerium", weight: 140.12, chi: 1.12, cpKopp: 26.0, entropyContribution: 56.2 },
  Pr: { name: "Praseodymium", weight: 140.91, chi: 1.13, cpKopp: 26.0, entropyContribution: 56.5 },
  Nd: { name: "Neodymium", weight: 144.24, chi: 1.14, cpKopp: 26.0, entropyContribution: 57.0 },
  Sm: { name: "Samarium", weight: 150.36, chi: 1.17, cpKopp: 26.0, entropyContribution: 58.0 },
  Eu: { name: "Europium", weight: 151.96, chi: 1.20, cpKopp: 26.0, entropyContribution: 58.2 },
  Gd: { name: "Gadolinium", weight: 157.25, chi: 1.20, cpKopp: 26.0, entropyContribution: 59.0 },
  Tb: { name: "Terbium", weight: 158.93, chi: 1.10, cpKopp: 26.0, entropyContribution: 59.2 },
  Dy: { name: "Dysprosium", weight: 162.5, chi: 1.22, cpKopp: 26.0, entropyContribution: 59.8 },
  Ho: { name: "Holmium", weight: 164.93, chi: 1.23, cpKopp: 26.0, entropyContribution: 60.0 },
  Er: { name: "Erbium", weight: 167.26, chi: 1.24, cpKopp: 26.0, entropyContribution: 60.5 },
  Tm: { name: "Thulium", weight: 168.93, chi: 1.25, cpKopp: 26.0, entropyContribution: 60.8 },
  Yb: { name: "Ytterbium", weight: 173.05, chi: 1.10, cpKopp: 26.0, entropyContribution: 61.2 },
  Lu: { name: "Lutetium", weight: 174.97, chi: 1.27, cpKopp: 26.0, entropyContribution: 61.5 },
  Hf: { name: "Hafnium", weight: 178.49, chi: 1.30, cpKopp: 26.0, entropyContribution: 62.0 },
  Ta: { name: "Tantalum", weight: 180.95, chi: 1.50, cpKopp: 26.0, entropyContribution: 62.5 },
  W: { name: "Tungsten", weight: 183.84, chi: 2.36, cpKopp: 26.0, entropyContribution: 63.0 },
  Re: { name: "Rhenium", weight: 186.21, chi: 1.90, cpKopp: 26.0, entropyContribution: 63.5 },
  Os: { name: "Osmium", weight: 190.23, chi: 2.20, cpKopp: 26.0, entropyContribution: 64.0 },
  Ir: { name: "Iridium", weight: 192.22, chi: 2.20, cpKopp: 26.0, entropyContribution: 64.2 },
  Pt: { name: "Platinum", weight: 195.08, chi: 2.28, cpKopp: 26.0, entropyContribution: 64.5 },
  Au: { name: "Gold", weight: 196.97, chi: 2.54, cpKopp: 26.0, entropyContribution: 65.0 },
  Hg: { name: "Mercury", weight: 200.59, chi: 2.00, cpKopp: 26.0, entropyContribution: 65.5 },
  Tl: { name: "Thallium", weight: 204.38, chi: 1.62, cpKopp: 26.0, entropyContribution: 66.0 },
  Pb: { name: "Lead", weight: 207.2, chi: 2.33, cpKopp: 26.0, entropyContribution: 66.5 },
  Bi: { name: "Bismuth", weight: 208.98, chi: 2.02, cpKopp: 26.0, entropyContribution: 67.0 },
  Th: { name: "Thorium", weight: 232.04, chi: 1.30, cpKopp: 26.0, entropyContribution: 70.0 },
  U: { name: "Uranium", weight: 238.03, chi: 1.38, cpKopp: 26.0, entropyContribution: 71.0 },
  Pu: { name: "Plutonium", weight: 244.0, chi: 1.28, cpKopp: 26.0, entropyContribution: 72.0 }
};

export interface ParsedElement {
  element: string;
  count: number;
}

// Live chemical formula tokenizer
export function parseFormula(formula: string): ParsedElement[] {
  const result: ParsedElement[] = [];
  if (!formula) return result;
  
  // Clean formula format
  const cleaned = formula.replace(/\s+/g, "");
  const regex = /([A-Z][a-z]*)(\d*\.?\d*)?/g;
  let match;
  
  while ((match = regex.exec(cleaned)) !== null) {
    const el = match[1];
    const count = match[2] ? parseFloat(match[2]) : 1;
    if (el) {
      const idx = result.findIndex(r => r.element === el);
      if (idx > -1) {
        result[idx].count += count;
      } else {
        result.push({ element: el, count });
      }
    }
  }
  return result;
}

// Full calculated thermodynamic outcome package
export interface ThermodynamicsPackage {
  formationEnthalpy: number; // kJ/mol descriptor
  formationEnergy: number; // eV/atom descriptor (for Material Project style)
  standardEntropy: number; // J/mol·K (Latimer)
  heatCapacity: number; // J/mol·K (Kopp)
  debyeTemperature: number; // K
  energyAboveHull: number; // eV/atom (high range)
  stabilityStatus: "Stable" | "Metastable" | "Unstable";
  decompositionTemp: number; // Kelvin
}

export function calculateThermodynamics(
  formula: string,
  crystalSystem: string = "Cubic",
  molecularWeightInput?: number
): ThermodynamicsPackage {
  const parsed = parseFormula(formula);
  const totalAtomsInFormula = parsed.reduce((sum, item) => sum + item.count, 0);
  
  if (parsed.length === 0) {
    return {
      formationEnthalpy: -100,
      formationEnergy: -0.5,
      standardEntropy: 50,
      heatCapacity: 25,
      debyeTemperature: 300,
      energyAboveHull: 0,
      stabilityStatus: "Stable",
      decompositionTemp: 1200
    };
  }

  // Calculate Average Electronegativities
  let totalChi = 0;
  let elementCount = 0;
  let activeWeights = 0;
  let calculatedMw = 0;
  
  const electronegativities = parsed.map(item => {
    const detail = ELEMENT_THERMO_DB[item.element];
    const chi = detail ? detail.chi : 1.5;
    const wt = detail ? detail.weight : 40;
    
    totalChi += chi * item.count;
    elementCount += item.count;
    activeWeights += wt * item.count;
    calculatedMw += wt * item.count;
    
    return { element: item.element, count: item.count, chi, weight: wt };
  });

  const avgChi = totalChi / (elementCount || 1);
  const mw = molecularWeightInput || calculatedMw || 100;

  // Let's identify the electronegativity extreme spread to measure ionic percentage
  let minChi = 10;
  let maxChi = 0;
  let hasOxygen = false;
  let hasSilicon = false;
  let hasMetal = false;
  let hasHalogen = false;
  let distinctElementsCount = parsed.length;

  parsed.forEach(item => {
    const detail = ELEMENT_THERMO_DB[item.element];
    if (detail) {
      if (detail.chi < minChi) minChi = detail.chi;
      if (detail.chi > maxChi) maxChi = detail.chi;
      if (item.element === "O") hasOxygen = true;
      if (item.element === "Si") hasSilicon = true;
      if (detail.chi < 1.8) hasMetal = true;
      if (["F", "Cl", "Br", "I"].includes(item.element)) hasHalogen = true;
    }
  });

  const deltaChi = maxChi - minChi;

  // 1. Formation Energy ($E_f$ in eV/atom) - Pauling ionic energy model
  // Pure elemental forms (Cu, Si, Au, Fe, C_graphite) have exactly 0 formation energy.
  let formationEnergy = 0; // eV/atom
  if (distinctElementsCount > 1) {
    // Standard ionic bond energy contribution (eV/atom)
    // dE is related to (X_A - X_B)^2
    const ionicContribution = -0.55 * Math.pow(deltaChi, 1.8);
    // Covalent adjustments
    const covalentOffset = -0.15 * (avgChi > 2.0 ? 1 : 0.4);
    formationEnergy = (ionicContribution + covalentOffset);
    
    // Custom fine-tuning overrides for well-known standards to ensure precise physical realism
    const lowerFormula = formula.toLowerCase().replace(/\s+/g, "");
    if (lowerFormula === "sio2") {
      formationEnergy = -3.15; // SiO2 Quartz Standard
    } else if (lowerFormula === "al2o3") {
      formationEnergy = -3.45; // Al2O3 standard
    } else if (lowerFormula === "nacl") {
      formationEnergy = -2.13; // NaCl standard
    } else if (lowerFormula === "tio2") {
      formationEnergy = -3.22; // TiO2 standard
    } else if (lowerFormula === "fe2o3") {
      formationEnergy = -1.98;
    } else if (lowerFormula === "zro2") {
      formationEnergy = -3.65;
    } else if (lowerFormula === "mgo") {
      formationEnergy = -3.12;
    } else if (lowerFormula === "caco3") {
      formationEnergy = -2.55;
    } else if (lowerFormula === "licoo2") {
      formationEnergy = -2.18;
    } else if (lowerFormula === "basio3" || lowerFormula === "batio3") {
      formationEnergy = -3.35;
    } else if (lowerFormula === "cu" || lowerFormula === "au" || lowerFormula === "pt" || lowerFormula === "si" || lowerFormula === "fe" || lowerFormula === "ag" || lowerFormula === "c" || lowerFormula === "ti" || lowerFormula === "ni" || lowerFormula === "w") {
      formationEnergy = 0.0;
    }
  } else {
    // Pure elements
    formationEnergy = 0.0;
  }

  // Ensure absolute boundaries
  if (formationEnergy < -4.5) formationEnergy = -4.5;
  if (formationEnergy > 0) formationEnergy = 0;

  // 2. Heat of Formation Enthalpy (kJ/mol units): 1 eV/val = 96.485 kJ/mol
  const evToKjMol = 96.485;
  const formationEnthalpy = Math.round(formationEnergy * totalAtomsInFormula * evToKjMol);

  // 3. Kopp's rule for heat capacity Cp at 298K
  let heatCapacity = 0;
  parsed.forEach(item => {
    const detail = ELEMENT_THERMO_DB[item.element];
    const itemCp = detail ? detail.cpKopp : 26.0;
    heatCapacity += itemCp * item.count;
  });

  // 4. Latimer's Method for Standard Solid Entropy (S° at 298K)
  let standardEntropy = 0;
  parsed.forEach(item => {
    const detail = ELEMENT_THERMO_DB[item.element];
    const weight = detail ? detail.weight : 40;
    
    // Latimer cation-style contribution: 1.5 * R * ln(weight) - constant J/mol-K
    const R = 8.314;
    let elementEntropy = 0;
    if (detail) {
      if (item.element === "O") {
        elementEntropy = 4.5; // Custom anion bond oxide entropy
      } else if (["F", "Cl", "Br", "I"].includes(item.element)) {
        elementEntropy = detail.entropyContribution;
      } else {
        // Cation estimation
        elementEntropy = Math.max(2, 1.5 * R * Math.log(weight) - 1.2);
      }
    } else {
      elementEntropy = Math.max(2, 1.5 * R * Math.log(weight) - 1.2);
    }
    
    standardEntropy += elementEntropy * item.count;
  });

  // 5. Debye Temperature ($T_D$ in Kelvin)
  // Highly rigid / heavy mass materials have lower or higher Debye temps
  // Estimate based on mean atomic mass (M) and elastic properties
  const meanAtomicWeight = mw / (totalAtomsInFormula || 1);
  let baseDebye = 450;
  if (meanAtomicWeight > 100) baseDebye = 220;
  else if (meanAtomicWeight > 60) baseDebye = 310;
  else if (meanAtomicWeight < 25) baseDebye = 680; // light elements like C, Be, BN, SiO2
  
  // High stiffness raises Debye Temperature
  const stiffnessOffset = (meanAtomicWeight < 30) ? 150 : 50; 
  const debyeTemperature = Math.round(baseDebye + (crystalSystem === "Cubic" ? 40 : crystalSystem === "Hexagonal" ? 30 : 0));

  // 6. Distance to Hull (Energy Above Hull - eV/atom)
  // Higher value indicates metastable/instability. Value of 0 means fully stable.
  let energyAboveHull = 0;
  let stabilityStatus: "Stable" | "Metastable" | "Unstable" = "Stable";
  
  if (formationEnergy === 0) {
    energyAboveHull = 0;
    stabilityStatus = "Stable";
  } else {
    // Formulate a relative hull mapping
    // Some structures of same composition have metastable offsets (e.g. Quartz = stable = 0 eV/atom, Tridymite = 0.012, Cristobalite = 0.015)
    const lowerName = formula.toLowerCase() + " " + crystalSystem.toLowerCase();
    if (lowerName.includes("tridymite")) {
      energyAboveHull = 0.012;
      stabilityStatus = "Stable"; // Metastable but on the Materials Project cutoff (< 0.03 eV/atom)
    } else if (lowerName.includes("cristobalite")) {
      energyAboveHull = 0.015;
      stabilityStatus = "Stable";
    } else if (lowerName.includes("amorphous")) {
      energyAboveHull = 0.125;
      stabilityStatus = "Metastable";
    } else {
      // General heuristic: lower crystal symmetry has slightly higher relative energy above hull
      const symOffset = ["Triclinic", "Monoclinic"].includes(crystalSystem) ? 0.045 : ["Orthorhombic", "Tetragonal"].includes(crystalSystem) ? 0.02 : 0;
      energyAboveHull = Number(symOffset.toFixed(3));
      stabilityStatus = energyAboveHull > 0.08 ? "Metastable" : "Stable";
    }
  }

  // 7. Decomposition or Melting point (Kelvin)
  // Associated with lattice formation energy and stiffness
  let decompositionTemp = 1000;
  if (formationEnergy !== 0) {
    // More negative formation energy = higher binding energy = higher decomposition/melt temperature
    decompositionTemp = Math.round(298 + Math.abs(formationEnergy) * 550);
  } else {
    // Pure metals
    const singleEl = parsed[0]?.element || "";
    if (["W", "Re", "Ta", "Mo", "C"].includes(singleEl)) decompositionTemp = 3000;
    else if (["Fe", "Ni", "Co", "Ti", "Pt"].includes(singleEl)) decompositionTemp = 1750;
    else if (["Au", "Ag", "Cu"].includes(singleEl)) decompositionTemp = 1300;
    else if (["Al", "Mg"].includes(singleEl)) decompositionTemp = 930;
    else decompositionTemp = 1100;
  }

  return {
    formationEnthalpy,
    formationEnergy: Number(formationEnergy.toFixed(3)),
    standardEntropy: Number(standardEntropy.toFixed(2)),
    heatCapacity: Number(heatCapacity.toFixed(2)),
    debyeTemperature,
    energyAboveHull,
    stabilityStatus,
    decompositionTemp
  };
}

// Generate continuous Gibbs Free Energy & Entropy temperature range dataset for charts
export interface ThermoTemperatureSweepPoint {
  tempKelvin: number;
  tempCelsius: number;
  gibbsFreeEnergy: number; // Delta G (kJ/mol)
  entropy: number; // S(T) (J/mol-K)
  heatCapacity: number; // Cp(T) (J/mol-K)
}

export function generateTemperatureSweep(
  pkg: ThermodynamicsPackage
): ThermoTemperatureSweepPoint[] {
  const points: ThermoTemperatureSweepPoint[] = [];
  const steps = 30; // 0K to 1500K
  
  for (let i = 0; i <= steps; i++) {
    const T = i * 50; // K
    const TC = T - 273.15;
    
    // Model temperature-dependent heat capacity Cp(T) using a model (Debye solid limit)
    // At low temps (T < debye), Cp ~ T^3. At high T, Cp reaches Kopp's limit (3R per mole of atoms)
    const debyeRatio = T / (pkg.debyeTemperature || 400);
    let cpFraction = 1.0;
    if (T === 0) {
      cpFraction = 0.0;
    } else if (debyeRatio < 1) {
      // T^3 low temp regime
      cpFraction = Math.pow(debyeRatio, 3) * 0.95;
    } else {
      // Reaches Dulong-Petit asymptote asymptotically
      cpFraction = 1.0 - 0.25 / (debyeRatio * debyeRatio);
    }
    const cpT = pkg.heatCapacity * Math.min(1.2, Math.max(0.01, cpFraction));

    // Temperature dependent standard Entropy S(T)
    // S(T) = \int_0^T (Cp / T) dT. Rough approximation paired with S(298) standard input.
    let sT = 0;
    if (T === 0) {
      sT = 0; // Third law of thermodynamics! S(0) = 0 for perfect crystal
    } else if (T < 298) {
      sT = pkg.standardEntropy * Math.pow(T / 298, 1.5);
    } else {
      sT = pkg.standardEntropy + Math.log(T / 298) * pkg.heatCapacity;
    }

    // Gibbs Free Energy of formation: dG_f(T) = dH_f - T * dS_f
    // We can simplify: dG_f(T) approx H_f(298) - T * S(T)/1000 (roughly modeling formation bounds)
    const dH_f = pkg.formationEnthalpy; // kJ/mol
    // Entropy contribution to Gibbs Free Energy (convert J/K to kJ/K)
    const entropyTerm = T * (sT / 1000);
    const gibbsFreeEnergy = dH_f - entropyTerm;

    points.push({
      tempKelvin: T,
      tempCelsius: Number(TC.toFixed(1)),
      gibbsFreeEnergy: Number(gibbsFreeEnergy.toFixed(1)),
      entropy: Number(sT.toFixed(1)),
      heatCapacity: Number(cpT.toFixed(1))
    });
  }
  
  return points;
}
