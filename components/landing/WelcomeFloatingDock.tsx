import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronUp, 
  Atom, 
  Layers, 
  Grid, 
  Compass, 
  FlaskConical,
  Zap,
  Flame,
  HelpCircle
} from 'lucide-react';

interface Props {
  isVisible: boolean;
  onOpenTour: () => void;
  onLaunchApp: () => void;
  isRegistered?: boolean;
  isRTL?: boolean;
}

export const WelcomeFloatingDock: React.FC<Props> = ({
  isVisible,
  onOpenTour,
  onLaunchApp,
  isRegistered = false,
  isRTL = false
}) => {
  const { t } = useTranslation();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[95vw]"
      >
        <div className="bg-[#050A18]/90 backdrop-blur-2xl border border-white/15 rounded-full px-3 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 flex items-center gap-1 sm:gap-2">
          
          {/* Scroll to Top */}
          <button
            onClick={scrollToTop}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Back to Top"
            aria-label="Back to Top"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/10 mx-0.5 hidden sm:block" />

          {/* Quick Anchor Jumps */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollToSection('presets')}
              className="px-2.5 py-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Instant Benchmarks"
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Presets</span>
            </button>

            <button
              onClick={() => scrollToSection('sandbox')}
              className="px-2.5 py-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Bragg Sandbox"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Sandbox</span>
            </button>

            <button
              onClick={() => scrollToSection('broadening')}
              className="px-2.5 py-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Scherrer Broadening"
            >
              <Atom className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden lg:inline">Broadening</span>
            </button>

            <button
              onClick={() => scrollToSection('modules')}
              className="px-2.5 py-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="30+ Scientific Modules"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">30+ Tools</span>
            </button>

            <button
              onClick={() => scrollToSection('workflows')}
              className="px-2.5 py-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-cyan-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Scientific Pipelines"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Pipelines</span>
            </button>
          </div>

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          {/* Quick Tour Button */}
          <button
            onClick={onOpenTour}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Interactive Quick-Start Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Primary CTA button with XRD resume */}
          <button
            onClick={onLaunchApp}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs font-mono shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <span>{isRegistered ? t('Resume Session', 'Resume Session') : t('Enter App', 'Enter App')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
export default WelcomeFloatingDock;
