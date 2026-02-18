
import React, { useState } from 'react';

type Topic = 'start' | 'input' | 'ai' | 'modules' | 'troubleshoot';

export const LearnModule: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>('start');

  const topics: { id: Topic; label: string; icon: string }[] = [
    { id: 'start', label: 'Getting Started', icon: '🚀' },
    { id: 'input', label: 'Data Formatting', icon: '📝' },
    { id: 'ai', label: 'AI Capabilities', icon: '✨' },
    { id: 'modules', label: 'Module Guide', icon: '📦' },
    { id: 'troubleshoot', label: 'Troubleshooting', icon: '🔧' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 min-h-[600px]">
      {/* Navigation Sidebar */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 px-2">User Guide</h2>
          <div className="space-y-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                  activeTopic === topic.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                <span>{topic.icon}</span>
                {topic.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
          <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest mb-2">Pro Tip</h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
            Hover over tooltips in charts to see precise data points. Most calculations happen locally in your browser!
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-9">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 h-full">
          
          {activeTopic === 'start' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Welcome to XRD-Calc Pro</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                A professional-grade suite for X-ray diffraction analysis, combining classical physics engines with modern AI tools.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold mb-3">1</div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Select a Module</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Use the sidebar to navigate between tools. Start with <strong>Bragg Basics</strong> for standard peak analysis or <strong>Scherrer Method</strong> for size calculations.
                  </p>
                </div>
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold mb-3">2</div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Input Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enter your 2θ positions, FWHM values, or full pattern data. The app parses comma-separated or newline-separated values automatically.
                  </p>
                </div>
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold mb-3">3</div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Analyze & Visualize</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Click "Calculate" to generate instant results, interactive charts, and downloadable CSV reports.
                  </p>
                </div>
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold mb-3">4</div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Ask AI</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Stuck? Use the "Material Intelligence" bar or the floating chat bubble to ask crystallography questions or find standard peaks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTopic === 'input' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Data Input Formatting</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Different modules require specific data structures. Here is a quick reference guide.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">Bragg Basics (Simple Lists)</h3>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm">
                    <p className="mb-2 text-slate-500">// Comma separated list of 2θ positions</p>
                    <p>28.44, 47.30, 56.12, 69.13</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-2">Scherrer / W-H (Paired Data)</h3>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm">
                    <p className="mb-2 text-slate-500">// Each line: 2θ, FWHM</p>
                    <p>28.44, 0.25</p>
                    <p>47.30, 0.28</p>
                    <p>56.12, 0.32</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">Integral Breadth (Advanced)</h3>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm">
                    <p className="mb-2 text-slate-500">// Each line: 2θ, Area, Imax</p>
                    <p>28.44, 230, 1000</p>
                    <p>47.30, 280, 950</p>
                  </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-violet-600 dark:text-violet-400 mb-2">Deep Learning (XY Data)</h3>
                   <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm">
                    <p className="mb-2 text-slate-500">// Each line: 2θ, Intensity</p>
                    <p>28.44, 100</p>
                    <p>47.30, 55</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTopic === 'ai' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Gemini AI Integration</h2>
              
              <div className="grid gap-6">
                 <div className="flex gap-4 items-start">
                   <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Material Intelligence</h3>
                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                       Located in the <strong>Bragg Basics</strong> module. Type any material name (e.g., "Gold", "Perovskite") to instantly fetch standard peak positions, lattice parameters, and space groups.
                     </p>
                   </div>
                 </div>

                 <div className="flex gap-4 items-start">
                   <div className="p-3 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-xl">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Image Analysis</h3>
                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                       Upload an image of a diffraction plot or a data table. The AI (Gemini 1.5 Pro) will extract peak positions, identify phases, or summarize the visible data for you.
                     </p>
                   </div>
                 </div>

                 <div className="flex gap-4 items-start">
                   <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-xl">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">CrystalMind Control</h3>
                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                       An advanced agent that can search specific databases (COD, Materials Project) for crystal structures based on composition (e.g., "Ti, O") or peak fingerprints.
                     </p>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {activeTopic === 'modules' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Module Capabilities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   { t: 'Bragg Basics', d: 'd-spacing, Q-vector, and standard peak calculations.' },
                   { t: 'FWHM Analysis', d: 'Visualize Gaussian, Lorentzian, and Pseudo-Voigt peak shapes.' },
                   { t: 'Scherrer Method', d: 'Basic crystallite size estimation from peak broadening.' },
                   { t: 'Williamson-Hall', d: 'Separate size and strain effects using linear regression.' },
                   { t: 'Warren-Averbach', d: 'Fourier analysis for detailed microstructure distribution.' },
                   { t: 'Neutron Diffraction', d: 'Simulate nuclear scattering patterns (isotope sensitive).' },
                   { t: 'Magnetic Diffraction', d: 'Visualize magnetic peak contributions from spin structures.' },
                   { t: 'Rietveld Setup', d: 'Generate initial parameters and strategy for external refinement software.' },
                 ].map((m, i) => (
                   <div key={i} className="p-4 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                     <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">{m.t}</h4>
                     <p className="text-xs text-slate-600 dark:text-slate-400">{m.d}</p>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTopic === 'troubleshoot' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Common Issues</h2>
              
              <div className="space-y-4">
                <div className="collapse bg-base-200">
                   <div className="font-bold text-slate-800 dark:text-slate-200">My crystallite size is negative or zero.</div>
                   <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                     This usually happens if your <strong>Instrument FWHM</strong> is larger than your <strong>Observed FWHM</strong>. 
                     Ensure you subtract the instrumental broadening correctly. The app sets size to 0 if broadening is non-physical.
                   </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                   <div className="font-bold text-slate-800 dark:text-slate-200">AI search isn't working.</div>
                   <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                     Check your internet connection. If you are using the Image Generation feature, ensure you have selected a valid paid API key project via the popup.
                   </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                   <div className="font-bold text-slate-800 dark:text-slate-200">Williamson-Hall plot has a negative slope.</div>
                   <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                     A negative slope implies compressive strain or data errors. Ensure your data points are accurate and consistent.
                   </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
