import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Box,
  Sliders,
  Hash,
  Layers,
  Microscope,
  TrendingUp,
  Cpu,
  Brain,
  Database,
  Atom,
  FlaskConical,
  Compass,
  Shapes,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
  LineChart,
  Target
} from 'lucide-react';

export type ModuleCategory = 'all' | 'fundamentals' | 'strain' | 'refinement' | 'thin_films' | 'ai_data';

export interface ScientificModuleItem {
  id: string;
  title: string;
  category: ModuleCategory;
  categoryLabel: string;
  description: string;
  icon: any;
  badge?: string;
  formula?: string;
  highlight?: boolean;
}

export const SCIENTIFIC_MODULES: ScientificModuleItem[] = [
  // 1. Fundamentals
  {
    id: 'bragg',
    title: "Bragg's Law Solver",
    category: 'fundamentals',
    categoryLabel: 'Fundamentals',
    description: "High-precision nλ = 2d sin(θ) solver, reciprocal space vector mapping, and standard laboratory anode library.",
    icon: Activity,
    badge: 'Core Engine',
    formula: 'nλ = 2d sin θ',
    highlight: true
  },
  {
    id: 'unit_cells',
    title: 'Unit Cells & Lattices 3D',
    category: 'fundamentals',
    categoryLabel: 'Fundamentals',
    description: 'Interactive 3D crystal systems (Cubic, Tetragonal, Orthorhombic, Hexagonal), fractional coordinates, and packing factors.',
    icon: Box,
    badge: '3D Interactive',
    formula: 'V = abc√(1 - cos²α - ...)'
  },
  {
    id: 'fwhm',
    title: 'FWHM & Peak Profiling',
    category: 'fundamentals',
    categoryLabel: 'Fundamentals',
    description: 'Instrumental line broadening calibration using Caglioti polynomials U, V, W with resolution curve plots.',
    icon: Sliders,
    badge: 'Caglioti Model',
    formula: 'H² = U tan²θ + V tanθ + W'
  },
  {
    id: 'selection',
    title: 'Systematic Absences & Rules',
    category: 'fundamentals',
    categoryLabel: 'Fundamentals',
    description: 'Bravais centering extinction conditions, glide planes, screw axes, and space group allowed reflections.',
    icon: Hash,
    badge: 'Group Theory',
    formula: 'h + k = 2n (Base-Centered)'
  },
  {
    id: 'metric_tensor',
    title: 'Crystallographic Metric Tensor',
    category: 'fundamentals',
    categoryLabel: 'Fundamentals',
    description: 'Direct [G] and reciprocal [G*] metric tensors for calculating interplanar d-spacings and inter-plane angles.',
    icon: Compass,
    badge: 'Tensor Calculus',
    formula: 'd* = √(hᵀ G* h)'
  },
  {
    id: 'supercell_transform',
    title: 'Supercell & Transformations',
    category: 'fundamentals',
    categoryLabel: 'Fundamentals',
    description: 'Coordinate transformation matrices [M], primitive to conventional conversions, and supercell expansions.',
    icon: Shapes,
    badge: 'Matrix Operations',
    formula: "a' = M₁₁a + M₁₂b + M₁₃c"
  },

  // 2. Microstructure & Strain
  {
    id: 'scherrer',
    title: 'Scherrer Crystallite Domain Size',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Compute coherent scattering domain dimensions (D) from diffraction line breadth with shape factor K.',
    icon: Microscope,
    badge: 'Nano Sizing',
    formula: 'D = Kλ / (β cos θ)',
    highlight: true
  },
  {
    id: 'wh',
    title: 'Williamson-Hall Analysis',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Deconvolute finite crystallite size from uniform deformation stress/strain (UDM, USDM, UDEDM models).',
    icon: TrendingUp,
    badge: 'Microstrain Plot',
    formula: 'β cos θ = Kλ/D + 4ε sin θ',
    highlight: true
  },
  {
    id: 'monshi_scherrer',
    title: 'Monshi-Scherrer Method',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Logarithmic linear regression transformation of Scherrer equation for high-accuracy nanodomain extraction.',
    icon: LineChart,
    badge: 'Log Linear',
    formula: 'ln(β) = ln(Kλ/D) + ln(1/cos θ)'
  },
  {
    id: 'double_voigt',
    title: 'Double-Voigt Deconvolution',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Decouple Lorentzian size components and Gaussian strain components across multi-order diffraction peaks.',
    icon: Layers,
    badge: 'Voigt Profile',
    formula: 'V(x) = G(x) ⊗ L(x)'
  },
  {
    id: 'integral',
    title: 'Integral Breadth Analysis',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Peak area divided by maximum intensity (β = A/I₀) for robust microstructural sizing without peak shape bias.',
    icon: Sliders,
    badge: 'Integral Breadth',
    formula: 'β = ∫ I(2θ) d(2θ) / I_max'
  },
  {
    id: 'integral_adv',
    title: 'Advanced Integral Breadth Studio',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Full Fourier deconvolution of physical profile from instrumental profile with Halder-Wagner approximations.',
    icon: FlaskConical,
    badge: 'Halder-Wagner',
    formula: '(β*/d*)² = 1/D · (β*/d*²) + (ε/2)²'
  },
  {
    id: 'wa',
    title: 'Warren-Averbach Fourier Method',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Fourier coefficient harmonic decomposition yielding true column-length distribution and mean squared strain.',
    icon: Cpu,
    badge: 'Fourier Analysis',
    formula: 'A(L) = Aˢ(L) · Aᴰ(L)'
  },
  {
    id: 'method_of_moments',
    title: 'Method of Moments (Variance)',
    category: 'strain',
    categoryLabel: 'Size & Strain',
    description: 'Wilson variance and asymptotic slope evaluation for dislocation densities and crystallite dimension distributions.',
    icon: LineChart,
    badge: 'Moment Analysis',
    formula: 'W(2θ) = ⟨(2θ - ⟨2θ⟩)²⟩'
  },

  // 3. Phase & Refinement
  {
    id: 'rietveld',
    title: 'Rietveld Refinement Lab',
    category: 'refinement',
    categoryLabel: 'Refinement',
    description: 'Full powder diffraction pattern least-squares fitting, atomic coordinate refinement, R_wp minimization, and difference plots.',
    icon: Cpu,
    badge: 'Full Pattern',
    formula: 'χ² = ∑ wᵢ (yᵢᵒᵇˢ - yᵢᶜᵃˡᶜ)²',
    highlight: true
  },
  {
    id: 'pawley_lebail',
    title: 'Pawley & Le Bail Extraction',
    category: 'refinement',
    categoryLabel: 'Refinement',
    description: 'Model-free whole powder pattern decomposition to extract individual reflection intensities without structural coordinates.',
    icon: Layers,
    badge: 'Structure-Free',
    formula: 'I_k = ∑ w_ik · (y_i / y_calc) · I_k'
  },
  {
    id: 'cohen',
    title: 'Cohen Least-Squares Refinement',
    category: 'refinement',
    categoryLabel: 'Refinement',
    description: 'Systematic error elimination (zero shift, sample displacement) via simultaneous linear matrix solving for true lattice constants.',
    icon: Target,
    badge: 'Matrix Solve',
    formula: 'cos²θ / sinθ error drift'
  },
  {
    id: 'rir',
    title: 'Reference Intensity Ratio (RIR)',
    category: 'refinement',
    categoryLabel: 'Refinement',
    description: 'Quantitative multi-phase mixture analysis using calibrated I/I_corundum standards and Chung matrix flushing.',
    icon: FlaskConical,
    badge: 'Quantitative Phase',
    formula: 'X_A = (I_A / RIR_A) / ∑ (I_i / RIR_i)'
  },
  {
    id: 'compare',
    title: 'Diffraction Pattern Compare',
    category: 'refinement',
    categoryLabel: 'Refinement',
    description: 'Multi-specimen overlay visualizer for detecting polymorphic phase transitions, lattice expansion shifts, and solid solutions.',
    icon: Layers,
    badge: 'Multi Overlay',
    formula: 'Δ(2θ) peak tracking'
  },
  {
    id: 'preferred_orientation',
    title: 'March-Dollase Orientation',
    category: 'refinement',
    categoryLabel: 'Refinement',
    description: 'Correction for preferred crystallite alignment and texture in plate-like or needle-like crystallographic specimens.',
    icon: Shapes,
    badge: 'Texture Correction',
    formula: 'P(α) = (r² cos²α + r⁻¹ sin²α)⁻¹·⁵'
  },

  // 4. Thin Films & Special
  {
    id: 'xrr',
    title: 'X-Ray Reflectivity (XRR)',
    category: 'thin_films',
    categoryLabel: 'Thin Films',
    description: 'Determine ultra-thin film thickness from Kiessig interference oscillations, interface roughness, and SLD electron density.',
    icon: LineChart,
    badge: 'Parratt Formalism',
    formula: 'θₘ² - θ_c² = m² (λ / 2t)²',
    highlight: true
  },
  {
    id: 'residual_stress',
    title: 'Residual Stress (sin²ψ)',
    category: 'thin_films',
    categoryLabel: 'Thin Films',
    description: 'Angle-resolved tilt goniometry for measuring in-plane surface residual stresses in industrial alloys and ceramic coatings.',
    icon: Target,
    badge: 'Elastic Tensor',
    formula: 'd_ψ = d₀ · [1 + (1+ν)/E · σ sin²ψ]'
  },
  {
    id: 'neutron',
    title: 'Neutron Powder Diffraction',
    category: 'thin_films',
    categoryLabel: 'Scattering',
    description: 'Nuclear scattering lengths for distinguishing light atoms (Hydrogen, Lithium, Oxygen) and adjacent periodic table neighbors.',
    icon: Atom,
    badge: 'Nuclear Scattering',
    formula: 'b_coh isotope contrast'
  },
  {
    id: 'magnetic',
    title: 'Magnetic Neutron Scattering',
    category: 'thin_films',
    categoryLabel: 'Scattering',
    description: 'Dipolar neutron interaction with unpaired electron magnetic spins for magnetic superstructures and antiferromagnetic ordering.',
    icon: Atom,
    badge: 'Magnetic Ordering',
    formula: 'q_mag = ê × (M̂ × ê)'
  },
  {
    id: 'xrd_nano',
    title: 'Nano-Crystalline Modeler',
    category: 'thin_films',
    categoryLabel: 'Thin Films',
    description: 'Grazing incidence geometry (GIXRD) and penetration depth calculations for nano-coatings and surface thin films.',
    icon: Microscope,
    badge: 'GIXRD Geometry',
    formula: 'z_1/e = λ / (4π Im(k_z))'
  },

  // 5. AI & Intelligent Tools
  {
    id: 'dl',
    title: 'AI Phase Identification',
    category: 'ai_data',
    categoryLabel: 'AI & Data',
    description: 'Deep neural network phase recognition trained on inorganic crystallographic databases for rapid phase matching in high-noise scans.',
    icon: Brain,
    badge: 'Neural Match',
    formula: 'P(Phase_k | Pattern) > 98%',
    highlight: true
  },
  {
    id: 'image_analysis',
    title: 'OpenCV Ring Analysis',
    category: 'ai_data',
    categoryLabel: 'AI & Data',
    description: 'Client-side computer vision engine to detect 2D Debye-Scherrer rings, find beam centers, and integrate 1D diffractograms.',
    icon: Activity,
    badge: 'CV 5.x Native',
    formula: 'I(2θ) = ∮ I(R, φ) dφ'
  },
  {
    id: 'database',
    title: 'Inorganic Crystal Database (COD)',
    category: 'ai_data',
    categoryLabel: 'AI & Data',
    description: 'Comprehensive offline-first database with over 500,000 crystal records, unit cell dimensions, space groups, and standard reflections.',
    icon: Database,
    badge: 'COD & Materials',
    formula: '500,000+ Structures'
  },
  {
    id: 'periodic_table',
    title: 'Interactive Periodic Table & X-Ray Db',
    category: 'ai_data',
    categoryLabel: 'AI & Data',
    description: 'Mass attenuation coefficients (μ/ρ), characteristic emission lines (Kα₁, Kα₂, Kβ), absorption edges, and atomic form factors.',
    icon: Atom,
    badge: 'NIST Database',
    formula: 'I = I₀ e^(-μ·x)'
  },
  {
    id: 'python_export',
    title: 'Python & Script Exporter',
    category: 'ai_data',
    categoryLabel: 'AI & Data',
    description: 'Generate production-ready Python scripts using NumPy, SciPy, and Matplotlib to automate batch refinements and reproducible reporting.',
    icon: FileText,
    badge: 'Code Generator',
    formula: 'import xrd_calc as xrd'
  },
  {
    id: 'learn',
    title: 'Academic Crystallography Hub',
    category: 'ai_data',
    categoryLabel: 'AI & Data',
    description: 'Interactive educational textbook modules covering reciprocal space, Ewald sphere construction, and diffraction physics.',
    icon: FlaskConical,
    badge: 'Educational',
    formula: 'Ewald Sphere: |k| = 1/λ'
  }
];

interface ModulesDirectoryProps {
  onLaunchModule: (moduleId: string) => void;
  isRTL?: boolean;
}

export const ModulesDirectory: React.FC<ModulesDirectoryProps> = ({
  onLaunchModule,
  isRTL = false
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: ModuleCategory; label: string; count: number }[] = useMemo(() => [
    { id: 'all', label: t('All Instruments', 'All Instruments'), count: SCIENTIFIC_MODULES.length },
    { id: 'fundamentals', label: t('Fundamentals & Lattices', 'Fundamentals & Lattices'), count: SCIENTIFIC_MODULES.filter(m => m.category === 'fundamentals').length },
    { id: 'strain', label: t('Crystallite Size & Strain', 'Crystallite Size & Strain'), count: SCIENTIFIC_MODULES.filter(m => m.category === 'strain').length },
    { id: 'refinement', label: t('Refinement & Deconvolution', 'Refinement & Deconvolution'), count: SCIENTIFIC_MODULES.filter(m => m.category === 'refinement').length },
    { id: 'thin_films', label: t('Thin Films & Scattering', 'Thin Films & Scattering'), count: SCIENTIFIC_MODULES.filter(m => m.category === 'thin_films').length },
    { id: 'ai_data', label: t('AI & Scientific Databases', 'AI & Scientific Databases'), count: SCIENTIFIC_MODULES.filter(m => m.category === 'ai_data').length }
  ], [t]);

  const filteredModules = useMemo(() => {
    return SCIENTIFIC_MODULES.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.formula && item.formula.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="modules" className="py-28 px-6 relative z-10 border-t border-slate-800/80 bg-[#040814]">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/5 blur-[160px] pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-300">
              {t("Institutional 30+ Instrument Suite", "Institutional 30+ Instrument Suite")}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            {t("Specialized Analytical Instruments", "Specialized Analytical Instruments")}
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
            {t("Every instrument is engineered to institutional rigor. Click any module below to launch directly into the computational environment.", "Every instrument is engineered to institutional rigor. Click any module below to launch directly into the computational environment.")}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-800/80">
          {/* Categories Pill Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 border border-violet-400/40'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Inline Search Filter */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Filter instruments...", "Filter instruments...")}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.4 }}
                onClick={() => onLaunchModule(item.id)}
                className={`group relative bg-[#070D1A]/90 hover:bg-[#0B1224] border ${
                  item.highlight ? 'border-violet-500/40 shadow-lg shadow-violet-950/20' : 'border-slate-800/80'
                } hover:border-violet-500/60 p-6 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden`}
              >
                {/* Subtle gradient hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-violet-400 group-hover:text-cyan-300 group-hover:border-violet-500/40 group-hover:scale-105 transition-all duration-300 shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors mb-1.5 flex items-center gap-1.5">
                    <span>{item.title}</span>
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors font-medium line-clamp-3 mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between relative z-10 mt-2">
                  {item.formula ? (
                    <span className="text-[10px] font-mono text-cyan-400/90 font-medium truncate max-w-[170px]">
                      {item.formula}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      {item.categoryLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">
                    <span>{t("Launch", "Launch")}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search empty state */}
        {filteredModules.length === 0 && (
          <div className="text-center py-16 bg-slate-950/60 border border-slate-800/60 rounded-3xl p-8">
            <p className="text-sm font-bold text-slate-300 mb-1">
              {t("No instruments match your search criteria", "No instruments match your search criteria")}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {t("Try searching for 'Rietveld', 'Scherrer', 'XRR', or clear the filter.", "Try searching for 'Rietveld', 'Scherrer', 'XRR', or clear the filter.")}
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 rounded-xl text-xs font-bold transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
