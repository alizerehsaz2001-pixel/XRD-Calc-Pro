import React, { useState, useMemo } from 'react';
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

        </div>
      </div>

      {/* Main Analysis Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
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
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span className="font-bold text-slate-300">Habit Distribution Model</span>
                    </div>

                    {/* Habit Switch */}
                    <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1.5 mb-4">
                       <button
                         onClick={() => {
                           setHabitModel('Platelet');
                           if (rValue > 1.0) setRValue(0.5);
                           setSolverResult(null);
                         }}
                         className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                           habitModel === 'Platelet' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                         }`}
                       >
                         Platelet (Platy)
                       </button>
                       <button
                         onClick={() => {
                           setHabitModel('Cylindrical');
                           if (rValue < 1.0) setRValue(2.0);
                           setSolverResult(null);
                         }}
                         className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                           habitModel === 'Cylindrical' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                         }`}
                       >
                         Cylindrical (Needle)
                       </button>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">March r parameter</span>
                      <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold text-sm">
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
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      {habitModel === 'Platelet' ? (
                        <>
                          <span>r ≪ 1.0 (Plates)</span>
                          <span>Iso (≈1.0)</span>
                        </>
                      ) : (
                        <>
                          <span>Iso (≈1.0)</span>
                          <span>r ≫ 1.0 (Needles)</span>
                        </>
                      )}
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
                    <span className="text-[10px] text-slate-500 font-mono">Fiber Normal</span>
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
                </div>

                {/* Texture Fraction Slider */}
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Textured Fraction (f)</span>
                    <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold text-sm">
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
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Real samples contain an un-textured isotropic background phase.
                  </p>
                </div>

                {/* Crystal System & Lattice Inputs */}
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs mb-2">
                     <span className="font-bold text-slate-300 flex items-center gap-1.5">
                       <Layers className="w-3.5 h-3.5 text-pink-400" /> Crystal System
                     </span>
                  </div>
                  <select 
                    value={crystalSystem}
                    onChange={(e) => {
                      setCrystalSystem(e.target.value as any);
                      setSolverResult(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-pink-500"
                  >
                    <option value="Cubic">Cubic / Isomeric (a=b=c)</option>
                    <option value="Tetragonal">Tetragonal (a=b≠c)</option>
                    <option value="Hexagonal">Hexagonal (a=b≠c, γ=120°)</option>
                    <option value="Orthorhombic">Orthorhombic (a≠b≠c)</option>
                  </select>
                  
                  {crystalSystem !== 'Cubic' && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono text-slate-500">Lattice a (Å)</label>
                        <input 
                          type="number" step="0.01" min="0.1" value={latticeA} 
                          onChange={(e) => { setLatticeA(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                          className="w-full px-2 py-1.5 bg-slate-950 font-mono text-xs text-pink-400 border border-slate-800 rounded outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] uppercase font-mono text-slate-500">Lattice b (Å)</label>
                         <input 
                           type="number" step="0.01" min="0.1" value={crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? latticeA : latticeB} 
                           onChange={(e) => { setLatticeB(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                           disabled={crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal'}
                           className={`w-full px-2 py-1.5 font-mono text-xs border border-slate-800 rounded outline-none ${crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'bg-slate-900 text-slate-600' : 'bg-slate-950 text-pink-400'}`}
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] uppercase font-mono text-slate-500">Lattice c (Å)</label>
                         <input 
                           type="number" step="0.01" min="0.1" value={latticeC} 
                           onChange={(e) => { setLatticeC(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                           className="w-full px-2 py-1.5 bg-slate-950 font-mono text-xs text-pink-400 border border-slate-800 rounded outline-none"
                         />
                      </div>
                    </div>
                  )}
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

                {/* Quality of Fit Diagnostics Block */}
                {fitQuality && (
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs">
                    <div className="text-emerald-400 font-black uppercase text-[10px] tracking-wider mb-3 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" /> Quality of Fit
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-800/50">
                        <span className="text-slate-400">R<sub className="pointer-events-none">wp</sub> Factor</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {fitQuality.Rwp.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/50 flex-col gap-1">
                        <div className="flex justify-between">
                           <span className="text-slate-400">Reduced Chi-Squared (<span className="font-serif italic font-bold">χ²<sub className="font-sans not-italic text-[9px]">r</sub></span>)</span>
                           <span className={`font-mono font-bold ${fitQuality.reducedChiSquared < 2 ? 'text-emerald-400' : fitQuality.reducedChiSquared < 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                             {fitQuality.reducedChiSquared.toFixed(2)}
                           </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-sans">
                          Ideal fit ≈ 1.0 (DOF: {fitQuality.dof})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optimal Fit Solver Button */}
                <div className="pt-2">
                  <button
                    onClick={runParameterRefinement}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white text-xs uppercase font-extrabold tracking-widest rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Auto-Fit Parameters
                  </button>
                  
                  {solverResult && (
                    <div className="mt-3 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Refinement Successful
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                        <span className="text-slate-400">New R<sub>wp</sub> Value</span>
                        <span className="font-mono font-bold text-white">
                          {solverResult.finalRwp.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                        <span className="text-slate-400">Fitted parameter (r)</span>
                        <span className="font-mono font-bold text-white">
                          {solverResult.refinedR.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1 text-slate-400">
                         <span>Fraction (f)</span>
                         <span className="font-mono font-bold text-white">{(solverResult.refinedFraction * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono leading-relaxed bg-black/40 p-2 rounded border border-slate-900">
                        &gt; {solverResult.message}
                      </p>
                    </div>
                  )}
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

                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] bg-slate-950 text-indigo-400 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
                      Target direction normal: [{targetHKL}]
                    </span>
                    <button 
                      onClick={exportToCSV}
                      disabled={overlayResults.length === 0}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:border-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Data
                    </button>
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

                  </div>
                </div>
              </div>

            </div>
      </div>
  );
};
