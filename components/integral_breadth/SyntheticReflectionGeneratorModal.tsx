import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Layers, 
  Sliders, 
  Check, 
  HelpCircle,
  Activity,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SyntheticReflectionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  wavelength: number;
  onGenerate: (dataString: string, materialName: string, density: number, youngsModulus: number) => void;
}

export const SyntheticReflectionGeneratorModal: React.FC<SyntheticReflectionGeneratorModalProps> = ({
  isOpen,
  onClose,
  wavelength,
  onGenerate
}) => {
  const [crystalSystem, setCrystalSystem] = useState<'cubic_fcc' | 'cubic_bcc' | 'diamond' | 'hexagonal'>('cubic_fcc');
  const [latticeA, setLatticeA] = useState<number>(4.08); // e.g. Gold ~4.08 A
  const [latticeC, setLatticeC] = useState<number>(5.20); // for hexagonal
  const [targetSizeNm, setTargetSizeNm] = useState<number>(25);
  const [targetStrainPercent, setTargetStrainPercent] = useState<number>(0.15); // 0.15%
  const [materialDensity, setMaterialDensity] = useState<number>(19.3);
  const [youngsModulus, setYoungsModulus] = useState<number>(78);
  const [materialTitle, setMaterialTitle] = useState<string>('Synthetic FCC Gold (Au)');

  if (!isOpen) return null;

  const handleSystemChange = (system: 'cubic_fcc' | 'cubic_bcc' | 'diamond' | 'hexagonal') => {
    setCrystalSystem(system);
    if (system === 'cubic_fcc') {
      setLatticeA(4.078);
      setMaterialDensity(19.3);
      setYoungsModulus(78);
      setMaterialTitle('Synthetic FCC Gold (Au)');
    } else if (system === 'cubic_bcc') {
      setLatticeA(2.866);
      setMaterialDensity(7.87);
      setYoungsModulus(211);
      setMaterialTitle('Synthetic BCC Iron (α-Fe)');
    } else if (system === 'diamond') {
      setLatticeA(5.431);
      setMaterialDensity(2.33);
      setYoungsModulus(130);
      setMaterialTitle('Synthetic Diamond-Cubic Silicon (Si)');
    } else if (system === 'hexagonal') {
      setLatticeA(3.25);
      setLatticeC(5.21);
      setMaterialDensity(5.61);
      setYoungsModulus(140);
      setMaterialTitle('Synthetic Hexagonal ZnO');
    }
  };

  const handleGenerate = () => {
    // Generate reflections based on crystal system and hkl selection rules
    let reflectionsList: { h: number; k: number; l: number; relativeI: number }[] = [];

    if (crystalSystem === 'cubic_fcc') {
      reflectionsList = [
        { h: 1, k: 1, l: 1, relativeI: 1000 },
        { h: 2, k: 0, l: 0, relativeI: 520 },
        { h: 2, k: 2, l: 0, relativeI: 320 },
        { h: 3, k: 1, l: 1, relativeI: 360 },
        { h: 2, k: 2, l: 2, relativeI: 120 },
        { h: 4, k: 0, l: 0, relativeI: 80 },
        { h: 3, k: 3, l: 1, relativeI: 190 },
        { h: 4, k: 2, l: 0, relativeI: 170 },
      ];
    } else if (crystalSystem === 'cubic_bcc') {
      reflectionsList = [
        { h: 1, k: 1, l: 0, relativeI: 1000 },
        { h: 2, k: 0, l: 0, relativeI: 200 },
        { h: 2, k: 1, l: 1, relativeI: 300 },
        { h: 2, k: 2, l: 0, relativeI: 100 },
        { h: 3, k: 1, l: 0, relativeI: 150 },
        { h: 2, k: 2, l: 2, relativeI: 40 },
      ];
    } else if (crystalSystem === 'diamond') {
      reflectionsList = [
        { h: 1, k: 1, l: 1, relativeI: 1000 },
        { h: 2, k: 2, l: 0, relativeI: 550 },
        { h: 3, k: 1, l: 1, relativeI: 300 },
        { h: 4, k: 0, l: 0, relativeI: 80 },
        { h: 3, k: 3, l: 1, relativeI: 120 },
        { h: 4, k: 2, l: 2, relativeI: 160 },
      ];
    } else {
      // Hexagonal
      reflectionsList = [
        { h: 1, k: 0, l: 0, relativeI: 600 },
        { h: 0, k: 0, l: 2, relativeI: 450 },
        { h: 1, k: 0, l: 1, relativeI: 1000 },
        { h: 1, k: 0, l: 2, relativeI: 280 },
        { h: 1, k: 1, l: 0, relativeI: 350 },
        { h: 1, k: 0, l: 3, relativeI: 250 },
        { h: 2, k: 0, l: 0, relativeI: 60 },
        { h: 1, k: 1, l: 2, relativeI: 220 },
      ];
    }

    const generatedRows: string[] = [];

    for (const ref of reflectionsList) {
      // Calculate d-spacing
      let d = 0;
      if (crystalSystem === 'hexagonal') {
        const invD2 = (4 / 3) * ((ref.h ** 2 + ref.h * ref.k + ref.k ** 2) / (latticeA ** 2)) + (ref.l ** 2) / (latticeC ** 2);
        d = 1 / Math.sqrt(invD2);
      } else {
        const hklSquareSum = ref.h ** 2 + ref.k ** 2 + ref.l ** 2;
        d = latticeA / Math.sqrt(hklSquareSum);
      }

      // Calculate Bragg angle 2theta: sin(theta) = lambda / (2*d)
      const sinTheta = wavelength / (2 * d);
      if (sinTheta >= 0.98) continue; // Bragg condition limit

      const thetaRad = Math.asin(sinTheta);
      const twoThetaDeg = (thetaRad * 2 * 180) / Math.PI;
      if (twoThetaDeg >= 120) continue;

      const cosTheta = Math.cos(thetaRad);
      const tanTheta = Math.tan(thetaRad);

      // Scherrer broadening in radians: beta_size = (K * lambda) / (D * cosTheta)
      const K = 1.0;
      const betaSizeRad = (K * wavelength * 1e-1) / (targetSizeNm * cosTheta); // lambda in A (10^-1 nm), D in nm
      
      // Strain broadening in radians: beta_strain = 4 * epsilon * tanTheta
      const epsilon = targetStrainPercent / 100.0;
      const betaStrainRad = 4.0 * epsilon * tanTheta;

      // Total Voigt/Integral Breadth in radians: approx parabolic or Voigt combination
      const betaTotalRad = Math.sqrt(betaSizeRad ** 2 + betaStrainRad ** 2);
      const betaTotalDeg = (betaTotalRad * 180) / Math.PI;

      // FWHM approximation (using pseudo-Voigt relation): FWHM ~ beta * shapeFactor phi
      // For size dominant, phi ~ 0.65. For strain dominant, phi ~ 0.90.
      const fractionStrain = betaStrainRad / (betaSizeRad + betaStrainRad + 1e-9);
      const phi = 0.64 + 0.29 * fractionStrain; // ranges from 0.64 to 0.93
      const fwhmDeg = betaTotalDeg * phi;

      const iMax = ref.relativeI;
      const area = betaTotalDeg * iMax;

      generatedRows.push(
        `${twoThetaDeg.toFixed(2)}, ${fwhmDeg.toFixed(3)}, ${area.toFixed(1)}, ${iMax.toFixed(0)}, ${ref.h} ${ref.k} ${ref.l}`
      );
    }

    if (generatedRows.length > 0) {
      onGenerate(generatedRows.join('\n'), materialTitle, materialDensity, youngsModulus);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#070D18] border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-200 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">Synthetic Reflection Generator</h3>
              <p className="text-[11px] text-slate-400">Generate ideal Bragg reflections with customized size & microstrain</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crystal Symmetry Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-purple-400" /> Crystal Symmetry & Lattice
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'cubic_fcc', label: 'FCC', desc: 'Au, Cu, Al, Ni' },
              { id: 'cubic_bcc', label: 'BCC', desc: 'Fe, Cr, W' },
              { id: 'diamond', label: 'Diamond', desc: 'Si, Ge, C' },
              { id: 'hexagonal', label: 'Hexagonal', desc: 'ZnO, Ti, Mg' }
            ].map((sys) => (
              <button
                key={sys.id}
                type="button"
                onClick={() => handleSystemChange(sys.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  crystalSystem === sys.id
                    ? 'bg-purple-600/25 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-[#0A101C] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                <div className="font-bold text-xs">{sys.label}</div>
                <div className="text-[9px] text-slate-500">{sys.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Lattice Parameters */}
        <div className="grid grid-cols-2 gap-3 bg-[#0A101C] p-3.5 rounded-2xl border border-white/5">
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Lattice constant a (Å)</label>
            <input
              type="number"
              step="0.001"
              value={latticeA}
              onChange={(e) => setLatticeA(parseFloat(e.target.value) || 4.0)}
              className="w-full px-3 py-1.5 bg-[#050A14] text-purple-300 border border-white/10 rounded-xl font-mono text-xs focus:border-purple-500/50 outline-none"
            />
          </div>
          {crystalSystem === 'hexagonal' ? (
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Lattice constant c (Å)</label>
              <input
                type="number"
                step="0.001"
                value={latticeC}
                onChange={(e) => setLatticeC(parseFloat(e.target.value) || 5.2)}
                className="w-full px-3 py-1.5 bg-[#050A14] text-purple-300 border border-white/10 rounded-xl font-mono text-xs focus:border-purple-500/50 outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Material Density (g/cm³)</label>
              <input
                type="number"
                step="0.01"
                value={materialDensity}
                onChange={(e) => setMaterialDensity(parseFloat(e.target.value) || 2.33)}
                className="w-full px-3 py-1.5 bg-[#050A14] text-purple-300 border border-white/10 rounded-xl font-mono text-xs focus:border-purple-500/50 outline-none"
              />
            </div>
          )}
        </div>

        {/* Target Microstructural Properties */}
        <div className="space-y-3 bg-[#0A101C] p-3.5 rounded-2xl border border-white/5">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-pink-400" /> Target Microstructural Properties
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Crystallite Size (Dv)</span>
                <span className="text-pink-400 font-bold">{targetSizeNm} nm</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={targetSizeNm}
                onChange={(e) => setTargetSizeNm(parseFloat(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Microstrain (ε)</span>
                <span className="text-cyan-400 font-bold">{targetStrainPercent.toFixed(2)} %</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={targetStrainPercent}
                onChange={(e) => setTargetStrainPercent(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate & Load Dataset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
