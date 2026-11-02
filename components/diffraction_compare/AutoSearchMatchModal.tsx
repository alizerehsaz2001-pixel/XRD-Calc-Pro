import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Check, Database, Plus, Filter, Layers3, Sparkles } from 'lucide-react';
import { performDatabaseSearchMatch, extractMaterialPeaks } from './compareUtils';
import { PeakItem } from './types';

interface AutoSearchMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPeaks: PeakItem[];
  unmatchedPeaks?: PeakItem[];
  initialSearchMode?: 'full' | 'residual';
  sampleAName: string;
  materialsDb: any[];
  onSelectAsReferenceB: (material: any) => void;
  onSelectAsPhaseC: (material: any) => void;
  onSelectAsPhaseD?: (material: any) => void;
}

export const AutoSearchMatchModal: React.FC<AutoSearchMatchModalProps> = ({
  isOpen,
  onClose,
  targetPeaks,
  unmatchedPeaks = [],
  initialSearchMode = 'full',
  sampleAName,
  materialsDb,
  onSelectAsReferenceB,
  onSelectAsPhaseC,
  onSelectAsPhaseD
}) => {
  const { t } = useTranslation();
  const [filterText, setFilterText] = useState('');
  const [crystalFilter, setCrystalFilter] = useState('all');
  const [searchMode, setSearchMode] = useState<'full' | 'residual'>(initialSearchMode);

  useEffect(() => {
    if (isOpen) {
      setSearchMode(initialSearchMode === 'residual' && unmatchedPeaks.length > 0 ? 'residual' : 'full');
    }
  }, [isOpen, initialSearchMode, unmatchedPeaks.length]);

  const activeQueryPeaks = searchMode === 'residual' && unmatchedPeaks.length > 0
    ? unmatchedPeaks
    : targetPeaks;

  const searchResults = useMemo(() => {
    if (!isOpen || activeQueryPeaks.length === 0) return [];
    return performDatabaseSearchMatch(activeQueryPeaks, materialsDb, 30);
  }, [isOpen, activeQueryPeaks, materialsDb]);

  const filteredResults = useMemo(() => {
    return searchResults.filter(item => {
      const mat = item.material;
      const matchesText = !filterText || 
        mat.name.toLowerCase().includes(filterText.toLowerCase()) || 
        mat.formula.toLowerCase().includes(filterText.toLowerCase());
      
      const matchesCrystal = crystalFilter === 'all' || 
        (mat.crystalSystem && mat.crystalSystem.toLowerCase().includes(crystalFilter.toLowerCase()));

      return matchesText && matchesCrystal;
    });
  }, [searchResults, filterText, crystalFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#080d1a] border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col font-mono tabular-nums">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Search className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <span>{t('Hanawalt & Fink Search-Match Phase Identification')}</span>
                <span className="text-amber-400 text-xs font-mono font-normal">
                  · {activeQueryPeaks.length} {t('query reflections')}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {searchMode === 'residual'
                  ? `Searching database specifically against ${unmatchedPeaks.length} unindexed residual peak(s) in "${sampleAName}"`
                  : `Cross-correlating full experimental pattern of "${sampleAName}" against XRD reference library`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Scope Switcher: Full Pattern vs Residual Unexplained Peaks */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Layers3 className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold">Target Reflection Scope:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSearchMode('full')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                searchMode === 'full'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Pattern ({targetPeaks.length} peaks)
            </button>

            <button
              onClick={() => {
                if (unmatchedPeaks.length > 0) setSearchMode('residual');
              }}
              disabled={unmatchedPeaks.length === 0}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                unmatchedPeaks.length === 0
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : searchMode === 'residual'
                  ? 'bg-amber-600 text-white shadow-sm cursor-pointer'
                  : 'text-amber-300 hover:text-white cursor-pointer'
              }`}
              title={unmatchedPeaks.length === 0 ? 'All peaks are currently indexed by Reference B' : 'Search only unmatched impurity peaks'}
            >
              <Sparkles className="w-3 h-3" />
              <span>Residual Unmatched Only ({unmatchedPeaks.length} peaks)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t('Filter candidates by phase name or chemical formula...')}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:border-amber-500/50 outline-none placeholder-slate-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={crystalFilter}
              onChange={(e) => setCrystalFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="all">{t('All Crystal Systems')}</option>
              <option value="cubic">Cubic</option>
              <option value="hexagonal">Hexagonal</option>
              <option value="tetragonal">Tetragonal</option>
              <option value="orthorhombic">Orthorhombic</option>
              <option value="monoclinic">Monoclinic</option>
              <option value="trigonal">Trigonal</option>
            </select>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[400px] scrollbar-thin scrollbar-thumb-slate-800">
          {filteredResults.length > 0 ? (
            filteredResults.map((cand, idx) => {
              const mat = cand.material;
              const peaks = extractMaterialPeaks(mat);
              const isExcellent = cand.pearsonR >= 80;
              const isGood = cand.pearsonR >= 55 && cand.pearsonR < 80;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    idx === 0
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{mat.name}</span>
                      <span className="text-xs text-indigo-300 font-bold">({mat.formula})</span>
                      {idx === 0 && (
                        <span className="text-amber-400 text-[10px] font-bold uppercase">
                          · {t('Rank #1 Best Candidate')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 flex-wrap">
                      <span>{mat.crystalSystem || 'Crystalline'}</span>
                      <span>·</span>
                      <span>SG: {mat.spaceGroup || 'N/A'}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">{cand.matchedPeaksCount}/{cand.totalPeaksCount} {t('peaks matched')}</span>
                      {cand.hanawaltScore !== undefined && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-300">Hanawalt Top-3: {cand.hanawaltScore}%</span>
                        </>
                      )}
                      {cand.estimatedRir !== undefined && (
                        <>
                          <span>·</span>
                          <span className="text-purple-300">RIR: {cand.estimatedRir.toFixed(1)}</span>
                        </>
                      )}
                      {cand.meanDeltaTwoTheta !== undefined && cand.matchedPeaksCount > 0 && (
                        <>
                          <span>·</span>
                          <span>⟨|Δ2θ|⟩: {cand.meanDeltaTwoTheta.toFixed(3)}°</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-3">
                    {/* Score Bar & Readout */}
                    <div className="flex flex-col items-end shrink-0 min-w-[85px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">FOM:</span>
                        <span className={`text-sm font-black ${
                          isExcellent ? 'text-emerald-400' : isGood ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {cand.pearsonR}%
                        </span>
                      </div>
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                        <div
                          style={{ width: `${cand.pearsonR}%` }}
                          className={`h-full ${
                            isExcellent ? 'bg-emerald-500' : isGood ? 'bg-amber-500' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectAsReferenceB(mat);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title={t('Set as Primary Reference Sample B')}
                      >
                        <Check className="w-3 h-3" />
                        <span>{t('Ref B')}</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectAsPhaseC(mat);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title={t('Add as Secondary Phase C for multi-phase deconvolution')}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('Phase C')}</span>
                      </button>

                      {onSelectAsPhaseD && (
                        <button
                          onClick={() => {
                            onSelectAsPhaseD(mat);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title={t('Add as Tertiary Phase D for 3-phase deconvolution')}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{t('Phase D')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 py-12 text-xs space-y-2">
              <Database className="w-8 h-8 text-slate-600" />
              <span>{t('No matching phases found for current query.')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
          <span>{t('Combines Hanawalt 3-strongest peak matching, Fink figure-of-merit, and intensity similarity.')}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
