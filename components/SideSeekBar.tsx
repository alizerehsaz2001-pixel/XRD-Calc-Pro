import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

interface SideSeekBarProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  theme?: string;
}

export const SideSeekBar: React.FC<SideSeekBarProps> = ({ targetRef, theme }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const target = targetRef?.current || window;
    
    const handleScroll = () => {
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (targetRef?.current) {
        scrollTop = targetRef.current.scrollTop;
        scrollHeight = targetRef.current.scrollHeight;
        clientHeight = targetRef.current.clientHeight;
      } else {
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      }

      const totalScrollable = scrollHeight - clientHeight;
      const progress = totalScrollable > 0 ? Math.min(1, Math.max(0, scrollTop / totalScrollable)) : 0;
      setScrollProgress(progress);
      setShowScrollTop(scrollTop > 280);
    };

    if (targetRef?.current) {
      const el = targetRef.current;
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [targetRef]);

  const scrollToTop = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isCyber = theme === 'cyberpunk';

  return (
    <>
      {/* 1. Subtle, minimalist top scroll progress line */}
      {scrollProgress > 0.01 && (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-transparent">
          <div
            className={`h-full transition-all duration-150 ease-out ${
              isCyber
                ? 'bg-cyber-accent shadow-[0_0_8px_rgba(0,255,159,0.8)]'
                : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600'
            }`}
            style={{ width: `${(scrollProgress * 100).toFixed(1)}%` }}
          />
        </div>
      )}

      {/* 2. Minimalist Back to Top floating action button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className={`fixed bottom-6 right-6 z-40 p-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 group ${
              isCyber
                ? 'bg-black/90 border-cyber-accent text-cyber-accent shadow-[0_0_15px_rgba(0,255,159,0.4)] hover:bg-cyber-accent hover:text-black'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 shadow-slate-900/15'
            }`}
            title="Scroll to Top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
