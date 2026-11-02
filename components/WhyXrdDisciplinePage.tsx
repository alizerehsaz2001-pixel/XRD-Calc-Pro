import React, { useState, useEffect } from 'react';
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
  Sparkles, 
  Check, 
  X, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  BookOpen, 
  Play, 
  Eye, 
  Activity,
  Sliders,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

export interface DisciplineInfo {
  id: string;
  name: string;
  tagline: string;
  headerColor: string;
  headerBg: string;
  headerBorder: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  detailedWhy: string;
  keyParameters: string[];
  typicalSamples: string[];
  targetModule: string;
  samplePresetName: string;
  spectrumData: { angle: number; intensity: number; hkl: string }[];
  graphicType: 'physics' | 'chemistry' | 'materials' | 'nano' | 'metallurgy' | 'geology' | 'pharma' | 'enviro' | 'semicon';
}

const DISCIPLINES: DisciplineInfo[] = [
  {
    id: 'physics',
    name: 'Physics',
    tagline: 'Fundamental Condensed Matter',
    headerColor: '#1d4ed8',
    headerBg: 'bg-blue-700 dark:bg-blue-900',
    headerBorder: 'border-blue-500/80',
    cardBorder: 'hover:border-blue-500',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    icon: Atom,
    description: 'Crystal structures, lattice parameters, phase transitions',
    detailedWhy: 'XRD directly measures atomic plane separations (d-spacings) with sub-picometer accuracy via Bragg\'s Law (nλ = 2d sinθ). In condensed matter physics, it reveals reciprocal space topologies, Brillouin zone boundaries, structural phase transitions across temperature and pressure, and symmetry extinctions.',
    keyParameters: ['Lattice Parameters (a, b, c, α, β, γ)', 'Space Group Extinctions', 'Temperature-Dependent Phase Shifts', 'Order Parameters'],
    typicalSamples: ['Silicon (NIST SRM 640f)', 'Single-Crystal Superconductors (YBCO)', 'Ferroelectric Perovskites', 'Topological Insulators'],
    targetModule: 'bragg',
    samplePresetName: 'Silicon (NIST SRM 640f)',
    spectrumData: [
      { angle: 28.44, intensity: 100, hkl: '(111)' },
      { angle: 47.30, intensity: 55, hkl: '(220)' },
      { angle: 56.12, intensity: 30, hkl: '(311)' },
      { angle: 69.13, intensity: 8, hkl: '(400)' },
      { angle: 76.38, intensity: 12, hkl: '(331)' },
      { angle: 88.03, intensity: 16, hkl: '(422)' },
    ],
    graphicType: 'physics'
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    tagline: 'Inorganic & Solid-State Synthesis',
    headerColor: '#16a34a',
    headerBg: 'bg-emerald-700 dark:bg-emerald-900',
    headerBorder: 'border-emerald-500/80',
    cardBorder: 'hover:border-emerald-500',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    icon: FlaskConical,
    description: 'Identifying compounds, chemical phases, reaction products',
    detailedWhy: 'XRD provides an unambiguous "fingerprint" of crystalline solids. Unlike elemental spectroscopy (XRF/EDS) which only reveals element ratios, XRD distinguishes chemical polymorphs and phase mixtures (e.g., Rutile vs. Anatase TiO2, or graphite vs. diamond), confirming reaction completion and synthesis purity.',
    keyParameters: ['Phase Identification (PDF Cards)', 'Weight Fractions via RIR & Hill-Howard', 'Solid Solution Compositions (Vegard\'s Law)', 'Reaction Kinetics'],
    typicalSamples: ['TiO2 Polymorph Mixes', 'Zeolite Catalysts', 'Cathode Precursors (LiCoO2)', 'Coordination Polymers (MOFs)'],
    targetModule: 'selection',
    samplePresetName: 'Titanium Dioxide (Rutile/Anatase)',
    spectrumData: [
      { angle: 25.28, intensity: 100, hkl: '(101) Anatase' },
      { angle: 27.44, intensity: 75, hkl: '(110) Rutile' },
      { angle: 36.08, intensity: 45, hkl: '(101) Rutile' },
      { angle: 37.80, intensity: 20, hkl: '(004) Anatase' },
      { angle: 48.04, intensity: 35, hkl: '(200) Anatase' },
      { angle: 54.32, intensity: 60, hkl: '(211) Rutile' },
    ],
    graphicType: 'chemistry'
  },
  {
    id: 'materials',
    name: 'Materials Science',
    tagline: 'Structure–Property Relationships',
    headerColor: '#9333ea',
    headerBg: 'bg-purple-700 dark:bg-purple-900',
    headerBorder: 'border-purple-500/80',
    cardBorder: 'hover:border-purple-500',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    icon: Layers,
    description: 'Characterization, phases, structure–property relationships',
    detailedWhy: 'In materials engineering, macroscopic mechanical, thermal, and electronic properties stem directly from microscopic crystal structure. XRD enables full-profile Rietveld refinement to determine atomic coordinates, site occupancies, thermal Debye-Waller factors, and quantitative multi-phase fraction analysis.',
    keyParameters: ['Rietveld R-factors (Rwp, Rexp, GoF)', 'Atomic Fractional Coordinates', 'Site Occupancies & Vacancies', 'Quantitative Phase Abundance (wt%)'],
    typicalSamples: ['High-Entropy Alloys (HEA)', 'Advanced Ceramics (Al2O3, ZrO2)', 'Battery Anodes & Cathodes', 'Shape-Memory Alloys (Nitinol)'],
    targetModule: 'pawley_lebail',
    samplePresetName: 'Corundum / Alumina (NIST 676a)',
    spectrumData: [
      { angle: 25.58, intensity: 65, hkl: '(012)' },
      { angle: 35.15, intensity: 100, hkl: '(104)' },
      { angle: 37.78, intensity: 40, hkl: '(110)' },
      { angle: 43.35, intensity: 85, hkl: '(113)' },
      { angle: 52.55, intensity: 45, hkl: '(024)' },
      { angle: 57.50, intensity: 90, hkl: '(116)' },
    ],
    graphicType: 'materials'
  },
  {
    id: 'nano',
    name: 'Nanotechnology',
    tagline: 'Quantum Confinement & Nanocrystals',
    headerColor: '#0d9488',
    headerBg: 'bg-teal-700 dark:bg-teal-900',
    headerBorder: 'border-teal-500/80',
    cardBorder: 'hover:border-teal-500',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    icon: CircleDot,
    description: 'Crystallite size, microstrain, nanomaterials',
    detailedWhy: 'As crystallite domains shrink below 100 nm, diffraction peaks undergo pronounced broadening due to incomplete destructive interference. XRD harnesses peak profile line broadening (Scherrer equation D = Kλ/(β cosθ), Williamson-Hall plots, and Warren-Averbach deconvolution) to decouple crystallite size from lattice microstrain.',
    keyParameters: ['Apparent Crystallite Domain Size (D)', 'Root-Mean-Square Microstrain (ε)', 'Dislocation Density (ρ)', 'Shape Factor (K)'],
    typicalSamples: ['Zinc Oxide (ZnO) Quantum Dots', 'Magnetite (Fe3O4) Nanoparticles', 'Carbon Nanotubes / Graphene Flakes', 'Core-Shell Nanocrystals'],
    targetModule: 'scherrer',
    samplePresetName: 'Zinc Oxide Nanoparticles (20 nm)',
    spectrumData: [
      { angle: 31.77, intensity: 57, hkl: '(100) Broadened' },
      { angle: 34.42, intensity: 44, hkl: '(002) Broadened' },
      { angle: 36.25, intensity: 100, hkl: '(101) Broadened' },
      { angle: 47.54, intensity: 23, hkl: '(102) Broadened' },
      { angle: 56.60, intensity: 32, hkl: '(110) Broadened' },
      { angle: 62.86, intensity: 29, hkl: '(103) Broadened' },
    ],
    graphicType: 'nano'
  },
  {
    id: 'metallurgy',
    name: 'Metallurgy & Mechanical Eng.',
    tagline: 'Alloy Textures & Stress Fields',
    headerColor: '#ea580c',
    headerBg: 'bg-amber-700 dark:bg-amber-900',
    headerBorder: 'border-amber-500/80',
    cardBorder: 'hover:border-amber-500',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    icon: Cog,
    description: 'Metals, alloys, residual stress, phase transformations',
    detailedWhy: 'XRD is the industry standard for non-destructive surface and depth residual stress measurement using the sin²ψ method. By observing angular shifts in high-angle reflections under sample tilting (ψ), mechanical strain and principal stresses (tensile vs. compressive) are accurately calculated along with preferred crystal orientation (texture).',
    keyParameters: ['Residual Stress (σ via sin²ψ slope)', 'Retained Austenite Fraction (vol%)', 'Texture & Pole Figures', 'Grain Growth Kinetics'],
    typicalSamples: ['Shot-Peened Aerospace Turbine Blades', 'Welded Pipeline Joints', 'Cold-Rolled Sheet Steels', 'Additive Manufacturing Inconel 718'],
    targetModule: 'residual_stress',
    samplePresetName: 'Ferrite / Austenite Carbon Steel',
    spectrumData: [
      { angle: 44.67, intensity: 100, hkl: '(110) α-Fe' },
      { angle: 65.02, intensity: 20, hkl: '(200) α-Fe' },
      { angle: 82.33, intensity: 30, hkl: '(211) α-Fe' },
      { angle: 98.95, intensity: 10, hkl: '(220) α-Fe' },
      { angle: 116.4, intensity: 15, hkl: '(310) α-Fe' },
    ],
    graphicType: 'metallurgy'
  },
  {
    id: 'geology',
    name: 'Geology & Earth Sciences',
    tagline: 'Mineralogy & Petrology',
    headerColor: '#b45309',
    headerBg: 'bg-yellow-800 dark:bg-yellow-950',
    headerBorder: 'border-amber-600/80',
    cardBorder: 'hover:border-amber-600',
    badgeBg: 'bg-amber-600/20',
    badgeText: 'text-amber-300',
    icon: Mountain,
    description: 'Minerals, rocks, clays, geological samples',
    detailedWhy: 'Natural rocks consist of complex polyminerals and fine-grained clays (smectite, illite, kaolinite) that are impossible to differentiate with optical petrography alone. Powder XRD reliably identifies mineral species, solves solid-solution series (plagioclase, olivine), and maps geological formations.',
    keyParameters: ['Mineral Phase Identification', 'Clay Swelling & Glycolation Peaks', 'Solid Solution Ratio (Mg/Fe in Olivine)', 'Rock Modal Composition'],
    typicalSamples: ['Basalt & Granite Drill Cores', 'Bentonite & Montmorillonite Clays', 'Meteorite Chondrules', 'Gold & Copper Ore Tailings'],
    targetModule: 'database',
    samplePresetName: 'Quartz / Calcite Mineral Ore',
    spectrumData: [
      { angle: 20.86, intensity: 22, hkl: '(100) Quartz' },
      { angle: 26.64, intensity: 100, hkl: '(101) Quartz' },
      { angle: 29.40, intensity: 80, hkl: '(104) Calcite' },
      { angle: 36.54, intensity: 15, hkl: '(110) Quartz' },
      { angle: 39.46, intensity: 18, hkl: '(113) Calcite' },
      { angle: 50.14, intensity: 14, hkl: '(112) Quartz' },
    ],
    graphicType: 'geology'
  },
  {
    id: 'pharma',
    name: 'Pharmaceutical Sciences',
    tagline: 'Drug Polymorphism & Formulations',
    headerColor: '#db2777',
    headerBg: 'bg-pink-700 dark:bg-pink-950',
    headerBorder: 'border-pink-500/80',
    cardBorder: 'hover:border-pink-500',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    icon: Pill,
    description: 'Drug polymorphs, crystallinity in pharmaceuticals',
    detailedWhy: 'Different crystalline polymorphs of an Active Pharmaceutical Ingredient (API) exhibit vastly different dissolution rates, bioavailabilities, and shelf-life stabilities. Regulatory bodies (FDA, EMA) require strict XRD profiling to detect unwanted metastable polymorphic transitions and calculate amorphous-to-crystalline ratios.',
    keyParameters: ['Percent Crystallinity (% Crystallinity via Ruland)', 'Polymorphic Purity (% Form II in Form I)', 'Co-Crystal Formation Validation', 'Excipient-API Compatibility'],
    typicalSamples: ['Paracetamol (Forms I, II, III)', 'Aspirin Polymorphs', 'Amorphous Solid Dispersions (ASD)', 'Tableted Drug Products'],
    targetModule: 'fwhm',
    samplePresetName: 'Paracetamol Form I / II API',
    spectrumData: [
      { angle: 12.08, intensity: 45, hkl: 'Form I' },
      { angle: 15.62, intensity: 65, hkl: 'Form I' },
      { angle: 18.25, intensity: 100, hkl: 'Form I' },
      { angle: 23.45, intensity: 80, hkl: 'Form I' },
      { angle: 24.38, intensity: 55, hkl: 'Form I' },
      { angle: 26.50, intensity: 70, hkl: 'Form I' },
    ],
    graphicType: 'pharma'
  },
  {
    id: 'enviro',
    name: 'Environmental Science',
    tagline: 'Pollution Monitoring & Soils',
    headerColor: '#15803d',
    headerBg: 'bg-green-700 dark:bg-green-950',
    headerBorder: 'border-green-500/80',
    cardBorder: 'hover:border-green-500',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-300',
    icon: Leaf,
    description: 'Minerals and crystalline pollutants in environment',
    detailedWhy: 'Environmental health agencies mandate XRD for quantifying hazardous crystalline particulates such as respirable free crystalline silica (quartz and cristobalite per NIOSH Method 7500 / OSHA ID-142), asbestos fibers, fly ash contaminants, and heavy-metal precipitate speciation in contaminated agricultural soils.',
    keyParameters: ['Respirable Free Silica (Quartz) wt%', 'Asbestos Mineral Speciation (Chrysotile)', 'Heavy Metal Mineral Precipitates', 'Soil Carbon Sequestration Carbonates'],
    typicalSamples: ['Airborne Dust Filters (PM2.5 / PM10)', 'Mine Tailings & Smelter Fly Ash', 'Remediated Industrial Soils', 'Wastewater Precipitate Sludge'],
    targetModule: 'rir',
    samplePresetName: 'Respirable Dust / Airborne Silica',
    spectrumData: [
      { angle: 26.64, intensity: 100, hkl: 'Quartz α-SiO2' },
      { angle: 21.98, intensity: 40, hkl: 'Cristobalite' },
      { angle: 31.90, intensity: 35, hkl: 'Gypsum CaSO4' },
      { angle: 29.40, intensity: 50, hkl: 'Calcite CaCO3' },
      { angle: 12.35, intensity: 30, hkl: 'Kaolinite Clay' },
    ],
    graphicType: 'enviro'
  },
  {
    id: 'semicon',
    name: 'Semiconductors & Solar Cells',
    tagline: 'Epitaxy, Photovoltaics & 2D Devices',
    headerColor: '#0284c7',
    headerBg: 'bg-sky-700 dark:bg-sky-950',
    headerBorder: 'border-sky-500/80',
    cardBorder: 'hover:border-sky-500',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    icon: Cpu,
    description: 'Crystalline phases, structural quality, electronic and photovoltaic materials',
    detailedWhy: 'Modern microelectronics and high-efficiency solar cells rely on atomic-precision heteroepitaxy. High-Resolution XRD (HRXRD) and X-ray Reflectometry (XRR) measure thin-film thickness (0.5 to 100 nm), interface roughness, epitaxial lattice mismatch, relaxation, and perovskite phase purity for next-gen solar panels.',
    keyParameters: ['Film Thickness & Roughness (XRR Kiessig fringes)', 'Epitaxial Mismatch Strain (Δd/d)', 'Rocking Curve FWHM (Mosaic Spread)', 'Halide Perovskite Phase Purity'],
    typicalSamples: ['Silicon & Silicon Carbide Wafers', 'Perovskite Solar Absorbers (MAPbI3)', 'GaN on Sapphire HEMT Heterostructures', '2D Transition Metal Dichalcogenides (MoS2)'],
    targetModule: 'xrr',
    samplePresetName: 'Perovskite Photovoltaic / Si Wafer',
    spectrumData: [
      { angle: 14.12, intensity: 100, hkl: '(110) MAPbI3' },
      { angle: 28.45, intensity: 85, hkl: '(220) MAPbI3' },
      { angle: 31.88, intensity: 30, hkl: '(310) MAPbI3' },
      { angle: 69.13, intensity: 95, hkl: '(400) Si Substrate' },
      { angle: 34.50, intensity: 15, hkl: '(002) GaN' },
    ],
    graphicType: 'semicon'
  }
];

interface WhyXrdDisciplinePageProps {
  onProceedToWelcome: () => void;
  onEnterLabDirect: (targetModule?: string) => void;
  onOpenDisciplineModule?: (moduleId: string) => void;
  onBackToApp?: () => void;
}

export const WhyXrdDisciplinePage: React.FC<WhyXrdDisciplinePageProps> = ({
  onProceedToWelcome,
  onEnterLabDirect,
  onOpenDisciplineModule,
  onBackToApp
}) => {
  const [viewMode, setViewMode] = useState<'infographic' | 'poster'>('infographic');
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineInfo | null>(null);
  const [activePeakHover, setActivePeakHover] = useState<{ angle: number; intensity: number; hkl: string } | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('xrd_skip_why_xrd_intro') === 'true';
  });

  const handleToggleDontShowAgain = (val: boolean) => {
    setDontShowAgain(val);
    localStorage.setItem('xrd_skip_why_xrd_intro', val ? 'true' : 'false');
    playSynthTone('switch');
  };

  const handleLaunchModule = (moduleId: string) => {
    playSynthTone('success');
    if (onOpenDisciplineModule) {
      onOpenDisciplineModule(moduleId);
    } else {
      onEnterLabDirect(moduleId);
    }
  };

  // Keyboard shortcut ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDiscipline) {
        setSelectedDiscipline(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDiscipline]);

  return (
    <div className="min-h-screen bg-[#060A13] text-slate-100 flex flex-col relative selection:bg-yellow-400 selection:text-black font-sans overflow-x-hidden">
      
      {/* Dynamic Background Starfield / Radial Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-[160px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      {/* Top Banner Navigation Bar */}
      <header className="relative z-20 border-b border-white/10 bg-[#060A13]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#060A13] rounded-[10px] flex items-center justify-center text-cyan-400">
              {/* Three interconnected hexagon/benzene rings matching the logo in screenshot */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L19 6V14L12 18L5 14V6L12 2Z" />
                <path d="M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z" opacity="0.6" />
                <circle cx="12" cy="13" r="2" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-sans">
                Beyond The Material
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded">
                Special Edition
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider">
              Research &nbsp;|&nbsp; Materials &nbsp;|&nbsp; Science &nbsp;•&nbsp; XRD-Calc Pro
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => {
                setViewMode('infographic');
                playSynthTone('switch');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'infographic'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Interactive Studio</span>
            </button>
            <button
              onClick={() => {
                setViewMode('poster');
                playSynthTone('switch');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'poster'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original Poster</span>
            </button>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => {
              playSynthTone('chime');
              onProceedToWelcome();
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-400/50"
            title="Continue to the interactive Welcome Tour and Feature Highlights"
          >
            <span>Welcome Tour</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={() => {
              playSynthTone('success');
              onEnterLabDirect();
            }}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Jump directly to the main XRD calculation workbench"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Enter Lab</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'poster' ? (
        /* ORIGINAL POSTER HIGH-RES VIEWER */
        <main className="relative z-10 flex-1 p-4 sm:p-8 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">
          <div className="bg-[#0A101D] border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl w-full flex flex-col items-center">
            <div className="flex flex-wrap items-center justify-between w-full pb-4 border-b border-white/10 mb-4 gap-3">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>How XRD Helps in Different Disciplines</span>
                  <span className="text-xs font-mono font-normal text-slate-400 lowercase">(reference lecture poster)</span>
                </h2>
                <p className="text-xs text-slate-400">High-resolution scientific infographic from Beyond The Material • Video Lecture Series (Lecture 11)</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/assets/aistudio/Screenshot_2026-10-31-18-26-32-554_com.linkedin.android-edit_c2bce485.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Screen</span>
                </a>
                <button
                  onClick={() => setViewMode('infographic')}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  Switch to Interactive View
                </button>
              </div>
            </div>

            <div className="w-full flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden border border-white/10 p-2 sm:p-4">
              <img
                src="/assets/aistudio/Screenshot_2026-10-31-18-26-32-554_com.linkedin.android-edit_c2bce485.jpg"
                alt="How XRD Helps in Different Disciplines - Beyond The Material Reference Lecture 11"
                className="max-h-[82vh] w-auto object-contain rounded-xl shadow-2xl hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          </div>
        </main>
      ) : (
        /* INTERACTIVE DIGITAL STUDIO RECREATION */
        <main className="relative z-10 flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          {/* TOP HERO BANNER: Headline + Goniometer + 3D Crystal + Realtime Diffractometer Monitor */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#091122] via-[#0C152B] to-[#0A1124] border border-white/15 p-6 sm:p-8 shadow-2xl">
            
            {/* Top golden lecture badge in screenshot */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end z-20">
              <div className="relative group">
                <div className="px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-tight rounded-2xl shadow-xl flex items-center gap-2 border border-yellow-200/50">
                  <BookOpen className="w-4 h-4 text-slate-950" />
                  <span>Advanced XRD Video Lecture Series</span>
                </div>
                {/* Red Lecture 11 ribbon */}
                <div className="mt-1.5 self-end px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md border border-red-400/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Lecture 11</span>
                </div>
              </div>
            </div>

            {/* Main Headline & Description */}
            <div className="max-w-2xl z-10 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Foundational Analytics &amp; Cross-Discipline Impact</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-2">
                How XRD Helps <br className="hidden sm:inline" />
                in Different <span className="text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.45)]">Disciplines</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-xl mt-3">
                <strong className="text-white">Why X-Ray Diffraction (XRD)?</strong> Because X-ray wavelengths (~0.1 nm / 1 Å) perfectly match interatomic distances in crystals, allowing constructive interference (<em className="text-cyan-300 font-mono">nλ = 2d sinθ</em>) to non-destructively unveil atomic architectures, chemical polymorphs, crystallite domain size, and residual stresses across every modern science.
              </p>
            </div>

            {/* Central Animated Illustration matching screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-8 pt-6 border-t border-white/10">
              
              {/* Incoming X-Ray Wave */}
              <div className="lg:col-span-3 flex flex-col items-center justify-center p-3 bg-black/30 rounded-2xl border border-white/5 relative">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  X-rays (λ ≈ 1.54 Å)
                </span>
                <svg className="w-full h-16" viewBox="0 0 200 60" fill="none">
                  {/* Wave 1 */}
                  <path d="M 0,30 Q 25,10 50,30 T 100,30 T 150,30 T 200,30" stroke="#22d3ee" strokeWidth="2.5" fill="none" className="animate-pulse" />
                  <path d="M 0,20 Q 25,5 50,20 T 100,20 T 150,20 T 200,20" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.6" />
                  <path d="M 0,40 Q 25,25 50,40 T 100,40 T 150,40 T 200,40" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.6" />
                </svg>
                <span className="text-[10px] text-slate-400 font-mono">Monochromatic Cu-Kα source</span>
              </div>

              {/* 3D Crystalline Lattice Node */}
              <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-950/40 to-black/60 rounded-2xl border border-indigo-500/20 relative group">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Glowing spherical diffraction arcs */}
                  <div className="absolute inset-0 rounded-full border border-cyan-400/30 scale-100 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-2 rounded-full border border-dashed border-indigo-400/40 animate-spin" style={{ animationDuration: '20s' }} />
                  
                  {/* Cubic Unit Cell SVG with yellow and blue atoms matching screenshot */}
                  <svg className="w-28 h-28" viewBox="0 0 120 120" fill="none">
                    {/* Lattice coordinate bonds */}
                    <path d="M 30,35 L 75,35 L 75,80 L 30,80 Z" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" />
                    <path d="M 45,20 L 90,20 L 90,65 L 45,65 Z" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" strokeDasharray="2 2" />
                    <line x1="30" y1="35" x2="45" y2="20" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
                    <line x1="75" y1="35" x2="90" y2="20" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
                    <line x1="75" y1="80" x2="90" y2="65" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
                    <line x1="30" y1="80" x2="45" y2="65" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
                    
                    {/* Yellow and Blue atoms */}
                    {/* Back layer atoms */}
                    <circle cx="45" cy="20" r="5" fill="#facc15" />
                    <circle cx="90" cy="20" r="5" fill="#38bdf8" />
                    <circle cx="90" cy="65" r="5" fill="#facc15" />
                    <circle cx="45" cy="65" r="5" fill="#38bdf8" />
                    {/* Front layer atoms */}
                    <circle cx="30" cy="35" r="6" fill="#38bdf8" />
                    <circle cx="75" cy="35" r="6" fill="#facc15" />
                    <circle cx="75" cy="80" r="6" fill="#38bdf8" />
                    <circle cx="30" cy="80" r="6" fill="#facc15" />
                    {/* Center atom */}
                    <circle cx="60" cy="50" r="7" fill="#facc15" className="animate-pulse" />
                  </svg>
                </div>
                <span className="text-xs font-mono font-bold text-yellow-300 mt-1">Periodic Crystal Lattice</span>
                <span className="text-[10px] text-slate-400 font-mono">Bragg scattering planes (hkl)</span>
              </div>

              {/* Outgoing Diffraction Pattern Rays */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 bg-black/30 rounded-2xl border border-white/5 relative">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 text-center">
                  Diffraction Pattern
                </span>
                <svg className="w-full h-16" viewBox="0 0 160 60" fill="none">
                  {/* Divergent scattering beams */}
                  <path d="M 0,30 C 40,30 80,10 160,5" stroke="#38bdf8" strokeWidth="2" />
                  <path d="M 0,30 C 40,30 80,25 160,25" stroke="#22d3ee" strokeWidth="2.5" />
                  <path d="M 0,30 C 40,30 80,45 160,55" stroke="#818cf8" strokeWidth="2" />
                </svg>
                <span className="text-[10px] text-slate-400 font-mono text-center">Constructive Interference (2θ)</span>
              </div>

              {/* Lab Diffractometer Monitor Screen in screenshot */}
              <div className="lg:col-span-4 bg-[#050810] border-2 border-slate-700/80 rounded-2xl p-3.5 shadow-2xl relative font-mono text-left">
                {/* Monitor frame header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[10px] text-slate-400 font-bold ml-1">RIGAKU / BRUKER D8 XRD</span>
                  </div>
                  <span className="text-[9px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    LIVE SPECTRUM
                  </span>
                </div>

                {/* Diffractogram Plot Area */}
                <div className="relative h-28 w-full bg-black/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
                  {/* Y-Axis Label */}
                  <span className="text-[9px] text-slate-400 select-none">Intensity (a.u.)</span>

                  {/* SVG Diffractometer Spectrum */}
                  <svg className="w-full h-16" viewBox="0 0 240 60" fill="none">
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="240" y2="50" stroke="#1e293b" strokeWidth="1" />
                    <line x1="0" y1="25" x2="240" y2="25" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Diffractogram Curve with sharp peaks */}
                    <path
                      d="M 0,50 L 20,49 L 35,49 L 45,49 L 48,10 L 51,49 L 80,49 L 95,49 L 98,22 L 101,49 L 130,49 L 133,30 L 136,49 L 170,49 L 173,42 L 176,49 L 195,49 L 198,38 L 201,49 L 240,50"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      fill="none"
                    />

                    {/* Peak Highlight Points */}
                    <circle cx="48" cy="10" r="3" fill="#facc15" className="animate-ping" />
                    <circle cx="48" cy="10" r="2.5" fill="#facc15" />
                    <circle cx="98" cy="22" r="2.5" fill="#38bdf8" />
                    <circle cx="133" cy="30" r="2.5" fill="#38bdf8" />
                    <circle cx="173" cy="42" r="2.5" fill="#38bdf8" />
                    <circle cx="198" cy="38" r="2.5" fill="#38bdf8" />
                  </svg>

                  {/* X-Axis Numbers matching screenshot: 10, 20, 30, 40, 50, 60, 70, 80 */}
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono px-1">
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                    <span>60</span>
                    <span>70</span>
                    <span>80</span>
                  </div>
                  <div className="text-center text-[9px] text-slate-400 font-bold select-none">
                    2θ (degree)
                  </div>
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> Crystalline Peak Profile Verified
                  </span>
                  <span className="text-cyan-400">Cu Kα1 (1.5406 Å)</span>
                </div>
              </div>

            </div>
          </div>

          {/* 9 DISCIPLINE CARDS (Matching the Screenshot 5 on Row 1, 4 on Row 2) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>Explore Cross-Disciplinary Applications</span>
                </h2>
                <p className="text-xs text-slate-400">Click any discipline card to inspect parameters, view sample diffractograms, or launch the matching laboratory module.</p>
              </div>
              <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-xl hidden sm:flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>9 Disciplines Documented</span>
              </div>
            </div>

            {/* Row 1: 5 Cards (Physics, Chemistry, Materials Science, Nanotechnology, Metallurgy) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {DISCIPLINES.slice(0, 5).map((disc) => {
                const IconComponent = disc.icon;
                return (
                  <motion.div
                    key={disc.id}
                    whileHover={{ y: -4, transition: { duration: 0.15 } }}
                    onClick={() => {
                      setSelectedDiscipline(disc);
                      playSynthTone('chime');
                    }}
                    className={`rounded-2xl border border-white/10 overflow-hidden bg-[#0A101D] hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group ${disc.cardBorder}`}
                  >
                    {/* Header Ribbon with Icon */}
                    <div className={`${disc.headerBg} px-3.5 py-2.5 flex items-center gap-2 text-white border-b ${disc.headerBorder}`}>
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <h3 className="font-sans font-bold text-xs uppercase tracking-tight truncate">
                        {disc.name}
                      </h3>
                    </div>

                    {/* Visual Graphic Representation */}
                    <div className="p-3 bg-black/40 flex-1 flex flex-col justify-between">
                      {/* Stylized Miniature Graphic matching screenshot */}
                      <div className="w-full h-24 rounded-xl bg-slate-950/80 border border-white/5 p-2 flex items-center justify-center relative overflow-hidden group-hover:border-white/20 transition-colors">
                        {disc.graphicType === 'physics' && (
                          <div className="w-full h-full flex items-center justify-between px-1">
                            {/* Crystal lattice cube */}
                            <svg className="w-16 h-16" viewBox="0 0 60 60" fill="none">
                              <rect x="10" y="15" width="25" height="25" stroke="#3b82f6" strokeWidth="1.5" />
                              <rect x="22" y="8" width="25" height="25" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="2 2" />
                              <line x1="10" y1="15" x2="22" y2="8" stroke="#3b82f6" strokeWidth="1.2" />
                              <line x1="35" y1="15" x2="47" y2="8" stroke="#3b82f6" strokeWidth="1.2" />
                              <line x1="35" y1="40" x2="47" y2="33" stroke="#3b82f6" strokeWidth="1.2" />
                              <line x1="10" y1="40" x2="22" y2="33" stroke="#3b82f6" strokeWidth="1.2" />
                              <circle cx="22.5" cy="27.5" r="3" fill="#facc15" />
                            </svg>
                            {/* Peak profile */}
                            <svg className="w-16 h-14" viewBox="0 0 50 40" fill="none">
                              <path d="M 0,35 L 12,35 L 16,5 L 20,35 L 30,35 L 34,18 L 38,35 L 50,35" stroke="#60a5fa" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}

                        {disc.graphicType === 'chemistry' && (
                          <div className="w-full h-full flex items-center justify-center">
                            {/* Colorful molecular ball-and-stick model */}
                            <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                              <line x1="25" y1="25" x2="40" y2="40" stroke="#475569" strokeWidth="2.5" />
                              <line x1="55" y1="25" x2="40" y2="40" stroke="#475569" strokeWidth="2.5" />
                              <line x1="40" y1="40" x2="40" y2="60" stroke="#475569" strokeWidth="2.5" />
                              <line x1="40" y1="40" x2="62" y2="52" stroke="#475569" strokeWidth="2.5" />
                              <line x1="40" y1="40" x2="18" y2="52" stroke="#475569" strokeWidth="2.5" />
                              {/* Colored atoms */}
                              <circle cx="25" cy="25" r="7" fill="#ef4444" />
                              <circle cx="55" cy="25" r="7" fill="#3b82f6" />
                              <circle cx="40" cy="40" r="9" fill="#22c55e" />
                              <circle cx="40" cy="60" r="6" fill="#eab308" />
                              <circle cx="62" cy="52" r="6" fill="#a855f7" />
                              <circle cx="18" cy="52" r="6" fill="#06b6d4" />
                            </svg>
                          </div>
                        )}

                        {disc.graphicType === 'materials' && (
                          <div className="w-full h-full flex items-center justify-center gap-1.5">
                            {/* Metal ingots, cubes, and powder mounds */}
                            <div className="w-7 h-7 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-md shadow-md rotate-12" />
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-500 rounded-md shadow-md -rotate-6" />
                            <div className="w-6 h-6 bg-gradient-to-br from-rose-300 to-rose-600 rounded-full shadow-md" />
                          </div>
                        )}

                        {disc.graphicType === 'nano' && (
                          <div className="w-full h-full flex items-center justify-between px-2">
                            {/* Blue cluster nanoparticle sphere */}
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center p-1 shadow-inner">
                              <CircleDot className="w-7 h-7 text-white" />
                            </div>
                            {/* SEM Micrograph simulation with 20nm label */}
                            <div className="w-16 h-14 bg-slate-900 border border-slate-700 rounded p-1 flex flex-col justify-between">
                              <div className="grid grid-cols-4 gap-0.5 opacity-60">
                                {Array.from({ length: 8 }).map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400/80" />
                                ))}
                              </div>
                              <div className="border-t border-teal-400/80 pt-0.5 flex justify-between items-center text-[7px] text-teal-300 font-mono">
                                <span>— 20 nm</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {disc.graphicType === 'metallurgy' && (
                          <div className="w-full h-full flex items-center justify-center gap-2">
                            {/* Stacked alloy rods and gears */}
                            <div className="flex flex-col gap-1">
                              <div className="w-10 h-2 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-full" />
                              <div className="w-10 h-2 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-full" />
                              <div className="w-10 h-2 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-full" />
                            </div>
                            <Cog className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '15s' }} />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-300 leading-snug mt-2.5 font-sans min-h-[44px]">
                        {disc.description}
                      </p>

                      {/* Launch hint */}
                      <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-cyan-300 font-mono transition-colors">
                        <span>Inspect Details</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Row 2: 4 Cards (Geology & Earth Sciences, Pharmaceutical Sciences, Environmental Science, Semiconductors & Solar Cells) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {DISCIPLINES.slice(5, 9).map((disc) => {
                const IconComponent = disc.icon;
                return (
                  <motion.div
                    key={disc.id}
                    whileHover={{ y: -4, transition: { duration: 0.15 } }}
                    onClick={() => {
                      setSelectedDiscipline(disc);
                      playSynthTone('chime');
                    }}
                    className={`rounded-2xl border border-white/10 overflow-hidden bg-[#0A101D] hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group ${disc.cardBorder}`}
                  >
                    {/* Header Ribbon with Icon */}
                    <div className={`${disc.headerBg} px-3.5 py-2.5 flex items-center gap-2 text-white border-b ${disc.headerBorder}`}>
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <h3 className="font-sans font-bold text-xs uppercase tracking-tight truncate">
                        {disc.name}
                      </h3>
                    </div>

                    {/* Visual Graphic Representation */}
                    <div className="p-3 bg-black/40 flex-1 flex flex-col justify-between">
                      {/* Stylized Miniature Graphic matching screenshot */}
                      <div className="w-full h-24 rounded-xl bg-slate-950/80 border border-white/5 p-2 flex items-center justify-center relative overflow-hidden group-hover:border-white/20 transition-colors">
                        {disc.graphicType === 'geology' && (
                          <div className="w-full h-full flex items-center justify-between px-2">
                            {/* Mineral rock ores */}
                            <div className="flex gap-1.5 items-end">
                              <div className="w-8 h-8 bg-gradient-to-tr from-amber-900 via-stone-700 to-amber-600 rounded-sm shadow border border-amber-600/30 rotate-6" />
                              <div className="w-6 h-10 bg-gradient-to-tr from-stone-800 via-stone-600 to-stone-400 rounded-sm shadow border border-stone-500/30 -rotate-3" />
                            </div>
                            {/* Mineral diffractogram */}
                            <svg className="w-16 h-12" viewBox="0 0 50 40" fill="none">
                              <path d="M 0,35 L 8,35 L 12,12 L 16,35 L 24,35 L 28,6 L 32,35 L 50,35" stroke="#f59e0b" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}

                        {disc.graphicType === 'pharma' && (
                          <div className="w-full h-full flex items-center justify-between px-2">
                            {/* Medicine capsules and crystals */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-3 rounded-full bg-gradient-to-r from-pink-500 to-white shadow rotate-45" />
                              <div className="w-7 h-3 rounded-full bg-gradient-to-r from-red-500 to-white shadow -rotate-12" />
                            </div>
                            {/* Fingerprint spectrum */}
                            <svg className="w-18 h-12" viewBox="0 0 50 40" fill="none">
                              <path d="M 0,35 L 10,35 L 14,8 L 18,35 L 22,18 L 26,35 L 32,12 L 36,35 L 50,35" stroke="#ec4899" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}

                        {disc.graphicType === 'enviro' && (
                          <div className="w-full h-full flex items-center justify-between px-2">
                            {/* Soil cross-section with green sprout */}
                            <div className="flex items-center gap-1.5">
                              <Leaf className="w-8 h-8 text-emerald-400" />
                              <div className="h-10 w-4 bg-gradient-to-b from-stone-700 to-stone-900 rounded-sm" />
                            </div>
                            {/* Environmental spectrum */}
                            <svg className="w-18 h-12" viewBox="0 0 50 40" fill="none">
                              <path d="M 0,35 L 12,35 L 16,10 L 20,35 L 28,20 L 32,35 L 50,35" stroke="#22c55e" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}

                        {disc.graphicType === 'semicon' && (
                          <div className="w-full h-full flex items-center justify-between px-2">
                            {/* Solar panel photovoltaic grid */}
                            <div className="w-14 h-11 bg-blue-950 border border-blue-400/40 rounded grid grid-cols-3 grid-rows-2 gap-0.5 p-0.5">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-blue-600/70 rounded-xs" />
                              ))}
                            </div>
                            {/* Silicon wafer disc */}
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-900 via-sky-600 to-cyan-300 border border-cyan-400/50 shadow-md flex items-center justify-center">
                              <Cpu className="w-5 h-5 text-slate-900" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-300 leading-snug mt-2.5 font-sans min-h-[44px]">
                        {disc.description}
                      </p>

                      {/* Launch hint */}
                      <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-cyan-300 font-mono transition-colors">
                        <span>Inspect Details</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Bar with Navigation & Startup Toggle */}
          <div className="sticky bottom-4 z-30 mt-4 p-4 rounded-2xl bg-[#091122]/95 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
            
            {/* Startup preference checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => handleToggleDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Don't show this discipline overview page automatically on next startup</span>
            </label>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              {onBackToApp && (
                <button
                  onClick={onBackToApp}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
                >
                  Return to Active Lab
                </button>
              )}

              <button
                onClick={() => {
                  playSynthTone('chime');
                  onProceedToWelcome();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Continue to Welcome Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playSynthTone('success');
                  onEnterLabDirect();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Launch Studio Directly</span>
              </button>
            </div>
          </div>

        </main>
      )}

      {/* DISCIPLINE DETAIL MODAL / DRAWER */}
      <AnimatePresence>
        {selectedDiscipline && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedDiscipline(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A1224] border border-white/20 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className={`${selectedDiscipline.headerBg} p-6 border-b ${selectedDiscipline.headerBorder} flex items-center justify-between text-white`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <selectedDiscipline.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest opacity-80">
                      Discipline Focus &nbsp;•&nbsp; {selectedDiscipline.tagline}
                    </span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                      {selectedDiscipline.name}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDiscipline(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                
                {/* Scientific Why */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Why XRD Is Indispensable In {selectedDiscipline.name}
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans bg-white/5 p-4 rounded-2xl border border-white/5">
                    {selectedDiscipline.detailedWhy}
                  </p>
                </div>

                {/* Diffractogram Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      Characteristic Diffraction Spectrum: <span className="text-white">{selectedDiscipline.samplePresetName}</span>
                    </h4>
                    <span className="text-[10px] text-cyan-400 font-mono">Cu Kα (1.5406 Å)</span>
                  </div>

                  <div className="p-4 bg-black/60 rounded-2xl border border-white/10 space-y-3">
                    {/* Peak Pills Bar */}
                    <div className="flex flex-wrap gap-2">
                      {selectedDiscipline.spectrumData.map((peak, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setActivePeakHover(peak)}
                          onMouseLeave={() => setActivePeakHover(null)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                            activePeakHover?.angle === peak.angle
                              ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          <span className="font-bold">{peak.hkl}:</span> 2θ = {peak.angle.toFixed(2)}° ({peak.intensity}%)
                        </div>
                      ))}
                    </div>

                    {/* Mini Spectrum Graph */}
                    <div className="h-28 w-full bg-[#030712] rounded-xl p-2 relative flex flex-col justify-end">
                      <svg className="w-full h-20" viewBox="0 0 300 70" fill="none">
                        <line x1="0" y1="65" x2="300" y2="65" stroke="#334155" strokeWidth="1" />
                        {selectedDiscipline.spectrumData.map((peak, idx) => {
                          // Map angle (20 to 90) to X (20 to 280)
                          const x = 20 + ((peak.angle - 15) / 80) * 260;
                          const height = (peak.intensity / 100) * 55;
                          const y = 65 - height;
                          return (
                            <g key={idx} className="cursor-pointer">
                              <line
                                x1={x}
                                y1="65"
                                x2={x}
                                y2={y}
                                stroke={activePeakHover?.angle === peak.angle ? '#facc15' : '#38bdf8'}
                                strokeWidth="3"
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r={activePeakHover?.angle === peak.angle ? "4" : "2.5"}
                                fill={activePeakHover?.angle === peak.angle ? '#facc15' : '#38bdf8'}
                              />
                            </g>
                          );
                        })}
                      </svg>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                        <span>15° 2θ</span>
                        <span>50° 2θ</span>
                        <span>95° 2θ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two-Column Grid: Parameters & Typical Samples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Core Measured Parameters
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {selectedDiscipline.keyParameters.map((param, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Standard Tested Specimens
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {selectedDiscipline.typicalSamples.map((samp, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CircleDot className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{samp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-black/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setSelectedDiscipline(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close Overview
                </button>

                <button
                  onClick={() => handleLaunchModule(selectedDiscipline.targetModule)}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Launch In XRD-Calc Pro</span>
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
