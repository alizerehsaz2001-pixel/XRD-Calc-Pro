import React from 'react';
import { Terminal, Copy, Check, FileText, Code2, Download } from 'lucide-react';
import { LatticeParams, CrystalSystem, fmt } from './metricTensorTypes';
import { NiggliReductionResult } from './metricTensorEngine';

interface MetricTensorPythonTabProps {
  system: CrystalSystem;
  params: LatticeParams;
  metricG: number[][];
  metricGStar: number[][];
  matrixA: number[][];
  matrixB: number[][];
  detG: number;
  volumeV: number;
  niggli: NiggliReductionResult;
  h1: number;
  k1: number;
  l1: number;
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const MetricTensorPythonTab: React.FC<MetricTensorPythonTabProps> = ({
  system,
  params,
  metricG,
  metricGStar,
  matrixA,
  matrixB,
  detG,
  volumeV,
  niggli,
  h1,
  k1,
  l1,
  copyToClipboard,
  copiedKey
}) => {
  const pythonScript = `"""
Crystallographic Dual-Space Metric Tensor Script
System: ${system}
Cell: a=${params.a} A, b=${params.b} A, c=${params.c} A, alpha=${params.alpha} deg, beta=${params.beta} deg, gamma=${params.gamma} deg
"""

import numpy as np

# 1. Direct Covariant Metric Tensor G (A^2)
G = np.array(${JSON.stringify(metricG)}, dtype=np.float64)
V = float(np.sqrt(np.linalg.det(G)))

# 2. Reciprocal Contravariant Metric Tensor G* = G^-1 (A^-2)
G_star = np.linalg.inv(G)

# 3. Dual Busing-Levy Cartesian Orthogonalization Matrices
# Direct frame A (r_cart = A @ x_frac, A.T @ A == G)
A = np.array(${JSON.stringify(matrixA)}, dtype=np.float64)
# Reciprocal frame B (q_cart = B @ h_hkl, B.T @ B == G*, A.T @ B == I)
B = np.array(${JSON.stringify(matrixB)}, dtype=np.float64)

assert np.allclose(A.T @ A, G, atol=1e-8)
assert np.allclose(B.T @ B, G_star, atol=1e-8)
assert np.allclose(A.T @ B, np.eye(3), atol=1e-8)

# 4. d-Spacing of reflection (${h1} ${k1} ${l1}) via metric contraction
h = np.array([${h1}, ${k1}, ${l1}], dtype=np.float64)
inv_d2 = float(h @ G_star @ h)
d_hkl = 1.0 / np.sqrt(inv_d2)

# 5. Niggli Unimodular Transformation Matrix P (G_niggli = P.T @ G @ P)
P_niggli = np.array(${JSON.stringify(niggli.transformP)}, dtype=np.int64)
G_niggli = P_niggli.T @ G @ P_niggli

print(f"Cell Volume V = {V:.4f} A^3")
print(f"d({h1} {k1} {l1}) = {d_hkl:.5f} A")
print("Eigenvalues of G:", np.linalg.eigvalsh(G))
`;

  const pymatgenScript = `from pymatgen.core import Lattice
import numpy as np

lattice = Lattice.from_parameters(
    a=${params.a}, b=${params.b}, c=${params.c},
    alpha=${params.alpha}, beta=${params.beta}, gamma=${params.gamma}
)

G = lattice.metric_tensor
G_star = lattice.reciprocal_lattice.metric_tensor
d_hkl = lattice.d_hkl((${h1}, ${k1}, ${l1}))
niggli_lat = lattice.get_niggli_reduced_lattice()

print(f"Volume: {lattice.volume:.4f} A^3")
print(f"d(${h1} ${k1} ${l1}): {d_hkl:.5f} A")
print("Niggli reduced cell:", niggli_lat.parameters)
`;

  const latexMatrix = `% Crystallographic Metric Tensors (${system})
\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section*{Metric Tensor Analysis for ${system} System}
Unit Cell: $a = ${params.a}\\,\\text{\\AA},\\; b = ${params.b}\\,\\text{\\AA},\\; c = ${params.c}\\,\\text{\\AA},\\; \\alpha = ${params.alpha}^\\circ,\\; \\beta = ${params.beta}^\\circ,\\; \\gamma = ${params.gamma}^\\circ$

\\subsection*{Direct Metric Tensor $[G]$ and Volume}
\\[
G = \\begin{pmatrix}
${metricG.map((r) => r.map((v) => fmt(v, 4)).join(' & ')).join(' \\\\\n')}
\\end{pmatrix},
\\quad \\det(G) = ${fmt(detG, 4)}\\,\\text{\\AA}^6,
\\quad V = \\sqrt{\\det(G)} = ${fmt(volumeV, 4)}\\,\\text{\\AA}^3
\\]

\\subsection*{Reciprocal Metric Tensor $[G^*] = G^{-1}$}
\\[
G^* = \\begin{pmatrix}
${metricGStar.map((r) => r.map((v) => fmt(v, 5)).join(' & ')).join(' \\\\\n')}
\\end{pmatrix}
\\]

\\subsection*{Direct ($A$) and Busing--Levy ($B$) Dual Frames}
\\[
A = \\begin{pmatrix}
${matrixA.map((r) => r.map((v) => fmt(v, 4)).join(' & ')).join(' \\\\\n')}
\\end{pmatrix},
\\quad
B = \\begin{pmatrix}
${matrixB.map((r) => r.map((v) => fmt(v, 5)).join(' & ')).join(' \\\\\n')}
\\end{pmatrix}
\\]

\\end{document}
`;

  const handleDownloadPython = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metric_tensor_${system.toLowerCase()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>REPRODUCIBLE PYTHON & LATEX EXPORT</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            NumPy Dual-Frame Verification, PyMatGen Niggli & LaTeX
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Exports exact covariant/contravariant tensors, AᵀB = I verification assertions, unimodular Niggli reduction matrix P, and publication-ready LaTeX equations.
          </p>
        </div>

        <button
          onClick={handleDownloadPython}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          Download .py
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              NumPy Dual-Space Script
            </span>
            <button
              onClick={() => copyToClipboard(pythonScript, 'numpy_script')}
              className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              {copiedKey === 'numpy_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Script</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed">
            {pythonScript}
          </pre>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              PyMatGen Niggli & Contraction
            </span>
            <button
              onClick={() => copyToClipboard(pymatgenScript, 'pymatgen_script')}
              className="flex items-center gap-1 text-[11px] font-mono text-violet-400 hover:text-violet-300 cursor-pointer"
            >
              {copiedKey === 'pymatgen_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Code</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed">
            {pymatgenScript}
          </pre>
        </div>

        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Publication LaTeX Export (Exact det(G) & Dual Frames)
            </span>
            <button
              onClick={() => copyToClipboard(latexMatrix, 'latex_matrix')}
              className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              {copiedKey === 'latex_matrix' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy LaTeX</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[220px] leading-relaxed">
            {latexMatrix}
          </pre>
        </div>
      </div>
    </div>
  );
};
