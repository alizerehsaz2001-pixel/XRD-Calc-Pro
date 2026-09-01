import os

# -----------------------------------------------------------------------------
# 6. XRRTheoryTab.tsx
# -----------------------------------------------------------------------------
theory_code = r"""import React from 'react';
import { BookOpen, Layers, Zap, Waves, ShieldCheck, Compass, Lightbulb } from 'lucide-react';

export const XRRTheoryTab: React.FC = () => {
  return (
    <div id="xrr-theory-container" className="space-y-6 text-slate-300 text-xs leading-relaxed">
      {/* Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Fundamental Physics of X-Ray Reflectometry (XRR)
        </h3>
        <p className="text-slate-400">
          X-ray Reflectometry (XRR) is an indispensable non-destructive surface-sensitive technique used in materials science and semiconductor metrology to measure 
          <strong className="text-cyan-300 font-semibold"> layer thicknesses (1–500 nm)</strong>, 
          <strong className="text-emerald-300 font-semibold"> interfacial and surface roughness (0.1–5 nm)</strong>, and 
          <strong className="text-amber-300 font-semibold"> mass / electron density</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parratt Formalism */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <Layers className="w-4 h-4" />
            <span>1. Parratt Recursive Matrix Formalism</span>
          </div>
          <p className="text-slate-400">
            For an N-layer stratified medium, Parratt recursion computes the ratio of reflected to transmitted wave amplitude at interface <code className="text-cyan-300 font-mono">j</code>:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-cyan-300 text-center text-xs overflow-x-auto">
            R_(j,j+1) = a_j⁴ · [ (R_(j+1,j+2) + r_(j,j+1)) / (1 + R_(j+1,j+2) · r_(j,j+1)) ]
          </div>
          <p className="text-slate-400">
            where <code className="text-cyan-300 font-mono">r_(j,j+1) = (k_z,j - k_z,j+1) / (k_z,j + k_z,j+1)</code> is the Fresnel reflection coefficient, and <code className="text-cyan-300 font-mono">a_j = exp(-i · k_z,j · d_j / 2)</code> is the phase propagation factor.
          </p>
        </div>

        {/* Roughness Corrections */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Waves className="w-4 h-4" />
            <span>2. Interface Roughness: Névot-Croce vs Debye-Waller</span>
          </div>
          <p className="text-slate-400">
            Real interfaces are not mathematically sharp. Gaussian interface roughness <code className="text-emerald-300 font-mono">σ_j</code> dampens specular reflection via attenuation factors:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-emerald-300 text-xs space-y-1 overflow-x-auto">
            <div>Névot-Croce: r_mod = r_Fresnel · exp(-2 · k_z,j · k_z,j+1 · σ²)</div>
            <div>Debye-Waller: r_mod = r_Fresnel · exp(-2 · k_z,j² · σ²)</div>
          </div>
          <p className="text-slate-400">
            <strong>Névot-Croce</strong> accounts for graded refractive index interfaces with refractive bending, while <strong>Debye-Waller</strong> applies to static uncoupled diffuse scattering.
          </p>
        </div>

        {/* Kiessig Fringes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Zap className="w-4 h-4" />
            <span>3. Modified Bragg Law for Kiessig Fringes</span>
          </div>
          <p className="text-slate-400">
            Interference between top surface and bottom interface reflections produces Kiessig oscillations. Correcting for Snell's refraction inside the film:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-amber-300 text-center text-xs overflow-x-auto">
            sin²(θ_m) = (λ / 2d)² · m² + 2δ_eff
          </div>
          <p className="text-slate-400">
            Plotting <code className="text-amber-300 font-mono">sin²(θ_m)</code> vs <code className="text-amber-300 font-mono">m²</code> yields a linear slope <code className="text-amber-300 font-mono">(λ / 2d)²</code> for exact thickness <code className="text-amber-300 font-mono">d</code> and an intercept of <code className="text-amber-300 font-mono">2δ_eff = sin²(θ_c)</code>.
          </p>
        </div>

        {/* Optical Constants */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <Compass className="w-4 h-4" />
            <span>4. Complex Index of Refraction & Henke Factors</span>
          </div>
          <p className="text-slate-400">
            In the hard X-ray regime, the refractive index is slightly less than unity:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-purple-300 text-center text-xs overflow-x-auto">
            n = 1 - δ - i·β = 1 - (r_e · λ² / 2π) · Σ N_a · (f_1 + i·f_2)
          </div>
          <p className="text-slate-400">
            Here <code className="text-purple-300 font-mono">r_e = 2.818 × 10⁻⁵ Å</code> is the classical electron radius, <code className="text-purple-300 font-mono">δ</code> describes phase dispersion, and <code className="text-purple-300 font-mono">β</code> accounts for photo-electric absorption.
          </p>
        </div>
      </div>
    </div>
  );
};
"""

with open("components/XRRTheoryTab.tsx", "w", encoding="utf-8") as f:
    f.write(theory_code)

print("XRRTheoryTab.tsx written!")
