import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Sliders,
  Layers,
  Sigma,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Undo2,
  Redo2,
  ClipboardPaste,
  Maximize2,
  Lock,
} from 'lucide-react';
import {
  AmorphousHaloConfig,
  AnodeId,
  buildCrystallinityReport,
  computeOptimalIntegrationWindow,
  CurvePhysicsConfig,
  DEFAULT_PHYSICS_CONFIG,
  exportCurveToCSV,
  exportCurveToXY,
  FractionBasis,
  IntegrationWindow,
  MATERIAL_CURVE_PRESETS,
  MaterialCrystallinityType,
  MaterialCurvePreset,
  parseBulkPeaksText,
  PhasePhysicalConstants,
  rebalanceCurveToTargetXc,
  SyntheticPeak,
  synthesizeXRDCurve,
  transformCurveForWavelength,
  XRAY_ANODES,
} from '../../utils/xrdCurveBuilderEngine';
import {
  DiffractogramLayerToggles,
  DiffractogramViewport,
} from './DiffractogramViewport';

const DRAFT_STORAGE_KEY = 'xrd_curve_builder_draft_v2';
const MAX_HISTORY = 25;

interface BuilderDraftState {
  sampleName: string;
  materialType: MaterialCrystallinityType;
  peaks: SyntheticPeak[];
  halo: AmorphousHaloConfig;
  physics: CurvePhysicsConfig;
  constants: PhasePhysicalConstants;
  integrationWindow: IntegrationWindow;
  fractionBasis: FractionBasis;
}

function makePeakId(): string {
  return `pk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function presetToDraft(preset: MaterialCurvePreset): BuilderDraftState {
  return {
    sampleName: preset.name,
    materialType: preset.materialType,
    peaks: preset.peaks.map((p, i) => ({ ...p, id: `${preset.id}_pk_${i}` })),
    halo: { ...preset.halo },
    physics: {
      ...DEFAULT_PHYSICS_CONFIG,
      ...preset.physics,
      noiseSeed: DEFAULT_PHYSICS_CONFIG.noiseSeed,
    },
    constants: { ...preset.constants },
    integrationWindow: { ...preset.integrationWindow },
    fractionBasis: 'weight',
  };
}

function loadInitialDraft(): BuilderDraftState {
  const defaultPreset =
    MATERIAL_CURVE_PRESETS.find((p) => p.id === 'pet-semicrystalline') || MATERIAL_CURVE_PRESETS[0];
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return presetToDraft(defaultPreset);
    const parsed = JSON.parse(raw) as Partial<BuilderDraftState>;
    if (!parsed || !parsed.materialType || !Array.isArray(parsed.peaks) || !parsed.physics || !parsed.halo) {
      return presetToDraft(defaultPreset);
    }
    return {
      sampleName: parsed.sampleName || defaultPreset.name,
      materialType: parsed.materialType,
      peaks: parsed.peaks,
      halo: { ...defaultPreset.halo, ...parsed.halo },
      physics: { ...DEFAULT_PHYSICS_CONFIG, ...parsed.physics },
      constants: { ...defaultPreset.constants, ...(parsed.constants || {}) },
      integrationWindow: parsed.integrationWindow || defaultPreset.integrationWindow,
      fractionBasis: parsed.fractionBasis || 'weight',
    };
  } catch {
    return presetToDraft(defaultPreset);
  }
}

const WIZARD_STEPS = [
  { id: 1, title: 'Material', subtitle: 'State & presets' },
  { id: 2, title: 'Peaks', subtitle: '2θ & intensity' },
  { id: 3, title: 'Physics', subtitle: 'Halo, λ & noise' },
  { id: 4, title: 'Crystallinity', subtitle: 'Xc% & export' },
] as const;

export const XRDCurveBuilderModule: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<BuilderDraftState>(() => loadInitialDraft());
  const [historyPast, setHistoryPast] = useState<BuilderDraftState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BuilderDraftState[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>('pet-semicrystalline');

  // New peak inline form state
  const [newPeak2T, setNewPeak2T] = useState<string>('31.50');
  const [newPeakInt, setNewPeakInt] = useState<string>('1800');
  const [newPeakFwhm, setNewPeakFwhm] = useState<string>('0.65');
  const [newPeakHkl, setNewPeakHkl] = useState<string>('');
  const [peakError, setPeakError] = useState<string | null>(null);

  // Bulk peak paste panel
  const [showBulkPaste, setShowBulkPaste] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  // Interactive plot click-to-place-peak mode
  const [placePeakMode, setPlacePeakMode] = useState<boolean>(false);

  // Wavelength shift feedback
  const [wavelengthNotice, setWavelengthNotice] = useState<string | null>(null);

  // Layer toggles for live viewport
  const [layers, setLayers] = useState<DiffractogramLayerToggles>({
    showTotal: true,
    showCrystallineArea: true,
    showAmorphousArea: true,
    showBackground: true,
    showPeakLabels: true,
    showIntegrationBounds: true,
  });

  // Feedback toasts
  const [copiedReport, setCopiedReport] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Coalesce rapid slider drags in undo history
  const lastSnapshotTimeRef = useRef<number>(0);

  const commitDraft = (
    updater: (prev: BuilderDraftState) => BuilderDraftState,
    options?: { coalesce?: boolean }
  ) => {
    setDraft((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      const now = Date.now();
      const shouldPush = !options?.coalesce || now - lastSnapshotTimeRef.current > 450;
      if (shouldPush) {
        lastSnapshotTimeRef.current = now;
        setHistoryPast((past) => [...past.slice(-(MAX_HISTORY - 1)), prev]);
        setHistoryFuture([]);
      }
      return next;
    });
  };

  const handleUndo = () => {
    setHistoryPast((past) => {
      if (past.length === 0) return past;
      const previous = past[past.length - 1];
      setHistoryFuture((fut) => [draft, ...fut.slice(0, MAX_HISTORY - 1)]);
      setDraft(previous);
      setActivePresetId(null);
      return past.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setHistoryFuture((fut) => {
      if (fut.length === 0) return fut;
      const next = fut[0];
      setHistoryPast((past) => [...past.slice(-(MAX_HISTORY - 1)), draft]);
      setDraft(next);
      setActivePresetId(null);
      return fut.slice(1);
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [draft]);

  const synthesis = useMemo(
    () =>
      synthesizeXRDCurve({
        materialType: draft.materialType,
        peaks: draft.peaks,
        halo: draft.halo,
        physics: draft.physics,
        constants: draft.constants,
        integrationWindow: draft.integrationWindow,
        fractionBasis: draft.fractionBasis,
      }),
    [draft]
  );

  const { metrics } = synthesis;

  const activeWavelength =
    draft.physics.anodeId === 'Custom'
      ? draft.physics.wavelengthA
      : XRAY_ANODES[draft.physics.anodeId].lambda1;

  const handleSelectMaterialType = (nextType: MaterialCrystallinityType) => {
    setActivePresetId(null);
    commitDraft((prev) => {
      let nextPeaks = prev.peaks;
      let nextHalo = { ...prev.halo };

      if (nextType === 'crystalline') {
        nextHalo.enabled = false;
        if (nextPeaks.length === 0) {
          nextPeaks = [
            { id: makePeakId(), twoTheta: 26.64, intensity: 6500, fwhm: 0.25, etaOverride: null, hkl: '(101)', enabled: true },
            { id: makePeakId(), twoTheta: 36.54, intensity: 2100, fwhm: 0.28, etaOverride: null, hkl: '(110)', enabled: true },
            { id: makePeakId(), twoTheta: 50.14, intensity: 1600, fwhm: 0.30, etaOverride: null, hkl: '(112)', enabled: true },
          ];
        } else {
          nextPeaks = nextPeaks.map((p) => ({ ...p, enabled: true }));
        }
      } else if (nextType === 'semi-crystalline') {
        nextHalo.enabled = true;
        if (nextHalo.intensity < 150) {
          nextHalo.intensity = 1200;
          nextHalo.fwhm = Math.max(8.5, nextHalo.fwhm);
        }
        if (nextPeaks.length === 0) {
          nextPeaks = [
            { id: makePeakId(), twoTheta: 17.55, intensity: 1950, fwhm: 1.45, etaOverride: null, hkl: '(010)', enabled: true },
            { id: makePeakId(), twoTheta: 22.72, intensity: 2250, fwhm: 1.55, etaOverride: null, hkl: '(1̄10)', enabled: true },
            { id: makePeakId(), twoTheta: 25.85, intensity: 3150, fwhm: 1.38, etaOverride: null, hkl: '(100)', enabled: true },
          ];
        } else {
          nextPeaks = nextPeaks.map((p) => ({ ...p, enabled: true }));
        }
      } else {
        nextHalo.enabled = true;
        if (nextHalo.intensity < 500) {
          nextHalo.intensity = 2400;
          nextHalo.centerTwoTheta = 21.6;
          nextHalo.fwhm = 10.6;
        }
        nextPeaks = nextPeaks.map((p) => ({ ...p, enabled: false }));
      }

      const nextWindow = computeOptimalIntegrationWindow(nextPeaks, nextHalo, prev.physics);
      return {
        ...prev,
        materialType: nextType,
        peaks: nextPeaks,
        halo: nextHalo,
        integrationWindow: nextWindow,
      };
    });
  };

  const handleLoadPreset = (preset: MaterialCurvePreset) => {
    commitDraft(() => presetToDraft(preset));
    setActivePresetId(preset.id);
    setPeakError(null);
    setWavelengthNotice(null);
  };

  const handleTargetCrystallinityChange = (targetPct: number) => {
    setActivePresetId(null);
    commitDraft(
      (prev) => {
        const solved = rebalanceCurveToTargetXc({
          targetPct,
          basis: prev.fractionBasis,
          peaks: prev.peaks,
          halo: prev.halo,
          physics: prev.physics,
          constants: prev.constants,
          integrationWindow: prev.integrationWindow,
        });
        return {
          ...prev,
          materialType: solved.materialType,
          peaks: solved.peaks,
          halo: solved.halo,
        };
      },
      { coalesce: true }
    );
  };

  const handleAddPeak = (e: React.FormEvent) => {
    e.preventDefault();
    const tt = parseFloat(newPeak2T);
    const inten = parseFloat(newPeakInt);
    const fwhm = parseFloat(newPeakFwhm);

    if (!Number.isFinite(tt) || tt < 2 || tt > 175) {
      setPeakError('Enter a valid 2θ angle between 2° and 175°.');
      return;
    }
    if (!Number.isFinite(inten) || inten <= 0) {
      setPeakError('Peak intensity must be greater than 0.');
      return;
    }
    if (!Number.isFinite(fwhm) || fwhm < 0.03 || fwhm > 15) {
      setPeakError('FWHM must be between 0.03° and 15°.');
      return;
    }

    setPeakError(null);
    setActivePresetId(null);
    commitDraft((prev) => {
      const nextMin = Math.min(prev.physics.twoThetaMin, Math.max(2, Math.floor(tt - 6)));
      const nextMax = Math.max(prev.physics.twoThetaMax, Math.min(175, Math.ceil(tt + 6)));
      const nextPeaks: SyntheticPeak[] = [
        ...prev.peaks,
        {
          id: makePeakId(),
          twoTheta: Number(tt.toFixed(3)),
          intensity: Math.round(inten),
          fwhm: Number(fwhm.toFixed(3)),
          etaOverride: null,
          hkl: newPeakHkl.trim(),
          enabled: true,
        },
      ];
      // If user was in amorphous mode and explicitly adds a crystalline peak, promote cleanly to semi-crystalline
      const nextMatType: MaterialCrystallinityType =
        prev.materialType === 'amorphous' ? 'semi-crystalline' : prev.materialType;
      const nextPhysics = { ...prev.physics, twoThetaMin: nextMin, twoThetaMax: nextMax };
      return {
        ...prev,
        materialType: nextMatType,
        peaks: nextPeaks,
        physics: nextPhysics,
        integrationWindow: computeOptimalIntegrationWindow(nextPeaks, prev.halo, nextPhysics),
      };
    });
    setNewPeak2T(Math.min(165, tt + 5).toFixed(2));
    setNewPeakHkl('');
  };

  const handlePlacePeakOnPlot = (twoTheta: number, intensity: number) => {
    setActivePresetId(null);
    commitDraft((prev) => {
      const defaultFwhm =
        prev.materialType === 'crystalline' ? 0.26 : prev.materialType === 'semi-crystalline' ? 1.1 : 0.9;
      const nextPeaks: SyntheticPeak[] = [
        ...prev.peaks,
        {
          id: makePeakId(),
          twoTheta,
          intensity,
          fwhm: defaultFwhm,
          etaOverride: null,
          hkl: '',
          enabled: true,
        },
      ];
      const nextMatType: MaterialCrystallinityType =
        prev.materialType === 'amorphous' ? 'semi-crystalline' : prev.materialType;
      return {
        ...prev,
        materialType: nextMatType,
        peaks: nextPeaks,
      };
    });
  };

  const handleBulkImportPeaks = () => {
    const { peaks: parsed, skippedLines } = parseBulkPeaksText(bulkText);
    if (parsed.length === 0) {
      setBulkNotice('No valid peak rows found. Use format: 2theta, intensity [, fwhm [, hkl]]');
      return;
    }
    setActivePresetId(null);
    commitDraft((prev) => {
      const added = parsed.map((p) => ({ ...p, id: makePeakId() }));
      const allPeaks = [...prev.peaks, ...added].sort((a, b) => a.twoTheta - b.twoTheta);
      const minP = Math.min(...allPeaks.map((p) => p.twoTheta));
      const maxP = Math.max(...allPeaks.map((p) => p.twoTheta));
      const nextPhysics = {
        ...prev.physics,
        twoThetaMin: Math.min(prev.physics.twoThetaMin, Math.max(2, Math.floor(minP - 5))),
        twoThetaMax: Math.max(prev.physics.twoThetaMax, Math.min(175, Math.ceil(maxP + 5))),
      };
      const nextMatType: MaterialCrystallinityType =
        prev.materialType === 'amorphous' ? 'semi-crystalline' : prev.materialType;
      return {
        ...prev,
        materialType: nextMatType,
        peaks: allPeaks,
        physics: nextPhysics,
        integrationWindow: computeOptimalIntegrationWindow(allPeaks, prev.halo, nextPhysics),
      };
    });
    setBulkNotice(
      `Imported ${parsed.length} peak${parsed.length === 1 ? '' : 's'}${
        skippedLines > 0 ? ` (${skippedLines} invalid line${skippedLines === 1 ? '' : 's'} skipped)` : ''
      }.`
    );
    setBulkText('');
  };

  const handleUpdatePeak = (id: string, patch: Partial<SyntheticPeak>) => {
    setActivePresetId(null);
    commitDraft(
      (prev) => ({
        ...prev,
        peaks: prev.peaks.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }),
      { coalesce: true }
    );
  };

  const handleDuplicatePeak = (peak: SyntheticPeak) => {
    setActivePresetId(null);
    commitDraft((prev) => ({
      ...prev,
      peaks: [
        ...prev.peaks,
        {
          ...peak,
          id: makePeakId(),
          twoTheta: Number(Math.min(170, peak.twoTheta + 2.5).toFixed(2)),
          hkl: '',
        },
      ],
    }));
  };

  const handleRemovePeak = (id: string) => {
    setActivePresetId(null);
    commitDraft((prev) => ({
      ...prev,
      peaks: prev.peaks.filter((p) => p.id !== id),
    }));
  };

  const handleSortPeaks = () => {
    commitDraft((prev) => ({
      ...prev,
      peaks: [...prev.peaks].sort((a, b) => a.twoTheta - b.twoTheta),
    }));
  };

  const handleNormalizePeaks = () => {
    const maxI = Math.max(...draft.peaks.map((p) => p.intensity), 0);
    if (maxI <= 0) return;
    commitDraft((prev) => ({
      ...prev,
      peaks: prev.peaks.map((p) => ({
        ...p,
        intensity: Math.round((p.intensity / maxI) * 5000),
      })),
    }));
  };

  const handleWavelengthChange = (nextAnodeId: AnodeId, nextLambda: number) => {
    setActivePresetId(null);
    const oldLambda = activeWavelength;
    commitDraft((prev) => {
      if (prev.physics.lockDSpacingOnWavelengthChange && Math.abs(nextLambda - oldLambda) > 1e-5) {
        const transformed = transformCurveForWavelength({
          oldLambda,
          newLambda: nextLambda,
          peaks: prev.peaks,
          halo: prev.halo,
          physics: prev.physics,
          integrationWindow: prev.integrationWindow,
        });
        if (transformed.clippedCount > 0) {
          setWavelengthNotice(
            `Shifted 2θ via Bragg's Law (d locked). ${transformed.clippedCount} high-angle reflection${
              transformed.clippedCount > 1 ? 's exceed' : ' exceeds'
            } the Ewald sphere (λ > 2d) and ${transformed.clippedCount > 1 ? 'were' : 'was'} muted.`
          );
        } else {
          setWavelengthNotice(
            `Shifted peaks & halo via Bragg's Law to preserve crystal d-spacings (λ = ${nextLambda.toFixed(4)} Å).`
          );
        }
        return {
          ...prev,
          peaks: transformed.peaks,
          halo: transformed.halo,
          physics: {
            ...prev.physics,
            anodeId: nextAnodeId,
            wavelengthA: nextLambda,
            twoThetaMin: transformed.twoThetaMin,
            twoThetaMax: transformed.twoThetaMax,
          },
          integrationWindow: transformed.integrationWindow,
        };
      }
      setWavelengthNotice(null);
      return {
        ...prev,
        physics: {
          ...prev.physics,
          anodeId: nextAnodeId,
          wavelengthA: nextLambda,
        },
      };
    });
  };

  const handleUpdatePhysics = (patch: Partial<CurvePhysicsConfig>, coalesce = true) => {
    setActivePresetId(null);
    commitDraft(
      (prev) => {
        const nextPhysics = { ...prev.physics, ...patch };
        const nextIntMin = Math.max(
          nextPhysics.twoThetaMin,
          Math.min(nextPhysics.twoThetaMax - 2, prev.integrationWindow.minTwoTheta)
        );
        const nextIntMax = Math.max(
          nextIntMin + 2,
          Math.min(nextPhysics.twoThetaMax, prev.integrationWindow.maxTwoTheta)
        );
        return {
          ...prev,
          physics: nextPhysics,
          integrationWindow: { minTwoTheta: nextIntMin, maxTwoTheta: nextIntMax },
        };
      },
      { coalesce }
    );
  };

  const handleUpdateHalo = (patch: Partial<AmorphousHaloConfig>) => {
    setActivePresetId(null);
    commitDraft(
      (prev) => ({
        ...prev,
        halo: { ...prev.halo, ...patch },
      }),
      { coalesce: true }
    );
  };

  const handleUpdateConstants = (patch: Partial<PhasePhysicalConstants>) => {
    commitDraft(
      (prev) => ({
        ...prev,
        constants: { ...prev.constants, ...patch },
      }),
      { coalesce: true }
    );
  };

  const handleAutoFitIntegrationWindow = () => {
    commitDraft((prev) => ({
      ...prev,
      integrationWindow: computeOptimalIntegrationWindow(prev.peaks, prev.halo, prev.physics),
    }));
  };

  const handleToggleLayer = (key: keyof DiffractogramLayerToggles) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerTextDownload = (content: string, filename: string, mime: string, notice: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadNotice(notice);
    setTimeout(() => setDownloadNotice(null), 2400);
  };

  const handleDownloadCSV = () => {
    const csv = exportCurveToCSV(synthesis, {
      sampleName: draft.sampleName,
      materialType: draft.materialType,
      wavelengthA: activeWavelength,
    });
    const safeName = draft.sampleName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    triggerTextDownload(csv, `${safeName}_xrd_data.csv`, 'text/csv;charset=utf-8', 'Exported CSV dataset');
  };

  const handleDownloadXY = () => {
    const xy = exportCurveToXY(synthesis);
    const safeName = draft.sampleName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    triggerTextDownload(xy, `${safeName}_xrd_pattern.xy`, 'text/plain;charset=utf-8', 'Exported XY pattern');
  };

  const handleCopyReport = async () => {
    const report = buildCrystallinityReport({
      sampleName: draft.sampleName,
      materialType: draft.materialType,
      physics: draft.physics,
      constants: draft.constants,
      fractionBasis: draft.fractionBasis,
      result: synthesis,
    });
    try {
      await navigator.clipboard.writeText(report);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2400);
    } catch {
      triggerTextDownload(
        report,
        `${draft.sampleName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_crystallinity_report.txt`,
        'text/plain;charset=utf-8',
        'Downloaded report file'
      );
    }
  };

  const handleResetBuilder = () => {
    const defaultPreset =
      MATERIAL_CURVE_PRESETS.find((p) => p.id === 'pet-semicrystalline') || MATERIAL_CURVE_PRESETS[0];
    commitDraft(() => presetToDraft(defaultPreset));
    setActivePresetId(defaultPreset.id);
    setStep(1);
    setPeakError(null);
    setWavelengthNotice(null);
  };

  const basisLabel =
    draft.fractionBasis === 'volume'
      ? 'Volume Fraction (Xv)'
      : draft.fractionBasis === 'mole'
      ? 'Mole Fraction (Xn)'
      : 'Weight Fraction (Xw)';

  const peaksExcludedCount = metrics.activePeakCount - metrics.peaksInsideWindow;
  const classMismatch = draft.materialType !== metrics.observedClass;

  return (
    <div className="space-y-5 pb-8">
      {/* Top Instrument Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Build Your XRD Curves
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Crystalline, Semi-Crystalline &amp; Amorphous Diffractogram Synthesis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Synthesize physically accurate XRD curves using Thompson-Cox-Hastings Voigt peaks, Caglioti broadening, Bragg-invariant wavelength shifts, and inverse target-crystallinity balancing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="text-right mr-1">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Degree of Crystallinity
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400 leading-none mt-0.5">
              {metrics.activeBasisPct.toFixed(2)}%
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <button
            type="button"
            onClick={handleUndo}
            disabled={historyPast.length === 0}
            title="Undo last change"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyFuture.length === 0}
            title="Redo change"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetBuilder}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Asymmetric Split Console: Left 4-Step Wizard + Right Sticky Live Diffractogram */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        {/* LEFT COLUMN: Guided 4-Step Wizard */}
        <div className="w-full xl:w-[465px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {/* Interactive Stepper Bar */}
          <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
            {WIZARD_STEPS.map((s) => {
              const isCurrent = step === s.id;
              const isCompleted = step > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`px-2 py-3 text-left transition-colors border-b-2 cursor-pointer ${
                    isCurrent
                      ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-mono tabular-nums font-bold ${
                        isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      0{s.id}
                    </span>
                    <span className="text-xs font-bold truncate">{s.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {s.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Body */}
          <div className="p-5 space-y-5">
            {/* ==================== STEP 1: MATERIAL & PRESETS ==================== */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    1. Select Material Structure
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Choose a structural state, dial a target crystallinity directly, or start from a verified reference material.
                  </p>
                </div>

                {/* Sample Name Input */}
                <div>
                  <label
                    htmlFor="xrd-sample-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Sample Title
                  </label>
                  <input
                    id="xrd-sample-name"
                    type="text"
                    value={draft.sampleName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, sampleName: e.target.value }))}
                    placeholder="e.g., Annealed PET Film"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Material State Cards */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Material Type
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {(
                      [
                        {
                          id: 'crystalline' as MaterialCrystallinityType,
                          label: 'Crystalline',
                          range: 'Xc ≥ 90%',
                          desc: 'Long-range repeating crystal lattice producing sharp Bragg peaks and zero diffuse amorphous halo.',
                        },
                        {
                          id: 'semi-crystalline' as MaterialCrystallinityType,
                          label: 'Semi-Crystalline',
                          range: '5% < Xc < 90%',
                          desc: 'Ordered crystalline domains embedded in a disordered amorphous matrix—sharp Bragg peaks over a broad halo.',
                        },
                        {
                          id: 'amorphous' as MaterialCrystallinityType,
                          label: 'Amorphous',
                          range: 'Xc ≤ 5%',
                          desc: 'Short-range atomic order only—broad diffuse scattering halo(s) without sharp lattice peaks.',
                        },
                      ] as const
                    ).map((opt) => {
                      const active = draft.materialType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectMaterialType(opt.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {opt.label}
                            </span>
                            <span className="text-xs font-mono tabular-nums text-indigo-700 dark:text-indigo-400 font-semibold">
                              {opt.range}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Inverse Target Crystallinity Slider */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Target Crystallinity Solver (Xc%)
                    </span>
                    <span className="font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400">
                      {metrics.activeBasisPct.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(metrics.activeBasisPct)}
                    onChange={(e) => handleTargetCrystallinityChange(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleTargetCrystallinityChange(val)}
                        className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically rebalances crystalline peak area vs. amorphous halo area while conserving total scattered intensity.
                  </p>
                </div>

                {/* Built-in Scientific Presets */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Scientific Reference Presets
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click to load
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MATERIAL_CURVE_PRESETS.map((preset) => {
                      const selected = activePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleLoadPreset(preset)}
                          className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                            selected
                              ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-950/40'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {preset.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono">{preset.formula}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{preset.materialType}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STEP 2: BRAGG PEAKS (2θ & INTENSITY) ==================== */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      2. Diffraction Peaks (2θ &amp; Intensity)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Add reflections manually, paste peak tables, or toggle “Place Peak on Plot” to click directly on the curve.
                    </p>
                  </div>
                </div>

                {draft.materialType === 'amorphous' && metrics.activePeakCount === 0 && (
                  <div className="p-3 rounded-lg border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>Amorphous state active:</strong> Pure amorphous materials have zero sharp Bragg peaks (Xc = 0%). Proceed to Step 3 to shape the diffuse halo, or add a peak below to model partial crystallization.
                  </div>
                )}

                {/* Add Peak Form */}
                <form
                  onSubmit={handleAddPeak}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Add Crystalline Reflection
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkPaste((v) => !v);
                        setBulkNotice(null);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>{showBulkPaste ? 'Hide Bulk Paste' : 'Bulk Paste'}</span>
                    </button>
                  </div>

                  {showBulkPaste && (
                    <div className="space-y-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <textarea
                        rows={3}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`Paste lines: 2theta, intensity, fwhm, hkl\n26.64, 8200, 0.22, (101)\n36.54, 1400, 0.25, (110)`}
                        className="w-full p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleBulkImportPeaks}
                          className="px-3 py-1 rounded-md bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Import Rows
                        </button>
                        {bulkNotice && (
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            {bulkNotice}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        2θ (deg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="2"
                        max="175"
                        value={newPeak2T}
                        onChange={(e) => setNewPeak2T(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Intensity
                      </label>
                      <input
                        type="number"
                        step="50"
                        min="1"
                        value={newPeakInt}
                        onChange={(e) => setNewPeakInt(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        FWHM (°)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.03"
                        max="15"
                        value={newPeakFwhm}
                        onChange={(e) => setNewPeakFwhm(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        (hkl) Label
                      </label>
                      <input
                        type="text"
                        placeholder="(111)"
                        value={newPeakHkl}
                        onChange={(e) => setNewPeakHkl(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {peakError && (
                    <div className="text-xs text-rose-600 dark:text-rose-400">{peakError}</div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Peak</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSortPeaks}
                        disabled={draft.peaks.length < 2}
                        className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-slate-400 disabled:opacity-40 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Sort 2θ</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleNormalizePeaks}
                        disabled={draft.peaks.length === 0}
                        className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-slate-400 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Normalize
                      </button>
                    </div>
                  </div>
                </form>

                {/* Editable Peak List */}
                <div className="space-y-2 max-h-[370px] overflow-y-auto custom-scrollbar pr-1">
                  {draft.peaks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                      No crystalline peaks defined. Add 2θ reflections above or click “Place Peak on Plot”.
                    </div>
                  ) : (
                    draft.peaks.map((pk, idx) => {
                      const summary = metrics.peakSummaries.find((s) => s.id === pk.id);
                      return (
                        <div
                          key={pk.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            pk.enabled
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40'
                              : 'border-slate-200/60 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-950/20 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pk.enabled}
                                onChange={(e) => handleUpdatePeak(pk.id, { enabled: e.target.checked })}
                                className="rounded border-slate-300 dark:border-slate-700 accent-indigo-600"
                              />
                              <span>Peak {idx + 1}</span>
                              {summary && (
                                <span className="font-mono tabular-nums text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                  d = {summary.dSpacingA.toFixed(3)} Å · D ≈{' '}
                                  {summary.scherrerSizeNm ? `${summary.scherrerSizeNm.toFixed(1)} nm` : '—'}
                                </span>
                              )}
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicatePeak(pk)}
                                title="Duplicate peak"
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePeak(pk.id)}
                                title="Remove peak"
                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">2θ (°)</span>
                              <input
                                type="number"
                                step="0.05"
                                min="2"
                                max="175"
                                value={pk.twoTheta}
                                onChange={(e) =>
                                  handleUpdatePeak(pk.id, {
                                    twoTheta: Math.max(2, Math.min(175, parseFloat(e.target.value) || 2)),
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">Intensity</span>
                              <input
                                type="number"
                                step="50"
                                min="0"
                                value={pk.intensity}
                                onChange={(e) =>
                                  handleUpdatePeak(pk.id, {
                                    intensity: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">FWHM (°)</span>
                              <input
                                type="number"
                                step="0.05"
                                min="0.03"
                                max="15"
                                value={pk.fwhm}
                                onChange={(e) =>
                                  handleUpdatePeak(pk.id, {
                                    fwhm: Math.max(0.03, Math.min(15, parseFloat(e.target.value) || 0.2)),
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">(hkl)</span>
                              <input
                                type="text"
                                value={pk.hkl}
                                onChange={(e) => handleUpdatePeak(pk.id, { hkl: e.target.value })}
                                placeholder="(hkl)"
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ==================== STEP 3: FULL PHYSICS, HALO & INSTRUMENT ==================== */}
            {step === 3 && (
              <div className="space-y-5 max-h-[540px] overflow-y-auto custom-scrollbar pr-1">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    3. Physics, Amorphous Halo &amp; Instrument
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure Bragg-invariant wavelength shifts, Thompson-Cox-Hastings Voigt + Caglioti optics, Lp/Debye-Waller attenuation, halos, and noise.
                  </p>
                </div>

                {/* X-Ray Source & Scan Window */}
                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    X-Ray Source &amp; Bragg Wavelength Coupling
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Radiation Anode
                      </label>
                      <select
                        value={draft.physics.anodeId}
                        onChange={(e) => {
                          const nextAnode = e.target.value as AnodeId;
                          handleWavelengthChange(nextAnode, XRAY_ANODES[nextAnode].lambda1);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                      >
                        {Object.values(XRAY_ANODES).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.symbol} ({a.lambda1.toFixed(4)} Å)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Wavelength λ (Å)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.1"
                        max="5"
                        disabled={draft.physics.anodeId !== 'Custom'}
                        value={activeWavelength}
                        onChange={(e) =>
                          handleWavelengthChange('Custom', Math.max(0.1, parseFloat(e.target.value) || 1.5406))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:opacity-60 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.physics.lockDSpacingOnWavelengthChange}
                      onChange={(e) =>
                        handleUpdatePhysics({ lockDSpacingOnWavelengthChange: e.target.checked }, false)
                      }
                      className="rounded accent-indigo-600"
                    />
                    <Lock className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>Lock crystal d-spacings (auto-shift 2θ via Bragg&apos;s Law on λ change)</span>
                  </label>

                  {wavelengthNotice && (
                    <div className="p-2.5 rounded-md border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/60 dark:bg-indigo-950/30 text-[11px] text-indigo-800 dark:text-indigo-200">
                      {wavelengthNotice}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">2θ Min (°)</label>
                      <input
                        type="number"
                        min="2"
                        max="150"
                        step="1"
                        value={draft.physics.twoThetaMin}
                        onChange={(e) =>
                          handleUpdatePhysics({
                            twoThetaMin: Math.max(2, Math.min(draft.physics.twoThetaMax - 5, parseFloat(e.target.value) || 5)),
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">2θ Max (°)</label>
                      <input
                        type="number"
                        min="15"
                        max="175"
                        step="1"
                        value={draft.physics.twoThetaMax}
                        onChange={(e) =>
                          handleUpdatePhysics({
                            twoThetaMax: Math.max(draft.physics.twoThetaMin + 5, Math.min(175, parseFloat(e.target.value) || 70)),
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Step Δ2θ (°)</label>
                      <select
                        value={draft.physics.stepDeg}
                        onChange={(e) => handleUpdatePhysics({ stepDeg: parseFloat(e.target.value) }, false)}
                        className="w-full px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100"
                      >
                        <option value={0.02}>0.02°</option>
                        <option value={0.05}>0.05°</option>
                        <option value={0.1}>0.10°</option>
                        <option value={0.2}>0.20°</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.physics.includeKa2}
                      disabled={draft.physics.anodeId === 'Custom'}
                      onChange={(e) => handleUpdatePhysics({ includeKa2: e.target.checked }, false)}
                      className="rounded accent-indigo-600"
                    />
                    <span>Simulate Kα₂ doublet splitting (0.5× intensity ratio)</span>
                  </label>

                  {/* TCH Pseudo-Voigt, Caglioti & Physical Attenuation */}
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700 dark:text-slate-300">
                          Pseudo-Voigt Mixing (η)
                        </span>
                        <span className="font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
                          {draft.physics.globalEta.toFixed(2)}{' '}
                          ({Math.round((1 - draft.physics.globalEta) * 100)}% G /{' '}
                          {Math.round(draft.physics.globalEta * 100)}% L)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={draft.physics.globalEta}
                        onChange={(e) => handleUpdatePhysics({ globalEta: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.physics.useCaglioti}
                          onChange={(e) => handleUpdatePhysics({ useCaglioti: e.target.checked }, false)}
                          className="rounded accent-indigo-600"
                        />
                        <span>Caglioti optics H² = U tan²θ + V tanθ + W</span>
                      </label>
                    </div>

                    {draft.physics.useCaglioti ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-500 mb-0.5">U (deg²)</span>
                          <input
                            type="number"
                            step="0.002"
                            value={draft.physics.cagliotiU}
                            onChange={(e) =>
                              handleUpdatePhysics({ cagliotiU: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 mb-0.5">V (deg²)</span>
                          <input
                            type="number"
                            step="0.002"
                            value={draft.physics.cagliotiV}
                            onChange={(e) =>
                              handleUpdatePhysics({ cagliotiV: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 mb-0.5">W (deg²)</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0.0004"
                            value={draft.physics.cagliotiW}
                            onChange={(e) =>
                              handleUpdatePhysics({
                                cagliotiW: Math.max(0.0004, parseFloat(e.target.value) || 0.004),
                              })
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 dark:text-slate-300">
                            Flat Instrumental Broadening (β_inst)
                          </span>
                          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {draft.physics.instrumentalFwhm.toFixed(2)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.4"
                          step="0.01"
                          value={draft.physics.instrumentalFwhm}
                          onChange={(e) =>
                            handleUpdatePhysics({ instrumentalFwhm: parseFloat(e.target.value) })
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    )}

                    {/* Physical Lorentz-Polarization + Debye-Waller Attenuation */}
                    <div className="pt-1 space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.physics.applyPhysicalAttenuation}
                          onChange={(e) =>
                            handleUpdatePhysics({ applyPhysicalAttenuation: e.target.checked }, false)
                          }
                          className="rounded accent-indigo-600"
                        />
                        <span>Apply Lorentz-Polarization (Lp) &amp; Debye-Waller attenuation</span>
                      </label>
                      {draft.physics.applyPhysicalAttenuation && (
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500">Thermal Factor B_iso (Å²)</span>
                            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              {draft.physics.debyeWallerB.toFixed(2)} Å²
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="6"
                            step="0.1"
                            value={draft.physics.debyeWallerB}
                            onChange={(e) =>
                              handleUpdatePhysics({ debyeWallerB: parseFloat(e.target.value) })
                            }
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amorphous Diffuse Halo Controls */}
                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      Amorphous Diffuse Halo
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.halo.enabled && draft.materialType !== 'crystalline'}
                        disabled={draft.materialType === 'crystalline'}
                        onChange={(e) => handleUpdateHalo({ enabled: e.target.checked })}
                        className="rounded accent-amber-600"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>

                  {draft.materialType === 'crystalline' ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Amorphous halo is disabled in pure <strong>Crystalline</strong> mode. Switch to <strong>Semi-Crystalline</strong> or <strong>Amorphous</strong> in Step 1 to sculpt diffuse scattering.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Center 2θ_a</span>
                            <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                              {draft.halo.centerTwoTheta.toFixed(1)}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min={draft.physics.twoThetaMin + 2}
                            max={draft.physics.twoThetaMax - 2}
                            step="0.2"
                            value={draft.halo.centerTwoTheta}
                            onChange={(e) =>
                              handleUpdateHalo({ centerTwoTheta: parseFloat(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Halo Intensity</span>
                            <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                              {Math.round(draft.halo.intensity)} cps
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="6000"
                            step="50"
                            value={draft.halo.intensity}
                            onChange={(e) =>
                              handleUpdateHalo({ intensity: parseFloat(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Halo FWHM</span>
                            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              {draft.halo.fwhm.toFixed(1)}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="28"
                            step="0.2"
                            value={draft.halo.fwhm}
                            onChange={(e) => handleUpdateHalo({ fwhm: parseFloat(e.target.value) })}
                            className="w-full accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Skewness</span>
                            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              {draft.halo.skewness >= 0 ? '+' : ''}
                              {draft.halo.skewness.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-0.4"
                            max="0.4"
                            step="0.02"
                            value={draft.halo.skewness}
                            onChange={(e) =>
                              handleUpdateHalo({ skewness: parseFloat(e.target.value) })
                            }
                            className="w-full accent-amber-600"
                          />
                        </div>
                      </div>

                      {/* Optional Secondary Halo */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.halo.secondaryEnabled}
                            onChange={(e) =>
                              handleUpdateHalo({ secondaryEnabled: e.target.checked })
                            }
                            className="rounded accent-amber-600"
                          />
                          <span>Include secondary coordination halo (higher 2θ)</span>
                        </label>

                        {draft.halo.secondaryEnabled && (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">2θ₂ (°)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={draft.halo.secondaryCenter}
                                onChange={(e) =>
                                  handleUpdateHalo({
                                    secondaryCenter: parseFloat(e.target.value) || 42,
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">Intensity</span>
                              <input
                                type="number"
                                step="25"
                                value={draft.halo.secondaryIntensity}
                                onChange={(e) =>
                                  handleUpdateHalo({
                                    secondaryIntensity: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 mb-0.5">FWHM (°)</span>
                              <input
                                type="number"
                                step="0.5"
                                value={draft.halo.secondaryFwhm}
                                onChange={(e) =>
                                  handleUpdateHalo({
                                    secondaryFwhm: Math.max(3, parseFloat(e.target.value) || 14),
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Background & Counting Statistics */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Background Baseline &amp; Poisson Noise
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-0.5">Baseline (cps)</span>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={draft.physics.bgConstant}
                        onChange={(e) =>
                          handleUpdatePhysics({ bgConstant: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-0.5">Slope</span>
                      <input
                        type="number"
                        step="10"
                        value={draft.physics.bgSlope}
                        onChange={(e) =>
                          handleUpdatePhysics({ bgSlope: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-0.5">Air Scatter</span>
                      <input
                        type="number"
                        step="20"
                        min="0"
                        value={draft.physics.bgLowAngleScatter}
                        onChange={(e) =>
                          handleUpdatePhysics({
                            bgLowAngleScatter: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.physics.noiseEnabled}
                        onChange={(e) => handleUpdatePhysics({ noiseEnabled: e.target.checked }, false)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Poisson counting noise (σ ∝ √I)</span>
                    </label>
                    {draft.physics.noiseEnabled && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePhysics({ noiseSeed: draft.physics.noiseSeed + 1 }, false)
                        }
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resample</span>
                      </button>
                    )}
                  </div>

                  {draft.physics.noiseEnabled && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Noise Amplitude Scale</span>
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {draft.physics.noiseScale.toFixed(2)}×
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.05"
                        value={draft.physics.noiseScale}
                        onChange={(e) =>
                          handleUpdatePhysics({ noiseScale: parseFloat(e.target.value) })
                        }
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== STEP 4: CRYSTALLINITY % & EXPORTS ==================== */}
            {step === 4 && (
              <div className="space-y-4 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    4. Degree of Crystallinity (Xc%) &amp; Export
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quantify crystalline vs. amorphous fraction with live area integration, convergence checks, and inverse target dialing.
                  </p>
                </div>

                {/* Scientific Definition Reference */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100">
                    Crystalline Percentage (Degree of Crystallinity):
                  </strong>{' '}
                  The proportion of a solid material that has atoms or molecules arranged in a regular, repeating crystal structure rather than a disordered amorphous state. It is most often expressed by{' '}
                  <strong>weight</strong>, <strong>volume</strong>, or <strong>mole fraction</strong> on a scale from{' '}
                  <span className="font-mono tabular-nums">0%</span> (fully amorphous) to{' '}
                  <span className="font-mono tabular-nums">100%</span> (fully crystalline).
                </div>

                {/* Live 0% - 100% Scale Meter + Direct Inverse Target Slider */}
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Active Basis · {basisLabel}
                      </div>
                      <div className="text-3xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400 mt-0.5">
                        {metrics.activeBasisPct.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Amorphous State
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">
                        {metrics.activeAmorphousPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Proportional Visual Bar */}
                  <div>
                    <div className="w-full h-3 rounded-full overflow-hidden bg-amber-500/30 dark:bg-amber-500/25 flex">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-150"
                        style={{ width: `${Math.max(0, Math.min(100, metrics.activeBasisPct))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>0% Fully Amorphous</span>
                      <span>50%</span>
                      <span>100% Fully Crystalline</span>
                    </div>
                  </div>

                  {/* Direct Inverse Target Dial */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Dial Exact Target Xc% ({basisLabel})
                      </span>
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {Math.round(metrics.activeBasisPct)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(metrics.activeBasisPct)}
                      onChange={(e) => handleTargetCrystallinityChange(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Observed State Coherence Check */}
                {classMismatch && (
                  <div className="p-3 rounded-lg border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <span>
                      Declared class is <strong className="capitalize">{draft.materialType}</strong>, but computed Xc ({metrics.activeBasisPct.toFixed(1)}%) behaves as{' '}
                      <strong className="capitalize">{metrics.observedClass}</strong>.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        commitDraft((prev) => ({ ...prev, materialType: metrics.observedClass }))
                      }
                      className="px-2.5 py-1 rounded border border-amber-400/70 bg-white/80 dark:bg-slate-900 text-amber-900 dark:text-amber-200 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sync Label
                    </button>
                  </div>
                )}

                {/* Cross-Validation & Quality Benchmarks */}
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/50 text-center">
                  <div className="p-2.5">
                    <div className="text-[10px] text-slate-500">Segal Height CI</div>
                    <div className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                      {metrics.segalIndexPct !== null ? `${metrics.segalIndexPct.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-[10px] text-slate-500">Mean Size ⟨D⟩</div>
                    <div className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                      {metrics.meanScherrerNm !== null ? `${metrics.meanScherrerNm.toFixed(1)} nm` : '—'}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-[10px] text-slate-500">Tail Truncation</div>
                    <div
                      className={`text-xs font-bold font-mono tabular-nums mt-0.5 ${
                        metrics.tailTruncationPct > 4
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {metrics.tailTruncationPct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Live Formula Breakdown */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sigma className="w-3.5 h-3.5 text-indigo-500" />
                    Integrated Area Formula Breakdown
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1 tabular-nums">
                    <div>Xc (%) = [ A_c / (A_c + A_a) ] × 100</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      A_c = ∫ I_cryst(2θ) d(2θ) ={' '}
                      <strong className="text-indigo-700 dark:text-indigo-400">
                        {metrics.areaCrystalline.toFixed(2)}
                      </strong>{' '}
                      cps·deg
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      A_a = ∫ I_amorph(2θ) d(2θ) ={' '}
                      <strong className="text-amber-700 dark:text-amber-400">
                        {metrics.areaAmorphous.toFixed(2)}
                      </strong>{' '}
                      cps·deg
                    </div>
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold">
                      Xc = ({metrics.areaCrystalline.toFixed(2)} / {metrics.areaTotal.toFixed(2)}) × 100 ={' '}
                      {metrics.crystallinityWeightPct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Integration Window Controls + Auto-Fit */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      2θ Integration Window
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {metrics.integrationMin.toFixed(1)}° – {metrics.integrationMax.toFixed(1)}°
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFitIntegrationWindow}
                        className="px-2 py-0.5 rounded border border-emerald-500/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Auto-Fit</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-1">Start 2θ (°)</span>
                      <input
                        type="range"
                        min={draft.physics.twoThetaMin}
                        max={draft.integrationWindow.maxTwoTheta - 2}
                        step="0.5"
                        value={draft.integrationWindow.minTwoTheta}
                        onChange={(e) =>
                          commitDraft(
                            (prev) => ({
                              ...prev,
                              integrationWindow: {
                                ...prev.integrationWindow,
                                minTwoTheta: parseFloat(e.target.value),
                              },
                            }),
                            { coalesce: true }
                          )
                        }
                        className="w-full accent-emerald-600"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-1">End 2θ (°)</span>
                      <input
                        type="range"
                        min={draft.integrationWindow.minTwoTheta + 2}
                        max={draft.physics.twoThetaMax}
                        step="0.5"
                        value={draft.integrationWindow.maxTwoTheta}
                        onChange={(e) =>
                          commitDraft(
                            (prev) => ({
                              ...prev,
                              integrationWindow: {
                                ...prev.integrationWindow,
                                maxTwoTheta: parseFloat(e.target.value),
                              },
                            }),
                            { coalesce: true }
                          )
                        }
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                  {(peaksExcludedCount > 0 || metrics.tailTruncationPct > 4) && (
                    <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {peaksExcludedCount > 0
                          ? `${peaksExcludedCount} active peak${peaksExcludedCount > 1 ? 's sit' : ' sits'} outside the integration window.`
                          : `${metrics.tailTruncationPct.toFixed(1)}% of Voigt peak tail area falls outside the integration window—click Auto-Fit to capture full tails.`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fraction Basis Switcher (Weight / Volume / Mole) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Expression Basis (Weight · Volume · Mole Fraction)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {(
                      [
                        { id: 'weight' as FractionBasis, label: 'Weight %', val: metrics.crystallinityWeightPct },
                        { id: 'volume' as FractionBasis, label: 'Volume %', val: metrics.crystallinityVolumePct },
                        { id: 'mole' as FractionBasis, label: 'Mole %', val: metrics.crystallinityMolePct },
                      ] as const
                    ).map((b) => {
                      const active = draft.fractionBasis === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() =>
                            commitDraft((prev) => ({ ...prev, fractionBasis: b.id }), { coalesce: false })
                          }
                          className={`px-2 py-1.5 rounded-md text-center transition-colors cursor-pointer ${
                            active
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-semibold whitespace-nowrap">{b.label}</div>
                          <div className="text-xs font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                            {b.val.toFixed(1)}%
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {draft.fractionBasis === 'volume' && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Crystalline Density ρ_c (g/cm³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={draft.constants.rhoCrystalline}
                          onChange={(e) =>
                            handleUpdateConstants({
                              rhoCrystalline: Math.max(0.1, parseFloat(e.target.value) || 1.0),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Amorphous Density ρ_a (g/cm³)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={draft.constants.rhoAmorphous}
                          onChange={(e) =>
                            handleUpdateConstants({
                              rhoAmorphous: Math.max(0.1, parseFloat(e.target.value) || 1.0),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}

                  {draft.fractionBasis === 'mole' && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Crystalline Molar Mass M_c (g/mol)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={draft.constants.molarMassCrystalline}
                          onChange={(e) =>
                            handleUpdateConstants({
                              molarMassCrystalline: Math.max(1, parseFloat(e.target.value) || 60),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Amorphous Molar Mass M_a (g/mol)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={draft.constants.molarMassAmorphous}
                          onChange={(e) =>
                            handleUpdateConstants({
                              molarMassAmorphous: Math.max(1, parseFloat(e.target.value) || 60),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Export & Report Actions */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Export Data &amp; Calculation Report
                    </span>
                    {downloadNotice && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        {downloadNotice}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Download CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadXY}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Download XY</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Crystallinity Report Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Copy Crystallinity Calculation Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer Navigation */}
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-400 disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-mono tabular-nums text-slate-500">
              Step {step} of 4
            </span>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>Next: {WIZARD_STEPS[step].title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Start New Curve
              </button>
            )}
          </div>
        </div>

        {/* RIGHT STAGE: Sticky Live Diffractogram & Peak Reference Summary */}
        <div className="flex-1 min-w-0 w-full space-y-5 xl:sticky xl:top-20">
          <DiffractogramViewport
            sampleName={draft.sampleName || 'Custom Sample'}
            materialType={draft.materialType}
            wavelengthA={activeWavelength}
            fractionBasis={draft.fractionBasis}
            result={synthesis}
            layers={layers}
            onToggleLayer={handleToggleLayer}
            placePeakMode={placePeakMode}
            onTogglePlacePeakMode={() => setPlacePeakMode((v) => !v)}
            onPlacePeakAt={handlePlacePeakOnPlot}
          />

          {/* Compact Scientific Peak & Area Decomposition Summary Table */}
          {metrics.peakSummaries.filter((p) => p.enabled).length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Active Bragg Reflections Summary
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {metrics.activePeakCount} peak{metrics.activePeakCount === 1 ? '' : 's'} · λ = {activeWavelength.toFixed(4)} Å
                  {metrics.meanScherrerNm ? ` · ⟨D⟩ = ${metrics.meanScherrerNm.toFixed(1)} nm` : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400">
                      <th className="py-2 px-4 font-semibold">(hkl)</th>
                      <th className="py-2 px-3 font-semibold text-right">2θ (°)</th>
                      <th className="py-2 px-3 font-semibold text-right">d (Å)</th>
                      <th className="py-2 px-3 font-semibold text-right">Q (Å⁻¹)</th>
                      <th className="py-2 px-3 font-semibold text-right">I_eff</th>
                      <th className="py-2 px-3 font-semibold text-right">β_eff (°)</th>
                      <th className="py-2 px-3 font-semibold text-right">β_int (°)</th>
                      <th className="py-2 px-4 font-semibold text-right">D (nm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
                    {metrics.peakSummaries
                      .filter((p) => p.enabled)
                      .map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                        >
                          <td className="py-2 px-4 font-semibold text-indigo-700 dark:text-indigo-400">
                            {p.hkl}
                          </td>
                          <td className="py-2 px-3 text-right">{p.twoTheta.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">{p.dSpacingA.toFixed(4)}</td>
                          <td className="py-2 px-3 text-right">{p.qValue.toFixed(3)}</td>
                          <td className="py-2 px-3 text-right">{p.attenuatedIntensity.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right">{p.effectiveFwhm.toFixed(3)}</td>
                          <td className="py-2 px-3 text-right">{p.integralBreadthDeg.toFixed(3)}</td>
                          <td className="py-2 px-4 text-right">
                            {p.scherrerSizeNm ? p.scherrerSizeNm.toFixed(1) : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XRDCurveBuilderModule;
