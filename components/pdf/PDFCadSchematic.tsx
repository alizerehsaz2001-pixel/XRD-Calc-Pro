import React, { useState, useMemo } from 'react';
import { PDFCoordinationShell, PDFSimulationConfig, evaluateShapeEnvelope } from '../../utils/pdfEngine';
import { Orbit, Layers, Activity, Zap, Crosshair } from 'lucide-react';
import katex from 'katex';

interface PDFCadSchematicProps {
  shells: PDFCoordinationShell[];
  config: PDFSimulationConfig;
  deltaRResolutionA: number;
  terminationRipplePeriodA: number;
  rwFactorPct: number;
  onUpdateConfig: (partial: Partial<PDFSimulationConfig>) => void;
  onSelectShellForIntegration?: (shell: PDFCoordinationShell) => void;
}

export const PDFCadSchematic: React.FC<PDFCadSchematicProps> = ({
  shells,
  config,
  deltaRResolutionA,
  terminationRipplePeriodA,
  rwFactorPct,
  onUpdateConfig,
  onSelectShellForIntegration
}) => {
  const [activeMode, setActiveMode] = useState<'pipeline' | 'shellsEnvelope' | 'functionsRipples'>('pipeline');
  const [selectedRingIdx, setSelectedRingIdx] = useState<number>(0);

  // Pre-rendered KaTeX equations
  const eqSineFourier = useMemo(
    () =>
      katex.renderToString(
        'G(r) = \\frac{2}{\\pi} \\int_{Q_{\\min}}^{Q_{\\max}} Q\\,[S(Q) - 1]\\,W(Q) \\sin(Q r)\\, dQ = 4\\pi r \\left[\\rho(r) - \\rho_0 \\gamma_0(r)\\right]',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqShapeEnvelope = useMemo(
    () =>
      katex.renderToString(
        '\\gamma_0(r; D) = \\begin{cases} 1 - \\frac{3}{2}\\left(\\frac{r}{D}\\right) + \\frac{1}{2}\\left(\\frac{r}{D}\\right)^3 & r \\le D \\\\ 0 & r > D \\end{cases}, \\quad \\sigma_{\\text{eff}}(r) = \\sigma_0 \\sqrt{1 - \\frac{\\delta_1}{r}}',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqLorchWindow = useMemo(
    () =>
      katex.renderToString(
        'W_{\\text{Lorch}}(Q) = \\frac{\\sin(\\pi Q / Q_{\\max})}{\\pi Q / Q_{\\max}}, \\quad \\Delta r_{\\min} = \\frac{\\pi}{Q_{\\max}}, \\quad \\lambda_{\\text{ripple}} = \\frac{2\\pi}{Q_{\\max}}',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  // Generate SVG path for Mode 1 live reciprocal F(Q) and real-space G(r) preview
  const mode1SvgPaths = useMemo(() => {
    const qMaxNorm = Math.min(30, Math.max(6, config.qMax));
    const cutoffX = 24 + ((qMaxNorm - 6) / 24) * 186;

    // Reciprocal wave path
    const fPts: string[] = [];
    const envTopPts: string[] = [];
    const envBotPts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const q = 0.5 + u * 29.5;
      const x = 18 + u * 192;
      let w = 1.0;
      if (q > qMaxNorm) {
        w = 0;
      } else if (config.windowFunction === 'lorch') {
        const arg = (Math.PI * q) / qMaxNorm;
        w = arg > 1e-5 ? Math.sin(arg) / arg : 1.0;
      } else if (config.windowFunction === 'cosine_bell') {
        w = Math.cos((0.5 * Math.PI * q) / qMaxNorm);
      }
      const amp = 26 * Math.exp(-0.04 * q) * w;
      const y = 62 - amp * Math.sin(q * 1.65);
      fPts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
      if (q <= qMaxNorm + 0.5) {
        envTopPts.push(`${envTopPts.length === 0 ? 'M' : 'L'} ${x.toFixed(1)},${(62 - amp).toFixed(1)}`);
        envBotPts.push(`${envBotPts.length === 0 ? 'M' : 'L'} ${x.toFixed(1)},${(62 + amp).toFixed(1)}`);
      }
    }

    // Real-space peak + exact Fourier termination ripples around r1 via numerical quadrature of W(Q)
    const gPts: string[] = [];
    const nQInt = 64;
    const dQInt = qMaxNorm / nQInt;
    const sigmaBond = 0.045;

    // Normalize peak height at dr = 0
    let normPeak = 0;
    for (let k = 1; k <= nQInt; k++) {
      const qVal = k * dQInt;
      let wVal = 1.0;
      if (config.windowFunction === 'lorch') {
        const arg = (Math.PI * qVal) / qMaxNorm;
        wVal = Math.sin(arg) / arg;
      } else if (config.windowFunction === 'cosine_bell') {
        wVal = Math.cos((0.5 * Math.PI * qVal) / qMaxNorm);
      }
      normPeak += wVal * Math.exp(-0.5 * sigmaBond * sigmaBond * qVal * qVal) * dQInt;
    }
    normPeak = Math.max(1e-6, normPeak);

    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const dr = (u - 0.5) * 2.8; // -1.4 to +1.4 Å around r1
      const x = 258 + u * 184;

      let sumCos = 0;
      for (let k = 1; k <= nQInt; k++) {
        const qVal = k * dQInt;
        let wVal = 1.0;
        if (config.windowFunction === 'lorch') {
          const arg = (Math.PI * qVal) / qMaxNorm;
          wVal = Math.sin(arg) / arg;
        } else if (config.windowFunction === 'cosine_bell') {
          wVal = Math.cos((0.5 * Math.PI * qVal) / qMaxNorm);
        }
        sumCos +=
          wVal *
          Math.exp(-0.5 * sigmaBond * sigmaBond * qVal * qVal) *
          Math.cos(qVal * dr) *
          dQInt;
      }

      const normalizedKernel = sumCos / normPeak;
      const y = 78 - 52 * normalizedKernel;
      gPts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return {
      cutoffX,
      fPath: fPts.join(' '),
      envTopPath: envTopPts.join(' '),
      envBotPath: envBotPts.join(' '),
      gPath: gPts.join(' ')
    };
  }, [config.qMax, config.windowFunction]);

  // Generate SVG path for Mode 2 Spherical Nanoparticle Envelope gamma_0(r; D)
  const envelopeSvgPath = useMemo(() => {
    const pts: string[] = [];
    const rMaxPlot = Math.max(15, config.rMax);
    for (let i = 0; i <= 50; i++) {
      const r = (i / 50) * rMaxPlot;
      const g0 = evaluateShapeEnvelope(
        r,
        config.domainDiameterNm,
        config.isAmorphous,
        config.amorphousCorrelationA
      );
      const x = 32 + (i / 50) * 380;
      const y = 96 - g0 * 68;
      pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [config.domainDiameterNm, config.isAmorphous, config.amorphousCorrelationA, config.rMax]);

  const activeShell = shells[selectedRingIdx] || shells[0];

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
      {/* Top Header & 3-Mode Interactive Segmented Control */}
      <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold">Total Scattering Metrology</span>
            <span aria-hidden="true">·</span>
            <span>Sine Fourier Inversion S(Q) → G(r)</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-slate-300">Δr_min = {deltaRResolutionA.toFixed(3)} Å</span>
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
            Interactive Reciprocal-to-Real-Space Pair Distribution Function Architecture
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#0B0F19] p-1 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('pipeline')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeMode === 'pipeline'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>01. S(Q) → G(r) Fourier Pipeline</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('shellsEnvelope')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeMode === 'shellsEnvelope'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-indigo-400" />
            <span>02. Coordination Shells &amp; γ₀(r; D)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('functionsRipples')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeMode === 'functionsRipples'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>03. Termination Ripples &amp; PDF Family</span>
          </button>
        </div>
      </div>

      {/* MODE 1: FOURIER PIPELINE & LIVE Q_MAX RESOLUTION SIMULATOR */}
      {activeMode === 'pipeline' && (
        <div className="p-4 space-y-4">
          {/* Live Interactive Dual-Viewport CAD Schematic: Reciprocal F(Q) -> Sine Transform -> Real-Space G(r) */}
          <div className="bg-[#070A12] border border-slate-800 rounded p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 mb-2">
              <span className="text-cyan-300 font-semibold">
                FIG 1 · LIVE FOURIER TRANSFORMATION CAD SCHEMATIC (RECIPROCAL F(Q)·W(Q) → REAL-SPACE PEAK &amp; RIPPLES)
              </span>
              <span className="tabular-nums text-slate-300">
                Q_max = {config.qMax.toFixed(1)} Å⁻¹ · Window = {config.windowFunction.toUpperCase()} · Ripple λ = {terminationRipplePeriodA.toFixed(2)} Å
              </span>
            </div>

            <svg viewBox="0 0 460 118" className="w-full h-32 bg-[#050811] border border-slate-800 rounded select-none">
              {/* Left Viewport: Reciprocal Space F(Q) * W(Q) */}
              <line x1="18" y1="62" x2="212" y2="62" stroke="#334155" strokeWidth="0.9" strokeDasharray="3 2" />
              <path d={mode1SvgPaths.envTopPath} fill="none" stroke="#10b981" strokeWidth="0.9" strokeDasharray="2 2" />
              <path d={mode1SvgPaths.envBotPath} fill="none" stroke="#10b981" strokeWidth="0.9" strokeDasharray="2 2" />
              <path d={mode1SvgPaths.fPath} fill="none" stroke="#38bdf8" strokeWidth="1.6" />

              {/* Q_max Guillotine Cutoff Marker */}
              <line
                x1={mode1SvgPaths.cutoffX}
                y1="14"
                x2={mode1SvgPaths.cutoffX}
                y2="104"
                stroke="#f59e0b"
                strokeWidth="1.4"
                strokeDasharray="3 2"
              />
              <text
                x={Math.min(205, mode1SvgPaths.cutoffX)}
                y="12"
                textAnchor="end"
                fill="#fbbf24"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Q_max = {config.qMax.toFixed(1)} Å⁻¹
              </text>
              <text x="20" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                Reciprocal F(Q)·W(Q)
              </text>
              <text x="20" y="110" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                Q = (4π/λ)sinθ [Å⁻¹] →
              </text>

              {/* Center Fourier Operator Arrow */}
              <line x1="220" y1="60" x2="248" y2="60" stroke="#818cf8" strokeWidth="1.6" />
              <polygon points="248,60 242,56 242,64" fill="#818cf8" />
              <text x="234" y="50" textAnchor="middle" fill="#a5b4fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
                ∫sin(Qr)
              </text>

              {/* Right Viewport: Real-Space Single Bond Peak & Sinc Ripples */}
              <line x1="258" y1="78" x2="442" y2="78" stroke="#334155" strokeWidth="0.9" strokeDasharray="3 2" />
              <path d={mode1SvgPaths.gPath} fill="none" stroke="#22d3ee" strokeWidth="1.8" />
              <line x1="350" y1="22" x2="350" y2="96" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2 2" />
              <text x="262" y="18" fill="#22d3ee" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                Real-Space Peak G(r)
              </text>
              <text x="356" y="32" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
                Δr_min = {deltaRResolutionA.toFixed(2)} Å
              </text>
              <text x="262" y="110" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                {config.windowFunction === 'none'
                  ? `Strong Sinc Satellite Ripples (λ = ${terminationRipplePeriodA.toFixed(2)} Å)`
                  : `Ripples Suppressed via ${config.windowFunction.toUpperCase()} Window`}
              </text>
            </svg>
          </div>

          {/* 3-Stage Pipeline Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#070A12] border border-slate-800 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-cyan-400">01. Total Scattering S(Q)</span>
                <span className="text-slate-500">Bragg + Diffuse</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standard XRD discards diffuse intensity between Bragg peaks. Total scattering measures coherent intensity across wide momentum transfer <span className="font-mono text-cyan-300">Q = (4π/λ)sinθ</span> and normalizes by <span className="font-mono text-white">⟨f(Q)⟩²</span>.
              </p>
            </div>

            <div className="bg-[#070A12] border border-slate-800 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-indigo-400">02. Reduced Function F(Q)</span>
                <span className="text-slate-500">F(Q) = Q[S(Q) − 1]</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Weighting <span className="font-mono text-white">[S(Q) − 1]</span> by <span className="font-mono text-indigo-300">Q</span> amplifies weak high-<span className="font-mono text-indigo-300">Q</span> oscillations that carry sub-Ångström nearest-neighbor bond distances and Debye–Waller disorder <span className="font-mono text-amber-300">σ_ij</span>.
              </p>
            </div>

            <div className="bg-[#070A12] border border-slate-800 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-emerald-400">03. Real-Space PDF G(r)</span>
                <span className="text-slate-500">Δr_min = π / Q_max</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sine Fourier inversion produces <span className="font-mono text-emerald-300">G(r)</span>—a direct histogram of interatomic distances <span className="font-mono text-white">r_ij</span> that works equally well for glasses, liquids, quantum dots, and crystals.
              </p>
            </div>
          </div>

          {/* Interactive Equation + Radiation Source Q_max Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-[#070A12] border border-slate-800 rounded p-3.5">
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-cyan-300 font-semibold">Sine Fourier Inversion Integral</span>
                <span className="tabular-nums">Resolution Δr_min = {deltaRResolutionA.toFixed(3)} Å</span>
              </div>
              <div
                className="py-2 px-3 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: eqSineFourier }}
              />
            </div>

            <div className="lg:col-span-6 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Select X-Ray Source Q_max Cutoff:
                </span>
                <span className="text-white font-bold tabular-nums">Q_max = {config.qMax.toFixed(1)} Å⁻¹</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { label: 'Cu Kα (8.0 Å⁻¹)', qMax: 8.0, sub: 'Δr = 0.39 Å · Lab' },
                  { label: 'Mo Kα (17.0 Å⁻¹)', qMax: 17.0, sub: 'Δr = 0.18 Å · Short-λ' },
                  { label: 'Ag Kα (22.0 Å⁻¹)', qMax: 22.0, sub: 'Δr = 0.14 Å · Lab PDF' },
                  { label: 'Synch. (28.0 Å⁻¹)', qMax: 28.0, sub: 'Δr = 0.11 Å · High-E' }
                ].map((btn) => {
                  const isActive = Math.abs(config.qMax - btn.qMax) < 0.6;
                  return (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => onUpdateConfig({ qMax: btn.qMax })}
                      className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                          : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-cyan-300 whitespace-nowrap">{btn.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">{btn.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: ATOMIC COORDINATION SHELLS & NANOPARTICLE ENVELOPE CAD */}
      {activeMode === 'shellsEnvelope' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 6 Cols: Interactive Concentric Coordination Shell CAD Diagram */}
            <div className="lg:col-span-6 bg-[#070A12] border border-slate-800 rounded p-3 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-indigo-300">
                  Interactive Concentric Coordination Shells Around Origin Atom (Click Shell to Inspect)
                </span>
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">{shells.length} Shells</span>
              </div>

              <svg viewBox="0 0 460 185" className="w-full h-44 bg-[#050811] border border-slate-800 rounded select-none">
                {/* Concentric Shell Circles */}
                {shells.slice(0, 4).map((sh, idx) => {
                  const radii = [30, 50, 68, 84];
                  const colors = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24'];
                  const rPx = radii[idx];
                  const color = colors[idx % colors.length];
                  const isSel = selectedRingIdx === idx;
                  const atomCount = Math.min(12, Math.max(4, Math.round(sh.coordinationN)));

                  return (
                    <g
                      key={sh.id}
                      onClick={() => {
                        setSelectedRingIdx(idx);
                        if (onSelectShellForIntegration) onSelectShellForIntegration(sh);
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        cx="108"
                        cy="92"
                        r={rPx}
                        fill="none"
                        stroke={color}
                        strokeWidth={isSel ? '2.2' : '1.1'}
                        strokeDasharray={isSel ? 'none' : '4 3'}
                        opacity={isSel ? 1 : 0.65}
                      />
                      {Array.from({ length: atomCount }).map((_, aIdx) => {
                        const rad = (aIdx * 2 * Math.PI) / atomCount;
                        const ax = 108 + rPx * Math.cos(rad);
                        const ay = 92 + rPx * Math.sin(rad);
                        return (
                          <circle
                            key={aIdx}
                            cx={ax}
                            cy={ay}
                            r={isSel ? '4.2' : '3.0'}
                            fill={color}
                            stroke={isSel ? '#ffffff' : 'none'}
                            strokeWidth="0.8"
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Central Reference Atom at r = 0 */}
                <circle cx="108" cy="92" r="6.5" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" />
                <text x="108" y="109" textAnchor="middle" fill="#fde68a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  Origin (r=0)
                </text>

                {/* Clickable Shell Callout Rows on Right Side of SVG */}
                {shells.slice(0, 4).map((sh, idx) => {
                  const colors = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24'];
                  const yPos = 30 + idx * 38;
                  const isSel = selectedRingIdx === idx;
                  return (
                    <g
                      key={sh.id}
                      onClick={() => {
                        setSelectedRingIdx(idx);
                        if (onSelectShellForIntegration) onSelectShellForIntegration(sh);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="210"
                        y={yPos - 15}
                        width="238"
                        height="30"
                        rx="4"
                        fill={isSel ? '#0f172a' : '#0B0F19'}
                        stroke={isSel ? colors[idx % colors.length] : '#1e293b'}
                        strokeWidth={isSel ? '1.3' : '0.9'}
                      />
                      <circle cx="222" cy={yPos} r="4" fill={colors[idx % colors.length]} />
                      <text x="232" y={yPos - 2} fill="#f8fafc" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                        S{idx + 1}: {sh.pairLabel}
                      </text>
                      <text x="232" y={yPos + 10} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                        r = {sh.rAngstrom.toFixed(3)} Å · N = {sh.coordinationN.toFixed(1)} · σ = {sh.sigmaAngstrom.toFixed(3)} Å
                      </text>
                    </g>
                  );
                })}
              </svg>

              {activeShell && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded text-xs font-mono tabular-nums">
                  <span className="text-cyan-300 font-semibold">
                    Selected: {activeShell.pairLabel} (r = {activeShell.rAngstrom.toFixed(3)} Å, N = {activeShell.coordinationN.toFixed(1)})
                  </span>
                  {onSelectShellForIntegration && (
                    <button
                      type="button"
                      onClick={() => onSelectShellForIntegration(activeShell)}
                      className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>Integrate Shell in R(r)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right 6 Cols: Spherical Nanoparticle Shape Envelope gamma_0(r; D) */}
            <div className="lg:col-span-6 bg-[#070A12] border border-slate-800 rounded p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[11px] font-semibold text-cyan-300">
                    Spherical Nanoparticle Shape Envelope γ₀(r; D) &amp; Correlated Motion
                  </span>
                  <span className="text-[11px] text-emerald-400 tabular-nums">
                    {config.domainDiameterNm > 0
                      ? `D = ${config.domainDiameterNm.toFixed(1)} nm (${(config.domainDiameterNm * 10).toFixed(0)} Å)`
                      : 'Bulk Crystal (D = ∞)'}
                  </span>
                </div>
                <div
                  className="py-2 px-2 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: eqShapeEnvelope }}
                />

                {/* Live SVG Curve of gamma_0(r; D) */}
                <svg viewBox="0 0 430 112" className="w-full h-24 bg-[#050811] border border-slate-800 rounded select-none">
                  <line x1="32" y1="28" x2="412" y2="28" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
                  <line x1="32" y1="96" x2="412" y2="96" stroke="#334155" strokeWidth="1" />
                  <line x1="32" y1="20" x2="32" y2="96" stroke="#334155" strokeWidth="1" />
                  <path d={envelopeSvgPath} fill="none" stroke="#10b981" strokeWidth="2" />
                  <text x="26" y="31" textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="monospace">1.0</text>
                  <text x="26" y="98" textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="monospace">0.0</text>
                  <text x="40" y="22" fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    γ₀(r) Real-Space Attenuation Curve (0 → {config.rMax.toFixed(0)} Å)
                  </text>
                </svg>
              </div>

              <div className="bg-[#0B0F19] border border-slate-800 rounded p-2.5 space-y-1.5 font-mono text-xs tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Interactive Nanoparticle Diameter D:</span>
                  <span className="text-cyan-300 font-bold">
                    {config.domainDiameterNm > 0 ? `${config.domainDiameterNm.toFixed(1)} nm` : 'Bulk (0 = ∞)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.2"
                  value={config.domainDiameterNm}
                  onChange={(e) => onUpdateConfig({ domainDiameterNm: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: TERMINATION RIPPLES, LORCH DAMPING & PDF FUNCTION FAMILY */}
      {activeMode === 'functionsRipples' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-mono">
                  <span className="text-xs font-bold text-amber-400">
                    Fourier Termination Ripples &amp; Lorch Modification
                  </span>
                  <span className="text-[10px] text-slate-400">Sinc Convolution</span>
                </div>
                <div
                  className="py-2 px-2 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: eqLorchWindow }}
                />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Truncating the Fourier integral at finite <span className="font-mono text-cyan-300">Q_max</span> convolves every true atomic peak with <span className="font-mono text-amber-300">sin(Q_max·r)/(πr)</span>, producing spurious satellite ripples with wavelength <span className="font-mono text-white">λ_ripple = 2π/Q_max = {terminationRipplePeriodA.toFixed(2)} Å</span>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1 font-mono text-xs">
                {[
                  { id: 'none', label: 'Unwindowed', desc: 'Sharpest · Ripples' },
                  { id: 'lorch', label: 'Lorch Sinc', desc: 'Suppresses Ripples' },
                  { id: 'cosine_bell', label: 'Cosine Bell', desc: 'Smooth Taper' }
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onUpdateConfig({ windowFunction: w.id as any })}
                    className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                      config.windowFunction === w.id
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-cyan-300">{w.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#070A12] border border-slate-800 rounded p-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-mono">
                <span className="text-xs font-bold text-white">
                  Total Scattering Correlation Functions Reference Matrix
                </span>
                <span className="text-[11px] text-emerald-400 tabular-nums">PDFgui R_w = {rwFactorPct.toFixed(2)}%</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-[#0B0F19]">
                      <th className="p-2">Function</th>
                      <th className="p-2">Analytical Definition</th>
                      <th className="p-2">Physical Meaning &amp; Asymptotics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    <tr>
                      <td className="p-2 font-bold text-cyan-300">S(Q)</td>
                      <td className="p-2">I_coh(Q) / ⟨f(Q)⟩²</td>
                      <td className="p-2 font-sans text-slate-400">Total structure factor; oscillates around 1.0 at high Q</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-indigo-300">F(Q)</td>
                      <td className="p-2">Q · [S(Q) − 1]</td>
                      <td className="p-2 font-sans text-slate-400">Reduced structure function; direct input to sine Fourier integral</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-emerald-300">G(r)</td>
                      <td className="p-2">4πr [ρ(r) − ρ₀γ₀(r)]</td>
                      <td className="p-2 font-sans text-slate-400">Reduced PDF; linear slope at r → 0 is −4πrρ₀, oscillates around 0</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-amber-300">R(r)</td>
                      <td className="p-2">4πr² ρ(r)</td>
                      <td className="p-2 font-sans text-slate-400">Radial Distribution Function; area ∫ R(r) dr = Coordination N_c</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-purple-300">g(r)</td>
                      <td className="p-2">ρ(r) / ρ₀</td>
                      <td className="p-2 font-sans text-slate-400">Pair density distribution; 0 below r₁, approaches 1.0 as r → ∞</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
