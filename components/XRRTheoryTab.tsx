import React, { useState, useMemo } from 'react';
import { BookOpen, Layers, Waves, ShieldAlert, Cpu, Compass, Sliders } from 'lucide-react';

export const XRRTheoryTab: React.FC = () => {
  const [filmThicknessNm, setFilmThicknessNm] = useState<number>(28);
  const [roughnessAngstrom, setRoughnessAngstrom] = useState<number>(4.5);
  const [deltaE6, setDeltaE6] = useState<number>(14.5); // Dispersion δ × 10^6 (e.g. SiO2 ~ 7.6, TiO2 ~ 14.5, Au ~ 46)

  const wavelengthA = 1.5406; // Cu Kα1

  // Derived optical quantities (exact Snell's law & CODATA 2018 constants)
  const opticalTelemetry = useMemo(() => {
    const delta = deltaE6 * 1e-6;
    const criticalThetaRad = Math.acos(Math.max(-1, Math.min(1, 1 - delta)));
    const criticalThetaDeg = (criticalThetaRad * 180) / Math.PI;
    const criticalQz = (4 * Math.PI * Math.sin(criticalThetaRad)) / wavelengthA; // Å⁻¹
    const deltaQz = (2 * Math.PI) / (filmThicknessNm * 10); // Å⁻¹
    const deltaTwoThetaDeg =
      ((2 * Math.asin(Math.min(0.99, (deltaQz * wavelengthA) / (4 * Math.PI)))) * 180) / Math.PI;
    const re = 2.8179403262e-5; // CODATA 2018 classical electron radius (Å)
    const electronDensity = (2 * Math.PI * delta) / (re * wavelengthA * wavelengthA); // e⁻ / Å³
    const sldE6 = electronDensity * re * 1e6; // 10^-6 Å^-2

    return {
      criticalThetaDeg,
      criticalQz,
      deltaQz,
      deltaTwoThetaDeg,
      electronDensity,
      sldE6,
    };
  }, [deltaE6, filmThicknessNm]);

  // Exact Complex 1-Layer Parratt Recursion Log10 R(qz) and Névot–Croce Fresnel Envelope
  const { curvePts, envPts, qcPx } = useMemo(() => {
    const cPts: string[] = [];
    const ePts: string[] = [];
    const qMax = 0.25;
    const k0 = (2 * Math.PI) / wavelengthA;
    const dA = filmThicknessNm * 10; // Å
    const sigma = roughnessAngstrom;

    // Film optical constants (1) and Si substrate optical constants (2)
    const delta1 = deltaE6 * 1e-6;
    const beta1 = delta1 * 0.022;
    const deltaSub = 7.57e-6;
    const betaSub = 1.73e-7;

    const cSqrt = (re: number, im: number): [number, number] => {
      const r = Math.hypot(re, im);
      const u = Math.sqrt(0.5 * (r + re));
      const v = (im >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, 0.5 * (r - re)));
      return [u, v];
    };

    const cMul = (a: [number, number], b: [number, number]): [number, number] => [
      a[0] * b[0] - a[1] * b[1],
      a[0] * b[1] + a[1] * b[0],
    ];

    const cDiv = (a: [number, number], b: [number, number]): [number, number] => {
      const denom = b[0] * b[0] + b[1] * b[1] || 1e-30;
      return [(a[0] * b[0] + a[1] * b[1]) / denom, (a[1] * b[0] - a[0] * b[1]) / denom];
    };

    for (let i = 0; i <= 160; i++) {
      const q = (i / 160) * qMax;
      const sinTheta = Math.min(0.999, Math.max(1e-5, q / (2 * k0)));
      const cos2Theta = 1 - sinTheta * sinTheta;

      // Exact wavevectors kz,0 (vacuum), kz,1 (film), kz,2 (Si substrate)
      const kz0: [number, number] = [k0 * sinTheta, 0];
      const kz1 = cSqrt(
        k0 * k0 * ((1 - delta1) * (1 - delta1) - beta1 * beta1 - cos2Theta),
        k0 * k0 * (2 * beta1 * (1 - delta1))
      );
      const kz2 = cSqrt(
        k0 * k0 * ((1 - deltaSub) * (1 - deltaSub) - betaSub * betaSub - cos2Theta),
        k0 * k0 * (2 * betaSub * (1 - deltaSub))
      );

      // Fresnel interface coefficients with exact Névot–Croce damping exp(-2 k_j k_{j+1} sigma^2)
      const r01Raw = cDiv([kz0[0] - kz1[0], -kz1[1]], [kz0[0] + kz1[0], kz1[1]]);
      const nc01 = Math.exp(Math.min(0, -2 * kz0[0] * kz1[0] * sigma * sigma));
      const r01: [number, number] = [r01Raw[0] * nc01, r01Raw[1] * nc01];

      const r12Raw = cDiv([kz1[0] - kz2[0], kz1[1] - kz2[1]], [kz1[0] + kz2[0], kz1[1] + kz2[1]]);
      const nc12 = Math.exp(Math.min(0, -2 * (kz1[0] * kz2[0] - kz1[1] * kz2[1]) * Math.pow(sigma * 0.75, 2)));
      const r12: [number, number] = [r12Raw[0] * nc12, r12Raw[1] * nc12];

      // Phase factor exp(2 i kz1 d) = exp(-2 Im(kz1) d) * (cos(2 Re(kz1) d) + i sin(2 Re(kz1) d))
      const atten = Math.exp(-2 * kz1[1] * dA);
      const phase: [number, number] = [
        atten * Math.cos(2 * kz1[0] * dA),
        atten * Math.sin(2 * kz1[0] * dA),
      ];
      const r12Phase = cMul(r12, phase);

      // Total Parratt amplitude X0 = (r01 + r12 * phase) / (1 + r01 * r12 * phase)
      const num: [number, number] = [r01[0] + r12Phase[0], r01[1] + r12Phase[1]];
      const prod = cMul(r01, r12Phase);
      const den: [number, number] = [1 + prod[0], prod[1]];
      const x0 = cDiv(num, den);

      const rIntensity = Math.max(1e-8, Math.min(1, x0[0] * x0[0] + x0[1] * x0[1]));
      const envIntensity = Math.max(
        1e-8,
        Math.min(1, (r01[0] * r01[0] + r01[1] * r01[1]) + (r12[0] * r12[0] + r12[1] * r12[1]))
      );

      const logR = Math.max(-8.0, Math.min(0, Math.log10(rIntensity)));
      const logEnv = Math.max(-7.8, Math.min(0, Math.log10(envIntensity)));

      const px = 44 + (i / 160) * 400;
      const py = 26 + (-logR / 8.0) * 168;
      const pyEnv = 26 + (-logEnv / 8.0) * 168;
      cPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      ePts.push(`${px.toFixed(1)},${pyEnv.toFixed(1)}`);
    }

    const qc = Math.max(0.012, Math.min(0.12, opticalTelemetry.criticalQz));
    return {
      curvePts: cPts.join(' '),
      envPts: ePts.join(' '),
      qcPx: 44 + (qc / qMax) * 400,
    };
  }, [deltaE6, filmThicknessNm, roughnessAngstrom, opticalTelemetry.criticalQz]);

  const OPTICAL_PRESETS = [
    { label: 'SiO₂ (δ=7.6)', delta: 7.6, d: 22, sigma: 3.0 },
    { label: 'TiO₂ (δ=14.5)', delta: 14.5, d: 28, sigma: 4.5 },
    { label: 'HfO₂ (δ=26.2)', delta: 26.2, d: 18, sigma: 3.5 },
    { label: 'Au Film (δ=46.8)', delta: 46.8, d: 36, sigma: 5.5 },
  ];

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Instrument Header & Interactive Optical Controls */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-sm overflow-hidden">
        <div className="px-5 py-3 bg-[#070A12] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>GRAZING-INCIDENCE OPTICAL FORMALISM &amp; TOTAL EXTERNAL REFLECTION</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Material Optical Calibration:</span>
            {OPTICAL_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setDeltaE6(p.delta);
                  setFilmThicknessNm(p.d);
                  setRoughnessAngstrom(p.sigma);
                }}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-sm border transition-colors cursor-pointer ${
                  Math.abs(deltaE6 - p.delta) < 0.2
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                    : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Fundamental Physics of X-Ray Reflectometry (XRR)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Specular X-ray reflectometry measures the vertical electron density depth profile{' '}
              <span className="font-mono text-cyan-300">ρₑ(z)</span> below 5° grazing incidence. Because the hard X-ray
              refractive index <span className="font-mono text-white">n = 1 − δ + iβ</span> is less than unity, beams
              undergo Total External Reflection below <span className="font-mono text-amber-300">θ_c ≈ √(2δ)</span> and
              generate Kiessig interference fringes encoding nanometer thickness and Névot–Croce roughness.
            </p>
          </div>

          {/* 3 Interactive Optical Sliders */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#070A12] border border-slate-800 p-3.5 rounded-sm font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1.5">
                <span>Thickness d₁</span>
                <strong className="text-cyan-400 tabular-nums">{filmThicknessNm} nm</strong>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={filmThicknessNm}
                onChange={(e) => setFilmThicknessNm(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1.5">
                <span>Roughness σ</span>
                <strong className="text-rose-400 tabular-nums">{roughnessAngstrom.toFixed(1)} Å</strong>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={roughnessAngstrom}
                onChange={(e) => setRoughnessAngstrom(Number(e.target.value))}
                className="w-full accent-rose-400 h-1.5 bg-slate-800 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1.5">
                <span>Dispersion δ</span>
                <strong className="text-amber-300 tabular-nums">{deltaE6.toFixed(1)}×10⁻⁶</strong>
              </div>
              <input
                type="range"
                min="4.0"
                max="50.0"
                step="0.5"
                value={deltaE6}
                onChange={(e) => setDeltaE6(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Optical Metrology Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-t border-slate-800 bg-[#070A12] font-mono text-xs">
          <div className="px-4 py-2.5">
            <span className="text-[10px] text-slate-500 uppercase block">Critical Angle θ_c</span>
            <strong className="text-amber-300 tabular-nums">{opticalTelemetry.criticalThetaDeg.toFixed(3)}°</strong>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[10px] text-slate-500 uppercase block">Critical Edge q_c</span>
            <strong className="text-white tabular-nums">{opticalTelemetry.criticalQz.toFixed(4)} Å⁻¹</strong>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[10px] text-slate-500 uppercase block">Kiessig Δq_z = 2π/d</span>
            <strong className="text-cyan-400 tabular-nums">{opticalTelemetry.deltaQz.toFixed(4)} Å⁻¹</strong>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[10px] text-slate-500 uppercase block">Angular Period Δ2θ</span>
            <strong className="text-emerald-400 tabular-nums">{opticalTelemetry.deltaTwoThetaDeg.toFixed(3)}°</strong>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[10px] text-slate-500 uppercase block">Scattering Length Density</span>
            <strong className="text-indigo-300 tabular-nums">{opticalTelemetry.sldE6.toFixed(2)}×10⁻⁶ Å⁻²</strong>
          </div>
        </div>
      </div>

      {/* Dual Interactive Physics CAD Schematics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Schematic 1: Parratt Multilayer Wave Recursion */}
        <div className="lg:col-span-6 bg-[#0B0F19] border border-slate-800 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-[#070A12] border-b border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-400 font-bold">
              FIG 01 · PARRATT MULTILAYER WAVE RECURSION &amp; SNELL REFRACTION
            </span>
            <span className="text-slate-400 tabular-nums">n = 1 − δ + iβ (n &lt; 1)</span>
          </div>

          <div className="p-3 bg-[#070A12]">
            <svg viewBox="0 0 460 225" className="w-full h-auto select-none">
              <rect x="10" y="10" width="440" height="62" fill="#050811" stroke="#1E293B" strokeWidth="1" />
              <text x="20" y="28" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                Ambient Vacuum j = 0 (n₀ = 1.00000)
              </text>

              <rect x="10" y="72" width="440" height="78" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
              <text x="20" y="92" fill="#22D3EE" fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                Thin Film j = 1 (δ = {deltaE6.toFixed(1)}×10⁻⁶ · d₁ = {filmThicknessNm} nm)
              </text>

              <rect x="10" y="150" width="440" height="64" fill="#172554" fillOpacity="0.4" stroke="#1E293B" strokeWidth="1" />
              <text x="20" y="202" fill="#A5B4FC" fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                Semi-Infinite Substrate j = 2 (Boundary: R₂ = 0)
              </text>

              {/* Roughness Interfacial Gaussian Transition Bands */}
              <rect
                x="10"
                y={72 - roughnessAngstrom * 0.65}
                width="440"
                height={roughnessAngstrom * 1.3}
                fill="#F43F5E"
                fillOpacity="0.22"
              />
              <line x1="10" y1="72" x2="450" y2="72" stroke="#22D3EE" strokeWidth="1.4" strokeDasharray="5 3" />

              <rect
                x="10"
                y={150 - roughnessAngstrom * 0.65}
                width="440"
                height={roughnessAngstrom * 1.3}
                fill="#F43F5E"
                fillOpacity="0.22"
              />
              <line x1="10" y1="150" x2="450" y2="150" stroke="#818CF8" strokeWidth="1.4" strokeDasharray="5 3" />

              {/* Grazing Incident Beam */}
              <line x1="35" y1="26" x2="155" y2="72" stroke="#F59E0B" strokeWidth="2.3" />
              <line x1="155" y1="72" x2="295" y2="20" stroke="#38BDF8" strokeWidth="2.1" />
              <text x="235" y="24" fill="#38BDF8" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                r₀,₁ Surface Specular
              </text>

              {/* Refracted Beam (bends toward interface since n1 < n0) */}
              <line x1="155" y1="72" x2="255" y2="150" stroke="#10B981" strokeWidth="2" />
              <line x1="255" y1="150" x2="355" y2="72" stroke="#10B981" strokeWidth="1.8" strokeDasharray="3 2" />
              <line x1="355" y1="72" x2="438" y2="40" stroke="#22D3EE" strokeWidth="2" />
              <text x="330" y="38" fill="#22D3EE" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                R₁ exp(i·q_z,1·d₁)
              </text>

              <line x1="255" y1="150" x2="335" y2="198" stroke="#818CF8" strokeWidth="1.4" strokeOpacity="0.7" />

              {/* Dimension Arrows */}
              <line x1="422" y1="72" x2="422" y2="150" stroke="#F59E0B" strokeWidth="1.4" />
              <text x="348" y="115" fill="#F59E0B" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                d₁ = {filmThicknessNm} nm
              </text>
              <text x="20" y="140" fill="#FB7185" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                Névot–Croce Roughness Band: σ = {roughnessAngstrom.toFixed(1)} Å
              </text>
            </svg>
          </div>
        </div>

        {/* Schematic 2: Specular Reflectivity Anatomy */}
        <div className="lg:col-span-6 bg-[#0B0F19] border border-slate-800 rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-[#070A12] border-b border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">
              FIG 02 · LOG₁₀ R(q_z) SPECULAR REFLECTIVITY ANATOMY
            </span>
            <span className="text-amber-300 tabular-nums">
              q_c = {opticalTelemetry.criticalQz.toFixed(4)} Å⁻¹ · Δq_z = {opticalTelemetry.deltaQz.toFixed(4)} Å⁻¹
            </span>
          </div>

          <div className="p-3 bg-[#070A12]">
            <svg viewBox="0 0 460 225" className="w-full h-auto select-none">
              {/* Total External Reflection Shaded Zone */}
              <rect x="44" y="22" width={Math.max(4, qcPx - 44)} height="172" fill="#F59E0B" fillOpacity="0.08" />

              {/* Axes */}
              <line x1="44" y1="22" x2="44" y2="194" stroke="#334155" strokeWidth="1.2" />
              <line x1="44" y1="194" x2="444" y2="194" stroke="#334155" strokeWidth="1.2" />

              {[0, -2, -4, -6, -8].map((dec, idx) => {
                const y = 26 + (idx / 4) * 168;
                return (
                  <g key={dec}>
                    <line x1="44" y1={y} x2="444" y2={y} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="38" y={y + 3} textAnchor="end" fill="#64748B" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                      10^{dec}
                    </text>
                  </g>
                );
              })}

              {/* Critical Angle q_c Vertical Marker */}
              <line x1={qcPx} y1="22" x2={qcPx} y2="194" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x={Math.min(300, qcPx + 5)} y="35" fill="#FBBF24" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                q_c = {opticalTelemetry.criticalQz.toFixed(3)} Å⁻¹ (θ_c={opticalTelemetry.criticalThetaDeg.toFixed(2)}°)
              </text>

              {/* Roughness Envelope & Kiessig Curve */}
              <polyline fill="none" stroke="#F43F5E" strokeWidth="1.3" strokeDasharray="4 3" points={envPts} />
              <polyline fill="none" stroke="#22D3EE" strokeWidth="2" points={curvePts} />

              {/* Callouts */}
              <text x="270" y="76" fill="#FB7185" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                Envelope ∝ q_z⁻⁴ · exp(−q_z²σ²)
              </text>
              <text x="160" y="160" fill="#38BDF8" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                Kiessig Period Δq_z = {opticalTelemetry.deltaQz.toFixed(4)} Å⁻¹
              </text>
              <text x="244" y="214" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                Momentum Transfer q_z = (4π/λ)·sinθ (Å⁻¹)
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* 4 Theoretical Pillar Cards (1px Obsidian CAD Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400">
              <Waves className="w-4 h-4" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                01. Complex Refractive Index &amp; Critical Edge
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">n &lt; 1</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            For hard X-rays, matter exhibits a refractive index slightly below unity governed by total electron density ρₑ:
          </p>
          <div className="bg-[#070A12] p-3 rounded-sm border border-slate-800 font-mono text-xs text-cyan-300 text-center">
            n = 1 − δ + iβ &nbsp;|&nbsp; δ = (rₑλ² / 2π)ρₑ &nbsp;|&nbsp; θ_c ≈ √(2δ)
          </div>
          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>› Dispersion δ (~10⁻⁵–10⁻⁶): sets total external reflection critical angle θ_c.</div>
            <div>› Absorption β (~10⁻⁷–10⁻⁸): rounds the sharp shoulder at θ ≈ θ_c.</div>
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400">
              <Layers className="w-4 h-4" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                02. Parratt Exact Optical Recursion (1954)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">KIESSIG FRINGES</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reflection amplitudes R_j are solved recursively bottom-up from the semi-infinite substrate boundary (R_N = 0):
          </p>
          <div className="bg-[#070A12] p-3 rounded-sm border border-slate-800 font-mono text-xs text-emerald-300 text-center">
            R_j = (r_{'{j,j+1}'} + R_{'{j+1}'}e^{'{i q_{z,j+1} d_{j+1}}'}) / (1 + r_{'{j,j+1}'}R_{'{j+1}'}e^{'{i q_{z,j+1} d_{j+1}}'})
          </div>
          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>› Phase periodicity yields Kiessig thickness: d = 2π / Δq_z.</div>
            <div>› Fresnel wavevector inside layer j: q_z,j = √(q_z,0² − 8π δ_j / λ² + i 8π β_j / λ²).</div>
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                03. Névot–Croce Interfacial Roughness Damping
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">DEBYE-WALLER</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gaussian interfacial roughness and graded chemical interdiffusion σ_j attenuate each Fresnel coefficient:
          </p>
          <div className="bg-[#070A12] p-3 rounded-sm border border-slate-800 font-mono text-xs text-rose-300 text-center">
            r_{'{j,j+1}'}^{'{rough}'} = r_{'{j,j+1}'}^{'{ideal}'} · exp(−½ q_{'{z,j}'} q_{'{z,j+1}'} σ_j²)
          </div>
          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>› Steepens high-q_z decay beyond the ideal Fresnel q_z⁻⁴ Porod asymptote.</div>
            <div>› Buried interface roughness damps Kiessig oscillation amplitude selectively.</div>
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400">
              <Cpu className="w-4 h-4" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                04. Logarithmic Objective &amp; Global Inversion
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">DYNAMIC RANGE 10⁸</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reflectivity spans 7–8 decades of intensity. Global differential evolution prevents trapping in phase-shifted local minima:
          </p>
          <div className="bg-[#070A12] p-3 rounded-sm border border-slate-800 font-mono text-xs text-amber-300 text-center">
            FOM_log = (1 / N) · ∑ | log₁₀(R_exp(q_i)) − log₁₀(R_calc(q_i)) |
          </div>
          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>› Assigns uniform statistical weight across plateau (R ≈ 1) and high-q tails (10⁻⁷).</div>
            <div>› Footprints finite sample illumination length L_s against incident beam width w₀.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
