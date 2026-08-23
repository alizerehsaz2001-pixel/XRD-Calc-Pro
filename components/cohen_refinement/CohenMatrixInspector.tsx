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
  Activity,
  ArrowRight,
  Zap,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { PeakInput } from './CohenPresetsDb';
import { playSynthTone } from '../../utils/sound';

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
  variance?: number;
  dof?: number;
  sumResidualSquare?: number;
  crystalSystem?: string;
  wavelength?: number;
  driftType?: string;
}

export const FormatSci: React.FC<{ val: number; digits?: number; className?: string }> = ({
  val,
  digits = 4,
  className = ''
}) => {
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
      <sup className="text-[0.75em] font-black text-indigo-500 dark:text-indigo-300">{expNum}</sup>
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
      diag: 'text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/20 font-black border border-indigo-200 dark:border-indigo-500/30',
      val: 'text-indigo-600/90 dark:text-indigo-200/90 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/30'
    },
    emerald: {
      title: 'text-emerald-600 dark:text-emerald-400',
      diag: 'text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/20 font-black border border-emerald-200 dark:border-emerald-500/30',
      val: 'text-emerald-600/90 dark:text-emerald-200/90 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/30'
    },
    amber: {
      title: 'text-amber-600 dark:text-amber-400',
      diag: 'text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/20 font-black border border-amber-200 dark:border-amber-500/30',
      val: 'text-amber-600/90 dark:text-amber-200/90 hover:bg-amber-50/60 dark:hover:bg-amber-900/30'
    },
    cyan: {
      title: 'text-cyan-600 dark:text-cyan-400',
      diag: 'text-cyan-700 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-500/20 font-black border border-cyan-200 dark:border-cyan-500/30',
      val: 'text-cyan-600/90 dark:text-cyan-200/90 hover:bg-cyan-50/60 dark:hover:bg-cyan-900/30'
    },
    purple: {
      title: 'text-purple-600 dark:text-purple-400',
      diag: 'text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-500/20 font-black border border-purple-200 dark:border-purple-500/30',
      val: 'text-purple-600/90 dark:text-purple-200/90 hover:bg-purple-50/60 dark:hover:bg-purple-900/30'
    }
  }[accentColor];

  if (!matrix || matrix.length === 0) {
    return <div className="text-xs text-slate-400 italic p-4 text-center">Matrix data unavailable</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest font-black flex items-center justify-between">
        <span className={accentClasses.title}>{title}</span>
        <span className="text-slate-400 font-mono text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {matrix.length} × {matrix[0]?.length || 0}
        </span>
      </div>

      <div className="relative p-3 bg-white dark:bg-slate-950/90 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-x-auto shadow-sm">
        <div className="w-2 border-l-2 border-t-2 border-b-2 border-slate-300 dark:border-slate-500/60 rounded-l self-stretch my-0.5 shrink-0" />
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
                            ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50'
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
                            ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50'
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
                          className={`px-3 py-2 font-mono text-xs transition-colors rounded cursor-pointer ${
                            isDiagonal ? accentClasses.diag : accentClasses.val
                          } ${isCellHighlighted ? 'ring-1 ring-indigo-400 dark:ring-indigo-500 scale-[1.02]' : ''}`}
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
  copiedMatrix,
  variance = 0.0001,
  dof = 1,
  sumResidualSquare = 0,
  crystalSystem = 'Cubic',
  wavelength = 1.5406,
  driftType = 'nelson_riley'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'correlation' | 'stability' | 'basis' | 'export'>('overview');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [copiedPython, setCopiedPython] = useState<boolean>(false);
  const [copiedLatexSystem, setCopiedLatexSystem] = useState<boolean>(false);

  // 1. Compute Matrix Identity Test Product (P = M * M_inv)
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
        const expected = i === j ? 1 : 0;
        const err = Math.abs(sum - expected);
        if (err > maxErr) maxErr = err;
      }
    }
    return { product: P, maxError: maxErr };
  }, [matrixM, matrixMInv]);

  // 2. Compute 1-Norm Condition Number kappa_1(M) = ||M||_1 * ||M_inv||_1
  const conditionAnalysis = useMemo(() => {
    if (!matrixM || !matrixMInv || matrixM.length === 0 || matrixMInv.length === 0) {
      return { normM: 0, normMInv: 0, condNumber: 1, status: 'Unknown', color: 'slate' };
    }

    const computeNorm1 = (mat: number[][]) => {
      let maxColSum = 0;
      const r = mat.length;
      const c = mat[0].length;
      for (let j = 0; j < c; j++) {
        let colSum = 0;
        for (let i = 0; i < r; i++) {
          colSum += Math.abs(mat[i][j]);
        }
        if (colSum > maxColSum) maxColSum = colSum;
      }
      return maxColSum;
    };

    const normM = computeNorm1(matrixM);
    const normMInv = computeNorm1(matrixMInv);
    const condNumber = normM * normMInv;

    let status = 'Well-Conditioned';
    let color = 'emerald';
    if (condNumber > 1000) {
      status = 'Ill-Conditioned';
      color = 'rose';
    } else if (condNumber > 100) {
      status = 'Moderately Conditioned';
      color = 'amber';
    }

    return { normM, normMInv, condNumber, status, color };
  }, [matrixM, matrixMInv]);

  // 3. Compute Parameter Correlation Matrix R_jk = M_inv_jk / sqrt(M_inv_jj * M_inv_kk)
  const correlationMatrixData = useMemo(() => {
    if (!matrixMInv || matrixMInv.length === 0) return { R: [], highCouplings: [] };
    const n = matrixMInv.length;
    const R: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const highCouplings: { labelI: string; labelJ: string; val: number; i: number; j: number }[] = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const diagI = matrixMInv[i][i];
        const diagJ = matrixMInv[j][j];
        if (diagI > 0 && diagJ > 0) {
          R[i][j] = matrixMInv[i][j] / Math.sqrt(diagI * diagJ);
        } else {
          R[i][j] = i === j ? 1 : 0;
        }

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

  // 4. Parameter Standard Errors and Confidence Bounds
  const parameterStats = useMemo(() => {
    if (!vectorX || !matrixMInv || vectorX.length === 0) return [];
    const sigmaFit = Math.sqrt(variance);

    return vectorX.map((val, idx) => {
      const varFrac = matrixMInv[idx]?.[idx] || 0;
      const stdErr = sigmaFit * Math.sqrt(Math.max(0, varFrac));
      const relErrPct = val !== 0 ? Math.abs(stdErr / val) * 100 : 0;
      const label = matrixLabels[idx] || `Param_${idx}`;

      let physicalMeaning = '';
      if (label === 'A') physicalMeaning = 'λ²/4a² (Cubic/Tetragonal/Hex/Ortho/Mono h² multiplier)';
      else if (label === 'B') physicalMeaning = 'λ²/4b² (Orthorhombic/Monoclinic k² multiplier)';
      else if (label === 'C') physicalMeaning = 'λ²/4c² (l² multiplier)';
      else if (label === 'E') physicalMeaning = 'λ² cosβ / (2ac sin²β) (Monoclinic cross-term)';
      else if (label === 'D') physicalMeaning = 'Systematic error drift function multiplier';

      return {
        label,
        val,
        stdErr,
        relErrPct,
        varFrac,
        physicalMeaning,
        ciLower: val - 1.96 * stdErr,
        ciUpper: val + 1.96 * stdErr
      };
    });
  }, [vectorX, matrixMInv, variance, matrixLabels]);

  // 5. Pre-rendered KaTeX Formulas
  const formulas = useMemo(() => {
    const render = (tex: string, display: boolean = false) => {
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode: display });
      } catch (e) {
        return tex;
      }
    };
    return {
      normalEq: render('\\mathbf{M} \\cdot \\mathbf{X} = \\mathbf{Y}', true),
      normalElem: render('M_{j,k} = \\sum_{i=1}^{N} g_{j,i} \\cdot g_{k,i}, \\quad Y_j = \\sum_{i=1}^{N} g_{j,i} \\cdot \\sin^2\\theta_{\\text{obs},i}', true),
      covarianceEq: render('\\mathbf{Cov}(\\mathbf{X}) = \\sigma_0^2 \\mathbf{M}^{-1}, \\quad \\sigma_0^2 = \\frac{\\sum e_i^2}{N - P}', true),
      correlationEq: render('R_{j,k} = \\frac{M^{-1}_{j,k}}{\\sqrt{M^{-1}_{j,j} \\cdot M^{-1}_{k,k}}} \\in [-1, 1]', true),
      condEq: render('\\kappa_1(\\mathbf{M}) = ||\\mathbf{M}||_1 \\cdot ||\\mathbf{M}^{-1}||_1', true)
    };
  }, []);

  // 6. Python NumPy Script Exporter
  const pythonScript = useMemo(() => {
    const nPeaks = validPeaks.length;
    const nParams = matrixLabels.length;

    let basisRowsStr = basisMatrix
      .map(row => '    [' + row.map(v => v.toFixed(6)).join(', ') + ']')
      .join(',\n');

    let sin2ObsStr = validPeaks
      .map(p => {
        const rad = (p.twoTheta / 2) * (Math.PI / 180);
        return Math.sin(rad) * Math.sin(rad);
      })
      .map(v => v.toFixed(6))
      .join(', ');

    return `# ==============================================================================
# Cohen's Least-Squares Refinement - Matrix Normal Equations Verification
# Crystal System: ${crystalSystem} | Drift Model: ${driftType} | Wavelength: ${wavelength} Å
# ==============================================================================

import numpy as np

# 1. Basis / Design Matrix G (${nPeaks} reflections x ${nParams} parameters)
# Columns: [${matrixLabels.join(', ')}]
G = np.array([
${basisRowsStr}
])

# 2. Observed sin^2(theta) vector (${nPeaks} reflections)
sin2_obs = np.array([${sin2ObsStr}])

# 3. Construct Normal Matrix [M] = G.T @ G and RHS Vector [Y] = G.T @ sin2_obs
M = G.T @ G
Y = G.T @ sin2_obs

# 4. Solve System: [M] {X} = {Y}  =>  {X} = [M^-1] {Y}
M_inv = np.linalg.inv(M)
X = M_inv @ Y

# 5. Matrix Quality Diagnostics
cond_number = np.linalg.cond(M)
diag_std = np.sqrt(np.diagonal(M_inv))
R = M_inv / np.outer(diag_std, diag_std)

print("="*60)
print("COHEN NORMAL EQUATIONS LEAST-SQUARES SOLUTION")
print("="*60)
print("Normal Matrix [M]:\\n", np.array2string(M, precision=4, suppress_small=True))
print("\\nCovariance Matrix [M^-1]:\\n", np.array2string(M_inv, precision=6, suppress_small=True))
print("\\nRHS Vector [Y]:\\n", Y)
print("\\nSolution Vector [X]:\\n", X)
print(f"\\nCondition Number kappa(M): {cond_number:.2f}")
print("\\nCorrelation Matrix [R]:\\n", np.array2string(R, precision=4, suppress_small=True))
`;
  }, [validPeaks, basisMatrix, matrixLabels, crystalSystem, driftType, wavelength]);

  // 7. Full LaTeX Normal Equations System
  const latexSystemStr = useMemo(() => {
    if (!matrixM || matrixM.length === 0) return '';
    const mRows = matrixM
      .map(r => r.map(v => v.toExponential(3)).join(' & '))
      .join(' \\\\\n');
    const xRows = matrixLabels.map(l => `X_{\\text{${l}}}`).join(' \\\\\n');
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
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Top Bar Header & Navigation */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Matrix Algebra Mechanics &amp; Normal Equations
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 font-bold">
                {matrixLabels.length}×{matrixLabels.length} System
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Least-squares normal equations [M] &#123;X&#125; = &#123;Y&#125;, variance-covariance matrix [M⁻¹], and conditioning diagnostics
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-950/80 rounded-2xl border border-slate-300/50 dark:border-slate-800/80 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('overview');
              playSynthTone('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Matrices &amp; Vectors</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('correlation');
              playSynthTone('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'correlation'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Correlation Heatmap</span>
            {correlationMatrixData.highCouplings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('stability');
              playSynthTone('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'stability'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Stability &amp; Identity</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('basis');
              playSynthTone('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'basis'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Basis Decomposition</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('export');
              playSynthTone('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'export'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>LaTeX &amp; Python Code</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: OVERVIEW - MATRICES & VECTORS */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Matrices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MatrixBox
              title="Normal Matrix [M] = [G]ᵀ [G]"
              matrix={matrixM}
              accentColor="indigo"
              labels={matrixLabels}
              hoveredRow={hoveredRow}
              hoveredCol={hoveredCol}
              onHoverCell={(r, c) => {
                setHoveredRow(r);
                setHoveredCol(c);
              }}
            />

            <MatrixBox
              title="Covariance Matrix [M⁻¹]"
              matrix={matrixMInv}
              accentColor="emerald"
              labels={matrixLabels}
              hoveredRow={hoveredRow}
              hoveredCol={hoveredCol}
              onHoverCell={(r, c) => {
                setHoveredRow(r);
                setHoveredCol(c);
              }}
            />
          </div>

          {/* Vectors Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                Right-Hand Side Vector [Y = Gᵀ · sin²θ_obs]:
              </span>
              <div className="flex flex-wrap gap-2">
                {vectorY.map((y, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-2 font-mono text-xs shadow-sm"
                  >
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Y<sub>{matrixLabels[idx] || idx}</sub> =
                    </span>
                    <FormatSci val={y} digits={5} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Least-Squares Solution Vector [X = M⁻¹ · Y]:
              </span>
              <div className="flex flex-wrap gap-2">
                {vectorX.map((x, idx) => (
                  <div
                    key={idx}
                    className="bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-2 font-mono text-xs shadow-sm"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      X<sub>{matrixLabels[idx] || idx}</sub> =
                    </span>
                    <FormatSci val={x} digits={5} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Parameter Standard Error & Confidence Bounds Cards */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Parameter Error Magnification &amp; Standard Deviations
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                σ(X_j) = σ_fit × √(M⁻¹_jj)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {parameterStats.map((st, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                      Parameter {st.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Var Frac: {st.varFrac.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
                    <FormatSci val={st.val} digits={5} />
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                    <span>± Std Error σ:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      <FormatSci val={st.stdErr} digits={3} />
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    {st.physicalMeaning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: CORRELATION MATRIX & HEATMAP */}
      {/* ========================================================================= */}
      {activeSubTab === 'correlation' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Normalized Correlation Matrix R_jk Definition</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              The correlation matrix R_jk = M⁻¹_jk / √(M⁻¹_jj · M⁻¹_kk) normalizes the covariance elements to the interval [-1, +1]. Off-diagonal values close to +1 or -1 indicate strong linear coupling between refined parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heatmap Visualizer */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-500" />
                  Parameter Correlation Heatmap [R]
                </span>
                <span className="text-[10px] font-mono text-slate-400">Values in [-1.0, +1.0]</span>
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

                          if (isDiagonal) {
                            bgStyle = 'bg-indigo-600 text-white font-black shadow-sm';
                          } else if (rVal > 0.7) {
                            bgStyle = 'bg-rose-500 text-white font-bold';
                          } else if (rVal > 0.3) {
                            bgStyle = 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold';
                          } else if (rVal < -0.7) {
                            bgStyle = 'bg-sky-500 text-white font-bold';
                          } else if (rVal < -0.3) {
                            bgStyle = 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold';
                          }

                          return (
                            <td
                              key={cIdx}
                              title={`Correlation between ${matrixLabels[rIdx]} and ${matrixLabels[cIdx]}: ${rVal.toFixed(4)}`}
                              className="p-1"
                            >
                              <div
                                className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center font-mono text-xs transition-transform hover:scale-105 cursor-pointer ${bgStyle}`}
                              >
                                <span>{rVal.toFixed(3)}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Strong Negative (-1.0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block" /> Uncorrelated (0.0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Strong Positive (+1.0)
                </span>
              </div>
            </div>

            {/* Coupling Diagnostic Alerts */}
            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Off-Diagonal Coupling Diagnostic</span>
              </div>

              {correlationMatrixData.highCouplings.length === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Low Parameter Coupling</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    All off-diagonal correlation elements are below $|R| &lt; 0.80$. The refined parameters are well-decoupled.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Found {correlationMatrixData.highCouplings.length} parameter pair(s) with strong statistical correlation ($|R| &gt; 0.80$):
                  </p>

                  {correlationMatrixData.highCouplings.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-amber-900 dark:text-amber-200">
                        <span>
                          {c.labelI} &amp; {c.labelJ}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px]">
                          R = {c.val.toFixed(4)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {(c.labelI === 'D' || c.labelJ === 'D')
                          ? 'Systematic zero-shift or absorption error is heavily coupled with unit cell dimensions. Consider adding more high-angle reflections to isolate lattice constants from systematic drift.'
                          : 'Lattice constant parameters exhibit mutual correlation. Check for pseudo-symmetric cell dimensions or indexing degeneracy.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: STABILITY & IDENTITY TEST */}
      {/* ========================================================================= */}
      {activeSubTab === 'stability' && (
        <div className="space-y-6">
          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Condition Number κ₁(M)</div>
              <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {conditionAnalysis.condNumber.toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    conditionAnalysis.color === 'emerald'
                      ? 'bg-emerald-500'
                      : conditionAnalysis.color === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={
                    conditionAnalysis.color === 'emerald'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : conditionAnalysis.color === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {conditionAnalysis.status}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Matrix 1-Norm ||M||₁</div>
              <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                <FormatSci val={conditionAnalysis.normM} digits={3} />
              </div>
              <p className="text-[10px] text-slate-400">Maximum column sum magnitude of normal matrix</p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Inverse 1-Norm ||M⁻¹||₁</div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                <FormatSci val={conditionAnalysis.normMInv} digits={3} />
              </div>
              <p className="text-[10px] text-slate-400">Error magnification coefficient for RHS noise</p>
            </div>
          </div>

          {/* Matrix Multiplication Verification (P = M * M_inv = I) */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Matrix Inversion Identity Verification Test: [P] = [M] · [M⁻¹]</span>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Max Residual Error: <span className="font-bold text-emerald-600 dark:text-emerald-400">{identityTest.maxError.toExponential(4)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Multiplying normal matrix $[M]$ by its inverse $[M^{-1}]$ yields identity matrix $[I]$ with 1.0 on diagonals and 0.0 on off-diagonals. Any departure from zero on off-diagonals indicates floating-point roundoff accumulation.
            </p>

            <MatrixBox
              title="Product Matrix [P] = [M] · [M⁻¹] (Identity Verification Test)"
              matrix={identityTest.product}
              accentColor="emerald"
              labels={matrixLabels}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: BASIS DECOMPOSITION */}
      {/* ========================================================================= */}
      {activeSubTab === 'basis' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Normal Equations Summation Mechanics</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Each reflection (h,k,l)_i generates a row of basis values g_j,i in design matrix [G]. Normal matrix elements M_j,k are calculated as the sum of dot products across all N reflections:
              <span className="block font-mono bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40 my-2 text-indigo-700 dark:text-indigo-300 text-center text-xs">
                M_j,k = ∑ (g_j,i · g_k,i)
              </span>
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Refl #</th>
                  <th className="p-3">(h, k, l)</th>
                  <th className="p-3">2θ (°)</th>
                  <th className="p-3">sin²θ_obs</th>
                  {matrixLabels.map((lbl, idx) => (
                    <th key={idx} className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">
                      g_{lbl},i
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {validPeaks.map((p, idx) => {
                  const basisRow = basisMatrix[idx] || [];
                  const rad = (p.twoTheta / 2) * (Math.PI / 180);
                  const sin2 = Math.sin(rad) * Math.sin(rad);

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 text-slate-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-indigo-700 dark:text-indigo-300">
                        ({p.h}, {p.k}, {p.l})
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{p.twoTheta.toFixed(3)}°</td>
                      <td className="p-3 text-amber-600 dark:text-amber-400">{sin2.toFixed(5)}</td>
                      {basisRow.map((gVal, gIdx) => (
                        <td key={gIdx} className="p-3 text-indigo-600 dark:text-indigo-300 font-mono">
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

      {/* ========================================================================= */}
      {/* SUB-TAB 5: EXPORT - LATEX & PYTHON SCRIPT */}
      {/* ========================================================================= */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          {/* Rendered KaTeX Formulas */}
          <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Mathematical Normal Equations &amp; Covariance Definitions
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                <span className="text-[10px] text-slate-400 block mb-1">Matrix Equation</span>
                <span dangerouslySetInnerHTML={{ __html: formulas.normalEq }} />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                <span className="text-[10px] text-slate-400 block mb-1">Covariance Matrix</span>
                <span dangerouslySetInnerHTML={{ __html: formulas.covarianceEq }} />
              </div>
            </div>
          </div>

          {/* Copyable LaTeX System Code */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-500" />
                Publication-Ready LaTeX Normal System
              </span>
              <button
                type="button"
                onClick={handleCopyLatexSystem}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
              >
                {copiedLatexSystem ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLatexSystem ? 'Copied System LaTeX' : 'Copy System LaTeX'}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-indigo-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
              {latexSystemStr}
            </pre>
          </div>

          {/* Executable Python NumPy Script */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                Executable Python / NumPy Verification Script
              </span>
              <button
                type="button"
                onClick={handleCopyPython}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
              >
                {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPython ? 'Copied Python Script' : 'Copy Python Code'}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-950 text-emerald-300/90 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
              {pythonScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
