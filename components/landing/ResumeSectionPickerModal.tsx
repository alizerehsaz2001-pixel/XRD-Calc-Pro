import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Orbit, 
  Magnet, 
  Brain, 
  Image as ImageIcon, 
  Terminal, 
  ArrowRight,
  FlaskConical,
  Compass,
  Zap,
  Box,
  Wand2,
  CheckCircle2,
  Clock,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export type ResumeModuleId = 
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

export interface ResumeSectionItem {
  id: ResumeModuleId;
  label: string;
  labelFa: string;
  category: 'fundamentals' | 'strain' | 'refinement' | 'simulation' | 'ai' | 'intelligence';
  categoryLabel: string;
  categoryLabelFa: string;
  subtitle: string;
  subtitleFa: string;
  formula: string;
  badge: string;
  icon: React.ReactNode;
  accentColor: string;
  tags: string[];
}

interface ResumeSectionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (moduleId: ResumeModuleId) => void;
  previousActiveModule?: string;
  isRTL?: boolean;
}

export const ResumeSectionPickerModal: React.FC<ResumeSectionPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  previousActiveModule = 'bragg',
  isRTL = false
}) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    } else {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Master definition of ALL 34 sections
  const allSections = useMemo<ResumeSectionItem[]>(() => {
    const iconClass = "w-5 h-5";
    return [
      // 1. Fundamentals & Optics (6 sections)
      {
        id: 'bragg',
        label: "Bragg's Law & Optics",
        labelFa: 'قانون براگ و اپتیک پرتو ایکس',
        category: 'fundamentals',
        categoryLabel: 'Fundamentals & Optics',
        categoryLabelFa: 'اصول و اپتیک پراش',
        subtitle: 'Wavelength, interplanar d-spacing & constructive interference angles',
        subtitleFa: 'طول موج، فواصل صفحات شبکه و زاویه تداخل سازنده',
        formula: 'λ = 2d · sin(θ)',
        badge: 'Core Optics',
        icon: <Activity className={`${iconClass} text-cyan-400`} />,
        accentColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
        tags: ['d-spacing', '2Theta', 'Q-vector', 'Wavelength', 'Bragg']
      },
      {
        id: 'unit_cells',
        label: 'Unit Cells & 14 Bravais Lattices',
        labelFa: 'سلول‌های واحد و ۱۴ شبکه براوه',
        category: 'fundamentals',
        categoryLabel: 'Fundamentals & Optics',
        categoryLabelFa: 'اصول و اپتیک پراش',
        subtitle: '7 Crystal systems, axial vectors (a,b,c,α,β,γ) & unit cell geometries',
        subtitleFa: '۷ دستگاه بلوری، برداری‌های سلول واحد و شبکه‌های براوه',
        formula: 'V = abc √(1 - cos²α - cos²β - cos²γ + 2cosα cosβ cosγ)',
        badge: 'Crystallography',
        icon: <Box className={`${iconClass} text-amber-400`} />,
        accentColor: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
        tags: ['Unit Cell', 'Crystal Systems', 'Bravais', 'Lattice Parameters']
      },
      {
        id: 'fwhm',
        label: 'FWHM Profile Fitting',
        labelFa: 'برازش پروفایل پیک و FWHM',
        category: 'fundamentals',
        categoryLabel: 'Fundamentals & Optics',
        categoryLabelFa: 'اصول و اپتیک پراش',
        subtitle: 'Gaussian, Lorentzian & Pseudo-Voigt peak deconvolution',
        subtitleFa: 'تفکیک توابع گاوسی، لورنتسی و سودووویگت',
        formula: 'PV(2θ) = η·L(2θ) + (1-η)·G(2θ)',
        badge: 'Peak Profile',
        icon: <Sliders className={`${iconClass} text-indigo-400`} />,
        accentColor: 'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30',
        tags: ['FWHM', 'Gaussian', 'Lorentzian', 'Pseudo-Voigt', 'Peak Fitting']
      },
      {
        id: 'selection',
        label: 'Selection Rules & Extinction',
        labelFa: 'قوانین انتخاب و خاموشی‌های ساختاری',
        category: 'fundamentals',
        categoryLabel: 'Fundamentals & Optics',
        categoryLabelFa: 'اصول و اپتیک پراش',
        subtitle: 'Systematic absences, glide planes, screw axes & space group reflections',
        subtitleFa: 'خاموشی سیستماتیک، صفحات لغزش و محورهای پیچشی',
        formula: 'F(hkl) = ∑ f_j · exp[2πi(hx_j + ky_j + lz_j)]',
        badge: 'Structure Factor',
        icon: <Hash className={`${iconClass} text-emerald-400`} />,
        accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
        tags: ['Extinction', 'Selection Rules', 'Space Groups', 'F(hkl)']
      },
      {
        id: 'preferred_orientation',
        label: 'Preferred Orientation (Texture)',
        labelFa: 'جهت‌گیری ترجیحی (بافت)',
        category: 'fundamentals',
        categoryLabel: 'Fundamentals & Optics',
        categoryLabelFa: 'اصول و اپتیک پراش',
        subtitle: 'March-Dollase & Lotgering factor calculations for anisotropic textures',
        subtitleFa: 'ضرایب مارس-دولاس و لوتگرینگ برای بافت‌های غیرهمسانگرد',
        formula: 'P_MD(α) = (r² cos²α + r⁻¹ sin²α)⁻³/²',
        badge: 'Texture',
        icon: <Compass className={`${iconClass} text-purple-400`} />,
        accentColor: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
        tags: ['March-Dollase', 'Lotgering', 'Texture Factor', 'Preferred Orientation']
      },
      {
        id: 'compare',
        label: 'Diffraction Pattern Comparison',
        labelFa: 'مقایسه الگوهای پراش',
        category: 'fundamentals',
        categoryLabel: 'Fundamentals & Optics',
        categoryLabelFa: 'اصول و اپتیک پراش',
        subtitle: 'Multi-scan diffractogram overlay, peak shifting & phase matching',
        subtitleFa: 'هم‌پوشانی چند طیف، بررسی جابجایی پیک‌ها و تطبیق فازی',
        formula: 'Δ(2θ) = 2θ_obs - 2θ_calc',
        badge: 'Multi-Scan',
        icon: <Layers className={`${iconClass} text-sky-400`} />,
        accentColor: 'from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30',
        tags: ['Compare', 'Overlay', 'Multi-pattern', 'Peak Shift']
      },

      // 2. Size & Strain Microstructure (10 sections)
      {
        id: 'scherrer',
        label: 'Scherrer Crystallite Size',
        labelFa: 'اندازه بلورک شرر',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Calculate coherent scattering domain size from peak broadening',
        subtitleFa: 'محاسبه ابعاد حوزه‌های پراش همدوس از روی پهن‌شدگی پیک‌ها',
        formula: 'D = K·λ / (β · cos(θ))',
        badge: 'Nano Size',
        icon: <Microscope className={`${iconClass} text-pink-400`} />,
        accentColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
        tags: ['Scherrer', 'Crystallite Size', 'Nanomaterials', 'Shape Factor']
      },
      {
        id: 'wh',
        label: 'Williamson-Hall Analysis',
        labelFa: 'آنالیز ویلیامسون-هال (UDM / USDM / UDEDM)',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Decouple crystallite size & microstrain via uniform deformation models',
        subtitleFa: 'جداسازی اندازه بلورک و ریزکرنش با مدل‌های تغییر شکل یکنواخت',
        formula: 'β·cos(θ) = K·λ/D + 4ε · sin(θ)',
        badge: 'Size-Strain Split',
        icon: <TrendingUp className={`${iconClass} text-rose-400`} />,
        accentColor: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
        tags: ['Williamson-Hall', 'Microstrain', 'UDM', 'USDM', 'UDEDM']
      },
      {
        id: 'monshi_scherrer',
        label: 'Monshi-Scherrer Scheme',
        labelFa: 'روش شرر اصلاح‌شده منشی',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Logarithmic linear regression minimising experimental errors in nano-size',
        subtitleFa: 'رگرسیون خطی لگاریتمی جهت کاهش خطاهای اندازه‌گیری ابعاد نانو',
        formula: 'ln(β) = ln(K·λ/D) + ln(1/cos(θ))',
        badge: 'Logarithmic',
        icon: <Activity className={`${iconClass} text-orange-400`} />,
        accentColor: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
        tags: ['Monshi-Scherrer', 'Logarithmic Fit', 'Error Reduction']
      },
      {
        id: 'double_voigt',
        label: 'Double-Voigt Method',
        labelFa: 'روش دوبل-ویگت',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Integral breadth Voigt deconvolution of size and strain distributions',
        subtitleFa: 'تفکیک توابع ویگت با پهنای انتگرالی برای توزیع اندازه و کرنش',
        formula: 'β_f² = β_c² + β_s²',
        badge: 'Voigt Integral',
        icon: <Layers className={`${iconClass} text-violet-400`} />,
        accentColor: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
        tags: ['Double-Voigt', 'Deconvolution', 'Size Distribution']
      },
      {
        id: 'integral',
        label: 'Integral Breadth Analysis',
        labelFa: 'آنالیز پهنای انتگرالی',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Area-to-peak ratio calculation for volume-weighted apparent crystallite size',
        subtitleFa: 'نسبت مساحت به ارتفاع قله برای اندازه حجم‌وزن‌دار بلورک',
        formula: 'β = ∫ I(2θ) d(2θ) / I_max',
        badge: 'Volume Weighted',
        icon: <InfinityIcon className={`${iconClass} text-cyan-400`} />,
        accentColor: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
        tags: ['Integral Breadth', 'Peak Area', 'Volume Size']
      },
      {
        id: 'integral_adv',
        label: 'Advanced IB Williamson-Hall',
        labelFa: 'ویلیامسون-هال پیشرفته پهنای انتگرالی',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Higher-order Cauchy-Gaussian polynomial deconvolution for mixed systems',
        subtitleFa: 'تفکیک چندجمله‌ای کوشی-گاوسی مرتبه بالا برای سیستم‌های پیچیده',
        formula: 'β_int · cos(θ) / λ = 1/D_v + 2e · (2sin(θ)/λ)',
        badge: 'High-Order',
        icon: <Sliders className={`${iconClass} text-emerald-400`} />,
        accentColor: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
        tags: ['Advanced IB', 'Polynomial Deconvolution', 'Integral Size']
      },
      {
        id: 'wa',
        label: 'Warren-Averbach Fourier Analysis',
        labelFa: 'آنالیز فوریه وارن-اورباخ',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Cosine Fourier coefficients analysis of column length distributions',
        subtitleFa: 'ضرایب کسینوسی فوریه و توزیع طول ستونی بلورک‌ها',
        formula: 'ln A_L(hkl) = ln A_L^S - 2π² L² ⟨ε_L²⟩ / d²',
        badge: 'Fourier Transform',
        icon: <Network className={`${iconClass} text-teal-400`} />,
        accentColor: 'from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30',
        tags: ['Warren-Averbach', 'Fourier', 'Column Length', 'RMS Strain']
      },
      {
        id: 'method_of_moments',
        label: 'Method of Moments',
        labelFa: 'روش گشتاورها (Moments)',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Statistical peak profile moments, variance & asymptotic slope analysis',
        subtitleFa: 'گشتاورهای آماری پروفایل، واریانس و شیب مجانبی',
        formula: 'μ_2 = ∫ (2θ - 2θ_0)² I(2θ) d(2θ) / ∫ I(2θ) d(2θ)',
        badge: 'Statistical Moments',
        icon: <Activity className={`${iconClass} text-yellow-400`} />,
        accentColor: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
        tags: ['Moments', 'Variance', 'Asymptotic', 'Profile Statistics']
      },
      {
        id: 'residual_stress',
        label: 'Residual Stress (sin²ψ Technique)',
        labelFa: 'تنش پسماند (روش sin²ψ)',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Multi-tilt elastic lattice strain tensor & macrostress determination',
        subtitleFa: 'محاسبه تانسور کرنش الاستیک شبکه در زوایای ψ و تنش ماکرو',
        formula: 'ε_ψ = [(1+ν)/E] · σ · sin²ψ - (2ν/E)·σ',
        badge: 'Stress Tensor',
        icon: <Activity className={`${iconClass} text-red-400`} />,
        accentColor: 'from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30',
        tags: ['Residual Stress', 'sin2psi', 'Elastic Modulus', 'Poisson Ratio']
      },
      {
        id: 'xrr',
        label: 'X-Ray Reflectometry (XRR)',
        labelFa: 'بازتاب‌سنجی پرتو ایکس (XRR)',
        category: 'strain',
        categoryLabel: 'Size & Strain Microstructure',
        categoryLabelFa: 'اندازه دانه و کرنش شبکه',
        subtitle: 'Thin film thickness, electronic density & interface roughness from Kiessig fringes',
        subtitleFa: 'ضخامت لایه‌نازک، چگالی الکترونی و زبری سطحی از نوارهای کیسیگ',
        formula: 'θ_m² = θ_c² + m² · (λ / 2t)²',
        badge: 'Thin Films',
        icon: <Activity className={`${iconClass} text-blue-400`} />,
        accentColor: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
        tags: ['XRR', 'Reflectometry', 'Kiessig Fringes', 'Film Thickness', 'Roughness']
      },

      // 3. Advanced Refinement & Cell Algebra (5 sections)
      {
        id: 'cohen',
        label: "Cohen's Matrix Refinement",
        labelFa: 'روش ماتریسی کوهن (حداقل مربعات)',
        category: 'refinement',
        categoryLabel: 'Advanced Refinement',
        categoryLabelFa: 'بهینه‌سازی پیشرفته و شبکه',
        subtitle: 'Systematic least-squares lattice parameter refinement eliminating zero-shift & eccentricity',
        subtitleFa: 'بهینه‌سازی دقیق پارامترهای شبکه با حذف خطاهای سیستماتیک زاویه‌ای',
        formula: '∑ α_i A_ik = ∑ α_i sin²θ_i',
        badge: 'Least Squares',
        icon: <Grid className={`${iconClass} text-emerald-400`} />,
        accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
        tags: ['Cohen', 'Lattice Refinement', 'Systematic Errors', 'Matrix Inversion']
      },
      {
        id: 'metric_tensor',
        label: 'Metric Tensor Reciprocal Algebra',
        labelFa: 'جبر تانسور متریک در فضای وارون',
        category: 'refinement',
        categoryLabel: 'Advanced Refinement',
        categoryLabelFa: 'بهینه‌سازی پیشرفته و شبکه',
        subtitle: 'Direct and reciprocal covariant G-tensor algebra, interplanar angles & volumes',
        subtitleFa: 'تانسور متریک کوواریانت مستقیم و وارون، فواصل و زوایای بین‌صفحه‌ای',
        formula: 'G = [a·a  a·b  a·c; b·a  b·b  b·c; c·a  c·b  c·c], G* = G⁻¹',
        badge: 'Tensor Algebra',
        icon: <Sparkles className={`${iconClass} text-amber-400`} />,
        accentColor: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
        tags: ['Metric Tensor', 'Reciprocal Space', 'Direct Lattice', 'G-matrix']
      },
      {
        id: 'supercell_transform',
        label: 'Supercell & Matrix Engine',
        labelFa: 'موتور تبدیل سوپرسل و ماتریس',
        category: 'refinement',
        categoryLabel: 'Advanced Refinement',
        categoryLabelFa: 'بهینه‌سازی پیشرفته و شبکه',
        subtitle: 'Linear basis transformation [P-matrix], subcell expansion & Wyckoff propagation',
        subtitleFa: 'تبدیل پایه خطی ماتریسی، گسترش سلول‌های بزرگ و مختصات وایکوف',
        formula: '[a\' b\' c\'] = [a b c] · P',
        badge: 'Supercell',
        icon: <Grid className={`${iconClass} text-violet-400`} />,
        accentColor: 'from-violet-500/20 to-indigo-500/20 text-violet-400 border-violet-500/30',
        tags: ['Supercell', 'Transformation Matrix', 'Subcell', 'Basis Change']
      },
      {
        id: 'pawley_lebail',
        label: 'Pawley & Le Bail Profile Fitting',
        labelFa: 'برازش پروفایل پاولی و لو بایل',
        category: 'refinement',
        categoryLabel: 'Advanced Refinement',
        categoryLabelFa: 'بهینه‌سازی پیشرفته و شبکه',
        subtitle: 'Structureless whole-powder pattern profile fitting extracting integrated peak intensities',
        subtitleFa: 'برازش بدون مدل ساختاری کل الگو جهت استخراج شدت‌های تجمیعی',
        formula: 'I_k = ∑_i [w_i y_i · (S_k Ω_ik / ∑_k\' S_k\' Ω_ik\')]',
        badge: 'Whole Pattern',
        icon: <Activity className={`${iconClass} text-cyan-400`} />,
        accentColor: 'from-cyan-500/20 to-sky-500/20 text-cyan-400 border-cyan-500/30',
        tags: ['Pawley', 'Le Bail', 'Profile Decomposition', 'Structureless']
      },
      {
        id: 'rir',
        label: 'Reference Intensity Ratio (RIR)',
        labelFa: 'نسبت شدت مرجع (RIR / چانگ)',
        category: 'refinement',
        categoryLabel: 'Advanced Refinement',
        categoryLabelFa: 'بهینه‌سازی پیشرفته و شبکه',
        subtitle: 'Quantitative multi-phase weight fraction analysis using corundum I/I_c standards',
        subtitleFa: 'تحلیل کمّی کسر وزنی چندفازی با استفاده از استانداردهای کوراندوم I/Ic',
        formula: 'W_a = (I_a / RIR_a) / ∑ (I_i / RIR_i)',
        badge: 'Quant Phase',
        icon: <Layers className={`${iconClass} text-pink-400`} />,
        accentColor: 'from-pink-500/20 to-purple-500/20 text-pink-400 border-pink-500/30',
        tags: ['RIR', 'Quantitative Analysis', 'Chung Method', 'Corundum Standard']
      },

      // 4. Advanced Simulation & Core Engines (5 sections)
      {
        id: 'rietveld',
        label: 'Rietveld Whole-Pattern Setup',
        labelFa: 'تنظیمات و بهینه‌سازی ریتولد',
        category: 'simulation',
        categoryLabel: 'Advanced Simulation',
        categoryLabelFa: 'شبیه‌سازی پیشرفته و کدنویسی',
        subtitle: 'Full crystal structural refinement, background models, scale factors & R_wp metrics',
        subtitleFa: 'پالایش کامل ساختار بلوری، مدلسازی زمینه و شاخص‌های آماری Rwp',
        formula: 'R_wp = √[ ∑ w_i (y_i - y_ci)² / ∑ w_i y_i² ]',
        badge: 'Rietveld Refinement',
        icon: <Sliders className={`${iconClass} text-indigo-400`} />,
        accentColor: 'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30',
        tags: ['Rietveld', 'Full Pattern', 'R_wp', 'Scale Factor', 'Background']
      },
      {
        id: 'neutron',
        label: 'Neutron Powder Diffraction',
        labelFa: 'پراش نوترونی پودر',
        category: 'simulation',
        categoryLabel: 'Advanced Simulation',
        categoryLabelFa: 'شبیه‌سازی پیشرفته و کدنویسی',
        subtitle: 'Nuclear scattering lengths (b), light atom sensitivity & non-decaying form factors',
        subtitleFa: 'طول پراکندگی هسته‌ای، حساسیت به اتم‌های سبک و فاکتورهای غیرمیرا',
        formula: 'F_N(hkl) = ∑ b_j · exp[2πi(hx_j + ky_j + lz_j)]',
        badge: 'Nuclear Scattering',
        icon: <Orbit className={`${iconClass} text-amber-400`} />,
        accentColor: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
        tags: ['Neutron', 'Nuclear Length', 'Light Atoms', 'Constant b']
      },
      {
        id: 'magnetic',
        label: 'Magnetic Scattering Simulator',
        labelFa: 'شبیه‌ساز پراکندگی مغناطیسی',
        category: 'simulation',
        categoryLabel: 'Advanced Simulation',
        categoryLabelFa: 'شبیه‌سازی پیشرفته و کدنویسی',
        subtitle: 'Spin-polarized magnetic structure factor, magnetic moment vectors & superlattices',
        subtitleFa: 'فاکتور ساختار مغناطیسی، بردارهای گشتاور اسپینی و ابرشبکه‌ها',
        formula: 'F_M(Q) = ∑ p · S_j^⊥ · exp[i Q · r_j]',
        badge: 'Spin Moments',
        icon: <Magnet className={`${iconClass} text-red-400`} />,
        accentColor: 'from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30',
        tags: ['Magnetic Scattering', 'Spin Moments', 'Form Factor', 'Polarized']
      },
      {
        id: 'xrd_nano',
        label: 'Nano-Crystallite Simulator',
        labelFa: 'شبیه‌ساز نانوبلورک‌های محدود',
        category: 'simulation',
        categoryLabel: 'Advanced Simulation',
        categoryLabelFa: 'شبیه‌سازی پیشرفته و کدنویسی',
        subtitle: 'Finite lattice Debye formula scattering, surface relaxation & particle morphologies',
        subtitleFa: 'فرمول پراکندگی دبای برای شبکه‌های محدود، آرامش سطحی و مورفولوژی ذره',
        formula: 'I(Q) = ∑_i ∑_j f_i f_j · [sin(Q r_ij) / (Q r_ij)]',
        badge: 'Debye Scattering',
        icon: <Wand2 className={`${iconClass} text-teal-400`} />,
        accentColor: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30',
        tags: ['Nano-Crystallite', 'Debye Formula', 'Finite Size', 'Morphology']
      },
      {
        id: 'python_export',
        label: 'Python Script Generator',
        labelFa: 'تولیدکننده کدهای پایتون',
        category: 'simulation',
        categoryLabel: 'Advanced Simulation',
        categoryLabelFa: 'شبیه‌سازی پیشرفته و کدنویسی',
        subtitle: 'Automated reproducible Python scripts (PyXRD, GSAS-II, pymatgen & diffpy)',
        subtitleFa: 'تولید خودکار اسکریپت‌های پایتون برای پردازش با کتابخانه‌های استاندارد',
        formula: 'import diffpy.structure, pymatgen',
        badge: 'Python Export',
        icon: <Terminal className={`${iconClass} text-blue-400`} />,
        accentColor: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
        tags: ['Python', 'PyXRD', 'GSAS-II', 'pymatgen', 'Automation']
      },

      // 5. AI, Deep Learning & Vision (3 sections)
      {
        id: 'dl',
        label: 'Deep Learning & Spectral Alignment',
        labelFa: 'یادگیری عمیق و انطباق طیفی',
        category: 'ai',
        categoryLabel: 'AI & Deep Learning',
        categoryLabelFa: 'هوش مصنوعی و یادگیری عمیق',
        subtitle: '1D-ResNet phase classifier, physics-informed neural network (PINN) & sub-milli-degree spectral alignment',
        subtitleFa: 'شناسایی فاز با ResNet یک‌بعدی، شبکه‌های آگاه از فیزیک و انطباق میلی‌درجه',
        formula: 'L_PINN = L_CE + λ_1·L_Bragg + λ_2·L_Rwp',
        badge: '1D-ResNet & PINN',
        icon: <Brain className={`${iconClass} text-violet-400`} />,
        accentColor: 'from-violet-500/20 to-fuchsia-500/20 text-violet-400 border-violet-500/30',
        tags: ['Deep Learning', 'Neural Net', 'PINN', 'Spectral Alignment', 'ResNet']
      },
      {
        id: 'image_analysis',
        label: 'Diffractogram Computer Vision',
        labelFa: 'بینایی ماشین و تحلیل تصاویر طیف',
        category: 'ai',
        categoryLabel: 'AI & Deep Learning',
        categoryLabelFa: 'هوش مصنوعی و یادگیری عمیق',
        subtitle: 'Extract 2θ vs intensity coordinates directly from scanned diffractogram images and plots',
        subtitleFa: 'استخراج داده‌های عددی زوایا و شدت مستقیماً از تصاویر و مقالات',
        formula: 'I(x, y) → (2θ, Intensity)',
        badge: 'Computer Vision',
        icon: <ImageIcon className={`${iconClass} text-purple-400`} />,
        accentColor: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
        tags: ['Computer Vision', 'Image OCR', 'Digitization', 'Plot Extraction']
      },
      {
        id: 'image_gen',
        label: 'Scientific Crystal Illustrator',
        labelFa: 'تصویرساز علمی بلورها',
        category: 'ai',
        categoryLabel: 'AI & Deep Learning',
        categoryLabelFa: 'هوش مصنوعی و یادگیری عمیق',
        subtitle: 'Generate publication-quality 3D lattice illustrations and diffraction diagrams',
        subtitleFa: 'تولید تصاویر سه‌بعدی و شماتیک‌های بلورشناسی با کیفیت مقالات',
        formula: 'AI Generative Crystallography',
        badge: 'Crystal Art',
        icon: <Sparkles className={`${iconClass} text-pink-400`} />,
        accentColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
        tags: ['Illustrator', '3D Lattice', 'Publication Figures', 'Crystal Gen']
      },

      // 6. Intelligence, Protocols & Laboratory (5 sections)
      {
        id: 'learn',
        label: 'Protocol Guide & Theory Reference',
        labelFa: 'راهنمای پروتکل و رفرانس نظریه',
        category: 'intelligence',
        categoryLabel: 'Intelligence & Laboratory',
        categoryLabelFa: 'اطلاعات، پروتکل‌ها و آزمایشگاه',
        subtitle: 'Instrument calibration standards (NIST SRM 640), sample prep guidelines & measurement SOPs',
        subtitleFa: 'استانداردهای کالیبراسیون دستگاه، آماده‌سازی نمونه و دستورالعمل‌ها',
        formula: 'NIST SRM 640 & ICDD Best Practices',
        badge: 'Standards & SOP',
        icon: <BookOpen className={`${iconClass} text-emerald-400`} />,
        accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
        tags: ['Protocol Guide', 'NIST Standards', 'SOP', 'Calibration']
      },
      {
        id: 'periodic_table',
        label: 'Crystallographic Periodic Table',
        labelFa: 'جدول تناوبی بلورشناسی',
        category: 'intelligence',
        categoryLabel: 'Intelligence & Laboratory',
        categoryLabelFa: 'اطلاعات، پروتکل‌ها و آزمایشگاه',
        subtitle: 'Atomic form factors f₀(Q), absorption edges (K, L) & characteristic emission lines (Cu, Mo, Co)',
        subtitleFa: 'فاکتورهای فرم اتمی، لبه‌های جذب و خطوط مشخصه تابش‌ها',
        formula: 'f_0(s) = ∑ a_i · exp(-b_i s²) + c',
        badge: 'Elements',
        icon: <Grid className={`${iconClass} text-cyan-400`} />,
        accentColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
        tags: ['Periodic Table', 'Atomic Form Factor', 'Emission Lines', 'Absorption']
      },
      {
        id: 'database',
        label: 'Material & Mineral Registry',
        labelFa: 'بانک داده مواد و کانی‌ها',
        category: 'intelligence',
        categoryLabel: 'Intelligence & Laboratory',
        categoryLabelFa: 'اطلاعات، پروتکل‌ها و آزمایشگاه',
        subtitle: 'Searchable crystallographic database with benchmark powder diffraction profiles and references',
        subtitleFa: 'پایگاه داده جامع با الگوهای مرجع، مشخصات بلوری و منابع استاندارد',
        formula: 'JCPDS / COD Benchmarks',
        badge: 'Registry',
        icon: <Database className={`${iconClass} text-amber-400`} />,
        accentColor: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
        tags: ['Database', 'Materials', 'COD', 'Minerals', 'Benchmarks']
      },
      {
        id: 'profile',
        label: 'Laboratory Director Profile',
        labelFa: 'پروفایل مدیر آزمایشگاه',
        category: 'intelligence',
        categoryLabel: 'Intelligence & Laboratory',
        categoryLabelFa: 'اطلاعات، پروتکل‌ها و آزمایشگاه',
        subtitle: 'Operator credentials, institutional accreditation, research badges & session logbook',
        subtitleFa: 'مشخصات اپراتور، اعتبار سازمانی، سوابق و دفتر ثبت محاسبات',
        formula: 'XRD Operator Credentials & Certs',
        badge: 'Credentials',
        icon: <User className={`${iconClass} text-violet-400`} />,
        accentColor: 'from-violet-500/20 to-indigo-500/20 text-violet-400 border-violet-500/30',
        tags: ['Profile', 'Operator', 'Accreditation', 'Logbook']
      },
      {
        id: 'settings',
        label: 'System & Calculation Settings',
        labelFa: 'تنظیمات سیستم و محاسبات',
        category: 'intelligence',
        categoryLabel: 'Intelligence & Laboratory',
        categoryLabelFa: 'اطلاعات، پروتکل‌ها و آزمایشگاه',
        subtitle: 'Precision tolerances, instrumental profiles, color themes, sound effects & unit configurations',
        subtitleFa: 'دقت اعشار محاسباتی، تم‌های گرافیکی، جلوه‌های صوتی و پیکربندی واحدها',
        formula: 'Global Configuration & Constants',
        badge: 'Preferences',
        icon: <Settings2 className={`${iconClass} text-slate-400`} />,
        accentColor: 'from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/30',
        tags: ['Settings', 'Precision', 'Theme', 'Configuration']
      }
    ];
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allSections.length,
      fundamentals: 0,
      strain: 0,
      refinement: 0,
      simulation: 0,
      ai: 0,
      intelligence: 0
    };
    allSections.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allSections]);

  // Filtered sections based on query & category
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSections.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCategory) return false;
      if (!q) return true;

      return (
        item.label.toLowerCase().includes(q) ||
        item.labelFa.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.subtitleFa.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.categoryLabelFa.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [allSections, searchQuery, selectedCategory]);

  const categories = useMemo(() => [
    { id: 'all', label: t('All Sections', 'All Sections'), labelFa: 'همه ۳۴ بخش', count: categoryCounts.all },
    { id: 'fundamentals', label: t('Fundamentals & Optics', 'Fundamentals & Optics'), labelFa: 'اصول و اپتیک', count: categoryCounts.fundamentals },
    { id: 'strain', label: t('Size & Strain Microstructure', 'Size & Strain Microstructure'), labelFa: 'اندازه و کرنش', count: categoryCounts.strain },
    { id: 'refinement', label: t('Advanced Refinement', 'Advanced Refinement'), labelFa: 'بهینه‌سازی پیشرفته', count: categoryCounts.refinement },
    { id: 'simulation', label: t('Advanced Simulation', 'Advanced Simulation'), labelFa: 'شبیه‌سازی و کد', count: categoryCounts.simulation },
    { id: 'ai', label: t('AI & Deep Learning', 'AI & Deep Learning'), labelFa: 'هوش مصنوعی', count: categoryCounts.ai },
    { id: 'intelligence', label: t('Intelligence & Tools', 'Intelligence & Tools'), labelFa: 'ابزارها و مراجع', count: categoryCounts.intelligence },
  ], [categoryCounts, t]);

  const previousActiveItem = useMemo(() => {
    return allSections.find(s => s.id === previousActiveModule) || allSections[0];
  }, [allSections, previousActiveModule]);

  const handleSelect = (id: ResumeModuleId) => {
    playSynthTone('success');
    onSelectSection(id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
            className="relative w-full max-w-5xl my-auto bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-950/70 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Atmospheric Glows */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-600/15 via-violet-600/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Section */}
            <div className="relative px-5 sm:px-8 pt-6 pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white shrink-0 border border-white/20">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {isRTL ? 'انتخاب بخش جهت ادامه' : 'Session Resume Portal'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {allSections.length} {isRTL ? 'بخش موجود' : 'Sections Available'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                      {isRTL 
                        ? 'مایلید محاسبات را در کدام بخش ادامه دهید؟' 
                        : 'Which section would you like to resume into?'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      {isRTL
                        ? 'برای ادامه کار، هر یک از ۳۴ بخش تخصصی بلورشناسی زیر را انتخاب کنید. بدون ورود خودکار به براگ.'
                        : 'Select any of the 34 crystallography & diffraction sections below to resume your session. No automatic jump to Bragg.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                  title={isRTL ? 'بستن' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Resume Previous Session Banner */}
              {previousActiveItem && (
                <div className="mt-4 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                          {isRTL ? 'آخرین بخش فعال در جلسه قبل:' : 'Last Active in Previous Session:'}
                        </span>
                        <span className="px-2 py-0.2 rounded-md bg-indigo-500/30 text-white font-mono text-[10px] font-bold border border-indigo-400/30">
                          {isRTL ? previousActiveItem.labelFa : previousActiveItem.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {previousActiveItem.formula}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelect(previousActiveItem.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRTL ? `ادامه در ${previousActiveItem.labelFa}` : `Resume in ${previousActiveItem.label}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Search Bar & Category Filter Bar */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? 'جستجو در تمام ۳۴ بخش بر اساس نام، فرمول ریاضی، کلمات کلیدی...' : 'Search all 34 sections by name, formula, keywords...'}
                    className={`w-full py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors ${
                      isRTL ? 'pr-10 pl-9' : 'pl-10 pr-9'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white ${isRTL ? 'left-3' : 'right-3'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive 
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' 
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span>{isRTL ? cat.labelFa : cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? 'bg-indigo-700/60 text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Sections Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              {filteredSections.length === 0 ? (
                <div className="py-16 text-center">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">
                    {isRTL ? 'بخشی با این مشخصات یافت نشد' : 'No sections matched your query'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {isRTL ? 'کلمه دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.' : 'Try a different search keyword or select "All Sections" filter.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-xs font-mono font-bold border border-indigo-500/40 cursor-pointer"
                  >
                    {isRTL ? 'مشاهده تمام ۳۴ بخش' : 'Show All 34 Sections'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredSections.map((item) => {
                    const isPrevious = item.id === previousActiveModule;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`group relative p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isPrevious 
                            ? 'border-indigo-500/70 shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-500/50' 
                            : 'border-white/10 hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-950/40'
                        }`}
                      >
                        {/* Previous Active Pin */}
                        {isPrevious && (
                          <div className={`absolute -top-2.5 ${isRTL ? 'left-3' : 'right-3'} px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-mono font-bold shadow-md flex items-center gap-1 border border-white/20`}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{isRTL ? 'جلسه قبلی' : 'Previous Session'}</span>
                          </div>
                        )}

                        <div>
                          {/* Top Row: Icon + Category Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:scale-105 group-hover:border-indigo-500/50 transition-all shrink-0">
                              {item.icon}
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 truncate max-w-[150px]">
                              {isRTL ? item.categoryLabelFa : item.categoryLabel}
                            </span>
                          </div>

                          {/* Section Title */}
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {isRTL ? item.labelFa : item.label}
                          </h4>

                          {/* English subtitle if RTL, or secondary description */}
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {isRTL ? item.subtitleFa : item.subtitle}
                          </p>
                        </div>

                        {/* Bottom Row: Formula & Action Button */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <code className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30 truncate max-w-[160px]">
                            {item.formula}
                          </code>

                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold font-mono flex items-center gap-1 transition-all group-hover:bg-indigo-600 group-hover:text-white"
                          >
                            <span>{isRTL ? 'انتخاب' : 'Resume'}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {isRTL 
                    ? 'تمام ۳۴ ماژول تخصصی پراش پرتو ایکس و بلورشناسی در دسترس هستند.' 
                    : 'All 34 specialized XRD and crystallography modules are ready.'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {isRTL ? 'کلید Esc جهت انصراف' : 'Press Esc or click outside to cancel'}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResumeSectionPickerModal;
