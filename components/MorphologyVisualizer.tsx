import React from 'react';

export const MorphologyVisualizer = ({ kType, sizeNm }: { kType: string, sizeNm: number }) => {
  // Determine shape based on K type
  const isCubic = kType.includes('Cubic');
  const isSpherical = kType.includes('Spherical') || kType.includes('Standard');
  const isPlate = kType.includes('Platelets');
  const isRod = kType.includes('Nanowires');
  
  return (
    <div className="w-full h-full min-h-[220px] bg-[#050B14] rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner group">
      <div className="absolute inset-0 bg-grid-slate-800/20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] opacity-40 pointer-events-none"></div>
      
      <svg className="w-full h-full max-w-[250px] max-h-[180px]" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="sphere-grad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>
          <linearGradient id="cube-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="cube-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="cube-side" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        
        {isSpherical && (
          <g className="animate-in zoom-in duration-700">
            <circle cx="100" cy="100" r="50" fill="url(#sphere-grad)" filter="drop-shadow(0 10px 10px rgba(217,119,6,0.3))" />
            
            {/* Specular highlight */}
            <path d="M 75 65 A 25 25 0 0 1 105 60 A 30 30 0 0 0 70 85 Z" fill="rgba(255,255,255,0.4)" />
          </g>
        )}
        
        {isCubic && (
          <g className="animate-in zoom-in duration-700 transform origin-center translate-y-3">
             <path d="M 100 40 L 150 65 L 100 90 L 50 65 Z" fill="url(#cube-top)" />
             <path d="M 50 65 L 100 90 L 100 150 L 50 125 Z" fill="url(#cube-front)" />
             <path d="M 100 90 L 150 65 L 150 125 L 100 150 Z" fill="url(#cube-side)" />
          </g>
        )}
        
        {isPlate && (
           <g className="animate-in zoom-in duration-700 transform origin-center translate-y-4">
             <ellipse cx="100" cy="80" rx="70" ry="25" fill="url(#cube-top)" />
             <path d="M 30 80 L 30 110 A 70 25 0 0 0 170 110 L 170 80 A 70 25 0 0 1 30 80 Z" fill="url(#cube-front)" />
           </g>
        )}

        {isRod && (
           <g className="animate-in zoom-in duration-700 transform origin-center">
             <ellipse cx="100" cy="40" rx="20" ry="10" fill="url(#cube-top)" />
             <path d="M 80 40 L 80 160 A 20 10 0 0 0 120 160 L 120 40 A 20 10 0 0 1 80 40 Z" fill="url(#cube-front)" />
           </g>
        )}
        
        {/* Scale indicator */}
        <g className="opacity-60">
          <line x1="50" y1="180" x2="150" y2="180" stroke="#f59e0b" strokeWidth="2" />
          <line x1="50" y1="175" x2="50" y2="185" stroke="#f59e0b" strokeWidth="2" />
          <line x1="150" y1="175" x2="150" y2="185" stroke="#f59e0b" strokeWidth="2" />
          <text x="100" y="195" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
             ~{sizeNm.toFixed(1)} nm
          </text>
        </g>
      </svg>
      
      <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
          <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-[0.2em] drop-shadow-md">Morphology Projection</span>
      </div>
      <div className="absolute bottom-3 right-4 text-[9px] font-mono font-black text-slate-500 bg-[#070D18]/80 backdrop-blur px-2.5 py-1 rounded-md border border-[#1e293b]">
          Geometric Scale Matrix
      </div>
    </div>
  );
};
