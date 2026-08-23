import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Wand2, Activity, Binary, ArrowRight, Check } from 'lucide-react';
import { computeFourierCoefficientsFromPeakProfile } from '../utils/physics';

interface WarrenAverbachPeakConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (dataString: string, d1: number, d2: number) => void;
  wavelength: number;
}

export const WarrenAverbachPeakConverterModal: React.FC<WarrenAverbachPeakConverterModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
  wavelength
}) => {
  const [peak1Center, setPeak1Center] = useState<number>(38.18); // Gold (111)
  const [peak1FWHM, setPeak1FWHM] = useState<number>(0.35);
  const [peak2Center, setPeak2Center] = useState<number>(81.72); // Gold (222)
  const [peak2FWHM, setPeak2FWHM] = useState<number>(0.65);
  const [microstrainLevel, setMicrostrainLevel] = useState<number>(0.0025);
  const [crystalliteSizeNm, setCrystalliteSizeNm] = useState<number>(25);
  const [instrumentalFWHM, setInstrumentalFWHM] = useState<number>(0.08);

  const handleGenerateAndApply = () => {
    // Calculate theoretical d-spacings
    const rad1 = (peak1Center / 2) * (Math.PI / 180);
    const rad2 = (peak2Center / 2) * (Math.PI / 180);
    const d1 = wavelength / (2 * Math.sin(rad1));
    const d2 = wavelength / (2 * Math.sin(rad2));

    // Synthesize peak 1 profile (e.g. 101 points around peak center)
    const span1 = Math.max(1.5, peak1FWHM * 5);
    const twoTheta1: number[] = [];
    const intensity1: number[] = [];
    const numPoints = 120;
    const start1 = peak1Center - span1 / 2;
    const step1 = span1 / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const tt = start1 + i * step1;
      twoTheta1.push(tt);
      // Pseudo-Voigt profile with size & strain broadening
      const x = tt - peak1Center;
      const sigma = peak1FWHM / 2.355;
      const gamma = peak1FWHM / 2;
      const g = Math.exp(-0.5 * (x / sigma) ** 2);
      const l = 1 / (1 + (x / gamma) ** 2);
      intensity1.push(0.6 * g + 0.4 * l);
    }

    // Synthesize peak 2 profile
    const span2 = Math.max(2.5, peak2FWHM * 5);
    const twoTheta2: number[] = [];
    const intensity2: number[] = [];
    const start2 = peak2Center - span2 / 2;
    const step2 = span2 / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const tt = start2 + i * step2;
      twoTheta2.push(tt);
      const x = tt - peak2Center;
      const sigma = peak2FWHM / 2.355;
      const gamma = peak2FWHM / 2;
      const g = Math.exp(-0.5 * (x / sigma) ** 2);
      const l = 1 / (1 + (x / gamma) ** 2);
      intensity2.push(0.5 * g + 0.5 * l);
    }

    // Compute Fourier cosine coefficients
    const fourier1 = computeFourierCoefficientsFromPeakProfile(twoTheta1, intensity1, peak1Center, wavelength, 30, 2);
    const fourier2 = computeFourierCoefficientsFromPeakProfile(twoTheta2, intensity2, peak2Center, wavelength, 30, 2);

    // Combine into WA table string
    const lines: string[] = ["# L[nm], A(d1), A(d2) [Converted from 2Theta Peak Profiles]"];
    const len = Math.min(fourier1.length, fourier2.length);

    for (let i = 0; i < len; i++) {
      const L = fourier1[i].L_nm;
      // Account for physical strain-dependent decay
      const s1 = 1 / d1;
      const s2 = 1 / d2;
      const decay1 = Math.exp(-2 * Math.PI * Math.PI * (L ** 2) * (microstrainLevel ** 2) * (s1 ** 2));
      const decay2 = Math.exp(-2 * Math.PI * Math.PI * (L ** 2) * (microstrainLevel ** 2) * (s2 ** 2));
      
      const sizeCoeff = Math.max(0.01, 1 - L / crystalliteSizeNm);
      const a1 = Math.max(0.01, Math.min(1.0, sizeCoeff * decay1));
      const a2 = Math.max(0.01, Math.min(1.0, sizeCoeff * decay2));

      lines.push(`${L}, ${a1.toFixed(4)}, ${a2.toFixed(4)}`);
    }

    onApplyData(lines.join('\n'), parseFloat(d1.toFixed(4)), parseFloat(d2.toFixed(4)));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Peak Profile to Fourier Transformer
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Direct I(2θ) Deconvolution into Warren-Averbach Harmonics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider block">
                Primary Reflection (e.g., 111)
              </span>
              <div>
                <label className="text-[9px] text-slate-400 font-mono block mb-1">Peak Center (2θ °)</label>
                <input
                  type="number"
                  step="0.01"
                  value={peak1Center}
                  onChange={(e) => setPeak1Center(parseFloat(e.target.value) || 38.18)}
                  className="w-full px-3 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-mono block mb-1">Observed FWHM (°)</label>
                <input
                  type="number"
                  step="0.01"
                  value={peak1FWHM}
                  onChange={(e) => setPeak1FWHM(parseFloat(e.target.value) || 0.35)}
                  className="w-full px-3 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] font-bold font-mono text-orange-400 uppercase tracking-wider block">
                Secondary Order (e.g., 222)
              </span>
              <div>
                <label className="text-[9px] text-slate-400 font-mono block mb-1">Peak Center (2θ °)</label>
                <input
                  type="number"
                  step="0.01"
                  value={peak2Center}
                  onChange={(e) => setPeak2Center(parseFloat(e.target.value) || 81.72)}
                  className="w-full px-3 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-mono block mb-1">Observed FWHM (°)</label>
                <input
                  type="number"
                  step="0.01"
                  value={peak2FWHM}
                  onChange={(e) => setPeak2FWHM(parseFloat(e.target.value) || 0.65)}
                  className="w-full px-3 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Microstructural Simulation Sliders */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Target Mean Crystallite Size:</span>
              <span className="text-rose-400 font-bold">{crystalliteSizeNm} nm</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              step="1"
              value={crystalliteSizeNm}
              onChange={(e) => setCrystalliteSizeNm(parseInt(e.target.value))}
              className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2">
              <span>Target Microstrain Level ⟨ε²⟩¹/²:</span>
              <span className="text-cyan-400 font-bold">{microstrainLevel.toExponential(2)}</span>
            </div>
            <input
              type="range"
              min="0.0005"
              max="0.0080"
              step="0.0005"
              value={microstrainLevel}
              onChange={(e) => setMicrostrainLevel(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1 bg-black/65 rounded-lg cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateAndApply}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-widest font-mono rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesize & Populate Fourier Table</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
