/**
 * Advanced Chemical Stoichiometry & Chemical Equation Balancer Engine
 * Supports recursive bracket/parentheses expansion, hydrate formulas,
 * exact rational Gaussian matrix balancing, and multi-variable stoichiometric yield analysis.
 */

// IUPAC Standard Atomic Weights (g/mol) (CIAAW 2021/2023 Standard)
export const IUPAC_ATOMIC_WEIGHTS: Record<string, { z: number; name: string; weight: number }> = {
  H: { z: 1, name: 'Hydrogen', weight: 1.008 },
  He: { z: 2, name: 'Helium', weight: 4.0026 },
  Li: { z: 3, name: 'Lithium', weight: 6.94 },
  Be: { z: 4, name: 'Beryllium', weight: 9.0122 },
  B: { z: 5, name: 'Boron', weight: 10.81 },
  C: { z: 6, name: 'Carbon', weight: 12.011 },
  N: { z: 7, name: 'Nitrogen', weight: 14.007 },
  O: { z: 8, name: 'Oxygen', weight: 15.999 },
  F: { z: 9, name: 'Fluorine', weight: 18.998 },
  Ne: { z: 10, name: 'Neon', weight: 20.180 },
  Na: { z: 11, name: 'Sodium', weight: 22.990 },
  Mg: { z: 12, name: 'Magnesium', weight: 24.305 },
  Al: { z: 13, name: 'Aluminium', weight: 26.982 },
  Si: { z: 14, name: 'Silicon', weight: 28.085 },
  P: { z: 15, name: 'Phosphorus', weight: 30.974 },
  S: { z: 16, name: 'Sulfur', weight: 32.06 },
  Cl: { z: 17, name: 'Chlorine', weight: 35.45 },
  Ar: { z: 18, name: 'Argon', weight: 39.95 },
  K: { z: 19, name: 'Potassium', weight: 39.098 },
  Ca: { z: 20, name: 'Calcium', weight: 40.078 },
  Sc: { z: 21, name: 'Scandium', weight: 44.956 },
  Ti: { z: 22, name: 'Titanium', weight: 47.867 },
  V: { z: 23, name: 'Vanadium', weight: 50.942 },
  Cr: { z: 24, name: 'Chromium', weight: 51.996 },
  Mn: { z: 25, name: 'Manganese', weight: 54.938 },
  Fe: { z: 26, name: 'Iron', weight: 55.845 },
  Co: { z: 27, name: 'Cobalt', weight: 58.933 },
  Ni: { z: 28, name: 'Nickel', weight: 58.693 },
  Cu: { z: 29, name: 'Copper', weight: 63.546 },
  Zn: { z: 30, name: 'Zinc', weight: 65.38 },
  Ga: { z: 31, name: 'Gallium', weight: 69.723 },
  Ge: { z: 32, name: 'Germanium', weight: 72.630 },
  As: { z: 33, name: 'Arsenic', weight: 74.922 },
  Se: { z: 34, name: 'Selenium', weight: 78.971 },
  Br: { z: 35, name: 'Bromine', weight: 79.904 },
  Kr: { z: 36, name: 'Krypton', weight: 83.798 },
  Rb: { z: 37, name: 'Rubidium', weight: 85.468 },
  Sr: { z: 38, name: 'Strontium', weight: 87.62 },
  Y: { z: 39, name: 'Yttrium', weight: 88.906 },
  Zr: { z: 40, name: 'Zirconium', weight: 91.224 },
  Nb: { z: 41, name: 'Niobium', weight: 92.906 },
  Mo: { z: 42, name: 'Molybdenum', weight: 95.95 },
  Tc: { z: 43, name: 'Technetium', weight: 98.0 },
  Ru: { z: 44, name: 'Ruthenium', weight: 101.07 },
  Rh: { z: 45, name: 'Rhodium', weight: 102.91 },
  Pd: { z: 46, name: 'Palladium', weight: 106.42 },
  Ag: { z: 47, name: 'Silver', weight: 107.87 },
  Cd: { z: 48, name: 'Cadmium', weight: 112.41 },
  In: { z: 49, name: 'Indium', weight: 114.82 },
  Sn: { z: 50, name: 'Tin', weight: 118.71 },
  Sb: { z: 51, name: 'Antimony', weight: 121.76 },
  Te: { z: 52, name: 'Tellurium', weight: 127.60 },
  I: { z: 53, name: 'Iodine', weight: 126.90 },
  Xe: { z: 54, name: 'Xenon', weight: 131.29 },
  Cs: { z: 55, name: 'Caesium', weight: 132.91 },
  Ba: { z: 56, name: 'Barium', weight: 137.33 },
  La: { z: 57, name: 'Lanthanum', weight: 138.91 },
  Ce: { z: 58, name: 'Cerium', weight: 140.12 },
  Pr: { z: 59, name: 'Praseodymium', weight: 140.91 },
  Nd: { z: 60, name: 'Neodymium', weight: 144.24 },
  Pm: { z: 61, name: 'Promethium', weight: 145.0 },
  Sm: { z: 62, name: 'Samarium', weight: 150.36 },
  Eu: { z: 63, name: 'Europium', weight: 151.96 },
  Gd: { z: 64, name: 'Gadolinium', weight: 157.25 },
  Tb: { z: 65, name: 'Terbium', weight: 158.93 },
  Dy: { z: 66, name: 'Dysprosium', weight: 162.50 },
  Ho: { z: 67, name: 'Holmium', weight: 164.93 },
  Er: { z: 68, name: 'Erbium', weight: 167.26 },
  Tm: { z: 69, name: 'Thulium', weight: 168.93 },
  Yb: { z: 70, name: 'Ytterbium', weight: 173.05 },
  Lu: { z: 71, name: 'Lutetium', weight: 174.97 },
  Hf: { z: 72, name: 'Hafnium', weight: 178.49 },
  Ta: { z: 73, name: 'Tantalum', weight: 180.95 },
  W: { z: 74, name: 'Tungsten', weight: 183.84 },
  Re: { z: 75, name: 'Rhenium', weight: 186.21 },
  Os: { z: 76, name: 'Osmium', weight: 190.23 },
  Ir: { z: 77, name: 'Iridium', weight: 192.22 },
  Pt: { z: 78, name: 'Platinum', weight: 195.08 },
  Au: { z: 79, name: 'Gold', weight: 196.97 },
  Hg: { z: 80, name: 'Mercury', weight: 200.59 },
  Tl: { z: 81, name: 'Thallium', weight: 204.38 },
  Pb: { z: 82, name: 'Lead', weight: 207.2 },
  Bi: { z: 83, name: 'Bismuth', weight: 208.98 },
  Po: { z: 84, name: 'Polonium', weight: 209.0 },
  At: { z: 85, name: 'Astatine', weight: 210.0 },
  Rn: { z: 86, name: 'Radon', weight: 222.0 },
  Fr: { z: 87, name: 'Francium', weight: 223.0 },
  Ra: { z: 88, name: 'Radium', weight: 226.0 },
  Ac: { z: 89, name: 'Actinium', weight: 227.0 },
  Th: { z: 90, name: 'Thorium', weight: 232.04 },
  Pa: { z: 91, name: 'Protactinium', weight: 231.04 },
  U: { z: 92, name: 'Uranium', weight: 238.03 },
  Np: { z: 93, name: 'Neptunium', weight: 237.0 },
  Pu: { z: 94, name: 'Plutonium', weight: 244.0 },
  Am: { z: 95, name: 'Americium', weight: 243.0 },
  Cm: { z: 96, name: 'Curium', weight: 247.0 },
  Bk: { z: 97, name: 'Berkelium', weight: 247.0 },
  Cf: { z: 98, name: 'Californium', weight: 251.0 },
  Es: { z: 99, name: 'Einsteinium', weight: 252.0 },
  Fm: { z: 100, name: 'Fermium', weight: 257.0 },
  Md: { z: 101, name: 'Mendelevium', weight: 258.0 },
  No: { z: 102, name: 'Nobelium', weight: 259.0 },
  Lr: { z: 103, name: 'Lawrencium', weight: 266.0 },
  Rf: { z: 104, name: 'Rutherfordium', weight: 267.0 },
  Db: { z: 105, name: 'Dubnium', weight: 268.0 },
  Sg: { z: 106, name: 'Seaborgium', weight: 269.0 },
  Bh: { z: 107, name: 'Bohrium', weight: 270.0 },
  Hs: { z: 108, name: 'Hassium', weight: 270.0 },
  Mt: { z: 109, name: 'Meitnerium', weight: 278.0 },
  Ds: { z: 110, name: 'Darmstadtium', weight: 281.0 },
  Rg: { z: 111, name: 'Roentgenium', weight: 282.0 },
  Cn: { z: 112, name: 'Copernicium', weight: 285.0 },
  Nh: { z: 113, name: 'Nihonium', weight: 286.0 },
  Fl: { z: 114, name: 'Flerovium', weight: 289.0 },
  Mc: { z: 115, name: 'Moscovium', weight: 290.0 },
  Lv: { z: 116, name: 'Livermorium', weight: 293.0 },
  Ts: { z: 117, name: 'Tennessine', weight: 294.0 },
  Og: { z: 118, name: 'Oganesson', weight: 294.0 }
};

export interface ElementalCount {
  symbol: string;
  name: string;
  z: number;
  count: number;
  atomicWeight: number;
  mass: number;
  massPercent: number;
}

export interface ParsedFormulaResult {
  valid: boolean;
  cleanFormula: string;
  formattedFormulaHtml: string;
  molarMass: number;
  elements: ElementalCount[];
  totalAtoms: number;
  elementCounts: Record<string, number>;
  error?: string;
}

/**
 * Parses any chemical formula supporting:
 * - Simple: H2O, NaCl, CO2, Fe2O3
 * - Nested parentheses/brackets: Ca(OH)2, Fe2(SO4)3, [Cu(NH3)4]SO4, (NH4)2Cr2O7
 * - Hydrates with dot: CuSO4.5H2O, FeSO4*7H2O, Na2CO3·10H2O
 * - Fractional stoichiometry: YBa2Cu3O6.95, Fe0.94O
 */
export function parseChemicalFormulaAdvanced(
  rawFormula: string,
  customWeights?: Record<string, number>
): ParsedFormulaResult {
  const weightsMap = customWeights || {};
  const getWeight = (sym: string): number => {
    if (weightsMap[sym] !== undefined && weightsMap[sym] > 0) return weightsMap[sym];
    return IUPAC_ATOMIC_WEIGHTS[sym]?.weight || 0;
  };

  const getElementMeta = (sym: string) => {
    return IUPAC_ATOMIC_WEIGHTS[sym] || { z: 0, name: sym, weight: getWeight(sym) };
  };

  try {
    let formula = rawFormula.trim().replace(/\s+/g, '');
    if (!formula) {
      return {
        valid: false,
        cleanFormula: '',
        formattedFormulaHtml: '',
        molarMass: 0,
        elements: [],
        totalAtoms: 0,
        elementCounts: {},
        error: 'Formula is empty'
      };
    }

    // Normalize brackets and hydrate dots
    formula = formula
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/\{/g, '(')
      .replace(/\}/g, ')')
      .replace(/[•*·]/g, '.');

    // Handle hydrate parts separated by dot
    const hydrateParts = formula.split('.');
    const combinedCounts: Record<string, number> = {};

    for (let partIdx = 0; partIdx < hydrateParts.length; partIdx++) {
      const part = hydrateParts[partIdx];
      if (!part) continue;

      let hydrateMultiplier = 1;
      let partFormula = part;

      if (partIdx > 0) {
        // May start with a multiplier, e.g., "5H2O" or "0.5H2O"
        const multMatch = part.match(/^(\d*\.?\d+)(.*)$/);
        if (multMatch && multMatch[2]) {
          hydrateMultiplier = parseFloat(multMatch[1]);
          partFormula = multMatch[2];
        }
      }

      const partCounts = parseFormulaPartRecursive(partFormula);
      if (!partCounts) {
        return {
          valid: false,
          cleanFormula: rawFormula,
          formattedFormulaHtml: rawFormula,
          molarMass: 0,
          elements: [],
          totalAtoms: 0,
          elementCounts: {},
          error: `Syntax error in formula part: ${part}`
        };
      }

      for (const [sym, count] of Object.entries(partCounts)) {
        combinedCounts[sym] = (combinedCounts[sym] || 0) + count * hydrateMultiplier;
      }
    }

    // Validate that all symbols exist in IUPAC table
    let totalMass = 0;
    let totalAtoms = 0;
    const elementsList: ElementalCount[] = [];

    for (const [sym, count] of Object.entries(combinedCounts)) {
      const meta = getElementMeta(sym);
      const aw = meta.weight || getWeight(sym);
      if (aw === 0) {
        return {
          valid: false,
          cleanFormula: rawFormula,
          formattedFormulaHtml: rawFormula,
          molarMass: 0,
          elements: [],
          totalAtoms: 0,
          elementCounts: {},
          error: `Unknown element symbol: "${sym}"`
        };
      }
      const mass = count * aw;
      totalMass += mass;
      totalAtoms += count;
    }

    for (const [sym, count] of Object.entries(combinedCounts)) {
      const meta = getElementMeta(sym);
      const aw = meta.weight || getWeight(sym);
      const mass = count * aw;
      elementsList.push({
        symbol: sym,
        name: meta.name,
        z: meta.z,
        count,
        atomicWeight: aw,
        mass,
        massPercent: totalMass > 0 ? (mass / totalMass) * 100 : 0
      });
    }

    elementsList.sort((a, b) => b.massPercent - a.massPercent);

    // Format formula with HTML subscripts
    const formattedHtml = rawFormula
      .replace(/(\d+\.?\d*)/g, '<sub>$1</sub>')
      .replace(/([•*·])/g, '·');

    return {
      valid: true,
      cleanFormula: formula,
      formattedFormulaHtml: formattedHtml,
      molarMass: totalMass,
      elements: elementsList,
      totalAtoms,
      elementCounts: combinedCounts
    };
  } catch (err: any) {
    return {
      valid: false,
      cleanFormula: rawFormula,
      formattedFormulaHtml: rawFormula,
      molarMass: 0,
      elements: [],
      totalAtoms: 0,
      elementCounts: {},
      error: err?.message || 'Failed to parse formula'
    };
  }
}

function parseFormulaPartRecursive(str: string): Record<string, number> | null {
  const counts: Record<string, number> = {};
  let i = 0;
  const n = str.length;

  while (i < n) {
    if (str[i] === '(') {
      // Find matching closing parenthesis
      let depth = 1;
      let j = i + 1;
      while (j < n && depth > 0) {
        if (str[j] === '(') depth++;
        else if (str[j] === ')') depth--;
        j++;
      }
      if (depth !== 0) return null; // Unbalanced

      const innerStr = str.substring(i + 1, j - 1);
      const innerCounts = parseFormulaPartRecursive(innerStr);
      if (!innerCounts) return null;

      // Check multiplier after parenthesis
      let multiplier = 1;
      let k = j;
      const numMatch = str.substring(k).match(/^(\d*\.?\d+)/);
      if (numMatch) {
        multiplier = parseFloat(numMatch[1]);
        k += numMatch[1].length;
      }

      for (const [sym, count] of Object.entries(innerCounts)) {
        counts[sym] = (counts[sym] || 0) + count * multiplier;
      }
      i = k;
    } else if (/[A-Z]/.test(str[i])) {
      // Match element symbol: uppercase followed by optional lowercase
      let sym = str[i];
      i++;
      if (i < n && /[a-z]/.test(str[i])) {
        sym += str[i];
        i++;
      }

      // Check for numeric count
      let count = 1;
      const numMatch = str.substring(i).match(/^(\d*\.?\d+)/);
      if (numMatch) {
        count = parseFloat(numMatch[1]);
        i += numMatch[1].length;
      }

      counts[sym] = (counts[sym] || 0) + count;
    } else {
      // Invalid character
      return null;
    }
  }

  return counts;
}

export interface ReactionSpecies {
  formula: string;
  coefficient: number;
  parsed: ParsedFormulaResult;
}

export interface BalancedEquationResult {
  valid: boolean;
  rawInput: string;
  reactants: ReactionSpecies[];
  products: ReactionSpecies[];
  balancedEquationString: string;
  isAlreadyBalanced: boolean;
  error?: string;
}

/**
 * Exact Rational Arithmetic Gaussian Balancer
 */
class Fraction {
  num: number;
  den: number;

  constructor(n: number, d: number = 1) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = Fraction.gcd(Math.abs(Math.round(n)), Math.abs(Math.round(d)));
    this.num = Math.round(n / (g || 1));
    this.den = Math.round(d / (g || 1));
  }

  static gcd(a: number, b: number): number {
    return b === 0 ? a : Fraction.gcd(b, a % b);
  }

  static lcm(a: number, b: number): number {
    return (a * b) / Fraction.gcd(a, b);
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  isZero(): boolean {
    return this.num === 0;
  }
}

/**
 * Balances chemical equations automatically using Gaussian Nullspace Elimination
 * Example inputs:
 * "H2 + O2 -> H2O"
 * "Fe2O3 + CO -> Fe + CO2"
 * "Al + HCl -> AlCl3 + H2"
 * "Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O"
 */
export function balanceChemicalEquation(equationStr: string): BalancedEquationResult {
  try {
    const raw = equationStr.trim();
    if (!raw) {
      return {
        valid: false,
        rawInput: raw,
        reactants: [],
        products: [],
        balancedEquationString: '',
        isAlreadyBalanced: false,
        error: 'Please enter a chemical equation (e.g., Fe2O3 + CO -> Fe + CO2)'
      };
    }

    // Split sides by arrow
    const arrowRegex = /->|=>|⇌|<->|-->|=/;
    const sides = raw.split(arrowRegex);
    if (sides.length !== 2) {
      return {
        valid: false,
        rawInput: raw,
        reactants: [],
        products: [],
        balancedEquationString: '',
        isAlreadyBalanced: false,
        error: 'Equation must contain an arrow "->" separating reactants and products.'
      };
    }

    const parseSide = (sideStr: string) => {
      const terms = sideStr.split('+');
      const speciesList: { rawCoeff: number; formula: string }[] = [];
      for (const term of terms) {
        const trimmed = term.trim();
        if (!trimmed) continue;
        const match = trimmed.match(/^(\d*\.?\d*)\s*(.+)$/);
        let coeff = 1;
        let formula = trimmed;
        if (match && match[1]) {
          coeff = parseFloat(match[1]) || 1;
          formula = match[2].trim();
        }
        speciesList.push({ rawCoeff: coeff, formula });
      }
      return speciesList;
    };

    const rawReactants = parseSide(sides[0]);
    const rawProducts = parseSide(sides[1]);

    if (rawReactants.length === 0 || rawProducts.length === 0) {
      return {
        valid: false,
        rawInput: raw,
        reactants: [],
        products: [],
        balancedEquationString: '',
        isAlreadyBalanced: false,
        error: 'Reactants and products must not be empty.'
      };
    }

    // Parse all species formulas
    const parsedReactants = rawReactants.map(r => ({
      formula: r.formula,
      rawCoeff: r.rawCoeff,
      parsed: parseChemicalFormulaAdvanced(r.formula)
    }));

    const parsedProducts = rawProducts.map(p => ({
      formula: p.formula,
      rawCoeff: p.rawCoeff,
      parsed: parseChemicalFormulaAdvanced(p.formula)
    }));

    // Check for parse errors
    for (const r of parsedReactants) {
      if (!r.parsed.valid) {
        return {
          valid: false,
          rawInput: raw,
          reactants: [],
          products: [],
          balancedEquationString: '',
          isAlreadyBalanced: false,
          error: `Error in reactant "${r.formula}": ${r.parsed.error}`
        };
      }
    }
    for (const p of parsedProducts) {
      if (!p.parsed.valid) {
        return {
          valid: false,
          rawInput: raw,
          reactants: [],
          products: [],
          balancedEquationString: '',
          isAlreadyBalanced: false,
          error: `Error in product "${p.formula}": ${p.parsed.error}`
        };
      }
    }

    // Collect all unique elements
    const elementSet = new Set<string>();
    parsedReactants.forEach(r => Object.keys(r.parsed.elementCounts).forEach(e => elementSet.add(e)));
    parsedProducts.forEach(p => Object.keys(p.parsed.elementCounts).forEach(e => elementSet.add(e)));
    const elements = Array.from(elementSet);

    // Verify all reactant elements appear in products and vice versa
    const reactantElements = new Set<string>();
    parsedReactants.forEach(r => Object.keys(r.parsed.elementCounts).forEach(e => reactantElements.add(e)));
    const productElements = new Set<string>();
    parsedProducts.forEach(p => Object.keys(p.parsed.elementCounts).forEach(e => productElements.add(e)));

    for (const el of reactantElements) {
      if (!productElements.has(el)) {
        return {
          valid: false,
          rawInput: raw,
          reactants: [],
          products: [],
          balancedEquationString: '',
          isAlreadyBalanced: false,
          error: `Element "${el}" appears in reactants but not in products.`
        };
      }
    }
    for (const el of productElements) {
      if (!reactantElements.has(el)) {
        return {
          valid: false,
          rawInput: raw,
          reactants: [],
          products: [],
          balancedEquationString: '',
          isAlreadyBalanced: false,
          error: `Element "${el}" appears in products but not in reactants.`
        };
      }
    }

    // Build the Stoichiometric Matrix A of size (numElements x numSpecies)
    // Reactants have +count, Products have -count (A * x = 0)
    const numSpecies = parsedReactants.length + parsedProducts.length;
    const numElements = elements.length;

    const matrix: Fraction[][] = [];
    for (let i = 0; i < numElements; i++) {
      const el = elements[i];
      const row: Fraction[] = [];
      for (const r of parsedReactants) {
        row.push(new Fraction(r.parsed.elementCounts[el] || 0));
      }
      for (const p of parsedProducts) {
        row.push(new Fraction(-(p.parsed.elementCounts[el] || 0)));
      }
      matrix.push(row);
    }

    // Solve for Nullspace of matrix using Reduced Row Echelon Form (RREF)
    let lead = 0;
    const rowCount = matrix.length;
    const colCount = numSpecies;

    for (let r = 0; r < rowCount; r++) {
      if (colCount <= lead) break;
      let i = r;
      while (matrix[i][lead].isZero()) {
        i++;
        if (rowCount === i) {
          i = r;
          lead++;
          if (colCount === lead) break;
        }
      }
      if (colCount === lead) break;

      // Swap rows
      const temp = matrix[i];
      matrix[i] = matrix[r];
      matrix[r] = temp;

      // Normalize pivot
      const val = matrix[r][lead];
      for (let j = 0; j < colCount; j++) {
        matrix[r][j] = matrix[r][j].div(val);
      }

      // Eliminate column
      for (let j = 0; j < rowCount; j++) {
        if (j !== r) {
          const factor = matrix[j][lead];
          if (!factor.isZero()) {
            for (let k = 0; k < colCount; k++) {
              matrix[j][k] = matrix[j][k].sub(factor.mul(matrix[r][k]));
            }
          }
        }
      }
      lead++;
    }

    // Assign free variable (last column = 1)
    const solution: Fraction[] = new Array(numSpecies).fill(null).map(() => new Fraction(0));
    solution[numSpecies - 1] = new Fraction(1);

    for (let r = rowCount - 1; r >= 0; r--) {
      // Find pivot index
      let pivotCol = -1;
      for (let c = 0; c < colCount; c++) {
        if (!matrix[r][c].isZero()) {
          pivotCol = c;
          break;
        }
      }
      if (pivotCol !== -1 && pivotCol < numSpecies - 1) {
        let sum = new Fraction(0);
        for (let c = pivotCol + 1; c < numSpecies; c++) {
          sum = sum.add(matrix[r][c].mul(solution[c]));
        }
        solution[pivotCol] = new Fraction(0).sub(sum);
      }
    }

    // Find Least Common Multiple of all denominators to obtain integers
    let lcmDen = 1;
    for (const f of solution) {
      if (f.den > 0) {
        lcmDen = Fraction.lcm(lcmDen, f.den);
      }
    }

    let intCoeffs = solution.map(f => Math.round(f.num * (lcmDen / f.den)));

    // Ensure all coefficients are positive
    if (intCoeffs.some(c => c <= 0)) {
      // Fallback: If nullspace had positive linear combination or alternate vector
      // Let's test standard least positive integer multiplier
      const isNegative = intCoeffs.every(c => c <= 0);
      if (isNegative) {
        intCoeffs = intCoeffs.map(c => Math.abs(c));
      } else {
        // Try absolute values if valid
        intCoeffs = intCoeffs.map(c => (c === 0 ? 1 : Math.abs(c)));
      }
    }

    // Divide by overall GCD of all coefficients
    let overallGcd = intCoeffs[0];
    for (let i = 1; i < intCoeffs.length; i++) {
      overallGcd = Fraction.gcd(overallGcd, intCoeffs[i]);
    }
    if (overallGcd > 1) {
      intCoeffs = intCoeffs.map(c => c / overallGcd);
    }

    // Build final balanced species
    const reactants: ReactionSpecies[] = [];
    const products: ReactionSpecies[] = [];

    let idx = 0;
    for (const r of parsedReactants) {
      const coeff = intCoeffs[idx] || 1;
      reactants.push({
        formula: r.formula,
        coefficient: coeff,
        parsed: r.parsed
      });
      idx++;
    }

    for (const p of parsedProducts) {
      const coeff = intCoeffs[idx] || 1;
      products.push({
        formula: p.formula,
        coefficient: coeff,
        parsed: p.parsed
      });
      idx++;
    }

    const formatSide = (list: ReactionSpecies[]) =>
      list.map(s => (s.coefficient > 1 ? `${s.coefficient} ` : '') + s.formula).join(' + ');

    const balancedEquationString = `${formatSide(reactants)} ➔ ${formatSide(products)}`;

    // Verify balance
    const reactantAtoms: Record<string, number> = {};
    const productAtoms: Record<string, number> = {};

    reactants.forEach(r => {
      Object.entries(r.parsed.elementCounts).forEach(([el, cnt]) => {
        reactantAtoms[el] = (reactantAtoms[el] || 0) + cnt * r.coefficient;
      });
    });
    products.forEach(p => {
      Object.entries(p.parsed.elementCounts).forEach(([el, cnt]) => {
        productAtoms[el] = (productAtoms[el] || 0) + cnt * p.coefficient;
      });
    });

    let isBalanced = true;
    for (const el of elements) {
      if (reactantAtoms[el] !== productAtoms[el]) {
        isBalanced = false;
        break;
      }
    }

    return {
      valid: isBalanced,
      rawInput: raw,
      reactants,
      products,
      balancedEquationString,
      isAlreadyBalanced: false,
      error: isBalanced ? undefined : 'Could not mathematically balance this reaction.'
    };
  } catch (err: any) {
    return {
      valid: false,
      rawInput: equationStr,
      reactants: [],
      products: [],
      balancedEquationString: '',
      isAlreadyBalanced: false,
      error: err?.message || 'Balancing failed'
    };
  }
}

/**
 * Limiting Reactant & Theoretical Yield Calculation
 */
export interface SpeciesQuantityInput {
  speciesIndex: number;
  speciesFormula: string;
  isReactant: boolean;
  valueStr: string;
  unit: 'mol' | 'mmol' | 'g' | 'mg' | 'kg' | 'L_STP' | 'mL_STP' | 'sol_MV';
  molarity?: number; // for solution (mol/L)
  solutionVolumeL?: number; // for solution
}

export interface YieldAnalysisResult {
  limitingReactantIndex: number | null;
  limitingReactantFormula: string;
  maxReactionExtentMoles: number; // xi_max (moles of reaction)
  actualYieldPercent: number; // 0 - 100%
  reactantsTable: {
    formula: string;
    coefficient: number;
    initialMoles: number;
    initialMassG: number;
    consumedMoles: number;
    consumedMassG: number;
    remainingMoles: number;
    remainingMassG: number;
    percentExcess: number;
    isLimiting: boolean;
  }[];
  productsTable: {
    formula: string;
    coefficient: number;
    theoreticalMoles: number;
    theoreticalMassG: number;
    theoreticalVolumeL_STP: number;
    actualMoles: number;
    actualMassG: number;
    actualVolumeL_STP: number;
  }[];
  totalInitialReactantMassG: number;
  totalFinalSystemMassG: number;
  massConservationDeltaG: number;
}

export function computeReactionStoichiometry(
  reactants: ReactionSpecies[],
  products: ReactionSpecies[],
  inputs: Record<string, SpeciesQuantityInput>, // key: reactant formula or index
  actualYieldPercent: number = 100,
  gasMolarVolumeL: number = 22.710955 // IUPAC STP default
): YieldAnalysisResult {
  // Convert all initial reactant quantities into Moles
  const initialReactantMoles: number[] = reactants.map((r, i) => {
    const input = inputs[r.formula] || inputs[`r_${i}`];
    if (!input) return 0;
    const val = parseFloat(input.valueStr) || 0;
    if (val <= 0) return 0;

    switch (input.unit) {
      case 'mol':
        return val;
      case 'mmol':
        return val / 1000;
      case 'g':
        return val / (r.parsed.molarMass || 1);
      case 'mg':
        return val / 1000 / (r.parsed.molarMass || 1);
      case 'kg':
        return (val * 1000) / (r.parsed.molarMass || 1);
      case 'L_STP':
        return val / gasMolarVolumeL;
      case 'mL_STP':
        return val / 1000 / gasMolarVolumeL;
      case 'sol_MV':
        return (input.molarity || 0) * (input.solutionVolumeL || 0);
      default:
        return val;
    }
  });

  // Calculate extent of reaction capacity for each reactant: xi_i = n_i / nu_i
  let minXi = Infinity;
  let limitingIdx: number | null = null;

  reactants.forEach((r, i) => {
    const n = initialReactantMoles[i];
    if (n > 0) {
      const xi = n / r.coefficient;
      if (xi < minXi) {
        minXi = xi;
        limitingIdx = i;
      }
    }
  });

  if (minXi === Infinity) {
    minXi = 0;
  }

  const xiMax = minXi;
  const yieldFraction = Math.max(0, Math.min(1.0, actualYieldPercent / 100));

  // Compute Reactants Table
  let totalInitMass = 0;
  const reactantsTable = reactants.map((r, i) => {
    const nInit = initialReactantMoles[i];
    const mInit = nInit * r.parsed.molarMass;
    totalInitMass += mInit;

    const nConsumed = xiMax * r.coefficient;
    const mConsumed = nConsumed * r.parsed.molarMass;
    const nRemaining = Math.max(0, nInit - nConsumed);
    const mRemaining = nRemaining * r.parsed.molarMass;

    const stoichiometricNeeded = limitingIdx !== null ? xiMax * r.coefficient : 0;
    const percentExcess = stoichiometricNeeded > 0 ? Math.max(0, ((nInit - stoichiometricNeeded) / stoichiometricNeeded) * 100) : 0;

    return {
      formula: r.formula,
      coefficient: r.coefficient,
      initialMoles: nInit,
      initialMassG: mInit,
      consumedMoles: nConsumed,
      consumedMassG: mConsumed,
      remainingMoles: nRemaining,
      remainingMassG: mRemaining,
      percentExcess,
      isLimiting: i === limitingIdx
    };
  });

  // Compute Products Table
  let totalProductActualMass = 0;
  const productsTable = products.map(p => {
    const nTheo = xiMax * p.coefficient;
    const mTheo = nTheo * p.parsed.molarMass;
    const vTheo = nTheo * gasMolarVolumeL;

    const nActual = nTheo * yieldFraction;
    const mActual = nActual * p.parsed.molarMass;
    const vActual = nActual * gasMolarVolumeL;

    totalProductActualMass += mActual;

    return {
      formula: p.formula,
      coefficient: p.coefficient,
      theoreticalMoles: nTheo,
      theoreticalMassG: mTheo,
      theoreticalVolumeL_STP: vTheo,
      actualMoles: nActual,
      actualMassG: mActual,
      actualVolumeL_STP: vActual
    };
  });

  const totalRemainingReactantMass = reactantsTable.reduce((sum, r) => sum + r.remainingMassG, 0);
  const totalFinalMass = totalProductActualMass + totalRemainingReactantMass;

  return {
    limitingReactantIndex: limitingIdx,
    limitingReactantFormula: limitingIdx !== null ? reactants[limitingIdx].formula : 'None',
    maxReactionExtentMoles: xiMax,
    actualYieldPercent,
    reactantsTable,
    productsTable,
    totalInitialReactantMassG: totalInitMass,
    totalFinalSystemMassG: totalFinalMass,
    massConservationDeltaG: Math.abs(totalInitMass - (reactantsTable.reduce((s, r) => s + (r.consumedMassG), 0) + totalRemainingReactantMass))
  };
}

/**
 * Pre-curated Stoichiometric Reactions Library
 */
export interface PresetReaction {
  category: 'Materials & Ceramics' | 'Semiconductors & CVD' | 'Metallurgy & Redox' | 'Inorganic & Precipitation' | 'Combustion & Energy';
  name: string;
  equation: string;
  description: string;
  defaultAmounts?: Record<string, { val: string; unit: 'g' | 'mol' | 'L_STP' }>;
}

export const PRESET_REACTIONS: PresetReaction[] = [
  // Materials & Solid-State Synthesis
  {
    category: 'Materials & Ceramics',
    name: 'YBCO High-Tc Superconductor Solid-State Synthesis',
    equation: 'Y2O3 + 4 BaCO3 + 6 CuO -> 2 YBa2Cu3O7 + 4 CO2',
    description: 'High-temperature calcination and sintering of 123-superconductor ceramic precursors.',
    defaultAmounts: { Y2O3: { val: '1.0', unit: 'mol' }, BaCO3: { val: '4.0', unit: 'mol' }, CuO: { val: '6.0', unit: 'mol' } }
  },
  {
    category: 'Materials & Ceramics',
    name: 'Barium Titanate Perovskite Synthesis',
    equation: 'BaCO3 + TiO2 -> BaTiO3 + CO2',
    description: 'Electro-ceramic solid-state reaction producing ferroelectric BaTiO3 crystals for MLCC capacitors.',
    defaultAmounts: { BaCO3: { val: '100.0', unit: 'g' }, TiO2: { val: '40.48', unit: 'g' } }
  },
  {
    category: 'Materials & Ceramics',
    name: 'Lithium Iron Phosphate (LFP) Battery Cathode',
    equation: 'Li2CO3 + 2 FePO4 -> 2 LiFePO4 + CO2',
    description: 'Solid-state precursor synthesis of olivine LiFePO4 lithium-ion cathode material.',
    defaultAmounts: { Li2CO3: { val: '36.95', unit: 'g' }, FePO4: { val: '150.82', unit: 'g' } }
  },
  // Semiconductors & CVD
  {
    category: 'Semiconductors & CVD',
    name: 'Silane Pyrolysis for Polysilicon CVD',
    equation: 'SiH4 -> Si + 2 H2',
    description: 'Chemical vapor deposition (CVD) of ultra-pure epitaxial/polycrystalline silicon thin films.',
    defaultAmounts: { SiH4: { val: '100.0', unit: 'L_STP' } }
  },
  {
    category: 'Semiconductors & CVD',
    name: 'Titanium Tetrachloride Atomic Layer Deposition (ALD)',
    equation: 'TiCl4 + 2 H2O -> TiO2 + 4 HCl',
    description: 'Vapor-phase ALD hydrolysis to deposit uniform high-k dielectric TiO2 thin layers.',
    defaultAmounts: { TiCl4: { val: '50.0', unit: 'g' }, H2O: { val: '15.0', unit: 'g' } }
  },
  // Metallurgy & Redox
  {
    category: 'Metallurgy & Redox',
    name: 'Blast Furnace Hematite Iron Smelting',
    equation: 'Fe2O3 + 3 CO -> 2 Fe + 3 CO2',
    description: 'Carbothermic reduction of iron(III) oxide with carbon monoxide in blast furnaces.',
    defaultAmounts: { Fe2O3: { val: '500.0', unit: 'g' }, CO: { val: '300.0', unit: 'g' } }
  },
  {
    category: 'Metallurgy & Redox',
    name: 'Aluminothermic Thermite Welding Reaction',
    equation: 'Fe2O3 + 2 Al -> Al2O3 + 2 Fe',
    description: 'Intensely exothermic redox reaction producing molten elemental iron at ~2500 °C.',
    defaultAmounts: { Fe2O3: { val: '159.7', unit: 'g' }, Al: { val: '54.0', unit: 'g' } }
  },
  {
    category: 'Metallurgy & Redox',
    name: 'Copper Dissolution in Nitric Acid',
    equation: 'Cu + 4 HNO3 -> Cu(NO3)2 + 2 NO2 + 2 H2O',
    description: 'Etching of copper metal releasing dense reddish-brown nitrogen dioxide gas.',
    defaultAmounts: { Cu: { val: '10.0', unit: 'g' }, HNO3: { val: '50.0', unit: 'g' } }
  },
  // Inorganic & Precipitation
  {
    category: 'Inorganic & Precipitation',
    name: 'Barium Sulfate Gravimetric Precipitation',
    equation: 'BaCl2 + Na2SO4 -> BaSO4 + 2 NaCl',
    description: 'Quantitative analytical precipitation of insoluble BaSO4 (K_sp = 1.1 × 10⁻¹⁰).',
    defaultAmounts: { BaCl2: { val: '20.8', unit: 'g' }, Na2SO4: { val: '14.2', unit: 'g' } }
  },
  {
    category: 'Inorganic & Precipitation',
    name: 'Calcium Carbonate Acid Neutralization',
    equation: 'CaCO3 + 2 HCl -> CaCl2 + H2O + CO2',
    description: 'Standard carbonate digestion generating carbon dioxide gas at STP.',
    defaultAmounts: { CaCO3: { val: '25.0', unit: 'g' }, HCl: { val: '20.0', unit: 'g' } }
  },
  // Combustion & Energy
  {
    category: 'Combustion & Energy',
    name: 'Hydrogen-Oxygen Fuel Cell Reaction',
    equation: '2 H2 + O2 -> 2 H2O',
    description: 'Clean electrochemical energy combustion releasing pure water vapor.',
    defaultAmounts: { H2: { val: '44.8', unit: 'L_STP' }, O2: { val: '22.4', unit: 'L_STP' } }
  },
  {
    category: 'Combustion & Energy',
    name: 'Methane Complete Combustion',
    equation: 'CH4 + 2 O2 -> CO2 + 2 H2O',
    description: 'Natural gas combustion producing carbon dioxide and water.',
    defaultAmounts: { CH4: { val: '16.04', unit: 'g' }, O2: { val: '64.0', unit: 'g' } }
  }
];
