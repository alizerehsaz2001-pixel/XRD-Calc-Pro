import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Atom, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Hexagon,
  Layers,
  Activity,
  Terminal,
  Microscope,
  Box
} from 'lucide-react';

interface AppLaunchPortalProps {
  isEntering: boolean;
  targetModule?: string | null;
  isRTL?: boolean;
  onComplete?: () => void;
}

const TELEMETRY_STEPS_EN = [
  "Initializing Bragg-Brentano Goniometer & Matrix Core...",
  "Loading Powder Diffraction Standards & COD Catalog...",
  "Calibrating Cohen Least-Squares & Williamson-Hall Models...",
  "Synthesizing Gemini Crystallography Intelligence Node...",
  "Preparing XRD-Calc Pro Laboratory Environment..."
];

const TELEMETRY_STEPS_FA = [
  "راه‌اندازی گونیومتر براگ-برنتانو و هسته ماتریسی...",
  "بارگذاری استانداردهای پراش پودر و کاتالوگ COD...",
  "کالیبراسیون مدل‌های کمترین مربعات کوهن و ویلیامسون-هال...",
  "اتصال به شبکه هوش مصنوعی بلورشناسی گوگل جکینی...",
  "آماده‌سازی محیط آزمایشگاهی XRD-Calc Pro..."
];

export const AppLaunchPortal: React.FC<AppLaunchPortalProps> = ({
  isEntering,
  targetModule,
  isRTL = false,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = isRTL ? TELEMETRY_STEPS_FA : TELEMETRY_STEPS_EN;

  useEffect(() => {
    if (!isEntering) {
      setProgress(0);
      setStepIndex(0);
      return;
    }

    const duration = 1100; // ms
    const intervalTime = 20;
    const stepsCount = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / stepsCount) * 100), 100);
      setProgress(currentProgress);

      const computedStepIndex = Math.min(
        Math.floor((currentProgress / 100) * steps.length),
        steps.length - 1
      );
      setStepIndex(computedStepIndex);

      if (currentStep >= stepsCount) {
        clearInterval(timer);
        if (onComplete) {
          setTimeout(onComplete, 150);
        }
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isEntering]);

  if (!isEntering) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#030712] overflow-hidden select-none"
      >
        {/* Hypnotic Background Radial Warp Field */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/40 via-[#030712] to-black -z-10" />

        {/* Floating Background Particle Beams */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth - window.innerWidth / 2, 
                y: Math.random() * window.innerHeight - window.innerHeight / 2,
                scale: 0.2,
                opacity: 0.1
              }}
              animate={{ 
                scale: [0.2, 1.8, 0],
                opacity: [0, 0.8, 0],
                z: [0, 300]
              }}
              transition={{
                duration: 1.2 + Math.random() * 0.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: Math.random() * 0.5
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
            />
          ))}
        </div>

        {/* Central Quantum Crystal Portal Core */}
        <div className="relative flex flex-col items-center justify-center max-w-xl w-full px-6 text-center space-y-8 z-10">
          
          {/* Animated 3D Lattice Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer Rotating Pulse Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40 shadow-[0_0_50px_rgba(139,92,246,0.3)]"
            />

            {/* Inner Counter-Rotating Hexagon */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-3xl border border-cyan-400/50 flex items-center justify-center"
            />

            {/* Glowing Core Atom Icon */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_40px_rgba(34,211,238,0.6)]"
            >
              <Atom className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
            </motion.div>

            {/* Orbiting Sparkles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-start justify-center"
            >
              <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9] -mt-1" />
            </motion.div>
          </div>

          {/* Title & Target Module Display */}
          <div className="space-y-2">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{isRTL ? "در حال انتقال به برنامه..." : "INITIALIZING APALET ENVIRONMENT"}</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              XRD-CALC <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300">PRO</span>
            </h2>

            {targetModule && (
              <p className="text-xs text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-violet-400" />
                {isRTL ? `ماژول هدف: ${targetModule}` : `Target Module: ${targetModule.toUpperCase()}`}
              </p>
            )}
          </div>

          {/* Progress Bar & Laser Beam */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                {steps[stepIndex]}
              </span>
              <span className="text-cyan-400 font-mono text-sm">{progress}%</span>
            </div>

            <div className="relative w-full h-3 bg-slate-900/80 border border-white/10 rounded-full overflow-hidden p-0.5 shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_#22d3ee]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Equalizer Wave Visualizer */}
          <div className="flex items-center justify-center gap-1.5 h-6">
            {Array.from({ length: 16 }).map((_, idx) => (
              <motion.div
                key={idx}
                animate={{
                  height: [
                    `${Math.sin(idx + progress) * 8 + 12}px`,
                    `${Math.cos(idx + progress) * 14 + 18}px`,
                    `${Math.sin(idx + progress) * 8 + 12}px`
                  ]
                }}
                transition={{ duration: 0.3 + (idx % 4) * 0.1, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 bg-gradient-to-t from-violet-600 to-cyan-400 rounded-full opacity-80"
              />
            ))}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface AnimatedGoToAppButtonProps {
  onClick: () => void;
  text?: string;
  subtext?: string;
  variant?: 'primary' | 'secondary' | 'navbar' | 'compact';
  isRTL?: boolean;
  className?: string;
}

export const AnimatedGoToAppButton: React.FC<AnimatedGoToAppButtonProps> = ({
  onClick,
  text,
  variant = 'primary',
  isRTL = false,
  className = ''
}) => {
  const defaultText = isRTL ? "ورود به برنامه" : "Go to App";

  if (variant === 'navbar') {
    return (
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all border border-cyan-400/30 flex items-center gap-2 cursor-pointer ${className}`}
      >
        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <Zap className="w-3.5 h-3.5 text-cyan-300 animate-pulse shrink-0" />
        <span className="relative z-10">{text || defaultText}</span>
        <ArrowRight className={`w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
      </motion.button>
    );
  }

  if (variant === 'secondary') {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`relative group overflow-hidden px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg ${className}`}
      >
        <Atom className="w-4 h-4 text-cyan-400 group-hover:rotate-180 transition-transform duration-700" />
        <span>{text || defaultText}</span>
        <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative group overflow-hidden px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_10px_35px_rgba(124,58,237,0.45)] hover:shadow-[0_15px_45px_rgba(34,211,238,0.6)] transition-all border border-cyan-300/40 flex items-center justify-center gap-3 cursor-pointer ${className}`}
    >
      {/* Animated Light Shimmer Beam */}
      <span className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shimmy pointer-events-none" />
      
      <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping shrink-0" />
      <span className="relative z-10 tracking-widest">{text || defaultText}</span>
      <ArrowRight className={`w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1.5 ${isRTL ? 'rotate-180' : ''}`} />
    </motion.button>
  );
};
