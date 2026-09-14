import React from 'react';
import { Compass, Sparkles, Scale, Info, Layers } from 'lucide-react';
import { ConstituentElementItem } from './types';
import { calculateIonicityPercentage } from '../../utils/elementMetrology';

interface ConstituentBondingViewProps {
  constituents: ConstituentElementItem[];
  formula: string;
}

export const ConstituentBondingView: React.FC<ConstituentBondingViewProps> = ({
  constituents,
  formula
}) => {
  // Separate cations and anions based on electronegativity and classification
  const anions = constituents.filter(c =>
    ['O', 'F', 'Cl', 'Br', 'I', 'S', 'Se', 'Te', 'N', 'P'].includes(c.symbol) ||
    c.meta.electronegativity >= 2.2
  );

  const cations = constituents.filter(c => !anions.some(a => a.symbol === c.symbol));

  // Determine principal anion (most electronegative)
  const primaryAnion = anions.length > 0
    ? anions.reduce((prev, curr) => (curr.meta.electronegativity > prev.meta.electronegativity ? curr : prev), anions[0])
    : null;

  // Max electronegativity difference
  const enegs = constituents.map(c => c.meta.electronegativity).filter(e => e > 0);
  const minChi = enegs.length > 0 ? Math.min(...enegs) : 0;
  const maxChi = enegs.length > 0 ? Math.max(...enegs) : 0;
  const deltaChi = enegs.length > 1 ? maxChi - minChi : 0;
  const ionicity = calculateIonicityPercentage(deltaChi);

  // Perovskite / Ternary checks (e.g. ABO3)
  // If there are 2 cations and 1 anion
  let perovskiteData: {
    aSite: ConstituentElementItem;
    bSite: ConstituentElementItem;
    xSite: ConstituentElementItem;
    toleranceFactor: number;
    octahedralFactor: number;
    classification: string;
  } | null = null;

  if (cations.length >= 2 && primaryAnion) {
    // Sort cations by ionic radius descending: A is larger cation, B is smaller transition metal cation
    const sortedCations = [...cations].sort((a, b) => b.meta.ionicRadiusPm - a.meta.ionicRadiusPm);
    const aSite = sortedCations[0];
    const bSite = sortedCations[sortedCations.length - 1];
    const rA = aSite.meta.ionicRadiusPm;
    const rB = bSite.meta.ionicRadiusPm;
    const rX = primaryAnion.meta.ionicRadiusPm;

    if (rA > 0 && rB > 0 && rX > 0) {
      const t = (rA + rX) / (Math.SQRT2 * (rB + rX));
      const muOct = rB / rX;
      let classification = 'Unclassified Ternary';
      if (t > 1.0) {
        classification = 'Hexagonal / Ilmenite (Face-sharing octahedra)';
      } else if (t >= 0.90 && t <= 1.0) {
        classification = 'Ideal Cubic Perovskite (Pm-3m)';
      } else if (t >= 0.80 && t < 0.90) {
        classification = 'Orthorhombic / Rhombohedral Perovskite (Octahedral tilting, Pnma / R-3c)';
      } else {
        classification = 'Non-perovskite (Ilmenite / Spinel / Corundum distortion)';
      }

      perovskiteData = {
        aSite,
        bSite,
        xSite: primaryAnion,
        toleranceFactor: t,
        octahedralFactor: muOct,
        classification
      };
    }
  }

  const getCoordinationPrediction = (rCat: number, rAn: number) => {
    if (!rCat || !rAn || rAn <= 0) return { cn: 'N/A', geometry: 'Unspecified', poly: 'N/A' };
    const ratio = rCat / rAn;
    if (ratio < 0.155) return { cn: '2', geometry: 'Linear', poly: '[XO₂]' };
    if (ratio < 0.225) return { cn: '3', geometry: 'Trigonal Planar', poly: '[XO₃]' };
    if (ratio < 0.414) return { cn: '4', geometry: 'Tetrahedral', poly: '[XO₄]' };
    if (ratio < 0.732) return { cn: '6', geometry: 'Octahedral', poly: '[XO₆]' };
    if (ratio < 1.000) return { cn: '8', geometry: 'Cubic / Square Antiprism', poly: '[XO₈]' };
    return { cn: '12', geometry: 'Cuboctahedral', poly: '[XO₁₂]' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Crystal Chemistry Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#070b14] border border-indigo-500/30 rounded-3xl shadow-xl relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Crystallochemical Bonding & Coordination Polyhedra
            </span>
            <h4 className="text-xl font-black text-white uppercase tracking-wider font-serif">
              Bond Ionicity & Pauling Radius Ratios ({formula})
            </h4>
          </div>

          {/* Ionicity Badge */}
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <span className="text-[10px] font-mono text-slate-400 font-bold">Bond Polarity:</span>
            <span className="text-xs font-mono font-black text-fuchsia-400">
              {ionicity.toFixed(1)}% Ionic
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              / {(100 - ionicity).toFixed(1)}% Covalent
            </span>
          </div>
        </div>

        {/* Bond Polarity Scale */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Covalent Shared Electron Cloud (Δχ = 0)</span>
            <span className="font-bold text-white">Δχ = {deltaChi.toFixed(2)} Pauling units</span>
            <span>Electrostatic Ionic Separation (Δχ &gt; 3.0)</span>
          </div>
          <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              style={{ width: `${Math.min(100, Math.max(3, ionicity))}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-fuchsia-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* Pauling's 1st Rule: Radius Ratio and Coordination Polyhedron Matrix */}
        {primaryAnion && cations.length > 0 && (
          <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-black uppercase text-indigo-300">
                Pauling Coordination Prediction with Anion {primaryAnion.symbol}²⁻ ({primaryAnion.meta.ionicRadiusPm} pm)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Pauling's First Rule: r_cation / r_anion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cations.map(cat => {
                const ratio = primaryAnion.meta.ionicRadiusPm > 0
                  ? cat.meta.ionicRadiusPm / primaryAnion.meta.ionicRadiusPm
                  : 0;
                const pred = getCoordinationPrediction(cat.meta.ionicRadiusPm, primaryAnion.meta.ionicRadiusPm);

                return (
                  <div key={cat.symbol} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white text-sm">
                        {cat.symbol} <span className="text-slate-400 text-xs font-normal">({cat.meta.ionicRadiusPm} pm)</span>
                      </span>
                      <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 text-[10px]">
                        r+/r- = {ratio.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">Coordination Number:</span>
                      <span className="font-bold text-indigo-300">CN = {pred.cn} ({pred.geometry})</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Ideal Polyhedron:</span>
                      <span className="font-bold text-slate-300">{pred.poly}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Perovskite / Ternary Tolerance Factor (if applicable) */}
        {perovskiteData && (
          <div className="p-4 bg-gradient-to-br from-[#120f24] to-[#0a0817] border border-fuchsia-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <span className="text-xs font-mono font-black uppercase text-fuchsia-300">
                  Goldschmidt Tolerance Factor for Ternary ABX₃ Lattice
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                t = (r_A + r_X) / [√2 (r_B + r_X)]
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-black/50 border border-slate-800 rounded-xl">
                <span className="text-[9px] uppercase text-slate-500 block">Tolerance Factor (t)</span>
                <span className="text-xl font-black text-fuchsia-400">
                  {perovskiteData.toleranceFactor.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  A-site: {perovskiteData.aSite.symbol} | B-site: {perovskiteData.bSite.symbol}
                </span>
              </div>

              <div className="p-3 bg-black/50 border border-slate-800 rounded-xl">
                <span className="text-[9px] uppercase text-slate-500 block">Octahedral Factor (μ_oct)</span>
                <span className="text-xl font-black text-cyan-400">
                  {perovskiteData.octahedralFactor.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {perovskiteData.octahedralFactor >= 0.414 ? 'Stable [BX₆] Octahedra' : 'Unstable [BX₆]'}
                </span>
              </div>

              <div className="p-3 bg-black/50 border border-slate-800 rounded-xl flex flex-col justify-center">
                <span className="text-[9px] uppercase text-slate-500 block">Predicted Structure</span>
                <span className="text-xs font-bold text-white leading-snug mt-1">
                  {perovskiteData.classification}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
