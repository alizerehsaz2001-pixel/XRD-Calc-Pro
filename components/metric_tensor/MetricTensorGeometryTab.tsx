import React, { useState, useMemo } from 'react';
import { Calculator, Atom, Compass, Sparkles } from 'lucide-react';
import { fmt } from './metricTensorTypes';
import {
  computeBondGeometry,
  computeDirectionAngle,
  computeMixedSpaceAngle
} from './metricTensorEngine';

interface MetricTensorGeometryTabProps {
  h1: number; setH1: (v: number) => void;
  k1: number; setK1: (v: number) => void;
  l1: number; setL1: (v: number) => void;

  h2: number; setH2: (v: number) => void;
  k2: number; setK2: (v: number) => void;
  l2: number; setL2: (v: number) => void;

  u1: number; setU1: (v: number) => void;
  v1: number; setV1: (v: number) => void;
  w1: number; setW1: (v: number) => void;

  u2: number; setU2: (v: number) => void;
  v2: number; setV2: (v: number) => void;
  w2: number; setW2: (v: number) => void;

  metricG: number[][];
  metricGStar: number[][];

  plane1Calc: { invDSq: number; d: number; gMag: number };
  plane2Calc: { invDSq: number; d: number; gMag: number };
  interplanarAngle: number;
  lenU1: number;
  lenU2: number;
  zoneAxisFromPlanes: { u: number; v: number; w: number };
  planeFromDirections: { h: number; k: number; l: number };
  planeZoneDotProduct: number;
}

const COMMON_PLANES = [
  { label: '(1 0 0)', h: 1, k: 0, l: 0 },
  { label: '(1 1 0)', h: 1, k: 1, l: 0 },
  { label: '(1 1 1)', h: 1, k: 1, l: 1 },
  { label: '(2 0 0)', h: 2, k: 0, l: 0 },
  { label: '(2 2 0)', h: 2, k: 2, l: 0 },
  { label: '(3 1 1)', h: 3, k: 1, l: 1 },
  { label: '(0 0 2)', h: 0, k: 0, l: 2 },
  { label: '(1 0 1)', h: 1, k: 0, l: 1 }
];

const COMMON_DIRECTIONS = [
  { label: '[1 0 0]', u: 1, v: 0, w: 0 },
  { label: '[0 1 0]', u: 0, v: 1, w: 0 },
  { label: '[0 0 1]', u: 0, v: 0, w: 1 },
  { label: '[1 1 0]', u: 1, v: 1, w: 0 },
  { label: '[1 1 1]', u: 1, v: 1, w: 1 },
  { label: '[1 1 2]', u: 1, v: 1, w: 2 }
];

const BOND_PRESETS: {
  name: string;
  p1: [number, number, number];
  p2: [number, number, number];
  p3: [number, number, number];
}[] = [
  {
    name: 'Diamond Tetrahedral (109.47°)',
    p1: [0, 0, 0],
    p2: [0.25, 0.25, 0.25],
    p3: [0.5, 0.5, 0]
  },
  {
    name: 'Octahedral Corner Bridge (90°)',
    p1: [0.5, 0, 0],
    p2: [0, 0, 0],
    p3: [0, 0.5, 0]
  },
  {
    name: 'Body-Diagonal Triangle',
    p1: [1, 0, 0],
    p2: [0, 0, 0],
    p3: [1, 1, 1]
  }
];

export const MetricTensorGeometryTab: React.FC<MetricTensorGeometryTabProps> = ({
  h1, setH1, k1, setK1, l1, setL1,
  h2, setH2, k2, setK2, l2, setL2,
  u1, setU1, v1, setV1, w1, setW1,
  u2, setU2, v2, setV2, w2, setW2,
  metricG,
  metricGStar,
  plane1Calc,
  plane2Calc,
  interplanarAngle,
  lenU1,
  lenU2,
  zoneAxisFromPlanes,
  planeFromDirections,
  planeZoneDotProduct
}) => {
  const [showStepByStepD1, setShowStepByStepD1] = useState<boolean>(true);

  // Fractional site bond geometry calculator state
  const [site1, setSite1] = useState<[number, number, number]>([0, 0, 0]);
  const [site2, setSite2] = useState<[number, number, number]>([0.25, 0.25, 0.25]);
  const [site3, setSite3] = useState<[number, number, number]>([0.5, 0.5, 0]);

  const bondGeom = useMemo(
    () => computeBondGeometry(metricG, site1, site2, site3),
    [metricG, site1, site2, site3]
  );

  const mixedAnglePsi = useMemo(
    () => computeMixedSpaceAngle(metricG, metricGStar, [h1, k1, l1], [u1, v1, w1]),
    [metricG, metricGStar, h1, k1, l1, u1, v1, w1]
  );

  const dirToDirAngle = useMemo(
    () => computeDirectionAngle(metricG, [u1, v1, w1], [u2, v2, w2]),
    [metricG, u1, v1, w1, u2, v2, w2]
  );

  const g11 = metricGStar[0][0], g22 = metricGStar[1][1], g33 = metricGStar[2][2];
  const g12 = metricGStar[0][1], g23 = metricGStar[1][2], g13 = metricGStar[0][2];

  const termH2 = h1 * h1 * g11;
  const termK2 = k1 * k1 * g22;
  const termL2 = l1 * l1 * g33;
  const termHK = 2 * h1 * k1 * g12;
  const termKL = 2 * k1 * l1 * g23;
  const termHL = 2 * h1 * l1 * g13;

  return (
    <div className="space-y-6">
      {/* Main 3 Geometry Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool 1: d-Spacing via Metric Contraction h^T G* h */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <h4 className="font-bold text-sm text-white">1. d-Spacing via 1/d² = hᵀ G* h</h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">Plane 1 (h₁k₁l₁)</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_PLANES.slice(0, 5).map((p) => (
                <button
                  key={`p1-pre-${p.label}`}
                  onClick={() => {
                    setH1(p.h);
                    setK1(p.k);
                    setL1(p.l);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold border border-slate-800 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { label: 'h₁', val: h1, set: setH1 },
                { label: 'k₁', val: k1, set: setK1 },
                { label: 'l₁', val: l1, set: setL1 }
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">{item.label}</span>
                  <input
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-transparent text-white font-mono font-black text-center text-base outline-none focus:text-cyan-300 tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl font-mono text-xs space-y-2 tabular-nums">
              <div className="flex justify-between items-center text-slate-300">
                <span>Contraction 1/d²:</span>
                <span className="text-cyan-300 font-bold">{fmt(plane1Calc.invDSq, 5)} Å⁻²</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Reciprocal |g₁*|:</span>
                <span className="text-emerald-400 font-bold">{fmt(plane1Calc.gMag, 4)} Å⁻¹</span>
              </div>
              <div className="pt-2 border-t border-cyan-500/20 flex justify-between items-center">
                <span className="text-white font-bold text-xs">d_({h1}{k1}{l1}):</span>
                <span className="text-emerald-400 font-black text-lg">{fmt(plane1Calc.d, 4)} Å</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowStepByStepD1(!showStepByStepD1)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono text-left flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            {showStepByStepD1 ? 'Hide Step-by-Step Contraction' : 'Show Step-by-Step Contraction'}
          </button>
        </div>

        {/* Tool 2: Interplanar Angle & Cross Zone Axis */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between hover:border-violet-500/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                <h4 className="font-bold text-sm text-white">2. Interplanar Angle φ & Zone</h4>
              </div>
              <span className="text-[10px] font-mono text-violet-300">Plane 2 (h₂k₂l₂)</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_PLANES.slice(3, 8).map((p) => (
                <button
                  key={`p2-pre-${p.label}`}
                  onClick={() => {
                    setH2(p.h);
                    setK2(p.k);
                    setL2(p.l);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-violet-300 text-[10px] font-mono font-bold border border-slate-800 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { label: 'h₂', val: h2, set: setH2 },
                { label: 'k₂', val: k2, set: setK2 },
                { label: 'l₂', val: l2, set: setL2 }
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">{item.label}</span>
                  <input
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-transparent text-white font-mono font-black text-center text-base outline-none focus:text-violet-300 tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-violet-950/20 border border-violet-500/30 rounded-xl font-mono text-xs space-y-2 tabular-nums">
              <div className="flex justify-between items-center text-slate-300">
                <span>d_({h2}{k2}{l2}):</span>
                <span className="text-cyan-300 font-bold">{fmt(plane2Calc.d, 4)} Å</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Plane Angle φ(h₁, h₂):</span>
                <span className="text-amber-300 font-black text-base">{fmt(interplanarAngle, 2)}°</span>
              </div>
              <div className="pt-2 border-t border-violet-500/20 flex justify-between items-center">
                <span className="text-white font-bold text-xs">Zone Axis [h₁ × h₂]:</span>
                <span className="text-violet-300 font-black text-sm">
                  [{zoneAxisFromPlanes.u} {zoneAxisFromPlanes.v} {zoneAxisFromPlanes.w}]
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            cos φ = (h₁ᵀ G* h₂) / (|g₁*| |g₂*|). Cross product gives common zone axis.
          </p>
        </div>

        {/* Tool 3: Direct Direction [uvw] & Mixed-Space Coupling */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="font-bold text-sm text-white">3. Direct Vector [uvw] & Weiss Law</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-300">Direction u₁</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_DIRECTIONS.map((d) => (
                <button
                  key={`d-pre-${d.label}`}
                  onClick={() => {
                    setU1(d.u);
                    setV1(d.v);
                    setW1(d.w);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-emerald-300 text-[10px] font-mono font-bold border border-slate-800 transition-colors cursor-pointer"
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { label: 'u₁', val: u1, set: setU1 },
                { label: 'v₁', val: v1, set: setV1 },
                { label: 'w₁', val: w1, set: setW1 }
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">{item.label}</span>
                  <input
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-transparent text-white font-mono font-black text-center text-base outline-none focus:text-emerald-300 tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl font-mono text-xs space-y-2 tabular-nums">
              <div className="flex justify-between items-center text-slate-300">
                <span>Direction ||u₁||_G:</span>
                <span className="text-emerald-300 font-bold">{fmt(lenU1, 4)} Å</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>∠([u₁], (h₁)* normal):</span>
                <span className="text-cyan-300 font-bold">{fmt(mixedAnglePsi, 2)}°</span>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center">
                <span className="text-white font-bold text-xs">Weiss Law (h₁·u₁):</span>
                <span
                  className={`font-black text-xs px-2 py-0.5 rounded-md ${
                    planeZoneDotProduct === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {planeZoneDotProduct} {planeZoneDotProduct === 0 ? '(In Zone ✓)' : '(Skew)'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Mixed angle ψ uses dual orthogonality: cos ψ = (h₁·u₁) / (||u₁||_G · |g₁*|).
          </p>
        </div>
      </div>

      {/* Row 2: Direction u2 Angle + Bond Length & Molecular Angle Metrology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Direct Vector Pair [u1] vs [u2] */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Direct Space Angle [u₁] vs [u₂]</h4>
            </div>
            <span className="text-[10px] font-mono text-amber-300">cos θ = (u₁ᵀ G u₂)/(||u₁||||u₂||)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            {[
              { label: 'u₂', val: u2, set: setU2 },
              { label: 'v₂', val: v2, set: setV2 },
              { label: 'w₂', val: w2, set: setW2 }
            ].map((item) => (
              <div key={item.label} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">{item.label}</span>
                <input
                  type="number"
                  value={item.val}
                  onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-white font-mono font-black text-center text-sm outline-none focus:text-amber-300 tabular-nums"
                />
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 font-mono text-xs space-y-2 tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">Length ||u₂||_G:</span>
              <span className="text-white font-bold">{fmt(lenU2, 4)} Å</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Inter-direction Angle θ:</span>
              <span className="text-amber-300 font-black">{fmt(dirToDirAngle, 2)}°</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400">Spanning Plane (u₁ × u₂):</span>
              <span className="text-cyan-300 font-bold">
                ({planeFromDirections.h} {planeFromDirections.k} {planeFromDirections.l})
              </span>
            </div>
          </div>
        </div>

        {/* Atomic Site Bond Length & Bond Angle Metrology */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Atom className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Atomic Site Bond Length & Angle Metrology (via G)</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {BOND_PRESETS.map((bp) => (
                <button
                  key={bp.name}
                  onClick={() => {
                    setSite1(bp.p1);
                    setSite2(bp.p2);
                    setSite3(bp.p3);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[10px] font-mono cursor-pointer"
                >
                  {bp.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs tabular-nums">
            {[
              { title: 'Atom 1 (x₁,y₁,z₁)', vec: site1, set: setSite1, color: 'text-sky-300' },
              { title: 'Center Atom 2 (x₂,y₂,z₂)', vec: site2, set: setSite2, color: 'text-emerald-300' },
              { title: 'Atom 3 (x₃,y₃,z₃)', vec: site3, set: setSite3, color: 'text-violet-300' }
            ].map((site, idx) => (
              <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className={`text-[10px] font-bold block ${site.color}`}>{site.title}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((cIdx) => (
                    <input
                      key={cIdx}
                      type="number"
                      step="0.05"
                      value={site.vec[cIdx]}
                      onChange={(e) => {
                        const next: [number, number, number] = [...site.vec] as [number, number, number];
                        next[cIdx] = parseFloat(e.target.value) || 0;
                        site.set(next);
                      }}
                      className="w-full bg-slate-950 text-white text-center font-bold text-xs py-1 rounded border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Bond d(1–2)</span>
              <span className="text-sky-300 font-bold text-sm">{fmt(bondGeom.d12, 4)} Å</span>
            </div>
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Bond d(2–3)</span>
              <span className="text-violet-300 font-bold text-sm">{fmt(bondGeom.d23, 4)} Å</span>
            </div>
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Next-NN d(1–3)</span>
              <span className="text-slate-200 font-bold text-sm">{fmt(bondGeom.d13, 4)} Å</span>
            </div>
            <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-center">
              <span className="text-[10px] text-emerald-400 block">Angle θ(1–2–3)</span>
              <span className="text-emerald-300 font-black text-sm">{fmt(bondGeom.bondAngleDeg, 2)}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Contraction Proof */}
      {showStepByStepD1 && (
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4 font-mono text-xs tabular-nums">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-white text-sm">
              Analytical Metric Contraction Breakdown for ({h1} {k1} {l1})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <span className="text-cyan-300 font-bold block">1. Bilinear Expansion Terms:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                1/d² = h² g*₁₁ + k² g*₂₂ + l² g*₃₃ + 2hk g*₁₂ + 2kl g*₂₃ + 2hl g*₁₃
              </p>
              <div className="space-y-1 text-slate-400 text-[11px] pt-2 border-t border-slate-800">
                <div>
                  • h²·g*₁₁ = ({h1})² × {fmt(g11, 5)} = <span className="text-white font-bold">{fmt(termH2, 5)}</span>
                </div>
                <div>
                  • k²·g*₂₂ = ({k1})² × {fmt(g22, 5)} = <span className="text-white font-bold">{fmt(termK2, 5)}</span>
                </div>
                <div>
                  • l²·g*₃₃ = ({l1})² × {fmt(g33, 5)} = <span className="text-white font-bold">{fmt(termL2, 5)}</span>
                </div>
                <div>
                  • 2hk·g*₁₂ = 2({h1})({k1}) × {fmt(g12, 5)} = <span className="text-white font-bold">{fmt(termHK, 5)}</span>
                </div>
                <div>
                  • 2kl·g*₂₃ = 2({k1})({l1}) × {fmt(g23, 5)} = <span className="text-white font-bold">{fmt(termKL, 5)}</span>
                </div>
                <div>
                  • 2hl·g*₁₃ = 2({h1})({l1}) × {fmt(g13, 5)} = <span className="text-white font-bold">{fmt(termHL, 5)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-emerald-300 font-bold block mb-2">2. Total Quadratic Form & Inversion:</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-slate-400 text-[11px]">Sum = 1/d²:</div>
                  <div className="text-cyan-300 font-bold text-sm">
                    {fmt(termH2 + termK2 + termL2 + termHK + termKL + termHL, 6)} Å⁻²
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/30 space-y-1">
                <div className="text-slate-400 text-[10px]">Interplanar Spacing d = 1 / √(hᵀ G* h):</div>
                <div className="text-emerald-400 font-bold text-base">
                  d_({h1}{k1}{l1}) = {fmt(plane1Calc.d, 4)} Å
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
