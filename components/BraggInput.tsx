
import React, { useState, useEffect, useMemo } from 'react';
import { fetchStandardWavelengths } from '../services/geminiService';
import { StandardWavelength } from '../types';
import { BraggVisualization } from './BraggVisualization';

interface BraggInputProps {
  wavelength: number;
  setWavelength: (val: number) => void;
  rawPeaks: string;
  setRawPeaks: (val: string) => void;
  rawHKL: string;
  setRawHKL: (val: string) => void;
  onCalculate: () => void;
}

export const BraggInput: React.FC<BraggInputProps> = ({
  wavelength,
  setWavelength,
  rawPeaks,
  setRawPeaks,
  rawHKL,
  setRawHKL,
  onCalculate
}) => {
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>([
    { label: 'Cu Kα', value: 1.5406, type: 'X-Ray' },
    { label: 'Mo Kα', value: 0.7107, type: 'X-Ray' },
    { label: 'Co Kα', value: 1.7890, type: 'X-Ray' },
    { label: 'Fe Kα', value: 1.9360, type: 'X-Ray' },
    { label: 'Cr Kα', value: 2.2897, type: 'X-Ray' },
    { label: 'Ag Kα', value: 0.5594, type: 'X-Ray' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const latest = await fetchStandardWavelengths();
      if (latest.length > 0) {
        setAvailableWavelengths(latest.filter(w => w.type === 'X-Ray'));
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const firstPeak = useMemo(() => {
    const match = rawPeaks.match(/[-+]?[0-9]*\.?[0-9]+/);
    const val = match ? parseFloat(match[0]) : 0;
    return isNaN(val) ? 0 : val;
  }, [rawPeaks]);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Parameters
        </h2>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
          title="Fetch latest IUPAC/NIST standard values"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isSyncing ? 'Syncing...' : 'Sync Standards'}
        </button>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Wavelength (Å)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              value={wavelength}
              onChange={(e) => setWavelength(parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors font-bold font-mono"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-bold">
              Å
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {availableWavelengths.map((sw) => (
              <button 
                key={sw.label}
                onClick={() => setWavelength(sw.value)}
                className={`px-2 py-1.5 text-[10px] rounded border transition-all font-bold ${
                  wavelength === sw.value 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              2θ Peaks (deg)
            </label>
            <textarea
              value={rawPeaks}
              onChange={(e) => setRawPeaks(e.target.value)}
              placeholder="e.g., 28.4, 47.3"
              className="w-full h-24 px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors font-mono text-xs leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Miller Indices (hkl)
            </label>
            <textarea
              value={rawHKL}
              onChange={(e) => setRawHKL(e.target.value)}
              placeholder="e.g., 111, 220"
              className="w-full h-24 px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors font-mono text-xs leading-relaxed"
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-4 italic">
          Separate multiple entries with commas. HKL indices will map 1:1 to peaks.
        </p>

        {/* Live Visualization */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Live Geometry (First Peak)
          </label>
          <BraggVisualization wavelength={wavelength} twoTheta={firstPeak} />
        </div>

        <button
          onClick={onCalculate}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Calculate Parameters
        </button>
      </div>
    </div>
  );
};
