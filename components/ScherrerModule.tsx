import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer, XRAY_WAVELENGTHS } from '../utils/physics';
import { Info, BookOpen, AlertTriangle, ChevronDown, Check, Atom, Binary, ShieldQuestion, Settings, Ruler, FlaskConical, Database, Network, Activity, Zap, Download, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from './SettingsContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { MorphologyVisualizer } from './MorphologyVisualizer';
import { ScientificMathControl } from './ScientificMathControl';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles (FWHM-based)', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Integral Breadth', value: 1.0, desc: 'Theoretical value when using Integral Breadth instead of FWHM', icon: '∫' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const CAGLIOTI_PRESETS = [
  { label: 'Lab Diffractometer', u: 0.004, v: -0.002, w: 0.01 },
  { label: 'Synchrotron (High Res)', u: 0.0001, v: -0.00005, w: 0.0002 },
  { label: 'Neutron Diffractometer', u: 0.02, v: -0.01, w: 0.05 },
];

const SCHERRER_PRESETS = [
  { 
    name: 'Silicon (NIST 640)', 
    data: "28.442, 0.12, 100\n47.302, 0.15, 60\n56.123, 0.18, 40", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'High-crystallinity calibration standard.',
    icon: '💎'
  },
  { 
    name: 'Polyethylene (HDPE)', 
    data: "21.5, 0.45, 100\n24.0, 0.52, 45\n30.1, 0.65, 15", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Semi-crystalline polymer with broad peaks.',
    icon: '▤'
  },
  { 
    name: 'Zinc Oxide (Nano)', 
    data: "31.77, 0.35, 100\n34.42, 0.38, 80\n36.25, 0.42, 120", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Common nanoparticle reference material.',
    icon: '⚪'
  },
  { 
    name: 'Au Nanowires', 
    data: "38.19, 0.55\n44.39, 0.62\n64.58, 0.78", 
    wavelength: 1.5406, 
    k: 1.1, 
    desc: 'Highly anisotropic 1D gold structures.',
    icon: '┃'
  }
];

export const ScherrerModule: React.FC = () => {
  const { precision } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1); // Instrumental broadening
  const [useCaglioti, setUseCaglioti] = useState(false);
  const [caglioti, setCaglioti] = useState({ u: 0.004, v: -0.002, w: 0.01 });
  const [inputData, setInputData] = useState<string>("28.44, 0.25, 100\n47.30, 0.28, 45\n56.12, 0.32, 20");
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt'>('Gaussian');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  
  const [results, setResults] = useState<ScherrerResult[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_scherrer_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.results)) return parsed.results;
      }
    } catch (e) {}
    return [];
  });
  const [averageType, setAverageType] = useState<'weighted' | 'arithmetic'>(() => {
    try {
      const saved = localStorage.getItem('xrd_scherrer_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.averageType === 'weighted' || parsed.averageType === 'arithmetic')) {
          return parsed.averageType;
        }
      }
    } catch (e) {}
    return 'weighted';
  });
  const [avgSize, setAvgSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('xrd_scherrer_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.avgSize === 'number') return parsed.avgSize;
      }
    } catch (e) {}
    return 0;
  });
  const isFirstRender = useRef(true);
  
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isDerivationModalOpen, setIsDerivationModalOpen] = useState(false);

  // Pre-render mathematical formulas to avoid recalculating on each render
  const formulas = useMemo(() => {
    const render = (tex: string, display: boolean = false) => {
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode: display });
      } catch (e) {
        return tex;
      }
    };
    return {
      braggLaw: render("2d \\sin\\theta_0 = m\\lambda", true),
      braggLawOrder1: render("2d \\sin\\theta_0 = \\lambda", true),
      finiteSize1: render("2Nd \\sin\\theta_1 = (N + 1)\\lambda", true),
      finiteSize2: render("2Nd \\sin\\theta_2 = (N - 1)\\lambda", true),
      subtraction: render("2Nd(\\sin\\theta_1 - \\sin\\theta_2) = 2\\lambda", true),
      reducedSub: render("Nd(\\sin\\theta_1 - \\sin\\theta_2) = \\lambda", true),
      trigIdentity: render("\\sin\\theta_1 - \\sin\\theta_2 = 2 \\cos\\left(\\frac{\\theta_1 + \\theta_2}{2}\\right) \\sin\\left(\\frac{\\theta_1 - \\theta_2}{2}\\right)", true),
      trigSub: render("\\theta_1 + \\theta_2 = 2\\theta_0 \\quad \\text{and} \\quad \\theta_1 - \\theta_2 = 2\\Delta\\theta", true),
      trigResult: render("\\sin\\theta_1 - \\sin\\theta_2 = 2 \\cos\\theta_0 \\sin(\\Delta\\theta)", true),
      approx: render("\\sin(\\Delta\\theta) \\approx \\Delta\\theta", true),
      combinedtrig: render("\\sin\\theta_1 - \\sin\\theta_2 \\approx 2 \\Delta\\theta \\cos\\theta_0", true),
      finalSubstitution: render("Nd(2 \\Delta\\theta \\cos\\theta_0) = \\lambda", true),
      rearranged: render("(Nd)(2 \\Delta\\theta) \\cos\\theta_0 = \\lambda", true),
      fwhmDefinition: render("\\beta \\approx 2 \\Delta\\theta", true),
      crystalliteThickness: render("D = N d", true),
      noShapeFactor: render("D \\cdot \\beta \\cdot \\cos\\theta_0 = \\lambda \\implies D = \\frac{\\lambda}{\\beta \\cos\\theta_0}", true),
      shapeFactorK: render("D = \\frac{K \\cdot \\lambda}{\\beta \\cos\\theta}", true)
    };
  }, []);

  const { exactArithmetic, exactWeighted } = useMemo(() => {
    const valid = results.filter(r => !r.error && r.sizeNm > 0);
    if (valid.length === 0) return { exactArithmetic: 0, exactWeighted: 0 };
    
    // Arithmetic
    const sum = valid.reduce((acc, curr) => acc + curr.sizeNm, 0);
    const arithmetic = sum / valid.length;
    
    // Weighted
    let totalWeight = 0;
    let weightedSum = 0;
    valid.forEach(r => {
      const weight = r.intensity || 0;
      weightedSum += r.sizeNm * weight;
      totalWeight += weight;
    });
    const weighted = totalWeight > 0 ? (weightedSum / totalWeight) : arithmetic;
    
    return { exactArithmetic: arithmetic, exactWeighted: weighted };
  }, [results]);
  
  // Ref for clicking outside
  const kMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (results.length === 0) return;
    
    const csvHeader = "2θ [deg],FWHM Obs [deg],Intensity,Crystallite Size [nm],Error\n";
    const csvRows = results.map(res => 
      `${res.twoTheta.toFixed(precision)},${res.fwhmObs.toFixed(precision)},${res.intensity !== undefined ? res.intensity.toFixed(precision) : 'N/A'},${res.error ? 'N/A' : res.sizeNm.toFixed(precision)},"${res.error || ''}"`
    ).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scherrer_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCalculate = () => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 600);
    setTimeout(() => setSimulationStep(3), 1400);
    setTimeout(() => setSimulationStep(4), 2200);
    setTimeout(() => setSimulationStep(5), 3000);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      const peaks = parseScherrerInput(inputData);
      const computed = peaks
        .map(p => {
          const thetaRad = (p.twoTheta / 2) * Math.PI / 180;
          const currentInstFwhm = useCaglioti 
            ? Math.sqrt(Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w))
            : instFwhm;
          return calculateScherrer(wavelength, constantK, currentInstFwhm, p, broadeningModel);
        })
        .filter((r): r is ScherrerResult => r !== null); 
      
      setResults(computed);
      
      // Averaging calculations based on user-selected preference (intensity-weighted vs simple arithmetic)
      const validResults = computed.filter(r => !r.error && r.sizeNm > 0);
      let calculatedAvg = 0;
      if (validResults.length > 0) {
        if (averageType === 'weighted') {
          const hasIntensities = validResults.some(r => r.intensity !== undefined && r.intensity > 0);
          if (hasIntensities) {
            let totalWeight = 0;
            let weightedSum = 0;
            validResults.forEach(r => {
              const weight = r.intensity || 0;
              weightedSum += r.sizeNm * weight;
              totalWeight += weight;
            });
            calculatedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
          } else {
            const sum = validResults.reduce((acc, curr) => acc + curr.sizeNm, 0);
            calculatedAvg = sum / validResults.length;
          }
        } else {
          const sum = validResults.reduce((acc, curr) => acc + curr.sizeNm, 0);
          calculatedAvg = sum / validResults.length;
        }
      }
      setAvgSize(calculatedAvg);

      localStorage.setItem('xrd_scherrer_current', JSON.stringify({
        wavelength,
        constantK,
        instFwhm,
        useCaglioti,
        caglioti,
        broadeningModel,
        results: computed,
        avgSize: calculatedAvg,
        averageType
      }));
    }, 3800);
  };

  useEffect(() => {
    const validResults = results.filter(r => !r.error && r.sizeNm > 0);
    let calculatedAvg = 0;
    if (validResults.length > 0) {
      if (averageType === 'weighted') {
        const hasIntensities = validResults.some(r => r.intensity !== undefined && r.intensity > 0);
        if (hasIntensities) {
          let totalWeight = 0;
          let weightedSum = 0;
          validResults.forEach(r => {
            const weight = r.intensity || 0;
            weightedSum += r.sizeNm * weight;
            totalWeight += weight;
          });
          calculatedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
        } else {
          const sum = validResults.reduce((acc, curr) => acc + curr.sizeNm, 0);
          calculatedAvg = sum / validResults.length;
        }
      } else {
        const sum = validResults.reduce((acc, curr) => acc + curr.sizeNm, 0);
        calculatedAvg = sum / validResults.length;
      }
    }
    setAvgSize(calculatedAvg);

    // Save configuration updates
    if (results.length > 0) {
      localStorage.setItem('xrd_scherrer_current', JSON.stringify({
        wavelength,
        constantK,
        instFwhm,
        useCaglioti,
        caglioti,
        broadeningModel,
        results,
        avgSize: calculatedAvg,
        averageType
      }));
    }
  }, [results, averageType, wavelength, constantK, instFwhm, useCaglioti, caglioti, broadeningModel]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setResults([]); // reset results upon changes
    localStorage.removeItem('xrd_scherrer_current');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instFwhm, inputData, useCaglioti, caglioti, broadeningModel]);

  const whStrainTriage = useMemo(() => {
    if (results.length < 2) return { slope: 0, rSquared: 0 };
    const valid = results.filter(r => !r.error);
    if (valid.length < 2) return { slope: 0, rSquared: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    valid.forEach(r => {
      const theta = (r.twoTheta / 2) * (Math.PI / 180);
      const x = 4 * Math.sin(theta);
      const y = r.betaCorrected * (Math.PI / 180) * Math.cos(theta);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const n = valid.length;
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return { slope: 0, rSquared: 0 };
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    let ssTot = 0, ssRes = 0;
    const meanY = sumY / n;
    valid.forEach(r => {
      const theta = (r.twoTheta / 2) * (Math.PI / 180);
      const x = 4 * Math.sin(theta);
      const y = r.betaCorrected * (Math.PI / 180) * Math.cos(theta);
      const f = slope * x + intercept;
      ssTot += Math.pow(y - meanY, 2);
      ssRes += Math.pow(y - f, 2);
    });
    
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    return { slope: Math.max(0, slope), rSquared };
  }, [results]);

  const histogramData = useMemo(() => {
    const validResults = results.filter(r => !r.error && r.sizeNm > 0);
    if (validResults.length === 0) return [];
    
    const sizes = validResults.map(r => r.sizeNm);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    
    const numBins = Math.max(5, Math.min(15, Math.ceil(Math.sqrt(validResults.length))));
    let binWidth = (max - min) / numBins;
    if (binWidth === 0) binWidth = 1; 

    // Extend range slightly to ensure all values fit inside neatly
    const rangeStart = Math.max(0, min - binWidth * 0.1);

    const bins = Array.from({ length: numBins }, (_, i) => ({
      rangeStart: rangeStart + i * binWidth,
      rangeEnd: rangeStart + (i + 1) * binWidth,
      center: rangeStart + (i + 0.5) * binWidth,
      count: 0
    }));

    validResults.forEach(r => {
      let binIndex = Math.floor((r.sizeNm - rangeStart) / binWidth);
      if (binIndex >= numBins) binIndex = numBins - 1;
      if (binIndex < 0) binIndex = 0;
      if (bins[binIndex]) {
        bins[binIndex].count += 1;
      }
    });

    return bins.map(b => ({
      name: `${b.rangeStart.toFixed(1)}-${b.rangeEnd.toFixed(1)} nm`,
      center: parseFloat(b.center.toFixed(1)),
      count: b.count,
    }));
  }, [results]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="relative group/title-icon cursor-default">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full group-hover/title-icon:bg-amber-400/30 transition-all duration-700 pointer-events-none" />
              <div className="w-14 h-14 bg-[#0a0500] rounded-2xl border border-amber-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/title-icon:border-amber-400 transition-colors duration-500 overflow-hidden">
                <Settings className="w-6 h-6 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover/title-icon:rotate-90 transition-transform duration-700" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
                System Config
              </h2>
              <p className="flex items-center gap-2 text-[10px] font-mono text-amber-500/60 uppercase tracking-[0.3em]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_2s_ease-in-out_infinite]" />
                Scherrer Engine Configuration
              </p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Source Wavelength [Å]
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Emitter</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none z-10">
                    <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Energy</span>
                    <span className="text-xs font-black text-emerald-400 font-mono tracking-tighter">
                      {(12.398 / (wavelength || 1.5406)).toFixed(2)} keV
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={String(wavelength) === 'NaN' ? '' : wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full pl-24 pr-4 py-4 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-base font-black transition-all placeholder:text-slate-700 shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <div className="h-4 w-[1px] bg-slate-800 mr-2" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Lambda</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(XRAY_WAVELENGTHS).map(([name, val]) => (
                    <button
                      key={name}
                      onClick={() => setWavelength(val)}
                      className={`py-2 px-1 rounded-xl border text-[8px] font-black uppercase tracking-tight transition-all active:scale-90 flex flex-col items-center justify-center gap-1
                        ${wavelength === val 
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                          : 'bg-black/20 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }
                      `}
                    >
                      <span className="truncate w-full text-center">{name.replace(' Kα', '').replace(' (avg)', '')}</span>
                      <span className="opacity-50 text-[6px]">{val.toFixed(3)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Atom className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Shape Factor [K]
                </label>
              </div>
              <div className="space-y-3 relative" ref={kMenuRef}>
                <button
                  onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl outline-none transition-all flex items-center justify-between group shadow-inner"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                      {K_FACTORS.find(k => k.label === selectedKType)?.icon || '✎'}
                    </span>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-bold text-white leading-none">
                        {selectedKType}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isKTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 py-1"
                    >
                      {K_FACTORS.map((k) => (
                        <button
                          key={k.label}
                          onClick={() => {
                            setSelectedKType(k.label);
                            if (k.value !== 0) setConstantK(k.value);
                            setIsKTypeMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors group/item
                            ${selectedKType === k.label ? 'bg-amber-500/10' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl bg-slate-900/50 w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 group-hover/item:border-amber-500/30 transition-colors">
                              {k.icon}
                            </span>
                            <div className="flex flex-col items-start text-left">
                              <span className={`text-sm font-bold transition-colors ${selectedKType === k.label ? 'text-amber-400' : 'text-slate-200'}`}>
                                {k.label} {k.value !== 0 && `(${k.value})`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {k.desc}
                              </span>
                            </div>
                          </div>
                          {selectedKType === k.label && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3">
                  <div className="relative w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={String(constantK) === 'NaN' ? '' : constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value));
                        setSelectedKType('Custom');
                      }}
                      className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none font-mono text-xs font-black transition-all text-center"
                    />
                  </div>
                  <div className="flex-1 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 h-full min-h-[48px]">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-tight uppercase tracking-widest">
                       {K_FACTORS.find(k => k.label.includes(selectedKType) || k.label === selectedKType)?.desc || 'Dimensionless factor relating crystal shape to diffraction peak width.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-4 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Resolution Profile
                  </label>
                </div>
                <div className="flex p-0.5 bg-black/40 rounded-lg border border-slate-700/50">
                   <button 
                     onClick={() => setUseCaglioti(false)}
                     className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${!useCaglioti ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Fixed
                   </button>
                   <button 
                     onClick={() => setUseCaglioti(true)}
                     className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${useCaglioti ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Caglioti
                   </button>
                </div>
              </div>

              {!useCaglioti ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={String(instFwhm) === 'NaN' ? '' : instFwhm}
                      onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                      className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm font-black transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">deg (Binst)</span>
                  </div>
                  <div className="flex gap-2">
                     {[0.05, 0.08, 0.12].map(val => (
                       <button 
                         key={val}
                         onClick={() => setInstFwhm(val)}
                         className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black transition-all ${instFwhm === val ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                       >
                         {val}°
                       </button>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {CAGLIOTI_PRESETS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setCaglioti({ u: p.u, v: p.v, w: p.w })}
                        className={`px-2 py-2 rounded-xl border text-[8px] font-black uppercase tracking-tight text-center leading-tight transition-all
                          ${caglioti.u === p.u ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}
                        `}
                      >
                        {p.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">U (tan²θ)</label>
                      <input 
                        type="number" step="0.001" value={String(caglioti.u) === 'NaN' ? '' : caglioti.u} 
                        onChange={(e) => setCaglioti({...caglioti, u: parseFloat(e.target.value)})}
                        className="w-full px-2 py-2 bg-black/40 text-amber-400/80 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">V (tanθ)</label>
                      <input 
                        type="number" step="0.001" value={String(caglioti.v) === 'NaN' ? '' : caglioti.v} 
                        onChange={(e) => setCaglioti({...caglioti, v: parseFloat(e.target.value)})}
                        className="w-full px-2 py-2 bg-black/40 text-amber-400/80 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">W (const)</label>
                      <input 
                        type="number" step="0.001" value={String(caglioti.w) === 'NaN' ? '' : caglioti.w} 
                        onChange={(e) => setCaglioti({...caglioti, w: parseFloat(e.target.value)})}
                        className="w-full px-2 py-2 bg-black/40 text-amber-400/80 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-700/30 overflow-hidden">
                <div className="flex justify-between items-end mb-2">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resolution Limit</span>
                   <span className="text-[10px] font-black text-amber-500/80 font-mono">
                     ~{((wavelength * constantK) / (Math.max(0.0001, (useCaglioti ? Math.sqrt(caglioti.w) : instFwhm)) * (Math.PI / 180) * 0.95)).toFixed(0)} nm
                   </span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-slate-800">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, (1 / Math.max(0.0001, (useCaglioti ? Math.sqrt(caglioti.w) : instFwhm))) * 5)}%` }}
                     className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                   />
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                  Size detection threshold based on current instrument resolution.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-4 justify-between">
                <div className="flex items-center gap-2">
                   <Settings className="w-3.5 h-3.5 text-amber-400" />
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Convolution Decoupling
                   </label>
                </div>
                <div className="flex items-center gap-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${broadeningModel === 'Gaussian' ? 'bg-indigo-500' : broadeningModel === 'Lorentzian' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{broadeningModel} Kernel</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt'] as const).map(model => (
                   <button
                     key={model}
                     onClick={() => setBroadeningModel(model)}
                     className={`py-2 px-1 rounded-xl border text-[8px] font-black uppercase tracking-tight transition-all
                       ${broadeningModel === model ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}
                     `}
                   >
                     {model === 'Pseudo-Voigt' ? 'Stokes/PV' : model}
                   </button>
                 ))}
              </div>
              <div className="mt-3 p-3 bg-black/40 rounded-xl border border-slate-800/50">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  {broadeningModel === 'Gaussian' ? 'Quadratic subtraction: β²ₛ = β²ₒ - β²ᵢ. Best for strain/instrumental dominance.' : 
                   broadeningModel === 'Lorentzian' ? 'Linear subtraction: βₛ = βₒ - βᵢ. Assumes size is the primary broadening source.' : 
                   'Mixed method: βₛ = βₒ(1 - (βᵢ/βₒ)²). Optimized for realistic convoluted XRD peak profiles.'}
                </p>
                <div className="mt-2 h-1 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div className={`h-full transition-all duration-500 ${broadeningModel === 'Gaussian' ? 'w-1/3 bg-indigo-500' : broadeningModel === 'Lorentzian' ? 'w-full bg-emerald-500' : 'w-2/3 bg-amber-500'}`} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                   <Database className="w-4 h-4 text-amber-400" />
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Peak Data Input
                   </label>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-slate-700/50">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Format: 2θ, FWHM, [Int]</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SCHERRER_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setInputData(p.data);
                      setWavelength(p.wavelength);
                      setConstantK(p.k);
                      // Try to find matching K label
                      const kMatch = K_FACTORS.find(kf => kf.value === p.k);
                      if (kMatch) setSelectedKType(kMatch.label);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-slate-800 hover:border-amber-500/30 hover:bg-black/60 transition-all text-left group/btn"
                  >
                    <span className="text-lg bg-slate-900 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-800 group-hover/btn:border-amber-500/20 shrink-0">
                      {p.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black text-slate-200 truncate">{p.name}</span>
                      <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider truncate">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2, 100&#10;47.30, 0.25, 45"
                className="w-full h-32 px-5 py-4 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/40 rounded-2xl focus:ring-2 focus:ring-amber-500/10 outline-none font-mono text-xs leading-loose resize-none transition-all shadow-inner custom-scrollbar"
                spellCheck={false}
              />
            </div>

            {!isSimulationRunning ? (
              <button
                onClick={handleCalculate}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="uppercase tracking-[0.2em] text-sm">Execute Analysis</span>
              </button>
            ) : (
              <div className="bg-[#070D18] p-5 rounded-2xl border border-amber-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" /> Scherrer Analysis Running
                </h4>
                <div className="space-y-3 relative z-10 w-full flex flex-col">
                  {[
                    { step: 1, label: 'Evaluating Raw Data Input', icon: Database },
                    { step: 2, label: 'Validating System Parameters', icon: Settings },
                    { step: 3, label: 'Calculating Geometric Form', icon: Atom },
                    { step: 4, label: 'Modeling Optical Strain', icon: Zap },
                    { step: 5, label: 'Formulating Results', icon: Check }
                  ].map((s) => {
                     const Icon = s.icon;
                     const isActive = simulationStep === s.step;
                     const isDone = simulationStep > s.step;
                     return (
                       <div key={s.step} className={`flex items-center gap-3 w-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                         <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                           <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                             {s.label}
                           </span>
                           {isActive && <div className="h-0.5 bg-gradient-to-r from-amber-500 to-transparent w-full mt-1.5 animate-pulse rounded-full" />}
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-700"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 relative z-10 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-6">
              <div className="relative group/q-icon cursor-default">
                  <div className="absolute inset-0 bg-emerald-600/20 blur-xl rounded-full group-hover/q-icon:bg-emerald-500/30 transition-all duration-700 pointer-events-none" />
                  <div className="w-16 h-16 bg-[#000a05] rounded-3xl border border-emerald-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/q-icon:border-emerald-400 transition-colors duration-500 overflow-hidden">
                    <BookOpen className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] group-hover/q-icon:scale-110 transition-transform duration-500" />
                  </div>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-1">
                  Theory Context
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-[0.2em]">Scherrer Foundation Logic</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/30 text-[10px] font-black text-emerald-300 uppercase tracking-[0.25em] shadow-inner font-mono flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              Engine Online
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Formula</span>
              </div>
              <div className="bg-[#0a0f16] p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-emerald-900/50 shadow-inner relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="truncate font-black tracking-widest text-emerald-300">D = (K · λ) / (β · cosθ)</span>
                </div>
                <button
                  onClick={() => setIsDerivationModalOpen(true)}
                  className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all cursor-pointer shadow-sm shrink-0 self-start sm:self-auto"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Derivation & Proof
                </button>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Binary className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicability Domain</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium relative z-10">
                Valid for crystallite dimensions ranging from <span className="text-blue-400 font-bold">~1 nm to ~200 nm</span>. Above this limit, peak broadening falls below the instrumental resolution threshold and cannot be decoupled.
              </p>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <ShieldQuestion className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Assumptions</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold relative z-10">
                Postulates that <span className="text-rose-400 font-bold">100% of broadening</span> derives from finite size effects. Lattice strain, stacking faults, and instrumental profile convolution are ignored. Decoupling relies on <span className="text-white bg-slate-800 px-1 py-0.5 rounded">{broadeningModel}</span> distribution profiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        
        {results && results.length > 0 && results[0] && !results[0].error && (
          <ScientificMathControl
            title="Scherrer Scientific Check"
            formula="D_{v} = \frac{K \cdot \lambda}{\beta \cdot \cos(\theta)}"
            description="Scientific mathematical verification showing exact values fed into the generalized Scherrer calculation for the first recorded diffraction peak."
            variables={[
              { symbol: 'K', name: 'Shape Factor', value: constantK, unit: '' },
              { symbol: 'λ', name: 'Wavelength', value: wavelength, unit: 'Å' },
              { symbol: 'β', name: 'Broadening', value: ((results[0].fwhmObs - instFwhm) * Math.PI / 180), unit: 'rad' },
              { symbol: 'θ', name: 'Bragg Angle', value: ((results[0].twoTheta / 2) * Math.PI / 180), unit: 'rad' }
            ]}
            result={results[0].sizeNm}
            resultUnit="nm"
            resultName="Crystallite Size"
          />
        )}

        <div className="flex flex-col gap-6 h-full">
          {/* Average Size Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <Zap className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">Mean Crystallite Size</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                         {results.some(r => r.intensity !== undefined && r.intensity > 0) 
                           ? (averageType === 'weighted' ? 'Intensity-Weighted Avg' : 'Arithmetic Mean') 
                           : 'Arithmetic Mean'}
                       </span>
                       <span className="w-1 h-1 bg-slate-700 rounded-full" />
                       <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">{results.filter(r => !r.error).length} Peaks Resolved</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors ${
                    avgSize < 10 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                    avgSize < 50 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    avgSize < 100 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-slate-500/10 border-slate-500/30 text-slate-400'
                  }`}>
                    {avgSize < 10 ? 'Quantum Domain' : 
                     avgSize < 50 ? 'Small Nanoparticle' : 
                     avgSize < 100 ? 'Large Nanoparticle' : 
                     avgSize < 200 ? 'Sub-Micron' : 'Bulk Limit'}
                  </div>
                  {results.filter(r => !r.error).length > 1 && (
                    <div className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-slate-950/50 border-slate-800 text-slate-500 inline-flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-slate-500" />
                      Var: ±{(Math.sqrt(results.filter(r => !r.error).reduce((acc, r) => acc + Math.pow(r.sizeNm - avgSize, 2), 0) / results.filter(r => !r.error).length)).toFixed(2)} nm
                    </div>
                  )}
                </div>

                {results.length > 0 && results.some(r => r.intensity !== undefined && r.intensity > 0) && (
                  <div className="pt-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Average Calculation Method</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 w-fit gap-1">
                      <button
                        onClick={() => setAverageType('weighted')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          averageType === 'weighted'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold shadow-[0_2px_10px_rgba(245,158,11,0.05)]'
                            : 'text-slate-500 hover:text-slate-400 border border-transparent'
                        }`}
                        title="Weights peaks by their intensity. Stronger peaks have higher SNR and represent bulk crystalline volume more accurately."
                      >
                        Weighted ({(() => {
                          const valid = results.filter(r => !r.error && r.sizeNm > 0);
                          let totalWeight = 0;
                          let weightedSum = 0;
                          valid.forEach(r => {
                            const weight = r.intensity || 0;
                            weightedSum += r.sizeNm * weight;
                            totalWeight += weight;
                          });
                          return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '0.0';
                        })()} nm)
                      </button>
                      <button
                        onClick={() => setAverageType('arithmetic')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          averageType === 'arithmetic'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold shadow-[0_2px_10px_rgba(245,158,11,0.05)]'
                            : 'text-slate-500 hover:text-slate-400 border border-transparent'
                        }`}
                        title="Simple arithmetic mean of individual calculated peak sizes."
                      >
                        Arithmetic ({(() => {
                          const valid = results.filter(r => !r.error && r.sizeNm > 0);
                          const sum = valid.reduce((acc, curr) => acc + curr.sizeNm, 0);
                          return valid.length > 0 ? (sum / valid.length).toFixed(1) : '0.0';
                        })()} nm)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 bg-black/40 p-4 rounded-2xl border border-slate-800/50">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Size Scale (1-200nm)</span>
                  <span className="text-[10px] font-mono font-bold text-slate-300">{avgSize.toFixed(1)} nm</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-[1px] border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (avgSize / 200) * 100)}%` }}
                    className={`h-full rounded-full ${
                      avgSize < 50 ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' :
                      avgSize < 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      'bg-gradient-to-r from-amber-500 to-amber-400'
                    } shadow-[0_0_10px_rgba(99,102,241,0.2)]`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[8px] font-mono text-slate-600 font-bold uppercase tracking-tighter">
                  <span>1nm</span>
                  <span>50nm</span>
                  <span>100nm</span>
                  <span>200nm</span>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col items-end justify-center">
                <div className="flex items-baseline gap-2 bg-black/40 px-8 py-5 rounded-2xl border border-slate-800 shadow-inner group-hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-6xl font-black text-white font-mono tracking-tighter relative z-10" style={{ textShadow: '0 0 30px rgba(245,158,11,0.2)' }}>
                    {avgSize.toFixed(precision)}
                  </span>
                  <span className="text-xl text-amber-500 font-black uppercase tracking-widest opacity-80 relative z-10">nm</span>
                </div>
                {results.length > 0 && (
                  <div className="flex flex-col items-end text-right font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider relative z-10 gap-2 mt-4 pr-2">
                    <div className="inline-flex items-center gap-2 bg-[#0A1526]/60 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-inner backdrop-blur-md">
                      <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/80">Arithmetic (Real Value):</span>
                      <span className="text-[10px] font-mono font-bold text-amber-300">{exactArithmetic.toFixed(4)} nm</span>
                    </div>
                    {results.some(r => r.intensity !== undefined && r.intensity > 0) && (
                      <div className="inline-flex items-center gap-2 bg-[#0A1526]/60 border border-slate-700/50 px-3 py-1.5 rounded-xl shadow-inner backdrop-blur-md">
                        <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-500"></span></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400/80">Weighted Mean:</span>
                        <span className="text-[10px] font-mono font-bold text-slate-300">{exactWeighted.toFixed(4)} nm</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Size Distribution Histogram & Structural Triage */}
          {results.length > 0 && histogramData.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Histogram */}
              <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <BarChart2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-0.5">Size Distribution</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grain Size Frequency Histogram</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative z-10 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="center" 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Crystallite Size [nm]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Frequency Count', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 border border-slate-700/50 p-3 rounded-xl shadow-xl backdrop-blur-md">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Range: <span className="text-indigo-400 font-mono">{data.name}</span></p>
                                <p className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                  {payload[0].value} Peaks Found
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[4, 4, 0, 0]}
                      >
                        {histogramData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="rgba(99, 102, 241, 0.8)" stroke="rgba(99, 102, 241, 1)" strokeWidth={1} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Triage & Morphology */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                 {/* Morphological projection */}
                 <div className="bg-[#050b14] border border-blue-900/30 rounded-3xl p-6 shadow-2xl relative flex flex-col h-1/2 min-h-[220px] overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                   <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                     <Atom className="w-3.5 h-3.5" /> Morphological Projection
                   </h3>
                   <div className="flex-1 w-full relative z-10 border border-blue-900/40 rounded-xl bg-black/40 overflow-hidden">
                     <MorphologyVisualizer kType={selectedKType} sizeNm={avgSize} />
                   </div>
                 </div>

                 {/* WH Strain Triage */}
                 {results.filter(r => !r.error).length > 1 && (
                 <div className={`flex-1 rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all duration-500 flex flex-col justify-center ${whStrainTriage.slope > 0.0002 ? 'bg-[#1a0f14] border border-rose-900/40' : 'bg-[#0a1410] border border-emerald-900/40'}`}>
                    <div className="absolute top-0 left-0 w-1 bg-gradient-to-b h-full opacity-50" style={{ backgroundImage: whStrainTriage.slope > 0.0002 ? 'linear-gradient(to bottom, #fb7185, transparent)' : 'linear-gradient(to bottom, #34d399, transparent)' }} />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                         <Activity className={`w-4 h-4 ${whStrainTriage.slope > 0.0002 ? 'text-rose-400' : 'text-emerald-400'}`} />
                         <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Strain Triage</h3>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-widest ${whStrainTriage.slope > 0.0002 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        R² = {whStrainTriage.rSquared.toFixed(2)}
                      </span>
                    </div>
                    
                    {whStrainTriage.slope > 0.0002 ? (
                      <div className="relative z-10 bg-black/20 p-4 rounded-xl border border-rose-900/30">
                        <p className="text-[11px] text-rose-200/80 mb-3 font-medium leading-relaxed">
                          Significant lattice microstrain detected (<span className="font-mono text-rose-400 font-bold">ε ≈ {(whStrainTriage.slope * 100).toPrecision(2)}%</span>). Scherrer model will <span className="text-rose-400 font-bold">underestimate</span> true crystallite dimensions due to un-decoupled strain broadening.
                        </p>
                        <div className="text-[9px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg inline-flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                           <Zap className="w-3 h-3" /> Execute Williamson-Hall Analysis
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 bg-black/20 p-4 rounded-xl border border-emerald-900/30">
                        <p className="text-[11px] text-emerald-200/80 mb-3 font-medium leading-relaxed">
                          Microstrain is negligible (<span className="font-mono text-emerald-400 font-bold">ε ≈ {(whStrainTriage.slope * 100).toPrecision(2)}%</span>) or indeterminate. Pure size-broadening assumption is physically sound.
                        </p>
                        <div className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg inline-flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                           <Check className="w-3 h-3" /> High Confidence Scherrer Limit
                        </div>
                      </div>
                    )}
                 </div>
                 )}
              </div>
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[400px]">
             <div className="p-6 border-b border-slate-800 bg-black/20 flex justify-between items-center backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1 text-shadow-sm">Analytical Databank</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Peak-by-peak Resolution Metrics</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={results.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-black rounded-xl transition-all border border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed group/save shadow-inner uppercase tracking-widest"
                  >
                    <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    Save CSV
                  </button>
                </div>
              {results.some(r => r.error) && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 relative z-10">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Errors Present</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
               {results.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center bg-slate-900/50 border border-slate-800/40 rounded-2xl m-6 border-dashed">
                   <Ruler className="w-8 h-8 text-slate-700 mb-3" />
                   <p className="text-[11px] font-bold uppercase tracking-widest">Input telemetry data for calculation</p>
                 </div>
               ) : (
                <table className="w-full text-left text-slate-300 border-collapse">
                  <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950/80 sticky top-0 backdrop-blur-xl z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <tr>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800"><div className="flex items-center gap-2"><span className="w-1 h-3 bg-indigo-500 rounded-full" /> 2θ [deg]</div></th>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800"><div className="flex items-center gap-2"><span className="w-1 h-3 bg-slate-500 rounded-full" /> FWHM Obs [deg]</div></th>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800"><div className="flex items-center gap-2"><span className="w-1 h-3 bg-emerald-500 rounded-full" /> Intensity</div></th>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800 text-right"><span className="text-amber-500">Domain Size [nm]</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {results.map((row, index) => (
                      <tr key={`${row.twoTheta}-${index}`} className="bg-slate-900/10 hover:bg-slate-800/30 transition-all group/row hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <td className="px-8 py-5 font-mono text-sm font-bold text-white group-hover/row:text-indigo-400 transition-colors">{row.twoTheta.toFixed(precision)}°</td>
                        <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400">{row.fwhmObs.toFixed(precision)}°</td>
                        <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400">
                          {row.intensity !== undefined ? row.intensity.toFixed(1) : <span className="text-slate-700">N/A</span>}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {row.error ? (
                            <span className="text-rose-400 text-[10px] font-black bg-rose-500/10 px-3 py-1.5 rounded-md uppercase tracking-widest inline-block whitespace-nowrap border border-rose-500/20 shadow-inner">
                              {row.error.toLowerCase().includes("zero") ? "Domain Overflow" : "Parse Fault"}
                            </span>
                          ) : (
                            <span className="bg-[#0f1520] text-amber-400 font-mono font-black text-lg px-4 py-2 rounded-xl border border-amber-900/30 inline-block shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] min-w-[100px] text-center">
                              {row.sizeNm.toFixed(precision)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Mathematical Derivation Modal */}
      <AnimatePresence>
        {isDerivationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Mathematical Derivation</h2>
                    <p className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">Theoretical Proof of Scherrer Formula</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDerivationModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-8 text-slate-300 text-sm leading-relaxed custom-scrollbar">
                
                {/* Intro Card */}
                <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5 rounded-2xl border border-emerald-500/20">
                  <p className="text-slate-200 leading-relaxed">
                    The Scherrer formula is an analytical approximation that relates the average size of sub-micrometer crystallites in a solid sample to the broadening of the diffraction peak. It was first derived by Paul Scherrer in 1918. Below is the complete mathematical and physical proof of this relation.
                  </p>
                </div>

                {/* Section 1: Physical Setup */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    1. Physical Setup & Bragg Scattering
                  </h3>
                  <p>
                    Consider a crystalline domain of finite thickness <span className="font-mono text-slate-100">$D$</span> composed of <span className="font-mono text-slate-100">$N$</span> parallel lattice planes separated by an interplanar spacing <span className="font-mono text-slate-100">$d$</span>. The total crystallite size perpendicular to these planes is:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.crystalliteThickness }} />
                  <p>
                    When monochromatic X-rays of wavelength <span className="font-mono text-slate-100">$\lambda$</span> impinge on these planes, constructive interference occurs according to <strong>Bragg's Law</strong>. For the first-order diffraction peak (<span className="font-mono text-slate-100">$m=1$</span>), the peak maximum is observed at the precise Bragg angle <span className="font-mono text-emerald-400 font-bold">$\theta_0$</span>:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.braggLawOrder1 }} />
                </div>

                {/* Section 2: Phase Difference and Finite-Size Broadening */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    2. Peak Broadening and Zero-Intensity Boundaries
                  </h3>
                  <p>
                    For an infinite crystal, diffraction occurs strictly at the exact angle <span className="font-mono text-slate-100">$\theta_0$</span>. However, for a <strong>finite crystal</strong> with $N$ planes, total destructive interference does not happen instantaneously. 
                  </p>
                  <p>
                    As we deviate from the exact Bragg angle to an angle $\theta$, waves from adjacent planes acquire a slight phase difference. The intensity of the scattered beam drops to zero when the wave scattered from the very top plane is exactly 180° out of phase with the wave scattered from the middle plane (i.e. plane <span className="font-mono text-slate-100">$N/2$</span>), canceling each other out.
                  </p>
                  <p>
                    Let the boundaries of the peak be defined by angles <span className="font-mono text-slate-100">$\theta_1$</span> (lower boundary) and <span className="font-mono text-slate-100">$\theta_2$</span> (upper boundary), where the accumulated path difference over the entire thickness of the crystal satisfies the conditions:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.finiteSize1 }} />
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.finiteSize2 }} />
                  </div>
                </div>

                {/* Section 3: Trigonometric Derivation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    3. Mathematical and Trigonometric Operations
                  </h3>
                  <p>
                    Subtracting the upper boundary condition from the lower boundary condition removes the $N$ offset and isolates the angular range of scattering:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.subtraction }} />
                  <p>
                    Dividing by 2 yields:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.reducedSub }} />
                  <p>
                    We apply the trigonometric difference-to-product identity:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.trigIdentity }} />
                  <p>
                    Since the peak is centered symmetrically around the Bragg angle $\theta_0$ with a small angular half-width $\Delta\theta$, we define:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.trigSub }} />
                  <p>
                    Substituting these into the identity yields:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.trigResult }} />
                  <p>
                    Because $\Delta\theta$ is an extremely small angle in radians, we apply the <strong>small-angle approximation</strong>:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.approx }} />
                  <p>
                    This simplifies our trigonometric difference term to:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.combinedtrig }} />
                </div>

                {/* Section 4: Formulating Size */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    4. Establishing the Size Equation
                  </h3>
                  <p>
                    Now we substitute this simplified expression back into the difference equation:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.finalSubstitution }} />
                  <p>
                    Grouping the variables to associate with crystal thickness ($N \cdot d$) and peak width ($2\Delta\theta$):
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.rearranged }} />
                  <p>
                    The full angular width at the base of the diffraction peak is $2\Delta\theta$. The Full Width at Half Maximum (FWHM), denoted by $\beta$, is mathematically proportional to the total base width depending on the peak shape function:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.fwhmDefinition }} />
                  <p>
                    Using the identities $D = N \cdot d$ and $\beta \approx 2\Delta\theta$, we obtain:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-2 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.noShapeFactor }} />
                </div>

                {/* Section 5: The Shape Factor K */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    5. Introduction of the Scherrer Constant (Shape Factor K)
                  </h3>
                  <p>
                    The assumption that $\beta = 2\Delta\theta$ is only exact for an idealized flat rectangular crystal profile. Real crystallites vary in shape (spheres, cubes, rods), have size distributions, and exhibit non-uniform scattering.
                  </p>
                  <p>
                    To correct for these real-world physical nuances, Paul Scherrer introduced a dimensionless scaling constant, <span className="text-amber-400 font-bold">$K$</span>, known as the <strong>Scherrer Constant</strong> (or shape factor). This completes the famous generalized equation:
                  </p>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 shadow-md text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.shapeFactorK }} />
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <p className="font-bold text-slate-200">Common values of K:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                      <li><span className="text-amber-400 font-mono font-bold">K = 0.94</span> for spherical particles.</li>
                      <li><span className="text-amber-400 font-mono font-bold">K = 0.90</span> for typical polydisperse powder samples (standard average).</li>
                      <li><span className="text-amber-400 font-mono font-bold">K = 1.00</span> when calculations are conducted using Peak Integral Breadth rather than FWHM.</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                <button
                  onClick={() => setIsDerivationModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white uppercase tracking-wider rounded-xl border border-slate-750 transition-all cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
