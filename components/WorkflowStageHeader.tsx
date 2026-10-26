import React from 'react';
import { CheckCircle2, AlertCircle, ArrowDown, Sparkles, Layers } from 'lucide-react';

export interface WorkflowStageHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  isComplete?: boolean;
  isReady?: boolean;
  className?: string;
}

export const WorkflowStageHeader: React.FC<WorkflowStageHeaderProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  badge = 'Sequential Pipeline',
  badgeColor = 'indigo',
  isComplete = false,
  isReady = true,
  className = ''
}) => {
  const colorMap = {
    indigo: {
      stepBg: 'bg-indigo-600',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      line: 'from-indigo-500/30'
    },
    cyan: {
      stepBg: 'bg-cyan-600',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      line: 'from-cyan-500/30'
    },
    emerald: {
      stepBg: 'bg-emerald-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      line: 'from-emerald-500/30'
    },
    amber: {
      stepBg: 'bg-amber-600',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      line: 'from-amber-500/30'
    },
    rose: {
      stepBg: 'bg-rose-600',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      line: 'from-rose-500/30'
    },
    purple: {
      stepBg: 'bg-purple-600',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      line: 'from-purple-500/30'
    }
  };

  const colors = colorMap[badgeColor] || colorMap.indigo;

  return (
    <div className={`relative flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border border-white/10 shadow-md backdrop-blur-md ${className}`}>
      {/* Left Info: Step Number & Title */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl ${colors.stepBg} text-white font-mono font-black text-xs flex items-center justify-center shadow-md shadow-indigo-900/30 shrink-0`}>
          {isComplete ? <CheckCircle2 className="w-4 h-4" /> : `0${step}`}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">
              {title}
            </h3>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${colors.badgeBg} hidden sm:inline`}>
              {badge}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Progress Status */}
      <div className="flex items-center gap-2 text-right">
        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest hidden md:inline">
          Stage {step}/{totalSteps}
        </span>
        {isComplete ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span className="hidden sm:inline">Executed</span>
          </span>
        ) : isReady ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Active</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            <AlertCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Awaiting</span>
          </span>
        )}
      </div>
    </div>
  );
};
