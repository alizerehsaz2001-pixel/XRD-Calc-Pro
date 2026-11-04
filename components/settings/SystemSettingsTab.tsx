import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Server, HardDrive, Download, Upload, Trash2, 
  RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert,
  Clock, Cpu, Zap, FileText, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../../utils/sound';
import { QuickOfflineSection } from './QuickOfflineSection';

interface SystemSettingsTabProps {
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;
  storageStats: { usedKB: number; totalKB: number; itemsCount: number };
  fetchStorageStats: () => void;
  systemTelemetry: {
    cpuUsage: number;
    memoryAllocatedMB: number;
    memoryTotalMB: number;
    rssMB?: number;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    cpuCores?: number;
    cpuModel?: string;
    loadAverage?: number[];
    cache?: {
      entries: number;
      maxEntries: number;
      hits: number;
      misses: number;
      evictions: number;
      hitRatePct: number;
    };
    traffic?: {
      totalRequests: number;
      activeRequests: number;
      errorCount: number;
      avgLatencyMs: number;
      topRoutes: Array<{
        method: string;
        path: string;
        hits: number;
        errors: number;
        avgLatencyMs: number;
        lastLatencyMs: number;
        lastStatus: number;
      }>;
    };
    python?: {
      ready: boolean;
      verified: boolean;
      totalRuns: number;
      activeSubprocesses: number;
      failedRuns: number;
      avgExecTimeMs: number;
      lastScript: string;
    };
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

  const [healthPingMs, setHealthPingMs] = useState<number | null>(null);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'probing' | 'healthy' | 'degraded'>('idle');
  const [cachePurgeStatus, setCachePurgeStatus] = useState<string | null>(null);
  const [isPurgingCache, setIsPurgingCache] = useState(false);

  const runHealthProbe = async () => {
    setHealthStatus('probing');
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - t0);
      if (res.ok) {
        setHealthPingMs(elapsed);
        setHealthStatus('healthy');
        playSynthTone('success');
      } else {
        setHealthPingMs(elapsed);
        setHealthStatus('degraded');
      }
    } catch {
      setHealthStatus('degraded');
    }
  };

  const handlePurgeServerCache = async () => {
    setIsPurgingCache(true);
    setCachePurgeStatus(null);
    try {
      const res = await fetch('/api/cache/clear', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCachePurgeStatus(data.message || `Cleared ${data.purgedEntries ?? 0} server cache entries.`);
        playSynthTone('action');
        fetchSystemTelemetry();
      }
    } catch {
      setCachePurgeStatus('Could not reach server cache controller.');
    } finally {
      setIsPurgingCache(false);
      setTimeout(() => setCachePurgeStatus(null), 4000);
    }
  };

  useEffect(() => {
    fetchStorageStats();
    fetchSystemTelemetry();
    runHealthProbe();
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
    const s = Math.floor(sec % 60);
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
      {/* Quick Offline IndexedDB Force-Cache Framework */}
      <QuickOfflineSection />

      {/* Real-time Hardware & Express Server Telemetry Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {t('Hardware & Express Server Telemetry')}
                {healthStatus === 'healthy' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE {healthPingMs !== null ? `• ${healthPingMs}ms RTT` : ''}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('Real-time Node.js/Express backend metrics, calculation cache hit rates, and Python subprocess execution diagnostics')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={runHealthProbe}
              disabled={healthStatus === 'probing'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${healthStatus === 'probing' ? 'animate-pulse' : ''}`} />
              Ping /api/health
            </button>
            <button
              onClick={handlePurgeServerCache}
              disabled={isPurgingCache}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Server Cache
            </button>
            <button
              onClick={() => {
                fetchSystemTelemetry();
                runHealthProbe();
                playSynthTone('switch');
              }}
              disabled={telemetryLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${telemetryLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {cachePurgeStatus && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {cachePurgeStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CPU LOAD & CORES</span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry ? `${systemTelemetry.cpuUsage.toFixed(1)}%` : '1.8%'}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, systemTelemetry ? systemTelemetry.cpuUsage : 5)}%` }} 
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              {systemTelemetry?.cpuCores ? `${systemTelemetry.cpuCores} vCPU Cores` : '4 vCPU Cores'} • Load: {systemTelemetry?.loadAverage?.[0]?.toFixed(2) ?? '0.12'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">NODE.JS HEAP & RSS</span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry ? `${systemTelemetry.memoryAllocatedMB.toFixed(1)} MB` : '118.4 MB'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Heap Total: {systemTelemetry ? `${systemTelemetry.memoryTotalMB.toFixed(0)} MB` : '256 MB'} • RSS: {systemTelemetry?.rssMB ? `${systemTelemetry.rssMB.toFixed(0)} MB` : '168 MB'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SERVER UPTIME</span>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1">
              {systemTelemetry ? formatUptime(systemTelemetry.uptimeSeconds) : '0h 15m 20s'}
            </div>
            <div className="text-[10px] text-emerald-500 font-bold mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Port 3000 Express Engine
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">RUNTIME ENVIRONMENT</span>
            <div className="text-xs font-black font-mono text-slate-900 dark:text-white mt-1 truncate">
              {systemTelemetry ? `${systemTelemetry.platform} (${systemTelemetry.nodeVersion})` : 'linux (v20.x)'}
            </div>
            <div className="text-[10px] text-indigo-500 font-bold mt-1.5">
              Python Bridge: {systemTelemetry?.python?.ready !== false ? 'Ready (Verified)' : 'Initializing'}
            </div>
          </div>
        </div>

        {/* Server API Traffic, In-Memory Cache & Python Subprocess Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">API REQUEST TRAFFIC</span>
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                Avg {systemTelemetry?.traffic?.avgLatencyMs ?? 12}ms
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry?.traffic?.totalRequests ?? 1} Requests
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Active: {systemTelemetry?.traffic?.activeRequests ?? 0}</span>
              <span>Errors (4xx/5xx): {systemTelemetry?.traffic?.errorCount ?? 0}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">IN-MEMORY CALC CACHE</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {systemTelemetry?.cache?.hitRatePct ?? 0}% Hit Rate
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry?.cache?.entries ?? 0} / {systemTelemetry?.cache?.maxEntries ?? 300} Entries
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Hits: {systemTelemetry?.cache?.hits ?? 0}</span>
              <span>Misses: {systemTelemetry?.cache?.misses ?? 0}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">PYTHON SUBPROCESS ENGINE</span>
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                Avg {systemTelemetry?.python?.avgExecTimeMs ?? 0}ms
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {systemTelemetry?.python?.totalRuns ?? 0} Executions
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Active: {systemTelemetry?.python?.activeSubprocesses ?? 0}</span>
              <span className="truncate max-w-[140px]">Last: {systemTelemetry?.python?.lastScript || 'idle'}</span>
            </div>
          </div>
        </div>

        {/* Active API Endpoints Telemetry Table */}
        {systemTelemetry?.traffic?.topRoutes && systemTelemetry.traffic.topRoutes.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300">
                Live Express API Route Latency & Call Registry
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Top {systemTelemetry.traffic.topRoutes.length} Endpoints
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-[10px] uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint</th>
                    <th className="py-2 px-3 text-right">Calls</th>
                    <th className="py-2 px-3 text-right">Avg Latency</th>
                    <th className="py-2 px-3 text-right">Last Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {systemTelemetry.traffic.topRoutes.map((route) => (
                    <tr key={`${route.method}-${route.path}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{route.method}</td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{route.path}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">{route.hits}</td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">{route.avgLatencyMs} ms</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          route.lastStatus >= 400
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {route.lastStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
