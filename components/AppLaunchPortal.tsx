import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ArrowRight, CheckCircle2, Sparkles, Activity, Terminal } from 'lucide-react';

interface AppLaunchPortalProps {
  isOpen: boolean;
  onComplete: () => void;
  targetModule?: string | null;
  mode?: 'login' | 'register' | 'resume';
  userName?: string;
}

const LAUNCH_STEPS = [
  { id: 'kernel', label: 'Initializing Reciprocal-Space & Metric Tensor Engine...', duration: 240 },
  { id: 'caglioti', label: 'Loading NIST SRM 640f Instrumental Resolution Function...', duration: 480 },
  { id: 'engines', label: 'Mounting Rietveld, Parratt XRR, PDF G(r) & PINN Modules...', duration: 720 },
  { id: 'ready', label: 'Crystallographic Workstation Ready.', duration: 920 },
];

export const AppLaunchPortal: React.FC<AppLaunchPortalProps> = ({
  isOpen,
  onComplete,
  targetModule,
  mode = 'login',
  userName,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const totalDuration = 980;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);

      if (elapsed > 720) setCurrentStep(3);
      else if (elapsed > 480) setCurrentStep(2);
      else if (elapsed > 240) setCurrentStep(1);
      else setCurrentStep(0);

      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        setTimeout(() => {
          onComplete();
        }, 80);
      }
    }, 24);

    return () => clearInterval(progressInterval);
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070A12]/95 backdrop-blur-xl overflow-hidden select-none p-4"
        >
          {/* Subtle CAD Coordinate Grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <motion.div
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.02, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-lg bg-[#0B0F19] border border-slate-800 rounded-sm shadow-2xl overflow-hidden"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#070A12] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  XRD-CALCPRO KERNEL INITIALIZATION
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">{progress}%</span>
            </div>

            <div className="p-6 space-y-5">
              {/* Target Workstation Banner */}
              <div className="flex items-center justify-between p-3.5 bg-[#070A12] border border-slate-800 rounded-sm">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    {mode === 'resume'
                      ? 'Resuming Active Workspace'
                      : userName
                      ? `Operator: ${userName}`
                      : 'Mounting Analytical Environment'}
                  </div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    Target Engine:{' '}
                    <span className="text-cyan-400 uppercase">
                      {targetModule ? targetModule.replace('_', ' ') : 'BRAGG & DIFFRACTION CORE'}
                    </span>
                  </div>
                </div>
                <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#070A12] border border-slate-800 overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-400"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Step Checklist */}
              <div className="space-y-2 bg-[#070A12] border border-slate-800 p-3.5 rounded-sm font-mono text-xs">
                {LAUNCH_STEPS.map((step, index) => {
                  const isDone = index < currentStep || progress === 100;
                  const isCurrent = index === currentStep && progress < 100;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2.5 transition-opacity ${
                        index <= currentStep ? 'opacity-100' : 'opacity-35'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 inline-block text-center text-slate-600">·</span>
                      )}
                      <span
                        className={`truncate ${
                          isDone ? 'text-slate-300' : isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  ● Precision Floating-Point Solver Active
                </span>
                <button
                  type="button"
                  onClick={onComplete}
                  className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider cursor-pointer"
                >
                  Enter Immediately →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AnimatedGoToAppButtonProps {
  onClick: () => void;
  label: string;
  sublabel?: string;
  variant?: 'navbar' | 'hero' | 'cta' | 'resume';
  icon?: React.ReactNode;
  className?: string;
}

export const AnimatedGoToAppButton: React.FC<AnimatedGoToAppButtonProps> = ({
  onClick,
  label,
  sublabel,
  variant = 'hero',
  icon,
  className = '',
}) => {
  const isNavbar = variant === 'navbar';
  const isResume = variant === 'resume';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center overflow-hidden font-mono font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer select-none rounded-sm ${
        isNavbar
          ? 'px-4 py-2 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-400'
          : isResume
          ? 'px-5 py-3 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400 shadow-lg shadow-emerald-950/50'
          : 'px-6 py-3.5 text-xs sm:text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-400 shadow-lg shadow-cyan-950/50'
      } ${className}`}
    >
      <div className="relative z-10 flex items-center gap-2.5">
        {icon ? icon : <Sparkles className={`${isNavbar ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />}
        <div className="flex flex-col text-left">
          <span className="leading-none">{label}</span>
          {sublabel && !isNavbar && (
            <span className="text-[10px] font-mono font-normal opacity-80 mt-1 tracking-normal normal-case">
              {sublabel}
            </span>
          )}
        </div>
        <ArrowRight
          className={`${
            isNavbar ? 'w-3.5 h-3.5' : 'w-4 h-4'
          } transition-transform duration-150 group-hover:translate-x-1 shrink-0`}
        />
      </div>
    </button>
  );
};
