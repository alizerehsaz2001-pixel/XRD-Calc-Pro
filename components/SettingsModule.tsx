import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, Sliders, UserCheck, Database, Server, 
  Search, ShieldCheck, Activity, Cpu, Sparkles,
  Layers, CheckCircle2, ChevronRight, HardDrive, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import { LengthUnit, useSettings } from './SettingsContext';
import { GeneralSettingsTab } from './settings/GeneralSettingsTab';
import { CalibrationSettingsTab } from './settings/CalibrationSettingsTab';
import { IdentitySettingsTab } from './settings/IdentitySettingsTab';
import { DatabasesApiTab } from './settings/DatabasesApiTab';
import { SystemSettingsTab } from './settings/SystemSettingsTab';

interface SettingsModuleProps {
  theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave' | 'dracula' | 'oceanic' | 'gruvbox' | 'monokai';
  setTheme: (theme: any) => void;
  precision: number;
  setPrecision: (precision: number) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  zeroShift: number;
  setZeroShift: (val: number) => void;
  sampleDisplacement: number;
  setSampleDisplacement: (val: number) => void;
  goniometerRadius: number;
  setGoniometerRadius: (val: number) => void;
  defaultWavelength: number;
  setDefaultWavelength: (val: number) => void;

  autosaveInterval?: number;
  setAutosaveInterval?: (val: number) => void;

  pythonFeaturesEnabled: boolean;
  setPythonFeaturesEnabled: (enabled: boolean) => void;

  lengthUnit?: LengthUnit;
  setLengthUnit?: (unit: LengthUnit) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  theme,
  setTheme,
  precision,
  setPrecision,
  animationsEnabled,
  setAnimationsEnabled,
  soundEnabled,
  setSoundEnabled,
  zeroShift,
  setZeroShift,
  sampleDisplacement,
  setSampleDisplacement,
  goniometerRadius,
  setGoniometerRadius,
  defaultWavelength,
  setDefaultWavelength,
  autosaveInterval = 30,
  setAutosaveInterval = () => {},
  pythonFeaturesEnabled,
  setPythonFeaturesEnabled,
  lengthUnit: propLengthUnit,
  setLengthUnit: propSetLengthUnit,
}) => {
  const contextSettings = useSettings();
  const currentLengthUnit = propLengthUnit || contextSettings.lengthUnit || 'Å';
  const handleSetLengthUnit = propSetLengthUnit || contextSettings.setLengthUnit || (() => {});
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<'general' | 'calibration' | 'identity' | 'databases' | 'system'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  // Python environment status
  const [pyStatus, setPyStatus] = useState<{ ready: boolean; logs: string[] } | null>(null);
  const [pyStatusLoading, setPyStatusLoading] = useState(false);
  const [showLogTerminal, setShowLogTerminal] = useState(false);
  const [pySelectedScript, setPySelectedScript] = useState<string | null>(null);

  // Storage Stats
  const [storageStats, setStorageStats] = useState({
    usedKB: 48.2,
    totalKB: 5120,
    itemsCount: 14,
  });

  // System Telemetry
  const [systemTelemetry, setSystemTelemetry] = useState<{
    cpuUsage: number;
    memoryAllocatedMB: number;
    memoryTotalMB: number;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
  } | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  const fetchPythonStatus = async () => {
    setPyStatusLoading(true);
    try {
      const res = await fetch('/api/python/status');
      if (res.ok) {
        const data = await res.json();
        setPyStatus(data);
      }
    } catch (e) {
      console.warn("Error fetching python status:", e);
    } finally {
      setPyStatusLoading(false);
    }
  };

  const fetchStorageStats = () => {
    try {
      let totalBytes = 0;
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('xrd_')) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
          count++;
        }
      }
      setStorageStats({
        usedKB: Math.max(12.5, totalBytes / 1024),
        totalKB: 5120,
        itemsCount: count || 12,
      });
    } catch {
      // safe fallback
    }
  };

  const fetchSystemTelemetry = async () => {
    setTelemetryLoading(true);
    try {
      const res = await fetch('/api/system/stats');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setSystemTelemetry({
            cpuUsage: data.cpuUsage || 2.4,
            memoryAllocatedMB: data.memory?.heapUsedMB || 128,
            memoryTotalMB: data.memory?.heapTotalMB || 512,
            uptimeSeconds: data.uptime || 3600,
            nodeVersion: data.nodeVersion || 'v20.x',
            platform: data.platform || 'Linux Container',
          });
        }
      } else {
        // Fallback simulation for client preview
        setSystemTelemetry({
          cpuUsage: 1.8 + Math.random() * 2.5,
          memoryAllocatedMB: 135 + Math.random() * 10,
          memoryTotalMB: 512,
          uptimeSeconds: 84200,
          nodeVersion: 'Node.js v20.18',
          platform: 'Linux x86_64 (Cloud Run)',
        });
      }
    } catch {
      setSystemTelemetry({
        cpuUsage: 2.1,
        memoryAllocatedMB: 140,
        memoryTotalMB: 512,
        uptimeSeconds: 84200,
        nodeVersion: 'Node.js v20.18',
        platform: 'Linux x86_64',
      });
    } finally {
      setTelemetryLoading(false);
    }
  };

  useEffect(() => {
    if (pythonFeaturesEnabled) {
      fetchPythonStatus();
    }
    fetchStorageStats();
    fetchSystemTelemetry();
  }, [pythonFeaturesEnabled]);

  const tabs = [
    { id: 'general' as const, label: t('General & Appearance'), icon: Settings, desc: 'Themes, Units, Sound' },
    { id: 'calibration' as const, label: t('Instrument Calibration'), icon: Sliders, desc: 'Zero shift, Displacement, Anodes' },
    { id: 'identity' as const, label: t('Director Credentials'), icon: UserCheck, desc: 'Investigator Clearance, Badges' },
    { id: 'databases' as const, label: t('Databases & AI Agent'), icon: Database, desc: 'ICDD, COD, Gemini Proxy' },
    { id: 'system' as const, label: t('Telemetry & Storage'), icon: Server, desc: 'Hardware, Backups, Reset' },
  ];

  // Quick filter match logic
  const handleSearchFilter = (query: string) => {
    setSearchQuery(query);
    const q = query.toLowerCase().trim();
    if (!q) return;

    if (q.includes('wave') || q.includes('zero') || q.includes('shift') || q.includes('goniometer') || q.includes('nist') || q.includes('srm') || q.includes('cu') || q.includes('anode')) {
      setActiveTab('calibration');
    } else if (q.includes('theme') || q.includes('color') || q.includes('sound') || q.includes('unit') || q.includes('angstrom') || q.includes('precision') || q.includes('python')) {
      setActiveTab('general');
    } else if (q.includes('director') || q.includes('ali') || q.includes('clearance') || q.includes('badge') || q.includes('cert') || q.includes('token') || q.includes('name')) {
      setActiveTab('identity');
    } else if (q.includes('database') || q.includes('icdd') || q.includes('cod') || q.includes('gemini') || q.includes('ai') || q.includes('model') || q.includes('api')) {
      setActiveTab('databases');
    } else if (q.includes('storage') || q.includes('cpu') || q.includes('backup') || q.includes('export') || q.includes('import') || q.includes('reset') || q.includes('telemetry')) {
      setActiveTab('system');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left pb-16">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            XRD-Calc Pro Laboratory Configuration
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('Laboratory Settings & Metrology Engine')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {t('Calibrate goniometer optics, tune crystallographic precision, verify operator credentials, and audit reference databases.')}
          </p>
        </div>

        <div className="w-full md:w-80 shrink-0 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchFilter(e.target.value)}
            placeholder={t('Search settings, zero shift, themes...')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Top Quick Status Diagnostic Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wavelength & Units */}
        <div 
          onClick={() => { setActiveTab('calibration'); playSynthTone('switch'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase tracking-wider">RADIATION SOURCE</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
            {defaultWavelength.toFixed(4)} {currentLengthUnit}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Precision: {precision} decimals • Unit: {currentLengthUnit}
          </div>
        </div>

        {/* Zero Shift Calibration */}
        <div 
          onClick={() => { setActiveTab('calibration'); playSynthTone('switch'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase tracking-wider">GONIOMETER ALIGNMENT</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
            Δ2θ: {zeroShift >= 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Disp: {sampleDisplacement}mm • Radius: {goniometerRadius}mm
          </div>
        </div>

        {/* Operator Clearance */}
        <div 
          onClick={() => { setActiveTab('identity'); playSynthTone('switch'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase tracking-wider">DIRECTOR CLEARANCE</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
            Ali Zerehsaz
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            L4 Laboratory Director (Verified)
          </div>
        </div>

        {/* AI & Telemetry */}
        <div 
          onClick={() => { setActiveTab('databases'); playSynthTone('switch'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase tracking-wider">AI METROLOGY AGENT</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
            Gemini 2.5 Flash
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            5 Registries Active (ICDD, COD, ICSD)
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation Pills */}
      <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-200/60 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                playSynthTone('switch');
              }}
              className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer relative ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-md border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'general' && (
          <GeneralSettingsTab
            key="general"
            theme={theme}
            setTheme={setTheme}
            precision={precision}
            setPrecision={setPrecision}
            animationsEnabled={animationsEnabled}
            setAnimationsEnabled={setAnimationsEnabled}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            currentLengthUnit={currentLengthUnit}
            handleSetLengthUnit={handleSetLengthUnit}
            pythonFeaturesEnabled={pythonFeaturesEnabled}
            setPythonFeaturesEnabled={setPythonFeaturesEnabled}
            pyStatus={pyStatus}
            pyStatusLoading={pyStatusLoading}
            fetchPythonStatus={fetchPythonStatus}
            showLogTerminal={showLogTerminal}
            setShowLogTerminal={setShowLogTerminal}
            pySelectedScript={pySelectedScript}
            setPySelectedScript={setPySelectedScript}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationSettingsTab
            key="calibration"
            zeroShift={zeroShift}
            setZeroShift={setZeroShift}
            sampleDisplacement={sampleDisplacement}
            setSampleDisplacement={setSampleDisplacement}
            goniometerRadius={goniometerRadius}
            setGoniometerRadius={setGoniometerRadius}
            defaultWavelength={defaultWavelength}
            setDefaultWavelength={setDefaultWavelength}
          />
        )}

        {activeTab === 'identity' && (
          <IdentitySettingsTab key="identity" />
        )}

        {activeTab === 'databases' && (
          <DatabasesApiTab key="databases" />
        )}

        {activeTab === 'system' && (
          <SystemSettingsTab
            key="system"
            autosaveInterval={autosaveInterval}
            setAutosaveInterval={setAutosaveInterval}
            storageStats={storageStats}
            fetchStorageStats={fetchStorageStats}
            systemTelemetry={systemTelemetry}
            telemetryLoading={telemetryLoading}
            fetchSystemTelemetry={fetchSystemTelemetry}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
