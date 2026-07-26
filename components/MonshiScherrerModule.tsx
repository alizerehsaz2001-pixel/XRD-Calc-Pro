import React, { useState, useEffect, useRef } from 'react';
import { parseScherrerInput, calculateMonshiScherrer } from '../utils/physics';
import { MonshiScherrerResult } from '../types';
import {
  ComposedChart,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Info,
  AlertTriangle,
  TrendingUp,
  Ruler,
  ChevronDown,
  Atom,
  Download,
  Trash2,
  Database,
  FlaskConical,
  Activity,
  Layers,
  CheckCircle,
  Copy,
  Sparkles,
  BarChart2,
  Sliders,
  Award,
  Zap,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    data: "31.77, 0.28, 1, 0, 0\n34.42, 0.30, 0, 0, 2\n36.25, 0.32, 1, 0, 1\n47.54, 0.38, 1, 0, 2\n56.60, 0.43, 1, 1, 0\n62.86, 0.48, 1, 0, 3\n67.96, 0.52, 1, 1, 2",
    desc: 'Hexagonal wurtzite nanoparticles exhibiting isotropic size broadening.'
  },
  {
    name: 'TiO2 Anatase Nanocrystals',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.07,
    data: "25.28, 0.35, 1, 0, 1\n37.80, 0.39, 0, 0, 4\n48.05, 0.44, 2, 0, 0\n53.89, 0.48, 1, 0, 5\n55.08, 0.50, 2, 1, 1\n62.69, 0.56, 2, 0, 4",
    desc: 'Tetragonal Anatase TiO2 nanocrystallites evaluated by logarithmic transformation.'
  },
  {
    name: 'CeO2 Cubic Nanopowder',
    wavelength: 1.54056,
    k: 0.943,
    instFwhm: 0.06,
    data: "28.55, 0.24, 1, 1, 1\n33.08, 0.26, 2, 0, 0\n47.48, 0.31, 2, 2, 0\n56.34, 0.35, 3, 1, 1\n59.09, 0.37, 2, 2, 2\n69.41, 0.42, 4, 0, 0",
    desc: 'Fluorite cubic structure showing tight logarithmic fit along {hkl} directions.'
  },
  {
    name: 'Fe3O4 Magnetite Spinel',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.08,
    data: "30.10, 0.32, 2, 2, 0\n35.45, 0.34, 3, 1, 1\n43.08, 0.38, 4, 0, 0\n53.45, 0.43, 4, 2, 2\n56.96, 0.46, 5, 1, 1\n62.58, 0.50, 4, 4, 0",
    desc: 'Spinel ferrite nanoparticles with slight higher-angle strain broadening.'
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
  const [activeTab, setActiveTab] = useState<'logPlot' | 'comparison' | 'residuals' | 'spectrum'>('logPlot');
  
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
    const latex = `\\begin{align*}
\\text{Governing Equation: } \\ln(\\beta) &= \\ln\\left(\\frac{K\\lambda}{D}\\right) + \\ln\\left(\\frac{1}{\\cos\\theta}\\right) \\\\
\\text{Slope } m &= ${result.slope.toFixed(4)}, \\quad \\text{Intercept } C = ${result.intercept.toFixed(4)}, \\quad R^2 = ${(result.rSquared * 100).toFixed(2)}\\% \\\\
\\text{Monshi-Scherrer Size } D &= ${result.sizeNm.toFixed(2)} \\text{ nm} \\quad (${(result.sizeNm * 10).toFixed(1)} \\text{ \\AA})
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result || !result.pointsExtended) return;
    let csv = "2Theta (deg),hkl,FWHM_obs (deg),FWHM_inst (deg),beta_sample (rad),X=ln(1/cos theta),Y=ln(beta_sample),Single Peak D (nm),Fitted Y,Residual Y\n";
    result.pointsExtended.forEach(p => {
      const hklStr = p.hkl ? `"${p.hkl.join('')}"` : '""';
      const fittedY = result.slope * p.x + result.intercept;
      const residual = p.y - fittedY;
      csv += `${p.twoTheta},${hklStr},${p.fwhmObs},${p.fwhmInst.toFixed(4)},${p.betaCorrectedRad.toFixed(6)},${p.x.toFixed(6)},${p.y.toFixed(6)},${p.singlePeakSizeNm.toFixed(4)},${fittedY.toFixed(6)},${residual.toFixed(6)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monshi_Scherrer_Analysis_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate chart regression points for Tab 1 (Log Plot)
  const chartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;

    const xVals = result.points.map(p => p.x);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const padding = (maxX - minX) * 0.18 || 0.05;

    const startX = Math.max(0, minX - padding);
    const endX = maxX + padding;

    const pointsMap = result.pointsExtended?.map(p => {
      const fittedY = result.slope * p.x + result.intercept;
      const idealY = 1.0 * p.x + result.intercept; // Ideal slope m=1
      return {
        x: p.x,
        y: p.y,
        fittedY,
        idealY,
        residual: p.y - fittedY,
        twoTheta: p.twoTheta,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        singleSize: p.singlePeakSizeNm,
        fwhmObs: p.fwhmObs,
        fwhmInst: p.fwhmInst,
        betaCorrectedDeg: p.betaCorrectedDeg
      };
    }) || [];

    // Line points for Monshi fit line (m * X + C)
    const linePoint1 = { x: startX, fitY: result.slope * startX + result.intercept, idealY: 1.0 * startX + result.intercept };
    const linePoint2 = { x: endX, fitY: result.slope * endX + result.intercept, idealY: 1.0 * endX + result.intercept };

    return {
      points: pointsMap,
      line: [linePoint1, linePoint2],
      startX,
      endX
    };
  }, [result]);

  // Single-Peak Size Comparison Data for Tab 2
  const singlePeakComparisonData = React.useMemo(() => {
    if (!result || !result.pointsExtended) return [];
    return result.pointsExtended.map(p => ({
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      singleSize: p.singlePeakSizeNm,
      monshiSize: result.sizeNm,
      diff: p.singlePeakSizeNm - result.sizeNm
    }));
  }, [result]);

  // Mean single peak size calculation
  const meanSinglePeakSize = React.useMemo(() => {
    if (!result || !result.pointsExtended || result.pointsExtended.length === 0) return 0;
    const sum = result.pointsExtended.reduce((acc, p) => acc + p.singlePeakSizeNm, 0);
    return sum / result.pointsExtended.length;
  }, [result]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#08101E] to-[#040811] p-6 md:p-8 border border-cyan-500/20 shadow-[0_12px_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Modified Scherrer Logarithmic Transformation • Monshi et al. (2012) Method</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Monshi-Scherrer Scheme
              <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                Logarithmic Fit
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              A robust modified Scherrer method formulated by Monshi et al. (2012). By taking the natural logarithm of both sides of Scherrer&apos;s equation $\ln(\beta) = \ln(K\lambda/D) + \ln(1/\cos\theta)$, it avoids low-angle division errors, provides equal statistical weighting across all reflections, and reveals strain or defect contributions from the linear slope $m$.
            </p>
          </div>

          <div className="bg-[#050C17]/85 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 shadow-inner max-w-md w-full space-y-3">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                1. Governing Linear Logarithmic Equation
              </span>
              <div 
                className="text-white text-xs py-1.5 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto"
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
                2. Crystallite Size Extraction ($D$)
              </span>
              <div 
                className="text-emerald-300 text-xs py-1.5 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    'D = \\frac{K \\cdot \\lambda}{\\exp(C)} = K \\cdot \\lambda \\cdot e^{-C}',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Where Intercept C = ln(K·λ / D), Slope m ≈ 1.0 (Ideal)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#080E1A]/90 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <span>Curated Experimental Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MS_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{p.name}</span>
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
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Setup
              </span>
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
                <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  K = {constantK}
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
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 bg-white/5 rounded-lg"
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

            {/* Input Peak Counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Parsed reflections: <strong className="text-cyan-300">{result?.points?.length || 0}</strong></span>
              {result && result.points.length >= 2 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready for logarithmic regression
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Minimum 2 reflections required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Interactive Visualizers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Key Metrics Overview */}
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              
              {/* Monshi-Scherrer Crystallite Size D */}
              <div className="bg-gradient-to-br from-[#0B1A30] to-[#061020] p-5 rounded-3xl border border-cyan-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Ruler className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Monshi Size (D)</span>
                  </div>
                  <Award className="w-4 h-4 text-cyan-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.sizeNm.toFixed(2)}
                  </span>
                  <span className="text-cyan-300 text-sm font-mono font-semibold">nm</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Length: <span className="text-slate-200 font-bold">{(result.sizeNm * 10).toFixed(1)} Å</span></div>
                  <div>Mean Single-Peak: <span className="text-slate-200 font-bold">{meanSinglePeakSize.toFixed(2)} nm</span></div>
                </div>
              </div>

              {/* Logarithmic Slope m */}
              <div className="bg-gradient-to-br from-[#0D182A] to-[#07101E] p-5 rounded-3xl border border-blue-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Log Slope (m)</span>
                  </div>
                  <Activity className="w-4 h-4 text-blue-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.slope.toFixed(4)}
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Ideal Slope: <span className="text-blue-300 font-bold">1.0000</span></div>
                  <div>Dev Status: <span className="text-slate-200 font-bold">
                    {Math.abs(result.slope - 1) <= 0.15 ? 'Isotropic Size' : result.slope > 1 ? 'Microstrain' : 'Defect/Over-sub'}
                  </span></div>
                </div>
              </div>

              {/* Fit Quality R² */}
              <div className="bg-gradient-to-br from-[#0B1A30] to-[#061020] p-5 rounded-3xl border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Fit Quality (R²)</span>
                  </div>
                  <Layers className="w-4 h-4 text-emerald-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.rSquared * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Intercept C: <span className="text-emerald-300 font-bold">{result.intercept.toFixed(4)}</span></div>
                  <div>exp(C): <span className="text-slate-200 font-bold">{Math.exp(result.intercept).toFixed(4)}</span></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Peak Data</p>
              <p className="text-xs text-slate-400">Provide at least 2 valid diffraction peaks to construct Monshi-Scherrer regression.</p>
            </div>
          )}

          {/* Interactive Plot Tabs & Visualization Container */}
          {result && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
              
              {/* Tab Selector Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('logPlot')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'logPlot'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Monshi Log Regression
                  </button>

                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'comparison'
                        ? 'bg-blue-500 text-black shadow-md shadow-blue-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Single-Peak vs Monshi Size
                  </button>

                  <button
                    onClick={() => setActiveTab('residuals')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'residuals'
                        ? 'bg-purple-500 text-black shadow-md shadow-purple-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    3. Residual Analysis
                  </button>

                  <button
                    onClick={() => setActiveTab('spectrum')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'spectrum'
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    4. Size Distribution Spectrum
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCSV}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1 transition-all"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  <button
                    onClick={handleCopyLaTeX}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? 'Copied LaTeX!' : 'LaTeX'}</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Log Plot */}
              {activeTab === 'logPlot' && chartData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Logarithmic Fit: <strong className="text-cyan-400">ln(β) = {result.slope.toFixed(4)} · ln(1/cos θ) + {result.intercept.toFixed(4)}</strong></span>
                    <span className="text-slate-400">R²: <strong className="text-emerald-400">{(result.rSquared * 100).toFixed(2)}%</strong></span>
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="x"
                          type="number"
                          domain={[chartData.startX, chartData.endX]}
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
                                    {data.hkl ? `Reflection: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                                  </div>
                                  <div>2θ: <span className="text-cyan-300">{data.twoTheta?.toFixed(2)}°</span></div>
                                  <div>X = ln(1/cosθ): <span className="text-cyan-300">{data.x?.toFixed(4)}</span></div>
                                  <div>Y = ln(β): <span className="text-cyan-300">{data.y?.toFixed(4)}</span></div>
                                  <div>Single-Peak D: <span className="text-emerald-400 font-bold">{data.singleSize?.toFixed(2)} nm</span></div>
                                  <div>Residual ΔY: <span className="text-purple-300 font-mono">{data.residual?.toFixed(5)}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        {/* Monshi Regression Fit Line */}
                        <Line
                          data={chartData.line}
                          type="linear"
                          dataKey="fitY"
                          name={`Monshi Fit: Y = ${result.slope.toFixed(3)}X + (${result.intercept.toFixed(3)})`}
                          stroke="#22d3ee"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />

                        {/* Reference Line for Ideal Slope m=1.0 */}
                        <Line
                          data={chartData.line}
                          type="linear"
                          dataKey="idealY"
                          name="Ideal Size Broadening (m = 1.0)"
                          stroke="#a855f7"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                          activeDot={false}
                        />

                        {/* Measured Experimental Points */}
                        <Scatter
                          data={chartData.points}
                          name="Observed Reflections"
                          fill="#38bdf8"
                          stroke="#0284c7"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl text-xs text-cyan-200 leading-relaxed font-mono">
                    <span className="font-bold text-cyan-300 block mb-1">Scientific Commentary on Monshi-Scherrer Fit:</span>
                    {result.slopeInterpretation}
                  </div>
                </div>
              )}

              {/* Tab 2: Single Peak vs Monshi Consensus Size Comparison */}
              {activeTab === 'comparison' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Individual Reflection Sizes D_hkl vs Consensus Monshi Size D = <strong className="text-emerald-400">{result.sizeNm.toFixed(2)} nm</strong></span>
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={singlePeakComparisonData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="hkl"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Diffraction Reflection {hkl}',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#3b82f6',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Crystallite Size [nm]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#3b82f6',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-blue-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-blue-400 font-bold border-b border-white/10 pb-1">
                                    Reflection: {d.hkl} (2θ = {d.twoTheta}°)
                                  </div>
                                  <div>Single Peak D: <span className="text-white font-bold">{d.singleSize.toFixed(2)} nm</span></div>
                                  <div>Monshi Consensus D: <span className="text-emerald-400 font-bold">{d.monshiSize.toFixed(2)} nm</span></div>
                                  <div>Deviation ΔD: <span className="text-cyan-300">{d.diff > 0 ? `+${d.diff.toFixed(2)}` : d.diff.toFixed(2)} nm</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        {/* Monshi Consensus Reference Line */}
                        <ReferenceLine 
                          y={result.sizeNm} 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="4 4" 
                          label={{ value: `Monshi D = ${result.sizeNm.toFixed(2)} nm`, fill: "#10b981", fontSize: 11, position: "top" }} 
                        />

                        <Scatter
                          dataKey="singleSize"
                          name="Single-Peak Scherrer Sizes D_hkl"
                          fill="#60a5fa"
                          stroke="#2563eb"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 3: Residual Analysis Plot */}
              {activeTab === 'residuals' && chartData && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-300">
                    Linear Log Regression Residuals ΔY = ln(β_obs) - ln(β_fit):
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.points} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="hkl"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Reflection {hkl}',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#c084fc',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Residual ΔY [rad]',
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
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-purple-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-purple-400 font-bold border-b border-white/10 pb-1">
                                    Reflection: {d.hkl}
                                  </div>
                                  <div>2θ: <span className="text-slate-300">{d.twoTheta}°</span></div>
                                  <div>Residual ΔY: <span className="text-purple-300 font-bold">{d.residual?.toFixed(5)}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={0} stroke="#a855f7" strokeWidth={1.5} />
                        <Bar dataKey="residual" name="Fit Residual ΔY">
                          {chartData.points.map((p, idx) => (
                            <Cell key={idx} fill={p.residual >= 0 ? '#c084fc' : '#e879f9'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 4: Size Distribution Spectrum */}
              {activeTab === 'spectrum' && singlePeakComparisonData && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-300">
                    Crystallite Size Spectrum across indexed reflections:
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={singlePeakComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis 
                          dataKey="hkl" 
                          stroke="#94a3b8" 
                          tick={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Single Peak Size [nm]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#10b981',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-emerald-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-emerald-400 font-bold border-b border-white/10 pb-1">
                                    {d.hkl} (2θ = {d.twoTheta}°)
                                  </div>
                                  <div>Calculated Size: <span className="text-white font-bold">{d.singleSize.toFixed(2)} nm</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={result.sizeNm} stroke="#10b981" strokeDasharray="3 3" label={{ value: `Monshi D = ${result.sizeNm.toFixed(2)} nm`, fill: "#10b981", fontSize: 11 }} />
                        <Bar dataKey="singleSize" name="Single Peak Size D_hkl" fill="#34d399" radius={[8, 8, 0, 0]}>
                          {singlePeakComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.singleSize >= result.sizeNm ? '#34d399' : '#059669'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

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
