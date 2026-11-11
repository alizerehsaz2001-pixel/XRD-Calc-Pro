import React, { useState } from 'react';
import { BookOpen, Layers, Waves, ShieldAlert, Cpu } from 'lucide-react';

export const XRRTheoryTab: React.FC = () => {
  const [filmThicknessNm, setFilmThicknessNm] = useState<number>(28);
  const [roughnessAngstrom, setRoughnessAngstrom] = useState<number>(4.5);

  const deltaQz = (2 * Math.PI) / (filmThicknessNm * 10); // Å⁻¹

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6 text-slate-300">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
              Grazing-Incidence Optical Formalism
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Fundamental Physics of X-Ray Reflectometry (XRR)
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Specular X-ray reflectometry probes the vertical electron density profile ρ<sub>e</sub>(z) independent of crystallinity, resolving sub-nanometer film thickness, interfacial Névot-Croce roughness, and mass density.
            </p>
          </div>
        </div>

        {/* Interactive Optical Parameters for Live Schematics */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row gap-4 text-xs font-mono shrink-0">
          <div>
            <div className="flex justify-between gap-3 text-slate-400 mb-1">
              <span>Film d:</span>
              <strong className="text-cyan-400 tabular-nums">{filmThicknessNm} nm</strong>
            </div>
            <input
              type="range"
              min="12"
              max="60"
              step="2"
              value={filmThicknessNm}
              onChange={(e) => setFilmThicknessNm(Number(e.target.value))}
              className="w-28 accent-cyan-500 cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between gap-3 text-slate-400 mb-1">
              <span>Roughness σ:</span>
              <strong className="text-rose-400 tabular-nums">{roughnessAngstrom.toFixed(1)} Å</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="12.0"
              step="0.5"
              value={roughnessAngstrom}
              onChange={(e) => setRoughnessAngstrom(Number(e.target.value))}
              className="w-28 accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Dual Interactive Physics Schematics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schematic 1: Parratt Multilayer Specular Reflection & Snell's Refraction */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Fig 1 • Parratt Multilayer Wave Recursion &amp; Snell&apos;s Law
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              n = 1 − δ + iβ (n &lt; 1)
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <svg viewBox="0 0 460 225" className="w-full h-auto select-none">
              {/* Vacuum / Air Layer (j = 0) */}
              <rect x="12" y="12" width="436" height="62" fill="#020617" />
              <text x="22" y="30" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                Vacuum / Ambient (n₀ = 1)
              </text>

              {/* Thin Film Layer (j = 1) */}
              <rect x="12" y="74" width="436" height="76" fill="#0f172a" />
              <text x="22" y="94" fill="#38bdf8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                Thin Film Layer j=1 (n₁ = 1 − δ₁ + iβ₁, d₁ = {filmThicknessNm} nm)
              </text>

              {/* Substrate Layer (j = 2) */}
              <rect x="12" y="150" width="436" height="63" fill="#1e1b4b" fillOpacity="0.55" />
              <text x="22" y="202" fill="#a5b4fc" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                Semi-Infinite Substrate j=2 (R₂ = 0)
              </text>

              {/* Rough Interfaces (Névot-Croce Gaussian Roughness Band) */}
              <rect
                x="12"
                y={74 - roughnessAngstrom * 0.6}
                width="436"
                height={roughnessAngstrom * 1.2}
                fill="#f43f5e"
                fillOpacity="0.18"
              />
              <line x1="12" y1="74" x2="448" y2="74" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 3" />

              <rect
                x="12"
                y={150 - roughnessAngstrom * 0.6}
                width="436"
                height={roughnessAngstrom * 1.2}
                fill="#f43f5e"
                fillOpacity="0.18"
              />
              <line x1="12" y1="150" x2="448" y2="150" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="5 3" />

              {/* Incident Grazing X-Ray Beam */}
              <line x1="35" y1="28" x2="155" y2="74" stroke="#fbbf24" strokeWidth="2.4" />
              {/* Specularly Reflected Beam R_0 */}
              <line x1="155" y1="74" x2="295" y2="22" stroke="#38bdf8" strokeWidth="2.2" />
              <text x="242" y="26" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                r₀,₁ (Surface Specular)
              </text>

              {/* Refracted Beam inside Film (bent toward interface since n < 1!) */}
              <line x1="155" y1="74" x2="255" y2="150" stroke="#34d399" strokeWidth="2" />
              {/* Reflected from Film/Substrate Interface */}
              <line x1="255" y1="150" x2="355" y2="74" stroke="#34d399" strokeWidth="1.8" strokeDasharray="3 2" />
              {/* Exiting Kiessig Interference Ray */}
              <line x1="355" y1="74" x2="438" y2="42" stroke="#22d3ee" strokeWidth="2" />
              <text x="332" y="40" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold">
                R₁ e^(i·q_z,1·d₁)
              </text>

              {/* Transmitted into Substrate */}
              <line x1="255" y1="150" x2="335" y2="198" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.7" />

              {/* Thickness d_1 Dimension Arrow */}
              <line x1="418" y1="74" x2="418" y2="150" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="360" y="116" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                d₁ = {filmThicknessNm} nm
              </text>
            </svg>
          </div>
        </div>

        {/* Schematic 2: Annotated Log R(q_z) Reflectivity Anatomy */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Fig 2 • Log₁₀ R(q<sub>z</sub>) Specular Reflectivity Anatomy
            </span>
            <span className="text-[11px] font-mono text-amber-400 tabular-nums">
              Δq<sub>z</sub> = 2π/d = {deltaQz.toFixed(4)} Å⁻¹
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            {(() => {
              const curvePts: string[] = [];
              const envPts: string[] = [];
              const qc = 0.032; // Å⁻¹
              const freq = (filmThicknessNm / 24) * 58;
              const roughFactor = Math.pow(roughnessAngstrom / 5, 1.5) * 4.5;

              for (let i = 0; i <= 140; i++) {
                const q = (i / 140) * 0.25; // 0 to 0.25 Å⁻¹
                let logR = 0;
                let logEnv = 0;
                if (q <= qc) {
                  logR = 0;
                  logEnv = 0;
                } else {
                  const qNorm = q / qc;
                  const fresnelDecay = -4 * Math.log10(qNorm);
                  const roughDecay = -roughFactor * (q - qc) * (q - qc) * 18;
                  const kiessig = 0.52 * Math.cos(freq * Math.sqrt(q * q - qc * qc)) * Math.exp(-roughFactor * (q - qc) * 2.5);
                  logEnv = Math.max(-7.5, fresnelDecay + roughDecay);
                  logR = Math.max(-7.8, logEnv + kiessig - 0.35);
                }
                const px = 42 + (i / 140) * 398;
                const py = 28 + (-logR / 8.0) * 168;
                const pyEnv = 28 + (-logEnv / 8.0) * 168;
                curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                envPts.push(`${px.toFixed(1)},${pyEnv.toFixed(1)}`);
              }

              const qcPx = 42 + (qc / 0.25) * 398;

              return (
                <svg viewBox="0 0 460 225" className="w-full h-auto select-none">
                  {/* Grid & Axes */}
                  <line x1="42" y1="20" x2="42" y2="198" stroke="#334155" strokeWidth="1.2" />
                  <line x1="42" y1="198" x2="444" y2="198" stroke="#334155" strokeWidth="1.2" />

                  {[0, -2, -4, -6, -8].map((dec, idx) => {
                    const y = 28 + (idx / 4) * 168;
                    return (
                      <g key={dec}>
                        <line x1="42" y1={y} x2="442" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="36" y={y + 3} textAnchor="end" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                          10^{dec}
                        </text>
                      </g>
                    );
                  })}

                  {/* Critical Angle q_c Vertical Line */}
                  <line x1={qcPx} y1="22" x2={qcPx} y2="198" stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="4 2" />
                  <text x={qcPx + 5} y="36" fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    q_c ∝ √ρ_e (Total External Reflection)
                  </text>

                  {/* Roughness Envelope Curve */}
                  <polyline fill="none" stroke="#f43f5e" strokeWidth="1.3" strokeDasharray="4 3" points={envPts.join(' ')} />
                  {/* Kiessig Reflectivity Curve */}
                  <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={curvePts.join(' ')} />

                  {/* Annotations */}
                  <text x="275" y="78" fill="#fb7185" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    Envelope ∝ q_z⁻⁴ · exp(−q_z²σ²)
                  </text>
                  <text x="155" y="148" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    Kiessig Fringes Δq_z = 2π / d_film
                  </text>
                  <text x="242" y="216" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Scattering Vector q_z = (4π/λ)·sinθ (Å⁻¹)
                  </text>
                </svg>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 4 Theoretical Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-cyan-400">
            <Waves className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">1. Index of Refraction for X-Rays</h3>
          </div>
          <p className="text-sm leading-relaxed">
            For hard X-rays, the complex refractive index of matter is slightly <strong>less than unity</strong>:
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300 text-center">
            n = 1 − δ + iβ &nbsp;&nbsp;where&nbsp;&nbsp; δ = (r<sub>e</sub>λ² / 2π) · ρ<sub>e</sub>
          </div>
          <ul className="text-xs space-y-2 text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-200">Dispersion (δ):</strong> Proportional to electron density ρ<sub>e</sub> (~10⁻⁵ to 10⁻⁶).</li>
            <li><strong className="text-slate-200">Absorption (β):</strong> Proportional to linear attenuation μ (~10⁻⁷ to 10⁻⁸).</li>
            <li><strong className="text-slate-200">Critical Angle (θ<sub>c</sub>):</strong> Below <span className="font-mono text-amber-300">θ<sub>c</sub> ≈ √(2δ)</span>, X-rays undergo <strong>Total External Reflection</strong> (R ≈ 1).</li>
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <Layers className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">2. Parratt&apos;s Exact Recursive Formalism</h3>
          </div>
          <p className="text-sm leading-relaxed">
            Published by L.G. Parratt in 1954, the exact specular reflection amplitude <span className="font-mono text-emerald-300">R<sub>j</sub></span> at interface <span className="font-mono">j</span> is solved bottom-up from the semi-infinite substrate (<span className="font-mono">R<sub>N</sub> = 0</span>):
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 text-center">
            R<sub>j</sub> = (r<sub>j,j+1</sub> + R<sub>j+1</sub> · exp(i · q<sub>z,j+1</sub> · d<sub>j+1</sub>)) / (1 + r<sub>j,j+1</sub> · R<sub>j+1</sub> · exp(i · q<sub>z,j+1</sub> · d<sub>j+1</sub>))
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Phase interference between the top surface reflection and buried interface reflections generates periodic <strong>Kiessig fringes</strong> whose spacing <span className="font-mono text-cyan-300">Δq<sub>z</sub> = 2π / d</span> yields exact layer thickness.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">3. Névot-Croce Interfacial Roughness</h3>
          </div>
          <p className="text-sm leading-relaxed">
            Real thin-film interfaces exhibit root-mean-square roughness and interdiffusion <span className="font-mono text-rose-300">σ<sub>j</sub></span>, which damps each Fresnel reflection coefficient:
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-rose-300 text-center">
            r<sub>j,j+1</sub><sup>rough</sup> = r<sub>j,j+1</sub><sup>ideal</sup> · exp(−½ · q<sub>z,j</sub> · q<sub>z,j+1</sub> · σ<sub>j</sub>²)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Higher interfacial roughness accelerates the exponential fall-off of reflectivity above the critical angle and attenuates Kiessig fringe contrast at high momentum transfer <span className="font-mono">q<sub>z</sub></span>.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <Cpu className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">4. Differential Evolution Global Inversion</h3>
          </div>
          <p className="text-sm leading-relaxed">
            Because <span className="font-mono">log₁₀ R(q<sub>z</sub>)</span> spans 6–8 orders of magnitude with oscillatory fringes, local gradient optimizers trap in false minima. Global inversion minimizes the logarithmic figure of merit:
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-amber-300 text-center">
            FOM<sub>log</sub> = (1 / N) · ∑ |log₁₀(R<sub>exp</sub>) − log₁₀(R<sub>calc</sub>)|
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Logarithmic weighting gives equal statistical leverage to low-intensity high-<span className="font-mono">q<sub>z</sub></span> fringes and the intense total-reflection plateau.
          </p>
        </div>
      </div>
    </div>
  );
};
