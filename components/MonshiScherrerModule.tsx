import React, { useState, useEffect, useRef } from 'react';
import { parseScherrerInput, calculateMonshiScherrer } from '../utils/physics';
import { MonshiScherrerResult } from '../types';

const XRAY_WAVELENGTHS = [
  { label: 'Cu Kα1', value: 1.54056 },
  { label: 'Cu Kα (avg)', value: 1.5418 },
  { label: 'Mo Kα1', value: 0.7093 },
  { label: 'Co Kα1', value: 1.78897 },
  { label: 'Fe Kα1', value: 1.93604 },
  { label: 'Cr Kα1', value: 2.2897 },
  { label: 'Ag Kα1', value: 0.55941 }
];
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
  Info,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Ruler,
  ChevronDown,
  Check,
  Atom,
  Download,
  RefreshCw,
  Trash2,
  Database,
  FlaskConical,
  Activity,
  Layers,
  CheckCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles (FWHM-based)', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
];

const MS_PRESETS = [
  {
    name: 'ZnO Nanoparticles (Wurtzite)',
    wavelength: 1.54056,
    k: 0.9,
    instFwhm: 0.08,
    data: "31.77, 0.28, 1, 0, 0\n34.42, 0.30, 0, 0, 2\n36.25, 0.32, 1, 0, 1\n47.54, 0.38, 1, 0, 2\n56.60, 0.43, 1, 1, 0\n62.86, 0.48, 1, 0, 3\n67.96, 0.52, 1, 1, 2"
  },
  {
    name: 'TiO2 Anatase Nanocrystals',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.07,
    data: "25.28, 0.35, 1, 0, 1\n37.80, 0.39, 0, 0, 4\n48.05, 0.44, 2, 0, 0\n53.89, 0.48, 1, 0, 5\n55.08, 0.50, 2, 1, 1\n62.69, 0.56, 2, 0, 4"
  },
  {
    name: 'CeO2 Cubic Nanopowder',
    wavelength: 1.54056,
    k: 0.943,
    instFwhm: 0.06,
    data: "28.55, 0.24, 1, 1, 1\n33.08, 0.26, 2, 0, 0\n47.48, 0.31, 2, 2, 0\n56.34, 0.35, 3, 1, 1\n59.09, 0.37, 2, 2, 2\n69.41, 0.42, 4, 0, 0"
  },
  {
    name: 'Fe3O4 Magnetite Spinel',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.08,
    data: "30.10, 0.32, 2, 2, 0\n35.45, 0.34, 3, 1, 1\n43.08, 0.38, 4, 0, 0\n53.45, 0.43, 4, 2, 2\n56.96, 0.46, 5, 1, 1\n62.58, 0.50, 4, 4, 0"
  }
];

export const MonshiScherrerModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [instFwhm, setInstFwhm] = useState<number>(0.08);
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);

  const [inputData, setInputData] = useState<string>(MS_PRESETS[0].data);
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian'>('Gaussian');
  
  const [result, setResult] = useState<MonshiScherrerResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_monshi_scherrer_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const isFirstRender = useRef(true);

  // Recalculate Monshi-Scherrer results whenever parameters or data change
  useEffect(() => {
    const parsedPeaks = parseScherrerInput(inputData);
    if (parsedPeaks.length >= 2) {
      const computed = calculateMonshiScherrer(
        wavelength,
        constantK,
        instFwhm,
        parsedPeaks,
        broadeningModel,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_monshi_scherrer_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
    isFirstRender.current = false;
  }, [wavelength, constantK, instFwhm, inputData, broadeningModel, instrumentalMode, cagliotiU, cagliotiV, cagliotiW]);

  const handleApplyPreset = (preset: typeof MS_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setConstantK(preset.k);
    setInstFwhm(preset.instFwhm);
    setInputData(preset.data);
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{equation}
\\ln(\\beta) = \\ln\\left(\\frac{K\\lambda}{D}\\right) + \\ln\\left(\\frac{1}{\\cos\\theta}\\right)
\\end{equation}
\\text{Slope } m = ${result.slope.toFixed(4)}, \\quad \\text{Intercept } C = ${result.intercept.toFixed(4)}, \\quad R^2 = ${result.rSquared.toFixed(4)}
\\quad D_{\\text{Monshi-Scherrer}} = ${result.sizeNm.toFixed(2)} \\text{ nm}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Generate chart regression points
  const chartData = React.useMemo<{
    points: Array<{
      x: number;
      y: number;
      twoTheta: number;
      hkl?: string;
      singleSize: number;
      fwhmObs: number;
      fwhmInst: number;
      betaCorrectedDeg: number;
    }>;
    line: Array<{
      x: number;
      fitY: number;
    }>;
  } | null>(() => {
    if (!result || result.points.length < 2) return null;

    const xVals = result.points.map(p => p.x);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const padding = (maxX - minX) * 0.15 || 0.1;

    const startX = Math.max(0, minX - padding);
    const endX = maxX + padding;

    const pointsMap = result.pointsExtended?.map(p => ({
      x: p.x,
      y: p.y,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      singleSize: p.singlePeakSizeNm,
      fwhmObs: p.fwhmObs,
      fwhmInst: p.fwhmInst,
      betaCorrectedDeg: p.betaCorrectedDeg
    })) || [];

    // Line points
    const linePoint1 = {
      x: startX,
      fitY: result.slope * startX + result.intercept
    };
    const linePoint2 = {
      x: endX,
      fitY: result.slope * endX + result.intercept
    };

    return {
      points: pointsMap,
      line: [linePoint1, linePoint2]
    };
  }, [result]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#08101E] to-[#040811] p-6 md:p-8 border border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Logarithmic XRD Size Analysis • Monshi-Scherrer Method</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Monshi-Scherrer Scheme Module
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              A high-precision modified Scherrer logarithmic method introduced by Monshi et al. (2012). By transforming the classical Scherrer equation into a logarithmic linear plot $\ln(\beta) = \ln(K\lambda/D) + \ln(1/\cos\theta)$, it eliminates zero-intercept division errors and provides a highly stable nanocrystallite size estimate.
            </p>
          </div>

          <div className="bg-[#050C17]/80 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 shadow-inner max-w-md w-full space-y-3">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                1. Governing Linear Equation
              </span>
              <div 
                className="text-white text-sm py-1.5 px-3 bg-black/40 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    '\\ln(\\beta) = \\ln\\left(\\frac{K \\cdot \\lambda}{D}\\right) + \\ln\\left(\\frac{1}{\\cos\\theta}\\right)',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
            </div>

            <div className="text-center space-y-1 pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">
                2. Nanocrystallite Size Extraction ($D$)
              </span>
              <div 
                className="text-emerald-300 text-sm py-1.5 px-3 bg-black/40 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    'D = \\frac{K \\cdot \\lambda}{\\exp(C)} = K \\cdot \\lambda \\cdot e^{-C}',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Where Intercept C = ln(K·λ / D), Slope m ≈ 1.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#080E1A]/90 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <span>Experimental Sample Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MS_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Control Panel & Inputs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instrument & Physical Settings Card */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Parameters & Physics</h3>
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
                  className="w-full px-3 py-2 bg-[#050B14] text-cyan-300 border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/50"
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
                  className="w-full px-3 py-2 bg-[#050B14] text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/50"
                  placeholder="Custom Å"
                />
              </div>
            </div>

            {/* Shape Factor K */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Crystallite Shape Factor (K)
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                  {constantK}
                </span>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                  className="w-full px-3 py-2 bg-[#050B14] text-left border border-white/10 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-between hover:border-cyan-500/30 transition-colors"
                >
                  <span>{K_FACTORS.find(k => k.value === constantK)?.label || 'Custom Factor'} ({constantK})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <AnimatePresence>
                  {isKTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-30 left-0 right-0 mt-1 bg-[#091222] border border-cyan-500/30 rounded-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto"
                    >
                      {K_FACTORS.map((k) => (
                        <button
                          key={k.label}
                          onClick={() => {
                            setConstantK(k.value);
                            setIsKTypeMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-start gap-2 ${
                            constantK === k.value
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <span className="text-base">{k.icon}</span>
                          <div>
                            <div className="font-bold">{k.label} (K = {k.value})</div>
                            <div className="text-[10px] text-slate-400 leading-tight">{k.desc}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Instrumental Broadening Mode */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Instrumental Broadening (β_inst)
                </label>
                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                  <button
                    onClick={() => setInstrumentalMode('constant')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      instrumentalMode === 'constant' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Constant
                  </button>
                  <button
                    onClick={() => setInstrumentalMode('caglioti')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      instrumentalMode === 'caglioti' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Caglioti
                  </button>
                </div>
              </div>

              {instrumentalMode === 'constant' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={instFwhm}
                    onChange={(e) => setInstFwhm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#050B14] text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/50"
                  />
                  <span className="text-xs text-slate-400 font-mono whitespace-nowrap">°2θ FWHM</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-mono mb-1">U (tan²θ)</span>
                    <input
                      type="number"
                      step="0.001"
                      value={cagliotiU}
                      onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[#050B14] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-mono mb-1">V (tanθ)</span>
                    <input
                      type="number"
                      step="0.001"
                      value={cagliotiV}
                      onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[#050B14] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-mono mb-1">W (const)</span>
                    <input
                      type="number"
                      step="0.001"
                      value={cagliotiW}
                      onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[#050B14] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Profile Deconvolution Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Peak Broadening Profile Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBroadeningModel('Gaussian')}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                    broadeningModel === 'Gaussian'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-[#050B14] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Gaussian (β² = βₒ² - βᵢ²)
                </button>
                <button
                  onClick={() => setBroadeningModel('Lorentzian')}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                    broadeningModel === 'Lorentzian'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-[#050B14] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Lorentzian (β = βₒ - βᵢ)
                </button>
              </div>
            </div>
          </div>

          {/* Peak Input Data Area */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Diffraction Peaks Input</h3>
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
              Enter one peak per line: <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">2θ [deg], FWHM [deg], h, k, l</code>
            </p>

            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full p-3 bg-[#030710] text-cyan-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 transition-all custom-scrollbar leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Calculations & Monshi-Scherrer Plot */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Key Metrics Overview */}
          {result ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Crystallite Size Card */}
              <div className="bg-gradient-to-br from-[#0B1A30] to-[#061020] p-5 rounded-3xl border border-cyan-500/30 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Crystallite Size (D)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.sizeNm.toFixed(2)}
                  </span>
                  <span className="text-cyan-300 text-sm font-mono font-semibold">nm</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  = {(result.sizeNm * 10).toFixed(1)} Å ({ (result.sizeNm >= 100 ? 'Microcrystalline' : 'Nanocrystalline') })
                </p>
              </div>

              {/* Slope (m) Card */}
              <div className="bg-gradient-to-br from-[#0D182A] to-[#07101E] p-5 rounded-3xl border border-blue-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Slope (m)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.slope.toFixed(4)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-2 font-mono leading-tight">
                  {Math.abs(result.slope - 1) <= 0.15 ? 'Ideal Size Broadening' : result.slope > 1 ? 'Microstrain Effect' : 'Defect/Over-subtraction'}
                </p>
              </div>

              {/* Fit Quality (R²) Card */}
              <div className="bg-gradient-to-br from-[#0B1A30] to-[#061020] p-5 rounded-3xl border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fit Quality (R²)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.rSquared * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  Intercept $C = {result.intercept.toFixed(4)}$
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Valid Peaks</p>
              <p className="text-xs text-slate-400">Provide at least 2 valid diffraction peaks with FWHM &gt; Instrumental Broadening.</p>
            </div>
          )}

          {/* Interactive Monshi-Scherrer Plot */}
          {result && chartData && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Monshi-Scherrer Logarithmic Regression Plot
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Y = ln(β) vs X = ln(1 / cos θ)
                  </p>
                </div>

                <button
                  onClick={handleCopyLaTeX}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? 'Copied LaTeX!' : 'Copy LaTeX'}</span>
                </button>
              </div>

              {/* Chart Container */}
              <div className="h-72 sm:h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    margin={{ top: 15, right: 25, bottom: 25, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={['auto', 'auto']}
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      label={{
                        value: 'X = ln(1 / cos θ)',
                        position: 'insideBottom',
                        offset: -15,
                        fill: '#22d3ee',
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
                        value: 'Y = ln(β_sample [rad])',
                        angle: -90,
                        position: 'insideLeft',
                        offset: -10,
                        fill: '#22d3ee',
                        fontSize: 12,
                        fontFamily: 'monospace'
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#050C17]/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                              <div className="text-cyan-400 font-bold border-b border-white/10 pb-1">
                                {data.hkl ? `HKL: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                              </div>
                              <div>2θ: <span className="text-cyan-300">{data.twoTheta?.toFixed(2)}°</span></div>
                              <div>X = ln(1/cosθ): <span className="text-cyan-300">{data.x?.toFixed(4)}</span></div>
                              <div>Y = ln(β): <span className="text-cyan-300">{data.y?.toFixed(4)}</span></div>
                              <div>Single Peak Size: <span className="text-emerald-400 font-bold">{data.singleSize?.toFixed(2)} nm</span></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                    {/* Linear Regression Line */}
                    <Line
                      data={chartData.line}
                      type="linear"
                      dataKey="fitY"
                      name={`Fit: Y = ${result.slope.toFixed(3)}X + (${result.intercept.toFixed(3)})`}
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />

                    {/* Experimental Points */}
                    <Scatter
                      data={chartData.points}
                      name="Observed XRD Reflections"
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth={1.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Scientific Commentary */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl text-xs text-cyan-200 leading-relaxed font-mono">
                <span className="font-bold text-cyan-300 block mb-1">Scientific Commentary on Monshi-Scherrer Fit:</span>
                {result.slopeInterpretation}
              </div>
            </div>
          )}

          {/* Extended Calculations Table */}
          {result && result.pointsExtended && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Reflections Deconvolution &amp; Single-Peak Comparison
              </h3>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-3">2θ [°]</th>
                      <th className="py-2.5 px-3">hkl</th>
                      <th className="py-2.5 px-3">FWHM_obs [°]</th>
                      <th className="py-2.5 px-3">FWHM_inst [°]</th>
                      <th className="py-2.5 px-3">β_sample [rad]</th>
                      <th className="py-2.5 px-3 text-cyan-400">X = ln(1/cosθ)</th>
                      <th className="py-2.5 px-3 text-cyan-400">Y = ln(β)</th>
                      <th className="py-2.5 px-3 text-emerald-400">Single D [nm]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {result.pointsExtended.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 font-bold text-white">{p.twoTheta.toFixed(2)}</td>
                        <td className="py-2 px-3 text-cyan-300">{p.hkl ? `(${p.hkl.join('')})` : '-'}</td>
                        <td className="py-2 px-3">{p.fwhmObs.toFixed(3)}</td>
                        <td className="py-2 px-3 text-slate-400">{p.fwhmInst.toFixed(3)}</td>
                        <td className="py-2 px-3">{p.betaCorrectedRad.toFixed(5)}</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">{p.x.toFixed(4)}</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">{p.y.toFixed(4)}</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{p.singlePeakSizeNm.toFixed(2)}</td>
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
