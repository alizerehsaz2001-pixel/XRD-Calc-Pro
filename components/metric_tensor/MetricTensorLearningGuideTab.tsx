import React from 'react';
import { BookOpen, Layers, Compass, Cpu, Table } from 'lucide-react';

export const MetricTensorLearningGuideTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Pedagogical Banner */}
      <div className="bg-slate-950 rounded-2xl p-6 lg:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Why Metric Tensors? Universal Differential Geometry of Crystals
            </h3>
            <p className="text-xs text-slate-300">
              One unified bilinear algebra replaces system-specific trigonometric d-spacing and angle formulas across all 230 space groups.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Crystal lattices generally use non-orthogonal basis vectors (e.g., Hexagonal γ = 120°, Monoclinic β ≠ 90°, Triclinic α ≠ β ≠ γ). Instead of memorizing dozens of trigonometric formulas, the covariant metric tensor <strong className="text-violet-300">G</strong> and its contravariant dual inverse <strong className="text-cyan-300">G* = G⁻¹</strong> turn every distance, bond angle, interplanar angle, zone axis, and finite strain into compact matrix products.
        </p>
      </div>

      {/* 3 Key Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-violet-400">
            <span className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <Layers className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-white">1. Covariant Metric [G]</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Stores direct-space basis dot products and maps fractional displacements into Ångströms:
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-violet-300">
            G_ij = a_i · a_j
            <br />
            d²_bond = Δxᵀ G Δx
            <br />
            det(G) = V²
          </div>
          <p className="text-[11px] text-slate-400">
            Also determines unit cell volume and inter-direction angles cos θ = (u₁ᵀ G u₂)/(||u₁|| ||u₂||).
          </p>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-white">2. Contravariant Metric [G*]</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Exact inverse metric tensor storing reciprocal lattice inner products:
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300">
            G* = G⁻¹
            <br />
            1/d² = hᵀ G* h
            <br />
            cos φ = (h₁ᵀ G* h₂)/(|g₁*||g₂*|)
          </div>
          <p className="text-[11px] text-slate-400">
            Directly contracts with covariant Miller triples (hkl) to compute Bragg d-spacings and Ewald intersections.
          </p>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-white">3. Dual Orthogonalization [A & B]</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Maps crystal spaces into a common right-handed orthonormal Cartesian lab frame:
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300">
            r_Cart = A · x_frac (Aᵀ A = G)
            <br />
            q_Cart = B · h_hkl (Bᵀ B = G*)
            <br />
            Aᵀ B = I₃ (Biorthogonal)
          </div>
          <p className="text-[11px] text-slate-400">
            Direct positions use A (Å); reciprocal diffraction vectors use B (Å⁻¹) per Busing & Levy (1967).
          </p>
        </div>
      </div>

      {/* 7 Crystal Systems Metric Tensor Symmetry Table */}
      <div className="bg-slate-950 p-6 lg:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Table className="w-5 h-5 text-indigo-400" />
          <h4 className="font-bold text-white text-base">Metric Tensor [G] Forms Across All 7 Crystal Systems</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="p-3">System</th>
                <th className="p-3">Lattice Constraints</th>
                <th className="p-3">Metric Tensor Form [G]</th>
                <th className="p-3">Free Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-3 font-bold text-cyan-300">Cubic</td>
                <td className="p-3">a = b = c, α = β = γ = 90°</td>
                <td className="p-3 font-bold text-emerald-400">diag(a², a², a²) = a² · I</td>
                <td className="p-3">1 (a)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-300">Tetragonal</td>
                <td className="p-3">a = b ≠ c, α = β = γ = 90°</td>
                <td className="p-3 font-bold text-emerald-400">diag(a², a², c²)</td>
                <td className="p-3">2 (a, c)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-300">Hexagonal</td>
                <td className="p-3">a = b ≠ c, α = β = 90°, γ = 120°</td>
                <td className="p-3 font-bold text-emerald-400">[[a², -a²/2, 0], [-a²/2, a², 0], [0, 0, c²]]</td>
                <td className="p-3">2 (a, c)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-300">Rhombohedral</td>
                <td className="p-3">a = b = c, α = β = γ ≠ 90°</td>
                <td className="p-3 font-bold text-emerald-400">[[a², a²cα, a²cα], [a²cα, a², a²cα], [a²cα, a²cα, a²]]</td>
                <td className="p-3">2 (a, α)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-300">Orthorhombic</td>
                <td className="p-3">a ≠ b ≠ c, α = β = γ = 90°</td>
                <td className="p-3 font-bold text-emerald-400">diag(a², b², c²)</td>
                <td className="p-3">3 (a, b, c)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-300">Monoclinic (unique b)</td>
                <td className="p-3">a ≠ b ≠ c, α = γ = 90°, β ≠ 90°</td>
                <td className="p-3 font-bold text-emerald-400">[[a², 0, ac·cβ], [0, b², 0], [ac·cβ, 0, c²]]</td>
                <td className="p-3">4 (a, b, c, β)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-300">Triclinic</td>
                <td className="p-3">a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90°</td>
                <td className="p-3 font-bold text-emerald-400">Full symmetric 3×3 matrix (all g_ij ≠ 0)</td>
                <td className="p-3">6 (a, b, c, α, β, γ)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
