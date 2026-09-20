import React from 'react';
import { Layers, AlertTriangle, Info, Zap, Hash, Activity } from 'lucide-react';
import { OverlappingPair, PeakReflection } from './PawleyLeBailTypes';

interface PawleyOverlapAnalyzerProps {
  overlappingPairs: OverlappingPair[];
  totalReflections: number;
  method: 'lebail' | 'pawley' | 'comparator';
  onSelectReflection?: (id: string) => void;
}

export const PawleyOverlapAnalyzer: React.FC<PawleyOverlapAnalyzerProps> = ({
  overlappingPairs,
  totalReflections,
  method,
  onSelectReflection
}) => {
  const severeOverlaps = overlappingPairs.filter(p => p.overlapDegree > 0.5);
  const totalPairs = overlappingPairs.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overlapping Pairs</div>
            <div className="text-2xl font-black font-mono text-white">
              {totalPairs} <span className="text-xs font-normal text-slate-500">/ {totalReflections} peaks</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Severe Doublets (&gt;50%)</div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {severeOverlaps.length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Matrix Ill-Conditioning</div>
            <div className="text-2xl font-black font-mono text-indigo-400">
              {severeOverlaps.length > 3 ? 'High (Damped)' : 'Low / Stable'}
            </div>
          </div>
        </div>
      </div>

      {/* Methodological Theory Explainer Card */}
      <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-slate-950/60 border border-indigo-500/20 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>The Peak Overlap Dilemma: Pawley Inversion vs. Le Bail Partitioning</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          When two Bragg reflections are closer than their peak profile widths (<code className="text-amber-300 font-mono">Δ2θ &lt; FWHM</code>), the normal least-squares equations in the <strong className="text-white">Pawley method</strong> become nearly linearly dependent. The off-diagonal correlation coefficient between intensities approaches <strong className="text-rose-400 font-mono">r_ij ≈ -1.0</strong>, which can cause unconstrained Pawley matrix inversion to blow up and yield unphysical negative intensities.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          Conversely, the <strong className="text-cyan-300">Le Bail method</strong> avoids matrix inversion entirely by using iterative profile partitioning:
          <code className="block bg-slate-950/80 border border-slate-800 p-2 rounded-lg font-mono text-cyan-300 my-1.5 text-[11px]">
            I_k^(n+1) = I_k^(n) * Σ_i [ (y_obs(i) * S_k(i)) / y_calc(i) ]
          </code>
          This guarantees positive intensities (<code className="text-emerald-400 font-mono">I_k &gt; 0</code>) and fast, robust convergence, but equi-partitions intensities among completely overlapping peaks if no initial structural bias is provided.
        </p>
      </div>

      {/* Overlapping Pairs Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">
              Detected Overlapping Reflection Multiplets
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by Mutual Overlap Fraction
          </span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Reflection 1 (hkl)</th>
                <th className="py-2.5 px-3">Reflection 2 (hkl)</th>
                <th className="py-2.5 px-3">Position 2θ (°)</th>
                <th className="py-2.5 px-3">Separation Δ2θ</th>
                <th className="py-2.5 px-3">Overlap Fraction</th>
                <th className="py-2.5 px-3">Pawley Matrix Correlation</th>
                <th className="py-2.5 px-3">Decomposition Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {overlappingPairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No severe reflection overlaps detected in the active angular scan.
                  </td>
                </tr>
              ) : (
                overlappingPairs.map((pair, idx) => {
                  const isSevere = pair.overlapDegree > 0.6;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-300">
                        <button
                          type="button"
                          onClick={() => onSelectReflection?.(pair.ref1.id)}
                          className="hover:underline"
                        >
                          ({pair.ref1.h} {pair.ref1.k} {pair.ref1.l})
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-violet-300">
                        <button
                          type="button"
                          onClick={() => onSelectReflection?.(pair.ref2.id)}
                          className="hover:underline"
                        >
                          ({pair.ref2.h} {pair.ref2.k} {pair.ref2.l})
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {pair.ref1.twoTheta.toFixed(3)}° / {pair.ref2.twoTheta.toFixed(3)}°
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        {pair.deltaTwoTheta.toFixed(4)}°
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isSevere ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, pair.overlapDegree * 100)}%` }}
                            />
                          </div>
                          <span className={isSevere ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                            {(pair.overlapDegree * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        <span className={isSevere ? 'text-rose-400' : 'text-slate-400'}>
                          r ≈ {pair.correlationPawley.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isSevere ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                            High Covariance (Requires Damping)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            Resolvable Doublet
                          </span>
                        )}
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
