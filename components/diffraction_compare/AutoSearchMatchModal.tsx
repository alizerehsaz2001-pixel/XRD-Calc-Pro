import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Check, Database, Zap, Plus, Layers, Filter } from 'lucide-react';
import { performDatabaseSearchMatch, extractMaterialPeaks } from './compareUtils';
import { PeakItem } from './types';

interface AutoSearchMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPeaks: PeakItem[];
  sampleAName: string;
  materialsDb: any[];
  onSelectAsReferenceB: (material: any) => void;
  onSelectAsPhaseC: (material: any) => void;
}

export const AutoSearchMatchModal: React.FC<AutoSearchMatchModalProps> = ({
  isOpen,
  onClose,
  targetPeaks,
  sampleAName,
  materialsDb,
  onSelectAsReferenceB,
  onSelectAsPhaseC
}) => {
  const { t } = useTranslation();
  const [filterText, setFilterText] = useState('');
  const [crystalFilter, setCrystalFilter] = useState('all');

  const searchResults = useMemo(() => {
    if (!isOpen || targetPeaks.length === 0) return [];
    return performDatabaseSearchMatch(targetPeaks, materialsDb, 30);
  }, [isOpen, targetPeaks, materialsDb]);

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
      <div className="bg-[#080d1a] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Search className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('Search-Match Phase Identification')}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/20">
                  {targetPeaks.length} {t('target reflections')}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {t('Cross-correlating experimental peaks from')} &quot;{sampleAName}&quot; {t('against XRD database')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t('Filter candidates by name or formula...')}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:border-amber-500/50 outline-none font-medium placeholder-slate-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={crystalFilter}
              onChange={(e) => setCrystalFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2.5 rounded-xl outline-none font-mono focus:border-amber-500/50"
            >
              <option value="all">{t('All Crystal Systems')}</option>
              <option value="cubic">Cubic</option>
              <option value="hexagonal">Hexagonal</option>
              <option value="tetragonal">Tetragonal</option>
              <option value="orthorhombic">Orthorhombic</option>
              <option value="monoclinic">Monoclinic</option>
            </select>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px] scrollbar-thin scrollbar-thumb-slate-800">
          {filteredResults.length > 0 ? (
            filteredResults.map((cand, idx) => {
              const mat = cand.material;
              const peaks = extractMaterialPeaks(mat);
              const isExcellent = cand.pearsonR >= 85;
              const isGood = cand.pearsonR >= 60 && cand.pearsonR < 85;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    idx === 0
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{mat.name}</span>
                      <span className="text-xs text-indigo-300 font-mono font-bold">({mat.formula})</span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black rounded font-mono uppercase">
                          {t('Rank #1 Best Match')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span>{mat.crystalSystem || 'Unknown'}</span>
                      <span>•</span>
                      <span>SG: {mat.spaceGroup || 'N/A'}</span>
                      <span>•</span>
                      <span>{peaks.length} {t('database peaks')}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{cand.matchedPeaksCount}/{cand.totalPeaksCount} {t('matched')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Score Bar & Badge */}
                    <div className="flex flex-col items-end shrink-0 min-w-[90px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-mono">Score:</span>
                        <span className={`text-sm font-black font-mono ${
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
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center gap-1"
                        title={t('Set as Primary Reference Sample B')}
                      >
                        <Check className="w-3 h-3" />
                        <span>{t('Set Ref B')}</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectAsPhaseC(mat);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-indigo-100 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1"
                        title={t('Add as Secondary Phase C for multi-phase deconvolution')}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('+ Phase C')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 py-12 text-xs font-mono space-y-2">
              <Database className="w-8 h-8 text-slate-600" />
              <span>{t('No matching phases found for current query.')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>{t('Algorithms calculate Pearson cross-correlation, proximity weighting & intensity similarity.')}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wider transition-all"
          >
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
