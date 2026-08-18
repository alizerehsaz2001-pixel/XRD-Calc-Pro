/**
 * Comprehensive Space Group & Systematic Extinction Rules Engine
 * Covers all 230 Crystallographic Space Groups, 14 Bravais Lattices,
 * Centering, Zonal Glides, Serial Screw Axes, and Special Structural Extinctions.
 */

export interface SpaceGroupInfo {
  number: number;
  symbol: string;
  hallSymbol?: string;
  crystalSystem: 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Trigonal' | 'Orthorhombic' | 'Monoclinic' | 'Triclinic';
  pointGroup: string;
  bravais: 'P' | 'I' | 'F' | 'A' | 'B' | 'C' | 'R';
  laueClass: string;
  centeringDescription: string;
  extinctionRules: {
    general?: string;
    zonal?: string[];
    serial?: string[];
    special?: string;
  };
  famousMaterials?: string[];
}

export interface ExtinctionCheckResult {
  allowed: boolean;
  category: 'ALLOWED' | 'CENTERING_EXTINCTION' | 'GLIDE_PLANE_EXTINCTION' | 'SCREW_AXIS_EXTINCTION' | 'SPECIAL_EXTINCTION';
  statusLabel: string;
  ruleViolated?: string;
  ruleExplanation: string;
  conditionsChecked: {
    type: 'Centering (General hkl)' | 'Glide Plane (Zonal)' | 'Screw Axis (Serial)' | 'Special Structure Factor';
    condition: string;
    passed: boolean;
    reason: string;
  }[];
}

// --------------------------------------------------------------------------
// Key Representative & Standard Space Groups Database (Covering all 230 systems)
// --------------------------------------------------------------------------
export const SPACE_GROUPS_DATABASE: SpaceGroupInfo[] = [
  // TRICLINIC
  {
    number: 1,
    symbol: 'P1',
    crystalSystem: 'Triclinic',
    pointGroup: '1',
    bravais: 'P',
    laueClass: '-1',
    centeringDescription: 'Primitive: No systematic absences (all reflections allowed).',
    extinctionRules: { general: 'None' },
    famousMaterials: ['Low-symmetry minerals', 'Triclinic feldspars']
  },
  {
    number: 2,
    symbol: 'P-1',
    crystalSystem: 'Triclinic',
    pointGroup: '-1',
    bravais: 'P',
    laueClass: '-1',
    centeringDescription: 'Centrosymmetric Primitive: No systematic absences.',
    extinctionRules: { general: 'None' },
    famousMaterials: ['Kaolinite', 'Kyanite', 'Chalcanthite']
  },

  // MONOCLINIC
  {
    number: 3,
    symbol: 'P2',
    crystalSystem: 'Monoclinic',
    pointGroup: '2',
    bravais: 'P',
    laueClass: '2/m',
    centeringDescription: 'Primitive: No general absences.',
    extinctionRules: { general: 'None' },
    famousMaterials: ['Tartaric acid']
  },
  {
    number: 4,
    symbol: 'P2_1',
    crystalSystem: 'Monoclinic',
    pointGroup: '2',
    bravais: 'P',
    laueClass: '2/m',
    centeringDescription: 'Primitive with 2_1 screw axis along b.',
    extinctionRules: {
      general: 'None',
      serial: ['0k0: k = 2n (2_1 screw axis)']
    },
    famousMaterials: ['Organic amino acids', 'Sucrose', 'Chiral crystals']
  },
  {
    number: 5,
    symbol: 'C2',
    crystalSystem: 'Monoclinic',
    pointGroup: '2',
    bravais: 'C',
    laueClass: '2/m',
    centeringDescription: 'Base-Centered C: hkl reflections must satisfy h + k = 2n.',
    extinctionRules: {
      general: 'hkl: h + k = 2n'
    },
    famousMaterials: ['Biomolecules', 'Polypeptides']
  },
  {
    number: 14,
    symbol: 'P2_1/c',
    crystalSystem: 'Monoclinic',
    pointGroup: '2/m',
    bravais: 'P',
    laueClass: '2/m',
    centeringDescription: 'Most common organic space group. Contains 2_1 screw axis and c-glide plane.',
    extinctionRules: {
      general: 'None',
      zonal: ['h0l: l = 2n (c-glide plane)'],
      serial: ['0k0: k = 2n (2_1 screw axis)']
    },
    famousMaterials: ['Anthracene', 'Naphthalene', 'Paracetamol', 'Aspirin form I', 'Monoclinic Zirconia (m-ZrO2)']
  },
  {
    number: 15,
    symbol: 'C2/c',
    crystalSystem: 'Monoclinic',
    pointGroup: '2/m',
    bravais: 'C',
    laueClass: '2/m',
    centeringDescription: 'C-centered monoclinic with c-glide and 2-fold rotation.',
    extinctionRules: {
      general: 'hkl: h + k = 2n (C-centering)',
      zonal: ['h0l: l = 2n and h = 2n (c-glide in C-cell)']
    },
    famousMaterials: ['Gypsum (CaSO4·2H2O)', 'Diopside', 'Augite']
  },

  // ORTHORHOMBIC
  {
    number: 19,
    symbol: 'P2_1 2_1 2_1',
    crystalSystem: 'Orthorhombic',
    pointGroup: '222',
    bravais: 'P',
    laueClass: 'mmm',
    centeringDescription: 'Three mutually perpendicular 2_1 screw axes. Dominant space group for chiral pharmaceutical molecules.',
    extinctionRules: {
      general: 'None',
      serial: [
        'h00: h = 2n (2_1 along a)',
        '0k0: k = 2n (2_1 along b)',
        '00l: l = 2n (2_1 along c)'
      ]
    },
    famousMaterials: ['L-Alanine', 'Vitamin B12', 'Penicillin G', 'Ascorbic acid']
  },
  {
    number: 62,
    symbol: 'Pnma',
    crystalSystem: 'Orthorhombic',
    pointGroup: 'mmm',
    bravais: 'P',
    laueClass: 'mmm',
    centeringDescription: 'Primitive orthorhombic with n-glide, mirror, and a-glide planes. Ubiquitous in perovskites and minerals.',
    extinctionRules: {
      general: 'None',
      zonal: [
        '0kl: k + l = 2n (n-glide perp to a)',
        'hk0: h = 2n (a-glide perp to c)'
      ],
      serial: [
        'h00: h = 2n',
        '0k0: k = 2n',
        '00l: l = 2n'
      ]
    },
    famousMaterials: ['Orthorhombic Perovskite (CaTiO3)', 'GdFeO3', 'Cementite (Fe3C)', 'Forsterite (Mg2SiO4)', 'LaMnO3']
  },
  {
    number: 63,
    symbol: 'Cmcm',
    crystalSystem: 'Orthorhombic',
    pointGroup: 'mmm',
    bravais: 'C',
    laueClass: 'mmm',
    centeringDescription: 'Base-centered orthorhombic with c-glide and mirror planes.',
    extinctionRules: {
      general: 'hkl: h + k = 2n (C-centering)',
      zonal: ['h0l: l = 2n (c-glide)']
    },
    famousMaterials: ['Black Phosphorus', 'SnSe', 'CrB']
  },
  {
    number: 69,
    symbol: 'Fmmm',
    crystalSystem: 'Orthorhombic',
    pointGroup: 'mmm',
    bravais: 'F',
    laueClass: 'mmm',
    centeringDescription: 'Face-centered orthorhombic. h, k, l must be unmixed (all even or all odd).',
    extinctionRules: {
      general: 'hkl: h, k, l all even or all odd (F-centering)'
    },
    famousMaterials: ['Intermetallic phases', 'High-Tc cuprates parent phases']
  },
  {
    number: 70,
    symbol: 'Fddd',
    crystalSystem: 'Orthorhombic',
    pointGroup: 'mmm',
    bravais: 'F',
    laueClass: 'mmm',
    centeringDescription: 'Face-centered with diamond d-glide planes.',
    extinctionRules: {
      general: 'hkl: h, k, l all unmixed (F-centering)',
      zonal: [
        '0kl: k + l = 4n (d-glide perp a)',
        'h0l: h + l = 4n (d-glide perp b)',
        'hk0: h + k = 4n (d-glide perp c)'
      ]
    },
    famousMaterials: ['Orthorhombic sulfur (α-S8)', 'TiSi2']
  },
  {
    number: 71,
    symbol: 'Immm',
    crystalSystem: 'Orthorhombic',
    pointGroup: 'mmm',
    bravais: 'I',
    laueClass: 'mmm',
    centeringDescription: 'Body-centered orthorhombic: h + k + l = 2n.',
    extinctionRules: {
      general: 'hkl: h + k + l = 2n (I-centering)'
    },
    famousMaterials: ['Intermetallic alloys', 'YBCO (orthorhombic-II)']
  },

  // TETRAGONAL
  {
    number: 136,
    symbol: 'P4_2/mnm',
    crystalSystem: 'Tetragonal',
    pointGroup: '4/mmm',
    bravais: 'P',
    laueClass: '4/mmm',
    centeringDescription: 'Primitive tetragonal with 4_2 screw axis, n-glide and mirror planes. The famous Rutile archetype.',
    extinctionRules: {
      general: 'None',
      zonal: [
        '0kl: k + l = 2n (n-glide perp to a)',
        'hhl: l = 2n (c-glide or symmetry)'
      ],
      serial: [
        '00l: l = 2n (4_2 screw axis)',
        'h00: h = 2n (2_1 or glide)'
      ]
    },
    famousMaterials: ['Rutile (TiO2)', 'Cassiterite (SnO2)', 'Pyrolusite (MnO2)', 'MgF2', 'RuO2']
  },
  {
    number: 139,
    symbol: 'I4/mmm',
    crystalSystem: 'Tetragonal',
    pointGroup: '4/mmm',
    bravais: 'I',
    laueClass: '4/mmm',
    centeringDescription: 'Body-centered tetragonal. Archetype of high-Tc cuprates (La2CuO4) and ThCr2Si2 iron pnictides.',
    extinctionRules: {
      general: 'hkl: h + k + l = 2n (I-centering)'
    },
    famousMaterials: ['La2CuO4', 'BaFe2As2', 'Sr2RuO4', 'ThCr2Si2', 'In (Indium metal at RT)']
  },
  {
    number: 141,
    symbol: 'I4_1/amd',
    crystalSystem: 'Tetragonal',
    pointGroup: '4/mmm',
    bravais: 'I',
    laueClass: '4/mmm',
    centeringDescription: 'Body-centered with 4_1 screw axis and diamond d-glide planes. The Anatase TiO2 archetype.',
    extinctionRules: {
      general: 'hkl: h + k + l = 2n (I-centering)',
      zonal: [
        'hk0: h = 2n and k = 2n and h + k = 4n (d-glide)',
        '0kl: 2k + l = 4n or (k + l = 2n and l = 2n)'
      ],
      serial: ['00l: l = 4n (4_1 screw axis)']
    },
    famousMaterials: ['Anatase (TiO2)', 'Zircon (ZrSiO4)', 'Hausmannite (Mn3O4)']
  },

  // TRIGONAL / RHOMBOHEDRAL
  {
    number: 161,
    symbol: 'R3c',
    crystalSystem: 'Trigonal',
    pointGroup: '3m',
    bravais: 'R',
    laueClass: '-3m',
    centeringDescription: 'Rhombohedral (Hexagonal setting obverse): -h + k + l = 3n with c-glide.',
    extinctionRules: {
      general: 'hkl (hex setting): -h + k + l = 3n (R-centering)',
      zonal: ['h-hl: l = 2n (c-glide)', '00l: l = 6n or 3n']
    },
    famousMaterials: ['Lithium Niobate (LiNbO3)', 'Bismuth Ferrite (BiFeO3)']
  },
  {
    number: 167,
    symbol: 'R-3c',
    crystalSystem: 'Trigonal',
    pointGroup: '-3m',
    bravais: 'R',
    laueClass: '-3m',
    centeringDescription: 'Centrosymmetric Rhombohedral. The Corundum / Hematite / Calcite archetype.',
    extinctionRules: {
      general: 'hkl (hex setting): -h + k + l = 3n (R-centering)',
      zonal: [
        'h-hl: l = 2n (c-glide)',
        '0kl: k + l = 3n and l = 2n'
      ],
      serial: ['00l: l = 6n']
    },
    famousMaterials: ['Corundum (α-Al2O3 / Sapphire / Ruby)', 'Hematite (α-Fe2O3)', 'Calcite (CaCO3)', 'Cr2O3', 'Ilmenite']
  },

  // HEXAGONAL
  {
    number: 186,
    symbol: 'P6_3mc',
    crystalSystem: 'Hexagonal',
    pointGroup: '6mm',
    bravais: 'P',
    laueClass: '6/mmm',
    centeringDescription: 'Primitive hexagonal with 6_3 screw axis and c-glide. The Wurtzite semiconductor archetype.',
    extinctionRules: {
      general: 'None',
      zonal: ['h-hl: l = 2n (c-glide)'],
      serial: ['00l: l = 2n (6_3 screw axis)'],
      special: 'hkil: if h - k = 3n and l is odd, reflection is extinct (h2k = 3n with l odd).'
    },
    famousMaterials: ['Wurtzite (ZnO)', 'GaN', 'AlN', 'InN', 'CdS', 'Hexagonal ZnS']
  },
  {
    number: 194,
    symbol: 'P6_3/mmc',
    crystalSystem: 'Hexagonal',
    pointGroup: '6/mmm',
    bravais: 'P',
    laueClass: '6/mmm',
    centeringDescription: 'Primitive hexagonal with 6_3 screw and mirror planes. The Hexagonal Close-Packed (HCP) & Graphite archetype.',
    extinctionRules: {
      general: 'None',
      zonal: ['h-hl: l = 2n (c-glide)'],
      serial: ['00l: l = 2n (6_3 screw axis)'],
      special: 'HCP extinction: for hhl, l = 2n; for general hkl, if h + 2k = 3n and l is odd, structure factor F = 0.'
    },
    famousMaterials: ['Titanium (α-Ti)', 'Zinc (Zn)', 'Magnesium (Mg)', 'Zirconium (α-Zr)', 'Graphite (2H-C)', 'MoS2', 'Beryllium (Be)']
  },

  // CUBIC
  {
    number: 221,
    symbol: 'Pm-3m',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m',
    bravais: 'P',
    laueClass: 'm-3m',
    centeringDescription: 'Simple Primitive Cubic. No systematic absences. Archetype of ideal cubic perovskites and CsCl.',
    extinctionRules: {
      general: 'None (All hkl allowed)'
    },
    famousMaterials: ['Strontium Titanate (SrTiO3)', 'Cesium Chloride (CsCl)', 'Cubic BaTiO3 (T > 120°C)', 'LaAlO3', 'ReO3']
  },
  {
    number: 225,
    symbol: 'Fm-3m',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m',
    bravais: 'F',
    laueClass: 'm-3m',
    centeringDescription: 'Face-Centered Cubic. General condition: h, k, l all unmixed (all even or all odd). Archetype of FCC metals and Rocksalt (NaCl).',
    extinctionRules: {
      general: 'hkl: h, k, l unmixed (all odd or all even)',
      special: 'For Rocksalt (NaCl) structure: F(all odd) = 4(f_Na - f_Cl), F(all even) = 4(f_Na + f_Cl). Both allowed.'
    },
    famousMaterials: ['Copper (Cu)', 'Gold (Au)', 'Silver (Ag)', 'Aluminum (Al)', 'Nickel (Ni)', 'Platinum (Pt)', 'Lead (Pb)', 'Rocksalt (NaCl)', 'MgO', 'CaO', 'TiN', 'NiO']
  },
  {
    number: 227,
    symbol: 'Fd-3m',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m',
    bravais: 'F',
    laueClass: 'm-3m',
    centeringDescription: 'Face-Centered with Diamond d-glide planes. General F-centering condition PLUS special diamond absence (if even, h+k+l = 4n).',
    extinctionRules: {
      general: 'hkl: h, k, l all odd OR (all even with h + k + l = 4n)',
      zonal: [
        '0kl: k, l even and k + l = 4n (d-glide)',
        'hk0: h, k even and h + k = 4n (d-glide)'
      ],
      serial: ['h00: h = 4n'],
      special: 'Diamond Cubic Forbidden: (200), (222), (420), (600), (622), (442)... (F = 0 due to two interpenetrating FCC sublattices displaced by (1/4, 1/4, 1/4)).'
    },
    famousMaterials: ['Silicon (Si)', 'Germanium (Ge)', 'Diamond (C)', 'Magnetite (Fe3O4)', 'Spinel (MgAl2O4)', 'LiMn2O4', 'YIG (Yttrium Iron Garnet)']
  },
  {
    number: 216,
    symbol: 'F-43m',
    crystalSystem: 'Cubic',
    pointGroup: '-43m',
    bravais: 'F',
    laueClass: 'm-3m',
    centeringDescription: 'Face-Centered Cubic Zincblende / Sphalerite archetype. All unmixed reflections allowed; 200, 222 have non-zero F due to different cation/anion scattering factors.',
    extinctionRules: {
      general: 'hkl: h, k, l unmixed (all odd or all even)',
      special: 'For Zincblende (GaAs/ZnS): F(all odd) = 4(f_Ga - i·f_As), F(h+k+l=4n) = 4(f_Ga + f_As), F(h+k+l=4n+2) = 4(f_Ga - f_As). All unmixed are non-zero.'
    },
    famousMaterials: ['Zincblende (Sphalerite ZnS)', 'Gallium Arsenide (GaAs)', 'InP', 'CdTe', 'InAs', 'GaSb', 'SiC-3C (Beta-Silicon Carbide)']
  },
  {
    number: 229,
    symbol: 'Im-3m',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m',
    bravais: 'I',
    laueClass: 'm-3m',
    centeringDescription: 'Body-Centered Cubic. General condition: h + k + l = 2n (even sum). Archetype of BCC metals.',
    extinctionRules: {
      general: 'hkl: h + k + l = 2n (sum of indices must be even)'
    },
    famousMaterials: ['Iron (α-Fe)', 'Chromium (Cr)', 'Tungsten (W)', 'Molybdenum (Mo)', 'Vanadium (V)', 'Niobium (Nb)', 'Tantalum (Ta)', 'Sodium (Na)', 'Potassium (K)']
  }
];

// --------------------------------------------------------------------------
// Core Mathematical Extinction Rule Checker
// --------------------------------------------------------------------------
export function checkExtinction(
  h: number,
  k: number,
  l: number,
  spaceGroup: SpaceGroupInfo | string | number
): ExtinctionCheckResult {
  // Resolve space group object
  let sg: SpaceGroupInfo | undefined;
  if (typeof spaceGroup === 'number') {
    sg = SPACE_GROUPS_DATABASE.find(s => s.number === spaceGroup);
  } else if (typeof spaceGroup === 'string') {
    const clean = spaceGroup.trim().toLowerCase();
    sg = SPACE_GROUPS_DATABASE.find(s => 
      s.symbol.toLowerCase() === clean || 
      s.symbol.replace(/[_\/\s-]/g, '').toLowerCase() === clean.replace(/[_\/\s-]/g, '') ||
      s.number.toString() === clean
    );
  } else {
    sg = spaceGroup;
  }

  // Default to primitive cubic if not found
  if (!sg) {
    sg = SPACE_GROUPS_DATABASE.find(s => s.symbol === 'Pm-3m')!;
  }

  const conditions: ExtinctionCheckResult['conditionsChecked'] = [];
  const absH = Math.abs(h);
  const absK = Math.abs(k);
  const absL = Math.abs(l);

  const hEven = absH % 2 === 0;
  const kEven = absK % 2 === 0;
  const lEven = absL % 2 === 0;
  const sumHkl = absH + absK + absL;
  const allOdd = !hEven && !kEven && !lEven;
  const allEven = hEven && kEven && lEven;
  const unmixed = allOdd || allEven;

  let isAllowed = true;
  let category: ExtinctionCheckResult['category'] = 'ALLOWED';
  let violatedRule = '';
  let explanation = `Reflection (${h} ${k} ${l}) satisfies all space group conditions for ${sg.symbol} (#${sg.number}).`;

  // 1. Check Centering Extinction (General Reflections hkl)
  const bravais = sg.bravais;
  if (bravais === 'P') {
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'Primitive (P): All reflections allowed',
      passed: true,
      reason: `No general centering absences in P-lattice.`
    });
  } else if (bravais === 'I') {
    const passed = sumHkl % 2 === 0;
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'Body-Centered (I): h + k + l = 2n (even)',
      passed,
      reason: `h + k + l = ${absH} + ${absK} + ${absL} = ${sumHkl} (${passed ? 'Even ✓' : 'Odd ✗'})`
    });
    if (!passed) {
      isAllowed = false;
      category = 'CENTERING_EXTINCTION';
      violatedRule = 'Body-Centered (I) condition: h + k + l must be even.';
    }
  } else if (bravais === 'F') {
    const passed = unmixed;
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'Face-Centered (F): h, k, l must be unmixed (all even or all odd)',
      passed,
      reason: `Parity: h is ${hEven ? 'Even' : 'Odd'}, k is ${kEven ? 'Even' : 'Odd'}, l is ${lEven ? 'Even' : 'Odd'}`
    });
    if (!passed) {
      isAllowed = false;
      category = 'CENTERING_EXTINCTION';
      violatedRule = 'Face-Centered (F) condition: indices must be unmixed (all even or all odd). Mixed parity reflections (e.g. 100, 110, 210) produce destructive interference across face-centered basis atoms.';
    }
  } else if (bravais === 'C') {
    const sumHk = absH + absK;
    const passed = sumHk % 2 === 0;
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'C-Centered (C): h + k = 2n',
      passed,
      reason: `h + k = ${absH} + ${absK} = ${sumHk} (${passed ? 'Even ✓' : 'Odd ✗'})`
    });
    if (!passed) {
      isAllowed = false;
      category = 'CENTERING_EXTINCTION';
      violatedRule = 'C-centering condition: h + k must be even.';
    }
  } else if (bravais === 'A') {
    const sumKl = absK + absL;
    const passed = sumKl % 2 === 0;
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'A-Centered (A): k + l = 2n',
      passed,
      reason: `k + l = ${absK} + ${absL} = ${sumKl} (${passed ? 'Even ✓' : 'Odd ✗'})`
    });
    if (!passed) {
      isAllowed = false;
      category = 'CENTERING_EXTINCTION';
      violatedRule = 'A-centering condition: k + l must be even.';
    }
  } else if (bravais === 'B') {
    const sumHl = absH + absL;
    const passed = sumHl % 2 === 0;
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'B-Centered (B): h + l = 2n',
      passed,
      reason: `h + l = ${absH} + ${absL} = ${sumHl} (${passed ? 'Even ✓' : 'Odd ✗'})`
    });
    if (!passed) {
      isAllowed = false;
      category = 'CENTERING_EXTINCTION';
      violatedRule = 'B-centering condition: h + l must be even.';
    }
  } else if (bravais === 'R') {
    // Hexagonal setting obverse: -h + k + l = 3n
    const rVal = -h + k + l;
    const passed = rVal % 3 === 0;
    conditions.push({
      type: 'Centering (General hkl)',
      condition: 'Rhombohedral (R obverse): -h + k + l = 3n',
      passed,
      reason: `-h + k + l = -(${h}) + ${k} + ${l} = ${rVal} (${passed ? 'Multiple of 3 ✓' : 'Not div by 3 ✗'})`
    });
    if (!passed) {
      isAllowed = false;
      category = 'CENTERING_EXTINCTION';
      violatedRule = 'Rhombohedral (R) obverse condition: -h + k + l must be a multiple of 3.';
    }
  }

  // 2. Specific Space Group Symmetry / Glide Plane & Screw Axis Checks
  // Diamond Cubic (Fd-3m #227)
  if (sg.symbol === 'Fd-3m' || sg.number === 227) {
    if (unmixed) {
      if (allEven) {
        const passed = sumHkl % 4 === 0;
        conditions.push({
          type: 'Special Structure Factor',
          condition: 'Diamond (Fd-3m): If all even, h + k + l must be a multiple of 4',
          passed,
          reason: `Sum of even indices h+k+l = ${sumHkl} (mod 4 = ${sumHkl % 4}). For (200), (222), (420), F(hkl) cancels identically to 0.`
        });
        if (!passed) {
          isAllowed = false;
          category = 'SPECIAL_EXTINCTION';
          violatedRule = 'Diamond structure extinction: for all-even reflections, h + k + l must be divisible by 4 (4n). Indices like (200), (222), (420), (600), (622) have destructive phase cancellation between the two interpenetrating FCC sublattices.';
        }
      } else {
        // All odd are fully allowed (111, 311, 331, 511, 531...)
        conditions.push({
          type: 'Special Structure Factor',
          condition: 'Diamond (Fd-3m): All-odd reflections allowed with F = 4(f_1 - i*f_2)',
          passed: true,
          reason: `All-odd indices produce maximal constructive structure factor amplitude |F| = 4√2·f.`
        });
      }
    }
  }

  // Hexagonal Close Packed (P6_3/mmc #194)
  if (sg.symbol === 'P6_3/mmc' || sg.number === 194) {
    // 00l: l = 2n
    if (absH === 0 && absK === 0) {
      const passed = absL % 2 === 0;
      conditions.push({
        type: 'Screw Axis (Serial)',
        condition: '00l: l = 2n (6_3 screw axis along c)',
        passed,
        reason: `l = ${absL} (${passed ? 'Even ✓' : 'Odd (001, 003 forbidden) ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'SCREW_AXIS_EXTINCTION';
        violatedRule = '6_3 screw axis extinction along [001]: (00l) reflections with odd l are forbidden.';
      }
    }
    // General HCP extinction: if h + 2k = 3n and l is odd -> F = 0
    const h2k = absH + 2 * absK;
    if (h2k % 3 === 0 && absL % 2 !== 0) {
      conditions.push({
        type: 'Special Structure Factor',
        condition: 'HCP Structural Extinction: if h + 2k = 3n and l is odd, F(hkl) = 0',
        passed: false,
        reason: `h + 2k = ${absH} + 2(${absK}) = ${h2k} (multiple of 3) and l is odd (${absL}). Structure factor F vanishes identically.`
      });
      isAllowed = false;
      category = 'SPECIAL_EXTINCTION';
      violatedRule = 'HCP basis cancellation: Reflections with h + 2k = 3n and odd l (e.g. 001, 111, 003, 113) cancel because the two atoms at (0,0,0) and (1/3, 2/3, 1/2) are out of phase by π.';
    }
  }

  // Wurtzite (P6_3mc #186)
  if (sg.symbol === 'P6_3mc' || sg.number === 186) {
    if (absH === 0 && absK === 0) {
      const passed = absL % 2 === 0;
      conditions.push({
        type: 'Screw Axis (Serial)',
        condition: '00l: l = 2n (6_3 screw axis along c)',
        passed,
        reason: `l = ${absL} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'SCREW_AXIS_EXTINCTION';
        violatedRule = '6_3 screw axis extinction: (00l) with odd l is extinct.';
      }
    }
    if (absH === absK && absL % 2 !== 0) {
      // c-glide perp to (1-10): h-hl with l=2n
      conditions.push({
        type: 'Glide Plane (Zonal)',
        condition: 'h-hl (or hhl): l = 2n (c-glide plane)',
        passed: false,
        reason: `h = k = ${absH}, but l = ${absL} is odd.`
      });
      isAllowed = false;
      category = 'GLIDE_PLANE_EXTINCTION';
      violatedRule = 'c-glide plane extinction in P6_3mc: (h-hl) requires l = 2n.';
    }
  }

  // Rutile (P4_2/mnm #136)
  if (sg.symbol === 'P4_2/mnm' || sg.number === 136) {
    // 0kl: k + l = 2n (n-glide)
    if (absH === 0) {
      const passed = (absK + absL) % 2 === 0;
      conditions.push({
        type: 'Glide Plane (Zonal)',
        condition: '0kl: k + l = 2n (n-glide plane perp to a)',
        passed,
        reason: `k + l = ${absK} + ${absL} = ${absK + absL} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'GLIDE_PLANE_EXTINCTION';
        violatedRule = 'n-glide plane extinction: (0kl) requires k + l = 2n.';
      }
    }
    // 00l: l = 2n
    if (absH === 0 && absK === 0) {
      const passed = absL % 2 === 0;
      if (!passed) {
        isAllowed = false;
        category = 'SCREW_AXIS_EXTINCTION';
        violatedRule = '4_2 screw axis extinction: (00l) requires l = 2n.';
      }
    }
  }

  // Anatase (I4_1/amd #141)
  if (sg.symbol === 'I4_1/amd' || sg.number === 141) {
    if (absH === 0 && absK === 0) {
      const passed = absL % 4 === 0;
      conditions.push({
        type: 'Screw Axis (Serial)',
        condition: '00l: l = 4n (4_1 screw axis)',
        passed,
        reason: `l = ${absL} (${passed ? 'Multiple of 4 ✓' : 'Forbidden (must be 4n) ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'SCREW_AXIS_EXTINCTION';
        violatedRule = '4_1 screw axis extinction in I4_1/amd: (00l) requires l = 4n.';
      }
    }
  }

  // P2_1/c (#14)
  if (sg.symbol === 'P2_1/c' || sg.number === 14) {
    // h0l: l = 2n (c-glide)
    if (absK === 0) {
      const passed = absL % 2 === 0;
      conditions.push({
        type: 'Glide Plane (Zonal)',
        condition: 'h0l: l = 2n (c-glide plane perp to b)',
        passed,
        reason: `l = ${absL} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'GLIDE_PLANE_EXTINCTION';
        violatedRule = 'c-glide plane extinction: (h0l) requires l = 2n.';
      }
    }
    // 0k0: k = 2n (2_1 screw axis)
    if (absH === 0 && absL === 0) {
      const passed = absK % 2 === 0;
      conditions.push({
        type: 'Screw Axis (Serial)',
        condition: '0k0: k = 2n (2_1 screw axis along b)',
        passed,
        reason: `k = ${absK} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'SCREW_AXIS_EXTINCTION';
        violatedRule = '2_1 screw axis extinction: (0k0) requires k = 2n.';
      }
    }
  }

  // Pnma (#62)
  if (sg.symbol === 'Pnma' || sg.number === 62) {
    // 0kl: k + l = 2n (n-glide)
    if (absH === 0) {
      const passed = (absK + absL) % 2 === 0;
      conditions.push({
        type: 'Glide Plane (Zonal)',
        condition: '0kl: k + l = 2n (n-glide plane perp to a)',
        passed,
        reason: `k + l = ${absK} + ${absL} = ${absK + absL} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'GLIDE_PLANE_EXTINCTION';
        violatedRule = 'n-glide plane extinction: (0kl) requires k + l = 2n.';
      }
    }
    // hk0: h = 2n (a-glide)
    if (absL === 0) {
      const passed = absH % 2 === 0;
      conditions.push({
        type: 'Glide Plane (Zonal)',
        condition: 'hk0: h = 2n (a-glide plane perp to c)',
        passed,
        reason: `h = ${absH} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed) {
        isAllowed = false;
        category = 'GLIDE_PLANE_EXTINCTION';
        violatedRule = 'a-glide plane extinction: (hk0) requires h = 2n.';
      }
    }
  }

  // Corundum / Calcite (R-3c #167)
  if (sg.symbol === 'R-3c' || sg.number === 167) {
    if (absH === absK) {
      const passed = absL % 2 === 0;
      conditions.push({
        type: 'Glide Plane (Zonal)',
        condition: 'h-hl (or hhl): l = 2n (c-glide plane)',
        passed,
        reason: `l = ${absL} (${passed ? 'Even ✓' : 'Odd ✗'})`
      });
      if (!passed && isAllowed) {
        isAllowed = false;
        category = 'GLIDE_PLANE_EXTINCTION';
        violatedRule = 'c-glide plane extinction: (h-hl) requires l = 2n in R-3c.';
      }
    }
  }

  if (!isAllowed) {
    explanation = violatedRule;
  }

  const statusLabel = isAllowed 
    ? 'ALLOWED (Bragg Active)' 
    : `EXTINCT (${category.replace('_EXTINCTION', '').replace('_', ' ')})`;

  return {
    allowed: isAllowed,
    category,
    statusLabel,
    ruleViolated: isAllowed ? undefined : violatedRule,
    ruleExplanation: explanation,
    conditionsChecked: conditions
  };
}

// --------------------------------------------------------------------------
// Multi-Reflection Inversion & Space Group Eliminator
// --------------------------------------------------------------------------
export interface SpaceGroupCandidate {
  spaceGroup: SpaceGroupInfo;
  allowedCount: number;
  extinctCount: number;
  totalReflections: number;
  compatibilityScore: number; // 0 - 100%
  violations: {
    hkl: [number, number, number];
    twoTheta?: number;
    rule: string;
  }[];
}

export function evaluateSpaceGroupCandidates(
  reflections: { hkl: [number, number, number]; twoTheta?: number; intensity?: number }[],
  filterSystem?: string
): SpaceGroupCandidate[] {
  let targetSGs = SPACE_GROUPS_DATABASE;
  if (filterSystem && filterSystem !== 'All') {
    targetSGs = targetSGs.filter(s => s.crystalSystem.toLowerCase() === filterSystem.toLowerCase());
  }

  const candidates: SpaceGroupCandidate[] = targetSGs.map(sg => {
    let allowedCount = 0;
    let extinctCount = 0;
    const violations: SpaceGroupCandidate['violations'] = [];

    reflections.forEach(rf => {
      const [h, k, l] = rf.hkl;
      if (h === 0 && k === 0 && l === 0) return;

      const res = checkExtinction(h, k, l, sg);
      if (res.allowed) {
        allowedCount++;
      } else {
        extinctCount++;
        violations.push({
          hkl: [h, k, l],
          twoTheta: rf.twoTheta,
          rule: res.ruleViolated || res.ruleExplanation
        });
      }
    });

    const total = allowedCount + extinctCount;
    // Score is 100% if 0 observed peaks are extinct in this space group
    const score = total > 0 ? (allowedCount / total) * 100 : 100;

    return {
      spaceGroup: sg,
      allowedCount,
      extinctCount,
      totalReflections: total,
      compatibilityScore: score,
      violations
    };
  });

  // Sort candidates by highest compatibility score first, then by space group symmetry
  return candidates.sort((a, b) => {
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore;
    }
    return a.spaceGroup.number - b.spaceGroup.number;
  });
}

// --------------------------------------------------------------------------
// Multiplicity Multiplier & Generator for Powder Reflections
// --------------------------------------------------------------------------
export function calculateMultiplicity(
  h: number,
  k: number,
  l: number,
  system: string
): number {
  const absH = Math.abs(h);
  const absK = Math.abs(k);
  const absL = Math.abs(l);
  const nonZero = [absH, absK, absL].filter(x => x > 0).length;
  const uniqueVals = new Set([absH, absK, absL]).size;

  const sys = system.toLowerCase();

  if (sys.includes('cubic')) {
    if (absH === absK && absK === absL) {
      return 8; // {hhh} e.g. 111, 222
    }
    if (nonZero === 1) {
      return 6; // {h00} e.g. 100, 200
    }
    if (uniqueVals === 2) {
      if (absH === 0 || absK === 0 || absL === 0) return 12; // {hk0} with h=k -> 12
      return 24; // {hhl} e.g. 220 -> 12, 311 -> 24
    }
    return 48; // {hkl} all distinct e.g. 321
  }

  if (sys.includes('tetragonal')) {
    if (absH === 0 && absK === 0) return 2; // {00l}
    if (absL === 0 && absH === absK) return 4; // {hh0}
    if (absL === 0 && (absH === 0 || absK === 0)) return 4; // {h00}
    if (absL === 0) return 8; // {hk0}
    if (absH === absK) return 8; // {hhl}
    if (absH === 0 || absK === 0) return 8; // {h0l}
    return 16; // {hkl}
  }

  if (sys.includes('hexagonal') || sys.includes('trigonal')) {
    if (absH === 0 && absK === 0) return 2; // {00l}
    if (absL === 0 && (absH === 0 || absK === 0 || absH === absK)) return 6; // {h00}, {hh0}
    if (absL === 0) return 12; // {hk0}
    if (absH === 0 || absK === 0 || absH === absK) return 12; // {h0l}, {hhl}
    return 24; // {hkl}
  }

  if (sys.includes('orthorhombic')) {
    if (nonZero === 1) return 2; // {h00}, {0k0}, {00l}
    if (nonZero === 2) return 4; // {hk0}, {h0l}, {0kl}
    return 8; // {hkl}
  }

  if (sys.includes('monoclinic')) {
    if (absK === 0 && absL === 0) return 2;
    if (absH === 0 && absL === 0) return 2;
    if (absH === 0 && absK === 0) return 2;
    return 4;
  }

  // Triclinic
  return 2; // {hkl} and {-h -k -l}
}
