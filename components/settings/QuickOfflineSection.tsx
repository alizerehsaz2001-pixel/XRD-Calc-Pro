import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  HardDrive, Zap, WifiOff, RefreshCw, CheckCircle2, 
  Database, ShieldCheck, Clock, Layers, Trash2, Info, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../../utils/sound';
import { 
  getQuickOfflineStatus, 
  setQuickOfflineMode, 
  forceCacheAllToIndexedDB, 
  QuickOfflineStatus 
} from '../../utils/quickOffline';
import { clearOfflineAnalyses, getOfflineMaterials, getOfflineAnalyses } from '../../utils/offlineDb';

export const QuickOfflineSection: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<QuickOfflineStatus>(getQuickOfflineStatus());
  const [isCaching, setIsCaching] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [cachedItemsSummary, setCachedItemsSummary] = useState<{ materials: any[]; analyses: any[] }>({ materials: [], analyses: [] });

  const refreshStatus = () => {
    setStatus(getQuickOfflineStatus());
  };

  useEffect(() => {
    refreshStatus();

    const handleOfflineChanged = (e: any) => {
      refreshStatus();
    };

    window.addEventListener('xrd_quick_offline_changed', handleOfflineChanged);
    return () => {
      window.removeEventListener('xrd_quick_offline_changed', handleOfflineChanged);
    };
  }, []);

  const handleToggle = async () => {
    const nextState = !status.isEnabled;
    playSynthTone(nextState ? 'success' : 'switch');
    setIsCaching(true);
    setCacheMessage(nextState ? t('Initializing Quick Offline force-caching to IndexedDB...') : t('Restoring standard network sync mode...'));

    const updated = await setQuickOfflineMode(nextState);
    setStatus(updated);
    setIsCaching(false);

    if (nextState) {
      setCacheMessage(t('Database & calculation state successfully force-cached into IndexedDB!'));
      setTimeout(() => setCacheMessage(null), 3500);
    } else {
      setCacheMessage(null);
    }
  };

  const handleForceCacheNow = async () => {
    playSynthTone('action');
    setIsCaching(true);
    setCacheMessage(t('Force-caching active databases & state into IndexedDB...'));

    const res = await forceCacheAllToIndexedDB();
    refreshStatus();
    setIsCaching(false);

    if (res.success) {
      playSynthTone('success');
      setCacheMessage(t(`Force-cached ${res.materialsCount} materials and ${res.analysisCount} analyses to IndexedDB!`));
    } else {
      playSynthTone('error');
      setCacheMessage(res.error || t('Failed to cache state to IndexedDB.'));
    }

    setTimeout(() => setCacheMessage(null), 4000);
  };

  const handleInspectCache = async () => {
    try {
      const materials = await getOfflineMaterials();
      const analyses = await getOfflineAnalyses();
      setCachedItemsSummary({ materials, analyses });
      setInspectModalOpen(true);
      playSynthTone('tick');
    } catch (e) {
      console.error('Error inspecting cache:', e);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearOfflineAnalyses();
      refreshStatus();
      setShowClearConfirm(false);
      playSynthTone('action');
      setCacheMessage(t('IndexedDB analysis cache cleared successfully.'));
      setTimeout(() => setCacheMessage(null), 3000);
    } catch (e) {
      console.error('Error clearing offline cache:', e);
    } finally {
      setIsClearing(false);
    }
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return t('Never');
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-2xl ${status.isEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'}`}>
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('Quick Offline & IndexedDB Force-Cache')}
              </h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${status.isEnabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                {status.isEnabled ? t('⚡ Quick Offline Active') : t('Standard Sync')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {t('Explicitly force-caches all material databases, crystal structure profiles, Bragg inputs, and analytical calculation states directly into IndexedDB for strictly offline usage until manually synchronized.')}
            </p>
          </div>
        </div>

        {/* Main Quick Offline Toggle Switch */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {status.isEnabled ? t('Quick Offline ON') : t('Quick Offline OFF')}
          </span>
          <button
            onClick={handleToggle}
            disabled={isCaching}
            type="button"
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${status.isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className="sr-only">{t('Toggle Quick Offline Mode')}</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${status.isEnabled ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      {/* Dynamic Notification Message */}
      <AnimatePresence>
        {cacheMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="my-4"
          >
            <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 border ${status.isEnabled ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/20'}`}>
              {isCaching ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-emerald-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span>{cacheMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IndexedDB Cache Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('IndexedDB Materials')}
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {status.cachedMaterialsCount} {t('records')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('IndexedDB Analyses')}
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {status.cachedAnalysisCount} {t('sessions')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t('Last Force-Cache')}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block max-w-[170px]">
              {formatTimestamp(status.lastCachedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleForceCacheNow}
            disabled={isCaching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCaching ? 'animate-spin' : ''}`} />
            {t('Force-Cache Now')}
          </button>

          <button
            onClick={handleInspectCache}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            {t('Inspect IndexedDB Cache')}
          </button>
        </div>

        <div>
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-rose-500 font-medium">{t('Confirm clear?')}</span>
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                {t('Yes, Clear')}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                {t('Cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('Clear Offline Cache')}
            </button>
          )}
        </div>
      </div>

      {/* Inspect Modal */}
      <AnimatePresence>
        {inspectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('IndexedDB Offline Cache Inspection')}
                  </h4>
                </div>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto my-4 space-y-6 flex-1 pr-1">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    {t('Cached Materials')} ({cachedItemsSummary.materials.length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cachedItemsSummary.materials.slice(0, 10).map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{m.formula} • {m.crystalSystem}</span>
                      </div>
                    ))}
                  </div>
                  {cachedItemsSummary.materials.length > 10 && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      +{cachedItemsSummary.materials.length - 10} {t('more materials cached')}
                    </span>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    {t('Cached Analyses')} ({cachedItemsSummary.analyses.length})
                  </h5>
                  <div className="space-y-2">
                    {cachedItemsSummary.analyses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t('No calculation sessions saved yet in IndexedDB.')}</p>
                    ) : (
                      cachedItemsSummary.analyses.map((a, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{a.title}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Type: {a.type} • {new Date(a.timestamp).toLocaleString()}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                            Cached
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all"
                >
                  {t('Close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
