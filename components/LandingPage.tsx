import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Sparkles,
  ChevronRight,
  Shield,
  Star,
  Users,
  CheckCircle2,
  Globe,
  Smartphone,
  Apple,
  PlayCircle,
  Download,
  Twitter,
  Github,
  Linkedin,
  Mail,
  Box,
  Binary,
  Shapes,
  Atom
} from 'lucide-react';

import { SideSeekBar } from './SideSeekBar';

// --- Background Decorations ---
const DiffractionGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4f46e520,transparent_70%)]" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
    <div className="grid grid-cols-8 md:grid-cols-12 gap-px opacity-20 h-full w-full">
      {Array.from({ length: 96 }).map((_, i) => (
        <div key={i} className="border-[0.5px] border-slate-800" />
      ))}
    </div>
    <div className="absolute top-0 left-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-violet-500/50 to-transparent" />
    <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
  </div>
);

// --- 3D Lattice Decoration ---
const CrystalLattice = () => {
  const nodes = [
    { x: '20%', y: '20%', z: 0 }, { x: '80%', y: '20%', z: 0 },
    { x: '20%', y: '80%', z: 0 }, { x: '80%', y: '80%', z: 0 },
    { x: '35%', y: '35%', z: 1 }, { x: '95%', y: '35%', z: 1 },
    { x: '35%', y: '95%', z: 1 }, { x: '95%', y: '95%', z: 1 },
  ];
  return (
    <motion.div 
      animate={{ rotateY: 360, rotateX: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className="absolute top-[20%] right-[10%] w-[400px] h-[400px] pointer-events-none opacity-[0.15] hidden lg:block perspective-1000 transform-style-3d"
    >
      {nodes.map((n, i) => (
        <motion.div 
          key={i}
          className="absolute w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
          style={{ left: n.x, top: n.y, translateZ: n.z ? '100px' : '-100px' }}
        />
      ))}
      <svg className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(0)' }}>
         <line x1="20%" y1="20%" x2="80%" y2="20%" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
         <line x1="20%" y1="80%" x2="80%" y2="80%" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
         <line x1="20%" y1="20%" x2="20%" y2="80%" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
         <line x1="80%" y1="20%" x2="80%" y2="80%" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
      </svg>
    </motion.div>
  );
};

// --- Reusable Components ---
const SectionHeading = ({ badge, title, description, center = false }: { badge: string, title: string, description: string, center?: boolean }) => (
  <div className={`mb-16 ${center ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}`}>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4"
    >
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">{badge}</span>
    </motion.div>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-4xl md:text-6xl font-black text-white mb-6 uppercase italic tracking-tighter leading-none"
    >
      {title}
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
      className="text-lg text-slate-400 font-medium leading-relaxed"
    >
      {description}
    </motion.p>
  </div>
);

const FeatureCard = ({ title, description, icon: Icon, index }: { title: string, description: string, icon: any, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className="group relative bg-[#0B1221]/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] hover:border-violet-500/40 transition-all duration-700 cursor-default overflow-hidden shadow-2xl hover:translate-y-[-8px]"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className="flex flex-col items-start gap-6 relative z-10 h-full">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:border-violet-500/40 group-hover:text-violet-300 transition-all duration-500 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-300 group-hover:text-white transition-colors mb-4 leading-none">
          <span className="text-violet-500/50 mr-3 italic font-mono">/{(index + 1).toString().padStart(2, '0')}</span>
          {title}
        </h3>
        <p className="text-[13px] text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors font-medium">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

const PlatformIcon = ({ icon: Icon, label, desc }: { icon: any, label: string, desc: string }) => (
  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group shadow-xl">
    <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-violet-500 transition-colors shadow-inner">
      <Icon className="w-6 h-6 text-violet-400 group-hover:text-white" />
    </div>
    <div>
      <p className="text-sm font-black text-white tracking-wider leading-none mb-1">{label}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{desc}</p>
    </div>
  </div>
);

// --- Main Page Component ---
export const LandingPage = ({ onEnter, setTheme, theme }: { 
  onEnter: () => void, 
  setTheme: (theme: any) => void,
  theme: string
}) => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  const isRTL = i18n.language === 'he' || i18n.language === 'fa';

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: "AI Peak Search",
      description: "Proprietary deep learning models that identify phase signatures with 98.4% accuracy even in high-noise datasets.",
      icon: Brain
    },
    {
      title: "Rietveld Engine",
      description: "Hardware-accelerated refinement with real-time parameter optimization and visual live-sync monitoring.",
      icon: Cpu
    },
    {
      title: "Crystallographic DB",
      description: "Direct integration with global databases (COD/AMCSD) for seamless phase matching and structural lookup.",
      icon: Database
    },
    {
      title: "Cross-Platform Sync",
      description: "Analyze results on your desktop, and instantly review refinement strategy on your mobile device.",
      icon: Smartphone
    },
    {
      title: "Advanced Symmetry",
      description: "Automated space group determination and systematic absence validation using lattice centering intelligence.",
      icon: Hexagon
    },
    {
      title: "Enterprise Grade",
      description: "Encrypted data pipelines and multi-user workspace environments designed for institutional research teams.",
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-violet-500/30 relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] pointer-events-none z-50 contrast-150 brightness-100" />
      
      {/* Side Seek Navigation */}
      <SideSeekBar theme={theme} />

      {/* Theme Switcher Shared with App */}
      <div className="fixed top-24 right-6 z-[110] flex flex-col gap-2 bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-2xl opacity-0 hover:opacity-100 transition-opacity duration-300">
        {['light', 'dark', 'cyberpunk', 'terminal', 'synthwave'].map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t as any)}
            className={`w-6 h-6 rounded-lg transition-all ${
              theme === t ? 'bg-violet-500 scale-110 shadow-lg shadow-violet-500/50' : 'bg-slate-800 opacity-50 hover:opacity-100'
            }`}
          />
        ))}
      </div>

      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ${isScrolled ? 'bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:rotate-12 transition-transform">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black italic tracking-tighter leading-none">XRD-Calc<span className="text-violet-400">Pro</span></span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 mt-0.5">{t('Computational Suite')}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <select 
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent border-none text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="en" className="bg-slate-900">English (EN)</option>
              <option value="de" className="bg-slate-900">Deutsch (DE)</option>
              <option value="fr" className="bg-slate-900">Français (FR)</option>
              <option value="es" className="bg-slate-900">Español (ES)</option>
              <option value="it" className="bg-slate-900">Italiano (IT)</option>
              <option value="nl" className="bg-slate-900">Nederlands (NL)</option>
              <option value="pt" className="bg-slate-900">Português (PT)</option>
              <option value="pl" className="bg-slate-900">Polski (PL)</option>
              <option value="hu" className="bg-slate-900">Magyar (HU)</option>
              <option value="ru" className="bg-slate-900">Русский (RU)</option>
              <option value="uk" className="bg-slate-900">Українська (UK)</option>
              <option value="tr" className="bg-slate-900">Türkçe (TR)</option>
              <option value="ja" className="bg-slate-900">日本語 (JA)</option>
              <option value="zh" className="bg-slate-900">简体中文 (ZH)</option>
              <option value="ko" className="bg-slate-900">한국어 (KO)</option>
              <option value="hi" className="bg-slate-900">हिन्दी (HI)</option>
              <option value="bn" className="bg-slate-900">বাংলা (BN)</option>
              <option value="ar" className="bg-slate-900">العربية (AR)</option>
              <option value="fa" className="bg-slate-900">فارسی (FA)</option>
              <option value="he" className="bg-slate-900">עברית (HE)</option>
              <option value="vi" className="bg-slate-900">Tiếng Việt (VI)</option>
              <option value="id" className="bg-slate-900">Bahasa Indonesia (ID)</option>
              <option value="ms" className="bg-slate-900">Bahasa Melayu (MS)</option>
              <option value="th" className="bg-slate-900">ไทย (TH)</option>
              <option value="sv" className="bg-slate-900">Svenska (SV)</option>
              <option value="da" className="bg-slate-900">Dansk (DA)</option>
              <option value="no" className="bg-slate-900">Norsk (NO)</option>
              <option value="fi" className="bg-slate-900">Suomi (FI)</option>
              <option value="cs" className="bg-slate-900">Čeština (CS)</option>
              <option value="sk" className="bg-slate-900">Slovenčina (SK)</option>
              <option value="ro" className="bg-slate-900">Română (RO)</option>
              <option value="bg" className="bg-slate-900">Български (BG)</option>
              <option value="el" className="bg-slate-900">Ελληνικά (EL)</option>
              <option value="hr" className="bg-slate-900">Hrvatski (HR)</option>
              <option value="sr" className="bg-slate-900">Српски (SR)</option>
              <option value="sl" className="bg-slate-900">Slovenščina (SL)</option>
              <option value="ca" className="bg-slate-900">Català (CA)</option>
              <option value="tl" className="bg-slate-900">Tagalog (TL)</option>
            </select>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#platform" className="hover:text-white transition-colors">Platforms</a>
            <a href="#about" className="hover:text-white transition-colors">Performance</a>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={onEnter}
              className="hover:text-white transition-colors"
            >
              {t('Log In')}
            </button>
            <button 
              onClick={onEnter}
              className="bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-full shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all text-white active:scale-95"
            >
              {t('Get Started')}
            </button>
          </div>

          <button onClick={onEnter} className="md:hidden p-3 bg-white/5 rounded-xl border border-white/10">
            <ArrowRight className="w-5 h-5 text-violet-400" />
          </button>
        </div>
      </nav>

      <main className="flex-1 relative z-10">
        {/* --- Hero Section --- */}
        <section className="relative px-6 pt-48 pb-32 md:pb-56 min-h-[90vh] flex items-center overflow-hidden">
          <DiffractionGrid />
          <CrystalLattice />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div 
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-violet-600/10 border border-violet-500/30 mb-8 shadow-2xl backdrop-blur-sm"
              >
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/80">{t('Trusted labs')}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[6rem] font-black tracking-tighter mb-8 text-white uppercase italic leading-[1.1] drop-shadow-2xl flex flex-col md:block">
                <span className="opacity-70">XRD-</span>
                <span className="inline-flex items-center gap-4">
                  Calc<span className="text-transparent bg-clip-text bg-gradient-to-tr from-violet-500 via-indigo-400 to-cyan-300 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]">Pro</span>
                  <Sparkles className="w-10 h-10 text-violet-400 opacity-40 animate-pulse mt-1 hidden sm:inline-block" />
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-slate-400 font-medium mb-12 leading-relaxed max-w-2xl tracking-tight">
                {t('Hero Description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={onEnter}
                  className="flex-1 sm:flex-none px-12 py-6 bg-violet-600 hover:bg-violet-500 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-[0_20px_60px_rgba(139,92,246,0.3)] active:scale-95 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <span className="text-sm font-black uppercase tracking-[0.3em] italic relative z-10">{t('Get Control Access')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform relative z-10" />
                </button>
                <button className="flex-1 sm:flex-none px-12 py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-4 transition-all backdrop-blur-xl group shadow-2xl">
                  <PlayCircle className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-black uppercase tracking-[0.3em] italic">{t('Watch AI Demo')}</span>
                </button>
              </div>

              <div className="mt-20 grid grid-cols-2 sm:grid-cols-3 gap-10">
                <div className="space-y-1">
                  <p className="text-4xl font-black italic text-white leading-none tracking-tighter">0.15s</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Latency per Peak</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black italic text-white leading-none tracking-tighter">1.2M+</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">COD Profiles Loaded</p>
                </div>
                <div className="space-y-1 hidden sm:block">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Standard Excellence</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9, x: 50 }}
               animate={{ opacity: 1, scale: 1, x: 0 }}
               transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
               className="relative group perspective-2000 hidden lg:block"
            >
              <div className="absolute inset-0 bg-violet-600/10 blur-[150px] rounded-full group-hover:bg-violet-600/20 transition-all duration-1000" />
              <div className="relative z-10 transform rotate-y-[-12deg] rotate-x-[8deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-1000">
                <div className="bg-[#050B14]/80 backdrop-blur-sm rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_60px_100px_-20px_rgba(0,0,0,1)] aspect-[16/11] flex flex-col ring-1 ring-white/20">
                  <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-md">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="h-full bg-violet-500" />
                      </div>
                      <div className="w-12 h-2.5 bg-white/10 rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 p-8 flex flex-col gap-6">
                    <div className="h-48 w-full bg-[#070D18] rounded-3xl border border-white/5 relative overflow-hidden flex items-end p-6 gap-3 group/chart">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none" />
                       {Array.from({ length: 24 }).map((_, i) => (
                         <div key={i} className="flex-1 bg-violet-500/40 rounded-t-lg transition-all group-hover/chart:bg-violet-500/60" style={{ height: `${Math.sin(i * 0.4) * 40 + 60}%` }} />
                       ))}
                       <div className="absolute top-1/2 left-0 w-full h-px bg-cyan-500/30 border-dashed animate-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-6 flex-1">
                      <div className="bg-white/5 rounded-3xl border border-white/5 p-6 shadow-inner flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">RMS Residual</p>
                          <p className="text-xl font-black font-mono text-white">0.0423</p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-3xl border border-white/5 p-6 shadow-inner flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                          <Cpu className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Cores Active</p>
                          <p className="text-xl font-black font-mono text-white">X92-A</p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-3xl border border-white/5 p-6 shadow-inner flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                          <Shapes className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Symmetry</p>
                          <p className="text-xl font-black font-mono text-white">Fm-3m</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- Trust Logos --- */}
        <section className="py-20 border-y border-white/5 bg-white/[0.02] relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12 italic opacity-80">Institutional Research & Enterprise Partners</p>
            <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 opacity-25 grayscale hover:grayscale-0 transition-all duration-1000">
               {['Stanford', 'Oxford', 'CERN', 'Lawrence Berkeley', 'NASA'].map(logo => (
                 <span key={logo} className="text-2xl font-black italic tracking-tighter text-white uppercase select-none">{logo}</span>
               ))}
            </div>
          </div>
        </section>

        {/* --- Capabilities Grid --- */}
        <section id="features" className="py-32 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-violet-600/5 blur-[200px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <SectionHeading 
              badge="Standard Suite"
              title="Next-Generation Analysis Framework"
              description="A multi-modal environment designed for high-resolution refinement, automated peak identification, and structural simulation."
              center
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {features.map((f, i) => (
                <FeatureCard key={i} index={i} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* --- Code / API Integration Section --- */}
        <section className="py-32 px-6 bg-[#030812] border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
               <div className="bg-[#050A14] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-500" />
                  <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 flex-1 text-center">analysis_engine.py</div>
                  </div>
                  <pre className="p-6 md:p-8 overflow-x-auto custom-scrollbar font-mono text-xs md:text-sm leading-relaxed text-slate-300">
                    <code className="block">
                      <span className="text-violet-400">import</span> xrd_calc <span className="text-violet-400">as</span> xrd{'\n\n'}
                      <span className="text-slate-500"># Initiative engine with hardware acceleration</span>{'\n'}
                      engine = xrd.Engine(gpu_acceleration=<span className="text-cyan-400">True</span>, precision=<span className="text-emerald-400">'FP64'</span>){'\n\n'}
                      <span className="text-slate-500"># Load multi-modal diffraction pattern</span>{'\n'}
                      dataset = engine.load_pattern(<span className="text-emerald-400">"sample_alpha_09.xy"</span>){'\n\n'}
                      <span className="text-slate-500"># Execute AI-driven peak detection & matching</span>{'\n'}
                      phases, residuals = engine.refine_structure({'\n'}
                      {'    '}dataset=dataset,{'\n'}
                      {'    '}database=<span className="text-emerald-400">"COD_2026"</span>,{'\n'}
                      {'    '}tolerance=<span className="text-cyan-400">0.005</span>{'\n'}
                      ){'\n\n'}
                      <span className="text-violet-400">if</span> residuals.rms &lt; <span className="text-cyan-400">0.05</span>:{'\n'}
                      {'    '}engine.export_cif(phases, <span className="text-emerald-400">"refined_output.cif"</span>){'\n'}
                      {'    '}print(<span className="text-emerald-400">"Phase Matching Complete. High Confidence."</span>){'\n'}
                    </code>
                  </pre>
               </div>
            </motion.div>
            
            <div className="order-1 lg:order-2">
               <SectionHeading 
                 badge="Headless Operation"
                 title="Automate with Python SDK."
                 description="Integrate XRD-CalcPro directly into your CI/CD computational pipelines. Trigger refinements from LIMS (Laboratory Information Management Systems) and export results programmatically."
               />
               <ul className="space-y-6 mt-8 pl-4 border-l-2 border-violet-500/20">
                 <li className="flex flex-col gap-2 relative">
                   <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-[#030812]" />
                   <h4 className="text-white font-black uppercase tracking-widest text-sm italic">Direct COD Integration</h4>
                   <p className="text-slate-400 text-sm">Query over 500,000 structures in milliseconds using our specialized vector-search methodology.</p>
                 </li>
                 <li className="flex flex-col gap-2 relative">
                   <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-[#030812]" />
                   <h4 className="text-white font-black uppercase tracking-widest text-sm italic">Headless Rietveld</h4>
                   <p className="text-slate-400 text-sm">Optimize background polynomials and displacement parameters automatically via gradient descent.</p>
                 </li>
               </ul>
            </div>
          </div>
        </section>

        {/* --- Platform Synergy --- */}
        <section id="platform" className="py-32 px-6 bg-[#050B14]/40 border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <SectionHeading 
                badge="Universal Access"
                title="Your Lab, Synchronized."
                description="Analysis happens at the speed of thought. Push updates from the field directly to your refinement stack via mobile, or execute massive batches using our high-performance Cloud Terminal."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PlatformIcon icon={Globe} label="Cloud Terminal" desc="Browser Access" />
                <PlatformIcon icon={Smartphone} label="Mobile Pro" desc="iOS & Android" />
                <PlatformIcon icon={MonitorCheck} label="Workstation" desc="Native Build" />
                <PlatformIcon icon={Binary} label="Engine API" desc="Direct SDK" />
              </div>

              <div className="mt-16 flex flex-wrap gap-6">
                 <button className="flex items-center gap-4 bg-black py-4 px-8 rounded-2xl border border-white/10 hover:border-violet-500/50 transition-all shadow-xl group">
                    <Apple className="w-7 h-7 text-white" />
                    <div className="flex flex-col items-start leading-none group-hover:scale-105 transition-transform">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">Download on</span>
                      <span className="text-lg font-black tracking-tighter text-white">App Store</span>
                    </div>
                 </button>
                 <button className="flex items-center gap-4 bg-black py-4 px-8 rounded-2xl border border-white/10 hover:border-violet-500/50 transition-all shadow-xl group">
                    <PlayCircle className="w-7 h-7 text-violet-400" />
                    <div className="flex flex-col items-start leading-none group-hover:scale-105 transition-transform">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">Available on</span>
                      <span className="text-lg font-black tracking-tighter text-white">Google Play</span>
                    </div>
                 </button>
              </div>
            </motion.div>
            
            <div className="relative">
               <div className="absolute inset-0 bg-violet-600/20 blur-[150px] rounded-full opacity-60" />
               <motion.div 
                 initial={{ opacity: 0, rotate: 10, scale: 0.9 }}
                 whileInView={{ opacity: 1, rotate: -5, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                 className="relative z-10 flex flex-col items-center"
               >
                  <div className="relative w-full max-w-sm aspect-[9/19] bg-[#020617] ring-[12px] ring-slate-800 rounded-[3.5rem] overflow-hidden shadow-[0_80px_100px_-30px_rgba(0,0,0,0.8)] border border-white/10">
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-800 rounded-full z-20" />
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-violet-500/10 pointer-events-none" />
                     
                     <div className="p-8 pt-20 h-full flex flex-col gap-8">
                        <div className="h-40 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent" />
                           <Activity className="w-12 h-12 text-violet-500 opacity-30" />
                        </div>
                        <div className="space-y-4">
                           <div className="h-5 w-3/4 bg-white/10 rounded-full" />
                           <div className="h-5 w-1/2 bg-white/10 rounded-full" />
                        </div>
                        <div className="flex-1 bg-white/5 rounded-[2.5rem] border border-white/5 p-6 space-y-4">
                           <div className="flex justify-between items-center">
                              <div className="w-12 h-2.5 bg-violet-500/30 rounded-full" />
                              <div className="w-8 h-2.5 bg-white/10 rounded-full" />
                           </div>
                           <div className="h-24 w-full bg-black/40 rounded-2xl border border-white/5" />
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
          </div>
        </section>

        {/* --- Testimonial / Performance --- */}
        <section id="about" className="py-40 px-6 relative z-10">
           <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <h2 className="text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-none mb-10">
                      Engineered for<br />
                      The Heavyweight<br />
                      Research Teams.
                    </h2>
                    <p className="text-xl text-slate-400 font-medium mb-12 leading-relaxed max-w-xl">
                      We don't do toy models. XRD-CalcPro is built on industrial-grade physics engines designed to handle multi-gigabyte data runs with zero thermal throttling.
                    </p>
                    <div className="space-y-6">
                       {[
                         { label: "Hardware Accelerated", desc: "Native GPU support for massive refinement batches.", icon: Zap },
                         { label: "Institutional Trust", desc: "Bank-level encryption for proprietary chemical signatures.", icon: ShieldCheck },
                         { label: "Ph.D. Validated", desc: "Every model output is checked against NIST standards.", icon: FlaskConical }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                               <item.icon className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">{item.label}</p>
                               <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute inset-0 bg-violet-600/10 blur-[100px] rounded-full" />
                    <div className="relative bg-[#0B1221]/80 backdrop-blur-3xl border border-white/10 p-12 md:p-16 rounded-[4rem] shadow-2xl">
                       <div className="absolute -top-12 -left-12 text-[15rem] font-black text-white/[0.03] italic pointer-events-none select-none">"</div>
                       <blockquote className="text-2xl md:text-3xl font-medium italic text-slate-200 leading-relaxed relative z-10 mb-12">
                         "The transition to XRD-CalcPro was instantaneous. We reduced our phase validation bottleneck by almost 80%, allowing our lab to process four times as many samples as last year."
                       </blockquote>
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 overflow-hidden ring-4 ring-white/5">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=scientist" alt="User" />
                          </div>
                          <div>
                             <p className="text-lg font-black italic uppercase tracking-tighter text-white">Dr. Sarah Andersson</p>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-0.5">Head of Material Science, Quantum Tech Inst.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- Live Computation Terminal --- */}
        <section className="py-20 px-6 relative z-10 w-full overflow-hidden">
          <div className="absolute inset-0 bg-black" />
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-16 items-center">
             <div className="flex-1">
                 <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-none mb-6">
                   Deep Learning Model in Action
                 </h2>
                 <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg mb-8">
                    Watch the XRD-CalcPro cluster classify phases in real time, pulling from live COD datasets to match peak signatures instantly.
                 </p>
                 <div className="flex gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cluster Status:</p>
                       <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black animate-pulse">Running</span>
                    </div>
                 </div>
             </div>
             
             <div className="flex-1 w-full max-w-2xl bg-[#0a0a0a] border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-cyan-500/20 flex items-center px-4 gap-2 z-20">
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                   <span className="text-[10px] font-mono text-cyan-400/50 ml-2">XRD_TERMINAL_V4</span>
                </div>
                <div className="p-6 pt-12 font-mono text-[11px] leading-loose h-[300px] overflow-hidden relative flex flex-col justify-end">
                   <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10" />
                   <motion.div 
                     animate={{ y: [0, -150] }} 
                     transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                     className="text-cyan-500/70 absolute bottom-[-150px]"
                   >
                     <p>&gt; Initializing Rietveld refinement engine...</p>
                     <p>&gt; Loading sample data... [1.2MB] OK</p>
                     <p>&gt; Background subtraction... Polynomial order 6... OK</p>
                     <p>&gt; Locating peaks... Found 14 distinct reflections.</p>
                     <p className="text-emerald-400">&gt; Commencing database search against COD_2026...</p>
                     <p>&gt; MATCH FOUND: Silicon Dioxide (SiO2) - Quartz</p>
                     <p>&gt; Confidence: 99.1% | Reference: COD 9009666</p>
                     <p>&gt; Refinement Cycle 1... Rwp = 12.4%</p>
                     <p>&gt; Refinement Cycle 2... Rwp = 8.1%</p>
                     <p>&gt; Refinement Cycle 3... Rwp = 5.3%</p>
                     <p className="text-emerald-400">&gt; Convergence reached. Final Rwp: 5.3%.</p>
                     <p>&gt; Exporting CIF...</p>
                     <br/>
                     <p>&gt; SYSTEM IDLE. Awaiting new batch...</p>
                     <br/><br/><br/>
                   </motion.div>
                </div>
             </div>
          </div>
        </section>

        {/* --- Final CTA Overlay --- */}
        <section className="py-20 pb-48 px-6 relative z-10">
           <div className="max-w-7xl mx-auto">
              <div className="relative p-12 md:p-32 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-900 rounded-[4rem] overflow-hidden group shadow-[0_50px_100px_-20px_rgba(139,92,246,0.3)]">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                 <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full" />
                 
                 <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-10 italic uppercase tracking-tighter leading-none">Ready to Lead The Material Revolution?</h2>
                    <p className="text-xl md:text-2xl text-white/80 font-medium mb-16 leading-relaxed">
                       Secure your lab's spot in the next generation of crystallography. Start your 30-day institutional trial today.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                       <button onClick={onEnter} className="px-14 py-7 bg-white text-violet-700 rounded-3xl font-black uppercase tracking-[0.3em] italic text-sm hover:scale-105 hover:bg-slate-50 transition-all shadow-2xl active:scale-95 shadow-white/20">
                          Initialize Free Trial
                       </button>
                       <button onClick={onEnter} className="px-14 py-7 bg-violet-800/40 text-white border-2 border-white/20 backdrop-blur-2xl rounded-3xl font-black uppercase tracking-[0.3em] italic text-sm hover:bg-violet-800/60 transition-all active:scale-95">
                          View Pricing
                       </button>
                    </div>

                    <div className="mt-16 flex items-center justify-center gap-10">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">No Credit Card Required</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Full API Access</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black py-32 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20">
          <div className="lg:col-span-2">
             <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black italic tracking-tighter text-white uppercase">XRD-Calc<span className="text-violet-400">Pro</span></span>
             </div>
             <p className="text-slate-500 text-base font-medium leading-relaxed mb-12 max-w-sm">
               The global leader in AI-driven crystallographic computation. Trusted by researchers to push the boundaries of materials science.
             </p>
             <div className="flex gap-4">
                {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
             </div>
          </div>
          
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-10 italic text-violet-400">Core Suite</h4>
            <ul className="space-y-5 text-sm font-medium text-slate-500">
              <li className="hover:text-white transition-colors cursor-pointer">Peak Detection AI</li>
              <li className="hover:text-white transition-colors cursor-pointer">Phase Matching Engine</li>
              <li className="hover:text-white transition-colors cursor-pointer">Refinement Strategy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Lattice Analytics</li>
              <li className="hover:text-white transition-colors cursor-pointer">Systematic Absences</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-10 italic text-violet-400">Company</h4>
            <ul className="space-y-5 text-sm font-medium text-slate-500">
              <li className="hover:text-white transition-colors cursor-pointer">The Mission</li>
              <li className="hover:text-white transition-colors cursor-pointer">Partners</li>
              <li className="hover:text-white transition-colors cursor-pointer">Case Studies</li>
              <li className="hover:text-white transition-colors cursor-pointer">Pricing Model</li>
              <li className="hover:text-white transition-colors cursor-pointer">Security Core</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-10 italic text-violet-400">Support</h4>
            <ul className="space-y-5 text-sm font-medium text-slate-500">
              <li className="hover:text-white transition-colors cursor-pointer">Documentation</li>
              <li className="hover:text-white transition-colors cursor-pointer">API Reference</li>
              <li className="hover:text-white transition-colors cursor-pointer">System Status</li>
              <li className="hover:text-white transition-colors cursor-pointer">Help Center</li>
              <li className="hover:text-white transition-colors cursor-pointer">Contact Lab</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex flex-col md:flex-row items-center gap-10">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">© 2026 XRD-CALC PRO SYSTEMS INC. • Designed by Ali Zerehsaz</p>
              <div className="flex gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                 <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                 <span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span>
                 <span className="hover:text-white cursor-pointer transition-colors">Cookie Auth</span>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 group cursor-default">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Global Network: Online</span>
           </div>
        </div>
      </footer>
    </div>
  );
};
