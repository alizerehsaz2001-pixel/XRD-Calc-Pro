import React, { useState, useMemo, useRef } from "react";
import { CrystalSystem, SelectionRuleResult } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface DiffractionRingVisualizerProps {
  system: CrystalSystem;
  results: SelectionRuleResult[];
  latticeParameter?: number;
  onSelectHkl?: (h: number, k: number, l: number) => void;
}

const ANODES = [
  { name: "Cu Kα", wavelength: 1.5406, color: "#38bdf8" },
  { name: "Mo Kα", wavelength: 0.7107, color: "#a855f7" },
  { name: "Co Kα", wavelength: 1.7890, color: "#f59e0b" },
  { name: "Cr Kα", wavelength: 2.2897, color: "#ec4899" },
];

export const DiffractionRingVisualizer: React.FC<DiffractionRingVisualizerProps> = ({
  system,
  results,
  latticeParameter = 5.431, // Default Silicon / representative lattice in Å
  onSelectHkl,
}) => {
  const [selectedAnodeIndex, setSelectedAnodeIndex] = useState<number>(0);
  const [detectorDistance, setDetectorDistance] = useState<number>(120); // mm
  const [showForbiddenRings, setShowForbiddenRings] = useState<boolean>(true);
  const [hoveredRing, setHoveredRing] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"2D_RING" | "1D_PATTERN">("2D_RING");
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const wavelength = ANODES[selectedAnodeIndex].wavelength;

  // Calculate d-spacing and 2theta for each reflection in results
  const reflectionsWithPhysics = useMemo(() => {
    return results
      .map((res) => {
        const [h, k, l] = res.hkl;
        if (h === 0 && k === 0 && l === 0) return null;

        // Calculate d-spacing based on crystal system
        let d = 0;
        const a = latticeParameter;
        if (system.startsWith("Tetragonal")) {
          const c = a * 1.35;
          const invSq = (h * h + k * k) / (a * a) + (l * l) / (c * c);
          d = invSq > 0 ? 1 / Math.sqrt(invSq) : 0;
        } else if (system.startsWith("Orthorhombic")) {
          const b = a * 1.15;
          const c = a * 1.45;
          const invSq = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
          d = invSq > 0 ? 1 / Math.sqrt(invSq) : 0;
        } else if (system === "Hexagonal") {
          const c = a * 1.633;
          const invSq = ((4 / 3) * (h * h + k * k + h * k)) / (a * a) + (l * l) / (c * c);
          d = invSq > 0 ? 1 / Math.sqrt(invSq) : 0;
        } else {
          // Cubic
          const invSq = (h * h + k * k + l * l) / (a * a);
          d = invSq > 0 ? 1 / Math.sqrt(invSq) : 0;
        }

        if (d <= 0) return null;

        // Bragg's law: lambda = 2 * d * sin(theta) => sin(theta) = lambda / (2*d)
        const sinTheta = wavelength / (2 * d);
        if (sinTheta > 1.0) {
          // Reflection is beyond the limiting sphere (not physically observable with this wavelength)
          return {
            ...res,
            d,
            twoThetaRad: 0,
            twoThetaDeg: 0,
            ringRadiusMm: 0,
            isObservable: false,
            multiplicity: 1,
            relativeIntensity: 0,
          };
        }

        const thetaRad = Math.asin(sinTheta);
        const twoThetaRad = 2 * thetaRad;
        const twoThetaDeg = (twoThetaRad * 180) / Math.PI;

        // Ring radius on flat plate detector: R = D * tan(2theta)
        const ringRadiusMm = detectorDistance * Math.tan(twoThetaRad);

        // Approximate peak multiplicity for intensity scaling
        const numZero = (h === 0 ? 1 : 0) + (k === 0 ? 1 : 0) + (l === 0 ? 1 : 0);
        const allEqual = Math.abs(h) === Math.abs(k) && Math.abs(k) === Math.abs(l);
        let mult = 6;
        if (allEqual && numZero === 0) mult = 8;
        else if (numZero === 2) mult = 6;
        else if (numZero === 1) mult = 12;
        else if (!allEqual && numZero === 0) mult = 24;

        // Lorentz-polarization factor approximation: LP = (1 + cos^2(2theta)) / (sin^2(theta) * cos(theta))
        const lp =
          (1 + Math.cos(twoThetaRad) ** 2) /
          (Math.sin(thetaRad) ** 2 * Math.cos(thetaRad) + 1e-5);
        const relIntensity = res.status === "Allowed" ? Math.min(100, Math.max(15, (mult * lp) / 15)) : 0;

        return {
          ...res,
          d,
          twoThetaRad,
          twoThetaDeg,
          ringRadiusMm,
          isObservable: true,
          multiplicity: mult,
          relativeIntensity: relIntensity,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.twoThetaDeg - b.twoThetaDeg);
  }, [results, system, latticeParameter, wavelength, detectorDistance]);

  const detectorSize = 360;
  const detectorCenter = detectorSize / 2;
  const maxDetectorRadiusMm = 110;
  const scaleMmToPx = ((detectorSize / 2 - 25) / maxDetectorRadiusMm) * zoomLevel;

  return (
    <div className="bg-[#050B14]/90 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-5 shadow-2xl relative overflow-hidden text-left font-sans">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-white tracking-wide">
              Debye-Scherrer Diffraction Pattern Graphic
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated 2D Area Detector & 1D Bragg Diffractogram for <span className="text-sky-300 font-mono font-bold">{system}</span>
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#0B1221] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("2D_RING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "2D_RING"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            2D Area Detector
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("1D_PATTERN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "1D_PATTERN"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1D Diffractogram
          </button>
        </div>
      </div>

      {/* Toolbar Options: Anode source, Detector Distance & Zoom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0B1221] p-3 rounded-xl border border-white/10 text-xs font-mono relative z-10">
        {/* Anode X-ray Target */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
            Radiation Source (λ)
          </span>
          <div className="grid grid-cols-4 gap-1">
            {ANODES.map((anode, idx) => (
              <button
                key={anode.name}
                type="button"
                onClick={() => setSelectedAnodeIndex(idx)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                  selectedAnodeIndex === idx
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                    : "bg-black/50 text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {anode.name}
              </button>
            ))}
          </div>
          <span className="text-[8.5px] text-slate-500">
            λ = {wavelength.toFixed(4)} Å
          </span>
        </div>

        {/* Detector Distance */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
              Detector Distance (D)
            </span>
            <span className="text-emerald-400 font-bold">{detectorDistance} mm</span>
          </div>
          <input
            type="range"
            min="60"
            max="250"
            step="5"
            value={detectorDistance}
            onChange={(e) => setDetectorDistance(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>60 mm</span>
            <span>250 mm</span>
          </div>
        </div>

        {/* Graphic Overlays & View Options */}
        <div className="flex flex-col justify-between gap-1.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
            Visual Overlays
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForbiddenRings(!showForbiddenRings)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-[10px] font-bold transition-all ${
                showForbiddenRings
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                  : "bg-black/40 border-white/10 text-slate-400"
              }`}
            >
              {showForbiddenRings ? <Eye className="w-3 h-3 text-rose-400" /> : <EyeOff className="w-3 h-3" />}
              <span>Extinction Ghosts</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                className="w-7 h-7 bg-black/50 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="w-7 h-7 bg-black/50 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="w-7 h-7 bg-black/50 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center text-slate-300"
                title="Reset Zoom"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Display */}
      {activeTab === "2D_RING" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* 2D Ring Area Detector Canvas SVG */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#010309] rounded-2xl border border-white/10 p-4 relative shadow-2xl overflow-hidden group">
            {/* Detector Plate Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-black to-black pointer-events-none" />

            <svg
              viewBox={`0 0 ${detectorSize} ${detectorSize}`}
              className="w-full max-w-[360px] aspect-square overflow-visible relative z-10"
            >
              <defs>
                {/* Glow filter for allowed diffraction rings */}
                <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="beamstop-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="70%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
              </defs>

              {/* Grid / Calibration rings */}
              {[25, 50, 75, 100].map((rMm) => {
                const rPx = rMm * scaleMmToPx;
                if (rPx > detectorCenter - 5) return null;
                return (
                  <g key={`grid-ring-${rMm}`} opacity="0.15">
                    <circle
                      cx={detectorCenter}
                      cy={detectorCenter}
                      r={rPx}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="0.75"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={detectorCenter + rPx + 2}
                      y={detectorCenter - 3}
                      fill="#64748b"
                      fontSize="7"
                      fontFamily="monospace"
                    >
                      {rMm}mm
                    </text>
                  </g>
                );
              })}

              {/* Detector Crosshairs */}
              <g stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.75" strokeDasharray="3 3">
                <line x1={15} y1={detectorCenter} x2={detectorSize - 15} y2={detectorCenter} />
                <line x1={detectorCenter} y1={15} x2={detectorCenter} y2={detectorSize - 15} />
              </g>

              {/* Debye-Scherrer Concentric Rings */}
              {reflectionsWithPhysics.map((ref, idx) => {
                if (!ref.isObservable) return null;
                const rPx = ref.ringRadiusMm * scaleMmToPx;
                if (rPx <= 0 || rPx > detectorCenter * 1.4) return null;

                const isAllowed = ref.status === "Allowed";
                if (!isAllowed && !showForbiddenRings) return null;

                const isHovered =
                  hoveredRing &&
                  hoveredRing.hkl[0] === ref.hkl[0] &&
                  hoveredRing.hkl[1] === ref.hkl[1] &&
                  hoveredRing.hkl[2] === ref.hkl[2];

                return (
                  <g
                    key={`ring-${ref.hkl.join("-")}-${idx}`}
                    onMouseEnter={() => setHoveredRing(ref)}
                    onMouseLeave={() => setHoveredRing(null)}
                    onClick={() => onSelectHkl && onSelectHkl(ref.hkl[0], ref.hkl[1], ref.hkl[2])}
                    className="cursor-pointer transition-all"
                  >
                    {/* Ring Path */}
                    <circle
                      cx={detectorCenter}
                      cy={detectorCenter}
                      r={rPx}
                      fill="none"
                      stroke={
                        isAllowed
                          ? isHovered
                            ? "#38bdf8"
                            : "#10b981"
                          : isHovered
                            ? "#f87171"
                            : "#ef4444"
                      }
                      strokeWidth={
                        isAllowed
                          ? isHovered
                            ? 3.5
                            : Math.max(1.2, ref.relativeIntensity / 35)
                          : isHovered
                            ? 2
                            : 1
                      }
                      strokeDasharray={isAllowed ? undefined : "3 3"}
                      opacity={
                        isAllowed
                          ? isHovered
                            ? 1.0
                            : 0.85
                          : isHovered
                            ? 0.7
                            : 0.25
                      }
                      filter={isAllowed ? "url(#ring-glow)" : undefined}
                    />

                    {/* Ring Label Callout (displayed on 45-degree ray) */}
                    {rPx < detectorCenter - 15 && (
                      <g opacity={isHovered ? 1.0 : 0.6}>
                        <text
                          x={detectorCenter + rPx * 0.707 + 4}
                          y={detectorCenter - rPx * 0.707 - 2}
                          fill={isAllowed ? (isHovered ? "#38bdf8" : "#34d399") : "#f87171"}
                          fontSize={isHovered ? "9" : "7.5"}
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ({ref.hkl.join("")})
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Central Direct Beam Stop */}
              <circle
                cx={detectorCenter}
                cy={detectorCenter}
                r="9"
                fill="url(#beamstop-grad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                style={{ filter: "drop-shadow(0 0 6px rgba(56,189,248,0.6))" }}
              />
              <circle cx={detectorCenter} cy={detectorCenter} r="2" fill="#fff" />
              <text
                x={detectorCenter}
                y={detectorCenter + 17}
                fill="#38bdf8"
                fontSize="7"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                DIRECT BEAM
              </text>
            </svg>

            {/* Bottom Overlay Info */}
            <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Allowed Rings (Solid)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Extinguished (Dashed)
              </span>
              <span className="text-slate-500">2θ Horizon: 90°</span>
            </div>
          </div>

          {/* Ring Reflection Data & Hover Inspector */}
          <div className="lg:col-span-5 space-y-3">
            {/* Live Hover Inspector Card */}
            <div className="bg-[#0B1221] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Diffraction Peak Inspector
                </span>
                {hoveredRing ? (
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      hoveredRing.status === "Allowed"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {hoveredRing.status.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-500">Hover any ring</span>
                )}
              </div>

              {hoveredRing ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Miller Indices (h k l):</span>
                    <span className="text-base font-bold text-white">
                      ({hoveredRing.hkl.join(" ")})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-slate-500 block text-[8px] uppercase">Bragg Angle 2θ</span>
                      <span className="text-sky-400 font-bold">{hoveredRing.twoThetaDeg.toFixed(2)}°</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-slate-500 block text-[8px] uppercase">d-Spacing</span>
                      <span className="text-emerald-400 font-bold">{hoveredRing.d.toFixed(3)} Å</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-slate-500 block text-[8px] uppercase">Detector Radius</span>
                      <span className="text-purple-400 font-bold">{hoveredRing.ringRadiusMm.toFixed(1)} mm</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-slate-500 block text-[8px] uppercase">Multiplicity</span>
                      <span className="text-amber-400 font-bold">{hoveredRing.multiplicity}x</span>
                    </div>
                  </div>
                  <div className="p-2 bg-black/60 rounded border border-white/5 text-[9.5px] text-slate-300 italic">
                    {hoveredRing.reason}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs font-mono">
                  Move your cursor over the concentric rings on the detector plate to inspect physical scattering details.
                </div>
              )}
            </div>

            {/* List of Observable Reflections */}
            <div className="bg-[#0B1221] p-3.5 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest block border-b border-white/10 pb-1.5">
                Observed Peak Sequence (Low → High 2θ)
              </span>
              <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {reflectionsWithPhysics.map((ref, idx) => {
                  const isAllowed = ref.status === "Allowed";
                  if (!isAllowed && !showForbiddenRings) return null;

                  return (
                    <div
                      key={`list-ref-${ref.hkl.join("-")}-${idx}`}
                      onMouseEnter={() => setHoveredRing(ref)}
                      onMouseLeave={() => setHoveredRing(null)}
                      onClick={() => onSelectHkl && onSelectHkl(ref.hkl[0], ref.hkl[1], ref.hkl[2])}
                      className={`p-1.5 rounded flex items-center justify-between text-[9px] font-mono border transition-colors cursor-pointer ${
                        hoveredRing && hoveredRing.hkl.join("-") === ref.hkl.join("-")
                          ? "bg-white/10 border-white/30 text-white"
                          : isAllowed
                            ? "bg-emerald-950/20 border-emerald-500/20 text-slate-300 hover:bg-emerald-900/30"
                            : "bg-rose-950/20 border-rose-500/20 text-slate-400 hover:bg-rose-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isAllowed ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                        <span className="font-bold">({ref.hkl.join(" ")})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">2θ = {ref.isObservable ? `${ref.twoThetaDeg.toFixed(1)}°` : "N/A"}</span>
                        <span className="text-slate-500">d = {ref.d.toFixed(2)}Å</span>
                        <span
                          className={`font-bold uppercase text-[8px] ${
                            isAllowed ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {ref.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 1D Diffractogram Spectrum Graphic */
        <div className="space-y-4">
          <div className="bg-[#010309] p-4 rounded-xl border border-white/10 relative">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="font-bold text-slate-300">1D POWDER DIFFRACTION SPECTRUM (BRAGG PEAKS)</span>
              <span>X-Axis: 2θ (degrees) | Y-Axis: Arbitrary Intensity (a.u.)</span>
            </div>

            {/* Diffractogram SVG */}
            <svg viewBox="0 0 700 220" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="spectrum-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((deg) => {
                const x = 50 + (deg / 90) * 620;
                return (
                  <g key={`grid-deg-${deg}`}>
                    <line x1={x} y1={20} x2={x} y2={180} stroke="#1e293b" strokeWidth="0.75" strokeDasharray="2 3" />
                    <text x={x} y={195} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      {deg}°
                    </text>
                  </g>
                );
              })}

              {/* Baseline */}
              <line x1={40} y1={180} x2={680} y2={180} stroke="#475569" strokeWidth="1.5" />
              <line x1={40} y1={20} x2={40} y2={180} stroke="#475569" strokeWidth="1.5" />

              {/* Bragg Stick Peaks */}
              {reflectionsWithPhysics.map((ref, idx) => {
                if (!ref.isObservable) return null;
                const x = 50 + (ref.twoThetaDeg / 90) * 620;
                const peakHeight = (ref.relativeIntensity / 100) * 140;
                const yPeak = 180 - peakHeight;
                const isAllowed = ref.status === "Allowed";

                const isHovered =
                  hoveredRing &&
                  hoveredRing.hkl[0] === ref.hkl[0] &&
                  hoveredRing.hkl[1] === ref.hkl[1] &&
                  hoveredRing.hkl[2] === ref.hkl[2];

                if (!isAllowed && !showForbiddenRings) return null;

                return (
                  <g
                    key={`peak-${ref.hkl.join("-")}-${idx}`}
                    onMouseEnter={() => setHoveredRing(ref)}
                    onMouseLeave={() => setHoveredRing(null)}
                    onClick={() => onSelectHkl && onSelectHkl(ref.hkl[0], ref.hkl[1], ref.hkl[2])}
                    className="cursor-pointer transition-all"
                  >
                    {/* Stick */}
                    <line
                      x1={x}
                      y1={180}
                      x2={x}
                      y2={isAllowed ? yPeak : 160}
                      stroke={isAllowed ? (isHovered ? "#38bdf8" : "#10b981") : "#f43f5e"}
                      strokeWidth={isAllowed ? (isHovered ? 3 : 2) : 1}
                      strokeDasharray={isAllowed ? undefined : "2 2"}
                      opacity={isAllowed ? 1.0 : 0.4}
                    />

                    {/* Peak Cap / Marker */}
                    {isAllowed ? (
                      <circle
                        cx={x}
                        cy={yPeak}
                        r={isHovered ? 4.5 : 3}
                        fill="#34d399"
                        stroke="#fff"
                        strokeWidth="1"
                        style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.8))" }}
                      />
                    ) : (
                      <rect x={x - 2} y={158} width="4" height="4" fill="#f43f5e" />
                    )}

                    {/* Index Label */}
                    <text
                      x={x}
                      y={isAllowed ? yPeak - 8 : 152}
                      fill={isAllowed ? (isHovered ? "#38bdf8" : "#34d399") : "#f43f5e"}
                      fontSize={isHovered ? "10" : "8"}
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ({ref.hkl.join("")})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
