import React, { useState, useRef, useMemo } from 'react';
import { 
  Layers, Settings, RefreshCw, Zap, RotateCcw, Grid, Terminal, Cpu, PlayCircle, 
  Ruler, Activity, Gauge, CheckCircle2, ChevronDown, Trash2, Edit2, Check, 
  Compass, Plus, Target, HelpCircle, BarChart2, ShieldCheck, ChevronRight,
  Lock, Unlock, Sliders, AlertTriangle, Info, ArrowUpRight, Scale
} from 'lucide-react';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

export interface SimulationPeak {
  h: number;
  k: number;
  l: number;
  intensity: number;
  enabled: boolean;
}

export interface SimStructure {
  id: string;
  name: string;
  phaseType: string;
  enabled: boolean;
  a: number;
  targetA: number;
  scale: number;
  targetScale: number;
  fwhm: number;
  targetFwhm: number;
  eta: number;
  targetEta: number;
  crystalliteSize: number;
  targetCrystalliteSize: number;
  microstrain: number;
  targetMicrostrain: number;
  peaks: SimulationPeak[];
}

export interface SimulationParameters {
  a: number;
  scale: number;
  fwhm: number;
  eta: number;
  crystalliteSize: number;
  microstrain: number;
  peaks: SimulationPeak[];
  zeroShift: number;
  sampleDisplacement: number;
  background: number;
  noise: number;
}

export interface RefinementFlags {
  refineScale: boolean;
  refineLattice: boolean;
  refineFwhm: boolean;
  refineEta: boolean;
  refineZeroShift: boolean;
  refineBkg: boolean;
  refineMicrostrain: boolean;
  refineCrystalliteSize: boolean;
}

interface RietveldParameterSetProps {
  simPhases: SimStructure[];
  setSimPhases: React.Dispatch<React.SetStateAction<SimStructure[]>>;
  selectedSimPhaseIdx: number;
  setSelectedSimPhaseIdx: (idx: number) => void;
  userParams: SimulationParameters;
  setUserParams: (updater: any) => void;
  targetParams: SimulationParameters;
  simPhase: string;
  setSimPhase: (phase: string) => void;
  rFactor: number;
  referenceRwp: number;
  stabilityPercentage: number;
  isAutoRefining: boolean;
  setIsAutoRefining: (val: boolean) => void;
  stepwiseActive: boolean;
  stepwiseStage: number;
  stepwiseMessage: string;
  runStepwiseRefinement: () => void;
  onRunLmStep?: () => void;
  onResetCold: () => void;
  onResetToNominal: () => void;
  onAddNewSimStructure: (type: any) => void;
  handleRemoveSimStructure: (idx: number) => void;
  TARGET_PARAMS: Record<string, any>;
  SPACE_GROUP_DETAILS: Record<string, any>;
  isPythonActive: boolean;
  setIsPythonActive: (val: boolean) => void;
  pythonFeaturesEnabled?: boolean;
  isPythonRefining: boolean;
  runPythonRietveldRefinement: () => void;
  rHistory: any[];
  iterCount: number;
  playSynthTone: (type: string) => void;
  computeCrystallographicVolumeAndDensity: (phaseType: string, a: number) => any;
  getPeaksForPhase: (phaseType: string, a: number) => SimulationPeak[];
  getEquivalentPositions: (phaseType: string, x: number, y: number) => any[];
  toSymmetryScreenCoords: (px: number, py: number, width: number, height: number, isTrigonal: boolean) => { x: number; y: number };
  QUARTZ_PEAKS: Array<{ t: number; i: number }>;
  RUTILE_PEAKS: Array<{ t: number; i: number }>;
  PEROVSKITE_PEAKS: Array<{ t: number; i: number }>;
  ALUMINA_PEAKS: Array<{ t: number; i: number }>;
  GRAPHITE_PEAKS: Array<{ t: number; i: number }>;
  refinementFlags?: RefinementFlags;
  onUpdateRefinementFlags?: (flags: RefinementFlags | ((prev: RefinementFlags) => RefinementFlags)) => void;
  qpaResults?: any[];
  onRunSingleStage?: (stageNumber: number) => Promise<any> | void;
}

export const RietveldParameterSet: React.FC<RietveldParameterSetProps> = ({
  simPhases,
  setSimPhases,
  selectedSimPhaseIdx,
  setSelectedSimPhaseIdx,
  userParams,
  setUserParams,
  targetParams,
  simPhase,
  setSimPhase,
  rFactor,
  referenceRwp,
  stabilityPercentage,
  isAutoRefining,
  setIsAutoRefining,
  stepwiseActive,
  stepwiseStage,
  stepwiseMessage,
  runStepwiseRefinement,
  onRunLmStep,
  onResetCold,
  onResetToNominal,
  onAddNewSimStructure,
  handleRemoveSimStructure,
  TARGET_PARAMS,
  SPACE_GROUP_DETAILS,
  isPythonActive,
  setIsPythonActive,
  pythonFeaturesEnabled = false,
  isPythonRefining,
  runPythonRietveldRefinement,
  rHistory,
  iterCount,
  playSynthTone,
  computeCrystallographicVolumeAndDensity,
  getPeaksForPhase,
  getEquivalentPositions,
  toSymmetryScreenCoords,
  QUARTZ_PEAKS,
  RUTILE_PEAKS,
  PEROVSKITE_PEAKS,
  ALUMINA_PEAKS,
  GRAPHITE_PEAKS,
  refinementFlags = {
    refineScale: true,
    refineLattice: true,
    refineFwhm: false,
    refineEta: false,
    refineZeroShift: true,
    refineBkg: true,
    refineMicrostrain: false,
    refineCrystalliteSize: false
  },
  onUpdateRefinementFlags,
  qpaResults,
  onRunSingleStage
}) => {
  // Navigation tabs for parameter set
  const [paramCategory, setParamCategory] = useState<'phase' | 'profile' | 'instrument' | 'reflections' | 'covariance'>('phase');
  const [stepSensitivity, setStepSensitivity] = useState<'fine' | 'coarse'>('fine');
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState<string>('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSymmetryProjection, setShowSymmetryProjection] = useState(false);
  const [symmetryProbeX, setSymmetryProbeX] = useState<number>(0.2);
  const [symmetryProbeY, setSymmetryProbeY] = useState<number>(0.35);
  const [isDraggingSymmetry, setIsDraggingSymmetry] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const currentPhaseObj = simPhases[selectedSimPhaseIdx] || simPhases[0] || {
    id: 'default',
    name: 'Default Phase',
    phaseType: 'Simple Cubic',
    enabled: true,
    a: 4.0, targetA: 4.0, scale: 1000, targetScale: 1000, fwhm: 0.2, targetFwhm: 0.2,
    eta: 0.5, targetEta: 0.5, crystalliteSize: 100, targetCrystalliteSize: 100,
    microstrain: 0.05, targetMicrostrain: 0.05, peaks: []
  };

  const targetLookup = TARGET_PARAMS[currentPhaseObj.phaseType] || TARGET_PARAMS[simPhase] || {
    a: currentPhaseObj.targetA || 4.0,
    scale: currentPhaseObj.targetScale || 1000,
    fwhm: currentPhaseObj.targetFwhm || 0.2,
    eta: currentPhaseObj.targetEta || 0.5,
    crystalliteSize: currentPhaseObj.targetCrystalliteSize || 100,
    microstrain: currentPhaseObj.targetMicrostrain || 0.05,
    zeroShift: 0.0,
    sampleDisplacement: 0.0,
    background: 50
  };

  // Safe flag toggler
  const toggleFlag = (flagKey: keyof RefinementFlags) => {
    if (!onUpdateRefinementFlags) return;
    onUpdateRefinementFlags(prev => ({
      ...prev,
      [flagKey]: !prev[flagKey]
    }));
  };

  // Standard Stage Presets
  const applyRefinePreset = (preset: 'all' | 'none' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5') => {
    if (!onUpdateRefinementFlags) return;
    switch (preset) {
      case 'all':
        onUpdateRefinementFlags({
          refineScale: true,
          refineLattice: true,
          refineFwhm: true,
          refineEta: true,
          refineZeroShift: true,
          refineBkg: true,
          refineMicrostrain: true,
          refineCrystalliteSize: true
        });
        break;
      case 'none':
        onUpdateRefinementFlags({
          refineScale: false,
          refineLattice: false,
          refineFwhm: false,
          refineEta: false,
          refineZeroShift: false,
          refineBkg: false,
          refineMicrostrain: false,
          refineCrystalliteSize: false
        });
        break;
      case 'stage1': // Scale Only
        onUpdateRefinementFlags({
          refineScale: true,
          refineLattice: false,
          refineFwhm: false,
          refineEta: false,
          refineZeroShift: false,
          refineBkg: false,
          refineMicrostrain: false,
          refineCrystalliteSize: false
        });
        break;
      case 'stage2': // Scale + Zero
        onUpdateRefinementFlags({
          refineScale: true,
          refineLattice: false,
          refineFwhm: false,
          refineEta: false,
          refineZeroShift: true,
          refineBkg: true,
          refineMicrostrain: false,
          refineCrystalliteSize: false
        });
        break;
      case 'stage3': // Scale + Zero + Lattice
        onUpdateRefinementFlags({
          refineScale: true,
          refineLattice: true,
          refineFwhm: false,
          refineEta: false,
          refineZeroShift: true,
          refineBkg: true,
          refineMicrostrain: false,
          refineCrystalliteSize: false
        });
        break;
      case 'stage4': // Scale + Zero + Lattice + Profile
        onUpdateRefinementFlags({
          refineScale: true,
          refineLattice: true,
          refineFwhm: true,
          refineEta: true,
          refineZeroShift: true,
          refineBkg: true,
          refineMicrostrain: false,
          refineCrystalliteSize: false
        });
        break;
      case 'stage5': // Full parameters
        onUpdateRefinementFlags({
          refineScale: true,
          refineLattice: true,
          refineFwhm: true,
          refineEta: true,
          refineZeroShift: true,
          refineBkg: true,
          refineMicrostrain: true,
          refineCrystalliteSize: true
        });
        break;
    }
  };

  // Step multipliers
  const stepCoeff = stepSensitivity === 'fine' ? 0.1 : 1.0;

  // Single parameter snap helper
  const snapParamToTarget = (key: keyof SimulationParameters) => {
    const val = (targetLookup as any)[key];
    if (val !== undefined) {
      setUserParams((prev: any) => ({
        ...prev,
        [key]: val
      }));
    }
  };

  // Quantitative Phase Analysis (Hill-Howard weight fractions)
  const calculatedQpa = useMemo(() => {
    if (qpaResults && qpaResults.length > 0) {
      return qpaResults;
    }
    const activePhases = simPhases.filter(p => p.enabled);
    if (activePhases.length === 0) return [];
    
    // Approximate mass product: S_p * V_p * rho_p
    const phaseWeights = activePhases.map(p => {
      const stats = computeCrystallographicVolumeAndDensity(p.phaseType, p.a);
      const v = stats?.volume || Math.pow(p.a, 3);
      const rho = stats?.density || 3.0;
      // Hill-Howard: W_p proportional to S_p * Z_p * M_p * V_p
      const rawMass = Math.max(0.0001, p.scale) * v * rho;
      return { id: p.id, name: p.name, phaseType: p.phaseType, rawMass, volume: v, density: rho };
    });

    const totalMass = phaseWeights.reduce((acc, curr) => acc + curr.rawMass, 0);

    return simPhases.map(p => {
      if (!p.enabled) return { id: p.id, name: p.name, phaseType: p.phaseType, weightFraction: 0, enabled: false };
      const item = phaseWeights.find(w => w.id === p.id);
      const wf = item && totalMass > 0 ? (item.rawMass / totalMass) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        phaseType: p.phaseType,
        weightFraction: wf,
        enabled: true,
        volume: item?.volume,
        density: item?.density
      };
    });
  }, [simPhases, computeCrystallographicVolumeAndDensity, qpaResults]);

  // Normalize multi-phase scales to target total 5000 intensity
  const handleNormalizeScales = () => {
    const totalScale = simPhases.reduce((acc, p) => acc + (p.enabled ? p.scale : 0), 0);
    if (totalScale <= 0) return;
    const factor = 4000 / totalScale;
    setSimPhases(prev => prev.map(p => p.enabled ? { ...p, scale: Math.round(p.scale * factor) } : p));
  };

  // Physical Bounds Validation
  const physicsSanityChecks = useMemo(() => {
    const issues: string[] = [];
    if (userParams.a < 1.0 || userParams.a > 30.0) {
      issues.push(`Lattice parameter a (${userParams.a.toFixed(3)} Å) is outside realistic range [1.0 - 30.0 Å]`);
    }
    if (userParams.scale <= 0) {
      issues.push('Scale factor must be strictly positive');
    }
    if (userParams.fwhm < 0.02 || userParams.fwhm > 3.0) {
      issues.push(`FWHM (${userParams.fwhm.toFixed(3)}°) is outside instrument optical limits [0.02° - 3.0°]`);
    }
    if (userParams.eta < 0.0 || userParams.eta > 1.0) {
      issues.push(`Lorentzian mix η (${userParams.eta.toFixed(2)}) must be between 0.0 and 1.0`);
    }
    if (userParams.crystalliteSize < 2) {
      issues.push(`Domain size (${userParams.crystalliteSize.toFixed(0)} nm) is below physical crystallite threshold`);
    }
    if (userParams.microstrain > 1.5) {
      issues.push(`Microstrain (${userParams.microstrain.toFixed(2)}%) indicates extreme unphysical lattice distortion`);
    }
    if (Math.abs(userParams.zeroShift) > 1.0) {
      issues.push(`Zero-point shift (${userParams.zeroShift.toFixed(3)}°) exceeds maximum goniometer misalignment allowance`);
    }
    return issues;
  }, [userParams]);

  // Auto sanitize parameters to physical limits
  const handleSanitizeBounds = () => {
    setUserParams((prev: any) => ({
      ...prev,
      a: Math.max(1.0, Math.min(25.0, prev.a)),
      scale: Math.max(10, Math.min(10000, prev.scale)),
      fwhm: Math.max(0.04, Math.min(2.0, prev.fwhm)),
      eta: Math.max(0.0, Math.min(1.0, prev.eta)),
      crystalliteSize: Math.max(5, Math.min(1000, prev.crystalliteSize)),
      microstrain: Math.max(0.0, Math.min(1.0, prev.microstrain)),
      zeroShift: Math.max(-0.5, Math.min(0.5, prev.zeroShift)),
      sampleDisplacement: Math.max(-0.5, Math.min(0.5, prev.sampleDisplacement)),
      background: Math.max(0, Math.min(500, prev.background))
    }));
  };

  // Phase prototype colors
  const phaseColors = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6'];

  const stats = computeCrystallographicVolumeAndDensity(simPhase, userParams.a);
  const spaceGroup = SPACE_GROUP_DETAILS[simPhase] || SPACE_GROUP_DETAILS['Simple Cubic'];

  // Symmetry SVG canvas interaction handlers
  const handleSvgInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (!e.touches || e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) / rect.width;
    const y = 1 - (clientY - rect.top) / rect.height;
    
    const posX = Math.max(0, Math.min(1, x));
    const posY = Math.max(0, Math.min(1, y));
    setSymmetryProbeX(parseFloat(posX.toFixed(3)));
    setSymmetryProbeY(parseFloat(posY.toFixed(3)));
  };

  const availableStructures = [
    { label: 'Silicon (SRM 640e Diamond)', type: 'Silicon (Diamond Cubic)' },
    { label: 'Alpha-Quartz SiO₂', type: 'Quartz' },
    { label: 'Perovskite CaTiO₃', type: 'Perovskite' },
    { label: 'Rutile TiO₂', type: 'Rutile' },
    { label: 'FCC Copper (Austenite)', type: 'FCC' },
    { label: 'BCC Iron (Ferrite)', type: 'BCC' },
    { label: 'Alumina α-Al₂O₃', type: 'Alumina (Hexagonal)' },
    { label: 'Hexagonal Graphite', type: 'Graphite (Hexagonal)' },
    { label: 'Simple Cubic Prototype', type: 'Simple Cubic' }
  ];

  // Helper for delta chip
  const renderDeltaChip = (current: number, nominal: number, unit: string, onSnap: () => void, decimals = 3) => {
    const diff = current - nominal;
    const pct = nominal !== 0 ? Math.abs((diff / nominal) * 100) : 0;
    const isClose = pct < 0.3;
    const isModerate = pct >= 0.3 && pct <= 2.5;

    return (
      <button
        onClick={onSnap}
        title={`Click to snap back to target nominal: ${nominal.toFixed(decimals)}${unit}`}
        className={`px-2 py-1 rounded font-mono text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
          isClose 
            ? 'bg-slate-800 border-emerald-500/50 text-emerald-400 hover:bg-slate-700' 
            : isModerate 
            ? 'bg-slate-800 border-amber-500/50 text-amber-400 hover:bg-slate-700' 
            : 'bg-slate-800 border-rose-500/50 text-rose-400 hover:bg-slate-700'
        }`}
      >
        <span>Δ {diff >= 0 ? `+${diff.toFixed(decimals)}` : diff.toFixed(decimals)}{unit}</span>
        <span className="opacity-75">({pct.toFixed(1)}%)</span>
        <Target className="w-3 h-3 opacity-80" />
      </button>
    );
  };

  // Helper for lock/free badge button
  const renderLockToggle = (flagKey: keyof RefinementFlags, label: string) => {
    const isFree = refinementFlags[flagKey];
    return (
      <button
        onClick={() => toggleFlag(flagKey)}
        title={isFree ? `${label} is FREE: solver will optimize this parameter. Click to LOCK.` : `${label} is LOCKED (Fixed): held constant. Click to REFINE.`}
        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
          isFree 
            ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' 
            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
        }`}
      >
        {isFree ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        <span>{isFree ? 'Free' : 'Fixed'}</span>
      </button>
    );
  };

  // Count free parameters in categories
  const freeCounts = {
    phase: (refinementFlags.refineLattice ? 1 : 0) + (refinementFlags.refineScale ? 1 : 0),
    profile: (refinementFlags.refineFwhm ? 1 : 0) + (refinementFlags.refineEta ? 1 : 0) + (refinementFlags.refineCrystalliteSize ? 1 : 0) + (refinementFlags.refineMicrostrain ? 1 : 0),
    instrument: (refinementFlags.refineZeroShift ? 1 : 0) + (refinementFlags.refineBkg ? 1 : 0)
  };

  return (
    <div id="rietveld-parameter-set-card" className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* 1. Header & Live Quality Status Bar */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">Rietveld Parameter Set</h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {currentPhaseObj.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {spaceGroup.symbol} (#{spaceGroup.number})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Full-pattern profile refinement model • Levenberg-Marquardt & Pseudo-Voigt convolution
              </p>
            </div>
          </div>

          {/* Live Rwp & χ² Quality Badge */}
          <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-700/80 bg-slate-950/60 shadow-md">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Weighted Profile</span>
                <span className={`text-sm font-black font-mono tracking-tight ${
                  rFactor < 12 ? 'text-emerald-400' : rFactor < 25 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  R_wp: {rFactor.toFixed(2)}%
                </span>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Goodness of Fit (χ²)</span>
                <span className="text-sm font-black font-mono text-cyan-300">
                  {(Math.pow(rFactor / referenceRwp, 2)).toFixed(2)}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stability</span>
                <span className="text-sm font-black font-mono text-emerald-300">
                  {stabilityPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-slate-800/80">
          {/* 5-Stage Guided Auto Refine */}
          <button 
            onClick={runStepwiseRefinement}
            className={`px-3.5 py-1.5 rounded-lg transition-all border flex items-center gap-2 font-bold text-xs cursor-pointer shadow-sm ${
              stepwiseActive 
                ? 'text-slate-950 bg-emerald-400 border-emerald-300 hover:bg-emerald-300 shadow-emerald-950/50' 
                : 'text-emerald-300 bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40'
            }`}
            title="Execute automated 5-stage sequential Rietveld refinement protocol"
          >
            <Zap className={`w-3.5 h-3.5 ${stepwiseActive ? 'animate-bounce' : 'text-emerald-400'}`} />
            {stepwiseActive ? `Stage ${stepwiseStage}/5 Refining...` : 'Auto Refine (5-Stage)'}
          </button>

          {/* 1-Step LM Refinement */}
          {onRunLmStep && (
            <button
              onClick={onRunLmStep}
              className="px-3 py-1.5 rounded-lg transition-all border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Perform single damped Levenberg-Marquardt iteration step"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              1-Step LM
            </button>
          )}

          {/* Direct Stage Triggers */}
          {onRunSingleStage && (
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Stage:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onRunSingleStage(s)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:bg-indigo-600 transition-colors cursor-pointer"
                  title={`Execute only Stage ${s}`}
                >
                  S{s}
                </button>
              ))}
            </div>
          )}

          {/* Snap to Certified Nominal Target */}
          <button
            onClick={onResetToNominal}
            className="px-3 py-1.5 rounded-lg transition-all border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            title="Reset parameters to canonical target/reference values"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            Snap Target
          </button>

          {/* Cold Perturb / Perturb Starting Point */}
          <button 
            onClick={onResetCold}
            className="px-3 py-1.5 rounded-lg transition-all border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            title="Perturb parameters by 5-20% to test solver convergence from scratch"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Perturb
          </button>

          <div className="flex-1" />

          {/* Live Tuning Toggle */}
          <button 
            onClick={() => setIsAutoRefining(!isAutoRefining)}
            className={`px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 font-bold text-xs cursor-pointer ${
              isAutoRefining 
                ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/50 shadow-sm' 
                : 'text-slate-400 bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Toggle interactive real-time simulation updates"
          >
            <PlayCircle className={`w-3.5 h-3.5 ${isAutoRefining ? 'text-emerald-400' : 'text-slate-500'}`} />
            {isAutoRefining ? 'Live Active' : 'Live Tuning'}
          </button>

          {/* Python Engine Toggle */}
          {pythonFeaturesEnabled && (
            <button 
              onClick={() => setIsPythonActive(!isPythonActive)}
              className={`px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 font-semibold text-xs cursor-pointer ${
                isPythonActive 
                  ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/50' 
                  : 'text-slate-400 bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Toggle server-side Python SciPy/Pandas Rietveld optimizer"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Python
            </button>
          )}

          {isPythonActive && (
            <button 
              onClick={runPythonRietveldRefinement}
              disabled={isPythonRefining}
              className={`px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 font-bold text-xs cursor-pointer ${
                isPythonRefining 
                  ? 'text-slate-400 bg-slate-800 border-slate-700 cursor-wait' 
                  : 'text-white bg-cyan-600 border-cyan-500 hover:bg-cyan-500 shadow-sm'
              }`}
            >
              {isPythonRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
              {isPythonRefining ? 'Refining...' : 'Run SciPy'}
            </button>
          )}
        </div>

        {/* Stepwise Banner when active */}
        {stepwiseActive && (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-mono font-bold text-emerald-200 flex-1">
              {stepwiseMessage || `Automated Stage ${stepwiseStage}/5 active`}
            </span>
          </div>
        )}

        {/* Physics Warning Alert Banner */}
        {physicsSanityChecks.length > 0 && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-950/30 border border-rose-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{physicsSanityChecks[0]}</span>
              {physicsSanityChecks.length > 1 && (
                <span className="px-2 py-0.5 bg-rose-900/50 rounded-full text-[10px] font-mono">+{physicsSanityChecks.length - 1} more</span>
              )}
            </div>
            <button
              onClick={handleSanitizeBounds}
              className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
            >
              Sanitize Bounds
            </button>
          </div>
        )}
      </div>

      {/* 3. Multi-Phase Switcher & Quantitative Weight Fraction Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-300" /> Phase Inventory
          </span>
          <div className="flex items-center gap-2">
            {simPhases.length > 1 && (
              <button
                onClick={handleNormalizeScales}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                title="Normalize phase scales to balance intensity sum"
              >
                Normalize Scales
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Phase
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-700">
                    Select Crystal Prototype
                  </div>
                  {availableStructures.map((struct) => (
                    <button
                      key={struct.type}
                      onClick={() => {
                        onAddNewSimStructure(struct.type);
                        setShowAddMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{struct.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proportional Weight Fraction Bar */}
        {simPhases.length > 1 && (
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800 mb-4 border border-slate-700">
            {calculatedQpa.map((q: any, idx: number) => (
              <div 
                key={q.id || idx}
                style={{ 
                  width: `${q.weightFraction || 0}%`,
                  backgroundColor: phaseColors[idx % phaseColors.length]
                }}
                className="h-full transition-all duration-300"
                title={`${q.name}: ${(q.weightFraction || 0).toFixed(1)} wt%`}
              />
            ))}
          </div>
        )}

        {/* Phase Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {simPhases.map((phase, idx) => {
            const isSelected = idx === selectedSimPhaseIdx;
            const qpaItem = calculatedQpa.find((q: any) => q.id === phase.id);
            const wtFraction = qpaItem?.weightFraction || 0;
            const color = phaseColors[idx % phaseColors.length];

            return (
              <div 
                key={phase.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isSelected 
                    ? 'bg-slate-700 border-slate-500 text-white shadow-sm' 
                    : phase.enabled
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                {/* Enabled Toggle Checkbox */}
                <input
                  type="checkbox"
                  checked={phase.enabled}
                  onChange={(e) => {
                    const next = [...simPhases];
                    next[idx] = { ...next[idx], enabled: e.target.checked };
                    setSimPhases(next);
                  }}
                  className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                  title="Include or exclude this phase in pattern calculation"
                />

                {/* Color Dot & Select Action */}
                <button
                  onClick={() => {
                    setSelectedSimPhaseIdx(idx);
                    setSimPhase(phase.phaseType);
                  }}
                  className="flex items-center gap-2 text-left cursor-pointer"
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: phase.enabled ? color : '#475569' }} 
                  />
                  {editingPhaseId === phase.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingPhaseName}
                        onChange={(e) => setEditingPhaseName(e.target.value)}
                        className="bg-slate-900 px-2 py-1 rounded text-xs border border-slate-600 text-white w-24 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const next = [...simPhases];
                          next[idx] = { ...next[idx], name: editingPhaseName || next[idx].name };
                          setSimPhases(next);
                          setEditingPhaseId(null);
                        }}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold truncate max-w-[150px]">
                      {phase.name}
                    </span>
                  )}
                </button>

                {/* Quantitative Wf% Tag */}
                {phase.enabled && (
                  <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700">
                    {wtFraction.toFixed(1)}%
                  </span>
                )}

                {/* Rename Button */}
                {editingPhaseId !== phase.id && (
                  <button
                    onClick={() => {
                      setEditingPhaseId(phase.id);
                      setEditingPhaseName(phase.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity"
                    title="Rename phase"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Delete Button (if > 1 phase) */}
                {simPhases.length > 1 && (
                  <button
                    onClick={() => handleRemoveSimStructure(idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Remove this phase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Global Refinement Protocol Presets & Step Sensitivity Bar */}
      <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Presets:
          </span>
          <button
            onClick={() => applyRefinePreset('stage1')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 transition-colors cursor-pointer"
            title="Refine Scale Only"
          >
            Stage 1 (Scale)
          </button>
          <button
            onClick={() => applyRefinePreset('stage2')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 transition-colors cursor-pointer"
            title="Refine Scale + Zero Shift"
          >
            Stage 2 (+Zero)
          </button>
          <button
            onClick={() => applyRefinePreset('stage3')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 transition-colors cursor-pointer"
            title="Refine Scale + Zero + Lattice"
          >
            Stage 3 (+Lattice)
          </button>
          <button
            onClick={() => applyRefinePreset('stage4')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 transition-colors cursor-pointer"
            title="Refine Scale + Zero + Lattice + Profile"
          >
            Stage 4 (+Profile)
          </button>
          <button
            onClick={() => applyRefinePreset('all')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 transition-colors cursor-pointer"
            title="Free all parameters for full refinement"
          >
            Free All
          </button>
          <button
            onClick={() => applyRefinePreset('none')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-400 transition-colors cursor-pointer"
            title="Lock all parameters"
          >
            Lock All
          </button>
        </div>

        {/* Step Sensitivity Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step:</span>
          <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => setStepSensitivity('fine')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                stepSensitivity === 'fine' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fine (0.001)
            </button>
            <button
              onClick={() => setStepSensitivity('coarse')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                stepSensitivity === 'coarse' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Coarse (0.02)
            </button>
          </div>
        </div>
      </div>

      {/* 5. Categorized Navigation Tabs */}
      <div className="flex items-center justify-start border-b border-slate-800 px-5 bg-slate-950/30 overflow-x-auto gap-2">
        <button
          onClick={() => setParamCategory('phase')}
          className={`py-3 px-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            paramCategory === 'phase' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Phase & Lattice</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
            {freeCounts.phase} free
          </span>
        </button>

        <button
          onClick={() => setParamCategory('profile')}
          className={`py-3 px-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            paramCategory === 'profile' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Profile & Strain</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
            {freeCounts.profile} free
          </span>
        </button>

        <button
          onClick={() => setParamCategory('instrument')}
          className={`py-3 px-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            paramCategory === 'instrument' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Instrument & Bkg</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
            {freeCounts.instrument} free
          </span>
        </button>

        <button
          onClick={() => setParamCategory('reflections')}
          className={`py-3 px-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            paramCategory === 'reflections' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>HKL Peaks</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
            {currentPhaseObj.peaks?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setParamCategory('covariance')}
          className={`py-3 px-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            paramCategory === 'covariance' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Covariance</span>
        </button>
      </div>

      {/* 6. Active Tab Content Body */}
      <div className="p-5 space-y-6">
        {/* ================= TAB 1: PHASE & LATTICE ================= */}
        {paramCategory === 'phase' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Space Group Selector */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" /> Crystal Prototype & Space Group
                </label>
                <p className="text-sm font-mono font-semibold text-slate-200 mt-1">
                  {spaceGroup.symbol} (#{spaceGroup.number}) • {spaceGroup.crystalSystem}
                </p>
              </div>
              <select
                value={simPhase}
                onChange={(e) => {
                  const newPhase = e.target.value;
                  setSimPhase(newPhase);
                  const target = TARGET_PARAMS[newPhase];
                  if (target) {
                    setUserParams({
                      ...target,
                      peaks: getPeaksForPhase(newPhase, target.a)
                    });
                    const next = [...simPhases];
                    next[selectedSimPhaseIdx] = {
                      ...next[selectedSimPhaseIdx],
                      phaseType: newPhase,
                      a: target.a,
                      targetA: target.a,
                      scale: target.scale,
                      targetScale: target.scale,
                      fwhm: target.fwhm,
                      targetFwhm: target.fwhm,
                      eta: target.eta,
                      targetEta: target.eta,
                      crystalliteSize: target.crystalliteSize,
                      targetCrystalliteSize: target.crystalliteSize,
                      microstrain: target.microstrain,
                      targetMicrostrain: target.microstrain,
                      peaks: getPeaksForPhase(newPhase, target.a)
                    };
                    setSimPhases(next);
                  }
                }}
                className="bg-slate-900 text-emerald-400 border border-slate-600 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {Object.keys(TARGET_PARAMS).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Parameter 1: Lattice Parameter a (Å) */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Lattice Parameter <span className="font-mono text-emerald-400 font-bold">a</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">(Å)</span>
                  <WhatDoesThisMeanTooltip 
                    term="Lattice Constant a"
                    explanation="The edge length of the unit cell along the primary crystallographic axis."
                    physicalInterpretation="Governs the 2θ diffraction angle positions of Bragg reflections via Bragg's law λ = 2d sinθ."
                    ruleOfThumb="Refine only after scale factor and zero shift are stabilized to avoid severe parameter divergence."
                  />
                </div>
                <div className="flex items-center gap-3">
                  {renderDeltaChip(userParams.a, targetLookup.a, ' Å', () => snapParamToTarget('a'), 4)}
                  {renderLockToggle('refineLattice', 'Lattice a')}
                </div>
              </div>

              {/* Slider, Micro-Steppers, and Numeric Input */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, a: parseFloat((p.a - 0.01 * stepCoeff).toFixed(4)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                  title="Step Down"
                >
                  -
                </button>
                <input
                  type="range"
                  min="2.0"
                  max="12.0"
                  step={0.001 * stepCoeff}
                  value={userParams.a}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, a: parseFloat(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, a: parseFloat((p.a + 0.01 * stepCoeff).toFixed(4)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                  title="Step Up"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={0.0001}
                    value={userParams.a}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, a: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Derived Crystallographic Cards */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
                <div className="p-3 rounded border border-slate-700 bg-slate-800 flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Cell Volume (V)</span>
                  <span className="text-slate-200 font-mono font-semibold mt-1">{stats.volume.toFixed(2)} Å³</span>
                </div>
                <div className="p-3 rounded border border-slate-700 bg-slate-800 flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Theor. Density (ρ)</span>
                  <span className="text-emerald-400 font-mono font-semibold mt-1">{stats.density.toFixed(2)} g/cm³</span>
                </div>
                <div className="p-3 rounded border border-slate-700 bg-slate-800 flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase text-xs">Formula Units (Z)</span>
                  <span className="text-indigo-400 font-mono font-semibold mt-1">Z = {stats.z}</span>
                </div>
              </div>
            </div>

            {/* Parameter 2: Scale Factor Sp */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Phase Scale Factor <span className="font-mono text-emerald-400 font-bold">S_p</span>
                  </span>
                  <WhatDoesThisMeanTooltip 
                    term="Scale Factor S"
                    explanation="Overall intensity multiplier proportional to phase abundance and volume in the beam path."
                    physicalInterpretation="Governs the total integrated intensity of all Bragg peaks for this phase relative to background."
                    ruleOfThumb="Refine first before all other structural parameters (Stage 1)."
                  />
                </div>
                <div className="flex items-center gap-3">
                  {renderDeltaChip(userParams.scale, targetLookup.scale, '', () => snapParamToTarget('scale'), 0)}
                  {renderLockToggle('refineScale', 'Scale Factor')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, scale: Math.max(10, Math.round(p.scale - 50 * stepCoeff)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step={10 * stepCoeff}
                  value={userParams.scale}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, scale: parseInt(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, scale: Math.min(10000, Math.round(p.scale + 50 * stepCoeff)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={10}
                    value={userParams.scale}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, scale: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Symmetry Projection Toggle & Canvas */}
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <button
                onClick={() => setShowSymmetryProjection(!showSymmetryProjection)}
                className="w-full px-5 py-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors flex items-center justify-between text-sm font-semibold text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-emerald-400" />
                  <span>2D Unit Cell Symmetry Projection & Wyckoff Sites</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSymmetryProjection ? 'rotate-180' : ''}`} />
              </button>

              {showSymmetryProjection && (
                <div className="p-5 space-y-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Interactive unit cell projection along [001]. Drag or click the gold test atom to see space group symmetry equivalent sites generated under {spaceGroup.symbol}.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative w-48 h-48 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shrink-0">
                      <svg
                        ref={svgRef}
                        viewBox="0 0 200 200"
                        className="w-full h-full cursor-crosshair select-none"
                        onMouseDown={() => setIsDraggingSymmetry(true)}
                        onMouseUp={() => setIsDraggingSymmetry(false)}
                        onMouseMove={(e) => isDraggingSymmetry && handleSvgInteraction(e)}
                        onClick={handleSvgInteraction}
                      >
                        {/* Grid lines */}
                        <line x1="0" y1="100" x2="200" y2="100" stroke="#334155" strokeDasharray="3,3" />
                        <line x1="100" y1="0" x2="100" y2="200" stroke="#334155" strokeDasharray="3,3" />

                        {/* Symmetry-generated equivalent points */}
                        {getEquivalentPositions(simPhase, symmetryProbeX, symmetryProbeY).map((pt, idx) => {
                          const screen = toSymmetryScreenCoords(pt.x, pt.y, 200, 200, spaceGroup.crystalSystem === 'Trigonal' || spaceGroup.crystalSystem === 'Hexagonal');
                          return (
                            <circle
                              key={idx}
                              cx={screen.x}
                              cy={screen.y}
                              r={4}
                              fill="#34d399"
                              opacity={0.8}
                            />
                          );
                        })}

                        {/* Primary movable probe atom */}
                        {(() => {
                          const probe = toSymmetryScreenCoords(symmetryProbeX, symmetryProbeY, 200, 200, spaceGroup.crystalSystem === 'Trigonal' || spaceGroup.crystalSystem === 'Hexagonal');
                          return (
                            <circle
                              cx={probe.x}
                              cy={probe.y}
                              r={6}
                              fill="#fbbf24"
                              stroke="#ffffff"
                              strokeWidth={1.5}
                            />
                          );
                        })()}
                      </svg>
                    </div>

                    <div className="flex-1 space-y-3 text-sm">
                      <div className="p-3 rounded-md bg-slate-800/80 border border-slate-700">
                        <span className="text-xs uppercase font-semibold text-slate-400">Probe Coordinates</span>
                        <p className="font-mono text-slate-200 font-semibold mt-1">
                          x: {symmetryProbeX.toFixed(3)}, y: {symmetryProbeY.toFixed(3)}, z: 0.000
                        </p>
                      </div>
                      <div className="p-3 rounded-md bg-slate-800/80 border border-slate-700">
                        <span className="text-xs uppercase font-semibold text-slate-400">Equivalent Multiplicity</span>
                        <p className="font-mono text-emerald-400 font-semibold mt-1">
                          {getEquivalentPositions(simPhase, symmetryProbeX, symmetryProbeY).length} symmetry related sites
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: PROFILE & STRAIN ================= */}
        {paramCategory === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Parameter: Base FWHM */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Instrument Peak FWHM <span className="font-mono text-emerald-400 font-bold">H_k</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">(2θ°)</span>
                  <WhatDoesThisMeanTooltip 
                    term="Peak FWHM"
                    explanation="Full Width at Half Maximum representing instrumental broadening."
                    physicalInterpretation="Broader peaks reflect either smaller crystallite size or higher optical divergence."
                    ruleOfThumb="Standard laboratory diffractometers have minimum FWHM around 0.05° - 0.15°."
                  />
                </div>
                <div className="flex items-center gap-3">
                  {renderDeltaChip(userParams.fwhm, targetLookup.fwhm, '°', () => snapParamToTarget('fwhm'), 3)}
                  {renderLockToggle('refineFwhm', 'Peak FWHM')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, fwhm: parseFloat(Math.max(0.02, p.fwhm - 0.01 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.04"
                  max="1.5"
                  step={0.005 * stepCoeff}
                  value={userParams.fwhm}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, fwhm: parseFloat(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, fwhm: parseFloat(Math.min(2.0, p.fwhm + 0.01 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={0.005}
                    value={userParams.fwhm}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, fwhm: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Parameter: Pseudo-Voigt Eta (Lorentzian mix) */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Pseudo-Voigt Mix <span className="font-mono text-emerald-400 font-bold">η</span>
                  </span>
                  <WhatDoesThisMeanTooltip 
                    term="Pseudo-Voigt (eta)"
                    explanation="Linear mixing fraction combining Gaussian and Lorentzian profile shapes."
                    physicalInterpretation="η = 0 is pure Gaussian (instrument optics); η = 1 is pure Lorentzian (finite domain & strain)."
                    ruleOfThumb="High-quality powder scans typically range between 0.35 and 0.65."
                  />
                </div>
                <div className="flex items-center gap-3">
                  {renderDeltaChip(userParams.eta, targetLookup.eta, '', () => snapParamToTarget('eta'), 2)}
                  {renderLockToggle('refineEta', 'Pseudo-Voigt eta')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, eta: parseFloat(Math.max(0, p.eta - 0.05 * stepCoeff).toFixed(2)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step={0.01 * stepCoeff}
                  value={userParams.eta}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, eta: parseFloat(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, eta: parseFloat(Math.min(1.0, p.eta + 0.05 * stepCoeff).toFixed(2)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={0.01}
                    value={userParams.eta}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, eta: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Visual Gaussian vs Lorentzian Mix Gauge */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono font-medium text-slate-400">
                  <span>Gaussian: {((1 - userParams.eta) * 100).toFixed(0)}%</span>
                  <span>Lorentzian: {(userParams.eta * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
                  <div style={{ width: `${(1 - userParams.eta) * 100}%` }} className="bg-sky-500 h-full" />
                  <div style={{ width: `${userParams.eta * 100}%` }} className="bg-emerald-400 h-full" />
                </div>
              </div>
            </div>

            {/* Parameter: Crystallite Domain Size D (nm) */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Crystallite Domain Size <span className="font-mono text-emerald-400 font-bold">D</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">(nm)</span>
                  <WhatDoesThisMeanTooltip 
                    term="Crystallite Size (Scherrer)"
                    explanation="Mean size of coherently scattering crystalline domains."
                    physicalInterpretation="Produces size broadening scaling with 1/cosθ in the Scherrer formula."
                    ruleOfThumb="Nanoscale particles exhibit significant size broadening below 80 nm."
                  />
                </div>
                <div className="flex items-center gap-3">
                  {renderDeltaChip(userParams.crystalliteSize, targetLookup.crystalliteSize, ' nm', () => snapParamToTarget('crystalliteSize'), 1)}
                  {renderLockToggle('refineCrystalliteSize', 'Crystallite Size')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, crystalliteSize: Math.max(2, Math.round(p.crystalliteSize - 5 * stepCoeff)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step={1 * stepCoeff}
                  value={userParams.crystalliteSize}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, crystalliteSize: parseInt(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, crystalliteSize: Math.min(1000, Math.round(p.crystalliteSize + 5 * stepCoeff)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={1}
                    value={userParams.crystalliteSize}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, crystalliteSize: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Parameter: Lattice Microstrain ε (%) */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Lattice Microstrain <span className="font-mono text-emerald-400 font-bold">ε</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">(%)</span>
                  <WhatDoesThisMeanTooltip 
                    term="Microstrain (RMS Strain)"
                    explanation="Root-mean-square variation in lattice d-spacing from dislocations or internal stresses."
                    physicalInterpretation="Causes angular broadening scaling with tanθ according to the Williamson-Hall formalism."
                    ruleOfThumb="Deformed and milled materials exhibit microstrain up to 0.5%."
                  />
                </div>
                <div className="flex items-center gap-3">
                  {renderDeltaChip(userParams.microstrain, targetLookup.microstrain, '%', () => snapParamToTarget('microstrain'), 3)}
                  {renderLockToggle('refineMicrostrain', 'Microstrain')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, microstrain: parseFloat(Math.max(0, p.microstrain - 0.01 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step={0.002 * stepCoeff}
                  value={userParams.microstrain}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, microstrain: parseFloat(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, microstrain: parseFloat(Math.min(1.5, p.microstrain + 0.01 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={0.001}
                    value={userParams.microstrain}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, microstrain: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: INSTRUMENT & BKG ================= */}
        {paramCategory === 'instrument' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Zero Shift 2θ0 */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Goniometer Zero-Point Shift <span className="font-mono text-emerald-400 font-bold">2θ₀</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">(°)</span>
                  <WhatDoesThisMeanTooltip 
                    term="Zero Shift Error"
                    explanation="Constant angular alignment offset of the 2θ detector goniometer arm."
                    physicalInterpretation="Shifts all diffraction peaks uniformly across the pattern irrespective of Bragg angle."
                    ruleOfThumb="A properly aligned diffractometer maintains zero error within ±0.03°."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUserParams((p: any) => ({ ...p, zeroShift: 0.0 }))}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-mono font-medium text-slate-300 cursor-pointer"
                    title="Reset Zero-Shift to exact 0.00°"
                  >
                    Align 0.00°
                  </button>
                  {renderLockToggle('refineZeroShift', 'Zero Shift')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, zeroShift: parseFloat((p.zeroShift - 0.01 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-0.4"
                  max="0.4"
                  step={0.002 * stepCoeff}
                  value={userParams.zeroShift}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, zeroShift: parseFloat(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, zeroShift: parseFloat((p.zeroShift + 0.01 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={0.001}
                    value={userParams.zeroShift}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, zeroShift: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Sample Displacement s (mm) */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Specimen Height Displacement <span className="font-mono text-emerald-400 font-bold">s</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">(mm)</span>
                  <WhatDoesThisMeanTooltip 
                    term="Sample Displacement"
                    explanation="Specimen height error relative to the focusing circle plane in Bragg-Brentano geometry."
                    physicalInterpretation="Generates a peak shift proportional to -2s·cosθ / R (vanishes at high 2θ)."
                    ruleOfThumb="Careful front-loading sample preparation minimizes height error."
                  />
                </div>
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, sampleDisplacement: 0.0 }))}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-mono font-medium text-slate-300 cursor-pointer"
                >
                  Flush 0.00 mm
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, sampleDisplacement: parseFloat((p.sampleDisplacement - 0.02 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step={0.005 * stepCoeff}
                  value={userParams.sampleDisplacement}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, sampleDisplacement: parseFloat(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, sampleDisplacement: parseFloat((p.sampleDisplacement + 0.02 * stepCoeff).toFixed(3)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={0.005}
                    value={userParams.sampleDisplacement}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, sampleDisplacement: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Background Floor B */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    Continuous Background Floor <span className="font-mono text-emerald-400 font-bold">B(2θ)</span>
                  </span>
                  <WhatDoesThisMeanTooltip 
                    term="Background Level"
                    explanation="Baseline intensity floor produced by incoherent Compton scatter, fluorescence, and sample holder."
                    physicalInterpretation="Provides background subtraction for determining true net integrated Bragg intensities."
                    ruleOfThumb="Refine early with scale factors to establish correct peak-to-background ratio."
                  />
                </div>
                {renderLockToggle('refineBkg', 'Background')}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, background: Math.max(0, Math.round(p.background - 10 * stepCoeff)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step={2 * stepCoeff}
                  value={userParams.background}
                  onChange={(e) => setUserParams((p: any) => ({ ...p, background: parseInt(e.target.value) }))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setUserParams((p: any) => ({ ...p, background: Math.min(600, Math.round(p.background + 10 * stepCoeff)) }))}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-slate-300 font-mono cursor-pointer"
                >
                  +
                </button>
                <div className="w-28">
                  <input
                    type="number"
                    step={1}
                    value={userParams.background}
                    onChange={(e) => setUserParams((p: any) => ({ ...p, background: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-mono font-semibold text-emerald-400 text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: HKL REFLECTIONS ================= */}
        {paramCategory === 'reflections' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-slate-300">
                Active Bragg Reflections ({currentPhaseObj.name})
              </span>
              <button
                onClick={() => {
                  const defaultPeaks = getPeaksForPhase(simPhase, userParams.a);
                  setUserParams((p: any) => ({ ...p, peaks: defaultPeaks }));
                }}
                className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Auto-Index Space Group
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-700 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 border-b border-slate-700 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 w-12">Use</th>
                    <th className="px-4 py-3">h k l</th>
                    <th className="px-4 py-3">d-spacing</th>
                    <th className="px-4 py-3">2θ (Cu Kα)</th>
                    <th className="px-4 py-3">Rel. Intensity</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 font-mono text-sm">
                  {(userParams.peaks || []).map((peak, idx) => {
                    // Compute theoretical d-spacing and 2theta
                    const d = userParams.a / Math.sqrt(peak.h * peak.h + peak.k * peak.k + peak.l * peak.l);
                    const sinTheta = 1.5406 / (2 * d);
                    const twoTheta = sinTheta < 1 ? 2 * Math.asin(sinTheta) * (180 / Math.PI) : 0;

                    return (
                      <tr key={idx} className={peak.enabled ? 'bg-slate-900/50 hover:bg-slate-800/80 text-slate-200' : 'opacity-50 hover:bg-slate-900/40 text-slate-500'}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={peak.enabled}
                            onChange={(e) => {
                              const newPeaks = [...userParams.peaks];
                              newPeaks[idx] = { ...newPeaks[idx], enabled: e.target.checked };
                              setUserParams((p: any) => ({ ...p, peaks: newPeaks }));
                            }}
                            className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer bg-slate-800"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-100">
                          ({peak.h} {peak.k} {peak.l})
                        </td>
                        <td className="px-4 py-3 text-emerald-400">
                          {d.toFixed(4)} Å
                        </td>
                        <td className="px-4 py-3 text-sky-400">
                          {twoTheta > 0 ? `${twoTheta.toFixed(2)}°` : 'Extinct'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={peak.intensity}
                            onChange={(e) => {
                              const newPeaks = [...userParams.peaks];
                              newPeaks[idx] = { ...newPeaks[idx], intensity: Math.max(0, parseInt(e.target.value) || 0) };
                              setUserParams((p: any) => ({ ...p, peaks: newPeaks }));
                            }}
                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const newPeaks = userParams.peaks.filter((_, i) => i !== idx);
                              setUserParams((p: any) => ({ ...p, peaks: newPeaks }));
                            }}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            title="Delete reflection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Reflection Row */}
            <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg flex items-center justify-between text-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Manual Reflection Insertion</span>
              <button
                onClick={() => {
                  const newPeaks = [...(userParams.peaks || []), { h: 1, k: 0, l: 0, intensity: 50, enabled: true }];
                  setUserParams((p: any) => ({ ...p, peaks: newPeaks }));
                }}
                className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Reflection
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 5: COVARIANCE & DIAGNOSTICS ================= */}
        {paramCategory === 'covariance' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-200">
                  Inter-Parameter Covariance & Correlation Matrix (R²)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Assesses mathematical parameter decoupling. Pearson correlation coefficients |r| &gt; 0.85 indicate severe parameter entanglement.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Stability: {stabilityPercentage.toFixed(0)}%
              </div>
            </div>

            {/* Mini Heatmap Table */}
            <div className="overflow-x-auto border border-slate-700 rounded-lg bg-slate-900 p-4">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-2 text-left">Param</th>
                    <th className="p-2">a</th>
                    <th className="p-2">Scale</th>
                    <th className="p-2">2θ₀</th>
                    <th className="p-2">FWHM</th>
                    <th className="p-2">η</th>
                    <th className="p-2">Bkg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-2 font-semibold text-left text-slate-200">Lattice a</td>
                    <td className="p-2 bg-emerald-500/20 text-emerald-300 font-bold rounded-l-md">1.00</td>
                    <td className="p-2 text-slate-500">0.04</td>
                    <td className="p-2 bg-rose-500/20 text-rose-300 font-bold" title="Lattice constant strongly correlates with Zero Shift">0.72</td>
                    <td className="p-2 text-slate-500">-0.08</td>
                    <td className="p-2 text-slate-500">0.02</td>
                    <td className="p-2 text-slate-500 rounded-r-md">-0.01</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-left text-slate-200">Scale</td>
                    <td className="p-2 text-slate-500 rounded-l-md">0.04</td>
                    <td className="p-2 bg-emerald-500/20 text-emerald-300 font-bold">1.00</td>
                    <td className="p-2 text-slate-500">0.01</td>
                    <td className="p-2 bg-amber-500/20 text-amber-300 font-bold">0.48</td>
                    <td className="p-2 text-slate-500">0.12</td>
                    <td className="p-2 bg-rose-500/20 text-rose-300 font-bold rounded-r-md" title="Scale correlates with background level">0.65</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-left text-slate-200">Zero Shift 2θ₀</td>
                    <td className="p-2 bg-rose-500/20 text-rose-300 font-bold rounded-l-md">0.72</td>
                    <td className="p-2 text-slate-500">0.01</td>
                    <td className="p-2 bg-emerald-500/20 text-emerald-300 font-bold">1.00</td>
                    <td className="p-2 text-slate-500">0.03</td>
                    <td className="p-2 text-slate-500">0.01</td>
                    <td className="p-2 text-slate-500 rounded-r-md">0.05</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-left text-slate-200">FWHM</td>
                    <td className="p-2 text-slate-500 rounded-l-md">-0.08</td>
                    <td className="p-2 bg-amber-500/20 text-amber-300 font-bold">0.48</td>
                    <td className="p-2 text-slate-500">0.03</td>
                    <td className="p-2 bg-emerald-500/20 text-emerald-300 font-bold">1.00</td>
                    <td className="p-2 bg-rose-500/20 text-rose-300 font-bold" title="FWHM strongly correlates with Lorentzian mix eta">-0.68</td>
                    <td className="p-2 text-slate-500 rounded-r-md">-0.15</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold text-left text-slate-200">Lorentzian η</td>
                    <td className="p-2 text-slate-500 rounded-l-md">0.02</td>
                    <td className="p-2 text-slate-500">0.12</td>
                    <td className="p-2 text-slate-500">0.01</td>
                    <td className="p-2 bg-rose-500/20 text-rose-300 font-bold">-0.68</td>
                    <td className="p-2 bg-emerald-500/20 text-emerald-300 font-bold">1.00</td>
                    <td className="p-2 text-slate-500 rounded-r-md">-0.09</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Convergence History Mini Chart */}
            <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  R_wp Convergence Trajectory
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {rHistory.length} refinement steps logged
                </span>
              </div>
              {rHistory.length > 1 ? (
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rHistory.map((val, idx) => ({ step: idx + 1, rwp: val }))}>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Area 
                        type="monotone" 
                        dataKey="rwp" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.15} 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-5 text-center">
                  Execute "Auto Refine" or "1-Step LM" to visualize the iterative convergence curve.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
