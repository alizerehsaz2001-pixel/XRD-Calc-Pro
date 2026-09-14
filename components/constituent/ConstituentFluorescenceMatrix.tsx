import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Zap, Info } from 'lucide-react';
import { ConstituentElementItem, LAB_ANODES, AnodeSpec } from './types';
import { evaluateFluorescenceRisk } from '../../utils/elementMetrology';

interface ConstituentFluorescenceMatrixProps {
  constituents: ConstituentElementItem[];
  selectedAnode: string;
  onSelectAnode: (anode: string) => void;
  formula: string;
}

export const ConstituentFluorescenceMatrix: React.FC<ConstituentFluorescenceMatrixProps> = ({
  constituents,
  selectedAnode,
  onSelectAnode,
  formula
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#070b14] border border-indigo-500/30 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              Multi-Anode Radiation Matrix & Secondary Fluorescence
            </span>
            <h4 className="text-xl font-black text-white uppercase tracking-wider font-serif">
              Laboratory Anode Suitability Audit ({formula})
            </h4>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800">
            Active Tube: <span className="text-cyan-400 font-bold">{selectedAnode}</span>
          </div>
        </div>

        {/* Anode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {LAB_ANODES.map(anode => {
            const isSelected = selectedAnode === anode.name;

            // Audit which elements in the phase are excited by this anode
            const elementRisks = constituents.map(c => ({
              symbol: c.symbol,
              z: c.z,
              name: c.name,
              meta: c.meta,
              risk: evaluateFluorescenceRisk(c.symbol, anode.name)
            }));

            const excitedElements = elementRisks.filter(e => e.risk.isExcited);
            const severeElements = elementRisks.filter(e => e.risk.severity === 'severe');
            const moderateElements = elementRisks.filter(e => e.risk.severity === 'moderate');

            const hasSevere = severeElements.length > 0;
            const hasModerate = moderateElements.length > 0;

            return (
              <div
                key={anode.name}
                onClick={() => onSelectAnode(anode.name)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#0f172a] border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-black/50 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-white">{anode.name}</span>
                      {isSelected && (
                        <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {anode.energyKeV.toFixed(3)} keV | λ = {anode.wavelengthA.toFixed(4)} Å
                    </span>
                  </div>

                  {/* Status Badge */}
                  {hasSevere ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                      Severe Risk
                    </span>
                  ) : hasModerate ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      Moderate
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      Clean
                    </span>
                  )}
                </div>

                {/* Excited Elements List */}
                <div className="text-xs font-mono space-y-1">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">
                    Secondary Fluorescence:
                  </span>
                  {excitedElements.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {excitedElements.map(el => (
                        <span
                          key={el.symbol}
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                            el.risk.severity === 'severe'
                              ? 'bg-rose-900/40 border-rose-700/60 text-rose-200'
                              : 'bg-amber-900/40 border-amber-700/60 text-amber-200'
                          }`}
                          title={el.risk.explanation}
                        >
                          {el.symbol} (E_K={el.meta.kEdgeKeV ? `${el.meta.kEdgeKeV.toFixed(2)} keV` : 'N/A'})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      None. No constituent K-edges excited (ultra-low background).
                    </span>
                  )}
                </div>

                {/* Recommended Filter */}
                <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono flex justify-between items-center text-slate-400">
                  <span>Beta-Filter:</span>
                  <span className="text-slate-200 font-bold">{anode.betaFilter}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Educational Callout */}
        <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 flex items-start gap-3 text-xs font-mono">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-400 leading-relaxed text-[11px]">
            <span className="text-slate-200 font-bold block">
              Physical Origin of Secondary X-Ray Fluorescence in Diffractometry:
            </span>
            When the incident X-ray photon energy exceeds the binding energy of the core electrons (the K-edge $E_K$) of an element in your sample, photoelectric absorption ejects a core photoelectron. The subsequent relaxation produces isotropic characteristic fluorescence X-rays. If unmonochromatized or poorly discriminated, this parasitic fluorescence elevates the background baseline by orders of magnitude, burying low-intensity Bragg reflections.
          </div>
        </div>
      </div>
    </div>
  );
};
