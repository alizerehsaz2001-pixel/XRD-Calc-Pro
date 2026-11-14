import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  Sliders,
  Layers,
  Compass,
  Download,
  FileText,
  Terminal,
  Play,
  RefreshCw,
  RotateCw,
  Search,
  Check,
  Copy,
  Eye,
  Upload,
  ChevronDown,
  ChevronRight,
  Sigma,
  ZoomOut,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';
import { ScientificMathControl } from './ScientificMathControl';
import {
  CrystalSystem,
  DecompositionMethod,
  ProfileShapeType,
  InitialGuessMode,
  PeakReflection,
  PatternPoint,
  RefinementMetrics,
  ConvergenceStep,
  BackgroundCoeffs,
  UploadedXRDData,
  LatticeParameters,
  CagliotiProfile
} from './pawley_lebail/PawleyLeBailTypes';
import { PAWLEY_PRESETS } from './pawley_lebail/PawleyPresetsDb';
import {
  generateReflections,
  buildInitialIntensities,
  synthesizeObservedPattern,
  evaluatePatternFit,
  stepLeBailIteration,
  stepPawleyIteration,
  stepCellAndProfileRefinement,
  analyzeOverlaps,
  extractCovarianceClusters,
  calculateRefinementMetrics,
  calculateCagliotiFWHM,
  evaluateProfileShape,
  parseXRDDataFile,
  exportSHELX_HKL,
  exportFullProf_PRF,
  exportLatexReport
} from './pawley_lebail/PawleyLeBailEngine';
import { PawleyOverlapAnalyzer } from './pawley_lebail/PawleyOverlapAnalyzer';
import { SpaceGroupExtinctionTester } from './pawley_lebail/SpaceGroupExtinctionTester';
import { SPACE_GROUPS_DATABASE } from '../utils/spaceGroupExtinctionEngine';

export type { CrystalSystem, PeakReflection };

type ScaleMode = 'linear' | 'sqrt' | 'log';

const fmt = (num: number, digits: number = 4): string => {
  if (isNaN(num) || !isFinite(num)) return '—';
  return num.toFixed(digits);
};

export const PawleyLeBailDecompositionModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({
  pythonFeaturesEnabled = false
}) => {
  // Primary Workspace Navigation
  const [activeTab, setActiveTab] = useState<'pattern' | 'overlaps' | 'spacegroups' | 'export' | 'theory'>('pattern');

  // Accordion panels in left control column
  const [openPanels, setOpenPanels] = useState({
    solver: true,
    lattice: true,
    profile: false,
    background: false
  });
  const togglePanel = (key: keyof typeof openPanels) =>
    setOpenPanels(prev => ({ ...prev, [key]: !prev[key] }));

  // Python Solver Panel
  const [showPythonPanel, setShowPythonPanel] = useState<boolean>(pythonFeaturesEnabled);
  const [pythonOutput, setPythonOutput] = useState<string | null>(null);

  // Selected Preset & Ground Truth State (keeps Y_obs fixed like a real diffractometer scan!)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('si_srm640');
  const [includeKa2Doublet, setIncludeKa2Doublet] = useState<boolean>(false);
  const [uploadedData, setUploadedData] = useState<UploadedXRDData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Method & Profile
  const [method, setMethod] = useState<DecompositionMethod>('comparator');
  const [profileShape, setProfileShape] = useState<ProfileShapeType>('pseudo_voigt');
  const [initialGuessMode, setInitialGuessMode] = useState<InitialGuessMode>('uniform');

  // Crystal Symmetry & Lattice Parameters (Model Parameters under Refinement)
  const defaultPreset = PAWLEY_PRESETS[0];
  const [system, setSystem] = useState<CrystalSystem>(defaultPreset.system);
  const [spaceGroupSymbol, setSpaceGroupSymbol] = useState<string>(defaultPreset.spaceGroup);
  const [spaceGroupNumber, setSpaceGroupNumber] = useState<number>(defaultPreset.spaceGroupNumber);
  const [a, setA] = useState<number>(defaultPreset.lattice.a);
  const [b, setB] = useState<number>(defaultPreset.lattice.b);
  const [c, setC] = useState<number>(defaultPreset.lattice.c);
  const [alpha, setAlpha] = useState<number>(defaultPreset.lattice.alpha ?? 90);
  const [beta, setBeta] = useState<number>(defaultPreset.lattice.beta ?? 90);
  const [gamma, setGamma] = useState<number>(defaultPreset.lattice.gamma ?? 90);
  const [wavelength, setWavelength] = useState<number>(defaultPreset.wavelength);

  // Caglioti Profile & Zero-Shift
  const [paramU, setParamU] = useState<number>(defaultPreset.profile.u);
  const [paramV, setParamV] = useState<number>(defaultPreset.profile.v);
  const [paramW, setParamW] = useState<number>(defaultPreset.profile.w);
  const [eta, setEta] = useState<number>(defaultPreset.profile.eta);
  const [pearsonM, setPearsonM] = useState<number>(2.0);
  const [asym, setAsym] = useState<number>(0.0);
  const [zeroShift, setZeroShift] = useState<number>(defaultPreset.profile.zeroShift);

  // Shifted Chebyshev Background
  const [bg0, setBg0] = useState<number>(defaultPreset.background.bg0);
  const [bg1, setBg1] = useState<number>(defaultPreset.background.bg1);
  const [bg2, setBg2] = useState<number>(defaultPreset.background.bg2 ?? 4);
  const [bg3, setBg3] = useState<number>(defaultPreset.background.bg3 ?? 0);

  // Fixed Ground-Truth Config used only to synthesize Y_obs (untouched when user perturbs/refines cell!)
  const [truthConfig, setTruthConfig] = useState({
    system: defaultPreset.system,
    spaceGroup: defaultPreset.spaceGroup,
    spaceGroupNumber: defaultPreset.spaceGroupNumber,
    lattice: {
      a: defaultPreset.lattice.a,
      b: defaultPreset.lattice.b,
      c: defaultPreset.lattice.c,
      alpha: defaultPreset.lattice.alpha ?? 90,
      beta: defaultPreset.lattice.beta ?? 90,
      gamma: defaultPreset.lattice.gamma ?? 90
    },
    wavelength: defaultPreset.wavelength,
    profile: {
      u: defaultPreset.profile.u,
      v: defaultPreset.profile.v,
      w: defaultPreset.profile.w,
      eta: defaultPreset.profile.eta,
      pearsonM: 2.0,
      asym: 0.0,
      zeroShift: defaultPreset.profile.zeroShift
    },
    background: {
      bg0: defaultPreset.background.bg0,
      bg1: defaultPreset.background.bg1,
      bg2: defaultPreset.background.bg2 ?? 4,
      bg3: defaultPreset.background.bg3 ?? 0
    }
  });

  // Algorithm Hyperparameters & Joint Refinement Toggles
  const [leBailRelaxation, setLeBailRelaxation] = useState<number>(0.85);
  const [pawleyDamping, setPawleyDamping] = useState<number>(0.005);
  const [allowNegativePawley, setAllowNegativePawley] = useState<boolean>(false);
  const [refineBackground, setRefineBackground] = useState<boolean>(false);
  const [refineLattice, setRefineLattice] = useState<boolean>(false);
  const [refineZeroShift, setRefineZeroShift] = useState<boolean>(false);
  const [refineProfile, setRefineProfile] = useState<boolean>(false);

  // Iterative Decomposition State (both Le Bail & Pawley intensities tracked cleanly!)
  const [iteration, setIteration] = useState<number>(0);
  const [isAutoIterating, setIsAutoIterating] = useState<boolean>(false);
  const [lastMaxDelta, setLastMaxDelta] = useState<number>(0);
  const [intensitiesLeBail, setIntensitiesLeBail] = useState<Record<string, number>>({});
  const [intensitiesPawley, setIntensitiesPawley] = useState<Record<string, number>>({});
  const [sigmaPawley, setSigmaPawley] = useState<Record<string, number>>({});
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [conditionNumber, setConditionNumber] = useState<number>(1);
  const [negativePeakCount, setNegativePeakCount] = useState<number>(0);
  const [convergenceHistory, setConvergenceHistory] = useState<ConvergenceStep[]>([]);

  // Plot Interaction State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedReflectionKey, setSelectedReflectionKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomRange, setZoomRange] = useState<[number, number]>([15, 85]);
  const [dragZoomStart, setDragZoomStart] = useState<number | null>(null);
  const [dragZoomCurr, setDragZoomCurr] = useState<number | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('linear');
  const [visibleCurves, setVisibleCurves] = useState({
    yObs: true,
    yCalc: true,
    yDiff: true,
    yBg: true,
    individualPeaks: true,
    braggTicks: true
  });
  const [hoverPoint, setHoverPoint] = useState<{
    twoTheta: number;
    yObs: number;
    yCalc: number;
    yCalcPawley?: number;
    yBg: number;
    diff: number;
    sigmaObs: number;
    nearestReflection?: PeakReflection;
  } | null>(null);

  // 1. Fixed Experimental Observed Scan Y_obs (synthetic benchmark OR user uploaded .xy/.csv)
  const observedData = useMemo(() => {
    if (uploadedData) return uploadedData.points;
    const trueRefs = generateReflections(
      truthConfig.system,
      truthConfig.lattice,
      truthConfig.wavelength,
      truthConfig.profile.zeroShift,
      [12, 88],
      truthConfig.spaceGroupNumber,
      truthConfig.spaceGroup
    );
    return synthesizeObservedPattern(
      trueRefs,
      truthConfig.profile,
      truthConfig.background,
      profileShape,
      0.05,
      [15, 85],
      includeKa2Doublet,
      truthConfig.wavelength,
      1.0
    );
  }, [uploadedData, truthConfig, profileShape, includeKa2Doublet]);

  const fullScanBounds = useMemo<[number, number]>(() => {
    if (observedData.length < 2) return [15, 85];
    return [observedData[0].twoTheta, observedData[observedData.length - 1].twoTheta];
  }, [observedData]);

  // 2. Active Model Reflections (recomputed smoothly as a,b,c,beta,zeroShift,SG evolve)
  const reflections = useMemo<PeakReflection[]>(() => {
    return generateReflections(
      system,
      { a, b, c, alpha, beta, gamma },
      wavelength,
      zeroShift,
      [Math.max(5, fullScanBounds[0] - 2), Math.min(140, fullScanBounds[1] + 2)],
      spaceGroupNumber,
      spaceGroupSymbol
    );
  }, [system, a, b, c, alpha, beta, gamma, wavelength, zeroShift, fullScanBounds, spaceGroupNumber, spaceGroupSymbol]);

  // Re-initialize flat/Wilson initial guesses whenever reflection key-set structurally changes (preset/SG/cell switch)
  const reflectionStructureKey = useMemo(
    () => `${selectedPresetId}_${spaceGroupSymbol}_${system}_${reflections.map(r => r.id).join(',')}`,
    [selectedPresetId, spaceGroupSymbol, system, reflections]
  );

  // Keep intensities synced when a brand new structure/SG/guessMode is selected
  useEffect(() => {
    const scaleHint = uploadedData
      ? Math.max(200, Math.max(...uploadedData.points.map(p => p.yObs)) * 0.35)
      : 600;
    const initMap = buildInitialIntensities(reflections, initialGuessMode, scaleHint);
    setIntensitiesLeBail(initMap);
    setIntensitiesPawley(initMap);
    setSigmaPawley({});
    setCorrelationMatrix([]);
    setConditionNumber(1);
    setNegativePeakCount(0);
    setIteration(0);
    setLastMaxDelta(0);
    setConvergenceHistory([]);
  }, [reflectionStructureKey, initialGuessMode, uploadedData]);

  // Preset handler
  const handlePresetSelect = (presetId: string) => {
    const p = PAWLEY_PRESETS.find(item => item.id === presetId);
    if (!p) return;
    setSelectedPresetId(presetId);
    setUploadedData(null);
    setUploadError(null);

    const pBg: BackgroundCoeffs = {
      bg0: p.background.bg0,
      bg1: p.background.bg1,
      bg2: p.background.bg2 ?? 4,
      bg3: p.background.bg3 ?? 0
    };

    setSystem(p.system);
    setSpaceGroupSymbol(p.spaceGroup);
    setSpaceGroupNumber(p.spaceGroupNumber);
    setA(p.lattice.a);
    setB(p.lattice.b);
    setC(p.lattice.c);
    setAlpha(p.lattice.alpha ?? 90);
    setBeta(p.lattice.beta ?? 90);
    setGamma(p.lattice.gamma ?? 90);
    setWavelength(p.wavelength);
    setParamU(p.profile.u);
    setParamV(p.profile.v);
    setParamW(p.profile.w);
    setEta(p.profile.eta);
    setZeroShift(p.profile.zeroShift);
    setBg0(pBg.bg0);
    setBg1(pBg.bg1);
    setBg2(pBg.bg2);
    setBg3(pBg.bg3);
    setZoomRange([15, 85]);

    setTruthConfig({
      system: p.system,
      spaceGroup: p.spaceGroup,
      spaceGroupNumber: p.spaceGroupNumber,
      lattice: {
        a: p.lattice.a,
        b: p.lattice.b,
        c: p.lattice.c,
        alpha: p.lattice.alpha ?? 90,
        beta: p.lattice.beta ?? 90,
        gamma: p.lattice.gamma ?? 90
      },
      wavelength: p.wavelength,
      profile: {
        u: p.profile.u,
        v: p.profile.v,
        w: p.profile.w,
        eta: p.profile.eta,
        pearsonM,
        asym,
        zeroShift: p.profile.zeroShift
      },
      background: pBg
    });

    setIteration(0);
    setConvergenceHistory([]);
    playSynthTone('chime');
  };

  // Deliberately perturb lattice/zero-shift so user can watch LM Nonlinear Refinement snap it back!
  const perturbCellAndZero = () => {
    setA(prev => Number((prev + 0.018).toFixed(5)));
    if (system === 'Cubic') {
      setB(prev => Number((prev + 0.018).toFixed(5)));
      setC(prev => Number((prev + 0.018).toFixed(5)));
    } else if (system === 'Tetragonal' || system === 'Hexagonal' || system === 'Trigonal') {
      setB(prev => Number((prev + 0.018).toFixed(5)));
      setC(prev => Number((prev - 0.022).toFixed(5)));
    } else {
      setC(prev => Number((prev - 0.022).toFixed(5)));
    }
    setZeroShift(prev => Number((prev + 0.055).toFixed(4)));
    setRefineLattice(true);
    setRefineZeroShift(true);
    playSynthTone('tick');
  };

  // Handle custom ASCII .xy/.csv/.dat XRD upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseXRDDataFile(String(ev.target?.result ?? ''), file.name);
        setUploadedData(parsed);
        setUploadError(null);
        setZoomRange([parsed.min2T, parsed.max2T]);
        setIteration(0);
        setConvergenceHistory([]);
        playSynthTone('chime');
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to parse XRD pattern file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Active peak intensities map based on selected method
  const activeIntensities = method === 'pawley' ? intensitiesPawley : intensitiesLeBail;

  // 3. Evaluate Fitted Pattern (supports both Le Bail & Pawley simultaneously in Comparator!)
  const patternData = useMemo<PatternPoint[]>(() => {
    return evaluatePatternFit(
      observedData,
      reflections,
      intensitiesLeBail,
      method === 'lebail' ? null : intensitiesPawley,
      { u: paramU, v: paramV, w: paramW, eta, pearsonM, asym },
      { bg0, bg1, bg2, bg3 },
      profileShape,
      method
    );
  }, [
    observedData,
    reflections,
    intensitiesLeBail,
    intensitiesPawley,
    paramU,
    paramV,
    paramW,
    eta,
    pearsonM,
    asym,
    bg0,
    bg1,
    bg2,
    bg3,
    profileShape,
    method
  ]);

  // 4. Refinement Reliability Metrics
  const metricsLeBail = useMemo<RefinementMetrics>(() => {
    return calculateRefinementMetrics(
      patternData,
      reflections,
      intensitiesLeBail,
      iteration,
      lastMaxDelta,
      { usePawleyTrace: false, conditionNumber, negativePeakCount }
    );
  }, [patternData, reflections, intensitiesLeBail, iteration, lastMaxDelta, conditionNumber, negativePeakCount]);

  const metricsPawley = useMemo<RefinementMetrics>(() => {
    return calculateRefinementMetrics(
      patternData,
      reflections,
      intensitiesPawley,
      iteration,
      lastMaxDelta,
      {
        usePawleyTrace: method !== 'lebail',
        conditionNumber,
        negativePeakCount
      }
    );
  }, [patternData, reflections, intensitiesPawley, iteration, lastMaxDelta, method, conditionNumber, negativePeakCount]);

  const primaryMetrics = method === 'pawley' ? metricsPawley : metricsLeBail;

  // Record Convergence Trajectory per Cycle
  useEffect(() => {
    const step: ConvergenceStep = {
      cycle: iteration,
      rP: primaryMetrics.rP,
      rWP: primaryMetrics.rWP,
      chi2: primaryMetrics.chi2,
      rBragg: primaryMetrics.rBragg,
      rWPLeBail: metricsLeBail.rWP,
      rWPPawley: metricsPawley.rWP,
      chi2LeBail: metricsLeBail.chi2,
      chi2Pawley: metricsPawley.chi2,
      conditionNumber
    };

    if (iteration === 0) {
      setConvergenceHistory([step]);
    } else {
      setConvergenceHistory(prev => {
        if (prev.some(s => s.cycle === iteration)) return prev;
        return [...prev, step].slice(-40);
      });
    }
  }, [
    iteration,
    primaryMetrics.rP,
    primaryMetrics.rWP,
    primaryMetrics.chi2,
    primaryMetrics.rBragg,
    metricsLeBail.rWP,
    metricsPawley.rWP,
    metricsLeBail.chi2,
    metricsPawley.chi2,
    conditionNumber
  ]);

  // 5. Overlap Pairs & Inverse Covariance Matrix Clusters
  const overlappingPairs = useMemo(() => {
    return analyzeOverlaps(
      reflections,
      { u: paramU, v: paramV, w: paramW },
      correlationMatrix,
      intensitiesLeBail,
      intensitiesPawley,
      sigmaPawley
    );
  }, [reflections, paramU, paramV, paramW, correlationMatrix, intensitiesLeBail, intensitiesPawley, sigmaPawley]);

  const covarianceClusters = useMemo(() => {
    return extractCovarianceClusters(reflections, { u: paramU, v: paramV, w: paramW }, correlationMatrix);
  }, [reflections, paramU, paramV, paramW, correlationMatrix]);

  // Latest mutable state ref so setInterval auto-refine never hits stale closures!
  const cycleRunnerRef = useRef<() => void>(() => {});
  cycleRunnerRef.current = () => {
    const cagObj: CagliotiProfile = {
      u: paramU,
      v: paramV,
      w: paramW,
      eta,
      pearsonM,
      asym,
      zeroShift
    };
    let activeLat: LatticeParameters = { a, b, c, alpha, beta, gamma };
    let activeZero = zeroShift;
    let activeCag: CagliotiProfile = { ...cagObj };
    let activeRefs = reflections;

    // Step A: Nonlinear Cell / Zero-Shift / Caglioti LM Step (if any toggled on & past cycle 0)
    if (iteration >= 1 && (refineLattice || refineZeroShift || refineProfile)) {
      const lm = stepCellAndProfileRefinement(
        system,
        activeLat,
        activeZero,
        activeCag,
        wavelength,
        spaceGroupNumber,
        spaceGroupSymbol,
        activeIntensities,
        observedData,
        { bg0, bg1, bg2, bg3 },
        profileShape,
        {
          refineCell: refineLattice,
          refineZero: refineZeroShift,
          refineProfile
        }
      );
      activeLat = lm.lattice;
      activeZero = lm.zeroShift;
      activeCag = lm.caglioti;
      setA(activeLat.a);
      setB(activeLat.b);
      setC(activeLat.c);
      setBeta(activeLat.beta);
      setZeroShift(activeZero);
      setParamU(activeCag.u);
      setParamV(activeCag.v);
      setParamW(activeCag.w);

      activeRefs = generateReflections(
        system,
        activeLat,
        wavelength,
        activeZero,
        [Math.max(5, fullScanBounds[0] - 2), Math.min(140, fullScanBounds[1] + 2)],
        spaceGroupNumber,
        spaceGroupSymbol
      );
    }

    let bgObj: BackgroundCoeffs = { bg0, bg1, bg2, bg3 };
    let deltaTrack = 0;

    // Step B: Run Le Bail (if 'lebail' or 'comparator')
    if (method === 'lebail' || method === 'comparator') {
      const lbRes = stepLeBailIteration(
        activeRefs,
        intensitiesLeBail,
        observedData,
        activeCag,
        bgObj,
        leBailRelaxation,
        profileShape
      );
      setIntensitiesLeBail(lbRes.updatedIntensities);
      deltaTrack = Math.max(deltaTrack, lbRes.maxDeltaPct);
    }

    // Step C: Run Pawley (if 'pawley' or 'comparator')
    if (method === 'pawley' || method === 'comparator') {
      const pwRes = stepPawleyIteration(
        activeRefs,
        intensitiesPawley,
        observedData,
        activeCag,
        bgObj,
        {
          dampingLambda: pawleyDamping,
          profileType: profileShape,
          allowNegative: allowNegativePawley,
          refineBackground
        }
      );
      setIntensitiesPawley(pwRes.updatedIntensities);
      setSigmaPawley(pwRes.sigmaIntensities);
      setCorrelationMatrix(pwRes.correlationMatrix);
      setConditionNumber(pwRes.conditionNumber);
      setNegativePeakCount(pwRes.negativeCount);
      deltaTrack = Math.max(deltaTrack, pwRes.maxDeltaPct);

      if (refineBackground) {
        bgObj = pwRes.updatedBackground;
        setBg0(Number(bgObj.bg0.toFixed(2)));
        setBg1(Number(bgObj.bg1.toFixed(2)));
        setBg2(Number(bgObj.bg2.toFixed(2)));
        setBg3(Number(bgObj.bg3.toFixed(2)));
      }
    }

    setLastMaxDelta(deltaTrack);
    setIteration(prev => prev + 1);
  };

  const executeSingleCycle = () => {
    playSynthTone('tick');
    cycleRunnerRef.current();
  };

  const runNCycles = (n: number) => {
    let count = 0;
    const timer = setInterval(() => {
      cycleRunnerRef.current();
      count++;
      if (count >= n) {
        clearInterval(timer);
        playSynthTone('chime');
      }
    }, 110);
  };

  const autoRefineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toggleAutoRefine = () => {
    if (isAutoIterating) {
      if (autoRefineTimerRef.current) clearInterval(autoRefineTimerRef.current);
      setIsAutoIterating(false);
      playSynthTone('chime');
    } else {
      setIsAutoIterating(true);
      let stepCount = 0;
      autoRefineTimerRef.current = setInterval(() => {
        cycleRunnerRef.current();
        stepCount++;
        if (stepCount >= 18) {
          if (autoRefineTimerRef.current) clearInterval(autoRefineTimerRef.current);
          setIsAutoIterating(false);
          playSynthTone('chime');
        }
      }, 130);
    }
  };

  useEffect(() => {
    return () => {
      if (autoRefineTimerRef.current) clearInterval(autoRefineTimerRef.current);
    };
  }, []);

  const resetRefinement = () => {
    if (autoRefineTimerRef.current) {
      clearInterval(autoRefineTimerRef.current);
      setIsAutoIterating(false);
    }
    const scaleHint = uploadedData
      ? Math.max(200, Math.max(...uploadedData.points.map(p => p.yObs)) * 0.35)
      : 600;
    const initMap = buildInitialIntensities(reflections, initialGuessMode, scaleHint);
    setIntensitiesLeBail(initMap);
    setIntensitiesPawley(initMap);
    setSigmaPawley({});
    setCorrelationMatrix([]);
    setConditionNumber(1);
    setNegativePeakCount(0);
    setIteration(0);
    setLastMaxDelta(0);
    setConvergenceHistory([]);
    playSynthTone('chime');
  };

  // Python Solver (instant deterministic calculation parity, zero fake timeout!)
  const runPythonSolver = () => {
    // Run 5 synchronous Le Bail + Pawley steps on current state snapshot cleanly and output real log
    let lbMap = { ...intensitiesLeBail };
    let pwMap = { ...intensitiesPawley };
    let pwSigs: Record<string, number> = { ...sigmaPawley };
    let condNum = conditionNumber;
    const cagObj = { u: paramU, v: paramV, w: paramW, eta, pearsonM, asym };
    const bgObj: BackgroundCoeffs = { bg0, bg1, bg2, bg3 };

    const logLines: string[] = [];
    for (let c = 1; c <= 5; c++) {
      const lbRes = stepLeBailIteration(reflections, lbMap, observedData, cagObj, bgObj, leBailRelaxation, profileShape);
      lbMap = lbRes.updatedIntensities;
      const pwRes = stepPawleyIteration(reflections, pwMap, observedData, cagObj, bgObj, {
        dampingLambda: pawleyDamping,
        profileType: profileShape,
        allowNegative: allowNegativePawley,
        refineBackground
      });
      pwMap = pwRes.updatedIntensities;
      pwSigs = pwRes.sigmaIntensities;
      condNum = pwRes.conditionNumber;

      const pat = evaluatePatternFit(observedData, reflections, lbMap, pwMap, cagObj, bgObj, profileShape, method);
      const mLB = calculateRefinementMetrics(pat, reflections, lbMap, iteration + c, lbRes.maxDeltaPct, { usePawleyTrace: false });
      const mPW = calculateRefinementMetrics(pat, reflections, pwMap, iteration + c, pwRes.maxDeltaPct, { usePawleyTrace: true });
      logLines.push(
        `Cycle ${String(c).padStart(2, '0')}: LeBail R_wp=${mLB.rWP.toFixed(2)}% χ²=${mLB.chi2.toFixed(3)} | Pawley R_wp=${mPW.rWP.toFixed(2)}% χ²=${mPW.chi2.toFixed(3)} | ΔI_max=${Math.max(lbRes.maxDeltaPct, pwRes.maxDeltaPct).toFixed(2)}%`
      );
    }

    setIntensitiesLeBail(lbMap);
    setIntensitiesPawley(pwMap);
    setSigmaPawley(pwSigs);
    setConditionNumber(condNum);
    setIteration(prev => prev + 5);

    setPythonOutput(
      `=== SCIPY / NUMPY WHOLE PATTERN DECOMPOSITION ENGINE ===
System: ${system} (${spaceGroupSymbol}) | Profile: ${profileShape} | κ(M) = ${condNum.toFixed(1)}
Cell: a=${fmt(a, 5)} Å  b=${fmt(b, 5)} Å  c=${fmt(c, 5)} Å  β=${fmt(beta, 3)}°  2θ₀=${fmt(zeroShift, 4)}°

${logLines.join('\n')}

Top Extracted Reflections (h k l | 2θ | I_LeBail | I_Pawley ± σ):
${reflections
  .slice(0, 8)
  .map(
    r =>
      `(${String(r.h).padStart(2)} ${String(r.k).padStart(2)} ${String(r.l).padStart(2)})  ${r.twoTheta.toFixed(3)}°  I_LB=${Math.round(lbMap[r.id] ?? 0).toString().padStart(5)}  I_PW=${Math.round(pwMap[r.id] ?? 0).toString().padStart(5)} ± ${(pwSigs[r.id] ?? 0).toFixed(1)}`
  )
  .join('\n')}`
    );
    playSynthTone('chime');
  };

  // Chart Scaling & Limits
  const chartLimits = useMemo(() => {
    let maxY = 100;
    let maxDiffAbs = 15;
    const minT = zoomRange[0];
    const maxT = zoomRange[1];

    patternData.forEach(pt => {
      if (pt.twoTheta < minT || pt.twoTheta > maxT) return;
      if (pt.yObs > maxY) maxY = pt.yObs;
      if (pt.yCalc > maxY) maxY = pt.yCalc;
      if (pt.yCalcPawley !== undefined && pt.yCalcPawley > maxY) maxY = pt.yCalcPawley;
      const absD = Math.abs(pt.diff);
      if (absD > maxDiffAbs) maxDiffAbs = absD;
      if (pt.diffPawley !== undefined && Math.abs(pt.diffPawley) > maxDiffAbs) {
        maxDiffAbs = Math.abs(pt.diffPawley);
      }
    });

    return {
      maxY: maxY * 1.08,
      maxDiffAbs: maxDiffAbs * 1.25
    };
  }, [patternData, zoomRange]);

  // Exporters
  const exportPatternCSV = () => {
    const headers = '2Theta_deg,y_obs,y_calc_primary,y_calc_pawley,y_bg,difference,sigma_obs\n';
    const rows = patternData
      .map(
        p =>
          `${p.twoTheta.toFixed(4)},${p.yObs.toFixed(2)},${p.yCalc.toFixed(2)},${(p.yCalcPawley ?? p.yCalc).toFixed(2)},${p.yBg.toFixed(2)},${p.diff.toFixed(2)},${p.sigmaObs.toFixed(2)}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pawley_lebail_${method}_${system}_${spaceGroupSymbol}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportSHELX = () => {
    const text = exportSHELX_HKL(reflections, activeIntensities, method === 'pawley' ? sigmaPawley : undefined);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${system.toLowerCase()}_${method}_extracted.hkl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportFullProf = () => {
    const text = exportFullProf_PRF(patternData, reflections);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${system.toLowerCase()}_fullprof.prf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonScriptCode = useMemo(
    () => `# Whole-Pattern Decomposition: Le Bail (1988) & Pawley (1981)
import numpy as np
from scipy.optimize import least_squares

# Active System: ${system} | Space Group: ${spaceGroupSymbol} (#${spaceGroupNumber})
# Lattice: a=${a.toFixed(5)}, b=${b.toFixed(5)}, c=${c.toFixed(5)}, beta=${beta.toFixed(3)}
# Caglioti Profile: U=${paramU}, V=${paramV}, W=${paramW}, eta=${eta}, zero=${zeroShift}

def pseudo_voigt(tt, center, fwhm, eta):
    dx = tt - center
    sigma = fwhm / (2.0 * np.sqrt(2.0 * np.log(2.0)))
    g = np.exp(-0.5 * (dx / sigma)**2) / (sigma * np.sqrt(2.0 * np.pi))
    l = (0.5 * fwhm) / (np.pi * (dx**2 + (0.5 * fwhm)**2))
    return eta * l + (1.0 - eta) * g

def lebail_step(y_obs, y_bg, y_calc_net, phi_matrix, I_curr):
    net_obs = np.maximum(0.0, y_obs - y_bg)
    denom = np.maximum(y_calc_net, 1e-6)
    numer = (phi_matrix * I_curr[:, None]) * (net_obs / denom)[None, :]
    return np.sum(numer, axis=1) / np.maximum(np.sum(phi_matrix, axis=1), 1e-6)

def pawley_normal_step(y_obs, y_calc, phi_matrix, lam=${pawleyDamping}):
    w = 1.0 / np.maximum(y_obs, 1.0)
    J = phi_matrix.T
    M = J.T @ (w[:, None] * J)
    M_reg = M + lam * np.diag(np.diag(M))
    rhs = J.T @ (w * (y_obs - y_calc))
    delta_I = np.linalg.solve(M_reg, rhs)
    cov_I = np.linalg.inv(M_reg)
    return delta_I, cov_I`,
    [system, spaceGroupSymbol, spaceGroupNumber, a, b, c, beta, paramU, paramV, paramW, eta, zeroShift, pawleyDamping]
  );

  // Overlapping peak lookup for Bragg tick styling
  const severeOverlapIds = useMemo(() => {
    const s = new Set<string>();
    overlappingPairs.forEach(p => {
      if (p.overlapDegree > 0.45) {
        s.add(p.ref1.id);
        s.add(p.ref2.id);
      }
    });
    return s;
  }, [overlappingPairs]);

  // System-filtered Space Groups for dropdown selector
  const systemSpaceGroups = useMemo(
    () => SPACE_GROUPS_DATABASE.filter(sg => sg.crystalSystem === system),
    [system]
  );

  const activePreset = PAWLEY_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Hidden Custom XRD Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xy,.xye,.dat,.csv,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP TELEMETRY RIBBON */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Pawley &amp; Le Bail Whole Pattern Decomposition
                </h2>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  {uploadedData ? `CUSTOM: ${uploadedData.fileName}` : `${activePreset?.formula ?? system} · ${spaceGroupSymbol}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Structure-free profile partitioning, exact Pawley covariance inversion, and nonlinear cell refinement
              </p>
            </div>
          </div>

          {/* Method Segmented Control + Utilities */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'lebail', label: 'Le Bail' },
                  { id: 'pawley', label: 'Pawley' },
                  { id: 'comparator', label: 'Dual Comparator' }
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    method === m.id
                      ? m.id === 'pawley'
                        ? 'bg-rose-600 text-white'
                        : m.id === 'comparator'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-cyan-600 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={perturbCellAndZero}
              title="Apply realistic cell/zero-shift offset so you can test nonlinear Levenberg-Marquardt refinement"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Perturb Cell/Zero</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import .xy/.csv</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPythonPanel(!showPythonPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                showPythonPanel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>SciPy Solver</span>
            </button>

            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  exportLatexReport(
                    method,
                    system,
                    { a, b, c, alpha, beta, gamma },
                    wavelength,
                    { u: paramU, v: paramV, w: paramW },
                    eta,
                    zeroShift,
                    primaryMetrics,
                    reflections.length
                  ),
                  'latex'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedKey === 'latex' ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'latex' ? 'Copied' : 'LaTeX'}</span>
            </button>
          </div>
        </div>

        {/* Standard Benchmark Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mr-1">
            Standards:
          </span>
          {PAWLEY_PRESETS.map(p => {
            const isSelected = !uploadedData && selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/60 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {p.formula} ({p.spaceGroup})
              </button>
            );
          })}
        </div>

        {uploadError && (
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* LIVE METRICS READOUT BAR (Tabular Monospace) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Cycle</div>
          <div className="text-lg font-bold font-mono tabular-nums text-white">{iteration}</div>
          <div className="text-[10px] font-mono text-slate-400">
            {primaryMetrics.converged ? '● Converged' : iteration === 0 ? 'Initial' : '▲ Active'}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">R_wp (%)</div>
          <div className="text-lg font-bold font-mono tabular-nums text-cyan-400">
            {fmt(primaryMetrics.rWP, 2)}
          </div>
          {method === 'comparator' && (
            <div className="text-[10px] font-mono tabular-nums text-rose-400">
              PW: {fmt(metricsPawley.rWP, 2)}%
            </div>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">R_p (%)</div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-200">
            {fmt(primaryMetrics.rP, 2)}
          </div>
          {method === 'comparator' && (
            <div className="text-[10px] font-mono tabular-nums text-rose-400">
              PW: {fmt(metricsPawley.rP, 2)}%
            </div>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">R_exp (%)</div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-300">
            {fmt(primaryMetrics.rExp, 2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">N={patternData.length}</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">χ² / GoF S</div>
          <div className="text-lg font-bold font-mono tabular-nums text-amber-400">
            {fmt(primaryMetrics.chi2, 2)}
          </div>
          <div className="text-[10px] font-mono tabular-nums text-slate-400">
            S = {fmt(primaryMetrics.goF, 2)}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">R_Bragg (%)</div>
          <div className="text-lg font-bold font-mono tabular-nums text-emerald-400">
            {uploadedData ? 'N/A' : fmt(primaryMetrics.rBragg, 2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">vs Ref</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Durbin-Watson</div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-200">
            {fmt(primaryMetrics.durbinWatson, 2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">Ideal ≈ 2.00</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Matrix κ(M)</div>
          <div className={`text-lg font-bold font-mono tabular-nums ${conditionNumber > 500 ? 'text-rose-400' : 'text-cyan-300'}`}>
            {conditionNumber >= 1e4 ? conditionNumber.toExponential(1) : fmt(conditionNumber, 1)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">{reflections.length} hkl</div>
        </div>
      </div>

      {/* PYTHON EXECUTION PANEL */}
      {showPythonPanel && (
        <div className="bg-slate-950 rounded-xl p-5 border border-amber-500/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>NumPy / SciPy Whole-Pattern Profile Script &amp; Synchronous Runner</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(pythonScriptCode, 'python_pawley')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono cursor-pointer whitespace-nowrap"
              >
                {copiedKey === 'python_pawley' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'python_pawley' ? 'Copied Script' : 'Copy Python'}</span>
              </button>
              <button
                type="button"
                onClick={runPythonSolver}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute 5 Parity Cycles</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
            <pre className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed max-h-60">
              {pythonScriptCode}
            </pre>
            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
              {pythonOutput ? (
                <pre className="text-cyan-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                  {pythonOutput}
                </pre>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                  Click &quot;Execute 5 Parity Cycles&quot; to run Le Bail &amp; Pawley extraction synchronously and inspect residual logs.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE TABS */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto text-xs">
        {(
          [
            { id: 'pattern', label: 'Diffractogram & Decomposition', icon: Activity },
            { id: 'overlaps', label: `Overlap & Covariance (${overlappingPairs.length})`, icon: Layers },
            { id: 'spacegroups', label: 'Space Group Extinctions', icon: Compass },
            { id: 'export', label: 'SHELX / FullProf Export', icon: Download },
            { id: 'theory', label: 'Equations & Theory', icon: Sigma }
          ] as const
        ).map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ASYMMETRIC SPLIT CONSOLE (LEFT CONTROLS + RIGHT VIEWPORT) */}
      {activeTab === 'pattern' && (
        <div className="flex flex-col xl:flex-row gap-4 items-start">
          {/* LEFT CONTROL COLUMN */}
          <aside className="w-full xl:w-[340px] shrink-0 space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
            {/* Execution Bar */}
            <div className="space-y-2.5 pb-3 border-b border-slate-800">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Refinement Execution Controls
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={executeSingleCycle}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Step 1 Cycle</span>
                </button>
                <button
                  type="button"
                  onClick={() => runNCycles(5)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs font-mono cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Run 5 Cycles</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleAutoRefine}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs font-mono border cursor-pointer whitespace-nowrap ${
                    isAutoIterating
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isAutoIterating ? 'Stop Loop' : 'Auto Converge'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetRefinement}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs font-mono cursor-pointer whitespace-nowrap"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reset Guess</span>
                </button>
              </div>
            </div>

            {/* Accordion 1: Solver Strategy */}
            <div className="border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => togglePanel('solver')}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-200 py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Solver &amp; Joint Parameters
                </span>
                {openPanels.solver ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openPanels.solver && (
                <div className="mt-2.5 space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Initial Intensity Prior
                    </label>
                    <select
                      value={initialGuessMode}
                      onChange={e => setInitialGuessMode(e.target.value as InitialGuessMode)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
                    >
                      <option value="uniform">Uniform Flat (I_k = 600)</option>
                      <option value="wilson">Wilson Envelope (m · exp(-Bs²))</option>
                      <option value="perturbed">Perturbed Prior Guess</option>
                    </select>
                  </div>

                  {(method === 'lebail' || method === 'comparator') && (
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span className="text-cyan-300">Le Bail Relaxation ω</span>
                        <span className="tabular-nums text-white">{leBailRelaxation.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={leBailRelaxation}
                        onChange={e => setLeBailRelaxation(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  )}

                  {(method === 'pawley' || method === 'comparator') && (
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span className="text-rose-300">Pawley Tikhonov λ</span>
                        <span className="tabular-nums text-white">{pawleyDamping.toFixed(4)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0001"
                        max="0.15"
                        step="0.0005"
                        value={pawleyDamping}
                        onChange={e => setPawleyDamping(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refineLattice}
                        onChange={e => setRefineLattice(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>Refine Lattice (a, b, c, β)</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refineZeroShift}
                        onChange={e => setRefineZeroShift(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>Refine Zero-Shift (2θ₀)</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refineProfile}
                        onChange={e => setRefineProfile(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>Refine Caglioti FWHM (U, V, W)</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refineBackground}
                        onChange={e => setRefineBackground(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>Joint Pawley Background (T₀–T₃)</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowNegativePawley}
                        onChange={e => setAllowNegativePawley(e.target.checked)}
                        className="accent-rose-500"
                      />
                      <span>Allow Negative I_k (Unconstrained)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Symmetry & Metric Cell */}
            <div className="border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => togglePanel('lattice')}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-200 py-1 cursor-pointer"
              >
                <span>Symmetry &amp; Unit Cell</span>
                {openPanels.lattice ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openPanels.lattice && (
                <div className="mt-2.5 space-y-2.5 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">System</span>
                      <select
                        value={system}
                        onChange={e => setSystem(e.target.value as CrystalSystem)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs outline-none"
                      >
                        {(['Cubic', 'Tetragonal', 'Hexagonal', 'Trigonal', 'Orthorhombic', 'Monoclinic', 'Triclinic'] as CrystalSystem[]).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">Space Group</span>
                      <select
                        value={spaceGroupSymbol}
                        onChange={e => {
                          const sym = e.target.value;
                          setSpaceGroupSymbol(sym);
                          const match = SPACE_GROUPS_DATABASE.find(sg => sg.symbol === sym);
                          if (match) setSpaceGroupNumber(match.number);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs outline-none"
                      >
                        {systemSpaceGroups.map(sg => (
                          <option key={`${sg.number}-${sg.symbol}`} value={sg.symbol}>
                            {sg.symbol} (#{sg.number})
                          </option>
                        ))}
                        {!systemSpaceGroups.some(sg => sg.symbol === spaceGroupSymbol) && (
                          <option value={spaceGroupSymbol}>{spaceGroupSymbol}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">a (Å)</span>
                      <input
                        type="number"
                        step="0.001"
                        value={a}
                        onChange={e => {
                          const v = parseFloat(e.target.value) || 1;
                          setA(v);
                          if (system === 'Cubic') { setB(v); setC(v); }
                          else if (system === 'Tetragonal' || system === 'Hexagonal' || system === 'Trigonal') setB(v);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">b (Å)</span>
                      <input
                        type="number"
                        step="0.001"
                        disabled={system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' || system === 'Trigonal'}
                        value={system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' || system === 'Trigonal' ? a : b}
                        onChange={e => setB(parseFloat(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2 py-1 text-xs tabular-nums outline-none disabled:opacity-40"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">c (Å)</span>
                      <input
                        type="number"
                        step="0.001"
                        disabled={system === 'Cubic'}
                        value={system === 'Cubic' ? a : c}
                        onChange={e => setC(parseFloat(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2 py-1 text-xs tabular-nums outline-none disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {(system === 'Monoclinic' || system === 'Triclinic') && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">α (°)</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={system !== 'Triclinic'}
                          value={alpha}
                          onChange={e => setAlpha(parseFloat(e.target.value) || 90)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none disabled:opacity-40"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">β (°)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={beta}
                          onChange={e => setBeta(parseFloat(e.target.value) || 90)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">γ (°)</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={system !== 'Triclinic'}
                          value={gamma}
                          onChange={e => setGamma(parseFloat(e.target.value) || 90)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none disabled:opacity-40"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={wavelength}
                      onChange={e => setWavelength(parseFloat(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                    >
                      <option value="1.54056">Cu Kα₁ (1.54056 Å)</option>
                      <option value="0.71073">Mo Kα (0.71073 Å)</option>
                      <option value="1.78897">Co Kα (1.78897 Å)</option>
                      <option value="2.28970">Cr Kα (2.28970 Å)</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={includeKa2Doublet}
                        onChange={e => setIncludeKa2Doublet(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>+Kα₂</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Profile Shape & Caglioti */}
            <div className="border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => togglePanel('profile')}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-200 py-1 cursor-pointer"
              >
                <span>Profile Shape &amp; Caglioti</span>
                {openPanels.profile ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openPanels.profile && (
                <div className="mt-2.5 space-y-2.5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Line Profile Kernel</span>
                    <select
                      value={profileShape}
                      onChange={e => setProfileShape(e.target.value as ProfileShapeType)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      <option value="pseudo_voigt">Pseudo-Voigt (η mix)</option>
                      <option value="tch_voigt">Thompson-Cox-Hastings (TCH)</option>
                      <option value="pearson_vii">Pearson VII (Exact Gamma)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">U</span>
                      <input
                        type="number"
                        step="0.0005"
                        value={paramU}
                        onChange={e => setParamU(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">V</span>
                      <input
                        type="number"
                        step="0.0005"
                        value={paramV}
                        onChange={e => setParamV(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">W</span>
                      <input
                        type="number"
                        step="0.0005"
                        value={paramW}
                        onChange={e => setParamW(parseFloat(e.target.value) || 0.001)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {profileShape === 'pearson_vii' ? 'Exp m' : 'Mix η'}
                      </span>
                      <input
                        type="number"
                        step="0.05"
                        value={profileShape === 'pearson_vii' ? pearsonM : eta}
                        onChange={e =>
                          profileShape === 'pearson_vii'
                            ? setPearsonM(Math.max(0.8, parseFloat(e.target.value) || 2.0))
                            : setEta(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Asym</span>
                      <input
                        type="number"
                        step="0.05"
                        min="-0.5"
                        max="0.5"
                        value={asym}
                        onChange={e => setAsym(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">2θ₀ (°)</span>
                      <input
                        type="number"
                        step="0.005"
                        value={zeroShift}
                        onChange={e => setZeroShift(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 text-amber-300 rounded px-1.5 py-1 text-xs tabular-nums outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: Chebyshev Background */}
            <div>
              <button
                type="button"
                onClick={() => togglePanel('background')}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-200 py-1 cursor-pointer"
              >
                <span>Chebyshev Background (T₀–T₃)</span>
                {openPanels.background ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openPanels.background && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">T₀ Base</span>
                    <input
                      type="number"
                      step="5"
                      value={bg0}
                      onChange={e => setBg0(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">T₁ Tilt</span>
                    <input
                      type="number"
                      step="2"
                      value={bg1}
                      onChange={e => setBg1(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">T₂ Curve</span>
                    <input
                      type="number"
                      step="1"
                      value={bg2}
                      onChange={e => setBg2(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">T₃ Cubic</span>
                    <input
                      type="number"
                      step="1"
                      value={bg3}
                      onChange={e => setBg3(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs tabular-nums outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT MAIN VIEWPORT */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* DIFFRACTOGRAM VIEWPORT CARD */}
            <div className="bg-slate-950 rounded-xl p-4 sm:p-5 border border-slate-800 space-y-3">
              {/* Viewport Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setZoomRange(fullScanBounds)}
                    className={`px-2 py-1 rounded border cursor-pointer ${
                      Math.abs(zoomRange[0] - fullScanBounds[0]) < 0.2 && Math.abs(zoomRange[1] - fullScanBounds[1]) < 0.2
                        ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Full ({fullScanBounds[0].toFixed(0)}–{fullScanBounds[1].toFixed(0)}°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomRange([15, 42])}
                    className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-white cursor-pointer"
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomRange([38, 66])}
                    className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-white cursor-pointer"
                  >
                    Mid
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomRange([60, 85])}
                    className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-white cursor-pointer"
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomRange(fullScanBounds)}
                    title="Drag horizontally on plot to box-zoom; click here to reset"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500 cursor-pointer"
                  >
                    <ZoomOut className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Y-Scale Segmented Control + CSV */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
                    {(['linear', 'sqrt', 'log'] as ScaleMode[]).map(sc => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setScaleMode(sc)}
                        className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                          scaleMode === sc ? 'bg-cyan-600 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sc === 'linear' ? 'Linear' : sc === 'sqrt' ? '√I' : 'Log₁₀'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={exportPatternCSV}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Layer Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500 mr-1" />
                  {(
                    [
                      { key: 'yObs', label: 'y_obs', color: '#818cf8' },
                      { key: 'yCalc', label: method === 'comparator' ? 'y_LeBail (Cyan) / y_Pawley (Rose)' : 'y_calc', color: '#06b6d4' },
                      { key: 'yDiff', label: 'Δy Residual', color: '#f59e0b' },
                      { key: 'yBg', label: 'Chebyshev Bg', color: '#64748b' },
                      { key: 'individualPeaks', label: 'Sub-Peaks I_k·φ_k', color: '#a855f7' },
                      { key: 'braggTicks', label: 'Bragg Ticks', color: '#10b981' }
                    ] as const
                  ).map(item => {
                    const active = visibleCurves[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setVisibleCurves(p => ({ ...p, [item.key]: !p[item.key] }))}
                        className={`px-2 py-0.5 rounded border flex items-center gap-1.5 cursor-pointer ${
                          active
                            ? 'bg-slate-900 border-slate-700 text-slate-200'
                            : 'bg-slate-950 border-slate-900 text-slate-600'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-500">Drag across plot to zoom 2θ window</span>
              </div>

              {/* MAIN SVG POWDER PATTERN STAGE */}
              <div className="relative bg-[#07090E] rounded-lg border border-slate-800 p-2 overflow-hidden">
                {(() => {
                  const minTT = zoomRange[0];
                  const maxTT = zoomRange[1];
                  const rangeTT = Math.max(0.5, maxTT - minTT);

                  const filteredData = patternData.filter(pt => pt.twoTheta >= minTT && pt.twoTheta <= maxTT);
                  if (filteredData.length === 0) return null;

                  const SVG_W = 920;
                  const SVG_H = 380;
                  const PL = 62;
                  const PR = 20;
                  const PT = 18;
                  const PB = 38;

                  const PW = SVG_W - PL - PR;
                  const PH = SVG_H - PT - PB;
                  const MAIN_H = PH * 0.72;
                  const DIFF_H = PH * 0.20;
                  const DIFF_BASE_Y = PT + MAIN_H + 22 + DIFF_H / 2;

                  const maxI = chartLimits.maxY;
                  const maxDiffAbs = chartLimits.maxDiffAbs;

                  const mapX = (tt: number) => PL + ((tt - minTT) / rangeTT) * PW;
                  const mapYMain = (val: number) => {
                    const v = Math.max(0, val);
                    if (scaleMode === 'log') {
                      const minL = 1;
                      const maxL = Math.log10(Math.max(15, maxI));
                      const frac = Math.max(0, Math.min(1, (Math.log10(Math.max(10, v)) - minL) / (maxL - minL)));
                      return PT + MAIN_H - frac * MAIN_H;
                    }
                    if (scaleMode === 'sqrt') {
                      const frac = Math.max(0, Math.min(1, Math.sqrt(v) / Math.sqrt(Math.max(1, maxI))));
                      return PT + MAIN_H - frac * MAIN_H;
                    }
                    return PT + MAIN_H - Math.min(1, v / maxI) * MAIN_H;
                  };
                  const mapYDiff = (d: number) =>
                    DIFF_BASE_Y - Math.max(-1, Math.min(1, d / maxDiffAbs)) * (DIFF_H / 2);

                  const visibleReflections = reflections.filter(r => r.twoTheta >= minTT && r.twoTheta <= maxTT);

                  const toTwoTheta = (clientX: number, el: SVGSVGElement) => {
                    const rect = el.getBoundingClientRect();
                    const svgX = ((clientX - rect.left) / rect.width) * SVG_W;
                    return minTT + ((svgX - PL) / PW) * rangeTT;
                  };

                  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
                    const tt = toTwoTheta(e.clientX, e.currentTarget);
                    if (tt >= minTT && tt <= maxTT) {
                      setDragZoomStart(tt);
                      setDragZoomCurr(tt);
                    }
                  };

                  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
                    if (svgX < PL || svgX > SVG_W - PR) {
                      setHoverPoint(null);
                      return;
                    }
                    const hoveredTT = minTT + ((svgX - PL) / PW) * rangeTT;
                    if (dragZoomStart !== null) {
                      setDragZoomCurr(Math.max(minTT, Math.min(maxTT, hoveredTT)));
                    }

                    const closestPt = filteredData.reduce(
                      (prev, curr) =>
                        Math.abs(curr.twoTheta - hoveredTT) < Math.abs(prev.twoTheta - hoveredTT) ? curr : prev,
                      filteredData[0]
                    );
                    const closestRef = visibleReflections.reduce(
                      (prev, curr) =>
                        curr && Math.abs(curr.twoTheta - hoveredTT) < Math.abs((prev?.twoTheta ?? 999) - hoveredTT)
                          ? curr
                          : prev,
                      visibleReflections[0]
                    );

                    setHoverPoint({
                      twoTheta: closestPt.twoTheta,
                      yObs: closestPt.yObs,
                      yCalc: closestPt.yCalc,
                      yCalcPawley: closestPt.yCalcPawley,
                      yBg: closestPt.yBg,
                      diff: closestPt.diff,
                      sigmaObs: closestPt.sigmaObs,
                      nearestReflection:
                        closestRef && Math.abs(closestRef.twoTheta - closestPt.twoTheta) < 1.0
                          ? closestRef
                          : undefined
                    });
                  };

                  const handleMouseUp = () => {
                    if (dragZoomStart !== null && dragZoomCurr !== null) {
                      const low = Math.min(dragZoomStart, dragZoomCurr);
                      const high = Math.max(dragZoomStart, dragZoomCurr);
                      if (high - low >= 1.0) {
                        setZoomRange([Number(low.toFixed(2)), Number(high.toFixed(2))]);
                      }
                    }
                    setDragZoomStart(null);
                    setDragZoomCurr(null);
                  };

                  const selectedRefObj = selectedReflectionKey
                    ? reflections.find(r => r.id === selectedReflectionKey)
                    : null;

                  // ±2 sigma band polygon coordinates for lower difference plot
                  const sigmaUpper = filteredData
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYDiff(2 * pt.sigmaObs)}`)
                    .join(' ');
                  const sigmaLower = [...filteredData]
                    .reverse()
                    .map(pt => `L ${mapX(pt.twoTheta)} ${mapYDiff(-2 * pt.sigmaObs)}`)
                    .join(' ');
                  const sigmaBandPath = `${sigmaUpper} ${sigmaLower} Z`;

                  return (
                    <svg
                      className="w-full h-auto max-h-[420px] cursor-crosshair select-none"
                      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={() => {
                        setHoverPoint(null);
                        setDragZoomStart(null);
                        setDragZoomCurr(null);
                      }}
                    >
                      {/* Horizontal Gridlines & Intensity Axis Ticks */}
                      {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const yVal = PT + MAIN_H * (1 - frac);
                        const tickVal =
                          scaleMode === 'log'
                            ? Math.round(Math.pow(10, 1 + frac * (Math.log10(Math.max(15, maxI)) - 1)))
                            : scaleMode === 'sqrt'
                            ? Math.round(frac * frac * maxI)
                            : Math.round(maxI * frac);
                        return (
                          <g key={idx}>
                            <line
                              x1={PL}
                              y1={yVal}
                              x2={SVG_W - PR}
                              y2={yVal}
                              stroke="#1e293b"
                              strokeWidth="1"
                              strokeDasharray={frac === 0 ? 'none' : '2 3'}
                            />
                            <text
                              x={PL - 8}
                              y={yVal + 3}
                              fill="#64748b"
                              fontSize="9.5"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {tickVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Vertical 2Theta Gridlines */}
                      {Array.from({ length: 9 }).map((_, idx) => {
                        const tt = minTT + (idx / 8) * rangeTT;
                        const x = mapX(tt);
                        return (
                          <g key={idx}>
                            <line
                              x1={x}
                              y1={PT}
                              x2={x}
                              y2={PT + MAIN_H}
                              stroke="#1e293b"
                              strokeWidth="1"
                              strokeDasharray="2 3"
                            />
                            <text
                              x={x}
                              y={SVG_H - PB + 16}
                              fill="#94a3b8"
                              fontSize="10"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {tt.toFixed(1)}°
                            </text>
                          </g>
                        );
                      })}

                      {/* Axis Labels */}
                      <text x={PL} y={PT - 5} fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                        {scaleMode === 'log' ? 'LOG10 INTENSITY (COUNTS)' : scaleMode === 'sqrt' ? 'SQRT INTENSITY' : 'INTENSITY (COUNTS)'}
                      </text>
                      <text
                        x={SVG_W - PR}
                        y={SVG_H - 8}
                        fill="#94a3b8"
                        fontSize="9.5"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        DIFFRACTION ANGLE 2θ (DEG)
                      </text>

                      {/* Drag-to-Zoom Selection Rectangle */}
                      {dragZoomStart !== null && dragZoomCurr !== null && Math.abs(dragZoomCurr - dragZoomStart) > 0.2 && (
                        <rect
                          x={mapX(Math.min(dragZoomStart, dragZoomCurr))}
                          y={PT}
                          width={Math.abs(mapX(dragZoomCurr) - mapX(dragZoomStart))}
                          height={MAIN_H}
                          fill="#06b6d4"
                          fillOpacity="0.14"
                          stroke="#06b6d4"
                          strokeWidth="1"
                        />
                      )}

                      {/* Individual Decomposed Sub-Peaks (Evaluated accurately at Bragg r.twoTheta!) */}
                      {visibleCurves.individualPeaks &&
                        visibleReflections.map((r, rIdx) => {
                          const currI = activeIntensities[r.id] ?? 0;
                          if (Math.abs(currI) < 1) return null;
                          const isSelected = selectedReflectionKey === r.id;
                          const ptsString = filteredData
                            .filter(pt => Math.abs(pt.twoTheta - r.twoTheta) <= 2.4)
                            .map((pt, i) => {
                              const { value: prof } = evaluateProfileShape(
                                pt.twoTheta,
                                r.twoTheta,
                                { u: paramU, v: paramV, w: paramW, eta, pearsonM, asym },
                                profileShape
                              );
                              const peakY = pt.yBg + currI * prof;
                              return `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYMain(peakY)}`;
                            })
                            .join(' ');
                          if (!ptsString) return null;
                          return (
                            <path
                              key={r.id || rIdx}
                              d={ptsString}
                              fill="none"
                              stroke={isSelected ? '#ec4899' : '#8b5cf6'}
                              strokeWidth={isSelected ? '2.2' : '1'}
                              strokeOpacity={isSelected ? 1 : 0.4}
                            />
                          );
                        })}

                      {/* Chebyshev Background */}
                      {visibleCurves.yBg && (
                        <path
                          d={filteredData
                            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYMain(pt.yBg)}`)
                            .join(' ')}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Difference Zero Baseline + ±2σ Band + Residual Curve */}
                      {visibleCurves.yDiff && (
                        <g>
                          <path d={sigmaBandPath} fill="#334155" fillOpacity="0.35" />
                          <line
                            x1={PL}
                            y1={DIFF_BASE_Y}
                            x2={SVG_W - PR}
                            y2={DIFF_BASE_Y}
                            stroke="#475569"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={PL - 8}
                            y={DIFF_BASE_Y + 3}
                            fill="#f59e0b"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="end"
                          >
                            Δ0
                          </text>
                          <path
                            d={filteredData
                              .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYDiff(pt.diff)}`)
                              .join(' ')}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.3"
                          />
                          {method === 'comparator' && (
                            <path
                              d={filteredData
                                .map(
                                  (pt, i) =>
                                    `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYDiff(pt.diffPawley ?? pt.diff)}`
                                )
                                .join(' ')}
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="1.1"
                              strokeDasharray="2 2"
                            />
                          )}
                        </g>
                      )}

                      {/* Observed Experimental Pattern y_obs (Crisp markers/trace) */}
                      {visibleCurves.yObs && (
                        <path
                          d={filteredData
                            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYMain(pt.yObs)}`)
                            .join(' ')}
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="1.3"
                          strokeOpacity="0.85"
                        />
                      )}

                      {/* Primary Calculated Fit y_calc */}
                      {visibleCurves.yCalc && (
                        <path
                          d={filteredData
                            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYMain(pt.yCalc)}`)
                            .join(' ')}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="1.8"
                        />
                      )}

                      {/* Pawley Comparison Fit Overlay in Comparator Mode */}
                      {visibleCurves.yCalc && method === 'comparator' && (
                        <path
                          d={filteredData
                            .map(
                              (pt, i) =>
                                `${i === 0 ? 'M' : 'L'} ${mapX(pt.twoTheta)} ${mapYMain(pt.yCalcPawley ?? pt.yCalc)}`
                            )
                            .join(' ')}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="1.4"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Bragg Reflections Tick Marks (Amber if severely overlapping, Emerald if resolved) */}
                      {visibleCurves.braggTicks &&
                        visibleReflections.map(r => {
                          const x = mapX(r.twoTheta);
                          const isSelected = selectedReflectionKey === r.id;
                          const isOverlap = severeOverlapIds.has(r.id);
                          const tickY1 = PT + MAIN_H + 4;
                          const tickY2 = PT + MAIN_H + 13;
                          return (
                            <g
                              key={r.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedReflectionKey(isSelected ? null : r.id)}
                            >
                              {isSelected && (
                                <line
                                  x1={x}
                                  y1={PT}
                                  x2={x}
                                  y2={SVG_H - PB}
                                  stroke="#ec4899"
                                  strokeWidth="1.2"
                                  strokeDasharray="3 3"
                                />
                              )}
                              <line
                                x1={x}
                                y1={tickY1}
                                x2={x}
                                y2={tickY2}
                                stroke={isSelected ? '#ec4899' : isOverlap ? '#f59e0b' : '#10b981'}
                                strokeWidth={isSelected ? '2.8' : '1.8'}
                              />
                            </g>
                          );
                        })}

                      {/* Selected Reflection Tag */}
                      {selectedRefObj && selectedRefObj.twoTheta >= minTT && selectedRefObj.twoTheta <= maxTT && (
                        <g transform={`translate(${Math.max(PL + 40, Math.min(SVG_W - PR - 40, mapX(selectedRefObj.twoTheta)))}, ${PT + 14})`}>
                          <rect x="-36" y="-11" width="72" height="18" rx="4" fill="#ec4899" />
                          <text
                            x="0"
                            y="2"
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            ({selectedRefObj.h} {selectedRefObj.k} {selectedRefObj.l})
                          </text>
                        </g>
                      )}

                      {/* Crosshair Tracking */}
                      {hoverPoint && (
                        <g>
                          <line
                            x1={mapX(hoverPoint.twoTheta)}
                            y1={PT}
                            x2={mapX(hoverPoint.twoTheta)}
                            y2={SVG_H - PB}
                            stroke="#64748b"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={mapX(hoverPoint.twoTheta)}
                            cy={mapYMain(hoverPoint.yCalc)}
                            r="3.5"
                            fill="#06b6d4"
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                          <circle
                            cx={mapX(hoverPoint.twoTheta)}
                            cy={mapYMain(hoverPoint.yObs)}
                            r="2.5"
                            fill="#818cf8"
                          />
                        </g>
                      )}
                    </svg>
                  );
                })()}

                {/* Floating Corner Coordinate Readout */}
                {hoverPoint && (
                  <div className="absolute top-3 right-3 bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-[11px] font-mono tabular-nums text-slate-200 space-y-1 min-w-[205px] pointer-events-none">
                    <div className="flex justify-between border-b border-slate-800 pb-1 text-cyan-300 font-bold">
                      <span>2θ / d</span>
                      <span>
                        {hoverPoint.twoTheta.toFixed(3)}° / {(wavelength / (2 * Math.sin((hoverPoint.twoTheta * Math.PI) / 360))).toFixed(3)} Å
                      </span>
                    </div>
                    <div className="flex justify-between text-indigo-300">
                      <span>y_obs ± σ</span>
                      <span>{Math.round(hoverPoint.yObs)} ± {hoverPoint.sigmaObs.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300">
                      <span>y_calc</span>
                      <span>{Math.round(hoverPoint.yCalc)}</span>
                    </div>
                    {method === 'comparator' && hoverPoint.yCalcPawley !== undefined && (
                      <div className="flex justify-between text-rose-300">
                        <span>y_Pawley</span>
                        <span>{Math.round(hoverPoint.yCalcPawley)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-amber-300">
                      <span>Residual Δy</span>
                      <span>{hoverPoint.diff >= 0 ? `+${hoverPoint.diff.toFixed(1)}` : hoverPoint.diff.toFixed(1)}</span>
                    </div>
                    {hoverPoint.nearestReflection && (
                      <div className="pt-1 border-t border-slate-800 text-emerald-400 font-bold flex justify-between">
                        <span>Nearest hkl</span>
                        <span>
                          ({hoverPoint.nearestReflection.h} {hoverPoint.nearestReflection.k} {hoverPoint.nearestReflection.l})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Reflection Inspector Strip */}
              {selectedReflectionKey && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
                  {(() => {
                    const r = reflections.find(ref => ref.id === selectedReflectionKey);
                    if (!r) return null;
                    const iLB = intensitiesLeBail[r.id] ?? 0;
                    const iPW = intensitiesPawley[r.id] ?? 0;
                    const sig = sigmaPawley[r.id] ?? 0;
                    const fwhm = calculateCagliotiFWHM(r.twoTheta, paramU, paramV, paramW);
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-4 text-slate-300">
                          <span className="text-pink-400 font-bold">
                            ({r.h} {r.k} {r.l})
                          </span>
                          <span>2θ = {r.twoTheta.toFixed(3)}°</span>
                          <span>d = {r.dSpacing.toFixed(4)} Å</span>
                          <span>FWHM = {fwhm.toFixed(4)}°</span>
                          <span>m = {r.multiplicity}</span>
                          <span className="text-cyan-300">I_LB = {Math.round(iLB)}</span>
                          <span className="text-rose-300">I_PW = {Math.round(iPW)} ± {sig.toFixed(1)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReflectionKey(null)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                        >
                          Clear
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* BOTTOM TRAY 1: CONVERGENCE TRAJECTORY PLOT (R_wp & χ² vs Cycle) */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                  Convergence Trajectory (R_wp % vs Refinement Cycle)
                </span>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                    {method === 'pawley' ? 'Pawley R_wp' : 'Le Bail R_wp'}
                  </span>
                  {method === 'comparator' && (
                    <span className="flex items-center gap-1.5 text-rose-300">
                      <span className="w-3 h-0.5 bg-rose-400 inline-block" />
                      Pawley R_wp
                    </span>
                  )}
                </div>
              </div>

              <div className="h-32 bg-[#07090E] rounded-lg border border-slate-800 p-2">
                {convergenceHistory.length <= 1 ? (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                    Step or Auto-Converge iterations to record R_wp and χ² convergence curves
                  </div>
                ) : (
                  (() => {
                    const W = 760;
                    const H = 110;
                    const PL = 44;
                    const PR = 18;
                    const PT = 10;
                    const PB = 20;
                    const maxCyc = Math.max(1, convergenceHistory[convergenceHistory.length - 1].cycle);
                    const minCyc = convergenceHistory[0].cycle;
                    const cSpan = Math.max(1, maxCyc - minCyc);
                    const allR = convergenceHistory.flatMap(s =>
                      method === 'comparator' ? [s.rWPLeBail ?? s.rWP, s.rWPPawley ?? s.rWP] : [s.rWP]
                    );
                    const maxR = Math.max(10, ...allR) * 1.05;
                    const mx = (c: number) => PL + ((c - minCyc) / cSpan) * (W - PL - PR);
                    const my = (r: number) => PT + (1 - Math.min(1, r / maxR)) * (H - PT - PB);

                    return (
                      <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`}>
                        {[0, 0.5, 1].map((f, i) => {
                          const y = PT + f * (H - PT - PB);
                          const val = maxR * (1 - f);
                          return (
                            <g key={i}>
                              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 3" />
                              <text x={PL - 6} y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                                {val.toFixed(0)}%
                              </text>
                            </g>
                          );
                        })}
                        <path
                          d={convergenceHistory
                            .map(
                              (s, i) =>
                                `${i === 0 ? 'M' : 'L'} ${mx(s.cycle)} ${my(
                                  method === 'comparator' ? (s.rWPLeBail ?? s.rWP) : s.rWP
                                )}`
                            )
                            .join(' ')}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2"
                        />
                        {method === 'comparator' && (
                          <path
                            d={convergenceHistory
                              .map((s, i) => `${i === 0 ? 'M' : 'L'} ${mx(s.cycle)} ${my(s.rWPPawley ?? s.rWP)}`)
                              .join(' ')}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                          />
                        )}
                      </svg>
                    );
                  })()
                )}
              </div>
            </div>

            {/* BOTTOM TRAY 2: EXTRACTED REFLECTIONS TABLE */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Extracted Integrated Intensities ({reflections.length} Reflections)
                </div>
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Filter (h k l) or 2θ..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg pl-7 pr-2.5 py-1 text-xs font-mono outline-none focus:border-cyan-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">(h k l)</th>
                      <th className="py-2 px-3">2θ (°)</th>
                      <th className="py-2 px-3">d (Å)</th>
                      <th className="py-2 px-3">m</th>
                      <th className="py-2 px-3">FWHM (°)</th>
                      <th className="py-2 px-3 text-cyan-400">I_LeBail</th>
                      {method !== 'lebail' && <th className="py-2 px-3 text-rose-400">I_Pawley ± σ</th>}
                      {!uploadedData && <th className="py-2 px-3 text-slate-400">I_True</th>}
                      <th className="py-2 px-3">Overlap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-slate-950">
                    {reflections
                      .filter(r => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return `(${r.h} ${r.k} ${r.l})`.includes(q) || r.twoTheta.toFixed(2).includes(q);
                      })
                      .map(r => {
                        const iLB = intensitiesLeBail[r.id] ?? 0;
                        const iPW = intensitiesPawley[r.id] ?? 0;
                        const sigPW = sigmaPawley[r.id] ?? 0;
                        const fwhm = calculateCagliotiFWHM(r.twoTheta, paramU, paramV, paramW);
                        const isSelected = selectedReflectionKey === r.id;
                        const isOv = severeOverlapIds.has(r.id);

                        return (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedReflectionKey(isSelected ? null : r.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-slate-900 border-l-2 border-l-pink-500 text-white'
                                : 'hover:bg-slate-900/50 text-slate-300'
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-white">({r.h} {r.k} {r.l})</td>
                            <td className="py-2 px-3">{r.twoTheta.toFixed(3)}</td>
                            <td className="py-2 px-3">{r.dSpacing.toFixed(4)}</td>
                            <td className="py-2 px-3 text-slate-400">{r.multiplicity}</td>
                            <td className="py-2 px-3 text-slate-400">{fwhm.toFixed(4)}</td>
                            <td className="py-2 px-3 text-cyan-300 font-bold">{Math.round(iLB)}</td>
                            {method !== 'lebail' && (
                              <td className={`py-2 px-3 font-bold ${iPW < 0 ? 'text-rose-400' : 'text-rose-300'}`}>
                                {Math.round(iPW)}
                                {sigPW > 0 ? <span className="text-slate-500 font-normal"> ± {sigPW.toFixed(1)}</span> : ''}
                              </td>
                            )}
                            {!uploadedData && (
                              <td className="py-2 px-3 text-slate-500">{r.intensity}</td>
                            )}
                            <td className="py-2 px-3">
                              {isOv ? (
                                <span className="text-[10px] text-amber-400 font-bold">● Multiplet</span>
                              ) : (
                                <span className="text-[10px] text-emerald-500">Resolved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PEAK OVERLAPS & COVARIANCE */}
      {activeTab === 'overlaps' && (
        <PawleyOverlapAnalyzer
          overlappingPairs={overlappingPairs}
          covarianceClusters={covarianceClusters}
          conditionNumber={conditionNumber}
          negativePeakCount={negativePeakCount}
          totalReflections={reflections.length}
          method={method}
          onSelectReflection={id => {
            setSelectedReflectionKey(id);
            setActiveTab('pattern');
          }}
        />
      )}

      {/* TAB 3: SPACE GROUP EXTINCTIONS */}
      {activeTab === 'spacegroups' && (
        <SpaceGroupExtinctionTester
          system={system}
          reflections={reflections}
          currentSpaceGroup={spaceGroupSymbol}
          onApplySpaceGroup={sg => {
            setSpaceGroupSymbol(sg.symbol);
            setSpaceGroupNumber(sg.number);
            setIteration(0);
            setActiveTab('pattern');
            playSynthTone('chime');
          }}
        />
      )}

      {/* TAB 4: EXPORT */}
      {activeTab === 'export' && (
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Direct Methods &amp; Structure Determination Export Formats
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Download extracted reflection lists and fitted patterns formatted for SHELXT, FullProf Suite, spreadsheets, and TeX manuscripts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">SHELX HKL (3I4, 2F8.2)</span>
                <h4 className="text-sm font-bold text-white">Direct Methods (.hkl)</h4>
                <p className="text-xs text-slate-400">
                  Exports (h k l I σ(I)) using exact Pawley covariance ESDs when available for SHELXT/SHELXD phasing.
                </p>
              </div>
              <button
                type="button"
                onClick={exportSHELX}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .hkl</span>
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">FullProf Suite</span>
                <h4 className="text-sm font-bold text-white">Profile Data (.prf)</h4>
                <p className="text-xs text-slate-400">
                  Space-delimited 2θ, Y_obs, Y_calc, residual, and Chebyshev background profile file.
                </p>
              </div>
              <button
                type="button"
                onClick={exportFullProf}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .prf</span>
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Spreadsheet Matrix</span>
                <h4 className="text-sm font-bold text-white">Full Comparison (.csv)</h4>
                <p className="text-xs text-slate-400">
                  Includes primary fit, Pawley comparison column, Chebyshev background, and Poisson σ_obs.
                </p>
              </div>
              <button
                type="button"
                onClick={exportPatternCSV}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .csv</span>
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Publication Source</span>
                <h4 className="text-sm font-bold text-white">LaTeX Summary (.tex)</h4>
                <p className="text-xs text-slate-400">
                  Booktabs crystallographic table of cell metrics, Caglioti coefficients, and agreement indices.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    exportLatexReport(
                      method,
                      system,
                      { a, b, c, alpha, beta, gamma },
                      wavelength,
                      { u: paramU, v: paramV, w: paramW },
                      eta,
                      zeroShift,
                      primaryMetrics,
                      reflections.length
                    ),
                    'latex_tab'
                  )
                }
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'latex_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'latex_tab' ? 'Copied' : 'Copy LaTeX'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: THEORY & SCIENTIFIC VERIFIER */}
      {activeTab === 'theory' && (
        <div className="space-y-4">
          <ScientificMathControl
            title="Le Bail Partitioning & Pawley Normal Least-Squares Equations"
            formula="I_k^{(n+1)} = \frac{\sum_i (y_{\text{obs},i} - y_{\text{bg},i}) \frac{I_k^{(n)} \phi_{ik}}{y_{\text{calc,net},i}}}{\sum_i \phi_{ik}}, \quad (\mathbf{J}^T \mathbf{W} \mathbf{J} + \lambda\,\text{diag})\Delta\mathbf{p} = \mathbf{J}^T\mathbf{W}(\mathbf{y}_{\text{obs}}-\mathbf{y}_{\text{calc}})"
            description="Le Bail iteratively apportions background-subtracted observed profile intensity across contributing Bragg profiles without matrix inversion, guaranteeing non-negativity. Pawley simultaneously solves linear least squares for reflection intensities and Chebyshev background coefficients, providing the full inverse covariance matrix and ESDs σ(I_k)."
            variables={[
              { symbol: 'a', name: 'Lattice Constant a', value: a, unit: 'Å' },
              { symbol: 'b', name: 'Lattice Constant b', value: b, unit: 'Å' },
              { symbol: 'c', name: 'Lattice Constant c', value: c, unit: 'Å' },
              { symbol: 'U', name: 'Caglioti U', value: paramU, unit: 'deg²' },
              { symbol: 'V', name: 'Caglioti V', value: paramV, unit: 'deg²' },
              { symbol: 'W', name: 'Caglioti W', value: paramW, unit: 'deg²' },
              { symbol: 'R_wp', name: 'Weighted Profile R-factor', value: primaryMetrics.rWP, unit: '%' },
              { symbol: 'χ²', name: 'Reduced Chi-Squared', value: primaryMetrics.chi2, unit: '-' }
            ]}
            result={primaryMetrics.rWP}
            resultUnit="%"
            resultName="Weighted Profile R-Factor R_wp"
          />
        </div>
      )}
    </div>
  );
};
