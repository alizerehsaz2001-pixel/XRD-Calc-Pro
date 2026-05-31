import React, { useState, useEffect, useMemo } from 'react';
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
  Check
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
                        onClick={() => setZeroShift(0.0)}
                        className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 bg-slate-100 dark:bg-slate-800 rounded"
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
          <button
            onClick={onCalculate}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all active:scale-[0.98] border border-indigo-500/50 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
            {t('Calculate')}
          </button>
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
    </div>
  );
};
