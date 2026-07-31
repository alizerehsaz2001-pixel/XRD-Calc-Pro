import React, { useState, useEffect, useRef } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseScherrerInput, calculateMonshiScherrer } from '../utils/physics';
import { MonshiScherrerResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import scherrerBg from '../src/assets/images/scherrer_bg_1785502401694.jpg';
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
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';

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
  const { lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [instFwhm, setInstFwhm] = useState<number>(0.08);
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);

  const [inputData, setInputData] = useState<string>(MS_PRESETS[0].data);
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Voigt'>('Gaussian');
  const [pvEta, setPvEta] = useState<number>(0.5);
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0);
  const [applyLPFactor, setApplyLPFactor] = useState<boolean>(false);
  const [monochromatorAngle, setMonochromatorAngle] = useState<number>(26.4);
  const [kAlpha2Correction, setKAlpha2Correction] = useState<boolean>(false);
  
  const [physicsSubTab, setPhysicsSubTab] = useState<'setup' | 'profiles' | 'corrections'>('setup');
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
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        {
          zeroShiftDeg,
          pvEta,
          applyLPFactor,
          monochromatorAngleDeg: monochromatorAngle,
          kAlpha2Correction
        }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_monshi_scherrer_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
    isFirstRender.current = false;
  }, [
    wavelength,
    constantK,
    instFwhm,
    inputData,
    broadeningModel,
    pvEta,
    zeroShiftDeg,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW
  ]);

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020813] via-[#0B1A30] to-[#061020] p-6 md:p-10 border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] group">
        {/* Custom Background Graphic */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
          <img src={scherrerBg} alt="Scherrer Diffraction" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020813] via-[#0B1A30]/80 to-[#061020]/30" />
        </div>

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-cyan-500/30 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/30 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Modified Scherrer Logarithmic Transformation • Monshi et al. (2012) Method</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight flex flex-wrap items-center gap-3">
              Monshi-Scherrer Scheme
              <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/30 shadow-inner">
                Logarithmic Fit
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Formulated by Monshi et al. (2012), this logarithmic modification <span className="font-mono text-cyan-300">ln(β) = ln(Kλ/D) + ln(1/cosθ)</span> avoids low-angle division errors, balances reflection weights, and identifies strain or defect contributions via the slope <span className="font-mono text-cyan-300">m</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#050C17]/90 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-20 hover:border-cyan-500/30 transition-colors duration-500">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span>Curated Experimental Presets</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {MS_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 hover:bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all flex-1 md:flex-none text-center shadow-inner flex items-center justify-center gap-1.5 group/btn"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover/btn:text-cyan-300 group-hover/btn:animate-pulse" />
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
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Parameters & Physics</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 shadow-inner">
                Advanced Physics
              </span>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex p-1 bg-black/50 rounded-xl border border-white/10 gap-1 relative z-10">
              <button
                onClick={() => setPhysicsSubTab('setup')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  physicsSubTab === 'setup'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Geometry & K
              </button>

              <button
                onClick={() => setPhysicsSubTab('profiles')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  physicsSubTab === 'profiles'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-3 h-3" />
                Broadening Mode
              </button>

              <button
                onClick={() => setPhysicsSubTab('corrections')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  physicsSubTab === 'corrections'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-3 h-3" />
                Corrections
              </button>
            </div>

            {/* Subtab 1: Geometry & K */}
            {physicsSubTab === 'setup' && (
              <div className="space-y-4 relative z-10">
                {/* Wavelength Picker */}
                <div className="group/input">
                  <label className="block text-xs font-semibold text-slate-300 mb-2 group-hover/input:text-cyan-300 transition-colors">
                    X-Ray Radiation Wavelength (λ) [{lengthUnit}]
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                      className="w-full px-3 py-2 bg-black/40 text-cyan-300 border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/50 hover:border-white/20 transition-colors cursor-pointer appearance-none shadow-inner"
                    >
                      {XRAY_WAVELENGTHS.map((w) => (
                        <option key={w.label} value={convertLength(w.value, lengthUnit)}>
                          {w.label} ({convertLength(w.value, lengthUnit).toFixed(4)} {lengthUnit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.00001"
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value) || 1.54056, lengthUnit))}
                      className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/50 hover:border-white/20 transition-colors shadow-inner"
                      placeholder={`Custom ${lengthUnit}`}
                    />
                  </div>
                </div>

                {/* Shape Factor K */}
                <div className="relative group/input">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-cyan-300 transition-colors">
                      Crystallite Shape Factor (K)
                    </label>
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 shadow-inner">
                      K = {constantK}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                      className="w-full px-3 py-2 bg-black/40 text-left border border-white/10 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-between hover:border-cyan-500/50 transition-colors shadow-inner"
                    >
                      <span>{K_FACTORS.find(k => k.value === constantK)?.label || 'Custom Factor'} ({constantK})</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isKTypeMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-30 left-0 right-0 mt-2 bg-[#091222]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar"
                        >
                          {K_FACTORS.map((k) => (
                            <button
                              key={k.label}
                              onClick={() => {
                                setConstantK(k.value);
                                setIsKTypeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-start gap-3 ${
                                constantK === k.value
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'text-slate-300 hover:bg-white/10 border border-transparent'
                              }`}
                            >
                              <span className="text-base mt-0.5">{k.icon}</span>
                              <div>
                                <div className="font-bold text-white">{k.label} (K = {k.value})</div>
                                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{k.desc}</div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Zero-Point Goniometer Shift Correction */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Zero-Shift Error (Δ2θ₀)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                        zeroShiftDeg !== 0 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' 
                          : 'bg-black/60 text-slate-400 border-white/5'
                      }`}>
                        {zeroShiftDeg > 0 ? `+${zeroShiftDeg.toFixed(2)}` : zeroShiftDeg.toFixed(2)}° 2θ
                      </span>
                      {zeroShiftDeg !== 0 && (
                        <button
                          onClick={() => setZeroShiftDeg(0)}
                          className="text-[10px] text-cyan-400 hover:underline font-mono"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={zeroShiftDeg}
                    onChange={(e) => setZeroShiftDeg(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Corrects goniometer alignment offset: 2θ_corr = 2θ_obs + Δ2θ₀
                  </p>
                </div>
              </div>
            )}

            {/* Subtab 2: Instrumental & Profiles */}
            {physicsSubTab === 'profiles' && (
              <div className="space-y-4 relative z-10">
                {/* Instrumental Broadening Mode */}
                <div className="group/input">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-cyan-300 transition-colors">
                      Instrumental Broadening (β_inst)
                    </label>
                    <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-mono shadow-inner">
                      <button
                        onClick={() => setInstrumentalMode('constant')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          instrumentalMode === 'constant' ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Constant
                      </button>
                      <button
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          instrumentalMode === 'caglioti' ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Caglioti
                      </button>
                    </div>
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.001"
                          value={instFwhm}
                          onChange={(e) => setInstFwhm(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/50 shadow-inner"
                        />
                        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">°2θ FWHM</span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 0.05, 0.08, 0.12].map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setInstFwhm(val)}
                            className={`flex-1 py-1 rounded-lg border text-[9px] font-black transition-all ${instFwhm === val ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}
                          >
                            {val === 0 ? '0 (Raw)' : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1 mb-1 overflow-x-auto pb-1">
                        {[
                          { name: '0 (Raw)', u: 0, v: 0, w: 0 },
                          { name: 'Lab XRD', u: 0.005, v: -0.002, w: 0.015 },
                          { name: 'Synchrotron', u: 0.0002, v: -0.0001, w: 0.001 }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setCagliotiU(preset.u);
                              setCagliotiV(preset.v);
                              setCagliotiW(preset.w);
                            }}
                            className="px-2 py-1 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 whitespace-nowrap"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">U (tan²θ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiU}
                            onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50 shadow-inner"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">V (tanθ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiV}
                            onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50 shadow-inner"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">W (const)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiW}
                            onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50 shadow-inner"
                          />
                        </div>
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
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-all text-center ${
                        broadeningModel === 'Gaussian'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Gaussian (β² = βₒ² - βᵢ²)
                    </button>

                    <button
                      onClick={() => setBroadeningModel('Lorentzian')}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-all text-center ${
                        broadeningModel === 'Lorentzian'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Lorentzian (β = βₒ - βᵢ)
                    </button>

                    <button
                      onClick={() => setBroadeningModel('Pseudo-Voigt')}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-all text-center ${
                        broadeningModel === 'Pseudo-Voigt'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Pseudo-Voigt (η Mix)
                    </button>

                    <button
                      onClick={() => setBroadeningModel('Voigt')}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-all text-center ${
                        broadeningModel === 'Voigt'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-inner'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Voigt (Olivero Approx)
                    </button>
                  </div>

                  {broadeningModel === 'Pseudo-Voigt' && (
                    <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 shadow-inner">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Mixing Ratio (η):</span>
                        <span className="text-cyan-300 font-mono font-bold">{pvEta.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={pvEta}
                        onChange={(e) => setPvEta(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>0.0 (Gaussian)</span>
                        <span>1.0 (Lorentzian)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtab 3: Advanced Corrections */}
            {physicsSubTab === 'corrections' && (
              <div className="space-y-4 relative z-10">
                {/* Lorentz-Polarization (L-P) Factor Toggle */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Lorentz-Polarization (L-P) Correction
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Adjusts FWHM for geometry intensity weighting
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyLPFactor(!applyLPFactor)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        applyLPFactor ? 'bg-cyan-500' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          applyLPFactor ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {applyLPFactor && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <label className="text-[10px] text-slate-300 font-mono block">
                        Monochromator 2θ_m Angle [deg]
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMonochromatorAngle(0)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-mono border ${
                            monochromatorAngle === 0 
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                              : 'bg-black/60 text-slate-400 border-white/5'
                          }`}
                        >
                          Unpolarized (0°)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonochromatorAngle(26.4)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-mono border ${
                            monochromatorAngle === 26.4 
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                              : 'bg-black/60 text-slate-400 border-white/5'
                          }`}
                        >
                          Graphite (26.4°)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* K-Alpha2 Doublet Wavelength Correction */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Kα₂ Doublet Splitting Correction
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rachinger doublet stripping at higher 2θ angles
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      kAlpha2Correction ? 'bg-cyan-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        kAlpha2Correction ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Monshi Slope Microstrain Extractor Info */}
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Monshi Logarithmic Strain Extractor
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    When slope <code className="text-cyan-300">m &gt; 1.0</code>, Monshi scheme extracts lattice microstrain from slope excess: 
                    <span className="font-mono text-cyan-300 block mt-0.5">⟨ε⟩ ≈ (m - 1) · β_avg / (4 · tan θ_avg)</span>
                  </p>
                  {result && result.estimatedStrain !== undefined && result.estimatedStrain > 0 && (
                    <div className="mt-1 pt-1 border-t border-cyan-500/20 flex justify-between text-[11px] font-mono text-emerald-300 font-bold">
                      <span>Extracted Microstrain:</span>
                      <span>{(result.estimatedStrain * 100).toFixed(4)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Peak Input Data Area */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-colors duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Diffraction Peaks Input</h3>
              </div>
              <button
                onClick={() => setInputData('')}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 bg-black/40 rounded-lg hover:bg-white/5 border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              Enter one peak per line: <code className="text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded font-mono shadow-inner border border-white/5 text-[11px]">2θ [deg], FWHM [deg], h, k, l</code>
            </p>

            <div className="relative group/textarea">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-[30px] pointer-events-none group-focus-within/textarea:bg-cyan-500/10 transition-colors" />
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full p-4 bg-black/60 text-cyan-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner relative z-10"
              />
            </div>

            {/* Input Peak Counter */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-1">
              <span className="text-slate-400">Parsed reflections: <strong className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{result?.points?.length || 0}</strong></span>
              {result && result.points.length >= 2 ? (
                <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready for regression
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Minimum 2 reflections
                </span>
              )}
            </div>
          </div>

          {/* Methodology & Formula Guide Card */}
          <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-cyan-500/20 shadow-[0_8px_30px_rgba(6,182,212,0.05)] space-y-4 hover:border-cyan-500/40 transition-colors duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
            
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
              <Info className="w-4 h-4" />
              Methodology & Formula Guide
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed relative z-10">
              Plots <span className="font-mono text-cyan-300">Y = ln(β)</span> against <span className="font-mono text-cyan-300">X = ln(1/cosθ)</span> to perform linear regression <span className="font-mono text-cyan-300">Y = m·X + C</span>:
            </p>
            <div 
              className="text-white text-xs sm:text-sm py-3 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner relative z-10"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\ln(\\beta) = m \\cdot \\ln\\left(\\frac{1}{\\cos\\theta}\\right) + \\ln\\left(\\frac{K \\cdot \\lambda}{D}\\right)',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono relative z-10">
              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 space-y-2 hover:bg-emerald-500/10 transition-colors">
                <span className="text-emerald-400 font-bold block flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" />1. Crystallite Size (D)</span>
                <div 
                  className="text-emerald-300 bg-black/40 py-1.5 px-2 rounded-lg text-center"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(
                      'D = K \\cdot \\lambda \\cdot e^{-C}',
                      { throwOnError: false, displayMode: false }
                    )
                  }}
                />
              </div>
              <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/20 space-y-1.5 hover:bg-blue-500/10 transition-colors">
                <span className="text-blue-400 font-bold block flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />2. Slope Significance</span>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  Ideal <span className="text-blue-300">m ≈ 1.0</span> (pure size). Deviation <span className="text-red-400">m &gt; 1</span> indicates lattice strain or planar faults.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Interactive Visualizers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Key Metrics Overview */}
          {result ? (
            <>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <ScientificMathControl
                  title="Monshi-Scherrer Logarithmic Transformation"
                  formula="\ln(\beta) = \ln\left(\frac{K \lambda}{D}\right) + \ln\left(\frac{1}{\cos\theta}\right)"
                  description="Logarithmic linear transformation. The intercept yields crystallite size (D) without low-angle division errors, and the slope (ideally 1.0) can indicate strain or defects."
                  variables={[
                    { symbol: 'm', name: 'Regression Slope (m)', value: result.slope, unit: '' },
                    { symbol: 'C', name: 'Log Intercept (C)', value: result.intercept, unit: '' },
                    { symbol: 'R²', name: 'Linear Fit Quality', value: result.rSquared, unit: '' },
                    { symbol: 'K', name: 'Shape Factor', value: constantK, unit: '' },
                    { symbol: 'λ', name: 'Wavelength', value: wavelength, unit: lengthUnit }
                  ]}
                  result={result.sizeNm}
                  resultUnit="nm"
                  resultName="Crystallite Grain Size (D)"
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
              
              {/* Monshi-Scherrer Crystallite Size D */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-cyan-500/30 shadow-[0_8px_30px_rgba(6,182,212,0.1)] relative overflow-hidden group hover:border-cyan-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Ruler className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider truncate">Monshi Size (D)</span>
                  </div>
                  <Award className="w-4 h-4 text-cyan-400/50 shrink-0" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10 overflow-hidden">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] truncate">
                    {convertLength(result.sizeNm * 10, lengthUnit).toFixed(2)}
                  </span>
                  <span className="text-cyan-300 text-sm font-mono font-semibold shrink-0">{lengthUnit}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-cyan-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between items-center"><span className="truncate pr-2">Length:</span> <span className="text-slate-200 font-bold shrink-0">{convertLength(result.sizeNm * 10, lengthUnit).toFixed(2)} {lengthUnit}</span></div>
                  <div className="flex justify-between items-center"><span className="truncate pr-2">Mean Single-Peak:</span> <span className="text-slate-200 font-bold shrink-0">{convertLength(meanSinglePeakSize * 10, lengthUnit).toFixed(2)} {lengthUnit}</span></div>
                </div>
              </div>

              {/* Logarithmic Slope m */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-blue-500/30 shadow-[0_8px_30px_rgba(59,130,246,0.1)] relative overflow-hidden group hover:border-blue-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider truncate">Log Slope (m)</span>
                  </div>
                  <Activity className="w-4 h-4 text-blue-400/50 shrink-0" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10 overflow-hidden">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] truncate">
                    {result.slope.toFixed(4)}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between items-center"><span className="truncate pr-2">Ideal Slope:</span> <span className="text-blue-300 font-bold shrink-0">1.0000</span></div>
                  <div className="flex justify-between items-center"><span className="truncate pr-2">Dev Status:</span> <span className="text-slate-200 font-bold truncate ml-2 text-right">
                    {Math.abs(result.slope - 1) <= 0.15 ? 'Isotropic Size' : result.slope > 1 ? 'Microstrain' : 'Defect/Over-sub'}
                  </span></div>
                </div>
              </div>

              {/* Fit Quality R² */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:border-emerald-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider truncate">Fit Quality (R²)</span>
                  </div>
                  <Layers className="w-4 h-4 text-emerald-400/50 shrink-0" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10 overflow-hidden">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] truncate">
                    {(result.rSquared * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Intercept C:</span> <span className="text-emerald-300 font-bold">{result.intercept.toFixed(4)}</span></div>
                  <div className="flex justify-between"><span>exp(C):</span> <span className="text-slate-200 font-bold">{Math.exp(result.intercept).toFixed(4)}</span></div>
                </div>
              </div>
            </motion.div>
            </>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Peak Data</p>
              <p className="text-xs text-slate-400">Provide at least 2 valid diffraction peaks to construct Monshi-Scherrer regression.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <AIAnalysis methodName="Monshi-Scherrer Logarithmic Scheme" resultData={result} />
              <PythonCodeExporter 
                methodName="Monshi-Scherrer Scheme" 
                parameters={{
                  wavelength: Number(wavelength),
                  twoTheta: result.pointsExtended.map(p => p.twoTheta),
                  beta: result.pointsExtended.map(p => p.fwhmObs),
                  shapeFactor: Number(constantK),
                  x: result.pointsExtended.map(p => p.x),
                  y: result.pointsExtended.map(p => p.y)
                }} 
              />
            </div>
          )}

          {/* Interactive Plot Tabs & Visualization Container */}
          {result && (
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-cyan-500/30 transition-colors duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
              
              {/* Tab Selector Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('logPlot')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border flex-1 sm:flex-none text-center ${
                      activeTab === 'logPlot'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-cyan-500/30 hover:text-cyan-200'
                    }`}
                  >
                    1. Monshi Log Regression
                  </button>

                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border flex-1 sm:flex-none text-center ${
                      activeTab === 'comparison'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-blue-500/30 hover:text-blue-200'
                    }`}
                  >
                    2. Single-Peak vs Monshi Size
                  </button>

                  <button
                    onClick={() => setActiveTab('residuals')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border flex-1 sm:flex-none text-center ${
                      activeTab === 'residuals'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-purple-500/30 hover:text-purple-200'
                    }`}
                  >
                    3. Residual Analysis
                  </button>

                  <button
                    onClick={() => setActiveTab('spectrum')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border flex-1 sm:flex-none text-center ${
                      activeTab === 'spectrum'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-emerald-500/30 hover:text-emerald-200'
                    }`}
                  >
                    4. Size Distribution Spectrum
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-2 rounded-xl bg-black/40 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/20 text-xs font-mono flex items-center gap-1.5 transition-all shadow-inner"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleCopyLaTeX}
                    className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all shadow-inner border ${
                      copiedNotification 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {copiedNotification ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedNotification ? 'Copied LaTeX!' : 'Copy LaTeX'}</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Log Plot */}
              {activeTab === 'logPlot' && chartData && (
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Logarithmic Fit: <strong className="text-cyan-400">ln(β) = {result.slope.toFixed(4)} · ln(1/cos θ) + {result.intercept.toFixed(4)}</strong></span>
                    <span className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-inner text-emerald-400">R²: <strong>{(result.rSquared * 100).toFixed(2)}%</strong></span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-cyan-500/40 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1.5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-cyan-400 font-bold border-b border-white/10 pb-2 relative z-10">
                                    {data.hkl ? `Reflection: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                                  </div>
                                  <div className="relative z-10">2θ: <span className="text-cyan-300">{data.twoTheta?.toFixed(2)}°</span></div>
                                  <div className="relative z-10">X = ln(1/cosθ): <span className="text-cyan-300">{data.x?.toFixed(4)}</span></div>
                                  <div className="relative z-10">Y = ln(β): <span className="text-cyan-300 bg-cyan-500/10 px-1 py-0.5 rounded font-bold">{data.y?.toFixed(4)}</span></div>
                                  <div className="relative z-10">Single-Peak D: <span className="text-emerald-400 font-bold">{data.singleSize?.toFixed(2)} nm</span></div>
                                  <div className="relative z-10">Residual ΔY: <span className="text-purple-300 font-mono">{data.residual?.toFixed(5)}</span></div>
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

                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl text-xs text-cyan-200 leading-relaxed font-mono shadow-inner relative overflow-hidden group/interp">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[30px] pointer-events-none group-hover/interp:bg-cyan-500/20 transition-colors" />
                    <span className="font-bold text-cyan-300 block mb-1.5 flex items-center gap-1.5 relative z-10"><Info className="w-3.5 h-3.5" /> Scientific Commentary on Monshi-Scherrer Fit:</span>
                    <span className="relative z-10">{result.slopeInterpretation}</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Single Peak vs Monshi Consensus Size Comparison */}
              {activeTab === 'comparison' && (
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Individual Reflection Sizes <strong className="text-blue-400">D_hkl</strong> vs Consensus Monshi Size D = <strong className="text-emerald-400">{result.sizeNm.toFixed(2)} nm</strong></span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-blue-500/40 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1.5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-blue-400 font-bold border-b border-white/10 pb-2 relative z-10">
                                    Reflection: {d.hkl} (2θ = {d.twoTheta}°)
                                  </div>
                                  <div className="relative z-10">Single Peak D: <span className="text-white font-bold bg-blue-500/10 px-1 py-0.5 rounded">{d.singleSize.toFixed(2)} nm</span></div>
                                  <div className="relative z-10">Monshi Consensus D: <span className="text-emerald-400 font-bold">{d.monshiSize.toFixed(2)} nm</span></div>
                                  <div className="relative z-10">Deviation ΔD: <span className="text-cyan-300">{d.diff > 0 ? `+${d.diff.toFixed(2)}` : d.diff.toFixed(2)} nm</span></div>
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
                          strokeWidth={2.5}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 3: Residual Analysis Plot */}
              {activeTab === 'residuals' && chartData && (
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="text-xs font-mono text-slate-300">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Linear Log Regression Residuals <strong className="text-purple-400">ΔY = ln(β_obs) - ln(β_fit)</strong></span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-purple-500/40 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1.5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-purple-400 font-bold border-b border-white/10 pb-2 relative z-10">
                                    Reflection: {d.hkl}
                                  </div>
                                  <div className="relative z-10">2θ: <span className="text-slate-300">{d.twoTheta}°</span></div>
                                  <div className="relative z-10">Residual ΔY: <span className="text-purple-300 font-bold bg-purple-500/10 px-1 py-0.5 rounded">{d.residual?.toFixed(5)}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={0} stroke="#a855f7" strokeWidth={1.5} />
                        <Bar dataKey="residual" name="Fit Residual ΔY" radius={[4, 4, 0, 0]}>
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
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="text-xs font-mono text-slate-300">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Crystallite Size Spectrum across indexed reflections</span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-emerald-500/40 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1.5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-emerald-400 font-bold border-b border-white/10 pb-2 relative z-10">
                                    {d.hkl} (2θ = {d.twoTheta}°)
                                  </div>
                                  <div className="relative z-10">Calculated Size: <span className="text-white font-bold bg-emerald-500/10 px-1 py-0.5 rounded">{d.singleSize.toFixed(2)} nm</span></div>
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
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4 hover:border-white/20 transition-colors duration-500 relative overflow-hidden group">
              {/* Custom Background Graphic */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 mix-blend-screen">
                <img src={scherrerBg} alt="Scherrer Diffraction" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050C17] via-[#050C17]/90 to-[#050C17]/50" />
              </div>
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 relative z-10">
                <Layers className="w-4 h-4 text-cyan-400" />
                Reflections Deconvolution &amp; Single-Peak Comparison
              </h3>

              <div className="overflow-x-auto custom-scrollbar relative z-10 bg-[#030710]/50 rounded-2xl border border-white/5">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-tl-2xl">2θ [°]</th>
                      <th className="py-3 px-4">hkl</th>
                      <th className="py-3 px-4">FWHM_obs [°]</th>
                      <th className="py-3 px-4">FWHM_inst [°]</th>
                      <th className="py-3 px-4">β_sample [rad]</th>
                      <th className="py-3 px-4 text-cyan-400">X = ln(1/cosθ)</th>
                      <th className="py-3 px-4 text-cyan-400">Y = ln(β)</th>
                      <th className="py-3 px-4 text-emerald-400 rounded-tr-2xl">Single D [nm]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {result.pointsExtended.map((p, idx) => (
                      <tr key={idx} className="hover:bg-cyan-500/10 transition-colors group/row">
                        <td className="py-2.5 px-4 font-bold text-white group-hover/row:text-cyan-300 transition-colors">{p.twoTheta.toFixed(3)}</td>
                        <td className="py-2.5 px-4 text-cyan-400/70 font-bold">{p.hkl ? `(${p.hkl.join('')})` : '-'}</td>
                        <td className="py-2.5 px-4 text-slate-300">{p.fwhmObs.toFixed(4)}</td>
                        <td className="py-2.5 px-4 text-slate-400">{p.fwhmInst.toFixed(4)}</td>
                        <td className="py-2.5 px-4 text-slate-300">{p.betaCorrectedRad.toExponential(4)}</td>
                        <td className="py-2.5 px-4 text-cyan-200/80 font-bold">{p.x.toFixed(5)}</td>
                        <td className="py-2.5 px-4 text-cyan-200/80 font-bold">{p.y.toFixed(5)}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-400 group-hover/row:text-emerald-300 transition-colors">{p.singlePeakSizeNm.toFixed(2)}</td>
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
