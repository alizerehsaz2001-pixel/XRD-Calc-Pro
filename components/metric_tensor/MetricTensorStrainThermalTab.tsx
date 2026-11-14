import React, { useState, useMemo } from 'react';
import { Activity, Flame, Sliders, Scale } from 'lucide-react';
import { LatticeParams, CrystalSystem, fmt } from './metricTensorTypes';
import {
  computeFiniteStrainTensor,
  getSymmetryAppliedAlpha,
  jacobiEigen3x3
} from './metricTensorEngine';

interface MetricTensorStrainThermalTabProps {
  system: CrystalSystem;
  params: LatticeParams;
  volumeV: number;
  metricG: number[][];
  metricGStar: number[][];
  matrixA: number[][];
  h1: number;
  k1: number;
  l1: number;
}

const STRAIN_PRESETS = [
  { name: 'Hydrostatic (-0.5% vol)', e11: -0.00167, e22: -0.00167, e33: -0.00167, e12: 0, e23: 0, e13: 0 },
  { name: 'Uniaxial c (+0.8%)', e11: -0.002, e22: -0.002, e33: 0.008, e12: 0, e23: 0, e13: 0 },
  { name: 'Biaxial In-Plane (+0.4%)', e11: 0.004, e22: 0.004, e33: -0.0025, e12: 0, e23: 0, e13: 0 },
  { name: 'Monoclinic Shear (ε₁₃ = 0.5%)', e11: 0, e22: 0, e33: 0, e12: 0, e23: 0, e13: 0.005 },
  { name: 'Pure In-Plane Shear (ε₁₂ = 0.3%)', e11: 0, e22: 0, e33: 0, e12: 0.003, e23: 0, e13: 0 },
  { name: 'Zero Strain', e11: 0, e22: 0, e33: 0, e12: 0, e23: 0, e13: 0 }
];

export const MetricTensorStrainThermalTab: React.FC<MetricTensorStrainThermalTabProps> = ({
  system,
  params,
  volumeV,
  metricG,
  metricGStar,
  matrixA,
  h1,
  k1,
  l1
}) => {
  const [e11, setE11] = useState<number>(0.002);
  const [e22, setE22] = useState<number>(0.002);
  const [e33, setE33] = useState<number>(-0.001);
  const [e12, setE12] = useState<number>(0);
  const [e23, setE23] = useState<number>(0);
  const [e13, setE13] = useState<number>(0);

  const [deltaT, setDeltaT] = useState<number>(300);
  const [alpha11, setAlpha11] = useState<number>(8.5);
  const [alpha22, setAlpha22] = useState<number>(8.5);
  const [alpha33, setAlpha33] = useState<number>(14.2);
  const [alpha13, setAlpha13] = useState<number>(1.8);

  const epsCart = useMemo(
    () => [
      [e11, e12, e13],
      [e12, e22, e23],
      [e13, e23, e33]
    ],
    [e11, e22, e33, e12, e23, e13]
  );

  const strainRes = useMemo(
    () => computeFiniteStrainTensor(matrixA, metricG, metricGStar, volumeV, epsCart, [h1, k1, l1], 1.5406),
    [matrixA, metricG, metricGStar, volumeV, epsCart, h1, k1, l1]
  );

  // Symmetry-constrained thermal expansion tensor α_ij (10^-6 K^-1)
  const alphaTensor = useMemo(
    () => getSymmetryAppliedAlpha(system, alpha11, alpha22, alpha33, alpha13),
    [system, alpha11, alpha22, alpha33, alpha13]
  );
  const alphaEigen = useMemo(() => jacobiEigen3x3(alphaTensor), [alphaTensor]);

  const thermalStrainCart = useMemo(
    () => alphaTensor.map((row) => row.map((v) => v * 1e-6 * deltaT)),
    [alphaTensor, deltaT]
  );
  const thermalMetricRes = useMemo(
    () => computeFiniteStrainTensor(matrixA, metricG, metricGStar, volumeV, thermalStrainCart, [h1, k1, l1], 1.5406),
    [matrixA, metricG, metricGStar, volumeV, thermalStrainCart, h1, k1, l1]
  );

  // SVG polar directional strain plot in XY (e1-e2) plane: eps(phi) = n^T eps n
  const polarPath = useMemo(() => {
    const cx = 110;
    const cy = 110;
    const baseR = 54;
    const maxMag = Math.max(
      0.002,
      Math.abs(strainRes.principalStrains[0]),
      Math.abs(strainRes.principalStrains[2])
    );
    const scaleR = 36 / maxMag;
    const ptsPos: string[] = [];
    const ptsRef: string[] = [];
    for (let deg = 0; deg <= 360; deg += 5) {
      const th = (deg * Math.PI) / 180;
      const nx = Math.cos(th);
      const ny = Math.sin(th);
      const epsDir = nx * nx * e11 + ny * ny * e22 + 2 * nx * ny * e12;
      const r = Math.max(10, baseR + epsDir * scaleR);
      ptsPos.push(`${deg === 0 ? 'M' : 'L'} ${(cx + r * nx).toFixed(1)} ${(cy - r * ny).toFixed(1)}`);
      ptsRef.push(`${deg === 0 ? 'M' : 'L'} ${(cx + baseR * nx).toFixed(1)} ${(cy - baseR * ny).toFixed(1)}`);
    }
    return {
      strained: ptsPos.join(' ') + ' Z',
      reference: ptsRef.join(' ') + ' Z'
    };
  }, [e11, e22, e12, strainRes.principalStrains]);

  return (
    <div className="space-y-6">
      {/* Section 1: Finite Deformation Continuum Strain Tensor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">1. Finite Continuum Strain Tensor (ε_ij in Cartesian Frame)</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">G' = Aᵀ (I + ε)² A</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STRAIN_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setE11(p.e11);
                  setE22(p.e22);
                  setE33(p.e33);
                  setE12(p.e12);
                  setE23(p.e23);
                  setE13(p.e13);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-rose-300 text-[10px] font-mono font-bold border border-slate-800 cursor-pointer whitespace-nowrap"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-300 block">Normal Strains:</span>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {[
                  { label: 'ε₁₁ (X)', val: e11, set: setE11 },
                  { label: 'ε₂₂ (Y)', val: e22, set: setE22 },
                  { label: 'ε₃₃ (Z)', val: e33, set: setE33 }
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{item.label}</span>
                    <input
                      type="number"
                      step="0.001"
                      value={item.val}
                      onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono font-bold text-xs px-1.5 py-1 rounded border border-slate-700 outline-none focus:border-rose-500 mt-1 tabular-nums"
                    />
                    <div className="text-[9px] text-rose-400 mt-0.5 font-bold tabular-nums">
                      {(item.val * 100).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-violet-300 block">Shear Components:</span>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {[
                  { label: 'ε₁₂ (XY)', val: e12, set: setE12 },
                  { label: 'ε₂₃ (YZ)', val: e23, set: setE23 },
                  { label: 'ε₁₃ (XZ)', val: e13, set: setE13 }
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{item.label}</span>
                    <input
                      type="number"
                      step="0.001"
                      value={item.val}
                      onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono font-bold text-xs px-1.5 py-1 rounded border border-slate-700 outline-none focus:border-violet-500 mt-1 tabular-nums"
                    />
                    <div className="text-[9px] text-violet-400 mt-0.5 font-bold tabular-nums">
                      {(item.val * 100).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* XRD Peak Strain Diagnostic for active reflection (h1 k1 l1) */}
          <div className="p-4 bg-slate-900/70 rounded-xl border border-cyan-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
            <div>
              <span className="text-[10px] text-slate-400 block">Target Plane</span>
              <span className="text-white font-bold">({h1} {k1} {l1})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">d₀ → d' (Å)</span>
              <span className="text-cyan-300 font-bold">
                {fmt(strainRes.dOriginal, 4)} → {fmt(strainRes.dDeformed, 4)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Planar Strain Δd/d</span>
              <span className="text-emerald-300 font-bold">
                {strainRes.relativeDStrainPct >= 0 ? '+' : ''}
                {strainRes.relativeDStrainPct.toFixed(3)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Bragg Δ(2θ) Cu Kα</span>
              <span className="text-amber-300 font-bold">
                {strainRes.deltaTwoThetaDeg !== null
                  ? `${strainRes.deltaTwoThetaDeg >= 0 ? '+' : ''}${strainRes.deltaTwoThetaDeg.toFixed(3)}°`
                  : 'Beyond Limit'}
              </span>
            </div>
          </div>
        </div>

        {/* Deformed Cell, Principal Strains & Polar Directional Ellipsoid */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Principal Strains & XY Polar Cross-Section</h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-300">
              ε_vM = {(strainRes.vonMisesStrain * 100).toFixed(3)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-6 flex justify-center">
              <svg viewBox="0 0 220 220" className="w-44 h-44 bg-slate-900/60 rounded-xl border border-slate-800">
                <line x1="15" y1="110" x2="205" y2="110" stroke="#334155" strokeWidth="1" />
                <line x1="110" y1="15" x2="110" y2="205" stroke="#334155" strokeWidth="1" />
                <path d={polarPath.reference} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                <path d={polarPath.strained} fill="rgba(244, 63, 94, 0.16)" stroke="#fb7185" strokeWidth="2" />
                <text x="190" y="105" fill="#94a3b8" fontSize="9" fontFamily="monospace">X</text>
                <text x="115" y="24" fill="#94a3b8" fontSize="9" fontFamily="monospace">Y</text>
              </svg>
            </div>

            <div className="sm:col-span-6 space-y-2 font-mono text-xs tabular-nums">
              <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex justify-between">
                <span className="text-emerald-400">ε₁ (Major)</span>
                <span className="text-white font-bold">{(strainRes.principalStrains[0] * 100).toFixed(3)}%</span>
              </div>
              <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex justify-between">
                <span className="text-emerald-400">ε₂ (Mid)</span>
                <span className="text-white font-bold">{(strainRes.principalStrains[1] * 100).toFixed(3)}%</span>
              </div>
              <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex justify-between">
                <span className="text-emerald-400">ε₃ (Minor)</span>
                <span className="text-white font-bold">{(strainRes.principalStrains[2] * 100).toFixed(3)}%</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                <span className="text-slate-400">ΔV / V₀</span>
                <span className="text-amber-300 font-bold">
                  {strainRes.volumetricStrainPct >= 0 ? '+' : ''}
                  {strainRes.volumetricStrainPct.toFixed(3)}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 tabular-nums space-y-1">
            <div>
              a' = <strong className="text-white">{fmt(strainRes.deformedParams.a, 4)}</strong> | b' ={' '}
              <strong className="text-white">{fmt(strainRes.deformedParams.b, 4)}</strong> | c' ={' '}
              <strong className="text-white">{fmt(strainRes.deformedParams.c, 4)} Å</strong>
            </div>
            <div className="text-cyan-300">
              α' = {fmt(strainRes.deformedParams.alpha, 3)}° | β' = {fmt(strainRes.deformedParams.beta, 3)}° | γ' ={' '}
              {fmt(strainRes.deformedParams.gamma, 3)}°
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Symmetry-Constrained Thermal Expansion Tensor */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                2. Neumann-Symmetrized Thermal Expansion Tensor [α_ij] ({system})
              </h3>
              <p className="text-xs text-slate-400">
                Enforces crystal point-group tensor symmetry on thermal expansion α (in 10⁻⁶ K⁻¹) and computes G(T)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 font-mono text-xs tabular-nums">
            <span className="text-amber-300 font-bold">ΔT = {deltaT > 0 ? `+${deltaT}` : deltaT} K</span>
            <input
              type="range"
              min={-250}
              max={1200}
              step={25}
              value={deltaT}
              onChange={(e) => setDeltaT(Number(e.target.value))}
              className="w-32 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs tabular-nums">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-bold block">α₁₁ [10⁻⁶ K⁻¹]</span>
            <input
              type="number"
              step="0.5"
              value={alphaTensor[0][0]}
              onChange={(e) => setAlpha11(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
            />
            <div className="text-[11px] text-slate-300">
              a(T) = <strong className="text-white">{fmt(thermalMetricRes.deformedParams.a, 4)} Å</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-bold block">
              α₂₂ {system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' ? '(tied α₁₁)' : '[10⁻⁶ K⁻¹]'}
            </span>
            <input
              type="number"
              step="0.5"
              disabled={system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' || system === 'Rhombohedral'}
              value={alphaTensor[1][1]}
              onChange={(e) => setAlpha22(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none disabled:opacity-50"
            />
            <div className="text-[11px] text-slate-300">
              b(T) = <strong className="text-white">{fmt(thermalMetricRes.deformedParams.b, 4)} Å</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-bold block">
              α₃₃ {system === 'Cubic' ? '(tied α₁₁)' : '[10⁻⁶ K⁻¹]'}
            </span>
            <input
              type="number"
              step="0.5"
              disabled={system === 'Cubic'}
              value={alphaTensor[2][2]}
              onChange={(e) => setAlpha33(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none disabled:opacity-50"
            />
            <div className="text-[11px] text-slate-300">
              c(T) = <strong className="text-white">{fmt(thermalMetricRes.deformedParams.c, 4)} Å</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-bold block">
              α₁₃ Shear {system === 'Monoclinic' || system === 'Triclinic' ? '[10⁻⁶ K⁻¹]' : '(0 by sym.)'}
            </span>
            <input
              type="number"
              step="0.2"
              disabled={system !== 'Monoclinic' && system !== 'Triclinic'}
              value={alphaTensor[0][2]}
              onChange={(e) => setAlpha13(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none disabled:opacity-50"
            />
            <div className="text-[11px] text-cyan-300">
              β(T) = <strong>{fmt(thermalMetricRes.deformedParams.beta, 3)}°</strong>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex flex-wrap justify-between items-center gap-2 font-mono text-xs tabular-nums">
          <span className="text-slate-300">
            Principal Expansions: α₁={fmt(alphaEigen.values[0], 2)}, α₂={fmt(alphaEigen.values[1], 2)}, α₃={fmt(alphaEigen.values[2], 2)} × 10⁻⁶ K⁻¹
          </span>
          <span className="text-amber-300 font-bold">
            V(T) = {fmt(thermalMetricRes.deformedVolume, 3)} Å³ (ΔV/V = {thermalMetricRes.volumetricStrainPct >= 0 ? '+' : ''}
            {thermalMetricRes.volumetricStrainPct.toFixed(3)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
