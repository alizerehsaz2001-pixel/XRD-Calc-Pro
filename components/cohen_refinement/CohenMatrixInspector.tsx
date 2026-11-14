import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Cpu,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  Layers,
  Info,
  Grid,
  ShieldAlert,
  BarChart3,
  Code2,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PeakInput } from './CohenPresetsDb';
import { CohenPeakDetail } from './CohenSolver';
import { playSynthTone } from '../../utils/sound';

interface CohenMatrixInspectorProps {
  matrixM: number[][];
  matrixMInv: number[][];
  vectorY: number[];
  vectorX: number[];
  matrixLabels: string[];
  validPeaks: PeakInput[];
  peakDetails?: CohenPeakDetail[];
  basisMatrix: number[][];
  onCopyLatex: () => void;
  copiedMatrix: boolean;
  variance?: number;
  dof?: number;
  sumResidualSquare?: number;
  crystalSystem?: string;
  wavelength?: number;
  driftType?: string;
  weightingScheme?: string;
  eigenvalues?: number[];
  spectralConditionNumber?: number;
  vifs?: number[];
  solverResidualNorm?: number;
}

export const FormatSci: React.FC<{ val: number; digits?: number; className?: string }> = ({
  val,
  digits = 4,
  className = ''
}) => {
  if (val === undefined || val === null || isNaN(val)) return <span className="font-mono tabular-nums text-slate-400">-</span>;
  if (val === 0) return <span className={`font-mono tabular-nums ${className}`}>0</span>;

  if (Math.abs(val) >= 0.001 && Math.abs(val) < 10000) {
    return <span className={`font-mono tabular-nums ${className}`}>{val.toFixed(digits)}</span>;
  }

  const expStr = val.toExponential(digits);
  const [mantissa, exponent] = expStr.split('e');
  const expNum = parseInt(exponent, 10);

  return (
    <span className={`inline-flex items-baseline gap-0.5 font-mono tabular-nums tracking-tight ${className}`}>
      <span>{mantissa}</span>
      <span className="text-slate-400 dark:text-slate-500 text-[0.85em] mx-0.5">×10</span>
      <sup className="text-[0.75em] font-bold text-cyan-600 dark:text-cyan-300">{expNum}</sup>
    </span>
  );
};

export const MatrixBox: React.FC<{
  title: string;
  matrix: number[][];
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'purple';
  labels?: string[];
  hoveredRow?: number | null;
  hoveredCol?: number | null;
  onHoverCell?: (r: number | null, c: number | null) => void;
}> = ({
  title,
  matrix,
  accentColor = 'indigo',
  labels,
  hoveredRow = null,
  hoveredCol = null,
  onHoverCell
}) => {
  const accentClasses = {
    indigo: {
      title: 'text-indigo-600 dark:text-indigo-400',
      diag: 'text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/20 font-bold border border-indigo-200 dark:border-indigo-500/30',
      val: 'text-indigo-600/90 dark:text-indigo-200/90 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/30'
    },
    emerald: {
      title: 'text-emerald-600 dark:text-emerald-400',
      diag: 'text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/20 font-bold border border-emerald-200 dark:border-emerald-500/30',
      val: 'text-emerald-600/90 dark:text-emerald-200/90 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/30'
    },
    amber: {
      title: 'text-amber-600 dark:text-amber-400',
      diag: 'text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/20 font-bold border border-amber-200 dark:border-amber-500/30',
      val: 'text-amber-600/90 dark:text-amber-200/90 hover:bg-amber-50/60 dark:hover:bg-amber-900/30'
    },
    cyan: {
      title: 'text-cyan-600 dark:text-cyan-400',
      diag: 'text-cyan-700 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-500/20 font-bold border border-cyan-200 dark:border-cyan-500/30',
      val: 'text-cyan-600/90 dark:text-cyan-200/90 hover:bg-cyan-50/60 dark:hover:bg-cyan-900/30'
    },
    purple: {
      title: 'text-purple-600 dark:text-purple-400',
      diag: 'text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-500/20 font-bold border border-purple-200 dark:border-purple-500/30',
      val: 'text-purple-600/90 dark:text-purple-200/90 hover:bg-purple-50/60 dark:hover:bg-purple-900/30'
    }
  }[accentColor];

  if (!matrix || matrix.length === 0) {
    return <div className="text-xs text-slate-400 italic p-4 text-center">Matrix data unavailable</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
        <span className={accentClasses.title}>{title}</span>
        <span className="text-slate-500 font-mono tabular-nums text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          {matrix.length} × {matrix[0]?.length || 0}
        </span>
      </div>

      <div className="relative p-3 bg-white dark:bg-slate-950/90 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-x-auto">
        <div className="w-2 border-l-2 border-t-2 border-b-2 border-slate-300 dark:border-slate-600 rounded-l self-stretch my-0.5 shrink-0" />
        <div className="overflow-x-auto px-2 py-1 my-0.5">
          <table className="border-collapse text-center">
            {labels && labels.length === matrix[0]?.length && (
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {labels.map((lbl, idx) => {
                    const isColHighlighted = hoveredCol === idx;
                    return (
                      <th
                        key={idx}
                        className={`px-2 py-1 text-[10px] font-mono transition-colors font-bold border-b border-slate-100 dark:border-slate-800 ${
                          isColHighlighted
                            ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50'
                            : 'text-slate-400'
                        }`}
                      >
                        {lbl}
                      </th>
                    );
                  })}
                </tr>
              </thead>
            )}
            <tbody>
              {matrix.map((row, rIdx) => {
                const isRowHighlighted = hoveredRow === rIdx;
                return (
                  <tr key={rIdx}>
                    {labels && labels[rIdx] && (
                      <td
                        className={`px-2 py-1 text-[10px] font-mono transition-colors font-bold text-right border-r border-slate-100 dark:border-slate-800 whitespace-nowrap ${
                          isRowHighlighted
                            ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50'
                            : 'text-slate-400'
                        }`}
                      >
                        {labels[rIdx]}
                      </td>
                    )}
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const isCellHighlighted = hoveredRow === rIdx || hoveredCol === cIdx;
                      return (
                        <td
                          key={cIdx}
                          onMouseEnter={() => onHoverCell && onHoverCell(rIdx, cIdx)}
                          onMouseLeave={() => onHoverCell && onHoverCell(null, null)}
                          title={`[Row ${rIdx + 1} (${labels?.[rIdx] || ''}), Col ${cIdx + 1} (${labels?.[cIdx] || ''})]: ${val}`}
                          className={`px-3 py-2 font-mono tabular-nums text-xs transition-colors rounded cursor-pointer ${
                            isDiagonal ? accentClasses.diag : accentClasses.val
                          } ${isCellHighlighted ? 'ring-1 ring-cyan-400 dark:ring-cyan-500' : ''}`}
                        >
                          <FormatSci val={val} digits={3} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="w-2 border-r-2 border-t-2 border-b-2 border-slate-300 dark:border-slate-600 rounded-r self-stretch my-0.5 shrink-0" />
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
  peakDetails = [],
  basisMatrix,
  variance = 0.0001,
  crystalSystem = 'Cubic',
  wavelength = 1.54056,
  driftType = 'nelson_riley',
  weightingScheme = 'hess_hagg',
  eigenvalues = [],
  spectralConditionNumber,
  vifs = [],
  solverResidualNorm = 0
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'correlation' | 'stability' | 'basis' | 'export'>('overview');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [copiedPython, setCopiedPython] = useState<boolean>(false);
  const [copiedLatexSystem, setCopiedLatexSystem] = useState<boolean>(false);

  // 1. Matrix Identity Test Product (P = M * M_inv)
  const identityTest = useMemo(() => {
    if (!matrixM || !matrixMInv || matrixM.length === 0 || matrixMInv.length === 0) {
      return { product: [], maxError: 0 };
    }
    const n = matrixM.length;
    const P: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    let maxErr = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += matrixM[i][k] * matrixMInv[k][j];
        }
        P[i][j] = sum;
        const err = Math.abs(sum - (i === j ? 1 : 0));
        if (err > maxErr) maxErr = err;
      }
    }
    return { product: P, maxError: maxErr };
  }, [matrixM, matrixMInv]);

  // 2. Compute 1-Norm & Spectral Condition Analysis
  const conditionAnalysis = useMemo(() => {
    if (!matrixM || !matrixMInv || matrixM.length === 0 || matrixMInv.length === 0) {
      return { normM: 0, normMInv: 0, condNumber: 1, status: 'Unknown', color: 'slate' };
    }

    const computeNorm1 = (mat: number[][]) => {
      let maxColSum = 0;
      for (let j = 0; j < mat[0].length; j++) {
        let colSum = 0;
        for (let i = 0; i < mat.length; i++) colSum += Math.abs(mat[i][j]);
        if (colSum > maxColSum) maxColSum = colSum;
      }
      return maxColSum;
    };

    const normM = computeNorm1(matrixM);
    const normMInv = computeNorm1(matrixMInv);
    const condNumber = normM * normMInv;

    let status = '● Well-Conditioned';
    let color = 'emerald';
    if (condNumber > 1000) {
      status = '✖ Ill-Conditioned';
      color = 'rose';
    } else if (condNumber > 100) {
      status = '▲ Moderately Conditioned';
      color = 'amber';
    }

    return { normM, normMInv, condNumber, status, color };
  }, [matrixM, matrixMInv]);

  // 3. Parameter Correlation Matrix
  const correlationMatrixData = useMemo(() => {
    if (!matrixMInv || matrixMInv.length === 0) return { R: [], highCouplings: [] };
    const n = matrixMInv.length;
    const R: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const highCouplings: { labelI: string; labelJ: string; val: number; i: number; j: number }[] = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const diagI = matrixMInv[i][i];
        const diagJ = matrixMInv[j][j];
        R[i][j] = diagI > 0 && diagJ > 0 ? matrixMInv[i][j] / Math.sqrt(diagI * diagJ) : i === j ? 1 : 0;
        if (i < j && Math.abs(R[i][j]) > 0.8) {
          highCouplings.push({
            labelI: matrixLabels[i] || `X_${i}`,
            labelJ: matrixLabels[j] || `X_${j}`,
            val: R[i][j],
            i,
            j
          });
        }
      }
    }
    return { R, highCouplings };
  }, [matrixMInv, matrixLabels]);

  // 4. Parameter Standard Errors, VIFs & Confidence Bounds
  const parameterStats = useMemo(() => {
    if (!vectorX || !matrixMInv || vectorX.length === 0) return [];
    const sigmaFit = Math.sqrt(variance);

    return vectorX.map((val, idx) => {
      const varFrac = matrixMInv[idx]?.[idx] || 0;
      const stdErr = sigmaFit * Math.sqrt(Math.max(0, varFrac));
      const label = matrixLabels[idx] || `Param_${idx}`;
      const vif = vifs[idx] ?? 1;

      let physicalMeaning = '';
      if (label.startsWith('A')) physicalMeaning = 'λ²/4a² (or λ²/3a² in Hexagonal/Trigonal h²+hk+k²)';
      else if (label.startsWith('B')) physicalMeaning = 'λ²/4b² (Orthorhombic/Monoclinic k² term)';
      else if (label.startsWith('C')) physicalMeaning = 'λ²/4c² (l² reciprocal term)';
      else if (label.startsWith('E')) physicalMeaning = '−λ² cosβ / (2ac sin²β) (Monoclinic hl term)';
      else if (label.startsWith('S11')) physicalMeaning = '(λ²/4) a*² (Triclinic metric diagonal)';
      else if (label.startsWith('S22')) physicalMeaning = '(λ²/4) b*² (Triclinic metric diagonal)';
      else if (label.startsWith('S33')) physicalMeaning = '(λ²/4) c*² (Triclinic metric diagonal)';
      else if (label.includes('S12')) physicalMeaning = '(λ²/4) a*b* cosγ* (paired with 2hk)';
      else if (label.includes('S23')) physicalMeaning = '(λ²/4) b*c* cosα* (paired with 2kl)';
      else if (label.includes('S13')) physicalMeaning = '(λ²/4) a*c* cosβ* (paired with 2hl)';
      else if (label.startsWith('Drift') || label.startsWith('D')) physicalMeaning = 'Systematic diffractometer drift kernel coefficient';

      return {
        label,
        val,
        stdErr,
        varFrac,
        vif,
        physicalMeaning
      };
    });
  }, [vectorX, matrixMInv, variance, matrixLabels, vifs]);

  // 5. Pre-rendered KaTeX Formulas
  const formulas = useMemo(() => {
    const render = (tex: string, display: boolean = false) => {
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode: display });
      } catch {
        return tex;
      }
    };
    return {
      normalEq: render('\\mathbf{G}^T \\mathbf{W} \\mathbf{G}\\,\\mathbf{x} = \\mathbf{G}^T \\mathbf{W}\\,\\mathbf{y}, \\quad \\mathbf{W}^{1/2}\\mathbf{G} = \\mathbf{Q}\\mathbf{R}', true),
      covarianceEq: render('\\mathbf{Cov}(\\mathbf{x}) = s^2 (\\mathbf{R}^T\\mathbf{R})^{-1}, \\quad s^2 = \\frac{\\sum w_i e_i^2}{N - P}', true)
    };
  }, []);

  // 6. Weighted Python NumPy / Householder QR Verification Script
  const pythonScript = useMemo(() => {
    const nPeaks = validPeaks.length;
    const nParams = matrixLabels.length;

    const basisRowsStr = basisMatrix
      .map(row => '    [' + row.map(v => v.toFixed(6)).join(', ') + ']')
      .join(',\n');

    const sin2ObsStr = validPeaks
      .map(p => {
        const rad = (p.twoTheta / 2) * (Math.PI / 180);
        return (Math.sin(rad) ** 2).toFixed(6);
      })
      .join(', ');

    const weightsStr = (peakDetails.length === validPeaks.length
      ? peakDetails.map(d => d.weight.toFixed(6))
      : validPeaks.map(() => '1.000000')
    ).join(', ');

    return `# ==============================================================================
# Cohen's Weighted Least-Squares Refinement — Householder QR Verification
# Crystal System: ${crystalSystem} | Drift: ${driftType} | Weighting: ${weightingScheme} | λ = ${wavelength} Å
# ==============================================================================

import numpy as np

# 1. Design Matrix G (${nPeaks} reflections x ${nParams} parameters)
# Columns: [${matrixLabels.join(', ')}]
G = np.array([
${basisRowsStr}
])

# 2. Observed sin^2(theta) & Normalized Weights w_i
y = np.array([${sin2ObsStr}])
w = np.array([${weightsStr}])
W_sqrt = np.sqrt(w)[:, None]

# 3. Equilibrated Weighted QR Decomposition: W^(1/2) G = Q R
Aw = W_sqrt * G
bw = np.sqrt(w) * y
Q, R = np.linalg.qr(Aw, mode='reduced')
X_qr = np.linalg.solve(R, Q.T @ bw)

# 4. Normal Matrix M = G^T W G & Inverse M^-1 = R^-1 R^-T
M = G.T @ (w[:, None] * G)
R_inv = np.linalg.inv(R)
M_inv = R_inv @ R_inv.T

eigvals = np.linalg.eigvalsh(M)
cond_2 = eigvals.max() / max(1e-18, eigvals.min())
diag_std = np.sqrt(np.diagonal(M_inv))
Corr = M_inv / np.outer(diag_std, diag_std)
vifs = np.diagonal(np.linalg.inv(Corr))

print("QR Solution Vector X:", X_qr)
print("Spectral Condition Number kappa_2(M):", f"{cond_2:.2f}")
print("Parameter VIFs:", np.round(vifs, 3))
print("Correlation Matrix R:\\n", np.array2string(Corr, precision=4, suppress_small=True))
`;
  }, [validPeaks, peakDetails, basisMatrix, matrixLabels, crystalSystem, driftType, weightingScheme, wavelength]);

  // 7. Full LaTeX Normal Equations System
  const latexSystemStr = useMemo(() => {
    if (!matrixM || matrixM.length === 0) return '';
    const mRows = matrixM.map(r => r.map(v => v.toExponential(3)).join(' & ')).join(' \\\\\n');
    const xRows = matrixLabels.map(l => `x_{\\text{${l}}}`).join(' \\\\\n');
    const yRows = vectorY.map(v => v.toExponential(3)).join(' \\\\\n');
    return `\\begin{bmatrix}\n${mRows}\n\\end{bmatrix}\n\\begin{bmatrix}\n${xRows}\n\\end{bmatrix}\n=\n\\begin{bmatrix}\n${yRows}\n\\end{bmatrix}`;
  }, [matrixM, matrixLabels, vectorY]);

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedPython(true);
    playSynthTone('chime');
    setTimeout(() => setCopiedPython(false), 2000);
  };

  const handleCopyLatexSystem = () => {
    navigator.clipboard.writeText(latexSystemStr);
    setCopiedLatexSystem(true);
    playSynthTone('chime');
    setTimeout(() => setCopiedLatexSystem(false), 2000);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
      {/* Top Bar Header & Navigation */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 rounded-lg border border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Householder QR &amp; Normal Matrix Diagnostics
              <span className="text-[11px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                {matrixLabels.length}×{matrixLabels.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Weighted system [GᵀWG] &#123;x&#125; = [GᵀWy], covariance [M⁻¹], multicollinearity VIFs, and eigenvalue conditioning
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-950 rounded-lg border border-slate-300/60 dark:border-slate-800 self-start lg:self-auto">
          {(
            [
              { id: 'overview', label: 'Matrices & Vectors', Icon: Grid },
              { id: 'correlation', label: 'Correlation & VIF', Icon: BarChart3 },
              { id: 'stability', label: 'Spectrum & Identity', Icon: ShieldAlert },
              { id: 'basis', label: 'Design Matrix [G]', Icon: Layers },
              { id: 'export', label: 'LaTeX & Python', Icon: Code2 }
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveSubTab(id);
                playSynthTone('tick');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeSubTab === id
                  ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {id === 'correlation' && correlationMatrixData.highCouplings.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                  ▲{correlationMatrixData.highCouplings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: MATRICES & VECTORS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MatrixBox
              title="Weighted Normal Matrix [M] = Gᵀ W G"
              matrix={matrixM}
              accentColor="indigo"
              labels={matrixLabels}
              hoveredRow={hoveredRow}
              hoveredCol={hoveredCol}
              onHoverCell={(r, c) => { setHoveredRow(r); setHoveredCol(c); }}
            />

            <MatrixBox
              title="Inverse Normal Matrix [M⁻¹] = R⁻¹ R⁻ᵀ"
              matrix={matrixMInv}
              accentColor="emerald"
              labels={matrixLabels}
              hoveredRow={hoveredRow}
              hoveredCol={hoveredCol}
              onHoverCell={(r, c) => { setHoveredRow(r); setHoveredCol(c); }}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                RHS Projection Vector [Y = Gᵀ W sin²θ_obs]
              </span>
              <div className="flex flex-wrap gap-2">
                {vectorY.map((y, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-center gap-2 font-mono tabular-nums text-xs"
                  >
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      Y<sub>{matrixLabels[idx] || idx}</sub> =
                    </span>
                    <FormatSci val={y} digits={5} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                QR Parameter Solution Vector [X = R⁻¹ Qᵀ W¹/² sin²θ]
              </span>
              <div className="flex flex-wrap gap-2">
                {vectorX.map((x, idx) => (
                  <div
                    key={idx}
                    className="bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800/50 flex items-center gap-2 font-mono tabular-nums text-xs"
                  >
                    <span className="text-cyan-700 dark:text-cyan-400 font-bold">
                      X<sub>{matrixLabels[idx] || idx}</sub> =
                    </span>
                    <FormatSci val={x} digits={5} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-500" />
                Parameter Standard Errors &amp; Variance Inflation Factors (VIF)
              </span>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                σ(X_j) = s · √(M⁻¹_jj) | VIF_j = [R_corr⁻¹]_jj
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {parameterStats.map((st, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/50">
                      {st.label}
                    </span>
                    <span className={`text-[10px] font-mono tabular-nums font-bold ${
                      st.vif > 10 ? 'text-rose-600 dark:text-rose-400' : st.vif > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      VIF {st.vif.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">
                    <FormatSci val={st.val} digits={5} />
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                    <span>± Std Error σ:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      <FormatSci val={st.stdErr} digits={3} />
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {st.physicalMeaning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CORRELATION MATRIX & VIF HEATMAP */}
      {activeSubTab === 'correlation' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Normalized Correlation Matrix R_jk &amp; Collinearity</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Off-diagonal elements R_jk = M⁻¹_jk / √(M⁻¹_jj · M⁻¹_kk) ∈ [−1, +1] measure linear coupling between refined parameters. Values |R| &gt; 0.80 or VIF &gt; 10 indicate collinearity between lattice constants and systematic drift.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-500" />
                  Parameter Correlation Heatmap [R]
                </span>
                <span className="text-[10px] font-mono text-slate-400">Range [−1.0, +1.0]</span>
              </div>

              <div className="overflow-x-auto flex justify-center py-2">
                <table className="border-collapse text-center">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {matrixLabels.map((lbl, idx) => (
                        <th key={idx} className="p-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationMatrixData.R.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 text-right">
                          {matrixLabels[rIdx]}
                        </td>
                        {row.map((rVal, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          let bgStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200';
                          if (isDiagonal) bgStyle = 'bg-cyan-600 text-white font-bold';
                          else if (rVal > 0.7) bgStyle = 'bg-rose-500 text-white font-bold';
                          else if (rVal > 0.3) bgStyle = 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold';
                          else if (rVal < -0.7) bgStyle = 'bg-sky-500 text-white font-bold';
                          else if (rVal < -0.3) bgStyle = 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold';

                          return (
                            <td
                              key={cIdx}
                              title={`Correlation between ${matrixLabels[rIdx]} and ${matrixLabels[cIdx]}: ${rVal.toFixed(4)}`}
                              className="p-0.5"
                            >
                              <div className={`w-14 h-11 rounded-lg flex items-center justify-center font-mono tabular-nums text-xs ${bgStyle}`}>
                                {rVal.toFixed(3)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Strong Negative (−1.0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block" /> Uncorrelated (0.0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Strong Positive (+1.0)
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Off-Diagonal Coupling Diagnostic</span>
              </div>

              {correlationMatrixData.highCouplings.length === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>● Well-Decoupled System</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    All off-diagonal correlation coefficients satisfy |R_jk| &lt; 0.80. Unit-cell parameters and systematic drift are cleanly separated.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Detected {correlationMatrixData.highCouplings.length} parameter pair(s) with |R_jk| &gt; 0.80:
                  </p>

                  {correlationMatrixData.highCouplings.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono tabular-nums font-bold text-amber-900 dark:text-amber-200">
                        <span>{c.labelI} &amp; {c.labelJ}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-[10px]">
                          R = {c.val.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {c.labelI.includes('Drift') || c.labelJ.includes('Drift')
                          ? 'Systematic drift is strongly correlated with lattice constants. Extend measurements to higher 2θ angles (>90°) to anchor f(θ) → 0.'
                          : 'Mutual cell parameter correlation detected. Verify reflection indexing coverage across h, k, and l.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STABILITY, EIGENVALUE SPECTRUM & IDENTITY TEST */}
      {activeSubTab === 'stability' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">1-Norm Condition κ₁(M)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
                <FormatSci val={conditionAnalysis.condNumber} digits={2} />
              </div>
              <div className={`text-xs font-bold ${
                conditionAnalysis.color === 'emerald'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : conditionAnalysis.color === 'amber'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {conditionAnalysis.status}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Spectral κ₂ = λ_max/λ_min</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">
                <FormatSci val={spectralConditionNumber ?? conditionAnalysis.condNumber} digits={2} />
              </div>
              <p className="text-[10px] text-slate-400">Jacobi eigenvalue ratio of [M]</p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">QR Residual ||Mx − y||₂</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {solverResidualNorm.toExponential(2)}
              </div>
              <p className="text-[10px] text-slate-400">Direct floating-point residual</p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Matrix Norm ||M||₁</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">
                <FormatSci val={conditionAnalysis.normM} digits={3} />
              </div>
              <p className="text-[10px] text-slate-400">||M⁻¹||₁ = <FormatSci val={conditionAnalysis.normMInv} digits={2} /></p>
            </div>
          </div>

          {eigenvalues.length > 0 && (
            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span>Normal Matrix Eigenvalue Spectrum λ([M])</span>
                <span className="font-mono text-[10px] text-slate-400">Descending Jacobi Spectrum</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {eigenvalues.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono tabular-nums text-xs">
                    <div className="text-[10px] text-slate-400">λ_{idx + 1}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      <FormatSci val={ev} digits={3} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Matrix Inversion Identity Verification: [P] = [M] · [M⁻¹]</span>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-500">
                Max Identity Error: <span className="font-bold text-emerald-600 dark:text-emerald-400">{identityTest.maxError.toExponential(3)}</span>
              </div>
            </div>

            <MatrixBox
              title="Product Matrix [P] = [M] · [M⁻¹]"
              matrix={identityTest.product}
              accentColor="emerald"
              labels={matrixLabels}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BASIS DECOMPOSITION */}
      {activeSubTab === 'basis' && (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>Design Matrix [G] &amp; Weighted Normal Summation</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Each reflection generates a basis row g_i in [G], weighted by √w_i prior to equilibrated Householder QR factorization. Normal matrix elements satisfy M_j,k = ∑ w_i · g_i,j · g_i,k.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">(h, k, l)</th>
                  <th className="p-3">2θ (°)</th>
                  <th className="p-3">sin²θ_obs</th>
                  <th className="p-3">w_i</th>
                  {matrixLabels.map((lbl, idx) => (
                    <th key={idx} className="p-3 text-cyan-700 dark:text-cyan-400 font-bold">
                      g_{lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {validPeaks.map((p, idx) => {
                  const basisRow = basisMatrix[idx] || [];
                  const rad = (p.twoTheta / 2) * (Math.PI / 180);
                  const sin2 = Math.sin(rad) ** 2;
                  const w = peakDetails[idx]?.weight ?? 1;

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 text-slate-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-cyan-700 dark:text-cyan-300">
                        ({p.h}, {p.k}, {p.l})
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{p.twoTheta.toFixed(3)}°</td>
                      <td className="p-3 text-amber-600 dark:text-amber-400">{sin2.toFixed(5)}</td>
                      <td className="p-3 text-slate-500">{w.toFixed(3)}</td>
                      {basisRow.map((gVal, gIdx) => (
                        <td key={gIdx} className="p-3 text-indigo-600 dark:text-indigo-300">
                          {gVal.toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: EXPORT LATEX & PYTHON */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              Weighted QR Equations &amp; Covariance Formulation
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                <span className="text-[10px] text-slate-400 block mb-1">Householder QR Normal System</span>
                <span dangerouslySetInnerHTML={{ __html: formulas.normalEq }} />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                <span className="text-[10px] text-slate-400 block mb-1">Covariance Matrix</span>
                <span dangerouslySetInnerHTML={{ __html: formulas.covarianceEq }} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Copy className="w-4 h-4 text-cyan-500" />
                Publication-Ready LaTeX Normal System
              </span>
              <button
                type="button"
                onClick={handleCopyLatexSystem}
                className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-cyan-200 dark:border-cyan-800"
              >
                {copiedLatexSystem ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLatexSystem ? 'Copied System LaTeX' : 'Copy System LaTeX'}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-cyan-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-40">
              {latexSystemStr}
            </pre>
          </div>

          <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                Weighted QR Python / NumPy Verification Script
              </span>
              <button
                type="button"
                onClick={handleCopyPython}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
              >
                {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPython ? 'Copied Python Script' : 'Copy Python Code'}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-950 text-emerald-300/90 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
              {pythonScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
