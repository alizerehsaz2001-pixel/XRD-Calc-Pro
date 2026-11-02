import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Wand2, Activity, Layers, Sliders } from 'lucide-react';
import { synthesizeWAHarmonicsFromPeaks } from '../utils/physics';

interface WarrenAverbachPeakConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (dataString: string, d1: number, d2: number, d3?: number) => void;
  wavelength: number;
}

const PEAK_HARMONIC_PRESETS = [
  {
    name: 'Au (111)/(222)/(333) Nanocrystals',
    p1Center: 38.18, p1FWHM: 0.42, p1Eta: 0.62,
    p2Center: 81.72, p2FWHM: 0.78, p2Eta: 0.45,
    include3: true, p3Center: 135.45, p3FWHM: 1.48, p3Eta: 0.35,
    instFWHM: 0.06
  },
  {
    name: 'Cu ECAP Deformed (111)/(222)',
    p1Center: 43.30, p1FWHM: 0.58, p1Eta: 0.55,
    p2Center: 95.14, p2FWHM: 1.32, p2Eta: 0.32,
    include3: false, p3Center: 145.0, p3FWHM: 2.1, p3Eta: 0.25,
    instFWHM: 0.07
  },
  {
    name: 'Si SRM-640 Low-Strain (111)/(222)',
    p1Center: 28.44, p1FWHM: 0.16, p1Eta: 0.72,
    p2Center: 58.86, p2FWHM: 0.24, p2Eta: 0.65,
    include3: true, p3Center: 94.95, p3FWHM: 0.38, p3Eta: 0.58,
    instFWHM: 0.05
  },
  {
    name: 'α-Fe BCC Cold-Rolled (110)/(220)',
    p1Center: 44.67, p1FWHM: 0.52, p1Eta: 0.50,
    p2Center: 98.94, p2FWHM: 1.25, p2Eta: 0.30,
    include3: false, p3Center: 140.0, p3FWHM: 1.9, p3Eta: 0.25,
    instFWHM: 0.06
  },
  {
    name: 'CeO₂ Fluorite Catalyst (111)/(222)',
    p1Center: 28.55, p1FWHM: 0.64, p1Eta: 0.68,
    p2Center: 59.08, p2FWHM: 1.02, p2Eta: 0.52,
    include3: false, p3Center: 95.3, p3FWHM: 1.65, p3Eta: 0.40,
    instFWHM: 0.06
  }
];

export const WarrenAverbachPeakConverterModal: React.FC<WarrenAverbachPeakConverterModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
  wavelength
}) => {
  const [peak1Center, setPeak1Center] = useState<number>(38.18); // Gold (111)
  const [peak1FWHM, setPeak1FWHM] = useState<number>(0.42);
  const [peak1Eta, setPeak1Eta] = useState<number>(0.62);

  const [peak2Center, setPeak2Center] = useState<number>(81.72); // Gold (222)
  const [peak2FWHM, setPeak2FWHM] = useState<number>(0.78);
  const [peak2Eta, setPeak2Eta] = useState<number>(0.45);

  const [includeThirdOrder, setIncludeThirdOrder] = useState<boolean>(true);
  const [peak3Center, setPeak3Center] = useState<number>(135.45); // Gold (333)
  const [peak3FWHM, setPeak3FWHM] = useState<number>(1.48);
  const [peak3Eta, setPeak3Eta] = useState<number>(0.35);

  const [instrumentalFWHM, setInstrumentalFWHM] = useState<number>(0.06);
  const [simulateHookStrength, setSimulateHookStrength] = useState<number>(0);

  const synthesisPreview = useMemo(() => {
    const peaks = [
      { order: 1, twoTheta: peak1Center, fwhmObs: peak1FWHM, etaObs: peak1Eta },
      { order: 2, twoTheta: peak2Center, fwhmObs: peak2FWHM, etaObs: peak2Eta }
    ];
    if (includeThirdOrder && peak3Center > 5 && peak3Center < 175) {
      peaks.push({ order: 3, twoTheta: peak3Center, fwhmObs: peak3FWHM, etaObs: peak3Eta });
    }
    return synthesizeWAHarmonicsFromPeaks({
      peaks,
      fwhmInst: instrumentalFWHM,
      wavelength: wavelength > 0 ? wavelength : 1.5406,
      simulateHookStrength
    });
  }, [
    peak1Center, peak1FWHM, peak1Eta,
    peak2Center, peak2FWHM, peak2Eta,
    includeThirdOrder, peak3Center, peak3FWHM, peak3Eta,
    instrumentalFWHM, wavelength, simulateHookStrength
  ]);

  const handleGenerateAndApply = () => {
    onApplyData(
      synthesisPreview.dataString,
      synthesisPreview.d1,
      synthesisPreview.d2,
      synthesisPreview.d3
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[92vh]"
      >
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Bragg Peak Profile → Fourier Harmonics Synthesizer
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Exact Voigt / Stokes Deconvolution from 2θ, FWHM, and Pseudo-Voigt η
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

        {/* 1-Click Harmonic Peak Pair Presets */}
        <div className="mb-4 space-y-1.5">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
            1-Click Harmonic Reflection Pair Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PEAK_HARMONIC_PRESETS.map((pr) => (
              <button
                key={pr.name}
                type="button"
                onClick={() => {
                  setPeak1Center(pr.p1Center);
                  setPeak1FWHM(pr.p1FWHM);
                  setPeak1Eta(pr.p1Eta);
                  setPeak2Center(pr.p2Center);
                  setPeak2FWHM(pr.p2FWHM);
                  setPeak2Eta(pr.p2Eta);
                  setIncludeThirdOrder(pr.include3);
                  setPeak3Center(pr.p3Center);
                  setPeak3FWHM(pr.p3FWHM);
                  setPeak3Eta(pr.p3Eta);
                  setInstrumentalFWHM(pr.instFWHM);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 rounded-lg text-[10px] font-mono transition-all"
              >
                {pr.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Order 1 */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider">
                  Order 1 Reflection (e.g., 111)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  d₁ = {synthesisPreview.d1.toFixed(4)} Å
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">Peak 2θ₁ (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={peak1Center}
                    onChange={(e) => setPeak1Center(parseFloat(e.target.value) || 38.18)}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">FWHM₁ (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={peak1FWHM}
                    onChange={(e) => setPeak1FWHM(Math.max(0.02, parseFloat(e.target.value) || 0.35))}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-rose-300 border border-white/10 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                  <span>Lorentzian Mixing η₁:</span>
                  <span className="text-rose-400 font-bold">{(peak1Eta * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={peak1Eta}
                  onChange={(e) => setPeak1Eta(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 h-1 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Order 2 */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-orange-400 uppercase tracking-wider">
                  Order 2 Harmonic (e.g., 222)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  d₂ = {synthesisPreview.d2.toFixed(4)} Å
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">Peak 2θ₂ (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={peak2Center}
                    onChange={(e) => setPeak2Center(parseFloat(e.target.value) || 81.72)}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">FWHM₂ (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={peak2FWHM}
                    onChange={(e) => setPeak2FWHM(Math.max(0.02, parseFloat(e.target.value) || 0.65))}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-orange-300 border border-white/10 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                  <span>Lorentzian Mixing η₂:</span>
                  <span className="text-orange-400 font-bold">{(peak2Eta * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={peak2Eta}
                  onChange={(e) => setPeak2Eta(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Optional Third Harmonic Reflection Order */}
          <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-wider">
                Third Harmonic Order (e.g., 333) {synthesisPreview.d3 ? `· d₃ = ${synthesisPreview.d3.toFixed(4)} Å` : ''}
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-slate-400">
                <input
                  type="checkbox"
                  checked={includeThirdOrder}
                  onChange={(e) => setIncludeThirdOrder(e.target.checked)}
                  className="rounded border-white/20 bg-black/60 text-rose-500 focus:ring-0"
                />
                <span>Include 3rd Harmonic</span>
              </label>
            </div>
            {includeThirdOrder && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">Peak 2θ₃ (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={peak3Center}
                    onChange={(e) => setPeak3Center(parseFloat(e.target.value) || 135.45)}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">FWHM₃ (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={peak3FWHM}
                    onChange={(e) => setPeak3FWHM(Math.max(0.02, parseFloat(e.target.value) || 1.25))}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-purple-300 border border-white/10 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-1">Mixing η₃</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.95"
                    value={peak3Eta}
                    onChange={(e) => setPeak3Eta(Math.max(0.05, Math.min(0.95, parseFloat(e.target.value) || 0.35)))}
                    className="w-full px-2.5 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instrumental Resolution & Optional Hook Artifact Simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/40 rounded-2xl border border-white/5">
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                <span>Instrumental Standard FWHM:</span>
                <span className="text-emerald-400 font-bold">{instrumentalFWHM.toFixed(3)}°</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.005"
                value={instrumentalFWHM}
                onChange={(e) => setInstrumentalFWHM(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-black/65 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                <span>Simulate Low-L Hook Effect:</span>
                <span className="text-amber-400 font-bold">{(simulateHookStrength * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.14"
                step="0.02"
                value={simulateHookStrength}
                onChange={(e) => setSimulateHookStrength(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-black/65 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Live Stokes Deconvolution Preview Banner */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-indigo-500/20 grid grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Scherrer Apparent Size</span>
              <span className="text-amber-400 font-bold">{synthesisPreview.apparentScherrerSizeNm.toFixed(1)} nm</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Williamson-Hall Size</span>
              <span className="text-emerald-400 font-bold">{synthesisPreview.williamsonHallSizeNm.toFixed(1)} nm</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Estimated Microstrain</span>
              <span className="text-cyan-400 font-bold">{(synthesisPreview.williamsonHallStrain * 100).toFixed(3)}%</span>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={handleGenerateAndApply}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-widest font-mono rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Deconvolve Peaks & Load Fourier Harmonics</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
