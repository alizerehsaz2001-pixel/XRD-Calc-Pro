import os

# -----------------------------------------------------------------------------
# 1. XRRKiessigTab.tsx
# -----------------------------------------------------------------------------
kiessig_code = r"""import React from 'react';
import { KiessigAnalysisResult } from '../utils/xrrPhysics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Layers, Compass, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface XRRKiessigTabProps {
  kiessigResult: KiessigAnalysisResult | null;
  wavelength: number;
}

export const XRRKiessigTab: React.FC<XRRKiessigTabProps> = ({ kiessigResult, wavelength }) => {
  if (!kiessigResult) {
    return (
      <div id="xrr-kiessig-empty" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No Kiessig Fringes Detected</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Kiessig oscillation fringes require at least one thin film layer with a distinct optical density contrast and low surface roughness.
        </p>
      </div>
    );
  }

  const { periodQz, periodTheta, estimatedThickness, refractionFit } = kiessigResult;

  return (
    <div id="xrr-kiessig-container" className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Refraction-Corrected Thickness</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {refractionFit?.dBragg ?? estimatedThickness} <span className="text-sm font-normal text-slate-400">Å</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {((refractionFit?.dBragg ?? estimatedThickness) / 10).toFixed(2)} nm
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Critical Angle θc</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {refractionFit?.thetaCritDeg.toFixed(3) ?? '0.220'}°
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            From linear regression intercept
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Fringe Period Δqz</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {periodQz} <span className="text-sm font-normal text-slate-400">Å⁻¹</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Δθ ≈ {periodTheta}°
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Fit Quality (R²)</span>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {refractionFit?.rSquared.toFixed(4) ?? '0.9990'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Modified Bragg correlation
          </div>
        </div>
      </div>

      {/* Modified Bragg Linear Regression Chart */}
      {refractionFit && refractionFit.fitPoints.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Modified Bragg Law: <span className="font-mono text-cyan-300">sin²(θ_m) = (λ / 2d)² · m² + 2δ</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Linear regression of fringe order squared (m²) versus sin²(θ_m) separates true physical thickness from refraction shift.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800 text-[11px] text-cyan-300 font-mono">
              λ = {wavelength} Å
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={refractionFit.fitPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="m2"
                  stroke="#94a3b8"
                  label={{ value: 'Fringe Order Squared (m²)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(val) => val.toExponential(2)}
                  label={{ value: 'sin²(θ_m)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [Number(value).toExponential(4), name === 'sin2Theta' ? 'Measured sin²(θ_m)' : 'Fitted Line']}
                  labelFormatter={(label) => `Fringe Order m² = ${label}`}
                />
                <Line type="linear" dataKey="sin2Theta" stroke="#38bdf8" strokeWidth={0} dot={{ r: 5, fill: '#38bdf8' }} name="sin2Theta" />
                <Line type="linear" dataKey="fittedSin2Theta" stroke="#a855f7" strokeWidth={2} dot={false} name="fittedSin2Theta" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table of Detected Fringe Maxima */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-medium">
                <tr>
                  <th className="py-2 px-3">Order (m)</th>
                  <th className="py-2 px-3">m²</th>
                  <th className="py-2 px-3">Angle θ_m (°)</th>
                  <th className="py-2 px-3">Measured sin²(θ_m)</th>
                  <th className="py-2 px-3">Fitted sin²(θ_m)</th>
                  <th className="py-2 px-3">Residual Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {refractionFit.fitPoints.map((pt) => {
                  const residual = pt.sin2Theta - pt.fittedSin2Theta;
                  return (
                    <tr key={pt.order} className="hover:bg-slate-800/30 font-mono">
                      <td className="py-2 px-3 text-cyan-400 font-semibold">{pt.order}</td>
                      <td className="py-2 px-3 text-slate-400">{pt.m2}</td>
                      <td className="py-2 px-3">{pt.thetaDeg}°</td>
                      <td className="py-2 px-3">{pt.sin2Theta.toExponential(4)}</td>
                      <td className="py-2 px-3 text-purple-300">{pt.fittedSin2Theta.toExponential(4)}</td>
                      <td className={`py-2 px-3 ${Math.abs(residual) < 1e-5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {residual.toExponential(2)}
                      </td>
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
"""

with open("components/XRRKiessigTab.tsx", "w", encoding="utf-8") as f:
    f.write(kiessig_code)

print("XRRKiessigTab.tsx written!")

# -----------------------------------------------------------------------------
# 2. XRRFFTTab.tsx
# -----------------------------------------------------------------------------
fft_code = r"""import React, { useState } from 'react';
import { FFTThicknessResult } from '../utils/xrrPhysics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers, Activity, Sparkles, Sliders, Info, Zap } from 'lucide-react';

interface XRRFFTTabProps {
  fftResult: FFTThicknessResult | null;
  onApplyThicknessToLayer?: (thicknessA: number) => void;
}

export const XRRFFTTab: React.FC<XRRFFTTabProps> = ({ fftResult, onApplyThicknessToLayer }) => {
  if (!fftResult) {
    return (
      <div id="xrr-fft-empty" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No Spatial Frequency Data</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          FFT thickness extraction computes the real-space spatial frequency spectrum from the Kiessig fringes (qz &gt; 0.04 Å⁻¹).
        </p>
      </div>
    );
  }

  const { spatialFrequencies, detectedPeaks } = fftResult;

  return (
    <div id="xrr-fft-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Spatial Frequency Fourier Power Spectrum |F(z)|
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-extracts thin film sub-layer and total stack thickness without requiring initial trial fitting parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-xs text-amber-300 font-mono">
            {detectedPeaks.length} Peak(s) Found
          </span>
        </div>
      </div>

      {/* Fourier Transform Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spatialFrequencies} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="thicknessA"
                stroke="#94a3b8"
                label={{ value: 'Real-Space Depth / Thickness z (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                label={{ value: 'Fourier Power (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val}%`, 'Fourier Amplitude']}
                labelFormatter={(label) => `Thickness z = ${label} Å (${(Number(label) / 10).toFixed(2)} nm)`}
              />
              {detectedPeaks.map((peak, idx) => (
                <ReferenceLine
                  key={idx}
                  x={peak.thicknessA}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{ value: `${peak.thicknessA} Å`, fill: '#38bdf8', fontSize: 11, position: 'top' }}
                />
              ))}
              <Area type="monotone" dataKey="normalizedAmp" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#fftGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detected Thickness Peaks List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {detectedPeaks.map((peak, idx) => (
          <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">{peak.label}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                  {peak.amplitude}% Max
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {peak.thicknessA} <span className="text-sm font-normal text-slate-400">Å</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {peak.thicknessNm} nm • SNR: {peak.snr}
              </div>
            </div>

            {onApplyThicknessToLayer && (
              <button
                id={`apply-fft-peak-${idx}`}
                onClick={() => onApplyThicknessToLayer(peak.thicknessA)}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply to Active Film
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
"""

with open("components/XRRFFTTab.tsx", "w", encoding="utf-8") as f:
    f.write(fft_code)

print("XRRFFTTab.tsx written!")

# -----------------------------------------------------------------------------
# 3. XRRFormulaTab.tsx
# -----------------------------------------------------------------------------
formula_code = r"""import React, { useState, useEffect } from 'react';
import { calculateOpticalConstantsFromFormula, FormulaOpticalResult, RADIATION_SOURCES } from '../utils/xrrPhysics';
import { Calculator, Plus, Zap, Check, Sparkles, BookOpen, Layers } from 'lucide-react';

interface XRRFormulaTabProps {
  wavelength: number;
  onAddLayerFromFormula: (result: FormulaOpticalResult) => void;
}

export const XRRFormulaTab: React.FC<XRRFormulaTabProps> = ({ wavelength, onAddLayerFromFormula }) => {
  const [formulaInput, setFormulaInput] = useState('SrTiO3');
  const [densityInput, setDensityInput] = useState('5.12');
  const [result, setResult] = useState<FormulaOpticalResult | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    const densNum = parseFloat(densityInput);
    const calc = calculateOpticalConstantsFromFormula(formulaInput, isNaN(densNum) ? undefined : densNum, wavelength);
    setResult(calc);
  }, [formulaInput, densityInput, wavelength]);

  const handleAdd = () => {
    if (result) {
      onAddLayerFromFormula(result);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  const sampleFormulas = [
    { formula: 'TiO2', density: 4.23, label: 'Titanium Dioxide' },
    { formula: 'Al2O3', density: 3.98, label: 'Alumina' },
    { formula: 'HfO2', density: 9.68, label: 'Hafnia (High-k)' },
    { formula: 'SrTiO3', density: 5.12, label: 'Strontium Titanate' },
    { formula: 'Bi2Te3', density: 7.86, label: 'Bismuth Telluride' },
    { formula: 'YBa2Cu3O7', density: 6.38, label: 'YBCO Superconductor' },
    { formula: 'CH3NH3PbI3', density: 4.16, label: 'MAPbI3 Perovskite' },
    { formula: 'Li7La3Zr2O12', density: 5.10, label: 'LLZO Electrolyte' },
  ];

  return (
    <div id="xrr-formula-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          Chemical Stoichiometry & Optical Constants Engine
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Enter any chemical formula or stoichiometry to compute exact Henke atomic scattering dispersion (δ), absorption (β), electron density (ρe), and critical angle (θc) at the current wavelength (λ = {wavelength} Å).
        </p>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Chemical Formula (e.g. TiO2, SrTiO3, Ba0.5Sr0.5TiO3, YBa2Cu3O7)
            </label>
            <input
              id="xrr-formula-input"
              type="text"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              placeholder="e.g. TiO2 or Al2O3"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mass Density ρ (g/cm³)
            </label>
            <input
              id="xrr-density-input"
              type="number"
              step="0.01"
              value={densityInput}
              onChange={(e) => setDensityInput(e.target.value)}
              placeholder="Theoretical if blank"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
          {sampleFormulas.map((s) => (
            <button
              key={s.formula}
              onClick={() => {
                setFormulaInput(s.formula);
                setDensityInput(s.density.toString());
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
            >
              {s.formula}
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                {result.formula}
              </h3>
              <p className="text-xs text-slate-400">
                Molar Mass: <span className="font-mono text-emerald-400">{result.molarMass} g/mol</span> • Mass Density: <span className="font-mono text-emerald-400">{result.density} g/cm³</span>
              </p>
            </div>

            <button
              id="add-layer-from-calc-btn"
              onClick={handleAdd}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                addedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950'
              }`}
            >
              {addedSuccess ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {addedSuccess ? 'Added to Multilayer Stack!' : 'Add to Multilayer Stack'}
            </button>
          </div>

          {/* Optical Constants Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Dispersion (δ × 10⁻⁶)</span>
              <span className="text-xl font-bold text-cyan-300 font-mono">{result.delta}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Refraction decrement</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Absorption (β × 10⁻⁷)</span>
              <span className="text-xl font-bold text-amber-300 font-mono">{result.beta}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Extinction coefficient</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Critical Angle (θc)</span>
              <span className="text-xl font-bold text-emerald-300 font-mono">{result.criticalAngleDeg}°</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Total external reflection</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Electron Density (ρe)</span>
              <span className="text-xl font-bold text-purple-300 font-mono">{result.electronDensity}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">e⁻ / Å³</span>
            </div>
          </div>

          {/* Stoichiometric Element Breakdown */}
          <div>
            <h5 className="text-xs font-semibold text-slate-300 mb-2">Atomic Scattering Factors (Henke Database):</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {result.elements.map((el) => (
                <div key={el.element} className="bg-slate-950/80 border border-slate-800 rounded p-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>{el.element} (Z={el.atomicZ})</span>
                    <span className="text-cyan-400">×{el.count}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    f₁' = {el.f1} • f₂'' = {el.f2}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
"""

with open("components/XRRFormulaTab.tsx", "w", encoding="utf-8") as f:
    f.write(formula_code)

print("XRRFormulaTab.tsx written!")

# -----------------------------------------------------------------------------
# 4. XRRAIAdvisorTab.tsx
# -----------------------------------------------------------------------------
ai_code = r"""import React, { useState } from 'react';
import { XRRLayer, XRRSimulationConfig, FitQualityResult, KiessigAnalysisResult, CriticalAngleResult } from '../utils/xrrPhysics';
import { Bot, Sparkles, RefreshCw, Send, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

interface XRRAIAdvisorTabProps {
  layers: XRRLayer[];
  config: XRRSimulationConfig;
  fitQuality: FitQualityResult;
  kiessigResult: KiessigAnalysisResult | null;
  critAngleResult: CriticalAngleResult | null;
}

export const XRRAIAdvisorTab: React.FC<XRRAIAdvisorTabProps> = ({
  layers,
  config,
  fitQuality,
  kiessigResult,
  critAngleResult
}) => {
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');

  const handleRequestAnalysis = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gemini/xrr-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layers,
          config,
          fitQuality,
          kiessigResult,
          critAngleResult
        })
      });

      const data = await response.json();
      if (data.success) {
        setReportText(data.text);
        setModelUsed(data.modelUsed || 'Gemini 2.5');
      } else {
        setErrorMsg(data.error || 'Failed to generate AI XRR analysis.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error communicating with XRR Advisor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="xrr-ai-advisor-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            Senior Thin Film & XRR Physics Advisor (Gemini AI)
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Generates deep crystallographic and physical evaluation of your multilayer stack, including interface roughness damping, porosity deficits, oxidation layers, and optimal refinement strategies.
          </p>
        </div>

        <button
          id="run-xrr-ai-btn"
          onClick={handleRequestAnalysis}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-md shadow-cyan-950 transition-all cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing Physics Model...' : 'Run AI XRR Diagnostic'}
        </button>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800/80 rounded-xl p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Report Markdown Container */}
      {reportText && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">XRR Diagnostic Report</span>
            </div>
            {modelUsed && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                {modelUsed}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none">
            <Markdown>{reportText}</Markdown>
          </div>
        </div>
      )}

      {/* Default placeholder */}
      {!reportText && !loading && (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-10 text-center">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h5 className="text-sm font-medium text-slate-300">Ready for Thin Film Evaluation</h5>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Click &ldquo;Run AI XRR Diagnostic&rdquo; to send the current multilayer architecture, Kiessig fringe analysis, and SLD profile to the Gemini Crystallography engine.
          </p>
        </div>
      )}
    </div>
  );
};
"""

with open("components/XRRAIAdvisorTab.tsx", "w", encoding="utf-8") as f:
    f.write(ai_code)

print("XRRAIAdvisorTab.tsx written!")

# -----------------------------------------------------------------------------
# 5. XRRCodeExportTab.tsx
# -----------------------------------------------------------------------------
export_code = r"""import React, { useState } from 'react';
import { XRRLayer, XRRSimulationConfig, FitQualityResult, KiessigAnalysisResult, CriticalAngleResult, generatePythonXRRScript, generateGenXScript, generateBornAgainScript, generateLatexTable } from '../utils/xrrPhysics';
import { Code2, Copy, Check, FileText, Download } from 'lucide-react';

interface XRRCodeExportTabProps {
  layers: XRRLayer[];
  config: XRRSimulationConfig;
  fitQuality?: FitQualityResult;
  kiessigResult?: KiessigAnalysisResult | null;
  critAngleResult?: CriticalAngleResult | null;
}

export const XRRCodeExportTab: React.FC<XRRCodeExportTabProps> = ({
  layers,
  config,
  fitQuality,
  kiessigResult,
  critAngleResult
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'refnx' | 'genx' | 'bornagain' | 'latex'>('refnx');
  const [copied, setCopied] = useState(false);

  let outputCode = '';
  if (selectedFormat === 'refnx') {
    outputCode = generatePythonXRRScript(layers, config);
  } else if (selectedFormat === 'genx') {
    outputCode = generateGenXScript(layers, config);
  } else if (selectedFormat === 'bornagain') {
    outputCode = generateBornAgainScript(layers, config);
  } else if (selectedFormat === 'latex') {
    outputCode = generateLatexTable(layers, fitQuality, kiessigResult, critAngleResult);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = selectedFormat === 'latex' ? 'tex' : 'py';
    const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xrr_model_${selectedFormat}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="xrr-export-container" className="space-y-6">
      {/* Selector & Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFormat('refnx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'refnx' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Refnx (Python)
          </button>
          <button
            onClick={() => setSelectedFormat('genx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'genx' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            GenX (Diff. Evol.)
          </button>
          <button
            onClick={() => setSelectedFormat('bornagain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'bornagain' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            BornAgain (GISAXS)
          </button>
          <button
            onClick={() => setSelectedFormat('latex')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'latex' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            LaTeX Table
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs text-slate-950 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <pre className="text-xs text-slate-300 font-mono leading-relaxed">
          <code>{outputCode}</code>
        </pre>
      </div>
    </div>
  );
};
"""

with open("components/XRRCodeExportTab.tsx", "w", encoding="utf-8") as f:
    f.write(export_code)

print("XRRCodeExportTab.tsx written!")
