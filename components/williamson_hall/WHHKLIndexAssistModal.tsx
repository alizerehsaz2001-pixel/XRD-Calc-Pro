import React, { useState, useMemo } from 'react';
import { X, Check, BrainCircuit, AlertCircle, ArrowRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { suggestHKLPlanesAlgorithmic, validateHKLAgainstCrystalSystem } from '../../utils/physics';

interface WHHKLIndexAssistModalProps {
  currentPeaks: Array<{ twoTheta: number; fwhmObs: number; h?: number; k?: number; l?: number }>;
  wavelength: number;
  onApplyIndices: (indexedPeaks: Array<{ twoTheta: number; fwhmObs: number; h: number; k: number; l: number }>) => void;
  onClose: () => void;
}

const LATTICE_SYSTEMS = [
  { id: 'FCC', name: 'Face-Centered Cubic (FCC)', desc: 'All even or all odd unmixed parity (111, 200, 220, 311...)' },
  { id: 'BCC', name: 'Body-Centered Cubic (BCC)', desc: 'h + k + l must be even (110, 200, 211, 220...)' },
  { id: 'Diamond', name: 'Diamond Cubic (Si, Ge)', desc: 'FCC rules + if even sum is multiple of 4 (111, 220, 311, 400...)' },
  { id: 'Hexagonal', name: 'Hexagonal / HCP (ZnO, Mg)', desc: 'Extinction condition: l odd & h+2k=3n forbidden' },
  { id: 'SC', name: 'Simple Cubic (SC)', desc: 'All reflections allowed without parity restrictions' }
];

export const WHHKLIndexAssistModal: React.FC<WHHKLIndexAssistModalProps> = ({
  currentPeaks,
  wavelength,
  onApplyIndices,
  onClose
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string>('FCC');

  const twoThetaList = useMemo(() => {
    return currentPeaks.map(p => p.twoTheta).filter(tt => tt > 0 && tt < 180);
  }, [currentPeaks]);

  const indexResult = useMemo(() => {
    if (twoThetaList.length === 0) return null;
    return suggestHKLPlanesAlgorithmic(twoThetaList, selectedSystem, wavelength);
  }, [twoThetaList, selectedSystem, wavelength]);

  // Merge the suggestions back with original peak FWHM
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
        fwhmObs: peak.fwhmObs,
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
      fwhmObs: p.fwhmObs,
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
        className="bg-[#050A14] border border-cyan-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-[0_0_50px_rgba(34,211,238,0.15)] space-y-5 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <BrainCircuit className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Algorithmic (h k l) Plane Indexer Assist
              </h3>
              <p className="text-[10px] text-purple-400/80 font-mono">
                Auto-assign crystallographic Miller indices by evaluating Bragg d-spacings & lattice extinction rules
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
          {/* System Selection */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Select Target Crystal Lattice Symmetry
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LATTICE_SYSTEMS.map((sys) => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setSelectedSystem(sys.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedSystem === sys.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                      : 'bg-[#070D18] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-black text-white">{sys.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1 leading-snug">{sys.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Summary */}
          {indexResult && (
            <div className="bg-[#070D18] p-3.5 rounded-2xl border border-purple-500/20 font-mono text-[10px] space-y-1">
              <p className="text-purple-300 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{indexResult.analysisSummary}</span>
              </p>
              {indexResult.estimatedLatticeConstant && (
                <p className="text-slate-400 text-[9px]">
                  Estimated Parameter: <span className="text-cyan-300">{indexResult.estimatedLatticeConstant}</span>
                </p>
              )}
            </div>
          )}

          {/* Indexing Proposal Table */}
          <div className="bg-[#070D18] p-3 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Suggested Miller Indices per Reflection
            </span>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="bg-black/60 text-slate-400 uppercase border-b border-white/10 font-bold text-[9px]">
                    <th className="py-2 px-3">2θ (deg)</th>
                    <th className="py-2 px-3">d-spacing (Å)</th>
                    <th className="py-2 px-3">Assigned (h k l)</th>
                    <th className="py-2 px-3">Selection Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mergedSuggestions.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2 px-3 font-bold text-white">{row.twoTheta.toFixed(2)}°</td>
                      <td className="py-2 px-3 text-slate-300">{row.dSpacing.toFixed(3)} Å</td>
                      <td className="py-2 px-3 font-bold text-purple-300">
                        <span className="bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                          ({row.h} {row.k} {row.l})
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
                            <Check className="w-3 h-3" /> Allowed
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 text-[9px]" title={row.reason}>
                            <AlertCircle className="w-3 h-3" /> Rule Warning
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Indexed Planes</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
