import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Rocket, 
  FileCode, 
  Brain, 
  Package, 
  LifeBuoy, 
  ArrowRight, 
  Zap, 
  Sparkles,
  ChevronRight,
  Database,
  Target,
  CheckCircle,
  Copy,
  RotateCcw,
  BookOpen,
  Sliders,
  TrendingUp,
  Info,
  Search,
  Check,
  Percent,
  Calculator,
  Activity,
  Award,
  Settings,
  HelpCircle,
  Compass,
  Ruler,
  Lock,
  Unlock,
  Layers,
  Grid,
  RefreshCw,
  Flame,
  User
} from 'lucide-react';

type Topic = 'start' | 'system_overview' | 'input' | 'generators' | 'polymer_calc' | 'rietveld_protocol' | 'troubleshoot' | 'ai_advisor';

interface PlatformSectionInfo {
  id: string;
  label: string;
  group: 'Fundamentals' | 'Size & Strain' | 'Advanced Sim' | 'AI Tools' | 'Intelligence';
  description: string;
  updates: string;
  status: 'active' | 'enhanced' | 'validated';
}

const PLATFORM_SECTIONS: PlatformSectionInfo[] = [
  {
    id: 'bragg',
    label: 'Bragg Basics',
    group: 'Fundamentals',
    description: 'Deploys interplanar d-spacing calculations, scattering Q-vector parameters, and sin theta / lambda ratios derived from 2θ diffraction peaks and source wavelengths.',
    updates: 'Integrated real-time zero-shift and sample displacement error calibration corrections directly based on customizable goniometer radius mechanics.',
    status: 'validated'
  },
  {
    id: 'fwhm',
    label: 'FWHM Analysis',
    group: 'Fundamentals',
    description: 'Profiles peak shapes using Gaussian resonance distributions, Lorentzian dispersion bounds, and Voigt/Pseudo-Voigt mathematical convolution models.',
    updates: 'Enhanced non-linear least-squares fitting of FWHM ratios, allowing interactive tuning of Lorentzian weight fractions and convolution indicators.',
    status: 'enhanced'
  },
  {
    id: 'selection',
    label: 'Selection Rules',
    group: 'Fundamentals',
    description: 'Validates crystal extinction spaces mapped onto Bragg index vectors. Features live allowed/forbidden reflection indicators for various crystal classes.',
    updates: 'Added support for detailed hexagonal close-packed (HCP) space group conditions alongside diamond cubic structure validation algorithms.',
    status: 'active'
  },
  {
    id: 'preferred_orientation',
    label: 'Preferred Orientation',
    group: 'Fundamentals',
    description: 'Models crystallographic texture biases (e.g. alignment of tabular/acicular grains) using standard March-Dollace parameter scaling calculations.',
    updates: 'Integrated real-time cylinder, needle, and plate ODF calculations with dynamic 3D-projection poles.',
    status: 'validated'
  },
  {
    id: 'scherrer',
    label: 'Scherrer Method',
    group: 'Size & Strain',
    description: 'Calculates mean crystalline domains from shape broadening parameters, corrected interactively for instrumental profile contribution factors.',
    updates: 'Maps polymorphic shape coefficients (K = 0.89 to 1.20) for spherical, oval, anisotropic, or cubic grain models in real-time.',
    status: 'validated'
  },
  {
    id: 'wh',
    label: 'Williamson-Hall Method',
    group: 'Size & Strain',
    description: 'Decouples crystallite size-induced broadening from microstrain-driven peak shift variables via the canonical linear regression (beta_total*cosθ vs 4*sinθ).',
    updates: 'Supports three analytical regression models: Standard Linear, Uniform Deformation (UDM), and Anisotropic Strain energy density (USDM) curves.',
    status: 'enhanced'
  },
  {
    id: 'integral',
    label: 'Integral Breadth',
    group: 'Size & Strain',
    description: 'An alternative microstructural model estimating crystal sizes using integrated profile areas rather than peak FWHM maximum indicators.',
    updates: 'Implemented full peak baseline clipping boundaries to protect calculation convergence inside high-resolution scan environments.',
    status: 'active'
  },
  {
    id: 'integral_adv',
    label: 'IB Advanced (W-H)',
    group: 'Size & Strain',
    description: 'Integrates Integral Breadth dimensions with physical Williamson-Hall plots to refine structural microstrain across multiple crystallographic zones.',
    updates: 'Upgraded linear solver mechanics utilizing Halder-Wagner (HW) reciprocal squared matrix coordinates, improving sizing limits.',
    status: 'enhanced'
  },
  {
    id: 'wa',
    label: 'Warren-Averbach',
    group: 'Size & Strain',
    description: 'Highly rigorous Fourier core deconvolution isolating true size distributions and local microstrain fluctuations across successive reflection orders.',
    updates: 'Improved Fourier array truncation error warnings with active mathematical low-pass smoothing filters for noisy experimental datasets.',
    status: 'validated'
  },
  {
    id: 'rietveld',
    label: 'Rietveld Refinement',
    group: 'Advanced Sim',
    description: 'Optimizes entire physical powder profiles by fitting structured crystallographic models (unit cells, space groups, atomic positions, thermal B-factors).',
    updates: 'Introduced an interactive sequential locks planner, protecting least-squares algorithms against mathematical divergence.',
    status: 'enhanced'
  },
  {
    id: 'neutron',
    label: 'Neutron Diffraction',
    group: 'Advanced Sim',
    description: 'Calculates nuclear coherent and incoherent scattering structures, modeling isotope-specific length variables independent of 2θ angles.',
    updates: 'Added isotope databases for transition metal structures and solid solution phase evaluations (Cu, Fe, Ni series).',
    status: 'active'
  },
  {
    id: 'magnetic',
    label: 'Magnetic Diffraction',
    group: 'Advanced Sim',
    description: 'Models neutron spin-dependent magnetic cross-sections driven by anisotropic magnetic form factors to resolve long-range spin magnetic orders.',
    updates: 'Integrated non-collinear vector alignments for ferrimagnetic, antiferromagnetic, and modulated spiral spin structure projections.',
    status: 'enhanced'
  },
  {
    id: 'python_export',
    label: 'Python Generator',
    group: 'Advanced Sim',
    description: 'Automates custom script creation mapping raw physical algorithms into interactive Python executions supported by NumPy, SciPy, and GSAS-II.',
    updates: 'Configured automated LMFIT and xrayutilities direct structure mapping blocks.',
    status: 'validated'
  },
  {
    id: 'dl',
    label: 'PhaseID Neural Net',
    group: 'AI Tools',
    description: 'An AI engine running deep convolutional neural networks trained on crystallographic databases to identify mineral mixtures and compound phases.',
    updates: 'Speedups on parallel multi-phase sorting, rendering high-probability matching on overlapping, low-resolution specimen profiles.',
    status: 'validated'
  },
  {
    id: 'image_analysis',
    label: 'Image Analysis',
    group: 'AI Tools',
    description: 'Processes 2D detector ring images (Debye-Scherrer halos) via angular integration routines, converting pixel coordinates to 1D scan lines.',
    updates: 'Configured responsive ring masking capabilities along with dynamic hot-pixel filters for raw 2D image formats.',
    status: 'enhanced'
  },
  {
    id: 'image_gen',
    label: 'Scientific Illustrator',
    group: 'AI Tools',
    description: 'AI-assisted molecular illustrator rendering high-fidelity Crystal Information File (CIF) unit cells and atomic spatial models.',
    updates: 'Embedded cubic, tetragonal, and hexagonal crystal habit 3D rendering perspective shortcuts for research publications.',
    status: 'active'
  },
  {
    id: 'learn',
    label: 'Protocol Guide',
    group: 'Intelligence',
    description: 'Interactive educational platform hosting compliance roadmaps, sandbox validators, numeric estimators, and the operational handbook.',
    updates: 'Added this System Overview Directory detailing all 17 interactive modules, complete with active version histories and searchable guidelines.',
    status: 'validated'
  },
  {
    id: 'profile',
    label: 'Laboratory Director',
    group: 'Intelligence',
    description: 'Administers laboratory achievements, secure credentials, academic h-indexes, citations logs, and customized research archetypes.',
    updates: 'Designed a security-encrypted barcode simulation with interactive archetype presets, reflecting Ali, Elizabeth, and Joseph profiles.',
    status: 'enhanced'
  },
  {
    id: 'settings',
    label: 'Settings',
    group: 'Intelligence',
    description: 'Global workspace controller managing dynamic custom themes, audio toggle, and precise numeric calculations decimal configurations.',
    updates: 'Added standard calibration defaults for Cu, Co, Fe, Cr, and Mo anodes, enabling synchronized loading across all active calculator modules.',
    status: 'validated'
  }
];

const DRILLDOWN_SPACE_GROUP_INFO: Record<string, {
  number: number;
  hermannMauguin: string;
  schoenflies: string;
  crystalSystem: string;
  pointGroup: string;
  centrosymmetric: boolean;
  chiral: boolean;
  wyckoffSites: Array<{ site: string; multiplicity: number; coordinates: string }>;
  ops: string[];
}> = {
  'Simple Cubic': {
    number: 221,
    hermannMauguin: 'P m-3m',
    schoenflies: 'O_h^1',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    wyckoffSites: [
      { site: '1a', multiplicity: 1, coordinates: '(0, 0, 0)' },
      { site: '1b', multiplicity: 1, coordinates: '(½, ½, ½)' },
      { site: '3c', multiplicity: 3, coordinates: '(0, ½, ½)' },
      { site: '6e', multiplicity: 6, coordinates: '(x, 0, 0)' }
    ],
    ops: ['(x, y, z)', '(-x, -y, -z)', '(y, z, x)', '(-y, -z, -x)', '(z, x, y)', '(-z, -x, -y)', '(x, -y, -z)', '(-x, y, z)']
  },
  'BCC': {
    number: 229,
    hermannMauguin: 'I m-3m',
    schoenflies: 'O_h^9',
    crystalSystem: 'Cubic (Fe-type)',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    wyckoffSites: [
      { site: '2a', multiplicity: 2, coordinates: '(0, 0, 0), (½, ½, ½)' },
      { site: '6e', multiplicity: 6, coordinates: '(x, 0, 0) + B.C.' },
      { site: '12d', multiplicity: 12, coordinates: '(¼, 0, ½) + B.C.' }
    ],
    ops: ['(x, y, z)', '(-x, -y, -z)', '(x+½, y+½, z+½)', '(-x+½, -y+½, -z+½)', '(y, z, x)', '(-y, -z, -x)']
  },
  'FCC': {
    number: 225,
    hermannMauguin: 'F m-3m',
    schoenflies: 'O_h^5',
    crystalSystem: 'Cubic (Cu-type)',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    wyckoffSites: [
      { site: '4a', multiplicity: 4, coordinates: '(0, 0, 0) + F.C.' },
      { site: '4b', multiplicity: 4, coordinates: '(½, ½, ½) + F.C.' },
      { site: '8c', multiplicity: 8, coordinates: '(¼, ¼, ¼) + F.C.' }
    ],
    ops: ['(x, y, z)', '(x, y+½, z+½)', '(x+½, y, z+½)', '(x+½, y+½, z)', '(-x, -y, -z)']
  },
  'Perovskite': {
    number: 221,
    hermannMauguin: 'P m-3m',
    schoenflies: 'O_h^1',
    crystalSystem: 'Cubic (CaTiO3)',
    pointGroup: 'm-3m (O_h)',
    centrosymmetric: true,
    chiral: false,
    wyckoffSites: [
      { site: '1a', multiplicity: 1, coordinates: '(0, 0, 0) [Ti]' },
      { site: '1b', multiplicity: 1, coordinates: '(½, ½, ½) [Sr]' },
      { site: '3c', multiplicity: 3, coordinates: '(0, ½, ½) [O]' }
    ],
    ops: ['(x, y, z)', '(-x, -y, -z)', '(y, z, x)', '(z, x, y)', '(x, -y, -z)', '(-x, y, z)']
  },
  'Rutile': {
    number: 136,
    hermannMauguin: 'P 4_2/m n m',
    schoenflies: 'D_4h^14',
    crystalSystem: 'Tetragonal (TiO2)',
    pointGroup: '4/mmm (D_4h)',
    centrosymmetric: true,
    chiral: false,
    wyckoffSites: [
      { site: '2a', multiplicity: 2, coordinates: '(0, 0, 0)' },
      { site: '4f', multiplicity: 4, coordinates: '(u, u, 0)' },
      { site: '4g', multiplicity: 4, coordinates: '(u, -u, 0)' }
    ],
    ops: ['(x, y, z)', '(-x, -y, z)', '(x+½, -y+½, z+½)', '(-x+½, y+½, -z+½)', '(-y, x, w)', '(y, -x, w)']
  },
  'Quartz': {
    number: 154,
    hermannMauguin: 'P 3_2 2 1',
    schoenflies: 'D_3^6',
    crystalSystem: 'Trigonal',
    pointGroup: '32 (D_3)',
    centrosymmetric: false,
    chiral: true,
    wyckoffSites: [
      { site: '3a', multiplicity: 3, coordinates: '(x, 0, ⅓)' },
      { site: '3b', multiplicity: 3, coordinates: '(x, 0, ⅚)' },
      { site: '6c', multiplicity: 6, coordinates: '(x, y, z)' }
    ],
    ops: ['(x, y, z)', '(-y, x-y, z+⅔)', '(y-x, -x, z+⅓)', '(y, x, -z)', '(-x, y-x, -z+⅔)', '(x-y, -y, -z+⅓)']
  }
};

/**
 * Calculates transformed atomic coordinates (ab-plane projection) from [x, y] to help
 * the user visualize symmetry equivalent positions dynamically.
 */
const getSymmetryEquivalentPositionsList = (type: string, x: number, y: number): string[] => {
  const mod1 = (v: number) => {
    const m = v % 1;
    return m < 0 ? m + 1 : m;
  };
  const pts: string[] = [];
  const addPt = (px: number, py: number, pzLabel: string) => {
    const rx = parseFloat(mod1(px).toFixed(3));
    const ry = parseFloat(mod1(py).toFixed(3));
    const label = `(${rx}, ${ry}, ${pzLabel})`;
    if (!pts.includes(label)) {
      pts.push(label);
    }
  };

  if (type === 'Simple Cubic' || type === 'Perovskite') {
    addPt(x, y, 'z');
    addPt(1 - x, y, '-z');
    addPt(x, 1 - y, '-z');
    addPt(1 - x, 1 - y, 'z');
    addPt(y, x, 'z');
    addPt(1 - y, x, '-z');
    addPt(y, 1 - x, '-z');
    addPt(1 - y, 1 - x, 'z');
  } else if (type === 'BCC') {
    const coords = [
      { px: x, py: y, pz: 'z' },
      { px: 1 - x, py: y, pz: '-z' },
      { px: x, py: 1 - y, pz: '-z' },
      { px: 1 - x, py: 1 - y, pz: 'z' }
    ];
    coords.forEach(c => {
      addPt(c.px, c.py, c.pz);
      addPt(c.px + 0.5, c.py + 0.5, c.pz + '+½');
    });
  } else if (type === 'FCC') {
    const coords = [
      { px: x, py: y, pz: 'z' },
      { px: 1 - x, py: y, pz: '-z' },
      { px: x, py: 1 - y, pz: '-z' },
      { px: 1 - x, py: 1 - y, pz: 'z' }
    ];
    coords.forEach(c => {
      addPt(c.px, c.py, c.pz);
      addPt(c.px + 0.5, c.py + 0.5, c.pz + '+½');
      addPt(c.px, c.py + 0.5, c.pz + '+½');
      addPt(c.px + 0.5, c.py, c.pz);
    });
  } else if (type === 'Rutile') {
    addPt(x, y, 'z');
    addPt(1 - x, 1 - y, 'z');
    addPt(x + 0.5, 1.5 - y, 'z+½');
    addPt(1.5 - x, y + 0.5, '-z+½');
    addPt(y, x, 'z');
    addPt(1 - y, 1 - x, 'z');
  } else if (type === 'Quartz') {
    addPt(x, y, 'z');
    addPt(1 - y, x - y, 'z+⅔');
    addPt(y - x, 1 - x, 'z+⅓');
    addPt(y, x, '-z');
    addPt(1 - x, y - x, '-z+⅔');
    addPt(x - y, 1 - y, '-z+⅓');
  } else {
    addPt(x, y, 'z');
  }
  return pts;
};

/**
 * Helper to get parsed coordinate points for active rendering in the ab-plane SVG projection.
 */
const getSymmetryCoordinates = (type: string, x: number, y: number): Array<{ x: number; y: number; label: string; isSource: boolean }> => {
  const mod1 = (v: number) => {
    let m = v % 1;
    return m < 0 ? m + 1 : m;
  };
  const pts: Array<{ x: number; y: number; label: string; isSource: boolean }> = [];
  const added = new Set<string>();

  const addPt = (px: number, py: number, label: string, isSource: boolean) => {
    const rx = parseFloat(mod1(px).toFixed(3));
    const ry = parseFloat(mod1(py).toFixed(3));
    const key = `${rx}_${ry}`;
    if (!added.has(key)) {
      added.add(key);
      pts.push({ x: rx, y: ry, label, isSource });
    }
  };

  // Primary probe position is source
  addPt(x, y, 'z', true);

  if (type === 'Simple Cubic' || type === 'Perovskite') {
    addPt(1 - x, y, '-z', false);
    addPt(x, 1 - y, '-z', false);
    addPt(1 - x, 1 - y, 'z', false);
    addPt(y, x, 'z', false);
    addPt(1 - y, x, '-z', false);
    addPt(y, 1 - x, '-z', false);
    addPt(1 - y, 1 - x, 'z', false);
  } else if (type === 'BCC') {
    const coords = [
      { px: x, py: y, pz: 'z' },
      { px: 1 - x, py: y, pz: '-z' },
      { px: x, py: 1 - y, pz: '-z' },
      { px: 1 - x, py: 1 - y, pz: 'z' }
    ];
    coords.forEach(c => {
      addPt(c.px, c.py, c.pz, c.px === x && c.py === y);
      addPt(c.px + 0.5, c.py + 0.5, c.pz + '+½', false);
    });
  } else if (type === 'FCC') {
    const coords = [
      { px: x, py: y, pz: 'z' },
      { px: 1 - x, py: y, pz: '-z' },
      { px: x, py: 1 - y, pz: '-z' },
      { px: 1 - x, py: 1 - y, pz: 'z' }
    ];
    coords.forEach(c => {
      addPt(c.px, c.py, c.pz, c.px === x && c.py === y);
      addPt(c.px + 0.5, c.py + 0.5, c.pz + '+½', false);
      addPt(c.px, c.py + 0.5, c.pz + '+½', false);
      addPt(c.px + 0.5, c.py, c.pz, false);
    });
  } else if (type === 'Rutile') {
    addPt(1 - x, 1 - y, 'z', false);
    addPt(x + 0.5, 1.5 - y, 'z+½', false);
    addPt(1.5 - x, y + 0.5, '-z+½', false);
    addPt(y, x, 'z', false);
    addPt(1 - y, 1 - x, 'z', false);
  } else if (type === 'Quartz') {
    addPt(1 - y, x - y, 'z+⅔', false);
    addPt(y - x, 1 - x, 'z+⅓', false);
    addPt(y, x, '-z', false);
    addPt(1 - x, y - x, '-z+⅔', false);
    addPt(x - y, 1 - y, '-z+⅓', false);
  }
  return pts;
};

export const LearnModule: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>('start');
  const [sectionSearch, setSectionSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Improved Rietveld Protocol Interactive Substructure states
  const [protocolSubTab, setProtocolSubTab] = useState<'checklist' | 'symmetry' | 'qpa' | 'caglioti' | 'preferred' | 'python'>('checklist');
  const [checklistProgress, setChecklistProgress] = useState<number>(1);
  const [checklistUnlocked, setChecklistUnlocked] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false
  });
  const [checklistParams, setChecklistParams] = useState({
    rFactor: 95.0,
    rBragg: 85.0,
    chi2: 12.5,
    converged: false
  });

  const [symmetryActiveGroup, setSymmetryActiveGroup] = useState<string>('Simple Cubic');
  const [symCoordX, setSymCoordX] = useState<number>(0.25);
  const [symCoordY, setSymCoordY] = useState<number>(0.35);

  const [qpaPhase1Name, setQpaPhase1Name] = useState<string>('Hematite Fe2O3');
  const [qpaPhase1Scale, setQpaPhase1Scale] = useState<number>(0.0025);
  const [qpaPhase1Volume, setQpaPhase1Volume] = useState<number>(302.2);
  const [qpaPhase1Mass, setQpaPhase1Mass] = useState<number>(159.69); 
  const [qpaPhase1Z, setQpaPhase1Z] = useState<number>(6);

  const [qpaPhase2Name, setQpaPhase2Name] = useState<string>('Magnetite Fe3O4');
  const [qpaPhase2Scale, setQpaPhase2Scale] = useState<number>(0.0012);
  const [qpaPhase2Volume, setQpaPhase2Volume] = useState<number>(592.1);
  const [qpaPhase2Mass, setQpaPhase2Mass] = useState<number>(231.53);
  const [qpaPhase2Z, setQpaPhase2Z] = useState<number>(8);

  const [cagliotiU, setCagliotiU] = useState<number>(0.025);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.012);
  const [cagliotiW, setCagliotiW] = useState<number>(0.018);

  // Preferred Orientation subtab states
  const [prefRValue, setPrefRValue] = useState<number>(0.75);
  const [prefAlphaDeg, setPrefAlphaDeg] = useState<number>(45);
  const [prefFraction, setPrefFraction] = useState<number>(0.8);

  // Python Generator subtab states
  const [pySelectedLibrary, setPySelectedLibrary] = useState<string>('numpy');
  const [pyAnodeMaterial, setPyAnodeMaterial] = useState<string>('Cu');
  const [pyPeaksInput, setPyPeaksInput] = useState<string>('28.44, 47.30, 56.12, 69.13');
  const [pyAIPrompt, setPyAIPrompt] = useState<string>('');
  const [aiPyCode, setAiPyCode] = useState<string | null>(null);
  const [generatingPy, setGeneratingPy] = useState<boolean>(false);
  const [pyAIError, setPyAIError] = useState<string | null>(null);

  // Topic definitions
  const topics: { id: Topic; label: string; icon: any; color: string; bg: string; description: string }[] = [
    { id: 'start', label: 'Roadmap & Checklist', icon: Rocket, color: 'text-indigo-505 dark:text-indigo-400', bg: 'bg-indigo-500/10', description: 'Core experimental guidelines and checklist' },
    { id: 'system_overview', label: 'Platform Manual & Updates', icon: BookOpen, color: 'text-sky-550 dark:text-sky-400', bg: 'bg-sky-500/10', description: 'All modules Explained & Latest updates' },
    { id: 'input', label: 'Data Formatting sandbox', icon: FileCode, color: 'text-emerald-505 dark:text-emerald-400', bg: 'bg-emerald-500/10', description: 'Input validator and standard data formats' },
    { id: 'generators', label: 'Interactive Solvers', icon: Calculator, color: 'text-violet-505 dark:text-violet-400', bg: 'bg-violet-500/10', description: 'Live Scherrer and Bragg d-spacing calculations' },
    { id: 'polymer_calc', label: 'Polymer Crystallinity', icon: Percent, color: 'text-cyan-505 dark:text-cyan-400', bg: 'bg-cyan-500/10', description: 'Crystallinity estimator and live deconvolution plot' },
    { id: 'rietveld_protocol', label: 'Rietveld Refinement Protocol', icon: Activity, color: 'text-rose-505 dark:text-rose-400', bg: 'bg-rose-500/10', description: 'Strict sequential methodology flow' },
    { id: 'troubleshoot', label: 'Smart Diagnostic Helpdesk', icon: LifeBuoy, color: 'text-amber-505 dark:text-amber-400', bg: 'bg-amber-500/10', description: 'Keyword filterable troubleshooting FAQ' },
    { id: 'ai_advisor', label: 'AI Science Advisor', icon: Brain, color: 'text-fuchsia-505 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10', description: 'Interactive AI-powered physics consultant' },
  ];

  // Topic 7: AI Advisor State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I am your Senior AI Crystallography Expert and Physics Advisor. Ask me anything about X-ray diffraction, d-spacing, Scherrer domain sizes, Williamson-Hall plots, or Rietveld unit-cell refinement strategies. Select a quick-preset below or type your custom laboratory scenario!"
    }
  ]);
  const [aiError, setAiError] = useState<string>('');

  const submitAdvisorPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setAiLoading(true);
    setAiError('');
    
    // Add user prompt to history
    const newUserHistory = [...aiHistory, { role: 'user' as const, content: promptText }];
    setAiHistory(newUserHistory);
    setAiPrompt('');

    try {
      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: promptText,
          customKey: localStorage.getItem('xrd_custom_gemini_key') || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiHistory(prev => [...prev, { role: 'assistant' as const, content: data.text }]);
      } else {
        setAiError(data.error || "Failed to reach AI advisor. Make sure your GEMINI_API_KEY is configured in Settings.");
      }
    } catch (e: any) {
      setAiError("Connection error while calling crystallography server: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIGeneratePython = async () => {
    if (!pyAIPrompt.trim()) return;
    setGeneratingPy(true);
    setPyAIError(null);
    setAiPyCode(null);

    try {
      const context = {
        wavelength: pyAnodeMaterial === 'Cu' ? 1.54184 : pyAnodeMaterial === 'Mo' ? 0.71073 : 1.78901,
        anode: pyAnodeMaterial,
        experimentalPeaks: pyPeaksInput.split(',').map(p => p.trim()).filter(p => p !== ''),
        instrumentProfile: { u: cagliotiU, v: cagliotiV, w: cagliotiW }
      };

      const res = await fetch("/api/gemini/coder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: pyAIPrompt,
          context,
          customKey: localStorage.getItem('xrd_custom_gemini_key') || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiPyCode(data.text);
      } else {
        setPyAIError(data.error || "Failed to generate code.");
      }
    } catch (e: any) {
      setPyAIError("Network error: " + e.message);
    } finally {
      setGeneratingPy(false);
    }
  };

  const aiPresets = [
    {
      title: "LaB6 vs Si Standards",
      desc: "Calibrate zero-shift offset and displacement errors.",
      prompt: "How do I correct for zero-shift offset and specimen displacement using flat-plate LaB6 vs fine silicon powders in calibration runs?"
    },
    {
      title: "Negative W-H Intercept",
      desc: "Diagnose physical compressive strain or indexing issues.",
      prompt: "My Williamson-Hall regression has a negative size y-intercept. What does this mean physically, and is it a physical lattice contraction or a shape-factor issue?"
    },
    {
      title: "Rwp Refinement Divergence",
      desc: "Resolve dynamic least-squares matrix oscillations.",
      prompt: "Our Rietveld convergence matrix is diverging dynamically. The U, V, W Caglioti parameters are locking out. How do we sequentially lock/unlock variables?"
    }
  ];

  // Topic 1: Standard Lab Checklist state
  const [checklist, setChecklist] = useState<boolean[]>([true, true, false, false, false, false]);
  const checklistSteps = [
    { text: 'Sample prep and zero height flat mounting', desc: 'Prevents sample displacement and major 2θ positioning errors.' },
    { text: 'Calibration standard scan (LaB6 or Si powders)', desc: 'Determines instrumental FWHM and profile parameters.' },
    { text: 'Fine measurement step-size scan (≤ 0.02° 2θ)', desc: 'Ensures density of critical data points for shape analysis.' },
    { text: 'Establish baseline and background curve fit', desc: 'Locks in peak threshold above noise limits.' },
    { text: 'Deconvolution of peak profiles', desc: 'Extracts sample FWHM and isolates Gaussian/Lorentzian weight components.' },
    { text: 'Calculation of microstructural parameters & indexing', desc: 'Confirms structural model symmetry and registers grain/strain results.' }
  ];

  const toggleChecklist = (index: number) => {
    const updated = [...checklist];
    updated[index] = !updated[index];
    setChecklist(updated);
  };

  const checklistCount = checklist.filter(Boolean).length;
  const checklistScore = Math.round((checklistCount / checklistSteps.length) * 100);

  // Topic 2: Formatting Sandbox state
  const [customText, setCustomText] = useState<string>('28.44, 0.25\n47.30, 0.28\n56.12, 0.31');
  const [validationMsg, setValidationMsg] = useState<{ type: 'success' | 'error' | 'neutral'; text: string; count?: number }>({ type: 'neutral', text: 'Input standard peak formatting rules' });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const presets = [
    { label: 'Bragg Basics Indexing', content: '28.44, 47.30, 56.12, 69.13' },
    { label: 'Size & Strain Breadth Pairs', content: '28.44, 0.25\n47.30, 0.28\n56.12, 0.31\n69.13, 0.35' },
    { label: 'Rietveld / PhaseID Intensity', content: '28.20, 1500\n28.40, 4800\n28.60, 2200' }
  ];

  const handleValidation = (text: string) => {
    setCustomText(text);
    if (!text.trim()) {
      setValidationMsg({ type: 'neutral', text: 'Input data elements to validate.' });
      return;
    }
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    let validCount = 0;
    let formatError = false;

    for (const l of lines) {
      const parts = l.split(/[\s,]+/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
      if (parts.length >= 1) {
        validCount++;
      } else {
        formatError = true;
      }
    }

    if (formatError) {
      setValidationMsg({ type: 'error', text: 'Parsing warning: detected non-numeric characters or stray rows.' });
    } else {
      setValidationMsg({ 
        type: 'success', 
        text: `Success: Validated dataset (${validCount} rows formatted correctly)`, 
        count: validCount 
      });
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Topic 3: Interactive Solvers states
  const [selectedSubSolver, setSelectedSubSolver] = useState<'scherrer' | 'bragg'>('scherrer');
  
  // Scherrer solver inputs
  const [scherrerWavelength, setScherrerWavelength] = useState<number>(1.5406);
  const [scherrerK, setScherrerK] = useState<number>(0.94);
  const [scherrerTwoTheta, setScherrerTwoTheta] = useState<number>(38.2);
  const [scherrerFWHM, setScherrerFWHM] = useState<number>(0.3);
  const [scherrerResult, setScherrerResult] = useState<string>('0');

  // Bragg solver inputs
  const [braggWavelength, setBraggWavelength] = useState<number>(1.5406);
  const [braggTwoTheta, setBraggTwoTheta] = useState<number>(44.1);
  const [braggResult, setBraggResult] = useState<string>('0');

  // Run calculations
  useEffect(() => {
    // Scherrer size calculation
    const thetaRad = ((scherrerTwoTheta / 2) * Math.PI) / 180;
    const fwhmRad = (scherrerFWHM * Math.PI) / 180;
    if (fwhmRad > 0 && Math.cos(thetaRad) > 0) {
      const sizeAngstrom = (scherrerK * scherrerWavelength) / (fwhmRad * Math.cos(thetaRad));
      const sizeNm = sizeAngstrom / 10;
      setScherrerResult(sizeNm.toFixed(2));
    } else {
      setScherrerResult('Error');
    }
  }, [scherrerWavelength, scherrerK, scherrerTwoTheta, scherrerFWHM]);

  useEffect(() => {
    // Bragg spacing calculation (d = lambda / (2 * sin(theta)))
    const thetaRad = ((braggTwoTheta / 2) * Math.PI) / 180;
    if (Math.sin(thetaRad) > 0) {
      const dSpacingValue = braggWavelength / (2 * Math.sin(thetaRad));
      setBraggResult(dSpacingValue.toFixed(4));
    } else {
      setBraggResult('Error');
    }
  }, [braggWavelength, braggTwoTheta]);

  // Topic 4: Polymer Crystallinity Index Estimator state
  const [polAc, setPolAc] = useState<number>(1200); // crystalline peak area
  const [polAa, setPolAa] = useState<number>(800);  // amorphous area
  const [polNoise, setPolNoise] = useState<number>(15); // background noise level
  const polymerCI = Math.round((polAc / (polAc + polAa)) * 100);

  // Generate responsive SVG path representing polymer deconvolution scan
  const generatePolymerScanPath = () => {
    const pointsCount = 80;
    const width = 450;
    const height = 150;
    const dPoints: string[] = [];
    const crystallinePlotPoints: string[] = [];
    const amorphousPlotPoints: string[] = [];

    // Base background and profile curves
    for (let i = 0; i <= pointsCount; i++) {
      const x = (i / pointsCount) * width;
      const t = (i / pointsCount) * 100; // range 0 to 100

      // 1. Amorphous Halo: Gaussian broad peak centered at x = 50, sigma = 18
      const ampA = (polAa / 2000) * 80;
      const ya = ampA * Math.exp(-Math.pow(t - 50, 2) / (2 * Math.pow(18, 2)));

      // 2. Crystalline Peak: Lorentzian-like narrow peak centered at x = 42, width gamma = 4
      const ampC1 = (polAc / 2000) * 110;
      const yc1 = ampC1 * (Math.pow(4, 2) / (Math.pow(t - 42, 2) + Math.pow(4, 2)));

      // 3. Second Crystalline peak centered at x = 58
      const ampC2 = (polAc / 2000) * 45;
      const yc2 = ampC2 * (Math.pow(3, 2) / (Math.pow(t - 58, 2) + Math.pow(3, 2)));

      // 4. Random noise simulation
      const noiseTerm = (Math.sin(i * 1.5) * 2) * (polNoise / 30);

      const totalYVal = height - (ya + yc1 + yc2 + noiseTerm + 15);
      const amorphousYVal = height - (ya + 15);
      const crystallineYVal = height - (yc1 + yc2 + 15);

      dPoints.push(`${x},${totalYVal}`);
      crystallinePlotPoints.push(`${x},${crystallineYVal}`);
      amorphousPlotPoints.push(`${x},${amorphousYVal}`);
    }

    return {
      total: `M 0,${height} L ` + dPoints.join(' L ') + ` L ${width},${height} Z`,
      crystalline: `M 0,${height} L ` + crystallinePlotPoints.join(' L ') + ` L ${width},${height} Z`,
      amorphous: `M 0,${height} L ` + amorphousPlotPoints.join(' L ') + ` L ${width},${height} Z`,
    };
  };

  const scanPaths = generatePolymerScanPath();

  // Topic 5: Rietveld Setup sequence steps
  const rietveldSteps = [
    {
      step: 1,
      title: 'Background Profile & Scale Factor',
      desc: 'Lock in standard intensity weights and initial background shape functions before attempting index-shifting parameters.',
      relevance: 'CRITICAL',
      status: 'Initial Scale Alignment'
    },
    {
      step: 2,
      title: 'Zero-Shift & Specimen Displacement',
      desc: 'Allows systematic physical correction of peak offset positions across the full 2θ scan landscape.',
      relevance: 'HIGH',
      status: 'Goniometer Alignment'
    },
    {
      step: 3,
      title: 'Unit Cell Lattice Parameters (a, b, c, alpha, beta, gamma)',
      desc: 'Aligns the specific peak indexing hkl coordinates to structure model profiles. Crucial before fitting shapes.',
      relevance: 'CRITICAL',
      status: 'Bravais Lattice Indexing'
    },
    {
      step: 4,
      title: 'Caglioti Peak Profile Parameters (U, V, W)',
      desc: 'Deconvolution of peak widths: adjusts Gauss/Lorentz fractions and spatial broadening of individual reflection shapes.',
      relevance: 'MODERATE',
      status: 'IRF Shape Modification'
    },
    {
      step: 5,
      title: 'Atomic fractional coordinates (x, y, z) & Debye-Waller B(iso)',
      desc: 'Symmetry structure optimization: refines structural density amplitudes and coordinates. Do this ONLY after positions align perfectly.',
      relevance: 'EXTREME',
      status: 'Symmetry Refinement Complete'
    }
  ];

  // Topic 6: Diagnostics state with search filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [diagnosticFAQs, setDiagnosticFAQs] = useState([
    {
      q: 'Why is my calculated crystallite size converging immediately to 0?',
      a: 'This represents a broaden-limit block. It occurs when your experimental specimen profile FWHM is smaller than or equal to your instrumental standard parameters (e.g. FWHM_inst >= FWHM_total). This indicates that the peak broadening is completely dominated by the instrument configuration itself rather than size. Re-measure with a higher-resolution slit or evaluate a different calibration sample.',
      tags: ['size', 'scherrer', 'instrumental', 'broadening', 'fwhm', 'zero']
    },
    {
      q: 'What does a negative slope in a Williamson-Hall (W-H) plot mean physically?',
      a: 'In a thermodynamic context, a standard W-H plot slope indicates tensile strain. A negative slope typically points to microstrain compression (compressive lattice strain) or potential systematic indexing errors of sample hkl planes. Review your d-spacing entries or cross-check using the anisotropic USDM model.',
      tags: ['slope', 'williamson', 'strain', 'compressive', 'negative', 'usdm']
    },
    {
      q: 'Why does the Warren-Averbach peak analysis fail with complex lattices?',
      a: 'The Warren-Averbach method is highly sensitive and mathematically relies on Fourier series deconvolution of multiple orders of reflections (e.g., [111] paired with [222]). If planes are highly mixed, overlapping, or single peaks are weak, the Fourier analysis suffers from noise truncation errors.',
      tags: ['warren', 'peaks', 'complex', 'fourier', 'reflection', 'order']
    },
    {
      q: 'How does preferred sample orientation manifest on my refinement plots?',
      a: 'Texture (preferred crystallographic orientation) occurs when grains/platelets are not orientationally random (often induced by grinding, rolling, or pressing). This causes severe elevation or attenuation of selective Bragg hkl intensity peaks compared to textbook files, causing fitting divergence.',
      tags: ['refinement', 'intensity', 'sample', 'orientation', 'texture', 'hkl']
    },
    {
      q: 'Why does my Rietveld fitting divergence coefficient (Rwp) suddenly spike?',
      a: 'Sudden mathematical divergence during least-squares fitting is typically caused by adjusting too many parameters simultaneously (e.g., optimizing structural coordinates and Caglioti parameters broadness variables in the exact same cycle). Always follow our strict sequential Rietveld guide and lock parameters incrementally.',
      tags: ['rietveld', 'rwp', 'spike', 'least-squares', 'sequence', 'divergence']
    }
  ]);

  const filteredFAQs = diagnosticFAQs.filter(faq => {
    const normalized = faq.q.toLowerCase() + ' ' + faq.a.toLowerCase() + ' ' + faq.tags.join(' ');
    return normalized.includes(searchTerm.toLowerCase());
  });

  return (
    <div id="protocol-guide-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 min-h-[750px]">
      
      {/* Navigation Sidebar Card */}
      <div className="lg:col-span-4 xl:col-span-3 space-y-6">
        <div id="kb-navigation-card" className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2rem] shadow-xl border border-slate-200 dark:border-white/10 relative p-6 space-y-6">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 font-sans">Lab Intelligence Hub</h2>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none mt-2 font-sans">Protocol Guides</p>
          </div>
          
          <div className="space-y-1.5">
            {topics.map((topic) => (
              <button
                id={`btn-${topic.id}`}
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/btn relative overflow-hidden ${
                  activeTopic === topic.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                    : 'text-slate-550 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <topic.icon className={`w-4 h-4 shrink-0 transition-transform group-hover/btn:scale-110 relative z-10 ${activeTopic === topic.id ? (activeTopic === 'start' ? 'text-indigo-400 dark:text-indigo-600' : 'text-fuchsia-400 dark:text-fuchsia-600') : topic.color}`} />
                <div className="text-left relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-wider leading-tight">{topic.label}</p>
                  <p className="text-[9px] opacity-70 font-semibold line-clamp-1">{topic.description}</p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-1 pt-3 border-t border-slate-100 dark:border-slate-800">
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 relative group/card overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover/card:opacity-10 transition-opacity">
                   <Target className="w-12 h-12 text-indigo-500" />
                </div>
                <h3 className="text-[9.5px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                  <Info size={10} /> Operational Grade
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-bold font-sans">
                  Academic compliance guidelines comply with peak analysis index codes for peer-reviewed journal submission.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Experimental Sandbox & Display Container */}
      <div className="lg:col-span-8 xl:col-span-9">
        <div className="bg-white dark:bg-slate-905 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden h-full flex flex-col min-h-[600px]">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-8 lg:p-12 flex-1"
            >
              
              {/* Topic 1: Standard Lab Roadmap / Checklist */}
              {activeTopic === 'start' && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 font-mono">Phase Alpha</span>
                       <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none font-sans">
                      Academic Lab Refinement Roadmap
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed font-sans">
                      Achieve standard peer-reviewed crystallography excellence. Complete and verify our operational protocol checklist to score your dataset and structural models.
                    </p>
                  </div>
                  
                  {/* Score Indicator Badge */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-150 dark:border-slate-850 p-6 flex flex-col justify-between relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5">
                         <Award className="w-24 h-24 text-indigo-500" />
                       </div>
                       <div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Crystallography Compliance Score</span>
                         <p className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{checklistScore}%</p>
                       </div>
                       
                       <div className="mt-4 space-y-2">
                         <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                           <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${checklistScore}%` }} />
                         </div>
                         <p className="text-[10px] text-slate-505 dark:text-slate-400 font-black uppercase tracking-wider">
                           {checklistScore === 100 
                             ? 'Journal Ready (Grade A+)' 
                             : checklistScore >= 60 
                               ? 'Advanced Framework Complete (Grade B)' 
                               : 'Preliminary Alignment Phase (Grade C)'}
                         </p>
                       </div>
                    </div>

                    <div className="md:col-span-8 bg-slate-900 rounded-[2rem] p-6 border border-slate-800 flex items-center gap-6">
                      <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shrink-0">
                         <Target className="w-8 h-8 text-indigo-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-1 font-sans">System Standard Core</h4>
                        <p className="text-xs text-slate-350 leading-relaxed font-bold font-sans">
                          Our mathematical routines leverage localized peak-fitting optimization algorithms. Maintaining zero specimen offset improves alignment convergence models by up to 45%.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Section */}
                  <div className="space-y-3 pt-2">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CheckCircle size={14} className="text-indigo-500" /> Interactive RefRef Compliance Audit
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {checklistSteps.map((step, idx) => (
                         <button
                           id={`checklist-item-${idx}`}
                           key={idx}
                           onClick={() => toggleChecklist(idx)}
                           className={`p-4 rounded-2xl text-left border transition-all flex gap-4 ${
                             checklist[idx]
                               ? 'bg-indigo-500/5 border-indigo-500/20 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100'
                               : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-500'
                           }`}
                         >
                           <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                             checklist[idx] 
                               ? 'bg-indigo-600 text-white border-indigo-600' 
                               : 'border-slate-300 dark:border-slate-700 bg-transparent'
                           }`}>
                             {checklist[idx] && <Check size={12} strokeWidth={3} />}
                           </div>
                           <div>
                             <h4 className={`text-xs font-black uppercase tracking-tight leading-normal ${checklist[idx] ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                               {step.text}
                             </h4>
                             <p className="text-[10px] text-slate-455 dark:text-slate-400 font-bold leading-normal mt-1">{step.desc}</p>
                           </div>
                         </button>
                       ))}
                     </div>
                  </div>

                </div>
              )}

              {/* Topic: Platform System Overview & Updates */}
              {activeTopic === 'system_overview' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-sky-500/20 font-mono">Platform Documentation</span>
                       <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Suite Manual & Functional Updates
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans font-medium">
                      Comprehensive theoretical reference of all crystal structure modeling, profile fitting, neural network classifiers, and magnetic calculators within the XRD-Calc Pro ecosystem.
                    </p>
                  </div>

                  {/* Custom Directory Filter Toolbar */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      
                      {/* Search bar */}
                      <div className="md:col-span-5 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-855">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search modules & updates..."
                          value={sectionSearch}
                          onChange={(e) => setSectionSearch(e.target.value)}
                          className="bg-transparent w-full border-none focus:outline-none text-slate-805 dark:text-slate-200 placeholder-slate-400 text-xs font-mono font-medium"
                        />
                        {sectionSearch && (
                          <button 
                            onClick={() => setSectionSearch('')}
                            className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-605 tracking-wider"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Group filters */}
                      <div className="md:col-span-12 lg:col-span-7 flex flex-wrap gap-1.5 items-center justify-start lg:justify-end">
                        {['All', 'Fundamentals', 'Size & Strain', 'Advanced Sim', 'AI Tools', 'Intelligence'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setSelectedGroup(g)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                              selectedGroup === g
                                ? 'bg-slate-905 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>

                    </div>

                    {/* Counter indicator */}
                    <div className="flex justify-between items-center px-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <span>Total Available: {PLATFORM_SECTIONS.length} Modules</span>
                      <span className="text-indigo-500 dark:text-indigo-455 font-black">
                        Filtered View: {
                          PLATFORM_SECTIONS.filter(sec => {
                            const matchesGroup = selectedGroup === 'All' || sec.group === selectedGroup;
                            const matchesSearch = sectionSearch.trim() === '' || 
                              sec.label.toLowerCase().includes(sectionSearch.toLowerCase()) || 
                              sec.description.toLowerCase().includes(sectionSearch.toLowerCase()) ||
                              sec.updates.toLowerCase().includes(sectionSearch.toLowerCase()) ||
                              sec.id.toLowerCase().includes(sectionSearch.toLowerCase());
                            return matchesGroup && matchesSearch;
                          }).length
                        } Sections found
                      </span>
                    </div>
                  </div>

                  {/* Bento Grid layout of sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PLATFORM_SECTIONS.filter(sec => {
                      const matchesGroup = selectedGroup === 'All' || sec.group === selectedGroup;
                      const matchesSearch = sectionSearch.trim() === '' || 
                        sec.label.toLowerCase().includes(sectionSearch.toLowerCase()) || 
                        sec.description.toLowerCase().includes(sectionSearch.toLowerCase()) ||
                        sec.updates.toLowerCase().includes(sectionSearch.toLowerCase()) ||
                        sec.id.toLowerCase().includes(sectionSearch.toLowerCase());
                      return matchesGroup && matchesSearch;
                    }).map((sec) => (
                      <div 
                        key={sec.id} 
                        className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-855 flex flex-col justify-between space-y-4 hover:border-sky-505/20 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="space-y-2">
                          
                          {/* Card Top Label Row */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Color coded Badge for groups */}
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                sec.group === 'Fundamentals' 
                                  ? 'bg-indigo-505/10 text-indigo-550' 
                                  : sec.group === 'Size & Strain'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : sec.group === 'Advanced Sim'
                                  ? 'bg-rose-500/10 text-rose-505'
                                  : sec.group === 'AI Tools'
                                  ? 'bg-cyan-500/10 text-cyan-505'
                                  : 'bg-violet-500/10 text-violet-505'
                              }`}>
                                {sec.group}
                              </span>
                              
                              {/* System ID Tag */}
                              <span className="text-[7.5px] font-mono bg-white dark:bg-slate-900 text-slate-450 px-1.5 py-0.5 rounded border border-slate-105 dark:border-slate-800">
                                id: {sec.id}
                              </span>
                            </div>

                            {/* Status Label */}
                            <span className={`text-[7.5px] font-black uppercase tracking-widest flex items-center gap-1 ${
                              sec.status === 'validated'
                                ? 'text-emerald-505'
                                : sec.status === 'enhanced'
                                ? 'text-indigo-505'
                                : 'text-amber-505'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                sec.status === 'validated'
                                  ? 'bg-emerald-505 animate-pulse'
                                  : sec.status === 'enhanced'
                                  ? 'bg-indigo-550'
                                  : 'bg-amber-550'
                              }`} />
                              {sec.status === 'validated' ? 'Validated' : sec.status === 'enhanced' ? 'Enhanced' : 'Operational'}
                            </span>
                          </div>

                          {/* Section name */}
                          <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            {sec.label}
                          </h3>

                          {/* Description */}
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-medium">
                            {sec.description}
                          </p>

                        </div>

                        {/* Dedicated Updates Panel in Card */}
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-805 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-sky-550 dark:text-sky-400 font-semibold">
                            <Sparkles size={11} className="shrink-0 text-sky-555 animate-pulse" />
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">Latest Update (v2.5.0)</span>
                          </div>
                          <p className="text-[9.5px] text-slate-550 dark:text-slate-300 font-bold leading-normal font-sans font-medium">
                            {sec.updates}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic 2: Standard Formats with Interactive Sandbox */}
              {activeTopic === 'input' && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Data Parser & Sandbox Validation
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      Diffraction processing engines require clean formatted structures to calculate FWHM and crystallite dimensions. Select a format preset or paste custom data.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Presets and Copy board */}
                    <div className="xl:col-span-5 space-y-4">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aesthetic Presets</h3>
                       <div className="space-y-2">
                         {presets.map((p, idx) => (
                           <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex justify-between items-center group">
                             <div>
                               <p className="text-[10px] font-black uppercase text-slate-855 dark:text-slate-300">{p.label}</p>
                               <p className="text-[9.5px] font-mono text-slate-400 mt-1 line-clamp-1">{p.content.replace(/\n/g, ' | ')}</p>
                             </div>
                             <button
                               onClick={() => {
                                 handleValidation(p.content);
                                 copyToClipboard(p.content, idx);
                               }}
                               className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                             >
                               {copiedIndex === idx ? <Check size={12} className="text-indigo-500" /> : <Copy size={12} />}
                               {copiedIndex === idx ? 'Copied' : 'Load'}
                             </button>
                           </div>
                         ))}
                       </div>

                       <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-150/35 flex gap-3.5 items-start">
                          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <div className="text-[10.5px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed font-sans">
                            <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Strict Standard:</span> FWHM values should always reside in 2θ degrees. Converting values to radians is processed internally inside deep computation stages.
                          </div>
                       </div>
                    </div>

                    {/* Parser Playground */}
                    <div className="xl:col-span-7 space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Database size={12} /> Live Formatting Validation
                        </label>
                        <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full ${
                          validationMsg.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : validationMsg.type === 'error' 
                              ? 'bg-rose-500/10 text-rose-600' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-405'
                        }`}>
                          {validationMsg.text}
                        </span>
                      </div>

                      <div className="relative">
                        <textarea
                          id="validator-sandbox-text"
                          value={customText}
                          onChange={(e) => handleValidation(e.target.value)}
                          placeholder="28.44, 0.25&#10;47.30, 0.28"
                          className="w-full h-44 px-4 py-3 bg-slate-950 text-slate-300 border border-slate-800 focus:ring-1 focus:ring-indigo-500/50 rounded-2rem font-mono text-xs leading-relaxed outline-none transition-all"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 font-mono text-[10px] text-slate-455">
                        <p className="font-bold text-slate-355 uppercase tracking-wider mb-2">Live Output Diagnostic:</p>
                        {validationMsg.type === 'success' && validationMsg.count ? (
                          <div className="space-y-1 text-emerald-455">
                            <p>&gt; Valid rows scanned: {validationMsg.count}</p>
                            <p>&gt; Structured coordinate alignment: SECURE</p>
                            <p>&gt; Array initialization: COMPLIANT</p>
                          </div>
                        ) : (
                          <div className="text-slate-500">
                            <p>&gt; Awaiting standard dataset alignment rows...</p>
                            <p>&gt; Validation protocol: STANDBY</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Topic 3: Interactive Quick Solvers */}
              {activeTopic === 'generators' && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Localized Microstructural Solvers
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      Verify calculations and formula math directly. Switch between the Scherrer Crystallite Size logic and Bragg d-Spacing solver.
                    </p>
                  </div>

                  {/* Sub-solver toggles */}
                  <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    {(['scherrer', 'bragg'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubSolver(sub)}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                          selectedSubSolver === sub
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
                        }`}
                      >
                        {sub === 'scherrer' ? 'Scherrer Size Solver' : "Bragg d-Spacing"}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                     
                     {/* Controller Interface */}
                     <div className="md:col-span-7 space-y-4">
                       {selectedSubSolver === 'scherrer' ? (
                         <div className="space-y-4">
                           {/* Wavelength Slider */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                               <span>Radiation Wavelength (λ)</span>
                               <span className="font-mono text-indigo-505 dark:text-indigo-400">{scherrerWavelength.toFixed(4)} Å</span>
                             </div>
                             <input
                               type="range"
                               min="0.5"
                               max="3.0"
                               step="0.0001"
                               value={scherrerWavelength}
                               onChange={(e) => setScherrerWavelength(parseFloat(e.target.value))}
                               className="w-full accent-indigo-600"
                             />
                           </div>

                           {/* K factor Slider */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                               <span>Shape factor Constant (K)</span>
                               <span className="font-mono text-indigo-505 dark:text-indigo-400">{scherrerK.toFixed(3)}</span>
                             </div>
                             <input
                               type="range"
                               min="0.6"
                               max="1.5"
                               step="0.01"
                               value={scherrerK}
                               onChange={(e) => setScherrerK(parseFloat(e.target.value))}
                               className="w-full accent-indigo-600"
                             />
                             <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                               <span>0.89 (Ovals)</span>
                               <span>0.94 (Spheres)</span>
                               <span>1.20 (Cubes)</span>
                             </div>
                           </div>

                           {/* Peak Position 2theta Slider */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                               <span>Peak Position (2θ)</span>
                               <span className="font-mono text-indigo-505 dark:text-indigo-400">{scherrerTwoTheta.toFixed(2)}°</span>
                             </div>
                             <input
                               type="range"
                               min="10"
                               max="120"
                               step="0.1"
                               value={scherrerTwoTheta}
                               onChange={(e) => setScherrerTwoTheta(parseFloat(e.target.value))}
                               className="w-full accent-indigo-600"
                             />
                           </div>

                           {/* FWHM Slider */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                               <span>Full Width Half Max (FWHM)</span>
                               <span className="font-mono text-indigo-505 dark:text-indigo-400">{scherrerFWHM.toFixed(3)}° 2θ</span>
                             </div>
                             <input
                               type="range"
                               min="0.05"
                               max="1.5"
                               step="0.01"
                               value={scherrerFWHM}
                               onChange={(e) => setScherrerFWHM(parseFloat(e.target.value))}
                               className="w-full accent-indigo-600"
                             />
                           </div>
                         </div>
                       ) : (
                         <div className="space-y-4">
                           {/* Bragg Wavelength Slider */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                               <span>Radiation Wavelength (λ)</span>
                               <span className="font-mono text-indigo-505 dark:text-indigo-400">{braggWavelength.toFixed(4)} Å</span>
                             </div>
                             <input
                               type="range"
                               min="0.5"
                               max="3.0"
                               step="0.0001"
                               value={braggWavelength}
                               onChange={(e) => setBraggWavelength(parseFloat(e.target.value))}
                               className="w-full accent-indigo-600"
                             />
                           </div>

                           {/* Bragg Peak Position 2theta Slider */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                               <span>Incident Reflection angle (2θ)</span>
                               <span className="font-mono text-indigo-505 dark:text-indigo-400">{braggTwoTheta.toFixed(1)}°</span>
                             </div>
                             <input
                               type="range"
                               min="5"
                               max="150"
                               step="0.1"
                               value={braggTwoTheta}
                               onChange={(e) => setBraggTwoTheta(parseFloat(e.target.value))}
                               className="w-full accent-indigo-600"
                             />
                           </div>
                         </div>
                       )}
                     </div>

                     {/* Math and Final Solved Output display */}
                     <div className="md:col-span-5 space-y-4">
                       <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-center space-y-4">
                         
                         {selectedSubSolver === 'scherrer' ? (
                           <>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Solved Crystallite Dimension</span>
                             <div className="py-2">
                               <p className="text-4xl font-black text-white font-mono tracking-tighter leading-none">
                                 {scherrerResult} <span className="text-xl text-slate-400">nm</span>
                               </p>
                               <span className="text-[10px] text-indigo-400 font-mono italic mt-1 block">({(parseFloat(scherrerResult)*10).toFixed(1)} Å)</span>
                             </div>
                             <div className="h-px bg-slate-800 w-12 mx-auto" />
                             <div className="text-[10px] font-mono text-slate-400 space-y-1 leading-normal">
                               <p>Equation Applied: D = (K·λ) / (β·cosθ)</p>
                               <p>Calculated θ: {((scherrerTwoTheta / 2)).toFixed(3)}°</p>
                               <p>Calculated beta (rad): {(((scherrerFWHM * Math.PI) / 180)).toFixed(5)} rad</p>
                             </div>
                           </>
                         ) : (
                           <>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Solved Interplanar Spacing (d)</span>
                             <div className="py-2">
                               <p className="text-4xl font-black text-white font-mono tracking-tighter leading-none">
                                 {braggResult} <span className="text-xl text-slate-400">Å</span>
                               </p>
                               <span className="text-[10px] text-indigo-400 font-mono italic mt-1 block">({(parseFloat(braggResult)/10).toFixed(4)} nm)</span>
                             </div>
                             <div className="h-px bg-slate-800 w-12 mx-auto" />
                             <div className="text-[10px] font-mono text-slate-400 space-y-1 leading-normal">
                               <p>Equation Applied: d = λ / (2·sinθ)</p>
                               <p>Calculated sin(θ): {Math.sin(((braggTwoTheta / 2) * Math.PI) / 180).toFixed(4)}</p>
                               <p>Q-Vector Module: {(4 * Math.PI / parseFloat(braggResult)).toFixed(4)} Å⁻¹</p>
                             </div>
                           </>
                         )}

                         <button 
                           onClick={() => navigator.clipboard.writeText(selectedSubSolver === 'scherrer' ? `${scherrerResult} nm` : `${braggResult} Å`)}
                           className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                         >
                           Copy Solved output
                         </button>
                       </div>

                       <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 text-slate-550 dark:text-slate-400 leading-normal font-sans">
                         <h4 className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5 leading-none">
                           <Info size={11} className="text-indigo-500" /> Physical Principle
                         </h4>
                         <p className="text-[10px] leading-relaxed font-bold">
                           {selectedSubSolver === 'scherrer' 
                             ? 'The Scherrer equation models the inverse relationship between peak width and crystallite volume, assuming a stress-free environment. For strain-affected samples, the Williamson-Hall method must be preferred.'
                             : 'Bragg spacing defines structural interplanar periodicity. Shifted d-spacing deviations can monitor external stresses, solid solutions, thermal expansion or mechanical strain deformations.'}
                         </p>
                       </div>
                     </div>

                  </div>
                </div>
              )}

              {/* Topic 4: Polymer Crystallinity Index Estimator with Live SVG deconvolution plot */}
              {activeTopic === 'polymer_calc' && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Polymer Crystallinity Index Estimator
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      Establish polymer deconvolution. Adjust crystalline peak area and amorphous background halo values to simulate polymer structure ratios instantly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    
                    {/* Controls */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-850 space-y-6">
                      
                      {/* Formula display */}
                      <div className="text-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                         <span className="text-[9px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">Crystallinity Index (CI) Formula</span>
                         <pre className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-2">CI (%) = [Ac / (Ac + Aa)] × 100</pre>
                      </div>

                      {/* Slider Ac */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <span>Crystalline Peak Area (Ac)</span>
                          <span className="font-mono text-cyan-505 dark:text-cyan-400">{polAc} r.u.</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="4000"
                          step="50"
                          value={polAc}
                          onChange={(e) => setPolAc(parseInt(e.target.value))}
                          className="w-full accent-cyan-500"
                        />
                      </div>

                      {/* Slider Aa */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <span>Amorphous Halo Area (Aa)</span>
                          <span className="font-mono text-indigo-505 dark:text-indigo-400">{polAa} r.u.</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="4000"
                          step="50"
                          value={polAa}
                          onChange={(e) => setPolAa(parseInt(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      {/* Calculated result display */}
                      <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-center">
                         <span className="text-[9.5px] font-black uppercase tracking-wide text-indigo-500 dark:text-indigo-400">Estimated Crystallinity Index</span>
                         <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1 font-mono">{polymerCI}%</p>
                         <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">Crystalline segment fraction: {(polymerCI/100).toFixed(2)}</p>
                      </div>

                    </div>

                    {/* Chart visual representation */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                      
                      {/* Deconvolution Plot Card */}
                      <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-900 shadow-inner flex flex-col justify-between flex-1 min-h-[220px]">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Deconvolution Profile</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">X-Scale: Representative 2θ</span>
                        </div>

                        {/* Interactive SVG path view */}
                        <div className="w-full flex justify-center py-2 relative">
                          <svg viewBox="0 0 450 150" className="w-full h-auto overflow-visible select-none max-w-[400px]">
                            {/* Area 1: Amorphous fill */}
                            <path 
                              d={scanPaths.amorphous} 
                              fill="rgba(99, 102, 241, 0.08)" 
                              stroke="rgba(99, 102, 241, 0.3)" 
                              strokeWidth={1}
                              strokeDasharray="4 4"
                            />

                            {/* Area 2: Crystalline peak area */}
                            <path 
                              d={scanPaths.crystalline} 
                              fill="rgba(6, 182, 212, 0.08)" 
                              stroke="rgba(6, 182, 212, 0.3)" 
                              strokeWidth={1}
                            />

                            {/* Line 3: Overall scan path (Sum of curves + noise) */}
                            <path 
                              d={scanPaths.total.replace(' L 450,150 Z', '')} 
                              fill="none" 
                              stroke="#c084fc" 
                              strokeWidth={2}
                            />

                            {/* Simple peak lines indicator */}
                            <line x1="189" y1="20" x2="189" y2="135" stroke="rgba(6, 182, 212, 0.2)" strokeWidth={1} strokeDasharray="2 2" />
                            <text x="189" y="15" fill="#22d3ee" fontSize="7" fontFamily="monospace" textAnchor="middle">Ac peaks (111)</text>

                            <line x1="225" y1="60" x2="225" y2="135" stroke="rgba(99, 102, 241, 0.2)" strokeWidth={1} strokeDasharray="2 2" />
                            <text x="225" y="55" fill="#818cf8" fontSize="7" fontFamily="monospace" textAnchor="middle">Aa broad halo</text>

                            {/* Baseline */}
                            <line x1="0" y1="135" x2="450" y2="135" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                          </svg>
                        </div>

                        {/* Legend row */}
                        <div className="flex gap-4 items-center justify-center pt-2 text-[9px] font-black uppercase text-slate-400 font-sans">
                           <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 bg-purple-500 rounded" /> Overall profile fit
                           </div>
                           <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 bg-cyan-500 rounded" /> Crystalline Area (Ac)
                           </div>
                           <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 bg-indigo-500/40 rounded border border-indigo-400 border-dashed" /> Amorphous Halo (Aa)
                           </div>
                        </div>

                      </div>

                      {/* Explanation note card */}
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                        Thermoplastics (e.g. Polybutylene adipate terephthalate or low-density polyethylene) exhibit a distinctive "amorphous hump" around 15–25° (2θ). The crystalline index maps the structural degradation or strength profile of polymers.
                      </p>

                    </div>

                  </div>
                </div>
              )}

              {/* Topic 5: Rietveld Refinement timeline steps & Advanced Protocol Sandbox */}
              {activeTopic === 'rietveld_protocol' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-rose-500/20 font-mono">Academic Protocol</span>
                       <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Advanced Crystallographic Refinement Manual
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      Refining physical material parameters to matches raw scan intensities is a non-linear optimization task. Explore our dynamic sequencer, symmetry operator guides, and calibration helpers.
                    </p>
                  </div>

                  {/* Sub-Tabs Row */}
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setProtocolSubTab('checklist')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        protocolSubTab === 'checklist' 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Lock size={12} className={protocolSubTab === 'checklist' ? 'text-white' : 'text-rose-500'} /> 1. Sequential Locks
                    </button>
                    <button 
                      onClick={() => setProtocolSubTab('symmetry')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        protocolSubTab === 'symmetry' 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Compass size={12} className={protocolSubTab === 'symmetry' ? 'text-white' : 'text-cyan-500'} /> 2. Symmetry Operations
                    </button>
                    <button 
                      onClick={() => setProtocolSubTab('qpa')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        protocolSubTab === 'qpa' 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Layers size={12} className={protocolSubTab === 'qpa' ? 'text-white' : 'text-amber-500'} /> 3. Quantitative QPA
                    </button>
                    <button 
                      onClick={() => setProtocolSubTab('caglioti')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        protocolSubTab === 'caglioti' 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Ruler size={12} className={protocolSubTab === 'caglioti' ? 'text-white' : 'text-violet-500'} /> 4. Caglioti FWHM
                    </button>
                    <button 
                      onClick={() => setProtocolSubTab('preferred')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        protocolSubTab === 'preferred' 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Target size={12} className={protocolSubTab === 'preferred' ? 'text-white' : 'text-emerald-500'} /> 5. Preferred Orientation (M-D)
                    </button>
                    <button 
                      onClick={() => setProtocolSubTab('python')}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        protocolSubTab === 'python' 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <FileCode size={12} className={protocolSubTab === 'python' ? 'text-white' : 'text-amber-500'} /> 6. Script Generator SDK
                    </button>
                  </div>

                  {/* SUBTAB 1 - SEQUENTIAL LOCKS */}
                  {protocolSubTab === 'checklist' && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                      
                      {/* Left side: Fit Progress Card */}
                      <div className="xl:col-span-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-850 space-y-5">
                         <div>
                            <span className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-wider">Least-Squares Workspace</span>
                            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight mt-1">Refinement Convergence</h3>
                         </div>

                         <div className="space-y-3.5">
                            {/* Rwp */}
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850">
                               <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                                 <span>Weighted Profile (Rwp)</span>
                                 <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Goal &lt; 10%</span>
                               </div>
                               <p className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{checklistParams.rFactor.toFixed(1)}%</p>
                            </div>

                            {/* Rbragg */}
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850">
                               <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                                 <span>Bragg Factor (Rb)</span>
                                 <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Goal &lt; 5%</span>
                               </div>
                               <p className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{checklistParams.rBragg.toFixed(1)}%</p>
                            </div>

                            {/* Chi2 */}
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850">
                               <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                                 <span>Goodness of Fit (χ²)</span>
                                 <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Goal ~ 1.0</span>
                               </div>
                               <p className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{checklistParams.chi2.toFixed(2)}</p>
                            </div>
                         </div>

                         {/* Status bar */}
                         <div className={`p-4 rounded-2xl border text-center ${
                             checklistParams.converged 
                               ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                               : 'bg-indigo-550/10 border-indigo-500/20 text-indigo-550 dark:text-indigo-400'
                         }`}>
                           <span className="text-[10px] font-black uppercase tracking-widest block font-sans">
                             {checklistParams.converged ? '✓ Matrix Fully Converged' : '🛠️ Fitting Matrix Iterating'}
                           </span>
                           <span className="text-[8.5px] font-semibold opacity-80 block mt-0.5">
                             {checklistParams.converged 
                               ? 'Your model is ready for academic publication submission!'
                               : `Completed ${checklistProgress - 1} of 5 systematic optimization gates.`
                             }
                           </span>
                         </div>

                         {/* Reset Simulation */}
                         {(checklistProgress > 1 || checklistParams.converged) && (
                           <button
                             onClick={() => {
                               setChecklistProgress(1);
                               setChecklistUnlocked({ 1: true, 2: false, 3: false, 4: false, 5: false });
                               setChecklistParams({ rFactor: 95.0, rBragg: 85.0, chi2: 12.5, converged: false });
                             }}
                             className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                           >
                             <RotateCcw size={10} /> Reset Refinement Matrix
                           </button>
                         )}
                      </div>

                      {/* Right side: Phase checklist steps */}
                      <div className="xl:col-span-8 space-y-4">
                        {rietveldSteps.map((s) => {
                          const isUnlocked = checklistUnlocked[s.step as keyof typeof checklistUnlocked];
                          const isCompleted = checklistProgress > s.step;
                          const isActive = checklistProgress === s.step;

                          return (
                            <div 
                              key={s.step} 
                              className={`p-5 rounded-[2rem] border transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                                isCompleted 
                                  ? 'bg-emerald-500/5 dark:bg-emerald-500/2 border-emerald-500/20 hover:border-emerald-500/40' 
                                  : isActive
                                    ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-md scale-101'
                                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 opacity-60'
                              }`}
                            >
                               <div className="space-y-1 md:max-w-xl">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-semibold ${
                                        isCompleted 
                                          ? 'bg-emerald-500 text-white' 
                                          : isActive
                                            ? 'bg-rose-500 text-white animate-pulse'
                                            : 'bg-slate-200 dark:bg-slate-850 text-slate-500'
                                     }`}>
                                       {isCompleted ? '✓' : s.step}
                                     </div>
                                     <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-tight">{s.title}</h4>
                                     <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                                        s.relevance === 'CRITICAL' || s.relevance === 'EXTREME'
                                          ? 'bg-rose-500/10 text-rose-500'
                                          : 'bg-indigo-500/10 text-indigo-500'
                                     }`}>{s.relevance}</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-455 dark:text-slate-400 leading-normal pl-7">{s.desc}</p>
                               </div>

                               <div className="shrink-0 text-right flex flex-col items-end gap-1.5 pl-7 md:pl-0">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block font-sans">Operation Parameter</span>
                                  <span className="text-[9.5px] font-mono text-slate-800 dark:text-slate-200 block bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200/50 dark:border-white/5">{s.status}</span>
                                  
                                  {isActive && isUnlocked && (
                                    <button 
                                      onClick={() => {
                                        const currentStepNum = s.step;
                                        setChecklistProgress(Math.max(checklistProgress, currentStepNum + 1));
                                        setChecklistUnlocked(prev => ({ ...prev, [currentStepNum + 1]: true }));
                                        
                                        // Decrease R-factors
                                        if (currentStepNum === 1) {
                                          setChecklistParams({ rFactor: 64.2, rBragg: 48.5, chi2: 7.15, converged: false });
                                        } else if (currentStepNum === 2) {
                                          setChecklistParams({ rFactor: 38.5, rBragg: 22.1, chi2: 3.42, converged: false });
                                        } else if (currentStepNum === 3) {
                                          setChecklistParams({ rFactor: 18.0, rBragg: 11.4, chi2: 1.88, converged: false });
                                        } else if (currentStepNum === 4) {
                                          setChecklistParams({ rFactor: 11.2, rBragg: 6.9, chi2: 1.22, converged: false });
                                        } else if (currentStepNum === 5) {
                                          setChecklistParams({ rFactor: 7.2, rBragg: 3.1, chi2: 1.02, converged: true });
                                        }
                                      }}
                                      className="mt-1 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 transition-all flex items-center gap-1 self-end"
                                    >
                                      Refine Stage <ArrowRight size={10} />
                                    </button>
                                  )}
                               </div>
                            </div>
                          );
                        })}

                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-[1.5rem] flex items-start gap-3">
                           <Sparkles size={14} className="text-amber-400 animate-pulse shrink-0 mt-0.5" />
                           <p className="text-[10px] text-slate-400 font-bold leading-normal">
                             <strong className="text-white">Divergence Mitigation rule:</strong> Always lock backgrounds and scale factors first before opening lattice variables. Refine atomic heights only after cell axes have settled perfectly.
                           </p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUBTAB 2 - SYMMETRY OPERATIONS */}
                  {protocolSubTab === 'symmetry' && (
                    <div className="space-y-6">
                      <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-indigo-400 tracking-wide flex items-center gap-1">
                            <Compass size={12} /> Space Group Equivalent Positions Explorer
                          </h3>
                          <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                            Translate any core fractional coordinate vector [x, y, z] to see its symmetry-transformed positions across the cell.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Interactive Projection</span>
                           <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-mono border border-indigo-500/20">ab Plane</span>
                        </div>
                      </div>

                      {/* Selector buttons */}
                      <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-[2rem] border border-slate-150 dark:border-slate-850">
                        {Object.keys(DRILLDOWN_SPACE_GROUP_INFO).map((sg) => (
                          <button
                            key={sg}
                            onClick={() => setSymmetryActiveGroup(sg)}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
                              symmetryActiveGroup === sg
                                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                : 'text-slate-505 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-900'
                            }`}
                          >
                            {sg}
                          </button>
                        ))}
                      </div>
                                            {/* Display Data */}
                      {(() => {
                        const sDetails = DRILLDOWN_SPACE_GROUP_INFO[symmetryActiveGroup];
                        const transformedList = getSymmetryEquivalentPositionsList(symmetryActiveGroup, symCoordX, symCoordY);

                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                             
                             {/* Left column: Parameters list */}
                             <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-855 space-y-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                   <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-white/5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase">Sg Hermann-Mauguin</span>
                                      <span className="text-xs font-mono font-black text-slate-800 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">{sDetails.hermannMauguin}</span>
                                   </div>

                                   <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-white/5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase">Sg Schoenflies Code</span>
                                      <span className="text-xs font-mono font-black text-slate-800 dark:text-white">{sDetails.schoenflies}</span>
                                   </div>

                                   <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-white/5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase">Space Group Number</span>
                                      <span className="text-xs font-mono font-black text-slate-800 dark:text-white">#{sDetails.number}</span>
                                   </div>

                                   <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-white/5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase">Crystal System</span>
                                      <span className="text-xs font-mono font-black text-slate-800 dark:text-white">{sDetails.crystalSystem}</span>
                                   </div>

                                   <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-white/5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase">Centrosymmetric?</span>
                                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${sDetails.centrosymmetric ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{sDetails.centrosymmetric ? 'CENTRO' : 'NON-CENTRO'}</span>
                                   </div>

                                   <div className="flex justify-between items-center">
                                      <span className="text-[9px] text-slate-400 font-black uppercase">Chiral Symmetry?</span>
                                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${sDetails.chiral ? 'bg-cyan-500/10 text-cyan-500' : 'bg-slate-200 text-slate-400 dark:bg-slate-900 border border-slate-800'}`}>{sDetails.chiral ? 'CHIRAL' : 'ACHIRAL'}</span>
                                   </div>
                                </div>

                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                                   <div className="flex items-center gap-1 text-[9.5px] font-black text-slate-400 uppercase">
                                     <Sliders size={10} /> Probe Position [x, y]
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-3 font-mono">
                                      <div className="space-y-0.5">
                                         <label className="text-[8px] font-black text-slate-400">COORDINATE X</label>
                                         <input 
                                           title="Fractional Coordinate X"
                                           type="number" 
                                           step="0.05"
                                           min="0"
                                           max="1"
                                           value={symCoordX}
                                           onChange={(e) => setSymCoordX(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                                           className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-white text-center focus:outline-none focus:border-rose-500"
                                         />
                                      </div>
                                      <div className="space-y-0.5">
                                         <label className="text-[8px] font-black text-slate-400">COORDINATE Y</label>
                                         <input 
                                           title="Fractional Coordinate Y"
                                           type="number" 
                                           step="0.05"
                                           min="0"
                                           max="1"
                                           value={symCoordY}
                                           onChange={(e) => setSymCoordY(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                                           className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-white text-center focus:outline-none focus:border-rose-500"
                                         />
                                      </div>
                                   </div>

                                   <div className="flex gap-1.5 justify-center pt-1">
                                      <button 
                                        onClick={() => { setSymCoordX(0.20); setSymCoordY(0.40); }}
                                        className="text-[8.5px] font-black uppercase text-rose-500 hover:underline hover:text-rose-600"
                                      >
                                        Preset A [0.2, 0.4]
                                      </button>
                                      <span className="text-slate-300">|</span>
                                      <button 
                                        onClick={() => { setSymCoordX(0.33); setSymCoordY(0.66); }}
                                        className="text-[8.5px] font-black uppercase text-rose-500 hover:underline hover:text-rose-600"
                                      >
                                        Preset B [0.33, 0.66]
                                      </button>
                                   </div>
                                </div>
                             </div>

                             {/* Right/Central Columns parsed into visualizer and Wyckoff Lists */}
                             <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                
                                {/* 2D Crystallographic Unit Cell ab-plane projection */}
                                <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-900 shadow-inner flex flex-col justify-between min-h-[360px] text-white">
                                   <div>
                                      <div className="flex justify-between items-center mb-3">
                                         <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">2D Unit Cell Projection</span>
                                         </div>
                                         <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider">ab Plane Map</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 leading-normal mb-4 font-sans">
                                         Click or drag anywhere in the grid to translate coordinates. Pulsing marker is the source atom position <span className="text-rose-455 font-bold font-mono">[{symCoordX.toFixed(2)}, {symCoordY.toFixed(2)}]</span>. Smaller nodes are equivalent locations.
                                      </p>
                                   </div>

                                   {/* SVG interactive projection viewport */}
                                   <div className="w-full flex justify-center py-2 relative">
                                      <svg 
                                         viewBox="0 0 220 220" 
                                         className="w-full h-auto max-w-[210px] overflow-visible select-none cursor-crosshair bg-slate-900/50 rounded-xl border border-white/5"
                                         onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const clickX = e.clientX - rect.left;
                                            const clickY = e.clientY - rect.top;
                                            const svgX = (clickX / rect.width) * 220;
                                            const svgY = (clickY / rect.height) * 220;
                                            
                                            // 10 to 210 coordinates maps to [0,1]
                                            const fx = Math.max(0, Math.min(1, (svgX - 10) / 200));
                                            const fy = Math.max(0, Math.min(1, (210 - svgY) / 200));
                                            setSymCoordX(parseFloat(fx.toFixed(2)));
                                            setSymCoordY(parseFloat(fy.toFixed(2)));
                                         }}
                                      >
                                         <rect x="10" y="10" width="200" height="200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                                         
                                         {/* Grid lines */}
                                         <line x1="60" y1="10" x2="60" y2="210" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                                         <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                                         <line x1="160" y1="10" x2="160" y2="210" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                                         
                                         <line x1="10" y1="60" x2="210" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                                         <line x1="10" y1="110" x2="210" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                                         <line x1="10" y1="160" x2="210" y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />

                                         <circle cx="110" cy="110" r="1.5" fill="rgba(255,255,255,0.25)" />

                                         {getSymmetryCoordinates(symmetryActiveGroup, symCoordX, symCoordY).map((pt, index) => {
                                            const cx = 10 + pt.x * 200;
                                            const cy = 210 - pt.y * 200;

                                            if (pt.isSource) {
                                               return (
                                                  <g key={index}>
                                                     <circle cx={cx} cy={cy} r="10" className="animate-ping fill-fuchsia-450/20" />
                                                     <circle cx={cx} cy={cy} r="5" fill="rgba(236,72,153,0.35)" />
                                                     <circle cx={cx} cy={cy} r="2.5" fill="#ec4899" stroke="#ffffff" strokeWidth="0.75" />
                                                  </g>
                                               );
                                            } else {
                                               return (
                                                  <g key={index}>
                                                     <line 
                                                        x1={10 + symCoordX * 200} 
                                                        y1={210 - symCoordY * 200} 
                                                        x2={cx} 
                                                        y2={cy} 
                                                        stroke="rgba(6,182,212,0.15)" 
                                                        strokeWidth="0.5" 
                                                        strokeDasharray="2 2" 
                                                     />
                                                     <circle cx={cx} cy={cy} r="4" fill="rgba(6,182,212,0.2)" stroke="#22d3ee" strokeWidth="0.5" />
                                                     <circle cx={cx} cy={cy} r="1.5" fill="#22d3ee" />
                                                  </g>
                                               );
                                            }
                                         })}

                                         {/* Axes labels */}
                                         <text x="10" y="217" fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="middle">0,0</text>
                                         <text x="210" y="217" fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="middle">1.0a</text>
                                         <text x="8" y="14" fill="#64748b" fontSize="6" fontFamily="monospace" textAnchor="end">1.0b</text>
                                      </svg>
                                   </div>

                                   <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest pt-2 border-t border-white/5">
                                      <span>[X] maps to a-Axis</span>
                                      <span>[Y] maps to b-Axis</span>
                                      <span>Z component projected</span>
                                   </div>
                                </div>

                                {/* Wyckoff Positions card */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between space-y-4">
                                   <div>
                                      <span className="text-[9.5px] font-black uppercase text-rose-505 dark:text-rose-450 tracking-wider flex items-center gap-1 select-none font-sans">
                                        <Grid size={11} /> Wyckoff Sites
                                      </span>
                                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono tracking-wider">Lattice multiplicity for {symmetryActiveGroup}</p>
                                   </div>

                                   <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] scrollbar-thin">
                                      {sDetails.wyckoffSites.map((wyc, wi) => (
                                         <div key={wi} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-855 flex items-center justify-between font-mono text-[9.5px]">
                                            <div>
                                               <span className="text-[8px] font-black text-rose-500 uppercase">Site {wyc.site}</span>
                                               <p className="text-[9.5px] font-bold text-slate-805 dark:text-slate-200 mt-0.5">{wyc.coordinates}</p>
                                            </div>
                                            <div className="text-right">
                                               <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 block">Mult</span>
                                               <span className="text-[10px] text-indigo-505 dark:text-indigo-400 font-extrabold uppercase">{wyc.multiplicity}x</span>
                                            </div>
                                         </div>
                                      ))}
                                   </div>

                                   <div className="p-3 bg-indigo-505/5 rounded-xl border border-indigo-500/10 text-[9.5px] text-slate-455 dark:text-slate-400 font-bold leading-normal font-sans">
                                      Multiplicity tracks equivalent coordinates mapped by operations inside the space group cell.
                                   </div>
                                </div>

                                {/* Symmetry Equivalent Generators */}
                                <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-155 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm space-y-4">
                                   <div className="flex justify-between items-center">
                                      <span className="text-[9.5px] font-black uppercase text-rose-505 dark:text-rose-450 tracking-wider flex items-center gap-1 select-none font-sans">
                                        <Layers size={11} /> Equivalent Positions Coordinates ({transformedList.length})
                                      </span>
                                      <span className="text-[8px] font-mono font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-450 rounded border border-slate-155">
                                         Input: [ {symCoordX.toFixed(2)}, {symCoordY.toFixed(2)}, z ]
                                      </span>
                                   </div>

                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                                      {transformedList.map((trans, ti) => {
                                         const opTitle = sDetails.ops[ti] || `op_${ti}`;
                                         return (
                                            <div key={ti} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 text-center flex flex-col justify-between">
                                               <span className="text-[8px] text-slate-400 font-semibold block leading-none">{opTitle}</span>
                                               <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 block mt-1.5 leading-none">{trans}</span>
                                            </div>
                                         );
                                      })}
                                   </div>
                                </div>
                             </div>

                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SUBTAB 3 - QUANTITATIVE RESIDUAL ANALYSIS */}
                  {protocolSubTab === 'qpa' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Top theoretical panel */}
                      <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] space-y-2">
                         <h3 className="text-xs font-black uppercase text-slate-800 dark:text-amber-400 tracking-wide flex items-center gap-1.5 leading-none">
                            <Layers size={12} className="text-amber-500" /> Hill-Howard Quantitative Phase Analysis (QPA)
                         </h3>
                         <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                            Quantitative analysis derives the absolute weight percentage ($W_p$) of crystalline compound mixtures in multi-phase datasets. Crucially, scale factor ($S$) adjustments from the Rietveld model are combined with cell volumes ($V$) and compound densities.
                         </p>

                         {/* Math block */}
                         <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-center py-5 font-serif select-none text-slate-800 dark:text-slate-200">
                            <div className="text-center font-mono text-xs leading-relaxed">
                               <p className="text-sm font-bold text-rose-500 dark:text-indigo-400">Wₚ = [Sₚ(Z·M·V)ₚ] / ∑ᵢ [Sᵢ(Z·M·V)ᵢ]</p>
                               <p className="text-[8.5px] text-slate-400 font-sans font-black uppercase tracking-widest mt-2">Where: S = Scale Factor, Z = Formula units, M = Molar Mass, V = Unit Cell Volume</p>
                            </div>
                         </div>
                      </div>

                      {/* Split Input Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                         
                         {/* Phase 1 Setup Card */}
                         <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-855 space-y-4">
                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-white/5">
                               <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                               <span className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-white">Compound Phase A</span>
                            </div>

                            <div className="space-y-3 font-sans">
                               <div className="space-y-0.5">
                                  <label className="text-[8.5px] font-black text-slate-400 uppercase">Phase Name</label>
                                  <input 
                                    title="Phase A Name"
                                    type="text"
                                    value={qpaPhase1Name}
                                    onChange={(e) => setQpaPhase1Name(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-850 dark:text-slate-100"
                                  />
                               </div>

                               <div className="grid grid-cols-2 gap-3.5 font-mono">
                                  <div className="space-y-0.5">
                                     <label className="text-[8px] font-black text-slate-450 uppercase">Mass M (g/mol)</label>
                                     <input 
                                       title="Molar Mass Phase A"
                                       type="number"
                                       value={qpaPhase1Mass}
                                       onChange={(e) => setQpaPhase1Mass(parseFloat(e.target.value) || 0)}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-850 dark:text-slate-100 text-center"
                                     />
                                  </div>
                                  <div className="space-y-0.5">
                                     <label className="text-[8px] font-black text-slate-450 uppercase">Formula Units Z</label>
                                     <input 
                                       title="Formula Units Phase A"
                                       type="number"
                                       value={qpaPhase1Z}
                                       onChange={(e) => setQpaPhase1Z(parseFloat(e.target.value) || 0)}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-850 dark:text-slate-100 text-center"
                                     />
                                  </div>
                               </div>

                               <div className="space-y-0.5 font-mono">
                                  <div className="flex justify-between text-[8px] font-black text-slate-450 uppercase">
                                     <span>Cell Volume V</span>
                                     <span>{qpaPhase1Volume} Å³</span>
                                  </div>
                                  <input 
                                    title="Cell Volume Phase A"
                                    type="number"
                                    step="10"
                                    value={qpaPhase1Volume}
                                    onChange={(e) => setQpaPhase1Volume(parseFloat(e.target.value) || 1)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-850 dark:text-slate-100 text-center"
                                  />
                               </div>

                               <div className="space-y-1 pt-1.5 border-t border-slate-200/50 dark:border-white/5 font-mono">
                                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                                     <span>Scale Factor (Sp)</span>
                                     <span className="text-amber-500 font-bold">{qpaPhase1Scale.toFixed(5)}</span>
                                  </div>
                                  <input 
                                    title="Scale Factor Phase A"
                                    type="range"
                                    min="0.0001"
                                    max="0.0100"
                                    step="0.0001"
                                    value={qpaPhase1Scale}
                                    onChange={(e) => setQpaPhase1Scale(parseFloat(e.target.value))}
                                    className="w-full accent-amber-500"
                                  />
                               </div>
                            </div>
                         </div>

                         {/* Phase 2 Setup Card */}
                         <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-855 space-y-4">
                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-white/5">
                               <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                               <span className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-white">Compound Phase B</span>
                            </div>

                            <div className="space-y-3 font-sans">
                               <div className="space-y-0.5">
                                  <label className="text-[8.5px] font-black text-slate-400 uppercase">Phase Name</label>
                                  <input 
                                    title="Phase B Name"
                                    type="text"
                                    value={qpaPhase2Name}
                                    onChange={(e) => setQpaPhase2Name(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-850 dark:text-slate-100"
                                  />
                               </div>

                               <div className="grid grid-cols-2 gap-3.5 font-mono">
                                  <div className="space-y-0.5">
                                     <label className="text-[8px] font-black text-slate-450 uppercase">Mass M (g/mol)</label>
                                     <input 
                                       title="Molar Mass Phase B"
                                       type="number"
                                       value={qpaPhase2Mass}
                                       onChange={(e) => setQpaPhase2Mass(parseFloat(e.target.value) || 0)}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-850 dark:text-slate-100 text-center"
                                     />
                                  </div>
                                  <div className="space-y-0.5">
                                     <label className="text-[8px] font-black text-slate-450 uppercase">Formula Units Z</label>
                                     <input 
                                       title="Formula Units Phase B"
                                       type="number"
                                       value={qpaPhase2Z}
                                       onChange={(e) => setQpaPhase2Z(parseFloat(e.target.value) || 0)}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-850 dark:text-slate-100 text-center"
                                     />
                                  </div>
                               </div>

                               <div className="space-y-0.5 font-mono">
                                  <div className="flex justify-between text-[8px] font-black text-slate-455 uppercase">
                                     <span>Cell Volume V</span>
                                     <span>{qpaPhase2Volume} Å³</span>
                                  </div>
                                  <input 
                                    title="Cell Volume Phase B"
                                    type="number"
                                    step="10"
                                    value={qpaPhase2Volume}
                                    onChange={(e) => setQpaPhase2Volume(parseFloat(e.target.value) || 1)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-850 dark:text-slate-100 text-center"
                                  />
                               </div>

                               <div className="space-y-1 pt-1.5 border-t border-slate-200/50 dark:border-white/5 font-mono">
                                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                                     <span>Scale Factor (Sp)</span>
                                     <span className="text-indigo-550 dark:text-indigo-400 font-bold">{qpaPhase2Scale.toFixed(5)}</span>
                                  </div>
                                  <input 
                                    title="Scale Factor Phase B"
                                    type="range"
                                    min="0.0001"
                                    max="0.0100"
                                    step="0.0001"
                                    value={qpaPhase2Scale}
                                    onChange={(e) => setQpaPhase2Scale(parseFloat(e.target.value))}
                                    className="w-full accent-indigo-500"
                                  />
                               </div>
                            </div>
                         </div>

                         {/* Results Card */}
                         {(() => {
                           const v1 = qpaPhase1Scale * qpaPhase1Z * qpaPhase1Mass * qpaPhase1Volume;
                           const v2 = qpaPhase2Scale * qpaPhase2Z * qpaPhase2Mass * qpaPhase2Volume;
                           const sumV = v1 + v2;
                           const fraction1 = sumV > 0 ? v1 / sumV : 0.5;
                           const fraction2 = sumV > 0 ? v2 / sumV : 0.5;
                           
                           return (
                             <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between space-y-6 text-white font-sans">
                                <div>
                                   <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest block mb-1">Computational Outcomes</span>
                                   <h3 className="text-sm font-extrabold text-slate-100 tracking-tight leading-tight">Live Weight Fractions</h3>
                                </div>

                                <div className="space-y-4">
                                   {/* Progress bar split */}
                                   <div className="space-y-1.5">
                                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                         <span>{qpaPhase1Name || 'Phase A'}</span>
                                         <span>{qpaPhase2Name || 'Phase B'}</span>
                                      </div>
                                      <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-850">
                                         <div className="bg-amber-500 h-full transition-all duration-305" style={{ width: `${fraction1 * 100}%` }} />
                                         <div className="bg-indigo-505 h-full transition-all duration-350" style={{ width: `${fraction2 * 100}%` }} />
                                      </div>
                                   </div>

                                   {/* Score readout */}
                                   <div className="grid grid-cols-2 gap-4 font-mono">
                                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-center">
                                         <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider block">WEIGHT %</span>
                                         <span className="text-lg font-black text-amber-400 block mt-0.5">{(fraction1 * 100).toFixed(2)}%</span>
                                      </div>
                                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-center">
                                         <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider block">WEIGHT %</span>
                                         <span className="text-lg font-black text-indigo-400 block mt-0.5">{(fraction2 * 100).toFixed(2)}%</span>
                                      </div>
                                   </div>
                                </div>

                                <div className="p-4.5 bg-slate-950 rounded-[1.5rem] border border-white/5 space-y-1.5 text-[10px] text-slate-400 leading-normal font-bold">
                                   <p className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500 pb-1.5 border-b border-white/5 font-mono">
                                      <span>Metric details</span>
                                      <span>Phase Product</span>
                                   </p>
                                   <p className="flex justify-between font-mono"><span>A: S·Z·M·V</span> <span>{v1.toFixed(1)}</span></p>
                                   <p className="flex justify-between font-mono"><span>B: S·Z·M·V</span> <span>{v2.toFixed(1)}</span></p>
                                </div>
                             </div>
                           );
                         })()}

                      </div>
                    </div>
                  )}

                  {/* SUBTAB 4 - CAGLIOTI PROFILE BROADENING */}
                  {protocolSubTab === 'caglioti' && (
                    <div className="space-y-6">
                      <div className="p-5 bg-violet-500/5 border border-violet-500/20 rounded-[2rem] space-y-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-black uppercase text-slate-805 dark:text-violet-405 tracking-wide flex items-center gap-1.5">
                            <Ruler size={12} className="text-violet-500" /> Caglioti Instrumental Broadening Curve Simulator
                          </h3>
                          <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                             Simulates the instrumental FWHM peak broadening across the full 2θ diffraction spectrum angular range.
                          </p>
                        </div>
                        <div className="shrink-0 font-mono text-[9px] font-black text-slate-405 bg-white dark:bg-slate-950 border px-3 py-1 rounded-xl">
                           H² = U tan²θ + V tanθ + W
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                        
                        {/* Sliders Input Panel */}
                        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-850 space-y-6">
                           <div>
                              <span className="text-[9px] font-mono text-violet-505 dark:text-violet-400 font-black uppercase tracking-widest block">Instrument Resolution Function</span>
                              <h3 className="text-sm font-extrabold text-slate-805 dark:text-slate-205 leading-tight mt-0.5">Caglioti Coefficients</h3>
                           </div>

                           <div className="space-y-4 font-mono text-[10px]">
                              {/* U Slider */}
                              <div className="space-y-1">
                                 <div className="flex justify-between font-black uppercase text-slate-450">
                                   <span>Coefficient U (Gaussian Shape)</span>
                                   <span className="text-violet-500 font-bold">{cagliotiU.toFixed(4)}</span>
                                 </div>
                                 <input 
                                   title="Caglioti U"
                                   type="range"
                                   min="-0.0100"
                                   max="0.1000"
                                   step="0.0005"
                                   value={cagliotiU}
                                   onChange={(e) => setCagliotiU(parseFloat(e.target.value))}
                                   className="w-full accent-violet-500"
                                 />
                              </div>

                              {/* V Slider */}
                              <div className="space-y-1">
                                 <div className="flex justify-between font-black uppercase text-slate-450">
                                   <span>Coefficient V (Cross Term factor)</span>
                                   <span className="text-violet-500 font-bold">{cagliotiV.toFixed(4)}</span>
                                 </div>
                                 <input 
                                   title="Caglioti V"
                                   type="range"
                                   min="-0.0900"
                                   max="0.0500"
                                   step="0.0005"
                                   value={cagliotiV}
                                   onChange={(e) => setCagliotiV(parseFloat(e.target.value))}
                                   className="w-full accent-violet-500"
                                 />
                              </div>

                              {/* W Slider */}
                              <div className="space-y-1">
                                 <div className="flex justify-between font-black uppercase text-slate-450">
                                   <span>Coefficient W (Broadening Base)</span>
                                   <span className="text-violet-500 font-bold">{cagliotiW.toFixed(4)}</span>
                                 </div>
                                 <input 
                                   title="Caglioti W"
                                   type="range"
                                   min="0.0005"
                                   max="0.1000"
                                   step="0.0005"
                                   value={cagliotiW}
                                   onChange={(e) => setCagliotiW(parseFloat(e.target.value))}
                                   className="w-full accent-violet-500"
                                 />
                              </div>
                           </div>

                           <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl text-[10px] text-slate-550 dark:text-slate-400 font-bold font-sans">
                              Adjust coefficients to reflect high-resolution synchrotron slits (low W, low U) versus standard laboratory goniometer widths (elevated W).
                           </div>
                        </div>

                        {/* Chart Render / Readout */}
                        <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-[2rem] flex flex-col justify-between space-y-5">
                           <div>
                              <span className="text-[9px] font-mono font-black text-rose-505 dark:text-rose-450 uppercase tracking-widest block">Resolution Graph</span>
                              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">Instrument Res Function Curve</h3>
                           </div>

                           {/* Real Curve Plotting */}
                           <div className="p-1">
                              {(() => {
                                 // Generate 15 points across 2theta range [10, 120]
                                 const pts: Array<{ d2th: number; fwhm: number; x: number; y: number }> = [];
                                 for (let d2th = 10; d2th <= 120; d2th += 8) {
                                    const angleTheta = d2th / 2;
                                    const rad = (angleTheta * Math.PI) / 180;
                                    const tanVal = Math.tan(rad);
                                    const hSquared = cagliotiU * (tanVal * tanVal) + cagliotiV * tanVal + cagliotiW;
                                    const fwhmCalculated = Math.sqrt(Math.max(0.0001, hSquared));
                                    
                                    // Map to SVG coordinates (width: 350, height: 150)
                                    const x = 35 + ((d2th - 10) / 110) * 300;
                                    const y = 135 - (Math.min(0.5, fwhmCalculated) / 0.5) * 110;
                                    pts.push({ d2th, fwhm: fwhmCalculated, x, y });
                                 }
                                 const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                                 const filledPathD = `${pathD} L ${pts[pts.length - 1].x.toFixed(1)} 135 L ${pts[0].x.toFixed(1)} 135 Z`;
                                 
                                 return (
                                    <div className="relative">
                                       <svg viewBox="0 0 350 155" className="w-full h-auto bg-slate-900/60 dark:bg-slate-950 p-4 rounded-2xl border border-slate-205 dark:border-white/5 select-none overflow-visible">
                                          <defs>
                                             <linearGradient id="cagliotiGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                                             </linearGradient>
                                          </defs>
                                          {/* Grid Lines */}
                                          <line x1="35" y1="135" x2="335" y2="135" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                                          <line x1="35" y1="80" x2="335" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
                                          <line x1="35" y1="25" x2="335" y2="25" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
                                          
                                          <line x1="35" y1="25" x2="35" y2="135" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                                          <line x1="185" y1="25" x2="185" y2="135" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
                                          <line x1="335" y1="25" x2="335" y2="135" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />

                                          {/* Shaded Area Under Curve */}
                                          <path d={filledPathD} fill="url(#cagliotiGradient)" />

                                          {/* Curve path */}
                                          <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                                          {/* Selected sample points with values */}
                                          {pts.filter((_, idx) => idx % 4 === 0).map((pt, i) => (
                                             <g key={i}>
                                                <circle cx={pt.x} cy={pt.y} r="3" fill="#8b5cf6" stroke="#ffffff" strokeWidth="0.5" />
                                                <text x={pt.x} y={pt.y - 7} fill="#c084fc" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{pt.fwhm.toFixed(3)}°</text>
                                             </g>
                                          ))}

                                          {/* Axis tags */}
                                          <text x="35" y="145" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">10°</text>
                                          <text x="185" y="145" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">65°</text>
                                          <text x="335" y="145" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">120° (2θ)</text>

                                          <text x="30" y="137" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">0.0°</text>
                                          <text x="30" y="82" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">0.25°</text>
                                          <text x="30" y="27" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">0.5° FWHM</text>
                                       </svg>
                                    </div>
                                 );
                              })()}
                           </div>

                           {/* Compact Grid Table beneath */}
                           <div className="grid grid-cols-3 gap-2 text-center">
                              {[15, 30, 45, 60, 75, 90].map((angleTheta) => {
                                 const rad = (angleTheta * Math.PI) / 180;
                                 const tanVal = Math.tan(rad);
                                 const hSquared = cagliotiU * (tanVal * tanVal) + cagliotiV * tanVal + cagliotiW;
                                 const fwhmCalculated = Math.sqrt(Math.max(0.0001, hSquared));
                                 return (
                                    <div key={angleTheta} className="p-2 bg-white dark:bg-slate-905 rounded-xl border border-slate-150 dark:border-slate-850 font-mono text-[9px] flex flex-col justify-between">
                                       <span className="text-slate-400 font-bold block leading-none">Angle {angleTheta * 2}°</span>
                                       <span className="text-indigo-505 dark:text-indigo-400 font-extrabold mt-1 block leading-none">{fwhmCalculated.toFixed(4)}°</span>
                                    </div>
                                 );
                              })}
                           </div>

                           <div className="px-1 text-[9.5px] font-bold text-slate-455 font-sans leading-relaxed">
                              Peak FWHM typically increases at wider angles (high $2\theta$) due to the mathematical $\tan\theta$ progression of standard Bragg divergence curves.
                           </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* SUBTAB 5 - PREFERRED ORIENTATION (MARCH-DOLLASE) */}
                  {protocolSubTab === 'preferred' && (
                    <div className="space-y-6 animate-in fade-in duration-305">
                      <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] space-y-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-black uppercase text-slate-805 dark:text-emerald-450 tracking-wide flex items-center gap-1.5 font-sans">
                            <Target size={12} className="text-emerald-500" /> March-Dollase Preferred Orientation Estimator
                          </h3>
                          <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 font-sans">
                             Simulate how non-random crystal alignment in bulk/powder samples skews relative peak intensities.
                          </p>
                        </div>
                        <div className="shrink-0 font-mono text-[9px] font-black text-slate-405 bg-white dark:bg-slate-950 border px-3 py-1 rounded-xl">
                            P_MD = [r² cos²α + sin²α / r]^-1.5
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                         {/* Controls */}
                         <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-850 space-y-5 font-sans">
                            <div>
                               <span className="text-[9px] font-mono text-emerald-520 dark:text-emerald-400 font-black uppercase tracking-widest block">Texture Fitting parameters</span>
                               <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 font-sans">March-Dollase Model</h3>
                            </div>

                            <div className="space-y-4 font-mono text-[10px]">
                               {/* Slider: r parameter */}
                               <div className="space-y-1">
                                  <div className="flex justify-between font-black uppercase text-slate-450">
                                     <span>Preferred Parameter r</span>
                                     <span className="text-emerald-500 font-bold">r = {prefRValue.toFixed(2)}</span>
                                  </div>
                                  <input 
                                    title="March Parameter r"
                                    type="range"
                                    min="0.25"
                                    max="2.0"
                                    step="0.05"
                                    value={prefRValue}
                                    onChange={(e) => setPrefRValue(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                  />
                                  <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase mt-0.5 leading-none">
                                     <span>Plates (r &lt; 1.0)</span>
                                     <span>Random (r = 1.0)</span>
                                     <span>Needles (r &gt; 1.0)</span>
                                  </div>
                               </div>

                               {/* Slider: alpha_deg */}
                               <div className="space-y-1">
                                  <div className="flex justify-between font-black uppercase text-slate-450">
                                     <span>Angle α (Reflection vs Normal)</span>
                                     <span className="text-emerald-500 font-bold">{prefAlphaDeg}°</span>
                                  </div>
                                  <input 
                                    title="Orientation Normal Angle Alpha"
                                    type="range"
                                    min="0"
                                    max="90"
                                    step="1"
                                    value={prefAlphaDeg}
                                    onChange={(e) => setPrefAlphaDeg(parseInt(e.target.value) || 0)}
                                    className="w-full accent-emerald-500"
                                  />
                               </div>

                               {/* Slider: fraction */}
                               <div className="space-y-1">
                                  <div className="flex justify-between font-black uppercase text-slate-450">
                                     <span>Volume Fraction of Textured Domain</span>
                                     <span className="text-emerald-500 font-bold">{(prefFraction * 100).toFixed(0)}%</span>
                                  </div>
                                  <input 
                                    title="Textured Volume Fraction"
                                    type="range"
                                    min="0.0"
                                    max="1.0"
                                    step="0.05"
                                    value={prefFraction}
                                    onChange={(e) => setPrefFraction(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                  />
                               </div>
                            </div>
                         </div>

                         {/* Results plot or display */}
                         {(() => {
                            const alpha_rad = (prefAlphaDeg * Math.PI) / 180;
                            const rSq = prefRValue * prefRValue;
                            const invR = 1.0 / prefRValue;
                            const cosAlphaSq = Math.pow(Math.cos(alpha_rad), 2);
                            const sinAlphaSq = Math.pow(Math.sin(alpha_rad), 2);
                            const baseMD = rSq * cosAlphaSq + invR * sinAlphaSq;
                            const pAlpha = Math.pow(baseMD, -1.5);
                            const correctionFactor = prefFraction * pAlpha + (1.0 - prefFraction);

                            // generate list of corrections from 0 to 90 at 15 deg steps to show curves
                            const curveSteps = [0, 15, 30, 45, 60, 75, 90];

                            return (
                               <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-[2rem] flex flex-col justify-between space-y-5">
                                  <div>
                                     <span className="text-[9px] font-mono font-black text-emerald-550 dark:text-emerald-450 uppercase tracking-widest block font-sans">Visualizer Plot</span>
                                     <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 font-sans">Texture Factor vs. Reflection Angle (α)</h3>
                                  </div>

                                  {/* Real Curve Plotting */}
                                  <div className="p-1">
                                     {(() => {
                                        // Generate points from 0 to 90 degrees in steps of 5 for a flawless curved line
                                        const pts: Array<{ alpha: number; yVal: number; x: number; y: number }> = [];
                                        for (let a = 0; a <= 90; a += 5) {
                                           const aRad = (a * Math.PI) / 180;
                                           const cosSq = Math.pow(Math.cos(aRad), 2);
                                           const sinSq = Math.pow(Math.sin(aRad), 2);
                                           const bStep = rSq * cosSq + invR * sinSq;
                                           const pStep = Math.pow(bStep, -1.5);
                                           const cStepVal = prefFraction * pStep + (1.0 - prefFraction);
                                           
                                           // Map to SVG coordinates width: 350, height: 140
                                           const x = 35 + (a / 90) * 300;
                                           // y is inverted, max value mapped is 3.0
                                           const y = 120 - (Math.min(3.0, cStepVal) / 3.0) * 100;
                                           pts.push({ alpha: a, yVal: cStepVal, x, y });
                                        }

                                        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                                        const filledPathD = `${pathD} L ${pts[pts.length - 1].x.toFixed(1)} 120 L ${pts[0].x.toFixed(1)} 120 Z`;

                                        // Calculating user indicator coordinate
                                        const userX = 35 + (prefAlphaDeg / 90) * 300;
                                        const userY = 120 - (Math.min(3.0, correctionFactor) / 3.0) * 100;
                                        const isotropicY = 120 - (1.0 / 3.0) * 100; // factor 1.0

                                        return (
                                           <div className="relative">
                                              <svg viewBox="0 0 350 140" className="w-full h-auto bg-slate-900/60 dark:bg-slate-950 p-4 rounded-2xl border border-slate-205 dark:border-white/5 select-none overflow-visible">
                                                 <defs>
                                                    <linearGradient id="prefGradient" x1="0" y1="0" x2="0" y2="1">
                                                       <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                                       <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                                    </linearGradient>
                                                 </defs>

                                                 {/* Axis & Reference Gridlines */}
                                                 <line x1="35" y1="120" x2="335" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                                                 <line x1="35" y1="87" x2="335" y2="87" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2 2" />
                                                 <line x1="35" y1="53" x2="335" y2="53" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2 2" />
                                                 <line x1="35" y1="20" x2="335" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2 2" />

                                                 <line x1="35" y1="20" x2="35" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                                                 <line x1="185" y1="20" x2="185" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
                                                 <line x1="335" y1="20" x2="335" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />

                                                 {/* Isotropic Baseline marker (1.0x) */}
                                                 <line x1="35" y1={isotropicY} x2="335" y2={isotropicY} stroke="#ef4444" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
                                                 <text x="330" y={isotropicY - 4} fill="#f87171" fontSize="5" fontFamily="monospace" textAnchor="end">Isotropic (1.0x)</text>

                                                 {/* Shaded Area Under Curve */}
                                                 <path d={filledPathD} fill="url(#prefGradient)" />

                                                 {/* Curve Path Line */}
                                                 <path d={pathD} fill="none" stroke="#34d399" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />

                                                 {/* Selected Alpha Vertical Slider Intersection Line */}
                                                 <line x1={userX} y1="20" x2={userX} y2="120" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="2 1" />

                                                 {/* Active dot intersection */}
                                                 <circle cx={userX} cy={userY} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                                                 <text x={userX} y={userY - 8} fill="#34d399" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="black">
                                                    {correctionFactor.toFixed(3)}x Match
                                                 </text>

                                                 {/* X Axis Coordinates */}
                                                 <text x="35" y="130" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">α = 0°</text>
                                                 <text x="185" y="130" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">α = 45°</text>
                                                 <text x="335" y="130" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">α = 90°</text>

                                                 {/* Y Axis Numbers */}
                                                 <text x="30" y="122" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">0.0x</text>
                                                 <text x="30" y="89" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">1.0x</text>
                                                 <text x="30" y="56" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">2.0x</text>
                                                 <text x="30" y="23" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="end">3.0x Multiplier</text>
                                              </svg>
                                           </div>
                                        );
                                     })()}
                                  </div>

                                  {/* Multiplier readout table */}
                                  <div className="grid grid-cols-4 gap-2 text-center">
                                     {curveSteps.map((angle) => {
                                        const rad_s = (angle * Math.PI) / 180;
                                        const cosAs = Math.pow(Math.cos(rad_s), 2);
                                        const sinAs = Math.pow(Math.sin(rad_s), 2);
                                        const bStep = rSq * cosAs + invR * sinAs;
                                        const pStep = Math.pow(bStep, -1.5);
                                        const cStepVal = prefFraction * pStep + (1.0 - prefFraction);
                                        const isActiveAngle = angle === prefAlphaDeg;

                                        return (
                                           <div key={angle} className={`p-1.5 rounded-xl border text-[8.5px] font-mono flex flex-col justify-between ${
                                              isActiveAngle
                                                 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold'
                                                 : 'bg-white dark:bg-slate-905 border-slate-150 dark:border-slate-850 text-slate-500 dark:text-slate-400'
                                           }`}>
                                              <span className="opacity-75 block leading-none">α = {angle}°</span>
                                              <span className="mt-1 block leading-none font-bold">{cStepVal.toFixed(3)}x</span>
                                           </div>
                                        );
                                     })}
                                  </div>

                                  <div className="p-3 bg-slate-905 border border-slate-800 rounded-xl font-sans text-xs">
                                     <p className="text-[10px] text-slate-405 font-bold leading-normal">
                                        <strong className="text-slate-800 dark:text-white">Explanation:</strong> When <span className="text-emerald-500">{prefRValue < 1 ? 'r < 1' : prefRValue > 1 ? 'r > 1' : 'r = 1'}</span> ({prefRValue < 1 ? 'Plate-like morphology' : prefRValue > 1 ? 'Needle-like morphology' : 'Random texture'}), reflections matching planes parallel to the growth substrate (low α) are {correctionFactor > 1 ? 'heavily enhanced' : 'suppressed'} by <span className="text-emerald-500">{Math.abs((correctionFactor - 1) * 100).toFixed(1)}%</span>, while orthogonal side walls (high α) shift inversely.
                                     </p>
                                  </div>
                               </div>
                            );
                         })()}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 6 - SCRIPT GENERATOR SDK */}
                  {protocolSubTab === 'python' && (
                    <div className="space-y-6 animate-in fade-in duration-305">
                      <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] space-y-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-0.5 font-sans">
                          <h3 className="text-xs font-black uppercase text-slate-805 dark:text-amber-405 tracking-wide flex items-center gap-1.5 font-sans">
                            <FileCode size={12} className="text-amber-500" /> Automated Python Workflow Generator
                          </h3>
                          <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                             Translate parameters designed in this manual directly into academic Python analysis scripts.
                          </p>
                        </div>
                        <div className="shrink-0 font-mono text-[9px] font-black text-slate-405 bg-white dark:bg-slate-950 border px-3 py-1 rounded-xl">
                            NumPy • SciPy • GSAS-II • LMFIT
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                         {/* Config Side */}
                         <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-850 space-y-4 font-sans">
                            <div>
                               <span className="text-[9px] font-mono text-amber-500 dark:text-amber-400 font-black uppercase tracking-widest block">Script Parameters</span>
                               <h3 className="text-sm font-extrabold text-slate-805 dark:text-slate-100 mt-0.5">Configuration Setup</h3>
                            </div>

                            <div className="space-y-3 font-sans">
                               {/* Target Lib */}
                               <div className="space-y-0.5">
                                  <label className="text-[8.5px] font-black text-slate-400 uppercase">Target Engine</label>
                                  <div className="grid grid-cols-2 gap-2">
                                     {['numpy', 'gsas2'].map((lib) => (
                                        <button
                                          key={lib}
                                          type="button"
                                          onClick={() => setPySelectedLibrary(lib)}
                                          className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                             pySelectedLibrary === lib 
                                               ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow' 
                                               : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                          }`}
                                        >
                                           {lib === 'numpy' ? 'SciPy / NumPy' : 'GSAS-II Api'}
                                        </button>
                                     ))}
                                  </div>
                               </div>

                               {/* Anode */}
                               <div className="space-y-0.5">
                                  <label className="text-[8.5px] font-black text-slate-400 uppercase">X-Ray Target source</label>
                                  <select
                                    title="Target Source Anode"
                                    value={pyAnodeMaterial}
                                    onChange={(e) => setPyAnodeMaterial(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 font-bold"
                                  >
                                     <option value="Cu">Copper Kα (λ=1.5418 Å)</option>
                                     <option value="Mo">Molybdenum Kα (λ=0.7107 Å)</option>
                                     <option value="Co">Cobalt Kα (λ=1.7890 Å)</option>
                                  </select>
                               </div>

                               {/* Peaks */}
                               <div className="space-y-0.5">
                                  <label className="text-[8.5px] font-black text-slate-400 uppercase">Experimental 2θ Peaks (deg)</label>
                                  <input 
                                    title="Peaks Entry"
                                    type="text"
                                    value={pyPeaksInput}
                                    onChange={(e) => setPyPeaksInput(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-850 dark:text-slate-100"
                                  />
                               </div>

                               {/* AI POWERED PROMPT SECTION */}
                               <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                  <div>
                                     <span className="text-[9px] font-mono text-fuchsia-500 font-black uppercase tracking-widest block">AI Intelligent generator</span>
                                     <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 mt-0.5">Prompt Engineering</h4>
                                  </div>
                                  <textarea
                                    title="AI Prompt"
                                    placeholder="Describe what you want the Python script to do (e.g., 'Perform a LeBail fit and plot the results with error bars')"
                                    value={pyAIPrompt}
                                    onChange={(e) => setPyAIPrompt(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-[10px] font-semibold text-slate-800 dark:text-slate-200 min-h-[80px] focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all"
                                  />
                                  <button
                                    type="button"
                                    disabled={generatingPy || !pyAIPrompt.trim()}
                                    onClick={handleAIGeneratePython}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                      generatingPy 
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                                        : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 active:scale-95'
                                    }`}
                                  >
                                    {generatingPy ? (
                                      <>
                                        <Activity size={12} className="animate-spin" /> Coding with Gemini...
                                      </>
                                    ) : (
                                      <>
                                        <Brain size={12} /> Generate AI Script
                                      </>
                                    )}
                                  </button>
                                  {pyAIError && (
                                    <p className="text-[9px] text-rose-500 font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                      Error: {pyAIError}
                                    </p>
                                  )}
                               </div>
                            </div>
                         </div>

                         {/* Preview Code Component */}
                         {(() => {
                            const wl = pyAnodeMaterial === 'Cu' ? 1.54184 : pyAnodeMaterial === 'Mo' ? 0.71073 : 1.78901;
                            const peaksArray = pyPeaksInput.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
                            
                            const pythonScript = pySelectedLibrary === 'numpy' 
                              ? `#!/usr/bin/env python3
import numpy as np
from scipy.optimize import curve_fit

# Analytical XRD Calibration parameters
WAVELENGTH = ${wl} # Å (${pyAnodeMaterial} Target)
PEAKS_2THETA = np.array([${peaksArray.join(', ')}])

def bragg_d_spacing(two_theta_deg):
    """Computes interplanar d-spacing (Å)"""
    theta_rad = np.radians(two_theta_deg / 2.0)
    return WAVELENGTH / (2.0 * np.sin(theta_rad))

def caglioti_broadening(theta_rad, u, v, w):
    """Gaussian instrument resolution broadening model"""
    tan_t = np.tan(theta_rad)
    h_squared = u * (tan_t**2) + v * tan_t + w
    return np.sqrt(np.maximum(1e-5, h_squared))

# Dynamic physical mapping
for idx, pk in enumerate(PEAKS_2THETA):
    d_space = bragg_d_spacing(pk)
    q_vec = 4 * np.pi * np.sin(np.radians(pk/2)) / WAVELENGTH
    print(f"Peak #{idx+1} ({pk}° 2THETA): d-spacing={d_space:.4f} Å, Q={q_vec:.4f} 1/Å")
`
                              : `#!/usr/bin/env python3
import sys
try:
    import GSASIIpath
except ImportError:
    print("Please install GSAS-II build in your Python path environment.")
    sys.exit(1)

# Initialize automated crystal refinement matrix
print("Initializing GSAS-II scripting pipeline wrapper...")
import GSASIIAPI as g2api

# Experimental configuration
WAVELENGTH = ${wl} # Å
INST_COEFFS = {'u': ${cagliotiU.toFixed(4)}, 'v': ${cagliotiV.toFixed(4)}, 'w': ${cagliotiW.toFixed(4)}}
PEAKS = [${peaksArray.join(', ')}]

project = g2api.G2Project(newfile="refined_model.gpx")
phase = project.add_phase(phasename="hematite_phase")
print(f"Created crystallographic phase. Target wavelength={WAVELENGTH} Å")
`;
                            return (
                               <div className="lg:col-span-8 bg-slate-905 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between space-y-4 text-white">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 font-sans text-xs">
                                     <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${aiPyCode ? 'bg-fuchsia-500' : 'bg-yellow-500'} animate-pulse`} />
                                        <span className="text-[9px] font-mono font-black uppercase text-slate-400">
                                           {aiPyCode ? 'AI GENERATED SCRIPT' : `Target: ${pySelectedLibrary === 'numpy' ? 'SciPy/NumPy' : 'GSAS-II Suite'}`}
                                        </span>
                                     </div>
                                     
                                     <div className="flex items-center gap-2">
                                        {aiPyCode && (
                                           <button
                                              type="button"
                                              onClick={() => setAiPyCode(null)}
                                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[9px] font-black uppercase tracking-wider transition-all"
                                           >
                                              Reset to Template
                                           </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                             navigator.clipboard.writeText(aiPyCode || pythonScript);
                                          }}
                                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                        >
                                           <Copy size={9} /> Copy script
                                        </button>
                                     </div>
                                  </div>

                                  <div className="relative">
                                     <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-4 rounded-2xl overflow-x-auto border border-slate-850 h-56 custom-scrollbar leading-relaxed">
                                        {aiPyCode || pythonScript}
                                     </pre>
                                  </div>

                                  <div className="text-[9.5px] text-slate-400 font-bold leading-normal font-sans">
                                     Click "Copy script" above and execute this fully functional module in your local Anaconda environment to reproduce parallel diffraction peak fitting matching this laboratory environment exactly.
                                  </div>
                               </div>
                            );
                         })()}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Topic 6: Interactive Troubleshooting Helpdesk with Filter */}
              {activeTopic === 'troubleshoot' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Environmental Diagnostic Helpdesk
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      Address systematic calibration errors, lattice deformities, indexing exceptions, or divergent fitting results. Use the quick filter bar.
                    </p>
                  </div>

                  {/* Filter Search Bar */}
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-850 relative">
                     <Search className="w-5 h-5 text-slate-400 shrink-0" />
                     <input
                       id="search-diagnostics"
                       type="text"
                       placeholder="Filter diagnostic FAQs (e.g., strain, instrument, slope, standard)..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="bg-transparent w-full border-none focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs"
                     />
                     {searchTerm && (
                       <button 
                         onClick={() => setSearchTerm('')}
                         className="text-[10px] font-black uppercase text-slate-450 hover:text-slate-650 tracking-wider"
                       >
                         Clear
                       </button>
                     )}
                  </div>

                  {/* FAQ List */}
                  <div className="space-y-4">
                    {filteredFAQs.length > 0 ? (
                      filteredFAQs.map((faq, i) => (
                        <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 shadow-sm transition-all group font-sans">
                           <div className="flex gap-4 items-start mb-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                               <LifeBuoy size={16} />
                             </div>
                             <div>
                               <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-normal mt-1 leading-normal">
                                 {faq.q}
                               </h4>
                               <div className="flex flex-wrap gap-1 mt-1.5">
                                 {faq.tags.map((tag, idx) => (
                                   <span key={idx} className="text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">
                                     #{tag}
                                   </span>
                                 ))}
                               </div>
                             </div>
                           </div>
                           <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed pl-12">
                             {faq.a}
                           </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                         <LifeBuoy className="w-10 h-10 text-slate-400 mx-auto mb-3 animate-bounce" />
                         <p className="text-xs text-slate-400 font-black uppercase tracking-wider">No diagnostic profiles match "{searchTerm}"</p>
                         <p className="text-[10px] text-slate-500 font-bold mt-1">Try testing other general words like "strain", "size", or "fwhm".</p>
                         <button 
                           onClick={() => setSearchTerm('')}
                           className="text-xs text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mt-4 border border-indigo-500/20 px-4 py-2 rounded-xl bg-indigo-500/5"
                         >
                           Reset Filter Search
                         </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Topic 7: Interactive AI-powered physics consultant */}
              {activeTopic === 'ai_advisor' && (
                <div id="ai-advisor-container" className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-fuchsia-500/20 font-mono">Cognitive Advisory</span>
                       <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                      Quantum Physics AI Advisor
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      Consult with our expert AI physics companion about X-ray diffraction mechanics, system calibrations, structural model fitting, and multi-phase troubleshooting.
                    </p>
                  </div>

                  {/* Preset quick prompt templates */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <Sparkles size={12} className="text-fuchsia-500" /> Choose an Expert Research Preset
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aiPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          id={`ai-preset-${idx}`}
                          onClick={() => submitAdvisorPrompt(preset.prompt)}
                          disabled={aiLoading}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 hover:border-fuchsia-500/30 text-left transition-all active:scale-98 group flex flex-col justify-between h-36 w-full"
                        >
                          <div>
                            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 group-hover:text-fuchsia-500 transition-colors leading-tight">{preset.title}</h4>
                            <p className="text-[10px] text-slate-455 dark:text-slate-400 leading-normal font-bold mt-1.5">{preset.desc}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-605 dark:group-hover:text-white tracking-wider flex items-center gap-1 mt-3">
                            Load query <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conversation Feed */}
                  <div className="border border-slate-150 dark:border-slate-850 rounded-[2rem] bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col h-[400px]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-550 animate-ping shrink-0" />
                        <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">Operational Science Connection</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setAiHistory([{ role: 'assistant', content: "Chat timeline re-initialized. Ask me anything about crystallography or peak profile refinement strategies!" }])}
                          className="text-[9.5px] font-black uppercase tracking-wider text-slate-450 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                        >
                          Reset Chat
                        </button>
                      </div>
                    </div>

                    {/* Output Scroll area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
                      {aiHistory.map((item, idx) => (
                        <div key={idx} className={`flex gap-4 items-start ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {item.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center shrink-0 shadow-sm border border-fuchsia-500/20">
                              <Brain size={16} />
                            </div>
                          )}
                          <div className={`p-4 max-w-[85%] rounded-[1.5rem] border ${
                            item.role === 'user' 
                              ? 'bg-slate-900 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white rounded-br-none' 
                              : 'bg-white text-slate-800 border-slate-150 dark:bg-slate-900 dark:text-slate-200 dark:border-white/5 rounded-bl-none'
                          }`}>
                            <div className="markdown-body leading-relaxed font-bold space-y-2">
                              <Markdown>{item.content}</Markdown>
                            </div>
                          </div>
                          {item.role === 'user' && (
                            <div className="w-8 h-8 rounded-xl bg-slate-900/5 dark:bg-white/10 text-slate-800 dark:text-white flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
                              U
                            </div>
                          )}
                        </div>
                      ))}

                      {aiLoading && (
                        <div className="flex gap-4 items-start justify-start">
                          <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center shrink-0 shadow-sm border border-fuchsia-500/20 animate-spin">
                            <RotateCcw size={16} />
                          </div>
                          <div className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] rounded-bl-none border border-slate-150 dark:border-white/5 text-slate-500 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-450 ml-1 font-sans">Deconvolving physical model matrix...</span>
                          </div>
                        </div>
                      )}

                      {aiError && (
                        <div className="p-4 bg-rose-500/5 border border-rose-500/25 text-rose-500 rounded-2xl text-[11px] font-sans font-bold flex flex-col gap-2">
                          <span>{aiError}</span>
                          <button
                            type="button"
                            onClick={() => submitAdvisorPrompt(aiHistory[aiHistory.length - 1]?.content || "")}
                            className="w-fit px-3 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                          >
                            Retry Last Command
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sticky prompt entry interface bar */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitAdvisorPrompt(aiPrompt);
                      }} 
                      className="p-3 border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 flex gap-2 shrink-0"
                    >
                      <input
                        id="ai-advisor-input"
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Type standard crystallography questions... (e.g. explain Lorentzian convolution)"
                        disabled={aiLoading}
                        className="bg-slate-50 dark:bg-slate-950 flex-1 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-450 border border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
                      />
                      <button
                        type="submit"
                        disabled={aiLoading || !aiPrompt.trim()}
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-colors shadow-md flex items-center gap-1.5"
                      >
                        Submit
                        <ArrowRight size={12} />
                      </button>
                    </form>
                  </div>

                  {/* API Key Configuration and Buying Protocol Portal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-855 relative overflow-hidden group/apikey">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Left Column: How to Buy/Get API Key */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
                          <Settings size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">API Key Setup & Acquisition</h3>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Step-by-step laboratory deployment</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-550/20 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                          <p className="text-[11px] text-slate-605 dark:text-slate-350 font-medium leading-relaxed">
                            <strong>Access Google AI Studio</strong>: Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold underline decoration-indigo-500/30 hover:decoration-indigo-500">Google AI Studio</a>. Sign in with any active Google/Gmail credential.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-550/20 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                          <p className="text-[11px] text-slate-605 dark:text-slate-350 font-medium leading-relaxed">
                            <strong>Generate an API Key</strong>: Click the prominent <strong>"Get API Key"</strong> button and select either an existing Cloud project or provision a brand new default sandbox workspace key.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-550/20 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                          <p className="text-[11px] text-slate-605 dark:text-slate-350 font-medium leading-relaxed">
                            <strong>Free Tier vs. Paid (Pay-As-You-Go)</strong>: The default setup gives a <em>Free Tier</em> for education and hobbyist work. To unlock high-frequency production volume, go to your Billing Settings, attach a payment method, and enable pay-as-you-go billing.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-550/20 flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                          <p className="text-[11px] text-slate-605 dark:text-slate-350 font-medium leading-relaxed">
                            <strong>Integrate and Save</strong>: Navigate to the application's <strong>Settings Menu</strong>, locate the <strong>Gemini API Key</strong> configuration field, paste your key, and save settings.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Key FAQ & Necessity */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-fuchsia-500/10 rounded-xl text-fuchsia-500 border border-fuchsia-500/20">
                            <HelpCircle size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Is Buying an API Key Necessary?</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Mandatory requirements decrypted</p>
                          </div>
                        </div>

                        <div className="space-y-3 text-[11px] text-slate-605 dark:text-slate-350 font-medium leading-relaxed">
                          <p>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider mr-1.5 font-mono">No, Not Necessary</span> 
                            For standard physical profiling and math solvers (d-spacing, Scherrer particle sizes, Williamson-Hall plots, Warren-Averbach, Polymer deconvolution, and Rietveld seq setup calculations), the app is **100% free and fully functional** executing right in your browser. No key or payment is required.
                          </p>
                          <p>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[9px] uppercase tracking-wider mr-1.5 font-mono">When Key is Required</span> 
                            The Gemini key is required **exclusively** for the *AI Science Advisor* chat companion (seen above) and dynamic *AI Material Peak suggestions*.
                          </p>
                          <p>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-wider mr-1.5 font-mono">Why Buy / Upgrade?</span> 
                            Upgrading to a paid Google AI Studio API key removes strict rate limiting (RPM/TPD limits) and offers enterprise-grade availability. It guarantees continuous access during peak laboratory research hours.
                          </p>
                        </div>
                      </div>

                      {/* Callout box */}
                      <div className="p-3.5 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/15 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold mt-4 flex items-center gap-3">
                        <span className="text-lg">💡</span>
                        <span>
                          <strong>Security Notice:</strong> Your configured API key is secure—it is stored exclusively on your device's browser local memory or as a server-side proxy environment variable. It is never shared with third parties.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Bottom Footer Action Bar */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                   {[1, 2, 3].map(i => (
                     <div key={`validator-${i}`} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-500/10 flex items-center justify-center text-[7px] font-black text-indigo-500 uppercase font-mono">
                       {i}
                     </div>
                   ))}
                </div>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] font-sans">Integrated Lab Audit Guild compliant</span>
             </div>
             
             <button 
               onClick={() => {
                 const currentIndex = topics.findIndex(t => t.id === activeTopic);
                 const nextTopic = topics[(currentIndex + 1) % topics.length].id;
                 setActiveTopic(nextTopic);
               }}
               className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md font-sans"
             >
               Next Directive
               <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};
