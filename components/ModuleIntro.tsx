
import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, Info, Zap, Layers, Cpu, Database, Brain, ArrowRight } from 'lucide-react';

interface ModuleIntroProps {
  module: string;
  onUnderstand: () => void;
}

// Helper for vertical fractions
const Fraction = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
  <div className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
    <span className="border-b border-slate-300 dark:border-slate-700 w-full text-center px-1 pb-[1px] mb-[1px]">{num}</span>
    <span className="w-full text-center px-1">{den}</span>
  </div>
);

// Helper for Math variables (Serif, Italic)
const M = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`font-serif italic text-slate-900 dark:text-slate-100 ${className}`}>{children}</span>
);

// Helper for Function names (Serif, Upright)
const F = ({ children }: { children?: React.ReactNode }) => (
  <span className="font-serif font-normal text-slate-700 dark:text-slate-400">{children}</span>
);

const FormulaContainer = ({ children, label }: { children: React.ReactNode, label: string }) => (
  <div className="relative p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 group overflow-hidden w-full flex flex-col">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
       <Cpu className="w-6 h-6 text-indigo-500" />
    </div>
    <div className="flex flex-col gap-4 w-full">
      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-sans shrink-0">{label}</span>
      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
        <div className="text-xl md:text-2xl font-serif whitespace-nowrap min-w-max pt-1 flex items-center">
          <div className="inline-block align-middle">
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
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
       <div className="flex w-full overflow-x-auto custom-scrollbar items-center gap-2 font-mono text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950 p-6 rounded-[2rem] border border-slate-800 whitespace-nowrap">
         <span className="text-white/40 shrink-0">Vector[N]</span> 
         <ArrowRight className="w-3 h-3 shrink-0" />
         <span className="text-indigo-400 shrink-0">Conv1D</span>
         <ArrowRight className="w-3 h-3 shrink-0" />
         <span className="text-white/40 shrink-0">MaxPool</span>
         <ArrowRight className="w-3 h-3 shrink-0" />
         <span className="text-violet-400 shrink-0">Phase_Prob</span>
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
  }
};

export const ModuleIntro: React.FC<ModuleIntroProps> = ({ module, onUnderstand }) => {
  const content = MODULE_CONTENT[module] || {
    title: "Specialized Analysis Core",
    tag: "Laboratory Operation",
    icon: BookOpen,
    color: "from-slate-700 to-slate-900",
    description: "Deploying specialized algorithms for custom crystallographic investigations.",
    formulas: null
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header Section */}
        <div className={`p-16 relative overflow-hidden bg-slate-950 text-white`}>
           <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.5),transparent)]"></div>
             <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(244,63,94,0.3),transparent)]"></div>
           </div>
           
           <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div variants={itemVariants} className="mb-6">
                 <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 font-sans">
                    {content.tag}
                 </span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-6xl font-black tracking-tighter leading-none mb-8 italic uppercase font-sans">
                 {content.title}
              </motion.h1>

              <motion.div variants={itemVariants} className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full mb-8" />
              
              <motion.p variants={itemVariants} className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed font-sans">
                 {content.description}
              </motion.p>
           </div>
        </div>

        {/* Knowledge & Call to Action */}
        <div className="p-16 space-y-16">
          {content.formulas && (
            <motion.div variants={itemVariants}>
               <div className="flex items-center gap-6 mb-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap font-sans">Mathematical Basis // 01</h3>
                  <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
               </div>
               <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                  {content.formulas}
               </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-slate-50 dark:border-slate-800">
             <div className="flex items-start gap-6 max-w-md">
                <div className="p-4 bg-indigo-500/10 rounded-[1.5rem] shrink-0">
                   <Info className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2 font-sans">Operation Protocol</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">
                      All calculations are performed with double-precision floating point accuracy. Ensure your input values are calibrated for instrumental broadening.
                   </p>
                </div>
             </div>

             <button
               onClick={onUnderstand}
               className="group relative flex items-center justify-center px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all shadow-xl hover:scale-105 active:scale-95 font-sans"
             >
               <span className="relative z-10 flex items-center gap-3">
                 Initialize Calculations
                 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </span>
               <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
             </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
