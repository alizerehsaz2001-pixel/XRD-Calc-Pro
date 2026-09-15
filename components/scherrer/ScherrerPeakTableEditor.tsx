import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpDown, Percent, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerInput } from '../../types';

interface ScherrerPeakTableEditorProps {
  peaks: ScherrerInput[];
  onChange: (peaks: ScherrerInput[]) => void;
  wavelength: number;
}

export const ScherrerPeakTableEditor: React.FC<ScherrerPeakTableEditorProps> = ({
  peaks,
  onChange,
  wavelength
}) => {
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newIntensity, setNewIntensity] = useState<string>('100');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');

  const handleAddPeak = () => {
    const tt = parseFloat(newTwoTheta);
    const f = parseFloat(newFwhm);
    const intens = parseFloat(newIntensity) || 100;
    
    if (isNaN(tt) || tt <= 0 || tt >= 180 || isNaN(f) || f <= 0) return;

    let hkl: [number, number, number] | undefined = undefined;
    const h = parseInt(newH, 10);
    const k = parseInt(newK, 10);
    const l = parseInt(newL, 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      hkl = [h, k, l];
    }

    const updated = [...peaks, { twoTheta: tt, fwhmObs: f, intensity: intens, hkl }];
    onChange(updated);

    // Reset inputs
    setNewTwoTheta('');
    setNewFwhm('');
    setNewIntensity('100');
    setNewH('');
    setNewK('');
    setNewL('');
  };

  const handleUpdateRow = (index: number, field: string, val: string) => {
    const updated = [...peaks];
    const peak = { ...updated[index] };

    if (field === 'twoTheta') peak.twoTheta = parseFloat(val) || 0;
    if (field === 'fwhmObs') peak.fwhmObs = parseFloat(val) || 0;
    if (field === 'intensity') peak.intensity = parseFloat(val) || 0;
    if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = peak.hkl || [0, 0, 0];
      const h = field === 'h' ? (parseInt(val, 10) || 0) : currentHkl[0];
      const k = field === 'k' ? (parseInt(val, 10) || 0) : currentHkl[1];
      const l = field === 'l' ? (parseInt(val, 10) || 0) : currentHkl[2];
      peak.hkl = [h, k, l];
    }

    updated[index] = peak;
    onChange(updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = peaks.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleSortByTwoTheta = () => {
    const sorted = [...peaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onChange(sorted);
  };

  const handleNormalizeIntensities = () => {
    if (peaks.length === 0) return;
    const maxI = Math.max(...peaks.map(p => p.intensity || 100));
    if (maxI <= 0) return;
    const normalized = peaks.map(p => ({
      ...p,
      intensity: Math.round(((p.intensity || 100) / maxI) * 100)
    }));
    onChange(normalized);
  };

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Reflections: {peaks.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSortByTwoTheta}
            disabled={peaks.length < 2}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Sort peaks in ascending 2θ order"
          >
            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            Sort 2θ
          </button>
          <button
            type="button"
            onClick={handleNormalizeIntensities}
            disabled={peaks.length === 0}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Normalize peak intensities to 100% maximum"
          >
            <Percent className="w-3 h-3 text-emerald-400" />
            Norm I%
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60 max-h-[260px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[9px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">#</th>
              <th className="py-2 px-2">2θ [°]</th>
              <th className="py-2 px-2">FWHM [°]</th>
              <th className="py-2 px-2">I [%]</th>
              <th className="py-2 px-2">d [Å]</th>
              <th className="py-2 px-2">hkl</th>
              <th className="py-2 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            <AnimatePresence initial={false}>
              {peaks.map((p, idx) => {
                const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
                const sinTheta = Math.sin(thetaRad);
                const dSpacing = sinTheta > 0 && wavelength > 0 ? (wavelength / (2 * sinTheta)).toFixed(3) : '-';

                return (
                  <motion.tr 
                    key={`peak-${idx}-${p.twoTheta}`}
                    initial={{ opacity: 0, y: -5, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                    exit={{ opacity: 0, scale: 0.95, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-900/60 transition-colors border-b border-slate-800/40 last:border-0"
                  >
                    <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px] font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="0.001"
                        value={p.twoTheta || ''}
                        onChange={(e) => handleUpdateRow(idx, 'twoTheta', e.target.value)}
                        className="w-16 bg-slate-950/60 border border-slate-700/60 rounded-md px-1.5 py-1 text-indigo-300 font-mono text-[11px] font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="0.001"
                        value={p.fwhmObs || ''}
                        onChange={(e) => handleUpdateRow(idx, 'fwhmObs', e.target.value)}
                        className="w-16 bg-slate-950/60 border border-slate-700/60 rounded-md px-1.5 py-1 text-amber-300 font-mono text-[11px] font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        step="1"
                        value={p.intensity ?? 100}
                        onChange={(e) => handleUpdateRow(idx, 'intensity', e.target.value)}
                        className="w-14 bg-slate-950/60 border border-slate-700/60 rounded-md px-1.5 py-1 text-slate-300 font-mono text-[11px] font-bold focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/30 transition-all shadow-inner"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-slate-400 text-[11px] font-bold">{dSpacing}</td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="h"
                          value={p.hkl ? p.hkl[0] : ''}
                          onChange={(e) => handleUpdateRow(idx, 'h', e.target.value)}
                          className="w-8 bg-slate-950/60 border border-slate-700/60 rounded-md px-1 py-1 text-center text-slate-300 text-[11px] font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                        />
                        <input
                          type="number"
                          placeholder="k"
                          value={p.hkl ? p.hkl[1] : ''}
                          onChange={(e) => handleUpdateRow(idx, 'k', e.target.value)}
                          className="w-8 bg-slate-950/60 border border-slate-700/60 rounded-md px-1 py-1 text-center text-slate-300 text-[11px] font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                        />
                        <input
                          type="number"
                          placeholder="l"
                          value={p.hkl ? p.hkl[2] : ''}
                          onChange={(e) => handleUpdateRow(idx, 'l', e.target.value)}
                          className="w-8 bg-slate-950/60 border border-slate-700/60 rounded-md px-1 py-1 text-center text-slate-300 text-[11px] font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {peaks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  No reflection peaks entered yet. Use the quick-add bar below or switch to CSV mode.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Add Row Form */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
          <Plus className="w-4 h-4 text-indigo-400" /> Add:
        </span>
        <input
          type="number"
          placeholder="2θ [°]"
          step="0.001"
          value={newTwoTheta}
          onChange={(e) => setNewTwoTheta(e.target.value)}
          className="w-20 bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner"
        />
        <input
          type="number"
          placeholder="FWHM [°]"
          step="0.001"
          value={newFwhm}
          onChange={(e) => setNewFwhm(e.target.value)}
          className="w-20 bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-amber-500 shadow-inner"
        />
        <input
          type="number"
          placeholder="I [%]"
          value={newIntensity}
          onChange={(e) => setNewIntensity(e.target.value)}
          className="w-16 bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-slate-500 shadow-inner"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="h"
            value={newH}
            onChange={(e) => setNewH(e.target.value)}
            className="w-10 bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-center text-slate-300 font-mono font-bold placeholder:text-slate-600 shadow-inner"
          />
          <input
            type="number"
            placeholder="k"
            value={newK}
            onChange={(e) => setNewK(e.target.value)}
            className="w-10 bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-center text-slate-300 font-mono font-bold placeholder:text-slate-600 shadow-inner"
          />
          <input
            type="number"
            placeholder="l"
            value={newL}
            onChange={(e) => setNewL(e.target.value)}
            className="w-10 bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-center text-slate-300 font-mono font-bold placeholder:text-slate-600 shadow-inner"
          />
        </div>
        <button
          type="button"
          onClick={handleAddPeak}
          disabled={!newTwoTheta || !newFwhm}
          className="px-4 py-1.5 ml-auto sm:ml-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Peak
        </button>
      </div>
    </div>
  );
};
