import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseMomentInput, calculateMethodOfMoments } from '../utils/physics';
import { MethodOfMomentsResult, MomentDataPoint } from '../types';
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
  Maximize2,
  BarChart3,
  Cpu
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

const MOMENT_PRESETS = [
  {
    name: 'CeO2 Nanocrystals (Pure Size)',
    wavelength: 1.54056,
    twoTheta0: 28.55,
    data: "0.20, 0.00182, 0.000009\n0.30, 0.00285, 0.000022\n0.40, 0.00392, 0.000041\n0.50, 0.00498, 0.000067\n0.60, 0.00605, 0.000099\n0.70, 0.00714, 0.000139\n0.80, 0.00822, 0.000185\n0.90, 0.00931, 0.000238\n1.00, 0.01041, 0.000299",
    desc: 'Uniform fluorite nanopowder exhibiting strong linear variance progression governed predominantly by size broadening.'
  },
  {
    name: 'Nanocrystalline Nickel (Size + Strain)',
    wavelength: 1.54056,
    twoTheta0: 44.51,
    data: "0.20, 0.00210, 0.000012\n0.35, 0.00395, 0.000038\n0.50, 0.00612, 0.000088\n0.65, 0.00862, 0.000168\n0.80, 0.01145, 0.000288\n0.95, 0.01460, 0.000455\n1.10, 0.01810, 0.000680\n1.25, 0.02192, 0.000970",
    desc: 'Severe plastic deformation nickel sample displaying noticeable quadratic curvature from lattice microstrain.'
  },
  {
    name: 'Ultrafine Anatase TiO2 (High Surface Area)',
    wavelength: 1.54056,
    twoTheta0: 25.28,
    data: "0.25, 0.00295, 0.000021\n0.40, 0.00485, 0.000055\n0.55, 0.00682, 0.000108\n0.70, 0.00886, 0.000182\n0.85, 0.01096, 0.000280\n1.00, 0.01314, 0.000405\n1.15, 0.01538, 0.000558",
    desc: 'Anatase nanocrystals evaluated by integration range cutoffs up to 1.15 degrees.'
  },
  {
    name: 'Cold-Worked Cu Alloy (High Strain)',
    wavelength: 1.54056,
    twoTheta0: 43.30,
    data: "0.30, 0.00340, 0.000030\n0.50, 0.00650, 0.000100\n0.70, 0.01040, 0.000250\n0.90, 0.01510, 0.000510\n1.10, 0.02060, 0.000920\n1.30, 0.02690, 0.001530",
    desc: 'High density dislocations driving significant quadratic curvature in variance-range plot.'
  }
];

export const MethodOfMomentsModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [twoTheta0, setTwoTheta0] = useState<number>(28.55);
  const [inputData, setInputData] = useState<string>(MOMENT_PRESETS[0].data);
  const [activeTab, setActiveTab] = useState<'variancePlot' | 'reducedPlot' | 'generator' | 'kurtosis'>('variancePlot');

  // Synthetic peak parameters for interactive profile moment calculator
  const [synthCentroid, setSynthCentroid] = useState<number>(38.2);
  const [synthFwhm, setSynthFwhm] = useState<number>(0.35);
  const [synthMixingEta, setSynthMixingEta] = useState<number>(0.5); // 0=Gaussian, 1=Lorentzian

  const [result, setResult] = useState<MethodOfMomentsResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_moment_analysis_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [copiedNotification, setCopiedNotification] = useState(false);

  // Recalculate whenever inputs change
  useEffect(() => {
    const parsedMoments = parseMomentInput(inputData);
    if (parsedMoments.length >= 3) {
      const computed = calculateMethodOfMoments(wavelength, twoTheta0, parsedMoments);
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_moment_analysis_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
  }, [wavelength, twoTheta0, inputData]);

  const handleApplyPreset = (preset: typeof MOMENT_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setTwoTheta0(preset.twoTheta0);
    setInputData(preset.data);
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Variance-Range Relation: } W(\\sigma) &= W_0 + K_1 \\cdot \\sigma + K_2 \\cdot \\sigma^2 \\\\
\\text{Linear Slope } K_1 &= ${result.slopeK1.toExponential(4)} \\text{ rad}, \\quad \\text{Quadratic } K_2 = ${result.quadraticK2.toExponential(4)} \\\\
\\text{Volume-Weighted Size } D_V &= ${result.sizeNm.toFixed(2)} \\text{ nm}, \\quad \\text{RMS Microstrain } \\langle\\epsilon^2\\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\%
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    let csv = "Sigma_deg,Sigma_rad,Variance_deg2,Variance_rad2,Fitted_Variance_deg2,Linear_Part_deg2,Quadratic_Part_deg2,Kurtosis\n";
    result.points.forEach((p, idx) => {
      const f = result.fittedPoints[idx];
      csv += `${p.sigmaDeg},${p.sigmaRad.toFixed(6)},${p.varianceDeg2.toFixed(6)},${p.varianceRad2.toFixed(8)},${f?.fittedWDeg2.toFixed(6) || ''},${f?.linearComponentDeg2.toFixed(6) || ''},${f?.quadraticComponentDeg2.toFixed(6) || ''},${p.kurtosis ? p.kurtosis.toFixed(4) : ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Method_of_Moments_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate synthetic profile moments (Integration range sigma vs Variance W & Kurtosis)
  const syntheticMomentsData = useMemo(() => {
    const x0 = synthCentroid;
    const fwhm = synthFwhm;
    const eta = synthMixingEta; // Pseudo-Voigt eta
    const step = 0.005;
    const maxSpan = 1.5;
    const numPoints = Math.floor((2 * maxSpan) / step);

    // Build grid
    const grid: { x: number; intensity: number }[] = [];
    const sigmaG = fwhm / (2 * Math.sqrt(2 * Math.log(2)));
    const gammaL = fwhm / 2;

    for (let i = 0; i <= numPoints; i++) {
      const x = x0 - maxSpan + i * step;
      const dx = x - x0;
      // Gaussian component
      const g = Math.exp(-(dx * dx) / (2 * sigmaG * sigmaG)) / (sigmaG * Math.sqrt(2 * Math.PI));
      // Lorentzian component
      const l = (1 / Math.PI) * (gammaL / (dx * dx + gammaL * gammaL));
      // Pseudo-Voigt
      const pv = eta * l + (1 - eta) * g;
      grid.push({ x, intensity: pv });
    }

    // Now compute moments M0, M1, M2(W), M4 for cutoffs sigma from 0.1 to 1.2 deg
    const sigmaList = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05, 1.15];
    const DEG_TO_RAD = Math.PI / 180;

    return sigmaList.map(sig => {
      let m0 = 0;
      let m1 = 0;
      let m2 = 0;
      let m4 = 0;

      for (const pt of grid) {
        if (Math.abs(pt.x - x0) <= sig) {
          const dxRad = (pt.x - x0) * DEG_TO_RAD;
          m0 += pt.intensity * step;
          m1 += pt.x * pt.intensity * step;
          m2 += (dxRad * dxRad) * pt.intensity * step;
          m4 += Math.pow(dxRad, 4) * pt.intensity * step;
        }
      }

      const wRad2 = m0 > 0 ? m2 / m0 : 0;
      const mu4Rad4 = m0 > 0 ? m4 / m0 : 0;
      const wDeg2 = wRad2 * (180 / Math.PI) * (180 / Math.PI);
      const kurtosis = wRad2 > 0 ? mu4Rad4 / (wRad2 * wRad2) : 3.0;

      return {
        sigmaDeg: sig,
        sigmaRad: sig * DEG_TO_RAD,
        varianceDeg2: wDeg2,
        varianceRad2: wRad2,
        fourthMomentRad4: mu4Rad4,
        kurtosis
      };
    });
  }, [synthCentroid, synthFwhm, synthMixingEta]);

  const handleLoadSyntheticToInput = () => {
    let text = "";
    syntheticMomentsData.forEach(p => {
      text += `${p.sigmaDeg.toFixed(2)}, ${p.varianceDeg2.toFixed(6)}, ${p.fourthMomentRad4?.toFixed(9)}\n`;
    });
    setTwoTheta0(synthCentroid);
    setInputData(text);
  };

  // Chart data for Tab 1 (W vs sigma)
  const chartVarianceData = useMemo(() => {
    if (!result) return [];
    const RAD_TO_DEG = 180 / Math.PI;

    return result.points.map((p, idx) => {
      const f = result.fittedPoints[idx];
      return {
        sigmaDeg: p.sigmaDeg,
        varianceDeg2: p.varianceDeg2,
        fittedWDeg2: f?.fittedWDeg2,
        linearComponentDeg2: f?.linearComponentDeg2,
        quadraticComponentDeg2: f?.quadraticComponentDeg2,
        kurtosis: p.kurtosis
      };
    });
  }, [result]);

  // Chart data for Tab 2 (Reduced Variance W / sigma vs sigma)
  const chartReducedData = useMemo(() => {
    if (!result) return [];
    const RAD_TO_DEG = 180 / Math.PI;

    return result.points.map((p, idx) => {
      const f = result.fittedPoints[idx];
      const wOverSigmaObs = p.varianceDeg2 / p.sigmaDeg;
      const wOverSigmaFit = f ? f.fittedWDeg2 / p.sigmaDeg : 0;
      return {
        sigmaDeg: p.sigmaDeg,
        wOverSigmaObs,
        wOverSigmaFit
      };
    });
  }, [result]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1220] via-[#07111E] to-[#040812] p-6 md:p-8 border border-indigo-500/20 shadow-[0_12px_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Statistical Profile Analysis • Second & Fourth Statistical Moments</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Method of Moments
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                Variance-Range Analysis
              </span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Separates crystallite size and microstrain by analyzing profile variance W and kurtosis μ₄ across integration ranges σ. The linear slope yields reciprocal domain size (1/D_V), while quadratic curvature gives mean-square strain ⟨ε²⟩.
            </p>
          </div>

          <div className="bg-[#050B16]/85 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/30 shadow-inner max-w-md w-full space-y-3">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">
                1. Profile Variance Definition
              </span>
              <div 
                className="text-white text-xs py-1.5 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    'W(\\sigma) = \\frac{\\int_{-\\sigma}^{\\sigma} (2\\theta - 2\\theta_0)^2 I(2\\theta) \\, d(2\\theta)}{\\int_{-\\sigma}^{\\sigma} I(2\\theta) \\, d(2\\theta)}',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
            </div>

            <div className="text-center space-y-1 pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest block">
                2. Linear-Quadratic Variance-Range Relation
              </span>
              <div 
                className="text-purple-300 text-xs py-1.5 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    'W(\\sigma) = W_0 + \\frac{\\lambda \\cdot \\sigma}{\\pi^2 D_V \\cos\\theta_0} + 4 \\langle\\epsilon^2\\rangle \\tan^2\\theta_0 \\cdot \\sigma^2',
                    { throwOnError: false, displayMode: true }
                  )
                }}
              />
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Linear Slope K₁ ∝ 1/D_V, Curvature K₂ ∝ ⟨ε²⟩
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#080E1A]/90 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <span>Curated Experimental Datasets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MOMENT_PRESETS.map((p) => (
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
        
        {/* Left Column: Settings & Input Data */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instrumental & Radiation Parameters */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Geometry</h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Setup
              </span>
            </div>

            {/* X-Ray Wavelength */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Radiation Wavelength (λ) [Å]
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

            {/* Reflection Centroid Position 2-Theta_0 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Peak Centroid (2θ₀) [degrees]
                </label>
                <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  θ₀ = {(twoTheta0 / 2).toFixed(2)}°
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={twoTheta0}
                onChange={(e) => setTwoTheta0(parseFloat(e.target.value) || 28.55)}
                className="w-full px-3 py-2 bg-[#050B14] text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50"
                placeholder="2θ₀ in degrees"
              />
            </div>
          </div>

          {/* Variance-Range Table Input Data */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Variance vs Range Table</h3>
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
              Enter one row per integration range: <code className="text-indigo-300 bg-black/40 px-1 py-0.5 rounded font-mono">sigma [deg], Variance W [deg²], mu4 [opt]</code>
            </p>

            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full p-3 bg-[#030710] text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 transition-all custom-scrollbar leading-relaxed"
            />

            {/* Input Counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Parsed range points: <strong className="text-indigo-300">{result?.points?.length || 0}</strong></span>
              {result && result.points.length >= 3 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready for Moment Regression
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Minimum 3 range points required
                </span>
              )}
            </div>
          </div>

          {/* Theoretical & Formula Guide Card */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Methodology & Formula Guide
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Evaluating profile variance W against integration limits σ yields a linear-quadratic regression:
            </p>
            <div 
              className="text-indigo-300 text-xs py-2 px-3 bg-black/50 rounded-xl border border-white/5 font-mono overflow-x-auto text-center"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'W(\\sigma) = W_0 + K_1 \\cdot \\sigma + K_2 \\cdot \\sigma^2',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-indigo-400 font-bold block">1. Volume Size (D_V)</span>
                <div 
                  className="text-slate-200"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(
                      'D_V = \\frac{\\lambda}{\\pi^2 K_1 \\cos\\theta_0}',
                      { throwOnError: false, displayMode: false }
                    )
                  }}
                />
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-purple-400 font-bold block">2. Microstrain (⟨ε²⟩¹/²)</span>
                <div 
                  className="text-slate-200"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(
                      '\\langle\\epsilon^2\\rangle^{1/2} = \\frac{\\sqrt{K_2}}{2 \\tan\\theta_0}',
                      { throwOnError: false, displayMode: false }
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Results & Interactive Visualizations */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Key Metrics */}
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              
              {/* Volume-Weighted Crystallite Size D_V */}
              <div className="bg-gradient-to-br from-[#0B1A30] to-[#061020] p-5 rounded-3xl border border-indigo-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Ruler className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                  </div>
                  <Award className="w-4 h-4 text-indigo-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {result.sizeNm.toFixed(2)}
                  </span>
                  <span className="text-indigo-300 text-sm font-mono font-semibold">nm</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Length: <span className="text-slate-200 font-bold">{(result.sizeNm * 10).toFixed(1)} Å</span></div>
                  <div>Linear Slope K₁: <span className="text-indigo-300 font-bold">{result.slopeK1.toExponential(3)}</span></div>
                </div>
              </div>

              {/* RMS Microstrain <e^2>^0.5 */}
              <div className="bg-gradient-to-br from-[#120B2E] to-[#090518] p-5 rounded-3xl border border-purple-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">RMS Microstrain</span>
                  </div>
                  <Activity className="w-4 h-4 text-purple-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.rmsStrain * 100).toFixed(4)}
                  </span>
                  <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Curvature K₂: <span className="text-purple-300 font-bold">{result.quadraticK2.toExponential(3)}</span></div>
                  <div>&lt;ε²&gt;¹/²: <span className="text-slate-200 font-bold">{result.rmsStrain.toExponential(3)}</span></div>
                </div>
              </div>

              {/* Fit Quality R² */}
              <div className="bg-gradient-to-br from-[#0B1A30] to-[#061020] p-5 rounded-3xl border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Regression R²</span>
                  </div>
                  <Layers className="w-4 h-4 text-emerald-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                    {(result.rSquared * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5 text-[11px] font-mono text-slate-400">
                  <div>Intercept W₀: <span className="text-emerald-300 font-bold">{result.interceptW0.toExponential(3)}</span></div>
                  <div>Avg Kurtosis K: <span className="text-slate-200 font-bold">{result.meanKurtosis.toFixed(2)}</span></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Data Points</p>
              <p className="text-xs text-slate-400">Provide at least 3 variance-range integration points (sigma, W) for moment analysis.</p>
            </div>
          )}

          {/* Interactive Plot Tabs */}
          {result && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
              
              {/* Tab Selector Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('variancePlot')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'variancePlot'
                        ? 'bg-indigo-500 text-black shadow-md shadow-indigo-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Variance W(σ) vs Range σ
                  </button>

                  <button
                    onClick={() => setActiveTab('reducedPlot')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'reducedPlot'
                        ? 'bg-purple-500 text-black shadow-md shadow-purple-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Reduced Plot W/σ vs σ
                  </button>

                  <button
                    onClick={() => setActiveTab('generator')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'generator'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    3. Peak Profile Moments
                  </button>

                  <button
                    onClick={() => setActiveTab('kurtosis')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activeTab === 'kurtosis'
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    4. Kurtosis & 4th Moment
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

              {/* Tab 1: W vs Sigma Plot */}
              {activeTab === 'variancePlot' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Linear-Quadratic Fit: <strong className="text-indigo-400">W(σ) = W₀ + K₁·σ + K₂·σ²</strong></span>
                    <span className="text-slate-400">R²: <strong className="text-emerald-400">{(result.rSquared * 100).toFixed(2)}%</strong></span>
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartVarianceData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="sigmaDeg"
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Integration Range Cutoff σ = Δ(2θ)/2 [deg]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#818cf8',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Profile Variance W [deg²]',
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
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-indigo-400 font-bold border-b border-white/10 pb-1">
                                    Integration Range σ = {d.sigmaDeg}°
                                  </div>
                                  <div>Observed Variance W: <span className="text-indigo-300 font-bold">{d.varianceDeg2.toFixed(6)} deg²</span></div>
                                  <div>Fitted W(σ): <span className="text-purple-300">{d.fittedWDeg2?.toFixed(6)} deg²</span></div>
                                  <div>Linear Size Part: <span className="text-indigo-200">{d.linearComponentDeg2?.toFixed(6)} deg²</span></div>
                                  <div>Quadratic Strain Part: <span className="text-purple-200">{d.quadraticComponentDeg2?.toFixed(6)} deg²</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        {/* Fitted Total Variance Line */}
                        <Line
                          dataKey="fittedWDeg2"
                          name="Full Fit (W₀ + K₁σ + K₂σ²)"
                          stroke="#818cf8"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />

                        {/* Linear Asymptote (Pure Size) */}
                        <Line
                          dataKey="linearComponentDeg2"
                          name="Pure Size Asymptote (W₀ + K₁σ)"
                          stroke="#c084fc"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                          activeDot={false}
                        />

                        {/* Experimental Points */}
                        <Scatter
                          dataKey="varianceDeg2"
                          name="Measured Variance W"
                          fill="#38bdf8"
                          stroke="#0284c7"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl text-xs text-indigo-200 leading-relaxed font-mono">
                    <span className="font-bold text-indigo-300 block mb-1">Physical Interpretation:</span>
                    {result.profileInterpretation}
                  </div>
                </div>
              )}

              {/* Tab 2: Reduced Plot W / Sigma vs Sigma */}
              {activeTab === 'reducedPlot' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-300">
                    Reduced Variance Plot W(σ) / σ = (W₀ / σ) + K₁ + K₂ · σ:
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartReducedData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="sigmaDeg"
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Integration Range σ [deg]',
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
                            value: 'W / σ [deg]',
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
                                    σ = {d.sigmaDeg}°
                                  </div>
                                  <div>Observed W/σ: <span className="text-purple-300 font-bold">{d.wOverSigmaObs.toFixed(6)} deg</span></div>
                                  <div>Fitted W/σ: <span className="text-indigo-300">{d.wOverSigmaFit.toFixed(6)} deg</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        <Line
                          dataKey="wOverSigmaFit"
                          name="Reduced Variance Model W/σ"
                          stroke="#e879f9"
                          strokeWidth={2}
                          dot={false}
                        />

                        <Scatter
                          dataKey="wOverSigmaObs"
                          name="Measured W / σ"
                          fill="#a855f7"
                          stroke="#7e22ce"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 3: Peak Profile Moments Synthetic Generator */}
              {activeTab === 'generator' && (
                <div className="space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Cpu className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Analytical Line Profile Moments Generator</h4>
                    </div>
                    <button
                      onClick={handleLoadSyntheticToInput}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all"
                    >
                      Load Computed Moments to Main Input
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        Centroid 2θ₀ [deg]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={synthCentroid}
                        onChange={(e) => setSynthCentroid(parseFloat(e.target.value) || 38.2)}
                        className="w-full px-2.5 py-1.5 bg-[#050B14] text-white border border-white/10 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        Profile FWHM [deg]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={synthFwhm}
                        onChange={(e) => setSynthFwhm(parseFloat(e.target.value) || 0.35)}
                        className="w-full px-2.5 py-1.5 bg-[#050B14] text-white border border-white/10 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        Pseudo-Voigt Mix η ({synthMixingEta === 0 ? 'Gaussian' : synthMixingEta === 1 ? 'Lorentzian' : 'Voigt'})
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={synthMixingEta}
                        onChange={(e) => setSynthMixingEta(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={syntheticMomentsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="sigmaDeg"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          label={{ value: 'Integration Range σ [deg]', position: 'insideBottom', offset: -10, fill: '#22d3ee', fontSize: 11 }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          label={{ value: 'Computed Variance W [deg²]', angle: -90, position: 'insideLeft', offset: -10, fill: '#22d3ee', fontSize: 11 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17] border border-cyan-500/40 p-2.5 rounded-lg text-xs font-mono text-white">
                                  <div>σ = {d.sigmaDeg}°</div>
                                  <div>Variance W = {d.varianceDeg2.toFixed(6)} deg²</div>
                                  <div>Kurtosis = {d.kurtosis.toFixed(2)}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="varianceDeg2" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 4: Fourth Moment & Kurtosis Spectrum */}
              {activeTab === 'kurtosis' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-300">
                    Profile Shape Kurtosis K = μ₄ / W² (Gaussian = 3.0, Lorentzian &gt; 3.0):
                  </div>

                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartVarianceData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="sigmaDeg"
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Integration Range σ [deg]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#34d399',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          domain={[1.5, 'auto']}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Kurtosis K = μ₄ / W²',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#34d399',
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
                                    σ = {d.sigmaDeg}°
                                  </div>
                                  <div>Kurtosis K: <span className="text-emerald-300 font-bold">{d.kurtosis?.toFixed(3) || 'N/A'}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={3.0} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Gaussian Kurtosis = 3.0", fill: "#10b981", fontSize: 11 }} />
                        <Scatter
                          dataKey="kurtosis"
                          name="Profile Kurtosis K"
                          fill="#10b981"
                          stroke="#059669"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
