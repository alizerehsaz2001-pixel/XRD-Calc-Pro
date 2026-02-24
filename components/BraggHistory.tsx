import React from 'react';
import { BraggHistoryItem } from '../types';
import { History, Clock, ArrowUpRight, Trash2 } from 'lucide-react';

interface BraggHistoryProps {
  history: BraggHistoryItem[];
  onRestore: (item: BraggHistoryItem) => void;
  onClear: () => void;
}

export const BraggHistory: React.FC<BraggHistoryProps> = ({ history, onRestore, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Calculation History
          </h3>
        </div>
        <button 
          onClick={onClear}
          className="text-[10px] text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        {history.map((item, index) => (
          <div 
            key={`${item.id}-${index}`}
            onClick={() => onRestore(item)}
            className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(item.timestamp).toLocaleTimeString()}
              </div>
              <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Wavelength</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.wavelength} Å</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Peaks</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                  {item.results.length} found
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
