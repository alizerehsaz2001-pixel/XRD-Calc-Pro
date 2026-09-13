import React, { useState } from 'react';
import { Sparkles, Info, Filter } from 'lucide-react';

export interface TheoreticalReflection {
  h: number;
  k: number;
  l: number;
  hkl: string;
  millerBravais?: string;
  d: number;
  twoTheta: number;
  multiplicity: number;
  allowed: boolean;
  relIntensity: number;
  q: number;
  lpFactor: number;
}

interface Props {
  reflections: TheoreticalReflection[];
  selectedHkl: string;
  onSelectReflection: (ref: TheoreticalReflection) => void;
  anodeName: string;
  lambda: number;
  className?: string;
}

export const StickSpectrumChart: React.FC<Props> = ({
  reflections,
  selectedHkl,
  onSelectReflection,
  anodeName,
  lambda,
  className = '',
}) => {
  const [hoveredRef, setHoveredRef] = useState<TheoreticalReflection | null>(null);
  const [showExtinct, setShowExtinct] = useState(false);

  // Filter allowed or all
  const filtered = reflections.filter((r) => showExtinct || r.allowed);

  const min2T = 10;
  const max2T = 110;

  return (
    <div className={`p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-4 shadow-xl ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider block">
            Theoretical Powder Diffractogram Stick Spectrum
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Source: {anodeName} (λ = {lambda.toFixed(4)} Å) · Lorentz-Polarization & Multiplicity Weighted
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExtinct(!showExtinct)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
              showExtinct
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {showExtinct ? 'Showing All (incl. Extinct)' : 'Hiding Extinct Peaks'}
          </button>
        </div>
      </div>

      {/* SVG Stick Spectrum Canvas */}
      <div className="relative bg-[#02050D] p-4 rounded-xl border border-slate-800/90 overflow-hidden">
        <svg viewBox="0 0 700 240" className="w-full h-[220px] select-none">
          {/* Background Grid Lines */}
          {[20, 40, 60, 80, 100].map((t) => {
            const x = 50 + ((t - min2T) / (max2T - min2T)) * 620;
            return (
              <g key={`grid-${t}`}>
                <line x1={x} y1={20} x2={x} y2={190} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={x} y={205} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {t}°
                </text>
              </g>
            );
          })}

          {/* Intensity Grid lines (25%, 50%, 75%, 100%) */}
          {[25, 50, 75, 100].map((pct) => {
            const y = 190 - (pct / 100) * 160;
            return (
              <g key={`int-${pct}`}>
                <line x1={50} y1={y} x2={670} y2={y} stroke="#1e293b" strokeDasharray="2 2" />
                <text x={42} y={y + 3} fill="#475569" fontSize="9" fontFamily="monospace" textAnchor="end">
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Baseline axis */}
          <line x1={50} y1={190} x2={670} y2={190} stroke="#475569" strokeWidth="1.5" />
          <line x1={50} y1={20} x2={50} y2={190} stroke="#475569" strokeWidth="1.5" />

          {/* Axis Labels */}
          <text x={360} y={225} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Diffraction Angle 2θ (degrees)
          </text>
          <text x={18} y={105} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 18 105)">
            Relative Intensity I / I₀ (%)
          </text>

          {/* Diffraction Sticks */}
          {filtered.map((ref, idx) => {
            if (ref.twoTheta < min2T || ref.twoTheta > max2T) return null;
            const x = 50 + ((ref.twoTheta - min2T) / (max2T - min2T)) * 620;
            const stickHeight = Math.max(8, (ref.relIntensity / 100) * 160);
            const yTop = 190 - stickHeight;
            const isSelected = selectedHkl === ref.hkl;
            const isHovered = hoveredRef?.hkl === ref.hkl;

            const strokeColor = !ref.allowed
              ? '#f43f5e'
              : isSelected
              ? '#22d3ee'
              : isHovered
              ? '#38bdf8'
              : '#818cf8';

            return (
              <g
                key={`stick-${idx}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectReflection(ref)}
                onMouseEnter={() => setHoveredRef(ref)}
                onMouseLeave={() => setHoveredRef(null)}
              >
                {/* Wider invisible hit area */}
                <line x1={x} y1={20} x2={x} y2={190} stroke="transparent" strokeWidth="14" />

                {/* Main Stick */}
                <line
                  x1={x}
                  y1={190}
                  x2={x}
                  y2={yTop}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeDasharray={!ref.allowed ? '3 2' : undefined}
                />

                {/* Top cap / dot */}
                <circle
                  cx={x}
                  cy={yTop}
                  r={isSelected ? 4 : 2.5}
                  fill={strokeColor}
                  stroke="#02050D"
                  strokeWidth={1}
                />

                {/* (hkl) Text Label above major peaks */}
                {(ref.relIntensity >= 15 || isSelected || isHovered) && (
                  <text
                    x={x}
                    y={yTop - 6}
                    fill={isSelected ? '#22d3ee' : isHovered ? '#38bdf8' : '#cbd5e1'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {ref.hkl}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / Selection Information Floating Pill */}
        {hoveredRef && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-cyan-500/40 text-xs font-mono text-cyan-200 flex items-center gap-3 shadow-lg animate-in fade-in">
            <span className="font-black text-rose-400">{hoveredRef.hkl}</span>
            <span>2θ: <b className="text-white">{hoveredRef.twoTheta.toFixed(2)}°</b></span>
            <span>d: <b className="text-emerald-400">{hoveredRef.d.toFixed(4)} Å</b></span>
            <span>I/I₀: <b className="text-cyan-300">{hoveredRef.relIntensity}%</b></span>
            <span>m: <b className="text-amber-300">{hoveredRef.multiplicity}</b></span>
          </div>
        )}
      </div>
    </div>
  );
};
