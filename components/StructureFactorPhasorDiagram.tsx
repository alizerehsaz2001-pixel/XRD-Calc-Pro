import React, { useState, useMemo } from "react";
import { CrystalSystem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface StructureFactorPhasorDiagramProps {
  system: CrystalSystem;
  initialH?: number;
  initialK?: number;
  initialL?: number;
  onSelectHkl?: (h: number, k: number, l: number) => void;
}

interface BasisAtom {
  label: string;
  element: string;
  coords: [number, number, number];
  f: number;
  color: string;
}

export const StructureFactorPhasorDiagram: React.FC<StructureFactorPhasorDiagramProps> = ({
  system,
  initialH = 1,
  initialK = 1,
  initialL = 1,
  onSelectHkl,
}) => {
  const [h, setH] = useState<number>(initialH);
  const [k, setK] = useState<number>(initialK);
  const [l, setL] = useState<number>(initialL);
  const [showPhasorChain, setShowPhasorChain] = useState<boolean>(true);
  const [selectedAtomIndex, setSelectedAtomIndex] = useState<number | null>(null);

  // Sync with prop changes if initial values change
  React.useEffect(() => {
    setH(initialH);
    setK(initialK);
    setL(initialL);
  }, [initialH, initialK, initialL]);

  // Determine basis atoms for current crystal system
  const basisAtoms: BasisAtom[] = useMemo(() => {
    switch (system) {
      case "SC":
      case "Cubic":
        return [
          { label: "Corner 0", element: "M", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
        ];
      case "BCC":
      case "Tetragonal_I":
        return [
          { label: "Origin (0,0,0)", element: "M", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
          { label: "Body Center (½,½,½)", element: "M", coords: [0.5, 0.5, 0.5], f: 1.0, color: "#a855f7" },
        ];
      case "FCC":
      case "Orthorhombic_F":
        return [
          { label: "Corner (0,0,0)", element: "M", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
          { label: "Face xy (½,½,0)", element: "M", coords: [0.5, 0.5, 0], f: 1.0, color: "#34d399" },
          { label: "Face xz (½,0,½)", element: "M", coords: [0.5, 0, 0.5], f: 1.0, color: "#f59e0b" },
          { label: "Face yz (0,½,½)", element: "M", coords: [0, 0.5, 0.5], f: 1.0, color: "#ec4899" },
        ];
      case "Diamond":
        return [
          // FCC lattice basis
          { label: "FCC 1 (0,0,0)", element: "C", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
          { label: "FCC 2 (½,½,0)", element: "C", coords: [0.5, 0.5, 0], f: 1.0, color: "#34d399" },
          { label: "FCC 3 (½,0,½)", element: "C", coords: [0.5, 0, 0.5], f: 1.0, color: "#f59e0b" },
          { label: "FCC 4 (0,½,½)", element: "C", coords: [0, 0.5, 0.5], f: 1.0, color: "#ec4899" },
          // Shifted ¼,¼,¼ basis
          { label: "Tet 1 (¼,¼,¼)", element: "C", coords: [0.25, 0.25, 0.25], f: 1.0, color: "#60a5fa" },
          { label: "Tet 2 (¾,¾,¼)", element: "C", coords: [0.75, 0.75, 0.25], f: 1.0, color: "#4ade80" },
          { label: "Tet 3 (¾,¼,¾)", element: "C", coords: [0.75, 0.25, 0.75], f: 1.0, color: "#fbbf24" },
          { label: "Tet 4 (¼,¾,¾)", element: "C", coords: [0.25, 0.75, 0.75], f: 1.0, color: "#f472b6" },
        ];
      case "Hexagonal":
        return [
          { label: "Origin (0,0,0)", element: "M", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
          { label: "Interstitial (⅔,⅓,½)", element: "M", coords: [2 / 3, 1 / 3, 0.5], f: 1.0, color: "#a855f7" },
        ];
      case "Orthorhombic_C":
        return [
          { label: "Corner (0,0,0)", element: "M", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
          { label: "Base Center (½,½,0)", element: "M", coords: [0.5, 0.5, 0], f: 1.0, color: "#34d399" },
        ];
      default:
        return [
          { label: "Origin (0,0,0)", element: "M", coords: [0, 0, 0], f: 1.0, color: "#38bdf8" },
        ];
    }
  }, [system]);

  // Compute phasors for each atom
  const phasors = useMemo(() => {
    let currentX = 0;
    let currentY = 0;

    return basisAtoms.map((atom) => {
      // phase angle phi = 2*pi * (h*x + k*y + l*z)
      const dotProduct = h * atom.coords[0] + k * atom.coords[1] + l * atom.coords[2];
      const phiRad = 2 * Math.PI * dotProduct;
      const phaseDeg = ((dotProduct % 1) * 360 + 360) % 360;

      const vx = atom.f * Math.cos(phiRad);
      const vy = atom.f * Math.sin(phiRad);

      const startX = currentX;
      const startY = currentY;
      currentX += vx;
      currentY += vy;

      return {
        atom,
        dotProduct,
        phiRad,
        phaseDeg,
        vx,
        vy,
        startX,
        startY,
        endX: currentX,
        endY: currentY,
      };
    });
  }, [basisAtoms, h, k, l]);

  // Total Structure Factor
  const totalF = useMemo(() => {
    let sumReal = 0;
    let sumImag = 0;
    phasors.forEach((p) => {
      sumReal += p.vx;
      sumImag += p.vy;
    });
    // Clean near-zero floating point inaccuracies
    if (Math.abs(sumReal) < 1e-6) sumReal = 0;
    if (Math.abs(sumImag) < 1e-6) sumImag = 0;

    const magnitude = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
    const phaseRad = magnitude > 1e-6 ? Math.atan2(sumImag, sumReal) : 0;
    const phaseDeg = ((phaseRad * 180) / Math.PI + 360) % 360;
    const isAllowed = magnitude > 0.05;

    return {
      real: sumReal,
      imag: sumImag,
      magnitude,
      phaseDeg,
      isAllowed,
    };
  }, [phasors]);

  // SVG dimensions & scaling
  const size = 320;
  const center = size / 2;
  // Max possible amplitude is total basis count * 1.0
  const maxAmp = Math.max(basisAtoms.length * 1.15, 2.5);
  const scale = (center - 35) / maxAmp;

  // Convert complex coordinate (x, y) to SVG (cx, cy)
  const toSvg = (re: number, im: number) => ({
    x: center + re * scale,
    y: center - im * scale, // SVG y is downward
  });

  const handleApplyPreset = (nh: number, nk: number, nl: number) => {
    setH(nh);
    setK(nk);
    setL(nl);
    if (onSelectHkl) onSelectHkl(nh, nk, nl);
  };

  return (
    <div className="bg-[#050B14]/90 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-5 shadow-2xl relative overflow-hidden text-left font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-white tracking-wide">
              Structure Factor Argand Phasor Graphic
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual vector sum <span className="font-mono text-emerald-400 font-bold">F(hkl) = ∑ f_j · e^(i·2π·r_j·G)</span> in the complex plane ℂ
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg ${
              totalF.isAllowed
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            {totalF.isAllowed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ALLOWED (|F| = {totalF.magnitude.toFixed(2)}f)</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>FORBIDDEN (|F| = 0)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 items-start">
        {/* Left Column: Argand Diagram SVG Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#01040A] rounded-xl border border-white/10 p-3 shadow-inner relative group">
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 px-2 mb-1">
            <span className="font-bold text-slate-300">COMPLEX ARGAND PLANE</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPhasorChain(!showPhasorChain)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all ${
                  showPhasorChain
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-black/60 text-slate-400 border-white/10"
                }`}
              >
                {showPhasorChain ? "Chained Sum" : "Origin-Centered"}
              </button>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[320px] aspect-square overflow-visible"
          >
            <defs>
              {/* Arrow markers */}
              <marker
                id="phasor-arrow-f"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker
                id="phasor-arrow-atom"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
              </marker>
              <marker
                id="phasor-arrow-extinct"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#f43f5e" />
              </marker>

              {/* Radial gradient for unit circle disk */}
              <radialGradient id="argand-disk" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
                <stop offset="90%" stopColor="#020617" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
              </radialGradient>
            </defs>

            {/* Background Disk */}
            <circle
              cx={center}
              cy={center}
              r={scale * (basisAtoms.length || 1)}
              fill="url(#argand-disk)"
              stroke="#334155"
              strokeWidth="0.75"
              strokeDasharray="2 4"
            />

            {/* Unit circle reference (radius = 1f) */}
            <circle
              cx={center}
              cy={center}
              r={scale * 1.0}
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={center + scale * 1.0 + 3}
              y={center - 3}
              fill="#64748b"
              fontSize="7.5"
              fontFamily="monospace"
            >
              1f
            </text>

            {/* Axes */}
            <g stroke="#334155" strokeWidth="1">
              {/* Real Axis */}
              <line x1={15} y1={center} x2={size - 15} y2={center} />
              {/* Imaginary Axis */}
              <line x1={center} y1={15} x2={center} y2={size - 15} />
            </g>

            {/* Axis Labels */}
            <text
              x={size - 12}
              y={center - 5}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="end"
            >
              +Re
            </text>
            <text
              x={12}
              y={center - 5}
              fill="#64748b"
              fontSize="8"
              fontFamily="monospace"
            >
              -Re
            </text>
            <text
              x={center + 5}
              y={20}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              +Im
            </text>
            <text
              x={center + 5}
              y={size - 15}
              fill="#64748b"
              fontSize="8"
              fontFamily="monospace"
            >
              -Im
            </text>

            {/* Phasors */}
            {phasors.map((p, idx) => {
              const start = showPhasorChain ? toSvg(p.startX, p.startY) : toSvg(0, 0);
              const end = showPhasorChain
                ? toSvg(p.endX, p.endY)
                : toSvg(p.vx, p.vy);

              const isSelected = selectedAtomIndex === idx;

              return (
                <g key={`phasor-${idx}`} className="transition-all duration-300">
                  {/* Phasor Line */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={p.atom.color}
                    strokeWidth={isSelected ? 3 : 1.75}
                    strokeLinecap="round"
                    opacity={selectedAtomIndex !== null && !isSelected ? 0.35 : 0.9}
                  />

                  {/* Arrow Head */}
                  <circle
                    cx={end.x}
                    cy={end.y}
                    r={isSelected ? 4 : 2.5}
                    fill={p.atom.color}
                    stroke="#ffffff"
                    strokeWidth={0.75}
                  />

                  {/* Node label */}
                  <text
                    x={end.x + (end.x > center ? 5 : -5)}
                    y={end.y + (end.y > center ? 8 : -6)}
                    fill={p.atom.color}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor={end.x > center ? "start" : "end"}
                  >
                    e^(i·{Math.round(p.phaseDeg)}°)
                  </text>
                </g>
              );
            })}

            {/* Total Resultant Vector F_hkl */}
            {totalF.isAllowed ? (
              (() => {
                const origin = toSvg(0, 0);
                const end = toSvg(totalF.real, totalF.imag);
                return (
                  <g>
                    <line
                      x1={origin.x}
                      y1={origin.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.8))" }}
                    />
                    <circle
                      cx={end.x}
                      cy={end.y}
                      r="5"
                      fill="#34d399"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={end.x + (end.x >= origin.x ? 8 : -8)}
                      y={end.y + (end.y >= origin.y ? 12 : -10)}
                      fill="#34d399"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor={end.x >= origin.x ? "start" : "end"}
                    >
                      F({h}{k}{l}) = {totalF.magnitude.toFixed(1)}f
                    </text>
                  </g>
                );
              })()
            ) : (
              // Destructive cancellation indicator
              <g>
                <circle
                  cx={center}
                  cy={center}
                  r="12"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-spin"
                  style={{ animationDuration: "8s" }}
                />
                <circle cx={center} cy={center} r="3" fill="#f43f5e" />
                <text
                  x={center}
                  y={center + 24}
                  fill="#f43f5e"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  CLOSED LOOP → F = 0
                </text>
              </g>
            )}
          </svg>

          {/* Quick info legend bar */}
          <div className="w-full mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Resultant F
            </span>
            <span>{basisAtoms.length} Atomic Phasors</span>
            <span className="text-slate-500">Angle: {totalF.phaseDeg.toFixed(1)}°</span>
          </div>
        </div>

        {/* Right Column: Controls, Math Expansion & Atomic Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          {/* Index Selector */}
          <div className="bg-[#0B1221] p-3.5 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Miller Index Probe (h k l)
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">{system} Lattice</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "h", val: h, set: setH },
                { label: "k", val: k, set: setK },
                { label: "l", val: l, set: setL },
              ].map(({ label, val, set }) => (
                <div key={label} className="bg-black/60 rounded-lg p-2 border border-white/10 flex flex-col items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">{label}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nv = Math.max(-4, val - 1);
                        set(nv);
                        if (onSelectHkl) {
                          if (label === "h") onSelectHkl(nv, k, l);
                          if (label === "k") onSelectHkl(h, nv, l);
                          if (label === "l") onSelectHkl(h, k, nv);
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm text-emerald-400 w-5 text-center">{val}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nv = Math.min(4, val + 1);
                        set(nv);
                        if (onSelectHkl) {
                          if (label === "h") onSelectHkl(nv, k, l);
                          if (label === "k") onSelectHkl(h, nv, l);
                          if (label === "l") onSelectHkl(h, k, nv);
                        }
                      }}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[8.5px] font-mono text-slate-500 self-center mr-1 uppercase">Presets:</span>
              {[
                [1, 0, 0],
                [1, 1, 0],
                [1, 1, 1],
                [2, 0, 0],
                [2, 2, 0],
                [3, 1, 1],
                [2, 2, 2],
              ].map(([ph, pk, pl]) => (
                <button
                  key={`${ph}-${pk}-${pl}`}
                  type="button"
                  onClick={() => handleApplyPreset(ph, pk, pl)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                    h === ph && k === pk && l === pl
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-black/40 text-slate-400 border-white/5 hover:text-white hover:border-white/20"
                  }`}
                >
                  ({ph}{pk}{pl})
                </button>
              ))}
            </div>
          </div>

          {/* Mathematical Summation Breakdown */}
          <div className="bg-[#0B1221] p-3.5 rounded-xl border border-white/10 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Analytical Expansion
              </span>
              <span className="text-[9px] text-amber-400 font-bold">
                |F| = {totalF.magnitude.toFixed(2)}f
              </span>
            </div>

            <div className="bg-black/60 p-2.5 rounded-lg border border-white/5 text-[10px] leading-relaxed text-slate-300 overflow-x-auto custom-scrollbar">
              <span className="text-slate-500">F({h}{k}{l}) = </span>
              {phasors.map((p, idx) => {
                const isPos = idx === 0 || p.vx >= 0;
                return (
                  <span key={`math-${idx}`} className="inline-block mr-1">
                    <span style={{ color: p.atom.color }}>
                      f·e^(i·{p.phaseDeg.toFixed(0)}°)
                    </span>
                    {idx < phasors.length - 1 && <span className="text-slate-500"> + </span>}
                  </span>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-black/40 p-2 rounded border border-white/5">
                <span className="text-slate-500 block text-[8px] uppercase">Real Component ∑ Re</span>
                <span className="font-bold text-sky-400">{totalF.real.toFixed(3)} f</span>
              </div>
              <div className="bg-black/40 p-2 rounded border border-white/5">
                <span className="text-slate-500 block text-[8px] uppercase">Imaginary Component ∑ Im</span>
                <span className="font-bold text-purple-400">{totalF.imag.toFixed(3)} f</span>
              </div>
            </div>
          </div>

          {/* Atomic Basis Positions List */}
          <div className="bg-[#0B1221] p-3.5 rounded-xl border border-white/10 space-y-2 font-mono">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-white/10 pb-1.5">
              Unit Cell Atomic Basis Phases (r_j · G)
            </span>
            <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
              {phasors.map((p, idx) => (
                <div
                  key={`atom-list-${idx}`}
                  onMouseEnter={() => setSelectedAtomIndex(idx)}
                  onMouseLeave={() => setSelectedAtomIndex(null)}
                  className={`p-1.5 rounded flex items-center justify-between text-[9px] border transition-colors cursor-default ${
                    selectedAtomIndex === idx
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-black/40 border-white/5 text-slate-400 hover:bg-black/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.atom.color }}
                    />
                    <span className="font-bold text-slate-300">{p.atom.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">φ = {p.phaseDeg.toFixed(0)}°</span>
                    <span className="text-emerald-400 font-bold">
                      cos(φ) = {Math.cos(p.phiRad).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
