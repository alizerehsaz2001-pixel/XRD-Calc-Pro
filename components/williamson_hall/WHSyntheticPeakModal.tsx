import React, { useState, useMemo } from 'react';
import { X, Sparkles, Sliders, Layers, Check, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface WHSyntheticPeakModalProps {
  wavelength: number;
  constantK: number;
  instFwhm: number;
  onApply: (formattedData: string, systemName: string, youngsModulus?: number, density?: number) => void;
  onClose: () => void;
}

interface CrystalPreset {
  name: string;
  system: 'FCC' | 'BCC' | 'Diamond' | 'Hexagonal';
  a: number; // Angstroms
  c?: number; // for hexagonal
  youngsModulus?: number; // GPa
  density?: number; // g/cm³
  allowedPlanes: Array<{ h: number; k: number; l: number }>;
}

const CRYSTAL_PRESETS: CrystalPreset[] = [
  {
    name: 'Silicon (Diamond Cubic)',
    system: 'Diamond',
    a: 5.4309,
    youngsModulus: 130,
    density: 2.33,
    allowedPlanes: [
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 1 },
      { h: 4, k: 0, l: 0 },
      { h: 3, k: 3, l: 1 },
      { h: 4, k: 2, l: 2 }
    ]
  },
  {
    name: 'Copper / Nickel (FCC)',
    system: 'FCC',
    a: 3.615,
    youngsModulus: 120,
    density: 8.96,
    allowedPlanes: [
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 1 },
      { h: 2, k: 2, l: 2 },
      { h: 4, k: 0, l: 0 }
    ]
  },
  {
    name: 'Ferritic Steel / Iron (BCC)',
    system: 'BCC',
    a: 2.866,
    youngsModulus: 200,
    density: 7.87,
    allowedPlanes: [
      { h: 1, k: 1, l: 0 },
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 1, l: 1 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 0 },
      { h: 2, k: 2, l: 2 }
    ]
  },
  {
    name: 'Zinc Oxide ZnO (Wurtzite Hexagonal)',
    system: 'Hexagonal',
    a: 3.249,
    c: 5.206,
    youngsModulus: 140,
    density: 5.61,
    allowedPlanes: [
      { h: 1, k: 0, l: 0 },
      { h: 0, k: 0, l: 2 },
      { h: 1, k: 0, l: 1 },
      { h: 1, k: 0, l: 2 },
      { h: 1, k: 1, l: 0 },
      { h: 1, k: 0, l: 3 },
      { h: 1, k: 1, l: 2 }
    ]
  },
  {
    name: 'Anatase TiO2 (Tetragonal)',
    system: 'Hexagonal', // generalized multi-axis
    a: 3.784,
    c: 9.514,
    youngsModulus: 230,
    density: 3.89,
    allowedPlanes: [
      { h: 1, k: 0, l: 1 },
      { h: 0, k: 0, l: 4 },
      { h: 2, k: 0, l: 0 },
      { h: 1, k: 0, l: 5 },
      { h: 2, k: 1, l: 1 },
      { h: 2, k: 0, l: 4 }
    ]
  },
  {
    name: 'Gold Au / Platinum (FCC Heavy Metal)',
    system: 'FCC',
    a: 4.078,
    youngsModulus: 78,
    density: 19.3,
    allowedPlanes: [
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 1 },
      { h: 2, k: 2, l: 2 },
      { h: 4, k: 0, l: 0 }
    ]
  }
];

export const WHSyntheticPeakModal: React.FC<WHSyntheticPeakModalProps> = ({
  wavelength,
  constantK,
  instFwhm,
  onApply,
  onClose
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [targetSizeNm, setTargetSizeNm] = useState<number>(25.0);
  const [targetMicrostrainPercent, setTargetMicrostrainPercent] = useState<number>(0.25);
  const [instrumentalBroadeningDeg, setInstrumentalBroadeningDeg] = useState<number>(instFwhm || 0.08);
  const [addNoise, setAddNoise] = useState<boolean>(true);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.008); // degrees FWHM jitter

  const currentPreset = CRYSTAL_PRESETS[selectedPresetIndex];

  // Generate simulated peaks based on Bragg diffraction and Williamson-Hall equation:
  // beta_size = (K * lambda) / (D * cos(theta))  [in radians]
  // beta_strain = 4 * epsilon * tan(theta)       [in radians]
  // beta_sample = sqrt(beta_size^2 + beta_strain^2) or sum
  // beta_obs = sqrt(beta_sample^2 + beta_inst^2) [Gaussian deconvolution assumption]
  const generatedData = useMemo(() => {
    const { a, c, system, allowedPlanes } = currentPreset;
    const radToDeg = 180 / Math.PI;
    const eps = targetMicrostrainPercent / 100;
    const D = targetSizeNm; // in nm

    const rows: Array<{
      twoTheta: number;
      fwhmObs: number;
      betaSample: number;
      dSpacing: number;
      h: number;
      k: number;
      l: number;
      hklStr: string;
      valid: boolean;
    }> = [];

    for (const plane of allowedPlanes) {
      const { h, k, l } = plane;
      let dSpacing = 0;

      if (system === 'Hexagonal' && c) {
        // Hexagonal / Tetragonal formula
        const invD2 = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
        if (invD2 > 0) dSpacing = 1 / Math.sqrt(invD2);
      } else {
        // Cubic systems
        const sumSq = h * h + k * k + l * l;
        if (sumSq > 0) dSpacing = a / Math.sqrt(sumSq);
      }

      if (dSpacing <= 0) continue;

      // Bragg Law: lambda = 2 * d * sin(theta) -> sin(theta) = lambda / (2 * d)
      const sinTheta = wavelength / (2 * dSpacing);
      if (sinTheta >= 0.999 || sinTheta <= 0) continue; // Out of reachable angular range

      const thetaRad = Math.asin(sinTheta);
      const thetaDeg = thetaRad * radToDeg;
      const twoThetaDeg = thetaDeg * 2;

      // Calculate Physical Line Broadenings in radians
      // Size broadening: beta_L = (K * lambda) / (D * cos(theta))
      // Note: lambda is in Angstroms, D is in nm, so convert D to Angstroms: D_A = D * 10
      const dAngstroms = D * 10;
      const betaSizeRad = (constantK * wavelength) / (dAngstroms * Math.cos(thetaRad));
      
      // Strain broadening: beta_G = 4 * epsilon * tan(theta)
      const betaStrainRad = 4 * eps * Math.tan(thetaRad);

      // Total sample line broadening in radians (Gaussian approximation)
      const betaSampleRad = Math.sqrt(Math.pow(betaSizeRad, 2) + Math.pow(betaStrainRad, 2));
      const betaSampleDeg = betaSampleRad * radToDeg;

      // Add instrumental contribution
      const betaInstDeg = Math.max(0, instrumentalBroadeningDeg);
      let fwhmObsDeg = Math.sqrt(Math.pow(betaSampleDeg, 2) + Math.pow(betaInstDeg, 2));

      // Optional experimental noise jitter
      if (addNoise) {
        const jitter = (Math.sin(twoThetaDeg * 12.34) * 0.5 + (h + k + l) * 0.1) * noiseLevel;
        fwhmObsDeg = Math.max(0.05, fwhmObsDeg + jitter);
      }

      rows.push({
        twoTheta: parseFloat(twoThetaDeg.toFixed(3)),
        fwhmObs: parseFloat(fwhmObsDeg.toFixed(4)),
        betaSample: parseFloat(betaSampleDeg.toFixed(4)),
        dSpacing: parseFloat(dSpacing.toFixed(4)),
        h,
        k,
        l,
        hklStr: `${h} ${k} ${l}`,
        valid: true
      });
    }

    return rows;
  }, [currentPreset, targetSizeNm, targetMicrostrainPercent, instrumentalBroadeningDeg, wavelength, constantK, addNoise, noiseLevel]);

  const outputString = useMemo(() => {
    return generatedData
      .map(r => `${r.twoTheta.toFixed(3)}, ${r.fwhmObs.toFixed(4)}, ${r.h}, ${r.k}, ${r.l}`)
      .join('\n');
  }, [generatedData]);

  const handleApplyClick = () => {
    onApply(
      outputString,
      currentPreset.name,
      currentPreset.youngsModulus,
      currentPreset.density
    );
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
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Synthetic Crystallite Peak Generator
              </h3>
              <p className="text-[10px] text-cyan-400/80 font-mono">
                Simulate ideal diffraction peaks with controlled domain size D and lattice microstrain ε
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
          {/* Preset Selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Select Crystal System & Material
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CRYSTAL_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedPresetIndex(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPresetIndex === idx
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                      : 'bg-[#070D18] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="text-[10px] font-black truncate">{preset.name.split(' (')[0]}</p>
                  <p className="text-[8px] font-mono text-slate-500 mt-0.5">
                    {preset.system} • a={preset.a} Å
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Parameters Sliders */}
          <div className="bg-[#070D18] p-4 rounded-2xl border border-white/10 space-y-3.5">
            {/* Target Size Slider */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  Target Crystallite Size (D)
                </span>
                <span className="text-emerald-300 font-mono">{targetSizeNm.toFixed(1)} nm</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="1"
                value={targetSizeNm}
                onChange={(e) => setTargetSizeNm(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-black/40 rounded-lg h-2"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                <span>5 nm (High broadening)</span>
                <span>50 nm</span>
                <span>150 nm (Sharp peaks)</span>
              </div>
            </div>

            {/* Target Microstrain Slider */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Target Lattice Microstrain (ε)
                </span>
                <span className="text-cyan-300 font-mono">{targetMicrostrainPercent.toFixed(3)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.01"
                value={targetMicrostrainPercent}
                onChange={(e) => setTargetMicrostrainPercent(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-black/40 rounded-lg h-2"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                <span>0.00% (Strain-free)</span>
                <span>0.50%</span>
                <span>1.50% (High dislocation)</span>
              </div>
            </div>

            {/* Instrumental Broadening & Noise */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">
                  Instrumental Broadening (β_inst)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={instrumentalBroadeningDeg}
                    onChange={(e) => setInstrumentalBroadeningDeg(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-xs font-mono"
                  />
                  <span className="text-[9px] font-mono text-slate-500">deg</span>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[9px] font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={addNoise}
                    onChange={(e) => setAddNoise(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Add Experimental Jitter</span>
                </label>
              </div>
            </div>
          </div>

          {/* Generated Reflections Preview Table */}
          <div className="bg-[#070D18] p-3 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Simulated Reflections ({generatedData.length} Peaks)
              </span>
              <span className="text-[9px] font-mono text-cyan-400">
                λ = {wavelength} Å
              </span>
            </div>

            <div className="overflow-x-auto max-h-36 custom-scrollbar rounded-xl border border-white/5">
              <table className="w-full text-left font-mono text-[9px]">
                <thead>
                  <tr className="bg-black/60 text-slate-400 uppercase border-b border-white/10 font-bold">
                    <th className="py-1.5 px-2">2θ (deg)</th>
                    <th className="py-1.5 px-2">FWHM_obs</th>
                    <th className="py-1.5 px-2">β_sample</th>
                    <th className="py-1.5 px-2">(h k l)</th>
                    <th className="py-1.5 px-2">d (Å)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {generatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-1.5 px-2 font-bold text-cyan-300">{row.twoTheta.toFixed(2)}°</td>
                      <td className="py-1.5 px-2 text-slate-300">{row.fwhmObs.toFixed(3)}°</td>
                      <td className="py-1.5 px-2 text-emerald-400">{row.betaSample.toFixed(3)}°</td>
                      <td className="py-1.5 px-2 text-purple-300 font-bold">({row.hklStr})</td>
                      <td className="py-1.5 px-2 text-slate-400">{row.dSpacing.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
            onClick={handleApplyClick}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Williamson-Hall</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
