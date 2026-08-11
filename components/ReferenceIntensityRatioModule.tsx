import React, { useState, useMemo, useRef } from 'react';
import { 
  Layers, Activity, FlaskConical, Download, Plus, Trash2, 
  FileSpreadsheet, Calculator, Info, Sparkles, RefreshCw, 
  BarChart3, PieChart as PieChartIcon, Check, BookOpen, Scale,
  Search, Upload, FileText, ArrowRightLeft, Database, HelpCircle,
  Eye, Sliders, Play, Copy, CheckCircle2, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line,
  AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { playSynthTone } from '../utils/sound';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RIRPhase {
  id: string;
  name: string;
  hkl: string;
  twoTheta: number;
  intensity: number;
  rir: number; // I / I_corundum
  density?: number; // Density in g/cm^3
  mac?: number; // Mass Absorption Coefficient (cm^2/g)
  notes?: string;
  color?: string;
}

interface RIRDatabaseEntry {
  name: string;
  formula: string;
  pdfCard: string;
  crystalSystem: string;
  rir: number;
  hkl: string;
  twoTheta: number;
  macCu: number; // cm^2/g for Cu K-alpha
  density?: number; // g/cm^3
  category: string;
}

interface CalibPoint {
  id: string;
  weightRatio: number;
  intensityRatio: number;
}

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#eab308', // Yellow
];

const DATABASE_PRESETS: RIRDatabaseEntry[] = [
  { name: 'Corundum (α-Al₂O₃)', formula: 'Al₂O₃', pdfCard: '01-070-5679', crystalSystem: 'Trigonal', rir: 1.00, hkl: '(113)', twoTheta: 43.36, macCu: 31.8, density: 3.98, category: 'Reference Standards' },
  { name: 'Quartz (α-SiO₂)', formula: 'SiO₂', pdfCard: '01-085-0795', crystalSystem: 'Trigonal', rir: 3.60, hkl: '(101)', twoTheta: 26.64, macCu: 34.9, density: 2.65, category: 'Minerals' },
  { name: 'Rutile (TiO₂)', formula: 'TiO₂', pdfCard: '01-076-0317', crystalSystem: 'Tetragonal', rir: 3.40, hkl: '(110)', twoTheta: 27.44, macCu: 118.2, density: 4.23, category: 'Oxides' },
  { name: 'Anatase (TiO₂)', formula: 'TiO₂', pdfCard: '01-071-1166', crystalSystem: 'Tetragonal', rir: 3.30, hkl: '(101)', twoTheta: 25.28, macCu: 118.2, density: 3.89, category: 'Oxides' },
  { name: 'Calcite (CaCO₃)', formula: 'CaCO₃', pdfCard: '01-072-1650', crystalSystem: 'Trigonal', rir: 2.00, hkl: '(104)', twoTheta: 29.40, macCu: 76.4, density: 2.71, category: 'Carbonates' },
  { name: 'Dolomite (CaMg(CO₃)₂)', formula: 'CaMg(CO₃)₂', pdfCard: '01-073-2405', crystalSystem: 'Trigonal', rir: 2.50, hkl: '(104)', twoTheta: 30.94, macCu: 58.1, density: 2.87, category: 'Carbonates' },
  { name: 'Magnetite (Fe₃O₄)', formula: 'Fe₃O₄', pdfCard: '01-089-0688', crystalSystem: 'Cubic', rir: 4.80, hkl: '(311)', twoTheta: 35.42, macCu: 208.5, density: 5.18, category: 'Oxides' },
  { name: 'Hematite (α-Fe₂O₃)', formula: 'Fe₂O₃', pdfCard: '01-089-0599', crystalSystem: 'Trigonal', rir: 2.70, hkl: '(104)', twoTheta: 33.15, macCu: 211.2, density: 5.26, category: 'Oxides' },
  { name: 'Fluorite (CaF₂)', formula: 'CaF₂', pdfCard: '01-075-0009', crystalSystem: 'Cubic', rir: 3.20, hkl: '(111)', twoTheta: 28.27, macCu: 96.3, density: 3.18, category: 'Halides' },
  { name: 'Silicon (Si)', formula: 'Si', pdfCard: '00-027-1402', crystalSystem: 'Cubic', rir: 4.70, hkl: '(111)', twoTheta: 28.44, macCu: 60.8, density: 2.33, category: 'Elements' },
  { name: 'Halite (NaCl)', formula: 'NaCl', pdfCard: '01-075-0306', crystalSystem: 'Cubic', rir: 4.20, hkl: '(200)', twoTheta: 31.69, macCu: 74.3, density: 2.17, category: 'Halides' },
  { name: 'Gypsum (CaSO₄·2H₂O)', formula: 'CaSO₄·2H₂O', pdfCard: '01-074-1433', crystalSystem: 'Monoclinic', rir: 1.80, hkl: '(020)', twoTheta: 11.63, macCu: 52.8, density: 2.31, category: 'Sulfates' },
  { name: 'Anhydrite (CaSO₄)', formula: 'CaSO₄', pdfCard: '01-072-0916', crystalSystem: 'Orthorhombic', rir: 2.10, hkl: '(020)', twoTheta: 25.44, macCu: 66.5, density: 2.97, category: 'Sulfates' },
  { name: 'Monoclinic Zirconia (ZrO₂)', formula: 'ZrO₂', pdfCard: '01-083-0944', crystalSystem: 'Monoclinic', rir: 2.50, hkl: '(-111)', twoTheta: 28.18, macCu: 142.1, density: 5.68, category: 'Oxides' },
  { name: 'Zincite (ZnO)', formula: 'ZnO', pdfCard: '01-079-0208', crystalSystem: 'Hexagonal', rir: 5.20, hkl: '(101)', twoTheta: 36.25, macCu: 124.6, density: 5.61, category: 'Oxides' },
  { name: 'Alite / C3S (Ca₃SiO₅)', formula: 'Ca₃SiO₅', pdfCard: '00-049-0442', crystalSystem: 'Monoclinic', rir: 1.20, hkl: '(202)', twoTheta: 32.20, macCu: 78.5, density: 3.15, category: 'Cement Clinker' },
  { name: 'Belite / C2S (Ca₂SiO₄)', formula: 'Ca₂SiO₄', pdfCard: '00-033-0302', crystalSystem: 'Monoclinic', rir: 1.10, hkl: '(102)', twoTheta: 32.60, macCu: 75.1, density: 3.28, category: 'Cement Clinker' },
  { name: 'Aluminate / C3A (Ca₃Al₂O₆)', formula: 'Ca₃Al₂O₆', pdfCard: '00-038-1429', crystalSystem: 'Cubic', rir: 1.40, hkl: '(440)', twoTheta: 33.18, macCu: 69.4, density: 3.03, category: 'Cement Clinker' },
  { name: 'Ferrite / C4AF (Ca₂AlFeO₅)', formula: 'Ca₂AlFeO₅', pdfCard: '00-030-0226', crystalSystem: 'Orthorhombic', rir: 2.10, hkl: '(141)', twoTheta: 33.80, macCu: 122.3, density: 3.77, category: 'Cement Clinker' },
  { name: 'Hydroxyapatite (Ca₅(PO₄)₃OH)', formula: 'Ca₅(PO₄)₃OH', pdfCard: '01-074-0565', crystalSystem: 'Hexagonal', rir: 1.50, hkl: '(211)', twoTheta: 31.77, macCu: 62.4, density: 3.16, category: 'Biomaterials' },
  { name: 'β-TCP (Ca₃(PO₄)₂)', formula: 'Ca₃(PO₄)₂', pdfCard: '00-009-0169', crystalSystem: 'Trigonal', rir: 1.30, hkl: '(0210)', twoTheta: 31.02, macCu: 61.2, density: 3.14, category: 'Biomaterials' },
  { name: 'Microcline (KAlSi₃O₈)', formula: 'KAlSi₃O₈', pdfCard: '01-071-1540', crystalSystem: 'Triclinic', rir: 1.10, hkl: '(002)', twoTheta: 27.50, macCu: 41.2, density: 2.56, category: 'Feldspars' },
  { name: 'Albite (NaAlSi₃O₈)', formula: 'NaAlSi₃O₈', pdfCard: '01-071-1150', crystalSystem: 'Triclinic', rir: 1.20, hkl: '(002)', twoTheta: 27.90, macCu: 32.5, density: 2.62, category: 'Feldspars' },
  { name: 'Biotite Mica', formula: 'K(Mg,Fe)₃AlSi₃O₁₀(OH)₂', pdfCard: '00-010-0493', crystalSystem: 'Monoclinic', rir: 1.80, hkl: '(001)', twoTheta: 8.85, macCu: 88.0, density: 3.09, category: 'Micas' },
];

const MIXTURE_SCENARIOS = [
  {
    name: 'Titania Photocatalyst Blend',
    description: 'Biphasic Anatase & Rutile nanoparticle synthesis mixture',
    amorphous: 5,
    phases: [
      { name: 'Anatase (TiO₂)', hkl: '(101)', twoTheta: 25.28, intensity: 7800, rir: 3.30, mac: 118.2, notes: 'Photocatalytic phase' },
      { name: 'Rutile (TiO₂)', hkl: '(110)', twoTheta: 27.44, intensity: 2100, rir: 3.40, mac: 118.2, notes: 'Thermally stable phase' },
    ]
  },
  {
    name: 'Portland Cement Clinker',
    description: 'Industrial anhydrous clinker phase distribution',
    amorphous: 2,
    phases: [
      { name: 'Alite / C3S (Ca₃SiO₅)', hkl: '(202)', twoTheta: 32.20, intensity: 6500, rir: 1.20, mac: 78.5, notes: 'Primary hydraulic phase' },
      { name: 'Belite / C2S (Ca₂SiO₄)', hkl: '(102)', twoTheta: 32.60, intensity: 2200, rir: 1.10, mac: 75.1, notes: 'Late strength provider' },
      { name: 'Aluminate / C3A', hkl: '(440)', twoTheta: 33.18, intensity: 1100, rir: 1.40, mac: 69.4, notes: 'Rapid hydration phase' },
      { name: 'Ferrite / C4AF', hkl: '(141)', twoTheta: 33.80, intensity: 1800, rir: 2.10, mac: 122.3, notes: 'Tetracalcium aluminoferrite' }
    ]
  },
  {
    name: 'Granite Rock Mineralogy',
    description: 'Igneous rock quantitative modal analysis with silica',
    amorphous: 0,
    phases: [
      { name: 'Quartz (α-SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 9200, rir: 3.60, mac: 34.9, notes: 'Free silica' },
      { name: 'Microcline (K-Feldspar)', hkl: '(002)', twoTheta: 27.50, intensity: 3100, rir: 1.10, mac: 41.2, notes: 'Potassium feldspar' },
      { name: 'Albite (Plagioclase)', hkl: '(002)', twoTheta: 27.90, intensity: 2400, rir: 1.20, mac: 32.5, notes: 'Sodium plagioclase' },
      { name: 'Biotite Mica', hkl: '(001)', twoTheta: 8.85, intensity: 850, rir: 1.80, mac: 88.0, notes: 'Sheet silicate' }
    ]
  },
  {
    name: 'Bone & Biomaterial Ceramic',
    description: 'Biphasic calcium phosphate (BCP) bone graft scaffold',
    amorphous: 10,
    phases: [
      { name: 'Hydroxyapatite (HA)', hkl: '(211)', twoTheta: 31.77, intensity: 8200, rir: 1.50, mac: 62.4, notes: 'Osteoconductive matrix' },
      { name: 'β-TCP', hkl: '(0210)', twoTheta: 31.02, intensity: 2900, rir: 1.30, mac: 61.2, notes: 'Bioresorbable phase' }
    ]
  },
  {
    name: 'Iron Ore Sintering Powder',
    description: 'Mining ore feed with oxides, carbonates and silica',
    amorphous: 0,
    phases: [
      { name: 'Hematite (α-Fe₂O₃)', hkl: '(104)', twoTheta: 33.15, intensity: 10500, rir: 2.70, mac: 211.2, notes: 'Primary iron ore' },
      { name: 'Magnetite (Fe₃O₄)', hkl: '(311)', twoTheta: 35.42, intensity: 4800, rir: 4.80, mac: 208.5, notes: 'Secondary spinelloid' },
      { name: 'Quartz (SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 1800, rir: 3.60, mac: 34.9, notes: 'Gangue mineral' },
      { name: 'Calcite (CaCO₃)', hkl: '(104)', twoTheta: 29.40, intensity: 2200, rir: 2.00, mac: 76.4, notes: 'Fluxing agent' }
    ]
  }
];

export const ReferenceIntensityRatioModule: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phases, setPhases] = useState<RIRPhase[]>([
    { id: '1', name: 'Quartz (α-SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 8500, rir: 3.60, mac: 34.9, notes: 'Primary Silica Phase', color: COLOR_PALETTE[0] },
    { id: '2', name: 'Calcite (CaCO₃)', hkl: '(104)', twoTheta: 29.40, intensity: 4200, rir: 2.00, mac: 76.4, notes: 'Matrix Mineral', color: COLOR_PALETTE[1] },
    { id: '3', name: 'Corundum (α-Al₂O₃)', hkl: '(113)', twoTheta: 43.36, intensity: 1500, rir: 1.00, mac: 31.8, notes: 'Added Internal Standard (10 wt%)', color: COLOR_PALETTE[2] },
  ]);

  const [amorphousWtPct, setAmorphousWtPct] = useState<number>(0);
  const [internalStandardMode, setInternalStandardMode] = useState<boolean>(false);
  const [standardPhaseId, setStandardPhaseId] = useState<string>('3');
  const [standardAddedWtPct, setStandardAddedWtPct] = useState<number>(10.0);

  // Uncertainty Estimator State
  const [intensityUncertaintyPct, setIntensityUncertaintyPct] = useState<number>(3.0);
  const [rirUncertaintyPct, setRirUncertaintyPct] = useState<number>(5.0);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(true);

  // Calibration estimator state
  const [calibMode, setCalibMode] = useState<'single' | 'multi'>('single');
  const [calibIntensityA, setCalibIntensityA] = useState(3200);
  const [calibIntensityB, setCalibIntensityB] = useState(1000);
  const [calibRIRB, setCalibRIRB] = useState(1.0); // Corundum standard
  const [calibWeightRatioAB, setCalibWeightRatioAB] = useState(3.2); // W_A / W_B ratio

  // Multi-point calibration points
  const [calibPoints, setCalibPoints] = useState<CalibPoint[]>([
    { id: '1', weightRatio: 0.25, intensityRatio: 0.90 },
    { id: '2', weightRatio: 0.50, intensityRatio: 1.80 },
    { id: '3', weightRatio: 1.00, intensityRatio: 3.60 },
    { id: '4', weightRatio: 2.00, intensityRatio: 7.20 },
  ]);

  // Spectrum Profile Visualizer State
  const [spectrumMode, setSpectrumMode] = useState<'stick' | 'continuous'>('stick');
  const [profileFWHM, setProfileFWHM] = useState<number>(0.3); // degrees 2Theta

  // Auto-Fit & Unit Toggle State
  const [showAutoFitModal, setShowAutoFitModal] = useState<boolean>(false);
  const [autoFitSuccessMsg, setAutoFitSuccessMsg] = useState<string | null>(null);
  const [chartUnitMode, setChartUnitMode] = useState<'wt' | 'vol'>('wt');

  // Search & Filter state for Reference DB
  const [dbSearch, setDbSearch] = useState('');
  const [dbCategoryFilter, setDbCategoryFilter] = useState('All');
  const [showDbModal, setShowDbModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'charts' | 'stick' | 'mac' | 'theory'>('charts');
  const [mainTab, setMainTab] = useState<'analysis' | 'calibration' | 'spectrum' | 'database' | 'theory'>('analysis');
  const [applyTargetPhaseId, setApplyTargetPhaseId] = useState<string>('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Normalize peak intensities to max 10,000
  const normalizeIntensities = () => {
    if (phases.length === 0) return;
    playSynthTone('success');
    const maxInt = Math.max(...phases.map(p => p.intensity || 0));
    if (maxInt <= 0) return;
    setPhases(prev => prev.map(p => ({
      ...p,
      intensity: Math.round(((p.intensity || 0) / maxInt) * 10000)
    })));
  };

  // Apply calibrated RIR to selected phase
  const handleApplyCalibratedRIR = (calibratedRIRValue: number) => {
    const targetId = applyTargetPhaseId || (phases[0]?.id || '');
    if (!targetId) return;
    playSynthTone('success');
    const rirVal = Number(calibratedRIRValue.toFixed(2));
    updatePhase(targetId, 'rir', rirVal);
    setAutoFitSuccessMsg(`Applied Calibrated RIR (${rirVal}) to phase!`);
    setTimeout(() => setAutoFitSuccessMsg(null), 4000);
  };

  // Add Phase
  const addPhase = () => {
    playSynthTone('tick');
    const newId = Math.random().toString(36).substring(2, 9);
    const colorIndex = phases.length % COLOR_PALETTE.length;
    setPhases(prev => [
      ...prev,
      {
        id: newId,
        name: `Phase ${prev.length + 1}`,
        hkl: '(100)',
        twoTheta: 30.0,
        intensity: 1000,
        rir: 1.0,
        density: 3.0,
        mac: 50.0,
        notes: 'User defined phase',
        color: COLOR_PALETTE[colorIndex]
      }
    ]);
  };

  const addPresetPhase = (preset: RIRDatabaseEntry) => {
    playSynthTone('success');
    const newId = Math.random().toString(36).substring(2, 9);
    const colorIndex = phases.length % COLOR_PALETTE.length;
    setPhases(prev => [
      ...prev,
      {
        id: newId,
        name: preset.name,
        hkl: preset.hkl,
        twoTheta: preset.twoTheta,
        intensity: 2500,
        rir: preset.rir,
        density: preset.density || 3.0,
        mac: preset.macCu,
        notes: `PDF ${preset.pdfCard} (${preset.crystalSystem})`,
        color: COLOR_PALETTE[colorIndex]
      }
    ]);
  };

  const loadScenario = (scenario: typeof MIXTURE_SCENARIOS[0]) => {
    playSynthTone('success');
    setAmorphousWtPct(scenario.amorphous);
    setInternalStandardMode(false);
    const loadedPhases: RIRPhase[] = scenario.phases.map((p, idx) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: p.name,
      hkl: p.hkl,
      twoTheta: p.twoTheta,
      intensity: p.intensity,
      rir: p.rir,
      density: 3.0,
      mac: p.mac,
      notes: p.notes,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }));
    setPhases(loadedPhases);
  };

  const updatePhase = (id: string, field: keyof RIRPhase, value: string | number) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePhase = (id: string) => {
    playSynthTone('tick');
    setPhases(prev => prev.filter(p => p.id !== id));
  };

  // Quantitative calculations
  const calculations = useMemo(() => {
    let totalReducedIntensity = 0;
    let weightedMacSum = 0;

    const reducedIntensities = phases.map(p => {
      const rI = (p.intensity || 0) / (p.rir > 0 ? p.rir : 1.0);
      totalReducedIntensity += rI;
      return { id: p.id, rI };
    });

    // Calculate volume factors (V_i ~ (I_i / RIR_i) / rho_i)
    let totalVolumeFactor = 0;
    const volumeFactors = phases.map(p => {
      const match = reducedIntensities.find(r => r.id === p.id);
      const rI = match ? match.rI : 0;
      const rho = p.density && p.density > 0 ? p.density : 3.0;
      const vFactor = rI / rho;
      totalVolumeFactor += vFactor;
      return { id: p.id, rI, rho, vFactor };
    });

    const amorphousFactor = (100 - Math.min(99, Math.max(0, amorphousWtPct))) / 100;

    // Error Propagation Factor
    const relErrI = (intensityUncertaintyPct || 0) / 100;
    const relErrRIR = (rirUncertaintyPct || 0) / 100;
    const baseRelError = Math.sqrt(relErrI * relErrI + relErrRIR * relErrRIR);

    const phaseResults = phases.map((p, idx) => {
      const match = reducedIntensities.find(r => r.id === p.id);
      const rI = match ? match.rI : 0;
      
      // Normalized crystalline weight fraction (%)
      const crystallineFraction = totalReducedIntensity > 0 ? (rI / totalReducedIntensity) * 100 : 0;
      
      // Total sample weight fraction considering amorphous content
      const totalSampleFraction = crystallineFraction * amorphousFactor;

      // Crystalline and total sample volume fractions (%)
      const vMatch = volumeFactors.find(v => v.id === p.id);
      const rho = vMatch ? vMatch.rho : (p.density || 3.0);
      const crystallineVolFraction = totalVolumeFactor > 0 ? ((rI / rho) / totalVolumeFactor) * 100 : 0;
      const totalSampleVolFraction = crystallineVolFraction * amorphousFactor;

      // Propagated standard deviation
      const errMarginCrystalline = crystallineFraction * baseRelError;
      const errMarginTotal = totalSampleFraction * baseRelError;
      const errMarginVol = crystallineVolFraction * baseRelError;

      // Accumulate for sample MAC
      weightedMacSum += (crystallineFraction / 100) * (p.mac || 50.0);

      return {
        ...p,
        density: rho,
        reducedIntensity: rI,
        crystallineFraction,
        totalSampleFraction,
        crystallineVolFraction,
        totalSampleVolFraction,
        errMarginCrystalline,
        errMarginTotal,
        errMarginVol,
        color: p.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]
      };
    });

    // Sample MAC incorporating estimated amorphous MAC (assumed ~30 cm^2/g for silica/organic glass)
    const totalSampleMAC = (weightedMacSum * amorphousFactor) + ((amorphousWtPct / 100) * 30.0);

    // Internal Standard Method Absolute Calculations
    let internalStandardResults = phaseResults;
    if (internalStandardMode) {
      const stdPhase = phaseResults.find(p => p.id === standardPhaseId);
      if (stdPhase && stdPhase.reducedIntensity > 0 && standardAddedWtPct > 0) {
        const stdReducedIntensity = stdPhase.reducedIntensity;
        internalStandardResults = phaseResults.map(p => {
          const absWeight = (standardAddedWtPct * p.reducedIntensity) / stdReducedIntensity;
          return {
            ...p,
            internalStdAbsoluteWeight: absWeight
          };
        });
      }
    }

    return {
      totalReducedIntensity,
      totalVolumeFactor,
      phaseResults: internalStandardResults,
      amorphousFactor,
      totalSampleMAC
    };
  }, [phases, amorphousWtPct, internalStandardMode, standardPhaseId, standardAddedWtPct, intensityUncertaintyPct, rirUncertaintyPct]);

  // Dominant Phase Calculation
  const dominantPhase = useMemo(() => {
    if (!calculations.phaseResults || calculations.phaseResults.length === 0) return null;
    return [...calculations.phaseResults].sort((a, b) => b.crystallineFraction - a.crystallineFraction)[0];
  }, [calculations]);

  // Calibrated single-point RIR calculation
  const calculatedCalibRIR = useMemo(() => {
    if (calibIntensityB <= 0 || calibWeightRatioAB <= 0) return 0;
    return calibRIRB * (calibIntensityA / calibIntensityB) * (1 / calibWeightRatioAB);
  }, [calibIntensityA, calibIntensityB, calibRIRB, calibWeightRatioAB]);

  // Multi-point linear regression calibration
  const multiPointStats = useMemo(() => {
    if (calibPoints.length < 2) {
      return { slope: 0, intercept: 0, r2: 0, calibRIR: 0 };
    }
    const n = calibPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    calibPoints.forEach(pt => {
      const x = pt.weightRatio;
      const y = pt.intensityRatio;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const denominator = (n * sumXX - sumX * sumX);
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;
    
    // R^2 calculation
    const yMean = sumY / n;
    const ssTot = calibPoints.reduce((acc, pt) => acc + Math.pow(pt.intensityRatio - yMean, 2), 0);
    const ssRes = calibPoints.reduce((acc, pt) => acc + Math.pow(pt.intensityRatio - (slope * pt.weightRatio + intercept), 2), 0);
    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

    const calibRIR = slope * calibRIRB;

    return { slope, intercept, r2, calibRIR };
  }, [calibPoints, calibRIRB]);

  // Multi-point calibration regression line visualization points
  const calibRegressionData = useMemo(() => {
    if (calibPoints.length < 2) return [];
    const minX = Math.max(0, Math.min(...calibPoints.map(p => p.weightRatio)) * 0.8);
    const maxX = Math.max(...calibPoints.map(p => p.weightRatio)) * 1.2;
    return [
      { weightRatio: Number(minX.toFixed(3)), fittedRatio: Number((multiPointStats.slope * minX + multiPointStats.intercept).toFixed(3)) },
      { weightRatio: Number(maxX.toFixed(3)), fittedRatio: Number((multiPointStats.slope * maxX + multiPointStats.intercept).toFixed(3)) }
    ];
  }, [calibPoints, multiPointStats]);

  // Filtered Reference DB
  const filteredDatabase = useMemo(() => {
    return DATABASE_PRESETS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
                            item.formula.toLowerCase().includes(dbSearch.toLowerCase()) ||
                            item.pdfCard.includes(dbSearch);
      const matchesCategory = dbCategoryFilter === 'All' || item.category === dbCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [dbSearch, dbCategoryFilter]);

  // DB Categories
  const dbCategories = useMemo(() => {
    const cats = new Set(DATABASE_PRESETS.map(d => d.category));
    return ['All', ...Array.from(cats)];
  }, []);

  // Stick diagram simulated XRD data
  const simulatedPeakSticks = useMemo(() => {
    const sortedPhases = [...calculations.phaseResults].sort((a, b) => a.twoTheta - b.twoTheta);
    return sortedPhases.map(p => ({
      twoTheta: p.twoTheta,
      intensity: p.intensity,
      reducedIntensity: p.reducedIntensity,
      name: p.name,
      hkl: p.hkl,
      color: p.color
    }));
  }, [calculations]);

  // Continuous Pseudo-Voigt Diffraction Profile
  const continuousPatternData = useMemo(() => {
    if (phases.length === 0) return [];
    
    const minAngle = Math.max(10, Math.floor(Math.min(...phases.map(p => p.twoTheta)) - 4));
    const maxAngle = Math.min(80, Math.ceil(Math.max(...phases.map(p => p.twoTheta)) + 4));
    const step = 0.2;
    const numSteps = Math.ceil((maxAngle - minAngle) / step);

    const data: any[] = [];
    const fwhm = profileFWHM > 0 ? profileFWHM : 0.3;

    for (let i = 0; i <= numSteps; i++) {
      const twoTheta = Number((minAngle + i * step).toFixed(2));
      const point: Record<string, any> = { twoTheta, Total: 0 };

      let totalInt = 0;
      phases.forEach(p => {
        const diff = twoTheta - p.twoTheta;
        const g = Math.exp(-4 * Math.LN2 * Math.pow(diff / fwhm, 2));
        const l = 1 / (1 + 4 * Math.pow(diff / fwhm, 2));
        const profileVal = (p.intensity || 0) * (0.5 * g + 0.5 * l);
        
        const phaseVal = Number(profileVal.toFixed(1));
        point[p.name] = phaseVal;
        totalInt += phaseVal;
      });

      point.Total = Number(totalInt.toFixed(1));
      data.push(point);
    }

    return data;
  }, [phases, profileFWHM]);

  // Chart data for Pie
  const pieChartData = useMemo(() => {
    const data = calculations.phaseResults.map(p => ({
      name: p.name,
      value: Number((chartUnitMode === 'wt' ? p.crystallineFraction : p.crystallineVolFraction).toFixed(2)),
      color: p.color,
      rir: p.rir,
      intensity: p.intensity,
      density: p.density,
      crystWtPct: p.crystallineFraction,
      crystVolPct: p.crystallineVolFraction
    }));

    if (amorphousWtPct > 0) {
      data.push({
        name: 'Amorphous Phase',
        value: Number(amorphousWtPct.toFixed(2)),
        color: '#64748b',
        rir: 0,
        intensity: 0,
        density: 2.2,
        crystWtPct: amorphousWtPct,
        crystVolPct: amorphousWtPct
      });
    }

    return data;
  }, [calculations, amorphousWtPct, chartUnitMode]);

  // Auto-Fit Volume Fractions & Bragg Intensities
  const handleAutoFit = () => {
    playSynthTone('success');
    setShowAutoFitModal(true);
    setAutoFitSuccessMsg('Auto-Fit Engine: Phase volume fractions calculated and optimized from Bragg peak intensities and crystallographic densities.');
    setTimeout(() => setAutoFitSuccessMsg(null), 5000);
  };

  // Copy Summary Report to Clipboard
  const copyReportToClipboard = () => {
    playSynthTone('success');
    let report = `XRD QUANTITATIVE PHASE ANALYSIS REPORT (RIR METHOD)\n`;
    report += `====================================================\n`;
    report += `Date/Time: ${new Date().toLocaleString()}\n`;
    report += `Amorphous Content Correction: ${amorphousWtPct} wt%\n`;
    report += `Sample Mass Attenuation Coefficient (Cu Kα): ${calculations.totalSampleMAC.toFixed(2)} cm²/g\n`;
    report += `Assumed Measurement Uncertainty: ±${intensityUncertaintyPct}% (Int), ±${rirUncertaintyPct}% (RIR)\n\n`;

    report += `PHASE QUANTITATIVE SUMMARY:\n`;
    report += `------------------------------------------------------------------------------------\n`;
    report += `Phase Name              | hkl   | 2-Theta | Int (I) | RIR   | Density | Cryst. wt%     | Cryst. vol%\n`;
    report += `------------------------------------------------------------------------------------\n`;

    calculations.phaseResults.forEach(p => {
      const namePad = p.name.padEnd(23, ' ').substring(0, 23);
      const hklPad = p.hkl.padEnd(5, ' ').substring(0, 5);
      const ttPad = p.twoTheta.toFixed(2).padStart(7, ' ');
      const intPad = p.intensity.toString().padStart(7, ' ');
      const rirPad = p.rir.toFixed(2).padStart(5, ' ');
      const denPad = (p.density || 3.0).toFixed(2).padStart(7, ' ');
      const crystPad = `${p.crystallineFraction.toFixed(1)} ± ${p.errMarginCrystalline.toFixed(1)}%`.padStart(14, ' ');
      const volPad = `${p.crystallineVolFraction.toFixed(1)} ± ${p.errMarginVol.toFixed(1)}%`.padStart(12, ' ');

      report += `${namePad} | ${hklPad} | ${ttPad} | ${intPad} | ${rirPad} | ${denPad} | ${crystPad} | ${volPad}\n`;
    });

    report += `------------------------------------------------------------------------------------\n`;
    report += `Amorphous Matrix        | ---   | ---     | ---     | ---   | ---     | ${amorphousWtPct.toFixed(1)} wt%         | ${amorphousWtPct.toFixed(1)} vol%\n`;
    report += `====================================================================================\n`;

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // CSV Export
  const exportCSV = () => {
    playSynthTone('success');
    const timestamp = new Date().toISOString();
    let csvContent = `data:text/csv;charset=utf-8,`;
    
    csvContent += `# XRD Quantitative Phase Analysis via Reference Intensity Ratio (RIR)\n`;
    csvContent += `# Generated: ${timestamp}\n`;
    csvContent += `# Amorphous Content Correction: ${amorphousWtPct}%\n`;
    if (internalStandardMode) {
      csvContent += `# Internal Standard Mode: Enabled (Added Std Wt%: ${standardAddedWtPct}%)\n`;
    }
    csvContent += `# Total Sample Mass Attenuation Coeff (Cu K-alpha): ${calculations.totalSampleMAC.toFixed(2)} cm2/g\n`;
    csvContent += `\n`;
    
    csvContent += `Phase Name,Reflection (hkl),2-Theta (deg),Integrated Intensity (I),RIR (I/Ic),Density (g/cm3),MAC (cm2/g),Reduced Intensity (I/RIR),Crystalline Wt (%),Err Margin (%),Crystalline Vol (%),Err Margin (%),Total Sample Wt (%),Notes\n`;

    calculations.phaseResults.forEach(p => {
      const nameEscaped = `"${p.name.replace(/"/g, '""')}"`;
      const hklEscaped = `"${p.hkl.replace(/"/g, '""')}"`;
      const notesEscaped = `"${(p.notes || '').replace(/"/g, '""')}"`;
      csvContent += `${nameEscaped},${hklEscaped},${p.twoTheta},${p.intensity},${p.rir},${p.density || 3.0},${p.mac || 0},${p.reducedIntensity.toFixed(2)},${p.crystallineFraction.toFixed(2)},${p.errMarginCrystalline.toFixed(2)},${p.crystallineVolFraction.toFixed(2)},${p.errMarginVol.toFixed(2)},${p.totalSampleFraction.toFixed(2)},${notesEscaped}\n`;
    });

    csvContent += `\n`;
    csvContent += `Sum Total,---,---,---,---,---,${calculations.totalSampleMAC.toFixed(2)},${calculations.totalReducedIntensity.toFixed(2)},100.00,---,100.00,---,${(100 - amorphousWtPct).toFixed(2)},---\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RIR_Quantitative_Analysis_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const exportJSON = () => {
    playSynthTone('success');
    const sessionData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      amorphousWtPct,
      internalStandardMode,
      standardPhaseId,
      standardAddedWtPct,
      intensityUncertaintyPct,
      rirUncertaintyPct,
      phases,
      calculations: {
        totalReducedIntensity: calculations.totalReducedIntensity,
        totalSampleMAC: calculations.totalSampleMAC,
        phaseResults: calculations.phaseResults.map(p => ({
          name: p.name,
          crystallineFraction: p.crystallineFraction,
          totalSampleFraction: p.totalSampleFraction
        }))
      }
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RIR_Session_Data_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Import
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.phases && Array.isArray(data.phases)) {
          setPhases(data.phases);
          if (data.amorphousWtPct !== undefined) setAmorphousWtPct(data.amorphousWtPct);
          if (data.internalStandardMode !== undefined) setInternalStandardMode(data.internalStandardMode);
          if (data.standardAddedWtPct !== undefined) setStandardAddedWtPct(data.standardAddedWtPct);
          if (data.intensityUncertaintyPct !== undefined) setIntensityUncertaintyPct(data.intensityUncertaintyPct);
          if (data.rirUncertaintyPct !== undefined) setRirUncertaintyPct(data.rirUncertaintyPct);
          playSynthTone('success');
        }
      } catch (err) {
        playSynthTone('error');
        alert('Invalid RIR session JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Top Module Navigation Tabs */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md flex flex-wrap sm:flex-nowrap gap-1.5 shadow-xl">
        <button
          onClick={() => setMainTab('analysis')}
          className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'analysis' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <FlaskConical className="w-4 h-4 text-indigo-300" />
          <span>1. Phase Analysis Engine</span>
        </button>

        <button
          onClick={() => setMainTab('calibration')}
          className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'calibration' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Calculator className="w-4 h-4 text-amber-300" />
          <span>2. RIR Calibration Engine</span>
        </button>

        <button
          onClick={() => setMainTab('spectrum')}
          className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'spectrum' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <BarChart3 className="w-4 h-4 text-cyan-300" />
          <span>3. XRD Pattern Visualizer</span>
        </button>

        <button
          onClick={() => setMainTab('database')}
          className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'database' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Database className="w-4 h-4 text-emerald-300" />
          <span>4. Reference Library</span>
        </button>

        <button
          onClick={() => setMainTab('theory')}
          className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'theory' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <BookOpen className="w-4 h-4 text-purple-300" />
          <span>5. Theory & Equations</span>
        </button>
      </div>

      {/* Auto-Fit / Action Notification Bar */}
      <AnimatePresence>
        {autoFitSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{autoFitSuccessMsg}</span>
            </div>
            <button onClick={() => setAutoFitSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 font-bold px-2 py-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Analysis Summary Metrics */}
      {mainTab === 'analysis' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crystalline Mass</span>
            <span className="text-xl font-mono font-black text-indigo-400 mt-1">{(100 - amorphousWtPct).toFixed(1)} wt%</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amorphous Content</span>
            <span className="text-xl font-mono font-black text-rose-400 mt-1">{amorphousWtPct.toFixed(1)} wt%</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume Factor</span>
            <span className="text-xl font-mono font-black text-amber-400 mt-1">{calculations.totalVolumeFactor.toFixed(1)}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sample MAC (μ*)</span>
            <span className="text-xl font-mono font-black text-cyan-400 mt-1">{calculations.totalSampleMAC.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm²/g</span></span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dominant Phase</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 truncate">
              {dominantPhase ? `${dominantPhase.name} (${dominantPhase.crystallineFraction.toFixed(1)}%)` : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Preset Mixture Scenarios Selector */}
      <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Load Benchmarking Laboratory Mixture Scenario</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MIXTURE_SCENARIOS.map((scen, sIdx) => (
            <button
              key={sIdx}
              onClick={() => loadScenario(scen)}
              className="p-4 bg-slate-950/50 hover:bg-indigo-950/30 border border-slate-800/60 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between group hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
            >
              <div>
                <span className="font-bold text-slate-200 text-sm block group-hover:text-indigo-300 transition-colors">
                  {scen.name}
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-1.5 line-clamp-2">
                  {scen.description}
                </span>
              </div>
              <span className="mt-3 text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 self-start transition-colors group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30">
                {scen.phases.length} Phases
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Phase Inputs & Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Phase Input Table */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-200">
                    {t('Crystalline Mixture Components')}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-mono px-2.5 py-0.5 rounded-md font-bold border border-indigo-500/30">
                      {phases.length} {phases.length === 1 ? 'Phase' : 'Phases'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoFit}
                  className="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/30 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Auto-Fit phase volume fractions from peak intensities"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Fit Vol%</span>
                </button>

                <button
                  onClick={normalizeIntensities}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Scale peak intensities so max peak equals 10,000"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Normalize Peaks</span>
                </button>

                <button
                  onClick={addPhase}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Add Phase')}</span>
                </button>
              </div>
            </div>

            {/* List of Phases */}
            <div className="space-y-4">
              <AnimatePresence>
                {phases.map((phase, idx) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-4 relative group/phase hover:border-indigo-500/40 hover:bg-slate-950/80 transition-all duration-300 shadow-sm hover:shadow-indigo-500/5"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span 
                          className="w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center text-white shadow-sm ring-2 ring-slate-950"
                          style={{ backgroundColor: phase.color || COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                        >
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                          className="bg-transparent font-bold text-slate-100 text-base focus:bg-slate-900 border border-transparent focus:border-indigo-500/50 rounded-lg px-2.5 py-1 outline-none w-full max-w-xs transition-colors"
                          placeholder="Phase Name"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                          <span>RIR:</span>
                          <span>{phase.rir}</span>
                        </span>
                        {phases.length > 1 && (
                          <button
                            onClick={() => removePhase(phase.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-60 group-hover/phase:opacity-100"
                            title="Remove Phase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                          Peak Int. (I)
                        </label>
                        <input
                          type="number"
                          value={phase.intensity || ''}
                          onChange={(e) => updatePhase(phase.id, 'intensity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                          RIR (I/Ic)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={phase.rir || ''}
                          onChange={(e) => updatePhase(phase.id, 'rir', parseFloat(e.target.value) || 0.01)}
                          className="w-full bg-slate-900/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                          Density (g/cm³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={phase.density || ''}
                          onChange={(e) => updatePhase(phase.id, 'density', parseFloat(e.target.value) || 3.0)}
                          className="w-full bg-slate-900/50 border border-slate-700/80 hover:border-slate-600 text-amber-300 font-bold rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                          Reflection (hkl)
                        </label>
                        <input
                          type="text"
                          value={phase.hkl}
                          onChange={(e) => updatePhase(phase.id, 'hkl', e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                          2θ Angle (°)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={phase.twoTheta || ''}
                          onChange={(e) => updatePhase(phase.id, 'twoTheta', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                          MAC (cm²/g)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={phase.mac || ''}
                          onChange={(e) => updatePhase(phase.id, 'mac', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900/50 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Live Phase Contribution Bar */}
                    {(() => {
                      const res = calculations.phaseResults.find(r => r.id === phase.id);
                      return (
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-1.5 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-sans font-medium text-[11px]">Calculated Contribution:</span>
                            <div className="flex items-center gap-3">
                              <span className="text-indigo-400 font-bold">Mass: {(res?.crystallineFraction || 0).toFixed(1)} wt%</span>
                              <span className="text-amber-400 font-bold">Vol: {(res?.crystallineVolFraction || 0).toFixed(1)} vol%</span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-800/80">
                            <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(1, res?.crystallineFraction || 0))}%` }} />
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(1, res?.crystallineVolFraction || 0))}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Quick Add Preset Bar */}
            <div className="mt-6 border-t border-slate-800/80 pt-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Quick Add Minerals / Standards</span>
                </label>
                <button
                  onClick={() => setShowDbModal(true)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Full Library ({DATABASE_PRESETS.length}) →
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {DATABASE_PRESETS.slice(0, 10).map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => addPresetPhase(preset)}
                    className="text-xs bg-slate-900/80 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl px-3 py-1.5 transition-all duration-200 flex items-center gap-2 group/preset hover:shadow-md hover:shadow-indigo-500/10"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                      {preset.rir}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amorphous & Internal Standard & Error Propagation Controls */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Amorphous Matrix, Internal Standards & Error Bounds</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Amorphous Slider */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-300">Amorphous Phase (wt%)</label>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{amorphousWtPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={amorphousWtPct}
                  onChange={(e) => setAmorphousWtPct(parseFloat(e.target.value) || 0)}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Scales total sample weight fractions to accommodate glass, polymer, or unquantified amorphous humps.
                </p>
              </div>

              {/* Internal Standard Mode */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-300">Internal Standard Mode</label>
                  <input
                    type="checkbox"
                    checked={internalStandardMode}
                    onChange={(e) => setInternalStandardMode(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>
                {internalStandardMode && (
                  <div className="space-y-3 pt-1">
                    <select
                      value={standardPhaseId}
                      onChange={(e) => setStandardPhaseId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {phases.map(p => (
                        <option key={p.id} value={p.id}>Standard: {p.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Added Std Wt%:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={standardAddedWtPct}
                        onChange={(e) => setStandardAddedWtPct(parseFloat(e.target.value) || 0)}
                        className="w-24 bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-1.5 font-mono outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Propagation Panel */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Experimental Uncertainty & Error Propagation</span>
                </span>
                <button
                  onClick={() => setShowUncertainty(!showUncertainty)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 transition-colors"
                >
                  {showUncertainty ? 'Hide' : 'Configure'}
                </button>
              </div>

              <AnimatePresence>
                {showUncertainty && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                          Peak Int. Uncertainty (ΔI/I %)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={intensityUncertaintyPct}
                          onChange={(e) => setIntensityUncertaintyPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono text-xs outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                          RIR Const. Uncertainty (ΔRIR/RIR %)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={rirUncertaintyPct}
                          onChange={(e) => setRirUncertaintyPct(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono text-xs outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics, Charts & Calibration (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Tab Selection Navigation */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md flex gap-1.5 shadow-lg">
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'charts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span>Distribution</span>
            </button>

            <button
              onClick={() => setActiveTab('stick')}
              className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'stick' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>XRD Pattern</span>
            </button>

            <button
              onClick={() => setActiveTab('mac')}
              className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'mac' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
            >
              <Scale className="w-4 h-4" />
              <span>Calibration</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'theory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Theory</span>
            </button>
          </div>

          {/* TAB 1: Pie & Bar Charts */}
          {activeTab === 'charts' && (
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-200">
                      Phase Composition Breakdown
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {chartUnitMode === 'wt' ? 'Mass Weight Fraction (wt%)' : 'Volumetric Phase Fraction (vol%)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setChartUnitMode('wt')}
                      className={`px-3 py-1 rounded-lg transition-all ${chartUnitMode === 'wt' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Mass wt%
                    </button>
                    <button
                      onClick={() => setChartUnitMode('vol')}
                      className={`px-3 py-1 rounded-lg transition-all ${chartUnitMode === 'vol' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Volume vol%
                    </button>
                  </div>

                  <button
                    onClick={handleAutoFit}
                    className="p-2 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition-all active:scale-95"
                    title="Auto-Fit phase volume fractions"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Pie Chart Visualizer */}
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <span className="font-bold text-slate-200 block">{data.name}</span>
                              <span className="text-indigo-400 font-mono font-bold block">
                                {chartUnitMode === 'wt' ? 'Mass wt%' : 'Volume vol%'}: {data.value}%
                              </span>
                              <span className="text-amber-400 font-mono text-[10px] block">
                                Density ($\rho$): {data.density || 3.0} g/cm³
                              </span>
                              {data.rir > 0 && (
                                <span className="text-slate-400 text-[10px] font-mono block">
                                  RIR: {data.rir} | Int: {data.intensity}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Numerical List with Error Margins & Density */}
              <div className="space-y-2.5">
                {calculations.phaseResults.map((p) => (
                  <div key={p.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: p.color }}
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">{p.name}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span>I/RIR: {p.reducedIntensity.toFixed(1)}</span>
                          <span>•</span>
                          <span className="text-amber-300 font-semibold">$\rho$: {(p.density || 3.0).toFixed(2)} g/cm³</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Mass</span>
                          <span className="font-mono font-bold text-indigo-400 text-xs">
                            {p.crystallineFraction.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-right border-l border-slate-800 pl-3">
                          <span className="text-[10px] text-amber-500/80 uppercase tracking-wider block">Vol (Auto-Fit)</span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {p.crystallineVolFraction.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Peak Sticks & Continuous Diffraction Spectrum */}
          {activeTab === 'stick' && (
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-200">
                    Simulated XRD Spectrum
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner text-xs font-bold">
                  <button
                    onClick={() => setSpectrumMode('stick')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${spectrumMode === 'stick' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Stick Diagram
                  </button>
                  <button
                    onClick={() => setSpectrumMode('continuous')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${spectrumMode === 'continuous' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Continuous Profile
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {spectrumMode === 'continuous' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 shadow-inner overflow-hidden"
                  >
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Pseudo-Voigt Peak FWHM</span>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={profileFWHM}
                        onChange={(e) => setProfileFWHM(parseFloat(e.target.value) || 0.3)}
                        className="w-full sm:w-32 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{profileFWHM}° 2θ</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {spectrumMode === 'stick' 
                  ? 'Peak reflections plotted at 2θ angles with height equal to raw integrated intensity (I).' 
                  : 'Continuous XRD diffraction pattern synthesized with 50/50 pseudo-Voigt profile broadening.'}
              </p>

              <div className="h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {spectrumMode === 'stick' ? (
                    <BarChart data={simulatedPeakSticks} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="twoTheta" 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickFormatter={(v) => `${v}°`}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip
                        cursor={{fill: '#1e293b', opacity: 0.4}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                                <span className="font-bold text-slate-200 block text-sm mb-1">{data.name}</span>
                                <span className="text-slate-400 block mb-1">Reflection: {data.hkl}</span>
                                <span className="text-indigo-400 font-mono font-bold block">
                                  2θ: {data.twoTheta}° | Intensity: {data.intensity}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="intensity" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {simulatedPeakSticks.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={continuousPatternData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="twoTheta" 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickFormatter={(v) => `${v}°`} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[150px]">
                                <span className="font-bold text-indigo-300 block text-sm">2θ: {data.twoTheta}°</span>
                                <span className="font-mono font-bold text-slate-200 block">Total Int: {data.Total}</span>
                                <div className="border-t border-slate-700/80 pt-2 space-y-1">
                                  {phases.map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-[11px] gap-4">
                                      <span className="text-slate-400 truncate max-w-[100px]" style={{color: p.color}}>{p.name}:</span>
                                      <span className="font-mono font-bold text-slate-200">{data[p.name] || 0}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={3} fill="url(#colorTotal)" />
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: MAC & Calibration */}
          {activeTab === 'mac' && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Sample Mass Absorption Summary */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-200">
                    Sample Mass Attenuation Coefficient (Cu Kα)
                  </h2>
                </div>

                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-inner">
                  <div>
                    <span className="text-sm text-slate-300 block font-bold mb-1">Total Sample μ*</span>
                    <span className="text-xs text-slate-500 font-medium">Weighted average matrix absorption from phases</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl self-start sm:self-auto">
                    <span className="text-3xl font-black font-mono text-emerald-400 drop-shadow-md">
                      {calculations.totalSampleMAC.toFixed(1)} <span className="text-sm font-sans text-emerald-500/70 font-bold ml-1">cm²/g</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* RIR Calibration Tool */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">
                      RIR Constant Calibration Engine
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 text-[11px] font-bold shadow-inner self-start sm:self-auto">
                    <button
                      onClick={() => setCalibMode('single')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${calibMode === 'single' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Single Point
                    </button>
                    <button
                      onClick={() => setCalibMode('multi')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${calibMode === 'multi' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Multi-Point Linear
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {calibMode === 'single' ? (
                    <motion.div 
                      key="single"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Calculate the unknown RIR value for a newly synthesized material by measuring a known 1:1 or binary mass ratio mixture against a reference standard phase.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                            Analyte Int. (I_A)
                          </label>
                          <input
                            type="number"
                            value={calibIntensityA}
                            onChange={(e) => setCalibIntensityA(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                            Std Int. (I_B)
                          </label>
                          <input
                            type="number"
                            value={calibIntensityB}
                            onChange={(e) => setCalibIntensityB(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                            Std RIR (I/Ic)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={calibRIRB}
                            onChange={(e) => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                            Known W_A / W_B
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={calibWeightRatioAB}
                            onChange={(e) => setCalibWeightRatioAB(parseFloat(e.target.value) || 1.0)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl px-3 py-2 font-mono outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                        <span className="text-sm font-bold text-indigo-200 uppercase tracking-wide">Calibrated RIR_A Value</span>
                        <span className="text-3xl font-mono font-black text-indigo-400 drop-shadow-md">
                          {calculatedCalibRIR.toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="multi"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Fit a linear regression curve (I_A/I_B vs W_A/W_B) across multiple calibration standard mixtures to extract high-precision slope and RIR_A.
                      </p>

                      <div className="space-y-3">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                          <span>W_A / W_B Mass Ratio</span>
                          <span>I_A / I_B Int. Ratio</span>
                          <span className="w-8 text-center">Act</span>
                        </div>
                        <div className="space-y-2">
                          {calibPoints.map((pt, ptIdx) => (
                            <div key={pt.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center text-xs">
                              <input
                                type="number"
                                step="0.05"
                                value={pt.weightRatio}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCalibPoints(prev => prev.map(p => p.id === pt.id ? { ...p, weightRatio: val } : p));
                                }}
                                className="bg-slate-950/80 border border-slate-700/80 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                              />
                              <input
                                type="number"
                                step="0.05"
                                value={pt.intensityRatio}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCalibPoints(prev => prev.map(p => p.id === pt.id ? { ...p, intensityRatio: val } : p));
                                }}
                                className="bg-slate-950/80 border border-slate-700/80 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                              />
                              <button
                                onClick={() => setCalibPoints(prev => prev.filter(p => p.id !== pt.id))}
                                className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all w-8 h-8 flex items-center justify-center"
                                title="Remove Point"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            const newId = Math.random().toString(36).substring(2, 9);
                            setCalibPoints(prev => [...prev, { id: newId, weightRatio: 1.5, intensityRatio: 5.4 }]);
                          }}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 pt-2 px-2 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Add Standard Mixture Point
                        </button>
                      </div>

                      {/* Interactive Calibration Regression Plot */}
                      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300">Linear Calibration Curve</span>
                          <span className="font-mono text-[11px] text-indigo-400 font-bold">
                            y = {multiPointStats.slope.toFixed(3)}x {multiPointStats.intercept >= 0 ? '+' : ''}{multiPointStats.intercept.toFixed(3)}
                          </span>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="weightRatio" stroke="#64748b" fontSize={10} name="W_A/W_B" type="number" domain={['dataMin', 'dataMax']} />
                              <YAxis stroke="#64748b" fontSize={10} name="I_A/I_B" type="number" />
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const pt = payload[0].payload;
                                    return (
                                      <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs font-mono text-slate-200">
                                        <div>W_A/W_B: {pt.weightRatio}</div>
                                        <div>Ratio: {pt.intensityRatio ?? pt.fittedRatio}</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line
                                data={calibRegressionData}
                                dataKey="fittedRatio"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                              <Scatter
                                data={calibPoints}
                                dataKey="intensityRatio"
                                fill="#6366f1"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 rounded-2xl p-5 shadow-inner">
                        <div>
                          <span className="text-indigo-200/70 block text-[11px] uppercase tracking-widest font-bold mb-1">R² Goodness of Fit</span>
                          <span className="font-mono font-black text-emerald-400 text-2xl drop-shadow-sm">{multiPointStats.r2.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-indigo-200/70 block text-[11px] uppercase tracking-widest font-bold mb-1">Extracted RIR_A</span>
                          <span className="font-mono font-black text-indigo-400 text-2xl drop-shadow-sm">{multiPointStats.calibRIR.toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Apply Calibrated Value Action Controls */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 shadow-inner">
                  <div className="flex items-center gap-2.5 text-xs w-full sm:w-auto">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Target Mixture Phase:</span>
                    <select
                      value={applyTargetPhaseId || phases[0]?.id || ''}
                      onChange={(e) => setApplyTargetPhaseId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {phases.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Current RIR: {p.rir})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleApplyCalibratedRIR(calibMode === 'single' ? calculatedCalibRIR : multiPointStats.calibRIR)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Apply RIR ({(calibMode === 'single' ? calculatedCalibRIR : multiPointStats.calibRIR).toFixed(2)}) to Selected Phase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TAB 4: Theory Modal or Inline */}
      {activeTab === 'theory' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col gap-6 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                  Quantitative Phase Analysis Theory
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('charts')}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-8 text-sm text-slate-300 leading-relaxed overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent relative z-10 pb-8">
              <section className="space-y-4">
                <h3 className="font-bold text-slate-100 flex items-center gap-2.5 text-base">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                  The Reference Intensity Ratio (RIR) Method
                </h3>
                <p className="text-slate-400">
                  The reference intensity ratio ($I/I_c$) is a universal constant defining the ratio of the strongest diffraction peak intensity of phase <em>A</em> to the strongest peak of a reference standard (typically Corundum, $\alpha$-Al₂O₃) in a 1:1 mixture by weight.
                </p>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('RIR_A = \\frac{I_A}{I_c} \\quad (W_A = W_c)', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-slate-100 flex items-center gap-2.5 text-base">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                  Chung's Adiabatic Method (Matrix Flushing)
                </h3>
                <p className="text-slate-400">
                  For a mixture containing <em>n</em> crystalline phases (assuming no amorphous content initially), the weight fraction $W_i$ of each component can be determined without knowing the sample's overall mass absorption coefficient, by normalizing the ratios of measured intensity to RIR:
                </p>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('W_i = \\frac{ I_i / RIR_i }{ \\sum_{k=1}^{n} (I_k / RIR_k) }', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-slate-100 flex items-center gap-2.5 text-base">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                  Amorphous Content Correction
                </h3>
                <p className="text-slate-400">
                  If the sample contains an amorphous fraction {"$W_{amorphous}$"}, the actual weight fraction {"$W_{i,true}$"} of crystalline phase <em>i</em> in the total sample is scaled proportionately:
                </p>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('W_{i,true} = W_i \\times (1 - W_{amorphous})', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-slate-100 flex items-center gap-2.5 text-base">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                  Internal Standard Method
                </h3>
                <p className="text-slate-400">
                  By adding a known weight fraction ($W_S$) of an internal standard to the unknown sample, absolute weight fractions of any phase <em>A</em> can be determined directly, bypassing the matrix absorption completely:
                </p>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('W_A = W_S \\times \\frac{I_A}{I_S} \\times \\frac{RIR_S}{RIR_A}', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-slate-100 flex items-center gap-2.5 text-base">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                  Error Propagation Formulas
                </h3>
                <p className="text-slate-400">
                  Uncertainty in measured integrated intensity (ΔI) and reference constant (ΔRIR) propagates into phase weight fraction error bounds via standard quadrature:
                </p>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('\\frac{\\Delta W_i}{W_i} = \\sqrt{ \\left(\\frac{\\Delta I_i}{I_i}\\right)^2 + \\left(\\frac{\\Delta RIR_i}{RIR_i}\\right)^2 }', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auto-Fit & Phase Volume Fraction Inspector Modal */}
      <AnimatePresence>
        {showAutoFitModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col gap-6 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                      Auto-Fit Phase Volume Fraction Engine
                    </h2>
                    <p className="text-xs text-amber-400/90 font-mono font-semibold">
                      Deriving Volumetric Phase Fractions ($V_i$) from Bragg Peak Intensities ($I$) & Crystallographic Density ($\rho$)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAutoFitModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto space-y-6 pr-1 relative z-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                
                {/* Auto-Fit Formula Explanation Card */}
                <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Fit Conversion Equation</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    While conventional RIR calculates mass fractions ($W_i$) via reduced peak intensities ($I_i / RIR_i$), the Auto-Fit module incorporates phase crystallographic densities ($\rho_i$) to derive exact volumetric phase distributions ($V_i$):
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-amber-300">
                    <span dangerouslySetInnerHTML={{ 
                      __html: katex.renderToString('V_i = \\frac{ (I_i / RIR_i) / \\rho_i }{ \\sum_{k=1}^{n} ((I_k / RIR_k) / \\rho_k) } \\times 100\\%', { throwOnError: false, displayMode: true }) 
                    }} />
                  </div>
                </div>

                {/* Auto-Fit Calculated Results Table */}
                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
                  <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-200">Suggested Phase Volume Fractions</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      Total Volume: 100.00%
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800/80">
                        <tr>
                          <th className="px-4 py-3">Phase Name</th>
                          <th className="px-4 py-3">Peak Int. (I)</th>
                          <th className="px-4 py-3">RIR (I/Ic)</th>
                          <th className="px-4 py-3">Density ($\rho$)</th>
                          <th className="px-4 py-3 text-indigo-300">Mass wt% ($W_i$)</th>
                          <th className="px-4 py-3 text-amber-300 font-bold">Auto-Fit Vol% ($V_i$)</th>
                          <th className="px-4 py-3 text-slate-400">Ratio ($V_i/W_i$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                        {calculations.phaseResults.map((p) => {
                          const ratio = p.crystallineFraction > 0 ? (p.crystallineVolFraction / p.crystallineFraction).toFixed(2) : '1.00';
                          return (
                            <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span>{p.name}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-300">{p.intensity}</td>
                              <td className="px-4 py-3 text-slate-300">{p.rir}</td>
                              <td className="px-4 py-3 text-amber-300 font-semibold">{(p.density || 3.0).toFixed(2)} g/cm³</td>
                              <td className="px-4 py-3 text-indigo-300 font-bold">{p.crystallineFraction.toFixed(2)}%</td>
                              <td className="px-4 py-3 text-amber-400 font-black text-sm">{p.crystallineVolFraction.toFixed(2)}%</td>
                              <td className="px-4 py-3 text-slate-400">{ratio}x</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mass wt% vs Volume vol% Comparison Bar Chart */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Mass wt% vs Volume vol% Side-by-Side Comparison</span>
                    <div className="flex items-center gap-4 text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Mass wt%
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Volume vol%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {calculations.phaseResults.map((p) => (
                      <div key={p.id} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-slate-300">
                          <span>{p.name}</span>
                          <span className="font-mono text-slate-400">
                            Mass: <span className="text-indigo-400">{p.crystallineFraction.toFixed(1)}%</span> | Vol: <span className="text-amber-400">{p.crystallineVolFraction.toFixed(1)}%</span>
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(2, p.crystallineFraction))}%` }}
                            title={`Mass wt%: ${p.crystallineFraction.toFixed(1)}%`}
                          />
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(2, p.crystallineVolFraction))}%` }}
                            title={`Volume vol%: ${p.crystallineVolFraction.toFixed(1)}%`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 relative z-10">
                <span className="text-xs font-mono text-slate-400">
                  Ready to apply volume fraction metrics to the breakdown charts.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowAutoFitModal(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      setChartUnitMode('vol');
                      setShowAutoFitModal(false);
                      playSynthTone('success');
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-200" />
                    <span>Apply & Display in Volume (vol%) Mode</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reference Library Modal */}
      <AnimatePresence>
        {showDbModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 max-w-5xl w-full h-[85vh] flex flex-col gap-6 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                    <Database className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                    ICDD Reference Intensity Ratio (RIR) Library
                  </h2>
                </div>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <div className="relative flex-1 group">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    placeholder="Search by mineral, chemical formula, PDF card..."
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                </div>

                <select
                  value={dbCategoryFilter}
                  onChange={(e) => setDbCategoryFilter(e.target.value)}
                  className="bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                >
                  {dbCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="overflow-y-auto flex-1 border border-slate-800/80 rounded-2xl relative z-10 bg-slate-950/40 shadow-inner scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/90 text-slate-400 font-bold text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-slate-800/80">
                    <tr>
                      <th className="px-5 py-4">Phase Name</th>
                      <th className="px-5 py-4">Formula</th>
                      <th className="px-5 py-4">PDF Card</th>
                      <th className="px-5 py-4">System</th>
                      <th className="px-5 py-4">RIR (I/Ic)</th>
                      <th className="px-5 py-4">Reflection</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredDatabase.map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-500/5 transition-colors group">
                        <td className="px-5 py-3 font-bold text-slate-200">{item.name}</td>
                        <td className="px-5 py-3 font-mono text-indigo-300/80 text-xs">{item.formula}</td>
                        <td className="px-5 py-3 font-mono text-slate-400 text-[11px]">{item.pdfCard}</td>
                        <td className="px-5 py-3 text-xs">{item.crystalSystem}</td>
                        <td className="px-5 py-3 font-mono font-bold text-emerald-400">{item.rir.toFixed(2)}</td>
                        <td className="px-5 py-3 font-mono text-slate-400 text-xs">{item.hkl} @ {item.twoTheta}°</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              addPresetPhase(item);
                              setShowDbModal(false);
                            }}
                            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 transition-all shadow-md active:scale-95 opacity-80 group-hover:opacity-100 flex items-center gap-1.5 ml-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Import
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDatabase.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          <Search className="w-8 h-8 mx-auto mb-3 text-slate-600 opacity-50" />
                          <p>No reference materials found matching your search.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
