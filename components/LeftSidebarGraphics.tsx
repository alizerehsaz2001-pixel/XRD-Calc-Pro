import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ModuleScientificMeta {
  symbol: string;
  formula: string;
  shortTag: string;
  accentHex: string;
  categoryCode: string;
}

export const MODULE_SCIENTIFIC_META: Record<string, ModuleScientificMeta> = {
  bragg: {
    symbol: '2θ',
    formula: 'nλ = 2d·sinθ',
    shortTag: 'd(hkl)',
    accentHex: '#6366f1',
    categoryCode: 'FND-01'
  },
  unit_cells: {
    symbol: 'a·b·c',
    formula: 'V = a·(b × c)',
    shortTag: '14 Bravais',
    accentHex: '#8b5cf6',
    categoryCode: 'FND-02'
  },
  fwhm: {
    symbol: 'β₁/₂',
    formula: 'V(x) = ηL + (1-η)G',
    shortTag: 'β · η',
    accentHex: '#06b6d4',
    categoryCode: 'FND-03'
  },
  selection: {
    symbol: 'F(hkl)',
    formula: 'F = ∑ fⱼ·exp(2πi·h·rⱼ)',
    shortTag: 'Extinction',
    accentHex: '#3b82f6',
    categoryCode: 'FND-04'
  },
  preferred_orientation: {
    symbol: 'TC(hkl)',
    formula: 'P(α) = (r²cos²α + sin²α/r)^(-3/2)',
    shortTag: 'Texture',
    accentHex: '#0ea5e9',
    categoryCode: 'FND-05'
  },
  compare: {
    symbol: 'Δ2θ',
    formula: 'Δd/d = -cotθ · Δθ',
    shortTag: 'Overlay',
    accentHex: '#6366f1',
    categoryCode: 'FND-06'
  },
  scherrer: {
    symbol: 'D_hkl',
    formula: 'D = Kλ / (β·cosθ)',
    shortTag: 'Kλ/βcosθ',
    accentHex: '#10b981',
    categoryCode: 'SZS-01'
  },
  wh: {
    symbol: 'β·cosθ',
    formula: 'βcosθ = Kλ/D + 4ε·sinθ',
    shortTag: 'D + 4ε·sinθ',
    accentHex: '#14b8a6',
    categoryCode: 'SZS-02'
  },
  monshi_scherrer: {
    symbol: 'ln β',
    formula: 'ln β = ln(Kλ/D) + ln(1/cosθ)',
    shortTag: 'ln(1/cosθ)',
    accentHex: '#059669',
    categoryCode: 'SZS-03'
  },
  double_voigt: {
    symbol: 'V ∗ V',
    formula: 'β_C = β_CS + β_CD·s²',
    shortTag: 'Voigt Deconv',
    accentHex: '#0d9488',
    categoryCode: 'SZS-04'
  },
  integral: {
    symbol: 'β_int',
    formula: 'βᵢ = ∫ I(2θ)d(2θ) / I_max',
    shortTag: 'Area/I₀',
    accentHex: '#10b981',
    categoryCode: 'SZS-05'
  },
  integral_adv: {
    symbol: 'SSP·HW',
    formula: '(d*β*)² = (K/D)·d*²β* + (ε/2)²',
    shortTag: 'Halder-Wagner',
    accentHex: '#059669',
    categoryCode: 'SZS-06'
  },
  wa: {
    symbol: 'A(L)',
    formula: 'ln A(L) = ln Aˢ(L) - 2π²L²⟨ε²⟩/d²',
    shortTag: 'Fourier A(L)',
    accentHex: '#047857',
    categoryCode: 'SZS-07'
  },
  method_of_moments: {
    symbol: 'M₂·M₄',
    formula: 'M₂(q) = q / (π²⟨D⟩) + ⟨ε²⟩s²',
    shortTag: 'Variance M₂',
    accentHex: '#14b8a6',
    categoryCode: 'SZS-08'
  },
  residual_stress: {
    symbol: 'sin²ψ',
    formula: 'ε_φψ = [(1+ν)/E]·σ_φ·sin²ψ',
    shortTag: 'σ_φ · sin²ψ',
    accentHex: '#f59e0b',
    categoryCode: 'SZS-09'
  },
  xrr: {
    symbol: 'θ_c',
    formula: 'q_z = (4π/λ)·sinθ',
    shortTag: 'Kiessig q_z',
    accentHex: '#06b6d4',
    categoryCode: 'SZS-10'
  },
  cohen: {
    symbol: 'AᵀA',
    formula: '∑ Δsin²θ = ∑ (A·α + B·β + C·γ)',
    shortTag: 'LSQ Matrix',
    accentHex: '#f59e0b',
    categoryCode: 'REF-01'
  },
  metric_tensor: {
    symbol: 'Gᵢⱼ',
    formula: '1/d² = hᵢ · G*ⁱʲ · hⱼ',
    shortTag: 'Gᵢⱼ · G*ⁱʲ',
    accentHex: '#d97706',
    categoryCode: 'REF-02'
  },
  supercell_transform: {
    symbol: 'P_ij',
    formula: "(a',b',c')ᵀ = P · (a,b,c)ᵀ",
    shortTag: 'det(P)·V',
    accentHex: '#ea580c',
    categoryCode: 'REF-03'
  },
  pawley_lebail: {
    symbol: 'R_wp',
    formula: 'R_wp = [∑w(Y_o - Y_c)² / ∑wY_o²]^½',
    shortTag: 'R_wp · χ²',
    accentHex: '#f59e0b',
    categoryCode: 'REF-04'
  },
  rietveld: {
    symbol: '|F_K|²',
    formula: 'y_c = y_bg + ∑ S_p·Lp·|F_K|²·Ω(2θ)',
    shortTag: 'Rietveld · CIF',
    accentHex: '#38bdf8',
    categoryCode: 'REF-06'
  },
  rir: {
    symbol: 'I/I_c',
    formula: 'W_α = (I_α / RIR_α) / ∑(I_k / RIR_k)',
    shortTag: 'I/I_c Quant',
    accentHex: '#eab308',
    categoryCode: 'REF-05'
  },
  neutron: {
    symbol: 'b_coh',
    formula: 'dσ/dΩ = |∑ bⱼ·exp(iQ·rⱼ)|²',
    shortTag: 'b_c · σ_s',
    accentHex: '#a855f7',
    categoryCode: 'SIM-01'
  },
  magnetic: {
    symbol: 'M(Q)',
    formula: 'F_M(Q) = p·∑ f_m(Q)·μⱼ·exp(iQ·rⱼ)',
    shortTag: 'Spin μ_B',
    accentHex: '#ec4899',
    categoryCode: 'SIM-02'
  },
  xrd_nano: {
    symbol: 'I(q)',
    formula: 'I(q) = ∑∑ fᵢfⱼ·sin(q·rᵢⱼ)/(q·rᵢⱼ)',
    shortTag: 'Debye Sum',
    accentHex: '#8b5cf6',
    categoryCode: 'SIM-03'
  },
  python_export: {
    symbol: 'Py·Sci',
    formula: 'scipy.optimize.curve_fit(Voigt)',
    shortTag: 'NumPy/SciPy',
    accentHex: '#3b82f6',
    categoryCode: 'SIM-04'
  },
  dl: {
    symbol: 'CNN',
    formula: 'P(y_k|I) = softmax(W·Φ(2θ))',
    shortTag: 'Phase CNN',
    accentHex: '#ec4899',
    categoryCode: 'AIT-01'
  },
  image_analysis: {
    symbol: 'SAED',
    formula: 'R · d_hkl = L · λ',
    shortTag: 'FFT / Rings',
    accentHex: '#f43f5e',
    categoryCode: 'AIT-02'
  },
  image_gen: {
    symbol: 'SVG',
    formula: 'Vector Schematics · 300 DPI',
    shortTag: 'Schematic',
    accentHex: '#d946ef',
    categoryCode: 'AIT-03'
  },
  learn: {
    symbol: 'SOP',
    formula: 'IUCr Powder Diffraction Protocols',
    shortTag: 'Protocols',
    accentHex: '#64748b',
    categoryCode: 'INT-01'
  },
  periodic_table: {
    symbol: 'f₀(s)',
    formula: 'f(s) = ∑ aᵢ·exp(-bᵢs²) + c + f′ + if″',
    shortTag: 'Z · Kα/Kβ',
    accentHex: '#0ea5e9',
    categoryCode: 'INT-02'
  },
  database: {
    symbol: 'CIF',
    formula: 'COD / ICDD Crystal Structure Index',
    shortTag: 'Registry',
    accentHex: '#6366f1',
    categoryCode: 'INT-03'
  },
  profile: {
    symbol: 'PI',
    formula: 'Principal Investigator Credentials',
    shortTag: 'Director',
    accentHex: '#8b5cf6',
    categoryCode: 'INT-04'
  },
  settings: {
    symbol: 'Δ2θ₀',
    formula: 'Δ2θ = -2(s/R)·cosθ + Δ2θ₀',
    shortTag: 'Calibration',
    accentHex: '#64748b',
    categoryCode: 'INT-05'
  }
};

export const getModuleScientificMeta = (id: string): ModuleScientificMeta => {
  return (
    MODULE_SCIENTIFIC_META[id] || {
      symbol: '2θ',
      formula: 'nλ = 2d·sinθ',
      shortTag: 'XRD',
      accentHex: '#6366f1',
      categoryCode: 'XRD-00'
    }
  );
};

/**
 * Custom scientific SVG micro-schematics for all 33 XRD modules.
 * Replaces generic repeated Lucide icons with precision domain-native crystallography vector art.
 */
export const renderScientificModuleIcon = (id: string, active: boolean): React.ReactNode => {
  const colorClass = active
    ? 'text-white'
    : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300';

  const baseProps = {
    viewBox: '0 0 20 20',
    fill: 'none',
    className: `w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${colorClass}`
  };

  switch (id) {
    case 'bragg':
      // Parallel crystal lattice planes with incident & diffracted X-ray wavevectors
      return (
        <svg {...baseProps}>
          <line x1="2" y1="13.5" x2="18" y2="13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="2" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 2" opacity="0.7" />
          <circle cx="5" cy="13.5" r="1.2" fill="currentColor" />
          <circle cx="10" cy="13.5" r="1.3" fill="currentColor" />
          <circle cx="15" cy="13.5" r="1.2" fill="currentColor" />
          <path d="M3 4.5L10 13.5L17 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 4.5H17V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 10.5A3.5 3.5 0 0 1 12.5 10.5" stroke="currentColor" strokeWidth="1" opacity="0.75" />
        </svg>
      );

    case 'unit_cells':
      // Isometric 3D Bravais unit cell with body-centered atom
      return (
        <svg {...baseProps}>
          <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <polyline points="3,6 10,10 17,6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.85" />
          <line x1="10" y1="10" x2="10" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.85" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
          <circle cx="10" cy="2" r="1.1" fill="currentColor" />
          <circle cx="17" cy="6" r="1.1" fill="currentColor" />
          <circle cx="3" cy="6" r="1.1" fill="currentColor" />
        </svg>
      );

    case 'fwhm':
      // Gaussian/Voigt diffraction peak with horizontal FWHM caliper arrows at half-maximum
      return (
        <svg {...baseProps}>
          <path d="M2 16.5C5.5 16.5 7 15 8.2 8.5C9 4 9.5 2.5 10 2.5C10.5 2.5 11 4 11.8 8.5C13 15 14.5 16.5 18 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4.5" y1="9.5" x2="15.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
          <polyline points="6.5,8 4.8,9.5 6.5,11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="13.5,8 15.2,9.5 13.5,11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'selection':
      // Reciprocal lattice allowed (filled) vs forbidden/extinct (hollow dashed) reflections
      return (
        <svg {...baseProps}>
          <circle cx="5" cy="5" r="2" fill="currentColor" />
          <circle cx="15" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.2" />
          <circle cx="10" cy="10" r="2.2" fill="currentColor" />
          <circle cx="5" cy="15" r="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.2" />
          <circle cx="15" cy="15" r="2" fill="currentColor" />
          <line x1="7" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
          <line x1="5" y1="7" x2="5" y2="13" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
          <line x1="15" y1="7" x2="15" y2="13" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
          <line x1="7" y1="15" x2="13" y2="15" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
        </svg>
      );

    case 'preferred_orientation':
      // Pole figure stereographic contour rings with preferred orientation vector
      return (
        <svg {...baseProps}>
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" />
          <ellipse cx="10" cy="10" rx="5" ry="2.4" transform="rotate(-28 10 10)" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <line x1="10" y1="10" x2="15" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );

    case 'compare':
      // Stacked dual diffractograms for phase comparison
      return (
        <svg {...baseProps}>
          <path d="M2 16.5H6L7.5 10.5L9 16.5H12.5L14 12.5L15.5 16.5H18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 9.5H5L6.8 3.5L8.5 9.5H13.5L15 5.5L16.5 9.5H18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      );

    case 'scherrer':
      // Nanocrystalline polygonal grain with internal lattice planes & size caliper
      return (
        <svg {...baseProps}>
          <polygon points="10,2.5 16.5,6 15.5,14 10,17.5 4.5,14 3.5,6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
          <line x1="5.5" y1="11" x2="14.5" y2="11" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
          <line x1="6.5" y1="14" x2="13.5" y2="14" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
        </svg>
      );

    case 'wh':
      // Williamson-Hall linear regression slope plot (βcosθ vs 4sinθ)
      return (
        <svg {...baseProps}>
          <polyline points="3,3 3,17 17,17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="3" y1="13.5" x2="16.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="6.5" cy="11.3" r="1.4" fill="currentColor" />
          <circle cx="10.5" cy="8.8" r="1.4" fill="currentColor" />
          <circle cx="14.5" cy="6.2" r="1.4" fill="currentColor" />
        </svg>
      );

    case 'monshi_scherrer':
      // Logarithmic linear regression with confidence bounds
      return (
        <svg {...baseProps}>
          <polyline points="3,3 3,17 17,17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="4" y1="14.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M4 12.5L16 2.8M4 16.2L16 6.5" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.5 1.5" opacity="0.65" />
          <circle cx="8" cy="11.2" r="1.3" fill="currentColor" />
          <circle cx="13" cy="7" r="1.3" fill="currentColor" />
        </svg>
      );

    case 'double_voigt':
      // Two overlapping Gaussian + Lorentzian profile curves convolving
      return (
        <svg {...baseProps}>
          <path d="M2 16C5 16 6.5 5 8.5 5C10.5 5 12 16 15 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M5 16C8 16 9.5 6.5 11.5 6.5C13.5 6.5 15 16 18 16" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 1.5" strokeLinecap="round" />
        </svg>
      );

    case 'integral':
      // Peak with equivalent integral breadth rectangle (Area / I_max)
      return (
        <svg {...baseProps}>
          <rect x="6.2" y="4" width="7.6" height="12.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" opacity="0.8" />
          <path d="M2.5 16.5C5.5 16.5 7.2 14 8.5 7.5C9.2 4.5 9.6 4 10 4C10.4 4 10.8 4.5 11.5 7.5C12.8 14 14.5 16.5 17.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'integral_adv':
      // Size-Strain Plot (SSP) parabolic / linear curve with intercept marker
      return (
        <svg {...baseProps}>
          <polyline points="3,3 3,17 17,17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 14.5Q9 12 16.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="7" cy="12.8" r="1.3" fill="currentColor" />
          <circle cx="11.5" cy="9.6" r="1.3" fill="currentColor" />
          <circle cx="15" cy="6.1" r="1.3" fill="currentColor" />
        </svg>
      );

    case 'wa':
      // Warren-Averbach Fourier cosine harmonic decay A(L) vs column length L
      return (
        <svg {...baseProps}>
          <polyline points="2.5,3 2.5,17 17.5,17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 5C6 5 7.5 10 11 13.5C13.5 15.5 15.5 16.2 17.5 16.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2.5" y1="5" x2="10.5" y2="17" stroke="currentColor" strokeWidth="1.1" strokeDasharray="1.5 1.5" opacity="0.75" />
        </svg>
      );

    case 'method_of_moments':
      // Variance M2(q) linear asymptote at peak tails
      return (
        <svg {...baseProps}>
          <polyline points="3,3 3,17 17,17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.5 16.5C5.5 16.2 7 13.5 9.5 10.5L16.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6.5" y1="13.2" x2="16.5" y2="4" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />
        </svg>
      );

    case 'residual_stress':
      // Opposing biaxial stress arrows acting on tilted crystal planes (sin²ψ)
      return (
        <svg {...baseProps}>
          <line x1="5" y1="15" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7.5" y1="16.5" x2="16.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
          <line x1="3.5" y1="12.5" x2="12.5" y2="3.5" stroke="currentColor" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
          <path d="M2 6H6M2 6L4 4M2 6L4 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 14H14M18 14L16 12M18 14L16 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'xrr':
      // Kiessig interference fringes damped oscillation curve
      return (
        <svg {...baseProps}>
          <path d="M2 4.5H5.5C6.5 4.5 7 9 8 9C9 9 9.5 6.5 10.5 6.5C11.5 6.5 12 12.5 13 12.5C14 12.5 14.5 10.5 15.5 10.5C16.5 10.5 17 16 18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'cohen':
      // Matrix brackets [A^T A] with grid elements
      return (
        <svg {...baseProps}>
          <path d="M5.5 3.5H3V16.5H5.5M14.5 3.5H17V16.5H14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
          <circle cx="12.5" cy="7.5" r="1.2" fill="currentColor" />
          <circle cx="7.5" cy="12.5" r="1.2" fill="currentColor" />
          <circle cx="12.5" cy="12.5" r="1.2" fill="currentColor" />
        </svg>
      );

    case 'metric_tensor':
      // Covariant/Contravariant metric tensor G_ij basis vectors
      return (
        <svg {...baseProps}>
          <path d="M4 15L4 4.5M4 4.5L2.5 6.5M4 4.5L5.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15L15.5 15M15.5 15L13.5 13.5M15.5 15L13.5 16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15L13.5 6.5M13.5 6.5L11 6.5M13.5 6.5L13.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 15A4.5 4.5 0 0 0 4 10.5" stroke="currentColor" strokeWidth="1.1" strokeDasharray="1.5 1.2" />
        </svg>
      );

    case 'supercell_transform':
      // Unit cell expanding into 2x2 supercell transformation grid
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 1.5" />
          <rect x="3" y="10" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.18" />
          <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
        </svg>
      );

    case 'pawley_lebail':
    case 'rietveld':
      // Diffractogram peak with Bragg reflection tick marks & residual line below
      return (
        <svg {...baseProps}>
          <path d="M2.5 12C6 12 7.5 11 8.8 5.5C9.4 3 9.7 2.5 10 2.5C10.3 2.5 10.6 3 11.2 5.5C12.5 11 14 12 17.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="14" x2="6" y2="15.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="14" x2="10" y2="15.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="14" y1="14" x2="14" y2="15.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M2.5 17.5H8L9.5 16.8L10.5 18.2L12 17.5H17.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    case 'rir':
      // Quantitative multiphase bar chart with I/I_c ratio line
      return (
        <svg {...baseProps}>
          <rect x="3.5" y="8.5" width="3" height="8" rx="0.8" fill="currentColor" />
          <rect x="8.5" y="4" width="3" height="12.5" rx="0.8" fill="currentColor" opacity="0.85" />
          <rect x="13.5" y="11" width="3" height="5.5" rx="0.8" fill="currentColor" opacity="0.65" />
          <line x1="2" y1="16.5" x2="18" y2="16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );

    case 'neutron':
      // Atomic nucleus with elliptical neutron scattering trajectories
      return (
        <svg {...baseProps}>
          <ellipse cx="10" cy="10" rx="7.5" ry="3.2" transform="rotate(35 10 10)" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="10" cy="10" rx="7.5" ry="3.2" transform="rotate(-35 10 10)" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="10" cy="10" r="2.2" fill="currentColor" />
        </svg>
      );

    case 'magnetic':
      // Lattice sites with antiferromagnetic/ferromagnetic spin vectors
      return (
        <svg {...baseProps}>
          <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <circle cx="6" cy="14" r="1.6" fill="currentColor" />
          <circle cx="14" cy="14" r="1.6" fill="currentColor" />
          <path d="M6 17V5M6 5L4 7.5M6 5L8 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 5V17M14 17L12 14.5M14 17L16 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'xrd_nano':
      // Core-shell nanoparticle cluster with radial atomic shells
      return (
        <svg {...baseProps}>
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
          <circle cx="10" cy="5.5" r="1" fill="currentColor" />
          <circle cx="10" cy="14.5" r="1" fill="currentColor" />
          <circle cx="5.5" cy="10" r="1" fill="currentColor" />
          <circle cx="14.5" cy="10" r="1" fill="currentColor" />
        </svg>
      );

    case 'python_export':
      // Terminal chevron prompt `>_` with matrix brackets
      return (
        <svg {...baseProps}>
          <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <polyline points="6,7.5 9,10 6,12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="10.5" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'dl':
      // Neural network nodes connected to a diffraction peak output
      return (
        <svg {...baseProps}>
          <circle cx="4.5" cy="5.5" r="1.5" fill="currentColor" />
          <circle cx="4.5" cy="10" r="1.5" fill="currentColor" />
          <circle cx="4.5" cy="14.5" r="1.5" fill="currentColor" />
          <circle cx="10.5" cy="7.5" r="1.6" fill="currentColor" />
          <circle cx="10.5" cy="12.5" r="1.6" fill="currentColor" />
          <circle cx="16" cy="10" r="1.8" fill="currentColor" />
          <path d="M6 5.5L9 7.5M6 10L9 7.5M6 10L9 12.5M6 14.5L9 12.5M12 7.5L14.5 10M12 12.5L14.5 10" stroke="currentColor" strokeWidth="1.1" opacity="0.8" />
        </svg>
      );

    case 'image_analysis':
      // 2D Debye-Scherrer diffraction rings with crosshair reticle
      return (
        <svg {...baseProps}>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5" />
          <circle cx="10" cy="10" r="1.2" fill="currentColor" />
          <line x1="10" y1="1.5" x2="10" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="16" x2="10" y2="18.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="1.5" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="16" y1="10" x2="18.5" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'image_gen':
      // Technical vector drafting compass & crystal prism
      return (
        <svg {...baseProps}>
          <polygon points="10,2.5 17,15.5 3,15.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="10" y1="2.5" x2="10" y2="15.5" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
          <circle cx="10" cy="11" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'learn':
      // Scientific protocol manual with Bragg equation wave
      return (
        <svg {...baseProps}>
          <path d="M3 4.5C3 3.7 3.7 3 4.5 3H9.5V16.5H4.5C3.7 16.5 3 15.8 3 15V4.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M17 4.5C17 3.7 16.3 3 15.5 3H10.5V16.5H15.5C16.3 16.5 17 15.8 17 15V4.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );

    case 'periodic_table':
      // Periodic element tile with atomic number Z and electron shell
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <line x1="3" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="9" y1="3" x2="9" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <circle cx="6" cy="5.5" r="1.1" fill="currentColor" />
          <circle cx="13" cy="12.5" r="1.6" fill="currentColor" />
        </svg>
      );

    case 'database':
      // Indexed crystallographic CIF database cylinders
      return (
        <svg {...baseProps}>
          <ellipse cx="10" cy="5" rx="6.5" ry="2.3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.5 5V10C3.5 11.3 6.4 12.3 10 12.3C13.6 12.3 16.5 11.3 16.5 10V5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.5 10V15C3.5 16.3 6.4 17.3 10 17.3C13.6 17.3 16.5 16.3 16.5 15V10" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );

    case 'profile':
      // Principal Investigator badge with crystallographic hex crest
      return (
        <svg {...baseProps}>
          <circle cx="10" cy="6.8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4 16.8C4 13.8 6.7 11.8 10 11.8C13.3 11.8 16 13.8 16 16.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'settings':
      // Goniometer calibration vernier & precision micrometers
      return (
        <svg {...baseProps}>
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 2" />
          <line x1="10" y1="1.5" x2="10" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="10" y1="16" x2="10" y2="18.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="1.5" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="16" y1="10" x2="18.5" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg {...baseProps}>
          <path d="M2 15H6L8.5 5L11.5 15L14 9L16 15H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

/**
 * Category header metadata & custom SVG emblems for the 6 sidebar sections
 */
export const getCategoryMeta = (groupName: string) => {
  const lower = groupName.toLowerCase();
  if (lower.includes('fundamental')) {
    return {
      symbol: '2θ · d',
      code: 'SEC-01',
      color: 'text-indigo-500 dark:text-indigo-400',
      borderAccent: 'border-indigo-500/30',
      svg: (
        <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0">
          <line x1="1.5" y1="11.5" x2="12.5" y2="11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M2.5 3.5L7 11.5L11.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="11.5" r="1.3" fill="currentColor" />
        </svg>
      )
    };
  }
  if (lower.includes('size') || lower.includes('strain')) {
    return {
      symbol: 'β · ε',
      code: 'SEC-02',
      color: 'text-emerald-500 dark:text-emerald-400',
      borderAccent: 'border-emerald-500/30',
      svg: (
        <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0">
          <polyline points="2,2 2,12 12,12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="2.5" y1="10" x2="11.5" y2="3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="5.5" cy="7.8" r="1.1" fill="currentColor" />
          <circle cx="9.5" cy="5" r="1.1" fill="currentColor" />
        </svg>
      )
    };
  }
  if (lower.includes('refinement')) {
    return {
      symbol: 'Gᵢⱼ · R',
      code: 'SEC-03',
      color: 'text-amber-500 dark:text-amber-400',
      borderAccent: 'border-amber-500/30',
      svg: (
        <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0">
          <path d="M4 2.5H2V11.5H4M10 2.5H12V11.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
          <circle cx="8.5" cy="5.5" r="1" fill="currentColor" />
          <circle cx="5.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
        </svg>
      )
    };
  }
  if (lower.includes('sim')) {
    return {
      symbol: 'Ψ(Q)',
      code: 'SEC-04',
      color: 'text-purple-500 dark:text-purple-400',
      borderAccent: 'border-purple-500/30',
      svg: (
        <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0">
          <ellipse cx="7" cy="7" rx="5.5" ry="2.2" transform="rotate(30 7 7)" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="7" cy="7" rx="5.5" ry="2.2" transform="rotate(-30 7 7)" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
      )
    };
  }
  if (lower.includes('ai')) {
    return {
      symbol: 'Φ_CNN',
      code: 'SEC-05',
      color: 'text-pink-500 dark:text-pink-400',
      borderAccent: 'border-pink-500/30',
      svg: (
        <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400 shrink-0">
          <circle cx="3" cy="4" r="1.2" fill="currentColor" />
          <circle cx="3" cy="10" r="1.2" fill="currentColor" />
          <circle cx="7.5" cy="7" r="1.4" fill="currentColor" />
          <circle cx="11.5" cy="7" r="1.4" fill="currentColor" />
          <path d="M4 4.5L6.5 6.5M4 9.5L6.5 7.5M8.8 7H10.2" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      )
    };
  }
  return {
    symbol: 'Z · CIF',
    code: 'SEC-06',
    color: 'text-sky-500 dark:text-sky-400',
    borderAccent: 'border-sky-500/30',
    svg: (
      <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0">
        <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="2" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="6.5" y1="2" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>
    )
  };
};

/**
 * Interactive Ewald Sphere & Bragg Goniometer Telemetry Graphic Card
 * Displayed at the top of the expanded left sidebar.
 */
interface SidebarGoniometerTelemetryProps {
  activeModule: string;
  wavelength: number;
  goniometerRadius: number;
  peaksCount: number;
  crystalSystem: string;
  theme: string;
  onOpenWelcome: () => void;
  onOpenWhyXrd: () => void;
}

export const SidebarGoniometerTelemetryCard: React.FC<SidebarGoniometerTelemetryProps> = ({
  activeModule,
  wavelength,
  goniometerRadius,
  peaksCount,
  crystalSystem,
  theme,
  onOpenWelcome,
  onOpenWhyXrd
}) => {
  const [isCompact, setIsCompact] = useState(false);
  const meta = getModuleScientificMeta(activeModule);
  const isCyber = theme === 'cyberpunk';

  return (
    <div className="px-3.5 pt-3 pb-1 shrink-0 space-y-2">
      {/* Ewald Diffraction & Bragg Plane Telemetry Schematic */}
      <div
        className={`rounded-xl border overflow-hidden transition-all ${
          isCyber
            ? 'bg-slate-950/90 border-cyber-accent/35 shadow-[0_0_15px_rgba(0,255,159,0.08)]'
            : 'bg-slate-900 dark:bg-slate-950/90 border-slate-800 dark:border-white/10 shadow-md'
        }`}
      >
        {/* Top Instrument Header Bar */}
        <div className="px-2.5 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: isCyber ? '#00ff9f' : meta.accentHex }}
            />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
              {meta.categoryCode} <span className="text-slate-600">·</span>{' '}
              <span className="text-indigo-400">{meta.symbol}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tabular-nums text-slate-400">
              λ={wavelength.toFixed(4)}Å
            </span>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title={isCompact ? 'Expand Ewald Schematic' : 'Collapse Ewald Schematic'}
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  isCompact ? '-rotate-90' : 'rotate-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Interactive SVG Ewald Sphere & Bragg Lattice Schematic */}
        {!isCompact && (
          <div className="px-2.5 pt-2 pb-1.5 relative">
            <svg
              viewBox="0 0 232 58"
              fill="none"
              className="w-full h-[54px] select-none overflow-visible"
              aria-label="Ewald Sphere and Bragg Diffraction Geometry"
            >
              <defs>
                <linearGradient id="sidebarBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="50%" stopColor={meta.accentHex} stopOpacity="1" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
                </linearGradient>
                <radialGradient id="ewaldGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={meta.accentHex} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={meta.accentHex} stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Subtle Reciprocal Grid Lines */}
              <line x1="6" y1="44" x2="138" y2="44" stroke="#334155" strokeWidth="1" />
              <line x1="12" y1="51" x2="132" y2="51" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 2" />

              {/* Ewald Sphere Arc (1/λ) */}
              <path
                d="M 18 44 A 54 54 0 0 1 126 44"
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2.5 2"
              />
              {/* Active 2θ Goniometer Arc */}
              <path
                d="M 96 44 A 24 24 0 0 0 88 26"
                stroke="#f59e0b"
                strokeWidth="1.2"
              />
              <text x="101" y="36" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                2θ
              </text>

              {/* Ewald Center Glow */}
              <circle cx="72" cy="44" r="16" fill="url(#ewaldGlow)" />

              {/* Incident X-Ray Beam k_0 */}
              <line
                x1="14"
                y1="14"
                x2="72"
                y2="44"
                stroke="#38bdf8"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {/* Incident Wavevector Arrowhead */}
              <polygon points="46,27 40,26.5 43,31.5" fill="#38bdf8" />
              <text x="16" y="11" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                k₀(λ)
              </text>

              {/* Transmitted Direct Beam Reference (dashed) */}
              <line
                x1="72"
                y1="44"
                x2="118"
                y2="44"
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Diffracted Bragg Beam k_hkl */}
              <line
                x1="72"
                y1="44"
                x2="124"
                y2="11"
                stroke="url(#sidebarBeamGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <polygon points="103,24.3 97,25 100.5,29.5" fill="#f59e0b" />

              {/* Scattering Vector Q = k - k_0 (vertical normal to planes) */}
              <line
                x1="72"
                y1="44"
                x2="72"
                y2="12"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeDasharray="1.5 1.5"
              />
              <polygon points="72,10 69.5,14.5 74.5,14.5" fill="#a855f7" />
              <text x="61" y="10" fill="#c084fc" fontSize="7" fontFamily="monospace" fontWeight="bold">
                q_hkl
              </text>

              {/* Crystal Lattice Atomic Nodes on Plane */}
              {[32, 52, 72, 92, 112].map((cx, idx) => (
                <circle
                  key={cx}
                  cx={cx}
                  cy={44}
                  r={idx === 2 ? '2.6' : '1.7'}
                  fill={idx === 2 ? '#f59e0b' : '#94a3b8'}
                />
              ))}
              {[42, 62, 82, 102].map((cx) => (
                <circle key={cx} cx={cx} cy={51} r="1.2" fill="#475569" />
              ))}

              {/* Right-Side Live Mini Diffractogram & Telemetry Readout */}
              <line x1="144" y1="6" x2="144" y2="52" stroke="#1e293b" strokeWidth="1" />

              <text x="150" y="14" fill="#94a3b8" fontSize="7" fontFamily="monospace" fontWeight="bold">
                SYS:{crystalSystem} · R:{goniometerRadius}
              </text>
              <text x="150" y="25" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                {peaksCount} REFL ACTIVE
              </text>

              {/* Mini Profile Trace */}
              <path
                d="M 150 49 L 160 49 L 164 33 L 168 49 L 178 49 L 183 29 L 188 49 L 198 49 L 202 38 L 206 49 L 216 49 L 220 41 L 224 49 L 228 49"
                stroke={isCyber ? '#00ff9f' : '#818cf8'}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bottom Formula Strip */}
            <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9.5px] font-mono">
              <span className="text-slate-400 truncate" title={meta.formula}>
                <span className="text-slate-500">EQ:</span>{' '}
                <span className="text-amber-300/95 font-semibold">{meta.formula}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dual Scientific Navigation Portals (Replaces Sparkles & Pills) */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={onOpenWelcome}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex items-center gap-2 cursor-pointer group text-left"
          title="Return to 3D Interactive Welcome Showcase & Guided Tour"
        >
          <svg
            viewBox="0 0 18 18"
            fill="none"
            className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform"
          >
            <polygon
              points="9,1.5 15.5,5.2 15.5,12.8 9,16.5 2.5,12.8 2.5,5.2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <polyline points="2.5,5.2 9,9 15.5,5.2" stroke="currentColor" strokeWidth="1.1" />
            <line x1="9" y1="9" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          </svg>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
              3D Lab Tour
            </span>
            <span className="block text-[8.5px] font-mono text-slate-400 dark:text-slate-500 truncate">
              Showcase · Home
            </span>
          </div>
        </button>

        <button
          onClick={onOpenWhyXrd}
          className="px-2.5 py-1.5 rounded-lg border border-amber-500/25 dark:border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/10 hover:border-amber-500/45 transition-all flex items-center gap-2 cursor-pointer group text-left"
          title="Explore How X-Ray Diffraction Solves Problems Across 8+ Scientific Disciplines"
        >
          <svg
            viewBox="0 0 18 18"
            fill="none"
            className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform"
          >
            <circle cx="9" cy="9" r="2" fill="currentColor" />
            <ellipse cx="9" cy="9" rx="7" ry="2.8" transform="rotate(30 9 9)" stroke="currentColor" strokeWidth="1.2" />
            <ellipse cx="9" cy="9" rx="7" ry="2.8" transform="rotate(-30 9 9)" stroke="currentColor" strokeWidth="1.2" />
            <line x1="9" y1="1.5" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />
          </svg>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate leading-tight">
              Why XRD?
            </span>
            <span className="block text-[8.5px] font-mono text-amber-600/70 dark:text-amber-400/70 truncate">
              8+ Disciplines
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
