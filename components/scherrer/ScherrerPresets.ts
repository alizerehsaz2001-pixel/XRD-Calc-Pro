export interface ScherrerPreset {
  name: string;
  data: string;
  wavelength: number;
  k: number;
  kLabel: string;
  density: number;
  materialLabel: string;
  desc: string;
  icon: string;
  burgersVectorNm?: number;
}

export const SCHERRER_PRESETS: ScherrerPreset[] = [
  { 
    name: 'Silicon (NIST 640d)', 
    data: "28.442, 0.115, 100, 1, 1, 1\n47.302, 0.138, 55, 2, 2, 0\n56.123, 0.160, 32, 3, 1, 1\n69.130, 0.190, 18, 4, 0, 0\n76.377, 0.215, 12, 3, 3, 1\n88.032, 0.250, 16, 4, 2, 2", 
    wavelength: 1.5406, 
    k: 0.94, 
    kLabel: 'Cubic {100}',
    density: 2.33,
    materialLabel: 'Silicon (Si)',
    desc: 'NIST Standard Reference Material 640d with high crystallinity calibration peaks.',
    icon: '💎',
    burgersVectorNm: 0.384
  },
  { 
    name: 'ZnO Wurtzite Nanorods', 
    data: "31.77, 0.46, 57, 1, 0, 0\n34.42, 0.24, 82, 0, 0, 2\n36.25, 0.44, 100, 1, 0, 1\n47.54, 0.50, 23, 1, 0, 2\n56.60, 0.54, 32, 1, 1, 0\n62.86, 0.56, 28, 1, 0, 3\n67.95, 0.58, 22, 1, 1, 2", 
    wavelength: 1.5406, 
    k: 0.94, 
    kLabel: 'Spherical / Hexagonal',
    density: 5.61,
    materialLabel: 'Zinc Oxide (ZnO)',
    desc: 'Hexagonal wurtzite nanorods with anisotropic c-axis elongation: D(002) is markedly larger than D(100).',
    icon: '⚪',
    burgersVectorNm: 0.325
  },
  { 
    name: 'TiO₂ Anatase Nanoparticles', 
    data: "25.28, 0.52, 100, 1, 0, 1\n37.80, 0.60, 20, 0, 0, 4\n48.05, 0.65, 35, 2, 0, 0\n53.89, 0.68, 20, 1, 0, 5\n55.06, 0.70, 20, 2, 1, 1\n62.69, 0.76, 15, 2, 0, 4", 
    wavelength: 1.5406, 
    k: 0.943, 
    kLabel: 'Cubic / Tetragonal',
    density: 3.89,
    materialLabel: 'TiO₂ Anatase',
    desc: 'Photocatalytic titania nanopowder showing pronounced facet-dependent broadening across (101) and (004).',
    icon: '✨',
    burgersVectorNm: 0.378
  },
  { 
    name: 'Gold (Au) Nanocrystals', 
    data: "38.19, 0.42, 100, 1, 1, 1\n44.39, 0.75, 52, 2, 0, 0\n64.58, 0.52, 31, 2, 2, 0\n77.55, 0.82, 36, 3, 1, 1\n81.72, 0.58, 16, 2, 2, 2", 
    wavelength: 1.5406, 
    k: 0.90, 
    kLabel: 'FCC Octahedra',
    density: 19.30,
    materialLabel: 'Gold (Au)',
    desc: 'Colloidal gold nanocrystals with characteristic FCC (111) dominant facets and {200} twin boundary broadening.',
    icon: '🟡',
    burgersVectorNm: 0.288
  },
  { 
    name: 'Ceria (CeO₂) Catalytic Nano', 
    data: "28.55, 0.64, 100, 1, 1, 1\n33.08, 0.68, 30, 2, 0, 0\n47.48, 0.74, 48, 2, 2, 0\n56.34, 0.79, 36, 3, 1, 1\n59.09, 0.81, 10, 2, 2, 2\n69.41, 0.88, 14, 4, 0, 0", 
    wavelength: 1.5406, 
    k: 0.94, 
    kLabel: 'Cubic Fluorite',
    density: 7.22,
    materialLabel: 'Ceria (CeO₂)',
    desc: 'Fluorite-structured catalytic nanoparticles with high specific surface area and defect concentrations.',
    icon: '🧪',
    burgersVectorNm: 0.383
  },
  { 
    name: 'Fe₃O₄ Magnetite (Spinel)', 
    data: "30.10, 0.58, 30, 2, 2, 0\n35.42, 0.52, 100, 3, 1, 1\n43.05, 0.62, 22, 4, 0, 0\n53.40, 0.68, 11, 4, 2, 2\n56.94, 0.65, 34, 5, 1, 1\n62.52, 0.72, 40, 4, 4, 0", 
    wavelength: 1.5406, 
    k: 0.92, 
    kLabel: 'Octahedral Spinel',
    density: 5.17,
    materialLabel: 'Magnetite (Fe₃O₄)',
    desc: 'Superparamagnetic iron oxide nanoparticles (SPIONs) displaying isotropic cubic domain confinement.',
    icon: '🧲',
    burgersVectorNm: 0.592
  }
];

export interface BurgersPreset {
  label: string;
  value: number;
  structure: string;
}

export const BURGERS_VECTOR_PRESETS: BurgersPreset[] = [
  { label: 'Cu [110]', value: 0.256, structure: 'FCC a/√2' },
  { label: 'Au [110]', value: 0.288, structure: 'FCC a/√2' },
  { label: 'Al [110]', value: 0.286, structure: 'FCC a/√2' },
  { label: 'Si [110]', value: 0.384, structure: 'Diamond a/√2' },
  { label: 'α-Fe [111]', value: 0.248, structure: 'BCC a√3/2' },
  { label: 'ZnO [001]', value: 0.325, structure: 'Wurtzite c' },
  { label: 'TiO₂ [001]', value: 0.378, structure: 'Anatase c/2' },
  { label: 'CeO₂ [110]', value: 0.383, structure: 'Fluorite a/√2' }
];
