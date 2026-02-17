import React from 'react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header / Banner */}
        <div className="h-48 bg-gradient-to-r from-slate-800 to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/50">
               <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 border border-slate-200">
                 AZ
               </div>
            </div>
          </div>
        </div>
        
        <div className="pt-20 px-8 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Ali Zereh Saz</h1>
              <p className="text-xl text-indigo-600 font-medium mt-1">Product Designer & Senior Developer</p>
              <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm font-medium">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Available for new projects
              </p>
            </div>
            <div className="flex gap-3">
               <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
                 Contact Me
               </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-10">
               <section>
                 <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                   <span className="text-indigo-500">01.</span> About
                 </h2>
                 <p className="text-slate-600 leading-relaxed text-lg">
                   I am a passionate designer and developer focused on building high-precision scientific tools and intuitive user interfaces. 
                   With a deep background in computational physics and modern web technologies, I bridge the gap between complex data and elegant visualization.
                   <br/><br/>
                   Creator of <strong>XRD-Calc Pro</strong>, this platform represents my commitment to making advanced crystallography accessible to researchers worldwide.
                 </p>
               </section>

               <section>
                 <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                   <span className="text-indigo-500">02.</span> Featured Work
                 </h2>
                 <div className="grid gap-6">
                    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group cursor-default">
                       <div className="flex justify-between items-start mb-2">
                         <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">XRD-Calc Pro Suite</h3>
                         <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Live</span>
                       </div>
                       <p className="text-slate-600 mb-4">A comprehensive PWA for X-ray diffraction analysis featuring AI-driven phase identification, Rietveld refinement setup, and real-time peak profile simulation.</p>
                       <div className="flex gap-2 text-xs font-mono text-slate-400">
                         <span>React</span>
                         <span>•</span>
                         <span>TypeScript</span>
                         <span>•</span>
                         <span>Gemini AI</span>
                       </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group cursor-default">
                       <div className="flex justify-between items-start mb-2">
                         <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">CrystalMind Engine</h3>
                         <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Beta</span>
                       </div>
                       <p className="text-slate-600 mb-4">Neural network architecture designed to interpret noisy diffraction patterns and correlate them with the Crystallography Open Database (COD).</p>
                       <div className="flex gap-2 text-xs font-mono text-slate-400">
                         <span>Python</span>
                         <span>•</span>
                         <span>TensorFlow</span>
                         <span>•</span>
                         <span>FastAPI</span>
                       </div>
                    </div>
                 </div>
               </section>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider text-slate-500">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {['React 19', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Python', 'Three.js', 'D3.js', 'PostgreSQL', 'Docker'].map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-600 rounded-full opacity-20 blur-xl"></div>
                <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-wider opacity-70">Connect</h3>
                <ul className="space-y-4 text-sm relative z-10">
                  <li>
                    <a href="#" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg -ml-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      </div>
                      github.com/alizerehsaz
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg -ml-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      </div>
                      linkedin.com/in/alizerehsaz
                    </a>
                  </li>
                  <li>
                     <a href="mailto:contact@example.com" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg -ml-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      ali@zerehsaz.dev
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};