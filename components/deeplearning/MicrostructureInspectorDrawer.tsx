import React, { useState } from "react";
import {
  Table,
  Sparkles,
  Layers,
  Search,
  X,
  Crosshair,
  FileSpreadsheet,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Maximize2,
  Minimize2,
  Atom,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DetectedPeak, WilliamsonHallResult } from "./xrdPhysicsEngine";
import { CaliperPoint } from "./SpectralAlignmentVisualizer";

export interface MicrostructureInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  detectedPeaks: DetectedPeak[];
  williamsonHall: WilliamsonHallResult | null;
  filteredReflections: any[];
  focusedTwoTheta: number | null;
  onFocusPeak: (twoTheta: number) => void;
  onSendToCaliper?: (pt1: CaliperPoint, pt2?: CaliperPoint) => void;
  lambda: number;
  instrumentalFwhm: number;
  onInstrumentalFwhmChange: (val: number) => void;
  shapeFactorK: number;
  onShapeFactorKChange: (val: number) => void;
  minProminencePct: number;
  onMinProminenceChange: (val: number) => void;
  // Multi-phase Quantitative Decomposition props
  activeCandidates: any[];
  phaseWeights: Record<string, number>;
  onPhaseWeightChange: (name: string, weight: number) => void;
  onAutoFitPhaseFractions?: () => void;
  onNormalizePhaseFractions?: () => void;
  isOptimizingFractions?: boolean;
  phaseFractionsOptimizationStatus?: string | null;
  themeMode?: "darkLab" | "publication";
}

export const MicrostructureInspectorDrawer: React.FC<MicrostructureInspectorDrawerProps> = ({
  isOpen,
  onClose,
  detectedPeaks,
  williamsonHall,
  filteredReflections,
  focusedTwoTheta,
  onFocusPeak,
  onSendToCaliper,
  lambda,
  instrumentalFwhm,
  onInstrumentalFwhmChange,
  shapeFactorK,
  onShapeFactorKChange,
  minProminencePct,
  onMinProminenceChange,
  activeCandidates,
  phaseWeights,
  onPhaseWeightChange,
  onAutoFitPhaseFractions,
  onNormalizePhaseFractions,
  isOptimizingFractions = false,
  phaseFractionsOptimizationStatus = null,
  themeMode = "darkLab",
}) => {
  const [activeTab, setActiveTab] = useState<"peaks" | "williamsonHall" | "reflections" | "phases">("peaks");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPeakIdForCaliper, setSelectedPeakIdForCaliper] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Compute aggregate statistics
  const avgSizeNm = detectedPeaks.length > 0
    ? (detectedPeaks.reduce((acc, p) => acc + p.crystalliteSizeNm, 0) / detectedPeaks.length).toFixed(1)
    : "—";

  const avgMicrostrain = detectedPeaks.length > 0
    ? (detectedPeaks.reduce((acc, p) => acc + p.microstrainPct, 0) / detectedPeaks.length).toFixed(3)
    : "—";

  // Filter detected peaks by search
  const filteredPeaks = detectedPeaks.filter((p) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    const hklMatch = p.matchedHkl && p.matchedHkl.toLowerCase().includes(term);
    const angleMatch = p.twoTheta.toFixed(2).includes(term);
    const dMatch = p.dSpacing.toFixed(3).includes(term);
    return hklMatch || angleMatch || dMatch;
  });

  // Export Peaks CSV
  const handleExportPeaksCSV = () => {
    if (!detectedPeaks.length) return;
    const headers = [
      "Peak_ID",
      "TwoTheta_deg",
      "d_spacing_Angstrom",
      "Q_inv_Angstrom",
      "Obs_FWHM_deg",
      "Instrument_FWHM_deg",
      "Sample_FWHM_deg",
      "Scherrer_Size_nm",
      "Microstrain_pct",
      "Matched_HKL",
      "Delta_TwoTheta_deg",
      "Net_Intensity",
      "Wavelength_Angstrom",
      "Shape_Factor_K",
    ];

    const rows = detectedPeaks.map((p) => [
      p.id,
      p.twoTheta.toFixed(3),
      p.dSpacing.toFixed(4),
      p.qVector.toFixed(4),
      p.fwhmObs.toFixed(3),
      instrumentalFwhm.toFixed(3),
      p.fwhmSample.toFixed(3),
      p.crystalliteSizeNm.toFixed(1),
      p.microstrainPct.toFixed(3),
      p.matchedHkl ? `(${p.matchedHkl})` : "",
      p.deltaTwoTheta !== undefined ? p.deltaTwoTheta.toFixed(3) : "",
      p.intensity.toFixed(1),
      lambda.toFixed(4),
      shapeFactorK,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `xrd_peak_crystallite_analysis_${lambda}A.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Summary Table to Clipboard
  const handleCopyPeaksSummary = () => {
    const lines = [
      `XRD CRYSTALLITE SIZE & MICROSTRAIN SUMMARY`,
      `Wavelength: ${lambda.toFixed(5)} Å | Instrument FWHM (β_inst): ${instrumentalFwhm.toFixed(3)}° | K: ${shapeFactorK}`,
      `Detected Peaks Count: ${detectedPeaks.length}`,
      `Mean Scherrer Crystallite Size: ${avgSizeNm} nm`,
      `Mean Microstrain (Stokes-Wilson): ${avgMicrostrain}%`,
      ...(williamsonHall
        ? [
            `Williamson-Hall Analysis:`,
            `  Equation: ${williamsonHall.equation}`,
            `  Size (tau_WH): ${williamsonHall.crystalliteSizeNm} nm`,
            `  Lattice Strain (eps_WH): ${williamsonHall.microstrainPct}%`,
            `  Correlation (R^2): ${williamsonHall.rSquared}`,
          ]
        : []),
      `---------------------------------------------------------------------------------------------------`,
      `2θ (°)   d (Å)    β_obs (°)  β_samp (°)  Size (nm)  Strain (%)   (hkl)    Δ2θ (°)   Height`,
      ...detectedPeaks.map(
        (p) =>
          `${p.twoTheta.toFixed(2).padEnd(8)}${p.dSpacing.toFixed(4).padEnd(9)}${p.fwhmObs
            .toFixed(3)
            .padEnd(11)}${p.fwhmSample.toFixed(3).padEnd(12)}${p.crystalliteSizeNm
            .toFixed(1)
            .padEnd(11)}${p.microstrainPct.toFixed(3).padEnd(13)}${(p.matchedHkl ? `(${p.matchedHkl})` : "—").padEnd(9)}${(p.deltaTwoTheta !== undefined ? `${p.deltaTwoTheta > 0 ? "+" : ""}${p.deltaTwoTheta.toFixed(2)}` : "—").padEnd(10)}${p.intensity.toFixed(0)}`
      ),
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Total weight for percentage breakdown
  const totalPhaseWeight = activeCandidates.reduce((acc, c) => acc + (phaseWeights[c.phase_name] ?? 1.0), 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className={`mt-4 rounded-2xl border p-5 shadow-2xl relative z-20 font-mono transition-all ${
          themeMode === "publication"
            ? "bg-white border-slate-300 text-slate-900 shadow-slate-200"
            : "bg-[#070B16] border-indigo-500/30 text-slate-200 shadow-black/90"
        } ${isExpanded ? "fixed inset-4 z-50 overflow-y-auto max-h-[92vh] m-auto bg-opacity-98" : ""}`}
      >
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Atom className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase tracking-wider">
                  Crystallographic Microstructure & Quantitative Analysis Suite
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30">
                  FullProf & GSAS-II Compatible
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Scherrer Nanocrystalline Domain Size • Williamson-Hall Size/Strain Deconvolution • Non-Negative Least Squares (NNLS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              title={isExpanded ? "Collapse View" : "Expand Full View"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* METRIC BADGE SUMMARY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 my-4">
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            themeMode === "publication" ? "bg-slate-50 border-slate-200" : "bg-[#050914] border-cyan-500/20"
          }`}>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Mean Scherrer Size</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-cyan-400">{avgSizeNm}</span>
              <span className="text-[10px] text-slate-400">nm</span>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 truncate">τ = Kλ / (β·cosθ)</span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            themeMode === "publication" ? "bg-slate-50 border-slate-200" : "bg-[#050914] border-amber-500/20"
          }`}>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Mean Microstrain</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-amber-400">{avgMicrostrain}%</span>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 truncate">Stokes-Wilson ε = β / 4tanθ</span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            themeMode === "publication" ? "bg-slate-50 border-slate-200" : "bg-[#050914] border-emerald-500/20"
          }`}>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">W-H Domain Size</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-400">
                {williamsonHall ? `${williamsonHall.crystalliteSizeNm} nm` : "—"}
              </span>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 truncate">
              {williamsonHall ? `R² = ${williamsonHall.rSquared}` : "Requires ≥ 2 peaks"}
            </span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            themeMode === "publication" ? "bg-slate-50 border-slate-200" : "bg-[#050914] border-purple-500/20"
          }`}>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">W-H Lattice Strain</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-purple-400">
                {williamsonHall ? `${williamsonHall.microstrainPct}%` : "—"}
              </span>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 truncate">
              {williamsonHall ? `Slope m = ε_WH` : "Linear fit slope"}
            </span>
          </div>

          <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 flex flex-col justify-between ${
            themeMode === "publication" ? "bg-slate-50 border-slate-200" : "bg-[#050914] border-indigo-500/20"
          }`}>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Peaks Analyzed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-indigo-400">{detectedPeaks.length}</span>
              <span className="text-[10px] text-slate-400">reflections</span>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 truncate">λ = {lambda.toFixed(4)} Å</span>
          </div>
        </div>

        {/* TAB NAVIGATION & CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-700/40">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#040812] border border-slate-800 text-[10px]">
            <button
              onClick={() => setActiveTab("peaks")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "peaks"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Peak List & Scherrer ({detectedPeaks.length})
            </button>
            <button
              onClick={() => setActiveTab("williamsonHall")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "williamsonHall"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Williamson-Hall Plot
            </button>
            <button
              onClick={() => setActiveTab("reflections")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "reflections"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Table className="w-3 h-3 text-indigo-400" />
              Indexed (hkl) Table
            </button>
            {activeCandidates.length > 1 && (
              <button
                onClick={() => setActiveTab("phases")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "phases"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3 h-3 text-purple-400" />
                Phase Mixture Fractions ({activeCandidates.length})
              </button>
            )}
          </div>

          {/* Actions & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(activeTab === "peaks" || activeTab === "reflections") && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter 2θ, d-spacing, (hkl)..."
                  className="pl-8 pr-3 py-1 bg-[#040812] border border-slate-700/80 rounded-xl text-[10px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
                />
              </div>
            )}

            <button
              onClick={handleExportPeaksCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold transition-all"
            >
              <FileSpreadsheet className="w-3 h-3" />
              Export CSV
            </button>

            <button
              onClick={handleCopyPeaksSummary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-bold transition-all"
            >
              {copiedNotification ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
              {copiedNotification ? "Copied!" : "Copy Report"}
            </button>
          </div>
        </div>

        {/* INSTRUMENTAL RESOLUTION & SHAPE FACTOR TUNING BAR */}
        <div className={`p-3 rounded-xl border mb-4 text-[10px] flex flex-wrap items-center justify-between gap-4 ${
          themeMode === "publication" ? "bg-slate-50 border-slate-200" : "bg-[#050914] border-slate-800"
        }`}>
          <div className="flex flex-wrap items-center gap-6">
            {/* Instrumental FWHM Slider */}
            <div className="flex items-center gap-3">
              <span className="text-slate-400 uppercase font-bold text-[9px]">
                Instrumental Broadening (β_inst):
              </span>
              <input
                type="range"
                min="0.02"
                max="0.20"
                step="0.01"
                value={instrumentalFwhm}
                onChange={(e) => onInstrumentalFwhmChange(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="font-bold text-cyan-300">{instrumentalFwhm.toFixed(2)}° 2θ</span>
              <span className="text-slate-500 text-[8px]">(NIST SRM 660 / 640 standard)</span>
            </div>

            {/* Shape Factor K */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase font-bold text-[9px]">Scherrer K:</span>
              <select
                value={shapeFactorK}
                onChange={(e) => onShapeFactorKChange(parseFloat(e.target.value))}
                className="bg-[#0A101C] border border-slate-700 rounded-lg px-2 py-0.5 text-cyan-300 font-bold text-[10px] cursor-pointer"
              >
                <option value={0.94}>0.94 (Cubic / Spherical)</option>
                <option value={0.89}>0.89 (General Spherical)</option>
                <option value={1.0}>1.00 (Platelet / Hexagonal)</option>
                <option value={0.84}>0.84 (Octahedral)</option>
              </select>
            </div>

            {/* Peak Prominence Threshold */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase font-bold text-[9px]">Prominence:</span>
              <select
                value={minProminencePct}
                onChange={(e) => onMinProminenceChange(parseFloat(e.target.value))}
                className="bg-[#0A101C] border border-slate-700 rounded-lg px-2 py-0.5 text-cyan-300 font-bold text-[10px] cursor-pointer"
              >
                <option value={1.5}>1.5% (High Sensitivity)</option>
                <option value={2.5}>2.5% (Recommended)</option>
                <option value={5.0}>5.0% (Major Peaks Only)</option>
                <option value={10.0}>10.0% (Dominant Peaks)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TAB CONTENT 1: PEAK LIST & SCHERRER TABLE */}
        {activeTab === "peaks" && (
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] bg-[#050914] sticky top-0 z-10">
                  <th className="py-2.5 px-3">2θ Angle (°)</th>
                  <th className="py-2.5 px-3">d-spacing (Å)</th>
                  <th className="py-2.5 px-3">Miller (hkl)</th>
                  <th className="py-2.5 px-3">Obs FWHM (°)</th>
                  <th className="py-2.5 px-3">Sample FWHM (°)</th>
                  <th className="py-2.5 px-3">Scherrer Size (nm)</th>
                  <th className="py-2.5 px-3">Microstrain (%)</th>
                  <th className="py-2.5 px-3">Height (cps)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPeaks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No peaks detected with the current prominence threshold ({minProminencePct}%). Try lowering the prominence threshold.
                    </td>
                  </tr>
                ) : (
                  filteredPeaks.map((p) => {
                    const isFocused = focusedTwoTheta === p.twoTheta;
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-cyan-500/10 transition-colors ${
                          isFocused ? "bg-cyan-500/20 font-bold" : ""
                        }`}
                      >
                        <td className="py-2 px-3 text-cyan-300 font-bold font-mono">
                          {p.twoTheta.toFixed(2)}°
                        </td>
                        <td className="py-2 px-3 text-emerald-300 font-mono">
                          {p.dSpacing.toFixed(4)} Å
                        </td>
                        <td className="py-2 px-3">
                          {p.matchedHkl ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                              ({p.matchedHkl})
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-mono">
                          {p.fwhmObs.toFixed(3)}°
                        </td>
                        <td className="py-2 px-3 text-indigo-300 font-mono">
                          {p.fwhmSample.toFixed(3)}°
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-cyan-300">
                          {p.crystalliteSizeNm.toFixed(1)} nm
                        </td>
                        <td className="py-2 px-3 font-mono text-amber-300">
                          {p.microstrainPct.toFixed(3)}%
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-mono">
                          {p.intensity.toFixed(0)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                onFocusPeak(p.twoTheta);
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[9px] font-bold"
                            >
                              Focus
                            </button>
                            {onSendToCaliper && (
                              <button
                                onClick={() => {
                                  const calPt: CaliperPoint = {
                                    twoTheta: p.twoTheta,
                                    intensity: p.intensity,
                                    dSpacing: p.dSpacing,
                                    q: p.qVector,
                                  };
                                  if (!selectedPeakIdForCaliper) {
                                    setSelectedPeakIdForCaliper(p.id);
                                    onSendToCaliper(calPt);
                                  } else {
                                    setSelectedPeakIdForCaliper(null);
                                    onSendToCaliper(calPt);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded border text-[9px] font-bold transition-all ${
                                  selectedPeakIdForCaliper === p.id
                                    ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                                    : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                                }`}
                                title="Send point to Caliper tool"
                              >
                                {selectedPeakIdForCaliper === p.id ? "Point A Locked" : "Caliper"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT 2: WILLIAMSON-HALL ANALYSIS PLOT */}
        {activeTab === "williamsonHall" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#050914] p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
                  Williamson-Hall Plot: β* = (Kλ/τ) + 4ε·sinθ
                </span>
              </div>
              {williamsonHall && (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-slate-300">
                    <span className="text-slate-500">Fit Equation: </span>
                    <span className="font-bold text-emerald-400">{williamsonHall.equation}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">R² Fit: </span>
                    <span className="font-bold text-cyan-400">{williamsonHall.rSquared}</span>
                  </div>
                </div>
              )}
            </div>

            {/* SVG PLOT VIEWPORT */}
            <div className={`w-full h-80 rounded-2xl border p-4 relative flex flex-col justify-between overflow-hidden ${
              themeMode === "publication" ? "bg-white border-slate-300" : "bg-[#040812] border-slate-800"
            }`}>
              {(!williamsonHall || williamsonHall.points.length < 2) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <Atom className="w-10 h-10 text-slate-600 mb-2 animate-spin" />
                  <p className="text-xs uppercase font-bold">Insufficient Peaks for Williamson-Hall Regression</p>
                  <p className="text-[10px] text-slate-600 mt-1">At least 2 resolved diffraction peaks required.</p>
                </div>
              ) : (
                (() => {
                  const pts = williamsonHall.points;
                  const minX = Math.min(...pts.map((p) => p.x));
                  const maxX = Math.max(...pts.map((p) => p.x));
                  const minY = Math.min(...pts.map((p) => p.y));
                  const maxY = Math.max(...pts.map((p) => p.y));

                  const padX = Math.max(0.1, (maxX - minX) * 0.15);
                  const padY = Math.max(0.1, (maxY - minY) * 0.2);

                  const plotMinX = Math.max(0, minX - padX);
                  const plotMaxX = maxX + padX;
                  const plotMinY = Math.max(0, minY - padY);
                  const plotMaxY = maxY + padY;

                  const width = 760;
                  const height = 280;
                  const marginLeft = 60;
                  const marginRight = 30;
                  const marginTop = 20;
                  const marginBottom = 40;

                  const plotW = width - marginLeft - marginRight;
                  const plotH = height - marginTop - marginBottom;

                  const scaleX = (val: number) => marginLeft + ((val - plotMinX) / (plotMaxX - plotMinX)) * plotW;
                  const scaleY = (val: number) => marginTop + plotH - ((val - plotMinY) / (plotMaxY - plotMinY)) * plotH;

                  // Regression line endpoints
                  const lineX1 = plotMinX;
                  const lineY1 = (williamsonHall.slope * lineX1 + williamsonHall.intercept) * 1000;
                  const lineX2 = plotMaxX;
                  const lineY2 = (williamsonHall.slope * lineX2 + williamsonHall.intercept) * 1000;

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={marginTop + plotH} stroke="#334155" strokeWidth={1} />
                      <line x1={marginLeft} y1={marginTop + plotH} x2={marginLeft + plotW} y2={marginTop + plotH} stroke="#334155" strokeWidth={1} />

                      {/* Y-axis Ticks */}
                      {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const yVal = plotMinY + frac * (plotMaxY - plotMinY);
                        const py = scaleY(yVal);
                        return (
                          <g key={`ytick-${idx}`}>
                            <line x1={marginLeft - 4} y1={py} x2={marginLeft + plotW} y2={py} stroke="#1e293b" strokeDasharray="3 3" />
                            <text x={marginLeft - 8} y={py + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                              {yVal.toFixed(2)}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis Ticks */}
                      {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const xVal = plotMinX + frac * (plotMaxX - plotMinX);
                        const px = scaleX(xVal);
                        return (
                          <g key={`xtick-${idx}`}>
                            <line x1={px} y1={marginTop} x2={px} y2={marginTop + plotH + 4} stroke="#1e293b" strokeDasharray="3 3" />
                            <text x={px} y={marginTop + plotH + 16} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                              {xVal.toFixed(2)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Fitted Regression Line */}
                      <line
                        x1={scaleX(lineX1)}
                        y1={scaleY(lineY1)}
                        x2={scaleX(lineX2)}
                        y2={scaleY(lineY2)}
                        stroke="#10b981"
                        strokeWidth={2.5}
                        strokeDasharray="4 2"
                      />

                      {/* Data Points */}
                      {pts.map((p, idx) => {
                        const cx = scaleX(p.x);
                        const cy = scaleY(p.y);
                        return (
                          <g key={`pt-${idx}`} className="group/wh cursor-pointer">
                            <circle cx={cx} cy={cy} r={5} fill="#06b6d4" stroke="#ffffff" strokeWidth={1.5} />
                            {p.hkl && (
                              <text x={cx} y={cy - 9} textAnchor="middle" fill="#22d3ee" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                ({p.hkl})
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Axis Titles */}
                      <text
                        x={marginLeft + plotW / 2}
                        y={height - 8}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        Scattering Vector: s = 4·sin(θ)
                      </text>
                      <text
                        x={16}
                        y={marginTop + plotH / 2}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        transform={`rotate(-90 16 ${marginTop + plotH / 2})`}
                      >
                        Reduced Breadth: β* = β_sample · cos(θ) [10⁻³ rad]
                      </text>
                    </svg>
                  );
                })()
              )}
            </div>

            {/* Explanation card */}
            <div className="text-[10px] text-slate-400 bg-[#050914] p-3 rounded-xl border border-slate-800 leading-relaxed font-sans">
              <span className="font-bold text-slate-200">Interpretation: </span>
              In the Williamson-Hall plot, peak broadening due to small crystallite size is angle-independent along the y-intercept (<code className="text-emerald-300 font-mono">c = Kλ / τ</code>), whereas broadening due to lattice microstrain scales linearly with diffraction angle (<code className="text-purple-300 font-mono">slope m = ε</code>). A positive slope indicates tensile lattice microstrain, while near-zero slope indicates pure size-broadened strain-free crystallites.
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: INDEXED REFERENCE REFLECTIONS */}
        {activeTab === "reflections" && (
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] bg-[#050914] sticky top-0 z-10">
                  <th className="py-2.5 px-3">Miller (hkl)</th>
                  <th className="py-2.5 px-3">Calibrated 2θ (°)</th>
                  <th className="py-2.5 px-3">Nominal 2θ (°)</th>
                  <th className="py-2.5 px-3">d-spacing (Å)</th>
                  <th className="py-2.5 px-3">Relative I (%)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredReflections.map((ref, idx) => (
                  <tr
                    key={`ref-${idx}`}
                    className={`hover:bg-indigo-500/10 transition-colors ${
                      focusedTwoTheta === ref.twoTheta ? "bg-indigo-500/20 font-bold" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-rose-300 font-mono">
                      {ref.hkl ? `(${ref.hkl})` : "—"}
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-bold font-mono">{ref.twoTheta.toFixed(2)}°</td>
                    <td className="py-2 px-3 text-slate-400 font-mono">{ref.originalRefT.toFixed(2)}°</td>
                    <td className="py-2 px-3 text-emerald-300 font-mono">{ref.dSpacing.toFixed(4)} Å</td>
                    <td className="py-2 px-3 text-slate-200 font-mono">{ref.rawRefIntensity.toFixed(0)}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onFocusPeak(ref.twoTheta)}
                        className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[9px] font-bold"
                      >
                        Focus Peak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT 4: PHASE MIXTURE FRACTIONS & NNLS SOLVER */}
        {activeTab === "phases" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#050914] p-3 rounded-xl border border-slate-800">
              <div>
                <span className="font-bold text-purple-300 text-xs uppercase tracking-wider block">
                  Quantitative Phase Weight Fractions (NNLS Optimization)
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Optimize mixing proportions of active crystallographic phases against observed pattern.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onNormalizePhaseFractions && (
                  <button
                    onClick={onNormalizePhaseFractions}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Normalize to 100%
                  </button>
                )}
                {onAutoFitPhaseFractions && (
                  <button
                    onClick={onAutoFitPhaseFractions}
                    disabled={isOptimizingFractions}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold shadow-lg transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isOptimizingFractions ? "animate-spin" : ""}`} />
                    {isOptimizingFractions ? "Optimizing..." : "Auto-Fit Fractions (NNLS)"}
                  </button>
                )}
              </div>
            </div>

            {phaseFractionsOptimizationStatus && (
              <div className="text-[10px] text-purple-300 bg-purple-950/40 border border-purple-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                {phaseFractionsOptimizationStatus}
              </div>
            )}

            {/* VISUAL PHASE FRACTION COMPOSITION BAR */}
            <div className="flex flex-col gap-1.5 bg-[#050914] p-3 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Phase Mixture Composition:
              </span>
              <div className="w-full h-4 rounded-lg overflow-hidden flex border border-slate-700 shadow-inner">
                {activeCandidates.map((cand, idx) => {
                  const w = phaseWeights[cand.phase_name] ?? 1.0;
                  const pct = totalPhaseWeight > 0 ? (w / totalPhaseWeight) * 100 : 0;
                  const colors = ["#f43f5e", "#10b981", "#f59e0b", "#a855f7", "#38bdf8"];
                  const color = colors[idx % colors.length];

                  return (
                    <div
                      key={`bar-${cand.phase_name}`}
                      style={{ width: `${pct}%`, backgroundColor: color }}
                      className="h-full relative group/pbar transition-all"
                      title={`${cand.phase_name}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                {activeCandidates.map((cand, idx) => {
                  const w = phaseWeights[cand.phase_name] ?? 1.0;
                  const pct = totalPhaseWeight > 0 ? (w / totalPhaseWeight) * 100 : 0;
                  const colors = ["#f43f5e", "#10b981", "#f59e0b", "#a855f7", "#38bdf8"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={`legend-${cand.phase_name}`} className="flex items-center gap-2 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-bold text-slate-200">{cand.phase_name}</span>
                      <span className="font-bold font-mono" style={{ color }}>{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INDIVIDUAL PHASE WEIGHT SLIDERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCandidates.map((cand) => {
                const w = phaseWeights[cand.phase_name] ?? 1.0;
                const pct = totalPhaseWeight > 0 ? (w / totalPhaseWeight) * 100 : 0;

                return (
                  <div
                    key={`weight-control-${cand.phase_name}`}
                    className="p-3 bg-[#050914] rounded-xl border border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 truncate max-w-[200px]">{cand.phase_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">Weight: {w.toFixed(2)}</span>
                        <span className="font-bold text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-[10px]">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="3.0"
                      step="0.05"
                      value={w}
                      onChange={(e) => onPhaseWeightChange(cand.phase_name, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
