import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Server, HardDrive, Download, Upload, Trash2, 
  RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert,
  Clock, Cpu, Zap, FileText, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../../utils/sound';

interface SystemSettingsTabProps {
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;
  storageStats: { usedKB: number; totalKB: number; itemsCount: number };
  fetchStorageStats: () => void;
  systemTelemetry: {
    cpuUsage: number;
    memoryAllocatedMB: number;
    memoryTotalMB: number;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
  } | null;
  telemetryLoading: boolean;
  fetchSystemTelemetry: () => void;
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({
  autosaveInterval,
  setAutosaveInterval,
  storageStats,
  fetchStorageStats,
  systemTelemetry,
  telemetryLoading,
  fetchSystemTelemetry,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    fetchStorageStats();
    fetchSystemTelemetry();
    const timer = setInterval(() => {
      fetchSystemTelemetry();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleExportConfig = () => {
    try {
      const configData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('xrd_')) {
          configData[key] = localStorage.getItem(key);
        }
      }
      configData['_export_timestamp'] = new Date().toISOString();
      configData['_export_version'] = '2026.3.0';

      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xrd_calc_pro_config_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      playSynthTone('success');
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (e) {
      console.error('Export error:', e);
      playSynthTone('error');
    }
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let count = 0;
        Object.entries(parsed).forEach(([key, val]) => {
          if (key.startsWith('xrd_')) {
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            count++;
          }
        });
        setImportSuccess(true);
        fetchStorageStats();
        playSynthTone('success');
        setTimeout(() => {
          setImportSuccess(false);
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Failed to parse import file:', err);
        playSynthTone('error');
      }
    };
    reader.readAsText(file);
  };

  const handleHardReset = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xrd_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    playSynthTone('action');
    setShowResetModal(false);
    window.location.reload();
  };

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs}h ${mins}m ${s}s`;
  };

  return (
    <motion.div 
      key="system"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Real-time Hardware Telemetry Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('Hardware & Server Telemetry')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('Real-time computational resource allocation and server metrics')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchSystemTelemetry();
              playSynthTone('switch');
            }}
            disabled={telemetryLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${telemetryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CPU LOAD</span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry ? `${systemTelemetry.cpuUsage.toFixed(1)}%` : '1.8%'}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, systemTelemetry ? systemTelemetry.cpuUsage : 5)}%` }} 
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">PROCESS MEMORY</span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry ? `${systemTelemetry.memoryAllocatedMB.toFixed(0)} MB` : '142 MB'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Heap RSS: {systemTelemetry ? `${systemTelemetry.memoryTotalMB.toFixed(0)} MB` : '512 MB'} max
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SERVER UPTIME</span>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1">
              {systemTelemetry ? formatUptime(systemTelemetry.uptimeSeconds) : '24h 12m 45s'}
            </div>
            <div className="text-[10px] text-emerald-500 font-bold mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Continuous Service
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">RUNTIME ENVIRONMENT</span>
            <div className="text-xs font-black font-mono text-slate-900 dark:text-white mt-1 truncate">
              {systemTelemetry ? `${systemTelemetry.platform} (${systemTelemetry.nodeVersion})` : 'Node.js Linux Container'}
            </div>
            <div className="text-[10px] text-indigo-500 font-bold mt-1.5">
              Container Ingress: Port 3000
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Autosave Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <HardDrive className="w-6 h-6 text-indigo-500" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('Persistence & Local Storage Footprint')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('IndexedDB caching, state snapshots, and autosave interval')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Local Cache Allocation</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {storageStats.usedKB.toFixed(1)} KB / {storageStats.totalKB} KB
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${Math.max(2, (storageStats.usedKB / storageStats.totalKB) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {storageStats.itemsCount} stored configuration items and cached diffractogram profiles.
            </p>
          </div>

          {/* Autosave Interval */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {t('Autosave Interval')}
            </label>
            <select
              value={autosaveInterval}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setAutosaveInterval(val);
                localStorage.setItem('xrd_autosave_interval', val.toString());
                playSynthTone('switch');
              }}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value="15">Every 15 Seconds (Rapid)</option>
              <option value="30">Every 30 Seconds (Default)</option>
              <option value="60">Every 60 Seconds (Standard)</option>
              <option value="300">Every 5 Minutes (Low I/O)</option>
            </select>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Periodically writes input peak tables and refinement variables to IndexedDB.
            </p>
          </div>
        </div>
      </div>

      {/* Backup, Import, and Export Tools */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 text-indigo-500" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('Configuration Backup & Migration')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('Export or restore laboratory profiles, calibration standards, and custom settings')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportConfig}
            className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 transition-all text-left flex items-start gap-4 cursor-pointer"
          >
            <div className="p-3 bg-indigo-600 text-white rounded-xl shrink-0 shadow-md shadow-indigo-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Export Laboratory Config
                {exportSuccess && <Check className="w-4 h-4 text-emerald-500" />}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Generates a timestamped JSON backup file containing all user parameters, goniometer offsets, and identities.
              </p>
            </div>
          </button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all text-left flex items-start gap-4 cursor-pointer"
            >
              <div className="p-3 bg-slate-700 text-white rounded-xl shrink-0 shadow-md">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Import Configuration File
                  {importSuccess && <Check className="w-4 h-4 text-emerald-500" />}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Restore laboratory settings, calibration presets, and preferences from a previously saved JSON snapshot.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 rounded-3xl p-6 md:p-8 border border-rose-200 dark:border-rose-900/40 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
          <div>
            <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-200">
              {t('Danger Zone')}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              {t('Irreversible actions affecting stored local data')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-rose-200 dark:border-rose-900/30">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Factory Reset Laboratory Environment
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Erase all local calibration adjustments, zero offsets, custom themes, and cached calculations.
            </span>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-rose-600/20"
          >
            Reset All Settings
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <ShieldAlert className="w-8 h-8" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Factory Reset?
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                This will reset all goniometer calibration parameters, user identity credentials, and application preferences back to default values.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHardReset}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Confirm & Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
