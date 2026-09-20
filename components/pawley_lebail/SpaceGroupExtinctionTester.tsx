import React, { useState, useMemo } from 'react';
import { Compass, CheckCircle2, XCircle, Search, Filter, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import { 
  SPACE_GROUPS_DATABASE, 
  checkExtinction, 
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

  // Transform active reflections to input format for evaluator
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
    return candidates.filter(c => 
      c.spaceGroup.symbol.toLowerCase().includes(q) ||
      c.spaceGroup.number.toString().includes(q) ||
      c.spaceGroup.pointGroup.toLowerCase().includes(q) ||
      c.spaceGroup.bravais.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-slate-950 border border-indigo-500/20 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Compass className="w-4 h-4" />
            <span>Ab Initio Space Group Extinction & Systematic Absence Analyzer</span>
          </div>
          <p className="text-xs text-slate-300">
            Whole pattern decomposition extracts reflections without atomic coordinates. Systematic absences (centering, screw axes, glide planes) allow discriminating possible space groups for structure solution.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search space groups (e.g. Fd-3m, P4_2)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono outline-none focus:border-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Candidate Space Groups Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of space groups */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              Candidate Space Groups for {system} ({filteredCandidates.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Ranked by Extinction Compatibility Score
            </span>
          </div>

          <div className="overflow-y-auto max-h-96 divide-y divide-slate-800/60">
            {filteredCandidates.map((c) => {
              const isSelected = selectedCandidate?.spaceGroup.number === c.spaceGroup.number;
              const isCurrent = currentSpaceGroup?.toLowerCase() === c.spaceGroup.symbol.toLowerCase();
              const isPerfect = c.compatibilityScore === 100;

              return (
                <div
                  key={c.spaceGroup.number}
                  onClick={() => setSelectedCandidate(c)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-indigo-950/60 border-l-4 border-l-indigo-500' 
                      : 'hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isPerfect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{c.spaceGroup.number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {c.spaceGroup.symbol}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                            Current Model
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          ({c.spaceGroup.pointGroup} | Bravais {c.spaceGroup.bravais})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {c.spaceGroup.centeringDescription}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs font-mono font-bold ${
                        isPerfect ? 'text-emerald-400' : c.compatibilityScore > 80 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {c.compatibilityScore.toFixed(1)}% Match
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {c.allowedCount} allowed / {c.extinctCount} extinct
                      </div>
                    </div>

                    {isPerfect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Space Group Detail Card */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col justify-between">
          {selectedCandidate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    Selected Space Group
                  </div>
                  <h3 className="text-xl font-black font-mono text-white">
                    {selectedCandidate.spaceGroup.symbol} (#{selectedCandidate.spaceGroup.number})
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                  {selectedCandidate.spaceGroup.pointGroup}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Centering & Bravais Lattice:</span>
                  <p className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                    {selectedCandidate.spaceGroup.centeringDescription}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Systematic Extinction Rules:</span>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1 font-mono text-cyan-300">
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
                    <span className="text-rose-400 font-bold block mb-0.5">
                      Violations (Reflections Extinct in this Space Group):
                    </span>
                    <div className="max-h-28 overflow-y-auto bg-slate-900/80 p-2 rounded-lg border border-rose-900/50 space-y-1 font-mono text-[11px]">
                      {selectedCandidate.violations.map((v, i) => (
                        <div key={i} className="text-rose-300 flex items-center justify-between">
                          <span>({v.hkl.join(' ')}) @ {v.twoTheta?.toFixed(2)}°</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{v.rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onApplySpaceGroup?.(selectedCandidate.spaceGroup)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 border border-indigo-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Apply {selectedCandidate.spaceGroup.symbol} to Refinement Model
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600" />
              <p className="text-xs">
                Select any space group candidate on the left to inspect extinction conditions, glide planes, and reflection compatibility.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
