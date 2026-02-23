import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface BraggVisualizationProps {
  wavelength: number;
  twoTheta: number;
}

export const BraggVisualization: React.FC<BraggVisualizationProps> = ({ wavelength, twoTheta }) => {
  // Constants for visualization
  const width = 500;
  const height = 300;
  const planeSpacing = 80; // Visual distance between planes (d_vis)
  const centerY = height / 2;
  const centerX = width / 2;
  
  // Physics calculations
  const theta = twoTheta / 2;
  const thetaRad = (theta * Math.PI) / 180;
  
  // Calculate d-spacing based on Bragg's law: nλ = 2d sinθ (assuming n=1)
  const dSpacing = (wavelength / (2 * Math.sin(thetaRad))) || 0;

  // Visual Wavelength calculation
  // λ_vis = 2 * d_vis * sin(theta)
  const lambdaVis = 2 * planeSpacing * Math.sin(thetaRad);

  // Generate wave path
  const generateWavePath = (startX: number, startY: number, angleRad: number, length: number, phaseShift: number = 0) => {
    const points = [];
    const amplitude = 6;
    const steps = 100;
    
    // Rotate coordinates
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const dist = t * length;
      
      // Sine wave equation
      // phaseShift is in pixels along the wave
      const waveY = amplitude * Math.sin(2 * Math.PI * (dist - phaseShift) / lambdaVis);
      
      // Rotate and translate
      const px = startX + (dist * cosA - waveY * sinA);
      const py = startY + (dist * sinA + waveY * cosA);
      
      points.push(`${px},${py}`);
    }
    return `M ${points.join(' L ')}`;
  };

  // Ray geometry
  const topAtomY = centerY - planeSpacing / 2;
  const bottomAtomY = centerY + planeSpacing / 2;
  const rayLength = 220;
  
  // Incident Ray 1 (Top)
  const inc1EndX = centerX;
  const inc1EndY = topAtomY;
  const inc1StartX = centerX - rayLength * Math.cos(thetaRad);
  const inc1StartY = topAtomY - rayLength * Math.sin(thetaRad);

  // Incident Ray 2 (Bottom)
  const inc2EndX = centerX;
  const inc2EndY = bottomAtomY;
  const inc2StartX = centerX - rayLength * Math.cos(thetaRad);
  const inc2StartY = bottomAtomY - rayLength * Math.sin(thetaRad);

  // Reflected Ray 1 (Top)
  const ref1StartX = centerX;
  const ref1StartY = topAtomY;
  const ref1EndX = centerX + rayLength * Math.cos(thetaRad);
  const ref1EndY = topAtomY - rayLength * Math.sin(thetaRad);

  // Reflected Ray 2 (Bottom)
  const ref2StartX = centerX;
  const ref2StartY = bottomAtomY;
  const ref2EndX = centerX + rayLength * Math.cos(thetaRad);
  const ref2EndY = bottomAtomY - rayLength * Math.sin(thetaRad);

  // Path Difference Points
  const pathDiff = planeSpacing * Math.sin(thetaRad);
  
  const cx = centerX - pathDiff * Math.cos(thetaRad);
  const cy = bottomAtomY - pathDiff * Math.sin(thetaRad);
  
  const dx = centerX + pathDiff * Math.cos(thetaRad);
  const dy = bottomAtomY - pathDiff * Math.sin(thetaRad);

  // Atoms
  const atoms = [];
  const atomSpacing = 40;
  const atomsCount = 10;
  for (let i = -atomsCount/2; i <= atomsCount/2; i++) {
    atoms.push({ x: centerX + i * atomSpacing, y: topAtomY });
    atoms.push({ x: centerX + i * atomSpacing, y: bottomAtomY });
  }

  const waveAnimDuration = 1; // seconds per lambda
  
  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative shadow-2xl">
      <div className="absolute top-4 left-4 text-white font-mono text-xs z-10 space-y-1 bg-slate-900/80 p-2 rounded backdrop-blur-sm border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 w-4">θ</span>
          <span className="text-emerald-400 font-bold">{theta.toFixed(2)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 w-4">d</span>
          <span className="text-amber-400 font-bold">{dSpacing.toFixed(4)} Å</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 w-4">λ</span>
          <span className="text-blue-400 font-bold">{wavelength.toFixed(4)} Å</span>
        </div>
      </div>
      
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="pointer-events-none">
        <defs>
          <radialGradient id="atomGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
          <radialGradient id="highlightAtomGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Atomic Planes */}
        <line x1="0" y1={topAtomY} x2={width} y2={topAtomY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="0" y1={bottomAtomY} x2={width} y2={bottomAtomY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Atoms */}
        {atoms.map((atom, i) => (
          <circle key={i} cx={atom.x} cy={atom.y} r="6" fill="url(#atomGrad)" opacity="0.8" />
        ))}
        
        {/* Highlighted Atoms (A and B) */}
        <circle cx={centerX} cy={topAtomY} r="8" fill="url(#highlightAtomGrad)" filter="url(#glow)" />
        <circle cx={centerX} cy={bottomAtomY} r="8" fill="url(#highlightAtomGrad)" filter="url(#glow)" />
        <text x={centerX} y={topAtomY - 20} fill="#fcd34d" fontSize="12" textAnchor="middle" fontWeight="bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>A</text>
        <text x={centerX} y={bottomAtomY + 25} fill="#fcd34d" fontSize="12" textAnchor="middle" fontWeight="bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>B</text>

        {/* Path Difference Triangle Area */}
        <path d={`M ${centerX} ${topAtomY} L ${cx} ${cy} L ${centerX} ${bottomAtomY} Z`} fill="rgba(16, 185, 129, 0.15)" stroke="none" />
        <path d={`M ${centerX} ${topAtomY} L ${dx} ${dy} L ${centerX} ${bottomAtomY} Z`} fill="rgba(16, 185, 129, 0.15)" stroke="none" />

        {/* Path Difference Lines */}
        <line x1={centerX} y1={topAtomY} x2={cx} y2={cy} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1={centerX} y1={topAtomY} x2={dx} y2={dy} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
        
        <text x={(centerX + cx)/2 - 15} y={(topAtomY + cy)/2} fill="#10b981" fontSize="10" fontWeight="bold">d sinθ</text>
        <text x={(centerX + dx)/2 + 5} y={(topAtomY + dy)/2} fill="#10b981" fontSize="10" fontWeight="bold">d sinθ</text>

        {/* Rays - Base Lines */}
        <line x1={inc1StartX} y1={inc1StartY} x2={inc1EndX} y2={inc1EndY} stroke="rgba(56, 189, 248, 0.1)" strokeWidth="4" />
        <line x1={ref1StartX} y1={ref1StartY} x2={ref1EndX} y2={ref1EndY} stroke="rgba(56, 189, 248, 0.1)" strokeWidth="4" />
        <line x1={inc2StartX} y1={inc2StartY} x2={inc2EndX} y2={inc2EndY} stroke="rgba(56, 189, 248, 0.1)" strokeWidth="4" />
        <line x1={ref2StartX} y1={ref2StartY} x2={ref2EndX} y2={ref2EndY} stroke="rgba(56, 189, 248, 0.1)" strokeWidth="4" />

        {/* Animated Waves */}
        {/* Incident 1 */}
        <motion.path 
          d={generateWavePath(inc1StartX - lambdaVis, inc1StartY - lambdaVis * Math.sin(thetaRad), thetaRad, rayLength + lambdaVis)} 
          stroke="#38bdf8" strokeWidth="2" fill="none" 
          animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
          transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
        />
        {/* Reflected 1 */}
        <motion.path 
          d={generateWavePath(ref1StartX - lambdaVis, ref1StartY - lambdaVis * -Math.sin(thetaRad), -thetaRad, rayLength + lambdaVis)} 
          stroke="#38bdf8" strokeWidth="2" fill="none" 
          animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
          transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
        />
        
        {/* Incident 2 */}
        <motion.path 
          d={generateWavePath(inc2StartX - lambdaVis, inc2StartY - lambdaVis * Math.sin(thetaRad), thetaRad, rayLength + lambdaVis)} 
          stroke="#f472b6" strokeWidth="2" fill="none" 
          animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
          transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
        />
        
        {/* Reflected 2 */}
        <motion.path 
          d={generateWavePath(ref2StartX - lambdaVis, ref2StartY - lambdaVis * -Math.sin(thetaRad), -thetaRad, rayLength + lambdaVis)} 
          stroke="#f472b6" strokeWidth="2" fill="none" 
          animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
          transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
        />

        {/* Angle Markers */}
        <path d={`M ${centerX - 40} ${topAtomY} A 40 40 0 0 0 ${centerX - 40 * Math.cos(thetaRad)} ${topAtomY - 40 * Math.sin(thetaRad)}`} stroke="white" fill="none" opacity="0.3" strokeDasharray="2 2" />
        <text x={centerX - 55} y={topAtomY - 15} fill="white" fontSize="12" opacity="0.8">θ</text>

      </svg>
    </div>
  );
};
