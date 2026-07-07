import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fetchStandardWavelengths } from '../services/geminiService';
import { StandardWavelength } from '../types';
import { XRAY_WAVELENGTHS } from '../utils/physics';
import { 
  Sliders, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  AlertTriangle, 
  RefreshCw, 
  Gauge, 
  Binary, 
  Layers,
  Sparkles,
  RefreshCw as SyncIcon,
  Database,
  Atom,
  Check,
  FileText,
  ClipboardPaste,
  X
} from 'lucide-react';

interface BraggInputProps {
  sampleId?: string;
  setSampleId?: (val: string) => void;
  wavelength: number;
  setWavelength: (val: number) => void;
  rawPeaks: string;
  setRawPeaks: (val: string) => void;
  rawHKL: string;
  setRawHKL: (val: string) => void;
  onCalculate: () => void;
  onBatchCalculate?: (batchSets: Array<{ sampleId: string; rawPeaks: string; rawHKL: string }>) => void;
  
  // Alignment correction optional props
  zeroShift?: number;
  setZeroShift?: (val: number) => void;
  sampleDisplacement?: number;
  setSampleDisplacement?: (val: number) => void;
  goniometerRadius?: number;
  setGoniometerRadius?: (val: number) => void;
  isSimulationRunning?: boolean;
  simulationStep?: number;
  isSaving?: boolean;
  lastAutosaved?: string | null;
}

const CALIBRATION_PRESETS = [
  {
    name: "Custom / Manual Entry",
    id: "custom",
    sampleId: "",
    wavelength: 1.54060,
    peaks: "",
    hkls: ""
  },
  {
    name: "Silicon (NIST SRM 640f)",
    id: "silicon",
    sampleId: "NIST-640f-Si",
    wavelength: 1.54060,
    peaks: "28.442, 47.302, 56.121, 69.130, 76.376, 88.031",
    hkls: "111, 220, 311, 400, 331, 422"
  },
  {
    name: "Lanthanum Hexaboride (NIST SRM 660c)",
    id: "lab6",
    sampleId: "NIST-660c-LaB6",
    wavelength: 1.54060,
    peaks: "21.355, 30.384, 37.441, 43.506, 48.956, 53.987, 58.711",
    hkls: "100, 110, 111, 200, 210, 211, 220"
  },
  {
    name: "Cerium Oxide (NIST SRM 674b)",
    id: "ceo2",
    sampleId: "NIST-674b-CeO2",
    wavelength: 1.54060,
    peaks: "28.555, 33.082, 47.479, 56.335, 59.088, 69.414, 76.702",
    hkls: "111, 200, 220, 311, 222, 400, 331"
  },
  {
    name: "Standard Halite (NaCl Reference)",
    id: "nacl",
    sampleId: "Halite-NaCl",
    wavelength: 1.54060,
    peaks: "27.35, 31.69, 45.41, 53.81, 56.43, 66.18, 75.25",
    hkls: "111, 200, 220, 311, 222, 400, 420"
  },
  {
    name: "Gold (Au Nanocrystals)",
    id: "au",
    sampleId: "Au-Nanocrystals",
    wavelength: 1.54060,
    peaks: "38.18, 44.39, 64.58, 77.55, 81.72",
    hkls: "111, 200, 220, 311, 222"
  }
];

export const BraggInput: React.FC<BraggInputProps> = ({
  sampleId = '',
  setSampleId,
  wavelength,
  setWavelength,
  rawPeaks,
  setRawPeaks,
  rawHKL,
  setRawHKL,
  onCalculate,
  onBatchCalculate,
  zeroShift = 0.0,
  setZeroShift,
  sampleDisplacement = 0.0,
  setSampleDisplacement,
  goniometerRadius = 240.0,
  setGoniometerRadius,
  isSimulationRunning = false,
  simulationStep = 0,
  isSaving = false,
  lastAutosaved = null
}) => {
  const { t } = useTranslation();
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>(
    Object.entries(XRAY_WAVELENGTHS).map(([label, value]) => ({ label, value, type: 'X-Ray' }))
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAlignment, setShowAlignment] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPasteText, setBatchPasteText] = useState('');

  // Real-time parsing of peaks & hkl
  const parsedPeaks = useMemo(() => {
    if (!rawPeaks.trim()) return [];
    return rawPeaks
      .split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => parseFloat(s))
      .filter(n => !isNaN(n));
  }, [rawPeaks]);

  const parsedHKLs = useMemo(() => {
    if (!rawHKL.trim()) return [];
    return rawHKL
      .split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(s => s !== '');
  }, [rawHKL]);

  const hasMismatch = parsedPeaks.length > 0 && parsedHKLs.length > 0 && parsedPeaks.length !== parsedHKLs.length;

  // Automated Peak Alignment States
  const [showAutoAlignModal, setShowAutoAlignModal] = useState(false);
  const [alignmentStandardId, setAlignmentStandardId] = useState('silicon');
  const [alignmentTolerance, setAlignmentTolerance] = useState(1.0);
  const [excludedMatchIndices, setExcludedMatchIndices] = useState<number[]>([]);

  const getPresetPeaks = (id: string) => {
    const preset = CALIBRATION_PRESETS.find(p => p.id === id);
    if (!preset || !preset.peaks) return [];
    return preset.peaks.split(',').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
  };

  const getPresetHKLs = (id: string) => {
    const preset = CALIBRATION_PRESETS.find(p => p.id === id);
    if (!preset || !preset.hkls) return [];
    return preset.hkls.split(',').map(h => h.trim());
  };

  // Reset excluded matches when standard or experimental peaks change
  useEffect(() => {
    setExcludedMatchIndices([]);
  }, [alignmentStandardId, rawPeaks]);

  const alignmentData = useMemo(() => {
    const theoreticalPeaks = getPresetPeaks(alignmentStandardId);
    const theoreticalHKLs = getPresetHKLs(alignmentStandardId);
    
    const matches = parsedPeaks.map((expVal, expIdx) => {
      if (theoreticalPeaks.length === 0) {
        return { expVal, expIdx, matched: false as const, bestTheoretical: null, diff: 0, hkl: null };
      }
      
      let bestTheoretical = theoreticalPeaks[0];
      let bestIdx = 0;
      let minDiff = Math.abs(expVal - bestTheoretical);
      
      for (let i = 1; i < theoreticalPeaks.length; i++) {
        const d = Math.abs(expVal - theoreticalPeaks[i]);
        if (d < minDiff) {
          minDiff = d;
          bestTheoretical = theoreticalPeaks[i];
          bestIdx = i;
        }
      }
      
      const diff = expVal - bestTheoretical;
      const matched = minDiff <= alignmentTolerance;
      const hkl = theoreticalHKLs[bestIdx] || null;
      
      return {
        expVal,
        expIdx,
        matched,
        bestTheoretical,
        diff,
        hkl
      };
    });
    
    // Matched peaks that are NOT excluded
    const activeMatches = matches.filter(m => m.matched && !excludedMatchIndices.includes(m.expIdx));
    
    let calculatedShift = 0;
    let standardDeviation = 0;
    
    if (activeMatches.length > 0) {
      const sum = activeMatches.reduce((acc, m) => acc + m.diff, 0);
      calculatedShift = sum / activeMatches.length;
      
      // Calculate standard deviation of differences to see consistency
      const variance = activeMatches.reduce((acc, m) => acc + Math.pow(m.diff - calculatedShift, 2), 0) / activeMatches.length;
      standardDeviation = Math.sqrt(variance);
    }
    
    return {
      matches,
      calculatedShift,
      standardDeviation,
      activeMatchesCount: activeMatches.length,
      totalMatchesCount: matches.filter(m => m.matched).length
    };
  }, [parsedPeaks, alignmentStandardId, alignmentTolerance, excludedMatchIndices]);

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

  // Convert wavelength (Angstroms) to energy (keV)
  const energyKev = useMemo(() => {
    if (wavelength && wavelength > 0) {
      return (12.3984 / wavelength).toFixed(3);
    }
    return null;
  }, [wavelength]);

  const processBatchText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    
    const header = lines[0].toLowerCase();
    let startIndex = 0;
    if (header.includes('sample') || header.includes('theta')) {
      startIndex = 1;
    }

    const setsMap = new Map<string, { peaks: string[], hkls: string[] }>();
    let currentSampleId = "Sample_1";

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length === 0) continue;
      
      let sampleId = currentSampleId;
      let twoTheta = "";
      let intensity = "";
      let hkl = "";

      // Simple heuristic: if parts[0] is not a number, it's a sample ID
      if (isNaN(parseFloat(parts[0]))) {
        sampleId = parts[0];
        twoTheta = parts[1] || "";
        intensity = parts[2] || "";
        hkl = parts[3] || "";
        currentSampleId = sampleId;
      } else {
        twoTheta = parts[0];
        intensity = parts[1] || "";
        hkl = parts[2] || "";
      }

      if (!twoTheta) continue;

      if (!setsMap.has(sampleId)) {
        setsMap.set(sampleId, { peaks: [], hkls: [] });
      }

      const set = setsMap.get(sampleId)!;
      let peakStr = twoTheta;
      if (intensity && !isNaN(parseFloat(intensity))) {
        peakStr += `:${intensity}`;
      }
      set.peaks.push(peakStr);
      if (hkl) {
        set.hkls.push(hkl);
      }
    }

    const batchSets: Array<{ sampleId: string; rawPeaks: string; rawHKL: string }> = [];
    setsMap.forEach((data, id) => {
      batchSets.push({
        sampleId: id,
        rawPeaks: data.peaks.join(', '),
        rawHKL: data.hkls.join(', ')
      });
    });

    if (batchSets.length > 0 && onBatchCalculate) {
      onBatchCalculate(batchSets);
    }
  };

  const handleBatchImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processBatchText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 font-sans tracking-tight uppercase">
            <Gauge className="h-5 w-5 text-indigo-500 shrink-0" />
            {t('Parameters')}
          </h2>
          {lastAutosaved && (
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono tracking-tight transition-all duration-300 ${
              isSaving
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-emerald-500 animate-ping' : 'bg-slate-400 dark:bg-slate-500'}`} />
              {isSaving ? 'saving...' : `saved ${lastAutosaved}`}
            </span>
          )}
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="text-[9px] uppercase font-black tracking-wider text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 px-2 py-1 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-lg border border-indigo-500/10"
          title="Fetch latest IUPAC/NIST standard values"
        >
          <SyncIcon className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? t('Syncing') : t('Sync Standards')}
        </button>
      </div>
      
      <div className="space-y-5">
        {/* Sample ID Input */}
        {setSampleId && (
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1.5">
              {t('Sample ID')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="e.g., TiO2-NP-001"
                maxLength={50}
                className="w-full px-3.5 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-bold text-xs"
              />
              <button 
                type="button"
                onClick={() => setSampleId('SAMPLE-' + Math.floor(Math.random() * 9000 + 1000))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"
                title="Generate Random Sample ID"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Calibration Reference Standard Dropdown */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            Calibration Reference Standard
          </label>
          <select
            onChange={(e) => {
              const selectedId = e.target.value;
              const preset = CALIBRATION_PRESETS.find(p => p.id === selectedId);
              if (preset) {
                if (preset.sampleId && setSampleId) setSampleId(preset.sampleId);
                setWavelength(preset.wavelength);
                setRawPeaks(preset.peaks);
                setRawHKL(preset.hkls);
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-bold text-xs cursor-pointer"
            defaultValue="custom"
          >
            {CALIBRATION_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="font-bold text-xs">
                {p.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Wavelength Section */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
              {t('Wavelength')}
            </label>
            {energyKev && (
              <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/10">
                {energyKev} keV
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.00001"
                min="0.1"
                max="5.0"
                value={wavelength}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setWavelength(val);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-bold font-mono text-xs"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">
                Å
              </div>
            </div>
            {/* Fine tuning buttons */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWavelength(Number((wavelength - 0.0001).toFixed(5)))}
                className="px-3 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-xs"
                title="Decrease 0.0001 Å"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setWavelength(Number((wavelength + 0.0001).toFixed(5)))}
                className="px-3 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-xs border-l border-slate-200 dark:border-slate-800"
                title="Increase 0.0001 Å"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Quick Selected Tubes */}
          <div className="mt-2.5 grid grid-cols-4 gap-1">
            {availableWavelengths.slice(0, 8).map((sw, i) => (
              <button 
                key={`${sw.label}-${i}`}
                type="button"
                onClick={() => setWavelength(sw.value)}
                className={`px-1.5 py-1 text-[9px] rounded-lg border transition-all font-mono font-bold truncate ${
                  Math.abs(wavelength - sw.value) < 0.0001
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-extrabold' 
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
                title={`${sw.label}: ${sw.value} Å`}
              >
                {sw.label.replace(' (avg)', '')}
              </button>
            ))}
          </div>
        </div>

        {/* XRD Peaks and Miller Indices inputs inside beautifully organized container */}
        <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Binary className="w-3.5 h-3.5 text-indigo-400" />
                {t('2Theta Peaks')}
              </label>
              <textarea
                value={rawPeaks}
                onChange={(e) => setRawPeaks(e.target.value)}
                placeholder="e.g., 28.44, 47.30, 56.12"
                className="w-full h-20 px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-mono text-xs leading-relaxed custom-scrollbar resize-none"
              />
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Tuning Tools:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sorted = parsedPeaks.slice().sort((a, b) => a - b);
                    if (sorted.length > 0) {
                      setRawPeaks(sorted.map(n => n.toFixed(3)).join(', '));
                    }
                  }}
                  className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer"
                  title="Sort 2Theta values in ascending order"
                >
                  Sort Asc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (parsedPeaks.length > 0) {
                      setRawPeaks(parsedPeaks.map(n => n.toFixed(2)).join(', '));
                    }
                  }}
                  className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer"
                  title="Normalize formatting to 2 decimal places"
                >
                  Clean/Format
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const shifted = parsedPeaks.map(n => Number((n + 0.1).toFixed(4)));
                    if (shifted.length > 0) {
                      setRawPeaks(shifted.join(', '));
                    }
                  }}
                  className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer"
                  title="Shift all peaks by +0.1° 2-Theta"
                >
                  +0.1° Shift
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const shifted = parsedPeaks.map(n => Number((n - 0.1).toFixed(4)));
                    if (shifted.length > 0) {
                      setRawPeaks(shifted.join(', '));
                    }
                  }}
                  className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer"
                  title="Shift all peaks by -0.1° 2-Theta"
                >
                  -0.1° Shift
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {t('Miller Indices')}
              </label>
              <textarea
                value={rawHKL}
                onChange={(e) => setRawHKL(e.target.value)}
                placeholder="e.g., 111, 220, 311"
                className="w-full h-20 px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-mono text-xs leading-relaxed custom-scrollbar resize-none"
              />
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Symmetry Presets:</span>
                {[
                  { name: 'FCC/Cubic', list: '111, 200, 220, 311' },
                  { name: 'BCC', list: '110, 200, 211, 220' },
                  { name: 'Hexagonal', list: '100, 002, 101, 102' }
                ].map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => setRawHKL(tpl.list)}
                    className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Dynamic Parsing Preview Badge Board */}
          {parsedPeaks.length > 0 && (
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="block text-[9px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-2">
                Parsed Diffraction Matrix ({parsedPeaks.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto custom-scrollbar">
                {parsedPeaks.map((p, idx) => {
                  const hkl = parsedHKLs[idx];
                  return (
                    <span 
                      key={idx} 
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-black border transition-colors ${
                        hkl !== undefined
                          ? 'bg-indigo-50/80 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40' 
                          : 'bg-amber-500/5 text-amber-600 border-amber-500/10 dark:text-amber-400'
                      }`}
                    >
                      <span>{p.toFixed(2)}°</span>
                      <span className="opacity-40">|</span>
                      <span className="font-sans text-[9px]">
                        {hkl !== undefined ? `hkl: ${hkl}` : 'no hkl'}
                      </span>
                    </span>
                  );
                })}
              </div>
              {hasMismatch && (
                <div className="text-[10px] text-amber-500 dark:text-amber-400 mt-2 flex items-center gap-1.5 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Indices Count Mismatch: {parsedPeaks.length} Peaks vs {parsedHKLs.length} Planes. Matches will align sequentially.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expandable Alignment & Goniometer Error Corrections Section */}
        {setZeroShift && setSampleDisplacement && setGoniometerRadius && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300">
            <button
              type="button"
              onClick={() => setShowAlignment(!showAlignment)}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Goniometer Configuration
              </span>
              <div className="flex items-center gap-2">
                {(zeroShift !== 0 || sampleDisplacement !== 0) && (
                  <span className="text-[8px] font-black uppercase bg-emerald-500/15 text-emerald-500 rounded-full px-2 py-0.5">
                    Corrected
                  </span>
                )}
                {showAlignment ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
            
            {showAlignment && (
              <div className="p-4 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Zero Shift Correction */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Zero-Shift Error (Δ2θ)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-indigo-500">{zeroShift > 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          // Try to pre-select current reference standard if it's not custom
                          const presetSelect = document.querySelector('select');
                          if (presetSelect && presetSelect.value !== 'custom') {
                            setAlignmentStandardId(presetSelect.value);
                          }
                          setShowAutoAlignModal(true);
                        }}
                        className="text-[9px] uppercase tracking-wider text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 px-1.5 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded font-bold flex items-center gap-1 cursor-pointer border border-indigo-500/10 hover:border-indigo-500/30 transition-all"
                        title="Calculate optimal zero-shift from reference standard"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto Align
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setZeroShift(0.0)}
                        className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 bg-slate-100 dark:bg-slate-800 rounded cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.005"
                    value={zeroShift}
                    onChange={(e) => setZeroShift(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-1">
                    Displaces peak centers systematically. Formula: 2θ_corr = 2θ_obs - Δ2θ
                  </p>
                </div>

                {/* Sample Displacement Correction */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Sample Displacement (s)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-indigo-500">{sampleDisplacement > 0 ? `+${sampleDisplacement.toFixed(3)}` : sampleDisplacement.toFixed(3)} mm</span>
                      <button 
                        type="button" 
                        onClick={() => setSampleDisplacement(0.0)}
                        className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 bg-slate-100 dark:bg-slate-800 rounded"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-0.4"
                    max="0.4"
                    step="0.005"
                    value={sampleDisplacement}
                    onChange={(e) => setSampleDisplacement(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-1">
                    Offset of sample surface from focusing circle. Shifts vary with cos(θ).
                  </p>
                </div>

                {/* Goniometer Radius */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Goniometer Radius (R_g)
                    </span>
                    <span className="text-xs font-mono font-black text-indigo-500">{goniometerRadius} mm</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="100"
                      max="400"
                      step="5"
                      value={goniometerRadius}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setGoniometerRadius(val);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-lg outline-none font-bold font-mono text-xs"
                    />
                    <div className="flex gap-1">
                      {[185, 240, 285].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setGoniometerRadius(r)}
                          className={`px-2 py-1 text-[9px] font-mono font-bold rounded border ${
                            goniometerRadius === r
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-150'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-1.5">
                    Modulates the magnitude of the displacement correction angular shifts.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isSimulationRunning ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCalculate}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all active:scale-[0.98] border border-indigo-500/50 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
              {t('Calculate')}
            </button>
            <div className="relative flex-1 sm:flex-none">
              <input 
                type="file" 
                accept=".csv,.txt"
                onChange={handleBatchImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title={t('Select CSV or TXT file for batch calculation')}
              />
              <button
                type="button"
                className="w-full sm:w-auto h-full px-5 py-3.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] border border-emerald-500/30 flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                {t('Batch Import')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 p-5 rounded-2xl border border-indigo-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" /> Calculating Parameters
            </h4>
            <div className="space-y-3 relative z-10 w-full flex flex-col">
              {[
                { step: 1, label: 'Evaluating Raw Data Input', icon: Database },
                { step: 2, label: 'Validating System Parameters', icon: Settings },
                { step: 3, label: 'Calculating Geometric Form', icon: Atom },
                { step: 4, label: 'Modeling Optical Strain', icon: Sparkles },
                { step: 5, label: 'Formulating Results', icon: Check }
              ].map((s) => {
                 const Icon = s.icon;
                 const isActive = simulationStep === s.step;
                 const isDone = simulationStep > s.step;
                 return (
                   <div key={s.step} className={`flex items-center gap-3 w-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                     <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                       <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                     </div>
                     <div className="flex-1 flex flex-col">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                         {s.label}
                       </span>
                       {isActive && <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-transparent w-full mt-1.5 animate-pulse rounded-full" />}
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AUTOMATED PEAK ALIGNMENT OPTIMIZER MODAL */}
      <AnimatePresence>
        {showAutoAlignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      Peak Alignment Optimizer
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Calibrate the goniometer zero-shift systematic offset using standard reference materials
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAutoAlignModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Calibration Parameters */}
                <div className="md:col-span-5 space-y-5">
                  <div className="space-y-4">
                    {/* Select Standard */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        Reference Standard Material
                      </label>
                      <select
                        value={alignmentStandardId}
                        onChange={(e) => setAlignmentStandardId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-bold text-xs cursor-pointer"
                      >
                        {CALIBRATION_PRESETS.filter(p => p.id !== 'custom').map((p) => (
                          <option key={p.id} value={p.id} className="font-bold text-xs">
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tolerance Threshold */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
                          Matching Tolerance (±°2θ)
                        </label>
                        <span className="text-xs font-mono font-black text-indigo-500">{alignmentTolerance.toFixed(1)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={alignmentTolerance}
                        onChange={(e) => setAlignmentTolerance(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal mt-1">
                        Only experimental peaks within this window will map to standard theoretical positions.
                      </p>
                    </div>
                  </div>

                  {/* Summary & Best-Fit Calculation Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 space-y-4">
                    <span className="block text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                      Optimization Result
                    </span>
                    
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Optimal Zero-Shift Correction (Δ2θ)</div>
                      <div className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1">
                        {alignmentData.calculatedShift > 0 ? `+${alignmentData.calculatedShift.toFixed(4)}` : alignmentData.calculatedShift.toFixed(4)}°
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Peaks Matched</div>
                        <div className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">
                          {alignmentData.activeMatchesCount} / {parsedPeaks.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">Std Deviation (Scatter)</div>
                        <div className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">
                          {alignmentData.activeMatchesCount > 0 ? `±${alignmentData.standardDeviation.toFixed(4)}°` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Consistency Rating</div>
                      {alignmentData.activeMatchesCount === 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/10">
                          No Matches
                        </span>
                      ) : alignmentData.standardDeviation < 0.02 ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                          Excellent Calibration (±{alignmentData.standardDeviation.toFixed(3)}°)
                        </span>
                      ) : alignmentData.standardDeviation < 0.10 ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-500 border border-indigo-500/20">
                          Good Calibration
                        </span>
                      ) : alignmentData.standardDeviation < 0.25 ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                          Moderate Calibration Scatter
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/20">
                          High Peak Scatter (Verify Phases)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Matched Peaks list with toggle switches */}
                <div className="md:col-span-7 flex flex-col h-full min-h-[300px]">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Diffraction Peak Correspondence Matrix
                  </label>

                  {parsedPeaks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20">
                      <AlertTriangle className="w-8 h-8 text-amber-500 opacity-60 mb-2" />
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">No Experimental Peaks Parsed</div>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal">
                        Please close this optimizer, enter experimental peak angles in the 2-Theta textarea above, and reopen the alignment tool.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 flex flex-col">
                      <div className="grid grid-cols-12 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <div className="col-span-1">Use</div>
                        <div className="col-span-3 text-left">Observed (2θ)</div>
                        <div className="col-span-4 text-left">Reference (2θ)</div>
                        <div className="col-span-4 text-right">Error (Δ2θ)</div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-850 overflow-y-auto max-h-[340px] custom-scrollbar flex-1">
                        {alignmentData.matches.map((match) => (
                          <div 
                            key={match.expIdx} 
                            className={`grid grid-cols-12 items-center px-4 py-3 text-xs transition-colors ${
                              !match.matched 
                                ? 'bg-rose-500/[0.02] text-slate-400' 
                                : excludedMatchIndices.includes(match.expIdx)
                                  ? 'bg-slate-100/40 dark:bg-slate-900/10 text-slate-400 line-through'
                                  : 'bg-white dark:bg-slate-900/20 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {/* Checkbox / Include */}
                            <div className="col-span-1 flex items-center">
                              <input 
                                type="checkbox"
                                disabled={!match.matched}
                                checked={match.matched && !excludedMatchIndices.includes(match.expIdx)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setExcludedMatchIndices(excludedMatchIndices.filter(i => i !== match.expIdx));
                                  } else {
                                    setExcludedMatchIndices([...excludedMatchIndices, match.expIdx]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </div>

                            {/* Observed/Experimental */}
                            <div className="col-span-3 font-mono font-bold">
                              {match.expVal.toFixed(3)}°
                            </div>

                            {/* Reference Theoretical */}
                            <div className="col-span-4 flex flex-col">
                              {match.matched && match.bestTheoretical !== null ? (
                                <>
                                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                                    {match.bestTheoretical.toFixed(3)}°
                                  </span>
                                  {match.hkl && (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans">
                                      Plane: ({match.hkl})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-rose-500/80 italic font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-500" /> No Match
                                </span>
                              )}
                            </div>

                            {/* Offset/Difference */}
                            <div className="col-span-4 text-right">
                              {match.matched ? (
                                <span className={`inline-block font-mono font-black text-[11px] px-2 py-0.5 rounded ${
                                  excludedMatchIndices.includes(match.expIdx)
                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-850'
                                    : match.diff > 0
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {match.diff > 0 ? `+${match.diff.toFixed(3)}°` : `${match.diff.toFixed(3)}°`}
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold text-rose-500/60 uppercase tracking-wider">
                                  Out of Tol
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 max-w-md">
                  <span className="font-bold uppercase text-[9px] tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded shrink-0">Physics Tip</span>
                  <span>
                    Zero-shift correction modifies observed 2θ sequentially. Corrected positions propagate directly to lattice constant calculations.
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAutoAlignModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={alignmentData.activeMatchesCount === 0}
                    onClick={() => {
                      if (setZeroShift) {
                        setZeroShift(Number(alignmentData.calculatedShift.toFixed(4)));
                      }
                      setShowAutoAlignModal(false);
                    }}
                    className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Apply Correction ({alignmentData.calculatedShift > 0 ? `+${alignmentData.calculatedShift.toFixed(3)}` : alignmentData.calculatedShift.toFixed(3)}°)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
