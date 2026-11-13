import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import {
  Search,
  X,
  Activity,
  Sliders,
  Hash,
  Layers,
  Microscope,
  TrendingUp,
  Infinity as InfinityIcon,
  Network,
  BookOpen,
  Grid,
  Database,
  User,
  Settings2,
  Orbit,
  Magnet,
  Brain,
  Image as ImageIcon,
  Terminal,
  ChevronRight,
  Atom,
  FlaskConical,
  Compass,
  Zap,
  LayoutGrid,
  List,
  SlidersHorizontal,
  BarChart3,
  ArrowUpRight,
  Star,
  Target,
  CheckCircle2,
  SlidersVertical,
  History,
  Play,
  RotateCcw,
  Workflow,
  Box,
  Sparkles,
  Rows3,
  HelpCircle
} from 'lucide-react';

export type ModuleId =
  | 'unit_cells'
  | 'bragg'
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
  | 'rietveld'
  | 'pdf_analysis'
  | 'rir'
  | 'neutron'
  | 'magnetic'
  | 'dl'
  | 'image_analysis'
  | 'python_export'
  | 'learn'
  | 'profile'
  | 'settings'
  | 'database'
  | 'periodic_table'
  | 'residual_stress'
  | 'xrr';

export interface ModuleMetadata {
  id: ModuleId;
  label: string;
  categoryId: string;
  category: string;
  categoryIcon: React.ReactNode;
  subtitle: string;
  formula: string;
  tags: string[];
  icon: React.ReactNode;
  inputs: string[];
  outputs: string[];
  subModels?: string[];
  recommendedRange?: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  descriptionDetail: string;
  suggestedNext: ModuleId[];
  isPopular?: boolean;
}

export interface ResearchPathway {
  id: string;
  title: string;
  titleFa: string;
  description: string;
  descriptionFa: string;
  icon: React.ReactNode;
  moduleIds: ModuleId[];
  tag: string;
  stepLabels: string[];
  stepLabelsFa: string[];
}

interface DecisionGoal {
  id: string;
  question: string;
  questionFa: string;
  moduleIds: ModuleId[];
}

interface ScientificModuleNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  theme?: string;
}

const FAVORITES_STORAGE_KEY = 'xrd_suite_favorite_modules_v2';
const RECENTS_STORAGE_KEY = 'xrd_suite_recent_modules_v2';

const VALID_MODULE_IDS = new Set<string>([
  'bragg',
  'unit_cells',
  'fwhm',
  'selection',
  'preferred_orientation',
  'compare',
  'scherrer',
  'wh',
  'integral_adv',
  'double_voigt',
  'wa',
  'method_of_moments',
  'residual_stress',
  'xrr',
  'cohen',
  'metric_tensor',
  'supercell_transform',
  'pawley_lebail',
  'rietveld',
  'pdf_analysis',
  'rir',
  'neutron',
  'magnetic',
  'python_export',
  'dl',
  'image_analysis',
  'learn',
  'periodic_table',
  'database',
  'profile',
  'settings'
]);

export const ScientificModuleNavigator: React.FC<ScientificModuleNavigatorProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
  theme = 'light'
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'fa', 'ar', 'ur', 'ps', 'yi', 'sd', 'ku', 'ug'].includes(i18n.language);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid' | 'compact'>('grouped');
  const [sortBy, setSortBy] = useState<'default' | 'alpha' | 'complexity'>('default');
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [inspectedModuleId, setInspectedModuleId] = useState<ModuleId>(
    VALID_MODULE_IDS.has(activeModule) ? activeModule : 'bragg'
  );

  // Favorites & Recents State (sanitized against deprecated module IDs)
  const [favorites, setFavorites] = useState<ModuleId[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved).filter((id: string) => VALID_MODULE_IDS.has(id));
        if (parsed.length > 0) return parsed;
      }
      return ['bragg', 'scherrer', 'wh', 'integral_adv', 'pawley_lebail'];
    } catch {
      return ['bragg', 'scherrer', 'wh', 'integral_adv', 'pawley_lebail'];
    }
  });

  const [recents, setRecents] = useState<ModuleId[]>(() => {
    try {
      const saved = localStorage.getItem(RECENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved).filter((id: string) => VALID_MODULE_IDS.has(id));
        if (parsed.length > 0) return parsed;
      }
      return ['bragg', 'scherrer', 'integral_adv', 'wh'];
    } catch {
      return ['bragg', 'scherrer', 'integral_adv', 'wh'];
    }
  });

  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleFavorite = useCallback((id: ModuleId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Could not save favorites', err);
      }
      return next;
    });
  }, []);

  const recordRecent = useCallback((id: ModuleId) => {
    setRecents(prev => {
      const filtered = prev.filter(item => item !== id);
      const next = [id, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Could not save recents', err);
      }
      return next;
    });
  }, []);

  // Authoritative 29-Engine Catalog synchronized with App.tsx
  const moduleList = useMemo<ModuleMetadata[]>(() => {
    const defaultIconClass = 'w-4 h-4';
    return [
      // 1. Fundamentals & Optics (6)
      {
        id: 'bragg',
        label: t('Bragg Basics & Optics', 'Bragg Basics & Optics'),
        categoryId: 'fundamentals',
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-500" />,
        subtitle: t('Interplanar d-spacing, 2θ diffraction angles, Q-vector & harmonic orders', 'Interplanar d-spacing, 2θ diffraction angles, Q-vector & harmonic orders'),
        formula: 'nλ = 2d·sin(θ)',
        tags: ['d-spacing', '2Theta', 'Q-vector', 'Wavelength', 'Bragg', 'Optics'],
        icon: <Activity className={`${defaultIconClass} text-cyan-500`} />,
        inputs: ['Wavelength λ (Cu, Co, Mo, Cr, Synchrotron)', 'Bragg Angle 2θ (°)', 'Miller Indices (hkl)'],
        outputs: ['Interplanar Spacing d (Å)', 'Scattering Vector Q (Å⁻¹)', 'Harmonic Reflection Orders n'],
        subModels: ['Direct 2θ → d Solver', 'Cubic/Hexagonal/Tetragonal hkl Indexing', 'Multi-Anode Wavelength Converter'],
        recommendedRange: '2θ: 5° – 140°',
        complexity: 'Beginner',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'پایه و اساس پراش پرتو ایکس؛ پیوند مستقیم بین طول موج تابشی، فاصله صفحات اتمی و زاویه تداخل سازنده امواج براگ.'
          : 'Core X-ray diffraction kinematics linking incident wavelength, interplanar spacing d(hkl), reciprocal wavevector Q, and constructive interference angles.',
        suggestedNext: ['unit_cells', 'selection', 'fwhm']
      },
      {
        id: 'unit_cells',
        label: t('14 Bravais & Crystal Systems', '14 Bravais & Crystal Systems'),
        categoryId: 'fundamentals',
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-500" />,
        subtitle: t('Interactive 3D unit cell geometry, Miller planes (hkl) & 14 Bravais lattices', 'Interactive 3D unit cell geometry, Miller planes (hkl) & 14 Bravais lattices'),
        formula: 'V = a·b·c√(1 - cos²α - cos²β - cos²γ + 2cosα·cosβ·cosγ)',
        tags: ['Unit Cell', 'Crystal Systems', 'Bravais Lattices', 'Miller Planes', 'HKL', 'Cubic', 'Hexagonal'],
        icon: <Box className={`${defaultIconClass} text-amber-500`} />,
        inputs: ['7 Crystal Systems', 'Lattice Constants (a, b, c, α, β, γ)', 'Miller Plane (h k l) & Parallel Stack'],
        outputs: ['3D Unit Cell & Miller Plane Slicing', 'Unit Cell Volume V (Å³)', 'Interplanar d(hkl) & Plane Normal'],
        subModels: ['3D Real-Space Bravais Lattice Viewer', 'Interactive (hkl) Plane Interceptor', 'Reciprocal Normal Vector Probe'],
        recommendedRange: 'All 7 Crystal Systems · 14 Lattices',
        complexity: 'Beginner',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'بخش جامع بلورشناسی پیرامون سلول‌های واحد، صفحات میلر (hkl) و ویژگی‌های تقارنی ۷ دستگاه بلوری و ۱۴ شبکه براوه.'
          : 'Interactive 3D crystallography studio covering primitive and centered Bravais lattices, real-time Miller plane (hkl) slicing, and interplanar geometry.',
        suggestedNext: ['bragg', 'selection', 'metric_tensor']
      },
      {
        id: 'fwhm',
        label: t('FWHM Profile Fitting', 'FWHM Profile Fitting'),
        categoryId: 'fundamentals',
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-500" />,
        subtitle: t('Gaussian, Lorentzian & Pseudo-Voigt line profile deconvolution', 'Gaussian, Lorentzian & Pseudo-Voigt line profile deconvolution'),
        formula: 'I(2θ) = η·L(2θ) + (1 - η)·G(2θ)',
        tags: ['FWHM', 'Line Shape', 'Gaussian', 'Lorentzian', 'Pseudo-Voigt', 'Caglioti'],
        icon: <Sliders className={`${defaultIconClass} text-blue-500`} />,
        inputs: ['Observed Peak FWHM (β_obs)', 'Instrumental Caglioti (U, V, W)', 'Mixing Parameter η'],
        outputs: ['Intrinsic Physical FWHM (β_sample)', 'Lorentzian/Gaussian Shape Factor', 'Integrated Peak Area'],
        subModels: ['Pseudo-Voigt Profile Synthesizer', 'Caglioti Instrumental Deconvolution', 'Kα₁ / Kα₂ Doublet Stripper'],
        recommendedRange: 'β: 0.02° – 3.50° 2θ',
        complexity: 'Intermediate',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'برازش پیشرفته اشکال خطوط پراش جهت استخراج دقیق پهنای پیک و حذف پهن‌شدگی دستگاهی.'
          : 'High-precision profile deconvolution separating instrumental Caglioti broadening from intrinsic sample broadening.',
        suggestedNext: ['scherrer', 'wh', 'integral_adv']
      },
      {
        id: 'selection',
        label: t('Selection & Extinction Rules', 'Selection & Extinction Rules'),
        categoryId: 'fundamentals',
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-500" />,
        subtitle: t('Systematic space-group absences, structure factor |F|² & 3D Ewald sphere', 'Systematic space-group absences, structure factor |F|² & 3D Ewald sphere'),
        formula: 'F(hkl) = Σ f_j·exp[2πi(hx_j + ky_j + lz_j)]',
        tags: ['HKL', 'Extinction', 'BCC', 'FCC', 'Symmetry', 'Ewald', 'Structure Factor'],
        icon: <Hash className={`${defaultIconClass} text-indigo-500`} />,
        inputs: ['Bravais Centering (P, I, F, C, R)', 'Glide Planes & Screw Axes', 'Reflection Index (hkl)'],
        outputs: ['Allowed / Forbidden Extinction Matrix', 'Structure Factor |F(hkl)|²', '3D Ewald Sphere Intersection'],
        subModels: ['Translational Symmetry Extinction Table', '3D Reciprocal Ewald Sphere Simulator', 's² Ratio Sequence Indexer'],
        recommendedRange: 'h² + k² + l² ≤ 64',
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'موتور جامع قوانین خاموشی سیستم‌های بلوری همراه با کاوشگر تعاملی ۳ بعدی فضای معکوس و کره اولد.'
          : 'Translational symmetry extinction matrix with interactive 3D Ewald sphere diffraction condition geometry.',
        suggestedNext: ['cohen', 'metric_tensor', 'bragg']
      },
      {
        id: 'preferred_orientation',
        label: t('Preferred Orientation (March-Dollase)', 'Preferred Orientation'),
        categoryId: 'fundamentals',
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-500" />,
        subtitle: t('Crystallographic texture & pole density correction for platelets and needles', 'Crystallographic texture & pole density correction for platelets and needles'),
        formula: 'P(α) = (r²·cos²α + r⁻¹·sin²α)^(-3/2)',
        tags: ['Texture', 'March-Dollase', 'Pole Density', 'Orientation', 'Preferred', 'Harris Index'],
        icon: <Compass className={`${defaultIconClass} text-teal-500`} />,
        inputs: ['March-Dollase Coefficient r', 'Interplanar Angle α to Texture Axis', 'Observed vs Random I(hkl)'],
        outputs: ['Pole Density Factor P(α)', 'Lotgering Factor f_L', 'Texture-Corrected Intensities'],
        subModels: ['March-Dollase Ellipsoidal Model', 'Harris Texture Index T(hkl)', 'Lotgering Orientation Factor'],
        recommendedRange: 'r: 0.25 (platy) – 2.50 (acicular)',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'مدل‌سازی بافت و ناهمسانگردی جهت‌گیری دانه‌ها در لایه‌های نازک یا پودرهای فشرده.'
          : 'Quantifies crystallographic texture and corrects intensity distortions caused by platelet or needle crystallite alignment.',
        suggestedNext: ['residual_stress', 'xrr', 'rir']
      },
      {
        id: 'compare',
        label: t('Diffraction Compare Engine', 'Diffraction Compare Engine'),
        categoryId: 'fundamentals',
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-500" />,
        subtitle: t('Multi-pattern waterfall overlay, peak shift Δ2θ tracking & similarity metrics', 'Multi-pattern waterfall overlay, peak shift Δ2θ tracking & similarity metrics'),
        formula: 'S_cos = (A · B) / (‖A‖·‖B‖)',
        tags: ['Overlay', 'Comparative', 'Multi-Phase', 'Matching', 'Spectral', 'Waterfall'],
        icon: <Layers className={`${defaultIconClass} text-sky-500`} />,
        inputs: ['Experimental & Reference Peak Lists', 'Zero-Shift Offset Δ2θ', 'Intensity Normalization Mode'],
        outputs: ['Stacked / Overlay Diffractogram', 'Peak Position Shift Table (Δ2θ, Δd)', 'Cosine & Pearson Similarity Score'],
        subModels: ['Multi-Scan Waterfall Stacker', 'Automatic Peak-to-Reference Matcher', 'Solid-Solution Vegard Shift Tracker'],
        recommendedRange: '2θ: 5° – 120°',
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'میز کار همپوشانی طیفی چندگانه برای مقایسه داده‌های سنتز شده با استانداردهای مرجع یا چند نمونه.'
          : 'Side-by-side spectral comparison workbench to overlay multiple scans against reference standards and track lattice shifts.',
        suggestedNext: ['rir', 'dl', 'pawley_lebail']
      },

      // 2. Size, Strain & Reflectometry (8)
      {
        id: 'scherrer',
        label: t('Scherrer & Monshi Studio', 'Scherrer & Monshi Studio'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Unified Scherrer, Monshi-Scherrer logarithmic & multi-model domain sizing', 'Unified Scherrer, Monshi-Scherrer logarithmic & multi-model domain sizing'),
        formula: 'D = Kλ/(β·cosθ)  ·  ln(β) = ln(Kλ/D) + ln(1/cosθ)',
        tags: ['Grain Size', 'Scherrer', 'Monshi', 'Logarithmic Fit', 'Nanocrystals', 'Shape Factor K', 'SSP'],
        icon: <Microscope className={`${defaultIconClass} text-emerald-500`} />,
        inputs: ['Multi-Peak (2θ, FWHM, hkl)', 'Crystallite Shape Factor K (0.89–0.94)', 'Instrumental Broadening β_inst'],
        outputs: ['Apparent Domain Size D (nm)', 'Monshi Logarithmic Intercept D_M', 'Multi-Model Side-by-Side Comparison'],
        subModels: [
          'Classical Per-Peak Scherrer',
          'Monshi-Scherrer Linearized Logarithmic Fit',
          'Williamson-Hall Quick Cross-Check',
          'Size-Strain Plot (SSP) & Halder-Wagner Benchmark'
        ],
        recommendedRange: 'D: 2 nm – 200 nm',
        complexity: 'Beginner',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'استودیوی یکپارچه شرر و منشی-شرر لگاریتمی برای محاسبه اندازه بلورک و مقایسه همزمان مدل‌های ریزساختاری.'
          : 'Consolidated crystallite sizing workstation combining classical Scherrer, Monshi-Scherrer logarithmic regression, and multi-model benchmarking in a single view.',
        suggestedNext: ['wh', 'integral_adv', 'double_voigt']
      },
      {
        id: 'wh',
        label: t('Williamson-Hall (UDM / USDM / UDEDM)', 'Williamson-Hall (W-H)'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Isotropic & anisotropic hkl-dependent microstrain ε and dislocation density', 'Isotropic & anisotropic hkl-dependent microstrain ε and dislocation density'),
        formula: 'β_t·cosθ = Kλ/D + 4ε·sinθ',
        tags: ['Microstrain', 'Size-Strain', 'W-H Plot', 'Dislocations', 'UDM', 'USDM', 'UDEDM'],
        icon: <TrendingUp className={`${defaultIconClass} text-emerald-500`} />,
        inputs: ['Multi-Reflection List (2θ, FWHM, hkl)', 'Elastic Anisotropy Constants E(hkl)', 'Deconvolution Mode (Lorentzian/Gaussian/Voigt)'],
        outputs: ['Volume-Weighted Size D (nm)', 'RMS Microstrain ε (×10⁻³)', 'Lattice Stress σ (MPa) & Energy Density u (kJ/m³)'],
        subModels: [
          'Uniform Deformation Model (UDM)',
          'Uniform Stress Deformation Model (USDM)',
          'Uniform Deformation Energy Density Model (UDEDM)',
          'Size-Strain Plot (SSP) & Halder-Wagner Comparison'
        ],
        recommendedRange: '≥ 3 Reflections across 20°–90° 2θ',
        complexity: 'Intermediate',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'تفکیک خطی کرنش شبکه از پهن‌شدگی ابعاد دانه با پشتیبانی از مدل‌های چگالی تنش و انرژی همسانگرد و ناهمسانگرد.'
          : 'Decouples size-induced broadening from lattice microstrain across UDM, USDM (anisotropic Young modulus E_hkl), and UDEDM energy density formalisms.',
        suggestedNext: ['integral_adv', 'double_voigt', 'wa']
      },
      {
        id: 'integral_adv',
        label: t('Integral Breadth (Voigt & W-H)', 'Integral Breadth (Voigt & W-H)'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Single-peak area/height β_I & multi-reflection Langford Voigt / Halder-Wagner', 'Single-peak area/height β_I & multi-reflection Langford Voigt / Halder-Wagner'),
        formula: '(β*/d*)² = (1/D_v)·(β*/d*²) + (2ε)²',
        tags: ['Integral Breadth', 'Halder-Wagner', 'Voigt', 'Langford', 'Size-Strain', 'SSP', 'Area/Height'],
        icon: <InfinityIcon className={`${defaultIconClass} text-teal-500`} />,
        inputs: ['Peak Area / I_max or Multi-Peak (2θ, FWHM, β_I)', 'Subtraction Law (Cauchy, Gaussian, Voigt, Parabolic)', 'Separation Formalism (6 Models)'],
        outputs: ['Volume & Area Sizes D_v, D_a (nm)', 'Log-Normal Polydispersity σ_g', 'Williamson-Smallman Dislocation Density ρ'],
        subModels: [
          'Single-Peak Area/Height Integral Breadth Workbench',
          'Halder-Wagner Parabolic Voigt Approximation',
          'Langford Exact Voigt Deconvolution (D_v / D_a)',
          'Linear Cauchy, Quadratic Gaussian & Size-Strain Plot (SSP)'
        ],
        recommendedRange: 'φ = FWHM / β_I ∈ [0.6366, 0.9394]',
        complexity: 'Advanced',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'ایستگاه کاری کامل پهنای انتگرالی شامل محاسبه تک‌پیک (مساحت به ارتفاع) و تفکیک چندپیکی وویت و هالدر-واگنر.'
          : 'Complete reciprocal-space integral breadth suite uniting single-peak area-to-height profiling with 6 multi-reflection Voigt & Halder-Wagner separation formalisms.',
        suggestedNext: ['double_voigt', 'wa', 'wh']
      },
      {
        id: 'double_voigt',
        label: t('Double-Voigt Method', 'Double-Voigt Method'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Analytical Lorentzian β_C(s) & Gaussian β_G(s) harmonic convolution separation', 'Analytical Lorentzian β_C(s) & Gaussian β_G(s) harmonic convolution separation'),
        formula: 'β_C(s) = β_CS + β_CD·s²  ·  β_G²(s) = β_GS² + β_GD²·s²',
        tags: ['Double-Voigt', 'Convolution', 'Volume-Weighted', 'Log-Normal', 'Lorentzian', 'Gaussian'],
        icon: <SlidersHorizontal className={`${defaultIconClass} text-cyan-500`} />,
        inputs: ['Lorentzian & Gaussian Breadths across Reflection Orders', 'Instrumental Voigt Parameters'],
        outputs: ['Volume-Weighted ⟨D⟩_v & Area-Weighted ⟨D⟩_a', 'Log-Normal Median D_0 & Variance σ', 'RMS Strain ⟨ε²⟩^(1/2)'],
        subModels: ['Cauchy-Gaussian Harmonic Separation', 'Log-Normal Crystallite Size Distribution', 'Equivalent Warren-Averbach Fourier Synthesis'],
        recommendedRange: 'Multiple Harmonic Orders (e.g. 111/222)',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'روش تحلیلی دقیق بر مبنای کانولوشن دوگانه وویت برای دستیابی به میانگین‌های وزنی حجمی و سطحی اندازه.'
          : 'Rigorous Double-Voigt analytical methodology separating Cauchy and Gaussian size/distortion components into log-normal size distributions.',
        suggestedNext: ['wa', 'integral_adv', 'method_of_moments']
      },
      {
        id: 'wa',
        label: t('Warren-Averbach Fourier', 'Warren-Averbach Fourier'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Fourier cosine series deconvolution for column length p(L) & RMS strain ⟨ε²(L)⟩', 'Fourier cosine series deconvolution for column length p(L) & RMS strain ⟨ε²(L)⟩'),
        formula: 'ln A(L, s) = ln A^S(L) - 2π²·L²·⟨ε²(L)⟩·s²',
        tags: ['Fourier', 'Warren-Averbach', 'RMS Strain', 'Column Length', 'Dislocation Density', 'Stokes'],
        icon: <Network className={`${defaultIconClass} text-emerald-500`} />,
        inputs: ['Harmonic Reflection Pairs (e.g. 111/222, 200/400)', 'Fourier Length Variable L (nm)'],
        outputs: ['Area-Weighted Column Size ⟨L⟩_a (nm)', 'Length-Dependent RMS Strain ⟨ε²(L)⟩^(1/2)', 'Column Length Distribution d²A^S/dL²'],
        subModels: ['Stokes Fourier Deconvolution', 'ln A(L) vs s² Linear Separation', 'Hook-Effect Correction & Column Distribution p(L)'],
        recommendedRange: 'L: 0.5 nm – 40 nm',
        complexity: 'Expert',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'استاندارد طلایی تئوری عیوب بلوری برای محاسبه توزیع واقعی ابعاد ستونی و کرنش میانگین ریشه‌ای فوریه.'
          : 'Gold-standard Fourier series profile analysis extracting the true physical column-length distribution p(L) and length-dependent RMS microstrain.',
        suggestedNext: ['double_voigt', 'method_of_moments']
      },
      {
        id: 'method_of_moments',
        label: t('Method of Moments (Variance)', 'Method of Moments (Variance)'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Wilson asymptotic variance W(σ) expansion for size & dislocation density', 'Wilson asymptotic variance W(σ) expansion for size & dislocation density'),
        formula: 'W(σ) = W₀ + k₁·σ + k₂·ln(σ/σ₀)',
        tags: ['Variance', 'Moments', 'Wilson', 'Dislocation Density', 'Asymptotic'],
        icon: <BarChart3 className={`${defaultIconClass} text-teal-500`} />,
        inputs: ['Peak Tail Integration Range ±σ (Å⁻¹)', '2nd & 4th Central Profile Moments μ₂, μ₄'],
        outputs: ['Area-Weighted Domain Size D_eff', 'Internal Dislocation Density ρ_d (m⁻²)', 'Linear & Logarithmic Variance Slopes k₁, k₂'],
        subModels: ['Wilson Second-Moment Linear Asymptote', 'Groma-Borbély Fourth-Moment Dislocation Analysis', 'Background Truncation Sensitivity Probe'],
        recommendedRange: 'Integration Range σ: 0.01 – 0.15 Å⁻¹',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'رویکرد آماری بدون مدل بر اساس گشتاور دوم و چهارم توزیع شدت برای تفکیک اندازه و چگالی نابجایی.'
          : 'Model-independent asymptotic variance analysis of diffraction peak tails to extract domain size and crystal dislocation density.',
        suggestedNext: ['wa', 'residual_stress']
      },
      {
        id: 'residual_stress',
        label: t('Residual Stress (sin²ψ)', 'Residual Stress (sin²ψ)'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Macroscopic biaxial/triaxial stress tensor σ_φ & ψ-splitting shear analysis', 'Macroscopic biaxial/triaxial stress tensor σ_φ & ψ-splitting shear analysis'),
        formula: 'ε_φψ = ½s₂(hkl)·[σ_φ·sin²ψ + τ_φ·sin(2ψ)] + s₁(hkl)·(σ₁₁ + σ₂₂)',
        tags: ['Sin2Psi', 'Residual Stress', 'Macro-stress', 'Elasticity', 'XEC', 'Kroner'],
        icon: <Zap className={`${defaultIconClass} text-amber-500`} />,
        inputs: ['Tilt Angles ψ (-60° to +60°)', 'Measured Peak Positions 2θ_ψ', 'X-ray Elastic Constants ½s₂, s₁ (Voigt/Reuss/Kröner)'],
        outputs: ['Normal Stress σ_φ (MPa)', 'Shear Stress τ_φ (MPa) from ψ-Splitting', 'Strain-Free Lattice Spacing d₀ (Å)'],
        subModels: ['Linear Biaxial sin²ψ Regression', 'Elliptical ψ-Splitting Shear Tensor Fit', 'Voigt / Reuss / Kröner-Eshelby XEC Calculator'],
        recommendedRange: 'High-Angle Reflections (2θ > 100° preferred)',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'محاسبه تنش‌های پسماند سطحی و عمقی در قطعات مکانیکی، پوشش‌های سخت و لایه‌های نازک با روش شیب sin²ψ.'
          : 'Evaluates macroscopic residual stress tensors and shear ψ-splitting using diffraction peak shifts across sample tilt angles.',
        suggestedNext: ['xrr', 'preferred_orientation']
      },
      {
        id: 'xrr',
        label: t('X-Ray Reflectometry (XRR)', 'X-Ray Reflectometry (XRR)'),
        categoryId: 'size_strain',
        category: t('Size, Strain & Reflectometry', 'Size, Strain & Reflectometry'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-500" />,
        subtitle: t('Parratt optical recursion & Kiessig fringe FFT for nanoscale thin films', 'Parratt optical recursion & Kiessig fringe FFT for nanoscale thin films'),
        formula: 'R_j = (r_{j,j+1} + R_{j+1}·e^(2i·k_{z,j+1}·d_j)) / (1 + r_{j,j+1}·R_{j+1}·e^(2i·k_{z,j+1}·d_j))',
        tags: ['XRR', 'Reflectometry', 'Thin Films', 'Thickness', 'Roughness', 'Parratt', 'Kiessig'],
        icon: <Layers className={`${defaultIconClass} text-cyan-500`} />,
        inputs: ['Grazing Incidence Angle 2θ (0.1°–8.0°)', 'Multilayer Stack (Thickness d, Density ρ_e, Roughness σ)'],
        outputs: ['Specular Reflectivity R(Q_z) Curve', 'Kiessig Fringe Thickness d (nm)', 'Nevot-Croce Interface Roughness σ (Å)'],
        subModels: ['Exact Parratt Recursive Multilayer Solver', 'Nevot-Croce Interfacial Roughness Damping', 'Critical Angle θ_c Mass Density Extractor'],
        recommendedRange: '2θ: 0.1° – 8.0° (Q_z: 0.01 – 0.60 Å⁻¹)',
        complexity: 'Advanced',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'محاسبه بازتاب‌سنجی پرتو ایکس با فرمول بازگشتی پارات برای اندازه‌گیری دقیق ضخامت نانومتری و زبری لایه‌ها.'
          : 'Parratt optical recursion engine and Kiessig fringe period analyzer for thin-film thickness, mass density, and interfacial roughness.',
        suggestedNext: ['residual_stress', 'preferred_orientation']
      },

      // 3. Structure & Refinement (5)
      {
        id: 'cohen',
        label: t("Cohen's Matrix Refinement", "Cohen's Matrix Refinement"),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('Normal-equation least squares for high-precision lattice constants & drift', 'Normal-equation least squares for high-precision lattice constants & drift'),
        formula: 'sin²θ_i = A·α_i + B·β_i + C·γ_i + D·δ_i',
        tags: ['Cohen', 'Lattice Refinement', 'Least Squares', 'Zero Offset', 'Nelson-Riley', 'Unit Cell'],
        icon: <Grid className={`${defaultIconClass} text-violet-500`} />,
        inputs: ['Indexed Reflections (hkl, 2θ_obs)', 'Crystal System Symmetry', 'Extrapolation Function (cos²θ, Nelson-Riley)'],
        outputs: ['Refined Lattice Parameters (a, b, c) ± σ', 'Systematic Drift Coefficient D', 'Per-Reflection Residual Δ(2θ) Table'],
        subModels: ['Cohen Normal-Equation Matrix Solver', 'Nelson-Riley & Bradley-Jay Extrapolation', 'Systematic Displacement/Zero-Shift Corrector'],
        recommendedRange: '≥ 5 Indexed Reflections',
        complexity: 'Intermediate',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'حل ماتریسی به روش کمترین مربعات برای دستیابی به دقیق‌ترین ابعاد سلول واحد همزمان با حذف خطای سیستماتیک گونیومتر.'
          : 'Analytical normal-equation least-squares refinement simultaneously solving for unit-cell parameters and systematic goniometer aberrations.',
        suggestedNext: ['metric_tensor', 'supercell_transform', 'pawley_lebail']
      },
      {
        id: 'metric_tensor',
        label: t('Metric Tensor Algebra', 'Metric Tensor Algebra'),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('Covariant G_ij & contravariant G*^ij tensors, interplanar angles & bond lengths', 'Covariant G_ij & contravariant G*^ij tensors, interplanar angles & bond lengths'),
        formula: '1/d²(hkl) = h_i·G*^{ij}·h_j  ·  cosφ = (h·G*·k) / (|h*||k*|)',
        tags: ['Metric Tensor', 'Reciprocal Space', 'Interplanar Angle', 'Zone Axis', 'Triclinic'],
        icon: <Sparkles className={`${defaultIconClass} text-indigo-500`} />,
        inputs: ['Lattice Constants (a, b, c, α, β, γ)', 'Plane Pair (h₁k₁l₁) & (h₂k₂l₂)', 'Direct Lattice Vectors [u₁v₁w₁] & [u₂v₂w₂]'],
        outputs: ['3×3 Direct G_ij & Reciprocal G*^ij Matrices', 'Interplanar Angle φ (°)', 'Zone Axis [uvw] & Vector Dot/Cross Products'],
        subModels: ['Direct & Reciprocal 3×3 Tensor Inverter', 'General Triclinic Interplanar Angle Solver', 'Fractional Atomic Distance Calculator'],
        recommendedRange: 'All 7 Crystal Systems (Cubic → Triclinic)',
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'جبر تانسوری کامل برای تمام ۷ سیستم بلوری جهت محاسبه فواصل، حجم، ضرب خارجی بردارها و زوایای بین صفحات.'
          : 'Complete covariant and contravariant metric tensor algebra for arbitrary triclinic lattices, interplanar angles, and zone axes.',
        suggestedNext: ['supercell_transform', 'cohen', 'unit_cells']
      },
      {
        id: 'supercell_transform',
        label: t('Supercell & Matrix Engine', 'Supercell & Matrix Engine'),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('3×3 basis transformation matrices P, Rhombohedral ↔ Hexagonal & DFT supercells', '3×3 basis transformation matrices P, Rhombohedral ↔ Hexagonal & DFT supercells'),
        formula: "(a' b' c') = (a b c)·P  ·  V' = |det(P)|·V",
        tags: ['Supercell', 'Transformation', 'Matrix', 'Lattice Vectors', 'DFT', 'Bravais'],
        icon: <Rows3 className={`${defaultIconClass} text-purple-500`} />,
        inputs: ['Parent Unit Cell (a, b, c, α, β, γ)', '3×3 Transformation Matrix P', 'Fractional Atomic Basis (x, y, z)'],
        outputs: ['Transformed Cell Constants', 'Supercell Volume Multiplier det(P)', 'Transformed Miller Indices & Atomic Coordinates'],
        subModels: ['Rhombohedral ↔ Obverse Hexagonal Converter', 'Primitive ↔ Conventional Cell Matrix Presets', ' √2×√2 & 2×2×2 DFT Supercell Generator'],
        recommendedRange: 'det(P) > 0 (Proper Basis Handedness)',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'تبدیل ماتریسی ابعاد شبکه برای ساخت ابرسلول‌های محاسبات DFT، تبدیل هگزاگونال به رومبوهدرال و تغییر مبدا.'
          : 'Applies 3×3 linear basis transformations to convert between primitive, conventional, rhombohedral/hexagonal, and supercell settings.',
        suggestedNext: ['metric_tensor', 'cohen']
      },
      {
        id: 'pawley_lebail',
        label: t('Pawley & Le Bail Fitting', 'Pawley & Le Bail Fitting'),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('Structure-free whole-powder-pattern decomposition & R_wp / GoF statistics', 'Structure-free whole-powder-pattern decomposition & R_wp / GoF statistics'),
        formula: 'R_wp = [Σ w_i(y_i - y_ci)² / Σ w_i·y_i²]^(1/2)',
        tags: ['Pawley', 'Le Bail', 'Decomposition', 'Profile Fitting', 'Rwp', 'Chi2'],
        icon: <Activity className={`${defaultIconClass} text-fuchsia-500`} />,
        inputs: ['Unit Cell & Space Group', 'Caglioti Profile (U, V, W) & Chebyshev Background', 'Decomposition Engine (Le Bail Iterative / Pawley LSQ)'],
        outputs: ['Extracted Integrated Intensities |F_hkl|²', 'Agreement Factors R_wp, R_p, R_exp, χ²', 'Calculated + Difference Rietveld Plot'],
        subModels: ['Le Bail Iterative Intensity Partitioning', 'Pawley Constrained Least-Squares Solver', 'Full Residual Difference Plot & GoF Telemetry'],
        recommendedRange: '2θ: 10° – 100° Full Profile',
        complexity: 'Advanced',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'استخراج تجربی شدت‌های منفرد برای حل ساختارهای مجهول بلوری و بررسی برازش کل پروفایل بدون مدل اتمی.'
          : 'Whole-powder-pattern decomposition extracting individual |F(hkl)|² reflection intensities and profile agreement factors (R_wp, χ²) without atomic coordinates.',
        suggestedNext: ['rietveld', 'rir', 'cohen', 'compare']
      },
      {
        id: 'rietveld',
        label: t('Rietveld Structure Refinement', 'Rietveld Structure Refinement'),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('Full-pattern crystal structure refinement: CIF Wyckoff coordinates, Caglioti U,V,W, March-Dollase & QPA', 'Full-pattern crystal structure refinement: CIF Wyckoff coordinates, Caglioti U,V,W, March-Dollase & QPA'),
        formula: 'y_calc(2θ) = y_bg + Σ_p S_p Σ_K m_K·Lp_K·|F_K|²·P_K·Ω(2θ − 2θ_K)',
        tags: ['Rietveld', 'Structure Refinement', 'CIF', 'Wyckoff', 'Caglioti', 'Rwp', 'Quantitative Phase Analysis'],
        icon: <Atom className={`${defaultIconClass} text-sky-400`} />,
        inputs: ['Experimental Pattern (.xy/.dat) & IRF', 'CIF Crystal Structure (Lattice, Space Group, Wyckoff x,y,z, B_iso, SOF)', 'Caglioti (U,V,W) & March-Dollase Texture r'],
        outputs: ['Refined Unit Cell & Atomic Coordinates ± σ', 'Hill-Howard Quantitative Phase Weight Fractions (wt%)', 'Agreement Indices R_wp, R_p, R_exp, χ², R_B & Difference Plot'],
        subModels: ['7-Step Guided Rietveld Refinement Pipeline', 'Cromer-Mann Structure Factor |F_hkl|² & CIF Importer', 'Levenberg-Marquardt Sequential Turn-On Solver'],
        recommendedRange: '2θ: 10° – 120° Full Powder Pattern',
        complexity: 'Expert',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'پالایش کامل ساختار بلوری به روش ریتولد شامل مدل‌سازی پس‌زمینه چبیشف، وارد کردن فایل CIF، پالایش ابعاد شبکه، تابع پروفایل کالیوتی و مختصات اتمی وایکوف.'
          : 'Complete 7-stage Rietveld refinement workstation covering Chebyshev background modeling, CIF phase import, zero-shift/displacement, lattice refinement, TCH Caglioti microstructure, atomic Wyckoff coordinates/B_iso/SOF, and R-factor diagnostics.',
        suggestedNext: ['pawley_lebail', 'pdf_analysis', 'rir', 'cohen']
      },
      {
        id: 'pdf_analysis',
        label: t('Pair Distribution Function (PDF)', 'Pair Distribution Function (PDF)'),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('Total scattering Sine Fourier transform S(Q) → G(r) for local atomic bond lengths & amorphous/nanoscale order', 'Total scattering Sine Fourier transform S(Q) → G(r) for local atomic bond lengths & amorphous/nanoscale order'),
        formula: 'G(r) = (2/π) ∫ Q[S(Q) − 1]·W(Q)·sin(Qr) dQ',
        tags: ['PDF', 'Pair Distribution', 'Total Scattering', 'G(r)', 'S(Q)', 'Amorphous', 'Glass', 'Coordination Shell', 'Lorch'],
        icon: <Activity className={`${defaultIconClass} text-cyan-400`} />,
        inputs: ['Reciprocal Window [Q_min, Q_max] (Å⁻¹) & Modification W(Q)', 'Coordination Shells (Pair, r_ij, N_ij, σ_ij)', 'Spherical Envelope D_nano (nm) or Amorphous ξ (Å)'],
        outputs: ['Real-Space Pair Distribution G(r) & Residual ΔG(r)', 'Reduced Structure Function F(Q) = Q[S(Q) − 1]', 'Radial Distribution R(r) & Integrated Coordination Number N_c'],
        subModels: ['Direct Numerical Sine Fourier Transform S(Q) → G(r)', 'Lorch & Cosine-Bell Termination Ripple Suppressor', 'Real-Space Coordination Shell Area Integrator'],
        recommendedRange: 'Q_max: 7.8 Å⁻¹ (Cu) – 28.0 Å⁻¹ (Synchrotron) · r: 0 – 25 Å',
        complexity: 'Expert',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'تحلیل پراکندگی کل و تابع توزیع جفت اتمی G(r) از طریق تبدیل فوریه سینوسی F(Q) برای تعیین طول پیوندهای موضعی، عدد همسایگی و ساختار مواد آمورف، شیشه‌های فلزی و نقاط کوانتومی.'
          : 'Total scattering and atomic Pair Distribution Function (PDF) workstation transforming reciprocal-space F(Q) = Q[S(Q) − 1] into real-space G(r) histograms to resolve nearest-neighbor bond lengths, coordination numbers N_c, and nanoscale coherence envelopes.',
        suggestedNext: ['rietveld', 'pawley_lebail', 'scherrer']
      },
      {
        id: 'rir',
        label: t('Reference Intensity Ratio (RIR)', 'Reference Intensity Ratio (RIR)'),
        categoryId: 'refinement',
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-violet-500" />,
        subtitle: t('Quantitative multiphase weight fractions wt% via Chung adiabatic & internal standard', 'Quantitative multiphase weight fractions wt% via Chung adiabatic & internal standard'),
        formula: 'W_α = (I_α / RIR_α) / Σ_k (I_k / RIR_k)',
        tags: ['RIR', 'Quantitative', 'Corundum', 'Phase Abundance', 'Multi-Phase', 'Amorphous'],
        icon: <Layers className={`${defaultIconClass} text-pink-500`} />,
        inputs: ['Phase Peak Intensities I_i', 'ICDD Corundum Constants (I/I_c)', 'Optional Internal Standard Spike wt%'],
        outputs: ['Normalized Crystalline Weight Fractions (wt%)', 'Volume & Molar Fractions (vol%, mol%)', 'Amorphous Content wt% (Internal Standard Mode)'],
        subModels: ['Chung Matrix-Flushing Adiabatic Equation', 'Internal Standard Amorphous Quantification', 'Microabsorption Brindley Correction'],
        recommendedRange: '2 – 6 Coexisting Phases',
        complexity: 'Intermediate',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'تعیین سریع کسر وزنی فازهای بلوری و آمورف در مخلوط‌های چندفازی با استفاده از نسبت شدت استاندارد کوراندوم.'
          : 'Quantitative phase analysis computing weight, volume, and amorphous fractions using ICDD corundum Reference Intensity Ratios (I/I_c).',
        suggestedNext: ['compare', 'pawley_lebail', 'dl']
      },

      // 4. Quantum Scattering & Scripting (3)
      {
        id: 'neutron',
        label: t('Neutron Diffraction Physics', 'Neutron Diffraction Physics'),
        categoryId: 'quantum',
        category: t('Quantum & Scripting', 'Quantum & Scripting'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-500" />,
        subtitle: t('Coherent nuclear scattering lengths b_c, isotope contrast & X-ray vs Neutron', 'Coherent nuclear scattering lengths b_c, isotope contrast & X-ray vs Neutron'),
        formula: 'F_nuc(Q) = Σ b_j·exp(i·Q·r_j)·exp(-W_j)',
        tags: ['Neutron', 'Nuclear Scattering', 'Light Elements', 'Isotopes', 'Hydrogen', 'Lithium', 'TOF'],
        icon: <Orbit className={`${defaultIconClass} text-orange-500`} />,
        inputs: ['Isotopic / Elemental Composition', 'Constant-Wavelength (CW) or Time-of-Flight (TOF)', 'Debye-Waller Thermal Factors B_iso'],
        outputs: ['Nuclear Structure Factor |F_nuc|²', 'Neutron vs X-Ray Contrast Ratio', 'Incoherent Background Cross Section σ_inc'],
        subModels: ['NIST Sears Nuclear Scattering Length Registry', 'H / D Isotope Substitution Contrast Simulator', 'CW vs Spallation TOF Diffractogram Synthesizer'],
        recommendedRange: 'λ: 0.8 – 2.5 Å (Thermal Neutrons)',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'پراکندگی نوترونی برای تشخیص موقعیت اتم‌های بسیار سبک نظیر هیدروژن، دوتریوم و لیتیوم و کنتراست ایزوتوپی.'
          : 'Simulates coherent and incoherent nuclear neutron diffraction, highlighting light-element (H/D, Li, O) and adjacent-Z transition-metal contrast.',
        suggestedNext: ['magnetic', 'python_export']
      },
      {
        id: 'magnetic',
        label: t('Magnetic Neutron Scattering', 'Magnetic Neutron Scattering'),
        categoryId: 'quantum',
        category: t('Quantum & Scripting', 'Quantum & Scripting'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-500" />,
        subtitle: t('Dipole magnetic form factors f_M(Q), propagation vector k & spin superlattices', 'Dipole magnetic form factors f_M(Q), propagation vector k & spin superlattices'),
        formula: 'F_M⊥(Q) = p₀·Σ μ_j⊥·f_j(Q)·exp(i·Q·r_j)',
        tags: ['Magnetic', 'Spin Structure', 'Form Factor', 'Antiferromagnetic', 'Propagation Vector', 'Curie-Weiss'],
        icon: <Magnet className={`${defaultIconClass} text-rose-500`} />,
        inputs: ['3d / 4f Magnetic Ion (Fe³⁺, Mn²⁺, Co²⁺, Ni²⁺, Cr³⁺)', 'Magnetic Propagation Vector k = (k_x, k_y, k_z)', 'Moment Orientation vs Scattering Vector Q̂'],
        outputs: ['Magnetic Interaction Vector |F_M⊥(Q)|²', 'Satellite Reflections (hkl ± k)', 'Order Parameter M(T) Brillouin Curve'],
        subModels: ['Dipole Approximation ⟨j₀(Q)⟩ + C₂⟨j₂(Q)⟩ Form Factors', 'Ferromagnetic / AFM Type-I, II, G, A, C & Helical k-Vectors', 'Temperature-Dependent Brillouin Sublattice Magnetization'],
        recommendedRange: 'Low Q < 4.0 Å⁻¹ (Magnetic Form Factor Window)',
        complexity: 'Expert',
        descriptionDetail: isRTL
          ? 'محاسبه پیک‌های فرعی مغناطیسی، بردار انتشار k و فاکتور فرم مغناطیسی در ساختارهای اسپینی.'
          : 'Models magnetic neutron cross-sections, Halpern-Johnson spin projection factors (Q̂ × (M × Q̂)), and antiferromagnetic satellite reflections.',
        suggestedNext: ['neutron', 'python_export']
      },
      {
        id: 'python_export',
        label: t('Python Script Generator', 'Python Script Generator'),
        categoryId: 'quantum',
        category: t('Quantum & Scripting', 'Quantum & Scripting'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-500" />,
        subtitle: t('Reproducible NumPy / SciPy / Matplotlib code generator for batch XRD workflows', 'Reproducible NumPy / SciPy / Matplotlib code generator for batch XRD workflows'),
        formula: 'scipy.optimize.curve_fit(pseudo_voigt, two_theta, intensity)',
        tags: ['Python', 'Automation', 'SciPy', 'Scripting', 'PyMatGen', 'Jupyter', 'Export'],
        icon: <Terminal className={`${defaultIconClass} text-emerald-500`} />,
        inputs: ['Selected Analytical Pipeline', 'Active Session Peak Data & Wavelength'],
        outputs: ['Standalone Python (.py) Script', 'Jupyter Notebook (.ipynb) Cell Blocks', 'Publication Matplotlib Figure Code'],
        subModels: ['Automated Peak Deconvolution Script', 'Batch Williamson-Hall & Halder-Wagner Solver', 'PyMatGen CIF Structure & Diffraction Script'],
        recommendedRange: 'Python 3.10+ · NumPy / SciPy / Matplotlib',
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'تولید کدهای استاندارد پایتون آماده اجرا برای بازتولید محاسبات در محیط‌های علمی یا پردازش دسته‌ای.'
          : 'Generates self-contained, dependency-documented Python scripts for reproducible curve fitting and publication figures.',
        suggestedNext: ['learn', 'profile']
      },

      // 5. AI & Computer Vision (2)
      {
        id: 'dl',
        label: t('PhaseID Neural Classifier', 'PhaseID Neural Classifier'),
        categoryId: 'ai_vision',
        category: t('AI & Computer Vision', 'AI & Computer Vision'),
        categoryIcon: <Brain className="w-4 h-4 text-fuchsia-500" />,
        subtitle: t('Probabilistic convolutional phase classification & impurity residual screening', 'Probabilistic convolutional phase classification & impurity residual screening'),
        formula: 'P(Phase_k | I(2θ)) = Softmax(z_k / T)',
        tags: ['AI', 'Neural Net', 'PhaseID', 'Pattern Recognition', 'Impurity Detection'],
        icon: <Brain className={`${defaultIconClass} text-fuchsia-500`} />,
        inputs: ['Experimental Peak List or 1D Spectrum', 'Chemical Element Search Filter'],
        outputs: ['Ranked Candidate Phases with Confidence %', 'Unindexed Impurity Peak Flags', 'One-Click Transfer to RIR / Compare'],
        subModels: ['1D-CNN Spectral Feature Matcher', 'Elemental Sub-Space Restriction Filter', 'Minor Impurity Residual Peak Detector'],
        recommendedRange: '2θ: 10° – 90°',
        complexity: 'Intermediate',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'طبقه‌بندی‌کننده هوشمند فازهای بلوری برای شناسایی سریع فازهای اصلی و ناخالصی‌های ثانویه.'
          : 'Rapid candidate phase ranking and unindexed impurity peak detection with direct handoff to RIR quantification.',
        suggestedNext: ['compare', 'rir', 'database']
      },
      {
        id: 'image_analysis',
        label: t('2D Detector & Plot Digitizer', '2D Detector & Plot Digitizer'),
        categoryId: 'ai_vision',
        category: t('AI & Computer Vision', 'AI & Computer Vision'),
        categoryIcon: <Brain className="w-4 h-4 text-fuchsia-500" />,
        subtitle: t('Debye-Scherrer 2D ring azimuthal integration & published plot digitization', 'Debye-Scherrer 2D ring azimuthal integration & published plot digitization'),
        formula: 'I(2θ) = (1/2π) ∫₀^{2π} I(r(2θ), χ) dχ',
        tags: ['2D Detector', 'Debye-Scherrer', 'Ring Integration', 'Azimuthal', 'Digitization'],
        icon: <ImageIcon className={`${defaultIconClass} text-pink-500`} />,
        inputs: ['2D Area Detector Frame or Published XRD Plot Image', 'Beam Center (x₀, y₀) & Sample-Detector Distance'],
        outputs: ['Integrated 1D Peak Table (2θ, Intensity)', 'Azimuthal Cake Plot I(2θ, χ)', 'Direct Load into Active Bragg / Scherrer Engine'],
        subModels: ['2D Debye-Scherrer Azimuthal Integrator', 'Published Figure Curve Digitizer', 'One-Click Peak Transfer to Bragg Workbench'],
        recommendedRange: 'PNG / JPG / TIFF Micrographs & Plots',
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'پردازش و تبدیل تصاویر دتکتورهای دو بعدی و استخراج داده‌های عددی از نمودارهای مقالات.'
          : 'Converts 2D Debye-Scherrer area detector rings and scanned literature diffractograms into calibrated 1D peak lists.',
        suggestedNext: ['bragg', 'preferred_orientation', 'dl']
      },

      // 6. Databases & Calibration (5)
      {
        id: 'database',
        label: t('Crystallographic Material Registry', 'Crystallographic Material Registry'),
        categoryId: 'reference',
        category: t('Databases & Calibration', 'Databases & Calibration'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: t('Searchable CIF structures, space groups & reference powder diffraction cards', 'Searchable CIF structures, space groups & reference powder diffraction cards'),
        formula: 'ICSD · COD · NIST SRM Reference Cards',
        tags: ['CIF', 'Standards', 'Materials', 'ICSD', 'COD', 'Silicon', 'Perovskites'],
        icon: <Database className={`${defaultIconClass} text-indigo-500`} />,
        inputs: ['Chemical Formula, Mineral Name, or Space Group Number'],
        outputs: ['Unit Cell Constants & Space Group', 'Indexed Reference (2θ, d, I/I₀, hkl) Card', 'CIF Structure File Export'],
        subModels: ['Verified Reference Card Browser', 'Elemental Composition Filter', 'Instant CIF & Peak List Exporter'],
        recommendedRange: 'Curated Oxides, Metals, Semiconductors & Minerals',
        complexity: 'Beginner',
        isPopular: true,
        descriptionDetail: isRTL
          ? 'مجموعه معتبر استانداردهای بلوری کالیبراسیون و فازهای پرکاربرد سرامیکی، فلزی، اکسیدی و نیمه‌هادی.'
          : 'Searchable library of verified crystal structures, lattice parameters, and indexed reference diffraction patterns.',
        suggestedNext: ['compare', 'rir', 'bragg']
      },
      {
        id: 'periodic_table',
        label: t('X-Ray Periodic Table & Edges', 'X-Ray Periodic Table & Edges'),
        categoryId: 'reference',
        category: t('Databases & Calibration', 'Databases & Calibration'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: t('Characteristic Kα/Kβ emission lines, absorption edges & Cromer-Mann f₀(s)', 'Characteristic Kα/Kβ emission lines, absorption edges & Cromer-Mann f₀(s)'),
        formula: 'f₀(s) = Σ_{i=1}^4 a_i·exp(-b_i·s²) + c',
        tags: ['Periodic Table', 'X-ray Edges', 'Scattering Factors', 'Cromer-Mann', 'Fluorescence'],
        icon: <Grid className={`${defaultIconClass} text-cyan-500`} />,
        inputs: ['Atomic Number Z (1–98)', 'Incident X-Ray Anode Energy (keV)'],
        outputs: ['Kα₁, Kα₂, Kβ₁ & Lα Emission Wavelengths (Å / keV)', 'K & L Absorption Edge Energies & Fluorescence Risk', 'Atomic Form Factor f₀(sinθ/λ) Curve'],
        subModels: ['Characteristic X-Ray Emission & Edge Inspector', 'Anode-Sample XRF Fluorescence Warning Check', 'Cromer-Mann Atomic Scattering Factor Plotter'],
        recommendedRange: 'Z = 1 (H) to Z = 98 (Cf)',
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'جدول تناوبی جامع متمرکز بر فیزیک اشعه ایکس، انرژی خطوط نشری، لبه‌های جذب و فاکتورهای فرم اتمی کرومر-من.'
          : 'X-ray spectroscopy and crystallography periodic table providing emission wavelengths, absorption edges, fluorescence alerts, and atomic form factors.',
        suggestedNext: ['bragg', 'database', 'neutron']
      },
      {
        id: 'profile',
        label: t('Lab Workspace & Calibration Archive', 'Lab Workspace & Sessions'),
        categoryId: 'reference',
        category: t('Databases & Calibration', 'Databases & Calibration'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: t('Saved XRD sessions, Caglioti (U,V,W) diffractometer optics & NIST SRM standards', 'Saved XRD sessions, Caglioti (U,V,W) diffractometer optics & NIST SRM standards'),
        formula: 'FWHM_inst²(2θ) = U·tan²θ + V·tanθ + W',
        tags: ['Sessions', 'Calibration', 'Caglioti', 'NIST SRM', 'Standards', 'Archive'],
        icon: <User className={`${defaultIconClass} text-emerald-500`} />,
        inputs: ['Saved Diffraction Runs (.json)', 'Diffractometer Optics Preset (U, V, W)', 'NIST SRM 640f / 660c / 676a Standard'],
        outputs: ['One-Click Session Restore to Active Engine', 'Calibrated Instrumental Resolution Curve', 'NIST Certified Peak List Injection'],
        subModels: ['Saved Diffraction Run Archive & JSON I/O', '5 Calibrated Diffractometer Caglioti (U,V,W) Presets', 'NIST SRM 640f / 660c / 676a / 674b Standard Loader'],
        recommendedRange: 'Local & Exportable JSON Session State',
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'مدیریت نشست‌های ذخیره‌شده پراش، کالیبراسیون اپتیک پراش‌سنج (ضرایب کالیوتی U,V,W) و استانداردهای مرجع NIST.'
          : 'Centralized laboratory archive for restoring saved diffraction runs, applying Caglioti (U, V, W) optics presets, and loading NIST SRM standards.',
        suggestedNext: ['settings', 'fwhm', 'integral_adv']
      },
      {
        id: 'learn',
        label: t('Protocol & Theory Manual', 'Protocol & Theory Manual'),
        categoryId: 'reference',
        category: t('Databases & Calibration', 'Databases & Calibration'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: t('Mathematical derivations, specimen preparation SOPs & error diagnostics', 'Mathematical derivations, specimen preparation SOPs & error diagnostics'),
        formula: 'Derivations · Specimen SOPs · Error Bounds',
        tags: ['Theory', 'Textbook', 'Protocols', 'Derivations', 'Formulas', 'SOP'],
        icon: <BookOpen className={`${defaultIconClass} text-amber-500`} />,
        inputs: ['Crystallographic Topic or Experimental Aberration'],
        outputs: ['Step-by-Step Mathematical Proof', 'Specimen Preparation & Alignment Checklist', 'Systematic Error Diagnostic Guide'],
        subModels: ['Full Mathematical Derivation Compendium', 'Powder Specimen Preparation SOPs', 'Goniometer Alignment & Aberration Guide'],
        recommendedRange: 'Complete Theoretical & Practical Reference',
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'مرجع آموزشی جامع حاوی اثبات‌های ریاضی فرمول‌ها، شیوه‌نامه‌های آماده‌سازی نمونه و راهنماهای عیب‌یابی.'
          : 'Comprehensive crystallographic reference manual covering first-principles derivations, specimen preparation protocols, and aberration diagnostics.',
        suggestedNext: ['bragg', 'scherrer', 'wh']
      },
      {
        id: 'settings',
        label: t('System & Calibration Settings', 'System & Calibration Settings'),
        categoryId: 'reference',
        category: t('Databases & Calibration', 'Databases & Calibration'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: t('Global X-ray anode defaults, precision rounding, units (Å/nm) & theme', 'Global X-ray anode defaults, precision rounding, units (Å/nm) & theme'),
        formula: 'Global Workstation Parameters',
        tags: ['Settings', 'Calibration', 'Units', 'Theme', 'Instrument', 'Zero Offset'],
        icon: <Settings2 className={`${defaultIconClass} text-slate-400`} />,
        inputs: ['Preferred Length Unit (Å vs nm)', 'Numeric Precision Decimals (2–6)', 'Interface Theme & Display Density'],
        outputs: ['Synchronized Global Workstation Configuration'],
        subModels: ['Length Unit & Decimal Precision Controller', 'Default Anode & Instrumental Zero-Shift Config', 'Local Storage & Offline Database Manager'],
        recommendedRange: 'Applies Globally Across All 27 Engines',
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'تنظیمات سراسری نرم‌افزار، واحدهای طول (آنگستروم یا نانومتر)، دقت اعشار و تم بصری.'
          : 'Configures global workstation units (Å/nm), significant figures, default radiation wavelengths, and display preferences.',
        suggestedNext: ['profile', 'bragg']
      }
    ];
  }, [t, isRTL]);

  // Curated Guided Research Workflows (updated to use unified module IDs)
  const researchPathways = useMemo<ResearchPathway[]>(
    () => [
      {
        id: 'size-strain',
        title: 'Nanomaterial Size & Microstrain Pipeline',
        titleFa: 'خط لوله تحلیل اندازه بلورک و کرنش نانومواد',
        description:
          'Deconvolute instrumental broadening, screen domain size via Scherrer/Monshi, separate isotropic/anisotropic strain in Williamson-Hall, and verify with Voigt Integral Breadth and Warren-Averbach.',
        descriptionFa:
          'حذف پهن‌شدگی دستگاهی، تخمین اندازه بلورک در استودیوی شرر-منشی، تفکیک کرنش ویلیامسون-هال و تایید نهایی با پهنای انتگرالی و وارن-اورباخ.',
        icon: <Microscope className="w-4 h-4 text-emerald-500" />,
        moduleIds: ['fwhm', 'scherrer', 'wh', 'integral_adv', 'wa'],
        stepLabels: [
          '1. FWHM Instrumental Deconvolution',
          '2. Scherrer & Monshi Domain Sizing',
          '3. Williamson-Hall (UDM/USDM/UDEDM)',
          '4. Integral Breadth (Voigt & Halder-Wagner)',
          '5. Warren-Averbach Fourier Distribution'
        ],
        stepLabelsFa: [
          '۱. حذف پهن‌شدگی دستگاهی FWHM',
          '۲. استودیوی اندازه بلورک شرر و منشی',
          '۳. تفکیک کرنش ویلیامسون-هال',
          '۴. پهنای انتگرالی وویت و هالدر-واگنر',
          '۵. توزیع ستونی فوریه وارن-اورباخ'
        ],
        tag: 'Microstructure'
      },
      {
        id: 'lattice-refinement',
        title: 'Unit Cell Indexing & High-Precision Refinement',
        titleFa: 'اندیس‌گذاری سلول واحد و پالایش دقیق پارامترهای شبکه',
        description:
          'Inspect 3D Bravais geometry, verify systematic space-group extinctions, refine lattice constants with Cohen least-squares, and compute triclinic metric tensors.',
        descriptionFa:
          'بررسی هندسه سه‌بعدی شبکه براوه، قوانین خاموشی گروه فضایی، پالایش کمترین مربعات کوهن و جبر تانسور متریک.',
        icon: <Grid className="w-4 h-4 text-violet-500" />,
        moduleIds: ['unit_cells', 'selection', 'cohen', 'metric_tensor', 'supercell_transform'],
        stepLabels: [
          '1. 14 Bravais & Miller Planes (hkl)',
          '2. Space-Group Extinction Rules',
          '3. Cohen Matrix Least-Squares Refinement',
          '4. Reciprocal Metric Tensor Algebra',
          '5. 3×3 Supercell Basis Transformation'
        ],
        stepLabelsFa: [
          '۱. شبکه‌های براوه و صفحات میلر',
          '۲. قوانین خاموشی و انتخاب',
          '۳. پالایش ماتریسی کوهن',
          '۴. جبر تانسور متریک',
          '۵. تبدیل ماتریسی ابرسلول'
        ],
        tag: 'Crystallography'
      },
      {
        id: 'thin-films',
        title: 'Thin Films, Texture & Residual Stress',
        titleFa: 'لایه‌های نازک، بافت بلوری و تنش‌های پسماند',
        description:
          'Extract nanoscale layer thickness and roughness via Parratt XRR recursion, quantify March-Dollase preferred orientation, and evaluate biaxial/shear sin²ψ stress tensors.',
        descriptionFa:
          'محاسبه ضخامت و زبری لایه با بازتاب‌سنجی XRR، تصحیح بافت مارچ-دالاس و سنجش تانسور تنش پسماند sin²ψ.',
        icon: <Zap className="w-4 h-4 text-amber-500" />,
        moduleIds: ['xrr', 'preferred_orientation', 'residual_stress'],
        stepLabels: [
          '1. XRR Parratt Specular Reflectometry',
          '2. March-Dollase Texture & Lotgering Factor',
          '3. sin²ψ Residual Macro-Stress Tensor'
        ],
        stepLabelsFa: [
          '۱. بازتاب‌سنجی XRR پارات',
          '۲. ضریب بافت مارچ-دالاس',
          '۳. تانسور تنش پسماند sin²ψ'
        ],
        tag: 'Coatings & Films'
      },
      {
        id: 'phase-id-quant',
        title: 'Multiphase Identification & Quantitative wt%',
        titleFa: 'شناسایی چندفازی و تعیین کمی درصد وزنی',
        description:
          'Screen unknown scans with PhaseID neural classification, match against CIF reference cards, overlay spectra, and compute phase abundance via RIR and Le Bail fitting.',
        descriptionFa:
          'غربالگری فازها با شبکه عصبی، تطبیق با کارت‌های مرجع CIF، همپوشانی طیفی و محاسبه درصد وزنی RIR.',
        icon: <Brain className="w-4 h-4 text-fuchsia-500" />,
        moduleIds: ['dl', 'database', 'compare', 'rir', 'pawley_lebail'],
        stepLabels: [
          '1. PhaseID Neural Candidate Screening',
          '2. Crystallographic Reference Card Lookup',
          '3. Multi-Pattern Spectral Overlay',
          '4. RIR Quantitative Phase Abundance (wt%)',
          '5. Pawley / Le Bail Full-Profile Fit'
        ],
        stepLabelsFa: [
          '۱. غربالگری شبکه عصبی PhaseID',
          '۲. بانک اطلاعاتی کارت‌های بلوری',
          '۳. همپوشانی طیفی چندگانه',
          '۴. درصد وزنی کمی RIR',
          '۵. برازش کل پروفایل پاولی و لوبای'
        ],
        tag: 'Phase Analysis'
      }
    ],
    []
  );

  // Problem-Solver Decision Matrix Goals
  const decisionGoals = useMemo<DecisionGoal[]>(
    () => [
      {
        id: 'goal_size',
        question: 'Measure crystallite size (D) & microstrain (ε)',
        questionFa: 'اندازه‌گیری ابعاد بلورک (D) و کرنش شبکه (ε)',
        moduleIds: ['scherrer', 'wh', 'integral_adv', 'double_voigt', 'wa', 'method_of_moments']
      },
      {
        id: 'goal_cell',
        question: 'Index peaks & refine lattice parameters (a, b, c)',
        questionFa: 'اندیس‌گذاری پیک‌ها و پالایش پارامترهای شبکه',
        moduleIds: ['bragg', 'unit_cells', 'selection', 'cohen', 'metric_tensor', 'pawley_lebail']
      },
      {
        id: 'goal_film',
        question: 'Characterize thin films, texture, or residual stress',
        questionFa: 'تحلیل لایه‌های نازک، بافت یا تنش پسماند',
        moduleIds: ['xrr', 'preferred_orientation', 'residual_stress']
      },
      {
        id: 'goal_quant',
        question: 'Identify phases, refine crystal structure, or probe local atomic bonds G(r)',
        questionFa: 'شناسایی فازها، پالایش ریتولد یا بررسی پیوندهای اتمی موضعی G(r)',
        moduleIds: ['pdf_analysis', 'rietveld', 'dl', 'database', 'compare', 'rir', 'pawley_lebail']
      },
      {
        id: 'goal_calib',
        question: 'Calibrate instrument Caglioti (U,V,W) or load NIST standards',
        questionFa: 'کالیبراسیون اپتیک دستگاه (U,V,W) و استاندارد NIST',
        moduleIds: ['profile', 'fwhm', 'settings', 'periodic_table']
      }
    ],
    []
  );

  // Domain Category List
  const domainCategories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number; icon: React.ReactNode }>();
    for (const m of moduleList) {
      const existing = map.get(m.category);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(m.category, {
          id: m.category,
          label: m.category,
          count: 1,
          icon: m.categoryIcon
        });
      }
    }
    return Array.from(map.values());
  }, [moduleList]);

  // Filtered & Sorted Modules
  const filteredModules = useMemo(() => {
    let list = [...moduleList];

    if (selectedPathway) {
      const pathway = researchPathways.find(p => p.id === selectedPathway);
      if (pathway) {
        list = pathway.moduleIds
          .map(id => moduleList.find(m => m.id === id))
          .filter(Boolean) as ModuleMetadata[];
      }
    } else if (selectedGoal) {
      const goal = decisionGoals.find(g => g.id === selectedGoal);
      if (goal) {
        list = goal.moduleIds
          .map(id => moduleList.find(m => m.id === id))
          .filter(Boolean) as ModuleMetadata[];
      }
    } else if (selectedCategory === 'Favorites') {
      list = list.filter(m => favorites.includes(m.id));
    } else if (selectedCategory === 'Recent') {
      list = recents
        .map(id => moduleList.find(m => m.id === id))
        .filter(Boolean) as ModuleMetadata[];
    } else if (selectedCategory !== 'All' && selectedCategory !== 'Pathways') {
      list = list.filter(m => m.category === selectedCategory);
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(m => {
        return (
          m.label.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.formula.toLowerCase().includes(q) ||
          m.tags.some(tag => tag.toLowerCase().includes(q)) ||
          (m.subModels && m.subModels.some(sm => sm.toLowerCase().includes(q))) ||
          m.descriptionDetail.toLowerCase().includes(q)
        );
      });
    }

    if (sortBy === 'alpha') {
      list.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortBy === 'complexity') {
      const order = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
      list.sort((a, b) => order[a.complexity] - order[b.complexity]);
    }

    return list;
  }, [
    moduleList,
    selectedCategory,
    selectedPathway,
    selectedGoal,
    researchPathways,
    decisionGoals,
    favorites,
    recents,
    searchQuery,
    sortBy
  ]);

  // Grouped modules by category when in 'grouped' view mode
  const groupedFilteredModules = useMemo(() => {
    const groups: { category: string; icon: React.ReactNode; items: ModuleMetadata[] }[] = [];
    const seen = new Map<string, ModuleMetadata[]>();
    const icons = new Map<string, React.ReactNode>();

    for (const m of filteredModules) {
      if (!seen.has(m.category)) {
        seen.set(m.category, []);
        icons.set(m.category, m.categoryIcon);
      }
      seen.get(m.category)!.push(m);
    }

    seen.forEach((items, category) => {
      groups.push({ category, icon: icons.get(category), items });
    });

    return groups;
  }, [filteredModules]);

  const currentInspectedModule = useMemo(() => {
    return (
      moduleList.find(m => m.id === inspectedModuleId) ||
      moduleList.find(m => m.id === activeModule) ||
      moduleList[0]
    );
  }, [moduleList, inspectedModuleId, activeModule]);

  const activePathwayObject = useMemo(() => {
    return researchPathways.find(p => p.id === selectedPathway);
  }, [researchPathways, selectedPathway]);

  // Keyboard navigation handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (['1', '2', '3'].includes(e.key) && document.activeElement !== searchInputRef.current) {
        if (e.key === '1') setViewMode('grouped');
        if (e.key === '2') setViewMode('grid');
        if (e.key === '3') setViewMode('compact');
        return;
      }

      if (e.key === 'Enter' && document.activeElement !== searchInputRef.current) {
        if (filteredModules[focusedIndex]) {
          const mod = filteredModules[focusedIndex];
          recordRecent(mod.id);
          playSynthTone('xrd_scan');
          onSelectModule(mod.id);
          onClose();
        }
        return;
      }

      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (filteredModules.length === 0) return;
        e.preventDefault();

        setFocusedIndex(prev => {
          let next = prev;
          const step = viewMode === 'compact' ? 1 : 2;
          if (e.key === 'ArrowDown') next = Math.min(prev + step, filteredModules.length - 1);
          if (e.key === 'ArrowUp') next = Math.max(prev - step, 0);
          if (e.key === 'ArrowRight') next = isRTL ? Math.max(prev - 1, 0) : Math.min(prev + 1, filteredModules.length - 1);
          if (e.key === 'ArrowLeft') next = isRTL ? Math.min(prev + 1, filteredModules.length - 1) : Math.max(prev - 1, 0);

          const targetMod = filteredModules[next];
          if (targetMod) setInspectedModuleId(targetMod.id);
          return next;
        });
      }

      if ((e.key === 'f' || e.key === 'F') && document.activeElement !== searchInputRef.current) {
        if (filteredModules[focusedIndex]) {
          toggleFavorite(filteredModules[focusedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredModules, focusedIndex, viewMode, isRTL, onSelectModule, recordRecent, toggleFavorite]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery, selectedCategory, selectedPathway, selectedGoal]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedGoal(null);
      if (VALID_MODULE_IDS.has(activeModule)) {
        setInspectedModuleId(activeModule);
      }
    }
  }, [isOpen, activeModule]);

  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'cyberpunk';

  return (
    <AnimatePresence mode="popLayout">
      <div
        id="scientific-suite-navigator-modal"
        key="scientific-suite-navigator-modal-root"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Clean Scrim Backdrop */}
        <motion.div
          key="navigator-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className={`absolute inset-0 backdrop-blur-md ${
            theme === 'cyberpunk'
              ? 'bg-black/85'
              : isDark
                ? 'bg-slate-950/80'
                : 'bg-slate-900/50'
          }`}
        />

        {/* Main Workstation Shell */}
        <motion.div
          key="navigator-shell"
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-[1400px] h-[92vh] max-h-[920px] flex flex-col rounded-2xl border shadow-2xl overflow-hidden z-10 ${
            theme === 'cyberpunk'
              ? 'bg-black border-cyber-accent/60 text-cyber-accent'
              : isDark
                ? 'bg-[#0B0F19] border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* 1. COMPACT TOP COMMAND BAR */}
          <div
            className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
              theme === 'cyberpunk'
                ? 'border-cyber-accent/30 bg-black'
                : isDark
                  ? 'border-slate-800 bg-[#070A12]'
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            {/* Brand & Engine Count */}
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent text-cyber-accent'
                    : isDark
                      ? 'bg-slate-900 border-slate-700 text-cyan-400'
                      : 'bg-white border-slate-200 text-indigo-600 shadow-xs'
                }`}
              >
                <Atom className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                  <span>{t('Scientific Suite Navigator', 'Scientific Suite Navigator')}</span>
                  <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 font-normal">
                    · {moduleList.length} {t('Engines', 'Engines')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  {t(
                    'Select an analytical engine, filter by crystallographic observable, or launch a multi-step workflow',
                    'Select an analytical engine, filter by crystallographic observable, or launch a multi-step workflow'
                  )}
                </p>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="flex-1 max-w-xl min-w-[240px] relative">
              <Search
                className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-400'
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (selectedCategory === 'Pathways') setSelectedCategory('All');
                }}
                placeholder={
                  isRTL
                    ? 'جستجوی ماژول، معادله فیزیکی یا کمیت (مثلاً Scherrer, Voigt, Halder-Wagner, XRR, RIR, Caglioti)...'
                    : 'Search module, equation, or sub-model (e.g. Monshi, Halder-Wagner, Voigt, XRR, Caglioti, RIR)...'
                }
                className={`w-full ${isRTL ? 'pr-10 pl-24' : 'pl-10 pr-24'} py-2 border rounded-xl text-xs sm:text-sm outline-none transition-colors ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent/50 focus:border-cyber-accent text-cyber-accent placeholder-cyber-accent/50'
                    : isDark
                      ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-500 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 focus:border-indigo-600 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div
                className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 flex items-center gap-1.5`}
              >
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 hidden sm:inline">
                    {filteredModules.length}/{moduleList.length} · [/]
                  </span>
                )}
              </div>
            </div>

            {/* Sort, View Mode & Close Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sort Selector */}
              <div className="hidden lg:flex items-center gap-1.5">
                <SlidersVertical className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'default' | 'alpha' | 'complexity')}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium outline-none cursor-pointer ${
                    theme === 'cyberpunk'
                      ? 'bg-black border-cyber-accent/40 text-cyber-accent'
                      : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="default">{t('Domain Order', 'Domain Order')}</option>
                  <option value="alpha">{t('Alphabetical (A–Z)', 'Alphabetical (A–Z)')}</option>
                  <option value="complexity">{t('By Complexity', 'By Complexity')}</option>
                </select>
              </div>

              {/* Segmented View Mode Control */}
              <div
                className={`flex items-center p-0.5 rounded-lg border ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent/40'
                    : isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    viewMode === 'grouped'
                      ? isDark
                        ? 'bg-slate-800 text-cyan-400 shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Grouped by Domain (Key 1)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{t('Grouped', 'Grouped')}</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    viewMode === 'grid'
                      ? isDark
                        ? 'bg-slate-800 text-cyan-400 shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Uniform Grid (Key 2)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{t('Grid', 'Grid')}</span>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    viewMode === 'compact'
                      ? isDark
                        ? 'bg-slate-800 text-cyan-400 shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Compact Table (Key 3)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{t('Table', 'Table')}</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent text-cyber-accent hover:bg-cyber-pink hover:text-black'
                    : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. MOBILE CATEGORY STRIP (Visible only below lg breakpoint) */}
          <div
            className={`flex lg:hidden items-center gap-1.5 px-4 py-2 border-b overflow-x-auto scrollbar-none shrink-0 ${
              isDark ? 'border-slate-800 bg-[#090D16]' : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            {[
              { id: 'All', label: t('All Engines', 'All Engines'), count: moduleList.length },
              { id: 'Favorites', label: t('Favorites', 'Favorites'), count: favorites.length },
              { id: 'Recent', label: t('Recent', 'Recent'), count: recents.length },
              { id: 'Pathways', label: t('Workflows', 'Workflows'), count: researchPathways.length },
              ...domainCategories
            ].map(item => {
              const isSelected = selectedCategory === item.id && !selectedPathway && !selectedGoal;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCategory(item.id);
                    setSelectedPathway(null);
                    setSelectedGoal(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer border transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                        : 'bg-indigo-600 border-indigo-600 text-white'
                      : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="font-mono tabular-nums text-[10px] opacity-75">{item.count}</span>
                </button>
              );
            })}
          </div>

          {/* 3. ASYMMETRIC 3-COLUMN WORKSPACE BODY */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT COLUMN: DOMAIN NAVIGATION & DECISION MATRIX RAIL (Desktop) */}
            <aside
              className={`w-64 border-r hidden lg:flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 p-3.5 ${
                theme === 'cyberpunk'
                  ? 'border-cyber-accent/30 bg-black'
                  : isDark
                    ? 'border-slate-800 bg-[#080C15]'
                    : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div className="space-y-5">
                {/* Section A: Workspace Views */}
                <div>
                  <div className="px-2 mb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {t('Workspace Views', 'Workspace Views')}
                  </div>
                  <div className="space-y-0.5">
                    {[
                      {
                        id: 'All',
                        label: t('All Scientific Engines', 'All Scientific Engines'),
                        count: moduleList.length,
                        icon: <LayoutGrid className="w-3.5 h-3.5 text-cyan-500" />
                      },
                      {
                        id: 'Favorites',
                        label: t('Pinned Favorites', 'Pinned Favorites'),
                        count: favorites.length,
                        icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      },
                      {
                        id: 'Recent',
                        label: t('Recent History', 'Recent History'),
                        count: recents.length,
                        icon: <History className="w-3.5 h-3.5 text-indigo-400" />
                      },
                      {
                        id: 'Pathways',
                        label: t('Guided Workflows', 'Guided Workflows'),
                        count: researchPathways.length,
                        icon: <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                      }
                    ].map(item => {
                      const active = selectedCategory === item.id && !selectedPathway && !selectedGoal;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedCategory(item.id);
                            setSelectedPathway(null);
                            setSelectedGoal(null);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            active
                              ? isDark
                                ? 'bg-slate-800/90 text-white font-semibold'
                                : 'bg-indigo-50 text-indigo-700 font-semibold'
                              : isDark
                                ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {item.icon}
                            <span className="truncate">{item.label}</span>
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-slate-400">{item.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section B: Crystallographic Domains */}
                <div>
                  <div className="px-2 mb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {t('Crystallographic Domains', 'Crystallographic Domains')}
                  </div>
                  <div className="space-y-0.5">
                    {domainCategories.map(cat => {
                      const active = selectedCategory === cat.id && !selectedPathway && !selectedGoal;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedPathway(null);
                            setSelectedGoal(null);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            active
                              ? isDark
                                ? 'bg-slate-800/90 text-white font-semibold'
                                : 'bg-indigo-50 text-indigo-700 font-semibold'
                              : isDark
                                ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {cat.icon}
                            <span className="truncate">{cat.label}</span>
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-slate-400">{cat.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section C: Research Goal Filter ("What do you want to solve?") */}
                <div
                  className={`pt-4 border-t ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}
                >
                  <div className="px-2 mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>{t('Filter by Research Goal', 'Filter by Research Goal')}</span>
                  </div>
                  <div className="space-y-1">
                    {decisionGoals.map(goal => {
                      const isSelected = selectedGoal === goal.id;
                      return (
                        <button
                          key={goal.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGoal(null);
                            } else {
                              setSelectedGoal(goal.id);
                              setSelectedPathway(null);
                              setSelectedCategory('All');
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] leading-snug transition-colors cursor-pointer border ${
                            isSelected
                              ? isDark
                                ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200 font-medium'
                                : 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                              : isDark
                                ? 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {isRTL ? goal.questionFa : goal.question}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Reset Filter Button if any filter is engaged */}
              {(searchQuery || selectedCategory !== 'All' || selectedPathway || selectedGoal) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedPathway(null);
                    setSelectedGoal(null);
                  }}
                  className={`mt-4 w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Reset All Filters', 'Reset All Filters')}</span>
                </button>
              )}
            </aside>

            {/* CENTER COLUMN: MODULE CATALOG / WORKFLOW PIPELINES */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-6">
              {/* Guided Workflows View (When 'Pathways' is selected or a pathway is active) */}
              {(selectedCategory === 'Pathways' || activePathwayObject) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <Workflow className="w-4 h-4 text-emerald-500" />
                        <span>{t('Guided Multi-Step Research Workflows', 'Guided Multi-Step Research Workflows')}</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          'Recommended end-to-end analytical sequences connecting sample preparation, profile fitting, and physical modeling',
                          'Recommended end-to-end analytical sequences connecting sample preparation, profile fitting, and physical modeling'
                        )}
                      </p>
                    </div>
                    {activePathwayObject && (
                      <button
                        onClick={() => setSelectedPathway(null)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {t('Show All Workflows', 'Show All Workflows')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                    {researchPathways.map(pw => {
                      const isSelected = selectedPathway === pw.id;
                      return (
                        <div
                          key={pw.id}
                          className={`p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                            isSelected
                              ? isDark
                                ? 'bg-slate-900/90 border-cyan-500/60'
                                : 'bg-indigo-50/50 border-indigo-500'
                              : isDark
                                ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`p-2 rounded-lg border ${
                                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  {pw.icon}
                                </div>
                                <div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    {pw.tag} · {pw.moduleIds.length} {t('Steps', 'Steps')}
                                  </div>
                                  <h5 className="text-sm font-bold">{isRTL ? pw.titleFa : pw.title}</h5>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const firstId = pw.moduleIds[0];
                                  if (firstId) {
                                    recordRecent(firstId);
                                    onSelectModule(firstId);
                                    onClose();
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                <span>{t('Start Step 1', 'Start Step 1')}</span>
                              </button>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                              {isRTL ? pw.descriptionFa : pw.description}
                            </p>
                          </div>

                          {/* Interactive Step Buttons */}
                          <div className="space-y-1.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                            {(isRTL ? pw.stepLabelsFa : pw.stepLabels).map((stepText, idx) => {
                              const stepModId = pw.moduleIds[idx];
                              const stepMod = moduleList.find(m => m.id === stepModId);
                              if (!stepMod) return null;
                              const isCurrentActive = activeModule === stepModId;
                              return (
                                <div
                                  key={stepModId}
                                  onMouseEnter={() => setInspectedModuleId(stepModId)}
                                  onClick={() => {
                                    recordRecent(stepModId);
                                    onSelectModule(stepModId);
                                    onClose();
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                    isCurrentActive
                                      ? isDark
                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                      : isDark
                                        ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                                        : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <span className="font-medium truncate">{stepText}</span>
                                  <span className="font-mono text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                                    <span>{stepMod.formula.split('·')[0].trim()}</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Goal Filter Banner */}
              {selectedGoal && (
                <div
                  className={`p-3 px-4 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <Target className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="font-semibold">
                      {t('Recommended Engines for:', 'Recommended Engines for:')}{' '}
                      {isRTL
                        ? decisionGoals.find(g => g.id === selectedGoal)?.questionFa
                        : decisionGoals.find(g => g.id === selectedGoal)?.question}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="text-xs font-medium underline cursor-pointer shrink-0"
                  >
                    {t('Clear filter', 'Clear filter')}
                  </button>
                </div>
              )}

              {/* Modules Display (When not exclusively browsing Pathways) */}
              {selectedCategory !== 'Pathways' && (
                <>
                  {filteredModules.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold">
                        {t('No matching scientific modules found', 'No matching scientific modules found')}
                      </h4>
                      <p className="text-xs max-w-sm mx-auto text-slate-500">
                        {isRTL
                          ? 'عبارت جستجو را تغییر دهید یا فیلترها را بازنشانی کنید.'
                          : 'Try searching for equations or methods such as "Voigt", "Monshi", "Halder-Wagner", "Cohen", or "XRR".'}
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedPathway(null);
                          setSelectedGoal(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                      >
                        {t('Reset Filters', 'Reset Filters')}
                      </button>
                    </div>
                  ) : viewMode === 'grouped' && selectedCategory === 'All' && !searchQuery && !selectedGoal ? (
                    <div className="space-y-6">
                      {groupedFilteredModules.map(group => (
                        <section key={group.category} className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <h4 className="text-xs font-bold tracking-tight flex items-center gap-2 text-slate-700 dark:text-slate-200">
                              {group.icon}
                              <span>{group.category}</span>
                            </h4>
                            <span className="text-[11px] font-mono tabular-nums text-slate-400">
                              {group.items.length} {t('modules', 'modules')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.items.map(m => {
                              const flatIdx = filteredModules.findIndex(item => item.id === m.id);
                              return (
                                <ModuleCard
                                  key={m.id}
                                  metadata={m}
                                  isActive={activeModule === m.id}
                                  isFavorite={favorites.includes(m.id)}
                                  isFocused={flatIdx === focusedIndex}
                                  isInspected={inspectedModuleId === m.id}
                                  viewMode="grid"
                                  isDark={isDark}
                                  theme={theme}
                                  isRTL={isRTL}
                                  onSelect={() => {
                                    recordRecent(m.id);
                                    playSynthTone('xrd_scan');
                                    onSelectModule(m.id);
                                    onClose();
                                  }}
                                  onInspect={() => setInspectedModuleId(m.id)}
                                  onToggleFavorite={e => toggleFavorite(m.id, e)}
                                />
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : viewMode === 'compact' ? (
                    <div
                      className={`rounded-xl border overflow-hidden ${
                        isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div
                        className={`grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold border-b ${
                          isDark
                            ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="col-span-5">{t('Engine & Scope', 'Engine & Scope')}</div>
                        <div className="col-span-4 hidden sm:block">{t('Governing Equation', 'Governing Equation')}</div>
                        <div className="col-span-2 hidden md:block">{t('Domain', 'Domain')}</div>
                        <div className="col-span-7 sm:col-span-3 md:col-span-1 text-right">{t('Action', 'Action')}</div>
                      </div>
                      <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                        {filteredModules.map((m, idx) => (
                          <ModuleCard
                            key={m.id}
                            metadata={m}
                            isActive={activeModule === m.id}
                            isFavorite={favorites.includes(m.id)}
                            isFocused={idx === focusedIndex}
                            isInspected={inspectedModuleId === m.id}
                            viewMode="compact"
                            isDark={isDark}
                            theme={theme}
                            isRTL={isRTL}
                            onSelect={() => {
                              recordRecent(m.id);
                              playSynthTone('xrd_scan');
                              onSelectModule(m.id);
                              onClose();
                            }}
                            onInspect={() => setInspectedModuleId(m.id)}
                            onToggleFavorite={e => toggleFavorite(m.id, e)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredModules.map((m, idx) => (
                        <ModuleCard
                          key={m.id}
                          metadata={m}
                          isActive={activeModule === m.id}
                          isFavorite={favorites.includes(m.id)}
                          isFocused={idx === focusedIndex}
                          isInspected={inspectedModuleId === m.id}
                          viewMode="grid"
                          isDark={isDark}
                          theme={theme}
                          isRTL={isRTL}
                          onSelect={() => {
                            recordRecent(m.id);
                            playSynthTone('xrd_scan');
                            onSelectModule(m.id);
                            onClose();
                          }}
                          onInspect={() => setInspectedModuleId(m.id)}
                          onToggleFavorite={e => toggleFavorite(m.id, e)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RIGHT COLUMN: ALWAYS-ON SCIENTIFIC SPECIFICATION INSPECTOR */}
            {currentInspectedModule && (
              <aside
                className={`w-80 xl:w-96 border-l p-5 overflow-y-auto shrink-0 hidden md:flex flex-col justify-between custom-scrollbar ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent/30 text-cyber-accent'
                    : isDark
                      ? 'bg-[#080C15] border-slate-800 text-slate-100'
                      : 'bg-slate-50/70 border-slate-200 text-slate-900'
                }`}
              >
                <div className="space-y-4">
                  {/* Inspector Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        {currentInspectedModule.icon}
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{currentInspectedModule.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{currentInspectedModule.complexity}</span>
                        </div>
                        <h4 className="text-base font-bold tracking-tight leading-snug mt-0.5">
                          {currentInspectedModule.label}
                        </h4>
                      </div>
                    </div>
                    <button
                      onClick={e => toggleFavorite(currentInspectedModule.id, e)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                        isDark
                          ? 'border-slate-800 hover:bg-slate-800 text-amber-400'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-amber-500'
                      }`}
                      title="Pin to Favorites (Key F)"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.includes(currentInspectedModule.id) ? 'fill-amber-400' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Governing Equation Block */}
                  <div
                    className={`p-3 rounded-xl border font-mono ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{t('Governing Relation', 'Governing Relation')}</span>
                      {currentInspectedModule.recommendedRange && (
                        <span>{currentInspectedModule.recommendedRange}</span>
                      )}
                    </div>
                    <div
                      className={`text-xs font-semibold break-words ${
                        isDark ? 'text-cyan-300' : 'text-indigo-700'
                      }`}
                    >
                      {currentInspectedModule.formula}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {t('Physical Scope', 'Physical Scope')}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {currentInspectedModule.descriptionDetail}
                    </p>
                  </div>

                  {/* Integrated Sub-Models / Formalisms */}
                  {currentInspectedModule.subModels && currentInspectedModule.subModels.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        {t('Included Formalisms & Sub-Models', 'Included Formalisms & Sub-Models')}
                      </div>
                      <div className="space-y-1">
                        {currentInspectedModule.subModels.map((sm, i) => (
                          <div
                            key={i}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${
                              isDark
                                ? 'bg-slate-900/60 border-slate-800/90 text-slate-200'
                                : 'bg-white border-slate-200/80 text-slate-700'
                            }`}
                          >
                            {sm}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inputs & Computed Observables */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {t('Required Inputs', 'Required Inputs')}
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {currentInspectedModule.inputs.map((inp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-slate-400 select-none">•</span>
                            <span>{inp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {t('Computed Observables', 'Computed Observables')}
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-700 dark:text-emerald-300/90">
                        {currentInspectedModule.outputs.map((out, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Connected Companion Modules */}
                  {currentInspectedModule.suggestedNext.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        {t('Downstream Companion Engines', 'Downstream Companion Engines')}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentInspectedModule.suggestedNext.map(nid => {
                          const target = moduleList.find(m => m.id === nid);
                          if (!target) return null;
                          return (
                            <button
                              key={nid}
                              onClick={() => {
                                recordRecent(nid);
                                onSelectModule(nid);
                                onClose();
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                                isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-700'
                              }`}
                            >
                              <span>{target.label}</span>
                              <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Launch Action Footer */}
                <div className={`pt-4 mt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    onClick={() => {
                      recordRecent(currentInspectedModule.id);
                      playSynthTone('xrd_scan');
                      onSelectModule(currentInspectedModule.id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {activeModule === currentInspectedModule.id
                        ? t('Return to Active Workstation', 'Return to Active Workstation')
                        : t('Open Workstation', 'Open Workstation')}
                    </span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </aside>
            )}
          </div>

          {/* 4. MINIMAL KEYBOARD SHORTCUT FOOTER */}
          <div
            className={`px-5 py-2.5 border-t flex flex-wrap items-center justify-between gap-3 text-[11px] shrink-0 ${
              theme === 'cyberpunk'
                ? 'border-cyber-accent/30 bg-black text-cyber-accent/70'
                : isDark
                  ? 'border-slate-800 bg-[#070A12] text-slate-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  ↑↓←→
                </kbd>
                <span>{t('Inspect', 'Inspect')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  Enter
                </kbd>
                <span>{t('Open', 'Open')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  /
                </kbd>
                <span>{t('Search', 'Search')}</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  F
                </kbd>
                <span>{t('Pin Favorite', 'Pin Favorite')}</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  1 / 2 / 3
                </kbd>
                <span>{t('View Mode', 'View Mode')}</span>
              </span>
            </div>

            <div className="font-mono tabular-nums text-slate-400">
              {t('Active Workstation:', 'Active Workstation:')}{' '}
              <span className="text-slate-700 dark:text-slate-200 font-semibold">
                {moduleList.find(m => m.id === activeModule)?.label || activeModule}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ModuleCardProps {
  metadata: ModuleMetadata;
  isActive: boolean;
  isFavorite: boolean;
  isFocused: boolean;
  isInspected: boolean;
  viewMode: 'grid' | 'compact';
  isDark: boolean;
  theme: string;
  isRTL: boolean;
  onSelect: () => void;
  onInspect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  metadata,
  isActive,
  isFavorite,
  isFocused,
  isInspected,
  viewMode,
  isDark,
  theme,
  isRTL,
  onSelect,
  onInspect,
  onToggleFavorite
}) => {
  if (viewMode === 'compact') {
    return (
      <div
        id={`module-card-${metadata.id}`}
        onClick={onSelect}
        onMouseEnter={onInspect}
        className={`grid grid-cols-12 gap-3 px-4 py-2.5 items-center transition-colors cursor-pointer group ${
          isActive
            ? isDark
              ? 'bg-indigo-950/50 text-white'
              : 'bg-indigo-50/80 text-indigo-950'
            : isInspected || isFocused
              ? isDark
                ? 'bg-slate-800/60'
                : 'bg-slate-100/80'
              : isDark
                ? 'hover:bg-slate-900/60'
                : 'hover:bg-slate-50'
        }`}
      >
        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleFavorite}
            className="text-slate-400 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
            title="Pin Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          <div className="shrink-0">{metadata.icon}</div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate flex items-center gap-1.5">
              <span className="truncate">{metadata.label}</span>
              {isActive && (
                <span className="text-[10px] font-mono text-emerald-500 font-bold shrink-0">· Active</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{metadata.subtitle}</p>
          </div>
        </div>

        <div className="col-span-4 hidden sm:block font-mono text-[11px] text-slate-600 dark:text-cyan-300/90 truncate">
          {metadata.formula}
        </div>

        <div className="col-span-2 hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {metadata.complexity}
        </div>

        <div className="col-span-7 sm:col-span-3 md:col-span-1 flex items-center justify-end gap-1">
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
            }`}
          />
        </div>
      </div>
    );
  }

  // Standard Grid Card (Zero-Pill Metadata Discipline)
  return (
    <div
      id={`module-card-${metadata.id}`}
      onClick={onSelect}
      onMouseEnter={onInspect}
      className={`p-3.5 rounded-xl border transition-colors cursor-pointer group flex flex-col justify-between ${
        isActive
          ? theme === 'cyberpunk'
            ? 'bg-black border-cyber-pink'
            : isDark
              ? 'bg-indigo-950/40 border-indigo-500/80'
              : 'bg-indigo-50/70 border-indigo-500'
          : isInspected || isFocused
            ? isDark
              ? 'bg-slate-900/90 border-cyan-500/50'
              : 'bg-slate-50 border-indigo-300'
            : isDark
              ? 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
              : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Card Header: Icon + Title + Star */}
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              {metadata.icon}
            </div>
            <div className="min-w-0">
              <h5
                className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-indigo-950'
                    : isDark
                      ? 'text-slate-100 group-hover:text-cyan-300'
                      : 'text-slate-900 group-hover:text-indigo-600'
                }`}
              >
                {metadata.label}
              </h5>
              {/* Unboxed Metadata Line */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                <span>{metadata.complexity}</span>
                {metadata.subModels && metadata.subModels.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{metadata.subModels.length} models</span>
                  </>
                )}
                {isActive && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-500 font-semibold">Active</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleFavorite}
            className="p-1 rounded-md text-slate-400 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
            title="Toggle Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
          {metadata.subtitle}
        </p>
      </div>

      {/* Footer: Governing Formula + Open Affordance (Unboxed text) */}
      <div
        className={`pt-2 border-t flex items-center justify-between gap-2 text-[11px] font-mono ${
          isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
        }`}
      >
        <span className={`truncate ${isDark ? 'text-cyan-400/90' : 'text-indigo-600/90'}`}>
          {metadata.formula}
        </span>
        <ArrowUpRight
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            isRTL ? 'rotate-[-90deg] group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
          } text-slate-400 group-hover:text-indigo-500`}
        />
      </div>
    </div>
  );
};
