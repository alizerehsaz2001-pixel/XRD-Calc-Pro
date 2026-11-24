import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Info,
  Lock,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Unlock,
  Upload,
} from 'lucide-react';
import { useCustomMaterialApply } from './CustomMaterialContext';
import {
  AnodeKey,
  BackgroundConfig,
  CAGLIOTI_INSTRUMENT_PRESETS,
  DeconvolutionLaw,
  FWHM_SCENARIO_PRESETS,
  FWHM_XRAY_ANODES,
  FitPeakParam,
  InstrumentOpticsConfig,
  ModelBenchmarkRow,
  PEAK_PALETTE,
  PeakUncertainty,
  ProfileModelType,
  RawXYPoint,
  autoDetectPeaks,
  benchmarkAllProfileModels,
  buildProfileFitReport,
  etaToMatchedPearsonM,
  evaluateFullProfile,
  exportFitToCSV,
  fitMultiPeakLM,
  generateScenarioDataset,
  getActiveWavelengthA,
  parseExperimentalXY,
  sliceDataToWindow,
} from '../utils/fwhmProfileEngine';
import { FWHMInteractivePlot, FWHMPlotOverlays } from './fwhm/FWHMInteractivePlot';

export interface RefPeakItem {
  theta: number;
  label: string;
  hkl: string;
  relIntensity: number;
}

export interface RefMaterialDetail {
  id: string;
  name: string;
  category: 'NIST Standards' | 'Metals' | 'Semiconductors' | 'Oxides & Ceramics';
  formula: string;
  spaceGroup: string;
  crystalSystem: string;
  latticeParams: string;
  description: string;
  peaks: RefPeakItem[];
}

export const REFERENCE_MATERIALS_CATALOG: RefMaterialDetail[] = [
  {
    id: 'Silicon',
    name: 'Silicon (NIST SRM 640f)',
    category: 'NIST Standards',
    formula: 'Si',
    spaceGroup: 'Fd-3m (227)',
    crystalSystem: 'Cubic',
    latticeParams: 'a = 5.43119 Å',
    description: 'NIST primary line-position calibration standard.',
    peaks: [
      { theta: 28.442, label: 'Si (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 47.302, label: 'Si (220)', hkl: '(220)', relIntensity: 55 },
      { theta: 56.122, label: 'Si (311)', hkl: '(311)', relIntensity: 30 },
      { theta: 69.130, label: 'Si (400)', hkl: '(400)', relIntensity: 6 },
    ],
  },
  {
    id: 'LaB6',
    name: 'Lanthanum Hexaboride (SRM 660c)',
    category: 'NIST Standards',
    formula: 'LaB₆',
    spaceGroup: 'Pm-3m (221)',
    crystalSystem: 'Cubic',
    latticeParams: 'a = 4.15692 Å',
    description: 'NIST standard for instrumental resolution (β_inst) calibration.',
    peaks: [
      { theta: 21.362, label: 'LaB₆ (100)', hkl: '(100)', relIntensity: 100 },
      { theta: 30.386, label: 'LaB₆ (110)', hkl: '(110)', relIntensity: 50 },
      { theta: 37.441, label: 'LaB₆ (111)', hkl: '(111)', relIntensity: 25 },
      { theta: 43.511, label: 'LaB₆ (200)', hkl: '(200)', relIntensity: 20 },
    ],
  },
  {
    id: 'TiO2_Anatase',
    name: 'Anatase Titanium Dioxide',
    category: 'Oxides & Ceramics',
    formula: 'TiO₂',
    spaceGroup: 'I4₁/amd (141)',
    crystalSystem: 'Tetragonal',
    latticeParams: 'a = 3.785 Å, c = 9.514 Å',
    description: 'Anatase polymorph photocatalyst powder reference.',
    peaks: [
      { theta: 25.281, label: 'Anatase (101)', hkl: '(101)', relIntensity: 100 },
      { theta: 37.800, label: 'Anatase (004)', hkl: '(004)', relIntensity: 20 },
      { theta: 48.049, label: 'Anatase (200)', hkl: '(200)', relIntensity: 35 },
    ],
  },
  {
    id: 'ZnO',
    name: 'Zinc Oxide (Wurtzite)',
    category: 'Oxides & Ceramics',
    formula: 'ZnO',
    spaceGroup: 'P6₃mc (186)',
    crystalSystem: 'Hexagonal',
    latticeParams: 'a = 3.249 Å, c = 5.206 Å',
    description: 'Hexagonal wurtzite ZnO triplet reference.',
    peaks: [
      { theta: 31.769, label: 'ZnO (100)', hkl: '(100)', relIntensity: 57 },
      { theta: 34.421, label: 'ZnO (002)', hkl: '(002)', relIntensity: 44 },
      { theta: 36.252, label: 'ZnO (101)', hkl: '(101)', relIntensity: 100 },
    ],
  },
  {
    id: 'Copper',
    name: 'Copper Metal (FCC)',
    category: 'Metals',
    formula: 'Cu',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic FCC',
    latticeParams: 'a = 3.6149 Å',
    description: 'Face-centered cubic polycrystalline copper standard.',
    peaks: [
      { theta: 43.297, label: 'Cu (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 50.433, label: 'Cu (200)', hkl: '(200)', relIntensity: 46 },
      { theta: 74.130, label: 'Cu (220)', hkl: '(220)', relIntensity: 20 },
    ],
  },
  {
    id: 'Quartz',
    name: 'α-Quartz Silica',
    category: 'Oxides & Ceramics',
    formula: 'SiO₂',
    spaceGroup: 'P3₂21 (154)',
    crystalSystem: 'Trigonal',
    latticeParams: 'a = 4.913 Å, c = 5.405 Å',
    description: 'Trigonal mineral silica reference.',
    peaks: [
      { theta: 20.855, label: 'Quartz (100)', hkl: '(100)', relIntensity: 22 },
      { theta: 26.643, label: 'Quartz (101)', hkl: '(101)', relIntensity: 100 },
      { theta: 50.138, label: 'Quartz (112)', hkl: '(112)', relIntensity: 14 },
    ],
  },
];

interface WorkbenchSnapshot {
  model: ProfileModelType;
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  optics: InstrumentOpticsConfig;
}

const PROFILE_MODELS: ProfileModelType[] = [
  'Gaussian',
  'Lorentzian',
  'Pseudo-Voigt',
  'Split Pseudo-Voigt',
  'Pearson VII',
];

const MAX_HISTORY = 25;

function makePeakId() {
  return `pk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function buildInitialState() {
  const preset = FWHM_SCENARIO_PRESETS[0];
  const gen = generateScenarioDataset(preset);
  const fitted = fitMultiPeakLM({
    data: gen.data,
    peaks: gen.initialPeaks,
    background: gen.background,
    model: gen.model,
    optics: gen.optics,
  });
  return {
    presetId: preset.id,
    datasetName: preset.name,
    data: gen.data,
    model: gen.model,
    peaks: fitted.peaks,
    background: fitted.background,
    optics: gen.optics,
    uncertainties: fitted.uncertainties,
    converged: fitted.stats.converged,
    iterations: fitted.stats.iterations,
    maxParamCorrelation: fitted.stats.maxParamCorrelation,
  };
}

export const FWHMModule: React.FC = () => {
  const initial = useMemo(() => buildInitialState(), []);

  const [activeTab, setActiveTab] = useState<'workbench' | 'benchmark' | 'io'>('workbench');
  const [leftPanelTab, setLeftPanelTab] = useState<'peaks' | 'optics' | 'presets'>('peaks');

  const [datasetName, setDatasetName] = useState<string>(initial.datasetName);
  const [activePresetId, setActivePresetId] = useState<string | null>(initial.presetId);
  const [data, setData] = useState<RawXYPoint[]>(initial.data);
  const [fitWindow, setFitWindow] = useState<[number, number] | null>(null);

  const [model, setModel] = useState<ProfileModelType>(initial.model);
  const [peaks, setPeaks] = useState<FitPeakParam[]>(initial.peaks);
  const [background, setBackground] = useState<BackgroundConfig>(initial.background);
  const [optics, setOptics] = useState<InstrumentOpticsConfig>(initial.optics);
  const [uncertainties, setUncertainties] = useState<Record<string, PeakUncertainty>>(initial.uncertainties);
  const [fitMeta, setFitMeta] = useState<{
    converged: boolean;
    iterations: number;
    maxParamCorrelation: number;
    lastRanAt: string | null;
  }>({
    converged: initial.converged,
    iterations: initial.iterations,
    maxParamCorrelation: initial.maxParamCorrelation,
    lastRanAt: `Converged in ${initial.iterations} LM iterations`,
  });

  const [selectedPeakId, setSelectedPeakId] = useState<string | null>(initial.peaks[0]?.id ?? null);
  const [benchmarkRows, setBenchmarkRows] = useState<ModelBenchmarkRow[] | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Import panel state
  const [rawPasteText, setRawPasteText] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [detectMaxPeaks, setDetectMaxPeaks] = useState<number>(4);
  const [detectProminence, setDetectProminence] = useState<number>(8);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Undo / Redo History
  const [historyPast, setHistoryPast] = useState<WorkbenchSnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<WorkbenchSnapshot[]>([]);
  const lastSnapTimeRef = useRef<number>(0);

  // Plot visual overlays
  const [overlays, setOverlays] = useState<FWHMPlotOverlays>({
    showComponents: true,
    showBackground: true,
    showFwhmCaliper: true,
    showFwtmCaliper: false,
    showIntegralBox: false,
    showKa2Trace: false,
    showRachinger: false,
    netIntensity: false,
    yScale: 'linear',
    subPlot: 'residuals',
  });

  const pushHistory = (coalesce = false) => {
    const now = Date.now();
    if (coalesce && now - lastSnapTimeRef.current < 450) return;
    lastSnapTimeRef.current = now;
    const snap: WorkbenchSnapshot = {
      model,
      peaks: peaks.map((p) => ({ ...p })),
      background: { ...background },
      optics: { ...optics },
    };
    setHistoryPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), snap]);
    setHistoryFuture([]);
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const prev = historyPast[historyPast.length - 1];
    const current: WorkbenchSnapshot = {
      model,
      peaks: peaks.map((p) => ({ ...p })),
      background: { ...background },
      optics: { ...optics },
    };
    setHistoryFuture((fut) => [current, ...fut.slice(0, MAX_HISTORY - 1)]);
    setHistoryPast((past) => past.slice(0, -1));
    setModel(prev.model);
    setPeaks(prev.peaks);
    setBackground(prev.background);
    setOptics(prev.optics);
    setUncertainties({});
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const current: WorkbenchSnapshot = {
      model,
      peaks: peaks.map((p) => ({ ...p })),
      background: { ...background },
      optics: { ...optics },
    };
    setHistoryPast((past) => [...past.slice(-(MAX_HISTORY - 1)), current]);
    setHistoryFuture((fut) => fut.slice(1));
    setModel(next.model);
    setPeaks(next.peaks);
    setBackground(next.background);
    setOptics(next.optics);
    setUncertainties({});
  };

  // Seamless integration with Custom Material Studio
  useCustomMaterialApply('fwhm', (mat) => {
    const topPeaks = mat.peaks.slice(0, 4);
    if (topPeaks.length === 0) return;
    const minT = Math.max(5, Math.min(...topPeaks.map((p) => p.twoTheta)) - 2.5);
    const maxT = Math.min(170, Math.max(...topPeaks.map((p) => p.twoTheta)) + 2.5);
    const stepDeg = Math.max(0.01, Number(((maxT - minT) / 360).toFixed(3)));
    const customPreset = {
      id: `custom_${mat.id}`,
      name: `${mat.name} (${mat.formula})`,
      subtitle: 'Custom material profile',
      materialTag: mat.crystalSystem,
      recommendedModel: 'Pseudo-Voigt' as ProfileModelType,
      optics: { anodeId: 'CuKa1' as AnodeKey, customWavelengthA: mat.wavelength || 1.540598 },
      background: { order: 1 as const, b0: 120, b1: -10, b2: 0 },
      truePeaks: topPeaks.map((p) => ({
        label: `(${p.h}${p.k}${p.l})`,
        enabled: true,
        center: Number(p.twoTheta.toFixed(3)),
        amplitude: Math.max(100, Math.round(p.intensity)),
        fwhm: Math.max(0.08, Number((p.fwhm || 0.28).toFixed(3))),
        eta: mat.etaMix ?? 0.45,
        pearsonM: 2.2,
        asymmetry: 1.0,
      })),
      initialPeaks: topPeaks.map((p) => ({
        label: `(${p.h}${p.k}${p.l})`,
        enabled: true,
        center: Number((p.twoTheta - 0.05).toFixed(3)),
        amplitude: Math.max(80, Math.round(p.intensity * 0.85)),
        fwhm: Math.max(0.12, Number(((p.fwhm || 0.28) * 1.2).toFixed(3))),
        eta: 0.4,
        pearsonM: 2.0,
        asymmetry: 1.0,
      })),
      xMin: minT,
      xMax: maxT,
      stepDeg,
      noiseScale: 0.8,
      seed: 777,
    };
    const gen = generateScenarioDataset(customPreset);
    const fitted = fitMultiPeakLM({
      data: gen.data,
      peaks: gen.initialPeaks,
      background: gen.background,
      model: gen.model,
      optics: gen.optics,
    });
    setDatasetName(customPreset.name);
    setActivePresetId(null);
    setData(gen.data);
    setFitWindow(null);
    setModel(gen.model);
    setPeaks(fitted.peaks);
    setBackground(fitted.background);
    setOptics(gen.optics);
    setUncertainties(fitted.uncertainties);
    setSelectedPeakId(fitted.peaks[0]?.id ?? null);
    setBenchmarkRows(null);
    setFitMeta({
      converged: fitted.stats.converged,
      iterations: fitted.stats.iterations,
      maxParamCorrelation: fitted.stats.maxParamCorrelation,
      lastRanAt: `Fitted ${mat.formula} in ${fitted.stats.iterations} LM iterations`,
    });
  });

  // Active data slice (full scan or cropped regional fitting window)
  const activeData = useMemo(() => sliceDataToWindow(data, fitWindow), [data, fitWindow]);

  // Live Full Profile Evaluation
  const evaluated = useMemo(
    () =>
      evaluateFullProfile({
        data: activeData,
        peaks,
        background,
        model,
        optics,
        uncertainties,
        converged: fitMeta.converged,
        iterations: fitMeta.iterations,
        maxParamCorrelation: fitMeta.maxParamCorrelation,
      }),
    [
      activeData,
      peaks,
      background,
      model,
      optics,
      uncertainties,
      fitMeta.converged,
      fitMeta.iterations,
      fitMeta.maxParamCorrelation,
    ]
  );

  const metricsById = useMemo(() => {
    const map = new Map<string, (typeof evaluated.peakMetrics)[number]>();
    evaluated.peakMetrics.forEach((m) => map.set(m.peak.id, m));
    return map;
  }, [evaluated.peakMetrics]);

  const { lambda1A } = getActiveWavelengthA(optics);
  const xMinData = activeData.length > 0 ? activeData[0].x : 10;
  const xMaxData = activeData.length > 0 ? activeData[activeData.length - 1].x : 80;

  // Actions
  const handleRunLMFit = (
    overrideModel?: ProfileModelType,
    overridePeaks?: FitPeakParam[],
    overrideOptics?: InstrumentOpticsConfig,
    overrideData?: RawXYPoint[]
  ) => {
    pushHistory(false);
    const targetModel = overrideModel ?? model;
    const targetOptics = overrideOptics ?? optics;
    const targetData = overrideData ?? activeData;
    const basePeaks = overridePeaks ?? peaks;
    const targetPeaks =
      overrideModel === 'Pearson VII' && model !== 'Pearson VII'
        ? basePeaks.map((p) => ({ ...p, pearsonM: etaToMatchedPearsonM(p.eta) }))
        : basePeaks;

    const res = fitMultiPeakLM({
      data: targetData,
      peaks: targetPeaks,
      background,
      model: targetModel,
      optics: targetOptics,
    });
    setModel(targetModel);
    if (overrideOptics) setOptics(targetOptics);
    setPeaks(res.peaks);
    setBackground(res.background);
    setUncertainties(res.uncertainties);
    setFitMeta({
      converged: res.stats.converged,
      iterations: res.stats.iterations,
      maxParamCorrelation: res.stats.maxParamCorrelation,
      lastRanAt: res.stats.converged
        ? `Converged in ${res.stats.iterations} LM iterations`
        : `Stopped at ${res.stats.iterations} iterations`,
    });
  };

  const handleSetFitWindow = (nextWin: [number, number] | null) => {
    setFitWindow(nextWin);
    setBenchmarkRows(null);
    const nextSlice = sliceDataToWindow(data, nextWin);
    if (nextWin) {
      const inside = peaks.filter((p) => p.center >= nextWin[0] && p.center <= nextWin[1]);
      if (inside.length > 0) {
        handleRunLMFit(model, inside, optics, nextSlice);
      } else {
        handleAutoDetectAndFit(nextSlice);
      }
    } else {
      handleRunLMFit(model, peaks, optics, nextSlice);
    }
  };

  const handleLoadScenario = (presetId: string) => {
    const preset = FWHM_SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    pushHistory(false);
    const gen = generateScenarioDataset(preset);
    const fitted = fitMultiPeakLM({
      data: gen.data,
      peaks: gen.initialPeaks,
      background: gen.background,
      model: gen.model,
      optics: gen.optics,
    });
    setActivePresetId(preset.id);
    setDatasetName(preset.name);
    setData(gen.data);
    setFitWindow(null);
    setModel(gen.model);
    setPeaks(fitted.peaks);
    setBackground(fitted.background);
    setOptics(gen.optics);
    setUncertainties(fitted.uncertainties);
    setSelectedPeakId(fitted.peaks[0]?.id ?? null);
    setBenchmarkRows(null);
    setOverlays((prev) => ({
      ...prev,
      showKa2Trace: gen.optics.includeKa2,
      showRachinger: false,
    }));
    setFitMeta({
      converged: fitted.stats.converged,
      iterations: fitted.stats.iterations,
      maxParamCorrelation: fitted.stats.maxParamCorrelation,
      lastRanAt: `Converged in ${fitted.stats.iterations} LM iterations`,
    });
  };

  const handleAutoDetectAndFit = (sourceData = activeData) => {
    pushHistory(false);
    const { peaks: detected, estimatedBg } = autoDetectPeaks(sourceData, detectMaxPeaks, detectProminence);
    if (detected.length === 0) {
      setImportNotice(
        'No prominent peaks detected above threshold. Try lowering prominence % or click Place Peak on the plot.'
      );
      return;
    }
    const res = fitMultiPeakLM({
      data: sourceData,
      peaks: detected,
      background: estimatedBg,
      model,
      optics,
    });
    setPeaks(res.peaks);
    setBackground(res.background);
    setUncertainties(res.uncertainties);
    setSelectedPeakId(res.peaks[0]?.id ?? null);
    setBenchmarkRows(null);
    setFitMeta({
      converged: res.stats.converged,
      iterations: res.stats.iterations,
      maxParamCorrelation: res.stats.maxParamCorrelation,
      lastRanAt: `Detected ${res.peaks.length} peak${res.peaks.length === 1 ? '' : 's'} & fitted in ${res.stats.iterations} iterations`,
    });
  };

  const handleAddPeakAt = (twoTheta: number, netIntensity: number, customFwhm?: number, autoRefit = false) => {
    pushHistory(false);
    const idx = peaks.length;
    const newPeak: FitPeakParam = {
      id: makePeakId(),
      label: `Peak ${idx + 1}`,
      color: PEAK_PALETTE[idx % PEAK_PALETTE.length],
      enabled: true,
      center: Number(twoTheta.toFixed(4)),
      amplitude: Math.max(20, Math.round(netIntensity)),
      fwhm: customFwhm ?? Number(Math.max(0.08, Math.min(1.5, (xMaxData - xMinData) * 0.06)).toFixed(3)),
      eta: 0.45,
      pearsonM: 2.2,
      asymmetry: 1.0,
      lockCenter: false,
      lockFwhm: false,
      lockShape: false,
      lockAsymmetry: false,
    };
    const nextPeaks = [...peaks, newPeak];
    setSelectedPeakId(newPeak.id);
    setBenchmarkRows(null);
    if (autoRefit) {
      handleRunLMFit(model, nextPeaks);
    } else {
      setPeaks(nextPeaks);
      setUncertainties({});
    }
  };

  const handleUpdatePeak = (id: string, patch: Partial<FitPeakParam>, coalesce = true) => {
    pushHistory(coalesce);
    setPeaks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setUncertainties({});
    setBenchmarkRows(null);
  };

  const handleDeletePeak = (id: string) => {
    pushHistory(false);
    const next = peaks.filter((p) => p.id !== id);
    setPeaks(next);
    if (selectedPeakId === id) {
      setSelectedPeakId(next[0]?.id ?? null);
    }
    setUncertainties({});
    setBenchmarkRows(null);
  };

  const handleRunBenchmark = () => {
    const rows = benchmarkAllProfileModels({
      data: activeData,
      peaks,
      background,
      optics,
    });
    setBenchmarkRows(rows);
  };

  const handleApplyBenchmarkRow = (row: ModelBenchmarkRow) => {
    pushHistory(false);
    setModel(row.model);
    setPeaks(row.peaks);
    setBackground(row.background);
    setUncertainties(row.uncertainties);
    setFitMeta({
      converged: row.stats.converged,
      iterations: row.stats.iterations,
      maxParamCorrelation: row.stats.maxParamCorrelation,
      lastRanAt: `Applied ${row.model} (R_wp = ${row.stats.rwp.toFixed(2)}%)`,
    });
    setActiveTab('workbench');
  };

  const handleImportText = (text: string, label = 'Imported Experimental Pattern') => {
    const { points: parsed, skippedLines } = parseExperimentalXY(text);
    if (parsed.length < 8) {
      setImportNotice(
        `Could not parse enough valid (2θ, Intensity) rows (found ${parsed.length}). Expected two numeric columns.`
      );
      return;
    }
    setData(parsed);
    setFitWindow(null);
    setDatasetName(label);
    setActivePresetId(null);
    setBenchmarkRows(null);
    setImportNotice(
      `Loaded ${parsed.length} data points (${parsed[0].x.toFixed(2)}° – ${parsed[parsed.length - 1].x.toFixed(2)}°)${
        skippedLines > 0 ? ` · skipped ${skippedLines} header/comment lines` : ''
      }. Auto-detected and fitted peaks.`
    );
    handleAutoDetectAndFit(parsed);
    setActiveTab('workbench');
  };

  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      handleImportText(content, file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
    e.target.value = '';
  };

  const handleInsertSampleXY = () => {
    const sampleLines = activeData
      .slice(0, 120)
      .map((pt) => `${pt.x.toFixed(4)}, ${pt.y.toFixed(2)}`)
      .join('\n');
    setRawPasteText(`# 2Theta (deg), Intensity (cps) — ${datasetName}\n${sampleLines}`);
  };

  const handleDownloadCSV = () => {
    const csv = exportFitToCSV({
      datasetName,
      model,
      optics,
      points: evaluated.points,
      peakMetrics: evaluated.peakMetrics,
      stats: evaluated.stats,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_profile_fit.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportText = useMemo(
    () =>
      buildProfileFitReport({
        datasetName,
        model,
        optics,
        background,
        peakMetrics: evaluated.peakMetrics,
        stats: evaluated.stats,
        williamsonHall: evaluated.williamsonHall,
      }),
    [datasetName, model, optics, background, evaluated.peakMetrics, evaluated.stats, evaluated.williamsonHall]
  );

  const handleCopyReport = () => {
    navigator.clipboard?.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const activePeakCount = peaks.filter((p) => p.enabled).length;
  const dwQuality =
    evaluated.stats.durbinWatson >= 1.6 && evaluated.stats.durbinWatson <= 2.4
      ? { label: 'White noise', tone: 'text-emerald-700 dark:text-emerald-400' }
      : evaluated.stats.durbinWatson < 1.6
      ? { label: 'Structured', tone: 'text-amber-700 dark:text-amber-400' }
      : { label: 'Oscillating', tone: 'text-amber-700 dark:text-amber-400' };

  const corrStatus =
    evaluated.stats.maxParamCorrelation > 0.95
      ? { label: 'High coupling', tone: 'text-amber-700 dark:text-amber-400' }
      : evaluated.stats.maxParamCorrelation > 0.85
      ? { label: 'Moderate', tone: 'text-slate-600 dark:text-slate-300' }
      : { label: 'Well-conditioned', tone: 'text-emerald-700 dark:text-emerald-400' };

  const minResolutionRs =
    evaluated.resolutionPairs.length > 0
      ? Math.min(...evaluated.resolutionPairs.map((p) => p.resolutionRs))
      : null;

  const resolutionLabel =
    minResolutionRs === null
      ? null
      : minResolutionRs < 1.0
      ? { text: 'Severe overlap', tone: 'text-rose-700 dark:text-rose-400' }
      : minResolutionRs < 1.5
      ? { text: 'Partial overlap', tone: 'text-amber-700 dark:text-amber-400' }
      : { text: 'Baseline resolved', tone: 'text-emerald-700 dark:text-emerald-400' };

  const bestBenchmark = benchmarkRows?.[0] ?? null;
  const runnerUpBenchmark = benchmarkRows?.[1] ?? null;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5 text-slate-900 dark:text-slate-100">
      {/* =================================================================== */}
      {/* INSTRUMENT WORKBENCH HEADER                                         */}
      {/* =================================================================== */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
              FWHM Profile Fitting
            </h1>
            <select
              aria-label="Quick switch diffraction scenario"
              value={activePresetId ?? ''}
              onChange={(e) => {
                if (e.target.value) handleLoadScenario(e.target.value);
              }}
              className="text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 transition-colors max-w-[260px] truncate"
            >
              {!activePresetId && <option value="">Custom: {datasetName}</option>}
              {FWHM_SCENARIO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {FWHM_XRAY_ANODES[optics.anodeId].symbol} ({lambda1A.toFixed(4)} Å)
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{model}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {activePeakCount} peak{activePeakCount === 1 ? '' : 's'}
            </span>
            {fitWindow && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                  Region {fitWindow[0].toFixed(2)}°–{fitWindow[1].toFixed(2)}°
                </span>
              </>
            )}
            {fitMeta.lastRanAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>{fitMeta.lastRanAt}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Primary Module Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'workbench', label: 'Fit Workbench' },
                { id: 'benchmark', label: '5-Model Benchmark' },
                { id: 'io', label: 'Import & Export' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'benchmark' && !benchmarkRows) {
                    handleRunBenchmark();
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              title="Undo parameter change"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              title="Redo parameter change"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleRunLMFit()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Auto-Fit (LM)
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* TAB 1: ASYMMETRIC SPLIT INSTRUMENT WORKBENCH                        */}
      {/* =================================================================== */}
      {activeTab === 'workbench' && (
        <div className="space-y-5">
          {/* Unified Hairline-Divided Precision Telemetry Strip */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800">
              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Weighted R_wp</div>
                <div className="flex items-baseline gap-1 mt-0.5 font-mono tabular-nums">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {evaluated.stats.rwp.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400">%</span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  R_exp {evaluated.stats.rexp.toFixed(2)}%
                </div>
              </div>

              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Reduced χ²</div>
                <div className="flex items-baseline gap-1.5 mt-0.5 font-mono tabular-nums">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {evaluated.stats.chi2Reduced.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400">GoF {evaluated.stats.gof.toFixed(2)}</span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  DoF {evaluated.stats.dof} ({evaluated.stats.nParams} free)
                </div>
              </div>

              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Coefficient R²</div>
                <div className="flex items-baseline gap-1 mt-0.5 font-mono tabular-nums">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {evaluated.stats.rSquared.toFixed(4)}
                  </span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  Profile R_p {evaluated.stats.rp.toFixed(2)}%
                </div>
              </div>

              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Durbin–Watson d</div>
                <div className="flex items-baseline gap-1.5 mt-0.5 font-mono tabular-nums">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {evaluated.stats.durbinWatson.toFixed(2)}
                  </span>
                </div>
                <div className={`text-[11px] font-medium ${dwQuality.tone}`}>{dwQuality.label}</div>
              </div>

              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Model Selection AIC</div>
                <div className="flex items-baseline gap-1 mt-0.5 font-mono tabular-nums">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {evaluated.stats.aic.toFixed(0)}
                  </span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  BIC {evaluated.stats.bic.toFixed(0)}
                </div>
              </div>

              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Max Coupling |r_ij|</div>
                <div className="flex items-baseline gap-1 mt-0.5 font-mono tabular-nums">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {evaluated.stats.maxParamCorrelation.toFixed(3)}
                  </span>
                </div>
                <div className={`text-[11px] font-medium ${corrStatus.tone}`}>{corrStatus.label}</div>
              </div>
            </div>
          </div>

          {/* Asymmetric Split Console: Left Parameter Console + Right Dominant Diffractogram */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Left Precision Parameter Console */}
            <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
              {/* Line-Profile Kernel Selector */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Line-Profile Function
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleRunBenchmark();
                      setActiveTab('benchmark');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline whitespace-nowrap"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Benchmark All 5
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PROFILE_MODELS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleRunLMFit(m)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md border text-left transition-colors truncate ${
                        model === m
                          ? 'bg-slate-900 dark:bg-sky-500/20 text-white dark:text-sky-200 border-slate-900 dark:border-sky-500/60'
                          : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean 3-Tab Console Navigation */}
              <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-xs font-medium">
                {(
                  [
                    { id: 'peaks', label: `Peaks (${peaks.length})` },
                    { id: 'optics', label: 'Optics & BG' },
                    { id: 'presets', label: 'Scenarios' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLeftPanelTab(t.id)}
                    className={`py-2.5 px-2 text-center border-b-2 transition-colors whitespace-nowrap ${
                      leftPanelTab === t.id
                        ? 'border-blue-600 dark:border-sky-400 text-slate-900 dark:text-white bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Console Body */}
              <div className="p-4 max-h-[590px] overflow-y-auto space-y-3.5">
                {/* 1. PEAKS EDITOR */}
                {leftPanelTab === 'peaks' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddPeakAt(
                            0.5 * (xMinData + xMaxData),
                            Math.max(100, evaluated.points[0]?.yObs || 500)
                          )
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Peak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoDetectAndFit()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 text-blue-700 dark:text-sky-300 transition-colors whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Detect
                      </button>
                    </div>

                    {evaluated.residualSpike && evaluated.residualSpike.zScore >= 3.8 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAddPeakAt(
                            evaluated.residualSpike!.twoTheta,
                            evaluated.residualSpike!.netHeight,
                            evaluated.residualSpike!.estimatedFwhm,
                            true
                          )
                        }
                        className="w-full text-left px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 text-xs text-rose-900 dark:text-rose-200 transition-colors"
                      >
                        <span className="font-semibold">
                          + Insert Peak at Max Residual ({evaluated.residualSpike.twoTheta.toFixed(2)}°)
                        </span>
                        <span className="block text-[11px] text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                          +{evaluated.residualSpike.zScore.toFixed(1)}σ spike · est. β{' '}
                          {evaluated.residualSpike.estimatedFwhm.toFixed(2)}°
                        </span>
                      </button>
                    )}

                    {peaks.length >= 2 &&
                      (model === 'Pseudo-Voigt' ||
                        model === 'Split Pseudo-Voigt' ||
                        model === 'Pearson VII') && (
                        <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                          <span>
                            Couple global {model === 'Pearson VII' ? 'm' : 'η'} across peaks
                          </span>
                          <input
                            type="checkbox"
                            checked={optics.shareShapeAcrossPeaks}
                            onChange={(e) => {
                              const nextOptics = { ...optics, shareShapeAcrossPeaks: e.target.checked };
                              handleRunLMFit(model, peaks, nextOptics);
                            }}
                            className="accent-blue-600"
                          />
                        </label>
                      )}

                    {peaks.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                        No peaks defined. Click <strong>Auto-Detect</strong> or choose{' '}
                        <strong>Place Peak</strong> on the diffractogram toolbar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {peaks.map((pk) => {
                          const isSelected = selectedPeakId === pk.id;
                          const unc = uncertainties[pk.id];
                          const liveMetric = metricsById.get(pk.id);
                          return (
                            <div
                              key={pk.id}
                              className={`rounded-lg border transition-colors overflow-hidden ${
                                isSelected
                                  ? 'border-blue-400 dark:border-sky-500/70 bg-slate-50/70 dark:bg-slate-950/70'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              {/* Peak Header Row */}
                              <div
                                className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer"
                                onClick={() => setSelectedPeakId(isSelected ? null : pk.id)}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isSelected ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span
                                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                                    style={{ backgroundColor: pk.color }}
                                  />
                                  <input
                                    type="text"
                                    value={pk.label}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleUpdatePeak(pk.id, { label: e.target.value }, true)}
                                    className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:underline w-24 sm:w-28 truncate"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                  <span className="text-slate-800 dark:text-slate-200">{pk.center.toFixed(2)}°</span>
                                  <span aria-hidden="true">·</span>
                                  <span>β {pk.fwhm.toFixed(3)}°</span>
                                  <button
                                    type="button"
                                    title={pk.enabled ? 'Disable peak' : 'Enable peak'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdatePeak(pk.id, { enabled: !pk.enabled }, false);
                                    }}
                                    className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  >
                                    {pk.enabled ? (
                                      <Eye className="w-3.5 h-3.5" />
                                    ) : (
                                      <EyeOff className="w-3.5 h-3.5 opacity-50" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="Remove peak"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePeak(pk.id);
                                    }}
                                    className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Live Physics Readout + Precision Sliders */}
                              {isSelected && (
                                <div className="px-3 pb-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                                  {/* Live Derived Physics Micro-Strip */}
                                  {liveMetric && (
                                    <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md py-1.5 text-center font-mono tabular-nums">
                                      <div className="px-1.5">
                                        <div className="text-[10px] font-sans text-slate-400">d-spacing</div>
                                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                          {liveMetric.dSpacingA.toFixed(4)} Å
                                        </div>
                                      </div>
                                      <div className="px-1.5">
                                        <div className="text-[10px] font-sans text-slate-400">Scherrer D</div>
                                        <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                          {liveMetric.resolutionLimited
                                            ? 'Limit'
                                            : liveMetric.scherrerSizeNm !== null
                                            ? `${liveMetric.scherrerSizeNm.toFixed(1)} nm`
                                            : '—'}
                                        </div>
                                      </div>
                                      <div className="px-1.5">
                                        <div className="text-[10px] font-sans text-slate-400">Shape φ</div>
                                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                          {liveMetric.shapeFactorPhi.toFixed(3)}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Center 2θ */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        Center 2θ₀ (deg)
                                      </span>
                                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                        <input
                                          type="number"
                                          step="0.005"
                                          value={Number(pk.center.toFixed(4))}
                                          onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            if (Number.isFinite(v)) handleUpdatePeak(pk.id, { center: v });
                                          }}
                                          className="w-20 px-1.5 py-0.5 text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdatePeak(pk.id, { lockCenter: !pk.lockCenter }, false)}
                                          title={pk.lockCenter ? 'Unlock 2θ₀ for LM fit' : 'Lock 2θ₀ during LM fit'}
                                          className={`p-1 rounded transition-colors ${
                                            pk.lockCenter
                                              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                          }`}
                                        >
                                          {pk.lockCenter ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>
                                    <input
                                      type="range"
                                      min={xMinData}
                                      max={xMaxData}
                                      step={(xMaxData - xMinData) / 500}
                                      value={pk.center}
                                      onChange={(e) => handleUpdatePeak(pk.id, { center: parseFloat(e.target.value) })}
                                      className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                    />
                                    {unc?.centerErr !== null && unc?.centerErr !== undefined && (
                                      <div className="text-[10px] font-mono text-slate-400">
                                        LM ESD ±{unc.centerErr.toFixed(4)}°
                                        {liveMetric && Math.abs(liveMetric.centroidDeg - pk.center) > 0.002 && (
                                          <span className="ml-2">
                                            · Centroid {liveMetric.centroidDeg.toFixed(3)}°
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Amplitude */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        Net Height I₀ (cps)
                                      </span>
                                      <input
                                        type="number"
                                        step="10"
                                        min="1"
                                        value={Math.round(pk.amplitude)}
                                        onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (Number.isFinite(v) && v > 0) handleUpdatePeak(pk.id, { amplitude: v });
                                        }}
                                        className="w-20 px-1.5 py-0.5 text-right font-mono tabular-nums rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                                      />
                                    </div>
                                    <input
                                      type="range"
                                      min={10}
                                      max={Math.max(500, Math.round(pk.amplitude * 2.2))}
                                      step={5}
                                      value={pk.amplitude}
                                      onChange={(e) => handleUpdatePeak(pk.id, { amplitude: parseFloat(e.target.value) })}
                                      className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                    />
                                  </div>

                                  {/* FWHM */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        Observed FWHM β (deg)
                                      </span>
                                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                        <input
                                          type="number"
                                          step="0.005"
                                          min="0.015"
                                          max="15"
                                          value={Number(pk.fwhm.toFixed(4))}
                                          onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            if (Number.isFinite(v) && v >= 0.015) handleUpdatePeak(pk.id, { fwhm: v });
                                          }}
                                          className="w-20 px-1.5 py-0.5 text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdatePeak(pk.id, { lockFwhm: !pk.lockFwhm }, false)}
                                          title={pk.lockFwhm ? 'Unlock FWHM' : 'Lock FWHM during LM fit'}
                                          className={`p-1 rounded transition-colors ${
                                            pk.lockFwhm
                                              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                          }`}
                                        >
                                          {pk.lockFwhm ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>
                                    <input
                                      type="range"
                                      min={0.02}
                                      max={Math.min(6, Math.max(1.5, pk.fwhm * 2.5))}
                                      step={0.002}
                                      value={pk.fwhm}
                                      onChange={(e) => handleUpdatePeak(pk.id, { fwhm: parseFloat(e.target.value) })}
                                      className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                    />
                                    {unc?.fwhmErr !== null && unc?.fwhmErr !== undefined && (
                                      <div className="text-[10px] font-mono text-slate-400">
                                        LM ESD ±{unc.fwhmErr.toFixed(4)}°
                                      </div>
                                    )}
                                  </div>

                                  {/* Mixing η for Pseudo-Voigt / Split Pseudo-Voigt */}
                                  {(model === 'Pseudo-Voigt' || model === 'Split Pseudo-Voigt') && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                                          Lorentzian Mix η (0=G, 1=L)
                                        </span>
                                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                          <span>{pk.eta.toFixed(3)}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdatePeak(pk.id, { lockShape: !pk.lockShape }, false)}
                                            className={`p-1 rounded transition-colors ${
                                              pk.lockShape
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                          >
                                            {pk.lockShape ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      </div>
                                      <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={pk.eta}
                                        onChange={(e) => handleUpdatePeak(pk.id, { eta: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                      />
                                    </div>
                                  )}

                                  {/* Pearson VII exponent m */}
                                  {model === 'Pearson VII' && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                                          Pearson Exponent m (1=L, ∞=G)
                                        </span>
                                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                          <span>{pk.pearsonM.toFixed(2)}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdatePeak(pk.id, { lockShape: !pk.lockShape }, false)}
                                            className={`p-1 rounded transition-colors ${
                                              pk.lockShape
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                          >
                                            {pk.lockShape ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      </div>
                                      <input
                                        type="range"
                                        min={0.9}
                                        max={15}
                                        step={0.05}
                                        value={pk.pearsonM}
                                        onChange={(e) => handleUpdatePeak(pk.id, { pearsonM: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                      />
                                    </div>
                                  )}

                                  {/* Split Asymmetry Ratio */}
                                  {model === 'Split Pseudo-Voigt' && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                                          Asymmetry Ratio H_R / H_L
                                        </span>
                                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                          <span>{pk.asymmetry.toFixed(2)}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleUpdatePeak(pk.id, { lockAsymmetry: !pk.lockAsymmetry }, false)
                                            }
                                            className={`p-1 rounded transition-colors ${
                                              pk.lockAsymmetry
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                          >
                                            {pk.lockAsymmetry ? (
                                              <Lock className="w-3 h-3" />
                                            ) : (
                                              <Unlock className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      <input
                                        type="range"
                                        min={0.35}
                                        max={2.6}
                                        step={0.02}
                                        value={pk.asymmetry}
                                        onChange={(e) =>
                                          handleUpdatePeak(pk.id, { asymmetry: parseFloat(e.target.value) })
                                        }
                                        className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. OPTICS, INSTRUMENTAL DECONVOLUTION & BACKGROUND */}
                {leftPanelTab === 'optics' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        X-Ray Source & Kα₂ Doublet
                      </label>
                      <select
                        value={optics.anodeId}
                        onChange={(e) => {
                          pushHistory(false);
                          setOptics((prev) => ({ ...prev, anodeId: e.target.value as AnodeKey }));
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        {Object.values(FWHM_XRAY_ANODES).map((an) => (
                          <option key={an.id} value={an.id}>
                            {an.label} ({an.lambda1A.toFixed(4)} Å)
                          </option>
                        ))}
                      </select>

                      {optics.anodeId === 'Custom' && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Custom λ (Å)</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0.1"
                            max="5"
                            value={optics.customWavelengthA}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v) && v > 0.1) {
                                setOptics((prev) => ({ ...prev, customWavelengthA: v }));
                              }
                            }}
                            className="w-24 px-2 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                      )}

                      <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
                        <span>Couple Kα₂ doublet in fit model</span>
                        <input
                          type="checkbox"
                          checked={optics.includeKa2}
                          onChange={(e) => {
                            pushHistory(false);
                            const checked = e.target.checked;
                            setOptics((prev) => ({ ...prev, includeKa2: checked }));
                            setOverlays((prev) => ({ ...prev, showKa2Trace: checked }));
                          }}
                          className="accent-blue-600"
                        />
                      </label>
                      {optics.includeKa2 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Kα₂ / Kα₁ Intensity Ratio</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="1"
                            value={optics.ka2Ratio}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v))
                                setOptics((prev) => ({ ...prev, ka2Ratio: Math.max(0.05, Math.min(1, v)) }));
                            }}
                            className="w-20 px-1.5 py-0.5 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </div>
                      )}
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    <div className="space-y-2.5">
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <span>Instrumental Deconvolution (β_inst)</span>
                        <input
                          type="checkbox"
                          checked={optics.enableInstCorrection}
                          onChange={(e) =>
                            setOptics((prev) => ({ ...prev, enableInstCorrection: e.target.checked }))
                          }
                          className="accent-blue-600"
                        />
                      </label>

                      {optics.enableInstCorrection && (
                        <>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['Voigt', 'Halder-Wagner', 'Gaussian', 'Lorentzian'] as DeconvolutionLaw[]).map((law) => (
                              <button
                                key={law}
                                type="button"
                                onClick={() => setOptics((prev) => ({ ...prev, deconvolutionLaw: law }))}
                                className={`px-2 py-1.5 text-[11px] font-medium rounded-md border transition-colors ${
                                  optics.deconvolutionLaw === law
                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {law}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setOptics((prev) => ({ ...prev, useCaglioti: true }))}
                              className={`flex-1 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
                                optics.useCaglioti
                                  ? 'border-blue-500 text-blue-700 dark:text-sky-300 bg-blue-50/60 dark:bg-sky-950/40'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              Caglioti (U, V, W)
                            </button>
                            <button
                              type="button"
                              onClick={() => setOptics((prev) => ({ ...prev, useCaglioti: false }))}
                              className={`flex-1 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
                                !optics.useCaglioti
                                  ? 'border-blue-500 text-blue-700 dark:text-sky-300 bg-blue-50/60 dark:bg-sky-950/40'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              Fixed β_inst
                            </button>
                          </div>

                          {optics.useCaglioti ? (
                            <div className="space-y-2">
                              <select
                                onChange={(e) => {
                                  const found = CAGLIOTI_INSTRUMENT_PRESETS.find((c) => c.id === e.target.value);
                                  if (found) {
                                    setOptics((prev) => ({
                                      ...prev,
                                      cagliotiU: found.u,
                                      cagliotiV: found.v,
                                      cagliotiW: found.w,
                                      instEta: found.instEta,
                                    }));
                                  }
                                }}
                                defaultValue="lab_cu"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                              >
                                {CAGLIOTI_INSTRUMENT_PRESETS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                              <div className="grid grid-cols-3 gap-2">
                                {(
                                  [
                                    { key: 'cagliotiU', label: 'U' },
                                    { key: 'cagliotiV', label: 'V' },
                                    { key: 'cagliotiW', label: 'W' },
                                  ] as const
                                ).map((item) => (
                                  <label key={item.key} className="space-y-0.5 text-[11px]">
                                    <span className="text-slate-500 dark:text-slate-400 font-mono">{item.label}</span>
                                    <input
                                      type="number"
                                      step="0.0005"
                                      value={optics[item.key]}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (Number.isFinite(v)) setOptics((prev) => ({ ...prev, [item.key]: v }));
                                      }}
                                      className="w-full px-1.5 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400">Fixed β_inst (deg)</span>
                              <input
                                type="number"
                                step="0.005"
                                min="0"
                                max="1"
                                value={optics.fixedInstFwhm}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (Number.isFinite(v) && v >= 0)
                                    setOptics((prev) => ({ ...prev, fixedInstFwhm: v }));
                                }}
                                className="w-24 px-2 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Scherrer Shape Factor K</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.6"
                              max="1.2"
                              value={optics.scherrerK}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (Number.isFinite(v) && v > 0.4) setOptics((prev) => ({ ...prev, scherrerK: v }));
                              }}
                              className="w-24 px-2 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    <div className="space-y-2.5">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Background Polynomial & Weighting
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { order: 0, label: 'Constant' },
                            { order: 1, label: 'Linear' },
                            { order: 2, label: 'Quadratic' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.order}
                            type="button"
                            onClick={() => {
                              pushHistory(false);
                              setBackground((prev) => ({ ...prev, order: opt.order }));
                            }}
                            className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors ${
                              background.order === opt.order
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <label className="space-y-0.5 text-[11px]">
                          <span className="text-slate-500 font-mono">b₀</span>
                          <input
                            type="number"
                            step="5"
                            value={Number(background.b0.toFixed(1))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v)) setBackground((prev) => ({ ...prev, b0: v }));
                            }}
                            className="w-full px-1.5 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                          />
                        </label>
                        <label className="space-y-0.5 text-[11px]">
                          <span className="text-slate-500 font-mono">b₁</span>
                          <input
                            type="number"
                            step="2"
                            disabled={background.order < 1}
                            value={Number(background.b1.toFixed(1))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v)) setBackground((prev) => ({ ...prev, b1: v }));
                            }}
                            className="w-full px-1.5 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:opacity-40"
                          />
                        </label>
                        <label className="space-y-0.5 text-[11px]">
                          <span className="text-slate-500 font-mono">b₂</span>
                          <input
                            type="number"
                            step="2"
                            disabled={background.order < 2}
                            value={Number(background.b2.toFixed(1))}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v)) setBackground((prev) => ({ ...prev, b2: v }));
                            }}
                            className="w-full px-1.5 py-1 text-right font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:opacity-40"
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500 dark:text-slate-400">LM Weighting</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setOptics((prev) => ({ ...prev, weighting: 'poisson' }))}
                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                              optics.weighting === 'poisson'
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Poisson (1/I)
                          </button>
                          <button
                            type="button"
                            onClick={() => setOptics((prev) => ({ ...prev, weighting: 'uniform' }))}
                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                              optics.weighting === 'uniform'
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Uniform
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SCENARIO PRESETS LIBRARY */}
                {leftPanelTab === 'presets' && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Load a calibrated reference scenario to test overlapping peak deconvolution, Kα₂ splitting, axial asymmetry, or Lorentzian strain tails.
                    </p>
                    <div className="space-y-2">
                      {FWHM_SCENARIO_PRESETS.map((preset) => {
                        const isActive = activePresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleLoadScenario(preset.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              isActive
                                ? 'border-blue-500 dark:border-sky-400 bg-blue-50/50 dark:bg-sky-950/30'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                {preset.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                                {preset.truePeaks.length} pk · {preset.recommendedModel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {preset.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Anchored Bottom Refinement Bar */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => handleLoadScenario(activePresetId || FWHM_SCENARIO_PRESETS[0].id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleRunLMFit()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Refine All Free Parameters
                </button>
              </div>
            </aside>

            {/* Right Dominant Interactive Diffractogram Viewport */}
            <div className="xl:col-span-8 space-y-3.5">
              <FWHMInteractivePlot
                points={evaluated.points}
                peakMetrics={evaluated.peakMetrics}
                stats={evaluated.stats}
                model={model}
                wavelengthA={lambda1A}
                selectedPeakId={selectedPeakId}
                onSelectPeak={(id) => {
                  setSelectedPeakId(id);
                  setLeftPanelTab('peaks');
                }}
                onAddPeakAt={(tt, netI) => handleAddPeakAt(tt, netI)}
                overlays={overlays}
                onUpdateOverlays={(patch) => setOverlays((prev) => ({ ...prev, ...patch }))}
                datasetName={datasetName}
                residualSpike={evaluated.residualSpike}
                activeFitWindow={fitWindow}
                onSetFitWindow={handleSetFitWindow}
              />

              {/* Actionable Scientific Fit Diagnostics */}
              {evaluated.diagnostics.length > 0 && (
                <div className="space-y-2">
                  {evaluated.diagnostics.map((diag) => (
                    <div
                      key={diag.id}
                      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${
                        diag.severity === 'warning'
                          ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-200/90 dark:border-amber-800/70 text-amber-950 dark:text-amber-100'
                          : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {diag.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-semibold">{diag.title}</div>
                          <div className="text-[11px] opacity-85 leading-relaxed">{diag.detail}</div>
                        </div>
                      </div>
                      {diag.actionKind && diag.actionLabel && (
                        <button
                          type="button"
                          onClick={() => {
                            if (diag.actionKind === 'add_residual_peak' && evaluated.residualSpike) {
                              handleAddPeakAt(
                                evaluated.residualSpike.twoTheta,
                                evaluated.residualSpike.netHeight,
                                evaluated.residualSpike.estimatedFwhm,
                                true
                              );
                            } else if (diag.actionKind === 'switch_split_pv') {
                              handleRunLMFit('Split Pseudo-Voigt');
                            } else if (diag.actionKind === 'enable_shared_shape') {
                              handleRunLMFit(model, peaks, { ...optics, shareShapeAcrossPeaks: true });
                            } else if (diag.actionKind === 'run_benchmark') {
                              handleRunBenchmark();
                              setActiveTab('benchmark');
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-colors whitespace-nowrap shrink-0"
                        >
                          {diag.actionLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* DECONVOLVED REFLECTIONS & MICROSTRUCTURE SUMMARY TABLE            */}
          {/* ================================================================= */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Deconvolved Reflections & Microstructure Parameters
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Covariance-derived ±1σ ESDs stacked beneath each value ·{' '}
                  {optics.enableInstCorrection
                    ? `${optics.deconvolutionLaw} instrumental deconvolution active`
                    : 'Observed broadening (instrumental deconvolution disabled)'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReport ? 'Copied Report' : 'Copy Report'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Reflection</th>
                    <th className="py-2.5 px-3 text-right">2θ₀ (°)</th>
                    <th className="py-2.5 px-3 text-right">d (Å)</th>
                    <th className="py-2.5 px-3 text-right">FWHM_obs (°)</th>
                    <th className="py-2.5 px-3 text-right">β_inst (°)</th>
                    <th className="py-2.5 px-3 text-right">β_sample (°)</th>
                    <th className="py-2.5 px-3 text-right">β_I (°) · φ</th>
                    <th className="py-2.5 px-3 text-right">
                      {model === 'Pearson VII' ? 'm' : model === 'Split Pseudo-Voigt' ? 'η · Asym' : 'η'}
                    </th>
                    <th className="py-2.5 px-3 text-right">Area (%)</th>
                    <th className="py-2.5 px-3 text-right">Scherrer D (nm)</th>
                    <th className="py-2.5 px-4 text-right">ε_max (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono tabular-nums">
                  {evaluated.peakMetrics.map((m) => {
                    const isSel = selectedPeakId === m.peak.id;
                    return (
                      <tr
                        key={m.peak.id}
                        onClick={() => setSelectedPeakId(m.peak.id)}
                        className={`cursor-pointer transition-colors ${
                          !m.peak.enabled
                            ? 'opacity-45'
                            : isSel
                            ? 'bg-blue-50/60 dark:bg-sky-950/30'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white whitespace-nowrap align-top">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0"
                              style={{ backgroundColor: m.peak.color }}
                            />
                            <span>{m.peak.label}</span>
                          </span>
                          {Math.abs(m.centroidDeg - m.peak.center) > 0.004 && (
                            <span className="block text-[10px] font-mono text-slate-400 pl-4.5">
                              ⟨2θ⟩ {m.centroidDeg.toFixed(3)}°
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap align-top">
                          <div className="text-slate-900 dark:text-white">{m.peak.center.toFixed(4)}</div>
                          {m.uncertainty.centerErr !== null && (
                            <div className="text-[10px] text-slate-400">±{m.uncertainty.centerErr.toFixed(4)}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          <div>{m.dSpacingA.toFixed(4)}</div>
                          {m.uncertainty.dSpacingErr !== null && (
                            <div className="text-[10px] text-slate-400">±{m.uncertainty.dSpacingErr.toFixed(4)}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap align-top">
                          <div className="font-semibold text-slate-900 dark:text-white">{m.fwhmObs.toFixed(4)}</div>
                          {m.uncertainty.fwhmErr !== null && (
                            <div className="text-[10px] text-slate-400">±{m.uncertainty.fwhmErr.toFixed(4)}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 align-top">
                          {m.instFwhmDeg.toFixed(4)}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap align-top">
                          <div className="text-blue-700 dark:text-sky-400 font-semibold">
                            {m.resolutionLimited ? 'Limit' : m.sampleFwhmDeg.toFixed(4)}
                          </div>
                          {!m.resolutionLimited && m.uncertainty.sampleFwhmErr !== null && (
                            <div className="text-[10px] text-slate-400">±{m.uncertainty.sampleFwhmErr.toFixed(4)}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          <div>{m.integralBreadthDeg.toFixed(3)}</div>
                          <div className="text-[10px] text-slate-400">φ {m.shapeFactorPhi.toFixed(3)}</div>
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          {model === 'Gaussian'
                            ? '0.00'
                            : model === 'Lorentzian'
                            ? '1.00'
                            : model === 'Pearson VII'
                            ? m.peak.pearsonM.toFixed(2)
                            : model === 'Split Pseudo-Voigt'
                            ? (
                                <>
                                  <div>{m.peak.eta.toFixed(2)}</div>
                                  <div className="text-[10px] text-slate-400">A {m.peak.asymmetry.toFixed(2)}</div>
                                </>
                              )
                            : m.peak.eta.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          <div>{Math.round(m.integratedArea).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{m.areaFractionPct.toFixed(1)}%</div>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap align-top">
                          {m.resolutionLimited ? (
                            <span className="text-amber-600 dark:text-amber-400 font-sans text-[11px]">
                              Resolution limit
                            </span>
                          ) : m.scherrerSizeNm !== null ? (
                            <>
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {m.scherrerSizeNm.toFixed(1)}
                              </div>
                              {m.uncertainty.scherrerSizeErrNm !== null && (
                                <div className="text-[10px] text-slate-400">
                                  ±{m.uncertainty.scherrerSizeErrNm.toFixed(1)}
                                </div>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          {m.microstrainPct !== null ? (
                            <>
                              <div>{m.microstrainPct.toFixed(3)}</div>
                              {m.uncertainty.microstrainErrPct !== null && (
                                <div className="text-[10px] text-slate-400">
                                  ±{m.uncertainty.microstrainErrPct.toFixed(3)}
                                </div>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Structured Multi-Reflection Microstructure & Conditioning Footer */}
            {(evaluated.williamsonHall.weightedMeanScherrerNm !== null || evaluated.resolutionPairs.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                <div className="px-4 py-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Area-Weighted Mean ⟨D⟩</div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {evaluated.williamsonHall.weightedMeanScherrerNm !== null ? (
                      <>
                        {evaluated.williamsonHall.weightedMeanScherrerNm.toFixed(1)}
                        {evaluated.williamsonHall.weightedStdScherrerNm !== null
                          ? ` ± ${evaluated.williamsonHall.weightedStdScherrerNm.toFixed(1)}`
                          : ''}{' '}
                        <span className="text-xs font-normal text-slate-400">nm</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Williamson–Hall Separation
                  </div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {evaluated.williamsonHall.valid && evaluated.williamsonHall.sizeNm !== null ? (
                      <>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {evaluated.williamsonHall.sizeNm.toFixed(1)} nm
                        </span>
                        <span className="text-slate-400 font-normal mx-1.5">·</span>
                        <span>
                          ε {evaluated.williamsonHall.microstrainPct?.toFixed(3) ?? '0.000'}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-sans font-normal text-slate-400">
                        Requires ≥ 2 resolved peaks
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Min Peak Resolution R_s</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {minResolutionRs !== null ? minResolutionRs.toFixed(2) : 'Single peak'}
                    </span>
                    {resolutionLabel && (
                      <span className={`text-[11px] font-medium ${resolutionLabel.tone}`}>
                        {resolutionLabel.text}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Covariance Conditioning</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      |r|_max = {evaluated.stats.maxParamCorrelation.toFixed(3)}
                    </span>
                    <span className={`text-[11px] font-medium ${corrStatus.tone}`}>{corrStatus.label}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: 5-MODEL STATISTICAL BENCHMARK (AIC / BIC / AKAIKE WEIGHTS)   */}
      {/* =================================================================== */}
      {activeTab === 'benchmark' && (
        <div className="space-y-4">
          {/* Top Recommendation Summary Banner */}
          {bestBenchmark && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Akaike Information Criterion (AIC) Selection
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white flex flex-wrap items-baseline gap-x-2.5">
                  <span>Optimal Kernel: {bestBenchmark.model}</span>
                  <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400">
                    w_i = {bestBenchmark.akaikeWeightPct.toFixed(1)}% probability
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {runnerUpBenchmark
                    ? `Outperforms runner-up ${runnerUpBenchmark.model} by ΔAIC = ${runnerUpBenchmark.deltaAic.toFixed(1)} with R_wp = ${bestBenchmark.stats.rwp.toFixed(2)}% and χ² = ${bestBenchmark.stats.chi2Reduced.toFixed(2)}.`
                    : `Achieves R_wp = ${bestBenchmark.stats.rwp.toFixed(2)}% with ${bestBenchmark.stats.nParams} free parameters.`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRunBenchmark}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-Run All 5
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBenchmarkRow(bestBenchmark)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply {bestBenchmark.model}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  5-Model Profile Benchmark & Information Criteria
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Full Levenberg–Marquardt refinement across all five profile functions ranked by AIC, BIC, and Akaike weights.
                </p>
              </div>
              {!bestBenchmark && (
                <button
                  type="button"
                  onClick={handleRunBenchmark}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run All 5 Models
                </button>
              )}
            </div>

            {benchmarkRows ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Rank & Profile Model</th>
                      <th className="py-3 px-3 text-right">R_wp (%)</th>
                      <th className="py-3 px-3 text-right">R²</th>
                      <th className="py-3 px-3 text-right">χ² (Red.)</th>
                      <th className="py-3 px-3 text-right">Durbin–Watson</th>
                      <th className="py-3 px-3 text-right">AIC (ΔAIC)</th>
                      <th className="py-3 px-3 text-right">BIC</th>
                      <th className="py-3 px-3 text-right">Akaike Weight</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono tabular-nums">
                    {benchmarkRows.map((row, idx) => {
                      const isCurrent = row.model === model;
                      return (
                        <tr
                          key={row.model}
                          className={
                            row.isBest
                              ? 'bg-emerald-50/45 dark:bg-emerald-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }
                        >
                          <td className="py-3.5 px-4 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400">#{idx + 1}</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{row.model}</span>
                              {row.isBest && (
                                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                  · Optimal AIC
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[11px] text-blue-600 dark:text-sky-400">· Active</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {row.stats.nParams} free params · {row.stats.iterations} LM iterations · max |r|{' '}
                              {row.stats.maxParamCorrelation.toFixed(2)}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                            {row.stats.rwp.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {row.stats.rSquared.toFixed(5)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {row.stats.chi2Reduced.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {row.stats.durbinWatson.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <span className="text-slate-900 dark:text-white">{row.stats.aic.toFixed(1)}</span>
                            <span className="text-slate-400 text-[11px] ml-1.5">(+{row.deltaAic.toFixed(1)})</span>
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-400">
                            {row.stats.bic.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    row.isBest ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-blue-600 dark:bg-sky-400'
                                  }`}
                                  style={{ width: `${Math.max(2, row.akaikeWeightPct)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right">{row.akaikeWeightPct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => handleApplyBenchmarkRow(row)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-900 hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-colors whitespace-nowrap"
                            >
                              Apply Fit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                Click <strong>Run All 5 Models</strong> to benchmark every profile kernel on the active dataset.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: EXPERIMENTAL DATA IMPORT & PUBLICATION EXPORTS               */}
      {/* =================================================================== */}
      {activeTab === 'io' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Import Experimental XY / CSV with Drag-and-Drop */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Import Experimental XRD Pattern
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Drop or upload a two-column <code className="font-mono">.xy</code>,{' '}
                  <code className="font-mono">.csv</code>, or <code className="font-mono">.txt</code> scan (2θ, Intensity), or paste numeric rows directly.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xy,.csv,.txt,.dat,.asc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Drag-and-Drop Target Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processUploadedFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${
                isDraggingFile
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/50 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Drop an XY / CSV file here, or click to browse
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Supports comma, tab, semicolon, or whitespace delimiters · skips header lines automatically
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="text-slate-600 dark:text-slate-300">Auto-Detect Max Peaks</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={detectMaxPeaks}
                  onChange={(e) =>
                    setDetectMaxPeaks(Math.max(1, Math.min(8, parseInt(e.target.value, 10) || 4)))
                  }
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600 dark:text-slate-300">Min Prominence (%)</span>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={detectProminence}
                  onChange={(e) =>
                    setDetectProminence(Math.max(2, Math.min(50, parseInt(e.target.value, 10) || 8)))
                  }
                  className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </label>
            </div>

            <textarea
              rows={8}
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              placeholder={`# Paste 2Theta (deg) and Intensity (cps)\n25.10, 142\n25.15, 295\n25.20, 810\n25.25, 1980\n25.30, 2510\n...`}
              className="w-full flex-1 p-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />

            {importNotice && (
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                {importNotice}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleInsertSampleXY}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Load Sample XY
              </button>
              <button
                type="button"
                onClick={() => handleImportText(rawPasteText, 'Pasted XRD Pattern')}
                disabled={!rawPasteText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Parse, Auto-Detect & Fit
              </button>
            </div>
          </div>

          {/* Scientific Report & CSV Export */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Publication Fit Report & Data Export
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Copy the formatted refinement summary with ±1σ uncertainties or download full deconvolved curves as CSV.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReport ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>

            <pre className="flex-1 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-mono leading-relaxed text-slate-800 dark:text-slate-200 overflow-x-auto max-h-[420px] whitespace-pre">
              {reportText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
