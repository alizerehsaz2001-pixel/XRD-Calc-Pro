import React, { useState } from 'react';
import { Disc3, Sliders, Info } from 'lucide-react';
import { simulateTexturedDebyeRings, PreferredOrientationReflection } from '../../utils/preferredOrientationPhysics';

interface TextureDebyeRingVisualizerProps {
  reflections: PreferredOrientationReflection[];
  rValue: number;
  fraction: number;
}

export const TextureDebyeRingVisualizer: React.FC<TextureDebyeRingVisualizerProps> = ({
  reflections,
  rValue,
  fraction
}) => {
  const [sampleTiltChi, setSampleTiltChi] = useState<number>(30);
  const ringSimulations = simulateTexturedDebyeRings(reflections, rValue, fraction, 150, sampleTiltChi);

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-amber-400/30 transition-all rounded-[2rem] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20 shadow-inner">
              <Disc3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest font-sans">
              2D Area Detector Frame
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-500">Tilt χ:</span>
            <input
              type="range"
              min="0"
              max="75"
              step="5"
              value={sampleTiltChi}
              onChange={(e) => setSampleTiltChi(parseFloat(e.target.value))}
              className="w-16 accent-amber-500 h-1 bg-slate-200 dark:bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400">{sampleTiltChi}°</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">
          <span>Debye-Scherrer Intensity Arcs</span>
          <span>Azimuth γ (0°–360°)</span>
        </div>
      </div>

      {/* 2D Detector Frame Canvas */}
      <div className="flex justify-center items-center py-4 bg-slate-900 rounded-[2rem] border border-slate-800 relative shadow-inner my-auto select-none">
        <svg width="210" height="210" className="overflow-visible filter drop-shadow-md">
          {/* Beamstop in Center */}
          <circle cx="105" cy="105" r="95" fill="none" stroke="rgba(255,255,255,0.05)" />
          <circle cx="105" cy="105" r="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="105" y1="105" x2="105" y2="200" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.8" />

          {/* Simulated Debye-Scherrer textured rings */}
          {ringSimulations.map((ring, rIdx) => {
            const scaledRadius = Math.max(15, Math.min(85, 20 + rIdx * 18));

            return (
              <g key={rIdx}>
                {ring.points.map((pt, pIdx) => {
                  const rad = (pt.gammaDeg * Math.PI) / 180;
                  const x = 105 + scaledRadius * Math.sin(rad);
                  const y = 105 - scaledRadius * Math.cos(rad);
                  const opacity = Math.max(0.1, Math.min(1.0, pt.intensity / 150));
                  const isArcPeak = pt.intensity > 120;

                  return (
                    <circle
                      key={pIdx}
                      cx={x}
                      cy={y}
                      r={isArcPeak ? 2.2 : 1.2}
                      fill={isArcPeak ? "#fbbf24" : "#f59e0b"}
                      opacity={opacity}
                    />
                  );
                })}
                {/* Ring Label */}
                <text
                  x={105 + scaledRadius + 4}
                  y={105}
                  fill="#94a3b8"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {ring.hkl}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-[10px] text-slate-500 font-sans text-center flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3 text-amber-500" />
        Spotty/crescent arcs along azimuth γ reveal strong fiber texture under sample tilt.
      </div>
    </div>
  );
};
