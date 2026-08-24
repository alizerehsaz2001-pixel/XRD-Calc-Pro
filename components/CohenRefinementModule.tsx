import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import { 
  Calculator, 
  Grid, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Info, 
  Cpu, 
  Database,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  FileText,
  X,
  Edit3,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Scale,
  Award,
  RotateCcw
} from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { ScientificMathControl } from './ScientificMathControl';

import {
  CrystalSystem,
  DriftFunctionType,
  PeakInput,
  PresetSample,
  COHEN_PRESET_SAMPLES
} from './cohen_refinement/CohenPresetsDb';
import {
  runCohenRefinement,
  calculateDrift,
  solveLinearSystem,
  CohenRefinementResult,
  CohenRefinementOutput
} from './cohen_refinement/CohenSolver';
import { CohenPlots } from './cohen_refinement/CohenPlots';
import { CohenModelComparator } from './cohen_refinement/CohenModelComparator';
import { CohenMetricTensorCard } from './cohen_refinement/CohenMetricTensorCard';
import { CohenMatrixInspector } from './cohen_refinement/CohenMatrixInspector';
import { CohenPeakTable } from './cohen_refinement/CohenPeakTable';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

interface CohenRefinementModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string | null;
}

export const CohenRefinementModule: React.FC<CohenRefinementModuleProps> = ({
  activeResults,
  activeMaterialName
}) => {
  const { t } = useTranslation();
  const { precision = 4 } = useSettings();
  const decimalPrecision = precision;

  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState(0);

  // Active Preset and Configuration State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [driftType, setDriftType] = useState<DriftFunctionType>('nelson_riley');
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [peaks, setPeaks] = useState<PeakInput[]>(COHEN_PRESET_SAMPLES[0].peaks);
  const [activeTab, setActiveTab] = useState<'plots' | 'peaks' | 'benchmark' | 'matrix' | 'tensor'>('plots');

  // Modals & UI States
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Active Preset Metadata
  const activePreset = COHEN_PRESET_SAMPLES[selectedPresetIndex];

  // Load Preset Handler
  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const preset = COHEN_PRESET_SAMPLES[idx];
    setCrystalSystem(preset.system);
    setWavelength(preset.wavelength);
    setPeaks(preset.peaks.map(p => ({ ...p, enabled: true })));
  };

  // Peak Management Handlers
  const handleUpdatePeak = (id: string, field: keyof PeakInput, value: any) => {
    setPeaks(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
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
    if (window.confirm('Reset all peak reflections to the current material preset default?')) {
      if (activePreset) {
        setPeaks(activePreset.peaks.map(p => ({ ...p, enabled: true })));
      }
    }
  };

  // Bulk Paste Handler
  const handleParseBulk = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: PeakInput[] = [];

    lines.forEach((line, idx) => {
      // Clean comments or headers
      if (line.startsWith('#') || line.startsWith('//') || line.toLowerCase().includes('two') || line.toLowerCase().includes('theta')) {
        return;
      }
      // Split by comma, tab, space, or semicolon
      const parts = line.split(/[,\t;\s]+/).filter(Boolean);
      if (parts.length >= 4) {
        // Format: h k l 2theta [intensity] or 2theta h k l [intensity]
        let h = 0, k = 0, l = 0, tt = 0, intensity = 100;
        const p0 = parseFloat(parts[0]);
        const p1 = parseFloat(parts[1]);
        const p2 = parseFloat(parts[2]);
        const p3 = parseFloat(parts[3]);

        if (p0 > 5 && p0 < 175 && Math.abs(p1) <= 20 && Math.abs(p2) <= 20 && Math.abs(p3) <= 20) {
          // 2theta h k l
          tt = p0;
          h = Math.round(p1);
          k = Math.round(p2);
          l = Math.round(p3);
          if (parts[4]) intensity = parseFloat(parts[4]) || 100;
        } else {
          // h k l 2theta
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
    } else {
      alert('Could not parse at least 2 valid peak rows. Ensure format is: h k l 2theta (or 2theta h k l).');
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
  };

  // Solve Refinement Result
  const refinementResult: CohenRefinementResult = useMemo(() => {
    return runCohenRefinement(peaks, crystalSystem, driftType, wavelength);
  }, [peaks, crystalSystem, driftType, wavelength]);

  const isSuccess = !(refinementResult as any).error;
  const refinementData = isSuccess ? (refinementResult as CohenRefinementOutput) : null;

  // Matrix Labels
  const matrixLabels = useMemo(() => {
    if (crystalSystem === 'Cubic') return ['A', 'D'];
    if (crystalSystem === 'Tetragonal') return ['A', 'C', 'D'];
    if (crystalSystem === 'Hexagonal') return ['A', 'C', 'D'];
    if (crystalSystem === 'Orthorhombic') return ['A', 'B', 'C', 'D'];
    if (crystalSystem === 'Monoclinic') return ['A', 'B', 'C', 'E', 'D'];
    return ['A', 'D'];
  }, [crystalSystem]);

  // Fast Solver for Multi-Model Comparator
  const solveSystemForComparator = useMemo(() => {
    return (testDrift: DriftFunctionType) => {
      const res = runCohenRefinement(peaks, crystalSystem, testDrift, wavelength);
      if ((res as any).error) return null;
      const data = res as CohenRefinementOutput;
      return {
        a: data.lattice.a,
        b: data.lattice.b,
        c: data.lattice.c,
        sigmaA: data.sigma.sigmaA,
        D: data.D,
        rmsTwoTheta: data.rmsTwoThetaShift,
        sumResidualSquare: data.sumResidualSquare
      };
    };
  }, [peaks, crystalSystem, wavelength]);

  // Copy LaTeX representation
  const handleCopyLatex = () => {
    if (!refinementData) return;
    const { matrixM, matrixMInv, vectorY, vectorX, lattice, sigma } = refinementData;
    
    let latex = `% Cohen's Least-Squares Matrix Refinement Results\n`;
    latex += `\\begin{equation}\n`;
    latex += `\\mathbf{M} = \\begin{pmatrix}\n`;
    latex += matrixM.map(row => row.map(v => v.toExponential(3)).join(' & ')).join(' \\\\\n');
    latex += `\n\\end{pmatrix}\n\\end{equation}\n\n`;

    latex += `% Refined Lattice Parameters:\n`;
    latex += `a = ${lattice.a.toFixed(5)} \\pm ${sigma.sigmaA.toFixed(5)} \\text{ \\AA}\n`;
    if (crystalSystem !== 'Cubic') {
      latex += `c = ${lattice.c.toFixed(5)} \\pm ${sigma.sigmaC.toFixed(5)} \\text{ \\AA}\n`;
    }

    navigator.clipboard.writeText(latex);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2000);
  };

  // Copy Full Text Report
  const handleCopyReport = () => {
    if (!refinementData) return;
    const { lattice, sigma, volume, rmsTwoThetaShift, D, variance, dof } = refinementData;
    
    let rep = `=== COHEN'S LEAST-SQUARES REFINEMENT REPORT ===\n`;
    rep += `Material: ${activePreset?.name || 'Custom Sample'}\n`;
    rep += `Crystal System: ${crystalSystem}\n`;
    rep += `Drift Model: ${driftType}\n`;
    rep += `X-ray Wavelength: ${wavelength} Å\n\n`;
    rep += `REFINED LATTICE CONSTANTS:\n`;
    rep += `  a = ${lattice.a.toFixed(decimalPrecision + 1)} ± ${sigma.sigmaA.toFixed(decimalPrecision + 2)} Å\n`;
    if (crystalSystem !== 'Cubic') {
      rep += `  b = ${lattice.b.toFixed(decimalPrecision + 1)} ± ${sigma.sigmaB.toFixed(decimalPrecision + 2)} Å\n`;
      rep += `  c = ${lattice.c.toFixed(decimalPrecision + 1)} ± ${sigma.sigmaC.toFixed(decimalPrecision + 2)} Å\n`;
    }
    if (crystalSystem === 'Monoclinic') {
      rep += `  beta = ${lattice.betaDeg.toFixed(3)}°\n`;
    }
    rep += `  Volume V = ${volume.toFixed(4)} ± ${sigma.sigmaVolume.toFixed(4)} Å³\n`;
    rep += `  Drift Parameter D = ${D.toExponential(4)}\n\n`;
    rep += `RESIDUAL QUALITY METRICS:\n`;
    rep += `  RMS 2θ Shift: ±${rmsTwoThetaShift.toFixed(4)}°\n`;
    rep += `  Variance s²: ${variance.toExponential(4)} (DOF = ${dof})\n`;
    rep += `  Total Active Reflections: ${refinementData.validPeaks.length}\n`;

    navigator.clipboard.writeText(rep);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 600); // Building matrix
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 1200); // Solving
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('chime');
    }, 1800); // Extracting parameters
    setTimeout(() => {
      setAppState('results');
    }, 2400);
  };

  const cohenWalkthroughSteps: WizardStep[] = [
    {
      title: 'Choose Crystal Symmetry & Indexed (hkl, 2θ) Peaks',
      subtitle: 'Cubic, Tetragonal, Hexagonal, Orthorhombic, or Monoclinic',
      explanation: 'Cohen’s method requires at least as many independent reflections as unknowns (e.g. 2 for Cubic: A and drift D; 3 for Tetragonal/Hexagonal: A, C, D; 4 for Orthorhombic: A, B, C, D).',
      tip: 'High-angle reflections (2θ > 60°) have significantly lower systematic error and should always be included for highest lattice precision.'
    },
    {
      title: 'Select Instrumental Drift Error Function δ',
      subtitle: 'Nelson-Riley, Bradley-Jay, or Flat Sample Displacement',
      explanation: 'Systematic diffractometer errors scale with trigonometric functions of Bragg angle θ. The Nelson-Riley function δ = cos²θ/sinθ + cos²θ/θ accounts for absorption and beam divergence; cos²θ accounts for flat specimen displacement.',
      tip: 'Nelson-Riley is the gold standard for standard Bragg-Brentano parafocusing diffractometers.'
    },
    {
      title: 'Solve Normal Equations Matrix [M][X] = [Y]',
      subtitle: 'Analytical Least-Squares Inversion without Initial Guesses',
      explanation: 'Constructs the symmetric normal matrix M by summing polynomial terms ∑ αᵢ², ∑ αᵢδᵢ, etc. Unlike iterative non-linear refinement, Cohen’s method solves the exact global minimum algebraically in one step.',
      tip: 'Condition number of matrix M evaluates numerical stability; orthogonalized parameters prevent matrix singularity.'
    },
    {
      title: 'Extract Lattice Constants & Standard Uncertainties (σ)',
      subtitle: 'Covariance Matrix [C] = s² [M]⁻¹',
      explanation: 'Lattice constants a, b, c are computed from coefficients A, B, C (e.g. a = λ / 2√A). Uncertainties σ(a) are derived from the diagonal elements of the inverse covariance matrix and residual variance s².',
      tip: 'Residual RMS 2θ shift should typically be below ±0.01° for research-grade instrument calibration.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Cohen's Analytical Least-Squares Matrix Refinement"
        description="Master systematic error deconvolution, Nelson-Riley drift models, normal equation matrices, and precision lattice parameters."
        steps={cohenWalkthroughSteps}
        presetNames={COHEN_PRESET_SAMPLES.map(p => `${p.name} (${p.system})`)}
        onLoadBenchmarkPreset={(idx) => {
          handleSelectPreset(idx);
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      {appState === 'results' && refinementData && (
        <PhysicalMeaningSummary
          title="Cohen Least-Squares Refinement Verdict"
          tone={refinementData.rmsTwoThetaShift < 0.02 ? 'success' : 'warning'}
          statement={`Refined lattice parameter a = ${refinementData.lattice.a.toFixed(5)} ± ${refinementData.sigma.sigmaA.toFixed(5)} Å with unit cell volume V = ${refinementData.volume.toFixed(3)} Å³.`}
          contextNote={`Systematic error drift parameter D = ${refinementData.D.toExponential(3)} using ${driftType} model. Average RMS 2θ residual shift is ±${refinementData.rmsTwoThetaShift.toFixed(4)}° across ${refinementData.validPeaks.length} diffraction reflections. ${refinementData.rmsTwoThetaShift < 0.015 ? 'Excellent diffractometer alignment and zero-shift calibration.' : 'Moderate angular residuals; verify sample displacement or zero-point alignment.'}`}
          metrics={[
            { label: 'Lattice a', value: refinementData.lattice.a.toFixed(4), unit: 'Å' },
            ...(crystalSystem !== 'Cubic' ? [{ label: 'Lattice c', value: (refinementData.lattice.c || 0).toFixed(4), unit: 'Å' }] : []),
            { label: 'Cell Volume V', value: refinementData.volume.toFixed(2), unit: 'Å³' },
            { label: 'RMS 2θ Shift', value: `±${refinementData.rmsTwoThetaShift.toFixed(3)}`, unit: '°' },
            { label: 'Drift Constant D', value: refinementData.D.toExponential(2), unit: '' }
          ]}
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/30 relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              High-Precision Powder Diffraction Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Calculator className="w-8 h-8 text-indigo-400" />
              Cohen's Least-Squares Matrix Refinement
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Eliminate systematic diffractometer misalignment, sample displacement, and camera radius errors by simultaneously solving for true zero-drift lattice parameters and error drift constants using analytical normal equations $[M][X] = [Y]$.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {appState === 'results' && (
              <>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  disabled={!isSuccess}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 animate-in fade-in"
                >
                  {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-300" />}
                  {copiedReport ? 'Report Copied!' : 'Copy Summary Report'}
                </button>
                <button 
                  onClick={() => setAppState('setup')}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold transition-all border border-indigo-700 flex items-center gap-2 animate-in fade-in"
                >
                  <RotateCcw className="w-4 h-4" />
                  Edit Parameters
                </button>
              </>
            )}
          </div>
        </div>

        {appState === 'setup' && (
          <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Preset Selector Bar */}
            <div className="pt-6 border-t border-indigo-900/40">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Standard Reference Materials &amp; Presets:
                </span>
                {activePreset?.refLattice?.a && (
                  <span className="text-xs text-slate-300 font-mono">
                    Literature Reference: <strong className="text-indigo-300">{activePreset.refLattice.a} Å</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {COHEN_PRESET_SAMPLES.map((sample, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => handleSelectPreset(idx)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{sample.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono text-indigo-200">
                        {sample.system}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control Toolbar: Crystal System, Drift Function, Wavelength */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-5 md:p-6 border border-indigo-500/20 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-indigo-400" />
                    Crystal Symmetry System
                  </label>
                  <select
                    value={crystalSystem}
                    onChange={(e) => setCrystalSystem(e.target.value as CrystalSystem)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-indigo-500/30 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
                  >
                    <option value="Cubic">Cubic (a = b = c, α = β = γ = 90°)</option>
                    <option value="Tetragonal">Tetragonal (a = b ≠ c, α = β = γ = 90°)</option>
                    <option value="Hexagonal">Hexagonal (a = b ≠ c, α = β = 90°, γ = 120°)</option>
                    <option value="Orthorhombic">Orthorhombic (a ≠ b ≠ c, α = β = γ = 90°)</option>
                    <option value="Monoclinic">Monoclinic (a ≠ b ≠ c, α = γ = 90°, β ≠ 90°)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Systematic Drift Error Model
                  </label>
                  <select
                    value={driftType}
                    onChange={(e) => setDriftType(e.target.value as DriftFunctionType)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-indigo-500/30 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
                  >
                    <option value="nelson_riley">Nelson-Riley: ½(cos²θ/sinθ + cos²θ/θ)</option>
                    <option value="sample_displacement">Sample Displacement: cos²θ sinθ</option>
                    <option value="bradley_jay">Bradley-Jay: cos²θ</option>
                    <option value="hess_hagg">Hess-Hägg: sin²(2θ)</option>
                    <option value="zero_shift">Pure Zero Shift: cosθ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                    X-ray Wavelength λ (Å)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.00001"
                      value={wavelength}
                      onChange={(e) => setWavelength(parseFloat(e.target.value) || 1.54056)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-indigo-500/30 rounded-xl text-sm font-black font-mono text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setWavelength(1.54056)}
                      className="px-2.5 py-1 bg-indigo-900 text-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-800 transition-colors border border-indigo-700 shrink-0"
                      title="Cu Kα1 (1.54056 Å)"
                    >
                      Cu Kα
                    </button>
                    <button
                      type="button"
                      onClick={() => setWavelength(0.71073)}
                      className="px-2.5 py-1 bg-indigo-900 text-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-800 transition-colors border border-indigo-700 shrink-0"
                      title="Mo Kα (0.71073 Å)"
                    >
                      Mo Kα
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Peak Input Editor within Setup */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-5 md:p-6 border border-indigo-500/20 shadow-sm overflow-hidden">
               <div className="flex justify-between items-center mb-4">
                 <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Peak Reflections Editor ({peaks.length})
                 </label>
                 <div className="flex gap-2">
                    <button onClick={() => setShowImportModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Import Active</button>
                    <button onClick={() => setShowBulkModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors">Bulk Paste</button>
                 </div>
               </div>
               <div className="max-h-64 overflow-y-auto pr-2 rounded-xl">
                 <CohenPeakTable 
                   peaks={peaks}
                   peakDetails={refinementData?.peakDetails || []}
                   onUpdatePeak={handleUpdatePeak}
                   onDeletePeak={handleDeletePeak}
                   onAddPeak={handleAddPeak}
                   onClearAll={handleClearAllPeaks}
                   onOpenBulkModal={() => setShowBulkModal(true)}
                   onOpenImportModal={() => setShowImportModal(true)}
                 />
               </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={startComputation} 
                className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-95"
              >
                Compute Least-Squares Refinement
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {appState === 'computing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Calculator className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">1</span>
                Constructing Normal Equations Matrix [M]...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 1 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">2</span>
                Applying {driftType.replace('_', ' ')} error model...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 2 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">3</span>
                Solving [X] = [M]⁻¹ [Y] for lattice & drift constants...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 3 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">4</span>
                Extracting final parameters & computing variance...
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Error Alert or Main Hero Results */}
      {!isSuccess ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-3xl text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Refinement Calculation Error</h4>
            <p className="text-xs">{(refinementResult as any).error}</p>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80">
              Please check that your active reflection peaks provide sufficient non-coplanar indices for the selected crystal system.
            </p>
          </div>
        </div>
      ) : refinementData && (
        <div className="space-y-6">
          {/* Hero Refined Parameters Card */}
          <div className="bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10 dark:from-indigo-950/20 dark:via-slate-900 dark:to-indigo-950/40 p-6 md:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-indigo-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Refinement Converged Successfully
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Zero-Drift Refined Lattice Constants
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-black rounded-xl font-mono">
                  RMS Δ2θ: ±{refinementData.rmsTwoThetaShift.toFixed(4)}°
                </span>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-black rounded-xl font-mono">
                  {refinementData.validPeaks.length} Peaks
                </span>
              </div>
            </div>

            {/* Grid of Main Lattice Constants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Parameter a */}
              <div className="p-4 bg-white dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Lattice Parameter a₀</div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                  {refinementData.lattice.a.toFixed(decimalPrecision + 1)}
                  <span className="text-sm font-normal text-slate-400 ml-1">Å</span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  σ(a) = ±{refinementData.sigma.sigmaA.toFixed(decimalPrecision + 2)} Å
                </div>
              </div>

              {/* Parameter b (if orthorhombic / monoclinic) */}
              {crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic' ? (
                <div className="p-4 bg-white dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Lattice Parameter b₀</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                    {refinementData.lattice.b.toFixed(decimalPrecision + 1)}
                    <span className="text-sm font-normal text-slate-400 ml-1">Å</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    σ(b) = ±{refinementData.sigma.sigmaB.toFixed(decimalPrecision + 2)} Å
                  </div>
                </div>
              ) : null}

              {/* Parameter c (if not cubic) */}
              {crystalSystem !== 'Cubic' && (
                <div className="p-4 bg-white dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Lattice Parameter c₀</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                    {refinementData.lattice.c.toFixed(decimalPrecision + 1)}
                    <span className="text-sm font-normal text-slate-400 ml-1">Å</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    σ(c) = ±{refinementData.sigma.sigmaC.toFixed(decimalPrecision + 2)} Å
                  </div>
                </div>
              )}

              {/* Monoclinic Beta Angle */}
              {crystalSystem === 'Monoclinic' && (
                <div className="p-4 bg-white dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Monoclinic Angle β</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                    {refinementData.lattice.betaDeg.toFixed(3)}
                    <span className="text-sm font-normal text-slate-400 ml-1">°</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    cos(β) = {(-refinementData.vectorX[3] / (2 * Math.sqrt(refinementData.vectorX[0] * refinementData.vectorX[2]))).toFixed(5)}
                  </div>
                </div>
              )}

              {/* Unit Cell Volume */}
              <div className="p-4 bg-white dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Cell Volume V₀</div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {refinementData.volume.toFixed(3)}
                  <span className="text-sm font-normal text-slate-400 ml-1">Å³</span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  σ(V) = ±{refinementData.sigma.sigmaVolume.toFixed(3)} Å³
                </div>
              </div>

              {/* Drift Constant D */}
              <div className="p-4 bg-white dark:bg-slate-950/80 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Systematic Constant D</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                  {refinementData.D.toExponential(3)}
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  Variance s² = {refinementData.variance.toExponential(3)}
                </div>
              </div>
            </div>

            {/* Reference Comparison Banner if literature value exists */}
            {activePreset?.refLattice?.a && (
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Literature Reference ({activePreset.name}): <strong>a = {activePreset.refLattice.a} Å</strong></span>
                </div>
                <div className="text-indigo-700 dark:text-indigo-300 font-bold">
                  Absolute Offset: {Math.abs(refinementData.lattice.a - activePreset.refLattice.a).toFixed(5)} Å ({((Math.abs(refinementData.lattice.a - activePreset.refLattice.a) / activePreset.refLattice.a) * 1e6).toFixed(1)} ppm)
                </div>
              </div>
            )}
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('plots')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'plots'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              Visual Refinement &amp; Plots
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('peaks')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'peaks'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Peak Reflections ({peaks.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('benchmark')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'benchmark'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Multi-Model Benchmark
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Matrix Normal Equations [M]
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tensor')}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'tensor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              Metric Tensor &amp; Density
            </button>
          </div>

          {/* Tab 1: Interactive Plots */}
          {activeTab === 'plots' && (
            <CohenPlots
              peakDetails={refinementData.peakDetails}
              crystalSystem={crystalSystem}
              driftType={driftType}
              refinedLattice={refinementData.lattice}
              sigmaLattice={refinementData.sigma}
              wavelength={wavelength}
              driftD={refinementData.D}
              rmsTwoTheta={refinementData.rmsTwoThetaShift}
              precision={decimalPrecision}
            />
          )}

          {/* Tab 2: Peak Reflections Table */}
          {activeTab === 'peaks' && (
            <CohenPeakTable
              peaks={peaks}
              peakDetails={refinementData.peakDetails}
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
          {activeTab === 'benchmark' && (
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
          {activeTab === 'matrix' && (
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
          {activeTab === 'tensor' && (
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
        </div>
      )}
      </div>
      )}

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
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
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Paste space, comma, or tab-delimited columns in the format: <br />
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                h  k  l  2theta  [intensity]
              </code>
              <br />or <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                2theta  h  k  l  [intensity]
              </code>
            </p>

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
                onClick={() => setShowBulkModal(false)}
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
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
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
              Found <strong>{activeResults?.length || 0}</strong> active diffraction peak results from the active XRD calculation session. Would you like to load them into Cohen's refinement module?
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
