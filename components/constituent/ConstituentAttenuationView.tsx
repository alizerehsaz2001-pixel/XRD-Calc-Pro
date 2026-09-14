import React, { useState } from 'react';
import { ShieldAlert, Info, Activity, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ConstituentElementItem } from './types';

interface ConstituentAttenuationViewProps {
  constituents: ConstituentElementItem[];
  density?: number; // g/cm^3
  formula: string;
}

export const ConstituentAttenuationView: React.FC<ConstituentAttenuationViewProps> = ({
  constituents,
  density: propDensity,
  formula
}) => {
  const estimatedDensity = propDensity && propDensity > 0 ? propDensity : 4.5;
  const [sampleDensity, setSampleDensity] = useState<number>(estimatedDensity);
  const [packingFraction, setPackingFraction] = useState<number>(0.65); // 65% random close packing for powders

  // Compound mass attenuation coefficients (cm^2/g)
  // (mu/rho)_compound = sum(w_i * (mu/rho)_i)
  const compoundMuCu = constituents.reduce((acc, c) => {
    const mu = c.meta.muOverRhoCu || (0.016 * Math.pow(c.z, 3.5)); // fallback estimate
    return acc + (c.massPercent / 100) * mu;
  }, 0);

  const compoundMuMo = constituents.reduce((acc, c) => {
    const mu = c.meta.muOverRhoMo || (0.0018 * Math.pow(c.z, 3.3));
    return acc + (c.massPercent / 100) * mu;
  }, 0);

  const compoundMuCo = constituents.reduce((acc, c) => {
    const mu = c.meta.muOverRhoCo || (0.024 * Math.pow(c.z, 3.5));
    return acc + (c.massPercent / 100) * mu;
  }, 0);

  // Effective density for powder / bulk
  const effectiveDensity = sampleDensity * packingFraction;

  // Linear absorption coefficient: mu = rho_eff * (mu/rho) [cm^-1]
  const linearMuCu = effectiveDensity * compoundMuCu;
  const linearMuMo = effectiveDensity * compoundMuMo;
  const linearMuCo = effectiveDensity * compoundMuCo;

  // 1/e penetration depth in micrometers: t_(1/e) = (1 / mu) * 10000 um
  const depthCuUm = linearMuCu > 0 ? (1 / linearMuCu) * 10000 : 0;
  const depthMoUm = linearMuMo > 0 ? (1 / linearMuMo) * 10000 : 0;
  const depthCoUm = linearMuCo > 0 ? (1 / linearMuCo) * 10000 : 0;

  // 99% extinction depth (4.605 * 1/e)
  const depth99CuUm = depthCuUm * 4.605;

  // Ideal capillary diameter for Debye-Scherrer transmission: ~ 1 / mu_bulk (mm)
  const optCapillaryMm = linearMuCu > 0 ? (10 / linearMuCu) : 0.5;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#070b14] border border-indigo-500/30 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              X-Ray Absorption Metrology & Penetration Depth
            </span>
            <h4 className="text-xl font-black text-white uppercase tracking-wider font-serif">
              Specimen Attenuation & Optical Thickness ({formula})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-black/40 px-3.5 py-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold">Crystal Density:</span>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="25"
                value={sampleDensity}
                onChange={(e) => setSampleDensity(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-16 bg-slate-900 border border-slate-700 text-white font-mono text-xs px-2 py-0.5 rounded text-center"
              />
              <span className="text-[10px] font-mono text-slate-400">g/cm³</span>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <span className="text-[10px] font-mono text-slate-400 font-bold">Powder Packing:</span>
              <span className="text-xs font-mono font-black text-cyan-400">
                {(packingFraction * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min="0.30"
                max="1.00"
                step="0.05"
                value={packingFraction}
                onChange={(e) => setPackingFraction(parseFloat(e.target.value))}
                className="w-20 accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3 Lab Anode Absorption Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Cu-Ka */}
          <div className="p-4 bg-black/50 border border-indigo-500/40 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-xs font-mono font-black text-indigo-300">Cu-Kα (8.048 keV)</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">λ = 1.5406 Å</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <span className="text-[9px] uppercase text-slate-500 block">Mass Attenuation</span>
                <span className="text-base font-black text-white">{compoundMuCu.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 ml-1">cm²/g</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <span className="text-[9px] uppercase text-slate-500 block">Linear Abs. (μ)</span>
                <span className="text-base font-black text-indigo-400">{linearMuCu.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 ml-1">cm⁻¹</span>
              </div>
            </div>
            <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-indigo-200">1/e Penetration Depth:</span>
              <span className="text-sm font-black text-cyan-300">
                {depthCuUm < 1000 ? `${depthCuUm.toFixed(1)} μm` : `${(depthCuUm / 1000).toFixed(2)} mm`}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>99% Attenuation:</span>
              <span className="text-slate-200 font-bold">{depth99CuUm < 1000 ? `${depth99CuUm.toFixed(0)} μm` : `${(depth99CuUm / 1000).toFixed(2)} mm`}</span>
            </div>
          </div>

          {/* Co-Ka */}
          <div className="p-4 bg-black/50 border border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-black text-blue-300">Co-Kα (6.930 keV)</span>
              <span className="text-[9px] font-mono text-slate-400">λ = 1.7890 Å</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <span className="text-[9px] uppercase text-slate-500 block">Mass Attenuation</span>
                <span className="text-base font-black text-white">{compoundMuCo.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 ml-1">cm²/g</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <span className="text-[9px] uppercase text-slate-500 block">Linear Abs. (μ)</span>
                <span className="text-base font-black text-blue-400">{linearMuCo.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 ml-1">cm⁻¹</span>
              </div>
            </div>
            <div className="p-2.5 bg-blue-950/40 border border-blue-800/50 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-blue-200">1/e Penetration Depth:</span>
              <span className="text-sm font-black text-cyan-300">
                {depthCoUm < 1000 ? `${depthCoUm.toFixed(1)} μm` : `${(depthCoUm / 1000).toFixed(2)} mm`}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>99% Attenuation:</span>
              <span className="text-slate-200 font-bold">{depthCoUm * 4.605 < 1000 ? `${(depthCoUm * 4.605).toFixed(0)} μm` : `${((depthCoUm * 4.605) / 1000).toFixed(2)} mm`}</span>
            </div>
          </div>

          {/* Mo-Ka */}
          <div className="p-4 bg-black/50 border border-purple-500/30 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-black text-purple-300">Mo-Kα (17.479 keV)</span>
              <span className="text-[9px] font-mono text-slate-400">λ = 0.7093 Å</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <span className="text-[9px] uppercase text-slate-500 block">Mass Attenuation</span>
                <span className="text-base font-black text-white">{compoundMuMo.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 ml-1">cm²/g</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <span className="text-[9px] uppercase text-slate-500 block">Linear Abs. (μ)</span>
                <span className="text-base font-black text-purple-400">{linearMuMo.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 ml-1">cm⁻¹</span>
              </div>
            </div>
            <div className="p-2.5 bg-purple-950/40 border border-purple-800/50 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-purple-200">1/e Penetration Depth:</span>
              <span className="text-sm font-black text-cyan-300">
                {depthMoUm < 1000 ? `${depthMoUm.toFixed(1)} μm` : `${(depthMoUm / 1000).toFixed(2)} mm`}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>99% Attenuation:</span>
              <span className="text-slate-200 font-bold">{depthMoUm * 4.605 < 1000 ? `${(depthMoUm * 4.605).toFixed(0)} μm` : `${((depthMoUm * 4.605) / 1000).toFixed(2)} mm`}</span>
            </div>
          </div>
        </div>

        {/* Laboratory Practical Specimen Diagnostic */}
        <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-2.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              XRD Sample Preparation & Geometry Recommendation:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 block">
                Flat Plate Bragg-Brentano (Reflection Mode):
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {depthCuUm > 200 ? (
                  <span className="text-amber-300 font-medium">
                    ⚠️ High sample transparency ({depthCuUm.toFixed(0)} μm). Use a zero-background silicon cavity (ZBH) with thin powder layer (&lt; 50 μm) to prevent peak displacement and low-angle transparency broadening.
                  </span>
                ) : depthCuUm < 15 ? (
                  <span className="text-cyan-300 font-medium">
                    ✓ Strong absorption ({depthCuUm.toFixed(1)} μm). Surface scattering dominates; standard infinite-thickness condition is satisfied at &gt; {depth99CuUm.toFixed(0)} μm thickness. Ensure random particle packing to avoid preferred orientation.
                  </span>
                ) : (
                  <span className="text-emerald-300 font-medium">
                    ✓ Ideal absorption range ({depthCuUm.toFixed(1)} μm penetration). Standard reflection specimen holders work with minimal transparency aberrations.
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 block">
                Debye-Scherrer Transmission (Capillary Mode):
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ideal transmission capillary diameter for maximum diffracted intensity is{' '}
                <span className="text-white font-bold">
                  d ≈ 1/μ = {optCapillaryMm > 0.1 && optCapillaryMm < 5 ? `${optCapillaryMm.toFixed(2)} mm` : optCapillaryMm >= 5 ? '&gt; 2.0 mm (low absorption)' : '&lt; 0.2 mm (high absorption)'}
                </span>.
                {optCapillaryMm < 0.3 && ' For this dense phase, dilute sample 1:1 with amorphous silica or starch, or select Mo-Kα radiation to reduce absorption.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
