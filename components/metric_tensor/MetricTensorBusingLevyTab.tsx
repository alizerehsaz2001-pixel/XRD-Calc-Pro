import React, { useRef, useEffect, useState } from 'react';
import {
  Cpu,
  Calculator,
  Compass,
  Copy,
  Check,
  FileText,
  Terminal,
  Sparkles
} from 'lucide-react';
import { fmt } from './metricTensorTypes';
import { DualFramesResult, matVec3 } from './metricTensorEngine';

interface MetricTensorBusingLevyTabProps {
  dualFrames: DualFramesResult;
  metricG: number[][];
  metricGStar: number[][];
  fracX: number; setFracX: (v: number) => void;
  fracY: number; setFracY: (v: number) => void;
  fracZ: number; setFracZ: (v: number) => void;
  h1: number;
  k1: number;
  l1: number;
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const MetricTensorBusingLevyTab: React.FC<MetricTensorBusingLevyTabProps> = ({
  dualFrames,
  metricG,
  metricGStar,
  fracX, setFracX,
  fracY, setFracY,
  fracZ, setFracZ,
  h1,
  k1,
  l1,
  copyToClipboard,
  copiedKey
}) => {
  const {
    matrixA,
    matrixB,
    matrixATA,
    matrixBTB,
    residualATA,
    residualBTB,
    residualATB
  } = dualFrames;

  const [activeMatrixView, setActiveMatrixView] = useState<'A' | 'B'>('A');
  const busingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Direct space Cartesian vector r_Cart = A * [fracX, fracY, fracZ] (units: Å)
  const rCartRaw = matVec3(matrixA, [fracX, fracY, fracZ]);
  const rLen = Math.sqrt(rCartRaw[0] ** 2 + rCartRaw[1] ** 2 + rCartRaw[2] ** 2);

  // Reciprocal scattering vector q_Cart = B * [h1, k1, l1] (units: Å^-1, |q| = 1/d)
  const qCartRaw = matVec3(matrixB, [h1, k1, l1]);
  const qLen = Math.sqrt(qCartRaw[0] ** 2 + qCartRaw[1] ** 2 + qCartRaw[2] ** 2);

  // Biorthogonal invariant dot product r_Cart · q_Cart = x_frac · h_hkl
  const cartDot = rCartRaw[0] * qCartRaw[0] + rCartRaw[1] * qCartRaw[1] + rCartRaw[2] * qCartRaw[2];
  const fracDot = fracX * h1 + fracY * k1 + fracZ * l1;

  // 3D Oblique projection canvas rendering unit cell parallelepiped + r_Cart + Cartesian basis
  useEffect(() => {
    const canvas = busingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Compute unit cell vertices via A to auto-scale cleanly
    const cornersFrac: [number, number, number][] = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1]
    ];
    const cornersCart = cornersFrac.map((c) => matVec3(matrixA, c));
    const maxExtent = Math.max(
      1,
      ...cornersCart.flatMap((v) => [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])]),
      Math.abs(rCartRaw[0]),
      Math.abs(rCartRaw[1]),
      Math.abs(rCartRaw[2])
    );

    const ox = width * 0.44;
    const oy = height * 0.66;
    const s = Math.min(width, height) * 0.34 / maxExtent;

    const project = (x: number, y: number, z: number) => ({
      px: ox + (y * 0.88 - x * 0.48) * s,
      py: oy + (-z * 0.88 + x * 0.34 + y * 0.16) * s
    });

    // Draw unit cell edges
    const edges = [
      [0, 1], [0, 2], [0, 3],
      [1, 4], [1, 5],
      [2, 4], [2, 6],
      [3, 5], [3, 6],
      [4, 7], [5, 7], [6, 7]
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1;
    edges.forEach(([i, j]) => {
      const p1 = project(cornersCart[i][0], cornersCart[i][1], cornersCart[i][2]);
      const p2 = project(cornersCart[j][0], cornersCart[j][1], cornersCart[j][2]);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
    });
    ctx.restore();

    const pOrigin = project(0, 0, 0);
    const axisLen = maxExtent * 0.7;
    const pE1 = project(axisLen, 0, 0);
    const pE2 = project(0, axisLen, 0);
    const pE3 = project(0, 0, axisLen);

    const drawAxis = (to: { px: number; py: number }, color: string, label: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pOrigin.px, pOrigin.py);
      ctx.lineTo(to.px, to.py);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, to.px + 4, to.py - 4);
      ctx.restore();
    };

    drawAxis(pE1, '#38bdf8', 'e₁ (X)');
    drawAxis(pE2, '#c084fc', 'e₂ (Y)');
    drawAxis(pE3, '#34d399', 'e₃ (Z∥c)');

    // Draw r_Cart vector
    const pVector = project(rCartRaw[0], rCartRaw[1], rCartRaw[2]);
    const pGround = project(rCartRaw[0], rCartRaw[1], 0);
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pOrigin.px, pOrigin.py);
    ctx.lineTo(pGround.px, pGround.py);
    ctx.lineTo(pVector.px, pVector.py);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pOrigin.px, pOrigin.py);
    ctx.lineTo(pVector.px, pVector.py);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(pVector.px, pVector.py, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = 'bold 11px monospace';
    ctx.fillText(`r_Cart (${fmt(rLen, 2)} Å)`, pVector.px + 8, pVector.py - 6);
    ctx.restore();
  }, [matrixA, rCartRaw, rLen]);

  const activeMatrix = activeMatrixView === 'A' ? matrixA : matrixB;
  const labelsA = [
    ['A₁₁ (1/a*)', '0', '0'],
    ['A₂₁', 'A₂₂', '0'],
    ['a cosβ', 'b cosα', 'c']
  ];
  const labelsB = [
    ['a*', 'b* cosγ*', 'c* cosβ*'],
    ['0', 'b* sinγ*', '-c* sinβ* cosα'],
    ['0', '0', '1/c']
  ];
  const activeLabels = activeMatrixView === 'A' ? labelsA : labelsB;

  return (
    <div className="space-y-6">
      {/* Banner & Exports */}
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>DUAL BUSING–LEVY ORTHOGONALIZATION FRAMES [A & B]</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Direct Matrix A (Fractional → Å) & Reciprocal Matrix B (hkl → Å⁻¹)
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Busing & Levy (1967) separate direct-space coordinates <span className="font-mono text-emerald-300">r = A · x_frac</span> (where <span className="font-mono">AᵀA = G</span>) from reciprocal scattering vectors <span className="font-mono text-cyan-300">q = B · h</span> (where <span className="font-mono">BᵀB = G*</span> and <span className="font-mono">AᵀB = I</span>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => copyToClipboard(JSON.stringify({ A: matrixA, B: matrixB }), 'AB_json')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono cursor-pointer"
          >
            {copiedKey === 'AB_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>JSON</span>
          </button>
          <button
            onClick={() =>
              copyToClipboard(
                `\\begin{pmatrix}\n${activeMatrix.map((r) => r.map((v) => fmt(v, 5)).join(' & ')).join(' \\\\\n')}\n\\end{pmatrix}`,
                'AB_latex'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono cursor-pointer"
          >
            {copiedKey === 'AB_latex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
            <span>LaTeX</span>
          </button>
          <button
            onClick={() =>
              copyToClipboard(
                `import numpy as np\nA = np.array(${JSON.stringify(matrixA)})\nB = np.array(${JSON.stringify(matrixB)})`,
                'AB_numpy'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-mono font-bold cursor-pointer"
          >
            {copiedKey === 'AB_numpy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
            <span>NumPy</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Matrix A / B Toggle Display + Dual Identity Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setActiveMatrixView('A')}
                className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                  activeMatrixView === 'A' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Matrix [A] (Å)
              </button>
              <button
                onClick={() => setActiveMatrixView('B')}
                className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                  activeMatrixView === 'B' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Reciprocal Matrix [B] (Å⁻¹)
              </button>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {activeMatrixView === 'A' ? 'Lower-Triangular: Aᵀ A = G' : 'Upper-Triangular: Bᵀ B = G*'}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center font-mono tabular-nums">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className={`text-base font-serif font-bold ${activeMatrixView === 'A' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                  {activeMatrixView === 'A' ? 'r_Cart' : 'q_Cart'}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  {activeMatrixView === 'A' ? '= A · x_frac' : '= B · h_hkl'}
                </span>
              </div>
              <span className="text-xl text-slate-600 font-light">=</span>
              <div className="border-l-2 border-t-2 border-b-2 border-indigo-500/70 rounded-l-md py-3 px-1" />

              <div className="grid grid-cols-3 gap-2 text-center px-1">
                {activeMatrix.flatMap((row, ri) =>
                  row.map((val, ci) => {
                    const isZero = Math.abs(val) < 1e-10;
                    const isDiag = ri === ci;
                    return (
                      <div
                        key={`mat-${ri}-${ci}`}
                        className={`px-3 py-2 rounded-lg border ${
                          isZero
                            ? 'bg-slate-900/30 text-slate-600 border-slate-800/50'
                            : isDiag
                            ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 font-black'
                            : 'bg-slate-900/80 text-cyan-200 border-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">{fmt(val, 5)}</div>
                        <div className="text-[9px] font-sans text-slate-500 mt-0.5">{activeLabels[ri][ci]}</div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-r-2 border-t-2 border-b-2 border-indigo-500/70 rounded-r-md py-3 px-1" />
            </div>
          </div>
        </div>

        {/* Biorthogonality & Frobenius Residual Proof */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Dual Frame Algebraic Proofs
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                Aᵀ B ≡ I₃
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2 tabular-nums">
              <div className="flex justify-between text-slate-300">
                <span>||AᵀA − G||_F (Direct Metric):</span>
                <span className="text-emerald-400 font-bold">{residualATA.toExponential(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>||BᵀB − G*||_F (Reciprocal):</span>
                <span className="text-cyan-400 font-bold">{residualBTB.toExponential(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1.5">
                <span>||AᵀB − I₃||_F (Biorthogonal):</span>
                <span className="text-amber-300 font-bold">{residualATB.toExponential(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1">
                <span>Trace Check (AᵀA)₁₁ vs G₁₁:</span>
                <span>
                  {fmt(matrixATA[0][0], 4)} = {fmt(metricG[0][0], 4)} | (BᵀB)₁₁ = {fmt(matrixBTB[0][0], 5)} vs{' '}
                  {fmt(metricGStar[0][0], 5)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/25 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 space-y-1 font-mono">
            <span className="text-indigo-300 font-bold block font-sans">Busing–Levy Axis Convention:</span>
            <div>• e₁ ∥ a* (X_lab aligned with reciprocal a*)</div>
            <div>• e₂ in (a*, b*) plane perpendicular to e₁</div>
            <div>• e₃ = e₁ × e₂ ∥ c (Z_lab parallel to direct c)</div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Dual Coordinate Converters + 3D Unit Cell Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Direct Fractional (A·x) & Reciprocal (B·h) Transforms</h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 tabular-nums">
              r·q = {fmt(cartDot, 4)} = x·h ({fmt(fracDot, 4)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Presets:</span>
            {[
              { label: '[¼, ¼, ¼]', x: 0.25, y: 0.25, z: 0.25 },
              { label: '[1, 0, 0] a', x: 1, y: 0, z: 0 },
              { label: '[0, 1, 0] b', x: 0, y: 1, z: 0 },
              { label: '[0, 0, 1] c', x: 0, y: 0, z: 1 },
              { label: '[½, ½, ½]', x: 0.5, y: 0.5, z: 0.5 }
            ].map((p, idx) => (
              <button
                key={`preset-fvec-${idx}`}
                onClick={() => {
                  setFracX(p.x);
                  setFracY(p.y);
                  setFracZ(p.z);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-indigo-300 font-bold border border-slate-800 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Fractional x', val: fracX, set: setFracX, color: 'text-sky-300' },
              { label: 'Fractional y', val: fracY, set: setFracY, color: 'text-violet-300' },
              { label: 'Fractional z', val: fracZ, set: setFracZ, color: 'text-emerald-300' }
            ].map((item) => (
              <div key={item.label} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className={`text-xs font-mono font-bold block ${item.color}`}>{item.label}</span>
                <input
                  type="number"
                  step="0.05"
                  value={item.val}
                  onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 tabular-nums"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono tabular-nums">
            <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Direct r = A · x_frac:</span>
                <span className="text-amber-400 font-bold">||r|| = {fmt(rLen, 4)} Å</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-sky-400 block">X (Å)</span>
                  <span className="text-white font-bold">{fmt(rCartRaw[0], 3)}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-violet-400 block">Y (Å)</span>
                  <span className="text-white font-bold">{fmt(rCartRaw[1], 3)}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block">Z (Å)</span>
                  <span className="text-white font-bold">{fmt(rCartRaw[2], 3)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Scattering q = B · ({h1}{k1}{l1}):</span>
                <span className="text-cyan-300 font-bold">1/d = {fmt(qLen, 4)} Å⁻¹</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-sky-400 block">qx (Å⁻¹)</span>
                  <span className="text-white font-bold">{fmt(qCartRaw[0], 4)}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-violet-400 block">qy (Å⁻¹)</span>
                  <span className="text-white font-bold">{fmt(qCartRaw[1], 4)}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block">qz (Å⁻¹)</span>
                  <span className="text-white font-bold">{fmt(qCartRaw[2], 4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Unit Cell + r_Cart Visualizer */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">3D Cartesian Unit Cell & r_Cart</h4>
            </div>
            <span className="text-[10px] font-mono text-amber-300">Direct Cell Frame (A)</span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            <canvas ref={busingCanvasRef} width={440} height={250} className="w-full h-auto max-h-[250px] object-contain" />
          </div>

          <div className="flex items-center justify-around text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> e₁ ∥ a*
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> e₂
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> e₃ ∥ c
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> r_Cart
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
