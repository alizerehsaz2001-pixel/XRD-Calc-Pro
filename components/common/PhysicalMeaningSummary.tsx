import React from 'react';
import { Compass, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';

export type InterpretationTone = 'success' | 'warning' | 'info' | 'neutral';

interface PhysicalMeaningSummaryProps {
  title?: string;
  statement: string;
  contextNote?: string;
  tone?: InterpretationTone;
  metrics?: { label: string; value: string | number; unit?: string }[];
  className?: string;
}

export const PhysicalMeaningSummary: React.FC<PhysicalMeaningSummaryProps> = ({
  title = 'Physical Meaning & Laboratory Verdict',
  statement,
  contextNote,
  tone = 'info',
  metrics = [],
  className = ''
}) => {
  const getTheme = () => {
    switch (tone) {
      case 'success':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
        };
      case 'neutral':
        return {
          bg: 'bg-slate-900/60 border-slate-800 text-slate-300',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: <Compass className="w-4 h-4 text-slate-400" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: <Compass className="w-4 h-4 text-indigo-400" />
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${theme.bg} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 shrink-0 mt-0.5">
          {theme.icon}
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {title}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${theme.badge}`}>
              Active Model Verdict
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed font-sans">
            "{statement}"
          </p>

          {contextNote && (
            <p className="text-[11px] text-slate-300/90 leading-normal font-sans pt-0.5 border-t border-white/5">
              <span className="font-bold text-slate-400 uppercase text-[9px]">Material Context: </span>
              {contextNote}
            </p>
          )}

          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-950/80 p-2 rounded-xl border border-white/5 text-center font-mono">
                  <span className="text-[9px] text-slate-400 uppercase block truncate">{m.label}</span>
                  <span className="text-xs font-bold text-white">
                    {m.value} {m.unit && <span className="text-[10px] text-slate-400 font-normal">{m.unit}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
