import React, { useState, useMemo } from 'react';
import { useCustomMaterialApply } from './CustomMaterialContext';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  FlaskConical,
  GitMerge,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import { RIRMatrixInspector, RIRMatrixPhase } from './rir/RIRMatrixInspector';
import { RIRCalibrationStudio } from './rir/RIRCalibrationStudio';
import { RIRDiffractionVisualizer } from './rir/RIRDiffractionVisualizer';
import { RIRDatabaseExplorer, RIRDatabaseItem, DATABASE_PRESETS } from './rir/RIRDatabaseExplorer';
import { RIRTheoryGuide } from './rir/RIRTheoryGuide';
import { RIRScriptExport } from './rir/RIRScriptExport';
import { RIRBrindleyInspector } from './rir/RIRBrindleyInspector';
import { PawleyRIRBridge } from './rir/PawleyRIRBridge';
import { RIRPhaseInputConsole } from './rir/RIRPhaseInputConsole';
import { RIRVisualWorkbench, RIRVisualPhaseRow } from './rir/RIRVisualWorkbench';
import {
  RADIATION_ANODES,
  computeBraggReciprocal,
  computeDetectionLimits,
  computeHubbardSnyderI100,
  computeRIRCovariance,
  computeRIRDiagnostics,
  computeSpikingAmorphousUncertainty,
  computeSpikingUncertainty,
  solveSelfConsistentBrindley
} from './rir/rirMathUtils';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';

export interface RIRAssignedPeak {
  id: string;
  hkl: string;
  twoTheta: number;
  intensity: number;
  relIntensity: number; // % relative intensity on reference card (1-100)
}

export interface RIRPhase extends RIRMatrixPhase {
  notes?: string;
  peaks?: RIRAssignedPeak[];
}

const COLOR_PALETTE = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#eab308'  // Yellow
];

const MIXTURE_SCENARIOS = [
  {
    id: 'titania',
    shortName: 'TiO₂ Anatase/Rutile',
    name: 'Titania Photocatalyst Blend',
    description: 'Biphasic Anatase & Rutile nanoparticle synthesis mixture',
    amorphous: 5,
    phases: [
      { name: 'Anatase (TiO₂)', hkl: '(101)', twoTheta: 25.28, intensity: 7800, rir: 3.30, mac: 118.2, density: 3.89, notes: 'Photocatalytic phase' },
      { name: 'Rutile (TiO₂)', hkl: '(110)', twoTheta: 27.44, intensity: 2100, rir: 3.40, mac: 118.2, density: 4.23, notes: 'Thermally stable phase' }
    ]
  },
  {
    id: 'cement',
    shortName: 'Portland Clinker',
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
    id: 'granite',
    shortName: 'Granite Modal',
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
    id: 'bioceramic',
    shortName: 'HA / β-TCP Graft',
    name: 'Bone & Biomaterial Ceramic',
    description: 'Biphasic calcium phosphate (BCP) bone graft scaffold',
    amorphous: 10,
    phases: [
      { name: 'Hydroxyapatite (HA)', hkl: '(211)', twoTheta: 31.77, intensity: 8200, rir: 1.50, mac: 62.4, density: 3.16, notes: 'Osteoconductive matrix' },
      { name: 'β-TCP', hkl: '(0210)', twoTheta: 31.02, intensity: 2900, rir: 1.30, mac: 61.2, density: 3.14, notes: 'Bioresorbable phase' }
    ]
  },
  {
    id: 'iron_ore',
    shortName: 'Iron Ore Sinter',
    name: 'Iron Ore Sintering Powder',
    description: 'High-absorption-contrast Fe-oxide ore with quartz & calcite',
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
  const [phases, setPhases] = useState<RIRPhase[]>([
    { id: '1', name: 'Quartz (α-SiO₂)', hkl: '(101)', twoTheta: 26.64, intensity: 8500, rir: 3.60, density: 2.65, mac: 34.9, notes: 'Primary Silica Phase', color: COLOR_PALETTE[0] },
    { id: '2', name: 'Calcite (CaCO₃)', hkl: '(104)', twoTheta: 29.40, intensity: 4200, rir: 2.00, density: 2.71, mac: 76.4, notes: 'Matrix Mineral', color: COLOR_PALETTE[1] },
    { id: '3', name: 'Corundum (α-Al₂O₃)', hkl: '(113)', twoTheta: 43.36, intensity: 1500, rir: 1.00, density: 3.98, mac: 31.8, notes: 'Added Internal Standard (10 wt%)', color: COLOR_PALETTE[2] }
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState<string>('default');
  const [anodeId, setAnodeId] = useState<'Cu' | 'Co' | 'Mo' | 'Cr'>('Cu');
  const [mainTab, setMainTab] = useState<
    'analysis' | 'pawley_bridge' | 'matrix' | 'calibration' | 'spectrum' | 'database' | 'microabsorption' | 'script' | 'theory'
  >('analysis');

  const [amorphousWtPct, setAmorphousWtPct] = useState<number>(0);
  const [amorphousDensity, setAmorphousDensity] = useState<number>(2.2);
  const [amorphousMac, setAmorphousMac] = useState<number>(30.0);
  const [internalStandardMode, setInternalStandardMode] = useState<boolean>(false);
  const [standardPhaseId, setStandardPhaseId] = useState<string>('3');
  const [standardAddedWtPct, setStandardAddedWtPct] = useState<number>(10.0);
  const [useBrindley, setUseBrindley] = useState<boolean>(false);
  const [particleDiameterUm, setParticleDiameterUm] = useState<number>(5.0);

  const [intensityUncertaintyPct, setIntensityUncertaintyPct] = useState<number>(3.0);
  const [rirUncertaintyPct, setRirUncertaintyPct] = useState<number>(5.0);
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [expandedMultiPeakPhases, setExpandedMultiPeakPhases] = useState<Record<string, boolean>>({});
  const [calculationFlash, setCalculationFlash] = useState<boolean>(false);

  const activeAnode = useMemo(
    () => RADIATION_ANODES.find((a) => a.id === anodeId) || RADIATION_ANODES[0],
    [anodeId]
  );

  const notify = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => setActionNotification(null), 3200);
  };

  useCustomMaterialApply('rir', (mat) => {
    const strongest = [...mat.peaks].sort((a, b) => b.intensity - a.intensity)[0] || mat.peaks[0];
    const hklStr = strongest ? `(${strongest.h}${strongest.k}${strongest.l})` : '(111)';
    const customPeaks: RIRAssignedPeak[] = mat.peaks.slice(0, 5).map((p, idx) => ({
      id: `cpk-${idx}`,
      hkl: `(${p.h}${p.k}${p.l})`,
      twoTheta: Number(p.twoTheta.toFixed(2)),
      intensity: Math.round(p.intensity * 80),
      relIntensity: Math.max(1, Math.round(p.intensity))
    }));
    const hs = computeHubbardSnyderI100(customPeaks);
    const customPhase: RIRPhase = {
      id: `custom-rir-${mat.id}`,
      name: `${mat.name} (${mat.formula})`,
      hkl: hklStr,
      twoTheta: Number((strongest?.twoTheta || 32.0).toFixed(2)),
      intensity: hs.equivI100 || Math.round((strongest?.intensity || 100) * 80),
      rir: Number((mat.rir || 2.5).toFixed(2)),
      density: Number((mat.density || 5.0).toFixed(2)),
      mac: Number((mat.massAttenuation || 65.0).toFixed(1)),
      notes: `Custom Material (${mat.crystalSystem} · ${mat.spaceGroup})`,
      color: '#0891b2',
      peaks: customPeaks
    };
    setPhases((prev) => {
      const existsIdx = prev.findIndex((p) => p.id === customPhase.id);
      if (existsIdx >= 0) return prev.map((p, i) => (i === existsIdx ? customPhase : p));
      return [customPhase, ...prev];
    });
    setActiveScenarioId('custom');
    notify(`Added custom phase "${mat.name}" (RIR = ${customPhase.rir}, μ/ρ = ${customPhase.mac} cm²/g).`);
    playSynthTone('tick');
  });

  // Phase management handlers
  const addPhase = () => {
    playSynthTone('tick');
    const newId = Math.random().toString(36).substring(2, 9);
    setPhases((prev) => [
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
        color: COLOR_PALETTE[prev.length % COLOR_PALETTE.length]
      }
    ]);
    setActiveScenarioId('custom');
  };

  const addPresetPhase = (preset: RIRDatabaseItem) => {
    playSynthTone('success');
    const newId = Math.random().toString(36).substring(2, 9);
    setPhases((prev) => [
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
        color: COLOR_PALETTE[prev.length % COLOR_PALETTE.length]
      }
    ]);
    setActiveScenarioId('custom');
    notify(`Added ${preset.name} (RIR = ${preset.rir}) to mixture.`);
  };

  const loadScenario = (scenario: typeof MIXTURE_SCENARIOS[0]) => {
    playSynthTone('success');
    setActiveScenarioId(scenario.id);
    setAmorphousWtPct(scenario.amorphous);
    setInternalStandardMode(false);
    const loadedPhases: RIRPhase[] = scenario.phases.map((p, idx) => ({
      id: `${scenario.id}-${idx + 1}`,
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
    setStandardPhaseId(loadedPhases[loadedPhases.length - 1]?.id || '1');
    notify(`Loaded "${scenario.name}" benchmark mixture.`);
  };

  const updatePhase = (id: string, field: keyof RIRPhase, value: string | number) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setActiveScenarioId('custom');
  };

  const applyDBPresetToPhase = (id: string, presetName: string) => {
    const selected = DATABASE_PRESETS.find((p) => p.name === presetName);
    if (!selected) return;
    playSynthTone('success');
    setPhases((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name: selected.name,
              hkl: selected.hkl,
              twoTheta: selected.twoTheta,
              rir: selected.rir,
              density: selected.density || 3.0,
              mac: selected.macCu,
              notes: `PDF ${selected.pdfCard}`
            }
          : p
      )
    );
    setActiveScenarioId('custom');
  };

  const applyBulkPhases = (newPhases: Omit<RIRPhase, 'id' | 'color'>[]) => {
    if (newPhases.length === 0) return;
    playSynthTone('success');
    const built: RIRPhase[] = newPhases.map((np, idx) => ({
      ...np,
      id: `bulk-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }));
    setPhases(built);
    setStandardPhaseId(built[built.length - 1]?.id || built[0].id);
    setActiveScenarioId('custom');
    notify(`Imported ${built.length} phases from bulk CSV data.`);
  };

  const removePhase = (id: string) => {
    playSynthTone('tick');
    setPhases((prev) => prev.filter((p) => p.id !== id));
    setActiveScenarioId('custom');
  };

  // Multi-Peak Hubbard-Snyder handlers
  const toggleMultiPeakDrawer = (phaseId: string) => {
    playSynthTone('tick');
    setExpandedMultiPeakPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const addAssignedPeakToPhase = (phaseId: string) => {
    playSynthTone('tick');
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId) return p;
        const existingPeaks: RIRAssignedPeak[] =
          p.peaks && p.peaks.length > 0
            ? p.peaks
            : [
                {
                  id: `${p.id}-pk1`,
                  hkl: p.hkl || '(100)',
                  twoTheta: p.twoTheta || 30.0,
                  intensity: p.intensity || 0,
                  relIntensity: p.relIntensity || 100
                }
              ];
        const nextIdx = existingPeaks.length + 1;
        const newPeaks: RIRAssignedPeak[] = [
          ...existingPeaks,
          {
            id: `${p.id}-pk-${Math.random().toString(36).substring(2, 7)}`,
            hkl: `(00${nextIdx})`,
            twoTheta: Number(((p.twoTheta || 25) + nextIdx * 6.5).toFixed(2)),
            intensity: Math.round((p.intensity || 1000) * 0.5),
            relIntensity: 50
          }
        ];
        const hs = computeHubbardSnyderI100(newPeaks);
        return {
          ...p,
          peaks: newPeaks,
          intensity: hs.equivI100,
          relIntensity: 100
        };
      })
    );
  };

  const updateAssignedPeak = (phaseId: string, peakId: string, field: keyof RIRAssignedPeak, val: string | number) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId || !p.peaks) return p;
        const updatedPeaks = p.peaks.map((pk) => (pk.id === peakId ? { ...pk, [field]: val } : pk));
        const hs = computeHubbardSnyderI100(updatedPeaks);
        return {
          ...p,
          peaks: updatedPeaks,
          hkl: updatedPeaks[0]?.hkl || p.hkl,
          twoTheta: updatedPeaks[0]?.twoTheta || p.twoTheta,
          intensity: hs.equivI100,
          relIntensity: 100
        };
      })
    );
  };

  const removeAssignedPeak = (phaseId: string, peakId: string) => {
    playSynthTone('tick');
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId || !p.peaks) return p;
        const updatedPeaks = p.peaks.filter((pk) => pk.id !== peakId);
        if (updatedPeaks.length === 0) return { ...p, peaks: undefined };
        const hs = computeHubbardSnyderI100(updatedPeaks);
        return {
          ...p,
          peaks: updatedPeaks,
          hkl: updatedPeaks[0].hkl,
          twoTheta: updatedPeaks[0].twoTheta,
          intensity: hs.equivI100,
          relIntensity: 100
        };
      })
    );
  };

  const normalizeIntensities = () => {
    if (phases.length === 0) return;
    playSynthTone('success');
    const maxInt = Math.max(...phases.map((p) => p.intensity || 0));
    if (maxInt <= 0) return;
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        intensity: Math.round(((p.intensity || 0) / maxInt) * 10000)
      }))
    );
    notify('Normalized peak intensities to 10,000 cps maximum.');
  };

  const handleApplyCalibratedRIR = (targetId: string, calibratedRIRValue: number) => {
    playSynthTone('success');
    updatePhase(targetId, 'rir', calibratedRIRValue);
    notify(`Applied calibrated RIR = ${calibratedRIRValue.toFixed(3)} to phase.`);
  };

  const handleImportPawleyPhase = (newPhase: RIRMatrixPhase & { peaks?: RIRAssignedPeak[] }) => {
    playSynthTone('success');
    setPhases((prev) => [
      ...prev,
      {
        ...newPhase,
        notes: `Imported from Pawley Refinement (${newPhase.hkl})`,
        color: COLOR_PALETTE[prev.length % COLOR_PALETTE.length]
      }
    ]);
    notify(`Imported ${newPhase.name} from Pawley deconvolution.`);
  };

  const handleUpdatePawleyIntensity = (phaseId: string, refinedIntensity: number) => {
    playSynthTone('success');
    updatePhase(phaseId, 'intensity', refinedIntensity);
    const pName = phases.find((p) => p.id === phaseId)?.name || 'Phase';
    notify(`Updated ${pName} intensity to ${refinedIntensity} cps.`);
  };

  const handleRunQuantification = () => {
    playSynthTone('success');
    setCalculationFlash(true);
    setTimeout(() => setCalculationFlash(false), 1200);
    setTimeout(() => {
      document.getElementById('rir-results-summary-table')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  // Core Quantitative Engine (Volume-Weighted Brindley + Exact Density-Jacobian Covariance + Hubbard-Snyder)
  const calculations = useMemo(() => {
    const brindleySol = useBrindley ? solveSelfConsistentBrindley(phases, particleDiameterUm) : null;

    const effPhases = phases.map((p, idx) => {
      const rho = p.density && p.density > 0 ? p.density : 3.0;
      const mac = p.mac && p.mac > 0 ? p.mac : 50.0;
      const mu = rho * mac;
      const relIntensityPct = p.relIntensity && p.relIntensity > 0 ? p.relIntensity : 100;
      const relScale = relIntensityPct / 100;
      const normI100 = (p.intensity || 0) / relScale;
      const tau = brindleySol ? brindleySol.phaseStates[idx]?.tau ?? 1.0 : 1.0;
      const effI = normI100 / tau;
      const rI = effI / (p.rir > 0 ? p.rir : 1.0);
      const assignedPeakCount =
        p.peaks && p.peaks.length > 0
          ? p.peaks.filter((pk) => (pk.intensity || 0) > 0).length
          : (p.intensity || 0) > 0
          ? 1
          : 0;
      const hs = p.peaks && p.peaks.length > 1 ? computeHubbardSnyderI100(p.peaks) : null;

      return {
        ...p,
        rho,
        mac,
        mu,
        relIntensityPct,
        normI100,
        tau,
        effI,
        rI,
        assignedPeakCount,
        textureCvPct: hs?.textureCvPct ?? 0
      };
    });

    const totalObservedIntensity = effPhases.reduce((sum, p) => sum + (p.intensity || 0), 0);
    const totalReducedIntensity = effPhases.reduce((sum, p) => sum + p.rI, 0);

    const relErrI = (intensityUncertaintyPct || 0) / 100;
    const relErrRIR = (rirUncertaintyPct || 0) / 100;
    const baseRelError = Math.sqrt(relErrI * relErrI + relErrRIR * relErrRIR);

    // Internal standard spiking evaluation
    const standardPhase = internalStandardMode ? effPhases.find((p) => p.id === standardPhaseId) : null;
    const standardSpikedFrac = Math.min(0.95, Math.max(0.01, (standardAddedWtPct || 10.0) / 100));
    const isInternalStandardActive = !!(standardPhase && standardPhase.rI > 0);

    let measuredAmorphousPct = amorphousWtPct;
    let rawOriginalSampleCrystSum = 100 - amorphousWtPct;
    const spikingAnalyteWeights: number[] = [];

    if (isInternalStandardActive && standardPhase) {
      rawOriginalSampleCrystSum = 0;
      const mult = standardSpikedFrac / (1 - standardSpikedFrac);
      effPhases.forEach((p) => {
        if (p.id !== standardPhase.id) {
          const wOrig = mult * (p.rI / standardPhase.rI) * 100;
          rawOriginalSampleCrystSum += wOrig;
          spikingAnalyteWeights.push(wOrig);
        }
      });
      measuredAmorphousPct = Math.max(0, Number((100 - rawOriginalSampleCrystSum).toFixed(2)));
    }

    const amorphousErrWtPct = isInternalStandardActive
      ? computeSpikingAmorphousUncertainty(
          spikingAnalyteWeights,
          standardAddedWtPct,
          intensityUncertaintyPct,
          rirUncertaintyPct
        )
      : 0;

    const effectiveAmorphousWtPct = isInternalStandardActive ? measuredAmorphousPct : amorphousWtPct;
    const amorphousFactor = Math.max(0, (100 - Math.min(99.5, Math.max(0, effectiveAmorphousWtPct))) / 100);
    const rhoAmorphous = amorphousDensity > 0 ? amorphousDensity : 2.2;
    const macAmorphous = amorphousMac > 0 ? amorphousMac : 30.0;

    // Exact Jacobian covariance for both wt% and density-weighted vol%
    const covarAnalysis = computeRIRCovariance(
      effPhases.map((p) => ({
        id: p.id,
        name: p.name,
        hkl: p.hkl,
        twoTheta: p.twoTheta,
        intensity: p.effI,
        rir: p.rir,
        density: p.density,
        mac: p.mac
      })),
      intensityUncertaintyPct,
      rirUncertaintyPct
    );

    const rawWeights = effPhases.map((p, idx) => {
      if (isInternalStandardActive && standardPhase) {
        if (p.id === standardPhase.id) {
          return {
            crystWt: 0,
            totalWt: 0,
            spikedBlendWt: standardSpikedFrac * 100,
            errCryst: 0,
            errTotal: 0,
            errCrystVol: 0
          };
        }
        const mult = standardSpikedFrac / (1 - standardSpikedFrac);
        const wOrig = mult * (p.rI / standardPhase.rI) * 100;
        const wCryst = rawOriginalSampleCrystSum > 0 ? (wOrig / rawOriginalSampleCrystSum) * 100 : 0;
        const sigmaTotal = computeSpikingUncertainty(
          p.effI,
          standardPhase.effI,
          p.rir > 0 ? p.rir : 1.0,
          standardPhase.rir > 0 ? standardPhase.rir : 1.0,
          wOrig,
          standardAddedWtPct,
          intensityUncertaintyPct,
          rirUncertaintyPct
        );
        const sigmaCryst =
          rawOriginalSampleCrystSum > 0 ? sigmaTotal / Math.max(1e-6, rawOriginalSampleCrystSum / 100) : 0;
        return {
          crystWt: wCryst,
          totalWt: wOrig,
          spikedBlendWt: wOrig * (1 - standardSpikedFrac),
          errCryst: sigmaCryst,
          errTotal: sigmaTotal,
          errCrystVol: sigmaCryst
        };
      }

      const wCryst = totalReducedIntensity > 0 ? (p.rI / totalReducedIntensity) * 100 : 0;
      const wTotal = wCryst * amorphousFactor;
      const analyticalSigmaCryst =
        covarAnalysis.stdDevW?.[idx] !== undefined ? covarAnalysis.stdDevW[idx] * 100 : wCryst * baseRelError;
      const analyticalSigmaVol =
        covarAnalysis.stdDevV?.[idx] !== undefined ? covarAnalysis.stdDevV[idx] * 100 : wCryst * baseRelError;
      return {
        crystWt: wCryst,
        totalWt: wTotal,
        spikedBlendWt: wTotal,
        errCryst: analyticalSigmaCryst,
        errTotal: analyticalSigmaCryst * amorphousFactor,
        errCrystVol: analyticalSigmaVol
      };
    });

    // Bulk MAC & Density
    const crystOnlyMac = rawWeights.reduce((acc, rw, i) => acc + (rw.crystWt / 100) * effPhases[i].mac, 0);
    const totalSampleMAC = crystOnlyMac * amorphousFactor + (effectiveAmorphousWtPct / 100) * macAmorphous;

    const crystVolRaw = rawWeights.map((rw, i) => rw.crystWt / effPhases[i].rho);
    const sumCrystVolRaw = crystVolRaw.reduce((s, v) => s + v, 0);

    const bulkVolRaw = rawWeights.map((rw, i) => rw.totalWt / effPhases[i].rho);
    const amorphousVolRaw = effectiveAmorphousWtPct > 0 ? effectiveAmorphousWtPct / rhoAmorphous : 0;
    const sumBulkVolRaw = bulkVolRaw.reduce((s, v) => s + v, 0) + amorphousVolRaw;
    const amorphousVolPct = sumBulkVolRaw > 0 ? (amorphousVolRaw / sumBulkVolRaw) * 100 : 0;

    const totalSampleWtSum =
      rawWeights.reduce((s, rw) => s + rw.totalWt, 0) + effectiveAmorphousWtPct;
    const bulkDensity = sumBulkVolRaw > 0 ? totalSampleWtSum / sumBulkVolRaw : 3.0;

    const detectionLimits = computeDetectionLimits(
      effPhases.map((p) => ({
        id: p.id,
        name: p.name,
        hkl: p.hkl,
        twoTheta: p.twoTheta,
        intensity: p.effI,
        rir: p.rir,
        density: p.density,
        mac: p.mac
      })),
      80,
      totalSampleMAC || 65.0,
      rawWeights.map((rw) => rw.totalWt),
      bulkDensity
    );

    const bulkVolScale = sumBulkVolRaw > 0 ? (sumBulkVolRaw - amorphousVolRaw) / sumBulkVolRaw : 1;

    const phaseResults: RIRVisualPhaseRow[] = effPhases.map((p, idx) => {
      const rw = rawWeights[idx];
      const crystallineVolFraction = sumCrystVolRaw > 0 ? (crystVolRaw[idx] / sumCrystVolRaw) * 100 : 0;
      const totalSampleVolFraction = sumBulkVolRaw > 0 ? (bulkVolRaw[idx] / sumBulkVolRaw) * 100 : 0;
      const errMarginVol = rw.errCrystVol;
      const errMarginBulkVol = isInternalStandardActive
        ? totalSampleVolFraction > 0 && rw.totalWt > 0
          ? rw.errTotal * (totalSampleVolFraction / rw.totalWt)
          : 0
        : errMarginVol * bulkVolScale;
      const dl = detectionLimits[idx];

      return {
        id: p.id,
        name: p.name,
        hkl: p.hkl,
        twoTheta: p.twoTheta,
        intensity: p.intensity,
        rir: p.rir,
        tau: p.tau,
        density: p.rho,
        mac: p.mac,
        reducedIntensity: p.rI,
        crystallineFraction: rw.crystWt,
        totalSampleFraction: rw.totalWt,
        crystallineVolFraction,
        totalSampleVolFraction,
        errMarginCrystalline: rw.errCryst,
        errMarginTotal: rw.errTotal,
        errMarginVol,
        errMarginBulkVol,
        lodWtPct: dl?.lodWtPct ?? 0.5,
        penetrationDepthUm: dl?.penetrationDepthUm ?? 25.0,
        textureCvPct: p.textureCvPct,
        isInternalStandard: p.id === standardPhaseId && isInternalStandardActive,
        color: p.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]
      };
    });

    const diagnostics = computeRIRDiagnostics({
      phases: phaseResults,
      anodeId,
      useBrindley,
      particleDiameterUm,
      isInternalStandardActive,
      rawOriginalSampleCrystSum
    });

    const assignedPhasesCount = phaseResults.filter((p) => (p.intensity || 0) > 0).length;
    const assignedPeaksCount = effPhases.reduce((acc, p) => acc + p.assignedPeakCount, 0);
    const sumCrystallineWtPct = phaseResults.reduce((s, p) => s + p.crystallineFraction, 0);
    const sumBulkWtPct = phaseResults.reduce((s, p) => s + p.totalSampleFraction, 0) + effectiveAmorphousWtPct;
    const sumBulkVolPct = phaseResults.reduce((s, p) => s + p.totalSampleVolFraction, 0) + amorphousVolPct;

    return {
      totalObservedIntensity,
      totalReducedIntensity,
      phaseResults,
      amorphousFactor,
      effectiveAmorphousWtPct,
      amorphousVolPct,
      amorphousErrWtPct,
      measuredAmorphousPct,
      rawOriginalSampleCrystSum,
      isInternalStandardActive,
      totalSampleMAC,
      bulkDensity,
      conditionNumber: covarAnalysis.conditionNumber,
      brindleyIterations: brindleySol?.iterations ?? 0,
      assignedPhasesCount,
      assignedPeaksCount,
      hasAssignedIntensities: assignedPhasesCount > 0,
      sumCrystallineWtPct,
      sumBulkWtPct,
      sumBulkVolPct,
      diagnostics
    };
  }, [
    phases,
    amorphousWtPct,
    amorphousDensity,
    amorphousMac,
    intensityUncertaintyPct,
    rirUncertaintyPct,
    useBrindley,
    particleDiameterUm,
    internalStandardMode,
    standardPhaseId,
    standardAddedWtPct,
    anodeId
  ]);

  // Export & Report Actions
  const copyReportToClipboard = () => {
    playSynthTone('success');
    let report = `XRD QUANTITATIVE PHASE ANALYSIS REPORT (RIR METHOD)\n`;
    report += `============================================================================================\n`;
    report += `Radiation: ${activeAnode.label} (lambda = ${activeAnode.wavelengthA.toFixed(4)} A)\n`;
    report += `Regime: ${calculations.isInternalStandardActive ? `Internal Standard Spiking (${standardAddedWtPct} wt%)` : 'Chung Adiabatic Normalization'}\n`;
    report += `Brindley Microabsorption: ${useBrindley ? `Active (D = ${particleDiameterUm} um, volume-weighted muBar, ${calculations.brindleyIterations} iter)` : 'Off'}\n`;
    report += `Amorphous Matrix: ${calculations.effectiveAmorphousWtPct.toFixed(2)} wt% (${calculations.amorphousVolPct.toFixed(2)} vol%, rho = ${amorphousDensity} g/cm3)\n`;
    report += `Composite Sample MAC: ${calculations.totalSampleMAC.toFixed(2)} cm2/g | Bulk Density: ${calculations.bulkDensity.toFixed(2)} g/cm3\n`;
    report += `Assumed Uncertainties: ±${intensityUncertaintyPct}% (I), ±${rirUncertaintyPct}% (RIR)\n\n`;
    report += `Phase Name              | hkl   | 2Theta | d (A)  | Int (I) | RIR   | Cryst wt%      | Bulk wt%       | Bulk vol%\n`;
    report += `---------------------------------------------------------------------------------------------------------------------\n`;

    calculations.phaseResults.forEach((p) => {
      const { dSpacingA } = computeBraggReciprocal(p.twoTheta, activeAnode.wavelengthA);
      report += `${p.name.padEnd(23, ' ').substring(0, 23)} | ${p.hkl.padEnd(5, ' ').substring(0, 5)} | ${p.twoTheta.toFixed(2).padStart(6, ' ')} | ${dSpacingA.toFixed(3).padStart(6, ' ')} | ${p.intensity.toString().padStart(7, ' ')} | ${p.rir.toFixed(2).padStart(5, ' ')} | ${(p.crystallineFraction.toFixed(1) + ' ± ' + p.errMarginCrystalline.toFixed(1) + '%').padStart(14, ' ')} | ${(p.totalSampleFraction.toFixed(1) + ' ± ' + p.errMarginTotal.toFixed(1) + '%').padStart(14, ' ')} | ${(p.totalSampleVolFraction.toFixed(1) + ' ± ' + p.errMarginBulkVol.toFixed(1) + '%').padStart(14, ' ')}\n`;
    });

    if (calculations.effectiveAmorphousWtPct > 0) {
      report += `Amorphous Matrix        | ---   | ---    | ---    | ---     | ---   | 0.0%           | ${calculations.effectiveAmorphousWtPct.toFixed(2).padStart(13, ' ')}% | ${calculations.amorphousVolPct.toFixed(2).padStart(13, ' ')}%\n`;
    }

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const exportCSV = () => {
    playSynthTone('success');
    const timestamp = new Date().toISOString();
    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `# XRD Quantitative Phase Analysis via Reference Intensity Ratio (RIR)\n`;
    csvContent += `# Generated: ${timestamp}\n`;
    csvContent += `# Radiation: ${activeAnode.label} (${activeAnode.wavelengthA} A)\n`;
    csvContent += `# Regime: ${calculations.isInternalStandardActive ? 'Internal Standard Spiking' : 'Chung Adiabatic'}\n`;
    csvContent += `# Amorphous Matrix: ${calculations.effectiveAmorphousWtPct.toFixed(2)} wt% (${calculations.amorphousVolPct.toFixed(2)} vol%)\n`;
    csvContent += `# Composite Sample MAC: ${calculations.totalSampleMAC.toFixed(2)} cm2/g | Bulk Density: ${calculations.bulkDensity.toFixed(2)} g/cm3\n\n`;
    csvContent += `Phase Name,hkl,2-Theta (deg),d-Spacing (A),Intensity (cps),RIR (I/Ic),Brindley Tau,Density (g/cm3),MAC (cm2/g),Reduced (I/RIR),Crystalline Wt (%),Err Cryst (%),Total Bulk Wt (%),Err Bulk Wt (%),Total Bulk Vol (%),Err Bulk Vol (%),LOD (wt%),Depth_99 (um)\n`;

    calculations.phaseResults.forEach((p) => {
      const { dSpacingA } = computeBraggReciprocal(p.twoTheta, activeAnode.wavelengthA);
      const nameEsc = `"${p.name.replace(/"/g, '""')}"`;
      const hklEsc = `"${p.hkl.replace(/"/g, '""')}"`;
      csvContent += `${nameEsc},${hklEsc},${p.twoTheta.toFixed(2)},${dSpacingA.toFixed(4)},${p.intensity},${p.rir.toFixed(2)},${p.tau.toFixed(4)},${p.density.toFixed(2)},${p.mac.toFixed(1)},${p.reducedIntensity.toFixed(2)},${p.crystallineFraction.toFixed(2)},${p.errMarginCrystalline.toFixed(2)},${p.totalSampleFraction.toFixed(2)},${p.errMarginTotal.toFixed(2)},${p.totalSampleVolFraction.toFixed(2)},${p.errMarginBulkVol.toFixed(2)},${p.lodWtPct},${p.penetrationDepthUm}\n`;
    });

    if (calculations.effectiveAmorphousWtPct > 0) {
      csvContent += `Amorphous Matrix,---,---,---,---,---,---,${amorphousDensity.toFixed(2)},${amorphousMac.toFixed(1)},---,0.00,---,${calculations.effectiveAmorphousWtPct.toFixed(2)},${calculations.amorphousErrWtPct.toFixed(2)},${calculations.amorphousVolPct.toFixed(2)},---,---,---\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RIR_Quantitative_Analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    playSynthTone('success');
    const sessionData = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      anodeId,
      amorphousWtPct,
      amorphousDensity,
      amorphousMac,
      internalStandardMode,
      standardPhaseId,
      standardAddedWtPct,
      useBrindley,
      particleDiameterUm,
      intensityUncertaintyPct,
      rirUncertaintyPct,
      phases,
      calculations: {
        totalReducedIntensity: calculations.totalReducedIntensity,
        totalSampleMAC: calculations.totalSampleMAC,
        bulkDensity: calculations.bulkDensity,
        phaseResults: calculations.phaseResults
      }
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RIR_Session_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          if (data.amorphousDensity !== undefined) setAmorphousDensity(data.amorphousDensity);
          if (data.amorphousMac !== undefined) setAmorphousMac(data.amorphousMac);
          if (data.intensityUncertaintyPct !== undefined) setIntensityUncertaintyPct(data.intensityUncertaintyPct);
          if (data.rirUncertaintyPct !== undefined) setRirUncertaintyPct(data.rirUncertaintyPct);
          if (data.anodeId) setAnodeId(data.anodeId);
          playSynthTone('success');
          notify('Imported RIR session JSON successfully.');
        }
      } catch {
        playSynthTone('error');
        notify('Invalid RIR session JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const rirWalkthroughSteps: WizardStep[] = [
    {
      title: 'Corundum Scaling (I/I_c) & Multi-Peak Hubbard–Snyder Weighting',
      subtitle: 'r_i = Î_100,i / (RIR_i · τ_i)',
      explanation:
        'Each phase is scaled by its Reference Intensity Ratio against 50:50 α-Al₂O₃ (NIST SRM 676a). When multiple reflections are entered, Hubbard–Snyder summed scaling Î_100 = ΣI_j / Σ(I_rel,j/100) prevents weak peaks from amplifying noise and flags preferred orientation via Texture CV%.',
      tip: 'Assign 2–3 reflections for cleavage-prone minerals (Calcite, Mica, Clays) to monitor Texture CV%.'
    },
    {
      title: 'Chung Adiabatic vs. Internal Standard Spiking',
      subtitle: 'w_i = r_i / Σr_j  or  w_orig,i = [W_s/(1−W_s)]·(r_i/r_s)',
      explanation:
        'Adiabatic normalization constrains crystalline phases to 100% without measuring MAC. Spiking a known wt% of an internal standard (Corundum, Si, ZnO) directly quantifies the amorphous matrix and detects mass-balance excess (>100%).',
      tip: 'Use 10–20 wt% internal standard for optimal error propagation in the W_s(1−W_s) denominator.'
    },
    {
      title: 'Volume-Weighted Brindley Microabsorption & Density Jacobian',
      subtitle: 'μ̄ = Σ v_i μ_i  ·  Σ_v = J_v Σ_w J_vᵀ',
      explanation:
        'When phases differ strongly in linear absorption (e.g., Hematite vs. Quartz under Cu Kα), self-consistent Brindley spherical-grain transmission factors τ_i correct intensity bias. Volume fractions and their exact ±1σ uncertainties propagate analytically through the density Jacobian.',
      tip: 'Switch radiation anode to Co Kα₁ for iron-bearing ores to eliminate Fe K-edge fluorescence.'
    }
  ];

  const TABS = [
    { id: 'analysis', label: 'Phase Engine', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'pawley_bridge', label: 'Pawley Bridge', icon: <GitMerge className="w-3.5 h-3.5" /> },
    { id: 'matrix', label: 'Matrix & Covariance', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'calibration', label: 'Calibration', icon: <Calculator className="w-3.5 h-3.5" /> },
    { id: 'spectrum', label: 'XRD Spectrum', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'database', label: 'Reference DB', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'microabsorption', label: useBrindley ? 'Brindley (On)' : 'Brindley', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'script', label: 'Script Export', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'theory', label: 'Theory', icon: <BookOpen className="w-3.5 h-3.5" /> }
  ] as const;

  return (
    <div className="w-full flex flex-col gap-5 p-4 md:p-6 lg:p-7 max-w-[1440px] mx-auto">
      {/* Compact Collapsible Guided Walkthrough */}
      <GuidedWalkthroughWizard
        moduleName="Reference Intensity Ratio (RIR) Quantitative Phase Engine"
        description="Chung adiabatic & internal-standard spiking quantification with Hubbard–Snyder multi-peak weighting, volume-weighted Brindley microabsorption, and exact Jacobian covariance."
        steps={rirWalkthroughSteps}
        presetNames={MIXTURE_SCENARIOS.map((p) => p.name)}
        onLoadBenchmarkPreset={(idx) => {
          const scen = MIXTURE_SCENARIOS[idx];
          if (scen) loadScenario(scen);
        }}
      />

      {/* Precision Instrumentation Header & Scenario / Anode Control Ribbon */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
              Reference Intensity Ratio (RIR) Quantitative Workbench
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mt-1 tabular-nums">
              <span>{calculations.isInternalStandardActive ? 'Internal Standard Spiking' : 'Chung Adiabatic Method'}</span>
              <span aria-hidden="true">·</span>
              <span>NIST SRM 676a Corundum Scale (I/I<sub>c</sub>)</span>
              <span aria-hidden="true">·</span>
              <span>{activeAnode.label} (λ = {activeAnode.wavelengthA.toFixed(4)} Å)</span>
            </div>
          </div>

          {/* Radiation Anode Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400">Anode:</span>
            <div className="flex items-center gap-1 p-1 bg-[#070B12] border border-slate-800 rounded-lg">
              {RADIATION_ANODES.map((anode) => (
                <button
                  key={anode.id}
                  type="button"
                  onClick={() => { playSynthTone('tick'); setAnodeId(anode.id); }}
                  title={`${anode.label} (${anode.wavelengthA} Å, ${anode.energyKeV} keV) — ${anode.fluorescenceNote}`}
                  className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    anodeId === anode.id
                      ? 'bg-cyan-600 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {anode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1-Click Benchmark Mixture Selector Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 mr-1">Benchmarks:</span>
          {MIXTURE_SCENARIOS.map((scen) => (
            <button
              key={scen.id}
              type="button"
              onClick={() => loadScenario(scen)}
              title={scen.description}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                activeScenarioId === scen.id
                  ? 'bg-slate-800 border-cyan-500/60 text-cyan-300'
                  : 'bg-[#070B12] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
              }`}
            >
              {scen.shortName}
              <span className="ml-1.5 text-[10px] font-mono text-slate-500">{scen.phases.length}p</span>
            </button>
          ))}
        </div>

        {/* 6-Metric Quantitative Telemetry Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 font-mono tabular-nums">
          <div className="bg-[#070B12] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Crystalline Bulk</span>
            <span className="text-base font-semibold text-emerald-400 block mt-0.5">
              {(100 - calculations.effectiveAmorphousWtPct).toFixed(1)}
              <span className="text-[11px] text-slate-500 ml-1">wt%</span>
            </span>
          </div>
          <div className="bg-[#070B12] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Amorphous Matrix</span>
            <span className="text-base font-semibold text-rose-400 block mt-0.5">
              {calculations.effectiveAmorphousWtPct.toFixed(1)}
              <span className="text-[11px] text-slate-500 ml-1">wt%</span>
            </span>
          </div>
          <div className="bg-[#070B12] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Composite MAC μ*</span>
            <span className="text-base font-semibold text-cyan-400 block mt-0.5">
              {calculations.totalSampleMAC.toFixed(1)}
              <span className="text-[11px] text-slate-500 ml-1">cm²/g</span>
            </span>
          </div>
          <div className="bg-[#070B12] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Bulk Density ρ</span>
            <span className="text-base font-semibold text-slate-100 block mt-0.5">
              {calculations.bulkDensity.toFixed(2)}
              <span className="text-[11px] text-slate-500 ml-1">g/cm³</span>
            </span>
          </div>
          <div className="bg-[#070B12] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Microabsorption</span>
            <span className="text-sm font-semibold text-slate-200 block mt-1 truncate">
              {useBrindley ? `Brindley ${particleDiameterUm}µm` : 'Ideal (Off)'}
            </span>
          </div>
          <div className="bg-[#070B12] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Dynamic Ratio κ</span>
            <span className="text-base font-semibold text-amber-400 block mt-0.5">
              {calculations.conditionNumber.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Single-Row Module Navigation Tabs */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-1 flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              playSynthTone('tick');
              setMainTab(tab.id);
            }}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
              mainTab === tab.id
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Action Feedback Toast */}
      <AnimatePresence>
        {actionNotification && (
          <motion.div
            key="rir-action-notification"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="bg-[#0B0F17] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotification(null)}
              className="text-slate-400 hover:text-slate-200 px-1.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: PHASE ENGINE */}
      {mainTab === 'analysis' && (
        <div className="space-y-5">
          {/* Asymmetric 2-Column Split: Phase Configuration Console (7) + Quantitative Visual Stage (5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7">
              <RIRPhaseInputConsole
                phases={phases}
                phaseResults={calculations.phaseResults}
                wavelengthA={activeAnode.wavelengthA}
                anodeLabel={activeAnode.label}
                onAddPhase={addPhase}
                onUpdatePhase={updatePhase}
                onApplyDBPresetToPhase={applyDBPresetToPhase}
                onRemovePhase={removePhase}
                onApplyBulkPhases={applyBulkPhases}
                expandedMultiPeakPhases={expandedMultiPeakPhases}
                onToggleMultiPeakDrawer={toggleMultiPeakDrawer}
                onAddAssignedPeak={addAssignedPeakToPhase}
                onUpdateAssignedPeak={updateAssignedPeak}
                onRemoveAssignedPeak={removeAssignedPeak}
                internalStandardMode={internalStandardMode}
                setInternalStandardMode={setInternalStandardMode}
                standardPhaseId={standardPhaseId}
                setStandardPhaseId={setStandardPhaseId}
                standardAddedWtPct={standardAddedWtPct}
                setStandardAddedWtPct={setStandardAddedWtPct}
                measuredAmorphousPct={calculations.measuredAmorphousPct}
                amorphousErrWtPct={calculations.amorphousErrWtPct}
                rawOriginalSampleCrystSum={calculations.rawOriginalSampleCrystSum}
                amorphousWtPct={amorphousWtPct}
                setAmorphousWtPct={setAmorphousWtPct}
                amorphousDensity={amorphousDensity}
                setAmorphousDensity={setAmorphousDensity}
                amorphousMac={amorphousMac}
                setAmorphousMac={setAmorphousMac}
                useBrindley={useBrindley}
                setUseBrindley={setUseBrindley}
                particleDiameterUm={particleDiameterUm}
                setParticleDiameterUm={setParticleDiameterUm}
                brindleyIterations={calculations.brindleyIterations}
                onOpenBrindleyInspector={() => setMainTab('microabsorption')}
                intensityUncertaintyPct={intensityUncertaintyPct}
                setIntensityUncertaintyPct={setIntensityUncertaintyPct}
                rirUncertaintyPct={rirUncertaintyPct}
                setRirUncertaintyPct={setRirUncertaintyPct}
                onNormalizeIntensities={normalizeIntensities}
                onImportJSON={handleJSONImport}
                onRunQuantification={handleRunQuantification}
                calculationFlash={calculationFlash}
              />
            </div>

            <div className="lg:col-span-5">
              <RIRVisualWorkbench
                phaseResults={calculations.phaseResults}
                effectiveAmorphousWtPct={calculations.effectiveAmorphousWtPct}
                amorphousVolPct={calculations.amorphousVolPct}
                amorphousErrWtPct={calculations.amorphousErrWtPct}
                amorphousDensity={amorphousDensity}
                isInternalStandardActive={calculations.isInternalStandardActive}
                rawOriginalSampleCrystSum={calculations.rawOriginalSampleCrystSum}
                totalSampleMAC={calculations.totalSampleMAC}
                bulkDensity={calculations.bulkDensity}
                wavelengthA={activeAnode.wavelengthA}
                anodeLabel={activeAnode.label}
                useBrindley={useBrindley}
                diagnostics={calculations.diagnostics}
                copiedReport={copiedReport}
                onCopyReport={copyReportToClipboard}
                onExportCSV={exportCSV}
                onExportJSON={exportJSON}
                onJumpToTab={(tab) => setMainTab(tab)}
              />
            </div>
          </div>

          {/* Dedicated Quantitative Phase Analysis Results Table */}
          <div
            id="rir-results-summary-table"
            className={`bg-[#0B0F17] border rounded-2xl overflow-hidden transition-colors duration-300 ${
              calculationFlash ? 'border-emerald-500/70' : 'border-slate-800'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                    Quantitative Phase Analysis Results Table
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                    <span>{calculations.assignedPhasesCount}/{phases.length} active phases</span>
                    <span aria-hidden="true">·</span>
                    <span>{calculations.assignedPeaksCount} reflections</span>
                    <span aria-hidden="true">·</span>
                    <span>ΣI = {calculations.totalObservedIntensity.toLocaleString()} cps</span>
                    <span aria-hidden="true">·</span>
                    <span>Σ(I/K) = {calculations.totalReducedIntensity.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyReportToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
                </button>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {!calculations.hasAssignedIntensities ? (
              <div className="p-8 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-200">No Bragg Peak Intensities Assigned</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Enter a positive integrated peak intensity (cps) for one or more crystalline phases to compute quantitative phase fractions.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums">
                  <thead className="bg-[#070B12] text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-left font-sans font-semibold">Phase & Reflection</th>
                      <th className="px-3 py-3 text-right font-medium">2θ / d (Å)</th>
                      <th className="px-3 py-3 text-right font-medium">Int. (cps)</th>
                      <th className="px-3 py-3 text-right font-medium">RIR (I/I<sub>c</sub>)</th>
                      <th className="px-3 py-3 text-right text-cyan-400 font-medium">Reduced (I/K)</th>
                      <th className="px-3 py-3 text-right text-indigo-300 font-semibold">Cryst. wt% ± σ</th>
                      <th className="px-3 py-3 text-right text-emerald-300 font-semibold">Bulk wt% ± σ</th>
                      <th className="px-3 py-3 text-right text-amber-300 font-semibold">Bulk vol% ± σ</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">LOD / τ<sub>99</sub></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {calculations.phaseResults.map((p) => {
                      const { dSpacingA } = computeBraggReciprocal(p.twoTheta, activeAnode.wavelengthA);
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-4 py-3 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                              <span className="font-semibold text-slate-100">{p.name}</span>
                              <span className="text-[11px] font-mono text-slate-400">{p.hkl}</span>
                              {p.isInternalStandard && (
                                <span className="text-[10px] font-mono text-amber-400">· Internal Std</span>
                              )}
                              {p.textureCvPct > 0 && (
                                <span className={`text-[10px] font-mono ${p.textureCvPct > 15 ? 'text-amber-400' : 'text-slate-500'}`}>
                                  · CV {p.textureCvPct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-slate-300">
                            <div>{p.twoTheta.toFixed(2)}°</div>
                            <div className="text-[10px] text-slate-500">{dSpacingA.toFixed(3)} Å</div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={p.intensity}
                              onChange={(e) => updatePhase(p.id, 'intensity', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-24 bg-[#070B12] border border-slate-800 focus:border-cyan-500 text-right text-slate-100 font-semibold rounded-md px-2 py-1 text-xs outline-none"
                            />
                          </td>
                          <td className="px-3 py-3 text-right text-slate-300">
                            <div>{p.rir.toFixed(2)}</div>
                            {useBrindley && <div className="text-[10px] text-cyan-400">τ={p.tau.toFixed(3)}</div>}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-cyan-300">
                            {p.reducedIntensity.toFixed(1)}
                          </td>
                          <td className="px-3 py-3 text-right text-indigo-300 font-semibold">
                            {p.isInternalStandard ? (
                              <span className="text-slate-500 font-normal">Std</span>
                            ) : (
                              <>
                                {p.crystallineFraction.toFixed(2)}
                                <span className="text-slate-500 font-normal"> ± {p.errMarginCrystalline.toFixed(2)}%</span>
                              </>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-emerald-300 font-semibold">
                            {p.isInternalStandard ? (
                              <span className="text-amber-400 font-normal">{standardAddedWtPct.toFixed(1)}% spike</span>
                            ) : (
                              <>
                                {p.totalSampleFraction.toFixed(2)}
                                <span className="text-slate-500 font-normal"> ± {p.errMarginTotal.toFixed(2)}%</span>
                              </>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-amber-300 font-semibold">
                            {p.isInternalStandard ? (
                              <span className="text-slate-500 font-normal">—</span>
                            ) : (
                              <>
                                {p.totalSampleVolFraction.toFixed(2)}
                                <span className="text-slate-500 font-normal"> ± {p.errMarginBulkVol.toFixed(2)}%</span>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-[11px] text-slate-400">
                            <span className="text-rose-300">{p.lodWtPct} wt%</span>
                            <span className="text-slate-600 mx-1">/</span>
                            <span className="text-cyan-300">{p.penetrationDepthUm} µm</span>
                          </td>
                        </tr>
                      );
                    })}

                    {calculations.effectiveAmorphousWtPct > 0 && (
                      <tr className="bg-slate-900/40 text-rose-300">
                        <td className="px-4 py-3 font-sans font-semibold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                          <span>Amorphous / Diffuse Matrix</span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">Halo</td>
                        <td className="px-3 py-3 text-right text-slate-500">—</td>
                        <td className="px-3 py-3 text-right text-slate-500">—</td>
                        <td className="px-3 py-3 text-right text-slate-500">—</td>
                        <td className="px-3 py-3 text-right text-slate-500">0.00%</td>
                        <td className="px-3 py-3 text-right font-semibold text-rose-400">
                          {calculations.effectiveAmorphousWtPct.toFixed(2)}
                          {calculations.isInternalStandardActive && calculations.amorphousErrWtPct > 0
                            ? ` ± ${calculations.amorphousErrWtPct.toFixed(2)}%`
                            : '%'}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-rose-400">
                          {calculations.amorphousVolPct.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">ρ={amorphousDensity.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-[#070B12] border-t border-slate-800 text-slate-200 font-semibold">
                    <tr>
                      <td className="px-4 py-3 font-sans text-xs text-slate-300">
                        Mixture Closure ({calculations.assignedPhasesCount} Active Phases)
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500">—</td>
                      <td className="px-3 py-3 text-right text-slate-200">
                        {calculations.totalObservedIntensity.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500">—</td>
                      <td className="px-3 py-3 text-right text-cyan-300">
                        {calculations.totalReducedIntensity.toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-right text-indigo-300">
                        {calculations.sumCrystallineWtPct.toFixed(2)}%
                      </td>
                      <td
                        className={`px-3 py-3 text-right ${
                          calculations.sumBulkWtPct > 100.5 ? 'text-rose-400' : 'text-emerald-300'
                        }`}
                      >
                        {calculations.sumBulkWtPct.toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-right text-amber-300">
                        {calculations.sumBulkVolPct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-cyan-300">
                        μ*={calculations.totalSampleMAC.toFixed(1)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAWLEY & LE BAIL DECONVOLUTION BRIDGE */}
      {mainTab === 'pawley_bridge' && (
        <PawleyRIRBridge
          currentPhases={phases}
          onImportDecomposedPhase={handleImportPawleyPhase}
          onUpdatePhaseIntensity={handleUpdatePawleyIntensity}
        />
      )}

      {/* TAB 3: MATRIX ALGEBRA & COVARIANCE INSPECTOR */}
      {mainTab === 'matrix' && (
        <RIRMatrixInspector
          phases={phases}
          amorphousWtPct={calculations.effectiveAmorphousWtPct}
          intensityUncertaintyPct={intensityUncertaintyPct}
          rirUncertaintyPct={rirUncertaintyPct}
        />
      )}

      {/* TAB 4: CALIBRATION STUDIO */}
      {mainTab === 'calibration' && (
        <RIRCalibrationStudio
          phases={phases}
          onApplyRIR={handleApplyCalibratedRIR}
        />
      )}

      {/* TAB 5: XRD SPECTRUM VISUALIZER */}
      {mainTab === 'spectrum' && (
        <RIRDiffractionVisualizer
          phases={phases}
          amorphousWtPct={calculations.effectiveAmorphousWtPct}
          internalStandardPhaseId={internalStandardMode ? standardPhaseId : undefined}
          onUpdatePhaseIntensity={(phaseId, newIntensity) => updatePhase(phaseId, 'intensity', newIntensity)}
        />
      )}

      {/* TAB 6: ICDD REFERENCE LIBRARY */}
      {mainTab === 'database' && (
        <RIRDatabaseExplorer onAddPhasePreset={addPresetPhase} />
      )}

      {/* TAB 7: BRINDLEY MICROABSORPTION INSPECTOR */}
      {mainTab === 'microabsorption' && (
        <RIRBrindleyInspector
          phases={phases}
          particleDiameterUm={particleDiameterUm}
          onUpdateParticleDiameter={setParticleDiameterUm}
          useBrindley={useBrindley}
          onToggleBrindley={setUseBrindley}
        />
      )}

      {/* TAB 8: PYTHON & ORIGIN LAB SCRIPT EXPORT */}
      {mainTab === 'script' && (
        <RIRScriptExport
          phases={phases}
          amorphousWtPct={calculations.effectiveAmorphousWtPct}
          intensityUncertaintyPct={intensityUncertaintyPct}
          rirUncertaintyPct={rirUncertaintyPct}
          quantMode={internalStandardMode ? 'spiking' : 'adiabatic'}
          internalStandardPhaseId={internalStandardMode ? standardPhaseId : undefined}
          standardAddedWtPct={internalStandardMode ? standardAddedWtPct : undefined}
          useBrindley={useBrindley}
          particleDiameterUm={particleDiameterUm}
        />
      )}

      {/* TAB 9: THEORY & EQUATIONS */}
      {mainTab === 'theory' && <RIRTheoryGuide />}
    </div>
  );
};
