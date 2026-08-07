import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Play, Pause, Waves, Compass, Sliders, Zap } from 'lucide-react';
import { useSettings } from './SettingsContext';

interface BraggVisualizationProps {
  wavelength: number;
  twoTheta: number;
}

export const BraggVisualization: React.FC<BraggVisualizationProps> = ({ wavelength, twoTheta: initialTwoTheta }) => {
  const { precision } = useSettings();
  const [localTwoTheta, setLocalTwoTheta] = useState(initialTwoTheta);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [reflectionOrder, setReflectionOrder] = useState<number>(1);
  const [debyeWallerB, setDebyeWallerB] = useState<number>(0.5); // B-factor in A^2

  useEffect(() => {
    setLocalTwoTheta(initialTwoTheta);
  }, [initialTwoTheta]);

  useEffect(() => {
    let interval: any;
    if (isAutoScanning) {
      interval = setInterval(() => {
        setLocalTwoTheta(prev => {
          const next = prev + 0.15;
          return next > 90 ? 10 : next;
        });
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isAutoScanning]);

  // Diagram geometry dimensions
  const width = 640;
  const height = 380;
  const planeSpacing = 90; 
  const centerY = height / 2 + 15;
  const centerX = width / 2;
  
  const [showQVectors, setShowQVectors] = useState(false);
  const [showPhasor, setShowPhasor] = useState(true);

  // Physics calculations
  const theta = (localTwoTheta || 0) / 2;
  const thetaRad = isNaN(theta) ? 0 : (theta * Math.PI) / 180;
  
  // Reference d-spacing derived from initial condition assuming n=1 peak
  const dRefTheta = (initialTwoTheta || 28.44) / 2;
  const dRefThetaRad = (dRefTheta * Math.PI) / 180;
  const dSpacing = wavelength / (2 * Math.max(0.0001, Math.sin(dRefThetaRad)));

  // Calculate exact Bragg Peak angles for Quick Presets
  const peak1TwoTheta = useMemo(() => {
    const sin1 = wavelength / (2 * dSpacing);
    if (sin1 > 1) return null;
    return (2 * Math.asin(sin1) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  const peak2TwoTheta = useMemo(() => {
    const sin2 = (2 * wavelength) / (2 * dSpacing);
    if (sin2 > 1) return null;
    return (2 * Math.asin(sin2) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  const nullTwoTheta = useMemo(() => {
    const sinNull = (0.5 * wavelength) / (2 * dSpacing);
    if (sinNull > 1) return null;
    return (2 * Math.asin(sinNull) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  // Exact path difference delta = 2 * d * sin(theta)
  const pathLengthDiff = 2 * dSpacing * Math.sin(thetaRad);
  // Phase difference delta_phi in radians
  const phaseDiffRad = (2 * Math.PI * pathLengthDiff) / Math.max(0.0001, wavelength);
  const phaseDiffDeg = ((phaseDiffRad * 180 / Math.PI) % 360 + 360) % 360;

  // Scattering vector magnitude |Q| = 4 * pi * sin(theta) / lambda
  const qMagnitude = (4 * Math.PI * Math.sin(thetaRad)) / Math.max(0.0001, wavelength);
  
  // X-ray photon energy E = hc / lambda (in keV)
  const energyKeV = 12.3984 / Math.max(0.001, wavelength);

  // Debye-Waller thermal damping factor exp(-2M) where M = B * (sin(theta)/lambda)^2
  const sinOverLambda = Math.sin(thetaRad) / Math.max(0.0001, wavelength);
  const debyeWallerDamping = Math.exp(-2 * debyeWallerB * Math.pow(sinOverLambda, 2));

  // Constructive interference resonance signal strength
  const braggConditionSin = (reflectionOrder * wavelength) / (2 * dSpacing);
  const sinDiff = Math.abs(Math.sin(thetaRad) - braggConditionSin);
  const resonanceStrength = Math.exp(-Math.pow(sinDiff * 45, 2));
  const totalNormalizedIntensity = Math.pow(Math.cos(phaseDiffRad / 2), 2) * debyeWallerDamping;

  // Visual wave generator parameters
  const lambdaVis = 32; // Fixed visual wavelength for crystal clear wave peaks

  const generateWavePath = (
    startX: number, 
    startY: number, 
    angleRad: number, 
    length: number, 
    phaseOffset: number = 0,
    amplitudeVal: number = 6
  ) => {
    const steps = 80;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const twoPiOverLambda = (2 * Math.PI) / lambdaVis;

    let path = `M ${startX.toFixed(1)},${startY.toFixed(1)}`;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const dist = t * length;
      const waveY = amplitudeVal * Math.sin((dist - phaseOffset) * twoPiOverLambda);
      const px = startX + (dist * cosA - waveY * sinA);
      const py = startY + (dist * sinA + waveY * cosA);
      path += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
    }
    return path;
  };

  const topAtomY = centerY - planeSpacing / 2;
  const bottomAtomY = centerY + planeSpacing / 2;
  const rayLength = 280;

  // Key Scattering Points (Exact Vector Math)
  // Point A: Scattering center on top atomic plane
  const ax = centerX;
  const ay = topAtomY;

  // Point B: Scattering center on bottom atomic plane directly below A
  const bx = centerX;
  const by = bottomAtomY;

  // Point C: Perpendicular drop from A onto incident Ray 1 (lower ray)
  // Distance CB = planeSpacing * sin(theta)
  const dSinTheta = planeSpacing * Math.sin(thetaRad);
  const cx = bx - dSinTheta * Math.cos(thetaRad);
  const cy = by - dSinTheta * Math.sin(thetaRad);

  // Point D: Perpendicular drop from A onto diffracted Ray 1 (lower ray)
  // Distance BD = planeSpacing * sin(theta)
  const dx = bx + dSinTheta * Math.cos(thetaRad);
  const dy = by - dSinTheta * Math.sin(thetaRad);

  // Ray start and end positions
  // Incident Ray 2 (Upper, hits A):
  const inc2StartX = ax - rayLength * Math.cos(thetaRad);
  const inc2StartY = ay - rayLength * Math.sin(thetaRad);

  // Incident Ray 1 (Lower, hits B):
  const inc1StartX = bx - rayLength * Math.cos(thetaRad);
  const inc1StartY = by - rayLength * Math.sin(thetaRad);

  // Diffracted Ray 2 (Upper, leaves A):
  const diff2EndX = ax + rayLength * Math.cos(thetaRad);
  const diff2EndY = ay - rayLength * Math.sin(thetaRad);

  // Diffracted Ray 1 (Lower, leaves B):
  const diff1EndX = bx + rayLength * Math.cos(thetaRad);
  const diff1EndY = by - rayLength * Math.sin(thetaRad);

  // Atomic planes lattice nodes
  const atoms = [];
  const atomSpacing = 44;
  const atomsCount = 14;
  for (let i = -atomsCount/2; i <= atomsCount/2; i++) {
    atoms.push({ x: centerX + i * atomSpacing, y: topAtomY });
    atoms.push({ x: centerX + i * atomSpacing, y: bottomAtomY });
  }

  const waveAnimDuration = 1.2;

  // Black dots along rays to match textbook diagram style
  const rayNodeDots = [];
  const dotCount = 8;
  for (let i = 1; i <= dotCount; i++) {
    const dist = (i / (dotCount + 1)) * rayLength;
    // Incident Ray 2
    rayNodeDots.push({ x: inc2StartX + dist * Math.cos(thetaRad), y: inc2StartY + dist * Math.sin(thetaRad) });
    // Incident Ray 1
    rayNodeDots.push({ x: inc1StartX + dist * Math.cos(thetaRad), y: inc1StartY + dist * Math.sin(thetaRad) });
    // Diffracted Ray 2
    rayNodeDots.push({ x: ax + dist * Math.cos(thetaRad), y: ay - dist * Math.sin(thetaRad) });
    // Diffracted Ray 1
    rayNodeDots.push({ x: bx + dist * Math.cos(thetaRad), y: by - dist * Math.sin(thetaRad) });
  }

  // Oscilloscope Superposition Trace Generator
  const scopePoints = useMemo(() => {
    const pts = [];
    const numSteps = 80;
    for (let i = 0; i <= numSteps; i++) {
      const t = (i / numSteps) * 4 * Math.PI; // 2 periods
      const e1 = Math.sin(t);
      const e2 = Math.sin(t - phaseDiffRad);
      const eSum = e1 + e2;
      pts.push({ t, e1, e2, eSum });
    }
    return pts;
  }, [phaseDiffRad]);

  return (
    <div className="bg-[#080B11] border border-slate-800/80 p-5 sm:p-6 shadow-2xl relative font-mono text-slate-300">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
              Bragg Diffraction Kinematics & Wave Superposition
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              Quantitative X-Ray Scattering Physics & Interference Simulator
            </p>
          </div>
        </div>

        {/* Goniometer Angle Controls & Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 bg-black/60 p-2 border border-slate-800/80">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goniometer (2θ)</span>
            <input 
              type="range" 
              min="10" 
              max="90" 
              step="0.05"
              value={String(localTwoTheta) === 'NaN' ? '' : localTwoTheta}
              onChange={(e) => {
                setLocalTwoTheta(parseFloat(e.target.value));
                setIsAutoScanning(false);
              }}
              className="w-24 sm:w-32 accent-sky-400 hover:accent-sky-300 transition-all cursor-pointer h-1.5 bg-slate-800 appearance-none rounded-none"
            />
            <span className="text-xs font-bold text-sky-400 w-16 text-right tabular-nums bg-sky-950/40 px-2 py-0.5 border border-sky-500/30">
              {localTwoTheta.toFixed(2)}°
            </span>
          </div>
          <button 
            onClick={() => setIsAutoScanning(!isAutoScanning)}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest border transition-all flex items-center gap-1.5 ${
              isAutoScanning 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
            }`}
          >
            {isAutoScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoScanning ? 'Scanning' : 'Auto-Scan'}
          </button>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            {peak1TwoTheta && (
              <button
                onClick={() => { setLocalTwoTheta(peak1TwoTheta); setIsAutoScanning(false); setReflectionOrder(1); }}
                className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                title="Jump to 1st Order Bragg Peak"
              >
                Peak n=1 ({peak1TwoTheta.toFixed(1)}°)
              </button>
            )}
            {peak2TwoTheta && (
              <button
                onClick={() => { setLocalTwoTheta(peak2TwoTheta); setIsAutoScanning(false); setReflectionOrder(2); }}
                className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
                title="Jump to 2nd Order Bragg Peak"
              >
                Peak n=2 ({peak2TwoTheta.toFixed(1)}°)
              </button>
            )}
            {nullTwoTheta && (
              <button
                onClick={() => { setLocalTwoTheta(nullTwoTheta); setIsAutoScanning(false); }}
                className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                title="Jump to Destructive Interference Null"
              >
                Null (180°)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Telemetry & Physics Controls Panel */}
        <div className="lg:col-span-1 space-y-3">
          {/* Angle & Spacing Telemetry */}
          <div className="bg-[#0B0F17] p-3.5 border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between">
              <span>Geometric Parameters</span>
              <span className="text-sky-400 font-mono">λ = {wavelength.toFixed(4)} Å</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block">θ (Bragg Angle)</span>
                <span className="font-bold text-slate-200">{theta.toFixed(precision)}°</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">d-spacing (d_hkl)</span>
                <span className="font-bold text-emerald-400">{dSpacing.toFixed(precision)} Å</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Scattering Vector |Q|</span>
                <span className="font-bold text-sky-400">{qMagnitude.toFixed(4)} Å⁻¹</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Photon Energy (E)</span>
                <span className="font-bold text-amber-400">{energyKeV.toFixed(2)} keV</span>
              </div>
            </div>
          </div>

          {/* Reflection Order & Thermal Factor Control */}
          <div className="bg-[#0B0F17] p-3.5 border border-slate-800/80 space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">
              Physics Controls
            </div>
            
            {/* Reflection Order n */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Order (n):</span>
              <div className="flex bg-black/60 border border-slate-800/80 p-0.5">
                {[1, 2, 3].map(order => (
                  <button
                    key={order}
                    onClick={() => setReflectionOrder(order)}
                    className={`px-2.5 py-0.5 text-[10px] font-bold ${
                      reflectionOrder === order 
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    n={order}
                  </button>
                ))}
              </div>
            </div>

            {/* Debye-Waller B Factor Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Debye-Waller (B):</span>
                <span className="text-amber-400 font-bold">{debyeWallerB.toFixed(2)} Å²</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={debyeWallerB}
                onChange={(e) => setDebyeWallerB(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 appearance-none rounded-none accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Phase & Interference Status */}
          <div className="bg-[#0B0F17] p-3.5 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-1">
              <span>Phase Shift & Intensity</span>
              <span className={`px-1.5 py-0.5 border ${
                resonanceStrength > 0.85 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-black text-slate-500 border-white/10'
              }`}>
                {resonanceStrength > 0.85 ? 'Bragg Peak' : 'Off-Peak'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[9px] text-slate-500 block">Path Diff (Δ)</span>
                <span className="font-bold text-slate-300">{pathLengthDiff.toFixed(3)} Å</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Phase (Δφ)</span>
                <span className="font-bold text-purple-400">{phaseDiffDeg.toFixed(1)}°</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                <span>Relative Intensity (I/I₀)</span>
                <span className="font-bold text-sky-400">{(totalNormalizedIntensity * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-black border border-slate-800/80 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400 transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, totalNormalizedIntensity * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Superposition Oscilloscope Display & Phasor Wheel */}
          <div className="bg-[#0B0F17] p-3 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Waves className="w-3 h-3 text-sky-400" /> Superposition & Phasors</span>
              <button 
                onClick={() => setShowPhasor(!showPhasor)}
                className="text-[8px] uppercase tracking-wider text-sky-400 hover:underline"
              >
                {showPhasor ? 'Hide Phasor' : 'Show Phasor'}
              </button>
            </div>

            <div className="bg-[#030508] border border-slate-800/80 p-1 relative min-h-20 flex flex-col sm:flex-row items-center gap-2">
              {/* Scope Grid lines */}
              <div className="flex-1 w-full h-20 relative">
                <svg className="w-full h-full overflow-visible">
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />

                  {/* Wave 1 trace (cyan) */}
                  <path
                    d={scopePoints.map((p, idx) => {
                      const x = (idx / (scopePoints.length - 1)) * 180;
                      const y = 35 - p.e1 * 14;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    opacity="0.6"
                  />

                  {/* Wave 2 trace (magenta) */}
                  <path
                    d={scopePoints.map((p, idx) => {
                      const x = (idx / (scopePoints.length - 1)) * 180;
                      const y = 35 - p.e2 * 14;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1"
                    opacity="0.6"
                  />

                  {/* Resultant Wave trace (Amber/Gold) */}
                  <path
                    d={scopePoints.map((p, idx) => {
                      const x = (idx / (scopePoints.length - 1)) * 180;
                      const y = 35 - (p.eSum / 2) * 28;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>

              {/* Complex Argand Phasor Wheel */}
              {showPhasor && (
                <div className="w-20 h-20 shrink-0 bg-black/80 border border-slate-800 p-1 flex flex-col items-center justify-center relative">
                  <svg width="70" height="70" viewBox="0 0 100 100" className="overflow-visible">
                    {/* Circle & Axes */}
                    <circle cx="50" cy="50" r="32" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" fill="none" />
                    <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.1)" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.1)" />

                    {/* Vector E1 (Cyan, fixed along Re) */}
                    <line x1="50" y1="50" x2="74" y2="50" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="74" cy="50" r="1.5" fill="#38bdf8" />

                    {/* Vector E2 (Purple, angled by phaseDiffRad) */}
                    {(() => {
                      const e2x = 74 + 24 * Math.cos(phaseDiffRad);
                      const e2y = 50 - 24 * Math.sin(phaseDiffRad);
                      const totX = 50 + 24 * (1 + Math.cos(phaseDiffRad));
                      const totY = 50 - 24 * Math.sin(phaseDiffRad);
                      return (
                        <>
                          <line x1="74" y1="50" x2={e2x} y2={e2y} stroke="#c084fc" strokeWidth="1.5" />
                          <circle cx={e2x} cy={e2y} r="1.5" fill="#c084fc" />
                          {/* Total E_sum vector (Gold) */}
                          <line x1="50" y1="50" x2={totX} y2={totY} stroke="#fbbf24" strokeWidth="2" />
                          <circle cx={totX} cy={totY} r="2" fill="#fbbf24" />
                        </>
                      );
                    })()}
                  </svg>
                  <span className="text-[7px] text-amber-300 font-bold uppercase tracking-tighter absolute bottom-0.5">
                    Argand Phasor
                  </span>
                </div>
              )}
            </div>

            {/* Scope Legend */}
            <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-sky-400 inline-block" /> E₁(t)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-purple-400 inline-block" /> E₂(t)</span>
              <span className="flex items-center gap-1 font-bold text-amber-300"><span className="w-2 h-0.5 bg-amber-400 inline-block" /> E_total</span>
            </div>
          </div>
        </div>

        {/* Interactive Diffraction Ray-Tracing Diagram */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <div className="w-full bg-[#020408] border border-slate-800/80 relative shadow-2xl aspect-[16/9] overflow-hidden">
            {/* Top Right Canvas Overlay Toggle */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setShowQVectors(!showQVectors)}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all ${
                  showQVectors 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-black/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showQVectors ? 'Hide Vectors (Q)' : 'Show Vectors (k_i, k_f, Q)'}
              </button>
            </div>

            {/* Fine Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="pointer-events-none p-2" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead-sky" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker id="arrowhead-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                </marker>
                <marker id="arrowhead-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Atomic Planes Lines */}
              <line x1="20" y1={topAtomY} x2={width - 20} y2={topAtomY} stroke="#f1f5f9" strokeWidth="1.8" />
              <line x1="20" y1={bottomAtomY} x2={width - 20} y2={bottomAtomY} stroke="#f1f5f9" strokeWidth="1.8" />
              
              <text x="25" y={topAtomY - 10} fill="#cbd5e1" fontSize="11" className="font-mono font-bold uppercase tracking-wider">atomic plane</text>
              <text x="25" y={bottomAtomY + 18} fill="#cbd5e1" fontSize="11" className="font-mono font-bold uppercase tracking-wider">atomic plane</text>

              {/* Lattice Atoms (Black Filled Circles along Planes) */}
              {atoms.map((atom, i) => (
                <circle key={`atom-${atom.x}-${atom.y}-${i}`} cx={atom.x} cy={atom.y} r="4.5" fill="#000000" stroke="#f8fafc" strokeWidth="1" />
              ))}

              {/* Central Ray Vector Straight Lines (Light Blue) */}
              <line x1={inc2StartX} y1={inc2StartY} x2={ax} y2={ay} stroke="#38bdf8" strokeWidth="1.5" />
              <line x1={inc1StartX} y1={inc1StartY} x2={bx} y2={by} stroke="#38bdf8" strokeWidth="1.5" />
              <line x1={ax} y1={ay} x2={diff2EndX} y2={diff2EndY} stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrowhead-sky)" />
              <line x1={bx} y1={by} x2={diff1EndX} y2={diff1EndY} stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrowhead-sky)" />

              {/* Wavefront Dashed Lines */}
              <line x1={inc2StartX} y1={inc2StartY} x2={inc1StartX} y2={inc1StartY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={diff2EndX} y1={diff2EndY} x2={diff1EndX} y2={diff1EndY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />

              {/* Incident Wave 2 (Upper Ray, Pink/Magenta) */}
              <motion.path 
                d={generateWavePath(inc2StartX, inc2StartY, thetaRad, rayLength, 0, 7)} 
                stroke="#f43f5e" strokeWidth="2" fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              {/* Incident Wave 1 (Lower Ray, Green) */}
              <motion.path 
                d={generateWavePath(inc1StartX, inc1StartY, thetaRad, rayLength, 0, 7)} 
                stroke="#10b981" strokeWidth="2" fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              {/* Diffracted Wave 2 (Upper Ray, Pink/Magenta or Gold on Bragg Peak) */}
              <motion.path 
                d={generateWavePath(ax, ay, -thetaRad, rayLength, 0, 7)} 
                stroke={resonanceStrength > 0.85 ? "#fbbf24" : "#f43f5e"} 
                strokeWidth={resonanceStrength > 0.85 ? "2.5" : "2"} fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              {/* Diffracted Wave 1 (Lower Ray, Green or Gold on Bragg Peak) */}
              <motion.path 
                d={generateWavePath(bx, by, -thetaRad, rayLength, 0, 7)} 
                stroke={resonanceStrength > 0.85 ? "#fbbf24" : "#10b981"} 
                strokeWidth={resonanceStrength > 0.85 ? "2.5" : "2"} fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              {/* Black Dots along Ray Vectors */}
              {rayNodeDots.map((dot, idx) => (
                <circle key={`dot-${idx}`} cx={dot.x} cy={dot.y} r="2.5" fill="#000000" stroke="#38bdf8" strokeWidth="0.5" />
              ))}

              {/* Segment AB (Vertical Line connecting top Atom A and bottom Atom B) */}
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#f8fafc" strokeWidth="2" />
              <text x={ax + 6} y={(ay + by) / 2 + 3} fill="#f8fafc" fontSize="12" className="font-mono font-bold">d</text>

              {/* Dashed Line AC (Perpendicular drop from A to Incident Ray 1) */}
              <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Dashed Line AD (Perpendicular drop from A to Diffracted Ray 1) */}
              <line x1={ax} y1={ay} x2={dx} y2={dy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Right Angle Square Indicators at C and D */}
              <path 
                d={`M ${cx + 6 * Math.cos(thetaRad)} ${cy + 6 * Math.sin(thetaRad)} L ${cx + 6 * Math.cos(thetaRad) + 6 * Math.sin(thetaRad)} ${cy + 6 * Math.sin(thetaRad) - 6 * Math.cos(thetaRad)} L ${cx + 6 * Math.sin(thetaRad)} ${cy - 6 * Math.cos(thetaRad)}`} 
                stroke="#cbd5e1" fill="none" strokeWidth="1" 
              />
              <path 
                d={`M ${dx - 6 * Math.cos(thetaRad)} ${dy + 6 * Math.sin(thetaRad)} L ${dx - 6 * Math.cos(thetaRad) - 6 * Math.sin(thetaRad)} ${dy + 6 * Math.sin(thetaRad) - 6 * Math.cos(thetaRad)} L ${dx - 6 * Math.sin(thetaRad)} ${dy - 6 * Math.cos(thetaRad)}`} 
                stroke="#cbd5e1" fill="none" strokeWidth="1" 
              />

              {/* Points A, B, C, D Labels & Circles */}
              {/* Point A */}
              <circle cx={ax} cy={ay} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
              <text x={ax - 12} y={ay - 8} fill="#f8fafc" fontSize="12" className="font-mono font-bold italic">A</text>

              {/* Point B */}
              <circle cx={bx} cy={by} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
              <text x={bx - 12} y={by + 16} fill="#f8fafc" fontSize="12" className="font-mono font-bold italic">B</text>

              {/* Point C */}
              <circle cx={cx} cy={cy} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <text x={cx - 14} y={cy + 4} fill="#38bdf8" fontSize="11" className="font-mono font-bold italic">C</text>

              {/* Point D */}
              <circle cx={dx} cy={dy} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <text x={dx + 6} y={dy + 4} fill="#38bdf8" fontSize="11" className="font-mono font-bold italic">D</text>

              {/* Path Difference Dimension Arrows d sin θ */}
              {/* Segment CB */}
              <line x1={cx} y1={cy + 10} x2={bx} y2={by + 10} stroke="#38bdf8" strokeWidth="1" />
              <text x={(cx + bx) / 2 - 20} y={cy + 22} fill="#38bdf8" fontSize="11" className="font-mono font-bold">d sin θ</text>

              {/* Segment BD */}
              <text x={(bx + dx) / 2 + 4} y={dy + 22} fill="#38bdf8" fontSize="11" className="font-mono font-bold">d sin θ</text>

              {/* Optional Scattering Vectors Overlay at Point A */}
              {showQVectors && (
                <g className="animate-in fade-in duration-300">
                  {/* k_i (incident vector towards A) */}
                  <line 
                    x1={ax - 55 * Math.cos(thetaRad)} 
                    y1={ay - 55 * Math.sin(thetaRad)} 
                    x2={ax} 
                    y2={ay} 
                    stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrowhead-sky)" 
                  />
                  <text x={ax - 65 * Math.cos(thetaRad) - 10} y={ay - 65 * Math.sin(thetaRad)} fill="#38bdf8" fontSize="11" className="font-mono font-bold">k_i</text>

                  {/* k_f (diffracted vector away from A) */}
                  <line 
                    x1={ax} 
                    y1={ay} 
                    x2={ax + 55 * Math.cos(thetaRad)} 
                    y2={ay - 55 * Math.sin(thetaRad)} 
                    stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#arrowhead-amber)" 
                  />
                  <text x={ax + 60 * Math.cos(thetaRad)} y={ay - 60 * Math.sin(thetaRad)} fill="#fbbf24" fontSize="11" className="font-mono font-bold">k_f</text>

                  {/* Q = k_f - k_i (Scattering momentum transfer vector straight up) */}
                  {(() => {
                    const qLen = 110 * Math.sin(thetaRad);
                    return (
                      <>
                        <line 
                          x1={ax} 
                          y1={ay} 
                          x2={ax} 
                          y2={ay - qLen} 
                          stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowhead-emerald)" 
                        />
                        <text x={ax + 8} y={ay - qLen / 2} fill="#10b981" fontSize="11" className="font-mono font-bold">
                          Q = k_f - k_i
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Angles θ inside triangle at A */}
              {/* Arc between AB and AC */}
              <path 
                d={`M ${ax - 18 * Math.sin(thetaRad)} ${ay + 18 * Math.cos(thetaRad)} A 18 18 0 0 1 ${ax - 18 * Math.sin(thetaRad * 0.5)} ${ay + 18 * Math.cos(thetaRad * 0.5)}`} 
                stroke="#f8fafc" fill="none" strokeWidth="1" 
              />
              <text x={ax - 14} y={ay + 32} fill="#cbd5e1" fontSize="10" className="font-mono">θ</text>

              {/* Arc between AB and AD */}
              <path 
                d={`M ${ax + 18 * Math.sin(thetaRad)} ${ay + 18 * Math.cos(thetaRad)} A 18 18 0 0 0 ${ax + 18 * Math.sin(thetaRad * 0.5)} ${ay + 18 * Math.cos(thetaRad * 0.5)}`} 
                stroke="#f8fafc" fill="none" strokeWidth="1" 
              />
              <text x={ax + 8} y={ay + 32} fill="#cbd5e1" fontSize="10" className="font-mono">θ</text>

              {/* Incident Angle θ Arc between Incident Ray 2 and Top Plane */}
              <path 
                d={`M ${ax - 60} ${ay} A 60 60 0 0 1 ${ax - 60 * Math.cos(thetaRad)} ${ay - 60 * Math.sin(thetaRad)}`} 
                stroke="#38bdf8" fill="none" strokeWidth="1.2"
              />
              <text x={ax - 130} y={ay - 14} fill="#cbd5e1" fontSize="11" className="font-mono">incident angle <tspan fill="#38bdf8" fontWeight="bold">θ</tspan></text>

              {/* Reflected Angle θ Arc between Diffracted Ray 2 and Top Plane */}
              <path 
                d={`M ${ax + 60} ${ay} A 60 60 0 0 0 ${ax + 60 * Math.cos(thetaRad)} ${ay - 60 * Math.sin(thetaRad)}`} 
                stroke="#38bdf8" fill="none" strokeWidth="1.2"
              />
              <text x={ax + 60} y={ay - 14} fill="#cbd5e1" fontSize="11" className="font-mono"><tspan fill="#38bdf8" fontWeight="bold">θ</tspan> reflected angle</text>

              {/* Wave Labels */}
              <text x={inc2StartX + 20} y={inc2StartY - 12} fill="#f43f5e" fontSize="12" className="font-mono font-bold">wave 2</text>
              <text x={inc1StartX + 20} y={inc1StartY - 12} fill="#10b981" fontSize="12" className="font-mono font-bold">wave 1</text>

              {/* Wavelength lambda dimension markers */}
              <text x={inc2StartX + 120} y={inc2StartY - 14} fill="#cbd5e1" fontSize="11" className="font-mono font-bold">|← λ →|</text>
              <text x={inc1StartX + 100} y={inc1StartY + 24} fill="#cbd5e1" fontSize="11" className="font-mono font-bold">|← λ →|</text>

              {/* Interplanar Spacing Dimension Indicator on the Left */}
              <line x1={50} y1={topAtomY} x2={50} y2={bottomAtomY} stroke="#f8fafc" strokeWidth="1.5" />
              <line x1={45} y1={topAtomY} x2={55} y2={topAtomY} stroke="#f8fafc" strokeWidth="1.5" />
              <line x1={45} y1={bottomAtomY} x2={55} y2={bottomAtomY} stroke="#f8fafc" strokeWidth="1.5" />
              <text x={38} y={(topAtomY + bottomAtomY) / 2 + 4} fill="#f8fafc" fontSize="12" className="font-mono font-bold italic">d</text>

              {/* Reflection Order Indicator Label on the Right */}
              <text x={width - 80} y={(topAtomY + bottomAtomY) / 2 + 4} fill="#38bdf8" fontSize="13" className="font-mono font-bold">n = {reflectionOrder}</text>
            </svg>

            {/* Bottom Diagram Legend */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-black/80 px-3.5 py-1.5 border border-slate-800/80 z-20 text-[9px]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#38bdf8]" />
                  <span className="text-slate-400 uppercase tracking-wider">Incident Ray (k_i)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#fbbf24]" />
                  <span className="text-slate-400 uppercase tracking-wider">Diffracted Ray (k_f)</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 bg-emerald-400" />
                  <span className="text-slate-400 uppercase tracking-wider">Path Diff (2d sin θ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 ${resonanceStrength > 0.8 ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-600'}`} />
                  <span className={`uppercase tracking-wider ${resonanceStrength > 0.8 ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>
                    {resonanceStrength > 0.8 ? `Bragg Peak (${reflectionOrder}λ)` : 'Phase Mismatch'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
