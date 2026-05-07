
import React, { useMemo } from 'react';
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
  Hexagon,
  Terminal,
  Cpu,
  MonitorCheck,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const XrdPattern = () => {
  const path = useMemo(() => {
    const points = Array.from({ length: 200 }, (_, i) => {
      const x = i * (1000 / 200);
      const noise = Math.random() * 8;
      let y = 180 - noise;
      
      const peaks = [
        { pos: 150, height: 120, width: 5 },
        { pos: 280, height: 40, width: 8 },
        { pos: 330, height: 160, width: 4 },
        { pos: 360, height: 70, width: 4 },
        { pos: 550, height: 110, width: 10 },
        { pos: 780, height: 60, width: 12 },
        { pos: 850, height: 30, width: 15 },
      ];
      
      peaks.forEach(peak => {
        // Lorentzian profile
        y -= peak.height / (1 + Math.pow((x - peak.pos) / peak.width, 2));
      });
      
      return `${x},${y}`;
    }).join(' L ');
    
    return `M 0,200 L 0,180 L ${points} L 1000,180 L 1000,200 Z`;
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full h-[40vh] pointer-events-none overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,black_100%)]">
      <motion.svg 
        className="w-[200%] md:w-[150%] h-full opacity-20 origin-bottom" 
        preserveAspectRatio="none" 
        viewBox="0 0 1000 200"
        initial={{ opacity: 0, y: 50, scaleY: 0 }}
        animate={{ opacity: 0.15, y: 0, scaleY: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <defs>
          <linearGradient id="trace-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="80%" stopColor="#4f46e5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path 
           d={path}
           fill="url(#trace-grad)"
           stroke="#a78bfa"
           strokeWidth="1.5"
           className="drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]"
        />
      </motion.svg>
    </div>
  );
};

const FeatureCard = ({ title, description, icon: Icon, index }: { title: string, description: string, icon: any, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="group relative bg-[#0a0f1d]/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-3xl hover:border-violet-500/40 transition-all duration-500 cursor-default overflow-hidden shadow-xl"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    {/* Inner glow line */}
    <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className="flex items-start gap-4 relative z-10">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:border-violet-500/50 group-hover:text-violet-300 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-200 group-hover:text-white transition-colors mb-2 leading-tight">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors font-medium">{description}</p>
      </div>
    </div>
  </motion.div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [systemLogs, setSystemLogs] = React.useState<string[]>([
    "INITIALIZING CORE ANALYTICS...",
    "LOADING BRAGG GEOMETRY ENGINE...",
    "SYNCHING CRYSTALLOGRAPHY DATABASE...",
  ]);

  React.useEffect(() => {
    const logs = [
      "CALIBRATING X-RAY SOURCE [Cu-Kα]...",
      "VERIFYING GONIOMETER STEP PRECISION...",
      "FETCHING ATOMIC FORM FACTORS...",
      "RECALIBRATING MONOCHROMATOR...",
      "SYSTEM STABLE. READY FOR ACQUISITION."
    ];
    let i = 0;
    const timer = setInterval(() => {
      setSystemLogs(prev => [...prev.slice(-4), logs[i]]);
      i = (i + 1) % logs.length;
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "Diffraction Core",
      description: "Bragg geometry, d-spacing transitions, and reciprocal space mapping computation.",
      icon: Radio
    },
    {
      title: "Profile Analysis",
      description: "Voigt-profile modeling and advanced FWHM deconvolution algorithms.",
      icon: Activity
    },
    {
      title: "Structure Logic",
      description: "Atomic form factors and extinction rules for Bravais lattices.",
      icon: Layers
    },
    {
      title: "Microstructure",
      description: "Strain/Size separation via Scherrer and Williamson-Hall analyses.",
      icon: Microscope
    },
    {
      title: "Fourier Synthesis",
      description: "Warren-Averbach analysis of nanostructured imperfections and columns.",
      icon: Hexagon
    },
    {
      title: "Phase ID Layer",
      description: "AI-accelerated Hanawalt search and spectral matching engine.",
      icon: Brain
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-violet-500/30">
      {/* HUD Lines & Grid Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="absolute top-0 left-1/4 w-[1px] h-32 bg-gradient-to-b from-indigo-500/40 to-transparent" />
        <div className="absolute top-0 right-1/4 w-[1px] h-32 bg-gradient-to-b from-violet-500/40 to-transparent" />
      </div>

      {/* Dynamic XRD Pattern */}
      <XrdPattern />

      {/* Glow Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[180px] pointer-events-none animate-pulse duration-7000 delay-1000" />

      {/* Decorative Radial Grid (Diffraction Simulation) */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-[-20%] md:left-1/4 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] rounded-full pointer-events-none z-0"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-violet-500/[0.04] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500/[0.06] rounded-full border-dashed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-violet-500/[0.08] rounded-full" />
        
        {/* Reciprocal lattice points */}
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] -translate-x-1/2 -translate-y-1/2 rotate-45">
           <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-violet-400/50 blur-[1px] shadow-[0_0_10px_#8b5cf6]" />
           <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-violet-400/50 blur-[1px] shadow-[0_0_10px_#8b5cf6]" />
        </div>
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] -translate-x-1/2 -translate-y-1/2 rotate-[135deg]">
           <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shadow-[0_0_8px_#6366f1]" />
           <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-400/30 blur-[2px]" />
        </div>
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] -translate-x-1/2 -translate-y-1/2 rotate-90 bg-indigo-500-[0.01]">
           <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/80 shadow-[0_0_5px_#fff]" />
           <div className="absolute right-[40%] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/80 shadow-[0_0_5px_#fff]" />
        </div>
      </motion.div>

      {/* Left Main Content - Hero */}
      <div className="relative z-20 w-full lg:w-3/5 flex flex-col items-center justify-center p-8 lg:p-20 h-screen lg:h-screen overflow-y-auto shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/60 bg-[#020617]/70 backdrop-blur-2xl shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl w-full flex flex-col items-start text-left"
        >
           {/* Superior Top Badge */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.5, duration: 0.8 }}
             className="flex items-center gap-3 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 mb-10 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
           >
             <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
             </div>
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-300">Phase 3 Architecture Active</span>
           </motion.div>

           <h1 className="text-6xl sm:text-7xl lg:text-[7rem] font-black tracking-tighter mb-8 text-white uppercase italic leading-[0.85] drop-shadow-2xl flex flex-col w-full">
             <span>XRD-</span>
             <span className="flex items-center gap-4">
                Calc<span className="text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 via-indigo-300 to-sky-200">Pro</span>
                <Sparkles className="w-12 h-12 text-violet-400 opacity-60 animate-pulse mt-4 hidden sm:block" />
             </span>
           </h1>
           
           <p className="text-lg lg:text-2xl text-slate-400 max-w-xl font-medium leading-relaxed mb-12 tracking-tight">
             The high-fidelity computational framework for <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300 font-bold">Diffraction Physics</span>. 
             Engineered for exact phase identification, structural synthesis, and neural lattice mapping.
           </p>

           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full mb-16">
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={onEnter}
               className="group relative flex items-center justify-center px-12 py-6 bg-white text-slate-950 text-xs font-black uppercase tracking-[0.3em] rounded-2xl overflow-hidden transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)]"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-violet-200 via-white to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <span className="relative z-10 flex items-center gap-3">
                 Initialize Platform
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
               </span>
             </motion.button>
             
             <button className="flex items-center justify-center gap-3 group px-8 py-6 text-slate-400 hover:text-white border border-slate-800 rounded-2xl hover:border-violet-500/50 transition-all text-[10px] font-black uppercase tracking-widest bg-slate-900/60 backdrop-blur-md hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
               <Database className="w-4 h-4 text-violet-500 group-hover:text-violet-400 transition-colors" />
               Index Library
             </button>
           </div>
           
           {/* System Status Log Box */}
           <div className="w-full relative group">
              {/* Outer decorative borders */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-[2.2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              
              <div className="relative p-6 sm:p-8 bg-[#030712]/80 border border-slate-800/80 rounded-[2rem] backdrop-blur-2xl overflow-hidden">
                <div className="absolute top-0 left-[20%] w-[60%] h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                
                <div className="absolute top-5 right-6 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-slate-400 drop-shadow-md">Kernel Telemetry</span>
                </div>
                
                <div className="space-y-3 font-mono relative z-10">
                  {systemLogs.map((log, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start sm:items-center gap-3 text-[10px] sm:text-[11px]"
                    >
                      <span className="text-emerald-500/50 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <span className={`tracking-tight leading-loose ${idx === systemLogs.length - 1 ? 'text-indigo-300 font-bold drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'text-slate-500'}`}>{log}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
           </div>
           
        </motion.div>
      </div>

      {/* Right Sidebar - Module Explorer */}
      <div className="relative z-10 flex-1 lg:w-2/5 flex flex-col h-screen lg:h-screen bg-[#050816]/60 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col p-8 lg:p-12 border-b border-slate-800/80 sticky top-0 bg-[#050816]/90 backdrop-blur-xl z-30">
           <div className="flex items-center gap-3 mb-2">
             <div className="flex space-x-1">
                <span className="w-1.5 h-6 bg-violet-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full animate-pulse delay-75 mt-1"></span>
                <span className="w-1.5 h-5 bg-sky-500 rounded-full animate-pulse delay-150 mt-0.5"></span>
             </div>
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Suite</h2>
           </div>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Laboratory Modules</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
             {features.map((f, i) => (
               <FeatureCard key={f.title} {...f} index={i} />
             ))}
           </div>
           
           <div className="mt-12 flex flex-col gap-6 p-8 border border-slate-800/60 rounded-[2.5rem] bg-gradient-to-br from-slate-900/40 to-slate-950/40">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                   <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Authored By</h4>
                   <p className="text-lg font-serif italic text-white">Ali Zerehsaz</p>
                </div>
             </div>
             <div className="h-px w-full bg-slate-800/80" />
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Version</p>
                   <p className="text-xs font-mono text-slate-300">v2.5.0-b</p>
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Core Engine</p>
                   <p className="text-xs font-mono text-indigo-300">Q-Physics 4.2</p>
                </div>
             </div>
           </div>

           <div className="pt-10 pb-12 opacity-30">
              <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-[0.5em]">// EOF</p>
           </div>
        </div>
      </div>
    </div>
  );
};

