import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Layers,
  Sliders,
  Hash,
  Microscope,
  TrendingUp,
  Infinity,
  Network,
  Compass,
  Grid,
  Sparkles,
  Orbit,
  Magnet,
  Brain,
  Image as ImageIcon,
  Wand2,
  Terminal,
  BookOpen,
  Database,
  User,
  Settings2,
  FileDown,
  RefreshCw,
  Clock,
  ChevronDown,
  Command,
  Zap,
  Box,
  FileText,
  Play,
  RotateCcw,
  Check,
  Cpu,
  Atom,
  Radio,
  SlidersHorizontal,
  Table,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

export type Module =
  | 'bragg'
  | 'unit_cells'
  | 'fwhm'
  | 'selection'
  | 'compare'
  | 'scherrer'
  | 'wh'
  | 'monshi_scherrer'
  | 'double_voigt'
  | 'integral'
  | 'integral_adv'
  | 'wa'
  | 'method_of_moments'
  | 'preferred_orientation'
  | 'cohen'
  | 'metric_tensor'
  | 'supercell_transform'
  | 'pawley_lebail'
  | 'rir'
  | 'rietveld'
  | 'neutron'
  | 'magnetic'
  | 'dl'
  | 'image_analysis'
  | 'image_gen'
  | 'xrd_nano'
  | 'python_export'
  | 'learn'
  | 'profile'
  | 'settings'
  | 'database'
  | 'periodic_table'
  | 'residual_stress'
  | 'xrr';

export interface ScientificMenuBarProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  theme: string;
  wavelength?: number;
  setWavelength?: (w: number) => void;
  onCalculate?: () => void;
  onBatchCalculate?: () => void;
  onClearAll?: () => void;
  onExportPdf?: () => void;
  onOpenActivityLedger?: () => void;
  onOpenShortcuts?: () => void;
  isOnline?: boolean;
  firestoreSyncType?: 'idle' | 'syncing' | 'success' | 'error';
  pythonReady?: boolean;
  playSynthTone: (tone: any) => void;
  t: (key: string, defaultVal?: any) => any;
  isRTL?: boolean;
}

interface MenuItemData {
  id: Module;
  label: string;
  formula: string;
  badge: string;
  icon: any;
  shortcut?: string;
  color: string;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: any;
  items: MenuItemData[];
  actions?: Array<{
    label: string;
    icon: any;
    shortcut?: string;
    action: () => void;
    color?: string;
  }>;
}

export const RADIATION_SOURCES = [
  { name: 'Cu Kα₁', wavelength: 1.54060, energy: '8.048 keV', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { name: 'Mo Kα₁', wavelength: 0.71073, energy: '17.479 keV', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { name: 'Co Kα₁', wavelength: 1.78901, energy: '6.930 keV', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  { name: 'Fe Kα₁', wavelength: 1.93604, energy: '6.404 keV', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { name: 'Cr Kα₁', wavelength: 2.28970, energy: '5.415 keV', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { name: 'Synchrotron', wavelength: 0.50000, energy: '24.798 keV', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
];

export const MODULE_FORMULAS: Record<string, { formula: string; title: string; desc: string }> = {
  bragg: {
    formula: 'nλ = 2d·sin(θ)   ⇒   d_{hkl} = λ / [2·sin(θ)]',
    title: 'Bragg Law of Diffraction',
    desc: 'Constructive interference of monochromatic X-rays across periodic lattice planes'
  },
  unit_cells: {
    formula: '7 Systems · 14 Bravais Lattices · a, b, c, α, β, γ',
    title: 'Unit Cell Geometry',
    desc: 'Lattice parameters, unit cell volumes, and fractional atomic coordinate spaces'
  },
  fwhm: {
    formula: 'I(2θ) = η·L(2θ) + (1-η)·G(2θ)   |   β_{obs} = β_{sample} ⊕ β_{inst}',
    title: 'Peak Broadening & Deconvolution',
    desc: 'Pseudo-Voigt line profiling, instrument resolution function subtraction'
  },
  selection: {
    formula: 'SC: all   |   BCC: h+k+l = 2n   |   FCC: h,k,l all unmixed',
    title: 'Diffraction Selection Rules',
    desc: 'Systematic absences caused by translation symmetry and glide/screw operations'
  },
  scherrer: {
    formula: 'D = K·λ / [β_{size}·cos(θ)]   (K ≈ 0.94)',
    title: 'Scherrer Crystallite Domain Size',
    desc: 'Coherent diffracting column length determination from pure size broadening'
  },
  wh: {
    formula: 'β·cos(θ) = K·λ/D + 4ε·sin(θ)   (UDM / USDM / UDEDM)',
    title: 'Williamson-Hall Size-Strain Analysis',
    desc: 'Simultaneous linear separation of crystallite size and lattice microstrain'
  },
  monshi_scherrer: {
    formula: 'ln(β) = ln(K·λ/D) + ln(1/cos θ)',
    title: 'Monshi-Scherrer Logarithmic Scheme',
    desc: 'High-precision logarithmic transformation minimizing low-angle weight bias'
  },
  double_voigt: {
    formula: 'β_G² + β_L = f(Size, Strain)   |   Langford Deconvolution',
    title: 'Double-Voigt Method',
    desc: 'Rigorous analytical separation of Gaussian strain and Lorentzian size breadths'
  },
  integral: {
    formula: 'β = [∫ I(2θ) d(2θ)] / I_{max}   |   Area-to-Height Ratio',
    title: 'Integral Breadth Analysis',
    desc: 'Robust non-parametric measure of diffraction peak width resistant to asymmetry'
  },
  integral_adv: {
    formula: '(β*/d*)² = 1/D + (ε/2)·(d*/β*)   (Halder-Wagner)',
    title: 'Advanced Integral Breadth Models',
    desc: 'Halder-Wagner & Modified W-H parabolic size-strain deconvolution'
  },
  wa: {
    formula: 'A_L(s) = A_L^S · exp(-2π²L²⟨ε_L²⟩ s²)   |   Fourier Analysis',
    title: 'Warren-Averbach Size-Strain Fourier Method',
    desc: 'Full column-length distribution and root-mean-square microstrain ⟨ε_L²⟩'
  },
  method_of_moments: {
    formula: 'μ_n = ∫ (2θ - ⟨2θ⟩)^n · I(2θ) d(2θ) / ∫ I(2θ) d(2θ)',
    title: 'Method of Central Moments',
    desc: 'Higher-order variance, skewness, and kurtosis peak shape profiling'
  },
  residual_stress: {
    formula: 'σ_φ = - [E / (2(1+ν))] · cot(θ₀) · [∂(2θ) / ∂(sin²ψ)]',
    title: 'Residual Stress Analysis (sin²ψ Method)',
    desc: 'Macroscopic elastic residual stress tensor and interplanar strain gradient'
  },
  xrr: {
    formula: 'R(θ) = |r_{0,1} + r_{1,2}·e^{-2i k_{z,1} d}|² / |1 + r_{0,1}·r_{1,2}·e^{-2i k_{z,1} d}|²',
    title: 'X-Ray Reflectivity (Parratt Formalism)',
    desc: 'Thin-film thickness, interfacial roughness, and electronic density profiling'
  },
  preferred_orientation: {
    formula: 'P_{MD}(r, α) = (r²·cos²α + r⁻¹·sin²α)^{-3/2}',
    title: 'Preferred Orientation (March-Dollase)',
    desc: 'Texture coefficient and plate/needle habit correction in powder patterns'
  },
  cohen: {
    formula: '∑ α_i·x_i = ∑ δ_i   |   Least-Squares Matrix Normal Equations',
    title: "Cohen's Analytical Refinement",
    desc: 'Systematic elimination of drift, zero-shift, and displacement errors'
  },
  metric_tensor: {
    formula: 'G_{ij} = a_i · a_j   |   G* = G⁻¹   |   d_{hkl} = (h^T G* h)^{-1/2}',
    title: 'Crystallographic Metric Tensor',
    desc: 'Direct & reciprocal vector algebra, interplanar angles, and unit cell volume'
  },
  supercell_transform: {
    formula: 'a\' = M · a   |   V\' = |det(M)| · V   |   h\' = (M⁻¹)^T · h',
    title: 'Supercell & Subcell Transformation',
    desc: 'High-order crystallographic matrix transformations and domain superlattices'
  },
  pawley_lebail: {
    formula: 'I_k^{(n+1)} = ∑_i [y_i · I_k^{(n)} · Φ(2θ_i - 2θ_k)] / y_{ci}^{(n)}',
    title: 'Pawley & Le Bail Profile Decomposition',
    desc: 'Structure-factor-free whole powder pattern decomposition for unit cell testing'
  },
  rir: {
    formula: 'W_A / W_B = (I_A / I_B) · (RIR_B / RIR_A)   (Corundum I/I_c Matrix)',
    title: 'Reference Intensity Ratio (RIR)',
    desc: 'Semi-quantitative crystalline multi-phase mixture composition analysis'
  },
  rietveld: {
    formula: 'y_{ci} = S · ∑_k L_k |F_k|² Φ(2θ_i - 2θ_k) P_k + y_{bi}   |   Minimizing R_{wp}',
    title: 'Rietveld Full-Profile Refinement',
    desc: 'Whole-profile least-squares crystal structure refinement and quantitative analysis'
  },
  dl: {
    formula: 'P(Phase_k | I(2θ), hkl) = Softmax(W_{L} · ReLU(W_1 · X + b_1))',
    title: 'Deep Learning Neural Phase ID',
    desc: 'Multi-layer deep neural classifier for immediate powder phase identification'
  },
  image_analysis: {
    formula: 'I_{radial}(2θ) = ∮ I(R, φ) dφ   |   Hough Ring Deconvolution',
    title: 'Micrograph & 2D Pattern Digitizer',
    desc: 'Computer vision extraction of 1D diffractograms from 2D Debye-Scherrer rings'
  },
  image_gen: {
    formula: 'Direct-Space 3D Lattice Projection & Reciprocal Vector Rendering',
    title: 'Crystallographic Scientific Illustrator',
    desc: 'Publication-quality lattice visuals, reciprocal spheres, and diffraction paths'
  },
  xrd_nano: {
    formula: 'I(q) = ∑_i ∑_j f_i(q)·f_j(q) · sin(q·r_{ij}) / (q·r_{ij})   (Debye Equation)',
    title: 'XRD-Nano Quantum Mechanics Engine',
    desc: 'Nanoparticle structural modeling without periodic boundary assumptions'
  },
  python_export: {
    formula: 'import numpy as np; from scipy.optimize import curve_fit',
    title: 'Python Computational Script Generator',
    desc: 'Self-contained research scripts for Jupyter, OriginLab, and SciPy'
  },
  periodic_table: {
    formula: 'f_0(s) = ∑_{i=1}^4 a_i·exp(-b_i s²) + c   (Cromer-Mann Coefficients)',
    title: 'Periodic Table & Atomic Form Factors',
    desc: 'Atomic scattering factors, X-ray absorption edges, and elemental properties'
  },
  database: {
    formula: 'ICSD / COD / Materials Project Crystallographic Information Files (.cif)',
    title: 'Material Crystal Database Explorer',
    desc: 'Over 1,200 indexed standard crystalline phases, mineral structures, and alloys'
  },
  neutron: {
    formula: 'b_c = Nuclear Scattering Length   |   dσ/dΩ = |∑ b_j e^{i Q·r_j}|²',
    title: 'Neutron Powder Diffraction',
    desc: 'Light element localization (H, Li) and isotopic contrast diffraction physics'
  },
  magnetic: {
    formula: 'F_M(Q) = (γ r_0 / 2) · ∑_j ⟨j_0(Q)⟩ · S_{j,⊥} · e^{i Q·r_j}',
    title: 'Magnetic Neutron Diffraction',
    desc: 'Magnetic moment vector ordering, Shubnikov space groups, and spin structures'
  },
  learn: {
    formula: 'Standard Operating Procedures & Crystallography Principles',
    title: 'Laboratory Protocol & Theory Manual',
    desc: 'Comprehensive scientific handbook for powder diffraction and refinement'
  },
  profile: {
    formula: 'Director Node Identity · L-5 Senior Scientific Officer',
    title: 'Laboratory Director Profile',
    desc: 'Researcher credentials, lab projects, publications, and activity stats'
  },
  settings: {
    formula: 'Instrument Calibration · 2θ Zero-Shift · Decimals · Units',
    title: 'Workstation Calibration & System Settings',
    desc: 'Hardware goniometer radius, zero errors, themes, and audio telemetry'
  },
};

export const ScientificMenuBar: React.FC<ScientificMenuBarProps> = ({
  activeModule,
  setActiveModule,
  theme,
  wavelength = 1.54060,
  setWavelength,
  onCalculate,
  onBatchCalculate,
  onClearAll,
  onExportPdf,
  onOpenActivityLedger,
  onOpenShortcuts,
  isOnline = true,
  firestoreSyncType = 'idle',
  pythonReady = false,
  playSynthTone,
  t,
  isRTL = false,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showWavelengthPicker, setShowWavelengthPicker] = useState<boolean>(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const wavelengthRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
      if (wavelengthRef.current && !wavelengthRef.current.contains(e.target as Node)) {
        setShowWavelengthPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRadiation = RADIATION_SOURCES.find(
    (s) => Math.abs(s.wavelength - wavelength) < 0.001
  ) || {
    name: `λ=${wavelength.toFixed(4)}Å`,
    wavelength: wavelength,
    energy: 'Custom',
    color: 'text-violet-400 border-violet-500/30 bg-violet-500/10'
  };

  const activeFormulaData = MODULE_FORMULAS[activeModule] || MODULE_FORMULAS.bragg;

  const categories: MenuCategory[] = [
    {
      id: 'file',
      label: t('File', 'File'),
      icon: FolderOpen,
      actions: [
        {
          label: t('New / Reset Bragg Calculation', 'New Bragg Calculation'),
          icon: RotateCcw,
          shortcut: 'Cmd+Del',
          action: () => {
            if (onClearAll) onClearAll();
            setActiveModule('bragg');
            playSynthTone('switch');
          },
          color: 'text-amber-400'
        },
        {
          label: t('Execute Active Computation', 'Run Computation'),
          icon: Play,
          shortcut: 'Ctrl+↵',
          action: () => {
            if (onCalculate) onCalculate();
            playSynthTone('success');
          },
          color: 'text-emerald-400'
        },
        {
          label: t('Export Consolidated PDF Report', 'Export PDF Lab Report'),
          icon: FileDown,
          shortcut: 'Alt+P',
          action: () => {
            if (onExportPdf) onExportPdf();
            playSynthTone('success');
          },
          color: 'text-cyan-400'
        },
        {
          label: t('Open Telemetry Activity Ledger', 'Activity Audit Ledger'),
          icon: Activity,
          shortcut: 'Alt+L',
          action: () => {
            if (onOpenActivityLedger) onOpenActivityLedger();
            playSynthTone('switch');
          },
          color: 'text-indigo-400'
        },
        {
          label: t('Keyboard Shortcuts HUD', 'Keyboard Shortcuts Guide'),
          icon: Terminal,
          shortcut: 'Cmd+/',
          action: () => {
            if (onOpenShortcuts) onOpenShortcuts();
            playSynthTone('switch');
          },
          color: 'text-violet-400'
        },
      ],
      items: [
        {
          id: 'bragg',
          label: t('Bragg Basics Workbench', 'Bragg Basics Workbench'),
          formula: 'nλ = 2d·sin(θ)',
          badge: '2θ ↔ d',
          icon: Activity,
          shortcut: 'Alt+1',
          color: 'text-emerald-400'
        },
        {
          id: 'profile',
          label: t('Laboratory Director Node', 'Laboratory Director Node'),
          formula: 'L-5 Lead Investigator',
          badge: 'Profile',
          icon: User,
          color: 'text-indigo-400'
        },
        {
          id: 'settings',
          label: t('Workstation Settings & Calibration', 'Workstation Settings'),
          formula: 'Zero-shift, Radius, Decimals',
          badge: 'Config',
          icon: Settings2,
          shortcut: 'Alt+9',
          color: 'text-slate-400'
        }
      ]
    },
    {
      id: 'diffraction',
      label: t('Diffraction', 'Diffraction'),
      icon: Activity,
      items: [
        {
          id: 'bragg',
          label: t('Bragg Basics & Indexing', 'Bragg Basics & Indexing'),
          formula: 'nλ = 2d·sin(θ)',
          badge: 'Bragg',
          icon: Activity,
          shortcut: 'Alt+1',
          color: 'text-emerald-400'
        },
        {
          id: 'unit_cells',
          label: t('Unit Cells & 7 Crystal Systems', 'Unit Cells & 7 Systems'),
          formula: '7 Systems · 14 Bravais',
          badge: 'Bravais',
          icon: Box,
          color: 'text-cyan-400'
        },
        {
          id: 'fwhm',
          label: t('FWHM Peak Broadening Profiling', 'FWHM Peak Profiling'),
          formula: 'Pseudo-Voigt η·L + (1-η)G',
          badge: 'Broadening',
          icon: Sliders,
          shortcut: 'Alt+2',
          color: 'text-amber-400'
        },
        {
          id: 'selection',
          label: t('Systematic Absences & Selection Rules', 'Selection Rules (hkl)'),
          formula: 'Space Group Extinctions',
          badge: 'Rules',
          icon: Hash,
          shortcut: 'Alt+3',
          color: 'text-violet-400'
        },
        {
          id: 'preferred_orientation',
          label: t('Preferred Orientation (March-Dollase)', 'Preferred Orientation'),
          formula: 'P_{MD}(r, α)',
          badge: 'Texture',
          icon: Compass,
          color: 'text-rose-400'
        },
        {
          id: 'residual_stress',
          label: t('Residual Stress Tensor (sin²ψ)', 'Residual Stress (sin²ψ)'),
          formula: 'σ_φ = -E/[2(1+ν)]·cot θ₀·∂(2θ)/∂(sin²ψ)',
          badge: 'Stress',
          icon: Activity,
          color: 'text-indigo-400'
        },
        {
          id: 'xrr',
          label: t('XRR Thin Film Reflectivity', 'X-Ray Reflectivity (XRR)'),
          formula: 'Parratt Formalism R(θ)',
          badge: 'Thin Films',
          icon: Layers,
          color: 'text-teal-400'
        }
      ]
    },
    {
      id: 'size_strain',
      label: t('Size & Strain', 'Size & Strain'),
      icon: Microscope,
      items: [
        {
          id: 'scherrer',
          label: t('Scherrer Crystallite Size', 'Scherrer Crystallite Size'),
          formula: 'D = Kλ / (β·cos θ)',
          badge: 'Domain Size',
          icon: Microscope,
          shortcut: 'Alt+4',
          color: 'text-cyan-400'
        },
        {
          id: 'wh',
          label: t('Williamson-Hall Analysis (UDM/USDM/UDEDM)', 'Williamson-Hall (W-H)'),
          formula: 'β·cos θ = Kλ/D + 4ε·sin θ',
          badge: 'Size-Strain',
          icon: TrendingUp,
          shortcut: 'Alt+5',
          color: 'text-emerald-400'
        },
        {
          id: 'monshi_scherrer',
          label: t('Monshi-Scherrer Logarithmic Scheme', 'Monshi-Scherrer Scheme'),
          formula: 'ln(β) = ln(Kλ/D) + ln(1/cos θ)',
          badge: 'Log Linear',
          icon: Activity,
          color: 'text-amber-400'
        },
        {
          id: 'double_voigt',
          label: t('Double-Voigt Method', 'Double-Voigt Method'),
          formula: 'β_G² + β_L Deconvolution',
          badge: 'Voigt',
          icon: Layers,
          color: 'text-violet-400'
        },
        {
          id: 'integral',
          label: t('Integral Breadth Method', 'Integral Breadth (IB)'),
          formula: 'β = ∫ I(2θ)d(2θ) / I_{max}',
          badge: 'Area/Height',
          icon: Infinity,
          color: 'text-blue-400'
        },
        {
          id: 'integral_adv',
          label: t('Advanced IB (Halder-Wagner)', 'Advanced IB (Halder-Wagner)'),
          formula: '(β*/d*)² = 1/D + (ε/2)(d*/β*)',
          badge: 'Parabolic',
          icon: SlidersHorizontal,
          color: 'text-indigo-400'
        },
        {
          id: 'wa',
          label: t('Warren-Averbach Fourier Coefficients', 'Warren-Averbach Fourier'),
          formula: 'A_L(s) = A_L^S · exp(-2π²L²⟨ε_L²⟩s²)',
          badge: 'Fourier',
          icon: Network,
          color: 'text-fuchsia-400'
        },
        {
          id: 'method_of_moments',
          label: t('Method of Central Moments', 'Method of Central Moments'),
          formula: 'μ_n = ∫ (2θ-⟨2θ⟩)^n I(2θ) d(2θ)',
          badge: 'Variance',
          icon: Activity,
          color: 'text-teal-400'
        }
      ]
    },
    {
      id: 'refinement',
      label: t('Refinement', 'Refinement'),
      icon: Grid,
      items: [
        {
          id: 'cohen',
          label: t("Cohen's Least-Squares Matrix Method", "Cohen's Matrix Refinement"),
          formula: 'Least-Squares Normal Equations',
          badge: 'Δa, Δc Error',
          icon: Grid,
          color: 'text-amber-400'
        },
        {
          id: 'metric_tensor',
          label: t('Crystallographic Metric Tensor Algebra', 'Metric Tensor G_{ij}'),
          formula: 'G_{ij} = a_i · a_j  |  G* = G⁻¹',
          badge: 'Reciprocal',
          icon: Sparkles,
          color: 'text-cyan-400'
        },
        {
          id: 'supercell_transform',
          label: t('Supercell & Subcell Transformation', 'Supercell & Matrix Engine'),
          formula: "a' = M·a  |  V' = |det M|·V",
          badge: 'Matrix M',
          icon: Box,
          color: 'text-emerald-400'
        },
        {
          id: 'pawley_lebail',
          label: t('Pawley & Le Bail Profile Fitting', 'Pawley & Le Bail Fitting'),
          formula: 'Structure-Factor-Free Fit',
          badge: 'Le Bail',
          icon: Activity,
          color: 'text-indigo-400'
        },
        {
          id: 'rir',
          label: t('Reference Intensity Ratio (RIR)', 'Reference Intensity Ratio (RIR)'),
          formula: 'W_A/W_B = (I_A/I_B)·(RIR_B/RIR_A)',
          badge: 'Quantitative',
          icon: Layers,
          color: 'text-purple-400'
        },
        {
          id: 'rietveld',
          label: t('Rietveld Full-Pattern Refinement', 'Rietveld Refinement'),
          formula: 'Minimizing R_{wp}, R_p, χ²',
          badge: 'Full Profile',
          icon: Sliders,
          shortcut: 'Alt+6',
          color: 'text-rose-400'
        }
      ]
    },
    {
      id: 'ai_neural',
      label: t('Neural & AI', 'Neural & AI'),
      icon: Brain,
      items: [
        {
          id: 'dl',
          label: t('Deep Learning Phase Identification', 'PhaseID Neural Net'),
          formula: 'ResNet-XRD / Deep MLP Engine',
          badge: 'Phase ID',
          icon: Brain,
          shortcut: 'Alt+7',
          color: 'text-fuchsia-400'
        },
        {
          id: 'image_analysis',
          label: t('AI Micrograph & Pattern Image Digitizer', 'Image Analysis AI'),
          formula: 'Hough Ring Deconvolution & OCR',
          badge: 'Vision',
          icon: ImageIcon,
          color: 'text-pink-400'
        },
        {
          id: 'image_gen',
          label: t('Crystallographic Scientific Illustrator', 'Scientific Illustrator'),
          formula: 'Direct & Reciprocal 3D Projection',
          badge: 'Illustrator',
          icon: Sparkles,
          color: 'text-cyan-400'
        },
        {
          id: 'xrd_nano',
          label: t('XRD-Nano Quantum Mechanics Engine', 'XRD-Nano AI Physics'),
          formula: 'Debye Scattering Equation (Nanoparticles)',
          badge: 'Quantum Nano',
          icon: Wand2,
          color: 'text-indigo-400'
        }
      ]
    },
    {
      id: 'radiation_materials',
      label: t('Radiation & Data', 'Radiation & Data'),
      icon: Orbit,
      items: [
        {
          id: 'neutron',
          label: t('Neutron Powder Diffraction', 'Neutron Powder Diffraction'),
          formula: 'Nuclear Scattering Lengths b_c',
          badge: 'Neutron',
          icon: Orbit,
          color: 'text-blue-400'
        },
        {
          id: 'magnetic',
          label: t('Magnetic Neutron Diffraction', 'Magnetic Neutron Form Factor'),
          formula: '⟨j_0(Q)⟩ Spin Vector Ordering',
          badge: 'Magnetic',
          icon: Magnet,
          color: 'text-rose-400'
        },
        {
          id: 'periodic_table',
          label: t('Interactive Periodic Table of Elements', 'Periodic Table & Form Factors'),
          formula: 'Z=1..118, Cromer-Mann f_0(s), Edges',
          badge: 'Z=1..118',
          icon: Table,
          color: 'text-amber-400'
        },
        {
          id: 'database',
          label: t('Material Crystal Database Explorer', 'Material Crystal Registry'),
          formula: 'ICSD / COD / Materials Project Structures',
          badge: '1,200+ Crystals',
          icon: Database,
          shortcut: 'Alt+8',
          color: 'text-emerald-400'
        }
      ]
    },
    {
      id: 'tools',
      label: t('Tools & Scripts', 'Tools & Scripts'),
      icon: Terminal,
      items: [
        {
          id: 'python_export',
          label: t('Python Computational Script Generator', 'Python Script Generator'),
          formula: 'NumPy, SciPy, Lmfit, OriginLab',
          badge: 'Python Script',
          icon: Terminal,
          color: 'text-emerald-400'
        },
        {
          id: 'compare',
          label: t('Multi-Pattern Superposition & Difference', 'Diffraction Compare'),
          formula: 'ΔI(2θ) = I_{obs}(2θ) - I_{calc}(2θ)',
          badge: 'Overlay',
          icon: Layers,
          color: 'text-indigo-400'
        },
        {
          id: 'learn',
          label: t('Complete Protocol & Theory Manual', 'Scientific Protocol Guide'),
          formula: 'Standard Operating Procedures & Formulas',
          badge: 'Handbook',
          icon: BookOpen,
          color: 'text-cyan-400'
        }
      ]
    }
  ];

  return (
    <div
      ref={menuContainerRef}
      className={`hidden md:flex flex-col border-b select-none transition-colors duration-200 z-30 ${
        theme === 'cyberpunk'
          ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent'
          : 'bg-slate-900/95 dark:bg-[#070D1B]/95 text-slate-200 border-slate-800/80 dark:border-indigo-500/20'
      }`}
    >
      {/* 1. TOP SCIENTIFIC DESKTOP MENU BAR */}
      <div className="flex items-center justify-between px-3 lg:px-5 py-1 text-xs border-b border-white/5 font-sans">
        {/* Left Side: Desktop Dropdown Menus */}
        <div className="flex items-center gap-0.5 lg:gap-1">
          {categories.map((cat) => {
            const isOpen = openMenu === cat.id;
            const CatIcon = cat.icon;
            const hasActiveModule = cat.items.some((i) => i.id === activeModule);

            return (
              <div key={cat.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(isOpen ? null : cat.id);
                    playSynthTone('switch');
                  }}
                  onMouseEnter={() => {
                    if (openMenu !== null && openMenu !== cat.id) {
                      setOpenMenu(cat.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all ${
                    isOpen
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : hasActiveModule
                      ? 'bg-white/10 text-indigo-300 font-bold hover:bg-white/15'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CatIcon className="w-3 h-3 opacity-80" />
                  <span>{cat.label}</span>
                  <ChevronDown
                    className={`w-2.5 h-2.5 opacity-60 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className={`absolute top-full mt-1 w-80 lg:w-96 rounded-xl border p-2 shadow-2xl backdrop-blur-2xl z-50 ${
                        isRTL ? 'right-0' : 'left-0'
                      } ${
                        theme === 'cyberpunk'
                          ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_30px_rgba(0,255,255,0.3)]'
                          : 'bg-slate-900/95 dark:bg-[#070D1C]/98 border-slate-700/70 dark:border-indigo-500/30 text-slate-100 shadow-2xl shadow-black/80'
                      }`}
                    >
                      {/* Optional Action Buttons (e.g. for File menu) */}
                      {cat.actions && cat.actions.length > 0 && (
                        <div className="pb-1.5 mb-1.5 border-b border-white/10 space-y-0.5">
                          <div className="px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase tracking-widest text-slate-400">
                            {t('Session Actions', 'Session Actions')}
                          </div>
                          {cat.actions.map((act, idx) => {
                            const ActIcon = act.icon;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  act.action();
                                  setOpenMenu(null);
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left rtl:text-right text-xs transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  <ActIcon className={`w-3.5 h-3.5 ${act.color || 'text-indigo-400'} group-hover:scale-110 transition-transform`} />
                                  <span className="font-medium text-slate-200 group-hover:text-white">
                                    {act.label}
                                  </span>
                                </div>
                                {act.shortcut && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-white/5">
                                    {act.shortcut}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Menu Module List */}
                      <div className="px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                        <span>{t('Modules & Physics', 'Modules & Physics')}</span>
                        <span className="text-indigo-400">{cat.items.length} {t('methods', 'methods')}</span>
                      </div>

                      <div className="space-y-0.5 mt-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5">
                        {cat.items.map((item) => {
                          const isCurrent = activeModule === item.id;
                          const ItemIcon = item.icon;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveModule(item.id);
                                setOpenMenu(null);
                                playSynthTone('switch');
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left rtl:text-right transition-all group ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                  : 'hover:bg-white/10 text-slate-200 hover:text-white'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 pr-2">
                                <div
                                  className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                                    isCurrent
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                                  }`}
                                >
                                  <ItemIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs truncate">
                                      {item.label}
                                    </span>
                                    {isCurrent && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-mono truncate mt-0.5 ${
                                      isCurrent
                                        ? 'text-indigo-100'
                                        : 'text-slate-400 group-hover:text-slate-300'
                                    }`}
                                  >
                                    {item.formula}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                    isCurrent
                                      ? 'bg-white/20 text-white border-white/30'
                                      : 'bg-black/30 text-slate-400 border-white/5'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                                {item.shortcut && (
                                  <span className="text-[9px] font-mono text-slate-500">
                                    {item.shortcut}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Right Side: Quick Action Hotkeys & Lab Status */}
        <div className="flex items-center gap-2">
          {onCalculate && (
            <button
              type="button"
              onClick={() => {
                onCalculate();
                playSynthTone('success');
              }}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-mono font-bold transition-colors cursor-pointer"
              title="Run Calculation (Ctrl+Enter)"
            >
              <Play className="w-2.5 h-2.5 fill-emerald-300" />
              <span>{t('Calculate', 'Calculate')}</span>
              <span className="text-[9px] opacity-70 border-l border-emerald-400/30 pl-1">Ctrl+↵</span>
            </button>
          )}

          {onExportPdf && (
            <button
              type="button"
              onClick={() => {
                onExportPdf();
                playSynthTone('success');
              }}
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-[10.5px] font-mono font-bold transition-colors cursor-pointer"
              title="Export PDF Lab Report"
            >
              <FileDown className="w-2.5 h-2.5" />
              <span>{t('PDF Report', 'PDF Report')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SCIENTIFIC INSTRUMENT STATUS & FORMULA RIBBON */}
      <div className="flex flex-wrap items-center justify-between px-3 lg:px-5 py-1.5 bg-black/40 border-t border-white/5 text-xs font-mono gap-2">
        {/* Left Side: X-Ray Source & Wavelength Selector */}
        <div className="flex items-center gap-3">
          {/* Anode Tube Selector */}
          <div className="relative" ref={wavelengthRef}>
            <button
              type="button"
              onClick={() => {
                setShowWavelengthPicker(!showWavelengthPicker);
                playSynthTone('switch');
              }}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${currentRadiation.color} hover:brightness-110`}
              title="Select X-ray Target Anode Tube Wavelength"
            >
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="font-mono">
                {currentRadiation.name} : {wavelength.toFixed(5)} Å
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showWavelengthPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Wavelength Picker Dropdown */}
            <AnimatePresence>
              {showWavelengthPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1.5 w-64 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl p-2 shadow-2xl z-50 space-y-1"
                >
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>{t('X-Ray Anode Target Sources', 'X-Ray Anode Sources')}</span>
                    <Radio className="w-3 h-3 text-indigo-400" />
                  </div>
                  {RADIATION_SOURCES.map((source, idx) => {
                    const isSelected = Math.abs(source.wavelength - wavelength) < 0.001;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (setWavelength) setWavelength(source.wavelength);
                          setShowWavelengthPicker(false);
                          playSynthTone('switch');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{source.name}</span>
                          <span className="text-[10px] opacity-75">{source.energy}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400">{source.wavelength.toFixed(5)} Å</span>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Module Governing Formula Readout */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              {activeFormulaData.title}:
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-300 tracking-wide">
              {activeFormulaData.formula}
            </span>
          </div>
        </div>

        {/* Right Side: Scientific Instrument Indicators */}
        <div className="flex items-center gap-2">
          {/* Python Engine Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
              pythonReady
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title={pythonReady ? 'Python Core Online & Ready' : 'Python Server Initializing'}
          >
            <Cpu className="w-3 h-3" />
            <span>Python {pythonReady ? 'Ready' : 'Booting'}</span>
          </div>

          {/* Cloud / Offline Database Status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
              firestoreSyncType === 'syncing'
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 animate-pulse'
                : isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title={isOnline ? 'Cloud Firestore Synchronized' : 'Local IndexedDB Active'}
          >
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">
              {firestoreSyncType === 'syncing'
                ? 'Syncing...'
                : isOnline
                ? 'Cloud Linked'
                : 'IndexedDB'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
