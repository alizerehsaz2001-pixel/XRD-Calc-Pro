import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  MoveHorizontal,
  Activity,
  ChevronDown,
  ChevronUp,
  Crosshair
} from 'lucide-react';
import {
  SpectralMetrics,
  StrainRegressionAnalysis,
  PhaseQuantificationResult,
  PeakItem,
  CurveColorPalette
} from './types';

interface CompareCadSchematicProps {
  metrics: SpectralMetrics;
  meanShift: number;
  strainRegression: StrainRegressionAnalysis;
  phaseQuant: PhaseQuantificationResult;
  peaksA: PeakItem[];
  peaksB: PeakItem[];
  materialAName: string;
  materialBName: string;
  materialCName?: string;
  materialDName?: string;
  hasPhaseC: boolean;
  hasPhaseD: boolean;
  shiftTwoTheta: number;
  activePalette: CurveColorPalette;
}

type SchematicMode = 'kinematics' | 'rir_nnls' | 'vector_space';

export const CompareCadSchematic: React.FC<CompareCadSchematicProps> = ({
  metrics,
  meanShift,
  strainRegression,
  phaseQuant,
  peaksA,
  peaksB,
  materialAName,
  materialBName,
  materialCName,
  materialDName,
  hasPhaseC,
  hasPhaseD,
  shiftTwoTheta,
  activePalette
}) => {
  const [mode, setMode] = useState<SchematicMode>('kinematics');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const cosSim = parseFloat(metrics.cosineSimilarity) || 0;
  const rwpVal = parseFloat(metrics.rWP) || 0;
  const chi2Val = parseFloat(metrics.chiSquared) || 1;
  const dwVal = parseFloat(metrics.durbinWatson) || 2.0;

  // Strongest peak pair for schematic display
  const mainPeakA = peaksA.length > 0
    ? [...peaksA].sort((a, b) => b.intensity - a.intensity)[0]
    : { twoTheta: 31.77, intensity: 100, dSpacing: 2.814, hkl: '211' };
  const mainPeakB = peaksB.length > 0
    ? [...peaksB].sort((a, b) => b.intensity - a.intensity)[0]
    : { twoTheta: 31.77, intensity: 100, dSpacing: 2.814, hkl: '211' };

  const visualShiftPx = Math.max(-36, Math.min(36, (meanShift + shiftTwoTheta) * 90));
  const strainPct = strainRegression.trueMacrostrainPercent || 0;
  const zeroShiftDeg = strainRegression.zeroShiftDeg || 0;

  // Hilbert vector angle in degrees (clamped for visual clarity)
  const vectorAngleDeg = Math.acos(Math.max(0, Math.min(1, cosSim / 100))) * (180 / Math.PI);
  const clampedAngleRad = Math.min(72, Math.max(4, vectorAngleDeg)) * (Math.PI / 180);

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      {/* CAD Header Bar */}
      <div className="px-4 py-2.5 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 bg-sky-400" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-200">
            CAD DIFFERENTIAL CRYSTALLOGRAPHY & METROLOGY SCHEMATIC
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 border-l border-slate-800 pl-2.5">
            BRAGG SHIFT KINEMATICS · RIR MATRIX FLUSHING · HILBERT RESIDUAL TOPOLOGY
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto justify-end">
          <div className="flex items-center bg-[#0B0F19] border border-slate-800 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => { setMode('kinematics'); setIsCollapsed(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'kinematics' && !isCollapsed
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <MoveHorizontal className="w-3 h-3 text-sky-400" />
              <span>01. Bragg Shift & Vegard Strain</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('rir_nnls'); setIsCollapsed(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'rir_nnls' && !isCollapsed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>02. RIR (I/Ic) & NNLS Partition</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('vector_space'); setIsCollapsed(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'vector_space' && !isCollapsed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>03. Hilbert Vector & Rwp Space</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand CAD Schematic' : 'Collapse CAD Schematic'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main CAD SVG Canvas */}
      {!isCollapsed && (
        <div className="p-3 lg:p-4 bg-[#070A12]">
          {mode === 'kinematics' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
              <div className="xl:col-span-8 bg-[#050811] border border-slate-800/90 rounded-md p-2 overflow-x-auto">
                <svg
                  viewBox="0 0 760 230"
                  className="w-full h-auto min-w-[580px] select-none"
                  role="img"
                  aria-label="Differential Bragg Kinematics and Vegard Law Strain CAD Diagram"
                >
                  <defs>
                    <pattern id="cadGridKin" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.55" />
                    </pattern>
                    <marker id="arrowCyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker id="arrowIndigo" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
                    </marker>
                    <marker id="arrowAmber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                    </marker>
                  </defs>

                  <rect width="760" height="230" fill="url(#cadGridKin)" />

                  {/* Divider between Left (Lattice Space) and Right (Reciprocal/2Theta Space) */}
                  <line x1="375" y1="12" x2="375" y2="218" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                  {/* LEFT PANEL: REAL-SPACE INTERPLANAR LATTICE DISTORTION */}
                  <text x="16" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    A. REAL-SPACE LATTICE PLANES (d_A vs d_B) &amp; SPECIMEN OFFSET
                  </text>

                  {/* Reference B Lattice Planes (Dashed Indigo) */}
                  {[95, 135, 175].map((yPos, idx) => (
                    <g key={`ref-plane-${idx}`}>
                      <line x1="45" y1={yPos} x2="325" y2={yPos} stroke={activePalette.colorB} strokeWidth="1.3" strokeDasharray="5 3" strokeOpacity="0.8" />
                      {[75, 130, 185, 240, 295].map((xPos, aIdx) => (
                        <circle key={`ref-atom-${idx}-${aIdx}`} cx={xPos} cy={yPos} r="3" fill="none" stroke={activePalette.colorB} strokeWidth="1.2" opacity="0.75" />
                      ))}
                    </g>
                  ))}

                  {/* Experimental A Lattice Planes (Solid Cyan, shifted by strain) */}
                  {[
                    95 - Math.max(-10, Math.min(10, strainPct * 35)),
                    135,
                    175 + Math.max(-10, Math.min(10, strainPct * 35))
                  ].map((yPos, idx) => (
                    <g key={`exp-plane-${idx}`}>
                      <line x1="45" y1={yPos} x2="325" y2={yPos} stroke={activePalette.colorA} strokeWidth="1.6" />
                      {[75, 130, 185, 240, 295].map((xPos, aIdx) => (
                        <circle key={`exp-atom-${idx}-${aIdx}`} cx={xPos} cy={yPos} r="3.2" fill={activePalette.colorA} />
                      ))}
                    </g>
                  ))}

                  {/* Incident & Diffracted X-ray Beams */}
                  <line x1="58" y1="42" x2="185" y2="95" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#arrowCyan)" />
                  <line x1="185" y1="95" x2="312" y2="42" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#arrowCyan)" />
                  <line x1="185" y1="95" x2="305" y2="54" stroke={activePalette.colorB} strokeWidth="1.4" strokeDasharray="3 3" markerEnd="url(#arrowIndigo)" />

                  <text x="62" y="38" fill="#38bdf8" fontSize="9" fontFamily="monospace">k₀ (Cu Kα₁ = 1.5406 Å)</text>
                  <text x="255" y="38" fill="#38bdf8" fontSize="9" fontFamily="monospace">k_A (2θ_A)</text>
                  <text x="275" y="68" fill={activePalette.colorB} fontSize="8.5" fontFamily="monospace">k_B (2θ_B)</text>

                  {/* d-spacing dimension callouts */}
                  <line x1="340" y1="95" x2="340" y2="135" stroke="#f59e0b" strokeWidth="1.2" markerStart="url(#arrowAmber)" markerEnd="url(#arrowAmber)" />
                  <text x="346" y="118" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    d±Δd
                  </text>

                  {/* Bottom formula box in left viewport */}
                  <rect x="20" y="192" width="338" height="26" rx="3" fill="#0B0F19" stroke="#1e293b" />
                  <text x="28" y="208" fill="#e2e8f0" fontSize="9.5" fontFamily="monospace">
                    Δ2θ(θ) = Δ2θ₀ - (2s/R)·cosθ - 2ε·tanθ  [ε = Δd/d = {strainPct >= 0 ? `+${strainPct.toFixed(3)}` : strainPct.toFixed(3)}%]
                  </text>

                  {/* RIGHT PANEL: DIFFERENTIAL BRAGG PEAK DISPLACEMENT IN 2THETA SPACE */}
                  <text x="392" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    B. RECIPROCAL-SPACE REFLECTION SHIFT &amp; RESIDUAL PROFILE
                  </text>

                  {/* Baseline axis */}
                  <line x1="400" y1="168" x2="740" y2="168" stroke="#475569" strokeWidth="1.2" />

                  {/* Reference B Gaussian/Voigt Profile centered at x = 560 */}
                  <path
                    d="M 420 168 Q 515 168 538 115 Q 560 42 582 115 Q 605 168 700 168"
                    fill={activePalette.colorB}
                    fillOpacity="0.12"
                    stroke={activePalette.colorB}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <line x1="560" y1="42" x2="560" y2="168" stroke={activePalette.colorB} strokeWidth="1" strokeDasharray="2 2" />
                  <text x="560" y="35" textAnchor="middle" fill={activePalette.colorB} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Ref B ({mainPeakB.twoTheta.toFixed(2)}°)
                  </text>

                  {/* Experimental Sample A Profile shifted by visualShiftPx */}
                  <g transform={`translate(${visualShiftPx}, 0)`}>
                    <path
                      d="M 420 168 Q 515 168 538 110 Q 560 36 582 110 Q 605 168 700 168"
                      fill={activePalette.colorA}
                      fillOpacity="0.18"
                      stroke={activePalette.colorA}
                      strokeWidth="2.2"
                    />
                    <line x1="560" y1="36" x2="560" y2="168" stroke={activePalette.colorA} strokeWidth="1.2" strokeDasharray="2 2" />
                    <text x="560" y="52" textAnchor="middle" fill={activePalette.colorA} fontSize="9" fontFamily="monospace" fontWeight="bold">
                      Exp A ({mainPeakA.twoTheta.toFixed(2)}°)
                    </text>
                  </g>

                  {/* Shift Vector Arrow */}
                  <line
                    x1="560"
                    y1="82"
                    x2={560 + (Math.abs(visualShiftPx) < 6 ? 18 : visualShiftPx)}
                    y2="82"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                    markerEnd="url(#arrowAmber)"
                  />

                  {/* Telemetry Callout Box */}
                  <rect x="396" y="182" width="346" height="36" rx="3" fill="#0B0F19" stroke="#1e293b" />
                  <text x="406" y="197" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Mean Δ2θ: {meanShift >= 0 ? `+${meanShift.toFixed(3)}°` : `${meanShift.toFixed(3)}°`}
                  </text>
                  <text x="530" y="197" fill="#818cf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Zero-Offset Δ2θ₀: {zeroShiftDeg >= 0 ? `+${zeroShiftDeg.toFixed(3)}°` : `${zeroShiftDeg.toFixed(3)}°`}
                  </text>
                  <text x="406" y="211" fill="#f59e0b" fontSize="9" fontFamily="monospace">
                    Vegard Macrostrain ε: {strainPct >= 0 ? `+${strainPct.toFixed(4)}%` : `${strainPct.toFixed(4)}%`} ({strainPct > 0.01 ? 'Tensile Expansion' : strainPct < -0.01 ? 'Compressive Contraction' : 'Relaxed Lattice'})
                  </text>
                </svg>
              </div>

              {/* Right Column: Live Kinematic Equations & Parameters */}
              <div className="xl:col-span-4 space-y-2.5 font-mono text-xs">
                <div className="p-3 bg-[#0B0F19] border border-slate-800 rounded-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      Differential Bragg Law
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      R² = {strainRegression.regressionR2.toFixed(3)}
                    </span>
                  </div>
                  <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded text-[11px] text-slate-200 leading-relaxed">
                    <div>Δd / d = -cot(θ) · Δθ</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Δ2θ(θ) = Δ2θ₀ - (2s/R)cosθ - 2ε·tanθ
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 tabular-nums">
                    <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-500 uppercase block">Zero-Shift Δ2θ₀</span>
                      <span className="text-xs font-bold text-indigo-300">
                        {zeroShiftDeg >= 0 ? `+${zeroShiftDeg.toFixed(4)}°` : `${zeroShiftDeg.toFixed(4)}°`}
                      </span>
                    </div>
                    <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-500 uppercase block">True Strain ε</span>
                      <span className="text-xs font-bold text-amber-400">
                        {strainPct >= 0 ? `+${strainPct.toFixed(4)}%` : `${strainPct.toFixed(4)}%`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0B0F19] border border-slate-800 rounded-md space-y-1.5 tabular-nums">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Primary Peak (A vs B):</span>
                    <span className="text-slate-200 font-bold">
                      {mainPeakA.twoTheta.toFixed(2)}° vs {mainPeakB.twoTheta.toFixed(2)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Manual Goniometer Shift:</span>
                    <span className="text-sky-400 font-bold">
                      {shiftTwoTheta >= 0 ? `+${shiftTwoTheta.toFixed(2)}°` : `${shiftTwoTheta.toFixed(2)}°`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Paired Reflections (N):</span>
                    <span className="text-emerald-400 font-bold">
                      {strainRegression.pairedPoints.length} (hkl) pairs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'rir_nnls' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
              <div className="xl:col-span-8 bg-[#050811] border border-slate-800/90 rounded-md p-2 overflow-x-auto">
                <svg
                  viewBox="0 0 760 230"
                  className="w-full h-auto min-w-[580px] select-none"
                  role="img"
                  aria-label="Multi-Phase RIR and NNLS Spectral Partitioning CAD Schematic"
                >
                  <defs>
                    <pattern id="cadGridRir" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.55" />
                    </pattern>
                  </defs>
                  <rect width="760" height="230" fill="url(#cadGridRir)" />

                  <text x="16" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    MULTI-PHASE NNLS DECONVOLUTION &amp; CORUNDUM (I/Ic) MATRIX-FLUSHING ARCHITECTURE
                  </text>

                  {/* Left Box: Experimental Composite Vector I_A(2Theta) */}
                  <rect x="20" y="42" width="190" height="145" rx="4" fill="#0B0F19" stroke={activePalette.colorA} strokeWidth="1.4" />
                  <text x="32" y="60" fill={activePalette.colorA} fontSize="10" fontFamily="monospace" fontWeight="bold">
                    OBSERVED COMPOSITE I_A(2θ)
                  </text>
                  <text x="32" y="75" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    {materialAName.slice(0, 26)}
                  </text>
                  <path
                    d="M 32 155 L 55 155 L 68 95 L 80 155 L 102 155 L 114 112 L 125 155 L 148 85 L 160 155 L 175 128 L 188 155 L 198 155"
                    fill="none"
                    stroke={activePalette.colorA}
                    strokeWidth="2"
                  />
                  <text x="32" y="176" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                    I_A(2θ) = Σ S_α·I_α(2θ) + ε_res
                  </text>

                  {/* Center: NNLS + RIR Solver Engine Node */}
                  <line x1="210" y1="114" x2="268" y2="114" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3 3" />
                  <rect x="268" y="48" width="205" height="132" rx="4" fill="#0B0F19" stroke="#f59e0b" strokeWidth="1.4" />
                  <text x="280" y="68" fill="#f59e0b" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    NNLS + RIR (I/Ic) SOLVER
                  </text>
                  <text x="280" y="86" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    min ||I_A - Σ S_k·I_k||₂²  (S_k ≥ 0)
                  </text>
                  <line x1="280" y1="95" x2="460" y2="95" stroke="#1e293b" strokeWidth="1" />
                  <text x="280" y="112" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
                    W_α = (S_α / RIR_α) / Σ(S_k / RIR_k)
                  </text>
                  <text x="280" y="130" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    RIR_B = {phaseQuant.rirB.toFixed(2)} | RIR_C = {phaseQuant.rirC.toFixed(2)} | RIR_D = {phaseQuant.rirD.toFixed(2)}
                  </text>
                  <text x="280" y="148" fill="#10b981" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    Residual RMS = {phaseQuant.residualNorm}
                  </text>
                  <text x="280" y="166" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                    Standard: NIST α-Al₂O₃ (Corundum)
                  </text>

                  {/* Right: Partitioned Phase Channels B, C, D */}
                  <line x1="473" y1="80" x2="520" y2="62" stroke={activePalette.colorB} strokeWidth="1.5" />
                  <line x1="473" y1="114" x2="520" y2="114" stroke={activePalette.colorC} strokeWidth="1.5" />
                  <line x1="473" y1="148" x2="520" y2="166" stroke={activePalette.colorD} strokeWidth="1.5" />

                  {/* Phase B Box */}
                  <rect x="520" y="38" width="222" height="44" rx="3" fill="#0B0F19" stroke={activePalette.colorB} strokeWidth="1.2" />
                  <text x="530" y="54" fill={activePalette.colorB} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    PHASE B: {materialBName.slice(0, 18)}
                  </text>
                  <text x="530" y="71" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
                    W_B = {phaseQuant.wtPercentB.toFixed(1)} wt% (S_B={phaseQuant.scaleFactorB.toFixed(2)})
                  </text>

                  {/* Phase C Box */}
                  <rect x="520" y="92" width="222" height="44" rx="3" fill="#0B0F19" stroke={hasPhaseC ? activePalette.colorC : '#334155'} strokeWidth="1.2" />
                  <text x="530" y="108" fill={hasPhaseC ? activePalette.colorC : '#64748b'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    PHASE C: {hasPhaseC ? (materialCName || 'Secondary').slice(0, 18) : 'INACTIVE CHANNEL'}
                  </text>
                  <text x="530" y="125" fill={hasPhaseC ? '#e2e8f0' : '#64748b'} fontSize="9" fontFamily="monospace">
                    W_C = {phaseQuant.wtPercentC.toFixed(1)} wt% (S_C={phaseQuant.scaleFactorC.toFixed(2)})
                  </text>

                  {/* Phase D Box */}
                  <rect x="520" y="146" width="222" height="44" rx="3" fill="#0B0F19" stroke={hasPhaseD ? activePalette.colorD : '#334155'} strokeWidth="1.2" />
                  <text x="530" y="162" fill={hasPhaseD ? activePalette.colorD : '#64748b'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    PHASE D: {hasPhaseD ? (materialDName || 'Tertiary').slice(0, 18) : 'INACTIVE CHANNEL'}
                  </text>
                  <text x="530" y="179" fill={hasPhaseD ? '#e2e8f0' : '#64748b'} fontSize="9" fontFamily="monospace">
                    W_D = {phaseQuant.wtPercentD.toFixed(1)} wt% (S_D={phaseQuant.scaleFactorD.toFixed(2)})
                  </text>

                  {/* Bottom Mass Balance Bar */}
                  <rect x="20" y="200" width="722" height="18" rx="3" fill="#0B0F19" stroke="#1e293b" />
                  <text x="30" y="212" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    MASS BALANCE CLOSURE: Σ W_α = {(phaseQuant.wtPercentB + phaseQuant.wtPercentC + phaseQuant.wtPercentD).toFixed(1)} wt%  |  CRYSTALLINE PURITY FOM = {metrics.fom}/100
                  </text>
                </svg>
              </div>

              <div className="xl:col-span-4 space-y-2.5 font-mono text-xs">
                <div className="p-3 bg-[#0B0F19] border border-slate-800 rounded-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Chung Matrix-Flushing RIR Law
                    </span>
                    <span className="text-[10px] text-slate-400">I/Ic Corundum</span>
                  </div>
                  <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded text-[11px] text-slate-200 leading-relaxed">
                    <div>W_α = [I_α / (I/Ic)_α] / Σ [I_k / (I/Ic)_k]</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Corrects raw spectral integral fractions for anomalous X-ray scattering power.
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1 tabular-nums">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Phase B Weight %:</span>
                      <span className="font-bold text-indigo-300">{phaseQuant.wtPercentB.toFixed(1)} wt% (RIR {phaseQuant.rirB.toFixed(1)})</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Phase C Weight %:</span>
                      <span className="font-bold text-purple-300">{phaseQuant.wtPercentC.toFixed(1)} wt% (RIR {phaseQuant.rirC.toFixed(1)})</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Phase D Weight %:</span>
                      <span className="font-bold text-rose-300">{phaseQuant.wtPercentD.toFixed(1)} wt% (RIR {phaseQuant.rirD.toFixed(1)})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'vector_space' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
              <div className="xl:col-span-8 bg-[#050811] border border-slate-800/90 rounded-md p-2 overflow-x-auto">
                <svg
                  viewBox="0 0 760 230"
                  className="w-full h-auto min-w-[580px] select-none"
                  role="img"
                  aria-label="Hilbert Vector Correlation and Rietveld Rwp Residual Space CAD Diagram"
                >
                  <defs>
                    <pattern id="cadGridVec" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.55" />
                    </pattern>
                  </defs>
                  <rect width="760" height="230" fill="url(#cadGridVec)" />

                  <line x1="365" y1="12" x2="365" y2="218" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                  {/* LEFT: HILBERT INNER-PRODUCT VECTOR PROJECTION */}
                  <text x="16" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    A. HILBERT SPECTRAL VECTOR PROJECTION (S_cos = I_A·I_B / ||I_A||||I_B||)
                  </text>

                  {/* Origin at (65, 180) */}
                  <line x1="65" y1="180" x2="330" y2="180" stroke="#475569" strokeWidth="1.2" />
                  <line x1="65" y1="180" x2="65" y2="38" stroke="#475569" strokeWidth="1.2" />

                  {/* Reference Vector I_B along horizontal axis */}
                  <line x1="65" y1="180" x2="295" y2="180" stroke={activePalette.colorB} strokeWidth="2.8" />
                  <circle cx="295" cy="180" r="4" fill={activePalette.colorB} />
                  <text x="235" y="198" fill={activePalette.colorB} fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    Vector I_B (Reference)
                  </text>

                  {/* Experimental Vector I_A rotated by clampedAngleRad */}
                  {(() => {
                    const len = 215;
                    const endX = 65 + len * Math.cos(clampedAngleRad);
                    const endY = 180 - len * Math.sin(clampedAngleRad);
                    const projX = endX;
                    return (
                      <g>
                        {/* Orthogonal residual vector r = I_A - proj(I_A) */}
                        <line x1={projX} y1="180" x2={endX} y2={endY} stroke="#f43f5e" strokeWidth="1.8" strokeDasharray="4 3" />
                        <text x={projX + 8} y={(180 + endY) / 2} fill="#f43f5e" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          ||r|| (R_wp = {rwpVal.toFixed(1)}%)
                        </text>

                        {/* Experimental Vector I_A */}
                        <line x1="65" y1="180" x2={endX} y2={endY} stroke={activePalette.colorA} strokeWidth="2.8" />
                        <circle cx={endX} cy={endY} r="4" fill={activePalette.colorA} />
                        <text x={endX - 20} y={Math.max(46, endY - 10)} fill={activePalette.colorA} fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                          Vector I_A (Exp)
                        </text>

                        {/* Angle Arc */}
                        <path
                          d={`M 125 180 A 60 60 0 0 0 ${65 + 60 * Math.cos(clampedAngleRad)} ${180 - 60 * Math.sin(clampedAngleRad)}`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                        />
                        <text x="132" y="166" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          θ_AB = {vectorAngleDeg.toFixed(1)}° (cosθ = {metrics.cosineSimilarity}%)
                        </text>
                      </g>
                    );
                  })()}

                  {/* RIGHT: DURBIN-WATSON & RIETVELD CONVERGENCE METRICS */}
                  <text x="382" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    B. STATISTICAL CONVERGENCE &amp; SERIAL CORRELATION TOPOLOGY
                  </text>

                  {/* Metric Bars */}
                  {[
                    { label: 'Cosine Similarity (S_cos)', val: `${metrics.cosineSimilarity}%`, pct: Math.min(100, cosSim), color: '#38bdf8' },
                    { label: 'Pearson Linear (r)', val: `${metrics.pearsonR}%`, pct: Math.min(100, Math.max(0, parseFloat(metrics.pearsonR))), color: '#10b981' },
                    { label: 'Weighted Residual (100 - R_wp)', val: `R_wp = ${metrics.rWP}%`, pct: Math.max(5, 100 - rwpVal), color: '#f59e0b' },
                    { label: 'Search-Match FOM Index', val: `${metrics.fom} / 100`, pct: Math.min(100, parseFloat(String(metrics.fom)) || 0), color: '#a855f7' }
                  ].map((bar, idx) => {
                    const yTop = 44 + idx * 38;
                    return (
                      <g key={bar.label}>
                        <text x="385" y={yTop} fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                          {bar.label}
                        </text>
                        <text x="740" y={yTop} textAnchor="end" fill={bar.color} fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                          {bar.val}
                        </text>
                        <rect x="385" y={yTop + 6} width="355" height="10" rx="2" fill="#0B0F19" stroke="#1e293b" />
                        <rect x="385" y={yTop + 6} width={Math.max(4, (355 * bar.pct) / 100)} height="10" rx="2" fill={bar.color} fillOpacity="0.85" />
                      </g>
                    );
                  })}

                  <rect x="385" y="194" width="355" height="24" rx="3" fill="#0B0F19" stroke="#1e293b" />
                  <text x="394" y="210" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
                    χ² = (R_wp/R_exp)² = {chi2Val.toFixed(2)}  |  Durbin-Watson d_DW = {dwVal.toFixed(3)}
                  </text>
                </svg>
              </div>

              <div className="xl:col-span-4 space-y-2.5 font-mono text-xs">
                <div className="p-3 bg-[#0B0F19] border border-slate-800 rounded-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                       Hilbert &amp; Rietveld Agreement
                    </span>
                    <span className="text-[10px] text-slate-400">N = 801 pts</span>
                  </div>
                  <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded text-[11px] text-slate-200 leading-relaxed">
                    <div>R_wp = √[ Σ w_i(I_A,i - I_calc,i)² / Σ w_i I_A,i² ]</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      d_DW = Σ(Δ_i - Δ_&#123;i-1&#125;)² / Σ Δ_i² (Ideal white noise ≈ 2.0)
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 tabular-nums">
                    <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-500 uppercase block">Bragg R_B</span>
                      <span className="text-xs font-bold text-indigo-300">{metrics.braggR}%</span>
                    </div>
                    <div className="p-2 bg-[#070A12] border border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-500 uppercase block">Spearman ρ</span>
                      <span className="text-xs font-bold text-emerald-400">{metrics.spearmanRho}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
