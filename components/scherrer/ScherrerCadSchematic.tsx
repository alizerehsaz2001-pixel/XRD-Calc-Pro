import React, { useState, useMemo } from 'react';
import { ScherrerResult } from '../../types';
import { Layers, Compass, Sliders, Activity, CheckCircle2 } from 'lucide-react';

export type MorphologyKMode = 'Isotropic' | 'Cube' | 'Octahedron' | 'Tetrahedron' | 'HexagonalRod';
export type BroadeningModelType = 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'de Keijser' | 'Halder-Wagner';

export interface ScherrerCadSchematicProps {
  results: ScherrerResult[];
  validResults: ScherrerResult[];
  selectedPeakIdx: number;
  onSelectPeakIdx: (idx: number) => void;
  wavelength: number;
  constantK: number;
  morphologyKMode: MorphologyKMode;
  onSelectMorphologyKMode: (mode: MorphologyKMode) => void;
  broadeningModel: BroadeningModelType;
  onSelectBroadeningModel: (model: BroadeningModelType) => void;
  breadthType: 'fwhm' | 'integral_breadth';
  instFwhm: number;
  useCaglioti: boolean;
  caglioti: { u: number; v: number; w: number };
  kAlpha2Correction: boolean;
  avgSize: number | null;
  precision: number;
}

export const ScherrerCadSchematic: React.FC<ScherrerCadSchematicProps> = ({
  results,
  validResults,
  selectedPeakIdx,
  onSelectPeakIdx,
  wavelength,
  constantK,
  morphologyKMode,
  onSelectMorphologyKMode,
  broadeningModel,
  onSelectBroadeningModel,
  breadthType,
  instFwhm,
  useCaglioti,
  caglioti,
  kAlpha2Correction,
  avgSize,
  precision
}) => {
  const [activeMode, setActiveMode] = useState<'laue' | 'habit' | 'deconvolution'>('laue');

  const activePeak = useMemo(() => {
    const candidate = results[selectedPeakIdx];
    if (candidate && !candidate.error && candidate.sizeNm > 0) return candidate;
    return validResults[0] || results[0] || null;
  }, [results, validResults, selectedPeakIdx]);

  const activeInstFwhm = useMemo(() => {
    if (!activePeak) return instFwhm;
    if (!useCaglioti) return instFwhm;
    const thetaRad = (activePeak.twoTheta / 2) * (Math.PI / 180);
    return Math.sqrt(
      Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w)
    );
  }, [activePeak, useCaglioti, caglioti, instFwhm]);

  // Compute all 5 kernel sizes for the active peak in Mode 3
  const kernelComparison = useMemo(() => {
    if (!activePeak) return [];
    const thetaRad = (activePeak.twoTheta / 2) * (Math.PI / 180);
    const cosTheta = Math.max(0.05, Math.cos(thetaRad));
    const kEff = activePeak.effectiveK || constantK;
    const wObs = Math.max(0.01, activePeak.fwhmObs - (kAlpha2Correction ? (activePeak.kAlpha2BroadeningDeg || 0) : 0));
    const wInst = Math.max(0.001, activeInstFwhm);

    const models: { id: BroadeningModelType; formula: string; color: string }[] = [
      { id: 'Gaussian', formula: '√(β_obs² − β_inst²)', color: '#38bdf8' },
      { id: 'Lorentzian', formula: 'β_obs − β_inst', color: '#fbbf24' },
      { id: 'Pseudo-Voigt', formula: '0.5·β_L + 0.5·β_G', color: '#a855f7' },
      { id: 'de Keijser', formula: 'β_obs − β_inst²/β_obs', color: '#34d399' },
      { id: 'Halder-Wagner', formula: '½[β_o − √(β_o(4β_i−3β_o))]', color: '#f43f5e' }
    ];

    return models.map(m => {
      if (wObs <= wInst) {
        return { ...m, betaDeg: 0, sizeNm: 0 };
      }
      let betaDeg = 0;
      if (m.id === 'Gaussian') {
        betaDeg = Math.sqrt(Math.pow(wObs, 2) - Math.pow(wInst, 2));
      } else if (m.id === 'Lorentzian') {
        betaDeg = wObs - wInst;
      } else if (m.id === 'de Keijser') {
        betaDeg = wObs - Math.pow(wInst, 2) / wObs;
      } else if (m.id === 'Halder-Wagner') {
        const disc = Math.max(0, wObs * (4 * wInst - 3 * wObs));
        betaDeg = 0.5 * (wObs - Math.sqrt(disc));
      } else {
        const bG = Math.sqrt(Math.pow(wObs, 2) - Math.pow(wInst, 2));
        const bL = wObs - wInst;
        betaDeg = 0.5 * bG + 0.5 * bL;
      }
      const betaRad = betaDeg * (Math.PI / 180);
      const sizeNm = betaRad > 0 ? (kEff * (wavelength / 10)) / (betaRad * cosTheta) : 0;
      return { ...m, betaDeg, sizeNm };
    });
  }, [activePeak, constantK, activeInstFwhm, kAlpha2Correction, wavelength]);

  const peakLabel = activePeak?.hkl
    ? `(${activePeak.hkl.join('')})`
    : activePeak
    ? `2θ=${activePeak.twoTheta.toFixed(2)}°`
    : 'N/A';

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-md shadow-2xl overflow-hidden">
      {/* Top 2px Signal Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-500" />

      {/* CAD Header Bar */}
      <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-amber-500 rounded-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold">
                CAD METROLOGY SCHEMATIC // SCHERRER COHERENT DIFFRACTION ENGINE
              </span>
              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 tabular-nums">
                {breadthType === 'integral_breadth' ? 'INTEGRAL BREADTH (β_IB)' : 'FWHM BREADTH (β_1/2)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
              Active Probe: <strong className="text-white">{peakLabel}</strong> at 2θ ={' '}
              <strong className="text-amber-300">{activePeak ? activePeak.twoTheta.toFixed(3) : '—'}°</strong> · d ={' '}
              <strong className="text-cyan-300">{activePeak?.dSpacing ? activePeak.dSpacing.toFixed(4) : '—'} Å</strong> · D_hkl ={' '}
              <strong className="text-emerald-300">
                {activePeak && activePeak.sizeNm > 0 ? activePeak.sizeNm.toFixed(precision) : '—'} nm
              </strong>{' '}
              (⟨D⟩ = {avgSize ? avgSize.toFixed(precision) : '—'} nm)
            </p>
          </div>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
          {[
            {
              id: 'laue',
              code: '01',
              label: 'Finite-Domain Laue Interference',
              icon: Layers
            },
            {
              id: 'habit',
              code: '02',
              label: 'Langford–Wilson K(hkl) Tensor',
              icon: Compass
            },
            {
              id: 'deconvolution',
              code: '03',
              label: '5-Kernel Deconvolution & Kα₂',
              icon: Sliders
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-xs text-[11px] font-mono transition-all flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="text-[10px] opacity-70">{tab.code}.</span>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Peak Selector Strip + Telemetry Readouts */}
      <div className="px-4 py-2 bg-[#090D16] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 uppercase tracking-wider text-[10px] mr-1">Probe Reflection:</span>
          {results.map((r, idx) => {
            const isSelected = idx === selectedPeakIdx;
            const label = r.hkl ? `(${r.hkl.join('')})` : `#${idx + 1}`;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPeakIdx(idx)}
                className={`px-2 py-0.5 rounded-xs text-[11px] font-mono cursor-pointer transition-colors border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : r.error || r.sizeNm <= 0
                    ? 'bg-rose-950/40 border-rose-800/50 text-rose-400 hover:border-rose-600'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {label} · {r.twoTheta.toFixed(1)}°
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>
            λ = <strong className="text-cyan-300">{wavelength.toFixed(4)} Å</strong>
          </span>
          <span>
            K_eff = <strong className="text-amber-300">{(activePeak?.effectiveK || constantK).toFixed(3)}</strong> ({morphologyKMode})
          </span>
          <span>
            Kernel = <strong className="text-indigo-300">{broadeningModel}</strong>
          </span>
        </div>
      </div>

      {/* Main Interactive SVG Schematic Viewport */}
      <div className="p-4 bg-[#070A12]">
        {activeMode === 'laue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 bg-[#05080F] border border-slate-800/90 rounded-xs p-2">
              <svg viewBox="0 0 760 270" className="w-full h-auto block select-none font-mono">
                <defs>
                  <pattern id="scherrerCadGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.6" />
                  </pattern>
                  <marker id="xrayArrowIn" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="xrayArrowOut" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                </defs>

                <rect width="760" height="270" fill="url(#scherrerCadGrid)" />

                {/* Left Half: Finite Coherent Stack D_hkl = N * d_hkl */}
                <g transform="translate(24, 22)">
                  <text x="0" y="12" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
                    A. FINITE COHERENT DOMAIN STACK (D_hkl = N · d_hkl)
                  </text>

                  {/* Crystal Column Bounding Box */}
                  <rect
                    x="55"
                    y="42"
                    width="220"
                    height="168"
                    fill="#0f172a"
                    fillOpacity="0.55"
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {/* Parallel Bragg Atomic Planes */}
                  {[0, 1, 2, 3, 4, 5, 6].map(layerIdx => {
                    const yPos = 54 + layerIdx * 24;
                    const isMid = layerIdx === 3;
                    return (
                      <g key={layerIdx}>
                        <line
                          x1="65"
                          y1={yPos}
                          x2="265"
                          y2={yPos}
                          stroke={isMid ? '#38bdf8' : '#475569'}
                          strokeWidth={isMid || layerIdx === 0 || layerIdx === 6 ? '1.6' : '1'}
                        />
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(atomIdx => (
                          <circle
                            key={atomIdx}
                            cx={77 + atomIdx * 25}
                            cy={yPos}
                            r={isMid || layerIdx === 0 ? 3.2 : 2.3}
                            fill={isMid ? '#38bdf8' : layerIdx === 0 ? '#fbbf24' : '#64748b'}
                          />
                        ))}
                      </g>
                    );
                  })}

                  {/* Incident X-Ray Beam (theta_0) */}
                  <line
                    x1="15"
                    y1="18"
                    x2="148"
                    y2="54"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    markerEnd="url(#xrayArrowIn)"
                  />
                  <line
                    x1="15"
                    y1="90"
                    x2="148"
                    y2="126"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    markerEnd="url(#xrayArrowIn)"
                  />
                  <text x="16" y="38" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                    k_in (λ={wavelength.toFixed(3)} Å)
                  </text>

                  {/* Diffracted Bragg Beam + Off-Bragg Destructive Envelope */}
                  <line
                    x1="152"
                    y1="54"
                    x2="290"
                    y2="18"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    markerEnd="url(#xrayArrowOut)"
                  />
                  {/* Slightly off-angle θ₀ ± Δθ rays */}
                  <line
                    x1="152"
                    y1="54"
                    x2="290"
                    y2="6"
                    stroke="#f43f5e"
                    strokeWidth="1.1"
                    strokeDasharray="3 2"
                  />
                  <line
                    x1="152"
                    y1="54"
                    x2="290"
                    y2="32"
                    stroke="#f43f5e"
                    strokeWidth="1.1"
                    strokeDasharray="3 2"
                  />
                  <text x="208" y="14" fill="#fbbf24" fontSize="9.5" fontWeight="bold">
                    2θ₀ ± Δ(2θ)
                  </text>

                  {/* Dimension Callout for D_hkl */}
                  <line x1="38" y1="54" x2="38" y2="198" stroke="#fbbf24" strokeWidth="1.4" />
                  <line x1="32" y1="54" x2="44" y2="54" stroke="#fbbf24" strokeWidth="1.4" />
                  <line x1="32" y1="198" x2="44" y2="198" stroke="#fbbf24" strokeWidth="1.4" />
                  <text
                    x="26"
                    y="126"
                    fill="#fbbf24"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform="rotate(-90, 26, 126)"
                  >
                    D_hkl = {activePeak && activePeak.sizeNm > 0 ? activePeak.sizeNm.toFixed(1) : '—'} nm
                  </text>

                  {/* Dimension Callout for d_hkl */}
                  <line x1="282" y1="54" x2="282" y2="78" stroke="#38bdf8" strokeWidth="1.4" />
                  <line x1="277" y1="54" x2="287" y2="54" stroke="#38bdf8" strokeWidth="1.4" />
                  <line x1="277" y1="78" x2="287" y2="78" stroke="#38bdf8" strokeWidth="1.4" />
                  <text x="292" y="69" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                    d = {activePeak?.dSpacing ? activePeak.dSpacing.toFixed(3) : '—'} Å
                  </text>

                  <text x="65" y="226" fill="#cbd5e1" fontSize="9.5">
                    Coherent Stack N = D / d ≈{' '}
                    <tspan fill="#34d399" fontWeight="bold">
                      {activePeak?.coherencePlanesN || '—'} planes
                    </tspan>{' '}
                    | Path Δ = (N/2)·2d·sin(θ₀+Δθ) = (m+½)λ
                  </text>
                </g>

                {/* Vertical Divider */}
                <line x1="395" y1="18" x2="395" y2="252" stroke="#1e293b" strokeWidth="1.2" />

                {/* Right Half: Laue Interference Function I(2θ) = sin²(Nα) / (N² sin²α) */}
                <g transform="translate(415, 22)">
                  <text x="0" y="12" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
                    B. LAUE INTERFERENCE BROADENING I(α) = sin²(Nα)/(N²sin²α)
                  </text>

                  {/* Coordinate Axes */}
                  <line x1="25" y1="195" x2="315" y2="195" stroke="#475569" strokeWidth="1.2" />
                  <line x1="170" y1="35" x2="170" y2="195" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Instrumental Reference Narrow Profile (dashed cyan) */}
                  <path
                    d={(() => {
                      const pts: string[] = [];
                      for (let i = 0; i <= 80; i++) {
                        const u = (i / 80) * 2 - 1; // -1 to 1
                        const x = 25 + ((u + 1) / 2) * 290;
                        const y = 195 - 145 * Math.exp(-Math.pow(u / 0.14, 2));
                        pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
                      }
                      return pts.join(' ');
                    })()}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.3"
                    strokeDasharray="3 3"
                  />

                  {/* Laue Finite-Size Broadened Profile with Subsidiary Fringes */}
                  <path
                    d={(() => {
                      const pts: string[] = [];
                      const nEff = Math.max(8, Math.min(35, Math.round((activePeak?.coherencePlanesN || 40) / 4)));
                      for (let i = 0; i <= 140; i++) {
                        const u = (i / 140) * 2 - 1; // -1 to 1
                        const x = 25 + ((u + 1) / 2) * 290;
                        const alpha = u * (Math.PI * 2.2) / nEff;
                        let intensity = 1;
                        if (Math.abs(alpha) > 1e-5) {
                          intensity = Math.pow(Math.sin(nEff * alpha) / (nEff * Math.sin(alpha)), 2);
                        }
                        const y = 195 - 148 * intensity;
                        pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
                      }
                      return pts.join(' ');
                    })()}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.2"
                  />

                  {/* FWHM Callout Line at Half Maximum (y = 195 - 74 = 121) */}
                  <line x1="118" y1="121" x2="222" y2="121" stroke="#34d399" strokeWidth="1.8" />
                  <circle cx="118" cy="121" r="3" fill="#34d399" />
                  <circle cx="222" cy="121" r="3" fill="#34d399" />
                  <text x="170" y="114" fill="#34d399" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                    β_sample = {activePeak ? activePeak.betaCorrected.toFixed(3) : '—'}°
                  </text>

                  {/* Labels */}
                  <text x="170" y="212" fill="#e2e8f0" fontSize="9.5" textAnchor="middle">
                    2θ₀ = {activePeak ? activePeak.twoTheta.toFixed(2) : '—'}°
                  </text>
                  <text x="68" y="212" fill="#64748b" fontSize="8.5" textAnchor="middle">
                    2θ₀ − λ/(D·cosθ)
                  </text>
                  <text x="272" y="212" fill="#64748b" fontSize="8.5" textAnchor="middle">
                    2θ₀ + λ/(D·cosθ)
                  </text>

                  <text x="20" y="228" fill="#cbd5e1" fontSize="9.5">
                    Scherrer Law:{' '}
                    <tspan fill="#fbbf24" fontWeight="bold">
                      D_hkl = (K_hkl · λ) / (β_rad · cos θ₀)
                    </tspan>
                  </text>
                </g>
              </svg>
            </div>

            {/* Right Telemetry Breakdown Column */}
            <div className="lg:col-span-4 space-y-2.5 font-mono text-xs">
              <div className="bg-[#090D16] border border-slate-800 p-3 rounded-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Active Reflection Metrology</span>
                  <span className="text-amber-400 font-bold">{peakLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 tabular-nums">
                  <div className="bg-slate-950/90 border border-slate-800/80 p-2 rounded-xs">
                    <span className="text-[10px] text-slate-500 block">Observed Width</span>
                    <span className="text-sm font-bold text-white">
                      {activePeak ? activePeak.fwhmObs.toFixed(4) : '—'}°
                    </span>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800/80 p-2 rounded-xs">
                    <span className="text-[10px] text-slate-500 block">Inst. Baseline</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {activeInstFwhm.toFixed(4)}°
                    </span>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800/80 p-2 rounded-xs">
                    <span className="text-[10px] text-slate-500 block">Pure Sample β_rad</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {activePeak ? ((activePeak.betaCorrected * Math.PI) / 180).toFixed(5) : '—'} rad
                    </span>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800/80 p-2 rounded-xs">
                    <span className="text-[10px] text-slate-500 block">Domain Size D_hkl</span>
                    <span className="text-sm font-bold text-amber-400">
                      {activePeak && activePeak.sizeNm > 0 ? `${activePeak.sizeNm.toFixed(precision)} nm` : 'Limit'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#090D16] border border-slate-800 p-3 rounded-xs text-[11px] text-slate-300 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Physical Origin of Line Broadening
                </div>
                <p className="text-slate-400 font-sans text-xs leading-relaxed">
                  In an infinite lattice, destructive interference cancels scattered X-rays at every angle except the exact Bragg angle <span className="font-mono text-white">θ₀</span>. When the coherent column contains only <span className="font-mono text-emerald-300">N = {activePeak?.coherencePlanesN || '—'}</span> planes, incomplete phase cancellation broadens the reflection across <span className="font-mono text-amber-300">Δ(2θ) ∝ λ/(D·cosθ₀)</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'habit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 bg-[#05080F] border border-slate-800/90 rounded-xs p-2">
              <svg viewBox="0 0 760 270" className="w-full h-auto block select-none font-mono">
                <rect width="760" height="270" fill="url(#scherrerCadGrid)" />

                {/* Left: Langford & Wilson (1978) Directional Shape Tensor */}
                <g transform="translate(24, 22)">
                  <text x="0" y="12" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
                    A. LANGFORD–WILSON (1978) DIRECTIONAL SHAPE FACTOR K(hkl)
                  </text>

                  {/* Polar / Polyhedral Habit Wireframe Representation */}
                  <g transform="translate(155, 128)">
                    <circle cx="0" cy="0" r="76" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="0" cy="0" r="52" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="-88" y1="0" x2="88" y2="0" stroke="#334155" strokeWidth="0.8" />
                    <line x1="0" y1="-84" x2="0" y2="84" stroke="#334155" strokeWidth="0.8" />

                    {/* Habit Shape Overlay based on morphologyKMode */}
                    {morphologyKMode === 'Isotropic' && (
                      <circle cx="0" cy="0" r="62" fill="#f59e0b" fillOpacity="0.14" stroke="#fbbf24" strokeWidth="2" />
                    )}
                    {morphologyKMode === 'Cube' && (
                      <rect
                        x="-52"
                        y="-52"
                        width="104"
                        height="104"
                        fill="#38bdf8"
                        fillOpacity="0.14"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                    )}
                    {morphologyKMode === 'Octahedron' && (
                      <polygon
                        points="0,-68 68,0 0,68 -68,0"
                        fill="#a855f7"
                        fillOpacity="0.14"
                        stroke="#a855f7"
                        strokeWidth="2"
                      />
                    )}
                    {morphologyKMode === 'Tetrahedron' && (
                      <polygon
                        points="0,-70 64,46 -64,46"
                        fill="#34d399"
                        fillOpacity="0.14"
                        stroke="#34d399"
                        strokeWidth="2"
                      />
                    )}
                    {morphologyKMode === 'HexagonalRod' && (
                      <polygon
                        points="-28,-68 28,-68 46,0 28,68 -28,68 -46,0"
                        fill="#f43f5e"
                        fillOpacity="0.14"
                        stroke="#f43f5e"
                        strokeWidth="2"
                      />
                    )}

                    {/* Miller Direction Vectors */}
                    <line x1="0" y1="0" x2="66" y2="0" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="72" y="4" fill="#fbbf24" fontSize="9.5" fontWeight="bold">
                      [100]
                    </text>

                    <line x1="0" y1="0" x2="50" y2="-50" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="55" y="-52" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                      [110]
                    </text>

                    <line x1="0" y1="0" x2="-48" y2="-48" stroke="#34d399" strokeWidth="1.5" />
                    <text x="-85" y="-52" fill="#34d399" fontSize="9.5" fontWeight="bold">
                      [111]
                    </text>
                  </g>

                  <text x="20" y="228" fill="#cbd5e1" fontSize="9.5">
                    Active Habit: <tspan fill="#fbbf24" fontWeight="bold">{morphologyKMode}</tspan> · K_eff(hkl) ={' '}
                    <tspan fill="#38bdf8" fontWeight="bold">{(activePeak?.effectiveK || constantK).toFixed(3)}</tspan>
                  </text>
                </g>

                {/* Divider */}
                <line x1="365" y1="18" x2="365" y2="252" stroke="#1e293b" strokeWidth="1.2" />

                {/* Right: Facet-by-Facet Apparent Size Profile D(hkl) */}
                <g transform="translate(385, 22)">
                  <text x="0" y="12" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
                    B. ANISOTROPIC FACET SIZING SPECTRUM D(hkl) & K(hkl)
                  </text>

                  {validResults.slice(0, 6).map((r, i) => {
                    const maxD = Math.max(...validResults.map(v => v.sizeNm), 1);
                    const barW = Math.max(12, Math.min(210, (r.sizeNm / maxD) * 210));
                    const y = 34 + i * 31;
                    const label = r.hkl ? `(${r.hkl.join('')})` : `#${i + 1}`;
                    return (
                      <g key={i} transform={`translate(0, ${y})`}>
                        <text x="0" y="14" fill="#e2e8f0" fontSize="10" fontWeight="bold">
                          {label}
                        </text>
                        <rect x="52" y="2" width="215" height="16" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                        <rect
                          x="52"
                          y="2"
                          width={barW}
                          height="16"
                          fill={i % 2 === 0 ? '#f59e0b' : '#38bdf8'}
                          fillOpacity="0.8"
                        />
                        <text x="275" y="14" fill="#fbbf24" fontSize="10" fontWeight="bold">
                          {r.sizeNm.toFixed(1)} nm (K={(r.effectiveK || constantK).toFixed(3)})
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Right Interactive Habit Switcher */}
            <div className="lg:col-span-4 space-y-2 font-mono text-xs">
              <div className="bg-[#090D16] border border-slate-800 p-3 rounded-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                  Select Crystal Habit Tensor K(hkl)
                </div>
                <div className="space-y-1.5">
                  {(
                    [
                      { id: 'Isotropic', label: 'Isotropic Sphere', ref: 'K = const (0.89–0.94)' },
                      { id: 'Cube', label: 'Cubic {100} Habit', ref: 'K₁₀₀=0.890, K₁₁₁=0.855' },
                      { id: 'Octahedron', label: 'Octahedral {111} Habit', ref: 'K₁₀₀=1.101, K₁₁₁=0.855' },
                      { id: 'Tetrahedron', label: 'Tetrahedral {111} Habit', ref: 'K₁₀₀=1.386, K₁₁₁=1.028' },
                      { id: 'HexagonalRod', label: 'Hexagonal c-Axis Rod', ref: 'K₀₀l=0.89, K_hk0=0.94' }
                    ] as { id: MorphologyKMode; label: string; ref: string }[]
                  ).map(h => {
                    const active = morphologyKMode === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => onSelectMorphologyKMode(h.id)}
                        className={`w-full px-2.5 py-1.5 rounded-xs text-left flex items-center justify-between border cursor-pointer transition-colors ${
                          active
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{h.label}</span>
                        <span className="text-[10px] text-slate-400">{h.ref}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'deconvolution' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 bg-[#05080F] border border-slate-800/90 rounded-xs p-2">
              <svg viewBox="0 0 760 270" className="w-full h-auto block select-none font-mono">
                <rect width="760" height="270" fill="url(#scherrerCadGrid)" />

                {/* Left: 3-Stage Deconvolution Pipeline (Observed -> Kα₂ Stripped -> Instrumental Subtracted) */}
                <g transform="translate(24, 22)">
                  <text x="0" y="12" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
                    A. INSTRUMENTAL & Kα₂ RACHINGER DECONVOLUTION PIPELINE
                  </text>

                  {/* 3 Stacked Signal Boxes */}
                  <g transform="translate(0, 28)">
                    <rect x="0" y="0" width="315" height="52" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <rect x="0" y="0" width="4" height="52" fill="#38bdf8" />
                    <text x="14" y="19" fill="#38bdf8" fontSize="10" fontWeight="bold">
                      1. OBSERVED PROFILE β_obs ({peakLabel})
                    </text>
                    <text x="14" y="37" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                      β_obs = {activePeak ? activePeak.fwhmObs.toFixed(4) : '—'}° | Kα₂ Δ:{' '}
                      {kAlpha2Correction ? `${(activePeak?.kAlpha2BroadeningDeg || 0).toFixed(4)}°` : 'OFF'}
                    </text>
                  </g>

                  <g transform="translate(0, 92)">
                    <rect x="0" y="0" width="315" height="52" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <rect x="0" y="0" width="4" height="52" fill="#a855f7" />
                    <text x="14" y="19" fill="#a855f7" fontSize="10" fontWeight="bold">
                      2. INSTRUMENTAL OPTICS β_inst ({useCaglioti ? 'CAGLIOTI u,v,w' : 'CONSTANT SLIT'})
                    </text>
                    <text x="14" y="37" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                      β_inst(2θ) = {activeInstFwhm.toFixed(4)}°
                      {useCaglioti ? ` (u=${caglioti.u}, v=${caglioti.v}, w=${caglioti.w})` : ''}
                    </text>
                  </g>

                  <g transform="translate(0, 156)">
                    <rect x="0" y="0" width="315" height="52" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
                    <rect x="0" y="0" width="4" height="52" fill="#f59e0b" />
                    <text x="14" y="19" fill="#fbbf24" fontSize="10" fontWeight="bold">
                      3. INTRINSIC SAMPLE BROADENING ({broadeningModel.toUpperCase()})
                    </text>
                    <text x="14" y="37" fill="#34d399" fontSize="11" fontWeight="bold">
                      β_sample = {activePeak ? activePeak.betaCorrected.toFixed(4) : '—'}° → D_hkl ={' '}
                      {activePeak && activePeak.sizeNm > 0 ? activePeak.sizeNm.toFixed(precision) : '—'} nm
                    </text>
                  </g>
                </g>

                <line x1="365" y1="18" x2="365" y2="252" stroke="#1e293b" strokeWidth="1.2" />

                {/* Right: 5-Kernel Comparison Bars */}
                <g transform="translate(385, 22)">
                  <text x="0" y="12" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
                    B. 5-KERNEL DECONVOLUTION SENSITIVITY FOR {peakLabel}
                  </text>

                  {kernelComparison.map((k, idx) => {
                    const maxSize = Math.max(...kernelComparison.map(x => x.sizeNm), 1);
                    const w = Math.max(8, Math.min(185, (k.sizeNm / maxSize) * 185));
                    const y = 32 + idx * 38;
                    const isCurrent = k.id === broadeningModel;
                    return (
                      <g key={k.id} transform={`translate(0, ${y})`}>
                        <text
                          x="0"
                          y="14"
                          fill={isCurrent ? '#fbbf24' : '#cbd5e1'}
                          fontSize="10"
                          fontWeight={isCurrent ? 'bold' : 'normal'}
                        >
                          {k.id}
                        </text>
                        <text x="0" y="26" fill="#64748b" fontSize="8.5">
                          {k.formula}
                        </text>
                        <rect
                          x="108"
                          y="4"
                          width="190"
                          height="18"
                          fill="#0f172a"
                          stroke={isCurrent ? '#f59e0b' : '#1e293b'}
                          strokeWidth={isCurrent ? '1.4' : '1'}
                        />
                        <rect x="108" y="4" width={w} height="18" fill={k.color} fillOpacity={isCurrent ? 0.9 : 0.55} />
                        <text x="305" y="17" fill={isCurrent ? '#fbbf24' : '#e2e8f0'} fontSize="10" fontWeight="bold">
                          {k.sizeNm > 0 ? `${k.sizeNm.toFixed(1)} nm` : 'Limit'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Right Interactive Kernel Selector */}
            <div className="lg:col-span-4 space-y-2 font-mono text-xs">
              <div className="bg-[#090D16] border border-slate-800 p-3 rounded-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Switch Active Deconvolution Kernel</span>
                </div>
                <div className="space-y-1.5">
                  {kernelComparison.map(k => {
                    const isSelected = broadeningModel === k.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => onSelectBroadeningModel(k.id)}
                        className={`w-full px-2.5 py-1.5 rounded-xs text-left flex items-center justify-between border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <span>{k.id}</span>
                        </div>
                        <span className="tabular-nums text-[11px]">
                          β={k.betaDeg.toFixed(3)}° → <strong>{k.sizeNm > 0 ? `${k.sizeNm.toFixed(1)} nm` : '—'}</strong>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
