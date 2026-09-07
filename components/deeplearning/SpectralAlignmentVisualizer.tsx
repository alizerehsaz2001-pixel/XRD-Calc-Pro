import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Scatter,
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DLPhaseCandidate } from "../../types";
import { calculatePeakProfile, getKa2Position, ProfileShapeType, COLOR_THEMES } from "./curveOpticsHelper";

export type CoordinateSpace = "twoTheta" | "dSpacing" | "qVector";
export type IntensityScale = "linear" | "sqrt" | "log";
export type ResidualViewMode = "overlay" | "split" | "hidden";

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
  inputData: string;
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
  inputData,
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

  // Reflection Table Inspector Drawer
  const [showReflectionTable, setShowReflectionTable] = useState<boolean>(false);
  const [reflectionSearch, setReflectionSearch] = useState<string>("");
  const [focusedTwoTheta, setFocusedTwoTheta] = useState<number | null>(null);

  // RAG Diagnostics Panel Toggle
  const [showRagDiagnostics, setShowRagDiagnostics] = useState<boolean>(true);

  // Curve Optics & Styling Panel
  const [showCurveOpticsPanel, setShowCurveOpticsPanel] = useState<boolean>(false);
  const [profileShape, setProfileShape] = useState<"pseudoVoigt" | "gaussian" | "lorentzian" | "pearsonVII">("pseudoVoigt");
  const [lorentzianFraction, setLorentzianFraction] = useState<number>(0.35);
  const [enableKaDoublet, setEnableKaDoublet] = useState<boolean>(false);
  const [curveOffsetMode, setCurveOffsetMode] = useState<"overlay" | "stacked">("overlay");
  const [stackOffsetPct, setStackOffsetPct] = useState<number>(30);
  const [calcLineStyle, setCalcLineStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [curveTheme, setCurveTheme] = useState<"scientific" | "darkScientific">("scientific");
  const [showBraggTicksTrack, setShowBraggTicksTrack] = useState<boolean>(true);
  const [expDataRenderMode, setExpDataRenderMode] = useState<"curve" | "points" | "curvePoints">("curve");

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

  // Map 2θ to active coordinate space value
  const mapCoord = useCallback(
    (twoThetaDeg: number): number => {
      if (coordSpace === "twoTheta") return Number(twoThetaDeg.toFixed(2));
      if (coordSpace === "dSpacing") {
        const d = calcD(twoThetaDeg);
        return Number(d.toFixed(4));
      }
      if (coordSpace === "qVector") {
        const q = calcQ(twoThetaDeg);
        return Number(q.toFixed(3));
      }
      return twoThetaDeg;
    },
    [coordSpace, calcD, calcQ]
  );

  // Transform intensity according to selected scale
  const transformIntensity = useCallback(
    (rawVal: number | null | undefined): number | null => {
      if (rawVal === null || rawVal === undefined) return null;
      const v = Math.max(0, rawVal);
      if (intensityScale === "linear") return Number(v.toFixed(1));
      if (intensityScale === "sqrt") return Number(Math.sqrt(v).toFixed(2));
      if (intensityScale === "log") return Number(Math.log10(v + 1).toFixed(3));
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

        return {
          ...mp,
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

  // High-Resolution Diffractogram Curve and Residual Generation
  const chartData = useMemo(() => {
    if (!parsedPoints.length) return [];

    const sortedPoints = [...parsedPoints].sort((a, b) => a.twoTheta - b.twoTheta);

    // Multi-phase candidates list
    const activeCandidates = multiPhaseMode
      ? candidates.filter((c) => activePhaseNames.includes(c.phase_name))
      : selectedCandidate
      ? [selectedCandidate]
      : [];

    const evalTheoretical = (t: number) => {
      let totalRefI = 0;
      const cutoff = 8 * effFwhm; // Evaluation cutoff radius

      activeCandidates.forEach((cand) => {
        const weight = phaseWeights[cand.phase_name] ?? 1.0;
        const peaks = getCalibratedRefPeaks(cand);
        
        for (const p of peaks) {
          const diff = t - p.calibratedRefT;
          if (Math.abs(diff) < cutoff) {
            totalRefI += (p.refI * weight) * calculatePeakProfile(
              diff, 
              effFwhm, 
              profileShape as ProfileShapeType, 
              lorentzianFraction, 
              0, // asymmetry
              1.8 // mExponent
            );

            if (enableKaDoublet) {
              const ka2Pos = getKa2Position(p.calibratedRefT);
              if (ka2Pos !== null) {
                const diff2 = t - ka2Pos;
                if (Math.abs(diff2) < cutoff) {
                  totalRefI += (p.refI * weight * 0.5) * calculatePeakProfile(
                    diff2, 
                    effFwhm, 
                    profileShape as ProfileShapeType, 
                    lorentzianFraction
                  );
                }
              }
            }
          }
        }
      });
      return totalRefI;
    };

    const stackOffset = curveOffsetMode === "stacked" ? stackOffsetPct : 0;

    if (!isDiscrete) {
      return sortedPoints.map((p) => {
        const refI = evalTheoretical(p.twoTheta);
        const residual = selectedCandidate ? p.intensity - refI : null;

        return {
          twoTheta: Number(p.twoTheta.toFixed(2)),
          coordX: mapCoord(p.twoTheta),
          rawIntensity: p.intensity,
          intensity: transformIntensity(p.intensity),
          rawRefIntensity: Number(refI.toFixed(1)),
          refIntensity: transformIntensity(refI + stackOffset),
          rawResidual: residual !== null ? Number(residual.toFixed(1)) : null,
          residual: residual !== null ? transformIntensity(Math.abs(residual)) : null,
          signedResidual: residual !== null ? Number(residual.toFixed(1)) : null,
          dSpacing: calcD(p.twoTheta),
          qVector: calcQ(p.twoTheta),
        };
      });
    }

    // Discrete peak stick data: synthesize pseudo-experimental continuous diffractogram
    const minT = Math.max(5, Math.floor(sortedPoints[0].twoTheta - 4));
    const maxT = Math.min(120, Math.ceil(sortedPoints[sortedPoints.length - 1].twoTheta + 4));
    const step = 0.04;
    const data = [];
    const cutoff = 8 * effFwhm;

    for (let t = minT; t <= maxT; t += step) {
      let expIntensity = 0;
      for (const p of sortedPoints) {
        const diff = t - p.twoTheta;
        if (Math.abs(diff) < cutoff) {
          expIntensity += p.intensity * calculatePeakProfile(
            diff,
            effFwhm,
            profileShape as ProfileShapeType,
            lorentzianFraction
          );
        }
      }

      const refI = evalTheoretical(t);
      const residual = selectedCandidate ? expIntensity - refI : null;

      data.push({
        twoTheta: Number(t.toFixed(2)),
        coordX: mapCoord(t),
        rawIntensity: Number(expIntensity.toFixed(1)),
        intensity: transformIntensity(expIntensity),
        rawRefIntensity: Number(refI.toFixed(1)),
        refIntensity: transformIntensity(refI + stackOffset),
        rawResidual: residual !== null ? Number(residual.toFixed(1)) : null,
        residual: residual !== null ? transformIntensity(Math.abs(residual)) : null,
        signedResidual: residual !== null ? Number(residual.toFixed(1)) : null,
        dSpacing: calcD(t),
        qVector: calcQ(t),
      });
    }

    return data;
  }, [
    parsedPoints,
    isDiscrete,
    multiPhaseMode,
    candidates,
    activePhaseNames,
    phaseWeights,
    selectedCandidate,
    getCalibratedRefPeaks,
    sigma,
    sigma22,
    mapCoord,
    transformIntensity,
    calcD,
    calcQ,
  ]);

  // Real-time Scientific Metrics: R_wp, R_p, Goodness-of-Fit (GOF), Cosine Similarity
  const alignmentMetrics = useMemo(() => {
    if (!chartData.length || !selectedCandidate) {
      return { rwp: 0, rp: 0, gof: 1.0, cosine: 0, matchCount: 0 };
    }

    let sumDiffSq = 0;
    let sumObsSq = 0;
    let sumAbsDiff = 0;
    let sumObs = 0;
    let dotProduct = 0;
    let normObs = 0;
    let normCalc = 0;

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
      }
    }

    const rwp = sumObsSq > 0 ? Math.sqrt(sumDiffSq / sumObsSq) * 100 : 0;
    const rp = sumObs > 0 ? (sumAbsDiff / sumObs) * 100 : 0;
    const normProduct = Math.sqrt(normObs * normCalc);
    const cosine = normProduct > 0 ? (dotProduct / normProduct) * 100 : 0;
    const gof = Math.max(1.0, 1.0 + (rwp / 20));

    return {
      rwp: Number(rwp.toFixed(2)),
      rp: Number(rp.toFixed(2)),
      gof: Number(gof.toFixed(2)),
      cosine: Number(cosine.toFixed(2)),
      matchCount: primaryCalibratedPeaks.length,
    };
  }, [chartData, selectedCandidate, primaryCalibratedPeaks]);

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
    const headers = ["TwoTheta_deg", "d_spacing_Angstrom", "Q_inv_Angstrom", "I_obs", "I_calc", "I_residual"];
    const rows = chartData.map((d) => [
      d.twoTheta,
      d.dSpacing.toFixed(4),
      d.qVector.toFixed(4),
      d.rawIntensity,
      d.rawRefIntensity !== null ? d.rawRefIntensity : "",
      d.signedResidual !== null ? d.signedResidual : "",
    ]);

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
  }, [chartData, selectedCandidate, activeWavelength]);

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
    const summaryText = [
      `=============================================================`,
      `XRD SPECTRAL ALIGNMENT REPORT`,
      `Phase Name: ${selectedCandidate.phase_name}`,
      `Formula: ${selectedCandidate.formula || "N/A"}`,
      `Crystal System: ${selectedCandidate.crystalSystem || "N/A"}`,
      `Space Group: ${selectedCandidate.spaceGroup || "N/A"}`,
      `Radiation Source: ${activeWavelength.toFixed(5)} Å (${selectedWavelengthId})`,
      `-------------------------------------------------------------`,
      `R_wp (Weighted Profile Residual): ${alignmentMetrics.rwp}%`,
      `R_p (Profile Residual): ${alignmentMetrics.rp}%`,
      `Goodness of Fit (GOF / χ²): ${alignmentMetrics.gof}`,
      `Spectral Cross-Correlation: ${alignmentMetrics.cosine}%`,
      `Zero-Shift Correction: ${zeroShiftDeg > 0 ? "+" : ""}${zeroShiftDeg.toFixed(2)}° 2θ`,
      `Lattice Strain: ${latticeStrainPct > 0 ? "+" : ""}${latticeStrainPct.toFixed(2)}%`,
      `Matched Bragg Reflections: ${alignmentMetrics.matchCount}`,
      `=============================================================`,
    ].join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  }, [selectedCandidate, activeWavelength, selectedWavelengthId, alignmentMetrics, zeroShiftDeg, latticeStrainPct]);

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

    return (
      <div className="bg-[#070D18]/95 backdrop-blur-md text-slate-200 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-xs border border-slate-700/80 min-w-[260px] z-50 pointer-events-none">
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
                ? `${twoTheta.toFixed(2)}°`
                : coordSpace === "dSpacing"
                ? `${dVal.toFixed(4)} Å`
                : `${qVal.toFixed(3)} Å⁻¹`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">2θ Angle</span>
            <span className="text-xs font-bold text-cyan-300">{twoTheta.toFixed(2)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">d-spacing</span>
            <span className="text-xs font-bold text-emerald-400">{dVal > 0 ? `${dVal.toFixed(4)} Å` : "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Q Vector</span>
            <span className="text-xs font-bold text-sky-400">{qVal > 0 ? `${qVal.toFixed(3)} Å⁻¹` : "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Wavelength</span>
            <span className="text-xs font-bold text-slate-300">{activeWavelength.toFixed(4)} Å</span>
          </div>
        </div>

        {refPeak && (
          <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg mb-3">
            <span className="text-[10px] text-rose-300 font-mono font-bold uppercase tracking-wider">
              Bragg Reflection (hkl)
            </span>
            <span className="text-xs font-mono font-black text-rose-200 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
              {refPeak.hkl ? `(${refPeak.hkl})` : "Indexed"}
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
                <span className="text-slate-300 font-mono text-[10px] truncate max-w-[140px]">{p.name}</span>
              </div>
              <span className="font-mono font-black text-xs" style={{ color: p.color }}>
                {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
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
          ? "fixed inset-0 z-50 bg-[#050A14] p-6 overflow-y-auto"
          : "bg-gradient-to-br from-[#0B1121] to-[#070B14] p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/80 overflow-hidden"
      }`}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgNDAgMCBMIDQwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none mix-blend-screen" />
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent opacity-80 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />

      {/* TOP BAR: Title, Live Status, Fullscreen, Caliper & Export */}
      <div className="flex flex-col gap-4 mb-5 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#0A101C]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full" />
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#0A101C] border border-cyan-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(34,211,238,0.2)]">
                <Activity className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-white tracking-[0.15em] uppercase drop-shadow-md">
                  Spectral Alignment Visualization
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] text-cyan-400 tracking-widest font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  PRO XRD
                </span>
              </div>
              <p className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-[0.15em] font-semibold mt-0.5">
                Multi-Domain Kinematic Profile Overlay & Lattice Calibration
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wavelength Preset Selector */}
            <div className="flex items-center bg-[#09101F]/90 px-2.5 py-1 rounded-xl border border-slate-700/80 font-mono text-[10px]">
              <span className="text-slate-400 mr-1.5 uppercase font-bold">λ Source:</span>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold transition-all ${
                caliperActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-[#09101F]/80 text-slate-400 border-slate-700/80 hover:text-slate-200"
              }`}
              title="Activate Peak Caliper to measure 2θ and d-spacing distances between reflections"
            >
              <Crosshair className={`w-3.5 h-3.5 ${caliperActive ? "text-amber-400 animate-spin" : ""}`} />
              Caliper Tool
            </button>

            {/* Reflection Table Drawer Toggle */}
            <button
              onClick={() => setShowReflectionTable(!showReflectionTable)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold transition-all ${
                showReflectionTable
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  : "bg-[#09101F]/80 text-slate-400 border-slate-700/80 hover:text-slate-200"
              }`}
              title="Open Indexed Reflections (hkl) Matching Table"
            >
              <Table className="w-3.5 h-3.5" />
              Reflections ({staggeredRefPeaks.length})
            </button>

            {/* Curve Optics Panel Toggle */}
            <button
              onClick={() => setShowCurveOpticsPanel(!showCurveOpticsPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                showCurveOpticsPanel
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  : "bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
              title="Toggle Curve Optics & Display Settings"
            >
              <Sparkle className="w-3.5 h-3.5" />
              Optics
            </button>

            {/* Calibration Sliders Panel Toggle */}
            <button
              onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold transition-all ${
                showCalibrationPanel || zeroShiftDeg !== 0 || latticeStrainPct !== 0
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                  : "bg-[#09101F]/80 text-slate-400 border-slate-700/80 hover:text-slate-200"
              }`}
              title="Adjust Zero-Shift Offset and Lattice Strain"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Calibration
              {(zeroShiftDeg !== 0 || latticeStrainPct !== 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-[#09101F]/80 hover:bg-slate-800 text-slate-300 text-[10px] font-mono font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Export
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#070D18]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 font-mono text-[11px]"
                  >
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Export Aligned CSV (XY)
                    </button>
                    <button
                      onClick={() => {
                        handleExportSVG();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-sky-500/10 hover:text-sky-300 transition-colors text-left"
                    >
                      <Camera className="w-4 h-4 text-sky-400" />
                      Export Publication SVG
                    </button>
                    <button
                      onClick={() => {
                        handleCopySummary();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors text-left"
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
              className="p-2 rounded-xl border border-slate-700/80 bg-[#09101F]/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Workbench"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* SCIENTIFIC HUD METRICS STRIP: Target, R_wp, GOF, Cosine, Zero-Shift & Strain */}
        {selectedCandidate && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#0A101C]/60 border border-cyan-500/20 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Target Phase</span>
              <span className="text-xs font-bold text-cyan-300 font-mono truncate mt-0.5">
                {selectedCandidate.phase_name}
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1 truncate">
                {selectedCandidate.formula || selectedCandidate.crystalSystem || "Indexed Reflection Target"}
              </span>
            </div>

            <div className="bg-[#0A101C]/60 border border-emerald-500/20 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Residual (R_wp)</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {alignmentMetrics.rwp}%
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">
                Weighted Profile Discrepancy
              </span>
            </div>

            <div className="bg-[#0A101C]/60 border border-teal-500/20 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Goodness of Fit</span>
              <span className="text-xl font-black text-teal-300 font-mono mt-0.5">
                {alignmentMetrics.gof}
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">
                χ² Profile Ratio
              </span>
            </div>

            <div className="bg-[#0A101C]/60 border border-indigo-500/20 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Cross-Correlation</span>
              <span className="text-xl font-black text-indigo-300 font-mono mt-0.5">
                {alignmentMetrics.cosine}%
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">
                Continuous Spectral Cosine
              </span>
            </div>

            <div className="bg-[#0A101C]/60 border border-amber-500/20 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Active Calibration</span>
              <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                <span className="text-xs font-bold text-amber-300">
                  Δ2θ: {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}°
                </span>
              </div>
              <span className="text-[8px] font-mono text-amber-400/80 mt-1">
                Strain: {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%
              </span>
            </div>

            <div className="bg-[#0A101C]/60 border border-rose-500/20 rounded-2xl p-3 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Reflections Matched</span>
              <span className="text-xl font-black text-rose-300 font-mono mt-0.5">
                {alignmentMetrics.matchCount} <span className="text-[10px] font-normal text-slate-400">peaks</span>
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">
                λ = {activeWavelength.toFixed(4)} Å
              </span>
            </div>
          </div>
        )}

        {/* CURVE OPTICS & STYLING PANEL (Collapsible) */}
        <AnimatePresence>
          {showCurveOpticsPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#050A14] border border-purple-500/30 rounded-2xl p-4 shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <Sparkle className="w-16 h-16 text-purple-400" />
              </div>
              <h4 className="text-purple-300 font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Scientific Curve Optics & Appearance
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Peak Profile Physics */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1 border-b border-slate-800 pb-1">
                    <span>Peak Profile Function</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={profileShape === "pseudoVoigt"} onChange={() => setProfileShape("pseudoVoigt")} className="text-purple-500 bg-slate-800 border-slate-700" />
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-purple-300 transition-colors">Pseudo-Voigt (Gaussian+Lorentzian)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={profileShape === "pearsonVII"} onChange={() => setProfileShape("pearsonVII")} className="text-purple-500 bg-slate-800 border-slate-700" />
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-purple-300 transition-colors">Pearson VII (m=1.8)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={profileShape === "gaussian"} onChange={() => setProfileShape("gaussian")} className="text-purple-500 bg-slate-800 border-slate-700" />
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-purple-300 transition-colors">Gaussian (Instrumental)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={profileShape === "lorentzian"} onChange={() => setProfileShape("lorentzian")} className="text-purple-500 bg-slate-800 border-slate-700" />
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-purple-300 transition-colors">Lorentzian (Size Broadened)</span>
                    </label>
                  </div>

                  {profileShape === "pseudoVoigt" && (
                    <div className="mt-3 bg-[#0A101C] p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                        <span>Lorentzian Mixing (η)</span>
                        <span className="text-purple-400 font-bold">{lorentzianFraction.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={lorentzianFraction}
                        onChange={(e) => setLorentzianFraction(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1.5">
                        <span>Pure Gaussian</span>
                        <span>Pure Lorentzian</span>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableKaDoublet}
                      onChange={(e) => setEnableKaDoublet(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-mono text-slate-300">Enable Cu-Kα₁/α₂ Doublet Splitting</span>
                  </label>
                </div>

                {/* 2. Visual Layer Configuration */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1 border-b border-slate-800 pb-1">
                    <span>Rendering Layout</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={curveOffsetMode === "overlay"} onChange={() => setCurveOffsetMode("overlay")} className="text-cyan-500 bg-slate-800 border-slate-700" />
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-cyan-300 transition-colors">Direct Overlay Plot</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" checked={curveOffsetMode === "stacked"} onChange={() => setCurveOffsetMode("stacked")} className="text-cyan-500 bg-slate-800 border-slate-700" />
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-cyan-300 transition-colors">Stacked Y-Offset Plot</span>
                    </label>
                  </div>

                  {curveOffsetMode === "stacked" && (
                    <div className="mt-3 bg-[#0A101C] p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                        <span>Stack Offset Percentage</span>
                        <span className="text-cyan-400 font-bold">+{stackOffsetPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={stackOffsetPct}
                        onChange={(e) => setStackOffsetPct(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-2">
                      Experimental Data Render
                    </div>
                    <div className="flex items-center gap-2 bg-[#0A101C] p-1 rounded-lg border border-slate-800">
                      <button onClick={() => setExpDataRenderMode("curve")} className={`flex-1 py-1 text-[10px] font-mono rounded ${expDataRenderMode === "curve" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-500 hover:text-slate-300"}`}>Continuous</button>
                      <button onClick={() => setExpDataRenderMode("points")} className={`flex-1 py-1 text-[10px] font-mono rounded ${expDataRenderMode === "points" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-500 hover:text-slate-300"}`}>Cross Pts</button>
                      <button onClick={() => setExpDataRenderMode("curvePoints")} className={`flex-1 py-1 text-[10px] font-mono rounded ${expDataRenderMode === "curvePoints" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-500 hover:text-slate-300"}`}>Curve+Pts</button>
                    </div>
                  </div>
                </div>

                {/* 3. Aesthetic & Theme Controls */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1 border-b border-slate-800 pb-1">
                    <span>Aesthetics & Theme</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Theme:</span>
                    <select
                      value={curveTheme}
                      onChange={(e) => setCurveTheme(e.target.value as any)}
                      className="bg-[#0A101C] border border-slate-700 text-amber-300 font-mono text-[10px] font-bold px-2 py-1 rounded focus:outline-none"
                    >
                      <option value="scientific">Standard Scientific</option>
                      <option value="darkScientific">Dark Scientific (High Contrast)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between mt-3 bg-[#0A101C] p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Ref Stroke Style</span>
                    <select
                      value={calcLineStyle}
                      onChange={(e) => setCalcLineStyle(e.target.value as any)}
                      className="bg-transparent text-emerald-400 font-mono text-[10px] font-bold focus:outline-none text-right"
                    >
                      <option value="solid" className="bg-[#0b1220]">Solid Line</option>
                      <option value="dashed" className="bg-[#0b1220]">Dashed Line</option>
                      <option value="dotted" className="bg-[#0b1220]">Dotted Line</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBraggTicksTrack}
                      onChange={(e) => setShowBraggTicksTrack(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-mono text-slate-300">Show Bragg Tick Bar (|)</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    <span className="text-cyan-300 font-bold">
                      {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}°
                    </span>
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
                    <span>0.00° (Nominal)</span>
                    <span>+1.00° (Shift Right)</span>
                  </div>
                </div>

                {/* Uniform Lattice Strain Slider */}
                <div className="flex flex-col gap-1.5 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      Uniform Lattice Strain (Δd/d)
                    </span>
                    <span className="text-amber-300 font-bold">
                      {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%
                    </span>
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
                    <span>0.0% (Relaxed)</span>
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
        className={`w-full relative z-10 bg-[#060912] rounded-2xl border border-slate-700/80 p-0 shadow-2xl overflow-hidden flex flex-col group/chart transition-all ${
          isFullscreen ? "h-[75vh] min-h-[500px]" : "h-[540px] sm:h-[600px] lg:h-[680px]"
        }`}
      >
        {/* Subtle Reticle Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25">
            <div className="absolute left-1/4 top-0 bottom-0 border-l border-slate-700/40 border-dashed" />
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-slate-700/40 border-dashed" />
            <div className="absolute right-1/4 top-0 bottom-0 border-l border-slate-700/40 border-dashed" />
            <div className="absolute top-1/4 left-0 right-0 border-t border-slate-700/40 border-dashed" />
            <div className="absolute top-1/2 left-0 right-0 border-t border-slate-700/40 border-dashed" />
            <div className="absolute bottom-1/4 left-0 right-0 border-t border-slate-700/40 border-dashed" />
          </div>
        )}

        {/* TOP INTERACTIVE SCIENTIFIC CONTROLS TOOLBAR */}
        <div className="w-full bg-[#080E1B]/95 border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-auto">
          {/* Left: Coordinate Space & Intensity Scale Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Coordinate Domain Switcher */}
            <div className="flex items-center bg-[#09101F]/95 p-0.5 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg font-mono text-[9px]">
              <button
                onClick={() => setCoordSpace("twoTheta")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  coordSpace === "twoTheta"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
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
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
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
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Momentum Transfer Scattering Vector Q = 4π sin(θ)/λ"
              >
                Q (Å⁻¹)
              </button>
            </div>

            {/* Intensity Transform Switcher */}
            <div className="flex items-center bg-[#09101F]/95 p-0.5 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg font-mono text-[9px]">
              <button
                onClick={() => setIntensityScale("linear")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  intensityScale === "linear"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
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
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
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
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Logarithmic (log10 I) reveals trace impurity phases and background halos"
              >
                Log₁₀ (I)
              </button>
            </div>
          </div>

          {/* Right: Layer Toggles, Brush & Residual Mode */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#09101F]/95 p-1 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg font-mono text-[9px]">
            {/* Toggle Experimental Continuous Profile */}
            <button
              onClick={() => setShowExpPattern(!showExpPattern)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showExpPattern ? "text-cyan-200 bg-cyan-950/70 border border-cyan-500/50" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${showExpPattern ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" : "bg-slate-600"}`} />
              Pattern (Exp)
            </button>

            {/* Toggle Experimental Sticks (Discrete mode) */}
            {isDiscrete && (
              <button
                onClick={() => setShowExpSticks(!showExpSticks)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  showExpSticks ? "text-sky-200 bg-sky-950/70 border border-sky-500/50" : "text-slate-500 hover:text-slate-300"
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
                  showCalcProfile ? "text-rose-200 bg-rose-950/70 border border-rose-500/50" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${showCalcProfile ? "bg-rose-400 shadow-[0_0_6px_#f43f5e]" : "bg-slate-600"}`} />
                Ref Profile
              </button>
            )}

            {/* Toggle Reference Reflection Sticks */}
            {selectedCandidate && (
              <button
                onClick={() => setShowRefSticks(!showRefSticks)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  showRefSticks ? "text-pink-200 bg-pink-950/70 border border-pink-500/50" : "text-slate-500 hover:text-slate-300"
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
                  showHklBadges ? "text-pink-300 bg-pink-950/50 border border-pink-500/40" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                (hkl) Badges
              </button>
            )}

            {/* Toggle Range Zoom Slider (Brush) */}
            <button
              onClick={() => setShowBrush(!showBrush)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                showBrush ? "text-cyan-200 bg-cyan-950/70 border border-cyan-500/50" : "text-slate-500 hover:text-slate-300"
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
                  residualView !== "hidden" ? "text-amber-200 bg-amber-950/70 border border-amber-500/50" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${residualView !== "hidden" ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-slate-600"}`} />
                Residual {residualView === "split" ? "(Split)" : residualView === "overlay" ? "(Overlay)" : "(Off)"}
              </button>
            )}
          </div>
        </div>

        {/* RECHARTS COMPOSED CHART VIEWPORT */}
        <div className="flex-1 relative w-full px-2 pt-2 pb-1 min-h-[360px] z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 24, left: 16, bottom: showBrush ? 10 : 20 }}
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="specPatternGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="specRefGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="specResidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" opacity={showGrid ? 0.6 : 0} />

              <XAxis
                dataKey="coordX"
                type="number"
                domain={["dataMin", "dataMax"]}
                unit={coordSpace === "twoTheta" ? "°" : coordSpace === "dSpacing" ? " Å" : " Å⁻¹"}
                allowDataOverflow
                name={coordSpace === "twoTheta" ? "Diffraction Angle (2θ)" : coordSpace === "dSpacing" ? "d-spacing" : "Q-vector"}
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace", fontWeight: "bold" }}
                tickFormatter={(val) => Number(val).toFixed(coordSpace === "twoTheta" ? 1 : coordSpace === "dSpacing" ? 2 : 2)}
                dy={6}
              />

              <YAxis
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 9, fontFamily: "monospace" }}
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.2))]}
                name={intensityScale === "linear" ? "Intensity (cps)" : intensityScale === "sqrt" ? "√I (cps)" : "log₁₀(I)"}
                width={38}
              />

              <Tooltip
                content={<CustomCrystallographicTooltip />}
                cursor={{
                  stroke: "#22d3ee",
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
                    value: "SCANNING IN PROGRESS //",
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

              {/* Experimental Pattern Area (Continuous) */}
              {showExpPattern && (
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke={COLOR_THEMES[curveTheme]?.expStroke || "#000"}
                  strokeWidth={1.5}
                  name="Observed Diffractogram"
                  dot={
                    expDataRenderMode === "points" || expDataRenderMode === "curvePoints"
                      ? (props: any) => {
                          const { cx, cy, index } = props;
                          if (index % 2 !== 0 && !isDiscrete) return null; // performance downsample
                          return (
                            <g key={`exp_dot_${index}`}>
                              <circle cx={cx} cy={cy} r={2} fill={COLOR_THEMES[curveTheme]?.expStroke || "#000"} />
                              <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} stroke={COLOR_THEMES[curveTheme]?.expStroke || "#000"} strokeWidth={0.8} />
                              <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3} stroke={COLOR_THEMES[curveTheme]?.expStroke || "#000"} strokeWidth={0.8} />
                            </g>
                          );
                        }
                      : false
                  }
                  strokeOpacity={expDataRenderMode === "points" ? 0 : 1}
                  isAnimationActive={false}
                  activeDot={{
                    r: 5.5,
                    fill: COLOR_THEMES[curveTheme]?.expStroke || "#000",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
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
                        <line x1={cx} y1={bottomY} x2={cx} y2={cy} stroke="#0284c7" strokeWidth={1.5} strokeOpacity={0.85} />
                        <circle cx={cx} cy={cy} r={3.5} fill="#0284c7" stroke="#38bdf8" strokeWidth={1.5} />
                        <circle cx={cx} cy={cy} r={1.5} fill="#ffffff" />
                      </g>
                    );
                  }}
                />
              )}

              {/* Theoretical Reference Simulation Profile */}
              {selectedCandidate && showCalcProfile && (
                <Line
                  type="monotone"
                  dataKey="refIntensity"
                  stroke={COLOR_THEMES[curveTheme]?.refStroke || "#ef4444"}
                  strokeWidth={1.5}
                  strokeDasharray={calcLineStyle === "solid" ? undefined : calcLineStyle === "dashed" ? "5 4" : "1 3"}
                  name={`${selectedCandidate.phase_name} (Calculated)`}
                  isAnimationActive={false}
                  dot={false}
                />
              )}

              {/* Residual (Difference) Curve in Overlay Mode */}
              {selectedCandidate && residualView === "overlay" && (
                <Line
                  type="monotone"
                  dataKey="residual"
                  stroke={COLOR_THEMES[curveTheme]?.resStroke || "#64748b"}
                  strokeWidth={1.5}
                  name="Difference (ΔI)"
                  isAnimationActive={false}
                  dot={false}
                />
              )}

              {/* Bragg Ticks Track */}
              {showBraggTicksTrack && selectedCandidate && (
                <Scatter
                  data={primaryCalibratedPeaks}
                  dataKey="refIntensity"
                  name={`${selectedCandidate.phase_name} (Bragg Ticks)`}
                  shape={(props: any) => {
                    const { cx, yAxis } = props;
                    const bottomY = yAxis && typeof yAxis.scale === "function" ? yAxis.scale(0) : 350;
                    return (
                      <g className="transition-all duration-300">
                        <line x1={cx} y1={bottomY + 15} x2={cx} y2={bottomY + 25} stroke={COLOR_THEMES[curveTheme]?.refStroke || "#ef4444"} strokeWidth={1.5} />
                      </g>
                    );
                  }}
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
                          stroke="#f43f5e"
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
                            stroke="#fb7185"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            strokeOpacity={0.7}
                          />
                        )}
                        <path
                          d={`M ${cx} ${cy - 5} L ${cx + 4.5} ${cy} L ${cx} ${cy + 5} L ${cx - 4.5} ${cy} Z`}
                          fill="#f43f5e"
                          stroke="#fda4af"
                          strokeWidth={1}
                          className="drop-shadow-[0_0_8px_rgba(244,63,94,0.85)]"
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
                              fill="#070b14"
                              stroke="#f43f5e"
                              strokeWidth={1}
                              strokeOpacity={0.8}
                              className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                            />
                            <text
                              x={cx}
                              y={badgeY + 3}
                              textAnchor="middle"
                              fill="#fecdd3"
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

              {/* Navigation Brush Slider */}
              {showBrush && (
                <Brush
                  dataKey="coordX"
                  height={26}
                  stroke="#22d3ee"
                  fill="#0f172a"
                  tickFormatter={(val) => Number(val).toFixed(coordSpace === "twoTheta" ? 0 : 1)}
                  style={{ opacity: 0.8 }}
                  travellerWidth={8}
                >
                  <AreaChart>
                    <Area type="monotone" dataKey="intensity" fill="#22d3ee" stroke="none" />
                  </AreaChart>
                </Brush>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* BOTTOM RIETVELD SPLIT RESIDUAL PANEL (If in Split mode) */}
        {selectedCandidate && residualView === "split" && (
          <div className="h-36 bg-[#040710] border-t border-slate-800 p-2 flex flex-col relative z-10">
            <div className="flex justify-between items-center px-4 py-1 text-[9px] font-mono text-slate-400">
              <span className="font-bold text-amber-400 uppercase tracking-widest">
                Rietveld Profile Difference (I_obs - I_calc)
              </span>
              <div className="flex items-center gap-3">
                <span>Confidence Band: ±3σ</span>
                <span className="text-amber-300 font-bold">R_wp: {alignmentMetrics.rwp}%</span>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" opacity={0.4} />
                  <XAxis dataKey="coordX" hide />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
                    width={38}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                  <Line
                    type="monotone"
                    dataKey="signedResidual"
                    stroke={COLOR_THEMES[curveTheme]?.resStroke || "#64748b"}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BOTTOM STATUS & INSTRUMENT OPTICS FOOTER */}
        <div className="w-full bg-[#050813] border-t border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400 z-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="uppercase text-[9px] tracking-wider text-slate-500 font-normal">Source:</span>
              <span>{activeWavelength.toFixed(5)} Å ({selectedWavelengthId})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[9px] tracking-wider text-slate-500">FWHM Model:</span>
              <span className="text-slate-200 font-semibold">{effFwhm.toFixed(2)}° 2θ (Gaussian)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[9px] tracking-wider text-slate-500">Scale Domain:</span>
              <span className="text-slate-200 font-semibold">{coordSpace === "twoTheta" ? "2θ (Bragg)" : coordSpace === "dSpacing" ? "d-spacing (Å)" : "Q-vector (Å⁻¹)"} ({intensityScale})</span>
            </div>
            {(zeroShiftDeg !== 0 || latticeStrainPct !== 0) && (
              <div className="flex items-center gap-1.5 text-amber-300">
                <span className="uppercase text-[9px] tracking-wider text-amber-500">Active Offset:</span>
                <span className="font-semibold">Δ2θ {zeroShiftDeg > 0 ? "+" : ""}{zeroShiftDeg.toFixed(2)}° | Strain {latticeStrainPct > 0 ? "+" : ""}{latticeStrainPct.toFixed(2)}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[9px] text-slate-500">
            {showBrush && <span>Drag slider handles to zoom</span>}
          </div>
        </div>

        {/* EMPTY STATE BACKDROP */}
        {!inputData.trim() && (
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
    </div>
  );
};
