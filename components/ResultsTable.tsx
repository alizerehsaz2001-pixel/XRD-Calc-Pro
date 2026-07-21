import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { Filter, SlidersHorizontal, RefreshCw, Check } from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';
import { motion, AnimatePresence } from 'motion/react';

interface ResultsTableProps {
  results: BraggResult[];
  onExportCompare?: (selectedResults: BraggResult[]) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, onExportCompare }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();

  const [minIntensity, setMinIntensity] = useState<number>(0);
  const [minDSpacing, setMinDSpacing] = useState<string>('');
  const [maxDSpacing, setMaxDSpacing] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showAverageResult, setShowAverageResult] = useState<{
    avgD: number;
    stdDev: number;
    minD: number;
    maxD: number;
  } | null>(null);

  // Reset selection and calculations when results change
  React.useEffect(() => {
    setSelectedIndices([]);
    setShowAverageResult(null);
  }, [results]);

  const filteredResults = React.useMemo(() => results.filter(row => {
    // 1. Intensity check
    const intensity = row.intensity !== undefined ? row.intensity : 100;
    if (intensity < minIntensity) return false;

    // 2. Minimum d-spacings check
    if (minDSpacing !== '') {
      const minD = parseFloat(minDSpacing);
      if (!isNaN(minD) && row.dSpacing < minD) return false;
    }

    // 3. Maximum d-spacings check
    if (maxDSpacing !== '') {
      const maxD = parseFloat(maxDSpacing);
      if (!isNaN(maxD) && row.dSpacing > maxD) return false;
    }

    // 4. Query text check
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const hklMatch = row.hkl?.toLowerCase().includes(q);
      const thetaMatch = row.twoTheta.toFixed(3).includes(q);
      if (!hklMatch && !thetaMatch) return false;
    }

    return true;
  }), [results, minIntensity, minDSpacing, maxDSpacing, searchQuery]);

  // Selection state helpers
  const isAllVisibleSelected = React.useMemo(() => {
    if (filteredResults.length === 0) return false;
    return filteredResults.every(row => {
      const originalIndex = results.indexOf(row);
      return selectedIndices.includes(originalIndex);
    });
  }, [filteredResults, selectedIndices, results]);

  const isSomeVisibleSelected = React.useMemo(() => {
    if (filteredResults.length === 0) return false;
    return filteredResults.some(row => {
      const originalIndex = results.indexOf(row);
      return selectedIndices.includes(originalIndex);
    }) && !isAllVisibleSelected;
  }, [filteredResults, selectedIndices, results, isAllVisibleSelected]);

  const handleSelectAllToggle = () => {
    if (isAllVisibleSelected) {
      // Deselect all visible rows
      const visibleIndices = filteredResults.map(row => results.indexOf(row));
      setSelectedIndices(prev => prev.filter(idx => !visibleIndices.includes(idx)));
    } else {
      // Select all visible rows
      const visibleIndices = filteredResults.map(row => results.indexOf(row));
      setSelectedIndices(prev => {
        const union = new Set([...prev, ...visibleIndices]);
        return Array.from(union);
      });
    }
    setShowAverageResult(null);
  };

  const handleRowSelectToggle = (row: BraggResult) => {
    const originalIndex = results.indexOf(row);
    setSelectedIndices(prev => {
      if (prev.includes(originalIndex)) {
        return prev.filter(idx => idx !== originalIndex);
      } else {
        return [...prev, originalIndex];
      }
    });
    setShowAverageResult(null);
  };

  const computeAverageDSpacing = () => {
    const selectedRows = results.filter((_, idx) => selectedIndices.includes(idx));
    if (selectedRows.length === 0) return;

    const dValues = selectedRows.map(r => r.dSpacing);
    const count = dValues.length;
    
    // Average
    const sum = dValues.reduce((acc, val) => acc + val, 0);
    const avgD = sum / count;

    // Standard deviation
    const variance = dValues.reduce((acc, val) => acc + Math.pow(val - avgD, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const minD = Math.min(...dValues);
    const maxD = Math.max(...dValues);

    setShowAverageResult({
      avgD,
      stdDev,
      minD,
      maxD
    });
  };

  const handleBulkExport = () => {
    const selectedRows = results.filter((_, idx) => selectedIndices.includes(idx));
    if (selectedRows.length > 0 && onExportCompare) {
      onExportCompare(selectedRows);
    }
  };
  
  const exportToCSV = () => {
    const dataToExport = filteredResults;
    if (dataToExport.length === 0) return;
    
    // Header for CSV
    const headers = ['hkl', '2theta (deg)', 'd-spacing (Å)', 'Q (1/Å)', 'sin(theta)/lambda', 'Intensity (%)'];
    
    // Data rows
    const rows = dataToExport.map(r => [
      r.hkl || '',
      r.twoTheta.toFixed(precision),
      r.dSpacing.toFixed(precision),
      r.qVector.toFixed(precision),
      r.sinThetaOverLambda.toFixed(precision),
      (r.intensity !== undefined ? r.intensity : 100).toFixed(1)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `xrd_analysis_filtered_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
        <div className="text-center">
          <p>{t('No results')}</p>
          <p className="text-sm">{t('Enter peaks prompt')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col min-h-[400px] transition-colors ResultsTable">
      <div className="p-2 px-4 shadow-sm z-10">
        <ScientificMathControl
          title="Bragg's Law Verification"
          formula="\lambda = 2 d \sin \theta \implies d = \frac{\lambda}{2 \sin \theta}"
          description="Verification of the core X-ray crystal scattering condition for the primary indexed peak."
          variables={results.length > 0 ? [
            { symbol: 'n', name: 'Order of reflection', value: 1, unit: '' },
            { symbol: 'θ', name: 'Bragg Angle', value: ((results[0].twoTheta / 2) * Math.PI / 180), unit: 'rad' },
            { symbol: 'λ', name: 'Scattering Wavelength', value: (2 * results[0].dSpacing * Math.sin((results[0].twoTheta / 2) * Math.PI / 180)), unit: 'Å' }
          ] : []}
          result={results.length > 0 ? results[0].dSpacing : 0}
          resultUnit="Å"
          resultName="Calculated D-Spacing"
        />
      </div>
      <div className="p-4 border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('Calculated Data')}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-205 dark:border-slate-750 hover:bg-slate-50'
            }`}
            title="Toggle Filter Panel"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={exportToCSV}
            disabled={filteredResults.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm active:scale-95 disabled:opacity-40"
            title="Download visible results as CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('Export CSV')}
          </button>
          
          <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold transition-all">
            {filteredResults.length === results.length 
              ? `${results.length} ${t('Peaks')}` 
              : `${filteredResults.length}/${results.length} ${t('Shown')}`
            }
          </span>

          {selectedIndices.length > 0 && (
            <span id="selected-peaks-status-badge" className="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold transition-all animate-in fade-in zoom-in-95 duration-150">
              {selectedIndices.length} of {results.length} selected
            </span>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-300 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Filter by Intensity */}
          <div className="space-y-1.5 font-sans">
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
              Min Intensity ({minIntensity}%)
            </label>
            <div className="flex items-center gap-2">
              <input 
                id="intensity-filter-slider"
                type="range"
                min="0"
                max="100"
                value={String(minIntensity) === 'NaN' ? '' : minIntensity}
                onChange={(e) => setMinIntensity(Number(e.target.value))}
                className="flex-1 accent-indigo-600 dark:accent-indigo-400 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-right">
                {minIntensity}%
              </span>
            </div>
          </div>

          {/* Min d-spacing filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
              Min d-spacing (Å)
            </label>
            <input 
              id="min-dspacing-filter"
              type="number"
              step="0.01"
              min="0"
              value={String(minDSpacing) === 'NaN' ? '' : minDSpacing}
              onChange={(e) => setMinDSpacing(e.target.value)}
              placeholder="e.g. 1.0"
              className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-805 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Max d-spacing filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
              Max d-spacing (Å)
            </label>
            <input 
              id="max-dspacing-filter"
              type="number"
              step="0.01"
              min="0"
              value={String(maxDSpacing) === 'NaN' ? '' : maxDSpacing}
              onChange={(e) => setMaxDSpacing(e.target.value)}
              placeholder="e.g. 3.0"
              className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-805 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Search Peak HKL filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
              Search Peak (HKL/2θ)
            </label>
            <div className="flex gap-2">
              <input 
                id="hkl-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 111"
                className="flex-1 px-3 py-1.5 bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-805 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
              />
              {(minIntensity > 0 || minDSpacing !== '' || maxDSpacing !== '' || searchQuery !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setMinIntensity(0);
                    setMinDSpacing('');
                    setMaxDSpacing('');
                    setSearchQuery('');
                  }}
                  className="p-1 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/10 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  title="Reset filters"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Panel */}
      <AnimatePresence>
        {selectedIndices.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-slate-300 dark:border-slate-800"
          >
            <div className="p-4 bg-indigo-500/5 dark:bg-indigo-400/5 border-b border-slate-300 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {selectedIndices.length} {selectedIndices.length === 1 ? 'Peak Selected' : 'Peaks Selected'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                    Bulk operations for selected reflections
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={computeAverageDSpacing}
                  className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Compute Average d-spacing
                </button>
                
                {onExportCompare && (
                  <button
                    onClick={handleBulkExport}
                    className="px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Export Selected to Compare
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedIndices([]);
                    setShowAverageResult(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Average Calculation Results Display */}
      <AnimatePresence>
        {showAverageResult && selectedIndices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-slate-300 dark:border-slate-800"
          >
            <div className="p-4 bg-emerald-500/5 border-b border-slate-300 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-inner text-emerald-800 dark:text-emerald-300">
              <div className="flex flex-col p-1 border-r border-slate-300 dark:border-slate-800 last:border-0">
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1">
                  Average d-spacing (d_avg)
                </span>
                <span className="text-sm font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  {showAverageResult.avgD.toFixed(precision)} Å
                </span>
              </div>
              
              <div className="flex flex-col p-1 border-r border-slate-300 dark:border-slate-800 last:border-0 md:border-r">
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1">
                  Standard Dev (σ)
                </span>
                <span className="text-sm font-black font-mono tracking-tight text-slate-700 dark:text-slate-300">
                  ±{showAverageResult.stdDev.toFixed(precision)} Å
                </span>
              </div>

              <div className="flex flex-col p-1 border-r border-slate-300 dark:border-slate-800 last:border-0">
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1">
                  Minimum d-spacing
                </span>
                <span className="text-sm font-black font-mono tracking-tight text-slate-700 dark:text-slate-300">
                  {showAverageResult.minD.toFixed(precision)} Å
                </span>
              </div>

              <div className="flex flex-col p-1 last:border-0">
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1">
                  Maximum d-spacing
                </span>
                <span className="text-sm font-black font-mono tracking-tight text-slate-700 dark:text-slate-300">
                  {showAverageResult.maxD.toFixed(precision)} Å
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[600px]">
        <table id="filtered-results-table" className="w-full text-sm text-left text-slate-800 dark:text-slate-200">
          <thead className="text-xs text-slate-900 dark:text-slate-400 uppercase bg-slate-200 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-3 border-b border-slate-300 dark:border-slate-700 w-10">
                <div className="flex items-center justify-center">
                  <input
                    id="select-all-checkbox"
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    ref={el => {
                      if (el) {
                        el.indeterminate = isSomeVisibleSelected;
                      }
                    }}
                    onChange={handleSelectAllToggle}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 dark:border-slate-700">{t('HKL')}</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 dark:border-slate-700">Intensity</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 dark:border-slate-700">{t('2theta_deg')}</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 dark:border-slate-700">{t('d_spacing')}</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 dark:border-slate-700">{t('Q_vector')}</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 dark:border-slate-700">{t('sin_theta')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
            {filteredResults.length === 0 ? (
              <tr className="bg-white dark:bg-slate-900">
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold font-sans">
                  No diffraction peaks match current filter constraints.
                </td>
              </tr>
            ) : (
              filteredResults.map((row, index) => {
                const originalIndex = results.indexOf(row);
                const isSelected = selectedIndices.includes(originalIndex);
                const intensity = row.intensity !== undefined ? row.intensity : 100;
                return (
                  <tr 
                    key={`${row.twoTheta}-${index}`} 
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30' 
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => handleRowSelectToggle(row)}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          id={`row-checkbox-${originalIndex}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelectToggle(row)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3 font-sans font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className={row.validationError ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}>
                          ({row.hkl || '?'})
                        </span>
                        {row.validationError && (
                          <span 
                            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white dark:bg-rose-600 animate-pulse cursor-help shrink-0"
                            title={row.validationError}
                          >
                            FORBIDDEN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 w-11">{intensity.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0 hidden sm:block">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${Math.min(100, intensity)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">{row.twoTheta.toFixed(Math.min(precision, 3))}</td>
                    <td className="px-6 py-3 text-indigo-700 dark:text-indigo-300 font-bold">{row.dSpacing.toFixed(precision)}</td>
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-400">{row.qVector.toFixed(precision)}</td>
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-400">{row.sinThetaOverLambda.toFixed(precision)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
