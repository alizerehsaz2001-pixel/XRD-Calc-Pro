import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ChevronUp, ChevronDown, MoveVertical } from 'lucide-react';

interface SideSeekBarProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  theme?: string;
}

export const SideSeekBar: React.FC<SideSeekBarProps> = ({ targetRef, theme }) => {
  const [isDragging, setIsDragging] = useState(false);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  
  // Use window scroll if no targetRef is provided
  const { scrollYProgress } = useScroll({
    target: targetRef || undefined,
    offset: ["start start", "end end"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const translateY = useTransform(scaleY, [0, 1], ["0%", "100%"]);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, forceDrag = false) => {
    if ((!forceDrag && !isDragging) || !scrollTrackRef.current) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = scrollTrackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const scrollTarget = targetRef?.current || document.documentElement;
    const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
    
    if (targetRef?.current) {
        targetRef.current.scrollTo({ top: maxScroll * percentage, behavior: 'auto' });
    } else {
        window.scrollTo({ top: maxScroll * percentage, behavior: 'auto' });
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const rect = scrollTrackRef.current?.getBoundingClientRect();
        if (!rect) return;
        const percentage = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const scrollTarget = targetRef?.current || document.documentElement;
        const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
        if (targetRef?.current) {
            targetRef.current.scrollTo({ top: maxScroll * percentage });
        } else {
            window.scrollTo({ top: maxScroll * percentage });
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, targetRef]);

  const scrollToTop = () => {
    const scrollTarget = targetRef?.current || window;
    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const scrollTarget = targetRef?.current || document.documentElement;
    const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
    if (targetRef?.current) {
        targetRef.current.scrollTo({ top: maxScroll, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: maxScroll, behavior: 'smooth' });
    }
  };

  const isCyber = theme === 'cyberpunk';

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[200] flex flex-col items-center gap-4 group">
      {/* Scroll Up Button */}
      <button 
        onClick={scrollToTop}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
          isCyber 
            ? 'bg-black border border-cyber-accent text-cyber-accent hover:bg-cyber-accent hover:text-black shadow-[0_0_10px_rgba(0,255,159,0.3)]' 
            : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/60 hover:text-white hover:bg-violet-600/40'
        } opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 duration-300`}
      >
        <ChevronUp size={16} />
      </button>

      {/* Main Seek Bar */}
      <div 
        ref={scrollTrackRef}
        className={`relative w-1.5 h-64 rounded-full cursor-pointer overflow-hidden transition-all duration-500 overflow-visible ${
          isCyber ? 'bg-cyber-accent/10' : 'bg-white/5'
        } backdrop-blur-sm border border-white/5 group-hover:w-3`}
        onMouseDown={(e) => {
            setIsDragging(true);
            handleDrag(e, true);
        }}
      >
        {/* Progress Fill */}
        <motion.div 
          className={`absolute top-0 left-0 w-full rounded-full origin-top ${
            isCyber ? 'bg-cyber-accent shadow-[0_0_15px_rgba(0,255,159,0.6)]' : 'bg-gradient-to-b from-violet-500 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
          }`}
          style={{ scaleY }}
        />

        {/* Drag Handle */}
        <motion.div 
          className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
            isCyber 
                ? 'bg-cyber-accent text-black shadow-[0_0_20px_rgba(0,255,159,0.8)]' 
                : 'bg-white text-violet-700 shadow-xl'
          }`}
          style={{ top: translateY, y: "-50%" }}
        >
          <MoveVertical size={12} className="font-bold" />
        </motion.div>
      </div>

      {/* Scroll Down Button */}
      <button 
        onClick={scrollToBottom}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
          isCyber 
            ? 'bg-black border border-cyber-accent text-cyber-accent hover:bg-cyber-accent hover:text-black shadow-[0_0_10px_rgba(0,255,159,0.3)]' 
            : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/60 hover:text-white hover:bg-violet-600/40'
        } opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300`}
      >
        <ChevronDown size={16} />
      </button>

      {/* Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${
          isCyber ? 'bg-cyber-accent text-black' : 'bg-white/10 backdrop-blur-xl text-white border border-white/20'
        }`}>
          Seek Navigation
        </div>
      </div>
    </div>
  );
};
