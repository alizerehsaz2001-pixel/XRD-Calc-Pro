import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Atom,
  FlaskConical,
  Layers,
  CircleDot,
  Cog,
  Mountain,
  Pill,
  Leaf,
  Cpu,
  ArrowRight,
  Zap,
  Compass,
  Check,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Eye,
  Activity,
  Sliders,
  ExternalLink,
  ChevronRight,
  Table2,
  LayoutGrid,
  FileSpreadsheet
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

export interface DisciplineSamplePayload {
  sampleId: string;
  materialName: string;
  rawPeaks: string;
  rawHKL: string;
  wavelength: number;
  crystalSystem: string;
}

export interface DisciplineReflection {
  dSpacing: number; // in Å (wavelength-independent physical plane spacing)
  angleCu: number;  // 2theta in deg at Cu Kα (1.5406 Å)
  intensity: number;
  hkl: string;
  phaseNote?: string;
}

export interface DisciplineInfo {
  id: string;
  indexNumber: string;
  name: string;
  shortName: string;
  tagline: string;
  headerBg: string;
  headerBorder: string;
  accentColor: string;
  accentText: string;
  cardHoverBorder: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  detailedWhy: string;
  governingEquation: string;
  equationVariables: string;
  primaryObservable: string;
  resolutionSpec: string;
  keyParameters: string[];
  typicalSamples: string[];
  targetModule: string;
  targetModuleLabel: string;
  samplePresetName: string;
  crystalSystem: string;
  fwhmBroadeningDeg: number; // realistic peak FWHM for this discipline's specimen
  spectrumData: DisciplineReflection[];
  graphicType: 'physics' | 'chemistry' | 'materials' | 'nano' | 'metallurgy' | 'geology' | 'pharma' | 'enviro' | 'semicon';
}

const XRAY_ANODES = [
  { id: 'Cu', label: 'Cu Kα₁', wavelength: 1.5406, energyKeV: 8.048, note: 'Standard Lab Diffractometer' },
  { id: 'Co', label: 'Co Kα₁', wavelength: 1.7889, energyKeV: 6.930, note: 'Fe-Rich Metallurgy & Geology' },
  { id: 'Mo', label: 'Mo Kα₁', wavelength: 0.7107, energyKeV: 17.479, note: 'High-Q Single Crystal / PDF' },
  { id: 'Cr', label: 'Cr Kα₁', wavelength: 2.2897, energyKeV: 5.415, note: 'High-Dispersion Residual Stress' },
];

export const DISCIPLINES: DisciplineInfo[] = [
  {
    id: 'physics',
    indexNumber: '01',
    name: 'Physics',
    shortName: 'Physics',
    tagline: 'Condensed Matter & Reciprocal Space',
    headerBg: 'bg-blue-950/90',
    headerBorder: 'border-blue-500/40',
    accentColor: '#3b82f6',
    accentText: 'text-blue-400',
    cardHoverBorder: 'hover:border-blue-500/70',
    icon: Atom,
    description: 'Crystal structures, lattice parameters, symmetry extinctions, and structural phase transitions.',
    detailedWhy:
      'X-ray wavelengths (0.5–2.5 Å) match interatomic spacing in periodic crystals. Through constructive interference (nλ = 2d sinθ), XRD maps the reciprocal lattice, determines unit-cell metric tensors with sub-picometer precision, verifies space-group glide/screw extinctions, and tracks structural order parameters across cryogenic or high-pressure phase transitions.',
    governingEquation: 'nλ = 2d_{hkl} sinθ   ·   Q = (4π / λ) sinθ = 2π / d_{hkl}',
    equationVariables: 'λ: wavelength (Å) · d_{hkl}: interplanar spacing (Å) · θ: Bragg angle · Q: momentum transfer (Å⁻¹)',
    primaryObservable: 'Reciprocal Lattice Vectors & Space-Group Symmetry',
    resolutionSpec: 'Δd/d ≈ 1×10⁻⁴ · Angular precision ±0.002° 2θ',
    keyParameters: [
      'Unit-Cell Metric Parameters (a, b, c, α, β, γ)',
      'Systematic Space-Group Extinctions (Fd-3m, Fm-3m)',
      'Thermal Debye–Waller Factor B_iso (⟨u²⟩)',
      'Order Parameter Evolution Across Tc'
    ],
    typicalSamples: [
      'Silicon (NIST SRM 640f Standard)',
      'Cuprate Superconductors (YBa₂Cu₃O₇₋δ)',
      'Ferroelectric Perovskites (BaTiO₃)',
      'Topological Insulators (Bi₂Se₃)'
    ],
    targetModule: 'bragg',
    targetModuleLabel: 'Bragg Diffractometer Workbench',
    samplePresetName: 'Silicon (NIST SRM 640f)',
    crystalSystem: 'DC',
    fwhmBroadeningDeg: 0.14,
    spectrumData: [
      { dSpacing: 3.1355, angleCu: 28.442, intensity: 100, hkl: '111', phaseNote: 'Diamond Cubic Allowed' },
      { dSpacing: 1.9201, angleCu: 47.302, intensity: 55, hkl: '220', phaseNote: 'h+k+l = 4n' },
      { dSpacing: 1.6375, angleCu: 56.121, intensity: 30, hkl: '311', phaseNote: 'All Odd Allowed' },
      { dSpacing: 1.3577, angleCu: 69.130, intensity: 8, hkl: '400', phaseNote: 'h+k+l = 4n' },
      { dSpacing: 1.2459, angleCu: 76.376, intensity: 12, hkl: '331', phaseNote: 'All Odd Allowed' },
      { dSpacing: 1.1086, angleCu: 88.031, intensity: 16, hkl: '422', phaseNote: 'h+k+l = 4n' }
    ],
    graphicType: 'physics'
  },
  {
    id: 'chemistry',
    indexNumber: '02',
    name: 'Chemistry',
    shortName: 'Chemistry',
    tagline: 'Solid-State Synthesis & Polymorphs',
    headerBg: 'bg-emerald-950/90',
    headerBorder: 'border-emerald-500/40',
    accentColor: '#10b981',
    accentText: 'text-emerald-400',
    cardHoverBorder: 'hover:border-emerald-500/70',
    icon: FlaskConical,
    description: 'Identifying chemical phases, polymorph differentiation, and solid-state reaction products.',
    detailedWhy:
      'Unlike elemental techniques (XRF, ICP, EDS) that only report atomic ratios, powder XRD fingerprints the exact 3D coordination geometry. It immediately differentiates chemical polymorphs with identical formulas—such as tetragonal Anatase vs. Rutile TiO₂, or Calcite vs. Aragonite CaCO₃—and tracks unreacted precursors during synthesis.',
    governingEquation: 'F(hkl) = ∑ f_j(Q) · exp[2πi(hx_j + ky_j + lz_j)] · exp(-B_j sin²θ/λ²)',
    equationVariables: 'F(hkl): structure factor · f_j: atomic scattering factor · (x_j,y_j,z_j): fractional coordinates',
    primaryObservable: 'Crystalline Polymorph Identity & Structure Factor |F(hkl)|²',
    resolutionSpec: 'Minor impurity detection limit ~0.2–0.5 wt%',
    keyParameters: [
      'Polymorph Fingerprinting (Anatase vs. Rutile)',
      'Structure Factor Phase & Intensity Ratios',
      'Solid-Solution Vegard’s Law Shift a(x)',
      'In-Situ Calcination & Reaction Completeness'
    ],
    typicalSamples: [
      'TiO₂ Photocatalyst (Anatase / Rutile Mix)',
      'ZSM-5 & Faujasite Zeolite Molecular Sieves',
      'Layered Cathode Precursors (LiNi₀.₈Mn₀.₁Co₀.₁O₂)',
      'Metal–Organic Frameworks (UiO-66, HKUST-1)'
    ],
    targetModule: 'selection',
    targetModuleLabel: 'Structure Factor & Selection Rules',
    samplePresetName: 'TiO₂ Anatase / Rutile Polymorphs',
    crystalSystem: 'Tetragonal',
    fwhmBroadeningDeg: 0.22,
    spectrumData: [
      { dSpacing: 3.5200, angleCu: 25.281, intensity: 100, hkl: '101', phaseNote: 'Anatase (I4₁/amd)' },
      { dSpacing: 3.2470, angleCu: 27.446, intensity: 75, hkl: '110', phaseNote: 'Rutile (P4₂/mnm)' },
      { dSpacing: 2.4870, angleCu: 36.085, intensity: 45, hkl: '101', phaseNote: 'Rutile' },
      { dSpacing: 2.3780, angleCu: 37.800, intensity: 22, hkl: '004', phaseNote: 'Anatase' },
      { dSpacing: 1.8920, angleCu: 48.049, intensity: 35, hkl: '200', phaseNote: 'Anatase' },
      { dSpacing: 1.6874, angleCu: 54.322, intensity: 60, hkl: '211', phaseNote: 'Rutile' }
    ],
    graphicType: 'chemistry'
  },
  {
    id: 'materials',
    indexNumber: '03',
    name: 'Materials Science',
    shortName: 'Materials',
    tagline: 'Full-Profile Refinement & Phase Design',
    headerBg: 'bg-purple-950/90',
    headerBorder: 'border-purple-500/40',
    accentColor: '#a855f7',
    accentText: 'text-purple-400',
    cardHoverBorder: 'hover:border-purple-500/70',
    icon: Layers,
    description: 'Whole-pattern Pawley/Rietveld refinement, phase fractions, and structure–property engineering.',
    detailedWhy:
      'Macroscopic mechanical toughness, ionic conductivity, and thermal expansion are governed by crystal phase assemblages and defect chemistry. Whole-powder-pattern decomposition (Pawley, Le Bail, and Rietveld refinement) fits the entire experimental step scan against calculated structural models to extract exact phase weight fractions and lattice distortions.',
    governingEquation: 'R_{wp} = [ ∑ w_i (Y_i^{obs} - Y_i^{calc})² / ∑ w_i (Y_i^{obs})² ]^{1/2}',
    equationVariables: 'Y_i^{obs}: observed step intensity · Y_i^{calc}: modeled profile · w_i = 1/Y_i^{obs}: statistical weight',
    primaryObservable: 'Whole-Pattern Profile Fit & Multi-Phase Weight Fractions',
    resolutionSpec: 'R_wp < 2.5% · Goodness-of-Fit χ² ≈ 1.05–1.30',
    keyParameters: [
      'Weighted Profile Residual (R_wp, R_exp, χ²)',
      'Quantitative Multi-Phase Abundance (wt%)',
      'Oxygen Vacancy & Site Occupancy Factors',
      'Anisotropic Thermal Expansion Tensors'
    ],
    typicalSamples: [
      'α-Al₂O₃ Corundum (NIST SRM 676a Quantitative Std)',
      'Yttria-Stabilized Zirconia (t-YSZ / m-ZrO₂)',
      'FCC/BCC High-Entropy Alloys (CrMnFeCoNi)',
      'Solid-State Garnet Electrolytes (LLZO)'
    ],
    targetModule: 'pawley_lebail',
    targetModuleLabel: 'Pawley & Le Bail Full-Pattern Fitting',
    samplePresetName: 'α-Al₂O₃ Corundum (NIST SRM 676a)',
    crystalSystem: 'Hexagonal',
    fwhmBroadeningDeg: 0.18,
    spectrumData: [
      { dSpacing: 3.4799, angleCu: 25.578, intensity: 65, hkl: '012', phaseNote: 'R-3c Rhombohedral' },
      { dSpacing: 2.5509, angleCu: 35.152, intensity: 100, hkl: '104', phaseNote: 'Primary Corundum Peak' },
      { dSpacing: 2.3795, angleCu: 37.776, intensity: 42, hkl: '110', phaseNote: 'Prism Plane' },
      { dSpacing: 2.0854, angleCu: 43.355, intensity: 88, hkl: '113', phaseNote: 'High-Structure Factor' },
      { dSpacing: 1.7400, angleCu: 52.553, intensity: 45, hkl: '024', phaseNote: 'Second-Order 012' },
      { dSpacing: 1.6014, angleCu: 57.502, intensity: 92, hkl: '116', phaseNote: 'High-Angle Reference' }
    ],
    graphicType: 'materials'
  },
  {
    id: 'nano',
    indexNumber: '04',
    name: 'Nanotechnology',
    shortName: 'Nanotech',
    tagline: 'Coherent Domain Size & Microstrain',
    headerBg: 'bg-teal-950/90',
    headerBorder: 'border-teal-500/40',
    accentColor: '#14b8a6',
    accentText: 'text-teal-400',
    cardHoverBorder: 'hover:border-teal-500/70',
    icon: CircleDot,
    description: 'Nanocrystal domain sizing, Williamson–Hall microstrain separation, and dislocation density.',
    detailedWhy:
      'When coherent crystalline domains shrink below ~100 nm, finite-size wave interference causes measurable diffraction peak broadening. By deconvolving instrumental optics from intrinsic Lorentzian/Gaussian line profiles, Scherrer, Williamson–Hall, and Warren–Averbach methods quantify average nanocrystal size ⟨D⟩ and inhomogeneous lattice microstrain ⟨ε²⟩¹/².',
    governingEquation: 'β_{hkl} cosθ = (Kλ / D) + 4ε sinθ   ·   D = Kλ / (β_D cosθ)',
    equationVariables: 'β_{hkl}: corrected integral/FWHM breadth (rad) · K: Scherrer shape factor (0.89–0.94) · D: domain size · ε: microstrain',
    primaryObservable: 'Line-Profile Broadening β(2θ) & Domain Size Distribution',
    resolutionSpec: 'Valid Coherent Domain Range: 1.5 nm to 150 nm',
    keyParameters: [
      'Volume-Weighted Crystallite Size D_v (nm)',
      'Root-Mean-Square Microstrain ε_rms (×10⁻³)',
      'Williamson–Smallman Dislocation Density ρ (m⁻²)',
      'Anisotropic Aspect Ratio (c/a Nanorods vs. Spheres)'
    ],
    typicalSamples: [
      'Wurtzite ZnO Quantum Dots (18 nm Domains)',
      'Superparamagnetic Fe₃O₄ Nanoparticles',
      'Colloidal CsPbBr₃ Perovskite Nanocrystals',
      'Pt/C Fuel-Cell Electrocatalyst Nanoparticles'
    ],
    targetModule: 'scherrer',
    targetModuleLabel: 'Scherrer & Williamson–Hall Analytics',
    samplePresetName: 'ZnO Nanocrystals (18 nm Broadened)',
    crystalSystem: 'Hexagonal',
    fwhmBroadeningDeg: 0.62,
    spectrumData: [
      { dSpacing: 2.8143, angleCu: 31.770, intensity: 58, hkl: '100', phaseNote: 'FWHM = 0.58° (18 nm)' },
      { dSpacing: 2.6033, angleCu: 34.422, intensity: 44, hkl: '002', phaseNote: 'c-Axis Growth Direction' },
      { dSpacing: 2.4759, angleCu: 36.253, intensity: 100, hkl: '101', phaseNote: 'Dominant Wurtzite Peak' },
      { dSpacing: 1.9111, angleCu: 47.539, intensity: 23, hkl: '102', phaseNote: 'Size + Strain Broadened' },
      { dSpacing: 1.6247, angleCu: 56.603, intensity: 32, hkl: '110', phaseNote: 'Basal Plane Reflection' },
      { dSpacing: 1.4771, angleCu: 62.864, intensity: 29, hkl: '103', phaseNote: 'High-Angle W–H Leverage' }
    ],
    graphicType: 'nano'
  },
  {
    id: 'metallurgy',
    indexNumber: '05',
    name: 'Metallurgy & Mechanical Eng.',
    shortName: 'Metallurgy',
    tagline: 'Residual Stress (sin²ψ) & Alloy Texture',
    headerBg: 'bg-amber-950/90',
    headerBorder: 'border-amber-500/40',
    accentColor: '#f59e0b',
    accentText: 'text-amber-400',
    cardHoverBorder: 'hover:border-amber-500/70',
    icon: Cog,
    description: 'Non-destructive residual stress tensors, retained austenite quantification, and rolling textures.',
    detailedWhy:
      'Macroscopic tensile or compressive stresses elastically distort the crystal lattice spacing d_{φψ} as a function of specimen tilt angle ψ. Using the atomic lattice itself as an internal strain gauge via the sin²ψ method, XRD non-destructively quantifies surface stress (MPa) in aerospace turbines, welds, and shot-peened gears.',
    governingEquation: 'ε_{φψ} = (d_{φψ} - d_0)/d_0 = [(1 + ν)/E]_{hkl} σ_φ sin²ψ - (ν/E)_{hkl}(σ_1 + σ_2)',
    equationVariables: 'ψ: sample tilt angle · E, ν: X-ray elastic constants · σ_φ: in-plane surface stress (MPa) · d_0: unstressed spacing',
    primaryObservable: 'Elastic Lattice Strain Slope ∂(d_ψ)/∂(sin²ψ) & Pole Density',
    resolutionSpec: 'Stress resolution ±10–15 MPa · Retained austenite ≥ 0.5 vol%',
    keyParameters: [
      'In-Plane Macroscopic Residual Stress σ_φ (MPa)',
      'Retained Austenite γ-Fe vs. α-Fe Martensite (vol%)',
      'Harris Texture Coefficient TC(hkl) & March–Dollase r',
      'Work-Hardening Dislocation Density in Cold-Rolled Steels'
    ],
    typicalSamples: [
      'Shot-Peened BCC α-Fe Aerospace Gear Steel',
      'Additive Manufactured Inconel 718 Superalloy',
      'Duplex Stainless Steel (α-Ferrite + γ-Austenite)',
      'Ti-6Al-4V Biomedical Forgings'
    ],
    targetModule: 'residual_stress',
    targetModuleLabel: 'sin²ψ Residual Stress Analyzer',
    samplePresetName: 'BCC α-Fe Ferrite Steel',
    crystalSystem: 'BCC',
    fwhmBroadeningDeg: 0.25,
    spectrumData: [
      { dSpacing: 2.0268, angleCu: 44.673, intensity: 100, hkl: '110', phaseNote: 'Primary BCC α-Fe Slip Plane' },
      { dSpacing: 1.4332, angleCu: 65.021, intensity: 20, hkl: '200', phaseNote: 'Elastically Compliant Axis' },
      { dSpacing: 1.1702, angleCu: 82.333, intensity: 32, hkl: '211', phaseNote: 'Standard sin²ψ Stress Peak' },
      { dSpacing: 1.0134, angleCu: 98.945, intensity: 12, hkl: '220', phaseNote: 'Second-Order 110' },
      { dSpacing: 0.9064, angleCu: 116.385, intensity: 16, hkl: '310', phaseNote: 'High-Sensitivity Backscatter' }
    ],
    graphicType: 'metallurgy'
  },
  {
    id: 'geology',
    indexNumber: '06',
    name: 'Geology & Earth Sciences',
    shortName: 'Geology',
    tagline: 'Quantitative Mineralogy & Clays',
    headerBg: 'bg-yellow-950/90',
    headerBorder: 'border-yellow-600/40',
    accentColor: '#eab308',
    accentText: 'text-yellow-400',
    cardHoverBorder: 'hover:border-yellow-500/70',
    icon: Mountain,
    description: 'Polymineralic rock modal analysis, clay basal spacing, and planetary regolith mineralogy.',
    detailedWhy:
      'Sedimentary cores, hydrothermal ores, and fine-grained phyllosilicate clays (smectite, illite, kaolinite) cannot be resolved by optical microscopy or bulk XRF chemistry. Powder XRD resolves overlapping multi-mineral assemblages, tracks basal (001) clay swelling upon ethylene glycol solvation, and determines Mg/Fe solid-solution ratios in olivines.',
    governingEquation: 'W_α = (I_{iα} / RIR_{α,c}) / ∑_{k=1}^N (I_{ik} / RIR_{k,c})',
    equationVariables: 'W_α: weight fraction of mineral α · RIR_{α,c}: Reference Intensity Ratio vs. Corundum (I/I_c)',
    primaryObservable: 'Modal Mineral Assemblage (wt%) & Basal d(001) Swelling',
    resolutionSpec: 'Multi-phase resolution up to 8–12 coexisting minerals',
    keyParameters: [
      'Modal Mineral Abundance via RIR (I/I_c) & Rietveld',
      'Phyllosilicate Basal d(001) Interlayer Expansion (10→17 Å)',
      'Forsterite–Fayalite (Mg,Fe)₂SiO₄ Composition via d(130)',
      'Carbonate Dolomitization Stoichiometry Ca_{1-x}Mg_xCO₃'
    ],
    typicalSamples: [
      'α-Quartz + Calcite Hydrothermal Vein Ore',
      'Bentonite / Montmorillonite Swelling Clay',
      'Kimberlite & Basalt Planetary Simulants',
      'Bauxite & Porphyry Copper Tailings'
    ],
    targetModule: 'database',
    targetModuleLabel: 'PDF-2 & Mineral Registry Explorer',
    samplePresetName: 'α-Quartz / Calcite Mineral Assemblage',
    crystalSystem: 'Hexagonal',
    fwhmBroadeningDeg: 0.19,
    spectrumData: [
      { dSpacing: 4.2550, angleCu: 20.860, intensity: 24, hkl: '100', phaseNote: 'α-Quartz (P3₂21)' },
      { dSpacing: 3.3435, angleCu: 26.640, intensity: 100, hkl: '101', phaseNote: 'α-Quartz Primary (I/Ic = 3.6)' },
      { dSpacing: 3.0355, angleCu: 29.400, intensity: 82, hkl: '104', phaseNote: 'Calcite CaCO₃ (I/Ic = 2.0)' },
      { dSpacing: 2.4569, angleCu: 36.544, intensity: 15, hkl: '110', phaseNote: 'α-Quartz' },
      { dSpacing: 2.2818, angleCu: 39.460, intensity: 18, hkl: '113', phaseNote: 'Calcite Cleavage Plane' },
      { dSpacing: 1.8179, angleCu: 50.140, intensity: 16, hkl: '112', phaseNote: 'α-Quartz Diagnostic' }
    ],
    graphicType: 'geology'
  },
  {
    id: 'pharma',
    indexNumber: '07',
    name: 'Pharmaceutical Sciences',
    shortName: 'Pharma',
    tagline: 'API Polymorphism & Crystallinity',
    headerBg: 'bg-pink-950/90',
    headerBorder: 'border-pink-500/40',
    accentColor: '#ec4899',
    accentText: 'text-pink-400',
    cardHoverBorder: 'hover:border-pink-500/70',
    icon: Pill,
    description: 'Active Pharmaceutical Ingredient (API) polymorph screening, hydrates, and % crystallinity.',
    detailedWhy:
      'Alternative crystal packing arrangements (polymorphs, hydrates, solvates) of the same Active Pharmaceutical Ingredient exhibit dramatically different solubility, bioavailability, and tablet compactibility. Regulatory pharmacopeias (USP <941>, Ph. Eur.) mandate XRPD to guarantee polymorphic purity and quantify amorphous halo content.',
    governingEquation: '% Crystallinity = [ ∫ I_{cryst}(2θ) d(2θ) / ∫ (I_{cryst}(2θ) + K · I_{amorph}(2θ)) d(2θ) ] × 100%',
    equationVariables: 'I_{cryst}: integrated Bragg reflection area · I_{amorph}: diffuse amorphous halo area · K: Ruland scattering factor',
    primaryObservable: 'Low-Angle Organic Packing Fingerprint (5°–35° 2θ) & % Crystallinity',
    resolutionSpec: 'Polymorph contamination limit < 0.5–1.0 wt% in tablets',
    keyParameters: [
      'Degree of Crystallinity (% X_c) vs. Amorphous Halo',
      'Form I (Monoclinic) vs. Form II (Orthorhombic) API Purity',
      'Humidity-Induced Hydrate / Anhydrate Phase Transitions',
      'Amorphous Solid Dispersion (ASD) Recrystallization Stability'
    ],
    typicalSamples: [
      'Paracetamol (Acetaminophen Form I Monoclinic)',
      'Ritonavir & Carbamazepine Polymorphs',
      'Spray-Dried Amorphous Solid Dispersions',
      'Co-Crystal Formulations (Caffeine–Citric Acid)'
    ],
    targetModule: 'fwhm',
    targetModuleLabel: 'Line Profile & Crystallinity Deconvolution',
    samplePresetName: 'Paracetamol Form I (Monoclinic API)',
    crystalSystem: 'Monoclinic',
    fwhmBroadeningDeg: 0.21,
    spectrumData: [
      { dSpacing: 7.3204, angleCu: 12.080, intensity: 46, hkl: '110', phaseNote: 'Low-Angle Organic Packing' },
      { dSpacing: 5.6685, angleCu: 15.620, intensity: 68, hkl: '002', phaseNote: 'Hydrogen-Bonded Sheet' },
      { dSpacing: 4.8571, angleCu: 18.250, intensity: 100, hkl: '201', phaseNote: 'Form I Diagnostic Marker' },
      { dSpacing: 3.7905, angleCu: 23.450, intensity: 82, hkl: '211', phaseNote: 'Monoclinic P2₁/n' },
      { dSpacing: 3.6480, angleCu: 24.380, intensity: 56, hkl: '022', phaseNote: 'Ring Stacking Plane' },
      { dSpacing: 3.3608, angleCu: 26.500, intensity: 72, hkl: '310', phaseNote: 'Tablet Compaction Plane' }
    ],
    graphicType: 'pharma'
  },
  {
    id: 'enviro',
    indexNumber: '08',
    name: 'Environmental Science',
    shortName: 'Environment',
    tagline: 'Respirable Silica, Asbestos & Soils',
    headerBg: 'bg-green-950/90',
    headerBorder: 'border-green-500/40',
    accentColor: '#22c55e',
    accentText: 'text-green-400',
    cardHoverBorder: 'hover:border-green-500/70',
    icon: Leaf,
    description: 'Airborne respirable crystalline silica (NIOSH 7500), asbestos speciation, and soil remediation.',
    detailedWhy:
      'Occupational and environmental health standards (NIOSH Method 7500, OSHA ID-142) rely on XRD to quantify carcinogenic respirable crystalline silica (α-quartz, cristobalite, tridymite) on silver membrane air filters, identify chrysotile/amphibole asbestos fibers, and verify heavy-metal mineral immobilization (pyromorphite, scorodite) in remediated soils.',
    governingEquation: 'C_{SiO2} = (I_{sample}^{corr} - b) / [ m · V_{air} · f(T_{Ag}) ]   (μg / m³)',
    equationVariables: 'I_{sample}^{corr}: absorption-corrected peak area · T_{Ag}: Ag membrane transmission · V_{air}: sampled air volume',
    primaryObservable: 'Trace Particulate Mass on Filter (μg) & Mineral Speciation',
    resolutionSpec: 'Limit of Quantitation (LOQ) ≈ 5 μg α-Quartz per filter',
    keyParameters: [
      'Respirable Crystalline Silica (Quartz & Cristobalite μg/m³)',
      'Serpentine (Chrysotile) vs. Amphibole Asbestos Speciation',
      'Lead Immobilization as Chloropyromorphite Pb₅(PO₄)₃Cl',
      'Mineral Carbonation Sequestration (Magnesite / Calcite wt%)'
    ],
    typicalSamples: [
      'PM2.5 / PM10 Airborne Dust on Ag Membrane Filter',
      'Coal Fly Ash & Smelter Slag Particulates',
      'Phosphate-Stabilized Mine Tailings',
      'Flue-Gas Desulfurization Gypsum (CaSO₄·2H₂O)'
    ],
    targetModule: 'rir',
    targetModuleLabel: 'RIR Quantitative Phase Analysis',
    samplePresetName: 'NIOSH 7500 Respirable Silica / Dust Mix',
    crystalSystem: 'Hexagonal',
    fwhmBroadeningDeg: 0.20,
    spectrumData: [
      { dSpacing: 7.1610, angleCu: 12.350, intensity: 32, hkl: '001', phaseNote: 'Kaolinite Interference Check' },
      { dSpacing: 4.0406, angleCu: 21.980, intensity: 44, hkl: '101', phaseNote: 'α-Cristobalite SiO₂' },
      { dSpacing: 3.3435, angleCu: 26.640, intensity: 100, hkl: '101', phaseNote: 'Primary α-Quartz Analytical Line' },
      { dSpacing: 3.0355, angleCu: 29.400, intensity: 52, hkl: '104', phaseNote: 'Calcite Soil Carbonate' },
      { dSpacing: 2.8031, angleCu: 31.900, intensity: 36, hkl: '021', phaseNote: 'Gypsum Sulfate Aerosol' },
      { dSpacing: 1.8179, angleCu: 50.140, intensity: 18, hkl: '112', phaseNote: 'Secondary Quartz Line' }
    ],
    graphicType: 'enviro'
  },
  {
    id: 'semicon',
    indexNumber: '09',
    name: 'Semiconductors & Solar Cells',
    shortName: 'Semiconductors',
    tagline: 'HRXRD Epitaxy & XRR Thin Films',
    headerBg: 'bg-sky-950/90',
    headerBorder: 'border-sky-500/40',
    accentColor: '#38bdf8',
    accentText: 'text-sky-400',
    cardHoverBorder: 'hover:border-sky-500/70',
    icon: Cpu,
    description: 'Epitaxial thin-film strain, X-ray reflectometry (XRR) thickness fringes, and halide perovskites.',
    detailedWhy:
      'Next-generation logic transistors, GaN power electronics, and tandem perovskite solar cells depend on atomic-scale heteroepitaxy. High-Resolution XRD (HRXRD) measures out-of-plane lattice mismatch (Δc/c) and dislocation mosaic spread, while grazing-incidence X-Ray Reflectometry (XRR) determines film thickness (0.5–200 nm), electron density, and sub-nanometer interface roughness.',
    governingEquation: 'q_z = (4π / λ) sinθ   ·   t_{film} ≈ 2π / Δq_z   ·   ε_⊥ = -cotθ_B · Δθ',
    equationVariables: 'Δq_z: Kiessig fringe spacing (Å⁻¹) · t_{film}: layer thickness · ε_⊥: epitaxial out-of-plane strain',
    primaryObservable: 'Kiessig Thickness Fringes, Epitaxial Strain & Perovskite Purity',
    resolutionSpec: 'Thickness precision ±0.1 nm · Strain sensitivity Δa/a ≈ 10⁻⁵',
    keyParameters: [
      'Thin-Film Layer Thickness & Roughness σ_rms via XRR',
      'Heteroepitaxial Mismatch Strain & Relaxation (%)',
      'ω-Scan Rocking Curve FWHM (Threading Dislocations)',
      'Halide Perovskite Black α-Phase vs. PbI₂ Degradation'
    ],
    typicalSamples: [
      'MAPbI₃ Perovskite Absorber on c-Si Tandem Wafer',
      'AlGaN / GaN HEMT Heterostructure on Sapphire',
      'Si₁₋ₓGeₓ Strained Nanosheet FinFET Stack',
      'HfO₂ High-κ Gate Dielectric (3.5 nm XRR Film)'
    ],
    targetModule: 'xrr',
    targetModuleLabel: 'X-Ray Reflectometry (XRR) & Thin-Film Lab',
    samplePresetName: 'MAPbI₃ Perovskite / Si(004) Heterostructure',
    crystalSystem: 'Tetragonal',
    fwhmBroadeningDeg: 0.16,
    spectrumData: [
      { dSpacing: 6.2673, angleCu: 14.120, intensity: 100, hkl: '110', phaseNote: 'MAPbI₃ Perovskite α-Phase' },
      { dSpacing: 3.1347, angleCu: 28.450, intensity: 84, hkl: '220', phaseNote: 'Second-Order Perovskite' },
      { dSpacing: 2.8049, angleCu: 31.880, intensity: 30, hkl: '310', phaseNote: 'Tetragonal Splitting Check' },
      { dSpacing: 2.5976, angleCu: 34.500, intensity: 22, hkl: '002', phaseNote: 'Wurtzite GaN Buffer' },
      { dSpacing: 1.3577, angleCu: 69.130, intensity: 95, hkl: '400', phaseNote: 'Single-Crystal Si(001) Wafer' }
    ],
    graphicType: 'semicon'
  }
];

interface WhyXrdDisciplinePageProps {
  onProceedToWelcome: () => void;
  onEnterLabDirect: (targetModule?: string) => void;
  onOpenDisciplineModule?: (moduleId: string, samplePayload?: DisciplineSamplePayload) => void;
  onBackToApp?: () => void;
}

export const WhyXrdDisciplinePage: React.FC<WhyXrdDisciplinePageProps> = ({
  onProceedToWelcome,
  onEnterLabDirect,
  onOpenDisciplineModule,
  onBackToApp
}) => {
  const [viewMode, setViewMode] = useState<'infographic' | 'matrix' | 'poster'>('infographic');
  const [activeDisciplineId, setActiveDisciplineId] = useState<string>('physics');
  const [modalDiscipline, setModalDiscipline] = useState<DisciplineInfo | null>(null);
  const [activeAnodeId, setActiveAnodeId] = useState<string>('Cu');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [posterLoadFailed, setPosterLoadFailed] = useState<boolean>(false);
  const [posterZoom, setPosterZoom] = useState<number>(1);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('xrd_skip_why_xrd_intro') === 'true';
  });

  const activeDiscipline = useMemo(
    () => DISCIPLINES.find((d) => d.id === activeDisciplineId) || DISCIPLINES[0],
    [activeDisciplineId]
  );

  const activeAnode = useMemo(
    () => XRAY_ANODES.find((a) => a.id === activeAnodeId) || XRAY_ANODES[0],
    [activeAnodeId]
  );

  // Reset selected peak index if out of bounds when switching disciplines
  useEffect(() => {
    if (selectedPeakIdx >= activeDiscipline.spectrumData.length) {
      setSelectedPeakIdx(0);
    }
  }, [activeDiscipline, selectedPeakIdx]);

  // Recalculate 2theta positions dynamically for the active X-ray anode wavelength via Bragg's Law: sin(theta) = lambda / (2d)
  const recalculatedReflections = useMemo(() => {
    const lambda = activeAnode.wavelength;
    return activeDiscipline.spectrumData
      .map((ref) => {
        const sinTheta = lambda / (2 * ref.dSpacing);
        const reachable = sinTheta > 0 && sinTheta < 0.995;
        const twoTheta = reachable ? (2 * Math.asin(sinTheta) * 180) / Math.PI : null;
        const qVec = (2 * Math.PI) / ref.dSpacing;
        return {
          ...ref,
          twoTheta: twoTheta ?? ref.angleCu,
          reachable,
          qVec
        };
      })
      .filter((r) => r.reachable);
  }, [activeDiscipline, activeAnode]);

  const focusedReflection =
    recalculatedReflections[selectedPeakIdx] || recalculatedReflections[0];

  // Generate continuous pseudo-Voigt SVG path across 10° to 95° 2theta
  const continuousProfilePoints = useMemo(() => {
    const min2T = 10;
    const max2T = 95;
    const steps = 170;
    const fwhm = activeDiscipline.fwhmBroadeningDeg * (activeAnode.wavelength / 1.5406);
    const gamma = Math.max(0.12, fwhm / 2);
    const isPharma = activeDiscipline.id === 'pharma';

    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t2 = min2T + (i / steps) * (max2T - min2T);
      // Baseline + optional amorphous halo for Pharma
      let intensity = 2.0;
      if (isPharma) {
        intensity += 12 * Math.exp(-Math.pow((t2 - 21.5) / 8.5, 2));
      }

      for (const pk of recalculatedReflections) {
        const dx = t2 - pk.twoTheta;
        // Pseudo-Voigt (50% Gaussian + 50% Lorentzian)
        const gauss = Math.exp(-0.6931 * Math.pow(dx / gamma, 2));
        const lorentz = 1 / (1 + Math.pow(dx / gamma, 2));
        intensity += pk.intensity * (0.55 * gauss + 0.45 * lorentz);
      }

      const clampedInt = Math.min(108, intensity);
      const xSvg = 24 + ((t2 - min2T) / (max2T - min2T)) * 316;
      const ySvg = 92 - (clampedInt / 110) * 76;
      pts.push(`${i === 0 ? 'M' : 'L'} ${xSvg.toFixed(1)},${ySvg.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [recalculatedReflections, activeDiscipline, activeAnode]);

  const handleToggleDontShowAgain = (val: boolean) => {
    setDontShowAgain(val);
    localStorage.setItem('xrd_skip_why_xrd_intro', val ? 'true' : 'false');
    playSynthTone('switch');
  };

  const buildSamplePayload = (disc: DisciplineInfo): DisciplineSamplePayload => {
    const lambda = activeAnode.wavelength;
    const peaksList = disc.spectrumData
      .map((r) => {
        const sinT = lambda / (2 * r.dSpacing);
        const angle =
          sinT > 0 && sinT < 0.995
            ? ((2 * Math.asin(sinT) * 180) / Math.PI).toFixed(3)
            : r.angleCu.toFixed(3);
        return `${angle}:${r.intensity}`;
      })
      .join(', ');
    const hklList = disc.spectrumData.map((r) => r.hkl).join(', ');
    return {
      sampleId: disc.samplePresetName,
      materialName: disc.samplePresetName,
      rawPeaks: peaksList,
      rawHKL: hklList,
      wavelength: lambda,
      crystalSystem: disc.crystalSystem
    };
  };

  const handleLaunchDisciplineModule = (disc: DisciplineInfo) => {
    playSynthTone('success');
    const payload = buildSamplePayload(disc);
    try {
      localStorage.setItem(
        'xrd_bragg_current',
        JSON.stringify({
          sampleId: payload.sampleId,
          materialName: payload.materialName,
          wavelength: payload.wavelength,
          rawPeaks: payload.rawPeaks,
          rawHKL: payload.rawHKL,
          crystalSystem: payload.crystalSystem,
          results: []
        })
      );
    } catch {}

    if (onOpenDisciplineModule) {
      onOpenDisciplineModule(disc.targetModule, payload);
    } else {
      onEnterLabDirect(disc.targetModule);
    }
  };

  // Keyboard shortcut ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalDiscipline) {
        setModalDiscipline(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalDiscipline]);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col relative selection:bg-cyan-400 selection:text-slate-950 font-sans overflow-x-hidden">
      {/* Subtle Precision Coordinate Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[640px] h-[440px] bg-blue-600/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-12 w-[480px] h-[480px] bg-cyan-500/8 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="relative z-20 border-b border-slate-800/90 bg-[#07090E]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single Brand Wordmark Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L19 6V14L12 18L5 14V6L12 2Z" />
              <path d="M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z" opacity="0.6" />
              <circle cx="12" cy="13" r="2" fill="currentColor" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Beyond The Material
          </span>
        </div>

        {/* Zone 2: Clean Single-Line View Mode Navigation */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setViewMode('infographic');
              playSynthTone('switch');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'infographic'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>1. Interactive Discipline Atlas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('matrix');
              playSynthTone('switch');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>2. Cross-Discipline Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('poster');
              playSynthTone('switch');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'poster'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3. Lecture 11 Reference Poster</span>
          </button>
        </nav>

        {/* Zone 3: Primary Studio Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              playSynthTone('chime');
              onProceedToWelcome();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Welcome Tour</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playSynthTone('success');
              onEnterLabDirect();
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Enter XRD-Calc Pro</span>
          </button>
        </div>
      </header>

      {/* Mobile View Mode Switcher */}
      <div className="md:hidden relative z-10 px-4 pt-3 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setViewMode('infographic')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border ${
            viewMode === 'infographic'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          1. Discipline Atlas
        </button>
        <button
          type="button"
          onClick={() => setViewMode('matrix')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border ${
            viewMode === 'matrix'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          2. Equation Matrix
        </button>
        <button
          type="button"
          onClick={() => setViewMode('poster')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border ${
            viewMode === 'poster'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          3. Lecture Poster
        </button>
      </div>

      {/* Main Content Area */}
      {viewMode === 'poster' ? (
        /* TAB 3: ORIGINAL POSTER HIGH-RES VIEWER WITH RESILIENT VECTOR FALLBACK */
        <main className="relative z-10 flex-1 p-4 sm:p-8 flex flex-col items-center max-w-7xl mx-auto w-full gap-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-6 w-full flex flex-col items-center">
            <div className="flex flex-wrap items-center justify-between w-full pb-4 border-b border-slate-800 mb-4 gap-3">
              <div>
                <div className="text-xs font-mono text-slate-400 mb-0.5">
                  Beyond The Material · Advanced XRD Video Lecture Series · Lecture 11
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  How XRD Helps in Different Disciplines — Reference Poster
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPosterZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono tabular-nums text-slate-300 px-2">
                  {Math.round(posterZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPosterZoom((z) => Math.min(2.0, Number((z + 0.25).toFixed(2))))}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPosterZoom(1)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('infographic')}
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Back to Interactive Atlas
                </button>
              </div>
            </div>

            <div className="w-full flex items-center justify-center bg-slate-950 rounded-xl overflow-auto border border-slate-800 p-4 min-h-[520px]">
              {!posterLoadFailed ? (
                <img
                  src="/assets/aistudio/Screenshot_2026-10-31-18-26-32-554_com.linkedin.android-edit_c2bce485.jpg"
                  alt="How XRD Helps in Different Disciplines - Beyond The Material Reference Lecture 11"
                  referrerPolicy="no-referrer"
                  onError={() => setPosterLoadFailed(true)}
                  style={{ transform: `scale(${posterZoom})`, transformOrigin: 'top center' }}
                  className="max-h-[78vh] w-auto object-contain rounded-lg transition-transform duration-200"
                />
              ) : (
                /* Zero-Broken-Image Vector Poster Fallback */
                <div
                  style={{ transform: `scale(${posterZoom})`, transformOrigin: 'top center' }}
                  className="w-full max-w-5xl bg-[#091122] border border-slate-700 rounded-2xl p-6 space-y-6 transition-transform duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-xs font-mono text-cyan-400">
                        Beyond The Material · Lecture 11 Digital Poster Reconstruction
                      </div>
                      <h3 className="text-2xl font-bold text-white mt-0.5">
                        How XRD Helps in Different Disciplines
                      </h3>
                    </div>
                    <div className="text-right font-mono text-xs text-amber-400">
                      nλ = 2d sinθ · Cu Kα (1.5406 Å)
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {DISCIPLINES.map((d) => {
                      const Icon = d.icon;
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            setActiveDisciplineId(d.id);
                            setViewMode('infographic');
                          }}
                          className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Icon className={`w-4 h-4 ${d.accentText}`} />
                              {d.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{d.indexNumber}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{d.description}</p>
                          <div className="text-[10px] font-mono text-cyan-400 pt-1 truncate">
                            {d.governingEquation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : viewMode === 'matrix' ? (
        /* TAB 2: CROSS-DISCIPLINE SCIENTIFIC MATRIX & EQUATION COMPARISON */
        <main className="relative z-10 flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-cyan-400">
                  Comparative Crystallographic Reference · 9 Scientific Domains
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Cross-Discipline Governing Equations, Observables &amp; Detection Limits
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Active Anode:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {XRAY_ANODES.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveAnodeId(a.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono tabular-nums cursor-pointer transition-colors ${
                        activeAnodeId === a.id
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {a.id} ({a.wavelength.toFixed(2)} Å)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-3">Discipline</th>
                    <th className="py-3 px-3">Primary Observable</th>
                    <th className="py-3 px-3">Governing Equation</th>
                    <th className="py-3 px-3">Resolution / Limit</th>
                    <th className="py-3 px-3">Reference Specimen</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {DISCIPLINES.map((disc) => {
                    const Icon = disc.icon;
                    const isSelected = disc.id === activeDisciplineId;
                    return (
                      <tr
                        key={disc.id}
                        onClick={() => setActiveDisciplineId(disc.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-900/90' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-3.5 px-3 font-semibold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono tabular-nums text-slate-500">
                              {disc.indexNumber}.
                            </span>
                            <Icon className={`w-4 h-4 ${disc.accentText} shrink-0`} />
                            <span>{disc.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 max-w-[220px]">
                          {disc.primaryObservable}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-cyan-300 tabular-nums">
                          {disc.governingEquation}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400 tabular-nums">
                          {disc.resolutionSpec}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {disc.samplePresetName}
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleLaunchDisciplineModule(disc)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Load &amp; Launch</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      ) : (
        /* TAB 1: INTERACTIVE DIGITAL STUDIO ATLAS & SYNCHRONIZED DIFFRACTOMETER */
        <main className="relative z-10 flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* TOP HERO BENCH: Headline + Live Anode Switcher + Interactive Crystal & Real-Time Diffractometer */}
          <section className="rounded-2xl bg-[#0B0F19] border border-slate-800 p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Left Headline & Context */}
              <div className="max-w-2xl space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-cyan-400 font-semibold">Beyond The Material</span>
                  <span aria-hidden="true">·</span>
                  <span>Advanced XRD Video Lecture Series (Lecture 11)</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">9 Scientific Domains</span>
                </div>
                <h1
                  className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
                  style={{ textWrap: 'balance' } as React.CSSProperties}
                >
                  How X-Ray Diffraction Solves Atomic Structure Across <span className="text-cyan-400">Nine Disciplines</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Because hard X-ray wavelengths (<span className="font-mono text-white">λ ≈ 0.5–2.3 Å</span>) match interatomic plane spacings (<span className="font-mono text-white">d_hkl</span>), coherent elastic scattering (<span className="font-mono text-cyan-300">nλ = 2d sinθ</span>) acts as a non-destructive atomic ruler. Select any discipline below to simulate its characteristic diffractogram, inspect its governing physics, or launch its dedicated solver with real reference data pre-loaded.
                </p>
              </div>

              {/* Right: Live X-Ray Anode Source Selector & Active Specimen Telemetry */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shrink-0 w-full lg:w-auto lg:min-w-[330px] space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Radiation Source (λ)</span>
                  <span className="text-cyan-400 tabular-nums">
                    E = {activeAnode.energyKeV.toFixed(3)} keV
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {XRAY_ANODES.map((anode) => {
                    const isSelected = anode.id === activeAnodeId;
                    return (
                      <button
                        key={anode.id}
                        type="button"
                        onClick={() => {
                          setActiveAnodeId(anode.id);
                          playSynthTone('switch');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-center font-mono transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs">{anode.label}</div>
                        <div className="text-[10px] tabular-nums opacity-80">
                          {anode.wavelength.toFixed(4)} Å
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Active Specimen:</span>
                  <span className="text-white font-semibold truncate ml-2">
                    {activeDiscipline.samplePresetName}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive 3-Stage Diffraction Physics Bench synchronized with Active Discipline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pt-4 border-t border-slate-800">
              {/* Stage 1: Incident Monochromatic X-Ray Wave + Bragg Geometry (3 Cols) */}
              <div className="lg:col-span-3 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>01. Incident Beam</span>
                  <span className="text-cyan-400 tabular-nums">λ = {activeAnode.wavelength.toFixed(4)} Å</span>
                </div>

                <svg className="w-full h-24 my-1" viewBox="0 0 220 75" fill="none">
                  {/* Monochromatic wave train */}
                  <path
                    d={(() => {
                      const freq = 2.8 / activeAnode.wavelength;
                      let d = 'M 8,38';
                      for (let x = 8; x <= 212; x += 3) {
                        const y = 38 + 13 * Math.sin(((x - 8) * freq * Math.PI) / 18);
                        d += ` L ${x},${y.toFixed(1)}`;
                      }
                      return d;
                    })()}
                    stroke="#22d3ee"
                    strokeWidth="2.2"
                    fill="none"
                  />
                  <path
                    d={(() => {
                      const freq = 2.8 / activeAnode.wavelength;
                      let d = 'M 8,22';
                      for (let x = 8; x <= 212; x += 3) {
                        const y = 22 + 8 * Math.sin(((x - 8) * freq * Math.PI) / 18);
                        d += ` L ${x},${y.toFixed(1)}`;
                      }
                      return d;
                    })()}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.55"
                    fill="none"
                  />
                  <line x1="8" y1="62" x2="212" y2="62" stroke="#1e293b" strokeWidth="1" />
                  <text x="12" y="72" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    {activeAnode.note}
                  </text>
                </svg>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Crystal System:</span>
                  <span className="text-slate-200 font-semibold">{activeDiscipline.crystalSystem}</span>
                </div>
              </div>

              {/* Stage 2: Periodic Crystal Lattice & Active (hkl) Plane Reflection (4 Cols) */}
              <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>02. Bragg Reflection ({focusedReflection?.hkl || '111'})</span>
                  <span className="text-amber-400 tabular-nums">
                    d = {focusedReflection ? focusedReflection.dSpacing.toFixed(4) : '3.1355'} Å
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 my-1">
                  {/* Interactive Ray-Lattice Diagram */}
                  <svg className="w-36 h-24 shrink-0" viewBox="0 0 150 90" fill="none">
                    {/* Parallel atomic planes */}
                    {[28, 52, 76].map((y, rowIdx) => (
                      <g key={rowIdx}>
                        <line
                          x1="14"
                          y1={y}
                          x2="136"
                          y2={y}
                          stroke="#334155"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />
                        {[24, 49, 75, 101, 126].map((x, colIdx) => (
                          <circle
                            key={colIdx}
                            cx={x}
                            cy={y}
                            r={rowIdx === 1 && colIdx === 2 ? 4.5 : 3}
                            fill={rowIdx === 1 && colIdx === 2 ? '#facc15' : '#38bdf8'}
                          />
                        ))}
                      </g>
                    ))}
                    {/* Incident and diffracted beams */}
                    <line x1="16" y1="10" x2="75" y2="52" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="75" y1="52" x2="134" y2="10" stroke="#facc15" strokeWidth="2" />
                    {/* Path difference triangle */}
                    <polygon
                      points="75,28 65,45 75,52 85,45"
                      fill="#facc15"
                      fillOpacity="0.22"
                      stroke="#facc15"
                      strokeWidth="1"
                    />
                    <text x="16" y="22" fill="#22d3ee" fontSize="8.5" fontFamily="monospace">
                      θ = {focusedReflection ? (focusedReflection.twoTheta / 2).toFixed(2) : '14.22'}°
                    </text>
                  </svg>

                  {/* Live Bragg Telemetry Readout */}
                  <div className="flex-1 space-y-1.5 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">2θ Angle:</span>
                      <span className="text-cyan-400 font-bold tabular-nums">
                        {focusedReflection ? `${focusedReflection.twoTheta.toFixed(3)}°` : '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Vector Q:</span>
                      <span className="text-slate-200 font-bold tabular-nums">
                        {focusedReflection ? `${focusedReflection.qVec.toFixed(3)} Å⁻¹` : '—'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">FWHM β:</span>
                      <span className="text-amber-400 font-bold tabular-nums">
                        {activeDiscipline.fwhmBroadeningDeg.toFixed(2)}°
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Reflection Note:</span>
                  <span className="text-slate-200 truncate ml-2">
                    {focusedReflection?.phaseNote || activeDiscipline.tagline}
                  </span>
                </div>
              </div>

              {/* Stage 3: Live Synchronized Pseudo-Voigt Diffractometer Monitor (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">
                    03. Live Diffractogram — {activeDiscipline.shortName}
                  </span>
                  <span className="text-[11px] text-cyan-400 tabular-nums">
                    Click any peak to inspect
                  </span>
                </div>

                {/* Interactive SVG Pseudo-Voigt Spectrum */}
                <div className="relative my-1.5 bg-[#050811] border border-slate-800/90 rounded-lg p-2">
                  <svg className="w-full h-28 overflow-visible" viewBox="0 0 350 105" fill="none">
                    {/* Horizontal grid lines */}
                    <line x1="24" y1="92" x2="340" y2="92" stroke="#334155" strokeWidth="1" />
                    <line x1="24" y1="54" x2="340" y2="54" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="24" y1="16" x2="340" y2="16" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Continuous Pseudo-Voigt Profile Curve */}
                    <path
                      d={continuousProfilePoints}
                      stroke={activeDiscipline.accentColor}
                      strokeWidth="1.8"
                      fill="none"
                    />

                    {/* Interactive Peak Markers & Labels */}
                    {recalculatedReflections.map((pk, idx) => {
                      const x = 24 + ((pk.twoTheta - 10) / 85) * 316;
                      const y = 92 - (pk.intensity / 110) * 76;
                      const isSelected = idx === selectedPeakIdx;
                      if (x < 24 || x > 342) return null;
                      return (
                        <g
                          key={`${pk.hkl}-${idx}`}
                          onClick={() => {
                            setSelectedPeakIdx(idx);
                            playSynthTone('tick');
                          }}
                          className="cursor-pointer group"
                        >
                          <line
                            x1={x}
                            y1={92}
                            x2={x}
                            y2={y}
                            stroke={isSelected ? '#facc15' : 'transparent'}
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={isSelected ? 4.5 : 3}
                            fill={isSelected ? '#facc15' : '#38bdf8'}
                          />
                          <text
                            x={x}
                            y={Math.max(11, y - 6)}
                            textAnchor="middle"
                            fill={isSelected ? '#facc15' : '#cbd5e1'}
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                          >
                            ({pk.hkl})
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis Tick Labels */}
                    {[10, 25, 40, 55, 70, 85, 95].map((deg) => {
                      const x = 24 + ((deg - 10) / 85) * 316;
                      return (
                        <text
                          key={deg}
                          x={x}
                          y="103"
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {deg}°
                        </text>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    Selected: <strong className="text-white">({focusedReflection?.hkl})</strong> at{' '}
                    <strong className="text-cyan-400 tabular-nums">
                      {focusedReflection?.twoTheta.toFixed(2)}° 2θ
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchDisciplineModule(activeDiscipline)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in {activeDiscipline.targetModuleLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 9 DISCIPLINE CARDS (5 on Row 1, 4 on Row 2 — Synchronized with Active Inspector) */}
          <section className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Select a Scientific Discipline to Inspect &amp; Simulate
                </h2>
                <p className="text-xs text-slate-400">
                  Click any discipline card to update the live diffractometer above and inspect its equations, parameters, and reference reflections below.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 tabular-nums">
                Active: <strong className="text-white">{activeDiscipline.indexNumber}. {activeDiscipline.name}</strong>
              </div>
            </div>

            {/* Row 1: First 5 Disciplines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {DISCIPLINES.slice(0, 5).map((disc) => {
                const IconComponent = disc.icon;
                const isSelected = disc.id === activeDisciplineId;
                return (
                  <div
                    key={disc.id}
                    onClick={() => {
                      setActiveDisciplineId(disc.id);
                      setSelectedPeakIdx(0);
                      playSynthTone('chime');
                    }}
                    className={`rounded-2xl border overflow-hidden bg-[#0B0F19] transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg'
                        : `border-slate-800 ${disc.cardHoverBorder}`
                    }`}
                  >
                    {/* Header Ribbon */}
                    <div
                      className={`${disc.headerBg} px-3.5 py-2.5 flex items-center justify-between gap-2 text-white border-b ${disc.headerBorder}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <h3 className="font-sans font-bold text-xs tracking-tight truncate">
                          {disc.indexNumber}. {disc.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-cyan-300 shrink-0">Active</span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                      {/* Domain-Authentic Scientific Vector Schematic */}
                      <div className="w-full h-24 rounded-xl bg-slate-950 border border-slate-800/80 p-2 flex items-center justify-center relative overflow-hidden">
                        {disc.graphicType === 'physics' && (
                          <svg className="w-full h-full" viewBox="0 0 140 70" fill="none">
                            <rect x="14" y="18" width="32" height="32" stroke="#3b82f6" strokeWidth="1.5" />
                            <rect x="28" y="8" width="32" height="32" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="2 2" />
                            <line x1="14" y1="18" x2="28" y2="8" stroke="#3b82f6" strokeWidth="1.2" />
                            <line x1="46" y1="18" x2="60" y2="8" stroke="#3b82f6" strokeWidth="1.2" />
                            <line x1="46" y1="50" x2="60" y2="40" stroke="#3b82f6" strokeWidth="1.2" />
                            <line x1="14" y1="50" x2="28" y2="40" stroke="#3b82f6" strokeWidth="1.2" />
                            <circle cx="37" cy="29" r="3.5" fill="#facc15" />
                            <path d="M 74,56 L 86,56 L 90,14 L 94,56 L 108,56 L 112,28 L 116,56 L 132,56" stroke="#38bdf8" strokeWidth="1.6" />
                            <text x="76" y="14" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">(111)</text>
                          </svg>
                        )}

                        {disc.graphicType === 'chemistry' && (
                          <svg className="w-full h-full" viewBox="0 0 140 70" fill="none">
                            {/* TiO2 Octahedral Polymorph Comparison */}
                            <polygon points="36,10 56,35 36,60 16,35" stroke="#10b981" strokeWidth="1.5" fill="#10b981" fillOpacity="0.12" />
                            <line x1="16" y1="35" x2="56" y2="35" stroke="#34d399" strokeWidth="1.2" strokeDasharray="2 2" />
                            <circle cx="36" cy="35" r="4" fill="#facc15" />
                            <circle cx="36" cy="10" r="3" fill="#ef4444" />
                            <circle cx="36" cy="60" r="3" fill="#ef4444" />
                            <circle cx="16" cy="35" r="3" fill="#ef4444" />
                            <circle cx="56" cy="35" r="3" fill="#ef4444" />
                            <text x="72" y="24" fill="#34d399" fontSize="8" fontFamily="monospace">Anatase (101)</text>
                            <text x="72" y="38" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">vs. Rutile (110)</text>
                            <path d="M 72,56 L 86,56 L 90,42 L 94,56 L 102,56 L 106,45 L 110,56 L 130,56" stroke="#10b981" strokeWidth="1.5" />
                          </svg>
                        )}

                        {disc.graphicType === 'materials' && (
                          <svg className="w-full h-full" viewBox="0 0 140 70" fill="none">
                            {/* Rietveld Obs vs Calc + Difference Curve */}
                            <path d="M 10,44 L 30,44 L 36,12 L 42,44 L 68,44 L 74,20 L 80,44 L 106,44 L 112,24 L 118,44 L 132,44" stroke="#a855f7" strokeWidth="1.6" />
                            <circle cx="36" cy="12" r="2" fill="#facc15" />
                            <circle cx="74" cy="20" r="2" fill="#facc15" />
                            <circle cx="112" cy="24" r="2" fill="#facc15" />
                            {/* Residual difference line */}
                            <path d="M 10,60 L 34,60 L 36,57 L 38,63 L 40,60 L 72,60 L 74,58 L 76,62 L 132,60" stroke="#64748b" strokeWidth="1.1" />
                            <text x="12" y="14" fill="#c084fc" fontSize="7.5" fontFamily="monospace">R_wp = 1.84%</text>
                          </svg>
                        )}

                        {disc.graphicType === 'nano' && (
                          <svg className="w-full h-full" viewBox="0 0 140 70" fill="none">
                            {/* Bulk sharp peak vs Nanocrystal broadened peak */}
                            <path d="M 16,58 C 42,58 52,58 64,50 C 70,42 72,24 75,24 C 78,24 80,42 86,50 C 98,58 108,58 132,58" stroke="#14b8a6" strokeWidth="2" fill="#14b8a6" fillOpacity="0.15" />
                            <path d="M 55,58 L 71,58 L 75,10 L 79,58 L 95,58" stroke="#94a3b8" strokeWidth="1.1" strokeDasharray="2 2" />
                            <line x1="65" y1="38" x2="85" y2="38" stroke="#facc15" strokeWidth="1.5" />
                            <text x="14" y="18" fill="#2dd4bf" fontSize="7.5" fontFamily="monospace">D = 18 nm</text>
                            <text x="14" y="29" fill="#facc15" fontSize="7.5" fontFamily="monospace">β_1/2 Broad</text>
                          </svg>
                        )}

                        {disc.graphicType === 'metallurgy' && (
                          <svg className="w-full h-full" viewBox="0 0 140 70" fill="none">
                            {/* sin²ψ Linear Regression Plot */}
                            <line x1="20" y1="56" x2="128" y2="56" stroke="#475569" strokeWidth="1.2" />
                            <line x1="20" y1="12" x2="20" y2="56" stroke="#475569" strokeWidth="1.2" />
                            <line x1="26" y1="48" x2="120" y2="18" stroke="#f59e0b" strokeWidth="1.8" />
                            {[
                              [32, 46],
                              [54, 39],
                              [76, 32],
                              [98, 25],
                              [116, 19]
                            ].map(([cx, cy], i) => (
                              <circle key={i} cx={cx} cy={cy} r="2.8" fill="#facc15" />
                            ))}
                            <text x="26" y="16" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">d vs. sin²ψ</text>
                            <text x="72" y="51" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">σ_φ = +420 MPa</text>
                          </svg>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-snug">
                        {disc.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate">{disc.samplePresetName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 2: Remaining 4 Disciplines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {DISCIPLINES.slice(5, 9).map((disc) => {
                const IconComponent = disc.icon;
                const isSelected = disc.id === activeDisciplineId;
                return (
                  <div
                    key={disc.id}
                    onClick={() => {
                      setActiveDisciplineId(disc.id);
                      setSelectedPeakIdx(0);
                      playSynthTone('chime');
                    }}
                    className={`rounded-2xl border overflow-hidden bg-[#0B0F19] transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg'
                        : `border-slate-800 ${disc.cardHoverBorder}`
                    }`}
                  >
                    {/* Header Ribbon */}
                    <div
                      className={`${disc.headerBg} px-3.5 py-2.5 flex items-center justify-between gap-2 text-white border-b ${disc.headerBorder}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <h3 className="font-sans font-bold text-xs tracking-tight truncate">
                          {disc.indexNumber}. {disc.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-cyan-300 shrink-0">Active</span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                      <div className="w-full h-24 rounded-xl bg-slate-950 border border-slate-800/80 p-2 flex items-center justify-center relative overflow-hidden">
                        {disc.graphicType === 'geology' && (
                          <svg className="w-full h-full" viewBox="0 0 160 70" fill="none">
                            {/* Phyllosilicate Clay Layers + Quartz/Calcite Peaks */}
                            <line x1="14" y1="20" x2="62" y2="20" stroke="#eab308" strokeWidth="2" />
                            <line x1="14" y1="44" x2="62" y2="44" stroke="#eab308" strokeWidth="2" />
                            <line x1="38" y1="22" x2="38" y2="42" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
                            <text x="14" y="58" fill="#facc15" fontSize="7.5" fontFamily="monospace">d(001) = 14.2 Å</text>
                            <path d="M 76,56 L 90,56 L 95,12 L 100,56 L 112,56 L 117,20 L 122,56 L 148,56" stroke="#eab308" strokeWidth="1.6" />
                            <text x="86" y="11" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">Qtz / Cal</text>
                          </svg>
                        )}

                        {disc.graphicType === 'pharma' && (
                          <svg className="w-full h-full" viewBox="0 0 160 70" fill="none">
                            {/* Sharp API Polymorph Peaks over Amorphous Halo */}
                            <path d="M 14,58 Q 78,34 146,58" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" fill="#ec4899" fillOpacity="0.08" />
                            <path d="M 14,58 L 32,58 L 36,24 L 40,54 L 54,52 L 58,14 L 62,50 L 82,48 L 86,18 L 90,50 L 112,52 L 116,26 L 120,55 L 146,58" stroke="#ec4899" strokeWidth="1.6" />
                            <text x="16" y="14" fill="#f472b6" fontSize="7.5" fontFamily="monospace">Form I API · 96.4% Cryst</text>
                          </svg>
                        )}

                        {disc.graphicType === 'enviro' && (
                          <svg className="w-full h-full" viewBox="0 0 160 70" fill="none">
                            {/* Ag Membrane Filter Debye Rings + Quartz 26.64° Peak */}
                            <circle cx="38" cy="35" r="22" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="3 2" />
                            <circle cx="38" cy="35" r="14" stroke="#4ade80" strokeWidth="1.5" />
                            <circle cx="38" cy="35" r="6" stroke="#86efac" strokeWidth="1.2" />
                            <path d="M 76,56 L 94,56 L 98,34 L 102,56 L 116,56 L 121,12 L 126,56 L 148,56" stroke="#22c55e" strokeWidth="1.6" />
                            <text x="76" y="14" fill="#4ade80" fontSize="7.5" fontFamily="monospace">NIOSH 7500 SiO₂</text>
                          </svg>
                        )}

                        {disc.graphicType === 'semicon' && (
                          <svg className="w-full h-full" viewBox="0 0 160 70" fill="none">
                            {/* XRR Kiessig Interference Fringes */}
                            <path
                              d="M 14,14 L 32,14 C 38,14 42,26 48,28 C 54,22 58,34 64,36 C 70,30 74,42 80,44 C 86,38 90,49 96,51 C 102,46 106,55 112,56 C 118,52 124,58 146,59"
                              stroke="#38bdf8"
                              strokeWidth="1.7"
                              fill="none"
                            />
                            <text x="52" y="16" fill="#38bdf8" fontSize="7.5" fontFamily="monospace">Δq_z = 2π / t_film</text>
                            <text x="52" y="27" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">HRXRD / XRR Fringes</text>
                          </svg>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-snug">
                        {disc.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate">{disc.samplePresetName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* INLINE DISCIPLINE DEEP-DIVE WORKBENCH (No Popup Required, Instant Inspection & Launch) */}
          <section className="rounded-2xl bg-[#0B0F19] border border-slate-800 overflow-hidden shadow-xl">
            {/* Inspector Header */}
            <div className={`${activeDiscipline.headerBg} px-6 py-4 border-b ${activeDiscipline.headerBorder} flex flex-wrap items-center justify-between gap-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-white/15 flex items-center justify-center text-white">
                  <activeDiscipline.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-slate-300">
                    Discipline {activeDiscipline.indexNumber} of 09 · {activeDiscipline.tagline}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {activeDiscipline.name} — Quantitative XRD Protocol &amp; Specimen Data
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalDiscipline(activeDiscipline)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Reference Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchDisciplineModule(activeDiscipline)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <span>Load {activeDiscipline.samplePresetName} &amp; Open Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3-Column Scientific Breakdown */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 5 Cols: Physical Principle & Governing Equation */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1.5">
                    Physical Principle &amp; Analytical Necessity
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeDiscipline.detailedWhy}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Governing Mathematical Relation</span>
                    <span className="text-amber-400">{activeDiscipline.resolutionSpec}</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-cyan-300 py-1 overflow-x-auto">
                    {activeDiscipline.governingEquation}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 leading-snug">
                    {activeDiscipline.equationVariables}
                  </div>
                </div>

                {/* Key Parameters & Typical Specimens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-2">
                    <div className="text-[11px] font-mono font-semibold text-slate-300">
                      Core Measured Parameters
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeDiscipline.keyParameters.map((param, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-2">
                    <div className="text-[11px] font-mono font-semibold text-slate-300">
                      Benchmark Specimens
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeDiscipline.typicalSamples.map((samp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CircleDot className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{samp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: Interactive Specimen Reflection Table (Recalculated at Active Anode λ) */}
              <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Reference Diffraction Table · Recalculated for {activeAnode.label} (λ = {activeAnode.wavelength.toFixed(4)} Å)
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {activeDiscipline.samplePresetName} ({activeDiscipline.crystalSystem})
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 tabular-nums">
                    {recalculatedReflections.length} Diagnostic Reflections
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="py-2 px-2.5">(hkl)</th>
                        <th className="py-2 px-2.5">d-Spacing (Å)</th>
                        <th className="py-2 px-2.5">2θ ({activeAnode.id} Kα)</th>
                        <th className="py-2 px-2.5">Q (Å⁻¹)</th>
                        <th className="py-2 px-2.5">Rel. Int (%)</th>
                        <th className="py-2 px-2.5 font-sans">Structural Assignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {recalculatedReflections.map((ref, idx) => {
                        const isFocused = idx === selectedPeakIdx;
                        return (
                          <tr
                            key={`${ref.hkl}-${idx}`}
                            onClick={() => {
                              setSelectedPeakIdx(idx);
                              playSynthTone('tick');
                            }}
                            className={`cursor-pointer transition-colors ${
                              isFocused
                                ? 'bg-cyan-500/15 text-white'
                                : 'text-slate-300 hover:bg-slate-900/80'
                            }`}
                          >
                            <td className="py-2.5 px-2.5 font-bold text-cyan-400">
                              ({ref.hkl})
                            </td>
                            <td className="py-2.5 px-2.5">{ref.dSpacing.toFixed(4)}</td>
                            <td className="py-2.5 px-2.5 font-semibold text-white">
                              {ref.twoTheta.toFixed(3)}°
                            </td>
                            <td className="py-2.5 px-2.5 text-slate-400">
                              {ref.qVec.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-8">{ref.intensity}%</span>
                                <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{ width: `${ref.intensity}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 font-sans text-xs text-slate-400">
                              {ref.phaseNote}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">
                    Target Laboratory Module: <strong className="text-white">{activeDiscipline.targetModuleLabel}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchDisciplineModule(activeDiscipline)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Transfer {recalculatedReflections.length} Reflections to {activeDiscipline.targetModuleLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Bar with Startup Preference & Navigation */}
          <footer className="mt-2 p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => handleToggleDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <span>Skip this discipline overview automatically on future startups</span>
            </label>

            <div className="flex items-center gap-3">
              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                >
                  Return to Active Lab
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playSynthTone('chime');
                  onProceedToWelcome();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Welcome Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playSynthTone('success');
                  onEnterLabDirect();
                }}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Launch Studio Directly</span>
              </button>
            </div>
          </footer>
        </main>
      )}

      {/* EXPANDED DISCIPLINE REFERENCE MODAL */}
      <AnimatePresence>
        {modalDiscipline && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setModalDiscipline(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B0F19] border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div
                className={`${modalDiscipline.headerBg} p-5 border-b ${modalDiscipline.headerBorder} flex items-center justify-between text-white`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/15">
                    <modalDiscipline.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-300">
                      Discipline {modalDiscipline.indexNumber} · {modalDiscipline.tagline}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">
                      {modalDiscipline.name}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDiscipline(null)}
                  className="p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-cyan-400">
                    Why XRD Is Indispensable in {modalDiscipline.name}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    {modalDiscipline.detailedWhy}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Governing Equation</span>
                    <span className="text-amber-400">{modalDiscipline.resolutionSpec}</span>
                  </div>
                  <div className="text-sm font-bold text-cyan-300">
                    {modalDiscipline.governingEquation}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {modalDiscipline.equationVariables}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-semibold text-slate-300 block">
                      Core Measured Parameters
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {modalDiscipline.keyParameters.map((param, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-semibold text-slate-300 block">
                      Standard Tested Specimens
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {modalDiscipline.typicalSamples.map((samp, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CircleDot className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{samp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setModalDiscipline(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 cursor-pointer"
                >
                  Close Sheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = modalDiscipline;
                    setModalDiscipline(null);
                    handleLaunchDisciplineModule(target);
                  }}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>Load {modalDiscipline.samplePresetName} &amp; Launch {modalDiscipline.targetModuleLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
