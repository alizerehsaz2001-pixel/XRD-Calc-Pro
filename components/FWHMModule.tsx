import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Activity, Zap, Box, Layers, Scan, CheckCircle, Download, BookOpen, HelpCircle } from 'lucide-react';
import { simulatePeak } from '../utils/physics';
import { FWHMResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Label
} from 'recharts';

export const FWHMModule: React.FC = () => {
  const [type, setType] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Pearson VII'>('Pseudo-Voigt');
  const [center, setCenter] = useState<number>(30);
  const [fwhmManual, setFwhmManual] = useState<number>(0.5);
  const [eta, setEta] = useState<number>(0.5);
  const [amplitude, setAmplitude] = useState<number>(100);
  const [background, setBackground] = useState<number>(10);
  const [noiseLevel, setNoiseLevel] = useState<number>(2);
  
  // High-value physics parameters for PhD / research use
  const [wavelengthPreset, setWavelengthPreset] = useState<string>('Cu Kα (1.5406 Å)');
  const [customWavelength, setCustomWavelength] = useState<number>(0.15406); // in nm
  const [scherrerK, setScherrerK] = useState<number>(0.94); // Scherrer shape factor

  // Reference Materials and Peaks state
  const [showReferencePeaks, setShowReferencePeaks] = useState<boolean>(false);
  const [refMaterial, setRefMaterial] = useState<string>('Silicon');
  const [customRefPeaks, setCustomRefPeaks] = useState<string>('28.44, 47.30, 56.12');

  const WAVELENGTH_PRESETS: Record<string, number> = {
    'Cu Kα (1.5406 Å)': 0.154059,
    'Co Kα (1.7890 Å)': 0.178901,
    'Fe Kα (1.9360 Å)': 0.193604,
    'Cr Kα (2.2897 Å)': 0.228970,
    'Mo Kα (0.7093 Å)': 0.070930,
  };

  const activeWavelength = wavelengthPreset === 'Custom' ? customWavelength : (WAVELENGTH_PRESETS[wavelengthPreset] || 0.154059);

  const parsedRefPeaks = React.useMemo(() => {
    if (!showReferencePeaks) return [];
    const lambdaCu = 0.154059; // Cu Kα in nm
    const targetWavelength = activeWavelength; // active wavelength in nm (e.g., 0.154059)

    const shiftPeak = (thetaCu: number): { theta: number; dSpacing: number; isSuppressed: boolean } => {
      // Calculate d-spacing from Cu Kα angle
      const thetaRad = (thetaCu / 2) * (Math.PI / 180);
      const d = lambdaCu / (2 * Math.sin(thetaRad)); // in nm

      // Calculate new 2-theta for target wavelength
      const sinThetaNew = targetWavelength / (2 * d);
      if (sinThetaNew > 0.999) {
        return { theta: 0, dSpacing: d * 10, isSuppressed: true }; // dSpacing in Å
      }
      const thetaNewRad = Math.asin(sinThetaNew);
      const twoThetaNew = 2 * thetaNewRad * (180 / Math.PI);
      return { theta: twoThetaNew, dSpacing: d * 10, isSuppressed: false };
    };

    if (refMaterial !== 'Custom') {
      const PRESETS: Record<string, { theta: number; label: string }[]> = {
        'Silicon': [
          { theta: 28.442, label: 'Si (111)' },
          { theta: 47.302, label: 'Si (220)' },
          { theta: 56.122, label: 'Si (311)' },
          { theta: 69.130, label: 'Si (400)' },
          { theta: 88.030, label: 'Si (422)' }
        ],
        'Gold': [
          { theta: 38.184, label: 'Au (111)' },
          { theta: 44.392, label: 'Au (200)' },
          { theta: 64.576, label: 'Au (220)' },
          { theta: 77.547, label: 'Au (311)' },
          { theta: 81.721, label: 'Au (222)' }
        ],
        'NaCl': [
          { theta: 27.351, label: 'NaCl (111)' },
          { theta: 31.693, label: 'NaCl (200)' },
          { theta: 45.412, label: 'NaCl (220)' },
          { theta: 53.864, label: 'NaCl (311)' },
          { theta: 56.431, label: 'NaCl (222)' }
        ],
        'Pyrite': [
          { theta: 28.532, label: 'FeS2 (111)' },
          { theta: 33.041, label: 'FeS2 (200)' },
          { theta: 37.083, label: 'FeS2 (210)' },
          { theta: 40.781, label: 'FeS2 (211)' },
          { theta: 56.324, label: 'FeS2 (311)' }
        ],
        'Quartz': [
          { theta: 20.855, label: 'SiO2 (100)' },
          { theta: 26.643, label: 'SiO2 (101)' },
          { theta: 36.542, label: 'SiO2 (110)' },
          { theta: 50.138, label: 'SiO2 (112)' },
          { theta: 59.954, label: 'SiO2 (211)' }
        ],
        'Aluminum': [
          { theta: 38.472, label: 'Al (111)' },
          { theta: 44.724, label: 'Al (200)' },
          { theta: 65.096, label: 'Al (220)' },
          { theta: 78.228, label: 'Al (311)' },
          { theta: 82.435, label: 'Al (222)' }
        ],
        'Copper': [
          { theta: 43.297, label: 'Cu (111)' },
          { theta: 50.433, label: 'Cu (200)' },
          { theta: 74.130, label: 'Cu (220)' },
          { theta: 89.931, label: 'Cu (311)' },
          { theta: 95.142, label: 'Cu (222)' }
        ],
        'Platinum': [
          { theta: 39.761, label: 'Pt (111)' },
          { theta: 46.244, label: 'Pt (200)' },
          { theta: 67.452, label: 'Pt (220)' },
          { theta: 81.285, label: 'Pt (311)' },
          { theta: 85.710, label: 'Pt (222)' }
        ],
        'Diamond': [
          { theta: 43.915, label: 'C (111)' },
          { theta: 75.302, label: 'C (220)' },
          { theta: 91.495, label: 'C (311)' }
        ]
      };
      const originalPeaks = PRESETS[refMaterial] || [];
      return originalPeaks.map(p => {
        const shifted = shiftPeak(p.theta);
        return {
          theta: shifted.theta,
          label: p.label,
          dSpacing: shifted.dSpacing,
          isSuppressed: shifted.isSuppressed,
          originalTheta: p.theta
        };
      }).filter(p => !p.isSuppressed);
    } else {
      return customRefPeaks
        .split(',')
        .map((val, idx) => {
          const num = parseFloat(val.trim());
          if (!isNaN(num) && num >= 10 && num <= 150) {
            const shifted = shiftPeak(num);
            return {
              theta: shifted.isSuppressed ? num : shifted.theta,
              label: `Custom #${idx + 1}`,
              dSpacing: shifted.dSpacing,
              isSuppressed: shifted.isSuppressed,
              originalTheta: num
            };
          }
          return null;
        })
        .filter((p): p is { theta: number; label: string; dSpacing: number; isSuppressed: boolean; originalTheta: number } => p !== null && !p.isSuppressed);
    }
  }, [showReferencePeaks, refMaterial, customRefPeaks, activeWavelength]);

  const [useCaglioti, setUseCaglioti] = useState<boolean>(false);
  const [cagliotiPreset, setCagliotiPreset] = useState<string>('Lab (Cu Kα)');
  const [cagliotiParams, setCagliotiParams] = useState<{u: number, v: number, w: number}>({ u: 0.04, v: -0.02, w: 0.04 });

  const CAGLIOTI_PRESETS: Record<string, { u: number, v: number, w: number }> = {
    'Lab (Cu Kα)': { u: 0.04, v: -0.02, w: 0.04 },
    'Synchrotron': { u: 0.002, v: -0.001, w: 0.002 },
    'Neutron': { u: 0.1, v: -0.05, w: 0.1 }
  };

  const fwhm = React.useMemo(() => {
    if (useCaglioti) {
      const thetaRad = (center / 2) * (Math.PI / 180);
      const tanTheta = Math.tan(thetaRad);
      const val = cagliotiParams.u * tanTheta * tanTheta + cagliotiParams.v * tanTheta + cagliotiParams.w;
      return val > 0 ? Math.sqrt(val) : 0.01;
    }
    return fwhmManual;
  }, [useCaglioti, cagliotiParams, center, fwhmManual]);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<FWHMResult | null>(null);
  
  const resetToDefaults = () => {
    setType('Pseudo-Voigt');
    setCenter(30);
    setFwhmManual(0.5);
    setEta(0.5);
    setAmplitude(100);
    setBackground(10);
    setNoiseLevel(2);
    setUseCaglioti(false);
    setCagliotiPreset('Lab (Cu Kα)');
    setCagliotiParams({ u: 0.04, v: -0.02, w: 0.04 });
    setWavelengthPreset('Cu Kα (1.5406 Å)');
    setCustomWavelength(0.15406);
    setScherrerK(0.94);
    setShowReferencePeaks(false);
    setRefMaterial('Silicon');
    setCustomRefPeaks('28.44, 47.30, 56.12');
  };
  
  const [isHovered, setIsHovered] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const range: [number, number] = [center - fwhm * 4, center + fwhm * 4];
    const { points, stats } = simulatePeak(type, center, fwhm, eta, amplitude, range, 200, background, noiseLevel);
    setChartData(points);
    setStats(stats);
  }, [type, center, fwhm, eta, amplitude, background, noiseLevel]);

  const analyzeProfile = () => {
    if (!stats) return null;
    const messages: { type: 'info' | 'warning' | 'error' | 'success', text: string }[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    // Shape Factor Analysis
    if (type === 'Gaussian' && Math.abs(stats.shapeFactor - 0.939) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Gaussian (0.939).` });
       status = 'warning';
    } else if (type === 'Gaussian') {
       messages.push({ type: 'success', text: `Gaussian profile shape factor correlates exactly to theoretical ideal (0.939).` });
    }

    if (type === 'Lorentzian' && Math.abs(stats.shapeFactor - 0.637) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Lorentzian (0.637).` });
       status = 'warning';
    } else if (type === 'Lorentzian') {
       messages.push({ type: 'success', text: `Lorentzian profile shape factor correlates exactly to theoretical ideal (0.637).` });
    }

    // FWHM Analysis
    if (fwhm < 0.02) {
      messages.push({ type: 'warning', text: "FWHM < 0.02° is typically below standard instrumental resolution of laboratory diffractometers." });
      status = 'warning';
    } else if (fwhm > 3) {
      messages.push({ type: 'info', text: "Broad peak (>3.0° 2θ) suggests highly disordered amorphous character or ultra-fine crystallites (< 2 nm)." });
    }

    // Mixing Factor Analysis
    if (type === 'Pseudo-Voigt') {
        if (eta < 0.2) messages.push({ type: 'info', text: "Dominantly Gaussian character (broadening dominated by strain & instrument configuration)." });
        else if (eta > 0.8) messages.push({ type: 'info', text: "Dominantly Lorentzian character (broadening dominated by finite size/crystallites)." });
        else messages.push({ type: 'success', text: `Hybrid Voigtian profile: Shape Factor φ = ${stats.shapeFactor.toFixed(3)}` });
    }
    
    if (type === 'Pearson VII') {
        const m = Math.max(1, eta * 10);
        if (m < 1.5) messages.push({ type: 'info', text: `m ≈ ${m.toFixed(1)}: Near-Lorentzian shape.` });
        else if (m > 5) messages.push({ type: 'info', text: `m ≈ ${m.toFixed(1)}: Near-Gaussian limit.` });
        else messages.push({ type: 'success', text: `Pearson VII exponent m = ${m.toFixed(2)}.` });
    }

    // Physical Calculations (Scherrer & Microstrain)
    const thetaRad = (center / 2) * (Math.PI / 180);
    const betaRad = stats.integralBreadth * (Math.PI / 180); // Radian conversion
    
    let sizeBroadening = betaRad;
    let strainBroadening = betaRad;

    if (type === 'Pseudo-Voigt') {
        sizeBroadening = betaRad * eta; // Lorentzian portion -> size
        strainBroadening = betaRad * (1 - eta); // Gaussian portion -> strain
    } else if (type === 'Gaussian') {
        sizeBroadening = 0; // Pure strain/instrument
    } else if (type === 'Lorentzian') {
        strainBroadening = 0; // Pure crystallite size
    }

    if (sizeBroadening > 0.0001) {
       // Scherrer coherence length: L = (K * lambda) / (beta * cos(theta))
       const L = (scherrerK * activeWavelength) / (sizeBroadening * Math.cos(thetaRad));
       if (L > 250) {
           messages.push({ type: 'info', text: `Calculated Crystallite Coherence Length: ~${L.toFixed(0)} nm (approaching upper resolution limit).` });
       } else if (L < 2) {
           messages.push({ type: 'info', text: `Crystallite Size: ~${L.toFixed(1)} nm (severe finite-size confinement).` });
       } else {
           messages.push({ type: 'success', text: `Scherrer Crystallite Size: ~${L.toFixed(1)} nm.` });
       }
    }

    if (strainBroadening > 0.0001) {
       const e = strainBroadening / (4 * Math.tan(thetaRad));
       messages.push({ type: 'success', text: `Estimated Microstrain (ε): ${(e * 1000).toFixed(2)} × 10⁻³ rms (${(e * 100).toFixed(3)}%).` });
    }

    return { status, messages };
  };

  const analysis = analyzeProfile();

  // Export simulated peak dataset to CSV for scientific plot software (Origin, Matlab, etc.)
  const handleExportData = () => {
    if (!chartData || chartData.length === 0) return;
    
    const fileHeader = `# XRD Line Profile Simulation Dataset\n` + 
                       `# Kernel Type: ${type}\n` + 
                       `# Peak Center (2-Theta): ${center} deg\n` +
                       `# Peak FWHM: ${fwhm.toFixed(5)} deg\n` +
                       `# X-ray Wavelength: ${(activeWavelength * 10).toFixed(5)} Angstroms (${activeWavelength} nm)\n` +
                       `# Scherrer K Factor: ${scherrerK}\n` +
                       `# Poisson Noise Level: ${(noiseLevel * 10)}%\n` +
                       `# Background: ${background} cps\n` +
                       `# 2-Theta (deg), Intensity (with Noise), Clean Intensity\n`;

    const fileContent = chartData.map(pt => `${pt.x.toFixed(6)},${pt.y.toFixed(4)},${pt._cleanY?.toFixed(4) || 0}`).join("\n");
    const blob = new Blob([fileHeader + fileContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `xrd_peak_simulation_${type.toLowerCase()}_${center.toFixed(1)}deg.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  useEffect(() => {
    localStorage.setItem('xrd_fwhm_current', JSON.stringify({
      type,
      center,
      fwhm,
      eta,
      amplitude,
      stats,
      analysis,
      activeWavelength,
      scherrerK
    }));
  }, [type, center, fwhm, eta, amplitude, stats, analysis, activeWavelength, scherrerK]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      
      {/* Configuration Sidebar */}
      <div className="xl:col-span-3 space-y-6">
        <div className="bg-white dark:bg-slate-900/90 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Parameters
            </h2>
            <button 
              onClick={resetToDefaults}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-all"
              title="Reset parameters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            
            {/* Kernel Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Convolution Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt', 'Pearson VII'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      if (t === 'Gaussian') setEta(0);
                      else if (t === 'Lorentzian') setEta(1);
                      else if (t === 'Pearson VII') setEta(0.2); // m = 2
                      else setEta(0.5);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                      type === t 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 font-bold text-indigo-700 dark:text-indigo-300' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block truncate">{t === 'Pseudo-Voigt' ? 'Pseudo-Voigt' : t}</span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 font-normal">
                      {t === 'Gaussian' ? 'Exp decay' : t === 'Lorentzian' ? 'Poly decay' : t === 'Pearson VII' ? 'Pearson m' : 'PV hybrid'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Peak Sliders */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              
              {/* Peak Center */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Centroid Position (2θ)</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{center.toFixed(2)}°</span>
                </div>
                <input
                  type="range" min="10" max="150" step="0.1"
                  value={center} onChange={(e) => setCenter(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* FWHM Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {useCaglioti ? 'Instrumental Broadening' : 'Peak Width FWHM (Δ2θ)'}
                  </span>
                  <button 
                    onClick={() => setUseCaglioti(!useCaglioti)}
                    className="text-[9px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-slate-600 dark:text-slate-300"
                  >
                    {useCaglioti ? 'Manual' : 'Caglioti'}
                  </button>
                </div>
                
                {!useCaglioti ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      <span className="text-[10px] font-normal text-slate-400">Current:</span>
                      <span>{fwhmManual.toFixed(3)}° 2θ</span>
                    </div>
                    <input
                      type="range" min="0.02" max="4" step="0.01"
                      value={fwhmManual} onChange={(e) => setFwhmManual(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 mt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-500">Diffractometer Preset</span>
                      <select 
                        value={cagliotiPreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCagliotiPreset(val);
                          if (CAGLIOTI_PRESETS[val]) {
                            setCagliotiParams(CAGLIOTI_PRESETS[val]);
                          }
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        {Object.keys(CAGLIOTI_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      {['u', 'v', 'w'].map(param => (
                        <div key={param} className="flex flex-col">
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">{param}</span>
                          <input 
                            type="number"
                            step="0.001"
                            value={cagliotiParams[param as keyof typeof cagliotiParams]}
                            onChange={(e) => {
                              setCagliotiPreset('Custom');
                              setCagliotiParams({...cagliotiParams, [param]: parseFloat(e.target.value) || 0});
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] p-1 font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mixing / Exponent Slider */}
              {(type === 'Pseudo-Voigt' || type === 'Pearson VII') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {type === 'Pearson VII' ? 'Exponent (m)' : 'Mixing Parameter (η)'}
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {type === 'Pearson VII' ? Math.max(1, eta * 10).toFixed(1) : `${(eta * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={eta} 
                    onChange={(e) => setEta(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
                    {type === 'Pearson VII' ? (
                      <>
                        <span>m=1 (Pure Lorentzian)</span>
                        <span>m=10 (Pure Gaussian)</span>
                      </>
                    ) : (
                      <>
                        <span>Gaussian (0)</span>
                        <span>Lorentzian (1)</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Instrument Setup (Wavelength and Scherrer K) */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              
              {/* Anode Wavelength preset */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Anode Wavelength (λ)</span>
                </div>
                <select 
                  value={wavelengthPreset}
                  onChange={(e) => setWavelengthPreset(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.keys(WAVELENGTH_PRESETS).map(presetName => (
                    <option key={presetName} value={presetName}>{presetName}</option>
                  ))}
                  <option value="Custom">Custom Anode</option>
                </select>

                {wavelengthPreset === 'Custom' && (
                  <div className="pt-2">
                    <label className="text-[9px] text-slate-400 block mb-1">Custom Wavelength (nm)</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={customWavelength}
                      onChange={(e) => setCustomWavelength(parseFloat(e.target.value) || 0.15406)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs p-1.5 font-mono text-slate-700 dark:text-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Scherrer K Factor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>SCHERRER SHAPE FACTOR (K)</span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{scherrerK.toFixed(3)}</span>
                </div>
                <input
                  type="range" min="0.5" max="1.5" step="0.01"
                  value={scherrerK} 
                  onChange={(e) => setScherrerK(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                  <span>Sphere (0.9)</span>
                  <span>Cube (0.94)</span>
                  <span>Platelet (1.1)</span>
                </div>
              </div>
            </div>

            {/* Reference Peaks Overlay */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Reference Peaks
                </span>
                <button
                  onClick={() => setShowReferencePeaks(!showReferencePeaks)}
                  className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase transition-all cursor-pointer ${
                    showReferencePeaks
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {showReferencePeaks ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {showReferencePeaks && (
                <div className="space-y-3 pt-1 border-t border-slate-200/40 dark:border-slate-800/40 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Reference Material
                    </label>
                    <select
                      value={refMaterial}
                      onChange={(e) => setRefMaterial(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="Silicon">Silicon (Si) Reference</option>
                      <option value="Gold">Gold (Au) Reference</option>
                      <option value="NaCl">Halite (NaCl) Reference</option>
                      <option value="Pyrite">Pyrite (FeS2) Reference</option>
                      <option value="Quartz">Quartz (SiO2) Reference</option>
                      <option value="Aluminum">Aluminum (Al) Reference</option>
                      <option value="Copper">Copper (Cu) Reference</option>
                      <option value="Platinum">Platinum (Pt) Reference</option>
                      <option value="Diamond">Diamond (C) Reference</option>
                      <option value="Custom">Custom Peaks Set</option>
                    </select>
                  </div>

                  {refMaterial === 'Custom' && (
                    <div className="space-y-1.5">
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                        Custom Peaks (2θ values)
                      </label>
                      <input
                        type="text"
                        value={customRefPeaks}
                        onChange={(e) => setCustomRefPeaks(e.target.value)}
                        placeholder="e.g. 28.44, 47.30, 56.12"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs p-1.5 font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {parsedRefPeaks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Click peak to snap center:
                        </span>
                        <span className="block text-[8px] text-indigo-500 dark:text-indigo-400 font-medium">
                          💡 Corrected via Bragg's Law for λ = {(activeWavelength * 10).toFixed(4)} Å
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {parsedRefPeaks.map((peak, idx) => {
                          const isCurrentCenter = Math.abs(center - peak.theta) < 0.01;
                          return (
                            <button
                              key={idx}
                              onClick={() => setCenter(peak.theta)}
                              className={`p-1.5 text-[10px] font-mono rounded-lg border transition-all text-left flex flex-col justify-between cursor-pointer ${
                                isCurrentCenter
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-md shadow-indigo-500/10'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                              title={`Snap simulated peak center to ${peak.theta.toFixed(3)}° (d = ${peak.dSpacing.toFixed(4)} Å)`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-extrabold">{peak.label}</span>
                              </div>
                              <div className="mt-1 flex justify-between items-center text-[9px] w-full text-slate-400 font-medium leading-none">
                                <span>{peak.theta.toFixed(2)}°</span>
                                <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">{peak.dSpacing.toFixed(3)} Å</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Background & Noise */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              {/* Background Level */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <span>Noise Background (cps)</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{background.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0" max="80" step="1"
                  value={background} 
                  onChange={(e) => setBackground(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Poisson Noise */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <span>Poisson Statistical Noise</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{(noiseLevel * 10).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.5"
                  value={noiseLevel} 
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Export and Actions */}
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Dataset (.CSV)
            </button>

          </div>
        </div>
      </div>

      {/* Visualizer and Stats Panel */}
      <div className="xl:col-span-9 space-y-6">
        
        {/* Main interactive Chart Container */}
        <div 
          className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[500px] h-[58vh] flex flex-col relative overflow-hidden shadow-sm"
          ref={chartContainerRef}
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Line Profile Peak Visualizer
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Interactive Bragg peak profile fitting. Hover to inspect precise localized physical data.
              </p>
            </div>

            {/* Live Indicator Pill */}
            <div className="flex items-center gap-3 px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cu-Kα₁ = {activeWavelength.toFixed(5)} nm</span>
            </div>
          </div>

          {/* Recharts Figure */}
          <div className="flex-1 w-full min-h-0 min-w-0 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 15, right: 30, left: 10, bottom: 15 }}
                onClick={(e: any) => {
                  if (e && e.activeLabel !== undefined) {
                    setCenter(Number(e.activeLabel));
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/>
                     <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="1.5" height="6" transform="translate(0,0)" fill="#475569" opacity="0.25"></rect>
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} strokeWidth={1} />
                
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}}
                  label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => val.toFixed(2)}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis domain={[0, amplitude * 1.25]} width={35} tick={{fontSize: 10, fill: '#64748b'}} />
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      const thetaRad = (dataPoint.x / 2) * Math.PI / 180;
                      const localSize = activeWavelength * scherrerK / ((fwhm * Math.PI / 180) * Math.cos(thetaRad));
                      
                      return (
                        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-xl shadow-lg text-xs border border-slate-200 dark:border-slate-800 min-w-[200px]">
                          <div className="font-bold border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 text-indigo-600 dark:text-indigo-400">
                            Angle 2θ: {dataPoint.x.toFixed(4)}°
                          </div>
                          <div className="space-y-2 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Y_measured:</span>
                              <span className="font-bold">{dataPoint.y.toFixed(1)} cps</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Y_clean:</span>
                              <span className="font-bold">{dataPoint._cleanY?.toFixed(1) || '-'} cps</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Local Size:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{localSize.toFixed(1)} nm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Peak Model:</span>
                              <span className="font-bold">{type}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                
                {/* Background Noise Reference Area */}
                {chartData.length > 0 && (
                  <ReferenceArea 
                    x1={chartData[0].x} 
                    x2={chartData[chartData.length - 1].x} 
                    y1={0} 
                    y2={background} 
                    fill="url(#hatch)" 
                    stroke="none"
                  >
                     <Label value="Background Level" position="insideBottomRight" offset={10} fill="#94a3b8" fontSize={9} fontWeight="700" />
                  </ReferenceArea>
                )}

                {/* Integral Breadth Area */}
                {stats && (
                  <ReferenceArea 
                    x1={center - stats.integralBreadth / 2} 
                    x2={center + stats.integralBreadth / 2} 
                    y1={background} y2={amplitude + background} 
                    fill="rgba(99, 102, 241, 0.03)"
                    stroke="#818cf8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  >
                    <Label value="Integral Breadth (β)" position="insideBottom" offset={10} fill="#818cf8" fontSize={9} fontWeight="700" />
                  </ReferenceArea>
                )}

                {/* Centroid Reference Marker */}
                <ReferenceLine x={center} stroke="#4f46e5" strokeDasharray="3 3" strokeWidth={1.5}>
                   <Label value="Centroid" position="top" fill="#4f46e5" fontSize={10} fontWeight="700" offset={8} />
                </ReferenceLine>
                <ReferenceDot x={center} y={amplitude + background} r={4} fill="#4f46e5" stroke="#ffffff" strokeWidth={1.5} />

                {/* Reference Material Peaks Overlay Lines */}
                {showReferencePeaks && parsedRefPeaks.map((peak, idx) => {
                  const xMin = chartData[0]?.x || 0;
                  const xMax = chartData[chartData.length - 1]?.x || 180;
                  if (peak.theta >= xMin && peak.theta <= xMax) {
                    return (
                      <ReferenceLine 
                        key={`ref-peak-${idx}`} 
                        x={peak.theta} 
                        stroke="#10b981" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.2}
                      >
                         <Label 
                           value={`${peak.label} (${peak.theta.toFixed(2)}°)`} 
                           position="insideTopLeft" 
                           fill="#047857" 
                           fontSize={9} 
                           fontWeight="700" 
                           offset={12} 
                         />
                      </ReferenceLine>
                    );
                  }
                  return null;
                })}

                {/* Intensity Markers */}
                <ReferenceLine y={amplitude + background} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 3">
                   <Label value={`I(max): ${(amplitude + background).toFixed(1)}`} position="insideLeft" fill="#94a3b8" fontSize={9} offset={8} />
                </ReferenceLine>

                {/* FWHM Boundary Line & Markers */}
                <ReferenceLine 
                  segment={[{ x: center - fwhm / 2, y: amplitude / 2 + background }, { x: center + fwhm / 2, y: amplitude / 2 + background }]} 
                  stroke="#4338ca" 
                  strokeWidth={2}
                >
                  <Label value={`FWHM Width: ${fwhm.toFixed(4)}°`} position="top" fill="#4338ca" fontSize={10} fontWeight="700" offset={6} />
                </ReferenceLine>
                <ReferenceDot x={center - fwhm / 2} y={amplitude / 2 + background} r={4} fill="#4338ca" stroke="#ffffff" strokeWidth={1.5} />
                <ReferenceDot x={center + fwhm / 2} y={amplitude / 2 + background} r={4} fill="#4338ca" stroke="#ffffff" strokeWidth={1.5} />

                {/* Clean Peak Curve */}
                <Area 
                   type="monotone" 
                   dataKey="_cleanY" 
                   stroke="#4f46e5" 
                   strokeWidth={3}
                   fillOpacity={1} 
                   fill="url(#colorY)" 
                   isAnimationActive={false}
                   activeDot={false}
                />

                {/* Statistical Noisy Curve */}
                <Area 
                   type="monotone" 
                   dataKey="y" 
                   stroke="#f43f5e" 
                   strokeWidth={1.2}
                   strokeOpacity={0.65}
                   fillOpacity={0} 
                   fill="none" 
                   isAnimationActive={false}
                   activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {stats && (
          <ScientificMathControl
            title="Instrumental Peak Deconvolution"
            formula="\beta_{\text{sample}} = \sqrt{\beta_{\text{obs}}^2 - \beta_{\text{inst}}^2}"
            description="Isolate the specimen's pure physical broadening by subtracting the instrument's footprint under Gaussian approximation (quadratic subtraction)."
            variables={[
              { symbol: 'β_obs', name: 'Observed FWHM', value: (stats.fwhm * Math.PI / 180), unit: 'rad' },
              { symbol: 'β_inst', name: 'Instrumental Broadening', value: (0.015 * Math.PI / 180), unit: 'rad' }
            ]}
            result={Math.sqrt(Math.max(0, Math.pow(stats.fwhm * Math.PI / 180, 2) - Math.pow(0.015 * Math.PI / 180, 2)))}
            resultUnit="rad"
            resultName="Specimen Pure Broadening"
          />
        )}

        {/* Physical Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Crystallite Size</span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {stats && stats.integralBreadth > 0 ? (
                (() => {
                  const thetaRad = (center / 2) * (Math.PI / 180);
                  const betaRad = stats.integralBreadth * (Math.PI / 180);
                  const sizeBroadening = type === 'Pseudo-Voigt' ? betaRad * eta : type === 'Gaussian' ? 0.00001 : betaRad;
                  const L = (scherrerK * activeWavelength) / (sizeBroadening * Math.cos(thetaRad));
                  return L > 250 ? ">250 nm" : `${L.toFixed(1)} nm`;
                })()
              ) : '-'}
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">Scherrer length of coherent crystalline domains.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Lattice Strain (ε)</span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {stats && stats.integralBreadth > 0 ? (
                (() => {
                  const thetaRad = (center / 2) * (Math.PI / 180);
                  const betaRad = stats.integralBreadth * (Math.PI / 180);
                  const strainBroadening = type === 'Pseudo-Voigt' ? betaRad * (1 - eta) : type === 'Gaussian' ? betaRad : 0.00001;
                  const e = strainBroadening / (4 * Math.tan(thetaRad));
                  return `${(e * 1000).toFixed(2)} × 10⁻³`;
                })()
              ) : '-'}
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">Instrument / deformation lattice microstrain.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Integrated Area</span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{stats?.area.toFixed(1)}</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">Integrated intensity under peak profile (cps·deg).</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Integral Breadth (β)</span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{stats?.integralBreadth.toFixed(4)}°</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">Equivalent height rectangle width (Integrated Area / I_max).</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Shape Factor (φ)</span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">{stats?.shapeFactor.toFixed(3)}</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">FWHM / β ratio. Gaussian ≈ 0.94, Lorentzian ≈ 0.64.</p>
          </div>

        </div>

        {/* Profile Analysis Alerts */}
        {analysis && (
          <div className={`p-4 rounded-xl border transition-all ${
            analysis.status === 'ok' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 
            'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${analysis.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              Analytical Simulation & Physics Consistency Reports
            </h4>
            <ul className="space-y-1">
              {analysis.messages.map((msg, idx) => (
                <li key={idx} className="text-xs flex items-center gap-2">
                  <span className="text-[10px] opacity-70">•</span>
                  <span>{msg.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Diffraction Theory & Line Profile Models (High-value PhD Reference Hub) */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Diffraction Physics & Analytical Models
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Theoretical formulation governing crystallite size broadening and lattice microstrain calculations.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-center px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold rounded-full border border-indigo-100 dark:border-indigo-900/30">
              PHYSICS CORE v2.4
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Scherrer Formulation Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-purple-500 rounded-sm" />
                    Scherrer Crystallite Coherence Size (D)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20">
                    Size Domain
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Derived from the Bragg peak's pure Lorentzian broadening. Represents the average volume-weighted dimension of coherent crystalline diffraction domains.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 text-center relative">
                  <span className="absolute top-1 left-2 text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">analytical model</span>
                  <div className="font-mono text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400 py-1.5 tracking-wide">
                    D = <span className="text-purple-600 dark:text-purple-400">(K · λ)</span> / <span className="text-emerald-600 dark:text-emerald-400">(β_size · cos(θ))</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 relative z-10">
                <div className="grid grid-cols-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span><strong>K</strong>: Shape factor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span><strong>λ</strong>: Wavelength</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>β_size</strong>: Lorentzian FWHM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stokes-Wilson Microstrain Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-blue-500 rounded-sm" />
                    Stokes-Wilson Lattice Microstrain (ε)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20">
                    Strain Domain
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Extracted from Gaussian peak broadening. Models localized lattice microstrains, dislocations, crystal defects, and systematic interplanar d-spacing fluctuations.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 text-center relative">
                  <span className="absolute top-1 left-2 text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">analytical model</span>
                  <div className="font-mono text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400 py-1.5 tracking-wide">
                    ε = <span className="text-blue-600 dark:text-blue-400">β_strain</span> / <span className="text-rose-600 dark:text-rose-400">(4 · tan(θ))</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 relative z-10">
                <div className="grid grid-cols-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span><strong>β_strain</strong>: Gaussian FWHM</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span><strong>θ</strong>: Half the diffraction angle 2θ (Bragg angle)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Mathematical Profiles Section */}
          <div className="space-y-3 pt-3">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Diffraction Peak Profile Functions
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Gaussian Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-blue-400 dark:hover:border-blue-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  G(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Gaussian Model</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = I₀·e<sup>-ln(2)·((θ-θ₀)/w)²</sup>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Represents rapid exponential decay. Excellent for modeling instrumental broadening.
                </p>
              </div>

              {/* Lorentzian Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-purple-400 dark:hover:border-purple-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  L(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Lorentzian Model</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = I₀ / [1 + ((θ-θ₀)/w)²]
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Features heavy polynomial tails. Ideal for modeling finite crystallite sizes.
                </p>
              </div>

              {/* Pseudo-Voigt Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-amber-400 dark:hover:border-amber-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  pV(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Pseudo-Voigt</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = η·L(θ) + (1-η)·G(θ)
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  A linear convolution. Standard hybrid model for Rietveld refinement calculations.
                </p>
              </div>

              {/* Pearson VII Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-pink-400 dark:hover:border-pink-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                  P7(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Pearson VII</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = I₀ / [1 + (2<sup>1/m</sup>-1)·((θ-θ₀)/w)²]<sup>m</sup>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Highly adaptable profile. Mixer exponent <strong className="text-slate-700 dark:text-slate-300">m</strong> transitions seamlessly between L(1) and G(∞).
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
