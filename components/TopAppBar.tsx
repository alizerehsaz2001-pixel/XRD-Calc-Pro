import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  Command,
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
  Palette,
  Activity,
  Layers,
  AlertTriangle,
  Info,
  X,
  FlaskConical,
  SlidersHorizontal,
  User,
  LogOut,
  LogIn,
  Settings2,
  ShieldCheck,
  Compass,
  Home
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { SAMPLE_PRESETS, SamplePreset } from './QuickWorkflowRibbon';

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
  { id: 'light', label: 'Light', nativeLabel: 'Clean Slate', icon: '☀️', color: 'text-amber-500', bgPreview: 'bg-slate-100', borderPreview: 'border-slate-300' },
  { id: 'dark', label: 'Dark', nativeLabel: 'Cosmic Dark', icon: '🌙', color: 'text-indigo-400', bgPreview: 'bg-slate-900', borderPreview: 'border-indigo-500/40' },
  { id: 'cyberpunk', label: 'Cyberpunk', nativeLabel: 'Neon Cyber', icon: '⚡', color: 'text-pink-500', bgPreview: 'bg-black', borderPreview: 'border-cyan-400' },
  { id: 'terminal', label: 'Terminal', nativeLabel: 'Matrix Green', icon: '📟', color: 'text-emerald-400', bgPreview: 'bg-black', borderPreview: 'border-emerald-500' },
  { id: 'synthwave', label: 'Synthwave', nativeLabel: 'Sunset Glow', icon: '🌆', color: 'text-purple-400', bgPreview: 'bg-[#1a102f]', borderPreview: 'border-pink-500' },
  { id: 'dracula', label: 'Dracula', nativeLabel: 'Gothic Violet', icon: '🦇', color: 'text-purple-300', bgPreview: 'bg-[#282a36]', borderPreview: 'border-purple-500' },
  { id: 'oceanic', label: 'Oceanic', nativeLabel: 'Deep Marine', icon: '🌊', color: 'text-cyan-400', bgPreview: 'bg-[#0f172a]', borderPreview: 'border-cyan-500' },
  { id: 'gruvbox', label: 'Gruvbox', nativeLabel: 'Warm Earth', icon: '📦', color: 'text-amber-600', bgPreview: 'bg-[#282828]', borderPreview: 'border-amber-700' },
  { id: 'monokai', label: 'Monokai', nativeLabel: 'Code Studio', icon: '🎨', color: 'text-yellow-400', bgPreview: 'bg-[#272822]', borderPreview: 'border-yellow-600' },
];

export interface TopAppBarProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  activeModule: Module;
  setActiveModule?: (module: any) => void;
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
  onOpenActivityLedger?: () => void;
  wavelength?: number;
  setWavelength?: (w: number) => void;
  onCalculate?: () => void;
  onBatchCalculate?: () => void;
  onClearAll?: () => void;
  onExportPdf?: () => void;
  onLoadPreset?: (preset: SamplePreset) => void;
  showQuickRibbon?: boolean;
  onToggleQuickRibbon?: () => void;
  user?: any;
  userProfile?: {
    name?: string;
    email?: string;
    organization?: string;
    researchRole?: string;
    photoURL?: string;
  } | null;
  onSignOut?: () => void;
  onSignIn?: () => void;
  onOpenWelcome?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  theme,
  setTheme,
  activeModule,
  setActiveModule,
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
  onOpenActivityLedger,
  onLoadPreset,
  showQuickRibbon = false,
  onToggleQuickRibbon,
  user,
  userProfile,
  onSignOut,
  onSignIn,
  onOpenWelcome
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showSyncTooltip, setShowSyncTooltip] = useState(false);
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);
  
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const sampleMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevSyncTypeRef = useRef<string>(firestoreSyncType);
  const prevOnlineRef = useRef<boolean>(isOnline);
  const toastTimerRef = useRef<any>(null);

  // Derive active researcher / logged-in user profile info
  const [userInfo, setUserInfo] = useState(() => {
    let name = user?.displayName || userProfile?.name || '';
    let email = user?.email || userProfile?.email || '';
    let photo = user?.photoURL || userProfile?.photoURL || null;

    try {
      const regStr = localStorage.getItem('xrd_user_registration');
      if (regStr) {
        const reg = JSON.parse(regStr);
        if (!name && reg.name) name = reg.name;
        if (!email && reg.email) email = reg.email;
      }
    } catch {}

    try {
      const profStr = localStorage.getItem('lab_director_profile_payload');
      if (profStr) {
        const prof = JSON.parse(profStr);
        if (!name && (prof.firstName || prof.lastName)) {
          name = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
        }
      }
    } catch {}

    if (!name && email) {
      name = email.split('@')[0];
    }
    if (!name) name = 'Ali Zerehsaz';
    if (!email) email = 'alizerehsaz2001@gmail.com';

    const parts = name.trim().split(/\s+/);
    let initials = 'AZ';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts[0]?.length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (parts[0]?.length === 1) {
      initials = parts[0][0].toUpperCase();
    }

    return { name, email, photo, initials };
  });

  useEffect(() => {
    let name = user?.displayName || userProfile?.name || '';
    let email = user?.email || userProfile?.email || '';
    let photo = user?.photoURL || userProfile?.photoURL || null;

    try {
      const regStr = localStorage.getItem('xrd_user_registration');
      if (regStr) {
        const reg = JSON.parse(regStr);
        if (!name && reg.name) name = reg.name;
        if (!email && reg.email) email = reg.email;
      }
    } catch {}

    try {
      const profStr = localStorage.getItem('lab_director_profile_payload');
      if (profStr) {
        const prof = JSON.parse(profStr);
        if (!name && (prof.firstName || prof.lastName)) {
          name = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
        }
      }
    } catch {}

    if (!name && email) {
      name = email.split('@')[0];
    }
    if (!name) name = 'Ali Zerehsaz';
    if (!email) email = 'alizerehsaz2001@gmail.com';

    const parts = name.trim().split(/\s+/);
    let initials = 'AZ';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts[0]?.length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (parts[0]?.length === 1) {
      initials = parts[0][0].toUpperCase();
    }

    setUserInfo({ name, email, photo, initials });
  }, [user, userProfile]);

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

    const duration = toast.type === 'error' ? 6000 : 3800;
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

  // Detect sync state transitions
  useEffect(() => {
    const prevSyncType = prevSyncTypeRef.current;
    prevSyncTypeRef.current = firestoreSyncType;

    if (prevSyncType === 'syncing' && firestoreSyncType === 'success') {
      showToast({
        type: 'success',
        title: t('Database Synced', 'Database Synced'),
        message: firestoreSyncStatus || t('All offline IndexedDB records successfully mirrored to Firestore.', 'All offline IndexedDB records successfully mirrored to Firestore.')
      });
      playSynthTone('chime');
    } else if (firestoreSyncType === 'error' && prevSyncType !== 'error') {
      showToast({
        type: 'error',
        title: t('Sync Alert', 'Sync Alert'),
        message: firestoreSyncStatus || t('Could not complete remote database sync. Local records preserved in IndexedDB.', 'Could not complete remote database sync. Local records preserved in IndexedDB.'),
        actionLabel: isOnline ? t('Retry', 'Retry') : undefined,
        onAction: isOnline ? () => syncIndexedDBWithFirestore(true) : undefined
      });
      playSynthTone('error');
    }
  }, [firestoreSyncType, firestoreSyncStatus, isOnline, syncIndexedDBWithFirestore, playSynthTone, t]);

  // Detect online / offline network state changes
  useEffect(() => {
    const prevOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (prevOnline === true && isOnline === false) {
      showToast({
        type: 'info',
        title: t('Offline Mode Active', 'Offline Mode Active'),
        message: t('Operating in local mode. All XRD calculations persist in IndexedDB.', 'Operating in local mode. All XRD calculations persist in IndexedDB.')
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
      if (sampleMenuRef.current && !sampleMenuRef.current.contains(e.target as Node)) {
        setShowSampleDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModuleObj = modules.find(m => m.id === activeModule);
  const currentThemeObj = THEME_OPTIONS.find(th => th.id === theme) || THEME_OPTIONS[0];

  const handleSelectPreset = (preset: SamplePreset) => {
    setShowSampleDropdown(false);
    if (onLoadPreset) {
      onLoadPreset(preset);
      showToast({
        type: 'success',
        title: t('Sample Loaded', 'Sample Loaded'),
        message: `${preset.name} (${preset.chemicalFormula}) loaded into ${preset.targetModule}.`
      });
    }
  };

  return (
    <>
      {/* 1. Mobile Top Navigation Bar (Single, compact, clean row) */}
      <div 
        id="mobile-top-bar"
        className={`md:hidden border-b px-3 py-2 flex items-center justify-between gap-2 z-30 shrink-0 select-none transition-all duration-200 ${
          theme === 'cyberpunk'
            ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100'
        }`}
      >
        {/* Brand & Active Module Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div 
            onClick={() => setIsNavigatorOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <div className={`w-7 h-7 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_10px_rgba(255,0,255,0.6)]' : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xs'} rounded-lg flex items-center justify-center text-white font-black text-sm`}>
              λ
            </div>
            <span className="font-bold text-sm tracking-tight leading-none hidden xs:inline">
              XRD<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-xs font-bold truncate max-w-[170px]"
          >
            <span className="truncate">{activeModuleObj?.label || activeModule}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Mobile Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Welcome Page Button (Mobile) */}
          {onOpenWelcome && (
            <button
              onClick={() => {
                onOpenWelcome();
                playSynthTone('switch');
              }}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
              title={t('Welcome Page & Tour', 'Welcome Page & Tour')}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </button>
          )}

          {/* Quick Search */}
          <button
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Search Tools"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Theme Switcher */}
          <button
            onClick={() => {
              const nextIdx = (THEME_OPTIONS.findIndex(t => t.id === theme) + 1) % THEME_OPTIONS.length;
              setTheme(THEME_OPTIONS[nextIdx].id);
              playSynthTone('switch');
            }}
            className="p-1.5 rounded-lg text-xs font-bold"
            title="Toggle Theme"
          >
            <span>{currentThemeObj.icon}</span>
          </button>

          {/* Logged-in User Circle */}
          <button
            id="mobile-user-avatar-btn"
            onClick={() => {
              if (setActiveModule) {
                setActiveModule('profile');
                playSynthTone('switch');
              }
            }}
            className="relative p-0.5 rounded-full cursor-pointer transition-transform active:scale-95 shrink-0"
            title={`${userInfo.name} (${userInfo.email})`}
          >
            {userInfo.photo ? (
              <img
                src={userInfo.photo}
                alt={userInfo.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black text-[10.5px] flex items-center justify-center ring-2 ring-indigo-500/30 shadow-xs">
                {userInfo.initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />
          </button>
        </div>
      </div>

      {/* 2. Desktop Minimalist Top App Bar (Sleek, organized, single-tier) */}
      <header
        id="desktop-top-app-bar"
        className={`relative hidden md:flex items-center justify-between px-4 lg:px-6 h-14 border-b z-20 font-sans transition-all duration-200 shrink-0 select-none ${
          theme === 'cyberpunk'
            ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent shadow-xs'
            : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-xs'
        }`}
      >
        {/* Top Sync Progress Line */}
        <AnimatePresence>
          {(isSyncingWithFirestore || firestoreSyncType !== 'idle') && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute top-0 left-0 right-0 h-[2px] z-50 overflow-hidden bg-slate-200/30 dark:bg-slate-800/40 pointer-events-none"
            >
              <motion.div
                className={`h-full transition-all duration-300 ${
                  firestoreSyncType === 'error'
                    ? 'bg-amber-500'
                    : firestoreSyncType === 'success'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${firestoreSyncProgress}%` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* LEFT SECTION: Logo, Breadcrumb / Module Switcher, Sidebar Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Logo & Brand */}
          {!isSidebarPinned && (
            <div
              id="topbar-brand-button"
              onClick={() => {
                if (onOpenWelcome) {
                  onOpenWelcome();
                } else {
                  setIsNavigatorOpen(true);
                }
                playSynthTone('switch');
              }}
              className="flex items-center gap-2 cursor-pointer group shrink-0 py-1 px-1.5 -ml-1 rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all"
              title={t('Return to Welcome Page & Showcase', 'Return to Welcome Page & Showcase')}
            >
              <div className={`w-7 h-7 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_10px_rgba(255,0,255,0.6)]' : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xs'} rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform`}>
                λ
              </div>
              <span className={`font-black text-sm tracking-tight leading-none ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'}`}>
                XRD<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
              </span>
            </div>
          )}

          {!isSidebarPinned && (
            <span className="text-slate-300 dark:text-slate-700 font-mono text-xs">/</span>
          )}

          {/* Active Module Controller Pill */}
          <button
            id="topbar-module-trigger-btn"
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all duration-150 cursor-pointer group ${
              theme === 'cyberpunk'
                ? 'bg-black border-cyber-accent/50 hover:border-cyber-accent text-cyber-accent'
                : 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100'
            }`}
            title={t('Click to browse all 30+ scientific tools (Ctrl+K)', 'Click to browse all tools (Ctrl+K)')}
          >
            <div className="w-4 h-4 text-indigo-500 shrink-0">
              {getModuleIcon(activeModule, true)}
            </div>
            <span className="text-xs font-bold tracking-tight truncate max-w-[150px] lg:max-w-[200px]">
              {activeModuleObj?.label || activeModule}
            </span>
            <div className="hidden lg:flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-500/10 text-[9px] font-mono font-bold text-indigo-500 dark:text-indigo-300 border border-indigo-500/20">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>

          {/* Welcome Page Button (Desktop) */}
          {onOpenWelcome && (
            <button
              id="topbar-welcome-page-btn"
              onClick={() => {
                onOpenWelcome();
                playSynthTone('switch');
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              title={t('Return to Welcome Page & Showcase', 'Return to Welcome Page & Showcase')}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="hidden xl:inline">{t('Welcome Page', 'Welcome Page')}</span>
            </button>
          )}

          {/* Sidebar Toggle Button */}
          <button
            id="topbar-sidebar-toggle-btn"
            onClick={() => {
              setIsSidebarPinned(!isSidebarPinned);
              playSynthTone('switch');
            }}
            className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title={isSidebarPinned ? t('Collapse Sidebar to Mini Rail', 'Collapse Sidebar to Mini Rail') : t('Expand Sidebar', 'Expand Sidebar')}
          >
            {isSidebarPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* CENTER SECTION: Minimalist Command Search Pill */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-sm mx-4">
          <button
            id="topbar-quick-search-btn"
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              theme === 'cyberpunk'
                ? 'border-cyber-accent/40 bg-black/60 text-slate-400 hover:text-cyber-accent hover:border-cyber-accent'
                : 'border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:border-indigo-400/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Search suite tools, equations, or methods (Press / or Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('Search 30+ tools, formulas... (/ )', 'Search 30+ tools, formulas... (/ )')}</span>
            </div>
            <kbd className="hidden xl:inline text-[9.5px] font-mono text-slate-400 border border-slate-300 dark:border-slate-700 rounded px-1">⌘K</kbd>
          </button>
        </div>

        {/* RIGHT SECTION: Organized, Minimalist Action Set */}
        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
          {/* 1. Quick Sample Datasets Dropdown */}
          <div className="relative" ref={sampleMenuRef}>
            <button
              onClick={() => {
                setShowSampleDropdown(prev => !prev);
                playSynthTone('switch');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                showSampleDropdown
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
              title={t('Load pre-configured standard diffraction datasets', 'Load pre-configured standard diffraction datasets')}
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">{t('Sample Data', 'Sample Data')}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSampleDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSampleDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-xl p-2 z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 shadow-slate-900/20'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
                    <span>{t('Standard Samples', 'Standard Samples')}</span>
                    <span className="font-mono text-[9px]">1-Click</span>
                  </div>

                  <div className="space-y-1">
                    {SAMPLE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all flex flex-col cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {p.name}
                          </span>
                          <span className="text-[9px] font-mono text-indigo-500 font-semibold">{p.badge}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Guide & Theory Trigger */}
          {activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings' && (
            <button
              id="topbar-guide-trigger-btn"
              onClick={() => {
                setIsExplained(false);
                playSynthTone('switch');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              title={t('Open theoretical principles and formulas for this module', 'Open theoretical principles and formulas')}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden xl:inline">{t('Theory', 'Theory')}</span>
            </button>
          )}

          {/* 3. Quick Modules Strip Toggle Button */}
          {onToggleQuickRibbon && (
            <button
              onClick={onToggleQuickRibbon}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                showQuickRibbon
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
              title={showQuickRibbon ? t('Hide Quick Modules Strip', 'Hide Quick Modules Strip') : t('Show Quick Modules Strip', 'Show Quick Modules Strip')}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {/* 4. Cloud & Offline Database Sync Indicator */}
          <div className="relative" id="indexeddb-sync-container">
            <button
              id="indexeddb-sync-button"
              onClick={() => {
                syncIndexedDBWithFirestore(true);
                playSynthTone('switch');
              }}
              onMouseEnter={() => setShowSyncTooltip(true)}
              onMouseLeave={() => setShowSyncTooltip(false)}
              className={`p-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all relative ${
                firestoreSyncType === 'syncing'
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                  : !isOnline
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
              title="Database Sync Status"
            >
              {firestoreSyncType === 'syncing' ? (
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-500" />
              ) : (
                <Database className="w-4 h-4 text-indigo-500" />
              )}
              {isOnline && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
              )}
            </button>

            {/* Sync Popover */}
            <AnimatePresence>
              {showSyncTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-72 p-3 rounded-2xl border shadow-xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-slate-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                        {t('Database Status', 'Database Status')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      {isOnline ? 'Online' : 'IndexedDB Local'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Synced Items</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {syncStats.syncedAnalyses + syncStats.syncedMaterials}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Pending</span>
                      <span className="font-mono font-bold text-amber-500">
                        {syncStats.pendingAnalyses + syncStats.pendingMaterials}
                      </span>
                    </div>
                  </div>

                  <div className="text-[9.5px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Last Sync:</span>
                    <span>{lastSyncTime ? formatLastSyncTimestamp(lastSyncTime) : 'Ready'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. Clean System & Diagnostics Popover */}
          <div className="relative" ref={systemMenuRef}>
            <button
              id="topbar-system-menu-btn"
              onClick={() => {
                setShowSystemMenu(!showSystemMenu);
                playSynthTone('switch');
              }}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-all cursor-pointer relative"
              title={t('System diagnostics & engine options', 'System diagnostics & engine options')}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {(!isOnline || !pythonReady) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            <AnimatePresence>
              {showSystemMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-64 rounded-2xl border p-3 space-y-2.5 shadow-xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-slate-900/20'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-1.5 flex items-center justify-between">
                    <span>{t('System & Tools', 'System & Tools')}</span>
                    <span className="font-mono text-indigo-500">{currentClockTime}</span>
                  </div>

                  {/* Python Engine */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${pythonReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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

                  {/* Activity Ledger */}
                  {onOpenActivityLedger && (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold">{t('Activity Ledger', 'Activity Ledger')}</span>
                      </div>
                      <button
                        onClick={() => {
                          onOpenActivityLedger();
                          setShowSystemMenu(false);
                          playSynthTone('switch');
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 text-[10px] transition-all"
                      >
                        {t('Open', 'Open')}
                      </button>
                    </div>
                  )}

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
                    <span className="font-semibold">{t('Shortcuts', 'Shortcuts')}</span>
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

          {/* 6. Language Selector */}
          <LanguageSelector compact={true} />

          {/* 7. Theme Selector Popover */}
          <div className="relative" ref={themeMenuRef}>
            <button
              id="topbar-theme-selector-btn"
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                playSynthTone('switch');
              }}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 cursor-pointer transition-all"
              title={t('Change visual theme', 'Change visual theme')}
            >
              <span className="text-sm">{currentThemeObj.icon}</span>
            </button>

            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-52 p-2 rounded-2xl border shadow-xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-slate-900/20'
                  }`}
                >
                  <div className="px-2 py-1 text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 mb-1.5 flex items-center justify-between">
                    <span>{t('Themes', 'Themes')}</span>
                    <Palette className="w-3 h-3 text-indigo-400" />
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {THEME_OPTIONS.map((th) => {
                      const isSelected = theme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => {
                            setTheme(th.id);
                            setShowThemeMenu(false);
                            playSynthTone('switch');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{th.icon}</span>
                            <span>{th.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 8. Logged-in User Circle with Name & Account Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="topbar-user-avatar-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                playSynthTone('switch');
              }}
              className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border transition-all cursor-pointer group select-none ${
                showUserMenu
                  ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:border-indigo-500/40'
              }`}
              title={`Logged in as ${userInfo.name} (${userInfo.email})`}
            >
              {/* Circle Avatar with Initials / Photo */}
              <div className="relative shrink-0">
                {userInfo.photo ? (
                  <img
                    src={userInfo.photo}
                    alt={userInfo.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-white/20"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white shadow-xs ${
                    theme === 'cyberpunk'
                      ? 'bg-gradient-to-tr from-pink-500 to-cyan-400 text-black font-extrabold ring-1 ring-cyan-400'
                      : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 ring-1 ring-indigo-400/40'
                  }`}>
                    {userInfo.initials}
                  </div>
                )}
                {/* Active indicator dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />
              </div>

              {/* Name & status label */}
              <div className="hidden lg:flex flex-col text-left leading-tight min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px]">
                  {userInfo.name.split(' ')[0]}
                </span>
                <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {user ? 'Verified' : 'Online'}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 shrink-0 ${showUserMenu ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {/* User Account Popover */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-72 p-3 rounded-2xl border shadow-xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-slate-900/20'
                  }`}
                >
                  {/* User Profile Card Header */}
                  <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100 dark:border-white/10">
                    <div className="relative shrink-0">
                      {userInfo.photo ? (
                        <img
                          src={userInfo.photo}
                          alt={userInfo.name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black text-sm flex items-center justify-center ring-2 ring-indigo-500/30 shadow-md">
                          {userInfo.initials}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {userInfo.name}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-400 truncate mt-0.5">
                        {userInfo.email}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                          {user ? 'Cloud Node Connected' : 'Laboratory Researcher'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1 mb-2">
                    {onOpenWelcome && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenWelcome();
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-amber-500/10 text-amber-600 dark:text-amber-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('Welcome Page & Tour', 'Welcome Page & Tour')}</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-500 font-bold">Home</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (setActiveModule) {
                          setActiveModule('profile');
                          setShowUserMenu(false);
                          playSynthTone('switch');
                        }
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t('Researcher Profile & Lab ID', 'Researcher Profile & Lab ID')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">View</span>
                    </button>

                    <button
                      onClick={() => {
                        if (setActiveModule) {
                          setActiveModule('settings');
                          setShowUserMenu(false);
                          playSynthTone('switch');
                        }
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('App Settings & Precision', 'App Settings & Precision')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Configure</span>
                    </button>

                    {onOpenActivityLedger && (
                      <button
                        onClick={() => {
                          onOpenActivityLedger();
                          setShowUserMenu(false);
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{t('Activity Ledger', 'Activity Ledger')}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Logs</span>
                      </button>
                    )}
                  </div>

                  {/* Auth Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                    {user || onSignOut ? (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onSignOut) {
                            onSignOut();
                          }
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors border border-rose-500/20 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('Sign Out / Switch User', 'Sign Out / Switch User')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onSignIn) {
                            onSignIn();
                          }
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t('Sign In with Google', 'Sign In with Google')}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Non-Intrusive Floating Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`fixed top-16 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] shadow-xl rounded-2xl p-3 border backdrop-blur-xl transition-all select-none ${
              isRTL ? 'left-4 sm:left-8' : 'right-4 sm:right-8'
            } ${
              theme === 'cyberpunk'
                ? activeToast.type === 'error'
                  ? 'bg-black/95 border-pink-500 text-pink-400'
                  : 'bg-black/95 border-cyber-accent text-cyber-accent'
                : activeToast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/40 text-rose-100'
                : 'bg-slate-900/95 dark:bg-slate-950/95 border-slate-700/60 text-slate-100 shadow-slate-950/50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                {activeToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : activeToast.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs font-bold leading-tight">{activeToast.title}</h4>
                <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{activeToast.message}</p>
              </div>
              <button
                onClick={dismissToast}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-all text-slate-300 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopAppBar;
