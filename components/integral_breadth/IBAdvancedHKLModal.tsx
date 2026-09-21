import React, { useState, useMemo } from 'react';
import { X, Check, BrainCircuit, AlertCircle, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { suggestHKLPlanesAlgorithmic, validateHKLAgainstCrystalSystem } from '../../utils/physics';

interface IBAdvancedHKLModalProps {
  isOpen: boolean;
  currentPeaks: Array<{ twoTheta: number; area: number; iMax: number; fwhm?: number; h?: number; k?: number; l?: number }>;
  wavelength: number;
  onApplyIndices: (indexedPeaks: Array<{ twoTheta: number; area: number; iMax: number; fwhm?: number; h: number; k: number; l: number }>) => void;
  onClose: () => void;
}

const LATTICE_SYSTEMS = [
  { id: 'FCC', name: 'Face-Centered Cubic (FCC)', desc: 'All even or all odd unmixed parity (111, 200, 220, 311, 222, 400...)' },
  { id: 'BCC', name: 'Body-Centered Cubic (BCC)', desc: 'h + k + l must be even (110, 200, 211, 220, 310, 222...)' },
  { id: 'Diamond', name: 'Diamond Cubic (Si, Ge, C)', desc: 'FCC rules + if all even sum must be multiple of 4 (111, 220, 311, 400, 331...)' },
  { id: 'Hexagonal', name: 'Hexagonal / Wurtzite (ZnO, Mg)', desc: 'Extinction condition: l odd & h+2k=3n forbidden' },
  { id: 'SC', name: 'Simple Cubic (SC)', desc: 'All reflections allowed without parity restrictions' }
];

export const IBAdvancedHKLModal: React.FC<IBAdvancedHKLModalProps> = ({
  isOpen,
  currentPeaks,
  wavelength,
  onApplyIndices,
  onClose
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string>('FCC');

  if (!isOpen) return null;

  const twoThetaList = useMemo(() => {
    return currentPeaks.map(p => p.twoTheta).filter(tt => tt > 0 && tt < 180);
  }, [currentPeaks]);

  const indexResult = useMemo(() => {
    if (twoThetaList.length === 0) return null;
    return suggestHKLPlanesAlgorithmic(twoThetaList, selectedSystem, wavelength);
  }, [twoThetaList, selectedSystem, wavelength]);

  // Merge the suggestions back with original peak Area & Imax
  const mergedSuggestions = useMemo(() => {
    if (!indexResult || !indexResult.suggestions) return [];
    
    return currentPeaks.map((peak, idx) => {
      const sug = indexResult.suggestions.find(s => Math.abs(s.twoTheta - peak.twoTheta) < 0.05) || indexResult.suggestions[idx];
      const h = sug ? sug.h : (peak.h ?? 1);
      const k = sug ? sug.k : (peak.k ?? 1);
      const l = sug ? sug.l : (peak.l ?? 1);

      const validation = validateHKLAgainstCrystalSystem(h, k, l, selectedSystem);

      return {
        twoTheta: peak.twoTheta,
        area: peak.area,
        iMax: peak.iMax,
        fwhm: peak.fwhm,
        h,
        k,
        l,
        dSpacing: sug?.dSpacing || (wavelength / (2 * Math.sin((peak.twoTheta / 2) * (Math.PI / 180)))),
        confidence: sug?.confidence || 0.85,
        isValid: validation.valid,
        reason: validation.reason
      };
    });
  }, [currentPeaks, indexResult, selectedSystem, wavelength]);

  const handleApply = () => {
    const formatted = mergedSuggestions.map(p => ({
      twoTheta: p.twoTheta,
      area: p.area,
      iMax: p.iMax,
      fwhm: p.fwhm,
      h: p.h,
      k: p.k,
      l: p.l
    }));
    onApplyIndices(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#050A14] border border-purple-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-[0_0_50px_rgba(168,85,247,0.15)] space-y-5 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <BrainCircuit className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Algorithmic (h k l) Plane Indexer
              </h3>
              <p className="text-[10px] text-purple-400/80 font-mono">
                Auto-assign Miller indices from interplanar d-spacings & lattice extinction rules
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crystal System Selector */}
        <div className="space-y-2 shrink-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Target Crystal System
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LATTICE_SYSTEMS.map((sys) => (
              <button
                key={sys.id}
                type="button"
                onClick={() => setSelectedSystem(sys.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedSystem === sys.id 
                    ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                    : 'bg-[#0A101C] border-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold">{sys.name.split(' (')[0]}</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">{sys.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Lattice Constant info banner */}
        {indexResult && indexResult.estimatedLatticeConstant && (
          <div className="bg-purple-950/30 border border-purple-500/20 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono shrink-0">
            <span className="text-slate-400">Estimated Lattice Constant <strong className="text-purple-300">a</strong>:</span>
            <span className="text-purple-400 font-bold">{indexResult.estimatedLatticeConstant}</span>
          </div>
        )}

        {/* Table of reflections and suggested (h k l) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl bg-[#070D18] p-3 space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 py-1 border-b border-white/5">
            <span className="col-span-2">2θ (deg)</span>
            <span className="col-span-2">Area</span>
            <span className="col-span-2">I_max</span>
            <span className="col-span-2">d-spacing</span>
            <span className="col-span-4 text-center">Suggested (h k l)</span>
          </div>

          {mergedSuggestions.map((item, idx) => (
            <div 
              key={idx}
              className={`grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                item.isValid 
                  ? 'bg-[#0A101C] border-white/5 hover:border-purple-500/30' 
                  : 'bg-red-950/20 border-red-500/30'
              }`}
            >
              <span className="col-span-2 text-pink-400 font-bold">{item.twoTheta.toFixed(2)}°</span>
              <span className="col-span-2 text-emerald-400 font-bold">{item.area.toFixed(1)}</span>
              <span className="col-span-2 text-cyan-400 font-bold">{item.iMax.toFixed(0)}</span>
              <span className="col-span-2 text-slate-400">{item.dSpacing.toFixed(3)} Å</span>
              
              <div className="col-span-4 flex items-center justify-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs">
                  ({item.h} {item.k} {item.l})
                </span>
                {item.isValid ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span title={item.reason} className="cursor-help">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Apply Indexed Planes
          </button>
        </div>
      </motion.div>
    </div>
  );
};
