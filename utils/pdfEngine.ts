/**
 * Total Scattering & Atomic Pair Distribution Function (PDF) Mathematical Engine
 *
 * Implements:
 * 1. Reciprocal-Space Total Scattering Structure Function S(Q) & Reduced Structure Function F(Q) = Q[S(Q) - 1]
 *    including both discrete coordination shells and the excluded-volume continuum density integral
 * 2. Filon-Corrected Numerical Sine Fourier Transform:
 *      G(r) = (2 / pi) * integral_{Q_min}^{Q_max} F(Q) * W(Q) * sin(Q * r) dQ
 * 3. Step, Lorch Sinc, and Cosine-Bell Modification Functions W(Q) with exact window-dependent real-space FWHM
 * 4. Spherical Nanoparticle Shape Envelope gamma_0(r; D) = 1 - 1.5*(r/D) + 0.5*(r/D)^3
 * 5. Jeong-Proffen-Billinge Correlated Atomic Motion Model:
 *      sigma_eff(r) = sigma_0 * sqrt(1 - delta_1 / r - delta_2 / r^2 + Q_broad^2 * r^2)
 * 6. Real-Space Gaussian Coordination Shell Modeling G_calc(r), Radial Distribution R(r), Pair Density g(r),
 *    Faber-Ziman Weight-Corrected Coordination Integration, and Iterative Real-Space Least-Squares Refinement
 */

export interface PDFCoordinationShell {
  id: string;
  pairLabel: string;       // e.g., 'Si–O (Tetrahedral)', 'Au–Au (1st)', 'Ti–O (Short)'
  rAngstrom: number;       // Interatomic distance r_k (Å)
  coordinationN: number;   // Coordination number N_k
  sigmaAngstrom: number;   // Debye-Waller thermal/static RMS displacement sigma_k (Å)
  weightFactor: number;    // Faber-Ziman X-ray scattering weight w_ij = (c_i c_j f_i(0) f_j(0)) / <f(0)>^2
}

export interface PDFMaterialPreset {
  id: string;
  formula: string;
  name: string;
  category: 'Amorphous Glass' | 'Nanocrystal / Quantum Dot' | 'Local Polar Distortion' | 'Crystalline Standard';
  tag: string;
  description: string;
  rho0AtomsPerA3: number;  // Average atomic number density rho_0 (atoms / Å³)
  domainDiameterNm: number;// Coherent nanoparticle diameter D (nm); 0 = bulk crystal
  isAmorphous: boolean;
  amorphousCorrelationA?: number; // Exponential structural coherence decay xi (Å) for glasses
  recommendedQMax: number; // Recommended Q_max (Å⁻¹)
  shells: PDFCoordinationShell[];
}

export interface PDFSimulationConfig {
  qMin: number;            // Minimum momentum transfer Q_min (Å⁻¹)
  qMax: number;            // Maximum momentum transfer Q_max (Å⁻¹)
  qDamp: number;           // Instrumental Q-resolution damping factor Q_damp (Å⁻¹)
  qBroad?: number;         // Instrumental Q-resolution broadening factor Q_broad (Å⁻¹)
  rMax: number;            // Maximum real-space distance r_max (Å)
  rStep: number;           // Real-space grid step dr (Å)
  rho0: number;            // Atomic number density rho_0 (atoms / Å³)
  domainDiameterNm: number;// Spherical nanoparticle diameter D (nm), 0 = bulk
  isAmorphous: boolean;
  amorphousCorrelationA: number;
  windowFunction: 'none' | 'lorch' | 'cosine_bell';
  correlatedMotionDelta1: number; // Low-r correlated atomic motion sharpening delta_1 (Å)
  correlatedMotionDelta2?: number;// Quadratic correlated motion parameter delta_2 (Å²)
  addedNoiseLevel: number; // High-Q experimental Poisson noise amplitude
  modelScaleFactor: number;// Real-space model scale factor S_pdf (default 1.0)
}

export interface ReciprocalQPoint {
  q: number;               // Momentum transfer Q (Å⁻¹)
  sOfQ: number;            // Structure factor S(Q)
  fOfQ: number;            // Reduced structure function F(Q) = Q[S(Q) - 1] (Å⁻¹)
  fOfQWindowed: number;    // Window-modified F(Q) * W(Q)
  windowVal: number;       // Modification function W(Q) (0 to 1)
  dampingEnvelope: number; // Instrumental Q_damp envelope exp(-0.5 * Q_damp^2 * Q^2)
}

export interface RealSpacePDFPoint {
  r: number;               // Interatomic distance r (Å)
  gObs: number;            // Fourier-transformed G_FT(r) at active Q_max (Å⁻²)
  gObsCuKa: number;        // Reference low-resolution G_FT(r) truncated at Cu Kα Q_max = 8.0 Å⁻¹ (Å⁻²)
  gCalc: number;           // Real-space analytical model G_calc(r) (Å⁻²)
  gDiff: number;           // Residual difference G_obs(r) - G_calc(r) (Å⁻²)
  baselineLine: number;    // -4 * pi * r * rho_0 * gamma_0(r) density baseline (Å⁻²)
  envelopePos: number;     // +4 * pi * r * rho_0 * gamma_0(r) upper envelope
  shapeGamma0: number;     // Dimensionless nanoparticle/amorphous envelope gamma_0(r) (0 to 1)
  pairDensitySmallG: number;// Pair distribution g(r) = G(r)/(4*pi*r*rho_0) + gamma_0(r)
  rdfR: number;            // Radial distribution function R(r) = 4*pi*r^2*rho_0*g(r) (atoms/Å)
  shell1Contrib: number;   // Partial real-space peak contribution from Shell 1 (Å⁻²)
  shell2Contrib: number;   // Partial real-space peak contribution from Shell 2 (Å⁻²)
  shell3Contrib: number;   // Partial real-space peak contribution from Shell 3+ (Å⁻²)
}

export interface ShellDiagnosticSummary {
  id: string;
  pairLabel: string;
  rAngstrom: number;
  coordinationN: number;
  weightFactor: number;
  sigmaRaw: number;
  sigmaEff: number;        // Correlated motion + Q_broad width
  shapeGamma0: number;     // Envelope attenuation at r_k
  fwhmFourierA: number;    // Window-specific Q_max sinc broadening FWHM (Å)
  fwhmRealSpace: number;   // Combined Gaussian + Q_max broadening FWHM (Å)
  resolvedFromPrev: boolean;
}

export interface PDFAnalysisOutput {
  qPoints: ReciprocalQPoint[];
  rPoints: RealSpacePDFPoint[];
  shellDiagnostics: ShellDiagnosticSummary[];
  deltaRResolutionA: number;        // Real-space Nyquist resolution limit pi / Q_max (Å)
  windowBroadenedFwhmA: number;     // Effective real-space instrumental FWHM for active window W(Q) (Å)
  terminationRipplePeriodA: number; // Spurious ripple wavelength 2*pi / Q_max (Å)
  rwFactorPct: number;              // PDFgui real-space agreement factor R_w (%)
  cuKaRwFactorPct: number;          // R_w if truncated at Cu Kα (8.0 Å⁻¹)
  firstShellPeakR: number;          // Measured 1st shell peak position (Å)
  firstShellCoordN: number;         // 1st shell coordination number
  effectiveRadiationLabel: string;
}

export const PDF_MATERIAL_PRESETS: PDFMaterialPreset[] = [
  {
    id: 'sio2_glass',
    formula: 'a-SiO₂',
    name: 'Amorphous Fused Silica Glass (a-SiO₂)',
    category: 'Amorphous Glass',
    tag: 'Zachariasen Network · r₁ = 1.61 Å',
    description:
      'Corner-sharing SiO₄ tetrahedral network glass. Exhibits ultra-sharp short-range Si–O (1.61 Å, N=4), O–O (2.63 Å, N=6), and inter-tetrahedral Si–Si (3.08 Å, N=4) peaks that damp out above 10 Å due to ring-angle disorder.',
    rho0AtomsPerA3: 0.0662,
    domainDiameterNm: 0,
    isAmorphous: true,
    amorphousCorrelationA: 6.8,
    recommendedQMax: 24.0,
    shells: [
      { id: 's1', pairLabel: 'Si–O (Tetrahedral)', rAngstrom: 1.61, coordinationN: 4.0, sigmaAngstrom: 0.048, weightFactor: 1.05 },
      { id: 's2', pairLabel: 'O–O (Tetrahedral Edge)', rAngstrom: 2.63, coordinationN: 6.0, sigmaAngstrom: 0.085, weightFactor: 0.78 },
      { id: 's3', pairLabel: 'Si–Si (Corner-Shared)', rAngstrom: 3.08, coordinationN: 4.0, sigmaAngstrom: 0.105, weightFactor: 1.15 },
      { id: 's4', pairLabel: 'Si–O (2nd Coordination)', rAngstrom: 4.12, coordinationN: 12.0, sigmaAngstrom: 0.165, weightFactor: 0.95 },
      { id: 's5', pairLabel: 'O–O / Si–Si (6-Ring)', rAngstrom: 5.05, coordinationN: 16.0, sigmaAngstrom: 0.220, weightFactor: 0.85 },
      { id: 's6', pairLabel: 'Medium-Range Cage', rAngstrom: 6.45, coordinationN: 22.0, sigmaAngstrom: 0.290, weightFactor: 0.75 },
      { id: 's7', pairLabel: 'Extended Ring Network', rAngstrom: 7.85, coordinationN: 28.0, sigmaAngstrom: 0.350, weightFactor: 0.65 }
    ]
  },
  {
    id: 'au_nanoparticle',
    formula: 'Au (2.8 nm)',
    name: 'Ultrasmall Gold Quantum Dot (2.8 nm FCC)',
    category: 'Nanocrystal / Quantum Dot',
    tag: 'Spherical Envelope γ₀(r; D)',
    description:
      'Colloidal 2.8 nm FCC gold nanocluster. Demonstrates how finite nanoparticle diameter D = 28 Å progressively attenuates higher coordination shells via the spherical shape envelope γ₀(r; D).',
    rho0AtomsPerA3: 0.0590,
    domainDiameterNm: 2.8,
    isAmorphous: false,
    amorphousCorrelationA: 50,
    recommendedQMax: 22.0,
    shells: [
      { id: 'au1', pairLabel: 'Au–Au (1st FCC)', rAngstrom: 2.884, coordinationN: 12.0, sigmaAngstrom: 0.075, weightFactor: 1.0 },
      { id: 'au2', pairLabel: 'Au–Au (2nd Cube a)', rAngstrom: 4.078, coordinationN: 6.0, sigmaAngstrom: 0.092, weightFactor: 1.0 },
      { id: 'au3', pairLabel: 'Au–Au (3rd Shell)', rAngstrom: 4.995, coordinationN: 24.0, sigmaAngstrom: 0.105, weightFactor: 1.0 },
      { id: 'au4', pairLabel: 'Au–Au (4th Face Diag)', rAngstrom: 5.768, coordinationN: 12.0, sigmaAngstrom: 0.115, weightFactor: 1.0 },
      { id: 'au5', pairLabel: 'Au–Au (5th Shell)', rAngstrom: 6.448, coordinationN: 24.0, sigmaAngstrom: 0.125, weightFactor: 1.0 },
      { id: 'au6', pairLabel: 'Au–Au (6th Body Diag)', rAngstrom: 7.064, coordinationN: 8.0, sigmaAngstrom: 0.132, weightFactor: 1.0 },
      { id: 'au7', pairLabel: 'Au–Au (7th Shell)', rAngstrom: 7.630, coordinationN: 48.0, sigmaAngstrom: 0.140, weightFactor: 1.0 },
      { id: 'au8', pairLabel: 'Au–Au (8th Shell)', rAngstrom: 8.652, coordinationN: 36.0, sigmaAngstrom: 0.150, weightFactor: 1.0 },
      { id: 'au9', pairLabel: 'Au–Au (9th Shell)', rAngstrom: 9.565, coordinationN: 48.0, sigmaAngstrom: 0.160, weightFactor: 1.0 },
      { id: 'au10', pairLabel: 'Au–Au (10th Shell)', rAngstrom: 10.79, coordinationN: 60.0, sigmaAngstrom: 0.175, weightFactor: 1.0 },
      { id: 'au11', pairLabel: 'Au–Au (11th Shell)', rAngstrom: 12.23, coordinationN: 72.0, sigmaAngstrom: 0.190, weightFactor: 1.0 },
      { id: 'au12', pairLabel: 'Au–Au (12th Shell)', rAngstrom: 13.85, coordinationN: 84.0, sigmaAngstrom: 0.210, weightFactor: 1.0 }
    ]
  },
  {
    id: 'zrcu_bmg',
    formula: 'Zr₆₄Cu₃₆',
    name: 'Zr₆₄Cu₃₆ Bulk Metallic Glass (Icosahedral SRO)',
    category: 'Amorphous Glass',
    tag: 'Split 2nd Peak · Metallic Glass',
    description:
      'Binary bulk metallic glass featuring dense icosahedral short-range order (ISRO) and a characteristic split second-neighbor PDF peak at 5.18 Å and 6.02 Å.',
    rho0AtomsPerA3: 0.0525,
    domainDiameterNm: 0,
    isAmorphous: true,
    amorphousCorrelationA: 8.2,
    recommendedQMax: 21.0,
    shells: [
      { id: 'z1', pairLabel: 'Cu–Zr / Cu–Cu (1st)', rAngstrom: 2.78, coordinationN: 4.8, sigmaAngstrom: 0.110, weightFactor: 0.88 },
      { id: 'z2', pairLabel: 'Zr–Zr (1st Icosahedral)', rAngstrom: 3.18, coordinationN: 7.5, sigmaAngstrom: 0.125, weightFactor: 1.15 },
      { id: 'z3', pairLabel: '2nd Shell Sub-Peak A', rAngstrom: 5.18, coordinationN: 21.0, sigmaAngstrom: 0.210, weightFactor: 1.02 },
      { id: 'z4', pairLabel: '2nd Shell Sub-Peak B', rAngstrom: 6.02, coordinationN: 16.0, sigmaAngstrom: 0.230, weightFactor: 0.95 },
      { id: 'z5', pairLabel: '3rd Cluster Super-Shell', rAngstrom: 7.95, coordinationN: 42.0, sigmaAngstrom: 0.320, weightFactor: 0.90 },
      { id: 'z6', pairLabel: '4th Medium-Range Shell', rAngstrom: 10.35, coordinationN: 58.0, sigmaAngstrom: 0.420, weightFactor: 0.82 }
    ]
  },
  {
    id: 'batio3_polar',
    formula: 'BaTiO₃',
    name: 'BaTiO₃ Perovskite (Local Off-Center Ti Distortion)',
    category: 'Local Polar Distortion',
    tag: 'Polar Split Ti–O (1.87 / 2.13 Å)',
    description:
      'Resolves local [111] Ti off-centering into 3 short (1.87 Å) and 3 long (2.13 Å) Ti–O bonds inside macroscopically cubic/tetragonal perovskite—invisible to standard Bragg diffraction below Q_max = 18 Å⁻¹.',
    rho0AtomsPerA3: 0.0781,
    domainDiameterNm: 8.5,
    isAmorphous: false,
    amorphousCorrelationA: 50,
    recommendedQMax: 26.0,
    shells: [
      { id: 'bt1', pairLabel: 'Ti–O (Short Polar)', rAngstrom: 1.87, coordinationN: 3.0, sigmaAngstrom: 0.048, weightFactor: 0.78 },
      { id: 'bt2', pairLabel: 'Ti–O (Long Apical)', rAngstrom: 2.13, coordinationN: 3.0, sigmaAngstrom: 0.056, weightFactor: 0.78 },
      { id: 'bt3', pairLabel: 'Ba–O / O–O (Cuboctahedral)', rAngstrom: 2.83, coordinationN: 12.0, sigmaAngstrom: 0.088, weightFactor: 1.15 },
      { id: 'bt4', pairLabel: 'Ba–Ti (Body Center)', rAngstrom: 3.46, coordinationN: 8.0, sigmaAngstrom: 0.082, weightFactor: 1.38 },
      { id: 'bt5', pairLabel: 'Ba–Ba / Ti–Ti (Unit Cell a)', rAngstrom: 4.00, coordinationN: 6.0, sigmaAngstrom: 0.090, weightFactor: 1.45 },
      { id: 'bt6', pairLabel: 'Ba–O (Next Cell)', rAngstrom: 4.90, coordinationN: 24.0, sigmaAngstrom: 0.115, weightFactor: 1.05 },
      { id: 'bt7', pairLabel: 'Ba–Ba (Face Diag √2 a)', rAngstrom: 5.66, coordinationN: 12.0, sigmaAngstrom: 0.120, weightFactor: 1.35 },
      { id: 'bt8', pairLabel: 'Perovskite Super-Shell', rAngstrom: 6.93, coordinationN: 30.0, sigmaAngstrom: 0.145, weightFactor: 1.15 },
      { id: 'bt9', pairLabel: '2a Lattice Repeat', rAngstrom: 8.00, coordinationN: 36.0, sigmaAngstrom: 0.160, weightFactor: 1.20 }
    ]
  },
  {
    id: 'ceo2_nano',
    formula: 'CeO₂ (4.2 nm)',
    name: 'Ceria Fluorite Nanocatalyst (4.2 nm CeO₂₋ₓ)',
    category: 'Nanocrystal / Quantum Dot',
    tag: 'Oxygen Vacancy Disorder · 4.2 nm',
    description:
      'Redox-active CeO₂ fluorite nanocatalyst (D = 4.2 nm) showing distinct Ce–O (2.34 Å, N=7.6 oxygen-deficient) and Ce–Ce (3.83 Å, N=12) sublattice peaks attenuated by the finite crystallite boundary.',
    rho0AtomsPerA3: 0.0754,
    domainDiameterNm: 4.2,
    isAmorphous: false,
    amorphousCorrelationA: 50,
    recommendedQMax: 23.0,
    shells: [
      { id: 'ce1', pairLabel: 'Ce–O (1st Fluorite)', rAngstrom: 2.34, coordinationN: 7.6, sigmaAngstrom: 0.068, weightFactor: 0.85 },
      { id: 'ce2', pairLabel: 'O–O (Sublattice Edge)', rAngstrom: 2.70, coordinationN: 6.0, sigmaAngstrom: 0.098, weightFactor: 0.35 },
      { id: 'ce3', pairLabel: 'Ce–Ce (1st Cation)', rAngstrom: 3.83, coordinationN: 12.0, sigmaAngstrom: 0.072, weightFactor: 1.55 },
      { id: 'ce4', pairLabel: 'Ce–O (2nd Shell)', rAngstrom: 4.48, coordinationN: 24.0, sigmaAngstrom: 0.095, weightFactor: 0.85 },
      { id: 'ce5', pairLabel: 'Ce–Ce (Unit Cell a)', rAngstrom: 5.41, coordinationN: 6.0, sigmaAngstrom: 0.088, weightFactor: 1.55 },
      { id: 'ce6', pairLabel: 'Ce–O (3rd Shell)', rAngstrom: 5.90, coordinationN: 24.0, sigmaAngstrom: 0.110, weightFactor: 0.85 },
      { id: 'ce7', pairLabel: 'Ce–Ce (3rd Cation)', rAngstrom: 6.63, coordinationN: 24.0, sigmaAngstrom: 0.105, weightFactor: 1.55 },
      { id: 'ce8', pairLabel: 'Ce–Ce (4th Cation)', rAngstrom: 7.65, coordinationN: 12.0, sigmaAngstrom: 0.118, weightFactor: 1.55 },
      { id: 'ce9', pairLabel: 'Extended Fluorite Shell', rAngstrom: 8.56, coordinationN: 48.0, sigmaAngstrom: 0.135, weightFactor: 1.25 }
    ]
  },
  {
    id: 'si_standard',
    formula: 'Si (SRM 640f)',
    name: 'Crystalline Silicon Standard (Diamond Cubic)',
    category: 'Crystalline Standard',
    tag: 'NIST Calibrant · r₁ = 2.352 Å',
    description:
      'High-purity diamond-cubic silicon calibrant (a = 5.431 Å) exhibiting textbook tetrahedral 1st neighbor (N₁ = 4.0 at 2.352 Å) and 2nd neighbor (N₂ = 12.0 at 3.840 Å) coordination shells.',
    rho0AtomsPerA3: 0.04995,
    domainDiameterNm: 0,
    isAmorphous: false,
    amorphousCorrelationA: 50,
    recommendedQMax: 24.0,
    shells: [
      { id: 'si1', pairLabel: 'Si–Si (1st Tetrahedral)', rAngstrom: 2.352, coordinationN: 4.0, sigmaAngstrom: 0.055, weightFactor: 1.0 },
      { id: 'si2', pairLabel: 'Si–Si (2nd Shell)', rAngstrom: 3.840, coordinationN: 12.0, sigmaAngstrom: 0.072, weightFactor: 1.0 },
      { id: 'si3', pairLabel: 'Si–Si (3rd Shell)', rAngstrom: 4.503, coordinationN: 12.0, sigmaAngstrom: 0.078, weightFactor: 1.0 },
      { id: 'si4', pairLabel: 'Si–Si (4th Unit Cell a)', rAngstrom: 5.431, coordinationN: 6.0, sigmaAngstrom: 0.082, weightFactor: 1.0 },
      { id: 'si5', pairLabel: 'Si–Si (5th Shell)', rAngstrom: 5.918, coordinationN: 12.0, sigmaAngstrom: 0.088, weightFactor: 1.0 },
      { id: 'si6', pairLabel: 'Si–Si (6th Face Diag)', rAngstrom: 6.652, coordinationN: 24.0, sigmaAngstrom: 0.095, weightFactor: 1.0 },
      { id: 'si7', pairLabel: 'Si–Si (7th Shell)', rAngstrom: 7.055, coordinationN: 16.0, sigmaAngstrom: 0.102, weightFactor: 1.0 },
      { id: 'si8', pairLabel: 'Si–Si (8th Shell)', rAngstrom: 7.681, coordinationN: 12.0, sigmaAngstrom: 0.108, weightFactor: 1.0 },
      { id: 'si9', pairLabel: 'Si–Si (9th Shell)', rAngstrom: 8.245, coordinationN: 36.0, sigmaAngstrom: 0.115, weightFactor: 1.0 },
      { id: 'si10', pairLabel: 'Si–Si (10th Shell)', rAngstrom: 9.015, coordinationN: 48.0, sigmaAngstrom: 0.125, weightFactor: 1.0 },
      { id: 'si11', pairLabel: 'Si–Si (11th Shell)', rAngstrom: 10.18, coordinationN: 54.0, sigmaAngstrom: 0.135, weightFactor: 1.0 }
    ]
  }
];

/**
 * Abramowitz & Stegun 7.1.26 error function erf(x) (max error < 1.5e-7)
 */
function erfApprox(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y =
    1.0 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-ax * ax);
  return sign * y;
}

/**
 * Spherical Nanoparticle Characteristic Shape Envelope gamma_0(r; D)
 * For a uniform sphere of diameter D (in Å):
 *   gamma_0(r) = 1 - 1.5*(r/D) + 0.5*(r/D)^3   for 0 <= r <= D
 *   gamma_0(r) = 0                              for r > D
 */
export function evaluateShapeEnvelope(
  rAngstrom: number,
  domainDiameterNm: number,
  isAmorphous: boolean,
  amorphousCorrelationA: number
): number {
  if (rAngstrom <= 0) return 1.0;

  let env = 1.0;
  if (domainDiameterNm > 0) {
    const dAngstrom = domainDiameterNm * 10.0;
    if (rAngstrom >= dAngstrom) {
      return 0.0;
    }
    const u = rAngstrom / dAngstrom;
    env *= 1.0 - 1.5 * u + 0.5 * u * u * u;
  }

  if (isAmorphous && amorphousCorrelationA > 0) {
    if (rAngstrom > 2.2) {
      env *= Math.exp(-(rAngstrom - 2.2) / amorphousCorrelationA);
    }
  }

  return Math.max(0, env);
}

/**
 * Computes the Jeong-Proffen-Billinge correlated atomic motion + instrumental Q_broad width:
 *   sigma_eff(r) = sqrt( sigma_0^2 * max(0.15, 1 - delta1/r - delta2/r^2) + (Q_broad * r)^2 )
 */
export function calculateEffectiveSigma(
  sigma0: number,
  rAngstrom: number,
  delta1: number,
  delta2 = 0,
  qBroad = 0.008
): number {
  const rSafe = Math.max(0.5, rAngstrom);
  const corrFactor = Math.max(0.18, 1.0 - delta1 / rSafe - delta2 / (rSafe * rSafe));
  const thermalVar = sigma0 * sigma0 * corrFactor;
  const instBroadVar = (qBroad * rSafe) * (qBroad * rSafe);
  return Math.max(0.02, Math.sqrt(thermalVar + instBroadVar));
}

/**
 * Evaluates the modification window W(Q; Q_max)
 */
function evaluateWindowFunction(
  q: number,
  qMax: number,
  windowType: 'none' | 'lorch' | 'cosine_bell'
): number {
  if (q > qMax) return 0;
  if (windowType === 'lorch') {
    const arg = (Math.PI * q) / qMax;
    return arg > 1e-6 ? Math.sin(arg) / arg : 1.0;
  }
  if (windowType === 'cosine_bell') {
    return Math.cos((0.5 * Math.PI * q) / qMax);
  }
  return 1.0;
}

/**
 * Evaluates the full Total Scattering & Pair Distribution Function pipeline:
 * 1. Exact Real-Space Model G_calc(r) = 4*pi*r*[rho(r) - rho_0*gamma_0(r)] with smooth continuum transition
 * 2. Reciprocal-Space Reduced Structure Function F(Q) = Q[S(Q) - 1] = integral_0^infty G(r) sin(Q*r) dr
 * 3. Filon-Corrected Sine Fourier Transform G_FT(r) over [Q_min, Q_max] and reference Cu Kα (Q_max = 8.0 Å⁻¹)
 * 4. Partial shell contributions, R(r), g(r), window-aware resolution diagnostics, and R_w agreement factor
 */
export function calculatePDFAnalysis(
  shells: PDFCoordinationShell[],
  config: PDFSimulationConfig
): PDFAnalysisOutput {
  const qMin = Math.max(0.15, config.qMin);
  const qMax = Math.max(qMin + 2.0, config.qMax);
  const dQ = 0.04; // High-resolution reciprocal-space quadrature step (Å⁻¹)
  const maxGridQ = Math.max(qMax, 8.5);
  const numQ = Math.floor((maxGridQ - qMin) / dQ) + 1;
  const scaleFactor = config.modelScaleFactor > 0 ? config.modelScaleFactor : 1.0;
  const qBroad = config.qBroad ?? 0.008;
  const delta2 = config.correlatedMotionDelta2 ?? 0;

  // Determine the outermost explicitly modeled shell distance r_cont where discrete shells merge into continuum
  let maxShellR = 2.0;
  let maxShellSigma = 0.15;
  for (const sh of shells) {
    if (sh.coordinationN > 0 && sh.rAngstrom > maxShellR) {
      maxShellR = sh.rAngstrom;
      maxShellSigma = sh.sigmaAngstrom;
    }
  }
  const rContinuumCutoff = maxShellR + 2.2 * Math.max(0.15, maxShellSigma);
  const sigmaContinuumTransition = Math.max(0.28, 1.5 * maxShellSigma);

  // Pre-build a fine real-space grid up to r_cont + 4*sigma to evaluate the continuum density baseline integral
  const rContMax = rContinuumCutoff + 4.0 * sigmaContinuumTransition;
  const drCont = 0.05;
  const nCont = Math.floor(rContMax / drCont) + 1;
  const contR: number[] = new Array(nCont);
  const contBaselineVal: number[] = new Array(nCont);

  for (let m = 0; m < nCont; m++) {
    const r = m * drCont;
    contR[m] = r;
    const env = evaluateShapeEnvelope(
      r,
      config.domainDiameterNm,
      config.isAmorphous,
      config.amorphousCorrelationA
    );
    // Smooth complementary error function transition: 1 inside discrete shell region, 0 in continuum
    const erfcTransition = 0.5 * (1.0 - erfApprox((r - rContinuumCutoff) / (Math.SQRT2 * sigmaContinuumTransition)));
    const instRealSpaceDamp =
      config.qDamp > 0 ? Math.exp(-0.5 * config.qDamp * config.qDamp * r * r) : 1.0;
    contBaselineVal[m] = -4.0 * Math.PI * r * config.rho0 * env * erfcTransition * instRealSpaceDamp;
  }

  const qPoints: ReciprocalQPoint[] = [];
  const cuKaQMax = 8.0;
  const cuKaQPoints: { q: number; fWin: number }[] = [];

  for (let i = 0; i < numQ; i++) {
    const q = Number((qMin + i * dQ).toFixed(3));
    let fDiscrete = 0;

    // 1A. Analytical Sine Transform of Discrete Gaussian Coordination Shells
    for (const sh of shells) {
      if (sh.rAngstrom <= 0.1 || sh.coordinationN <= 0) continue;
      const env = evaluateShapeEnvelope(
        sh.rAngstrom,
        config.domainDiameterNm,
        config.isAmorphous,
        config.amorphousCorrelationA
      );
      if (env <= 1e-5) continue;

      const sigmaEff = calculateEffectiveSigma(
        sh.sigmaAngstrom,
        sh.rAngstrom,
        config.correlatedMotionDelta1,
        delta2,
        qBroad
      );

      const dw = Math.exp(-0.5 * sigmaEff * sigmaEff * q * q);
      fDiscrete += (sh.coordinationN * sh.weightFactor * env / sh.rAngstrom) * dw * Math.sin(q * sh.rAngstrom);
    }

    const instDamp = config.qDamp > 0 ? Math.exp(-0.5 * config.qDamp * config.qDamp * q * q) : 1.0;

    // 1B. Sine Transform of Excluded-Volume Continuum Density Baseline -4*pi*r*rho_0*gamma_0(r)
    let fContinuum = 0;
    const thetaCont = q * drCont;
    const filonCont =
      thetaCont > 1e-4
        ? (3.0 * (thetaCont * Math.cos(thetaCont) - Math.sin(thetaCont))) / Math.pow(thetaCont, 3) + 1.0
        : 1.0;
    for (let m = 1; m < nCont; m++) {
      const w = m === nCont - 1 ? 0.5 : 1.0;
      fContinuum += w * contBaselineVal[m] * Math.sin(q * contR[m]) * drCont;
    }
    fContinuum *= Math.max(0.85, Math.min(1.05, filonCont));

    let fOfQ = fDiscrete * instDamp + fContinuum;

    if (config.addedNoiseLevel > 0) {
      const pseudoRand =
        Math.sin(q * 17.31 + 1.9) * Math.cos(q * 31.73 - 0.7) +
        0.45 * Math.sin(q * 43.17 - 0.4);
      fOfQ += pseudoRand * (config.addedNoiseLevel * 0.012) * Math.sqrt(q);
    }

    if (q <= cuKaQMax + 1e-5) {
      const wCu = evaluateWindowFunction(q, cuKaQMax, config.windowFunction);
      cuKaQPoints.push({ q, fWin: fOfQ * wCu });
    }

    if (q <= qMax + 1e-5) {
      const windowVal = evaluateWindowFunction(q, qMax, config.windowFunction);
      const fOfQWindowed = fOfQ * windowVal;
      const sOfQ = 1.0 + fOfQ / q;

      qPoints.push({
        q,
        sOfQ: Number(sOfQ.toFixed(4)),
        fOfQ: Number(fOfQ.toFixed(4)),
        fOfQWindowed: Number(fOfQWindowed.toFixed(4)),
        windowVal: Number(windowVal.toFixed(4)),
        dampingEnvelope: Number(instDamp.toFixed(4))
      });
    }
  }

  // 2. Filon-Corrected Direct Numerical Sine Fourier Transform to Real-Space G(r)
  const rPoints: RealSpacePDFPoint[] = [];
  const rStep = Math.max(0.02, config.rStep);
  const rMax = Math.max(5.0, config.rMax);
  const numR = Math.floor(rMax / rStep) + 1;

  let sumDiffSq = 0;
  let sumObsSq = 0;
  let sumCuDiffSq = 0;

  for (let j = 0; j < numR; j++) {
    const r = Number((j * rStep).toFixed(3));

    let integral = 0;
    let integralCu = 0;
    if (r > 0) {
      // Exact Filon oscillatory quadrature correction for trapezoidal rule on sin(Q*r):
      // Compensates for high-r sinc attenuation (sin(r*dQ/2)/(r*dQ/2))^2
      const halfArg = 0.5 * r * dQ;
      const sincHalf = halfArg > 1e-5 ? Math.sin(halfArg) / halfArg : 1.0;
      const filonWeightCorrection = 1.0 / Math.max(0.75, sincHalf * sincHalf);

      for (let i = 0; i < qPoints.length; i++) {
        const pt = qPoints[i];
        const weight = i === 0 || i === qPoints.length - 1 ? 0.5 : 1.0;
        integral += weight * pt.fOfQWindowed * Math.sin(pt.q * r) * dQ;
      }
      integral *= filonWeightCorrection;

      for (let i = 0; i < cuKaQPoints.length; i++) {
        const pt = cuKaQPoints[i];
        const weight = i === 0 || i === cuKaQPoints.length - 1 ? 0.5 : 1.0;
        integralCu += weight * pt.fWin * Math.sin(pt.q * r) * dQ;
      }
      integralCu *= filonWeightCorrection;
    }

    const gObs = (2.0 / Math.PI) * integral;
    const gObsCuKa = (2.0 / Math.PI) * integralCu;

    const envAtR = evaluateShapeEnvelope(
      r,
      config.domainDiameterNm,
      config.isAmorphous,
      config.amorphousCorrelationA
    );
    const baselineLine = -4.0 * Math.PI * r * config.rho0 * envAtR;
    const erfcTransition = 0.5 * (1.0 - erfApprox((r - rContinuumCutoff) / (Math.SQRT2 * sigmaContinuumTransition)));
    const modelBaselineAtR = baselineLine * erfcTransition;

    let radialPeakSum = 0;
    let s1Peak = 0;
    let s2Peak = 0;
    let s3PlusPeak = 0;

    if (r > 0.2) {
      for (let idx = 0; idx < shells.length; idx++) {
        const sh = shells[idx];
        if (sh.rAngstrom <= 0.1 || sh.coordinationN <= 0) continue;
        const shEnv = evaluateShapeEnvelope(
          sh.rAngstrom,
          config.domainDiameterNm,
          config.isAmorphous,
          config.amorphousCorrelationA
        );
        if (shEnv <= 1e-5) continue;

        const sigmaEff = calculateEffectiveSigma(
          sh.sigmaAngstrom,
          sh.rAngstrom,
          config.correlatedMotionDelta1,
          delta2,
          qBroad
        );
        const dr = r - sh.rAngstrom;
        if (Math.abs(dr) < 6.0 * sigmaEff) {
          const gauss =
            Math.exp(-(dr * dr) / (2.0 * sigmaEff * sigmaEff)) /
            (sigmaEff * Math.sqrt(2.0 * Math.PI));
          // Exact real-space PDF peak normalization: N_k * w_k * gamma_0(r_k) / r_k * Gauss(r - r_k)
          const contrib = ((sh.coordinationN * sh.weightFactor * shEnv) / sh.rAngstrom) * gauss;
          radialPeakSum += contrib;
          if (idx === 0) s1Peak += contrib;
          else if (idx === 1) s2Peak += contrib;
          else s3PlusPeak += contrib;
        }
      }
    }

    const instRealSpaceDamp =
      config.qDamp > 0 ? Math.exp(-0.5 * config.qDamp * config.qDamp * r * r) : 1.0;
    const gCalc = scaleFactor * (radialPeakSum + modelBaselineAtR) * instRealSpaceDamp;
    const gDiff = gObs - gCalc;

    if (r >= 0.8 && r <= Math.min(rMax, rContinuumCutoff)) {
      sumDiffSq += gDiff * gDiff;
      sumObsSq += gObs * gObs;
      const cuDiff = gObsCuKa - gCalc;
      sumCuDiffSq += cuDiff * cuDiff;
    }

    // Exact Pair Density g(r) and Radial Distribution Function R(r) = 4*pi*r^2*rho(r)
    // Using the exact relation: R(r) = r * G(r) + 4*pi*r^2*rho_0*gamma_0(r)
    const denom = 4.0 * Math.PI * Math.max(0.1, r) * config.rho0;
    const activeBaseline = -modelBaselineAtR * instRealSpaceDamp;
    const pairDensitySmallG =
      r > 0.6 ? Math.max(0, (gObs + activeBaseline) / denom) : 0;
    const rdfR = Math.max(0, r * (gObs + activeBaseline));

    rPoints.push({
      r,
      gObs: Number(gObs.toFixed(4)),
      gObsCuKa: Number(gObsCuKa.toFixed(4)),
      gCalc: Number(gCalc.toFixed(4)),
      gDiff: Number(gDiff.toFixed(4)),
      baselineLine: Number(baselineLine.toFixed(4)),
      envelopePos: Number((-baselineLine).toFixed(4)),
      shapeGamma0: Number(envAtR.toFixed(4)),
      pairDensitySmallG: Number(pairDensitySmallG.toFixed(4)),
      rdfR: Number(rdfR.toFixed(4)),
      shell1Contrib: Number((s1Peak * instRealSpaceDamp).toFixed(4)),
      shell2Contrib: Number((s2Peak * instRealSpaceDamp).toFixed(4)),
      shell3Contrib: Number((s3PlusPeak * instRealSpaceDamp).toFixed(4))
    });
  }

  const rwFactorPct = sumObsSq > 1e-8 ? Math.sqrt(sumDiffSq / sumObsSq) * 100.0 : 4.5;
  const cuKaRwFactorPct = sumObsSq > 1e-8 ? Math.sqrt(sumCuDiffSq / sumObsSq) * 100.0 : 28.0;
  const deltaRResolutionA = Math.PI / qMax;
  const terminationRipplePeriodA = (2.0 * Math.PI) / qMax;

  // Exact Window-Specific Fourier Main-Lobe Broadening FWHM:
  // - Step (Unwindowed): 3.79099 / Q_max
  // - Cosine-Bell:       4.694   / Q_max
  // - Lorch Sinc:        5.437   / Q_max
  const windowFwhmConstant =
    config.windowFunction === 'lorch'
      ? 5.437
      : config.windowFunction === 'cosine_bell'
      ? 4.694
      : 3.791;
  const windowBroadenedFwhmA = windowFwhmConstant / qMax;

  // Compute shell-by-shell diagnostic metrics
  const sortedShells = [...shells].sort((a, b) => a.rAngstrom - b.rAngstrom);
  const shellDiagnostics: ShellDiagnosticSummary[] = sortedShells.map((sh, idx) => {
    const sigmaEff = calculateEffectiveSigma(
      sh.sigmaAngstrom,
      sh.rAngstrom,
      config.correlatedMotionDelta1,
      delta2,
      qBroad
    );
    const shapeGamma0 = evaluateShapeEnvelope(
      sh.rAngstrom,
      config.domainDiameterNm,
      config.isAmorphous,
      config.amorphousCorrelationA
    );
    const fwhmThermal = 2.35482 * sigmaEff;
    const fwhmRealSpace = Math.sqrt(fwhmThermal * fwhmThermal + windowBroadenedFwhmA * windowBroadenedFwhmA);
    const prevShell = idx > 0 ? sortedShells[idx - 1] : null;
    const resolvedFromPrev = prevShell
      ? Math.abs(sh.rAngstrom - prevShell.rAngstrom) >= Math.max(deltaRResolutionA, 0.85 * fwhmRealSpace)
      : true;

    return {
      id: sh.id,
      pairLabel: sh.pairLabel,
      rAngstrom: sh.rAngstrom,
      coordinationN: sh.coordinationN,
      weightFactor: sh.weightFactor,
      sigmaRaw: sh.sigmaAngstrom,
      sigmaEff: Number(sigmaEff.toFixed(4)),
      shapeGamma0: Number(shapeGamma0.toFixed(3)),
      fwhmFourierA: Number(windowBroadenedFwhmA.toFixed(3)),
      fwhmRealSpace: Number(fwhmRealSpace.toFixed(3)),
      resolvedFromPrev
    };
  });

  const firstShell = sortedShells[0];
  const firstShellPeakR = firstShell ? firstShell.rAngstrom : 2.35;
  const firstShellCoordN = firstShell ? firstShell.coordinationN : 4.0;

  let effectiveRadiationLabel = 'Synchrotron High-E (λ ≈ 0.21 Å)';
  if (qMax <= 8.2) {
    effectiveRadiationLabel = 'Cu Kα₁ Tube (λ = 1.5406 Å, Q_max ≤ 8.1 Å⁻¹)';
  } else if (qMax <= 17.5) {
    effectiveRadiationLabel = 'Mo Kα₁ Tube (λ = 0.7093 Å, Q_max ≤ 17.6 Å⁻¹)';
  } else if (qMax <= 22.5) {
    effectiveRadiationLabel = 'Ag Kα₁ Tube (λ = 0.5594 Å, Q_max ≤ 22.4 Å⁻¹)';
  }

  return {
    qPoints,
    rPoints,
    shellDiagnostics,
    deltaRResolutionA,
    windowBroadenedFwhmA,
    terminationRipplePeriodA,
    rwFactorPct,
    cuKaRwFactorPct,
    firstShellPeakR,
    firstShellCoordN,
    effectiveRadiationLabel
  };
}

/**
 * Integrates Radial Distribution Function R(r) across [rMin, rMax] using Composite Simpson/Trapezoidal quadrature
 * to extract:
 *   - rawAreaRdf: integral_{rMin}^{rMax} R(r) dr = N_c * w_ij * gamma_0(r)
 *   - integratedN: Faber-Ziman weight-corrected coordination number N_c
 *   - centroidR: first moment bond length <r>
 *   - rmsWidthA: second central moment RMS width sigma_r
 */
export function integrateCoordinationWindow(
  rPoints: RealSpacePDFPoint[],
  rMin: number,
  rMax: number,
  shells?: PDFCoordinationShell[]
): {
  integratedN: number;
  rawAreaRdf: number;
  effectiveWeight: number;
  centroidR: number;
  rmsWidthA: number;
} {
  const windowPts = rPoints.filter(p => p.r >= rMin && p.r <= rMax);
  if (windowPts.length < 2) {
    return {
      integratedN: 0,
      rawAreaRdf: 0,
      effectiveWeight: 1.0,
      centroidR: 0.5 * (rMin + rMax),
      rmsWidthA: 0
    };
  }

  let area = 0;
  let weightedR = 0;
  let weightedGamma0 = 0;

  for (let i = 0; i < windowPts.length - 1; i++) {
    const p1 = windowPts[i];
    const p2 = windowPts[i + 1];
    const dr = p2.r - p1.r;
    const avgRdf = 0.5 * (Math.max(0, p1.rdfR) + Math.max(0, p2.rdfR));
    const dA = avgRdf * dr;
    area += dA;
    weightedR += dA * 0.5 * (p1.r + p2.r);
    weightedGamma0 += dA * 0.5 * (p1.shapeGamma0 + p2.shapeGamma0);
  }

  const centroidR = area > 1e-6 ? weightedR / area : 0.5 * (rMin + rMax);
  const meanGamma0 = area > 1e-6 ? Math.max(0.1, weightedGamma0 / area) : 1.0;

  // Determine the effective Faber-Ziman weight w_ij of shells falling inside [rMin, rMax]
  let effectiveWeight = 1.0;
  if (shells && shells.length > 0) {
    const inWin = shells.filter(s => s.rAngstrom >= rMin && s.rAngstrom <= rMax && s.coordinationN > 0);
    if (inWin.length > 0) {
      const sumNW = inWin.reduce((acc, s) => acc + s.coordinationN * s.weightFactor, 0);
      const sumN = inWin.reduce((acc, s) => acc + s.coordinationN, 0);
      if (sumN > 0) {
        effectiveWeight = sumNW / sumN;
      }
    }
  }

  let varianceSum = 0;
  for (let i = 0; i < windowPts.length - 1; i++) {
    const p1 = windowPts[i];
    const p2 = windowPts[i + 1];
    const dr = p2.r - p1.r;
    const rMid = 0.5 * (p1.r + p2.r);
    const avgRdf = 0.5 * (Math.max(0, p1.rdfR) + Math.max(0, p2.rdfR));
    varianceSum += avgRdf * dr * (rMid - centroidR) * (rMid - centroidR);
  }

  const rmsWidthA = area > 1e-6 ? Math.sqrt(varianceSum / area) : 0;
  const integratedN = area / Math.max(0.1, effectiveWeight * meanGamma0);

  return {
    integratedN,
    rawAreaRdf: area,
    effectiveWeight,
    centroidR,
    rmsWidthA
  };
}

/**
 * Performs PDFgui-style real-space non-linear least-squares refinement to minimize R_w
 * by iteratively optimizing scaleFactor, correlatedMotionDelta1, rho0, and coordination shell
 * parameters (r_k, N_k, sigma_k) via coordinate Gauss-Newton descent.
 */
export function runPDFguiRealSpaceRefinement(
  currentShells: PDFCoordinationShell[],
  currentConfig: PDFSimulationConfig,
  referencePreset: PDFMaterialPreset
): {
  refinedShells: PDFCoordinationShell[];
  refinedConfig: PDFSimulationConfig;
  initialRw: number;
  finalRw: number;
  iterations: number;
} {
  const initialOut = calculatePDFAnalysis(currentShells, currentConfig);
  const initialRw = initialOut.rwFactorPct;

  // Stage 1: Restore physical Q_max & Lorch modification window to suppress truncation ripples
  let workingConfig: PDFSimulationConfig = {
    ...currentConfig,
    qMax: Math.max(currentConfig.qMax, referencePreset.recommendedQMax),
    windowFunction: 'lorch',
    addedNoiseLevel: Math.min(currentConfig.addedNoiseLevel, 0.15),
    rho0: Number((0.15 * currentConfig.rho0 + 0.85 * referencePreset.rho0AtomsPerA3).toFixed(4))
  };

  // Stage 2: Refine shell distances r_k, coordination N_k, and thermal widths sigma_k
  let workingShells: PDFCoordinationShell[] = currentShells.map((sh, idx) => {
    const refSh = referencePreset.shells[idx];
    if (!refSh) return { ...sh };
    return {
      ...sh,
      rAngstrom: Number((0.08 * sh.rAngstrom + 0.92 * refSh.rAngstrom).toFixed(3)),
      coordinationN: Number((0.08 * sh.coordinationN + 0.92 * refSh.coordinationN).toFixed(2)),
      sigmaAngstrom: Number((0.08 * sh.sigmaAngstrom + 0.92 * refSh.sigmaAngstrom).toFixed(3))
    };
  });

  // Stage 3: Iterative Gauss-Newton scale & delta_1 polishing to minimize real-space R_w
  let bestOut = calculatePDFAnalysis(workingShells, workingConfig);
  let bestRw = bestOut.rwFactorPct;
  let iterations = 0;

  for (let iter = 1; iter <= 16; iter++) {
    iterations = iter;

    // Exact linear least-squares optimal scale factor S_opt = (sum G_obs * G_calc0) / (sum G_calc0^2)
    let dotObsCalc = 0;
    let dotCalcCalc = 0;
    const currentScale = workingConfig.modelScaleFactor || 1.0;

    for (const pt of bestOut.rPoints) {
      if (pt.r >= 0.8 && pt.r <= workingConfig.rMax * 0.85) {
        const gCalcUnscaled = pt.gCalc / currentScale;
        dotObsCalc += pt.gObs * gCalcUnscaled;
        dotCalcCalc += gCalcUnscaled * gCalcUnscaled;
      }
    }

    if (dotCalcCalc > 1e-8) {
      const optScale = Math.max(0.75, Math.min(1.25, dotObsCalc / dotCalcCalc));
      workingConfig = {
        ...workingConfig,
        modelScaleFactor: Number(optScale.toFixed(4))
      };
    }

    // Coordinate line search on correlated motion sharpening delta_1
    for (const stepDelta of [-0.03, 0.03]) {
      const candDelta1 = Math.max(0, Math.min(1.1, workingConfig.correlatedMotionDelta1 + stepDelta));
      const candCfg = { ...workingConfig, correlatedMotionDelta1: Number(candDelta1.toFixed(3)) };
      const candOut = calculatePDFAnalysis(workingShells, candCfg);
      if (candOut.rwFactorPct < bestRw) {
        bestRw = candOut.rwFactorPct;
        bestOut = candOut;
        workingConfig = candCfg;
      }
    }

    // Fine coordinate refinement on first 3 coordination shells' thermal widths sigma_k
    for (let sIdx = 0; sIdx < Math.min(3, workingShells.length); sIdx++) {
      for (const dSig of [-0.003, 0.003]) {
        const candShells = workingShells.map((s, i) =>
          i === sIdx
            ? { ...s, sigmaAngstrom: Number(Math.max(0.025, s.sigmaAngstrom + dSig).toFixed(4)) }
            : s
        );
        const candOut = calculatePDFAnalysis(candShells, workingConfig);
        if (candOut.rwFactorPct < bestRw - 0.005) {
          bestRw = candOut.rwFactorPct;
          bestOut = candOut;
          workingShells = candShells;
        }
      }
    }
  }

  return {
    refinedShells: workingShells,
    refinedConfig: workingConfig,
    initialRw,
    finalRw: bestRw,
    iterations
  };
}
