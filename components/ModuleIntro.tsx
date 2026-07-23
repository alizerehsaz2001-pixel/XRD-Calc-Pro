import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, Info, Zap, Layers, Cpu, Database, Brain, ArrowRight, Check, Sparkles, Activity, Target } from 'lucide-react';

interface ModuleIntroProps {
  module: string;
  onUnderstand: () => void;
}

// Helper for vertical fractions
const Fraction = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
  <div className="inline-flex flex-col items-center align-middle mx-2" style={{ verticalAlign: 'middle' }}>
    <span className="border-b-2 border-indigo-500/30 w-full text-center px-1.5 pb-1 mb-[2px]">{num}</span>
    <span className="w-full text-center px-1.5 pt-[1px]">{den}</span>
  </div>
);

// Helper for Math variables (Serif, Italic)
const M = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`font-serif italic text-indigo-50 ${className}`}>{children}</span>
);

// Helper for Function names (Serif, Upright)
const F = ({ children }: { children?: React.ReactNode }) => (
  <span className="font-serif font-normal text-indigo-300">{children}</span>
);

const FormulaContainer = ({ children, label }: { children: React.ReactNode, label: string }) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="relative p-8 bg-black/60 rounded-[2.5rem] border border-indigo-500/30 group w-full flex flex-col shadow-[inset_0_0_80px_rgba(99,102,241,0.08)] backdrop-blur-2xl overflow-hidden"
  >
    {/* Animated Geometric Background */}
    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
      <svg className="absolute -right-10 -top-10 w-64 h-64 text-indigo-500/30 animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4"/>
        <path d="M 50 10 L 50 90 M 10 50 L 90 50 M 20 20 L 80 80 M 20 80 L 80 20" stroke="currentColor" strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>

    <div className="flex justify-between items-start w-full relative z-10 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Cpu className="w-4 h-4 text-indigo-300" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300 font-sans">{label}</span>
      </div>
    </div>
    
    <div className="w-full overflow-x-auto custom-scrollbar pb-4 relative z-10">
      <div className="text-3xl md:text-4xl font-serif whitespace-nowrap min-w-max pt-2 flex items-center tracking-wide text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
        <div className="inline-block align-middle">
          {children}
        </div>
      </div>
    </div>
  </motion.div>
);

const MODULE_CONTENT: Record<string, { title: string; description: string; tag: string; icon: any; color: string; formulas: React.ReactNode }> = {
  bragg: {
    title: "Bragg Diffractometer Core",
    tag: "Fundamental Physics",
    icon: Zap,
    color: "from-indigo-500 to-blue-500",
    description: "The core engine for calculating interplanar lattice spacing using classical Bragg diffraction physics. Fundamental to phase identification and structural analysis.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Bragg's Law">
          <M>n</M><M>λ</M> = 2<M>d</M> <F>sin</F>(<M>θ</M>)
        </FormulaContainer>
        <FormulaContainer label="Scattering Vector">
          <M>Q</M> = <Fraction num={<span>4<M>π</M> <F>sin</F>(<M>θ</M>)</span>} den={<M>λ</M>} />
        </FormulaContainer>
      </div>
    )
  },
  fwhm: {
    title: "Line Profile Analytics",
    tag: "Signal Processing",
    icon: Layers,
    color: "from-orange-500 to-amber-500",
    description: "Advanced analysis of diffraction peak geometry. Separates instrumental convolution from sample intrinsic properties using Pseudo-Voigt modeling.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Pseudo-Voigt Mix">
          <M>V</M>(<M>x</M>) = <M>ηL</M>(<M>x</M>) + (1−<M>η</M>)<M>G</M>(<M>x</M>)
        </FormulaContainer>
        <FormulaContainer label="Integral Breadth">
          <M>β</M> = <Fraction num={<F>Area</F>} den={<><M>I</M><sub>max</sub></>} />
        </FormulaContainer>
      </div>
    )
  },
  compare: {
    title: "Diffraction Compare Lab",
    tag: "Comparative Spectroscopy",
    icon: Layers,
    color: "from-blue-500 to-emerald-500",
    description: "Overlay and visually inspect diffraction profiles between custom samples. Identify crystal structure variations, line shifts, and residual strains.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Relative Intensity Ratio">
          <M>I</M><sub>rel</sub> = <Fraction num={<>I<sub>A</sub></>} den={<>I<sub>B</sub></>} />
        </FormulaContainer>
        <FormulaContainer label="Peak Centroid Shift">
          Δ(2θ) = 2θ<sub>A</sub> − 2θ<sub>B</sub>
        </FormulaContainer>
      </div>
    )
  },
  scherrer: {
    title: "Scherrer Size Estimation",
    tag: "Microstructural",
    icon: Info,
    color: "from-emerald-500 to-teal-500",
    description: "Standard protocol for estimating mean crystallite size based on diffraction peak broadening, assuming a stress-free lattice environment.",
    formulas: (
      <FormulaContainer label="Crystallite Diameter (D)">
        <M>D</M> = <Fraction num={<span><M>K</M> <M>λ</M></span>} den={<span><M>β</M> <F>cos</F>(<M>θ</M>)</span>} />
      </FormulaContainer>
    )
  },
  wh: {
    title: "Williamson-Hall Suite",
    tag: "Microstructural",
    icon: Layers,
    color: "from-cyan-500 to-blue-500",
    description: "Regression-based separation of Size and Strain effects. Decouples Lorentzian/Gaussian contributions to lattice broadening.",
    formulas: (
      <FormulaContainer label="W-H Master Equation">
        <M>β</M><F>cos</F>(<M>θ</M>) = <M>ε</M>(4<F>sin</F><M>θ</M>) + <Fraction num={<span><M>K</M><M>λ</M></span>} den={<M>D</M>} />
      </FormulaContainer>
    )
  },
  wa: {
    title: "Warren-Averbach Analysis",
    tag: "Advanced Fourier",
    icon: Brain,
    color: "from-rose-500 to-pink-500",
    description: "High-fidelity distribution analysis using Fourier transform of peak profiles. The gold standard for non-uniform strain analysis.",
    formulas: (
      <div className="space-y-4">
        <FormulaContainer label="Fourier Coefficient A(L)">
          <M>A</M>(<M>L</M>) = <Fraction num={<span><F>∫</F> <M>I</M>(<M>s</M>) <F>cos</F>(2<M>πLs</M>) <M>ds</M></span>} den={<span><F>∫</F> <M>I</M>(<M>s</M>) <M>ds</M></span>} />
        </FormulaContainer>
      </div>
    )
  },
  rietveld: {
    title: "Rietveld Parameter Set",
    tag: "Full Pattern Fitting",
    icon: Database,
    color: "from-teal-500 to-emerald-500",
    description: "Generates structural starting point for least-squares refinement. Optimizes crystal structure against the entire diffraction pattern.",
    formulas: (
       <FormulaContainer label="Refinement Residual (M)">
         <M>M</M> = <F>Σ</F> <M>W</M><sub>i</sub> (<M>y</M><sub>obs,i</sub> − <M>y</M><sub>calc,i</sub>)²
       </FormulaContainer>
    )
  },
  neutron: {
    title: "Neutron Scatter Plane",
    tag: "Nuclear Analytics",
    icon: Zap,
    color: "from-blue-500 to-indigo-500",
    description: "Isotope-sensitive diffraction analysis. Essential for light atom localization and magnetic structure determination.",
    formulas: (
      <FormulaContainer label="Neutron Structure Factor">
        <M>F</M><sub>hkl</sub> = <F>Σ</F> <M>b</M><sub>j</sub> <F>exp</F>(2<M>πi</M> <strong>r</strong><sub>j</sub> · <strong>Q</strong>) <M>W</M><sub>j</sub>
      </FormulaContainer>
    )
  },
  dl: {
    title: "PhaseID Neural Core",
    tag: "Deep Learning",
    icon: Brain,
    color: "from-fuchsia-500 to-violet-500",
    description: "Convolutional Neural Network (CNN) designed for probabilistic phase matching. Operates on raw 1D diffraction pattern vectors.",
    formulas: (
       <div className="flex w-full overflow-x-auto custom-scrollbar items-center gap-2 font-mono text-[10px] text-indigo-200 uppercase tracking-widest bg-black/40 shadow-[inset_0_0_40px_rgba(99,102,241,0.05)] backdrop-blur-md p-8 rounded-[2rem] border border-indigo-500/20 whitespace-nowrap">
         <span className="text-white/40 shrink-0">Vector[N]</span> 
         <ArrowRight className="w-4 h-4 shrink-0 text-indigo-500" />
         <span className="text-indigo-400 font-bold shrink-0">Conv1D</span>
         <ArrowRight className="w-4 h-4 shrink-0 text-indigo-500" />
         <span className="text-white/40 shrink-0">MaxPool</span>
         <ArrowRight className="w-4 h-4 shrink-0 text-indigo-500" />
         <span className="text-fuchsia-400 font-bold shrink-0">Phase_Prob</span>
       </div>
    )
  },
  selection: {
    title: "Selection Rules",
    tag: "Structure Factor",
    icon: Database,
    color: "from-blue-600 to-indigo-600",
    description: "Determines which diffraction planes are observable based on the Bravais lattice and internal atomic arrangement.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Structure Factor (F)">
          <M>F</M><sub>hkl</sub> = <F>Σ</F> <M>f</M><sub>j</sub> <F>exp</F> [ 2<M>πi</M>(<M>hx</M><sub>j</sub> + <M>ky</M><sub>j</sub> + <M>lz</M><sub>j</sub>) ]
        </FormulaContainer>
        <FormulaContainer label="Scattered Intensity">
          <M>I</M><sub>hkl</sub> ∝ |<M>F</M><sub>hkl</sub>|²
        </FormulaContainer>
      </div>
    )
  },
  integral: {
    title: "Integral Breadth Processing",
    tag: "Signal Analysis",
    icon: Layers,
    color: "from-purple-500 to-indigo-500",
    description: "Evaluates the total area of the diffraction peak normalized by its maximum intensity, providing a robust metric for total peak broadening.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Integral Breadth">
          <M>β</M> = <Fraction num={<span><F>∫</F> <M>I</M>(2<M>θ</M>) d(2<M>θ</M>)</span>} den={<><M>I</M><sub>max</sub></>} />
        </FormulaContainer>
        <FormulaContainer label="Cauchy Additivity">
          <M>β</M><sub>obs</sub> = <M>β</M><sub>sample</sub> + <M>β</M><sub>inst</sub>
        </FormulaContainer>
      </div>
    )
  },
  integral_adv: {
    title: "IB Advanced (W-H / Halder-Wagner)",
    tag: "Microstructural",
    icon: Brain,
    color: "from-pink-500 to-rose-500",
    description: "Advanced integral breadth analysis separating size and strain effects without the linear approximation constraints of the strict Williamson-Hall plot.",
    formulas: (
      <FormulaContainer label="Halder-Wagner Equation">
        (<Fraction num={<><M>β</M>*</>} den={<><M>d</M>*</>} />)² = <Fraction num="1" den={<M>D</M>} /> (<Fraction num={<><M>β</M>*</>} den={<><M>d</M>*²</>} />) + (<Fraction num={<M>ε</M>} den="2" />)²
      </FormulaContainer>
    )
  },
  magnetic: {
    title: "Magnetic Diffraction",
    tag: "Nuclear Analytics",
    icon: Zap,
    color: "from-red-500 to-orange-500",
    description: "Examines the interaction between incident neutrons and the unpaired electron spins in the crystal lattice to solve magnetic orderings.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Magnetic Interaction Vector">
          <M>q</M> = <M>κ</M> − <M>e</M>(<M>e</M> · <M>κ</M>)
        </FormulaContainer>
        <FormulaContainer label="Magnetic Amplitude">
          <M>p</M> = (<Fraction num={<><M>γe</M>²</>} den={<><M>mc</M>²</>} />) <M>S</M> <M>f</M><sub>mag</sub>
        </FormulaContainer>
      </div>
    )
  },
  image_analysis: {
    title: "Image Analysis Engine",
    tag: "Optical Processing",
    icon: Cpu,
    color: "from-sky-500 to-blue-500",
    description: "Applies computer vision transformations to micrographs or diffraction patterns, isolating features, grains, and noise profiles.",
    formulas: (
      <FormulaContainer label="Gaussian Smoothing Kernel">
        <M>G</M>(<M>x</M>,<M>y</M>) = <Fraction num="1" den={<>2<M>πσ</M>²</>} /> <F>exp</F>(−<Fraction num={<><M>x</M>² + <M>y</M>²</>} den={<>2<M>σ</M>²</>} />)
      </FormulaContainer>
    )
  },
  image_gen: {
    title: "Scientific Illustrator",
    tag: "Generative AI",
    icon: Brain,
    color: "from-violet-500 to-fuchsia-500",
    description: "Latent space diffusion model optimized for generating high-fidelity scientific diagrams, crystal lattices, and experimental schematics.",
    formulas: (
      <FormulaContainer label="Diffusion Denoising Objective">
        <M>L</M> = <F>E</F> [||<M>ε</M> − <M>ε</M><sub>θ</sub>(<M>x</M><sub>t</sub>, <M>t</M>, <M>c</M>)||²]
      </FormulaContainer>
    )
  },
  preferred_orientation: {
    title: "Preferred Orientation Core",
    tag: "Texture & Habit Analysis",
    icon: Layers,
    color: "from-indigo-500 to-rose-500",
    description: "Models and corrects systematic peak intensity anomalies caused by non-random crystallite spatial orientation using the March-Dollase distribution function.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="March-Dollase Equation">
          <M>P</M>(<M>α</M>) = [ <M>r</M>² <F>cos</F>²(<M>α</M>) + <M>r</M><sup>−1</sup> <F>sin</F>²(<M>α</M>) ]<sup>−3/2</sup>
        </FormulaContainer>
        <FormulaContainer label="Cubic Lattice Axis Angle">
          <F>cos</F>(<M>α</M>) = <Fraction num={<span><M>h</M>·<M>H</M> + <M>k</M>·<M>K</M> + <M>l</M>·<M>L</M></span>} den={<span>√(<M>h</M>² + <M>k</M>² + <M>l</M>²) · √(<M>H</M>² + <M>K</M>² + <M>L</M>²)</span>} />
        </FormulaContainer>
      </div>
    )
  },
  cohen: {
    title: "Cohen's Least-Squares Matrix Refinement",
    tag: "Lattice Parameter Refinement",
    icon: Layers,
    color: "from-indigo-500 to-violet-500",
    description: "Systematic matrix algebra for refining lattice constants while eliminating experimental systematic drift errors.",
    formulas: (
      <FormulaContainer label="Cohen Normal Matrix">
        <strong>A</strong> · <strong>x</strong> = <strong>v</strong>
      </FormulaContainer>
    )
  },
  metric_tensor: {
    title: "Crystallographic Metric Tensor Algebra",
    tag: "Linear Algebra & Space Tensors",
    icon: Sparkles,
    color: "from-violet-500 to-cyan-500",
    description: "Rigorous direct [G] and reciprocal [G*] metric tensor algebra for d-spacing contractions, interplanar angles, Cartesian transformations, and lattice strain.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Metric Tensor G">
          <M>g</M><sub>ij</sub> = <strong>a</strong><sub>i</sub> · <strong>a</strong><sub>j</sub>
        </FormulaContainer>
        <FormulaContainer label="d-Spacing Contraction">
          1 / <M>d</M>²<sub>hkl</sub> = <strong>h</strong>ᵀ <M>G</M>* <strong>h</strong>
        </FormulaContainer>
      </div>
    )
  },
  supercell_transform: {
    title: "Supercell & Coordinate Transformation Matrix Engine",
    tag: "Linear Transformation & Matrix Algebra",
    icon: Sparkles,
    color: "from-cyan-500 to-blue-500",
    description: "Linear matrix transformations P and origin shift vector p for supercells, subcells, primitive-to-conventional conversions, atomic coordinate mapping, and Miller indices mapping.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Supercell Basis Matrix P">
          (<strong>a</strong>', <strong>b</strong>', <strong>c</strong>')ᵀ = <strong>P</strong> · (<strong>a</strong>, <strong>b</strong>, <strong>c</strong>)ᵀ
        </FormulaContainer>
        <FormulaContainer label="Atomic Coordinate Inverse Mapping">
          <strong>x</strong>' = <strong>P</strong>⁻¹ (<strong>x</strong> - <strong>p</strong>)
        </FormulaContainer>
      </div>
    )
  },
  pawley_lebail: {
    title: "Pawley & Le Bail Whole Pattern Decomposition",
    tag: "Structureless Pattern Fitting",
    icon: Activity,
    color: "from-indigo-500 to-violet-500",
    description: "Extract reflection intensities I_k and refine unit cell parameters without an atomic model using Le Bail iterative partitioning or Pawley non-linear least squares matrix fitting.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Le Bail Intensity Partitioning">
          {"I_k^{(n+1)} = I_k^{(n)} \\sum_i [ y_{obs}(i) S_k(2\\theta_i) / y_{calc}(i) ]"}
        </FormulaContainer>
        <FormulaContainer label="Calculated Profile y_calc">
          {"y_{calc}(i) = y_{bg}(i) + \\sum_k I_k \\phi(2\\theta_i - 2\\theta_k)"}
        </FormulaContainer>
      </div>
    )
  },
  patterson_harker: {
    title: "Patterson Vector Map & Harker Sections Engine",
    tag: "Heavy Atom & Phase Deconvolution",
    icon: Target,
    color: "from-amber-500 to-orange-500",
    description: "Synthesize Patterson vector density maps P(u, v, w) from structure factor magnitudes |F_hkl|^2 without phase information, and deconvolve heavy atom coordinates using Harker section cuts.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaContainer label="Patterson Fourier Synthesis">
          {"P(u, v, w) = (1/V) \\sum_{hkl} |F(hkl)|^2 \\cos(2\\pi(hu + kv + lw))"}
        </FormulaContainer>
        <FormulaContainer label="Harker Vector Plane Deconvolution">
          {"P_{Harker}(u, 1/2, w) \\implies \\mathbf{u} = 2\\mathbf{x}, \\quad \\mathbf{w} = 2\\mathbf{z}"}
        </FormulaContainer>
      </div>
    )
  }
};

export const ModuleIntro: React.FC<ModuleIntroProps> = ({ module, onUnderstand }) => {
  const [skipNext, setSkipNext] = useState<boolean>(() => {
    return localStorage.getItem('xrd_skip_intros') === 'true';
  });

  const content = MODULE_CONTENT[module] || {
    title: "Specialized Analysis Core",
    tag: "Laboratory Operation",
    icon: BookOpen,
    color: "from-slate-700 to-slate-900",
    description: "Deploying specialized algorithms for custom crystallographic investigations.",
    formulas: null
  };

  const handleUnderstandClick = () => {
    if (skipNext) {
      localStorage.setItem('xrd_skip_intros', 'true');
    } else {
      localStorage.setItem('xrd_skip_intros', 'false');
    }
    onUnderstand();
  };

  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.15 
      } 
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 relative">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-slate-950 rounded-[3.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden relative pt-6"
      >
        {/* Top Quick Utility Bar */}
        <div className="absolute top-6 left-6 right-6 z-25 flex flex-col sm:flex-row gap-3 justify-between items-center bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">
              Computational Theory & Method
            </div>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-white transition-colors group">
              <input
                type="checkbox"
                checked={skipNext}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSkipNext(val);
                  if (val) {
                    localStorage.setItem('xrd_skip_intros', 'true');
                  } else {
                    localStorage.setItem('xrd_skip_intros', 'false');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-slate-700 bg-slate-900 flex items-center justify-center peer-checked:bg-white peer-checked:border-white transition-all">
                <Check className="w-2.5 h-2.5 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Auto-Skip Intros
              </span>
            </label>

            <button
              onClick={handleUnderstandClick}
              className="px-4 py-1.5 bg-white/10 hover:bg-white text-white hover:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-white/10 hover:border-white"
            >
              Skip directly to tool
            </button>
          </div>
        </div>

        {/* Abstract Dark Matter & Math Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[140px]" />
          <div className="absolute top-[50%] -right-[20%] w-[50%] h-[70%] bg-teal-600/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-[0%] left-[20%] w-[40%] h-[60%] bg-rose-600/10 rounded-full blur-[120px]" />
          
          {/* Geometric Grid Graphic */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black_10%,transparent_80%)]" />
          
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        {/* Header Section */}
        <div className={`p-16 md:p-20 pt-24 md:pt-28 relative overflow-hidden bg-black/40 backdrop-blur-3xl border-b border-white/5 text-white`}>
           <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div variants={itemVariants} className="mb-8">
                 <span className="px-6 py-2 bg-indigo-500/10 backdrop-blur-md rounded-full border border-indigo-500/30 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 font-sans shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    {content.tag}
                 </span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8 uppercase font-sans text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-indigo-400 drop-shadow-sm">
                 {content.title}
              </motion.h1>

              <motion.div variants={itemVariants} className="w-32 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-full mb-10 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-indigo-100/70 font-medium max-w-3xl leading-relaxed font-sans">
                 {content.description}
              </motion.p>
           </div>
        </div>

        {/* Knowledge & Call to Action */}
        <div className="p-16 md:p-20 space-y-20 relative z-10 bg-slate-950/50 backdrop-blur-sm">
          {content.formulas && (
            <motion.div variants={itemVariants}>
               <div className="flex items-center gap-6 mb-12">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/80 whitespace-nowrap font-sans">Mathematical Basis</h3>
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
               </div>
               <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                  {content.formulas}
               </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row items-center justify-between gap-12 pt-16 border-t border-white/5">
             <div className="flex items-start gap-6 max-w-xl">
                <div className="p-5 bg-indigo-500/10 rounded-[1.5rem] shrink-0 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                   <Info className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-300 mb-3 font-sans">Operation Protocol</h4>
                   <p className="text-[13px] text-slate-400 font-bold leading-relaxed font-sans">
                      All analytical models execute with 64-bit floating point precision. Verify that raw instrument metrics are appropriately calibrated before deploying to the central processing matrix.
                   </p>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
               <button
                 onClick={handleUnderstandClick}
                 className="group relative flex items-center justify-center px-12 py-6 bg-white text-slate-950 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 font-sans cursor-pointer"
               >
                 <span className="relative z-10 flex items-center gap-3">
                   Initialize Suite
                   <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
               </button>
             </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
