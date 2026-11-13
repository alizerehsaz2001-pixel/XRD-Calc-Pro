import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  Layers,
  Crosshair,
  Sliders,
  ArrowUpRight,
  Compass,
  Cpu,
  Radio,
} from 'lucide-react';
import { AppSection } from '../../types';

interface MaterialPeak {
  dSpacing: number; // Å
  intensity: number;
  hkl: string;
  fwhmRef: number; // deg at Cu Kα
}

interface ReferenceMaterial {
  id: string;
  name: string;
  formula: string;
  system: string;
  spaceGroup: string;
  lattice: string;
  rwp: number;
  color: string;
  peaks: MaterialPeak[];
}

const REFERENCE_MATERIALS: Record<string, ReferenceMaterial> = {
  Si: {
    id: 'Si',
    name: 'Silicon NIST SRM 640f',
    formula: 'Si (Diamond Cubic)',
    system: 'Cubic',
    spaceGroup: 'Fd-3m (227)',
    lattice: 'a = 5.43119 Å',
    rwp: 1.84,
    color: '#06B6D4',
    peaks: [
      { dSpacing: 3.1355, intensity: 100, hkl: '(111)', fwhmRef: 0.085 },
      { dSpacing: 1.9201, intensity: 55, hkl: '(220)', fwhmRef: 0.095 },
      { dSpacing: 1.6375, intensity: 30, hkl: '(311)', fwhmRef: 0.105 },
      { dSpacing: 1.3578, intensity: 8, hkl: '(400)', fwhmRef: 0.115 },
      { dSpacing: 1.2459, intensity: 14, hkl: '(331)', fwhmRef: 0.125 },
      { dSpacing: 1.1086, intensity: 18, hkl: '(422)', fwhmRef: 0.138 },
    ],
  },
  TiO2: {
    id: 'TiO2',
    name: 'TiO₂ Anatase Nanopowder',
    formula: 'TiO₂ (Tetragonal)',
    system: 'Tetragonal',
    spaceGroup: 'I4₁/amd (141)',
    lattice: 'a = 3.7845, c = 9.5143 Å',
    rwp: 2.42,
    color: '#3B82F6',
    peaks: [
      { dSpacing: 3.516, intensity: 100, hkl: '(101)', fwhmRef: 0.34 },
      { dSpacing: 2.378, intensity: 24, hkl: '(004)', fwhmRef: 0.36 },
      { dSpacing: 1.892, intensity: 35, hkl: '(200)', fwhmRef: 0.39 },
      { dSpacing: 1.699, intensity: 22, hkl: '(105)', fwhmRef: 0.42 },
      { dSpacing: 1.666, intensity: 21, hkl: '(211)', fwhmRef: 0.43 },
      { dSpacing: 1.481, intensity: 16, hkl: '(204)', fwhmRef: 0.46 },
    ],
  },
  BaTiO3: {
    id: 'BaTiO3',
    name: 'BaTiO₃ Ferroelectric Perovskite',
    formula: 'BaTiO₃ (Tetragonal Split)',
    system: 'Tetragonal',
    spaceGroup: 'P4mm (99)',
    lattice: 'a = 3.994, c = 4.038 Å',
    rwp: 2.91,
    color: '#F59E0B',
    peaks: [
      { dSpacing: 4.015, intensity: 18, hkl: '(001)/(100)', fwhmRef: 0.14 },
      { dSpacing: 2.838, intensity: 100, hkl: '(101)/(110)', fwhmRef: 0.15 },
      { dSpacing: 2.314, intensity: 26, hkl: '(111)', fwhmRef: 0.14 },
      { dSpacing: 2.019, intensity: 16, hkl: '(002)', fwhmRef: 0.16 },
      { dSpacing: 1.997, intensity: 34, hkl: '(200)', fwhmRef: 0.16 },
      { dSpacing: 1.634, intensity: 38, hkl: '(211)', fwhmRef: 0.18 },
    ],
  },
  NaCl: {
    id: 'NaCl',
    name: 'Halite Rock Salt Standard',
    formula: 'NaCl (Face-Centered Cubic)',
    system: 'Cubic',
    spaceGroup: 'Fm-3m (225)',
    lattice: 'a = 5.6402 Å',
    rwp: 1.96,
    color: '#10B981',
    peaks: [
      { dSpacing: 3.256, intensity: 13, hkl: '(111)', fwhmRef: 0.11 },
      { dSpacing: 2.820, intensity: 100, hkl: '(200)', fwhmRef: 0.11 },
      { dSpacing: 1.994, intensity: 58, hkl: '(220)', fwhmRef: 0.13 },
      { dSpacing: 1.628, intensity: 19, hkl: '(222)', fwhmRef: 0.15 },
      { dSpacing: 1.410, intensity: 8, hkl: '(400)', fwhmRef: 0.16 },
      { dSpacing: 1.261, intensity: 22, hkl: '(420)', fwhmRef: 0.18 },
    ],
  },
};

interface XRaySource {
  id: 'Cu' | 'Co' | 'Mo';
  label: string;
  wavelength: number; // Å
  energyKeV: number;
  max2Theta: number;
}

const XRAY_SOURCES: Record<'Cu' | 'Co' | 'Mo', XRaySource> = {
  Cu: { id: 'Cu', label: 'Cu Kα₁', wavelength: 1.540598, energyKeV: 8.048, max2Theta: 90 },
  Co: { id: 'Co', label: 'Co Kα₁', wavelength: 1.788965, energyKeV: 6.930, max2Theta: 105 },
  Mo: { id: 'Mo', label: 'Mo Kα₁', wavelength: 0.709319, energyKeV: 17.479, max2Theta: 45 },
};

interface InteractiveHeroDiffractionShowcaseProps {
  onLaunchSection?: (section: AppSection) => void;
}

export const InteractiveHeroDiffractionShowcase: React.FC<InteractiveHeroDiffractionShowcaseProps> = ({
  onLaunchSection,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Si');
  const [sourceKey, setSourceKey] = useState<'Cu' | 'Co' | 'Mo'>('Cu');
  const [isScanning, setIsScanning] = useState(true);
  const [scanAngle, setScanAngle] = useState<number>(28.44);
  const [showResidual, setShowResidual] = useState<boolean>(true);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);

  const currentData = REFERENCE_MATERIALS[selectedMaterial];
  const currentSource = XRAY_SOURCES[sourceKey];

  // Dynamically compute peak 2θ and Q from Bragg's Law: λ = 2 d sin(θ)
  const computedPeaks = useMemo(() => {
    const lambda = currentSource.wavelength;
    return currentData.peaks
      .map((pk) => {
        const sinTheta = lambda / (2 * pk.dSpacing);
        if (sinTheta >= 0.995) return null;
        const thetaRad = Math.asin(sinTheta);
        const twoTheta = (thetaRad * 360) / Math.PI;
        const qVal = (4 * Math.PI * sinTheta) / lambda;
        const fwhmScaled = pk.fwhmRef * (lambda / 1.540598) * (1 / Math.cos(thetaRad));
        return {
          ...pk,
          twoTheta,
          qVal,
          fwhm: fwhmScaled,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null && p.twoTheta >= 10 && p.twoTheta <= currentSource.max2Theta);
  }, [currentData, currentSource]);

  const minAngle = 10;
  const maxAngle = currentSource.max2Theta;

  // Keep scanAngle in bounds when switching X-ray source
  useEffect(() => {
    setScanAngle((prev) => {
      if (prev < minAngle || prev > maxAngle) {
        return computedPeaks[0]?.twoTheta ?? 28.4;
      }
      return prev;
    });
  }, [minAngle, maxAngle, computedPeaks]);

  // Continuous goniometer sweep
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setScanAngle((prev) => {
        const step = (maxAngle - minAngle) * 0.0035;
        const next = prev + step;
        return next > maxAngle ? minAngle : next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isScanning, minAngle, maxAngle]);

  // Generate Pseudo-Voigt profile + synthetic Rietveld difference curve
  const { calcPath, areaPath, diffPath, activePeak } = useMemo(() => {
    const width = 640;
    const height = 210;
    const steps = 320;
    const pts: string[] = [];
    const diffPts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const angle = minAngle + (i / steps) * (maxAngle - minAngle);
      let yIntensity = 3.5 + 1.5 * Math.exp(-(angle - minAngle) / 25); // Compton/air scatter baseline
      let diffVal = Math.sin(i * 0.65) * 1.2 + Math.cos(i * 1.4) * 0.8;

      for (const peak of computedPeaks) {
        const dx = angle - peak.twoTheta;
        const gamma = Math.max(0.28, peak.fwhm * 3.2);
        const gauss = Math.exp(-2.772588 * Math.pow(dx / gamma, 2));
        const lorentz = 1 / (1 + 4 * Math.pow(dx / gamma, 2));
        const pv = 0.65 * gauss + 0.35 * lorentz;
        yIntensity += peak.intensity * pv;
        // Slight derivative-like residual signature around Bragg reflections
        diffVal += peak.intensity * 0.045 * (dx / gamma) * Math.exp(-3.5 * Math.pow(dx / gamma, 2));
      }

      const x = (i / steps) * width;
      const y = height - Math.min(height - 14, (yIntensity / 112) * (height - 28)) - 8;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);

      const diffY = 24 - Math.max(-18, Math.min(18, diffVal * 2.2));
      diffPts.push(`${x.toFixed(1)},${diffY.toFixed(1)}`);
    }

    const line = `M ${pts.join(' L ')}`;
    const area = `${line} L ${width},${height} L 0,${height} Z`;
    const diff = `M ${diffPts.join(' L ')}`;

    const tolerance = (maxAngle - minAngle) * 0.028;
    const hovered =
      hoveredPeakIdx !== null && computedPeaks[hoveredPeakIdx]
        ? computedPeaks[hoveredPeakIdx]
        : computedPeaks.find((p) => Math.abs(p.twoTheta - scanAngle) < tolerance) || computedPeaks[0];

    return { calcPath: line, areaPath: area, diffPath: diff, activePeak: hovered };
  }, [computedPeaks, minAngle, maxAngle, scanAngle, hoveredPeakIdx]);

  const currentSinTheta = Math.sin((scanAngle * Math.PI) / 360);
  const currentDSpacing = currentSinTheta > 0.02 ? currentSource.wavelength / (2 * currentSinTheta) : 0;
  const currentQ = (4 * Math.PI * currentSinTheta) / currentSource.wavelength;
  const scanPercent = ((scanAngle - minAngle) / (maxAngle - minAngle)) * 100;

  return (
    <div className="relative w-full bg-[#0B0F19] border border-slate-800 rounded-sm shadow-2xl overflow-hidden select-none">
      {/* Top Instrument Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#070A12] border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-400">
            ● θ–2θ GONIOMETER TELEMETRY
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            λ = {currentSource.wavelength.toFixed(4)} Å ({currentSource.label} · {currentSource.energyKeV.toFixed(2)} keV)
          </span>
        </div>

        {/* Anode Source Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mr-1">Anode:</span>
          {(['Cu', 'Co', 'Mo'] as const).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setSourceKey(src)}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm border transition-colors ${
                sourceKey === src
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                  : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {XRAY_SOURCES[src].label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsScanning((s) => !s)}
            className={`ml-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm border flex items-center gap-1 transition-colors ${
              isScanning
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isScanning ? 'Pause Goniometer Sweep' : 'Resume Goniometer Sweep'}
          >
            {isScanning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            {isScanning ? 'SWEEPING' : 'HOLD'}
          </button>
        </div>
      </div>

      {/* Reference Material Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800 bg-[#070A12]/60">
        {Object.values(REFERENCE_MATERIALS).map((mat) => {
          const isSelected = selectedMaterial === mat.id;
          return (
            <button
              key={mat.id}
              type="button"
              onClick={() => {
                setSelectedMaterial(mat.id);
                setHoveredPeakIdx(null);
              }}
              className={`px-3 py-2 text-left border-r last:border-r-0 border-slate-800 transition-colors ${
                isSelected
                  ? 'bg-slate-900/90 border-b-2 border-b-cyan-400'
                  : 'hover:bg-slate-900/40 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {mat.id === 'BaTiO3' ? 'BaTiO₃' : mat.id === 'TiO2' ? 'TiO₂' : mat.id}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{mat.system}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{mat.spaceGroup}</div>
            </button>
          );
        })}
      </div>

      {/* Main Diffractogram Canvas + Bragg Vector HUD */}
      <div className="p-4 space-y-3">
        {/* Live Telemetry Readout Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#070A12] border border-slate-800/90 p-2.5 rounded-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Goniometer 2θ</div>
            <div className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
              {scanAngle.toFixed(2)}°
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Scattering Vector Q</div>
            <div className="text-sm font-mono font-bold text-indigo-300 tabular-nums">
              {currentQ.toFixed(3)} Å⁻¹
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Interplanar d(hkl)</div>
            <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
              {currentDSpacing.toFixed(4)} Å
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Active Reflection</div>
            <div className="text-sm font-mono font-bold text-amber-300 tabular-nums flex items-center gap-1.5">
              <span>{activePeak ? activePeak.hkl : '—'}</span>
              {activePeak && (
                <span className="text-[10px] text-slate-400 font-normal">
                  ({activePeak.twoTheta.toFixed(2)}°)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary SVG Diffraction & Rietveld Residual Plot */}
        <div
          className="relative bg-[#070A12] border border-slate-800 rounded-sm overflow-hidden cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setIsScanning(false);
            setScanAngle(minAngle + relX * (maxAngle - minAngle));
          }}
        >
          {/* Subtle CAD Coordinate Grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
              backgroundSize: '32px 28px',
            }}
          />

          {/* Top Plot Overlay Metadata */}
          <div className="relative z-10 flex items-center justify-between px-3 pt-2 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-slate-200 font-bold">{currentData.name}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">{currentData.lattice}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 tabular-nums">Rwp = {currentData.rwp.toFixed(2)}%</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowResidual((r) => !r);
                }}
                className={`px-1.5 py-0.5 rounded-sm border text-[9px] uppercase ${
                  showResidual
                    ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 text-slate-500'
                }`}
              >
                Iobs − Icalc
              </button>
            </div>
          </div>

          {/* Main Diffractogram SVG */}
          <svg className="w-full h-52 overflow-visible" viewBox="0 0 640 210" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroPvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentData.color} stopOpacity="0.40" />
                <stop offset="100%" stopColor={currentData.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill & Calculated Profile */}
            <path d={areaPath} fill="url(#heroPvGrad)" />
            <path
              d={calcPath}
              fill="none"
              stroke={currentData.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Bragg Position Tick Marks & (hkl) Labels */}
            {computedPeaks.map((pk, idx) => {
              const x = ((pk.twoTheta - minAngle) / (maxAngle - minAngle)) * 640;
              const yTop = 210 - (pk.intensity / 112) * (210 - 28) - 8;
              const isNear = Math.abs(scanAngle - pk.twoTheta) < (maxAngle - minAngle) * 0.025;

              return (
                <g
                  key={pk.hkl}
                  onMouseEnter={() => setHoveredPeakIdx(idx)}
                  onMouseLeave={() => setHoveredPeakIdx(null)}
                >
                  {/* Bragg Reflection Tick at Bottom */}
                  <line
                    x1={x}
                    y1={196}
                    x2={x}
                    y2={206}
                    stroke={isNear ? '#22D3EE' : '#64748B'}
                    strokeWidth={isNear ? '2' : '1.2'}
                  />
                  {/* Dashed vertical line when active */}
                  {isNear && (
                    <line
                      x1={x}
                      y1={yTop}
                      x2={x}
                      y2={196}
                      stroke="#22D3EE"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={yTop}
                    r={isNear ? 4 : 2.5}
                    fill={isNear ? '#22D3EE' : '#0B0F19'}
                    stroke={currentData.color}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={Math.max(16, yTop - 8)}
                    textAnchor="middle"
                    fill={isNear ? '#22D3EE' : '#94A3B8'}
                    fontSize={isNear ? '10' : '9'}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={isNear ? '700' : '500'}
                  >
                    {pk.hkl}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Rietveld Residual Difference Strip */}
          {showResidual && (
            <div className="border-t border-slate-800/90 bg-[#050811] px-0 py-1 relative">
              <div className="absolute left-3 top-1 text-[9px] font-mono text-slate-500 uppercase">
                ΔI (Rietveld Residual)
              </div>
              <svg className="w-full h-11" viewBox="0 0 640 48" preserveAspectRatio="none">
                <line x1="0" y1="24" x2="640" y2="24" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                <path d={diffPath} fill="none" stroke="#38BDF8" strokeWidth="1.1" opacity="0.8" />
              </svg>
            </div>
          )}

          {/* Live Goniometer Cursor Hairline */}
          <div
            className="absolute top-0 bottom-0 w-px bg-cyan-400/80 pointer-events-none"
            style={{ left: `${Math.max(0, Math.min(100, scanPercent))}%` }}
          >
            <div className="absolute top-7 -translate-x-1/2 px-1.5 py-0.5 bg-[#070A12] border border-cyan-500/60 text-[9px] font-mono text-cyan-300 whitespace-nowrap rounded-sm">
              {scanAngle.toFixed(2)}°
            </div>
          </div>

          {/* X-Axis Scale Bar */}
          <div className="flex justify-between items-center px-3 py-1.5 bg-[#070A12] border-t border-slate-800 text-[10px] font-mono text-slate-500 tabular-nums">
            <span>{minAngle}°</span>
            <span>{(minAngle + (maxAngle - minAngle) * 0.25).toFixed(0)}°</span>
            <span className="text-slate-400">Diffraction Angle 2θ (deg)</span>
            <span>{(minAngle + (maxAngle - minAngle) * 0.75).toFixed(0)}°</span>
            <span>{maxAngle}°</span>
          </div>
        </div>

        {/* Manual Goniometer Scrubbing Slider + Direct Module Launch Triggers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 flex-1 bg-[#070A12] border border-slate-800 px-3 py-1.5 rounded-sm">
            <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">Scrub 2θ:</span>
            <input
              type="range"
              min={minAngle}
              max={maxAngle}
              step={0.05}
              value={scanAngle}
              onChange={(e) => {
                setIsScanning(false);
                setScanAngle(parseFloat(e.target.value));
              }}
              aria-label="Scrub Goniometer 2-Theta Angle"
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-none cursor-pointer"
            />
          </div>

          {onLaunchSection && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onLaunchSection('rietveld')}
                className="px-2.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <Compass className="w-3 h-3" />
                Rietveld
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onLaunchSection('pdf_analysis')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <Radio className="w-3 h-3 text-amber-400" />
                PDF G(r)
              </button>
              <button
                type="button"
                onClick={() => onLaunchSection('dl')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <Cpu className="w-3 h-3 text-indigo-400" />
                PINN ID
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
