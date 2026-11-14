import React, { useState, useMemo } from 'react';
import { Layers, AlertTriangle, Info, Activity, ShieldAlert, Grid } from 'lucide-react';
import { CovarianceCluster, OverlappingPair } from './PawleyLeBailTypes';

interface PawleyOverlapAnalyzerProps {
  overlappingPairs: OverlappingPair[];
  covarianceClusters: CovarianceCluster[];
  conditionNumber: number;
  negativePeakCount: number;
  totalReflections: number;
  method: 'lebail' | 'pawley' | 'comparator';
  onSelectReflection?: (id: string) => void;
}

function corrColor(r: number): string {
  // Discrete diverging Cyan (positive) <-> Slate (zero) <-> Rose/Amber (negative) ramp
  if (r >= 0.85) return '#06b6d4';
  if (r >= 0.45) return '#0e7490';
  if (r >= 0.15) return '#1e3a5f';
  if (r > -0.15) return '#1e293b';
  if (r > -0.45) return '#78350f';
  if (r > -0.75) return '#be123c';
  return '#f43f5e';
}

export const PawleyOverlapAnalyzer: React.FC<PawleyOverlapAnalyzerProps> = ({
  overlappingPairs,
  covarianceClusters,
  conditionNumber,
  negativePeakCount,
  totalReflections,
  method,
  onSelectReflection
}) => {
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(0);
  const [hoverCell, setHoverCell] = useState<{
    rowLabel: string;
    colLabel: string;
    r: number;
  } | null>(null);

  const severeOverlaps = useMemo(
    () => overlappingPairs.filter(p => p.overlapDegree > 0.5 || Math.abs(p.correlationPawley) > 0.7),
    [overlappingPairs]
  );

  const activeCluster = covarianceClusters[selectedClusterIdx] ?? covarianceClusters[0] ?? null;

  const condLabel =
    conditionNumber > 1e5
      ? 'Near-Singular'
      : conditionNumber > 500
      ? 'Ill-Conditioned'
      : conditionNumber > 50
      ? 'Moderate Coupling'
      : 'Well-Conditioned';

  const condTone =
    conditionNumber > 1e5
      ? 'text-rose-400'
      : conditionNumber > 500
      ? 'text-amber-400'
      : 'text-cyan-400';

  return (
    <div className="space-y-5">
      {/* Matrix Diagnostics Telemetry Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Overlapping Doublets</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white">
              {overlappingPairs.length}
              <span className="text-xs font-normal text-slate-500 ml-1.5">/ {totalReflections} hkl</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Severe Coupling (|R| &gt; 0.7)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-400">
              {severeOverlaps.length}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Condition No. κ(M)</div>
            <div className={`text-xl font-bold font-mono tabular-nums ${condTone}`}>
              {conditionNumber >= 1e4 ? conditionNumber.toExponential(2) : conditionNumber.toFixed(1)}
            </div>
            <div className="text-[10px] font-mono text-slate-500">{condLabel}</div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Negative I_k (Unconstrained)</div>
            <div className={`text-2xl font-bold font-mono tabular-nums ${negativePeakCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {negativePeakCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Covariance Correlation Heatmap + Theoretical Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Normal Matrix Correlation Heatmap */}
        <div className="lg:col-span-6 bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
                Pawley Inverse Matrix Correlation Heatmap (R_jk)
              </h4>
              <p className="text-[11px] text-slate-400">
                Exact statistical correlation C_jk / sqrt(C_jj · C_kk) from [Jᵀ W J + λ diag]⁻¹
              </p>
            </div>

            {covarianceClusters.length > 0 && (
              <select
                value={selectedClusterIdx}
                onChange={e => setSelectedClusterIdx(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono outline-none"
              >
                {covarianceClusters.map((c, idx) => (
                  <option key={idx} value={idx}>
                    Cluster #{idx + 1} ({c.labels.length} peaks, κ={c.conditionNumber.toFixed(1)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {activeCluster ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-max">
                  {/* Column Headers */}
                  <div className="flex items-end mb-1 pl-20 gap-[1px]">
                    {activeCluster.labels.map((lbl, cIdx) => (
                      <div
                        key={cIdx}
                        className="w-8 text-[9px] font-mono text-slate-400 text-center truncate"
                        title={`${lbl} @ ${activeCluster.twoThetas[cIdx].toFixed(2)}°`}
                      >
                        {lbl.replace(/[()]/g, '').replace(/\s+/g, '')}
                      </div>
                    ))}
                  </div>

                  {/* Matrix Rows */}
                  <div className="space-y-[1px]">
                    {activeCluster.correlationMatrix.map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-[1px]">
                        <button
                          type="button"
                          onClick={() => onSelectReflection?.(activeCluster.reflectionIds[rIdx])}
                          className="w-20 pr-2 text-right text-[10px] font-mono text-slate-300 hover:text-cyan-300 truncate cursor-pointer"
                          title={`Select ${activeCluster.labels[rIdx]}`}
                        >
                          {activeCluster.labels[rIdx]}
                        </button>
                        {row.map((val, cIdx) => (
                          <div
                            key={cIdx}
                            onMouseEnter={() =>
                              setHoverCell({
                                rowLabel: activeCluster.labels[rIdx],
                                colLabel: activeCluster.labels[cIdx],
                                r: val
                              })
                            }
                            onMouseLeave={() => setHoverCell(null)}
                            style={{ backgroundColor: corrColor(val) }}
                            className="w-8 h-8 flex items-center justify-center text-[9px] font-mono tabular-nums text-white/95 border border-slate-950/60 cursor-crosshair"
                          >
                            {val.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend + Hover Inspection */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>-1.00 (Anti-correlated)</span>
                  <div className="flex h-2.5 w-28 border border-slate-700">
                    {[-0.9, -0.5, -0.2, 0, 0.2, 0.6, 0.9].map((v, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: corrColor(v) }} />
                    ))}
                  </div>
                  <span>+1.00</span>
                </div>

                {hoverCell ? (
                  <span className="text-cyan-300 tabular-nums">
                    R[{hoverCell.rowLabel}, {hoverCell.colLabel}] = {hoverCell.r.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-slate-500">Hover matrix cell to inspect covariance</span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-lg p-4">
              <Grid className="w-6 h-6 text-slate-600" />
              <p>
                Run at least 1 Pawley or Comparator cycle (or choose a lower-symmetry material with close multiplets) to inspect the exact inverse normal matrix correlation heatmap.
              </p>
            </div>
          )}
        </div>

        {/* Methodological Contrast Card */}
        <div className="lg:col-span-6 bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 shrink-0" />
              <span>Why Pawley Covariance Anti-Correlates Adjacent Peaks</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When two reflections overlap within <span className="font-mono text-amber-300">Δ2θ &lt; FWHM</span>, the sum <span className="font-mono text-cyan-300">I₁ + I₂</span> is strongly constrained by observed counts, while the difference <span className="font-mono text-rose-300">I₁ − I₂</span> is poorly constrained. As Δ2θ → 0, columns of the Jacobian become collinear, making the Pawley normal matrix nearly singular (<span className="font-mono text-rose-400">κ(M) ≫ 10⁴</span>) with off-diagonal correlation approaching <span className="font-mono text-rose-400">R₁₂ → −1.0</span>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold font-mono text-cyan-300">Le Bail Partitioning (1988)</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No matrix inversion. Multiplicatively updates intensities proportional to prior share; unconditionally guarantees positive intensities and automatically splits exact overlaps equally when initialized uniformly.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold font-mono text-rose-300">Pawley Matrix Fitting (1981)</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Direct weighted linear least squares giving unbiased ESDs σ(I_k) and exact covariance R_jk for downstream direct methods. Requires Tikhonov/Marquardt damping λ or positivity constraints for severe overlaps.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Active Refinement Context:</span>
            <span className="text-slate-200 font-bold uppercase">{method}</span>
          </div>
        </div>
      </div>

      {/* Overlapping Pairs Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
              Overlapping Reflection Multiplets & Intensity Partitioning
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {overlappingPairs.length} pairs detected (&lt; 1.6 FWHM)
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
            <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Pair (hkl)₁ / (hkl)₂</th>
                <th className="py-2.5 px-3">2θ Positions (°)</th>
                <th className="py-2.5 px-3">Δ2θ (°)</th>
                <th className="py-2.5 px-3">Overlap Integral</th>
                <th className="py-2.5 px-3">Matrix Corr R₁₂</th>
                <th className="py-2.5 px-3 text-cyan-400">I_LeBail (1 / 2)</th>
                <th className="py-2.5 px-3 text-amber-400">I_Pawley (1 / 2)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-950">
              {overlappingPairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No overlapping reflection pairs within 1.6 FWHM in the active angular window. Try a lower-symmetry crystal system (e.g., Forsterite, Zirconia, Microcline).
                  </td>
                </tr>
              ) : (
                overlappingPairs.map((pair, idx) => {
                  const isSevere = pair.overlapDegree > 0.55 || Math.abs(pair.correlationPawley) > 0.7;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectReflection?.(pair.ref1.id)}
                          className="text-cyan-300 hover:underline font-bold cursor-pointer"
                        >
                          ({pair.ref1.h} {pair.ref1.k} {pair.ref1.l})
                        </button>
                        <span className="text-slate-600 mx-1.5">/</span>
                        <button
                          type="button"
                          onClick={() => onSelectReflection?.(pair.ref2.id)}
                          className="text-amber-300 hover:underline font-bold cursor-pointer"
                        >
                          ({pair.ref2.h} {pair.ref2.k} {pair.ref2.l})
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {pair.ref1.twoTheta.toFixed(3)}° / {pair.ref2.twoTheta.toFixed(3)}°
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        {pair.deltaTwoTheta.toFixed(4)}°
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-800 h-1.5 overflow-hidden">
                            <div
                              className={isSevere ? 'h-full bg-rose-500' : 'h-full bg-amber-500'}
                              style={{ width: `${Math.min(100, pair.overlapDegree * 100)}%` }}
                            />
                          </div>
                          <span className={isSevere ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                            {(pair.overlapDegree * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={Math.abs(pair.correlationPawley) > 0.7 ? 'text-rose-400' : 'text-slate-300'}>
                          {pair.correlationPawley.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 whitespace-nowrap">
                        {pair.iLeBail1 !== undefined && pair.iLeBail2 !== undefined
                          ? `${Math.round(pair.iLeBail1)} / ${Math.round(pair.iLeBail2)}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 whitespace-nowrap">
                        {pair.iPawley1 !== undefined && pair.iPawley2 !== undefined
                          ? `${Math.round(pair.iPawley1)} / ${Math.round(pair.iPawley2)}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
