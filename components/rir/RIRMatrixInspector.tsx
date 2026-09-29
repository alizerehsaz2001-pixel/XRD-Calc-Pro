import React, { useState, useMemo, useEffect } from 'react';
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
  FileSpreadsheet,
  Play,
  RotateCcw,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import {
  computeRIRCovariance,
  runRIRMonteCarloSimulation,
  computeDetectionLimits,
  MonteCarloResult,
  DetectionLimitResult
} from './rirMathUtils';

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
      title: 'text-indigo-400',
      diag: 'text-indigo-200 bg-indigo-500/20 font-black border border-indigo-500/30',
      val: 'text-indigo-200/90 hover:bg-indigo-900/30'
    },
    emerald: {
      title: 'text-emerald-400',
      diag: 'text-emerald-200 bg-emerald-500/20 font-black border border-emerald-500/30',
      val: 'text-emerald-200/90 hover:bg-emerald-900/30'
    },
    amber: {
      title: 'text-amber-400',
      diag: 'text-amber-200 bg-amber-500/20 font-black border border-amber-500/30',
      val: 'text-amber-200/90 hover:bg-amber-900/30'
    },
    cyan: {
      title: 'text-cyan-400',
      diag: 'text-cyan-200 bg-cyan-500/20 font-black border border-cyan-500/30',
      val: 'text-cyan-200/90 hover:bg-cyan-900/30'
    },
    purple: {
      title: 'text-purple-400',
      diag: 'text-purple-200 bg-purple-500/20 font-black border border-purple-500/30',
      val: 'text-purple-200/90 hover:bg-purple-900/30'
    },
    rose: {
      title: 'text-rose-400',
      diag: 'text-rose-200 bg-rose-500/20 font-black border border-rose-500/30',
      val: 'text-rose-200/90 hover:bg-rose-900/30'
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
        <span className="text-[10px] font-mono text-slate-400">
          {matrix.length} × {cols}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
        <table className="w-full text-xs font-mono border-collapse">
          {labels && labels.length === cols && (
            <thead>
              <tr>
                {labels.length === matrix.length && <th className="p-1.5 text-slate-400 font-sans text-[10px]"></th>}
                {labels.map((lbl, idx) => (
                  <th key={idx} className="p-1.5 text-slate-400 font-sans text-[10px] font-bold text-center truncate max-w-[80px]">
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
                  <td className="p-1.5 text-slate-400 font-sans text-[10px] font-bold text-right pr-2 truncate max-w-[80px]">
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
                          ? 'bg-slate-800/80 font-bold'
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
  const [activeTab, setActiveTab] = useState<'equations' | 'jacobian' | 'covariance' | 'monte_carlo' | 'detection_limits' | 'stability' | 'code'>('equations');
  const [hoveredCell, setHoveredCell] = useState<{ r: number | null; c: number | null }>({ r: null, c: null });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mcRunning, setMcRunning] = useState(false);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);

  const n = phases.length;
  const phaseLabels = useMemo(() => phases.map(p => p.name.split(' ')[0] || p.name), [phases]);

  // Matrix computations
  const matrixCalcs = useMemo(() => {
    return computeRIRCovariance(phases, intensityUncertaintyPct, rirUncertaintyPct);
  }, [phases, intensityUncertaintyPct, rirUncertaintyPct]);

  // Detection limits & penetration depths
  const detectionLimits = useMemo(() => {
    return computeDetectionLimits(phases, 80, 65.0);
  }, [phases]);

  // Run Monte Carlo on demand or when phases change
  const handleRunMonteCarlo = () => {
    setMcRunning(true);
    playSynthTone('tick');
    setTimeout(() => {
      const res = runRIRMonteCarloSimulation(phases, intensityUncertaintyPct, rirUncertaintyPct, 4000);
      setMcResult(res);
      setMcRunning(false);
      playSynthTone('success');
    }, 100);
  };

  useEffect(() => {
    if (activeTab === 'monte_carlo' && !mcResult) {
      handleRunMonteCarlo();
    }
  }, [activeTab]);

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
    latex += `\\mathbf{I} = \\begin{bmatrix} ${phases.map(p => (p.intensity || 0).toFixed(1)).join(' \\\\ ')} \\end{bmatrix}\n\n`;

    latex += `% RIR Vector K\n`;
    latex += `\\mathbf{K} = \\begin{bmatrix} ${phases.map(p => (p.rir || 1.0).toFixed(2)).join(' \\\\ ')} \\end{bmatrix}\n\n`;

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
              Interactive Chung adiabatic transformation vectors, Jacobian error propagation tensors, and Monte Carlo stochastic validation.
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Sensitivity:</span>
            <span className="font-mono text-xs font-bold text-cyan-400">
              {matrixCalcs.maxSensitivity.toExponential(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-950/90 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-inner">
        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('equations'); }}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'equations'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-indigo-300" />
          <span>1. Vectors & System</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('jacobian'); }}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'jacobian'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-300" />
          <span>2. Jacobian Tensors</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('covariance'); }}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'covariance'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5 text-emerald-300" />
          <span>3. Covariance Matrix</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('monte_carlo'); }}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'monte_carlo'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-300" />
          <span>4. Monte Carlo (4k Runs)</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('detection_limits'); }}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'detection_limits'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-rose-300" />
          <span>5. LOD / LOQ & Depths</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveTab('code'); }}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'code'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-purple-300" />
          <span>6. LaTeX & Python</span>
        </button>
      </div>

      {/* TAB 1: Normal Vectors & Transformation System */}
      {activeTab === 'equations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Chung Matrix Transformation Mechanics</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In matrix notation, quantitative phase analysis maps measured peak intensities (I) and reference intensity ratio constants (K) into normalized weight fractions (w) via the diagonal scaling matrix K^-1:
            </p>
            <div 
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-indigo-300 overflow-x-auto text-sm"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\mathbf{w} = \\frac{\\mathbf{K}^{-1} \\mathbf{I}}{\\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I}} = \\frac{\\tilde{\\mathbf{I}}}{\\sum_{k=1}^n \\tilde{I}_k}, \\quad \\text{where } \\tilde{I}_i = \\frac{I_i}{K_i}',
                  { displayMode: true, throwOnError: false }
                )
              }}
            />
          </div>

          {/* Grid of Vector Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">Intensity Vector I</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-indigo-300">{p.intensity} cps</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">RIR Vector K</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-emerald-300">{p.rir.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase">Reduced Int. (I / K)</span>
                <span className="text-[10px] font-mono text-slate-500">{n}×1</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {phases.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-slate-300 font-sans truncate max-w-[90px]">{p.name}</span>
                    <span className="font-bold text-cyan-300">{(p.intensity / (p.rir || 1.0)).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

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
        </div>
      )}

      {/* TAB 2: Jacobian Tensors */}
      {activeTab === 'jacobian' && (
        <div className="space-y-6 animate-in fade-in duration-300">
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
        </div>
      )}

      {/* TAB 3: Covariance & Correlation Matrix */}
      {activeTab === 'covariance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
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
        </div>
      )}

      {/* TAB 4: Monte Carlo Stochastic Simulation */}
      {activeTab === 'monte_carlo' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>4,000-Iteration Stochastic Error Engine</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluates non-linear error distribution tails and compares empirical percentiles with 1st-order analytical Taylor series.
              </p>
            </div>
            <button
              onClick={handleRunMonteCarlo}
              disabled={mcRunning}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${mcRunning ? 'animate-spin' : ''}`} />
              <span>{mcRunning ? 'Simulating...' : 'Rerun Monte Carlo'}</span>
            </button>
          </div>

          {mcResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mcResult.phaseStats.map((stat) => (
                <div key={stat.phaseId} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                      {stat.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {stat.meanWtPct.toFixed(1)} ± {stat.stdDevWtPct.toFixed(1)} wt%
                    </span>
                  </div>

                  {/* Histogram */}
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stat.histogram} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="binStart" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Bar dataKey="count" fill={stat.color} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <div>90% CI: <strong className="text-slate-200">[{stat.p05WtPct}, {stat.p95WtPct}]</strong></div>
                    <div>Skewness: <strong className="text-slate-200">{stat.skewness}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Detection Limits & X-Ray Penetration Depths */}
      {activeTab === 'detection_limits' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Limits of Detection (LOD / LOQ) & Effective Absorption Depths</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-sans">Phase Name</th>
                    <th className="px-3 py-3 text-right">PBR (I/I_bg)</th>
                    <th className="px-3 py-3 text-right text-rose-300">LOD (3σ)</th>
                    <th className="px-3 py-3 text-right text-amber-300">LOQ (10σ)</th>
                    <th className="px-3 py-3 text-right text-cyan-300">99% Depth (τ₉₉)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {detectionLimits.map(dl => (
                    <tr key={dl.phaseId} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-200 font-sans">{dl.name}</td>
                      <td className="px-3 py-3 text-right text-slate-300">{dl.pbr}×</td>
                      <td className="px-3 py-3 text-right font-bold text-rose-400">{dl.lodWtPct} wt%</td>
                      <td className="px-3 py-3 text-right font-bold text-amber-400">{dl.loqWtPct} wt%</td>
                      <td className="px-3 py-3 text-right font-bold text-cyan-400">{dl.penetrationDepthUm} µm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Code & LaTeX Export */}
      {activeTab === 'code' && (
        <div className="space-y-6 animate-in fade-in duration-300">
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

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>Standalone Python / NumPy Script</span>
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
