import { EquationLegendItem } from './MathFormula';

export interface ModuleMathEntry {
  symbolTex: string;
  compactTex: string;
  displayTex: string;
  dimension?: string;
  legend?: EquationLegendItem[];
}

export const MODULE_MATH_CATALOG: Record<string, ModuleMathEntry> = {
  bragg: {
    symbolTex: '2\\theta',
    compactTex: 'n\\lambda = 2d_{hkl}\\sin\\theta',
    displayTex: 'n\\lambda = 2d_{hkl}\\sin\\theta \\;\\Longrightarrow\\; d_{hkl} = \\frac{n\\lambda}{2\\sin\\theta}',
    dimension: '[L] · Å',
    legend: [
      { symbol: 'λ', meaning: 'Wavelength (Å)' },
      { symbol: 'd_hkl', meaning: 'Interplanar spacing (Å)' },
      { symbol: 'θ', meaning: 'Bragg angle' },
    ],
  },
  unit_cells: {
    symbolTex: 'a\\,b\\,c',
    compactTex: 'V = \\mathbf{a}\\cdot(\\mathbf{b}\\times\\mathbf{c})',
    displayTex: 'V = abc\\sqrt{1 - \\cos^2\\alpha - \\cos^2\\beta - \\cos^2\\gamma + 2\\cos\\alpha\\cos\\beta\\cos\\gamma}',
    dimension: '[L³] · Å³',
    legend: [
      { symbol: 'a', meaning: 'Lattice axes (a, b, c)' },
      { symbol: 'α', meaning: 'Interaxial angles (α, β, γ)' },
    ],
  },
  fwhm: {
    symbolTex: '\\beta_{1/2}',
    compactTex: 'pV(x) = \\eta L(x) + (1-\\eta)G(x)',
    displayTex: 'I(2\\theta) = I_0\\Big[\\eta\\,L(2\\theta;\\,2\\theta_0,\\beta) + (1-\\eta)\\,G(2\\theta;\\,2\\theta_0,\\beta)\\Big]',
    dimension: 'FWHM [°] · η ∈ [0,1]',
    legend: [
      { symbol: 'η', meaning: 'Lorentzian mixing fraction' },
      { symbol: 'β', meaning: 'Full width at half maximum' },
    ],
  },
  selection: {
    symbolTex: 'F_{hkl}',
    compactTex: 'F_{hkl} = \\sum_j f_j\\,e^{2\\pi i(hx_j+ky_j+lz_j)}',
    displayTex: 'F_{hkl} = \\sum_{j=1}^{N} f_j(\\theta)\\,e^{2\\pi i(h x_j + k y_j + l z_j)}',
    dimension: 'Structure Factor [e⁻]',
    legend: [
      { symbol: 'f', meaning: 'Atomic form factor' },
      { symbol: 'h', meaning: 'Miller indices (hkl)' },
    ],
  },
  preferred_orientation: {
    symbolTex: 'P_{K}',
    compactTex: 'P(\\alpha) = (r^2\\cos^2\\alpha + r^{-1}\\sin^2\\alpha)^{-3/2}',
    displayTex: 'P_{\\mathrm{MD}}(r,\\alpha) = \\left(r^2\\cos^2\\alpha + r^{-1}\\sin^2\\alpha\\right)^{-3/2}',
    dimension: 'March–Dollase [1]',
    legend: [
      { symbol: 'r', meaning: 'March habit parameter' },
      { symbol: 'α', meaning: 'Pole-axis angle' },
    ],
  },
  compare: {
    symbolTex: '\\Delta 2\\theta',
    compactTex: '\\frac{\\Delta d}{d} = -\\cot\\theta\\,\\Delta\\theta',
    displayTex: '\\frac{\\Delta d}{d} = -\\cot\\theta\\,\\Delta\\theta, \\qquad \\varepsilon = \\frac{d - d_0}{d_0}',
    dimension: 'Strain / Shift [1]',
  },
  xrd_curve_builder: {
    symbolTex: 'X_c',
    compactTex: 'X_c = \\frac{A_c}{A_c + A_a}\\times 100\\%',
    displayTex: 'X_c = \\frac{\\int I_{\\mathrm{cryst}}(2\\theta)\\,\\mathrm{d}(2\\theta)}{\\int I_{\\mathrm{cryst}}(2\\theta)\\,\\mathrm{d}(2\\theta) + \\int I_{\\mathrm{amorph}}(2\\theta)\\,\\mathrm{d}(2\\theta)} \\times 100\\%',
    dimension: 'Crystallinity [0–100%]',
    legend: [
      { symbol: 'A_c', meaning: 'Integrated crystalline area' },
      { symbol: 'A_a', meaning: 'Integrated amorphous halo area' },
    ],
  },
  scherrer: {
    symbolTex: 'D_{hkl}',
    compactTex: 'D_{hkl} = \\frac{K\\lambda}{\\beta\\cos\\theta}',
    displayTex: 'D_{hkl} = \\frac{K_{hkl}\\,\\lambda}{\\beta_{\\mathrm{sample}}\\,\\cos\\theta}',
    dimension: '[L] · nm',
    legend: [
      { symbol: 'K_hkl', meaning: 'Shape factor (~0.90)' },
      { symbol: 'λ', meaning: 'X-ray wavelength (nm)' },
      { symbol: 'β_sample', meaning: 'Intrinsic FWHM (rad)' },
      { symbol: 'θ', meaning: 'Bragg angle (rad)' },
    ],
  },
  wh: {
    symbolTex: '\\beta\\cos\\theta',
    compactTex: '\\beta\\cos\\theta = \\frac{K\\lambda}{D} + 4\\varepsilon\\sin\\theta',
    displayTex: '\\beta_{hkl}\\cos\\theta = \\frac{K\\lambda}{D} + 4\\varepsilon\\sin\\theta',
    dimension: 'UDM / USDM / UDEDM',
    legend: [
      { symbol: 'D', meaning: 'Coherent size (nm)' },
      { symbol: 'ε', meaning: 'Lattice microstrain' },
    ],
  },
  monshi_scherrer: {
    symbolTex: '\\ln\\beta',
    compactTex: '\\ln\\beta = \\ln\\!\\left(\\frac{K\\lambda}{D}\\right) + \\ln\\!\\left(\\frac{1}{\\cos\\theta}\\right)',
    displayTex: '\\ln\\beta_{hkl} = \\ln\\!\\left(\\frac{K\\lambda}{D}\\right) + \\ln\\!\\left(\\frac{1}{\\cos\\theta}\\right)',
    dimension: 'Log-Linear Regression',
  },
  double_voigt: {
    symbolTex: 'V\\!*\\!V',
    compactTex: '\\beta_C = \\beta_{C,S} + \\beta_{C,D}s^2',
    displayTex: '\\beta_{C}(s) = \\beta_{C,S} + \\beta_{C,D}\\,s^2, \\qquad \\beta_{G}^2(s) = \\beta_{G,S}^2 + \\beta_{G,D}^2\\,s^2',
    dimension: 'Langford Voigt Deconv.',
  },
  integral: {
    symbolTex: '\\beta_i',
    compactTex: '\\beta = \\frac{1}{I_{\\max}}\\int I(2\\theta)\\,\\mathrm{d}(2\\theta)',
    displayTex: '\\beta = \\frac{\\int_{-\\infty}^{+\\infty} I(2\\theta)\\,\\mathrm{d}(2\\theta)}{I_{\\max}}, \\qquad \\phi = \\frac{\\mathrm{FWHM}}{\\beta}',
    dimension: 'Integral Breadth [rad]',
  },
  integral_adv: {
    symbolTex: '\\mathrm{HW}',
    compactTex: '\\left(\\frac{\\beta^*}{d^*}\\right)^2 = \\frac{K}{D}\\frac{\\beta^*}{(d^*)^2} + \\left(\\frac{\\varepsilon}{2}\\right)^2',
    displayTex: '\\left(\\frac{\\beta^*}{d^*}\\right)^2 = \\frac{K}{D}\\left(\\frac{\\beta^*}{(d^*)^2}\\right) + \\left(\\frac{\\varepsilon}{2}\\right)^2',
    dimension: 'Halder–Wagner & SSP',
  },
  wa: {
    symbolTex: 'A(L)',
    compactTex: '\\ln A(L) = \\ln A^S(L) - \\frac{2\\pi^2 L^2\\langle\\varepsilon_L^2\\rangle}{d^2}',
    displayTex: '\\ln A(L, d) = \\ln A^{S}(L) - \\frac{2\\pi^2 L^2\\langle\\varepsilon_L^2\\rangle}{d^2}',
    dimension: 'Fourier Column Analysis',
  },
  method_of_moments: {
    symbolTex: 'M_2',
    compactTex: 'M_2(q) = \\frac{q}{\\pi^2\\langle D\\rangle} + \\langle\\varepsilon^2\\rangle s^2',
    displayTex: 'M_2(q) = \\frac{\\int_{-q}^{q} (s - s_0)^2 I(s)\\,\\mathrm{d}s}{\\int_{-q}^{q} I(s)\\,\\mathrm{d}s} = \\frac{q}{\\pi^2\\langle D\\rangle} + \\langle\\varepsilon^2\\rangle s_0^2',
    dimension: 'Restricted Variance',
  },
  residual_stress: {
    symbolTex: '\\sin^2\\psi',
    compactTex: '\\varepsilon_{\\phi\\psi} = \\frac{1+\\nu}{E}\\sigma_\\phi\\sin^2\\psi',
    displayTex: '\\varepsilon_{\\phi\\psi} = \\frac{d_{\\phi\\psi} - d_0}{d_0} = \\frac{1+\\nu}{E}\\,\\sigma_{\\phi}\\sin^2\\psi - \\frac{\\nu}{E}(\\sigma_{11}+\\sigma_{22})',
    dimension: 'Stress [MPa]',
  },
  xrr: {
    symbolTex: '\\theta_c',
    compactTex: 'q_z = \\frac{4\\pi}{\\lambda}\\sin\\theta',
    displayTex: 'R(q_z) = \\left|\\frac{r_{0,1} + r_{1,2}\\,e^{-2iq_{z,1}d}}{1 + r_{0,1}r_{1,2}\\,e^{-2iq_{z,1}d}}\\right|^2, \\qquad q_z = \\frac{4\\pi}{\\lambda}\\sin\\theta',
    dimension: 'Parratt Fresnel [Å⁻¹]',
  },
  cohen: {
    symbolTex: '\\mathbf{A}^\\top\\mathbf{A}',
    compactTex: '\\sin^2\\theta = A\\alpha + B\\beta + C\\gamma + D\\delta',
    displayTex: '\\left(\\mathbf{A}^\\top\\mathbf{W}\\mathbf{A}\\right)\\mathbf{x} = \\mathbf{A}^\\top\\mathbf{W}\\mathbf{y}, \\qquad \\delta = 10\\sin^2(2\\theta)',
    dimension: 'Weighted LSQ Matrix',
  },
  metric_tensor: {
    symbolTex: 'G_{ij}',
    compactTex: 'd_{hkl}^{-2} = \\mathbf{h}^\\top\\mathbf{G}^*\\mathbf{h}',
    displayTex: 'G_{ij} = \\mathbf{a}_i\\cdot\\mathbf{a}_j, \\qquad \\mathbf{G}^* = \\mathbf{G}^{-1}, \\qquad \\frac{1}{d_{hkl}^2} = \\sum_{i,j} h_i\\,G^{*ij}\\,h_j',
    dimension: 'Reciprocal Metric [Å⁻²]',
  },
  supercell_transform: {
    symbolTex: '\\mathbf{P}',
    compactTex: '(\\mathbf{a}\',\\mathbf{b}\',\\mathbf{c}\')^\\top = \\mathbf{P}(\\mathbf{a},\\mathbf{b},\\mathbf{c})^\\top',
    displayTex: '(\\mathbf{a}\',\\mathbf{b}\',\\mathbf{c}\')^\\top = \\mathbf{P}(\\mathbf{a},\\mathbf{b},\\mathbf{c})^\\top, \\qquad V\' = |\\det\\mathbf{P}|\\,V',
    dimension: 'Linear Lattice Map',
  },
  pawley_lebail: {
    symbolTex: 'R_{\\mathrm{wp}}',
    compactTex: 'R_{\\mathrm{wp}} = \\sqrt{\\frac{\\sum w_i(y_{o,i}-y_{c,i})^2}{\\sum w_i y_{o,i}^2}}',
    displayTex: 'I_k^{(n+1)} = I_k^{(n)}\\sum_i \\frac{y_{o,i}\\,\\Phi(2\\theta_i - 2\\theta_k)}{y_{c,i}^{(n)}}, \\qquad R_{\\mathrm{wp}} = \\sqrt{\\frac{\\sum w_i(y_{o,i}-y_{c,i})^2}{\\sum w_i y_{o,i}^2}}',
    dimension: 'Whole-Pattern Decomp.',
  },
  rietveld: {
    symbolTex: '|F_K|^2',
    compactTex: 'y_{c,i} = y_{b,i} + \\sum S_p L_K |F_K|^2\\Omega_K',
    displayTex: 'y_{c,i} = y_{b,i} + \\sum_{\\phi} S_{\\phi}\\sum_{K} L_K\\,|F_{K,\\phi}|^2\\,\\Omega(2\\theta_i - 2\\theta_K)\\,P_K',
    dimension: 'Full-Profile Refinement',
  },
  pdf_analysis: {
    symbolTex: 'G(r)',
    compactTex: 'G(r) = \\frac{2}{\\pi}\\int Q[S(Q)-1]\\sin(Qr)\\,\\mathrm{d}Q',
    displayTex: 'G(r) = \\frac{2}{\\pi}\\int_{0}^{Q_{\\max}} Q\\big[S(Q) - 1\\big]\\sin(Qr)\\,\\mathrm{d}Q',
    dimension: 'Real-Space PDF [Å⁻²]',
  },
  rir: {
    symbolTex: 'I/I_c',
    compactTex: 'W_\\alpha = \\frac{I_\\alpha / \\mathrm{RIR}_\\alpha}{\\sum_k I_k / \\mathrm{RIR}_k}',
    displayTex: 'W_{\\alpha} = \\frac{I_{\\alpha} / \\mathrm{RIR}_{\\alpha}}{\\sum_{k=1}^{M} \\left(I_k / \\mathrm{RIR}_k\\right)} \\times 100\\,\\mathrm{wt\\%}',
    dimension: 'Corundum Matrix QPA',
  },
  neutron: {
    symbolTex: 'b_c',
    compactTex: '\\frac{\\mathrm{d}\\sigma}{\\mathrm{d}\\Omega} = \\left|\\sum_j b_j e^{i\\mathbf{Q}\\cdot\\mathbf{r}_j}\\right|^2',
    displayTex: '\\frac{\\mathrm{d}\\sigma}{\\mathrm{d}\\Omega} = \\left|\\sum_j b_{c,j}\\,e^{i\\mathbf{Q}\\cdot\\mathbf{r}_j}\\right|^2, \\qquad E = \\frac{h^2}{2m_n\\lambda^2}',
    dimension: 'Nuclear Cross-Section [b]',
  },
  magnetic: {
    symbolTex: '\\mathbf{F}_M',
    compactTex: '\\mathbf{F}_M(\\mathbf{Q}) = p\\sum_j f_m(Q)\\,\\boldsymbol{\\mu}_{j\\perp}e^{i\\mathbf{Q}\\cdot\\mathbf{r}_j}',
    displayTex: '\\mathbf{F}_M(\\mathbf{Q}) = \\frac{\\gamma r_0}{2}\\sum_j \\langle j_0(Q)\\rangle\\,\\mathbf{M}_{j,\\perp}\\,e^{i\\mathbf{Q}\\cdot\\mathbf{r}_j}',
    dimension: 'Magnetic Form Factor [μB]',
  },
  xrd_nano: {
    symbolTex: 'I(q)',
    compactTex: 'I(q) = \\sum_{i,j} f_i f_j\\frac{\\sin(qr_{ij})}{qr_{ij}}',
    displayTex: 'I(q) = \\sum_{i=1}^{N}\\sum_{j=1}^{N} f_i(q)\\,f_j(q)\\,\\frac{\\sin(q\\,r_{ij})}{q\\,r_{ij}}',
    dimension: 'Debye Scattering Law',
  },
  python_export: {
    symbolTex: '\\mathrm{Py}',
    compactTex: '\\min_{\\theta}\\sum_i \\left[y_i - f(2\\theta_i;\\theta)\\right]^2',
    displayTex: '\\hat{\\boldsymbol{\\theta}} = \\arg\\min_{\\boldsymbol{\\theta}} \\sum_{i=1}^{N} w_i\\Big[I_{\\mathrm{obs}}(2\\theta_i) - I_{\\mathrm{calc}}(2\\theta_i;\\,\\boldsymbol{\\theta})\\Big]^2',
    dimension: 'SciPy / NumPy Solver',
  },
  dl: {
    symbolTex: 'P(y|I)',
    compactTex: 'P(y_k\\mid I) = \\mathrm{softmax}(\\mathbf{W}\\,\\Phi(2\\theta))',
    displayTex: 'P(y_k \\mid I) = \\frac{\\exp\\!\\left(z_k(I)\\right)}{\\sum_{j=1}^{C}\\exp\\!\\left(z_j(I)\\right)}',
    dimension: 'Neural Phase Classifier',
  },
  image_analysis: {
    symbolTex: 'R\\,d',
    compactTex: 'R\\cdot d_{hkl} = L\\cdot\\lambda',
    displayTex: 'R_{hkl}\\cdot d_{hkl} = L\\cdot\\lambda, \\qquad I_{\\mathrm{rad}}(2\\theta) = \\frac{1}{2\\pi}\\oint I(R,\\phi)\\,\\mathrm{d}\\phi',
    dimension: 'Debye–Scherrer Rings',
  },
  image_gen: {
    symbolTex: '\\mathbf{k}_f',
    compactTex: '\\Delta\\mathbf{k} = \\mathbf{k}_f - \\mathbf{k}_i = \\mathbf{G}_{hkl}',
    displayTex: '\\Delta\\mathbf{k} = \\mathbf{k}_f - \\mathbf{k}_i = \\mathbf{G}_{hkl}, \\qquad |\\mathbf{k}_f| = |\\mathbf{k}_i| = \\frac{2\\pi}{\\lambda}',
    dimension: 'Ewald Sphere Geometry',
  },
  learn: {
    symbolTex: '\\mathrm{SOP}',
    compactTex: '\\Delta(2\\theta) = -\\frac{2s}{R}\\cos\\theta + \\Delta 2\\theta_0',
    displayTex: '\\Delta(2\\theta) = \\Delta 2\\theta_0 - \\frac{2s}{R}\\cos\\theta, \\qquad H^2 = U\\tan^2\\theta + V\\tan\\theta + W',
    dimension: 'IUCr Metrology SOP',
  },
  periodic_table: {
    symbolTex: 'f_0(s)',
    compactTex: 'f(s) = \\sum_{i=1}^4 a_i e^{-b_i s^2} + c',
    displayTex: 'f(s) = \\sum_{i=1}^{4} a_i\\exp(-b_i s^2) + c + f\' + i f\'\', \\qquad s = \\frac{\\sin\\theta}{\\lambda}',
    dimension: 'Cromer–Mann Form Factor',
  },
  database: {
    symbolTex: '\\mathrm{CIF}',
    compactTex: '\\rho_c = \\frac{Z\\,M}{N_{\\mathrm{A}}\\,V_{\\mathrm{cell}}}',
    displayTex: '\\rho_{\\mathrm{calc}} = \\frac{Z\\,M}{N_{\\mathrm{A}}\\,V_{\\mathrm{cell}} \\times 10^{-24}}\\;\\mathrm{g/cm}^3',
    dimension: 'COD / ICDD Registry',
  },
  profile: {
    symbolTex: '\\mathrm{PI}',
    compactTex: 'n\\lambda = 2d\\sin\\theta',
    displayTex: 'n\\lambda = 2d_{hkl}\\sin\\theta',
    dimension: 'Investigator Node',
  },
  settings: {
    symbolTex: '\\Delta 2\\theta_0',
    compactTex: '\\Delta 2\\theta = -\\frac{2s}{R}\\cos\\theta + \\Delta 2\\theta_0',
    displayTex: '\\Delta(2\\theta) = -\\frac{2s}{R}\\cos\\theta + \\Delta 2\\theta_0',
    dimension: 'Goniometer Calibration',
  },
};

export function getModuleMath(moduleId: string): ModuleMathEntry {
  return (
    MODULE_MATH_CATALOG[moduleId] || {
      symbolTex: '2\\theta',
      compactTex: 'n\\lambda = 2d_{hkl}\\sin\\theta',
      displayTex: 'n\\lambda = 2d_{hkl}\\sin\\theta',
      dimension: 'Diffraction Relation',
    }
  );
}
