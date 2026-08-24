import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Activity,
  FlaskConical,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet,
  Calculator,
  Info,
  Sparkles,
  RefreshCw,
  RotateCcw,
  BarChart3,
  PieChart as PieChartIcon,
  Check,
  BookOpen,
  Scale,
  Search,
  Upload,
  FileText,
  Database,
  HelpCircle,
  Eye,
  Sliders,
  Play,
  Copy,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Share2,
  Code2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { playSynthTone } from '../utils/sound';
import { RIRMatrixInspector, RIRMatrixPhase } from './rir/RIRMatrixInspector';
import { RIRCalibrationStudio } from './rir/RIRCalibrationStudio';
import { RIRDiffractionVisualizer } from './rir/RIRDiffractionVisualizer';
import { RIRDatabaseExplorer, RIRDatabaseItem, DATABASE_PRESETS } from './rir/RIRDatabaseExplorer';
import { RIRTheoryGuide } from './rir/RIRTheoryGuide';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

export interface RIRPhase extends RIRMatrixPhase {
  notes?: string;
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

const MIXTURE_SCENARIOS = [
  {
    name: 'Titania Photocatalyst Blend',
    description: 'Biphasic Anatase & Rutile nanoparticle synthesis mixture',
    amorphous: 5,
    phases: [
      { name: 'Anatase (TiO₂)', hkl: '(101)', twoTheta: 25.28, intensity: 7800, rir: 3.30, mac: 118.2, density: 3.89, notes: 'Photocatalytic phase' },
      { name: 'Rutile (TiO₂)', hkl: '(110)', twoTheta: 27.44, intensity: 2100, rir: 3.40, mac: 118.2, density: 4.23, notes: 'Thermally stable phase' },
    ]
  },
  {
    name: 'Portland Cement Clinker',
    description: 'Industrial anhydrous clinker phase distribution',
    amorphous: 2,
    phases: [
      { name: 'Alite / C3S (Ca₃SiO₅)', hkl: '(202)', twoTheta: 32.20, intensity: 6500, rir: 1.20, mac: 78.5, density: 3.15, notes: 'Primary hydraulic phase' },
      { name: 'Belite / C2S (Ca₂SiO₄)', hkl: '(102)', twoTheta: 32.60, intensity: 2200, rir: 1.10, mac: 75.1, density: 3.28, notes: 'Late strength provider' },
      { name: 'Aluminate / C3A', hkl: '(440)', twoTheta: 33.18, intensity: 1100, rir: 1.40, mac: 69.4, density: 3.03, notes: 'Rapid hydration phase' },
      { name: 'Ferrite / C4AF', hkl: '(141)', twoTheta: 33.80, intensity: 1800, rir: 2.10, mac: 122.3, density: 3.77, notes: 'Tetracalcium aluminoferrite' }
    ]
  },
  {
    name: 'Granite Rock Mineralogy',
    description: 'Igneous rock quantitative modal analysis with silica',
    amorphous: 0,
    phases: [
      { name: 'Quartz (α-SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 9200, rir: 3.60, mac: 34.9, density: 2.65, notes: 'Free silica' },
      { name: 'Microcline (K-Feldspar)', hkl: '(002)', twoTheta: 27.50, intensity: 3100, rir: 1.10, mac: 41.2, density: 2.56, notes: 'Potassium feldspar' },
      { name: 'Albite (Plagioclase)', hkl: '(002)', twoTheta: 27.90, intensity: 2400, rir: 1.20, mac: 32.5, density: 2.62, notes: 'Sodium plagioclase' },
      { name: 'Biotite Mica', hkl: '(001)', twoTheta: 8.85, intensity: 850, rir: 1.80, mac: 88.0, density: 3.09, notes: 'Sheet silicate' }
    ]
  },
  {
    name: 'Bone & Biomaterial Ceramic',
    description: 'Biphasic calcium phosphate (BCP) bone graft scaffold',
    amorphous: 10,
    phases: [
      { name: 'Hydroxyapatite (HA)', hkl: '(211)', twoTheta: 31.77, intensity: 8200, rir: 1.50, mac: 62.4, density: 3.16, notes: 'Osteoconductive matrix' },
      { name: 'β-TCP', hkl: '(0210)', twoTheta: 31.02, intensity: 2900, rir: 1.30, mac: 61.2, density: 3.14, notes: 'Bioresorbable phase' }
    ]
  },
  {
    name: 'Iron Ore Sintering Powder',
    description: 'Mining ore feed with oxides, carbonates and silica',
    amorphous: 0,
    phases: [
      { name: 'Hematite (α-Fe₂O₃)', hkl: '(104)', twoTheta: 33.15, intensity: 10500, rir: 2.70, mac: 211.2, density: 5.26, notes: 'Primary iron ore' },
      { name: 'Magnetite (Fe₃O₄)', hkl: '(311)', twoTheta: 35.42, intensity: 4800, rir: 4.80, mac: 208.5, density: 5.18, notes: 'Secondary spinelloid' },
      { name: 'Quartz (SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 1800, rir: 3.60, mac: 34.9, density: 2.65, notes: 'Gangue mineral' },
      { name: 'Calcite (CaCO₃)', hkl: '(104)', twoTheta: 29.40, intensity: 2200, rir: 2.00, mac: 76.4, density: 2.71, notes: 'Fluxing agent' }
    ]
  }
];

export const ReferenceIntensityRatioModule: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phases, setPhases] = useState<RIRPhase[]>([
    { id: '1', name: 'Quartz (α-SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 8500, rir: 3.60, density: 2.65, mac: 34.9, notes: 'Primary Silica Phase', color: COLOR_PALETTE[0] },
    { id: '2', name: 'Calcite (CaCO₃)', hkl: '(104)', twoTheta: 29.40, intensity: 4200, rir: 2.00, density: 2.71, mac: 76.4, notes: 'Matrix Mineral', color: COLOR_PALETTE[1] },
    { id: '3', name: 'Corundum (α-Al₂O₃)', hkl: '(113)', twoTheta: 43.36, intensity: 1500, rir: 1.00, density: 3.98, mac: 31.8, notes: 'Added Internal Standard (10 wt%)', color: COLOR_PALETTE[2] },
  ]);

  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState(-1);

  const [mainTab, setMainTab] = useState<'analysis' | 'matrix' | 'calibration' | 'spectrum' | 'database' | 'theory'>('analysis');
  const [amorphousWtPct, setAmorphousWtPct] = useState<number>(0);
  const [internalStandardMode, setInternalStandardMode] = useState<boolean>(false);
  const [standardPhaseId, setStandardPhaseId] = useState<string>('3');
  const [standardAddedWtPct, setStandardAddedWtPct] = useState<number>(10.0);

  // Uncertainty Estimator State
  const [intensityUncertaintyPct, setIntensityUncertaintyPct] = useState<number>(3.0);
  const [rirUncertaintyPct, setRirUncertaintyPct] = useState<number>(5.0);
  const [chartUnitMode, setChartUnitMode] = useState<'wt' | 'vol'>('wt');
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  // Compute flow
  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 600);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 1200);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('tick');
    }, 1800);
    setTimeout(() => {
      setAppState('results');
      playSynthTone('success');
    }, 2400);
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

  // Add Preset from Database
  const addPresetPhase = (preset: RIRDatabaseItem) => {
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
    setActionNotification(`Added ${preset.name} to mixture.`);
    setTimeout(() => setActionNotification(null), 3000);
  };

  // Load Preset Scenario
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
      density: p.density || 3.0,
      mac: p.mac,
      notes: p.notes,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }));
    setPhases(loadedPhases);
    setActionNotification(`Loaded "${scenario.name}" scenario!`);
    setTimeout(() => setActionNotification(null), 3000);
  };

  const updatePhase = (id: string, field: keyof RIRPhase, value: string | number) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePhase = (id: string) => {
    playSynthTone('tick');
    setPhases(prev => prev.filter(p => p.id !== id));
  };

  // Normalize peak intensities
  const normalizeIntensities = () => {
    if (phases.length === 0) return;
    playSynthTone('success');
    const maxInt = Math.max(...phases.map(p => p.intensity || 0));
    if (maxInt <= 0) return;
    setPhases(prev => prev.map(p => ({
      ...p,
      intensity: Math.round(((p.intensity || 0) / maxInt) * 10000)
    })));
    setActionNotification('Normalized Bragg peak intensities to 10,000 max.');
    setTimeout(() => setActionNotification(null), 3000);
  };

  // Apply Calibrated RIR
  const handleApplyCalibratedRIR = (targetId: string, calibratedRIRValue: number) => {
    playSynthTone('success');
    updatePhase(targetId, 'rir', calibratedRIRValue);
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

    const relErrI = (intensityUncertaintyPct || 0) / 100;
    const relErrRIR = (rirUncertaintyPct || 0) / 100;
    const baseRelError = Math.sqrt(relErrI * relErrI + relErrRIR * relErrRIR);

    const phaseResults = phases.map((p, idx) => {
      const match = reducedIntensities.find(r => r.id === p.id);
      const rI = match ? match.rI : 0;

      const crystallineFraction = totalReducedIntensity > 0 ? (rI / totalReducedIntensity) * 100 : 0;
      const totalSampleFraction = crystallineFraction * amorphousFactor;

      const vMatch = volumeFactors.find(v => v.id === p.id);
      const rho = vMatch ? vMatch.rho : (p.density || 3.0);
      const crystallineVolFraction = totalVolumeFactor > 0 ? ((rI / rho) / totalVolumeFactor) * 100 : 0;
      const totalSampleVolFraction = crystallineVolFraction * amorphousFactor;

      const errMarginCrystalline = crystallineFraction * baseRelError;
      const errMarginTotal = totalSampleFraction * baseRelError;
      const errMarginVol = crystallineVolFraction * baseRelError;

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

    const totalSampleMAC = (weightedMacSum * amorphousFactor) + ((amorphousWtPct / 100) * 30.0);

    return {
      totalReducedIntensity,
      totalVolumeFactor,
      phaseResults,
      amorphousFactor,
      totalSampleMAC
    };
  }, [phases, amorphousWtPct, intensityUncertaintyPct, rirUncertaintyPct]);

  const dominantPhase = useMemo(() => {
    if (!calculations.phaseResults || calculations.phaseResults.length === 0) return null;
    return [...calculations.phaseResults].sort((a, b) => b.crystallineFraction - a.crystallineFraction)[0];
  }, [calculations]);

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
        name: 'Amorphous Matrix',
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

  // Copy Summary Report
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
    if (amorphousWtPct > 0) {
      report += `Amorphous Matrix        | ---   | ---     | ---     | ---   | ---     | ${amorphousWtPct.toFixed(1)} wt%         | ${amorphousWtPct.toFixed(1)} vol%\n`;
    }
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
    csvContent += `# Total Sample Mass Attenuation Coeff (Cu K-alpha): ${calculations.totalSampleMAC.toFixed(2)} cm2/g\n\n`;

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
      version: '2.0',
      timestamp: new Date().toISOString(),
      amorphousWtPct,
      intensityUncertaintyPct,
      rirUncertaintyPct,
      phases,
      calculations: {
        totalReducedIntensity: calculations.totalReducedIntensity,
        totalSampleMAC: calculations.totalSampleMAC,
        phaseResults: calculations.phaseResults
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
          if (data.intensityUncertaintyPct !== undefined) setIntensityUncertaintyPct(data.intensityUncertaintyPct);
          if (data.rirUncertaintyPct !== undefined) setRirUncertaintyPct(data.rirUncertaintyPct);
          playSynthTone('success');
          setActionNotification('Successfully imported RIR session file.');
          setTimeout(() => setActionNotification(null), 3000);
        }
      } catch (err) {
        playSynthTone('error');
        alert('Invalid RIR session JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const rirWalkthroughSteps: WizardStep[] = [
    {
      title: 'Define Crystalline Phases & Corundum Scaling (I/I_cor)',
      subtitle: 'Chung’s Generalized Normalization Matrix',
      explanation: 'Every phase is characterized by its reference intensity ratio RIR = I_phase / I_corundum measured against standard α-Al₂O₃ (50:50 wt% mixture). Reduced intensity is defined as r_i = I_i / RIR_i.',
      tip: 'The standard 100% peak intensity must be used; if secondary reflections are used, scale by the relative peak intensity factor (I_rel / 100).'
    },
    {
      title: 'Weight Fraction Extraction (Chung Normalization)',
      subtitle: 'w_i = (I_i / RIR_i) / ∑ (I_j / RIR_j)',
      explanation: 'In the Chung adiabatic method without internal standard, the sum of all crystalline phase weight fractions is constrained to 100%: w_i = r_i / ∑ r_j. No absorption coefficient measurement is necessary.',
      tip: 'Ensure that all crystalline phases present in the pattern are included in the summation.'
    },
    {
      title: 'Amorphous Content Correction (Spiking or PONKCS)',
      subtitle: 'Internal Standard or Direct Background Subtraction',
      explanation: 'If an amorphous halo (glass, polymer, disordered binder) is present, the true total sample weight fractions are scaled: w_total,i = w_cryst,i · (1 - w_amorphous).',
      tip: 'Spiking with 10–20 wt% highly crystalline Corundum standard allows direct measurement of the amorphous weight fraction.'
    },
    {
      title: 'Mass Attenuation Coefficient (MAC) & Volume Conversions',
      subtitle: 'V_i = (w_i / ρ_i) / ∑ (w_j / ρ_j)',
      explanation: 'Converts quantitative weight percentages into phase volume fractions using theoretical crystallographic densities ρ (g/cm³) and computes the effective linear absorption coefficient μ.',
      tip: 'Volume fraction is critical for mechanical and thermal property prediction in multiphase ceramics and composite alloys.'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Reference Intensity Ratio (RIR) & Chung Quantitative Engine"
        description="Master Corundum scaling factors (I/I_cor), adiabatic Chung normalization, amorphous fraction correction, and phase volume fractions."
        steps={rirWalkthroughSteps}
        presetNames={MIXTURE_SCENARIOS.map(p => p.name)}
        onLoadBenchmarkPreset={(idx) => {
          const p = MIXTURE_SCENARIOS[idx];
          if (p && p.phases) {
            setPhases(p.phases.map((ph, i) => ({
              id: String(i + 1),
              name: ph.name,
              hkl: ph.hkl || '100',
              twoTheta: ph.twoTheta || 25.0,
              intensity: ph.intensity || 1000,
              rir: ph.rir || 1.0,
              density: ph.density || 3.0,
              mac: ph.mac || 45.0,
              notes: ph.notes,
              color: COLOR_PALETTE[i % COLOR_PALETTE.length]
            })));
            setAmorphousWtPct(p.amorphous || 0);
          }
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      {dominantPhase && (
        <PhysicalMeaningSummary
          title="Quantitative Phase Composition Verdict"
          tone={amorphousWtPct > 20 ? 'warning' : 'success'}
          statement={`Sample is dominantly composed of ${dominantPhase.name} at ${dominantPhase.crystallineFraction.toFixed(1)} wt% (crystalline basis) with total calculated sample MAC of ${calculations.totalSampleMAC.toFixed(1)} cm²/g.`}
          contextNote={`Identified ${calculations.phaseResults.length} crystalline phases. ${amorphousWtPct > 0 ? `Amorphous matrix accounts for ${amorphousWtPct.toFixed(1)} wt% of the total bulk sample.` : 'Zero amorphous background detected; 100% crystalline sample.'} ${dominantPhase.crystallineFraction > 70 ? 'High phase purity observed.' : 'Complex multiphase mixture.'}`}
          metrics={[
            { label: 'Dominant Phase', value: dominantPhase.name, unit: '' },
            { label: 'Dominant wt%', value: dominantPhase.crystallineFraction.toFixed(1), unit: '%' },
            { label: 'Phase Count', value: String(calculations.phaseResults.length), unit: '' },
            { label: 'Sample MAC', value: calculations.totalSampleMAC.toFixed(1), unit: 'cm²/g' }
          ]}
        />
      )}

      {appState === 'setup' && (
        <>
          {/* Top Module Navigation Bar */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md flex flex-wrap gap-1.5 shadow-xl">
            <button
              onClick={() => { playSynthTone('tick'); setMainTab('analysis'); }}
              className={`flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mainTab === 'analysis'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-indigo-300" />
              <span>1. Phase Engine</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setMainTab('matrix'); }}
              className={`flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mainTab === 'matrix'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-300" />
              <span>2. Matrix & Covariance</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setMainTab('calibration'); }}
              className={`flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mainTab === 'calibration'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-4 h-4 text-amber-300" />
              <span>3. Calibration Studio</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setMainTab('spectrum'); }}
              className={`flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mainTab === 'spectrum'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-300" />
              <span>4. XRD Spectrum</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setMainTab('database'); }}
              className={`flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mainTab === 'database'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 text-purple-300" />
              <span>5. Reference DB</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setMainTab('theory'); }}
              className={`flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mainTab === 'theory'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-rose-300" />
              <span>6. Theory</span>
            </button>

            <button
              onClick={startComputation}
              className="flex-1 min-w-[130px] py-3 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 font-black border border-emerald-400/40 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Compute RIR</span>
            </button>
          </div>

          {/* Action Notification */}
          <AnimatePresence>
            {actionNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-lg"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{actionNotification}</span>
                </div>
                <button onClick={() => setActionNotification(null)} className="text-emerald-400 hover:text-emerald-200 font-bold px-2 py-1">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: PHASE ANALYSIS ENGINE */}
          {mainTab === 'analysis' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Preset Scenarios */}
              <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Laboratory Benchmark Scenarios</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {MIXTURE_SCENARIOS.map((scen, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => loadScenario(scen)}
                      className="p-3.5 bg-slate-950/50 hover:bg-indigo-950/30 border border-slate-800/60 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between group hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                    >
                      <div>
                        <span className="font-bold text-slate-200 text-xs block group-hover:text-indigo-300 transition-colors">
                          {scen.name}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-relaxed block mt-1 line-clamp-2">
                          {scen.description}
                        </span>
                      </div>
                      <span className="mt-2.5 text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 self-start">
                        {scen.phases.length} Phases
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main 2-Column Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Phase Table & Amorphous Tuning (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Phase List Box */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-200">
                            Crystalline Mixture Components
                          </h2>
                          <p className="text-xs text-slate-400">
                            {phases.length} active crystalline phases identified
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={normalizeIntensities}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Normalize max peak to 10,000 cps"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                          <span>Normalize</span>
                        </button>
                        <button
                          onClick={addPhase}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Phase</span>
                        </button>
                      </div>
                    </div>

                    {/* Phase Cards */}
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                      {phases.map((phase, idx) => (
                        <div
                          key={phase.id}
                          className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 flex-1">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />
                              <input
                                type="text"
                                value={phase.name}
                                onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                                className="bg-transparent font-bold text-sm text-slate-200 outline-none border-b border-transparent focus:border-indigo-500/60 transition-colors w-full"
                              />
                            </div>
                            {phases.length > 1 && (
                              <button
                                onClick={() => removePhase(phase.id)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">Peak Int. (I)</label>
                              <input
                                type="number"
                                value={phase.intensity}
                                onChange={(e) => updatePhase(phase.id, 'intensity', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs outline-none focus:border-indigo-500/60"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">RIR ($I/I_c$)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={phase.rir}
                                onChange={(e) => updatePhase(phase.id, 'rir', parseFloat(e.target.value) || 1.0)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs outline-none focus:border-indigo-500/60"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">2θ Angle (°)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={phase.twoTheta}
                                onChange={(e) => updatePhase(phase.id, 'twoTheta', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs outline-none focus:border-indigo-500/60"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 block">Density (g/cm³)</label>
                              <input
                                type="number"
                                step="0.05"
                                value={phase.density || 3.0}
                                onChange={(e) => updatePhase(phase.id, 'density', parseFloat(e.target.value) || 3.0)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs outline-none focus:border-indigo-500/60"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Amorphous Slider & Global Error Bounds */}
                    <div className="pt-3 border-t border-slate-800 space-y-4">
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Amorphous Matrix Content Correction:
                          </span>
                          <span className="font-mono font-bold text-rose-400 text-sm">
                            {amorphousWtPct}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="1"
                          value={amorphousWtPct}
                          onChange={(e) => setAmorphousWtPct(parseFloat(e.target.value) || 0)}
                          className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                            <span>Intensity Error (ΔI):</span>
                            <span className="font-mono text-indigo-300 font-bold">±{intensityUncertaintyPct}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="15"
                            step="0.5"
                            value={intensityUncertaintyPct}
                            onChange={(e) => setIntensityUncertaintyPct(parseFloat(e.target.value) || 3.0)}
                            className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                            <span>RIR Error (ΔK):</span>
                            <span className="font-mono text-emerald-300 font-bold">±{rirUncertaintyPct}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="20"
                            step="0.5"
                            value={rirUncertaintyPct}
                            onChange={(e) => setRirUncertaintyPct(parseFloat(e.target.value) || 5.0)}
                            className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quantitative Distribution Chart & Results (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Results Chart Card */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-slate-200 text-sm">Phase Fraction Distribution</h3>
                      </div>

                      {/* Weight vs Volume Toggle */}
                      <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
                        <button
                          onClick={() => { playSynthTone('tick'); setChartUnitMode('wt'); }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            chartUnitMode === 'wt' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          wt%
                        </button>
                        <button
                          onClick={() => { playSynthTone('tick'); setChartUnitMode('vol'); }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            chartUnitMode === 'vol' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          vol%
                        </button>
                      </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono text-slate-200 shadow-xl">
                                    <div className="font-bold text-sm" style={{ color: data.color }}>{data.name}</div>
                                    <div className="text-white mt-1 font-black">{data.value} {chartUnitMode}%</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      {calculations.phaseResults.map(p => {
                        const val = chartUnitMode === 'wt' ? p.crystallineFraction : p.crystallineVolFraction;
                        const err = chartUnitMode === 'wt' ? p.errMarginCrystalline : p.errMarginVol;
                        return (
                          <div key={p.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-200 flex items-center gap-2 truncate max-w-[160px]">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                {p.name}
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {val.toFixed(1)} <span className="text-slate-400 font-normal">± {err.toFixed(1)}%</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, val))}%`, backgroundColor: p.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Export Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                      <button
                        onClick={copyReportToClipboard}
                        className="py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-all"
                      >
                        {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedReport ? 'Copied' : 'Report'}</span>
                      </button>
                      <button
                        onClick={exportCSV}
                        className="py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={exportJSON}
                        className="py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-all"
                      >
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRIX ALGEBRA & COVARIANCE INSPECTOR */}
          {mainTab === 'matrix' && (
            <RIRMatrixInspector
              phases={phases}
              amorphousWtPct={amorphousWtPct}
              intensityUncertaintyPct={intensityUncertaintyPct}
              rirUncertaintyPct={rirUncertaintyPct}
            />
          )}

          {/* TAB 3: CALIBRATION STUDIO */}
          {mainTab === 'calibration' && (
            <RIRCalibrationStudio
              phases={phases}
              onApplyRIR={handleApplyCalibratedRIR}
            />
          )}

          {/* TAB 4: XRD SPECTRUM VISUALIZER */}
          {mainTab === 'spectrum' && (
            <RIRDiffractionVisualizer
              phases={phases}
              amorphousWtPct={amorphousWtPct}
            />
          )}

          {/* TAB 5: ICDD REFERENCE LIBRARY */}
          {mainTab === 'database' && (
            <RIRDatabaseExplorer
              onAddPhasePreset={addPresetPhase}
            />
          )}

          {/* TAB 6: THEORY & EQUATIONS */}
          {mainTab === 'theory' && (
            <RIRTheoryGuide />
          )}
        </>
      )}

      {/* COMPUTING PROGRESS SCREEN */}
      {appState === 'computing' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 shadow-2xl flex flex-col items-center justify-center space-y-10 min-h-[440px] animate-in fade-in">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
            <Activity className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-4 w-full max-w-lg">
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${computingStep >= 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950/40 border-slate-800 text-slate-600'}`}>
              <span className="font-mono text-xs font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs border border-slate-800">1</span>
                Parsing Integrated Bragg Intensities & Backgrounds...
              </span>
              {computingStep > 0 && <Check className="w-4 h-4 text-emerald-400" />}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${computingStep >= 1 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950/40 border-slate-800 text-slate-600'}`}>
              <span className="font-mono text-xs font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs border border-slate-800">2</span>
                Applying Reference Intensity Ratio ($I/I_c$) Constants...
              </span>
              {computingStep > 1 && <Check className="w-4 h-4 text-emerald-400" />}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${computingStep >= 2 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950/40 border-slate-800 text-slate-600'}`}>
              <span className="font-mono text-xs font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs border border-slate-800">3</span>
                Executing Analytical Covariance & Error Propagation...
              </span>
              {computingStep > 2 && <Check className="w-4 h-4 text-emerald-400" />}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${computingStep >= 3 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950/40 border-slate-800 text-slate-600'}`}>
              <span className="font-mono text-xs font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs border border-slate-800">4</span>
                Normalizing Mass & Volume Phase Vectors...
              </span>
              {computingStep > 3 && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
          </div>
        </div>
      )}

      {/* FINAL RESULTS DASHBOARD */}
      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">
                  Quantitative Phase Analysis Results
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reference Intensity Ratio (Chung Adiabatic Method) Matrix Inversion Complete.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyReportToClipboard}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
              >
                {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedReport ? 'Copied!' : 'Copy Report'}</span>
              </button>
              <button
                onClick={exportCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setAppState('setup')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Adjust Parameters</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crystalline Mass</span>
              <span className="text-xl font-mono font-black text-indigo-400 mt-1">{(100 - amorphousWtPct).toFixed(1)} wt%</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amorphous Matrix</span>
              <span className="text-xl font-mono font-black text-rose-400 mt-1">{amorphousWtPct.toFixed(1)} wt%</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume Factor</span>
              <span className="text-xl font-mono font-black text-amber-400 mt-1">{calculations.totalVolumeFactor.toFixed(1)}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample MAC (μ*)</span>
              <span className="text-xl font-mono font-black text-cyan-400 mt-1">{calculations.totalSampleMAC.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm²/g</span></span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dominant Phase</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 truncate">
                {dominantPhase ? `${dominantPhase.name} (${dominantPhase.crystallineFraction.toFixed(1)}%)` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Results Visual & Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Table (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Phase Quantities & Error Propagation</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-sans">Phase</th>
                      <th className="px-3 py-3 text-right">Int (I)</th>
                      <th className="px-3 py-3 text-right">RIR</th>
                      <th className="px-3 py-3 text-right text-indigo-300 font-bold">Mass (wt%)</th>
                      <th className="px-3 py-3 text-right text-amber-300">Volume (vol%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {calculations.phaseResults.map(p => (
                      <tr key={p.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-200 font-sans flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span>{p.name}</span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">{p.intensity}</td>
                        <td className="px-3 py-3 text-right text-slate-400">{p.rir.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-bold text-indigo-300">
                          {p.crystallineFraction.toFixed(2)} ± {p.errMarginCrystalline.toFixed(2)}%
                        </td>
                        <td className="px-3 py-3 text-right text-amber-300">
                          {p.crystallineVolFraction.toFixed(2)} ± {p.errMarginVol.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    {amorphousWtPct > 0 && (
                      <tr className="bg-rose-950/10 text-rose-300">
                        <td className="px-4 py-3 font-bold font-sans flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span>Amorphous Matrix</span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">---</td>
                        <td className="px-3 py-3 text-right text-slate-500">---</td>
                        <td className="px-3 py-3 text-right font-bold text-rose-400">{amorphousWtPct.toFixed(2)} wt%</td>
                        <td className="px-3 py-3 text-right text-rose-400">{amorphousWtPct.toFixed(2)} vol%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Pie Distribution (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-400" />
                <span>Phase Mass Fractions (wt%)</span>
              </h3>

              <div className="h-64 w-full">
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
                        <Cell key={`cell-res-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono text-slate-200 shadow-xl">
                              <div className="font-bold text-sm" style={{ color: data.color }}>{data.name}</div>
                              <div className="text-white mt-1 font-black">{data.value} wt%</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setAppState('setup');
                    setMainTab('matrix');
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-800/40 flex items-center justify-center gap-2 transition-all"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Inspect Full Matrix & Covariance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
