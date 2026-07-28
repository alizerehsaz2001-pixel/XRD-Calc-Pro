import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseMomentInput, calculateMethodOfMoments } from '../utils/physics';
import { MethodOfMomentsResult, MomentDataPoint } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
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
  const { lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [twoTheta0, setTwoTheta0] = useState<number>(28.55);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [instFwhm, setInstFwhm] = useState<number>(0.05);
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0);
  const [applyLPFactor, setApplyLPFactor] = useState<boolean>(false);
  const [monochromatorAngle, setMonochromatorAngle] = useState<number>(26.4);
  const [kAlpha2Correction, setKAlpha2Correction] = useState<boolean>(false);
  const [shapeK, setShapeK] = useState<number>(1.0);

  const [expSubTab, setExpSubTab] = useState<'wavelength' | 'instrument' | 'corrections'>('wavelength');

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
      const computed = calculateMethodOfMoments(
        wavelength,
        twoTheta0,
        parsedMoments,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        instFwhm,
        {
          zeroShiftDeg,
          applyLPFactor,
          monochromatorAngleDeg: monochromatorAngle,
          kAlpha2Correction,
          shapeK
        }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_moment_analysis_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
  }, [
    wavelength,
    twoTheta0,
    inputData,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    instFwhm,
    zeroShiftDeg,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    shapeK
  ]);

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020813] via-[#0B1230] to-[#060A20] p-6 md:p-10 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.15)] group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/30 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Statistical Profile Analysis • Second & Fourth Statistical Moments</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-400 tracking-tight flex flex-wrap items-center gap-3">
              Method of Moments
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-inner">
                Variance-Range Analysis
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Separates crystallite size and microstrain by analyzing profile variance <span className="font-mono text-indigo-300">W</span> and kurtosis <span className="font-mono text-indigo-300">μ₄</span> across integration ranges <span className="font-mono text-indigo-300">σ</span>. The linear slope yields reciprocal domain size <span className="font-mono text-indigo-300">(1/D_V)</span>, while quadratic curvature gives mean-square strain <span className="font-mono text-indigo-300">⟨ε²⟩</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#050C17]/90 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-20 hover:border-indigo-500/30 transition-colors duration-500">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          <span>Curated Experimental Datasets</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {MOMENT_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 hover:bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex-1 md:flex-none text-center shadow-inner flex items-center justify-center gap-1.5 group/btn"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:text-indigo-300 group-hover/btn:animate-pulse" />
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
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Geometry</h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 shadow-inner">
                Wilson Method
              </span>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex p-1 bg-black/50 rounded-xl border border-white/10 gap-1 relative z-10">
              <button
                onClick={() => setExpSubTab('wavelength')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'wavelength'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Radiation & Centroid
              </button>

              <button
                onClick={() => setExpSubTab('instrument')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'instrument'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-3 h-3" />
                Instrumental
              </button>

              <button
                onClick={() => setExpSubTab('corrections')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'corrections'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-3 h-3" />
                Corrections
              </button>
            </div>

            {/* Tab 1: Wavelength, Centroid, Shape K, and Zero Shift */}
            {expSubTab === 'wavelength' && (
              <div className="space-y-4 relative z-10">
                {/* X-Ray Wavelength */}
                <div className="group/input">
                  <label className="block text-xs font-semibold text-slate-300 mb-2 group-hover/input:text-indigo-300 transition-colors">
                    Radiation Wavelength (λ) [{lengthUnit}]
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                      className="w-full px-3 py-2 bg-black/40 text-indigo-300 border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 hover:border-white/20 transition-colors cursor-pointer appearance-none shadow-inner"
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
                      className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 hover:border-white/20 transition-colors shadow-inner"
                      placeholder={`Custom ${lengthUnit}`}
                    />
                  </div>
                </div>

                {/* Reflection Centroid Position 2-Theta_0 */}
                <div className="group/input">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-indigo-300 transition-colors">
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
                    className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 hover:border-white/20 transition-colors shadow-inner"
                    placeholder="2θ₀ in degrees"
                  />
                </div>

                {/* Crystallite Shape Scale K */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">Shape Habit Multiplier (K):</span>
                    <span className="text-indigo-300 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      K = {shapeK.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="1.20"
                    step="0.01"
                    value={shapeK}
                    onChange={(e) => setShapeK(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0.89 (Spherical)</span>
                    <span>1.00 (Standard)</span>
                    <span>1.07 (Octahedral)</span>
                  </div>
                </div>

                {/* Goniometer Zero-Shift Correction */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      Goniometer Zero-Shift (Δ2θ₀)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                        zeroShiftDeg !== 0 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold' 
                          : 'bg-black/60 text-slate-400 border-white/5'
                      }`}>
                        {zeroShiftDeg > 0 ? `+${zeroShiftDeg.toFixed(2)}` : zeroShiftDeg.toFixed(2)}° 2θ
                      </span>
                      {zeroShiftDeg !== 0 && (
                        <button
                          onClick={() => setZeroShiftDeg(0)}
                          className="text-[10px] text-indigo-400 hover:underline font-mono"
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
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Corrects systematic zero error: 2θ₀_corr = 2θ₀_obs + Δ2θ₀
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Instrumental Broadening & Caglioti */}
            {expSubTab === 'instrument' && (
              <div className="space-y-4 relative z-10">
                {/* Instrumental Mode Toggle */}
                <div className="group/input">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-indigo-300 transition-colors">
                      Instrumental Resolution Profile
                    </label>
                    <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-mono shadow-inner">
                      <button
                        onClick={() => setInstrumentalMode('constant')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          instrumentalMode === 'constant' ? 'bg-indigo-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Constant
                      </button>
                      <button
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          instrumentalMode === 'caglioti' ? 'bg-indigo-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                          className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                        />
                        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">°2θ FWHM_inst</span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 0.05, 0.08, 0.12].map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setInstFwhm(val)}
                            className={`flex-1 py-1 rounded-lg border text-[9px] font-black transition-all ${instFwhm === val ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}
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
                            className="px-2 py-1 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 whitespace-nowrap"
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
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">V (tanθ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiV}
                            onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">W (const)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiW}
                            onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-1 shadow-inner text-xs">
                  <div className="text-slate-300 font-medium mb-1">Instrumental Variance Subtraction:</div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    W_sample(σ) = W_obs(σ) - W_inst
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight pt-1">
                    Corrects for instrumental geometry broadening before calculating slope K₁ and curvature K₂.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Advanced Corrections */}
            {expSubTab === 'corrections' && (
              <div className="space-y-4 relative z-10">
                {/* Lorentz-Polarization (L-P) Factor Toggle */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Lorentz-Polarization (L-P) Factor Correction
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Adjusts measured variances for angular scattering geometry
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyLPFactor(!applyLPFactor)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        applyLPFactor ? 'bg-indigo-500' : 'bg-white/10'
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
                        Monochromator Angle (2θ_m)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMonochromatorAngle(0)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-mono border ${
                            monochromatorAngle === 0 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
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
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
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
                      kAlpha2Correction ? 'bg-indigo-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        kAlpha2Correction ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Variance-Range Table Input Data */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-colors duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Variance vs Range Table</h3>
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
              Enter one row per integration range: <code className="text-indigo-300 bg-black/60 px-1.5 py-0.5 rounded font-mono shadow-inner border border-white/5 text-[11px]">sigma [deg], Variance W [deg²], mu4 [opt]</code>
            </p>

            <div className="relative group/textarea">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none group-focus-within/textarea:bg-indigo-500/10 transition-colors" />
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full p-4 bg-black/60 text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner relative z-10"
              />
            </div>

            {/* Input Counter */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-1">
              <span className="text-slate-400">Parsed range points: <strong className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{result?.points?.length || 0}</strong></span>
              {result && result.points.length >= 3 ? (
                <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready for Moment Regression
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Minimum 3 range points required
                </span>
              )}
            </div>
          </div>

          {/* Theoretical & Formula Guide Card */}
          <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/20 shadow-[0_8px_30px_rgba(99,102,241,0.05)] space-y-4 hover:border-indigo-500/40 transition-colors duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
              <Info className="w-4 h-4" />
              Methodology & Formula Guide
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed relative z-10">
              Evaluating profile variance <span className="font-mono text-indigo-300">W</span> against integration limits <span className="font-mono text-indigo-300">σ</span> yields a linear-quadratic regression:
            </p>
            <div 
              className="text-white text-xs sm:text-sm py-3 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner relative z-10"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'W(\\sigma) = W_0 + K_1 \\cdot \\sigma + K_2 \\cdot \\sigma^2',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] font-mono relative z-10">
              <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 space-y-1.5 hover:bg-indigo-500/10 transition-colors">
                <span className="text-indigo-400 font-bold block flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> 1. Volume Size (D_V)</span>
                <div 
                  className="text-slate-200 bg-black/40 py-1.5 px-2 rounded-lg text-center"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(
                      'D_V = \\frac{\\lambda}{\\pi^2 K_1 \\cos\\theta_0}',
                      { throwOnError: false, displayMode: false }
                    )
                  }}
                />
              </div>
              <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/20 space-y-1.5 hover:bg-purple-500/10 transition-colors">
                <span className="text-purple-400 font-bold block flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> 2. Microstrain (⟨ε²⟩¹/²)</span>
                <div 
                  className="text-slate-200 bg-black/40 py-1.5 px-2 rounded-lg text-center"
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
            <>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <ScientificMathControl
                  title="Variance-Range Analysis"
                  formula="W(\sigma) = W_0 + \frac{\lambda \sigma}{\pi^2 D_V \cos\theta_0} + 4 \langle\epsilon^2\rangle \tan^2\theta_0 \cdot \sigma^2"
                  description="Separates crystallite size and microstrain by analyzing profile variance W across integration ranges σ. Linear slope gives domain size, quadratic curvature gives strain."
                  variables={[
                    { symbol: 'D_V', name: 'Volume Size', value: convertLength(result.sizeNm * 10, lengthUnit), unit: lengthUnit },
                    { symbol: '⟨ε²⟩', name: 'Mean-Square Strain', value: (result.rmsStrain * result.rmsStrain) * 10000, unit: 'x10⁻⁴' },
                    { symbol: 'K_1', name: 'Linear Slope (Size)', value: result.slopeK1, unit: '' },
                    { symbol: 'K_2', name: 'Curvature (Strain)', value: result.quadraticK2, unit: '' }
                  ]}
                  result={convertLength(result.sizeNm * 10, lengthUnit)}
                  resultUnit={lengthUnit}
                  resultName="D_V (Volume Size)"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
              
              {/* Volume-Weighted Crystallite Size D_V */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.1)] relative overflow-hidden group hover:border-indigo-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Ruler className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                  </div>
                  <Award className="w-4 h-4 text-indigo-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    {result.sizeNm.toFixed(2)}
                  </span>
                  <span className="text-indigo-300 text-sm font-mono font-semibold">nm</span>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Length:</span> <span className="text-slate-200 font-bold">{(result.sizeNm * 10).toFixed(1)} Å</span></div>
                  <div className="flex justify-between"><span>Linear Slope K₁:</span> <span className="text-indigo-300 font-bold">{result.slopeK1.toExponential(3)}</span></div>
                </div>
              </div>

              {/* RMS Microstrain <e^2>^0.5 */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-purple-500/30 shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:border-purple-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">RMS Microstrain</span>
                  </div>
                  <Activity className="w-4 h-4 text-purple-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    {(result.rmsStrain * 100).toFixed(4)}
                  </span>
                  <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Curvature K₂:</span> <span className="text-purple-300 font-bold">{result.quadraticK2.toExponential(3)}</span></div>
                  <div className="flex justify-between"><span>&lt;ε²&gt;¹/²:</span> <span className="text-slate-200 font-bold">{result.rmsStrain.toExponential(3)}</span></div>
                </div>
              </div>

              {/* Fit Quality R² */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:border-emerald-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Regression R²</span>
                  </div>
                  <Layers className="w-4 h-4 text-emerald-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {(result.rSquared * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Intercept W₀:</span> <span className="text-emerald-300 font-bold">{result.interceptW0.toExponential(3)}</span></div>
                  <div className="flex justify-between"><span>Avg Kurtosis K:</span> <span className="text-slate-200 font-bold">{result.meanKurtosis.toFixed(2)}</span></div>
                </div>
              </div>
            </motion.div>
            </>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Data Points</p>
              <p className="text-xs text-slate-400">Provide at least 3 variance-range integration points (sigma, W) for moment analysis.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <AIAnalysis methodName="Method of Moments (Variance vs Range)" resultData={result} />
              <PythonCodeExporter 
                methodName="Method of Moments (Variance vs Range)"
                parameters={{
                  wavelength: Number(wavelength),
                  ranges: result.points.map(m => m.sigmaDeg),
                  variances: result.points.map(m => m.varianceDeg2)
                }}
              />
            </div>
          )}

          {/* Interactive Plot Tabs */}
          {result && (
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-indigo-500/30 transition-colors duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
              
              {/* Tab Selector Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('variancePlot')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border ${
                      activeTab === 'variancePlot'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-indigo-500/30 hover:text-indigo-200'
                    }`}
                  >
                    1. Variance W(σ) vs Range σ
                  </button>

                  <button
                    onClick={() => setActiveTab('reducedPlot')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border ${
                      activeTab === 'reducedPlot'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-purple-500/30 hover:text-purple-200'
                    }`}
                  >
                    2. Reduced Plot W/σ vs σ
                  </button>

                  <button
                    onClick={() => setActiveTab('generator')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border ${
                      activeTab === 'generator'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-cyan-500/30 hover:text-cyan-200'
                    }`}
                  >
                    3. Peak Profile Moments
                  </button>

                  <button
                    onClick={() => setActiveTab('kurtosis')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-inner border ${
                      activeTab === 'kurtosis'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-emerald-500/30 hover:text-emerald-200'
                    }`}
                  >
                    4. Kurtosis & 4th Moment
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-2 rounded-xl bg-black/40 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/20 text-xs font-mono flex items-center gap-1.5 transition-all shadow-inner"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  <button
                    onClick={handleCopyLaTeX}
                    className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono flex items-center gap-1.5 transition-all shadow-inner"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedNotification ? 'Copied LaTeX!' : 'LaTeX'}</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: W vs Sigma Plot */}
              {activeTab === 'variancePlot' && (
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Linear-Quadratic Fit: <strong className="text-indigo-400">W(σ) = W₀ + K₁·σ + K₂·σ²</strong></span>
                    <span className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-inner text-slate-400">R²: <strong className="text-emerald-400">{(result.rSquared * 100).toFixed(2)}%</strong></span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-indigo-500/40 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1.5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-indigo-400 font-bold border-b border-white/10 pb-2 relative z-10">
                                    Integration Range σ = {d.sigmaDeg}°
                                  </div>
                                  <div className="relative z-10">Observed Variance W: <span className="text-indigo-300 font-bold bg-indigo-500/10 px-1 py-0.5 rounded">{d.varianceDeg2.toFixed(6)} deg²</span></div>
                                  <div className="relative z-10">Fitted W(σ): <span className="text-purple-300">{d.fittedWDeg2?.toFixed(6)} deg²</span></div>
                                  <div className="relative z-10">Linear Size Part: <span className="text-indigo-200">{d.linearComponentDeg2?.toFixed(6)} deg²</span></div>
                                  <div className="relative z-10">Quadratic Strain Part: <span className="text-purple-200">{d.quadraticComponentDeg2?.toFixed(6)} deg²</span></div>
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

                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl text-xs text-indigo-200 leading-relaxed font-mono shadow-inner relative overflow-hidden group/interp">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[30px] pointer-events-none group-hover/interp:bg-indigo-500/20 transition-colors" />
                    <span className="font-bold text-indigo-300 block mb-1.5 flex items-center gap-1.5 relative z-10"><Info className="w-3.5 h-3.5" /> Physical Interpretation:</span>
                    <span className="relative z-10">{result.profileInterpretation}</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Reduced Plot W / Sigma vs Sigma */}
              {activeTab === 'reducedPlot' && (
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                      Reduced Variance Plot W(σ) / σ = (W₀ / σ) + K₁ + K₂ · σ
                    </span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-purple-500/40 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1.5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-purple-400 font-bold border-b border-white/10 pb-2 relative z-10">
                                    σ = {d.sigmaDeg}°
                                  </div>
                                  <div className="relative z-10">Observed W/σ: <span className="text-purple-300 font-bold bg-purple-500/10 px-1 py-0.5 rounded">{d.wOverSigmaObs.toFixed(6)} deg</span></div>
                                  <div className="relative z-10">Fitted W/σ: <span className="text-indigo-300">{d.wOverSigmaFit.toFixed(6)} deg</span></div>
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
                          strokeWidth={2.5}
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
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-3">
                    <div className="flex items-center gap-2 text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 shadow-inner">
                      <Cpu className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Analytical Line Profile Moments Generator</h4>
                    </div>
                    <button
                      onClick={handleLoadSyntheticToInput}
                      className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-400/50"
                    >
                      Load Computed Moments to Main Input
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner group/geninput">
                      <label className="block text-[11px] font-mono text-slate-300 mb-1.5 group-hover/geninput:text-cyan-300 transition-colors">
                        Centroid 2θ₀ [deg]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={synthCentroid}
                        onChange={(e) => setSynthCentroid(parseFloat(e.target.value) || 38.2)}
                        className="w-full px-3 py-2 bg-[#050C17] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50 hover:border-white/20 transition-colors"
                      />
                    </div>

                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner group/geninput">
                      <label className="block text-[11px] font-mono text-slate-300 mb-1.5 group-hover/geninput:text-cyan-300 transition-colors">
                        Profile FWHM [deg]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={synthFwhm}
                        onChange={(e) => setSynthFwhm(parseFloat(e.target.value) || 0.35)}
                        className="w-full px-3 py-2 bg-[#050C17] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50 hover:border-white/20 transition-colors"
                      />
                    </div>

                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-mono text-slate-300">
                          Pseudo-Voigt Mix η
                        </label>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold">
                          {synthMixingEta === 0 ? 'Gaussian' : synthMixingEta === 1 ? 'Lorentzian' : 'Voigt'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={synthMixingEta}
                        onChange={(e) => setSynthMixingEta(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 mt-2"
                      />
                    </div>
                  </div>

                  <div className="h-60 sm:h-72 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-cyan-500/40 p-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-cyan-400 font-bold border-b border-white/10 pb-1.5 relative z-10">σ = {d.sigmaDeg}°</div>
                                  <div className="relative z-10">Variance W: <span className="text-cyan-300 font-bold bg-cyan-500/10 px-1 py-0.5 rounded">{d.varianceDeg2.toFixed(6)} deg²</span></div>
                                  <div className="relative z-10">Kurtosis: <span className="text-slate-300">{d.kurtosis.toFixed(2)}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="varianceDeg2" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 4: Fourth Moment & Kurtosis Spectrum */}
              {activeTab === 'kurtosis' && (
                <div className="space-y-4 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 shadow-inner relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                      Profile Shape Kurtosis <strong className="text-emerald-400">K = μ₄ / W²</strong>
                    </span>
                    <span className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-inner text-slate-400">
                      Gaussian = 3.0, Lorentzian &gt; 3.0
                    </span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
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
                                <div className="bg-[#050C17]/95 border border-emerald-500/40 p-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md font-mono text-xs text-white space-y-1 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-[20px] pointer-events-none" />
                                  <div className="text-emerald-400 font-bold border-b border-white/10 pb-1.5 relative z-10">
                                    σ = {d.sigmaDeg}°
                                  </div>
                                  <div className="relative z-10">Kurtosis K: <span className="text-emerald-300 font-bold bg-emerald-500/10 px-1 py-0.5 rounded">{d.kurtosis?.toFixed(3) || 'N/A'}</span></div>
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
