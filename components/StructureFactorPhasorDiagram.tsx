import React, { useState, useMemo, useEffect, useRef } from "react";
import { CrystalSystem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Sparkles,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Pause,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Info,
  Atom,
  ChevronRight,
  Eye,
  EyeOff,
  Radio,
  ArrowRight,
  Grid,
} from "lucide-react";

export interface StructureFactorPhasorDiagramProps {
  system: CrystalSystem;
  initialH?: number;
  initialK?: number;
  initialL?: number;
  onSelectHkl?: (h: number, k: number, l: number) => void;
}

export interface BasisAtom {
  id: string;
  label: string;
  element: string;
  coords: [number, number, number];
  f: number;
  color: string;
}

export type GraphicMode = "CHAINED" | "RADIAL" | "WAVE_SUPERPOSITION";

export const StructureFactorPhasorDiagram: React.FC<StructureFactorPhasorDiagramProps> = ({
  system: initialSystem,
  initialH = 1,
  initialK = 1,
  initialL = 1,
  onSelectHkl,
}) => {
  // Active crystal system / archetype selector (allows in-diagram switching or sync with parent)
  const [selectedSystem, setSelectedSystem] = useState<string>(initialSystem);
  const [h, setH] = useState<number>(initialH);
  const [k, setK] = useState<number>(initialK);
  const [l, setL] = useState<number>(initialL);

  // Graphic display modes & options
  const [graphicMode, setGraphicMode] = useState<GraphicMode>("CHAINED");
  const [selectedAtomIndex, setSelectedAtomIndex] = useState<number | null>(null);
  const [hoveredAtomIndex, setHoveredAtomIndex] = useState<number | null>(null);
  const [showProjections, setShowProjections] = useState<boolean>(true);
  const [showUnitCircles, setShowUnitCircles] = useState<boolean>(true);
  const [showPhaseArcs, setShowPhaseArcs] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  
  // Custom Form Factor Settings
  const [formFactorMode, setFormFactorMode] = useState<"UNITY" | "ELEMENTAL" | "CUSTOM">("UNITY");
  const [customRatioF2, setCustomRatioF2] = useState<number>(0.65); // For binary structures like NaCl, ZnS

  // Dynamic Phase Time Evolution (Spinning Argand Phasors ωt)
  const [isPlayingTime, setIsPlayingTime] = useState<boolean>(false);
  const [timePhaseRad, setTimePhaseRad] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Synchronize when props change
  useEffect(() => {
    setSelectedSystem(initialSystem);
  }, [initialSystem]);

  useEffect(() => {
    setH(initialH);
    setK(initialK);
    setL(initialL);
  }, [initialH, initialK, initialL]);

  // Dynamic spinning animation loop
  useEffect(() => {
    if (!isPlayingTime) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // 1 full rotation every 3.5 seconds
      setTimePhaseRad((prev) => (prev + delta * ((2 * Math.PI) / 3.5)) % (2 * Math.PI));
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlayingTime]);

  // Determine basis atoms for current crystal system / archetype
  const basisAtoms: BasisAtom[] = useMemo(() => {
    const f1 = 1.0;
    const f2 = formFactorMode === "UNITY" ? 1.0 : formFactorMode === "CUSTOM" ? customRatioF2 : 0.65;
    const f3 = formFactorMode === "UNITY" ? 1.0 : formFactorMode === "CUSTOM" ? customRatioF2 * 0.5 : 0.45;

    switch (selectedSystem) {
      case "SC":
      case "Cubic":
        return [
          { id: "sc-0", label: "Corner (0, 0, 0)", element: "M", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
        ];

      case "BCC":
      case "Tetragonal_I":
        return [
          { id: "bcc-0", label: "Corner (0, 0, 0)", element: "M", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          { id: "bcc-1", label: "Body Center (½, ½, ½)", element: "M", coords: [0.5, 0.5, 0.5], f: f1, color: "#a855f7" },
        ];

      case "FCC":
      case "Orthorhombic_F":
        return [
          { id: "fcc-0", label: "Corner (0, 0, 0)", element: "M", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          { id: "fcc-1", label: "Face xy (½, ½, 0)", element: "M", coords: [0.5, 0.5, 0], f: f1, color: "#34d399" },
          { id: "fcc-2", label: "Face xz (½, 0, ½)", element: "M", coords: [0.5, 0, 0.5], f: f1, color: "#f59e0b" },
          { id: "fcc-3", label: "Face yz (0, ½, ½)", element: "M", coords: [0, 0.5, 0.5], f: f1, color: "#ec4899" },
        ];

      case "Diamond":
        return [
          // FCC lattice basis
          { id: "dia-0", label: "FCC 1 (0, 0, 0)", element: "C", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          { id: "dia-1", label: "FCC 2 (½, ½, 0)", element: "C", coords: [0.5, 0.5, 0], f: f1, color: "#34d399" },
          { id: "dia-2", label: "FCC 3 (½, 0, ½)", element: "C", coords: [0.5, 0, 0.5], f: f1, color: "#f59e0b" },
          { id: "dia-3", label: "FCC 4 (0, ½, ½)", element: "C", coords: [0, 0.5, 0.5], f: f1, color: "#ec4899" },
          // Tetrahedral shifted basis (+¼, +¼, +¼)
          { id: "dia-4", label: "Tet 1 (¼, ¼, ¼)", element: "C", coords: [0.25, 0.25, 0.25], f: f1, color: "#60a5fa" },
          { id: "dia-5", label: "Tet 2 (¾, ¾, ¼)", element: "C", coords: [0.75, 0.75, 0.25], f: f1, color: "#4ade80" },
          { id: "dia-6", label: "Tet 3 (¾, ¼, ¾)", element: "C", coords: [0.75, 0.25, 0.75], f: f1, color: "#fbbf24" },
          { id: "dia-7", label: "Tet 4 (¼, ¾, ¾)", element: "C", coords: [0.25, 0.75, 0.75], f: f1, color: "#f472b6" },
        ];

      case "NaCl_Rocksalt":
        return [
          // Na atoms at FCC sites
          { id: "nacl-na0", label: "Na Corner (0, 0, 0)", element: "Na⁺", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          { id: "nacl-na1", label: "Na Face xy (½, ½, 0)", element: "Na⁺", coords: [0.5, 0.5, 0], f: f1, color: "#38bdf8" },
          { id: "nacl-na2", label: "Na Face xz (½, 0, ½)", element: "Na⁺", coords: [0.5, 0, 0.5], f: f1, color: "#38bdf8" },
          { id: "nacl-na3", label: "Na Face yz (0, ½, ½)", element: "Na⁺", coords: [0, 0.5, 0.5], f: f1, color: "#38bdf8" },
          // Cl atoms at Octahedral edge/body centers
          { id: "nacl-cl0", label: "Cl Body (½, ½, ½)", element: "Cl⁻", coords: [0.5, 0.5, 0.5], f: f2, color: "#a855f7" },
          { id: "nacl-cl1", label: "Cl Edge x (½, 0, 0)", element: "Cl⁻", coords: [0.5, 0, 0], f: f2, color: "#a855f7" },
          { id: "nacl-cl2", label: "Cl Edge y (0, ½, 0)", element: "Cl⁻", coords: [0, 0.5, 0], f: f2, color: "#a855f7" },
          { id: "nacl-cl3", label: "Cl Edge z (0, 0, ½)", element: "Cl⁻", coords: [0, 0, 0.5], f: f2, color: "#a855f7" },
        ];

      case "ZnS_Zincblende":
        return [
          // Zn at FCC
          { id: "zns-zn0", label: "Zn (0, 0, 0)", element: "Zn", coords: [0, 0, 0], f: f1, color: "#34d399" },
          { id: "zns-zn1", label: "Zn (½, ½, 0)", element: "Zn", coords: [0.5, 0.5, 0], f: f1, color: "#34d399" },
          { id: "zns-zn2", label: "Zn (½, 0, ½)", element: "Zn", coords: [0.5, 0, 0.5], f: f1, color: "#34d399" },
          { id: "zns-zn3", label: "Zn (0, ½, ½)", element: "Zn", coords: [0, 0.5, 0.5], f: f1, color: "#34d399" },
          // S at 4 tetrahedral positions
          { id: "zns-s0", label: "S (¼, ¼, ¼)", element: "S", coords: [0.25, 0.25, 0.25], f: f2, color: "#fbbf24" },
          { id: "zns-s1", label: "S (¾, ¾, ¼)", element: "S", coords: [0.75, 0.75, 0.25], f: f2, color: "#fbbf24" },
          { id: "zns-s2", label: "S (¾, ¼, ¾)", element: "S", coords: [0.75, 0.25, 0.75], f: f2, color: "#fbbf24" },
          { id: "zns-s3", label: "S (¼, ¾, ¾)", element: "S", coords: [0.25, 0.75, 0.75], f: f2, color: "#fbbf24" },
        ];

      case "Perovskite":
        return [
          // A-site (Sr at corner)
          { id: "perov-a", label: "A-site Sr (0, 0, 0)", element: "Sr", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          // B-site (Ti at body center)
          { id: "perov-b", label: "B-site Ti (½, ½, ½)", element: "Ti", coords: [0.5, 0.5, 0.5], f: f2, color: "#f59e0b" },
          // X-site (O at 3 face centers)
          { id: "perov-o1", label: "O1 Face (½, ½, 0)", element: "O", coords: [0.5, 0.5, 0], f: f3, color: "#f43f5e" },
          { id: "perov-o2", label: "O2 Face (½, 0, ½)", element: "O", coords: [0.5, 0, 0.5], f: f3, color: "#f43f5e" },
          { id: "perov-o3", label: "O3 Face (0, ½, ½)", element: "O", coords: [0, 0.5, 0.5], f: f3, color: "#f43f5e" },
        ];

      case "Hexagonal":
        return [
          { id: "hex-0", label: "Origin (0, 0, 0)", element: "M", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          { id: "hex-1", label: "Interstitial (⅔, ⅓, ½)", element: "M", coords: [2 / 3, 1 / 3, 0.5], f: f1, color: "#a855f7" },
        ];

      case "Orthorhombic_C":
      case "Monoclinic":
        return [
          { id: "ortho-0", label: "Corner (0, 0, 0)", element: "M", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
          { id: "ortho-1", label: "Base Center (½, ½, 0)", element: "M", coords: [0.5, 0.5, 0], f: f1, color: "#34d399" },
        ];

      default:
        return [
          { id: "def-0", label: "Origin (0, 0, 0)", element: "M", coords: [0, 0, 0], f: f1, color: "#38bdf8" },
        ];
    }
  }, [selectedSystem, formFactorMode, customRatioF2]);

  // Compute individual atom phasors
  const phasors = useMemo(() => {
    let currentX = 0;
    let currentY = 0;

    return basisAtoms.map((atom, index) => {
      // Phase angle: phi = 2*pi * (h*x + k*y + l*z) - omega*t
      const dotProduct = h * atom.coords[0] + k * atom.coords[1] + l * atom.coords[2];
      const basePhiRad = 2 * Math.PI * dotProduct;
      const totalPhiRad = basePhiRad + timePhaseRad;
      
      const phaseDeg = ((dotProduct % 1) * 360 + 360) % 360;
      const totalPhaseDeg = (((totalPhiRad * 180) / Math.PI) % 360 + 360) % 360;

      const vx = atom.f * Math.cos(totalPhiRad);
      const vy = atom.f * Math.sin(totalPhiRad);

      const startX = currentX;
      const startY = currentY;
      currentX += vx;
      currentY += vy;

      return {
        index,
        atom,
        dotProduct,
        basePhiRad,
        totalPhiRad,
        phaseDeg,
        totalPhaseDeg,
        vx,
        vy,
        startX,
        startY,
        endX: currentX,
        endY: currentY,
      };
    });
  }, [basisAtoms, h, k, l, timePhaseRad]);

  // Total Structure Factor Resultant Vector
  const totalF = useMemo(() => {
    let sumReal = 0;
    let sumImag = 0;
    phasors.forEach((p) => {
      sumReal += p.vx;
      sumImag += p.vy;
    });

    // Clean floating point noise near zero
    if (Math.abs(sumReal) < 1e-5) sumReal = 0;
    if (Math.abs(sumImag) < 1e-5) sumImag = 0;

    const magnitude = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
    const phaseRad = magnitude > 1e-5 ? Math.atan2(sumImag, sumReal) : 0;
    const phaseDeg = ((phaseRad * 180) / Math.PI + 360) % 360;
    const isAllowed = magnitude > 0.05;
    const intensity = magnitude * magnitude;

    return {
      real: sumReal,
      imag: sumImag,
      magnitude,
      phaseRad,
      phaseDeg,
      isAllowed,
      intensity,
    };
  }, [phasors]);

  // Extinction Explanation Text Generator
  const extinctionExplanation = useMemo(() => {
    const sumIndices = h + k + l;
    const isEvenSum = sumIndices % 2 === 0;
    const hEven = Math.abs(h) % 2 === 0;
    const kEven = Math.abs(k) % 2 === 0;
    const lEven = Math.abs(l) % 2 === 0;
    const isUnmixed = (hEven && kEven && lEven) || (!hEven && !kEven && !lEven);

    switch (selectedSystem) {
      case "SC":
      case "Cubic":
        return {
          title: "Simple Cubic (Primitive P)",
          rule: "All (h k l) reflections are allowed.",
          reason: "Primitive unit cell contains only 1 lattice point at (0,0,0). No destructive interference between multiple basis atoms occurs.",
          status: "ALLOWED",
        };

      case "BCC":
      case "Tetragonal_I":
        if (isEvenSum) {
          return {
            title: "BCC Centering: Constructive Reflection",
            rule: "h + k + l = 2n (Even Sum)",
            reason: `Indices sum h+k+l = ${sumIndices} (even). The body-centered atom (½,½,½) has phase φ = π·(${sumIndices}) = ${sumIndices}π, which is in-phase (+1) with the corner atom (0,0,0). Result: F = 2f (constructive interference).`,
            status: "ALLOWED",
          };
        } else {
          return {
            title: "BCC Centering: Systematic Extinction",
            rule: "h + k + l = 2n+1 (Odd Sum)",
            reason: `Indices sum h+k+l = ${sumIndices} (odd). The body-centered atom is out-of-phase by exactly 180° (e^(iπ) = -1) relative to corner atom. The two equal phasors cancel out completely (1 + (-1) = 0).`,
            status: "FORBIDDEN",
          };
        }

      case "FCC":
      case "Orthorhombic_F":
        if (isUnmixed) {
          return {
            title: "FCC Centering: Constructive Reflection",
            rule: "h, k, l Unmixed (All Even or All Odd)",
            reason: `Indices (${h}, ${k}, ${l}) have uniform parity. The phase shifts for face-centered atoms are all integer multiples of 2π. All 4 atomic phasors align in the same direction: F = 4f.`,
            status: "ALLOWED",
          };
        } else {
          return {
            title: "FCC Centering: Systematic Extinction",
            rule: "h, k, l Mixed Parity",
            reason: `Indices (${h}, ${k}, ${l}) have mixed even/odd parities. Two face-centered phasors have phase 0° and two have phase 180°, forming a closed square loop in the Argand plane that cancels to F = 0.`,
            status: "FORBIDDEN",
          };
        }

      case "Diamond":
        if (!isUnmixed) {
          return {
            title: "Diamond Lattice: FCC Centering Extinction",
            rule: "h, k, l Mixed Parity",
            reason: "Diamond is based on an FCC Bravais lattice. Mixed parity reflections cancel at the underlying FCC lattice level (F_FCC = 0).",
            status: "FORBIDDEN",
          };
        } else if (!hEven && !kEven && !lEven) {
          return {
            title: "Diamond Lattice: All-Odd Allowed Reflection",
            rule: "h, k, l All Odd",
            reason: `All indices are odd. The FCC basis produces F_FCC = 4f, and the tetrahedral shift factor (1 + e^(i·π/2·(${sumIndices}))) gives |F| = 4√2 f ≈ ${(4 * Math.SQRT2).toFixed(2)}f.`,
            status: "ALLOWED",
          };
        } else if (isEvenSum && sumIndices % 4 === 0) {
          return {
            title: "Diamond Lattice: All-Even Allowed Reflection",
            rule: "h, k, l All Even & h+k+l = 4n",
            reason: `Indices sum h+k+l = ${sumIndices} (multiple of 4). Both FCC and tetrahedral sublattices interfere constructively: F = 8f.`,
            status: "ALLOWED",
          };
        } else {
          return {
            title: "Diamond Lattice: All-Even Extinction",
            rule: "h, k, l All Even & h+k+l = 4n+2",
            reason: `Indices sum h+k+l = ${sumIndices} (4n+2). The tetrahedral sublattice shift e^(i·π/2·(${sumIndices})) = e^(i·π·odd) = -1, which destructively cancels the FCC sublattice: F = 4f(1 - 1) = 0.`,
            status: "FORBIDDEN",
          };
        }

      case "NaCl_Rocksalt":
        if (isUnmixed) {
          if (hEven && kEven && lEven) {
            return {
              title: "Rocksalt: All-Even Fundamental Reflection",
              rule: "h, k, l All Even",
              reason: "Na⁺ and Cl⁻ sublattices scatter in-phase. Structure factor amplitude is F = 4(f_Na + f_Cl). Very strong diffraction peak.",
              status: "ALLOWED",
            };
          } else {
            return {
              title: "Rocksalt: All-Odd Difference Reflection",
              rule: "h, k, l All Odd",
              reason: "Na⁺ and Cl⁻ sublattices are 180° out-of-phase. Structure factor amplitude is F = 4(f_Na - f_Cl). Peak intensity depends directly on difference in scattering power!",
              status: "ALLOWED",
            };
          }
        } else {
          return {
            title: "Rocksalt: Mixed Parity Extinction",
            rule: "h, k, l Mixed Parity",
            reason: "FCC centering causes destructive cancellation within both Na⁺ and Cl⁻ sublattices independently: F = 0.",
            status: "FORBIDDEN",
          };
        }

      default:
        return {
          title: `${selectedSystem} System`,
          rule: totalF.isAllowed ? "Constructive Reflection" : "Extinction / Destructive Cancellation",
          reason: totalF.isAllowed
            ? `Phasor sum yields non-zero amplitude |F| = ${totalF.magnitude.toFixed(2)}f.`
            : "Atomic phasors form a closed polygon in the complex plane, canceling net diffracted amplitude to zero.",
          status: totalF.isAllowed ? "ALLOWED" : "FORBIDDEN",
        };
    }
  }, [selectedSystem, h, k, l, totalF]);

  // SVG Coordinates and Dimensions
  const size = 360;
  const center = size / 2;
  // Maximum possible amplitude calculation
  const maxPossibleAmp = useMemo(() => {
    return basisAtoms.reduce((acc, a) => acc + a.f, 0);
  }, [basisAtoms]);

  // Effective plot radius scale
  const effectiveMaxAmp = Math.max(maxPossibleAmp * 1.1, 2.5) / zoomLevel;
  const scale = (center - 40) / effectiveMaxAmp;

  // Coordinate converter: Complex plane (Re, Im) -> SVG (cx, cy)
  const toSvg = (re: number, im: number) => ({
    x: center + re * scale,
    y: center - im * scale, // SVG y is downwards
  });

  const handleApplyPreset = (nh: number, nk: number, nl: number) => {
    setH(nh);
    setK(nk);
    setL(nl);
    if (onSelectHkl) onSelectHkl(nh, nk, nl);
  };

  return (
    <div className="bg-[#050B14]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-6 shadow-2xl relative overflow-hidden text-left font-sans text-slate-100">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -ml-24 -mb-24" />

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                Structure Factor Argand Phasor Graphic
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
                  ℂ-Plane Vector Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing <span className="font-mono text-cyan-300 font-bold">F(hkl) = ∑ f_j · e^(i·2π·r_j·G)</span> interferometry and crystallographic extinctions
              </p>
            </div>
          </div>
        </div>

        {/* Global Outcome Badge & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Resultant Status Badge */}
          <div
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-black flex items-center gap-2 shadow-lg transition-all ${
              totalF.isAllowed
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-rose-500/10"
            }`}
          >
            {totalF.isAllowed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span>ALLOWED REFLECTION</span>
                  <span className="text-[9px] font-normal opacity-80 font-mono">
                    |F| = {totalF.magnitude.toFixed(2)}f · I ∝ {totalF.intensity.toFixed(2)}f²
                  </span>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <div className="flex flex-col">
                  <span>SYSTEMATIC EXTINCTION</span>
                  <span className="text-[9px] font-normal opacity-80 font-mono">
                    |F| = 0.00 (Total Destructive Loop)
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Time Animation Toggle */}
          <button
            type="button"
            onClick={() => setIsPlayingTime(!isPlayingTime)}
            className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlayingTime
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-300"
            }`}
            title="Toggle time-evolution rotation (ωt) to see constructive vs destructive waves oscillate"
          >
            {isPlayingTime ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlayingTime ? "Pause ωt" : "Spin ωt"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Argand Diagram SVG Canvas & Visualizers */}
        <div className="lg:col-span-7 flex flex-col items-center bg-[#010409] rounded-2xl border border-white/10 p-4 shadow-2xl relative">
          
          {/* Top Canvas Bar Controls */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pb-3 border-b border-white/5">
            
            {/* Display Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setGraphicMode("CHAINED")}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                  graphicMode === "CHAINED"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Tip-to-tail polygon phasor addition"
              >
                Chained Polygon
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode("RADIAL")}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                  graphicMode === "RADIAL"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Origin-centered star vectors"
              >
                Radial Star
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode("WAVE_SUPERPOSITION")}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1 ${
                  graphicMode === "WAVE_SUPERPOSITION"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Physical wave interference superposition curves"
              >
                <Activity className="w-3 h-3" />
                <span>Wave Interferometry</span>
              </button>
            </div>

            {/* View Toggles & Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowProjections(!showProjections)}
                className={`p-1.5 rounded-lg border transition-all ${
                  showProjections
                    ? "bg-slate-800 text-cyan-300 border-cyan-500/30"
                    : "bg-black/40 text-slate-500 border-white/5"
                }`}
                title="Toggle real/imaginary projection axes"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(2.0, prev + 0.25))}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-slate-800 border border-white/10 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-slate-800 border border-white/10 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="px-2 py-1 rounded-lg bg-black/40 hover:bg-slate-800 border border-white/10 text-[9px] text-slate-300 font-mono font-bold"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
            </div>
          </div>

          {/* Conditional Rendering: Argand Phasor Graphic vs Wave Interferometry */}
          {graphicMode !== "WAVE_SUPERPOSITION" ? (
            <div className="w-full flex flex-col items-center justify-center relative my-2">
              <svg
                viewBox={`0 0 ${size} ${size}`}
                className="w-full max-w-[360px] aspect-square overflow-visible select-none"
              >
                <defs>
                  {/* Arrow markers for various phasors */}
                  <marker
                    id="phasor-arrow-resultant"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker
                    id="phasor-arrow-atom-cyan"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="4.5"
                    markerHeight="4.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
                  </marker>

                  {/* Radial Background Gradient */}
                  <radialGradient id="argand-canvas-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="#020617" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#010409" stopOpacity="1" />
                  </radialGradient>
                </defs>

                {/* Background Disc */}
                <circle
                  cx={center}
                  cy={center}
                  r={center - 15}
                  fill="url(#argand-canvas-glow)"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* Concentric Amplitude Rings (1f, 2f, 3f, 4f...) */}
                {showUnitCircles && (
                  <>
                    {[1, 2, 4, 8].map((amp) => {
                      const radius = amp * scale;
                      if (radius > center - 15) return null;
                      return (
                        <g key={`ring-${amp}`}>
                          <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={amp === 1 ? "rgba(56, 189, 248, 0.35)" : "rgba(148, 163, 184, 0.12)"}
                            strokeWidth={amp === 1 ? "1.2" : "0.75"}
                            strokeDasharray={amp === 1 ? "3 3" : "2 4"}
                          />
                          <text
                            x={center + radius + 4}
                            y={center - 4}
                            fill={amp === 1 ? "#38bdf8" : "#64748b"}
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight={amp === 1 ? "bold" : "normal"}
                          >
                            {amp}f
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Real & Imaginary Orthogonal Axes */}
                <g stroke="#334155" strokeWidth="1">
                  <line x1={20} y1={center} x2={size - 20} y2={center} strokeDasharray="none" />
                  <line x1={center} y1={20} x2={center} y2={size - 20} strokeDasharray="none" />
                </g>

                {/* Axis Labels */}
                <text x={size - 18} y={center - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  +Re
                </text>
                <text x={18} y={center - 6} fill="#64748b" fontSize="8" fontFamily="monospace">
                  -Re
                </text>
                <text x={center + 6} y={26} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  +Im
                </text>
                <text x={center + 6} y={size - 16} fill="#64748b" fontSize="8" fontFamily="monospace">
                  -Im
                </text>

                {/* Phase Angle Arc for Resultant Vector */}
                {showPhaseArcs && totalF.isAllowed && totalF.magnitude > 0.3 && (
                  (() => {
                    const arcRadius = Math.min(36 * zoomLevel, totalF.magnitude * scale * 0.4);
                    const startX = center + arcRadius;
                    const startY = center;
                    const endX = center + arcRadius * Math.cos(-totalF.phaseRad);
                    const endY = center + arcRadius * Math.sin(-totalF.phaseRad);
                    const largeArc = Math.abs(totalF.phaseRad) > Math.PI ? 1 : 0;
                    const sweepFlag = totalF.phaseRad >= 0 ? 0 : 1;

                    return (
                      <g>
                        <path
                          d={`M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`}
                          fill="rgba(16, 185, 129, 0.15)"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={center + arcRadius * 1.3 * Math.cos(-totalF.phaseRad / 2)}
                          y={center + arcRadius * 1.3 * Math.sin(-totalF.phaseRad / 2)}
                          fill="#34d399"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          δ={Math.round(totalF.phaseDeg)}°
                        </text>
                      </g>
                    );
                  })()
                )}

                {/* Real / Imaginary Projection Lines on Resultant */}
                {showProjections && totalF.isAllowed && (
                  (() => {
                    const end = toSvg(totalF.real, totalF.imag);
                    return (
                      <g stroke="#10b981" strokeWidth="0.75" strokeDasharray="3 3" opacity={0.6}>
                        {/* Drop line to Real axis */}
                        <line x1={end.x} y1={end.y} x2={end.x} y2={center} />
                        {/* Drop line to Imaginary axis */}
                        <line x1={end.x} y1={end.y} x2={center} y2={end.y} />
                      </g>
                    );
                  })()
                )}

                {/* Individual Atomic Phasor Vectors */}
                {phasors.map((p, idx) => {
                  const start = graphicMode === "CHAINED" ? toSvg(p.startX, p.startY) : toSvg(0, 0);
                  const end = graphicMode === "CHAINED" ? toSvg(p.endX, p.endY) : toSvg(p.vx, p.vy);
                  const isHovered = hoveredAtomIndex === idx || selectedAtomIndex === idx;

                  return (
                    <g
                      key={`phasor-vector-${idx}`}
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setHoveredAtomIndex(idx)}
                      onMouseLeave={() => setHoveredAtomIndex(null)}
                      onClick={() => setSelectedAtomIndex(selectedAtomIndex === idx ? null : idx)}
                    >
                      {/* Phasor Arrow Line */}
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={p.atom.color}
                        strokeWidth={isHovered ? 3.5 : 2}
                        strokeLinecap="round"
                        opacity={
                          hoveredAtomIndex !== null || selectedAtomIndex !== null
                            ? isHovered
                              ? 1.0
                              : 0.25
                            : 0.85
                        }
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 6px ${p.atom.color})` : "none",
                        }}
                      />

                      {/* Endpoint Node Marker */}
                      <circle
                        cx={end.x}
                        cy={end.y}
                        r={isHovered ? 4.5 : 3}
                        fill={p.atom.color}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />

                      {/* Micro node label showing phase degrees */}
                      <text
                        x={end.x + (end.x > center ? 6 : -6)}
                        y={end.y + (end.y > center ? 8 : -6)}
                        fill={p.atom.color}
                        fontSize="7.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor={end.x > center ? "start" : "end"}
                        opacity={isHovered ? 1.0 : 0.75}
                      >
                        {p.atom.element}·{Math.round(p.phaseDeg)}°
                      </text>
                    </g>
                  );
                })}

                {/* Resultant Vector F_hkl */}
                {totalF.isAllowed ? (
                  (() => {
                    const origin = toSvg(0, 0);
                    const end = toSvg(totalF.real, totalF.imag);
                    return (
                      <g className="transition-all duration-300">
                        {/* Glow halo */}
                        <line
                          x1={origin.x}
                          y1={origin.y}
                          x2={end.x}
                          y2={end.y}
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeLinecap="round"
                          opacity={0.3}
                          style={{ filter: "blur(4px)" }}
                        />
                        {/* Main Vector */}
                        <line
                          x1={origin.x}
                          y1={origin.y}
                          x2={end.x}
                          y2={end.y}
                          stroke="#10b981"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          markerEnd="url(#phasor-arrow-resultant)"
                          style={{ filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.9))" }}
                        />
                        {/* Resultant Terminal Head Node */}
                        <circle cx={end.x} cy={end.y} r="5" fill="#34d399" stroke="#fff" strokeWidth="1.5" />

                        {/* Resultant Banner Label */}
                        <g transform={`translate(${end.x + (end.x >= origin.x ? 10 : -10)}, ${end.y + (end.y >= origin.y ? 14 : -12)})`}>
                          <rect
                            x={end.x >= origin.x ? 0 : -85}
                            y="-11"
                            width="85"
                            height="16"
                            rx="4"
                            fill="#050b14"
                            stroke="#10b981"
                            strokeWidth="1"
                            opacity={0.9}
                          />
                          <text
                            x={end.x >= origin.x ? 6 : -42}
                            y="1"
                            fill="#34d399"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor={end.x >= origin.x ? "start" : "middle"}
                          >
                            F({h}{k}{l})={totalF.magnitude.toFixed(2)}f
                          </text>
                        </g>
                      </g>
                    );
                  })()
                ) : (
                  // Extinction Closed Loop indicator
                  <g className="transition-all duration-300">
                    <circle
                      cx={center}
                      cy={center}
                      r="16"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                    <circle cx={center} cy={center} r="4" fill="#f43f5e" />
                    
                    <g transform={`translate(${center}, ${center + 30})`}>
                      <rect x="-65" y="-10" width="130" height="18" rx="4" fill="#1e1014" stroke="#f43f5e" strokeWidth="1" />
                      <text x="0" y="2" fill="#f43f5e" fontSize="8.5" fontFamily="monospace" fontWeight="black" textAnchor="middle">
                        CLOSED POLYGON → F = 0
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          ) : (
            // Wave Superposition Interferometry Mode
            <div className="w-full flex flex-col space-y-3 my-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>WAVE SUPERPOSITION: y_j(x) = f_j · cos(2π·x + φ_j)</span>
                <span className="text-cyan-400 font-bold">{basisAtoms.length} Superposed Waves</span>
              </div>

              {/* Wave Graph SVG */}
              <div className="w-full bg-[#030712] rounded-xl border border-white/5 p-2 overflow-hidden">
                <svg viewBox="0 0 360 180" className="w-full h-[180px]">
                  {/* Grid Lines */}
                  <g stroke="#1e293b" strokeWidth="0.5">
                    <line x1="20" y1="90" x2="340" y2="90" stroke="#334155" strokeWidth="1" />
                    <line x1="20" y1="30" x2="340" y2="30" strokeDasharray="2 4" />
                    <line x1="20" y1="150" x2="340" y2="150" strokeDasharray="2 4" />
                    {/* Period vertical markers */}
                    <line x1="100" y1="15" x2="100" y2="165" strokeDasharray="2 2" />
                    <line x1="180" y1="15" x2="180" y2="165" strokeDasharray="2 2" />
                    <line x1="260" y1="15" x2="260" y2="165" strokeDasharray="2 2" />
                  </g>

                  {/* Individual Atomic Wave Curves */}
                  {phasors.map((p, idx) => {
                    const points: string[] = [];
                    const isHovered = hoveredAtomIndex === idx || selectedAtomIndex === idx;
                    for (let px = 20; px <= 340; px += 3) {
                      const tNorm = ((px - 20) / 320) * 2 * (2 * Math.PI); // 2 full waves
                      const yVal = p.atom.f * Math.cos(tNorm + p.totalPhiRad);
                      // scale: max amp 4 = 60px
                      const py = 90 - (yVal / (maxPossibleAmp || 1)) * 50;
                      points.push(`${px},${py.toFixed(1)}`);
                    }

                    return (
                      <polyline
                        key={`wave-${idx}`}
                        points={points.join(" ")}
                        fill="none"
                        stroke={p.atom.color}
                        strokeWidth={isHovered ? 2.5 : 1.2}
                        opacity={isHovered ? 1.0 : 0.4}
                        strokeDasharray={idx % 2 === 1 ? "3 1" : "none"}
                      />
                    );
                  })}

                  {/* Total Resultant Summed Wave */}
                  {(() => {
                    const points: string[] = [];
                    for (let px = 20; px <= 340; px += 3) {
                      const tNorm = ((px - 20) / 320) * 2 * (2 * Math.PI);
                      let sumY = 0;
                      phasors.forEach((p) => {
                        sumY += p.atom.f * Math.cos(tNorm + p.totalPhiRad);
                      });
                      const py = 90 - (sumY / (maxPossibleAmp || 1)) * 50;
                      points.push(`${px},${py.toFixed(1)}`);
                    }

                    return (
                      <polyline
                        points={points.join(" ")}
                        fill="none"
                        stroke={totalF.isAllowed ? "#10b981" : "#f43f5e"}
                        strokeWidth={totalF.isAllowed ? 3.5 : 2}
                        strokeLinecap="round"
                        style={{
                          filter: totalF.isAllowed ? "drop-shadow(0 0 6px rgba(16,185,129,0.8))" : "none",
                        }}
                      />
                    );
                  })()}

                  {/* Axis labels */}
                  <text x="25" y="25" fill="#64748b" fontSize="7.5" fontFamily="monospace">
                    +Amplitude
                  </text>
                  <text x="25" y="165" fill="#64748b" fontSize="7.5" fontFamily="monospace">
                    -Amplitude
                  </text>
                  <text x="335" y="85" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">
                    Spatial Phase x
                  </text>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-1 bg-emerald-400 rounded-full inline-block" />
                  Resultant Envelope Y_total(x)
                </span>
                <span>Interference: {totalF.isAllowed ? "Constructive Superposition" : "Zero Flatline Destruction"}</span>
              </div>
            </div>
          )}

          {/* Bottom Diagnostics Footer Bar */}
          <div className="w-full mt-2 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
            <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500 block text-[8px] uppercase">Real Sum ∑Re</span>
              <span className="font-bold text-sky-400">{totalF.real.toFixed(3)} f</span>
            </div>
            <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500 block text-[8px] uppercase">Imag Sum ∑Im</span>
              <span className="font-bold text-purple-400">{totalF.imag.toFixed(3)} f</span>
            </div>
            <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500 block text-[8px] uppercase">Phase Angle δ</span>
              <span className="font-bold text-emerald-400">{totalF.phaseDeg.toFixed(1)}°</span>
            </div>
            <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
              <span className="text-slate-500 block text-[8px] uppercase">Basis Count</span>
              <span className="font-bold text-amber-400">{basisAtoms.length} Atoms</span>
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Extinction Theorem & Physical Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. Crystal Lattice & Form Factor Selection Panel */}
          <div className="bg-[#0B1221] p-4 rounded-xl border border-white/10 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                Crystal Archetype
              </span>
              <span className="text-[9px] text-cyan-400 font-bold uppercase">{selectedSystem}</span>
            </div>

            {/* Archetype Quick Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "SC", label: "SC (Primitive)" },
                { id: "BCC", label: "BCC (I)" },
                { id: "FCC", label: "FCC (F)" },
                { id: "Diamond", label: "Diamond (Fd-3m)" },
                { id: "NaCl_Rocksalt", label: "NaCl (Rocksalt)" },
                { id: "ZnS_Zincblende", label: "ZnS (Blende)" },
                { id: "Perovskite", label: "Perovskite" },
                { id: "Hexagonal", label: "HCP (Hex)" },
                { id: "Orthorhombic_C", label: "Base-C" },
              ].map((sys) => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setSelectedSystem(sys.id)}
                  className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all text-left truncate ${
                    selectedSystem === sys.id
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                      : "bg-black/40 text-slate-400 border-white/5 hover:text-white hover:border-white/20"
                  }`}
                >
                  {sys.label}
                </button>
              ))}
            </div>

            {/* Form Factor Mode Toggle (Unity vs Elemental Scattering Ratio) */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px]">
              <span className="text-slate-400">Scattering Powers (f_j):</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormFactorMode("UNITY")}
                  className={`px-2 py-0.5 rounded text-[8.5px] border ${
                    formFactorMode === "UNITY"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                      : "bg-black/40 text-slate-500 border-white/5"
                  }`}
                >
                  Equal (f=1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormFactorMode("CUSTOM")}
                  className={`px-2 py-0.5 rounded text-[8.5px] border ${
                    formFactorMode === "CUSTOM"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                      : "bg-black/40 text-slate-500 border-white/5"
                  }`}
                >
                  Custom f₂/f₁
                </button>
              </div>
            </div>

            {formFactorMode === "CUSTOM" && (
              <div className="p-2 bg-black/40 rounded-lg border border-white/5 space-y-1.5 animate-in slide-in-from-top-1">
                <div className="flex justify-between text-[8.5px]">
                  <span className="text-slate-400">Sublattice Ratio f₂ / f₁:</span>
                  <span className="text-cyan-400 font-bold">{customRatioF2.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={customRatioF2}
                  onChange={(e) => setCustomRatioF2(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            )}
          </div>

          {/* 2. Miller Index Probe (h k l) & Presets */}
          <div className="bg-[#0B1221] p-4 rounded-xl border border-white/10 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Miller Index Probe (h k l)
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">
                ({h} {k} {l})
              </span>
            </div>

            {/* Stepper Inputs for h, k, l */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "h", val: h, set: setH },
                { label: "k", val: k, set: setK },
                { label: "l", val: l, set: setL },
              ].map(({ label, val, set }) => (
                <div key={label} className="bg-black/60 rounded-xl p-2 border border-white/10 flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{label}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nv = Math.max(-6, val - 1);
                        set(nv);
                        if (onSelectHkl) {
                          if (label === "h") onSelectHkl(nv, k, l);
                          if (label === "k") onSelectHkl(h, nv, l);
                          if (label === "l") onSelectHkl(h, k, nv);
                        }
                      }}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center font-bold text-xs text-slate-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-cyan-400 w-6 text-center">{val}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nv = Math.min(6, val + 1);
                        set(nv);
                        if (onSelectHkl) {
                          if (label === "h") onSelectHkl(nv, k, l);
                          if (label === "k") onSelectHkl(h, nv, l);
                          if (label === "l") onSelectHkl(h, k, nv);
                        }
                      }}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center font-bold text-xs text-slate-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Crystallographic Presets Filtered by Symmetry Type */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[8.5px] text-slate-500 uppercase">
                <span>Crystallographic Presets:</span>
                <span>Allowed vs Forbidden</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { hkl: [1, 0, 0], tag: "BCC/FCC Ext" },
                  { hkl: [1, 1, 0], tag: "BCC Strong" },
                  { hkl: [1, 1, 1], tag: "FCC/Dia Strong" },
                  { hkl: [2, 0, 0], tag: "Dia Extinction" },
                  { hkl: [2, 2, 0], tag: "FCC/Dia Strong" },
                  { hkl: [3, 1, 1], tag: "FCC/Dia Odd" },
                  { hkl: [2, 2, 2], tag: "Dia Zero Loop" },
                  { hkl: [4, 0, 0], tag: "High Symmetry" },
                ].map(({ hkl: [ph, pk, pl], tag }) => (
                  <button
                    key={`${ph}-${pk}-${pl}`}
                    type="button"
                    onClick={() => handleApplyPreset(ph, pk, pl)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1 ${
                      h === ph && k === pk && l === pl
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                        : "bg-black/40 text-slate-400 border-white/5 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span>({ph}{pk}{pl})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Physical Extinction Theorem & Reasoner Box */}
          <div className="bg-[#0B1221] p-4 rounded-xl border border-white/10 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Interference Reasoning
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                  totalF.isAllowed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {extinctionExplanation.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>{extinctionExplanation.title}</span>
              </div>
              <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 text-[10px] text-slate-300 leading-relaxed">
                {extinctionExplanation.reason}
              </div>
            </div>
          </div>

          {/* 4. Complete Atomic Basis Phasor Matrix Table */}
          <div className="bg-[#0B1221] p-4 rounded-xl border border-white/10 space-y-2.5 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Atomic Basis Decomposition (r_j · G)
              </span>
              <span className="text-[9px] text-slate-500">{basisAtoms.length} Sites</span>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {phasors.map((p, idx) => {
                const isHovered = hoveredAtomIndex === idx || selectedAtomIndex === idx;
                return (
                  <div
                    key={`atom-entry-${idx}`}
                    onMouseEnter={() => setHoveredAtomIndex(idx)}
                    onMouseLeave={() => setHoveredAtomIndex(null)}
                    onClick={() => setSelectedAtomIndex(selectedAtomIndex === idx ? null : idx)}
                    className={`p-2 rounded-lg flex items-center justify-between text-[9.5px] border transition-all cursor-pointer ${
                      isHovered
                        ? "bg-white/10 border-white/30 text-white shadow-sm"
                        : "bg-black/40 border-white/5 text-slate-400 hover:bg-black/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.atom.color }} />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{p.atom.label}</span>
                        <span className="text-[8px] text-slate-500 font-mono">
                          r_j = [{p.atom.coords.join(",")}]
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-slate-400 block">φ = {p.phaseDeg.toFixed(0)}°</span>
                        <span className="text-[8px] text-slate-500">
                          {((p.dotProduct % 1 + 1) % 1).toFixed(2)}·2π
                        </span>
                      </div>
                      <div className="min-w-[45px]">
                        <span className="text-cyan-400 font-bold block">
                          cos={Math.cos(p.basePhiRad).toFixed(2)}
                        </span>
                        <span className="text-[8px] text-purple-400">
                          sin={Math.sin(p.basePhiRad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
