import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Linkedin, 
  Github, 
  MapPin, 
  ExternalLink, 
  Award, 
  Code, 
  Cpu, 
  Globe,
  Terminal,
  Layers,
  ShieldCheck,
  Target,
  Zap,
  Camera,
  Sparkles,
  Search,
  ChevronRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-1000 p-4 lg:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500 rounded-full" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Dossier Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Badge & Avatar Section */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
            <div className="relative group">
               <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
               <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-3 overflow-hidden shadow-2xl">
                  <div className="aspect-square rounded-[2.5rem] bg-slate-950 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-800 group">
                     <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent" />
                     
                     {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Director" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                     ) : (
                        <div className="flex flex-col items-center">
                           <div className="w-48 h-48 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center relative mb-4">
                              <div className="w-40 h-40 bg-slate-800 rounded-full border border-indigo-500/20 flex items-center justify-center p-8">
                                 <Zap className="w-20 h-20 text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
                              </div>
                              <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full animate-spin-slow" />
                           </div>
                           <span className="text-4xl font-black text-white/20 select-none tracking-tighter">DIRECTOR</span>
                        </div>
                     )}

                     <div 
                        onClick={triggerFileInput}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm z-20"
                     >
                        <Camera className="w-10 h-10 text-white mb-2" />
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Update Identity</span>
                     </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*"
                  />
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl">
                     <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Personnel Clearance</h3>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                     <span className="text-xs font-bold text-slate-500">Classification</span>
                     <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">L-5 Senior Director</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                     <span className="text-xs font-bold text-slate-500">ID Reference</span>
                     <span className="text-xs font-mono text-slate-600 dark:text-slate-300">AZ-2001-CORE</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-500">Status</span>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Active</span>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Main Info Section */}
          <motion.div variants={itemVariants} className="lg:col-span-8">
             <div className="space-y-4 lg:space-y-6 mb-12">
                <div className="flex items-center gap-4">
                   <div className="h-px w-12 bg-indigo-500/30" />
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500">Founder & Laboratory Architect</span>
                </div>
                <h1 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">
                   Ali <br />
                   <span className="text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 via-indigo-400 to-indigo-300">Zerehsaz</span>
                </h1>
                <p className="text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-tight">
                  Pioneering high-fidelity computational frameworks for experimental physics and neuro-analytical material discovery.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6 lg:space-y-8">
                   <div className="group p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                           <Layers className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Expertise Domains</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Diffraction Physics', 'Symmetry Logic', 'Neural Architecture', 'Phase Identification', 'Spectrum Analysis', 'Lattice Topology'].map(skill => (
                          <span key={skill} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest rounded-xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors cursor-default">
                            {skill}
                          </span>
                        ))}
                      </div>
                   </div>

                   <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                         <Target className="w-32 h-32" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Laboratory Mission</h3>
                      <p className="text-xl font-medium leading-relaxed relative z-10">
                        "To engineer the most intuitive and scientifically accurate platform for diffraction analysis, empowering researchers with instant, high-fidelity insights."
                      </p>
                   </div>
                </div>

                <div className="space-y-6 lg:space-y-8">
                   <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-sky-500/10 rounded-2xl">
                           <Globe className="w-5 h-5 text-sky-500" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Secure Links</h3>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Network Node', val: 'ali@zerehsaz.dev', icon: Mail, url: 'mailto:ali@zerehsaz.dev' },
                          { label: 'LinkedIn Mesh', val: 'ali-zerehsaz', icon: Linkedin, url: 'https://linkedin.com' },
                          { label: 'GitHub Forge', val: 'ali-zerehsaz', icon: Github, url: 'https://github.com' }
                        ].map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group/link">
                             <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover/link:bg-indigo-500/10 transition-colors">
                                <link.icon className="w-4 h-4 text-slate-400 group-hover/link:text-indigo-500" />
                             </div>
                             <div className="flex-1">
                                <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">{link.label}</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/link:text-indigo-500 transition-colors uppercase italic font-serif tracking-tight">{link.val}</span>
                             </div>
                             <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover/link:opacity-100 transition-all -translate-x-2 group-hover/link:translate-x-0" />
                          </a>
                        ))}
                      </div>
                   </div>

                   <div className="p-8 bg-slate-950 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                           <Terminal className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Kernel Status</h3>
                      </div>
                      <p className="text-xs font-mono text-emerald-500/80 leading-relaxed mb-6 relative z-10">
                        &gt; Syncing Bragg engines... <br />
                        &gt; Deploying neural classifiers... <br />
                        &gt; Lab Protocol: ACTIVE.
                      </p>
                      <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Code className="w-20 h-20 text-white" />
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>

        {/* Development Timeline */}
        <motion.div variants={itemVariants} className="mt-16 lg:mt-24 pt-12 lg:pt-24 border-t border-slate-200 dark:border-slate-800">
           <div className="mb-12">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Director's Archive</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Scientific Milestones & Breakthroughs</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { year: '2021', title: 'Calculus Alpha', desc: 'Initial physics core developed for basic Bragg diffraction. Foundation of the XRD-Calc engine.' },
                { year: '2023', title: 'Macro-Structure Sync', desc: 'Integration of Williamson-Hall and Warren-Averbach protocols for advanced microstructural mapping.' },
                { year: '2024', title: 'Neural PhaseID', desc: 'Deployment of the first AI-driven phase identification node, providing probabilistic matching on raw data.' }
              ].map((item, i) => (
                <div key={i} className="relative p-8 lg:p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 group hover:border-indigo-500/30 transition-all shadow-sm">
                   <div className="absolute -top-3 left-10 px-4 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-black italic text-indigo-500">
                      {item.year}
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase italic">{item.title}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {item.desc}
                   </p>
                </div>
              ))}
           </div>
        </motion.div>

        {/* Global Footnote */}
        <motion.div variants={itemVariants} className="mt-20 lg:mt-24 text-center">
           <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">
              Ali Zerehsaz Studios • Established 2001
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
