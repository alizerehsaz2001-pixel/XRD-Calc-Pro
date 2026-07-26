import React, { useState, useMemo, useRef } from 'react';
import { 
  Layers, Activity, FlaskConical, Download, Plus, Trash2, 
  FileSpreadsheet, Calculator, Info, Sparkles, RefreshCw, 
  BarChart3, PieChart as PieChartIcon, Check, BookOpen, Scale,
  Search, Upload, FileText, ArrowRightLeft, Database, HelpCircle,
  Eye, Sliders, Play
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, ReferenceLine
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
  category: string;
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
  { name: 'Corundum (α-Al₂O₃)', formula: 'Al₂O₃', pdfCard: '01-070-5679', crystalSystem: 'Trigonal', rir: 1.00, hkl: '(113)', twoTheta: 43.36, macCu: 31.8, category: 'Reference Standards' },
  { name: 'Quartz (α-SiO₂)', formula: 'SiO₂', pdfCard: '01-085-0795', crystalSystem: 'Trigonal', rir: 3.60, hkl: '(101)', twoTheta: 26.64, macCu: 34.9, category: 'Minerals' },
  { name: 'Rutile (TiO₂)', formula: 'TiO₂', pdfCard: '01-076-0317', crystalSystem: 'Tetragonal', rir: 3.40, hkl: '(110)', twoTheta: 27.44, macCu: 118.2, category: 'Oxides' },
  { name: 'Anatase (TiO₂)', formula: 'TiO₂', pdfCard: '01-071-1166', crystalSystem: 'Tetragonal', rir: 3.30, hkl: '(101)', twoTheta: 25.28, macCu: 118.2, category: 'Oxides' },
  { name: 'Calcite (CaCO₃)', formula: 'CaCO₃', pdfCard: '01-072-1650', crystalSystem: 'Trigonal', rir: 2.00, hkl: '(104)', twoTheta: 29.40, macCu: 76.4, category: 'Carbonates' },
  { name: 'Dolomite (CaMg(CO₃)₂)', formula: 'CaMg(CO₃)₂', pdfCard: '01-073-2405', crystalSystem: 'Trigonal', rir: 2.50, hkl: '(104)', twoTheta: 30.94, macCu: 58.1, category: 'Carbonates' },
  { name: 'Magnetite (Fe₃O₄)', formula: 'Fe₃O₄', pdfCard: '01-089-0688', crystalSystem: 'Cubic', rir: 4.80, hkl: '(311)', twoTheta: 35.42, macCu: 208.5, category: 'Oxides' },
  { name: 'Hematite (α-Fe₂O₃)', formula: 'Fe₂O₃', pdfCard: '01-089-0599', crystalSystem: 'Trigonal', rir: 2.70, hkl: '(104)', twoTheta: 33.15, macCu: 211.2, category: 'Oxides' },
  { name: 'Fluorite (CaF₂)', formula: 'CaF₂', pdfCard: '01-075-0009', crystalSystem: 'Cubic', rir: 3.20, hkl: '(111)', twoTheta: 28.27, macCu: 96.3, category: 'Halides' },
  { name: 'Silicon (Si)', formula: 'Si', pdfCard: '00-027-1402', crystalSystem: 'Cubic', rir: 4.70, hkl: '(111)', twoTheta: 28.44, macCu: 60.8, category: 'Elements' },
  { name: 'Halite (NaCl)', formula: 'NaCl', pdfCard: '01-075-0306', crystalSystem: 'Cubic', rir: 4.20, hkl: '(200)', twoTheta: 31.69, macCu: 74.3, category: 'Halides' },
  { name: 'Gypsum (CaSO₄·2H₂O)', formula: 'CaSO₄·2H₂O', pdfCard: '01-074-1433', crystalSystem: 'Monoclinic', rir: 1.80, hkl: '(020)', twoTheta: 11.63, macCu: 52.8, category: 'Sulfates' },
  { name: 'Anhydrite (CaSO₄)', formula: 'CaSO₄', pdfCard: '01-072-0916', crystalSystem: 'Orthorhombic', rir: 2.10, hkl: '(020)', twoTheta: 25.44, macCu: 66.5, category: 'Sulfates' },
  { name: 'Monoclinic Zirconia (ZrO₂)', formula: 'ZrO₂', pdfCard: '01-083-0944', crystalSystem: 'Monoclinic', rir: 2.50, hkl: '(-111)', twoTheta: 28.18, macCu: 142.1, category: 'Oxides' },
  { name: 'Zincite (ZnO)', formula: 'ZnO', pdfCard: '01-079-0208', crystalSystem: 'Hexagonal', rir: 5.20, hkl: '(101)', twoTheta: 36.25, macCu: 124.6, category: 'Oxides' },
  { name: 'Alite / C3S (Ca₃SiO₅)', formula: 'Ca₃SiO₅', pdfCard: '00-049-0442', crystalSystem: 'Monoclinic', rir: 1.20, hkl: '(202)', twoTheta: 32.20, macCu: 78.5, category: 'Cement Clinker' },
  { name: 'Belite / C2S (Ca₂SiO₄)', formula: 'Ca₂SiO₄', pdfCard: '00-033-0302', crystalSystem: 'Monoclinic', rir: 1.10, hkl: '(102)', twoTheta: 32.60, macCu: 75.1, category: 'Cement Clinker' },
  { name: 'Aluminate / C3A (Ca₃Al₂O₆)', formula: 'Ca₃Al₂O₆', pdfCard: '00-038-1429', crystalSystem: 'Cubic', rir: 1.40, hkl: '(440)', twoTheta: 33.18, macCu: 69.4, category: 'Cement Clinker' },
  { name: 'Ferrite / C4AF (Ca₂AlFeO₅)', formula: 'Ca₂AlFeO₅', pdfCard: '00-030-0226', crystalSystem: 'Orthorhombic', rir: 2.10, hkl: '(141)', twoTheta: 33.80, macCu: 122.3, category: 'Cement Clinker' },
  { name: 'Hydroxyapatite (Ca₅(PO₄)₃OH)', formula: 'Ca₅(PO₄)₃OH', pdfCard: '01-074-0565', crystalSystem: 'Hexagonal', rir: 1.50, hkl: '(211)', twoTheta: 31.77, macCu: 62.4, category: 'Biomaterials' },
  { name: 'β-TCP (Ca₃(PO₄)₂)', formula: 'Ca₃(PO₄)₂', pdfCard: '00-009-0169', crystalSystem: 'Trigonal', rir: 1.30, hkl: '(0210)', twoTheta: 31.02, macCu: 61.2, category: 'Biomaterials' },
  { name: 'Microcline (KAlSi₃O₈)', formula: 'KAlSi₃O₈', pdfCard: '01-071-1540', crystalSystem: 'Triclinic', rir: 1.10, hkl: '(002)', twoTheta: 27.50, macCu: 41.2, category: 'Feldspars' },
  { name: 'Albite (NaAlSi₃O₈)', formula: 'NaAlSi₃O₈', pdfCard: '01-071-1150', crystalSystem: 'Triclinic', rir: 1.20, hkl: '(002)', twoTheta: 27.90, macCu: 32.5, category: 'Feldspars' },
  { name: 'Biotite Mica', formula: 'K(Mg,Fe)₃AlSi₃O₁₀(OH)₂', pdfCard: '00-010-0493', crystalSystem: 'Monoclinic', rir: 1.80, hkl: '(001)', twoTheta: 8.85, macCu: 88.0, category: 'Micas' },
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

  // Calibration estimator state
  const [calibIntensityA, setCalibIntensityA] = useState(3200);
  const [calibIntensityB, setCalibIntensityB] = useState(1000);
  const [calibRIRB, setCalibRIRB] = useState(1.0); // Corundum standard
  const [calibWeightRatioAB, setCalibWeightRatioAB] = useState(3.2); // W_A / W_B ratio

  // Search & Filter state for Reference DB
  const [dbSearch, setDbSearch] = useState('');
  const [dbCategoryFilter, setDbCategoryFilter] = useState('All');
  const [showDbModal, setShowDbModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'charts' | 'stick' | 'mac' | 'theory'>('charts');

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

    const amorphousFactor = (100 - Math.min(99, Math.max(0, amorphousWtPct))) / 100;

    const phaseResults = phases.map((p, idx) => {
      const match = reducedIntensities.find(r => r.id === p.id);
      const rI = match ? match.rI : 0;
      
      // Normalized crystalline weight fraction (%)
      const crystallineFraction = totalReducedIntensity > 0 ? (rI / totalReducedIntensity) * 100 : 0;
      
      // Total sample weight fraction considering amorphous content
      const totalSampleFraction = crystallineFraction * amorphousFactor;

      // Accumulate for sample MAC
      weightedMacSum += (crystallineFraction / 100) * (p.mac || 50.0);

      return {
        ...p,
        reducedIntensity: rI,
        crystallineFraction,
        totalSampleFraction,
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
      phaseResults: internalStandardResults,
      amorphousFactor,
      totalSampleMAC
    };
  }, [phases, amorphousWtPct, internalStandardMode, standardPhaseId, standardAddedWtPct]);

  // Calibrated RIR calculation
  const calculatedCalibRIR = useMemo(() => {
    if (calibIntensityB <= 0 || calibWeightRatioAB <= 0) return 0;
    return calibRIRB * (calibIntensityA / calibIntensityB) * (1 / calibWeightRatioAB);
  }, [calibIntensityA, calibIntensityB, calibRIRB, calibWeightRatioAB]);

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
    // Generate peaks sorted by 2Theta
    const sortedPhases = [...calculations.phaseResults].sort((a, b) => a.twoTheta - b.twoTheta);
    
    // Create stick points with line pairs
    const points: any[] = [];
    sortedPhases.forEach(p => {
      points.push({
        twoTheta: p.twoTheta,
        intensity: p.intensity,
        reducedIntensity: p.reducedIntensity,
        name: p.name,
        hkl: p.hkl,
        color: p.color
      });
    });

    return points;
  }, [calculations]);

  // Chart data for Pie
  const pieChartData = useMemo(() => {
    const data = calculations.phaseResults.map(p => ({
      name: p.name,
      value: Number(p.crystallineFraction.toFixed(2)),
      color: p.color,
      rir: p.rir,
      intensity: p.intensity
    }));

    if (amorphousWtPct > 0) {
      data.push({
        name: 'Amorphous Phase',
        value: Number(amorphousWtPct.toFixed(2)),
        color: '#64748b',
        rir: 0,
        intensity: 0
      });
    }

    return data;
  }, [calculations, amorphousWtPct]);

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
    
    csvContent += `Phase Name,Reflection (hkl),2-Theta (deg),Integrated Intensity (I),RIR (I/Ic),MAC (cm2/g),Reduced Intensity (I/RIR),Crystalline Wt (%),Total Sample Wt (%),Notes\n`;

    calculations.phaseResults.forEach(p => {
      const nameEscaped = `"${p.name.replace(/"/g, '""')}"`;
      const hklEscaped = `"${p.hkl.replace(/"/g, '""')}"`;
      const notesEscaped = `"${(p.notes || '').replace(/"/g, '""')}"`;
      csvContent += `${nameEscaped},${hklEscaped},${p.twoTheta},${p.intensity},${p.rir},${p.mac || 0},${p.reducedIntensity.toFixed(2)},${p.crystallineFraction.toFixed(2)},${p.totalSampleFraction.toFixed(2)},${notesEscaped}\n`;
    });

    csvContent += `\n`;
    csvContent += `Sum Total,---,---,---,---,${calculations.totalSampleMAC.toFixed(2)},${calculations.totalReducedIntensity.toFixed(2)},100.00,${(100 - amorphousWtPct).toFixed(2)},---\n`;

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
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                  {t('Reference Intensity Ratio')} (RIR)
                </h1>
                <p className="text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase">
                  Chung Adiabatic & Internal Standard Quantitative Phase Engine
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed mt-1">
              {t('Perform fast quantitative XRD phase analysis using reference intensity ratio ($I/I_c$) constants. Features amorphous content scaling, internal standard calibration, mass absorption calculations, and stick spectrum visualization.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDbModal(true)}
              className="px-3.5 py-2 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/30 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Reference DB</span>
            </button>

            <button
              onClick={exportCSV}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={exportJSON}
              className="px-3.5 py-2 text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Save Session</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Load Saved JSON Session"
            >
              <Upload className="w-4 h-4 text-slate-400" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleJSONImport} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>
      </div>

      {/* Preset Mixture Scenarios Selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Load Benchmarking Laboratory Mixture Scenario</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {MIXTURE_SCENARIOS.map((scen, sIdx) => (
            <button
              key={sIdx}
              onClick={() => loadScenario(scen)}
              className="p-3 bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="font-bold text-slate-200 text-xs block group-hover:text-indigo-300 transition-colors">
                  {scen.name}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight block mt-1 line-clamp-2">
                  {scen.description}
                </span>
              </div>
              <span className="mt-2 text-[9px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 self-start">
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-slate-200">
                  {t('Crystalline Mixture Components')}
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                  {phases.length} {phases.length === 1 ? 'Phase' : 'Phases'}
                </span>
              </div>

              <button
                onClick={addPhase}
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Phase')}</span>
              </button>
            </div>

            {/* List of Phases */}
            <div className="space-y-3">
              <AnimatePresence>
                {phases.map((phase, idx) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3 relative group/phase hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/50 pb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span 
                          className="w-5 h-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: phase.color || COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                        >
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                          className="bg-transparent font-bold text-slate-100 text-sm focus:bg-slate-900 border border-transparent focus:border-slate-700 rounded px-2 py-1 outline-none w-full max-w-xs transition-colors"
                          placeholder="Phase Name"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          RIR: {phase.rir}
                        </span>
                        {phases.length > 1 && (
                          <button
                            onClick={() => removePhase(phase.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Remove Phase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          Peak Int. (I)
                        </label>
                        <input
                          type="number"
                          value={phase.intensity || ''}
                          onChange={(e) => updatePhase(phase.id, 'intensity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          RIR (I/Ic)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={phase.rir || ''}
                          onChange={(e) => updatePhase(phase.id, 'rir', parseFloat(e.target.value) || 0.01)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          Reflection (hkl)
                        </label>
                        <input
                          type="text"
                          value={phase.hkl}
                          onChange={(e) => updatePhase(phase.id, 'hkl', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          2θ Angle (°)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={phase.twoTheta || ''}
                          onChange={(e) => updatePhase(phase.id, 'twoTheta', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          MAC (cm²/g)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={phase.mac || ''}
                          onChange={(e) => updatePhase(phase.id, 'mac', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Quick Add Preset Bar */}
            <div className="mt-5 border-t border-slate-800/80 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Quick Add Minerals / Standards</span>
                </label>
                <button
                  onClick={() => setShowDbModal(true)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  View Full Library ({DATABASE_PRESETS.length}) →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {DATABASE_PRESETS.slice(0, 10).map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => addPresetPhase(preset)}
                    className="text-[11px] bg-slate-950 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5 group/preset"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1 rounded">
                      {preset.rir}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amorphous & Internal Standard Corrections */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Amorphous Matrix & Internal Standard Corrections</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-300">Amorphous Phase (wt%)</label>
                  <span className="font-mono text-emerald-400 font-bold">{amorphousWtPct}%</span>
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

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
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
                  <div className="space-y-2 pt-1">
                    <select
                      value={standardPhaseId}
                      onChange={(e) => setStandardPhaseId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                    >
                      {phases.map(p => (
                        <option key={p.id} value={p.id}>Standard: {p.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Added Std Wt%:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={standardAddedWtPct}
                        onChange={(e) => setStandardAddedWtPct(parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 font-mono outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics, Charts & Calibration (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Tab Selection Navigation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 backdrop-blur-md flex gap-1">
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'charts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Distribution</span>
            </button>

            <button
              onClick={() => setActiveTab('stick')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'stick' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Peak Sticks</span>
            </button>

            <button
              onClick={() => setActiveTab('mac')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'mac' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>MAC / Calibration</span>
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'theory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Theory</span>
            </button>
          </div>

          {/* TAB 1: Pie & Bar Charts */}
          {activeTab === 'charts' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-200">
                    Phase Composition Breakdown
                  </h2>
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
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs">
                              <span className="font-bold text-slate-200 block">{data.name}</span>
                              <span className="text-indigo-400 font-mono font-bold block mt-1">
                                Mass Fraction: {data.value}%
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

              {/* Numerical List */}
              <div className="space-y-2.5">
                {calculations.phaseResults.map((p, pIdx) => (
                  <div key={p.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: p.color }}
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">I/RIR: {p.reducedIntensity.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-indigo-400 text-sm block">
                        {p.crystallineFraction.toFixed(1)}%
                      </span>
                      {amorphousWtPct > 0 && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          Tot: {p.totalSampleFraction.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Peak Sticks Diagram */}
          {activeTab === 'stick' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-200">
                    Simulated Stick Diffraction Diagram
                  </h2>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Peak reflections plotted at $2\theta$ angles with height equal to raw integrated intensity ($I$).
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulatedPeakSticks} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="twoTheta" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickFormatter={(v) => `${v}°`} 
                    />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs">
                              <span className="font-bold text-slate-200 block">{data.name}</span>
                              <span className="text-slate-400 text-[10px] block">Reflection: {data.hkl}</span>
                              <span className="text-indigo-400 font-mono font-bold block mt-1">
                                2θ: {data.twoTheta}° | Intensity: {data.intensity}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                      {simulatedPeakSticks.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: MAC & Calibration */}
          {activeTab === 'mac' && (
            <div className="flex flex-col gap-6">
              
              {/* Sample Mass Absorption Summary */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-200">
                    Sample Mass Attenuation Coefficient (Cu Kα)
                  </h2>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">Total Sample μ*</span>
                    <span className="text-[10px] text-slate-500">Weighted average matrix absorption</span>
                  </div>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {calculations.totalSampleMAC.toFixed(1)} <span className="text-xs text-slate-500">cm²/g</span>
                  </span>
                </div>
              </div>

              {/* RIR Calibration Tool */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Binary RIR Constant Calibration
                  </h2>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Calculate the unknown RIR value for a newly synthesized material by measuring a known 1:1 or binary mass ratio mixture against a reference standard phase.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Analyte Int. (I_A)
                    </label>
                    <input
                      type="number"
                      value={calibIntensityA}
                      onChange={(e) => setCalibIntensityA(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1.5 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Std Int. (I_B)
                    </label>
                    <input
                      type="number"
                      value={calibIntensityB}
                      onChange={(e) => setCalibIntensityB(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1.5 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Std RIR (I/Ic)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calibRIRB}
                      onChange={(e) => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1.5 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Known W_A / W_B Ratio
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calibWeightRatioAB}
                      onChange={(e) => setCalibWeightRatioAB(parseFloat(e.target.value) || 1.0)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1.5 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-300">Calibrated RIR_A Value</span>
                  <span className="text-lg font-mono font-black text-indigo-400">
                    {calculatedCalibRIR.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TAB 4: Theory Modal or Inline */}
      {activeTab === 'theory' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col gap-4 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  Quantitative Phase Analysis Theory
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('charts')}
                className="text-slate-400 hover:text-slate-200 p-1 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
              <section className="space-y-3">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  The Reference Intensity Ratio (RIR) Method
                </h3>
                <p>
                  The reference intensity ratio ($I/I_c$) is a universal constant defining the ratio of the strongest diffraction peak intensity of phase <em>A</em> to the strongest peak of a reference standard (typically Corundum, $\alpha$-Al₂O₃) in a 1:1 mixture by weight.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('RIR_A = \\frac{I_A}{I_c} \\quad (W_A = W_c)', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Chung's Adiabatic Method (Matrix Flushing)
                </h3>
                <p>
                  For a mixture containing <em>n</em> crystalline phases (assuming no amorphous content initially), the weight fraction $W_i$ of each component can be determined without knowing the sample's overall mass absorption coefficient, by normalizing the ratios of measured intensity to RIR:
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('W_i = \\frac{ I_i / RIR_i }{ \\sum_{k=1}^{n} (I_k / RIR_k) }', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Amorphous Content Correction
                </h3>
                <p>
                  If the sample contains an amorphous fraction {"$W_{amorphous}$"}, the actual weight fraction {"$W_{i,true}$"} of crystalline phase <em>i</em> in the total sample is scaled proportionately:
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('W_{i,true} = W_i \\times (1 - W_{amorphous})', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Internal Standard Method
                </h3>
                <p>
                  By adding a known weight fraction ($W_S$) of an internal standard to the unknown sample, absolute weight fractions of any phase <em>A</em> can be determined directly, bypassing the matrix absorption completely:
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-center flex justify-center">
                  <span dangerouslySetInnerHTML={{ __html: katex.renderToString('W_A = W_S \\times \\frac{I_A}{I_S} \\times \\frac{RIR_S}{RIR_A}', { throwOnError: false, displayMode: true }) }} />
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reference Library Modal */}
      <AnimatePresence>
        {showDbModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col gap-4 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-100">
                    ICDD Reference Intensity Ratio (RIR) Library
                  </h2>
                </div>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 text-xl"
                >
                  ×
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    placeholder="Search by mineral, chemical formula, PDF card..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={dbCategoryFilter}
                  onChange={(e) => setDbCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  {dbCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="p-3">Phase Name</th>
                      <th className="p-3">Formula</th>
                      <th className="p-3">PDF Card</th>
                      <th className="p-3">System</th>
                      <th className="p-3">RIR (I/Ic)</th>
                      <th className="p-3">Reflection</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredDatabase.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-200">{item.name}</td>
                        <td className="p-3 font-mono text-indigo-300">{item.formula}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{item.pdfCard}</td>
                        <td className="p-3">{item.crystalSystem}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{item.rir}</td>
                        <td className="p-3 font-mono text-slate-400">{item.hkl} @ {item.twoTheta}°</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              addPresetPhase(item);
                              setShowDbModal(false);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                          >
                            + Import
                          </button>
                        </td>
                      </tr>
                    ))}
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
