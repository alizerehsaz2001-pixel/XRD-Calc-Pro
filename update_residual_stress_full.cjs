const fs = require('fs');

let code = fs.readFileSync('components/ResidualStressModule.tsx', 'utf8');

// Ensure RotateCcw, Activity, Calculator, Check, Sparkles are imported from lucide-react
// Make sure playSynthTone is imported
if (!code.includes("import { playSynthTone }")) {
  code = code.replace("import { useSettings,", "import { playSynthTone } from '../utils/sound';\nimport { useSettings,");
}

// Find start of JSX return
const returnMarker = "  return (";
const returnPos = code.indexOf(returnMarker);
if (returnPos === -1) {
  console.error("Could not find return statement");
  process.exit(1);
}

const beforeReturn = code.substring(0, returnPos);

const newReturnBlock = `  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Hero */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
                Residual Stress Deconvolution
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-md">
                  sin²ψ & Dölle-Hauk
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Triaxial stress tensors, direction-dependent XEC models, ψ-splitting deconvolution & ASTM E915 / EN 15305 compliance
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Preset Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {appState === 'results' && (
            <button
              onClick={() => setAppState('setup')}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 animate-in fade-in"
            >
              <RotateCcw className="w-4 h-4" />
              Edit Parameters
            </button>
          )}
          <div className="relative">
            <select
              onChange={e => {
                const preset = MATERIAL_PRESETS.find(p => p.name === e.target.value);
                if (preset) loadPreset(preset);
              }}
              defaultValue={MATERIAL_PRESETS[0].name}
              className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-indigo-500 cursor-pointer shadow-sm"
            >
              {MATERIAL_PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                  Preset: {p.name} {p.plane}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsXecModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Cpu className="w-4 h-4 text-indigo-500" />
            XEC Model ({xec.model.toUpperCase()})
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all"
            title="Import XRD Data"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SETUP STATE VIEW */}
      {appState === 'setup' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Elasticity & Geometry Setup (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-500" />
                    Elasticity & Goniometer Setup
                  </h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                    Plane {activePlane}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Young's Modulus E (GPa)
                    </label>
                    <input
                      type="number"
                      value={youngsModulus}
                      onChange={e => setYoungsModulus(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Poisson's Ratio (ν)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={poissonsRatio}
                      onChange={e => setPoissonsRatio(Math.max(0.01, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Stress-Free 2θ₀ (deg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={unstressedTwoTheta}
                      onChange={e => setUnstressedTwoTheta(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Wavelength λ (Å)
                    </label>
                    <input
                      type="number"
                      step="0.00001"
                      value={wavelength}
                      onChange={e => setWavelength(Math.max(0.1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* XEC Summary Card */}
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">S₁ (Elastic Compliance):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{xec.s1.toFixed(2)} TPa⁻¹</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">½S₂ (Shear Compliance):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{xec.halfS2.toFixed(2)} TPa⁻¹</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Marion-Cohen ψ*:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{diagnostics.crossoverPsiDeg.toFixed(2)}°</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Measured Tilt Points Table (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Diffraction Tilt Series ({dataPoints.length} Points)
                    </h4>
                  </div>
                  <button
                    onClick={addPoint}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tilt Angle
                  </button>
                </div>

                <div className="max-h-[300px] overflow-auto pr-1 custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-[10px] text-slate-400">Include</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">ψ Tilt (°)</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">Peak 2θ (°)</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">±Δ2θ</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">FWHM (°)</th>
                        <th className="py-2 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {dataPoints.map(p => (
                        <tr
                          key={p.id}
                          className={\`hover:bg-slate-50 dark:hover:bg-slate-800/40 \${!p.enabled ? 'opacity-40' : ''}\`}
                        >
                          <td className="py-1.5 px-2">
                            <button
                              onClick={() => togglePoint(p.id)}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {p.enabled ? <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                            </button>
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              value={p.psi}
                              onChange={e => updatePoint(p.id, 'psi', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={p.twoTheta}
                              onChange={e => updatePoint(p.id, 'twoTheta', Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              step="0.001"
                              value={p.error2Theta}
                              onChange={e => updatePoint(p.id, 'error2Theta', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={p.fwhm}
                              onChange={e => updatePoint(p.id, 'fwhm', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              onClick={() => removePoint(p.id)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ready & Compute Action Banner */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>{processedPoints.length} Active Tilt Points Ready</span>
                </div>
                <button
                  onClick={startComputation}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95"
                >
                  <Activity className="w-4 h-4" />
                  <span>Compute Residual Stress (sin²ψ & Dölle-Hauk)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPUTING STATE VIEW */}
      {appState === 'computing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Compass className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">1</span>
                Converting 2θ to d-spacing & evaluating lattice strains (ε_ψ)...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 1 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">2</span>
                Calculating X-ray Elastic Constants (S₁, ½S₂) via {xec.model.toUpperCase()}...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 2 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">3</span>
                Performing weighted linear & elliptical Dölle-Hauk sin²ψ regression...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={\`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 \${computingStep >= 3 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}\`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">4</span>
                Constructing 3D Triaxial Stress Tensor & ASTM E915 / EN 15305 audit...
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULTS STATE VIEW */}
      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Key Physical Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: Residual Normal Stress */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Residual Normal Stress (σ_φ)
                </span>
                <span className={\`text-[10px] font-black uppercase px-2 py-0.5 rounded-full \${
                  stress_MPa < 0
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : stress_MPa > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                }\`}>
                  {stressType}
                </span>
              </div>
              <div className="my-2">
                <div className={\`text-2xl font-black font-mono tracking-tight \${
                  stress_MPa < 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : stress_MPa > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-700 dark:text-slate-300'
                }\`}>
                  {stress_MPa.toFixed(1)} <span className="text-sm font-bold">± {stressError_MPa.toFixed(1)} MPa</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Slope ∂d/∂sin²ψ: {(linearFit.slope * 1000).toFixed(4)} × 10⁻³ {lengthUnit}
              </span>
            </div>

            {/* Metric 2: Shear Stress τ13 (ψ-Split) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Shear Stress (τ₁₃)
                </span>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                  ψ-Split
                </span>
              </div>
              <div className="my-2">
                <div className={\`text-2xl font-black font-mono tracking-tight \${
                  Math.abs(dolleHauk.tau13) > 10
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }\`}>
                  {dolleHauk.tau13.toFixed(1)} <span className="text-sm font-bold">± {dolleHauk.tau13Error.toFixed(1)} MPa</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {dolleHauk.hasSignificantSplitting ? 'Significant surface shear' : 'Minimal shear splitting'}
              </span>
            </div>

            {/* Metric 3: Goodness of Fit & Linearity */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Linearity (R²) & Cross-Over
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                  ASTM E915
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-slate-200">
                  {linearFit.rSquared.toFixed(4)}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Strain-Free ψ*: {diagnostics.crossoverPsiDeg.toFixed(1)}° (sin²ψ* = {diagnostics.crossoverSin2Psi.toFixed(3)})
              </span>
            </div>

            {/* Metric 4: Von Mises Equivalent */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Von Mises Stress (σ_vM)
                </span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                  Triaxial
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-purple-600 dark:text-purple-400">
                  {stressTensor.vonMisesStress.toFixed(1)} <span className="text-sm font-bold">MPa</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Hydrostatic σ_H: {stressTensor.hydrostaticStress.toFixed(1)} MPa
              </span>
            </div>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {[
              { id: 'classical', label: 'Classical sin²ψ', icon: Activity },
              { id: 'dolle_hauk', label: 'Dölle-Hauk (ψ-Split)', icon: Split },
              { id: 'tensor', label: '3D Stress Tensor', icon: Box },
              { id: 'depth', label: 'Depth Profiling', icon: Layers },
              { id: 'report', label: 'ASTM Audit Report', icon: FileText },
              { id: 'guide', label: 'Scattering Physics', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 \${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }\`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: CLASSICAL sin²ψ ANALYSIS */}
          {activeTab === 'classical' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Chart (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      {viewMode === 'dSpacing' ? \`Interplanar d-Spacing vs sin²ψ (\${lengthUnit})\` : 'Microstrain (ε_ψ) vs sin²ψ (µε)'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {processedPoints.length} active diffraction angles | Radiation λ = {wavelength} Å
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        onClick={() => setViewMode('dSpacing')}
                        className={\`px-2.5 py-1 rounded-lg transition-all \${
                          viewMode === 'dSpacing'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }\`}
                      >
                        d-Spacing
                      </button>
                      <button
                        onClick={() => setViewMode('microstrain')}
                        className={\`px-2.5 py-1 rounded-lg transition-all \${
                          viewMode === 'microstrain'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }\`}
                      >
                        Microstrain (µε)
                      </button>
                    </div>

                    <button
                      onClick={() => setShowErrorBars(!showErrorBars)}
                      className={\`p-1.5 rounded-xl border text-[10px] font-bold \${
                        showErrorBars
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }\`}
                      title="Toggle Error Bars"
                    >
                      ±σ
                    </button>
                  </div>
                </div>

                {/* Recharts Canvas */}
                <div className="h-[320px] w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis
                        dataKey="sin2psi"
                        type="number"
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                        label={{ value: 'sin²ψ (Tilt Angle Coordinate)', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                      />
                      <YAxis
                        dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                        tickFormatter={v => (viewMode === 'dSpacing' ? Number(v).toFixed(4) : Math.round(v).toString())}
                        label={{
                          value: viewMode === 'dSpacing' ? \`d-Spacing (\${lengthUnit})\` : 'Lattice Strain ε_ψ (µε)',
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 11,
                          fill: isDarkMode ? '#cbd5e1' : '#475569',
                          fontWeight: 'bold'
                        }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
                          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        formatter={(val: any, name: string) => [
                          viewMode === 'dSpacing' ? \`\${Number(val).toFixed(5)} \${lengthUnit}\` : \`\${Number(val).toFixed(1)} µε\`,
                          name === 'fittedD' || name === 'fittedMicrostrain' ? 'Linear Regression' : 'Measured Peak'
                        ]}
                      />
                      {showUnstressedLine && viewMode === 'dSpacing' && (
                        <ReferenceLine
                          y={convertLength(d0, lengthUnit as LengthUnit)}
                          stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                          strokeDasharray="4 4"
                          label={{
                            value: \`d₀ = \${convertLength(d0, lengthUnit as LengthUnit).toFixed(4)} \${lengthUnit}\`,
                            position: 'insideTopRight',
                            fontSize: 10,
                            fill: isDarkMode ? '#94a3b8' : '#64748b'
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey={viewMode === 'dSpacing' ? 'fittedD' : 'fittedMicrostrain'}
                        stroke={isDarkMode ? '#818cf8' : '#4f46e5'}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Scatter
                        dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                        fill={isDarkMode ? '#38bdf8' : '#0284c7'}
                        shape="circle"
                        r={5}
                      >
                        {showErrorBars && (
                          <ErrorBar
                            dataKey={viewMode === 'dSpacing' ? 'errorD' : 'errorMicrostrain'}
                            width={4}
                            strokeWidth={1.5}
                            stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                          />
                        )}
                      </Scatter>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-500">
                    S₁: <strong className="text-slate-800 dark:text-slate-200">{xec.s1.toFixed(2)} TPa⁻¹</strong> | ½S₂: <strong className="text-emerald-600 dark:text-emerald-400">{xec.halfS2.toFixed(2)} TPa⁻¹</strong>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    Marion-Cohen ψ* = {diagnostics.crossoverPsiDeg.toFixed(2)}°
                  </span>
                </div>
              </div>

              {/* Data Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Active Regression Parameters</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">Plane {activePlane}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Slope (∂d/∂sin²ψ)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {(linearFit.slope * 1000).toFixed(4)} × 10⁻³ {lengthUnit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Intercept (d_ψ=0)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {convertLength(linearFit.intercept, lengthUnit as LengthUnit).toFixed(5)} {lengthUnit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Stress σ_φ</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {stress_MPa.toFixed(1)} ± {stressError_MPa.toFixed(1)} MPa
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Linearity R²</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {linearFit.rSquared.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[280px]">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Tilt Series Angles ({dataPoints.length})
                    </h4>
                  </div>
                  <div className="flex-1 overflow-auto pr-1 custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-1 px-1 text-[10px] text-slate-400">ψ (°)</th>
                          <th className="py-1 px-1 text-[10px] text-slate-400">2θ (°)</th>
                          <th className="py-1 px-1 text-[10px] text-slate-400">d ({lengthUnit})</th>
                          <th className="py-1 px-1 text-[10px] text-slate-400">Strain (µε)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {processedPoints.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-1.5 px-1">{p.psi}°</td>
                            <td className="py-1.5 px-1">{p.twoTheta.toFixed(2)}°</td>
                            <td className="py-1.5 px-1 font-bold text-slate-800 dark:text-slate-200">{convertLength(p.dSpacing, lengthUnit as LengthUnit).toFixed(5)}</td>
                            <td className="py-1.5 px-1 text-indigo-600 dark:text-indigo-400 font-bold">{p.microstrain.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DÖLLE-HAUK ψ-SPLITTING */}
          {activeTab === 'dolle_hauk' && (
            <DolleHaukSplitView
              dolleHauk={dolleHauk}
              d0={d0}
              lengthUnit={lengthUnit}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 3: STRESS TENSOR & MOHR CIRCLE */}
          {activeTab === 'tensor' && (
            <StressTensorVisualizer
              tensor={stressTensor}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 4: DEPTH PROFILING (MOORE-EVANS) */}
          {activeTab === 'depth' && (
            <DepthProfilingWorkbench
              twoTheta0={twoTheta0}
              wavelength={wavelength}
              linearMuCm={linearMuCm}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 5: ASTM COMPLIANCE & REPORT */}
          {activeTab === 'report' && (
            <ResidualStressReport
              analysis={currentAnalysis}
              lengthUnit={lengthUnit}
            />
          )}

          {/* TAB 6: SCATTERING PHYSICS GUIDE */}
          {activeTab === 'guide' && (
            <PhysicsGuideTab />
          )}
        </div>
      )}

      {/* XEC Calculator Modal */}
      <XecCalculatorModal
        isOpen={isXecModalOpen}
        onClose={() => setIsXecModalOpen(false)}
        onApply={(e, nu, s1, halfS2, model, plane) => {
          setYoungsModulus(e);
          setPoissonsRatio(nu);
          setS1Override(s1);
          setHalfS2Override(halfS2);
          setActiveXecModel(model);
          setActivePlane(plane);
        }}
        currentE={youngsModulus}
        currentNu={poissonsRatio}
      />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Import XRD Tilt Series Data
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Paste two-column or multi-column data (e.g. <code>Psi [deg], 2Theta [deg], error, intensity, FWHM</code>):
            </p>
            <textarea
              value={rawImportText}
              onChange={e => setRawImportText(e.target.value)}
              placeholder={\`-60.0   157.58\\n-45.0   157.14\\n-30.0   156.76\\n0.0     156.40\\n30.0    156.78\\n45.0    157.15\\n60.0    157.60\`}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
            />
            {importError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                {importError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSV}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Load Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

const finalCode = beforeReturn + newReturnBlock;
fs.writeFileSync('components/ResidualStressModule.tsx', finalCode);
console.log('Successfully updated ResidualStressModule.tsx with 3-state architecture');
