import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ArrowUpDown, FileText, Check, AlertTriangle, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';
import { PeakInput } from './CohenPresetsDb';

interface PeakDetail {
  id: string;
  twoTheta: number;
  twoThetaCalc: number;
  deltaTwoTheta: number;
  h: number;
  k: number;
  l: number;
  sin2Obs: number;
  sin2Calc: number;
  driftVal: number;
  residualSin2: number;
  intensity?: number;
  enabled?: boolean;
}

interface CohenPeakTableProps {
  peaks: PeakInput[];
  peakDetails?: PeakDetail[];
  onUpdatePeak: (id: string, field: keyof PeakInput, value: any) => void;
  onDeletePeak: (id: string) => void;
  onAddPeak: (peak: Partial<PeakInput>) => void;
  onClearAll: () => void;
  onOpenBulkModal: () => void;
  onOpenImportModal: () => void;
  activeBraggCount?: number;
  precision?: number;
}

export const CohenPeakTable: React.FC<CohenPeakTableProps> = ({
  peaks = [],
  peakDetails = [],
  onUpdatePeak,
  onDeletePeak,
  onAddPeak,
  onClearAll,
  onOpenBulkModal,
  onOpenImportModal,
  activeBraggCount = 0,
  precision = 4
}) => {
  // New Peak Form State
  const [newH, setNewH] = useState<number>(1);
  const [newK, setNewK] = useState<number>(1);
  const [newL, setNewL] = useState<number>(1);
  const [newTwoTheta, setNewTwoTheta] = useState<string>('30.00');
  const [newIntensity, setNewIntensity] = useState<number>(100);

  // Sorting
  const [sortBy, setSortBy] = useState<'twoTheta' | 'residual' | 'intensity'>('twoTheta');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const safePeakDetails = Array.isArray(peakDetails) ? peakDetails : [];
  const safePeaks = Array.isArray(peaks) ? peaks : [];

  // Details map for easy lookup
  const detailMap = new Map<string, PeakDetail>();
  safePeakDetails.forEach(p => detailMap.set(p.id, p));

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tt = parseFloat(newTwoTheta);
    if (isNaN(tt) || tt <= 0 || tt >= 180) {
      alert('Please enter a valid 2θ angle between 0° and 180°.');
      return;
    }

    onAddPeak({
      twoTheta: tt,
      h: newH,
      k: newK,
      l: newL,
      intensity: newIntensity,
      enabled: true
    });

    setNewTwoTheta((tt + 5).toFixed(2));
  };

  const handleToggleAll = (enable: boolean) => {
    safePeaks.forEach(p => {
      onUpdatePeak(p.id, 'enabled', enable);
    });
  };

  const handleDisableOutliers = () => {
    safePeakDetails.forEach(p => {
      if (Math.abs(p.deltaTwoTheta) > 0.05) {
        onUpdatePeak(p.id, 'enabled', false);
      }
    });
  };

  const sortedPeaks = [...safePeaks].sort((a, b) => {
    if (sortBy === 'twoTheta') {
      return sortAsc ? a.twoTheta - b.twoTheta : b.twoTheta - a.twoTheta;
    }
    if (sortBy === 'intensity') {
      return sortAsc ? (a.intensity || 0) - (b.intensity || 0) : (b.intensity || 0) - (a.intensity || 0);
    }
    if (sortBy === 'residual') {
      const resA = Math.abs(detailMap.get(a.id)?.deltaTwoTheta || 0);
      const resB = Math.abs(detailMap.get(b.id)?.deltaTwoTheta || 0);
      return sortAsc ? resA - resB : resB - resA;
    }
    return 0;
  });

  const outlierCount = safePeakDetails.filter(p => Math.abs(p.deltaTwoTheta) > 0.05).length;
  const enabledCount = safePeaks.filter(p => p.enabled !== false).length;

  return (
    <div className="space-y-4">
      {/* Quick Add / Manual Entry Card */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Add Reflection Peak
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter $(h, k, l)$ Miller indices and observed $2\theta$ diffraction position
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeBraggCount > 0 && (
              <button
                type="button"
                onClick={onOpenImportModal}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Import Active Bragg ({activeBraggCount})
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBulkModal}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Paste Bulk Data
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Peaks
            </button>
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
              Miller <i>h</i>
            </label>
            <input
              type="number"
              value={newH}
              onChange={(e) => setNewH(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
              Miller <i>k</i>
            </label>
            <input
              type="number"
              value={newK}
              onChange={(e) => setNewK(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
              Miller <i>l</i>
            </label>
            <input
              type="number"
              value={newL}
              onChange={(e) => setNewL(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
              2θ Observed (°)
            </label>
            <input
              type="number"
              step="0.001"
              value={newTwoTheta}
              onChange={(e) => setNewTwoTheta(e.target.value)}
              className="w-full px-3 py-2 bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-sm font-black font-mono text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
              Intensity (%)
            </label>
            <input
              type="number"
              value={newIntensity}
              onChange={(e) => setNewIntensity(parseFloat(e.target.value) || 100)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Main Reflections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                Diffraction Reflection Peaks ({peaks.length} Peaks, {enabledCount} Active)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle reflections on/off to isolate outliers and observe real-time parameter convergence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {outlierCount > 0 && (
              <button
                type="button"
                onClick={handleDisableOutliers}
                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-lg flex items-center gap-1"
                title="Disable peaks with |Δ2θ| > 0.05°"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Exclude Outliers ({outlierCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              Enable All
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <span className="text-[10px] text-slate-400 px-1 font-bold uppercase">Sort:</span>
              <button
                type="button"
                onClick={() => { setSortBy('twoTheta'); setSortAsc(!sortAsc); }}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  sortBy === 'twoTheta' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                2θ
              </button>
              <button
                type="button"
                onClick={() => { setSortBy('residual'); setSortAsc(!sortAsc); }}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  sortBy === 'residual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                |Δ2θ|
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">Active</th>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">HKL (<i>h</i>, <i>k</i>, <i>l</i>)</th>
                <th className="p-3">2θ<sub>Obs</sub> (°)</th>
                <th className="p-3">2θ<sub>Calc</sub> (°)</th>
                <th className="p-3">Δ2θ (°)</th>
                <th className="p-3">sin²θ<sub>Obs</sub></th>
                <th className="p-3">Drift <i>f</i>(θ)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              <AnimatePresence initial={false}>
                {sortedPeaks.map((p, idx) => {
                  const detail = detailMap.get(p.id);
                  const isEnabled = p.enabled !== false;
                  const delta2Th = detail ? detail.deltaTwoTheta : 0;
                  const isOutlier = Math.abs(delta2Th) > 0.05;

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`transition-colors ${
                        !isEnabled
                          ? 'opacity-40 bg-slate-50/50 dark:bg-slate-950/30 line-through'
                          : isOutlier
                          ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Toggle Active Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => onUpdatePeak(p.id, 'enabled', e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                          title={isEnabled ? 'Click to exclude from refinement' : 'Click to include in refinement'}
                        />
                      </td>

                      <td className="p-3 text-center text-slate-400 dark:text-slate-500 font-bold">
                        {idx + 1}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={p.h}
                            onChange={(e) => onUpdatePeak(p.id, 'h', parseInt(e.target.value) || 0)}
                            className="w-10 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                          />
                          <input
                            type="number"
                            value={p.k}
                            onChange={(e) => onUpdatePeak(p.id, 'k', parseInt(e.target.value) || 0)}
                            className="w-10 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                          />
                          <input
                            type="number"
                            value={p.l}
                            onChange={(e) => onUpdatePeak(p.id, 'l', parseInt(e.target.value) || 0)}
                            className="w-10 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                          />
                        </div>
                      </td>

                      <td className="p-3 font-bold">
                        <input
                          type="number"
                          step="0.001"
                          value={p.twoTheta}
                          onChange={(e) => onUpdatePeak(p.id, 'twoTheta', parseFloat(e.target.value) || 30)}
                          className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-indigo-700 dark:text-indigo-400 shadow-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </td>

                      <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                        {detail ? detail.twoThetaCalc.toFixed(Math.min(precision, 3)) : '-'}
                      </td>

                      <td className="p-3 font-bold">
                        {detail ? (
                          <div className="flex items-center gap-2">
                            <span className={Math.abs(delta2Th) < 0.02 ? 'text-emerald-600 dark:text-emerald-400' : Math.abs(delta2Th) < 0.05 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                              {delta2Th > 0 ? `+${delta2Th.toFixed(4)}` : delta2Th.toFixed(4)}
                            </span>
                            <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex items-center relative">
                              <div className="w-0.5 h-full bg-slate-400 dark:bg-slate-600 absolute left-1/2 -translate-x-1/2" />
                              <div
                                className={`h-full ${delta2Th >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{
                                  width: `${Math.min(50, Math.abs(delta2Th) * 500)}%`,
                                  marginLeft: delta2Th >= 0 ? '50%' : `${50 - Math.min(50, Math.abs(delta2Th) * 500)}%`
                                }}
                              />
                            </div>
                          </div>
                        ) : '-'}
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {detail ? detail.sin2Obs.toFixed(5) : '-'}
                      </td>

                      <td className="p-3 text-slate-500">
                        {detail ? detail.driftVal.toFixed(4) : '-'}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeletePeak(p.id)}
                          disabled={peaks.length <= 2}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors disabled:opacity-30"
                          title="Delete Reflection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
