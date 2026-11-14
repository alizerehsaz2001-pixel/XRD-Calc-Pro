import React, { useState, useMemo } from 'react';
import { Compass, CheckCircle2, XCircle, Search, Filter, BookOpen, ShieldCheck } from 'lucide-react';
import {
  evaluateSpaceGroupCandidates,
  SpaceGroupCandidate,
  SpaceGroupInfo
} from '../../utils/spaceGroupExtinctionEngine';
import { CrystalSystem, PeakReflection } from './PawleyLeBailTypes';

interface SpaceGroupExtinctionTesterProps {
  system: CrystalSystem;
  reflections: PeakReflection[];
  currentSpaceGroup?: string;
  onApplySpaceGroup?: (sg: SpaceGroupInfo) => void;
}

export const SpaceGroupExtinctionTester: React.FC<SpaceGroupExtinctionTesterProps> = ({
  system,
  reflections,
  currentSpaceGroup,
  onApplySpaceGroup
}) => {
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<SpaceGroupCandidate | null>(null);

  const candidates = useMemo(() => {
    const formatted = reflections.map(r => ({
      hkl: [r.h, r.k, r.l] as [number, number, number],
      twoTheta: r.twoTheta,
      intensity: r.intensity
    }));
    return evaluateSpaceGroupCandidates(formatted, system);
  }, [reflections, system]);

  const filteredCandidates = useMemo(() => {
    if (!search) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(
      c =>
        c.spaceGroup.symbol.toLowerCase().includes(q) ||
        c.spaceGroup.number.toString().includes(q) ||
        c.spaceGroup.pointGroup.toLowerCase().includes(q) ||
        c.spaceGroup.bravais.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  return (
    <div className="space-y-5">
      {/* Header Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Space Group Extinction &amp; Systematic Absence Discriminator</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Tests active {reflections.length} reflections from the current decomposition against Bravais centering, glide-plane, and screw-axis conditions to rank candidate space groups.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Filter (e.g. Fd-3m, Pbnm, 227)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono outline-none focus:border-cyan-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Candidate List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              {system} Candidates ({filteredCandidates.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Ranked by Extinction Compatibility
            </span>
          </div>

          <div className="overflow-y-auto max-h-96 divide-y divide-slate-800/70">
            {filteredCandidates.map(c => {
              const isSelected =
                selectedCandidate?.spaceGroup.symbol === c.spaceGroup.symbol &&
                selectedCandidate?.spaceGroup.number === c.spaceGroup.number;
              const isCurrent =
                currentSpaceGroup?.toLowerCase() === c.spaceGroup.symbol.toLowerCase();
              const isPerfect = c.compatibilityScore === 100;

              return (
                <div
                  key={`${c.spaceGroup.number}-${c.spaceGroup.symbol}`}
                  onClick={() => setSelectedCandidate(c)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-900 border-l-2 border-l-cyan-400'
                      : 'hover:bg-slate-900/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-8 rounded-lg flex items-center justify-center font-mono tabular-nums font-bold text-xs ${
                        isPerfect
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      #{c.spaceGroup.number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {c.spaceGroup.symbol}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                            ACTIVE
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {c.spaceGroup.pointGroup} · Bravais {c.spaceGroup.bravais}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {c.spaceGroup.centeringDescription}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono tabular-nums">
                      <div
                        className={`text-xs font-bold ${
                          isPerfect
                            ? 'text-emerald-400'
                            : c.compatibilityScore > 80
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {c.compatibilityScore.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.allowedCount} ok / {c.extinctCount} ext
                      </div>
                    </div>

                    {isPerfect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Space Group Detail Inspector */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-4 flex flex-col justify-between">
          {selectedCandidate ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                    Space Group Specification
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white">
                    {selectedCandidate.spaceGroup.symbol} (#{selectedCandidate.spaceGroup.number})
                  </h3>
                </div>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono">
                  {selectedCandidate.spaceGroup.pointGroup}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                    Symmetry &amp; Lattice Type
                  </span>
                  <p className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                    {selectedCandidate.spaceGroup.centeringDescription}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                    Systematic Absence Conditions
                  </span>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 font-mono text-cyan-300">
                    {selectedCandidate.spaceGroup.extinctionRules.general && (
                      <div>General: {selectedCandidate.spaceGroup.extinctionRules.general}</div>
                    )}
                    {selectedCandidate.spaceGroup.extinctionRules.zonal && (
                      <div>Zonal Glides: {selectedCandidate.spaceGroup.extinctionRules.zonal.join(', ')}</div>
                    )}
                    {selectedCandidate.spaceGroup.extinctionRules.serial && (
                      <div>Serial Screws: {selectedCandidate.spaceGroup.extinctionRules.serial.join(', ')}</div>
                    )}
                  </div>
                </div>

                {selectedCandidate.violations.length > 0 && (
                  <div>
                    <span className="text-[10px] text-rose-400 font-mono uppercase block mb-1">
                      Extinct Reflections Present ({selectedCandidate.violations.length})
                    </span>
                    <div className="max-h-28 overflow-y-auto bg-slate-900 p-2 rounded-lg border border-rose-900/50 space-y-1 font-mono tabular-nums text-[11px]">
                      {selectedCandidate.violations.map((v, i) => (
                        <div key={i} className="text-rose-300 flex items-center justify-between gap-2">
                          <span>
                            ({v.hkl.join(' ')}) @ {v.twoTheta?.toFixed(2)}°
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{v.rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onApplySpaceGroup?.(selectedCandidate.spaceGroup)}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                Apply {selectedCandidate.spaceGroup.symbol} Reflection Basis
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600" />
              <p className="text-xs">
                Select any candidate space group on the left to inspect glide planes, screw axes, and systematically absent reflections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
