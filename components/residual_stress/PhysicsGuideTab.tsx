import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Compass,
  BarChart2,
  Cpu,
  ShieldCheck,
  RotateCcw,
  Activity,
  ArrowUpRight,
  Split,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine
} from 'recharts';

export const PhysicsGuideTab: React.FC = () => {
  const [guideSubTab, setGuideSubTab] = useState<'simulator' | 'geometry' | 'taxonomy' | 'crossover' | 'standards'>('simulator');

  // Simulator state
  const [simStress, setSimStress] = useState<number>(-480); // MPa
  const [simShear, setSimShear] = useState<number>(0); // MPa
  const [simE, setSimE] = useState<number>(211); // GPa
  const [simNu, setSimNu] = useState<number>(0.28);
  const [simD0, setSimD0] = useState<number>(1.1700); // Å

  const simChartData = useMemo(() => {
    const psis = [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60];
    const halfS2 = (1 + simNu) / (simE * 1000); // 1/MPa
    
    return psis.map(psi => {
      const rad = (psi * Math.PI) / 180;
      const sin2psi = Math.pow(Math.sin(rad), 2);
      const sin2psi_sign = Math.sin(2 * rad);
      
      const strain = halfS2 * (simStress * sin2psi + simShear * sin2psi_sign);
      const dPsi = simD0 * (1 + strain);
      
      return {
        psi: `${psi}°`,
        sin2psi: parseFloat(sin2psi.toFixed(4)),
        dPsi: parseFloat(dPsi.toFixed(6)),
        microstrain: parseFloat((strain * 1e6).toFixed(1)),
        branch: psi < 0 ? '-ψ' : '+ψ'
      };
    });
  }, [simStress, simShear, simE, simNu, simD0]);

  // Marion-Cohen cross-over calculation
  const crossoverSin2 = (2 * simNu) / (1 + simNu);
  const crossoverPsiDeg = Math.asin(Math.sqrt(crossoverSin2)) * (180 / Math.PI);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-indigo-500/20 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 text-indigo-200">
            <Layers className="w-6 h-6 text-indigo-400" />
            Diffraction Stress Mechanics & Physics Workbench
          </h3>
          <p className="text-xs text-indigo-200/70 mt-1">
            Interactive goniometer scattering kinematics, Marion-Cohen strain cross-over, and signature taxonomy
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-indigo-500/30">
          {[
            { id: 'simulator', label: 'Stress Simulator', icon: Sliders },
            { id: 'geometry', label: 'Beam Geometry', icon: Compass },
            { id: 'taxonomy', label: 'Curve Taxonomy', icon: BarChart2 },
            { id: 'crossover', label: 'Marion-Cohen ψ*', icon: Cpu },
            { id: 'standards', label: 'Standards & Protocols', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setGuideSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  guideSubTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Stress Field Simulator */}
      {guideSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Stress Parameters
              </h4>
              <button
                onClick={() => {
                  setSimStress(-480);
                  setSimShear(0);
                  setSimE(211);
                  setSimNu(0.28);
                  setSimD0(1.1700);
                }}
                className="text-[10px] font-bold text-indigo-300/60 hover:text-indigo-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Normal Stress Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-200 font-bold">Normal Stress (σ₁₁)</span>
                <span className={`font-black ${simStress < 0 ? 'text-blue-400' : simStress > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {simStress > 0 ? `+${simStress}` : simStress} MPa
                </span>
              </div>
              <input
                type="range"
                min="-1000"
                max="1000"
                step="20"
                value={simStress}
                onChange={e => setSimStress(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Shear Stress Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-200 font-bold">Shear Stress (τ₁₃)</span>
                <span className={`font-black ${simShear !== 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {simShear > 0 ? `+${simShear}` : simShear} MPa
                </span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="10"
                value={simShear}
                onChange={e => setSimShear(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Modulus E */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-200 font-bold">Young's Modulus (E)</span>
                <span className="text-indigo-300 font-black">{simE} GPa</span>
              </div>
              <input
                type="range"
                min="50"
                max="450"
                step="5"
                value={simE}
                onChange={e => setSimE(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Poisson's Ratio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-200 font-bold">Poisson's Ratio (ν)</span>
                <span className="text-indigo-300 font-black">{simNu.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.45"
                step="0.01"
                value={simNu}
                onChange={e => setSimNu(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Live Simulated Interplanar d-Spacing vs sin²ψ
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                simStress < 0
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                  : simStress > 0
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {simStress < 0 ? 'Compressive (-m)' : simStress > 0 ? 'Tensile (+m)' : 'Zero Stress'}
              </span>
            </div>

            <div className="h-[220px] w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={simChartData} margin={{ top: 10, right: 10, bottom: 15, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="sin2psi"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    label={{ value: 'sin²ψ', position: 'bottom', offset: 0, fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <YAxis
                    dataKey="dPsi"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={v => Number(v).toFixed(5)}
                    label={{ value: 'd-Spacing (Å)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    formatter={(val: any) => [`${Number(val).toFixed(5)} Å`, 'Simulated d']}
                  />
                  <ReferenceLine y={simD0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="dPsi"
                    stroke={simStress < 0 ? '#60a5fa' : simStress > 0 ? '#f43f5e' : '#10b981'}
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#38bdf8' }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-indigo-500/20 text-xs font-mono grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[9px] text-slate-400 block font-sans">Simulated Stress</span>
                <span className={`font-black ${simStress < 0 ? 'text-blue-400' : simStress > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {simStress} MPa
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-sans">Shear Stress τ₁₃</span>
                <span className={`font-black ${simShear !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {simShear} MPa
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-sans">Cross-Over ψ*</span>
                <span className="font-black text-indigo-300">
                  {crossoverPsiDeg.toFixed(1)}°
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Beam Geometry */}
      {guideSubTab === 'geometry' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          <div className="md:col-span-7 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2 self-start">
              <Compass className="w-4 h-4 text-indigo-400" />
              Goniometer Scattering Vector (Q) & Tilt Axis (ψ)
            </h4>
            <svg viewBox="0 0 500 280" className="w-full max-w-lg h-auto">
              <defs>
                <linearGradient id="beamGradG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="diffGradG" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              <rect x="100" y="180" width="300" height="16" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              <text x="250" y="192" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">Sample Surface (Directing Stress σ₁₁)</text>

              <line x1="250" y1="180" x2="250" y2="40" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
              <text x="256" y="55" fill="#f59e0b" fontSize="11" fontWeight="bold">Surface Normal (N)</text>

              <line x1="250" y1="180" x2="180" y2="60" stroke="#10b981" strokeWidth="3" />
              <polygon points="180,60 188,70 178,74" fill="#10b981" />
              <text x="145" y="65" fill="#10b981" fontSize="12" fontWeight="black">Vector Q (ψ)</text>

              <path d="M 250,110 A 70,70 0 0,0 215,119" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <text x="225" y="105" fill="#38bdf8" fontSize="12" fontWeight="black">ψ (Tilt)</text>

              <line x1="80" y1="100" x2="250" y2="180" stroke="url(#beamGradG)" strokeWidth="4" />
              <polygon points="250,180 232,170 236,178" fill="#38bdf8" />
              <text x="70" y="95" fill="#38bdf8" fontSize="11" fontWeight="bold">Incident X-Ray (S₀)</text>

              <line x1="250" y1="180" x2="410" y2="90" stroke="url(#diffGradG)" strokeWidth="4" />
              <polygon points="410,90 392,100 398,108" fill="#f43f5e" />
              <text x="415" y="85" fill="#f43f5e" fontSize="11" fontWeight="bold">Diffracted Beam (S)</text>
            </svg>
          </div>

          <div className="md:col-span-5 space-y-4">
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Bragg Lattice Strain Projection
              </h4>
              <p className="text-xs text-indigo-100/80 leading-relaxed">
                As the goniometer tilts the sample by angle <strong className="text-white">ψ</strong>, the diffraction vector <strong className="text-emerald-400">Q</strong> samples lattice planes oriented at angle ψ to the surface.
              </p>
              <div className="p-2.5 bg-black/40 rounded-xl font-mono text-[11px] text-indigo-300 border border-indigo-500/20">
                ε_ψ = (d_ψ - d₀) / d₀ = ½ S₂ · σ₁₁ · sin²ψ
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Split className="w-4 h-4" />
                Positive vs Negative Tilt Angles (±ψ)
              </h4>
              <p className="text-xs text-indigo-100/80 leading-relaxed">
                In a symmetric biaxial stress field, <strong className="text-white">d(+ψ) = d(-ψ)</strong>, yielding a perfectly linear <strong className="text-white">d vs sin²ψ</strong> plot. If out-of-plane shear stress <strong className="text-amber-300">τ₁₃</strong> exists, +ψ and -ψ branches split into an ellipse!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Taxonomy of sin²ψ curves */}
      {guideSubTab === 'taxonomy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> 1. Homogeneous Linear (Biaxial)
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              Standard linear response indicating uniform in-plane biaxial stress with zero out-of-plane shear. Positive slope indicates tensile stress; negative slope indicates compressive stress.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Split className="w-4 h-4" /> 2. Elliptical ψ-Splitting (Shear τ₁₃)
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              Branch splitting between +ψ and -ψ tilts forming an ellipse, generated by directional grinding or milling shear stresses τ₁₃ / τ₂₃.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 3. Curved / Quadratic (Depth Gradient)
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              Curvature stems from steep subsurface stress gradients where shallow X-ray penetration at high ψ tilts samples only the outermost layer.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> 4. Oscillatory (Crystallographic Texture)
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              Sinusoidal ripples around the linear trend indicate preferred grain orientation / texture, where elastic anisotropy varies per grain family.
            </p>
          </div>
        </div>
      )}

      {/* 4. Marion-Cohen Cross-Over */}
      {guideSubTab === 'crossover' && (
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Marion-Cohen Cross-Over Angle (ψ*) for Strain-Free d₀ Extraction
            </h4>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              ψ* = {crossoverPsiDeg.toFixed(2)}° (sin²ψ* = {crossoverSin2.toFixed(3)})
            </span>
          </div>

          <p className="text-xs text-indigo-100/80 leading-relaxed max-w-3xl">
            In equi-biaxial stress fields (σ₁₁ = σ₂₂), there exists a unique crystallographic tilt angle <strong className="text-white">ψ*</strong> where Poisson contraction in the normal direction exactly balances in-plane extension. At this cross-over angle, <strong className="text-emerald-300 font-mono">d(ψ*) = d₀</strong> regardless of the stress magnitude!
          </p>

          <div className="p-4 bg-black/40 rounded-xl border border-indigo-500/20 font-mono text-xs space-y-2">
            <div className="text-indigo-300">
              {'sin²ψ* = (-2 S₁) / (½ S₂) = 2ν / (1 + ν)'}
            </div>
            <div className="text-slate-400 text-[11px]">
              For steel (ν = 0.28): sin²ψ* = 0.4375 → ψ* = 41.4°. Measuring at ψ* allows direct verification of unstressed lattice spacing d₀ on intact components!
            </div>
          </div>
        </div>
      )}

      {/* 5. Standards */}
      {guideSubTab === 'standards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> ASTM E915 Alignment Verification
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              Standard Test Method for Verifying Alignment of X-Ray Diffraction Residual Stress Instruments using Stress-Free Powder Standards (W or Fe powder with residual stress within ±14 MPa).
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Layers className="w-4 h-4" /> EN 15305 & SAE HS-784 Protocols
            </h4>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              European and SAE standards governing minimum tilt angle distribution (≥5 ψ angles up to |ψ| ≥ 45°), background subtraction, and Moore-Evans layer removal correction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
