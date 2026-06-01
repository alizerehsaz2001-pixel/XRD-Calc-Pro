import React, { useState, useMemo } from 'react';
import { useSettings } from './SettingsContext';
import { calculateMarchDollase, calculateCubicAngle } from '../utils/physics';
import { 
  Activity, 
  Beaker, 
  Layers, 
  Sliders, 
  MoveRight, 
  Info, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  HelpCircle, 
  Flame, 
  Dices,
  CircleDot
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface Preset {
  name: string;
  r: number;
  direction: string;
  description: string;
  icon: React.ReactNode;
  data: string;
}

export const PreferredOrientationModule: React.FC = () => {
  const { precision } = useSettings();
  const [activeTab, setActiveTab] = useState<'simulator' | 'formulas' | 'solver'>('simulator');
  
  // States
  const [rValue, setRValue] = useState<number>(0.8);
  const [targetHKL, setTargetHKL] = useState<string>('0, 0, 1');
  const [inputData, setInputData] = useState<string>(
    "0, 0, 1, 100, 100\n1, 0, 0, 80, 80\n1, 1, 0, 60, 60\n1, 1, 1, 90, 90\n0, 0, 2, 40, 40"
  );
  
  // Crystallographic Angle Solver mini-stats
  const [testH, setTestH] = useState<number>(1);
  const [testK, setTestK] = useState<number>(1);
  const [testL, setTestL] = useState<number>(0);

  // Solver states
  const [solverResult, setSolverResult] = useState<{
    refinedR: number;
    initialRwp: number;
    finalRwp: number;
    scalingFactor: number;
    message: string;
  } | null>(null);

  // Material Presets
  const PRESETS: Preset[] = useMemo(() => [
    {
      name: 'Isotropic Powder (Random)',
      r: 1.00,
      direction: '0, 0, 1',
      description: 'Ideal random distribution of crystals. No preferred orientation exists.',
      icon: <Dices className="w-4 h-4 text-slate-400" />,
      data: "0, 0, 1, 100, 100\n1, 0, 0, 80, 80\n1, 1, 0, 60, 60\n1, 1, 1, 90, 90\n0, 0, 2, 40, 40"
    },
    {
      name: 'Clay / Kaolinite (Plates)',
      r: 0.35,
      direction: '0, 0, 1',
      description: 'Crystalline platelets flattening along [001] basal planes due to uniaxial compaction.',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      data: "0, 0, 1, 100, 225\n1, 0, 0, 80, 25\n1, 1, 0, 60, 20\n1, 1, 1, 90, 35\n0, 0, 2, 40, 90"
    },
    {
      name: 'Barium Ferrite (Hexagonal)',
      r: 0.50,
      direction: '0, 0, 1',
      description: 'Hexagonal disk-like grains forming magnetic textures parallel to structural normal.',
      icon: <CircleDot className="w-4 h-4 text-emerald-400" />,
      data: "0, 0, 1, 100, 185\n1, 0, 0, 80, 35\n1, 0, 1, 75, 45\n1, 1, 0, 60, 30\n0, 0, 2, 40, 75"
    },
    {
      name: 'Acicular Goethite (Needles)',
      r: 1.65,
      direction: '1, 1, 0',
      description: 'Elongated needle-like grains orientation aligned along shear flow direction.',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      data: "1, 1, 0, 100, 170\n0, 0, 1, 80, 45\n1, 0, 0, 60, 40\n1, 1, 1, 90, 65\n2, 2, 0, 30, 50"
    },
    {
      name: 'ZnO Vertical Nanorods',
      r: 2.45,
      direction: '0, 0, 1',
      description: 'Nanorods grown vertically. Attenuates longitudinal reflections, boosts transverse side-facets.',
      icon: <Activity className="w-4 h-4 text-indigo-400" />,
      data: "0, 0, 2, 100, 15\n1, 0, 0, 70, 140\n1, 0, 1, 90, 110\n1, 1, 0, 50, 100\n0, 0, 4, 15, 1"
    }
  ], []);

  const selectPreset = (preset: Preset) => {
    setRValue(preset.r);
    setTargetHKL(preset.direction);
    setInputData(preset.data);
    setSolverResult(null);
  };

  // Parsing data
  const results = useMemo(() => {
    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];
    
    if (H === 0 && K === 0 && L === 0) return [];
    
    return inputData.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return null;
      
      const parts = trimmed.split(',').map(s => parseFloat(s.trim()));
      if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
      
      const h = parts[0];
      const k = parts[1];
      const l = parts[2];
      
      const iTh = parts.length > 3 ? (isNaN(parts[3]) ? 100 : parts[3]) : 100;
      const iMeas = parts.length > 4 ? (isNaN(parts[4]) ? iTh : parts[4]) : iTh;
      
      const angle = calculateCubicAngle(h, k, l, H, K, L);
      const correction = calculateMarchDollase(rValue, angle);
      
      return {
        hkl: `(${h} ${k} ${l})`,
        h, k, l,
        iTh,
        iMeas,
        angle,
        correction,
        iCorrected: iTh * correction
      };
    }).filter(r => r !== null) as Array<{
      hkl: string;
      h: number; k: number; l: number;
      iTh: number;
      iMeas: number;
      angle: number;
      correction: number;
      iCorrected: number;
    }>;
  }, [inputData, rValue, targetHKL]);

  // Scale the corrected intensity for visual overlap to measured if measured values exist
  const overlayResults = useMemo(() => {
    if (results.length === 0) return [];
    
    // Compute best scale factor c where Sum_i ( IMeas_i - c * ICorrected_i )^2 is minimized
    // c = Sum (IMeas * ICorr) / Sum (ICorr ^ 2)
    let sumMeasCorr = 0;
    let sumCorrSq = 0;
    results.forEach(r => {
      sumMeasCorr += r.iMeas * r.iCorrected;
      sumCorrSq += r.iCorrected * r.iCorrected;
    });
    
    const scale = sumCorrSq > 0 ? (sumMeasCorr / sumCorrSq) : 1;
    
    return results.map(r => ({
      ...r,
      iModeledScaled: r.iCorrected * scale
    }));
  }, [results]);

  const chartData = useMemo(() => {
    return overlayResults.map(r => ({
      name: r.hkl,
      'Random standard': parseFloat(r.iTh.toFixed(precision)),
      'Model (March-Dollase)': parseFloat(r.iModeledScaled.toFixed(precision)),
      'Measured Experimental': parseFloat(r.iMeas.toFixed(precision)),
      'Correction Factor': parseFloat(r.correction.toFixed(precision))
    }));
  }, [overlayResults, precision]);

  // Solver: Fit r to minimize Rwp
  const runParameterRefinement = () => {
    if (results.length === 0) {
      alert("No valid reflection data specified. Please enter elements under Reflections.");
      return;
    }

    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];

    const measurements = results.map(r => {
      const angle = calculateCubicAngle(r.h, r.k, r.l, H, K, L);
      return {
        iTh: r.iTh,
        iMeas: r.iMeas,
        angle
      };
    });

    let bestR = 1.0;
    let minRwp = Infinity;
    let finalScaling = 1.0;

    // Fast global search sweep from r=0.1 to r=5.0 with high precision 0.005
    for (let r = 0.1; r <= 5.0; r += 0.005) {
      let sumMeasCorr = 0;
      let sumCorrSq = 0;
      
      // Calculate corrections for this r
      const currentCorrs = measurements.map(m => {
        const corr = calculateMarchDollase(r, m.angle);
        const iCorrected = m.iTh * corr;
        return { iCorrected, iMeas: m.iMeas };
      });

      currentCorrs.forEach(cItem => {
        sumMeasCorr += cItem.iMeas * cItem.iCorrected;
        sumCorrSq += cItem.iCorrected * cItem.iCorrected;
      });

      const scale = sumCorrSq > 0 ? (sumMeasCorr / sumCorrSq) : 1;

      // Compute Rwp
      let num = 0;
      let den = 0;
      currentCorrs.forEach(cItem => {
        const diff = cItem.iMeas - scale * cItem.iCorrected;
        num += diff * diff;
        den += cItem.iMeas * cItem.iMeas;
      });

      const Rwp = den > 0 ? Math.sqrt(num / den) * 100 : 0;
      if (Rwp < minRwp) {
        minRwp = Rwp;
        bestR = r;
        finalScaling = scale;
      }
    }

    // Compute initial Rwp with r=1.00 (Random)
    let initNum = 0;
    let initDen = 0;
    let initScaleSumMeas = 0;
    let initScaleSumTh = 0;
    measurements.forEach(m => {
      initScaleSumMeas += m.iMeas * m.iTh;
      initScaleSumTh += m.iTh * m.iTh;
    });
    const initScale = initScaleSumTh > 0 ? (initScaleSumMeas / initScaleSumTh) : 1;
    measurements.forEach(m => {
      const diff = m.iMeas - initScale * m.iTh;
      initNum += diff * diff;
      initDen += m.iMeas * m.iMeas;
    });
    const initialRwp = initDen > 0 ? Math.sqrt(initNum / initDen) * 100 : 0;

    // Apply refined r to state
    setRValue(parseFloat(bestR.toFixed(3)));
    setSolverResult({
      refinedR: parseFloat(bestR.toFixed(3)),
      initialRwp,
      finalRwp: minRwp,
      scalingFactor: finalScaling,
      message: `Rwp reduced from ${initialRwp.toFixed(1)}% (isotropic) to ${minRwp.toFixed(1)}% with optimal March r value of ${bestR.toFixed(3)}.`
    });
  };

  // Instant calculation for angle solver block
  const userTestAngle = useMemo(() => {
    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];
    return calculateCubicAngle(testH, testK, testL, H, K, L);
  }, [testH, testK, testL, targetHKL]);

  const userTestCorrection = useMemo(() => {
    return calculateMarchDollase(rValue, userTestAngle);
  }, [rValue, userTestAngle]);

  // Compute live properties
  const maxCorrection = useMemo(() => {
    return calculateMarchDollase(rValue, 0); // Parallel (alpha=0)
  }, [rValue]);

  const minCorrection = useMemo(() => {
    return calculateMarchDollase(rValue, 90); // Perpendicular (alpha=90)
  }, [rValue]);

  // Render beautiful 2D polar texture contour map representing the ODF
  const polarOdfPath = useMemo(() => {
    const points: string[] = [];
    const center = 100;
    const randomRadius = 50; // Radius where P(alpha)=1.0
    
    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      // March correction for angle relative to preferred orientation (drawn aligned with top vertical, deg = 90)
      // Angle alpha is measured from vertical axis
      const alpha = deg; 
      const pVal = calculateMarchDollase(rValue, alpha);
      
      // Limit scale factor from running off the SVG boundary (max radius 95px)
      const scaledRadius = Math.min(randomRadius * pVal, 95);
      
      const x = center + scaledRadius * Math.sin(rad);
      const y = center - scaledRadius * Math.cos(rad);
      
      if (deg === 0) {
        points.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ') + ' Z';
  }, [rValue]);

  return (
    <div className="space-y-6 flex flex-col min-h-screen">
      
      {/* Top Description Hub */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-md text-[10px] font-mono tracking-widest text-indigo-400 font-extrabold uppercase">
                Texture-Rich Sample Suite
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md text-[10px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase">
                March-Dollase Active
              </span>
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight font-sans">
              Preferred Orientation Analyzer
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Analyze crystallite fiber texture and correct diffraction peak intensity anomalies using the industry-standard <strong>March-Dollase Model</strong>. Simulate platelets, needle configurations, and run interactive Rwp numeric optimization on physical data.
            </p>
          </div>

          {/* Core Navigation Selector */}
          <div className="flex flex-row p-1.5 bg-black/40 rounded-xl border border-slate-800 self-start md:self-center">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-lg text-xs uppercase font-black tracking-wider transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'simulator' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Simulator
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`px-4 py-2 rounded-lg text-xs uppercase font-black tracking-wider transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'formulas' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Theory & Formulas
            </button>
            <button
              onClick={() => setActiveTab('solver')}
              className={`px-4 py-2 rounded-lg text-xs uppercase font-black tracking-wider transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'solver' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> R-Factor Fitting
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab content switch */}
      <AnimatePresence mode="wait">
        {activeTab === 'simulator' && (
          <motion.div 
            key="simulator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Control Column */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Presets Card */}
              <div className="bg-slate-900 p-6 border border-slate-800 rounded-3xl h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs uppercase font-black text-white tracking-widest">
                    Quick Preset Demonstrations
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {PRESETS.map((p, index) => (
                    <button
                      key={index}
                      onClick={() => selectPreset(p)}
                      className="group flex flex-col text-left p-3 rounded-xl border border-slate-800 hover:border-slate-700/80 bg-slate-950/40 hover:bg-slate-800/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold text-slate-200 text-xs group-hover:text-white flex items-center gap-2">
                          {p.icon}
                          {p.name}
                        </span>
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          r = {p.r.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans leading-normal">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Parameter Inputs */}
              <div className="bg-slate-900 p-6 border border-slate-800 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-xs uppercase font-black text-white tracking-widest mb-4 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" /> Adjust Texture Model
                  </h3>
                  
                  {/* March Slider */}
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">March r parameter</span>
                      <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold text-sm">
                        {rValue.toFixed(3)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="4.0"
                      step="0.01"
                      value={rValue}
                      onChange={(e) => {
                        setRValue(parseFloat(e.target.value));
                        setSolverResult(null);
                      }}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>r ≪ 1.0 (Plates)</span>
                      <span>Random (1.00)</span>
                      <span>r ≫ 1.0 (Needles)</span>
                    </div>
                  </div>
                </div>

                {/* Preferred Direction Vector H,K,L */}
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <MoveRight className="w-3.5 h-3.5 text-indigo-400" />
                      Preferred Axis [H, K, L]
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Cubic/Ortho Metric</span>
                  </div>
                  <input
                    type="text"
                    value={targetHKL}
                    onChange={(e) => {
                      setTargetHKL(e.target.value);
                      setSolverResult(null);
                    }}
                    placeholder="0, 0, 1"
                    className="w-full px-3 py-2 bg-slate-950 font-mono text-sm text-indigo-400 border border-slate-800 rounded-lg outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    This vector defines the fiber axis. Grains incline structurally along or away from this reciprocal crystal normal.
                  </p>
                </div>

                {/* Live Model Stats Block */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-400 font-black uppercase text-[10px] tracking-wider mb-2">
                    Crystallographic Scale Diagnostics
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Parallel Intensity (P_0°)</span>
                    <span className={`font-mono font-bold ${rValue < 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(maxCorrection).toFixed(3)}x
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Transverse Intensity (P_90°)</span>
                    <span className={`font-mono font-bold ${rValue > 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(minCorrection).toFixed(3)}x
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Habit Class</span>
                    <span className="font-mono text-indigo-300 font-bold uppercase text-[10px]">
                      {rValue === 1.0 
                        ? 'Isotropic (No Texture)' 
                        : rValue < 1.0 
                          ? 'Platelet / Flattening' 
                          : 'Needle / Needle Axis'}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Visual & Plot Column */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* Plot Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual ODF Polar Contour */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl" />
                  <div>
                    <h3 className="text-xs uppercase font-black text-white tracking-widest mb-1 flex items-center gap-1.5">
                      <CircleDot className="w-4 h-4 text-indigo-400" /> Polar ODF Figure
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">
                      Probability density W(α)
                    </p>
                  </div>
                  
                  {/* Central SVG Canvas showing the March model */}
                  <div className="flex justify-center items-center py-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 relative">
                    <svg width="200" height="200" className="overflow-visible">
                      {/* Grid concentric circles */}
                      <circle cx="100" cy="100" r="50" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="25" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="75" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
                      
                      {/* Axes */}
                      <line x1="100" y1="5" x2="100" y2="195" stroke="#1e293b" strokeWidth="1" strokeDasharray="1 3" />
                      <line x1="5" y1="100" x2="195" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="1 3" />
                      
                      {/* Text tags */}
                      <text x="100" y="15" fill="#475569" fontSize="8" textAnchor="middle" className="font-mono">preferred direction (0°)</text>
                      <text x="180" y="105" fill="#475569" fontSize="8" textAnchor="end">90° facet</text>
                      
                      {/* Random reference ring (r=1.0) */}
                      <circle cx="100" cy="100" r="50" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
                      
                      {/* Real-time March ODF contours */}
                      <path 
                        d={polarOdfPath} 
                        fill="rgba(99, 102, 241, 0.12)" 
                        stroke="#6366f1" 
                        strokeWidth="2.5" 
                        className="transition-all duration-300 ease-out" 
                      />
                    </svg>
                  </div>

                  <div className="mt-4 text-[10px] text-slate-400 font-sans leading-normal">
                    The solid <span className="text-indigo-400 font-bold">purple line</span> maps W(α) vs inclination angle α. The dashed circle shows random distribution. Note the stretching under non-isotropic texture!
                  </div>
                </div>

                {/* Intensity Profile Chart */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-black text-white tracking-widest mb-1 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" /> Simulated Intensity Anomalies
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-5">
                      Theoretical Random standards vs corrected March-Dollase model
                    </p>
                  </div>

                  <div className="h-[230px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#475569" 
                          tick={{ fontSize: 10, fill: '#94a3b8' }} 
                          axisLine={{ stroke: '#334155' }} 
                        />
                        <YAxis 
                          stroke="#475569" 
                          tick={{ fontSize: 10, fill: '#94a3b8' }} 
                          axisLine={{ stroke: '#334155' }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                          labelClassName="font-bold text-white text-xs mb-1 font-mono"
                          itemStyle={{ fontSize: '11px', padding: '2px 0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                        <Bar dataKey="Random standard" fill="#334155" name="Random Standard (no texture)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Model (March-Dollase)" fill="#6366f1" name="March Model (with texture)" radius={[4, 4, 0, 0]} />
                        {results.some(r => r.iMeas !== r.iTh) && (
                          <Bar dataKey="Measured Experimental" fill="#ec4899" name="Measured Experimental" radius={[4, 4, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Data Table with complete detail */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs uppercase font-black text-white tracking-widest flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" /> Reflection Correction Details
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                      Crystallographic correction for peak scaling
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-[9px] bg-slate-950 text-indigo-400 border border-slate-800 px-3 py-1 rounded-lg font-mono">
                      Target direction normal: [{targetHKL}]
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[9px] pb-2">
                        <th className="pb-3 px-2">Miller Index (hkl)</th>
                        <th className="pb-3 px-2">Angle w/ normal (α)</th>
                        <th className="pb-3 px-2">Correction P(α)</th>
                        <th className="pb-3 px-2">Standard Intensity</th>
                        <th className="pb-3 px-2">Measured/Target</th>
                        <th className="pb-3 px-2 text-right">Modeled Intensity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overlayResults.map((r, i) => {
                        // Color label representing enhancement or reduction factor
                        const isEnhancement = r.correction > 1.0;
                        const percentDiff = Math.abs((r.correction - 1.0) * 100);
                        return (
                          <tr key={i} className="border-b border-indigo-950/10 font-mono hover:bg-slate-800/20 transition-colors">
                            <td className="py-3 px-2 text-indigo-400 font-bold text-sm">
                              {r.hkl}
                            </td>
                            <td className="py-3 px-2 text-slate-300">
                              {r.angle.toFixed(1)}°
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                                r.correction === 1.0 
                                  ? 'bg-slate-850 text-slate-400' 
                                  : isEnhancement 
                                    ? 'bg-emerald-500/10 text-emerald-400' 
                                    : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {r.correction.toFixed(4)}
                                {percentDiff > 0.5 && (
                                  <span className="text-[8px] font-normal ml-1">
                                    ({isEnhancement ? '+' : '-'}{percentDiff.toFixed(0)}%)
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-400">
                              {r.iTh.toFixed(1)}
                            </td>
                            <td className="py-3 px-2 text-slate-300">
                              {r.iMeas.toFixed(1)}
                            </td>
                            <td className="py-3 px-2 text-white font-extrabold text-right">
                              {r.iModeledScaled.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                      {overlayResults.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 uppercase font-black tracking-widest">
                            No valid reflex reflection lines entered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Live Input Field editing reflections */}
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono font-black text-slate-400 uppercase tracking-widest">
                      Edit Scattering Points Database (Paste/Write below)
                    </span>
                    <span className="text-slate-500 font-mono">Format: h, k, l, standard_i, measured_i</span>
                  </div>
                  <textarea
                    value={inputData}
                    onChange={(e) => {
                      setInputData(e.target.value);
                      setSolverResult(null);
                    }}
                    className="w-full h-24 px-3 py-2 bg-slate-950 outline-none font-mono text-xs border border-slate-850 text-indigo-400 rounded-xl resize-none custom-scrollbar leading-relaxed"
                  />
                </div>
              </div>

              {/* Instant Angle calculator tool */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4">
                  <h3 className="text-xs uppercase font-black text-white tracking-widest flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Dot Product Angle Solver
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Instantly compute inclination angle and Dollase correction for any arbitrary index.
                  </p>
                </div>
                
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-slate-500 block">Index h</label>
                    <input 
                      type="number" 
                      value={testH} 
                      onChange={(e) => setTestH(parseInt(e.target.value) || 0)} 
                      className="w-16 px-2.5 py-1.5 bg-black/50 text-slate-200 font-mono text-center rounded border border-slate-805"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-slate-500 block">Index k</label>
                    <input 
                      type="number" 
                      value={testK} 
                      onChange={(e) => setTestK(parseInt(e.target.value) || 0)} 
                      className="w-16 px-2.5 py-1.5 bg-black/50 text-slate-200 font-mono text-center rounded border border-slate-805"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-slate-500 block">Index l</label>
                    <input 
                      type="number" 
                      value={testL} 
                      onChange={(e) => setTestL(parseInt(e.target.value) || 0)} 
                      className="w-16 px-2.5 py-1.5 bg-black/50 text-slate-200 font-mono text-center rounded border border-slate-805"
                    />
                  </div>
                </div>

                <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-805 text-xs space-y-1.5 leading-none">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono text-[10px]">Angle with [{targetHKL}]</span>
                    <span className="font-mono text-indigo-400 font-bold">{userTestAngle.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono text-[10px]">Correction P(α)</span>
                    <span className="font-mono text-emerald-400 font-bold">{userTestCorrection.toFixed(4)}x</span>
                  </div>
                </div>
              </div>

              {/* Core Scientific Analysis, Interpretation, & Educational Panel */}
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-sm uppercase font-black text-white tracking-widest flex items-center gap-2 mb-1.5 text-indigo-400">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> Continuous Real-Time Texture Analysis Report
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    This advanced reporting engine computes physical characteristics of your active specimen. Read below to understand what is going on in this analysis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-850">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                       <Info className="w-4 h-4 text-sky-400" /> Active State Physics & Interpretation
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {rValue === 1.0 ? (
                        <>
                          Your current parameter <span className="font-mono text-emerald-400 font-bold">r = 1.00</span> models an <span className="text-slate-200 font-semibold">Ideal Isotropic Powder</span>. All grains are randomly oriented in space. There are zero systematic intensity anomalies, meaning the correction factor <span className="font-mono text-indigo-400">P(α) = 1.000</span> for all angles.
                        </>
                      ) : rValue < 1.0 ? (
                        <>
                          At <span className="font-mono text-emerald-400 font-bold">r = {rValue.toFixed(2)}</span>, the system models a <span className="text-sky-400 font-bold">Platelet Habit alignment</span> (plateline texture). Under compaction or settling, flat crystal plates settle with their face normals parallel to the sample surface (displacement axis [{targetHKL}]). This causes the perpendicular reflections (α = 0°) to be scaled up by an extreme <span className="text-emerald-400 font-bold">{(maxCorrection).toFixed(2)}x</span> intensity boost. Conversely, side facets parallel to the shear vector (α = 90°) are deeply suppressed to <span className="text-rose-400 font-bold">{(minCorrection).toFixed(2)}x</span>.
                        </>
                      ) : (
                        <>
                          At <span className="font-mono text-emerald-400 font-bold">r = {rValue.toFixed(2)}</span>, the system models an <span className="text-amber-400 font-bold font-sans">Acicular / Needle Habit alignment</span> (needle-like columns). Under extrusion, tape casting, or vertical growth, the needle cylinder axis aligns down or perpendicular to gravity parallel to the preferred normal [{targetHKL}]. This stretches the ODF and severely suppresses longitudinal reflections (α = 0°) down to <span className="text-rose-400 font-bold">{(maxCorrection).toFixed(2)}x</span>. Transverse side wall orientations (α = 90°) receive an intensity boost up to <span className="text-emerald-400 font-bold">{(minCorrection).toFixed(2)}x</span>.
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      <strong>Scattering Redistribution Law:</strong> Notice that preferred orientation <em className="text-slate-300">does not create or destroy scattered x-rays</em>. It systematically redistributes them in reciprocal space relative to the sample holder geometry, creating intensity peaks at specific angles and valleys at others.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                       <BookOpen className="w-4 h-4 text-emerald-400" /> What is this Analysis used for?
                    </h4>
                    <ul className="text-[11px] text-slate-400 space-y-2 leading-relaxed list-disc list-inside">
                      <li>
                        <strong className="text-slate-200">Semiconductor Device Quality:</strong> Epitaxial thin films of Silicon, Gallium Nitride (GaN), or Aluminum Nitride grow as vertical columnar or highly textured crystalline structures. Preferred orientation analysis ensures uniform grain texture alignment, which directly translates to superior charge carrier mobility and acoustic wave piezoelectric efficiency in sub-micron IC electronic devices.
                      </li>
                      <li>
                        <strong className="text-slate-200">Rietveld Refinement Fitting:</strong> Without March-Dollase correction, simulated XRD models fail to match experimental patterns, leading to highly inaccurate structural fits. Fitting the <em className="text-indigo-400 font-mono">r</em> parameter mathematically restores proper phase metrics.
                      </li>
                      <li>
                        <strong className="text-slate-200">Anisotropic Physical Properties:</strong> In advanced materials, battery electrodes (such as graphite plates or lithium cobalt oxide cathodes), preferred orientation of lithium-ion diffusion channels highly influences maximum charging speeds and cyclic battery life.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Theory Tab */}
        {activeTab === 'formulas' && (
          <motion.div 
            key="formulas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Formula Panel */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div>
                  <h2 className="text-lg font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" /> March-Dollase Mathematical Formulation
                  </h2>
                  <p className="text-xs text-slate-400">
                    The mathematical derivation of sample structural orientation during diffraction modeling.
                  </p>
                </div>

                {/* Super Nice Formula Display Cards */}
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-850 flex flex-col items-center justify-center space-y-4">
                  <div className="text-center font-serif text-slate-200 text-xl md:text-2xl tracking-wide max-w-full overflow-x-auto py-3 px-4 bg-black/40 rounded-xl">
                    P(<span className="text-indigo-400">α</span>) = [ <span className="text-pink-400">r</span><sup>2</sup> cos<sup>2</sup><span className="text-indigo-400">α</span> + <span className="text-pink-400">r</span><sup>-1</sup> sin<sup>2</sup><span className="text-indigo-400">α</span> ]<sup>-3/2</sup>
                  </div>
                  
                  <div className="w-full text-xs text-slate-400 space-y-2 border-t border-slate-800/50 pt-4">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-400 min-w-[20px]">α</span>
                      <span>The angle between the reciprocal lattice vector of the reflection (hkl) and the axis of preferred orientation (fiber axis).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-pink-400 min-w-[20px]">r</span>
                      <span>The March-Dollase parameter, representing sample habit profile.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-200 min-w-[20px]">P(α)</span>
                      <span>The multiplicative scale factor applied to the randomized theoretical peak intensity: <code className="text-xs bg-slate-900 px-1 py-0.5 rounded text-indigo-400">I_corrected = I_isotropic * P(α)</code></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-sans">
                  <h4 className="font-black text-white uppercase tracking-wider">Physical Phenomenological Cases:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-slate-850">
                      <div className="font-mono text-sky-400 font-extrabold text-sm mb-1">r &lt; 1.0 (Plateline Habit)</div>
                      <p className="text-[11px]">Crystallites are plate or disk-like. Under compaction, they align with their face normal parallel to normal, enhancing 0° parallel reflections and reducing 90° ones.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-slate-850">
                      <div className="font-mono text-slate-400 font-extrabold text-sm mb-1">r = 1.0 (Isotropic)</div>
                      <p className="text-[11px]">Ideal randomized powder sample without alignment. In this condition, March factor <code className="text-[10px] text-indigo-400">P(α) = 1.000</code> for all values of α.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-slate-850">
                      <div className="font-mono text-amber-400 font-extrabold text-sm mb-1">r &gt; 1.0 (Acicular / Rod-like)</div>
                      <p className="text-[11px]">Crystallites are needles. Extrusion forces drag the rod axis parallel, enhancing perpendicular transverse reflections and dampening normal ones.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Angle Formula panel */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div>
                  <h2 className="text-lg font-black text-indigo-400 uppercase tracking-widest mb-1">
                    Crystallographic Angle Math
                  </h2>
                  <p className="text-xs text-slate-400">
                    How α is calculated for cubic lattice systems:
                  </p>
                </div>

                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 space-y-4">
                  <div className="font-serif text-slate-200 text-center py-2 px-3 bg-black/40 rounded-xl text-base">
                    cos(α) = (h·H + k·K + l·L) / [ √(h²+k²+l²) · √(H²+K²+L²) ]
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-normal font-sans">
                    March models find standard vectors representing the normal. Since cubic systems feature perpendicular unit dimensions, the spatial angle derives directly from the vector dot-product between indices.
                  </p>
                </div>

                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" /> Integration in Rietveld Refinement
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    During structure fitting (like Rietveld simulation), preferred orientation causes major R-factor mismatch. Failing to correct for March-Dollase can artificially distort isotropic atomic displacement parameters (B-values) or thermal coefficients. Overlapping peak phases can only be accurately solved after fitting the r parameter iteratively.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Solver Tab */}
        {activeTab === 'solver' && (
          <motion.div 
            key="solver"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            
            {/* Input and run button side */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" /> Optimal March-Dollase Fit Solver
                </h3>
                <p className="text-xs text-slate-400">
                  Submit measured peak intensities to automatically fit the optimal March-Dollase parameter $r$.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-4">
                <p className="leading-relaxed">
                  Provide measured experimental peak values against random standards in the table. The solver sweeps the full analytical domain of March parameters ($r \in [0.1, 5.0]$) in 0.005 steps to find the global minimum for residual profiling factor R<sub>wp</sub>.
                </p>
                
                <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-900/30 text-indigo-200">
                  <strong>How to use:</strong> Select a platelet or needle preset from the main tab to populate test experimental data, or paste custom measurements in the main tab input panel, then click the fit solver below!
                </div>
              </div>

              <div>
                <button
                  onClick={runParameterRefinement}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white text-xs uppercase font-extrabold tracking-widest rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-hover" /> Refine and Fit Model Parameter (r)
                </button>
              </div>

              {/* Solver diagnostics display box */}
              {solverResult && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-805 space-y-3.5 relative overflow-hidden animate-in fade-in duration-300">
                  <div className="absolute top-0 right-0 p-2 text-[8px] uppercase tracking-widest font-mono text-emerald-400/20">
                    Optimization Engine Ready
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Solver Results Summary
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Refined Parameter r</span>
                      <strong className="text-lg text-emerald-400">{solverResult.refinedR}</strong>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">R_wp factor (Isotropic)</span>
                      <strong className="text-lg text-slate-400">{solverResult.initialRwp.toFixed(2)}%</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">R_wp factor (Fitted)</span>
                      <strong className="text-lg text-indigo-400">{solverResult.finalRwp.toFixed(2)}%</strong>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Overall scale factor (c)</span>
                      <strong className="text-lg text-slate-300">{solverResult.scalingFactor.toFixed(3)}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-normal pt-1">
                    {solverResult.message}
                  </p>
                </div>
              )}
            </div>

            {/* Visual comparison results side */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">
                  Model Fitting Graph Representation
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Fits model correction to real physical data
                </p>
              </div>

              <div className="h-[350px] w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelClassName="font-mono text-xs font-black text-white"
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Measured Experimental" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Model (March-Dollase)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-xs text-slate-400 leading-normal font-sans">
                The chart compares your <span className="text-pink-400 font-bold">Experimental measured intensity values</span> directly to the optimized <span className="text-indigo-400 font-bold">March-Dollase model intensities</span>. Notice how fitting the proper habit factor eliminates the original isotropic error.
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
