import React, { useState, useMemo, useRef } from 'react';
import { Rotate3d } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { calculateMarchDollase, calculateCubicAngle, calculateInterplanarAngle } from '../utils/physics';
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
  CircleDot,
  Download
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
  
  // 3D Crystallite Habit rotation
  const [habitRotX, setHabitRotX] = useState(20);
  const [habitRotY, setHabitRotY] = useState(35);
  const [isDraggingHabit, setIsDraggingHabit] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, rotX: 20, rotY: 35 });

  // Polar ODF interactive hover tracking
  const [polarHover, setPolarHover] = useState(null);

  const handlePolarMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * 200;
    const svgY = (y / rect.height) * 200;
    const dx = svgX - 100;
    const dy = 100 - svgY;
    let rad = Math.atan2(dx, dy);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    
    const alphaAngle = deg > 180 ? 360 - deg : deg;
    const finalAlpha = alphaAngle > 90 ? 180 - alphaAngle : alphaAngle;
    const pVal = calculateMarchDollase(rValue, finalAlpha, fraction);
    setPolarHover({ x: svgX, y: svgY, angle: deg, pVal });
  };
  
  // States
  const [habitModel, setHabitModel] = useState<'Platelet' | 'Cylindrical'>('Platelet');
  const [rValue, setRValue] = useState<number>(0.8);
  const [fraction, setFraction] = useState<number>(1.0);
  const [crystalSystem, setCrystalSystem] = useState<'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic'>('Cubic');
  const [latticeA, setLatticeA] = useState<number>(1.0);
  const [latticeB, setLatticeB] = useState<number>(1.0);
  const [latticeC, setLatticeC] = useState<number>(1.0);
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
    refinedFraction: number;
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
    setHabitModel(preset.r < 1.0 ? 'Platelet' : 'Cylindrical');
    setRValue(preset.r);
    setFraction(1.0);
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
      
      const angle = calculateInterplanarAngle(h, k, l, H, K, L, crystalSystem, latticeA, latticeB, latticeC);
      const correction = calculateMarchDollase(rValue, angle, fraction);
      
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

  const fitQuality = useMemo(() => {
    if (overlayResults.length === 0) return null;
    
    let sumSquaredError = 0;
    let sumSST = 0;
    let chiSquared = 0;
    
    // Mean of measured data
    const meanMeas = overlayResults.reduce((acc, r) => acc + r.iMeas, 0) / overlayResults.length;
    
    overlayResults.forEach(r => {
      const diff = r.iMeas - r.iModeledScaled;
      sumSquaredError += diff * diff;
      sumSST += r.iMeas * r.iMeas; 
      
      // Error variance is approx max(I_meas, 1) for Poisson stats
      const variance = Math.max(r.iMeas, 1);
      chiSquared += (diff * diff) / variance;
    });

    const Rwp = sumSST > 0 ? Math.sqrt(sumSquaredError / sumSST) * 100 : 0;
    
    // Degrees of freedom = N - P (assume P=3: scale factor, r, fraction)
    const dof = Math.max(overlayResults.length - 3, 1);
    const reducedChiSquared = chiSquared / dof;
    
    return {
      Rwp,
      reducedChiSquared,
      chiSquared,
      dof
    };
  }, [overlayResults]);

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
      const angle = calculateInterplanarAngle(r.h, r.k, r.l, H, K, L, crystalSystem, latticeA, latticeB, latticeC);
      return {
        iTh: r.iTh,
        iMeas: r.iMeas,
        angle
      };
    });

    let bestR = 1.0;
    let bestFraction = 1.0;
    let minRwp = Infinity;
    let finalScaling = 1.0;

    // Fast global 2D search sweep covering the selected habit model domain
    const rStart = habitModel === 'Platelet' ? 0.1 : 1.02;
    const rEnd = habitModel === 'Platelet' ? 0.98 : 5.0;

    for (let r = rStart; r <= rEnd; r += 0.02) {
      for (let f = 0.1; f <= 1.0; f += 0.02) {
        let scaleNum = 0;
        let scaleDen = 0;
        let num = 0;
        let den = 0;

        for (const m of measurements) {
          const corr = calculateMarchDollase(r, m.angle, f);
          const iCorrected = m.iTh * corr;
          scaleNum += m.iMeas * iCorrected;
          scaleDen += iCorrected * iCorrected;
        }

        const scale = scaleDen > 0 ? (scaleNum / scaleDen) : 1;

        for (const m of measurements) {
          const corr = calculateMarchDollase(r, m.angle, f);
          const iCorrected = m.iTh * corr;
          const diff = m.iMeas - scale * iCorrected;
          num += diff * diff;
          den += m.iMeas * m.iMeas;
        }

        const Rwp = den > 0 ? Math.sqrt(num / den) * 100 : 0;
        if (Rwp < minRwp) {
          minRwp = Rwp;
          bestR = r;
          bestFraction = f;
          finalScaling = scale;
        }
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

    // Apply refined parameters
    setRValue(parseFloat(bestR.toFixed(3)));
    setFraction(parseFloat(bestFraction.toFixed(3)));
    setSolverResult({
      refinedR: parseFloat(bestR.toFixed(3)),
      refinedFraction: parseFloat(bestFraction.toFixed(3)),
      initialRwp,
      finalRwp: minRwp,
      scalingFactor: finalScaling,
      message: `Rwp reduced from ${initialRwp.toFixed(1)}% to ${minRwp.toFixed(1)}% (r = ${bestR.toFixed(3)}, f = ${(bestFraction * 100).toFixed(0)}%).`
    });
  };

  // Instant calculation for angle solver block
  const userTestAngle = useMemo(() => {
    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];
    return calculateInterplanarAngle(testH, testK, testL, H, K, L, crystalSystem, latticeA, latticeB, latticeC);
  }, [testH, testK, testL, targetHKL, crystalSystem, latticeA, latticeB, latticeC]);

  const userTestCorrection = useMemo(() => {
    return calculateMarchDollase(rValue, userTestAngle, fraction);
  }, [rValue, userTestAngle, fraction]);

  // Compute live properties
  const maxCorrection = useMemo(() => {
    return calculateMarchDollase(rValue, 0, fraction); // Parallel (alpha=0)
  }, [rValue, fraction]);

  const minCorrection = useMemo(() => {
    return calculateMarchDollase(rValue, 90, fraction); // Perpendicular (alpha=90)
  }, [rValue, fraction]);

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
      const pVal = calculateMarchDollase(rValue, alpha, fraction);
      
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

  const exportToCSV = () => {
    if (overlayResults.length === 0) return;
    
    const headers = ["hkl", "h", "k", "l", "Angle (alpha)", "Correction P(alpha)", "Standard Intensity", "Measured Intensity", "Modeled Scaled Intensity"];
    const rows = overlayResults.map(r => [
      `"${r.hkl}"`,
      r.h,
      r.k,
      r.l,
      r.angle.toFixed(3),
      r.correction.toFixed(4),
      r.iTh.toFixed(1),
      r.iMeas.toFixed(1),
      r.iModeledScaled.toFixed(1)
    ]);
    
    const metaInfo = [
      ["March-Dollase Parameter r", rValue.toFixed(3)],
      ["Textured Fraction f", fraction.toFixed(3)],
      ["Preferred Axis [H K L]", `"[${targetHKL}]"`],
      ["Crystal System", crystalSystem],
      []
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + metaInfo.map(e => e.join(",")).join("\n")
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `march_dollase_export_r${rValue.toFixed(2)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 flex flex-col pt-4 min-h-[90vh] relative z-10 w-full mb-32 custom-scrollbar">
      {/* Top Description Hub */}
      <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 p-32 opacity-10 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-bl-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-mono tracking-widest text-indigo-400 font-extrabold uppercase flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Texture-Rich Sample Suite
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> March-Dollase Active
              </div>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 uppercase tracking-tight font-sans">
              Preferred Orientation Analyzer
            </h1>
            <p className="text-sm text-slate-500 mt-3 max-w-2xl leading-relaxed">
              Analyze crystallite fiber texture and correct diffraction peak intensity anomalies using the industry-standard <strong className="text-slate-300">March-Dollase Model</strong>. Simulate platelets, needle configurations, and run interactive Rwp numeric optimization on physical data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Control Column */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Quick Preset Demonstrations */}
          <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-md relative z-0 group">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 max-w-fit bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest group-hover:text-indigo-400 transition-colors">
                Demonstrations
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p, index) => (
                <button
                  key={index}
                  onClick={() => selectPreset(p)}
                  className="group/btn flex flex-col text-left p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 bg-black/40 hover:bg-indigo-500/10 transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-slate-300 text-xs flex items-center gap-2 transition-colors">
                      <div className="text-indigo-400 group-hover/btn:scale-110 transition-transform">
                        {p.icon}
                      </div>
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] font-black text-indigo-400 bg-black/40 border border-indigo-500/20 px-2 py-1 rounded-lg shadow-inner group-hover/btn:bg-indigo-500/20 transition-colors">
                      r = {p.r.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 group-hover/btn:text-slate-400 font-sans leading-relaxed transition-colors mt-1">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Adjust Texture Model */}
          <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all backdrop-blur-md space-y-6 relative z-0">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 max-w-fit bg-sky-500/10 rounded-lg border border-sky-500/20 shadow-inner">
                <Sliders className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest">
                Adjust Texture Model
              </h3>
            </div>
            
            {/* March Slider */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-sky-500/30 transition-all group/slider shadow-inner">
              <div className="flex justify-between items-center text-xs mb-4">
                <span className="font-bold text-slate-500 group-hover/slider:text-sky-400 transition-colors uppercase tracking-widest text-[9px] font-mono">Habit Distribution Model</span>
              </div>
              
              <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 mb-5">
                 <button
                   onClick={() => {
                     setHabitModel('Platelet');
                     if (rValue > 1.0) setRValue(0.5);
                     setSolverResult(null);
                   }}
                   className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${habitModel === 'Platelet' ? 'bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
                 >
                   Platelet (Platy)
                 </button>
                 <button
                   onClick={() => {
                     setHabitModel('Cylindrical');
                     if (rValue < 1.0) setRValue(2.0);
                     setSolverResult(null);
                   }}
                   className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${habitModel === 'Cylindrical' ? 'bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
                 >
                   Cylindrical (Needle)
                 </button>
              </div>

              <div className="flex flex-col space-y-3">
                 <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-400 text-[11px]">March r parameter</span>
                   <span className="font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-lg font-black text-[11px] shadow-inner">
                     {rValue.toFixed(3)}
                   </span>
                 </div>
                 <input
                   type="range"
                   min={habitModel === 'Platelet' ? 0.1 : 1.02}
                   max={habitModel === 'Platelet' ? 0.98 : 4.0}
                   step="0.01"
                   value={rValue}
                   onChange={(e) => {
                     setRValue(parseFloat(e.target.value));
                     setSolverResult(null);
                   }}
                   className="w-full accent-sky-500 py-2 cursor-ew-resize opacity-80 hover:opacity-100 transition-opacity"
                 />
                 <div className="flex justify-between text-[9px] font-black font-mono text-slate-600 mt-2 uppercase tracking-widest">
                   {habitModel === 'Platelet' ? (
                     <><span>r ≪ 1.0 (Plates)</span><span>Iso (≈1.0)</span></>
                   ) : (
                     <><span>Iso (≈1.0)</span><span>r ≫ 1.0 (Needles)</span></>
                   )}
                 </div>
              </div>
            </div>

            {/* Preferred Direction Vector */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group/vector flex flex-col space-y-4 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-slate-500 group-hover/vector:text-indigo-400 transition-colors uppercase tracking-widest text-[9px] font-mono flex items-center gap-1.5">
                   <MoveRight className="w-4 h-4" /> Preferred Axis [H, K, L]
                 </span>
                 <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Fiber Normal</span>
              </div>
              <input
                type="text"
                value={targetHKL}
                onChange={(e) => {
                  setTargetHKL(e.target.value);
                  setSolverResult(null);
                }}
                placeholder="0, 0, 1"
                className="w-full px-4 py-2.5 bg-black/60 text-slate-200 focus:text-indigo-400 border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all font-mono shadow-inner font-bold text-sm"
              />
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group/fraction flex flex-col space-y-4 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 group-hover/fraction:text-emerald-400 transition-colors uppercase tracking-widest text-[9px] font-mono flex items-center gap-1.5">
                   <Activity className="w-4 h-4" /> Textured Fraction (f)
                </span>
                <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-[11px] shadow-inner">
                  {(fraction * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={fraction}
                onChange={(e) => {
                  setFraction(parseFloat(e.target.value));
                  setSolverResult(null);
                }}
                className="w-full accent-emerald-500 py-2 cursor-ew-resize opacity-80 hover:opacity-100 transition-opacity"
              />
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Real samples contain an un-textured isotropic background phase.
              </p>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all group/crystal flex flex-col space-y-4 shadow-inner">
              <div className="flex justify-between items-center text-xs mb-1">
                 <span className="font-bold text-slate-500 group-hover/crystal:text-pink-400 transition-colors uppercase tracking-widest text-[9px] font-mono flex items-center gap-1.5">
                   <Layers className="w-4 h-4" /> Crystal System
                 </span>
              </div>
              <select 
                value={crystalSystem}
                onChange={(e) => {
                  setCrystalSystem(e.target.value as any);
                  setSolverResult(null);
                }}
                className="w-full px-4 py-2.5 bg-black/60 text-slate-200 border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all shadow-inner font-bold text-xs"
              >
                <option value="Cubic" className="bg-slate-900 text-slate-200">Cubic / Isomeric (a=b=c)</option>
                <option value="Tetragonal" className="bg-slate-900 text-slate-200">Tetragonal (a=b≠c)</option>
                <option value="Hexagonal" className="bg-slate-900 text-slate-200">Hexagonal (a=b≠c, γ=120°)</option>
                <option value="Orthorhombic" className="bg-slate-900 text-slate-200">Orthorhombic (a≠b≠c)</option>
              </select>
              
              {crystalSystem !== 'Cubic' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-500 font-mono">a (Å)</label>
                    <input 
                      type="number" step="0.01" min="0.1" value={latticeA} 
                      onChange={(e) => { setLatticeA(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                      className="w-full px-2 py-2 bg-black/60 text-pink-400 border border-white/10 rounded-lg outline-none focus:border-pink-500/50 shadow-inner font-mono text-xs text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] uppercase font-bold text-slate-500 font-mono">b (Å)</label>
                     <input 
                       type="number" step="0.01" min="0.1" value={crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? latticeA : latticeB} 
                       onChange={(e) => { setLatticeB(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                       disabled={crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal'}
                       className={`w-full px-2 py-2 font-mono text-xs font-bold text-center border rounded-lg outline-none shadow-inner ${crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'bg-black/30 text-slate-600 border-transparent cursor-not-allowed' : 'bg-black/60 text-pink-400 border-white/10 focus:border-pink-500/50'}`}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] uppercase font-bold text-slate-500 font-mono">c (Å)</label>
                     <input 
                       type="number" step="0.01" min="0.1" value={latticeC} 
                       onChange={(e) => { setLatticeC(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                       className="w-full px-2 py-2 bg-black/60 text-pink-400 border border-white/10 rounded-lg outline-none focus:border-pink-500/50 shadow-inner font-mono text-xs text-center font-bold"
                     />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 shadow-inner">
              <div className="text-slate-500 font-black uppercase text-[9px] tracking-widest font-mono mb-3">
                Crystallographic Diagnostics
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400 text-[11px] font-sans">Parallel Intensity (P_0°)</span>
                <span className={`font-mono font-black text-xs px-2 py-0.5 rounded shadow-inner ${rValue < 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {(maxCorrection).toFixed(3)}x
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400 text-[11px] font-sans">Transverse Intensity (P_90°)</span>
                <span className={`font-mono font-black text-xs px-2 py-0.5 rounded shadow-inner ${rValue > 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {(minCorrection).toFixed(3)}x
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-[11px] font-sans">Habit Class</span>
                <span className={`font-mono font-black uppercase text-[9px] tracking-widest px-2 py-1 rounded shadow-inner ${rValue === 1.0 ? 'bg-white/5 text-slate-300 border border-white/10' : rValue < 1.0 ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {rValue === 1.0 ? 'Isotropic' : rValue < 1.0 ? 'Platelet' : 'Needle'}
                </span>
              </div>
            </div>

            {fitQuality && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl backdrop-blur-md shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-16 opacity-10 bg-gradient-to-bl from-emerald-400 to-emerald-600 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                <div className="text-emerald-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4 font-mono relative z-10">
                  <Activity className="w-4 h-4" /> Quality of Fit
                </div>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center py-2 border-b border-indigo-500/10">
                    <span className="text-slate-300 text-xs">R<sub className="pointer-events-none mb-1">wp</sub> Factor</span>
                    <span className="font-mono text-emerald-400 font-black text-sm">
                      {fitQuality.Rwp.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                     <span className="flex flex-col gap-1">
                        <span className="text-slate-300 text-xs">Reduced Chi-Squared (<span className="font-serif italic font-bold">χ²<sub className="font-sans not-italic text-[10px]">r</sub></span>)</span>
                        <span className="text-[10px] text-slate-500 font-sans">Ideal ≈ 1.0 (DOF: {fitQuality.dof})</span>
                     </span>
                     <span className={`font-mono font-black text-sm px-2 py-1 rounded shadow-inner ${fitQuality.reducedChiSquared < 2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : fitQuality.reducedChiSquared < 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                       {fitQuality.reducedChiSquared.toFixed(2)}
                     </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={runParameterRefinement}
                className="w-full py-4 px-4 bg-gradient-to-br from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:scale-[0.98] text-white text-[11px] uppercase font-black tracking-widest rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
              >
                <RefreshCw className="w-4 h-4" /> Global Refinement
              </button>
              
              {solverResult && (
                <div className="mt-4 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 space-y-3 relative overflow-hidden backdrop-blur-md shadow-inner">
                  <div className="absolute top-0 right-0 p-16 opacity-10 bg-gradient-to-bl from-emerald-400 to-teal-400 rounded-bl-full pointer-events-none"></div>
                  <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3 font-mono relative z-10">
                    <Sparkles className="w-4 h-4" /> Refinement Successful
                  </div>
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex justify-between text-xs py-2 border-b border-emerald-500/10 items-center">
                      <span className="text-slate-300">New R<sub>wp</sub> Value</span>
                      <span className="font-mono font-black text-white bg-black/40 px-2 py-1 rounded shadow-inner text-sm">
                        {solverResult.finalRwp.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-2 border-b border-emerald-500/10 items-center">
                      <span className="text-slate-300">Fitted Extent (r)</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {solverResult.refinedR.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-2 items-center">
                       <span className="text-slate-300">Fraction (f)</span>
                       <span className="font-mono font-black text-emerald-400 text-sm">{(solverResult.refinedFraction * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-black/40 px-3 py-2.5 rounded-xl border border-emerald-500/20 shadow-inner relative z-10 flex gap-2 items-start">
                    <span className="text-emerald-500 font-mono text-sm mt-0.5">&gt;</span>
                    <p className="text-[10px] text-emerald-200/80 font-mono leading-relaxed">
                       {solverResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Visual & Plot Column */}
        <div className="xl:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual ODF Polar Contour */}
            <div className="lg:col-span-6 bg-black/40 border border-white/5 hover:border-white/10 transition-all rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between backdrop-blur-md z-0 group">
              <div className="absolute top-0 left-0 p-32 opacity-5 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-br-[100px] pointer-events-none group-hover:opacity-10 group-hover:scale-110 transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 py-1.5 max-w-fit bg-teal-500/10 rounded-lg border border-teal-500/20 shadow-inner">
                    <CircleDot className="w-4 h-4 text-teal-400" />
                  </div>
                  <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest">
                    Polar ODF Figure
                  </h3>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-6">
                  Probability density W(α)
                </p>
              </div>
              
              <div className="flex justify-center items-center py-6 bg-black/60 rounded-[2rem] border border-white/5 relative shadow-inner z-10 mt-auto">
                <svg 
                  width="200" 
                  height="200" 
                  className="overflow-visible filter drop-shadow-lg cursor-crosshair"
                  onMouseMove={handlePolarMouseMove}
                  onMouseLeave={() => setPolarHover(null)}
                >
                  <defs>
                    <radialGradient id="odfRadialGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                      <stop offset="80%" stopColor="#2dd4bf" stopOpacity={0.05}/>
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0}/>
                    </radialGradient>
                  </defs>

                  <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="25" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  
                  <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 4" />
                  <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 4" />
                  
                  <text x="100" y="15" fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono font-bold tracking-wider uppercase">0°</text>
                  <text x="180" y="105" fill="#64748b" fontSize="8" textAnchor="end" className="font-mono font-bold tracking-wider uppercase">90°</text>
                  
                  <circle cx="100" cy="100" r="50" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 2" className="opacity-80" />
                  
                  <path 
                    d={polarOdfPath} 
                    fill="url(#odfRadialGlow)" 
                    stroke="#2dd4bf" 
                    strokeWidth="2.5" 
                    className="transition-all duration-300 ease-out" 
                  />

                  {polarHover && (
                    <>
                      {/* Interactive hover sweep line */}
                      <line 
                        x1="100" 
                        y1="100" 
                        x2={polarHover.x} 
                        y2={polarHover.y} 
                        stroke="#2dd4bf" 
                        strokeWidth="1.5" 
                        strokeDasharray="2 2" 
                      />
                      {/* Pulse circle at hover cursor */}
                      <circle 
                        cx={polarHover.x} 
                        cy={polarHover.y} 
                        r="5" 
                        fill="#2dd4bf" 
                        className="animate-ping" 
                      />
                      <circle 
                        cx={polarHover.x} 
                        cy={polarHover.y} 
                        r="3.5" 
                        fill="#0c4a6e" 
                        stroke="#2dd4bf" 
                        strokeWidth="1.5" 
                      />
                    </>
                  )}
                </svg>
              </div>

              {/* Polar Hover HUD readout */}
              <div className="h-10 mt-4 flex items-center justify-center">
                {polarHover ? (
                  <div className="w-full bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-teal-500/20 flex justify-between items-center text-[10px] font-mono shadow-inner">
                    <span className="text-slate-400">Angle (α): <strong className="text-teal-400">{polarHover.angle.toFixed(0)}°</strong></span>
                    <span className="text-slate-400">P(α): <strong className="text-teal-400">{polarHover.pVal.toFixed(3)}x</strong></span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-sans italic text-center w-full">
                    Hover over chart to explore probability density
                  </div>
                )}
              </div>

              <div className="mt-4 text-[10px] text-slate-400 font-sans leading-relaxed text-center px-4 bg-teal-500/5 rounded-xl border border-teal-500/10 py-2.5 relative z-10 shadow-inner">
                The <span className="text-teal-400 font-bold px-1 rounded bg-teal-500/10">teal contour</span> maps probability. Dashed grey represents random powder.
              </div>
            </div>

            {/* Interactive 3D Crystal Habit Card */}
            <div 
              className="lg:col-span-6 bg-black/40 border border-white/5 hover:border-white/10 transition-all rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between backdrop-blur-md z-0 group"
              onMouseMove={(e) => {
                if (!isDraggingHabit) return;
                const dx = e.clientX - dragStart.current.x;
                const dy = e.clientY - dragStart.current.y;
                setHabitRotY(dragStart.current.rotY + dx * 0.5);
                setHabitRotX(dragStart.current.rotX - dy * 0.5);
              }}
              onMouseUp={() => setIsDraggingHabit(false)}
              onMouseLeave={() => setIsDraggingHabit(false)}
            >
              <div className="absolute top-0 left-0 p-32 opacity-5 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-br-[100px] pointer-events-none group-hover:opacity-10 group-hover:scale-110 transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 py-1.5 max-w-fit bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-inner">
                      <Rotate3d className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest">
                      Habit 3D Node
                    </h3>
                  </div>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-mono font-bold tracking-wider">
                    Drag to Orbit
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                  Interactive Geometric Representation
                </p>
              </div>

              {/* 3D Render Canvas Box */}
              <div 
                className="flex justify-center items-center py-6 bg-black/60 rounded-[2rem] border border-white/5 relative shadow-inner z-10 mt-auto select-none cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  setIsDraggingHabit(true);
                  dragStart.current = {
                    x: e.clientX,
                    y: e.clientY,
                    rotX: habitRotX,
                    rotY: habitRotY
                  };
                }}
              >
                <svg width="200" height="200" className="overflow-visible filter drop-shadow-lg">
                  <defs>
                    <radialGradient id="prismLightGlow" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#000000" stopOpacity={0.3} />
                    </radialGradient>
                  </defs>
                  
                  {/* Axis indicators in background */}
                  <g opacity="0.4">
                    <line x1="20" y1="180" x2="50" y2="180" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="55" y="183" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">x</text>

                    <line x1="20" y1="180" x2="20" y2="150" stroke="#2dd4bf" strokeWidth="1.5" />
                    <text x="18" y="145" fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">z</text>

                    <line x1="20" y1="180" x2="40" y2="165" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="44" y="163" fill="#3b82f6" fontSize="8" fontWeight="bold" fontFamily="monospace">y</text>
                  </g>

                  {/* Dynamic 3D Projected Prism faces */}
                  {(() => {
                    let radius = 38;
                    let height = 24;

                    if (rValue < 1.0) {
                      // Platelet: wider radius, thinner disk
                      radius = 42 + (1 - rValue) * 15;
                      height = Math.max(5, 20 * rValue);
                    } else if (rValue > 1.0) {
                      // Cylinder: narrow radius, tall column
                      radius = Math.max(14, 28 / Math.sqrt(rValue));
                      height = Math.min(75, 16 * rValue);
                    }

                    const vertices3D = [];

                    // Base hexagon (z = -height)
                    for (let i = 0; i < 6; i++) {
                      const angle = (i * 60 * Math.PI) / 180;
                      vertices3D.push({
                        x: radius * Math.cos(angle),
                        y: radius * Math.sin(angle),
                        z: -height
                      });
                    }
                    // Top hexagon (z = height)
                    for (let i = 0; i < 6; i++) {
                      const angle = (i * 60 * Math.PI) / 180;
                      vertices3D.push({
                        x: radius * Math.cos(angle),
                        y: radius * Math.sin(angle),
                        z: height
                      });
                    }

                    const projectPoint = (x, y, z, rx, ry) => {
                      const pitch = (rx * Math.PI) / 180;
                      const yaw = (ry * Math.PI) / 180;
                      
                      const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
                      const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
                      
                      const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
                      const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
                      
                      const d = 300;
                      const factor = d / (d + z2);
                      
                      const center = 100;
                      return { x: center + x1 * factor, y: center - y2 * factor, depth: z2 };
                    };

                    const pts = vertices3D.map(v => projectPoint(v.x, v.y, v.z, habitRotX, habitRotY));

                    const faces = [
                      // Bottom face
                      { indices: [5, 4, 3, 2, 1, 0], color: 'rgba(99, 102, 241, 0.12)', stroke: 'rgba(99, 102, 241, 0.45)', id: 'bottom' },
                      // Top face
                      { indices: [6, 7, 8, 9, 10, 11], color: rValue < 1.0 ? 'rgba(45, 212, 191, 0.3)' : 'rgba(45, 212, 191, 0.15)', stroke: '#2dd4bf', id: 'top' },
                      // Side faces
                      ...[0, 1, 2, 3, 4, 5].map(i => {
                        const next = (i + 1) % 6;
                        return {
                          indices: [i, next, next + 6, i + 6],
                          color: rValue < 1.0 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(99, 102, 241, 0.15)',
                          stroke: rValue < 1.0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.22)',
                          id: `side-${i}`
                        };
                      })
                    ];

                    const sortedFaces = faces.map(face => {
                      const avgDepth = face.indices.reduce((sum, idx) => sum + pts[idx].depth, 0) / face.indices.length;
                      return { ...face, avgDepth };
                    }).sort((a, b) => b.avgDepth - a.avgDepth);

                    const axisTop = projectPoint(0, 0, height + 40, habitRotX, habitRotY);
                    const axisBottom = projectPoint(0, 0, -(height + 40), habitRotX, habitRotY);

                    return (
                      <>
                        <line 
                          x1={axisBottom.x} y1={axisBottom.y} 
                          x2={100} y2={100} 
                          stroke="rgba(45, 212, 191, 0.3)" 
                          strokeWidth="1.5" 
                          strokeDasharray="3 3" 
                        />

                        {sortedFaces.map((face, fIdx) => {
                          const pointsStr = face.indices.map(idx => `${pts[idx].x.toFixed(1)},${pts[idx].y.toFixed(1)}`).join(' ');
                          const isTop = face.id === 'top';
                          return (
                            <polygon
                              key={fIdx}
                              points={pointsStr}
                              fill={isTop && rValue < 1.0 ? 'url(#prismLightGlow)' : face.color}
                              stroke={face.stroke}
                              strokeWidth={isTop ? "2" : "1"}
                              strokeLinejoin="round"
                            />
                          );
                        })}

                        <g>
                          <line 
                            x1={100} y1={100} 
                            x2={axisTop.x} y2={axisTop.y} 
                            stroke="#2dd4bf" 
                            strokeWidth="2.5" 
                            className="filter drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                          />
                          <circle cx={axisTop.x} cy={axisTop.y} r="3" fill="#2dd4bf" />
                          <text 
                            x={axisTop.x + 8} y={axisTop.y - 4} 
                            fill="#2dd4bf" 
                            fontSize="8" 
                            fontWeight="black" 
                            fontFamily="monospace"
                            className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                          >
                            [{targetHKL}] Axis
                          </text>
                        </g>

                        {rValue < 1.0 && (
                          <line 
                            x1={projectPoint(0, 0, height, habitRotX, habitRotY).x} 
                            y1={projectPoint(0, 0, height, habitRotX, habitRotY).y}
                            x2={axisTop.x}
                            y2={axisTop.y}
                            stroke="#fb7185"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        )}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="mt-4 text-[10px] text-slate-400 font-sans leading-relaxed text-center px-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 py-2.5 relative z-10 shadow-inner flex flex-col items-center gap-1">
                <span>
                  Aspect ratio matches r = <strong className="text-indigo-400">{rValue.toFixed(3)}</strong>.
                </span>
                <span className="text-slate-500">
                  {rValue < 1.0 
                    ? "Compact platelet geometries, basal plane aligns with target plane normal." 
                    : rValue > 1.0 
                      ? "Acicular needle geometries, longitudinal axis aligns with fiber direction."
                      : "Isotropic distribution (sphere-like random packing)."}
                </span>
              </div>
            </div>

          </div>

          {/* Intensity Profile Chart Card */}
          <div className="bg-black/40 border border-white/5 hover:border-white/10 transition-all rounded-[2rem] p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md relative z-0 group">
            <div className="absolute top-0 right-0 p-40 opacity-[0.03] bg-gradient-to-bl from-rose-500 to-indigo-500 rounded-bl-[150px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 py-1.5 max-w-fit bg-rose-500/10 rounded-lg border border-rose-500/20 shadow-inner">
                  <Activity className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest">
                  Simulated Intensity Anomalies
                </h3>
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-8">
                Theoretical Random vs March-Dollase Modeled
              </p>
            </div>

            <div className="h-[280px] w-full relative z-10 bg-black/40 p-4 rounded-3xl border border-white/5 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1e293b" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorMarch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#312e81" stopOpacity={0.25}/>
                      </linearGradient>
                      <linearGradient id="colorMeasured" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#500724" stopOpacity={0.25}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                      tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                      tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickMargin={10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,15,30,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(16px)', color: '#f1f5f9', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                      labelClassName="font-bold text-white text-xs mb-3 font-mono tracking-wider uppercase border-b border-white/10 pb-2"
                      itemStyle={{ fontSize: '11px', padding: '5px 0', fontFamily: 'monospace', fontWeight: 600 }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '25px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    <Bar dataKey="Random standard" fill="url(#colorStandard)" name="Standard (Random)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Model (March-Dollase)" fill="url(#colorMarch)" name="March Model" radius={[8, 8, 0, 0]} />
                    {results.some(r => r.iMeas !== r.iTh) && (
                      <Bar dataKey="Measured Experimental" fill="url(#colorMeasured)" name="Experimental Data" radius={[8, 8, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          {/* Data Table */}
          <div className="bg-black/40 border border-white/5 hover:border-white/10 transition-all rounded-[2rem] p-6 shadow-2xl space-y-6 backdrop-blur-md relative z-0">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 border-b border-white/5 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-1.5 py-1.5 max-w-fit bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-inner">
                     <Layers className="w-4 h-4 text-indigo-400" />
                   </div>
                   <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest">
                     Reflection Detail
                   </h3>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                  Absolute Corrected Values & Scale
                </p>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-[10px] bg-black/60 text-indigo-400 border border-white/10 px-4 py-2 rounded-xl font-mono font-black tracking-widest shadow-inner">
                  Target Normal: [{targetHKL}]
                </span>
                <button 
                  onClick={exportToCSV}
                  disabled={overlayResults.length === 0}
                  className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] disabled:bg-white/5 disabled:text-slate-600 disabled:border-transparent disabled:shadow-none text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar pb-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 uppercase font-black tracking-widest text-[9px] font-mono whitespace-nowrap">
                    <th className="pb-4 px-4 font-mono w-[15%]">hkl</th>
                    <th className="pb-4 px-4 font-mono w-[15%]">Angle (α)</th>
                    <th className="pb-4 px-4 font-mono w-[20%]">P(α) Correction</th>
                    <th className="pb-4 px-4 font-mono w-[15%]">Standard I</th>
                    <th className="pb-4 px-4 font-mono w-[15%]">Measured I</th>
                    <th className="pb-4 px-4 font-mono text-right text-indigo-400 w-[20%]">Modeled I</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {overlayResults.map((r, i) => {
                    const isEnhancement = r.correction > 1.0;
                    const percentDiff = Math.abs((r.correction - 1.0) * 100);
                    return (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors group/row">
                        <td className="py-4 px-4 text-white font-black tracking-wider">
                          <span className="bg-white/5 px-2 py-1 rounded shadow-inner inline-block min-w-[70px] text-center border border-white/5">
                            {r.hkl}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-bold">
                          {r.angle.toFixed(1)}°
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] tracking-wider shadow-inner inline-flex items-center gap-2 ${
                            r.correction === 1.0 
                              ? 'bg-black/60 border border-white/10 text-slate-400' 
                              : isEnhancement 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          }`}>
                            {r.correction.toFixed(4)}
                            {percentDiff > 0.5 && (
                              <span className="text-[9px] opacity-80 font-mono tracking-normal font-medium bg-black/20 px-1.5 py-0.5 rounded">
                                {isEnhancement ? '+' : '-'}{percentDiff.toFixed(0)}%
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-bold">
                          {r.iTh.toFixed(1)}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-black">
                          {r.iMeas.toFixed(1)}
                        </td>
                        <td className="py-4 px-4 text-right">
                           <span className="text-indigo-400 font-black text-sm bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-xl shadow-inner inline-block min-w-[60px] text-center">
                             {r.iModeledScaled.toFixed(1)}
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                  {overlayResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500 uppercase font-black tracking-widest text-[10px] font-mono border-t border-white/5 bg-black/20 rounded-b-3xl">
                        <div className="flex flex-col items-center justify-center gap-4">
                           <div className="p-4 bg-white/5 rounded-full shadow-inner">
                             <Activity className="w-8 h-8 text-slate-600" />
                           </div>
                           No valid measurement entries detected.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-inner group/edit hover:border-white/10 transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="p-1 bg-white/5 rounded border border-white/10">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                   </div>
                   <span className="font-mono font-black text-slate-300 group-hover/edit:text-white transition-colors uppercase tracking-widest text-[10px]">
                     Measurement Input Matrix
                   </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono font-bold tracking-widest shadow-inner border border-white/5">
                  Format: h, k, l, standard_i, measured_i
                </span>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => {
                  setInputData(e.target.value);
                  setSolverResult(null);
                }}
                className="w-full h-32 px-5 py-4 bg-black/40 outline-none font-mono text-[13px] border border-white/5 text-slate-300 focus:text-white rounded-2xl resize-none custom-scrollbar leading-loose focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner placeholder:text-slate-600"
                placeholder="0, 0, 1, 100, 100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Angle Calculator Mini Tool */}
            <div className="bg-black/40 border border-white/5 hover:border-white/10 transition-all p-8 rounded-[2rem] flex flex-col justify-between backdrop-blur-md relative overflow-hidden shadow-xl z-0 group">
               <div className="absolute top-0 right-0 p-32 opacity-10 bg-gradient-to-bl from-amber-400 to-amber-600 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
               <div className="relative z-10 mb-8">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
                     <BookOpen className="w-4 h-4 text-amber-400" />
                   </div>
                   <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest group-hover:text-amber-400 transition-colors">
                     Dot Product Angle Solver
                   </h3>
                 </div>
                 <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                   Compute arbitrary structural index pairs
                 </p>
               </div>
               
               <div className="flex flex-wrap items-center gap-4 mb-8 relative z-10 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                 <div className="space-y-2 flex-1 min-w-[60px]">
                   <label className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-widest">Index h</label>
                   <input 
                     type="number" 
                     value={testH} 
                     onChange={(e) => setTestH(parseInt(e.target.value) || 0)} 
                     className="w-full px-3 py-2.5 bg-black/60 text-white font-mono font-bold text-center rounded-xl border border-white/10 shadow-inner focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
                   />
                 </div>
                 <div className="space-y-2 flex-1 min-w-[60px]">
                   <label className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-widest">Index k</label>
                   <input 
                     type="number" 
                     value={testK} 
                     onChange={(e) => setTestK(parseInt(e.target.value) || 0)} 
                     className="w-full px-3 py-2.5 bg-black/60 text-white font-mono font-bold text-center rounded-xl border border-white/10 shadow-inner focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
                   />
                 </div>
                 <div className="space-y-2 flex-1 min-w-[60px]">
                   <label className="text-[9px] uppercase font-black text-slate-500 font-mono tracking-widest">Index l</label>
                   <input 
                     type="number" 
                     value={testL} 
                     onChange={(e) => setTestL(parseInt(e.target.value) || 0)} 
                     className="w-full px-3 py-2.5 bg-black/60 text-white font-mono font-bold text-center rounded-xl border border-white/10 shadow-inner focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
                   />
                 </div>
               </div>

               <div className="bg-black/60 p-6 rounded-2xl border border-amber-500/20 text-xs space-y-4 shadow-inner relative z-10 font-mono font-black tracking-widest mt-auto">
                 <div className="flex justify-between items-center pb-3 border-b border-amber-500/10">
                   <span className="text-amber-500/70 text-[10px] uppercase font-sans">Angle With [{targetHKL}]</span>
                   <span className="text-amber-400 text-sm bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">{userTestAngle.toFixed(1)}°</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-emerald-500/70 text-[10px] uppercase font-sans">Correction P(α)</span>
                   <span className="text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{userTestCorrection.toFixed(4)}x</span>
                 </div>
               </div>
            </div>

            {/* Core Scientific Panel */}
            <div className="bg-black/40 border border-white/5 hover:border-white/10 transition-all p-8 rounded-[2rem] backdrop-blur-md relative overflow-hidden shadow-xl z-0 group flex flex-col justify-between">
              <div className="absolute top-0 left-0 p-40 opacity-[0.03] bg-gradient-to-br from-blue-400 to-indigo-600 rounded-br-[150px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
                    <Info className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-xs uppercase font-black text-slate-200 tracking-widest group-hover:text-blue-400 transition-colors">
                    Interpretation Node
                  </h3>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                   Active State Physics Analysis
                </p>
              </div>

              <div className="relative z-10 bg-black/60 p-6 rounded-2xl border border-white/5 shadow-inner flex-1 flex flex-col">
                 <p className="text-[11px] text-slate-400 leading-relaxer font-sans mb-6">
                    {rValue === 1.0 ? (
                      <>
                        Parameter <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/20">r = 1.00</span> maps an <strong className="text-slate-200">Ideal Isotropic Powder</strong>. All grains randomly oriented; zero anomalous intensities; correction <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded shadow-sm border border-cyan-500/20">P(α) = 1.000</span> for all facets.
                      </>
                    ) : rValue < 1.0 ? (
                      <>
                        At <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/20">r = {rValue.toFixed(2)}</span>, the system constructs an active <strong className="text-cyan-400">Platelet Habit alignment</strong>. Flat plates orient their normals parallel to the compact axis [{targetHKL}], deeply scaling parallel peaks (<span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/20">{(maxCorrection).toFixed(1)}x</span>) while damping transverse geometry (<span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded shadow-sm border border-rose-500/20">{(minCorrection).toFixed(1)}x</span>).
                      </>
                    ) : (
                      <>
                        At <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/20">r = {rValue.toFixed(2)}</span>, the system evaluates <strong className="text-amber-400">Acicular / Needle Habit alignment</strong>. Linear extrusions parallel the target axis [{targetHKL}], radically amplifying transverse reflection planes up to (<span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/20">{(minCorrection).toFixed(1)}x</span>) while destroying cross-sections down to (<span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded shadow-sm border border-rose-500/20">{(maxCorrection).toFixed(1)}x</span>).
                      </>
                    )}
                 </p>
                 <div className="mt-auto bg-blue-500/5 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-inner border-y border-r border-y-blue-500/10 border-r-blue-500/10">
                    <p className="text-[10px] text-blue-200/80 leading-relaxed font-sans">
                      <strong className="text-blue-400 font-black uppercase tracking-widest text-[9px] block mb-1">Conservation Law</strong> Crystallographic texture doesn't destroy or generate total intensity—it purely routes reflections radially, behaving as a probability redistribution filter over reciprocal space.
                    </p>
                 </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
