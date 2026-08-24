import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Compass, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConceptExplanation {
  term: string;
  symbol?: string;
  simpleDef: string;
  physicalMeaning: string;
  practicalRuleOfThumb?: string;
  whyItMatters?: string;
}

interface WhatDoesThisMeanTooltipProps {
  term: string;
  symbol?: string;
  explanation: string;
  physicalInterpretation?: string;
  ruleOfThumb?: string;
  variant?: 'inline' | 'button' | 'badge';
  className?: string;
}

export const WhatDoesThisMeanTooltip: React.FC<WhatDoesThisMeanTooltipProps> = ({
  term,
  symbol,
  explanation,
  physicalInterpretation,
  ruleOfThumb,
  variant = 'badge',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {variant === 'badge' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all shadow-sm cursor-pointer"
          title={`What does ${term} mean?`}
        >
          <HelpCircle className="w-2.5 h-2.5" />
          <span>What does this mean?</span>
        </button>
      ) : variant === 'button' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          title={`Explain ${term}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="cursor-pointer border-b border-dotted border-indigo-400 text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-0.5"
        >
          {symbol || term}
          <HelpCircle className="w-2.5 h-2.5 text-indigo-400 inline" />
        </span>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:static sm:inset-auto sm:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute z-50 left-0 bottom-full mb-2 w-80 sm:w-96 p-4 rounded-2xl bg-slate-900/98 border border-indigo-500/40 shadow-2xl text-slate-200 text-left font-sans text-xs space-y-2.5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white font-mono text-xs">{term}</h4>
                    {symbol && <span className="text-[10px] text-indigo-300 font-mono">{symbol}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Plain-English Definition:</span>
                  <p className="text-slate-200">{explanation}</p>
                </div>

                {physicalInterpretation && (
                  <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                    <span className="font-bold text-indigo-300 uppercase text-[9px] flex items-center gap-1 mb-0.5">
                      <Compass className="w-3 h-3 text-indigo-400" /> Physical Interpretation:
                    </span>
                    <p className="text-slate-300 text-[10px]">{physicalInterpretation}</p>
                  </div>
                )}

                {ruleOfThumb && (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                    <span className="font-bold text-emerald-400 uppercase text-[9px] flex items-center gap-1 mb-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Practical Rule of Thumb:
                    </span>
                    <p className="text-emerald-200/90 text-[10px]">{ruleOfThumb}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
