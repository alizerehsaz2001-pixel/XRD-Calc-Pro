import React from 'react';
import { Triangle, Info } from 'lucide-react';
import { generateIPFTrianglePoints, CrystalSystemType } from '../../utils/preferredOrientationPhysics';

interface TextureIPFTriangleVisualizerProps {
  rValue: number;
  fraction: number;
  crystalSystem: CrystalSystemType;
  primaryAxis: string;
}

export const TextureIPFTriangleVisualizer: React.FC<TextureIPFTriangleVisualizerProps> = ({
  rValue,
  fraction,
  crystalSystem,
  primaryAxis
}) => {
  const ipfPoints = generateIPFTrianglePoints(crystalSystem, rValue, fraction, primaryAxis);

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-cyan-400/30 transition-all rounded-[2rem] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg border border-cyan-200 dark:border-cyan-500/20 shadow-inner">
              <Triangle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest font-sans">
              Inverse Pole Figure (IPF)
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40">
            Sample Normal (ND)
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">
          <span>Stereographic Fundamental Triangle</span>
          <span>Symmetry: {crystalSystem}</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex justify-center items-center py-4 bg-white dark:bg-black/60 rounded-[2rem] border border-slate-200 dark:border-white/5 relative shadow-inner my-auto select-none">
        <svg width="210" height="210" className="overflow-visible filter drop-shadow-md">
          {/* Stereographic Triangle Bounds */}
          {/* [001] at (25, 175), [101] at (185, 175), [111] at (185, 25) */}
          <path
            d="M 25 175 L 185 175 A 160 160 0 0 1 185 25 A 226 226 0 0 0 25 175 Z"
            fill="rgba(6, 182, 212, 0.05)"
            stroke="rgba(6, 182, 212, 0.5)"
            strokeWidth="1.5"
          />

          {/* Internal Grid Arcs */}
          <path d="M 25 175 L 140 100" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="2 3" />
          <path d="M 185 175 L 105 100" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="2 3" />

          {/* Corner Node Poles */}
          <circle cx="25" cy="175" r="4.5" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
          <text x="25" y="195" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">[001]</text>

          <circle cx="185" cy="175" r="4.5" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
          <text x="195" y="195" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">[101]</text>

          <circle cx="185" cy="25" r="4.5" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
          <text x="195" y="22" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">[111]</text>

          {/* IPF Intermediate Texture Density Nodes */}
          {ipfPoints.map((pt, idx) => {
            const svgX = 25 + pt.x * 160;
            const svgY = 175 - pt.y * 150;
            const nodeRadius = Math.max(3, Math.min(10, 3 + pt.intensityMUD * 3));
            const isHigh = pt.intensityMUD > 1.2;

            return (
              <g key={idx}>
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={nodeRadius}
                  fill={isHigh ? "#22d3ee" : "rgba(100, 116, 139, 0.4)"}
                  stroke={isHigh ? "#0891b2" : "none"}
                  strokeWidth="1.5"
                  opacity={Math.min(1, 0.4 + pt.intensityMUD * 0.3)}
                />
                <text
                  x={svgX}
                  y={svgY - nodeRadius - 3}
                  fill="#94a3b8"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pt.hkl} ({pt.intensityMUD.toFixed(1)})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-[10px] text-slate-500 font-sans text-center flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3 text-cyan-500" />
        Represents sample normal alignment across the standard stereographic triangle.
      </div>
    </div>
  );
};
