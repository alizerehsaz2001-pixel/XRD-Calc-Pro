import React, { useState } from 'react';
import { Sliders, RotateCcw, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import { ConstituentElementItem } from './types';

interface ConstituentDopingSandboxProps {
  constituents: ConstituentElementItem[];
  dopantDelta: Record<string, number>;
  onDeltaChange: (symbol: string, delta: number) => void;
  onReset: () => void;
  formula: string;
}

export const ConstituentDopingSandbox: React.FC<ConstituentDopingSandboxProps> = ({
  constituents,
  dopantDelta,
  onDeltaChange,
  onReset,
  formula
}) => {
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);

  // Build the perturbed chemical formula string
  const perturbedFormula = constituents.map(c => {
    const delta = dopantDelta[c.symbol] || 0;
    const effective = Math.max(0.001, (c.baseCount || c.count) + delta);
    const countStr = effective.toFixed(3).replace(/\.?0+$/, '');
    return `${c.symbol}${countStr === '1' ? '' : countStr}`;
  }).join('');

  // Perturbed molar mass and average Z
  let perturbedMass = 0;
  let perturbedAtoms = 0;
  let perturbedElectrons = 0;

  constituents.forEach(c => {
    const delta = dopantDelta[c.symbol] || 0;
    const effective = Math.max(0.001, (c.baseCount || c.count) + delta);
    perturbedMass += effective * c.atomicWeight;
    perturbedAtoms += effective;
    perturbedElectrons += effective * c.z;
  });

  const perturbedAvgZ = perturbedAtoms > 0 ? perturbedElectrons / perturbedAtoms : 0;

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(perturbedFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#140e04] via-[#0d0902] to-[#070501] border border-amber-500/30 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Stoichiometric Perturbation & Solid-Solution Playground
            </span>
            <h4 className="text-xl font-black text-white uppercase tracking-wider font-serif">
              Non-Stoichiometric Doping & Defect Simulator
            </h4>
          </div>

          <button
            onClick={onReset}
            className="text-[11px] font-mono uppercase font-bold text-amber-400/80 hover:text-amber-300 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Ideal Stoichiometry</span>
          </button>
        </div>

        {/* Live Perturbed Formula Result Display */}
        <div className="p-4 bg-black/60 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-black uppercase text-amber-400/80 tracking-widest">
              Live Perturbed Empirical Formula
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider">
              {perturbedFormula}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase text-slate-400 block">Perturbed Molar Mass</span>
              <span className="text-sm font-mono font-black text-amber-300">{perturbedMass.toFixed(3)} g/mol</span>
            </div>
            <div className="text-right border-l border-amber-500/20 pl-3">
              <span className="text-[9px] font-mono uppercase text-slate-400 block">Perturbed Z̄</span>
              <span className="text-sm font-mono font-black text-cyan-300">{perturbedAvgZ.toFixed(2)} e⁻</span>
            </div>
            <button
              onClick={handleCopyFormula}
              className="px-3.5 py-2 text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition-all ml-2"
            >
              {copiedFormula ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFormula ? 'Copied!' : 'Copy Formula'}</span>
            </button>
          </div>
        </div>

        {/* Element Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {constituents.map(c => {
            const delta = dopantDelta[c.symbol] || 0;
            const effective = Math.max(0.001, (c.baseCount || c.count) + delta);
            const baseCount = c.baseCount || c.count || 1;

            return (
              <div key={c.symbol} className="p-3.5 bg-black/50 rounded-2xl border border-amber-500/20 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-amber-300 font-bold">{c.symbol} ({c.name})</span>
                  <span className="text-white font-mono">
                    n = {effective.toFixed(3)}
                    {delta !== 0 && (
                      <span className={`text-[10px] ml-1.5 font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)})
                      </span>
                    )}
                  </span>
                </div>

                <input
                  type="range"
                  min={-(baseCount * 0.95)}
                  max={baseCount * 2.0}
                  step={0.005}
                  value={delta}
                  onChange={(e) => onDeltaChange(c.symbol, parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                {/* Quick Step Buttons */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onDeltaChange(c.symbol, delta - 0.05)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      -0.05
                    </button>
                    <button
                      onClick={() => onDeltaChange(c.symbol, delta - 0.01)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      -0.01
                    </button>
                  </div>

                  <button
                    onClick={() => onDeltaChange(c.symbol, 0)}
                    className="text-[9px] text-slate-500 hover:text-amber-400"
                  >
                    Reset
                  </button>

                  <div className="flex gap-1">
                    <button
                      onClick={() => onDeltaChange(c.symbol, delta + 0.01)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      +0.01
                    </button>
                    <button
                      onClick={() => onDeltaChange(c.symbol, delta + 0.05)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      +0.05
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
