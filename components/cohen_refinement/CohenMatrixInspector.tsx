import React, { useState } from 'react';
import { Cpu, BookOpen, Copy, Check, Sparkles, Layers, Info } from 'lucide-react';
import { PeakInput } from './CohenPresetsDb';

interface CohenMatrixInspectorProps {
  matrixM: number[][];
  matrixMInv: number[][];
  vectorY: number[];
  vectorX: number[];
  matrixLabels: string[];
  validPeaks: PeakInput[];
  basisMatrix: number[][];
  onCopyLatex: () => void;
  copiedMatrix: boolean;
}

export const FormatSci: React.FC<{ val: number; digits?: number; className?: string }> = ({ val, digits = 3, className = '' }) => {
  if (val === undefined || val === null || isNaN(val)) return <span className="font-mono text-slate-400">-</span>;
  if (val === 0) return <span className={`font-mono ${className}`}>0</span>;
  
  if (Math.abs(val) >= 0.001 && Math.abs(val) < 10000) {
    return <span className={`font-mono ${className}`}>{val.toFixed(digits)}</span>;
  }
  
  const expStr = val.toExponential(digits);
  const [mantissa, exponent] = expStr.split('e');
  const expNum = parseInt(exponent, 10);
  
  return (
    <span className={`inline-flex items-baseline gap-0.5 font-mono tracking-tight ${className}`}>
      <span>{mantissa}</span>
      <span className="text-slate-400 dark:text-slate-500 text-[0.85em] mx-0.5">×10</span>
      <sup className="text-[0.75em] font-black text-indigo-400 dark:text-indigo-300">{expNum}</sup>
    </span>
  );
};

export const MatrixBox: React.FC<{
  title: string;
  matrix: number[][];
  accentColor?: 'indigo' | 'emerald' | 'amber';
  labels?: string[];
}> = ({ title, matrix, accentColor = 'indigo', labels }) => {
  const accentClasses = {
    indigo: {
      title: 'text-indigo-600 dark:text-indigo-400',
      diag: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 font-black border border-indigo-200 dark:border-indigo-500/20',
      val: 'text-indigo-600/90 dark:text-indigo-200/90'
    },
    emerald: {
      title: 'text-emerald-600 dark:text-emerald-400',
      diag: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 font-black border border-emerald-200 dark:border-emerald-500/20',
      val: 'text-emerald-600/90 dark:text-emerald-200/90'
    },
    amber: {
      title: 'text-amber-600 dark:text-amber-400',
      diag: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 font-black border border-amber-200 dark:border-amber-500/20',
      val: 'text-amber-600/90 dark:text-amber-200/90'
    }
  }[accentColor];

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest font-black flex items-center justify-between">
        <span className={accentClasses.title}>{title}</span>
        <span className="text-slate-400 font-mono text-[9px]">{matrix.length}×{matrix[0]?.length || 0}</span>
      </div>

      <div className="relative p-3 bg-white dark:bg-slate-950/90 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-x-auto shadow-sm">
        <div className="w-2 border-l-2 border-t-2 border-b-2 border-slate-300 dark:border-slate-500/60 rounded-l self-stretch my-0.5 shrink-0" />
        <div className="overflow-x-auto px-2 py-1 my-0.5">
          <table className="border-collapse text-center">
            {labels && labels.length === matrix[0]?.length && (
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {labels.map((lbl, idx) => (
                    <th key={idx} className="px-2 py-1 text-[9px] font-mono text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {matrix.map((row, rIdx) => (
                <tr key={rIdx}>
                  {labels && labels[rIdx] && (
                    <td className="px-2 py-1 text-[9px] font-mono text-slate-400 font-bold text-right border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {labels[rIdx]}
                    </td>
                  )}
                  {row.map((val, cIdx) => {
                    const isDiagonal = rIdx === cIdx;
                    return (
                      <td
                        key={cIdx}
                        title={`Element [Row ${rIdx+1}, Col ${cIdx+1}]: ${val}`}
                        className={`px-3 py-2 font-mono text-xs transition-colors rounded-sm ${
                          isDiagonal ? accentClasses.diag : accentClasses.val
                        }`}
                      >
                        <FormatSci val={val} digits={3} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-2 border-r-2 border-t-2 border-b-2 border-slate-300 dark:border-slate-500/60 rounded-r self-stretch my-0.5 shrink-0" />
      </div>
    </div>
  );
};

export const CohenMatrixInspector: React.FC<CohenMatrixInspectorProps> = ({
  matrixM,
  matrixMInv,
  vectorY,
  vectorX,
  matrixLabels,
  validPeaks,
  basisMatrix,
  onCopyLatex,
  copiedMatrix
}) => {
  const [showMatrixDerivation, setShowMatrixDerivation] = useState<boolean>(true);
  const [showPeakTermTable, setShowPeakTermTable] = useState<boolean>(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-700 dark:text-slate-300">
            Matrix Algebra Mechanics &amp; Normal Equations
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMatrixDerivation(!showMatrixDerivation)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showMatrixDerivation ? 'Hide Theory Details' : 'Show Theory Details'}
          </button>
          <button
            type="button"
            onClick={onCopyLatex}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            {copiedMatrix ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
            {copiedMatrix ? 'Copied' : 'Copy LaTeX'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatrixBox
          title="Normal Matrix [M]"
          matrix={matrixM}
          accentColor="indigo"
          labels={matrixLabels}
        />

        <MatrixBox
          title="Covariance Matrix [M⁻¹]"
          matrix={matrixMInv}
          accentColor="emerald"
          labels={matrixLabels}
        />
      </div>

      {/* Vector Solution */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest block mb-2">
            Right-Hand Side Vector [Y]:
          </span>
          <div className="flex flex-wrap gap-2">
            {vectorY.map((y, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-mono text-xs shadow-sm">
                <span className="text-slate-400">Y<sub>{idx}</sub> =</span>
                <FormatSci val={y} digits={4} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest block mb-2">
            Solution Vector [X = M⁻¹ Y]:
          </span>
          <div className="flex flex-wrap gap-2">
            {vectorX.map((x, idx) => (
              <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1.5 font-mono text-xs shadow-sm">
                <span className="text-indigo-400 dark:text-indigo-500">X<sub>{idx}</sub> =</span>
                <FormatSci val={x} digits={4} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mathematical Derivation & Contribution Table */}
      {showMatrixDerivation && (
        <div className="mt-4 p-4 bg-slate-100/50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-indigo-900/40 text-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Matrix Elements Derivation &amp; Scientific Values Logic</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPeakTermTable(!showPeakTermTable)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold rounded flex items-center gap-1 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
              {showPeakTermTable ? 'Hide Reflection Terms Table' : 'Show Reflection-by-Reflection Contribution Table'}
            </button>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-slate-700 dark:text-slate-300 space-y-1.5 shadow-sm">
            <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>Normal Equations Summation Definition</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Every element in matrix <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300">M_j,k</code> is calculated as the sum of dot products of basis functions across all reflections:
              <span className="block font-mono bg-white dark:bg-slate-900/90 p-2 rounded border border-slate-200 dark:border-slate-800 my-1 text-indigo-700 dark:text-indigo-300 text-center shadow-sm">
                M_j,k = ∑<sub>i=1</sub><sup>N</sup> g<sub>j,i</sub> · g<sub>k,i</sub>
              </span>
            </p>
          </div>

          {showPeakTermTable && validPeaks && basisMatrix && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Reflection-by-Reflection Contribution Breakdown:</span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">Summing columns directly equals M matrix entries</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[10.5px] font-mono">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">(h, k, l)</th>
                      <th className="p-2">2θ (°)</th>
                      <th className="p-2">sin²θ</th>
                      <th className="p-2 text-indigo-600 dark:text-indigo-400">g₀,i</th>
                      <th className="p-2 text-amber-600 dark:text-amber-500">g_drift,i</th>
                      <th className="p-2 text-indigo-700 dark:text-indigo-400 font-bold">(g₀,i)²</th>
                      <th className="p-2 text-purple-600 dark:text-purple-400">g₀ · g_drift</th>
                      <th className="p-2 text-amber-600 dark:text-amber-500">(g_drift)²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {validPeaks.map((p, idx) => {
                      const basis = basisMatrix[idx] || [];
                      const g0 = basis[0] || 0;
                      const gDrift = basis[basis.length - 1] || 0;
                      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
                      const sin2 = Math.sin(thetaRad) * Math.sin(thetaRad);

                      return (
                        <tr key={p.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors">
                          <td className="p-2 text-slate-500">#{idx + 1}</td>
                          <td className="p-2 font-bold text-indigo-700 dark:text-indigo-300">({p.h}, {p.k}, {p.l})</td>
                          <td className="p-2 font-bold">{p.twoTheta.toFixed(3)}°</td>
                          <td className="p-2">{sin2.toFixed(5)}</td>
                          <td className="p-2 text-indigo-600 dark:text-indigo-300">{g0.toFixed(2)}</td>
                          <td className="p-2 text-amber-600 dark:text-amber-400">{gDrift.toFixed(4)}</td>
                          <td className="p-2 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">{(g0 * g0).toFixed(2)}</td>
                          <td className="p-2 text-purple-600 dark:text-purple-300">{(g0 * gDrift).toFixed(4)}</td>
                          <td className="p-2 text-amber-600 dark:text-amber-400">{(gDrift * gDrift).toFixed(5)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
