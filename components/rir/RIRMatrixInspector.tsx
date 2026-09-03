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
  HelpCircle,
  TrendingUp,
  Percent,
  Download,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export interface RIRMatrixPhase {
  id: string;
  name: string;
  hkl: string;
  twoTheta: number;
  intensity: number;
  rir: number; // I / I_c
  density?: number; // g/cm^3
  mac?: number; // cm^2/g
  relIntensity?: number; // % relative intensity of chosen reflection (1-100)
  color?: string;
}

interface RIRMatrixInspectorProps {
  phases: RIRMatrixPhase[];
  amorphousWtPct: number;
  intensityUncertaintyPct: number;
  rirUncertaintyPct: number;
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
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose';
  labels?: string[];
  hoveredRow?: number | null;
  hoveredCol?: number | null;
  onHoverCell?: (r: number | null, c: number | null) => void;
  formatDigits?: number;
}> = ({
  title,
  matrix,
  accentColor = 'indigo',
  labels,
  hoveredRow = null,
  hoveredCol = null,
  onHoverCell,
  formatDigits = 4
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
    },
    rose: {
      title: 'text-rose-600 dark:text-rose-400',
      diag: 'text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-500/20 font-black border border-rose-200 dark:border-rose-500/30',
      val: 'text-rose-600/90 dark:text-rose-200/90 hover:bg-rose-50/60 dark:hover:bg-rose-900/30'
    }
  }[accentColor];

  if (!matrix || matrix.length === 0) {
    return <div className="text-xs text-slate-400 italic p-4 text-center">Matrix data unavailable</div>;
  }

  const cols = matrix[0]?.length || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${accentClasses.title}`}>{title}</span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
          {matrix.length} × {cols}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-inner">
        <table className="w-full text-xs font-mono border-collapse">
          {labels && labels.length === cols && (
            <thead>
              <tr>
                {labels.length === matrix.length && <th className="p-1.5 text-slate-400 font-sans text-[10px]"></th>}
                {labels.map((lbl, idx) => (
                  <th key={idx} className="p-1.5 text-slate-400 dark:text-slate-500 font-sans text-[10px] font-bold text-center truncate max-w-[80px]">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rIdx}>
                {labels && labels.length === matrix.length && (
                  <td className="p-1.5 text-slate-400 dark:text-slate-500 font-sans text-[10px] font-bold text-right pr-2 truncate max-w-[80px]">
                    {labels[rIdx]}
                  </td>
                )}
                {row.map((val, cIdx) => {
                  const isDiag = rIdx === cIdx && matrix.length === cols;
                  const isHovered = hoveredRow === rIdx || hoveredCol === cIdx;
                  return (
                    <td
                      key={cIdx}
                      onMouseEnter={() => onHoverCell?.(rIdx, cIdx)}
                      onMouseLeave={() => onHoverCell?.(null, null)}
                      className={`p-1.5 text-center transition-all duration-150 rounded ${
                        isDiag
                          ? accentClasses.diag
                          : isHovered
                          ? 'bg-slate-100 dark:bg-slate-800/80 font-bold'
                          : accentClasses.val
                      }`}
                    >
                      <FormatSci val={val} digits={formatDigits} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const RIRMatrixInspector: React.FC<RIRMatrixInspectorProps> = ({
  phases,
  amorphousWtPct,
  intensityUncertaintyPct,
  rirUncertaintyPct
}) => {
  const [activeTab, setActiveTab] = useState<'equations' | 'jacobian' | 'covariance' | 'stability' | 'code'>('equations');
  const [hoveredCell, setHoveredCell] = useState<{ r: number | null; c: number | null }>({ r: null, c: null });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const n = phases.length;
  const phaseLabels = useMemo(() => phases.map(p => p.name.split(' ')[0] || p.name), [phases]);

  // Matrix computations
  const matrixCalcs = useMemo(() => {
    if (n === 0) {
      return {
        vectorI: [],
        vectorK: [],
        vectorReducedI: [],
        vectorW: [],
        vectorV: [],
        jacobianI: [],
        jacobianK: [],
        covarI: [],
        covarK: [],
        covarW: [],
        corrW: [],
        totalReducedIntensity: 0,
        conditionNumber: 1,
        maxSensitivity: 0
      };
    }

    const vectorI = phases.map(p => p.intensity || 0);
    const vectorK = phases.map(p => (p.rir > 0 ? p.rir : 1.0));
    const vectorDensities = phases.map(p => (p.density && p.density > 0 ? p.density : 3.0));

    // Reduced intensities: \tilde{I}_i = I_i / K_i
    const vectorReducedI = vectorI.map((I_i, idx) => I_i / vectorK[idx]);
    const totalReducedIntensity = vectorReducedI.reduce((sum, val) => sum + val, 0);

    // Crystalline weight fractions w_i = \tilde{I}_i / \sum \tilde{I}_j
    const vectorW = totalReducedIntensity > 0
      ? vectorReducedI.map(rI => rI / totalReducedIntensity)
      : phases.map(() => 1 / n);

    // Volume fractions v_i = (w_i / \rho_i) / \sum (w_j / \rho_j)
    const volumeFactors = vectorW.map((w_i, idx) => w_i / vectorDensities[idx]);
    const totalVolFactor = volumeFactors.reduce((sum, val) => sum + val, 0);
    const vectorV = totalVolFactor > 0
      ? volumeFactors.map(vf => vf / totalVolFactor)
      : phases.map(() => 1 / n);

    // Jacobian Matrix with respect to Intensities: J_{I, ij} = \partial w_i / \partial I_j
    // \partial w_i / \partial I_j = \frac{1}{S \cdot K_j} (\delta_{ij} - w_i)
    const jacobianI: number[][] = [];
    for (let i = 0; i < n; i++) {
      jacobianI[i] = [];
      for (let j = 0; j < n; j++) {
        if (totalReducedIntensity <= 0) {
          jacobianI[i][j] = 0;
        } else {
          const delta = i === j ? 1 : 0;
          jacobianI[i][j] = (delta - vectorW[i]) / (totalReducedIntensity * vectorK[j]);
        }
      }
    }

    // Jacobian Matrix with respect to RIR Constants: J_{K, ij} = \partial w_i / \partial K_j
    // \partial w_i / \partial K_j = -\frac{w_i}{K_j} (\delta_{ij} - w_j)
    const jacobianK: number[][] = [];
    for (let i = 0; i < n; i++) {
      jacobianK[i] = [];
      for (let j = 0; j < n; j++) {
        const delta = i === j ? 1 : 0;
        jacobianK[i][j] = -(vectorW[i] / vectorK[j]) * (delta - vectorW[j]);
      }
    }

    // Covariance matrix of Intensity inputs \Sigma_I (assumed independent diagonal)
    // Var(I_i) = (\sigma_{I, i})^2 = (I_i \cdot relErrI)^2
    const relErrI = (intensityUncertaintyPct || 0) / 100;
    const covarI: number[][] = [];
    for (let i = 0; i < n; i++) {
      covarI[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const sigma_i = vectorI[i] * relErrI;
          covarI[i][j] = sigma_i * sigma_i;
        } else {
          covarI[i][j] = 0;
        }
      }
    }

    // Covariance matrix of RIR inputs \Sigma_K (assumed independent diagonal)
    const relErrK = (rirUncertaintyPct || 0) / 100;
    const covarK: number[][] = [];
    for (let i = 0; i < n; i++) {
      covarK[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const sigma_k = vectorK[i] * relErrK;
          covarK[i][j] = sigma_k * sigma_k;
        } else {
          covarK[i][j] = 0;
        }
      }
    }

    // Full Covariance Matrix of Output Weight Fractions:
    // \Sigma_w = J_I \Sigma_I J_I^T + J_K \Sigma_K J_K^T
    // Since \Sigma_I and \Sigma_K are diagonal:
    // \Sigma_{w, ij} = \sum_k J_{I, ik} J_{I, jk} Var(I_k) + \sum_k J_{K, ik} J_{K, jk} Var(K_k)
    const covarW: number[][] = [];
    for (let i = 0; i < n; i++) {
      covarW[i] = [];
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          const varI_k = covarI[k][k];
          const varK_k = covarK[k][k];
          sum += jacobianI[i][k] * jacobianI[j][k] * varI_k;
          sum += jacobianK[i][k] * jacobianK[j][k] * varK_k;
        }
        covarW[i][j] = sum;
      }
    }

    // Correlation Matrix: R_{ij} = \Sigma_{w, ij} / \sqrt{\Sigma_{w, ii} \Sigma_{w, jj}}
    const corrW: number[][] = [];
    for (let i = 0; i < n; i++) {
      corrW[i] = [];
      for (let j = 0; j < n; j++) {
        const var_i = covarW[i][i];
        const var_j = covarW[j][j];
        if (var_i > 0 && var_j > 0) {
          corrW[i][j] = covarW[i][j] / Math.sqrt(var_i * var_j);
        } else {
          corrW[i][j] = i === j ? 1 : 0;
        }
      }
    }

    // Condition number estimation (ratio of max to min reduced intensity)
    const validReduced = vectorReducedI.filter(v => v > 0);
    const maxReduced = validReduced.length > 0 ? Math.max(...validReduced) : 1;
    const minReduced = validReduced.length > 0 ? Math.min(...validReduced) : 1;
    const conditionNumber = minReduced > 0 ? maxReduced / minReduced : 1;

    // Max sensitivity
    let maxSens = 0;
    jacobianI.forEach(row => {
      row.forEach(val => {
        if (Math.abs(val) > maxSens) maxSens = Math.abs(val);
      });
    });

    return {
      vectorI,
      vectorK,
      vectorReducedI,
      vectorW,
      vectorV,
      jacobianI,
      jacobianK,
      covarI,
      covarK,
      covarW,
      corrW,
      totalReducedIntensity,
      conditionNumber,
      maxSensitivity: maxSens
    };
  }, [phases, intensityUncertaintyPct, rirUncertaintyPct, n]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    playSynthTone('success');
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const generateLatexReport = () => {
    let latex = `% XRD Quantitative Phase Analysis (RIR / Chung Method Matrix Formulation)\n`;
    latex += `\\begin{equation}\n`;
    latex += `  \\mathbf{w} = \\frac{\\mathbf{K}^{-1} \\mathbf{I}}{\\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I}}\n`;
    latex += `\\end{equation}\n\n`;

    latex += `% Intensity Vector I\n`;
    latex += `\\mathbf{I} = \\begin{bmatrix} ${matrixCalcs.vectorI.map(v => v.toFixed(1)).join(' \\\\ ')} \\end{bmatrix}\n\n`;

    latex += `% RIR Vector K\n`;
    latex += `\\mathbf{K} = \\begin{bmatrix} ${matrixCalcs.vectorK.map(v => v.toFixed(2)).join(' \\\\ ')} \\end{bmatrix}\n\n`;

    latex += `% Normalized Phase Weight Fractions w (wt%)\n`;
    latex += `\\mathbf{w} = \\begin{bmatrix} ${matrixCalcs.vectorW.map(v => (v * 100).toFixed(2) + '\\%').join(' \\\\ ')} \\end{bmatrix}\n\n`;

    latex += `% Covariance Matrix of Mass Fractions Sigma_w (wt%^2)\n`;
    latex += `\\mathbf{\\Sigma}_{\\mathbf{w}} = \\begin{bmatrix}\n`;
    matrixCalcs.covarW.forEach(row => {
      latex += `  ${row.map(val => (val * 10000).toExponential(3)).join(' & ')} \\\\\n`;
    });
    latex += `\\end{bmatrix}\n`;

    return latex;
  };

  const generatePythonScript = () => {
    const pNames = phases.map(p => `'${p.name.replace(/'/g, "\\'")}'`).join(', ');
    const pInt = phases.map(p => p.intensity || 0).join(', ');
    const pRir = phases.map(p => p.rir || 1.0).join(', ');
    const pRho = phases.map(p => p.density || 3.0).join(', ');

    return `#!/usr/bin/env python3
"""
XRD Quantitative Phase Analysis via Chung Matrix Formulation & Analytical Covariance
Generated by XRD Studio Matrix Engine
"""
import numpy as np

# Phase definitions
phase_names = [${pNames}]
intensity_vector = np.array([${pInt}], dtype=np.float64)
rir_vector = np.array([${pRir}], dtype=np.float64)
densities = np.array([${pRho}], dtype=np.float64)

# Uncertainties
rel_err_I = ${intensityUncertaintyPct / 100} # ±${intensityUncertaintyPct}%
rel_err_K = ${rirUncertaintyPct / 100} # ±${rirUncertaintyPct}%
amorphous_wt_pct = ${amorphousWtPct} # ${amorphousWtPct} wt%

# 1. Reduced intensities
I_tilde = intensity_vector / rir_vector
total_reduced = np.sum(I_tilde)

# 2. Crystalline weight fractions w
w_cryst = I_tilde / total_reduced

# 3. True sample weight fractions (amorphous corrected)
w_total = w_cryst * (1.0 - amorphous_wt_pct / 100.0)

# 4. Volumetric phase fractions v
v_factors = w_cryst / densities
v_cryst = v_factors / np.sum(v_factors)

# 5. Jacobian Matrices
n = len(phase_names)
J_I = np.zeros((n, n))
J_K = np.zeros((n, n))

for i in range(n):
    for j in range(n):
        delta = 1.0 if i == j else 0.0
        J_I[i, j] = (delta - w_cryst[i]) / (total_reduced * rir_vector[j])
        J_K[i, j] = -(w_cryst[i] / rir_vector[j]) * (delta - w_cryst[j])

# 6. Covariance propagation
covar_I = np.diag((intensity_vector * rel_err_I) ** 2)
covar_K = np.diag((rir_vector * rel_err_K) ** 2)

covar_w = J_I @ covar_I @ J_I.T + J_K @ covar_K @ J_K.T
std_err_w = np.sqrt(np.diag(covar_w))

# 7. Print formatted summary
print("=" * 70)
print(f"{'Phase Name':<25} | {'Int (I)':<8} | {'RIR':<6} | {'Cryst wt%':<14} | {'Cryst vol%':<10}")
print("-" * 70)
for idx, name in enumerate(phase_names):
    cryst_pct = w_cryst[idx] * 100
    err_pct = std_err_w[idx] * 100
    vol_pct = v_cryst[idx] * 100
    print(f"{name:<25} | {intensity_vector[idx]:<8.0f} | {rir_vector[idx]:<6.2f} | {cryst_pct:5.2f} ± {err_pct:4.2f}% | {vol_pct:5.2f}%")
print("=" * 70)
if amorphous_wt_pct > 0:
    print(f"Amorphous Matrix Content: {amorphous_wt_pct:.1f} wt%")
`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100 tracking-tight">
                RIR Matrix Algebra & Covariance Inspector
              </h2>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                {n}×{n} System
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive Chung adiabatic transformation vectors, Jacobian error propagation tensors, and analytical covariance matrices.
            </p>
          </div>
        </div>

        {/* Quick Diagnostics Badges */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Condition Ratio:</span>
            <span className="font-mono text-xs font-bold text-amber-400">
              {matrixCalcs.conditionNumber.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sum Reduced (Σ I_tilde):</span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {matrixCalcs.totalReducedIntensity.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-950/90 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-inner">
        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('equations'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'equations'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-indigo-300" />
          <span>1. Normal Vectors & System</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('jacobian'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'jacobian'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-300" />
          <span>2. Jacobian Tensors ($J_I$, $J_K$)</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('covariance'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'covariance'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5 text-emerald-300" />
          <span>3. Covariance & Correlation (Σ_w)</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('stability'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'stability'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
          <span>4. Stability & Sensitivity</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('code'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'code'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-purple-300" />
          <span>5. LaTeX & Python Export</span>
        </button>
      </div>

      {/* TAB 1: Normal Vectors & Transformation System */}
      {activeTab === 'equations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Theoretical Box */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Chung Matrix Transformation Mechanics</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In matrix notation, quantitative phase analysis maps measured peak intensities (I) and reference intensity ratio constants (K) into normalized weight fractions (w) via the diagonal scaling matrix K^-1:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-indigo-300 overflow-x-auto">
              <span dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\mathbf{w} = \\frac{\\mathbf{K}^{-1} \\mathbf{I}}{\\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I}} = \\frac{\\tilde{\\mathbf{I}}}{\\sum_{k=1}^n \\tilde{I}_k}, \\quad \\text{where } \\tilde{I}_i = \\frac{I_i}{K_i}',
                  { throwOnError: false, displayMode: true }
                )
              }} />
            </div>
          </div>

          {/* Grid of Vector Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vector I */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">Intensity Vector I</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-indigo-300">{p.intensity} cps</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vector K */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">RIR Vector K</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-emerald-300">{p.rir.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vector Reduced Intensity */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase">Reduced Intensity (I / K)</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-cyan-300">{matrixCalcs.vectorReducedI[idx]?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vector w */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase">Mass Fraction w</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-amber-300">{(matrixCalcs.vectorW[idx] * 100).toFixed(2)} wt%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summation Proof Table */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-200 block">Unit Partition Condition: Σ w_i ≡ 100.00%</span>
              <p className="text-slate-400 text-[11px]">Exact mass conservation verified across all crystalline components.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl font-mono font-bold text-emerald-400 text-sm">
                Σ w_i = {(matrixCalcs.vectorW.reduce((s, v) => s + v, 0) * 100).toFixed(2)}%
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl font-mono font-bold text-amber-400 text-sm">
                Σ v_i = {(matrixCalcs.vectorV.reduce((s, v) => s + v, 0) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Jacobian Tensors */}
      {activeTab === 'jacobian' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Analytical Jacobian Derivative Tensors</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Jacobian matrix J_I defines how infinitesimal fluctuations in measured peak intensity of phase j alter the calculated weight fraction of phase i:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-cyan-300 overflow-x-auto">
              <span dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'J_{I, ij} = \\frac{\\partial w_i}{\\partial I_j} = \\frac{1}{S \\cdot K_j} \\left( \\delta_{ij} - w_i \\right), \\quad \\text{where } S = \\sum_{k=1}^n \\frac{I_k}{K_k}',
                  { throwOnError: false, displayMode: true }
                )
              }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MatrixBox
              title="Intensity Jacobian Tensor J_I (∂w_i / ∂I_j)"
              matrix={matrixCalcs.jacobianI}
              labels={phaseLabels}
              accentColor="cyan"
              hoveredRow={hoveredCell.r}
              hoveredCol={hoveredCell.c}
              onHoverCell={(r, c) => setHoveredCell({ r, c })}
              formatDigits={6}
            />

            <MatrixBox
              title="RIR Sensitivity Jacobian J_K (∂w_i / ∂K_j)"
              matrix={matrixCalcs.jacobianK}
              labels={phaseLabels}
              accentColor="purple"
              hoveredRow={hoveredCell.r}
              hoveredCol={hoveredCell.c}
              onHoverCell={(r, c) => setHoveredCell({ r, c })}
              formatDigits={4}
            />
          </div>

          {/* Interactive Cell Interpretation */}
          {hoveredCell.r !== null && hoveredCell.c !== null && (
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/30 text-xs flex items-center justify-between animate-in fade-in">
              <div className="space-y-1">
                <span className="font-bold text-cyan-300">
                  Inspecting Element ({phaseLabels[hoveredCell.r]}, {phaseLabels[hoveredCell.c]}):
                </span>
                <p className="text-slate-400">
                  {hoveredCell.r === hoveredCell.c
                    ? `Self-sensitivity: Increasing intensity of ${phases[hoveredCell.r]?.name} increases its own mass fraction by ${matrixCalcs.jacobianI[hoveredCell.r][hoveredCell.c]?.toExponential(3)} per cps.`
                    : `Cross-coupling: Increasing intensity of ${phases[hoveredCell.c]?.name} depresses ${phases[hoveredCell.r]?.name} by ${matrixCalcs.jacobianI[hoveredCell.r][hoveredCell.c]?.toExponential(3)} per cps.`}
                </p>
              </div>
              <span className="font-mono font-bold text-cyan-400 text-sm bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-800/40">
                {matrixCalcs.jacobianI[hoveredCell.r][hoveredCell.c]?.toExponential(4)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Covariance & Correlation Matrix */}
      {activeTab === 'covariance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Grid className="w-4 h-4" />
              <span>Full Analytical Covariance Matrix (Σ_w)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Propagating experimental intensity variance and reference constant uncertainty through the multivariable chain rule yields the exact analytical covariance tensor:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-emerald-300 overflow-x-auto">
              <span dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\mathbf{\\Sigma}_{\\mathbf{w}} = \\mathbf{J}_{\\mathbf{I}} \\mathbf{\\Sigma}_{\\mathbf{I}} \\mathbf{J}_{\\mathbf{I}}^T + \\mathbf{J}_{\\mathbf{K}} \\mathbf{\\Sigma}_{\\mathbf{K}} \\mathbf{J}_{\\mathbf{K}}^T',
                  { throwOnError: false, displayMode: true }
                )
              }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MatrixBox
              title="Mass Fraction Covariance Matrix Σ_w"
              matrix={matrixCalcs.covarW}
              labels={phaseLabels}
              accentColor="emerald"
              hoveredRow={hoveredCell.r}
              hoveredCol={hoveredCell.c}
              onHoverCell={(r, c) => setHoveredCell({ r, c })}
              formatDigits={6}
            />

            <MatrixBox
              title="Cross-Phase Correlation Matrix R_w"
              matrix={matrixCalcs.corrW}
              labels={phaseLabels}
              accentColor="rose"
              hoveredRow={hoveredCell.r}
              hoveredCol={hoveredCell.c}
              onHoverCell={(r, c) => setHoveredCell({ r, c })}
              formatDigits={3}
            />
          </div>

          {/* Uncertainty summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {phases.map((p, idx) => {
              const variance = matrixCalcs.covarW[idx]?.[idx] || 0;
              const stdDev = Math.sqrt(Math.max(0, variance));
              const wtPct = matrixCalcs.vectorW[idx] * 100;
              const errPct = stdDev * 100;
              return (
                <div key={p.id} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="font-bold text-slate-200 text-xs block truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Variance: {variance.toExponential(3)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">{wtPct.toFixed(2)}%</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ±{errPct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Stability & Sensitivity Diagnostics */}
      {activeTab === 'stability' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Range / Condition Ratio</span>
              <span className="text-3xl font-mono font-black text-amber-400 mt-2">
                {matrixCalcs.conditionNumber.toFixed(2)}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                {matrixCalcs.conditionNumber < 10
                  ? 'Excellent numerical stability across peak intensities.'
                  : 'Noticeable intensity disparity; small peak phase may carry higher relative error.'}
              </p>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assumed Experimental Error</span>
              <div className="flex items-center gap-3 mt-2 font-mono">
                <span className="text-xl font-bold text-indigo-400">ΔI: ±{intensityUncertaintyPct}%</span>
                <span className="text-xl font-bold text-emerald-400">ΔK: ±{rirUncertaintyPct}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Independent Gaussian quadrature applied to both integrated Bragg intensities and RIR reference constants.
              </p>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Jacobian Sensitivity</span>
              <span className="text-3xl font-mono font-black text-cyan-400 mt-2">
                {matrixCalcs.maxSensitivity.toExponential(3)}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Maximum partial derivative magnitude observed across the entire linear system.
              </p>
            </div>
          </div>

          {/* Phase Sensitivity Ranking */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Phase Influence & Sensitivity Decomposition</span>
            </h3>

            <div className="space-y-3">
              {phases.map((p, idx) => {
                const selfSens = matrixCalcs.jacobianI[idx]?.[idx] || 0;
                const rirSens = matrixCalcs.jacobianK[idx]?.[idx] || 0;
                const fraction = matrixCalcs.vectorW[idx] || 0;
                return (
                  <div key={p.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
                      <span className="font-bold text-slate-200">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className="text-slate-400">
                        Peak Int Sensitivity: <span className="text-cyan-400 font-bold">{selfSens.toExponential(2)}</span>
                      </span>
                      <span className="text-slate-400">
                        RIR Sensitivity: <span className="text-purple-400 font-bold">{Math.abs(rirSens).toFixed(3)}</span>
                      </span>
                      <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                        {(fraction * 100).toFixed(1)} wt%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Code & LaTeX Export */}
      {activeTab === 'code' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* LaTeX Export */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Publication LaTeX Manuscript Snippet</span>
              </span>
              <button
                onClick={() => copyToClipboard(generateLatexReport(), 'latex')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                {copiedCode === 'latex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'latex' ? 'Copied!' : 'Copy LaTeX'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-[11px] font-mono text-indigo-300/90 overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-700">
              {generateLatexReport()}
            </pre>
          </div>

          {/* Python Export */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>Standalone Python / NumPy Reproduction Script</span>
              </span>
              <button
                onClick={() => copyToClipboard(generatePythonScript(), 'python')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                {copiedCode === 'python' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'python' ? 'Copied!' : 'Copy Python'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-56 scrollbar-thin scrollbar-thumb-slate-700">
              {generatePythonScript()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
