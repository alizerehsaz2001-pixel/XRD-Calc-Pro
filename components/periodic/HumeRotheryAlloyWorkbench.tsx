import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Scale,
  Activity,
  ArrowRight,
  TrendingUp,
  Boxes
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { CrystalElement } from './types';
import { COMPLETE_PERIODIC_TABLE } from './elementsData';

interface HumeRotheryAlloyWorkbenchProps {
  solventElement: CrystalElement;
  onSelectSoluteElement?: (z: number) => void;
}

export const HumeRotheryAlloyWorkbench: React.FC<HumeRotheryAlloyWorkbenchProps> = ({
  solventElement,
  onSelectSoluteElement
}) => {
  const { t } = useTranslation();
  const [soluteZ, setSoluteZ] = useState<number>(() => {
    // Default complementary solute: e.g. if Cu(29) -> Zn(30) or Ni(28); if Fe(26) -> Ni(28) or Cr(24); otherwise next element
    if (solventElement.number === 29) return 30; // Brass (Cu-Zn)
    if (solventElement.number === 26) return 28; // Invar (Fe-Ni)
    if (solventElement.number === 13) return 12; // Al-Mg
    if (solventElement.number === 14) return 31; // Si-Ga doping
    return solventElement.number === 118 ? 1 : solventElement.number + 1;
  });

  const [soluteAtomicFraction, setSoluteAtomicFraction] = useState<number>(0.20); // 20 at.%

  const soluteElement = useMemo(() => {
    return COMPLETE_PERIODIC_TABLE.find((e) => e.number === soluteZ) || COMPLETE_PERIODIC_TABLE[0];
  }, [soluteZ]);

  // Classic Metallurgy Presets
  const ALLOY_PRESETS = [
    { label: 'Cu-Ni (Monel / Constantan)', solvent: 29, solute: 28, desc: 'Isomorphous binary system with 100% complete mutual solid solubility' },
    { label: 'Cu-Zn (Cartridge Brass)', solvent: 29, solute: 30, desc: 'Classic Hume-Rothery electron compound system with extensive alpha phase' },
    { label: 'Fe-Ni (Invar / Austenitic)', solvent: 26, solute: 28, desc: 'Ultra-low thermal expansion alloy with FCC austenite stabilization' },
    { label: 'Ti-Al (Titanium Aerospace)', solvent: 22, solute: 13, desc: 'Alpha-phase stabilizer in Ti-6Al-4V high-strength aerospace alloys' },
    { label: 'Au-Ag (Electrum)', solvent: 79, solute: 47, desc: 'Continuous solid solution across all compositions due to identical FCC lattices' }
  ];

  // Hume-Rothery Rule 1: Atomic Size Difference
  // Δr = (|r_solute - r_solvent| / r_solvent) * 100%
  const sizeDifferencePct = useMemo(() => {
    const rA = solventElement.atomicRadius || 140;
    const rB = soluteElement.atomicRadius || 140;
    return Number((Math.abs(rB - rA) / rA * 100).toFixed(2));
  }, [solventElement, soluteElement]);

  const sizeRulePass = sizeDifferencePct < 15.0;

  // Hume-Rothery Rule 2: Crystal Structure Match
  const structureRulePass = solventElement.crystalStructure === soluteElement.crystalStructure;

  // Hume-Rothery Rule 3: Electronegativity Difference
  const electronegativityDiff = useMemo(() => {
    const chiA = solventElement.electronegativity || 1.8;
    const chiB = soluteElement.electronegativity || 1.8;
    return Number(Math.abs(chiB - chiA).toFixed(2));
  }, [solventElement, soluteElement]);

  const electronegativityPass = electronegativityDiff < 0.40;

  // Hume-Rothery Rule 4: Valency Rule
  const valencyA = solventElement.valenceElectrons || 1;
  const valencyB = soluteElement.valenceElectrons || 1;
  const valencyPass = valencyB >= valencyA;

  // Electron to Atom (e/a) ratio estimation for Hume-Rothery electron phases
  const electronToAtomRatio = useMemo(() => {
    const eA = valencyA;
    const eB = valencyB;
    const x = soluteAtomicFraction;
    const ea = (1 - x) * eA + x * eB;
    return Number(ea.toFixed(3));
  }, [valencyA, valencyB, soluteAtomicFraction]);

  // Vegard's Law Linear Lattice Parameter Estimation
  // a_alloy = (1 - x) * a_solvent + x * a_solute
  const vegardsLatticeA = useMemo(() => {
    const aA = solventElement.a || 3.61;
    const aB = soluteElement.a || 3.61;
    const x = soluteAtomicFraction;
    return Number(((1 - x) * aA + x * aB).toFixed(4));
  }, [solventElement, soluteElement, soluteAtomicFraction]);

  // Darken-Gurry Map Coordinates: r (Atomic Radius) vs Electronegativity (chi)
  const darkenGurryPoints = useMemo(() => {
    const rA = solventElement.atomicRadius || 140;
    const chiA = solventElement.electronegativity || 1.8;

    return COMPLETE_PERIODIC_TABLE.slice(0, 50).map((el) => {
      const r = el.atomicRadius || 140;
      const chi = el.electronegativity || 1.8;
      const dR = Math.abs(r - rA) / rA;
      const dChi = Math.abs(chi - chiA);
      // Inside Darken-Gurry ellipse: (dR / 0.15)^2 + (dChi / 0.4)^2 <= 1.0
      const inEllipse = Math.pow(dR / 0.15, 2) + Math.pow(dChi / 0.4, 2) <= 1.0;

      return {
        symbol: el.symbol,
        name: el.name,
        radius: r,
        electronegativity: chi,
        isSolvent: el.number === solventElement.number,
        isSolute: el.number === soluteElement.number,
        inEllipse,
        color: el.number === solventElement.number ? '#6366f1' : el.number === soluteElement.number ? '#f59e0b' : inEllipse ? '#10b981' : '#64748b'
      };
    });
  }, [solventElement, soluteElement]);

  const totalRulesPassed = (sizeRulePass ? 1 : 0) + (structureRulePass ? 1 : 0) + (electronegativityPass ? 1 : 0) + (valencyPass ? 1 : 0);

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Alloy Configuration Banner */}
      <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                Hume-Rothery Binary Alloy Compatibility Workbench
              </span>
              <span className="text-[10px] text-slate-400">
                Evaluates substitutional solid solution boundaries, intermetallic phase drivers, and Vegard's lattice shift
              </span>
            </div>
          </div>

          {/* Solute Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Solute Element (B):</span>
            <select
              value={soluteZ}
              onChange={(e) => {
                const z = parseInt(e.target.value, 10);
                setSoluteZ(z);
                if (onSelectSoluteElement) onSelectSoluteElement(z);
              }}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
            >
              {COMPLETE_PERIODIC_TABLE.map((el) => (
                <option key={el.number} value={el.number}>
                  {el.symbol} - {el.name} (#{el.number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Metallurgy Presets */}
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-slate-400 font-bold">Famous Metallurgy Benchmarks:</span>
          {ALLOY_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setSoluteZ(p.solute);
                if (onSelectSoluteElement) onSelectSoluteElement(p.solute);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* The 4 Hume-Rothery Rule Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Rule 1: Atomic Size Difference */}
        <div className={`p-3.5 rounded-2xl border ${
          sizeRulePass ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'
        } space-y-1.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">1. Size Factor (Δr)</span>
            {sizeRulePass ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="text-lg font-black font-mono text-white">
            {sizeDifferencePct}% <span className="text-xs text-slate-400 font-normal">mismatch</span>
          </div>
          <p className="text-[10px] text-slate-300">
            {sizeRulePass
              ? sizeDifferencePct < 8
                ? 'Ideal Size Match (<8%): Extensive solid solution'
                : 'Favorable Size (<15%): Solid solution expected'
              : 'Size Misfit (>15%): High strain restricts solubility'}
          </p>
          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
            r({solventElement.symbol})={solventElement.atomicRadius}pm vs r({soluteElement.symbol})={soluteElement.atomicRadius}pm
          </div>
        </div>

        {/* Rule 2: Crystal Structure Match */}
        <div className={`p-3.5 rounded-2xl border ${
          structureRulePass ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/30'
        } space-y-1.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">2. Crystal Structure</span>
            {structureRulePass ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-sm font-black font-mono text-white">
            {solventElement.crystalStructure} vs {soluteElement.crystalStructure}
          </div>
          <p className="text-[10px] text-slate-300">
            {structureRulePass
              ? 'Identical lattice: Complete isomorphous binary series possible'
              : 'Different lattices: Limited terminal solid solubility before phase transition'}
          </p>
          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
            Space groups: {solventElement.spaceGroup} / {soluteElement.spaceGroup}
          </div>
        </div>

        {/* Rule 3: Electronegativity Difference */}
        <div className={`p-3.5 rounded-2xl border ${
          electronegativityPass ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-purple-950/20 border-purple-500/30'
        } space-y-1.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">3. Electronegativity</span>
            {electronegativityPass ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Boxes className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div className="text-lg font-black font-mono text-white">
            Δχ = {electronegativityDiff}
          </div>
          <p className="text-[10px] text-slate-300">
            {electronegativityPass
              ? 'Low chemical affinity: Favors disordered solid solution'
              : 'High electronegativity gap: Drives intermetallic compound formation'}
          </p>
          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
            χ({solventElement.symbol})={solventElement.electronegativity} vs χ({soluteElement.symbol})={soluteElement.electronegativity}
          </div>
        </div>

        {/* Rule 4: Relative Valency */}
        <div className={`p-3.5 rounded-2xl border ${
          valencyPass ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900 border-white/5'
        } space-y-1.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">4. Relative Valency</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black font-mono text-white">
            {valencyA}+ / {valencyB}+
          </div>
          <p className="text-[10px] text-slate-300">
            A metal dissolves higher-valency solute more readily than lower-valency solute.
          </p>
          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
            e/a ratio: {electronToAtomRatio} ({soluteAtomicFraction * 100} at.%)
          </div>
        </div>
      </div>

      {/* Vegard's Law Linear Lattice Interpolation */}
      <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Vegard's Law Lattice Parameter Predictor
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              a_alloy(x) = (1 - x) · a_{solventElement.symbol} + x · a_{soluteElement.symbol}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 text-sm font-bold">
              a_calc = {vegardsLatticeA} Å
            </span>
            <span className="text-[10px] text-slate-400">({(soluteAtomicFraction * 100).toFixed(0)} at.% {soluteElement.symbol})</span>
          </div>
        </div>

        {/* Composition Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Pure {solventElement.symbol} (a = {solventElement.a} Å)</span>
            <span className="text-white font-bold">{solventElement.symbol}_{(1 - soluteAtomicFraction).toFixed(2)}{soluteElement.symbol}_{soluteAtomicFraction.toFixed(2)}</span>
            <span>Pure {soluteElement.symbol} (a = {soluteElement.a} Å)</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.02"
            value={soluteAtomicFraction}
            onChange={(e) => setSoluteAtomicFraction(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 cursor-pointer"
          />
        </div>
      </div>

      {/* Darken-Gurry Map (Radius vs Electronegativity) */}
      <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-white">
                Darken-Gurry Map for {solventElement.name} Matrix
              </span>
              <p className="text-[10px] text-slate-400">
                Green nodes fall inside the ±15% radius & ±0.4 electronegativity ellipse for solid solubility.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Solvent ({solventElement.symbol})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Solute ({soluteElement.symbol})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Soluble Candidates</span>
          </div>
        </div>

        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={darkenGurryPoints}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="radius" type="number" name="Atomic Radius (pm)" label={{ value: 'Atomic Radius r (pm)', position: 'insideBottom', offset: -5 }} />
              <YAxis dataKey="electronegativity" type="number" name="Electronegativity" label={{ value: 'Pauling Electronegativity (χ)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const pt = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs shadow-xl space-y-1">
                      <p className="font-bold text-indigo-400">{pt.symbol} ({pt.name})</p>
                      <p className="text-[11px] text-slate-300">Radius: {pt.radius} pm | χ: {pt.electronegativity}</p>
                      <p className="text-[10px] text-slate-400">
                        {pt.isSolvent ? 'Active Matrix Solvent' : pt.inEllipse ? '✓ Inside Hume-Rothery Ellipse' : '✗ Outside Solubility Ellipse'}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter dataKey="electronegativity" data={darkenGurryPoints}>
                {darkenGurryPoints.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={entry.isSolvent || entry.isSolute ? '#ffffff' : '#000000'}
                    strokeWidth={entry.isSolvent || entry.isSolute ? 2 : 1}
                  />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
