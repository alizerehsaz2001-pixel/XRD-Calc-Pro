import React, { useState, useMemo } from 'react';
import { BraggHistoryItem } from '../types';
import { History, Clock, ArrowUpRight, Trash2, Search, X, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BraggHistoryProps {
  history: BraggHistoryItem[];
  onRestore: (item: BraggHistoryItem) => void;
  onClear: () => void;
}

export const BraggHistory: React.FC<BraggHistoryProps> = ({ history, onRestore, onClear }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase().trim();
    return history.filter(item => {
      const sampleIdMatch = item.sampleId ? item.sampleId.toLowerCase().includes(q) : false;
      const materialMatch = item.materialName ? item.materialName.toLowerCase().includes(q) : false;
      const rawPeaksMatch = item.rawPeaks ? item.rawPeaks.toLowerCase().includes(q) : false;
      const rawHKLMatch = item.rawHKL ? item.rawHKL.toLowerCase().includes(q) : false;
      const resultHKLMatch = item.results ? item.results.some(r => r.hkl?.toLowerCase().includes(q)) : false;
      return sampleIdMatch || materialMatch || rawPeaksMatch || rawHKLMatch || resultHKLMatch;
    });
  }, [history, searchQuery]);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors space-y-3" id="bragg-history-panel">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            {t('Calculation History', 'Calculation History')}
            <span className="px-2 py-0.5 text-[10px] rounded-full font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {searchQuery.trim() ? `${filteredHistory.length}/${history.length}` : history.length}
            </span>
          </h3>
        </div>
        <button 
          onClick={onClear}
          className="text-[10px] text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
          title={t('Clear history', 'Clear history')}
        >
          <Trash2 className="w-3 h-3" />
          {t('Clear', 'Clear')}
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input 
          id="bragg-history-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search sample ID or material name...', 'Search sample ID or material name...')}
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
            title={t('Clear search filter', 'Clear search filter')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* History Items List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {filteredHistory.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('No history matching', 'No history matching')} "<span className="font-bold text-slate-700 dark:text-slate-300">{searchQuery}</span>"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline transition-colors"
            >
              {t('Reset filter', 'Reset filter')}
            </button>
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <div 
              key={`${item.id}-${index}`}
              onClick={() => onRestore(item)}
              className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-0.5 max-w-[85%]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.sampleId ? (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {item.sampleId}
                      </span>
                    ) : (
                      <span className="text-xs italic text-slate-400 dark:text-slate-500">
                        {t('Unlabeled Sample', 'Unlabeled Sample')}
                      </span>
                    )}

                    {item.materialName && item.materialName !== item.sampleId && (
                      <span className="px-1.5 py-0.2 text-[9px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-md flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />
                        {item.materialName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-[9.5px] font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('Wavelength', 'Wavelength')}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.wavelength} Å</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('Reflections', 'Reflections')}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                    {item.results?.length || 0} {t('peaks', 'peaks')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

