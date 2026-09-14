import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Atom,
  Zap,
  ShieldAlert,
  Maximize2,
  X,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { ConstituentElementItem } from './types';
import { ElementMetrology, FluorescenceRisk } from '../../utils/elementMetrology';

interface ConstituentElementInspectorProps {
  element: ConstituentElementItem;
  meta: ElementMetrology;
  risk: FluorescenceRisk;
  selectedAnode: string;
  onSelectAnode: (anode: string) => void;
  onDeselect: () => void;
  formula: string;
  categoryStyles: {
    glow: string;
    badge: string;
    bar: string;
    text: string;
  };
}

export const ConstituentElementInspector: React.FC<ConstituentElementInspectorProps> = ({
  element,
  meta,
  risk,
  selectedAnode,
  onSelectAnode,
  onDeselect,
  formula,
  categoryStyles
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <>
      {/* Inline Inspector (Document Flow, No Overlap) */}
      <div className="mt-6 p-6 sm:p-8 rounded-3xl bg-[#080E1B] border-2 border-indigo-500/50 shadow-[0_15px_60px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-inner ${categoryStyles.glow}`}>
              <span className="text-[10px] font-mono font-black text-slate-400 leading-none">
                Z {meta.z}
              </span>
              <span className="text-2xl font-serif font-black text-white leading-tight">
                {meta.symbol}
              </span>
              <span className="text-[8px] font-mono text-slate-400 leading-none">
                {meta.atomicWeight.toFixed(2)}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-indigo-400 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-indigo-400" />
                  Element Property Metrology
                </span>
                <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${categoryStyles.badge}`}>
                  {meta.category}
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Period {meta.period}, Group {meta.group} ({meta.block}-block)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-serif">
                {meta.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 text-xs font-mono font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/40 flex items-center gap-1.5 transition-all shadow-sm"
              title="Expand to Fullscreen View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>
            <button
              onClick={onDeselect}
              className="px-3.5 py-2 text-xs font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Deselect element"
            >
              <X className="w-3.5 h-3.5" />
              <span>Deselect</span>
            </button>
          </div>
        </div>

        {/* Section 1: Electronic Structure & Radii */}
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 block">
            1. Electronic Structure & Bonding Radii
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-black/40 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[9px] uppercase text-slate-500 font-bold block">
                Ground Electron Config
              </span>
              <span className="text-sm font-black text-cyan-400">
                {meta.electronConfig}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Valence e⁻: {meta.valenceElectrons}
              </span>
            </div>

            <div className="p-3.5 bg-black/40 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[9px] uppercase text-slate-500 font-bold block">
                Electronegativity (Pauling)
              </span>
              <span className="text-sm font-black text-yellow-400">
                χ = {meta.electronegativity || 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {meta.electronegativity ? (meta.electronegativity > 2.0 ? 'Electronegative Anion' : 'Electropositive Cation') : 'Unspecified'}
              </span>
            </div>

            <div className="p-3.5 bg-black/40 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[9px] uppercase text-slate-500 font-bold block">
                Shannon Radii (Ionic / Covalent)
              </span>
              <span className="text-sm font-black text-indigo-400">
                {meta.ionicRadiusPm} pm / {meta.covalentRadiusPm} pm
              </span>
              <span className="text-[10px] text-slate-400 block">
                Atomic Radius ~ {(meta.covalentRadiusPm / 100).toFixed(2)} Å
              </span>
            </div>

            <div className="p-3.5 bg-black/40 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[9px] uppercase text-slate-500 font-bold block">
                Standard Crystal Structure & Ox.
              </span>
              <span className="text-sm font-black text-emerald-400 truncate block">
                {meta.pureCrystalStructure}
              </span>
              <span className="text-[10px] text-indigo-300 font-bold block">
                Ox: {meta.commonOxidationStates.map(o => (o > 0 ? `+${o}` : o)).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Characteristic X-Ray Diffraction Edges */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-[#0b1220] to-[#060a12] border border-indigo-500/30 rounded-2xl space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              2. X-ray Diffraction Metrology & Characteristic Edges
            </h4>
            <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-800/50">
              Thomson Forward Scattering f₀(0) = {meta.z} e⁻
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-black/50 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[9px] uppercase text-slate-500 block">K-Absorption Edge (E_K)</span>
              <span className="text-white font-black text-sm block">
                {meta.kEdgeKeV ? `${meta.kEdgeKeV.toFixed(3)} keV` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500">
                {meta.kEdgeKeV ? `λ = ${(12.3984 / meta.kEdgeKeV).toFixed(3)} Å` : ''}
              </span>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[9px] uppercase text-slate-500 block">Kα₁ Emission Line</span>
              <span className="text-cyan-400 font-black text-sm block">
                {meta.kAlpha1KeV ? `${meta.kAlpha1KeV.toFixed(3)} keV` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500">
                {meta.kAlpha1KeV ? `λ = ${(12.3984 / meta.kAlpha1KeV).toFixed(4)} Å` : ''}
              </span>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[9px] uppercase text-slate-500 block">L₃-Edge / Kβ₁</span>
              <span className="text-purple-400 font-black text-sm block">
                {meta.l3EdgeKeV ? `${meta.l3EdgeKeV.toFixed(3)} keV` : meta.kBeta1KeV ? `${meta.kBeta1KeV.toFixed(3)} keV` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500">Secondary Edge</span>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[9px] uppercase text-slate-500 block">Mass Attenuation (Cu-Kα)</span>
              <span className="text-emerald-400 font-black text-sm block">
                {meta.muOverRhoCu ? `${meta.muOverRhoCu.toFixed(1)} cm²/g` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500">
                {meta.densityGcm3 && meta.muOverRhoCu
                  ? `μ = ${(meta.muOverRhoCu * meta.densityGcm3).toFixed(1)} cm⁻¹`
                  : 'Element pure absorption'}
              </span>
            </div>
          </div>

          {/* Fluorescence Check for Selected Anode */}
          <div className="p-3.5 rounded-xl border bg-black/40 border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Incident Radiation Tube Compatibility Check:
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['Cu-Ka', 'Co-Ka', 'Mo-Ka', 'Cr-Ka', 'Fe-Ka'].map(anode => (
                  <button
                    key={anode}
                    onClick={() => onSelectAnode(anode)}
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all ${
                      selectedAnode === anode
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {anode}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
              risk.severity === 'severe'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : risk.severity === 'moderate'
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}>
              <div className="space-y-1 w-full">
                <div className="font-bold flex items-center justify-between">
                  <span>{risk.anode} Incident Beam:</span>
                  <span className="uppercase text-[9px] px-2 py-0.5 rounded bg-black/50 border border-white/10 font-black">
                    {risk.severity} Fluorescence Hazard
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {risk.explanation}
                </p>
                {risk.recommendedAnodes.length > 0 && (
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    Recommended Alternative Anodes: <span className="text-white font-bold">{risk.recommendedAnodes.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Stoichiometric Contribution */}
        <div className="p-4 bg-black/30 border border-slate-800 rounded-2xl space-y-2 relative z-10">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 block">
            3. Role in Phase Formula [{formula}]
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-black/50 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase text-slate-500 block">Stoichiometric Count</span>
              <span className="text-white font-black text-sm">
                n = {element.count.toFixed(3)} atoms
              </span>
            </div>
            <div className="p-2.5 bg-black/50 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase text-slate-500 block">Mass Fraction (wt%)</span>
              <span className="text-indigo-400 font-black text-sm">
                {element.massPercent.toFixed(2)} wt%
              </span>
            </div>
            <div className="p-2.5 bg-black/50 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase text-slate-500 block">Atomic Fraction (at%)</span>
              <span className="text-cyan-400 font-black text-sm">
                {element.atomicPercent.toFixed(2)} at%
              </span>
            </div>
            <div className="p-2.5 bg-black/50 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase text-slate-500 block">Scattering Share (f₀²%)</span>
              <span className="text-purple-400 font-black text-sm">
                {element.scatteringPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Standalone Modal */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-[#020617]/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-[#080E1D] border-2 border-indigo-500/60 rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-[#0d162b] to-[#090f1d] border-b border-slate-800 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-inner ${categoryStyles.glow}`}>
                  <span className="text-[10px] font-mono font-black text-slate-400 leading-none">
                    Z {meta.z}
                  </span>
                  <span className="text-2xl font-serif font-black text-white leading-tight">
                    {meta.symbol}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 leading-none">
                    {meta.atomicWeight.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-black text-indigo-400">
                      Element Metrology Inspector
                    </span>
                    <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${categoryStyles.badge}`}>
                      {meta.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider font-serif">
                    {meta.name} ({meta.symbol})
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                title="Close Modal (Escape)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Electron Configuration
                  </span>
                  <span className="text-xs font-mono font-black text-cyan-400">
                    {meta.electronConfig}
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Electronegativity (Pauling)
                  </span>
                  <span className="text-xs font-mono font-black text-yellow-400">
                    χ = {meta.electronegativity || 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Ionic / Covalent Radii
                  </span>
                  <span className="text-xs font-mono font-black text-indigo-400">
                    {meta.ionicRadiusPm} pm / {meta.covalentRadiusPm} pm
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Periodic Location
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    Period {meta.period}, Group {meta.group} ({meta.block}-block)
                  </span>
                </div>
              </div>

              {/* Characteristic Edges */}
              <div className="p-4 bg-gradient-to-br from-[#0c1220] to-[#070b14] border border-indigo-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    X-ray Metrology & Characteristic Absorption Edges
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Thomson f₀(0) = {meta.z}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-500 block mb-1">K-Absorption Edge (E_K)</span>
                    <span className="text-white font-black text-sm">
                      {meta.kEdgeKeV ? `${meta.kEdgeKeV.toFixed(3)} keV` : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-500 block mb-1">Kα₁ Emission Line</span>
                    <span className="text-cyan-400 font-black text-sm">
                      {meta.kAlpha1KeV ? `${meta.kAlpha1KeV.toFixed(3)} keV` : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-500 block mb-1">L₃-Edge / Kβ₁</span>
                    <span className="text-purple-400 font-black text-sm">
                      {meta.l3EdgeKeV ? `${meta.l3EdgeKeV.toFixed(3)} keV` : meta.kBeta1KeV ? `${meta.kBeta1KeV.toFixed(3)} keV` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Fluorescence Alert */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono ${
                  risk.severity === 'severe'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : risk.severity === 'moderate'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                }`}>
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>{risk.anode} Incident Radiation Check:</span>
                      <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {risk.explanation}
                    </p>
                    {risk.recommendedAnodes.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Recommended Alternative Anodes: <span className="text-white font-bold">{risk.recommendedAnodes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#080d19] border-t border-slate-800 flex justify-between items-center text-xs font-mono shrink-0">
              <span className="text-slate-500">
                Phase: <span className="text-white font-bold">{formula}</span>
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
              >
                Close Fullscreen Inspector
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
