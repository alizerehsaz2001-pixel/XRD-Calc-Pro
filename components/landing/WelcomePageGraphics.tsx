import React from 'react';

export interface WelcomePeak {
  twoTheta: number;
  hkl: string;
  intensity: number;
  fwhm: number;
}

/**
 * 2D Debye-Scherrer Area Detector Ring Graphic for the Hero Diffraction Showcase
 */
export const DebyeScherrerDetectorGraphic: React.FC<{
  peaks: WelcomePeak[];
  hoveredPeak: WelcomePeak | null;
  onHoverPeak: (peak: WelcomePeak | null) => void;
  formula: string;
}> = ({ peaks, hoveredPeak, onHoverPeak, formula }) => {
  const cx = 115;
  const cy = 82;
  const maxR = 72;

  return (
    <div className="relative bg-[#040812] rounded-2xl border border-slate-800/90 p-2.5 overflow-hidden">
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1 px-1">
        <span className="uppercase font-bold text-cyan-300">2D Debye-Scherrer Detector</span>
        <span className="text-slate-500">{formula} · χ (0°–360°)</span>
      </div>

      <svg viewBox="0 0 230 164" className="w-full h-36 select-none overflow-visible">
        <defs>
          <radialGradient id="detectorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Detector Background & Radial Glow */}
        <rect x="4" y="4" width="222" height="156" rx="10" fill="#03060e" stroke="#1e293b" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={maxR} fill="url(#detectorGlow)" />

        {/* Azimuthal chi crosshair lines */}
        <line x1={cx - maxR - 6} y1={cy} x2={cx + maxR + 6} y2={cy} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1={cx} y1={cy - maxR - 6} x2={cx} y2={cy + maxR + 6} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1={cx - 50} y1={cy - 50} x2={cx + 50} y2={cy + 50} stroke="#1e293b" strokeWidth="0.6" strokeDasharray="2 3" />
        <line x1={cx + 50} y1={cy - 50} x2={cx - 50} y2={cy + 50} stroke="#1e293b" strokeWidth="0.6" strokeDasharray="2 3" />

        {/* Concentric Debye-Scherrer Diffraction Cones */}
        {peaks.map((pk, idx) => {
          const r = 10 + ((pk.twoTheta - 10) / 85) * (maxR - 10);
          const isHovered = hoveredPeak?.hkl === pk.hkl;
          const opacity = Math.max(0.28, pk.intensity / 100);
          return (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => onHoverPeak(pk)}
              onMouseLeave={() => onHoverPeak(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={isHovered ? '#67e8f9' : pk.intensity === 100 ? '#22d3ee' : '#818cf8'}
                strokeWidth={isHovered ? 2.6 : pk.intensity === 100 ? 2.0 : 1.2}
                strokeOpacity={isHovered ? 1 : opacity}
              />
              {isHovered && (
                <text
                  x={cx + r + 4}
                  y={cy - 3}
                  className="fill-cyan-300 font-mono text-[7.5px] font-bold"
                >
                  {pk.hkl}
                </text>
              )}
            </g>
          );
        })}

        {/* Central Beamstop */}
        <line x1={cx} y1={160} x2={cx} y2={cy + 4} stroke="#334155" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="5.5" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r="1.8" fill="#f43f5e" />
      </svg>
    </div>
  );
};

/**
 * Live Bragg-Brentano Goniometer & 3D Crystal Lattice Schematic for the Hero Showcase
 */
export const GoniometerLatticeSchematic: React.FC<{
  system: string;
  twoTheta: number;
  hkl: string;
}> = ({ system, twoTheta, hkl }) => {
  const halfAngleRad = ((Math.min(70, Math.max(14, twoTheta)) / 2) * Math.PI) / 180;
  const cx = 115;
  const cy = 96;
  const armLen = 68;

  const srcX = cx - armLen * Math.cos(halfAngleRad);
  const srcY = cy - armLen * Math.sin(halfAngleRad);
  const detX = cx + armLen * Math.cos(halfAngleRad);
  const detY = cy - armLen * Math.sin(halfAngleRad);

  const isTetragonal = system.toLowerCase().includes('tetragonal');

  return (
    <div className="relative bg-[#040812] rounded-2xl border border-slate-800/90 p-2.5 overflow-hidden">
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1 px-1">
        <span className="uppercase font-bold text-violet-300">θ/2θ Goniometer Geometry</span>
        <span className="text-emerald-400 font-bold">2θ = {twoTheta.toFixed(2)}° {hkl}</span>
      </div>

      <svg viewBox="0 0 230 164" className="w-full h-36 select-none overflow-visible">
        <rect x="4" y="4" width="222" height="156" rx="10" fill="#03060e" stroke="#1e293b" strokeWidth="1" />

        {/* Goniometer Circle Arc */}
        <path
          d={`M ${cx - armLen} ${cy} A ${armLen} ${armLen} 0 0 1 ${cx + armLen} ${cy}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />

        {/* Crystal Lattice Planes on Sample Stage */}
        <g>
          <rect x={cx - 28} y={cy} width="56" height="6" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          {[0, 7, 14].map((dy, i) => (
            <g key={i}>
              <line
                x1={cx - 24}
                y1={cy + 12 + dy}
                x2={cx + 24}
                y2={cy + 12 + dy}
                stroke="#38bdf8"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                strokeOpacity={0.7 - i * 0.2}
              />
              {[-18, -9, 0, 9, 18].map((dx, j) => (
                <circle
                  key={j}
                  cx={cx + dx}
                  cy={cy + 12 + dy}
                  r="1.8"
                  fill={i === 0 ? '#22d3ee' : '#818cf8'}
                  fillOpacity={0.9 - i * 0.25}
                />
              ))}
            </g>
          ))}
        </g>

        {/* Incident X-Ray Beam */}
        <line x1={srcX} y1={srcY} x2={cx} y2={cy} stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
        <rect x={srcX - 8} y={srcY - 6} width="16" height="10" rx="2" fill="#0e7490" stroke="#22d3ee" strokeWidth="1" />
        <text x={srcX} y={srcY - 9} textAnchor="middle" className="fill-cyan-300 font-mono text-[7px] font-bold">
          Cu Kα
        </text>

        {/* Diffracted X-Ray Beam */}
        <line x1={cx} y1={cy} x2={detX} y2={detY} stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        <rect x={detX - 8} y={detY - 6} width="16" height="10" rx="2" fill="#4c1d95" stroke="#a78bfa" strokeWidth="1" />
        <text x={detX} y={detY - 9} textAnchor="middle" className="fill-violet-300 font-mono text-[7px] font-bold">
          DET (2θ)
        </text>

        {/* Center Specular Normal */}
        <line x1={cx} y1={cy - 48} x2={cx} y2={cy} stroke="#334155" strokeWidth="0.9" strokeDasharray="2 2" />

        {/* Mini Isometric Unit Cell Corner Inset */}
        <g transform="translate(178, 108)">
          <polygon
            points={
              isTetragonal
                ? '18,2 32,8 32,36 18,42 4,36 4,8'
                : '18,6 32,13 32,31 18,38 4,31 4,13'
            }
            fill="#6366f1"
            fillOpacity="0.14"
            stroke="#818cf8"
            strokeWidth="1.2"
          />
          <polyline
            points={isTetragonal ? '4,8 18,14 32,8' : '4,13 18,20 32,13'}
            stroke="#22d3ee"
            strokeWidth="1"
            fill="none"
          />
          <line
            x1="18"
            y1={isTetragonal ? '14' : '20'}
            x2="18"
            y2={isTetragonal ? '42' : '38'}
            stroke="#22d3ee"
            strokeWidth="1"
          />
          <circle cx="18" cy={isTetragonal ? '24' : '22'} r="2.2" fill="#22d3ee" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Live Multi-Peak Diffraction Spectrum SVG for ExperimentQuickLaunchpad
 */
export const ExperimentPresetSpectrumGraphic: React.FC<{
  peaks: WelcomePeak[];
  formula: string;
  crystalSystem: string;
}> = ({ peaks, formula, crystalSystem }) => {
  const width = 340;
  const height = 92;
  const padX = 20;
  const padY = 18;
  const min2T = 15;
  const max2T = 65;

  const getX = (t: number) => padX + ((t - min2T) / (max2T - min2T)) * (width - padX * 2);
  const getY = (int: number) => height - padY - (int / 100) * (height - padY * 2);

  // Build continuous profile curve
  const pts: string[] = [];
  for (let t = min2T; t <= max2T; t += 0.4) {
    let yVal = 3;
    peaks.forEach(p => {
      const d = t - p.twoTheta;
      const w = Math.max(0.25, p.fwhm * 1.8);
      const g = Math.exp(-Math.LN2 * Math.pow(d / w, 2));
      const l = 1 / (1 + Math.pow(d / w, 2));
      yVal += p.intensity * (0.6 * g + 0.4 * l);
    });
    const clamped = Math.min(100, yVal);
    pts.push(`${pts.length === 0 ? 'M' : 'L'} ${getX(t).toFixed(1)} ${getY(clamped).toFixed(1)}`);
  }
  const pathStr = pts.join(' ');

  return (
    <div className="bg-[#050914] border border-slate-800/90 rounded-xl p-2.5 space-y-1">
      <div className="flex items-center justify-between text-[9.5px] font-mono">
        <span className="text-cyan-300 font-bold">{formula} Simulated Profile</span>
        <span className="text-slate-500">{crystalSystem}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible select-none">
        <defs>
          <linearGradient id="presetSpecFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[20, 30, 40, 50, 60].map(deg => (
          <g key={deg}>
            <line
              x1={getX(deg)}
              y1={10}
              x2={getX(deg)}
              y2={height - padY}
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <text
              x={getX(deg)}
              y={height - 4}
              textAnchor="middle"
              className="fill-slate-500 font-mono text-[7.5px]"
            >
              {deg}°
            </text>
          </g>
        ))}

        <path
          d={`${pathStr} L ${getX(max2T)} ${getY(0)} L ${getX(min2T)} ${getY(0)} Z`}
          fill="url(#presetSpecFill)"
        />
        <path d={pathStr} fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" />

        {peaks.map((pk, idx) => {
          const px = getX(pk.twoTheta);
          const py = getY(pk.intensity);
          return (
            <g key={idx}>
              <circle cx={px} cy={py} r="2.8" fill="#67e8f9" stroke="#090d16" strokeWidth="0.8" />
              <text
                x={px}
                y={py - 5}
                textAnchor="middle"
                className="fill-cyan-200 font-mono text-[7.5px] font-bold"
              >
                {pk.hkl}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Custom Vector Pipeline Header Graphic for WorkflowsSection
 */
export const WorkflowPipelineDiagramSVG: React.FC<{
  workflowId: string;
}> = ({ workflowId }) => {
  if (workflowId === 'powder_analysis') {
    return (
      <svg viewBox="0 0 240 44" className="w-full h-11 bg-[#040812] rounded-xl border border-violet-500/20 p-1.5 mb-4 select-none">
        {/* Raw pattern -> Scherrer peak -> WH linear plot */}
        <path d="M 10 34 L 22 34 L 26 12 L 30 34 L 44 34 L 48 20 L 52 34 L 66 34" fill="none" stroke="#a78bfa" strokeWidth="1.6" />
        <line x1="78" y1="22" x2="96" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
        <path d="M 108 34 Q 124 8 140 34" fill="#22d3ee" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="1.6" />
        <line x1="152" y1="22" x2="170" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="182" y1="32" x2="226" y2="12" stroke="#34d399" strokeWidth="1.8" />
        <circle cx="190" cy="28" r="2" fill="#34d399" />
        <circle cx="205" cy="21" r="2" fill="#34d399" />
        <circle cx="220" cy="15" r="2" fill="#34d399" />
      </svg>
    );
  }
  if (workflowId === 'crystal_modeling') {
    return (
      <svg viewBox="0 0 240 44" className="w-full h-11 bg-[#040812] rounded-xl border border-cyan-500/20 p-1.5 mb-4 select-none">
        {/* 3D Unit cell -> Bragg planes -> Reciprocal metric */}
        <polygon points="28,6 44,14 44,30 28,38 12,30 12,14" fill="#22d3ee" fillOpacity="0.15" stroke="#22d3ee" strokeWidth="1.4" />
        <line x1="28" y1="22" x2="28" y2="38" stroke="#22d3ee" strokeWidth="1.1" />
        <line x1="60" y1="22" x2="80" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="94" y1="16" x2="138" y2="16" stroke="#818cf8" strokeWidth="1.2" strokeDasharray="3 2" />
        <line x1="94" y1="28" x2="138" y2="28" stroke="#818cf8" strokeWidth="1.2" strokeDasharray="3 2" />
        <path d="M 98 6 L 116 16 L 134 6" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="152" y1="22" x2="172" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
        <circle cx="204" cy="22" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
        <circle cx="204" cy="22" r="2.5" fill="#22d3ee" />
        <circle cx="212" cy="15" r="2" fill="#a78bfa" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 44" className="w-full h-11 bg-[#040812] rounded-xl border border-emerald-500/20 p-1.5 mb-4 select-none">
      {/* Kiessig oscillations -> sin^2(psi) tilt -> AI neural nodes */}
      <path d="M 10 12 Q 18 32 26 16 T 42 22 T 58 28 T 74 34" fill="none" stroke="#34d399" strokeWidth="1.6" />
      <line x1="86" y1="22" x2="104" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
      <line x1="114" y1="32" x2="154" y2="14" stroke="#22d3ee" strokeWidth="1.6" />
      <circle cx="122" cy="28" r="2" fill="#22d3ee" />
      <circle cx="136" cy="22" r="2" fill="#22d3ee" />
      <circle cx="148" cy="17" r="2" fill="#22d3ee" />
      <line x1="166" y1="22" x2="184" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
      <circle cx="196" cy="14" r="2.5" fill="#a78bfa" />
      <circle cx="196" cy="30" r="2.5" fill="#a78bfa" />
      <circle cx="222" cy="22" r="3" fill="#34d399" />
      <line x1="198" y1="14" x2="220" y2="22" stroke="#818cf8" strokeWidth="1.1" />
      <line x1="198" y1="30" x2="220" y2="22" stroke="#818cf8" strokeWidth="1.1" />
    </svg>
  );
};
