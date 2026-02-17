import React from 'react';

interface ModuleIntroProps {
  module: string;
  onUnderstand: () => void;
}

// Helper for vertical fractions
const Fraction = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
  <div className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
    <span className="border-b border-slate-800 w-full text-center px-1 pb-[1px] mb-[1px]">{num}</span>
    <span className="w-full text-center px-1">{den}</span>
  </div>
);

// Helper for Math variables (Serif, Italic)
const M = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <span className={`font-serif italic ${className}`}>{children}</span>
);

// Helper for Function names (Serif, Upright)
const F = ({ children }: { children?: React.ReactNode }) => (
  <span className="font-serif font-normal">{children}</span>
);

const MODULE_CONTENT: Record<string, { title: string; description: string; formulas: React.ReactNode }> = {
  bragg: {
    title: "Bragg's Law & Diffraction Basics",
    description: "This module calculates the fundamental relationship between the angle of incidence, wavelength, and interplanar spacing in a crystal lattice.",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex flex-col gap-4 items-start">
          <div className="flex items-center flex-wrap">
            <strong className="text-indigo-700 mr-3 text-sm font-sans uppercase tracking-wider">Bragg's Law:</strong>
            <span>
              <M>n</M><M>λ</M> = 2<M>d</M> <F>sin</F>(<M>θ</M>)
            </span>
          </div>
          <div className="flex items-center flex-wrap">
            <strong className="text-emerald-700 mr-3 text-sm font-sans uppercase tracking-wider">Scattering Vector (Q):</strong>
            <span>
              <M>Q</M> = <Fraction num={<span>4<M>π</M> <F>sin</F>(<M>θ</M>)</span> den={<M>λ</M>} />
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-600 font-sans">
          <M>d</M>: Interplanar spacing, <M>θ</M>: Incident angle, <M>λ</M>: Wavelength
        </p>
      </div>
    )
  },
  fwhm: {
    title: "Line Profile & FWHM Analysis",
    description: "Analyzes the shape of diffraction peaks. Real peaks are not delta functions; they have width due to instrument effects and sample properties (size/strain).",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex flex-col gap-4">
          <div className="flex items-center flex-wrap">
             <strong className="text-orange-700 mr-3 text-sm font-sans uppercase tracking-wider">Pseudo-Voigt:</strong>
             <span>
               <M>V</M>(<M>x</M>) = <M>η</M>·<M>L</M>(<M>x</M>) + (1−<M>η</M>)·<M>G</M>(<M>x</M>)
             </span>
          </div>
          <div className="flex items-center flex-wrap">
            <strong className="text-orange-700 mr-3 text-sm font-sans uppercase tracking-wider">Integral Breadth:</strong>
            <span>
              <M>β</M> = <Fraction num={<F>Area</F>} den={<M>I</M><sub>max</sub>} />
            </span>
          </div>
        </div>
      </div>
    )
  },
  selection: {
    title: "Selection Rules & Extinction",
    description: "Determines which diffraction peaks are visible (Allowed) or missing (Forbidden) based on the centering of the crystal lattice (BCC, FCC, etc.).",
    formulas: (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900">
           <div className="flex items-center">
              <strong className="text-slate-700 mr-3 text-sm font-sans uppercase tracking-wider">Structure Factor:</strong>
              <span>
                <M>F</M><sub>hkl</sub> = <F>Σ</F> <M>f</M><sub>j</sub> <F>exp</F>[2<M>π</M><M>i</M>(<M>hx</M><sub>j</sub> + <M>ky</M><sub>j</sub> + <M>lz</M><sub>j</sub>)]
              </span>
           </div>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 font-sans">
          <li><strong>BCC:</strong> Allowed if (<M>h</M> + <M>k</M> + <M>l</M>) is even.</li>
          <li><strong>FCC:</strong> Allowed if <M>h</M>, <M>k</M>, <M>l</M> are all odd or all even.</li>
        </ul>
      </div>
    )
  },
  scherrer: {
    title: "Scherrer Equation (Crystallite Size)",
    description: "Estimates the average crystallite size (L) from peak broadening, assuming broadening is caused solely by size effects (ignoring strain).",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex items-center justify-center">
          <span className="mr-4 font-bold text-amber-700 font-sans uppercase text-sm">Crystallite Size:</span>
          <span>
            <M>D</M> = <Fraction num={<span><M>K</M> <M>λ</M></span>} den={<span><M>β</M> <F>cos</F>(<M>θ</M>)</span>} />
          </span>
        </div>
        <p className="text-sm text-slate-600 font-sans">
          <M>β</M>: Peak width in radians (corrected), <M>K</M>: Shape factor (~0.9)
        </p>
      </div>
    )
  },
  wh: {
    title: "Williamson-Hall Analysis",
    description: "Separates broadening contributions from Crystallite Size and Lattice Strain by plotting βcosθ vs 4sinθ.",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex flex-col gap-4">
           <div className="flex items-center flex-wrap justify-center">
             <strong className="text-cyan-700 mr-4 text-sm font-sans uppercase tracking-wider">W-H Equation:</strong>
             <span>
               <M>β</M><F>cos</F>(<M>θ</M>) = <M>ε</M>(4<F>sin</F><M>θ</M>) + <Fraction num={<span><M>K</M><M>λ</M></span>} den={<M>D</M>} />
             </span>
           </div>
           <div className="flex justify-center gap-8 text-base border-t border-slate-200 pt-3">
             <span className="text-slate-600"><F>y</F> = <M>β</M><F>cos</F><M>θ</M></span>
             <span className="text-slate-600"><F>x</F> = 4<F>sin</F><M>θ</M></span>
             <span className="text-slate-600"><F>slope</F> = <M>ε</M> (Strain)</span>
           </div>
        </div>
      </div>
    )
  },
  integral: {
    title: "Integral Breadth (Basic)",
    description: "Calculates peak width using the total area under the curve divided by maximum intensity.",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex flex-col gap-4 items-start">
           <div className="flex items-center">
              <strong className="text-purple-700 mr-3 text-sm font-sans uppercase tracking-wider">Integral Breadth:</strong>
              <span>
                <M>β</M><sub>IB</sub> = <Fraction num={<F>Area</F>} den={<M>I</M><sub>max</sub>} />
              </span>
           </div>
           <div className="flex items-center">
              <strong className="text-purple-700 mr-3 text-sm font-sans uppercase tracking-wider">Shape Factor:</strong>
              <span>
                <M>φ</M> = <Fraction num={<F>FWHM</F>} den={<M>β</M><sub>IB</sub>} />
              </span>
           </div>
        </div>
      </div>
    )
  },
  integral_adv: {
    title: "Advanced Size-Strain (Integral Breadth)",
    description: "Applies the Williamson-Hall method using Integral Breadth values instead of FWHM for higher accuracy.",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex flex-col gap-4">
           <div className="flex items-center">
             <strong className="text-pink-700 mr-3 text-sm font-sans uppercase tracking-wider">Instrument Correction:</strong>
             <span>
               <M>β</M><sub>sample</sub> = <M>β</M><sub>obs</sub> − <M>β</M><sub>inst</sub>
             </span>
           </div>
           <div className="flex items-center">
             <strong className="text-pink-700 mr-3 text-sm font-sans uppercase tracking-wider">Linear Plot:</strong>
             <span>
               <M>β</M><F>cos</F><M>θ</M> vs 4<F>sin</F><M>θ</M>
             </span>
           </div>
        </div>
      </div>
    )
  },
  wa: {
    title: "Warren-Averbach Method",
    description: "Fourier analysis method that separates size and strain distributions using multiple reflection orders.",
    formulas: (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex items-center justify-center">
           <span className="mr-3 font-bold text-rose-700 font-sans uppercase text-sm">Fourier Transform:</span>
           <span>
             <M>A</M>(<M>L</M>) = <Fraction num={<span><F>∫</F> <M>I</M>(<M>s</M>) <F>cos</F>(2<M>π</M><M>L</M><M>s</M>) <M>ds</M></span>} den={<span><F>∫</F> <M>I</M>(<M>s</M>) <M>ds</M></span>} />
           </span>
        </div>
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex items-center justify-center">
           <span className="mr-3 font-bold text-rose-700 font-sans uppercase text-sm">Separation:</span>
           <span>
             <F>ln</F> <M>A</M>(<M>L</M>) = <F>ln</F> <M>A</M><sub>size</sub>(<M>L</M>) − 2<M>π</M>²<M>L</M>²<M>ε</M>²<Fraction num="1" den={<span><M>d</M>²</span>} />
           </span>
        </div>
      </div>
    )
  },
  rietveld: {
    title: "Rietveld Refinement Setup",
    description: "Full-pattern fitting method minimizing the difference between calculated and observed patterns.",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex items-center justify-center">
          <span className="mr-3 font-bold text-teal-700 font-sans uppercase text-sm">Residual:</span>
          <span>
             <M>M</M> = <F>Σ</F> <M>W</M><sub>i</sub> (<M>y</M><sub>obs,i</sub> − <M>y</M><sub>calc,i</sub>)²
          </span>
        </div>
      </div>
    )
  },
  neutron: {
    title: "Neutron Diffraction",
    description: "Diffraction via scattering from atomic nuclei. Contrast depends on scattering length (b).",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex items-center justify-center">
           <span className="mr-3 font-bold text-blue-700 font-sans uppercase text-sm">Structure Factor:</span>
           <span>
             <M>F</M><sub>hkl</sub> = <F>Σ</F> <M>b</M><sub>j</sub> <F>exp</F>(2<M>π</M><M>i</M> <strong>r</strong><sub>j</sub> · <strong>Q</strong>) <M>T</M><sub>j</sub>
           </span>
        </div>
      </div>
    )
  },
  magnetic: {
    title: "Magnetic Diffraction",
    description: "Scattering from unpaired electron spins.",
    formulas: (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900 flex flex-col gap-4 items-center">
           <div className="flex items-center">
             <strong className="text-indigo-700 mr-3 text-sm font-sans uppercase tracking-wider">Interaction Vector:</strong>
             <span>
               <M>q</M> = <M>Q̂</M> × (<M>M</M> × <M>Q̂</M>)
             </span>
           </div>
           <div className="flex items-center">
             <strong className="text-indigo-700 mr-3 text-sm font-sans uppercase tracking-wider">Intensity:</strong>
             <span>
               <M>I</M><sub>mag</sub> ∝ |<M>F</M><sub>mag</sub>|² <F>sin</F>²(<M>α</M>)
             </span>
           </div>
        </div>
      </div>
    )
  },
  dl: {
    title: "Deep Learning Phase ID",
    description: "CNN-based pattern matching.",
    formulas: (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900">
           <p className="font-sans text-sm text-violet-700 font-bold uppercase mb-2">Architecture Flow</p>
           <div className="flex items-center gap-2 font-mono text-sm">
             <span className="bg-white px-2 py-1 rounded border">Input (1D)</span>
             <span>→</span>
             <span className="bg-white px-2 py-1 rounded border">Conv1D</span>
             <span>→</span>
             <span className="bg-white px-2 py-1 rounded border">MaxPool</span>
             <span>→</span>
             <span className="bg-white px-2 py-1 rounded border">Softmax</span>
           </div>
        </div>
      </div>
    )
  },
  image_analysis: {
    title: "Image & Score Analysis",
    description: "Uses Computer Vision and LLM reasoning to interpret uploaded diffraction patterns, screen captures from analysis software (e.g. HighScore), and data tables.",
    formulas: (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900">
           <p className="font-sans text-sm text-sky-700 font-bold uppercase mb-2">Capabilities</p>
           <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 font-sans">
              <li><strong>Peak Detection:</strong> Identifies 2θ positions from plot images.</li>
              <li><strong>Score Interpretation:</strong> Reads candidate lists and matching scores from software screenshots.</li>
              <li><strong>Phase Reasoning:</strong> Correlates visual data with crystallographic knowledge.</li>
           </ul>
        </div>
      </div>
    )
  },
  crystal_mind: {
    title: "CrystalMind-Control Database",
    description: "You are 'CrystalMind-Control', the database integration and search orchestration module for the CrystalMind AI platform. Your mission is to translate user requests into precise database search queries (COD, Materials Project, AMCSD).",
    formulas: (
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-lg text-slate-900">
           <p className="font-sans text-sm text-cyan-700 font-bold uppercase mb-3">Operational Directives</p>
           <div className="text-xs font-mono text-slate-700 space-y-3">
             <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
               <span className="font-bold text-cyan-600">1. Composition Search</span>
               <span>If elements provided → Match binary/ternary systems.</span>
             </div>
             <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
               <span className="font-bold text-cyan-600">2. Peak Fingerprint Match</span>
               <span>If peaks provided → Match d-spacing vs standard cards.</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="font-bold text-cyan-600">3. Metadata Retrieval</span>
               <span>Extract Lattice Params, Space Groups, and CIF links.</span>
             </div>
           </div>
        </div>
      </div>
    )
  }
};

export const ModuleIntro: React.FC<ModuleIntroProps> = ({ module, onUnderstand }) => {
  const content = MODULE_CONTENT[module] || {
    title: "Module Analysis",
    description: "Perform calculations specific to this crystallography method.",
    formulas: null
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-white/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold tracking-tight">Theory & Operations</h2>
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">
            {content.title}
          </h1>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Objective</h3>
            <p className="text-lg text-slate-700 leading-relaxed font-light">
              {content.description}
            </p>
          </div>

          {content.formulas && (
            <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Mathematical Basis</h3>
               {content.formulas}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={onUnderstand}
              className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span>I Understand</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};