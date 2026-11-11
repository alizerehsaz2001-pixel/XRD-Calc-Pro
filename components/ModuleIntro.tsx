import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  Info,
  Zap,
  Layers,
  Cpu,
  Database,
  Brain,
  ArrowRight,
  Check,
  Sparkles,
  Activity,
  Target,
  Sigma
} from 'lucide-react';

interface ModuleIntroProps {
  module: string;
  onUnderstand: () => void;
}

// Helper for vertical fractions
const Fraction = ({ num, den }: { num: React.ReactNode; den: React.ReactNode }) => (
  <div className="inline-flex flex-col items-center align-middle mx-2" style={{ verticalAlign: 'middle' }}>
    <span className="border-b border-indigo-400/50 w-full text-center px-1.5 pb-0.5 mb-[2px]">{num}</span>
    <span className="w-full text-center px-1.5 pt-[1px]">{den}</span>
  </div>
);

// Helper for Math variables (Serif, Italic)
const M = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <span className={`font-serif italic text-white ${className}`}>{children}</span>
);

// Helper for Function names (Serif, Upright)
const F = ({ children }: { children?: React.ReactNode }) => (
  <span className="font-serif font-normal text-indigo-200">{children}</span>
);

const FormulaContainer = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="relative p-5 bg-[#0B0F19] rounded-xl border border-slate-800/90 hover:border-cyan-500/40 transition-colors w-full flex flex-col justify-between">
    <div className="flex justify-between items-center w-full mb-3 border-b border-slate-800/80 pb-2">
      <div className="flex items-center gap-2">
        <Sigma className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-200">{label}</span>
      </div>
      <span className="text-[10px] font-mono text-slate-500">Analytical Form</span>
    </div>

    <div className="w-full overflow-x-auto custom-scrollbar py-2">
      <div className="text-xl md:text-2xl font-serif whitespace-nowrap min-w-max flex items-center tracking-wide text-slate-100">
        <div className="inline-block align-middle">{children}</div>
      </div>
    </div>
  </div>
);

// Shared CAD SVG Defs (3D shaded spheres, precision arrowheads, technical sub-grid, curve area fills)
const CadSvgDefs = () => (
  <defs>
    <pattern id="cadSubGrid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f172a" strokeWidth="0.6" />
    </pattern>
    <pattern id="cadMajorGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#cadSubGrid)" />
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.8" />
    </pattern>
    <radialGradient id="cadNodeCyan" cx="32%" cy="28%" r="68%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="35%" stopColor="#38bdf8" />
      <stop offset="80%" stopColor="#0369a1" />
      <stop offset="100%" stopColor="#082f49" />
    </radialGradient>
    <radialGradient id="cadNodeAmber" cx="32%" cy="28%" r="68%">
      <stop offset="0%" stopColor="#fef3c7" />
      <stop offset="35%" stopColor="#fbbf24" />
      <stop offset="80%" stopColor="#b45309" />
      <stop offset="100%" stopColor="#451a03" />
    </radialGradient>
    <radialGradient id="cadNodePlatinum" cx="32%" cy="28%" r="68%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="40%" stopColor="#94a3b8" />
      <stop offset="85%" stopColor="#334155" />
      <stop offset="100%" stopColor="#0f172a" />
    </radialGradient>
    <linearGradient id="cadAreaCyan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
    </linearGradient>
    <linearGradient id="cadAreaAmber" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
    </linearGradient>
    <marker id="cadArrCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
    </marker>
    <marker id="cadArrAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
    </marker>
    <marker id="cadArrSlate" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#94a3b8" />
    </marker>
  </defs>
);

// Bespoke, CAD-grade vector schematic for each individual module
const renderModuleSpecializedSchematic = (moduleKey: string): { caption: string; regime: string; svg: React.ReactNode } => {
  switch (moduleKey) {
    case 'bragg':
      return {
        caption: 'FIG 1 · BRAGG PATH-DIFFERENCE & EWALD SPHERE KINEMATICS',
        regime: 'Elastic Scattering |k_f| = |k_i| = 2π/λ',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="196" y1="10" x2="196" y2="138" stroke="#1e293b" strokeWidth="1" />

            {/* Left Viewport: Direct-Space (hkl) Planes & Path-Length Phase Shift */}
            {[52, 82, 112].map((y, idx) => (
              <g key={y}>
                <line x1="16" y1={y} x2="182" y2={y} stroke="#475569" strokeWidth="0.85" strokeDasharray="3 2" />
                {[28, 56, 84, 112, 140, 168].map((x) => (
                  <circle key={x} cx={x} cy={y} r={idx === 0 ? 3.4 : 2.8} fill={idx === 0 ? 'url(#cadNodeCyan)' : 'url(#cadNodePlatinum)'} />
                ))}
              </g>
            ))}
            {/* Surface Normal */}
            <line x1="84" y1="14" x2="84" y2="120" stroke="#64748b" strokeWidth="0.75" strokeDasharray="2 2" />
            {/* Incident & Diffracted Wavevectors */}
            <line x1="20" y1="16" x2="81" y2="50" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#cadArrCyan)" />
            <line x1="84" y1="52" x2="148" y2="16" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#cadArrCyan)" />
            <line x1="20" y1="46" x2="81" y2="80" stroke="#0284c7" strokeWidth="1.25" markerEnd="url(#cadArrCyan)" />
            <line x1="84" y1="82" x2="148" y2="46" stroke="#0284c7" strokeWidth="1.25" markerEnd="url(#cadArrCyan)" />
            {/* Path Difference Reticle */}
            <polygon points="84,52 70,74 84,82 98,74" fill="url(#cadAreaAmber)" stroke="#f59e0b" strokeWidth="1" />
            {/* Dimension Callout for d_hkl */}
            <line x1="174" y1="52" x2="174" y2="82" stroke="#f59e0b" strokeWidth="0.9" markerStart="url(#cadArrAmber)" markerEnd="url(#cadArrAmber)" />
            <text x="169" y="70" textAnchor="end" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">d_hkl</text>
            <text x="16" y="134" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
              Δ = 2d·sinθ = nλ
            </text>

            {/* Right Viewport: Reciprocal Ewald Sphere Construction */}
            <circle cx="276" cy="68" r="44" fill="rgba(14, 165, 233, 0.04)" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="232" y1="68" x2="274" y2="68" stroke="#38bdf8" strokeWidth="1.4" markerEnd="url(#cadArrCyan)" />
            <line x1="276" y1="68" x2="306" y2="38" stroke="#38bdf8" strokeWidth="1.4" markerEnd="url(#cadArrCyan)" />
            <line x1="320" y1="68" x2="308" y2="39" stroke="#f59e0b" strokeWidth="1.6" markerEnd="url(#cadArrAmber)" />
            <circle cx="276" cy="68" r="2.2" fill="#94a3b8" />
            <circle cx="320" cy="68" r="3" fill="url(#cadNodePlatinum)" />
            <circle cx="308" cy="36" r="3.6" fill="url(#cadNodeAmber)" />
            <text x="250" y="78" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">k_i</text>
            <text x="282" y="48" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">k_f</text>
            <text x="318" y="54" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">Q=g_hkl</text>
            <text x="210" y="134" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
              |Q| = 4π·sinθ/λ = 2π/d
            </text>
          </svg>
        )
      };

    case 'unit_cells':
      return {
        caption: 'FIG 1 · 3D BRAVAIS PARALLELEPIPED & COVARIANT METRIC TENSOR G_ij',
        regime: '7 Holohedral Classes · 14 Bravais Lattices',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {/* 3D Shaded Parallelepiped */}
            <polygon points="48,38 118,38 142,16 72,16" fill="rgba(56, 189, 248, 0.14)" stroke="#475569" strokeWidth="0.9" />
            <polygon points="104,98 128,76 142,16 118,38" fill="rgba(14, 165, 233, 0.08)" stroke="#475569" strokeWidth="0.9" />
            <polygon points="34,98 104,98 118,38 48,38" fill="rgba(15, 23, 42, 0.55)" stroke="#64748b" strokeWidth="1.1" />
            <line x1="34" y1="98" x2="58" y2="76" stroke="#334155" strokeWidth="0.85" strokeDasharray="2 2" />
            <line x1="58" y1="76" x2="128" y2="76" stroke="#334155" strokeWidth="0.85" strokeDasharray="2 2" />
            <line x1="58" y1="76" x2="72" y2="16" stroke="#334155" strokeWidth="0.85" strokeDasharray="2 2" />
            {/* Basis Vectors with Precision Arrowheads */}
            <line x1="34" y1="98" x2="102" y2="98" stroke="#f59e0b" strokeWidth="1.8" markerEnd="url(#cadArrAmber)" />
            <line x1="104" y1="98" x2="127" y2="77" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#cadArrCyan)" />
            <line x1="34" y1="98" x2="47" y2="40" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#cadArrCyan)" />
            {/* Volumetric Spheres */}
            {[[48, 38], [118, 38], [142, 16], [72, 16], [34, 98], [104, 98], [128, 76]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.8" fill="url(#cadNodePlatinum)" />
            ))}
            <circle cx="88" cy="57" r="4.2" fill="url(#cadNodeAmber)" />
            <text x="68" y="112" fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">a</text>
            <text x="124" y="92" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">b</text>
            <text x="23" y="66" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">c</text>

            {/* Right: Metric Tensor Matrix Block */}
            <rect x="172" y="16" width="174" height="114" rx="6" fill="#070A12" stroke="#1e293b" strokeWidth="1" />
            <text x="259" y="32" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              COVARIANT METRIC TENSOR G_ij
            </text>
            <line x1="184" y1="38" x2="334" y2="38" stroke="#1e293b" strokeWidth="0.8" />
            <text x="259" y="56" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
              ┌ a²      ab·cosγ  ac·cosβ ┐
            </text>
            <text x="259" y="72" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
              │ ab·cosγ b²       bc·cosα │
            </text>
            <text x="259" y="88" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
              └ ac·cosβ bc·cosα  c²      ┘
            </text>
            <line x1="184" y1="98" x2="334" y2="98" stroke="#1e293b" strokeWidth="0.8" />
            <text x="259" y="114" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
              1/d² = [h k l] · G⁻¹ · [h k l]ᵀ
            </text>
          </svg>
        )
      };

    case 'xrr':
      return {
        caption: 'FIG 1 · PARRATT MULTILAYER RECURSION & KIESSIG FRINGE ENVELOPE',
        regime: 'Grazing Incidence θ < 5° · n = 1 − δ + iβ',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {/* Left: Multilayer Thin-Film Optical Stack */}
            <rect x="14" y="54" width="142" height="34" fill="rgba(14, 165, 233, 0.12)" stroke="#38bdf8" strokeWidth="0.9" />
            <rect x="14" y="88" width="142" height="32" fill="rgba(30, 41, 59, 0.75)" stroke="#475569" strokeWidth="0.8" />
            <line x1="18" y1="24" x2="62" y2="52" stroke="#f59e0b" strokeWidth="1.6" markerEnd="url(#cadArrAmber)" />
            <line x1="64" y1="54" x2="116" y2="20" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#cadArrCyan)" />
            <line x1="64" y1="54" x2="96" y2="86" stroke="#38bdf8" strokeWidth="1.3" />
            <line x1="98" y1="88" x2="128" y2="54" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 1.5" />
            <line x1="128" y1="54" x2="152" y2="38" stroke="#38bdf8" strokeWidth="1.4" markerEnd="url(#cadArrCyan)" />
            <text x="20" y="74" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">Film (ρ_e, d, σ)</text>
            <text x="20" y="106" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">Substrate</text>
            <text x="16" y="134" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
              r_j,j+1 · exp(−2k_z,j·k_z,j+1·σ²)
            </text>

            {/* Right: Specular Reflectivity Curve log R(q_z) */}
            <line x1="176" y1="18" x2="176" y2="118" stroke="#475569" strokeWidth="1" />
            <line x1="176" y1="118" x2="344" y2="118" stroke="#475569" strokeWidth="1" />
            <path
              d="M 176,24 L 200,24 C 206,24 208,44 214,44 C 220,44 222,34 228,34 C 234,34 236,62 242,62 C 248,62 250,50 256,50 C 262,50 264,80 270,80 C 276,80 278,68 284,68 C 290,68 292,96 298,96 C 304,96 306,86 312,86 C 318,86 322,110 340,114 L 340,118 L 176,118 Z"
              fill="url(#cadAreaCyan)"
            />
            <path
              d="M 176,24 L 200,24 C 206,24 208,44 214,44 C 220,44 222,34 228,34 C 234,34 236,62 242,62 C 248,62 250,50 256,50 C 262,50 264,80 270,80 C 276,80 278,68 284,68 C 290,68 292,96 298,96 C 304,96 306,86 312,86 C 318,86 322,110 340,114"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <path
              d="M 200,24 Q 260,64 340,110"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <text x="182" y="134" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">
              Δq_z = 2π/d_film · Fresnel q_z⁻⁴
            </text>
          </svg>
        )
      };

    case 'fwhm':
      return {
        caption: 'FIG 1 · TCH PSEUDO-VOIGT KERNEL & RACHINGER Kα₁/Kα₂ DECONVOLUTION',
        regime: 'V(x) = ηL(x) + (1−η)G(x) · β = Area / I_max',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="20" y1="116" x2="340" y2="116" stroke="#475569" strokeWidth="1" />
            {/* Equivalent Integral Breadth Rectangle */}
            <rect x="114" y="22" width="62" height="94" fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="3 2" />
            {/* Primary K_alpha1 Smooth Profile Fill + Stroke */}
            <path d="M 28,116 C 88,116 112,104 128,58 C 136,30 140,22 145,22 C 150,22 154,30 162,58 C 178,104 202,116 280,116 Z" fill="url(#cadAreaCyan)" />
            <path d="M 28,116 C 88,116 112,104 128,58 C 136,30 140,22 145,22 C 150,22 154,30 162,58 C 178,104 202,116 280,116" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
            {/* Secondary K_alpha2 Doublet Shoulder */}
            <path d="M 96,116 C 152,116 172,108 184,84 C 190,72 193,68 196,68 C 199,68 202,72 208,84 C 220,108 240,116 312,116" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 2" />
            {/* FWHM Callout */}
            <line x1="126" y1="69" x2="164" y2="69" stroke="#f59e0b" strokeWidth="1.4" markerStart="url(#cadArrAmber)" markerEnd="url(#cadArrAmber)" />
            <text x="106" y="72" textAnchor="end" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">FWHM</text>
            <text x="145" y="17" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">β = Area / I_max</text>
            <text x="206" y="65" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">Kα₂ (0.5·I₀)</text>
            <text x="22" y="134" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
              Voigt Deconvolution: β_G² = β_G,obs² − β_G,inst²  |  β_C = β_C,obs − β_C,inst
            </text>
          </svg>
        )
      };

    case 'scherrer':
    case 'monshi_scherrer':
      return {
        caption: 'FIG 1 · COHERENT DIFFRACTING DOMAIN D_hkl & MONSHI LOG-LINEAR REGRESSION',
        regime: 'ln(β) = ln(Kλ/D) + ln(1/cosθ) · Shape Factor K',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {/* Left: 3D Coherent Column Stack */}
            <polygon points="68,18 112,34 112,90 68,106 24,90 24,34" fill="url(#cadAreaCyan)" stroke="#38bdf8" strokeWidth="1.2" />
            {[36, 50, 64, 78, 92].map((y) => (
              <line key={y} x1="30" y1={y} x2="106" y2={y} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
            ))}
            <line x1="122" y1="20" x2="122" y2="104" stroke="#f59e0b" strokeWidth="1.2" markerStart="url(#cadArrAmber)" markerEnd="url(#cadArrAmber)" />
            <text x="128" y="65" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">D_hkl</text>
            <text x="68" y="132" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
              D_hkl = N · d_hkl
            </text>
            {/* Right: Monshi-Scherrer Regression Plot */}
            <line x1="176" y1="18" x2="176" y2="112" stroke="#475569" strokeWidth="1" />
            <line x1="176" y1="112" x2="340" y2="112" stroke="#475569" strokeWidth="1" />
            <polygon points="176,80 328,22 328,34 176,92" fill="rgba(56, 189, 248, 0.10)" />
            <line x1="176" y1="86" x2="328" y2="28" stroke="#38bdf8" strokeWidth="1.6" />
            {[[196, 78], [226, 67], [258, 55], [290, 42], [318, 32]].map(([x, y], i) => (
              <g key={i}>
                <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke="#64748b" strokeWidth="0.9" />
                <circle cx={x} cy={y} r="3" fill="url(#cadNodeCyan)" />
              </g>
            ))}
            <circle cx="176" cy="86" r="3.8" fill="url(#cadNodeAmber)" />
            <text x="184" y="98" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              y₀ = ln(Kλ/⟨D⟩)
            </text>
            <text x="258" y="132" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              ln(1/cosθ) →
            </text>
          </svg>
        )
      };

    case 'wh':
    case 'integral':
    case 'integral_adv':
    case 'double_voigt':
      return {
        caption: 'FIG 1 · WILLIAMSON-HALL & HALDER-WAGNER SIZE-STRAIN DECOUPLING',
        regime: 'β·cosθ = (Kλ/D_v) + 4ε·sinθ · Voigt Convolution',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="38" y1="16" x2="38" y2="112" stroke="#475569" strokeWidth="1" />
            <line x1="38" y1="112" x2="338" y2="112" stroke="#475569" strokeWidth="1" />
            {/* 95% Confidence Band */}
            <polygon points="38,78 322,20 322,34 38,90" fill="rgba(56, 189, 248, 0.10)" />
            {/* Zero-strain reference horizontal */}
            <line x1="38" y1="84" x2="328" y2="84" stroke="#475569" strokeWidth="0.85" strokeDasharray="3 3" />
            {/* Linear Fit */}
            <line x1="38" y1="84" x2="322" y2="27" stroke="#38bdf8" strokeWidth="1.75" />
            {[[72, 77], [122, 67], [176, 56], [234, 45], [292, 33]].map(([x, y], i) => (
              <g key={i}>
                <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke="#94a3b8" strokeWidth="0.9" />
                <line x1={x - 2.5} y1={y - 6} x2={x + 2.5} y2={y - 6} stroke="#94a3b8" strokeWidth="0.9" />
                <line x1={x - 2.5} y1={y + 6} x2={x + 2.5} y2={y + 6} stroke="#94a3b8" strokeWidth="0.9" />
                <circle cx={x} cy={y} r="3.2" fill="url(#cadNodeCyan)" />
              </g>
            ))}
            <circle cx="38" cy="84" r="4" fill="url(#cadNodeAmber)" />
            <text x="46" y="99" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
              Intercept y₀ = Kλ / D_v
            </text>
            <text x="150" y="34" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              Slope ∂y/∂x = ε (Microstrain)
            </text>
            <text x="188" y="132" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              4·sinθ (Isotropic Deformation Variable) →
            </text>
          </svg>
        )
      };

    case 'wa':
    case 'method_of_moments':
      return {
        caption: 'FIG 1 · BERTAUT–WARREN–AVERBACH FOURIER COSINE A(L) & COLUMN P(L)',
        regime: 'ln A(L, s) = ln A^S(L) − 2π²·L²·⟨ε²(L)⟩·s²',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {/* Left: A^S(L) Decay & Tangent Intercept */}
            <line x1="24" y1="18" x2="24" y2="112" stroke="#475569" strokeWidth="1" />
            <line x1="24" y1="112" x2="168" y2="112" stroke="#475569" strokeWidth="1" />
            <path d="M 24,24 C 52,54 84,88 158,110 L 158,112 L 24,112 Z" fill="url(#cadAreaCyan)" />
            <path d="M 24,24 C 52,54 84,88 158,110" fill="none" stroke="#38bdf8" strokeWidth="1.75" />
            <line x1="24" y1="24" x2="88" y2="112" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle cx="88" cy="112" r="3.4" fill="url(#cadNodeAmber)" />
            <text x="88" y="130" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              L₀ = ⟨D⟩_A
            </text>
            <text x="34" y="32" fill="#7dd3fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
              A^S(L)
            </text>

            {/* Right: Column Length Distribution p(L) */}
            <line x1="194" y1="18" x2="194" y2="112" stroke="#475569" strokeWidth="1" />
            <line x1="194" y1="112" x2="342" y2="112" stroke="#475569" strokeWidth="1" />
            <path d="M 198,112 C 216,112 226,30 246,30 C 266,30 284,106 334,112 Z" fill="url(#cadAreaAmber)" stroke="#f59e0b" strokeWidth="1.6" />
            <line x1="246" y1="30" x2="246" y2="112" stroke="#fbbf24" strokeWidth="0.9" strokeDasharray="2 2" />
            <text x="204" y="26" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              p(L) = L · d²A^S/dL²
            </text>
            <text x="268" y="130" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
              Column Length L (nm) →
            </text>
          </svg>
        )
      };

    case 'selection':
      return {
        caption: 'FIG 1 · COMPLEX ARGAND STRUCTURE FACTOR F_hkl PHASOR SUMMATION',
        regime: 'F_hkl = Σ f_j · exp[2πi(hx_j + ky_j + lz_j)]',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {/* Left: Constructive In-Phase Summation */}
            <circle cx="90" cy="64" r="42" fill="rgba(14, 165, 233, 0.05)" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="64" x2="140" y2="64" stroke="#475569" strokeWidth="0.8" />
            <line x1="90" y1="16" x2="90" y2="112" stroke="#475569" strokeWidth="0.8" />
            <line x1="90" y1="64" x2="130" y2="64" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#cadArrCyan)" />
            <circle cx="90" cy="64" r="2.5" fill="url(#cadNodePlatinum)" />
            <text x="90" y="130" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              Allowed: |F_hkl| = Z·f_j
            </text>
            {/* Right: Destructive Out-of-Phase Cancellation */}
            <circle cx="268" cy="64" r="42" fill="rgba(245, 158, 11, 0.04)" stroke="#334155" strokeWidth="1" />
            <line x1="218" y1="64" x2="318" y2="64" stroke="#475569" strokeWidth="0.8" />
            <line x1="268" y1="16" x2="268" y2="112" stroke="#475569" strokeWidth="0.8" />
            <line x1="268" y1="64" x2="304" y2="64" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#cadArrCyan)" />
            <line x1="268" y1="64" x2="232" y2="64" stroke="#f59e0b" strokeWidth="1.8" markerEnd="url(#cadArrAmber)" />
            <circle cx="268" cy="64" r="2.5" fill="url(#cadNodePlatinum)" />
            <text x="288" y="54" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">+f (e^0)</text>
            <text x="226" y="54" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">−f (e^iπ)</text>
            <text x="268" y="130" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
              Systematic Absence: ΣF = 0
            </text>
          </svg>
        )
      };

    case 'residual_stress':
      return {
        caption: 'FIG 1 · SIN²ψ ELASTIC LATTICE STRAIN TILT & BIAXIAL STRESS TENSOR',
        regime: 'ε_φψ = [(1+ν)/E]·σ_φ·sin²ψ − (ν/E)(σ₁+σ₂)',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {/* Left: Specimen Tilt Geometry */}
            <rect x="22" y="96" width="120" height="10" fill="rgba(51, 65, 85, 0.6)" stroke="#64748b" strokeWidth="0.9" />
            <line x1="82" y1="96" x2="82" y2="24" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#cadArrSlate)" />
            <line x1="82" y1="96" x2="122" y2="34" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#cadArrCyan)" />
            <path d="M 82,58 A 38 38 0 0 1 103,64" fill="none" stroke="#f59e0b" strokeWidth="1.3" />
            <text x="92" y="52" fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">ψ</text>
            <text x="68" y="24" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">N_s</text>
            <text x="124" y="34" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">Q_ψ (d_ψ)</text>
            <text x="82" y="130" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">Biaxial Stress σ_φ</text>
            {/* Right: d_psi vs sin^2(psi) Regression */}
            <line x1="180" y1="20" x2="180" y2="110" stroke="#475569" strokeWidth="1" />
            <line x1="180" y1="110" x2="340" y2="110" stroke="#475569" strokeWidth="1" />
            <line x1="186" y1="92" x2="330" y2="28" stroke="#38bdf8" strokeWidth="1.6" />
            {[[196, 87], [226, 74], [258, 60], [290, 46], [322, 32]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="url(#cadNodeAmber)" />
            ))}
            <text x="192" y="34" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              ∂d_ψ / ∂(sin²ψ) ∝ σ_φ
            </text>
            <text x="260" y="130" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
              sin²ψ (0.0 → 0.6) →
            </text>
          </svg>
        )
      };

    case 'pawley_lebail':
    case 'rir':
    case 'compare':
      return {
        caption: 'FIG 1 · WHOLE-PATTERN RIETVELD / LE BAIL DIFFERENCE RESIDUAL PLOT',
        regime: 'y_calc(2θ) = y_bg + Σ I_k · Φ(2θ − 2θ_k) · R_wp',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="20" y1="88" x2="340" y2="88" stroke="#475569" strokeWidth="0.9" />
            {/* Calculated Profile Fill & Curve */}
            <path
              d="M 20,84 L 68,84 C 73,84 75,20 80,20 C 85,20 87,84 92,84 L 144,84 C 149,84 151,38 156,38 C 161,38 163,84 168,84 L 218,84 C 223,84 225,50 230,50 C 235,50 237,84 242,84 L 284,84 C 289,84 291,58 296,58 C 301,58 303,84 308,84 L 340,84 L 340,88 L 20,88 Z"
              fill="url(#cadAreaCyan)"
            />
            <path
              d="M 20,84 L 68,84 C 73,84 75,20 80,20 C 85,20 87,84 92,84 L 144,84 C 149,84 151,38 156,38 C 161,38 163,84 168,84 L 218,84 C 223,84 225,50 230,50 C 235,50 237,84 242,84 L 284,84 C 289,84 291,58 296,58 C 301,58 303,84 308,84 L 340,84"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Bragg Reflection Tick Marks */}
            {[80, 156, 230, 296].map((x) => (
              <line key={x} x1={x} y1="92" x2={x} y2="100" stroke="#f59e0b" strokeWidth="1.5" />
            ))}
            {/* Difference Curve y_obs - y_calc */}
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              points="20,114 76,114 80,108 84,120 88,114 152,114 156,110 160,118 164,114 226,114 230,111 234,117 340,114"
            />
            <text x="24" y="22" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              I_obs(2θ) &amp; I_calc(2θ) Whole-Pattern Fit
            </text>
            <text x="24" y="134" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
              Residual Δy = y_obs − y_calc  |  Bragg |hkl| Positions
            </text>
          </svg>
        )
      };

    default:
      return {
        caption: 'FIG 1 · RECIPROCAL LATTICE SCATTERING & METRIC TENSOR PROJECTION',
        regime: '64-Bit Analytical Crystallography Solver',
        svg: (
          <svg viewBox="0 0 360 148" className="w-full h-auto select-none">
            <CadSvgDefs />
            <rect x="4" y="4" width="352" height="140" rx="6" fill="url(#cadMajorGrid)" stroke="#1e293b" strokeWidth="0.8" />
            {[48, 78, 108].map((y, idx) => (
              <g key={y}>
                <line x1="20" y1={y} x2="180" y2={y} stroke="#475569" strokeWidth="0.85" strokeDasharray="4 3" />
                {[36, 68, 100, 132, 164].map((x) => (
                  <circle key={x} cx={x} cy={y} r="3" fill={idx === 0 ? 'url(#cadNodeCyan)' : 'url(#cadNodePlatinum)'} />
                ))}
              </g>
            ))}
            <line x1="28" y1="16" x2="98" y2="46" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#cadArrCyan)" />
            <line x1="100" y1="48" x2="170" y2="16" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#cadArrCyan)" />
            <circle cx="268" cy="68" r="42" fill="rgba(14, 165, 233, 0.04)" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="226" y1="68" x2="266" y2="68" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#cadArrCyan)" />
            <line x1="268" y1="68" x2="296" y2="40" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#cadArrCyan)" />
            <line x1="310" y1="68" x2="298" y2="40" stroke="#f59e0b" strokeWidth="1.6" markerEnd="url(#cadArrAmber)" />
            <circle cx="298" cy="38" r="3.5" fill="url(#cadNodeAmber)" />
            <text x="24" y="132" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
              2d_hkl·sinθ = nλ  |  Q = 4π·sinθ/λ
            </text>
          </svg>
        )
      };
  }
};

const MODULE_CONTENT: Record<
  string,
  { title: string; description: string; tag: string; icon: any; color: string; formulas: React.ReactNode }
> = {
  xrr: {
    title: 'X-Ray Reflectometry (XRR) Engine',
    tag: 'Thin Film Metrology',
    icon: Activity,
    color: 'from-cyan-500 to-indigo-500',
    description:
      "Specular reflectivity calculation for thin film stacks using Parratt's recursion formula with Névot-Croce roughness attenuation. Measures layer thickness, interfacial roughness, and electron density.",
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Parratt Recursion">
          <M>R</M>
          <sub>j</sub> ={' '}
          <Fraction
            num={
              <span>
                <M>r</M>
                <sub>j,j+1</sub> + <M>R</M>
                <sub>j+1</sub>
                <M>e</M>
                <sup>
                  i<M>q</M>
                  <sub>z,j+1</sub>
                  <M>d</M>
                  <sub>j+1</sub>
                </sup>
              </span>
            }
            den={
              <span>
                1 + <M>r</M>
                <sub>j,j+1</sub>
                <M>R</M>
                <sub>j+1</sub>
                <M>e</M>
                <sup>
                  i<M>q</M>
                  <sub>z,j+1</sub>
                  <M>d</M>
                  <sub>j+1</sub>
                </sup>
              </span>
            }
          />
        </FormulaContainer>
        <FormulaContainer label="Kiessig Film Thickness">
          <M>d</M>
          <sub>film</sub> ={' '}
          <Fraction
            num={
              <span>
                2<M>π</M>
              </span>
            }
            den={
              <span>
                Δ<M>q</M>
                <sub>z</sub>
              </span>
            }
          />
        </FormulaContainer>
      </div>
    )
  },
  bragg: {
    title: 'Bragg Diffractometer Core',
    tag: 'Fundamental Physics',
    icon: Zap,
    color: 'from-indigo-500 to-blue-500',
    description:
      'The core engine for calculating interplanar lattice spacing using classical Bragg diffraction physics, Sin²θ ratio auto-indexing, and Bragg-Brentano goniometer ray optics.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Bragg's Law">
          <M>n</M>
          <M>λ</M> = 2<M>d</M> <F>sin</F>(<M>θ</M>)
        </FormulaContainer>
        <FormulaContainer label="Scattering Vector">
          <M>Q</M> ={' '}
          <Fraction
            num={
              <span>
                4<M>π</M> <F>sin</F>(<M>θ</M>)
              </span>
            }
            den={<M>λ</M>}
          />
        </FormulaContainer>
      </div>
    )
  },
  unit_cells: {
    title: 'Unit Cells & 14 Bravais Lattices',
    tag: 'Fundamental Physics',
    icon: Layers,
    color: 'from-indigo-500 to-cyan-500',
    description:
      'Interactive 3D crystallography reference across all 7 crystal systems and 14 Bravais lattices, featuring covariant metric tensors G_ij, reciprocal lattice duality, and group-subgroup peak-splitting simulations.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Reciprocal Metric Tensor">
          1 / <M>d</M>
          <sub>hkl</sub>
          <sup>2</sup> = [<M>h k l</M>] · <M>G</M>
          <sup>−1</sup> · [<M>h k l</M>]<sup>T</sup>
        </FormulaContainer>
        <FormulaContainer label="Unit Cell Volume">
          <M>V</M> = <M>abc</M> · √(1 − <F>cos</F>
          <sup>2</sup>
          <M>α</M> − <F>cos</F>
          <sup>2</sup>
          <M>β</M> − <F>cos</F>
          <sup>2</sup>
          <M>γ</M> + 2<F>cos</F>
          <M>α</M>
          <F>cos</F>
          <M>β</M>
          <F>cos</F>
          <M>γ</M>)
        </FormulaContainer>
      </div>
    )
  },
  fwhm: {
    title: 'Line Profile Analytics',
    tag: 'Signal Processing & Deconvolution',
    icon: Layers,
    color: 'from-orange-500 to-amber-500',
    description:
      'Rigorous diffraction line profile synthesis, non-linear least-squares kernel benchmarking (TCH Pseudo-Voigt & Pearson VII), recursive Rachinger Kα₂ stripping, de Keijser Voigt deconvolution, and Bertaut–Warren–Averbach Fourier cosine A(L) analysis.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Thompson-Cox-Hastings & Pearson VII">
          <M>V</M>(<M>x</M>) = <M>ηL</M>(<M>x</M>) + (1−<M>η</M>)<M>G</M>(<M>x</M>) &nbsp;|&nbsp; [1 + (<M>x</M>/<M>w</M>)
          <sup>2</sup>]<sup>−m</sup>
        </FormulaContainer>
        <FormulaContainer label="Integral Breadth & Stokes Fourier">
          <M>β</M> ={' '}
          <Fraction
            num={<F>Area</F>}
            den={
              <>
                <M>I</M>
                <sub>max</sub>
              </>
            }
          />{' '}
          &nbsp;|&nbsp; <M>A</M>(<M>L</M>) = ⟨<F>cos</F>(2<M>πLs</M>)⟩
        </FormulaContainer>
      </div>
    )
  },
  compare: {
    title: 'Diffraction Compare Lab',
    tag: 'Comparative Spectroscopy',
    icon: Layers,
    color: 'from-blue-500 to-emerald-500',
    description:
      'Overlay and visually inspect diffraction profiles between custom samples. Identify crystal structure variations, line shifts, and residual strains.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Relative Intensity Ratio">
          <M>I</M>
          <sub>rel</sub> ={' '}
          <Fraction
            num={
              <>
                I<sub>A</sub>
              </>
            }
            den={
              <>
                I<sub>B</sub>
              </>
            }
          />
        </FormulaContainer>
        <FormulaContainer label="Peak Centroid Shift">
          Δ(2θ) = 2θ<sub>A</sub> − 2θ<sub>B</sub>
        </FormulaContainer>
      </div>
    )
  },
  scherrer: {
    title: 'Scherrer & Monshi-Scherrer Suite',
    tag: 'Microstructural Domain Size',
    icon: Info,
    color: 'from-emerald-500 to-teal-500',
    description:
      'Multi-reflection crystallite size estimation combining classical Scherrer evaluation, Monshi logarithmic linear regression, and crystallographic shape-factor K(hkl) anisotropy modeling.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Classical Scherrer">
          <M>D</M> ={' '}
          <Fraction
            num={
              <span>
                <M>K</M> <M>λ</M>
              </span>
            }
            den={
              <span>
                <M>β</M> <F>cos</F>(<M>θ</M>)
              </span>
            }
          />
        </FormulaContainer>
        <FormulaContainer label="Monshi Logarithmic Linearization">
          <F>ln</F>(<M>β</M>) = <F>ln</F>(1/<F>cos</F>
          <M>θ</M>) + <F>ln</F>(<M>Kλ</M>/<M>D</M>)
        </FormulaContainer>
      </div>
    )
  },
  wh: {
    title: 'Williamson-Hall & Size-Strain Workbench',
    tag: 'Microstructural Deconvolution',
    icon: Layers,
    color: 'from-cyan-500 to-blue-500',
    description:
      'Simultaneous separation of coherent domain size D_v and lattice microstrain ε across UDM, USDM (anisotropic hkl Hooke elasticity), UDEDM, and Size-Strain Plot (SSP) formalisms.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Williamson-Hall Master Equation">
          <M>β</M>
          <F>cos</F>(<M>θ</M>) = <M>ε</M>(4<F>sin</F>
          <M>θ</M>) +{' '}
          <Fraction
            num={
              <span>
                <M>K</M>
                <M>λ</M>
              </span>
            }
            den={<M>D</M>}
          />
        </FormulaContainer>
        <FormulaContainer label="Size-Strain Plot (SSP)">
          (<M>d</M>
          <sub>hkl</sub>
          <M>β</M>
          <F>cos</F>
          <M>θ</M>)<sup>2</sup> = (<M>Kλ</M>/<M>D</M>)(<M>d</M>
          <sub>hkl</sub>
          <sup>2</sup>
          <M>β</M>
          <F>cos</F>
          <M>θ</M>) + (2<M>ε</M>)<sup>2</sup>
        </FormulaContainer>
      </div>
    )
  },
  wa: {
    title: 'Warren-Averbach Fourier Analysis',
    tag: 'Advanced Fourier Line Profile',
    icon: Brain,
    color: 'from-rose-500 to-pink-500',
    description:
      'Rigorous Fourier cosine decomposition of multiple harmonic reflections, separating area-weighted domain size ⟨D⟩_A, column-length distributions p(L), and root-mean-square microstrain ⟨ε²(L)⟩^{1/2}.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Warren-Averbach Separation">
          <F>ln</F> <M>A</M>(<M>L</M>,<M>s</M>) = <F>ln</F> <M>A</M>
          <sup>S</sup>(<M>L</M>) − 2<M>π</M>
          <sup>2</sup>
          <M>L</M>
          <sup>2</sup>⟨<M>ε</M>
          <sup>2</sup>(<M>L</M>)⟩<M>s</M>
          <sup>2</sup>
        </FormulaContainer>
        <FormulaContainer label="Bertaut Column Distribution">
          <M>p</M>(<M>L</M>) ∝ <M>L</M> ·{' '}
          <Fraction
            num={
              <span>
                d<sup>2</sup>
                <M>A</M>
                <sup>S</sup>(<M>L</M>)
              </span>
            }
            den={
              <span>
                d<M>L</M>
                <sup>2</sup>
              </span>
            }
          />
        </FormulaContainer>
      </div>
    )
  },
  neutron: {
    title: 'Neutron Scatter Plane',
    tag: 'Nuclear Analytics',
    icon: Zap,
    color: 'from-blue-500 to-indigo-500',
    description:
      'Isotope-sensitive diffraction analysis using coherent nuclear scattering lengths b_coh. Essential for light-atom localization (H/D, Li, O) and contrasting adjacent transition metals.',
    formulas: (
      <FormulaContainer label="Neutron Nuclear Structure Factor">
        <M>F</M>
        <sub>hkl</sub>
        <sup>nuc</sup> = <F>Σ</F> <M>b</M>
        <sub>j,coh</sub> <F>exp</F>(2<M>πi</M> <strong>r</strong>
        <sub>j</sub> · <strong>Q</strong>) <M>W</M>
        <sub>j</sub>
      </FormulaContainer>
    )
  },
  dl: {
    title: 'PhaseID Neural Core',
    tag: 'Deep Learning',
    icon: Brain,
    color: 'from-fuchsia-500 to-violet-500',
    description:
      'Convolutional Neural Network (CNN) architecture for probabilistic phase identification and space-group classification directly from 1D powder diffractograms.',
    formulas: (
      <div className="flex w-full overflow-x-auto custom-scrollbar items-center gap-2 font-mono text-[11px] text-indigo-200 uppercase tracking-widest bg-slate-900/90 p-5 rounded-2xl border border-slate-800 whitespace-nowrap">
        <span className="text-slate-400 shrink-0">I(2θ) Vector[N]</span>
        <ArrowRight className="w-4 h-4 shrink-0 text-indigo-400" />
        <span className="text-indigo-400 font-bold shrink-0">Conv1D Kernels</span>
        <ArrowRight className="w-4 h-4 shrink-0 text-indigo-400" />
        <span className="text-cyan-400 shrink-0">BatchNorm + ReLU</span>
        <ArrowRight className="w-4 h-4 shrink-0 text-indigo-400" />
        <span className="text-emerald-400 font-bold shrink-0">Softmax P(Phase_k)</span>
      </div>
    )
  },
  selection: {
    title: 'Selection Rules & Structure Factor',
    tag: 'Structure Factor Physics',
    icon: Database,
    color: 'from-blue-600 to-indigo-600',
    description:
      'Evaluates complex structure factor phasor sums F_hkl across Bravais centering translations, glide planes, and screw axes to predict allowed reflections and systematic absences.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Structure Factor (F_hkl)">
          <M>F</M>
          <sub>hkl</sub> = <F>Σ</F> <M>f</M>
          <sub>j</sub> <F>exp</F> [ 2<M>πi</M>(<M>hx</M>
          <sub>j</sub> + <M>ky</M>
          <sub>j</sub> + <M>lz</M>
          <sub>j</sub>) ]
        </FormulaContainer>
        <FormulaContainer label="Diffracted Intensity">
          <M>I</M>
          <sub>hkl</sub> ∝ <M>m</M>
          <sub>hkl</sub> · <M>LP</M>(<M>θ</M>) · |<M>F</M>
          <sub>hkl</sub>|<sup>2</sup>
        </FormulaContainer>
      </div>
    )
  },
  integral_adv: {
    title: 'Integral Breadth (Voigt & Halder-Wagner)',
    tag: 'Microstructural Deconvolution',
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    description:
      'Separates Lorentzian size broadening and Gaussian microstrain broadening from integral breadths β using Langford Voigt deconvolution and Halder-Wagner parabolic regression.',
    formulas: (
      <FormulaContainer label="Halder-Wagner Parabolic Equation">
        (
        <Fraction
          num={
            <>
              <M>β</M>*
            </>
          }
          den={
            <>
              <M>d</M>*
            </>
          }
        />
        )<sup>2</sup> = <Fraction num="1" den={<M>D</M>} /> (
        <Fraction
          num={
            <>
              <M>β</M>*
            </>
          }
          den={
            <>
              <M>d</M>*<sup>2</sup>
            </>
          }
        />
        ) + (<Fraction num={<M>ε</M>} den="2" />)<sup>2</sup>
      </FormulaContainer>
    )
  },
  magnetic: {
    title: 'Magnetic Diffraction',
    tag: 'Nuclear & Spin Analytics',
    icon: Zap,
    color: 'from-red-500 to-orange-500',
    description:
      'Models magnetic neutron scattering from ordered spin lattices, evaluating the Halpern-Johnson magnetic interaction vector q_⊥ and magnetic form factor f_mag(Q).',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Halpern-Johnson Vector">
          <strong>q</strong>
          <sub>⊥</sub> = <strong>M</strong> − (<strong>Q̂</strong> · <strong>M</strong>)<strong>Q̂</strong>
        </FormulaContainer>
        <FormulaContainer label="Magnetic Scattering Length">
          <M>p</M> = (<Fraction num={<><M>γr</M><sub>0</sub></>} den="2" />) <M>gS</M> <M>f</M>
          <sub>mag</sub>(<M>Q</M>)
        </FormulaContainer>
      </div>
    )
  },
  preferred_orientation: {
    title: 'Preferred Orientation Core',
    tag: 'Texture & Habit Analysis',
    icon: Layers,
    color: 'from-indigo-500 to-rose-500',
    description:
      'Models and corrects systematic peak intensity anomalies caused by non-random crystallite spatial orientation using the March-Dollase pole distribution function P(α).',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="March-Dollase Distribution">
          <M>P</M>(<M>α</M>) = [ <M>r</M>
          <sup>2</sup> <F>cos</F>
          <sup>2</sup>(<M>α</M>) + <M>r</M>
          <sup>−1</sup> <F>sin</F>
          <sup>2</sup>(<M>α</M>) ]<sup>−3/2</sup>
        </FormulaContainer>
        <FormulaContainer label="Interplanar Angle cos(α)">
          <F>cos</F>(<M>α</M>) ={' '}
          <Fraction
            num={
              <span>
                <strong>h</strong> · <strong>G</strong>* · <strong>H</strong>
              </span>
            }
            den={
              <span>
                |<strong>h</strong>| · |<strong>H</strong>|
              </span>
            }
          />
        </FormulaContainer>
      </div>
    )
  },
  cohen: {
    title: "Cohen's Least-Squares Matrix Refinement",
    tag: 'Precision Lattice Metrology',
    icon: Layers,
    color: 'from-indigo-500 to-violet-500',
    description:
      'Solves normal matrix equations A·x = v to refine high-precision unit cell parameters while simultaneously fitting Nelson-Riley / cos²θ specimen displacement drift D.',
    formulas: (
      <FormulaContainer label="Cohen Normal Equations">
        <F>sin</F>
        <sup>2</sup>
        <M>θ</M>
        <sub>i</sub> = <M>A</M>
        <sub>0</sub>(<M>h</M>
        <sub>i</sub>
        <sup>2</sup>+<M>k</M>
        <sub>i</sub>
        <sup>2</sup>+<M>l</M>
        <sub>i</sub>
        <sup>2</sup>) + <M>D</M> · <F>sin</F>
        <sup>2</sup>(2<M>θ</M>
        <sub>i</sub>)
      </FormulaContainer>
    )
  },
  metric_tensor: {
    title: 'Crystallographic Metric Tensor Algebra',
    tag: 'Linear Algebra & Space Tensors',
    icon: Sparkles,
    color: 'from-violet-500 to-cyan-500',
    description:
      'Rigorous direct [G] and reciprocal [G*] metric tensor algebra for d-spacing contractions, interplanar angles, zone axes, Cartesian orthogonalization, and Lagrangian strain.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Covariant Metric Tensor G">
          <M>g</M>
          <sub>ij</sub> = <strong>a</strong>
          <sub>i</sub> · <strong>a</strong>
          <sub>j</sub>
        </FormulaContainer>
        <FormulaContainer label="Reciprocal Contraction">
          1 / <M>d</M>
          <sup>2</sup>
          <sub>hkl</sub> = <strong>h</strong>
          <sup>T</sup> <M>G</M>* <strong>h</strong>
        </FormulaContainer>
      </div>
    )
  },
  supercell_transform: {
    title: 'Supercell & Coordinate Transformation Engine',
    tag: 'Matrix Crystallography',
    icon: Sparkles,
    color: 'from-cyan-500 to-blue-500',
    description:
      'Linear matrix transformations (P, p) for supercells, subcells, primitive-to-conventional Bravais conversions (FCC/BCC/Rhombohedral), and Wyckoff coordinate mapping.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Basis Vector Mapping">
          (<strong>a</strong>&apos;, <strong>b</strong>&apos;, <strong>c</strong>&apos;)<sup>T</sup> = <strong>P</strong>ᵀ · (<strong>a</strong>, <strong>b</strong>, <strong>c</strong>)<sup>T</sup>
        </FormulaContainer>
        <FormulaContainer label="Fractional Coordinate Mapping">
          <strong>x</strong>&apos; = <strong>P</strong>
          <sup>−1</sup> (<strong>x</strong> − <strong>p</strong>)
        </FormulaContainer>
      </div>
    )
  },
  pawley_lebail: {
    title: 'Pawley & Le Bail Whole Pattern Decomposition',
    tag: 'Structureless Profile Refinement',
    icon: Activity,
    color: 'from-indigo-500 to-violet-500',
    description:
      'Extracts integrated reflection intensities I_k and refines unit cell parameters without an atomic coordinate model using Le Bail iterative partitioning or Pawley least-squares.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Le Bail Intensity Iteration">
          <M>I</M>
          <sub>k</sub>
          <sup>(n+1)</sup> = <M>I</M>
          <sub>k</sub>
          <sup>(n)</sup> <F>Σ</F>
          <sub>i</sub> [ <M>y</M>
          <sub>obs,i</sub> · <M>Φ</M>
          <sub>k,i</sub> / <M>y</M>
          <sub>calc,i</sub> ]
        </FormulaContainer>
        <FormulaContainer label="Weighted Profile R-Factor">
          <M>R</M>
          <sub>wp</sub> = √[ <F>Σ</F> <M>w</M>
          <sub>i</sub>(<M>y</M>
          <sub>obs,i</sub> − <M>y</M>
          <sub>calc,i</sub>)<sup>2</sup> / <F>Σ</F> <M>w</M>
          <sub>i</sub> <M>y</M>
          <sub>obs,i</sub>
          <sup>2</sup> ]
        </FormulaContainer>
      </div>
    )
  },
  double_voigt: {
    title: 'Double-Voigt Method (Langford)',
    tag: 'Advanced Microstructure',
    icon: Brain,
    color: 'from-indigo-500 to-purple-500',
    description:
      'Deconvolutes size and strain broadening into Voigt functions possessing both Cauchy and Gaussian contributions in reciprocal space s = 2sinθ/λ, extracting D_V and D_A.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Area-Weighted Size (D_A)">
          <M>D</M>
          <sub>A</sub> ={' '}
          <Fraction
            num="1"
            den={
              <span>
                2 <M>β</M>
                <sub>C,S</sub>* <F>exp</F>(<M>k</M>
                <sup>2</sup>) <F>erfc</F>(<M>k</M>)
              </span>
            }
          />
        </FormulaContainer>
        <FormulaContainer label="Voigt Shape Ratio (k)">
          <M>k</M> ={' '}
          <Fraction
            num={
              <>
                <M>β</M>
                <sub>C,S</sub>*
              </>
            }
            den={
              <span>
                √<M>π</M> <M>β</M>
                <sub>G,S</sub>*
              </span>
            }
          />
        </FormulaContainer>
      </div>
    )
  },
  method_of_moments: {
    title: 'Method of Moments (Variance-Range W)',
    tag: 'Statistical Line Profiles',
    icon: Activity,
    color: 'from-indigo-500 to-cyan-500',
    description:
      'Deconvolutes domain size D_V, root-mean-square strain, and dislocation density ρ_d by evaluating second (W) and fourth (μ_4) statistical moments across integration range σ.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Asymptotic Variance W(σ)">
          <M>W</M>(<M>σ</M>) = <M>W</M>
          <sub>0</sub> + <M>K</M>
          <sub>1</sub>
          <M>σ</M> + <M>K</M>
          <sub>2</sub>
          <M>σ</M>
          <sup>2</sup>
        </FormulaContainer>
        <FormulaContainer label="Volume-Weighted Size (D_V)">
          <M>D</M>
          <sub>V</sub> ={' '}
          <Fraction
            num={<M>λ</M>}
            den={
              <span>
                <M>π</M>
                <sup>2</sup> <M>K</M>
                <sub>1</sub> <F>cos</F>
                <M>θ</M>
                <sub>0</sub>
              </span>
            }
          />
        </FormulaContainer>
      </div>
    )
  },
  residual_stress: {
    title: 'Residual Stress (sin²ψ Method)',
    tag: 'Lattice Mechanics',
    icon: Target,
    color: 'from-rose-500 to-amber-500',
    description:
      'Determines non-destructive surface residual stress σ_φ and shear stress τ_φ by measuring elastic lattice d-spacing strain shifts as a function of specimen tilt angle ψ.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Fundamental sin²ψ Equation">
          <M>ε</M>
          <sub>ψ</sub> ={' '}
          <Fraction
            num={
              <span>
                <M>d</M>
                <sub>ψ</sub> − <M>d</M>
                <sub>0</sub>
              </span>
            }
            den={
              <>
                <M>d</M>
                <sub>0</sub>
              </>
            }
          />{' '}
          = (
          <Fraction
            num={
              <span>
                1 + <M>ν</M>
              </span>
            }
            den={<M>E</M>}
          />
          ) <M>σ</M>
          <sub>φ</sub> <F>sin</F>
          <sup>2</sup>
          <M>ψ</M>
        </FormulaContainer>
        <FormulaContainer label="Biaxial Stress Slope">
          <M>σ</M>
          <sub>φ</sub> = (
          <Fraction
            num={<M>E</M>}
            den={
              <span>
                1 + <M>ν</M>
              </span>
            }
          />
          ) ·{' '}
          <Fraction
            num={
              <span>
                ∂(<M>d</M>
                <sub>ψ</sub> / <M>d</M>
                <sub>0</sub>)
              </span>
            }
            den={
              <span>
                ∂(<F>sin</F>
                <sup>2</sup>
                <M>ψ</M>)
              </span>
            }
          />
        </FormulaContainer>
      </div>
    )
  },
  rir: {
    title: 'Reference Intensity Ratio (RIR) Quant',
    tag: 'Quantitative Phase Analysis',
    icon: Database,
    color: 'from-blue-500 to-emerald-500',
    description:
      'Calculates weight fractions W_α in multiphase polycrystalline mixtures using Chung matrix-flushing relative intensity ratios scaled against α-Al₂O₃ Corundum (I/I_c).',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="Chung Adiabatic RIR Equation">
          <M>W</M>
          <sub>α</sub> ={' '}
          <Fraction
            num={
              <span>
                <M>I</M>
                <sub>α</sub> / <M>RIR</M>
                <sub>α</sub>
              </span>
            }
            den={
              <span>
                <F>Σ</F>
                <sub>j</sub> (<M>I</M>
                <sub>j</sub> / <M>RIR</M>
                <sub>j</sub>)
              </span>
            }
          />
        </FormulaContainer>
        <FormulaContainer label="Internal Standard Spiking">
          <M>W</M>
          <sub>amorphous</sub> = 1 − <F>Σ</F> <M>W</M>
          <sub>cryst,j</sub>
        </FormulaContainer>
      </div>
    )
  },
  python_export: {
    title: 'Python Script Generator',
    tag: 'Reproducible Automation',
    icon: Cpu,
    color: 'from-amber-500 to-yellow-500',
    description:
      'Generates standalone SciPy, NumPy, and Matplotlib scripts for programmatic peak deconvolution, Williamson-Hall regression, and publication-grade figure export.',
    formulas: (
      <FormulaContainer label="SciPy Faddeeva Voigt Kernel">
        <M>I</M>(2<M>θ</M>) = <M>I</M>
        <sub>0</sub> · <F>Re</F>[<F>w</F>(<M>z</M>)] / (<M>σ</M> √(2<M>π</M>))
      </FormulaContainer>
    )
  },
  database: {
    title: 'Crystallographic Material Registry',
    tag: 'Reference Database',
    icon: Database,
    color: 'from-cyan-500 to-blue-500',
    description:
      'Searchable repository of inorganic crystal structures, CIF parameters, space groups, Wyckoff positions, and calculated powder diffraction reference patterns.',
    formulas: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormulaContainer label="X-Ray Theoretical Density">
          <M>ρ</M>
          <sub>x</sub> ={' '}
          <Fraction
            num={
              <span>
                <M>Z</M> · <M>M</M>
              </span>
            }
            den={
              <span>
                <M>N</M>
                <sub>A</sub> · <M>V</M>
                <sub>cell</sub>
              </span>
            }
          />
        </FormulaContainer>
        <FormulaContainer label="Linear Attenuation μ">
          <M>I</M>(<M>x</M>) = <M>I</M>
          <sub>0</sub> <F>exp</F>(−<M>μx</M>)
        </FormulaContainer>
      </div>
    )
  },
  periodic_table: {
    title: 'X-Ray Element & Form Factor Database',
    tag: 'Atomic Scattering Physics',
    icon: Sparkles,
    color: 'from-violet-500 to-fuchsia-500',
    description:
      'Cromer-Mann 9-coefficient atomic scattering factors f₀(sinθ/λ), anomalous dispersion corrections (f′, f″), characteristic K/L emission lines, and absorption edges.',
    formulas: (
      <FormulaContainer label="Cromer-Mann Form Factor">
        <M>f</M>
        <sub>0</sub>(<M>s</M>) = <F>Σ</F>
        <sub>i=1..4</sub> <M>a</M>
        <sub>i</sub> <F>exp</F>(−<M>b</M>
        <sub>i</sub> <M>s</M>
        <sup>2</sup>) + <M>c</M>
      </FormulaContainer>
    )
  },
  learn: {
    title: 'Diffraction Protocol Guide',
    tag: 'Experimental Metrology',
    icon: BookOpen,
    color: 'from-blue-600 to-indigo-600',
    description:
      'Interactive operational reference for Bragg-Brentano goniometer alignment, Caglioti instrumental resolution calibration, and systematic error diagnosis.',
    formulas: (
      <FormulaContainer label="Caglioti Instrumental Resolution">
        <M>FWHM</M>
        <sub>inst</sub>
        <sup>2</sup> = <M>U</M> <F>tan</F>
        <sup>2</sup>
        <M>θ</M> + <M>V</M> <F>tan</F>
        <M>θ</M> + <M>W</M>
      </FormulaContainer>
    )
  }
};

export const ModuleIntro: React.FC<ModuleIntroProps> = ({ module, onUnderstand }) => {
  const [skipNext, setSkipNext] = useState<boolean>(() => {
    return localStorage.getItem('xrd_skip_intros') === 'true';
  });

  const content = MODULE_CONTENT[module] || {
    title: 'Specialized Crystallographic Core',
    tag: 'Analytical Physics Engine',
    icon: BookOpen,
    color: 'from-indigo-500 to-cyan-500',
    description: 'High-precision computational solver for structural and microstructural diffraction metrology.',
    formulas: null
  };

  const specializedGraphic = renderModuleSpecializedSchematic(module);

  const handleUnderstandClick = () => {
    if (skipNext) {
      localStorage.setItem('xrd_skip_intros', 'true');
    } else {
      localStorage.setItem('xrd_skip_intros', 'false');
    }
    onUnderstand();
  };

  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.98, y: 16 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 relative">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#070A12] rounded-xl border border-slate-800 overflow-hidden relative"
      >
        {/* Top Instrument Calibration Ribbon */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#0B0F19] px-6 py-3 border-b border-slate-800">
          <div className="text-[11px] font-mono tracking-wider text-slate-300 font-semibold">
            <span className="text-cyan-400">{content.tag}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="text-slate-400">{specializedGraphic.regime}</span>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-white transition-colors group">
              <input
                type="checkbox"
                checked={skipNext}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSkipNext(val);
                  if (val) {
                    localStorage.setItem('xrd_skip_intros', 'true');
                  } else {
                    localStorage.setItem('xrd_skip_intros', 'false');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-slate-700 bg-slate-900 flex items-center justify-center peer-checked:bg-cyan-600 peer-checked:border-cyan-500 transition-all">
                <Check className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[11px] font-mono text-slate-400">Skip Intro on Launch</span>
            </label>

            <button
              onClick={handleUnderstandClick}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Open Workbench
            </button>
          </div>
        </div>

        {/* Header + Bespoke Module-Specific CAD Schematic */}
        <div className="p-8 md:p-10 relative z-10 border-b border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <motion.h1
              variants={itemVariants}
              className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 font-sans"
            >
              {content.title}
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-sm text-slate-300 leading-relaxed font-sans"
            >
              {content.description}
            </motion.p>
          </div>

          {/* Bespoke Module-Specific CAD Schematic */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6 bg-[#0B0F19] border border-slate-800 rounded-xl p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/90 pb-1.5">
              <span className="font-semibold text-cyan-400">{specializedGraphic.caption}</span>
              <span className="text-slate-500">CAD Schematic</span>
            </div>
            {specializedGraphic.svg}
          </motion.div>
        </div>

        {/* Governing Equations & Action Footer */}
        <div className="p-8 md:p-10 space-y-8 relative z-10 bg-[#070A12]">
          {content.formulas && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-3 mb-4">
                <Sigma className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Governing Analytical Formalism
                </h3>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
              <div>{content.formulas}</div>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800/80"
          >
            <div className="flex items-start gap-3 max-w-xl">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200 mb-0.5">
                  Double-Precision Analytical Solver
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All analytical solvers execute with 64-bit floating-point arithmetic and least-squares uncertainty propagation.
                </p>
              </div>
            </div>

            <button
              onClick={handleUnderstandClick}
              className="group flex items-center justify-center px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              <span className="flex items-center gap-1.5">
                Launch Workbench
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
