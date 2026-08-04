import React, { useState, useEffect, useMemo } from 'react';
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
  Atom,
  FlaskConical,
  Compass,
  Zap,
  Command,
  LayoutGrid,
  List,
  SlidersHorizontal,
  BarChart3,
  ArrowUpRight
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
  | 'residual_stress';

export interface ModuleMetadata {
  id: ModuleId;
  label: string;
  category: string;
  categoryIcon: React.ReactNode;
  subtitle: string;
  formula?: string;
  tags: string[];
  icon: React.ReactNode;
}

interface ScientificModuleNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  theme?: string;
}

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
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset search on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

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
        tags: ['d-spacing', '2Theta', 'Q-vector', 'Wavelength'],
        icon: <Activity className={`${defaultIconClass} text-cyan-400`} />
      },
      {
        id: 'fwhm',
        label: t('FWHM Profile Fitting', 'FWHM Profile Fitting'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'تحلیل پهنای نیمه ارتفاع، توابع گوسی، لورنتسی و سودو-وویت' : 'Full Width at Half Maximum profile & line shape analysis',
        formula: 'FWHM (β)',
        tags: ['FWHM', 'Line Shape', 'Gaussian', 'Lorentzian'],
        icon: <Sliders className={`${defaultIconClass} text-blue-400`} />
      },
      {
        id: 'selection',
        label: t('Selection & Extinction Rules', 'Selection & Extinction Rules'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'قوانین خاموشی سیستم‌های بلوری SC، BCC، FCC و الماس' : 'Systematic absence & lattice extinction logic matrix',
        formula: 'h + k + l = 2n',
        tags: ['HKL', 'Extinction', 'BCC', 'FCC', 'Symmetry'],
        icon: <Hash className={`${defaultIconClass} text-indigo-400`} />
      },
      {
        id: 'compare',
        label: t('Diffraction Compare Engine', 'Diffraction Compare Engine'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'مقایسه همزمان الگوی پراکندگی چند ماده و انطباق پیک‌ها' : 'Multi-pattern spectral overlay & peak matching workbench',
        formula: 'I_rel vs 2θ',
        tags: ['Overlay', 'Comparative', 'Multi-Phase', 'Matching'],
        icon: <Layers className={`${defaultIconClass} text-sky-400`} />
      },
      {
        id: 'preferred_orientation',
        label: t('Preferred Orientation (March-Dollase)', 'Preferred Orientation'),
        category: t('Fundamentals & Optics', 'Fundamentals & Optics'),
        categoryIcon: <FlaskConical className="w-4 h-4 text-cyan-400" />,
        subtitle: isRTL ? 'تصحیح بافت و جهت‌گیری ترجیحی بلورک‌ها' : 'Texture correction & pole density coefficient calculation',
        formula: 'P_k = (r²cos²α + r⁻¹sin²α)⁻³/²',
        tags: ['Texture', 'March-Dollase', 'Pole Density', 'Orientation'],
        icon: <Compass className={`${defaultIconClass} text-teal-400`} />
      },

      // Category 2: Size, Strain & Lattice Dynamics
      {
        id: 'scherrer',
        label: t('Scherrer Crystallite Size', 'Scherrer Method'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'محاسبه میانگین ابعاد بلورک‌ها با ضریب شکل K' : 'Classical grain domain size analysis with shape factor K',
        formula: 'D = Kλ / (β·cosθ)',
        tags: ['Grain Size', 'Nanocrystals', 'Shape Factor K', 'Scherrer'],
        icon: <Microscope className={`${defaultIconClass} text-emerald-400`} />
      },
      {
        id: 'wh',
        label: t('Williamson-Hall Method', 'Williamson-Hall'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تفکیک کرنش میکروسکوپی شبکه از پهن‌شدگی اندازه بلورک' : 'Linear separation of microstrain (ε) from grain size broadening',
        formula: 'β·cosθ = Kλ/D + 4ε·sinθ',
        tags: ['Microstrain', 'Size-Strain', 'W-H Plot', 'Linear Fit'],
        icon: <TrendingUp className={`${defaultIconClass} text-emerald-400`} />
      },
      {
        id: 'monshi_scherrer',
        label: t('Monshi-Scherrer Scheme', 'Monshi-Scherrer Scheme'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'برونیابی لگاریتمی دقیق اصلاح‌شده برای نانوذرات' : 'Modified logarithmic extrapolation model for ultra-small crystallites',
        formula: 'ln(β) = ln(Kλ/D) + ln(1/cosθ)',
        tags: ['Monshi', 'Modified Scherrer', 'Logarithmic Fit', 'Nanomaterials'],
        icon: <Activity className={`${defaultIconClass} text-green-400`} />
      },
      {
        id: 'double_voigt',
        label: t('Double-Voigt Method', 'Double-Voigt Method'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'توزیع ابعاد حواشی و کرنش بر اساس کانولوشن وویت' : 'Voigt profile convolution for volume-weighted vs number-weighted size',
        formula: 'β_L(s) & β_G(s)',
        tags: ['Double-Voigt', 'Convolution', 'Volume-Weighted', 'Distribution'],
        icon: <Layers className={`${defaultIconClass} text-teal-400`} />
      },
      {
        id: 'integral',
        label: t('Integral Breadth Analysis', 'Integral Breadth'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تحلیل پهنای انتگرالی نسبت مساحت کل به ارتفاع پیک' : 'Integrated intensity area over peak height parameter',
        formula: 'β_I = A / I_max',
        tags: ['Integral Breadth', 'Peak Area', 'Profiles'],
        icon: <InfinityIcon className={`${defaultIconClass} text-lime-400`} />
      },
      {
        id: 'integral_adv',
        label: t('IB Advanced (W-H)', 'IB Advanced (W-H)'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'روش پیشرفته پهنای انتگرالی ترکیبی گوسی و لورنتسی' : 'Advanced Gaussian-Lorentzian IB plot for size/strain',
        formula: 'β* = 1/D + 2e s*',
        tags: ['IB Advanced', 'Lorentzian', 'Gaussian', 'Size-Strain'],
        icon: <Sliders className={`${defaultIconClass} text-emerald-300`} />
      },
      {
        id: 'wa',
        label: t('Warren-Averbach Fourier', 'Warren-Averbach'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تحلیل سری فوریه برای توابع توزیع واقعی طول ستون' : 'True column length distribution & RMS microstrain <ε_L²>¹/²',
        formula: 'A_L(s) = A_L^S · A_L^D',
        tags: ['Fourier', 'Warren-Averbach', 'RMS Strain', 'Column Length'],
        icon: <Network className={`${defaultIconClass} text-green-300`} />
      },
      {
        id: 'method_of_moments',
        label: t('Method of Moments (Variance)', 'Method of Moments'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'تحلیل گشتاورهای آماری و واریانس خطوط پراکندگی' : 'Statistical moment analysis of profile variance vs integration range',
        formula: 'W(2θ) = ⟨(2θ - 2θ₀)²⟩',
        tags: ['Variance', 'Moments', 'Asymmetry', 'Statistical'],
        icon: <BarChart3 className={`${defaultIconClass} text-emerald-500`} />
      },
      {
        id: 'residual_stress',
        label: t('Residual Stress (sin²ψ)', 'Residual Stress'),
        category: t('Size, Strain & Dynamics', 'Size, Strain & Dynamics'),
        categoryIcon: <Microscope className="w-4 h-4 text-emerald-400" />,
        subtitle: isRTL ? 'ارزیابی تنش‌های پسماند ماکروسکوپی و تانسور الاستیک' : 'Macroscopic residual stress & elastic lattice strain tensor evaluation',
        formula: 'ε_ψ = ((1+ν)/E)σ·sin²ψ - (ν/E)(σ₁+σ₂)',
        tags: ['Sin2Psi', 'Residual Stress', 'Macro-stress', 'Elasticity'],
        icon: <Zap className={`${defaultIconClass} text-amber-400`} />
      },

      // Category 3: Advanced Structure & Lattice Refinement
      {
        id: 'cohen',
        label: t("Cohen's Matrix Refinement", "Cohen's Matrix Refinement"),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'پالایش ماتریسی کمترین مربعات ثابت‌های شبکه و خطای زاویه' : 'Least-squares matrix correction for unit cell parameters & zero-shift',
        formula: 'sin²θ = A·h² + B·k² + C·l² + D·cos²θ',
        tags: ['Cohen', 'Lattice Refinement', 'Least Squares', 'Zero Offset'],
        icon: <Grid className={`${defaultIconClass} text-purple-400`} />
      },
      {
        id: 'metric_tensor',
        label: t('Metric Tensor Algebra', 'Metric Tensor Algebra'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'تانسورهای فضای معکوس g_ij و محاسبه زوایای بین صفحات' : 'Reciprocal space metric tensor g^ij & interplanar angle calculations',
        formula: 'g_ij = a_i · a_j',
        tags: ['Metric Tensor', 'Reciprocal Space', 'Interplanar Angle', 'Geometry'],
        icon: <Sparkles className={`${defaultIconClass} text-indigo-400`} />
      },
      {
        id: 'supercell_transform',
        label: t('Supercell & Matrix Engine', 'Supercell & Matrix Engine'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'ماتریس‌های تبدیل سلول واحد و ابرسلول‌های بلوری' : 'Real space unit cell transformation & Bravais lattice conversions',
        formula: "[a' b' c'] = [a b c]·M",
        tags: ['Supercell', 'Transformation', 'Matrix', 'Lattice Vectors'],
        icon: <Grid className={`${defaultIconClass} text-violet-400`} />
      },
      {
        id: 'pawley_lebail',
        label: t('Pawley & Le Bail Fitting', 'Pawley & Le Bail Fitting'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'تجزیه کامل الگوی پراکندگی بدون نیاز به مدل ساختاری' : 'Whole powder pattern decomposition without structural model',
        formula: 'I_hkl extraction',
        tags: ['Pawley', 'Le Bail', 'Decomposition', 'Intensity Fitting'],
        icon: <Activity className={`${defaultIconClass} text-fuchsia-400`} />
      },
      {
        id: 'rir',
        label: t('Reference Intensity Ratio (RIR)', 'Reference Intensity Ratio (RIR)'),
        category: t('Structure & Refinement', 'Structure & Refinement'),
        categoryIcon: <Atom className="w-4 h-4 text-purple-400" />,
        subtitle: isRTL ? 'تحلیل نیمه‌کمی فراوانی فازها با استاندارد کوندوم (I/I_c)' : 'Semi-quantitative phase abundance relative to corundum standard',
        formula: 'X_A = (I_A / RIR_A) / Σ(I_i / RIR_i)',
        tags: ['RIR', 'Quantitative', 'Corundum', 'Phase Abundance'],
        icon: <Layers className={`${defaultIconClass} text-pink-400`} />
      },

      // Category 4: Rietveld & Advanced Simulations
      {
        id: 'rietveld',
        label: t('Rietveld Full Profile Setup', 'Rietveld Setup'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'پالایش ساختار بلوری، مختصات اتمی و شاخص‌های R_wp، χ²' : 'Crystal structure refinement, atomic positions & fit quality R_wp',
        formula: 'S(y) = Σ w_i (y_o - y_c)²',
        tags: ['Rietveld', 'Refinement', 'Atomic Coordinates', 'Rwp'],
        icon: <Sliders className={`${defaultIconClass} text-amber-400`} />
      },
      {
        id: 'neutron',
        label: t('Neutron Diffraction Physics', 'Neutron Diffraction'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'طول پراکندگی هسته‌ای b_i و ردیابی عناصر سبک (H, Li, O)' : 'Nuclear scattering length b_i & light element localization',
        formula: 'b_coherent & b_incoherent',
        tags: ['Neutron', 'Nuclear Scattering', 'Light Elements', 'Isotopes'],
        icon: <Orbit className={`${defaultIconClass} text-orange-400`} />
      },
      {
        id: 'magnetic',
        label: t('Magnetic Neutron Scattering', 'Magnetic Neutron Scattering'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'فاکتور فرم مغناطیسی، آرایش اسپین‌ها و تقارن سلول مغناطیسی' : 'Magnetic form factor f(Q), spin structure & magnetic space groups',
        formula: 'F_mag(Q) = (r₀γ/2) μ_f f_m(Q)',
        tags: ['Magnetic', 'Spin Structure', 'Form Factor', 'Antiferromagnetic'],
        icon: <Magnet className={`${defaultIconClass} text-red-400`} />
      },
      {
        id: 'python_export',
        label: t('Python Script Generator', 'Python Generator'),
        category: t('Rietveld & Quantum Sim', 'Rietveld & Quantum Sim'),
        categoryIcon: <Orbit className="w-4 h-4 text-amber-400" />,
        subtitle: isRTL ? 'تولید خودکار کدهای پایتون SciPy و DiffPy برای محاسبات پیشرفته' : 'Automated SciPy / DiffPy script generation for custom analysis',
        formula: 'import scipy.optimize',
        tags: ['Python', 'Automation', 'SciPy', 'Scripting'],
        icon: <Terminal className={`${defaultIconClass} text-emerald-400`} />
      },

      // Category 5: AI & Neural Intelligence
      {
        id: 'dl',
        label: t('PhaseID Neural Classifier', 'PhaseID Neural Net'),
        category: t('AI & Neural Intelligence', 'AI & Neural Intelligence'),
        categoryIcon: <Brain className="w-4 h-4 text-violet-400" />,
        subtitle: isRTL ? 'تشخیص فازهای فازهای بلوری با هوش مصنوعی و یادگیری عمیق' : 'AI deep learning for rapid multiphase pattern identification',
        formula: 'CNN Peak Classifier',
        tags: ['AI', 'Neural Net', 'PhaseID', 'Pattern Recognition'],
        icon: <Brain className={`${defaultIconClass} text-violet-400`} />
      },
      {
        id: 'image_analysis',
        label: t('2D Detector & Ring Integrator', 'Image Analysis'),
        category: t('AI & Neural Intelligence', 'AI & Neural Intelligence'),
        categoryIcon: <Brain className="w-4 h-4 text-violet-400" />,
        subtitle: isRTL ? 'انتگرال‌گیری از حلقه‌های دبی-شرر در دتکتورهای دو بعدی' : 'Debye-Scherrer ring azimuth integration & 2D detector processing',
        formula: 'I(2θ, χ) Azimuthal Integration',
        tags: ['2D Detector', 'Debye-Scherrer', 'Texture', 'Ring Integration'],
        icon: <ImageIcon className={`${defaultIconClass} text-pink-400`} />
      },
      {
        id: 'image_gen',
        label: t('Scientific Illustrator AI', 'Scientific Illustrator'),
        category: t('AI & Neural Intelligence', 'AI & Neural Intelligence'),
        categoryIcon: <Brain className="w-4 h-4 text-violet-400" />,
        subtitle: isRTL ? 'تصویرسازی سه‌بعدی علمی برای مقالات و ارائه‌ها' : 'AI crystallographic 3D crystal schematic & diagram generator',
        formula: 'Diffusion Visualizer',
        tags: ['Illustrator', '3D Crystal', 'Diagrams', 'Publications'],
        icon: <Sparkles className={`${defaultIconClass} text-purple-300`} />
      },

      // Category 6: Databases & Lab Utilities
      {
        id: 'periodic_table',
        label: t('Interactive Periodic Table', 'Periodic Table'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'لبه‌های جذب اشعه ایکس (K_α, K_β) و فاکتور پراکندگی اتمی f(Q)' : 'X-ray absorption edges (K_α, K_β) & atomic scattering factors f(Q)',
        formula: 'Z, f₀(s), μ/ρ',
        tags: ['Periodic Table', 'X-ray Edges', 'Scattering Factors', 'Elements'],
        icon: <Grid className={`${defaultIconClass} text-cyan-300`} />
      },
      {
        id: 'database',
        label: t('Crystallographic Material Registry', 'Material Registry'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'پایگاه داده فازهای معدنی، فایل‌های CIF و استانداردهای آزمایشگاهی' : 'Searchable CIF standards, inorganic phases & Bragg database',
        formula: 'ICSD / CIF Database',
        tags: ['CIF', 'Standards', 'Materials', 'ICSD'],
        icon: <Database className={`${defaultIconClass} text-indigo-300`} />
      },
      {
        id: 'learn',
        label: t('Protocol & Theory Manual', 'Protocol Guide'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'کتاب راهنمای ریاضی و تئوری پراکندگی اشعه ایکس' : 'Interactive crystallographic textbook, derivations & lab protocols',
        formula: 'Book of Crystallography',
        tags: ['Theory', 'Textbook', 'Protocols', 'Derivations'],
        icon: <BookOpen className={`${defaultIconClass} text-amber-300`} />
      },
      {
        id: 'profile',
        label: t('Laboratory Director Profile', 'Laboratory Director'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'رزومه پژوهشی، پرونده علمی و مجوزهای گره ابری' : 'Investigator credentials, publications & cloud node identity',
        formula: 'L-5 Director Node',
        tags: ['Profile', 'Researcher', 'Credentials', 'Node'],
        icon: <User className={`${defaultIconClass} text-emerald-400`} />
      },
      {
        id: 'settings',
        label: t('System & Calibration Settings', 'Settings'),
        category: t('Databases & Reference', 'Databases & Reference'),
        categoryIcon: <Database className="w-4 h-4 text-slate-400" />,
        subtitle: isRTL ? 'کالیبراسیون زاویه صفر، شعاع گونیومتر و تنظیمات واحدها' : 'Wavelength calibration, zero offsets, unit preferences & theme',
        formula: 'Zero Shift & Calibration',
        tags: ['Settings', 'Calibration', 'Units', 'Theme'],
        icon: <Settings2 className={`${defaultIconClass} text-slate-300`} />
      }
    ];
  }, [t, isRTL]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(moduleList.map(m => m.category)));
    return ['All', ...cats];
  }, [moduleList]);

  const filteredModules = useMemo(() => {
    return moduleList.filter(m => {
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery = 
        m.label.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.formula && m.formula.toLowerCase().includes(q)) ||
        m.tags.some(tag => tag.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [moduleList, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop overlay with high-end blur & ambient radial glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`absolute inset-0 backdrop-blur-xl transition-all ${
            theme === 'cyberpunk' ? 'bg-black/90' : theme === 'dark' ? 'bg-[#050A18]/85' : 'bg-slate-900/50'
          }`}
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        </motion.div>

        {/* Main Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-10 backdrop-blur-2xl ${
            theme === 'cyberpunk'
              ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_60px_rgba(0,255,255,0.25)]'
              : theme === 'dark'
                ? 'bg-[#0B1228]/95 border-indigo-500/20 text-white shadow-[0_0_50px_rgba(15,23,42,0.8)]'
                : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-2xl shadow-indigo-500/10'
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Subtle Ambient Grid Background Pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }} 
          />

          {/* Corner Bracket Instrument Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-500/50 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-500/50 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-500/50 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-500/50 pointer-events-none" />

          {/* Top Bar Header */}
          <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0 relative z-10 ${
            theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black/80' : theme === 'dark' ? 'border-white/10 bg-[#070C18]/80' : 'border-slate-200/80 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl p-0.5 shadow-xl flex items-center justify-center shrink-0 ${
                theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_20px_rgba(255,0,255,0.5)]' : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 shadow-indigo-500/30'
              }`}>
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  theme === 'cyberpunk' ? 'bg-black' : 'bg-[#070C18]'
                }`}>
                  <Atom className={`w-6 h-6 animate-spin-slow ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-cyan-400'}`} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-indigo-400">
                    [NAV-SUITE-01] • SCIENTIFIC SUITE
                  </span>
                </div>
                <h3 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 ${theme === 'cyberpunk' ? 'text-cyber-accent' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <span>{isRTL ? 'ناوبری ماژول‌ها و ابزارهای پراکندگی' : 'Scientific Suite Navigator'}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm border ${
                    theme === 'cyberpunk' ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent' : 'bg-indigo-500/10 border-indigo-400/30 text-indigo-400 dark:text-indigo-300'
                  }`}>
                    {moduleList.length} Modules
                  </span>
                </h3>
                <p className={`text-xs font-medium ${theme === 'cyberpunk' ? 'text-cyber-accent/70' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isRTL 
                    ? 'برای تغییر سکشن محاسباتی، ماژول مورد نظر خود را بر اساس کاربرد تخصصی انتخاب کنید' 
                    : 'Select a specialized crystallographic calculator or scientific instrument module'}
                </p>
              </div>
            </div>

            {/* Quick Actions & Close Button */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* View mode toggle */}
              <div className={`flex items-center p-1 rounded-xl border ${
                theme === 'cyberpunk' ? 'bg-black border-cyber-accent/40' : theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? (theme === 'cyberpunk' ? 'bg-cyber-accent text-black' : 'bg-indigo-600 text-white shadow-sm')
                      : (theme === 'cyberpunk' ? 'text-cyber-accent/70 hover:text-cyber-accent' : 'text-slate-400 hover:text-slate-200')
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'compact' 
                      ? (theme === 'cyberpunk' ? 'bg-cyber-accent text-black' : 'bg-indigo-600 text-white shadow-sm')
                      : (theme === 'cyberpunk' ? 'text-cyber-accent/70 hover:text-cyber-accent' : 'text-slate-400 hover:text-slate-200')
                  }`}
                  title="Compact View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
                theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent/70' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}>
                <Command className={`w-3.5 h-3.5 ${theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-400'}`} />
                <span>Esc {isRTL ? 'برای خروج' : 'to exit'}</span>
              </div>

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

          {/* Search Bar & Category Filter Tabs */}
          <div className={`p-4 sm:p-6 border-b space-y-4 shrink-0 relative z-10 ${
            theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black' : theme === 'dark' ? 'border-white/10 bg-[#070C18]/60' : 'border-slate-200/60 bg-slate-50/50'
          }`}>
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-indigo-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'جستجوی ماژول (مثلا Scherrer, Rietveld, Strain, HKL, AI...)...' : 'Search modules, formulas, methods (e.g., Scherrer, Williamson-Hall, Pawley, Rietveld, AI)...'}
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
                    theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30 text-cyber-accent/60' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    {filteredModules.length} found
                  </span>
                )}
              </div>
            </div>

            {/* Horizontal Category Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar scrollbar-none">
              {categories.map((cat, idx) => {
                const isSelected = selectedCategory === cat;
                const count = cat === 'All' ? moduleList.length : moduleList.filter(m => m.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer border ${
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
                    <span className="text-[10px] font-mono opacity-60">[{idx === 0 ? 'ALL' : `0${idx}`}]</span>
                    {cat === 'All' ? <Sparkles className={`w-3.5 h-3.5 ${isSelected ? (theme === 'cyberpunk' ? 'text-black' : 'text-amber-300') : 'text-amber-500'}`} /> : null}
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
          </div>

          {/* Main Module Grid View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6 relative z-10">
            {filteredModules.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto ${
                  theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <Search className="w-8 h-8" />
                </div>
                <h4 className={`text-base font-bold ${theme === 'cyberpunk' ? 'text-cyber-accent' : theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>
                  {isRTL ? 'هیچ ماژولی با این عبارت پیدا نشد' : 'No scientific modules found'}
                </h4>
                <p className={`text-xs max-w-sm mx-auto ${theme === 'cyberpunk' ? 'text-cyber-accent/70' : 'text-slate-500'}`}>
                  {isRTL ? 'عبارت جستجو را تغییر دهید یا فیلتر دسته‌بندی را پاک کنید.' : 'Try adjusting your search terms or select another category filter.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    theme === 'cyberpunk' ? 'bg-cyber-pink hover:bg-cyber-accent text-black' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isRTL ? 'پاکسازی فیلترها' : 'Reset Search Filters'}
                </button>
              </div>
            ) : (
              selectedCategory === 'All' && !searchQuery ? (
                categories.filter(c => c !== 'All').map(category => {
                  const categoryMods = filteredModules.filter(m => m.category === category);
                  if (categoryMods.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className={`flex items-center gap-2.5 pb-2 border-b ${theme === 'cyberpunk' ? 'border-cyber-accent/30' : theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                        {categoryMods[0]?.categoryIcon}
                        <h4 className={`text-xs font-black uppercase tracking-widest ${theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-400 dark:text-indigo-300'}`}>
                          {category}
                        </h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent' : theme === 'dark' ? 'text-slate-400 bg-white/5 border-white/10' : 'text-slate-500 bg-white border-slate-200'
                        }`}>
                          {categoryMods.length}
                        </span>
                      </div>

                      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" : "grid grid-cols-1 md:grid-cols-2 gap-2"}>
                        {categoryMods.map(m => (
                          <ModuleCard
                            key={m.id}
                            metadata={m}
                            isActive={activeModule === m.id}
                            onSelect={() => {
                              onSelectModule(m.id);
                              onClose();
                            }}
                            isRTL={isRTL}
                            theme={theme}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" : "grid grid-cols-1 md:grid-cols-2 gap-2"}>
                  {filteredModules.map(m => (
                    <ModuleCard
                      key={m.id}
                      metadata={m}
                      isActive={activeModule === m.id}
                      onSelect={() => {
                        onSelectModule(m.id);
                        onClose();
                      }}
                      isRTL={isRTL}
                      theme={theme}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Modal Footer with quick instructions */}
          <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 relative z-10 ${
            theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black text-cyber-accent/70' : theme === 'dark' ? 'border-white/10 bg-[#070C18]/80 text-slate-400' : 'border-slate-200/80 bg-slate-50/80 text-slate-500'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 shrink-0 ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-amber-400'}`} />
              <span>
                {isRTL 
                  ? 'نمای کاری برنامه به صورت ۱۰۰٪ تمام صفحه تنظیم شده است.' 
                  : 'Full-spectrum suite enabled. Select any module to immediately load its workspace.'}
              </span>
            </div>
            <div className={`text-[11px] font-mono flex items-center gap-3 ${theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-slate-400 dark:text-slate-500'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              XRD-Calc Pro • Quantum Crystallography Labs
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
  onSelect: () => void;
  isRTL: boolean;
  theme: string;
  viewMode?: 'grid' | 'compact';
}

const ModuleCard: React.FC<ModuleCardProps> = ({ metadata, isActive, onSelect, isRTL, theme, viewMode = 'grid' }) => {
  if (viewMode === 'compact') {
    return (
      <div
        onClick={onSelect}
        className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer group relative flex items-center justify-between gap-3 backdrop-blur-md ${
          isActive
            ? theme === 'cyberpunk'
              ? 'bg-black border-cyber-pink shadow-[0_0_15px_rgba(255,0,255,0.3)]'
              : theme === 'dark'
                ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                : 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
            : theme === 'cyberpunk'
              ? 'bg-black/80 hover:bg-cyber-accent/10 border-cyber-accent/30 hover:border-cyber-accent/70'
              : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-indigo-500/40'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg border shrink-0 transition-transform duration-200 group-hover:scale-105 ${
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

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group relative flex flex-col justify-between overflow-hidden backdrop-blur-md ${
        isActive
          ? theme === 'cyberpunk'
            ? 'bg-black border-cyber-pink shadow-[0_0_25px_rgba(255,0,255,0.35)] ring-1 ring-cyber-pink'
            : theme === 'dark'
              ? 'bg-gradient-to-br from-indigo-900/90 via-[#0B1228] to-indigo-950/90 border-indigo-400 shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-500/50'
              : 'bg-indigo-50/90 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/30'
          : theme === 'cyberpunk'
            ? 'bg-black/90 hover:bg-cyber-accent/10 border-cyber-accent/30 hover:border-cyber-accent/70 shadow-sm'
            : theme === 'dark'
              ? 'bg-white/5 hover:bg-indigo-950/30 border-white/10 hover:border-indigo-500/50 shadow-sm hover:shadow-lg'
              : 'bg-white/80 hover:bg-slate-50/90 border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Corner Bracket Accents for Laboratory Instrument Look */}
      <div className={`absolute top-1.5 left-1.5 w-2 h-2 border-t border-l transition-colors ${
        isActive ? (theme === 'cyberpunk' ? 'border-cyber-pink' : 'border-indigo-400') : 'border-slate-300 dark:border-white/20 group-hover:border-indigo-400'
      }`} />
      <div className={`absolute top-1.5 right-1.5 w-2 h-2 border-t border-r transition-colors ${
        isActive ? (theme === 'cyberpunk' ? 'border-cyber-pink' : 'border-indigo-400') : 'border-slate-300 dark:border-white/20 group-hover:border-indigo-400'
      }`} />

      {/* Active Glow Accent Bar */}
      {isActive && (
        <div className={`absolute top-0 right-0 left-0 h-1 ${
          theme === 'cyberpunk' ? 'bg-cyber-pink' : 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500'
        }`} />
      )}

      <div>
        {/* Top Header Row of Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-105 shadow-sm ${
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

          {isActive ? (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm border ${
              theme === 'cyberpunk'
                ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent'
                : theme === 'dark'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isRTL ? 'فعال' : 'ONLINE'}
            </span>
          ) : (
            metadata.formula && (
              <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition-colors border max-w-[120px] truncate ${
                theme === 'cyberpunk'
                  ? 'bg-black border-cyber-accent/30 text-cyber-accent/70 group-hover:text-cyber-accent group-hover:border-cyber-accent'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-slate-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-300 group-hover:bg-indigo-50'
              }`}>
                {metadata.formula}
              </span>
            )
          )}
        </div>

        {/* Title & Subtitle */}
        <h4 className={`text-sm font-black tracking-tight mb-1 transition-colors flex items-center gap-1.5 ${
          isActive 
            ? theme === 'cyberpunk' ? 'text-cyber-pink' : theme === 'dark' ? 'text-white' : 'text-indigo-900'
            : theme === 'cyberpunk' ? 'text-cyber-accent group-hover:text-cyber-pink' : theme === 'dark' ? 'text-slate-100 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-600'
        }`}>
          <span>{metadata.label}</span>
        </h4>
        <p className={`text-xs font-medium leading-relaxed line-clamp-2 mb-3.5 ${
          theme === 'cyberpunk' ? 'text-cyber-accent/70' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {metadata.subtitle}
        </p>
      </div>

      {/* Tags Footer */}
      <div className={`pt-2.5 border-t flex items-center justify-between gap-2 text-[10px] font-mono ${
        theme === 'cyberpunk' ? 'border-cyber-accent/30' : theme === 'dark' ? 'border-white/5' : 'border-slate-200/60'
      }`}>
        <div className="flex items-center gap-1.5 overflow-hidden">
          {metadata.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className={`px-1.5 py-0.5 rounded truncate ${
              theme === 'cyberpunk' ? 'bg-black border border-cyber-accent/20 text-cyber-accent/70' : theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
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

