import React, { useState } from 'react';
import { X, Calculator, Sparkles, Check, Info, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface IBAdvancedProfileCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCalculatedPeak: (twoTheta: number, area: number, iMax: number, fwhm: number, h?: number, k?: number, l?: number) => void;
}

export const IBAdvancedProfileCalcModal: React.FC<IBAdvancedProfileCalcModalProps> = ({
  isOpen,
  onClose,
  onApplyCalculatedPeak
}) => {
  const [twoTheta, setTwoTheta] = useState<string>('28.44');
  const [profileType, setProfileType] = useState<'voigt' | 'gaussian' | 'lorentzian' | 'fwhm_beta'>('voigt');
  const [fwhm, setFwhm] = useState<string>('0.25');
  const [iMax, setIMax] = useState<string>('1000');
  const [eta, setEta] = useState<string>('0.5'); // Pseudo-Voigt Cauchy fraction
  const [directBeta, setDirectBeta] = useState<string>('0.28');
  const [h, setH] = useState<string>('1');
  const [k, setK] = useState<string>('1');
  const [l, setL] = useState<string>('1');

  if (!isOpen) return null;

  // Calculate Area and Beta based on selected mode
  const fwhmNum = parseFloat(fwhm) || 0.25;
  const imaxNum = parseFloat(iMax) || 1000;
  const ttNum = parseFloat(twoTheta) || 28.44;
  const etaNum = Math.min(1, Math.max(0, parseFloat(eta) || 0.5));
  const betaNum = parseFloat(directBeta) || 0.28;

  let calculatedArea = 0;
  let calculatedBeta = 0;

  if (profileType === 'gaussian') {
    // Gaussian: Area = Imax * FWHM * sqrt(pi / (4 * ln 2)) ≈ 1.064467 * Imax * FWHM
    // Beta = Area / Imax = 1.064467 * FWHM
    calculatedBeta = 1.064467 * fwhmNum;
    calculatedArea = calculatedBeta * imaxNum;
  } else if (profileType === 'lorentzian') {
    // Lorentzian: Area = Imax * FWHM * (pi / 2) ≈ 1.570796 * Imax * FWHM
    // Beta = Area / Imax = 1.570796 * FWHM
    calculatedBeta = 1.570796 * fwhmNum;
    calculatedArea = calculatedBeta * imaxNum;
  } else if (profileType === 'voigt') {
    // Pseudo-Voigt: Beta = FWHM * [eta * (pi / 2) + (1 - eta) * sqrt(pi / (4 * ln 2))]
    const betaG = 1.064467 * fwhmNum;
    const betaL = 1.570796 * fwhmNum;
    calculatedBeta = etaNum * betaL + (1 - etaNum) * betaG;
    calculatedArea = calculatedBeta * imaxNum;
  } else {
    // Direct FWHM & Beta
    calculatedBeta = betaNum;
    calculatedArea = calculatedBeta * imaxNum;
  }

  const handleApply = () => {
    const hNum = h ? parseInt(h, 10) : undefined;
    const kNum = k ? parseInt(k, 10) : undefined;
    const lNum = l ? parseInt(l, 10) : undefined;
    onApplyCalculatedPeak(
      ttNum,
      parseFloat(calculatedArea.toFixed(2)),
      imaxNum,
      fwhmNum,
      hNum,
      kNum,
      lNum
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#050A14] border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Calculator className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Profile Shape to Area / I_max Calculator
              </h3>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                Convert FWHM and profile shape factors into exact integrated Area and I_max
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

        {/* Profile Function Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'voigt', label: 'Pseudo-Voigt', desc: 'Mixed η' },
            { id: 'gaussian', label: 'Gaussian', desc: 'η = 0' },
            { id: 'lorentzian', label: 'Lorentzian', desc: 'η = 1' },
            { id: 'fwhm_beta', label: 'Direct β', desc: 'Custom β' }
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setProfileType(m.id as any)}
              className={`p-2 rounded-xl border text-center transition-all ${
                profileType === m.id
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-inner'
                  : 'bg-[#0A101C] border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-bold">{m.label}</div>
              <div className="text-[9px] font-mono text-slate-500">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-3 bg-[#070D18] p-4 rounded-2xl border border-white/5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Bragg Angle 2θ (°)</label>
              <input 
                type="number" 
                step="0.01" 
                value={twoTheta}
                onChange={(e) => setTwoTheta(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Peak Max I_max (counts)</label>
              <input 
                type="number" 
                step="50" 
                value={iMax}
                onChange={(e) => setIMax(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-cyan-300 outline-none"
              />
            </div>
          </div>

          {profileType !== 'fwhm_beta' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">FWHM (° 2θ)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={fwhm}
                  onChange={(e) => setFwhm(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-amber-300 outline-none"
                />
              </div>
              {profileType === 'voigt' && (
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cauchy Fraction (η: 0=G, 1=L)</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    min="0"
                    max="1"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-purple-300 outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Observed Integral Breadth β (°)</label>
              <input 
                type="number" 
                step="0.01" 
                value={directBeta}
                onChange={(e) => setDirectBeta(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-emerald-300 outline-none"
              />
            </div>
          )}

          {/* Optional Miller Indices */}
          <div className="pt-2 border-t border-white/5">
            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Miller Indices (h k l)</label>
            <div className="grid grid-cols-3 gap-2">
              <input 
                type="number" 
                placeholder="h"
                value={h}
                onChange={(e) => setH(e.target.value)}
                className="px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 text-center outline-none"
              />
              <input 
                type="number" 
                placeholder="k"
                value={k}
                onChange={(e) => setK(e.target.value)}
                className="px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 text-center outline-none"
              />
              <input 
                type="number" 
                placeholder="l"
                value={l}
                onChange={(e) => setL(e.target.value)}
                className="px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 text-center outline-none"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results Preview */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Integrated Peak Area:</span>
            <span className="text-emerald-400 font-bold text-sm">{calculatedArea.toFixed(1)} a.u.</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Integral Breadth (β = Area / I_max):</span>
            <span className="text-cyan-300 font-bold">{calculatedBeta.toFixed(4)}° 2θ</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Profile Shape Factor (φ = FWHM / β):</span>
            <span className="text-purple-300 font-bold">{(fwhmNum / calculatedBeta).toFixed(3)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
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
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Add Peak to Dataset
          </button>
        </div>
      </motion.div>
    </div>
  );
};
