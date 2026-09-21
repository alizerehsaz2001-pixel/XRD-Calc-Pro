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
  Compass,
  Atom
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IBAdvancedSyntheticModalProps {
  isOpen: boolean;
  onClose: () => void;
  wavelength: number;
  onGenerate: (dataString: string, materialName: string, density: number, youngsModulus: number) => void;
}

export const IBAdvancedSyntheticModal: React.FC<IBAdvancedSyntheticModalProps> = ({
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
  const [baseImax, setBaseImax] = useState<number>(1000);

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
      setMaterialTitle('Synthetic Diamond Silicon (Si)');
    } else if (system === 'hexagonal') {
      setLatticeA(3.25);
      setLatticeC(5.21);
      setMaterialDensity(5.61);
      setYoungsModulus(140);
      setMaterialTitle('Synthetic Hexagonal Zinc Oxide (ZnO)');
    }
  };

  const handleGenerate = () => {
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
        { h: 4, k: 2, l: 0, relativeI: 170 }
      ];
    } else if (crystalSystem === 'cubic_bcc') {
      reflectionsList = [
        { h: 1, k: 1, l: 0, relativeI: 1000 },
        { h: 2, k: 0, l: 0, relativeI: 200 },
        { h: 2, k: 1, l: 1, relativeI: 300 },
        { h: 2, k: 2, l: 0, relativeI: 100 },
        { h: 3, k: 1, l: 0, relativeI: 150 },
        { h: 2, k: 2, l: 2, relativeI: 40 }
      ];
    } else if (crystalSystem === 'diamond') {
      reflectionsList = [
        { h: 1, k: 1, l: 1, relativeI: 1000 },
        { h: 2, k: 2, l: 0, relativeI: 550 },
        { h: 3, k: 1, l: 1, relativeI: 300 },
        { h: 4, k: 0, l: 0, relativeI: 80 },
        { h: 3, k: 3, l: 1, relativeI: 120 },
        { h: 4, k: 2, l: 2, relativeI: 160 }
      ];
    } else {
      // Hexagonal
      reflectionsList = [
        { h: 1, k: 0, l: 0, relativeI: 570 },
        { h: 0, k: 0, l: 2, relativeI: 440 },
        { h: 1, k: 0, l: 1, relativeI: 1000 },
        { h: 1, k: 0, l: 2, relativeI: 230 },
        { h: 1, k: 1, l: 0, relativeI: 320 },
        { h: 1, k: 0, l: 3, relativeI: 290 },
        { h: 2, k: 0, l: 0, relativeI: 40 },
        { h: 1, k: 1, l: 2, relativeI: 230 },
        { h: 2, k: 0, l: 1, relativeI: 110 }
      ];
    }

    const rows: string[] = [];

    reflectionsList.forEach(ref => {
      let d = 0;
      if (crystalSystem === 'hexagonal') {
        const invD2 = (4/3) * ((ref.h*ref.h + ref.h*ref.k + ref.k*ref.k) / (latticeA * latticeA)) + (ref.l*ref.l) / (latticeC * latticeC);
        d = 1 / Math.sqrt(invD2);
      } else {
        const s2 = ref.h*ref.h + ref.k*ref.k + ref.l*ref.l;
        d = latticeA / Math.sqrt(s2);
      }

      const sinTheta = wavelength / (2 * d);
      if (sinTheta <= 0 || sinTheta >= 0.999) return;

      const thetaRad = Math.asin(sinTheta);
      const twoThetaDeg = (2 * thetaRad) * (180 / Math.PI);
      if (twoThetaDeg < 10 || twoThetaDeg > 150) return;

      const cosTheta = Math.cos(thetaRad);
      const tanTheta = Math.tan(thetaRad);

      // Scherrer size broadening: beta_size (rad) = K * lambda / (D * cosTheta)
      const betaSizeRad = (1.0 * (wavelength * 1e-10)) / ((targetSizeNm * 1e-9) * cosTheta);

      // Microstrain broadening: beta_strain (rad) = 4 * epsilon * tanTheta
      const eps = targetStrainPercent / 100;
      const betaStrainRad = 4 * eps * tanTheta;

      // Voigt-like integral breadth combining Cauchy size + Gaussian strain
      const betaTotalRad = Math.sqrt(betaSizeRad * betaSizeRad + betaStrainRad * betaStrainRad);
      const betaTotalDeg = betaTotalRad * (180 / Math.PI);

      // Calculate peak Area & Imax: Area = betaTotalDeg * Imax
      const peakImax = Math.round((ref.relativeI / 1000) * baseImax);
      const peakArea = parseFloat((betaTotalDeg * peakImax).toFixed(1));

      rows.push(`${twoThetaDeg.toFixed(2)}, ${peakArea}, ${peakImax}, ${ref.h} ${ref.k} ${ref.l}`);
    });

    onGenerate(rows.join('\n'), materialTitle, materialDensity, youngsModulus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#050A14] border border-pink-500/30 rounded-3xl p-6 max-w-xl w-full shadow-[0_0_50px_rgba(244,114,182,0.15)] space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-pink-400">
              <Atom className="w-5 h-5 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Synthetic IB Peak Generator
              </h3>
              <p className="text-[10px] text-pink-400/80 font-mono">
                Generate ideal diffraction reflections (2θ, Area, I_max, h k l) from microstructural models
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

        {/* Crystal Symmetry Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-pink-400" />
            Crystal Lattice Archetype
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'cubic_fcc', label: 'FCC Cubic', sub: 'Au / Cu / Al' },
              { id: 'cubic_bcc', label: 'BCC Cubic', sub: 'α-Fe / Cr / W' },
              { id: 'diamond', label: 'Diamond', sub: 'Si / Ge / C' },
              { id: 'hexagonal', label: 'Hexagonal', sub: 'ZnO / Mg / Ti' },
            ].map(sys => (
              <button
                key={sys.id}
                type="button"
                onClick={() => handleSystemChange(sys.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  crystalSystem === sys.id 
                    ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.2)]' 
                    : 'bg-[#0A101C] border-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold">{sys.label}</div>
                <div className="text-[9px] font-mono text-slate-500">{sys.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Microstructural Parameters */}
        <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Target Crystallite Size (D)</span>
            <span className="text-xs font-mono font-black text-emerald-400">{targetSizeNm} nm</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="120" 
            step="1"
            value={targetSizeNm}
            onChange={(e) => setTargetSizeNm(parseInt(e.target.value) || 25)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs font-bold text-slate-300">Target Microstrain (ε)</span>
            <span className="text-xs font-mono font-black text-cyan-400">{targetStrainPercent.toFixed(3)} % ({(targetStrainPercent * 10).toFixed(2)} × 10⁻³)</span>
          </div>
          <input 
            type="range" 
            min="0.0" 
            max="0.8" 
            step="0.01"
            value={targetStrainPercent}
            onChange={(e) => setTargetStrainPercent(parseFloat(e.target.value) || 0)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Lattice a (Å)</label>
              <input 
                type="number" 
                step="0.001" 
                value={latticeA}
                onChange={(e) => setLatticeA(parseFloat(e.target.value) || 4.0)}
                className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 outline-none"
              />
            </div>
            {crystalSystem === 'hexagonal' && (
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Lattice c (Å)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  value={latticeC}
                  onChange={(e) => setLatticeC(parseFloat(e.target.value) || 5.2)}
                  className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Max Intensity (I_max)</label>
              <input 
                type="number" 
                step="100" 
                value={baseImax}
                onChange={(e) => setBaseImax(parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-1.5 bg-[#0A101C] border border-white/10 rounded-lg text-xs font-mono text-pink-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
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
            onClick={handleGenerate}
            className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Populate Dataset
          </button>
        </div>
      </motion.div>
    </div>
  );
};
