import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Move, Waves, Play, Pause, RotateCw, Activity, Atom, Info } from 'lucide-react';
import { useSettings } from './SettingsContext';

interface BraggVisualizationProps {
  wavelength: number;
  twoTheta: number;
}

export const BraggVisualization: React.FC<BraggVisualizationProps> = ({ wavelength, twoTheta: initialTwoTheta }) => {
  const { precision } = useSettings();
  const [localTwoTheta, setLocalTwoTheta] = useState(initialTwoTheta);
  const [isAutoScanning, setIsAutoScanning] = useState(false);

  useEffect(() => {
    setLocalTwoTheta(initialTwoTheta);
  }, [initialTwoTheta]);

  useEffect(() => {
    let interval: any;
    if (isAutoScanning) {
      interval = setInterval(() => {
        setLocalTwoTheta(prev => {
          const next = prev + 0.1;
          return next > 80 ? 10 : next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoScanning]);

  // Constants for visualization
  const width = 600;
  const height = 340;
  const planeSpacing = 80; 
  const centerY = height / 2 + 10;
  const centerX = width / 2;
  
  // Physics calculations
  const theta = (localTwoTheta || 0) / 2;
  const thetaRad = isNaN(theta) ? 0 : (theta * Math.PI) / 180;
  
  // Normalized spacing (d) - assuming initial theta is roughly at a peak
  const dRefTheta = (initialTwoTheta || 20) / 2;
  const dRefThetaRad = (dRefTheta * Math.PI) / 180;
  const dSpacing = wavelength / (2 * Math.max(0.0001, Math.sin(dRefThetaRad)));

  // Constructive interference check (Bragg Condition)
  // Signal strength based on how close sin(theta) is to nλ/2d
  const signalStrength = useMemo(() => {
    const targetSin = wavelength / (2 * dSpacing);
    const currentSin = Math.sin(thetaRad);
    const diff = Math.abs(currentSin - targetSin);
    return Math.exp(-Math.pow(diff * 50, 2)); // Gaussian peak
  }, [thetaRad, wavelength, dSpacing]);

  // Visual Wavelength calculation
  const lambdaVis = Math.max(15, 2 * planeSpacing * Math.sin(thetaRad));

  // Generate wave path
  const generateWavePath = (startX: number, startY: number, angleRad: number, length: number, phaseShift: number = 0) => {
    const amplitude = 5 + (signalStrength * 5); // Amplify wave visual when in phase
    const steps = 45; // Reduced from 120 for a massive calculation speedup
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const twoPiOverLambda = (2 * Math.PI) / lambdaVis;

    let path = `M ${startX.toFixed(1)},${startY.toFixed(1)}`;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const dist = t * length;
      const waveY = amplitude * Math.sin((dist - phaseShift) * twoPiOverLambda);
      const px = startX + (dist * cosA - waveY * sinA);
      const py = startY + (dist * sinA + waveY * cosA);
      path += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
    }
    return path;
  };

  const topAtomY = centerY - planeSpacing / 2;
  const bottomAtomY = centerY + planeSpacing / 2;
  const rayLength = 300;
  
  // Incident 1 (Top)
  const inc1StartX = centerX - rayLength * Math.cos(thetaRad);
  const inc1StartY = topAtomY - rayLength * Math.sin(thetaRad);

  // Incident 2 (Bottom)
  const inc2StartX = centerX - rayLength * Math.cos(thetaRad);
  const inc2StartY = bottomAtomY - rayLength * Math.sin(thetaRad);

  // Reflected 1 (Top)
  const ref1EndX = centerX + rayLength * Math.cos(thetaRad);
  const ref1EndY = topAtomY - rayLength * Math.sin(thetaRad);

  // Reflected 2 (Bottom)
  const ref2EndX = centerX + rayLength * Math.cos(thetaRad);
  const ref2EndY = bottomAtomY - rayLength * Math.sin(thetaRad);

  const pathDiff = planeSpacing * Math.sin(thetaRad);
  const cx = centerX - pathDiff * Math.cos(thetaRad);
  const cy = bottomAtomY - pathDiff * Math.sin(thetaRad);
  const dx = centerX + pathDiff * Math.cos(thetaRad);
  const dy = bottomAtomY - pathDiff * Math.sin(thetaRad);

  const atoms = [];
  const atomSpacing = 45;
  const atomsCount = 12;
  for (let i = -atomsCount/2; i <= atomsCount/2; i++) {
    atoms.push({ x: centerX + i * atomSpacing, y: topAtomY });
    atoms.push({ x: centerX + i * atomSpacing, y: bottomAtomY });
  }

  const waveAnimDuration = 1 / (Math.sin(thetaRad) * 2 + 0.1); 
    return (
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 relative z-10 gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <Atom className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
              Lattice Probe & Bragg Wave Simulator
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time constructive & destructive interference dynamics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-inner">
          <div className="flex items-center gap-3 px-3 py-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Goniometer 2θ</span>
            <input 
              type="range" 
              min="10" 
              max="80" 
              step="0.1"
              value={String(localTwoTheta) === 'NaN' ? '' : localTwoTheta}
              onChange={(e) => {
                setLocalTwoTheta(parseFloat(e.target.value));
                setIsAutoScanning(false);
              }}
              className="w-28 sm:w-36 accent-indigo-500 hover:accent-indigo-400 transition-all cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-indigo-400 w-16 text-right tabular-nums bg-indigo-500/10 py-1 px-2 rounded-lg border border-indigo-500/20">{localTwoTheta.toFixed(1)}°</span>
          </div>
          <button 
            onClick={() => setIsAutoScanning(!isAutoScanning)}
            className={`p-2 rounded-xl transition-all border active:scale-90 cursor-pointer ${isAutoScanning ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'}`}
            title={isAutoScanning ? "Pause auto-scan" : "Start continuous angle scan"}
          >
            {isAutoScanning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-inner relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Bragg Angle (θ)</span>
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-tighter">{theta.toFixed(precision)}°</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">2θ Value</span>
                <span className="text-xs font-mono font-bold text-slate-300">{localTwoTheta.toFixed(precision)}°</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-inner relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Plane Spacing (d)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-amber-400 tracking-tighter">{dSpacing.toFixed(precision)}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Å</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">λ Wavelength</span>
                <span className="text-xs font-mono font-bold text-slate-300">{wavelength.toFixed(4)} Å</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 shadow-inner relative overflow-hidden">
             <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-indigo-400" />
                  Phase Resonance
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                    signalStrength > 0.8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {signalStrength > 0.8 ? 'Bragg Peak' : 'Off-Resonance'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${signalStrength > 0.8 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'} animate-pulse`} />
                </div>
             </div>
             <div className="h-16 flex items-end gap-1 px-1 bg-black/40 p-2 rounded-xl border border-slate-800/50">
                {[...Array(20)].map((_, i) => {
                  const h = Math.max(10, signalStrength * (100 - i * 4) * (0.8 + 0.2 * Math.sin(Date.now() / 120 + i)) + 5);
                  return (
                    <div 
                      key={`bar-${i}`} 
                      className={`flex-1 rounded-t-sm transition-[height] duration-75 ${
                        signalStrength > 0.8 
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]' 
                          : 'bg-gradient-to-t from-indigo-700 to-indigo-400'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
             </div>
             <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9.5px] font-black text-slate-300 uppercase tracking-wider">
                    Scattering Amplitudes
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-indigo-400">
                  {(signalStrength * 100).toFixed(0)}%
                </span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="w-full bg-[#05070a] rounded-3xl overflow-hidden border-2 border-slate-800/90 relative shadow-[inset_0_4px_30px_rgba(0,0,0,0.9)] aspect-[16/9]">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
            
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="pointer-events-none p-4" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="atomGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#334155" />
                </radialGradient>
                <radialGradient id="highlightAtomGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#d97706" />
                </radialGradient>
                <filter id="rayGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="constructiveGlow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.8  0 0 0 0 0.4  0 0 0 1 0" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Atomic Planes Lines */}
              <line x1="0" y1={topAtomY} x2={width} y2={topAtomY} stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
              <line x1="0" y1={bottomAtomY} x2={width} y2={bottomAtomY} stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
              
              <text x="15" y={topAtomY - 8} fill="#818cf8" fontSize="9" fontWeight="800" className="opacity-80 font-mono">Plane (hkl)_1</text>
              <text x="15" y={bottomAtomY + 16} fill="#818cf8" fontSize="9" fontWeight="800" className="opacity-80 font-mono">Plane (hkl)_2</text>

              {/* Atoms */}
              {atoms.map((atom, i) => (
                <circle key={`atom-${atom.x}-${atom.y}-${i}`} cx={atom.x} cy={atom.y} r="5.5" fill="url(#atomGrad)" opacity="0.75" />
              ))}
              
              {/* Highlighted Core Scattering Center Atoms */}
              <motion.circle 
                cx={centerX} cy={topAtomY} r={8 + signalStrength * 5} 
                fill="url(#highlightAtomGrad)" 
                animate={{ filter: signalStrength > 0.8 ? 'url(#constructiveGlow)' : 'none' }}
              />
              <motion.circle 
                cx={centerX} cy={bottomAtomY} r={8 + signalStrength * 5} 
                fill="url(#highlightAtomGrad)" 
                animate={{ filter: signalStrength > 0.8 ? 'url(#constructiveGlow)' : 'none' }}
              />

              {/* Constructive Visual Ring Feedback */}
              <AnimatePresence>
                {signalStrength > 0.8 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <circle cx={centerX} cy={centerY} r={55 * signalStrength} stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.25" className="animate-ping" />
                    <circle cx={centerX} cy={topAtomY} r={24 * signalStrength} stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.3" className="animate-ping" />
                  </motion.g>
                )}
              </AnimatePresence>

              {/* Path Difference Triangles */}
              <path d={`M ${centerX} ${topAtomY} L ${cx} ${cy} L ${centerX} ${bottomAtomY} Z`} fill="rgba(16, 185, 129, 0.12)" />
              <path d={`M ${centerX} ${topAtomY} L ${dx} ${dy} L ${centerX} ${bottomAtomY} Z`} fill="rgba(16, 185, 129, 0.12)" />

              <line x1={centerX} y1={topAtomY} x2={cx} y2={cy} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1={centerX} y1={topAtomY} x2={dx} y2={dy} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
              
              <text x={cx - 38} y={cy - 10} fill="#10b981" fontSize="9.5" fontWeight="900" className="font-mono">d·sinθ</text>
              <text x={dx + 8} y={dy - 10} fill="#10b981" fontSize="9.5" fontWeight="900" className="font-mono">d·sinθ</text>

              {/* Plane Spacing d Dimension Indicator */}
              <line x1={centerX - 130} y1={topAtomY} x2={centerX - 130} y2={bottomAtomY} stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={centerX - 135} y1={topAtomY} x2={centerX - 125} y2={topAtomY} stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={centerX - 135} y1={bottomAtomY} x2={centerX - 125} y2={bottomAtomY} stroke="#f59e0b" strokeWidth="1.5" />
              <text x={centerX - 152} y={centerY + 3} fill="#f59e0b" fontSize="10" fontWeight="900" className="font-mono">d</text>

              {/* Incident Waves */}
              <motion.path 
                d={generateWavePath(inc1StartX - lambdaVis, inc1StartY - lambdaVis * Math.sin(thetaRad), thetaRad, rayLength + lambdaVis)} 
                stroke="#818cf8" strokeWidth="2.5" fill="none" opacity={0.7 + signalStrength * 0.3}
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />
              <motion.path 
                d={generateWavePath(inc2StartX - lambdaVis, inc2StartY - lambdaVis * Math.sin(thetaRad), thetaRad, rayLength + lambdaVis)} 
                stroke="#f43f5e" strokeWidth="2.5" fill="none" opacity={0.7 + signalStrength * 0.3}
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />
              
              {/* Reflected Waves */}
              <motion.path 
                d={generateWavePath(centerX - lambdaVis, topAtomY - lambdaVis * -Math.sin(thetaRad), -thetaRad, rayLength + lambdaVis)} 
                stroke="#818cf8" strokeWidth={2.5 + signalStrength * 1.5} fill="none" opacity={0.7 + signalStrength * 0.3}
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />
              <motion.path 
                d={generateWavePath(centerX - lambdaVis, bottomAtomY - lambdaVis * -Math.sin(thetaRad), -thetaRad, rayLength + lambdaVis)} 
                stroke="#f43f5e" strokeWidth={2.5 + signalStrength * 1.5} fill="none" opacity={0.7 + signalStrength * 0.3}
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />

              {/* Angle Marker */}
              <path 
                d={`M ${centerX - 60} ${topAtomY} A 60 60 0 0 0 ${centerX - 60 * Math.cos(thetaRad)} ${topAtomY - 60 * Math.sin(thetaRad)}`} 
                stroke="rgba(255,255,255,0.25)" fill="none" strokeWidth="1.5"
              />
              <text x={centerX - 80} y={topAtomY - 20} fill="#94a3b8" fontSize="12" fontWeight="bold" className="font-mono">θ</text>
            </svg>

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-800/80 z-20">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-[3px] bg-[#818cf8] rounded-full shadow-[0_0_8px_#818cf8]" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono">Incident Plane 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-[3px] bg-[#f43f5e] rounded-full shadow-[0_0_8px_#f43f5e]" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono">Incident Plane 2</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-1 bg-emerald-500/30 border border-emerald-500 rounded-xs" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">Path Difference (2d sinθ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${signalStrength > 0.8 ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest font-mono ${signalStrength > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {signalStrength > 0.8 ? 'Constructive (nλ)' : 'Phase Lag'}
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
