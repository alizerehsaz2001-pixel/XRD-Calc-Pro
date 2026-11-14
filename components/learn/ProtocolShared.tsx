import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const LatexInline: React.FC<{ tex: string; className?: string }> = ({ tex, className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(tex, ref.current, { throwOnError: false, displayMode: false });
      } catch {
        ref.current.textContent = tex;
      }
    }
  }, [tex]);
  return <span ref={ref} className={className} />;
};

export const LatexBlock: React.FC<{ tex: string; className?: string }> = ({ tex, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(tex, ref.current, { throwOnError: false, displayMode: true });
      } catch {
        ref.current.textContent = tex;
      }
    }
  }, [tex]);
  return (
    <div
      ref={ref}
      className={`overflow-x-auto my-2 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 ${className}`}
    />
  );
};

export interface StatusIndicatorProps {
  tone: 'nominal' | 'warning' | 'critical' | 'neutral';
  label: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ tone, label }) => {
  const styles = {
    nominal: {
      glyph: '●',
      cls: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
    },
    warning: {
      glyph: '▲',
      cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
    },
    critical: {
      glyph: '✖',
      cls: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
    },
    neutral: {
      glyph: '◆',
      cls: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    },
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${styles.cls}`}
    >
      <span aria-hidden="true">{styles.glyph}</span>
      <span>{label}</span>
    </span>
  );
};

export const ProtocolHeader: React.FC<{
  badge: string;
  badgeTone?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
}> = ({ badge, badgeTone = 'indigo', title, subtitle, rightSlot }) => {
  const badgeColor = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30',
  }[badgeTone];

  return (
    <div className="space-y-2.5 pb-5 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md border ${badgeColor}`}>
            {badge}
          </span>
        </div>
        {rightSlot}
      </div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
        {title}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};
