export type Topic =
  | 'start'
  | 'unit_cells'
  | 'system_overview'
  | 'input'
  | 'generators'
  | 'polymer_calc'
  | 'rietveld_protocol'
  | 'troubleshoot'
  | 'ai_advisor';

export type ProtocolSubTab =
  | 'checklist'
  | 'symmetry'
  | 'qpa'
  | 'caglioti'
  | 'preferred'
  | 'python';

export interface PlatformSectionInfo {
  id: string;
  label: string;
  group: 'Fundamentals' | 'Size & Strain' | 'Advanced Sim' | 'Intelligence';
  description: string;
  updates: string;
  status: 'active' | 'enhanced' | 'validated';
  jumpTopic?: Topic;
}

export const ANODE_WAVELENGTHS = [
  { id: 'Cu', label: 'Cu Kα₁', wavelength: 1.54056, ka2: 1.54439, energyKeV: 8.0478 },
  { id: 'Co', label: 'Co Kα₁', wavelength: 1.78897, ka2: 1.79285, energyKeV: 6.9303 },
  { id: 'Mo', label: 'Mo Kα₁', wavelength: 0.71073, ka2: 0.71359, energyKeV: 17.4443 },
  { id: 'Cr', label: 'Cr Kα₁', wavelength: 2.28970, ka2: 2.29361, energyKeV: 5.4147 },
  { id: 'Fe', label: 'Fe Kα₁', wavelength: 1.93604, ka2: 1.93998, energyKeV: 6.4038 },
] as const;

export const PLATFORM_SECTIONS: PlatformSectionInfo[] = [
  {
    id: 'unit_cells',
    label: 'Unit Cells & 14 Bravais Lattices',
    group: 'Fundamentals',
    description:
      'Foundation of materials crystallography: basis vectors (a, b, c), interaxial angles (α, β, γ), Primitive (P) vs. centered (I, F, C, R) lattices, 3D orbital geometry, Miller planes, and stereographic Wulff nets.',
    updates:
      'Interactive 3D/isometric orbital geometry viewer, APF mathematics, and stereographic pole projections.',
    status: 'validated',
    jumpTopic: 'unit_cells',
  },
  {
    id: 'periodic',
    label: 'Periodic Table & Scattering Inspector',
    group: 'Fundamentals',
    description:
      'Elemental X-ray absorption edges, mass attenuation coefficients (μ/ρ), anomalous dispersion corrections (f′, f″), and atomic form factors.',
    updates: 'Multi-anode absorption edge overlays and atomic scattering factor curves.',
    status: 'validated',
  },
  {
    id: 'bragg',
    label: 'Bragg Basics & Zero-Shift',
    group: 'Fundamentals',
    description:
      'Computes interplanar d-spacing, scattering Q-vector magnitude, and sin θ / λ ratios from 2θ diffraction peaks and anode wavelengths.',
    updates: 'Integrated real-time zero-shift and specimen displacement goniometer calibration.',
    status: 'validated',
    jumpTopic: 'generators',
  },
  {
    id: 'fwhm',
    label: 'FWHM & Profile Analysis',
    group: 'Fundamentals',
    description:
      'Deconvolves peak shapes using Gaussian, Lorentzian, and Pseudo-Voigt analytical convolution models.',
    updates: 'Non-linear profile fitting with tunable Lorentzian mixing parameter η.',
    status: 'enhanced',
  },
  {
    id: 'selection',
    label: 'Selection Rules & Extinctions',
    group: 'Fundamentals',
    description:
      'Evaluates crystal systematic absences across Bravais centerings, glide planes, and screw axes mapped onto Miller reflection indices.',
    updates: 'Supports HCP extinction rules, diamond-cubic d-glide, and space-group symmetry solvers.',
    status: 'validated',
  },
  {
    id: 'preferred_orientation',
    label: 'Preferred Orientation (March-Dollase)',
    group: 'Fundamentals',
    description:
      'Models crystallographic texture anisotropy in platelet, rolled, or acicular grains via March-Dollase scaling factors.',
    updates: 'Live (00l)/(hk0) intensity weighting curves and oriented volume fraction controls.',
    status: 'validated',
    jumpTopic: 'rietveld_protocol',
  },
  {
    id: 'metric_tensor',
    label: 'Crystallographic Metric Tensor Algebra',
    group: 'Fundamentals',
    description:
      'Real-space G and reciprocal-space G* metric tensor computations for exact interplanar angles, bond lengths, and cell volumes in any triclinic basis.',
    updates: 'Interactive 3×3 tensor matrix decomposition and intervector angle solver.',
    status: 'validated',
  },
  {
    id: 'supercell',
    label: 'Supercell & Coordinate Transformation',
    group: 'Fundamentals',
    description:
      'Applies unimodular and general 3×3 transformation matrices P to transform conventional cells, primitive cells, and Miller indices.',
    updates: 'Real-time determinant volume scaling and fractional basis transformation preview.',
    status: 'validated',
  },
  {
    id: 'scherrer',
    label: 'Scherrer Crystallite Size',
    group: 'Size & Strain',
    description:
      'Calculates mean coherent domain thickness τ from peak broadening with instrumental FWHM deconvolution.',
    updates: 'Configurable shape factor K (0.89–1.20) with Gaussian/Lorentzian instrumental subtraction.',
    status: 'validated',
    jumpTopic: 'generators',
  },
  {
    id: 'wh',
    label: 'Williamson-Hall Strain-Size',
    group: 'Size & Strain',
    description:
      'Decouples crystallite size broadening from lattice microstrain ε using β·cosθ vs 4·sinθ linear regression.',
    updates: 'Includes UDM, USDM (uniform stress), and UDEDM (energy density) anisotropic models.',
    status: 'enhanced',
  },
  {
    id: 'integral_adv',
    label: 'Integral Breadth & Halder-Wagner',
    group: 'Size & Strain',
    description:
      'Estimates domain size and microstrain from integrated peak areas using reciprocal squared Halder-Wagner and Size-Strain plots.',
    updates: 'Robust linear solver bounds minimizing low-angle asymmetry bias.',
    status: 'enhanced',
  },
  {
    id: 'double_voigt',
    label: 'Double-Voigt Microstructure',
    group: 'Size & Strain',
    description:
      'Separates Gaussian and Lorentzian size/strain broadening components for volume-weighted and area-weighted domain columns.',
    updates: 'Analytical Voigt breadth decomposition across multi-order peaks.',
    status: 'validated',
  },
  {
    id: 'wa',
    label: 'Warren-Averbach Fourier Analysis',
    group: 'Size & Strain',
    description:
      'Fourier cosine coefficient deconvolution separating column length distributions and RMS microstrain across harmonic reflection pairs.',
    updates: 'Harmonic profile sanity checks with hook-effect diagnostics.',
    status: 'validated',
  },
  {
    id: 'cohen',
    label: "Cohen's Least-Squares Refinement",
    group: 'Advanced Sim',
    description:
      'Refines lattice constants using weighted linear regression against Nelson-Riley or cos²θ/sinθ systematic error drift functions.',
    updates: 'Live drift error matrix with zero-shift vs specimen-displacement separation.',
    status: 'validated',
  },
  {
    id: 'pawley_lebail',
    label: 'Pawley & Le Bail Whole Pattern Decomposition',
    group: 'Advanced Sim',
    description:
      'Whole-powder-pattern decomposition extracting integrated intensities without requiring an initial atomic structure model.',
    updates: 'Interactive overlapping cluster decomposition and R_wp residual minimization.',
    status: 'validated',
  },
  {
    id: 'rir',
    label: 'Reference Intensity Ratio (RIR) Quant',
    group: 'Advanced Sim',
    description:
      'Quantitative phase weight fractions using Chung adiabatic RIR equations, internal corundum spiking, and Brindley microabsorption corrections.',
    updates: 'Propagation-of-error covariance uncertainty matrix and Pawley-RIR bridge.',
    status: 'validated',
  },
  {
    id: 'rietveld',
    label: 'Rietveld Refinement Studio',
    group: 'Advanced Sim',
    description:
      'Full-profile least-squares crystal structure refinement spanning scale, background, zero-shift, unit cell, Caglioti FWHM, and atomic occupancies.',
    updates: 'Sequential parameter-lock SOP gate workflow preventing least-squares divergence.',
    status: 'enhanced',
    jumpTopic: 'rietveld_protocol',
  },
  {
    id: 'neutron',
    label: 'Neutron & Magnetic Diffraction',
    group: 'Advanced Sim',
    description:
      'Nuclear coherent/incoherent scattering lengths and spin-dependent magnetic form-factor modeling for magnetic sublattices.',
    updates: 'Transition-metal isotope scattering tables and non-collinear spin vector projections.',
    status: 'active',
  },
  {
    id: 'dl',
    label: 'Neural Phase Identification & Spectral Alignment',
    group: 'Intelligence',
    description:
      'Multi-phase pattern matching, spectral cross-correlation, and 2D Debye-Scherrer ring integration pipelines.',
    updates: 'Enhanced mixture sorting across overlapping low-angle reflections.',
    status: 'validated',
  },
  {
    id: 'learn',
    label: 'Protocol Guide & Laboratory SOPs',
    group: 'Intelligence',
    description:
      'Interactive diffraction compliance handbook, data parser sandbox, physical aberration simulators, and refinement SOP reference.',
    updates: 'Expanded with exact Ray-Optics Displacement Simulator, 3-plane Symmetry Matrix Solver, and Hill-Howard QPA Lab.',
    status: 'validated',
    jumpTopic: 'start',
  },
];

export interface SymmetryMatrixOp {
  matrix: [
    [number, number, number],
    [number, number, number],
    [number, number, number]
  ];
  translation: [number, number, number];
  algebraic: string;
}

export interface SpaceGroupDrilldownInfo {
  number: number;
  hermannMauguin: string;
  schoenflies: string;
  crystalSystem: string;
  pointGroup: string;
  centrosymmetric: boolean;
  chiral: boolean;
  extinctionRuleSummary: string;
  wyckoffSites: Array<{ site: string; multiplicity: number; coordinates: string }>;
  operators: SymmetryMatrixOp[];
}

export const DRILLDOWN_SPACE_GROUP_INFO: Record<string, SpaceGroupDrilldownInfo> = {
  'Simple Cubic': {
    number: 221,
    hermannMauguin: 'P m-3m',
    schoenflies: 'O_h^1',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    extinctionRuleSummary: 'No general or special reflection conditions (all hkl allowed).',
    wyckoffSites: [
      { site: '1a', multiplicity: 1, coordinates: '(0, 0, 0)' },
      { site: '1b', multiplicity: 1, coordinates: '(½, ½, ½)' },
      { site: '3c', multiplicity: 3, coordinates: '(0, ½, ½)' },
      { site: '6e', multiplicity: 6, coordinates: '(x, 0, 0)' },
    ],
    operators: [
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'x, y, z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, -y, -z' },
      { matrix: [[0, 1, 0], [0, 0, 1], [1, 0, 0]], translation: [0, 0, 0], algebraic: 'y, z, x' },
      { matrix: [[0, -1, 0], [0, 0, -1], [-1, 0, 0]], translation: [0, 0, 0], algebraic: '-y, -z, -x' },
      { matrix: [[0, 0, 1], [1, 0, 0], [0, 1, 0]], translation: [0, 0, 0], algebraic: 'z, x, y' },
      { matrix: [[1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: 'x, -y, -z' },
      { matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, y, -z' },
      { matrix: [[0, 1, 0], [1, 0, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'y, x, z' },
    ],
  },
  BCC: {
    number: 229,
    hermannMauguin: 'I m-3m',
    schoenflies: 'O_h^9',
    crystalSystem: 'Cubic (α-Fe type)',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    extinctionRuleSummary: 'Body-centering condition: h + k + l = 2n (odd sums systematically extinct).',
    wyckoffSites: [
      { site: '2a', multiplicity: 2, coordinates: '(0, 0, 0) + B.C.' },
      { site: '6b', multiplicity: 6, coordinates: '(0, ½, ½) + B.C.' },
      { site: '12d', multiplicity: 12, coordinates: '(¼, 0, ½) + B.C.' },
    ],
    operators: [
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'x, y, z' },
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0.5, 0.5, 0.5], algebraic: 'x+½, y+½, z+½' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, -y, -z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: '-x+½, -y+½, -z+½' },
      { matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, y, -z' },
      { matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: '-x+½, y+½, -z+½' },
      { matrix: [[1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: 'x, -y, -z' },
      { matrix: [[1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: 'x+½, -y+½, -z+½' },
    ],
  },
  FCC: {
    number: 225,
    hermannMauguin: 'F m-3m',
    schoenflies: 'O_h^5',
    crystalSystem: 'Cubic (Cu/Al type)',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    extinctionRuleSummary: 'Face-centering condition: h, k, l all even or all odd (mixed parity extinct).',
    wyckoffSites: [
      { site: '4a', multiplicity: 4, coordinates: '(0, 0, 0) + F.C.' },
      { site: '4b', multiplicity: 4, coordinates: '(½, ½, ½) + F.C.' },
      { site: '8c', multiplicity: 8, coordinates: '(¼, ¼, ¼) + F.C.' },
    ],
    operators: [
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'x, y, z' },
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0.5, 0.5], algebraic: 'x, y+½, z+½' },
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0.5, 0, 0.5], algebraic: 'x+½, y, z+½' },
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0.5, 0.5, 0], algebraic: 'x+½, y+½, z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, -y, -z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0.5, 0.5], algebraic: '-x, -y+½, -z+½' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0.5, 0, 0.5], algebraic: '-x+½, -y, -z+½' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0.5, 0.5, 0], algebraic: '-x+½, -y+½, -z' },
    ],
  },
  Perovskite: {
    number: 221,
    hermannMauguin: 'P m-3m',
    schoenflies: 'O_h^1',
    crystalSystem: 'Cubic (SrTiO₃)',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    extinctionRuleSummary: 'Primitive cubic symmetry (all hkl reflections symmetry-allowed; structure factor modulates weak superlattice reflections).',
    wyckoffSites: [
      { site: '1a', multiplicity: 1, coordinates: '(0, 0, 0) [A/Ti]' },
      { site: '1b', multiplicity: 1, coordinates: '(½, ½, ½) [B/Sr]' },
      { site: '3c', multiplicity: 3, coordinates: '(0, ½, ½) [O]' },
    ],
    operators: [
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'x, y, z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, -y, -z' },
      { matrix: [[0, 1, 0], [0, 0, 1], [1, 0, 0]], translation: [0, 0, 0], algebraic: 'y, z, x' },
      { matrix: [[0, 0, 1], [1, 0, 0], [0, 1, 0]], translation: [0, 0, 0], algebraic: 'z, x, y' },
      { matrix: [[1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: 'x, -y, -z' },
      { matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: '-x, y, z' },
    ],
  },
  Rutile: {
    number: 136,
    hermannMauguin: 'P 4₂/m n m',
    schoenflies: 'D_4h^14',
    crystalSystem: 'Tetragonal (TiO₂)',
    pointGroup: '4/mmm (D_4h)',
    centrosymmetric: true,
    chiral: false,
    extinctionRuleSummary: 'n-glide & 4₂ screw: 0kl requires k + l = 2n; 00l requires l = 2n; h00 requires h = 2n.',
    wyckoffSites: [
      { site: '2a', multiplicity: 2, coordinates: '(0, 0, 0), (½, ½, ½)' },
      { site: '4f', multiplicity: 4, coordinates: '(u, u, 0), (½+u, ½-u, ½)...' },
      { site: '8i', multiplicity: 8, coordinates: '(x, y, 0)' },
    ],
    operators: [
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'x, y, z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: '-x, -y, z' },
      { matrix: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], translation: [0.5, 0.5, 0.5], algebraic: '-y+½, x+½, z+½' },
      { matrix: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], translation: [0.5, 0.5, 0.5], algebraic: 'y+½, -x+½, z+½' },
      { matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: '-x+½, y+½, -z+½' },
      { matrix: [[1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: 'x+½, -y+½, -z+½' },
      { matrix: [[0, 1, 0], [1, 0, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: 'y, x, -z' },
      { matrix: [[0, -1, 0], [-1, 0, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-y, -x, -z' },
      { matrix: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: '-x, -y, -z' },
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: 'x, y, -z' },
      { matrix: [[0, 1, 0], [-1, 0, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: 'y+½, -x+½, -z+½' },
      { matrix: [[0, -1, 0], [1, 0, 0], [0, 0, -1]], translation: [0.5, 0.5, 0.5], algebraic: '-y+½, x+½, -z+½' },
      { matrix: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], translation: [0.5, 0.5, 0.5], algebraic: 'x+½, -y+½, z+½' },
      { matrix: [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0.5, 0.5, 0.5], algebraic: '-x+½, y+½, z+½' },
      { matrix: [[0, -1, 0], [-1, 0, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: '-y, -x, z' },
      { matrix: [[0, 1, 0], [1, 0, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'y, x, z' },
    ],
  },
  Quartz: {
    number: 154,
    hermannMauguin: 'P 3₂ 2 1',
    schoenflies: 'D_3^6',
    crystalSystem: 'Trigonal (α-SiO₂)',
    pointGroup: '32 (D_3)',
    centrosymmetric: false,
    chiral: true,
    extinctionRuleSummary: '3₂ screw axis along c: 00l reflections strictly require l = 3n (001 & 002 extinct; 003 allowed).',
    wyckoffSites: [
      { site: '3a', multiplicity: 3, coordinates: '(x, 0, ⅓)' },
      { site: '3b', multiplicity: 3, coordinates: '(x, 0, ⅚)' },
      { site: '6c', multiplicity: 6, coordinates: '(x, y, z)' },
    ],
    operators: [
      { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], translation: [0, 0, 0], algebraic: 'x, y, z' },
      { matrix: [[0, -1, 0], [1, -1, 0], [0, 0, 1]], translation: [0, 0, 2 / 3], algebraic: '-y, x-y, z+⅔' },
      { matrix: [[-1, 1, 0], [-1, 0, 0], [0, 0, 1]], translation: [0, 0, 1 / 3], algebraic: '-x+y, -x, z+⅓' },
      { matrix: [[0, 1, 0], [1, 0, 0], [0, 0, -1]], translation: [0, 0, 0], algebraic: 'y, x, -z' },
      { matrix: [[1, -1, 0], [0, -1, 0], [0, 0, -1]], translation: [0, 0, 2 / 3], algebraic: 'x-y, -y, -z+⅔' },
      { matrix: [[-1, 0, 0], [-1, 1, 0], [0, 0, -1]], translation: [0, 0, 1 / 3], algebraic: '-x, -x+y, -z+⅓' },
    ],
  },
};

export interface SymmetryPoint {
  x: number;
  y: number;
  z: number;
  algebraic: string;
  isSource: boolean;
}

const mod1 = (v: number): number => {
  const m = ((v % 1) + 1) % 1;
  return Math.abs(m - 1) < 1e-6 || Math.abs(m) < 1e-6 ? 0 : m;
};

export function generateSymmetryOrbit(
  groupKey: string,
  x: number,
  y: number,
  z: number
): SymmetryPoint[] {
  const sg = DRILLDOWN_SPACE_GROUP_INFO[groupKey];
  if (!sg) return [{ x: mod1(x), y: mod1(y), z: mod1(z), algebraic: 'x, y, z', isSource: true }];

  return sg.operators.map((op, idx) => {
    const m = op.matrix;
    const tx = mod1(m[0][0] * x + m[0][1] * y + m[0][2] * z + op.translation[0]);
    const ty = mod1(m[1][0] * x + m[1][1] * y + m[1][2] * z + op.translation[1]);
    const tz = mod1(m[2][0] * x + m[2][1] * y + m[2][2] * z + op.translation[2]);
    return {
      x: Number(tx.toFixed(4)),
      y: Number(ty.toFixed(4)),
      z: Number(tz.toFixed(4)),
      algebraic: op.algebraic,
      isSource: idx === 0,
    };
  });
}

export const RIETVELD_STEPS = [
  {
    step: 1,
    title: 'Background Polynomial & Scale Factor',
    desc: 'Stabilize overall intensity scaling and baseline Chebyshev polynomial coefficients before releasing any peak-position or profile parameters.',
    relevance: 'CRITICAL',
    status: 'Initial Scale Alignment',
    metrics: { rFactor: 62.4, rBragg: 44.2, rExp: 6.4, chi2: 9.75 },
  },
  {
    step: 2,
    title: 'Zero-Shift & Specimen Displacement',
    desc: 'Correct systematic goniometer angular offset (Δ2θ₀) and sample surface height displacement (s·cosθ) across the scan range.',
    relevance: 'HIGH',
    status: 'Goniometer Calibration',
    metrics: { rFactor: 34.8, rBragg: 21.5, rExp: 6.4, chi2: 5.44 },
  },
  {
    step: 3,
    title: 'Unit Cell Lattice Parameters (a, b, c, α, β, γ)',
    desc: 'Refine metric lattice constants so calculated Bragg hkl positions snap cleanly to observed peak centroids before releasing widths.',
    relevance: 'CRITICAL',
    status: 'Bravais Metric Fit',
    metrics: { rFactor: 17.6, rBragg: 10.8, rExp: 6.4, chi2: 2.75 },
  },
  {
    step: 4,
    title: 'Caglioti Profile & Mixing (U, V, W, η)',
    desc: 'Fit angular FWHM broadening U·tan²θ + V·tanθ + W, Pseudo-Voigt Lorentzian fraction η, and axial divergence asymmetry.',
    relevance: 'MODERATE',
    status: 'IRF Profile Convolution',
    metrics: { rFactor: 10.9, rBragg: 6.1, rExp: 6.4, chi2: 1.70 },
  },
  {
    step: 5,
    title: 'Atomic Coordinates (x, y, z) & Thermal B(iso)',
    desc: 'Optimize fractional atomic positions, site occupancies, and isotropic displacement factors only after profile geometry has fully stabilized.',
    relevance: 'EXTREME',
    status: 'Structure Converged',
    metrics: { rFactor: 7.2, rBragg: 3.1, rExp: 6.4, chi2: 1.13 },
  },
] as const;

export const POLYMER_PRESETS = [
  { name: 'HDPE (High-Density PE)', ac: 2850, aa: 1100, haloCenter: 19.8, crystPeaks: [21.6, 24.0] as [number, number], notes: 'Highly linear polyethylene chains yielding sharp (110) and (200) orthorhombic peaks (~72% CI).' },
  { name: 'Isotactic Polypropylene', ac: 2100, aa: 1500, haloCenter: 18.2, crystPeaks: [14.1, 18.6] as [number, number], notes: 'Monoclinic α-form semicrystalline polymer (~58% CI).' },
  { name: 'LDPE (Branched)', ac: 1450, aa: 1950, haloCenter: 19.4, crystPeaks: [21.4, 23.8] as [number, number], notes: 'Short-chain branching disrupts lamellar packing (~43% CI).' },
  { name: 'Semi-Crystalline PET', ac: 1100, aa: 2150, haloCenter: 21.0, crystPeaks: [17.6, 25.8] as [number, number], notes: 'Aromatic polyester with prominent broad amorphous halo (~34% CI).' },
  { name: 'Quenched Amorphous PS', ac: 120, aa: 2800, haloCenter: 19.2, crystPeaks: [19.0, 22.0] as [number, number], notes: 'Atactic polystyrene glass showing pure broad short-range order (<5% CI).' },
];

export const QPA_PRESETS = [
  {
    name: 'Iron Oxide / Quartz Ore',
    ternary: true,
    p1: { name: 'Hematite Fe₂O₃', scale: 0.0025, vol: 302.2, mass: 159.69, z: 6 },
    p2: { name: 'Magnetite Fe₃O₄', scale: 0.0012, vol: 592.1, mass: 231.53, z: 8 },
    p3: { name: 'α-Quartz SiO₂', scale: 0.0005, vol: 113.0, mass: 60.084, z: 3 },
  },
  {
    name: 'TiO₂ Photocatalyst Blend',
    ternary: false,
    p1: { name: 'Anatase TiO₂', scale: 0.0042, vol: 136.25, mass: 79.866, z: 4 },
    p2: { name: 'Rutile TiO₂', scale: 0.0018, vol: 62.43, mass: 79.866, z: 2 },
    p3: { name: 'Brookite TiO₂', scale: 0.0003, vol: 257.4, mass: 79.866, z: 8 },
  },
  {
    name: 'Biomedical CaP Scaffold',
    ternary: true,
    p1: { name: 'Hydroxyapatite', scale: 0.0016, vol: 528.8, mass: 1004.6, z: 1 },
    p2: { name: 'β-TCP', scale: 0.0004, vol: 3521.0, mass: 310.18, z: 21 },
    p3: { name: 'Brushite DCPD', scale: 0.0007, vol: 493.2, mass: 172.09, z: 4 },
  },
];

export const CAGLIOTI_PRESETS = [
  { name: 'Synchrotron HR (ID22)', u: 0.0015, v: -0.0012, w: 0.0018, note: 'Ultra-narrow crystal analyzer collimation' },
  { name: 'Lab Bragg-Brentano (Cu Kα)', u: 0.0250, v: -0.0120, w: 0.0180, note: 'Standard 240 mm laboratory diffractometer' },
  { name: 'Neutron CW (High-Flux)', u: 0.0850, v: -0.0650, w: 0.0420, note: 'Minimum FWHM around 2θ ≈ 50–70° focus angle' },
];

export interface DiagnosticFAQItem {
  category: 'Broadening & Size' | 'Strain & Stress' | 'Peak Shift & Zero' | 'Refinement Convergence' | 'Intensity & Texture';
  q: string;
  a: string;
  check: string;
  fix: string;
  tags: string[];
}

export const DIAGNOSTIC_FAQS: DiagnosticFAQItem[] = [
  {
    category: 'Broadening & Size',
    q: 'Why is my calculated Scherrer crystallite size blowing up or failing to converge?',
    a: 'This occurs when observed peak width (FWHM_obs) is smaller than or nearly equal to the instrumental standard width (FWHM_inst). The diffraction profile is instrument-limited rather than size-broadened.',
    check: 'Verify β_obs > 1.15 × β_inst using a NIST SRM 660c (LaB₆) or SRM 640f (Si) calibration curve at the same 2θ.',
    fix: 'Subtract instrumental broadening in quadrature (Gaussian) or linearly (Lorentzian), or switch to narrower incident/receiving slits.',
    tags: ['size', 'scherrer', 'instrumental', 'broadening', 'fwhm', 'zero'],
  },
  {
    category: 'Strain & Stress',
    q: 'What does a negative slope in a Williamson-Hall (W-H) plot mean physically?',
    a: 'In isotropic W-H plots (β·cosθ vs 4·sinθ), a negative slope is mathematically unphysical for uniform random microstrain if broadening is strictly additive—it points to either anisotropic grain morphology (platelets/needles), coherent domain faulting, or incorrect hkl indexing.',
    check: 'Inspect if peaks from specific planes like (00l) vs (hk0) deviate systematically from the trendline.',
    fix: 'Apply the anisotropic Uniform Stress Deformation Model (USDM) using direction-dependent Young’s modulus E_hkl, or check stacking-fault selection rules.',
    tags: ['slope', 'williamson', 'strain', 'compressive', 'negative', 'usdm'],
  },
  {
    category: 'Broadening & Size',
    q: 'Why does Warren-Averbach Fourier analysis show a "hook effect" at small column lengths L?',
    a: 'Truncation of high-angle peak tails during background subtraction underestimates integral breadth and causes the Fourier cosine curve A_L vs L to bend downward near L → 0.',
    check: 'Examine the 2θ integration window width around each reflection: it must span at least 6–8× FWHM on both sides of the peak center.',
    fix: 'Widen the peak fitting window, fit background linearly across clean tail endpoints, and apply Kα₂ stripping before the discrete cosine transform.',
    tags: ['warren', 'peaks', 'fourier', 'hook', 'reflection', 'order'],
  },
  {
    category: 'Intensity & Texture',
    q: 'How does preferred sample orientation distort my Rietveld and RIR quantitative results?',
    a: 'Non-random grain alignment—common in platy clays, graphite, or pressed pellets—amplifies (00l) basal reflections by 2–10× while suppressing off-axis planes, severely skewing scale factors and weight percentages.',
    check: 'Compare observed I_hkl / I_max ratios against reference PDF/ICDD card intensities; systematic divergence by plane family confirms texture.',
    fix: 'Enable March-Dollase refinement along the preferred vector H_k, or re-pack using side-loading / spray-drying to randomize crystallites.',
    tags: ['refinement', 'intensity', 'sample', 'orientation', 'texture', 'hkl', 'rir'],
  },
  {
    category: 'Refinement Convergence',
    q: 'Why does my Rietveld weighted profile factor (R_wp) suddenly oscillate or diverge?',
    a: 'Simultaneously unlocking correlated variables—such as zero-shift alongside lattice parameters, or Caglioti U/V/W alongside atomic B_iso—destabilizes the Gauss-Newton Jacobian matrix.',
    check: 'Inspect parameter correlation matrix entries > 0.85 and verify whether V became large enough to drive H² < 0.',
    fix: 'Freeze all high-order terms and follow the 5-gate sequential refinement lock sequence (Scale/Bkg → Displacement → Cell → FWHM → Atoms).',
    tags: ['rietveld', 'rwp', 'spike', 'least-squares', 'sequence', 'divergence', 'caglioti'],
  },
  {
    category: 'Peak Shift & Zero',
    q: 'Why do all my measured diffraction peaks shift systematically to lower or higher 2θ angles?',
    a: 'A constant offset independent of 2θ indicates goniometer zero-shift (Δ2θ₀), whereas a cosθ-dependent shift strongest at low 2θ indicates specimen height displacement s from the focusing circle axis.',
    check: 'Plot Δ2θ vs 2θ against an internal Si/LaB₆ standard: Δ2θ ∝ cosθ confirms height offset; flat Δ2θ confirms zero-error.',
    fix: 'Refine specimen displacement (cosθ term) separately from zero-error, or run Cohen’s/Nelson-Riley least-squares extrapolation.',
    tags: ['shift', 'displacement', 'zero', 'goniometer', 'calibration', 'cohen'],
  },
];
