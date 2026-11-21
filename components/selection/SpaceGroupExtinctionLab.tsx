import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Compass,
  Layers,
  Search,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Plus,
  Minus,
} from 'lucide-react';
import { CrystalSystem } from '../../types';
import {
  SPACE_GROUP_EXTINCTION_CATALOG,
  SpaceGroupExtinctionProfile,
  GeneralLatticeParams,
  computeExactDSpacing,
  evaluateSpaceGroupReflection,
  deduceSpaceGroupsFromObservedHKLs,
} from './selectionRulesPhysics';

interface SpaceGroupExtinctionLabProps {
  wavelength: number;
  currentAllowedHkls: [number, number, number][];
  onSyncToWorkbench: (payload: {
    system: CrystalSystem;
    lattice: GeneralLatticeParams;
    hklText: string;
    probeHkl?: [number, number, number];
  }) => void;
  onSelectProbeHkl?: (h: number, k: number, l: number) => void;
}

const IDENTIFIER_PRESETS: {
  id: string;
  label: string;
  subtitle: string;
  hkls: string;
}[] = [
  {
    id: 'baddeleyite',
    label: 'm-ZrO₂ (P2₁/c)',
    subtitle: '2₁ screw + c-glide',
    hkls: '0 2 0, 1 0 2, -1 1 1, 1 1 1, 2 0 0, 0 0 2, 1 1 0, 0 2 1, 2 0 -2',
  },
  {
    id: 'silicon',
    label: 'Si / Diamond (Fd-3m)',
    subtitle: 'F-lattice + d-glide',
    hkls: '1 1 1, 2 2 0, 3 1 1, 4 0 0, 3 3 1, 4 2 2, 5 1 1, 4 4 0',
  },
  {
    id: 'corundum',
    label: 'α-Al₂O₃ (R-3c)',
    subtitle: 'Obverse R + c-glide',
    hkls: '0 1 2, 1 0 4, 1 1 0, 0 0 6, 1 1 3, 2 0 2, 0 2 4, 1 1 6, 3 0 0',
  },
  {
    id: 'olivine',
    label: 'Olivine / Fe₃C (Pnma)',
    subtitle: 'n-glide + a-glide + 2₁',
    hkls: '0 2 0, 2 0 0, 0 0 2, 0 1 1, 1 0 1, 1 1 1, 2 1 0, 0 2 2, 1 2 1',
  },
  {
    id: 'anatase',
    label: 'Anatase TiO₂ (I4₁/amd)',
    subtitle: 'I-center + a/d-glide + 4₁',
    hkls: '1 0 1, 1 0 3, 0 0 4, 1 1 2, 2 0 0, 1 0 5, 2 1 1, 2 0 4',
  },
  {
    id: 'hcp',
    label: 'α-Ti / Mg (P6₃/mmc)',
    subtitle: '6₃ screw + c-glide',
    hkls: '1 0 0, 0 0 2, 1 0 1, 1 0 2, 1 1 0, 1 0 3, 2 0 0, 1 1 2, 2 0 1, 0 0 4',
  },
];

const SYSTEM_FILTERS = [
  'All',
  'Cubic',
  'Hexagonal',
  'Trigonal',
  'Tetragonal',
  'Orthorhombic',
  'Monoclinic',
  'Triclinic',
] as const;

function parseHklList(raw: string): [number, number, number][] {
  return raw
    .split(/[\n,;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const tokens = chunk.split(/\s+/).map((t) => parseInt(t, 10));
      if (tokens.length === 3 && tokens.every((n) => !Number.isNaN(n))) {
        return [tokens[0], tokens[1], tokens[2]] as [number, number, number];
      }
      return null;
    })
    .filter((v): v is [number, number, number] => v !== null);
}

function tierBadgeClass(tier: string): string {
  if (tier.startsWith('Integral')) return 'bg-sky-500/15 text-sky-300 border-sky-500/35';
  if (tier.startsWith('Zonal')) return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
  if (tier.startsWith('Serial')) return 'bg-violet-500/15 text-violet-300 border-violet-500/35';
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
}

export const SpaceGroupExtinctionLab: React.FC<SpaceGroupExtinctionLabProps> = ({
  wavelength,
  currentAllowedHkls,
  onSyncToWorkbench,
  onSelectProbeHkl,
}) => {
  const [subMode, setSubMode] = useState<'EXPLORER' | 'IDENTIFIER'>('EXPLORER');
  const [systemFilter, setSystemFilter] = useState<(typeof SYSTEM_FILTERS)[number]>('All');
  const [selectedSgId, setSelectedSgId] = useState<string>('sg-14'); // P2_1/c shows glide + screw immediately
  const [testH, setTestH] = useState<number>(1);
  const [testK, setTestK] = useState<number>(0);
  const [testL, setTestL] = useState<number>(1);

  const [observedInput, setObservedInput] = useState<string>(IDENTIFIER_PRESETS[0].hkls);
  const [showContradicted, setShowContradicted] = useState<boolean>(false);

  const filteredGroups = useMemo(() => {
    if (systemFilter === 'All') return SPACE_GROUP_EXTINCTION_CATALOG;
    return SPACE_GROUP_EXTINCTION_CATALOG.filter((sg) => sg.crystalSystem === systemFilter);
  }, [systemFilter]);

  const activeSg: SpaceGroupExtinctionProfile = useMemo(() => {
    return (
      SPACE_GROUP_EXTINCTION_CATALOG.find((sg) => sg.id === selectedSgId) ??
      SPACE_GROUP_EXTINCTION_CATALOG[0]
    );
  }, [selectedSgId]);

  const liveEval = useMemo(
    () => evaluateSpaceGroupReflection(activeSg, testH, testK, testL),
    [activeSg, testH, testK, testL]
  );

  const liveKinematics = useMemo(() => {
    const d = computeExactDSpacing(testH, testK, testL, activeSg.defaultLattice);
    const sinTh = d > 0 ? wavelength / (2 * d) : 2;
    const twoTheta = sinTh <= 1 ? (2 * Math.asin(sinTh) * 180) / Math.PI : null;
    return { d, twoTheta };
  }, [activeSg, testH, testK, testL, wavelength]);

  const diagnosticRows = useMemo(() => {
    return activeSg.diagnosticHkls.map(([h, k, l]) => {
      const ev = evaluateSpaceGroupReflection(activeSg, h, k, l);
      const d = computeExactDSpacing(h, k, l, activeSg.defaultLattice);
      const sinTh = d > 0 ? wavelength / (2 * d) : 2;
      const twoTheta = sinTh <= 1 ? (2 * Math.asin(sinTh) * 180) / Math.PI : null;
      return { ev, d, twoTheta };
    });
  }, [activeSg, wavelength]);

  const parsedObservedHkls = useMemo(() => parseHklList(observedInput), [observedInput]);
  const deduction = useMemo(
    () => deduceSpaceGroupsFromObservedHKLs(parsedObservedHkls),
    [parsedObservedHkls]
  );

  const compatibleCandidates = useMemo(
    () => deduction.candidates.filter((c) => c.compatible),
    [deduction]
  );
  const contradictedCandidates = useMemo(
    () => deduction.candidates.filter((c) => !c.compatible),
    [deduction]
  );

  const handleSyncSpaceGroup = (sg: SpaceGroupExtinctionProfile, probe?: [number, number, number]) => {
    const hklText = sg.diagnosticHkls.map((p) => p.join(' ')).join(', ');
    onSyncToWorkbench({
      system: sg.mappedSystem,
      lattice: sg.defaultLattice,
      hklText,
      probeHkl: probe ?? sg.diagnosticHkls[0],
    });
  };

  return (
    <div className="bg-[#050B14] rounded-xl border border-slate-800/90 p-5 space-y-5 text-left font-sans">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-violet-300">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Space Group Extinction Lab — Glide Planes & Screw Axes
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inspect Integral (centering), Zonal (glide), and Serial (screw) absences across 20 International Tables space groups or deduce compatible space groups from observed peaks.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0B1221] p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setSubMode('EXPLORER')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subMode === 'EXPLORER'
                ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            Glide & Screw Explorer
          </button>
          <button
            type="button"
            onClick={() => setSubMode('IDENTIFIER')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subMode === 'IDENTIFIER'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            Reverse Extinction Identifier
          </button>
        </div>
      </div>

      {subMode === 'EXPLORER' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Catalog Browser */}
          <div className="lg:col-span-4 space-y-3">
            {/* Crystal System Filter */}
            <div className="flex flex-wrap gap-1">
              {SYSTEM_FILTERS.map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSystemFilter(sys)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                    systemFilter === sys
                      ? 'bg-sky-500/20 text-sky-200 border-sky-500/40'
                      : 'bg-[#0B1221] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>

            {/* Space Group List */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {filteredGroups.map((sg) => {
                const isSelected = sg.id === activeSg.id;
                const hasGlide = sg.rules.some((r) => r.tier.startsWith('Zonal'));
                const hasScrew = sg.rules.some((r) => r.tier.startsWith('Serial'));
                return (
                  <button
                    key={sg.id}
                    type="button"
                    onClick={() => {
                      setSelectedSgId(sg.id);
                      const firstExtinct = sg.diagnosticHkls.find(
                        ([h, k, l]) => !evaluateSpaceGroupReflection(sg, h, k, l).allowed
                      );
                      const target = firstExtinct ?? sg.diagnosticHkls[0];
                      if (target) {
                        setTestH(target[0]);
                        setTestK(target[1]);
                        setTestL(target[2]);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-[#0F1B33] border-violet-500/60 text-white'
                        : 'bg-[#070D18] border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
                          #{sg.number}
                        </span>
                        <span className="text-sm font-mono font-bold text-white truncate">
                          {sg.hmSymbol}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 rounded shrink-0">
                        {sg.bravaisPearson}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 truncate">{sg.prototypeMaterials}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {hasGlide && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Glide
                          </span>
                        )}
                        {hasScrew && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                            Screw
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Detailed Inspector */}
          <div className="lg:col-span-8 space-y-4">
            {/* Space Group Telemetry Card */}
            <div className="bg-[#070D18] rounded-xl border border-slate-800/90 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-mono font-bold text-white">{activeSg.hmSymbol}</span>
                    <span className="text-xs font-mono text-slate-400">
                      IT #{activeSg.number} · {activeSg.crystalSystem} ({activeSg.bravaisPearson})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Laue {activeSg.laueClass}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Extinction {activeSg.extinctionSymbol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Prototypes: <span className="text-slate-200">{activeSg.prototypeMaterials}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncSpaceGroup(activeSg, [testH, testK, testL])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-200 text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <span>Sync Lattice & HKLs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3-Tier Extinction Conditions */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Systematic Absence Conditions ({activeSg.rules.length || 'None — Unrestricted P'})
                </div>
                {activeSg.rules.length === 0 ? (
                  <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800 text-xs font-mono text-emerald-300">
                    No centering, glide plane, or screw axis absences — all non-zero (h k l) reflections are allowed by space-group symmetry.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeSg.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-2.5 rounded-lg bg-[#0B1221] border border-slate-800/90 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${tierBadgeClass(rule.tier)}`}
                          >
                            {rule.tier}
                          </span>
                          <span className="text-xs font-mono font-bold text-white tabular-nums">
                            {rule.zoneLabel}: {rule.conditionText}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{rule.operatorLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Single-(h k l) Tester */}
            <div className="bg-[#070D18] rounded-xl border border-slate-800/90 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Live Reflection Evaluator (Signed h k l)
                  </span>
                </div>

                {/* H, K, L Steppers */}
                <div className="flex items-center gap-2 font-mono">
                  {(
                    [
                      ['h', testH, setTestH],
                      ['k', testK, setTestK],
                      ['l', testL, setTestL],
                    ] as const
                  ).map(([axis, val, setter]) => (
                    <div
                      key={axis}
                      className="flex items-center bg-[#0B1221] border border-slate-700/80 rounded-lg overflow-hidden"
                    >
                      <span className="px-2 text-[10px] text-slate-400 uppercase border-r border-slate-800">
                        {axis}
                      </span>
                      <button
                        type="button"
                        onClick={() => setter(Math.max(-9, val - 1))}
                        className="px-1.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800"
                        aria-label={`Decrement ${axis}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-white tabular-nums">
                        {val}
                      </span>
                      <button
                        type="button"
                        onClick={() => setter(Math.min(9, val + 1))}
                        className="px-1.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800"
                        aria-label={`Increment ${axis}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict Readout */}
              <div
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  liveEval.allowed
                    ? 'bg-emerald-950/25 border-emerald-500/35'
                    : 'bg-rose-950/25 border-rose-500/35'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {liveEval.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-mono font-bold text-white">
                      ({testH} {testK} {testL}) —{' '}
                      <span className={liveEval.allowed ? 'text-emerald-300' : 'text-rose-300'}>
                        {liveEval.allowed ? 'ALLOWED' : 'SYSTEMATICALLY EXTINCT'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{liveEval.primaryReason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] text-slate-500 uppercase">d-spacing</div>
                    <div className="text-sky-300 font-semibold">
                      {liveKinematics.d > 0 ? `${liveKinematics.d.toFixed(3)} Å` : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-500 uppercase">2θ (λ={wavelength.toFixed(2)})</div>
                    <div className="text-emerald-300 font-semibold">
                      {liveKinematics.twoTheta !== null ? `${liveKinematics.twoTheta.toFixed(2)}°` : 'Out of sphere'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Table for Active Space Group */}
            <div className="bg-[#070D18] rounded-xl border border-slate-800/90 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800/90 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Diagnostic Reflection Matrix for {activeSg.hmSymbol}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Click any row to inspect & probe
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[#0B1221] text-[10px] uppercase text-slate-400 border-b border-slate-800">
                      <th className="py-2 px-3">(h k l)</th>
                      <th className="py-2 px-3">d (Å)</th>
                      <th className="py-2 px-3">2θ (°)</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Controlling Symmetry Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {diagnosticRows.map(({ ev, d, twoTheta }) => {
                      const [h, k, l] = ev.hkl;
                      const isCurrent = h === testH && k === testK && l === testL;
                      return (
                        <tr
                          key={ev.hkl.join('_')}
                          onClick={() => {
                            setTestH(h);
                            setTestK(k);
                            setTestL(l);
                            onSelectProbeHkl?.(h, k, l);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-sky-500/15'
                              : ev.allowed
                              ? 'hover:bg-emerald-950/20'
                              : 'hover:bg-rose-950/20'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                            ({h} {k} {l})
                          </td>
                          <td className="py-2 px-3 text-slate-300">{d > 0 ? d.toFixed(3) : '—'}</td>
                          <td className="py-2 px-3 text-sky-300">
                            {twoTheta !== null ? `${twoTheta.toFixed(2)}°` : '—'}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {ev.allowed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                ALLOWED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300">
                                <XCircle className="w-3 h-3" />
                                EXTINCT
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[11px] font-sans text-slate-400">
                            {ev.allowed
                              ? ev.checkedRules.length > 0
                                ? ev.checkedRules.map((c) => `${c.rule.zoneLabel} (${c.rule.conditionText})`).join(' · ')
                                : 'General position — unrestricted'
                              : `${ev.violatedRules[0].tier}: ${ev.violatedRules[0].operatorLabel}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* REVERSE EXTINCTION → SPACE GROUP IDENTIFIER */
        <div className="space-y-4">
          {/* Input & Preset Bar */}
          <div className="bg-[#070D18] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Observed Bragg Reflections (Comma or Newline Separated)
                </span>
              </div>
              {currentAllowedHkls.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setObservedInput(
                      currentAllowedHkls
                        .slice(0, 24)
                        .map((p) => p.join(' '))
                        .join(', ')
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  Use Current Allowed Peaks ({currentAllowedHkls.length})
                </button>
              )}
            </div>

            {/* 1-Click Real-Phase Diagnostic Presets */}
            <div className="flex flex-wrap gap-1.5">
              {IDENTIFIER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setObservedInput(preset.hkls)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0B1221] hover:bg-slate-800/90 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-[11px] font-mono font-bold text-sky-300">{preset.label}</div>
                  <div className="text-[9.5px] text-slate-400">{preset.subtitle}</div>
                </button>
              ))}
            </div>

            <textarea
              value={observedInput}
              onChange={(e) => setObservedInput(e.target.value)}
              rows={2}
              placeholder="e.g. 0 2 0, 1 0 2, -1 1 1, 1 1 1, 2 0 0"
              className="w-full bg-[#030712] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60"
            />
          </div>

          {/* Centering & 4-Zone Diagnostic Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 bg-[#070D18] rounded-xl border border-sky-500/30 p-3.5 flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                Deduced Bravais Centering ({deduction.observedCount} peaks)
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1.5">
                {deduction.deducedCentering}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {compatibleCandidates.length} of {SPACE_GROUP_EXTINCTION_CATALOG.length} catalog space groups are 100% consistent with every observed reflection.
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {deduction.zoneDiagnostics.map((zone) => (
                <div
                  key={zone.label}
                  className="bg-[#070D18] rounded-xl border border-slate-800/90 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-200">
                      {zone.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                      {zone.observed.length} peaks
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono">{zone.conclusion}</div>
                  {zone.observed.length > 0 && (
                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      {zone.observed.join(' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ranked Compatible Candidates */}
          <div className="bg-[#070D18] rounded-xl border border-slate-800/90 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Ranked Compatible Space Groups (Highest Extinction Specificity First)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowContradicted((s) => !s)}
                className="text-[11px] font-mono text-slate-400 hover:text-white whitespace-nowrap shrink-0"
              >
                {showContradicted
                  ? 'Hide Contradicted'
                  : `Show ${contradictedCandidates.length} Eliminated`}
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {compatibleCandidates.slice(0, 8).map((cand, idx) => (
                <div
                  key={cand.profile.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#0B1221]/80 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 tabular-nums">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-mono font-bold text-white">
                        {cand.profile.hmSymbol}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        IT #{cand.profile.number} · {cand.profile.crystalSystem} ({cand.profile.bravaisPearson})
                      </span>
                      <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/25">
                        {cand.profile.extinctionSymbol}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {cand.matchedEvidence.length > 0 ? (
                        <span>
                          Active rule matches:{' '}
                          <span className="font-mono text-emerald-300">
                            {cand.matchedEvidence.join(' · ')}
                          </span>
                        </span>
                      ) : (
                        <span>Unrestricted general primitive compatibility ({cand.profile.prototypeMaterials})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSgId(cand.profile.id);
                        setSubMode('EXPLORER');
                      }}
                      className="px-2.5 py-1 rounded-md bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-200 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0"
                    >
                      Inspect Rules
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSyncSpaceGroup(cand.profile)}
                      className="px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0"
                    >
                      Load in Workbench
                    </button>
                  </div>
                </div>
              ))}

              {showContradicted &&
                contradictedCandidates.map((cand) => (
                  <div
                    key={cand.profile.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-950/10"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {cand.profile.hmSymbol} (IT #{cand.profile.number})
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 tabular-nums">
                          {cand.violations} contradiction{cand.violations > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-rose-300/80 pl-5">
                        {cand.contradictions.join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
