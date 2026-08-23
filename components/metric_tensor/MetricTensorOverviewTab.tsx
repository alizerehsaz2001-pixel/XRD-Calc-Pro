import React, { useState } from 'react';
import { 
  Grid, 
  Copy, 
  Check, 
  Info, 
  Scale, 
  Sparkles, 
  Box, 
  Layers, 
  Compass, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { LatticeParams, CrystalSystem, fmt } from './metricTensorTypes';

interface MetricTensorOverviewTabProps {
  system: CrystalSystem;
  params: LatticeParams;
  metricG: number[][];
  metricGStar: number[][];
  detG: number;
  volumeV: number;
  reciprocalVolumeVStar: number;
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStar: number;
  betaStar: number;
  gammaStar: number;
  invariantsG: { I1: number; I2: number; I3: number };
  niggliVector: { A: number; B: number; C: number; D: number; E: number; F: number; isNiggliOrdered: boolean };
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const MetricTensorOverviewTab: React.FC<MetricTensorOverviewTabProps> = ({
  system,
  params,
  metricG,
  metricGStar,
  detG,
  volumeV,
  reciprocalVolumeVStar,
  aStar,
  bStar,
  cStar,
  alphaStar,
  betaStar,
  gammaStar,
  invariantsG,
  niggliVector,
  copyToClipboard,
  copiedKey
}) => {
  // Cell inspector state (which cell is currently selected for deep-dive)
  const [selectedCell, setSelectedCell] = useState<{ tensor: 'G' | 'GStar'; i: number; j: number } | null>({
    tensor: 'G',
    i: 0,
    j: 1
  });

  const getCellExplanation = () => {
    if (!selectedCell) return null;
    const { tensor, i, j } = selectedCell;
    const val = tensor === 'G' ? metricG[i][j] : metricGStar[i][j];
    
    if (tensor === 'G') {
      const names = [
        ['g₁₁ = a²', 'g₁₂ = a·b cos(γ)', 'g₁₃ = a·c cos(β)'],
        ['g₂₁ = a·b cos(γ)', 'g₂₂ = b²', 'g₂₃ = b·c cos(α)'],
        ['g₃₁ = a·c cos(β)', 'g₃₂ = b·c cos(α)', 'g₃₃ = c²']
      ];
      const formulas = [
        [`(${params.a})² = ${fmt(params.a * params.a, 4)} Å²`, `${params.a} × ${params.b} × cos(${params.gamma}°) = ${fmt(val, 4)} Å²`, `${params.a} × ${params.c} × cos(${params.beta}°) = ${fmt(val, 4)} Å²`],
        [`${params.a} × ${params.b} × cos(${params.gamma}°) = ${fmt(val, 4)} Å²`, `(${params.b})² = ${fmt(params.b * params.b, 4)} Å²`, `${params.b} × ${params.c} × cos(${params.alpha}°) = ${fmt(val, 4)} Å²`],
        [`${params.a} × ${params.c} × cos(${params.beta}°) = ${fmt(val, 4)} Å²`, `${params.b} × ${params.c} × cos(${params.alpha}°) = ${fmt(val, 4)} Å²`, `(${params.c})² = ${fmt(params.c * params.c, 4)} Å²`]
      ];
      const descriptions = [
        ['Squared length of basis vector a', 'Dot product of basis vectors a · b (depends on angle γ)', 'Dot product of basis vectors a · c (depends on angle β)'],
        ['Dot product of basis vectors b · a (symmetric)', 'Squared length of basis vector b', 'Dot product of basis vectors b · c (depends on angle α)'],
        ['Dot product of basis vectors c · a (symmetric)', 'Dot product of basis vectors c · b (symmetric)', 'Squared length of basis vector c']
      ];
      return {
        title: `Direct Metric Tensor Element g${i+1}${j+1}`,
        symbol: names[i][j],
        calc: formulas[i][j],
        desc: descriptions[i][j],
        value: fmt(val, 4),
        unit: 'Å²'
      };
    } else {
      const names = [
        ['g*¹¹ = a*²', 'g*¹² = a*·b* cos(γ*)', 'g*¹³ = a*·c* cos(β*)'],
        ['g*²¹ = a*·b* cos(γ*)', 'g*²² = b*²', 'g*²³ = b*·c* cos(α*)'],
        ['g*³¹ = a*·c* cos(β*)', 'g*³² = b*·c* cos(α*)', 'g*³³ = c*²']
      ];
      return {
        title: `Reciprocal Metric Tensor Element g*${i+1}${j+1}`,
        symbol: names[i][j],
        calc: `Inverse matrix [G]⁻¹ element at row ${i+1}, col ${j+1}`,
        desc: i === j 
          ? `Squared reciprocal basis length (1/d² along axis ${i+1})`
          : `Reciprocal dot product between basis ${i+1}* and ${j+1}*`,
        value: fmt(val, 5),
        unit: 'Å⁻²'
      };
    }
  };

  const cellInfo = getCellExplanation();

  return (
    <div className="space-y-6">
      
      {/* Quick Friendly Intro Card */}
      <div className="bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-cyan-950/30 p-5 rounded-3xl border border-slate-800/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              The Metric Tensor: GPS of Crystallography
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono">
                {system} System
              </span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              The direct tensor <strong className="text-violet-300">[G]</strong> stores all unit cell lengths and angles (<span className="font-mono text-cyan-300">g_ij = a_i · a_j</span>). Its matrix inverse <strong className="text-cyan-300">[G*]</strong> instantly computes diffraction plane spacings (<span className="font-mono text-emerald-300">1/d² = hᵀ G* h</span>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <div className="text-right font-mono text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Unit Cell Volume</span>
            <span className="text-cyan-300 font-black text-base">{fmt(volumeV, 3)} Å³</span>
          </div>
        </div>
      </div>

      {/* Dual Tensor Showcase: Direct Metric G vs Reciprocal Metric G* */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Direct Metric Tensor G Card */}
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-5 hover:border-violet-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/20 text-violet-300 text-xs font-mono font-bold uppercase">
                <Grid className="w-3.5 h-3.5" />
                <span>DIRECT SPACE [G]</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Direct Metric Tensor (g_ij = a_i · a_j)
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any cell to inspect its exact formula and physical meaning
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(metricG), 'G')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
              title="Copy Matrix G"
            >
              {copiedKey === 'G' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Interactive Matrix Box */}
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 flex items-center justify-center font-mono">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif text-violet-400 font-bold">G = </span>
              <div className="border-l-2 border-t-2 border-b-2 border-violet-500/80 rounded-l-lg py-3 px-1" />
              <div className="grid grid-cols-3 gap-2.5 text-center px-2">
                {metricG.map((row, i) =>
                  row.map((val, j) => {
                    const isSelected = selectedCell?.tensor === 'G' && selectedCell.i === i && selectedCell.j === j;
                    const isDiagonal = i === j;
                    return (
                      <button
                        key={`g-${i}-${j}`}
                        onClick={() => setSelectedCell({ tensor: 'G', i, j })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] ring-2 ring-violet-300'
                            : isDiagonal
                            ? 'bg-violet-600/20 text-violet-200 border border-violet-500/30 hover:bg-violet-600/30'
                            : 'bg-slate-800/60 text-slate-300 border border-slate-800 hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="text-[9px] text-slate-400 font-sans">
                          {i === j ? (i === 0 ? 'a² (g₁₁)' : i === 1 ? 'b² (g₂₂)' : 'c² (g₃₃)') : `g${i+1}${j+1}`}
                        </div>
                        <div className="text-xs">{fmt(val, 4)}</div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-r-2 border-t-2 border-b-2 border-violet-500/80 rounded-r-lg py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">det(G) = V²</span>
              <span className="text-violet-300 font-bold">{fmt(detG, 3)} Å⁶</span>
            </div>
            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Cell Volume V</span>
              <span className="text-cyan-300 font-bold">{fmt(volumeV, 3)} Å³</span>
            </div>
            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Trace Tr(G)</span>
              <span className="text-emerald-300 font-bold">{fmt(invariantsG.I1, 3)} Å²</span>
            </div>
          </div>
        </div>

        {/* Reciprocal Metric Tensor G* Card */}
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-5 hover:border-cyan-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold uppercase">
                <Box className="w-3.5 h-3.5" />
                <span>RECIPROCAL SPACE [G*]</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Reciprocal Metric Tensor (G* = G⁻¹)
              </h3>
              <p className="text-[11px] text-slate-400">
                Directly contracts with Miller indices (h k l) to find 1/d²
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(metricGStar), 'GStar')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
              title="Copy Matrix G*"
            >
              {copiedKey === 'GStar' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Interactive Matrix Box */}
          <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 flex items-center justify-center font-mono">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif text-cyan-400 font-bold">G* = </span>
              <div className="border-l-2 border-t-2 border-b-2 border-cyan-500/80 rounded-l-lg py-3 px-1" />
              <div className="grid grid-cols-3 gap-2.5 text-center px-2">
                {metricGStar.map((row, i) =>
                  row.map((val, j) => {
                    const isSelected = selectedCell?.tensor === 'GStar' && selectedCell.i === i && selectedCell.j === j;
                    const isDiagonal = i === j;
                    return (
                      <button
                        key={`gstar-${i}-${j}`}
                        onClick={() => setSelectedCell({ tensor: 'GStar', i, j })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-2 ring-cyan-200 font-black'
                            : isDiagonal
                            ? 'bg-cyan-600/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-600/30'
                            : 'bg-slate-800/60 text-slate-300 border border-slate-800 hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="text-[9px] text-slate-400 font-sans">
                          {i === j ? (i === 0 ? 'a*² (g*₁₁)' : i === 1 ? 'b*² (g*₂₂)' : 'c*² (g*₃₃)') : `g*${i+1}${j+1}`}
                        </div>
                        <div className="text-xs">{fmt(val, 5)}</div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-r-2 border-t-2 border-b-2 border-cyan-500/80 rounded-r-lg py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">a* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(aStar, 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">b* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(bStar, 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">c* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(cStar, 4)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Matrix Cell Inspector (User-Friendly Explainer) */}
      {cellInfo && (
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block">{cellInfo.title}: <span className="text-cyan-300">{cellInfo.symbol}</span></span>
              <span className="text-slate-300 text-xs font-sans">{cellInfo.desc}</span>
            </div>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-stretch sm:self-center text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Formula & Value:</span>
            <span className="text-emerald-400 font-bold text-sm">{cellInfo.calc} = {cellInfo.value} {cellInfo.unit}</span>
          </div>
        </div>
      )}

      {/* Reciprocal Parameters & Niggli Metric Reduction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reciprocal Cell Parameters Card */}
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Reciprocal Lattice Constants & Interaxial Angles
              </h3>
              <p className="text-[11px] text-slate-400">
                Computed from reciprocal metric elements: cos(α*) = g*₂₃ / (b* · c*)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">α* (angle b*^c*)</span>
              <span className="text-white font-bold text-sm">{fmt(alphaStar, 2)}°</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">β* (angle a*^c*)</span>
              <span className="text-white font-bold text-sm">{fmt(betaStar, 2)}°</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">γ* (angle a*^b*)</span>
              <span className="text-white font-bold text-sm">{fmt(gammaStar, 2)}°</span>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/20 text-xs flex justify-between items-center font-mono">
            <span className="text-slate-300">Reciprocal Cell Volume V* = 1/V:</span>
            <span className="text-cyan-300 font-bold">{fmt(reciprocalVolumeVStar, 6)} Å⁻³</span>
          </div>
        </div>

        {/* Niggli Metric Reduction & Standard Cell */}
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Scale className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Niggli Metric 6-Vector (A, B, C, D, E, F)
              </h3>
              <p className="text-[11px] text-slate-400">
                Canonical metric representation for Bravais lattice classification
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">A = a²</span>
              <span className="text-indigo-300 font-bold">{fmt(niggliVector.A, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">B = b²</span>
              <span className="text-indigo-300 font-bold">{fmt(niggliVector.B, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">C = c²</span>
              <span className="text-indigo-300 font-bold">{fmt(niggliVector.C, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">D = 2bc cosα</span>
              <span className="text-cyan-300 font-bold">{fmt(niggliVector.D, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">E = 2ac cosβ</span>
              <span className="text-cyan-300 font-bold">{fmt(niggliVector.E, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block">F = 2ab cosγ</span>
              <span className="text-cyan-300 font-bold">{fmt(niggliVector.F, 3)}</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
            niggliVector.isNiggliOrdered
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            <span>Ordering Criterion (A ≤ B ≤ C):</span>
            <span>{niggliVector.isNiggliOrdered ? 'PASSED ✓' : 'UNORDERED (Permute axes)'}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
