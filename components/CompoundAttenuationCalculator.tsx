import React, { useState, useMemo } from 'react';
import { Sparkles, Activity, Layers, Droplets, Info, Copy, Check, Zap, Atom } from 'lucide-react';
import { calculateCompoundAttenuation, CompoundAttenuationResult } from './XRayScatteringDb';
import { playSynthTone } from '../utils/sound';

interface CompoundAttenuationCalculatorProps {
  elementWeightsMap?: Record<string, { z: number; weight: number }>;
  initialFormula?: string;
  onSelectElement?: (z: number) => void;
}

const PRESET_COMPOUNDS = [
  { name: 'Silicon (Semiconductor)', formula: 'Si', density: 2.33 },
  { name: 'Gallium Arsenide (GaAs)', formula: 'GaAs', density: 5.32 },
  { name: 'Barium Titanate (Perovskite)', formula: 'BaTiO3', density: 6.02 },
  { name: 'YBCO High-Tc Superconductor', formula: 'YBa2Cu3O7', density: 6.38 },
  { name: 'Lithium Iron Phosphate (LFP)', formula: 'LiFePO4', density: 3.60 },
  { name: 'Titania Rutile', formula: 'TiO2', density: 4.23 },
  { name: 'Alumina Corundum', formula: 'Al2O3', density: 3.95 },
  { name: 'Invar Alloy (Fe64Ni36)', formula: 'Fe64Ni36', density: 8.10 },
  { name: 'Stainless Steel 316L (Fe70Cr18Ni12)', formula: 'Fe70Cr18Ni12', density: 8.00 }
];

export const CompoundAttenuationCalculator: React.FC<CompoundAttenuationCalculatorProps> = ({
  elementWeightsMap = {},
  initialFormula,
  onSelectElement
}) => {
  const [formula, setFormula] = useState<string>(initialFormula || 'YBa2Cu3O7');
  const [density, setDensity] = useState<number>(6.38);
  const [copied, setCopied] = useState(false);

  const result = useMemo<CompoundAttenuationResult | null>(() => {
    return calculateCompoundAttenuation(formula, density, elementWeightsMap);
  }, [formula, density, elementWeightsMap]);

  const handleApplyPreset = (preset: typeof PRESET_COMPOUNDS[0]) => {
    setFormula(preset.formula);
    setDensity(preset.density);
    playSynthTone('tick');
  };

  const handleCopyReport = () => {
    if (!result) return;
    const text = `XRD Attenuation Report for ${result.formula} (Density = ${density} g/cm³):\n` +
      `Formula Weight: ${result.formulaWeight.toFixed(3)} g/mol\n` +
      `Mass Attenuation (Cu Ka): ${result.muRhoCu.toFixed(2)} cm²/g\n` +
      `Linear Attenuation (Cu Ka): ${result.linearMuCu.toFixed(1)} cm⁻¹\n` +
      `Penetration Depth (1/μ, Cu Ka): ${result.penetrationDepthCuUm.toFixed(2)} µm\n` +
      `99% Absorption Depth (Cu Ka): ${result.ninetyNinePercentDepthCuUm.toFixed(2)} µm\n` +
      `Mass Attenuation (Mo Ka): ${result.muRhoMo.toFixed(2)} cm²/g\n` +
      `Penetration Depth (Mo Ka): ${result.penetrationDepthMoUm.toFixed(2)} µm`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    playSynthTone('chime');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Preset Quick Pick */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Atom className="w-4 h-4 text-indigo-400" />
              Compound & Alloy X-Ray Attenuation Calculator
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Calculate total linear absorption coefficient (μ), penetration depth (1/μ), and elemental mass fractions for any chemical stoichiometry.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyReport}
            disabled={!result}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Report' : 'Copy Report'}</span>
          </button>
        </div>

        {/* Preset Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Quick Benchmarks:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_COMPOUNDS.map(preset => (
              <button
                key={preset.formula}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  formula === preset.formula
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Chemical Formula (Case-Sensitive, e.g. BaTiO3, Fe0.7Ni0.3)
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. YBa2Cu3O7"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Crystallographic Density (g/cm³)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={String(density) === 'NaN' ? '' : density}
              onChange={(e) => setDensity(parseFloat(e.target.value) || 1.0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Results Dashboard */}
      {result ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cu K-Alpha Attenuation & Penetration */}
          <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl relative isolate">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" />
                Cu Kα Radiation (8.04 keV / 1.54056 Å)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono">
                Standard Laboratory XRD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Mass Attenuation (μ/ρ)</span>
                <div className="text-lg font-extrabold text-white">
                  {result.muRhoCu.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">cm²/g</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Linear Attenuation (μ)</span>
                <div className="text-lg font-extrabold text-sky-400">
                  {result.linearMuCu.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal ml-1">cm⁻¹</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Penetration Depth (1/μ, 63.2% abs.)</span>
                <div className="text-lg font-extrabold text-emerald-400">
                  {result.penetrationDepthCuUm.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">µm</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">99% Total Beam Absorption</span>
                <div className="text-lg font-extrabold text-pink-400">
                  {result.ninetyNinePercentDepthCuUm.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">µm</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono">
              In symmetric Bragg-Brentano reflection geometry, XRD information depth is limited by this absorption length.
            </p>
          </div>

          {/* Mo K-Alpha Attenuation & Penetration */}
          <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl relative isolate">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                Mo Kα Radiation (17.48 keV / 0.7093 Å)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono">
                Hard X-Ray & Capillaries
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Mass Attenuation (μ/ρ)</span>
                <div className="text-lg font-extrabold text-white">
                  {result.muRhoMo.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">cm²/g</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Linear Attenuation (μ)</span>
                <div className="text-lg font-extrabold text-violet-400">
                  {result.linearMuMo.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal ml-1">cm⁻¹</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Penetration Depth (1/μ, 63.2% abs.)</span>
                <div className="text-lg font-extrabold text-emerald-400">
                  {result.penetrationDepthMoUm.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">µm</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">Molar Formula Mass</span>
                <div className="text-lg font-extrabold text-amber-400">
                  {result.formulaWeight.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">g/mol</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono">
              Mo Kα gives significantly greater penetration, ideal for heavy elements or transmission capillary measurements.
            </p>
          </div>

          {/* Elemental Breakdown Table */}
          <div className="md:col-span-2 bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3 shadow-xl">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              Elemental Mass Fraction & Contribution Breakdown
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-900 uppercase text-[9px] tracking-wider">
                    <th className="py-2 px-3">Element</th>
                    <th className="py-2 px-3">At. No. (Z)</th>
                    <th className="py-2 px-3">Stoichiometry</th>
                    <th className="py-2 px-3">At. Mass</th>
                    <th className="py-2 px-3">Mass Fraction (%)</th>
                    <th className="py-2 px-3">μ/ρ (Cu Kα)</th>
                    <th className="py-2 px-3">μ/ρ (Mo Kα)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {result.elements.map((el, i) => (
                    <tr
                      key={i}
                      onClick={() => onSelectElement && onSelectElement(el.z)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3 font-bold text-indigo-400 flex items-center gap-1.5">
                        <span>{el.symbol}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{el.z}</td>
                      <td className="py-2 px-3 font-bold text-white">{el.count}</td>
                      <td className="py-2 px-3 text-slate-400">{el.atomicWeight.toFixed(3)} u</td>
                      <td className="py-2 px-3 font-bold text-emerald-400">
                        {(el.weightFraction * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-sky-300">{el.muRhoCu.toFixed(1)}</td>
                      <td className="py-2 px-3 text-violet-300">{el.muRhoMo.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-xs font-mono">
          Unable to parse chemical formula. Please ensure elemental symbols are capitalized correctly (e.g., Fe2O3, BaTiO3, GaAs).
        </div>
      )}
    </div>
  );
};
