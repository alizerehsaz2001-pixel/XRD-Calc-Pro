import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import {
  Calculator,
  Grid,
  Sliders,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download,
  Copy,
  Check,
  Cpu,
  Database,
  FlaskConical,
  Zap,
  Activity,
  Layers,
  FileText,
  X,
  Scale,
  Award,
  RotateCcw,
  Filter,
  Crosshair,
  Compass
} from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';

import {
  CrystalSystem,
  DriftFunctionType,
  WeightingScheme,
  PeakInput,
  COHEN_PRESET_SAMPLES
} from './cohen_refinement/CohenPresetsDb';
import {
  runCohenRefinement,
  CohenRefinementResult,
  CohenRefinementOutput
} from './cohen_refinement/CohenSolver';
import { CohenPlots } from './cohen_refinement/CohenPlots';
import { CohenModelComparator } from './cohen_refinement/CohenModelComparator';
import { CohenMetricTensorCard } from './cohen_refinement/CohenMetricTensorCard';
import { CohenMatrixInspector } from './cohen_refinement/CohenMatrixInspector';
import { CohenPeakTable } from './cohen_refinement/CohenPeakTable';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

interface CohenRefinementModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string | null;
}

const ANODE_PRESETS = [
  { label: 'Cu Kα₁', lambda: 1.54056, title: 'Copper Kα1 (1.54056 Å)' },
  { label: 'Cu Kα₂', lambda: 1.54439, title: 'Copper Kα2 (1.54439 Å)' },
  { label: 'Mo Kα₁', lambda: 0.70930, title: 'Molybdenum Kα1 (0.70930 Å)' },
  { label: 'Co Kα₁', lambda: 1.78897, title: 'Cobalt Kα1 (1.78897 Å)' },
  { label: 'Cr Kα₁', lambda: 2.28970, title: 'Chromium Kα1 (2.28970 Å)' }
];

export const CohenRefinementModule: React.FC<CohenRefinementModuleProps> = ({
  activeResults
}) => {
  const { precision = 4 } = useSettings();
  const decimalPrecision = precision;

  // Active Preset and Configuration State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [systemFilter, setSystemFilter] = useState<string>('ALL');
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [driftType, setDriftType] = useState<DriftFunctionType>('nelson_riley');
  const [weightingScheme, setWeightingScheme] = useState<WeightingScheme>('hess_hagg');
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [goniometerRadiusMm, setGoniometerRadiusMm] = useState<number>(240);
  const [peaks, setPeaks] = useState<PeakInput[]>(COHEN_PRESET_SAMPLES[0].peaks);
  const [activeTab, setActiveTab] = useState<'plots' | 'peaks' | 'benchmark' | 'matrix' | 'tensor'>('plots');

  // Modals & UI States
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const activePreset = COHEN_PRESET_SAMPLES[selectedPresetIndex];

  const notifyStatus = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 2800);
  };

  // Load Preset Handler
  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const preset = COHEN_PRESET_SAMPLES[idx];
    setCrystalSystem(preset.system);
    setWavelength(preset.wavelength);
    setPeaks(preset.peaks.map(p => ({ ...p, enabled: true })));
    playSynthTone('tick');
  };

  // Peak Management Handlers
  const handleUpdatePeak = (id: string, field: keyof PeakInput, value: any) => {
    setPeaks(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleTogglePeakById = (id: string) => {
    setPeaks(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: p.enabled === false ? true : false } : p))
    );
  };

  const handleDeletePeak = (id: string) => {
    setPeaks(prev => prev.filter(p => p.id !== id));
  };

  const handleAddPeak = (newPeak: Partial<PeakInput>) => {
    const p: PeakInput = {
      id: 'peak-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      twoTheta: newPeak.twoTheta || 30.0,
      h: newPeak.h ?? 1,
      k: newPeak.k ?? 1,
      l: newPeak.l ?? 1,
      intensity: newPeak.intensity ?? 100,
      enabled: true
    };
    setPeaks(prev => [...prev, p]);
  };

  const handleClearAllPeaks = () => {
    if (activePreset) {
      setPeaks(activePreset.peaks.map(p => ({ ...p, enabled: true })));
      notifyStatus(`Reset reflections to ${activePreset.name}`);
    }
  };

  // Bulk Paste Handler
  const handleParseBulk = () => {
    if (!bulkText.trim()) return;
    setBulkParseError(null);
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: PeakInput[] = [];

    lines.forEach((line, idx) => {
      if (
        line.startsWith('#') ||
        line.startsWith('//') ||
        line.toLowerCase().includes('two') ||
        line.toLowerCase().includes('theta')
      ) {
        return;
      }
      const parts = line.split(/[,\t;\s]+/).filter(Boolean);
      if (parts.length >= 4) {
        let h = 0, k = 0, l = 0, tt = 0, intensity = 100;
        const p0 = parseFloat(parts[0]);
        const p1 = parseFloat(parts[1]);
        const p2 = parseFloat(parts[2]);
        const p3 = parseFloat(parts[3]);

        if (p0 > 5 && p0 < 175 && Math.abs(p1) <= 20 && Math.abs(p2) <= 20 && Math.abs(p3) <= 20) {
          tt = p0;
          h = Math.round(p1);
          k = Math.round(p2);
          l = Math.round(p3);
          if (parts[4]) intensity = parseFloat(parts[4]) || 100;
        } else {
          h = Math.round(p0);
          k = Math.round(p1);
          l = Math.round(p2);
          tt = p3;
          if (parts[4]) intensity = parseFloat(parts[4]) || 100;
        }

        if (tt > 0 && tt < 180) {
          parsed.push({
            id: `bulk-${idx}-${Date.now()}`,
            h,
            k,
            l,
            twoTheta: tt,
            intensity,
            enabled: true
          });
        }
      }
    });

    if (parsed.length >= 2) {
      setPeaks(parsed);
      setShowBulkModal(false);
      setBulkText('');
      notifyStatus(`Imported ${parsed.length} reflections from bulk text`);
    } else {
      setBulkParseError('Could not parse at least 2 valid peak rows. Format: h k l 2theta [intensity] or 2theta h k l [intensity].');
    }
  };

  // Import Active Bragg Peaks
  const handleImportActiveBragg = () => {
    if (!activeResults || !activeResults.length) return;
    const imported: PeakInput[] = activeResults.map((r, idx) => {
      let h = 1, k = 1, l = 1;
      if (r.hkl) {
        const parts = r.hkl.replace(/[()]/g, '').trim().split(/[,\s]+/).map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          h = Math.round(parts[0]);
          k = Math.round(parts[1]);
          l = Math.round(parts[2]);
        }
      }
      return {
        id: `active-${idx}-${Date.now()}`,
        twoTheta: r.twoTheta,
        h,
        k,
        l,
        intensity: r.intensity || 100,
        enabled: true
      };
    });
    setPeaks(imported);
    setShowImportModal(false);
    notifyStatus(`Imported ${imported.length} reflections from active Bragg session`);
  };

  // Real-Time Analytical Least-Squares Solution
  const refinementResult: CohenRefinementResult = useMemo(() => {
    return runCohenRefinement(peaks, crystalSystem, driftType, wavelength, weightingScheme, goniometerRadiusMm);
  }, [peaks, crystalSystem, driftType, wavelength, weightingScheme, goniometerRadiusMm]);

  const isSuccess = !(refinementResult as any).error;
  const refinementData = isSuccess ? (refinementResult as CohenRefinementOutput) : null;

  // Matrix Labels
  const matrixLabels = useMemo(() => {
    if (refinementData?.matrixLabels && refinementData.matrixLabels.length > 0) {
      return refinementData.matrixLabels;
    }
    if (crystalSystem === 'Cubic') return ['A', 'D'];
    if (crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') return ['A', 'C', 'D'];
    if (crystalSystem === 'Orthorhombic') return ['A', 'B', 'C', 'D'];
    if (crystalSystem === 'Monoclinic') return ['A', 'B', 'C', 'E', 'D'];
    if (crystalSystem === 'Triclinic') return ['S11', 'S22', 'S33', '2S12', '2S23', '2S13', 'D'];
    return ['A', 'D'];
  }, [refinementData, crystalSystem]);

  // Fast Solver for Multi-Model Comparator
  const solveSystemForComparator = useMemo(() => {
    return (testDrift: DriftFunctionType) => {
      const res = runCohenRefinement(peaks, crystalSystem, testDrift, wavelength, weightingScheme, goniometerRadiusMm);
      if ((res as any).error) return null;
      const data = res as CohenRefinementOutput;
      return {
        a: data.lattice.a,
        b: data.lattice.b,
        c: data.lattice.c,
        sigmaA: data.sigma.sigmaA,
        D: data.D,
        rmsTwoTheta: data.rmsTwoThetaShift,
        sumResidualSquare: data.sumResidualSquare,
        rwpPct: data.rwpPct,
        gof: data.gof,
        aic: data.aic,
        smithSnyderFN: data.smithSnyderFN,
        sampleDisplacementUm: data.aberrations.sampleDisplacementUm
      };
    };
  }, [peaks, crystalSystem, wavelength, weightingScheme, goniometerRadiusMm]);

  // Auto-select optimal drift model across all 9 kernels
  const handleAutoSelectOptimalDrift = () => {
    const candidates: DriftFunctionType[] = [
      'nelson_riley',
      'taylor_sinclair',
      'sample_displacement',
      'bradley_jay',
      'hess_hagg',
      'zero_shift',
      'flat_specimen',
      'dual_drift',
      'none'
    ];
    let bestDrift: DriftFunctionType = driftType;
    let bestRms = Infinity;
    for (const d of candidates) {
      const r = solveSystemForComparator(d);
      if (r && r.rmsTwoTheta < bestRms) {
        bestRms = r.rmsTwoTheta;
        bestDrift = d;
      }
    }
    setDriftType(bestDrift);
    playSynthTone('chime');
    notifyStatus(`Selected optimal drift model: ${bestDrift.replace('_', ' ')} (RMS Δ2θ = ±${bestRms.toFixed(4)}°)`);
  };

  // Auto-prune outlier peaks
  const handleAutoMaskOutliers = () => {
    if (!refinementData) return;
    const outlierIds = new Set(refinementData.peakDetails.filter(p => p.isOutlier).map(p => p.id));
    if (outlierIds.size === 0) {
      notifyStatus('No angular or studentized outliers detected');
      return;
    }
    setPeaks(prev => prev.map(p => (outlierIds.has(p.id) ? { ...p, enabled: false } : p)));
    notifyStatus(`Masked ${outlierIds.size} outlier reflection(s)`);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!refinementData) return;
    const headers = [
      'Index',
      'h',
      'k',
      'l',
      '2Theta_Obs_deg',
      '2Theta_Calc_deg',
      'Delta_2Theta_deg',
      'd_Obs_A',
      'd_Calc_A',
      'Delta_d_ppm',
      'Apparent_a_A',
      'Corrected_a_A',
      'Drift_f_theta',
      'Weight',
      'Leverage_h_ii',
      'Studentized_Residual',
      'Cooks_Distance'
    ];
    const rows = refinementData.peakDetails.map((p, idx) => [
      idx + 1,
      p.h,
      p.k,
      p.l,
      p.twoTheta.toFixed(4),
      p.twoThetaCalc.toFixed(4),
      p.deltaTwoTheta.toFixed(5),
      p.dObs.toFixed(5),
      p.dCalc.toFixed(5),
      p.deltaDPpm.toFixed(1),
      p.apparentA.toFixed(5),
      p.correctedA.toFixed(5),
      p.driftVal.toFixed(5),
      p.weight.toFixed(4),
      p.leverageHii.toFixed(4),
      p.studentizedResidual.toFixed(3),
      p.cooksDistance.toFixed(4)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohen_refinement_${crystalSystem.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy LaTeX representation
  const handleCopyLatex = () => {
    if (!refinementData) return;
    const { matrixM, lattice, sigma } = refinementData;

    let latex = `% Cohen's Least-Squares Matrix Refinement Results\n`;
    latex += `\\begin{equation}\n`;
    latex += `\\mathbf{M} = \\begin{pmatrix}\n`;
    latex += matrixM.map(row => row.map(v => v.toExponential(3)).join(' & ')).join(' \\\\\n');
    latex += `\n\\end{pmatrix}\n\\end{equation}\n\n`;

    latex += `% Refined Lattice Parameters (${crystalSystem} System):\n`;
    latex += `a = ${lattice.a.toFixed(5)} \\pm ${sigma.sigmaA.toFixed(5)} \\text{ \\AA}\n`;
    if (lattice.b && lattice.b !== lattice.a) {
      latex += `b = ${lattice.b.toFixed(5)} \\pm ${(sigma.sigmaB || 0).toFixed(5)} \\text{ \\AA}\n`;
    }
    if (lattice.c && crystalSystem !== 'Cubic') {
      latex += `c = ${lattice.c.toFixed(5)} \\pm ${(sigma.sigmaC || 0).toFixed(5)} \\text{ \\AA}\n`;
    }
    if (lattice.betaDeg && crystalSystem === 'Monoclinic') {
      latex += `\\beta = ${lattice.betaDeg.toFixed(3)}^\\circ \\pm ${(sigma.sigmaBeta || 0).toFixed(3)}^\\circ\n`;
    }
    if (crystalSystem === 'Triclinic') {
      latex += `\\alpha = ${(lattice.alphaDeg || 90).toFixed(3)}^\\circ \\pm ${(sigma.sigmaAlpha || 0).toFixed(3)}^\\circ, \\beta = ${(lattice.betaDeg || 90).toFixed(3)}^\\circ \\pm ${(sigma.sigmaBeta || 0).toFixed(3)}^\\circ, \\gamma = ${(lattice.gammaDeg || 90).toFixed(3)}^\\circ \\pm ${(sigma.sigmaGamma || 0).toFixed(3)}^\\circ\n`;
    }
    latex += `V = ${refinementData.volume.toFixed(4)} \\pm ${sigma.sigmaVolume.toFixed(4)} \\text{ \\AA}^3\n`;

    navigator.clipboard.writeText(latex);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2000);
  };

  // Copy Full Text Report
  const handleCopyReport = () => {
    if (!refinementData) return;
    const {
      lattice,
      sigma,
      volume,
      rmsTwoThetaShift,
      rmsDeltaDPpm,
      D,
      variance,
      dof,
      rwpPct,
      gof,
      conditionNumber,
      smithSnyderFN,
      deWolffM20,
      aberrations
    } = refinementData;

    let rep = `=== COHEN'S LEAST-SQUARES MATRIX REFINEMENT REPORT ===\n`;
    rep += `Material: ${activePreset?.name || 'Custom Sample'}\n`;
    rep += `Crystal System: ${crystalSystem}\n`;
    rep += `Drift Model: ${driftType}\n`;
    rep += `Weighting Scheme: ${weightingScheme}\n`;
    rep += `X-ray Wavelength: ${wavelength} Å | Goniometer Radius: ${goniometerRadiusMm} mm\n\n`;
    rep += `REFINED LATTICE CONSTANTS:\n`;
    rep += `  a = ${lattice.a.toFixed(decimalPrecision + 1)} ± ${sigma.sigmaA.toFixed(decimalPrecision + 2)} Å\n`;
    if (crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic' || crystalSystem === 'Triclinic') {
      rep += `  b = ${lattice.b.toFixed(decimalPrecision + 1)} ± ${(sigma.sigmaB || 0).toFixed(decimalPrecision + 2)} Å\n`;
    }
    if (crystalSystem !== 'Cubic') {
      rep += `  c = ${lattice.c.toFixed(decimalPrecision + 1)} ± ${(sigma.sigmaC || 0).toFixed(decimalPrecision + 2)} Å\n`;
    }
    if (crystalSystem === 'Monoclinic') {
      rep += `  beta = ${(lattice.betaDeg || 90).toFixed(3)}° ± ${(sigma.sigmaBeta || 0).toFixed(3)}°\n`;
    }
    if (crystalSystem === 'Triclinic') {
      rep += `  alpha = ${(lattice.alphaDeg || 90).toFixed(3)}° ± ${(sigma.sigmaAlpha || 0).toFixed(3)}°\n`;
      rep += `  beta  = ${(lattice.betaDeg || 90).toFixed(3)}° ± ${(sigma.sigmaBeta || 0).toFixed(3)}°\n`;
      rep += `  gamma = ${(lattice.gammaDeg || 90).toFixed(3)}° ± ${(sigma.sigmaGamma || 0).toFixed(3)}°\n`;
    }
    if (lattice.rhombohedralA) {
      rep += `  Rhombohedral a_r = ${lattice.rhombohedralA.toFixed(decimalPrecision + 1)} ± ${(sigma.sigmaRhombohedralA || 0).toFixed(decimalPrecision + 2)} Å, alpha_r = ${(lattice.rhombohedralAlpha || 0).toFixed(2)}° ± ${(sigma.sigmaRhombohedralAlpha || 0).toFixed(2)}°\n`;
    }
    rep += `  Volume V = ${volume.toFixed(4)} ± ${sigma.sigmaVolume.toFixed(4)} Å³\n`;
    rep += `  Drift Parameter D = ${D.toExponential(4)} ± ${sigma.sigmaD.toExponential(3)}\n`;
    rep += `  Equiv. Sample Displacement Δz = ${aberrations.sampleDisplacementUm.toFixed(1)} μm\n\n`;
    rep += `RESIDUAL & INDEXING FIGURES OF MERIT:\n`;
    rep += `  RMS 2θ Shift: ±${rmsTwoThetaShift.toFixed(4)}° | RMS Δd/d: ±${rmsDeltaDPpm.toFixed(1)} ppm\n`;
    rep += `  Smith-Snyder F_N: ${smithSnyderFN.toFixed(1)} | de Wolff M_20: ${deWolffM20.toFixed(1)}\n`;
    rep += `  Weighted R_wp: ${(rwpPct || 0).toFixed(2)}% | GoF: ${(gof || 1).toFixed(3)}\n`;
    rep += `  Condition Number κ₁(M): ${(conditionNumber || 1).toExponential(2)} | Variance s²: ${variance.toExponential(4)} (DOF = ${dof})\n`;

    navigator.clipboard.writeText(rep);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const cohenWalkthroughSteps: WizardStep[] = [
    {
      title: 'Choose Crystal Symmetry & Indexed (hkl, 2θ) Peaks',
      subtitle: 'All 7 Crystal Systems: Cubic to Triclinic',
      explanation: 'Cohen’s method solves for reciprocal quadratic form parameters (A, B, C, E, S_ij) plus systematic drift D simultaneously.',
      tip: 'High-angle reflections (2θ > 60°) have the smallest systematic drift f(θ) → 0 and anchor the true unit cell.'
    },
    {
      title: 'Select Instrumental Drift Error Function f(θ)',
      subtitle: 'Nelson-Riley, Taylor-Sinclair, or Sample Displacement',
      explanation: 'Systematic diffractometer errors scale with trigonometric functions of Bragg angle θ. Click "Find Optimal Drift" to benchmark all 9 error models.',
      tip: 'Equivalent specimen displacement Δz (μm) is automatically computed from D and the goniometer radius R.'
    },
    {
      title: 'Solve Weighted Normal Matrix [M][X] = [Y]',
      subtitle: 'Hess-Hägg & Huber IRLS Robust Estimation',
      explanation: 'Constructs the weighted normal matrix M = Gᵀ W G and solves [X] = [M]⁻¹ [Y] algebraically with zero initial guess sensitivity.',
      tip: 'Switch Weighting Scheme to Huber IRLS Robust to automatically down-weight misindexed or shifted outlier peaks.'
    },
    {
      title: 'Propagate Full Jacobian Covariance Uncertainties',
      subtitle: 'Σ_p = J · Cov(X) · Jᵀ & Smith–Snyder F_N',
      explanation: 'Standard uncertainties σ(a, b, c, α, β, γ, V) are propagated through the full parameter covariance matrix.',
      tip: 'Inspect Hat Matrix leverage h_ii and Cook’s distance D_i in the Reflections tab to spot high-leverage peaks.'
    }
  ];

  // Theoretical X-ray density calculation for telemetry card
  const theoreticalDensity = useMemo(() => {
    if (!refinementData || refinementData.volume <= 0) return null;
    const Z = activePreset?.formulaUnitsZ || 4;
    const M = activePreset?.molarMass || 50;
    const NA = 6.02214076e23;
    const rho = (Z * M) / (NA * refinementData.volume * 1e-24);
    const sigmaRho = rho * (refinementData.sigma.sigmaVolume / refinementData.volume);
    return { rho, sigmaRho, Z, M };
  }, [refinementData, activePreset]);

  const filteredPresets = useMemo(() => {
    return COHEN_PRESET_SAMPLES.map((sample, idx) => ({ sample, idx })).filter(
      item => systemFilter === 'ALL' || item.sample.system === systemFilter
    );
  }, [systemFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Cohen's Analytical Least-Squares Matrix Refinement"
        description="Simultaneous unit-cell parameter refinement, systematic diffractometer drift deconvolution, and Jacobian covariance propagation across all 7 crystal systems."
        steps={cohenWalkthroughSteps}
        presetNames={COHEN_PRESET_SAMPLES.map(p => `${p.name} (${p.system})`)}
        onLoadBenchmarkPreset={(idx) => handleSelectPreset(idx)}
      />

      {/* Top Scientific Console Header & Configuration Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 space-y-5">
        {/* Top Bar: Title, Live Status Badges & Global Actions */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider font-mono">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                Normal Equations [M][X] = [Y]
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                {crystalSystem} ({matrixLabels.length}×{matrixLabels.length})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                λ = {wavelength.toFixed(5)} Å
              </span>
              {statusNotice && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-in fade-in">
                  <Sparkles className="w-3 h-3" />
                  {statusNotice}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Cohen&apos;s Least-Squares Matrix Refinement Console
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Analytical least-squares inversion separating zero-drift lattice constants ($a_0, b_0, c_0, \alpha, \beta, \gamma$) from systematic goniometer displacement, transparency, and absorption errors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoSelectOptimalDrift}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="Benchmark all 9 drift models and select the one with minimum RMS Δ2θ"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Find Optimal Drift
            </button>

            <button
              type="button"
              onClick={handleAutoMaskOutliers}
              disabled={!isSuccess}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Automatically disable reflections with |Δ2θ| > 0.04° or |r*| > 2.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Prune Outliers
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!isSuccess}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              CSV
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              disabled={!isSuccess}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              {copiedReport ? 'Copied' : 'Copy Report'}
            </button>

            <button
              type="button"
              onClick={handleClearAllPeaks}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all"
              title="Reset reflections to preset default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Standard Reference Materials Bar with Symmetry Filter */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Reference Standards ({COHEN_PRESET_SAMPLES.length}):
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {(['ALL', 'Cubic', 'Tetragonal', 'Hexagonal', 'Trigonal', 'Orthorhombic', 'Monoclinic', 'Triclinic'] as const).map(sys => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setSystemFilter(sys)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      systemFilter === sys
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>

            {activePreset?.refLattice?.a && (
              <span className="text-[11px] text-slate-300 font-mono">
                Certified Ref ({activePreset.chemicalFormula || activePreset.name}):{' '}
                <strong className="text-indigo-300">a = {activePreset.refLattice.a} Å</strong>
                {activePreset.refLattice.b && <strong className="text-indigo-300 ml-2">b = {activePreset.refLattice.b} Å</strong>}
                {activePreset.refLattice.c && <strong className="text-indigo-300 ml-2">c = {activePreset.refLattice.c} Å</strong>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {filteredPresets.map(({ sample, idx }) => {
              const isSelected = selectedPresetIndex === idx;
              return (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{sample.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono text-indigo-200">
                    {sample.system}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Column Physics & Diffractometer Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Grid className="w-3 h-3 text-indigo-400" />
              Crystal Symmetry System
            </label>
            <select
              value={crystalSystem}
              onChange={(e) => setCrystalSystem(e.target.value as CrystalSystem)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Cubic">Cubic (a=b=c, 90°)</option>
              <option value="Tetragonal">Tetragonal (a=b≠c, 90°)</option>
              <option value="Hexagonal">Hexagonal (a=b≠c, γ=120°)</option>
              <option value="Trigonal">Trigonal / Rhombohedral</option>
              <option value="Orthorhombic">Orthorhombic (a≠b≠c, 90°)</option>
              <option value="Monoclinic">Monoclinic (a≠b≠c, β≠90°)</option>
              <option value="Triclinic">Triclinic (a≠b≠c, α≠β≠γ)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-indigo-400" />
              Systematic Drift Function f(θ)
            </label>
            <select
              value={driftType}
              onChange={(e) => setDriftType(e.target.value as DriftFunctionType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="nelson_riley">Nelson-Riley: ½(cos²θ/sinθ + cos²θ/θ)</option>
              <option value="taylor_sinclair">Taylor-Sinclair: ½cos²θ sinθ(1/sinθ + 1/θ)</option>
              <option value="sample_displacement">Sample Displacement: cos²θ sinθ</option>
              <option value="bradley_jay">Bradley-Jay: cos²θ</option>
              <option value="hess_hagg">Hess-Hägg: sin²(2θ)</option>
              <option value="zero_shift">Detector Zero-Shift: sin(2θ)</option>
              <option value="flat_specimen">Flat Specimen Transparency: cotθ</option>
              <option value="dual_drift">Dual-Drift: NR + Zero-Shift (D₁, D₂)</option>
              <option value="none">Fixed Zero: D = 0 (Calibrated)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-indigo-400" />
              Least-Squares Weighting wᵢ
            </label>
            <select
              value={weightingScheme}
              onChange={(e) => setWeightingScheme(e.target.value as WeightingScheme)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="hess_hagg">Hess-Hägg Angular: wᵢ = csc²(2θᵢ)</option>
              <option value="huber_robust">Huber IRLS Robust (Outlier-Resistant)</option>
              <option value="statistical">d-Spacing Variance: wᵢ = tan²θᵢ / dᵢ²</option>
              <option value="intensity">Intensity-Weighted: √Iᵢ / sin²(2θᵢ)</option>
              <option value="unit">Uniform Unit Weighting: wᵢ = 1.0</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-3 h-3 text-indigo-400" />
              Wavelength λ (Å)
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                step="0.00001"
                value={wavelength}
                onChange={(e) => setWavelength(parseFloat(e.target.value) || 1.54056)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-black font-mono text-white focus:ring-2 focus:ring-indigo-500 outline-none min-w-0"
              />
              <div className="flex gap-1 shrink-0">
                {ANODE_PRESETS.slice(0, 3).map(an => (
                  <button
                    key={an.label}
                    type="button"
                    onClick={() => setWavelength(an.lambda)}
                    title={an.title}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-colors border ${
                      Math.abs(wavelength - an.lambda) < 0.0002
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {an.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-indigo-400" />
              Goniometer Radius R (mm)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="5"
                min="100"
                max="1000"
                value={goniometerRadiusMm}
                onChange={(e) => setGoniometerRadiusMm(Math.max(50, parseFloat(e.target.value) || 240))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-black font-mono text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                Δz = {refinementData ? `${refinementData.aberrations.sampleDisplacementUm.toFixed(1)}μm` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Meaning Verdict Banner */}
      {refinementData && (
        <PhysicalMeaningSummary
          title="Cohen Least-Squares Refinement Verdict"
          tone={refinementData.rmsTwoThetaShift < 0.02 ? 'success' : 'warning'}
          statement={`Refined zero-drift lattice constant a₀ = ${refinementData.lattice.a.toFixed(5)} ± ${refinementData.sigma.sigmaA.toFixed(5)} Å with unit cell volume V₀ = ${refinementData.volume.toFixed(3)} ± ${refinementData.sigma.sigmaVolume.toFixed(3)} Å³.`}
          contextNote={`Systematic drift D = ${refinementData.D.toExponential(3)} (${driftType.replace('_', ' ')}) corresponds to an equivalent specimen displacement Δz ≈ ${refinementData.aberrations.sampleDisplacementUm.toFixed(1)} μm (R = ${goniometerRadiusMm} mm). RMS angular residual is ±${refinementData.rmsTwoThetaShift.toFixed(4)}° (F_N = ${refinementData.smithSnyderFN.toFixed(1)}, M_20 = ${refinementData.deWolffM20.toFixed(1)}).`}
          metrics={[
            { label: 'Lattice a₀', value: refinementData.lattice.a.toFixed(5), unit: 'Å' },
            ...(crystalSystem !== 'Cubic' ? [{ label: 'Lattice c₀', value: (refinementData.lattice.c || 0).toFixed(5), unit: 'Å' }] : []),
            { label: 'Cell Volume V₀', value: refinementData.volume.toFixed(3), unit: 'Å³' },
            { label: 'RMS Δ2θ', value: `±${refinementData.rmsTwoThetaShift.toFixed(4)}`, unit: '°' },
            { label: 'Smith-Snyder F_N', value: refinementData.smithSnyderFN.toFixed(1), unit: '' }
          ]}
        />
      )}

      {/* Error State or Main Telemetry & Workspace */}
      {!isSuccess ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-800 dark:text-rose-200 flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Matrix Refinement Singularity or Insufficient Reflections</h4>
              <p className="text-xs">{(refinementResult as any).error}</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-300/80">
                Verify that your enabled reflections span all independent crystallographic axes for {crystalSystem} symmetry, or switch to the Reflections tab below to enable more peaks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearAllPeaks}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shrink-0"
          >
            Reset Reflections
          </button>
        </div>
      ) : (
        refinementData && (
          <div className="space-y-5">
            {/* 6-Card High-Precision Telemetry Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Card 1: Primary Lattice Constant a0 */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Lattice a₀</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                    ±{((refinementData.sigma.sigmaA / refinementData.lattice.a) * 1e6).toFixed(1)} ppm
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                  {refinementData.lattice.a.toFixed(decimalPrecision + 1)}
                  <span className="text-xs font-normal text-slate-400 ml-1">Å</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  σ(a) = ±{refinementData.sigma.sigmaA.toFixed(decimalPrecision + 2)} Å
                </div>
              </div>

              {/* Card 2: Secondary Lattice Constants (b, c, angles) */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {crystalSystem === 'Cubic'
                      ? 'Cubic Symmetry'
                      : crystalSystem === 'Monoclinic' || crystalSystem === 'Orthorhombic' || crystalSystem === 'Triclinic'
                      ? 'Axes b₀ & c₀'
                      : 'Lattice c₀ & c/a'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{crystalSystem}</span>
                </div>
                {crystalSystem === 'Cubic' ? (
                  <>
                    <div className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                      a = b = c
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      α = β = γ = 90.00°
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 truncate">
                      {(crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic' || crystalSystem === 'Triclinic') && (
                        <span className="mr-2">b={refinementData.lattice.b.toFixed(4)}Å</span>
                      )}
                      <span>c={refinementData.lattice.c.toFixed(4)}Å</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                      {crystalSystem === 'Monoclinic'
                        ? `β = ${refinementData.lattice.betaDeg.toFixed(3)}° ± ${refinementData.sigma.sigmaBeta.toFixed(3)}°`
                        : crystalSystem === 'Triclinic'
                        ? `α=${refinementData.lattice.alphaDeg.toFixed(1)}° β=${refinementData.lattice.betaDeg.toFixed(1)}° γ=${refinementData.lattice.gammaDeg.toFixed(1)}°`
                        : `c/a = ${(refinementData.lattice.c / refinementData.lattice.a).toFixed(5)}`}
                    </div>
                  </>
                )}
              </div>

              {/* Card 3: Unit Cell Volume & Theoretical Density */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cell Volume V₀</span>
                  {theoreticalDensity && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      ρ={theoreticalDensity.rho.toFixed(3)} g/cm³
                    </span>
                  )}
                </div>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {refinementData.volume.toFixed(3)}
                  <span className="text-xs font-normal text-slate-400 ml-1">Å³</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  σ(V) = ±{refinementData.sigma.sigmaVolume.toFixed(3)} Å³
                </div>
              </div>

              {/* Card 4: Systematic Drift & Physical Goniometer Diagnosis */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Drift Coeff D</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                    Δz ≈ {refinementData.aberrations.sampleDisplacementUm.toFixed(1)} μm
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {refinementData.D.toExponential(3)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                  σ(D) = ±{refinementData.sigma.sigmaD.toExponential(2)}
                </div>
              </div>

              {/* Card 5: Angular & d-Spacing Residuals */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">RMS Δ2θ Shift</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    R_wp={refinementData.rwpPct.toFixed(2)}%
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">
                  ±{refinementData.rmsTwoThetaShift.toFixed(4)}°
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  RMS Δd/d = ±{refinementData.rmsDeltaDPpm.toFixed(1)} ppm
                </div>
              </div>

              {/* Card 6: Indexing Figures of Merit & Conditioning */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Indexing FoM</span>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    DOF={refinementData.dof}
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                  F<sub>N</sub>={refinementData.smithSnyderFN.toFixed(1)}{' '}
                  <span className="text-xs text-slate-500">M<sub>20</sub>={refinementData.deWolffM20.toFixed(1)}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  κ₁(M) = {(refinementData.conditionNumber || 1).toExponential(2)}
                </div>
              </div>
            </div>

            {/* Certified Reference Comparison Bar */}
            {activePreset?.refLattice?.a && (
              <div className="px-4 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Literature Certified Reference ({activePreset.name}):{' '}
                    <strong>a_ref = {activePreset.refLattice.a} Å</strong>
                    {activePreset.spaceGroup && <span className="ml-2 text-slate-500">[{activePreset.spaceGroup}]</span>}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                    Δa = {(refinementData.lattice.a - activePreset.refLattice.a >= 0 ? '+' : '') + (refinementData.lattice.a - activePreset.refLattice.a).toFixed(5)} Å (
                    {((Math.abs(refinementData.lattice.a - activePreset.refLattice.a) / activePreset.refLattice.a) * 1e6).toFixed(1)} ppm)
                  </span>
                  <span className="text-slate-500">
                    Z-score: {(Math.abs(refinementData.lattice.a - activePreset.refLattice.a) / Math.max(1e-6, refinementData.sigma.sigmaA)).toFixed(2)}σ
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('plots')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'plots'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Extrapolation &amp; Residual Plots
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('peaks')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'peaks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Reflections &amp; Auto-HKL ({peaks.filter(p => p.enabled !== false).length}/{peaks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('benchmark')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'benchmark'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          9-Kernel Drift Benchmark
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Normal Matrix [M] &amp; Covariance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tensor')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'tensor'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Metric Tensor [G] &amp; Density
        </button>
      </div>

      {/* Tab 1: Interactive Plots */}
      {activeTab === 'plots' && refinementData && (
        <CohenPlots
          peakDetails={refinementData.peakDetails}
          crystalSystem={crystalSystem}
          driftType={driftType}
          refinedLattice={refinementData.lattice}
          sigmaLattice={refinementData.sigma}
          refLatticeA={activePreset?.refLattice?.a}
          wavelength={wavelength}
          driftD={refinementData.D}
          rmsTwoTheta={refinementData.rmsTwoThetaShift}
          precision={decimalPrecision}
          onTogglePeak={handleTogglePeakById}
        />
      )}

      {/* Tab 2: Peak Reflections Table (Always accessible even if refinement has singular matrix error) */}
      {(activeTab === 'peaks' || !isSuccess) && (
        <CohenPeakTable
          peaks={peaks}
          peakDetails={refinementData?.peakDetails || []}
          crystalSystem={crystalSystem}
          wavelength={wavelength}
          refinedLattice={
            refinementData?.lattice || {
              a: activePreset?.refLattice?.a || 5.431,
              b: activePreset?.refLattice?.b || activePreset?.refLattice?.a || 5.431,
              c: activePreset?.refLattice?.c || activePreset?.refLattice?.a || 5.431,
              betaDeg: activePreset?.refLattice?.betaDeg || 90
            }
          }
          onUpdatePeak={handleUpdatePeak}
          onDeletePeak={handleDeletePeak}
          onAddPeak={handleAddPeak}
          onClearAll={handleClearAllPeaks}
          onOpenBulkModal={() => setShowBulkModal(true)}
          onOpenImportModal={() => setShowImportModal(true)}
          activeBraggCount={activeResults?.length || 0}
          precision={decimalPrecision}
        />
      )}

      {/* Tab 3: Multi-Model Comparator */}
      {activeTab === 'benchmark' && refinementData && (
        <CohenModelComparator
          peaks={peaks}
          crystalSystem={crystalSystem}
          wavelength={wavelength}
          activeDriftType={driftType}
          onSelectDriftType={(drift) => setDriftType(drift)}
          solveSystem={solveSystemForComparator}
          precision={decimalPrecision}
        />
      )}

      {/* Tab 4: Matrix Normal Equations */}
      {activeTab === 'matrix' && refinementData && (
        <CohenMatrixInspector
          matrixM={refinementData.matrixM}
          matrixMInv={refinementData.matrixMInv}
          vectorY={refinementData.vectorY}
          vectorX={refinementData.vectorX}
          matrixLabels={matrixLabels}
          validPeaks={refinementData.validPeaks}
          basisMatrix={refinementData.basisMatrix}
          onCopyLatex={handleCopyLatex}
          copiedMatrix={copiedMatrix}
          variance={refinementData.variance}
          dof={refinementData.dof}
          sumResidualSquare={refinementData.sumResidualSquare}
          crystalSystem={crystalSystem}
          wavelength={wavelength}
          driftType={driftType}
        />
      )}

      {/* Tab 5: Metric Tensor & Crystallographic Density */}
      {activeTab === 'tensor' && refinementData && (
        <CohenMetricTensorCard
          lattice={refinementData.lattice}
          sigma={refinementData.sigma}
          volume={refinementData.volume}
          crystalSystem={crystalSystem}
          molarMass={activePreset?.molarMass}
          formulaUnitsZ={activePreset?.formulaUnitsZ}
          precision={decimalPrecision}
        />
      )}

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Paste Bulk Reflection Peak Data
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkParseError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Paste space, comma, or tab-delimited columns in the format: <br />
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                h  k  l  2theta  [intensity]
              </code>{' '}
              or{' '}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                2theta  h  k  l  [intensity]
              </code>
            </p>

            {bulkParseError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {bulkParseError}
              </div>
            )}

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`1 1 1 28.442 100\n2 2 0 47.302 55\n3 1 1 56.121 30\n4 0 0 69.130 6`}
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkParseError(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseBulk}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Import Reflections
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Import Active Bragg Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Import Active Bragg Reflections
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Found <strong>{activeResults?.length || 0}</strong> active diffraction peak results from the current XRD session. Load them into Cohen&apos;s matrix refinement console?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportActiveBragg}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Confirm Import
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
