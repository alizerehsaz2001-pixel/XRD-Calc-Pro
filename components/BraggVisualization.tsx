import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Move, Waves, Play, Pause, RotateCw, Activity, Atom, Info } from 'lucide-react';

interface BraggVisualizationProps {
  wavelength: number;
  twoTheta: number;
}

export const BraggVisualization: React.FC<BraggVisualizationProps> = ({ wavelength, twoTheta: initialTwoTheta }) => {
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
  const lambdaVis = 2 * planeSpacing * Math.sin(thetaRad);

  // Generate wave path
  const generateWavePath = (startX: number, startY: number, angleRad: number, length: number, phaseShift: number = 0) => {
    const points = [];
    const amplitude = 5 + (signalStrength * 5); // Amplify wave visual when in phase
    const steps = 120;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const dist = t * length;
      const waveY = amplitude * Math.sin(2 * Math.PI * (dist - phaseShift) / lambdaVis);
      const px = startX + (dist * cosA - waveY * sinA);
      const py = startY + (dist * sinA + waveY * cosA);
      points.push(`${px},${py}`);
    }
    return `M ${points.join(' L ')}`;
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
    <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800 relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-all duration-1000" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 relative z-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Atom className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Lattice Probe</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Quantum Diffraction Dynamics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-black/40 rounded-2xl border border-slate-800/50 shadow-inner">
          <div className="flex items-center gap-4 px-4 py-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Scanner</span>
            <input 
              type="range" 
              min="10" 
              max="80" 
              step="0.1"
              value={localTwoTheta}
              onChange={(e) => {
                setLocalTwoTheta(parseFloat(e.target.value));
                setIsAutoScanning(false);
              }}
              className="w-32 accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
            <span className="text-xs font-mono font-black text-indigo-400 w-16 text-right tabular-nums bg-indigo-500/5 py-1 px-2 rounded-lg border border-indigo-500/20">{localTwoTheta.toFixed(1)}°</span>
          </div>
          <button 
            onClick={() => setIsAutoScanning(!isAutoScanning)}
            className={`p-2.5 rounded-xl transition-all border active:scale-90 ${isAutoScanning ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}
          >
            {isAutoScanning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-black/60 p-5 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Bragg Resolution</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-tighter">{theta.toFixed(2)}°</span>
                <span className="text-[9px] font-bold text-slate-600 uppercase">Theta</span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 p-5 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden group/card">
             <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
             <div className="relative z-10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Atom Spacing</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-400 tracking-tighter">{dSpacing.toFixed(4)}</span>
                <span className="text-[9px] font-bold text-slate-600 uppercase">Ångström</span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 p-6 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interference signal</span>
                <div className={`w-2 h-2 rounded-full ${signalStrength > 0.8 ? 'bg-emerald-500' : 'bg-slate-700'} animate-pulse`} />
             </div>
             <div className="h-16 flex items-end gap-1 px-1">
                {[...Array(20)].map((_, i) => {
                  const h = Math.max(10, signalStrength * (100 - i * 4) * Math.random() + 5);
                  return (
                    <motion.div 
                      key={`bar-${i}`} 
                      className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm"
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  );
                })}
             </div>
             <div className="mt-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest">
                  Signal Strength: {(signalStrength * 100).toFixed(0)}%
                </span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="w-full bg-[#05070a] rounded-3xl overflow-hidden border-2 border-slate-800/80 relative shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] aspect-[16/9]">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
            
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="pointer-events-none p-4" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="atomGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#1e293b" />
                </radialGradient>
                <radialGradient id="highlightAtomGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#92400e" />
                </radialGradient>
                <filter id="rayGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="constructiveGlow">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.5  0 0 0 0 1  0 0 0 1 0" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Atomic Planes */}
              <line x1="0" y1={topAtomY} x2={width} y2={topAtomY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1={bottomAtomY} x2={width} y2={bottomAtomY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Atoms */}
              {atoms.map((atom, i) => (
                <circle key={`atom-${atom.x}-${atom.y}-${i}`} cx={atom.x} cy={atom.y} r="6" fill="url(#atomGrad)" opacity="0.6" />
              ))}
              
              {/* Highlighted Atoms */}
              <motion.circle 
                cx={centerX} cy={topAtomY} r={8 + signalStrength * 4} 
                fill="url(#highlightAtomGrad)" 
                animate={{ filter: signalStrength > 0.8 ? 'url(#constructiveGlow)' : 'none' }}
              />
              <motion.circle 
                cx={centerX} cy={bottomAtomY} r={8 + signalStrength * 4} 
                fill="url(#highlightAtomGrad)" 
                animate={{ filter: signalStrength > 0.8 ? 'url(#constructiveGlow)' : 'none' }}
              />

              {/* Constructive Visual Feedback */}
              <AnimatePresence>
                {signalStrength > 0.8 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <circle cx={centerX} cy={centerY} r={50 * signalStrength} stroke="#6366f1" strokeWidth="1" fill="none" opacity="0.1" className="animate-ping" />
                  </motion.g>
                )}
              </AnimatePresence>

              {/* Path Difference Triangle */}
              <path d={`M ${centerX} ${topAtomY} L ${cx} ${cy} L ${centerX} ${bottomAtomY} Z`} fill="rgba(16, 185, 129, 0.05)" />
              <path d={`M ${centerX} ${topAtomY} L ${dx} ${dy} L ${centerX} ${bottomAtomY} Z`} fill="rgba(16, 185, 129, 0.05)" />

              <line x1={centerX} y1={topAtomY} x2={cx} y2={cy} stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
              <line x1={centerX} y1={topAtomY} x2={dx} y2={dy} stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
              
              <text x={cx - 30} y={cy - 10} fill="#10b981" fontSize="9" fontWeight="900" className="opacity-60">ΔS = d sinθ</text>
              <text x={dx + 5} y={dy - 10} fill="#10b981" fontSize="9" fontWeight="900" className="opacity-60">ΔS = d sinθ</text>

              {/* Incident Waves */}
              <motion.path 
                d={generateWavePath(inc1StartX - lambdaVis, inc1StartY - lambdaVis * Math.sin(thetaRad), thetaRad, rayLength + lambdaVis)} 
                stroke="#6366f1" strokeWidth="2" fill="none" opacity={0.6 + signalStrength * 0.4}
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />
              <motion.path 
                d={generateWavePath(inc2StartX - lambdaVis, inc2StartY - lambdaVis * Math.sin(thetaRad), thetaRad, rayLength + lambdaVis)} 
                stroke="#ec4899" strokeWidth="2" fill="none" opacity={0.6 + signalStrength * 0.4}
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />
              
              {/* Reflected Waves */}
              <motion.path 
                d={generateWavePath(centerX - lambdaVis, topAtomY - lambdaVis * -Math.sin(thetaRad), -thetaRad, rayLength + lambdaVis)} 
                stroke="#6366f1" strokeWidth={2 + signalStrength} fill="none" opacity={0.6 + signalStrength * 0.4}
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />
              <motion.path 
                d={generateWavePath(centerX - lambdaVis, bottomAtomY - lambdaVis * -Math.sin(thetaRad), -thetaRad, rayLength + lambdaVis)} 
                stroke="#ec4899" strokeWidth={2 + signalStrength} fill="none" opacity={0.6 + signalStrength * 0.4}
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                filter="url(#rayGlow)"
              />

              {/* Angle Marker */}
              <path 
                d={`M ${centerX - 60} ${topAtomY} A 60 60 0 0 0 ${centerX - 60 * Math.cos(thetaRad)} ${topAtomY - 60 * Math.sin(thetaRad)}`} 
                stroke="rgba(255,255,255,0.15)" fill="none" strokeWidth="1.5"
              />
              <text x={centerX - 80} y={topAtomY - 20} fill="#64748b" fontSize="12" fontWeight="bold">θ</text>
            </svg>

            {/* Bottom Legend */}
            <div className="absolute bottom-6 left-8 flex items-center gap-6 bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-slate-700/50 z-20">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-[2px] bg-[#6366f1] rounded-full shadow-[0_0_8px_#6366f1]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ray Order 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-[2px] bg-[#ec4899] rounded-full shadow-[0_0_8px_#ec4899]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ray Order 2</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Phase Locking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
