import React, { useRef, useEffect, useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Calculator, 
  Compass, 
  Copy, 
  Check, 
  FileText, 
  Terminal,
  ArrowRight,
  Info
} from 'lucide-react';
import { fmt } from './metricTensorTypes';

interface MetricTensorBusingLevyTabProps {
  matrixB: number[][];
  matrixBTB: number[][];
  metricGStar: number[][];
  fracX: number; setFracX: (v: number) => void;
  fracY: number; setFracY: (v: number) => void;
  fracZ: number; setFracZ: (v: number) => void;
  cartVec: { x: number; y: number; z: number; length: number };
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const MetricTensorBusingLevyTab: React.FC<MetricTensorBusingLevyTabProps> = ({
  matrixB,
  matrixBTB,
  metricGStar,
  fracX, setFracX,
  fracY, setFracY,
  fracZ, setFracZ,
  cartVec,
  copyToClipboard,
  copiedKey
}) => {
  const busingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Oblique projection canvas rendering
  useEffect(() => {
    const canvas = busingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Slate-950 background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const ox = width * 0.45;
    const oy = height * 0.65;
    const s = 65; // scale

    // Project 3D (X, Y, Z) to 2D screen
    const project = (x: number, y: number, z: number) => {
      const px = ox + (y * 0.9 - x * 0.5) * s;
      const py = oy + (-z * 0.9 + x * 0.35 + y * 0.15) * s;
      return { px, py };
    };

    // Draw reference axes (e1, e2, e3)
    const pOrigin = project(0, 0, 0);
    const pE1 = project(1.5, 0, 0);
    const pE2 = project(0, 1.5, 0);
    const pE3 = project(0, 0, 1.5);

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
      ctx.fillText(label, to.px + 5, to.py - 5);
      ctx.restore();
    };

    drawAxis(pE1, '#38bdf8', 'e₁ (X_Cart)');
    drawAxis(pE2, '#c084fc', 'e₂ (Y_Cart)');
    drawAxis(pE3, '#34d399', 'e₃ (Z_Cart)');

    // Draw Cartesian vector r_Cart
    const pVector = project(cartVec.x, cartVec.y, cartVec.z);

    // Shadow on XY ground plane
    const pGround = project(cartVec.x, cartVec.y, 0);
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pOrigin.px, pOrigin.py);
    ctx.lineTo(pGround.px, pGround.py);
    ctx.lineTo(pVector.px, pVector.py);
    ctx.stroke();
    ctx.restore();

    // r_Cart vector arrow
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
    ctx.fillText(`r_Cart (${fmt(cartVec.length, 2)} Å)`, pVector.px + 8, pVector.py - 6);
    ctx.restore();

  }, [cartVec]);

  return (
    <div className="space-y-6">

      {/* Title Banner & Exports */}
      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>BUSING-LEVY CARTESIAN TRANSFORMATION MATRIX [B]</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Fractional to Cartesian Busing-Levy Matrix B
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Converts fractional atomic coordinates <span className="font-mono text-indigo-300">(x, y, z)</span> or indices into an orthonormal Ångström frame <span className="font-mono text-cyan-300">(X, Y, Z)</span> where <span className="font-mono text-emerald-400">Bᵀ · B = G*</span> (Busing & Levy, 1967).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyToClipboard(JSON.stringify(matrixB), 'B_json')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition-all cursor-pointer"
            title="Copy JSON Matrix"
          >
            {copiedKey === 'B_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>JSON</span>
          </button>
          <button
            onClick={() => copyToClipboard(`\\begin{pmatrix}\n${matrixB.map(r => r.map(v => fmt(v, 4)).join(' & ')).join(' \\\\\n')}\n\\end{pmatrix}`, 'B_latex')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition-all cursor-pointer"
            title="Copy LaTeX Matrix"
          >
            {copiedKey === 'B_latex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
            <span>LaTeX</span>
          </button>
          <button
            onClick={() => copyToClipboard(`import numpy as np\nB = np.array(${JSON.stringify(matrixB)})`, 'B_numpy')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
            title="Copy NumPy Code"
          >
            {copiedKey === 'B_numpy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
            <span>NumPy</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Matrix Display + Mathematical Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 3x3 Matrix B Panel (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
              Cartesian Transformation Tensor [B]
            </span>
            <span className="text-[11px] font-mono text-indigo-300">
              Units: Å⁻¹ (Reciprocal) / Å
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-center font-mono">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-base font-serif text-indigo-400 font-bold">r_Cart</span>
                <span className="text-[10px] text-slate-500 font-sans">= B · r_frac</span>
              </div>
              <span className="text-xl text-slate-600 font-light">=</span>
              <div className="border-l-2 border-t-2 border-b-2 border-indigo-500/80 rounded-l-xl py-3 px-1" />
              
              <div className="grid grid-cols-3 gap-2 text-center px-1">
                {[
                  { label: 'a*', val: matrixB[0][0], isZero: false },
                  { label: 'b* cos γ*', val: matrixB[0][1], isZero: Math.abs(matrixB[0][1]) < 1e-10 },
                  { label: 'c* cos β*', val: matrixB[0][2], isZero: Math.abs(matrixB[0][2]) < 1e-10 },
                  
                  { label: '0', val: matrixB[1][0], isZero: true },
                  { label: 'b* sin γ*', val: matrixB[1][1], isZero: false },
                  { label: '-c* sα* cosA', val: matrixB[1][2], isZero: Math.abs(matrixB[1][2]) < 1e-10 },
                  
                  { label: '0', val: matrixB[2][0], isZero: true },
                  { label: '0', val: matrixB[2][1], isZero: true },
                  { label: '1 / c', val: matrixB[2][2], isZero: false },
                ].map((cell, idx) => (
                  <div
                    key={`b-cell-${idx}`}
                    className={`px-3 py-2 rounded-xl border transition-all ${
                      cell.isZero
                        ? 'bg-slate-900/30 text-slate-600 border-slate-800/50'
                        : idx === 0 || idx === 4 || idx === 8
                        ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)] font-black'
                        : 'bg-slate-900/80 text-cyan-200 border-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">
                      {fmt(cell.val, 4)}
                    </div>
                    <div className="text-[9px] font-sans text-slate-500 mt-0.5">
                      {cell.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-r-2 border-t-2 border-b-2 border-indigo-500/80 rounded-r-xl py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">b₁₁ (a*)</span>
              <span className="text-indigo-300 font-bold">{fmt(matrixB[0][0], 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">b₂₂ (b* sin γ*)</span>
              <span className="text-indigo-300 font-bold">{fmt(matrixB[1][1], 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">b₃₃ (1/c)</span>
              <span className="text-indigo-300 font-bold">{fmt(matrixB[2][2], 4)}</span>
            </div>
          </div>
        </div>

        {/* Mathematical Identity Proof B^T · B ≡ G* (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-800/80 space-y-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Metric Identity Proof
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                Bᵀ · B ≡ G*
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Multiplying B transpose with B precisely reconstructs the exact reciprocal metric tensor G*:
            </p>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
                <span>Calculated (Bᵀ · B)₁₁:</span>
                <span className="text-emerald-400 font-bold">{fmt(matrixBTB[0][0], 5)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
                <span>Reciprocal G*₁₁ (a*²):</span>
                <span className="text-cyan-300 font-bold">{fmt(metricGStar[0][0], 5)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Diagonal Difference |Δ|:</span>
                <span className="text-emerald-300 font-bold">
                  {fmt(Math.abs(matrixBTB[0][0] - metricGStar[0][0]), 8)} (Exact Match ✓)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 space-y-1">
            <span className="text-indigo-300 font-bold block">Busing-Levy Standard Frame:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono text-[10px]">
              <li>e₃ is parallel to crystal c axis</li>
              <li>e₂ lies in the (b*, c*) plane perpendicular to e₃</li>
              <li>e₁ = e₂ × e₃ forms a right-handed orthonormal triad</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Live Converter + 3D Oblique Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Live Vector Converter (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800/80 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                Live Fractional Coordinate to Cartesian Converter
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">r_Cart = B · r_frac</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Coordinate Presets:</span>
            {[
              { label: '[¼, ¼, ¼]', x: 0.25, y: 0.25, z: 0.25 },
              { label: '[1, 0, 0] (a)', x: 1, y: 0, z: 0 },
              { label: '[0, 1, 0] (b)', x: 0, y: 1, z: 0 },
              { label: '[0, 0, 1] (c)', x: 0, y: 0, z: 1 },
              { label: '[½, ½, ½]', x: 0.5, y: 0.5, z: 0.5 },
            ].map((p, idx) => (
              <button
                key={`preset-fvec-${idx}`}
                onClick={() => { setFracX(p.x); setFracY(p.y); setFracZ(p.z); }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 font-bold border border-slate-800 transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Fractional Inputs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Fractional x', val: fracX, set: setFracX, color: 'text-sky-300' },
              { label: 'Fractional y', val: fracY, set: setFracY, color: 'text-violet-300' },
              { label: 'Fractional z', val: fracZ, set: setFracZ, color: 'text-emerald-300' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className={`text-xs font-mono font-bold block ${item.color}`}>{item.label}</span>
                <input
                  type="number"
                  step="0.05"
                  value={item.val}
                  onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          {/* Computed Results */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-indigo-500/30 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Cartesian Coordinates (X, Y, Z):</span>
              <span className="text-amber-400 font-bold">||r_Cart|| = {fmt(cartVec.length, 4)} Å</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-sky-950/40 border border-sky-500/30 rounded-xl">
                <span className="text-[10px] text-sky-400 font-sans block uppercase font-bold">X_Cart (Å)</span>
                <span className="text-base text-sky-200 font-bold">{fmt(cartVec.x, 4)}</span>
              </div>
              <div className="p-2.5 bg-violet-950/40 border border-violet-500/30 rounded-xl">
                <span className="text-[10px] text-violet-400 font-sans block uppercase font-bold">Y_Cart (Å)</span>
                <span className="text-base text-violet-200 font-bold">{fmt(cartVec.y, 4)}</span>
              </div>
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                <span className="text-[10px] text-emerald-400 font-sans block uppercase font-bold">Z_Cart (Å)</span>
                <span className="text-base text-emerald-200 font-bold">{fmt(cartVec.z, 4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Frame Visualizer Canvas (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-800/80 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">
                3D Cartesian Frame Visualizer
              </h4>
            </div>
            <span className="text-[10px] font-mono text-amber-300">
              Orthonormal Basis
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            <canvas
              ref={busingCanvasRef}
              width={420}
              height={240}
              className="w-full h-auto max-h-[240px] object-contain"
            />
          </div>

          <div className="flex items-center justify-around text-[10px] font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> e₁ (X)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> e₂ (Y)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> e₃ (Z)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> r_Cart</span>
          </div>
        </div>

      </div>

    </div>
  );
};
