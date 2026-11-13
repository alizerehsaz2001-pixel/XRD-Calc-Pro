import React, { useState, useMemo } from 'react';
import {
  XRRLayer,
  CriticalAngleResult,
  KiessigAnalysisResult,
  FFTThicknessResult
} from '../../utils/xrrPhysics';
import { Layers, Activity, Compass, Sliders, Sparkles, Eye } from 'lucide-react';
import katex from 'katex';

interface XRRCadSchematicProps {
  layers: XRRLayer[];
  wavelength: number;
  roughnessModel: string;
  critAngleResult: CriticalAngleResult | null;
  kiessigResult: KiessigAnalysisResult | null;
  fftResult: FFTThicknessResult | null;
}

const LAYER_PALETTE = [
  { fill: 'rgba(6, 182, 212, 0.22)', stroke: '#22d3ee', text: '#67e8f9' },
  { fill: 'rgba(99, 102, 241, 0.22)', stroke: '#818cf8', text: '#a5b4fc' },
  { fill: 'rgba(16, 185, 129, 0.22)', stroke: '#34d399', text: '#6ee7b7' },
  { fill: 'rgba(245, 158, 11, 0.22)', stroke: '#fbbf24', text: '#fde68a' },
  { fill: 'rgba(168, 85, 247, 0.22)', stroke: '#c084fc', text: '#d8b4fe' }
];

export const XRRCadSchematic: React.FC<XRRCadSchematicProps> = ({
  layers,
  wavelength,
  roughnessModel,
  critAngleResult,
  kiessigResult
}) => {
  const [activeMode, setActiveMode] = useState<'rayOptics' | 'curveAnatomy' | 'stackMatrix'>('rayOptics');
  const [probeThetaDeg, setProbeThetaDeg] = useState<number>(0.65);

  const thetaCritDeg = critAngleResult?.thetaCritDeg ?? 0.28;
  const isTotalReflection = probeThetaDeg <= thetaCritDeg;
  const probeQz = useMemo(() => {
    const rad = (probeThetaDeg * Math.PI) / 180;
    return (4 * Math.PI * Math.sin(rad)) / (wavelength || 1.54056);
  }, [probeThetaDeg, wavelength]);

  // Pre-rendered KaTeX equations
  const eqParratt = useMemo(
    () =>
      katex.renderToString(
        'X_j = \\frac{R_j}{T_j} = e^{-2i k_{z,j} d_j} \\frac{r_{j,j+1} + X_{j+1} e^{2i k_{z,j+1} d_{j+1}}}{1 + r_{j,j+1} X_{j+1} e^{2i k_{z,j+1} d_{j+1}}}',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqNevotCroce = useMemo(
    () =>
      katex.renderToString(
        'r_{j,j+1}^{\\text{rough}} = r_{j,j+1}^{\\text{Fresnel}} \\cdot \\exp\\!\\left(-2 k_{z,j} k_{z,j+1} \\sigma_j^2\\right)',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  const eqModBragg = useMemo(
    () =>
      katex.renderToString(
        '\\sin^2\\theta_m = \\left(\\frac{\\lambda}{2 d_{\\text{total}}}\\right)^2 m^2 + \\theta_c^2',
        { throwOnError: false, displayMode: false }
      ),
    []
  );

  // Compute proportional layer bands for SVG cross-section
  const stackGeometry = useMemo(() => {
    const finiteLayers = layers.filter(l => l.thickness > 0);
    const substrate = layers.find(l => l.thickness === 0) || layers[layers.length - 1];
    const totalThicknessA = finiteLayers.reduce((acc, l) => acc + l.thickness, 0) || 100;

    const topSurfaceY = 56;
    const maxFilmStackHeightPx = 92;
    let currentY = topSurfaceY;

    const filmBands = finiteLayers.map((layer, idx) => {
      const rawFrac = layer.thickness / totalThicknessA;
      const heightPx = Math.max(20, Math.min(64, rawFrac * maxFilmStackHeightPx));
      const band = {
        layer,
        idx,
        yTop: currentY,
        yBottom: currentY + heightPx,
        heightPx,
        palette: LAYER_PALETTE[idx % LAYER_PALETTE.length]
      };
      currentY += heightPx;
      return band;
    });

    return {
      topSurfaceY,
      substrateY: currentY,
      totalThicknessA,
      filmBands,
      substrate
    };
  }, [layers]);

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
      {/* Top Header & 3-Mode Switcher */}
      <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Specular X-Ray Reflectometry (XRR) Metrology &amp; Optical Formalism
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Parratt Recursive Matrix Formalism • Névot–Croce Interfacial Roughness • Modified Bragg Fringe Analysis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0F19] p-1 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('rayOptics')}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'rayOptics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>01. Grazing-Incidence Ray Optics CAD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('curveAnatomy')}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'curveAnatomy'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>02. How to Read an XRR Curve</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('stackMatrix')}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'stackMatrix'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>03. Optical Index &amp; SLD Matrix</span>
          </button>
        </div>
      </div>

      {/* MODE 1: GRAZING-INCIDENCE RAY OPTICS & PARRATT RECURSION CAD */}
      {activeMode === 'rayOptics' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 7 Cols: Interactive Stratified Ray-Tracing CAD Cross-Section */}
            <div className="lg:col-span-7 bg-[#070A12] border border-slate-800 rounded p-3 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                  CAD Cross-Section: Stratified Interference &amp; Evanescent Wave Regime
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isTotalReflection
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  {isTotalReflection
                    ? `θ ≤ θc (${thetaCritDeg.toFixed(2)}°): Total External Reflection`
                    : `θ > θc (${thetaCritDeg.toFixed(2)}°): Multilayer Kiessig Interference`}
                </span>
              </div>

              <svg viewBox="0 0 540 195" className="w-full h-48 bg-[#050811] border border-slate-800/80 rounded">
                {/* Ambient Vacuum / Air Header */}
                <text x="14" y="20" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                  Ambient Medium (n₀ = 1.000000, z &lt; 0 Å)
                </text>

                {/* Render Film Layers */}
                {stackGeometry.filmBands.map((band) => (
                  <g key={band.layer.id}>
                    <rect
                      x="10"
                      y={band.yTop}
                      width="520"
                      height={band.heightPx}
                      fill={band.palette.fill}
                      stroke={band.palette.stroke}
                      strokeWidth="1"
                    />
                    <text
                      x="18"
                      y={band.yTop + band.heightPx / 2 + 3}
                      fill={band.palette.text}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      L{band.idx + 1}: {band.layer.name} ({band.layer.thickness} Å, σ={band.layer.roughness} Å, ρ={band.layer.density} g/cm³)
                    </text>
                  </g>
                ))}

                {/* Render Substrate */}
                <rect
                  x="10"
                  y={stackGeometry.substrateY}
                  width="520"
                  height={Math.max(26, 185 - stackGeometry.substrateY)}
                  fill="rgba(30, 41, 59, 0.75)"
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x="18"
                  y={stackGeometry.substrateY + 16}
                  fill="#cbd5e1"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Substrate: {stackGeometry.substrate?.name || 'Si (100)'} (d = ∞, σ={stackGeometry.substrate?.roughness ?? 3.0} Å, ρ={stackGeometry.substrate?.density ?? 2.33} g/cm³)
                </text>

                {/* Incident X-Ray Beam k_in */}
                <line
                  x1="55"
                  y1="14"
                  x2="195"
                  y2={stackGeometry.topSurfaceY}
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                />
                <text x="72" y="34" fill="#38bdf8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  k_in (θ = {probeThetaDeg.toFixed(2)}°)
                </text>

                {/* Primary Specular Reflected Beam R_0 */}
                <line
                  x1="195"
                  y1={stackGeometry.topSurfaceY}
                  x2="345"
                  y2="14"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                />
                <text x="278" y="26" fill="#38bdf8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  R₀ Specular (θ)
                </text>

                {/* Scattering Vector q_z Arrow */}
                <line
                  x1="195"
                  y1={stackGeometry.topSurfaceY}
                  x2="195"
                  y2="12"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <text x="201" y="22" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  q_z = {probeQz.toFixed(3)} Å⁻¹
                </text>

                {/* Sub-surface Refracted & Buried Interface Reflected Rays (when above critical angle) */}
                {!isTotalReflection ? (
                  <g>
                    {/* Refracted into Layer 1 */}
                    <line
                      x1="195"
                      y1={stackGeometry.topSurfaceY}
                      x2="265"
                      y2={stackGeometry.substrateY}
                      stroke="#fbbf24"
                      strokeWidth="1.8"
                      strokeDasharray="4 2"
                    />
                    {/* Reflected from Buried Substrate Interface */}
                    <line
                      x1="265"
                      y1={stackGeometry.substrateY}
                      x2="335"
                      y2={stackGeometry.topSurfaceY}
                      stroke="#fbbf24"
                      strokeWidth="1.8"
                      strokeDasharray="4 2"
                    />
                    {/* Emerging Secondary Interference Ray R_1 */}
                    <line
                      x1="335"
                      y1={stackGeometry.topSurfaceY}
                      x2="475"
                      y2="14"
                      stroke="#c084fc"
                      strokeWidth="2"
                    />
                    <text x="385" y="34" fill="#d8b4fe" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                      R₁ Interference (ΔΦ = q_z·d)
                    </text>
                  </g>
                ) : (
                  <g>
                    {/* Evanescent Wave Decay Zone */}
                    <text
                      x="255"
                      y={stackGeometry.topSurfaceY + 15}
                      fill="#34d399"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Evanescent Wave Only (Penetration Λ ≈ 30 Å, R ≈ 1.0)
                    </text>
                  </g>
                )}
              </svg>

              {/* Interactive Probe Grazing Angle Slider */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                  <span className="text-slate-400">Probe Grazing Angle θ:</span>
                  <span className="text-cyan-300 font-bold">{probeThetaDeg.toFixed(2)}°</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-300 font-bold">q_z = {probeQz.toFixed(3)} Å⁻¹</span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <input
                    type="range"
                    min="0.05"
                    max="2.50"
                    step="0.05"
                    value={probeThetaDeg}
                    onChange={(e) => setProbeThetaDeg(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Governing Optical Equations & Roughness Damping */}
            <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                    Parratt Recursive Matrix Formalism
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Exact Stratified Solution</span>
                </div>
                <div
                  className="py-2 px-2 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: eqParratt }}
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                    Interfacial Roughness Attenuation ({roughnessModel === 'nevot-croce' ? 'Névot–Croce' : 'Debye–Waller'})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Gaussian RMS σ_j</span>
                </div>
                <div
                  className="py-2 px-2 bg-[#050811] border border-slate-800 rounded text-slate-200 text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: eqNevotCroce }}
                />
              </div>

              <div className="bg-[#0B0F19] border border-slate-800 rounded p-2.5 space-y-1.5 font-mono text-xs tabular-nums">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  X-Ray Refractive Index: n = 1 − δ − iβ
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  For hard X-rays, the refractive index <span className="font-mono text-cyan-300">n &lt; 1</span> by a tiny dispersion decrement <span className="font-mono text-white">δ ≈ 10⁻⁶–10⁻⁵</span>. Below <span className="font-mono text-emerald-300">θc = √(2δ)</span>, X-rays undergo total external reflection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: HOW TO READ AN XRR CURVE (3 PHYSICAL SIGNATURES) */}
      {activeMode === 'curveAnatomy' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Signature 1: Density -> Critical Angle */}
            <div className="bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  1. Critical Angle θc → Density ρ
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 tabular-nums">
                  θc = {thetaCritDeg.toFixed(3)}°
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The sharp drop-off edge where reflectivity falls from the <span className="font-mono text-white">R ≈ 1</span> plateau is governed directly by electron density <span className="font-mono text-emerald-300">ρ_e</span> and mass density <span className="font-mono text-emerald-300">ρ</span>:
              </p>
              <div className="p-2 bg-[#050811] border border-slate-800 rounded font-mono text-[11px] text-center text-emerald-300">
                θ_c ≈ √(2δ) = λ · √(r_e · ρ_e / π)
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between pt-1">
                <span>Estimated Surface ρ:</span>
                <strong className="text-white tabular-nums">{critAngleResult?.densityEst.toFixed(2) ?? '—'} g/cm³</strong>
              </div>
            </div>

            {/* Signature 2: Fringe Period -> Thickness */}
            <div className="bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  2. Fringe Spacing Δqz → Thickness d
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 tabular-nums">
                  d ≈ {kiessigResult?.refractionFit?.dBragg ?? kiessigResult?.estimatedThickness ?? stackGeometry.totalThicknessA} Å
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Constructive interference between X-rays reflected from the top film surface and buried substrate produces <strong>Kiessig fringes</strong> inversely proportional to layer thickness <span className="font-mono text-cyan-300">d</span>:
              </p>
              <div
                className="p-1.5 bg-[#050811] border border-slate-800 rounded text-xs overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: eqModBragg }}
              />
              <div className="text-[11px] font-mono text-slate-400 flex justify-between pt-1">
                <span>Fringe Period Δqz:</span>
                <strong className="text-white tabular-nums">{kiessigResult?.periodQz ?? '—'} Å⁻¹</strong>
              </div>
            </div>

            {/* Signature 3: Envelope Decay -> Roughness */}
            <div className="bg-[#070A12] border border-slate-800 rounded p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  3. Decay Rate → Roughness σ
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 tabular-nums">
                  σ₁ = {layers[0]?.roughness ?? 3.0} Å
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ideal flat surfaces decay as the Fresnel power law <span className="font-mono text-white">R_F ∝ q_z⁻⁴</span>. Surface roughness <span className="font-mono text-amber-300">σ_top</span> steepens the overall slope, while buried interface roughness damps fringe contrast:
              </p>
              <div className="p-2 bg-[#050811] border border-slate-800 rounded font-mono text-[11px] text-center text-amber-300">
                R(q_z) ∝ q_z⁻⁴ · exp(−q_z² · σ²)
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex justify-between pt-1">
                <span>Fresnel Compensated View:</span>
                <strong className="text-white">Plot R · q_z⁴ vs θ</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: OPTICAL INDEX & SLD MATRIX */}
      {activeMode === 'stackMatrix' && (
        <div className="p-4">
          <div className="overflow-x-auto bg-[#070A12] border border-slate-800 rounded">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0B0F19] text-slate-400">
                  <th className="p-2.5">Layer #</th>
                  <th className="p-2.5">Name &amp; Formula</th>
                  <th className="p-2.5">Thickness d</th>
                  <th className="p-2.5">Roughness σ</th>
                  <th className="p-2.5">Density ρ</th>
                  <th className="p-2.5">Dispersion δ</th>
                  <th className="p-2.5">Absorption β</th>
                  <th className="p-2.5">Critical θc</th>
                  <th className="p-2.5">SLD Re(ρ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {layers.map((l, idx) => {
                  const isSub = l.thickness === 0;
                  const thetaC = Math.sqrt(2 * Math.max(0, l.delta) * 1e-6) * (180 / Math.PI);
                  const sldReal = ((2 * Math.PI) / (wavelength * wavelength)) * l.delta;
                  return (
                    <tr key={l.id} className="hover:bg-slate-900/50">
                      <td className="p-2.5 text-slate-400">{isSub ? 'SUB' : `L${idx + 1}`}</td>
                      <td className="p-2.5 font-bold text-cyan-300">
                        {l.name} <span className="text-slate-500 font-normal">({l.formula || l.material})</span>
                      </td>
                      <td className="p-2.5">{isSub ? '∞ (Substrate)' : `${l.thickness.toFixed(1)} Å (${(l.thickness / 10).toFixed(2)} nm)`}</td>
                      <td className="p-2.5 text-amber-300">{l.roughness.toFixed(1)} Å</td>
                      <td className="p-2.5 text-emerald-300">{l.density.toFixed(2)} g/cm³</td>
                      <td className="p-2.5">{l.delta.toFixed(2)} × 10⁻⁶</td>
                      <td className="p-2.5">{l.beta.toFixed(3)} × 10⁻⁷</td>
                      <td className="p-2.5 text-indigo-300 font-bold">{thetaC.toFixed(3)}°</td>
                      <td className="p-2.5 text-purple-300 font-bold">{sldReal.toFixed(2)} × 10⁻⁶ Å⁻²</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
