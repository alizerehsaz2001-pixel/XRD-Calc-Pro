import React, { useState, useMemo } from 'react';
import {
  Grid,
  Copy,
  Check,
  Info,
  Scale,
  Compass,
  Box,
  ArrowRightLeft,
  Activity
} from 'lucide-react';
import { LatticeParams, CrystalSystem, fmt } from './metricTensorTypes';
import {
  DirectMetricResult,
  NiggliReductionResult,
  applyBasisTransform
} from './metricTensorEngine';

interface MetricTensorOverviewTabProps {
  system: CrystalSystem;
  params: LatticeParams;
  directMetric: DirectMetricResult;
  metricGStar: number[][];
  reciprocalVolumeVStar: number;
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStar: number;
  betaStar: number;
  gammaStar: number;
  niggli: NiggliReductionResult;
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

const BASIS_PRESETS: { name: string; desc: string; P: number[][] }[] = [
  {
    name: 'Identity (I)',
    desc: 'Standard conventional basis',
    P: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  },
  {
    name: 'Rhombohedral -> Hexagonal (Obverse)',
    desc: 'det(P) = 3 | a_H = a_R - b_R, b_H = b_R - c_R, c_H = a_R + b_R + c_R',
    P: [
      [1, 0, 1],
      [-1, 1, 1],
      [0, -1, 1]
    ]
  },
  {
    name: 'Hexagonal -> Primitive Rhomb.',
    desc: '2×1×1 shear / diagnostic unimodular check',
    P: [
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  },
  {
    name: 'F-Centered -> Primitive',
    desc: 'det(P) = 0.25 | P = ½[[0,1,1],[1,0,1],[1,1,0]]',
    P: [
      [0, 0.5, 0.5],
      [0.5, 0, 0.5],
      [0.5, 0.5, 0]
    ]
  },
  {
    name: '2×2×1 Supercell',
    desc: 'det(P) = 4 | Quadruples unit cell volume',
    P: [
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 1]
    ]
  }
];

export const MetricTensorOverviewTab: React.FC<MetricTensorOverviewTabProps> = ({
  system,
  params,
  directMetric,
  metricGStar,
  reciprocalVolumeVStar,
  aStar,
  bStar,
  cStar,
  alphaStar,
  betaStar,
  gammaStar,
  niggli,
  copyToClipboard,
  copiedKey
}) => {
  const { G: metricG, detG, volumeV, invariants: invariantsG, eigen, conditionNumber } = directMetric;

  const [selectedCell, setSelectedCell] = useState<{ tensor: 'G' | 'GStar'; i: number; j: number } | null>({
    tensor: 'G',
    i: 0,
    j: 1
  });

  const [transformP, setTransformP] = useState<number[][]>(BASIS_PRESETS[0].P);
  const basisResult = useMemo(
    () => applyBasisTransform(metricG, metricGStar, transformP),
    [metricG, metricGStar, transformP]
  );

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
        [
          `(${fmt(params.a, 3)})² = ${fmt(params.a * params.a, 4)}`,
          `${fmt(params.a, 3)} × ${fmt(params.b, 3)} × cos(${fmt(params.gamma, 2)}°) = ${fmt(val, 4)}`,
          `${fmt(params.a, 3)} × ${fmt(params.c, 3)} × cos(${fmt(params.beta, 2)}°) = ${fmt(val, 4)}`
        ],
        [
          `${fmt(params.a, 3)} × ${fmt(params.b, 3)} × cos(${fmt(params.gamma, 2)}°) = ${fmt(val, 4)}`,
          `(${fmt(params.b, 3)})² = ${fmt(params.b * params.b, 4)}`,
          `${fmt(params.b, 3)} × ${fmt(params.c, 3)} × cos(${fmt(params.alpha, 2)}°) = ${fmt(val, 4)}`
        ],
        [
          `${fmt(params.a, 3)} × ${fmt(params.c, 3)} × cos(${fmt(params.beta, 2)}°) = ${fmt(val, 4)}`,
          `${fmt(params.b, 3)} × ${fmt(params.c, 3)} × cos(${fmt(params.alpha, 2)}°) = ${fmt(val, 4)}`,
          `(${fmt(params.c, 3)})² = ${fmt(params.c * params.c, 4)}`
        ]
      ];
      const descriptions = [
        [
          'Squared length of basis vector a',
          'Covariant inner product a · b controlled by interaxial angle γ',
          'Covariant inner product a · c controlled by interaxial angle β'
        ],
        [
          'Symmetric inner product b · a = a · b',
          'Squared length of basis vector b',
          'Covariant inner product b · c controlled by interaxial angle α'
        ],
        [
          'Symmetric inner product c · a = a · c',
          'Symmetric inner product c · b = b · c',
          'Squared length of basis vector c'
        ]
      ];
      return {
        title: `Direct Metric Element g${i + 1}${j + 1}`,
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
        title: `Reciprocal Metric Element g*${i + 1}${j + 1}`,
        symbol: names[i][j],
        calc: `Cofactor inverse [G]⁻¹[${i + 1},${j + 1}]`,
        desc:
          i === j
            ? `Squared reciprocal axis length (1/d² along basis ${i + 1}*)`
            : `Reciprocal coupling between basis ${i + 1}* and ${j + 1}*`,
        value: fmt(val, 5),
        unit: 'Å⁻²'
      };
    }
  };

  const cellInfo = getCellExplanation();

  return (
    <div className="space-y-6">
      {/* Dual Tensor Showcase: Direct Metric G vs Reciprocal Metric G* */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Metric Tensor G Card */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5 hover:border-violet-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Grid className="w-3.5 h-3.5" />
                <span>COVARIANT METRIC [G]</span>
              </div>
              <h3 className="text-base font-bold text-white">Direct Metric Tensor (gᵢⱼ = aᵢ · aⱼ)</h3>
              <p className="text-xs text-slate-400">Click any element to inspect its analytic basis inner product</p>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(metricG), 'G')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
              title="Copy Matrix G"
            >
              {copiedKey === 'G' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-center font-mono tabular-nums">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif text-violet-400 font-bold">G =</span>
              <div className="border-l-2 border-t-2 border-b-2 border-violet-500/70 rounded-l-md py-3 px-1" />
              <div className="grid grid-cols-3 gap-2 text-center px-1">
                {metricG.map((row, i) =>
                  row.map((val, j) => {
                    const isSelected = selectedCell?.tensor === 'G' && selectedCell.i === i && selectedCell.j === j;
                    const isDiagonal = i === j;
                    return (
                      <button
                        key={`g-${i}-${j}`}
                        onClick={() => setSelectedCell({ tensor: 'G', i, j })}
                        className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-violet-600 text-white ring-2 ring-violet-300'
                            : isDiagonal
                            ? 'bg-violet-600/20 text-violet-200 border border-violet-500/30 hover:bg-violet-600/30'
                            : 'bg-slate-800/70 text-slate-300 border border-slate-700/70 hover:bg-slate-700/70'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 font-sans">
                          {i === j ? (i === 0 ? 'a² (g₁₁)' : i === 1 ? 'b² (g₂₂)' : 'c² (g₃₃)') : `g${i + 1}${j + 1}`}
                        </div>
                        <div className="text-xs">{fmt(val, 4)}</div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-r-2 border-t-2 border-b-2 border-violet-500/70 rounded-r-md py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
            <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">det(G) = V²</span>
              <span className="text-violet-300 font-bold">{fmt(detG, 3)} Å⁶</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Cell Volume V</span>
              <span className="text-cyan-300 font-bold">{fmt(volumeV, 3)} Å³</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Invariants I₁ / I₂</span>
              <span className="text-emerald-300 font-bold">
                {fmt(invariantsG.I1, 1)} / {fmt(invariantsG.I2, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Reciprocal Metric Tensor G* Card */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5 hover:border-cyan-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Box className="w-3.5 h-3.5" />
                <span>CONTRAVARIANT METRIC [G*]</span>
              </div>
              <h3 className="text-base font-bold text-white">Reciprocal Metric Tensor (G* = G⁻¹)</h3>
              <p className="text-xs text-slate-400">Contracts with Miller indices (hkl) to evaluate 1/d²</p>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(metricGStar), 'GStar')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
              title="Copy Matrix G*"
            >
              {copiedKey === 'GStar' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-center font-mono tabular-nums">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif text-cyan-400 font-bold">G* =</span>
              <div className="border-l-2 border-t-2 border-b-2 border-cyan-500/70 rounded-l-md py-3 px-1" />
              <div className="grid grid-cols-3 gap-2 text-center px-1">
                {metricGStar.map((row, i) =>
                  row.map((val, j) => {
                    const isSelected =
                      selectedCell?.tensor === 'GStar' && selectedCell.i === i && selectedCell.j === j;
                    const isDiagonal = i === j;
                    return (
                      <button
                        key={`gstar-${i}-${j}`}
                        onClick={() => setSelectedCell({ tensor: 'GStar', i, j })}
                        className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-200 font-black'
                            : isDiagonal
                            ? 'bg-cyan-600/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-600/30'
                            : 'bg-slate-800/70 text-slate-300 border border-slate-700/70 hover:bg-slate-700/70'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 font-sans">
                          {i === j ? (i === 0 ? 'a*²' : i === 1 ? 'b*²' : 'c*²') : `g*${i + 1}${j + 1}`}
                        </div>
                        <div className="text-xs">{fmt(val, 5)}</div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-r-2 border-t-2 border-b-2 border-cyan-500/70 rounded-r-md py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
            <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">a* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(aStar, 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">b* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(bStar, 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">c* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(cStar, 4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Cell Inspector */}
      {cellInfo && (
        <div className="bg-slate-900/80 rounded-xl p-4 border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs tabular-nums">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block">
                {cellInfo.title}: <span className="text-cyan-300">{cellInfo.symbol}</span>
              </span>
              <span className="text-slate-300 text-xs font-sans">{cellInfo.desc}</span>
            </div>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 self-stretch sm:self-center text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Analytic Evaluation:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {cellInfo.calc} ({cellInfo.unit})
            </span>
          </div>
        </div>
      )}

      {/* Row 2: Reciprocal Parameters & Spectral Conditioning + Full Niggli Reduction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reciprocal Cell Parameters & Eigen-spectrum */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Reciprocal Parameters & Spectral Conditioning</h3>
              <p className="text-[11px] text-slate-400">
                Reciprocal angles cos(α*) = g*₂₃/(b*c*) and Jacobi eigenvalues of G
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs tabular-nums">
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">α* (b* ∧ c*)</span>
              <span className="text-white font-bold text-sm">{fmt(alphaStar, 3)}°</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">β* (a* ∧ c*)</span>
              <span className="text-white font-bold text-sm">{fmt(betaStar, 3)}°</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block">γ* (a* ∧ b*)</span>
              <span className="text-white font-bold text-sm">{fmt(gammaStar, 3)}°</span>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/20 rounded-lg border border-cyan-500/20 text-xs flex justify-between items-center font-mono tabular-nums">
            <span className="text-slate-300">Reciprocal Cell Volume V* = 1/V:</span>
            <span className="text-cyan-300 font-bold">{fmt(reciprocalVolumeVStar, 6)} Å⁻³</span>
          </div>

          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 font-mono text-xs tabular-nums">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-semibold">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Metric Eigenvalues λ(G) [Å²]
              </span>
              <span className="text-amber-300 font-bold">κ(G) = {fmt(conditionNumber, 2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {eigen.values.map((lam, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">λ{idx + 1} (√λ = {fmt(Math.sqrt(Math.max(0, lam)), 3)} Å)</span>
                  <span className="text-emerald-300 font-bold">{fmt(lam, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Křivý–Gruber (1976) Niggli Cell Reduction */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Křivý–Gruber Niggli Cell Reduction</h3>
                <p className="text-[11px] text-slate-400">Canonical shortest right-handed basis (G_N = Pᵀ G P)</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                niggli.isAlreadyNiggli
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {niggli.isAlreadyNiggli ? 'ALREADY NIGGLI-REDUCED' : `REDUCED IN ${niggli.iterations} STEPS`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
            {[
              { lbl: 'A_N = a_N²', val: niggli.reducedVector.A, c: 'text-indigo-300' },
              { lbl: 'B_N = b_N²', val: niggli.reducedVector.B, c: 'text-indigo-300' },
              { lbl: 'C_N = c_N²', val: niggli.reducedVector.C, c: 'text-indigo-300' },
              { lbl: 'ξ = 2bc cosα', val: niggli.reducedVector.D, c: 'text-cyan-300' },
              { lbl: 'η = 2ac cosβ', val: niggli.reducedVector.E, c: 'text-cyan-300' },
              { lbl: 'ζ = 2ab cosγ', val: niggli.reducedVector.F, c: 'text-cyan-300' }
            ].map((item) => (
              <div key={item.lbl} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{item.lbl}</span>
                <span className={`${item.c} font-bold`}>{fmt(item.val, 3)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-mono text-[11px] tabular-nums">
            <div className="sm:col-span-7 space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Reduced Parameters ({niggli.type})
              </div>
              <div className="text-white">
                a={fmt(niggli.reducedParams.a, 4)} b={fmt(niggli.reducedParams.b, 4)} c=
                {fmt(niggli.reducedParams.c, 4)} Å
              </div>
              <div className="text-cyan-300">
                α={fmt(niggli.reducedParams.alpha, 2)}° β={fmt(niggli.reducedParams.beta, 2)}° γ=
                {fmt(niggli.reducedParams.gamma, 2)}°
              </div>
              <div className="text-[10px] text-emerald-400">
                ||PᵀGP − G_N||_F = {niggli.reconstructionError.toExponential(1)} (det P = {niggli.detP})
              </div>
            </div>

            <div className="sm:col-span-5 bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Unimodular P</div>
              <div className="grid grid-cols-3 gap-1 text-indigo-300 font-bold">
                {niggli.transformP.flatMap((r, ri) =>
                  r.map((v, ci) => (
                    <span key={`p-${ri}-${ci}`} className="bg-slate-900 rounded py-0.5">
                      {Math.round(v)}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Interactive Unimodular / Supercell Basis Transformation Sandbox */}
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Basis Change & Supercell Metric Transformation Sandbox
              </h3>
              <p className="text-[11px] text-slate-400">
                Transform unit cell basis [a' b' c'] = [a b c] P with G' = Pᵀ G P and G*' = P⁻¹ G* P⁻ᵀ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {BASIS_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setTransformP(preset.P.map((r) => [...r]))}
                title={preset.desc}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 text-[11px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Editable 3x3 Transformation Matrix P */}
          <div className="lg:col-span-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-300 font-bold">Transformation Matrix P</span>
              <span className={basisResult.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                det(P) = {fmt(basisResult.detP, 3)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {transformP.map((row, ri) =>
                row.map((val, ci) => (
                  <input
                    key={`tp-${ri}-${ci}`}
                    type="number"
                    step="0.5"
                    value={val}
                    onChange={(e) => {
                      const next = transformP.map((r) => [...r]);
                      next[ri][ci] = parseFloat(e.target.value) || 0;
                      setTransformP(next);
                    }}
                    className="w-full bg-slate-950 text-white text-center font-bold text-xs py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none tabular-nums"
                  />
                ))
              )}
            </div>
          </div>

          {/* Transformed Metric G' & Parameters */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs tabular-nums">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-sans font-semibold">Transformed Metric G' = Pᵀ G P</div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {basisResult.GPrime.flatMap((row, ri) =>
                  row.map((val, ci) => (
                    <div
                      key={`gp-${ri}-${ci}`}
                      className={`py-1.5 px-2 rounded border ${
                        ri === ci
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {fmt(val, 3)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-sans font-semibold">
                Transformed Cell Parameters (V' = {fmt(basisResult.volumePrime, 3)} Å³)
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">a' (Å)</span>
                  <span className="text-white font-bold">{fmt(basisResult.paramsPrime.a, 4)}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">b' (Å)</span>
                  <span className="text-white font-bold">{fmt(basisResult.paramsPrime.b, 4)}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">c' (Å)</span>
                  <span className="text-white font-bold">{fmt(basisResult.paramsPrime.c, 4)}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">α' (°)</span>
                  <span className="text-cyan-300 font-bold">{fmt(basisResult.paramsPrime.alpha, 2)}°</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">β' (°)</span>
                  <span className="text-cyan-300 font-bold">{fmt(basisResult.paramsPrime.beta, 2)}°</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">γ' (°)</span>
                  <span className="text-cyan-300 font-bold">{fmt(basisResult.paramsPrime.gamma, 2)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
