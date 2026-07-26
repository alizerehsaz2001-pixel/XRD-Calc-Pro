import React, { useState, useEffect, useRef } from 'react';
import { parseDoubleVoigtInput, calculateDoubleVoigt } from '../utils/physics';
import { DoubleVoigtResult } from '../types';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
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
  HelpCircle,
  Download,
  Info,
  Sparkles,
  BarChart2,
  Sliders,
  Maximize2,
  RefreshCw,
  Zap,
  AlertTriangle,
  Award
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

const DV_PRESETS = [
  {
    name: 'Nanocrystalline CeO2 Powder',
    wavelength: 1.54056,
    instFwhm: 0.05,
    data: "28.55, 0.32, 0.65, 1, 1, 1\n33.08, 0.35, 0.60, 2, 0, 0\n47.48, 0.42, 0.55, 2, 2, 0\n56.34, 0.48, 0.50, 3, 1, 1\n59.09, 0.51, 0.48, 2, 2, 2\n69.41, 0.58, 0.45, 4, 0, 0",
    desc: 'Cubic fluorite structure exhibiting mixed size and microstrain broadening.'
  },
  {
    name: 'Ball-Milled Nanostructured Ni',
    wavelength: 1.54056,
    instFwhm: 0.08,
    data: "44.51, 0.45, 0.70, 1, 1, 1\n51.85, 0.52, 0.62, 2, 0, 0\n76.37, 0.71, 0.52, 2, 2, 0\n92.94, 0.88, 0.45, 3, 1, 1\n98.44, 0.95, 0.42, 2, 2, 2",
    desc: 'Heavy plastic deformation leading to substantial dislocation density and strain.'
  },
  {
    name: 'Sol-Gel TiO2 Anatase',
    wavelength: 1.54056,
    instFwhm: 0.06,
    data: "25.28, 0.38, 0.58, 1, 0, 1\n37.80, 0.42, 0.55, 0, 0, 4\n48.05, 0.49, 0.51, 2, 0, 0\n53.89, 0.54, 0.48, 1, 0, 5\n55.08, 0.56, 0.47, 2, 1, 1\n62.69, 0.62, 0.44, 2, 0, 4",
    desc: 'Tetragonal nanocrystals with anisotropic crystallite growth.'
  },
  {
    name: 'ZnO Wurtzite Nanorods',
    wavelength: 1.54056,
    instFwhm: 0.07,
    data: "31.77, 0.30, 0.62, 1, 0, 0\n34.42, 0.28, 0.68, 0, 0, 2\n36.25, 0.33, 0.60, 1, 0, 1\n47.54, 0.40, 0.54, 1, 0, 2\n56.60, 0.45, 0.51, 1, 1, 0\n62.86, 0.50, 0.48, 1, 0, 3",
    desc: 'Hexagonal wurtzite nanoparticles showing c-axis elongated morphology.'
  }
];

export const DoubleVoigtModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [instFwhm, setInstFwhm] = useState<number>(0.06);
  const [inputData, setInputData] = useState<string>(DV_PRESETS[0].data);
  const [activePlotTab, setActivePlotTab] = useState<'cauchy' | 'gaussian' | 'profile' | 'summary'>('cauchy');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);

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
    setSelectedPeakIdx(0);
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Cauchy Line: } \\beta_C^*(s) &= \\frac{1}{D_V} + 2 e_C \\cdot s \\quad (m_C = ${result.cauchyFit.slope.toFixed(4)}, C_C = ${result.cauchyFit.intercept.toFixed(4)}, R^2 = ${result.cauchyFit.rSquared.toFixed(4)}) \\\\
\\text{Gaussian Line: } (\\beta_G^*(s))^2 &= \\left(\\frac{1}{\\pi D_G}\\right)^2 + 8\\pi e_G^2 \\cdot s^2 \\quad (m_G = ${result.gaussianFit.slope.toFixed(4)}, C_G = ${result.gaussianFit.intercept.toFixed(4)}, R^2 = ${result.gaussianFit.rSquared.toFixed(4)}) \\\\
D_V &= ${result.volumeSizeDvNm.toFixed(2)} \\text{ nm}, \\quad D_A = ${result.areaSizeDaNm.toFixed(2)} \\text{ nm}, \\quad D_G = ${result.gaussianSizeDgNm.toFixed(2)} \\text{ nm} \\\\
e_C &= ${(result.cauchyStrainEc * 100).toFixed(4)}\\%, \\quad e_G = ${(result.gaussianStrainEg * 100).toFixed(4)}\\%, \\quad \\langle e^2 \\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\%
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result || !result.points) return;
    let csv = "2Theta (deg),hkl,s (nm^-1),s^2 (nm^-2),beta_C* (nm^-1),(beta_G*)^2 (nm^-2),Single D_V (nm)\n";
    result.points.forEach(p => {
      const hklStr = p.hkl ? `"${p.hkl.join('')}"` : '""';
      csv += `${p.twoTheta},${hklStr},${p.s.toFixed(6)},${p.s2.toFixed(6)},${p.betaCStar.toFixed(6)},${p.betaGStarSq.toFixed(6)},${p.singleDvNm.toFixed(4)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Double_Voigt_Analysis_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Cauchy chart data
  const cauchyChartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const xVals = result.points.map(p => p.s);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const pad = (maxX - minX) * 0.15 || 0.1;
    const startX = 0; // Show intercept clearly at s = 0
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

    return { points, line, startX, endX };
  }, [result]);

  // Generate Gaussian chart data
  const gaussianChartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const xVals = result.points.map(p => p.s2);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const pad = (maxX - minX) * 0.15 || 0.01;
    const startX = 0; // Show intercept clearly at s^2 = 0
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

    return { points, line, startX, endX };
  }, [result]);

  // Generate Voigt profile deconvolution curve simulation for selected peak
  const selectedPeakProfileData = React.useMemo(() => {
    if (!result || !result.points || result.points.length === 0) return null;
    const peakIdx = Math.min(selectedPeakIdx, result.points.length - 1);
    const peak = result.points[peakIdx];
    if (!peak) return null;

    const parsedInput = parseDoubleVoigtInput(inputData)[peakIdx];
    const eta = parsedInput?.eta || 0.5;
    const fwhm = parsedInput?.fwhmObs || 0.4;
    const center = peak.twoTheta;

    // Generate x-range around 2theta +/- 3 * fwhm
    const numPoints = 120;
    const halfWidth = fwhm * 3;
    const profilePoints = [];

    const gamma = fwhm / 2; // Cauchy HWHM
    const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2)); // Gaussian sigma

    for (let i = 0; i < numPoints; i++) {
      const x = (center - halfWidth) + (i / (numPoints - 1)) * (2 * halfWidth);
      const dx = x - center;

      // Cauchy/Lorentzian component L(x)
      const cauchy = (1 / Math.PI) * (gamma / (dx * dx + gamma * gamma)) * (Math.PI * gamma); // Normalized peak height 1

      // Gaussian component G(x)
      const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));

      // Pseudo-Voigt combination
      const voigt = eta * cauchy + (1 - eta) * gaussian;

      profilePoints.push({
        twoTheta: parseFloat(x.toFixed(3)),
        voigt: parseFloat(voigt.toFixed(4)),
        cauchy: parseFloat((eta * cauchy).toFixed(4)),
        gaussian: parseFloat(((1 - eta) * gaussian).toFixed(4))
      });
    }

    return {
      peak,
      eta,
      fwhm,
      data: profilePoints
    };
  }, [result, selectedPeakIdx, inputData]);

  // Size Comparison Data for Bar Chart
  const sizeComparisonData = React.useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Volume Size (D_V)', size: result.volumeSizeDvNm, color: '#6366f1' },
      { name: 'Area Size (D_A)', size: result.areaSizeDaNm, color: '#a855f7' },
      { name: 'Gaussian Size (D_G)', size: result.gaussianSizeDgNm, color: '#06b6d4' }
    ];
  }, [result]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#081020] to-[#040814] p-6 md:p-8 border border-indigo-500/25 shadow-[0_12px_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Advanced Convolution Profile Analysis • Langford Double-Voigt Method</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Double-Voigt Method
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                Voigt-Voigt Deconvolution
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Langford&apos;s Double-Voigt method treats both crystallite size and microstrain broadening as Voigt functions possessing both Cauchy (C) and Gaussian (G) components. By deconvoluting the Voigt profile into reciprocal space coordinates s = 2sinθ / λ, it rigorously separates volume-weighted (D_V) and area-weighted (D_A) sizes from root-mean-square strains without simplifying profile shape assumptions.
            </p>
          </div>

          <div className="bg-[#050C17]/85 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/30 shadow-inner max-w-md w-full space-y-3">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">
                1. Cauchy Reciprocal Linear Relation
              </span>
              <div 
                className="text-white text-xs py-1.5 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto"
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
                2. Gaussian Reciprocal Linear Relation
              </span>
              <div 
                className="text-purple-300 text-xs py-1.5 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto"
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

      {/* Experimental Sample Presets Toolbar */}
      <div className="bg-[#080E1A]/90 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <span>Curated Experimental Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DV_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>{p.name}</span>
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
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Setup
              </span>
            </div>

            {/* Wavelength Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                X-Ray Wavelength (λ) [Å]
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
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Standard Caglioti/LaB6 instrumental profile reference subtraction
              </p>
            </div>
          </div>

          {/* Peak Data Input */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reflections Input</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputData('')}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 bg-white/5 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              One reflection per line: <code className="text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">2θ [deg], FWHM [deg], η [0..1], h, k, l</code>
            </p>

            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={9}
              spellCheck={false}
              className="w-full p-3 bg-[#030710] text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 transition-all custom-scrollbar leading-relaxed"
            />

            {/* Input Peak Counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Parsed reflections: <strong className="text-indigo-300">{result?.points?.length || 0}</strong></span>
              {result && result.points.length >= 2 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready for deconvolution
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Minimum 2 reflections required
                </span>
              )}
            </div>
          </div>

          {/* Theoretical Summary Box */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Double-Voigt Physical Formulation
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike classical methods assuming purely Gaussian or purely Cauchy shapes, Double-Voigt analysis calculates area-weighted crystallite size ($D_A$) via Langford&apos;s formula:
            </p>
            <div 
              className="text-emerald-300 text-xs py-2 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto text-center"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'D_A = \\frac{1}{\\pi \\beta_{G,S}^*} \\cdot \\exp(k^2) \\cdot \\text{erfc}(k)',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <p className="text-[11px] text-slate-400 font-mono text-center">
              Where k = β_C,S* / (√π · β_G,S*)
            </p>
          </div>

        </div>

        {/* Right Column: Key Results & Interactive Visualizers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Key Microstructural Results */}
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              
              {/* Volume-Weighted Size D_V */}
              <div className="bg-gradient-to-br from-[#0C1A32] to-[#071122] p-5 rounded-3xl border border-indigo-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Ruler className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                  </div>
                  <Award className="w-4 h-4 text-indigo-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.volumeSizeDvNm.toFixed(2)}
                  </span>
                  <span className="text-indigo-300 text-sm font-mono font-semibold">nm</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Area Size D_A: <span className="text-slate-200 font-bold">{result.areaSizeDaNm.toFixed(2)} nm</span></div>
                  <div>Gaussian Size D_G: <span className="text-slate-200 font-bold">{result.gaussianSizeDgNm.toFixed(2)} nm</span></div>
                </div>
              </div>

              {/* Cauchy Strain e_C */}
              <div className="bg-gradient-to-br from-[#121632] to-[#0A0D22] p-5 rounded-3xl border border-purple-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Cauchy Strain (e_C)</span>
                  </div>
                  <Layers className="w-4 h-4 text-purple-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.cauchyStrainEc * 100).toFixed(4)}
                  </span>
                  <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Gaussian Strain e_G: <span className="text-slate-200 font-bold">{(result.gaussianStrainEg * 100).toFixed(4)}%</span></div>
                  <div>Cauchy Slope m_C: <span className="text-slate-200 font-bold">{result.cauchyFit.slope.toFixed(4)}</span></div>
                </div>
              </div>

              {/* Root-Mean-Square Strain */}
              <div className="bg-gradient-to-br from-[#0B1E2E] to-[#05111C] p-5 rounded-3xl border border-cyan-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">RMS Strain ⟨e²⟩¹/²</span>
                  </div>
                  <Activity className="w-4 h-4 text-cyan-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.rmsStrain * 100).toFixed(4)}
                  </span>
                  <span className="text-cyan-300 text-sm font-mono font-semibold">%</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Cauchy R²: <span className="text-indigo-300 font-bold">{(result.cauchyFit.rSquared * 100).toFixed(1)}%</span></div>
                  <div>Gaussian R²: <span className="text-purple-300 font-bold">{(result.gaussianFit.rSquared * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Peak Data</p>
              <p className="text-xs text-slate-400">Enter at least 2 valid peak profiles to execute Double-Voigt convolution analysis.</p>
            </div>
          )}

          {/* Interactive Plots Navigation Container */}
          {result && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
              
              {/* Tab Selector Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActivePlotTab('cauchy')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePlotTab === 'cauchy'
                        ? 'bg-indigo-500 text-black shadow-md shadow-indigo-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Cauchy Plot (β_C* vs s)
                  </button>

                  <button
                    onClick={() => setActivePlotTab('gaussian')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePlotTab === 'gaussian'
                        ? 'bg-purple-500 text-black shadow-md shadow-purple-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Gaussian Plot ((β_G*)^2 vs s^2)
                  </button>

                  <button
                    onClick={() => setActivePlotTab('profile')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePlotTab === 'profile'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    3. Peak Profile Deconvolution
                  </button>

                  <button
                    onClick={() => setActivePlotTab('summary')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePlotTab === 'summary'
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
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? 'Copied LaTeX!' : 'LaTeX'}</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Cauchy Chart */}
              {activePlotTab === 'cauchy' && cauchyChartData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Linear Cauchy Regression: <strong className="text-indigo-400">β_C* = 1/D_V + 2 e_C · s</strong></span>
                    <span className="text-slate-400">Intercept (s=0): <strong className="text-indigo-300">{result.cauchyFit.intercept.toFixed(4)} nm⁻¹</strong></span>
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="x"
                          type="number"
                          domain={[cauchyChartData.startX, cauchyChartData.endX]}
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
                                    {data.hkl ? `Reflection: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
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

                        {/* Intercept Line */}
                        <ReferenceLine 
                          x={0} 
                          stroke="#818cf8" 
                          strokeDasharray="4 4" 
                          label={{ value: "s = 0", fill: "#818cf8", fontSize: 10, position: "top" }} 
                        />

                        <Line
                          data={cauchyChartData.line}
                          type="linear"
                          dataKey="fitY"
                          name={`Cauchy Fit: β_C* = ${result.cauchyFit.slope.toFixed(4)}s + ${result.cauchyFit.intercept.toFixed(4)} (R² = ${(result.cauchyFit.rSquared*100).toFixed(1)}%)`}
                          stroke="#818cf8"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />

                        <Scatter
                          data={cauchyChartData.points}
                          name="Measured Cauchy Reflections"
                          fill="#a5b4fc"
                          stroke="#6366f1"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 2: Gaussian Chart */}
              {activePlotTab === 'gaussian' && gaussianChartData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Linear Gaussian Regression: <strong className="text-purple-400">(β_G*)^2 = (1/π D_G)^2 + 8π e_G^2 · s^2</strong></span>
                    <span className="text-slate-400">Intercept (s²=0): <strong className="text-purple-300">{result.gaussianFit.intercept.toFixed(5)} nm⁻²</strong></span>
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="x"
                          type="number"
                          domain={[gaussianChartData.startX, gaussianChartData.endX]}
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
                                    {data.hkl ? `Reflection: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
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

                        <ReferenceLine 
                          x={0} 
                          stroke="#c084fc" 
                          strokeDasharray="4 4" 
                          label={{ value: "s² = 0", fill: "#c084fc", fontSize: 10, position: "top" }} 
                        />

                        <Line
                          data={gaussianChartData.line}
                          type="linear"
                          dataKey="fitY"
                          name={`Gaussian Fit: (β_G*)² = ${result.gaussianFit.slope.toFixed(4)}s² + ${result.gaussianFit.intercept.toFixed(5)} (R² = ${(result.gaussianFit.rSquared*100).toFixed(1)}%)`}
                          stroke="#c084fc"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />

                        <Scatter
                          data={gaussianChartData.points}
                          name="Measured Gaussian Reflections"
                          fill="#e9d5ff"
                          stroke="#a855f7"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 3: Peak Profile Deconvolution Simulator */}
              {activePlotTab === 'profile' && selectedPeakProfileData && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-slate-300">
                      Select Reflection to Inspect Deconvoluted Voigt Components:
                    </span>

                    {/* Reflection Picker */}
                    <select
                      value={selectedPeakIdx}
                      onChange={(e) => setSelectedPeakIdx(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-[#030710] text-cyan-300 border border-cyan-500/30 rounded-xl outline-none font-bold"
                    >
                      {result.points.map((p, idx) => (
                        <option key={idx} value={idx}>
                          Peak #{idx+1}: 2θ = {p.twoTheta.toFixed(2)}° {p.hkl ? `(${p.hkl.join('')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono bg-black/40 p-3 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Position</span>
                      <strong className="text-white">{selectedPeakProfileData.peak.twoTheta.toFixed(2)}° 2θ</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">FWHM Obs</span>
                      <strong className="text-cyan-300">{selectedPeakProfileData.fwhm.toFixed(3)}°</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Lorentzian Fraction η</span>
                      <strong className="text-indigo-300">{selectedPeakProfileData.eta.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Apparent Size D_V</span>
                      <strong className="text-emerald-400">{selectedPeakProfileData.peak.singleDvNm.toFixed(2)} nm</strong>
                    </div>
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedPeakProfileData.data} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="twoTheta"
                          type="number"
                          domain={['auto', 'auto']}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Diffraction Angle 2θ [°]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#06b6d4',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Normalized Intensity [a.u.]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#06b6d4',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-cyan-400 font-bold border-b border-white/10 pb-1">
                                    2θ = {d.twoTheta}°
                                  </div>
                                  <div>Total Voigt I: <span className="text-white font-bold">{d.voigt}</span></div>
                                  <div>Cauchy Component: <span className="text-indigo-400 font-bold">{d.cauchy}</span></div>
                                  <div>Gaussian Component: <span className="text-purple-400 font-bold">{d.gaussian}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        <Line
                          type="monotone"
                          dataKey="voigt"
                          name="Composite Voigt Profile V(2θ)"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="cauchy"
                          name="Cauchy (Lorentzian) Profile L(2θ)"
                          stroke="#818cf8"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="gaussian"
                          name="Gaussian Profile G(2θ)"
                          stroke="#c084fc"
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 4: Size Distribution Spectrum Bar Chart */}
              {activePlotTab === 'summary' && sizeComparisonData && (
                <div className="space-y-4">
                  <div className="text-xs font-mono text-slate-300">
                    Microstructural Size Metric Spectrum comparison derived from Langford Voigt deconvolution:
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sizeComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Crystallite Size [nm]',
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
                                    {d.name}
                                  </div>
                                  <div>Calculated Size: <span className="text-white font-bold">{d.size.toFixed(2)} nm</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="size" name="Crystallite Size [nm]" radius={[12, 12, 0, 0]}>
                          {sizeComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Reflection Parameters Summary Table */}
          {result && result.points && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Double-Voigt Reflection Deconvolution Table
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {result.points.length} peaks deconvoluted
                </span>
              </div>

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
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setSelectedPeakIdx(idx);
                          setActivePlotTab('profile');
                        }}
                        className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedPeakIdx === idx ? 'bg-indigo-500/10 border-l-2 border-indigo-400' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white">{p.twoTheta.toFixed(2)}°</td>
                        <td className="py-2.5 px-3 text-indigo-300">{p.hkl ? `(${p.hkl.join('')})` : '-'}</td>
                        <td className="py-2.5 px-3 text-slate-300">{p.s.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-slate-400">{p.s2.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-indigo-300 font-bold">{p.betaCStar.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-purple-300 font-bold">{p.betaGStarSq.toFixed(5)}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{p.singleDvNm.toFixed(2)}</td>
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
