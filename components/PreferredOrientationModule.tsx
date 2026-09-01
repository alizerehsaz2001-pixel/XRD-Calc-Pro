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
  const handleApplyRefinedParams = (r1: number, f1: number, r2?: number, f2?: number) => {
    setRValue(r1);
    setFraction(f1);
    if (r2 !== undefined) setR2Value(r2);
    if (f2 !== undefined) setFraction2(f2);
    if (r1 < 1.0) setHabitModel('Platelet');
    else if (r1 > 1.0) setHabitModel('Needle');
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

            {/* Lattice Constants a, b, c */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-0.5">a (Å)</label>
                <input
                  type="number"
                  step="0.01"
                  value={latticeA}
                  onChange={(e) => setLatticeA(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-0.5">b (Å)</label>
                <input
                  type="number"
                  step="0.01"
                  value={latticeB}
                  onChange={(e) => setLatticeB(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-0.5">c (Å)</label>
                <input
                  type="number"
                  step="0.01"
                  value={latticeC}
                  onChange={(e) => setLatticeC(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5"
                />
              </div>
            </div>
          </div>

          {/* Model Sliders */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/5">
            {/* Primary March Parameter r1 */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">March Parameter r₁:</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">{rValue.toFixed(3)}</span>
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

            {/* Fraction f1 */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Oriented Fraction f₁:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{(fraction * 100).toFixed(0)}%</span>
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
                    <span className="font-mono text-purple-600 dark:text-purple-400">{r2Value.toFixed(2)}</span>
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

      {/* Live Diffraction Reflection Intensity & Residual Profile Comparison */}
      <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 shadow-inner">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                Diffraction Reflection Matrix &amp; Profile Residuals
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Comparison of Random Standard (I₀), Texture-Corrected Model (I_calc), and Observed Peak Intensities (I_obs)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-300">
              R_wp: <strong>{rwp.toFixed(2)}%</strong>
            </div>
            <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-700 dark:text-amber-300">
              χ²: <strong>{chiSquared.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full mt-2">
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
                Paste or edit peak reflection lines: <code>h, k, l, I_std, I_obs</code>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Raw Reflection Table Input:
            </label>
            <textarea
              rows={8}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="0, 0, 1, 100, 245&#10;1, 0, 0, 80, 22"
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Interactive Formatted Table */}
          <div className="md:col-span-2 overflow-x-auto max-h-60 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/60 shadow-inner">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Plane (hkl)</th>
                  <th className="p-2.5">Angle α (°)</th>
                  <th className="p-2.5">P(α)</th>
                  <th className="p-2.5">I_std</th>
                  <th className="p-2.5">I_obs</th>
                  <th className="p-2.5">I_calc</th>
                  <th className="p-2.5">Harris TC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {reflections.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{r.hkl}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.angleAlpha.toFixed(1)}°</td>
                    <td className="p-2.5 text-teal-600 dark:text-teal-400 font-bold">{r.correctionFactor.toFixed(3)}</td>
                    <td className="p-2.5 text-slate-500">{r.iStandard}</td>
                    <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-bold">{r.iMeasured}</td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400">{r.iScaled.toFixed(1)}</td>
                    <td className="p-2.5 text-purple-600 dark:text-purple-400 font-bold">{r.harrisTC.toFixed(2)}</td>
                  </tr>
                ))}
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
