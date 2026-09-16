// Curated Presets for Compound & Alloy X-Ray Attenuation Analysis

export interface AttenuationPreset {
  id: string;
  category: 'Semiconductor' | 'Battery' | 'Superconductor' | 'Engineering Alloy' | 'Ceramic & Mineral' | 'Shielding' | 'Polymer & Bio';
  name: string;
  formula: string;
  density: number; // g/cm³
  description: string;
  commonXRayAnode: string; // Recommended anode
  typicalApplication: string;
}

export const ATTENUATION_PRESETS: AttenuationPreset[] = [
  // 1. Engineering Alloys
  {
    id: 'ss316l',
    category: 'Engineering Alloy',
    name: 'Austenitic Stainless Steel (SS 316L)',
    formula: 'Fe0.65Cr0.17Ni0.12Mo0.025Mn0.02Si0.015',
    density: 7.98,
    description: 'Corrosion-resistant marine & medical grade steel with Mo addition',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Residual stress measurement, texture & phase analysis (austenite vs ferrite)'
  },
  {
    id: 'inconel718',
    category: 'Engineering Alloy',
    name: 'Inconel 718 Superalloy',
    formula: 'Ni0.53Fe0.18Cr0.19Nb0.05Mo0.03Ti0.01Al0.01',
    density: 8.19,
    description: 'High-strength nickel-base superalloy used in aerospace gas turbines',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'High-temperature gamma-prime & gamma-double-prime precipitation tracking'
  },
  {
    id: 'ti6al4v',
    category: 'Engineering Alloy',
    name: 'Titanium Ti-6Al-4V (Grade 5)',
    formula: 'Ti0.86Al0.10V0.04',
    density: 4.43,
    description: 'Dual-phase (alpha+beta) aerospace & biomedical titanium alloy',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Phase fraction quantification and additive manufacturing texture'
  },
  {
    id: 'al7075',
    category: 'Engineering Alloy',
    name: 'Aluminum 7075-T6',
    formula: 'Al0.90Zn0.055Mg0.025Cu0.015Cr0.005',
    density: 2.81,
    description: 'High-strength zinc-hardened aluminum aerospace alloy',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Precipitation hardening analysis (Eta/Eta-prime phases)'
  },
  {
    id: 'cantor_hea',
    category: 'Engineering Alloy',
    name: 'Cantor High-Entropy Alloy (HEA)',
    formula: 'Fe0.20Co0.20Ni0.20Cr0.20Mn0.20',
    density: 8.05,
    description: 'Equiatomic single-phase FCC multicomponent solid solution',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Severe lattice distortion and solid-solution strengthening studies'
  },
  {
    id: 'invar36',
    category: 'Engineering Alloy',
    name: 'Invar 36 (Fe-36Ni)',
    formula: 'Fe0.64Ni0.36',
    density: 8.13,
    description: 'Zero-thermal expansion nickel-iron alloy',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Thermal expansion lattice parameter tracking vs temperature'
  },
  {
    id: 'nitinol',
    category: 'Engineering Alloy',
    name: 'Nitinol Shape Memory Alloy (NiTi)',
    formula: 'Ni0.50Ti0.50',
    density: 6.45,
    description: 'Superelastic shape-memory martensitic-austenitic intermetallic',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Stress-induced B2 to B19\' phase transformation'
  },

  // 2. Battery & Energy Storage
  {
    id: 'nmc811',
    category: 'Battery',
    name: 'NMC 811 Battery Cathode',
    formula: 'LiNi0.8Co0.1Mn0.1O2',
    density: 4.75,
    description: 'High-energy-density layered lithium nickel manganese cobalt oxide',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'In-situ operando state-of-charge lattice parameter breathing'
  },
  {
    id: 'lfp',
    category: 'Battery',
    name: 'Lithium Iron Phosphate (LFP)',
    formula: 'LiFePO4',
    density: 3.60,
    description: 'Thermally stable olivine-type cathode active material',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Two-phase LiFePO4 to FePO4 delithiation mapping'
  },
  {
    id: 'lco',
    category: 'Battery',
    name: 'Lithium Cobalt Oxide (LCO)',
    formula: 'LiCoO2',
    density: 5.06,
    description: 'Classic rhombohedral layered lithium ion cathode standard',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Hexagonal to monoclinic phase transition at high voltage'
  },
  {
    id: 'lto',
    category: 'Battery',
    name: 'Lithium Titanate Spinel (LTO)',
    formula: 'Li4Ti5O12',
    density: 3.50,
    description: 'Zero-strain fast-charging lithium battery anode',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Structural stability & zero lattice volume variation during cycling'
  },
  {
    id: 'lgps',
    category: 'Battery',
    name: 'LGPS Superionic Conductor',
    formula: 'Li10GeP2S12',
    density: 2.03,
    description: 'High-conductivity solid electrolyte for all-solid-state batteries',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Air-sensitive capillary transmission XRD for lithium diffusion pathways'
  },

  // 3. Semiconductors & Optoelectronics
  {
    id: 'silicon',
    category: 'Semiconductor',
    name: 'Silicon (Single Crystal / Wafer)',
    formula: 'Si',
    density: 2.33,
    description: 'Universal microelectronic substrate & NIST 640 standard reference',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'High-resolution rocking curves (HRXRD) & reciprocal space mapping'
  },
  {
    id: 'gaas',
    category: 'Semiconductor',
    name: 'Gallium Arsenide (GaAs)',
    formula: 'GaAs',
    density: 5.32,
    description: 'Direct bandgap zincblende semiconductor for optoelectronics & RF',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Epitaxial thin-film lattice mismatch & rocking curve width'
  },
  {
    id: 'gan',
    category: 'Semiconductor',
    name: 'Gallium Nitride (GaN)',
    formula: 'GaN',
    density: 6.15,
    description: 'Wide bandgap wurtzite semiconductor for power electronics & blue LEDs',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Dislocation density estimation via asymmetric peak rocking curves'
  },
  {
    id: 'mapbi3',
    category: 'Semiconductor',
    name: 'Methylammonium Lead Iodide (MAPbI3)',
    formula: 'CH3NH3PbI3',
    density: 4.16,
    description: 'Hybrid organic-inorganic perovskite solar absorber material',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Degradation tracking into PbI2 and phase stability under moisture'
  },
  {
    id: 'cdte',
    category: 'Semiconductor',
    name: 'Cadmium Telluride (CdTe)',
    formula: 'CdTe',
    density: 5.85,
    description: 'Heavy II-VI semiconductor for thin-film solar and gamma detectors',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'Polycrystalline film orientation and Cl-activation recrystallization'
  },

  // 4. Superconductors & Magnetics
  {
    id: 'ybco',
    category: 'Superconductor',
    name: 'YBCO Superconductor (1-2-3)',
    formula: 'YBa2Cu3O7',
    density: 6.38,
    description: 'High-Tc cuprate superconductor with Tc = 93 K',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Oxygen stoichiometry refinement and orthorhombicity (b-a)/(b+a)'
  },
  {
    id: 'bscco',
    category: 'Superconductor',
    name: 'BSCCO-2212 Cuprate Superconductor',
    formula: 'Bi2Sr2CaCu2O8',
    density: 6.55,
    description: 'Layered high-temperature superconductor tape material',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'C-axis texture and incommensurate modulation profiling'
  },
  {
    id: 'ndfeb',
    category: 'Superconductor',
    name: 'Neodymium Permanent Magnet (Nd2Fe14B)',
    formula: 'Nd2Fe14B',
    density: 7.60,
    description: 'Tetragonal super-strong permanent magnet compound',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Grain alignment degree and grain-boundary interphase detection'
  },
  {
    id: 'magnetite',
    category: 'Superconductor',
    name: 'Magnetite (Fe3O4)',
    formula: 'Fe3O4',
    density: 5.18,
    description: 'Ferrimagnetic inverse spinel iron oxide',
    commonXRayAnode: 'Co_Ka',
    typicalApplication: 'Verwey transition and distinguishing from maghemite (gamma-Fe2O3)'
  },

  // 5. Ceramics & Minerals
  {
    id: 'alumina',
    category: 'Ceramic & Mineral',
    name: 'Corundum Alpha-Alumina (Al2O3)',
    formula: 'Al2O3',
    density: 3.98,
    description: 'NIST SRM 1976 XRD line-profile and intensity standard',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Instrumental peak broadening and quantitative phase standard (RIR)'
  },
  {
    id: 'batio3',
    category: 'Ceramic & Mineral',
    name: 'Barium Titanate (BaTiO3)',
    formula: 'BaTiO3',
    density: 6.02,
    description: 'Ferroelectric & piezoelectric perovskite standard for MLCCs',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Tetragonal vs cubic peak splitting (002)/(200) domain analysis'
  },
  {
    id: 'hydroxyapatite',
    category: 'Ceramic & Mineral',
    name: 'Hydroxyapatite (Bone Mineral)',
    formula: 'Ca5(PO4)3(OH)',
    density: 3.16,
    description: 'Hexagonal calcium phosphate bioceramic matching natural bone mineral',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Crystallinity index, Scherrer crystallite size in bioceramics'
  },
  {
    id: 'quartz',
    category: 'Ceramic & Mineral',
    name: 'Low Quartz (alpha-SiO2)',
    formula: 'SiO2',
    density: 2.65,
    description: 'Trigonal silica mineral standard and respirable dust monitoring',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'OSHA / NIOSH respirable crystalline silica quantitative analysis'
  },
  {
    id: 'zirconia_ysz',
    category: 'Ceramic & Mineral',
    name: '8YSZ Yttria-Stabilized Zirconia',
    formula: 'Zr0.84Y0.16O1.92',
    density: 5.90,
    description: 'Cubic oxygen-ion conducting thermal barrier coating and SOFC electrolyte',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'Phase stabilization (monoclinic vs tetragonal vs cubic zirconia)'
  },

  // 6. Shielding & Heavy Elements
  {
    id: 'lead',
    category: 'Shielding',
    name: 'Lead Shielding (Pb)',
    formula: 'Pb',
    density: 11.34,
    description: 'Standard heavy metal radiation barrier for X-ray & gamma shielding',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'HVL (Half-Value Layer) radiation shielding thickness calculations'
  },
  {
    id: 'tungsten',
    category: 'Shielding',
    name: 'Tungsten Heavy Metal (W)',
    formula: 'W',
    density: 19.25,
    description: 'Ultra-dense refractory metal for collimators, slits and shielding',
    commonXRayAnode: 'Mo_Ka',
    typicalApplication: 'Collimator slit edge transmission & microbeam aperture sizing'
  },

  // 7. Polymer & Bio
  {
    id: 'water',
    category: 'Polymer & Bio',
    name: 'Water (H2O Standard)',
    formula: 'H2O',
    density: 1.00,
    description: 'Biological solvent and standard liquid scattering background',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'SAXS/WAXS capillary solvent background subtraction'
  },
  {
    id: 'kapton',
    category: 'Polymer & Bio',
    name: 'Kapton Polyimide Film',
    formula: 'C22H10N2O5',
    density: 1.42,
    description: 'Standard low-absorption X-ray window & sample containment film',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'X-ray window transmission factor & amorphous background profile'
  },
  {
    id: 'pmma',
    category: 'Polymer & Bio',
    name: 'PMMA (Acrylic / Lucite)',
    formula: 'C5H8O2',
    density: 1.18,
    description: 'Standard zero-background XRD specimen holder substrate',
    commonXRayAnode: 'Cu_Ka',
    typicalApplication: 'Cavity holder selection to minimize amorphous background hump'
  }
];
