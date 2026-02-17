
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const features = [
    {
      title: "Bragg & Diffraction Basics",
      description: "Fundamental calculations for d-spacing, Q-vectors, and scattering geometry (2θ ↔ d).",
      icon: "λ"
    },
    {
      title: "Line Profile Analysis",
      description: "Simulate peak shapes (Gaussian, Lorentzian, Pseudo-Voigt) and analyze FWHM properties.",
      icon: "∿"
    },
    {
      title: "Structure Selection Rules",
      description: "Determine allowed and forbidden reflections for SC, BCC, FCC, and Diamond structures.",
      icon: "hkl"
    },
    {
      title: "Size & Strain (Scherrer/W-H)",
      description: "Calculate crystallite size and microstrain using Scherrer, Williamson-Hall, and Integral Breadth methods.",
      icon: "nm"
    },
    {
      title: "Fourier Analysis (Warren-Averbach)",
      description: "Advanced microstructure analysis separating size and strain distributions via Fourier coefficients.",
      icon: "∫"
    },
    {
      title: "Neutron & Magnetic",
      description: "Simulate nuclear scattering and magnetic spin structure diffraction patterns.",
      icon: "M"
    },
    {
      title: "Rietveld Refinement",
      description: "Generate control parameters and strategies for full-pattern fitting.",
      icon: "R"
    },
    {
      title: "AI & Deep Learning",
      description: "Neural network phase identification and AI-powered image analysis of diffraction patterns.",
      icon: "AI"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden font-sans relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Left Sidebar - Scrollable Feature List */}
      <div className="relative z-20 w-full md:w-96 h-1/3 md:h-screen border-b md:border-b-0 md:border-r border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col shadow-2xl shrink-0">
        <div className="p-5 border-b border-white/10 bg-slate-900/80 sticky top-0 z-20 flex justify-between items-center md:block">
           <div>
             <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
               <span className="text-indigo-400">◆</span> Modules
             </h2>
             <p className="text-xs text-slate-500 mt-1 hidden md:block">Scroll to explore capabilities</p>
           </div>
           <div className="md:hidden text-xs text-slate-500">Scroll ↓</div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 md:space-y-4 scroll-smooth">
           {features.map((f, i) => (
             <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all duration-300 group cursor-default hover:border-indigo-500/30">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                   {f.icon}
                 </div>
                 <h3 className="font-bold text-sm text-slate-100 leading-tight">{f.title}</h3>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed pl-11">{f.description}</p>
             </div>
           ))}
           {/* Spacer for bottom scrolling */}
           <div className="h-6"></div>
        </div>
      </div>

      {/* Right Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center h-2/3 md:h-screen overflow-y-auto">
        <div className="max-w-4xl w-full animate-in fade-in slide-in-from-bottom-10 duration-1000 flex flex-col items-center">
           <div className="inline-block p-6 bg-white/5 rounded-3xl backdrop-blur-sm mb-8 border border-white/10 shadow-2xl ring-1 ring-white/10">
             <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-bold shadow-lg text-white">
               λ
             </div>
           </div>
           
           <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-sm">
             XRD-Calc<span className="text-indigo-400">Pro</span>
           </h1>
           
           <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-12">
             The comprehensive crystallography and diffraction analytics suite.
             <span className="block mt-2 text-indigo-300/80 text-base md:text-lg">High Precision • AI Integrated • Real-time Simulation</span>
           </p>

           <button 
            onClick={onEnter}
            className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-10px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95"
           >
            <span className="relative z-10">Enter Laboratory</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 group-hover:translate-x-1 transition-transform relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
           </button>
           
           <div className="mt-16 grid grid-cols-3 gap-8 opacity-40 text-[10px] md:text-xs font-mono text-slate-400 uppercase tracking-[0.2em]">
             <div>v2.5.0 Release</div>
             <div>Scientific Grade</div>
             <div>Gemini Powered</div>
           </div>
           
           <div className="mt-12 text-xs text-slate-500 font-mono opacity-50 hover:opacity-100 transition-opacity">
             Designed & Developed by Ali Zerehsaz
           </div>
        </div>
      </div>
    </div>
  );
};
