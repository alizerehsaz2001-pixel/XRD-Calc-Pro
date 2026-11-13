import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Layers,
  Network,
  ChevronDown,
  ChevronUp,
  Sliders,
  Compass,
  Zap,
  GitBranch,
  Scale,
} from 'lucide-react';
import { NeuralArchId } from './NeuralNetworkWorkbench';

export interface NeuralNetCadSchematicProps {
  selectedArchId: NeuralArchId;
  onSelectArch: (arch: NeuralArchId) => void;
  kernelSize: number;
  onUpdateKernelSize?: (k: number) => void;
  ablationSkipLinks: boolean;
  onToggleSkipLinks: () => void;
  ablationPinnLoss: boolean;
  onTogglePinnLoss: () => void;
  stressStrainShiftDeg: number;
  onUpdateStrainShift: (val: number) => void;
  vegardFraction: number;
  onUpdateVegardFraction: (val: number) => void;
}

type SchematicMode = 'conv_receptive' | 'attn_pinn' | 'latent_manifold';

export const NeuralNetCadSchematic: React.FC<NeuralNetCadSchematicProps> = ({
  selectedArchId,
  onSelectArch,
  kernelSize,
  onUpdateKernelSize,
  ablationSkipLinks,
  onToggleSkipLinks,
  ablationPinnLoss,
  onTogglePinnLoss,
  stressStrainShiftDeg,
  onUpdateStrainShift,
  vegardFraction,
  onUpdateVegardFraction,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [mode, setMode] = useState<SchematicMode>('conv_receptive');
  const [dilationFactor, setDilationFactor] = useState<1 | 2 | 4>(2);
  const [selectedBravaisRule, setSelectedBravaisRule] = useState<'P' | 'I' | 'F' | 'C'>('I');

  // Receptive field calculation for 3 stacked dilated layers: RF = 1 + sum_l (K - 1) * d_l
  const effectiveReceptiveFieldBins = useMemo(() => {
    const d1 = 1;
    const d2 = dilationFactor;
    const d3 = dilationFactor * 2;
    return 1 + (kernelSize - 1) * (d1 + d2 + d3);
  }, [kernelSize, dilationFactor]);

  const effectiveReceptiveFieldDeg = useMemo(() => {
    return (effectiveReceptiveFieldBins * 0.04).toFixed(2);
  }, [effectiveReceptiveFieldBins]);

  // Mode 1 synthetic doublet & conv response
  const convWaveform = useMemo(() => {
    const pts: Array<{ x: number; rawY: number; convY: number; kernelY: number }> = [];
    const n = 90;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1); // 0 to 1
      const deg = 25.0 + u * 4.0; // 25° to 29° 2theta
      const center1 = 26.64 + stressStrainShiftDeg;
      const center2 = 26.72 + stressStrainShiftDeg; // Ka2 shoulder
      const g1 = Math.exp(-Math.pow(deg - center1, 2) / (2 * 0.14 * 0.14));
      const g2 = 0.5 * Math.exp(-Math.pow(deg - center2, 2) / (2 * 0.14 * 0.14));
      const raw = Math.min(1, g1 + g2 + 0.04 * Math.sin(i * 1.7));

      // Convolved & skip-preserved activation
      const widthScale = 0.12 + (kernelSize - 3) * 0.018 * dilationFactor * 0.4;
      const c1 = Math.exp(-Math.pow(deg - center1, 2) / (2 * widthScale * widthScale));
      const conv = Math.min(
        1,
        (ablationSkipLinks ? 0.55 * raw + 0.55 * c1 : 0.72 * c1)
      );

      // Kernel footprint centered at 26.64°
      const span = (kernelSize * dilationFactor * 0.038);
      const dist = Math.abs(deg - center1);
      const kEnv = dist <= span ? Math.cos((dist / span) * (Math.PI / 2)) : 0;

      pts.push({
        x: 35 + u * 315,
        rawY: 162 - raw * 96,
        convY: 162 - conv * 102,
        kernelY: 162 - kEnv * 65,
      });
    }
    return pts;
  }, [kernelSize, dilationFactor, stressStrainShiftDeg, ablationSkipLinks]);

  return (
    <div className="bg-[#070A12] border border-slate-800 rounded-sm overflow-hidden">
      {/* Header Bar — Strict Zero-Pill Discipline */}
      <div className="px-4 py-2.5 bg-[#0B0F19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
            [CAD-NN // NEURAL CRYSTALLOGRAPHY TOPOLOGY & PHYSICS-INFORMED TENSOR PIPELINE]
          </span>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            Backbone: <strong className="text-white uppercase">{selectedArchId}</strong> · RF ={' '}
            <strong className="text-cyan-400">{effectiveReceptiveFieldDeg}° 2θ</strong> ({effectiveReceptiveFieldBins} bins)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 3-Mode Selector */}
          <div className="flex items-center bg-[#070A12] border border-slate-800 p-0.5 rounded-sm">
            {[
              { id: 'conv_receptive', label: '01. 1D Dilated Conv & RF' },
              { id: 'attn_pinn', label: '02. Harmonic MHSA & PINN Gate' },
              { id: 'latent_manifold', label: '03. Hypersphere z ∈ S¹²⁷ & Vegard' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id as SchematicMode);
                  if (!isOpen) setIsOpen(true);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold transition-colors cursor-pointer rounded-sm ${
                  mode === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 bg-[#070A12] hover:bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer rounded-sm"
          >
            <span>{isOpen ? 'Collapse CAD' : 'Expand CAD'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-[#070A12] space-y-3">
          {/* Interactive CAD Control Strip */}
          <div className="px-3 py-2 bg-[#0B0F19] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {mode === 'conv_receptive' && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Kernel Width K:
                  </span>
                  {[3, 5, 7, 9].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onUpdateKernelSize && onUpdateKernelSize(k)}
                      className={`px-2 py-0.5 border text-[11px] font-mono font-bold cursor-pointer rounded-sm ${
                        kernelSize === k
                          ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300'
                          : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      K={k}
                    </button>
                  ))}

                  <span className="text-slate-700">|</span>
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Dilation d:
                  </span>
                  {([1, 2, 4] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDilationFactor(d)}
                      className={`px-2 py-0.5 border text-[11px] font-mono font-bold cursor-pointer rounded-sm ${
                        dilationFactor === d
                          ? 'bg-cyan-600/25 border-cyan-500 text-cyan-300'
                          : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      d={d}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onToggleSkipLinks}
                    className={`px-2.5 py-0.5 border text-[11px] font-mono font-bold cursor-pointer rounded-sm ${
                      ablationSkipLinks
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {ablationSkipLinks ? '● Identity Skip (+x_l) ON' : '▲ Identity Skip OFF'}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Strain Δ2θ:</span>
                    <input
                      type="range"
                      min="-0.35"
                      max="0.35"
                      step="0.05"
                      value={stressStrainShiftDeg}
                      onChange={(e) => onUpdateStrainShift(parseFloat(e.target.value))}
                      className="w-20 accent-indigo-500 h-1 cursor-pointer"
                    />
                    <span className="text-[11px] text-indigo-300 font-bold tabular-nums w-12 text-right">
                      {stressStrainShiftDeg >= 0
                        ? `+${stressStrainShiftDeg.toFixed(2)}°`
                        : `${stressStrainShiftDeg.toFixed(2)}°`}
                    </span>
                  </div>
                </div>
              </>
            )}

            {mode === 'attn_pinn' && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Bravais Extinction Rule Gate:
                  </span>
                  {[
                    { id: 'P', label: 'P (All hkl allowed)' },
                    { id: 'I', label: 'I (h+k+l = 2n)' },
                    { id: 'F', label: 'F (h,k,l unmixed)' },
                    { id: 'C', label: 'C (h+k = 2n)' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBravaisRule(b.id as any)}
                      className={`px-2 py-0.5 border text-[11px] font-mono font-bold cursor-pointer rounded-sm ${
                        selectedBravaisRule === b.id
                          ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                          : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onTogglePinnLoss}
                    className={`px-2.5 py-0.5 border text-[11px] font-mono font-bold cursor-pointer rounded-sm ${
                      ablationPinnLoss
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {ablationPinnLoss
                      ? '● PINN Extinction Penalty Active'
                      : '▲ Unconstrained Softmax (PINN Off)'}
                  </button>
                </div>
              </>
            )}

            {mode === 'latent_manifold' && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Vegard Solid-Solution Geodesic Ti₁₋ₓZrₓO₂:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={vegardFraction}
                    onChange={(e) => onUpdateVegardFraction(parseFloat(e.target.value))}
                    className="w-32 accent-fuchsia-500 h-1 cursor-pointer"
                  />
                  <span className="text-fuchsia-300 font-bold tabular-nums">
                    x = {vegardFraction.toFixed(2)} (a_eff = {(4.593 + vegardFraction * 0.215).toFixed(3)} Å)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">Active Backbone:</span>
                  {(['resnet1d', 'xrd_former', 'pinn_bragg', 'crystal_gnn', 'vae_manifold'] as NeuralArchId[]).map(
                    (id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSelectArch(id)}
                        className={`px-2 py-0.5 border text-[10px] font-mono font-bold uppercase cursor-pointer rounded-sm ${
                          selectedArchId === id
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {id.replace('_', '-')}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* MODE 1 SVG: 1D SPECTRAL CONVOLUTION & DILATED RECEPTIVE FIELD */}
          {mode === 'conv_receptive' && (
            <div className="bg-[#050811] border border-slate-800 p-3 rounded-sm">
              <svg
                viewBox="0 0 860 220"
                className="w-full h-auto select-none"
                role="img"
                aria-label="1D Dilated Convolution and Receptive Field Schematic"
              >
                <defs>
                  <linearGradient id="convFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="kernelFillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Left Panel Frame: Spectral Domain 2theta */}
                <rect
                  x="15"
                  y="14"
                  width="355"
                  height="192"
                  fill="#070B14"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x="26"
                  y="31"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  A. Caglioti-Matched Conv1D Filter Bank (K={kernelSize}, d={dilationFactor})
                </text>

                {/* Grid lines */}
                {[65, 100, 135, 162].map((gy) => (
                  <line
                    key={gy}
                    x1="30"
                    y1={gy}
                    x2="355"
                    y2={gy}
                    stroke="#1e293b"
                    strokeDasharray="2 3"
                  />
                ))}

                {/* Kernel Receptive Field Footprint Area */}
                <polygon
                  fill="url(#kernelFillGrad)"
                  points={`35,162 ${convWaveform
                    .map((p) => `${p.x.toFixed(1)},${p.kernelY.toFixed(1)}`)
                    .join(' ')} 350,162`}
                />

                {/* Raw K-alpha1/K-alpha2 Doublet */}
                <polyline
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.3"
                  strokeDasharray="3 2"
                  points={convWaveform
                    .map((p) => `${p.x.toFixed(1)},${p.rawY.toFixed(1)}`)
                    .join(' ')}
                />

                {/* Convolved Activation Output */}
                <polygon
                  fill="url(#convFillGrad)"
                  points={`35,162 ${convWaveform
                    .map((p) => `${p.x.toFixed(1)},${p.convY.toFixed(1)}`)
                    .join(' ')} 350,162`}
                />
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  points={convWaveform
                    .map((p) => `${p.x.toFixed(1)},${p.convY.toFixed(1)}`)
                    .join(' ')}
                />

                {/* Dilated Sampling Stencil Ticks */}
                {Array.from({ length: kernelSize }).map((_, idx) => {
                  const offsetIdx = idx - Math.floor(kernelSize / 2);
                  const centerPx = 165 + stressStrainShiftDeg * 78;
                  const sampleX = centerPx + offsetIdx * dilationFactor * 9.5;
                  if (sampleX < 35 || sampleX > 350) return null;
                  return (
                    <g key={idx}>
                      <line
                        x1={sampleX}
                        y1={55}
                        x2={sampleX}
                        y2={162}
                        stroke="#818cf8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <circle cx={sampleX} cy={55} r="3" fill="#6366f1" />
                    </g>
                  );
                })}

                <text x="34" y="182" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                  --- Raw Kα₁/Kα₂ Doublet
                </text>
                <text x="168" y="182" fill="#22d3ee" fontSize="8.5" fontFamily="monospace">
                  ─── Feature Map A_k(2θ)
                </text>
                <text x="292" y="182" fill="#818cf8" fontSize="8.5" fontFamily="monospace">
                  ● Stencil
                </text>

                {/* Right Panel Frame: Dilated Residual Hierarchy & Skip Link */}
                <rect
                  x="385"
                  y="14"
                  width="460"
                  height="192"
                  fill="#070B14"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x="398"
                  y="31"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  B. Multi-Scale Dilated Residual Block & Receptive Field Growth
                </text>

                {/* 3 Stacked Dilated Conv Layers in SVG */}
                {[
                  { level: 0, label: 'Layer l: Conv1D (d=1)', y: 145, nodes: 9, color: '#38bdf8' },
                  {
                    level: 1,
                    label: `Layer l+1: Dilated (d=${dilationFactor})`,
                    y: 102,
                    nodes: 7,
                    color: '#818cf8',
                  },
                  {
                    level: 2,
                    label: `Layer l+2: Dilated (d=${dilationFactor * 2})`,
                    y: 58,
                    nodes: 5,
                    color: '#34d399',
                  },
                ].map((row, rIdx) => (
                  <g key={row.level}>
                    <text
                      x="400"
                      y={row.y + 4}
                      fill={row.color}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {row.label}
                    </text>
                    {Array.from({ length: row.nodes }).map((_, nIdx) => {
                      const nx = 545 + nIdx * (180 / Math.max(1, row.nodes - 1));
                      return (
                        <g key={nIdx}>
                          {rIdx < 2 && (
                            <>
                              <line
                                x1={nx}
                                y1={row.y - 6}
                                x2={635}
                                y2={row.y - 36}
                                stroke={row.color}
                                strokeWidth="0.9"
                                opacity="0.45"
                              />
                            </>
                          )}
                          <rect
                            x={nx - 7}
                            y={row.y - 6}
                            width="14"
                            height="12"
                            rx="2"
                            fill="#0f172a"
                            stroke={row.color}
                            strokeWidth="1.2"
                          />
                        </g>
                      );
                    })}
                  </g>
                ))}

                {/* Identity Residual Skip Arc */}
                <path
                  d="M 745 145 C 805 145, 805 58, 745 58"
                  fill="none"
                  stroke={ablationSkipLinks ? '#10b981' : '#475569'}
                  strokeWidth="1.8"
                  strokeDasharray={ablationSkipLinks ? 'none' : '3 3'}
                />
                <circle
                  cx="788"
                  cy="101"
                  r="11"
                  fill="#0f172a"
                  stroke={ablationSkipLinks ? '#10b981' : '#475569'}
                  strokeWidth="1.4"
                />
                <text
                  x="788"
                  y="104.5"
                  textAnchor="middle"
                  fill={ablationSkipLinks ? '#34d399' : '#64748b'}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  +x
                </text>

                {/* Formula Footer Box */}
                <rect
                  x="398"
                  y="168"
                  width="434"
                  height="26"
                  fill="#050811"
                  stroke="#1e293b"
                />
                <text
                  x="408"
                  y="185"
                  fill="#cbd5e1"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  h_(l+1) = σ(BN(W_2 *_{'{d}'} σ(BN(W_1 * x_l)))) {ablationSkipLinks ? '+ x_l' : '[Skip Disabled]'}  |  RF = {effectiveReceptiveFieldDeg}° 2θ
                </text>
              </svg>
            </div>
          )}

          {/* MODE 2 SVG: SELF-ATTENTION HARMONIC COUPLING & PINN EXTINCTION GATE */}
          {mode === 'attn_pinn' && (
            <div className="bg-[#050811] border border-slate-800 p-3 rounded-sm">
              <svg
                viewBox="0 0 860 220"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Harmonic Multi-Head Self Attention and PINN Systematic Absence Gate"
              >
                {/* Left Panel: Harmonic Self-Attention across 2theta */}
                <rect
                  x="15"
                  y="14"
                  width="415"
                  height="192"
                  fill="#070B14"
                  stroke="#1e293b"
                />
                <text
                  x="26"
                  y="31"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  A. Long-Range Harmonic Self-Attention: Attn(Q,K,V) + B_Bragg
                </text>

                {/* Attention arcs linking (100) <-> (200) <-> (300) */}
                <path
                  d="M 78 96 C 135 34, 215 34, 262 96"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
                <path
                  d="M 78 96 C 175 18, 305 18, 382 96"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="1.6"
                  strokeDasharray="4 2"
                />
                <path
                  d="M 262 96 C 300 48, 345 48, 382 96"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />

                <text x="170" y="50" textAnchor="middle" fill="#22d3ee" fontSize="8.5" fontFamily="monospace">
                  α_(100↔200) = 0.94 (q₂/q₁ = 2.000)
                </text>
                <text x="245" y="34" textAnchor="middle" fill="#a5b4fc" fontSize="8.5" fontFamily="monospace">
                  α_(100↔300) = 0.89 (q₃/q₁ = 3.000)
                </text>

                {/* Baseline */}
                <line x1="35" y1="165" x2="412" y2="165" stroke="#334155" strokeWidth="1.2" />

                {/* Peaks along 2theta */}
                {[
                  { x: 78, h: 68, hkl: '(100)', deg: '21.4°', color: '#22d3ee' },
                  { x: 145, h: 42, hkl: '(110)', deg: '30.4°', color: '#64748b' },
                  { x: 205, h: 35, hkl: '(111)', deg: '37.5°', color: '#64748b' },
                  { x: 262, h: 58, hkl: '(200)', deg: '43.6°', color: '#22d3ee' },
                  { x: 322, h: 28, hkl: '(211)', deg: '54.1°', color: '#64748b' },
                  { x: 382, h: 46, hkl: '(300)', deg: '67.3°', color: '#34d399' },
                ].map((pk, idx) => (
                  <g key={idx}>
                    <line
                      x1={pk.x}
                      y1={165}
                      x2={pk.x}
                      y2={165 - pk.h}
                      stroke={pk.color}
                      strokeWidth="3"
                    />
                    <circle cx={pk.x} cy={165 - pk.h} r="4" fill={pk.color} />
                    <text
                      x={pk.x}
                      y={165 - pk.h - 8}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {pk.hkl}
                    </text>
                    <text
                      x={pk.x}
                      y={180}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {pk.deg}
                    </text>
                  </g>
                ))}

                {/* Right Panel: PINN Space-Group Systematic Absence Gate */}
                <rect
                  x="442"
                  y="14"
                  width="403"
                  height="192"
                  fill="#070B14"
                  stroke="#1e293b"
                />
                <text
                  x="454"
                  y="31"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  B. PINN Systematic Absence Gate — Bravais [{selectedBravaisRule}] Centering
                </text>

                {[
                  { hkl: '(100)', sum: 1, parity: 'mixed', hkSum: 1 },
                  { hkl: '(110)', sum: 2, parity: 'mixed', hkSum: 2 },
                  { hkl: '(111)', sum: 3, parity: 'odd', hkSum: 2 },
                  { hkl: '(200)', sum: 2, parity: 'even', hkSum: 2 },
                  { hkl: '(210)', sum: 3, parity: 'mixed', hkSum: 3 },
                  { hkl: '(220)', sum: 4, parity: 'even', hkSum: 4 },
                ].map((ref, idx) => {
                  const allowed =
                    selectedBravaisRule === 'P'
                      ? true
                      : selectedBravaisRule === 'I'
                        ? ref.sum % 2 === 0
                        : selectedBravaisRule === 'F'
                          ? ref.parity === 'even' || ref.parity === 'odd'
                          : ref.hkSum % 2 === 0;

                  const yPos = 50 + idx * 24;
                  const gateVal = allowed ? '1.00' : ablationPinnLoss ? '0.00' : '0.42';

                  return (
                    <g key={ref.hkl}>
                      <rect
                        x="456"
                        y={yPos - 11}
                        width="374"
                        height="20"
                        fill={allowed ? '#064e3b30' : '#4c051930'}
                        stroke={allowed ? '#10b98150' : '#f43f5e50'}
                      />
                      <text
                        x="466"
                        y={yPos + 2}
                        fill="#f8fafc"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        hkl {ref.hkl}
                      </text>
                      <text
                        x="545"
                        y={yPos + 2}
                        fill="#94a3b8"
                        fontSize="8.5"
                        fontFamily="monospace"
                      >
                        h+k+l={ref.sum}
                      </text>
                      <text
                        x="635"
                        y={yPos + 2}
                        fill={allowed ? '#34d399' : '#fb7185'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {allowed ? '● ALLOWED (|F|² > 0)' : '■ EXTINCT (|F|² = 0)'}
                      </text>
                      <text
                        x="818"
                        y={yPos + 2}
                        textAnchor="end"
                        fill={allowed ? '#22d3ee' : '#f43f5e'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        G={gateVal}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* MODE 3 SVG: HYPERSPHERICAL LATENT MANIFOLD & VEGARD GEODESICS */}
          {mode === 'latent_manifold' && (
            <div className="bg-[#050811] border border-slate-800 p-3 rounded-sm">
              <svg
                viewBox="0 0 860 220"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Hyperspherical Latent Manifold and Vegard Law Interpolation"
              >
                {/* Left Panel: Unit Hypersphere S^127 Cosine Retrieval */}
                <rect
                  x="15"
                  y="14"
                  width="410"
                  height="192"
                  fill="#070B14"
                  stroke="#1e293b"
                />
                <text
                  x="26"
                  y="31"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  A. Unit Hypersphere Embedding ||z||₂ = 1 & Vegard Geodesic
                </text>

                {/* Hypersphere Circle & Equatorial Ellipse */}
                <circle
                  cx="165"
                  cy="118"
                  r="68"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1.4"
                />
                <ellipse
                  cx="165"
                  cy="118"
                  rx="68"
                  ry="22"
                  fill="none"
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <ellipse
                  cx="165"
                  cy="118"
                  rx="22"
                  ry="68"
                  fill="none"
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />

                {/* End-member A (TiO2) and End-member B (ZrO2) */}
                <line x1="165" y1="118" x2="112" y2="75" stroke="#22d3ee" strokeWidth="1.5" />
                <circle cx="112" cy="75" r="4.5" fill="#22d3ee" />
                <text x="98" y="66" fill="#22d3ee" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  z(TiO₂)
                </text>

                <line x1="165" y1="118" x2="220" y2="78" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="220" cy="78" r="4.5" fill="#a855f7" />
                <text x="210" y="67" fill="#c084fc" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  z(ZrO₂)
                </text>

                {/* Geodesic Arc between z_A and z_B */}
                <path
                  d="M 112 75 Q 166 48 220 78"
                  fill="none"
                  stroke="#f472b6"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />

                {/* Interpolated Solid Solution Vector z(x) */}
                {(() => {
                  const gx = 112 + vegardFraction * 108;
                  const gy = 75 - Math.sin(vegardFraction * Math.PI) * 14 + vegardFraction * 3;
                  return (
                    <g>
                      <line x1="165" y1="118" x2={gx} y2={gy} stroke="#f43f5e" strokeWidth="2" />
                      <circle cx={gx} cy={gy} r="5.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.2" />
                      <text
                        x={gx}
                        y={gy - 9}
                        textAnchor="middle"
                        fill="#fda4af"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        z(x={vegardFraction.toFixed(2)})
                      </text>
                    </g>
                  );
                })()}

                {/* Right side of Panel A: Cosine Similarity Readout */}
                <rect x="255" y="48" width="156" height="142" fill="#050811" stroke="#1e293b" />
                <text x="265" y="65" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  LATENT METRIC SPACE
                </text>
                <text x="265" y="84" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  cos(z, z_TiO₂) = {(1 - vegardFraction * 0.34).toFixed(3)}
                </text>
                <text x="265" y="102" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  cos(z, z_ZrO₂) = {(0.66 + vegardFraction * 0.34).toFixed(3)}
                </text>
                <text x="265" y="122" fill="#22d3ee" fontSize="8" fontFamily="monospace">
                  Vegard a(x): {(4.593 + vegardFraction * 0.215).toFixed(3)} Å
                </text>
                <text x="265" y="140" fill="#34d399" fontSize="8" fontFamily="monospace">
                  Vegard c(x): {(2.959 + vegardFraction * 0.185).toFixed(3)} Å
                </text>
                <text x="265" y="162" fill="#f472b6" fontSize="8" fontFamily="monospace">
                  KL Div D_KL: {(0.042 + vegardFraction * 0.015).toFixed(3)}
                </text>
                <text x="265" y="179" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                  Manifold dim: ℝ¹²⁸
                </text>

                {/* Right Panel: Dirichlet Simplex Multi-Phase Unmixing */}
                <rect
                  x="440"
                  y="14"
                  width="405"
                  height="192"
                  fill="#070B14"
                  stroke="#1e293b"
                />
                <text
                  x="452"
                  y="31"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  B. Dirichlet Simplex QPA Head (∑ w_p = 100.0 wt%)
                </text>

                {/* Ternary Simplex Triangle */}
                <polygon
                  points="565,52 490,175 640,175"
                  fill="#0f172a"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <line x1="565" y1="52" x2="565" y2="175" stroke="#1e293b" strokeDasharray="2 2" />
                <line x1="490" y1="175" x2="602" y2="113" stroke="#1e293b" strokeDasharray="2 2" />
                <line x1="640" y1="175" x2="527" y2="113" stroke="#1e293b" strokeDasharray="2 2" />

                <text x="565" y="44" textAnchor="middle" fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  Phase α ({((1 - vegardFraction * 0.6) * 85).toFixed(0)}%)
                </text>
                <text x="482" y="190" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  Phase β ({(vegardFraction * 60 * 0.85).toFixed(0)}%)
                </text>
                <text x="648" y="190" textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  Amorphous (15%)
                </text>

                {/* Active Composition Point inside Simplex */}
                {(() => {
                  const wA = (1 - vegardFraction * 0.6) * 0.85;
                  const wB = vegardFraction * 0.6 * 0.85;
                  const wC = 0.15;
                  const px = 565 * wA + 490 * wB + 640 * wC;
                  const py = 52 * wA + 175 * wB + 175 * wC;
                  return (
                    <g>
                      <circle cx={px} cy={py} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx={px} cy={py} r="12" fill="none" stroke="#10b981" strokeDasharray="2 2" />
                    </g>
                  );
                })()}

                {/* Simplex Formula Box */}
                <rect x="670" y="52" width="160" height="136" fill="#050811" stroke="#1e293b" />
                <text x="680" y="70" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  DIRICHLET HEAD
                </text>
                <text x="680" y="90" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  p(w | z) = Dir(w; α(z))
                </text>
                <text x="680" y="110" fill="#34d399" fontSize="8" fontFamily="monospace">
                  α_p = Softplus(W_qpa z) + 1
                </text>
                <text x="680" y="130" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                  RIR Scaling: I_p / (I/I_c)_p
                </text>
                <text x="680" y="150" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                  Constraint: ∑ w_p = 1.000
                </text>
                <text x="680" y="170" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                  Epistemic σ_w: ±0.8 wt%
                </text>
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
