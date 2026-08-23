import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  Compass, 
  Cpu, 
  CheckCircle2,
  Table
} from 'lucide-react';

export const MetricTensorLearningGuideTab: React.FC = () => {
  return (
    <div className="space-y-6">

      {/* Hero Pedagogical Banner */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Why Metric Tensors? The Universal Language of Crystallography
            </h3>
            <p className="text-xs text-slate-300">
              One unified mathematical framework replaces dozens of tedious trig formulas for every crystal system.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In high-school or introductory physics, students are taught separate <span className="font-mono text-cyan-300">d</span>-spacing formulas for cubic (<span className="font-mono text-cyan-300">1/d² = (h²+k²+l²)/a²</span>), tetragonal, hexagonal, and orthorhombic crystals. For low-symmetry monoclinic and triclinic systems, the textbook formulas become gigantic, 10-term trigonometric monsters.
          <br /><br />
          <strong>The Metric Tensor solves this completely:</strong> With matrix algebra, the single formula <span className="font-mono text-emerald-400 font-bold">1/d² = hᵀ · G* · h</span> works identically across <em>all 230 space groups and all 7 crystal systems</em>!
        </p>
      </div>

      {/* 3 Key Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Concept 1: Direct Metric G */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-violet-400">
            <span className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <Layers className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-white">1. Direct Metric [G]</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Stores basis vector lengths and interaxial angles in direct space:
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-violet-300">
            G_ij = a_i · a_j
            <br />
            det(G) = V² (Volume squared)
          </div>
          <p className="text-[11px] text-slate-400">
            Calculates lengths of real-space directions [uvw]: <span className="font-mono text-white">||u|| = √(uᵀ G u)</span>.
          </p>
        </div>

        {/* Concept 2: Reciprocal Metric G* */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-white">2. Reciprocal Metric [G*]</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The exact matrix inverse of direct metric tensor G:
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300">
            G* = G⁻¹
            <br />
            1/d² = hᵀ G* h
          </div>
          <p className="text-[11px] text-slate-400">
            Directly gives diffraction plane spacings and angles between reciprocal lattice vectors.
          </p>
        </div>

        {/* Concept 3: Busing-Levy Matrix B */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-white">3. Busing-Levy [B]</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Maps fractional coordinates into orthonormal Ångström space:
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300">
            r_Cart = B · r_frac
            <br />
            Bᵀ · B ≡ G*
          </div>
          <p className="text-[11px] text-slate-400">
            Fundamental to single-crystal diffractometer orientation and 3D crystal visualization.
          </p>
        </div>

      </div>

      {/* 7 Crystal Systems Metric Tensor Symmetry Table */}
      <div className="bg-slate-950 p-6 lg:p-8 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Table className="w-5 h-5 text-indigo-400" />
          <h4 className="font-bold text-white text-base">
            Tensor Symmetry & Zeroes across all 7 Crystal Systems
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
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
