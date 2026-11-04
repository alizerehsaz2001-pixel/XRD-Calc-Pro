import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Shapes, 
  Sparkles, 
  ArrowRight, 
  Atom,
  CheckCircle2
} from 'lucide-react';
import {
  DebyeScherrerDetectorGraphic,
  GoniometerLatticeSchematic
} from './WelcomePageGraphics';

interface Peak {
  twoTheta: number;
  hkl: string;
  intensity: number; // 0 - 100
  fwhm: number;
}

interface MaterialDemo {
  id: string;
  name: string;
  formula: string;
  system: string;
  spaceGroup: string;
  lattice: string;
  dSize: number; // nm
  strain: number; // %
  rwp: number;
  peaks: Peak[];
}

const DEMO_MATERIALS: MaterialDemo[] = [
  {
    id: 'Si',
    name: 'Silicon Standard',
    formula: 'Si',
    system: 'Cubic (Diamond)',
    spaceGroup: 'Fd-3m (#227)',
    lattice: 'a = 5.4309 Å',
    dSize: 48.2,
    strain: 0.041,
    rwp: 0.029,
    peaks: [
      { twoTheta: 28.44, hkl: '(111)', intensity: 100, fwhm: 0.18 },
      { twoTheta: 47.30, hkl: '(220)', intensity: 55, fwhm: 0.22 },
      { twoTheta: 56.12, hkl: '(311)', intensity: 30, fwhm: 0.26 },
      { twoTheta: 69.13, hkl: '(400)', intensity: 10, fwhm: 0.31 },
      { twoTheta: 76.38, hkl: '(331)', intensity: 14, fwhm: 0.35 },
      { twoTheta: 88.03, hkl: '(422)', intensity: 16, fwhm: 0.40 },
    ]
  },
  {
    id: 'NaCl',
    name: 'Halite Salt',
    formula: 'NaCl',
    system: 'Cubic (FCC)',
    spaceGroup: 'Fm-3m (#225)',
    lattice: 'a = 5.6402 Å',
    dSize: 62.5,
    strain: 0.028,
    rwp: 0.034,
    peaks: [
      { twoTheta: 27.36, hkl: '(111)', intensity: 18, fwhm: 0.16 },
      { twoTheta: 31.70, hkl: '(200)', intensity: 100, fwhm: 0.17 },
      { twoTheta: 45.45, hkl: '(220)', intensity: 58, fwhm: 0.21 },
      { twoTheta: 53.87, hkl: '(311)', intensity: 6, fwhm: 0.24 },
      { twoTheta: 56.48, hkl: '(222)', intensity: 20, fwhm: 0.25 },
      { twoTheta: 66.23, hkl: '(400)', intensity: 17, fwhm: 0.29 },
      { twoTheta: 75.30, hkl: '(420)', intensity: 32, fwhm: 0.33 },
    ]
  },
  {
    id: 'TiO2',
    name: 'Anatase Titania',
    formula: 'TiO₂',
    system: 'Tetragonal',
    spaceGroup: 'I4₁/amd (#141)',
    lattice: 'a = 3.784, c = 9.514 Å',
    dSize: 24.6,
    strain: 0.115,
    rwp: 0.048,
    peaks: [
      { twoTheta: 25.28, hkl: '(101)', intensity: 100, fwhm: 0.38 },
      { twoTheta: 37.80, hkl: '(004)', intensity: 22, fwhm: 0.42 },
      { twoTheta: 48.05, hkl: '(200)', intensity: 36, fwhm: 0.46 },
      { twoTheta: 53.89, hkl: '(105)', intensity: 24, fwhm: 0.50 },
      { twoTheta: 55.06, hkl: '(211)', intensity: 22, fwhm: 0.51 },
      { twoTheta: 62.69, hkl: '(204)', intensity: 16, fwhm: 0.56 },
    ]
  },
  {
    id: 'MAPbI3',
    name: 'Perovskite',
    formula: 'MAPbI₃',
    system: 'Tetragonal',
    spaceGroup: 'I4/mcm (#140)',
    lattice: 'a = 8.865, c = 12.659 Å',
    dSize: 35.8,
    strain: 0.075,
    rwp: 0.042,
    peaks: [
      { twoTheta: 14.10, hkl: '(110)', intensity: 100, fwhm: 0.26 },
      { twoTheta: 20.02, hkl: '(112)', intensity: 34, fwhm: 0.29 },
      { twoTheta: 23.50, hkl: '(211)', intensity: 26, fwhm: 0.31 },
      { twoTheta: 28.45, hkl: '(220)', intensity: 88, fwhm: 0.35 },
      { twoTheta: 31.85, hkl: '(310)', intensity: 42, fwhm: 0.37 },
      { twoTheta: 40.64, hkl: '(224)', intensity: 32, fwhm: 0.44 },
    ]
  }
];

interface Props {
  onLaunch: (materialId?: string) => void;
  isRTL?: boolean;
}

export const InteractiveHeroDiffractionShowcase: React.FC<Props> = ({ onLaunch, isRTL = false }) => {
  const [selectedId, setSelectedId] = useState<string>('Si');
  const [hoveredPeak, setHoveredPeak] = useState<Peak | null>(null);

  const activeMaterial = useMemo(() => {
    return DEMO_MATERIALS.find(m => m.id === selectedId) || DEMO_MATERIALS[0];
  }, [selectedId]);

  const primaryOrHoveredPeak = useMemo(() => {
    if (hoveredPeak) return hoveredPeak;
    return activeMaterial.peaks.find(p => p.intensity === 100) || activeMaterial.peaks[0];
  }, [hoveredPeak, activeMaterial]);

  // Chart dimensions
  const min2Theta = 10;
  const max2Theta = 90;
  const svgWidth = 480;
  const svgHeight = 166;
  const paddingX = 32;
  const baselineY = 122;
  const diffZeroY = 144;

  const getX = (twoTheta: number) => {
    return paddingX + ((twoTheta - min2Theta) / (max2Theta - min2Theta)) * (svgWidth - paddingX * 2);
  };

  const getY = (intensityPercent: number) => {
    return baselineY - (intensityPercent / 100) * 96;
  };

  // Generate continuous pseudo-Voigt profile path + residual difference trace
  const { curvePath, diffPath } = useMemo(() => {
    const points: string[] = [];
    const diffPts: string[] = [];
    const step = 0.5;
    const numSteps = Math.floor((max2Theta - min2Theta) / step);

    for (let i = 0; i <= numSteps; i++) {
      const xVal = min2Theta + i * step;
      let yIntensity = 2;
      let residual = Math.sin(xVal * 1.9) * 0.8;

      activeMaterial.peaks.forEach(peak => {
        const delta = xVal - peak.twoTheta;
        const halfWidth = peak.fwhm;
        const g = Math.exp(-Math.LN2 * Math.pow(delta / (halfWidth / 2), 2));
        const l = 1 / (1 + Math.pow(delta / (halfWidth / 2), 2));
        const profile = 0.6 * g + 0.4 * l;
        yIntensity += peak.intensity * profile;
        residual += (delta / (halfWidth + 0.2)) * Math.exp(-Math.pow(delta / halfWidth, 2)) * 4.2;
      });

      const clamped = Math.min(100, yIntensity);
      const px = getX(xVal);
      const py = getY(clamped);
      const dy = diffZeroY - Math.max(-7, Math.min(7, residual));

      points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
      diffPts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${dy.toFixed(1)}`);
    }

    return { curvePath: points.join(' '), diffPath: diffPts.join(' ') };
  }, [activeMaterial]);

  return (
    <div className="relative group perspective-2000 w-full">
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/15 via-cyan-500/10 to-transparent blur-[120px] rounded-full group-hover:bg-violet-600/20 transition-all duration-1000 pointer-events-none" />
      
      <div className="relative z-10 lg:transform lg:rotate-y-[-4deg] lg:rotate-x-[2deg] group-hover:rotate-0 transition-all duration-700">
        <div className="bg-[#050B14]/95 backdrop-blur-2xl rounded-[2.2rem] border border-white/10 overflow-hidden shadow-[0_40px_90px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/15 flex flex-col">
          
          {/* Top Header Controls Bar with Live Indicator */}
          <div className={`px-5 py-3.5 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-2 backdrop-blur-md ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] font-mono text-slate-400 font-bold ml-1 hidden sm:inline">
                DIFFRACTOMETER HUD
              </span>
            </div>

            {/* Material Selector Chips */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              {DEMO_MATERIALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedId(m.id);
                    setHoveredPeak(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedId === m.id
                      ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{m.formula}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                Cu Kα₁ · 1.5406 Å
              </span>
            </div>
          </div>

          {/* Interactive Diffraction Pattern & 2D Detector / Goniometer Suite */}
          <div className="p-5 flex flex-col gap-3.5">
            
            {/* 1D Diffractogram + Residual Difference Plot */}
            <div className="relative w-full bg-[#040812] rounded-2xl border border-slate-800/90 p-3 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{activeMaterial.name} ({activeMaterial.formula})</span>
                  <span className="text-indigo-300 font-semibold">• {activeMaterial.spaceGroup}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> I_calc(2θ)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Δ(I_obs - I_calc)
                  </span>
                </div>
              </div>

              {/* SVG Diffractogram Plot */}
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 overflow-visible select-none">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="50%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[20, 40, 60, 80].map((t) => (
                  <g key={t}>
                    <line
                      x1={getX(t)}
                      y1={16}
                      x2={getX(t)}
                      y2={svgHeight - 14}
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={getX(t)}
                      y={svgHeight - 3}
                      fill="#64748B"
                      fontSize="8.5"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {t}°
                    </text>
                  </g>
                ))}

                {/* Filled diffractogram area */}
                <path
                  d={`${curvePath} L ${getX(max2Theta)} ${baselineY} L ${getX(min2Theta)} ${baselineY} Z`}
                  fill="url(#curveGradient)"
                />

                {/* Main profile curve */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Bragg reflection tick marks (|) & residual difference trace */}
                <line x1={paddingX} y1={baselineY} x2={svgWidth - paddingX} y2={baselineY} stroke="rgba(255,255,255,0.12)" />
                <line x1={paddingX} y1={diffZeroY} x2={svgWidth - paddingX} y2={diffZeroY} stroke="rgba(52,211,153,0.18)" strokeDasharray="2 2" />
                <path d={diffPath} fill="none" stroke="#34d399" strokeWidth="1.1" strokeOpacity="0.8" />

                {/* Peak Markers & Miller Indices Labels */}
                {activeMaterial.peaks.map((peak, idx) => {
                  const px = getX(peak.twoTheta);
                  const py = getY(peak.intensity);
                  const isHovered = hoveredPeak?.hkl === peak.hkl;

                  return (
                    <g 
                      key={idx} 
                      className="cursor-pointer group/peak"
                      onMouseEnter={() => setHoveredPeak(peak)}
                      onMouseLeave={() => setHoveredPeak(null)}
                    >
                      {/* Bragg Position Tick below baseline */}
                      <line
                        x1={px}
                        y1={baselineY + 3}
                        x2={px}
                        y2={baselineY + 9}
                        stroke={isHovered ? '#22d3ee' : '#a78bfa'}
                        strokeWidth={isHovered ? '2' : '1.4'}
                      />

                      {/* Peak apex dot */}
                      <circle
                        cx={px}
                        cy={py}
                        r={isHovered ? 4.5 : 3}
                        className={`transition-all duration-200 ${
                          isHovered ? 'fill-cyan-300 stroke-white stroke-2' : 'fill-cyan-400'
                        }`}
                      />

                      {/* (hkl) index text */}
                      <text
                        x={px}
                        y={py - 7}
                        fill={isHovered ? '#67E8F9' : '#CBD5E1'}
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="transition-colors select-none"
                      >
                        {peak.hkl}
                      </text>

                      {/* Drop stem line */}
                      <line
                        x1={px}
                        y1={py}
                        x2={px}
                        y2={baselineY}
                        stroke={isHovered ? 'rgba(34,211,238,0.55)' : 'rgba(139,92,246,0.2)'}
                        strokeWidth={isHovered ? "1.5" : "1"}
                        strokeDasharray={isHovered ? "none" : "2 2"}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              <div className="h-5 flex items-center justify-between px-1 pt-1 border-t border-white/5 text-[9.5px] font-mono">
                <div className="flex items-center gap-3 text-cyan-300">
                  <span className="font-bold text-white">Reflection {primaryOrHoveredPeak.hkl}</span>
                  <span>2θ = {primaryOrHoveredPeak.twoTheta.toFixed(2)}°</span>
                  <span>I/I₀ = {primaryOrHoveredPeak.intensity}%</span>
                  <span>FWHM = {primaryOrHoveredPeak.fwhm}°</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Indexed
                </span>
              </div>
            </div>

            {/* Dual Synchronized Graphics: 2D Debye-Scherrer Detector + θ/2θ Goniometer & 3D Cell */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DebyeScherrerDetectorGraphic
                peaks={activeMaterial.peaks}
                hoveredPeak={hoveredPeak}
                onHoverPeak={setHoveredPeak}
                formula={activeMaterial.formula}
              />
              <GoniometerLatticeSchematic
                system={activeMaterial.system}
                twoTheta={primaryOrHoveredPeak.twoTheta}
                hkl={primaryOrHoveredPeak.hkl}
              />
            </div>

            {/* Crystal Structure Metric Tiles */}
            <div className="grid grid-cols-3 gap-2.5 select-none">
              <div className="bg-slate-900/60 rounded-xl border border-white/5 p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-violet-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-bold uppercase tracking-wider">
                  <span>Symmetry</span>
                  <Shapes className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="mt-1.5">
                  <p className="text-xs font-black font-mono text-white tracking-tight">{activeMaterial.spaceGroup}</p>
                  <p className="text-[9.5px] font-mono text-slate-400 truncate">{activeMaterial.system}</p>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl border border-white/5 p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-violet-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-bold uppercase tracking-wider">
                  <span>Domain Size D</span>
                  <Atom className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="mt-1.5">
                  <p className="text-xs font-black font-mono text-white tracking-tight">{activeMaterial.dSize} nm</p>
                  <p className="text-[9.5px] font-mono text-slate-400">Strain ε = {activeMaterial.strain}%</p>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl border border-white/5 p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-bold uppercase tracking-wider">
                  <span>Profile Fit</span>
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-1.5">
                  <p className="text-xs font-black font-mono text-emerald-400 tracking-tight">Rwp {(activeMaterial.rwp * 100).toFixed(1)}%</p>
                  <p className="text-[9.5px] font-mono text-slate-400 truncate">{activeMaterial.lattice}</p>
                </div>
              </div>
            </div>

            {/* Direct Open in Full Analyzer Action */}
            <button
              onClick={() => onLaunch(activeMaterial.id)}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-cyan-600/30 hover:from-violet-600/50 hover:to-cyan-600/50 border border-violet-500/40 hover:border-cyan-400/60 rounded-xl text-xs font-mono font-bold text-cyan-200 hover:text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer group/cta"
            >
              <Sparkles className="w-4 h-4 text-cyan-300 group-hover/cta:rotate-12 transition-transform" />
              <span>Load {activeMaterial.formula} in Full Bragg & Profile Engine</span>
              <ArrowRight className="w-4 h-4 text-cyan-300 group-hover/cta:translate-x-1 transition-transform" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
export default InteractiveHeroDiffractionShowcase;
