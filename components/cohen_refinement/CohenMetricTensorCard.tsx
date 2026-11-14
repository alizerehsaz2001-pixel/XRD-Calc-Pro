import React, { useState, useMemo } from 'react';
import { Scale, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { CrystalSystem } from './CohenPresetsDb';

interface CohenMetricTensorCardProps {
  lattice: {
    a: number;
    b: number;
    c: number;
    alphaDeg?: number;
    betaDeg?: number;
    gammaDeg?: number;
    rhombohedralA?: number;
    rhombohedralAlpha?: number;
  };
  reciprocalLattice?: {
    aStar: number;
    bStar: number;
    cStar: number;
    alphaStarDeg: number;
    betaStarDeg: number;
    gammaStarDeg: number;
    vStar: number;
  };
  sigma: {
    sigmaA: number;
    sigmaB: number;
    sigmaC: number;
    sigmaAlpha?: number;
    sigmaBeta?: number;
    sigmaGamma?: number;
    sigmaVolume: number;
    sigmaAStar?: number;
    sigmaBStar?: number;
    sigmaCStar?: number;
    sigmaAlphaStar?: number;
    sigmaBetaStar?: number;
    sigmaGammaStar?: number;
  };
  volume: number;
  crystalSystem: CrystalSystem;
  wavelength?: number;
  molarMass?: number;
  formulaUnitsZ?: number;
  precision?: number;
}

export const CohenMetricTensorCard: React.FC<CohenMetricTensorCardProps> = ({
  lattice,
  reciprocalLattice,
  sigma,
  volume,
  wavelength = 1.54056,
  molarMass = 28.0855,
  formulaUnitsZ = 8,
  precision = 4
}) => {
  const [customZ, setCustomZ] = useState<number>(formulaUnitsZ);
  const [customM, setCustomM] = useState<number>(molarMass);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(true);
  const [probeH, setProbeH] = useState<number>(1);
  const [probeK, setProbeK] = useState<number>(1);
  const [probeL, setProbeL] = useState<number>(1);

  const {
    a,
    b,
    c,
    alphaDeg = 90,
    betaDeg = 90,
    gammaDeg = 90,
    rhombohedralA,
    rhombohedralAlpha
  } = lattice;

  const alphaRad = (alphaDeg * Math.PI) / 180;
  const betaRad = (betaDeg * Math.PI) / 180;
  const gammaRad = (gammaDeg * Math.PI) / 180;

  const cosA = Math.cos(alphaRad);
  const cosB = Math.cos(betaRad);
  const cosG = Math.cos(gammaRad);

  // Direct Metric Tensor G (A^2)
  const G: number[][] = [
    [a * a, a * b * cosG, a * c * cosB],
    [b * a * cosG, b * b, b * c * cosA],
    [c * a * cosB, c * b * cosA, c * c]
  ];

  // Reciprocal Metric Tensor G* = G^-1 (A^-2)
  const detG = volume * volume;
  let GStar: number[][] = [
    [1 / (a * a), 0, 0],
    [0, 1 / (b * b), 0],
    [0, 0, 1 / (c * c)]
  ];

  if (detG > 0) {
    const invA = (G[1][1] * G[2][2] - G[1][2] * G[2][1]) / detG;
    const invB = -(G[0][1] * G[2][2] - G[0][2] * G[2][1]) / detG;
    const invC = (G[0][1] * G[1][2] - G[0][2] * G[1][1]) / detG;
    const invD = -(G[1][0] * G[2][2] - G[1][2] * G[2][0]) / detG;
    const invE = (G[0][0] * G[2][2] - G[0][2] * G[2][0]) / detG;
    const invF = -(G[0][0] * G[1][2] - G[0][2] * G[1][0]) / detG;
    const invG = (G[1][0] * G[2][1] - G[1][1] * G[2][0]) / detG;
    const invH = -(G[0][0] * G[2][1] - G[0][1] * G[2][0]) / detG;
    const invI = (G[0][0] * G[1][1] - G[0][1] * G[1][0]) / detG;
    GStar = [
      [invA, invB, invC],
      [invD, invE, invF],
      [invG, invH, invI]
    ];
  }

  const aStar = reciprocalLattice?.aStar ?? Math.sqrt(Math.max(1e-12, GStar[0][0]));
  const bStar = reciprocalLattice?.bStar ?? Math.sqrt(Math.max(1e-12, GStar[1][1]));
  const cStar = reciprocalLattice?.cStar ?? Math.sqrt(Math.max(1e-12, GStar[2][2]));
  const alphaStarDeg = reciprocalLattice?.alphaStarDeg ?? Math.acos(Math.max(-1, Math.min(1, GStar[1][2] / (bStar * cStar)))) * (180 / Math.PI);
  const betaStarDeg = reciprocalLattice?.betaStarDeg ?? Math.acos(Math.max(-1, Math.min(1, GStar[0][2] / (aStar * cStar)))) * (180 / Math.PI);
  const gammaStarDeg = reciprocalLattice?.gammaStarDeg ?? Math.acos(Math.max(-1, Math.min(1, GStar[0][1] / (aStar * bStar)))) * (180 / Math.PI);

  // X-ray Density rho = (Z * M) / (N_A * V * 10^-24)
  const NA = 6.02214076e23;
  const densityGcm3 = volume > 0 && customZ > 0 && customM > 0 ? (customZ * customM) / (NA * volume * 1e-24) : 0;
  const sigmaDensity = volume > 0 && densityGcm3 > 0 ? densityGcm3 * (sigma.sigmaVolume / volume) : 0;
  const volPerFormulaUnit = customZ > 0 ? volume / customZ : volume;
  const ppmErrorA = a > 0 ? ((sigma.sigmaA / a) * 1e6).toFixed(1) : '0';

  // Arbitrary (h,k,l) Metric Tensor Bragg Calculator: 1/d^2 = h^T G* h
  const probeCalc = useMemo(() => {
    const q =
      probeH * (GStar[0][0] * probeH + GStar[0][1] * probeK + GStar[0][2] * probeL) +
      probeK * (GStar[1][0] * probeH + GStar[1][1] * probeK + GStar[1][2] * probeL) +
      probeL * (GStar[2][0] * probeH + GStar[2][1] * probeK + GStar[2][2] * probeL);
    if (q <= 1e-10) return { d: 0, q: 0, twoTheta: null as number | null };
    const d = 1 / Math.sqrt(q);
    const sinTh = wavelength / (2 * d);
    const twoTheta = sinTh > 0 && sinTh < 1 ? 2 * Math.asin(sinTh) * (180 / Math.PI) : null;
    return { d, q, twoTheta };
  }, [probeH, probeK, probeL, GStar, wavelength]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
            Crystallographic Metric Tensor [G] / [G*] &amp; Physical Density
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 flex items-center gap-1"
        >
          <span>{showAdvancedMetrics ? 'Hide Reciprocal & Calculator' : 'Show Reciprocal & Calculator'}</span>
          {showAdvancedMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Grid: Direct Tensor & Crystallographic Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Direct Metric Tensor [G] (Å²)
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              det(G) = V² = {detG.toFixed(2)} Å⁶
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono tabular-nums text-xs overflow-x-auto">
            <table className="w-full text-center">
              <tbody>
                {G.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-1.5 ${
                          rIdx === cIdx
                            ? 'font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50/60 dark:bg-cyan-950/30 rounded'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {val.toFixed(4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>α={alphaDeg.toFixed(3)}°, β={betaDeg.toFixed(3)}°, γ={gammaDeg.toFixed(3)}°</span>
            {rhombohedralA && (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                a_r={rhombohedralA.toFixed(4)} Å, α_r={rhombohedralAlpha?.toFixed(2)}°
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              X-Ray Density ρ_calc &amp; Packing Volume
            </span>
            <span className="text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ±{ppmErrorA} ppm
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {densityGcm3.toFixed(precision)}
              </span>
              <span className="text-xs uppercase font-mono text-slate-400">g/cm³</span>
              {sigmaDensity > 0 && (
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  ±{sigmaDensity.toFixed(Math.min(6, precision + 1))}
                </span>
              )}
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              V/Z = <strong>{volPerFormulaUnit.toFixed(2)}</strong> Å³
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Formula Units Z
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={customZ}
                onChange={(e) => setCustomZ(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-2 py-1 text-xs font-mono tabular-nums rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Molar Mass M (g/mol)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.01"
                value={customM}
                onChange={(e) => setCustomM(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-full px-2 py-1 text-xs font-mono tabular-nums rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reciprocal Metric Tensor [G*] + Arbitrary (hkl) Bragg Calculator */}
      {showAdvancedMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Reciprocal Metric Tensor [G*] = [G]⁻¹ (Å⁻²)
              </span>
              <span className="text-[10px] font-mono tabular-nums text-slate-400">
                V* = {(1 / Math.max(1e-6, volume)).toFixed(5)} Å⁻³
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono tabular-nums text-xs overflow-x-auto">
              <table className="w-full text-center">
                <tbody>
                  {GStar.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-1.5 ${
                            rIdx === cIdx
                              ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 rounded'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {val.toFixed(6)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300">
              <div>a* = {aStar.toFixed(5)} ± {(sigma.sigmaAStar ?? 0).toFixed(5)} Å⁻¹</div>
              <div>α* = {alphaStarDeg.toFixed(3)} ± {(sigma.sigmaAlphaStar ?? 0).toFixed(3)}°</div>
              <div>b* = {bStar.toFixed(5)} ± {(sigma.sigmaBStar ?? 0).toFixed(5)} Å⁻¹</div>
              <div>β* = {betaStarDeg.toFixed(3)} ± {(sigma.sigmaBetaStar ?? 0).toFixed(3)}°</div>
              <div>c* = {cStar.toFixed(5)} ± {(sigma.sigmaCStar ?? 0).toFixed(5)} Å⁻¹</div>
              <div>γ* = {gammaStarDeg.toFixed(3)} ± {(sigma.sigmaGammaStar ?? 0).toFixed(3)}°</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-cyan-500" />
                Tensor Bragg Plane Probe: 1/d² = hᵀ G* h
              </span>
              <span className="text-[10px] font-mono text-slate-400">λ = {wavelength} Å</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { label: 'h', val: probeH, set: setProbeH },
                  { label: 'k', val: probeK, set: setProbeK },
                  { label: 'l', val: probeL, set: setProbeL }
                ] as const
              ).map(({ label, val, set }) => (
                <div key={label}>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Miller {label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => set(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1.5 text-xs font-mono tabular-nums text-center font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono tabular-nums">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">d_hkl</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {probeCalc.d > 0 ? `${probeCalc.d.toFixed(5)} Å` : '-'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">|q|² = 1/d²</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {probeCalc.q > 0 ? probeCalc.q.toFixed(5) : '-'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Bragg 2θ</div>
                <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                  {probeCalc.twoTheta !== null ? `${probeCalc.twoTheta.toFixed(4)}°` : 'Beyond λ'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
