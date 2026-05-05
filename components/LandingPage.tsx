
import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Activity, 
  Layers, 
  FlaskConical, 
  Database, 
  Brain, 
  Microscope, 
  Radio, 
  ArrowRight, 
  Beaker,
  FileText,
  Hexagon
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const FeatureCard = ({ title, description, icon: Icon, index }: { title: string, description: string, icon: any, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="group relative bg-[#0a0f1d]/60 backdrop-blur-md border border-slate-800/50 p-5 rounded-2xl hover:border-violet-500/30 transition-all duration-300 cursor-default overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex items-center gap-4 mb-3 relative z-10">
      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/50 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-all duration-500 shadow-lg">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-black text-xs uppercase tracking-widest text-slate-200 group-hover:text-white transition-colors">{title}</h3>
    </div>
    <p className="text-xs text-slate-500 leading-relaxed pl-14 group-hover:text-slate-400 transition-colors">{description}</p>
  </motion.div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const features = [
    {
      title: "Diffraction Core",
      description: "Bragg geometry, d-spacing transitions, and reciprocal space mapping.",
      icon: Radio
    },
    {
      title: "Profile Analysis",
      description: "Voigt-profile modeling and advanced FWHM deconvolution.",
      icon: Activity
    },
    {
      title: "Structure Logic",
      description: "Atomic form factors and extinction rules for Bravais lattices.",
      icon: Layers
    },
    {
      title: "Microstructure",
      description: "Strain/Size separation via Scherrer and Williamson-Hall plots.",
      icon: Microscope
    },
    {
      title: "Fourier Synthesis",
      description: "Warren-Averbach analysis of nanostructured imperfections.",
      icon: Hexagon
    },
    {
      title: "Experimental Prep",
      description: "Specimen absorption corrections and instrument broadening.",
      icon: Beaker
    },
    {
      title: "Phase ID Layer",
      description: "AI-accelerated Hanawalt search and spectral matching.",
      icon: Brain
    },
    {
      title: "Crystal Library",
      description: "Extensive database of crystallographic indices and standards.",
      icon: Database
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-violet-500/30">
      {/* HUD Lines & Grid Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute top-[20%] right-0 w-32 h-[1px] bg-indigo-500/20 rotate-[-45deg]" />
      </div>

      {/* Glow Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Left Main Content - Hero */}
      <div className="relative z-20 w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 h-screen lg:h-screen overflow-y-auto shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/60 bg-[#020617]/80 backdrop-blur-md shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full flex flex-col items-start text-left"
        >
           {/* Science Logo Mark */}
           <motion.div 
             initial={{ scale: 0.8, rotate: -45, opacity: 0 }}
             animate={{ scale: 1, rotate: 0, opacity: 1 }}
             transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
             className="relative mb-12 group self-start"
           >
             <div className="absolute -inset-8 bg-violet-500/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="w-20 h-20 lg:w-28 lg:h-28 bg-slate-900 border border-slate-700/50 rounded-3xl flex items-center justify-center relative z-10 shadow-3xl ring-1 ring-white/10 group-hover:border-violet-500/50 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 to-transparent rounded-3xl" />
               <motion.span 
                 animate={{ opacity: [0.5, 1, 0.5] }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="text-5xl lg:text-6xl font-light text-white tracking-widest"
               >
                 λ
               </motion.span>
             </div>
             
             {/* Orbital Electrons Decor */}
             <div className="absolute -top-4 -right-4 w-6 h-6 border border-indigo-500/30 rounded-full animate-spin-slow" />
             <div className="absolute -bottom-2 -left-8 w-10 h-10 border border-violet-500/20 rounded-full animate-reverse-spin" />
           </motion.div>
           
           <h1 className="text-5xl lg:text-[7rem] font-black tracking-tighter mb-6 text-white uppercase italic leading-[0.9]">
             XRD-<br />Calc<span className="text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-indigo-300">Pro</span>
           </h1>
           
           <p className="text-lg lg:text-xl text-slate-400 max-w-md font-medium leading-relaxed mb-12 tracking-tight">
             Precision analytics for <span className="text-slate-200">Modern Crystallography</span>. 
             A high-fidelity framework for diffraction physics, phase identification, and microstructural synthesis.
           </p>

           <div className="flex flex-col sm:flex-row items-center gap-6">
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={onEnter}
               className="group relative flex items-center justify-center px-10 py-5 bg-white text-slate-950 text-sm font-black uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-violet-500/20"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
               <span className="relative z-10 flex items-center gap-3">
                 Initialize Lab
                 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </span>
             </motion.button>
             
             <button className="flex items-center gap-2 group px-6 py-4 text-slate-500 hover:text-slate-300 transition-colors text-xs font-black uppercase tracking-widest">
               <FileText className="w-4 h-4" />
               Documentation
             </button>
           </div>
           
           <div className="mt-16 w-full max-w-md border-t border-slate-800/50 pt-8 grid grid-cols-3 gap-8">
             {[
               { l: "Version", v: "2.5.0" },
               { l: "Engine", v: "Physics v4" },
               { l: "Authored By", v: "Ali Zerehsaz" }
             ].map((stat) => (
               <div key={stat.l} className="flex flex-col gap-2">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.l}</span>
                 <span className="text-xs font-mono text-slate-300">{stat.v}</span>
               </div>
             ))}
           </div>
        </motion.div>
      </div>

      {/* Right Sidebar - Module Explorer */}
      <div className="relative z-10 flex-1 lg:w-1/2 flex flex-col h-screen lg:h-screen bg-[#050816]/40 backdrop-blur-xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050816]/80 backdrop-blur-md z-30">
           <div>
             <div className="flex items-center gap-2 mb-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
               <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Crystallography Suite</h2>
             </div>
             <h3 className="text-lg font-black text-white uppercase italic">Laboratory Modules</h3>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             {features.map((f, i) => (
               <FeatureCard key={f.title} {...f} index={i} />
             ))}
           </div>
           <div className="pt-10 pb-12 opacity-30">
              <div className="h-px bg-slate-800 w-full mb-4" />
              <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest tracking-widest">End of Directory</p>
           </div>
        </div>
      </div>
    </div>
  );
};

