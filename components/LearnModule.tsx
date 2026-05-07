
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  FileCode, 
  Brain, 
  Package, 
  LifeBuoy, 
  ArrowRight, 
  Zap, 
  Sparkles,
  ChevronRight,
  Database,
  Target
} from 'lucide-react';

type Topic = 'start' | 'input' | 'ai' | 'modules' | 'troubleshoot';

export const LearnModule: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>('start');

  const topics: { id: Topic; label: string; icon: any; color: string; bg: string }[] = [
    { id: 'start', label: 'Orientation', icon: Rocket, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'input', label: 'Data Protocol', icon: FileCode, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'ai', label: 'Neural Intelligence', icon: Brain, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 'modules', label: 'Engine Registry', icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'troubleshoot', label: 'Diagnostics', icon: LifeBuoy, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-700 min-h-[700px]">
      {/* Navigation Sidebar */}
      <div className="lg:col-span-3 space-y-8">
        <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative group">
          <div className="p-8 pb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 font-sans">User Knowledge Base</h2>
            <div className="space-y-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-4 group/btn relative overflow-hidden ${
                    activeTopic === topic.id
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                      : 'text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <topic.icon className={`w-4 h-4 transition-transform group-hover/btn:scale-110 relative z-10 ${activeTopic === topic.id ? 'text-white' : topic.color}`} />
                  <span className="relative z-10">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-8 pt-0 mt-4">
             <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group/card overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/card:opacity-30 transition-opacity">
                   <Target className="w-12 h-12 text-indigo-500" />
                </div>
                <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3 font-sans">Operational Tip</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold font-sans">
                  Calculations are executed locally in your browser's V8 engine for zero-latency analysis.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-9">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="p-12 flex-1"
            >
              {activeTopic === 'start' && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 font-sans">Phase 01</span>
                       <div className="h-px w-24 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none font-sans">
                      Integrated <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 to-indigo-400">Lab Protocol</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed font-sans">
                      Welcome to XRD-Calc Pro. Our environment is designed to bridge the gap between experimental data and actionable crystallographic insights.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                     {[
                        { title: 'Select Engine', desc: 'Navigate to the specialized module for your specific analysis requirement (Size, Strain, or PhaseID).', icon: Package },
                        { title: 'Inject Raw Data', desc: 'Formatted peak lists are processed through our high-fidelity physics model.', icon: FileCode },
                        { title: 'Analyze Output', desc: 'Generate multi-dimensional visualizations and downloadable scientific reports.', icon: Zap },
                        { title: 'Invoke Intelligence', desc: 'Query the Neural Net or Crystal Intelligence Hub for complex phase identification.', icon: Sparkles }
                     ].map((step, i) => (
                       <div key={`step-${i}`} className="group p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                               <step.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic font-mono">{String(i + 1).padStart(2, '0')}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 tracking-tighter font-sans">{step.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed font-sans">{step.desc}</p>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {activeTopic === 'input' && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none font-sans">Data Formatting Standards</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium font-sans">Precision begins with the input. Use these standard schemas for accurate analysis.</p>
                  </div>

                  <div className="space-y-8">
                     {[
                       { label: 'Bragg Basics', hint: 'Simple 2θ peaks', eg: '28.44, 47.30, 56.12', color: 'border-indigo-500/30', text: 'text-indigo-400' },
                       { label: 'Crystallite Size', hint: '2θ, FWHM pairs (space separated)', eg: '28.44, 0.25\n47.30, 0.28', color: 'border-emerald-500/30', text: 'text-emerald-400' },
                       { label: 'Neural PhaseID', hint: 'XY datasets (2θ, Intensity)', eg: '28.44, 100\n28.50, 45', color: 'border-violet-500/30', text: 'text-violet-400' }
                     ].map((item, i) => (
                       <div key={`format-${i}`} className={`p-8 bg-slate-950 rounded-[2rem] border ${item.color} relative group overflow-hidden`}>
                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] font-sans ${item.text}`}>{item.label}</h4>
                            <span className="text-[10px] text-slate-600 font-mono italic">{item.hint}</span>
                          </div>
                          <pre className="text-sm font-mono text-slate-300 relative z-10 whitespace-pre-wrap">{item.eg}</pre>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {activeTopic === 'ai' && (
                <div className="space-y-12">
                   <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none font-sans">Intelligence Ecosystem</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium font-sans">Augmenting traditional physics with state-of-the-art vision and reasoning models.</p>
                  </div>

                  <div className="grid gap-6">
                     {[
                       { t: 'Material Intelligence', d: 'Natural language search for peak cards and crystal properties.', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                       { t: 'Computer Vision Analysis', d: 'Extract peak locations directly from plot images or PDF captures.', icon: Database, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                       { t: 'Strategic Reasoning', d: 'The Crystal Intelligence Hub helps design analytical pathways for novel materials.', icon: Brain, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                     ].map((item, i) => (
                       <div key={`ai-${i}`} className="group flex gap-8 p-10 bg-slate-50 dark:bg-slate-800/30 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 transition-all items-center">
                          <div className={`p-6 rounded-[2rem] ${item.bg} group-hover:scale-110 transition-transform`}>
                             <item.icon className={`w-8 h-8 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 font-sans">{item.t}</h3>
                             <p className="text-base text-slate-500 dark:text-slate-400 font-bold leading-tight font-sans">{item.d}</p>
                          </div>
                          <button className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:text-indigo-500 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {activeTopic === 'modules' && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none font-sans">Engine Registry</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium font-sans">A specialized suite of tools for every stage of diffraction analysis.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[
                       { t: 'Bragg Basics', d: 'The foundation: d-spacing, Q-vectors, and lattice fundamentals.' },
                       { t: 'Williamson-Hall', d: 'Separation of Size and Strain broadening via linear regression.' },
                       { t: 'Magnetic Core', d: 'Analysis of spin-orbit contributions to neutron scattering.' },
                       { t: 'Neutral PhaseID', d: 'AI-accelerated peak matching against global databases.' },
                       { t: 'Rietveld Refiner', d: 'Full pattern fitting for structural parameter optimization.' },
                       { t: 'Scientific Illustrator', d: 'High-fidelity generation of structural and experimental diagrams.' }
                     ].map((m, i) => (
                       <div key={`mod-${i}`} className="p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group font-sans">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest">{m.t}</h4>
                            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors" />
                         </div>
                         <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{m.d}</p>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {activeTopic === 'troubleshoot' && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none font-sans">Status Diagnostics</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium font-sans">Resolve common environmental and data-integrity conflicts.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { q: 'Why is my crystallite size appearing as 0?', a: 'This occurs when Instrumental Broadening exceeds Observed Broadening. Check your calibration specimen data.' },
                      { q: 'The Neural Net is failing to trigger.', a: 'Ensure peak lists are 2θ, Intensity pairs and that your browser is not in offline mode.' },
                      { q: 'Negative slope on W-H Plot?', a: 'Typically caused by compressive strain or inaccurate peak indexing. Re-evaluate hkl assignments.' }
                    ].map((item, i) => (
                      <div key={`faq-${i}`} className="p-10 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-900 group font-sans">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                               <LifeBuoy className="w-5 h-5" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{item.q}</h4>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400 font-bold pl-14">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={`validator-${i}`} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                   ))}
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] font-sans">Validated by Research Guild</span>
             </div>
             
             <button 
               onClick={() => {
                 const currentIndex = topics.findIndex(t => t.id === activeTopic);
                 const nextTopic = topics[(currentIndex + 1) % topics.length].id;
                 setActiveTopic(nextTopic);
               }}
               className="flex items-center gap-4 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-transform active:scale-95 shadow-xl font-sans"
             >
               Next Directive
               <ArrowRight className="w-4 h-4" />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};
