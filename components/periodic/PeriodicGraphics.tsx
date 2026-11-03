import React from 'react';
import { CrystalElement } from './types';

/**
 * Computes exact ground-state electron shell populations [K, L, M, N, O, P, Q] for Z = 1..118
 */
export function getElectronShellPopulations(Z: number): number[] {
  // Subshell filling order with capacities: [n, capacity]
  // Standard Madelung rule with key d/f exceptions handled
  const subshells: [number, number][] = [
    [1, 2],  // 1s
    [2, 2],  // 2s
    [2, 6],  // 2p
    [3, 2],  // 3s
    [3, 6],  // 3p
    [4, 2],  // 4s
    [3, 10], // 3d
    [4, 6],  // 4p
    [5, 2],  // 5s
    [4, 10], // 4d
    [5, 6],  // 5p
    [6, 2],  // 6s
    [4, 14], // 4f
    [5, 10], // 5d
    [6, 6],  // 6p
    [7, 2],  // 7s
    [5, 14], // 5f
    [6, 10], // 6d
    [7, 6]   // 7p
  ];

  const shells = [0, 0, 0, 0, 0, 0, 0];
  let rem = Math.max(1, Math.min(118, Math.round(Z)));

  for (const [n, cap] of subshells) {
    if (rem <= 0) break;
    const take = Math.min(rem, cap);
    shells[n - 1] += take;
    rem -= take;
  }

  // Known Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au outer-shell adjustments
  const exceptions: Record<number, number[]> = {
    24: [2, 8, 13, 1],          // Cr
    29: [2, 8, 18, 1],          // Cu
    41: [2, 8, 18, 12, 1],      // Nb
    42: [2, 8, 18, 13, 1],      // Mo
    44: [2, 8, 18, 15, 1],      // Ru
    45: [2, 8, 18, 16, 1],      // Rh
    46: [2, 8, 18, 18],         // Pd
    47: [2, 8, 18, 18, 1],      // Ag
    78: [2, 8, 18, 32, 17, 1],  // Pt
    79: [2, 8, 18, 32, 18, 1]   // Au
  };

  if (exceptions[Z]) {
    return exceptions[Z];
  }

  return shells.filter(c => c > 0);
}

/**
 * Miniature Isometric Unit Cell Glyph for Element Tiles, Legends, and Headers
 */
export const MicroLatticeGlyph: React.FC<{
  structure: CrystalElement['crystalStructure'] | string;
  size?: number;
  className?: string;
}> = ({ structure, size = 14, className = '' }) => {
  const s = structure || 'FCC';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {s === 'HCP' || s === 'Hexagonal' ? (
        <>
          {/* Hexagonal Prism */}
          <polygon
            points="12,2 20,5.5 20,18.5 12,22 4,18.5 4,5.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeOpacity="0.85"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <polyline
            points="4,5.5 12,9 20,5.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeOpacity="0.7"
          />
          <line x1="12" y1="9" x2="12" y2="22" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.7" />
          {/* HCP mid-plane triad nodes */}
          {s === 'HCP' && (
            <>
              <circle cx="9" cy="13" r="1.7" fill="currentColor" />
              <circle cx="15" cy="13" r="1.7" fill="currentColor" />
              <circle cx="12" cy="15.5" r="1.7" fill="currentColor" />
            </>
          )}
        </>
      ) : s === 'Rhombohedral' || s === 'Monoclinic' ? (
        <>
          {/* Oblique / Rhombohedral tilted prism */}
          <polygon
            points="8,3 21,3 17,14 4,14"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <polygon
            points="6,10 19,10 15,21 2,21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.75"
          />
          <line x1="8" y1="3" x2="6" y2="10" stroke="currentColor" strokeWidth="1.3" />
          <line x1="21" y1="3" x2="19" y2="10" stroke="currentColor" strokeWidth="1.3" />
          <line x1="17" y1="14" x2="15" y2="21" stroke="currentColor" strokeWidth="1.3" />
          <line x1="4" y1="14" x2="2" y2="21" stroke="currentColor" strokeWidth="1.3" />
        </>
      ) : (
        <>
          {/* Isometric Cube / Orthorhombic / Tetragonal Box */}
          <polygon
            points="12,2.5 20.5,7 20.5,17 12,21.5 3.5,17 3.5,7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeOpacity="0.85"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <polyline
            points="3.5,7 12,11.5 20.5,7"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeOpacity="0.65"
          />
          <line x1="12" y1="11.5" x2="12" y2="21.5" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.65" />

          {/* Internal centering atoms */}
          {s === 'BCC' && (
            <>
              <line x1="3.5" y1="7" x2="20.5" y2="17" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.5 1.5" strokeOpacity="0.5" />
              <line x1="20.5" y1="7" x2="3.5" y2="17" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.5 1.5" strokeOpacity="0.5" />
              <circle cx="12" cy="12" r="2.6" fill="currentColor" />
            </>
          )}
          {s === 'FCC' && (
            <>
              <circle cx="12" cy="7" r="1.8" fill="currentColor" />
              <circle cx="7.8" cy="14.2" r="1.8" fill="currentColor" />
              <circle cx="16.2" cy="14.2" r="1.8" fill="currentColor" />
            </>
          )}
          {s === 'Diamond' && (
            <>
              <line x1="12" y1="12" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.3" />
              <line x1="12" y1="12" x2="7.5" y2="15" stroke="currentColor" strokeWidth="1.3" />
              <line x1="12" y1="12" x2="16.5" y2="15" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="12" cy="12" r="2.1" fill="currentColor" />
              <circle cx="12" cy="6.5" r="1.4" fill="currentColor" />
              <circle cx="7.5" cy="15" r="1.4" fill="currentColor" />
              <circle cx="16.5" cy="15" r="1.4" fill="currentColor" />
            </>
          )}
        </>
      )}
    </svg>
  );
};

/**
 * Phase State Micro Glyph (Solid Cube, Liquid Droplet, Gas Ring)
 */
export const PhaseStateGlyph: React.FC<{
  state: 'solid' | 'liquid' | 'gas';
  size?: number;
}> = ({ state, size = 9 }) => {
  if (state === 'liquid') {
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className="text-sky-400 shrink-0">
        <path
          d="M6 1.2C6 1.2 2.2 5.4 2.2 7.8C2.2 9.9 3.9 11 6 11C8.1 11 9.8 9.9 9.8 7.8C9.8 5.4 6 1.2 6 1.2Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
      </svg>
    );
  }
  if (state === 'gas') {
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className="text-rose-400 shrink-0">
        <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className="text-emerald-400/90 shrink-0">
      <rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1.5" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
};

/**
 * 2D Concentric Bohr-Sommerfeld Electron Shell Diagram
 */
export const ElectronShellRingGraphic: React.FC<{
  atomicNumber: number;
  symbol: string;
  size?: number;
}> = ({ atomicNumber, symbol, size = 112 }) => {
  const shells = getElectronShellPopulations(atomicNumber);
  const numShells = shells.length;
  const cx = size / 2;
  const cy = size / 2;
  const minR = size * 0.16;
  const maxR = size * 0.45;
  const stepR = numShells > 1 ? (maxR - minR) / (numShells - 1) : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        <defs>
          <radialGradient id={`nucleus-glow-${atomicNumber}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle radial glow */}
        <circle cx={cx} cy={cy} r={maxR + 4} fill={`url(#nucleus-glow-${atomicNumber})`} />

        {/* Concentric Shells & Electrons */}
        {shells.map((elecCount, sIdx) => {
          const r = numShells === 1 ? (minR + maxR) * 0.55 : minR + sIdx * stepR;
          const isValence = sIdx === numShells - 1;
          return (
            <g key={`shell-${sIdx}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={isValence ? '#22d3ee' : '#334155'}
                strokeWidth={isValence ? 1.1 : 0.75}
                strokeDasharray={isValence ? undefined : '2 2'}
                strokeOpacity={isValence ? 0.85 : 0.65}
              />
              {Array.from({ length: elecCount }, (_, eIdx) => {
                const angle = (eIdx / elecCount) * 2 * Math.PI - Math.PI / 2;
                const ex = cx + r * Math.cos(angle);
                const ey = cy + r * Math.sin(angle);
                return (
                  <circle
                    key={`e-${sIdx}-${eIdx}`}
                    cx={ex}
                    cy={ey}
                    r={isValence ? 2.2 : 1.45}
                    fill={isValence ? '#22d3ee' : '#94a3b8'}
                    stroke="#090d16"
                    strokeWidth="0.6"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Central Nucleus Badge */}
        <circle cx={cx} cy={cy} r={size * 0.11} fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.2" />
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          className="fill-white font-mono font-black text-[9px]"
        >
          {symbol}
        </text>
      </svg>

      {/* Shell Population Readout Strip */}
      <div className="text-[8.5px] font-mono text-slate-400 tracking-tighter flex items-center gap-0.5 mt-0.5 tabular-nums">
        <span className="text-slate-500">Shells:</span>
        {shells.map((cnt, idx) => (
          <React.Fragment key={idx}>
            <span className={idx === shells.length - 1 ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
              {cnt}
            </span>
            {idx < shells.length - 1 && <span className="text-slate-600">·</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * Live Simulated Powder XRD Stick Pattern for any CrystalElement (Cu Kα = 1.5406 Å)
 */
export const LiveMiniXrdStickPattern: React.FC<{
  element: CrystalElement;
}> = ({ element }) => {
  const lambda = 1.5406; // Cu K-alpha
  const a = element.a || 4.0;
  const c = element.c || a * 1.633;
  const struct = element.crystalStructure;

  // Candidate hkl sets with relative structure factor + multiplicity weights
  const hklCandidates: { label: string; d: number; relI: number }[] = [];

  if (struct === 'FCC') {
    const planes: [number, number, number, number][] = [
      [1, 1, 1, 100],
      [2, 0, 0, 48],
      [2, 2, 0, 32],
      [3, 1, 1, 36],
      [2, 2, 2, 12]
    ];
    planes.forEach(([h, k, l, I]) => {
      const d = a / Math.sqrt(h * h + k * k + l * l);
      hklCandidates.push({ label: `${h}${k}${l}`, d, relI: I });
    });
  } else if (struct === 'BCC') {
    const planes: [number, number, number, number][] = [
      [1, 1, 0, 100],
      [2, 0, 0, 18],
      [2, 1, 1, 35],
      [2, 2, 0, 12],
      [3, 1, 0, 16]
    ];
    planes.forEach(([h, k, l, I]) => {
      const d = a / Math.sqrt(h * h + k * k + l * l);
      hklCandidates.push({ label: `${h}${k}${l}`, d, relI: I });
    });
  } else if (struct === 'Diamond') {
    const planes: [number, number, number, number][] = [
      [1, 1, 1, 100],
      [2, 2, 0, 55],
      [3, 1, 1, 30],
      [4, 0, 0, 8],
      [3, 3, 1, 14]
    ];
    planes.forEach(([h, k, l, I]) => {
      const d = a / Math.sqrt(h * h + k * k + l * l);
      hklCandidates.push({ label: `${h}${k}${l}`, d, relI: I });
    });
  } else if (struct === 'HCP' || struct === 'Hexagonal') {
    const planes: [number, number, number, number][] = [
      [1, 0, 0, 28],
      [0, 0, 2, 32],
      [1, 0, 1, 100],
      [1, 0, 2, 18],
      [1, 1, 0, 22]
    ];
    planes.forEach(([h, k, l, I]) => {
      const invD2 = (4 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l * l) / (c * c);
      const d = 1 / Math.sqrt(Math.max(0.001, invD2));
      hklCandidates.push({ label: `${h}${k}${l}`, d, relI: I });
    });
  } else {
    const planes: [number, number, number, number][] = [
      [1, 0, 0, 100],
      [1, 1, 0, 65],
      [1, 1, 1, 40],
      [2, 0, 0, 25],
      [2, 1, 0, 18]
    ];
    planes.forEach(([h, k, l, I]) => {
      const d = a / Math.sqrt(h * h + k * k + l * l);
      hklCandidates.push({ label: `${h}${k}${l}`, d, relI: I });
    });
  }

  const peaks = hklCandidates
    .map(p => {
      const sinTheta = lambda / (2 * p.d);
      if (sinTheta >= 0.995) return null;
      const twoTheta = (2 * Math.asin(sinTheta) * 180) / Math.PI;
      return { ...p, twoTheta };
    })
    .filter((p): p is { label: string; d: number; relI: number; twoTheta: number } => p !== null && p.twoTheta >= 10 && p.twoTheta <= 115);

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400">
        <span className="uppercase font-bold text-indigo-300">Cu Kα Bragg Stick Pattern</span>
        <span className="tabular-nums text-slate-500">2θ (10°–115°)</span>
      </div>
      <svg viewBox="0 0 220 56" className="w-full h-14 bg-[#060a12] rounded-lg border border-slate-800/90 overflow-visible">
        {/* Horizontal axis ticks */}
        {[20, 40, 60, 80, 100].map(deg => {
          const x = 10 + ((deg - 10) / 105) * 200;
          return (
            <g key={deg}>
              <line x1={x} y1={44} x2={x} y2={47} stroke="#334155" strokeWidth="0.8" />
              <text x={x} y={53} textAnchor="middle" className="fill-slate-600 font-mono text-[6.5px]">
                {deg}°
              </text>
            </g>
          );
        })}
        <line x1="8" y1="44" x2="212" y2="44" stroke="#334155" strokeWidth="1" />

        {/* Diffraction Peaks */}
        {peaks.map((pk, idx) => {
          const x = 10 + ((pk.twoTheta - 10) / 105) * 200;
          const barH = (pk.relI / 100) * 30;
          const yTop = 44 - barH;
          const isPrimary = pk.relI === 100;
          return (
            <g key={idx}>
              <line
                x1={x}
                y1={44}
                x2={x}
                y2={yTop}
                stroke={isPrimary ? '#22d3ee' : '#818cf8'}
                strokeWidth={isPrimary ? '2.2' : '1.5'}
                strokeLinecap="round"
              />
              <circle
                cx={x}
                cy={yTop}
                r={isPrimary ? 2.2 : 1.5}
                fill={isPrimary ? '#22d3ee' : '#818cf8'}
              />
              <text
                x={x}
                y={yTop - 3.5}
                textAnchor="middle"
                className={`font-mono text-[6.5px] font-bold ${isPrimary ? 'fill-cyan-300' : 'fill-indigo-300/80'}`}
              >
                ({pk.label})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Custom Scientific Header Schematic for the Periodic Table Suite
 */
export const PeriodicSuiteHeroGraphic: React.FC = () => {
  return (
    <svg width="150" height="44" viewBox="0 0 150 44" fill="none" className="hidden md:block shrink-0 select-none">
      {/* Miniature s, f, d, p Block Silhouette */}
      <g transform="translate(2, 6)">
        {/* s-block */}
        <rect x="0" y="0" width="8" height="28" rx="1.5" fill="#f59e0b" fillOpacity="0.22" stroke="#f59e0b" strokeWidth="1" />
        <text x="4" y="16" textAnchor="middle" className="fill-amber-300 font-mono text-[6.5px] font-bold">s</text>
        {/* d-block */}
        <rect x="10" y="10" width="22" height="18" rx="1.5" fill="#38bdf8" fillOpacity="0.22" stroke="#38bdf8" strokeWidth="1" />
        <text x="21" y="21" textAnchor="middle" className="fill-sky-300 font-mono text-[6.5px] font-bold">d</text>
        {/* p-block */}
        <rect x="34" y="4" width="14" height="24" rx="1.5" fill="#10b981" fillOpacity="0.22" stroke="#10b981" strokeWidth="1" />
        <text x="41" y="18" textAnchor="middle" className="fill-emerald-300 font-mono text-[6.5px] font-bold">p</text>
        {/* f-block */}
        <rect x="10" y="30" width="28" height="5" rx="1" fill="#ec4899" fillOpacity="0.25" stroke="#ec4899" strokeWidth="0.9" />
      </g>

      {/* Divider */}
      <line x1="60" y1="6" x2="60" y2="38" stroke="#1e293b" strokeWidth="1" />

      {/* Mini Bragg Lattice & Wave Vector */}
      <g transform="translate(70, 4)">
        <polygon
          points="18,3 31,10 31,26 18,33 5,26 5,10"
          fill="#6366f1"
          fillOpacity="0.14"
          stroke="#818cf8"
          strokeWidth="1.2"
        />
        <polyline points="5,10 18,17 31,10" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.7" />
        <line x1="18" y1="17" x2="18" y2="33" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.7" />
        <circle cx="18" cy="17" r="2.2" fill="#22d3ee" />
        {/* Diffracted ray */}
        <path d="M35,28 L46,16 L58,28" stroke="#34d399" strokeWidth="1.2" fill="none" />
        <line x1="35" y1="28" x2="58" y2="28" stroke="#475569" strokeWidth="1" strokeDasharray="2 1" />
        <text x="64" y="15" className="fill-cyan-300 font-mono text-[7px] font-bold">2d·sinθ</text>
        <text x="64" y="25" className="fill-slate-400 font-mono text-[6.5px]">Z=1..118</text>
      </g>
    </svg>
  );
};
