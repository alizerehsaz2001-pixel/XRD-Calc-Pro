import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronRight, Zap, Target, Flame, ArrowRight, Compass, ShieldAlert } from 'lucide-react';

interface DislocationMetricsVisualizerProps {
  dislDensity: number; // m^-2
  energyKJ: number;    // kJ/m^3
  burgersVectorNm: number;
  youngsModulusGpa: number;
  columnLengthNm: number;
  rmsStrain: number;
}

export const DislocationMetricsVisualizer: React.FC<DislocationMetricsVisualizerProps> = ({
  dislDensity,
  energyKJ,
  burgersVectorNm,
  youngsModulusGpa,
  columnLengthNm,
  rmsStrain
}) => {
  const [activeTab, setActiveTab] = useState<'gauges' | 'comparison' | 'physics'>('gauges');
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  // Safe checks for inputs
  const safeDensity = Number.isFinite(dislDensity) && dislDensity > 0 ? dislDensity : 1e10;
  const safeEnergy = Number.isFinite(energyKJ) && energyKJ > 0 ? energyKJ : 0.05;

  // Logarithmic calculation for progress gauge: 10^10 to 10^19 m^-2
  const logDensity = Math.log10(safeDensity);
  const minLog = 10;
  const maxLog = 19;
  const densityPercent = Math.max(2, Math.min(100, ((logDensity - minLog) / (maxLog - minLog)) * 100));

  // Determine material defect severity status
  let stateSeverity: {
    title: string;
    description: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    glowClass: string;
  };

  if (logDensity < 12.5) {
    stateSeverity = {
      title: "Coherent Low-Defect State",
      description: "Lattice shows minimal strain. This resembles high-temperature annealed structural single crystals.",
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/20",
      glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.15)]"
    };
  } else if (logDensity < 14.5) {
    stateSeverity = {
      title: "Moderately Deformed Crystalline Zone",
      description: "Typical strain levels found in moderately rolled or lightly tension-formed crystalline domains.",
      colorClass: "text-cyan-400",
      bgClass: "bg-cyan-500/10",
      borderClass: "border-cyan-500/20",
      glowClass: "shadow-[0_0_15px_rgba(6,182,212,0.15)]"
    };
  } else if (logDensity < 16.5) {
    stateSeverity = {
      title: "Severely Worked Grain Boundaries",
      description: "Highly work-hardened structure. Significant dislocation tangles and pile-ups localized inside the domains.",
      colorClass: "text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/20",
      glowClass: "shadow-[0_0_15px_rgba(245,158,11,0.15)]"
    };
  } else {
    stateSeverity = {
      title: "Severe Elastic/Plastic Distortions (SPD)",
      description: "Extreme, nanostructured grain bounds. Nearing mechanical stability limits with exceptional stored elastic energies.",
      colorClass: "text-rose-400",
      bgClass: "bg-rose-500/10",
      borderClass: "border-rose-500/20",
      glowClass: "shadow-[0_0_15px_rgba(244,63,94,0.15)]"
    };
  }

  // Energy physical equivalents calculations:
  // We assume standard iron/steel density for weight base analogies: 7.85 g/cm^3 (7850 kg/m^3)
  const densityKgM3 = 7850; 
  const energyJg = safeEnergy / (densityKgM3 / 1000); // kJ/m^3 / 7.85 = J/g
  
  // Approximate heat release equivalent temperature rise: dT = E / (mass * Specific Heat)
  // Specific Heat iron: 0.45 J/(g*K)
  const tempRiseK = energyJg / 0.45;

  // eV per atom conversion:
  const atomicVolumeFe = 1.18e-29; // approximate iron atom volume in m^3 (dSpacing^3 / 2)
  const eVPerAtom = (safeEnergy * 1000 * atomicVolumeFe) / 1.602e-19;

  return (
    <div className="w-full bg-[#030712] border border-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col mt-4">
      
      {/* Header section with tab selectors */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
          <span className="text-[10px] font-black font-mono text-slate-300 uppercase tracking-widest">
            Dislocation & Strain State Dynamics
          </span>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-white/5 shrink-0 select-none">
          {(['gauges', 'comparison', 'physics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-[8.5px] font-mono font-black tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-[#a855f7] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
              }`}
            >
              {tab === 'gauges' ? 'Dials & Status' : tab === 'comparison' ? 'Benchmarking' : 'Physics Model'}
            </button>
          ))}
        </div>
      </div>

      {/* Main interactive compartment with animations */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'gauges' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              key="gauges-panel"
            >
              {/* Core numbers display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Gauge Card 1: Dislocation Density */}
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2 relative overflow-hidden group/card hover:border-[#a855f7]/20 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                      Estimated Dislocation Density (ρ)
                    </span>
                    <Target className="w-3.5 h-3.5 text-slate-600 group-hover/card:text-[#a855f7] transition-colors" />
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-xl font-mono font-black text-white hover:text-purple-300 transition-colors block">
                      {safeDensity.toExponential(2)}{' '}
                      <span className="text-[10px] font-sans text-slate-400 font-normal">m⁻²</span>
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-500 block">
                      {logDensity.toFixed(2)} orders of magnitude (log₁₀)
                    </span>
                  </div>

                  {/* Micro gradient logarithmic ribbon slider */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-900/80 relative overflow-hidden border border-white/5">
                      {/* Log zones background color indicators */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/20 to-fuchsia-500/20" />
                      {/* Interactive dynamic slide pointer */}
                      <div 
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.7)] transition-all duration-500"
                        style={{ width: `${densityPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[7px] font-mono text-slate-600 font-black">
                      <span>10¹⁰ (Annealed)</span>
                      <span>10¹⁵</span>
                      <span>10¹⁹ (SPD)</span>
                    </div>
                  </div>
                </div>

                {/* Gauge Card 2: Stored Strain Elastic Energy */}
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2 relative overflow-hidden group/card hover:border-[#a855f7]/20 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                      Stored Elastic Energy Density
                    </span>
                    <Zap className="w-3.5 h-3.5 text-slate-600 group-hover/card:text-[#a855f7] transition-colors animate-pulse" />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xl font-mono font-black text-rose-400 block">
                      {safeEnergy >= 1000 
                        ? `${(safeEnergy / 1000).toFixed(3)} MJ/m³` 
                        : `${safeEnergy.toFixed(2)} kJ/m³`
                      }
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-500 block">
                      {eVPerAtom.toExponential(3)} eV/atom (Fe lattice equivalent)
                    </span>
                  </div>

                  {/* Mini physical equivalent gauge bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-900/80 relative overflow-hidden border border-white/5">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-fuchsia-500 to-rose-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, Math.min(100, (safeEnergy / 950000) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[7px] font-mono text-slate-600 font-black">
                      <span>Low Strain</span>
                      <span>Moderate (GPa bound)</span>
                      <span>Extreme Core</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Status / Material interpretation Block */}
              <div className={`p-3 border rounded-xl flex items-start gap-3 transition-all duration-300 ${stateSeverity.bgClass} ${stateSeverity.borderClass} ${stateSeverity.glowClass}`}>
                <div className="mt-0.5">
                  <ShieldAlert className={`w-4 h-4 shrink-0 ${stateSeverity.colorClass}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className={`text-[10px] font-bold font-mono uppercase tracking-widest leading-none ${stateSeverity.colorClass}`}>
                    {stateSeverity.title}
                  </h4>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                    {stateSeverity.description}
                  </p>
                </div>
              </div>

              {/* Quick thermodynamics analogy box */}
              <div className="bg-black/30 rounded-xl p-3 border border-slate-900 flex flex-col space-y-2">
                <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                  Thermodynamic Release Analogy
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  If this microstructural lattice energy was suddenly untrapped and converted to heat, the localized crystal lattice temperature would rise by{' '}
                  <span className="text-amber-500 font-mono font-bold">
                    ~{tempRiseK < 0.01 ? tempRiseK.toExponential(2) : tempRiseK.toFixed(3)} K
                  </span>{' '}
                  ({energyJg.toFixed(3)} J per gram of steel). This explains why the cold-working of metals results in latent heat dissipation!
                </p>
              </div>

            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              key="comparison-panel"
            >
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                  Defect Spectrum Benchmarking (lines/m²)
                </span>
                <p className="text-[10px] text-slate-400 font-sans">
                  See where your calculated sample domain (at columnar shell L={columnLengthNm.toFixed(0)} nm) stands in the global context of physical metallurgy.
                </p>
              </div>

              {/* Comparative bars */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Fully Annealed Single Crystal */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Annealed Copper/Silicon (Perfect Lattice)</span>
                    <span className="font-bold">10¹⁰ - 10¹² m⁻²</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full relative overflow-hidden">
                    <div className="h-full bg-emerald-500/20 absolute left-0 w-[22%]" />
                    {logDensity >= 10 && logDensity <= 12 && (
                      <div className="absolute top-0 bottom-0 left-[15%] w-1.5 bg-white rounded shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" />
                    )}
                  </div>
                </div>

                {/* 2. Moderately Deformed Structural Steel */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Moderately Strain-Hardened Steel</span>
                    <span className="font-bold">10¹³ - 10¹⁵ m⁻²</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full relative overflow-hidden">
                    <div className="h-full bg-cyan-500/20 absolute left-[32%] w-[22%]" />
                    {logDensity > 12 && logDensity <= 15 && (
                      <div 
                        className="absolute top-0 bottom-0 bg-white rounded shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                        style={{ left: `${Math.max(32, Math.min(54, 32 + ((logDensity - 12) / 3) * 22))}%`, width: '4px' }} 
                      />
                    )}
                  </div>
                </div>

                {/* 3. Heavily Deformed / Shock-Hardened Metals */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Heavily Worked / Laser Shock Peened Alloy</span>
                    <span className="font-bold">10¹⁶ - 10¹⁷ m⁻²</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full relative overflow-hidden">
                    <div className="h-full bg-amber-500/20 absolute left-[64%] w-[12%]" />
                    {logDensity > 15 && logDensity <= 17 && (
                      <div 
                        className="absolute top-0 bottom-0 bg-white rounded shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                        style={{ left: `${Math.max(64, Math.min(76, 64 + ((logDensity - 15) / 2) * 12))}%`, width: '4px' }} 
                      />
                    )}
                  </div>
                </div>

                {/* 4. Severe Plastic Deformation (SPD) e.g., ECAP, HPT */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Severe Plastic Deformation (SPD / Ball Milling limits)</span>
                    <span className="font-bold">10¹⁸ - 10¹⁹ m⁻²</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full relative overflow-hidden">
                    <div className="h-full bg-rose-500/30 absolute left-[85%] w-[15%]" />
                    {logDensity > 17 && (
                      <div 
                        className="absolute top-0 bottom-0 bg-white rounded shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                        style={{ left: `${Math.max(85, Math.min(99, 85 + ((logDensity - 17) / 2) * 14))}%`, width: '4px' }} 
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Informative footer indicating current region */}
              <div className="bg-[#050b18] border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#a855f7]" />
                  <span className="text-[10px] text-slate-300 font-sans font-medium">
                    Your domain: <span className="text-white font-bold">{safeDensity.toExponential(2)} m⁻²</span> fallback classification:
                  </span>
                </div>
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded ${stateSeverity.bgClass} ${stateSeverity.colorClass}`}>
                  {logDensity >= 16.5 ? 'SPD Regime' : logDensity >= 14.5 ? 'Highly Defected' : logDensity >= 12.5 ? 'Normal Worked' : 'Annealed'}
                </span>
              </div>
            </motion.div>
          )}

          {activeTab === 'physics' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              key="physics-panel"
            >
              <div className="space-y-2">
                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                  Governing Formalism & Inputs
                </span>
                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                  The dislocation state is computed using the classical Warren-Averbach Fourier coefficients (under the Williamson & Smallman model mapping), relating elastic RMS strain variance directly to macroscopic dislocation density and total localized hydrostatic lattice strain energy.
                </p>
              </div>

              {/* Mathematical Equation blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Equation 1: Williamson & Smallman */}
                <div className="p-3 bg-black/40 border border-slate-900 rounded-xl space-y-2">
                  <span className="text-[8px] font-bold font-mono text-[#a855f7] uppercase tracking-widest block">
                    Dislocation Density Formula
                  </span>
                  <div className="py-2.5 bg-black/60 rounded-lg border border-white/5 flex items-center justify-center font-mono text-xs text-white">
                    ρ = (2√3 · ⟨ε²⟩<sup>1/2</sup>) / (L · b)
                  </div>
                  <div className="space-y-1 text-[8.5px] text-slate-400 font-sans leading-relaxed">
                    <p><strong className="text-slate-300 font-mono">L =</strong> Column length ({columnLengthNm.toFixed(2)} nm)</p>
                    <p><strong className="text-slate-300 font-mono">b =</strong> Burgers vector ({burgersVectorNm.toFixed(3)} nm)</p>
                    <p><strong className="text-slate-300 font-mono">⟨ε²⟩<sup>1/2</sup> =</strong> RMS strain ({rmsStrain.toExponential(3)})</p>
                  </div>
                </div>

                {/* Equation 2: Elastic Energy */}
                <div className="p-3 bg-black/40 border border-slate-900 rounded-xl space-y-2">
                  <span className="text-[8px] font-bold font-mono text-[#a855f7] uppercase tracking-widest block">
                    Elastic Strain energy
                  </span>
                  <div className="py-2.5 bg-black/60 rounded-lg border border-white/5 flex items-center justify-center font-mono text-xs text-white">
                    V<sub>H</sub> = 3/2 · E · ⟨ε²⟩
                  </div>
                  <div className="space-y-1 text-[8.5px] text-slate-400 font-sans leading-relaxed">
                    <p><strong className="text-slate-300 font-mono">E =</strong> Young's Modulus ({youngsModulusGpa.toFixed(1)} GPa)</p>
                    <p><strong className="text-slate-300 font-mono">⟨ε²⟩ =</strong> Strain variance ({(rmsStrain ** 2).toExponential(3)})</p>
                    <p><strong className="text-slate-300 font-mono">V<sub>H</sub> =</strong> Volumetric strain energy calculated</p>
                  </div>
                </div>

              </div>

              {/* Informative footnote explaining verification significance in XRD */}
              <div className="flex gap-2 text-[8.5px] text-slate-500 leading-relaxed font-sans bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Crystallographic significance:</strong> Warren-Averbach peak broadening decomposition isolates particle size effects (which are constant across reflection orders) from microelastic strains (which scale with Order h² + k² + l²), offering much greater precision than standard Williamson-Hall plots.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
