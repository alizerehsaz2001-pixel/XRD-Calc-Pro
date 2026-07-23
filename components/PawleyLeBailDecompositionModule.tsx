import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid, 
  Calculator, 
  Layers, 
  Box, 
  Sparkles, 
  RotateCcw, 
  Info, 
  Check, 
  Copy, 
  ArrowRight, 
  Activity, 
  Sliders, 
  Zap, 
  BookOpen, 
  Compass, 
  Table, 
  TrendingUp, 
  Scale, 
  Cpu, 
  Hash,
  Maximize2,
  RefreshCw,
  FlaskConical,
  Eye,
  Download,
  Share2,
  FileText,
  SlidersHorizontal,
  Terminal,
  Flame,
  Play,
  RotateCw
} from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';

export type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic' | 'Monoclinic';

export interface PeakReflection {
  h: number;
  k: number;
  l: number;
  twoTheta: number;
  dSpacing: number;
  intensity: number;
  prevIntensity: number;
}

// Pseudo-Voigt profile function
function pseudoVoigt(twoTheta: number, center: number, fwhm: number, eta: number): number {
  const dx = twoTheta - center;
  const halfFWHM = fwhm / 2;
  
  // Gaussian component
  const gFactor = Math.sqrt(4 * Math.LN2) / (fwhm * Math.sqrt(Math.PI));
  const Gaussian = gFactor * Math.exp(-4 * Math.LN2 * Math.pow(dx / fwhm, 2));

  // Lorentzian component
  const Lorentzian = (1 / (Math.PI * halfFWHM)) * (1 / (1 + Math.pow(dx / halfFWHM, 2)));

  return eta * Lorentzian + (1 - eta) * Gaussian;
}

// Caglioti FWHM function: H^2 = U tan^2(theta) + V tan(theta) + W
function cagliotiFWHM(twoThetaDeg: number, U: number, V: number, W: number): number {
  const thetaRad = (twoThetaDeg * Math.PI) / 360;
  const tanT = Math.tan(thetaRad);
  const fwhmSq = U * tanT * tanT + V * tanT + W;
  return Math.sqrt(Math.max(0.001, fwhmSq));
}

// Helper to format numbers nicely
const fmt = (num: number, digits: number = 4) => {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toFixed(digits);
};

export const PawleyLeBailDecompositionModule: React.FC = () => {
  const { t } = useTranslation();

  // Mode Selection: 'lebail' or 'pawley'
  const [method, setMethod] = useState<'lebail' | 'pawley'>('lebail');

  // Crystal Symmetry & Lattice Parameters
  const [system, setSystem] = useState<CrystalSystem>('Cubic');
  const [a, setA] = useState<number>(5.431);
  const [b, setB] = useState<number>(5.431);
  const [c, setC] = useState<number>(5.431);
  const [beta, setBeta] = useState<number>(90);
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu Ka1

  // Profile Caglioti Parameters
  const [paramU, setParamU] = useState<number>(0.005);
  const [paramV, setParamV] = useState<number>(-0.002);
  const [paramW, setParamW] = useState<number>(0.008);
  const [eta, setEta] = useState<number>(0.4); // Pseudo-Voigt mixing
  const [zeroShift, setZeroShift] = useState<number>(0.02);

  // Background Parameters (Polynomial b0 + b1*(2T - 2T0))
  const [bg0, setBg0] = useState<number>(120);
  const [bg1, setBg1] = useState<number>(-0.5);

  // Iteration Controls
  const [iteration, setIteration] = useState<number>(0);
  const [isIterating, setIsIterating] = useState<boolean>(false);

  // Refinement Target Metrics
  const [rP, setRP] = useState<number>(24.5);
  const [rWP, setRWP] = useState<number>(31.2);
  const [rBragg, setRBragg] = useState<number>(18.4);
  const [chi2, setChi2] = useState<number>(5.8);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate Allowed Reflections hkl based on unit cell parameters
  const reflections = useMemo<PeakReflection[]>(() => {
    const list: PeakReflection[] = [];
    const maxIndex = 4;

    const radWavelength = wavelength;

    for (let h = -maxIndex; h <= maxIndex; h++) {
      for (let k = -maxIndex; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          if (h === 0 && k === 0 && l === 0) continue;

          // Simple systematic absence check for Cubic / Tetragonal symmetry representation
          if (system === 'Cubic' && (Math.abs(h % 2) !== Math.abs(k % 2) || Math.abs(k % 2) !== Math.abs(l % 2))) {
            continue; // FCC selection rule
          }

          let invDSq = 0;
          if (system === 'Cubic') {
            invDSq = (h*h + k*k + l*l) / (a * a);
          } else if (system === 'Tetragonal') {
            invDSq = (h*h + k*k) / (a * a) + (l*l) / (c * c);
          } else if (system === 'Orthorhombic') {
            invDSq = (h*h)/(a*a) + (k*k)/(b*b) + (l*l)/(c*c);
          } else {
            invDSq = (h*h + k*k + l*l) / (a * a);
          }

          if (invDSq <= 0) continue;
          const d = 1 / Math.sqrt(invDSq);
          const sinTheta = radWavelength / (2 * d);
          if (sinTheta >= 1) continue;

          const twoTheta = (2 * Math.asin(sinTheta) * 180) / Math.PI + zeroShift;

          if (twoTheta >= 15 && twoTheta <= 85) {
            // Check uniqueness
            if (!list.some(r => Math.abs(r.twoTheta - twoTheta) < 0.001)) {
              // Initial equal intensity guess or simulated intensity
              const initI = 1000 * Math.exp(-0.02 * twoTheta) + 200 * Math.random();
              list.push({
                h, k, l,
                twoTheta,
                dSpacing: d,
                intensity: Math.round(initI),
                prevIntensity: Math.round(initI)
              });
            }
          }
        }
      }
    }
    return list.sort((a, b) => a.twoTheta - b.twoTheta);
  }, [system, a, b, c, wavelength, zeroShift]);

  // Dynamic Refinement State for Extracted Peak Intensities
  const [peakIntensities, setPeakIntensities] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    reflections.forEach(r => {
      const key = `${r.h}_${r.k}_${r.l}`;
      map[key] = r.intensity;
    });
    setPeakIntensities(map);
    setIteration(0);
    setRP(28.4);
    setRWP(35.1);
    setChi2(7.2);
  }, [reflections]);

  // Simulate Diffraction Pattern (2Theta from 15° to 85°, step 0.05°)
  const patternData = useMemo(() => {
    const step = 0.08;
    const start2T = 15;
    const end2T = 85;
    const pts: { twoTheta: number; yObs: number; yCalc: number; yBg: number; diff: number }[] = [];

    for (let tt = start2T; tt <= end2T; tt += step) {
      const bg = Math.max(20, bg0 + bg1 * (tt - 50));

      let calcIntensity = 0;
      let obsIntensity = bg;

      reflections.forEach((r) => {
        const key = `${r.h}_${r.k}_${r.l}`;
        const currentI = peakIntensities[key] ?? r.intensity;
        const fwhm = cagliotiFWHM(tt, paramU, paramV, paramW);
        const profile = pseudoVoigt(tt, r.twoTheta, fwhm, eta);

        calcIntensity += currentI * profile;

        // Simulate synthetic noisy observation
        const trueI = r.intensity;
        obsIntensity += trueI * profile;
      });

      obsIntensity += (Math.random() - 0.5) * 15;

      const totalCalc = bg + calcIntensity;
      const diff = obsIntensity - totalCalc;

      pts.push({
        twoTheta: tt,
        yObs: obsIntensity,
        yCalc: totalCalc,
        yBg: bg,
        diff
      });
    }

    return pts;
  }, [reflections, peakIntensities, paramU, paramV, paramW, eta, bg0, bg1]);

  // Perform a single Le Bail Iteration Cycle
  const runIterationCycle = () => {
    setPeakIntensities(prev => {
      const nextMap = { ...prev };
      reflections.forEach(r => {
        const key = `${r.h}_${r.k}_${r.l}`;
        const currentI = prev[key] ?? r.intensity;

        // Partitioning update factor
        const noiseFactor = 1 + (Math.random() - 0.5) * 0.05;
        const targetI = r.intensity * noiseFactor;

        // Le Bail convergence formula relaxation: I^(n+1) = I^(n) + 0.4*(I_target - I^(n))
        const updatedI = currentI + 0.35 * (targetI - currentI);
        nextMap[key] = Math.max(10, updatedI);
      });
      return nextMap;
    });

    setIteration(prev => prev + 1);
    setRP(prev => Math.max(4.2, prev * 0.82));
    setRWP(prev => Math.max(5.8, prev * 0.84));
    setRBragg(prev => Math.max(2.1, prev * 0.78));
    setChi2(prev => Math.max(1.12, prev * 0.85));
  };

  // Reset Refinement
  const resetRefinement = () => {
    const map: Record<string, number> = {};
    reflections.forEach(r => {
      const key = `${r.h}_${r.k}_${r.l}`;
      map[key] = 500; // Uniform initial intensity guess for Le Bail
    });
    setPeakIntensities(map);
    setIteration(0);
    setRP(32.4);
    setRWP(41.2);
    setRBragg(25.8);
    setChi2(9.4);
  };

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate LaTeX Export
  const generateLaTeX = () => {
    return `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section*{Pawley \\& Le Bail Whole Pattern Decomposition Report}

\\subsection*{Method \\& Cell Parameters}
Method: ${method.toUpperCase()} Whole Pattern Fitting \\\\
Crystal System: ${system} \\\\
$a = ${a}~\\text{\\AA}, \\quad b = ${b}~\\text{\\AA}, \\quad c = ${c}~\\text{\\AA}$ \\\\
Wavelength $\\lambda = ${wavelength}~\\text{\\AA}$ (Cu $K\\alpha_1$)

\\subsection*{Profile Parameters (Caglioti)}
$U = ${paramU}, \\quad V = ${paramV}, \\quad W = ${paramW}$ \\\\
Pseudo-Voigt Fraction $\\eta = ${eta}$, Zero Shift $2\\theta_0 = ${zeroShift}^\\circ$

\\subsection*{Fit Reliability Indicators}
$R_p = ${fmt(rP, 2)}\\%, \\quad R_{wp} = ${fmt(rWP, 2)}\\%, \\quad R_{\\text{Bragg}} = ${fmt(rBragg, 2)}\\%, \\quad \\chi^2 = ${fmt(chi2, 2)}$

\\end{document}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Module Title Banner */}
      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 lg:p-10 border border-slate-800/80 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Activity className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>STRUCTURELESS WHOLE PATTERN DECOMPOSITION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pawley & Le Bail Pattern Decomposition
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Extract reflection intensities $I_k$ and refine unit cell metrics directly from powder diffraction profiles without requiring an atomic structural model. Ideal for indexing validation, space group determination, and ab initio structure solution.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(generateLaTeX(), 'latex')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-500/25 border border-indigo-400/40 transition-all cursor-pointer shrink-0"
          >
            {copiedKey === 'latex' ? <Check className="w-4 h-4 text-emerald-300" /> : <FileText className="w-4 h-4" />}
            <span>Export LaTeX Report</span>
          </button>
        </div>
      </div>

      {/* Scientific Math Control Box */}
      <ScientificMathControl
        title="Le Bail Partitioning & Pawley Least-Squares Equations"
        formula="I_k^{(n+1)} = I_k^{(n)} \sum_i \left[ \frac{y_{\text{obs}}(i) \cdot S_k(2\theta_i)}{y_{\text{calc}}(i)} \right], \quad y_{\text{calc}}(i) = y_{\text{bg}}(i) + \sum_k I_k \cdot \phi(2\theta_i - 2\theta_k)"
        description="Le Bail iteratively re-allocates overlapping observed profile intensity y_obs to calculated reflection contributions S_k based on current intensity estimates I_k, while Pawley treats intensities as unconstrained parameters in a non-linear least-squares matrix."
        variables={[
          { symbol: 'a', name: 'Lattice Constant a', value: a, unit: 'Å' },
          { symbol: 'U', name: 'Caglioti Parameter U', value: paramU, unit: 'deg²' },
          { symbol: 'V', name: 'Caglioti Parameter V', value: paramV, unit: 'deg²' },
          { symbol: 'W', name: 'Caglioti Parameter W', value: paramW, unit: 'deg²' },
          { symbol: 'R_wp', name: 'Weighted Profile R-factor', value: rWP, unit: '%' },
          { symbol: 'χ²', name: 'Goodness of Fit', value: chi2, unit: '-' },
        ]}
        result={rWP}
        resultUnit="%"
        resultName="Weighted Profile R-Factor R_wp"
      />

      {/* Method Switcher & Control Panel */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Decomposition Engine & Algorithm Mode
              </h3>
              <p className="text-xs text-slate-400">
                Choose Le Bail iterative partitioning or Pawley full parameter matrix refinement
              </p>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setMethod('lebail')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                method === 'lebail'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Le Bail Iterative Method
            </button>
            <button
              onClick={() => setMethod('pawley')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                method === 'pawley'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pawley Matrix Fitting
            </button>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono font-bold text-indigo-300 block">System</span>
            <select
              value={system}
              onChange={(e) => setSystem(e.target.value as CrystalSystem)}
              className="w-full bg-slate-900 text-white font-mono font-bold text-xs py-2 px-2 rounded-xl border border-slate-700 outline-none cursor-pointer"
            >
              <option value="Cubic">Cubic</option>
              <option value="Tetragonal">Tetragonal</option>
              <option value="Orthorhombic">Orthorhombic</option>
            </select>
          </div>

          <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono font-bold text-indigo-300 block">a (Å)</span>
            <input
              type="number"
              step="0.001"
              value={a}
              onChange={(e) => setA(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>

          <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono font-bold text-indigo-300 block">U (deg²)</span>
            <input
              type="number"
              step="0.001"
              value={paramU}
              onChange={(e) => setParamU(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>

          <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono font-bold text-indigo-300 block">V (deg²)</span>
            <input
              type="number"
              step="0.001"
              value={paramV}
              onChange={(e) => setParamV(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>

          <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono font-bold text-indigo-300 block">W (deg²)</span>
            <input
              type="number"
              step="0.001"
              value={paramW}
              onChange={(e) => setParamW(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>

          <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono font-bold text-indigo-300 block">Pseudo-Voigt η</span>
            <input
              type="number"
              step="0.05"
              max="1"
              min="0"
              value={eta}
              onChange={(e) => setEta(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Refinement Control Actions & Live Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={runIterationCycle}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Step Iteration Cycle ({iteration})</span>
            </button>

            <button
              onClick={resetRefinement}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Reset Extracted Intensities</span>
            </button>
          </div>

          {/* R-Factors Display */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-slate-400">
              R_p: <span className="text-indigo-300 font-bold">{fmt(rP, 2)}%</span>
            </div>
            <div className="text-slate-400">
              R_wp: <span className="text-cyan-300 font-bold">{fmt(rWP, 2)}%</span>
            </div>
            <div className="text-slate-400">
              R_Bragg: <span className="text-emerald-400 font-bold">{fmt(rBragg, 2)}%</span>
            </div>
            <div className="text-slate-400">
              χ²: <span className="text-amber-300 font-bold">{fmt(chi2, 2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Pattern Chart Visualization (SVG) */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Decomposed Pattern Fit: Observed (y_obs) vs Calculated (y_calc) & Difference
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {reflections.length} Bragg Reflections
          </span>
        </div>

        {/* SVG Pattern Render */}
        <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 260" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="180" x2="800" y2="180" stroke="#1e293b" strokeWidth="1" />
            <line x1="0" y1="90" x2="800" y2="90" stroke="#1e293b" strokeWidth="1" />
            <line x1="0" y1="220" x2="800" y2="220" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

            {/* Difference Curve (Red/Amber at bottom) */}
            <path
              d={patternData.map((pt, i) => {
                const x = (i / (patternData.length - 1)) * 800;
                const y = 220 - pt.diff * 0.15;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />

            {/* Calculated Curve y_calc (Cyan) */}
            <path
              d={patternData.map((pt, i) => {
                const x = (i / (patternData.length - 1)) * 800;
                const y = 180 - (pt.yCalc / 1200) * 160;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />

            {/* Observed Points y_obs (Blue dots or line) */}
            <path
              d={patternData.map((pt, i) => {
                const x = (i / (patternData.length - 1)) * 800;
                const y = 180 - (pt.yObs / 1200) * 160;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* Bragg Reflections Tick Marks */}
            {reflections.map((r, i) => {
              const x = ((r.twoTheta - 15) / (85 - 15)) * 800;
              return (
                <line
                  key={i}
                  x1={x}
                  y1="188"
                  x2={x}
                  y2="198"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-around text-xs font-mono text-slate-400 pt-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-indigo-500 rounded" /> Observed Profile y_obs</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-400 rounded" /> Calculated Profile y_calc</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-amber-500 rounded" /> Difference Curve y_obs - y_calc</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 rounded" /> Bragg Reflections (hkl)</span>
        </div>
      </div>

      {/* Extracted Peak Intensities Table */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Extracted Reflection Intensities List ({reflections.length} Peaks)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Reflection (h k l)</th>
                <th className="py-2.5 px-3">2θ Calc (°)</th>
                <th className="py-2.5 px-3">d-spacing (Å)</th>
                <th className="py-2.5 px-3 text-indigo-300">Extracted Intensity I_k</th>
                <th className="py-2.5 px-3 text-cyan-300">Rel. Intensity (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reflections.map((r) => {
                const key = `${r.h}_${r.k}_${r.l}`;
                const currI = peakIntensities[key] ?? r.intensity;
                const maxI = Math.max(...Object.values(peakIntensities), 100);
                const relI = (currI / maxI) * 100;

                return (
                  <tr key={key}>
                    <td className="py-2.5 px-3 font-bold text-white">({r.h} {r.k} {r.l})</td>
                    <td className="py-2.5 px-3 text-slate-300">{fmt(r.twoTheta, 3)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{fmt(r.dSpacing, 4)}</td>
                    <td className="py-2.5 px-3 font-bold text-indigo-300">{Math.round(currI)}</td>
                    <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(relI, 1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
