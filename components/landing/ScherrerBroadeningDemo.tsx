import React, { useState, useMemo } from 'react';
import { Microscope, Sliders, ArrowRight, Activity, Layers } from 'lucide-react';
import { AppSection } from '../../types';

interface ScherrerBroadeningDemoProps {
  onLaunchScherrer: (target: AppSection) => void;
}

export const ScherrerBroadeningDemo: React.FC<ScherrerBroadeningDemoProps> = ({ onLaunchScherrer }) => {
  const [crystalliteSizeNm, setCrystalliteSizeNm] = useState<number>(18);
  const [shapeFactorK, setShapeFactorK] = useState<number>(0.9);
  const [braggAngle2Theta, setBraggAngle2Theta] = useState<number>(28.44);
  const [instFwhmDeg, setInstFwhmDeg] = useState<number>(0.075);

  const wavelengthNm = 0.15406; // Cu Kα1

  // Calculate physical, instrumental, and observed FWHM
  const metrics = useMemo(() => {
    const thetaRad = (braggAngle2Theta / 2) * (Math.PI / 180);
    const cosTheta = Math.cos(thetaRad);
    const sinTheta = Math.sin(thetaRad);

    // Scherrer physical broadening β_D (rad) = K * λ / (D * cosθ)
    const betaStructRad = (shapeFactorK * wavelengthNm) / (crystalliteSizeNm * Math.max(0.1, cosTheta));
    const betaStructDeg = betaStructRad * (180 / Math.PI);

    // Voigt-like quadrature approximation for total observed FWHM
    const betaObsDeg = Math.sqrt(Math.pow(betaStructDeg, 2) + Math.pow(instFwhmDeg, 2));

    // Reciprocal d-spacing (Å)
    const dSpacingAngstrom = (wavelengthNm * 10) / (2 * Math.max(0.05, sinTheta));

    // Approximate atoms across coherent column diameter (Si a ≈ 0.543 nm)
    const unitCellsAcross = Math.round(crystalliteSizeNm / 0.543);

    return {
      betaStructDeg,
      betaObsDeg,
      betaStructMrad: betaStructRad * 1000,
      dSpacingAngstrom,
      unitCellsAcross,
      instFractionPct: (Math.pow(instFwhmDeg, 2) / Math.pow(betaObsDeg, 2)) * 100,
    };
  }, [crystalliteSizeNm, shapeFactorK, braggAngle2Theta, instFwhmDeg]);

  // Generate SVG paths for Observed Profile vs. Instrumental Resolution Baseline
  const { obsPath, obsArea, instPath } = useMemo(() => {
    const width = 560;
    const height = 210;
    const steps = 200;
    const windowDeg = 3.2; // ±1.6° window around 2θ₀
    const obsPts: string[] = [];
    const instPts: string[] = [];

    const peakScale = Math.min(1, Math.max(0.28, Math.pow(18 / crystalliteSizeNm, -0.32)));

    for (let i = 0; i <= steps; i++) {
      const dx = (i / steps - 0.5) * windowDeg;

      // Pseudo-Voigt observed peak
      const gammaObs = Math.max(0.04, metrics.betaObsDeg);
      const gObs = Math.exp(-2.772588 * Math.pow(dx / gammaObs, 2));
      const lObs = 1 / (1 + 4 * Math.pow(dx / gammaObs, 2));
      const yObsVal = peakScale * (0.55 * gObs + 0.45 * lObs);

      // Instrumental resolution baseline
      const gammaInst = Math.max(0.035, instFwhmDeg);
      const gInst = Math.exp(-2.772588 * Math.pow(dx / gammaInst, 2));
      const yInstVal = 0.92 * gInst;

      const x = (i / steps) * width;
      const yObs = height - 18 - yObsVal * (height - 42);
      const yInst = height - 18 - yInstVal * (height - 42);

      obsPts.push(`${x.toFixed(1)},${yObs.toFixed(1)}`);
      instPts.push(`${x.toFixed(1)},${yInst.toFixed(1)}`);
    }

    const line = `M ${obsPts.join(' L ')}`;
    return {
      obsPath: line,
      obsArea: `${line} L ${width},${height - 18} L 0,${height - 18} Z`,
      instPath: `M ${instPts.join(' L ')}`,
    };
  }, [crystalliteSizeNm, metrics.betaObsDeg, instFwhmDeg]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-800/80 bg-[#070A12]">
      <div className="max-w-7xl mx-auto">
        <div className="border border-slate-800 bg-[#0B0F19] rounded-sm overflow-hidden shadow-2xl">
          {/* Top Instrument Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#070A12] border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Microscope className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                INTERACTIVE SCHERRER COHERENT DOMAIN &amp; INSTRUMENTAL DECONVOLUTION SANDBOX
              </span>
            </div>
            <div className="text-xs font-mono text-cyan-400 tabular-nums">
              D = Kλ / (β_struct · cosθ) &nbsp;|&nbsp; β_struct = √(β_obs² − β_inst²)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Controls & Physical Readouts */}
            <div className="lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Finite Lattice Coherence vs. Reciprocal Broadening
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  As coherent domain size <span className="font-mono text-white">D</span> contracts below 100 nm,
                  incomplete destructive interference near the Bragg angle broadens the diffraction profile. Adjust the
                  parameters below to inspect structural vs. Caglioti instrumental breadth.
                </p>

                {/* Sliders */}
                <div className="space-y-4 bg-[#070A12] border border-slate-800 p-4 rounded-sm">
                  {/* Domain Size D */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                      <span className="text-slate-400 uppercase">Coherent Domain Size (D)</span>
                      <span className="text-cyan-400 font-bold tabular-nums">
                        {crystalliteSizeNm} nm ({metrics.unitCellsAcross} unit cells)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={90}
                      step={1}
                      value={crystalliteSizeNm}
                      onChange={(e) => setCrystalliteSizeNm(Number(e.target.value))}
                      aria-label="Coherent Domain Size D in nm"
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>3 nm (Quantum Dot)</span>
                      <span>35 nm (Nanocrystal)</span>
                      <span>90 nm (Bulk Limit)</span>
                    </div>
                  </div>

                  {/* Bragg Angle 2Theta */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                      <span className="text-slate-400 uppercase">Centroid Angle (2θ₀)</span>
                      <span className="text-indigo-300 font-bold tabular-nums">
                        {braggAngle2Theta.toFixed(2)}° (d = {metrics.dSpacingAngstrom.toFixed(3)} Å)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={110}
                      step={0.5}
                      value={braggAngle2Theta}
                      onChange={(e) => setBraggAngle2Theta(Number(e.target.value))}
                      aria-label="Centroid Bragg Angle 2-Theta"
                      className="w-full accent-indigo-400 h-1.5 bg-slate-800 cursor-pointer"
                    />
                  </div>

                  {/* Shape Factor K & Instrumental FWHM */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                        Habit Factor K
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { k: 0.89, label: '0.89 Sph' },
                          { k: 0.94, label: '0.94 Cub' },
                          { k: 1.0, label: '1.00 Oct' },
                        ].map((item) => (
                          <button
                            key={item.k}
                            type="button"
                            onClick={() => setShapeFactorK(item.k)}
                            className={`py-1 text-[10px] font-mono font-bold rounded-sm border transition-colors ${
                              shapeFactorK === item.k
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                                : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                        <span>β_inst (SRM)</span>
                        <span className="text-amber-300 tabular-nums">{instFwhmDeg.toFixed(3)}°</span>
                      </div>
                      <input
                        type="range"
                        min={0.03}
                        max={0.22}
                        step={0.005}
                        value={instFwhmDeg}
                        onChange={(e) => setInstFwhmDeg(Number(e.target.value))}
                        aria-label="Instrumental FWHM in degrees"
                        className="w-full accent-amber-400 h-1.5 bg-slate-800 cursor-pointer mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Column Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-[#070A12] border border-slate-800 rounded-sm">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">β_struct (Pure)</div>
                  <div className="text-sm font-mono font-bold text-cyan-400 tabular-nums mt-0.5">
                    {metrics.betaStructDeg.toFixed(3)}°
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {metrics.betaStructMrad.toFixed(2)} mrad
                  </div>
                </div>
                <div className="p-3 bg-[#070A12] border border-slate-800 rounded-sm">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">β_obs (Total)</div>
                  <div className="text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                    {metrics.betaObsDeg.toFixed(3)}°
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                    Inst: {metrics.instFractionPct.toFixed(0)}% var
                  </div>
                </div>
                <div className="p-3 bg-[#070A12] border border-slate-800 rounded-sm">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">cos(θ) Factor</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                    {Math.cos((braggAngle2Theta * Math.PI) / 360).toFixed(4)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">1/cosθ scaling</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onLaunchScherrer('scherrer')}
                  className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Scherrer Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onLaunchScherrer('warren')}
                  className="py-2.5 px-3.5 bg-[#070A12] hover:bg-slate-900 text-slate-300 border border-slate-800 font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Warren–Averbach
                </button>
              </div>
            </div>

            {/* Right Column: Dual-Curve Profile & Real-Space Domain Schematic */}
            <div className="lg:col-span-7 p-6 sm:p-8 bg-[#070A12] flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Reciprocal-Space Line Profile I(Δ2θ)
                  </span>
                  <h4 className="text-sm font-mono font-bold text-white">
                    Observed Nanocrystal Peak vs. NIST SRM Instrumental Resolution
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> β_obs = {metrics.betaObsDeg.toFixed(3)}°
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-3 h-0.5 bg-amber-400 inline-block border-b border-dashed" /> β_inst ={' '}
                    {instFwhmDeg.toFixed(3)}°
                  </span>
                </div>
              </div>

              {/* SVG Plot */}
              <div className="relative bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
                <svg className="w-full h-56 overflow-visible" viewBox="0 0 560 210" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="scherrerObsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="192" x2="560" y2="192" stroke="#1E293B" strokeWidth="1" />
                  <line x1="280" y1="12" x2="280" y2="192" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Observed Broadened Profile */}
                  <path d={obsArea} fill="url(#scherrerObsFill)" />
                  <path d={obsPath} fill="none" stroke="#22D3EE" strokeWidth="2.2" />

                  {/* Instrumental Resolution Baseline */}
                  <path d={instPath} fill="none" stroke="#F59E0B" strokeWidth="1.4" strokeDasharray="4 3" />

                  {/* Half-Maximum Caliper Indicators */}
                  {(() => {
                    const halfWidthPx = Math.min(250, Math.max(12, (metrics.betaObsDeg / 3.2) * 560 * 0.5));
                    const yHalf = 108;
                    return (
                      <g>
                        <line
                          x1={280 - halfWidthPx}
                          y1={yHalf}
                          x2={280 + halfWidthPx}
                          y2={yHalf}
                          stroke="#22D3EE"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={280 - halfWidthPx}
                          y1={yHalf - 6}
                          x2={280 - halfWidthPx}
                          y2={yHalf + 6}
                          stroke="#22D3EE"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={280 + halfWidthPx}
                          y1={yHalf - 6}
                          x2={280 + halfWidthPx}
                          y2={yHalf + 6}
                          stroke="#22D3EE"
                          strokeWidth="1.5"
                        />
                        <rect
                          x={230}
                          y={yHalf - 22}
                          width={100}
                          height={16}
                          rx={2}
                          fill="#070A12"
                          stroke="#06B6D4"
                          strokeWidth="1"
                        />
                        <text
                          x="280"
                          y={yHalf - 11}
                          textAnchor="middle"
                          fill="#22D3EE"
                          fontSize="9.5"
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="bold"
                        >
                          FWHM = {metrics.betaObsDeg.toFixed(3)}°
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80 tabular-nums">
                  <span>{(braggAngle2Theta - 1.6).toFixed(2)}°</span>
                  <span>{(braggAngle2Theta - 0.8).toFixed(2)}°</span>
                  <span className="text-cyan-400 font-bold">2θ₀ = {braggAngle2Theta.toFixed(2)}°</span>
                  <span>{(braggAngle2Theta + 0.8).toFixed(2)}°</span>
                  <span>{(braggAngle2Theta + 1.6).toFixed(2)}°</span>
                </div>
              </div>

              {/* Bottom Real-Space Domain Visual Indicator */}
              <div className="mt-4 p-3.5 bg-[#0B0F19] border border-slate-800 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#070A12] border border-slate-800 rounded-sm flex items-center justify-center shrink-0">
                    <div
                      className="border border-cyan-400 bg-cyan-500/20 transition-all duration-200"
                      style={{
                        width: `${Math.max(8, Math.min(38, (crystalliteSizeNm / 90) * 38))}px`,
                        height: `${Math.max(8, Math.min(38, (crystalliteSizeNm / 90) * 38))}px`,
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white">
                      Real-Space Coherent Domain: D = {crystalliteSizeNm} nm
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      N ≈ {metrics.unitCellsAcross} Bragg planes coherently diffracting in phase
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400 tabular-nums">
                  <div>Regime: {crystalliteSizeNm < 12 ? 'Quantum / Ultra-Fine' : crystalliteSizeNm < 45 ? 'Nanocrystalline' : 'Sub-Micron'}</div>
                  <div className="text-emerald-400">Scherrer Validity: ● Optimal (&lt;100 nm)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
