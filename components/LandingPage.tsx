import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring } from 'motion/react';
import LanguageSelector from './LanguageSelector';
import { getActiveMaterials } from '../utils/materialsHelper';
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
  Atom,
  Search,
  Calculator
} from 'lucide-react';

import { SideSeekBar } from './SideSeekBar';

// --- Background Decorations ---
const DiffractionGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {/* Rich ambient radial glows */}
    <div className="absolute top-0 left-0 w-full h-[120%] bg-[radial-gradient(circle_at_50%_0%,#4f46e530,transparent_65%)]" />
    <div className="absolute bottom-0 right-0 w-full h-[100%] bg-[radial-gradient(circle_at_100%_100%,#06b6d420,transparent_50%)]" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
    
    {/* Grid backdrop */}
    <div className="grid grid-cols-8 md:grid-cols-12 gap-px opacity-[0.12] h-full w-full">
      {Array.from({ length: 96 }).map((_, i) => (
        <div key={i} className="border-[0.5px] border-slate-700/40" />
      ))}
    </div>

    {/* Concentric Bragg Rings (Diffraction arcs) representing X-ray Diffraction */}
    <div className="absolute top-0 left-0 w-[1200px] h-[1200px] -translate-x-1/2 -translate-y-1/2 opacity-10">
      <div className="absolute inset-0 rounded-full border border-violet-500 scale-[0.1]" />
      <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400 scale-[0.2] animate-spin" style={{ animationDuration: '120s' }} />
      <div className="absolute inset-0 rounded-full border border-violet-500 scale-[0.3]" />
      <div className="absolute inset-0 rounded-full border border-cyan-400 scale-[0.4]" />
      <div className="absolute inset-0 rounded-full border border-dashed border-violet-400 scale-[0.5] animate-spin" style={{ animationDuration: '180s' }} />
      <div className="absolute inset-0 rounded-full border border-cyan-400 scale-[0.6]" />
      <div className="absolute inset-0 rounded-full border border-violet-500 scale-[0.7]" />
      <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400 scale-[0.8]" />
    </div>

    {/* Elegant beam split line */}
    <div className="absolute top-0 left-[25%] w-[1px] h-full bg-gradient-to-b from-violet-500/40 via-violet-500/10 to-transparent" />
    <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    
    {/* Floating Scientific Equations */}
    <div className="absolute top-[14%] left-[6%] opacity-45 font-mono text-xs text-violet-300 transform -rotate-6 select-none drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] font-bold border border-violet-500/30 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
      <span>nλ = 2d sin(θ)</span>
    </div>
    <div className="absolute top-[48%] right-[8%] opacity-45 font-mono text-xs text-cyan-300 transform rotate-6 select-none drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] font-bold border border-cyan-500/30 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
      <span>τ = Kλ / (β cos(θ))</span>
    </div>
    <div className="absolute bottom-[22%] left-[22%] opacity-45 font-mono text-xs text-emerald-300 transform -rotate-3 select-none drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] font-bold border border-emerald-500/30 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
      <span>1/d² = (h²+k²+l²)/a²</span>
    </div>
    <div className="absolute top-[28%] right-[28%] opacity-35 font-mono text-xs text-rose-300 transform rotate-3 select-none drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] font-bold border border-rose-500/30 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
      <span>I(θ) = |F(hkl)|² · Lp</span>
    </div>
  </div>
);

// --- 3D Lattice Decoration ---
const CrystalLattice = ({ springX, springY }: { springX: any, springY: any }) => {
  // FCC structure-like lattice representation of a crystal matching NaCl/Silicon reference
  const nodes = [
    // Layer 1 (Back, z = -100px)
    { x: '15%', y: '15%', type: 'Na', size: 10, color: 'text-emerald-400', z: '-100px' },
    { x: '50%', y: '15%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '-100px' },
    { x: '85%', y: '15%', type: 'Na', size: 10, color: 'text-emerald-400', z: '-100px' },
    { x: '15%', y: '50%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '-100px' },
    { x: '50%', y: '50%', type: 'Na', size: 10, color: 'text-emerald-400', z: '-100px' },
    { x: '85%', y: '50%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '-100px' },
    { x: '15%', y: '85%', type: 'Na', size: 10, color: 'text-emerald-400', z: '-100px' },
    { x: '50%', y: '85%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '-100px' },
    { x: '85%', y: '85%', type: 'Na', size: 10, color: 'text-emerald-400', z: '-100px' },

    // Layer 2 (Middle, z = 0px)
    { x: '25%', y: '25%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '0px' },
    { x: '57.5%', y: '25%', type: 'Na', size: 10, color: 'text-emerald-400', z: '0px' },
    { x: '90%', y: '25%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '0px' },
    { x: '25%', y: '57.5%', type: 'Na', size: 10, color: 'text-emerald-400', z: '0px' },
    { x: '57.5%', y: '57.5%', type: 'Cl', size: 16, color: 'text-violet-400', z: '0px', highlight: true }, // custom glowing center
    { x: '90%', y: '57.5%', type: 'Na', size: 10, color: 'text-emerald-400', z: '0px' },
    { x: '25%', y: '90%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '0px' },
    { x: '57.5%', y: '90%', type: 'Na', size: 10, color: 'text-emerald-400', z: '0px' },
    { x: '90%', y: '90%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '0px' },

    // Layer 3 (Front, z = 100px)
    { x: '35%', y: '35%', type: 'Na', size: 10, color: 'text-emerald-400', z: '100px' },
    { x: '65%', y: '35%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '100px' },
    { x: '95%', y: '35%', type: 'Na', size: 10, color: 'text-emerald-400', z: '100px' },
    { x: '35%', y: '65%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '100px' },
    { x: '65%', y: '65%', type: 'Na', size: 10, color: 'text-emerald-400', z: '100px' },
    { x: '95%', y: '65%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '100px' },
    { x: '35%', y: '95%', type: 'Na', size: 10, color: 'text-emerald-400', z: '100px' },
    { x: '65%', y: '95%', type: 'Cl', size: 14, color: 'text-cyan-400', z: '100px' },
    { x: '95%', y: '95%', type: 'Na', size: 10, color: 'text-emerald-400', z: '100px' },
  ];

  return (
    <motion.div 
      style={{
        rotateX: springY,
        rotateY: springX,
        animationDuration: '4s'
      }}
      className="absolute top-[18%] right-[5%] w-[480px] h-[480px] pointer-events-none opacity-[0.35] hidden lg:block perspective-1000 transform-style-3d z-0 animate-pulse"
    >
      <motion.div
        animate={{ rotateZ: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="w-full h-full transform-style-3d relative"
      >
        {/* Orbital concentric rings to represent diffraction paths */}
        <div className="absolute inset-0 border border-violet-500/10 rounded-full scale-[1.2] transform-style-3d pointer-events-none" />
        <div className="absolute inset-0 border border-dashed border-cyan-500/5 rounded-full scale-[0.8] transform-style-3d pointer-events-none animate-spin" style={{ animationDuration: '30s' }} />
        <div className="absolute inset-0 border border-indigo-500/15 rounded-full scale-[0.5] transform-style-3d pointer-events-none" />

        {/* 3D lattice bonds */}
        <svg className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(0)' }}>
           {/* Grid 1 back */}
           <line x1="15%" y1="15%" x2="85%" y2="15%" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
           <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
           <line x1="15%" y1="85%" x2="85%" y2="85%" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
           <line x1="15%" y1="15%" x2="15%" y2="85%" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
           <line x1="50%" y1="15%" x2="50%" y2="85%" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
           <line x1="85%" y1="15%" x2="85%" y2="85%" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />

           {/* Grid 2 front */}
           <line x1="35%" y1="35%" x2="95%" y2="35%" stroke="rgba(6,182,212,0.35)" strokeWidth="1.5" />
           <line x1="35%" y1="65%" x2="95%" y2="65%" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />
           <line x1="35%" y1="95%" x2="95%" y2="95%" stroke="rgba(6,182,212,0.35)" strokeWidth="1.5" />
           <line x1="35%" y1="35%" x2="35%" y2="95%" stroke="rgba(6,182,212,0.35)" strokeWidth="1.5" />
           <line x1="65%" y1="35%" x2="65%" y2="95%" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />
           <line x1="95%" y1="35%" x2="95%" y2="95%" stroke="rgba(6,182,212,0.35)" strokeWidth="1.5" />

           {/* Connectors between back and front */}
           <line x1="15%" y1="15%" x2="35%" y2="35%" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeDasharray="2 2" />
           <line x1="85%" y1="15%" x2="95%" y2="35%" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeDasharray="2 2" />
           <line x1="15%" y1="85%" x2="35%" y2="95%" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeDasharray="2 2" />
           <line x1="85%" y1="85%" x2="95%" y2="95%" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeDasharray="2 2" />

           <line x1="50%" y1="50%" x2="65%" y2="65%" stroke="rgba(244,63,94,0.3)" strokeWidth="1" strokeDasharray="4 2" />
           <line x1="50%" y1="15%" x2="65%" y2="35%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
           <line x1="85%" y1="50%" x2="95%" y2="65%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
           <line x1="50%" y1="85%" x2="65%" y2="95%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
           <line x1="15%" y1="50%" x2="35%" y2="65%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
        </svg>

        {/* Nodes */}
        {nodes.map((n, i) => (
          <motion.div 
            key={i}
            className={`absolute rounded-full flex items-center justify-center bg-current ${n.color} transition-all duration-300`}
            style={{ 
              left: n.x, 
              top: n.y, 
              width: n.size, 
              height: n.size,
              translateZ: n.z,
              boxShadow: n.highlight ? '0 0 25px rgba(167, 139, 250, 0.9)' : '0 0 12px currentColor'
            }}
          >
            {n.highlight && (
              <span className="absolute w-full h-full rounded-full bg-violet-400 animate-ping opacity-75" />
            )}
          </motion.div>
        ))}
      </motion.div>
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
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300">{badge}</span>
    </motion.div>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] drop-shadow-sm"
    >
      {title}
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
      className="text-lg text-slate-300 font-medium leading-relaxed"
    >
      {description}
    </motion.p>
  </div>
);

const FeatureCard = ({ title, description, icon: Icon, index, module, onLaunch }: { title: string, description: string, icon: any, index: number, module?: string, onLaunch?: (mod: string) => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    onClick={() => module && onLaunch?.(module)}
    className={`group relative bg-[#090F1E]/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] hover:border-violet-500/50 transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-violet-950/30 hover:-translate-y-1 block ${module ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="flex flex-col items-start gap-6 relative z-10 h-full">
      <div className="w-12 h-12 rounded-2xl bg-[#030712] border border-slate-800 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-950 group-hover:border-violet-500/50 group-hover:text-violet-300 transition-all duration-300 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-sm tracking-wide text-slate-200 group-hover:text-white transition-colors mb-2.5 flex items-center gap-2">
          {title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-350 transition-colors font-medium">
          {description}
        </p>
        
        {module && (
          <div className="mt-5 flex items-center gap-1.5 text-[10px] font-black uppercase text-violet-400 tracking-wider group-hover:text-cyan-300 transition-colors">
            <span>Launch Instrument</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        )}
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

// --- Interactive Bragg Sandbox Component ---
const BraggSandboxWrapper = ({ onEnter }: { onEnter: () => void }) => {
  const [lambda, setLambda] = useState(1.5406); // Cu-Ka default
  const [dSpace, setDSpace] = useState(2.82);   // NaCl default
  const [order, setOrder] = useState(1);
  const [activeAnode, setActiveAnode] = useState('Cu');
  const [selectedMaterial, setSelectedMaterial] = useState('NaCl');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

  const animFrameRef = useRef<number | null>(null);

  const handleCanvasDrag = (clientY: number) => {
    if (animFrameRef.current) return;
    
    animFrameRef.current = requestAnimationFrame(() => {
      if (!svgRef.current) {
        animFrameRef.current = null;
        return;
      }
      const rect = svgRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const distanceToCenter = Math.abs(relativeY - (rect.height / 2));
      const computedD = distanceToCenter / 22;
      const clampedD = Math.max(1.00, Math.min(6.00, computedD));
      setDSpace(clampedD);
      setSelectedMaterial('custom');
      animFrameRef.current = null;
    });
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDraggingCanvas) {
        handleCanvasDrag(e.clientY);
      }
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingCanvas) {
        handleCanvasDrag(e.touches[0].clientY);
      }
    };
    const handleGlobalUp = () => {
      setIsDraggingCanvas(false);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDraggingCanvas]);

  const presets = [
    { name: 'Copper (Cu)', symbol: 'Cu', val: 1.5406, color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
    { name: 'Molybdenum (Mo)', symbol: 'Mo', val: 0.7107, color: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
    { name: 'Chromium (Cr)', symbol: 'Cr', val: 2.290, color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
    { name: 'Cobalt (Co)', symbol: 'Co', val: 1.789, color: 'bg-pink-500/10 border-pink-500/30 text-pink-300' },
  ];

  const materialPresets = [
    { name: 'Halite (NaCl)', symbol: 'NaCl', d: 2.820, group: 'Fm-3m', system: 'Cubic', hkl: '(200)', notes: 'Rock salt crystal standard' },
    { name: 'Silicon (Si)', symbol: 'Si', d: 3.135, group: 'Fd-3m', system: 'Cubic', hkl: '(111)', notes: 'Ultra-pure semiconductor standard' },
    { name: 'Gold Foil (Au)', symbol: 'Au', d: 2.355, group: 'Fm-3m', system: 'Cubic', hkl: '(111)', notes: 'FCC precious metal metric' },
    { name: 'Anatase (TiO2)', symbol: 'TiO2', d: 3.520, group: 'I41/amd', system: 'Tetragonal', hkl: '(101)', notes: 'Photocatalytic oxide lattice' },
    { name: 'Graphite Carbon (C)', symbol: 'C', d: 3.354, group: 'P63/mmc', system: 'Hexagonal', hkl: '(002)', notes: 'Layered basal plane graphene sheets' },
  ];

  // Bragg's Law calculation: 2d sin(theta) = n * lambda
  const sinTheta = (order * lambda) / (2 * dSpace);
  const isValid = sinTheta >= 0 && sinTheta <= 1;

  const thetaRad = isValid ? Math.asin(sinTheta) : 0;
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const twoThetaDeg = thetaDeg * 2;

  // SVG dimensions for diffraction trace
  const svgW = 420;
  const svgH = 220;
  const cx = 210;
  const cy = 110;

  // Spacing helper
  const scaleD = Math.max(25, dSpace * 22);

  // Plane Y values
  const y1 = cy - scaleD;
  const y2 = cy;
  const y3 = cy + scaleD;

  const displayAngleRad = thetaRad > 0.05 ? thetaRad : Math.PI / 6; // fallback visual representation
  const beamLen = 160;
  const dx = Math.cos(displayAngleRad) * beamLen;
  const dy = Math.sin(displayAngleRad) * beamLen;

  // Intersection coordinates at central atom (y2)
  const rxInX = cx - dx;
  const rxInY = y2 - dy;
  const rxOutX = cx + dx;
  const rxOutY = y2 - dy;

  // Underneath atomic plane 3 reflection trigger
  const xOffset = Math.tan(displayAngleRad) > 0.05 ? scaleD / Math.tan(displayAngleRad) : 0;
  const rx3X = cx - xOffset;
  const rx3OutX = cx + xOffset;

  // Sinusoidal wave drawer along path
  const generateWaveLine = (x1: number, y1: number, x2: number, y2: number, amp: number, freq: number, phase: number = 0) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const steps = 30; // Highly optimized, clean wave points
    let points = `M ${x1.toFixed(1)},${y1.toFixed(1)}`;
    const factor = (2 * Math.PI * freq) / len;
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const d = t * len;
      const waveVal = amp * Math.sin(d * factor + phase);
      const px = x1 + d * Math.cos(angle) - waveVal * Math.sin(angle);
      const py = y1 + d * Math.sin(angle) + waveVal * Math.cos(angle);
      points += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
    }
    return points;
  };

  const activeMaterial = materialPresets.find(m => m.symbol === selectedMaterial);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start bg-slate-900/30 backdrop-blur-3xl border border-slate-800/80 p-8 md:p-12 rounded-[3rem] shadow-2xl">
      {/* Settings Panel */}
      <div className="lg:col-span-5 space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Parameter Sandbox & Mini Lab
          </h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Interactively tune wavelength, choose crystal standard samples, and observe the diffraction peak position calibrate.
          </p>
        </div>

        {/* MATERIAL STANDARDS CONFIG */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
            Select Calibration Crystal Standard
          </label>
          <div className="flex flex-wrap gap-2">
            {materialPresets.map((mat) => (
              <button
                key={mat.symbol}
                onClick={() => {
                  setDSpace(mat.d);
                  setSelectedMaterial(mat.symbol);
                }}
                className={`flex-1 min-w-[110px] px-3 py-2.5 border rounded-xl text-left transition-all font-sans cursor-pointer flex flex-col justify-between ${
                  selectedMaterial === mat.symbol
                    ? 'border-violet-500 bg-violet-500/15 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Atom className={`w-3.5 h-3.5 ${selectedMaterial === mat.symbol ? 'text-violet-400' : 'text-slate-500'}`} />
                  <span className="text-[11px] font-black tracking-wider block">{mat.symbol}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80 mt-1">{mat.d.toFixed(3)} Å</span>
              </button>
            ))}
          </div>
        </div>

        {/* PRESSET ANODE selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
            Anode Target Tube (Radiation Source λ)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.symbol}
                onClick={() => {
                  setLambda(p.val);
                  setActiveAnode(p.symbol);
                }}
                className={`px-3 py-2 border rounded-xl text-left transition-all font-sans cursor-pointer flex flex-col justify-between ${
                  activeAnode === p.symbol
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className="text-[11px] font-black tracking-wider block">{p.symbol}-Kα</span>
                <span className="text-[10px] font-mono opacity-80">{p.val.toFixed(4)} Å</span>
              </button>
            ))}
          </div>
        </div>

        {/* SLIDER FOR LAMBDA */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Wavelength Tuning (λ)
            </label>
            <span className="text-xs font-mono font-bold text-violet-300">
              {lambda.toFixed(4)} Å {activeAnode === 'custom' ? '(Custom)' : `(${activeAnode}-Kα)`}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.001"
            value={String(lambda) === 'NaN' ? '' : lambda}
            onChange={(e) => {
              setLambda(parseFloat(e.target.value));
              setActiveAnode('custom');
            }}
            className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg outline-none"
          />
        </div>

        {/* SLIDER FOR D_SPACING */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Interplanar Spacing (d)
            </label>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {dSpace.toFixed(3)} Å {selectedMaterial !== 'custom' ? `(${selectedMaterial})` : '(Custom)'}
            </span>
          </div>
          <input
            type="range"
            min="1.00"
            max="6.00"
            step="0.01"
            value={String(dSpace) === 'NaN' ? '' : dSpace}
            onChange={(e) => {
              setDSpace(parseFloat(e.target.value));
              setSelectedMaterial('custom');
            }}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg outline-none"
          />
        </div>

        {/* ORDER PICKER */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">
            Diffraction Reflection Order (n)
          </label>
          <div className="flex gap-4">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setOrder(num)}
                className={`flex-1 py-2 rounded-xl border text-xs font-mono tracking-widest font-black uppercase transition-all cursor-pointer ${
                  order === num
                    ? 'bg-violet-600/10 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700/50 hover:text-slate-300'
                }`}
              >
                n = {num}
              </button>
            ))}
          </div>
        </div>

        {/* Material specs profile card */}
        {activeMaterial && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 blur-xl rounded-full" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-400 font-mono">Structural Details</span>
              <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-400">{activeMaterial.system}</span>
            </div>
            <p className="text-sm font-black text-white">{activeMaterial.name}</p>
            <div className="grid grid-cols-2 gap-4 mt-2 border-t border-slate-800/80 pt-2 text-[11px] font-mono">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Space Group</span>
                <span className="text-slate-300 font-bold">{activeMaterial.group}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Reflecting Plane</span>
                <span className="text-cyan-400 font-bold">{activeMaterial.hkl}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">{activeMaterial.notes}</p>
          </div>
        )}
      </div>

      {/* Visual Workspace */}
      <div className="lg:col-span-7 flex flex-col items-center bg-[#050A14] border border-slate-800/60 p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden self-stretch justify-between">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        
        {/* Real-time Math Outputs Header */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 relative z-10 text-center">
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/40">
            <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">Bragg angle (θ)</span>
            <span className="text-xl font-black font-mono text-white">
              {isValid ? `${thetaDeg.toFixed(2)}°` : '🚫 Limit'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/40">
            <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">Peak Position (2θ)</span>
            <span className="text-xl font-black font-mono text-cyan-400">
              {isValid ? `${twoThetaDeg.toFixed(2)}°` : '🚫 Invalid'}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/40 flex items-center justify-center">
            {isValid ? (
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Diffraction OK
              </span>
            ) : (
              <span className="text-[10px] uppercase font-black tracking-wide text-rose-400 leading-tight">
                🚫 Limit: nλ &gt; 2d
              </span>
            )}
          </div>
        </div>

        {/* Dragging instruction badge */}
        <div className="text-[9px] font-mono bg-slate-900/80 px-3 py-1 rounded-full text-slate-400 border border-slate-800 text-center select-none uppercase tracking-widest mb-2 z-10">
          ↔ Drag canvas background to adjust d-spacing ↔
        </div>

        {/* Simulated Ray Tracing Canvas SVG */}
        <div className="w-full flex-1 flex items-center justify-center relative min-h-[220px]">
          <svg 
            ref={svgRef}
            width={svgW} 
            height={svgH} 
            className="max-w-full drop-shadow-2xl cursor-ns-resize select-none touch-none"
            onMouseDown={(e) => {
              setIsDraggingCanvas(true);
              handleCanvasDrag(e.clientY);
            }}
            onTouchStart={(e) => {
              setIsDraggingCanvas(true);
              handleCanvasDrag(e.touches[0].clientY);
            }}
          >
            {/* Plane horizontal grid lines of atom rows */}
            <line x1="30" y1={y1} x2={svgW - 30} y2={y1} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5 3" />
            <line x1="10" y1={y2} x2={svgW - 10} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <line x1="30" y1={y3} x2={svgW - 30} y2={y3} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5 3" />

            {/* Atomic Rows */}
            {/* Plane 1 atoms */}
            {[-3, -2, -1, 0, 1, 2, 3].map((pos) => (
              <circle key={`atom1-${pos}`} cx={cx + pos * 50} cy={y1} r="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.05)" />
            ))}
            {/* Plane 2 atoms (center reflecting plane) */}
            {[-3, -2, -1, 0, 1, 2, 3].map((pos) => (
              <circle 
                key={`atom2-${pos}`} 
                cx={cx + pos * 50} 
                cy={y2} 
                r={pos === 0 ? "8" : "5"} 
                fill={pos === 0 ? "#22d3ee" : "rgba(255,255,255,0.3)"} 
                className={pos === 0 ? "animate-pulse" : ""}
                style={{ filter: pos === 0 ? 'drop-shadow(0 0 8px rgba(34,211,238,0.7))' : 'none' }}
              />
            ))}
            {/* Plane 3 atoms */}
            {[-3, -2, -1, 0, 1, 2, 3].map((pos) => (
              <circle 
                key={`atom3-${pos}`} 
                cx={cx + pos * 50} 
                cy={y3} 
                r={pos === 0 ? "7" : "4"} 
                fill={pos === 0 ? "#8b5cf6" : "rgba(255,255,255,0.15)"} 
              />
            ))}

            {isValid && (
              <>
                {/* Wave 1 - Incident wave trace */}
                <path
                  d={generateWaveLine(rxInX, rxInY, cx, y2, 5, 8, -Date.now() / 80)}
                  fill="none"
                  stroke="url(#incWaveGrad)"
                  strokeWidth="2"
                />

                {/* Wave 2 - Diffracted wave trace (In Phase visualization) */}
                <path
                  d={generateWaveLine(cx, y2, rxOutX, rxOutY, 5, 8, -Date.now() / 80)}
                  fill="none"
                  stroke="url(#difWaveGrad)"
                  strokeWidth="2.5"
                />

                {/* Sub-surface Ray 2 reflection to demonstrate constructive path difference */}
                <line 
                  x1={cx - dx - xOffset} y1={y2 - dy} x2={rx3X} y2={y3} 
                  stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1.5" 
                />
                <line 
                  x1={rx3X} y1={y3} x2={rx3OutX} y2={y3} 
                  stroke="rgba(139, 92, 246, 0.4)" strokeWidth="1.5" strokeDasharray="3 3"
                />
                <line 
                  x1={rx3OutX} y1={y3} x2={cx + dx + xOffset} y2={y2 - dy} 
                  stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1.5" 
                />

                {/* Bragg Angle Indicator arc text */}
                <path 
                  d={`M ${cx - 35} ${y2} A 35 35 0 0 1 ${cx - 35 * Math.cos(displayAngleRad)} ${y2 - 35 * Math.sin(displayAngleRad)}`} 
                  fill="none" stroke="#22d3ee" strokeWidth="1.5" 
                />
                <text x={cx - 52} y={y2 - 8} fill="#22d3ee" fontSize="10" fontWeight="bold" fontFamily="monospace">θ</text>
              </>
            )}

            {/* Definitions gradients support */}
            <defs>
              <linearGradient id="incWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(244,63,94,0)" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <linearGradient id="difWaveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Atomic description overlay marker */}
          <div className="absolute left-6 bottom-4 flex flex-col gap-1 z-10 text-[9px] uppercase font-mono tracking-wider text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />Atomic Spacing Plane</div>
            <div>Plane Interdistance d = {dSpace.toFixed(2)} Å</div>
          </div>
        </div>

        {/* Mini Live XRD Peak Chart */}
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mt-2 relative overflow-hidden h-20">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Live Simulated Intensity Spectrum</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">2θ Peak = {isValid ? `${twoThetaDeg.toFixed(2)}°` : 'Invalid'}</span>
          </div>
          <div className="w-full h-10 relative">
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Background X axis */}
              <line x1="0" y1="36" x2="100%" y2="36" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {/* Dynamic peak */}
              {isValid && (
                <path
                  d={(() => {
                    // map twoThetaDeg (between 10 and 150) to percentage of width (0% to 100%)
                    const pct = Math.max(5, Math.min(95, ((twoThetaDeg - 10) / 140) * 100));
                    // draw a nice smooth Gaussian curve centered at pct
                    let path = "";
                    for (let x = 0; x <= 100; x += 1) {
                      const diff = x - pct;
                      // Gaussian curve formula mapping to SVG Y position (amplitude 32, center pct, width 15)
                      const y = 35 - 32 * Math.exp(-Math.pow(diff, 2) / 15);
                      if (x === 0) path += `M 0,${y}`;
                      else path += ` L ${x}%,${y}`;
                    }
                    return path;
                  })()}
                  fill="none"
                  stroke="url(#peakGrad)"
                  strokeWidth="2.5"
                />
              )}
              {/* Gradients */}
              <defs>
                <linearGradient id="peakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* User Sandbox Call-to-Action to unlock whole suite */}
        <div className="w-full mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">
              Diffracted! Unlock high-tier simulations
            </p>
            <p className="text-[10px] text-slate-500">
              Unlock Rietveld Refinements, Phase ID neural networks, and raw data loaders.
            </p>
          </div>
          <button
            onClick={onEnter}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-lg hover:shadow-cyan-400/25 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            Launch Core Studio <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Legal Content ---
const PRIVACY_POLICY_DATA = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "July 18, 2026",
    sections: [
      {
        title: "1. Data Collection",
        content: "We collect computational metadata and basic analytical parameters to improve our XRD processing algorithms. No sensitive personal data is stored on our servers."
      },
      {
        title: "2. Analytical Data",
        content: "Experimental diffractograms uploaded to our cloud refined suite are encrypted and only accessible to the authorized laboratory researcher."
      },
      {
        title: "3. Cookie Usage",
        content: "We use essential cookies to maintain session states and your customized crystallography workbench preferences."
      }
    ]
  },
  fa: {
    title: "سیاست حریم خصوصی",
    lastUpdated: "۲۸ تیر ۱۴۰۵",
    sections: [
      {
        title: "۱. جمع‌آوری داده‌ها",
        content: "ما متادیتای محاسباتی و پارامترهای تحلیلی پایه را برای بهبود الگوریتم‌های پردازش XRD جمع‌آوری می‌کنیم. هیچ داده شخصی حساسی در سرورهای ما ذخیره نمی‌شود."
      },
      {
        title: "۲. داده‌های تحلیلی",
        content: "پراش‌نگارهای آزمایشی آپلود شده در مجموعه ابری ما رمزنگاری شده و فقط برای محقق آزمایشگاهی مجاز قابل دسترسی است."
      },
      {
        title: "۳. استفاده از کوکی",
        content: "ما از کوکی‌های ضروری برای حفظ وضعیت جلسات و تنظیمات سفارشی میز کار بلورشناسی شما استفاده می‌کنیم."
      }
    ]
  }
};

const CHANGELOG_DATA = {
  en: {
    title: "Version History",
    lastUpdated: "July 18, 2026",
    sections: [
      {
        title: "v2.1.0 - Academic Suite Update",
        content: "Implemented advanced 3D lattice visualizers, multi-language support (50+ languages), and real-time phase matching algorithms."
      },
      {
        title: "v2.0.4 - AI Refinement",
        content: "Integrated Gemini 1.5 Pro for intelligent peak fitting and automated structural report generation."
      },
      {
        title: "v2.0.0 - Core Launch",
        content: "Initial migration to full-stack architecture with Express, Firestore, and Python-based Rietveld refinement core."
      }
    ]
  },
  fa: {
    title: "تاریخچه نسخه‌ها",
    lastUpdated: "۲۸ تیر ۱۴۰۵",
    sections: [
      {
        title: "v2.1.0 - بروزرسانی مجموعه علمی",
        content: "پیاده‌سازی تصویرسازهای سه بعدی شبکه، پشتیبانی از ۵۰+ زبان و الگوریتم‌های تطبیق فاز همزمان."
      },
      {
        title: "v2.0.4 - بهینه‌سازی هوش مصنوعی",
        content: "ادغام Gemini 1.5 Pro برای برازش هوشمند پیک‌ها و تولید خودکار گزارش‌های ساختاری."
      },
      {
        title: "v2.0.0 - راه‌اندازی هسته",
        content: "مهاجرت اولیه به معماری Full-stack با Express، Firestore و هسته پالایش Rietveld مبتنی بر پایتون."
      }
    ]
  }
};

const TERMS_OF_USE_DATA = {
  en: {
    title: "Terms of Use",
    lastUpdated: "July 18, 2026",
    sections: [
      {
        title: "1. License",
        content: "XRD-Calc Pro grants you a limited, non-exclusive license to use our computational tools for scientific research and educational purposes."
      },
      {
        title: "2. Accuracy",
        content: "While we strive for precision, researchers should verify all crystallographic results with secondary analytical methods where critical safety is involved."
      },
      {
        title: "3. Restrictions",
        content: "Reverse engineering the proprietary neural network models used in phase identification is strictly prohibited."
      }
    ]
  },
  fa: {
    title: "شرایط استفاده",
    lastUpdated: "۲۸ تیر ۱۴۰۵",
    sections: [
      {
        title: "۱. مجوز",
        content: "XRD-Calc Pro به شما مجوزی محدود و غیر انحصاری برای استفاده از ابزارهای محاسباتی ما برای تحقیقات علمی و اهداف آموزشی اعطا می‌کند."
      },
      {
        title: "۲. دقت",
        content: "در حالی که ما برای دقت تلاش می‌کنیم، محققان باید تمام نتایج بلورشناسی را با روش‌های تحلیلی ثانویه در موارد حساس ایمنی تایید کنند."
      },
      {
        title: "۳. محدودیت‌ها",
        content: "مهندسی معکوس مدل‌های شبکه عصبی اختصاصی استفاده شده در شناسایی فاز اکیداً ممنوع است."
      }
    ]
  }
};

// --- Legal Modal Component ---
const LegalModal = ({ isOpen, onClose, content, isRTL }: { isOpen: boolean, onClose: () => void, content: any, isRTL: boolean }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-3xl max-h-[85vh] bg-[#050b14] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className={`p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex flex-col ${isRTL ? "items-end" : "items-start"}`}>
            <h3 className="text-2xl font-black text-white tracking-tight">{content.title}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Last Updated: {content.lastUpdated}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Zap className="w-5 h-5 rotate-45" />
          </button>
        </div>
        
        <div className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${isRTL ? "text-right" : "text-left"}`}>
          {content.sections.map((section: any, idx: number) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-lg font-bold text-violet-400 flex items-center gap-3">
                {!isRTL && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                {section.title}
                {isRTL && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
              </h4>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">
                {section.content}
              </p>
            </div>
          ))}
          
          <div className="pt-10 border-t border-white/5">
             <div className="bg-violet-600/10 border border-violet-500/20 p-5 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                   {isRTL 
                     ? "این سند بخشی از تعهد ما به شفافیت علمی و امنیت داده‌های تحقیقاتی شماست. برای سوالات بیشتر با بخش پشتیبانی تماس بگیرید."
                     : "This document is part of our commitment to scientific transparency and the security of your research data. For further inquiries, contact our systems support lab."}
                </p>
             </div>
          </div>
        </div>
        
        <div className={`p-6 border-t border-white/5 bg-white/[0.01] flex justify-end`}>
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-widest"
           >
             {isRTL ? "متوجه شدم" : "I Understand"}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Cookie Consent Banner ---
const CookieBanner = ({ isRTL, onAccept }: { isRTL: boolean, onAccept: () => void }) => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-8 right-8 z-[90] max-w-4xl mx-auto"
    >
      <div className="bg-[#050b14]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-6 ring-1 ring-white/15">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-inner">
           <Database className="w-8 h-8 text-violet-400" />
        </div>
        
        <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
          <h4 className="text-lg font-black text-white tracking-tight mb-1">
            {isRTL ? "پیکربندی کوکی‌های سیستمی" : "System Cookie Configuration"}
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            {isRTL 
              ? "ما از کوکی‌های فنی برای بهینه‌سازی محاسبات پراش و ذخیره ترجیحات آزمایشگاهی شما استفاده می‌کنیم. با ادامه استفاده، شما این پروتکل را تایید می‌کنید."
              : "We utilize technical cookies to optimize diffraction computations and persist your laboratory workbench preferences. By continuing, you authorize this metadata protocol."}
          </p>
        </div>
        
        <div className={`flex gap-3 shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button 
            onClick={onAccept}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold uppercase tracking-widest transition-all"
          >
            {isRTL ? "تنظیمات" : "Settings"}
          </button>
          <button 
            onClick={onAccept}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            {isRTL ? "تایید و ادامه" : "Authorize & Sync"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---
export const LandingPage = ({ onEnter, setTheme, theme, isRegistered, onSignOut }: { 
  onEnter: (mode?: 'register' | 'login', targetModule?: any) => void, 
  setTheme: (theme: any) => void,
  theme: string,
  isRegistered?: boolean,
  onSignOut?: () => void
}) => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [heroSearchTerm, setHeroSearchTerm] = useState('');
  const [showHeroSuggestions, setShowHeroSuggestions] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const heroSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for cookie consent on mount
    const consent = localStorage.getItem('xrd_cookie_consent');
    if (!consent) {
      setTimeout(() => setShowCookieBanner(true), 2000);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('xrd_cookie_consent', 'true');
    setShowCookieBanner(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(event.target as Node)) {
        setShowHeroSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredHeroSuggestions = useMemo(() => {
    if (!heroSearchTerm || heroSearchTerm.length < 1) return [];
    const term = heroSearchTerm.toLowerCase().trim();
    return getActiveMaterials().filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.formula.toLowerCase().includes(term) ||
      (item.crystalSystem && item.crystalSystem.toLowerCase().includes(term))
    ).slice(0, 4);
  }, [heroSearchTerm]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('xrd_user_registration');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) {
          setUserName(parsed.name);
        }
      } else {
        setUserName('');
      }
    } catch (e) {}
  }, [isRegistered]);

  const isRTL = i18n.language === 'he' || i18n.language === 'fa' || i18n.language === 'ar';

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 15 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xOffset = (e.clientX / window.innerWidth - 0.5) * 60;
      const yOffset = (e.clientY / window.innerHeight - 0.5) * -60;
      mouseX.set(xOffset);
      mouseY.set(yOffset);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: "AI Peak Recognition",
      description: "Neural network phase signatures identification with 98.4% calibration alignment even in raw, high-noise laboratory datasets.",
      icon: Brain,
      module: 'dl'
    },
    {
      title: "Interactive Materials DB",
      description: "Direct offline-first local simulation, editing standard parameters, lattice projections, and crystal system densities.",
      icon: Database,
      module: 'database'
    },
    {
      title: "Rietveld Refinement Lab",
      description: "Hardware-accelerated least-squares refinement with real-time parameter optimization and visual difference plot monitoring.",
      icon: Cpu,
      module: 'rietveld'
    },
    {
      title: "Multi-peak Bragg Spacing",
      description: "Standard structural d-spacing, Bragg angle solvers, custom X-ray source targets, and synthesized acoustic tone reflections.",
      icon: Beaker,
      module: 'bragg'
    },
    {
      title: "Scherrer Crystallite domains",
      description: "Calculate domains dynamically using full-width at half-maximum (FWHM) fitting with adjustable shape factors.",
      icon: Microscope,
      module: 'scherrer'
    },
    {
      title: "Diffraction Compare",
      description: "Overlay and visually inspect diffraction profiles between custom samples. Identify crystal structure variations, line shifts, and peak intensity anomalies.",
      icon: Layers,
      module: 'compare'
    },
    {
      title: "Academic Interactive Hub",
      description: "Premium educational libraries covering systematic absences, selection rules, and XRD diffraction fundamentals.",
      icon: FileText,
      module: 'learn'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-violet-500/30 relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] pointer-events-none z-50 contrast-150 brightness-100" />
      
      {/* Side Seek Navigation */}
      <SideSeekBar theme={theme} />

      {/* Theme Switcher Shared with App */}
      <div className="fixed top-24 right-6 z-[110] flex flex-col gap-2 bg-slate-900/90 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/10 shadow-2xl opacity-70 hover:opacity-100 transition-opacity duration-300">
        <span className="text-[8px] font-black tracking-widest text-[#94a3b8] text-center uppercase mb-1">Theme</span>
        {['light', 'dark', 'cyberpunk', 'terminal', 'synthwave', 'dracula', 'oceanic', 'gruvbox', 'monokai'].map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t as any)}
            className={`w-6 h-6 rounded-lg transition-all border border-transparent ${
              theme === t ? 'bg-violet-500 scale-110 shadow-lg shadow-violet-500/50 border-white/20' : 'bg-slate-800 opacity-50 hover:opacity-100'
            }`}
            title={`Switch to ${t} theme`}
          />
        ))}
      </div>

      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ${isScrolled ? 'bg-[#050B14]/80 backdrop-blur-2xl border-b border-white/10 py-3 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onEnter(isRegistered ? 'login' : 'register')}>
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white/10 blur-xl rounded-full" />
              <Hexagon className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] relative z-10" fill="white" fillOpacity="0.1" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tight leading-none text-white">XRD<span className="text-violet-500 font-normal">CalcPro</span></span>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 mt-1 flex items-center gap-1.5 opacity-90">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                {t('Scientific Suite')}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <LanguageSelector compact={true} />
            <a href="#sandbox" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-black px-3 py-2 rounded-lg hover:bg-cyan-500/10"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />Interactive Lab</a>
            <a href="#features" className="hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">Framework</a>
            <a href="#platform" className="hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">Methods</a>
            <div className="w-px h-5 bg-slate-700 mx-2" />
            
            {isRegistered ? (
              <>
                <span className="text-cyan-400 font-bold tracking-tight lowercase truncate max-w-[130px] flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {userName || 'User'}
                </span>
                <button 
                  onClick={() => onEnter('login')}
                  className="hover:text-white font-bold transition-colors text-indigo-400"
                >
                  {t('Go to App')}
                </button>
                <button 
                  onClick={onSignOut}
                  className="bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-550/20 px-4 py-2 rounded-full font-bold transition-all active:scale-95"
                >
                  {t('Sign Out')}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onEnter('login')}
                  className="hover:text-white transition-colors text-indigo-400 font-bold"
                >
                  {t('Log In')}
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEnter('login')}
                    className="hover:text-white hover:bg-white/5 border border-white/10 px-4 py-2.5 rounded-full font-bold transition-all"
                  >
                    {t('Sign In')}
                  </button>
                  <button 
                    onClick={() => onEnter('register')}
                    className="bg-white text-slate-900 hover:bg-slate-200 px-5 py-2.5 rounded-full shadow-lg font-bold transition-all active:scale-95"
                  >
                    {t('Get Started')}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {isRegistered && (
              <button 
                onClick={onSignOut}
                className="text-[10px] uppercase font-black tracking-wider bg-rose-500/10 text-rose-450 px-2.5 py-1.5 rounded-lg border border-rose-500/20"
              >
                {t('Sign Out')}
              </button>
            )}
            <button onClick={() => onEnter(isRegistered ? 'login' : 'register')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700">
              <ArrowRight className="w-5 h-5 text-violet-400" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10">
        {/* --- Hero Section --- */}
        <section className="relative px-6 pt-48 pb-32 md:pb-56 min-h-[90vh] flex items-center overflow-hidden">
          <DiffractionGrid />
          <CrystalLattice springX={springX} springY={springY} />
          
          {/* Dynamic Background Glow Layer */}
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? "text-right" : "text-left"}
            >
              {/* Feature Badge */}
              <div 
                className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 mb-8 shadow-xl backdrop-blur-md transition-all duration-300 cursor-default select-none`}
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <Database className="w-4 h-4 text-violet-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-300 font-mono">
                  {isRTL ? "انطباق فاز و نمایه سازی ساختاری" : "Phase Match & Structural Indexing"}
                </span>
              </div>

              {/* Graphical Welcome Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-4"
              >
                <h2 className={`text-sm sm:text-base font-black text-cyan-400 tracking-[0.25em] uppercase flex items-center gap-3 font-mono ${isRTL ? "justify-start" : ""}`}>
                  <span className="w-6 h-[2px] bg-cyan-400/60 rounded-full"></span>
                  {t('Welcome')}
                  <span className="w-6 h-[2px] bg-cyan-400/60 rounded-full"></span>
                </h2>
              </motion.div>

              {/* Majestic Scientific Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-[4.8rem] font-black tracking-tight mb-6 text-white leading-[1.1] drop-shadow-2xl relative select-none">
                <span className="absolute -inset-10 bg-violet-600/5 blur-[120px] rounded-full -z-10" />
                <span className="block text-slate-400 text-sm sm:text-base font-bold uppercase tracking-[0.3em] mb-4 font-mono">
                  {isRTL ? "مجموعه محاسباتی پیشرفته پراش پرتو ایکس" : "Advanced Computational Crystallography Suite"}
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 block mb-2 leading-none">
                  {isRTL ? "آنالیز و شبیه‌سازی دقیق" : "Automate Your"}
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-indigo-200 drop-shadow-[0_0_35px_rgba(34,211,238,0.25)] block">
                  {isRTL ? "پراش پرتو ایکس (XRD)" : "Diffraction Analysis"}
                </span>
              </h1>
              
              {/* Premium Hero Description */}
              <p className="text-base sm:text-lg text-slate-300 font-medium mb-10 leading-relaxed max-w-2xl">
                {t('Hero Description') || 'The ultimate computational suite for X-ray powder diffraction (XRD). Extract precise phase data, determine crystallite size, calculate strain metrics, and perform structure refinement with institutional-grade computational models directly in your browser.'}
              </p>

              {/* Dynamic Interactive Search Module replacing standard buttons */}
              <div ref={heroSearchRef} className="relative max-w-2xl group w-full mb-10">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-[2.2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className={`relative flex items-center bg-[#050b14]/90 ring-1 ring-white/10 backdrop-blur-2xl rounded-[2rem] p-2.5 w-full transition-all duration-300 focus-within:ring-violet-500/50 focus-within:ring-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}>
                  <div className="p-3 pl-5 text-slate-450 shrink-0">
                    <Search className="w-5 h-5 text-violet-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={heroSearchTerm}
                    onChange={(e) => {
                      setHeroSearchTerm(e.target.value);
                      setShowHeroSuggestions(true);
                    }}
                    onFocus={() => setShowHeroSuggestions(true)}
                    placeholder={isRTL ? "جستجوی ساختارها... مانند 'TiO2 Anatase' یا 'NaCl'" : "Search structures... e.g. 'TiO2 Anatase', 'NaCl'"} 
                    className={`flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 font-medium text-base sm:text-lg px-2 w-full ${isRTL ? "text-right font-sans" : "text-left font-sans"}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onEnter(isRegistered ? 'login' : 'register');
                    }}
                  />
                  <div className={`flex gap-2 shrink-0 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                    <button 
                      onClick={() => onEnter(isRegistered ? 'login' : 'register')}
                      className="hidden sm:flex px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl items-center justify-center gap-2 transition-all text-slate-350 hover:text-white font-bold text-sm"
                    >
                      <Beaker className="w-4 h-4 text-cyan-400" />
                      {isRegistered ? t('Go to App') : (isRTL ? "دسترسی دمو" : "Demo Access")}
                    </button>
                    <button 
                      onClick={() => onEnter(isRegistered ? 'login' : 'register')}
                      className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] active:scale-95 text-white font-bold text-sm uppercase tracking-wider h-12"
                    >
                      <span>{isRegistered ? (isRTL ? "ورود به سیستم" : "Launch Core") : (isRTL ? "شروع به کار" : "Start")}</span>
                      <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRTL ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Real-time floating suggestions */}
                {showHeroSuggestions && filteredHeroSuggestions.length > 0 && (
                  <div className="absolute top-20 left-0 right-0 z-50 bg-[#070c18]/95 backdrop-blur-2xl ring-1 ring-white/10 rounded-3xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-255 border border-white/5">
                    <div className={`text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] mb-3 px-2 flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span>{isRTL ? "تطبیق همزمان با استانداردهای پایگاه‌داده" : "Real-time DB standards match"}</span>
                      <span className="text-cyan-400 font-mono text-[9px] tracking-normal lowercase">{isRTL ? "کاتالوگ مرجع آفلاین" : "Offline reference catalog"}</span>
                    </div>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {filteredHeroSuggestions.map((item) => (
                        <div 
                          key={item.name}
                          onClick={() => {
                            setHeroSearchTerm(item.name);
                            setShowHeroSuggestions(false);
                            try {
                              localStorage.setItem("xrd_initial_search", item.name);
                            } catch (err) {}
                            onEnter(isRegistered ? 'login' : 'register', 'database');
                          }}
                          className={`w-full p-3 rounded-2xl bg-white/[0.01] hover:bg-violet-600/10 border border-transparent hover:border-violet-500/20 transition-all duration-200 cursor-pointer flex items-center justify-between group/suggest ${isRTL ? "flex-row-reverse text-right" : ""}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-200 group-hover/suggest:text-violet-300 transition-colors">{item.name}</span>
                            <span className="text-xs text-slate-500 font-sans line-clamp-1 mt-0.5">{item.description}</span>
                          </div>
                          <div className={`flex items-center gap-2 shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <span className="font-mono text-[10px] uppercase tracking-wider bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-md border border-violet-500/20 font-black">
                              {item.formula}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {item.crystalSystem}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Popular Lattice Quick Keys */}
              <div className={`flex flex-wrap gap-2 max-w-2xl mb-12 select-none animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 ${isRTL ? "justify-start flex-row-reverse" : ""}`}>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] mt-1.5 mr-1 font-mono">
                  {isRTL ? "شبکه‌های کالیبره شده:" : "Tuned Lattices:"}
                </span>
                {[
                  { name: isRTL ? 'سیلیسیم' : 'Silicon', formula: 'Si' },
                  { name: isRTL ? 'هالیت' : 'Halite', formula: 'NaCl' },
                  { name: isRTL ? 'آناتاز' : 'Anatase', formula: 'TiO2' },
                  { name: isRTL ? 'کوراندوم' : 'Corundum', formula: 'Al2O3' },
                  { name: isRTL ? 'کوارتز' : 'Quartz', formula: 'SiO2' },
                  { name: isRTL ? 'آهن خالص' : 'Pure Iron', formula: 'Fe' }
                ].map((mat, idx) => (
                  <button
                    key={idx}
                    onClick={() => onEnter(isRegistered ? 'login' : 'register', 'database')}
                    className="px-3 py-1 bg-[#090F1E]/80 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/40 rounded-xl flex items-center gap-1.5 text-slate-300 hover:text-white transition-all text-xs font-mono cursor-pointer shadow-md"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                    <span className="font-bold">{mat.formula}</span>
                    <span className="text-[10px] text-slate-500">{mat.name}</span>
                  </button>
                ))}
              </div>

              {/* High-End Academic Metrics Grid */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-8">
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white leading-none tracking-tight">1.2M+</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 font-mono">
                    {isRTL ? "پروفایل‌های علمی" : "COD Profiles"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white leading-none tracking-tight">&lt;0.2s</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 font-mono">
                    {isRTL ? "تاخیر جستجو" : "Search Latency"}
                  </p>
                </div>
                <div className="space-y-1 hidden sm:block">
                  <p className="text-3xl font-black text-white leading-none tracking-tight">AI</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 font-mono">
                    {isRTL ? "تطبیق هوشمند پیک" : "Peak Fitting"}
                  </p>
                </div>
                <div className="space-y-1 hidden md:block">
                  <div className="flex gap-1 mb-2 items-center h-8">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />)}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 font-mono">
                    {isRTL ? "دقت شبیه‌سازی بالا" : "High Precision"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Premium Dashboard Visualization Showcase */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, x: 40 }}
               animate={{ opacity: 1, scale: 1, x: 0 }}
               transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
               className="relative group perspective-2000 hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 via-cyan-500/5 to-transparent blur-[120px] rounded-full group-hover:bg-violet-600/15 transition-all duration-1000" />
              <div className="relative z-10 transform rotate-y-[-10deg] rotate-x-[6deg] group-hover:rotate-0 group-hover:scale-[1.03] transition-all duration-750">
                
                {/* Dashboard Iframe Frame */}
                <div className="bg-[#050B14]/90 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_-15px_rgba(0,0,0,0.85)] aspect-[16/11] flex flex-col ring-1 ring-white/15">
                  
                  {/* Top Header Controls Bar */}
                  <div className={`p-5 border-b border-white/5 bg-white/[0.03] flex items-center justify-between backdrop-blur-md ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-400 bg-slate-900/40 px-3.5 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                      <span>{isRTL ? "خروجی آنالیز هوش مصنوعی" : "AI Analysis Output"}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="h-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                      </div>
                      <div className="w-10 h-2 bg-white/10 rounded-full" />
                    </div>
                  </div>

                  {/* Core Simulated Analyzer Output */}
                  <div className="flex-1 p-8 flex flex-col gap-6">
                    <div className="h-44 w-full bg-[#070D18] rounded-2xl border border-white/5 relative overflow-hidden flex items-end p-6 gap-2 group/chart">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none" />
                       
                       {/* Animated Diffraction Peaks */}
                       {Array.from({ length: 24 }).map((_, i) => (
                         <div 
                           key={i} 
                           className="flex-1 bg-gradient-to-t from-violet-600/50 via-cyan-500/50 to-cyan-400/80 rounded-t-lg transition-all duration-300 group-hover/chart:opacity-90" 
                           style={{ height: `${Math.sin(i * 0.4) * 35 + 55}%`, animationDelay: `${i * 50}ms` }} 
                         />
                       ))}
                       
                       {/* Sweeping Laser Line representing real-time hardware scan */}
                       <div className="absolute left-0 w-full h-[2px] bg-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.9)] border-dashed animate-bounce" style={{ top: '40%', animationDuration: '6s' }} />
                       <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 text-[9px] font-mono tracking-wider text-cyan-400 uppercase">
                         {isRTL ? "پراش فعال پرتو" : "Active Beam Diffraction"}
                       </div>
                    </div>

                    {/* Interactive Metrics Cells */}
                    <div className="grid grid-cols-3 gap-6 flex-1">
                      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-5 flex flex-col justify-between hover:bg-slate-900/60 hover:border-violet-500/20 transition-all duration-300 group/cell select-none">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover/cell:scale-110 transition-transform">
                          <Activity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isRTL ? "پسماند خطای RMS" : "RMS Residual"}
                          </p>
                          <p className="text-base font-black font-mono text-white tracking-tight">0.0423</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-5 flex flex-col justify-between hover:bg-slate-900/60 hover:border-violet-500/20 transition-all duration-300 group/cell select-none">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover/cell:scale-110 transition-transform">
                          <Cpu className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isRTL ? "هسته‌های فعال" : "Cores Active"}
                          </p>
                          <p className="text-base font-black font-mono text-white tracking-tight">X92-A</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-5 flex flex-col justify-between hover:bg-slate-900/60 hover:border-cyan-500/20 transition-all duration-300 group/cell select-none">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover/cell:scale-110 transition-transform">
                          <Shapes className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isRTL ? "تقارن بلوری" : "Symmetry"}
                          </p>
                          <p className="text-base font-black font-mono text-white tracking-tight">Fm-3m</p>
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
        <section className="py-24 border-y border-white/5 bg-[#020617] relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-16">Verified Structural Indexing Partners & Institutional Peers</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
               {/* Stanford */}
               <div className="flex items-center gap-3 group cursor-default">
                 <div className="w-10 h-10 bg-[#8C1515] rounded-lg flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                     <path d="M75 30 C75 15, 25 15, 25 35 C25 55, 75 50, 75 70 C75 90, 25 90, 25 75" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" fill="none" />
                     <path d="M50 25 L35 55 L42 55 L30 75 L42 75 L25 88 L75 88 L58 75 L70 75 L58 55 L65 55 Z" fill="#14532D" stroke="#FFFFFF" strokeWidth="2" />
                   </svg>
                 </div>
                 <span className="text-lg font-bold tracking-tighter text-white">Stanford</span>
               </div>

               {/* Oxford */}
               <div className="flex items-center gap-3 group cursor-default">
                 <div className="w-10 h-10 bg-[#002147] rounded-lg flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                     <path d="M15 15 L85 15 L85 55 C85 80, 50 95, 50 95 C50 95, 15 80, 15 55 Z" fill="#002147" stroke="#FFFFFF" strokeWidth="2" />
                     <path d="M26 40 C34 37, 50 40, 50 40 C50 40, 66 37, 74 40 L74 68 C66 65, 50 68, 50 68 C50 68, 34 65, 26 68 Z" fill="#FFFFFF" />
                     <line x1="50" y1="40" x2="50" y2="68" stroke="#D4AF37" strokeWidth="2" />
                   </svg>
                 </div>
                 <span className="text-lg font-bold tracking-tighter text-white">Oxford</span>
               </div>

               {/* CERN */}
               <div className="flex items-center gap-3 group cursor-default">
                 <div className="w-10 h-10 bg-[#0033A0] rounded-lg flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                   <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
                     <circle cx="50" cy="50" r="40" stroke="#FFFFFF" strokeWidth="3" />
                     <circle cx="50" cy="50" r="15" stroke="#FFFFFF" strokeWidth="2" />
                     <line x1="50" y1="10" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="2" />
                     <line x1="10" y1="50" x2="90" y2="50" stroke="#FFFFFF" strokeWidth="2" />
                     <path d="M20 20 L80 80 M80 20 L20 80" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
                   </svg>
                 </div>
                 <span className="text-lg font-bold tracking-tighter text-white">CERN</span>
               </div>

               {/* Lawrence Berkeley */}
               <div className="flex items-center gap-3 group cursor-default">
                 <div className="w-10 h-10 bg-[#003B5C] rounded-lg flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                     <circle cx="50" cy="50" r="30" stroke="#FFFFFF" strokeWidth="5" />
                     <circle cx="50" cy="50" r="12" fill="#FFFFFF" />
                     <path d="M50 10 L50 90 M10 50 L90 50" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
                   </svg>
                 </div>
                 <span className="text-lg font-bold tracking-tighter text-white leading-none">Berkeley <br/><span className="text-[10px] text-slate-400">National Lab</span></span>
               </div>

               {/* NASA */}
               <div className="flex items-center gap-3 group cursor-default">
                 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-xl group-hover:scale-110 transition-transform">
                   <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
                     <path d="M10 50 C10 20, 90 20, 90 50 C90 80, 10 80, 10 50" fill="#0B3D91" />
                     <path d="M15 45 L45 25 L75 45 M15 55 L45 75 L75 55" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
                     <circle cx="65" cy="40" r="4" fill="white" />
                     <path d="M30 65 Q 50 40 70 65" stroke="#FC3D21" strokeWidth="3" fill="none" />
                   </svg>
                 </div>
                 <span className="text-lg font-bold tracking-tighter text-white">NASA</span>
               </div>
            </div>
          </div>
        </section>

        {/* --- Interactive Bragg's Law Sandbox Lab --- */}
        <section id="sandbox" className="py-24 px-6 bg-slate-950 relative z-10 border-b border-slate-900">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                Interactive Lab Sandbox
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
                Simulate Diffraction Instantly
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                No setup required. Experience how Bragg's Law controls structural diffraction. Drag the atomic lattice spacing <span className="font-mono text-cyan-400">(d)</span>, tune the X-ray wavelength <span className="font-mono text-violet-400">(λ)</span>, and observe the diffraction peak emerge.
              </p>
            </div>

            <BraggSandboxWrapper onEnter={onEnter} />
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
                <FeatureCard key={i} index={i} {...f} onLaunch={(mod) => onEnter(isRegistered ? 'login' : 'register', mod)} />
              ))}
            </div>
          </div>
        </section>

        {/* --- AI Advisor Feature Section --- */}
        <section className="py-24 px-6 relative z-10 border-t border-slate-900 bg-slate-950/50 overflow-hidden">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Gemini High-Thinking</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
                Your Personal <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI Science Advisor</span>
              </h2>
              <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
                Go beyond simple equations. Our new AI Structural & Synthesis Advisor analyzes your input parameters, cross-references them against crystallographic databases, and generates graduate-level physical insights instantly.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Deep structural correlation analysis",
                  "Material phase & synthesis recommendations",
                  "Instant parameter optimization guidance"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-slate-300 font-medium text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onEnter(isRegistered ? 'login' : 'register')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                Try AI Advisor <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative perspective-1000"
            >
              <div className="absolute inset-0 bg-indigo-600/20 blur-[100px] rounded-full" />
              <div className="relative bg-[#090F1E] border border-indigo-500/30 rounded-3xl p-8 shadow-2xl transform rotate-y-[-5deg] hover:rotate-y-0 transition-all duration-700 hover:border-indigo-500/50">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">AI Analysis Output</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Thermodynamics & Phase Transition</p>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
                  <p>
                    <strong className="text-indigo-400">Structural Insight:</strong> The calculated critical free energy (ΔG*) of <span className="font-mono text-white bg-white/10 px-1 rounded">14.2 kJ/mol</span> suggests a moderate nucleation barrier. This indicates that homogenous nucleation will require significant undercooling to proceed spontaneously.
                  </p>
                  <p>
                    <strong className="text-cyan-400">Synthesis Recommendation:</strong> To promote heterogeneous nucleation and refine the grain structure, consider introducing inoculants or increasing the cooling rate by 15-20%.
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">Confidence Score</span>
                  <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">98.4%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- Code / API Integration Section --- */}
        <section className="py-32 px-6 bg-[#020617] border-y border-slate-900 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
               <div className="bg-[#050A14] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-500" />
                  <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                    </div>
                    <div className="text-xs font-medium text-slate-500 flex-1 text-center">analysis_engine.py</div>
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
                 title="Automate with Python SDK"
                 description="Integrate XRD-CalcPro directly into your CI/CD computational pipelines. Trigger refinements from LIMS (Laboratory Information Management Systems) and export results programmatically."
               />
               <ul className="space-y-6 mt-8 pl-4 border-l-2 border-violet-500/20">
                 <li className="flex flex-col gap-2 relative">
                   <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-[#020617]" />
                   <h4 className="text-white font-bold tracking-wide text-sm">Direct COD Integration</h4>
                   <p className="text-slate-400 text-sm">Query over 500,000 structures in milliseconds using our specialized vector-search methodology.</p>
                 </li>
                 <li className="flex flex-col gap-2 relative">
                   <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-[#020617]" />
                   <h4 className="text-white font-bold tracking-wide text-sm">Headless Rietveld</h4>
                   <p className="text-slate-400 text-sm">Optimize background polynomials and displacement parameters automatically via gradient descent.</p>
                 </li>
               </ul>
            </div>
          </div>
        </section>

        {/* --- Platform Synergy --- */}
        <section id="platform" className="py-32 px-6 bg-[#0B1120] border-y border-slate-800 relative z-10">
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
                 <button className="flex items-center gap-4 bg-slate-900 py-4 px-8 rounded-2xl border border-slate-700 hover:border-violet-500/50 transition-all shadow-xl group">
                    <Apple className="w-7 h-7 text-white" />
                    <div className="flex flex-col items-start leading-tight group-hover:scale-105 transition-transform">
                      <span className="text-xs font-semibold text-slate-400 mb-0.5">Download on</span>
                      <span className="text-lg font-bold tracking-tight text-white">App Store</span>
                    </div>
                 </button>
                 <button className="flex items-center gap-4 bg-slate-900 py-4 px-8 rounded-2xl border border-slate-700 hover:border-violet-500/50 transition-all shadow-xl group">
                    <PlayCircle className="w-7 h-7 text-violet-400" />
                    <div className="flex flex-col items-start leading-tight group-hover:scale-105 transition-transform">
                      <span className="text-xs font-semibold text-slate-400 mb-0.5">Available on</span>
                      <span className="text-lg font-bold tracking-tight text-white">Google Play</span>
                    </div>
                 </button>
              </div>
            </motion.div>
            
            <div className="relative">
               <div className="absolute inset-0 bg-cyan-600/10 blur-[120px] rounded-full opacity-60" />
               <motion.div 
                 initial={{ opacity: 0, rotate: 10, scale: 0.9 }}
                 whileInView={{ opacity: 1, rotate: -5, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                 className="relative z-10 flex flex-col items-center"
               >
                  <div className="relative w-full max-w-sm aspect-[9/19] bg-[#020617] ring-[8px] ring-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/10">
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-800 rounded-full z-20" />
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-violet-500/5 pointer-events-none" />
                     
                     <div className="p-8 pt-20 h-full flex flex-col gap-8">
                        <div className="h-40 bg-slate-800/50 rounded-[2rem] border border-slate-700 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent" />
                           <Activity className="w-12 h-12 text-violet-500 opacity-40" />
                        </div>
                        <div className="space-y-4">
                           <div className="h-5 w-3/4 bg-slate-800 rounded-full" />
                           <div className="h-5 w-1/2 bg-slate-800 rounded-full" />
                        </div>
                        <div className="flex-1 bg-slate-800/50 rounded-[2.5rem] border border-slate-700 p-6 space-y-4">
                           <div className="flex justify-between items-center">
                              <div className="w-12 h-2.5 bg-violet-500/40 rounded-full" />
                              <div className="w-8 h-2.5 bg-slate-700 rounded-full" />
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
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-8">
                       Engineered for<br />
                       The Heavyweight<br />
                       Research Teams
                    </h2>
                    <p className="text-lg text-slate-400 font-medium mb-12 leading-relaxed max-w-xl">
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
                               <p className="text-sm font-bold text-white tracking-wide mb-1 flex items-center gap-2">{item.label}</p>
                               <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute inset-0 bg-violet-600/5 blur-[80px] rounded-full" />
                    <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-slate-700/50 p-10 md:p-14 rounded-3xl shadow-xl">
                       <div className="absolute -top-10 -left-6 text-[10rem] font-serif font-black text-white/[0.02] leading-none pointer-events-none select-none">"</div>
                       <blockquote className="text-xl md:text-2xl font-medium text-slate-200 leading-relaxed relative z-10 mb-10">
                         "The transition to XRD-CalcPro was instantaneous. We reduced our phase validation bottleneck by almost 80%, allowing our lab to process four times as many samples as last year."
                       </blockquote>
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 overflow-hidden ring-4 ring-slate-900">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=scientist" alt="User" />
                          </div>
                          <div>
                             <p className="text-base font-bold tracking-wide text-white">Dr. Sarah Andersson</p>
                             <p className="text-xs font-semibold text-slate-500 mt-1">Head of Material Science, Quantum Tech Inst.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- Live Computation Terminal --- */}
        <section className="py-20 px-6 relative z-10 w-full overflow-hidden bg-slate-950 border-t border-slate-900">
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-16 items-center">
             <div className="flex-1">
                 <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                   Deep Learning Model in Action
                 </h2>
                 <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg mb-8">
                    Watch the XRD-CalcPro cluster classify phases in real time, pulling from live COD datasets to match peak signatures instantly.
                 </p>
                 <div className="flex gap-4">
                    <div className="bg-slate-900 px-4 py-2 rounded-full border border-slate-800 flex items-center gap-2">
                       <p className="text-xs font-bold text-slate-400">Cluster Status:</p>
                       <span className="text-xs text-emerald-400 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Running</span>
                    </div>
                 </div>
             </div>
             
             <div className="flex-1 w-full max-w-2xl bg-black border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2 z-20">
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                   <span className="text-[10px] font-mono text-slate-500 ml-2">XRD_TERMINAL_V4</span>
                </div>
                <div className="p-6 pt-12 font-mono text-[11px] leading-loose h-[300px] overflow-hidden relative flex flex-col justify-end">
                   <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black to-transparent z-10" />
                   <motion.div 
                     animate={{ y: [0, -150] }} 
                     transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                     className="text-emerald-500/70 absolute bottom-[-150px]"
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
        <section className="py-20 pb-48 px-6 relative z-10 bg-[#020617]">
           <div className="max-w-7xl mx-auto">
              <div className="relative p-12 md:p-32 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden group shadow-2xl">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                 <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-violet-600/10 blur-[100px] rounded-full" />
                 
                 <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-8">Ready to Lead The Material Revolution?</h2>
                    <p className="text-lg md:text-xl text-slate-400 font-medium mb-12 leading-relaxed">
                       Secure your lab's spot in the next generation of crystallography. Start your 30-day institutional trial today.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                       <button onClick={() => onEnter(isRegistered ? 'login' : 'register')} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold tracking-wide hover:bg-slate-100 transition-all shadow-xl active:scale-95">
                          {isRegistered ? 'Enter Custom Workspace' : 'Initialize General Access'}
                       </button>
                       {isRegistered ? (
                         <button onClick={onSignOut} className="px-10 py-5 bg-transparent border border-rose-600/30 text-rose-300 rounded-2xl font-bold tracking-wide hover:bg-rose-950/20 hover:text-rose-450 transition-all active:scale-95">
                            {t('Sign Out')}
                         </button>
                       ) : (
                         <button onClick={() => onEnter('login')} className="px-10 py-5 bg-transparent border border-slate-600 text-slate-300 rounded-2xl font-bold tracking-wide hover:bg-slate-800 hover:text-white transition-all active:scale-95">
                            {t('Log In / Sign In')}
                         </button>
                       )}
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-slate-400">No Credit Card Required</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-slate-400">Full API Access</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-32 px-6 border-t border-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20">
          <div className="lg:col-span-2">
             <div className="flex items-center gap-3 mb-10 group" onClick={() => onEnter(isRegistered ? 'login' : 'register')}>
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:scale-105 transition-transform duration-300">
                  <Hexagon className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tight leading-none text-white">XRD<span className="text-violet-500 font-normal">CalcPro</span></span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 mt-1 flex items-center gap-1.5 opacity-90">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                    Scientific Analysis Suite
                  </span>
                </div>
             </div>
             <p className="text-slate-500 text-sm font-medium leading-relaxed mb-12 max-w-sm">
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
              <div className={`flex flex-col ${isRTL ? "items-end text-right" : "items-start text-left"} gap-1.5`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">© 2026 XRD-CALC PRO • Designed by Ali Zerehsaz</p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] max-w-sm leading-relaxed">
                  {isRTL 
                    ? "طراحی و توسعه توسط علی زره‌ساز. این یک پروژه مستقل علمی است و توسط یک تیم بزرگ ساخته نشده است."
                    : "Designed and Engineered by Ali Zerehsaz. This is an independent scientific project, not built by a large corporate team."}
                </p>
                <div className="flex items-center gap-2 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Powered by</span>
                  <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 uppercase tracking-wider">Gemini & Google</span>
                </div>
                <div className="flex flex-col gap-3 mt-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 w-fit group">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{isRTL ? "تکنولوژی‌ها:" : "Tech Stack:"}</span>
                   <div className="flex gap-4">
                      <div className="flex flex-col gap-1 cursor-help group/ts">
                        <span className="text-[10px] font-mono text-blue-400 font-bold">TypeScript</span>
                        <span className="text-[8px] font-medium text-slate-500 max-w-[120px] leading-tight opacity-0 group-hover/ts:opacity-100 transition-opacity">
                          {isRTL ? "برای نوع‌دهی قوی و ساختار امن سمت کلاینت" : "For strong typing and secure client-side architecture"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 cursor-help group/js">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">JavaScript</span>
                        <span className="text-[8px] font-medium text-slate-500 max-w-[120px] leading-tight opacity-0 group-hover/js:opacity-100 transition-opacity">
                          {isRTL ? "برای پویایی و تعاملات سریع رابط کاربری" : "For UI dynamism and fast interactive components"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 cursor-help group/py">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Python</span>
                        <span className="text-[8px] font-medium text-slate-500 max-w-[120px] leading-tight opacity-0 group-hover/py:opacity-100 transition-opacity">
                          {isRTL ? "برای تولید اسکریپت‌های تحلیلی و پراسس داده‌ها" : "For generating analytical scripts and data processing"}
                        </span>
                      </div>
                   </div>
                </div>
              </div>
              <div className="flex gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                 <span 
                   onClick={() => setShowPrivacyModal(true)}
                   className="hover:text-white cursor-pointer transition-colors"
                 >
                   Privacy Policy
                 </span>
                 <span 
                   onClick={() => setShowTermsModal(true)}
                   className="hover:text-white cursor-pointer transition-colors"
                 >
                   Terms of Use
                 </span>
                 <span 
                   onClick={() => setShowCookieBanner(true)}
                   className="hover:text-white cursor-pointer transition-colors"
                 >
                   Cookie Auth
                 </span>
                 <span 
                   onClick={() => setShowChangelogModal(true)}
                   className="hover:text-white cursor-pointer transition-colors"
                 >
                   Changelog
                 </span>
              </div>
              <div className="flex items-center gap-4 border-l border-white/10 pl-8 ml-2">
                 <a 
                   href="https://github.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest group/github"
                 >
                    <Github className="w-4 h-4 text-slate-600 group-hover/github:text-white transition-colors" />
                    <span>View on GitHub</span>
                 </a>
                 <div className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">MIT License</span>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 group cursor-default">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Global Network: Online</span>
           </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <LegalModal 
         isOpen={showPrivacyModal} 
         onClose={() => setShowPrivacyModal(false)} 
         content={i18n.language === 'fa' ? PRIVACY_POLICY_DATA.fa : PRIVACY_POLICY_DATA.en}
         isRTL={isRTL}
      />
      <LegalModal 
         isOpen={showTermsModal} 
         onClose={() => setShowTermsModal(false)} 
         content={i18n.language === 'fa' ? TERMS_OF_USE_DATA.fa : TERMS_OF_USE_DATA.en}
         isRTL={isRTL}
      />
      <LegalModal 
         isOpen={showChangelogModal} 
         onClose={() => setShowChangelogModal(false)} 
         content={i18n.language === 'fa' ? CHANGELOG_DATA.fa : CHANGELOG_DATA.en}
         isRTL={isRTL}
      />

      {/* Cookie Banner */}
      {showCookieBanner && (
        <CookieBanner 
          isRTL={isRTL} 
          onAccept={handleAcceptCookies} 
        />
      )}
    </div>
  );
};
