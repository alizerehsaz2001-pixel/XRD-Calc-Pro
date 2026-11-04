import React, { useState, useMemo } from 'react';
import { useSettings } from './SettingsContext';
import { 
  Rotate3d,
  Activity, 
  Beaker, 
  Layers, 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  CircleDot,
  Download,
  Code,
  Copy,
  Check,
  Award,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Disc3,
  Triangle,
  FileSpreadsheet,
  Upload,
  BookOpen
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CrystalSystemType, 
  TextureModelType, 
  processReflections, 
  calculateTextureMetrics, 
  PREFERRED_ORIENTATION_PRESETS,
  MaterialPreset
} from '../utils/preferredOrientationPhysics';
import { TexturePoleFigureVisualizer } from './preferred_orientation/TexturePoleFigureVisualizer';
import { Texture3DHabitNode } from './preferred_orientation/Texture3DHabitNode';
import { TextureIPFTriangleVisualizer } from './preferred_orientation/TextureIPFTriangleVisualizer';
import { TextureDebyeRingVisualizer } from './preferred_orientation/TextureDebyeRingVisualizer';
import { TextureLotgeringHarrisPanel } from './preferred_orientation/TextureLotgeringHarrisPanel';
import { TextureRefinementPanel } from './preferred_orientation/TextureRefinementPanel';
import { TextureCodeExporter } from './preferred_orientation/TextureCodeExporter';
import { TextureAIAdvisor } from './preferred_orientation/TextureAIAdvisor';
import { ScientificMathControl } from './ScientificMathControl';

export const PreferredOrientationModule: React.FC = () => {
  const { precision } = useSettings();
  
  // Educational & Help Banner State
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [activeVisualizationTab, setActiveVisualizationTab] = useState<'all' | 'pole' | 'habit' | 'ipf' | 'debye'>('all');

  // Texture Model selection
  const [textureModel, setTextureModel] = useState<TextureModelType>('March-Dollase');

  // Model Parameters
  const [rValue, setRValue] = useState<number>(0.35); // March-Dollase parameter r1
  const [r2Value, setR2Value] = useState<number>(1.85); // Secondary axis parameter r2
  const [fraction, setFraction] = useState<number>(1.0); // Fraction f1
  const [fraction2, setFraction2] = useState<number>(0.0); // Fraction f2
  const [c2Value, setC2Value] = useState<number>(0.6); // Harmonics C2
  const [c4Value, setC4Value] = useState<number>(-0.2); // Harmonics C4
  const [vmfKappa, setVmfKappa] = useState<number>(2.5); // Von Mises-Fisher kappa
  const [gaussianG, setGaussianG] = useState<number>(1.5); // Gaussian G

  // Habit Geometry Class
  const [habitModel, setHabitModel] = useState<'Platelet' | 'Needle' | 'Sheet' | 'Equiaxed'>('Platelet');

  // Crystal Symmetry & Lattice
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystemType>('Tetragonal');
  const [latticeA, setLatticeA] = useState<number>(5.15);
  const [latticeB, setLatticeB] = useState<number>(5.15);
  const [latticeC, setLatticeC] = useState<number>(7.39);
  const [primaryAxis, setPrimaryAxis] = useState<string>('0, 0, 1');
  const [secondaryAxis, setSecondaryAxis] = useState<string>('1, 0, 0');
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu Ka

  // Reflection Input Data: h, k, l, I_std, I_meas
  const [inputData, setInputData] = useState<string>(
    "0, 0, 1, 100, 245\n1, 0, 0, 80, 22\n1, 1, 0, 60, 18\n1, 1, 1, 90, 32\n0, 0, 2, 40, 102\n2, 0, 0, 30, 10"
  );

  // Quantitative Metric Settings
  const [lotgeringTargetFamily, setLotgeringTargetFamily] = useState<string>('00l');

  // Process Reflections
  const reflections = useMemo(() => {
    return processReflections(
      inputData,
      primaryAxis,
      secondaryAxis,
      crystalSystem,
      { a: latticeA, b: latticeB, c: latticeC },
      {
        model: textureModel,
        r1: rValue,
        r2: r2Value,
        f1: fraction,
        f2: fraction2,
        c2: c2Value,
        c4: c4Value,
        kappa: vmfKappa,
        g: gaussianG
      },
      wavelength
    );
  }, [
    inputData,
    primaryAxis,
    secondaryAxis,
    crystalSystem,
    latticeA,
    latticeB,
    latticeC,
    textureModel,
    rValue,
    r2Value,
    fraction,
    fraction2,
    c2Value,
    c4Value,
    vmfKappa,
    gaussianG,
    wavelength
  ]);

  // Compute Quantitative Texture Metrics
  const metrics = useMemo(() => {
    return calculateTextureMetrics(reflections, lotgeringTargetFamily);
  }, [reflections, lotgeringTargetFamily]);

  // Overall Goodness of Fit
  const { rwp, chiSquared } = useMemo(() => {
    if (reflections.length === 0) return { rwp: 0, chiSquared: 0 };
    let sumDiffSq = 0;
    let sumMeasSq = 0;
    let chiSq = 0;

    reflections.forEach(r => {
      const diff = r.iMeasured - r.iScaled;
      sumDiffSq += diff * diff;
      sumMeasSq += r.iMeasured * r.iMeasured;
      const varI = Math.max(r.iMeasured, 1.0);
      chiSq += (diff * diff) / varI;
    });

    const valRwp = sumMeasSq > 0 ? Math.sqrt(sumDiffSq / sumMeasSq) * 100 : 0;
    return { rwp: valRwp, chiSquared: chiSq };
  }, [reflections]);

  // Chart View Mode: 'bars' (Intensity Bar Comparison) or 'odf_curve' (P(alpha) vs Interplanar Angle alpha 0-90°)
  const [chartViewMode, setChartViewMode] = useState<'bars' | 'odf_curve'>('bars');

  // Quick-add reflection row state
  const [newH, setNewH] = useState<number>(1);
  const [newK, setNewK] = useState<number>(0);
  const [newL, setNewL] = useState<number>(2);
  const [newIStd, setNewIStd] = useState<number>(50);
  const [newIObs, setNewIObs] = useState<number>(45);

  // Continuous P(alpha) ODF Curve Data (0° to 90°) + active reflection scatter overlay
  const odfCurveData = useMemo(() => {
    const pts: {
      alpha: number;
      pModel: number;
      pIsotropic: number;
    }[] = [];
    for (let a = 0; a <= 90; a += 2) {
      let pVal = 1.0;
      const rad = (a * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      if (textureModel === 'March-Dollase' || textureModel === 'Bimodal-March-Dollase') {
        const term1 = rValue * rValue * cosA * cosA + (sinA * sinA) / Math.max(0.01, rValue);
        const md1 = term1 > 0 ? Math.pow(term1, -1.5) : 1.0;
        if (textureModel === 'Bimodal-March-Dollase') {
          const term2 = r2Value * r2Value * cosA * cosA + (sinA * sinA) / Math.max(0.01, r2Value);
          const md2 = term2 > 0 ? Math.pow(term2, -1.5) : 1.0;
          const fRand = Math.max(0, 1.0 - fraction - fraction2);
          pVal = fraction * md1 + fraction2 * md2 + fRand;
        } else {
          pVal = fraction * md1 + (1.0 - fraction);
        }
      } else if (textureModel === 'Jarvinen-Harmonics') {
        const x2 = cosA * cosA;
        const x4 = x2 * x2;
        const p2 = 0.5 * (3 * x2 - 1);
        const p4 = 0.125 * (35 * x4 - 30 * x2 + 3);
        const harm = Math.max(0.01, 1.0 + c2Value * p2 + c4Value * p4);
        pVal = fraction * harm + (1.0 - fraction);
      } else if (textureModel === 'Von-Mises-Fisher') {
        const k = Math.max(0.01, vmfKappa);
        const vmf = k > 50 ? k * Math.exp(k * (cosA - 1)) : (k / (2 * Math.sinh(k))) * Math.exp(k * cosA);
        pVal = fraction * vmf + (1.0 - fraction);
      }

      pts.push({
        alpha: a,
        pModel: parseFloat(pVal.toFixed(4)),
        pIsotropic: 1.0
      });
    }
    return pts;
  }, [textureModel, rValue, r2Value, fraction, fraction2, c2Value, c4Value, vmfKappa]);

  // Handle Preset Selection
  const applyPreset = (preset: MaterialPreset) => {
    setTextureModel(preset.model);
    setPrimaryAxis(preset.primaryAxis);
    if (preset.secondaryAxis) setSecondaryAxis(preset.secondaryAxis);
    setCrystalSystem(preset.crystalSystem);
    setLatticeA(preset.lattice.a);
    setLatticeB(preset.lattice.b);
    setLatticeC(preset.lattice.c);
    setRValue(preset.r1);
    if (preset.r2 !== undefined) setR2Value(preset.r2);
    setFraction(preset.f1);
    if (preset.f2 !== undefined) setFraction2(preset.f2);
    setInputData(preset.data);
    if (preset.r1 < 1.0) setHabitModel('Platelet');
    else if (preset.r1 > 1.0) setHabitModel('Needle');
    else setHabitModel('Equiaxed');
  };

  // Handle Refinement Application
  const handleApplyRefinedParams = (params: {
    r1: number;
    f1: number;
    r2?: number;
    f2?: number;
    c2?: number;
    c4?: number;
    kappa?: number;
  }) => {
    setRValue(params.r1);
    setFraction(params.f1);
    if (params.r2 !== undefined) setR2Value(params.r2);
    if (params.f2 !== undefined) setFraction2(params.f2);
    if (params.c2 !== undefined) setC2Value(params.c2);
    if (params.c4 !== undefined) setC4Value(params.c4);
    if (params.kappa !== undefined) setVmfKappa(params.kappa);
    if (params.r1 < 1.0) setHabitModel('Platelet');
    else if (params.r1 > 1.0) setHabitModel('Needle');
  };

  const handleAddReflectionRow = () => {
    const newLine = `${newH}, ${newK}, ${newL}, ${newIStd}, ${newIObs}`;
    setInputData((prev) => (prev.trim() ? `${prev.trim()}\n${newLine}` : newLine));
  };

  const handleExportReflectionsCSV = () => {
    if (reflections.length === 0) return;
    const header = "Plane (hkl),2Theta (deg),d-spacing (A),Interplanar Angle alpha (deg),Correction P(alpha),I_std,I_obs,I_calc,Residual,Harris TC\n";
    const rows = reflections
      .map((r) =>
        `"${r.hkl}",${(r.twoTheta ?? 0).toFixed(2)},${(r.dSpacing ?? 0).toFixed(4)},${r.angleAlpha.toFixed(2)},${r.correctionFactor.toFixed(4)},${r.iStandard},${r.iMeasured},${r.iScaled.toFixed(2)},${r.residual.toFixed(2)},${r.harrisTC.toFixed(3)}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `preferred_orientation_${crystalSystem}_${primaryAxis.replace(/[,\s]+/g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-teal-500 to-indigo-600 text-white rounded-2xl shadow-lg">
              <Rotate3d className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                  Preferred Orientation &amp; Crystallographic Texture Engine
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  March-Dollase &amp; ODF Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quantitative texture metrology, pole figure mapping, inverse pole figures, 2D Debye rings, and Rietveld refinement integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-teal-500" />
              {showGuide ? 'Hide Theory Guide' : 'Theory & Equations'}
            </button>
          </div>
        </div>

        {/* Expandable Theory Guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-1.5">
                  <h4 className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> March-Dollase Distribution (1986)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Calculates intensity redistribution in fiber-textured powders:
                  </p>
                  <div className="p-2 bg-white dark:bg-slate-950 rounded-lg font-mono text-[11px] text-teal-600 dark:text-teal-300">
                    P(α) = (r² cos²α + sin²α / r)<sup>-3/2</sup>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    • <strong>r &lt; 1.0</strong>: Platelet habit (basal planes enhanced)<br />
                    • <strong>r = 1.0</strong>: Isotropic random powder<br />
                    • <strong>r &gt; 1.0</strong>: Needle/acicular habit (prism planes enhanced)
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-1.5">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Lotgering Orientation Factor (F)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Measures degree of crystallographic alignment along a chosen (hkl) family:
                  </p>
                  <div className="p-2 bg-white dark:bg-slate-950 rounded-lg font-mono text-[11px] text-indigo-600 dark:text-indigo-300">
                    F = (p - p₀) / (1 - p₀)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    where p = ΣI(00l)/ΣI(hkl) for oriented sample and p₀ is the random powder standard ratio.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-1.5">
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" /> Harris Texture Coefficient (TC)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    ASTM standard relative orientation index for each individual reflection:
                  </p>
                  <div className="p-2 bg-white dark:bg-slate-950 rounded-lg font-mono text-[11px] text-purple-600 dark:text-purple-300">
                    TC(hkl) = (I_i / I0_i) / [1/N Σ(I_j / I0_j)]
                  </div>
                  <p className="text-[11px] text-slate-500">
                    TC &gt; 1 indicates enhanced reflection intensity due to crystallite alignment.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Curated Material Presets Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Curated Materials &amp; Thin-Film Presets
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {PREFERRED_ORIENTATION_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/30 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-left cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 truncate">
                  {p.name.split('(')[0]}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>[{p.primaryAxis}]</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">r={p.r1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Parameters & Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Parameters & Crystal Symmetry */}
        <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl space-y-5 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-50 dark:bg-teal-500/10 rounded-lg border border-teal-200 dark:border-teal-500/20">
                <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Texture Model &amp; Symmetry
              </h3>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Orientation Model:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['March-Dollase', 'Bimodal-March-Dollase', 'Jarvinen-Harmonics', 'Von-Mises-Fisher'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setTextureModel(m)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    textureModel === m
                      ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                      : 'bg-white dark:bg-black/60 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {m === 'March-Dollase' ? 'March-Dollase' : m === 'Bimodal-March-Dollase' ? 'Bimodal Dual-Axis' : m === 'Jarvinen-Harmonics' ? 'ODF Harmonics' : 'Von Mises-Fisher'}
                </button>
              ))}
            </div>
          </div>

          {/* Crystal Symmetry & Lattice */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                  Crystal System:
                </label>
                <select
                  value={crystalSystem}
                  onChange={(e) => setCrystalSystem(e.target.value as any)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="Cubic">Cubic</option>
                  <option value="Tetragonal">Tetragonal</option>
                  <option value="Hexagonal">Hexagonal</option>
                  <option value="Orthorhombic">Orthorhombic</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                  Primary Axis [hkl]:
                </label>
                <input
                  type="text"
                  value={primaryAxis}
                  onChange={(e) => setPrimaryAxis(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Lattice Constants a, b, c & X-Ray Anode Wavelength */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-0.5">a (Å)</label>
                <input
                  type="number"
                  step="0.01"
                  value={latticeA}
                  onChange={(e) => setLatticeA(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-0.5">b (Å)</label>
                <input
                  type="number"
                  step="0.01"
                  value={latticeB}
                  onChange={(e) => setLatticeB(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-0.5">c (Å)</label>
                <input
                  type="number"
                  step="0.01"
                  value={latticeC}
                  onChange={(e) => setLatticeC(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 block mb-0.5">
                X-Ray Source Wavelength λ (Å):
              </label>
              <select
                value={wavelength}
                onChange={(e) => setWavelength(parseFloat(e.target.value))}
                className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-800 dark:text-slate-200"
              >
                <option value={1.54056}>Cu Kα₁ (1.54056 Å)</option>
                <option value={1.78897}>Co Kα₁ (1.78897 Å)</option>
                <option value={0.7093}>Mo Kα₁ (0.70930 Å)</option>
                <option value={2.2897}>Cr Kα₁ (2.28970 Å)</option>
              </select>
            </div>
          </div>

          {/* Model Sliders */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/5">
            {(textureModel === 'March-Dollase' || textureModel === 'Bimodal-March-Dollase') && (
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">March Parameter r₁:</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 tabular-nums">{rValue.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="4.0"
                  step="0.01"
                  value={rValue}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setRValue(val);
                    if (val < 1.0) setHabitModel('Platelet');
                    else if (val > 1.0) setHabitModel('Needle');
                  }}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>0.05 (Platelet)</span>
                  <span>1.0 (Random)</span>
                  <span>4.0 (Needle)</span>
                </div>
              </div>
            )}

            {textureModel === 'Jarvinen-Harmonics' && (
              <div className="p-3 bg-white dark:bg-black/60 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
                <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 block">
                  Järvinen Spherical Harmonics (Legendre P₂, P₄)
                </span>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-0.5">
                    <span>2nd-Order Harmonic C₂:</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 tabular-nums">{c2Value.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.5"
                    max="3.0"
                    step="0.05"
                    value={c2Value}
                    onChange={(e) => setC2Value(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-0.5">
                    <span>4th-Order Harmonic C₄:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">{c4Value.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.5"
                    max="2.5"
                    step="0.05"
                    value={c4Value}
                    onChange={(e) => setC4Value(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {textureModel === 'Von-Mises-Fisher' && (
              <div className="p-3 bg-white dark:bg-black/60 rounded-xl border border-slate-200 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 block">
                  Von Mises-Fisher Spherical Concentration
                </span>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-0.5">
                    <span>Concentration κ (Kappa):</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 tabular-nums">{vmfKappa.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="12.0"
                    step="0.1"
                    value={vmfKappa}
                    onChange={(e) => setVmfKappa(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>0.05 (Isotropic)</span>
                    <span>4.0 (Moderate)</span>
                    <span>12.0 (Sharp Fiber)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fraction f1 */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Oriented Volume Fraction f₁:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">{(fraction * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={fraction}
                onChange={(e) => setFraction(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Bimodal Secondary Axis */}
            {textureModel === 'Bimodal-March-Dollase' && (
              <div className="p-3 bg-white dark:bg-black/60 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 block">
                  Secondary Texture Component
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Secondary Axis [hkl]:</label>
                  <input
                    type="text"
                    value={secondaryAxis}
                    onChange={(e) => setSecondaryAxis(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-0.5">
                    <span>Parameter r₂:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 tabular-nums">{r2Value.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="4.0"
                    step="0.05"
                    value={r2Value}
                    onChange={(e) => setR2Value(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-0.5">
                    <span>Secondary Fraction f₂:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 tabular-nums">{(fraction2 * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max={Math.max(0, 1.0 - fraction)}
                    step="0.02"
                    value={Math.min(fraction2, Math.max(0, 1.0 - fraction))}
                    onChange={(e) => setFraction2(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right: Interactive 4-Way Crystallographic Visualization Canvas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visualizer Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-black/40 p-2 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              {(['all', 'pole', 'habit', 'ipf', 'debye'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveVisualizationTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeVisualizationTab === tab
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'Quad Studio View' : tab === 'pole' ? 'Pole Figure' : tab === 'habit' ? '3D Habit' : tab === 'ipf' ? 'IPF Triangle' : '2D Debye Rings'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">R_wp:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{rwp.toFixed(2)}%</strong>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Lotgering F:</span>
              <strong className="text-teal-600 dark:text-teal-400 font-bold">{metrics.lotgeringF.toFixed(3)}</strong>
            </div>
          </div>

          {/* Visualization Grid */}
          <div className={`grid gap-6 ${activeVisualizationTab === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {(activeVisualizationTab === 'all' || activeVisualizationTab === 'pole') && (
              <TexturePoleFigureVisualizer
                rValue={rValue}
                r2Value={r2Value}
                fraction={fraction}
                textureModel={textureModel}
                primaryAxis={primaryAxis}
                secondaryAxis={secondaryAxis}
                c2Value={c2Value}
                c4Value={c4Value}
                vmfKappa={vmfKappa}
              />
            )}

            {(activeVisualizationTab === 'all' || activeVisualizationTab === 'habit') && (
              <Texture3DHabitNode
                rValue={rValue}
                habitModel={habitModel}
                primaryAxis={primaryAxis}
              />
            )}

            {(activeVisualizationTab === 'all' || activeVisualizationTab === 'ipf') && (
              <TextureIPFTriangleVisualizer
                rValue={rValue}
                fraction={fraction}
                crystalSystem={crystalSystem}
                primaryAxis={primaryAxis}
              />
            )}

            {(activeVisualizationTab === 'all' || activeVisualizationTab === 'debye') && (
              <TextureDebyeRingVisualizer
                reflections={reflections}
                rValue={rValue}
                fraction={fraction}
              />
            )}
          </div>
        </div>
      </div>

      {/* Live Diffraction Reflection Intensity & ODF Angular Profile Comparison */}
      <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 shadow-inner">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                {chartViewMode === 'bars'
                  ? 'Diffraction Reflection Matrix & Profile Residuals'
                  : 'Orientation Distribution Function P(α) vs. Interplanar Angle α'}
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                {chartViewMode === 'bars'
                  ? 'Comparison of Random Standard (I₀), Texture-Corrected Model (I_calc), and Observed Peak Intensities (I_obs)'
                  : `Theoretical pole density multiplier P(α) from α = 0° (parallel to [${primaryAxis}]) to α = 90° (transverse)`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
              <button
                onClick={() => setChartViewMode('bars')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'bars'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Intensity Spectrum (I₀ / I_calc / I_obs)
              </button>
              <button
                onClick={() => setChartViewMode('odf_curve')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'odf_curve'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                P(α) Angular ODF Curve (0°–90°)
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-300">
                R_wp: <strong>{rwp.toFixed(2)}%</strong>
              </div>
              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-700 dark:text-amber-300">
                χ²: <strong>{chiSquared.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-72 w-full mt-2">
          {chartViewMode === 'bars' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reflections} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="hkl" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="iStandard" name="Random Standard I₀" fill="#64748b" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="iScaled" name="Texture Model I_calc" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                <Bar dataKey="iMeasured" name="Observed Peak I_obs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={odfCurveData} margin={{ top: 10, right: 24, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="alpha"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                  tickFormatter={(v) => `${v}°`}
                />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' ? `${value.toFixed(3)} MUD` : value,
                    name
                  ]}
                  labelFormatter={(label) => `Interplanar Angle α = ${label}°`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="pIsotropic"
                  name="Isotropic Random Baseline (P = 1.0)"
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="pModel"
                  name={`${textureModel} Distribution P(α)`}
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quantitative Texture Metrology Panel (Lotgering & Harris) */}
      <TextureLotgeringHarrisPanel
        metrics={metrics}
        reflections={reflections}
        targetFamily={lotgeringTargetFamily}
        onTargetFamilyChange={(fam) => setLotgeringTargetFamily(fam)}
      />

      {/* Parameter Refinement Studio */}
      <TextureRefinementPanel
        reflections={reflections}
        textureModel={textureModel}
        currentR1={rValue}
        currentR2={r2Value}
        currentF1={fraction}
        currentF2={fraction2}
        currentC2={c2Value}
        currentC4={c4Value}
        currentKappa={vmfKappa}
        onApplyRefinedParams={handleApplyRefinedParams}
      />

      {/* Experimental Data Matrix Editor */}
      <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-200 dark:border-teal-500/20 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                Experimental Diffraction Reflection Matrix
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Click any plane row to set it as the primary texture axis <code>[H K L]</code>, or append new reflections below
              </p>
            </div>
          </div>

          <button
            onClick={handleExportReflectionsCSV}
            disabled={reflections.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export Matrix CSV
          </button>
        </div>

        {/* Quick-Add Reflection Bar */}
        <div className="mb-4 p-3 bg-white dark:bg-black/50 rounded-xl border border-slate-200 dark:border-white/5 flex flex-wrap items-end gap-2.5 font-mono">
          <div className="text-[10px] font-bold uppercase text-slate-500 mr-1 self-center">
            Quick-Append Reflection:
          </div>
          {[
            { label: 'h', val: newH, set: setNewH, step: 1 },
            { label: 'k', val: newK, set: setNewK, step: 1 },
            { label: 'l', val: newL, set: setNewL, step: 1 },
            { label: 'I_std', val: newIStd, set: setNewIStd, step: 5 },
            { label: 'I_obs', val: newIObs, set: setNewIObs, step: 5 },
          ].map((fld) => (
            <div key={fld.label} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold">{fld.label}:</span>
              <input
                type="number"
                step={fld.step}
                value={fld.val}
                onChange={(e) => fld.set(parseFloat(e.target.value) || 0)}
                className="w-12 text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 outline-none text-center tabular-nums"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddReflectionRow}
            className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            + Add Reflection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Raw Reflection Table Input (<code>h, k, l, I_std, I_obs</code>):
            </label>
            <textarea
              rows={9}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="0, 0, 1, 100, 245&#10;1, 0, 0, 80, 22"
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Interactive Formatted Table */}
          <div className="md:col-span-2 overflow-x-auto max-h-72 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/60 shadow-inner">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="p-2.5">Plane (hkl)</th>
                  <th className="p-2.5 text-right">2θ (°)</th>
                  <th className="p-2.5 text-right">d (Å)</th>
                  <th className="p-2.5 text-right">Angle α</th>
                  <th className="p-2.5 text-right">P(α)</th>
                  <th className="p-2.5 text-right">I_std</th>
                  <th className="p-2.5 text-right">I_obs</th>
                  <th className="p-2.5 text-right">I_calc</th>
                  <th className="p-2.5 text-right">Harris TC</th>
                  <th className="p-2.5 text-right">Axis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {reflections.map((r, idx) => {
                  const isPrimaryAxis = r.angleAlpha < 0.5;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setPrimaryAxis(`${r.h}, ${r.k}, ${r.l}`)}
                      className={`transition-colors cursor-pointer ${
                        isPrimaryAxis
                          ? 'bg-teal-500/10 hover:bg-teal-500/15'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}
                      title={`Click to set [${r.h}, ${r.k}, ${r.l}] as Primary Preferred Orientation Axis`}
                    >
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {r.hkl}
                      </td>
                      <td className="p-2.5 text-right text-slate-500 tabular-nums">
                        {(r.twoTheta ?? 0).toFixed(1)}°
                      </td>
                      <td className="p-2.5 text-right text-slate-500 tabular-nums">
                        {(r.dSpacing ?? 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                        {r.angleAlpha.toFixed(1)}°
                      </td>
                      <td className="p-2.5 text-right text-teal-600 dark:text-teal-400 font-bold tabular-nums">
                        {r.correctionFactor.toFixed(3)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500 tabular-nums">{r.iStandard}</td>
                      <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                        {r.iMeasured}
                      </td>
                      <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {r.iScaled.toFixed(1)}
                      </td>
                      <td className="p-2.5 text-right text-purple-600 dark:text-purple-400 font-bold tabular-nums">
                        {r.harrisTC.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isPrimaryAxis
                              ? 'bg-teal-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-teal-500'
                          }`}
                        >
                          {isPrimaryAxis ? 'Active' : 'Set [HKL]'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Script & Code Exporter */}
      <TextureCodeExporter
        primaryAxis={primaryAxis}
        rValue={rValue}
        fraction={fraction}
        reflections={reflections}
        metrics={metrics}
      />

      {/* Gemini AI Crystallographic Advisor */}
      <TextureAIAdvisor
        textureModel={textureModel}
        primaryAxis={primaryAxis}
        secondaryAxis={secondaryAxis}
        rValue={rValue}
        r2Value={r2Value}
        fraction={fraction}
        crystalSystem={crystalSystem}
        lattice={{ a: latticeA, b: latticeB, c: latticeC }}
        metrics={metrics}
        reflections={reflections}
        rwp={rwp}
        chiSquared={chiSquared}
      />
    </div>
  );
};
