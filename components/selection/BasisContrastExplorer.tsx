import React, { useMemo, useState } from 'react';
import { Layers, Sliders, Sparkles, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import {
  COMPOUND_BASIS_PRESETS,
  CompoundBasisPreset,
  evaluateCompoundBasisReflection,
} from './selectionRulesPhysics';

interface BasisContrastExplorerProps {
  wavelength: number;
  onSelectProbeHkl?: (h: number, k: number, l: number) => void;
}

const MATERIAL_QUICK_RATIOS: Record<
  string,
  { label: string; ratioBA: number; ratioCA?: number; latticeA: number; note: string }[]
> = {
  rocksalt: [
    { label: 'NaCl (1.55)', ratioBA: 1.55, latticeA: 5.640, note: 'Moderate odd-index peaks' },
    { label: 'KCl (1.00 — Isoelectronic)', ratioBA: 1.0, latticeA: 6.293, note: 'All odd peaks vanish!' },
    { label: 'MgO (0.67)', ratioBA: 0.67, latticeA: 4.212, note: 'Weak (111), strong (200)' },
    { label: 'TiC (0.27)', ratioBA: 0.27, latticeA: 4.328, note: 'Strong (111) & (200)' },
  ],
  zincblende: [
    { label: 'Si / Diamond (1.00)', ratioBA: 1.0, latticeA: 5.431, note: '(200) & (222) strictly extinct' },
    { label: 'GaAs (1.06)', ratioBA: 1.06, latticeA: 5.653, note: 'Ultra-weak (200) superlattice' },
    { label: 'ZnS (0.53)', ratioBA: 0.53, latticeA: 5.409, note: 'Clear (200) reflection' },
    { label: 'GaN (0.23)', ratioBA: 0.23, latticeA: 4.520, note: 'Prominent (200)' },
  ],
  cscl: [
    { label: 'Disordered BCC (1.00)', ratioBA: 1.0, latticeA: 2.950, note: 'All h+k+l odd extinct' },
    { label: 'β-CuZn Brass (1.03)', ratioBA: 1.03, latticeA: 2.954, note: 'Tiny X-ray contrast' },
    { label: 'B2 NiTi (0.79)', ratioBA: 0.79, latticeA: 3.015, note: 'Weak (100) superlattice' },
    { label: 'CsCl (0.31)', ratioBA: 0.31, latticeA: 4.123, note: 'Strong (100) & (111)' },
  ],
  fluorite: [
    { label: 'Exact (200) Null (0.50)', ratioBA: 0.5, latticeA: 5.463, note: '4f_A − 8f_B = 0!' },
    { label: 'CaF₂ (0.45)', ratioBA: 0.45, latticeA: 5.463, note: '(200) nearly invisible' },
    { label: 'c-ZrO₂ (0.20)', ratioBA: 0.2, latticeA: 5.128, note: 'Clear (200) peak' },
    { label: 'UO₂ (0.09)', ratioBA: 0.09, latticeA: 5.470, note: 'Strong (200) from heavy U' },
  ],
  perovskite: [
    { label: 'SrTiO₃ (0.58 / 0.21)', ratioBA: 0.58, ratioCA: 0.21, latticeA: 3.905, note: 'Classic cubic perovskite' },
    { label: 'BaTiO₃ (0.39 / 0.14)', ratioBA: 0.39, ratioCA: 0.14, latticeA: 4.008, note: 'Stronger (100) from Ba' },
    { label: 'CaTiO₃ (1.10 / 0.40)', ratioBA: 1.1, ratioCA: 0.4, latticeA: 3.840, note: 'Suppressed (100)' },
  ],
};

export const BasisContrastExplorer: React.FC<BasisContrastExplorerProps> = ({
  wavelength,
  onSelectProbeHkl,
}) => {
  const [presetId, setPresetId] = useState<string>('rocksalt');
  const activePreset: CompoundBasisPreset = useMemo(
    () => COMPOUND_BASIS_PRESETS.find((p) => p.id === presetId) ?? COMPOUND_BASIS_PRESETS[0],
    [presetId]
  );

  const [ratioBA, setRatioBA] = useState<number>(activePreset.defaultRatioBA);
  const [ratioCA, setRatioCA] = useState<number>(activePreset.defaultRatioCA ?? 0.21);
  const [latticeA, setLatticeA] = useState<number>(activePreset.latticeA);

  const handleSelectPreset = (preset: CompoundBasisPreset) => {
    setPresetId(preset.id);
    setRatioBA(preset.defaultRatioBA);
    setRatioCA(preset.defaultRatioCA ?? 0.21);
    setLatticeA(preset.latticeA);
  };

  const rows = useMemo(() => {
    const adjustedPreset = { ...activePreset, latticeA };
    const evaluated = adjustedPreset.probeReflections.map(([h, k, l]) =>
      evaluateCompoundBasisReflection(adjustedPreset, h, k, l, ratioBA, ratioCA, wavelength)
    );
    const maxMagSq = Math.max(1e-6, ...evaluated.map((e) => e.magSq));
    return evaluated.map((e) => ({
      ...e,
      relIntensity: (e.magSq / maxMagSq) * 100,
    }));
  }, [activePreset, latticeA, ratioBA, ratioCA, wavelength]);

  const extinctCount = rows.filter((r) => r.status === 'Extinct').length;
  const superlatticeCount = rows.filter((r) => r.status === 'Weak / Superlattice').length;
  const quickRatios = MATERIAL_QUICK_RATIOS[activePreset.id] ?? [];

  return (
    <div className="bg-[#050B14] rounded-xl border border-slate-800/90 p-5 space-y-5 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Multi-Atom Ordered Basis & Superlattice Contrast Lab
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sweep the atomic scattering contrast ratio <span className="font-mono text-amber-300">f_B / f_A</span> to observe superlattice reflections appear and accidental/isoelectronic extinctions cancel out in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums shrink-0">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
            {superlatticeCount} Superlattice
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300">
            {extinctCount} Extinct
          </span>
        </div>
      </div>

      {/* Structure Prototype Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {COMPOUND_BASIS_PRESETS.map((preset) => {
          const isSelected = preset.id === activePreset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'bg-[#0F1B33] border-amber-500/60 text-white'
                  : 'bg-[#070D18] border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-mono font-bold truncate text-white">{preset.name.split(':')[0]}</div>
              <div className="text-[10px] font-mono text-sky-300 truncate mt-0.5">{preset.formula}</div>
              <div className="text-[9.5px] font-mono text-slate-500 truncate mt-0.5">{preset.spaceGroup}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive Contrast Sliders & Real Material Quick Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-[#070D18] rounded-xl border border-slate-800/90 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Scattering Factor Contrast Controls</span>
          </div>

          {/* f_B / f_A Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">f_B / f_A ({activePreset.speciesBLabel})</span>
              <span className="text-amber-300 font-bold tabular-nums">{ratioBA.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={ratioBA}
              onChange={(e) => setRatioBA(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 tabular-nums">
              <span>0.00 (Vacant B)</span>
              <span>0.50</span>
              <span>1.00 (Isoelectronic)</span>
              <span>2.00</span>
            </div>
          </div>

          {/* Optional f_C / f_A Slider for Perovskite */}
          {activePreset.speciesCLabel && (
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">f_C / f_A ({activePreset.speciesCLabel})</span>
                <span className="text-rose-300 font-bold tabular-nums">{ratioCA.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.01}
                value={ratioCA}
                onChange={(e) => setRatioCA(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
              />
            </div>
          )}

          {/* Lattice Parameter a */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Cubic Cell Edge a (Å)</span>
              <span className="text-sky-300 font-bold tabular-nums">{latticeA.toFixed(3)} Å</span>
            </div>
            <input
              type="range"
              min={2.5}
              max={7.5}
              step={0.005}
              value={latticeA}
              onChange={(e) => setLatticeA(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* 1-Click Real Compound Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Real Material Benchmarks
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickRatios.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setRatioBA(item.ratioBA);
                    if (item.ratioCA !== undefined) setRatioCA(item.ratioCA);
                    setLatticeA(item.latticeA);
                  }}
                  className="p-2 rounded-lg bg-[#0B1221] hover:bg-slate-800/90 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-[11px] font-mono font-bold text-sky-300">{item.label}</div>
                  <div className="text-[9.5px] text-slate-400">{item.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Physics Insight Callout */}
          <div className="p-3 rounded-lg bg-[#0B1221] border border-amber-500/25 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{activePreset.physicalHeadline}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{activePreset.keyEffectNote}</p>
          </div>
        </div>

        {/* Right Live |F_hkl|^2 Stick Diffractogram + Reflection Table */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live SVG |F_hkl|^2 Stick Pattern */}
          <div className="bg-[#030712] rounded-xl border border-slate-800/90 p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span className="font-bold text-slate-200">
                LIVE |F(hkl)|² STICK PATTERN (λ = {wavelength.toFixed(4)} Å)
              </span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-400">● Fundamental</span>
                <span className="text-amber-400">● Superlattice</span>
                <span className="text-rose-400">× Extinct</span>
              </div>
            </div>

            <svg viewBox="0 0 640 205" className="w-full h-auto overflow-visible">
              {/* 2theta grid */}
              {[15, 30, 45, 60, 75, 90, 105].map((deg) => {
                const x = 42 + ((deg - 10) / 100) * 575;
                return (
                  <g key={deg}>
                    <line
                      x1={x}
                      y1={16}
                      x2={x}
                      y2={170}
                      stroke="#1e293b"
                      strokeWidth="0.75"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={x}
                      y={186}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {deg}°
                    </text>
                  </g>
                );
              })}

              {/* Axes */}
              <line x1={38} y1={170} x2={624} y2={170} stroke="#475569" strokeWidth="1.25" />
              <line x1={38} y1={16} x2={38} y2={170} stroke="#475569" strokeWidth="1.25" />

              {rows.map((row) => {
                if (row.twoTheta === null || row.twoTheta < 10 || row.twoTheta > 110) return null;
                const x = 42 + ((row.twoTheta - 10) / 100) * 575;
                const isExtinct = row.status === 'Extinct';
                const isSuper = row.status === 'Weak / Superlattice';
                const barH = isExtinct ? 0 : Math.max(8, (row.relIntensity / 100) * 134);
                const yTop = 170 - barH;
                const strokeColor = isExtinct ? '#f43f5e' : isSuper ? '#f59e0b' : '#10b981';

                return (
                  <g
                    key={row.hkl.join('_')}
                    onClick={() => onSelectProbeHkl?.(row.hkl[0], row.hkl[1], row.hkl[2])}
                    className="cursor-pointer"
                  >
                    {isExtinct ? (
                      <>
                        <line
                          x1={x}
                          y1={170}
                          x2={x}
                          y2={150}
                          stroke="#f43f5e"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                          opacity="0.75"
                        />
                        <text
                          x={x}
                          y={144}
                          fill="#f87171"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ({row.hkl.join('')})
                        </text>
                      </>
                    ) : (
                      <>
                        <line
                          x1={x}
                          y1={170}
                          x2={x}
                          y2={yTop}
                          stroke={strokeColor}
                          strokeWidth={isSuper ? 2.5 : 3}
                        />
                        <circle cx={x} cy={yTop} r={3.2} fill={strokeColor} />
                        <text
                          x={x}
                          y={yTop - 7}
                          fill={strokeColor}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ({row.hkl.join('')})
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Numeric Structure Factor Table */}
          <div className="bg-[#070D18] rounded-xl border border-slate-800/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead>
                  <tr className="bg-[#0B1221] text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <th className="py-2 px-3">(h k l)</th>
                    <th className="py-2 px-3">d (Å)</th>
                    <th className="py-2 px-3">2θ (°)</th>
                    <th className="py-2 px-3">|F|</th>
                    <th className="py-2 px-3">|F|²</th>
                    <th className="py-2 px-3">Rel. I</th>
                    <th className="py-2 px-3">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((row) => (
                    <tr
                      key={row.hkl.join('_')}
                      onClick={() => onSelectProbeHkl?.(row.hkl[0], row.hkl[1], row.hkl[2])}
                      className="cursor-pointer hover:bg-[#0B1221] transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-white">({row.hkl.join(' ')})</td>
                      <td className="py-2 px-3 text-slate-300">{row.dSpacing.toFixed(3)}</td>
                      <td className="py-2 px-3 text-sky-300">
                        {row.twoTheta !== null ? `${row.twoTheta.toFixed(2)}°` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-200">{row.mag.toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-200">{row.magSq.toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded overflow-hidden">
                            <div
                              className={`h-full ${
                                row.status === 'Extinct'
                                  ? 'bg-rose-500'
                                  : row.status === 'Weak / Superlattice'
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, row.relIntensity)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 w-9 text-right">
                            {row.relIntensity.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {row.status === 'Strong' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Fundamental
                          </span>
                        )}
                        {row.status === 'Weak / Superlattice' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Superlattice
                          </span>
                        )}
                        {row.status === 'Extinct' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 font-bold">
                            <XCircle className="w-3 h-3" />
                            Extinct
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
