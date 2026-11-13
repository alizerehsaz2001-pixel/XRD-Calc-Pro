import React, { useState, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  FileText,
  Layers,
  Sliders,
  Compass,
  Atom,
  CheckCircle2,
  Download,
  Upload,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  Activity,
  ChevronRight
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';
import {
  RIETVELD_PRESET_SCENARIOS,
  RietveldPhaseModel,
  InstrumentalResolutionConfig,
  RietveldGlobalParameters,
  RefinementStageId,
  ConvergenceIterationRecord,
  evaluateRietveldForwardModel,
  synthesizeExperimentalDiffractogram,
  runRietveldRefinementStage,
  parseCIFToRietveldPhase,
  computeReciprocalMetricTensor,
  evaluateCromerMannF0
} from '../utils/rietveldEngine';

type WorkflowStepTab =
  | '1_data_bg'
  | '2_phase_cif'
  | '3_global'
  | '4_lattice'
  | '5_profile'
  | '6_atomic'
  | '7_fit_quality';

type CadSchematicMode = 'forward_model' | 'caglioti_irf' | 'structure_factor_argand';

export const RietveldRefinementModule: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tio2_anatase_rutile');
  const activePreset = useMemo(
    () =>
      RIETVELD_PRESET_SCENARIOS.find((p) => p.id === selectedPresetId) ||
      RIETVELD_PRESET_SCENARIOS[0],
    [selectedPresetId]
  );

  // Core Rietveld state
  const [instConfig, setInstConfig] = useState<InstrumentalResolutionConfig>(() => ({
    ...RIETVELD_PRESET_SCENARIOS[0].inst
  }));
  const [phases, setPhases] = useState<RietveldPhaseModel[]>(() =>
    JSON.parse(JSON.stringify(RIETVELD_PRESET_SCENARIOS[0].initialPhases))
  );
  const [globalParams, setGlobalParams] = useState<RietveldGlobalParameters>(() =>
    JSON.parse(JSON.stringify(RIETVELD_PRESET_SCENARIOS[0].initialGlobal))
  );
  const [experimentalScan, setExperimentalScan] = useState<
    Array<{ twoTheta: number; yObs: number; sigmaObs: number }>
  >(() =>
    synthesizeExperimentalDiffractogram(
      RIETVELD_PRESET_SCENARIOS[0].truePhases,
      RIETVELD_PRESET_SCENARIOS[0].inst,
      RIETVELD_PRESET_SCENARIOS[0].trueGlobal,
      42
    )
  );

  const [activeStepTab, setActiveStepTab] = useState<WorkflowStepTab>('1_data_bg');
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number>(0);
  const [selectedReflectionIdx, setSelectedReflectionIdx] = useState<number>(0);
  const [cadMode, setCadMode] = useState<CadSchematicMode>('forward_model');
  const [convergenceHistory, setConvergenceHistory] = useState<ConvergenceIterationRecord[]>([]);
  const [activeParamCount, setActiveParamCount] = useState<number>(12);
  const [cifEditorText, setCifEditorText] = useState<string>(
    RIETVELD_PRESET_SCENARIOS[0].sampleCifText
  );
  const [rawXYPasteText, setRawXYPasteText] = useState<string>('');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [zoomWindow, setZoomWindow] = useState<[number, number] | null>(null);

  const currentPhase = phases[selectedPhaseIdx] || phases[0];

  // Load a standard preset scenario (either perturbed initial state for refinement practice, or converged state)
  const handleSelectPreset = useCallback(
    (presetId: string, loadConverged = false) => {
      const target =
        RIETVELD_PRESET_SCENARIOS.find((p) => p.id === presetId) ||
        RIETVELD_PRESET_SCENARIOS[0];
      setSelectedPresetId(target.id);
      setInstConfig({ ...target.inst });
      setPhases(
        JSON.parse(
          JSON.stringify(loadConverged ? target.truePhases : target.initialPhases)
        )
      );
      setGlobalParams(
        JSON.parse(
          JSON.stringify(loadConverged ? target.trueGlobal : target.initialGlobal)
        )
      );
      setExperimentalScan(
        synthesizeExperimentalDiffractogram(
          target.truePhases,
          target.inst,
          target.trueGlobal,
          42
        )
      );
      setCifEditorText(target.sampleCifText);
      setSelectedPhaseIdx(0);
      setSelectedReflectionIdx(0);
      setConvergenceHistory([]);
      setZoomWindow(null);
      playSynthTone('switch');
    },
    []
  );

  // Live Rietveld forward model calculation
  const rietveldOutput = useMemo(
    () =>
      evaluateRietveldForwardModel(
        phases,
        instConfig,
        globalParams,
        experimentalScan,
        activeParamCount
      ),
    [phases, instConfig, globalParams, experimentalScan, activeParamCount]
  );

  // Execute a Levenberg-Marquardt refinement stage
  const handleRunRefinementStage = useCallback(
    (stage: RefinementStageId, iterations = 4) => {
      const result = runRietveldRefinementStage(
        stage,
        phases,
        instConfig,
        globalParams,
        experimentalScan,
        iterations
      );
      setPhases(result.phases);
      setGlobalParams(result.globalParams);
      setActiveParamCount(result.activeParamCount);
      setConvergenceHistory((prev) => [
        ...prev,
        ...result.history.map((h, i) => ({
          ...h,
          iteration: prev.length + i + 1
        }))
      ]);
      playSynthTone('success');
    },
    [phases, instConfig, globalParams, experimentalScan]
  );

  // Sequential Full Turn-On Pipeline (Stages 1 -> 2 -> 3 -> 4 -> 5)
  const handleRunSequentialTurnOnPipeline = useCallback(() => {
    let currPhases = JSON.parse(JSON.stringify(phases));
    let currGlobal = JSON.parse(JSON.stringify(globalParams));
    const stagesOrder: RefinementStageId[] = [
      'stage_1_scale_bg',
      'stage_2_zero_disp',
      'stage_3_lattice',
      'stage_4_profile',
      'stage_5_atomic_texture'
    ];
    const newRecords: ConvergenceIterationRecord[] = [];
    let totalParams = 12;

    stagesOrder.forEach((st) => {
      const res = runRietveldRefinementStage(
        st,
        currPhases,
        instConfig,
        currGlobal,
        experimentalScan,
        3
      );
      currPhases = res.phases;
      currGlobal = res.globalParams;
      totalParams = Math.max(totalParams, res.activeParamCount);
      newRecords.push(...res.history);
    });

    setPhases(currPhases);
    setGlobalParams(currGlobal);
    setActiveParamCount(totalParams);
    setConvergenceHistory((prev) => [
      ...prev,
      ...newRecords.map((h, i) => ({
        ...h,
        iteration: prev.length + i + 1
      }))
    ]);
    playSynthTone('success');
  }, [phases, instConfig, globalParams, experimentalScan]);

  // Helper to update a specific phase property
  const updatePhase = useCallback(
    (phaseIndex: number, updater: (p: RietveldPhaseModel) => RietveldPhaseModel) => {
      setPhases((prev) => prev.map((p, idx) => (idx === phaseIndex ? updater(p) : p)));
    },
    []
  );

  // Parse custom XY / DAT text into experimentalScan
  const handleImportXYPattern = useCallback(() => {
    const lines = rawXYPasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'));
    const parsed: Array<{ twoTheta: number; yObs: number; sigmaObs: number }> = [];
    for (const line of lines) {
      const parts = line.split(/[\s,;]+/).map(Number);
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        const y = Math.max(1, parts[1]);
        const sig = parts.length >= 3 && Number.isFinite(parts[2]) && parts[2] > 0 ? parts[2] : Math.sqrt(y);
        parsed.push({ twoTheta: parts[0], yObs: y, sigmaObs: sig });
      }
    }
    if (parsed.length >= 10) {
      parsed.sort((a, b) => a.twoTheta - b.twoTheta);
      const minTT = parsed[0].twoTheta;
      const maxTT = parsed[parsed.length - 1].twoTheta;
      const step = Number(((maxTT - minTT) / Math.max(1, parsed.length - 1)).toFixed(4));
      setExperimentalScan(parsed);
      setGlobalParams((prev) => ({
        ...prev,
        twoThetaMin: minTT,
        twoThetaMax: maxTT,
        stepSize: step > 0 ? step : 0.1
      }));
      playSynthTone('success');
    }
  }, [rawXYPasteText]);

  // Parse CIF text and add/replace phase
  const handleImportCIFPhase = useCallback(
    (mode: 'replace_current' | 'add_new') => {
      const palette = ['#38BDF8', '#F59E0B', '#10B981'];
      const parsedPhase = parseCIFToRietveldPhase(
        cifEditorText,
        palette[mode === 'add_new' ? phases.length % palette.length : selectedPhaseIdx % palette.length]
      );
      if (mode === 'add_new' && phases.length < 3) {
        setPhases((prev) => [...prev, parsedPhase]);
        setSelectedPhaseIdx(phases.length);
      } else {
        setPhases((prev) =>
          prev.map((p, idx) => (idx === selectedPhaseIdx ? parsedPhase : p))
        );
      }
      playSynthTone('success');
    },
    [cifEditorText, phases.length, selectedPhaseIdx]
  );

  // Export Rietveld refinement results as JSON
  const handleExportRietveldJSON = useCallback(() => {
    const payload = {
      instrument: instConfig,
      globalParameters: globalParams,
      agreementIndices: rietveldOutput.agreement,
      quantitativePhaseAnalysis: rietveldOutput.phaseQuant,
      phases,
      reflections: rietveldOutput.reflections.slice(0, 60)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rietveld_refinement_${selectedPresetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [instConfig, globalParams, rietveldOutput, phases, selectedPresetId]);

  // Filtered points for main Rietveld chart (respecting zoomWindow if active)
  const visiblePoints = useMemo(() => {
    if (!zoomWindow) return rietveldOutput.points;
    return rietveldOutput.points.filter(
      (pt) => pt.twoTheta >= zoomWindow[0] && pt.twoTheta <= zoomWindow[1]
    );
  }, [rietveldOutput.points, zoomWindow]);

  // Chart scaling metrics
  const chartDomain = useMemo(() => {
    const pts = visiblePoints.length > 0 ? visiblePoints : rietveldOutput.points;
    if (pts.length === 0) {
      return { minX: 20, maxX: 80, maxY: 1000, maxAbsDiff: 100 };
    }
    const minX = pts[0].twoTheta;
    const maxX = pts[pts.length - 1].twoTheta;
    let maxY = 100;
    let maxAbsDiff = 20;
    for (const p of pts) {
      if (p.yObs > maxY) maxY = p.yObs;
      if (p.yCalc > maxY) maxY = p.yCalc;
      if (Math.abs(p.yDiff) > maxAbsDiff) maxAbsDiff = Math.abs(p.yDiff);
    }
    return {
      minX,
      maxX: Math.max(minX + 1, maxX),
      maxY: maxY * 1.08,
      maxAbsDiff: Math.max(maxY * 0.12, maxAbsDiff * 1.15)
    };
  }, [visiblePoints, rietveldOutput.points]);

  const currentMetricTensor = useMemo(() => {
    if (!currentPhase) return { volume: 100, gStar: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
    return computeReciprocalMetricTensor(
      currentPhase.a,
      currentPhase.b,
      currentPhase.c,
      currentPhase.alpha,
      currentPhase.beta,
      currentPhase.gamma
    );
  }, [currentPhase]);

  const selectedReflection =
    rietveldOutput.reflections[selectedReflectionIdx] || rietveldOutput.reflections[0];

  const workflowSteps: Array<{
    id: WorkflowStepTab;
    stepNum: number;
    shortTitle: string;
    subtitle: string;
    formulaTag: string;
  }> = [
    {
      id: '1_data_bg',
      stepNum: 1,
      shortTitle: 'Data Import & Background',
      subtitle: 'Experimental pattern, IRF & Chebyshev T_n(x)',
      formulaTag: 'I_bg(2θ)'
    },
    {
      id: '2_phase_cif',
      stepNum: 2,
      shortTitle: 'Phase ID & CIF Model',
      subtitle: 'Wyckoff sites, space group & Hill-Howard QPA',
      formulaTag: 'W_p wt%'
    },
    {
      id: '3_global',
      stepNum: 3,
      shortTitle: 'Global Scale & Zero-Shift',
      subtitle: 'Scale S_p, zero-shift Δ2θ₀ & displacement s/R',
      formulaTag: 'Δ2θ_sys'
    },
    {
      id: '4_lattice',
      stepNum: 4,
      shortTitle: 'Lattice Refinement',
      subtitle: 'Unit cell (a,b,c,α,β,γ) & metric tensor G*',
      formulaTag: '1/d²_hkl'
    },
    {
      id: '5_profile',
      stepNum: 5,
      shortTitle: 'Profile & Microstructure',
      subtitle: 'TCH Pseudo-Voigt, Caglioti U,V,W & size/strain X,Y',
      formulaTag: 'H_G · H_L'
    },
    {
      id: '6_atomic',
      stepNum: 6,
      shortTitle: 'Atomic & Texture (F_hkl)',
      subtitle: 'Coordinates (x,y,z), B_iso, SOF & March-Dollase',
      formulaTag: '|F_hkl|²'
    },
    {
      id: '7_fit_quality',
      stepNum: 7,
      shortTitle: 'R-Factors & Fit Quality',
      subtitle: 'R_wp, R_p, R_exp, χ², Durbin-Watson d & R_B',
      formulaTag: 'R_wp · χ²'
    }
  ];

  return (
    <div className="space-y-5 text-slate-100">
      {/* TOP SCIENTIFIC TELEMETRY & PRESET WORKBENCH HEADER */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800/90">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                RIETVELD WHOLE-POWDER PATTERN STRUCTURE REFINEMENT
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] font-mono text-slate-400">
                y_calc(2θᵢ) = y_bg(2θᵢ) + Σ_p S_p Σ_K m_K Lp_K |F_K|² P_K Ω(2θᵢ − 2θ_K)
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Full-Pattern Least-Squares Rietveld Structure & Quantitative Phase Analysis
            </h1>
          </div>

          {/* Preset Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#070A12] border border-slate-800 rounded-lg p-1 gap-1">
              {RIETVELD_PRESET_SCENARIOS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id, false)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                    title={preset.description}
                  >
                    {preset.id === 'tio2_anatase_rutile'
                      ? 'TiO₂ (Anatase+Rutile QPA)'
                      : preset.id === 'sio2_alpha_quartz'
                      ? 'α-SiO₂ Quartz (P3₂21)'
                      : 'NIST LaB₆ (SRM 660c)'}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleRunSequentialTurnOnPipeline}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Execute full 5-stage sequential Levenberg-Marquardt Rietveld turn-on refinement sequence"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Auto-Refine All Stages (L-M)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset(selectedPresetId, false)}
              className="px-2.5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Reset parameters to initial unrefined starting model"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Model</span>
            </button>

            <button
              type="button"
              onClick={handleExportRietveldJSON}
              className="px-2.5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export refined structure, R-factors, and reflections to JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* LIVE AGREEMENT INDICES & QUANTITATIVE PHASE STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-3.5">
          <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Weighted R_wp
            </div>
            <div
              className={`text-base font-mono font-bold tabular-nums mt-0.5 ${
                rietveldOutput.agreement.Rwp < 10
                  ? 'text-emerald-400'
                  : rietveldOutput.agreement.Rwp < 18
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {rietveldOutput.agreement.Rwp.toFixed(2)}%
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Target &lt; 10.0%
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Profile R_p
            </div>
            <div className="text-base font-mono font-bold tabular-nums text-slate-100 mt-0.5">
              {rietveldOutput.agreement.Rp.toFixed(2)}%
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Σ|y_o − y_c| / Σy_o
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Expected R_exp
            </div>
            <div className="text-base font-mono font-bold tabular-nums text-sky-400 mt-0.5">
              {rietveldOutput.agreement.Rexp.toFixed(2)}%
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              dof = {rietveldOutput.agreement.degreesOfFreedom}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Goodness χ² (GoF)
            </div>
            <div
              className={`text-base font-mono font-bold tabular-nums mt-0.5 ${
                rietveldOutput.agreement.chiSquared < 2.2
                  ? 'text-emerald-400'
                  : rietveldOutput.agreement.chiSquared < 5.0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {rietveldOutput.agreement.chiSquared.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({rietveldOutput.agreement.gof.toFixed(2)})
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              (R_wp / R_exp)²
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Bragg R_B
            </div>
            <div className="text-base font-mono font-bold tabular-nums text-amber-400 mt-0.5">
              {rietveldOutput.agreement.totalBraggR.toFixed(2)}%
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {rietveldOutput.reflections.length} (hkl) peaks
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Durbin-Watson d
            </div>
            <div className="text-base font-mono font-bold tabular-nums text-slate-200 mt-0.5">
              {rietveldOutput.agreement.durbinWatsonD.toFixed(3)}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Ideal ≈ 2.00
            </div>
          </div>

          {/* Quantitative Phase Weight Fractions Summary */}
          <div className="col-span-2 p-2.5 rounded-lg bg-[#070A12] border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Hill-Howard QPA Weight Fractions
              </span>
              <span className="text-[10px] font-mono text-sky-400">
                W_p ∝ S_p·Z·M·V
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {rietveldOutput.phaseQuant.map((pq, idx) => (
                <div key={pq.phaseId} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-xs shrink-0"
                    style={{ backgroundColor: phases[idx]?.color || '#38BDF8' }}
                  />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {pq.phaseName}:
                  </span>
                  <span className="text-xs font-mono font-bold tabular-nums text-white">
                    {pq.weightFractionPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7-STEP GUIDED RIETVELD WORKFLOW NAVIGATION BAR */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-1.5">
          {workflowSteps.map((step) => {
            const isActive = activeStepTab === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveStepTab(step.id);
                  playSynthTone('switch');
                }}
                className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border flex flex-col justify-between ${
                  isActive
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-xs'
                    : 'bg-[#070A12]/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    STEP {step.stepNum}
                  </span>
                  <span className="text-[10px] font-mono text-sky-400/90">
                    {step.formulaTag}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold leading-snug text-slate-100 truncate">
                    {step.shortTitle}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                    {step.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN WORKSPACE SPLIT: LEFT = WHOLE-PATTERN RIETVELD PLOT + CAD SCHEMATIC, RIGHT = ACTIVE STEP CONTROLS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 COLS): RIETVELD DIFFRACTOGRAM + DIFFERENCE RESIDUAL + 3-MODE CAD SCHEMATIC */}
        <div className="xl:col-span-7 space-y-4">
          {/* WHOLE-POWDER PATTERN RIETVELD PLOT */}
          <div className="rounded-xl bg-[#070A12] border border-slate-800 p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Whole-Powder Pattern Rietveld Fit & Residual Plot
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    λ = {instConfig.wavelength.toFixed(5)} Å
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Observed counts I_obs (dots), Calculated Rietveld profile I_calc (cyan), Chebyshev background I_bg (amber dashed), Bragg ticks |hkl|, and difference curve ΔI = I_obs − I_calc.
                </p>
              </div>

              {/* Zoom Window Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomWindow(null)}
                  className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border ${
                    zoomWindow === null
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full Scan ({globalParams.twoThetaMin}°–{globalParams.twoThetaMax}°)
                </button>
                <button
                  type="button"
                  onClick={() => setZoomWindow([22, 42])}
                  className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border ${
                    zoomWindow?.[0] === 22
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Low-2θ (22°–42°)
                </button>
                <button
                  type="button"
                  onClick={() => setZoomWindow([42, 68])}
                  className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border ${
                    zoomWindow?.[0] === 42
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  High-2θ (42°–68°)
                </button>
              </div>
            </div>

            {/* SVG RIETVELD PLOT VIEWPORT */}
            <div className="mt-3 relative select-none">
              <svg
                viewBox="0 0 760 390"
                className="w-full h-auto bg-[#050811] rounded-lg border border-slate-800/90 overflow-hidden"
                onMouseLeave={() => setHoveredPointIdx(null)}
              >
                <defs>
                  <pattern id="rietveldSubGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                    <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#0f172a" strokeWidth="0.6" />
                  </pattern>
                  <pattern id="rietveldMajorGrid" width="75" height="75" patternUnits="userSpaceOnUse">
                    <rect width="75" height="75" fill="url(#rietveldSubGrid)" />
                    <path d="M 75 0 L 0 0 0 75" fill="none" stroke="#1e293b" strokeWidth="0.9" />
                  </pattern>
                  <linearGradient id="rietveldCalcFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Plot Background Grid */}
                <rect x="56" y="14" width="684" height="236" fill="url(#rietveldMajorGrid)" stroke="#1e293b" strokeWidth="1" />
                {/* Tick Mark Strip */}
                <rect x="56" y="250" width="684" height="34" fill="#070B14" stroke="#1e293b" strokeWidth="1" />
                {/* Difference Residual Subplot */}
                <rect x="56" y="284" width="684" height="76" fill="url(#rietveldMajorGrid)" stroke="#1e293b" strokeWidth="1" />

                {/* Y-Axis Labels (Main Plot) */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const yPos = 250 - frac * 236;
                  const val = Math.round(frac * chartDomain.maxY);
                  return (
                    <g key={frac}>
                      <line x1="52" y1={yPos} x2="56" y2={yPos} stroke="#475569" strokeWidth="1" />
                      <text
                        x="48"
                        y={yPos + 3}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
                <text
                  x="14"
                  y="132"
                  transform="rotate(-90 14 132)"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Intensity (counts)
                </text>

                {/* Calculated Profile Area & Path */}
                {visiblePoints.length > 1 &&
                  (() => {
                    const mapX = (tt: number) =>
                      56 + ((tt - chartDomain.minX) / (chartDomain.maxX - chartDomain.minX)) * 684;
                    const mapY = (inten: number) =>
                      250 - Math.min(1, Math.max(0, inten / chartDomain.maxY)) * 236;
                    const mapDiffY = (diff: number) =>
                      322 -
                      Math.min(1, Math.max(-1, diff / chartDomain.maxAbsDiff)) * 34;

                    const calcCoords = visiblePoints.map(
                      (p) => `${mapX(p.twoTheta).toFixed(1)},${mapY(p.yCalc).toFixed(1)}`
                    );
                    const bgCoords = visiblePoints.map(
                      (p) => `${mapX(p.twoTheta).toFixed(1)},${mapY(p.yBg).toFixed(1)}`
                    );
                    const diffCoords = visiblePoints.map(
                      (p) => `${mapX(p.twoTheta).toFixed(1)},${mapDiffY(p.yDiff).toFixed(1)}`
                    );

                    const areaPath = `M 56,250 L ${calcCoords.join(' L ')} L 740,250 Z`;
                    const calcPath = `M ${calcCoords.join(' L ')}`;
                    const bgPath = `M ${bgCoords.join(' L ')}`;
                    const diffPath = `M ${diffCoords.join(' L ')}`;

                    return (
                      <>
                        {/* Shaded Calculated Profile */}
                        <path d={areaPath} fill="url(#rietveldCalcFill)" />

                        {/* Chebyshev / Spline Background Curve */}
                        <path
                          d={bgPath}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="1.4"
                          strokeDasharray="4 3"
                        />

                        {/* Calculated Profile Curve I_calc(2theta) */}
                        <path d={calcPath} fill="none" stroke="#38BDF8" strokeWidth="1.7" />

                        {/* Observed Experimental Data Crosses/Dots I_obs(2theta) */}
                        {visiblePoints.map((pt, idx) => {
                          if (visiblePoints.length > 250 && idx % 2 !== 0) return null;
                          const cx = mapX(pt.twoTheta);
                          const cy = mapY(pt.yObs);
                          return (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r="1.9"
                              fill="#F43F5E"
                              fillOpacity="0.9"
                            />
                          );
                        })}

                        {/* Bragg Reflection Tick Marks per Phase */}
                        {phases.map((p, pIdx) => {
                          const rowY = 256 + pIdx * 11;
                          return (
                            <g key={p.id}>
                              <text
                                x="52"
                                y={rowY + 6}
                                textAnchor="end"
                                fill={p.color}
                                fontSize="8"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                P{pIdx + 1}
                              </text>
                              {rietveldOutput.reflections
                                .filter(
                                  (r) =>
                                    r.phaseId === p.id &&
                                    r.twoThetaCorrected >= chartDomain.minX &&
                                    r.twoThetaCorrected <= chartDomain.maxX
                                )
                                .map((r, rIdx) => {
                                  const rx = mapX(r.twoThetaCorrected);
                                  return (
                                    <g key={`${r.hklLabel}-${rIdx}`}>
                                      <line
                                        x1={rx}
                                        y1={rowY}
                                        x2={rx}
                                        y2={rowY + 8}
                                        stroke={p.color}
                                        strokeWidth="1.6"
                                      />
                                      {r.calculatedIntegratedIntensity > chartDomain.maxY * 0.08 && (
                                        <text
                                          x={rx}
                                          y={Math.max(26, mapY(ptAtPeak(visiblePoints, r.twoThetaCorrected)) - 8)}
                                          textAnchor="middle"
                                          fill={p.color}
                                          fontSize="8"
                                          fontFamily="monospace"
                                          fontWeight="bold"
                                        >
                                          {r.hklLabel}
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                            </g>
                          );
                        })}

                        {/* Difference Zero Baseline & ±3σ Bounds */}
                        <line
                          x1="56"
                          y1="322"
                          x2="740"
                          y2="322"
                          stroke="#475569"
                          strokeWidth="0.9"
                          strokeDasharray="3 2"
                        />
                        <text
                          x="48"
                          y="325"
                          textAnchor="end"
                          fill="#94a3b8"
                          fontSize="8.5"
                          fontFamily="monospace"
                        >
                          Δ=0
                        </text>
                        <text
                          x="14"
                          y="322"
                          transform="rotate(-90 14 322)"
                          textAnchor="middle"
                          fill="#10B981"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          I_obs − I_calc
                        </text>

                        {/* Difference Residual Curve */}
                        <path d={diffPath} fill="none" stroke="#10B981" strokeWidth="1.25" />

                        {/* Hover Crosshair & Readout */}
                        {hoveredPointIdx !== null && visiblePoints[hoveredPointIdx] && (
                          <g>
                            <line
                              x1={mapX(visiblePoints[hoveredPointIdx].twoTheta)}
                              y1="14"
                              x2={mapX(visiblePoints[hoveredPointIdx].twoTheta)}
                              y2="360"
                              stroke="#94a3b8"
                              strokeWidth="0.9"
                              strokeDasharray="2 2"
                            />
                          </g>
                        )}
                      </>
                    );
                  })()}

                {/* X-Axis 2θ Ticks */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((frac) => {
                  const xPos = 56 + frac * 684;
                  const ttVal =
                    chartDomain.minX + frac * (chartDomain.maxX - chartDomain.minX);
                  return (
                    <g key={frac}>
                      <line x1={xPos} y1="360" x2={xPos} y2="365" stroke="#64748b" strokeWidth="1" />
                      <text
                        x={xPos}
                        y="376"
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {ttVal.toFixed(1)}°
                      </text>
                    </g>
                  );
                })}
                <text
                  x="398"
                  y="388"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Diffraction Angle 2θ (degrees) →
                </text>

                {/* Top-Right Legend Box */}
                <g transform="translate(510, 22)">
                  <rect
                    x="0"
                    y="0"
                    width="220"
                    height="52"
                    rx="4"
                    fill="#070A12"
                    fillOpacity="0.92"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <circle cx="14" cy="14" r="2.8" fill="#F43F5E" />
                  <text x="24" y="17" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    I_obs (Experimental)
                  </text>
                  <line x1="118" y1="14" x2="134" y2="14" stroke="#38BDF8" strokeWidth="2" />
                  <text x="140" y="17" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    I_calc (Rietveld)
                  </text>
                  <line
                    x1="8"
                    y1="34"
                    x2="24"
                    y2="34"
                    stroke="#F59E0B"
                    strokeWidth="1.6"
                    strokeDasharray="3 2"
                  />
                  <text x="30" y="37" fill="#F59E0B" fontSize="8.5" fontFamily="monospace">
                    I_bg (Chebyshev)
                  </text>
                  <line x1="118" y1="34" x2="134" y2="34" stroke="#10B981" strokeWidth="1.6" />
                  <text x="140" y="37" fill="#10B981" fontSize="8.5" fontFamily="monospace">
                    ΔI = I_obs − I_calc
                  </text>
                </g>

                {/* Invisible Interactive Hover Overlay */}
                <rect
                  x="56"
                  y="14"
                  width="684"
                  height="346"
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const idx = Math.min(
                      visiblePoints.length - 1,
                      Math.max(0, Math.round(relX * (visiblePoints.length - 1)))
                    );
                    setHoveredPointIdx(idx);
                  }}
                />
              </svg>

              {/* Live Cursor Telemetry Readout Strip */}
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                {hoveredPointIdx !== null && visiblePoints[hoveredPointIdx] ? (
                  <>
                    <span className="text-slate-300">
                      2θ ={' '}
                      <strong className="text-white">
                        {visiblePoints[hoveredPointIdx].twoTheta.toFixed(3)}°
                      </strong>{' '}
                      (d ={' '}
                      {(
                        instConfig.wavelength /
                        (2 *
                          Math.sin(
                            (visiblePoints[hoveredPointIdx].twoTheta * Math.PI) / 360
                          ))
                      ).toFixed(4)}{' '}
                      Å)
                    </span>
                    <span className="text-rose-400">
                      I_obs = {visiblePoints[hoveredPointIdx].yObs.toFixed(1)}
                    </span>
                    <span className="text-sky-400">
                      I_calc = {visiblePoints[hoveredPointIdx].yCalc.toFixed(1)}
                    </span>
                    <span className="text-amber-400">
                      I_bg = {visiblePoints[hoveredPointIdx].yBg.toFixed(1)}
                    </span>
                    <span className="text-emerald-400">
                      ΔI = {visiblePoints[hoveredPointIdx].yDiff.toFixed(1)} (
                      {visiblePoints[hoveredPointIdx].weightedResidual.toFixed(2)}σ)
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">
                    Hover over the diffractogram to inspect point-by-point I_obs, I_calc, Chebyshev background I_bg, and weighted residual (y_obs − y_calc)/σᵢ.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3-MODE INTERACTIVE CAD CRYSTALLOGRAPHIC SCHEMATIC */}
          <div className="rounded-xl bg-[#070A12] border border-slate-800 p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  CAD CRYSTALLOGRAPHIC DIAGNOSTIC SCHEMATIC
                </span>
                <h3 className="text-xs font-bold text-white mt-0.5">
                  {cadMode === 'forward_model' &&
                    'Mode 1: Rietveld Whole-Pattern Forward Convolution Architecture'}
                  {cadMode === 'caglioti_irf' &&
                    'Mode 2: Caglioti U,V,W Instrumental & Microstructural Dispersion H(2θ)'}
                  {cadMode === 'structure_factor_argand' &&
                    'Mode 3: Complex Argand Structure Factor F_hkl & March-Dollase Pole Ellipsoid'}
                </h3>
              </div>

              <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-lg border border-slate-800">
                {[
                  { id: 'forward_model' as const, label: '1. Forward Model' },
                  { id: 'caglioti_irf' as const, label: '2. Caglioti H(2θ)' },
                  { id: 'structure_factor_argand' as const, label: '3. Argand F(hkl)' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCadMode(m.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      cadMode === m.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              {cadMode === 'forward_model' && (
                <svg viewBox="0 0 720 185" className="w-full h-auto bg-[#050811] rounded-lg border border-slate-800/80">
                  {/* Block 1: Unit Cell & Wyckoff Basis */}
                  <rect x="16" y="20" width="155" height="145" rx="6" fill="#0B0F19" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="93" y="38" textAnchor="middle" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    1. STRUCTURAL BASIS
                  </text>
                  <text x="93" y="56" textAnchor="middle" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    {currentPhase?.name} ({currentPhase?.spaceGroup})
                  </text>
                  <text x="93" y="74" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    a={currentPhase?.a.toFixed(4)} Å
                  </text>
                  <text x="93" y="88" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    c={currentPhase?.c.toFixed(4)} Å · V={currentMetricTensor.volume.toFixed(1)}Å³
                  </text>
                  <line x1="28" y1="100" x2="158" y2="100" stroke="#1e293b" />
                  <text x="93" y="118" textAnchor="middle" fill="#F59E0B" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    F_K = Σ f_j·e^(2πih·r_j)·e^(-B·s²)
                  </text>
                  <text x="93" y="136" textAnchor="middle" fill="#10B981" fontSize="8" fontFamily="monospace">
                    March-Dollase r = {currentPhase?.marchDollaseR.toFixed(3)}
                  </text>

                  {/* Arrow 1 -> 2 */}
                  <line x1="171" y1="92" x2="198" y2="92" stroke="#38BDF8" strokeWidth="1.5" />
                  <polygon points="198,92 192,88 192,96" fill="#38BDF8" />

                  {/* Block 2: Peak Profile Convolution Omega */}
                  <rect x="200" y="20" width="165" height="145" rx="6" fill="#0B0F19" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="282" y="38" textAnchor="middle" fill="#F59E0B" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    2. TCH PROFILE KERNEL Ω
                  </text>
                  <text x="282" y="56" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                    H_G² = U·tan²θ + V·tanθ + W
                  </text>
                  <text x="282" y="72" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                    H_L = X/cosθ + Y·tanθ
                  </text>
                  <path
                    d="M 225,138 C 250,138 265,130 274,98 C 278,82 280,78 282,78 C 284,78 286,82 290,98 C 299,130 314,138 339,138"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.8"
                  />
                  <text x="282" y="153" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    Δ2θ = Δ2θ₀ − 2(s/R)cosθ
                  </text>

                  {/* Arrow 2 -> 3 */}
                  <line x1="365" y1="92" x2="392" y2="92" stroke="#38BDF8" strokeWidth="1.5" />
                  <polygon points="392,92 386,88 386,96" fill="#38BDF8" />

                  {/* Block 3: Levenberg-Marquardt Objective */}
                  <rect x="394" y="20" width="310" height="145" rx="6" fill="#0B0F19" stroke="#1e293b" strokeWidth="1.2" />
                  <text x="549" y="38" textAnchor="middle" fill="#10B981" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    3. NON-LINEAR LEAST SQUARES MINIMIZATION
                  </text>
                  <text x="549" y="60" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    S_y = Σᵢ wᵢ [ y_obs(2θᵢ) − y_calc(2θᵢ; p) ]²  (wᵢ = 1/σᵢ²)
                  </text>
                  <text x="549" y="82" textAnchor="middle" fill="#38BDF8" fontSize="8.5" fontFamily="monospace">
                    Normal Matrix: (Jᵀ W J + λI) Δp = Jᵀ W (y_obs − y_calc)
                  </text>
                  <line x1="412" y1="96" x2="686" y2="96" stroke="#1e293b" />
                  <text x="549" y="116" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                    R_wp = {rietveldOutput.agreement.Rwp.toFixed(2)}% · R_exp = {rietveldOutput.agreement.Rexp.toFixed(2)}% · χ² = {rietveldOutput.agreement.chiSquared.toFixed(2)}
                  </text>
                  <text x="549" y="138" textAnchor="middle" fill="#F59E0B" fontSize="8.5" fontFamily="monospace">
                    Hill-Howard QPA: W_p = S_p·Z_p·M_p·V_p / Σ_k(S_k·Z_k·M_k·V_k)
                  </text>
                </svg>
              )}

              {cadMode === 'caglioti_irf' && (
                <svg viewBox="0 0 720 185" className="w-full h-auto bg-[#050811] rounded-lg border border-slate-800/80">
                  <line x1="54" y1="20" x2="54" y2="152" stroke="#475569" strokeWidth="1" />
                  <line x1="54" y1="152" x2="690" y2="152" stroke="#475569" strokeWidth="1" />
                  {/* Plot H_total(2theta), H_G(2theta), H_L(2theta) across 15° to 85° */}
                  {(() => {
                    const deg2rad = Math.PI / 180;
                    const ptsTotal: string[] = [];
                    const ptsG: string[] = [];
                    const ptsL: string[] = [];
                    const maxH = 0.45;
                    for (let tt = 15; tt <= 85; tt += 2) {
                      const th = (tt / 2) * deg2rad;
                      const tanT = Math.tan(th);
                      const cosT = Math.cos(th);
                      const hg = Math.sqrt(
                        Math.max(
                          1e-5,
                          ((currentPhase?.U || 0.015) + instConfig.uInst) * tanT * tanT +
                            ((currentPhase?.V || -0.005) + instConfig.vInst) * tanT +
                            ((currentPhase?.W || 0.012) + instConfig.wInst)
                        )
                      );
                      const hl =
                        ((currentPhase?.X || 0.03) + instConfig.xInst) / cosT +
                        ((currentPhase?.Y || 0.015) + instConfig.yInst) * tanT;
                      const htot = Math.pow(
                        Math.pow(hg, 5) +
                          2.69269 * Math.pow(hg, 4) * hl +
                          2.42843 * Math.pow(hg, 3) * hl * hl +
                          4.47163 * hg * hg * Math.pow(hl, 3) +
                          0.07842 * hg * Math.pow(hl, 4) +
                          Math.pow(hl, 5),
                        0.2
                      );
                      const x = 54 + ((tt - 15) / 70) * 636;
                      const yTot = 152 - Math.min(1, htot / maxH) * 124;
                      const yG = 152 - Math.min(1, hg / maxH) * 124;
                      const yL = 152 - Math.min(1, hl / maxH) * 124;
                      ptsTotal.push(`${x.toFixed(1)},${yTot.toFixed(1)}`);
                      ptsG.push(`${x.toFixed(1)},${yG.toFixed(1)}`);
                      ptsL.push(`${x.toFixed(1)},${yL.toFixed(1)}`);
                    }
                    return (
                      <>
                        <polyline fill="none" stroke="#38BDF8" strokeWidth="2" points={ptsTotal.join(' ')} />
                        <polyline
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                          points={ptsG.join(' ')}
                        />
                        <polyline
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                          points={ptsL.join(' ')}
                        />
                      </>
                    );
                  })()}
                  <text x="68" y="34" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    — H_total (TCH Pseudo-Voigt FWHM)
                  </text>
                  <text x="300" y="34" fill="#F59E0B" fontSize="9" fontFamily="monospace">
                    -- H_G (Caglioti U,V,W Gaussian)
                  </text>
                  <text x="515" y="34" fill="#10B981" fontSize="9" fontFamily="monospace">
                    ·· H_L (Lorentzian Size X &amp; Strain Y)
                  </text>
                  <text x="372" y="174" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    Diffraction Angle 2θ (15° → 85°) · Apparent Size D_V ={' '}
                    {rietveldOutput.phaseQuant[selectedPhaseIdx]?.apparentSizeNm.toFixed(1)} nm · Strain ε ={' '}
                    {rietveldOutput.phaseQuant[selectedPhaseIdx]?.rmsMicrostrain.toFixed(2)}×10⁻³
                  </text>
                </svg>
              )}

              {cadMode === 'structure_factor_argand' && selectedReflection && (
                <svg viewBox="0 0 720 185" className="w-full h-auto bg-[#050811] rounded-lg border border-slate-800/80">
                  {/* Left: Complex Argand Plane for F_hkl */}
                  <circle cx="135" cy="92" r="64" fill="#0B0F19" stroke="#334155" strokeWidth="1.2" />
                  <line x1="60" y1="92" x2="210" y2="92" stroke="#475569" strokeWidth="0.9" />
                  <line x1="135" y1="20" x2="135" y2="164" stroke="#475569" strokeWidth="0.9" />
                  {(() => {
                    const mag = Math.max(1e-3, selectedReflection.fAbs);
                    const vx = (selectedReflection.fReal / mag) * 52;
                    const vy = -(selectedReflection.fImag / mag) * 52;
                    return (
                      <>
                        <line
                          x1="135"
                          y1="92"
                          x2={135 + vx}
                          y2={92 + vy}
                          stroke="#38BDF8"
                          strokeWidth="2.4"
                        />
                        <circle cx={135 + vx} cy={92 + vy} r="4" fill="#F59E0B" />
                      </>
                    );
                  })()}
                  <text x="215" y="95" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    Re(A_hkl)
                  </text>
                  <text x="135" y="15" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    Im(B_hkl)
                  </text>

                  {/* Right: Reflection Telemetry & Selector */}
                  <rect x="275" y="20" width="425" height="145" rx="6" fill="#0B0F19" stroke="#1e293b" strokeWidth="1" />
                  <text x="292" y="42" fill="#38BDF8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    Reflection {selectedReflection.hklLabel} · {selectedReflection.phaseName}
                  </text>
                  <text x="292" y="64" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    2θ_calc = {selectedReflection.twoThetaCorrected.toFixed(3)}° · d = {selectedReflection.dSpacing.toFixed(4)} Å · Multiplicity m = {selectedReflection.multiplicity}
                  </text>
                  <text x="292" y="84" fill="#F59E0B" fontSize="8.5" fontFamily="monospace">
                    |F_hkl| = {selectedReflection.fAbs.toFixed(2)} e⁻ · |F_hkl|² = {selectedReflection.fSquared.toFixed(1)} · Phase φ = {selectedReflection.phaseAngleDeg.toFixed(1)}°
                  </text>
                  <text x="292" y="104" fill="#10B981" fontSize="8.5" fontFamily="monospace">
                    Re(F) = {selectedReflection.fReal.toFixed(2)} · Im(F) = {selectedReflection.fImag.toFixed(2)} · Lp(θ) = {selectedReflection.lpFactor.toFixed(2)}
                  </text>
                  <text x="292" y="124" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                    March-Dollase P_hkl(α) = {selectedReflection.marchDollaseFactor.toFixed(3)} · FWHM = {selectedReflection.fwhmTotal.toFixed(3)}° (η = {selectedReflection.etaMixing.toFixed(2)})
                  </text>
                  <text x="292" y="146" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    I_calc = {selectedReflection.calculatedIntegratedIntensity.toFixed(1)} · I_obs(partitioned) = {selectedReflection.observedIntegratedIntensity.toFixed(1)}
                  </text>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): ACTIVE STEP PARAMETER REFINEMENT CONTROLS */}
        <div className="xl:col-span-5 space-y-4">
          {/* STEP 1: DATA IMPORT, IRF & CHEBYSHEV BACKGROUND MODELING */}
          {activeStepTab === '1_data_bg' && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 1 OF 7 · DATA & BACKGROUND
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Experimental Pattern Import, IRF & Chebyshev Background
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunRefinementStage('stage_1_scale_bg', 4)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Refine Scale & Bg
                </button>
              </div>

              {/* Instrumental Resolution File (IRF) Parameters */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Instrumental Resolution Function (IRF)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {instConfig.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      λ Kα₁ (Å)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={instConfig.wavelength}
                      onChange={(e) =>
                        setInstConfig((prev) => ({
                          ...prev,
                          wavelength: parseFloat(e.target.value) || 1.540598
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Kα₂ / Kα₁ Ratio
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={instConfig.ka2Ratio}
                      onChange={(e) =>
                        setInstConfig((prev) => ({
                          ...prev,
                          ka2Ratio: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0))
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Radius R (mm)
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={instConfig.goniometerRadiusMm}
                      onChange={(e) =>
                        setInstConfig((prev) => ({
                          ...prev,
                          goniometerRadiusMm: parseFloat(e.target.value) || 240
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      U_inst (deg²)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={instConfig.uInst}
                      onChange={(e) =>
                        setInstConfig((prev) => ({
                          ...prev,
                          uInst: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      V_inst (deg²)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={instConfig.vInst}
                      onChange={(e) =>
                        setInstConfig((prev) => ({
                          ...prev,
                          vInst: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      W_inst (deg²)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={instConfig.wInst}
                      onChange={(e) =>
                        setInstConfig((prev) => ({
                          ...prev,
                          wInst: Math.max(0.0005, parseFloat(e.target.value) || 0.005)
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-amber-300"
                    />
                  </div>
                </div>
              </div>

              {/* Background Model Switcher: Chebyshev Polynomials vs Manual Anchor Points */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Background Intensity Model I_bg(2θ)
                  </span>
                  <div className="flex items-center gap-1 bg-[#111827] p-0.5 rounded border border-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        setGlobalParams((prev) => ({ ...prev, backgroundMode: 'chebyshev' }))
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer ${
                        globalParams.backgroundMode === 'chebyshev'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Chebyshev T_n(x)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGlobalParams((prev) => ({ ...prev, backgroundMode: 'manual_spline' }))
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer ${
                        globalParams.backgroundMode === 'manual_spline'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Manual Points
                    </button>
                  </div>
                </div>

                {globalParams.backgroundMode === 'chebyshev' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Polynomial Order N = {globalParams.chebyshevOrder}</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={globalParams.chebyshevOrder}
                        onChange={(e) =>
                          setGlobalParams((prev) => ({
                            ...prev,
                            chebyshevOrder: parseInt(e.target.value, 10)
                          }))
                        }
                        className="w-28 accent-amber-400"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {globalParams.chebyshevCoeffs
                        .slice(0, globalParams.chebyshevOrder + 1)
                        .map((coeff, idx) => (
                          <div key={idx}>
                            <label className="block text-[10px] font-mono text-slate-400">
                              b_{idx} · T_{idx}(x)
                            </label>
                            <input
                              type="number"
                              step="1"
                              value={Number(coeff.toFixed(2))}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setGlobalParams((prev) => {
                                  const next = [...prev.chebyshevCoeffs];
                                  next[idx] = val;
                                  return { ...prev, chebyshevCoeffs: next };
                                });
                              }}
                              className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-amber-300"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {globalParams.manualBgAnchors.map((anchor, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            2θ_{idx + 1}:
                          </span>
                          <input
                            type="number"
                            value={anchor.twoTheta}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 20;
                              setGlobalParams((prev) => {
                                const next = [...prev.manualBgAnchors];
                                next[idx] = { ...next[idx], twoTheta: v };
                                return { ...prev, manualBgAnchors: next };
                              });
                            }}
                            className="w-full px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            I_bg:
                          </span>
                          <input
                            type="number"
                            value={anchor.intensity}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 50;
                              setGlobalParams((prev) => {
                                const next = [...prev.manualBgAnchors];
                                next[idx] = { ...next[idx], intensity: v };
                                return { ...prev, manualBgAnchors: next };
                              });
                            }}
                            className="w-full px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-amber-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Paste Custom Experimental (.xy / .dat / .csv) Pattern */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Import Custom Experimental Scan (.xy, .dat, .csv)
                  </span>
                  <button
                    type="button"
                    onClick={handleImportXYPattern}
                    disabled={!rawXYPasteText.trim()}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] font-mono text-sky-300 cursor-pointer"
                  >
                    Load XY Data
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={rawXYPasteText}
                  onChange={(e) => setRawXYPasteText(e.target.value)}
                  placeholder="Paste 2-column or 3-column powder data: 2Theta  Intensity  [Sigma]&#10;20.00  115.4  10.7&#10;20.10  118.2  10.9..."
                  className="w-full p-2 rounded bg-[#111827] border border-slate-700 text-[11px] font-mono text-slate-200 placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PHASE IDENTIFICATION, CIF PARSER & HILL-HOWARD QPA */}
          {activeStepTab === '2_phase_cif' && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 2 OF 7 · PHASE ID & CIF STRUCTURE
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Crystalline Phases, CIF Importer & Hill-Howard QPA
                  </h2>
                </div>
              </div>

              {/* Active Crystalline Phases Selector & Quantitative Weight Fractions */}
              <div className="space-y-2">
                {phases.map((p, idx) => {
                  const pq = rietveldOutput.phaseQuant[idx];
                  const isSel = idx === selectedPhaseIdx;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPhaseIdx(idx)}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSel
                          ? 'bg-sky-500/10 border-sky-500/50'
                          : 'bg-[#070A12] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-xs"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-xs font-bold text-white">
                            Phase {idx + 1}: {p.name}
                          </span>
                          <span className="text-[11px] font-mono text-sky-400">
                            {p.spaceGroup} ({p.crystalSystem})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {pq?.weightFractionPct.toFixed(2)} wt%
                          </span>
                          {phases.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhases((prev) => prev.filter((_, i) => i !== idx));
                                setSelectedPhaseIdx(0);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Remove phase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                        <span>V = {pq?.cellVolume.toFixed(2)} Å³</span>
                        <span>ρ = {pq?.theoreticalDensity.toFixed(2)} g/cm³</span>
                        <span>R_B = {pq?.braggR.toFixed(2)}%</span>
                        <span>R_F = {pq?.rfFactor.toFixed(2)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CIF File Structure Parser */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Crystallographic Information File (.CIF) Structure Importer
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleImportCIFPhase('replace_current')}
                      className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-[11px] font-mono font-semibold cursor-pointer"
                    >
                      Replace Phase {selectedPhaseIdx + 1}
                    </button>
                    {phases.length < 3 && (
                      <button
                        type="button"
                        onClick={() => handleImportCIFPhase('add_new')}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold cursor-pointer"
                      >
                        + Add as Secondary Phase
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={cifEditorText}
                  onChange={(e) => setCifEditorText(e.target.value)}
                  className="w-full p-2.5 rounded bg-[#111827] border border-slate-700 text-[11px] font-mono text-slate-200 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 3: GLOBAL PARAMETER REFINEMENT (SCALE, ZERO-SHIFT, DISPLACEMENT) */}
          {activeStepTab === '3_global' && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 3 OF 7 · GLOBAL PARAMETERS
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Phase Scale Factors, Zero-Shift & Specimen Displacement
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunRefinementStage('stage_2_zero_disp', 4)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Refine Zero & Disp
                </button>
              </div>

              {/* Phase Scale Factors */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  Phase Scale Factors (S_p)
                </span>
                {phases.map((p, idx) => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">
                        {p.name} Scale S_{idx + 1}
                      </span>
                      <span className="text-sky-400 font-bold tabular-nums">
                        {p.scaleFactor.toFixed(4)}
                        {p.sigmaScale ? ` ± ${p.sigmaScale.toFixed(4)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0.1}
                        max={4.0}
                        step={0.01}
                        value={p.scaleFactor}
                        onChange={(e) =>
                          updatePhase(idx, (ph) => ({
                            ...ph,
                            scaleFactor: parseFloat(e.target.value)
                          }))
                        }
                        className="flex-1 accent-sky-400"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={Number(p.scaleFactor.toFixed(4))}
                        onChange={(e) =>
                          updatePhase(idx, (ph) => ({
                            ...ph,
                            scaleFactor: Math.max(0.05, parseFloat(e.target.value) || 1)
                          }))
                        }
                        className="w-20 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Goniometer Zero-Shift & Specimen Displacement */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  Goniometer Systematic Peak-Shift Corrections
                </span>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Zero-Point Shift Δ2θ₀ (°)</span>
                    <span className="text-amber-400 font-bold tabular-nums">
                      {globalParams.zeroShiftDeg >= 0 ? '+' : ''}
                      {globalParams.zeroShiftDeg.toFixed(4)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-0.25}
                    max={0.25}
                    step={0.002}
                    value={globalParams.zeroShiftDeg}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        zeroShiftDeg: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      Specimen Displacement s (mm) [Δ2θ = −2(s/R)cosθ]
                    </span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {globalParams.sampleDisplacementMm >= 0 ? '+' : ''}
                      {globalParams.sampleDisplacementMm.toFixed(4)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-0.35}
                    max={0.35}
                    step={0.005}
                    value={globalParams.sampleDisplacementMm}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        sampleDisplacementMm: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      Specimen Transparency 1/(2μR) [Δ2θ = −sin(2θ)/(2μR)]
                    </span>
                    <span className="text-sky-400 font-bold tabular-nums">
                      {globalParams.transparencyCoeff.toFixed(5)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.005}
                    step={0.0001}
                    value={globalParams.transparencyCoeff}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        transparencyCoeff: parseFloat(e.target.value)
                      }))
                    }
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LATTICE PARAMETERS REFINEMENT */}
          {activeStepTab === '4_lattice' && currentPhase && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 4 OF 7 · UNIT CELL LATTICE REFINEMENT
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Unit Cell Dimensions (a, b, c, α, β, γ) & Metric Tensor G*
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunRefinementStage('stage_3_lattice', 4)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Refine Lattice (L-M)
                </button>
              </div>

              {/* Phase Selector Tabs */}
              {phases.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {phases.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPhaseIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border ${
                        idx === selectedPhaseIdx
                          ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold'
                          : 'bg-[#070A12] border-slate-800 text-slate-400'
                      }`}
                    >
                      {p.name} ({p.crystalSystem})
                    </button>
                  ))}
                </div>
              )}

              {/* Unit Cell Axes Sliders */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">
                    Crystal System: <strong className="text-white">{currentPhase.crystalSystem}</strong>
                  </span>
                  <span className="text-sky-400">
                    V_cell = {currentMetricTensor.volume.toFixed(3)} Å³
                  </span>
                </div>

                {/* Parameter a */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Lattice Parameter a (Å)</span>
                    <span className="text-sky-400 font-bold tabular-nums">
                      {currentPhase.a.toFixed(5)} Å
                      {currentPhase.sigmaA ? ` ± ${currentPhase.sigmaA.toFixed(5)}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={Number((currentPhase.a * 0.96).toFixed(2))}
                      max={Number((currentPhase.a * 1.04).toFixed(2))}
                      step={0.0005}
                      value={currentPhase.a}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          a: val,
                          b:
                            ph.crystalSystem === 'Cubic' ||
                            ph.crystalSystem === 'Tetragonal' ||
                            ph.crystalSystem === 'Hexagonal' ||
                            ph.crystalSystem === 'Trigonal'
                              ? val
                              : ph.b,
                          c: ph.crystalSystem === 'Cubic' ? val : ph.c
                        }));
                      }}
                      className="flex-1 accent-sky-400"
                    />
                    <input
                      type="number"
                      step="0.0005"
                      value={Number(currentPhase.a.toFixed(5))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 4.0;
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          a: val,
                          b:
                            ph.crystalSystem === 'Cubic' ||
                            ph.crystalSystem === 'Tetragonal' ||
                            ph.crystalSystem === 'Hexagonal' ||
                            ph.crystalSystem === 'Trigonal'
                              ? val
                              : ph.b,
                          c: ph.crystalSystem === 'Cubic' ? val : ph.c
                        }));
                      }}
                      className="w-24 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Parameter c (for non-Cubic) */}
                {currentPhase.crystalSystem !== 'Cubic' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Lattice Parameter c (Å)</span>
                      <span className="text-amber-400 font-bold tabular-nums">
                        {currentPhase.c.toFixed(5)} Å
                        {currentPhase.sigmaC ? ` ± ${currentPhase.sigmaC.toFixed(5)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={Number((currentPhase.c * 0.96).toFixed(2))}
                        max={Number((currentPhase.c * 1.04).toFixed(2))}
                        step={0.0005}
                        value={currentPhase.c}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updatePhase(selectedPhaseIdx, (ph) => ({ ...ph, c: val }));
                        }}
                        className="flex-1 accent-amber-400"
                      />
                      <input
                        type="number"
                        step="0.0005"
                        value={Number(currentPhase.c.toFixed(5))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 5.0;
                          updatePhase(selectedPhaseIdx, (ph) => ({ ...ph, c: val }));
                        }}
                        className="w-24 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Angles Readout */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div className="p-2 rounded bg-[#111827] text-center">
                    <span className="text-slate-400 block text-[10px]">α (deg)</span>
                    <span className="text-white font-bold">{currentPhase.alpha.toFixed(2)}°</span>
                  </div>
                  <div className="p-2 rounded bg-[#111827] text-center">
                    <span className="text-slate-400 block text-[10px]">β (deg)</span>
                    <span className="text-white font-bold">{currentPhase.beta.toFixed(2)}°</span>
                  </div>
                  <div className="p-2 rounded bg-[#111827] text-center">
                    <span className="text-slate-400 block text-[10px]">γ (deg)</span>
                    <span className="text-white font-bold">{currentPhase.gamma.toFixed(2)}°</span>
                  </div>
                </div>
              </div>

              {/* Reciprocal Metric Tensor G* Matrix Display */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">
                    Reciprocal Metric Tensor G*ⁱʲ (Å⁻²)
                  </span>
                  <span className="text-slate-400">1/d² = hᵀ · G* · h</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs text-center">
                  {currentMetricTensor.gStar.flat().map((val, i) => (
                    <div
                      key={i}
                      className="py-1.5 px-2 rounded bg-[#111827] border border-slate-800 text-sky-300 tabular-nums"
                    >
                      {val.toFixed(5)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PEAK PROFILE & MICROSTRUCTURAL REFINEMENT */}
          {activeStepTab === '5_profile' && currentPhase && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 5 OF 7 · PEAK PROFILE & MICROSTRUCTURE
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    TCH Pseudo-Voigt, Caglioti (U, V, W) & Size/Strain (X, Y)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunRefinementStage('stage_4_profile', 4)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Refine Profile
                </button>
              </div>

              {/* Profile Function Selector */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Peak Shape Function Ω(2θ − 2θ_K)
                  </span>
                  <select
                    value={currentPhase.profileShape}
                    onChange={(e) =>
                      updatePhase(selectedPhaseIdx, (ph) => ({
                        ...ph,
                        profileShape: e.target.value as RietveldPhaseModel['profileShape']
                      }))
                    }
                    className="px-2.5 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-sky-300"
                  >
                    <option value="TCH_PseudoVoigt">Thompson-Cox-Hastings Pseudo-Voigt</option>
                    <option value="PseudoVoigt">Standard Pseudo-Voigt</option>
                    <option value="PearsonVII">Pearson VII</option>
                  </select>
                </div>

                {/* Caglioti U, V, W Parameters */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Caglioti U (tan²θ)
                    </label>
                    <input
                      type="number"
                      step="0.002"
                      value={Number(currentPhase.U.toFixed(4))}
                      onChange={(e) =>
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          U: Math.max(0, parseFloat(e.target.value) || 0)
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Caglioti V (tanθ)
                    </label>
                    <input
                      type="number"
                      step="0.002"
                      value={Number(currentPhase.V.toFixed(4))}
                      onChange={(e) =>
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          V: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Caglioti W (const)
                    </label>
                    <input
                      type="number"
                      step="0.002"
                      value={Number(currentPhase.W.toFixed(4))}
                      onChange={(e) =>
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          W: Math.max(0.001, parseFloat(e.target.value) || 0.01)
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Lorentzian Size X, Microstrain Y, and Axial Asymmetry */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono text-emerald-400">
                      Size X (1/cosθ)
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      value={Number(currentPhase.X.toFixed(4))}
                      onChange={(e) =>
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          X: Math.max(0.002, parseFloat(e.target.value) || 0.02)
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-amber-400">
                      Strain Y (tanθ)
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      value={Number(currentPhase.Y.toFixed(4))}
                      onChange={(e) =>
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          Y: Math.max(0, parseFloat(e.target.value) || 0)
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-sky-400">
                      Asymmetry A_s
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      value={Number(currentPhase.asymmetry.toFixed(4))}
                      onChange={(e) =>
                        updatePhase(selectedPhaseIdx, (ph) => ({
                          ...ph,
                          asymmetry: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 rounded bg-[#111827] border border-slate-700 text-xs font-mono text-sky-300"
                    />
                  </div>
                </div>
              </div>

              {/* Derived Physical Microstructure Readout */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Volume-Weighted Crystallite Size D_V
                  </span>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                    {rietveldOutput.phaseQuant[selectedPhaseIdx]?.apparentSizeNm.toFixed(1)} nm
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    D_V = Kλ / [ (X − X_inst)·cosθ ]
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    RMS Lattice Microstrain ⟨ε²⟩^½
                  </span>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-1 tabular-nums">
                    {rietveldOutput.phaseQuant[selectedPhaseIdx]?.rmsMicrostrain.toFixed(3)} × 10⁻³
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Derived from Y·tanθ &amp; U·tan²θ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ATOMIC WYCKOFF COORDINATES, B_ISO, SOF & MARCH-DOLLASE TEXTURE */}
          {activeStepTab === '6_atomic' && currentPhase && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 6 OF 7 · ATOMIC & TEXTURE PARAMETERS
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Wyckoff Coordinates (x,y,z), B_iso, SOF & March-Dollase
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunRefinementStage('stage_5_atomic_texture', 4)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Refine Atoms & Texture
                </button>
              </div>

              {/* Wyckoff Sites Table Editor */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Asymmetric Unit Wyckoff Sites ({currentPhase.name})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Debye-Waller exp(−B_iso·sin²θ/λ²)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentPhase.atoms.map((atom, aIdx) => (
                    <div
                      key={atom.id}
                      className="p-2.5 rounded bg-[#111827] border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-sky-300">
                          {atom.label} ({atom.element}) · Wyckoff {atom.wyckoff}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          f₀(0) = {evaluateCromerMannF0(atom.element, 0).toFixed(1)} e⁻
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        <div>
                          <label className="block text-[9.5px] font-mono text-slate-400">x/a</label>
                          <input
                            type="number"
                            step="0.002"
                            value={Number(atom.x.toFixed(4))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              updatePhase(selectedPhaseIdx, (ph) => ({
                                ...ph,
                                atoms: ph.atoms.map((at, i) =>
                                  i === aIdx ? { ...at, x: v } : at
                                )
                              }));
                            }}
                            className="w-full px-1.5 py-1 rounded bg-[#070A12] border border-slate-700 text-[11px] font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-mono text-slate-400">y/b</label>
                          <input
                            type="number"
                            step="0.002"
                            value={Number(atom.y.toFixed(4))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              updatePhase(selectedPhaseIdx, (ph) => ({
                                ...ph,
                                atoms: ph.atoms.map((at, i) =>
                                  i === aIdx ? { ...at, y: v } : at
                                )
                              }));
                            }}
                            className="w-full px-1.5 py-1 rounded bg-[#070A12] border border-slate-700 text-[11px] font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-mono text-slate-400">z/c</label>
                          <input
                            type="number"
                            step="0.002"
                            value={Number(atom.z.toFixed(4))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              updatePhase(selectedPhaseIdx, (ph) => ({
                                ...ph,
                                atoms: ph.atoms.map((at, i) =>
                                  i === aIdx ? { ...at, z: v } : at
                                )
                              }));
                            }}
                            className="w-full px-1.5 py-1 rounded bg-[#070A12] border border-slate-700 text-[11px] font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-mono text-amber-400">
                            B_iso (Å²)
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={Number(atom.bIso.toFixed(3))}
                            onChange={(e) => {
                              const v = Math.max(0.05, parseFloat(e.target.value) || 0.5);
                              updatePhase(selectedPhaseIdx, (ph) => ({
                                ...ph,
                                atoms: ph.atoms.map((at, i) =>
                                  i === aIdx ? { ...at, bIso: v } : at
                                )
                              }));
                            }}
                            className="w-full px-1.5 py-1 rounded bg-[#070A12] border border-slate-700 text-[11px] font-mono text-amber-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-mono text-emerald-400">
                            SOF (Occ)
                          </label>
                          <input
                            type="number"
                            step="0.02"
                            min="0.05"
                            max="1.5"
                            value={Number(atom.occupancy.toFixed(3))}
                            onChange={(e) => {
                              const v = Math.max(0.05, Math.min(1.5, parseFloat(e.target.value) || 1.0));
                              updatePhase(selectedPhaseIdx, (ph) => ({
                                ...ph,
                                atoms: ph.atoms.map((at, i) =>
                                  i === aIdx ? { ...at, occupancy: v } : at
                                )
                              }));
                            }}
                            className="w-full px-1.5 py-1 rounded bg-[#070A12] border border-slate-700 text-[11px] font-mono text-emerald-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* March-Dollase Preferred Orientation Correction */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-200 font-bold">
                    March-Dollase Preferred Orientation r_MD
                  </span>
                  <span className="text-sky-400 font-bold tabular-nums">
                    r = {currentPhase.marchDollaseR.toFixed(3)} ({currentPhase.marchDollaseR < 0.98 ? 'Platy' : currentPhase.marchDollaseR > 1.02 ? 'Needles' : 'Random Powder'})
                  </span>
                </div>
                <input
                  type="range"
                  min={0.55}
                  max={1.55}
                  step={0.01}
                  value={currentPhase.marchDollaseR}
                  onChange={(e) =>
                    updatePhase(selectedPhaseIdx, (ph) => ({
                      ...ph,
                      marchDollaseR: parseFloat(e.target.value)
                    }))
                  }
                  className="w-full accent-sky-400"
                />
                <div className="text-[10px] font-mono text-slate-400">
                  P_hkl(α) = (r²·cos²α + r⁻¹·sin²α)^(-3/2) along Axis ({currentPhase.prefOrientHKL.join(' ')})
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: QUALITY OF FIT EVALUATION, TURN-ON PIPELINE & BRAGG REFLECTIONS TABLE */}
          {activeStepTab === '7_fit_quality' && (
            <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    STEP 7 OF 7 · QUALITY OF FIT & CONVERGENCE
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Sequential Turn-On Pipeline, R-Factors & Bragg Reflections
                  </h2>
                </div>
              </div>

              {/* 5-Stage Sequential Turn-On Buttons */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Recommended Rietveld Parameter Turn-On Sequence
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    {
                      id: 'stage_1_scale_bg' as RefinementStageId,
                      label: 'Stage 1: Refine Phase Scale Factors (S_p) + Chebyshev Background (b_n)'
                    },
                    {
                      id: 'stage_2_zero_disp' as RefinementStageId,
                      label: 'Stage 2: Refine Zero-Shift (Δ2θ₀) + Specimen Displacement (s/R)'
                    },
                    {
                      id: 'stage_3_lattice' as RefinementStageId,
                      label: 'Stage 3: Refine Unit Cell Lattice Parameters (a, b, c)'
                    },
                    {
                      id: 'stage_4_profile' as RefinementStageId,
                      label: 'Stage 4: Refine Caglioti Profile (W) + Microstructure (X, Y)'
                    },
                    {
                      id: 'stage_5_atomic_texture' as RefinementStageId,
                      label: 'Stage 5: Refine Wyckoff Coordinates (x,y,z), B_iso & March-Dollase r'
                    }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleRunRefinementStage(st.id, 3)}
                      className="w-full px-3 py-2 rounded-lg bg-[#111827] hover:bg-sky-500/15 border border-slate-800 hover:border-sky-500/40 text-left text-xs font-mono text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{st.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Indexed Bragg Reflections & Structure Factor Table */}
              <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Bragg Reflections Table (Click row for Argand Phasor)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {rietveldOutput.reflections.length} reflections
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto custom-scrollbar border border-slate-800 rounded">
                  <table className="w-full text-left border-collapse text-[11px] font-mono tabular-nums">
                    <thead className="bg-[#111827] text-slate-400 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-2">Phase</th>
                        <th className="py-1.5 px-2">(hkl)</th>
                        <th className="py-1.5 px-2">2θ (°)</th>
                        <th className="py-1.5 px-2">d (Å)</th>
                        <th className="py-1.5 px-2">|F|²</th>
                        <th className="py-1.5 px-2">I_calc</th>
                        <th className="py-1.5 px-2">I_obs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {rietveldOutput.reflections.slice(0, 35).map((r, idx) => {
                        const isSel = idx === selectedReflectionIdx;
                        return (
                          <tr
                            key={`${r.phaseId}-${r.hklLabel}-${idx}`}
                            onClick={() => {
                              setSelectedReflectionIdx(idx);
                              setCadMode('structure_factor_argand');
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSel
                                ? 'bg-sky-500/20 text-white font-semibold'
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="py-1 px-2 truncate max-w-[90px]">{r.phaseName}</td>
                            <td className="py-1 px-2 text-sky-400">{r.hklLabel}</td>
                            <td className="py-1 px-2">{r.twoThetaCorrected.toFixed(2)}</td>
                            <td className="py-1 px-2">{r.dSpacing.toFixed(3)}</td>
                            <td className="py-1 px-2 text-amber-300">{r.fSquared.toFixed(0)}</td>
                            <td className="py-1 px-2">{r.calculatedIntegratedIntensity.toFixed(0)}</td>
                            <td className="py-1 px-2 text-emerald-400">
                              {r.observedIntegratedIntensity.toFixed(0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Convergence History Log */}
              {convergenceHistory.length > 0 && (
                <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-300 block">
                    Levenberg-Marquardt Convergence Log ({convergenceHistory.length} cycles)
                  </span>
                  <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1 text-[10px] font-mono">
                    {convergenceHistory.slice(-8).map((rec) => (
                      <div
                        key={rec.iteration}
                        className="flex items-center justify-between px-2 py-1 rounded bg-[#111827] text-slate-300"
                      >
                        <span>
                          Cycle #{rec.iteration} ({rec.stageLabel})
                        </span>
                        <span className="text-emerald-400 font-bold">
                          R_wp = {rec.Rwp.toFixed(2)}% · χ² = {rec.chiSquared.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ptAtPeak(
  points: Array<{ twoTheta: number; yCalc: number }>,
  targetTwoTheta: number
): number {
  let bestY = 100;
  let bestDist = Infinity;
  for (const p of points) {
    const d = Math.abs(p.twoTheta - targetTwoTheta);
    if (d < bestDist) {
      bestDist = d;
      bestY = p.yCalc;
    }
  }
  return bestY;
}

export default RietveldRefinementModule;
