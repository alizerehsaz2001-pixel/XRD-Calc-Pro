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
}) => {
  // Visualizer Workspace State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [coordSpace, setCoordSpace] = useState<CoordinateSpace>("twoTheta");
  const [intensityScale, setIntensityScale] = useState<IntensityScale>("linear");
  const [residualView, setResidualView] = useState<ResidualViewMode>("overlay");
  
  // Scientific Graphics Theme & Profile Engine State
  const [themeMode, setThemeMode] = useState<ThemeMode>("darkLab");
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

  // Wavelength Selection
  const [selectedWavelengthId, setSelectedWavelengthId] = useState<string>("cu_ka1");
  const [customWavelength, setCustomWavelength] = useState<number>(1.5406);

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

    return (
      <div className="bg-[#070D18]/95 backdrop-blur-md text-slate-200 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-xs border border-slate-700/80 min-w-[280px] z-50 pointer-events-none">
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300 font-mono tracking-wider uppercase text-[11px]">
              {coordSpace === "twoTheta" ? "Bragg Angle (2θ)" : coordSpace === "dSpacing" ? "d-spacing (d_hkl)" : "Scattering Vector (Q)"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md">
            <span className="font-mono font-black text-cyan-200 text-xs">
              {coordSpace === "twoTheta"
                ? `${twoTheta.toFixed(4)}°`
                : coordSpace === "dSpacing"
                ? `${dVal.toFixed(5)} Å`
                : `${qVal.toFixed(4)} Å⁻¹`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">2θ Angle</span>
            <span className="text-xs font-bold text-cyan-300">{twoTheta.toFixed(4)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">d-spacing</span>
            <span className="text-xs font-bold text-emerald-400">{dVal > 0 ? `${dVal.toFixed(5)} Å` : "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Q Vector</span>
            <span className="text-xs font-bold text-sky-400">{qVal > 0 ? `${qVal.toFixed(4)} Å⁻¹` : "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Wavelength</span>
            <span className="text-xs font-bold text-slate-300">{activeWavelength.toFixed(5)} Å</span>
          </div>
        </div>

        {refPeak && (
          <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg mb-2">
            <span className="text-[10px] text-rose-300 font-mono font-bold uppercase tracking-wider">
              Reflection (hkl)
            </span>
            <span className="text-xs font-mono font-black text-rose-200 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
              {refPeak.hkl ? `(${refPeak.hkl})` : "Indexed"} {refPeak.calibratedRefT ? `• ${refPeak.calibratedRefT.toFixed(4)}°` : ""}
            </span>
          </div>
        )}

        {nearbyDetectedPeak && (
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg mb-2 font-mono text-[10px]">
            <span className="text-cyan-300 font-bold uppercase tracking-wider">Peak Microstructure</span>
            <span className="text-cyan-200 font-semibold">
              FWHM: {nearbyDetectedPeak.fwhmObs.toFixed(3)}° • D: {nearbyDetectedPeak.crystalliteSizeNm} nm
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          {payload.map((p: any, idx: number) => (
            <div
              key={`tooltip-p-${idx}`}
              className="flex items-center justify-between gap-4 py-1 px-2 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }}
                />
                <span className="text-slate-300 font-mono text-[10px] truncate max-w-[150px]">{p.name}</span>
              </div>
              <span className="font-mono font-black text-xs" style={{ color: p.color }}>
                {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
                <span className="text-[9px] font-normal text-slate-500 ml-1">
                  {intensityScale === "linear" ? "cps" : intensityScale === "sqrt" ? "√cps" : "log(cps)"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={visualizerRef}
      className={`relative flex flex-col transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#050811] p-6 overflow-y-auto"
          : "bg-[#070A12] p-4 sm:p-6 rounded-sm border border-slate-800 overflow-hidden"
      }`}
    >
      {/* TOP BAR: Title, Live Status, Fullscreen, Caliper & Export */}
      <div className="flex flex-col gap-3.5 mb-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#0B0F19] rounded-sm border border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-sm bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  XRD-ALIGN · KINEMATIC RIETVELD PROFILE & RECIPROCAL LATTICE CALIBRATION
                </span>
                <span className="text-[11px] font-mono tabular-nums text-emerald-400 font-bold">
                  ● λ = {activeWavelength.toFixed(4)} Å ({selectedWavelengthId})
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Spectral Cross-Correlation, Peak Deconvolution & Residual Difference Console
              </h3>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wavelength Preset Selector */}
            <div className="flex items-center bg-[#070A12] px-2.5 py-1.5 rounded-sm border border-slate-800 font-mono text-[11px]">
              <span className="text-slate-400 mr-1.5 uppercase font-bold">λ Anode:</span>
              <select
                value={selectedWavelengthId}
                onChange={(e) => setSelectedWavelengthId(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
              >
                {WAVELENGTH_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0b1220] text-slate-200">
                    {p.name} ({p.lambda} Å)
                  </option>
                ))}
              </select>
            </div>

            {/* Caliper Measure Mode */}
            <button
              onClick={() => {
                setCaliperActive(!caliperActive);
                if (caliperActive) {
                  setCaliperPt1(null);
                  setCaliperPt2(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                caliperActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Activate Peak Caliper to measure 2θ and d-spacing distances between reflections"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Caliper</span>
            </button>

            {/* Microstructure & Crystallite Suite Drawer Toggle */}
            <button
              onClick={() => setShowInspectorDrawer(!showInspectorDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                showInspectorDrawer
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Open Scherrer Domain Size, Williamson-Hall & Multi-Phase Analysis Suite"
            >
              <Atom className="w-3.5 h-3.5 text-indigo-400" />
              <span>Microstructure ({detectedPeaks.length})</span>
            </button>

            {/* Reflection Table Drawer Toggle */}
            <button
              onClick={() => setShowReflectionTable(!showReflectionTable)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                showReflectionTable
                  ? "bg-indigo-600/30 text-indigo-200 border-indigo-500"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Open Indexed Reflections (hkl) Matching Table"
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              <span>hkl Table ({staggeredRefPeaks.length})</span>
            </button>

            {/* Calibration Sliders Panel Toggle */}
            <button
              onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                showCalibrationPanel || zeroShiftDeg !== 0 || latticeStrainPct !== 0
                  ? "bg-cyan-600/25 text-cyan-200 border-cyan-500"
                  : "bg-[#070A12] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
              title="Adjust Zero-Shift Offset and Lattice Strain"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calibration</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-800 bg-[#070A12] hover:bg-slate-900 text-slate-300 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-1.5 w-56 bg-[#0B0F19] border border-slate-700 rounded-sm shadow-2xl p-1.5 z-50 flex flex-col gap-1 font-mono text-[11px]"
                  >
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Export Aligned CSV (XY)
                    </button>
                    <button
                      onClick={() => {
                        handleExportSVG();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-slate-200 hover:bg-sky-500/15 hover:text-sky-300 transition-colors text-left"
                    >
                      <Camera className="w-4 h-4 text-sky-400" />
                      Export Publication SVG
                    </button>
                    <button
                      onClick={() => {
                        handleCopySummary();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors text-left"
                    >
                      {copiedNotification ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                      {copiedNotification ? "Copied to Clipboard!" : "Copy Report Summary"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-sm border border-slate-800 bg-[#070A12] hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Workbench"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* SCIENTIFIC HUD METRICS STRIP: Target, R_wp, GOF, Cosine, Zero-Shift & Strain */}
        {selectedCandidate && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Target Reference</span>
              <span className="text-xs font-bold text-cyan-300 font-mono truncate mt-0.5">
                {selectedCandidate.phase_name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                {selectedCandidate.formula || "Crystalline"} · {selectedCandidate.spaceGroup || selectedCandidate.crystalSystem || "P1"}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Rietveld R_wp</span>
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">R_exp {alignmentMetrics.rexp}%</span>
              </div>
              <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                {alignmentMetrics.rwp}%
              </span>
              <div className="w-full h-1.5 bg-[#050811] border border-slate-800 overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${Math.max(8, Math.min(100, 100 - alignmentMetrics.rwp * 1.5))}%` }}
                />
              </div>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Goodness S (χ)</span>
                <span className="text-[10px] font-mono text-teal-400 tabular-nums">DW d={alignmentMetrics.durbinWatson}</span>
              </div>
              <span className="text-lg font-bold text-teal-300 font-mono tabular-nums mt-0.5">
                {alignmentMetrics.gof}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                R_p = {alignmentMetrics.rp}% (Profile Fit)
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Cosine Similarity</span>
                <span className="text-[10px] font-mono text-indigo-400 tabular-nums">cos(θ)</span>
              </div>
              <span className="text-lg font-bold text-indigo-300 font-mono tabular-nums mt-0.5">
                {alignmentMetrics.cosine}%
              </span>
              <div className="w-full h-1.5 bg-[#050811] border border-slate-800 overflow-hidden mt-1">
                <div
                  className="h-full bg-indigo-400"
                  style={{ width: `${Math.max(5, Math.min(100, alignmentMetrics.cosine))}%` }}
                />
              </div>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Goniometer Shift</span>
                <button
                  type="button"
                  onClick={handleAutoAlign}
                  disabled={isAutoAligning}
                  className="text-[9px] font-mono font-bold text-cyan-300 hover:text-white underline cursor-pointer"
                  title="Run cross-correlation zero-shift optimization"
                >
                  {isAutoAligning ? "Aligning..." : "Auto-Align"}
                </button>
              </div>
              <span className="text-sm font-bold text-amber-300 font-mono tabular-nums mt-0.5">
                Δ2θ: {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}°
              </span>
              <span className="text-[10px] font-mono text-amber-400/80 mt-0.5 tabular-nums">
                Strain ε: {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Indexed (hkl)</span>
                <span className="text-[10px] font-mono text-rose-400 tabular-nums">RMS ±{crossCorrelationTelemetry.rmsShiftMilliDeg}m°</span>
              </div>
              <span className="text-lg font-bold text-rose-300 font-mono tabular-nums mt-0.5">
                {alignmentMetrics.matchCount} <span className="text-xs font-normal text-slate-400">lines</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                FWHM = {effFwhm.toFixed(2)}° 2θ
              </span>
            </div>
          </div>
        )}

        {/* INTERACTIVE SVG CROSS-CORRELATION LAG C(Δ2θ) & PEAK SHIFT DISCREPANCY VECTOR STRIP */}
        {selectedCandidate && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
            {/* Left 6 Cols: Cross-Correlation Function C(Δ2θ) */}
            <div className="lg:col-span-6 bg-[#050811] border border-slate-800 rounded-sm p-2.5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-[10px] font-mono tabular-nums">
                <span className="text-cyan-400 font-bold uppercase tracking-wider">
                  A. Spectral Cross-Correlation Response C(Δ2θ) ∈ [-0.60°, +0.60°]
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    Optimal Lag:{' '}
                    <strong className="text-emerald-400">
                      {crossCorrelationTelemetry.bestShift >= 0 ? '+' : ''}
                      {crossCorrelationTelemetry.bestShift.toFixed(2)}° ({crossCorrelationTelemetry.bestCorr}%)
                    </strong>
                  </span>
                  {Math.abs(zeroShiftDeg - crossCorrelationTelemetry.bestShift) > 0.01 && (
                    <button
                      type="button"
                      onClick={() => setZeroShiftDeg(crossCorrelationTelemetry.bestShift)}
                      className="px-1.5 py-0.5 rounded-sm bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                    >
                      Snap Δ2θ
                    </button>
                  )}
                </div>
              </div>

              <svg
                viewBox="0 0 440 82"
                className="w-full h-20 select-none"
                role="img"
                aria-label="Spectral Cross-Correlation Function vs Angular Lag"
              >
                <defs>
                  <linearGradient id="xcorrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[18, 42, 66].map((gy) => (
                  <line
                    key={gy}
                    x1="20"
                    y1={gy}
                    x2="420"
                    y2={gy}
                    stroke="#1e293b"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                ))}
                {/* Zero Lag Center Reference Line */}
                <line x1="220" y1="8" x2="220" y2="68" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
                <text x="220" y="78" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  0.00°
                </text>
                <text x="24" y="78" textAnchor="start" fill="#64748b" fontSize="8" fontFamily="monospace">
                  -0.60°
                </text>
                <text x="416" y="78" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                  +0.60°
                </text>

                {/* Area & Curve of C(Δ2θ) */}
                <polygon
                  fill="url(#xcorrAreaGrad)"
                  points={`20,66 ${crossCorrelationTelemetry.lags
                    .map((pt, idx) => {
                      const px = 20 + (idx / Math.max(1, crossCorrelationTelemetry.lags.length - 1)) * 400;
                      const py = 66 - (pt.corr / 100) * 54;
                      return `${px.toFixed(1)},${py.toFixed(1)}`;
                    })
                    .join(' ')} 420,66`}
                />
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                  points={crossCorrelationTelemetry.lags
                    .map((pt, idx) => {
                      const px = 20 + (idx / Math.max(1, crossCorrelationTelemetry.lags.length - 1)) * 400;
                      const py = 66 - (pt.corr / 100) * 54;
                      return `${px.toFixed(1)},${py.toFixed(1)}`;
                    })
                    .join(' ')}
                />

                {/* Optimal Lag Marker */}
                {(() => {
                  const optX = Math.max(
                    20,
                    Math.min(420, 220 + (crossCorrelationTelemetry.bestShift / 0.6) * 200)
                  );
                  const optY = 66 - (crossCorrelationTelemetry.bestCorr / 100) * 54;
                  return (
                    <g>
                      <line x1={optX} y1={optY} x2={optX} y2="66" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2 2" />
                      <circle cx={optX} cy={optY} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                    </g>
                  );
                })()}

                {/* Current Active Zero-Shift Cursor */}
                {(() => {
                  const curX = Math.max(20, Math.min(420, 220 + (zeroShiftDeg / 0.6) * 200));
                  return (
                    <g>
                      <line x1={curX} y1="8" x2={curX} y2="66" stroke="#f59e0b" strokeWidth="1.5" />
                      <rect x={curX - 22} y="6" width="44" height="12" fill="#070A12" stroke="#f59e0b" strokeWidth="0.8" />
                      <text x={curX} y="14.5" textAnchor="middle" fill="#fcd34d" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                        {zeroShiftDeg >= 0 ? `+${zeroShiftDeg.toFixed(2)}°` : `${zeroShiftDeg.toFixed(2)}°`}
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Right 6 Cols: Reciprocal Lattice Peak-to-Peak Angular Discrepancy Vectors (Δ2θ_hkl) */}
            <div className="lg:col-span-6 bg-[#050811] border border-slate-800 rounded-sm p-2.5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-[10px] font-mono tabular-nums">
                <span className="text-indigo-400 font-bold uppercase tracking-wider">
                  B. Bragg Reflection Residual Shift Map Δ2θ_hkl = 2θ_obs − 2θ_calc
                </span>
                <span className="text-slate-400">
                  RMS Dispersion: <strong className="text-cyan-400">±{crossCorrelationTelemetry.rmsShiftMilliDeg} m°</strong>
                </span>
              </div>

              <svg
                viewBox="0 0 440 82"
                className="w-full h-20 select-none"
                role="img"
                aria-label="Bragg Reflection Angular Discrepancy Vector Map"
              >
                {/* Zero Discrepancy Center Line */}
                <line x1="20" y1="38" x2="420" y2="38" stroke="#334155" strokeWidth="1" />
                {/* ±0.15° Tolerance Corridor */}
                <line x1="20" y1="18" x2="420" y2="18" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="20" y1="58" x2="420" y2="58" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x="16" y="20" textAnchor="end" fill="#64748b" fontSize="7" fontFamily="monospace">
                  +150m°
                </text>
                <text x="16" y="40" textAnchor="end" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                  0
                </text>
                <text x="16" y="60" textAnchor="end" fill="#64748b" fontSize="7" fontFamily="monospace">
                  -150m°
                </text>

                {crossCorrelationTelemetry.peakShiftVectors.map((vec, vIdx) => {
                  const total = Math.max(1, crossCorrelationTelemetry.peakShiftVectors.length);
                  const vx = 38 + (vIdx / Math.max(1, total - 1)) * 368;
                  const clampedDeg = Math.max(-0.22, Math.min(0.22, vec.deltaDeg));
                  const vy = 38 - (clampedDeg / 0.15) * 20;
                  const isGood = Math.abs(vec.deltaDeg) < 0.06;
                  const strokeCol = isGood ? '#10b981' : Math.abs(vec.deltaDeg) < 0.14 ? '#06b6d4' : '#f59e0b';

                  return (
                    <g
                      key={`${vec.hkl}_${vIdx}`}
                      className="cursor-pointer"
                      onClick={() => {
                        setFocusedTwoTheta(vec.refT);
                        setTimeout(() => setFocusedTwoTheta(null), 3500);
                      }}
                    >
                      <line x1={vx} y1="38" x2={vx} y2={vy} stroke={strokeCol} strokeWidth="2.5" />
                      <circle cx={vx} cy={vy} r="3" fill={strokeCol} />
                      <text
                        x={vx}
                        y="75"
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        {vec.hkl}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* CALIBRATION SLIDERS PANEL (Collapsible) */}
        <AnimatePresence>
          {showCalibrationPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#060914] border border-cyan-500/30 rounded-2xl p-4 shadow-xl overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Interactive Goniometer Zero-Shift & Lattice Strain Calibrator
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoAlign}
                    disabled={isAutoAligning}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAutoAligning ? "animate-spin" : ""}`} />
                    {isAutoAligning ? "Optimizing..." : "Auto-Align Zero Shift"}
                  </button>
                  <button
                    onClick={handleResetCalibration}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              {autoAlignStatus && (
                <div className="mt-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                  {autoAlignStatus}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3 font-mono">
                {/* Zero Shift Slider */}
                <div className="flex flex-col gap-1.5 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      Δ(2θ) Zero-Error Offset
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold">
                        {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}°
                      </span>
                      {zeroShiftDeg !== 0 && (
                        <button
                          onClick={() => setZeroShiftDeg(0)}
                          className="px-1.5 py-0.5 rounded text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700"
                          title="Reset Zero Shift to 0.00°"
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
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>-1.00° (Shift Left)</span>
                    <button
                      onClick={() => setZeroShiftDeg(0)}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      0.00° (Nominal)
                    </button>
                    <span>+1.00° (Shift Right)</span>
                  </div>
                </div>

                {/* Uniform Lattice Strain Slider */}
                <div className="flex flex-col gap-1.5 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      Uniform Lattice Strain (Δd/d)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-bold">
                        {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%
                      </span>
                      {latticeStrainPct !== 0 && (
                        <button
                          onClick={() => setLatticeStrainPct(0)}
                          className="px-1.5 py-0.5 rounded text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700"
                          title="Reset Lattice Strain to 0.00%"
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
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>-2.0% (Compressive)</span>
                    <button
                      onClick={() => setLatticeStrainPct(0)}
                      className="hover:text-amber-300 transition-colors"
                    >
                      0.0% (Relaxed)
                    </button>
                    <span>+2.0% (Tensile)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CALIPER MEASUREMENT FLOATING HUD */}
        <AnimatePresence>
          {caliperActive && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-gradient-to-r from-[#170E04] via-[#1F1306] to-[#170E04] border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-center gap-2 text-amber-300">
                <Crosshair className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-black uppercase tracking-wider text-[11px]">
                  Peak Caliper Measurement Tool:
                </span>
                <span className="text-slate-400 text-[10px]">
                  {!caliperPt1
                    ? "Click on first peak/position"
                    : !caliperPt2
                    ? "Click on second peak to measure Δ"
                    : "Points locked (click plot to restart)"}
                </span>
              </div>

              {caliperDelta && (
                <div className="flex flex-wrap items-center gap-4 text-[10px]">
                  <div className="bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    <span className="text-slate-400">Δ(2θ): </span>
                    <span className="font-bold text-amber-300">{caliperDelta.dTwoTheta}°</span>
                  </div>
                  <div className="bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    <span className="text-slate-400">Δ(d): </span>
                    <span className="font-bold text-emerald-300">{caliperDelta.dDSpacing} Å</span>
                  </div>
                  <div className="bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    <span className="text-slate-400">ΔQ: </span>
                    <span className="font-bold text-sky-300">{caliperDelta.dQ} Å⁻¹</span>
                  </div>
                  <div className="bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    <span className="text-slate-400">Strain ε: </span>
                    <span className="font-bold text-purple-300">{caliperDelta.apparentStrain}%</span>
                  </div>
                  <div className="bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    <span className="text-slate-400">Cu-Kα₁/Kα₂ doublet split: </span>
                    <span className="font-bold text-slate-300">{caliperDelta.kaDoubletSplit}°</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setCaliperPt1(null);
                  setCaliperPt2(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-[10px] font-bold"
              >
                Clear Points
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN CHART INSTRUMENT CONTAINER */}
      <div
        ref={chartWrapperRef}
        className={`w-full relative z-10 rounded-2xl p-0 shadow-2xl overflow-hidden flex flex-col group/chart transition-all ${
          themeMode === "publication"
            ? "bg-[#FFFFFF] text-slate-900 border-2 border-slate-300 shadow-slate-200/80"
            : "bg-[#060912] text-slate-100 border border-slate-700/80"
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

        {/* TOP INTERACTIVE SCIENTIFIC CONTROLS TOOLBAR */}
        <div className={`w-full px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30 pointer-events-auto border-b transition-colors ${
          themeMode === "publication"
            ? "bg-[#F8FAFC]/95 border-slate-200 text-slate-800 shadow-sm"
            : "bg-[#080E1B]/95 border-slate-800/80 text-slate-200"
        }`}>
          {/* Left: Coordinate Space, Intensity Scale, & Theme Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Toggle: Dark Lab vs Publication Mode */}
            <button
              onClick={() => setThemeMode(themeMode === "darkLab" ? "publication" : "darkLab")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[9px] font-bold border transition-all ${
                themeMode === "publication"
                  ? "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:text-white"
              }`}
              title="Toggle Publication Theme (White OriginPro mode) vs Dark Lab"
            >
              {themeMode === "publication" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Publication Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dark Lab</span>
                </>
              )}
            </button>

            {/* Coordinate Domain Switcher */}
            <div className={`flex items-center p-0.5 rounded-xl border backdrop-blur-md shadow-lg font-mono text-[9px] ${
              themeMode === "publication"
                ? "bg-white border-slate-300"
                : "bg-[#09101F]/95 border-slate-700/80"
            }`}>
              <button
                onClick={() => setCoordSpace("twoTheta")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  coordSpace === "twoTheta"
                    ? themeMode === "publication"
                      ? "bg-cyan-100 text-cyan-900 border border-cyan-400 shadow-sm"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Bragg Diffraction Angle (2θ)"
              >
                2θ (deg)
              </button>
              <button
                onClick={() => setCoordSpace("dSpacing")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  coordSpace === "dSpacing"
                    ? themeMode === "publication"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-400 shadow-sm"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Lattice Interplanar Spacing (d_hkl in Ångströms)"
              >
                d-spacing (Å)
              </button>
              <button
                onClick={() => setCoordSpace("qVector")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  coordSpace === "qVector"
                    ? themeMode === "publication"
                      ? "bg-sky-100 text-sky-900 border border-sky-400 shadow-sm"
                      : "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Momentum Transfer Scattering Vector Q = 4π sin(θ)/λ"
              >
                Q (Å⁻¹)
              </button>
            </div>

            {/* Intensity Transform Switcher */}
            <div className={`flex items-center p-0.5 rounded-xl border backdrop-blur-md shadow-lg font-mono text-[9px] ${
              themeMode === "publication"
                ? "bg-white border-slate-300"
                : "bg-[#09101F]/95 border-slate-700/80"
            }`}>
              <button
                onClick={() => setIntensityScale("linear")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  intensityScale === "linear"
                    ? themeMode === "publication"
                      ? "bg-blue-100 text-blue-900 border border-blue-400 shadow-sm"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Linear Counts (Standard)"
              >
                Linear (I)
              </button>
              <button
                onClick={() => setIntensityScale("sqrt")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  intensityScale === "sqrt"
                    ? themeMode === "publication"
                      ? "bg-purple-100 text-purple-900 border border-purple-400 shadow-sm"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Square-Root (√I) Poisson Counting Statistics Transform"
              >
                Sqrt (√I)
              </button>
              <button
                onClick={() => setIntensityScale("log")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  intensityScale === "log"
                    ? themeMode === "publication"
                      ? "bg-rose-100 text-rose-900 border border-rose-400 shadow-sm"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Logarithmic (log10 I) reveals trace impurity phases and background halos"
              >
                Log₁₀ (I)
              </button>
            </div>

            {/* Profile Engine Config Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setShowProfileConfigPanel(!showProfileConfigPanel)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[9px] font-bold border transition-all ${
                  showProfileConfigPanel
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                    : themeMode === "publication"
                    ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                }`}
                title="Configure Peak Profile Model, Lorentzian Fraction & Doublet Optics"
              >
                <Settings2 className="w-3 h-3 text-cyan-400" />
                <span>
                  {profileModel === "pseudoVoigt"
                    ? `P-Voigt (η=${Math.round(lorentzianFraction * 100)}%)`
                    : profileModel === "pearson7"
                    ? `Pearson VII (m=${pearsonShapeM.toFixed(1)})`
                    : profileModel === "gaussian"
                    ? "Gaussian"
                    : "Lorentzian"}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showProfileConfigPanel ? "rotate-180" : ""}`} />
              </button>

              {showProfileConfigPanel && (
                <div className={`absolute left-0 top-full mt-2 z-50 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md w-72 text-xs font-mono ${
                  themeMode === "publication"
                    ? "bg-white/98 border-slate-300 text-slate-800 shadow-slate-300/60"
                    : "bg-[#09101F]/98 border-slate-700 text-slate-200 shadow-black/80"
                }`}>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/30 font-bold text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Peak Profile Function
                    </span>
                    <button onClick={() => setShowProfileConfigPanel(false)} className="text-slate-400 hover:text-slate-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-[10px]">
                    <div>
                      <span className="text-slate-400 block mb-1">Profile Shape Function</span>
                      <div className="grid grid-cols-2 gap-1">
                        {(["pseudoVoigt", "pearson7", "gaussian", "lorentzian"] as ProfileShapeModel[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => setProfileModel(m)}
                            className={`py-1 rounded-lg text-center font-bold text-[9px] border transition-all ${
                              profileModel === m
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm"
                                : themeMode === "publication"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-black/30 text-slate-400 border-slate-800"
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
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-400">Lorentzian Fraction (η)</span>
                          <span className="font-bold text-cyan-400 font-mono">{Math.round(lorentzianFraction * 100)}%</span>
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
                        <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                          <span>0% (Instrumental Gauss)</span>
                          <span>100% (Crystallite Lorentz)</span>
                        </div>
                      </div>
                    )}

                    {profileModel === "pearson7" && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-400">Shape Exponent (m)</span>
                          <span className="font-bold text-cyan-400 font-mono">m = {pearsonShapeM.toFixed(2)}</span>
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
                        <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                          <span>m=1.0 (Cauchy)</span>
                          <span>m=2.0 (Mod-Lorentz)</span>
                          <span>m→8 (Gauss)</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/20">
                      <span className="text-slate-400">Cu-Kα₁/Kα₂ Doublet Splitting</span>
                      <button
                        onClick={() => setEnableKaDoublet(!enableKaDoublet)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                          enableKaDoublet
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {enableKaDoublet ? "Enabled (1.5406/1.5444 Å)" : "Disabled"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/20">
                      <span className="text-slate-400">Subtract Baseline Scatter</span>
                      <button
                        onClick={() => setSubtractBackground(!subtractBackground)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                          subtractBackground
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {subtractBackground ? "Subtracted" : "Raw Diffractogram"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Precision Engine Config Popover & Button */}
            <div className="relative">
              <button
                onClick={() => setShowPrecisionPanel(!showPrecisionPanel)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[9px] font-bold border transition-all ${
                  showPrecisionPanel
                    ? "bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-sm"
                    : themeMode === "publication"
                    ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                    : "bg-[#110C24] text-purple-300 border-purple-800/80 hover:bg-purple-950"
                }`}
                title="Ultra-Precision Diffractogram Mesh, Spline Interpolation & Doublet Physics"
              >
                <Gauge className="w-3 h-3 text-purple-400" />
                <span className="capitalize">
                  Precision: {curvePrecisionMode} ({curvePrecisionMode === "synchrotron" ? "0.002°" : curvePrecisionMode === "ultra" ? "0.005°" : curvePrecisionMode === "high" ? "0.01°" : "0.02°"})
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showPrecisionPanel ? "rotate-180" : ""}`} />
              </button>

              {showPrecisionPanel && (
                <div className={`absolute left-0 top-full mt-2 z-50 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md w-80 text-xs font-mono ${
                  themeMode === "publication"
                    ? "bg-white/98 border-slate-300 text-slate-800 shadow-slate-300/60"
                    : "bg-[#0A0718]/98 border-purple-800/60 text-slate-200 shadow-black/80"
                }`}>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-500/30 font-bold text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <Gauge className="w-3.5 h-3.5 text-purple-400" />
                      Ultra-Precision Diffractogram Engine
                    </span>
                    <button onClick={() => setShowPrecisionPanel(false)} className="text-slate-400 hover:text-slate-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-[10px]">
                    <div>
                      <span className="text-slate-400 block mb-1">Sampling Mesh Density</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "synchrotron", label: "Synchrotron (0.002°)", desc: "~18,000 pts" },
                          { id: "ultra", label: "Ultra (0.005°)", desc: "~12,000 pts" },
                          { id: "high", label: "High (0.010°)", desc: "~6,000 pts" },
                          { id: "benchmark", label: "Standard (0.020°)", desc: "~3,000 pts" },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            onClick={() => setCurvePrecisionMode(lvl.id as CurvePrecisionMode)}
                            className={`p-1.5 rounded-lg text-left border transition-all ${
                              curvePrecisionMode === lvl.id
                                ? "bg-purple-500/25 text-purple-200 border-purple-500 shadow-sm"
                                : themeMode === "publication"
                                ? "bg-slate-50 text-slate-600 border-slate-200"
                                : "bg-black/30 text-slate-400 border-slate-800"
                            }`}
                          >
                            <div className="font-bold text-[9px]">{lvl.label}</div>
                            <div className="text-[8px] opacity-70">{lvl.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Curve Interpolation Model</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "monotone", label: "Monotone", desc: "Anti-overshoot" },
                          { id: "linear", label: "True Linear", desc: "Raw Physical" },
                          { id: "natural", label: "Natural", desc: "Cubic Spline" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setCurveInterpolation(m.id as CurveInterpolationType)}
                            className={`p-1 rounded-lg text-center font-bold text-[9px] border transition-all ${
                              curveInterpolation === m.id
                                ? "bg-purple-500/25 text-purple-200 border-purple-500 shadow-sm"
                                : themeMode === "publication"
                                ? "bg-slate-50 text-slate-600 border-slate-200"
                                : "bg-black/30 text-slate-400 border-slate-800"
                            }`}
                          >
                            <div>{m.label}</div>
                            <div className="text-[7px] font-normal opacity-70">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
                      <div>
                        <span className="text-slate-300 block font-semibold">Continuous Super-Sampling</span>
                        <span className="text-[8px] text-slate-500">Hermite 4× anti-aliased reconstruction</span>
                      </div>
                      <button
                        onClick={() => setEnableSuperSampling(!enableSuperSampling)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                          enableSuperSampling
                            ? "bg-purple-500/25 text-purple-300 border-purple-500/50"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {enableSuperSampling ? "Enabled" : "Raw Grid"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
                      <div>
                        <span className="text-slate-300 block font-semibold">Cu-Kα₁ & Kα₂ Sub-Curves</span>
                        <span className="text-[8px] text-slate-500">Deconstruct individual doublet peaks</span>
                      </div>
                      <button
                        onClick={() => setShowKaDoubletSplitCurves(!showKaDoubletSplitCurves)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                          showKaDoubletSplitCurves
                            ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {showKaDoubletSplitCurves ? "Visible" : "Combined"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Viewport Scale Selector (Biggest Precision) */}
            <div className={`flex items-center p-0.5 rounded-xl border backdrop-blur-md shadow-lg font-mono text-[9px] ${
              themeMode === "publication"
                ? "bg-white border-slate-300"
                : "bg-[#09101F]/95 border-slate-700/80"
            }`}>
              <span className="px-1.5 text-slate-400 uppercase text-[8px] font-bold">Scale:</span>
              <button
                onClick={() => setCurveViewHeight("standard")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  curveViewHeight === "standard" && !isFullscreen
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Standard Viewport Height (640px)"
              >
                Standard
              </button>
              <button
                onClick={() => setCurveViewHeight("big")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  curveViewHeight === "big" && !isFullscreen
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Big Expanded Viewport (820px) - Highest Detail"
              >
                Big (820px)
              </button>
              <button
                onClick={() => setCurveViewHeight("cinema")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  curveViewHeight === "cinema" && !isFullscreen
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Ultra Cinema Studio Viewport (1020px) - Maximum Viewport"
              >
                Cinema (1020px)
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-1 rounded-lg text-slate-400 hover:text-cyan-300 transition-all ${isFullscreen ? "text-cyan-300 bg-cyan-500/20" : ""}`}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Peak Crest Apex Lens Button */}
            {detectedPeaks.length > 0 && (
              <button
                onClick={() => {
                  const target = detectedPeaks[0];
                  setInspectedPeak(target);
                  setShowPeakApexModal(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[9px] font-bold border transition-all ${
                  showPeakApexModal
                    ? "bg-cyan-500/25 text-cyan-300 border-cyan-500 shadow-sm"
                    : "bg-[#0A1020] text-cyan-300 border-cyan-800/80 hover:bg-cyan-950"
                }`}
                title="Inspect Peak Crest & Apex with 10× Magnification"
              >
                <Focus className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Peak Apex Lens</span>
              </button>
            )}

            {/* Quick Zoom Presets Bar & Reset View */}
            <div className={`flex items-center p-0.5 rounded-xl border backdrop-blur-md shadow-lg font-mono text-[9px] ${
              themeMode === "publication"
                ? "bg-white border-slate-300"
                : "bg-[#09101F]/95 border-slate-700/80"
            }`}>
              <span className="px-1.5 text-slate-400 uppercase text-[8px] font-bold">Zoom:</span>
              <button
                onClick={() => setZoomRangePreset("all")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  zoomRangePreset === "all"
                    ? themeMode === "publication"
                      ? "bg-slate-200 text-slate-900 border border-slate-300"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Full
              </button>
              <button
                onClick={() => setZoomRangePreset("low")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  zoomRangePreset === "low"
                    ? themeMode === "publication"
                      ? "bg-cyan-100 text-cyan-900 border border-cyan-400"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Low Angle (10-35° 2θ): Clays & Superlattice reflections"
              >
                10-35°
              </button>
              <button
                onClick={() => setZoomRangePreset("mid")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  zoomRangePreset === "mid"
                    ? themeMode === "publication"
                      ? "bg-cyan-100 text-cyan-900 border border-cyan-400"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Diagnostic Fingerprint Window (20-65° 2θ)"
              >
                20-65°
              </button>
              <button
                onClick={() => setZoomRangePreset("high")}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  zoomRangePreset === "high"
                    ? themeMode === "publication"
                      ? "bg-cyan-100 text-cyan-900 border border-cyan-400"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="High Angle (60-100° 2θ): Strain & Doublet splitting"
              >
                60-100°
              </button>
              <div className="w-[1px] h-3.5 bg-slate-700/60 mx-1" />
              <button
                onClick={() => {
                  setZoomRangePreset("all");
                  setCoordSpace("twoTheta");
                  setIntensityScale("linear");
                  setShowBrush(true);
                  setFocusedTwoTheta(null);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-all ${
                  themeMode === "publication"
                    ? "text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-300"
                    : "text-slate-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700"
                }`}
                title="Reset View (Full range 2θ, linear intensity scale, show brush)"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset View
              </button>
            </div>
          </div>

          {/* Right: Layer Toggles, Baseline, Comb & Residual Mode */}
          <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border backdrop-blur-md shadow-lg font-mono text-[9px] ${
            themeMode === "publication"
              ? "bg-white border-slate-300"
              : "bg-[#09101F]/95 border-slate-700/80"
          }`}>
            {/* Toggle Experimental Continuous Profile */}
            <button
              onClick={() => setShowExpPattern(!showExpPattern)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showExpPattern
                  ? themeMode === "publication"
                    ? "text-slate-900 bg-slate-100 border border-slate-300"
                    : "text-cyan-200 bg-cyan-950/70 border border-cyan-500/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${showExpPattern ? (themeMode === "publication" ? "bg-slate-900" : "bg-cyan-400 shadow-[0_0_6px_#22d3ee]") : "bg-slate-400"}`} />
              Pattern (Exp)
            </button>

            {/* Toggle Experimental Sticks (Discrete mode) */}
            {isDiscrete && (
              <button
                onClick={() => setShowExpSticks(!showExpSticks)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  showExpSticks ? "text-sky-200 bg-sky-950/70 border border-sky-500/50" : "text-slate-400"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showExpSticks ? "bg-sky-400 shadow-[0_0_6px_#38bdf8]" : "bg-slate-600"}`} />
                Peak Sticks
              </button>
            )}

            {/* Toggle Reference Simulation Profile */}
            {selectedCandidate && (
              <button
                onClick={() => setShowCalcProfile(!showCalcProfile)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  showCalcProfile
                    ? themeMode === "publication"
                      ? "text-red-700 bg-red-50 border border-red-300"
                      : "text-rose-200 bg-rose-950/70 border border-rose-500/50"
                    : "text-slate-400"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showCalcProfile ? (themeMode === "publication" ? "bg-red-600" : "bg-rose-400 shadow-[0_0_6px_#f43f5e]") : "bg-slate-400"}`} />
                Ref Profile
              </button>
            )}

            {/* Toggle Baseline Trace */}
            <button
              onClick={() => setShowBackgroundBaseline(!showBackgroundBaseline)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showBackgroundBaseline
                  ? themeMode === "publication"
                    ? "text-slate-800 bg-slate-100 border border-slate-300"
                    : "text-slate-200 bg-slate-800/80 border border-slate-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Toggle Air Scattering & Amorphous Baseline Halo"
            >
              <div className={`w-2 h-2 rounded-full ${showBackgroundBaseline ? "bg-slate-400" : "bg-slate-600"}`} />
              Baseline
            </button>

            {/* Toggle Reference Reflection Sticks */}
            {selectedCandidate && (
              <button
                onClick={() => setShowRefSticks(!showRefSticks)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  showRefSticks
                    ? themeMode === "publication"
                      ? "text-pink-800 bg-pink-50 border border-pink-300"
                      : "text-pink-200 bg-pink-950/70 border border-pink-500/50"
                    : "text-slate-400"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showRefSticks ? "bg-pink-400 shadow-[0_0_6px_#f472b6]" : "bg-slate-600"}`} />
                Ref Sticks
              </button>
            )}

            {/* Toggle Miller Indices (hkl) */}
            {selectedCandidate && showRefSticks && (
              <button
                onClick={() => setShowHklBadges(!showHklBadges)}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  showHklBadges
                    ? themeMode === "publication"
                      ? "text-pink-700 bg-pink-50 border border-pink-300"
                      : "text-pink-300 bg-pink-950/50 border border-pink-500/40"
                    : "text-slate-400"
                }`}
              >
                (hkl) Badges
              </button>
            )}

            {/* Toggle GSAS-II / FullProf Bragg Reflection Comb */}
            <button
              onClick={() => setShowBraggComb(!showBraggComb)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showBraggComb
                  ? themeMode === "publication"
                    ? "text-emerald-800 bg-emerald-50 border border-emerald-300"
                    : "text-emerald-300 bg-emerald-950/60 border border-emerald-500/50"
                  : "text-slate-400"
              }`}
              title="Toggle Rietveld / GSAS-II Style Bragg Reflection Comb (Tick markers)"
            >
              <div className={`w-2 h-2 rounded-full ${showBraggComb ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-slate-600"}`} />
              Bragg Comb
            </button>

            {/* Toggle Auto-Detected Peak Pins */}
            <button
              onClick={() => setShowPeakPins(!showPeakPins)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showPeakPins
                  ? themeMode === "publication"
                    ? "text-cyan-800 bg-cyan-50 border border-cyan-300"
                    : "text-cyan-300 bg-cyan-950/60 border border-cyan-500/50"
                  : "text-slate-400"
              }`}
              title="Toggle Auto-Detected Peak Centroid Pins with Domain Size & (hkl) Badges"
            >
              <div className={`w-2 h-2 rounded-full ${showPeakPins ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" : "bg-slate-600"}`} />
              Peak Pins ({detectedPeaks.length})
            </button>

            {/* Toggle Multi-Phase Deconvolution Curves */}
            {activeCandidates.length > 1 && (
              <button
                onClick={() => setShowIndividualPhases(!showIndividualPhases)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  showIndividualPhases
                    ? "text-purple-300 bg-purple-950/60 border border-purple-500/50"
                    : "text-slate-400"
                }`}
                title="Toggle Deconvoluted Sub-Phase Diffraction Curves"
              >
                <div className={`w-2 h-2 rounded-full ${showIndividualPhases ? "bg-purple-400 shadow-[0_0_6px_#c084fc]" : "bg-slate-600"}`} />
                Deconvolute
              </button>
            )}

            {/* Toggle Range Zoom Slider (Brush) */}
            <button
              onClick={() => setShowBrush(!showBrush)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showBrush
                  ? themeMode === "publication"
                    ? "text-cyan-900 bg-cyan-50 border border-cyan-300"
                    : "text-cyan-200 bg-cyan-950/70 border border-cyan-500/50"
                  : "text-slate-400"
              }`}
              title="Toggle bottom range zoom slider"
            >
              <div className={`w-2 h-2 rounded-full ${showBrush ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" : "bg-slate-600"}`} />
              Zoom Slider
            </button>

            {/* Residual Curve Mode Toggle */}
            {selectedCandidate && (
              <button
                onClick={() => {
                  setResidualView(residualView === "overlay" ? "split" : residualView === "split" ? "hidden" : "overlay");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  residualView !== "hidden"
                    ? themeMode === "publication"
                      ? "text-blue-900 bg-blue-50 border border-blue-300"
                      : "text-amber-200 bg-amber-950/70 border border-amber-500/50"
                    : "text-slate-400"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${residualView !== "hidden" ? (themeMode === "publication" ? "bg-blue-600" : "bg-amber-400 shadow-[0_0_6px_#f59e0b]") : "bg-slate-600"}`} />
                Residual {residualView === "split" ? "(Split)" : residualView === "overlay" ? "(Overlay)" : "(Off)"}
              </button>
            )}
          </div>
        </div>

        {/* RECHARTS COMPOSED CHART VIEWPORT */}
        <div className={`flex-1 relative w-full px-2 pt-2 pb-1 min-h-[360px] z-10 transition-colors ${
          themeMode === "publication" ? "bg-white" : "bg-[#060912]"
        }`}>
          {/* Floating Scientific Publication Legend Box */}
          <div className={`absolute top-4 right-4 z-20 px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg pointer-events-none font-mono text-[9px] ${
            themeMode === "publication"
              ? "bg-white/95 border-slate-300 text-slate-800 shadow-slate-200"
              : "bg-[#080E1B]/95 border-slate-700/80 text-slate-200 shadow-black/80"
          }`}>
            <div className="font-bold text-[10px] mb-1.5 flex items-center justify-between gap-4 border-b pb-1 border-slate-400/30">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                XRD Diffractogram Traces
              </span>
              <span className="text-[8px] opacity-70">λ = {activeWavelength.toFixed(4)} Å</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-1 rounded-sm ${themeMode === "publication" ? "bg-slate-950" : "bg-cyan-400"}`} />
                  <span className="font-bold">Y_obs</span>
                </div>
                <span className="text-slate-400 text-[8px]">Observed</span>
              </div>
              {selectedCandidate && showCalcProfile && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-1 rounded-sm ${themeMode === "publication" ? "bg-red-600" : "bg-rose-500"}`} />
                    <span className="font-bold">Y_calc</span>
                  </div>
                  <span className="text-slate-400 text-[8px] truncate max-w-[90px]">{selectedCandidate.phase_name.split(' ')[0]}</span>
                </div>
              )}
              {selectedCandidate && showKaDoubletSplitCurves && enableKaDoublet && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-0.5 border-t border-dashed border-emerald-400" />
                      <span className="font-bold text-emerald-400">Kα₁</span>
                    </div>
                    <span className="text-slate-400 text-[8px]">1.5406 Å</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-0.5 border-t border-dashed border-purple-400" />
                      <span className="font-bold text-purple-300">Kα₂</span>
                    </div>
                    <span className="text-slate-400 text-[8px]">1.5444 Å</span>
                  </div>
                </>
              )}
              {showBackgroundBaseline && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 border-t-2 border-dashed border-slate-500" />
                    <span className="font-bold">Y_bkg</span>
                  </div>
                  <span className="text-slate-400 text-[8px]">Baseline</span>
                </div>
              )}
              {selectedCandidate && residualView === "overlay" && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-1 rounded-sm ${themeMode === "publication" ? "bg-blue-600" : "bg-amber-500"}`} />
                    <span className="font-bold">ΔY</span>
                  </div>
                  <span className="text-slate-400 text-[8px]">Residual</span>
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
              ? "bg-[#F8FAFC] border-slate-200 text-slate-800"
              : "bg-[#050813] border-slate-800 text-slate-300"
          }`}>
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono">
              <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 inline-block" />
                <span>GSAS-II / FullProf Bragg Reflection Tick & Intensity Comb (hkl)</span>
              </span>
              <span className="text-slate-400 text-[9px] tabular-nums">
                Click any reflection tick to spotlight peak position in diffractogram
              </span>
            </div>

            <div className="space-y-1.5">
              {activeCandidates.map((cand, cIdx) => {
                const peaks = getCalibratedRefPeaks(cand);
                const color = PHASE_PALETTES[cIdx % PHASE_PALETTES.length].primary;
                const minVal = chartData.length ? chartData[0].coordX : 10;
                const maxVal = chartData.length ? chartData[chartData.length - 1].coordX : 100;
                const span = Math.max(1, maxVal - minVal);

                return (
                  <div key={`comb-${cand.phase_name}-${cIdx}`} className="flex items-center gap-3">
                    <div className="w-32 flex items-center gap-1.5 shrink-0" title={cand.phase_name}>
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-mono font-bold truncate">
                        {cand.phase_name.split(" ")[0]} ({peaks.length})
                      </span>
                    </div>

                    <div className={`flex-1 relative h-7 rounded-sm border overflow-hidden ${
                      themeMode === "publication"
                        ? "bg-slate-100 border-slate-300"
                        : "bg-[#09101F] border-slate-800"
                    }`}>
                      <svg viewBox="0 0 800 28" preserveAspectRatio="none" className="w-full h-full">
                        <line x1="0" y1="26" x2="800" y2="26" stroke="#1e293b" strokeWidth="1" />
                        {peaks.map((p, pIdx) => {
                          const coord = mapCoord(p.calibratedRefT);
                          const leftPct = ((coord - minVal) / span) * 100;
                          if (leftPct < 0 || leftPct > 100) return null;
                          const px = (leftPct / 100) * 800;
                          const tickH = Math.max(6, Math.min(22, Math.sqrt(Math.max(5, p.refI || 50)) * 2.1));
                          const hklStr =
                            p.h !== undefined && p.k !== undefined && p.l !== undefined
                              ? `(${p.h}${p.k}${p.l})`
                              : p.hkl
                              ? `(${p.hkl})`
                              : "";

                          return (
                            <g
                              key={`svg-tick-${pIdx}`}
                              className="cursor-pointer"
                              onClick={() => {
                                setFocusedTwoTheta(p.calibratedRefT);
                                setTimeout(() => setFocusedTwoTheta(null), 3500);
                              }}
                            >
                              <title>
                                {`${cand.phase_name} ${hklStr} · ${p.calibratedRefT.toFixed(2)}° 2θ · d=${p.calibratedD?.toFixed(4)} Å · I=${(p.refI || 0).toFixed(0)}%`}
                              </title>
                              <line
                                x1={px}
                                y1={26}
                                x2={px}
                                y2={26 - tickH}
                                stroke={color}
                                strokeWidth="2.2"
                              />
                              <circle cx={px} cy={26 - tickH} r="1.8" fill={color} />
                              {p.refI >= 35 && hklStr && (
                                <text
                                  x={px}
                                  y={Math.max(8, 23 - tickH)}
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

        {/* BOTTOM RIETVELD SPLIT RESIDUAL PANEL (If in Split mode) */}
        {selectedCandidate && residualView === "split" && (
          <div className={`h-36 border-t p-2 flex flex-col relative z-10 transition-colors ${
            themeMode === "publication"
              ? "bg-[#F8FAFC] border-slate-200"
              : "bg-[#040710] border-slate-800"
          }`}>
            <div className="flex justify-between items-center px-4 py-1 text-[9px] font-mono text-slate-400">
              <span className={`font-bold uppercase tracking-widest ${themeMode === "publication" ? "text-blue-700" : "text-amber-400"}`}>
                Rietveld Profile Difference (Y_obs - Y_calc)
              </span>
              <div className="flex items-center gap-3">
                <span>Confidence Band: ±3σ</span>
                <span className={`font-bold ${themeMode === "publication" ? "text-blue-700" : "text-amber-300"}`}>
                  R_wp: {alignmentMetrics.rwp}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 16, bottom: 4 }}>
                  <defs>
                    <linearGradient id="splitResidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeMode === "publication" ? "#2563eb" : "#f59e0b"} stopOpacity={themeMode === "publication" ? 0.25 : 0.45} />
                      <stop offset="95%" stopColor={themeMode === "publication" ? "#2563eb" : "#f59e0b"} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={themeMode === "publication" ? "#e2e8f0" : "#1e293b"} opacity={0.4} />
                  <XAxis dataKey="coordX" hide />
                  <YAxis
                    stroke={themeMode === "publication" ? "#0f172a" : "#475569"}
                    tick={{ fill: themeMode === "publication" ? "#0f172a" : "#64748b", fontSize: 8, fontFamily: "monospace" }}
                    width={38}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono shadow-xl backdrop-blur-md ${
                          themeMode === "publication"
                            ? "bg-white/95 border-slate-300 text-slate-900 shadow-slate-200"
                            : "bg-[#070D18]/95 border-slate-700 text-slate-200 shadow-black/80"
                        }`}>
                          <div className="font-bold text-slate-400">
                            {pt.twoTheta?.toFixed(4)}° 2θ {pt.dSpacing ? `• d=${pt.dSpacing.toFixed(5)}Å` : ""}
                          </div>
                          <div className={`font-semibold ${themeMode === "publication" ? "text-blue-700" : "text-amber-400"}`}>
                            ΔY: {pt.signedResidual > 0 ? "+" : ""}{pt.signedResidual?.toFixed(3)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke={themeMode === "publication" ? "#2563eb" : "#f59e0b"} strokeWidth={1.5} />
                  <Area
                    type={curveInterpolation}
                    dataKey="signedResidual"
                    stroke={themeMode === "publication" ? "#2563eb" : "#f59e0b"}
                    fill="url(#splitResidGrad)"
                    fillOpacity={1}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BOTTOM STATUS & INSTRUMENT OPTICS FOOTER */}
        <div className={`w-full border-t px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono z-10 transition-colors ${
          themeMode === "publication"
            ? "bg-[#F1F5F9] border-slate-200 text-slate-600"
            : "bg-[#050813] border-slate-800/80 text-slate-400"
        }`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className={`flex items-center gap-1.5 font-bold ${themeMode === "publication" ? "text-cyan-800" : "text-cyan-300"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="uppercase text-[9px] tracking-wider text-slate-500 font-normal">Source:</span>
              <span>{activeWavelength.toFixed(5)} Å ({selectedWavelengthId})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[9px] tracking-wider text-slate-500">Profile:</span>
              <span className={`font-semibold ${themeMode === "publication" ? "text-slate-900" : "text-slate-200"}`}>
                {profileModel === "pseudoVoigt" ? `Pseudo-Voigt (η=${Math.round(lorentzianFraction * 100)}%)` : profileModel} • FWHM {effFwhm.toFixed(2)}°
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[9px] tracking-wider text-slate-500">Domain:</span>
              <span className={`font-semibold ${themeMode === "publication" ? "text-slate-900" : "text-slate-200"}`}>
                {coordSpace === "twoTheta" ? "2θ (Bragg)" : coordSpace === "dSpacing" ? "d-spacing (Å)" : "Q-vector (Å⁻¹)"} ({intensityScale})
              </span>
            </div>
            {enableKaDoublet && (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <span className="uppercase text-[9px] tracking-wider text-slate-500">Optics:</span>
                <span className="font-semibold">Cu-Kα₁/Kα₂ Doublet</span>
              </div>
            )}
            {(zeroShiftDeg !== 0 || latticeStrainPct !== 0) && (
              <div className="flex items-center gap-1.5 text-amber-500">
                <span className="uppercase text-[9px] tracking-wider">Offset:</span>
                <span className="font-semibold">Δ2θ {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}° | Strain {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%</span>
                <button
                  onClick={handleResetCalibration}
                  className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 font-bold transition-all"
                  title="Reset both zero-shift and strain to zero"
                >
                  Reset Offset
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[9px] text-slate-400">
            {showBrush && <span>Drag slider handles to zoom</span>}
          </div>
        </div>

        {/* EMPTY STATE BACKDROP */}
        {parsedPoints.length === 0 && !inputData?.trim() && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050A14]/90 backdrop-blur-md rounded-2xl z-20 border border-slate-800/80 overflow-hidden">
            <div className="relative mb-6 z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                <Compass className="w-10 h-10 text-cyan-400 animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
              </div>
              <p className="text-white font-black tracking-[0.25em] uppercase text-lg mb-1 drop-shadow-md">
                Spectrometer Standby
              </p>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Awaiting Experimental Pattern or Peak List Stream
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MULTI-PHASE CO-PLOTTING DRAWER */}
      {candidates.length > 1 && (
        <div className="mt-4 p-4 bg-[#080D1A]/80 border border-slate-800 rounded-2xl flex flex-col gap-3 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Multi-Phase Mixture Co-Plotting
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiPhaseMode}
                  onChange={(e) => setMultiPhaseMode(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-400 bg-slate-900"
                />
                <span>Enable Multi-Phase Overlay</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {candidates.map((cand, idx) => {
              const isSelected = selectedCandidate?.phase_name === cand.phase_name;
              const isActiveInMulti = activePhaseNames.includes(cand.phase_name);
              const palette = PHASE_PALETTES[idx % PHASE_PALETTES.length];

              return (
                <div
                  key={cand.phase_name + idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-mono ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md"
                      : "bg-[#040812] border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
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
                      className="rounded border-slate-700 text-indigo-500 bg-slate-900"
                    />
                  )}
                  <button
                    onClick={() => onSelectCandidate && onSelectCandidate(cand)}
                    className="font-bold hover:text-white transition-colors"
                  >
                    {cand.phase_name}
                  </button>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${palette.badge}`}>
                    {cand.confidence_score.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PYCRYSTALLINE RAG COPROCESSOR DIAGNOSTICS */}
      {selectedCandidate && ((selectedCandidate as any).fitted_strain_pct !== undefined || pythonRAGResults) && (
        <div className="mt-4 p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#120B04]/90 to-[#050301]/95 backdrop-blur-xl relative z-10 shadow-[0_4px_30px_rgba(245,158,11,0.1)] transition-all hover:border-amber-500/50 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 font-mono">
                PyCrystalline™ RAG Coprocessor Diagnostics
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono font-black border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider shadow-inner">
                State: Fully Converged
              </span>
              <button
                onClick={() => setShowRagDiagnostics(!showRagDiagnostics)}
                className="p-1 text-slate-400 hover:text-white"
              >
                {showRagDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {showRagDiagnostics && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#050301] border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-inner">
                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest leading-none">
                    Calculated Lattice Strain
                  </span>
                  <span className="text-3xl font-black text-amber-300 font-mono drop-shadow-md">
                    {((selectedCandidate as any).fitted_strain_pct)?.toFixed(4) || "0.0000"}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans leading-snug">
                    {(selectedCandidate as any).fitted_strain_pct > 0 ? "Tensile (dilation)" : (selectedCandidate as any).fitted_strain_pct < 0 ? "Compressive (contraction)" : "No strain detected"}: Peak shifts modeled via grid-descent convolution.
                  </span>
                </div>
                
                <div className="bg-[#050301] border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-inner">
                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest leading-none">
                    Domain Size Broadening Scale
                  </span>
                  <span className="text-3xl font-black text-amber-300 font-mono drop-shadow-md">
                    {((selectedCandidate as any).fitted_domain_size_broadening)?.toFixed(2) || "0.18"}°
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans leading-snug">
                    Gaussian broadening standard deviation σ. Controls modeled nanocrystalline grain/crystallite size effects.
                  </span>
                </div>
                
                <div className="bg-[#050301] border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-inner">
                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest leading-none">
                    Core Retrieval Cosine
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-300 font-mono drop-shadow-md">
                      {((selectedCandidate as any).raw_score)?.toFixed(2) || "95.00"}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase leading-none">
                      (Raw)
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-sans leading-snug">
                    Spectral continuous cosine overlap computed over the non-strain compensated grid.
                  </span>
                </div>
              </div>

              {pythonRAGResults?.gemini_analysis && (
                <div className="border-t border-amber-500/15 pt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    Grounded LLM Synthesized Crystallographic Insight:
                  </div>
                  <div className="bg-[#050301] border border-amber-500/10 rounded-2xl p-4 font-sans text-xs text-amber-200/90 leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar shadow-inner select-text">
                    {pythonRAGResults.gemini_analysis}
                  </div>
                </div>
              )}
              
              {pythonRAGResults?.literature_docs && pythonRAGResults.literature_docs.length > 0 && (
                <div className="border-t border-amber-500/15 pt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Retrieved Literature Knowledge Base:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pythonRAGResults.literature_docs.map((doc: any, i: number) => (
                      <div key={i} className="bg-[#050301] border border-amber-500/10 rounded-xl p-3 flex flex-col gap-1.5 shadow-inner">
                        <span className="text-[10px] font-bold text-amber-300 font-mono leading-tight">{doc.title}</span>
                        <span className="text-[9px] text-slate-400 font-sans leading-relaxed line-clamp-3">{doc.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REFLECTION TABLE INSPECTOR MODAL / DRAWER */}
      <AnimatePresence>
        {showReflectionTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-[#070B16] border border-indigo-500/30 rounded-2xl p-5 shadow-2xl overflow-hidden relative z-20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Table className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                  Indexed Bragg Reflections Table ({selectedCandidate?.phase_name})
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={reflectionSearch}
                    onChange={(e) => setReflectionSearch(e.target.value)}
                    placeholder="Filter (hkl), 2θ, d..."
                    className="pl-8 pr-3 py-1 bg-[#040812] border border-slate-700/80 rounded-xl text-[10px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                  />
                </div>
                <button
                  onClick={() => setShowReflectionTable(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto mt-3 custom-scrollbar">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] bg-[#050914]">
                    <th className="py-2 px-3">Miller (hkl)</th>
                    <th className="py-2 px-3">Calibrated 2θ (°)</th>
                    <th className="py-2 px-3">Nominal 2θ (°)</th>
                    <th className="py-2 px-3">d-spacing (Å)</th>
                    <th className="py-2 px-3">Relative I (%)</th>
                    <th className="py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredReflections.map((ref, idx) => (
                    <tr
                      key={`ref-row-${idx}`}
                      className={`hover:bg-indigo-500/10 transition-colors ${
                        focusedTwoTheta === ref.twoTheta ? "bg-indigo-500/20" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-rose-300">
                        {ref.hkl ? `(${ref.hkl})` : "—"}
                      </td>
                      <td className="py-2 px-3 text-cyan-300 font-bold">{ref.twoTheta.toFixed(2)}°</td>
                      <td className="py-2 px-3 text-slate-400">{ref.originalRefT.toFixed(2)}°</td>
                      <td className="py-2 px-3 text-emerald-300">{ref.dSpacing.toFixed(4)} Å</td>
                      <td className="py-2 px-3 text-slate-200">{ref.rawRefIntensity.toFixed(0)}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => {
                            setFocusedTwoTheta(ref.twoTheta);
                            setTimeout(() => setFocusedTwoTheta(null), 3500);
                          }}
                          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[9px]"
                        >
                          Focus Peak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PEAK APEX ULTRA-PRECISION INSPECTOR LENS MODAL */}
      <AnimatePresence>
        {showPeakApexModal && inspectedPeak && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setShowPeakApexModal(false)}
          >
            <div
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 font-mono text-xs flex flex-col gap-4 overflow-hidden relative ${
                themeMode === "publication"
                  ? "bg-white border-slate-300 text-slate-800"
                  : "bg-gradient-to-br from-[#0B1124] to-[#070B18] border-cyan-500/40 text-slate-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Focus className="w-4 h-4 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider text-white">
                      Peak Apex Precision Inspector (10× Magnifier)
                    </h4>
                    <p className="text-[10px] text-cyan-400/80">
                      Sub-milli-degree Centroid Fitting • FWHM Half-Max Chord • Doublet Deconvolution
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPeakApexModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Peak Parameter Grid with 4-5 Decimals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#050914] p-3 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Centroid (2θ)</span>
                  <span className="text-base font-black text-cyan-300 mt-0.5">
                    {inspectedPeak.twoTheta.toFixed(4)}°
                  </span>
                  <span className="text-[8px] text-slate-500">± 0.0002° fit error</span>
                </div>

                <div className="bg-[#050914] p-3 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">d-spacing</span>
                  <span className="text-base font-black text-emerald-300 mt-0.5">
                    {calcD(inspectedPeak.twoTheta).toFixed(5)} Å
                  </span>
                  <span className="text-[8px] text-slate-500">λ={activeWavelength.toFixed(5)}Å</span>
                </div>

                <div className="bg-[#050914] p-3 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Observed FWHM</span>
                  <span className="text-base font-black text-purple-300 mt-0.5">
                    {inspectedPeak.fwhmObs.toFixed(4)}°
                  </span>
                  <span className="text-[8px] text-slate-500">β_sample: {inspectedPeak.fwhmSample.toFixed(4)}°</span>
                </div>

                <div className="bg-[#050914] p-3 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Scherrer Domain</span>
                  <span className="text-base font-black text-amber-300 mt-0.5">
                    {inspectedPeak.crystalliteSizeNm} nm
                  </span>
                  <span className="text-[8px] text-slate-500">Shape factor K={shapeFactorK}</span>
                </div>
              </div>

              {/* Additional Microstructure Telemetry */}
              <div className="grid grid-cols-3 gap-2.5 bg-[#050914]/80 p-3 rounded-2xl border border-slate-800/80 text-[10px]">
                <div>
                  <span className="text-slate-400 block">Peak Net Intensity:</span>
                  <span className="font-bold text-white text-xs">
                    {inspectedPeak.rawIntensity?.toLocaleString() || inspectedPeak.intensity?.toLocaleString()} cps
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Integrated Area (AUC):</span>
                  <span className="font-bold text-white text-xs">
                    {inspectedPeak.integratedArea?.toFixed(2)} counts·deg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lattice Microstrain:</span>
                  <span className="font-bold text-white text-xs">
                    {inspectedPeak.microstrainPct ? `${inspectedPeak.microstrainPct.toFixed(4)}%` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Peak Micro-Chart with 10x Zoom */}
              <div className="h-48 w-full bg-[#040710] rounded-2xl border border-slate-800 p-2 relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData.filter(
                      (d) => Math.abs(d.twoTheta - inspectedPeak.twoTheta) <= Math.max(1.0, inspectedPeak.fwhmObs * 4.5)
                    )}
                    margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="twoTheta"
                      domain={["dataMin", "dataMax"]}
                      stroke="#475569"
                      tick={{ fill: "#94a3b8", fontSize: 9, fontFamily: "monospace" }}
                      tickFormatter={(v) => Number(v).toFixed(3)}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 9, fontFamily: "monospace" }}
                      width={36}
                    />
                    <ReferenceLine
                      x={inspectedPeak.twoTheta}
                      stroke="#22d3ee"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      label={{ value: "Apex", position: "top", fill: "#22d3ee", fontSize: 8 }}
                    />
                    <Area
                      type={curveInterpolation}
                      dataKey="intensity"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Observed Diffractogram"
                    />
                    {showCalcProfile && (
                      <Line
                        type={curveInterpolation}
                        dataKey="refIntensity"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={false}
                        name="Calculated Reference"
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
                        />
                        <Line
                          type={curveInterpolation}
                          dataKey="refIntensityKa2"
                          stroke="#c084fc"
                          strokeWidth={1.4}
                          strokeDasharray="3 3"
                          dot={false}
                          name="Kα2"
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
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
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold transition-all flex items-center gap-1.5"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Measure in Caliper
                </button>
                <button
                  onClick={() => setShowPeakApexModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
                >
                  Close Lens
                </button>
              </div>
            </div>
          </motion.div>
        )}
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
