import React, { useState, useMemo } from 'react';
import {
  Activity,
  Microscope,
  Layers,
  Cpu,
  Database,
  FileText,
  ArrowRight,
  Search,
  Compass,
  TrendingUp,
  BarChart3,
  Binary,
  Scale,
  Orbit,
  Sliders,
  Radio,
  Sparkles,
} from 'lucide-react';
import { AppSection } from '../../types';

export interface ScientificModuleItem {
  id: AppSection;
  title: string;
  category: 'diffraction' | 'microstructure' | 'refinement' | 'ai_database';
  categoryLabel: string;
  formula?: string;
  description: string;
  highlights: string[];
  icon: React.ElementType;
  accentColor: string;
  badge?: string;
}

export const SCIENTIFIC_MODULES: ScientificModuleItem[] = [
  {
    id: 'bragg',
    title: 'Bragg’s Law & Reciprocal Lattice Solver',
    category: 'diffraction',
    categoryLabel: 'Diffraction & Scattering',
    formula: 'nλ = 2d_{hkl} sin(θ)',
    description:
      'Solve interplanar d-spacings, diffraction angles 2θ, scattering vectors Q = 4πsinθ/λ, and multi-anode wavelength conversions.',
    highlights: ['Cu/Mo/Co/Cr/Ag/Fe Anodes', 'Harmonic Order n = 1..5', 'Direct Q & sinθ/λ Matrix'],
    icon: Compass,
    accentColor: '#06B6D4',
    badge: 'FUNDAMENTAL',
  },
  {
    id: 'rietveld',
    title: 'Rietveld Full-Pattern Structure Refinement',
    category: 'refinement',
    categoryLabel: 'Refinement & Thin Films',
    formula: 'Y_{calc}(2θ_i) = s ∑ I_K φ(2θ_i - 2θ_K) + y_b',
    description:
      '7-stage whole-powder-pattern least-squares engine refining Caglioti UVW, Pseudo-Voigt η, Chebyshev background, and atomic Wyckoff sites.',
    highlights: ['Rwp, Rp, Rexp & χ² GOF', 'Wyckoff Site Occupancy', 'Live Difference Plot Iobs−Icalc'],
    icon: Sliders,
    accentColor: '#10B981',
    badge: 'FULL-PATTERN',
  },
  {
    id: 'pdf_analysis',
    title: 'Pair Distribution Function (PDF) & Total Scattering',
    category: 'diffraction',
    categoryLabel: 'Diffraction & Scattering',
    formula: 'G(r) = (2/π) ∫ Q[S(Q) - 1] sin(Qr) dQ',
    description:
      'Sine-Fourier transformation of total scattering structure functions S(Q) into real-space atomic pair correlations G(r), R(r), and T(r).',
    highlights: ['Lorch Modification Window', 'Coordination Number N_c', 'Termination Ripple Diagnostics'],
    icon: Radio,
    accentColor: '#F59E0B',
    badge: 'TOTAL SCATTERING',
  },
  {
    id: 'xrr',
    title: 'X-Ray Reflectometry (XRR) Parratt Engine',
    category: 'refinement',
    categoryLabel: 'Refinement & Thin Films',
    formula: 'R_{j,j+1} = r_{j,j+1} exp(-2 k_{z,j} k_{z,j+1} σ_j²)',
    description:
      'Optical recursion solver for multilayer thin films: critical angle mass density, Kiessig fringe FFT thickness, and Nevot–Croce roughness.',
    highlights: ['Parratt Exact Recursion', 'Electron SLD Depth Profile', 'Kiessig Fringe Linear Regression'],
    icon: Orbit,
    accentColor: '#EC4899',
    badge: 'THIN-FILM OPTICS',
  },
  {
    id: 'scherrer',
    title: 'Scherrer Coherent Domain Sizing Studio',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: 'D = Kλ / (β_{struct} cosθ)',
    description:
      'Calculate volume-weighted crystallite sizes with Caglioti instrumental breadth subtraction and crystallographic habit K-factor calibration.',
    highlights: ['Gaussian / Lorentzian / Voigt Deconvolution', 'Morphology Shape Factor K', 'Multi-Peak Size Statistics'],
    icon: Microscope,
    accentColor: '#3B82F6',
    badge: 'NANOCRYSTALS',
  },
  {
    id: 'williamson',
    title: 'Williamson–Hall (UDM / USDM / UDEDM)',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: 'β_T cosθ = Kλ/D + 4ε sinθ',
    description:
      'Separate finite crystallite size broadening from heterogeneous lattice microstrain ε using isotropic and anisotropic Hooke elasticity models.',
    highlights: ['UDM, USDM & Energy Density UDEDM', 'Outlier Reflection Masking', 'Slope & Intercept Error Bounds'],
    icon: TrendingUp,
    accentColor: '#8B5CF6',
  },
  {
    id: 'warren',
    title: 'Warren–Averbach Fourier Line Profile Analysis',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: 'ln A(L) = ln A^S(L) - 2π² L² ⟨ε²(L)⟩ / d_{hkl}²',
    description:
      'Rigorous Fourier cosine series decomposition across multiple harmonic orders to extract column-length distributions and RMS strain ⟨ε²(L)⟩¹/².',
    highlights: ['Stokes Instrumental Deconvolution', 'Area-Weighted ⟨D⟩_A Distribution', 'Column Length L Dependence'],
    icon: Binary,
    accentColor: '#6366F1',
    badge: 'FOURIER SERIES',
  },
  {
    id: 'double_voigt',
    title: 'Double-Voigt Size–Strain Separation',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: 'β_G² = β_{GS}² + β_{GD}²,  β_L = β_{LS} + β_{LD}',
    description:
      'Langford–Balzar Voigt convolution separating Lorentzian and Gaussian integral breadths into distinct size and distortion components.',
    highlights: ['Exact Voigt Breadth Algebra', 'Equivalent Warren–Averbach Curves', 'Multi-Order Harmonic Solver'],
    icon: Layers,
    accentColor: '#14B8A6',
  },
  {
    id: 'moments',
    title: 'Method of Moments (2nd & 4th Central Moments)',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: 'W_{2θ}(σ) = M_2(σ) = [cosθ/(π²λD)]σ - (λ/4π²D²)cos²θ',
    description:
      'Asymptotic variance-range W(σ) and fourth-moment M₄(σ) tail analysis for dislocation density ρ_d and domain size without profile shape bias.',
    highlights: ['Linear Variance Slope k₁', 'Dislocation Screening Cutoff', 'Truncated Integration Range σ'],
    icon: BarChart3,
    accentColor: '#F97316',
  },
  {
    id: 'fwhm',
    title: 'Line Profile Fitting & Voigt Deconvolution',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: 'V(x; σ, γ) = ∫ G(x′; σ) L(x - x′; γ) dx′',
    description:
      'Precision single- and overlapping-peak fitting using Gaussian, Lorentzian, Pseudo-Voigt, and Split-Pearson VII kernels with Cu Kα₂ stripping.',
    highlights: ['Rachinger Kα₁/Kα₂ Doublet Strip', 'Shape Parameter φ = FWHM / β', 'Interactive Residual Subplot'],
    icon: Activity,
    accentColor: '#0EA5E9',
  },
  {
    id: 'integral_breadth',
    title: 'Integral Breadth (β = Area / I₀) & SSP',
    category: 'microstructure',
    categoryLabel: 'Size & Microstrain',
    formula: '(d_{hkl} β cosθ / λ)² = (K/D)(d_{hkl}² β cosθ / λ) + (ε/2)²',
    description:
      'Evaluate true integral breadth β, Halder–Wagner parabolic approximations, and Size–Strain Plot (SSP) linearizations for isotropic powders.',
    highlights: ['Halder–Wagner Linearization', 'Size–Strain Plot (SSP)', 'Advanced HKL Anisotropy Matrix'],
    icon: Scale,
    accentColor: '#22C55E',
  },
  {
    id: 'dl',
    title: 'Physics-Informed Neural Crystallography (PINN)',
    category: 'ai_database',
    categoryLabel: 'Neural AI & Databases',
    formula: 'P(y_k | I(2θ)) = Softmax(W · Attn(ResNet1D(I)) - λ_ext M_{SG})',
    description:
      '1D-ResNet + Multi-Head Attention workstation with space-group extinction masking, Grad-CAM reflection saliency, and Voigt parameter regression.',
    highlights: ['230 Space Group Extinction Mask', 'Grad-CAM 1D Reflection Saliency', '3D Latent Manifold Explorer'],
    icon: Cpu,
    accentColor: '#3B82F6',
    badge: 'PINN ENGINE',
  },
  {
    id: 'rir',
    title: 'Quantitative Phase Analysis (RIR / Chung)',
    category: 'refinement',
    categoryLabel: 'Refinement & Thin Films',
    formula: 'W_α = [I_α / RIR_α] / ∑ [I_k / RIR_k]',
    description:
      'Multi-phase weight fraction quantification using Reference Intensity Ratios (I/Ic vs. Corundum α-Al₂O₃) and internal standard calibration.',
    highlights: ['Corundum I/Ic Matrix Flushing', 'Amorphous Content Internal Std', 'Uncertainty Propagation'],
    icon: Sparkles,
    accentColor: '#EAB308',
  },
  {
    id: 'symmetry',
    title: 'Crystal Symmetry, Bravais Lattices & Extinctions',
    category: 'diffraction',
    categoryLabel: 'Diffraction & Scattering',
    formula: 'F_{hkl} = ∑ f_j(Q) exp[2πi(hx_j + ky_j + lz_j)]',
    description:
      'Interactive 3D unit-cell projection, structure factor F(hkl) phase cancellation, systematic absence rules, and metric tensor d-spacing calculator.',
    highlights: ['7 Crystal Systems & 14 Bravais Lattices', 'Systematic Absence Inspector', 'Interactive Miller Plane (hkl)'],
    icon: Compass,
    accentColor: '#A855F7',
  },
  {
    id: 'compare',
    title: 'Multi-Pattern Diffraction Compare & Shift Lab',
    category: 'refinement',
    categoryLabel: 'Refinement & Thin Films',
    formula: 'r_{AB} = cov(I_A, I_B) / (σ_A σ_B)',
    description:
      'Overlay multiple experimental or simulated diffractograms, measure thermal/chemical lattice shifts Δ2θ, and compute Pearson similarity matrices.',
    highlights: ['Waterfall & Difference Overlay', 'Solid-Solution Vegard Shift', 'Cross-Correlation Matrix'],
    icon: Layers,
    accentColor: '#06B6D4',
  },
  {
    id: 'database',
    title: 'Crystallographic Reference Standards Vault',
    category: 'ai_database',
    categoryLabel: 'Neural AI & Databases',
    formula: 'CIF / ICDD / COD Reference Cards',
    description:
      'Searchable repository of verified crystallographic reference standards with unit cell constants, space groups, densities, and (hkl) sticks.',
    highlights: ['Instant Module Parameter Export', 'Custom Phase Builder', 'Space Group & Formula Filter'],
    icon: Database,
    accentColor: '#10B981',
  },
  {
    id: 'learn',
    title: 'Crystallography & Diffraction Theory Compendium',
    category: 'ai_database',
    categoryLabel: 'Neural AI & Databases',
    formula: 'Kinematic & Dynamical Theory',
    description:
      'Rigorous mathematical derivations, reciprocal lattice Ewald sphere constructions, and step-by-step experimental troubleshooting guides.',
    highlights: ['Ewald Sphere Geometry', 'Line Broadening Derivations', 'Curated Problem Sets'],
    icon: FileText,
    accentColor: '#94A3B8',
  },
];

interface ModulesDirectoryProps {
  onSelectModule: (moduleId: AppSection) => void;
}

export const ModulesDirectory: React.FC<ModulesDirectoryProps> = ({ onSelectModule }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Engines', count: SCIENTIFIC_MODULES.length },
    {
      id: 'diffraction',
      label: 'Diffraction & PDF',
      count: SCIENTIFIC_MODULES.filter((m) => m.category === 'diffraction').length,
    },
    {
      id: 'microstructure',
      label: 'Line Profile & Strain',
      count: SCIENTIFIC_MODULES.filter((m) => m.category === 'microstructure').length,
    },
    {
      id: 'refinement',
      label: 'Rietveld, XRR & QPA',
      count: SCIENTIFIC_MODULES.filter((m) => m.category === 'refinement').length,
    },
    {
      id: 'ai_database',
      label: 'PINN AI & Standards',
      count: SCIENTIFIC_MODULES.filter((m) => m.category === 'ai_database').length,
    },
  ];

  const filteredModules = useMemo(() => {
    return SCIENTIFIC_MODULES.filter((mod) => {
      const matchesCategory = selectedCategory === 'all' || mod.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        mod.title.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        (mod.formula && mod.formula.toLowerCase().includes(q)) ||
        mod.highlights.some((h) => h.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section
      id="modules-directory-section"
      className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-800/80 bg-[#070A12]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
              <span>● COMPLETE COMPUTATIONAL ARCHITECTURE</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">{SCIENTIFIC_MODULES.length} SPECIALIZED WORKSTATIONS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Crystallographic &amp; Scattering Engine Directory
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by equation, method, or metric..."
              className="w-full pl-9 pr-8 py-2 bg-[#0B0F19] border border-slate-800 focus:border-cyan-500/60 rounded-sm text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hover:text-white"
              >
                CLR
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2 border cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60'
                    : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-sm ${
                    isActive ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onSelectModule(mod.id)}
                className="group relative bg-[#0B0F19] hover:bg-[#0F1626] border border-slate-800 hover:border-cyan-500/50 rounded-sm p-5 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 shrink-0" style={{ color: mod.accentColor }} />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {mod.categoryLabel}
                      </span>
                    </div>
                    {mod.badge && (
                      <span
                        className="text-[9px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: mod.accentColor }}
                      >
                        ● {mod.badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-2 leading-snug">
                    {mod.title}
                  </h3>

                  {/* Governing Equation Box */}
                  {mod.formula && (
                    <div className="mb-3 px-2.5 py-1.5 bg-[#070A12] border border-slate-800/90 rounded-sm font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-nowrap">
                      {mod.formula}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">{mod.description}</p>
                </div>

                <div>
                  {/* Technical Capability List */}
                  <div className="space-y-1 pt-3 border-t border-slate-800/80 mb-4">
                    {mod.highlights.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                        <span className="text-cyan-500">›</span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Launch Footer */}
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 transition-colors pt-2 border-t border-slate-800/50">
                    <span>Open Workstation</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
