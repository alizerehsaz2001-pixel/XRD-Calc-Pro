import React, { useState, useMemo } from 'react';
import { WHResult } from '../../types';
import { Layers, Compass, Atom, CheckCircle2, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

export type WHStrainModelType =
  | 'UDM'
  | 'USDM'
  | 'UDEDM'
  | 'SSP'
  | 'Halder-Wagner'
  | 'mWH'
  | 'Stephens'
  | 'Monshi-Scherrer';

export interface WHCadSchematicProps {
  result: WHResult | null;
  strainModel: WHStrainModelType;
  onSelectStrainModel: (model: WHStrainModelType) => void;
  wavelength: number;
  constantK: number;
  broadeningModel: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  instFwhm: number;
  isDecouplingEnabled: boolean;
  burgersVectorNm: number;
  youngsModulusGPa: number;
}

const MODEL_GUIDE: {
  id: WHStrainModelType;
  code: string;
  shortName: string;
  fullName: string;
  xLabel: string;
  yLabel: string;
  whenToUse: string;
  physicsPlainEnglish: string;
}[] = [
  {
    id: 'UDM',
    code: '01',
    shortName: 'UDM (Isotropic)',
    fullName: 'Uniform Deformation Model',
    xLabel: '4·sin(θ)',
    yLabel: 'β·cos(θ)',
    whenToUse: 'Best starting model for isotropic powders and nanoparticles.',
    physicsPlainEnglish: 'Assumes microstrain ε is uniform in all crystallographic directions (isotropic elasticity).'
  },
  {
    id: 'USDM',
    code: '02',
    shortName: 'USDM (Uniform Stress)',
    fullName: 'Uniform Stress Deformation Model',
    xLabel: '4·sin(θ) / E_hkl',
    yLabel: 'β·cos(θ)',
    whenToUse: 'Use when points scatter in UDM due to direction-dependent stiffness E_hkl.',
    physicsPlainEnglish: 'Assumes uniform lattice stress σ across planes; softer planes (low E_hkl) strain more.'
  },
  {
    id: 'UDEDM',
    code: '03',
    shortName: 'UDEDM (Energy Density)',
    fullName: 'Uniform Deformation Energy Density',
    xLabel: '4·sin(θ) · √(2/E_hkl)',
    yLabel: 'β·cos(θ)',
    whenToUse: 'Use for heavily deformed metals/ceramics where stored elastic energy density u is uniform.',
    physicsPlainEnglish: 'Relates microstrain to stored elastic energy density u = ½·ε²·E_hkl.'
  },
  {
    id: 'SSP',
    code: '04',
    shortName: 'SSP (Size–Strain Plot)',
    fullName: 'Size–Strain Plot Method',
    xLabel: 'd² · β*',
    yLabel: '(d · β*)²',
    whenToUse: 'Best when high-angle peaks are noisy or overlapping; weights low/mid-angle peaks.',
    physicsPlainEnglish: 'Models size broadening as Lorentzian and microstrain as Gaussian for higher R² stability.'
  },
  {
    id: 'Halder-Wagner',
    code: '05',
    shortName: 'Halder–Wagner',
    fullName: 'Halder–Wagner Voigt Parabolic Method',
    xLabel: 'β_HW / (tan θ · sin θ)',
    yLabel: '(β_HW / tan θ)²',
    whenToUse: 'Ideal for symmetric Voigt line profiles in nanocrystalline oxides and alloys.',
    physicsPlainEnglish: 'Uses parabolic Voigt deconvolution β_HW = β_obs(1 − β_inst²/β_obs²) to decouple D (slope Kλ/D) and ε (intercept 16ε²).'
  },
  {
    id: 'mWH',
    code: '06',
    shortName: 'mWH (Ungár Dislocation)',
    fullName: 'Modified W–H (Dislocation Contrast)',
    xLabel: 'K · √C_hkl',
    yLabel: 'ΔK = βcosθ/λ',
    whenToUse: 'Use when anisotropic strain is caused by screw/edge dislocations (e.g., FCC/BCC metals).',
    physicsPlainEnglish: 'Scales strain by average dislocation contrast factor C_hkl = C_h00(1 − q·H²).'
  },
  {
    id: 'Stephens',
    code: '07',
    shortName: 'Stephens Tensor',
    fullName: 'Stephens Anisotropic Microstrain',
    xLabel: '4sinθ·√(1+η·H²)',
    yLabel: 'β·cos(θ)',
    whenToUse: 'Use for cubic/tetragonal crystals showing strong (hkl)-dependent broadening.',
    physicsPlainEnglish: 'Models 4th-rank directional microstrain tensor (S_400, S_220) across Miller indices using invariant H².'
  },
  {
    id: 'Monshi-Scherrer',
    code: '08',
    shortName: 'Monshi–Scherrer',
    fullName: 'Monshi–Scherrer Logarithmic Fit',
    xLabel: 'ln(1 / cos θ)',
    yLabel: 'ln(β_rad)',
    whenToUse: 'Use to verify pure Scherrer size consistency across multiple reflections via log regression.',
    physicsPlainEnglish: 'Log-linearized Scherrer formulation minimizing least-squares error in D.'
  }
];

export const WHCadSchematic: React.FC<WHCadSchematicProps> = ({
  result,
  strainModel,
  onSelectStrainModel,
  wavelength,
  constantK,
  broadeningModel,
  instFwhm,
  isDecouplingEnabled,
  burgersVectorNm
}) => {
  const [activeTab, setActiveTab] = useState<'howto' | 'models' | 'lattice'>('howto');

  const activePoints = useMemo(() => {
    return (result?.pointsExtended || []).filter(p => !p.isExcluded);
  }, [result]);

  const meanApparentScherrerNm = useMemo(() => {
    if (activePoints.length === 0) return 0;
    const valid = activePoints.filter(p => p.singlePeakSizeNm > 0 && p.singlePeakSizeNm < 1000);
    if (valid.length === 0) return 0;
    return valid.reduce((s, p) => s + p.singlePeakSizeNm, 0) / valid.length;
  }, [activePoints]);

  const bestFitModel = useMemo(() => {
    if (!result?.modelComparisons || result.modelComparisons.length === 0) return null;
    return result.modelComparisons.find(m => m.isBestFit) || result.modelComparisons[0];
  }, [result]);

  const currentModelInfo = useMemo(() => {
    return MODEL_GUIDE.find(m => m.id === strainModel) || MODEL_GUIDE[0];
  }, [strainModel]);

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-md shadow-2xl overflow-hidden">
      {/* Top 2px Signal Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500" />

      {/* CAD Header Bar */}
      <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-cyan-500 rounded-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold">
                CAD METROLOGY SCHEMATIC // WILLIAMSON–HALL SIZE–STRAIN DECOUPLING ENGINE
              </span>
              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-300 font-bold">
                ACTIVE: {currentModelInfo.shortName}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
              Why W–H? Single-peak Scherrer mixes size & strain (⟨D_app⟩ ={' '}
              <strong className="text-amber-300">
                {meanApparentScherrerNm > 0 ? `${meanApparentScherrerNm.toFixed(1)} nm` : '—'}
              </strong>
              ) → W–H linear regression separates True Size D_WH ={' '}
              <strong className="text-emerald-300">
                {result && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 500
                  ? `${result.sizeInterceptNm.toFixed(2)} nm`
                  : 'Bulk (>250 nm)'}
              </strong>{' '}
              from Microstrain ε ={' '}
              <strong className="text-cyan-300">{result ? `${result.strainPercent.toFixed(3)}%` : '—'}</strong>.
            </p>
          </div>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
          {[
            { id: 'howto', code: '01', label: 'How W–H Works (3-Step Visual Guide)', icon: HelpCircle },
            { id: 'models', code: '02', label: '8-Model Decision Matrix & Selector', icon: Compass },
            { id: 'lattice', code: '03', label: 'Macrostrain vs. Microstrain CAD', icon: Atom }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xs text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer border whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="text-[10px] opacity-70">{tab.code}.</span>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Schematic Viewport */}
      <div className="p-4 bg-[#070A12]">
        {/* MODE 1: HOW WILLIAMSON-HALL WORKS (3-STEP VISUAL GUIDE) */}
        {activeTab === 'howto' && (
          <div className="space-y-4">
            {/* 3-Step Pedagogical CAD Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    STEP 1 // THE PROBLEM: TWO BROADENING SOURCES
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">β_total = β_size + β_strain</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Diffraction peaks broaden for two physical reasons that vary differently with Bragg angle <span className="font-mono text-white">θ</span>:
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-xs border border-slate-800/90">
                    <span className="text-[9px] text-emerald-400 uppercase block font-bold">1. Small Domains (D)</span>
                    <span className="text-white font-bold">β_D = Kλ / (D·cosθ)</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Grows slowly as 1/cosθ</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xs border border-slate-800/90">
                    <span className="text-[9px] text-cyan-400 uppercase block font-bold">2. Microstrain (ε)</span>
                    <span className="text-white font-bold">β_ε = 4ε · tanθ</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Grows rapidly as tanθ</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                    STEP 2 // THE TRICK: MULTIPLY BY cos(θ)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Y = c + m · X</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Multiplying total peak breadth <span className="font-mono text-white">β_sample</span> by <span className="font-mono text-white">cos(θ)</span> converts the sum into a straight line <span className="font-mono text-cyan-300">Y = m·X + c</span>:
                </p>
                <div className="mt-2.5 bg-slate-950 p-2.5 rounded-xs border border-slate-800 font-mono text-xs text-center">
                  <span className="text-amber-300 font-bold">β·cosθ</span>
                  <span className="text-slate-500"> = </span>
                  <span className="text-emerald-400 font-bold">Kλ / D</span>
                  <span className="text-slate-500"> + </span>
                  <span className="text-cyan-400 font-bold">ε</span>
                  <span className="text-slate-500"> · </span>
                  <span className="text-purple-300 font-bold">(4·sinθ)</span>
                  <div className="flex justify-around text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
                    <span>Y-Axis</span>
                    <span>Y-Intercept (c)</span>
                    <span>Slope (m)</span>
                    <span>X-Axis</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    STEP 3 // HOW TO READ YOUR LIVE PLOT
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Live Diagnosis</span>
                </div>
                <div className="space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-xs border border-slate-800">
                    <span className="text-slate-400">1. Size D (±1σ):</span>
                    <strong className="text-emerald-400">
                      {result && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 500
                        ? `${result.sizeInterceptNm.toFixed(2)}${result.sizeErrorNm ? ` ± ${result.sizeErrorNm.toFixed(2)}` : ''} nm`
                        : '> 250 nm (Bulk)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-xs border border-slate-800">
                    <span className="text-slate-400">2. Microstrain ε (±1σ):</span>
                    <strong className="text-cyan-300">
                      {result ? `${result.strainPercent.toFixed(4)}${result.strainErrorPercent ? ` ± ${result.strainErrorPercent.toFixed(4)}` : ''}%` : '—'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-xs border border-slate-800">
                    <span className="text-slate-400">3. Scherrer Bias Corrected:</span>
                    <strong className="text-amber-300">
                      {result && meanApparentScherrerNm > 0 && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 500
                        ? `${meanApparentScherrerNm.toFixed(1)} nm → ${result.sizeInterceptNm.toFixed(1)} nm`
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive SVG CAD Diagram of Intercept + Slope + Slope Regimes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-[#05080F] border border-slate-800 p-3 rounded-xs">
              <div className="lg:col-span-8">
                <svg viewBox="0 0 720 215" className="w-full h-auto block select-none font-mono">
                  <defs>
                    <pattern id="whCadGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.6" />
                    </pattern>
                  </defs>
                  <rect width="720" height="215" fill="url(#whCadGrid)" />

                  {/* Left Plot: Live W-H Linear Separation */}
                  <g transform="translate(48, 18)">
                    <text x="0" y="10" fill="#94a3b8" fontSize="9.5" fontWeight="bold">
                      A. LINEARIZED DECOUPLING SPACE ({currentModelInfo.yLabel} vs. {currentModelInfo.xLabel})
                    </text>

                    {/* Axes */}
                    <line x1="0" y1="22" x2="0" y2="162" stroke="#475569" strokeWidth="1.4" />
                    <line x1="0" y1="162" x2="365" y2="162" stroke="#475569" strokeWidth="1.4" />

                    {/* Size Floor Shaded Rectangle */}
                    <rect x="0" y="116" width="355" height="46" fill="#10b981" fillOpacity="0.09" />
                    <line x1="0" y1="116" x2="355" y2="116" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />

                    {/* Microstrain Wedge */}
                    <polygon
                      points={
                        result && result.regression.slope < 0
                          ? '0,116 355,116 355,146'
                          : '0,116 355,116 355,38'
                      }
                      fill="#06b6d4"
                      fillOpacity="0.11"
                    />

                    {/* Regression Line */}
                    <line
                      x1="0"
                      y1="116"
                      x2="355"
                      y2={result && result.regression.slope < 0 ? '146' : '38'}
                      stroke="#f43f5e"
                      strokeWidth="2.4"
                    />

                    {/* Intercept Callout */}
                    <circle cx="0" cy="116" r="5" fill="#10b981" stroke="#05080F" strokeWidth="1.5" />
                    <text x="10" y="110" fill="#34d399" fontSize="9.5" fontWeight="bold">
                      Y-Intercept c = Kλ/D ({result ? result.regression.intercept.toExponential(2) : '—'})
                    </text>

                    {/* Slope Triangle */}
                    {(!result || result.regression.slope >= 0) && (
                      <g>
                        <line x1="175" y1="78" x2="265" y2="78" stroke="#38bdf8" strokeWidth="1.3" />
                        <line x1="265" y1="78" x2="265" y2="58" stroke="#38bdf8" strokeWidth="1.3" />
                        <text x="272" y="72" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                          Slope m → ε = {result ? result.strainPercent.toFixed(3) : '—'}%
                        </text>
                      </g>
                    )}

                    <text x="178" y="143" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">
                      CONSTANT SIZE FLOOR: β_D·cosθ = Kλ / D
                    </text>
                    <text x="178" y="180" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">
                      X = {currentModelInfo.xLabel}
                    </text>
                  </g>

                  <line x1="440" y1="16" x2="440" y2="198" stroke="#1e293b" strokeWidth="1.2" />

                  {/* Right Side: Visual Guide to the 3 Possible W-H Slopes */}
                  <g transform="translate(458, 18)">
                    <text x="0" y="10" fill="#94a3b8" fontSize="9.5" fontWeight="bold">
                      B. MEANING OF SLOPE DIRECTION
                    </text>

                    {/* Case 1: Positive Slope */}
                    <g transform="translate(0, 24)">
                      <rect x="0" y="0" width="244" height="44" fill="#0B0F19" stroke="#1e293b" />
                      <line x1="12" y1="34" x2="54" y2="12" stroke="#34d399" strokeWidth="2.2" />
                      <text x="66" y="18" fill="#34d399" fontSize="9.5" fontWeight="bold">
                        1. Positive Slope (m &gt; 0)
                      </text>
                      <text x="66" y="33" fill="#94a3b8" fontSize="8.5">
                        Normal tensile/isotropic microstrain ε
                      </text>
                    </g>

                    {/* Case 2: Zero Slope */}
                    <g transform="translate(0, 76)">
                      <rect x="0" y="0" width="244" height="44" fill="#0B0F19" stroke="#1e293b" />
                      <line x1="12" y1="22" x2="54" y2="22" stroke="#38bdf8" strokeWidth="2.2" />
                      <text x="66" y="18" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                        2. Flat Horizontal Line (m ≈ 0)
                      </text>
                      <text x="66" y="33" fill="#94a3b8" fontSize="8.5">
                        Strain-free crystal (D_WH = D_Scherrer)
                      </text>
                    </g>

                    {/* Case 3: Scatter or Negative Slope */}
                    <g transform="translate(0, 128)">
                      <rect x="0" y="0" width="244" height="44" fill="#0B0F19" stroke="#1e293b" />
                      <line x1="12" y1="12" x2="54" y2="34" stroke="#f59e0b" strokeWidth="2.2" strokeDasharray="3 2" />
                      <text x="66" y="18" fill="#fbbf24" fontSize="9.5" fontWeight="bold">
                        3. High Scatter / Negative Slope
                      </text>
                      <text x="66" y="33" fill="#94a3b8" fontSize="8.5">
                        Anisotropic elasticity → Switch to USDM/SSP
                      </text>
                    </g>
                  </g>
                </svg>
              </div>

              {/* Right 4 Cols: Smart Diagnostic & Next-Step Recommendation */}
              <div className="lg:col-span-4 space-y-2.5 font-mono text-xs">
                <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Automated Fit Diagnosis
                    </span>
                    <span className="text-[10px] text-slate-400">
                      R² = <strong className="text-white">{result ? result.regression.rSquared.toFixed(4) : '—'}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {result ? (
                      result.regression.slope < 0 ? (
                        <>
                          Your regression slope is <strong className="text-amber-300">negative</strong>, which indicates compressive lattice relaxation or strong elastic anisotropy across <span className="font-mono">(hkl)</span> planes. Try switching to <strong>SSP</strong> or <strong>Halder–Wagner</strong>.
                        </>
                      ) : result.regression.rSquared >= 0.92 ? (
                        <>
                          Excellent linear correlation (<strong className="text-emerald-300">R² = {result.regression.rSquared.toFixed(3)}</strong>). The <strong className="text-white">{strainModel}</strong> model cleanly decouples domain size (<strong className="text-emerald-300">{result.sizeInterceptNm.toFixed(1)} nm</strong>) from microstrain (<strong className="text-cyan-300">{result.strainPercent.toFixed(3)}%</strong>).
                        </>
                      ) : (
                        <>
                          Moderate scatter (<strong className="text-amber-300">R² = {result.regression.rSquared.toFixed(3)}</strong>) detected under <strong className="text-white">{strainModel}</strong>. This usually means crystal stiffness <span className="font-mono">E_hkl</span> or dislocation contrast <span className="font-mono">C_hkl</span> varies by direction.
                        </>
                      )
                    ) : (
                      'Enter at least 2 reflections to diagnose size–strain linearity.'
                    )}
                  </p>

                  {bestFitModel && bestFitModel.modelName !== strainModel && (
                    <button
                      type="button"
                      onClick={() => onSelectStrainModel(bestFitModel.modelName as WHStrainModelType)}
                      className="w-full mt-1 py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xs text-emerald-300 text-[11px] font-mono font-bold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>Switch to Best-Fit: {bestFitModel.modelName} (R²={bestFitModel.rSquared.toFixed(3)})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded-xs text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Instrumental Deconvolution:</span>
                  <strong className="text-amber-300">
                    {isDecouplingEnabled ? `${broadeningModel} (β_inst = ${instFwhm}°)` : 'Disabled (Raw FWHM)'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: 8-MODEL DECISION MATRIX & WHEN-TO-USE SELECTOR */}
        {activeTab === 'models' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
              <span>
                Click any model card below to immediately switch the Williamson–Hall solver and compare decoupled <strong className="text-emerald-300">D</strong>, <strong className="text-cyan-300">ε</strong>, and <strong className="text-amber-300">R²</strong>:
              </span>
              {bestFitModel && (
                <span className="text-emerald-400 font-bold">
                  Recommended Highest R² Model: {bestFitModel.label} (R² = {bestFitModel.rSquared.toFixed(4)})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {MODEL_GUIDE.map(m => {
                const isSelected = strainModel === m.id;
                const liveComp = result?.modelComparisons?.find(c => c.modelName === m.id);
                const isBest = liveComp?.isBestFit;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectStrainModel(m.id)}
                    className={`p-3 rounded-xs border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/60 text-white'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400" />}

                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          <span>{m.shortName}</span>
                        </span>
                        {isBest && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold uppercase">
                            Best R²
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 font-sans leading-snug mb-2">
                        {m.whenToUse}
                      </p>
                      <p className="text-[10px] text-slate-500 font-sans leading-snug">
                        {m.physicsPlainEnglish}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 font-mono text-[10px] tabular-nums">
                      <div>
                        <span className="text-slate-500 block text-[8.5px]">Size D</span>
                        <strong className="text-emerald-300">
                          {liveComp && liveComp.sizeNm > 0 && liveComp.sizeNm < 500
                            ? `${liveComp.sizeNm.toFixed(1)}nm`
                            : 'Bulk'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8.5px]">Strain ε</span>
                        <strong className="text-cyan-300">
                          {liveComp ? `${liveComp.strainPercent.toFixed(3)}%` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8.5px]">Fit R²</span>
                        <strong className="text-amber-300">
                          {liveComp ? liveComp.rSquared.toFixed(3) : '—'}
                        </strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 3: ATOMIC LATTICE DISTORTION & DISLOCATION CORE CAD */}
        {activeTab === 'lattice' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 bg-[#05080F] border border-slate-800 p-3 rounded-xs">
              <svg viewBox="0 0 720 210" className="w-full h-auto block select-none font-mono">
                <rect width="720" height="210" fill="url(#whCadGrid)" />

                {/* 1. Unstrained Domain */}
                <g transform="translate(22, 20)">
                  <text x="95" y="10" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="bold">
                    1. UNSTRAINED DOMAIN (ε = 0)
                  </text>
                  <rect x="10" y="20" width="170" height="125" fill="#0B0F19" stroke="#1e293b" />
                  {[0, 1, 2, 3, 4].map(r => (
                    <g key={r}>
                      <line x1="25" y1={36 + r * 23} x2="165" y2={36 + r * 23} stroke="#10b981" strokeOpacity="0.35" />
                      {[0, 1, 2, 3, 4, 5].map(c => (
                        <circle key={c} cx={32 + c * 25} cy={36 + r * 23} r="3" fill="#34d399" />
                      ))}
                    </g>
                  ))}
                  <text x="95" y="162" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                    Uniform d₀ → Sharp Bragg Peak
                  </text>
                  <text x="95" y="176" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="bold">
                    Broadening from Finite Size D Only
                  </text>
                </g>

                {/* 2. Uniform Macrostrain */}
                <g transform="translate(262, 20)">
                  <text x="95" y="10" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="bold">
                    2. UNIFORM MACROSTRAIN (Δd = const)
                  </text>
                  <rect x="10" y="20" width="170" height="125" fill="#0B0F19" stroke="#1e293b" />
                  {[0, 1, 2, 3, 4].map(r => (
                    <g key={r}>
                      <line x1="25" y1={32 + r * 25} x2="165" y2={32 + r * 25} stroke="#f59e0b" strokeOpacity="0.35" />
                      {[0, 1, 2, 3, 4, 5].map(c => (
                        <circle key={c} cx={32 + c * 25} cy={32 + r * 25} r="3" fill="#fbbf24" />
                      ))}
                    </g>
                  ))}
                  <text x="95" y="162" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                    Shifted d₀ + Δd → Peak Shifts 2θ
                  </text>
                  <text x="95" y="176" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold">
                    No Extra Peak Broadening
                  </text>
                </g>

                {/* 3. Non-Uniform Microstrain (What W-H Measures!) */}
                <g transform="translate(502, 20)">
                  <text x="95" y="10" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                    3. NON-UNIFORM MICROSTRAIN (±Δd/d₀)
                  </text>
                  <rect x="10" y="20" width="170" height="125" fill="#0B0F19" stroke="#06b6d4" strokeWidth="1.2" />
                  {[0, 1, 2, 3, 4].map(r => (
                    <g key={r}>
                      {[0, 1, 2, 3, 4, 5].map(c => {
                        const dx = Math.sin(r * 1.2 + c * 0.8) * 3.6;
                        const dy = Math.cos(c * 1.1 - r * 0.9) * 3.0;
                        const isCore = r === 2 && c === 3;
                        return (
                          <circle
                            key={c}
                            cx={32 + c * 25 + dx}
                            cy={36 + r * 23 + dy}
                            r={isCore ? 4 : 3}
                            fill={isCore ? '#f43f5e' : '#38bdf8'}
                          />
                        );
                      })}
                    </g>
                  ))}
                  <text x="95" y="162" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                    Local d₀ ± Δd Distribution
                  </text>
                  <text x="95" y="176" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold">
                    Broadens Peak: β_ε = 4ε·tanθ
                  </text>
                </g>
              </svg>
            </div>

            <div className="lg:col-span-4 space-y-2.5 font-mono text-xs">
              <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Williamson–Smallman Dislocation Relation
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Williamson–Hall measures <strong>Type III non-uniform microstrain</strong> (<span className="font-mono text-cyan-300">ε = Δd/d₀</span>), where tension and compression coexist around crystal defects and dislocations within a single domain:
                </p>
                <div className="bg-slate-950 p-2.5 rounded-xs border border-slate-800 text-center text-rose-300 font-bold">
                  ρ = (2√3 · |ε|) / (D · b) ={' '}
                  {result?.dislocationDensity10_14 ? `${result.dislocationDensity10_14.toFixed(2)} × 10¹⁴ m⁻²` : '—'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Burgers Vector b = {burgersVectorNm} nm</span>
                  <span>λ = {wavelength} Å (K = {constantK})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
