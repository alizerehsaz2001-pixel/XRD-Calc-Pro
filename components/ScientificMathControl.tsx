import React, { useState } from 'react';
import { Calculator, ChevronDown, CheckCircle2, Sigma, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MathVariable {
  symbol: string;
  value: number | string;
  unit: string;
  name: string;
}

interface ScientificMathControlProps {
  title?: string;
  formula: string;
  description: string;
  variables: MathVariable[];
  result: number | string;
  resultUnit: string;
  resultName: string;
}

export const ScientificMathControl: React.FC<ScientificMathControlProps> = ({
  title = "Scientific Math Control & Verification",
  formula,
  description,
  variables,
  result,
  resultUnit,
  resultName
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border border-indigo-500/20 bg-indigo-950/10 rounded-2xl overflow-hidden shadow-inner">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-900/10 to-transparent hover:bg-indigo-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-300 font-mono">
            {title}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-5 border-t border-indigo-500/10 flex flex-col gap-5">
              
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-50">
                  <Sigma className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Governing Equation</span>
                </div>
                <div className="mt-4 text-base font-black text-white font-mono tracking-wider drop-shadow-md py-2 px-6 bg-slate-900 rounded-lg border border-slate-800">
                  {formula}
                </div>
                <span className="text-[10px] text-slate-400 mt-3 text-center max-w-md italic">{description}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3 border-b border-slate-800 pb-2">Active Variables</span>
                  <div className="flex flex-col gap-2 relative z-10">
                    {variables.map((v, i) => (
                      <div key={i} className="flex items-center justify-between font-mono text-[11px] group cursor-default">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-black bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{v.symbol}</span>
                          <span className="text-slate-400 group-hover:text-slate-300 transition-colors uppercase text-[9px]">{v.name}</span>
                        </div>
                        <div className="text-slate-300 font-bold">
                          {typeof v.value === 'number' ? v.value.toFixed(4) : v.value} <span className="text-slate-500 font-normal">{v.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-50">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-2">Calculated Control Answer</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                      {typeof result === 'number' ? (isNaN(result) ? 'ERR' : result.toFixed(4)) : result}
                    </span>
                    <span className="text-indigo-300 text-sm font-bold">{resultUnit}</span>
                  </div>
                  <span className="text-[9px] text-indigo-300/60 uppercase tracking-wider mt-1">{resultName}</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
