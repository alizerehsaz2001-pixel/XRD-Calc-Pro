import React, { useState, useEffect, useRef } from 'react';
import { parseDoubleVoigtInput, calculateDoubleVoigt } from '../utils/physics';
import { DoubleVoigtResult } from '../types';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend
} from 'recharts';
import {
  Activity,
  Atom,
  Copy,
  Database,
  FlaskConical,
  Layers,
  Ruler,
  Trash2,
  TrendingUp,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const XRAY_WAVELENGTHS = [
  { label: 'Cu Kα1', value: 1.54056 },
  { label: 'Cu Kα (avg)', value: 1.5418 },
  { label: 'Mo Kα1', value: 0.7093 },
  { label: 'Co Kα1', value: 1.78897 },
  { label: 'Fe Kα1', value: 1.93604 },
  { label: 'Cr Kα1', value: 2.2897 },
  { label: 'Ag Kα1', value: 0.55941 }
];

const DV_PRESETS = [
  {
    name: 'Nanocrystalline CeO2 Powder',
    wavelength: 1.54056,
    instFwhm: 0.05,
    data: "28.55, 0.32, 0.65, 1, 1, 1\n33.08, 0.35, 0.60, 2, 0, 0\n47.48, 0.42, 0.55, 2, 2, 0\n56.34, 0.48, 0.50, 3, 1, 1\n59.09, 0.51, 0.48, 2, 2, 2\n69.41, 0.58, 0.45, 4, 0, 0"
  },
  {
    name: 'Ball-Milled Nanostructured Ni',
    wavelength: 1.54056,
    instFwhm: 0.08,
    data: "44.51, 0.45, 0.70, 1, 1, 1\n51.85, 0.52, 0.62, 2, 0, 0\n76.37, 0.71, 0.52, 2, 2, 0\n92.94, 0.88, 0.45, 3, 1, 1\n98.44, 0.95, 0.42, 2, 2, 2"
  },
  {
    name: 'Sol-Gel TiO2 Anatase',
    wavelength: 1.54056,
    instFwhm: 0.06,
    data: "25.28, 0.38, 0.58, 1, 0, 1\n37.80, 0.42, 0.55, 0, 0, 4\n48.05, 0.49, 0.51, 2, 0, 0\n53.89, 0.54, 0.48, 1, 0, 5\n55.08, 0.56, 0.47, 2, 1, 1\n62.69, 0.62, 0.44, 2, 0, 4"
  }
];

export const DoubleVoigtModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [instFwhm, setInstFwhm] = useState<number>(0.06);
  const [inputData, setInputData] = useState<string>(DV_PRESETS[0].data);
  const [activePlotTab, setActivePlotTab] = useState<'cauchy' | 'gaussian'>('cauchy');

  const [result, setResult] = useState<DoubleVoigtResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_double_voigt_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [copiedNotification, setCopiedNotification] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const parsedPeaks = parseDoubleVoigtInput(inputData);
    if (parsedPeaks.length >= 2) {
      const computed = calculateDoubleVoigt(wavelength, instFwhm, parsedPeaks);
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_double_voigt_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
    isFirstRender.current = false;
  }, [wavelength, instFwhm, inputData]);

  const handleApplyPreset = (preset: typeof DV_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setInstFwhm(preset.instFwhm);
    setInputData(preset.data);
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Cauchy Line: } \\beta_C^*(s) &= \\frac{1}{D_V} + 2 e_C \\cdot s \\quad (m_C = ${result.cauchyFit.slope.toFixed(4)}, C_C = ${result.cauchyFit.intercept.toFixed(4)}, R^2 = ${result.cauchyFit.rSquared.toFixed(4)}) \\\\
\\text{Gaussian Line: } (\\beta_G^*(s))^2 &= \\left(\\frac{1}{\\pi D_G}\\right)^2 + 8\\pi e_G^2 \\cdot s^2 \\quad (m_G = ${result.gaussianFit.slope.toFixed(4)}, C_G = ${result.gaussianFit.intercept.toFixed(4)}, R^2 = ${result.gaussianFit.rSquared.toFixed(4)}) \\\\
D_V &= ${result.volumeSizeDvNm.toFixed(2)} \\text{ nm}, \\quad D_A = ${result.areaSizeDaNm.toFixed(2)} \\text{ nm} \\\\
e_C &= ${(result.cauchyStrainEc * 100).toFixed(4)}\\%, \\quad e_G = ${(result.gaussianStrainEg * 100).toFixed(4)}\\%, \\quad \\langle e^2 \\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\%
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Generate Cauchy chart data
  const cauchyChartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const xVals = result.points.map(p => p.s);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const pad = (maxX - minX) * 0.15 || 0.1;
    const startX = Math.max(0, minX - pad);
    const endX = maxX + pad;

    const points = result.points.map(p => ({
      x: p.s,
      y: p.betaCStar,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      singleDvNm: p.singleDvNm
    }));

    const line = [
      { x: startX, fitY: result.cauchyFit.slope * startX + result.cauchyFit.intercept },
      { x: endX, fitY: result.cauchyFit.slope * endX + result.cauchyFit.intercept }
    ];

    return { points, line };
  }, [result]);

  // Generate Gaussian chart data
  const gaussianChartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const xVals = result.points.map(p => p.s2);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const pad = (maxX - minX) * 0.15 || 0.01;
    const startX = Math.max(0, minX - pad);
    const endX = maxX + pad;

    const points = result.points.map(p => ({
      x: p.s2,
      y: p.betaGStarSq,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      betaGStar: p.betaGStar
    }));

    const line = [
      { x: startX, fitY: result.gaussianFit.slope * startX + result.gaussianFit.intercept },
      { x: endX, fitY: result.gaussianFit.slope * endX + result.gaussianFit.intercept }
    ];

    return { points, line };
  }, [result]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1428] via-[#08101F] to-[#040812] p-6 md:p-8 border border-indigo-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Advanced Convolution Profile Analysis • Langford Method</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Double-Voigt Method Module
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Langford&apos;s Double-Voigt method treats both crystallite size and microstrain broadening as Voigt functions possessing both Cauchy (C) and Gaussian (G) components. By deconvoluting the Voigt profile into reciprocal space coordinates s = 2sinθ / λ, it rigorously separates volume-weighted (D_V) and area-weighted (D_A) sizes from root-mean-square strains without simplifying profile shape assumptions.
            </p>
          </div>

          <div className="bg-[#050C17]/80 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/30 shadow-inner max-w-md w-full space-y-3">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">
                1. Cauchy Size &amp; Strain Relation
              </span>
              <div 
                className="text-white text-xs py-1.5 px-3 bg-black/40 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    '\\beta_C^*(s) = \\frac{1}{D_V} + 2 e_C \\cdot s',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
            </div>

            <div className="text-center space-y-1 pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest block">
                2. Gaussian Size &amp; Strain Relation
              </span>
              <div 
                className="text-purple-300 text-xs py-1.5 px-3 bg-black/40 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    '(\\beta_G^*(s))^2 = \\left(\\frac{1}{\\pi D_G}\\right)^2 + 8\\pi e_G^2 \\cdot s^2',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Experimental Presets */}
      <div className="bg-[#080E1A]/90 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <span>Experimental Sample Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DV_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Input Data */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instrument Settings Card */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Configuration</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">Setup</span>
            </div>

            {/* Wavelength Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                X-Ray Radiation Wavelength (λ) [Å]
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-[#050B14] text-indigo-300 border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50"
                >
                  {XRAY_WAVELENGTHS.map((w) => (
                    <option key={w.label} value={w.value}>
                      {w.label} ({w.value} Å)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.00001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value) || 1.54056)}
                  className="w-full px-3 py-2 bg-[#050B14] text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50"
                  placeholder="Custom Å"
                />
              </div>
            </div>

            {/* Instrumental FWHM */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Instrumental Broadening (FWHM_inst) [°2θ]
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={instFwhm}
                  onChange={(e) => setInstFwhm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#050B14] text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50"
                />
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">°2θ</span>
              </div>
            </div>
          </div>

          {/* Peak Data Input */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reflections Input</h3>
              </div>
              <button
                onClick={() => setInputData('')}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              Enter one peak per line: <code className="text-indigo-300 bg-black/40 px-1 py-0.5 rounded font-mono">2θ [deg], FWHM [deg], η [0..1], h, k, l</code>
            </p>

            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full p-3 bg-[#030710] text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 transition-all custom-scrollbar leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Key Results & Double-Voigt Plots */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Key Microstructural Results */}
          {result ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Volume-Weighted Size D_V */}
              <div className="bg-gradient-to-br from-[#0C1A32] to-[#071122] p-5 rounded-3xl border border-indigo-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.volumeSizeDvNm.toFixed(2)}
                  </span>
                  <span className="text-indigo-300 text-sm font-mono font-semibold">nm</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  Area Size D_A = {result.areaSizeDaNm.toFixed(2)} nm
                </p>
              </div>

              {/* Cauchy Strain e_C */}
              <div className="bg-gradient-to-br from-[#121632] to-[#0A0D22] p-5 rounded-3xl border border-purple-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cauchy Strain (e_C)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.cauchyStrainEc * 100).toFixed(4)}
                  </span>
                  <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  Gaussian e_G = {(result.gaussianStrainEg * 100).toFixed(4)}%
                </p>
              </div>

              {/* Root-Mean-Square Strain */}
              <div className="bg-gradient-to-br from-[#0B1E2E] to-[#05111C] p-5 rounded-3xl border border-cyan-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">RMS Strain ⟨e²⟩¹/²</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.rmsStrain * 100).toFixed(4)}
                  </span>
                  <span className="text-cyan-300 text-sm font-mono font-semibold">%</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  Fit R² = {(result.cauchyFit.rSquared * 100).toFixed(1)}% / {(result.gaussianFit.rSquared * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Peak Data</p>
              <p className="text-xs text-slate-400">Enter at least 2 valid peak profiles to execute Double-Voigt convolution analysis.</p>
            </div>
          )}

          {/* Double-Voigt Regression Plots */}
          {result && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePlotTab('cauchy')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePlotTab === 'cauchy'
                        ? 'bg-indigo-500 text-black shadow-md shadow-indigo-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Cauchy Plot: β_C* vs s
                  </button>
                  <button
                    onClick={() => setActivePlotTab('gaussian')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePlotTab === 'gaussian'
                        ? 'bg-purple-500 text-black shadow-md shadow-purple-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Gaussian Plot: (β_G*)² vs s²
                  </button>
                </div>

                <button
                  onClick={handleCopyLaTeX}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? 'Copied LaTeX!' : 'Copy LaTeX'}</span>
                </button>
              </div>

              {/* Cauchy Chart */}
              {activePlotTab === 'cauchy' && cauchyChartData && (
                <div className="h-72 sm:h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={['auto', 'auto']}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                        label={{
                          value: 'Scattering Vector s = 2 sin θ / λ [nm⁻¹]',
                          position: 'insideBottom',
                          offset: -15,
                          fill: '#818cf8',
                          fontSize: 12,
                          fontFamily: 'monospace'
                        }}
                      />
                      <YAxis
                        dataKey="y"
                        type="number"
                        domain={['auto', 'auto']}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                        label={{
                          value: 'Cauchy Breadth β_C* [nm⁻¹]',
                          angle: -90,
                          position: 'insideLeft',
                          offset: -10,
                          fill: '#818cf8',
                          fontSize: 12,
                          fontFamily: 'monospace'
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                <div className="text-indigo-400 font-bold border-b border-white/10 pb-1">
                                  {data.hkl ? `HKL: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                                </div>
                                <div>2θ: <span className="text-indigo-300">{data.twoTheta?.toFixed(2)}°</span></div>
                                <div>s: <span className="text-indigo-300">{data.x?.toFixed(4)} nm⁻¹</span></div>
                                <div>β_C*: <span className="text-indigo-300">{data.y?.toFixed(4)} nm⁻¹</span></div>
                                <div>Single D_V: <span className="text-emerald-400 font-bold">{data.singleDvNm?.toFixed(2)} nm</span></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                      <Line
                        data={cauchyChartData.line}
                        type="linear"
                        dataKey="fitY"
                        name={`Cauchy Fit: β_C* = ${result.cauchyFit.slope.toFixed(4)}s + ${result.cauchyFit.intercept.toFixed(4)}`}
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />

                      <Scatter
                        data={cauchyChartData.points}
                        name="Cauchy Components"
                        fill="#a5b4fc"
                        stroke="#6366f1"
                        strokeWidth={1.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gaussian Chart */}
              {activePlotTab === 'gaussian' && gaussianChartData && (
                <div className="h-72 sm:h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={['auto', 'auto']}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                        label={{
                          value: 's² [nm⁻²]',
                          position: 'insideBottom',
                          offset: -15,
                          fill: '#c084fc',
                          fontSize: 12,
                          fontFamily: 'monospace'
                        }}
                      />
                      <YAxis
                        dataKey="y"
                        type="number"
                        domain={['auto', 'auto']}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                        label={{
                          value: '(β_G*)² [nm⁻²]',
                          angle: -90,
                          position: 'insideLeft',
                          offset: -10,
                          fill: '#c084fc',
                          fontSize: 12,
                          fontFamily: 'monospace'
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#050C17]/95 border border-purple-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                <div className="text-purple-400 font-bold border-b border-white/10 pb-1">
                                  {data.hkl ? `HKL: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                                </div>
                                <div>2θ: <span className="text-purple-300">{data.twoTheta?.toFixed(2)}°</span></div>
                                <div>s²: <span className="text-purple-300">{data.x?.toFixed(4)} nm⁻²</span></div>
                                <div>(β_G*)²: <span className="text-purple-300">{data.y?.toFixed(5)} nm⁻²</span></div>
                                <div>β_G*: <span className="text-purple-300">{data.betaGStar?.toFixed(4)} nm⁻¹</span></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                      <Line
                        data={gaussianChartData.line}
                        type="linear"
                        dataKey="fitY"
                        name={`Gaussian Fit: (β_G*)² = ${result.gaussianFit.slope.toFixed(4)}s² + ${result.gaussianFit.intercept.toFixed(5)}`}
                        stroke="#c084fc"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />

                      <Scatter
                        data={gaussianChartData.points}
                        name="Gaussian Components"
                        fill="#e9d5ff"
                        stroke="#a855f7"
                        strokeWidth={1.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Reflection Parameters Table */}
          {result && result.points && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Double-Voigt Peak Deconvolution Summary
              </h3>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">2θ [°]</th>
                      <th className="py-2.5 px-3">hkl</th>
                      <th className="py-2.5 px-3">s [nm⁻¹]</th>
                      <th className="py-2.5 px-3">s² [nm⁻²]</th>
                      <th className="py-2.5 px-3 text-indigo-400">β_C* [nm⁻¹]</th>
                      <th className="py-2.5 px-3 text-purple-400">(β_G*)² [nm⁻²]</th>
                      <th className="py-2.5 px-3 text-emerald-400">Single D_V [nm]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {result.points.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 font-bold text-white">{p.twoTheta.toFixed(2)}</td>
                        <td className="py-2 px-3 text-indigo-300">{p.hkl ? `(${p.hkl.join('')})` : '-'}</td>
                        <td className="py-2 px-3 text-slate-300">{p.s.toFixed(4)}</td>
                        <td className="py-2 px-3 text-slate-400">{p.s2.toFixed(4)}</td>
                        <td className="py-2 px-3 text-indigo-300 font-bold">{p.betaCStar.toFixed(4)}</td>
                        <td className="py-2 px-3 text-purple-300 font-bold">{p.betaGStarSq.toFixed(5)}</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{p.singleDvNm.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
