import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LatticeParameters } from '../../types';
import { NeutronAtomExtended, calculateReciprocalScatterPlane, ReciprocalPoint } from '../../utils/neutronDiffractionPhysics';
import { Layers, ZoomIn, ZoomOut, RotateCcw, Info, Eye, Zap, Crosshair } from 'lucide-react';

interface ReciprocalScatterPlaneViewProps {
  lattice: LatticeParameters;
  atoms: NeutronAtomExtended[];
  wavelength: number;
  lengthUnit: string;
}

export const ReciprocalScatterPlaneView: React.FC<ReciprocalScatterPlaneViewProps> = ({
  lattice,
  atoms,
  wavelength,
  lengthUnit
}) => {
  const [planeType, setPlaneType] = useState<'HK0' | 'H0L' | '0KL' | 'HHL' | 'HK1'>('HK0');
  const [colorMode, setColorMode] = useState<'intensity' | 'phase' | 'xray_compare'>('intensity');
  const [maxIndex, setMaxIndex] = useState<number>(5);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showEwaldSphere, setShowEwaldSphere] = useState<boolean>(true);
  const [showQRings, setShowQRings] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<ReciprocalPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ReciprocalPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { points, qMax } = useMemo(() => {
    return calculateReciprocalScatterPlane(planeType, maxIndex, lattice, atoms, wavelength);
  }, [planeType, maxIndex, lattice, atoms, wavelength]);

  const k_incident = (2 * Math.PI) / wavelength; // Ewald sphere radius (Å^-1)
  const maxIntensity = useMemo(() => {
    return Math.max(...points.map(p => p.F_nuc_sq), 1);
  }, [points]);

  const maxXrayIntensity = useMemo(() => {
    return Math.max(...points.map(p => p.F_xray_sq), 1);
  }, [points]);

  // SVG coordinate transformation
  const svgSize = 520;
  const center = svgSize / 2;
  // Scale so that qMax * zoom fits nicely
  const scale = (center * 0.85 * zoom) / Math.max(qMax, 1);

  const toSvgX = (qx: number) => center + qx * scale;
  const toSvgY = (qy: number) => center - qy * scale;

  // Plane axis labels
  const axisLabels = useMemo(() => {
    switch (planeType) {
      case 'HK0': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'K [0 1 0]* (Å⁻¹)', zone: '[001] Zone' };
      case 'H0L': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: '[010] Zone' };
      case '0KL': return { x: 'K [0 1 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: '[100] Zone' };
      case 'HHL': return { x: 'HH [1 1 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: '[1-10] Zone' };
      case 'HK1': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'K [0 1 0]* (Å⁻¹)', zone: 'L = 1 Layer' };
    }
  }, [planeType]);

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* Header & Sub-Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              2D Reciprocal Scatter Plane
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Zone: <strong className="text-white">{axisLabels.zone}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time kinematic reciprocal lattice slice showing Bragg reflection nodes, nuclear structure factor amplitudes |F_nuc|², and Ewald sphere intercept.
          </p>
        </div>

        {/* Slice plane switcher buttons */}
        <div className="flex items-center gap-1.5 bg-[#070D18] p-1.5 rounded-xl border border-white/10 shrink-0">
          {(['HK0', 'H0L', '0KL', 'HHL', 'HK1'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlaneType(p)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black font-mono transition-all ${
                planeType === p
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              ({p})
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas & Controls Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Reciprocal Plane SVG Map */}
        <div className="xl:col-span-8 bg-[#070D19] p-4 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center min-h-[460px] shadow-2xl group">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)] pointer-events-none" />

          {/* Quick HUD controls overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-[9px] font-bold">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-white/20 mx-0.5" />
            <button
              onClick={() => setShowEwaldSphere(!showEwaldSphere)}
              className={`px-2 py-1 rounded-lg transition-all ${
                showEwaldSphere ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Ewald Limit
            </button>
            <button
              onClick={() => setShowQRings(!showQRings)}
              className={`px-2 py-1 rounded-lg transition-all ${
                showQRings ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              |Q| Rings
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 rounded-lg transition-all ${
                showGrid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Color Mode Switcher */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[9px] font-bold">
            <button
              onClick={() => setColorMode('intensity')}
              className={`px-2 py-1 rounded-lg transition-all ${
                colorMode === 'intensity' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              |F_nuc|²
            </button>
            <button
              onClick={() => setColorMode('phase')}
              className={`px-2 py-1 rounded-lg transition-all ${
                colorMode === 'phase' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Phase (±π)
            </button>
            <button
              onClick={() => setColorMode('xray_compare')}
              className={`px-2 py-1 rounded-lg transition-all ${
                colorMode === 'xray_compare' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Neutron vs X-ray
            </button>
          </div>

          {/* SVG Reciprocal Plane */}
          <div ref={containerRef} className="w-full max-w-[520px] aspect-square flex items-center justify-center relative">
            <svg
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="w-full h-full select-none cursor-crosshair drop-shadow-md"
            >
              <defs>
                {/* Radial Glows */}
                <radialGradient id="ewaldGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.05" />
                  <stop offset="90%" stopColor="#06b6d4" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Circular Field */}
              <circle cx={center} cy={center} r={center - 10} fill="#050914" stroke="#1e293b" strokeWidth="1" />

              {/* Concentric |Q| Rings (1, 2, 3, 4, 5 Å^-1) */}
              {showQRings && [1, 2, 3, 4, 5].map(q => {
                const r = q * scale;
                if (r > center - 10) return null;
                return (
                  <g key={`q-ring-${q}`}>
                    <circle
                      cx={center}
                      cy={center}
                      r={r}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    <text
                      x={center + r - 4}
                      y={center - 4}
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {q} Å⁻¹
                    </text>
                  </g>
                );
              })}

              {/* Ewald Sphere Kinematic Boundary Circle (Q = 4π/λ) */}
              {showEwaldSphere && (
                <g>
                  {/* Maximum Bragg reachable boundary Q_max = 2 * k_i = 4π/λ */}
                  <circle
                    cx={center}
                    cy={center}
                    r={2 * k_incident * scale}
                    fill="url(#ewaldGlow)"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                    opacity="0.8"
                  />
                  <text
                    x={center}
                    y={Math.max(16, center - 2 * k_incident * scale + 12)}
                    fill="#06b6d4"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Ewald Limit (2kᵢ = {(2 * k_incident).toFixed(2)} Å⁻¹)
                  </text>
                </g>
              )}

              {/* Reciprocal Space Coordinate Axes */}
              {showGrid && (
                <g opacity="0.6">
                  {/* Horizontal Axis */}
                  <line x1="20" y1={center} x2={svgSize - 20} y2={center} stroke="#475569" strokeWidth="1.5" />
                  {/* Vertical Axis */}
                  <line x1={center} y1="20" x2={center} y2={svgSize - 20} stroke="#475569" strokeWidth="1.5" />

                  {/* Axis arrows & labels */}
                  <text x={svgSize - 25} y={center - 8} fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {axisLabels.x.split(' ')[0]}*
                  </text>
                  <text x={center + 8} y="32" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {axisLabels.y.split(' ')[0]}*
                  </text>
                </g>
              )}

              {/* Origin (0 0 0) marker */}
              <circle cx={center} cy={center} r="6" fill="#10b981" />
              <circle cx={center} cy={center} r="14" fill="url(#centerGlow)" />
              <text x={center + 8} y={center + 14} fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                (000)
              </text>

              {/* Reciprocal Lattice Points */}
              {points.map((pt, idx) => {
                const cx = toSvgX(pt.qx);
                const cy = toSvgY(pt.qy);

                // Skip if outside viewport bounds
                if (cx < 10 || cx > svgSize - 10 || cy < 10 || cy > svgSize - 10) return null;

                const isHovered = hoveredPoint?.hklKey === pt.hklKey;
                const isSelected = selectedPoint?.hklKey === pt.hklKey;

                // Radius mapped from structure factor magnitude
                const normInt = pt.F_nuc_sq / maxIntensity;
                const radius = Math.max(3.5, Math.min(18, 4 + Math.sqrt(normInt) * 14));

                // Color calculation based on colorMode
                let nodeColor = '#10b981';
                let strokeColor = '#059669';

                if (colorMode === 'intensity') {
                  if (pt.F_nuc_sq < 0.001) {
                    nodeColor = '#334155'; // Extinct / Systematic absence
                    strokeColor = '#1e293b';
                  } else {
                    // Gradient from cyan to bright emerald to yellow
                    const bright = Math.min(1, Math.sqrt(normInt));
                    if (bright > 0.6) {
                      nodeColor = '#34d399';
                      strokeColor = '#6ee7b7';
                    } else if (bright > 0.2) {
                      nodeColor = '#059669';
                      strokeColor = '#10b981';
                    } else {
                      nodeColor = '#047857';
                      strokeColor = '#059669';
                    }
                  }
                } else if (colorMode === 'phase') {
                  // Phase angle [-π, π] mapped to hue
                  const deg = (pt.phase_nuc * 180) / Math.PI;
                  if (Math.abs(deg) < 15) {
                    nodeColor = '#10b981'; // 0 phase
                  } else if (Math.abs(Math.abs(deg) - 180) < 15) {
                    nodeColor = '#f43f5e'; // π (180° inverted) phase
                  } else if (deg > 0) {
                    nodeColor = '#8b5cf6'; // + imaginary phase
                  } else {
                    nodeColor = '#06b6d4'; // - imaginary phase
                  }
                  strokeColor = '#ffffff';
                } else if (colorMode === 'xray_compare') {
                  // Compare neutron vs X-ray intensity ratio
                  const normXray = pt.F_xray_sq / maxXrayIntensity;
                  if (normInt > normXray * 1.5) {
                    nodeColor = '#3b82f6'; // Neutron dominant (e.g. light atoms or isotopic contrast)
                    strokeColor = '#60a5fa';
                  } else if (normXray > normInt * 1.5) {
                    nodeColor = '#ec4899'; // X-ray dominant (heavy atoms)
                    strokeColor = '#f472b6';
                  } else {
                    nodeColor = '#a855f7'; // Balanced
                    strokeColor = '#c084fc';
                  }
                }

                return (
                  <g
                    key={`${pt.hklKey}-${idx}`}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setSelectedPoint(pt)}
                  >
                    {/* Pulsing ring on hover/selected */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 6}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        className="animate-spin"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={nodeColor}
                      stroke={isSelected ? '#ffffff' : strokeColor}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      opacity={pt.isInEwaldSphere ? (pt.isAllowed ? 0.95 : 0.4) : 0.25}
                    />

                    {/* Small index label for prominent peaks or hovered */}
                    {(isHovered || isSelected || normInt > 0.3) && (
                      <text
                        x={cx}
                        y={cy - radius - 3}
                        fill="#f8fafc"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                      >
                        {pt.h} {pt.k} {pt.l}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom quick caption */}
          <div className="flex items-center justify-between w-full mt-2 px-2 text-[10px] text-slate-400">
            <span className="font-mono">
              Points: <strong>{points.length}</strong> | Accessible: <strong>{points.filter(p => p.isInEwaldSphere && p.isAllowed).length}</strong>
            </span>
            <span className="text-slate-500 font-mono">
              Hover or click any node to inspect nuclear structure factors.
            </span>
          </div>
        </div>

        {/* Node Inspector & Reciprocal Metrics */}
        <div className="xl:col-span-4 space-y-4">
          {/* Active Node Detail Card */}
          <div className="bg-[#0B1528] p-5 rounded-3xl border border-blue-500/20 shadow-xl text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white">
                  {hoveredPoint || selectedPoint ? 'Reflection Node Inspector' : 'Select a Reflection'}
                </h4>
              </div>
              {(hoveredPoint || selectedPoint) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {(hoveredPoint || selectedPoint)?.hklKey}
                </span>
              )}
            </div>

            {hoveredPoint || selectedPoint ? (
              (() => {
                const p = hoveredPoint || selectedPoint!;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase block">d-Spacing</span>
                        <span className="text-xs font-mono font-black text-blue-400">
                          {p.dSpacing.toFixed(4)} <span className="text-[9px] font-sans text-slate-500">Å</span>
                        </span>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase block">2θ (Neutron)</span>
                        <span className="text-xs font-mono font-black text-cyan-400">
                          {p.twoTheta < 180 ? `${p.twoTheta.toFixed(2)}°` : 'Beyond Limit'}
                        </span>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase block">|Q| Magnitude</span>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          {p.qMag.toFixed(3)} <span className="text-[9px] font-sans text-slate-500">Å⁻¹</span>
                        </span>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase block">Kinematic |F_nuc|²</span>
                        <span className="text-xs font-mono font-black text-amber-400">
                          {p.F_nuc_sq.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold">Nuclear Phase Angle:</span>
                        <span className={`font-mono font-black ${p.phase_nuc < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {((p.phase_nuc * 180) / Math.PI).toFixed(1)}° ({(p.phase_nuc / Math.PI).toFixed(2)}π)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold">X-ray Structure Factor |F_x|²:</span>
                        <span className="font-mono font-black text-purple-400">{p.F_xray_sq.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold">Ewald Condition:</span>
                        <span className={`font-mono font-black ${p.isInEwaldSphere ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {p.isInEwaldSphere ? 'Accessible in 4π/λ' : 'Evanescent / Cutoff'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                Move your cursor over any circular node in the reciprocal plane to inspect its exact structure factor components and diffraction geometry.
              </div>
            )}
          </div>

          {/* Plane Physics Guide */}
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Reciprocal Slice Geometry</span>
            </div>
            <p className="leading-relaxed">
              In neutron diffraction, the scattering vector <strong className="text-white font-mono">Q = k_f - k_i</strong> must intersect a reciprocal lattice point <strong className="text-white font-mono">G_hkl</strong> to satisfy Laue's condition. The node brightness directly corresponds to <strong className="text-emerald-400 font-mono">|F_nuc(Q)|²</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
