import React from 'react';
import { Compass, Waves } from 'lucide-react';

interface BraggCadSchematicProps {
  wavelength: number;
  activeTwoTheta: number;
  activeDSpacing: number;
  activeQVector: number;
  activeHkl?: string;
  crystalSystem: string;
  reflectionCount: number;
}

export const BraggCadSchematic: React.FC<BraggCadSchematicProps> = ({
  wavelength,
  activeTwoTheta,
  activeDSpacing,
  activeQVector,
  activeHkl,
  crystalSystem,
  reflectionCount,
}) => {
  const thetaDeg = Math.max(5, Math.min(82, activeTwoTheta / 2));
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const energyKeV = wavelength > 0 ? 12.39842 / wavelength : 0;
  const ewaldDMin = wavelength / 2;
  const sinTheta = Math.sin(thetaRad);

  // Ray endpoints in SVG viewBox (0..380 x 0..145)
  const cx = 190;
  const plane1Y = 74;
  const plane2Y = 104;
  const rayLen = 84;

  const srcX = cx - rayLen * Math.cos(thetaRad);
  const srcY = plane1Y - rayLen * Math.sin(thetaRad);
  const detX = cx + rayLen * Math.cos(thetaRad);
  const detY = plane1Y - rayLen * Math.sin(thetaRad);

  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const gap = plane2Y - plane1Y;
  const pLeftX = cx - gap * sinT * cosT;
  const pLeftY = plane1Y + gap * cosT * cosT;
  const pRightX = cx + gap * sinT * cosT;
  const pRightY = pLeftY;

  return (
    <div className="bg-[#070A12] border border-slate-800 rounded-sm overflow-hidden">
      {/* Top CAD Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B0F19] border-b border-slate-800 text-[10px] font-mono">
        <span className="text-cyan-400 font-bold flex items-center gap-1.5">
          <Compass className="w-3 h-3" />
          EWALD &amp; BRAGG KINEMATICS CAD
        </span>
        <span className="text-slate-400 tabular-nums">
          nλ = 2d·sinθ · λ = {wavelength.toFixed(4)} Å ({energyKeV.toFixed(2)} keV)
        </span>
      </div>

      {/* Main SVG Schematic */}
      <div className="p-2.5 bg-[#070A12]">
        <svg viewBox="0 0 380 140" className="w-full h-36 select-none">
          {/* Coordinate Grid */}
          <line x1="20" y1={plane1Y} x2="360" y2={plane1Y} stroke="#334155" strokeWidth="1.2" />
          <line x1="20" y1={plane2Y} x2="360" y2={plane2Y} stroke="#334155" strokeWidth="1.2" />
          <line x1="20" y1={plane2Y + 24} x2="360" y2={plane2Y + 24} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

          {/* Lattice Nodes */}
          {[50, 96, 143, 190, 237, 284, 330].map((ax) => (
            <g key={ax}>
              <circle cx={ax} cy={plane1Y} r="3" fill="#0B0F19" stroke="#22D3EE" strokeWidth="1.4" />
              <circle cx={ax} cy={plane2Y} r="3" fill="#0B0F19" stroke="#10B981" strokeWidth="1.4" />
            </g>
          ))}

          {/* Normal Vector */}
          <line x1={cx} y1="12" x2={cx} y2="128" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />

          {/* Top Beam (k_0 -> k) */}
          <line x1={srcX} y1={srcY} x2={cx} y2={plane1Y} stroke="#22D3EE" strokeWidth="2" />
          <line x1={cx} y1={plane1Y} x2={detX} y2={detY} stroke="#22D3EE" strokeWidth="2" />

          {/* Lower Plane Beam */}
          <line x1={srcX} y1={srcY + gap} x2={cx} y2={plane2Y} stroke="#38BDF8" strokeWidth="1.3" strokeDasharray="4 2" />
          <line x1={cx} y1={plane2Y} x2={detX} y2={detY + gap} stroke="#38BDF8" strokeWidth="1.3" strokeDasharray="4 2" />

          {/* Path Retardation Δ = 2d sinθ Triangle */}
          <polygon
            points={`${cx},${plane1Y} ${pLeftX},${pLeftY} ${cx},${plane2Y} ${pRightX},${pRightY}`}
            fill="#F59E0B"
            fillOpacity="0.22"
            stroke="#F59E0B"
            strokeWidth="1.1"
          />

          {/* Interplanar d Callout */}
          <line x1="32" y1={plane1Y} x2="32" y2={plane2Y} stroke="#10B981" strokeWidth="1.4" />
          <text x="38" y={(plane1Y + plane2Y) / 2 + 3} fill="#10B981" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            d = {activeDSpacing.toFixed(3)} Å
          </text>

          {/* Angle Labels */}
          <text x={srcX} y={Math.max(12, srcY - 5)} fill="#38BDF8" fontSize="8" fontFamily="JetBrains Mono, monospace">
            k₀ (θ = {thetaDeg.toFixed(1)}°)
          </text>
          <text x={detX} y={Math.max(12, detY - 5)} textAnchor="end" fill="#22D3EE" fontSize="8" fontFamily="JetBrains Mono, monospace">
            k (2θ = {activeTwoTheta.toFixed(2)}°)
          </text>

          {/* Momentum Transfer Q Callout */}
          <text x={cx + 5} y="22" fill="#F43F5E" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            Q = {activeQVector.toFixed(3)} Å⁻¹
          </text>
        </svg>
      </div>

      {/* Bottom Telemetry Matrix */}
      <div className="grid grid-cols-4 divide-x divide-slate-800 border-t border-slate-800 bg-[#0B0F19] text-[10px] font-mono">
        <div className="px-2.5 py-1.5">
          <span className="text-slate-500 block">ACTIVE (HKL)</span>
          <span className="text-white font-bold">({activeHkl || '—'})</span>
        </div>
        <div className="px-2.5 py-1.5">
          <span className="text-slate-500 block">SYSTEM</span>
          <span className="text-cyan-400 font-bold">{crystalSystem}</span>
        </div>
        <div className="px-2.5 py-1.5">
          <span className="text-slate-500 block">SIN(θ)</span>
          <span className="text-emerald-400 font-bold tabular-nums">{sinTheta.toFixed(4)}</span>
        </div>
        <div className="px-2.5 py-1.5">
          <span className="text-slate-500 block">d_min (λ/2)</span>
          <span className="text-amber-300 font-bold tabular-nums">{ewaldDMin.toFixed(3)} Å</span>
        </div>
      </div>
    </div>
  );
};
