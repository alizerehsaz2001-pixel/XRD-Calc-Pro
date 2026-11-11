import React, { useState } from 'react';
import { Ruler, Layers, Split, Eye, EyeOff } from 'lucide-react';

export interface LineProfileCadSchematicProps {
  type: string;
  center: number;
  fwhm: number;
  eta: number;
  pearsonM: number;
  amplitude: number;
  background: number;
  asymmetry: number;
  enableKaDoublet: boolean;
  stats: {
    effTchFwhm: number;
    effEta: number;
    fwtm: number;
    fwtmRatio: number;
    integralBreadth: number;
    shapeFactor: number;
    dSpacing: number;
    qVector: number;
    theta1: number;
    theta2: number;
    theta1Tenth: number;
    theta2Tenth: number;
    thetaInfLeft: number;
    thetaInfRight: number;
    inflectionSpan: number;
    hwhmLeft: number;
    hwhmRight: number;
    asymmetryFactor: number;
    betaInst: number;
    betaSample: number;
  };
  onSnapCaliper?: (ptA: number, ptB: number) => void;
}

export const LineProfileCadSchematic: React.FC<LineProfileCadSchematicProps> = ({
  type,
  center,
  fwhm,
  eta,
  pearsonM,
  amplitude,
  asymmetry,
  enableKaDoublet,
  stats,
  onSnapCaliper
}) => {
  const [mode, setMode] = useState<'calipers' | 'kernels' | 'doublet'>('calipers');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const effEta = Number(stats?.effEta ?? eta ?? 0.5);
  const effFwhm = Math.max(0.01, Number(stats?.effTchFwhm ?? fwhm ?? 0.2));
  const betaIb = Math.max(0.01, Number(stats?.integralBreadth ?? effFwhm * 1.15));
  const fwtmVal = Math.max(0.02, Number(stats?.fwtm ?? effFwhm * 2.1));
  const fwtmRatioVal = Number(stats?.fwtmRatio ?? (fwtmVal / effFwhm));
  const shapeFactorVal = Number(stats?.shapeFactor ?? (effFwhm / betaIb));
  const inflectionSpanVal = Number(stats?.inflectionSpan ?? effFwhm * 0.85);
  const theta1Val = Number(stats?.theta1 ?? (center - effFwhm / 2));
  const theta2Val = Number(stats?.theta2 ?? (center + effFwhm / 2));
  const theta1TenthVal = Number(stats?.theta1Tenth ?? (center - fwtmVal / 2));
  const theta2TenthVal = Number(stats?.theta2Tenth ?? (center + fwtmVal / 2));
  const betaSampleVal = Number(stats?.betaSample ?? effFwhm);
  const betaInstVal = Number(stats?.betaInst ?? 0);
  const dSpacingVal = Number(stats?.dSpacing ?? 2.0);
  const qVectorVal = Number(stats?.qVector ?? 3.14);
  const hwhmLeftVal = Number(stats?.hwhmLeft ?? effFwhm / 2);
  const hwhmRightVal = Number(stats?.hwhmRight ?? effFwhm / 2);
  const asymFactorVal = Number(stats?.asymmetryFactor ?? 1.0);

  return (
    <div className="mb-3 bg-[#070A12] border border-slate-800 rounded-xl overflow-hidden">
      {/* Top CAD Metrology Header Bar */}
      <div className="px-3.5 py-2 bg-[#0B0F19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-nums">
          <span className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            CAD Line Profile Metrology Schematic
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">
            FWHM <strong className="text-amber-400">{effFwhm.toFixed(4)}°</strong>
          </span>
          <span className="text-slate-400">
            β_IB <strong className="text-emerald-400">{betaIb.toFixed(4)}°</strong>
          </span>
          <span className="text-slate-400">
            FWTM <strong className="text-teal-300">{fwtmVal.toFixed(4)}°</strong>
          </span>
          <span className="text-slate-400">
            φ = FWHM/β_IB <strong className="text-sky-300">{shapeFactorVal.toFixed(3)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!collapsed && (
            <div className="flex items-center bg-[#070A12] p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('calipers')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mode === 'calipers'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Ruler className="w-3 h-3" />
                1. Caliper Geometry (FWHM · β_IB · FWTM)
              </button>
              <button
                type="button"
                onClick={() => setMode('kernels')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mode === 'kernels'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Layers className="w-3 h-3" />
                2. Voigt Kernel Decay ((1-η)G + ηL)
              </button>
              <button
                type="button"
                onClick={() => setMode('doublet')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  mode === 'doublet'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Split className="w-3 h-3" />
                3. Kα₁/Kα₂ &amp; Asymmetry
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="px-2 py-1 rounded bg-[#070A12] hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            title={collapsed ? 'Expand CAD Line Profile Schematic' : 'Collapse CAD Line Profile Schematic'}
          >
            {collapsed ? <Eye className="w-3 h-3 text-sky-400" /> : <EyeOff className="w-3 h-3" />}
            {collapsed ? 'Show Blueprint' : 'Hide'}
          </button>
        </div>
      </div>

      {/* SVG CAD Blueprint Canvas */}
      {!collapsed && (
        <div className="p-2.5 bg-[#070A12]">
          {mode === 'calipers' && (() => {
            const W = 860;
            const H = 195;
            const cx = 300;
            const baseY = 166;
            const peakH = 132;
            const topY = baseY - peakH;

            // Scale visual half-width so FWHM is ~110px wide
            const pxPerDeg = 110 / effFwhm;
            const halfFwhmPx = 55;
            const halfIbPx = Math.min(135, Math.max(42, (betaIb / 2) * pxPerDeg));
            const halfFwtmPx = Math.min(210, Math.max(78, (fwtmVal / 2) * pxPerDeg));
            const halfInfPx = Math.min(85, Math.max(28, (inflectionSpanVal / 2) * pxPerDeg));

            // Generate 100-point analytical Pseudo-Voigt curve
            const pts: string[] = [];
            const areaPts: string[] = [`${cx - 245},${baseY}`];
            for (let i = 0; i <= 100; i++) {
              const dxPx = -245 + (i / 100) * 490;
              const u = dxPx / halfFwhmPx; // u = ±1 at FWHM
              const gVal = Math.exp(-Math.LN2 * u * u);
              const lVal = 1 / (1 + u * u);
              const pv = (1 - effEta) * gVal + effEta * lVal;
              const x = cx + dxPx;
              const y = baseY - pv * peakH;
              pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
              areaPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
            }
            areaPts.push(`${cx + 245},${baseY}`);

            const halfMaxY = baseY - peakH * 0.5;
            const tenthMaxY = baseY - peakH * 0.1;
            const infY = baseY - peakH * 0.606;

            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 select-none overflow-visible">
                <defs>
                  <linearGradient id="cadPeakFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
                  </linearGradient>
                  <pattern id="cadGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeDasharray="2,2" />
                  </pattern>
                </defs>

                {/* Left Plot Area */}
                <rect x="16" y="10" width="568" height="172" rx="6" fill="url(#cadGrid)" stroke="#1E293B" strokeWidth="1" />

                {/* Stokes-Wilson Integral Breadth Equivalent Rectangle (Area = I_max * beta_IB) */}
                <rect
                  x={cx - halfIbPx}
                  y={topY}
                  width={halfIbPx * 2}
                  height={peakH}
                  fill="#10B981"
                  fillOpacity="0.08"
                  stroke="#10B981"
                  strokeWidth="1.4"
                  strokeDasharray="4,3"
                />
                <text x={cx + halfIbPx - 4} y={topY + 12} fill="#10B981" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  Stokes–Wilson Box: β_IB = Area / I_max = {betaIb.toFixed(4)}°
                </text>

                {/* Synthesized Peak Area & Outline */}
                <polygon points={areaPts.join(' ')} fill="url(#cadPeakFill)" />
                <polyline points={pts.join(' ')} fill="none" stroke="#38BDF8" strokeWidth="2.4" />

                {/* Baseline */}
                <line x1="28" y1={baseY} x2="572" y2={baseY} stroke="#475569" strokeWidth="1.2" />

                {/* Centroid 2theta_0 Vertical Axis */}
                <line x1={cx} y1={topY - 8} x2={cx} y2={baseY} stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3,3" />
                <circle cx={cx} cy={topY} r="3.5" fill="#38BDF8" stroke="#070A12" strokeWidth="1.2" />
                <text x={cx} y={topY - 11} fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  2θ₀ = {Number(center ?? 28.44).toFixed(4)}° (I_max = {Number(amplitude ?? 100).toFixed(0)} cps)
                </text>

                {/* Inflection Span (d²I/d2θ² = 0) */}
                <line x1={cx - halfInfPx} y1={infY} x2={cx + halfInfPx} y2={infY} stroke="#F472B6" strokeWidth="1.3" strokeDasharray="2,2" />
                <circle cx={cx - halfInfPx} cy={infY} r="2.8" fill="#F472B6" />
                <circle cx={cx + halfInfPx} cy={infY} r="2.8" fill="#F472B6" />
                <text x={cx} y={infY - 5} fill="#F472B6" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  Δ2θ_inf = {inflectionSpanVal.toFixed(4)}°
                </text>

                {/* Half-Maximum Caliper Chord (FWHM) */}
                <line x1={cx - halfFwhmPx} y1={halfMaxY} x2={cx + halfFwhmPx} y2={halfMaxY} stroke="#F59E0B" strokeWidth="2.2" />
                <line x1={cx - halfFwhmPx} y1={halfMaxY - 8} x2={cx - halfFwhmPx} y2={baseY} stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />
                <line x1={cx + halfFwhmPx} y1={halfMaxY - 8} x2={cx + halfFwhmPx} y2={baseY} stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />
                <circle cx={cx - halfFwhmPx} cy={halfMaxY} r="3.5" fill="#F59E0B" stroke="#070A12" strokeWidth="1.2" />
                <circle cx={cx + halfFwhmPx} cy={halfMaxY} r="3.5" fill="#F59E0B" stroke="#070A12" strokeWidth="1.2" />
                <rect x={cx - 64} y={halfMaxY + 4} width="128" height="15" rx="3" fill="#0B0F19" stroke="#F59E0B" strokeWidth="0.9" />
                <text x={cx} y={halfMaxY + 14} fill="#FDE68A" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  FWHM = {effFwhm.toFixed(4)}° (50% I_max)
                </text>

                {/* Tenth-Maximum Caliper Chord (FWTM) */}
                <line x1={cx - halfFwtmPx} y1={tenthMaxY} x2={cx + halfFwtmPx} y2={tenthMaxY} stroke="#2DD4BF" strokeWidth="1.6" strokeDasharray="4,2" />
                <circle cx={cx - halfFwtmPx} cy={tenthMaxY} r="3" fill="#2DD4BF" />
                <circle cx={cx + halfFwtmPx} cy={tenthMaxY} r="3" fill="#2DD4BF" />
                <text x={cx} y={tenthMaxY - 4} fill="#5EEAD4" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  FWTM (10%) = {fwtmVal.toFixed(4)}° ({fwtmRatioVal.toFixed(2)}× FWHM)
                </text>

                {/* Right Metrology Readout & Quick Caliper Snap Panel */}
                <rect x="596" y="10" width="250" height="172" rx="6" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
                <text x="608" y="26" fill="#E2E8F0" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  LINE PROFILE CALIPER TELEMETRY
                </text>
                <line x1="608" y1="32" x2="834" y2="32" stroke="#1E293B" strokeWidth="1" />

                <text x="608" y="48" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">2θ₁ → 2θ₂ (50%):</text>
                <text x="834" y="48" fill="#F59E0B" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {theta1Val.toFixed(3)}° → {theta2Val.toFixed(3)}°
                </text>

                <text x="608" y="64" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Integral Breadth β_IB:</text>
                <text x="834" y="64" fill="#10B981" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {betaIb.toFixed(4)}° ({(betaIb * Math.PI / 180 * 1000).toFixed(2)} mrad)
                </text>

                <text x="608" y="80" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">FWTM (10% Wings):</text>
                <text x="834" y="80" fill="#2DD4BF" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {fwtmVal.toFixed(4)}° ({fwtmRatioVal.toFixed(2)}×)
                </text>

                <text x="608" y="96" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Voigt Shape φ:</text>
                <text x="834" y="96" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {shapeFactorVal.toFixed(4)} ({shapeFactorVal < 0.72 ? 'Cauchy-Rich' : shapeFactorVal > 0.86 ? 'Gaussian-Rich' : 'Intermediate Voigt'})
                </text>

                <text x="608" y="112" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Specimen β_sample:</text>
                <text x="834" y="112" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {betaSampleVal.toFixed(4)}° (β_inst {betaInstVal.toFixed(3)}°)
                </text>

                <text x="608" y="128" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Interplanar d / Q:</text>
                <text x="834" y="128" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {dSpacingVal.toFixed(4)} Å / {qVectorVal.toFixed(3)} Å⁻¹
                </text>

                {onSnapCaliper && (
                  <g
                    className="cursor-pointer"
                    onClick={() => onSnapCaliper(theta1Val, theta2Val)}
                  >
                    <rect x="608" y="142" width="108" height="26" rx="4" fill="#070A12" stroke="#F59E0B" strokeWidth="1" />
                    <text x="662" y="158" fill="#FDE68A" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      Snap FWHM Caliper
                    </text>
                  </g>
                )}
                {onSnapCaliper && (
                  <g
                    className="cursor-pointer"
                    onClick={() => onSnapCaliper(theta1TenthVal, theta2TenthVal)}
                  >
                    <rect x="724" y="142" width="110" height="26" rx="4" fill="#070A12" stroke="#2DD4BF" strokeWidth="1" />
                    <text x="779" y="158" fill="#5EEAD4" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      Snap FWTM Caliper
                    </text>
                  </g>
                )}
              </svg>
            );
          })()}

          {mode === 'kernels' && (() => {
            const W = 860;
            const H = 195;
            const cx = 295;
            const baseY = 166;
            const peakH = 132;
            const halfW = 52;

            const gaussPts: string[] = [];
            const lorentzPts: string[] = [];
            const activePts: string[] = [];

            for (let i = 0; i <= 100; i++) {
              const dxPx = -245 + (i / 100) * 490;
              const u = dxPx / halfW;
              const gVal = Math.exp(-Math.LN2 * u * u);
              const lVal = 1 / (1 + u * u);
              const pvVal =
                type === 'Gaussian'
                  ? gVal
                  : type === 'Lorentzian'
                  ? lVal
                  : type === 'Pearson VII'
                  ? Math.pow(1 + (Math.pow(2, 1 / Math.max(0.5, pearsonM)) - 1) * u * u, -Math.max(0.5, pearsonM))
                  : (1 - effEta) * gVal + effEta * lVal;

              const x = cx + dxPx;
              gaussPts.push(`${x.toFixed(1)},${(baseY - gVal * peakH).toFixed(1)}`);
              lorentzPts.push(`${x.toFixed(1)},${(baseY - lVal * peakH).toFixed(1)}`);
              activePts.push(`${x.toFixed(1)},${(baseY - pvVal * peakH).toFixed(1)}`);
            }

            // Shape factor gauge position (0.6366 Lorentzian -> 0.9394 Gaussian)
            const phiNorm = Math.max(0, Math.min(1, (shapeFactorVal - 0.6366) / (0.9394 - 0.6366)));

            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 select-none overflow-visible">
                <rect x="16" y="10" width="560" height="172" rx="6" fill="#070A12" stroke="#1E293B" strokeWidth="1" />
                <line x1="28" y1={baseY} x2="564" y2={baseY} stroke="#475569" strokeWidth="1.2" />

                {/* Lorentzian Cauchy Tails Curve */}
                <polyline points={lorentzPts.join(' ')} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="5,3" />
                {/* Gaussian Core Curve */}
                <polyline points={gaussPts.join(' ')} fill="none" stroke="#64748B" strokeWidth="1.8" strokeDasharray="2,2" />
                {/* Active Kernel Profile */}
                <polyline points={activePts.join(' ')} fill="none" stroke="#38BDF8" strokeWidth="2.6" />

                {/* Wing Tail Annotations */}
                <text x="115" y="132" fill="#F59E0B" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Cauchy 1/(1+x²) Wings (Size D_V)
                </text>
                <text x="475" y="148" fill="#94A3B8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                  Gaussian exp(-x²) Fast Decay (Strain ε)
                </text>
                <text x={cx} y="24" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Active Kernel: {type} (η = {(effEta * 100).toFixed(1)}%, φ = {shapeFactorVal.toFixed(4)})
                </text>

                {/* Right Analytical Kernel Comparison Panel */}
                <rect x="588" y="10" width="258" height="172" rx="6" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
                <text x="600" y="26" fill="#E2E8F0" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  VOIGT SHAPE FACTOR φ = FWHM / β_IB
                </text>
                <line x1="600" y1="32" x2="834" y2="32" stroke="#1E293B" strokeWidth="1" />

                {/* Shape Factor Continuum Bar */}
                <rect x="600" y="44" width="234" height="10" rx="5" fill="#070A12" stroke="#334155" strokeWidth="1" />
                <line x1={600 + phiNorm * 234} y1="40" x2={600 + phiNorm * 234} y2="58" stroke="#38BDF8" strokeWidth="2.5" />
                <circle cx={600 + phiNorm * 234} cy="49" r="4" fill="#38BDF8" stroke="#070A12" strokeWidth="1.2" />
                <text x="600" y="68" fill="#F59E0B" fontSize="8" fontFamily="monospace">Lorentzian φ=0.637</text>
                <text x="834" y="68" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="end">Gaussian φ=0.939</text>

                <text x="600" y="88" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Cauchy Fraction η:</text>
                <text x="834" y="88" fill="#F59E0B" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {(effEta * 100).toFixed(1)}% Lorentzian
                </text>

                <text x="600" y="106" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Gaussian Fraction (1-η):</text>
                <text x="834" y="106" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {((1 - effEta) * 100).toFixed(1)}% Gaussian
                </text>

                <text x="600" y="124" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Tail Ratio FWTM/FWHM:</text>
                <text x="834" y="124" fill="#10B981" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {fwtmRatioVal.toFixed(3)} (G:1.823 · L:3.000)
                </text>

                <text x="600" y="142" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Pearson VII Exponent m:</text>
                <text x="834" y="142" fill="#E2E8F0" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  m = {Number(pearsonM ?? 2).toFixed(2)} (m=1 Cauchy, m→∞ Gauss)
                </text>

                <text x="600" y="164" fill="#64748B" fontSize="8" fontFamily="monospace">
                  I_PV(x) = I₀[(1-η)exp(-ln2·x²) + η/(1+x²)]
                </text>
              </svg>
            );
          })()}

          {mode === 'doublet' && (() => {
            const W = 860;
            const H = 195;
            const cx = 275;
            const baseY = 166;
            const peakH = 128;
            const halfW = 42;
            const splitPx = 36; // Ka1 to Ka2 separation
            const asym = Math.max(0.4, Math.min(2.5, asymFactorVal || asymmetry || 1.0));

            const ka1Pts: string[] = [];
            const ka2Pts: string[] = [];
            const sumPts: string[] = [];

            for (let i = 0; i <= 100; i++) {
              const dxPx = -220 + (i / 100) * 480;
              const wLocal1 = dxPx < 0 ? halfW / Math.sqrt(asym) : halfW * Math.sqrt(asym);
              const u1 = dxPx / wLocal1;
              const y1 = (1 - effEta) * Math.exp(-Math.LN2 * u1 * u1) + effEta / (1 + u1 * u1);

              const dx2 = dxPx - splitPx;
              const wLocal2 = dx2 < 0 ? halfW / Math.sqrt(asym) : halfW * Math.sqrt(asym);
              const u2 = dx2 / wLocal2;
              const y2 = 0.5 * ((1 - effEta) * Math.exp(-Math.LN2 * u2 * u2) + effEta / (1 + u2 * u2));

              const ySum = Math.min(1.12, y1 + y2);
              const x = cx + dxPx;
              ka1Pts.push(`${x.toFixed(1)},${(baseY - y1 * peakH).toFixed(1)}`);
              ka2Pts.push(`${x.toFixed(1)},${(baseY - y2 * peakH).toFixed(1)}`);
              sumPts.push(`${x.toFixed(1)},${(baseY - ySum * peakH).toFixed(1)}`);
            }

            const halfMaxY = baseY - peakH * 0.5;
            const leftHwhmPx = halfW / Math.sqrt(asym);
            const rightHwhmPx = halfW * Math.sqrt(asym);

            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 select-none overflow-visible">
                <rect x="16" y="10" width="560" height="172" rx="6" fill="#070A12" stroke="#1E293B" strokeWidth="1" />
                <line x1="28" y1={baseY} x2="564" y2={baseY} stroke="#475569" strokeWidth="1.2" />

                {/* Composite Envelope */}
                <polyline points={sumPts.join(' ')} fill="none" stroke="#38BDF8" strokeWidth="2.5" />
                {/* Ka1 Primary Component */}
                <polyline points={ka1Pts.join(' ')} fill="none" stroke="#10B981" strokeWidth="1.8" strokeDasharray="4,2" />
                {/* Ka2 Secondary Component */}
                <polyline points={ka2Pts.join(' ')} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="3,3" />

                {/* Ka1 and Ka2 Centroids */}
                <line x1={cx} y1={baseY - peakH} x2={cx} y2={baseY} stroke="#10B981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1={cx + splitPx} y1={baseY - peakH * 0.5} x2={cx + splitPx} y2={baseY} stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />

                {/* HWHM_L and HWHM_R Asymmetry Vectors */}
                <line x1={cx - leftHwhmPx} y1={halfMaxY} x2={cx} y2={halfMaxY} stroke="#A855F7" strokeWidth="2.2" />
                <line x1={cx} y1={halfMaxY} x2={cx + rightHwhmPx} y2={halfMaxY} stroke="#38BDF8" strokeWidth="2.2" />
                <text x={cx - leftHwhmPx / 2} y={halfMaxY - 6} fill="#C084FC" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  HWHM_L={hwhmLeftVal.toFixed(3)}°
                </text>
                <text x={cx + rightHwhmPx / 2} y={halfMaxY + 13} fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  HWHM_R={hwhmRightVal.toFixed(3)}°
                </text>

                <text x={cx - 8} y="26" fill="#10B981" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  Kα₁ (100% I₀)
                </text>
                <text x={cx + splitPx + 10} y={baseY - peakH * 0.5 - 6} fill="#F59E0B" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  Kα₂ (50% I₀, Δ2θ = 2tanθ·Δλ/λ)
                </text>

                {/* Right Telemetry Box */}
                <rect x="588" y="10" width="258" height="172" rx="6" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
                <text x="600" y="26" fill="#E2E8F0" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  ASYMMETRY &amp; DOUBLET DISPERSION
                </text>
                <line x1="600" y1="32" x2="834" y2="32" stroke="#1E293B" strokeWidth="1" />

                <text x="600" y="50" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Left HWHM_L:</text>
                <text x="834" y="50" fill="#C084FC" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {hwhmLeftVal.toFixed(4)}°
                </text>

                <text x="600" y="68" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Right HWHM_R:</text>
                <text x="834" y="68" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {hwhmRightVal.toFixed(4)}°
                </text>

                <text x="600" y="86" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Asymmetry Ratio A_s:</text>
                <text x="834" y="86" fill="#10B981" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {asymFactorVal.toFixed(3)} (HWHM_R / HWHM_L)
                </text>

                <text x="600" y="104" fill="#94A3B8" fontSize="8.5" fontFamily="monospace">Kα₁/Kα₂ Doublet State:</text>
                <text x="834" y="104" fill={enableKaDoublet ? '#F59E0B' : '#64748B'} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  {enableKaDoublet ? 'ACTIVE (I₂/I₁ = 0.50)' : 'SINGLE WAVELENGTH'}
                </text>

                <text x="600" y="128" fill="#64748B" fontSize="8" fontFamily="monospace">
                  Rachinger Correction:
                </text>
                <text x="600" y="142" fill="#94A3B8" fontSize="8" fontFamily="monospace">
                  I_Kα1(2θ) = I_obs(2θ) - 0.5·I_Kα1(2θ - Δ2θ)
                </text>
                <text x="600" y="160" fill="#38BDF8" fontSize="8" fontFamily="monospace">
                  Axial Divergence &amp; Finger-Cox-Jephcoat
                </text>
              </svg>
            );
          })()}
        </div>
      )}
    </div>
  );
};
