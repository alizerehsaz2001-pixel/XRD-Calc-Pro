import React from 'react';
import { Compass } from 'lucide-react';

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
  const safeWavelength = wavelength > 0 ? wavelength : 1.54056;
  const clampedTwoTheta = Math.max(8, Math.min(164, activeTwoTheta || 28.44));
  const thetaDeg = clampedTwoTheta / 2;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const twoThetaRad = (clampedTwoTheta * Math.PI) / 180;

  const energyKeV = 12.39842 / safeWavelength;
  const ewaldDMin = safeWavelength / 2;
  const sinTheta = Math.sin(thetaRad);
  const sinThetaOverLambda = sinTheta / safeWavelength;
  const safeDSpacing =
    Number.isFinite(activeDSpacing) && activeDSpacing > 0
      ? activeDSpacing
      : safeWavelength / (2 * Math.max(0.05, sinTheta));
  const safeQVector =
    Number.isFinite(activeQVector) && activeQVector > 0
      ? activeQVector
      : (4 * Math.PI * sinTheta) / safeWavelength;

  // --- Viewport A: Direct-Space Bragg Path-Retardation Geometry (x: 8..252, y: 8..162) ---
  const cx = 132;
  const planeGap = Math.max(20, Math.min(30, 14 + safeDSpacing * 4.2));
  const plane1Y = 88;
  const plane2Y = plane1Y + planeGap;
  const plane3Y = Math.min(148, plane2Y + planeGap);
  const rayLen = 64;

  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);

  const srcX = cx - rayLen * cosT;
  const srcY = plane1Y - rayLen * sinT;
  const detX = cx + rayLen * cosT;
  const detY = plane1Y - rayLen * sinT;

  // Perpendicular drop points for path retardation Δ = 2d·sinθ
  const pLeftX = cx - planeGap * sinT * cosT;
  const pLeftY = plane1Y + planeGap * cosT * cosT;
  const pRightX = cx + planeGap * sinT * cosT;
  const pRightY = pLeftY;

  // Wavefront ticks perpendicular to incident and diffracted rays
  const incidentPerpX = -sinT;
  const incidentPerpY = cosT;
  const diffractedPerpX = sinT;
  const diffractedPerpY = cosT;

  const waveFractions = [0.22, 0.44, 0.66, 0.86];

  // Angle arc for incident θ
  const arcR = 26;
  const arcStartX = cx - arcR;
  const arcStartY = plane1Y;
  const arcEndX = cx - arcR * cosT;
  const arcEndY = plane1Y - arcR * sinT;

  // --- Viewport B: Live Reciprocal-Space Ewald Sphere (x: 262..492, y: 8..162) ---
  // Center of Ewald sphere C, origin of reciprocal lattice O* on right rim (cx + R)
  const ewaldCx = 360;
  const ewaldCy = 92;
  const ewaldR = 44; // Represents 1/λ in viewport coordinates
  const originX = ewaldCx + ewaldR; // O* (000)
  const originY = ewaldCy;

  // Scattered wavevector k_f points from C at angle -2θ (counter-clockwise upward)
  const kfEndX = ewaldCx + ewaldR * Math.cos(-twoThetaRad);
  const kfEndY = ewaldCy + ewaldR * Math.sin(-twoThetaRad);

  // Small 2θ arc at Ewald center C
  const ewaldArcR = 16;
  const ewaldArcStartX = ewaldCx + ewaldArcR;
  const ewaldArcStartY = ewaldCy;
  const ewaldArcEndX = ewaldCx + ewaldArcR * Math.cos(-twoThetaRad);
  const ewaldArcEndY = ewaldCy + ewaldArcR * Math.sin(-twoThetaRad);
  const largeArcFlag = clampedTwoTheta > 180 ? 1 : 0;

  return (
    <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
      {/* Top CAD Calibration Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono">
        <span className="text-cyan-700 dark:text-cyan-400 font-semibold flex items-center gap-1.5 tracking-wider uppercase">
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span>Direct-Space &amp; Ewald Sphere Kinematics</span>
        </span>
        <span className="text-slate-600 dark:text-slate-400 tabular-nums">
          nλ = 2d·sinθ · λ = {safeWavelength.toFixed(4)} Å ({energyKeV.toFixed(2)} keV) · {reflectionCount} peaks
        </span>
      </div>

      {/* Dual-Viewport Precision Optical Canvas (calibrated dark optical plane for crisp beamline legibility in both themes) */}
      <div className="p-2 bg-[#070B14]">
        <svg viewBox="0 0 500 170" className="w-full h-auto select-none">
          <defs>
            <pattern id="braggCadSubGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f172a" strokeWidth="0.6" />
            </pattern>
            <pattern id="braggCadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="url(#braggCadSubGrid)" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.7" />
            </pattern>
            <clipPath id="braggViewportAClip">
              <rect x="8" y="22" width="244" height="128" />
            </clipPath>
            <clipPath id="braggViewportBClip">
              <rect x="260" y="22" width="232" height="128" />
            </clipPath>
            <marker
              id="braggArrCyan"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#22d3ee" />
            </marker>
            <marker
              id="braggArrAmber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
            </marker>
            <marker
              id="braggArrRose"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fb7185" />
            </marker>
          </defs>

          {/* Technical Grid Background */}
          <rect x="4" y="4" width="492" height="162" rx="4" fill="url(#braggCadGrid)" stroke="#1e293b" strokeWidth="1" />
          {/* Dual Viewport Divider */}
          <line x1="256" y1="10" x2="256" y2="160" stroke="#1e293b" strokeWidth="1" />

          {/* ================= VIEWPORT A: DIRECT SPACE ================= */}
          <text x="14" y="18" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            A · DIRECT SPACE ({activeHkl || 'hkl'}) PLANES
          </text>

          <g clipPath="url(#braggViewportAClip)">
          {/* Atomic Lattice Planes */}
          <line x1="16" y1={plane1Y} x2="244" y2={plane1Y} stroke="#475569" strokeWidth="1.1" />
          <line x1="16" y1={plane2Y} x2="244" y2={plane2Y} stroke="#475569" strokeWidth="1.1" />
          {plane3Y <= 152 && (
            <line x1="16" y1={plane3Y} x2="244" y2={plane3Y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* Lattice Nodes */}
          {[36, 68, 100, 132, 164, 196, 228].map((ax) => (
            <g key={ax}>
              <circle cx={ax} cy={plane1Y} r="2.8" fill="#070B14" stroke="#22d3ee" strokeWidth="1.3" />
              <circle cx={ax} cy={plane2Y} r="2.8" fill="#070B14" stroke="#10b981" strokeWidth="1.3" />
            </g>
          ))}

          {/* Surface Normal & Scattering Vector Q */}
          <line x1={cx} y1="26" x2={cx} y2={Math.min(156, plane2Y + 18)} stroke="#475569" strokeWidth="0.9" strokeDasharray="2 2" />
          <line x1={cx} y1={plane1Y} x2={cx} y2="30" stroke="#fb7185" strokeWidth="1.5" markerEnd="url(#braggArrRose)" />
          <text x={cx + 5} y="36" fill="#fda4af" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            Q
          </text>

          {/* Incident & Diffracted Beams (Top Plane) */}
          <line x1={srcX} y1={srcY} x2={cx} y2={plane1Y} stroke="#38bdf8" strokeWidth="1.8" />
          <line x1={cx} y1={plane1Y} x2={detX} y2={detY} stroke="#22d3ee" strokeWidth="1.8" markerEnd="url(#braggArrCyan)" />

          {/* Coherent Wavefront Crests */}
          {waveFractions.map((frac) => {
            const ix = srcX + (cx - srcX) * frac;
            const iy = srcY + (plane1Y - srcY) * frac;
            const dx = cx + (detX - cx) * frac;
            const dy = plane1Y + (detY - plane1Y) * frac;
            return (
              <g key={frac} opacity="0.55">
                <line
                  x1={ix - incidentPerpX * 4.5}
                  y1={iy - incidentPerpY * 4.5}
                  x2={ix + incidentPerpX * 4.5}
                  y2={iy + incidentPerpY * 4.5}
                  stroke="#7dd3fc"
                  strokeWidth="0.9"
                />
                <line
                  x1={dx - diffractedPerpX * 4.5}
                  y1={dy - diffractedPerpY * 4.5}
                  x2={dx + diffractedPerpX * 4.5}
                  y2={dy + diffractedPerpY * 4.5}
                  stroke="#67e8f9"
                  strokeWidth="0.9"
                />
              </g>
            );
          })}

          {/* Secondary Plane Ray */}
          <line
            x1={srcX}
            y1={srcY + planeGap}
            x2={cx}
            y2={plane2Y}
            stroke="#38bdf8"
            strokeWidth="1.15"
            strokeDasharray="3 2"
            opacity="0.8"
          />
          <line
            x1={cx}
            y1={plane2Y}
            x2={detX}
            y2={detY + planeGap}
            stroke="#22d3ee"
            strokeWidth="1.15"
            strokeDasharray="3 2"
            opacity="0.8"
          />

          {/* Path Retardation Δ = 2d·sinθ Polygon */}
          <polygon
            points={`${cx},${plane1Y} ${pLeftX},${pLeftY} ${cx},${plane2Y} ${pRightX},${pRightY}`}
            fill="#f59e0b"
            fillOpacity="0.22"
            stroke="#f59e0b"
            strokeWidth="1"
          />

          {/* Bragg Angle θ Arc */}
          <path
            d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1"
          />
          <text
            x={cx - arcR - 14}
            y={plane1Y - 5}
            fill="#7dd3fc"
            fontSize="7.5"
            fontFamily="JetBrains Mono, monospace"
          >
            θ={thetaDeg.toFixed(1)}°
          </text>

          {/* Interplanar Caliper Callout */}
          <line x1="22" y1={plane1Y} x2="22" y2={plane2Y} stroke="#10b981" strokeWidth="1.2" />
          <line x1="18" y1={plane1Y} x2="26" y2={plane1Y} stroke="#10b981" strokeWidth="1.2" />
          <line x1="18" y1={plane2Y} x2="26" y2={plane2Y} stroke="#10b981" strokeWidth="1.2" />
          <text
            x="29"
            y={(plane1Y + plane2Y) / 2 + 2.5}
            fill="#34d399"
            fontSize="7.5"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            d={safeDSpacing.toFixed(3)}Å
          </text>
          </g>

          {/* Direct-Space Bottom Legend */}
          <text x="14" y="159" fill="#94a3b8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
            Δ = 2d·sinθ = {(2 * safeDSpacing * sinTheta).toFixed(4)} Å (1λ)
          </text>

          {/* ================= VIEWPORT B: RECIPROCAL EWALD SPHERE ================= */}
          <text x="268" y="18" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            B · RECIPROCAL SPACE EWALD SPHERE (R = 1/λ)
          </text>

          <g clipPath="url(#braggViewportBClip)">
          {/* Subtle Reciprocal Lattice Points (h*, k*) */}
          {[-2, -1, 0, 1].map((ix) =>
            [-2, -1, 0, 1].map((iy) => {
              const rx = originX + ix * 24;
              const ry = originY + iy * 24;
              if (rx < 268 || rx > 486 || ry < 26 || ry > 152) return null;
              return <circle key={`${ix}-${iy}`} cx={rx} cy={ry} r="1.2" fill="#334155" />;
            })
          )}

          {/* Limiting Sphere Arc (2/λ radius centered at O*, clipped softly inside viewport) */}
          <circle
            cx={originX}
            cy={originY}
            r={ewaldR * 1.48}
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.9"
            strokeDasharray="2 3"
          />

          {/* Ewald Sphere (radius = 1/λ) */}
          <circle
            cx={ewaldCx}
            cy={ewaldCy}
            r={ewaldR}
            fill="rgba(34, 211, 238, 0.045)"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="4 2"
          />

          {/* Incident Wavevector k_i (C -> O*) */}
          <line
            x1={ewaldCx}
            y1={ewaldCy}
            x2={originX - 3}
            y2={originY}
            stroke="#38bdf8"
            strokeWidth="1.5"
            markerEnd="url(#braggArrCyan)"
          />

          {/* Diffracted Wavevector k_f (C -> P on Ewald sphere) */}
          <line
            x1={ewaldCx}
            y1={ewaldCy}
            x2={kfEndX}
            y2={kfEndY}
            stroke="#22d3ee"
            strokeWidth="1.6"
            markerEnd="url(#braggArrCyan)"
          />

          {/* Scattering Vector / Reciprocal Lattice Vector Q = g_hkl (O* -> P) */}
          <line
            x1={originX}
            y1={originY}
            x2={kfEndX}
            y2={kfEndY}
            stroke="#f59e0b"
            strokeWidth="1.7"
            markerEnd="url(#braggArrAmber)"
          />

          {/* 2θ Angle Arc at Ewald Center */}
          <path
            d={`M ${ewaldArcStartX} ${ewaldArcStartY} A ${ewaldArcR} ${ewaldArcR} 0 ${largeArcFlag} 0 ${ewaldArcEndX} ${ewaldArcEndY}`}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1"
          />
          <text
            x={ewaldCx + 19}
            y={ewaldCy - 5}
            fill="#67e8f9"
            fontSize="7"
            fontFamily="JetBrains Mono, monospace"
          >
            2θ={clampedTwoTheta.toFixed(1)}°
          </text>

          {/* Key Reciprocal Space Nodes: C, O*, and Active g_hkl */}
          <circle cx={ewaldCx} cy={ewaldCy} r="2.2" fill="#94a3b8" />
          <text x={ewaldCx - 9} y={ewaldCy + 11} fill="#94a3b8" fontSize="7" fontFamily="JetBrains Mono, monospace">
            C
          </text>

          <circle cx={originX} cy={originY} r="3" fill="#070B14" stroke="#94a3b8" strokeWidth="1.4" />
          <text x={originX + 5} y={originY + 3} fill="#cbd5e1" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
            O*
          </text>

          <circle cx={kfEndX} cy={kfEndY} r="3.4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          <text
            x={Math.min(452, Math.max(272, kfEndX + 6))}
            y={Math.max(30, kfEndY - 5)}
            fill="#fbbf24"
            fontSize="7.5"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            g({activeHkl || 'hkl'})
          </text>

          {/* Vector Labels */}
          <text x={ewaldCx + 16} y={ewaldCy + 11} fill="#7dd3fc" fontSize="7" fontFamily="JetBrains Mono, monospace">
            k₀
          </text>
          </g>
          <text x="268" y="159" fill="#94a3b8" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
            |k₀| = |k| = {(1 / safeWavelength).toFixed(3)} Å⁻¹ · |g| = {(1 / safeDSpacing).toFixed(3)} Å⁻¹
          </text>
        </svg>
      </div>

      {/* Bottom 5-Cell Precision Metrology Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] font-mono tabular-nums">
        <div className="px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Focused (hkl)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              ({activeHkl || '—'})
            </span>
            <span className="text-[10px] text-cyan-700 dark:text-cyan-400">{crystalSystem}</span>
          </div>
        </div>

        <div className="px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            d-Spacing
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
              {safeDSpacing.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Å</span>
          </div>
        </div>

        <div className="px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Scattering |Q|
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {safeQVector.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Å⁻¹</span>
          </div>
        </div>

        <div className="px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            s = sinθ/λ
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {sinThetaOverLambda.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Å⁻¹</span>
          </div>
        </div>

        <div className="px-2.5 py-2 col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Ewald d_min
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {ewaldDMin.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Å</span>
          </div>
        </div>
      </div>
    </div>
  );
};
