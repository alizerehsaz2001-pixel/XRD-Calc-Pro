import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Brush,
  AreaChart,
} from "recharts";
import {
  Activity,
  Maximize2,
  Minimize2,
  Sliders,
  Layers,
  Table,
  Download,
  Copy,
  Check,
  Compass,
  Crosshair,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  FileSpreadsheet,
  Camera,
  Search,
  X,
  RotateCcw,
  Sparkle,
  Sun,
  Moon,
  SlidersHorizontal,
  Waves,
  Eye,
  Settings2,
  Atom,
  TrendingUp,
  Focus,
  Gauge,
  ZoomIn,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DLPhaseCandidate } from "../../types";
import {
  detectDiffractionPeaks,
  calculateWilliamsonHall,
  optimizePhaseWeightsNNLS,
  DetectedPeak,
  WilliamsonHallResult,
} from "./xrdPhysicsEngine";
import { MicrostructureInspectorDrawer } from "./MicrostructureInspectorDrawer";
import { useSettings } from "../SettingsContext";
import { isDarkTheme } from "../../utils/themeSystem";

export type CoordinateSpace = "twoTheta" | "dSpacing" | "qVector";
export type IntensityScale = "linear" | "sqrt" | "log";
export type ResidualViewMode = "overlay" | "split" | "hidden";
export type ProfileShapeModel = "pseudoVoigt" | "pearson7" | "gaussian" | "lorentzian";
export type ThemeMode = "darkLab" | "publication";
export type CurvePrecisionMode = "benchmark" | "high" | "ultra" | "synchrotron";
export type CurveInterpolationType = "monotone" | "linear" | "natural";
export type CurveViewHeight = "standard" | "big" | "cinema";

export interface WavelengthPreset {
  id: string;
  name: string;
  lambda: number;
  description: string;
}

export const WAVELENGTH_PRESETS: WavelengthPreset[] = [
  { id: "cu_ka1", name: "Cu-Kα₁", lambda: 1.5406, description: "Copper K-alpha 1 (1.54060 Å, Standard Laboratory)" },
  { id: "cu_ka_avg", name: "Cu-Kα avg", lambda: 1.54184, description: "Weighted unresolved Cu doublet (1.54184 Å)" },
  { id: "co_ka1", name: "Co-Kα₁", lambda: 1.78901, description: "Cobalt K-alpha 1 (1.78901 Å, Fe-rich samples)" },
  { id: "fe_ka1", name: "Fe-Kα₁", lambda: 1.93604, description: "Iron K-alpha 1 (1.93604 Å)" },
  { id: "cr_ka1", name: "Cr-Kα₁", lambda: 2.2897, description: "Chromium K-alpha 1 (2.28970 Å, Residual Stress/Steels)" },
  { id: "mo_ka1", name: "Mo-Kα₁", lambda: 0.7093, description: "Molybdenum K-alpha 1 (0.70930 Å, High-energy / Capillary)" },
  { id: "custom", name: "Custom / Synchrotron", lambda: 1.0, description: "User-defined Synchrotron Wavelength" },
];

export interface CaliperPoint {
  twoTheta: number;
  intensity: number;
  dSpacing: number;
  q: number;
}

export interface SpectralAlignmentVisualizerProps {
  inputData?: string;
  parsedPoints: Array<{ twoTheta: number; intensity: number }>;
  selectedCandidate: DLPhaseCandidate | null;
  candidates?: DLPhaseCandidate[];
  onSelectCandidate?: (candidate: DLPhaseCandidate) => void;
  inputBroadening?: number;
  isSimulating?: boolean;
  scanPos?: number | null;
  pythonRAGResults?: any;
  wavelengthA?: number;
}

const PHASE_PALETTES = [
  { primary: "#f43f5e", fill: "#f43f5e", stroke: "#fda4af", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", name: "Ref 1 (Primary)" },
  { primary: "#10b981", fill: "#10b981", stroke: "#6ee7b7", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", name: "Ref 2" },
  { primary: "#f59e0b", fill: "#f59e0b", stroke: "#fcd34d", badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", name: "Ref 3" },
  { primary: "#a855f7", fill: "#a855f7", stroke: "#d8b4fe", badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", name: "Ref 4" },
  { primary: "#38bdf8", fill: "#38bdf8", stroke: "#7dd3fc", badge: "bg-sky-500/20 text-sky-300 border-sky-500/40", name: "Ref 5" },
];

export const SpectralAlignmentVisualizer: React.FC<SpectralAlignmentVisualizerProps> = ({
  inputData = "",
  parsedPoints,
  selectedCandidate,
  candidates = [],
  onSelectCandidate,
  inputBroadening = 0.18,
  isSimulating = false,
  scanPos = null,
  pythonRAGResults,
  wavelengthA,
}) => {
  // Visualizer Workspace State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [coordSpace, setCoordSpace] = useState<CoordinateSpace>("twoTheta");
  const [intensityScale, setIntensityScale] = useState<IntensityScale>("linear");
  const [residualView, setResidualView] = useState<ResidualViewMode>("overlay");
  
  // Scientific Graphics Theme & Profile Engine State (synced with global polarity, locally overridable)
  const { theme: globalTheme = "dark" } = useSettings();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    isDarkTheme(globalTheme) ? "darkLab" : "publication"
  );
  React.useEffect(() => {
    setThemeMode(isDarkTheme(globalTheme) ? "darkLab" : "publication");
  }, [globalTheme]);
  const [profileModel, setProfileModel] = useState<ProfileShapeModel>("pseudoVoigt");
  const [lorentzianFraction, setLorentzianFraction] = useState<number>(0.35); // eta = 0.35
  const [pearsonShapeM, setPearsonShapeM] = useState<number>(1.5); // Pearson VII exponent m
  const [enableKaDoublet, setEnableKaDoublet] = useState<boolean>(true); // Cu Ka1/Ka2 doublet splitting
  const [showIndividualPhases, setShowIndividualPhases] = useState<boolean>(true);
  const [showBraggComb, setShowBraggComb] = useState<boolean>(true);
  const [showBackgroundBaseline, setShowBackgroundBaseline] = useState<boolean>(false);
  const [subtractBackground, setSubtractBackground] = useState<boolean>(false);
  const [showProfileConfigPanel, setShowProfileConfigPanel] = useState<boolean>(false);
  const [zoomRangePreset, setZoomRangePreset] = useState<"all" | "low" | "mid" | "high">("all");

  // Ultra-High Precision Curve Engine & Display Sizing State
  const [curvePrecisionMode, setCurvePrecisionMode] = useState<CurvePrecisionMode>("ultra");
  const [curveInterpolation, setCurveInterpolation] = useState<CurveInterpolationType>("monotone");
  const [curveViewHeight, setCurveViewHeight] = useState<CurveViewHeight>("big");
  const [enableSuperSampling, setEnableSuperSampling] = useState<boolean>(true);
  const [showKaDoubletSplitCurves, setShowKaDoubletSplitCurves] = useState<boolean>(false);
  const [showPrecisionPanel, setShowPrecisionPanel] = useState<boolean>(false);
  const [inspectedPeak, setInspectedPeak] = useState<DetectedPeak | null>(null);
  const [showPeakApexModal, setShowPeakApexModal] = useState<boolean>(false);
  
  // Layer Toggles
  const [showExpPattern, setShowExpPattern] = useState<boolean>(true);
  const [showExpSticks, setShowExpSticks] = useState<boolean>(true);
  const [showCalcProfile, setShowCalcProfile] = useState<boolean>(true);
  const [showRefSticks, setShowRefSticks] = useState<boolean>(true);
  const [showHklBadges, setShowHklBadges] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showBrush, setShowBrush] = useState<boolean>(true);

  // Wavelength Selection (synced with upstream PhaseIDCoreControlStrip wavelengthA)
  const [selectedWavelengthId, setSelectedWavelengthId] = useState<string>("cu_ka1");
  const [customWavelength, setCustomWavelength] = useState<number>(wavelengthA || 1.5406);

  React.useEffect(() => {
    if (typeof wavelengthA !== "number" || !Number.isFinite(wavelengthA) || wavelengthA <= 0.05) return;
    const matched = WAVELENGTH_PRESETS.find((p) => Math.abs(p.lambda - wavelengthA) < 0.0025);
    if (matched) {
      setSelectedWavelengthId(matched.id);
      setCustomWavelength(matched.lambda);
    } else {
      setSelectedWavelengthId("custom");
      setCustomWavelength(Number(wavelengthA.toFixed(5)));
    }
  }, [wavelengthA]);

  const activeWavelength = useMemo(() => {
    if (selectedWavelengthId === "custom") {
      return customWavelength > 0.01 ? customWavelength : 1.5406;
    }
    const preset = WAVELENGTH_PRESETS.find((p) => p.id === selectedWavelengthId);
    return preset ? preset.lambda : 1.5406;
  }, [selectedWavelengthId, customWavelength]);

  // Calibration Controls (Zero-shift & Strain)
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0);
  const [latticeStrainPct, setLatticeStrainPct] = useState<number>(0);
  const [showCalibrationPanel, setShowCalibrationPanel] = useState<boolean>(false);
  const [isAutoAligning, setIsAutoAligning] = useState<boolean>(false);
  const [autoAlignStatus, setAutoAlignStatus] = useState<string | null>(null);

  // Multi-phase Co-Plotting
  const [multiPhaseMode, setMultiPhaseMode] = useState<boolean>(false);
  const [activePhaseNames, setActivePhaseNames] = useState<string[]>([]);
  const [phaseWeights, setPhaseWeights] = useState<Record<string, number>>({});

  // Caliper / Measurement Tool
  const [caliperActive, setCaliperActive] = useState<boolean>(false);
  const [caliperPt1, setCaliperPt1] = useState<CaliperPoint | null>(null);
  const [caliperPt2, setCaliperPt2] = useState<CaliperPoint | null>(null);

  // Reflection Table & Microstructure Inspector Drawer
  const [showReflectionTable, setShowReflectionTable] = useState<boolean>(false);
  const [showInspectorDrawer, setShowInspectorDrawer] = useState<boolean>(false);
  const [reflectionSearch, setReflectionSearch] = useState<string>("");
  const [focusedTwoTheta, setFocusedTwoTheta] = useState<number | null>(null);

  // Crystallite Domain Size & Microstructure Engine State
  const [instrumentalFwhm, setInstrumentalFwhm] = useState<number>(0.06); // NIST SRM 660 standard ~0.06 deg
  const [shapeFactorK, setShapeFactorK] = useState<number>(0.94); // Scherrer shape factor
  const [minProminencePct, setMinProminencePct] = useState<number>(2.5); // Peak detection prominence
  const [showPeakPins, setShowPeakPins] = useState<boolean>(true); // Diffractogram Peak Centroid Pins overlay

  // Multi-Phase Quantitative Optimization State
  const [isOptimizingFractions, setIsOptimizingFractions] = useState<boolean>(false);
  const [phaseFractionsOptimizationStatus, setPhaseFractionsOptimizationStatus] = useState<string | null>(null);

  // RAG Diagnostics Panel Toggle
  const [showRagDiagnostics, setShowRagDiagnostics] = useState<boolean>(true);

  // Export Menu
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Interactive Diagnostic Panel Probe States
  const [hoveredLagPoint, setHoveredLagPoint] = useState<{ shift: number; corr: number } | null>(null);
  const [hoveredPeakVector, setHoveredPeakVector] = useState<{
    hkl: string;
    refT: number;
    obsT: number;
    deltaDeg: number;
    deltaMilliDeg: number;
    refI: number;
  } | null>(null);
  const [hoveredCombPeak, setHoveredCombPeak] = useState<{
    phase: string;
    hkl: string;
    twoTheta: number;
    dSpacing: number;
    refI: number;
  } | null>(null);

  // Container reference for snapshot export and fullscreen
  const visualizerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  // Sync primary candidate into activePhaseNames
  React.useEffect(() => {
    if (selectedCandidate && !activePhaseNames.includes(selectedCandidate.phase_name)) {
      setActivePhaseNames([selectedCandidate.phase_name]);
    }
  }, [selectedCandidate]);

  // Physics Conversions
  const calcD = useCallback(
    (twoThetaDeg: number, lambda = activeWavelength): number => {
      if (!twoThetaDeg || twoThetaDeg <= 0.05 || twoThetaDeg >= 179.9) return 0;
      const thetaRad = ((twoThetaDeg / 2) * Math.PI) / 180;
      const sinT = Math.sin(thetaRad);
      if (sinT <= 0) return 0;
      return lambda / (2 * sinT);
    },
    [activeWavelength]
  );

  const calcQ = useCallback(
    (twoThetaDeg: number, lambda = activeWavelength): number => {
      const d = calcD(twoThetaDeg, lambda);
      if (d <= 0) return 0;
      return (2 * Math.PI) / d;
    },
    [calcD, activeWavelength]
  );

  const twoThetaFromD = useCallback(
    (d: number, lambda = activeWavelength): number => {
      if (!d || d <= 0) return 0;
      const sinT = lambda / (2 * d);
      if (sinT > 1 || sinT < 0) return 0;
      return 2 * (Math.asin(sinT) * 180) / Math.PI;
    },
    [activeWavelength]
  );

  // Map 2θ to active coordinate space value with full scientific precision (4-5 decimal places)
  const mapCoord = useCallback(
    (twoThetaDeg: number): number => {
      if (coordSpace === "twoTheta") return Number(twoThetaDeg.toFixed(4));
      if (coordSpace === "dSpacing") {
        const d = calcD(twoThetaDeg);
        return Number(d.toFixed(5));
      }
      if (coordSpace === "qVector") {
        const q = calcQ(twoThetaDeg);
        return Number(q.toFixed(4));
      }
      return twoThetaDeg;
    },
    [coordSpace, calcD, calcQ]
  );

  // Transform intensity according to selected scale with sub-count precision
  const transformIntensity = useCallback(
    (rawVal: number | null | undefined): number | null => {
      if (rawVal === null || rawVal === undefined) return null;
      const v = Math.max(0, rawVal);
      if (intensityScale === "linear") return Number(v.toFixed(2));
      if (intensityScale === "sqrt") return Number(Math.sqrt(v).toFixed(3));
      if (intensityScale === "log") return Number(Math.log10(v + 1).toFixed(4));
      return v;
    },
    [intensityScale]
  );

  const isDiscrete = parsedPoints.length > 0 && parsedPoints.length <= 50;

  // Gaussian FWHM calculation
  const effFwhm = typeof inputBroadening === "number" && inputBroadening > 0.02 ? inputBroadening : 0.18;
  const sigma = Math.max(0.02, effFwhm / 2.35482);
  const sigma22 = Math.max(0.0001, 2 * sigma * sigma);

  // Apply Zero-Shift and Lattice Strain to candidate reference reflections
  const getCalibratedRefPeaks = useCallback(
    (cand: DLPhaseCandidate | null) => {
      if (!cand || !cand.matched_peaks) return [];
      const strainFactor = 1 + latticeStrainPct / 100;
      
      return cand.matched_peaks.map((mp) => {
        const nominalD = calcD(mp.refT, activeWavelength);
        const strainedD = nominalD * strainFactor;
        const shiftedTwoTheta = strainedD > 0 ? twoThetaFromD(strainedD, activeWavelength) : mp.refT;
        const finalTwoTheta = shiftedTwoTheta + zeroShiftDeg;
        const hklStr =
          typeof mp.h === "number" && typeof mp.k === "number" && typeof mp.l === "number"
            ? `${mp.h}${mp.k}${mp.l}`
            : (mp as any).hkl || undefined;

        return {
          ...mp,
          hkl: hklStr,
          originalRefT: mp.refT,
          calibratedRefT: finalTwoTheta,
          calibratedD: strainedD,
        };
      });
    },
    [activeWavelength, calcD, twoThetaFromD, latticeStrainPct, zeroShiftDeg]
  );

  // Primary calibrated peaks
  const primaryCalibratedPeaks = useMemo(() => {
    return getCalibratedRefPeaks(selectedCandidate);
  }, [getCalibratedRefPeaks, selectedCandidate]);

  // Physical Pseudo-Voigt / Pearson VII peak calculation with optional Cu-Ka1/Ka2 doublet splitting returning sub-components
  const calcPeakProfileWithComponents = useCallback(
    (
      t: number,
      centerT: number,
      peakI: number,
      fwhm: number,
      eta: number,
      model: ProfileShapeModel,
      doublet: boolean,
      lambda: number
    ): { total: number; ka1: number; ka2: number } => {
      const sigmaVal = Math.max(0.005, fwhm / 2.35482);
      const sigmaSq2 = 2 * sigmaVal * sigmaVal;
      const mVal = Math.max(0.5, pearsonShapeM);
      const twoPowInvMMinus1 = Math.pow(2, 1 / mVal) - 1;

      const evalSingle = (delta: number): number => {
        if (model === "pearson7") {
          return Math.pow(1 + (4 * twoPowInvMMinus1 * delta * delta) / (fwhm * fwhm), -mVal);
        }
        const g = Math.exp(-Math.pow(delta, 2) / sigmaSq2);
        const l = 1 / (1 + 4 * Math.pow(delta / fwhm, 2));
        if (model === "gaussian") return g;
        if (model === "lorentzian") return l;
        return eta * l + (1 - eta) * g;
      };

      const diff1 = t - centerT;
      const shape1 = evalSingle(diff1);
      const val1 = Math.abs(diff1) < 5.5 * fwhm ? peakI * shape1 : 0;

      // Check if Cu-Ka doublet splitting applies
      const isCu = Math.abs(lambda - 1.5406) < 0.05 || Math.abs(lambda - 1.54184) < 0.05;
      if (!doublet || !isCu || centerT < 12) {
        return { total: val1, ka1: val1, ka2: 0 };
      }

      // Cu-Ka2 splitting: lambda2 = 1.54439 A, lambda1 = 1.54060 A, intensity ratio = 0.5
      const theta1Rad = ((centerT / 2) * Math.PI) / 180;
      const sinTheta2 = (1.54439 / 1.5406) * Math.sin(theta1Rad);
      if (sinTheta2 >= 1.0) {
        return { total: val1, ka1: val1, ka2: 0 };
      }

      const centerT2 = 2 * ((Math.asin(sinTheta2) * 180) / Math.PI);
      const diff2 = t - centerT2;
      const shape2 = evalSingle(diff2);
      const val2 = Math.abs(diff2) < 5.5 * fwhm ? peakI * 0.5 * shape2 : 0;

      const total = (val1 + val2) / 1.5;
      return { total, ka1: val1 / 1.5, ka2: val2 / 1.5 };
    },
    [pearsonShapeM]
  );

  const calcPeakProfile = useCallback(
    (
      t: number,
      centerT: number,
      peakI: number,
      fwhm: number,
      eta: number,
      model: ProfileShapeModel,
      doublet: boolean,
      lambda: number
    ): number => {
      return calcPeakProfileWithComponents(t, centerT, peakI, fwhm, eta, model, doublet, lambda).total;
    },
    [calcPeakProfileWithComponents]
  );

  // Monotone Cubic Hermite Interpolation for experimental diffractogram data
  const interpolateExperimental = useCallback(
    (pts: Array<{ twoTheta: number; intensity: number }>, targetT: number): number => {
      if (!pts.length) return 0;
      if (targetT <= pts[0].twoTheta) return pts[0].intensity;
      if (targetT >= pts[pts.length - 1].twoTheta) return pts[pts.length - 1].intensity;

      let low = 0;
      let high = pts.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (pts[mid].twoTheta < targetT) low = mid + 1;
        else high = mid - 1;
      }
      const i = Math.max(0, Math.min(pts.length - 2, high));
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const h = p2.twoTheta - p1.twoTheta;
      if (h <= 1e-7) return p1.intensity;

      const tNorm = (targetT - p1.twoTheta) / h;
      const m1 = (p2.intensity - p0.intensity) / Math.max(1e-7, p2.twoTheta - p0.twoTheta);
      const m2 = (p3.intensity - p1.intensity) / Math.max(1e-7, p3.twoTheta - p1.twoTheta);

      const t2 = tNorm * tNorm;
      const t3 = t2 * tNorm;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + tNorm;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      return Math.max(0, h00 * p1.intensity + h10 * h * m1 + h01 * p2.intensity + h11 * h * m2);
    },
    []
  );

  // Background baseline (air scattering + amorphous halo)
  const calcBackground = useCallback((t: number): number => {
    const air = 8.5 * Math.exp(-0.11 * t);
    const halo = 5.0 * Math.exp(-Math.pow(t - 24.5, 2) / 85);
    return air + halo + 1.2;
  }, []);

  // Active candidates list for multi-phase or single candidate
  const activeCandidates = useMemo(() => {
    return multiPhaseMode
      ? candidates.filter((c) => activePhaseNames.includes(c.phase_name))
      : selectedCandidate
      ? [selectedCandidate]
      : [];
  }, [multiPhaseMode, candidates, activePhaseNames, selectedCandidate]);

  // Current domain based on zoom presets
  const currentChartDomain = useMemo(() => {
    if (zoomRangePreset === "all") return ["dataMin", "dataMax"];
    if (coordSpace === "twoTheta") {
      if (zoomRangePreset === "low") return [10, 35];
      if (zoomRangePreset === "mid") return [20, 65];
      if (zoomRangePreset === "high") return [60, 100];
    } else if (coordSpace === "dSpacing") {
      if (zoomRangePreset === "low") return [calcD(35, activeWavelength), calcD(10, activeWavelength)];
      if (zoomRangePreset === "mid") return [calcD(65, activeWavelength), calcD(20, activeWavelength)];
      if (zoomRangePreset === "high") return [calcD(100, activeWavelength), calcD(60, activeWavelength)];
    } else if (coordSpace === "qVector") {
      if (zoomRangePreset === "low") return [calcQ(10, activeWavelength), calcQ(35, activeWavelength)];
      if (zoomRangePreset === "mid") return [calcQ(20, activeWavelength), calcQ(65, activeWavelength)];
      if (zoomRangePreset === "high") return [calcQ(60, activeWavelength), calcQ(100, activeWavelength)];
    }
    return ["dataMin", "dataMax"];
  }, [zoomRangePreset, coordSpace, activeWavelength, calcD, calcQ]);

  // High-Resolution Diffractogram Curve and Residual Generation
  const chartData = useMemo(() => {
    if (!parsedPoints.length) return [];

    const sortedPoints = [...parsedPoints].sort((a, b) => a.twoTheta - b.twoTheta);

    const precisionStep =
      curvePrecisionMode === "synchrotron"
        ? 0.002
        : curvePrecisionMode === "ultra"
        ? 0.005
        : curvePrecisionMode === "high"
        ? 0.01
        : 0.02;

    const evalTheoreticalComponents = (t: number) => {
      let totalRefI = 0;
      let totalKa1I = 0;
      let totalKa2I = 0;
      const phaseData: Record<string, number> = {};

      activeCandidates.forEach((cand, cIdx) => {
        const weight = phaseWeights[cand.phase_name] ?? 1.0;
        const peaks = getCalibratedRefPeaks(cand);
        let candI = 0;
        let candKa1 = 0;
        let candKa2 = 0;
        for (const p of peaks) {
          const comp = calcPeakProfileWithComponents(
            t,
            p.calibratedRefT,
            p.refI * weight,
            effFwhm,
            lorentzianFraction,
            profileModel,
            enableKaDoublet,
            activeWavelength
          );
          candI += comp.total;
          candKa1 += comp.ka1;
          candKa2 += comp.ka2;
        }
        phaseData[`phase_${cIdx}`] = transformIntensity(candI) as number;
        phaseData[`rawPhase_${cIdx}`] = Number(candI.toFixed(2));
        totalRefI += candI;
        totalKa1I += candKa1;
        totalKa2I += candKa2;
      });

      return { totalRefI, totalKa1I, totalKa2I, phaseData };
    };

    if (!isDiscrete) {
      if (enableSuperSampling && sortedPoints.length >= 2) {
        // High-Precision Continuous Hermite Super-Sampling
        const minT = sortedPoints[0].twoTheta;
        const maxT = sortedPoints[sortedPoints.length - 1].twoTheta;
        const span = maxT - minT;
        const targetSteps = Math.min(
          curvePrecisionMode === "synchrotron" ? 18000 : 12000,
          Math.max(800, Math.round(span / precisionStep))
        );
        const step = span / targetSteps;
        const data = [];

        for (let t = minT; t <= maxT; t += step) {
          const rawObs = interpolateExperimental(sortedPoints, t);
          const bg = calcBackground(t);
          const baseI = subtractBackground ? Math.max(0, rawObs - bg) : rawObs;
          const { totalRefI, totalKa1I, totalKa2I, phaseData } = evalTheoreticalComponents(t);
          const residual = selectedCandidate ? baseI - totalRefI : null;

          data.push({
            twoTheta: Number(t.toFixed(4)),
            coordX: mapCoord(t),
            rawIntensity: Number(baseI.toFixed(2)),
            intensity: transformIntensity(baseI),
            rawRefIntensity: Number(totalRefI.toFixed(2)),
            refIntensity: transformIntensity(totalRefI),
            rawRefKa1: Number(totalKa1I.toFixed(2)),
            refIntensityKa1: transformIntensity(totalKa1I),
            rawRefKa2: Number(totalKa2I.toFixed(2)),
            refIntensityKa2: transformIntensity(totalKa2I),
            rawResidual: residual !== null ? Number(residual.toFixed(2)) : null,
            residual: residual !== null ? transformIntensity(Math.abs(residual)) : null,
            signedResidual: residual !== null ? Number(residual.toFixed(2)) : null,
            baseline: transformIntensity(bg),
            rawBaseline: Number(bg.toFixed(2)),
            dSpacing: calcD(t),
            qVector: calcQ(t),
            ...phaseData,
          });
        }
        return data;
      }

      // Raw Point Evaluation without super-sampling
      return sortedPoints.map((p) => {
        const bg = calcBackground(p.twoTheta);
        const baseI = subtractBackground ? Math.max(0, p.intensity - bg) : p.intensity;
        const { totalRefI, totalKa1I, totalKa2I, phaseData } = evalTheoreticalComponents(p.twoTheta);
        const residual = selectedCandidate ? baseI - totalRefI : null;

        return {
          twoTheta: Number(p.twoTheta.toFixed(4)),
          coordX: mapCoord(p.twoTheta),
          rawIntensity: Number(baseI.toFixed(2)),
          intensity: transformIntensity(baseI),
          rawRefIntensity: Number(totalRefI.toFixed(2)),
          refIntensity: transformIntensity(totalRefI),
          rawRefKa1: Number(totalKa1I.toFixed(2)),
          refIntensityKa1: transformIntensity(totalKa1I),
          rawRefKa2: Number(totalKa2I.toFixed(2)),
          refIntensityKa2: transformIntensity(totalKa2I),
          rawResidual: residual !== null ? Number(residual.toFixed(2)) : null,
          residual: residual !== null ? transformIntensity(Math.abs(residual)) : null,
          signedResidual: residual !== null ? Number(residual.toFixed(2)) : null,
          baseline: transformIntensity(bg),
          rawBaseline: Number(bg.toFixed(2)),
          dSpacing: calcD(p.twoTheta),
          qVector: calcQ(p.twoTheta),
          ...phaseData,
        };
      });
    }

    // Discrete peak stick data: synthesize ultra-high precision continuous scientific diffractogram
    const minT = Math.max(5, Math.floor(sortedPoints[0].twoTheta - 4));
    const maxT = Math.min(120, Math.ceil(sortedPoints[sortedPoints.length - 1].twoTheta + 4));
    const span = maxT - minT;
    const targetSteps = Math.min(
      curvePrecisionMode === "synchrotron" ? 22000 : 14000,
      Math.max(1200, Math.round(span / precisionStep))
    );
    const step = span / targetSteps;
    const data = [];

    for (let t = minT; t <= maxT; t += step) {
      let expIntensity = 0;
      for (const p of sortedPoints) {
        expIntensity += calcPeakProfile(
          t,
          p.twoTheta,
          p.intensity,
          effFwhm,
          lorentzianFraction,
          profileModel,
          enableKaDoublet,
          activeWavelength
        );
      }

      const bg = calcBackground(t);
      const totalObs = subtractBackground ? expIntensity : expIntensity + (showBackgroundBaseline ? bg : 0);
      const { totalRefI, totalKa1I, totalKa2I, phaseData } = evalTheoreticalComponents(t);
      const residual = selectedCandidate ? totalObs - totalRefI : null;

      data.push({
        twoTheta: Number(t.toFixed(4)),
        coordX: mapCoord(t),
        rawIntensity: Number(totalObs.toFixed(2)),
        intensity: transformIntensity(totalObs),
        rawRefIntensity: Number(totalRefI.toFixed(2)),
        refIntensity: transformIntensity(totalRefI),
        rawRefKa1: Number(totalKa1I.toFixed(2)),
        refIntensityKa1: transformIntensity(totalKa1I),
        rawRefKa2: Number(totalKa2I.toFixed(2)),
        refIntensityKa2: transformIntensity(totalKa2I),
        rawResidual: residual !== null ? Number(residual.toFixed(2)) : null,
        residual: residual !== null ? transformIntensity(Math.abs(residual)) : null,
        signedResidual: residual !== null ? Number(residual.toFixed(2)) : null,
        baseline: transformIntensity(bg),
        rawBaseline: Number(bg.toFixed(2)),
        dSpacing: calcD(t),
        qVector: calcQ(t),
        ...phaseData,
      });
    }

    return data;
  }, [
    parsedPoints,
    isDiscrete,
    enableSuperSampling,
    curvePrecisionMode,
    activeCandidates,
    phaseWeights,
    selectedCandidate,
    getCalibratedRefPeaks,
    effFwhm,
    lorentzianFraction,
    profileModel,
    enableKaDoublet,
    activeWavelength,
    subtractBackground,
    showBackgroundBaseline,
    calcPeakProfile,
    calcPeakProfileWithComponents,
    interpolateExperimental,
    calcBackground,
    mapCoord,
    transformIntensity,
    calcD,
    calcQ,
  ]);

  // Real-time Scientific Metrics: R_wp, R_p, R_exp, Goodness-of-Fit (GOF), Durbin-Watson d-Stat, Cosine Similarity
  const alignmentMetrics = useMemo(() => {
    if (!chartData.length || !selectedCandidate) {
      return { rwp: 0, rp: 0, rexp: 0, gof: 1.0, durbinWatson: 2.0, cosine: 0, matchCount: 0 };
    }

    let sumDiffSq = 0;
    let sumObsSq = 0;
    let sumAbsDiff = 0;
    let sumObs = 0;
    let dotProduct = 0;
    let normObs = 0;
    let normCalc = 0;
    let validCount = 0;
    let sumRawResSq = 0;
    let sumAdjResDiffSq = 0;
    let prevRes: number | null = null;

    for (const d of chartData) {
      if (d.rawResidual !== null && d.rawIntensity !== null && d.rawRefIntensity !== null) {
        const obs = d.rawIntensity;
        const calc = d.rawRefIntensity;
        const diff = obs - calc;
        const weight = 1 / Math.max(1, obs);

        sumDiffSq += weight * diff * diff;
        sumObsSq += weight * obs * obs;
        sumAbsDiff += Math.abs(diff);
        sumObs += obs;

        dotProduct += obs * calc;
        normObs += obs * obs;
        normCalc += calc * calc;
        validCount++;

        sumRawResSq += diff * diff;
        if (prevRes !== null) {
          sumAdjResDiffSq += Math.pow(diff - prevRes, 2);
        }
        prevRes = diff;
      }
    }

    const rwp = sumObsSq > 0 ? Math.sqrt(sumDiffSq / sumObsSq) * 100 : 0;
    const rp = sumObs > 0 ? (sumAbsDiff / sumObs) * 100 : 0;
    const dof = Math.max(1, validCount - (primaryCalibratedPeaks.length + 3));
    const rexp = sumObsSq > 0 ? Math.sqrt(dof / sumObsSq) * 100 : 2.5;
    const normProduct = Math.sqrt(normObs * normCalc);
    const cosine = normProduct > 0 ? (dotProduct / normProduct) * 100 : 0;
    const gof = rexp > 0 ? Math.max(1.0, Math.min(9.99, rwp / Math.max(1.5, rexp))) : Math.max(1.0, 1.0 + rwp / 20);
    const durbinWatson = sumRawResSq > 1e-6 ? sumAdjResDiffSq / sumRawResSq : 2.0;

    return {
      rwp: Number(rwp.toFixed(2)),
      rp: Number(rp.toFixed(2)),
      rexp: Number(rexp.toFixed(2)),
      gof: Number(gof.toFixed(2)),
      durbinWatson: Number(durbinWatson.toFixed(2)),
      cosine: Number(cosine.toFixed(2)),
      matchCount: primaryCalibratedPeaks.length,
    };
  }, [chartData, selectedCandidate, primaryCalibratedPeaks]);

  // Cross-Correlation Function C(Δ2θ) & Peak-to-Peak Angular Discrepancy Vectors
  const crossCorrelationTelemetry = useMemo(() => {
    const lags: Array<{ shift: number; corr: number }> = [];
    const baseRefPeaks = selectedCandidate?.matched_peaks || [];
    let bestShift = 0;
    let bestCorr = -1;

    for (let i = -20; i <= 20; i++) {
      const s = Number((i * 0.03).toFixed(2));
      let score = 0;
      if (parsedPoints.length > 0 && baseRefPeaks.length > 0) {
        let sumOverlap = 0;
        let sumWeight = 0;
        for (const mp of baseRefPeaks) {
          const targetT = mp.refT + s;
          let minDiff = 999;
          for (const p of parsedPoints) {
            const d = Math.abs(p.twoTheta - targetT);
            if (d < minDiff) minDiff = d;
          }
          const w = Math.max(0.1, (mp.refI || 50) / 100);
          sumOverlap += w * Math.exp(-(minDiff * minDiff) / (2 * 0.14 * 0.14));
          sumWeight += w;
        }
        score = sumWeight > 0 ? (sumOverlap / sumWeight) * 100 : 50;
      } else {
        score = 96 * Math.exp(-(s * s) / (2 * 0.16 * 0.16));
      }
      const clamped = Number(Math.max(4, Math.min(99.9, score)).toFixed(1));
      lags.push({ shift: s, corr: clamped });
      if (clamped > bestCorr) {
        bestCorr = clamped;
        bestShift = s;
      }
    }

    const peakShiftVectors = primaryCalibratedPeaks.slice(0, 12).map((refP) => {
      let nearestExp = refP.calibratedRefT;
      let minAbs = 999;
      for (const p of parsedPoints) {
        const diff = p.twoTheta - refP.calibratedRefT;
        if (Math.abs(diff) < Math.abs(minAbs)) {
          minAbs = diff;
          nearestExp = p.twoTheta;
        }
      }
      const deltaDeg = minAbs < 2.0 ? Number(minAbs.toFixed(4)) : 0;
      const hklLabel =
        refP.h !== undefined && refP.k !== undefined && refP.l !== undefined
          ? `(${refP.h}${refP.k}${refP.l})`
          : refP.hkl
          ? `(${refP.hkl})`
          : `${refP.calibratedRefT.toFixed(1)}°`;
      return {
        hkl: hklLabel,
        refT: refP.calibratedRefT,
        obsT: nearestExp,
        deltaDeg,
        deltaMilliDeg: Math.round(deltaDeg * 1000),
        refI: refP.refI,
      };
    });

    const rmsShiftMilliDeg =
      peakShiftVectors.length > 0
        ? Math.round(
            Math.sqrt(
              peakShiftVectors.reduce((acc, v) => acc + v.deltaMilliDeg * v.deltaMilliDeg, 0) /
                peakShiftVectors.length
            )
          )
        : 0;

    return {
      lags,
      bestShift,
      bestCorr: Number(bestCorr.toFixed(1)),
      peakShiftVectors,
      rmsShiftMilliDeg,
    };
  }, [parsedPoints, selectedCandidate, primaryCalibratedPeaks]);

  // Anti-collision Staggering for Reflection Stick Badges
  const staggeredRefPeaks = useMemo(() => {
    if (!primaryCalibratedPeaks.length) return [];
    const sorted = [...primaryCalibratedPeaks].sort((a, b) => a.calibratedRefT - b.calibratedRefT);

    return sorted.map((curr, i) => {
      let tier = 0;
      if (i > 0) {
        const prev = sorted[i - 1];
        if (Math.abs(curr.calibratedRefT - prev.calibratedRefT) < 1.4) {
          tier = (i % 3) + 1;
        }
      }
      const badgeYOffset = tier === 0 ? -18 : tier === 1 ? -36 : tier === 2 ? -54 : -72;
      const hkl = curr.h !== undefined && curr.k !== undefined && curr.l !== undefined
        ? `${curr.h}${curr.k}${curr.l}`
        : undefined;

      return {
        ...curr,
        twoTheta: curr.calibratedRefT,
        coordX: mapCoord(curr.calibratedRefT),
        rawRefIntensity: curr.refI,
        refIntensity: transformIntensity(curr.refI),
        hkl,
        staggerTier: tier,
        badgeYOffset,
        dSpacing: curr.calibratedD,
      };
    });
  }, [primaryCalibratedPeaks, mapCoord, transformIntensity]);

  // Raw Input Experimental Sticks for discrete mode
  const rawInputSticks = useMemo(() => {
    if (!isDiscrete) return [];
    return parsedPoints.map((p) => ({
      twoTheta: p.twoTheta,
      coordX: mapCoord(p.twoTheta),
      rawIntensity: p.intensity,
      intensity: transformIntensity(p.intensity),
      dSpacing: calcD(p.twoTheta),
      qVector: calcQ(p.twoTheta),
    }));
  }, [isDiscrete, parsedPoints, mapCoord, transformIntensity, calcD, calcQ]);

  // Automated Peak Detection & Crystallite Size / Microstrain Engine
  const detectedPeaks = useMemo(() => {
    return detectDiffractionPeaks(chartData, {
      lambda: activeWavelength,
      instrumentalFwhm,
      shapeFactorK,
      minProminencePct,
      referencePeaks: primaryCalibratedPeaks,
    });
  }, [chartData, activeWavelength, instrumentalFwhm, shapeFactorK, minProminencePct, primaryCalibratedPeaks]);

  // Williamson-Hall Analysis Model
  const williamsonHall = useMemo(() => {
    return calculateWilliamsonHall(detectedPeaks, activeWavelength, shapeFactorK);
  }, [detectedPeaks, activeWavelength, shapeFactorK]);

  // Peak Pins data for ComposedChart Scatter overlay
  const peakPinsData = useMemo(() => {
    if (!showPeakPins || !detectedPeaks.length) return [];
    return detectedPeaks.map((p) => ({
      ...p,
      coordX: mapCoord(p.twoTheta),
      pinHeight: p.intensity,
      displayIntensity: transformIntensity(p.rawIntensity),
    }));
  }, [showPeakPins, detectedPeaks, mapCoord, transformIntensity]);

  // Multi-Phase Quantitative Optimization via Non-Negative Least Squares (NNLS)
  const handleAutoFitPhaseFractions = useCallback(() => {
    if (activeCandidates.length <= 1 || !chartData.length) return;
    setIsOptimizingFractions(true);
    setPhaseFractionsOptimizationStatus("Running Non-Negative Least Squares (NNLS) coordinate descent...");

    setTimeout(() => {
      const observed = chartData.map((d) => d.rawIntensity ?? 0);
      const phaseNames = activeCandidates.map((c) => c.phase_name);
      const phaseProfiles: number[][] = [];

      activeCandidates.forEach((cand) => {
        const peaks = getCalibratedRefPeaks(cand);
        const profile = chartData.map((d) => {
          let iVal = 0;
          for (const p of peaks) {
            iVal += calcPeakProfile(
              d.twoTheta,
              p.calibratedRefT,
              p.refI,
              effFwhm,
              lorentzianFraction,
              profileModel,
              enableKaDoublet,
              activeWavelength
            );
          }
          return iVal;
        });
        phaseProfiles.push(profile);
      });

      const result = optimizePhaseWeightsNNLS(observed, phaseProfiles, phaseNames, 40);
      setPhaseWeights((prev) => ({ ...prev, ...result.weights }));
      setIsOptimizingFractions(false);
      setPhaseFractionsOptimizationStatus(
        `NNLS Converged (${result.iterations} iters): Optimized Residual R_wp = ${result.rwp}%`
      );
      setTimeout(() => setPhaseFractionsOptimizationStatus(null), 5000);
    }, 400);
  }, [
    activeCandidates,
    chartData,
    getCalibratedRefPeaks,
    calcPeakProfile,
    effFwhm,
    lorentzianFraction,
    profileModel,
    enableKaDoublet,
    activeWavelength,
  ]);

  // Normalize Multi-Phase Fractions to standard scale
  const handleNormalizePhaseFractions = useCallback(() => {
    if (activeCandidates.length <= 1) return;
    const totalW = activeCandidates.reduce((acc, c) => acc + (phaseWeights[c.phase_name] ?? 1.0), 0);
    if (totalW <= 0) return;
    const targetTotal = activeCandidates.length;
    const newWeights: Record<string, number> = {};
    activeCandidates.forEach((c) => {
      const curr = phaseWeights[c.phase_name] ?? 1.0;
      newWeights[c.phase_name] = Number(((curr / totalW) * targetTotal).toFixed(2));
    });
    setPhaseWeights((prev) => ({ ...prev, ...newWeights }));
    setPhaseFractionsOptimizationStatus("Phase weight fractions normalized.");
    setTimeout(() => setPhaseFractionsOptimizationStatus(null), 3000);
  }, [activeCandidates, phaseWeights]);

  // Send point to Caliper Measurement Tool
  const handleSendToCaliper = useCallback((pt1: CaliperPoint, pt2?: CaliperPoint) => {
    setCaliperActive(true);
    setCaliperPt1(pt1);
    if (pt2) {
      setCaliperPt2(pt2);
    }
  }, []);

  // Auto-Align Optimization Algorithm
  const handleAutoAlign = useCallback(() => {
    if (!parsedPoints.length || !selectedCandidate?.matched_peaks?.length) return;
    setIsAutoAligning(true);
    setAutoAlignStatus("Running Grid-Search & Cross-Correlation Optimization...");

    setTimeout(() => {
      let bestShift = 0;
      let minLoss = Infinity;

      for (let s = -0.8; s <= 0.8; s += 0.02) {
        let loss = 0;
        let matched = 0;

        for (const mp of selectedCandidate.matched_peaks || []) {
          const shiftedRef = mp.refT + s;
          let closestDiff = Infinity;
          for (const p of parsedPoints) {
            const diff = Math.abs(p.twoTheta - shiftedRef);
            if (diff < closestDiff) closestDiff = diff;
          }
          if (closestDiff < 0.6) {
            loss += closestDiff * (mp.refI / 100);
            matched++;
          } else {
            loss += 1.0;
          }
        }

        if (matched > 0 && loss < minLoss) {
          minLoss = loss;
          bestShift = s;
        }
      }

      setZeroShiftDeg(Number(bestShift.toFixed(2)));
      setIsAutoAligning(false);
      setAutoAlignStatus(
        bestShift === 0
          ? "Optimal alignment already at zero offset"
          : `Aligned: Δ(2θ) corrected by ${bestShift > 0 ? "+" : ""}${bestShift.toFixed(2)}°`
      );

      setTimeout(() => setAutoAlignStatus(null), 4000);
    }, 400);
  }, [parsedPoints, selectedCandidate]);

  // Reset Calibration
  const handleResetCalibration = useCallback(() => {
    setZeroShiftDeg(0);
    setLatticeStrainPct(0);
    setAutoAlignStatus("Calibration parameters reset to standard reference values.");
    setTimeout(() => setAutoAlignStatus(null), 3000);
  }, []);

  // Caliper Tool Click Handling
  const handleChartClick = useCallback(
    (e: any) => {
      if (!caliperActive || !e || !e.activeLabel) return;
      const coordVal = Number(e.activeLabel);
      if (isNaN(coordVal)) return;

      let twoThetaVal = coordVal;
      if (coordSpace === "dSpacing") {
        twoThetaVal = twoThetaFromD(coordVal);
      } else if (coordSpace === "qVector") {
        const d = (2 * Math.PI) / coordVal;
        twoThetaVal = twoThetaFromD(d);
      }

      const matchPoint = chartData.find((p) => Math.abs(p.coordX - coordVal) < 0.05);
      const intensity = matchPoint ? matchPoint.rawIntensity : 0;
      const dSpacing = calcD(twoThetaVal);
      const q = calcQ(twoThetaVal);

      const newPoint: CaliperPoint = {
        twoTheta: Number(twoThetaVal.toFixed(2)),
        intensity: Number(intensity.toFixed(1)),
        dSpacing: Number(dSpacing.toFixed(4)),
        q: Number(q.toFixed(3)),
      };

      if (!caliperPt1 || (caliperPt1 && caliperPt2)) {
        setCaliperPt1(newPoint);
        setCaliperPt2(null);
      } else {
        setCaliperPt2(newPoint);
      }
    },
    [caliperActive, coordSpace, twoThetaFromD, chartData, calcD, calcQ, caliperPt1, caliperPt2]
  );

  // Caliper Delta Calculations
  const caliperDelta = useMemo(() => {
    if (!caliperPt1 || !caliperPt2) return null;
    const dTwoTheta = Math.abs(caliperPt2.twoTheta - caliperPt1.twoTheta);
    const dDSpacing = Math.abs(caliperPt2.dSpacing - caliperPt1.dSpacing);
    const dQ = Math.abs(caliperPt2.q - caliperPt1.q);
    const avgD = (caliperPt1.dSpacing + caliperPt2.dSpacing) / 2;
    const apparentStrain = avgD > 0 ? (dDSpacing / avgD) * 100 : 0;

    const avgThetaRad = ((caliperPt1.twoTheta + caliperPt2.twoTheta) / 4) * (Math.PI / 180);
    const kaDoubletSplit = 2 * ((1.54439 - 1.5406) / 1.5406) * Math.tan(avgThetaRad) * (180 / Math.PI);

    return {
      dTwoTheta: dTwoTheta.toFixed(3),
      dDSpacing: dDSpacing.toFixed(4),
      dQ: dQ.toFixed(3),
      apparentStrain: apparentStrain.toFixed(3),
      kaDoubletSplit: kaDoubletSplit.toFixed(3),
    };
  }, [caliperPt1, caliperPt2]);

  // Export CSV Data
  const handleExportCSV = useCallback(() => {
    if (!chartData.length) return;
    const baseHeaders = [
      "TwoTheta_deg",
      "d_spacing_Angstrom",
      "Q_inv_Angstrom",
      "I_obs",
      "I_calc_composite",
      "I_baseline",
      "I_residual",
    ];

    // Add individual phase column headers if multi-phase
    const phaseHeaders = activeCandidates.length > 1
      ? activeCandidates.map((c) => `I_${c.phase_name.replace(/[^a-zA-Z0-9]/g, "_")}`)
      : [];

    const headers = [...baseHeaders, ...phaseHeaders];

    const rows = chartData.map((d) => {
      const row = [
        d.twoTheta,
        d.dSpacing.toFixed(4),
        d.qVector.toFixed(4),
        d.rawIntensity,
        d.rawRefIntensity !== null ? d.rawRefIntensity : "",
        d.baseline !== null && d.baseline !== undefined ? d.baseline : "",
        d.signedResidual !== null ? d.signedResidual : "",
      ];

      if (activeCandidates.length > 1) {
        activeCandidates.forEach((c) => {
          const val = (d as any)[`rawPhase_${c.phase_name}`];
          row.push(val !== undefined && val !== null ? val : "");
        });
      }

      return row;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `xrd_alignment_${selectedCandidate?.phase_name || "spectrum"}_${activeWavelength}A.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chartData, selectedCandidate, activeWavelength, activeCandidates]);

  // Export SVG Snapshot
  const handleExportSVG = useCallback(() => {
    if (!chartWrapperRef.current) return;
    const svgEl = chartWrapperRef.current.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = svgUrl;
    link.download = `xrd_alignment_${selectedCandidate?.phase_name || "spectrum"}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(svgUrl);
  }, [selectedCandidate]);

  // Copy Summary to Clipboard
  const handleCopySummary = useCallback(() => {
    if (!selectedCandidate) return;

    const avgSize = detectedPeaks.length > 0
      ? (detectedPeaks.reduce((a, b) => a + b.crystalliteSizeNm, 0) / detectedPeaks.length).toFixed(1)
      : "N/A";
    const avgStrain = detectedPeaks.length > 0
      ? (detectedPeaks.reduce((a, b) => a + b.microstrainPct, 0) / detectedPeaks.length).toFixed(3)
      : "N/A";

    const summaryText = [
      `=============================================================`,
      `XRD SPECTRAL ALIGNMENT & MICROSTRUCTURE REPORT`,
      `Phase Name: ${selectedCandidate.phase_name}`,
      `Formula: ${selectedCandidate.formula || "N/A"}`,
      `Crystal System: ${selectedCandidate.crystalSystem || "N/A"}`,
      `Space Group: ${selectedCandidate.spaceGroup || "N/A"}`,
      `Radiation Source: ${activeWavelength.toFixed(5)} Å (${selectedWavelengthId})`,
      `Instrumental Broadening (β_inst): ${instrumentalFwhm.toFixed(3)}° 2θ`,
      `Profile Model: ${profileModel} (η=${Math.round(lorentzianFraction * 100)}%)`,
      `-------------------------------------------------------------`,
      `PROFILE METRICS (Rietveld / FullProf standard):`,
      `  R_wp (Weighted Profile Residual): ${alignmentMetrics.rwp}%`,
      `  R_p (Profile Residual): ${alignmentMetrics.rp}%`,
      `  Goodness of Fit (GOF / χ²): ${alignmentMetrics.gof}`,
      `  Spectral Cross-Correlation: ${alignmentMetrics.cosine}%`,
      `  Zero-Shift Correction: ${zeroShiftDeg > 0 ? "+" : ""}${zeroShiftDeg.toFixed(2)}° 2θ`,
      `  Lattice Strain: ${latticeStrainPct > 0 ? "+" : ""}${latticeStrainPct.toFixed(2)}%`,
      `  Matched Bragg Reflections: ${alignmentMetrics.matchCount}`,
      `-------------------------------------------------------------`,
      `MICROSTRUCTURE & CRYSTALLITE DOMAIN SIZE:`,
      `  Detected Peaks: ${detectedPeaks.length}`,
      `  Mean Scherrer Crystallite Size: ${avgSize} nm (K=${shapeFactorK})`,
      `  Mean Lattice Microstrain (Stokes-Wilson): ${avgStrain}%`,
      ...(williamsonHall
        ? [
            `  Williamson-Hall Model: ${williamsonHall.equation}`,
            `  W-H Domain Size: ${williamsonHall.crystalliteSizeNm} nm`,
            `  W-H Microstrain: ${williamsonHall.microstrainPct}%`,
            `  W-H Linear Fit R²: ${williamsonHall.rSquared}`,
          ]
        : []),
      ...(activeCandidates.length > 1
        ? [
            `-------------------------------------------------------------`,
            `MULTI-PHASE QUANTITATIVE FRACTIONS:`,
            ...activeCandidates.map((c) => {
              const w = phaseWeights[c.phase_name] ?? 1.0;
              const totalW = activeCandidates.reduce((acc, curr) => acc + (phaseWeights[curr.phase_name] ?? 1.0), 0);
              const pct = totalW > 0 ? ((w / totalW) * 100).toFixed(1) : "0.0";
              return `  ${c.phase_name}: ${pct}% (weight: ${w.toFixed(2)})`;
            }),
          ]
        : []),
      `=============================================================`,
    ].join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  }, [
    selectedCandidate,
    activeWavelength,
    selectedWavelengthId,
    instrumentalFwhm,
    profileModel,
    lorentzianFraction,
    alignmentMetrics,
    zeroShiftDeg,
    latticeStrainPct,
    detectedPeaks,
    shapeFactorK,
    williamsonHall,
    activeCandidates,
    phaseWeights,
  ]);

  // Filter reflections for inspector table
  const filteredReflections = useMemo(() => {
    return staggeredRefPeaks.filter((p) => {
      if (!reflectionSearch.trim()) return true;
      const term = reflectionSearch.toLowerCase();
      const hklMatch = p.hkl && p.hkl.toLowerCase().includes(term);
      const angleMatch = p.twoTheta.toFixed(2).includes(term);
      const dMatch = p.dSpacing.toFixed(3).includes(term);
      return hklMatch || angleMatch || dMatch;
    });
  }, [staggeredRefPeaks, reflectionSearch]);

  // Residual Difference Distribution Telemetry (for Split Residual Console)
  const residualStats = useMemo(() => {
    let maxPos = 0;
    let maxNeg = 0;
    let sumSq = 0;
    let sum = 0;
    let count = 0;
    for (const d of chartData) {
      if (typeof d.signedResidual === "number" && Number.isFinite(d.signedResidual)) {
        const r = d.signedResidual;
        if (r > maxPos) maxPos = r;
        if (r < maxNeg) maxNeg = r;
        sumSq += r * r;
        sum += r;
        count++;
      }
    }
    return {
      maxPos: Number(maxPos.toFixed(2)),
      maxNeg: Number(maxNeg.toFixed(2)),
      rms: count > 0 ? Number(Math.sqrt(sumSq / count).toFixed(2)) : 0,
      meanBias: count > 0 ? Number((sum / count).toFixed(2)) : 0,
    };
  }, [chartData]);

  // Custom Scientific Tooltip
  const CustomCrystallographicTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const coordVal = Number(label || 0);

    let twoTheta = coordVal;
    let dVal = 0;
    let qVal = 0;

    if (coordSpace === "twoTheta") {
      twoTheta = coordVal;
      dVal = calcD(twoTheta);
      qVal = calcQ(twoTheta);
    } else if (coordSpace === "dSpacing") {
      dVal = coordVal;
      twoTheta = twoThetaFromD(dVal);
      qVal = dVal > 0 ? (2 * Math.PI) / dVal : 0;
    } else if (coordSpace === "qVector") {
      qVal = coordVal;
      dVal = qVal > 0 ? (2 * Math.PI) / qVal : 0;
      twoTheta = twoThetaFromD(dVal);
    }

    const refPeak = staggeredRefPeaks.find((r) => Math.abs(r.coordX - coordVal) < 0.1);
    const nearbyDetectedPeak = detectedPeaks.find((p) => Math.abs(mapCoord(p.twoTheta) - coordVal) < 0.12);
    const isLight = themeMode === "publication";

    return (
      <div
        className={`p-3 rounded-lg border text-xs min-w-[272px] z-50 pointer-events-none font-mono tabular-nums ${
          isLight
            ? "bg-white/98 text-slate-900 border-slate-300 shadow-lg"
            : "bg-[#090E1A]/98 text-slate-100 border-slate-700 shadow-xl"
        }`}
      >
        <div
          className={`flex justify-between items-center mb-2.5 pb-2 border-b ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <span className={`font-semibold text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {coordSpace === "twoTheta" ? "Bragg Angle (2θ)" : coordSpace === "dSpacing" ? "d-spacing" : "Scattering Q"}
          </span>
          <span className={`font-bold text-xs ${isLight ? "text-cyan-700" : "text-cyan-300"}`}>
            {coordSpace === "twoTheta"
              ? `${twoTheta.toFixed(4)}°`
              : coordSpace === "dSpacing"
              ? `${dVal.toFixed(5)} Å`
              : `${qVal.toFixed(4)} Å⁻¹`}
          </span>
        </div>

        <div
          className={`grid grid-cols-2 gap-x-4 gap-y-1.5 mb-2.5 pb-2.5 border-b text-[11px] ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex justify-between">
            <span className="text-slate-500">2θ</span>
            <span className={isLight ? "text-slate-900 font-semibold" : "text-slate-100 font-semibold"}>
              {twoTheta.toFixed(4)}°
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">d</span>
            <span className={isLight ? "text-emerald-700 font-semibold" : "text-emerald-400 font-semibold"}>
              {dVal > 0 ? `${dVal.toFixed(4)} Å` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Q</span>
            <span className={isLight ? "text-sky-700 font-semibold" : "text-sky-400 font-semibold"}>
              {qVal > 0 ? `${qVal.toFixed(4)} Å⁻¹` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">λ</span>
            <span className={isLight ? "text-slate-700" : "text-slate-300"}>{activeWavelength.toFixed(4)} Å</span>
          </div>
        </div>

        {refPeak && (
          <div
            className={`flex items-center justify-between px-2 py-1 rounded-md border mb-2 text-[11px] ${
              isLight
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span className="font-medium">Indexed Reflection</span>
            <span className="font-bold">
              {refPeak.hkl ? `(${refPeak.hkl})` : "Ref"} · {refPeak.calibratedRefT.toFixed(3)}°
            </span>
          </div>
        )}

        {nearbyDetectedPeak && (
          <div
            className={`flex items-center justify-between px-2 py-1 rounded-md border mb-2 text-[11px] ${
              isLight
                ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
            }`}
          >
            <span className="font-medium">Profile Fit</span>
            <span className="font-semibold">
              FWHM {nearbyDetectedPeak.fwhmObs.toFixed(3)}° · D {nearbyDetectedPeak.crystalliteSizeNm} nm
            </span>
          </div>
        )}

        <div className="space-y-1">
          {payload.map((p: any, idx: number) => (
            <div
              key={`tooltip-p-${idx}`}
              className="flex items-center justify-between gap-4 py-0.5 text-[11px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-0.5 shrink-0" style={{ backgroundColor: p.color }} />
                <span className={`truncate max-w-[150px] ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {p.name}
                </span>
              </div>
              <span className="font-semibold shrink-0" style={{ color: p.color }}>
                {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
                <span className="text-[10px] font-normal text-slate-500 ml-1">
                  {intensityScale === "linear" ? "cps" : intensityScale === "sqrt" ? "√cps" : "log"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const activeWavelengthPreset = WAVELENGTH_PRESETS.find((p) => p.id === selectedWavelengthId);
  const fitStateLabel =
    alignmentMetrics.rwp <= 12 && crossCorrelationTelemetry.rmsShiftMilliDeg <= 60
      ? { text: "Nominal Fit", cls: "text-emerald-400" }
      : alignmentMetrics.rwp <= 25 && crossCorrelationTelemetry.rmsShiftMilliDeg <= 140
      ? { text: "Moderate Fit", cls: "text-cyan-400" }
      : { text: "Check Offset", cls: "text-amber-400" };

  return (
    <div
      ref={visualizerRef}
      className={`relative flex flex-col gap-3.5 transition-colors duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#060911] p-5 sm:p-6 overflow-y-auto"
          : "bg-[#070A12] p-4 sm:p-5 rounded-lg border border-slate-800 overflow-hidden"
      }`}
    >
      {/* TOP INSTRUMENT HEADER BAR */}
      <div className="flex flex-col gap-3 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 bg-[#0B101B] rounded-lg border border-slate-800">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight leading-snug">
                Spectral Cross-Correlation, Peak Deconvolution &amp; Residual Difference Console
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                <span className="text-slate-300">{activeWavelengthPreset?.name || "Custom"}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>λ = {activeWavelength.toFixed(4)} Å</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>
                  {profileModel === "pseudoVoigt"
                    ? `Pseudo-Voigt (η = ${Math.round(lorentzianFraction * 100)}%)`
                    : profileModel === "pearson7"
                    ? `Pearson VII (m = ${pearsonShapeM.toFixed(1)})`
                    : profileModel === "gaussian"
                    ? "Gaussian"
                    : "Lorentzian"}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>
                  {curvePrecisionMode === "synchrotron"
                    ? "0.002°"
                    : curvePrecisionMode === "ultra"
                    ? "0.005°"
                    : curvePrecisionMode === "high"
                    ? "0.010°"
                    : "0.020°"}{" "}
                  mesh
                </span>
              </div>
            </div>
          </div>

          {/* Primary Instrument Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Wavelength Anode Selector (+ Inline Custom Input) */}
            <div className="flex items-center bg-[#070A12] px-2.5 py-1.5 rounded-md border border-slate-800 font-mono text-xs tabular-nums">
              <span className="text-slate-400 mr-1.5 whitespace-nowrap">λ</span>
              <select
                value={selectedWavelengthId}
                onChange={(e) => setSelectedWavelengthId(e.target.value)}
                aria-label="X-ray Anode Wavelength"
                className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer"
              >
                {WAVELENGTH_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0B101B] text-slate-200">
                    {p.name} ({p.lambda} Å)
                  </option>
                ))}
              </select>
              {selectedWavelengthId === "custom" && (
                <input
                  type="number"
                  step="0.0001"
                  min="0.1"
                  max="5.0"
                  value={customWavelength}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v)) setCustomWavelength(v);
                  }}
                  aria-label="Custom synchrotron wavelength in Angstroms"
                  className="ml-2 w-20 px-1.5 py-0.5 rounded bg-[#0B101B] border border-slate-700 text-cyan-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>

            {/* Caliper Measure Mode */}
            <button
              type="button"
              onClick={() => {
                setCaliperActive(!caliperActive);
                if (caliperActive) {
                  setCaliperPt1(null);
                  setCaliperPt2(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                caliperActive
                  ? "bg-amber-500/15 text-amber-200 border-amber-500/60"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Activate Peak Caliper to measure 2θ and d-spacing intervals"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Caliper</span>
            </button>

            {/* Calibration Sliders Panel Toggle */}
            <button
              type="button"
              onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                showCalibrationPanel || zeroShiftDeg !== 0 || latticeStrainPct !== 0
                  ? "bg-cyan-500/15 text-cyan-200 border-cyan-500/60"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Adjust Zero-Shift Offset and Uniform Lattice Strain"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calibration</span>
            </button>

            {/* Microstructure & Crystallite Suite Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowInspectorDrawer(!showInspectorDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                showInspectorDrawer
                  ? "bg-cyan-600 text-white border-cyan-500"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Open Scherrer Domain Size, Williamson-Hall & Multi-Phase Analysis Suite"
            >
              <Atom className="w-3.5 h-3.5 text-cyan-400" />
              <span className="tabular-nums">Microstructure ({detectedPeaks.length})</span>
            </button>

            {/* Reflection Table Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowReflectionTable(!showReflectionTable)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                showReflectionTable
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Open Indexed Reflections (hkl) Matching Table"
            >
              <Table className="w-3.5 h-3.5 text-slate-400" />
              <span className="tabular-nums">hkl Table ({staggeredRefPeaks.length})</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-800 bg-[#070A12] hover:bg-slate-900 hover:border-slate-700 text-slate-200 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full mt-1.5 w-56 bg-[#0B101B] border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Export Aligned CSV (XY)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportSVG();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Export Publication SVG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopySummary();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      {copiedNotification ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{copiedNotification ? "Copied to Clipboard" : "Copy Report Summary"}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-md border border-slate-800 bg-[#070A12] hover:bg-slate-900 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Workbench"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Workbench"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* UNIFIED 6-COLUMN RIETVELD TELEMETRY RIBBON */}
        {selectedCandidate && (
          <div className="bg-[#0B101B] border border-slate-800 rounded-lg overflow-hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
            {/* 1. Target Reference */}
            <div className="p-3.5 flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Target Reference</span>
                <span className={`font-mono font-medium ${fitStateLabel.cls}`}>{fitStateLabel.text}</span>
              </div>
              <span className="text-sm font-semibold text-slate-100 truncate mt-1" title={selectedCandidate.phase_name}>
                {selectedCandidate.phase_name}
              </span>
              <span className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                {selectedCandidate.formula || "Crystalline"} · {selectedCandidate.spaceGroup || selectedCandidate.crystalSystem || "P1"}
              </span>
            </div>

            {/* 2. Weighted Profile Factor R_wp */}
            <div className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Weighted R<sub>wp</sub>
                </span>
                <span className="font-mono tabular-nums text-slate-400">
                  R<sub>exp</sub> {alignmentMetrics.rexp.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-baseline mt-1">
                <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  {alignmentMetrics.rwp.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-400 transition-all duration-200"
                  style={{ width: `${Math.max(8, Math.min(100, 100 - alignmentMetrics.rwp * 1.5))}%` }}
                />
              </div>
            </div>

            {/* 3. Goodness of Fit S (chi) */}
            <div className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Goodness S (χ)</span>
                <span className="font-mono tabular-nums text-slate-400">DW {alignmentMetrics.durbinWatson.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline mt-1">
                <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  {alignmentMetrics.gof.toFixed(2)}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums mt-1">
                Profile R<sub>p</sub> = {alignmentMetrics.rp.toFixed(2)}%
              </span>
            </div>

            {/* 4. Spectral Cosine Similarity */}
            <div className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Spectral Cosine</span>
                <span className="font-mono text-slate-400">cos(θ)</span>
              </div>
              <div className="flex items-baseline mt-1">
                <span className="text-xl font-mono font-semibold text-cyan-300 tabular-nums">
                  {alignmentMetrics.cosine.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${Math.max(5, Math.min(100, alignmentMetrics.cosine))}%` }}
                />
              </div>
            </div>

            {/* 5. Goniometer Calibration Shift */}
            <div className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Goniometer Shift</span>
                <button
                  type="button"
                  onClick={handleAutoAlign}
                  disabled={isAutoAligning}
                  className="text-[11px] font-mono font-medium text-cyan-400 hover:text-cyan-200 underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  title="Run cross-correlation zero-shift optimization"
                >
                  {isAutoAligning ? "Aligning..." : "Auto-Align"}
                </button>
              </div>
              <div className="flex items-baseline mt-1">
                <span
                  className={`text-xl font-mono font-semibold tabular-nums ${
                    zeroShiftDeg !== 0 ? "text-amber-300" : "text-slate-100"
                  }`}
                >
                  {zeroShiftDeg > 0 ? "+" : ""}
                  {zeroShiftDeg.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">° 2θ</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums mt-1">
                Strain ε = {latticeStrainPct > 0 ? "+" : ""}
                {latticeStrainPct.toFixed(2)}%
              </span>
            </div>

            {/* 6. Indexed Reflections */}
            <div className="p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Indexed (hkl)</span>
                <span className="font-mono tabular-nums text-slate-400">
                  RMS ±{crossCorrelationTelemetry.rmsShiftMilliDeg} m°
                </span>
              </div>
              <div className="flex items-baseline mt-1">
                <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  {alignmentMetrics.matchCount}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1.5">lines</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums mt-1">
                FWHM = {effFwhm.toFixed(2)}° 2θ
              </span>
            </div>
          </div>
        )}

        {/* INTERACTIVE DIAGNOSTIC CONSOLE: CROSS-CORRELATION C(Δ2θ) & REFLECTION SHIFT MAP Δ2θ_hkl */}
        {selectedCandidate && (
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#0B101B] border border-slate-800 rounded-lg overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
            {/* Panel A: Spectral Cross-Correlation Response C(Δ2θ) */}
            <div className="lg:col-span-6 p-3.5 flex flex-col justify-between gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-200">A. Spectral Cross-Correlation</span>
                  <span className="font-mono text-[11px] text-slate-400">C(Δ2θ)</span>
                </div>
                <div className="flex items-center gap-2.5 font-mono text-[11px] tabular-nums">
                  {hoveredLagPoint ? (
                    <span className="text-cyan-300">
                      Probe {hoveredLagPoint.shift >= 0 ? "+" : ""}
                      {hoveredLagPoint.shift.toFixed(2)}° · {hoveredLagPoint.corr.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Optimal{" "}
                      <strong className="text-emerald-400 font-semibold">
                        {crossCorrelationTelemetry.bestShift >= 0 ? "+" : ""}
                        {crossCorrelationTelemetry.bestShift.toFixed(2)}° ({crossCorrelationTelemetry.bestCorr.toFixed(1)}%)
                      </strong>
                    </span>
                  )}
                  {Math.abs(zeroShiftDeg - crossCorrelationTelemetry.bestShift) > 0.01 && (
                    <button
                      type="button"
                      onClick={() => setZeroShiftDeg(crossCorrelationTelemetry.bestShift)}
                      className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Snap Optimal
                    </button>
                  )}
                  {zeroShiftDeg !== 0 && (
                    <button
                      type="button"
                      onClick={() => setZeroShiftDeg(0)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                      title="Reset zero-shift to 0.00°"
                    >
                      0°
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#060911] border border-slate-800/90 rounded-md px-2 py-1.5">
                <svg
                  viewBox="0 0 480 124"
                  className="w-full h-32 select-none cursor-crosshair"
                  role="img"
                  aria-label="Spectral Cross-Correlation Function vs Angular Lag"
                  onMouseLeave={() => setHoveredLagPoint(null)}
                >
                  <defs>
                    <linearGradient id="xcorrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Y-Gridlines (100%, 50%, 0%) */}
                  {[
                    { y: 18, label: "100%" },
                    { y: 58, label: "50%" },
                    { y: 98, label: "0%" },
                  ].map((row) => (
                    <g key={row.label}>
                      <line
                        x1="38"
                        y1={row.y}
                        x2="464"
                        y2={row.y}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray={row.y === 98 ? undefined : "2 3"}
                      />
                      <text x="32" y={row.y + 3} textAnchor="end" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                        {row.label}
                      </text>
                    </g>
                  ))}

                  {/* X-Axis Tick Lines & Labels */}
                  {[
                    { lag: -0.6, x: 38, label: "-0.60°" },
                    { lag: -0.3, x: 144.5, label: "-0.30°" },
                    { lag: 0.0, x: 251, label: "0.00°" },
                    { lag: 0.3, x: 357.5, label: "+0.30°" },
                    { lag: 0.6, x: 464, label: "+0.60°" },
                  ].map((tick) => (
                    <g key={tick.label}>
                      <line
                        x1={tick.x}
                        y1="14"
                        x2={tick.x}
                        y2="101"
                        stroke={tick.lag === 0 ? "#475569" : "#1e293b"}
                        strokeWidth={tick.lag === 0 ? "1" : "0.7"}
                        strokeDasharray="3 3"
                      />
                      <text
                        x={tick.x}
                        y="116"
                        textAnchor={tick.lag === -0.6 ? "start" : tick.lag === 0.6 ? "end" : "middle"}
                        fill={tick.lag === 0 ? "#cbd5e1" : "#64748b"}
                        fontSize="8.5"
                        fontFamily="monospace"
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}

                  {/* Area & Curve of C(Δ2θ) */}
                  <polygon
                    fill="url(#xcorrAreaGrad)"
                    points={`38,98 ${crossCorrelationTelemetry.lags
                      .map((pt, idx) => {
                        const px = 38 + (idx / Math.max(1, crossCorrelationTelemetry.lags.length - 1)) * 426;
                        const py = 98 - (pt.corr / 100) * 80;
                        return `${px.toFixed(1)},${py.toFixed(1)}`;
                      })
                      .join(" ")} 464,98`}
                  />
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    points={crossCorrelationTelemetry.lags
                      .map((pt, idx) => {
                        const px = 38 + (idx / Math.max(1, crossCorrelationTelemetry.lags.length - 1)) * 426;
                        const py = 98 - (pt.corr / 100) * 80;
                        return `${px.toFixed(1)},${py.toFixed(1)}`;
                      })
                      .join(" ")}
                  />

                  {/* Optimal Lag Marker */}
                  {(() => {
                    const optX = Math.max(38, Math.min(464, 251 + (crossCorrelationTelemetry.bestShift / 0.6) * 213));
                    const optY = 98 - (crossCorrelationTelemetry.bestCorr / 100) * 80;
                    return (
                      <g>
                        <line x1={optX} y1={optY} x2={optX} y2="98" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2 2" />
                        <circle cx={optX} cy={optY} r="4" fill="#10b981" stroke="#060911" strokeWidth="1.5" />
                      </g>
                    );
                  })()}

                  {/* Hovered Probe Line */}
                  {hoveredLagPoint && (() => {
                    const hx = Math.max(38, Math.min(464, 251 + (hoveredLagPoint.shift / 0.6) * 213));
                    const hy = 98 - (hoveredLagPoint.corr / 100) * 80;
                    return (
                      <g className="pointer-events-none">
                        <line x1={hx} y1="14" x2={hx} y2="98" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
                        <circle cx={hx} cy={hy} r="3.5" fill="#22d3ee" stroke="#060911" strokeWidth="1.2" />
                      </g>
                    );
                  })()}

                  {/* Active Zero-Shift Cursor (edge-clamped badge) */}
                  {(() => {
                    const curX = Math.max(38, Math.min(464, 251 + (zeroShiftDeg / 0.6) * 213));
                    const labelX = Math.max(62, Math.min(440, curX));
                    return (
                      <g className="pointer-events-none">
                        <line x1={curX} y1="18" x2={curX} y2="98" stroke="#f59e0b" strokeWidth="1.6" />
                        <rect x={labelX - 24} y="3" width="48" height="14" rx="2" fill="#0B101B" stroke="#f59e0b" strokeWidth="0.9" />
                        <text x={labelX} y="12.5" textAnchor="middle" fill="#fcd34d" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                          {zeroShiftDeg >= 0 ? `+${zeroShiftDeg.toFixed(2)}°` : `${zeroShiftDeg.toFixed(2)}°`}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Interactive Scrubbing Hit Columns (Click to Set Zero-Shift) */}
                  {crossCorrelationTelemetry.lags.map((pt, idx) => {
                    const stepW = 426 / Math.max(1, crossCorrelationTelemetry.lags.length - 1);
                    const px = 38 + idx * stepW;
                    return (
                      <rect
                        key={`lag-hit-${idx}`}
                        x={px - stepW / 2}
                        y="12"
                        width={stepW}
                        height="90"
                        fill="transparent"
                        onMouseEnter={() => setHoveredLagPoint(pt)}
                        onClick={() => setZeroShiftDeg(pt.shift)}
                      >
                        <title>{`Click to apply Δ2θ = ${pt.shift >= 0 ? "+" : ""}${pt.shift.toFixed(2)}° (C = ${pt.corr.toFixed(1)}%)`}</title>
                      </rect>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Click along curve to apply goniometer zero-shift</span>
                <span className="font-mono text-slate-400">Emerald = Optimal · Amber = Active Δ2θ</span>
              </div>
            </div>

            {/* Panel B: Bragg Reflection Angular Discrepancy Map Δ2θ_hkl */}
            <div className="lg:col-span-6 p-3.5 flex flex-col justify-between gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-200">B. Bragg Reflection Residual Shift</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Δ2θ<sub>hkl</sub> = 2θ<sub>obs</sub> − 2θ<sub>calc</sub>
                  </span>
                </div>
                <div className="font-mono text-[11px] tabular-nums">
                  {hoveredPeakVector ? (
                    <span className="text-cyan-300">
                      {hoveredPeakVector.hkl} · Calc {hoveredPeakVector.refT.toFixed(2)}° · Obs {hoveredPeakVector.obsT.toFixed(2)}° ·{" "}
                      <strong>
                        {hoveredPeakVector.deltaMilliDeg >= 0 ? "+" : ""}
                        {hoveredPeakVector.deltaMilliDeg} m°
                      </strong>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      RMS Dispersion:{" "}
                      <strong className="text-slate-200 font-semibold">
                        ±{crossCorrelationTelemetry.rmsShiftMilliDeg} m°
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#060911] border border-slate-800/90 rounded-md px-2 py-1.5">
                <svg
                  viewBox="0 0 480 124"
                  className="w-full h-32 select-none"
                  role="img"
                  aria-label="Bragg Reflection Angular Discrepancy Vector Map"
                  onMouseLeave={() => setHoveredPeakVector(null)}
                >
                  {/* Nominal ±60 m° Tolerance Band */}
                  <rect x="44" y="42" width="420" height="32" fill="#10b981" fillOpacity="0.07" />

                  {/* ±150 m° Corridor & Zero Discrepancy Center Line */}
                  <line x1="44" y1="18" x2="464" y2="18" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="44" y1="42" x2="464" y2="42" stroke="#10b981" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="2 3" />
                  <line x1="44" y1="58" x2="464" y2="58" stroke="#475569" strokeWidth="1.1" />
                  <line x1="44" y1="74" x2="464" y2="74" stroke="#10b981" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="2 3" />
                  <line x1="44" y1="98" x2="464" y2="98" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Left Y-Axis Labels */}
                  <text x="38" y="21" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                    +150m°
                  </text>
                  <text x="38" y="61" textAnchor="end" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                    0
                  </text>
                  <text x="38" y="101" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                    -150m°
                  </text>

                  {/* Discrepancy Stems */}
                  {crossCorrelationTelemetry.peakShiftVectors.map((vec, vIdx) => {
                    const total = Math.max(1, crossCorrelationTelemetry.peakShiftVectors.length);
                    const vx = total === 1 ? 254 : 64 + (vIdx / (total - 1)) * 380;
                    const clampedDeg = Math.max(-0.18, Math.min(0.18, vec.deltaDeg));
                    const vy = 58 - (clampedDeg / 0.15) * 40;
                    const isNominal = Math.abs(vec.deltaDeg) < 0.06;
                    const isMinor = Math.abs(vec.deltaDeg) < 0.14;
                    const strokeCol = isNominal ? "#10b981" : isMinor ? "#06b6d4" : "#f59e0b";
                    const isHovered = hoveredPeakVector?.hkl === vec.hkl && hoveredPeakVector?.refT === vec.refT;
                    const isFocused = focusedTwoTheta !== null && Math.abs(focusedTwoTheta - vec.refT) < 0.05;

                    return (
                      <g
                        key={`${vec.hkl}_${vIdx}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPeakVector(vec)}
                        onClick={() => {
                          setFocusedTwoTheta(vec.refT);
                          setTimeout(() => setFocusedTwoTheta(null), 3500);
                        }}
                      >
                        <rect x={vx - 14} y="10" width="28" height="106" fill="transparent" />
                        {(isHovered || isFocused) && (
                          <line x1={vx} y1="14" x2={vx} y2="102" stroke={strokeCol} strokeOpacity="0.28" strokeWidth="8" />
                        )}
                        <line x1={vx} y1="58" x2={vx} y2={vy} stroke={strokeCol} strokeWidth={isHovered ? "3" : "2.2"} />
                        <circle
                          cx={vx}
                          cy={vy}
                          r={isHovered ? "4.5" : "3.2"}
                          fill={strokeCol}
                          stroke="#060911"
                          strokeWidth="1.2"
                        />
                        <text
                          x={vx}
                          y="116"
                          textAnchor="middle"
                          fill={isHovered || isFocused ? "#f8fafc" : "#94a3b8"}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight={isHovered || isFocused ? "bold" : "normal"}
                        >
                          {vec.hkl}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Click any reflection stem to spotlight in diffractogram</span>
                <span className="font-mono text-slate-400">
                  <span className="text-emerald-400">≤60m° Nominal</span> ·{" "}
                  <span className="text-cyan-400">≤140m° Minor</span> ·{" "}
                  <span className="text-amber-400">&gt;140m° Offset</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* COLLAPSIBLE GONIOMETER & STRAIN CALIBRATION PANEL */}
        <AnimatePresence>
          {showCalibrationPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-[#0B101B] border border-slate-800 rounded-lg p-4 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-100">
                    Goniometer Zero-Shift &amp; Uniform Lattice Strain Calibration
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoAlign}
                    disabled={isAutoAligning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAutoAligning ? "animate-spin" : ""}`} />
                    <span>{isAutoAligning ? "Optimizing..." : "Auto-Align Zero Shift"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCalibration}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#070A12] border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCalibrationPanel(false)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close calibration panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {autoAlignStatus && (
                <div className="mt-3 text-xs font-mono text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 px-3 py-2 rounded-md">
                  {autoAlignStatus}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3.5 font-mono">
                {/* Zero Shift Calibrator */}
                <div className="flex flex-col gap-2 bg-[#070A12] p-3.5 rounded-md border border-slate-800">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-300 font-sans font-medium">Δ(2θ) Zero-Error Offset</span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <button
                        type="button"
                        onClick={() => setZeroShiftDeg((v) => Number(Math.max(-1.0, v - 0.01).toFixed(2)))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        title="Decrease zero-shift by 0.01°"
                        aria-label="Decrease zero-shift by 0.01 degree"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-cyan-300 font-semibold min-w-[54px] text-center">
                        {zeroShiftDeg > 0 ? "+" : ""}
                        {zeroShiftDeg.toFixed(2)}°
                      </span>
                      <button
                        type="button"
                        onClick={() => setZeroShiftDeg((v) => Number(Math.min(1.0, v + 0.01).toFixed(2)))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        title="Increase zero-shift by 0.01°"
                        aria-label="Increase zero-shift by 0.01 degree"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {zeroShiftDeg !== 0 && (
                        <button
                          type="button"
                          onClick={() => setZeroShiftDeg(0)}
                          className="ml-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          0°
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.01"
                    value={zeroShiftDeg}
                    onChange={(e) => setZeroShiftDeg(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
                    <span>-1.00°</span>
                    <button type="button" onClick={() => setZeroShiftDeg(0)} className="hover:text-cyan-300 cursor-pointer">
                      0.00° Nominal
                    </button>
                    <span>+1.00°</span>
                  </div>
                </div>

                {/* Uniform Lattice Strain Calibrator */}
                <div className="flex flex-col gap-2 bg-[#070A12] p-3.5 rounded-md border border-slate-800">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-300 font-sans font-medium">Uniform Lattice Strain (Δd/d)</span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <button
                        type="button"
                        onClick={() => setLatticeStrainPct((v) => Number(Math.max(-2.0, v - 0.02).toFixed(2)))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        title="Decrease lattice strain by 0.02%"
                        aria-label="Decrease lattice strain by 0.02 percent"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-amber-300 font-semibold min-w-[54px] text-center">
                        {latticeStrainPct > 0 ? "+" : ""}
                        {latticeStrainPct.toFixed(2)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setLatticeStrainPct((v) => Number(Math.min(2.0, v + 0.02).toFixed(2)))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        title="Increase lattice strain by 0.02%"
                        aria-label="Increase lattice strain by 0.02 percent"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {latticeStrainPct !== 0 && (
                        <button
                          type="button"
                          onClick={() => setLatticeStrainPct(0)}
                          className="ml-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          0%
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.02"
                    value={latticeStrainPct}
                    onChange={(e) => setLatticeStrainPct(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
                    <span>-2.00% Compressive</span>
                    <button type="button" onClick={() => setLatticeStrainPct(0)} className="hover:text-amber-300 cursor-pointer">
                      0.00% Relaxed
                    </button>
                    <span>+2.00% Tensile</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CALIPER MEASUREMENT INSTRUMENT BAR */}
        <AnimatePresence>
          {caliperActive && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="bg-[#120E07] border border-amber-500/40 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <Crosshair className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold font-sans text-amber-200">Peak Caliper</span>
                </div>
                <span className="text-slate-400 font-sans text-xs">
                  {!caliperPt1
                    ? "Click a point on the diffractogram to set Point A"
                    : !caliperPt2
                    ? `Point A locked (${caliperPt1.twoTheta.toFixed(2)}°) — click Point B to compute Δ`
                    : `A: ${caliperPt1.twoTheta.toFixed(2)}° · B: ${caliperPt2.twoTheta.toFixed(2)}°`}
                </span>
              </div>

              {caliperDelta && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span>
                    <span className="text-slate-400">Δ2θ </span>
                    <strong className="text-amber-300">{caliperDelta.dTwoTheta}°</strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span>
                    <span className="text-slate-400">Δd </span>
                    <strong className="text-emerald-300">{caliperDelta.dDSpacing} Å</strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span>
                    <span className="text-slate-400">ΔQ </span>
                    <strong className="text-sky-300">{caliperDelta.dQ} Å⁻¹</strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span>
                    <span className="text-slate-400">Strain ε </span>
                    <strong className="text-cyan-300">{caliperDelta.apparentStrain}%</strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span>
                    <span className="text-slate-400">Kα₁/Kα₂ Split </span>
                    <strong className="text-slate-200">{caliperDelta.kaDoubletSplit}°</strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCaliperPt1(null);
                    setCaliperPt2(null);
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/40 hover:bg-amber-500/25 text-xs font-sans font-medium cursor-pointer transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCaliperActive(false);
                    setCaliperPt1(null);
                    setCaliperPt2(null);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close caliper"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN DIFFRACTOGRAM INSTRUMENT CONTAINER */}
      <div
        ref={chartWrapperRef}
        className={`w-full relative z-10 rounded-lg p-0 overflow-hidden flex flex-col group/chart transition-colors ${
          themeMode === "publication"
            ? "bg-white text-slate-900 border border-slate-300"
            : "bg-[#060912] text-slate-100 border border-slate-800"
        } ${
          isFullscreen
            ? "h-[85vh] min-h-[600px]"
            : curveViewHeight === "cinema"
            ? "h-[940px] sm:h-[980px] lg:h-[1020px]"
            : curveViewHeight === "big"
            ? "h-[740px] sm:h-[780px] lg:h-[820px]"
            : "h-[580px] sm:h-[620px] lg:h-[660px]"
        }`}
      >
        {/* Subtle Reticle Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25">
            <div className={`absolute left-1/4 top-0 bottom-0 border-l border-dashed ${themeMode === "publication" ? "border-slate-300" : "border-slate-700/40"}`} />
            <div className={`absolute left-1/2 top-0 bottom-0 border-l border-dashed ${themeMode === "publication" ? "border-slate-300" : "border-slate-700/40"}`} />
            <div className={`absolute right-1/4 top-0 bottom-0 border-l border-dashed ${themeMode === "publication" ? "border-slate-300" : "border-slate-700/40"}`} />
            <div className={`absolute top-1/4 left-0 right-0 border-t border-dashed ${themeMode === "publication" ? "border-slate-300" : "border-slate-700/40"}`} />
            <div className={`absolute top-1/2 left-0 right-0 border-t border-dashed ${themeMode === "publication" ? "border-slate-300" : "border-slate-700/40"}`} />
            <div className={`absolute bottom-1/4 left-0 right-0 border-t border-dashed ${themeMode === "publication" ? "border-slate-300" : "border-slate-700/40"}`} />
          </div>
        )}

        {/* TIER 1 CONTROL DECK: Domain, Intensity Scale, Profile & Mesh Optics, Zoom, Viewport & Theme */}
        <div
          className={`w-full px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 z-30 pointer-events-auto border-b transition-colors ${
            themeMode === "publication"
              ? "bg-slate-50 border-slate-200 text-slate-800"
              : "bg-[#0B101B] border-slate-800 text-slate-200"
          }`}
        >
          {/* Left Group: Coordinate Domain, Intensity Scale, Profile & Precision Popovers, Zoom */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Coordinate Domain Segmented Control */}
            <div
              className={`flex items-center p-0.5 rounded-md border font-mono text-[11px] ${
                themeMode === "publication"
                  ? "bg-slate-100 border-slate-300"
                  : "bg-[#060912] border-slate-800"
              }`}
            >
              {(
                [
                  { id: "twoTheta", label: "2θ (°)", title: "Bragg Diffraction Angle (2θ)" },
                  { id: "dSpacing", label: "d (Å)", title: "Interplanar Spacing (d_hkl in Å)" },
                  { id: "qVector", label: "Q (Å⁻¹)", title: "Scattering Vector Q = 4π sin(θ)/λ" },
                ] as Array<{ id: CoordinateSpace; label: string; title: string }>
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCoordSpace(item.id)}
                  title={item.title}
                  className={`px-2.5 py-1 rounded font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    coordSpace === item.id
                      ? themeMode === "publication"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "bg-cyan-500/20 text-cyan-200"
                      : themeMode === "publication"
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Intensity Scale Segmented Control */}
            <div
              className={`flex items-center p-0.5 rounded-md border font-mono text-[11px] ${
                themeMode === "publication"
                  ? "bg-slate-100 border-slate-300"
                  : "bg-[#060912] border-slate-800"
              }`}
            >
              {(
                [
                  { id: "linear", label: "Linear", title: "Linear Intensity Counts" },
                  { id: "sqrt", label: "√I", title: "Square-Root (Poisson Statistics) Transform" },
                  { id: "log", label: "Log₁₀", title: "Logarithmic Scale for Trace Phases" },
                ] as Array<{ id: IntensityScale; label: string; title: string }>
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIntensityScale(item.id)}
                  title={item.title}
                  className={`px-2.5 py-1 rounded font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    intensityScale === item.id
                      ? themeMode === "publication"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "bg-slate-800 text-slate-100"
                      : themeMode === "publication"
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Profile Function Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileConfigPanel(!showProfileConfigPanel);
                  setShowPrecisionPanel(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[11px] font-medium border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showProfileConfigPanel
                    ? themeMode === "publication"
                      ? "bg-cyan-50 text-cyan-900 border-cyan-400"
                      : "bg-cyan-500/15 text-cyan-200 border-cyan-500/60"
                    : themeMode === "publication"
                    ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    : "bg-[#060912] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
                title="Configure Peak Profile Model, Lorentzian Fraction & Doublet Optics"
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  {profileModel === "pseudoVoigt"
                    ? `P-Voigt η=${Math.round(lorentzianFraction * 100)}%`
                    : profileModel === "pearson7"
                    ? `Pearson VII m=${pearsonShapeM.toFixed(1)}`
                    : profileModel === "gaussian"
                    ? "Gaussian"
                    : "Lorentzian"}
                </span>
                <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${showProfileConfigPanel ? "rotate-180" : ""}`} />
              </button>

              {showProfileConfigPanel && (
                <div
                  className={`absolute left-0 top-full mt-1.5 z-50 p-3.5 rounded-lg border shadow-2xl w-76 text-xs font-mono ${
                    themeMode === "publication"
                      ? "bg-white border-slate-300 text-slate-800"
                      : "bg-[#0B101B] border-slate-700 text-slate-200"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between pb-2 mb-3 border-b ${
                      themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                    }`}
                  >
                    <span className="font-sans font-semibold text-xs">Peak Profile Optics</span>
                    <button
                      type="button"
                      onClick={() => setShowProfileConfigPanel(false)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                      aria-label="Close profile settings"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-sans block mb-1.5">Profile Shape Function</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(["pseudoVoigt", "pearson7", "gaussian", "lorentzian"] as ProfileShapeModel[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setProfileModel(m)}
                            className={`py-1.5 px-2 rounded-md text-center font-medium border transition-colors cursor-pointer ${
                              profileModel === m
                                ? themeMode === "publication"
                                  ? "bg-cyan-50 text-cyan-900 border-cyan-500"
                                  : "bg-cyan-500/20 text-cyan-200 border-cyan-500/60"
                                : themeMode === "publication"
                                ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                : "bg-[#060912] text-slate-400 border-slate-800 hover:text-slate-200"
                            }`}
                          >
                            {m === "pseudoVoigt"
                              ? "Pseudo-Voigt"
                              : m === "pearson7"
                              ? "Pearson VII"
                              : m === "gaussian"
                              ? "Gaussian"
                              : "Lorentzian"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {profileModel === "pseudoVoigt" && (
                      <div>
                        <div className="flex justify-between items-center mb-1 tabular-nums">
                          <span className="text-slate-400 font-sans">Lorentzian Fraction (η)</span>
                          <span className="font-semibold text-cyan-400">{Math.round(lorentzianFraction * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={lorentzianFraction}
                          onChange={(e) => setLorentzianFraction(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>0% Gaussian</span>
                          <span>100% Lorentzian</span>
                        </div>
                      </div>
                    )}

                    {profileModel === "pearson7" && (
                      <div>
                        <div className="flex justify-between items-center mb-1 tabular-nums">
                          <span className="text-slate-400 font-sans">Shape Exponent (m)</span>
                          <span className="font-semibold text-cyan-400">m = {pearsonShapeM.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="8.0"
                          step="0.1"
                          value={pearsonShapeM}
                          onChange={(e) => setPearsonShapeM(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>1.0 Cauchy</span>
                          <span>2.0 Mod-L</span>
                          <span>8.0 Gauss</span>
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between pt-2 border-t ${
                        themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                      }`}
                    >
                      <span className="text-slate-400 font-sans">Cu-Kα₁/Kα₂ Doublet</span>
                      <button
                        type="button"
                        onClick={() => setEnableKaDoublet(!enableKaDoublet)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          enableKaDoublet
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-800/60 text-slate-400 border-slate-700"
                        }`}
                      >
                        {enableKaDoublet ? "Enabled" : "Off"}
                      </button>
                    </div>

                    <div
                      className={`flex items-center justify-between pt-2 border-t ${
                        themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                      }`}
                    >
                      <span className="text-slate-400 font-sans">Subtract Baseline</span>
                      <button
                        type="button"
                        onClick={() => setSubtractBackground(!subtractBackground)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          subtractBackground
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                            : "bg-slate-800/60 text-slate-400 border-slate-700"
                        }`}
                      >
                        {subtractBackground ? "Subtracted" : "Raw Scan"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mesh Precision Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowPrecisionPanel(!showPrecisionPanel);
                  setShowProfileConfigPanel(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[11px] font-medium border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showPrecisionPanel
                    ? themeMode === "publication"
                      ? "bg-cyan-50 text-cyan-900 border-cyan-400"
                      : "bg-cyan-500/15 text-cyan-200 border-cyan-500/60"
                    : themeMode === "publication"
                    ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    : "bg-[#060912] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
                title="Sampling Mesh Density, Spline Interpolation & Doublet Sub-Curves"
              >
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">
                  Mesh{" "}
                  {curvePrecisionMode === "synchrotron"
                    ? "0.002°"
                    : curvePrecisionMode === "ultra"
                    ? "0.005°"
                    : curvePrecisionMode === "high"
                    ? "0.010°"
                    : "0.020°"}
                </span>
                <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${showPrecisionPanel ? "rotate-180" : ""}`} />
              </button>

              {showPrecisionPanel && (
                <div
                  className={`absolute left-0 top-full mt-1.5 z-50 p-3.5 rounded-lg border shadow-2xl w-80 text-xs font-mono ${
                    themeMode === "publication"
                      ? "bg-white border-slate-300 text-slate-800"
                      : "bg-[#0B101B] border-slate-700 text-slate-200"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between pb-2 mb-3 border-b ${
                      themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                    }`}
                  >
                    <span className="font-sans font-semibold text-xs">Diffractogram Sampling Engine</span>
                    <button
                      type="button"
                      onClick={() => setShowPrecisionPanel(false)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                      aria-label="Close sampling settings"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-sans block mb-1.5">Sampling Step Density</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "synchrotron", label: "Synchrotron 0.002°", desc: "~18,000 pts" },
                          { id: "ultra", label: "Ultra 0.005°", desc: "~12,000 pts" },
                          { id: "high", label: "High 0.010°", desc: "~6,000 pts" },
                          { id: "benchmark", label: "Standard 0.020°", desc: "~3,000 pts" },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setCurvePrecisionMode(lvl.id as CurvePrecisionMode)}
                            className={`p-2 rounded-md text-left border transition-colors cursor-pointer ${
                              curvePrecisionMode === lvl.id
                                ? themeMode === "publication"
                                  ? "bg-cyan-50 text-cyan-900 border-cyan-500"
                                  : "bg-cyan-500/20 text-cyan-200 border-cyan-500/60"
                                : themeMode === "publication"
                                ? "bg-slate-50 text-slate-600 border-slate-200"
                                : "bg-[#060912] text-slate-400 border-slate-800 hover:text-slate-200"
                            }`}
                          >
                            <div className="font-medium">{lvl.label}</div>
                            <div className="text-[10px] opacity-70">{lvl.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-sans block mb-1.5">Curve Interpolation</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "monotone", label: "Monotone" },
                          { id: "linear", label: "Linear" },
                          { id: "natural", label: "Cubic" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setCurveInterpolation(m.id as CurveInterpolationType)}
                            className={`py-1.5 px-2 rounded-md text-center font-medium border transition-colors cursor-pointer ${
                              curveInterpolation === m.id
                                ? themeMode === "publication"
                                  ? "bg-cyan-50 text-cyan-900 border-cyan-500"
                                  : "bg-cyan-500/20 text-cyan-200 border-cyan-500/60"
                                : themeMode === "publication"
                                ? "bg-slate-50 text-slate-600 border-slate-200"
                                : "bg-[#060912] text-slate-400 border-slate-800 hover:text-slate-200"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between pt-2 border-t ${
                        themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                      }`}
                    >
                      <span className="text-slate-400 font-sans">Hermite Super-Sampling</span>
                      <button
                        type="button"
                        onClick={() => setEnableSuperSampling(!enableSuperSampling)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          enableSuperSampling
                            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-800/60 text-slate-400 border-slate-700"
                        }`}
                      >
                        {enableSuperSampling ? "Enabled" : "Raw Grid"}
                      </button>
                    </div>

                    <div
                      className={`flex items-center justify-between pt-2 border-t ${
                        themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                      }`}
                    >
                      <span className="text-slate-400 font-sans">Kα₁ / Kα₂ Sub-Curves</span>
                      <button
                        type="button"
                        onClick={() => setShowKaDoubletSplitCurves(!showKaDoubletSplitCurves)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          showKaDoubletSplitCurves
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-800/60 text-slate-400 border-slate-700"
                        }`}
                      >
                        {showKaDoubletSplitCurves ? "Split" : "Combined"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Angular Window Zoom Presets */}
            <div
              className={`flex items-center p-0.5 rounded-md border font-mono text-[11px] tabular-nums ${
                themeMode === "publication"
                  ? "bg-slate-100 border-slate-300"
                  : "bg-[#060912] border-slate-800"
              }`}
            >
              {(
                [
                  { id: "all", label: "Full" },
                  { id: "low", label: "10–35°" },
                  { id: "mid", label: "20–65°" },
                  { id: "high", label: "60–100°" },
                ] as Array<{ id: "all" | "low" | "mid" | "high"; label: string }>
              ).map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoomRangePreset(z.id)}
                  className={`px-2 py-1 rounded font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    zoomRangePreset === z.id
                      ? themeMode === "publication"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "bg-slate-800 text-cyan-300"
                      : themeMode === "publication"
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {z.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setZoomRangePreset("all");
                  setCoordSpace("twoTheta");
                  setIntensityScale("linear");
                  setShowBrush(true);
                  setFocusedTwoTheta(null);
                }}
                className={`ml-0.5 px-2 py-1 rounded font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  themeMode === "publication"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Reset domain, zoom, and intensity scale"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Right Group: Viewport Height, Peak Apex Lens, Publication Theme */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Viewport Height Selector */}
            <div
              className={`flex items-center p-0.5 rounded-md border font-mono text-[11px] ${
                themeMode === "publication"
                  ? "bg-slate-100 border-slate-300"
                  : "bg-[#060912] border-slate-800"
              }`}
            >
              {(
                [
                  { id: "standard", label: "Std" },
                  { id: "big", label: "Big" },
                  { id: "cinema", label: "Cinema" },
                ] as Array<{ id: CurveViewHeight; label: string }>
              ).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setCurveViewHeight(h.id)}
                  className={`px-2 py-1 rounded font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    curveViewHeight === h.id && !isFullscreen
                      ? themeMode === "publication"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "bg-slate-800 text-slate-100"
                      : themeMode === "publication"
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Peak Apex 10x Magnifier Lens */}
            {detectedPeaks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const target = inspectedPeak || detectedPeaks[0];
                  setInspectedPeak(target);
                  setShowPeakApexModal(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showPeakApexModal
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/60"
                    : themeMode === "publication"
                    ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    : "bg-[#060912] text-cyan-300 border-slate-800 hover:border-cyan-500/50"
                }`}
                title="Inspect peak crest & FWHM half-max with 10× magnification"
              >
                <Focus className="w-3.5 h-3.5 text-cyan-500" />
                <span>Apex Lens</span>
              </button>
            )}

            {/* Theme Mode Switch: Dark Lab / Publication */}
            <button
              type="button"
              onClick={() => setThemeMode(themeMode === "darkLab" ? "publication" : "darkLab")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                themeMode === "publication"
                  ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  : "bg-[#060912] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
              title="Toggle Publication Mode (White Journal Figure) vs Dark Lab"
            >
              {themeMode === "publication" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Publication</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dark Lab</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TIER 2 LAYER RIBBON: Active Spectral Traces & 3-Way Residual Mode Switch */}
        <div
          className={`w-full px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-auto border-b font-mono text-[11px] transition-colors ${
            themeMode === "publication"
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-[#070B14] border-slate-800/90 text-slate-300"
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowExpPattern(!showExpPattern)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                showExpPattern
                  ? themeMode === "publication"
                    ? "bg-slate-100 border-slate-300 text-slate-900"
                    : "bg-slate-800/80 border-slate-700 text-slate-100"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <span
                className={`w-2.5 h-0.5 ${
                  showExpPattern ? (themeMode === "publication" ? "bg-slate-900" : "bg-cyan-400") : "bg-slate-600"
                }`}
              />
              <span>Y_obs</span>
            </button>

            {isDiscrete && (
              <button
                type="button"
                onClick={() => setShowExpSticks(!showExpSticks)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showExpSticks
                    ? themeMode === "publication"
                      ? "bg-sky-50 border-sky-300 text-sky-900"
                      : "bg-slate-800/80 border-slate-700 text-sky-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className={`w-2.5 h-0.5 ${showExpSticks ? "bg-sky-400" : "bg-slate-600"}`} />
                <span>Exp Sticks</span>
              </button>
            )}

            {selectedCandidate && (
              <button
                type="button"
                onClick={() => setShowCalcProfile(!showCalcProfile)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showCalcProfile
                    ? themeMode === "publication"
                      ? "bg-red-50 border-red-300 text-red-900"
                      : "bg-slate-800/80 border-slate-700 text-rose-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <span
                  className={`w-2.5 h-0.5 ${
                    showCalcProfile ? (themeMode === "publication" ? "bg-red-600" : "bg-rose-400") : "bg-slate-600"
                  }`}
                />
                <span>Y_calc</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowBackgroundBaseline(!showBackgroundBaseline)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                showBackgroundBaseline
                  ? themeMode === "publication"
                    ? "bg-slate-100 border-slate-300 text-slate-900"
                    : "bg-slate-800/80 border-slate-700 text-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="w-2.5 border-t border-dashed border-slate-400" />
              <span>Baseline</span>
            </button>

            {selectedCandidate && (
              <button
                type="button"
                onClick={() => setShowRefSticks(!showRefSticks)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showRefSticks
                    ? themeMode === "publication"
                      ? "bg-rose-50 border-rose-300 text-rose-900"
                      : "bg-slate-800/80 border-slate-700 text-rose-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className={`w-2.5 h-0.5 ${showRefSticks ? "bg-rose-400" : "bg-slate-600"}`} />
                <span>Ref Sticks</span>
              </button>
            )}

            {selectedCandidate && showRefSticks && (
              <button
                type="button"
                onClick={() => setShowHklBadges(!showHklBadges)}
                className={`px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showHklBadges
                    ? themeMode === "publication"
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-slate-800/80 border-slate-700 text-slate-200"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                (hkl)
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowBraggComb(!showBraggComb)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                showBraggComb
                  ? themeMode === "publication"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-slate-800/80 border-slate-700 text-emerald-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className={`w-2.5 h-0.5 ${showBraggComb ? "bg-emerald-400" : "bg-slate-600"}`} />
              <span>Bragg Comb</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPeakPins(!showPeakPins)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer tabular-nums ${
                showPeakPins
                  ? themeMode === "publication"
                    ? "bg-cyan-50 border-cyan-300 text-cyan-900"
                    : "bg-slate-800/80 border-slate-700 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className={`w-2.5 h-0.5 ${showPeakPins ? "bg-cyan-400" : "bg-slate-600"}`} />
              <span>Pins ({detectedPeaks.length})</span>
            </button>

            {activeCandidates.length > 1 && (
              <button
                type="button"
                onClick={() => setShowIndividualPhases(!showIndividualPhases)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showIndividualPhases
                    ? themeMode === "publication"
                      ? "bg-purple-50 border-purple-300 text-purple-900"
                      : "bg-slate-800/80 border-slate-700 text-purple-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className={`w-2.5 h-0.5 ${showIndividualPhases ? "bg-purple-400" : "bg-slate-600"}`} />
                <span>Sub-Phases</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowBrush(!showBrush)}
              className={`px-2 py-1 rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                showBrush
                  ? themeMode === "publication"
                    ? "bg-slate-100 border-slate-300 text-slate-900"
                    : "bg-slate-800/80 border-slate-700 text-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Brush
            </button>
          </div>

          {/* 3-Way Segmented Residual Mode Control */}
          {selectedCandidate && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 font-sans text-[11px]">Residual ΔY</span>
              <div
                className={`flex items-center p-0.5 rounded-md border ${
                  themeMode === "publication"
                    ? "bg-slate-100 border-slate-300"
                    : "bg-[#060912] border-slate-800"
                }`}
              >
                {(
                  [
                    { id: "overlay", label: "Overlay" },
                    { id: "split", label: "Split Console" },
                    { id: "hidden", label: "Off" },
                  ] as Array<{ id: ResidualViewMode; label: string }>
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setResidualView(mode.id)}
                    className={`px-2 py-0.5 rounded font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      residualView === mode.id
                        ? themeMode === "publication"
                          ? "bg-white text-blue-700 shadow-xs"
                          : "bg-amber-500/20 text-amber-300"
                        : themeMode === "publication"
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RECHARTS COMPOSED CHART VIEWPORT */}
        <div
          className={`flex-1 relative w-full px-2 pt-2 pb-1 min-h-[360px] z-10 transition-colors ${
            themeMode === "publication" ? "bg-white" : "bg-[#060912]"
          }`}
        >
          {/* Compact Flat Trace Legend */}
          <div
            className={`absolute top-3 right-4 z-20 px-3 py-2 rounded-md border pointer-events-none font-mono text-[10px] tabular-nums ${
              themeMode === "publication"
                ? "bg-white/95 border-slate-300 text-slate-800"
                : "bg-[#0B101B]/95 border-slate-800 text-slate-200"
            }`}
          >
            <div
              className={`font-semibold pb-1 mb-1.5 border-b flex items-center justify-between gap-4 ${
                themeMode === "publication" ? "border-slate-200" : "border-slate-800"
              }`}
            >
              <span>Diffractogram Traces</span>
              <span className="text-slate-400">λ = {activeWavelength.toFixed(4)} Å</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-0.5 ${themeMode === "publication" ? "bg-slate-950" : "bg-cyan-400"}`} />
                  <span>Y_obs</span>
                </div>
                <span className="text-slate-400">Observed</span>
              </div>
              {selectedCandidate && showCalcProfile && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-0.5 ${themeMode === "publication" ? "bg-red-600" : "bg-rose-500"}`} />
                    <span>Y_calc</span>
                  </div>
                  <span className="text-slate-400 truncate max-w-[95px]">
                    {selectedCandidate.phase_name.split(" ")[0]}
                  </span>
                </div>
              )}
              {selectedCandidate && showKaDoubletSplitCurves && enableKaDoublet && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 border-t border-dashed border-emerald-400" />
                      <span className="text-emerald-400">Kα₁</span>
                    </div>
                    <span className="text-slate-400">1.5406 Å</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 border-t border-dashed border-purple-400" />
                      <span className="text-purple-300">Kα₂</span>
                    </div>
                    <span className="text-slate-400">1.5444 Å</span>
                  </div>
                </>
              )}
              {showBackgroundBaseline && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 border-t border-dashed border-slate-400" />
                    <span>Y_bkg</span>
                  </div>
                  <span className="text-slate-400">Baseline</span>
                </div>
              )}
              {selectedCandidate && residualView === "overlay" && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-0.5 ${themeMode === "publication" ? "bg-blue-600" : "bg-amber-500"}`} />
                    <span>ΔY</span>
                  </div>
                  <span className="text-slate-400">Residual</span>
                </div>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 28, left: 16, bottom: showBrush ? 10 : 20 }}
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="specPatternGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeMode === "publication" ? "#0f172a" : "#22d3ee"} stopOpacity={themeMode === "publication" ? 0.08 : 0.35} />
                  <stop offset="95%" stopColor={themeMode === "publication" ? "#0f172a" : "#22d3ee"} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="specRefGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeMode === "publication" ? "#dc2626" : "#f43f5e"} stopOpacity={themeMode === "publication" ? 0.08 : 0.3} />
                  <stop offset="95%" stopColor={themeMode === "publication" ? "#dc2626" : "#f43f5e"} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="specResidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeMode === "publication" ? "#2563eb" : "#f59e0b"} stopOpacity={themeMode === "publication" ? 0.12 : 0.25} />
                  <stop offset="95%" stopColor={themeMode === "publication" ? "#2563eb" : "#f59e0b"} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="2 4"
                stroke={themeMode === "publication" ? "#e2e8f0" : "#1e293b"}
                opacity={showGrid ? (themeMode === "publication" ? 0.8 : 0.6) : 0}
              />

              <XAxis
                dataKey="coordX"
                type="number"
                domain={currentChartDomain}
                unit={coordSpace === "twoTheta" ? "°" : coordSpace === "dSpacing" ? " Å" : " Å⁻¹"}
                allowDataOverflow
                name={coordSpace === "twoTheta" ? "Diffraction Angle (2θ)" : coordSpace === "dSpacing" ? "d-spacing" : "Q-vector"}
                stroke={themeMode === "publication" ? "#0f172a" : "#475569"}
                strokeWidth={themeMode === "publication" ? 1.5 : 1}
                tick={{ fill: themeMode === "publication" ? "#0f172a" : "#94a3b8", fontSize: 10, fontFamily: "monospace", fontWeight: "bold" }}
                tickFormatter={(val) => Number(val).toFixed(coordSpace === "twoTheta" ? 1 : coordSpace === "dSpacing" ? 2 : 2)}
                dy={6}
              />

              <YAxis
                stroke={themeMode === "publication" ? "#0f172a" : "#475569"}
                strokeWidth={themeMode === "publication" ? 1.5 : 1}
                tick={{ fill: themeMode === "publication" ? "#0f172a" : "#64748b", fontSize: 9, fontFamily: "monospace", fontWeight: themeMode === "publication" ? "bold" : "normal" }}
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.2))]}
                name={intensityScale === "linear" ? "Intensity (cps)" : intensityScale === "sqrt" ? "√I (cps)" : "log₁₀(I)"}
                width={42}
              />

              <Tooltip
                content={<CustomCrystallographicTooltip />}
                cursor={{
                  stroke: themeMode === "publication" ? "#0f172a" : "#22d3ee",
                  strokeWidth: 1.5,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Live Scanner Position Line */}
              {isSimulating && scanPos !== null && (
                <ReferenceLine
                  x={mapCoord(scanPos)}
                  stroke="#22d3ee"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: "SCANNING IN PROGRESS",
                    position: "insideTopLeft",
                    fill: "#22d3ee",
                    fontSize: 9,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                />
              )}

              {/* Focused Reflection Spotlight Line */}
              {focusedTwoTheta !== null && (
                <ReferenceLine
                  x={mapCoord(focusedTwoTheta)}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  label={{
                    value: "FOCUSED PEAK",
                    position: "insideTopRight",
                    fill: "#f43f5e",
                    fontSize: 9,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                />
              )}

              {/* Caliper Markers */}
              {caliperPt1 && (
                <ReferenceLine
                  x={mapCoord(caliperPt1.twoTheta)}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  label={{
                    value: `POINT A (${caliperPt1.twoTheta}°)`,
                    position: "insideTopLeft",
                    fill: "#f59e0b",
                    fontSize: 8,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                />
              )}
              {caliperPt2 && (
                <ReferenceLine
                  x={mapCoord(caliperPt2.twoTheta)}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  label={{
                    value: `POINT B (${caliperPt2.twoTheta}°)`,
                    position: "insideTopRight",
                    fill: "#f59e0b",
                    fontSize: 8,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                />
              )}

              {/* Experimental Pattern Area (Highest Precision Vector Curve) */}
              {showExpPattern && (
                <Area
                  type={curveInterpolation}
                  dataKey="intensity"
                  stroke={themeMode === "publication" ? "#0f172a" : "#06b6d4"}
                  fill="url(#specPatternGrad)"
                  strokeWidth={themeMode === "publication" ? 2.0 : 2.2}
                  name="Observed Diffractogram (Y_obs)"
                  dot={themeMode === "publication" && isDiscrete ? { r: 2.5, fill: "#0f172a", strokeWidth: 0 } : false}
                  activeDot={{
                    r: 5.5,
                    fill: themeMode === "publication" ? "#0f172a" : "#22d3ee",
                    stroke: themeMode === "publication" ? "#ffffff" : "#050b14",
                    strokeWidth: 2,
                    className: themeMode === "publication" ? "" : "drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]",
                  }}
                />
              )}

              {/* Background Baseline Curve */}
              {showBackgroundBaseline && (
                <Line
                  type={curveInterpolation}
                  dataKey="baseline"
                  stroke={themeMode === "publication" ? "#64748b" : "#94a3b8"}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Background Baseline (Y_bkg)"
                />
              )}

              {/* Experimental Sticks (Discrete Mode) */}
              {isDiscrete && showExpPattern && showExpSticks && (
                <Scatter
                  data={rawInputSticks}
                  dataKey="intensity"
                  name="Exp Reflections"
                  fill="#38bdf8"
                  shape={(props: any) => {
                    const { cx, cy, yAxis } = props;
                    const bottomY = yAxis && typeof yAxis.scale === "function" ? yAxis.scale(0) : cy + 250;
                    return (
                      <g className="transition-all duration-300">
                        <line x1={cx} y1={bottomY} x2={cx} y2={cy} stroke={themeMode === "publication" ? "#0284c7" : "#0284c7"} strokeWidth={1.5} strokeOpacity={0.85} />
                        <circle cx={cx} cy={cy} r={3.5} fill="#0284c7" stroke="#38bdf8" strokeWidth={1.5} />
                        <circle cx={cx} cy={cy} r={1.5} fill="#ffffff" />
                      </g>
                    );
                  }}
                />
              )}

              {/* Theoretical Reference Simulation Profile (Calculated Y_calc) */}
              {selectedCandidate && showCalcProfile && (
                <Area
                  type={curveInterpolation}
                  dataKey="refIntensity"
                  stroke={themeMode === "publication" ? "#dc2626" : "#f43f5e"}
                  fill="url(#specRefGrad)"
                  fillOpacity={themeMode === "publication" ? 0.05 : 0.3}
                  strokeWidth={2}
                  name={`${selectedCandidate.phase_name} (Y_calc)`}
                />
              )}

              {/* High-Precision Cu-Kα1 / Cu-Kα2 Doublet Split Components */}
              {selectedCandidate && showKaDoubletSplitCurves && enableKaDoublet && (
                <>
                  <Line
                    type={curveInterpolation}
                    dataKey="refIntensityKa1"
                    stroke="#10b981"
                    strokeWidth={1.6}
                    strokeDasharray="4 2"
                    dot={false}
                    name="Cu-Kα₁ Deconvolution (1.5406 Å)"
                  />
                  <Line
                    type={curveInterpolation}
                    dataKey="refIntensityKa2"
                    stroke="#c084fc"
                    strokeWidth={1.6}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Cu-Kα₂ Deconvolution (1.5444 Å)"
                  />
                </>
              )}

              {/* Individual Deconvoluted Sub-Phases for Multi-Phase Analysis */}
              {showIndividualPhases && activeCandidates.length > 1 && (
                activeCandidates.map((cand, cIdx) => (
                  <Line
                    key={`phase-line-${cand.phase_name}-${cIdx}`}
                    type={curveInterpolation}
                    dataKey={`phase_${cIdx}`}
                    stroke={PHASE_PALETTES[cIdx % PHASE_PALETTES.length].primary}
                    strokeWidth={1.8}
                    strokeDasharray="4 3"
                    dot={false}
                    name={`${cand.phase_name.split(' ')[0]} (Phase ${cIdx + 1})`}
                  />
                ))
              )}

              {/* Residual (Difference) Curve in Overlay Mode */}
              {selectedCandidate && residualView === "overlay" && (
                <Area
                  type={curveInterpolation}
                  dataKey="residual"
                  stroke={themeMode === "publication" ? "#2563eb" : "#f59e0b"}
                  strokeWidth={1.2}
                  fill="url(#specResidGrad)"
                  fillOpacity={themeMode === "publication" ? 0.08 : 0.3}
                  name="Difference (ΔY = Y_obs - Y_calc)"
                />
              )}

              {/* Reference Bragg Reflection Sticks & Staggered (hkl) Badges */}
              {selectedCandidate && showRefSticks && (
                <Scatter
                  data={staggeredRefPeaks}
                  dataKey="refIntensity"
                  name={`${selectedCandidate.phase_name} (Reflections)`}
                  fill="#f43f5e"
                  shape={(props: any) => {
                    const { cx, cy, yAxis, payload } = props;
                    const bottomY = yAxis && typeof yAxis.scale === "function" ? yAxis.scale(0) : cy + 250;
                    const badgeYOffset = payload.badgeYOffset || -18;
                    const badgeY = cy + badgeYOffset;
                    const hklText = payload.hkl ? `(${payload.hkl})` : "";

                    return (
                      <g className="transition-all duration-300">
                        <line
                          x1={cx}
                          y1={bottomY}
                          x2={cx}
                          y2={cy}
                          stroke={themeMode === "publication" ? "#dc2626" : "#f43f5e"}
                          strokeWidth={1.5}
                          strokeOpacity={0.85}
                          strokeDasharray="3 3"
                        />
                        {showHklBadges && payload.hkl && payload.staggerTier > 0 && (
                          <line
                            x1={cx}
                            y1={cy - 5}
                            x2={cx}
                            y2={badgeY + 8}
                            stroke={themeMode === "publication" ? "#e11d48" : "#fb7185"}
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            strokeOpacity={0.7}
                          />
                        )}
                        <path
                          d={`M ${cx} ${cy - 5} L ${cx + 4.5} ${cy} L ${cx} ${cy + 5} L ${cx - 4.5} ${cy} Z`}
                          fill={themeMode === "publication" ? "#dc2626" : "#f43f5e"}
                          stroke={themeMode === "publication" ? "#b91c1c" : "#fda4af"}
                          strokeWidth={1}
                        />
                        <circle cx={cx} cy={cy} r={1.5} fill="#ffffff" />

                        {showHklBadges && payload.hkl && (
                          <g>
                            <rect
                              x={cx - (hklText.length * 3.8 + 6)}
                              y={badgeY - 8}
                              width={hklText.length * 7.6 + 12}
                              height={15}
                              rx={4}
                              fill={themeMode === "publication" ? "#ffffff" : "#070b14"}
                              stroke={themeMode === "publication" ? "#dc2626" : "#f43f5e"}
                              strokeWidth={1}
                              strokeOpacity={0.9}
                              className={themeMode === "publication" ? "shadow-sm" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"}
                            />
                            <text
                              x={cx}
                              y={badgeY + 3}
                              textAnchor="middle"
                              fill={themeMode === "publication" ? "#991b1b" : "#fecdd3"}
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {hklText}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  }}
                />
              )}

              {/* Auto-Detected Peak Centroid Pins with Domain Size & (hkl) Badges */}
              {showPeakPins && peakPinsData.length > 0 && (
                <Scatter
                  data={peakPinsData}
                  dataKey="displayIntensity"
                  name="Detected Centroids"
                  fill="#06b6d4"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const pinY = cy - 14;
                    const labelText = payload.matchedHkl
                      ? `(${payload.matchedHkl}) ${payload.crystalliteSizeNm}nm`
                      : `${payload.crystalliteSizeNm}nm`;
                    const labelW = labelText.length * 5.8 + 12;

                    return (
                      <g
                        className="transition-all duration-200 pointer-events-auto cursor-pointer group/pin"
                        onClick={() => {
                          setFocusedTwoTheta(payload.twoTheta);
                          setInspectedPeak(payload);
                          setShowPeakApexModal(true);
                          setTimeout(() => setFocusedTwoTheta(null), 3500);
                        }}
                      >
                        {/* Vertical Pin Guideline */}
                        <line
                          x1={cx}
                          y1={cy}
                          x2={cx}
                          y2={pinY + 4}
                          stroke={themeMode === "publication" ? "#0284c7" : "#22d3ee"}
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                        {/* Peak Apex Centroid Dot */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3.5}
                          fill={themeMode === "publication" ? "#0284c7" : "#22d3ee"}
                          stroke="#ffffff"
                          strokeWidth={1.2}
                        />
                        {/* Floating Domain Size Pill Badge */}
                        <rect
                          x={cx - labelW / 2}
                          y={pinY - 12}
                          width={labelW}
                          height={15}
                          rx={4}
                          fill={themeMode === "publication" ? "#ffffff" : "#050b14"}
                          stroke={themeMode === "publication" ? "#0284c7" : "#06b6d4"}
                          strokeWidth={1}
                          className={themeMode === "publication" ? "shadow-sm" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"}
                        />
                        <text
                          x={cx}
                          y={pinY - 1}
                          textAnchor="middle"
                          fill={themeMode === "publication" ? "#0369a1" : "#67e8f9"}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {labelText}
                        </text>
                      </g>
                    );
                  }}
                />
              )}

              {/* Navigation Brush Slider */}
              {showBrush && (
                <Brush
                  dataKey="coordX"
                  height={26}
                  stroke={themeMode === "publication" ? "#0f172a" : "#22d3ee"}
                  fill={themeMode === "publication" ? "#f1f5f9" : "#0f172a"}
                  tickFormatter={(val) => Number(val).toFixed(coordSpace === "twoTheta" ? 0 : 1)}
                  style={{ opacity: 0.8 }}
                  travellerWidth={8}
                >
                  <AreaChart>
                    <Area type="monotone" dataKey="intensity" fill={themeMode === "publication" ? "#94a3b8" : "#22d3ee"} stroke="none" />
                  </AreaChart>
                </Brush>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* GSAS-II / FULLPROF STYLE HIGH-PRECISION SVG BRAGG REFLECTION & INTENSITY COMB */}
        {showBraggComb && activeCandidates.length > 0 && (
          <div className={`px-4 py-2.5 border-t transition-colors ${
            themeMode === "publication"
              ? "bg-slate-50 border-slate-200 text-slate-800"
              : "bg-[#060912] border-slate-800 text-slate-300"
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[10px] font-mono">
              <span className={`font-semibold uppercase tracking-wider flex items-center gap-2 ${
                themeMode === "publication" ? "text-slate-700" : "text-slate-300"
              }`}>
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                <span>Bragg Reflection Tick &amp; Intensity Comb (hkl)</span>
              </span>
              {hoveredCombPeak ? (
                <span className={`text-[10px] font-mono tabular-nums flex items-center gap-2 ${
                  themeMode === "publication" ? "text-slate-800" : "text-cyan-300"
                }`}>
                  <span className="font-semibold">{hoveredCombPeak.phase.split(" ")[0]}</span>
                  {hoveredCombPeak.hkl && <span>{hoveredCombPeak.hkl}</span>}
                  <span>· 2θ {hoveredCombPeak.twoTheta.toFixed(3)}°</span>
                  <span>· d {hoveredCombPeak.dSpacing.toFixed(4)} Å</span>
                  <span>· I<sub>rel</sub> {hoveredCombPeak.refI.toFixed(0)}%</span>
                </span>
              ) : (
                <span className={`text-[10px] tabular-nums ${
                  themeMode === "publication" ? "text-slate-500" : "text-slate-500"
                }`}>
                  Hover tick for reflection telemetry · Click to spotlight
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {activeCandidates.map((cand, cIdx) => {
                const peaks = getCalibratedRefPeaks(cand);
                const color = PHASE_PALETTES[cIdx % PHASE_PALETTES.length].primary;
                const domainIsNumeric =
                  typeof currentChartDomain[0] === "number" &&
                  typeof currentChartDomain[1] === "number";
                const rawFirst = chartData.length ? chartData[0].coordX : 10;
                const rawLast = chartData.length ? chartData[chartData.length - 1].coordX : 100;
                const minVal = domainIsNumeric
                  ? Math.min(Number(currentChartDomain[0]), Number(currentChartDomain[1]))
                  : Math.min(rawFirst, rawLast);
                const maxVal = domainIsNumeric
                  ? Math.max(Number(currentChartDomain[0]), Number(currentChartDomain[1]))
                  : Math.max(rawFirst, rawLast);
                const span = Math.max(0.0001, maxVal - minVal);

                return (
                  <div key={`comb-${cand.phase_name}-${cIdx}`} className="flex items-center gap-3">
                    <div className="w-36 flex items-center gap-1.5 shrink-0" title={cand.phase_name}>
                      <span className="w-2.5 h-1 shrink-0" style={{ backgroundColor: color }} />
                      <span className={`text-[10px] font-mono font-semibold truncate tabular-nums ${
                        themeMode === "publication" ? "text-slate-800" : "text-slate-200"
                      }`}>
                        {cand.phase_name.split(" ")[0]} ({peaks.length})
                      </span>
                    </div>

                    <div
                      className={`flex-1 relative h-8 rounded-md border overflow-hidden ${
                        themeMode === "publication"
                          ? "bg-white border-slate-200"
                          : "bg-[#09101F] border-slate-800"
                      }`}
                      onMouseLeave={() => setHoveredCombPeak(null)}
                    >
                      <svg viewBox="0 0 800 32" preserveAspectRatio="none" className="w-full h-full">
                        <line
                          x1="0"
                          y1="29"
                          x2="800"
                          y2="29"
                          stroke={themeMode === "publication" ? "#cbd5e1" : "#1e293b"}
                          strokeWidth="1"
                        />
                        {peaks.map((p, pIdx) => {
                          const coord = mapCoord(p.calibratedRefT);
                          const leftPct = ((coord - minVal) / span) * 100;
                          if (leftPct < 0 || leftPct > 100) return null;
                          const px = (leftPct / 100) * 800;
                          const tickH = Math.max(6, Math.min(24, Math.sqrt(Math.max(5, p.refI || 50)) * 2.3));
                          const hklStr =
                            p.h !== undefined && p.k !== undefined && p.l !== undefined
                              ? `(${p.h}${p.k}${p.l})`
                              : p.hkl
                              ? `(${p.hkl})`
                              : "";
                          const isHovered =
                            hoveredCombPeak &&
                            hoveredCombPeak.phase === cand.phase_name &&
                            Math.abs(hoveredCombPeak.twoTheta - p.calibratedRefT) < 0.001;

                          return (
                            <g
                              key={`svg-tick-${pIdx}`}
                              className="cursor-pointer"
                              onMouseEnter={() =>
                                setHoveredCombPeak({
                                  phase: cand.phase_name,
                                  hkl: hklStr,
                                  twoTheta: p.calibratedRefT,
                                  dSpacing: p.calibratedD ?? calcD(p.calibratedRefT),
                                  refI: p.refI || 0,
                                })
                              }
                              onClick={() => {
                                setFocusedTwoTheta(p.calibratedRefT);
                                setTimeout(() => setFocusedTwoTheta(null), 3500);
                              }}
                            >
                              <title>
                                {`${cand.phase_name} ${hklStr} · ${p.calibratedRefT.toFixed(3)}° 2θ · d=${(p.calibratedD ?? calcD(p.calibratedRefT)).toFixed(4)} Å · I=${(p.refI || 0).toFixed(0)}%`}
                              </title>
                              <rect x={px - 4} y={0} width={8} height={32} fill="transparent" />
                              <line
                                x1={px}
                                y1={29}
                                x2={px}
                                y2={29 - tickH}
                                stroke={color}
                                strokeWidth={isHovered ? "3" : "2"}
                                opacity={isHovered ? 1 : 0.88}
                              />
                              <circle cx={px} cy={29 - tickH} r={isHovered ? "2.4" : "1.5"} fill={color} />
                              {(p.refI >= 35 || isHovered) && hklStr && (
                                <text
                                  x={px}
                                  y={Math.max(8, 25 - tickH)}
                                  textAnchor="middle"
                                  fill={themeMode === "publication" ? "#0f172a" : "#e2e8f0"}
                                  fontSize="7.5"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {hklStr}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM RIETVELD SPLIT RESIDUAL DIFFERENCE CONSOLE (Synchronized X-Axis) */}
        {selectedCandidate && residualView === "split" && (
          <div className={`h-44 border-t px-3 py-2 flex flex-col relative z-10 transition-colors ${
            themeMode === "publication"
              ? "bg-slate-50 border-slate-200"
              : "bg-[#050811] border-slate-800"
          }`}>
            <div className="flex flex-wrap justify-between items-center gap-2 px-1 pb-1.5 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-0.5 inline-block ${
                  themeMode === "publication" ? "bg-blue-600" : "bg-amber-400"
                }`} />
                <span className={`font-semibold uppercase tracking-wider ${
                  themeMode === "publication" ? "text-slate-800" : "text-slate-200"
                }`}>
                  Rietveld Residual Difference (Y<sub>obs</sub> − Y<sub>calc</sub>)
                </span>
              </div>
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums text-[10px] ${
                themeMode === "publication" ? "text-slate-600" : "text-slate-400"
              }`}>
                <span>
                  Peak +ΔY:{" "}
                  <strong className={themeMode === "publication" ? "text-emerald-700" : "text-emerald-400"}>
                    +{residualStats.maxPos.toFixed(2)}
                  </strong>
                </span>
                <span>
                  Peak −ΔY:{" "}
                  <strong className={themeMode === "publication" ? "text-rose-700" : "text-rose-400"}>
                    {residualStats.maxNeg.toFixed(2)}
                  </strong>
                </span>
                <span>
                  RMS σ<sub>res</sub>:{" "}
                  <strong className={themeMode === "publication" ? "text-slate-900" : "text-slate-200"}>
                    ±{residualStats.rms.toFixed(2)}
                  </strong>
                </span>
                <span>
                  DW <em>d</em>:{" "}
                  <strong className={themeMode === "publication" ? "text-slate-900" : "text-slate-200"}>
                    {alignmentMetrics.durbinWatson.toFixed(2)}
                  </strong>
                </span>
                <span>
                  R<sub>wp</sub>:{" "}
                  <strong className={themeMode === "publication" ? "text-blue-700" : "text-amber-300"}>
                    {alignmentMetrics.rwp.toFixed(2)}%
                  </strong>
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 16, bottom: 2 }}>
                  <defs>
                    <linearGradient id="splitResidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeMode === "publication" ? "#2563eb" : "#f59e0b"} stopOpacity={themeMode === "publication" ? 0.22 : 0.38} />
                      <stop offset="95%" stopColor={themeMode === "publication" ? "#2563eb" : "#f59e0b"} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={themeMode === "publication" ? "#cbd5e1" : "#1e293b"} opacity={0.45} />
                  <XAxis
                    dataKey="coordX"
                    type="number"
                    domain={currentChartDomain as any}
                    allowDataOverflow
                    stroke={themeMode === "publication" ? "#64748b" : "#475569"}
                    tick={{ fill: themeMode === "publication" ? "#475569" : "#64748b", fontSize: 9, fontFamily: "monospace" }}
                    tickFormatter={(v) => Number(v).toFixed(1)}
                    height={18}
                  />
                  <YAxis
                    stroke={themeMode === "publication" ? "#64748b" : "#475569"}
                    tick={{ fill: themeMode === "publication" ? "#475569" : "#64748b", fontSize: 9, fontFamily: "monospace" }}
                    width={42}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div className={`px-2.5 py-1.5 rounded-md border text-[10px] font-mono tabular-nums ${
                          themeMode === "publication"
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-[#070D18] border-slate-700 text-slate-200"
                        }`}>
                          <div className={themeMode === "publication" ? "text-slate-500" : "text-slate-400"}>
                            {pt.twoTheta?.toFixed(4)}° 2θ {pt.dSpacing ? `· d=${pt.dSpacing.toFixed(4)} Å` : ""}
                          </div>
                          <div className={`font-semibold mt-0.5 ${themeMode === "publication" ? "text-blue-700" : "text-amber-400"}`}>
                            ΔY = {pt.signedResidual > 0 ? "+" : ""}{pt.signedResidual?.toFixed(3)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke={themeMode === "publication" ? "#2563eb" : "#f59e0b"} strokeWidth={1.25} />
                  {residualStats.rms > 0 && (
                    <>
                      <ReferenceLine
                        y={residualStats.rms}
                        stroke={themeMode === "publication" ? "#94a3b8" : "#475569"}
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <ReferenceLine
                        y={-residualStats.rms}
                        stroke={themeMode === "publication" ? "#94a3b8" : "#475569"}
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                    </>
                  )}
                  <Area
                    type={curveInterpolation}
                    dataKey="signedResidual"
                    stroke={themeMode === "publication" ? "#2563eb" : "#f59e0b"}
                    strokeWidth={1.5}
                    fill="url(#splitResidGrad)"
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BOTTOM STATUS & INSTRUMENT OPTICS FOOTER */}
        <div className={`w-full border-t px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono tabular-nums z-10 transition-colors ${
          themeMode === "publication"
            ? "bg-slate-100 border-slate-200 text-slate-600"
            : "bg-[#060912] border-slate-800 text-slate-400"
        }`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className={`flex items-center gap-1.5 font-semibold ${themeMode === "publication" ? "text-cyan-800" : "text-cyan-300"}`}>
              <span className="uppercase text-[9px] tracking-wider text-slate-500 font-normal">λ Source:</span>
              <span>{activeWavelength.toFixed(5)} Å ({selectedWavelengthId})</span>
            </div>
            <span className={themeMode === "publication" ? "text-slate-300" : "text-slate-700"}>·</span>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[9px] tracking-wider text-slate-500">Profile:</span>
              <span className={`font-semibold ${themeMode === "publication" ? "text-slate-900" : "text-slate-200"}`}>
                {profileModel === "pseudoVoigt" ? `Pseudo-Voigt (η=${Math.round(lorentzianFraction * 100)}%)` : profileModel} · FWHM {effFwhm.toFixed(2)}°
              </span>
            </div>
            <span className={themeMode === "publication" ? "text-slate-300" : "text-slate-700"}>·</span>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[9px] tracking-wider text-slate-500">Domain:</span>
              <span className={`font-semibold ${themeMode === "publication" ? "text-slate-900" : "text-slate-200"}`}>
                {coordSpace === "twoTheta" ? "2θ (Bragg)" : coordSpace === "dSpacing" ? "d-spacing (Å)" : "Q-vector (Å⁻¹)"} · {intensityScale}
              </span>
            </div>
            {enableKaDoublet && (
              <>
                <span className={themeMode === "publication" ? "text-slate-300" : "text-slate-700"}>·</span>
                <div className={`flex items-center gap-1.5 ${themeMode === "publication" ? "text-emerald-700" : "text-emerald-400"}`}>
                  <span className="font-semibold">Cu-Kα₁/Kα₂ Doublet</span>
                </div>
              </>
            )}
            {(zeroShiftDeg !== 0 || latticeStrainPct !== 0) && (
              <>
                <span className={themeMode === "publication" ? "text-slate-300" : "text-slate-700"}>·</span>
                <div className={`flex items-center gap-1.5 ${themeMode === "publication" ? "text-amber-700" : "text-amber-400"}`}>
                  <span className="uppercase text-[9px] tracking-wider">Offset:</span>
                  <span className="font-semibold">
                    Δ2θ {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}° | ε {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%
                  </span>
                  <button
                    onClick={handleResetCalibration}
                    className={`px-1.5 py-0.5 rounded-sm text-[9px] border font-semibold transition-colors ${
                      themeMode === "publication"
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40"
                    }`}
                    title="Reset both zero-shift and strain to zero"
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-[9px] text-slate-500">
            {showBrush && <span>Drag brush handles to pan angular window</span>}
          </div>
        </div>

        {/* EMPTY STATE BACKDROP */}
        {parsedPoints.length === 0 && !inputData?.trim() && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg z-20 border ${
            themeMode === "publication"
              ? "bg-white/95 border-slate-200"
              : "bg-[#070A12]/95 border-slate-800"
          }`}>
            <div className="flex flex-col items-center text-center px-6">
              <div className={`flex items-center justify-center w-14 h-14 rounded-lg border mb-4 ${
                themeMode === "publication"
                  ? "bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-[#0B101B] border-slate-800 text-cyan-400"
              }`}>
                <Compass className="w-6 h-6" />
              </div>
              <p className={`font-mono font-bold tracking-[0.18em] uppercase text-sm mb-1 ${
                themeMode === "publication" ? "text-slate-900" : "text-slate-100"
              }`}>
                Spectrometer Standby
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Awaiting Experimental Pattern or Peak List Input
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MULTI-PHASE MIXTURE CO-PLOTTING & NNLS QUANTIFICATION PANEL */}
      {candidates.length > 1 && (
        <div className={`mt-4 rounded-lg border flex flex-col relative z-10 overflow-hidden transition-colors ${
          themeMode === "publication"
            ? "bg-white border-slate-200 text-slate-800"
            : "bg-[#0B101B] border-slate-800 text-slate-200"
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b ${
            themeMode === "publication"
              ? "bg-slate-50 border-slate-200"
              : "bg-[#070A12] border-slate-800"
          }`}>
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${themeMode === "publication" ? "text-indigo-600" : "text-indigo-400"}`} />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                Multi-Phase Mixture Co-Plotting
              </span>
              {multiPhaseMode && (
                <span className="text-[10px] font-mono tabular-nums text-slate-500">
                  · {activeCandidates.length} active
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {multiPhaseMode && activeCandidates.length > 1 && (
                <>
                  <button
                    onClick={handleAutoFitPhaseFractions}
                    disabled={isOptimizingFractions}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-colors ${
                      themeMode === "publication"
                        ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30 disabled:opacity-50"
                    }`}
                  >
                    {isOptimizingFractions ? "Fitting NNLS..." : "Auto-Fit (NNLS)"}
                  </button>
                  <button
                    onClick={handleNormalizePhaseFractions}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-colors ${
                      themeMode === "publication"
                        ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        : "bg-[#0B101B] text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    Normalize 100%
                  </button>
                </>
              )}
              <label className="flex items-center gap-2 text-[11px] font-mono cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={multiPhaseMode}
                  onChange={(e) => setMultiPhaseMode(e.target.checked)}
                  className="rounded-sm border-slate-600 text-indigo-500 focus:ring-indigo-400"
                />
                <span>Multi-Phase Overlay</span>
              </label>
            </div>
          </div>

          {phaseFractionsOptimizationStatus && multiPhaseMode && (
            <div className={`px-4 py-1.5 border-b text-[10px] font-mono tabular-nums ${
              themeMode === "publication"
                ? "bg-emerald-50 border-slate-200 text-emerald-800"
                : "bg-emerald-950/30 border-slate-800 text-emerald-300"
            }`}>
              {phaseFractionsOptimizationStatus}
            </div>
          )}

          {(() => {
            const totalActiveWeight = activeCandidates.reduce(
              (acc, c) => acc + (phaseWeights[c.phase_name] ?? 1.0),
              0
            );

            return (
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {candidates.map((cand, idx) => {
                  const isSelected = selectedCandidate?.phase_name === cand.phase_name;
                  const isActiveInMulti = activePhaseNames.includes(cand.phase_name);
                  const palette = PHASE_PALETTES[idx % PHASE_PALETTES.length];
                  const weight = phaseWeights[cand.phase_name] ?? 1.0;
                  const normPct =
                    isActiveInMulti && totalActiveWeight > 0
                      ? (weight / totalActiveWeight) * 100
                      : 0;

                  return (
                    <div
                      key={cand.phase_name + idx}
                      className={`flex flex-col gap-2 px-3 py-2.5 rounded-md border transition-colors text-xs font-mono ${
                        isSelected
                          ? themeMode === "publication"
                            ? "bg-indigo-50/70 border-indigo-400 text-slate-900"
                            : "bg-indigo-950/30 border-indigo-500/70 text-white"
                          : themeMode === "publication"
                          ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                          : "bg-[#060912] border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {multiPhaseMode && (
                            <input
                              type="checkbox"
                              checked={isActiveInMulti}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setActivePhaseNames([...activePhaseNames, cand.phase_name]);
                                } else {
                                  setActivePhaseNames(activePhaseNames.filter((name) => name !== cand.phase_name));
                                }
                              }}
                              className="rounded-sm border-slate-600 text-indigo-500 shrink-0"
                            />
                          )}
                          <span className="w-2.5 h-1 shrink-0" style={{ backgroundColor: palette.primary }} />
                          <button
                            onClick={() => onSelectCandidate && onSelectCandidate(cand)}
                            className="font-semibold truncate text-left hover:underline"
                            title={cand.phase_name}
                          >
                            {cand.phase_name}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                          {cand.confidence_score.toFixed(0)}% match
                        </span>
                      </div>

                      {multiPhaseMode && isActiveInMulti && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/30">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 w-9 shrink-0">
                            Wt%
                          </span>
                          <input
                            type="range"
                            min={0.05}
                            max={2.0}
                            step={0.05}
                            value={weight}
                            onChange={(e) =>
                              setPhaseWeights((prev) => ({
                                ...prev,
                                [cand.phase_name]: parseFloat(e.target.value),
                              }))
                            }
                            className="flex-1 h-1 accent-indigo-500 cursor-pointer"
                          />
                          <span className="text-[10px] font-semibold tabular-nums w-11 text-right">
                            {normPct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* PYCRYSTALLINE RAG COPROCESSOR DIAGNOSTICS */}
      {selectedCandidate && ((selectedCandidate as any).fitted_strain_pct !== undefined || pythonRAGResults) && (
        <div className={`mt-4 rounded-lg border relative z-10 overflow-hidden transition-colors ${
          themeMode === "publication"
            ? "bg-white border-slate-200 text-slate-800"
            : "bg-[#0B101B] border-slate-800 text-slate-200"
        }`}>
          <div className={`flex justify-between items-center px-4 py-2.5 border-b ${
            themeMode === "publication"
              ? "bg-slate-50 border-slate-200"
              : "bg-[#070A12] border-slate-800"
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
              <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                themeMode === "publication" ? "text-slate-900" : "text-slate-100"
              }`}>
                PyCrystalline RAG Coprocessor Diagnostics
              </span>
              <span className={`text-[10px] font-mono ${
                themeMode === "publication" ? "text-emerald-700" : "text-emerald-400"
              }`}>
                · Converged
              </span>
            </div>
            <button
              onClick={() => setShowRagDiagnostics(!showRagDiagnostics)}
              className={`p-1 rounded-md transition-colors ${
                themeMode === "publication"
                  ? "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              aria-label="Toggle RAG diagnostics"
            >
              {showRagDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showRagDiagnostics && (
            <div className="flex flex-col">
              <div className={`grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x ${
                themeMode === "publication" ? "divide-slate-200" : "divide-slate-800"
              }`}>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Calculated Lattice Strain (ε)
                  </span>
                  <span className={`text-2xl font-bold font-mono tabular-nums ${
                    themeMode === "publication" ? "text-amber-700" : "text-amber-300"
                  }`}>
                    {((selectedCandidate as any).fitted_strain_pct)?.toFixed(4) || "0.0000"}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans leading-snug">
                    {(selectedCandidate as any).fitted_strain_pct > 0
                      ? "Tensile (dilation)"
                      : (selectedCandidate as any).fitted_strain_pct < 0
                      ? "Compressive (contraction)"
                      : "Zero residual strain"} · Grid-descent convolution
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Domain Broadening Scale (σ)
                  </span>
                  <span className={`text-2xl font-bold font-mono tabular-nums ${
                    themeMode === "publication" ? "text-cyan-700" : "text-cyan-300"
                  }`}>
                    {((selectedCandidate as any).fitted_domain_size_broadening)?.toFixed(2) || "0.18"}°
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans leading-snug">
                    Gaussian standard deviation modeling nanocrystalline domain size broadening.
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Core Retrieval Cosine
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold font-mono tabular-nums ${
                      themeMode === "publication" ? "text-emerald-700" : "text-emerald-300"
                    }`}>
                      {((selectedCandidate as any).raw_score)?.toFixed(2) || "95.00"}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Raw</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-sans leading-snug">
                    Continuous cosine overlap over the uncompensated angular grid.
                  </span>
                </div>
              </div>

              {pythonRAGResults?.gemini_analysis && (
                <div className={`border-t p-4 flex flex-col gap-2 ${
                  themeMode === "publication" ? "border-slate-200 bg-slate-50/60" : "border-slate-800 bg-[#060912]"
                }`}>
                  <div className={`flex items-center gap-1.5 font-mono font-semibold text-[10px] uppercase tracking-wider ${
                    themeMode === "publication" ? "text-slate-700" : "text-amber-300"
                  }`}>
                    <Activity className="w-3.5 h-3.5" />
                    Synthesized Crystallographic Assessment
                  </div>
                  <div className={`font-sans text-xs leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar select-text ${
                    themeMode === "publication" ? "text-slate-700" : "text-slate-300"
                  }`}>
                    {pythonRAGResults.gemini_analysis}
                  </div>
                </div>
              )}

              {pythonRAGResults?.literature_docs && pythonRAGResults.literature_docs.length > 0 && (
                <div className={`border-t p-4 flex flex-col gap-2 ${
                  themeMode === "publication" ? "border-slate-200" : "border-slate-800"
                }`}>
                  <div className={`flex items-center gap-1.5 font-mono font-semibold text-[10px] uppercase tracking-wider ${
                    themeMode === "publication" ? "text-slate-700" : "text-slate-300"
                  }`}>
                    <BookOpen className="w-3.5 h-3.5" />
                    Retrieved Reference Literature
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {pythonRAGResults.literature_docs.map((doc: any, i: number) => (
                      <div
                        key={i}
                        className={`border rounded-md p-3 flex flex-col gap-1 ${
                          themeMode === "publication"
                            ? "bg-slate-50 border-slate-200"
                            : "bg-[#060912] border-slate-800"
                        }`}
                      >
                        <span className={`text-[11px] font-semibold font-mono leading-tight ${
                          themeMode === "publication" ? "text-slate-900" : "text-amber-300"
                        }`}>
                          {doc.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans leading-relaxed line-clamp-3">
                          {doc.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REFLECTION TABLE INSPECTOR DRAWER */}
      <AnimatePresence>
        {showReflectionTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-4 rounded-lg border overflow-hidden relative z-20 ${
              themeMode === "publication"
                ? "bg-white border-slate-200 text-slate-800"
                : "bg-[#0B101B] border-slate-800 text-slate-200"
            }`}
          >
            <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b ${
              themeMode === "publication"
                ? "bg-slate-50 border-slate-200"
                : "bg-[#070A12] border-slate-800"
            }`}>
              <div className="flex items-center gap-2">
                <Table className={`w-4 h-4 ${themeMode === "publication" ? "text-indigo-600" : "text-indigo-400"}`} />
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
                  Indexed Bragg Reflections · {selectedCandidate?.phase_name}
                </h4>
                <span className="text-[10px] font-mono tabular-nums text-slate-500">
                  ({filteredReflections.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={reflectionSearch}
                    onChange={(e) => setReflectionSearch(e.target.value)}
                    placeholder="Filter (hkl), 2θ, d..."
                    className={`pl-8 pr-3 py-1 border rounded-md text-[11px] font-mono focus:outline-none w-48 ${
                      themeMode === "publication"
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                        : "bg-[#060912] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                    }`}
                  />
                </div>
                <button
                  onClick={() => setShowReflectionTable(false)}
                  className={`p-1 rounded-md transition-colors ${
                    themeMode === "publication"
                      ? "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  aria-label="Close reflections table"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar">
              <table className="w-full font-mono text-[11px] tabular-nums border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className={`border-b uppercase tracking-wider text-[9px] ${
                    themeMode === "publication"
                      ? "bg-slate-50 border-slate-200 text-slate-500"
                      : "bg-[#070A12] border-slate-800 text-slate-400"
                  }`}>
                    <th className="py-2 px-3 text-left">Miller (hkl)</th>
                    <th className="py-2 px-3 text-right">Calibrated 2θ (°)</th>
                    <th className="py-2 px-3 text-right">Nominal 2θ (°)</th>
                    <th className="py-2 px-3 text-right">Δ2θ (°)</th>
                    <th className="py-2 px-3 text-right">d-spacing (Å)</th>
                    <th className="py-2 px-3 text-right">Relative I (%)</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  themeMode === "publication" ? "divide-slate-200" : "divide-slate-800/70"
                }`}>
                  {filteredReflections.map((ref, idx) => {
                    const deltaTwoTheta = ref.twoTheta - ref.originalRefT;
                    const barPct = Math.max(2, Math.min(100, ref.rawRefIntensity));
                    return (
                      <tr
                        key={`ref-row-${idx}`}
                        className={`transition-colors ${
                          focusedTwoTheta === ref.twoTheta
                            ? themeMode === "publication"
                              ? "bg-cyan-50"
                              : "bg-cyan-950/30"
                            : themeMode === "publication"
                            ? "hover:bg-slate-50"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className={`py-2 px-3 font-semibold text-left ${
                          themeMode === "publication" ? "text-rose-700" : "text-rose-300"
                        }`}>
                          {ref.hkl ? `(${ref.hkl})` : "—"}
                        </td>
                        <td className={`py-2 px-3 text-right font-semibold ${
                          themeMode === "publication" ? "text-cyan-800" : "text-cyan-300"
                        }`}>
                          {ref.twoTheta.toFixed(3)}°
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {ref.originalRefT.toFixed(3)}°
                        </td>
                        <td className={`py-2 px-3 text-right ${
                          Math.abs(deltaTwoTheta) < 0.001
                            ? "text-slate-500"
                            : themeMode === "publication"
                            ? "text-amber-700"
                            : "text-amber-300"
                        }`}>
                          {deltaTwoTheta >= 0 ? "+" : ""}{deltaTwoTheta.toFixed(3)}°
                        </td>
                        <td className={`py-2 px-3 text-right ${
                          themeMode === "publication" ? "text-emerald-700" : "text-emerald-300"
                        }`}>
                          {ref.dSpacing.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <div className={`w-14 h-1.5 rounded-sm overflow-hidden ${
                              themeMode === "publication" ? "bg-slate-200" : "bg-slate-800"
                            }`}>
                              <div
                                className={themeMode === "publication" ? "h-full bg-indigo-600" : "h-full bg-cyan-400"}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right">{ref.rawRefIntensity.toFixed(0)}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setFocusedTwoTheta(ref.twoTheta);
                                setTimeout(() => setFocusedTwoTheta(null), 3500);
                              }}
                              className={`px-2 py-0.5 rounded-sm border text-[10px] font-semibold transition-colors ${
                                themeMode === "publication"
                                  ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                                  : "bg-[#060912] border-slate-700 text-cyan-300 hover:border-cyan-500/60"
                              }`}
                            >
                              Focus
                            </button>
                            <button
                              onClick={() =>
                                handleSendToCaliper({
                                  twoTheta: ref.twoTheta,
                                  intensity: ref.rawRefIntensity,
                                  dSpacing: ref.dSpacing,
                                  q: calcQ(ref.twoTheta),
                                })
                              }
                              className={`px-2 py-0.5 rounded-sm border text-[10px] font-semibold transition-colors ${
                                themeMode === "publication"
                                  ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                                  : "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                              }`}
                            >
                              Caliper
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PEAK APEX ULTRA-PRECISION INSPECTOR LENS MODAL */}
      <AnimatePresence>
        {showPeakApexModal && inspectedPeak && (() => {
          const currentIdx = detectedPeaks.findIndex(
            (p) => Math.abs(p.twoTheta - inspectedPeak.twoTheta) < 0.0005
          );
          const peakCount = detectedPeaks.length;
          const canStep = peakCount > 1 && currentIdx >= 0;
          const stepPeak = (dir: -1 | 1) => {
            if (!canStep) return;
            const nextIdx = (currentIdx + dir + peakCount) % peakCount;
            setInspectedPeak(detectedPeaks[nextIdx]);
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPeakApexModal(false)}
            >
              <div
                className={`w-full max-w-2xl rounded-lg border font-mono text-xs flex flex-col overflow-hidden relative ${
                  themeMode === "publication"
                    ? "bg-white border-slate-300 text-slate-900"
                    : "bg-[#0B101B] border-slate-700 text-slate-200"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`flex items-center justify-between gap-3 px-5 py-3.5 border-b ${
                  themeMode === "publication"
                    ? "bg-slate-50 border-slate-200"
                    : "bg-[#070A12] border-slate-800"
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 ${
                      themeMode === "publication"
                        ? "bg-white border-slate-300 text-cyan-700"
                        : "bg-[#0B101B] border-slate-700 text-cyan-400"
                    }`}>
                      <Focus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs uppercase tracking-wider truncate">
                        Peak Apex Precision Lens (10× Magnifier)
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        Sub-millidegree centroid · FWHM half-max chord · Kα₁/Kα₂ doublet
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canStep && (
                      <div className={`flex items-center rounded-md border overflow-hidden ${
                        themeMode === "publication"
                          ? "bg-white border-slate-300"
                          : "bg-[#060912] border-slate-700"
                      }`}>
                        <button
                          onClick={() => stepPeak(-1)}
                          className={`p-1.5 transition-colors ${
                            themeMode === "publication" ? "hover:bg-slate-100" : "hover:bg-slate-800"
                          }`}
                          title="Previous detected peak"
                          aria-label="Previous peak"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-[10px] tabular-nums text-slate-500 border-x border-slate-700/30">
                          Peak {currentIdx + 1} / {peakCount}
                        </span>
                        <button
                          onClick={() => stepPeak(1)}
                          className={`p-1.5 transition-colors ${
                            themeMode === "publication" ? "hover:bg-slate-100" : "hover:bg-slate-800"
                          }`}
                          title="Next detected peak"
                          aria-label="Next peak"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setShowPeakApexModal(false)}
                      className={`p-1.5 rounded-md transition-colors ${
                        themeMode === "publication"
                          ? "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                      aria-label="Close peak apex lens"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Primary Telemetry Grid */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-b tabular-nums ${
                  themeMode === "publication"
                    ? "border-slate-200 divide-slate-200"
                    : "border-slate-800 divide-slate-800"
                }`}>
                  <div className="p-3.5 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Centroid (2θ)</span>
                    <span className={`text-base font-bold mt-0.5 ${
                      themeMode === "publication" ? "text-cyan-800" : "text-cyan-300"
                    }`}>
                      {inspectedPeak.twoTheta.toFixed(4)}°
                    </span>
                    <span className="text-[9px] text-slate-500">±0.0002° fit</span>
                  </div>

                  <div className="p-3.5 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">d-spacing</span>
                    <span className={`text-base font-bold mt-0.5 ${
                      themeMode === "publication" ? "text-emerald-700" : "text-emerald-300"
                    }`}>
                      {calcD(inspectedPeak.twoTheta).toFixed(5)} Å
                    </span>
                    <span className="text-[9px] text-slate-500">λ={activeWavelength.toFixed(5)} Å</span>
                  </div>

                  <div className="p-3.5 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Observed FWHM</span>
                    <span className={`text-base font-bold mt-0.5 ${
                      themeMode === "publication" ? "text-indigo-700" : "text-purple-300"
                    }`}>
                      {inspectedPeak.fwhmObs.toFixed(4)}°
                    </span>
                    <span className="text-[9px] text-slate-500">β<sub>sample</sub> {inspectedPeak.fwhmSample.toFixed(4)}°</span>
                  </div>

                  <div className="p-3.5 flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Scherrer Domain</span>
                    <span className={`text-base font-bold mt-0.5 ${
                      themeMode === "publication" ? "text-amber-700" : "text-amber-300"
                    }`}>
                      {inspectedPeak.crystalliteSizeNm} nm
                    </span>
                    <span className="text-[9px] text-slate-500">K={shapeFactorK}</span>
                  </div>
                </div>

                {/* Secondary Microstructure Telemetry */}
                <div className={`grid grid-cols-3 divide-x border-b text-[10px] tabular-nums ${
                  themeMode === "publication"
                    ? "bg-slate-50 border-slate-200 divide-slate-200"
                    : "bg-[#060912] border-slate-800 divide-slate-800"
                }`}>
                  <div className="px-4 py-2.5">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Net Intensity</span>
                    <span className="font-semibold text-xs">
                      {inspectedPeak.rawIntensity?.toLocaleString() || inspectedPeak.intensity?.toLocaleString()} cps
                    </span>
                  </div>
                  <div className="px-4 py-2.5">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Integrated Area</span>
                    <span className="font-semibold text-xs">
                      {inspectedPeak.integratedArea?.toFixed(2)} counts·deg
                    </span>
                  </div>
                  <div className="px-4 py-2.5">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Microstrain (ε)</span>
                    <span className="font-semibold text-xs">
                      {inspectedPeak.microstrainPct ? `${inspectedPeak.microstrainPct.toFixed(4)}%` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Peak Micro-Chart with 10x Zoom */}
                <div className="p-4">
                  <div className={`h-52 w-full rounded-md border p-2 relative overflow-hidden ${
                    themeMode === "publication"
                      ? "bg-white border-slate-200"
                      : "bg-[#050811] border-slate-800"
                  }`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData.filter(
                          (d) => Math.abs(d.twoTheta - inspectedPeak.twoTheta) <= Math.max(1.0, inspectedPeak.fwhmObs * 4.5)
                        )}
                        margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="2 4"
                          stroke={themeMode === "publication" ? "#cbd5e1" : "#1e293b"}
                          opacity={0.55}
                        />
                        <XAxis
                          dataKey="twoTheta"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          stroke={themeMode === "publication" ? "#64748b" : "#475569"}
                          tick={{
                            fill: themeMode === "publication" ? "#475569" : "#94a3b8",
                            fontSize: 9,
                            fontFamily: "monospace",
                          }}
                          tickFormatter={(v) => Number(v).toFixed(3)}
                        />
                        <YAxis
                          stroke={themeMode === "publication" ? "#64748b" : "#475569"}
                          tick={{
                            fill: themeMode === "publication" ? "#475569" : "#64748b",
                            fontSize: 9,
                            fontFamily: "monospace",
                          }}
                          width={40}
                        />
                        <ReferenceLine
                          x={inspectedPeak.twoTheta}
                          stroke={themeMode === "publication" ? "#0284c7" : "#22d3ee"}
                          strokeWidth={1.5}
                          strokeDasharray="3 2"
                          label={{
                            value: "Apex",
                            position: "top",
                            fill: themeMode === "publication" ? "#0284c7" : "#22d3ee",
                            fontSize: 9,
                          }}
                        />
                        <Area
                          type={curveInterpolation}
                          dataKey="intensity"
                          stroke={themeMode === "publication" ? "#0f172a" : "#06b6d4"}
                          fill={themeMode === "publication" ? "#0284c7" : "#06b6d4"}
                          fillOpacity={themeMode === "publication" ? 0.12 : 0.2}
                          strokeWidth={2}
                          name="Observed Diffractogram"
                          isAnimationActive={false}
                        />
                        {showCalcProfile && (
                          <Line
                            type={curveInterpolation}
                            dataKey="refIntensity"
                            stroke="#e11d48"
                            strokeWidth={2}
                            dot={false}
                            name="Calculated Reference"
                            isAnimationActive={false}
                          />
                        )}
                        {showKaDoubletSplitCurves && enableKaDoublet && (
                          <>
                            <Line
                              type={curveInterpolation}
                              dataKey="refIntensityKa1"
                              stroke="#10b981"
                              strokeWidth={1.4}
                              strokeDasharray="3 2"
                              dot={false}
                              name="Kα1"
                              isAnimationActive={false}
                            />
                            <Line
                              type={curveInterpolation}
                              dataKey="refIntensityKa2"
                              stroke="#a855f7"
                              strokeWidth={1.4}
                              strokeDasharray="3 3"
                              dot={false}
                              name="Kα2"
                              isAnimationActive={false}
                            />
                          </>
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Action Footer */}
                <div className={`flex items-center justify-between px-5 py-3 border-t ${
                  themeMode === "publication"
                    ? "bg-slate-50 border-slate-200"
                    : "bg-[#070A12] border-slate-800"
                }`}>
                  <button
                    onClick={() => {
                      handleSendToCaliper({
                        twoTheta: inspectedPeak.twoTheta,
                        intensity: inspectedPeak.intensity,
                        dSpacing: calcD(inspectedPeak.twoTheta),
                        q: calcQ(inspectedPeak.twoTheta),
                      });
                      setShowPeakApexModal(false);
                    }}
                    className={`px-3 py-1.5 rounded-md border font-semibold transition-colors flex items-center gap-1.5 ${
                      themeMode === "publication"
                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Measure in Caliper
                  </button>
                  <button
                    onClick={() => setShowPeakApexModal(false)}
                    className={`px-4 py-1.5 rounded-md border font-semibold transition-colors ${
                      themeMode === "publication"
                        ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
                        : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    Close Lens
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ADVANCED MICROSTRUCTURE & CRYSTALLITE DOMAIN SIZE INSPECTOR DRAWER */}
      <MicrostructureInspectorDrawer
        isOpen={showInspectorDrawer}
        onClose={() => setShowInspectorDrawer(false)}
        detectedPeaks={detectedPeaks}
        williamsonHall={williamsonHall}
        filteredReflections={staggeredRefPeaks}
        focusedTwoTheta={focusedTwoTheta}
        onFocusPeak={(twoTheta) => {
          setFocusedTwoTheta(twoTheta);
          setTimeout(() => setFocusedTwoTheta(null), 3500);
        }}
        onSendToCaliper={handleSendToCaliper}
        lambda={activeWavelength}
        instrumentalFwhm={instrumentalFwhm}
        onInstrumentalFwhmChange={setInstrumentalFwhm}
        shapeFactorK={shapeFactorK}
        onShapeFactorKChange={setShapeFactorK}
        minProminencePct={minProminencePct}
        onMinProminenceChange={setMinProminencePct}
        activeCandidates={activeCandidates}
        phaseWeights={phaseWeights}
        onPhaseWeightChange={(name, weight) => setPhaseWeights((prev) => ({ ...prev, [name]: weight }))}
        onAutoFitPhaseFractions={handleAutoFitPhaseFractions}
        onNormalizePhaseFractions={handleNormalizePhaseFractions}
        isOptimizingFractions={isOptimizingFractions}
        phaseFractionsOptimizationStatus={phaseFractionsOptimizationStatus}
        themeMode={themeMode}
      />
    </div>
  );
};
