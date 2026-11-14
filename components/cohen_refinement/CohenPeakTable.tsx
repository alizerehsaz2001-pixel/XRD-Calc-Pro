import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, FileText, AlertTriangle, Eye, Zap, Filter, Tag, Wand2 } from 'lucide-react';
import { CrystalSystem, PeakInput } from './CohenPresetsDb';
import { CohenPeakDetail, suggestBestHklForPeak } from './CohenSolver';

interface CohenPeakTableProps {
  peaks: PeakInput[];
  peakDetails?: CohenPeakDetail[];
  crystalSystem?: CrystalSystem;
  wavelength?: number;
  refinedLattice?: { a: number; b: number; c: number; alphaDeg?: number; betaDeg?: number; gammaDeg?: number };
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
  crystalSystem = 'Cubic',
  wavelength = 1.54056,
  refinedLattice = { a: 5.431, b: 5.431, c: 5.431 },
  onUpdatePeak,
  onDeletePeak,
  onAddPeak,
  onClearAll,
  onOpenBulkModal,
  onOpenImportModal,
  activeBraggCount = 0,
  precision = 4
}) => {
  const [newH, setNewH] = useState<number>(1);
  const [newK, setNewK] = useState<number>(1);
  const [newL, setNewL] = useState<number>(1);
  const [newTwoTheta, setNewTwoTheta] = useState<string>('30.00');
  const [newIntensity, setNewIntensity] = useState<number>(100);
  const [displayMode, setDisplayMode] = useState<'angles' | 'dSpacing'>('angles');
  const [sortBy, setSortBy] = useState<'twoTheta' | 'residual' | 'cooks' | 'loo'>('twoTheta');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const safePeakDetails = Array.isArray(peakDetails) ? peakDetails : [];
  const safePeaks = Array.isArray(peaks) ? peaks : [];

  const detailMap = new Map<string, CohenPeakDetail>();
  safePeakDetails.forEach(p => detailMap.set(p.id, p));

  const handleAutoIndexNewPeak = () => {
    const tt = parseFloat(newTwoTheta);
    if (isNaN(tt) || tt <= 0 || tt >= 180) return;
    const suggested = suggestBestHklForPeak(tt, wavelength, crystalSystem, refinedLattice);
    setNewH(suggested.h);
    setNewK(suggested.k);
    setNewL(suggested.l);
  };

  const handleAutoIndexRow = (p: PeakInput) => {
    const suggested = suggestBestHklForPeak(p.twoTheta, p.wavelength || wavelength, crystalSystem, refinedLattice);
    onUpdatePeak(p.id, 'h', suggested.h);
    onUpdatePeak(p.id, 'k', suggested.k);
    onUpdatePeak(p.id, 'l', suggested.l);
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tt = parseFloat(newTwoTheta);
    if (isNaN(tt) || tt <= 0 || tt >= 180) return;

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
    safePeaks.forEach(p => onUpdatePeak(p.id, 'enabled', enable));
  };

  const handleDisableOutliers = () => {
    safePeakDetails.forEach(p => {
      if (p.isOutlier || Math.abs(p.deltaTwoTheta) > 0.04) {
        onUpdatePeak(p.id, 'enabled', false);
      }
    });
  };

  const handleEnableHighAngleOnly = () => {
    safePeaks.forEach(p => onUpdatePeak(p.id, 'enabled', p.twoTheta >= 50));
  };

  const handleToggleDoubletWavelength = (id: string, currentWavelength?: number) => {
    if (!currentWavelength || Math.abs(currentWavelength - 1.54056) < 0.0001) {
      onUpdatePeak(id, 'wavelength', 1.54439);
    } else {
      onUpdatePeak(id, 'wavelength', 1.54056);
    }
  };

  const sortedPeaks = [...safePeaks].sort((a, b) => {
    if (sortBy === 'twoTheta') return sortAsc ? a.twoTheta - b.twoTheta : b.twoTheta - a.twoTheta;
    if (sortBy === 'residual') {
      const resA = Math.abs(detailMap.get(a.id)?.deltaTwoTheta || 0);
      const resB = Math.abs(detailMap.get(b.id)?.deltaTwoTheta || 0);
      return sortAsc ? resA - resB : resB - resA;
    }
    if (sortBy === 'cooks') {
      const cA = detailMap.get(a.id)?.cooksDistance || 0;
      const cB = detailMap.get(b.id)?.cooksDistance || 0;
      return sortAsc ? cA - cB : cB - cA;
    }
    if (sortBy === 'loo') {
      const lA = Math.abs(detailMap.get(a.id)?.looDeltaA || 0);
      const lB = Math.abs(detailMap.get(b.id)?.looDeltaA || 0);
      return sortAsc ? lA - lB : lB - lA;
    }
    return 0;
  });

  const outlierCount = safePeakDetails.filter(p => p.isOutlier || Math.abs(p.deltaTwoTheta) > 0.04).length;
  const enabledCount = safePeaks.filter(p => p.enabled !== false).length;

  return (
    <div className="space-y-4">
      {/* Quick Add / Manual Entry Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-500" />
              Add &amp; Auto-Index Reflection Peak
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Enter observed 2θ and use Auto-HKL to match closest Miller plane against refined reciprocal metric tensor [G*]
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeBraggCount > 0 && (
              <button
                type="button"
                onClick={onOpenImportModal}
                className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Import Active Bragg ({activeBraggCount})
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBulkModal}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              Paste Bulk Data
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Preset
            </button>
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              2θ Observed (°)
            </label>
            <input
              type="number"
              step="0.001"
              value={newTwoTheta}
              onChange={(e) => setNewTwoTheta(e.target.value)}
              className="w-full px-3 py-2 bg-cyan-50/50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 rounded-lg text-sm font-bold font-mono tabular-nums text-cyan-700 dark:text-cyan-300 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Miller <i>h</i>
            </label>
            <input
              type="number"
              value={newH}
              onChange={(e) => setNewH(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center font-mono tabular-nums focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Miller <i>k</i>
            </label>
            <input
              type="number"
              value={newK}
              onChange={(e) => setNewK(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center font-mono tabular-nums focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Miller <i>l</i>
            </label>
            <input
              type="number"
              value={newL}
              onChange={(e) => setNewL(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center font-mono tabular-nums focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Intensity (%)
            </label>
            <input
              type="number"
              value={newIntensity}
              onChange={(e) => setNewIntensity(parseFloat(e.target.value) || 100)}
              className="w-full px-2.5 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center font-mono tabular-nums focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleAutoIndexNewPeak}
              className="w-full px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
              title="Suggest closest (hkl) for entered 2θ"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Auto-HKL
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Peak
            </button>
          </div>
        </form>
      </div>

      {/* Main Reflections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col lg:flex-row justify-between lg:items-center gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              Diffraction Reflections Matrix ({peaks.length} Total, {enabledCount} Active)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect apparent a<sub>app</sub>, angular/d-spacing residuals, Hat leverage h<sub>ii</sub>, Cook&apos;s D<sub>i</sub>, and Leave-One-Out Δa<sub>(−i)</sub>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {outlierCount > 0 && (
              <button
                type="button"
                onClick={handleDisableOutliers}
                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 hover:bg-amber-100"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Mask Outliers ({outlierCount})
              </button>
            )}

            <button
              type="button"
              onClick={handleEnableHighAngleOnly}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5 text-cyan-500" />
              High-Angle (≥50°)
            </button>

            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 hover:bg-slate-50"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-500" />
              Enable All
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setDisplayMode('angles')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  displayMode === 'angles' ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                2θ (°)
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('dSpacing')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  displayMode === 'dSpacing' ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                d (Å) &amp; ppm
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <span className="text-[10px] text-slate-400 px-1 font-bold uppercase">Sort:</span>
              {(
                [
                  { id: 'twoTheta', label: '2θ' },
                  { id: 'residual', label: '|Δ2θ|' },
                  { id: 'cooks', label: "Cook's D" },
                  { id: 'loo', label: 'LOO Δa' }
                ] as const
              ).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSortBy(s.id); setSortAsc(!sortAsc); }}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    sortBy === s.id ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5 w-10 text-center">Use</th>
                <th className="p-2.5 w-8 text-center">#</th>
                <th className="p-2.5">Miller (<i>h k l</i>)</th>
                {displayMode === 'angles' ? (
                  <>
                    <th className="p-2.5">2θ<sub>Obs</sub> (°)</th>
                    <th className="p-2.5">2θ<sub>Calc</sub> (°)</th>
                    <th className="p-2.5">Δ2θ (°)</th>
                  </>
                ) : (
                  <>
                    <th className="p-2.5">d<sub>Obs</sub> (Å)</th>
                    <th className="p-2.5">d<sub>Calc</sub> (Å)</th>
                    <th className="p-2.5">Δd/d (ppm)</th>
                  </>
                )}
                <th className="p-2.5">a<sub>app</sub> (Å)</th>
                <th className="p-2.5">LOO Δa (mÅ)</th>
                <th className="p-2.5">Weight / h<sub>ii</sub></th>
                <th className="p-2.5">Cook&apos;s D<sub>i</sub></th>
                <th className="p-2.5">Anode</th>
                <th className="p-2.5 text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums">
              <AnimatePresence initial={false}>
                {sortedPeaks.map((p, idx) => {
                  const detail = detailMap.get(p.id);
                  const isEnabled = p.enabled !== false;
                  const delta2Th = detail ? detail.deltaTwoTheta : 0;
                  const deltaDPpm = detail?.deltaDPpm || 0;
                  const isOutlier = Boolean(detail?.isOutlier);
                  const isKa2 = p.wavelength && Math.abs(p.wavelength - 1.54439) < 0.0001;
                  const looMilli = detail ? detail.looDeltaA * 1000 : 0;

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
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => onUpdatePeak(p.id, 'enabled', e.target.checked)}
                          className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                        />
                      </td>

                      <td className="p-2.5 text-center text-slate-400 dark:text-slate-500 font-bold">
                        {idx + 1}
                      </td>

                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={p.h}
                            onChange={(e) => onUpdatePeak(p.id, 'h', parseInt(e.target.value) || 0)}
                            className="w-9 px-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300"
                          />
                          <input
                            type="number"
                            value={p.k}
                            onChange={(e) => onUpdatePeak(p.id, 'k', parseInt(e.target.value) || 0)}
                            className="w-9 px-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300"
                          />
                          <input
                            type="number"
                            value={p.l}
                            onChange={(e) => onUpdatePeak(p.id, 'l', parseInt(e.target.value) || 0)}
                            className="w-9 px-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleAutoIndexRow(p)}
                            className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded"
                            title="Auto-suggest closest (hkl) for this peak's 2θ"
                          >
                            <Wand2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {displayMode === 'angles' ? (
                        <>
                          <td className="p-2.5 font-bold">
                            <input
                              type="number"
                              step="0.001"
                              value={p.twoTheta}
                              onChange={(e) => onUpdatePeak(p.id, 'twoTheta', parseFloat(e.target.value) || 30)}
                              className="w-22 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-cyan-700 dark:text-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                          </td>

                          <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                            {detail ? detail.twoThetaCalc.toFixed(Math.min(precision, 4)) : '-'}
                          </td>

                          <td className="p-2.5 font-bold">
                            {detail ? (
                              <span className={Math.abs(delta2Th) < 0.015 ? 'text-emerald-600 dark:text-emerald-400' : Math.abs(delta2Th) < 0.04 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                                {delta2Th > 0 ? `+${delta2Th.toFixed(4)}` : delta2Th.toFixed(4)}°
                              </span>
                            ) : '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">
                            {detail?.dObs ? detail.dObs.toFixed(5) : '-'}
                          </td>
                          <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                            {detail?.dCalc ? detail.dCalc.toFixed(5) : '-'}
                          </td>
                          <td className="p-2.5 font-bold">
                            {detail ? (
                              <span className={Math.abs(deltaDPpm) < 150 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                {deltaDPpm > 0 ? `+${deltaDPpm.toFixed(1)}` : deltaDPpm.toFixed(1)} ppm
                              </span>
                            ) : '-'}
                          </td>
                        </>
                      )}

                      <td className="p-2.5 text-slate-700 dark:text-slate-300 font-bold">
                        {detail?.apparentA ? detail.apparentA.toFixed(5) : '-'}
                      </td>

                      <td className="p-2.5 text-[11px]">
                        {detail ? (
                          <span className={Math.abs(looMilli) > 0.5 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'}>
                            {looMilli > 0 ? `+${looMilli.toFixed(3)}` : looMilli.toFixed(3)}
                          </span>
                        ) : '-'}
                      </td>

                      <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        {detail ? `${detail.weight.toFixed(2)} / ${detail.leverageHii.toFixed(2)}` : '-'}
                      </td>

                      <td className="p-2.5 text-[11px]">
                        {detail ? (
                          <span className={detail.cooksDistance > 0.5 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500'}>
                            {detail.cooksDistance.toFixed(3)}
                          </span>
                        ) : '-'}
                      </td>

                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleDoubletWavelength(p.id, p.wavelength)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border flex items-center gap-1 transition-colors ${
                            isKa2
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                          title="Toggle Cu Ka1 (1.54056 Å) / Cu Ka2 (1.54439 Å)"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{isKa2 ? 'Kα₂' : 'Kα₁'}</span>
                        </button>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onDeletePeak(p.id)}
                          disabled={peaks.length <= 2}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors disabled:opacity-30"
                          title="Delete Reflection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
