import React, { useState, useMemo } from 'react';
import { MethodOfMomentsResult } from '../../types';
import { Layers, TrendingUp, Activity, Crosshair, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import katex from 'katex';

interface MomentsCadSchematicProps {
  result: MethodOfMomentsResult | null;
  twoTheta0: number;
  wavelength: number;
  shapeK: number;
  inspectSigma: number;
  onInspectSigmaChange: (sigma: number) => void;
}

export const MomentsCadSchematic: React.FC<MomentsCadSchematicProps> = ({
  result,
  twoTheta0,
  wavelength,
  shapeK,
  inspectSigma,
  onInspectSigmaChange
}) => {
  const [activeMode, setActiveMode] = useState<'truncation' | 'parabola' | 'kurtosis'>('truncation');

  // Pre-rendered KaTeX equations
  const eqVarianceDef = useMemo(
    () =>
      katex.renderToString(
        'W(\\sigma) = \\mu_2(\\sigma) = \\frac{\\int_{-\\sigma}^{+\\sigma} (2\\theta - 2\\theta_0)^2 \\, I(2\\theta)\\, d(2\\theta)}{\\int_{-\\sigma}^{+\\sigma} I(2\\theta)\\, d(2\\theta)}',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqWilsonParabola = useMemo(
    () =>
      katex.renderToString(
        'W(\\sigma) = W_0 + \\underbrace{\\left(\\frac{K\\lambda}{\\pi^2 D_V \\cos\\theta_0}\\right)}_{K_1 \\text{ (Size Slope)}} \\sigma + \\underbrace{\\left(4\\langle\\varepsilon^2\\rangle \\tan^2\\theta_0\\right)}_{K_2 \\text{ (Strain Curvature)}} \\sigma^2',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqLangfordLinear = useMemo(
    () =>
      katex.renderToString(
        '\\frac{W(\\sigma) - W_0}{\\sigma} = K_1 + K_2 \\cdot \\sigma',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqKurtosisDef = useMemo(
    () =>
      katex.renderToString(
        '\\beta_2(\\sigma) = \\frac{\\mu_4(\\sigma)}{[W(\\sigma)]^2}, \\quad \\gamma_2 = \\beta_2 - 3',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  // Compute live variance breakdown at current inspectSigma
  const liveWindowMetrics = useMemo(() => {
    const sigRad = (inspectSigma * Math.PI) / 180;
    const RAD_TO_DEG2 = (180 / Math.PI) * (180 / Math.PI);
    const k1 = result?.slopeK1 ?? 0.0005;
    const k2 = result?.quadraticK2 ?? 0.0015;
    const w0 = result?.interceptW0 ?? 0.00001;

    const linearPartRad2 = k1 * sigRad;
    const quadPartRad2 = k2 * sigRad * sigRad;
    const totalWRad2 = Math.max(1e-9, w0 + linearPartRad2 + quadPartRad2);

    const sizeFractionPct = Math.min(100, Math.max(0, (linearPartRad2 / (linearPartRad2 + quadPartRad2 + 1e-12)) * 100));
    const strainFractionPct = 100 - sizeFractionPct;

    // Asymptotic Lorentzian tail capture fraction: atan(sigma / gamma) / (pi/2)
    const gammaDeg = 0.18;
    const capturedAreaPct = (Math.atan(inspectSigma / gammaDeg) / (Math.PI / 2)) * 100;

    return {
      sigRad,
      wDeg2: totalWRad2 * RAD_TO_DEG2,
      linearDeg2: linearPartRad2 * RAD_TO_DEG2,
      quadDeg2: quadPartRad2 * RAD_TO_DEG2,
      sizeFractionPct,
      strainFractionPct,
      capturedAreaPct
    };
  }, [inspectSigma, result]);

  // Generate SVG path for the diffraction profile and truncated window
  const profileSvgData = useMemo(() => {
    const width = 520;
    const height = 190;
    const padX = 40;
    const padY = 24;
    const plotW = width - 2 * padX;
    const plotH = height - 2 * padY;
    const maxSpan = 1.5; // deg

    const xToPx = (dx: number) => padX + ((dx + maxSpan) / (2 * maxSpan)) * plotW;
    const yToPx = (normI: number) => padY + plotH - normI * (plotH - 12);

    const fullPts: string[] = [];
    const windowPts: string[] = [];
    const integrandPts: string[] = []; // x^2 * I(x) integrand showing why tails matter!

    const gamma = 0.22;
    const sigmaG = 0.18;
    const eta = result && result.meanKurtosis > 3.4 ? 0.72 : 0.45;

    const nSteps = 120;
    let firstWindowPx: number | null = null;
    let lastWindowPx: number | null = null;

    for (let i = 0; i <= nSteps; i++) {
      const dx = -maxSpan + (i / nSteps) * (2 * maxSpan);
      const g = Math.exp(-(dx * dx) / (2 * sigmaG * sigmaG));
      const l = 1 / (1 + (dx * dx) / (gamma * gamma));
      const intensity = eta * l + (1 - eta) * g;

      // x^2 * I(x) scaled for visual display
      const x2I = Math.min(0.95, ((dx * dx) / (gamma * gamma)) * intensity * 0.85);

      const px = xToPx(dx);
      const py = yToPx(intensity);
      const pyIntegrand = yToPx(x2I);

      fullPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      integrandPts.push(`${px.toFixed(1)},${pyIntegrand.toFixed(1)}`);

      if (Math.abs(dx) <= inspectSigma + 1e-4) {
        if (firstWindowPx === null) firstWindowPx = px;
        lastWindowPx = px;
        windowPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
    }

    const basePy = yToPx(0);
    const areaPolygon =
      windowPts.length > 1 && firstWindowPx !== null && lastWindowPx !== null
        ? `${firstWindowPx.toFixed(1)},${basePy.toFixed(1)} ${windowPts.join(' ')} ${lastWindowPx.toFixed(1)},${basePy.toFixed(1)}`
        : '';

    return {
      width,
      height,
      basePy,
      centerPx: xToPx(0),
      leftCutPx: xToPx(-inspectSigma),
      rightCutPx: xToPx(inspectSigma),
      fullPolyline: fullPts.join(' '),
      integrandPolyline: integrandPts.join(' '),
      areaPolygon
    };
  }, [inspectSigma, result]);

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
      {/* Top CAD Bar & 3-Mode Selector */}
      <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Method of Moments Metrology & Statistical Profile Guide
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Single-Peak Size–Strain Decoupling via Progressive Integration Cutoff σ = |2θ − 2θ₀|
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0F19] p-1 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('truncation')}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'truncation'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>01. How Moments Work (±σ Window)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('parabola')}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'parabola'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>02. Wilson Parabola vs. Langford Plot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('kurtosis')}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'kurtosis'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>03. 4th Moment Kurtosis & Tail Physics</span>
          </button>
        </div>
      </div>

      {/* MODE 1: HOW MOMENTS WORK & PROGRESSIVE TRUNCATION CAD */}
      {activeMode === 'truncation' && (
        <div className="p-4 space-y-4">
          {/* 3-Step Pedagogical Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#070A12] border border-slate-800 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Step 1 • Why Single-Peak?
                </span>
                <span className="text-[10px] font-mono text-slate-500">No Multi-Peak Needed</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unlike Williamson–Hall (which needs multiple reflections), the <strong>Method of Moments</strong> extracts both crystallite size <span className="font-mono text-cyan-300">D_V</span> and microstrain <span className="font-mono text-amber-300">⟨ε²⟩¹/²</span> from a <strong>single diffraction peak</strong> by measuring how variance <span className="font-mono text-indigo-300">W(σ)</span> grows as you widen the integration window <span className="font-mono text-white">±σ</span>.
              </p>
            </div>

            <div className="bg-[#070A12] border border-slate-800 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Step 2 • Why Variance Grows with σ
                </span>
                <span className="text-[10px] font-mono text-slate-500">I(x) ∝ x⁻² Tails</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Finite crystallites cause peak tails to decay slowly as <span className="font-mono text-indigo-300">I(x) ∝ 1/x²</span>. When multiplied by <span className="font-mono text-amber-300">x²</span> inside the variance integral <span className="font-mono text-white">∫ x² I(x) dx</span>, the integrand stays non-zero in the tails—causing <span className="font-mono text-cyan-300">W(σ)</span> to grow linearly with <span className="font-mono text-cyan-300">σ</span>!
              </p>
            </div>

            <div className="bg-[#070A12] border border-slate-800 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Step 3 • Slope = Size, Curvature = Strain
                </span>
                <span className="text-[10px] font-mono text-slate-500">W(σ) = W₀ + K₁σ + K₂σ²</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fitting a parabola to <span className="font-mono text-white">W(σ) vs. σ</span> separates the two effects: the <strong>linear slope K₁</strong> gives volume-weighted size <span className="font-mono text-cyan-300">D_V ∝ 1/K₁</span>, while the <strong>upward curvature K₂</strong> gives RMS microstrain <span className="font-mono text-amber-300">⟨ε²⟩¹/² ∝ √K₂</span>.
              </p>
            </div>
          </div>

          {/* Interactive SVG CAD Schematic + Live Cutoff Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-7 bg-[#070A12] border border-slate-800 rounded p-3 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                  CAD Schematic: Symmetric Truncation Limits [2θ₀ − σ, 2θ₀ + σ]
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-2.5 bg-cyan-500/30 border border-cyan-400 inline-block" /> Peak I(2θ)
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Variance Integrand (x²·I)
                  </span>
                </div>
              </div>

              <svg
                viewBox={`0 0 ${profileSvgData.width} ${profileSvgData.height}`}
                className="w-full h-44 bg-[#050811] border border-slate-800/80 rounded"
              >
                {/* Subtle CAD Grid */}
                {[0.25, 0.5, 0.75].map((frac, i) => (
                  <line
                    key={i}
                    x1={40}
                    y1={24 + frac * (profileSvgData.height - 48)}
                    x2={profileSvgData.width - 40}
                    y2={24 + frac * (profileSvgData.height - 48)}
                    stroke="#1e293b"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                ))}

                {/* Shaded Truncation Window Area */}
                {profileSvgData.areaPolygon && (
                  <polygon
                    points={profileSvgData.areaPolygon}
                    fill="rgba(6, 182, 212, 0.18)"
                    stroke="none"
                  />
                )}

                {/* Full Peak Profile Curve */}
                <polyline
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  points={profileSvgData.fullPolyline}
                />

                {/* Variance Integrand Curve x^2 * I(x) */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  points={profileSvgData.integrandPolyline}
                />

                {/* Centroid 2Theta0 Line */}
                <line
                  x1={profileSvgData.centerPx}
                  y1={16}
                  x2={profileSvgData.centerPx}
                  y2={profileSvgData.basePy}
                  stroke="#818cf8"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <text
                  x={profileSvgData.centerPx}
                  y={13}
                  textAnchor="middle"
                  fill="#a5b4fc"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  2θ₀ = {twoTheta0.toFixed(2)}°
                </text>

                {/* Left & Right Cutoff Lines (-sigma, +sigma) */}
                <line
                  x1={profileSvgData.leftCutPx}
                  y1={22}
                  x2={profileSvgData.leftCutPx}
                  y2={profileSvgData.basePy}
                  stroke="#22d3ee"
                  strokeWidth="1.8"
                />
                <line
                  x1={profileSvgData.rightCutPx}
                  y1={22}
                  x2={profileSvgData.rightCutPx}
                  y2={profileSvgData.basePy}
                  stroke="#22d3ee"
                  strokeWidth="1.8"
                />

                {/* Dimension Arrow Between -sigma and +sigma */}
                <line
                  x1={profileSvgData.leftCutPx}
                  y1={profileSvgData.basePy - 14}
                  x2={profileSvgData.rightCutPx}
                  y2={profileSvgData.basePy - 14}
                  stroke="#22d3ee"
                  strokeWidth="1.2"
                />
                <text
                  x={profileSvgData.centerPx}
                  y={profileSvgData.basePy - 18}
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Window 2σ = ±{inspectSigma.toFixed(2)}° ({liveWindowMetrics.capturedAreaPct.toFixed(1)}% Area)
                </text>

                {/* Base Axis */}
                <line
                  x1={35}
                  y1={profileSvgData.basePy}
                  x2={profileSvgData.width - 35}
                  y2={profileSvgData.basePy}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={profileSvgData.leftCutPx}
                  y={profileSvgData.height - 6}
                  textAnchor="middle"
                  fill="#22d3ee"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  −σ ({(-inspectSigma).toFixed(2)}°)
                </text>
                <text
                  x={profileSvgData.rightCutPx}
                  y={profileSvgData.height - 6}
                  textAnchor="middle"
                  fill="#22d3ee"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  +σ (+{inspectSigma.toFixed(2)}°)
                </text>
              </svg>

              {/* Interactive Range Cutoff Slider */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Interactive Cutoff σ:</span>
                  <span className="text-cyan-300 font-bold tabular-nums">±{inspectSigma.toFixed(2)}°</span>
                  <span className="text-slate-500 tabular-nums">({liveWindowMetrics.sigRad.toFixed(4)} rad)</span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <input
                    type="range"
                    min="0.15"
                    max="1.40"
                    step="0.05"
                    value={inspectSigma}
                    onChange={(e) => onInspectSigmaChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Formula & Live Variance Partition at Selected Sigma */}
            <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                    2nd Central Moment Definition
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Zero-Mean at 2θ₀</span>
                </div>
                <div
                  className="py-2 px-3 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: eqVarianceDef }}
                />
                <div
                  className="py-2 px-3 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: eqWilsonParabola }}
                />
              </div>

              {/* Live Variance Partition Meter */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded p-3 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 uppercase font-bold">Variance Partition at σ = {inspectSigma.toFixed(2)}°</span>
                  <span className="text-white font-bold tabular-nums">W(σ) = {liveWindowMetrics.wDeg2.toFixed(5)} deg²</span>
                </div>

                {/* Progress Bar Splitting Linear Size vs Quadratic Strain */}
                <div className="w-full h-2.5 bg-slate-900 rounded overflow-hidden flex border border-slate-800">
                  <div
                    style={{ width: `${liveWindowMetrics.sizeFractionPct}%` }}
                    className="bg-cyan-500 h-full transition-all duration-200"
                    title="Linear Size Broadening Contribution (K₁·σ)"
                  />
                  <div
                    style={{ width: `${liveWindowMetrics.strainFractionPct}%` }}
                    className="bg-amber-500 h-full transition-all duration-200"
                    title="Quadratic Strain Broadening Contribution (K₂·σ²)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-[#070A12] p-2 rounded border border-slate-800/80">
                    <span className="text-cyan-400 block text-[10px]">Linear Size Part (K₁·σ)</span>
                    <span className="text-white font-bold tabular-nums">
                      {liveWindowMetrics.linearDeg2.toFixed(5)} deg² ({liveWindowMetrics.sizeFractionPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="bg-[#070A12] p-2 rounded border border-slate-800/80">
                    <span className="text-amber-400 block text-[10px]">Quadratic Strain (K₂·σ²)</span>
                    <span className="text-white font-bold tabular-nums">
                      {liveWindowMetrics.quadDeg2.toFixed(5)} deg² ({liveWindowMetrics.strainFractionPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: WILSON PARABOLA VS LANGFORD LINEARIZATION CAD */}
      {activeMode === 'parabola' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Wilson Variance-Range Parabola Schematic */}
            <div className="bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider block">
                    A. Wilson Variance–Range Parabola
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Direct Quadratic Polynomial Fit: W(σ) = W₀ + K₁σ + K₂σ²
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
                  Parabola Space
                </span>
              </div>

              <svg viewBox="0 0 420 165" className="w-full h-40 bg-[#050811] border border-slate-800 rounded">
                {/* Axes */}
                <line x1="45" y1="138" x2="395" y2="138" stroke="#475569" strokeWidth="1.2" />
                <line x1="45" y1="18" x2="45" y2="138" stroke="#475569" strokeWidth="1.2" />

                {/* Linear Size Tangent (K1*sigma) */}
                <line
                  x1="45"
                  y1="125"
                  x2="370"
                  y2="58"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeDasharray="5 4"
                />
                <text x="295" y="78" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">
                  Pure Size Tangent (K₁·σ)
                </text>

                {/* Quadratic Total Curve (W0 + K1*sigma + K2*sigma^2) */}
                <path
                  d="M 45 125 Q 210 92 370 24"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                />
                <text x="210" y="34" fill="#c084fc" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  Total W(σ) = W₀ + K₁σ + K₂σ²
                </text>

                {/* Strain Curvature Bracket */}
                <line x1="350" y1="33" x2="350" y2="62" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="342" y="49" textAnchor="end" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                  ΔW_strain = K₂·σ²
                </text>

                {/* W0 Intercept Dot */}
                <circle cx="45" cy="125" r="3.5" fill="#10b981" />
                <text x="53" y="130" fill="#34d399" fontSize="9" fontFamily="monospace">
                  W₀ (Background/Core)
                </text>

                <text x="220" y="156" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                  Truncation Range Cutoff σ [rad or deg] →
                </text>
                <text
                  x="15"
                  y="78"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  transform="rotate(-90, 15, 78)"
                >
                  Variance W(σ)
                </text>
              </svg>

              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="bg-[#0B0F19] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[9px] uppercase block">Initial Slope K₁</span>
                  <span className="text-cyan-300 font-bold tabular-nums">
                    {result ? `${result.slopeK1.toExponential(3)} rad` : '—'}
                  </span>
                </div>
                <div className="bg-[#0B0F19] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[9px] uppercase block">Curvature K₂</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {result ? result.quadraticK2.toExponential(3) : '—'}
                  </span>
                </div>
                <div className="bg-[#0B0F19] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[9px] uppercase block">Intercept W₀</span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    {result ? `${result.interceptW0.toExponential(2)} rad²` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Langford Reduced Variance Linearization Schematic */}
            <div className="bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                    B. Langford Reduced Variance Plot
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Linearized Form: [W(σ) − W₀] / σ = K₁ + K₂·σ
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                  Linearized Space
                </span>
              </div>

              <svg viewBox="0 0 420 165" className="w-full h-40 bg-[#050811] border border-slate-800 rounded">
                {/* Axes */}
                <line x1="45" y1="138" x2="395" y2="138" stroke="#475569" strokeWidth="1.2" />
                <line x1="45" y1="18" x2="45" y2="138" stroke="#475569" strokeWidth="1.2" />

                {/* Strain-free Horizontal Reference Line (K2 = 0) */}
                <line
                  x1="45"
                  y1="98"
                  x2="375"
                  y2="98"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x="255" y="112" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                  Zero-Strain Baseline (K₂ = 0)
                </text>

                {/* Strained Linear Line (K1 + K2*sigma) */}
                <line x1="45" y1="98" x2="370" y2="34" stroke="#10b981" strokeWidth="2.5" />
                <text x="195" y="48" fill="#34d399" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  Slope = K₂ = 4⟨ε²⟩tan²θ₀
                </text>

                {/* Y-Intercept K1 */}
                <circle cx="45" cy="98" r="4" fill="#38bdf8" />
                <text x="54" y="93" fill="#7dd3fc" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  Y-Intercept = K₁ ∝ 1/D_V
                </text>

                <text x="220" y="156" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                  Truncation Range Cutoff σ [rad or deg] →
                </text>
                <text
                  x="15"
                  y="78"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  transform="rotate(-90, 15, 78)"
                >
                  W(σ) / σ
                </text>
              </svg>

              <div
                className="py-1.5 px-3 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: eqLangfordLinear }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: 4TH MOMENT KURTOSIS & STATISTICAL TAIL HIERARCHY */}
      {activeMode === 'kurtosis' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Statistical Moment Hierarchy
                </span>
                <span className="text-[10px] font-mono text-slate-400">Pearson Kurtosis β₂</span>
              </div>

              <div
                className="py-2 px-3 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: eqKurtosisDef }}
              />

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#0B0F19] border border-slate-800 rounded">
                  <div className="flex items-center justify-between font-mono font-bold text-sky-300 mb-0.5">
                    <span>Mesokurtic (Gaussian Core)</span>
                    <span>β₂ = 3.00 (γ₂ = 0)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Rapid <span className="font-mono text-slate-200">exp(−x²)</span> tail decay characteristic of random dislocation strain fields and instrumental resolution.
                  </p>
                </div>

                <div className="p-2.5 bg-[#0B0F19] border border-slate-800 rounded">
                  <div className="flex items-center justify-between font-mono font-bold text-amber-300 mb-0.5">
                    <span>Leptokurtic (Cauchy / Lorentzian Tails)</span>
                    <span>β₂ &gt; 3.50 (γ₂ &gt; 0.5)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Heavy asymptotic <span className="font-mono text-slate-200">x⁻²</span> tails governed by finite crystallite size <span className="font-mono text-slate-200">D_V</span> and twin/deformation stacking faults.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#070A12] border border-slate-800 rounded p-3.5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Complete Central Moments Reference Table
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Current Mean β₂ = {result ? result.meanKurtosis.toFixed(2) : '3.00'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-[#0B0F19]">
                      <th className="p-2">Moment Order</th>
                      <th className="p-2">Symbol & Integral</th>
                      <th className="p-2">Crystallographic Meaning</th>
                      <th className="p-2 text-right">Live Readout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    <tr>
                      <td className="p-2 font-bold text-slate-200">0th Moment</td>
                      <td className="p-2 text-indigo-300">M₀ = ∫ I(2θ) d(2θ)</td>
                      <td className="p-2 text-slate-400 font-sans">Integrated peak intensity (phase abundance)</td>
                      <td className="p-2 text-right tabular-nums text-slate-200">Normalized (1.0)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">1st Moment</td>
                      <td className="p-2 text-cyan-300">2θ₀ = ∫ 2θ·I d(2θ) / M₀</td>
                      <td className="p-2 text-slate-400 font-sans">Center of gravity (lattice d-spacing & macrostrain)</td>
                      <td className="p-2 text-right tabular-nums text-cyan-300 font-bold">{twoTheta0.toFixed(3)}°</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">2nd Moment</td>
                      <td className="p-2 text-purple-300">W(σ) = μ₂(σ)</td>
                      <td className="p-2 text-slate-400 font-sans">Variance parabola → Size D_V (K₁) & Microstrain (K₂)</td>
                      <td className="p-2 text-right tabular-nums text-purple-300 font-bold">
                        {result ? `D_V = ${result.sizeNm.toFixed(1)} nm` : '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">3rd Moment</td>
                      <td className="p-2 text-amber-300">γ₁ = μ₃ / W³ᐟ²</td>
                      <td className="p-2 text-slate-400 font-sans">Peak skewness → Twin faults & compositional gradients</td>
                      <td className="p-2 text-right tabular-nums text-amber-300 font-bold">
                        {result?.meanSkewness !== undefined ? result.meanSkewness.toFixed(3) : '0.000 (Symmetric)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">4th Moment</td>
                      <td className="p-2 text-emerald-300">β₂ = μ₄ / W²</td>
                      <td className="p-2 text-slate-400 font-sans">Tail kurtosis → Lorentzian (β₂ &gt; 3) vs Gaussian (β₂ = 3)</td>
                      <td className="p-2 text-right tabular-nums text-emerald-300 font-bold">
                        {result ? `${result.meanKurtosis.toFixed(2)} (${result.meanKurtosis > 3.5 ? 'Leptokurtic' : 'Gaussian'})` : '—'}
                      </td>
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
