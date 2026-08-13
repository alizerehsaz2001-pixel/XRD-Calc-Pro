import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  XRRLayer,
  XRRSimulationConfig,
  XRRDataPoint,
  SLDPoint,
  MATERIAL_PRESETS,
  calculateReflectivityCurve,
  calculateSLDProfile,
  analyzeKiessigFringes,
  detectCriticalAngle,
  calculateFitQuality,
  generatePythonXRRScript,
  calculateSuperlatticeBraggPeaks,
  estimateOpticalConstantsFromFormula,
  KiessigAnalysisResult,
  CriticalAngleResult,
  SuperlatticePeak
} from '../utils/xrrPhysics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import {
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Upload,
  Info,
  Sliders,
  Activity,
  Zap,
  Sparkles,
  ChevronDown,
  Check,
  Code,
  Terminal,
  BarChart3,
  BookOpen,
  ArrowRight,
  Maximize2,
  Copy,
  Eye,
  SlidersHorizontal,
  Flame,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Wand2,
  X,
  RotateCcw,
  Palette
} from 'lucide-react';

export const XRRModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he' || i18n.language === 'fa' || i18n.language === 'ar';

  // Config State
  const [config, setConfig] = useState<XRRSimulationConfig>({
    wavelength: 1.5406,      // Cu K-alpha
    angleStart: 0.05,        // deg
    angleEnd: 4.0,           // deg
    angleStep: 0.005,        // deg
    angleUnit: 'theta',
    beamDivergence: 0.01,    // deg
    background: 1e-7,
    roughnessModel: 'nevot-croce',
    intensityScale: 1.0,
    angleOffset: 0.0
  });

  // Multilayer Stack State
  // Film layers followed by Substrate at bottom (last item)
  const [layers, setLayers] = useState<XRRLayer[]>([
    {
      id: 'layer-1',
      name: 'SiO2 Oxide Film',
      thickness: 250,        // 250 Å (25 nm)
      roughness: 4.5,        // 4.5 Å RMS roughness
      density: 2.20,         // g/cm³
      delta: 7.15,           // × 10⁻⁶
      beta: 0.155,
      color: '#06b6d4'
    },
    {
      id: 'substrate',
      name: 'Silicon Substrate',
      thickness: 0,          // Semi-infinite substrate
      roughness: 3.0,        // 3.0 Å substrate roughness
      density: 2.33,
      delta: 7.56,
      beta: 0.173,
      color: '#3b82f6'
    }
  ]);

  // Active Tab View
  const [activeTab, setActiveTab] = useState<'reflectivity' | 'sld' | 'fittings' | 'python' | 'theory'>('reflectivity');

  // Experimental Data State
  const [expDataRaw, setExpDataRaw] = useState<string>('');
  const [expData, setExpData] = useState<{ angle: number; intensity: number }[] | null>(null);
  const [showExpModal, setShowExpModal] = useState<boolean>(false);

  // Auto-Fitting Optimization State
  const [isFitting, setIsFitting] = useState<boolean>(false);
  const [fitProgress, setFitProgress] = useState<number>(0);
  const [fitOptions, setFitOptions] = useState({
    fitThickness: true,
    fitRoughness: true,
    fitDensity: true
  });

  // Python Code View State
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

  // Selected Preset Name
  const [selectedPreset, setSelectedPreset] = useState<string>('SiO2/Si Oxide Film');

  // Superlattice Multilayer Generator Modal State
  const [showSLModal, setShowSLModal] = useState<boolean>(false);
  const [slMatA, setSlMatA] = useState<string>('Molybdenum (Mo)');
  const [slThickA, setSlThickA] = useState<number>(35);
  const [slMatB, setSlMatB] = useState<string>('Silicon (Si)');
  const [slThickB, setSlThickB] = useState<number>(45);
  const [slRepeats, setSlRepeats] = useState<number>(5);
  const [slCapMat, setSlCapMat] = useState<string>('Gold (Au)');
  const [slCapThick, setSlCapThick] = useState<number>(30);
  const [slSubstrate, setSlSubstrate] = useState<string>('Silicon (Si)');

  // Hovered layer in visual graphic
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Stack Summary Calculations
  const filmLayersOnly = useMemo(() => layers.slice(0, layers.length - 1), [layers]);
  const totalFilmThickness = useMemo(() => filmLayersOnly.reduce((acc, l) => acc + l.thickness, 0), [filmLayersOnly]);
  const totalFilmThicknessNm = useMemo(() => (totalFilmThickness / 10).toFixed(1), [totalFilmThickness]);

  // Load Preset Structures
  const handleLoadPresetStructure = (presetKey: string) => {
    setSelectedPreset(presetKey);
    switch (presetKey) {
      case 'SiO2/Si Oxide Film':
        setLayers([
          { id: '1', name: 'SiO2 Oxide Film', thickness: 250, roughness: 4.5, density: 2.20, delta: 7.15, beta: 0.155, color: '#06b6d4' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
      case 'HfO2/SiO2/Si High-K Gate Stack':
        setLayers([
          { id: '1', name: 'HfO2 High-K Film', thickness: 80, roughness: 5.0, density: 9.68, delta: 28.5, beta: 3.82, color: '#f59e0b' },
          { id: '2', name: 'SiO2 Interlayer', thickness: 20, roughness: 3.5, density: 2.20, delta: 7.15, beta: 0.155, color: '#06b6d4' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 2.5, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
      case 'Au/Ti/Si Metal Cap Stack':
        setLayers([
          { id: '1', name: 'Gold Capping Layer', thickness: 150, roughness: 6.0, density: 19.30, delta: 46.8, beta: 4.78, color: '#eab308' },
          { id: '2', name: 'Titanium Adhesion Layer', thickness: 35, roughness: 4.0, density: 4.51, delta: 14.1, beta: 0.81, color: '#64748b' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
      case 'Periodic EUV Multilayer [Mo/Si]x5':
        const period: XRRLayer[] = [];
        for (let i = 0; i < 5; i++) {
          period.push({ id: `mo-${i}`, name: `Mo Layer #${i + 1}`, thickness: 35, roughness: 3.0, density: 10.22, delta: 27.8, beta: 1.95, color: '#ec4899' });
          period.push({ id: `si-${i}`, name: `Si Spacer #${i + 1}`, thickness: 45, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.17, color: '#3b82f6' });
        }
        period.push({ id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' });
        setLayers(period);
        break;
      case 'SAM Organic Monolayer / Au / Si':
        setLayers([
          { id: '1', name: 'SAM Organic Monolayer', thickness: 28, roughness: 3.0, density: 1.18, delta: 3.85, beta: 0.082, color: '#84cc16' },
          { id: '2', name: 'Gold Thin Film', thickness: 200, roughness: 5.5, density: 19.30, delta: 46.8, beta: 4.78, color: '#eab308' },
          { id: 'sub', name: 'Silicon Substrate', thickness: 0, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.173, color: '#3b82f6' }
        ]);
        break;
    }
  };

  // Add a new film layer above substrate
  const handleAddLayer = () => {
    const newLayer: XRRLayer = {
      id: `layer-${Date.now()}`,
      name: `New Layer ${layers.length}`,
      thickness: 100,
      roughness: 4.0,
      density: 4.23,
      delta: 13.9,
      beta: 0.52,
      color: '#10b981'
    };
    // Insert before substrate (last layer)
    const next = [...layers];
    next.splice(next.length - 1, 0, newLayer);
    setLayers(next);
  };

  // Move Layer Up / Down in stack
  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    if (index === layers.length - 1) return; // Cannot move substrate
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length - 1) return; // Stay within film range

    const updated = [...layers];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLayers(updated);
  };

  // Duplicate Layer
  const handleDuplicateLayer = (index: number) => {
    if (index === layers.length - 1) return; // Don't duplicate substrate
    const source = layers[index];
    const duplicated: XRRLayer = {
      ...source,
      id: `layer-${Date.now()}`,
      name: `${source.name} (Copy)`
    };
    const updated = [...layers];
    updated.splice(index + 1, 0, duplicated);
    setLayers(updated);
  };

  // Invert Film Stack Order
  const handleInvertStack = () => {
    if (layers.length <= 2) return;
    const films = layers.slice(0, layers.length - 1).reverse();
    const substrate = layers[layers.length - 1];
    setLayers([...films, substrate]);
  };

  // Clear Stack to Default Single Layer + Substrate
  const handleClearStack = () => {
    const defaultSubstrate = layers[layers.length - 1];
    setLayers([
      {
        id: 'layer-1',
        name: 'SiO2 Oxide Film',
        thickness: 200,
        roughness: 4.0,
        density: 2.20,
        delta: 7.15,
        beta: 0.155,
        color: '#06b6d4'
      },
      defaultSubstrate
    ]);
  };

  // Build Superlattice Stack from Generator Modal
  const handleBuildSuperlatticeStack = () => {
    const matA = MATERIAL_PRESETS.find(m => m.name === slMatA) || MATERIAL_PRESETS[0];
    const matB = MATERIAL_PRESETS.find(m => m.name === slMatB) || MATERIAL_PRESETS[1];
    const subMat = MATERIAL_PRESETS.find(m => m.name === slSubstrate) || MATERIAL_PRESETS[0];

    const newStack: XRRLayer[] = [];

    // Optional Capping Layer on top
    if (slCapMat && slCapMat !== 'None' && slCapThick > 0) {
      const capPreset = MATERIAL_PRESETS.find(m => m.name === slCapMat);
      newStack.push({
        id: `cap-${Date.now()}`,
        name: `${capPreset?.name || slCapMat} Cap`,
        thickness: slCapThick,
        roughness: 4.0,
        density: capPreset?.density || 19.3,
        delta: capPreset?.delta || 46.8,
        beta: capPreset?.beta || 4.78,
        color: capPreset?.color || '#eab308'
      });
    }

    // Bilayer Repeats [A / B] x N
    for (let i = 0; i < slRepeats; i++) {
      newStack.push({
        id: `sl-a-${i}-${Date.now()}`,
        name: `${matA.name} [P${i + 1}]`,
        thickness: slThickA,
        roughness: 3.5,
        density: matA.density,
        delta: matA.delta,
        beta: matA.beta,
        color: matA.color
      });
      newStack.push({
        id: `sl-b-${i}-${Date.now()}`,
        name: `${matB.name} [P${i + 1}]`,
        thickness: slThickB,
        roughness: 3.5,
        density: matB.density,
        delta: matB.delta,
        beta: matB.beta,
        color: matB.color
      });
    }

    // Substrate at base
    newStack.push({
      id: 'substrate',
      name: `${subMat.name} Substrate`,
      thickness: 0,
      roughness: 3.0,
      density: subMat.density,
      delta: subMat.delta,
      beta: subMat.beta,
      color: subMat.color
    });

    setLayers(newStack);
    setShowSLModal(false);
  };

  // Remove a layer
  const handleRemoveLayer = (index: number) => {
    if (layers.length <= 2) return; // Keep at least 1 film + substrate
    if (index === layers.length - 1) return; // Cannot remove substrate
    setLayers(layers.filter((_, i) => i !== index));
  };

  // Update a layer property
  const handleUpdateLayer = (index: number, field: keyof XRRLayer, value: any) => {
    const updated = [...layers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate optical dispersion delta & beta when density changes
    if (field === 'density' && typeof value === 'number' && value > 0) {
      const matched = MATERIAL_PRESETS.find(m => m.name.toLowerCase().includes(updated[index].name.toLowerCase()));
      if (matched && matched.density > 0) {
        const ratio = value / matched.density;
        updated[index].delta = Math.round(matched.delta * ratio * 100) / 100;
        updated[index].beta = Math.round(matched.beta * ratio * 1000) / 1000;
      } else {
        // Linear density scaling approx: delta ≈ 3.24 * density
        updated[index].delta = Math.round(3.24 * value * 100) / 100;
        updated[index].beta = Math.round(0.075 * value * 1000) / 1000;
      }
    }

    setLayers(updated);
  };

  // Apply Material Preset to a layer
  const handleApplyMaterialPreset = (index: number, matName: string) => {
    const preset = MATERIAL_PRESETS.find(m => m.name === matName);
    if (!preset) return;

    const updated = [...layers];
    updated[index] = {
      ...updated[index],
      name: preset.name,
      density: preset.density,
      delta: preset.delta,
      beta: preset.beta,
      color: preset.color
    };
    setLayers(updated);
  };

  // Run Parratt Simulation
  const reflectivityData = useMemo(() => {
    return calculateReflectivityCurve(layers, config, expData || undefined);
  }, [layers, config, expData]);

  // SLD Profile View Metric
  const [sldMetric, setSldMetric] = useState<'density' | 'electronDensity' | 'delta' | 'beta'>('density');

  // Superlattice Satellite Bragg Peak Analysis
  const superlatticeResult = useMemo(() => {
    return calculateSuperlatticeBraggPeaks(layers, config);
  }, [layers, config]);

  // Real-Space SLD Depth Profile
  const sldProfile = useMemo(() => {
    return calculateSLDProfile(layers, 300);
  }, [layers]);

  // Kiessig Fringe Analysis
  const kiessigResult: KiessigAnalysisResult | null = useMemo(() => {
    return analyzeKiessigFringes(reflectivityData, config.wavelength);
  }, [reflectivityData, config.wavelength]);

  // Critical Angle Detection
  const criticalResult: CriticalAngleResult | null = useMemo(() => {
    return detectCriticalAngle(reflectivityData);
  }, [reflectivityData]);

  // Fit Quality (Rwp, Log-RMSE)
  const fitMetrics = useMemo(() => {
    return calculateFitQuality(reflectivityData);
  }, [reflectivityData]);

  // Experimental Data Import Handler
  const handleParseExpData = () => {
    if (!expDataRaw.trim()) {
      setExpData(null);
      setShowExpModal(false);
      return;
    }

    try {
      const lines = expDataRaw.trim().split('\n');
      const parsed: { angle: number; intensity: number }[] = [];

      for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith('#') || clean.startsWith('//') || clean.startsWith('Angle')) continue;
        const parts = clean.split(/[\s,;\t]+/);
        if (parts.length >= 2) {
          const a = parseFloat(parts[0]);
          const i = parseFloat(parts[1]);
          if (!isNaN(a) && !isNaN(i) && i >= 0) {
            parsed.push({ angle: a, intensity: i });
          }
        }
      }

      if (parsed.length > 5) {
        // Sort by angle
        parsed.sort((x, y) => x.angle - y.angle);
        setExpData(parsed);
        setShowExpModal(false);
      } else {
        alert(isRTL ? 'داده‌های وارد شده معتبر نیستند. لطفاً فرمت دو ستونی (زاویه و شدت) را بررسی کنید.' : 'Invalid experimental format. Please provide two columns (Angle and Intensity).');
      }
    } catch (e) {
      alert(isRTL ? 'خطا در خوانی داده‌ها.' : 'Error parsing experimental data file.');
    }
  };

  // Simple Simplex/Gradient Auto-Fitting Engine
  const handleRunAutoFit = () => {
    if (!expData || expData.length === 0) {
      alert(isRTL ? 'لطفاً ابتدا داده‌های تجربی را وارد کنید.' : 'Please import experimental XRR data first to perform fitting.');
      return;
    }

    setIsFitting(true);
    setFitProgress(10);

    setTimeout(() => {
      let bestLayers = JSON.parse(JSON.stringify(layers)) as XRRLayer[];
      let bestMetric = calculateFitQuality(calculateReflectivityCurve(bestLayers, config, expData)).logRmse;

      // Iterative optimization steps
      const steps = 40;
      for (let iter = 0; iter < steps; iter++) {
        const candidate = JSON.parse(JSON.stringify(bestLayers)) as XRRLayer[];

        // Perturb layers
        for (let i = 0; i < candidate.length - 1; i++) {
          if (fitOptions.fitThickness) {
            candidate[i].thickness = Math.max(10, candidate[i].thickness + (Math.random() - 0.5) * 8);
          }
          if (fitOptions.fitRoughness) {
            candidate[i].roughness = Math.max(0.5, candidate[i].roughness + (Math.random() - 0.5) * 0.8);
          }
          if (fitOptions.fitDensity) {
            candidate[i].density = Math.max(0.5, candidate[i].density + (Math.random() - 0.5) * 0.2);
            candidate[i].delta = Math.round(3.24 * candidate[i].density * 100) / 100;
          }
        }

        const sim = calculateReflectivityCurve(candidate, config, expData);
        const metric = calculateFitQuality(sim).logRmse;

        if (metric < bestMetric) {
          bestMetric = metric;
          bestLayers = candidate;
        }
      }

      setLayers(bestLayers);
      setIsFitting(false);
      setFitProgress(100);
    }, 600);
  };

  // Download CSV Data
  const handleExportCSV = () => {
    let csv = 'Angle_Theta_deg,Angle_2Theta_deg,Qz_A-1,Reflectivity_Calc,Fresnel_Substrate\n';
    reflectivityData.forEach(p => {
      csv += `${p.theta.toFixed(4)},${p.twoTheta.toFixed(4)},${p.qz.toFixed(6)},${p.rCalc.toExponential(6)},${p.fresnelR?.toExponential(6)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `XRR_Reflectivity_Curve_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Python Script
  const pythonScript = useMemo(() => {
    return generatePythonXRRScript(layers, config);
  }, [layers, config]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                THIN FILM SPECTROSCOPY • PARRATT RECURSION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{isRTL ? 'ماژول آنالیز بازتاب‌سنجی پرتو ایکس (XRR)' : 'X-Ray Reflectometry (XRR) Analysis Engine'}</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-2xl leading-relaxed">
              {isRTL
                ? 'مدل‌سازی دقیق منحنی بازتاب، تعیین ضخامت نانولایه‌ها، زبری صفحات فصلی، چگالی ماده و استخراج نوسانات کیسیک با معادلات پارات و اصلاحات زبری نِووت-کراس.'
                : 'Specular X-ray reflectivity calculation for thin film stacks & substrates. Model layer thicknesses, interfacial roughness, electron densities, Kiessig fringes, and critical angles.'}
            </p>
          </div>

          {/* Quick Metrics & Preset Switcher */}
          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-0.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">{isRTL ? 'کل ضخامت فیلم' : 'Total Film Thickness'}</div>
              <div className="text-base font-mono font-black text-cyan-300">{totalFilmThickness} Å ({(totalFilmThickness / 10).toFixed(1)} nm)</div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-0.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">{isRTL ? 'تعداد لایه‌ها' : 'Multilayer Stack'}</div>
              <div className="text-base font-mono font-black text-indigo-300">{layers.length - 1} Films + Substrate</div>
            </div>

            <button
              onClick={() => setShowExpModal(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{expData ? (isRTL ? 'ویرایش داده‌های تجربی' : 'Exp Data Loaded') : (isRTL ? 'بارگذاری اسکن تجربی' : 'Import Exp Scan')}</span>
            </button>
          </div>
        </div>

        {/* Structure Presets Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-[11px] font-mono font-bold text-slate-400 whitespace-nowrap flex items-center gap-1.5 mr-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {isRTL ? 'الگوهای ساختاری:' : 'Presets:'}
          </span>
          {[
            'SiO2/Si Oxide Film',
            'HfO2/SiO2/Si High-K Gate Stack',
            'Au/Ti/Si Metal Cap Stack',
            'Periodic EUV Multilayer [Mo/Si]x5',
            'SAM Organic Monolayer / Au / Si'
          ].map(p => (
            <button
              key={p}
              onClick={() => handleLoadPresetStructure(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                selectedPreset === p
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls & Plot Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multilayer Stack Editor & Optical Config */}
        <div className="lg:col-span-5 space-y-6">
          {/* Layer Architecture Configurator Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-500/5 space-y-5">
            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isRTL ? 'معماری و لایه‌بندی ساختار' : 'Multilayer Film Architecture'}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                      {layers.length - 1} {layers.length - 1 === 1 ? 'Film' : 'Films'} + Substrate
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'تنظیم ضخامت d، زبری σ و چگالی ρ لایه‌ها' : 'Configure thickness (d), roughness (σ) & mass density (ρ)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSLModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/20"
                  title="Superlattice Multilayer Generator"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'سازنده سوپرلاتیست' : 'Superlattice'}</span>
                </button>

                <button
                  onClick={handleAddLayer}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'افزودن لایه' : 'Add Layer'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stack Summary Badge & Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'ضخامت کل:' : 'Total Stack Film:'}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {totalFilmThickness} Å ({totalFilmThicknessNm} nm)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleInvertStack}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Invert Film Stack Order"
                >
                  <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                  <span>{isRTL ? 'معکوس‌سازی' : 'Invert'}</span>
                </button>

                <button
                  onClick={handleClearStack}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Stack to Single Oxide Film"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isRTL ? 'بازنشانی' : 'Reset'}</span>
                </button>
              </div>
            </div>

            {/* Visual Interactive Stack Graphic */}
            <div className="w-full flex flex-col items-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Incident Beam ↓</span>
                <span>Top Surface z = 0</span>
              </div>

              <div className="w-full max-w-[260px] flex flex-col items-stretch space-y-0.5">
                {layers.map((layer, index) => {
                  const isSubstrate = index === layers.length - 1;
                  const visualHeight = isSubstrate ? 50 : Math.max(22, Math.min(70, layer.thickness * 0.35));
                  const isHovered = hoveredLayerId === layer.id;

                  return (
                    <motion.div
                      layout
                      key={layer.id}
                      onMouseEnter={() => setHoveredLayerId(layer.id)}
                      onMouseLeave={() => setHoveredLayerId(null)}
                      className={`w-full rounded-sm flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isHovered ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.02] z-10' : ''
                      }`}
                      style={{ 
                        height: visualHeight, 
                        backgroundColor: layer.color || '#3b82f6',
                        opacity: isSubstrate ? 0.75 : 0.9,
                        boxShadow: `inset 0px -2px 10px rgba(0,0,0,0.15), inset 0px 2px 5px rgba(255,255,255,0.25)`
                      }}
                    >
                      <div className="flex items-center justify-between w-full px-3 text-white/90 drop-shadow-md">
                        <span className="text-[10px] font-bold truncate max-w-[150px]">
                          {layer.name}
                        </span>
                        {!isSubstrate && (
                          <span className="text-[9px] font-mono text-white/80 font-bold shrink-0">
                            {layer.thickness} Å ({layer.density} g/cm³)
                          </span>
                        )}
                        {isSubstrate && (
                          <span className="text-[9px] font-mono text-white/80 font-bold shrink-0">
                            Substrate Bulk
                          </span>
                        )}
                      </div>

                      {/* Interfacial roughness wave effect line indicator */}
                      {layer.roughness > 0 && !isSubstrate && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/40 border-b border-dashed border-white/60"
                          title={`Roughness σ = ${layer.roughness} Å`}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="w-full flex justify-end text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-2">
                <span>Substrate Depth ∞</span>
              </div>
            </div>

            {/* Film Layer Editor Cards */}
            <div className="space-y-4 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
              {layers.map((layer, index) => {
                const isSubstrate = index === layers.length - 1;
                const isHovered = hoveredLayerId === layer.id;

                return (
                  <motion.div
                    key={layer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onMouseEnter={() => setHoveredLayerId(layer.id)}
                    onMouseLeave={() => setHoveredLayerId(null)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSubstrate
                        ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-700/80'
                        : isHovered
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50'
                    }`}
                  >
                    {/* Top Row: Color Picker, Title, Tag, Quick Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Custom Color Circle Input */}
                        <div className="relative group shrink-0">
                          <input
                            type="color"
                            value={layer.color || '#3b82f6'}
                            onChange={(e) => handleUpdateLayer(index, 'color', e.target.value)}
                            className="w-4 h-4 rounded-full border-0 cursor-pointer p-0 appearance-none bg-transparent"
                            title="Customize Layer Color"
                          />
                        </div>

                        <input
                          type="text"
                          value={layer.name}
                          onChange={(e) => handleUpdateLayer(index, 'name', e.target.value)}
                          className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 outline-none px-1 py-0.5 truncate max-w-[160px]"
                        />

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 font-bold">
                          {isSubstrate ? (isRTL ? 'زیرلایه' : 'Substrate') : `Layer ${index + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Material Preset Selector */}
                        <select
                          onChange={(e) => handleApplyMaterialPreset(index, e.target.value)}
                          className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none cursor-pointer max-w-[110px] truncate"
                          defaultValue=""
                        >
                          <option value="" disabled>{isRTL ? 'ماده...' : 'Preset...'}</option>
                          {MATERIAL_PRESETS.map(m => (
                            <option key={m.name} value={m.name}>{m.name}</option>
                          ))}
                        </select>

                        {/* Film Stack Order & Clone Actions */}
                        {!isSubstrate && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => handleMoveLayer(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Move Layer Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleMoveLayer(index, 'down')}
                              disabled={index === layers.length - 2}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Move Layer Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicateLayer(index)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Duplicate Layer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRemoveLayer(index)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Layer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Numerical Controls: Thickness, Roughness, Density with Fine Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Thickness */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                          <span>{isRTL ? 'ضخامت d (Å)' : 'Thickness (Å)'}</span>
                          {!isSubstrate && <span className="text-cyan-500 font-bold">{(layer.thickness / 10).toFixed(1)} nm</span>}
                        </label>
                        {isSubstrate ? (
                          <div className="text-xs font-mono font-bold text-slate-400 pt-3 text-center bg-slate-100/50 dark:bg-slate-950/50 p-2 rounded-xl">Semi-Infinite (∞)</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateLayer(index, 'thickness', Math.max(1, layer.thickness - 10))}
                                className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                title="-10 Å"
                              >
                                -10
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="2000"
                                step="1"
                                value={layer.thickness}
                                onChange={(e) => handleUpdateLayer(index, 'thickness', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-center font-bold"
                              />
                              <button
                                onClick={() => handleUpdateLayer(index, 'thickness', layer.thickness + 10)}
                                className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                title="+10 Å"
                              >
                                +10
                              </button>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="1000"
                              step="5"
                              value={layer.thickness}
                              onChange={(e) => handleUpdateLayer(index, 'thickness', parseFloat(e.target.value) || 0)}
                              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </>
                        )}
                      </div>

                      {/* Roughness σ */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                          <span>{isRTL ? 'زبری σ (Å)' : 'Roughness σ (Å)'}</span>
                          <span className="text-indigo-500 font-bold">{layer.roughness} Å</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          value={layer.roughness}
                          onChange={(e) => handleUpdateLayer(index, 'roughness', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold"
                        />
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="0.5"
                          value={layer.roughness}
                          onChange={(e) => handleUpdateLayer(index, 'roughness', parseFloat(e.target.value) || 0)}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Mass Density ρ */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 flex justify-between">
                          <span>{isRTL ? 'چگالی ρ' : 'Density ρ'}</span>
                          <span className="text-emerald-500 font-bold">g/cm³</span>
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          max="25"
                          step="0.05"
                          value={layer.density}
                          onChange={(e) => handleUpdateLayer(index, 'density', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold"
                        />
                        <input
                          type="range"
                          min="0.5"
                          max="22"
                          step="0.1"
                          value={layer.density}
                          onChange={(e) => handleUpdateLayer(index, 'density', parseFloat(e.target.value) || 0)}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Footer Readout: Interdiffusion Zone & Optical Constants */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
                      {!isSubstrate && (
                        <div className="flex items-center gap-1.5">
                          <span>{isRTL ? 'شیب/نفوذ متقابل:' : 'Interdiffusion Zone:'}</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="1"
                            value={layer.gradingThickness || 0}
                            onChange={(e) => handleUpdateLayer(index, 'gradingThickness', parseFloat(e.target.value) || 0)}
                            className="w-14 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-[10px] text-amber-500 font-bold outline-none"
                            placeholder="0 Å"
                          />
                          <span>Å</span>
                        </div>
                      )}
                      <span className="text-slate-500">
                        δ = <strong className="text-slate-700 dark:text-slate-300">{layer.delta}</strong>×10⁻⁶ • β = <strong className="text-slate-700 dark:text-slate-300">{layer.beta}</strong>×10⁻⁷
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Experimental Setup & Optical Parameters */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-cyan-500/5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? 'تنظیمات آزمایشگاهی اسکن XRR' : 'Instrument & Scan Setup'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Wavelength */}
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-500">
                  {isRTL ? 'طول موج تابشی λ (Å)' : 'Wavelength λ (Å)'}
                </label>
                <select
                  value={config.wavelength}
                  onChange={(e) => setConfig({ ...config, wavelength: parseFloat(e.target.value) })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value={1.5406}>Cu K-α (1.5406 Å)</option>
                  <option value={0.7107}>Mo K-α (0.7107 Å)</option>
                  <option value={1.7890}>Co K-α (1.7890 Å)</option>
                  <option value={2.2897}>Cr K-α (2.2897 Å)</option>
                </select>
              </div>

              {/* Interface Roughness Damping Model */}
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-500">
                  {isRTL ? 'مدل زبری نِووت-کراس / دبی-والر' : 'Interface Roughness Model'}
                </label>
                <select
                  value={config.roughnessModel || 'nevot-croce'}
                  onChange={(e) => setConfig({ ...config, roughnessModel: e.target.value as any })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="nevot-croce">Névot-Croce [exp(-2 · kj · kj+1 · σ²)]</option>
                  <option value="debye-waller">Debye-Waller [exp(-2 · kj² · σ²)]</option>
                </select>
              </div>

              {/* Beam Divergence / Instrumental Resolution */}
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-500">
                  {isRTL ? 'واگرایی پرتو (Δθ °)' : 'Beam Divergence (FWHM °)'}
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0.0"
                  max="0.1"
                  value={config.beamDivergence}
                  onChange={(e) => setConfig({ ...config, beamDivergence: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Intensity Scale Multiplier */}
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-500">
                  {isRTL ? 'مقیاس شدت (I_scale)' : 'Intensity Scale Factor'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="10.0"
                  value={config.intensityScale || 1.0}
                  onChange={(e) => setConfig({ ...config, intensityScale: parseFloat(e.target.value) || 1.0 })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Angular Scan Range */}
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-500">
                  {isRTL ? 'زاویه شروع θ (°)' : 'Start Angle θ (°)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="2.0"
                  value={config.angleStart}
                  onChange={(e) => setConfig({ ...config, angleStart: parseFloat(e.target.value) || 0.01 })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-500">
                  {isRTL ? 'زاویه پایان θ (°)' : 'End Angle θ (°)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="10.0"
                  value={config.angleEnd}
                  onChange={(e) => setConfig({ ...config, angleEnd: parseFloat(e.target.value) || 4.0 })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Plots & Physics Analytics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visualizer Panel Container */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* View Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'reflectivity', label: isRTL ? 'منحنی بازتاب (R vs θ)' : 'Reflectivity Curve', icon: Activity },
                  { id: 'sld', label: isRTL ? 'پروفایل عمقی SLD / ρ' : 'SLD / Density Profile', icon: BarChart3 },
                  { id: 'python', label: 'Python Code', icon: Terminal },
                  { id: 'theory', label: isRTL ? 'راهنمای تئوری' : 'Theory Manual', icon: BookOpen }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Angle Display Unit Control */}
              {activeTab === 'reflectivity' && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold">
                  <span className="text-slate-400 px-2">X-Axis:</span>
                  {[
                    { id: 'theta', label: 'θ (°)' },
                    { id: 'twoTheta', label: '2θ (°)' },
                    { id: 'qz', label: 'qz (Å⁻¹)' }
                  ].map(u => (
                    <button
                      key={u.id}
                      onClick={() => setConfig({ ...config, angleUnit: u.id as any })}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        config.angleUnit === u.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB 1: Reflectivity Curve Chart */}
            {activeTab === 'reflectivity' && (
              <div className="space-y-6">
                <div className="h-[400px] w-full relative bg-slate-900/5 dark:bg-[#0b1121] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-2 shadow-inner overflow-hidden">
                  {/* Subtle background gradient glow behind the chart */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-cyan-500/10 dark:bg-cyan-500/5 blur-[80px] pointer-events-none rounded-full" />
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reflectivityData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey={config.angleUnit === 'twoTheta' ? 'twoTheta' : config.angleUnit === 'qz' ? 'qz' : 'theta'}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(v) => Number(v).toFixed(2)}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{
                          value: config.angleUnit === 'twoTheta' ? 'Scattering Angle 2θ (°)' : config.angleUnit === 'qz' ? 'Scattering Vector qz (Å⁻¹)' : 'Incident Angle θ (°)',
                          position: 'insideBottom',
                          offset: -15,
                          fill: '#64748b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      />
                      <YAxis
                        scale="log"
                        domain={[config.background, 1.2]}
                        allowDataOverflow
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(v) => v >= 0.01 ? v.toFixed(2) : v.toExponential(0)}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{ value: 'Specular Reflectivity R', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '16px', fontSize: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 600 }}
                        formatter={(val: any) => [typeof val === 'number' ? val.toExponential(4) : val, 'Reflectivity R']}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '10px' }} iconType="circle" />

                      {/* Calculated Parratt Curve (Glow Effect) */}
                      <Line
                        type="monotone"
                        dataKey="rCalc"
                        stroke="#0891b2"
                        strokeWidth={6}
                        strokeOpacity={0.2}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={false}
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="rCalc"
                        name="Parratt Theoretical Model"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                      />

                      {/* Ideal Fresnel Substrate Baseline */}
                      <Line
                        type="monotone"
                        dataKey="fresnelR"
                        name="Ideal Substrate Fresnel R"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        isAnimationActive={false}
                      />

                      {/* Experimental Overlay */}
                      {expData && (
                        <Line
                          type="monotone"
                          dataKey="rExp"
                          name="Experimental XRR Scan"
                          stroke="#f59e0b"
                          strokeWidth={0}
                          dot={{ r: 3, fill: '#f59e0b', fillOpacity: 0.8 }}
                          activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff' }}
                          isAnimationActive={false}
                        />
                      )}

                      {/* Critical Angle Line Marker */}
                      {criticalResult && (
                        <ReferenceLine
                          x={config.angleUnit === 'twoTheta' ? criticalResult.thetaCritDeg * 2 : config.angleUnit === 'qz' ? criticalResult.qzCrit : criticalResult.thetaCritDeg}
                          stroke="#ef4444"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          strokeOpacity={0.7}
                          label={{ value: `θc = ${criticalResult.thetaCritDeg.toFixed(3)}°`, fill: '#ef4444', fontSize: 11, fontWeight: 'bold', position: 'insideTopLeft', offset: 10 }}
                        />
                      )}

                      {/* Superlattice Satellite Bragg Peak Reference Lines */}
                      {superlatticeResult && superlatticeResult.peaks.map((p, idx) => (
                        <ReferenceLine
                          key={p.label}
                          x={config.angleUnit === 'twoTheta' ? p.twoThetaDeg : config.angleUnit === 'qz' ? p.qz : p.thetaDeg}
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          strokeOpacity={0.6}
                          label={{ value: p.label, fill: '#10b981', fontSize: 11, fontWeight: 'bold', position: 'insideTopRight', offset: 10 + (idx % 2) * 15 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Physics Metrics & Kiessig / Superlattice Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Kiessig Fringes Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-cyan-500/5 space-y-3 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white relative z-10">
                      <span className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                        <Activity className="w-4 h-4" />
                        {isRTL ? 'نوسانات کیسیک' : 'Kiessig Fringes'}
                      </span>
                      {kiessigResult && (
                        <span className="font-mono text-cyan-500 dark:text-cyan-300 font-black text-base">{kiessigResult.estimatedThickness} Å</span>
                      )}
                    </div>

                    {kiessigResult ? (
                      <div className="text-xs space-y-2 font-mono text-slate-600 dark:text-slate-400 relative z-10">
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'دوره تناوب Δqz:' : 'Fringe Δqz:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{kiessigResult.periodQz.toFixed(4)} Å⁻¹</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'تناوب Δθ:' : 'Period Δθ:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{kiessigResult.periodTheta.toFixed(3)}°</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'ضخامت d:' : 'Thickness d:'}</span>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">2π / Δqz</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[90px] relative z-10">
                        <p className="text-xs text-slate-400/80 italic text-center px-4">
                          {isRTL ? 'برای محاسبه کیسیک حداقل ۲ پیک نوسان نیاز است.' : 'At least 2 fringe peaks needed.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Critical Angle Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-rose-500/5 space-y-3 relative overflow-hidden group hover:border-rose-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white relative z-10">
                      <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <Target className="w-4 h-4" />
                        {isRTL ? 'زاویه بحرانی' : 'Critical Angle θc'}
                      </span>
                      {criticalResult && (
                        <span className="font-mono text-rose-500 dark:text-rose-400 font-black text-base">{criticalResult.thetaCritDeg.toFixed(3)}°</span>
                      )}
                    </div>

                    {criticalResult ? (
                      <div className="text-xs space-y-2 font-mono text-slate-600 dark:text-slate-400 relative z-10">
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'بردار qc:' : 'Vector qc:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{criticalResult.qzCrit} Å⁻¹</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'چگالی سطح:' : 'Surface ρ:'}</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">{criticalResult.densityEst} g/cm³</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'رابطه:' : 'Formula:'}</span>
                          <span className="font-bold text-slate-500">θc ∝ √ρ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[90px] relative z-10">
                        <p className="text-xs text-slate-400/80 italic text-center px-4">
                          {isRTL ? 'زاویه بحرانی شناسایی نشد.' : 'Not detected in range.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Superlattice Bragg Satellites Card */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-emerald-500/5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white relative z-10">
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Zap className="w-4 h-4" />
                        {isRTL ? 'سوپرلاتیست براج' : 'Superlattice Period'}
                      </span>
                      {superlatticeResult && (
                        <span className="font-mono text-emerald-500 dark:text-emerald-400 font-black text-base">Λ = {superlatticeResult.period} Å</span>
                      )}
                    </div>

                    {superlatticeResult && superlatticeResult.peaks.length > 0 ? (
                      <div className="text-xs space-y-2 font-mono text-slate-600 dark:text-slate-400 relative z-10">
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'تعداد پیک ماهواره:' : 'Satellite Peaks:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{superlatticeResult.peaks.length} orders</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'پیک اول (SL-1):' : 'First Order SL-1:'}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{superlatticeResult.peaks[0].thetaDeg}° θ</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-lg">
                          <span>{isRTL ? 'شرایط براج:' : 'Bragg Law:'}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">mλ = 2Λ sinθ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[90px] relative z-10">
                        <p className="text-xs text-slate-400/80 italic text-center px-4">
                          {isRTL ? 'ساختار متناوب (Superlattice) شناسایی نشد.' : 'No periodic bilayer detected.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experimental Fit Quality & Optimization Tools */}
                {expData && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>{isRTL ? 'شاخص‌های برازش با اسکن تجربی' : 'Experimental Fit Residuals'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        Log-RMSE: <b className="text-cyan-300">{fitMetrics.logRmse}</b> • Rwp: <b className="text-amber-300">{fitMetrics.rwp}%</b>
                      </div>
                    </div>

                    <button
                      onClick={handleRunAutoFit}
                      disabled={isFitting}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFitting ? 'animate-spin' : ''}`} />
                      <span>{isFitting ? (isRTL ? 'در حال بهینه‌سازی...' : 'Refining...') : (isRTL ? 'پالایش خودکار پارامترها' : 'Auto-Refine Fit')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Real-Space SLD Depth Profile Chart */}
            {activeTab === 'sld' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-400 leading-relaxed max-w-xl">
                    {isRTL
                      ? 'پروفایل عمقی چگالی ماده، چگالی الکترونی و ضرایب اپتیکی (SLD) در طول عمق z از سطح بالای فیلم تا زیرلایه.'
                      : 'Real-space depth profile of scattering length density (SLD), mass density, electron density, and optical constants.'}
                  </div>

                  {/* SLD Metric Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setSldMetric('density')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'density' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      ρ (g/cm³)
                    </button>
                    <button
                      onClick={() => setSldMetric('electronDensity')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'electronDensity' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      ρ_e (e⁻/Å³)
                    </button>
                    <button
                      onClick={() => setSldMetric('delta')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'delta' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      δ (×10⁻⁶)
                    </button>
                    <button
                      onClick={() => setSldMetric('beta')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${sldMetric === 'beta' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      β (×10⁻⁷)
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full relative bg-slate-900/5 dark:bg-[#0b1121] rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-2 shadow-inner overflow-hidden">
                  {/* Subtle background gradient glow behind the chart */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 blur-[80px] pointer-events-none rounded-full transition-colors duration-700 ${sldMetric === 'density' ? 'bg-cyan-500/10' : sldMetric === 'electronDensity' ? 'bg-indigo-500/10' : sldMetric === 'delta' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sldProfile} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                      <defs>
                        <linearGradient id="sldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={sldMetric === 'density' ? '#06b6d4' : sldMetric === 'electronDensity' ? '#6366f1' : sldMetric === 'delta' ? '#10b981' : '#f59e0b'} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={sldMetric === 'density' ? '#06b6d4' : sldMetric === 'electronDensity' ? '#6366f1' : sldMetric === 'delta' ? '#10b981' : '#f59e0b'} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="z"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(v) => `${v.toFixed(0)} Å`}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{ value: 'Depth z from Top Surface (Å)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: '#334155', opacity: 0.5 }}
                        tickLine={{ stroke: '#334155', opacity: 0.5 }}
                        label={{
                          value: sldMetric === 'density' ? 'Mass Density ρ (g/cm³)' : sldMetric === 'electronDensity' ? 'Electron Density ρ_e (e⁻/Å³)' : sldMetric === 'delta' ? 'Dispersion δ (×10⁻⁶)' : 'Absorption β (×10⁻⁷)',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#64748b',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '16px', fontSize: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ fontWeight: 600 }}
                        labelFormatter={(z) => `Depth: ${z} Å`}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '10px' }} iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey={sldMetric}
                        name={sldMetric === 'density' ? 'Mass Density ρ (g/cm³)' : sldMetric === 'electronDensity' ? 'Electron Density ρ_e (e⁻/Å³)' : sldMetric === 'delta' ? 'Dispersion δ (×10⁻⁶)' : 'Absorption β (×10⁻⁷)'}
                        stroke={sldMetric === 'density' ? '#06b6d4' : sldMetric === 'electronDensity' ? '#6366f1' : sldMetric === 'delta' ? '#10b981' : '#f59e0b'}
                        fill="url(#sldGrad)"
                        strokeWidth={3}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 3: Python Script Exporter */}
            {activeTab === 'python' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>SciPy / Refnx Python Automation Code</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pythonScript);
                      setCopiedPython(true);
                      setTimeout(() => setCopiedPython(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPython ? (isRTL ? 'کپی شد!' : 'Copied!') : (isRTL ? 'کپی اسکریپت' : 'Copy Script')}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto custom-scrollbar border border-slate-800 leading-relaxed max-h-[420px]">
                  {pythonScript}
                </pre>
              </div>
            )}

            {/* TAB 4: Theory Reference Manual */}
            {activeTab === 'theory' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[440px] overflow-y-auto custom-scrollbar pr-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>1. Parratt's Formalism for XRR Specular Reflectivity</span>
                  </h4>
                  <p>
                    X-Ray Reflectometry measures grazing incidence specular reflection R(θ) = |R₀|² at small angles (0° &lt; θ &lt; 5°).
                    The complex refractive index for X-rays in matter is:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-cyan-300 text-center">
                    n = 1 - δ - iβ
                  </div>
                  <p>
                    where δ ∝ ρ is the dispersion term (proportional to electron density / mass density) and β is the photoelectric absorption term.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>2. Névot-Croce Interface Roughness Attenuation</span>
                  </h4>
                  <p>
                    Interfacial RMS roughness σ<sub>j</sub> damps the ideal Fresnel reflection coefficient r<sub>j, j+1</sub> via the Névot-Croce factor:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-indigo-300 text-center">
                    r_rough = r_Fresnel × exp(-2 · k<sub>z,j</sub> · k<sub>z,j+1</sub> · σ<sub>j</sub>²)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>3. Kiessig Fringes & Thickness Extraction</span>
                  </h4>
                  <p>
                    Interference fringes occur between top surface and substrate reflections. The fringe period Δq<sub>z</sub> yields direct layer thickness:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-amber-300 text-center">
                    d_film = 2π / Δq<sub>z</sub> = λ / (2 · Δθ · cos θ₀)
                  </div>
                </div>
              </div>
            )}

            {/* Export Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Parratt Engine • Névot-Croce Model</span>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-cyan-500" />
                <span>{isRTL ? 'خروجی CSV' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Experimental Scan Import Modal */}
      <AnimatePresence>
        {showExpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold">{isRTL ? 'بارگذاری اسکن تجربی XRR' : 'Import Experimental XRR Scan'}</h3>
                </div>
                <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                {isRTL ? 'داده‌های اسکن را در قالب دو ستون (زاویه و شدت) در کادر زیر وارد یا پیست کنید:' : 'Paste two-column experimental scan data (Angle vs Intensity):'}
              </p>

              <textarea
                value={expDataRaw}
                onChange={(e) => setExpDataRaw(e.target.value)}
                placeholder={`0.10   1.000\n0.15   0.985\n0.20   0.850\n0.25   0.420\n...`}
                className="w-full h-48 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 outline-none focus:border-cyan-500"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowExpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  {isRTL ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  onClick={handleParseExpData}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  {isRTL ? 'اعمال داده‌ها' : 'Apply Experimental Data'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Superlattice Multilayer Generator Modal */}
      <AnimatePresence>
        {showSLModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isRTL ? 'سازنده ساختار سوپرلاتیست' : 'Superlattice Multilayer Generator'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isRTL ? 'ایجاد خودکار ساختارهای متناوب [A / B]×N' : 'Auto-build periodic [A / B] × N bilayer stack'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSLModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3.5">
                {/* Layer A */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-500">
                    <span>Layer A (Bilayer Component 1)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={slMatA}
                      onChange={(e) => setSlMatA(e.target.value)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      {MATERIAL_PRESETS.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={slThickA}
                        onChange={(e) => setSlThickA(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                      <span className="text-xs font-mono text-slate-400">Å</span>
                    </div>
                  </div>
                </div>

                {/* Layer B */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-500">
                    <span>Layer B (Bilayer Component 2)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={slMatB}
                      onChange={(e) => setSlMatB(e.target.value)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      {MATERIAL_PRESETS.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={slThickB}
                        onChange={(e) => setSlThickB(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                      <span className="text-xs font-mono text-slate-400">Å</span>
                    </div>
                  </div>
                </div>

                {/* Repeats N & Substrate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Periods N (Repeats)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={slRepeats}
                      onChange={(e) => setSlRepeats(parseInt(e.target.value) || 1)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Substrate Material
                    </label>
                    <select
                      value={slSubstrate}
                      onChange={(e) => setSlSubstrate(e.target.value)}
                      className="w-full mt-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      {MATERIAL_PRESETS.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Capping Layer (Top)
                    </label>
                    <select
                      value={slCapMat}
                      onChange={(e) => setSlCapMat(e.target.value)}
                      className="w-full mt-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                    >
                      <option value="None">None</option>
                      {MATERIAL_PRESETS.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  {slCapMat !== 'None' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Cap Thickness (Å)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={slCapThick}
                        onChange={(e) => setSlCapThick(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Period Calculations Summary */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1 font-mono text-amber-700 dark:text-amber-300">
                  <div className="flex justify-between font-bold">
                    <span>Bilayer Period Λ = dA + dB:</span>
                    <span>{slThickA + slThickB} Å ({((slThickA + slThickB) / 10).toFixed(1)} nm)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated Film Layers:</span>
                    <span>{slRepeats * 2 + (slCapMat !== 'None' ? 1 : 0)} layers</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Stack Film Thickness:</span>
                    <span>{slRepeats * (slThickA + slThickB) + (slCapMat !== 'None' ? slCapThick : 0)} Å</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowSLModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuildSuperlatticeStack}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Generate Superlattice Stack
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
