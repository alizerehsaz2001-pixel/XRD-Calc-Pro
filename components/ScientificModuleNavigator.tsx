import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Sparkles, 
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
  Cpu, 
  Orbit, 
  Magnet, 
  Brain, 
  Image as ImageIcon, 
  Terminal, 
  Check, 
  ChevronRight,
  ChevronDown,
  Atom,
  FlaskConical,
  Compass,
  Zap,
  Command,
  LayoutGrid,
  List,
  SlidersHorizontal,
  BarChart3,
  ArrowUpRight,
  Star,
  Clock,
  Target,
  Info,
  CheckCircle2,
  Filter,
  Eye,
  SlidersVertical,
  HelpCircle,
  Sparkle,
  History,
  FileCode2,
  Share2
} from 'lucide-react';

export type ModuleId = 
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
  | 'rir' 
  | 'rietveld' 
  | 'neutron' 
  | 'magnetic' 
  | 'dl' 
  | 'image_analysis' 
  | 'image_gen' 
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
  category: string;
  categoryIcon: React.ReactNode;
  subtitle: string;
  formula?: string;
  tags: string[];
  icon: React.ReactNode;
  inputs?: string[];
  outputs?: string[];
  complexity?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  descriptionDetail?: string;
  suggestedNext?: ModuleId[];
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
  color: string;
}

interface ScientificModuleNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  theme?: string;
}

const FAVORITES_STORAGE_KEY = 'xrd_suite_favorite_modules';
const RECENTS_STORAGE_KEY = 'xrd_suite_recent_modules';

export const ScientificModuleNavigator: React.FC<ScientificModuleNavigatorProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
  theme = 'light'
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he' || i18n.language === 'fa' || i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'split'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'alpha' | 'complexity'>('default');
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  
  // Quick Preview Inspector State
  const [inspectedModuleId, setInspectedModuleId] = useState<ModuleId>(activeModule);

  // Favorites & Recents State
  const [favorites, setFavorites] = useState<ModuleId[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['bragg', 'scherrer', 'wh', 'rietveld', 'selection'];
    } catch {
      return ['bragg', 'scherrer', 'wh', 'rietveld', 'selection'];
    }
  });

  const [recents, setRecents] = useState<ModuleId[]>(() => {
    try {
      const saved = localStorage.getItem(RECENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['bragg', 'selection', 'wh'];
    } catch {
      return ['bragg', 'selection', 'wh'];
    }
  });

  // Keyboard Selection Index for arrow navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Toggle favorite helper
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

  // Record recent module helper
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

  // Master Module Catalog
  const moduleList = useMemo<ModuleMetadata[]>(() => {
    const defaultIconClass = "w-5 h-5";
    return [
      // Category 1: Fundamentals & Optics
      {
        id: 'bragg',
        label: t('Bragg Basics', 'Bragg Basics'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'محاسبه زاویه 2θ، فاصله صفحات d و بردار پراکندگی Q' : 'Calculate d-spacing, 2θ angles & Q-scattering vector',
        formula: 'λ = 2d·sin(θ)',
        tags: ['d-spacing', '2Theta', 'Q-vector', 'Wavelength', 'Bragg'],
        icon: <Activity className={`${defaultIconClass} text-cyan-400`} />,
        inputs: ['Wavelength (λ)', 'Bragg Angle (2θ)', 'Miller Indices (hkl)'],
        outputs: ['d-spacing (Å)', 'Scattering Vector Q (Å⁻¹)', 'Bragg Energy (keV)'],
        complexity: 'Beginner',
        descriptionDetail: isRTL 
          ? 'پایه و اساس پراش پرتو ایکس؛ پیوند مستقیم بین طول موج تابشی، فاصله صفحات اتمی و زاویه تداخل سازنده امواج براگ.' 
          : 'The core fundamental equation of X-ray diffraction linking radiation wavelength, crystal interplanar spacing, and constructive interference angles.',
        suggestedNext: ['selection', 'fwhm', 'compare']
      },
      {
        id: 'fwhm',
        label: t('FWHM Profile Fitting', 'FWHM Profile Fitting'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'تحلیل پهنای نیمه ارتفاع، توابع گوسی، لورنتسی و سودو-وویت' : 'Full Width at Half Maximum profile & line shape analysis',
        formula: 'FWHM (β)',
        tags: ['FWHM', 'Line Shape', 'Gaussian', 'Lorentzian', 'Pseudo-Voigt', 'Broadening'],
        icon: <Sliders className={`${defaultIconClass} text-blue-400`} />,
        inputs: ['Raw Peak Profile (2θ, I)', 'Profile Function Choice'],
        outputs: ['True β (FWHM)', 'Gaussian/Lorentzian Fraction (η)', 'Integrated Area'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'برازش پیشرفته اشکال خطوط پراش جهت استخراج دقیق پهنای پیک برای روش‌های ویلیامسون-هال و شرر.'
          : 'High-precision profile deconvolution and peak fitting to separate instrumental broadening from physical sample broadening.',
        suggestedNext: ['scherrer', 'wh', 'double_voigt']
      },
      {
        id: 'selection',
        label: t('Selection & Extinction Rules', 'Selection & Extinction Rules'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'قوانین خاموشی، کره اولد سه‌بعدی و تانسور فضای معکوس' : 'Systematic absences, 3D Ewald sphere probe & reciprocal lattice',
        formula: 'h + k + l = 2n',
        tags: ['HKL', 'Extinction', 'BCC', 'FCC', 'Symmetry', 'Ewald', 'Reciprocal Space'],
        icon: <Hash className={`${defaultIconClass} text-indigo-400`} />,
        inputs: ['Crystal System', 'Bravais Lattice', 'Miller Indices (hkl)'],
        outputs: ['Allowed/Forbidden Status', 'Structure Factor |F|²', 'Ewald Excitation Error (s_g)'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'موتور جامع قوانین خاموشی سیستم‌های بلوری همراه با کاوشگر تعاملی ۳ بعدی فضای معکوس و کره اولد.'
          : 'Comprehensive space group extinction logic matrix with full 3D interactive Ewald sphere goniometer resonance simulator.',
        suggestedNext: ['cohen', 'metric_tensor', 'bragg']
      },
      {
        id: 'compare',
        label: t('Diffraction Compare Engine', 'Diffraction Compare Engine'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'مقایسه همزمان الگوی پراکندگی چند ماده و انطباق پیک‌ها' : 'Multi-pattern spectral overlay & peak matching workbench',
        formula: 'I_rel vs 2θ',
        tags: ['Overlay', 'Comparative', 'Multi-Phase', 'Matching', 'Spectral'],
        icon: <Layers className={`${defaultIconClass} text-sky-400`} />,
        inputs: ['Multiple XRD Scans (.xy, .csv)', 'Reference Standards'],
        outputs: ['Multi-spectrum Overlay', 'Peak Shift Metrics (Δ2θ)', 'Phase Overlap Map'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'میز کار همپوشانی طیفی چندگانه برای مقایسه داده‌های سنتز شده با استانداردهای مرجع یا چند نمونه.'
          : 'Side-by-side comparative analysis workbench to overlay synthesized spectra against reference standards and identify peak shifts.',
        suggestedNext: ['rir', 'dl', 'pawley_lebail']
      },
      {
        id: 'preferred_orientation',
        label: t('Preferred Orientation (March-Dollase)', 'Preferred Orientation'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'تصحیح بافت و جهت‌گیری ترجیحی بلورک‌ها' : 'Texture correction & pole density coefficient calculation',
        formula: 'P_k = (r²cos²α + r⁻¹sin²α)⁻³/²',
        tags: ['Texture', 'March-Dollase', 'Pole Density', 'Orientation', 'Preferred'],
        icon: <Compass className={`${defaultIconClass} text-teal-400`} />,
        inputs: ['March-Dollase parameter r', 'Tilt Angle α', 'Preferred Axis (H K L)'],
        outputs: ['Pole Density P_k', 'Corrected Intensity Factor', 'Orientation Distribution'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'مدل‌سازی بافت و ناهمسانگردی جهت‌گیری دانه‌ها در لایه‌های نازک یا پودرهای فشرده.'
          : 'Mathematical texture model to correct intensity aberrations caused by plate-like or needle-like crystallite orientations.',
        suggestedNext: ['residual_stress', 'xrr', 'rietveld']
      },
      {
        id: 'xrr',
        label: t('X-Ray Reflectometry (XRR)', 'X-Ray Reflectometry (XRR)'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'تحلیل بازتاب‌سنجی پرتو ایکس، ضخامت لایه‌ها، زبری سطوح و چگالی' : 'Thin film thickness, roughness & density modeling with Parratt recursion',
        formula: 'R = |R_0|², d = 2π / Δq_z',
        tags: ['XRR', 'Reflectometry', 'Thin Films', 'Thickness', 'Roughness', 'Density', 'Parratt', 'Kiessig'],
        icon: <Activity className={`${defaultIconClass} text-cyan-400`} />,
        inputs: ['Reflectometry Specular Scan (2θ < 10°)', 'Layer Stack Architecture'],
        outputs: ['Film Thickness (nm)', 'Interface Roughness (σ)', 'Electron Density Profile'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'محاسبه بازتاب‌سنجی پرتو ایکس با فرمول بازگشتی پارات برای اندازه‌گیری دقیق ضخامت نانومتری و زبری لایه‌ها.'
          : 'Full Parratt recursive reflectivity engine and Kiessig fringe Fourier transforms for multilayer thin film characterization.',
        suggestedNext: ['residual_stress', 'preferred_orientation']
      },

      // Category 2: Size, Strain & Dynamics
      {
        id: 'scherrer',
        label: t('Scherrer Crystallite Size', 'Scherrer Method'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'محاسبه میانگین ابعاد بلورک‌ها با ضریب شکل K' : 'Classical grain domain size analysis with shape factor K',
        formula: 'D = Kλ / (β·cosθ)',
        tags: ['Grain Size', 'Nanocrystals', 'Shape Factor K', 'Scherrer', 'Nanoparticles'],
        icon: <Microscope className={`${defaultIconClass} text-emerald-400`} />,
        inputs: ['Peak 2θ', 'Peak FWHM β', 'Wavelength λ', 'Shape Factor K (0.89 - 1.0)'],
        outputs: ['Apparent Crystallite Domain Size (D in nm/Å)'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'روش کلاسیک و رایج‌ترین فرمول جهانی برای تخمین ابعاد حوزه‌های متفرق‌کننده همدوس در نانومواد.'
          : 'The classic crystallite domain size calculation equation, ideal for isotropic nanoparticles and preliminary size screening.',
        suggestedNext: ['wh', 'monshi_scherrer', 'double_voigt']
      },
      {
        id: 'wh',
        label: t('Williamson-Hall Method', 'Williamson-Hall (W-H)'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تفکیک کرنش میکروسکوپی شبکه از پهن‌شدگی اندازه بلورک' : 'Linear separation of microstrain (ε) from grain size broadening',
        formula: 'β·cosθ = Kλ/D + 4ε·sinθ',
        tags: ['Microstrain', 'Size-Strain', 'W-H Plot', 'Linear Fit', 'Dislocations', 'UDM', 'USDM', 'UDEDM'],
        icon: <TrendingUp className={`${defaultIconClass} text-emerald-400`} />,
        inputs: ['Series of Peaks (2θ, β, hkl)', 'Model: UDM / USDM / UDEDM'],
        outputs: ['True Crystallite Size D', 'Lattice Microstrain ε', 'Energy Density u'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'تفکیک خطی کرنش شبکه از پهن‌شدگی ابعاد دانه با پشتیبانی از مدل‌های چگالی تنش و انرژی همسانگرد و ناهمسانگرد.'
          : 'Separates size-induced broadening from microstrain using multi-peak linear regression, supporting Uniform Deformation Models.',
        suggestedNext: ['monshi_scherrer', 'wa', 'integral_adv']
      },
      {
        id: 'monshi_scherrer',
        label: t('Monshi-Scherrer Scheme', 'Monshi-Scherrer Scheme'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'برونیابی لگاریتمی دقیق اصلاح‌شده برای نانوذرات' : 'Modified logarithmic extrapolation model for ultra-small crystallites',
        formula: 'ln(β) = ln(Kλ/D) + ln(1/cosθ)',
        tags: ['Monshi', 'Modified Scherrer', 'Logarithmic Fit', 'Nanomaterials'],
        icon: <Activity className={`${defaultIconClass} text-green-400`} />,
        inputs: ['Multi-peak 2θ and β values', 'Shape Factor K'],
        outputs: ['Monshi-corrected Size D', 'Regression Line Intercept & Slope'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'برونیابی لگاریتمی دقیق برای حذف خطاهای ناشی از تخمین زوایای بالا در نانوبلورها.'
          : 'Logarithmic modification of the Scherrer formula that linearizes high-angle data for superior accuracy in ultrafine nanostructures.',
        suggestedNext: ['wh', 'double_voigt']
      },
      {
        id: 'double_voigt',
        label: t('Double-Voigt Method', 'Double-Voigt Method'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'توزیع ابعاد حواشی و کرنش بر اساس کانولوشن وویت' : 'Voigt profile convolution for volume-weighted vs number-weighted size',
        formula: 'β_L(s) & β_G(s)',
        tags: ['Double-Voigt', 'Convolution', 'Volume-Weighted', 'Distribution', 'Lorentzian', 'Gaussian'],
        icon: <Layers className={`${defaultIconClass} text-teal-400`} />,
        inputs: ['Deconvoluted Gaussian & Cauchy Breadths for Multiple Orders'],
        outputs: ['Volume-Weighted Size ⟨D⟩_v', 'Area-Weighted Size ⟨D⟩_a', 'Microstrain Distribution'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'روش تحلیلی دقیق بر مبنای کانولوشن دوگانه وویت برای دستیابی به میانگین‌های وزنی حجمی و سطحی اندازه.'
          : 'Rigorous Voigt function separation distinguishing Cauchy-Lorentz size contributions from Gaussian strain broadening.',
        suggestedNext: ['wa', 'method_of_moments']
      },
      {
        id: 'integral',
        label: t('Integral Breadth Analysis', 'Integral Breadth (IB)'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تحلیل پهنای انتگرالی نسبت مساحت کل به ارتفاع پیک' : 'Integrated intensity area over peak height parameter',
        formula: 'β_I = A / I_max',
        tags: ['Integral Breadth', 'Peak Area', 'Profiles', 'Line Width'],
        icon: <InfinityIcon className={`${defaultIconClass} text-lime-400`} />,
        inputs: ['Integrated Peak Area (A)', 'Maximum Peak Intensity (I_max)'],
        outputs: ['Integral Breadth β_I (rad/°)', 'Apparent Domain Thickness'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'محاسبه پارامتر پهنای انتگرالی که نسبت به FWHM کمتر تحت تاثیر شکل حواشی پیک قرار می‌گیرد.'
          : 'Less sensitive to truncation errors and peak tails compared to simple FWHM, providing robust area-based broadening.',
        suggestedNext: ['integral_adv', 'fwhm']
      },
      {
        id: 'integral_adv',
        label: t('IB Advanced (W-H)', 'IB Advanced (W-H)'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'روش پیشرفته پهنای انتگرالی ترکیبی گوسی و لورنتسی' : 'Advanced Gaussian-Lorentzian IB plot for size/strain',
        formula: 'β* = 1/D + 2e s*',
        tags: ['IB Advanced', 'Lorentzian', 'Gaussian', 'Size-Strain', 'Parabolic Fit'],
        icon: <Sliders className={`${defaultIconClass} text-emerald-300`} />,
        inputs: ['Reduced coordinates s* and β*', 'Lorentzian and Gaussian components'],
        outputs: ['Weight-Averaged Domain Length', 'Apparent Strain Parameter'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'توسعه یافته روش پهنای انتگرالی با رسم در مختصات معکوس بدون فرض توزیع تک خطی.'
          : 'Reciprocal space parabolic and linear formulations using integral breadth for robust size-strain separation.',
        suggestedNext: ['double_voigt', 'wa']
      },
      {
        id: 'wa',
        label: t('Warren-Averbach Fourier', 'Warren-Averbach'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تحلیل سری فوریه برای توابع توزیع واقعی طول ستون' : 'True column length distribution & RMS microstrain <ε_L²>¹/²',
        formula: 'A_L(s) = A_L^S · A_L^D',
        tags: ['Fourier', 'Warren-Averbach', 'RMS Strain', 'Column Length', 'Dislocation Density'],
        icon: <Network className={`${defaultIconClass} text-green-300`} />,
        inputs: ['Two or more orders of reflections (e.g. 111 & 222)', 'Fourier Coefficients A_n'],
        outputs: ['True Column Length Distribution p(L)', 'Area-weighted Size ⟨L⟩_A', 'RMS Microstrain ⟨ε_L²⟩¹/²'],
        complexity: 'Expert',
        descriptionDetail: isRTL
          ? 'استاندارد طلایی تئوری عیوب بلوری برای محاسبه توزیع واقعی ابعاد و کرنش میانگین ریشه‌ای فوریه.'
          : 'The gold-standard Fourier deconvolution method yielding the true physical column length distribution and RMS microstrain.',
        suggestedNext: ['method_of_moments', 'double_voigt']
      },
      {
        id: 'method_of_moments',
        label: t('Method of Moments (Variance)', 'Method of Moments'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تحلیل گشتاورهای آماری و واریانس خطوط پراکندگی' : 'Statistical moment analysis of profile variance vs integration range',
        formula: 'W(2θ) = ⟨(2θ - 2θ₀)²⟩',
        tags: ['Variance', 'Moments', 'Asymmetry', 'Statistical', 'Skewness'],
        icon: <BarChart3 className={`${defaultIconClass} text-emerald-500`} />,
        inputs: ['Intensity Distribution over Angular Range Δ2θ'],
        outputs: ['Variance W', 'Centroid ⟨2θ⟩', 'Apparent Crystallite Size & Strain Slopes'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'رویکرد آماری بدون مدل بر اساس گشتاور دوم توزیع شدت برای تفکیک اندازه و کرنش بدون نیاز به برازش تابع خاص.'
          : 'Model-free statistical variance approach analyzing higher moments to decouple size and distortion broadening.',
        suggestedNext: ['wa', 'residual_stress']
      },
      {
        id: 'residual_stress',
        label: t('Residual Stress (sin²ψ)', 'Residual Stress (sin²ψ)'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'ارزیابی تنش‌های پسماند ماکروسکوپی و تانسور الاستیک' : 'Macroscopic residual stress & elastic lattice strain tensor evaluation',
        formula: 'ε_ψ = ((1+ν)/E)σ·sin²ψ - (ν/E)(σ₁+σ₂)',
        tags: ['Sin2Psi', 'Residual Stress', 'Macro-stress', 'Elasticity', 'Young Modulus', 'Poisson'],
        icon: <Zap className={`${defaultIconClass} text-amber-400`} />,
        inputs: ['Tilt angles ψ (0° to 60°)', 'Peak positions d_ψ', 'Young Modulus E & Poisson ratio ν'],
        outputs: ['Residual Stress σ (MPa)', 'Stress Error Bar', 'Shear Stress Component'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'محاسبه تنش‌های پسماند سطحی و عمقی در قطعات مکانیکی، پوشش‌های سخت و لایه‌های نازک با روش شیب sin²ψ.'
          : 'Measures macro-stresses and elastic strains from linear/elliptical sin²ψ peak shifts with full elastic constants.',
        suggestedNext: ['xrr', 'preferred_orientation']
      },

      // Category 3: Structure & Refinement
      {
        id: 'cohen',
        label: t("Cohen's Matrix Refinement", "Cohen's Matrix Refinement"),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'پالایش ماتریسی کمترین مربعات ثابت‌های شبکه و خطای زاویه' : 'Least-squares matrix correction for unit cell parameters & zero-shift',
        formula: 'sin²θ = A·h² + B·k² + C·l² + D·cos²θ',
        tags: ['Cohen', 'Lattice Refinement', 'Least Squares', 'Zero Offset', 'Unit Cell'],
        icon: <Grid className={`${defaultIconClass} text-purple-400`} />,
        inputs: ['List of (h k l) reflections and observed 2θ angles', 'Crystal System'],
        outputs: ['Refined Lattice Parameters (a, b, c)', 'Systematic Zero Error (Δ2θ_0)', 'Standard Deviations'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'حل ماتریسی به روش کمترین مربعات برای دستیابی به دقیق‌ترین ابعاد سلول واحد همزمان با حذف خطای صفر گونیومتر.'
          : 'High-precision analytic matrix least-squares solution that eliminates systematic instrumental zero-shift and sample displacement.',
        suggestedNext: ['metric_tensor', 'supercell_transform', 'pawley_lebail']
      },
      {
        id: 'metric_tensor',
        label: t('Metric Tensor Algebra', 'Metric Tensor Algebra'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'تانسورهای فضای معکوس g_ij و محاسبه زوایای بین صفحات' : 'Reciprocal space metric tensor g^ij & interplanar angle calculations',
        formula: 'g_ij = a_i · a_j',
        tags: ['Metric Tensor', 'Reciprocal Space', 'Interplanar Angle', 'Geometry', 'Cross Product'],
        icon: <Sparkles className={`${defaultIconClass} text-indigo-400`} />,
        inputs: ['Lattice Parameters (a, b, c, α, β, γ)', 'Plane Pairs (h1 k1 l1) & (h2 k2 l2)'],
        outputs: ['Direct & Reciprocal Metric Tensors', 'Interplanar Angle φ', 'Cell Volume V'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'جبر تانسوری کامل برای تمام ۷ سیستم بلوری جهت محاسبه فواصل، حجم، ضرب خارجی بردارها و زوایای بین صفحات.'
          : 'Full tensor algebra suite calculating direct/reciprocal metric tensors, interplanar angles, and zone axis relations.',
        suggestedNext: ['supercell_transform', 'selection', 'cohen']
      },
      {
        id: 'supercell_transform',
        label: t('Supercell & Matrix Engine', 'Supercell & Matrix Engine'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'ماتریس‌های تبدیل سلول واحد و ابرسلول‌های بلوری' : 'Real space unit cell transformation & Bravais lattice conversions',
        formula: "[a' b' c'] = [a b c]·M",
        tags: ['Supercell', 'Transformation', 'Matrix', 'Lattice Vectors', 'DFT', 'Bravais'],
        icon: <Grid className={`${defaultIconClass} text-violet-400`} />,
        inputs: ['Original Cell Parameters', 'Transformation Matrix M (3x3)'],
        outputs: ['Transformed Cell Parameters', 'Determinant det(M)', 'New Fractional Coordinates'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'تبدیل ماتریسی ابعاد شبکه برای ساخت ابرسلول‌های محاسبات DFT، تبدیل هگزاگونال به رومبوهدرال و تغییر مبدا.'
          : 'Calculates 3x3 transformation matrices for supercells, primitive-to-conventional conversions, and DFT modeling.',
        suggestedNext: ['cohen', 'pawley_lebail']
      },
      {
        id: 'pawley_lebail',
        label: t('Pawley & Le Bail Fitting', 'Pawley & Le Bail Fitting'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'تجزیه کامل الگوی پراکندگی بدون نیاز به مدل ساختاری' : 'Whole powder pattern decomposition without structural model',
        formula: 'I_hkl extraction',
        tags: ['Pawley', 'Le Bail', 'Decomposition', 'Intensity Fitting', 'Profile Matching'],
        icon: <Activity className={`${defaultIconClass} text-fuchsia-400`} />,
        inputs: ['Powder Scan', 'Cell Parameters & Space Group'],
        outputs: ['Extracted Integrated Intensities |F_hkl|²', 'Peak Overlap Deconvolution', 'R_p & R_wp Factors'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'استخراج تجربی شدت‌های منفرد برای حل ساختارهای مجهول بلوری بدون داشتن موقعیت‌های اتمی.'
          : 'Extracts structural factors and individual reflection intensities without an initial atomic model, ideal for ab initio indexing.',
        suggestedNext: ['rietveld', 'rir']
      },
      {
        id: 'rir',
        label: t('Reference Intensity Ratio (RIR)', 'Reference Intensity Ratio (RIR)'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'تحلیل نیمه‌کمی فراوانی فازها با استاندارد کوندوم (I/I_c)' : 'Semi-quantitative phase abundance relative to corundum standard',
        formula: 'X_A = (I_A / RIR_A) / Σ(I_i / RIR_i)',
        tags: ['RIR', 'Quantitative', 'Corundum', 'Phase Abundance', 'Multi-Phase', 'Weight Fraction'],
        icon: <Layers className={`${defaultIconClass} text-pink-400`} />,
        inputs: ['Identified Phases', '100% Peak Intensities', 'ICDD RIR Constants (I/I_corundum)'],
        outputs: ['Weight Percentage wt% per Phase', 'Phase Abundance Chart'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'تعیین سریع کسر وزنی فازهای موجود در مخلوط‌های چندفازی با استفاده از نسبت شدت استاندارد کوراندوم.'
          : 'Calculates weight percentages in multiphase mineral mixtures using relative corundum scale factors (I/I_c).',
        suggestedNext: ['compare', 'rietveld', 'dl']
      },

      // Category 4: Rietveld & Quantum Sim
      {
        id: 'rietveld',
        label: t('Rietveld Full Profile Setup', 'Rietveld Setup'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'پالایش ساختار بلوری، مختصات اتمی و شاخص‌های R_wp، χ²' : 'Crystal structure refinement, atomic positions & fit quality R_wp',
        formula: 'S(y) = Σ w_i (y_o - y_c)²',
        tags: ['Rietveld', 'Refinement', 'Atomic Coordinates', 'Rwp', 'Chi2', 'Background', 'Occupancy'],
        icon: <Sliders className={`${defaultIconClass} text-amber-400`} />,
        inputs: ['Experimental Profile y_o', 'Structural Model CIF', 'Instrument Profile Parameters (U, V, W)'],
        outputs: ['Calculated Pattern y_c', 'Difference Curve (y_o - y_c)', 'R_wp, R_exp, GOF (χ²)', 'Refined Atom Sites'],
        complexity: 'Expert',
        descriptionDetail: isRTL
          ? 'پالایش کامل پروفایل ریتولد برای تعیین دقیق ساختار سه‌بعدی اتمی، ضرایب اشغال، کرنش ناهمسانگرد و درصد فازی.'
          : 'Full-profile whole pattern least-squares refinement modeling atomic coordinates, thermal factors, and instrument geometry.',
        suggestedNext: ['neutron', 'magnetic', 'python_export']
      },
      {
        id: 'neutron',
        label: t('Neutron Diffraction Physics', 'Neutron Diffraction'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'طول پراکندگی هسته‌ای b_i و ردیابی عناصر سبک (H, Li, O)' : 'Nuclear scattering length b_i & light element localization',
        formula: 'b_coherent & b_incoherent',
        tags: ['Neutron', 'Nuclear Scattering', 'Light Elements', 'Isotopes', 'Hydrogen', 'Lithium'],
        icon: <Orbit className={`${defaultIconClass} text-orange-400`} />,
        inputs: ['Atomic Compositions & Isotopic Ratios', 'Thermal Neutron Wavelength (λ ~ 1.5 Å)'],
        outputs: ['Nuclear Structure Factor F_nuc', 'Scattering Length Density', 'Isotope Contrast Factor'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'پراکندگی نوترونی برای تشخیص موقعیت اتم‌های بسیار سبک نظیر هیدروژن و لیتیوم که در اشعه ایکس نامرئی هستند.'
          : 'Nuclear scattering physics utilizing Fermi scattering lengths b_i to localize light atoms in battery and biological materials.',
        suggestedNext: ['magnetic', 'rietveld']
      },
      {
        id: 'magnetic',
        label: t('Magnetic Neutron Scattering', 'Magnetic Neutron Scattering'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'فاکتور فرم مغناطیسی، آرایش اسپین‌ها و تقارن سلول مغناطیسی' : 'Magnetic form factor f(Q), spin structure & magnetic space groups',
        formula: 'F_mag(Q) = (r₀γ/2) μ_f f_m(Q)',
        tags: ['Magnetic', 'Spin Structure', 'Form Factor', 'Antiferromagnetic', 'Superlattice', 'Magnetic Moment'],
        icon: <Magnet className={`${defaultIconClass} text-red-400`} />,
        inputs: ['Magnetic Cations (Fe, Co, Ni, Mn, Rare Earths)', 'Spin Orientation Vector S_j'],
        outputs: ['Magnetic Form Factor f_mag(Q)', 'Magnetic Superlattice Peaks', 'Effective Moment μ_eff'],
        complexity: 'Expert',
        descriptionDetail: isRTL
          ? 'محاسبه پیک‌های فرعی مغناطیسی در ساختارهای آنتی‌فرومغناطیس، فریمغناطیس و امواج چگالی اسپین.'
          : 'Calculates magnetic interaction vectors and magnetic structure factors for spin-ordered topological materials.',
        suggestedNext: ['neutron', 'rietveld']
      },
      {
        id: 'python_export',
        label: t('Python Script Generator', 'Python Generator'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'تولید خودکار کدهای پایتون SciPy و DiffPy برای محاسبات پیشرفته' : 'Automated SciPy / DiffPy script generation for custom analysis',
        formula: 'import scipy.optimize',
        tags: ['Python', 'Automation', 'SciPy', 'Scripting', 'DiffPy', 'Jupyter', 'Export'],
        icon: <Terminal className={`${defaultIconClass} text-emerald-400`} />,
        inputs: ['Current Session Analysis Parameters & Data Arrays'],
        outputs: ['Executable Python (.py) Script', 'Jupyter Notebook (.ipynb) Ready Code', 'Standalone Scipy Models'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'تولید کدهای استاندارد پایتون آماده اجرا برای بازتولید محاسبات در محیط‌های علمی یا پردازش دسته‌ای.'
          : 'Generates publication-grade, self-contained Python scripts for reproducible automated data fitting in Jupyter notebooks.',
        suggestedNext: ['learn', 'settings']
      },

      // Category 5: AI & Neural Intelligence
      {
        id: 'dl',
        label: t('PhaseID Neural Classifier', 'PhaseID Neural Net'),
        category: t('AI & Neural Intelligence', 'AI & Neural Intelligence'),
        categoryIcon: <Brain className="w-4 h-4 text-violet-400" />,
        subtitle: isRTL ? 'تشخیص فازهای بلوری با هوش مصنوعی و یادگیری عمیق' : 'AI deep learning for rapid multiphase pattern identification',
        formula: 'CNN Peak Classifier',
        tags: ['AI', 'Neural Net', 'PhaseID', 'Pattern Recognition', 'Deep Learning', 'Computer Vision'],
        icon: <Brain className={`${defaultIconClass} text-violet-400`} />,
        inputs: ['Raw XRD Spectrum (1D Array 10°-90° 2θ)'],
        outputs: ['Top 5 Ranked Phase Candidates', 'Confidence Scores (%)', 'Phase Matching Heatmap'],
        complexity: 'Intermediate',
        descriptionDetail: isRTL
          ? 'شبکه عصبی کانولوشنی آموزش‌دیده روی بیش از ۱۰۰ هزار الگوی بلوری برای شناسایی آنی فازهای معدنی و سنتزی.'
          : 'Deep convolutional neural network trained on crystallographic databases for rapid single- and multi-phase classification.',
        suggestedNext: ['compare', 'rir', 'image_analysis']
      },
      {
        id: 'image_analysis',
        label: t('2D Detector & Ring Integrator', 'Image Analysis'),
        category: t('AI & Neural Intelligence', 'AI & Neural Intelligence'),
        categoryIcon: <Brain className="w-4 h-4 text-violet-400" />,
        subtitle: isRTL ? 'انتگرال‌گیری از حلقه‌های دبی-شرر در دتکتورهای دو بعدی' : 'Debye-Scherrer ring azimuth integration & 2D detector processing',
        formula: 'I(2θ, χ) Azimuthal Integration',
        tags: ['2D Detector', 'Debye-Scherrer', 'Texture', 'Ring Integration', 'Azimuthal', 'Diffraction Rings'],
        icon: <ImageIcon className={`${defaultIconClass} text-pink-400`} />,
        inputs: ['2D Detector Image (.tif, .png, .mar)', 'Beam Center (x_0, y_0) & Sample-to-Detector Distance'],
        outputs: ['1D Diffractogram I(2θ)', 'Caking Map (2θ vs χ)', 'Texture Pole Ellipse'],
        complexity: 'Advanced',
        descriptionDetail: isRTL
          ? 'پردازش و تبدیل تصاویر خام دتکتورهای دو بعدی به الگوهای پراش یک بعدی با تصحیح مرکز تابش و زاویه آزیموت.'
          : 'Integrates 2D area detector Debye-Scherrer rings into 1D diffractograms with beam center calibration and masking.',
        suggestedNext: ['dl', 'image_gen', 'preferred_orientation']
      },
      {
        id: 'image_gen',
        label: t('Scientific Illustrator AI', 'Scientific Illustrator'),
        category: t('AI & Neural Intelligence', 'AI & Neural Intelligence'),
        categoryIcon: <Brain className="w-4 h-4 text-violet-400" />,
        subtitle: isRTL ? 'تصویرسازی سه‌بعدی علمی برای مقالات و ارائه‌ها' : 'AI crystallographic 3D crystal schematic & diagram generator',
        formula: 'Diffusion Visualizer',
        tags: ['Illustrator', '3D Crystal', 'Diagrams', 'Publications', 'Figures', 'Nanomaterials'],
        icon: <Sparkles className={`${defaultIconClass} text-purple-300`} />,
        inputs: ['Crystal Structure Prompt or Selected Module Output'],
        outputs: ['High-resolution 3D Scientific Renderings', 'Vector Schematics', 'Publication-grade Figures'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'تولید تصاویر شماتیک سه‌بعدی بلورها و تنظیمات آزمایشگاهی مناسب برای چاپ در ژورنال‌ها و ارائه‌های علمی.'
          : 'Creates high-definition 3D crystal schematics, laboratory beamlines, and nanomaterial representations for journals.',
        suggestedNext: ['learn', 'profile']
      },

      // Category 6: Databases & Lab Utilities
      {
        id: 'periodic_table',
        label: t('Interactive Periodic Table', 'Periodic Table'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'لبه‌های جذب اشعه ایکس (K_α, K_β) و فاکتور پراکندگی اتمی f(Q)' : 'X-ray absorption edges (K_α, K_β) & atomic scattering factors f(Q)',
        formula: 'Z, f₀(s), μ/ρ',
        tags: ['Periodic Table', 'X-ray Edges', 'Scattering Factors', 'Elements', 'Cromer-Mann', 'Attenuation'],
        icon: <Grid className={`${defaultIconClass} text-cyan-300`} />,
        inputs: ['Atomic Number Z or Chemical Symbol'],
        outputs: ['Emission Lines (Kα1, Kα2, Kβ, Lα)', 'Cromer-Mann 9-parameter Coefficients', 'Mass Attenuation Coefficient μ/ρ'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'جدول تناوبی جامع متمرکز بر فیزیک اشعه ایکس، انرژی خطوط نشری، لبه‌های جذب و فاکتورهای فرم اتمی کرومر-من.'
          : 'Interactive element registry providing X-ray emission lines, edge absorption energies, and Cromer-Mann form factor coefficients.',
        suggestedNext: ['database', 'bragg']
      },
      {
        id: 'database',
        label: t('Crystallographic Material Registry', 'Material Registry'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'پایگاه داده فازهای معدنی، فایل‌های CIF و استانداردهای آزمایشگاهی' : 'Searchable CIF standards, inorganic phases & Bragg database',
        formula: 'ICSD / CIF Database',
        tags: ['CIF', 'Standards', 'Materials', 'ICSD', 'Silicon', 'Gold', 'Perovskites', 'Metals'],
        icon: <Database className={`${defaultIconClass} text-indigo-300`} />,
        inputs: ['Material Name / Formula / Space Group'],
        outputs: ['Complete CIF File', 'Benchmark Theoretical Peaks', 'Atomic Fractional Coordinates'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'مجموعه معتبر استانداردهای بلوری کالیبراسیون و فازهای پرکاربرد سرامیکی، فلزی، اکسیدی و کوانتومی.'
          : 'Extensive library of verified standard CIF structures and reference peak profiles for instant calibration and lookup.',
        suggestedNext: ['compare', 'selection', 'rietveld']
      },
      {
        id: 'learn',
        label: t('Protocol & Theory Manual', 'Protocol Guide'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'کتاب راهنمای ریاضی و تئوری پراکندگی اشعه ایکس' : 'Interactive crystallographic textbook, derivations & lab protocols',
        formula: 'Book of Crystallography',
        tags: ['Theory', 'Textbook', 'Protocols', 'Derivations', 'Formulas', 'Tutorials'],
        icon: <BookOpen className={`${defaultIconClass} text-amber-300`} />,
        inputs: ['Topic of interest / Method name'],
        outputs: ['Mathematical Proofs', 'Step-by-step Standard Operating Procedures (SOP)', 'Interactive Demonstrations'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'مرجع آموزشی جامع حاوی اثبات‌های ریاضی فرمول‌ها، شیوه‌نامه‌های آماده‌سازی نمونه و راهنماهای گام به گام.'
          : 'Interactive academic textbook containing deep mathematical derivations, experimental SOPs, and troubleshooting guides.',
        suggestedNext: ['bragg', 'scherrer', 'rietveld']
      },
      {
        id: 'profile',
        label: t('Laboratory Director Profile', 'Laboratory Director'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'رزومه پژوهشی، پرونده علمی و مجوزهای گره ابری' : 'Investigator credentials, publications & cloud node identity',
        formula: 'L-5 Director Node',
        tags: ['Profile', 'Researcher', 'Credentials', 'Node', 'Lab', 'Auth'],
        icon: <User className={`${defaultIconClass} text-emerald-400`} />,
        inputs: ['User Account Credentials'],
        outputs: ['Verified Cloud Sync State', 'Scientist Metadata', 'Saved Experiment Archives'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'پروفایل مدیر آزمایشگاه، مدیریت گواهی‌های اعتبارسنجی ابری و سوابق پروژه‌های تحقیقاتی.'
          : 'Researcher identity portal, credentials, cloud synchronization status, and laboratory session manager.',
        suggestedNext: ['settings', 'database']
      },
      {
        id: 'settings',
        label: t('System & Calibration Settings', 'Settings'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'کالیبراسیون زاویه صفر، شعاع گونیومتر و تنظیمات واحدها' : 'Wavelength calibration, zero offsets, unit preferences & theme',
        formula: 'Zero Shift & Calibration',
        tags: ['Settings', 'Calibration', 'Units', 'Theme', 'Instrument', 'Zero Offset'],
        icon: <Settings2 className={`${defaultIconClass} text-slate-300`} />,
        inputs: ['Instrument Geometry (Radius, Slits)', 'Preferred Units (° / rad / nm / Å)'],
        outputs: ['Global Application Calibration State', 'Theme Configuration'],
        complexity: 'Beginner',
        descriptionDetail: isRTL
          ? 'تنظیمات سراسری نرم‌افزار، کالیبراسیون انحراف صفر گونیومتر، تم‌های بصری و مدیریت داده‌های محلی.'
          : 'Global instrument parameters, default tube anode wavelengths, precision decimal rounding, and visual interface themes.',
        suggestedNext: ['bragg', 'profile']
      }
    ];
  }, [t, isRTL]);

  // Curated Research Pathways / Guided Workflows
  const researchPathways = useMemo<ResearchPathway[]>(() => [
    {
      id: 'size-strain',
      title: 'Nanomaterial Size & Microstrain Analysis',
      titleFa: 'تحلیل اندازه بلورک و کرنش نانومواد',
      description: 'Progress from basic Scherrer domain sizing to full Williamson-Hall and Warren-Averbach dislocation mapping.',
      descriptionFa: 'شروع از تخمین اولیه شرر تا تفکیک پیشرفته ویلیامسون-هال و توزیع فوریه وارن-اورباخ.',
      icon: <Microscope className="w-4 h-4 text-emerald-400" />,
      moduleIds: ['scherrer', 'wh', 'monshi_scherrer', 'double_voigt', 'wa'],
      tag: 'Size & Strain',
      color: 'from-emerald-600 to-teal-500'
    },
    {
      id: 'lattice-refinement',
      title: 'Unit Cell & Lattice Parameter Precision',
      titleFa: 'پالایش دقیق ابعاد شبکه و تانسور هندسی',
      description: 'Refine lattice constants via least-squares Cohen matrix, calculate metric tensors, and explore supercells.',
      descriptionFa: 'پالایش دقیق پارامترهای شبکه با روش کوهن و جبر تانسور فضای معکوس.',
      icon: <Grid className="w-4 h-4 text-purple-400" />,
      moduleIds: ['cohen', 'metric_tensor', 'selection', 'supercell_transform'],
      tag: 'Lattice & Symmetry',
      color: 'from-purple-600 to-indigo-500'
    },
    {
      id: 'thin-films',
      title: 'Thin Films, Coatings & Residual Stresses',
      titleFa: 'لایه‌های نازک، بازتاب‌سنجی و تنش‌های پسماند',
      description: 'Model nanometer layer thickness with XRR, correct crystallite texture, and quantify residual stress tensors.',
      descriptionFa: 'محاسبه ضخامت با بازتاب‌سنجی XRR، اصلاح بافت ترجیحی و سنجش تنش‌های پسماند.',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      moduleIds: ['xrr', 'preferred_orientation', 'residual_stress'],
      tag: 'Surfaces & Films',
      color: 'from-amber-600 to-orange-500'
    },
    {
      id: 'phase-id-quant',
      title: 'Multiphase ID & Quantitative Composition',
      titleFa: 'شناسایی فاز و تعیین کمی درصدهای وزنی',
      description: 'Rapid AI deep learning classification, spectral overlay, RIR corundum ratios, and full Rietveld refinement.',
      descriptionFa: 'تشخیص فاز با هوش مصنوعی، انطباق طیفی و پالایش کامل ریتولد.',
      icon: <Brain className="w-4 h-4 text-pink-400" />,
      moduleIds: ['dl', 'compare', 'rir', 'pawley_lebail', 'rietveld'],
      tag: 'Quantitative Phase',
      color: 'from-pink-600 to-rose-500'
    },
    {
      id: 'quantum-scattering',
      title: 'Neutron & Magnetic Spin Ordering',
      titleFa: 'پراکندگی نوترونی و ساختارهای اسپینی',
      description: 'Locate light elements (H, Li) via nuclear scattering lengths and determine magnetic moment vectors.',
      descriptionFa: 'ردیابی عناصر سبک (H, Li) و ساختارهای مغناطیسی با فاکتورهای فرم اسپین.',
      icon: <Magnet className="w-4 h-4 text-cyan-400" />,
      moduleIds: ['neutron', 'magnetic', 'rietveld'],
      tag: 'Quantum Physics',
      color: 'from-cyan-600 to-blue-500'
    }
  ], []);

  // Category List
  const categories = useMemo(() => {
    const rawCats = Array.from(new Set(moduleList.map(m => m.category)));
    return ['All', '⭐ Favorites', '🕒 Recent', '🎯 Pathways', ...rawCats];
  }, [moduleList]);

  // Filtered & Sorted Modules
  const filteredModules = useMemo(() => {
    let list = [...moduleList];

    // Pathway Filter
    if (selectedPathway) {
      const pathway = researchPathways.find(p => p.id === selectedPathway);
      if (pathway) {
        list = list.filter(m => pathway.moduleIds.includes(m.id));
      }
    } else if (selectedCategory === '⭐ Favorites') {
      list = list.filter(m => favorites.includes(m.id));
    } else if (selectedCategory === '🕒 Recent') {
      list = recents.map(id => moduleList.find(m => m.id === id)).filter(Boolean) as ModuleMetadata[];
    } else if (selectedCategory !== 'All' && selectedCategory !== '🎯 Pathways') {
      list = list.filter(m => m.category === selectedCategory);
    }

    // Search Query Filtering
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(m => {
        return (
          m.label.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.formula && m.formula.toLowerCase().includes(q)) ||
          m.tags.some(tag => tag.toLowerCase().includes(q)) ||
          (m.descriptionDetail && m.descriptionDetail.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    if (sortBy === 'alpha') {
      list.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortBy === 'complexity') {
      const order = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
      list.sort((a, b) => (order[a.complexity || 'Beginner'] || 1) - (order[b.complexity || 'Beginner'] || 1));
    }

    return list;
  }, [moduleList, selectedCategory, selectedPathway, researchPathways, favorites, recents, searchQuery, sortBy]);

  // Selected Inspected Module Object
  const currentInspectedModule = useMemo(() => {
    return moduleList.find(m => m.id === inspectedModuleId) || moduleList.find(m => m.id === activeModule) || moduleList[0];
  }, [moduleList, inspectedModuleId, activeModule]);

  // Keyboard navigation handler (Arrows, Enter, Escape, Numbers)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Quick search focus on '/'
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Enter to select focused
      if (e.key === 'Enter') {
        if (filteredModules[focusedIndex]) {
          const mod = filteredModules[focusedIndex];
          recordRecent(mod.id);
          onSelectModule(mod.id);
          onClose();
        }
        return;
      }

      // Arrow navigation
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (filteredModules.length === 0) return;
        e.preventDefault();

        setFocusedIndex(prev => {
          let next = prev;
          if (e.key === 'ArrowDown') next = Math.min(prev + (viewMode === 'compact' ? 1 : 3), filteredModules.length - 1);
          if (e.key === 'ArrowUp') next = Math.max(prev - (viewMode === 'compact' ? 1 : 3), 0);
          if (e.key === 'ArrowRight') next = isRTL ? Math.max(prev - 1, 0) : Math.min(prev + 1, filteredModules.length - 1);
          if (e.key === 'ArrowLeft') next = isRTL ? Math.min(prev + 1, filteredModules.length - 1) : Math.max(prev - 1, 0);

          const targetMod = filteredModules[next];
          if (targetMod) setInspectedModuleId(targetMod.id);
          return next;
        });
      }

      // 'F' key toggles favorite on active focused module
      if ((e.key === 'f' || e.key === 'F') && document.activeElement !== searchInputRef.current) {
        if (filteredModules[focusedIndex]) {
          toggleFavorite(filteredModules[focusedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredModules, focusedIndex, viewMode, isRTL, onSelectModule, recordRecent, toggleFavorite]);

  // Keep focusedIndex in bounds when filtered list changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery, selectedCategory, selectedPathway]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setInspectedModuleId(activeModule);
    }
  }, [isOpen, activeModule]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="scientific-suite-navigator-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Backdrop overlay with luxury ambient glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`absolute inset-0 backdrop-blur-2xl transition-all ${
            theme === 'cyberpunk' 
              ? 'bg-black/90' 
              : theme === 'dark' 
                ? 'bg-[#050A18]/85' 
                : 'bg-slate-900/60'
          }`}
        >
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        </motion.div>

        {/* Main Modal Shell */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-7xl h-[92vh] max-h-[950px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-10 backdrop-blur-3xl ${
            theme === 'cyberpunk'
              ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_80px_rgba(0,255,255,0.25)]'
              : theme === 'dark'
                ? 'bg-[#0B1228]/95 border-indigo-500/25 text-white shadow-[0_0_70px_rgba(15,23,42,0.9)]'
                : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-2xl shadow-indigo-500/15'
          }`}
        >
          {/* Subtle Ambient Grid Texture */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.035]" 
            style={{ 
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', 
              backgroundSize: '28px 28px' 
            }} 
          />

          {/* Corner Precision Instrument Accents */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-indigo-500/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-indigo-500/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-indigo-500/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-indigo-500/60 pointer-events-none" />

          {/* TOP HEADER BAR */}
          <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-10 ${
            theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black/80' : theme === 'dark' ? 'border-white/10 bg-[#070C18]/90' : 'border-slate-200/80 bg-slate-50/90'
          }`}>
            {/* Title & Badge */}
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl p-0.5 shadow-xl flex items-center justify-center shrink-0 ${
                theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 shadow-indigo-500/30'
              }`}>
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  theme === 'cyberpunk' ? 'bg-black' : 'bg-[#070C18]'
                }`}>
                  <Atom className={`w-6 h-6 animate-spin-slow ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-cyan-400'}`} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-indigo-400 dark:text-indigo-300">
                    [NAV-SUITE-PRO] • UNIVERSAL COMMAND HUB
                  </span>
                </div>
                <h3 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 ${
                  theme === 'cyberpunk' ? 'text-cyber-accent' : theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>{isRTL ? 'ناوبری جامع ماژول‌های علمی' : 'Scientific Suite Navigator'}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    theme === 'cyberpunk' ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent' : 'bg-indigo-500/10 border-indigo-400/30 text-indigo-400 dark:text-indigo-300'
                  }`}>
                    {moduleList.length} Engines
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick Actions, View Mode Toggles & Close */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sort Dropdown */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
                <SlidersVertical className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all outline-none cursor-pointer ${
                    theme === 'cyberpunk'
                      ? 'bg-black border-cyber-accent/40 text-cyber-accent'
                      : theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-slate-300'
                        : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <option value="default">{isRTL ? 'ترتیب پیش‌فرض' : 'Default Order'}</option>
                  <option value="alpha">{isRTL ? 'الفبایی (A-Z)' : 'Alphabetical (A-Z)'}</option>
                  <option value="complexity">{isRTL ? 'بر اساس سطح سختی' : 'By Complexity'}</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className={`flex items-center p-1 rounded-xl border ${
                theme === 'cyberpunk' ? 'bg-black border-cyber-accent/40' : theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? (theme === 'cyberpunk' ? 'bg-cyber-accent text-black font-bold' : 'bg-indigo-600 text-white shadow-sm')
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={isRTL ? 'نمای کارت‌های بزرگ' : 'Grid View'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'compact' 
                      ? (theme === 'cyberpunk' ? 'bg-cyber-accent text-black font-bold' : 'bg-indigo-600 text-white shadow-sm')
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={isRTL ? 'نمای فشرده و متراکم' : 'Compact List View'}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`p-1.5 rounded-lg transition-all hidden lg:block ${
                    viewMode === 'split' 
                      ? (theme === 'cyberpunk' ? 'bg-cyber-accent text-black font-bold' : 'bg-indigo-600 text-white shadow-sm')
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={isRTL ? 'نمای تفکیکی با پیش‌نمایش' : 'Split Inspector View'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Keyboard Shortcut Indicator */}
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono ${
                theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent/70' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}>
                <Command className={`w-3.5 h-3.5 ${theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-400'}`} />
                <span>Esc {isRTL ? 'خروج' : 'exit'}</span>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                  theme === 'cyberpunk' 
                    ? 'bg-black border-cyber-accent text-cyber-accent hover:bg-cyber-pink hover:text-black hover:border-cyber-pink' 
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500'
                }`}
                title="Close navigator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SEARCH BAR & QUICK FILTERS */}
          <div className={`p-4 sm:p-5 border-b space-y-3.5 shrink-0 relative z-10 ${
            theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black' : theme === 'dark' ? 'border-white/10 bg-[#070C18]/60' : 'border-slate-200/60 bg-slate-50/50'
          }`}>
            {/* Search Input Box */}
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-indigo-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedPathway(null);
                }}
                placeholder={isRTL ? 'جستجوی ماژول، فرمول، کاربرد یا کلیدواژه (مثلا Scherrer, Rietveld, Strain, XRR, HKL, CIF, AI)...' : 'Search modules, formulas, acronyms or research questions (e.g. Scherrer, Williamson-Hall, XRR, Rietveld, HKL, CIF, AI)...'}
                className={`w-full pl-12 pr-28 py-3.5 border rounded-2xl text-sm font-medium outline-none transition-all shadow-inner ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent/50 focus:border-cyber-accent text-cyber-accent placeholder-cyber-accent/50'
                    : theme === 'dark'
                      ? 'bg-black/40 border-white/15 focus:border-indigo-500 text-white placeholder-slate-400'
                      : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`p-1 rounded-lg transition-colors ${
                      theme === 'cyberpunk' ? 'text-cyber-accent hover:bg-cyber-accent/20' : theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border hidden sm:inline-block ${
                    theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30 text-cyber-accent/60' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {filteredModules.length} matches • [/]
                  </span>
                )}
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar scrollbar-none">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat && !selectedPathway;
                let count = 0;
                if (cat === 'All') count = moduleList.length;
                else if (cat === '⭐ Favorites') count = favorites.length;
                else if (cat === '🕒 Recent') count = recents.length;
                else if (cat === '🎯 Pathways') count = researchPathways.length;
                else count = moduleList.filter(m => m.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedPathway(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? theme === 'cyberpunk'
                          ? 'bg-cyber-accent text-black border-cyber-accent shadow-[0_0_15px_rgba(0,255,255,0.4)] font-mono'
                          : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 text-white border-indigo-400 shadow-md shadow-indigo-500/25 font-mono'
                        : theme === 'cyberpunk'
                          ? 'bg-black hover:bg-cyber-accent/10 text-cyber-accent/70 border-cyber-accent/30 hover:border-cyber-accent/70 font-mono'
                          : theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-white/20'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {cat === 'All' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    {cat === '⭐ Favorites' && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    {cat === '🕒 Recent' && <History className="w-3.5 h-3.5 text-cyan-400" />}
                    {cat === '🎯 Pathways' && <Target className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{cat === 'All' ? (isRTL ? 'همه ماژول‌ها' : 'All Modules') : cat}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                      isSelected 
                        ? (theme === 'cyberpunk' ? 'bg-black/30 text-black' : 'bg-white/20 text-white')
                        : (theme === 'cyberpunk' ? 'bg-cyber-accent/10 text-cyber-accent' : 'bg-white/10 text-slate-400')
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Research Pathways Bar (When Pathways Tab is active or no search) */}
            {selectedCategory === '🎯 Pathways' && (
              <div className="pt-2 border-t border-slate-700/30">
                <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isRTL ? 'مسیرهای پژوهشی هدف‌محور:' : 'Goal-Oriented Research Pathways:'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {researchPathways.map((pw) => {
                    const isPwActive = selectedPathway === pw.id;
                    return (
                      <div
                        key={pw.id}
                        onClick={() => setSelectedPathway(isPwActive ? null : pw.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isPwActive
                            ? 'bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-500'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40">
                              {pw.icon}
                            </div>
                            <h5 className="text-xs font-bold text-white truncate">{isRTL ? pw.titleFa : pw.title}</h5>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            {pw.moduleIds.length} tools
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                          {isRTL ? pw.descriptionFa : pw.description}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {pw.moduleIds.map(mid => (
                            <span key={mid} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-white/5">
                              {mid}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTENT WORKSPACE: LIST / GRID + SPLIT INSPECTOR */}
          <div className="flex-1 flex overflow-hidden relative z-10">
            {/* Left / Center: Modules Grid & List */}
            <div 
              ref={cardContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-6"
            >
              {filteredModules.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto ${
                    theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <Search className="w-8 h-8" />
                  </div>
                  <h4 className={`text-base font-bold ${theme === 'cyberpunk' ? 'text-cyber-accent' : theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>
                    {isRTL ? 'هیچ ماژولی با این مشخصات یافت نشد' : 'No matching scientific modules found'}
                  </h4>
                  <p className="text-xs max-w-sm mx-auto text-slate-400">
                    {isRTL ? 'عبارت جستجو را تغییر دهید یا فیلتر دسته‌بندی را پاک کنید.' : 'Try searching for generic terms like "Strain", "Size", "Profile", or clear category filters.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedPathway(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
                  >
                    {isRTL ? 'پاکسازی فیلترها' : 'Reset All Filters'}
                  </button>
                </div>
              ) : (
                <div className={
                  viewMode === 'compact' 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-2" 
                    : viewMode === 'split'
                      ? "grid grid-cols-1 md:grid-cols-2 gap-3"
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
                }>
                  {filteredModules.map((m, idx) => {
                    const isKeyboardFocused = idx === focusedIndex;
                    const isFavorite = favorites.includes(m.id);
                    const isInspected = inspectedModuleId === m.id;
                    const isActive = activeModule === m.id;

                    return (
                      <ModuleCard
                        key={m.id}
                        metadata={m}
                        isActive={isActive}
                        isFavorite={isFavorite}
                        isFocused={isKeyboardFocused}
                        isInspected={isInspected}
                        viewMode={viewMode}
                        theme={theme}
                        isRTL={isRTL}
                        onSelect={() => {
                          recordRecent(m.id);
                          onSelectModule(m.id);
                          onClose();
                        }}
                        onInspect={() => setInspectedModuleId(m.id)}
                        onToggleFavorite={(e) => toggleFavorite(m.id, e)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Quick Inspector Preview Drawer (Active in Split mode or toggleable) */}
            {viewMode === 'split' && currentInspectedModule && (
              <div className={`w-80 lg:w-96 border-l p-5 overflow-y-auto shrink-0 hidden md:flex flex-col justify-between custom-scrollbar ${
                theme === 'cyberpunk' 
                  ? 'bg-black/90 border-cyber-accent/30 text-cyber-accent' 
                  : theme === 'dark' 
                    ? 'bg-[#070C18]/90 border-white/10 text-white' 
                    : 'bg-slate-50/90 border-slate-200 text-slate-900'
              }`}>
                <div className="space-y-4">
                  {/* Top Header of Inspector */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400">
                        {currentInspectedModule.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                          {currentInspectedModule.category}
                        </span>
                        <h4 className="text-sm font-black tracking-tight">{currentInspectedModule.label}</h4>
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(currentInspectedModule.id, e)}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-amber-400"
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(currentInspectedModule.id) ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Complexity Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">Complexity:</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      currentInspectedModule.complexity === 'Beginner'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : currentInspectedModule.complexity === 'Intermediate'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : currentInspectedModule.complexity === 'Advanced'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {currentInspectedModule.complexity || 'Intermediate'}
                    </span>
                  </div>

                  {/* Mathematical Formula Banner */}
                  {currentInspectedModule.formula && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center font-mono">
                      <span className="text-[10px] text-slate-400 block mb-1">Governing Equation</span>
                      <span className="text-xs font-bold text-cyan-300 tracking-wider">
                        {currentInspectedModule.formula}
                      </span>
                    </div>
                  )}

                  {/* Detailed Description */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Theory & Scope</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentInspectedModule.descriptionDetail || currentInspectedModule.subtitle}
                    </p>
                  </div>

                  {/* Expected Inputs */}
                  {currentInspectedModule.inputs && currentInspectedModule.inputs.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Input Parameters</span>
                      <div className="space-y-1">
                        {currentInspectedModule.inputs.map((inp, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>{inp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected Outputs */}
                  {currentInspectedModule.outputs && currentInspectedModule.outputs.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Scientific Outputs</span>
                      <div className="space-y-1">
                        {currentInspectedModule.outputs.map((out, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{out}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Companion Modules */}
                  {currentInspectedModule.suggestedNext && currentInspectedModule.suggestedNext.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">Companion Tools</span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentInspectedModule.suggestedNext.map(nid => (
                          <button
                            key={nid}
                            onClick={() => {
                              recordRecent(nid);
                              onSelectModule(nid);
                              onClose();
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/5 hover:bg-indigo-600 hover:text-white border border-white/10 transition-colors"
                          >
                            → {nid}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Launch Button */}
                <div className="pt-4 border-t border-white/10 mt-4">
                  <button
                    onClick={() => {
                      recordRecent(currentInspectedModule.id);
                      onSelectModule(currentInspectedModule.id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isRTL ? 'ورود به این ماژول' : 'Launch Workspace'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER BAR WITH WORKFLOW HINTS & STATUS */}
          <div className={`p-3.5 px-5 border-t flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 relative z-10 ${
            theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black text-cyber-accent/70' : theme === 'dark' ? 'border-white/10 bg-[#070C18]/90 text-slate-400' : 'border-slate-200/80 bg-slate-50/90 text-slate-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/30 border border-white/15 text-slate-300">↑↓</kbd>
                <span className="text-[11px]">{isRTL ? 'جابجایی' : 'Navigate'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/30 border border-white/15 text-slate-300">Enter</kbd>
                <span className="text-[11px]">{isRTL ? 'انتخاب' : 'Select'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/30 border border-white/15 text-slate-300">F</kbd>
                <span className="text-[11px]">{isRTL ? 'علاقه‌مندی' : 'Star Favorite'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>XRD-Calc Pro • Scientific Suite Engine v4.8</span>
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
  viewMode: 'grid' | 'compact' | 'split';
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
        className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer group relative flex items-center justify-between gap-3 backdrop-blur-md ${
          isActive
            ? theme === 'cyberpunk'
              ? 'bg-black border-cyber-pink shadow-[0_0_20px_rgba(255,0,255,0.3)] ring-1 ring-cyber-pink'
              : theme === 'dark'
                ? 'bg-indigo-950/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/60'
                : 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
            : isFocused
              ? 'bg-indigo-900/30 border-indigo-400 ring-2 ring-indigo-400/50 scale-[1.01]'
              : theme === 'cyberpunk'
                ? 'bg-black/80 hover:bg-cyber-accent/10 border-cyber-accent/30 hover:border-cyber-accent/70'
                : theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-indigo-500/40'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl border shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            isActive 
              ? theme === 'cyberpunk' ? 'bg-cyber-pink border-cyber-pink text-black' : 'bg-indigo-600 border-indigo-400 text-white'
              : theme === 'cyberpunk' ? 'bg-black border-cyber-accent/40 text-cyber-accent' : theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            {metadata.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h5 className={`text-xs font-bold truncate ${
                isActive 
                  ? (theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-400 dark:text-white') 
                  : (theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-400')
              }`}>
                {metadata.label}
              </h5>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {metadata.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleFavorite}
            className="p-1 rounded-lg hover:bg-white/10 text-amber-400 transition-colors"
            title="Toggle Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : 'text-slate-500'}`} />
          </button>
          {metadata.formula && (
            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-black/20 border border-white/10 text-slate-400 hidden sm:inline-block">
              {metadata.formula}
            </span>
          )}
          <ChevronRight className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'} text-slate-400`} />
        </div>
      </div>
    );
  }

  // Grid & Split View Card
  return (
    <div
      id={`module-card-${metadata.id}`}
      onClick={onSelect}
      onMouseEnter={onInspect}
      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group relative flex flex-col justify-between overflow-hidden backdrop-blur-md ${
        isActive
          ? theme === 'cyberpunk'
            ? 'bg-black border-cyber-pink shadow-[0_0_30px_rgba(255,0,255,0.35)] ring-1 ring-cyber-pink'
            : theme === 'dark'
              ? 'bg-gradient-to-br from-indigo-900/90 via-[#0B1228] to-indigo-950/90 border-indigo-400 shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-500/60'
              : 'bg-indigo-50/90 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/40'
          : isFocused
            ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/60 scale-[1.015] shadow-lg'
            : theme === 'cyberpunk'
              ? 'bg-black/90 hover:bg-cyber-accent/10 border-cyber-accent/30 hover:border-cyber-accent/70 shadow-sm'
              : theme === 'dark'
                ? 'bg-white/5 hover:bg-indigo-950/30 border-white/10 hover:border-indigo-500/50 shadow-sm hover:shadow-lg'
                : 'bg-white/80 hover:bg-slate-50/90 border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Corner Bracket Accents */}
      <div className={`absolute top-1.5 left-1.5 w-2 h-2 border-t border-l transition-colors ${
        isActive ? (theme === 'cyberpunk' ? 'border-cyber-pink' : 'border-indigo-400') : 'border-slate-300 dark:border-white/20 group-hover:border-indigo-400'
      }`} />
      <div className={`absolute top-1.5 right-1.5 w-2 h-2 border-t border-r transition-colors ${
        isActive ? (theme === 'cyberpunk' ? 'border-cyber-pink' : 'border-indigo-400') : 'border-slate-300 dark:border-white/20 group-hover:border-indigo-400'
      }`} />

      {/* Active Top Line Glow */}
      {isActive && (
        <div className={`absolute top-0 right-0 left-0 h-1 ${
          theme === 'cyberpunk' ? 'bg-cyber-pink' : 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500'
        }`} />
      )}

      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className={`p-2.5 rounded-xl border transition-all duration-200 group-hover:scale-105 shadow-sm ${
            isActive 
              ? theme === 'cyberpunk'
                ? 'bg-cyber-pink border-cyber-pink shadow-[0_0_12px_rgba(255,0,255,0.5)] text-black'
                : 'bg-indigo-600 border-indigo-400 shadow-md text-white' 
              : theme === 'cyberpunk'
                ? 'bg-black border-cyber-accent/50 group-hover:border-cyber-accent text-cyber-accent'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/40'
                  : 'bg-slate-50 border-slate-200/80 group-hover:bg-indigo-50 group-hover:border-indigo-300'
          }`}>
            {metadata.icon}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Star Favorite Button */}
            <button
              onClick={onToggleFavorite}
              className="p-1 rounded-lg hover:bg-white/10 text-amber-400 transition-colors"
              title="Toggle Favorite"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : 'text-slate-500 hover:text-amber-400'}`} />
            </button>

            {isActive ? (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm border ${
                theme === 'cyberpunk'
                  ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent'
                  : theme === 'dark'
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            ) : metadata.formula ? (
              <span className="px-2 py-0.5 rounded-md font-mono text-[9px] bg-black/20 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 max-w-[120px] truncate">
                {metadata.formula}
              </span>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <h4 className={`text-sm font-black tracking-tight mb-1 transition-colors flex items-center gap-1.5 ${
          isActive 
            ? theme === 'cyberpunk' ? 'text-cyber-pink' : theme === 'dark' ? 'text-white' : 'text-indigo-900'
            : theme === 'cyberpunk' ? 'text-cyber-accent group-hover:text-cyber-pink' : theme === 'dark' ? 'text-slate-100 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-600'
        }`}>
          <span>{metadata.label}</span>
        </h4>

        {/* Subtitle */}
        <p className={`text-xs font-medium leading-relaxed line-clamp-2 mb-3 ${
          theme === 'cyberpunk' ? 'text-cyber-accent/70' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {metadata.subtitle}
        </p>
      </div>

      {/* Tags & Action Arrow */}
      <div className={`pt-2.5 border-t flex items-center justify-between gap-2 text-[10px] font-mono ${
        theme === 'cyberpunk' ? 'border-cyber-accent/30' : theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'
      }`}>
        <div className="flex items-center gap-1 overflow-hidden">
          {metadata.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-1.5 py-0.5 rounded truncate bg-black/20 dark:bg-white/5 border border-white/5 text-slate-400 text-[9px]">
              #{tag}
            </span>
          ))}
        </div>

        <ArrowUpRight className={`w-4 h-4 transition-all ${
          isRTL ? 'rotate-[-90deg] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
        } ${
          theme === 'cyberpunk' ? 'text-cyber-accent/50 group-hover:text-cyber-pink' : 'text-slate-400 group-hover:text-indigo-400'
        }`} />
      </div>
    </div>
  );
};
