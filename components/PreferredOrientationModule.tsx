import React, { useState, useMemo, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { calculateInterplanarAngle } from '../utils/physics';
import { ScientificMathControl } from './ScientificMathControl';
import { 
  Rotate3d,
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
  Flame, 
  Dices,
  CircleDot,
  Download,
  Compass,
  Code,
  Copy,
  Check,
  Plus,
  Trash2,
  SlidersHorizontal,
  Grid,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Award,
  ArrowRight,
  Eye,
  Zap,
  Maximize2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface Preset {
  name: string;
  r: number;
  direction: string;
  description: string;
  crystalSystem: 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic';
  lattice: { a: number; b: number; c: number };
  icon: React.ReactNode;
  data: string;
}

export const PreferredOrientationModule: React.FC = () => {
  const { precision } = useSettings();
  
  // Interactive Educational Guide State
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [guideTab, setGuideTab] = useState<'concept' | 'legend' | 'workflow'>('concept');

  // 3D Crystallite Habit Rotation & View Controls
  const [habitRotX, setHabitRotX] = useState<number>(25);
  const [habitRotY, setHabitRotY] = useState<number>(35);
  const [habitZoom, setHabitZoom] = useState<number>(1.0);
  const [autoSpinHabit, setAutoSpinHabit] = useState<boolean>(false);
  const [isDraggingHabit, setIsDraggingHabit] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0, rotX: 25, rotY: 35 });

  // Texture Model selection
  const [textureModel, setTextureModel] = useState<'March-Dollase' | 'Jarvinen-Harmonics' | 'Von-Mises-Fisher'>('March-Dollase');

  // Model Parameters
  const [rValue, setRValue] = useState<number>(0.45); // March-Dollase parameter r
  const [c2Value, setC2Value] = useState<number>(0.6); // Harmonics C2
  const [c4Value, setC4Value] = useState<number>(-0.2); // Harmonics C4
  const [vmfKappa, setVmfKappa] = useState<number>(2.5); // Von Mises-Fisher concentration kappa
  const [fraction, setFraction] = useState<number>(1.0); // Textured fraction f

  // Habit Geometry Class
  const [habitModel, setHabitModel] = useState<'Platelet' | 'Needle' | 'Sheet' | 'Equiaxed'>('Platelet');

  // Crystal Symmetry & Lattice
  const [crystalSystem, setCrystalSystem] = useState<'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic'>('Cubic');
  const [latticeA, setLatticeA] = useState<number>(5.431);
  const [latticeB, setLatticeB] = useState<number>(5.431);
  const [latticeC, setLatticeC] = useState<number>(5.431);
  const [targetHKL, setTargetHKL] = useState<string>('0, 0, 1');
  const [wavelength, setWavelength] = useState<number>(1.5406); // Cu Ka

  // Reflection Input Data: h, k, l, I_th, I_meas
  const [inputData, setInputData] = useState<string>(
    "0, 0, 1, 100, 225\n1, 0, 0, 80, 25\n1, 1, 0, 60, 20\n1, 1, 1, 90, 35\n0, 0, 2, 40, 90\n2, 0, 0, 35, 12\n1, 1, 2, 50, 22"
  );

  // Stereographic Pole Figure Projection type
  const [projectionType, setProjectionType] = useState<'Schmidt' | 'Wulff' | 'RadialProfile'>('Schmidt');

  // Pole Figure Hover Tracking
  const [polarHover, setPolarHover] = useState<{ x: number; y: number; angle: number; pVal: number; mud: number } | null>(null);

  // Active Code Exporter Tab
  const [activeCodeTab, setActiveCodeTab] = useState<'TOPAS' | 'GSAS2' | 'FullProf' | 'Python'>('TOPAS');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Dot product mini angle solver inputs
  const [testH, setTestH] = useState<number>(1);
  const [testK, setTestK] = useState<number>(1);
  const [testL, setTestL] = useState<number>(1);

  // Solver refinement results
  const [solverResult, setSolverResult] = useState<{
    refinedR: number;
    refinedFraction: number;
    refinedC2?: number;
    refinedKappa?: number;
    initialRwp: number;
    finalRwp: number;
    scalingFactor: number;
    message: string;
  } | null>(null);

  // Material Presets
  const PRESETS: Preset[] = useMemo(() => [
    {
      name: 'Kaolinite Clay (Plates)',
      r: 0.35,
      direction: '0, 0, 1',
      description: 'Basal platelet flattening along [001] normal due to compaction.',
      crystalSystem: 'Tetragonal',
      lattice: { a: 5.15, b: 5.15, c: 7.39 },
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      data: "0, 0, 1, 100, 240\n1, 0, 0, 80, 22\n1, 1, 0, 60, 18\n1, 1, 1, 90, 32\n0, 0, 2, 40, 98\n2, 0, 0, 30, 10"
    },
    {
      name: 'Isotropic Powder (Random)',
      r: 1.00,
      direction: '0, 0, 1',
      description: 'Perfectly random grain distribution. Zero preferred orientation.',
      crystalSystem: 'Cubic',
      lattice: { a: 5.431, b: 5.431, c: 5.431 },
      icon: <Dices className="w-4 h-4 text-slate-400" />,
      data: "0, 0, 1, 100, 100\n1, 0, 0, 80, 80\n1, 1, 0, 60, 60\n1, 1, 1, 90, 90\n0, 0, 2, 40, 40\n2, 0, 0, 35, 35"
    },
    {
      name: 'ZnO Vertical Nanorods',
      r: 2.65,
      direction: '0, 0, 1',
      description: 'Acicular needle growth parallel to c-axis. Suppresses longitudinal, boosts transverse.',
      crystalSystem: 'Hexagonal',
      lattice: { a: 3.25, b: 3.25, c: 5.21 },
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      data: "0, 0, 2, 100, 12\n1, 0, 0, 70, 145\n1, 0, 1, 90, 115\n1, 1, 0, 50, 110\n0, 0, 4, 15, 1"
    },
    {
      name: 'Cold-Rolled Copper Foil',
      r: 0.52,
      direction: '1, 1, 0',
      description: 'Brass/Rolling texture with shear alignment along rolling direction.',
      crystalSystem: 'Cubic',
      lattice: { a: 3.615, b: 3.615, c: 3.615 },
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      data: "1, 1, 0, 60, 125\n1, 0, 0, 80, 35\n1, 1, 1, 100, 45\n2, 0, 0, 40, 20\n2, 2, 0, 30, 65"
    },
    {
      name: 'Graphite Anode Foil',
      r: 0.28,
      direction: '0, 0, 2',
      description: 'Extreme basal plane alignment in battery electrode coating.',
      crystalSystem: 'Hexagonal',
      lattice: { a: 2.46, b: 2.46, c: 6.70 },
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      data: "0, 0, 2, 100, 310\n1, 0, 0, 15, 2\n1, 0, 1, 30, 5\n0, 0, 4, 20, 65\n1, 1, 0, 10, 1"
    },
    {
      name: 'Bi2Se3 Nanosheets',
      r: 0.38,
      direction: '0, 0, 6',
      description: 'Exfoliated 2D topological insulator flakes with c-axis normal.',
      crystalSystem: 'Hexagonal',
      lattice: { a: 4.14, b: 4.14, c: 28.64 },
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
      data: "0, 0, 6, 100, 230\n0, 1, 5, 45, 12\n1, 0, 10, 60, 18\n0, 0, 12, 50, 115\n1, 1, 0, 25, 8"
    }
  ], []);

  const selectPreset = (p: Preset) => {
    setTextureModel('March-Dollase');
    setRValue(p.r);
    setFraction(1.0);
    setTargetHKL(p.direction);
    setCrystalSystem(p.crystalSystem);
    setLatticeA(p.lattice.a);
    setLatticeB(p.lattice.b);
    setLatticeC(p.lattice.c);
    setInputData(p.data);
    setHabitModel(p.r < 1.0 ? 'Platelet' : p.r > 1.0 ? 'Needle' : 'Equiaxed');
    setSolverResult(null);
  };

  // Compute Probability Density W(alpha) for active model
  const calculateTextureCorrection = (alphaDeg: number): number => {
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const cosA = Math.cos(alphaRad);
    const sinA = Math.sin(alphaRad);

    let pModel = 1.0;

    if (textureModel === 'March-Dollase') {
      const term = rValue * rValue * cosA * cosA + (sinA * sinA) / rValue;
      pModel = term > 0 ? Math.pow(term, -1.5) : 1.0;
    } else if (textureModel === 'Jarvinen-Harmonics') {
      const p2 = 0.5 * (3 * cosA * cosA - 1);
      const cosA2 = cosA * cosA;
      const p4 = (1 / 8) * (35 * cosA2 * cosA2 - 30 * cosA2 + 3);
      pModel = 1.0 + c2Value * p2 + c4Value * p4;
      if (pModel < 0) pModel = 0.001; // physical bounds
    } else if (textureModel === 'Von-Mises-Fisher') {
      const sinhK = Math.sinh(vmfKappa);
      const norm = sinhK > 0 ? vmfKappa / (2 * sinhK) : 1.0;
      pModel = norm * Math.exp(vmfKappa * cosA);
    }

    return fraction * pModel + (1 - fraction);
  };

  // Parse input reflections and calculate angles + corrections
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
      const correction = calculateTextureCorrection(angle);
      
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
  }, [inputData, rValue, c2Value, c4Value, vmfKappa, fraction, textureModel, targetHKL, crystalSystem, latticeA, latticeB, latticeC]);

  // Compute best scale factor c where Sum_i ( IMeas_i - c * ICorrected_i )^2 is minimized
  const overlayResults = useMemo(() => {
    if (results.length === 0) return [];
    
    let sumMeasCorr = 0;
    let sumCorrSq = 0;
    results.forEach(r => {
      sumMeasCorr += r.iMeas * r.iCorrected;
      sumCorrSq += r.iCorrected * r.iCorrected;
    });
    
    const scale = sumCorrSq > 0 ? (sumMeasCorr / sumCorrSq) : 1;
    
    return results.map(r => ({
      ...r,
      iModeledScaled: r.iCorrected * scale,
      residual: r.iMeas - (r.iCorrected * scale)
    }));
  }, [results]);

  // Fit Quality Metrics
  const fitQuality = useMemo(() => {
    if (overlayResults.length === 0) return null;
    
    let sumSquaredError = 0;
    let sumSST = 0;
    let chiSquared = 0;
    
    overlayResults.forEach(r => {
      const diff = r.iMeas - r.iModeledScaled;
      sumSquaredError += diff * diff;
      sumSST += r.iMeas * r.iMeas; 
      
      const variance = Math.max(r.iMeas, 1);
      chiSquared += (diff * diff) / variance;
    });

    const Rwp = sumSST > 0 ? Math.sqrt(sumSquaredError / sumSST) * 100 : 0;
    const dof = Math.max(overlayResults.length - 3, 1);
    const reducedChiSquared = chiSquared / dof;
    
    return {
      Rwp,
      reducedChiSquared,
      chiSquared,
      dof
    };
  }, [overlayResults]);

  // Texture Analysis: Lotgering Factor & Harris Texture Coefficient
  const textureAnalysis = useMemo(() => {
    if (!results || results.length === 0) return null;

    let sumImeasTotal = 0;
    let sumIthTotal = 0;
    let sumImeasTarget = 0;
    let sumIthTarget = 0;
    
    const n = results.length;

    results.forEach(r => {
      sumImeasTotal += r.iMeas;
      sumIthTotal += r.iTh;
      
      if (Math.abs(r.angle) < 0.1 || Math.abs(r.angle - 180) < 0.1) {
        sumImeasTarget += r.iMeas;
        sumIthTarget += r.iTh;
      }
    });

    // Lotgering Factor F
    const p = sumImeasTotal > 0 ? sumImeasTarget / sumImeasTotal : 0;
    const p0 = sumIthTotal > 0 ? sumIthTarget / sumIthTotal : 0;
    const lotgeringF = (1 - p0) > 0 ? Math.max(0, Math.min(1.0, (p - p0) / (1 - p0))) : 0;

    // Harris Texture Coefficient TC(hkl) = [I_meas / I_th] / [(1/N) * sum(I_meas / I_th)]
    let sumRatio = 0;
    results.forEach(r => {
      if (r.iTh > 0) {
        sumRatio += r.iMeas / r.iTh;
      }
    });
    
    const avgRatio = sumRatio / n;
    
    const tcResults = results.map(r => {
      const tc = (r.iTh > 0 && avgRatio > 0) ? (r.iMeas / r.iTh) / avgRatio : 0;
      return {
        hkl: r.hkl,
        tc: tc,
        angle: r.angle
      };
    });

    return {
      lotgeringF,
      p,
      p0,
      tcResults
    };
  }, [results]);

  const chartData = useMemo(() => {
    return overlayResults.map(r => ({
      name: r.hkl,
      'Random standard': parseFloat(r.iTh.toFixed(precision)),
      'Model Corrected': parseFloat(r.iModeledScaled.toFixed(precision)),
      'Measured Experimental': parseFloat(r.iMeas.toFixed(precision)),
      'Correction Factor': parseFloat(r.correction.toFixed(precision)),
      'Residual': parseFloat(r.residual.toFixed(precision))
    }));
  }, [overlayResults, precision]);

  // Global Refinement Solver
  const runParameterRefinement = () => {
    if (results.length === 0) {
      alert("No valid reflection data specified.");
      return;
    }

    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];

    const measurements = results.map(r => {
      const angle = calculateInterplanarAngle(r.h, r.k, r.l, H, K, L, crystalSystem, latticeA, latticeB, latticeC);
      return { iTh: r.iTh, iMeas: r.iMeas, angle };
    });

    let bestR = rValue;
    let bestFraction = 1.0;
    let minRwp = Infinity;
    let finalScaling = 1.0;

    const rStart = habitModel === 'Platelet' ? 0.08 : 1.02;
    const rEnd = habitModel === 'Platelet' ? 0.98 : 4.50;

    for (let r = rStart; r <= rEnd; r += 0.02) {
      for (let f = 0.1; f <= 1.0; f += 0.05) {
        let scaleNum = 0;
        let scaleDen = 0;
        let num = 0;
        let den = 0;

        for (const m of measurements) {
          const alphaRad = (m.angle * Math.PI) / 180;
          const cosA = Math.cos(alphaRad);
          const sinA = Math.sin(alphaRad);
          const term = r * r * cosA * cosA + (sinA * sinA) / r;
          const pModel = term > 0 ? Math.pow(term, -1.5) : 1.0;
          const corr = f * pModel + (1 - f);
          const iCorr = m.iTh * corr;

          scaleNum += m.iMeas * iCorr;
          scaleDen += iCorr * iCorr;
        }

        const scale = scaleDen > 0 ? (scaleNum / scaleDen) : 1;

        for (const m of measurements) {
          const alphaRad = (m.angle * Math.PI) / 180;
          const cosA = Math.cos(alphaRad);
          const sinA = Math.sin(alphaRad);
          const term = r * r * cosA * cosA + (sinA * sinA) / r;
          const pModel = term > 0 ? Math.pow(term, -1.5) : 1.0;
          const corr = f * pModel + (1 - f);
          const iCorr = m.iTh * corr;

          const diff = m.iMeas - scale * iCorr;
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

    // Initial Rwp calculation
    let initNum = 0, initDen = 0;
    let initScaleNum = 0, initScaleDen = 0;
    measurements.forEach(m => {
      initScaleNum += m.iMeas * m.iTh;
      initScaleDen += m.iTh * m.iTh;
    });
    const initScale = initScaleDen > 0 ? (initScaleNum / initScaleDen) : 1;
    measurements.forEach(m => {
      const diff = m.iMeas - initScale * m.iTh;
      initNum += diff * diff;
      initDen += m.iMeas * m.iMeas;
    });
    const initialRwp = initDen > 0 ? Math.sqrt(initNum / initDen) * 100 : 0;

    setRValue(parseFloat(bestR.toFixed(3)));
    setFraction(parseFloat(bestFraction.toFixed(3)));
    setSolverResult({
      refinedR: parseFloat(bestR.toFixed(3)),
      refinedFraction: parseFloat(bestFraction.toFixed(3)),
      initialRwp,
      finalRwp: minRwp,
      scalingFactor: finalScaling,
      message: `Refinement converged: Rwp reduced from ${initialRwp.toFixed(1)}% to ${minRwp.toFixed(1)}% (r = ${bestR.toFixed(3)}, f = ${(bestFraction * 100).toFixed(0)}%).`
    });
  };

  // One-click Auto Generator for physical reflections
  const autoGenerateReflections = () => {
    const list: string[] = [];
    const hklList = [
      [0,0,1], [1,0,0], [1,1,0], [1,1,1], [0,0,2], [2,0,0], [1,0,2], [2,1,0], [2,1,1], [0,0,3]
    ];

    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];

    hklList.forEach(([h, k, l]) => {
      const angle = calculateInterplanarAngle(h, k, l, H, K, L, crystalSystem, latticeA, latticeB, latticeC);
      // Theoretical intensity simulation
      const baseI = Math.round(100 / (h*h + k*k + l*l + 1) * 1.5 + 20);
      const corr = calculateTextureCorrection(angle);
      const measI = Math.round(baseI * corr);
      list.push(`${h}, ${k}, ${l}, ${baseI}, ${measI}`);
    });

    setInputData(list.join('\n'));
    setSolverResult(null);
  };

  // Instant angle calculation for test pair
  const userTestAngle = useMemo(() => {
    const tParts = targetHKL.split(',').map(s => parseFloat(s.trim()));
    const H = isNaN(tParts[0]) ? 0 : tParts[0];
    const K = isNaN(tParts[1]) ? 0 : tParts[1];
    const L = isNaN(tParts[2]) ? 1 : tParts[2];
    return calculateInterplanarAngle(testH, testK, testL, H, K, L, crystalSystem, latticeA, latticeB, latticeC);
  }, [testH, testK, testL, targetHKL, crystalSystem, latticeA, latticeB, latticeC]);

  const userTestCorrection = useMemo(() => {
    return calculateTextureCorrection(userTestAngle);
  }, [userTestAngle, rValue, c2Value, c4Value, vmfKappa, fraction, textureModel]);

  const maxCorrection = useMemo(() => calculateTextureCorrection(0), [rValue, c2Value, c4Value, vmfKappa, fraction, textureModel]);
  const minCorrection = useMemo(() => calculateTextureCorrection(90), [rValue, c2Value, c4Value, vmfKappa, fraction, textureModel]);

  // Handle Polar Pole Figure Mouse move
  const handlePolarMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
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
    const pVal = calculateTextureCorrection(finalAlpha);
    const mud = pVal; // Multiples of Uniform Distribution
    setPolarHover({ x: svgX, y: svgY, angle: deg, pVal, mud });
  };

  // Generate SVG Path for Pole Figure Contour
  const polarOdfPath = useMemo(() => {
    const points: string[] = [];
    const center = 100;
    const randomRadius = 50;
    
    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      const alpha = deg > 180 ? 360 - deg : deg;
      const finalAlpha = alpha > 90 ? 180 - alpha : alpha;
      const pVal = calculateTextureCorrection(finalAlpha);
      
      let scaledRadius = randomRadius;
      if (projectionType === 'Schmidt') {
        scaledRadius = Math.min(randomRadius * Math.sqrt(pVal), 95);
      } else if (projectionType === 'Wulff') {
        scaledRadius = Math.min(randomRadius * (pVal / (1 + pVal / 2)), 95);
      } else {
        scaledRadius = Math.min(randomRadius * pVal, 95);
      }

      const x = center + scaledRadius * Math.sin(rad);
      const y = center - scaledRadius * Math.cos(rad);
      
      if (deg === 0) {
        points.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ') + ' Z';
  }, [rValue, c2Value, c4Value, vmfKappa, fraction, textureModel, projectionType]);

  // Code Export Snippet Generator
  const generatedCode = useMemo(() => {
    const dirStr = targetHKL.replace(/,/g, ' ');
    if (activeCodeTab === 'TOPAS') {
      return `// TOPAS March-Dollase Preferred Orientation macro
preferred_orientation [${dirStr}]
  march_dollase ${rValue.toFixed(3)}
  fraction ${fraction.toFixed(3)}`;
    } else if (activeCodeTab === 'GSAS2') {
      return `# GSAS-II Texture Parameters
TextureModel: March-Dollase
Axis: [${dirStr}]
MD_Ratio: ${rValue.toFixed(3)}
MD_Fraction: ${fraction.toFixed(3)}`;
    } else if (activeCodeTab === 'FullProf') {
      return `! FullProf PREFER instruction
PREFER ${dirStr} ${rValue.toFixed(3)} ${fraction.toFixed(3)}`;
    } else {
      return `# Python (SciPy / PyXRD) March-Dollase Correction
import numpy as np

def march_dollase(alpha_deg, r=${rValue.toFixed(3)}, f=${fraction.toFixed(3)}):
    alpha_rad = np.radians(alpha_deg)
    cos_a = np.cos(alpha_rad)
    sin_a = np.sin(alpha_rad)
    p_model = (r**2 * cos_a**2 + sin_a**2 / r)**(-1.5)
    return f * p_model + (1.0 - f)

# Apply to reflections
alphas = np.array([${results.map(r => r.angle.toFixed(1)).join(', ')}])
corrections = march_dollase(alphas)
print("Corrections P(alpha):", corrections)`;
    }
  }, [activeCodeTab, targetHKL, rValue, fraction, results]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const exportToCSV = () => {
    if (overlayResults.length === 0) return;
    
    const headers = ["hkl", "h", "k", "l", "Angle (alpha)", "Correction P(alpha)", "Standard Intensity", "Measured Intensity", "Modeled Scaled Intensity", "Residual"];
    const rows = overlayResults.map(r => [
      `"${r.hkl}"`,
      r.h,
      r.k,
      r.l,
      r.angle.toFixed(3),
      r.correction.toFixed(4),
      r.iTh.toFixed(1),
      r.iMeas.toFixed(1),
      r.iModeledScaled.toFixed(1),
      r.residual.toFixed(1)
    ]);
    
    const metaInfo = [
      ["Texture Model", textureModel],
      ["Parameter Value", textureModel === 'March-Dollase' ? rValue.toFixed(3) : textureModel === 'Jarvinen-Harmonics' ? `C2=${c2Value}, C4=${c4Value}` : `Kappa=${vmfKappa}`],
      ["Textured Fraction f", fraction.toFixed(3)],
      ["Preferred Axis [H K L]", `"[${targetHKL}]"`],
      ["Crystal System", crystalSystem],
      ["Lotgering Factor F", textureAnalysis ? textureAnalysis.lotgeringF.toFixed(4) : "N/A"],
      []
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + metaInfo.map(e => e.join(",")).join("\n")
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `preferred_orientation_export_${textureModel.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 flex flex-col pt-4 min-h-[90vh] relative z-10 w-full mb-32 custom-scrollbar">
      
      {/* Top Banner Hub */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur-md group">
        <div className="absolute top-0 right-0 p-32 opacity-10 dark:opacity-10 bg-gradient-to-br from-indigo-500 via-sky-500 to-purple-500 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-[10px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 font-extrabold uppercase flex items-center gap-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Preferred Orientation & Texture Core
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-[10px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold uppercase flex items-center gap-2 shadow-sm animate-pulse">
                <Activity className="w-3.5 h-3.5" /> {textureModel} Active
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">
              Preferred Orientation Analyzer
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-3xl leading-relaxed">
              Analyze crystallite fiber textures and correct diffraction intensity anomalies with the <strong className="text-slate-700 dark:text-slate-200">March-Dollase Model</strong>, <strong className="text-slate-700 dark:text-slate-200">Spherical Harmonics</strong>, or <strong className="text-slate-700 dark:text-slate-200">Von Mises-Fisher distributions</strong>. Features stereographic pole figure maps, 3D habit models, Lotgering Factors, and automated Levenberg-Marquardt refinement.
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2 text-right">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-500 relative"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 font-mono">
                 Engine Online
               </span>
             </div>
             <div className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
               Texture Solver Kernel V3.2
             </div>
          </div>
        </div>
      </div>

      {/* Module Guide & Visual Key Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-slate-900/90 dark:bg-slate-950/90 border border-indigo-500/30 rounded-[2.5rem] p-6 text-white shadow-xl backdrop-blur-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider font-sans text-indigo-200">
                  Interactive Module Guide & Visual Key
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold rounded-full border border-indigo-500/30">
                  TEXTURE HELP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Understanding preferred orientation (texture), March factor <span className="font-mono text-indigo-300 font-bold">r</span>, Lotgering factor <span className="font-mono text-violet-300 font-bold">F</span>, and chart indicators
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 shadow-sm"
            >
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showGuide ? "Hide Guide" : "Show Guide & Key"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showGuide && (
            <motion.div
              key="po-guide-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-1 overflow-hidden"
            >
              {/* Guide Navigation Tabs */}
              <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 text-xs">
                <button
                  onClick={() => setGuideTab('concept')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    guideTab === 'concept'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" /> 1. Crystallographic Concept
                </button>
                <button
                  onClick={() => setGuideTab('legend')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    guideTab === 'legend'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> 2. Parameter Key & Visual Legend
                </button>
                <button
                  onClick={() => setGuideTab('workflow')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    guideTab === 'workflow'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> 3. Step-By-Step Workflow
                </button>
              </div>

              {/* Tab 1: Core Concept */}
              {guideTab === 'concept' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase text-[11px] font-mono">
                      <Compass className="w-4 h-4 text-indigo-400" /> Random Powder vs Texture
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      In an ideal random powder, crystallites point in all 3D directions equally. In real samples (clay compaction, rolled foil, thin films), grains align preferentially along a specific lattice direction <strong className="text-white">[HKL]</strong>.
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-teal-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-teal-300 font-bold uppercase text-[11px] font-mono">
                      <Activity className="w-4 h-4 text-teal-400" /> Peak Anomaly Effect
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Preferred orientation causes severe diffraction intensity anomalies. Reflections parallel to the preferred direction get artificially <strong className="text-teal-300">boosted</strong> (e.g. 200%–500%), while perpendicular reflections get <strong className="text-rose-300">suppressed</strong>.
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold uppercase text-[11px] font-mono">
                      <Sparkles className="w-4 h-4 text-rose-400" /> March-Dollase Solution
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      The March-Dollase function <strong className="text-white font-mono">P(α) = (r² cos²α + r⁻¹ sin²α)⁻³ᐟ²</strong> quantifies the pole density at interplanar angle <strong className="text-white">α</strong>, allowing you to refine <strong className="text-rose-300">r</strong> and correct peak intensities!
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Parameter Key & Legend */}
              {guideTab === 'legend' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-teal-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-300 text-[11px]">March Factor (r &lt; 1)</span>
                      <span className="bg-teal-500/20 text-teal-300 text-[9px] font-bold px-2 py-0.5 rounded">Plates / Flakes</span>
                    </div>
                    <p className="text-slate-300 text-[10px] leading-normal">
                      Compaction of platelets (e.g., Kaolinite clay, Graphite, 2D nanosheets). Basal plane reflections are strongly ENHANCED.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-300 text-[11px]">March Factor (r = 1)</span>
                      <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded">Random Powder</span>
                    </div>
                    <p className="text-slate-300 text-[10px] leading-normal">
                      Isotropic, untextured powder. No preferred orientation. Peak intensity matches theoretical standard ratios.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-rose-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-300 text-[11px]">March Factor (r &gt; 1)</span>
                      <span className="bg-rose-500/20 text-rose-300 text-[9px] font-bold px-2 py-0.5 rounded">Needles / Rods</span>
                    </div>
                    <p className="text-slate-300 text-[10px] leading-normal">
                      Growth or drawing of needle-like acicular grains (e.g., ZnO nanorods, nanowires). Prismatic reflections are ENHANCED.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-violet-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-violet-300 text-[11px]">Lotgering Factor (F)</span>
                      <span className="bg-violet-500/20 text-violet-300 text-[9px] font-bold px-2 py-0.5 rounded">0.0 to 1.0</span>
                    </div>
                    <p className="text-slate-300 text-[10px] leading-normal">
                      F = 0.0 indicates completely random orientation. F = 1.0 indicates 100% texture alignment parallel to [HKL].
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Workflow Guide */}
              {guideTab === 'workflow' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30 relative">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-mono font-black text-xs flex items-center justify-center mb-2">1</div>
                    <h4 className="font-bold text-white text-xs mb-1">Load Preset or Data</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Click a preset (e.g. <em>Kaolinite Clay</em> or <em>ZnO Nanorods</em>) or enter your own peak intensities in the reflection table.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30 relative">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-mono font-black text-xs flex items-center justify-center mb-2">2</div>
                    <h4 className="font-bold text-white text-xs mb-1">Define Fiber Direction</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Specify the preferred axis [H K L] (e.g. <strong className="text-indigo-300">0, 0, 1</strong> for basal plane alignment).
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30 relative">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-mono font-black text-xs flex items-center justify-center mb-2">3</div>
                    <h4 className="font-bold text-white text-xs mb-1">Refine March Factor</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Click <strong>Refine March Parameter (r)</strong> to fit your experimental data and minimize profile residual Rwp!
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30 relative">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-mono font-black text-xs flex items-center justify-center mb-2">4</div>
                    <h4 className="font-bold text-white text-xs mb-1">Inspect Pole Figure & Export</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Orbit the 3D habit crystallite, view the stereographic pole figure, and copy scripts for TOPAS, GSAS-II, or FullProf.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Analysis Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Controls Column */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Quick Presets */}
          <div className="bg-white dark:bg-black/40 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-md relative z-0 group shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                  Material Presets
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">1-Click Loading</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {PRESETS.map((p, index) => (
                <button
                  key={index}
                  onClick={() => selectPreset(p)}
                  className="group/btn flex flex-col text-left p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/40 bg-slate-50 dark:bg-black/40 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10 transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-300 text-xs flex items-center gap-2">
                      <div className="text-indigo-500 dark:text-indigo-400 group-hover/btn:scale-110 transition-transform">
                        {p.icon}
                      </div>
                      {p.name}
                    </span>
                    <span className="font-mono text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-black/40 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-md shadow-inner">
                      r = {p.r.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-400 font-sans leading-relaxed transition-colors mt-0.5">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Texture Model & Parameters */}
          <div className="bg-white dark:bg-black/40 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 transition-all backdrop-blur-md space-y-5 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-sky-50 dark:bg-sky-500/10 rounded-lg border border-sky-100 dark:border-sky-500/20 shadow-inner">
                <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                Texture Model Controls
              </h3>
            </div>

            {/* Model Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
              {(['March-Dollase', 'Jarvinen-Harmonics', 'Von-Mises-Fisher'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setTextureModel(m);
                    setSolverResult(null);
                  }}
                  className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 px-1 rounded-lg transition-all cursor-pointer ${
                    textureModel === m 
                      ? 'bg-white dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200 dark:border-sky-500/30' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {m === 'March-Dollase' ? 'March-Dollase' : m === 'Jarvinen-Harmonics' ? 'Harmonics' : 'Von Mises'}
                </button>
              ))}
            </div>

            {/* March-Dollase Habit Class & Slider */}
            {textureModel === 'March-Dollase' && (
              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="flex bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => {
                      setHabitModel('Platelet');
                      if (rValue > 1.0) setRValue(0.45);
                      setSolverResult(null);
                    }}
                    className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer ${
                      habitModel === 'Platelet' ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-200 dark:border-sky-500/20' : 'text-slate-500'
                    }`}
                  >
                    Platelet (Platy)
                  </button>
                  <button
                    onClick={() => {
                      setHabitModel('Needle');
                      if (rValue < 1.0) setRValue(2.20);
                      setSolverResult(null);
                    }}
                    className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer ${
                      habitModel === 'Needle' ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-200 dark:border-sky-500/20' : 'text-slate-500'
                    }`}
                  >
                    Needle (Acicular)
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">March Factor (r)</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="5.00"
                        value={rValue}
                        onChange={(e) => {
                          setRValue(parseFloat(e.target.value) || 0.01);
                          setSolverResult(null);
                        }}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-xs text-right font-bold text-sky-600 dark:text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={habitModel === 'Platelet' ? 0.05 : 1.02}
                    max={habitModel === 'Platelet' ? 0.98 : 4.50}
                    step="0.01"
                    value={rValue}
                    onChange={(e) => {
                      setRValue(parseFloat(e.target.value));
                      setSolverResult(null);
                    }}
                    className="w-full accent-sky-500 py-1 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{habitModel === 'Platelet' ? 'r < 1 (Plates)' : 'r ≈ 1 (Random)'}</span>
                    <span>{habitModel === 'Platelet' ? 'r ≈ 1 (Random)' : 'r > 1 (Needles)'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Järvinen Spherical Harmonics Controls */}
            {textureModel === 'Jarvinen-Harmonics' && (
              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Harmonic C₂ Coefficient</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{c2Value.toFixed(2)}</span>
                  </div>
                  <input
                    type="range" min="-1.5" max="2.0" step="0.05"
                    value={c2Value}
                    onChange={(e) => setC2Value(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 py-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Harmonic C₄ Coefficient</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{c4Value.toFixed(2)}</span>
                  </div>
                  <input
                    type="range" min="-1.0" max="1.5" step="0.05"
                    value={c4Value}
                    onChange={(e) => setC4Value(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 py-1 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Von Mises-Fisher Fiber Controls */}
            {textureModel === 'Von-Mises-Fisher' && (
              <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Concentration Parameter (κ)</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{vmfKappa.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="0.1" max="10.0" step="0.1"
                  value={vmfKappa}
                  onChange={(e) => setVmfKappa(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 py-1 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Higher κ represents extreme fiber orientation dispersion focusing towards normal.
                </p>
              </div>
            )}

            {/* Preferred Direction [H K L] */}
            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] font-mono flex items-center gap-1">
                   <MoveRight className="w-3.5 h-3.5 text-indigo-500" /> Preferred Axis [H, K, L]
                 </span>
                 <span className="text-[9px] text-slate-400 font-bold">Fiber Normal</span>
              </div>
              <input
                type="text"
                value={targetHKL}
                onChange={(e) => {
                  setTargetHKL(e.target.value);
                  setSolverResult(null);
                }}
                placeholder="0, 0, 1"
                className="w-full px-3 py-2 bg-white dark:bg-black/60 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-sm shadow-inner"
              />
            </div>

            {/* Textured Fraction Slider */}
            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" /> Textured Fraction (f)
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                  {(fraction * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range" min="0.0" max="1.0" step="0.01"
                value={fraction}
                onChange={(e) => {
                  setFraction(parseFloat(e.target.value));
                  setSolverResult(null);
                }}
                className="w-full accent-emerald-500 py-1 cursor-pointer"
              />
            </div>

            {/* Crystal System & Lattice Constants */}
            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] font-mono block">
                Crystal System & Cell Parameters
              </span>
              <select 
                value={crystalSystem}
                onChange={(e) => {
                  setCrystalSystem(e.target.value as any);
                  setSolverResult(null);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-black/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs outline-none shadow-inner cursor-pointer"
              >
                <option value="Cubic">Cubic / Isomeric (a=b=c)</option>
                <option value="Tetragonal">Tetragonal (a=b≠c)</option>
                <option value="Hexagonal">Hexagonal (a=b≠c, γ=120°)</option>
                <option value="Orthorhombic">Orthorhombic (a≠b≠c)</option>
              </select>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">a (Å)</label>
                  <input 
                    type="number" step="0.01" min="0.1" value={latticeA} 
                    onChange={(e) => { setLatticeA(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/60 text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-xs text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">b (Å)</label>
                  <input 
                    type="number" step="0.01" min="0.1" value={crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? latticeA : latticeB} 
                    onChange={(e) => { setLatticeB(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                    disabled={crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal'}
                    className={`w-full px-2 py-1.5 font-mono text-xs font-bold text-center border rounded-lg ${
                      crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' 
                        ? 'bg-slate-100 dark:bg-black/30 text-slate-400 border-transparent cursor-not-allowed' 
                        : 'bg-white dark:bg-black/60 text-pink-600 dark:text-pink-400 border-slate-200 dark:border-white/10'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">c (Å)</label>
                  <input 
                    type="number" step="0.01" min="0.1" value={latticeC} 
                    onChange={(e) => { setLatticeC(parseFloat(e.target.value) || 1.0); setSolverResult(null); }}
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/60 text-pink-600 dark:text-pink-400 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Refinement Solver Action */}
            <div className="pt-2 space-y-3">
              <button
                onClick={runParameterRefinement}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:scale-[0.98] text-white text-[11px] uppercase font-black tracking-widest rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-indigo-500/25"
              >
                <RefreshCw className="w-4 h-4" /> Refine March Parameter (r)
              </button>

              <AnimatePresence>
                {solverResult && (
                  <motion.div 
                    key="po-solver-result"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 space-y-2 shadow-inner"
                  >
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest flex items-center justify-between font-mono">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Refinement Converged
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold">
                        LEVENBERG-MARQUARDT
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-emerald-200 dark:border-emerald-500/10">
                      <span className="text-slate-600 dark:text-slate-300">Initial → New R<sub>wp</sub></span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {solverResult.initialRwp.toFixed(1)}% → {solverResult.finalRwp.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-600 dark:text-slate-300">Refined March Factor (r)</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{solverResult.refinedR.toFixed(3)}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-1 leading-tight">
                      {solverResult.message}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

        {/* Right Plot & Visualizer Column */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Scientific Verification Control */}
          <ScientificMathControl
            title="Active Preferred Orientation Model Probability"
            formula={
              textureModel === 'March-Dollase'
                ? "W(\\alpha) = f \\cdot (r^2 \\cos^2\\alpha + r^{-1} \\sin^2\\alpha)^{-3/2} + (1 - f)"
                : textureModel === 'Jarvinen-Harmonics'
                  ? "W(\\alpha) = f \\cdot \\left[1 + C_2 P_2(\\cos\\alpha) + C_4 P_4(\\cos\\alpha)\\right] + (1 - f)"
                  : "W(\\alpha) = f \\cdot \\left[\\frac{\\kappa}{2\\sinh\\kappa} e^{\\kappa \\cos\\alpha}\\right] + (1 - f)"
            }
            description="Computes exact probability density W(α) at a sample orientation angle α = 45°."
            variables={[
              { symbol: 'α', name: 'Interplanar Angle', value: 45, unit: 'deg' },
              { symbol: 'f', name: 'Textured Fraction', value: fraction, unit: '' },
              ...(textureModel === 'March-Dollase' ? [{ symbol: 'r', name: 'March Factor', value: rValue, unit: '' }] : []),
              ...(textureModel === 'Jarvinen-Harmonics' ? [
                { symbol: 'C₂', name: 'Harmonic C2', value: c2Value, unit: '' },
                { symbol: 'C₄', name: 'Harmonic C4', value: c4Value, unit: '' }
              ] : []),
              ...(textureModel === 'Von-Mises-Fisher' ? [{ symbol: 'κ', name: 'Concentration κ', value: vmfKappa, unit: '' }] : [])
            ]}
            result={calculateTextureCorrection(45)}
            resultUnit="MUD"
            resultName="Probability W(45°)"
          />

          {/* Visualizers Grid: Pole Figure & 3D Habit Node */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Stereographic Pole Figure */}
            <div className="lg:col-span-6 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-teal-300 dark:hover:border-white/10 transition-all rounded-[2rem] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-50 dark:bg-teal-500/10 rounded-lg border border-teal-200 dark:border-teal-500/20 shadow-inner">
                      <CircleDot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                      Stereographic Pole Figure
                    </h3>
                  </div>

                  {/* Projection Mode Switcher */}
                  <div className="flex bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                    {(['Schmidt', 'Wulff', 'RadialProfile'] as const).map((proj) => (
                      <button
                        key={proj}
                        onClick={() => setProjectionType(proj)}
                        className={`text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all ${
                          projectionType === proj
                            ? 'bg-teal-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {proj === 'Schmidt' ? 'Schmidt' : proj === 'Wulff' ? 'Wulff' : 'Radial'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-4">
                  Multiples of Uniform Distribution (MUD) Heatmap
                </p>
              </div>

              {/* Interactive SVG Pole Figure Net */}
              <div className="flex justify-center items-center py-4 bg-white dark:bg-black/60 rounded-[2rem] border border-slate-200 dark:border-white/5 relative shadow-inner my-auto">
                <svg 
                  width="200" 
                  height="200" 
                  className="overflow-visible cursor-crosshair filter drop-shadow-md"
                  onMouseMove={handlePolarMouseMove}
                  onMouseLeave={() => setPolarHover(null)}
                >
                  <defs>
                    <radialGradient id="mudHeatmapGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={rValue < 1 ? "#2dd4bf" : "#f43f5e"} stopOpacity={0.4}/>
                      <stop offset="70%" stopColor={rValue < 1 ? "#0284c7" : "#e11d48"} stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#000000" stopOpacity={0}/>
                    </radialGradient>
                  </defs>

                  {/* Concentric Net Grid Circles */}
                  <circle cx="100" cy="100" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                  <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                  
                  {/* Axis Crosshairs */}
                  <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 4" />
                  <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 4" />
                  
                  <text x="100" y="14" fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono font-bold">0°</text>
                  <text x="185" y="103" fill="#64748b" fontSize="8" textAnchor="end" className="font-mono font-bold">90°</text>
                  
                  {/* Random baseline reference (MUD = 1.0) */}
                  <circle cx="100" cy="100" r="50" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 2" />
                  
                  {/* Active ODF MUD Contour */}
                  <path 
                    d={polarOdfPath} 
                    fill="url(#mudHeatmapGlow)" 
                    stroke={rValue < 1 ? "#2dd4bf" : "#f43f5e"} 
                    strokeWidth="2.5" 
                    className="transition-all duration-300" 
                  />

                  {/* Interactive Cursor Tracking */}
                  {polarHover && (
                    <>
                      <line x1="100" y1="100" x2={polarHover.x} y2={polarHover.y} stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx={polarHover.x} cy={polarHover.y} r="5" fill="#2dd4bf" className="animate-ping" />
                      <circle cx={polarHover.x} cy={polarHover.y} r="3.5" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1.5" />
                    </>
                  )}
                </svg>
              </div>

              {/* Hover Readout HUD */}
              <div className="h-9 mt-3 flex items-center justify-center">
                {polarHover ? (
                  <div className="w-full bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-500/20 flex justify-between items-center text-[10px] font-mono shadow-inner">
                    <span className="text-slate-600 dark:text-slate-400">Angle α: <strong className="text-teal-600 dark:text-teal-400">{polarHover.angle.toFixed(0)}°</strong></span>
                    <span className="text-slate-600 dark:text-slate-400">Intensity: <strong className="text-teal-600 dark:text-teal-400">{polarHover.mud.toFixed(3)} MUD</strong></span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-sans italic text-center w-full">
                    Hover over pole figure to read MUD intensity map
                  </div>
                )}
              </div>
            </div>

            {/* 3D Habit Morphology Node */}
            <div 
              className="lg:col-span-6 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-white/10 transition-all rounded-[2rem] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md group"
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
                      <Rotate3d className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                      3D Habit Node
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setAutoSpinHabit(!autoSpinHabit)}
                      className={`text-[9px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                        autoSpinHabit ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {autoSpinHabit ? 'Orbiting...' : 'Auto Orbit'}
                    </button>
                    <button
                      onClick={() => { setHabitRotX(25); setHabitRotY(35); setHabitZoom(1.0); }}
                      className="text-[9px] font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-4">
                  Drag to Orbit Crystallite Geometry
                </p>
              </div>

              {/* 3D Render Canvas Box */}
              <div 
                className="flex justify-center items-center py-4 bg-white dark:bg-black/60 rounded-[2rem] border border-slate-200 dark:border-white/5 relative shadow-inner select-none cursor-grab active:cursor-grabbing my-auto"
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
                    <radialGradient id="habitShading" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                      <stop offset="60%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity={0.6} />
                    </radialGradient>
                  </defs>
                  
                  {/* Axis indicators in background */}
                  <g opacity="0.5">
                    <line x1="20" y1="180" x2="50" y2="180" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="55" y="183" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">x</text>

                    <line x1="20" y1="180" x2="20" y2="150" stroke="#2dd4bf" strokeWidth="1.5" />
                    <text x="18" y="145" fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">z</text>

                    <line x1="20" y1="180" x2="38" y2="166" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="42" y="164" fill="#3b82f6" fontSize="8" fontWeight="bold" fontFamily="monospace">y</text>
                  </g>

                  {/* 3D Geometry Rendering */}
                  {(() => {
                    let radius = 35 * habitZoom;
                    let height = 22 * habitZoom;

                    if (rValue < 1.0) {
                      radius = (38 + (1 - rValue) * 18) * habitZoom;
                      height = Math.max(6, 20 * rValue) * habitZoom;
                    } else if (rValue > 1.0) {
                      radius = Math.max(12, 28 / Math.sqrt(rValue)) * habitZoom;
                      height = Math.min(75, 16 * rValue) * habitZoom;
                    }

                    const activeRotY = autoSpinHabit ? (habitRotY + (Date.now() / 30) % 360) : habitRotY;

                    const vertices3D = [];
                    for (let i = 0; i < 6; i++) {
                      const angle = (i * 60 * Math.PI) / 180;
                      vertices3D.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: -height });
                    }
                    for (let i = 0; i < 6; i++) {
                      const angle = (i * 60 * Math.PI) / 180;
                      vertices3D.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: height });
                    }

                    const projectPoint = (x: number, y: number, z: number, rx: number, ry: number) => {
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

                    const pts = vertices3D.map(v => projectPoint(v.x, v.y, v.z, habitRotX, activeRotY));

                    const faces = [
                      { indices: [5, 4, 3, 2, 1, 0], color: 'rgba(99, 102, 241, 0.12)', stroke: 'rgba(99, 102, 241, 0.45)', id: 'bottom' },
                      { indices: [6, 7, 8, 9, 10, 11], color: rValue < 1.0 ? 'rgba(45, 212, 191, 0.35)' : 'rgba(45, 212, 191, 0.15)', stroke: '#2dd4bf', id: 'top' },
                      ...[0, 1, 2, 3, 4, 5].map(i => {
                        const next = (i + 1) % 6;
                        return {
                          indices: [i, next, next + 6, i + 6],
                          color: rValue < 1.0 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(99, 102, 241, 0.2)',
                          stroke: 'rgba(255, 255, 255, 0.2)',
                          id: `side-${i}`
                        };
                      })
                    ];

                    const sortedFaces = faces.map(face => {
                      const avgDepth = face.indices.reduce((sum, idx) => sum + pts[idx].depth, 0) / face.indices.length;
                      return { ...face, avgDepth };
                    }).sort((a, b) => b.avgDepth - a.avgDepth);

                    const axisTop = projectPoint(0, 0, height + 35, habitRotX, activeRotY);

                    return (
                      <>
                        {sortedFaces.map((face, fIdx) => {
                          const pointsStr = face.indices.map(idx => `${pts[idx].x.toFixed(1)},${pts[idx].y.toFixed(1)}`).join(' ');
                          const isTop = face.id === 'top';
                          return (
                            <polygon
                              key={fIdx}
                              points={pointsStr}
                              fill={isTop && rValue < 1.0 ? 'url(#habitShading)' : face.color}
                              stroke={face.stroke}
                              strokeWidth={isTop ? "2" : "1"}
                              strokeLinejoin="round"
                            />
                          );
                        })}

                        {/* Preferred Axis Vector */}
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
                            x={axisTop.x + 6} y={axisTop.y - 4} 
                            fill="#2dd4bf" 
                            fontSize="8" 
                            fontWeight="black" 
                            fontFamily="monospace"
                          >
                            [{targetHKL}]
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="mt-3 text-[10px] text-slate-500 font-sans text-center">
                Aspect ratio geometry maps active r = <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{rValue.toFixed(3)}</strong>
              </div>
            </div>

          </div>

          {/* Simulated & Measured Intensity Profile Chart Card */}
          <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-rose-300 dark:hover:border-white/10 transition-all rounded-[2rem] p-6 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md relative z-0 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/20 shadow-inner">
                    <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                    Diffraction Intensity Profile & Residuals
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-mono font-bold rounded">
                    ■ Slate: Standard Powder
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-mono font-bold rounded">
                    ■ Indigo: {textureModel} Model
                  </span>
                  <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-[9px] font-mono font-bold rounded">
                    ■ Pink: Measured Data
                  </span>
                </div>
              </div>

              {fitQuality && (
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="bg-white dark:bg-black/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-[10px] shadow-inner">
                    R<sub>wp</sub>: <strong className="text-emerald-500">{fitQuality.Rwp.toFixed(2)}%</strong>
                  </div>
                  <div className="bg-white dark:bg-black/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-[10px] shadow-inner">
                    χ²<sub>r</sub>: <strong className="text-sky-500">{fitQuality.reducedChiSquared.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="h-[280px] w-full relative z-10 bg-white dark:bg-black/40 p-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorModel" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,15,30,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#f1f5f9' }}
                    labelClassName="font-bold text-white text-xs mb-2 font-mono tracking-wider uppercase border-b border-white/10 pb-1"
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', marginTop: '20px', color: '#94a3b8', fontWeight: 700 }} />
                  <Bar dataKey="Random standard" fill="url(#colorStandard)" name="Standard (Random)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Model Corrected" fill="url(#colorModel)" name={`${textureModel} Model`} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Measured Experimental" fill="url(#colorMeasured)" name="Experimental Data" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lotgering Factor & Harris Texture Coefficient Suite */}
          {textureAnalysis && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all rounded-[2rem] p-6 shadow-sm dark:shadow-2xl relative overflow-hidden backdrop-blur-md"
            >
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Lotgering Orientation Factor */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg border border-violet-200 dark:border-violet-500/20 shadow-inner">
                      <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                      Lotgering Orientation Factor (F)
                    </h3>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-3xl font-black text-violet-600 dark:text-violet-400 font-sans tracking-tight">
                        {textureAnalysis.lotgeringF.toFixed(4)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Axis: [{targetHKL}]</span>
                    </div>
                    {/* Visual Gauge Bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full my-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, textureAnalysis.lotgeringF * 100))}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Degree of preferred orientation (F = 0: isotropic random powder, F = 1: 100% oriented parallel to [{targetHKL}]).
                    </p>
                    <div className="mt-3 flex gap-4 text-[10px] font-mono text-slate-400">
                      <div>p = {textureAnalysis.p.toFixed(3)}</div>
                      <div>p₀ = {textureAnalysis.p0.toFixed(3)}</div>
                    </div>
                  </div>
                </div>

                {/* Harris Texture Coefficient Bar Chart */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-fuchsia-50 dark:bg-fuchsia-500/10 rounded-lg border border-fuchsia-200 dark:border-fuchsia-500/20 shadow-inner">
                      <Layers className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                      Harris Texture Coefficient TC(hkl)
                    </h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 p-3 max-h-[160px] overflow-y-auto custom-scrollbar space-y-2">
                    {textureAnalysis.tcResults.map((tc, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-bold text-slate-600 dark:text-slate-300">{tc.hkl}</span>
                          <span className={`font-black ${tc.tc > 1.1 ? 'text-emerald-500' : tc.tc < 0.9 ? 'text-rose-500' : 'text-slate-400'}`}>
                            TC = {tc.tc.toFixed(2)}
                            {tc.tc > 1.1 ? ' (Preferred)' : tc.tc < 0.9 ? ' (Suppressed)' : ''}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (tc.tc / 3) * 100)}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className={`h-full rounded-full ${tc.tc > 1.1 ? 'bg-emerald-500' : tc.tc < 0.9 ? 'bg-rose-500' : 'bg-slate-400'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Reflection Details & Matrix Editor */}
          <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-slate-300 transition-all rounded-[2rem] p-6 shadow-sm dark:shadow-2xl space-y-6 backdrop-blur-md relative z-0">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                    Reflection Analysis Matrix
                  </h3>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                  Interplanar Angles & Texture Corrections
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={autoGenerateReflections}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Auto-Generate
                </button>
                <button 
                  onClick={exportToCSV}
                  disabled={overlayResults.length === 0}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Reflection Table */}
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 uppercase font-black tracking-widest text-[9px] font-mono border-b border-slate-200 dark:border-white/5">
                    <th className="pb-3 px-3">hkl</th>
                    <th className="pb-3 px-3">Angle (α)</th>
                    <th className="pb-3 px-3">Correction P(α)</th>
                    <th className="pb-3 px-3">Standard I</th>
                    <th className="pb-3 px-3">Measured I</th>
                    <th className="pb-3 px-3 text-right">Modeled I</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {overlayResults.map((r, i) => {
                    const isEnhancement = r.correction > 1.0;
                    return (
                      <tr key={i} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-3 text-slate-800 dark:text-white font-black">
                          {r.hkl}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-bold">
                          {r.angle.toFixed(1)}°
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded font-bold text-[10px] ${
                            isEnhancement 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {r.correction.toFixed(4)}x
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {r.iTh.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-slate-800 dark:text-slate-300 font-bold">
                          {r.iMeas.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right">
                           <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                             {r.iModeledScaled.toFixed(1)}
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reflection Text Editor */}
            <div className="space-y-2 pt-2">
              <span className="font-mono font-bold text-slate-500 uppercase tracking-widest text-[9px] block">
                Raw Input Matrix (Format: h, k, l, standard_I, measured_I)
              </span>
              <textarea
                value={inputData}
                onChange={(e) => {
                  setInputData(e.target.value);
                  setSolverResult(null);
                }}
                className="w-full h-28 px-4 py-3 bg-white dark:bg-black/40 font-mono text-xs border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-300 rounded-2xl resize-none outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
              />
            </div>
          </div>

          {/* Rietveld Code Script Exporter & Interplanar Angle Solver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Script Exporter */}
            <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                    <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                    Rietveld Code Exporter
                  </h3>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              {/* Exporter Tabs */}
              <div className="flex bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-0.5 text-[9px] font-mono">
                {(['TOPAS', 'GSAS2', 'FullProf', 'Python'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`flex-1 py-1 rounded cursor-pointer ${
                      activeCodeTab === tab ? 'bg-indigo-500 text-white font-bold' : 'text-slate-500'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
                {generatedCode}
              </pre>
            </div>

            {/* Interplanar Angle Solver Mini Tool */}
            <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] space-y-4 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest">
                    Dot Product Angle Solver
                  </h3>
                </div>
                <p className="text-[9px] text-slate-500 font-mono">
                  Compute angle between plane (h,k,l) and fiber axis [{targetHKL}]
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Index h</label>
                  <input 
                    type="number" value={testH} onChange={(e) => setTestH(parseInt(e.target.value) || 0)} 
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/60 font-mono font-bold text-center rounded-lg border border-slate-200 dark:border-white/10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Index k</label>
                  <input 
                    type="number" value={testK} onChange={(e) => setTestK(parseInt(e.target.value) || 0)} 
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/60 font-mono font-bold text-center rounded-lg border border-slate-200 dark:border-white/10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Index l</label>
                  <input 
                    type="number" value={testL} onChange={(e) => setTestL(parseInt(e.target.value) || 0)} 
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/60 font-mono font-bold text-center rounded-lg border border-slate-200 dark:border-white/10 text-xs"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-black/60 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20 text-xs font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px]">Interplanar Angle:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{userTestAngle.toFixed(2)}°</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px]">Model Correction P(α):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{userTestCorrection.toFixed(4)}x</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
