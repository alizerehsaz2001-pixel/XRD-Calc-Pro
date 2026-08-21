import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  Command,
  Sliders,
  Database,
  RefreshCw,
  CheckCircle2,
  WifiOff,
  Clock,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Check,
  Sun,
  Moon,
  Zap,
  Terminal as TermIcon,
  Palette,
  Activity,
  Layers,
  HelpCircle,
  Maximize2,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export type Module = string;

export interface ToastAlert {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
}

export type ThemeType = 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave' | 'dracula' | 'oceanic' | 'gruvbox' | 'monokai';

export interface ThemeOption {
  id: ThemeType;
  label: string;
  nativeLabel: string;
  icon: string;
  color: string;
  bgPreview: string;
  borderPreview: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: 'Light', nativeLabel: 'روشن (Clean Slate)', icon: '☀️', color: 'text-amber-500', bgPreview: 'bg-slate-100', borderPreview: 'border-slate-300' },
  { id: 'dark', label: 'Dark', nativeLabel: 'تاریک (Cosmic Dark)', icon: '🌙', color: 'text-indigo-400', bgPreview: 'bg-slate-900', borderPreview: 'border-indigo-500/40' },
  { id: 'cyberpunk', label: 'Cyberpunk', nativeLabel: 'سایبرپانک (Neon Cyber)', icon: '⚡', color: 'text-pink-500', bgPreview: 'bg-black', borderPreview: 'border-cyan-400' },
  { id: 'terminal', label: 'Terminal', nativeLabel: 'ترمینال (Matrix Green)', icon: '📟', color: 'text-emerald-400', bgPreview: 'bg-black', borderPreview: 'border-emerald-500' },
  { id: 'synthwave', label: 'Synthwave', nativeLabel: 'سینث‌ویو (Sunset Glow)', icon: '🌆', color: 'text-purple-400', bgPreview: 'bg-[#1a102f]', borderPreview: 'border-pink-500' },
  { id: 'dracula', label: 'Dracula', nativeLabel: 'دراکولا (Gothic Violet)', icon: '🦇', color: 'text-purple-300', bgPreview: 'bg-[#282a36]', borderPreview: 'border-purple-500' },
  { id: 'oceanic', label: 'Oceanic', nativeLabel: 'اقیانوسی (Deep Marine)', icon: '🌊', color: 'text-cyan-400', bgPreview: 'bg-[#0f172a]', borderPreview: 'border-cyan-500' },
  { id: 'gruvbox', label: 'Gruvbox', nativeLabel: 'گرووباکس (Warm Earth)', icon: '📦', color: 'text-amber-600', bgPreview: 'bg-[#282828]', borderPreview: 'border-amber-700' },
  { id: 'monokai', label: 'Monokai', nativeLabel: 'مونوکای (Code Studio)', icon: '🎨', color: 'text-yellow-400', bgPreview: 'bg-[#272822]', borderPreview: 'border-yellow-600' },
];

export interface TopAppBarProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  activeModule: Module;
  modules: { id: Module; label: string; group?: string; icon?: any; description?: string }[];
  getModuleIcon: (mod: Module, isActive?: boolean) => React.ReactNode;
  isNavigatorOpen: boolean;
  setIsNavigatorOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarPinned: boolean;
  setIsSidebarPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
  isExplained: boolean;
  setIsExplained: (explained: boolean) => void;
  currentClockTime: string;
  isOnline: boolean;
  firestoreSyncType: 'idle' | 'syncing' | 'success' | 'error';
  firestoreSyncProgress: number;
  firestoreSyncStatus: string;
  isSyncingWithFirestore: boolean;
  syncedItemsCount: number;
  totalSyncItems: number;
  syncStats: {
    totalAnalyses: number;
    pendingAnalyses: number;
    syncedAnalyses: number;
    totalMaterials: number;
    pendingMaterials: number;
    syncedMaterials: number;
  };
  lastSyncTime: string | null;
  formatLastSyncTimestamp: (t: string | null) => string;
  syncIndexedDBWithFirestore: (force?: boolean) => void;
  refreshOfflineAnalyses: () => void;
  pythonReady: boolean;
  setShowPythonStatus: (show: boolean) => void;
  setShowOfflineHub: (show: boolean) => void;
  skipIntros: boolean;
  setSkipIntros: (skip: boolean) => void;
  setShowShortcutsModal: (show: boolean) => void;
  playSynthTone: (tone: any) => void;
  isRTL: boolean;
  t: (key: string, defaultVal?: any) => any;
  sampleId?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  theme,
  setTheme,
  activeModule,
  modules,
  getModuleIcon,
  isNavigatorOpen,
  setIsNavigatorOpen,
  isSidebarPinned,
  setIsSidebarPinned,
  isExplained,
  setIsExplained,
  currentClockTime,
  isOnline,
  firestoreSyncType,
  firestoreSyncProgress,
  firestoreSyncStatus,
  isSyncingWithFirestore,
  syncedItemsCount,
  totalSyncItems,
  syncStats,
  lastSyncTime,
  formatLastSyncTimestamp,
  syncIndexedDBWithFirestore,
  refreshOfflineAnalyses,
  pythonReady,
  setShowPythonStatus,
  setShowOfflineHub,
  skipIntros,
  setSkipIntros,
  setShowShortcutsModal,
  playSynthTone,
  isRTL,
  t,
  sampleId
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showSyncTooltip, setShowSyncTooltip] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);
  
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const prevSyncTypeRef = useRef<string>(firestoreSyncType);
  const prevOnlineRef = useRef<boolean>(isOnline);
  const toastTimerRef = useRef<any>(null);

  // Helper to show non-intrusive toast alert
  const showToast = (toast: Omit<ToastAlert, 'id' | 'timestamp'>) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const newToast: ToastAlert = {
      ...toast,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    setActiveToast(newToast);

    // Auto dismiss after 4.5s for normal/success, 6s for errors
    const duration = toast.type === 'error' ? 6000 : 4200;
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, duration);
  };

  const dismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActiveToast(null);
  };

  // 1. Detect sync state transitions (syncing -> success / error)
  useEffect(() => {
    const prevSyncType = prevSyncTypeRef.current;
    prevSyncTypeRef.current = firestoreSyncType;

    // Trigger on sync success
    if (prevSyncType === 'syncing' && firestoreSyncType === 'success') {
      showToast({
        type: 'success',
        title: t('Database Synced', 'Database Synced'),
        message: firestoreSyncStatus || t('All offline IndexedDB records successfully mirrored to Firestore.', 'All offline IndexedDB records successfully mirrored to Firestore.')
      });
      playSynthTone('chime');
    } 
    // Trigger on sync failure / error
    else if (firestoreSyncType === 'error' && prevSyncType !== 'error') {
      showToast({
        type: 'error',
        title: t('Sync Alert', 'Sync Alert'),
        message: firestoreSyncStatus || t('Could not complete remote database sync. Local records remain safely preserved in IndexedDB.', 'Could not complete remote database sync. Local records remain safely preserved in IndexedDB.'),
        actionLabel: isOnline ? t('Retry', 'Retry') : undefined,
        onAction: isOnline ? () => syncIndexedDBWithFirestore(true) : undefined
      });
      playSynthTone('error');
    }
  }, [firestoreSyncType, firestoreSyncStatus, isOnline, syncIndexedDBWithFirestore, playSynthTone, t]);

  // 2. Detect online / offline network state changes
  useEffect(() => {
    const prevOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (prevOnline === true && isOnline === false) {
      showToast({
        type: 'info',
        title: t('Offline Mode Active', 'Offline Mode Active'),
        message: t('Operating in local mode. All XRD calculations and materials will persist in IndexedDB.', 'Operating in local mode. All XRD calculations and materials will persist in IndexedDB.')
      });
    } else if (prevOnline === false && isOnline === true) {
      showToast({
        type: 'success',
        title: t('Connection Restored', 'Connection Restored'),
        message: t('Network online. Ready to synchronize local cache with cloud database.', 'Network online. Ready to synchronize local cache with cloud database.'),
        actionLabel: t('Sync Now', 'Sync Now'),
        onAction: () => syncIndexedDBWithFirestore(true)
      });
      playSynthTone('chime');
    }
  }, [isOnline, syncIndexedDBWithFirestore, playSynthTone, t]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (systemMenuRef.current && !systemMenuRef.current.contains(e.target as Node)) {
        setShowSystemMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModuleObj = modules.find(m => m.id === activeModule);
  const currentThemeObj = THEME_OPTIONS.find(th => th.id === theme) || THEME_OPTIONS[0];

  return (
    <>
      {/* 1. Mobile Modern Top Navigation Bar */}
      <div 
        id="mobile-top-bar"
        className={`relative md:hidden border-b px-3.5 py-2.5 flex flex-col gap-2 z-30 shrink-0 shadow-sm transition-all duration-300 ${
          theme === 'cyberpunk'
            ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent'
            : 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100'
        }`}
      >
        {/* Progress Line */}
        <AnimatePresence>
          {(isSyncingWithFirestore || firestoreSyncType !== 'idle') && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-slate-200/20 dark:bg-slate-800/40 pointer-events-none"
            >
              <motion.div
                className={`h-full transition-all duration-300 ${
                  firestoreSyncType === 'error'
                    ? 'bg-amber-500'
                    : firestoreSyncType === 'success'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
                }`}
                style={{ width: `${firestoreSyncProgress}%` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Line: Brand, Language, Theme */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div 
            onClick={() => setIsNavigatorOpen(true)}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className={`w-7 h-7 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_10px_rgba(255,0,255,0.6)]' : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20'} rounded-lg flex items-center justify-center text-white font-black text-sm`}>
              λ
            </div>
            <span className="font-black text-base tracking-tight leading-none">
              XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
            </span>
          </div>

          {/* Controls: Language, Theme Quick Toggle */}
          <div className="flex items-center gap-1.5">
            <LanguageSelector compact={true} />
            
            {/* Quick Theme Switcher */}
            <button
              onClick={() => {
                const nextIdx = (THEME_OPTIONS.findIndex(t => t.id === theme) + 1) % THEME_OPTIONS.length;
                setTheme(THEME_OPTIONS[nextIdx].id);
                playSynthTone('switch');
              }}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                theme === 'cyberpunk'
                  ? 'bg-black border-cyber-accent text-cyber-accent'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
              }`}
              title="Toggle Theme"
            >
              <span>{currentThemeObj.icon}</span>
            </button>
          </div>
        </div>

        {/* Bottom Line: Active Module Switcher Bar */}
        <button
          onClick={() => {
            setIsNavigatorOpen(true);
            playSynthTone('switch');
          }}
          className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between gap-2 shadow-sm font-bold text-xs transition-all cursor-pointer ${
            theme === 'cyberpunk'
              ? 'bg-black border-cyber-accent text-cyber-accent hover:bg-cyber-accent/10'
              : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="p-1 rounded-md bg-indigo-600 text-white shrink-0 shadow-sm">
              {getModuleIcon(activeModule, true)}
            </div>
            <div className="flex flex-col text-left rtl:text-right overflow-hidden min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold leading-none truncate">
                {activeModuleObj?.group || t('Module', 'Module')}
              </span>
              <span className="text-xs font-black tracking-tight leading-tight truncate">
                {activeModuleObj?.label || activeModule}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/30 shrink-0">
            <span>{isRTL ? 'تغییر ماژول' : 'Modules'}</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* 2. Desktop High-End Scientific App Bar */}
      <header
        id="desktop-top-app-bar"
        className={`relative hidden md:flex items-center justify-between px-4 lg:px-6 py-2 border-b z-20 font-sans transition-all duration-300 shrink-0 ${
          theme === 'cyberpunk'
            ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent shadow-lg shadow-cyber-accent/5'
            : 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm'
        }`}
      >
        {/* Top Visual Sync Progress Line */}
        <AnimatePresence>
          {(isSyncingWithFirestore || firestoreSyncType !== 'idle') && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-slate-200/20 dark:bg-slate-800/40 pointer-events-none"
            >
              <motion.div
                className={`h-full transition-all duration-300 ${
                  firestoreSyncType === 'error'
                    ? 'bg-amber-500'
                    : firestoreSyncType === 'success'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
                }`}
                style={{ width: `${firestoreSyncProgress}%` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* LEFT SECTION: Brand, Active Module Hub & Sidebar Pin Toggle */}
        <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
          {/* App Brand & Logo */}
          {!isSidebarPinned && (
            <div
              id="topbar-brand-button"
              onClick={() => {
                setIsNavigatorOpen(true);
                playSynthTone('switch');
              }}
              className="flex items-center gap-2 cursor-pointer group shrink-0 select-none py-1 px-1.5 -ml-1 rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all"
              title={t('Open Scientific Suite Navigator (Ctrl+K)', 'Open Scientific Suite Navigator (Ctrl+K)')}
            >
              <div className={`w-8 h-8 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_12px_rgba(255,0,255,0.6)]' : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/25'} rounded-xl flex items-center justify-center text-white font-bold text-base group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300`}>
                λ
              </div>
              <div className="flex flex-col text-left rtl:text-right">
                <span className={`font-black text-base tracking-tight leading-none ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'}`}>
                  XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400 font-bold'}>Pro</span>
                </span>
                <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">
                  v2.5 Lab
                </span>
              </div>
            </div>
          )}

          {/* Active Module Controller Button (Full breadth, no truncation!) */}
          <button
            id="topbar-module-trigger-btn"
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow ${
              theme === 'cyberpunk'
                ? 'bg-black border-cyber-accent/60 hover:border-cyber-accent hover:bg-cyber-accent/10 text-cyber-accent'
                : 'bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border-indigo-200/90 dark:border-indigo-500/30 text-indigo-950 dark:text-indigo-100'
            }`}
            title={isRTL ? 'کلیک کنید یا Ctrl+K فشار دهید تا تمام ۲۸+ ماژول نمایش داده شوند' : 'Click or press Ctrl+K to browse all 28+ scientific modules'}
          >
            <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {getModuleIcon(activeModule, true)}
            </div>
            <div className="flex flex-col text-left rtl:text-right min-w-[130px] max-w-[240px] lg:max-w-[300px]">
              <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold leading-none truncate">
                {activeModuleObj?.group || t('Computational Suite', 'Computational Suite')}
              </span>
              <span className="text-xs font-black tracking-tight leading-tight text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {activeModuleObj?.label || activeModule}
              </span>
            </div>
            
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-[9.5px] font-mono font-bold text-indigo-400 border border-indigo-500/30 shrink-0">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
            
            <ChevronDown className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>

          {/* Sidebar Pin / Fullscreen Layout Toggle */}
          <button
            id="topbar-sidebar-toggle-btn"
            onClick={() => {
              setIsSidebarPinned(!isSidebarPinned);
              playSynthTone('switch');
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isSidebarPinned
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isSidebarPinned ? t('Expand to Full-Screen Workspace', 'Expand to Full-Screen Workspace') : t('Pin Sidebar on Left', 'Pin Sidebar on Left')}
          >
            {isSidebarPinned ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline text-[10px] font-mono uppercase tracking-wider">
              {isSidebarPinned ? t('Full-Screen', 'Full-Screen') : t('Sidebar', 'Sidebar')}
            </span>
          </button>
        </div>

        {/* CENTER SECTION: Quick Actions (Guide & Search Navigator) */}
        <div className="hidden md:flex items-center justify-center gap-2 flex-1 px-2 max-w-md mx-auto">
          {/* Interactive Theory Guide Pill */}
          {activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings' && (
            <button
              id="topbar-guide-trigger-btn"
              onClick={() => {
                setIsExplained(false);
                playSynthTone('switch');
              }}
              className={`px-3.5 py-1.5 rounded-full border text-[10.5px] font-bold tracking-wide cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 shadow-sm group ${
                theme === 'cyberpunk'
                  ? 'border-cyber-accent text-cyber-accent hover:bg-cyber-accent/15 bg-black shadow-[0_0_12px_rgba(0,255,255,0.2)]'
                  : 'border-indigo-200/80 dark:border-indigo-500/25 bg-gradient-to-r from-indigo-50/90 to-violet-50/90 dark:from-indigo-950/40 dark:to-violet-950/40 hover:from-indigo-100 dark:hover:from-indigo-900/60 text-indigo-900 dark:text-indigo-200'
              }`}
              title={t('Open the mathematical and theoretical fundamentals for this module', 'Open the mathematical and theoretical fundamentals for this module')}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:rotate-12 transition-transform animate-pulse" />
              <span>{t('Guide & Theory', 'Guide & Theory')}</span>
            </button>
          )}

          {/* Quick Navigator Pill */}
          <button
            id="topbar-quick-search-btn"
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-medium transition-all ${
              theme === 'cyberpunk'
                ? 'border-slate-800 bg-black/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50'
                : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:border-indigo-400/40 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={t('Search all XRD tools, equations, or methods (Press /)', 'Search all XRD tools, equations, or methods (Press /)')}
          >
            <Search className="w-3 h-3 text-slate-400" />
            <span className="truncate">{t('Search suite... (/)', 'Search suite... (/)')}</span>
          </button>
        </div>

        {/* RIGHT SECTION: Live Clock, Sync Status, System Hub, Language & Theme Selectors */}
        <div className="flex items-center justify-end gap-2 lg:gap-2.5 shrink-0">
          
          {/* 1. Real-time Precision Chronometer Display */}
          <div
            id="header-live-clock"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold shadow-sm select-none"
            title={t('Real-Time 24h Scientific Clock', 'Real-Time 24h Scientific Clock')}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>{currentClockTime}</span>
          </div>

          {/* 2. IndexedDB ↔ Cloud Sync Monitor Widget with Interactive Popover */}
          <div className="relative" id="indexeddb-sync-container">
            <button
              id="indexeddb-sync-button"
              onClick={() => {
                syncIndexedDBWithFirestore(true);
                playSynthTone('switch');
              }}
              onMouseEnter={() => setShowSyncTooltip(true)}
              onMouseLeave={() => setShowSyncTooltip(false)}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                firestoreSyncType === 'syncing'
                  ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  : firestoreSyncType === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                  : firestoreSyncType === 'error'
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : !isOnline
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
            >
              {firestoreSyncType === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <div className="flex flex-col text-left rtl:text-right leading-none">
                    <span className="text-[9px] font-black">{t('Syncing...', 'Syncing...')}</span>
                    <span className="text-[7.5px] font-mono opacity-80">{firestoreSyncProgress}%</span>
                  </div>
                </>
              ) : firestoreSyncType === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden xl:inline text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">{t('Synced', 'Synced')}</span>
                </>
              ) : firestoreSyncType === 'error' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden xl:inline text-[9.5px] font-bold text-amber-600 dark:text-amber-400">{t('Offline', 'Offline')}</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden xl:inline text-[9.5px]">{t('Sync', 'Sync')}</span>
                </>
              )}
            </button>

            {/* Sync Tooltip Popover */}
            <AnimatePresence>
              {showSyncTooltip && (
                <motion.div
                  id="indexeddb-sync-tooltip"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-full mt-2 w-72 sm:w-80 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl z-50 ${
                    isRTL ? 'left-0' : 'right-0'
                  } ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_25px_rgba(0,255,255,0.25)]'
                      : 'bg-slate-900/95 dark:bg-[#080E1E]/95 border-slate-700/70 dark:border-indigo-500/30 text-white shadow-2xl shadow-slate-950/80'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        firestoreSyncType === 'syncing'
                          ? 'bg-indigo-400 animate-ping'
                          : isOnline
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                          : 'bg-amber-400'
                      }`} />
                      <span className="text-[11px] font-black uppercase tracking-wider font-mono">
                        {t('Database Telemetry', 'Database Telemetry')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isOnline ? t('Online Cloud', 'Online Cloud') : t('Local IndexedDB', 'Local IndexedDB')}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="mb-2.5 p-2 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <div className="flex items-center justify-between text-[9.5px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {t('Last Sync Time:', 'Last Sync Time:')}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-mono font-bold text-indigo-300 pl-4 rtl:pl-0 rtl:pr-4">
                      {lastSyncTime ? formatLastSyncTimestamp(lastSyncTime) : t('No sync recorded yet', 'No sync recorded yet')}
                    </p>
                  </div>

                  {/* Items Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('Synced', 'Synced')}
                        </span>
                        <span className="font-mono">{syncStats.syncedAnalyses + syncStats.syncedMaterials}</span>
                      </div>
                      <div className="text-[8.5px] text-slate-300 font-mono space-y-0.5">
                        <div className="flex justify-between"><span>Analyses:</span><span>{syncStats.syncedAnalyses}</span></div>
                        <div className="flex justify-between"><span>Materials:</span><span>{syncStats.syncedMaterials}</span></div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
                      <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          {t('Pending', 'Pending')}
                        </span>
                        <span className="font-mono">{syncStats.pendingAnalyses + syncStats.pendingMaterials}</span>
                      </div>
                      <div className="text-[8.5px] text-slate-300 font-mono space-y-0.5">
                        <div className="flex justify-between"><span>Analyses:</span><span>{syncStats.pendingAnalyses}</span></div>
                        <div className="flex justify-between"><span>Materials:</span><span>{syncStats.pendingMaterials}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-white/10 text-[9px] text-slate-400 flex items-center justify-between">
                    <span>{t('Click icon to force manual sync', 'Click to trigger immediate sync')}</span>
                    <span className="font-mono text-indigo-400 font-bold">IndexedDB ↔ Firestore</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. System Tools & Engine Hub Popover */}
          <div className="relative" ref={systemMenuRef}>
            <button
              id="topbar-system-menu-btn"
              onClick={() => {
                setShowSystemMenu(!showSystemMenu);
                playSynthTone('switch');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                theme === 'cyberpunk'
                  ? 'border-cyber-accent text-cyber-accent bg-black hover:bg-cyber-accent/15'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
              title={t('System diagnostics, Python server engine & options', 'System diagnostics, Python server engine & options')}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">{t('System', 'System')}</span>
              {(!isOnline || !pythonReady) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {showSystemMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-full mt-2 w-64 rounded-2xl border p-3 space-y-2.5 shadow-2xl z-50 ${
                    isRTL ? 'left-0' : 'right-0'
                  } ${
                    theme === 'cyberpunk'
                      ? 'bg-black border-cyber-accent text-cyber-accent shadow-[0_0_25px_rgba(0,255,255,0.2)]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-1.5 flex items-center justify-between">
                    <span>{t('System & Integration', 'System & Integration')}</span>
                    <span className="font-mono text-[8.5px] text-indigo-500">v2.5</span>
                  </div>

                  {/* Python Engine */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${pythonReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="font-semibold">{t('Python Engine', 'Python Engine')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowPythonStatus(true);
                        setShowSystemMenu(false);
                        playSynthTone('switch');
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 text-[10px] transition-all"
                    >
                      {pythonReady ? t('Inspect', 'Inspect') : t('Init', 'Init')}
                    </button>
                  </div>

                  {/* Offline Database Hub */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="font-semibold">{t('IndexedDB Hub', 'IndexedDB Hub')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowOfflineHub(true);
                        refreshOfflineAnalyses();
                        setShowSystemMenu(false);
                        playSynthTone('switch');
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 text-[10px] transition-all"
                    >
                      {isOnline ? t('Sync Hub', 'Sync Hub') : t('Offline Hub', 'Offline Hub')}
                    </button>
                  </div>

                  {/* Auto-Skip Intros */}
                  {activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings' && (
                    <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-slate-100 dark:border-white/5">
                      <span className="font-semibold">{t('Skip Intros', 'Skip Intros')}</span>
                      <button
                        onClick={() => {
                          const nextVal = !skipIntros;
                          setSkipIntros(nextVal);
                          localStorage.setItem('xrd_skip_intros', nextVal.toString());
                          playSynthTone('switch');
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          skipIntros
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        {skipIntros ? t('Enabled', 'Enabled') : t('Disabled', 'Disabled')}
                      </button>
                    </div>
                  )}

                  {/* Hotkeys */}
                  <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-slate-100 dark:border-white/5">
                    <span className="font-semibold">{t('Hotkeys', 'Hotkeys')}</span>
                    <button
                      onClick={() => {
                        setShowShortcutsModal(true);
                        setShowSystemMenu(false);
                        playSynthTone('switch');
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-[10px] transition-all flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>Cmd+/</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Polished Custom Language Selector */}
          <LanguageSelector compact={true} />

          {/* 5. Luxury Custom Theme Selector (Replaces clunky HTML <select>) */}
          <div className="relative" ref={themeMenuRef}>
            <button
              id="topbar-theme-selector-btn"
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                playSynthTone('switch');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                theme === 'cyberpunk'
                  ? 'border-cyber-accent text-cyber-accent bg-black hover:bg-cyber-accent/15'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
              title={t('Change visual theme', 'Change visual theme')}
            >
              <span className="text-sm">{currentThemeObj.icon}</span>
              <span className="hidden sm:inline font-mono uppercase tracking-wider font-black">
                {currentThemeObj.label}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showThemeMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-full mt-2 w-56 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl z-50 ${
                    isRTL ? 'left-0' : 'right-0'
                  } ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_25px_rgba(0,255,255,0.2)]'
                      : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="px-2 py-1 text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 mb-1.5 flex items-center justify-between">
                    <span>{t('Themes', 'Themes')}</span>
                    <Palette className="w-3 h-3 text-indigo-400" />
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                    {THEME_OPTIONS.map((th) => {
                      const isSelected = theme === th.id;
                      return (
                        <button
                          key={th.id}
                          id={`theme-option-${th.id}`}
                          onClick={() => {
                            setTheme(th.id);
                            setShowThemeMenu(false);
                            playSynthTone('switch');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{th.icon}</span>
                            <span className="text-xs font-medium">
                              {isRTL ? th.nativeLabel : th.label}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      {/* Non-Intrusive Floating Toast Alert */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            id="topbar-toast-alert"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`fixed top-16 md:top-14 z-50 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px] shadow-2xl rounded-2xl p-3.5 border backdrop-blur-xl transition-all select-none ${
              isRTL ? 'left-4 sm:left-8' : 'right-4 sm:right-8'
            } ${
              theme === 'cyberpunk'
                ? activeToast.type === 'error'
                  ? 'bg-black/95 border-pink-500 text-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.35)]'
                  : activeToast.type === 'success'
                  ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_30px_rgba(0,255,255,0.35)]'
                  : 'bg-black/95 border-purple-500 text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.35)]'
                : activeToast.type === 'error'
                ? 'bg-rose-950/95 dark:bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/40'
                : activeToast.type === 'success'
                ? 'bg-slate-900/95 dark:bg-slate-950/95 border-emerald-500/40 text-slate-100 shadow-slate-950/50'
                : 'bg-slate-900/95 dark:bg-slate-950/95 border-indigo-500/40 text-slate-100 shadow-slate-950/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon Status */}
              <div className="shrink-0 mt-0.5">
                {activeToast.type === 'success' ? (
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : activeToast.type === 'error' ? (
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Text Information */}
              <div className="flex-1 min-w-0 pr-1 rtl:pr-0 rtl:pl-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black tracking-tight leading-tight">
                    {activeToast.title}
                  </h4>
                  <span className="text-[9px] font-mono opacity-50 shrink-0">
                    {t('just now', 'just now')}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5 leading-snug break-words">
                  {activeToast.message}
                </p>

                {/* Optional Retry Action button */}
                {activeToast.actionLabel && activeToast.onAction && (
                  <div className="mt-2.5 flex justify-start">
                    <button
                      id="topbar-toast-action-btn"
                      onClick={() => {
                        activeToast.onAction?.();
                        dismissToast();
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{activeToast.actionLabel}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                id="topbar-toast-close-btn"
                onClick={dismissToast}
                className="p-1 rounded-lg hover:bg-white/10 opacity-60 hover:opacity-100 transition-all text-slate-300 hover:text-white shrink-0 -mr-1 -mt-1 cursor-pointer"
                title={t('Dismiss', 'Dismiss')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtle Progress Bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: activeToast.type === 'error' ? 6 : 4.2, ease: 'linear' }}
              className={`h-0.5 mt-2.5 rounded-full origin-left rtl:origin-right ${
                activeToast.type === 'error'
                  ? 'bg-rose-500/60'
                  : activeToast.type === 'success'
                  ? 'bg-emerald-400/60'
                  : 'bg-indigo-400/60'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopAppBar;
