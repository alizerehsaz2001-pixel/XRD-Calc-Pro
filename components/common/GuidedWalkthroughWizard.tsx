import React, { useState } from 'react';
import { Sparkles, Compass, CheckCircle2, ChevronRight, Play, RefreshCw, BookOpen, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export interface WizardStep {
  title: string;
  subtitle: string;
  explanation: string;
  focusElements?: string;
  tip?: string;
  actionLabel?: string;
}

interface GuidedWalkthroughWizardProps {
  moduleName: string;
  description: string;
  steps: WizardStep[];
  currentStepIndex?: number;
  onStepChange?: (index: number) => void;
  onLoadBenchmarkPreset?: (presetIndex: number) => void;
  presetNames?: string[];
  className?: string;
}

export const GuidedWalkthroughWizard: React.FC<GuidedWalkthroughWizardProps> = ({
  moduleName,
  description,
  steps,
  onLoadBenchmarkPreset,
  presetNames = [],
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const step = steps[currentStep] || steps[0];

  return (
    <div className={`rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-4 shadow-xl backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-200 font-mono">
                Guided Step-by-Step Walkthrough
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {presetNames.length > 0 && onLoadBenchmarkPreset && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Benchmark:</span>
              <select
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (!isNaN(idx)) onLoadBenchmarkPreset(idx);
                }}
                className="bg-slate-900 border border-indigo-500/40 text-indigo-300 rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-indigo-400"
              >
                {presetNames.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:underline px-2 py-1"
          >
            {isExpanded ? 'Collapse' : 'Show All Steps'}
          </button>
        </div>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="flex items-center gap-1.5 my-3">
        {steps.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              idx === currentStep
                ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                : idx < currentStep
                ? 'bg-emerald-500/70'
                : 'bg-slate-800'
            }`}
            title={`Step ${idx + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Current Step Content */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 font-sans">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block">
              {step.subtitle}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">{step.title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-slate-300 text-xs font-mono"
            >
              Prev
            </button>
            <button
              disabled={currentStep === steps.length - 1}
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-mono font-bold flex items-center gap-1"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{step.explanation}</p>

        {step.tip && (
          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-2">
            <Compass className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold uppercase text-[9px] text-indigo-400 block">Scientist Note:</span>
              <span>{step.tip}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded list of all steps (if toggled) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Complete Method Workflow:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {steps.map((s, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  idx === currentStep
                    ? 'border-indigo-500 bg-indigo-950/50 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 mb-1">
                  <span>#{idx + 1}</span>
                  <span className="truncate">{s.title}</span>
                </div>
                <p className="text-[10px] line-clamp-2 text-slate-300 font-sans">{s.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
