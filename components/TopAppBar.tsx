import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  Command,
  Database,
  RefreshCw,
  CheckCircle2,
  WifiOff,
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
  FileDown,
  BookOpen,
  Compass
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { SAMPLE_PRESETS, SamplePreset } from './QuickWorkflowRibbon';
import { DisplayModeSwitcher } from './DisplayModeSwitcher';

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
  swatchHex: [string, string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: 'Light', nativeLabel: 'Clinical Lab Slate', icon: '☀️', color: 'text-amber-500', bgPreview: 'bg-slate-100', borderPreview: 'border-slate-300', swatchHex: ['#f8fafc', '#e2e8f0', '#4f46e5'] },
  { id: 'dark', label: 'Dark', nativeLabel: 'Deep Obsidian', icon: '🌙', color: 'text-indigo-400', bgPreview: 'bg-slate-900', borderPreview: 'border-indigo-500/40', swatchHex: ['#0f172a', '#1e293b', '#6366f1'] },
  { id: 'cyberpunk', label: 'Cyberpunk', nativeLabel: 'High-Contrast Laser', icon: '⚡', color: 'text-pink-500', bgPreview: 'bg-black', borderPreview: 'border-cyan-400', swatchHex: ['#050505', '#00f0ff', '#ff007f'] },
  { id: 'terminal', label: 'Terminal', nativeLabel: 'Phosphor CRT', icon: '📟', color: 'text-emerald-400', bgPreview: 'bg-black', borderPreview: 'border-emerald-500', swatchHex: ['#040d06', '#064e3b', '#10b981'] },
  { id: 'synthwave', label: 'Synthwave', nativeLabel: 'Reticle Horizon', icon: '🌆', color: 'text-purple-400', bgPreview: 'bg-[#1a102f]', borderPreview: 'border-pink-500', swatchHex: ['#1a102f', '#3b1d5e', '#ec4899'] },
  { id: 'dracula', label: 'Dracula', nativeLabel: 'Vacuum Violet', icon: '🦇', color: 'text-purple-300', bgPreview: 'bg-[#282a36]', borderPreview: 'border-purple-500', swatchHex: ['#282a36', '#44475a', '#bd93f9'] },
  { id: 'oceanic', label: 'Oceanic', nativeLabel: 'Cherenkov Blue', icon: '🌊', color: 'text-cyan-400', bgPreview: 'bg-[#0f172a]', borderPreview: 'border-cyan-500', swatchHex: ['#0b192c', '#1e3e62', '#06b6d4'] },
  { id: 'gruvbox', label: 'Gruvbox', nativeLabel: 'Warm Tungsten', icon: '📦', color: 'text-amber-600', bgPreview: 'bg-[#282828]', borderPreview: 'border-amber-700', swatchHex: ['#282828', '#504945', '#fe8019'] },
  { id: 'monokai', label: 'Monokai', nativeLabel: 'Spectrometer Dark', icon: '🎨', color: 'text-yellow-400', bgPreview: 'bg-[#272822]', borderPreview: 'border-yellow-600', swatchHex: ['#272822', '#3e3d32', '#a6e22e'] },
];

interface AnodeSourceSpec {
  id: string;
  element: string;
  atomicNumber: number;
  label: string;
  ka1: number;
  ka2: number;
  kb: number;
  energyKeV: number;
  absorptionEdgeKeV: number;
  color: string;
  strokeHex: string;
  notes: string;
}

const ANODE_SOURCES: AnodeSourceSpec[] = [
  {
    id: 'cu-ka1',
    element: 'Cu',
    atomicNumber: 29,
    label: 'Cu Kα₁',
    ka1: 1.540598,
    ka2: 1.544426,
    kb: 1.39225,
    energyKeV: 8.0478,
    absorptionEdgeKeV: 8.979,
    color: 'text-cyan-500 dark:text-cyan-400',
    strokeHex: '#06b6d4',
    notes: 'Standard high-flux laboratory powder diffractometer source'
  },
  {
    id: 'cu-ka-avg',
    element: 'Cu',
    atomicNumber: 29,
    label: 'Cu Kα (avg)',
    ka1: 1.54184,
    ka2: 1.54443,
    kb: 1.39225,
    energyKeV: 8.0413,
    absorptionEdgeKeV: 8.979,
    color: 'text-indigo-500 dark:text-indigo-400',
    strokeHex: '#6366f1',
    notes: 'Unresolved Kα₁/Kα₂ weighted doublet (2:1 intensity ratio)'
  },
  {
    id: 'mo-ka1',
    element: 'Mo',
    atomicNumber: 42,
    label: 'Mo Kα₁',
    ka1: 0.709319,
    ka2: 0.713609,
    kb: 0.632305,
    energyKeV: 17.4793,
    absorptionEdgeKeV: 20.0,
    color: 'text-violet-500 dark:text-violet-400',
    strokeHex: '#8b5cf6',
    notes: 'Short-wavelength high-Q penetration for PDF & single-crystal'
  },
  {
    id: 'co-ka1',
    element: 'Co',
    atomicNumber: 27,
    label: 'Co Kα₁',
    ka1: 1.78901,
    ka2: 1.7929,
    kb: 1.62083,
    energyKeV: 6.9303,
    absorptionEdgeKeV: 7.709,
    color: 'text-emerald-500 dark:text-emerald-400',
    strokeHex: '#10b981',
    notes: 'Suppresses Fe fluorescence in ferrous alloys & steels'
  },
  {
    id: 'cr-ka1',
    element: 'Cr',
    atomicNumber: 24,
    label: 'Cr Kα₁',
    ka1: 2.28976,
    ka2: 2.293663,
    kb: 2.08492,
    energyKeV: 5.4147,
    absorptionEdgeKeV: 5.989,
    color: 'text-amber-500 dark:text-amber-400',
    strokeHex: '#f59e0b',
    notes: 'High angular dispersion for residual stress & low-angle peaks'
  },
  {
    id: 'ag-ka1',
    element: 'Ag',
    atomicNumber: 47,
    label: 'Ag Kα₁',
    ka1: 0.559421,
    ka2: 0.563813,
    kb: 0.497082,
    energyKeV: 22.1629,
    absorptionEdgeKeV: 25.514,
    color: 'text-sky-500 dark:text-sky-400',
    strokeHex: '#0ea5e9',
    notes: 'Ultra-high reciprocal space coverage for pair distribution (PDF)'
  }
];

/**
 * Bespoke Crystallographic Brand Emblem SVG:
 * Depicts incident beam k0, crystal lattice planes (hkl), diffracted Bragg cone 2θ, and Ewald sphere arc.
 */
export const CrystallographicBrandEmblem: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  theme?: string;
}> = ({ size = 'md', theme = 'dark' }) => {
  const dim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-9 h-9' : 'w-8 h-8';
  const isCyber = theme === 'cyberpunk';

  return (
    <div
      className={`${dim} relative rounded-lg flex items-center justify-center overflow-hidden shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
        isCyber
          ? 'bg-black border-cyan-400/70 shadow-[0_0_10px_rgba(0,240,255,0.35)]'
          : 'bg-slate-950 border-indigo-500/40 shadow-xs'
      }`}
    >
      <svg viewBox="0 0 36 36" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="xrdBrandBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isCyber ? '#090d16' : '#1e1b4b'} />
            <stop offset="100%" stopColor={isCyber ? '#020408' : '#090d16'} />
          </linearGradient>
          <linearGradient id="xrdBeamIn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="xrdBeamOut" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Background field */}
        <rect width="36" height="36" fill="url(#xrdBrandBg)" />

        {/* Ewald Sphere Reciprocal Arc */}
        <path
          d="M 4 28 A 22 22 0 0 1 32 8"
          fill="none"
          stroke={isCyber ? '#00f0ff' : '#6366f1'}
          strokeWidth="0.75"
          strokeDasharray="2 1.5"
          opacity="0.45"
        />

        {/* (hkl) Crystal Lattice Planes */}
        <line x1="6" y1="22" x2="30" y2="22" stroke="#94a3b8" strokeWidth="0.8" opacity="0.55" />
        <line x1="8" y1="26.5" x2="28" y2="26.5" stroke="#64748b" strokeWidth="0.7" strokeDasharray="2 1.5" opacity="0.45" />
        <line x1="10" y1="31" x2="26" y2="31" stroke="#475569" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.35" />

        {/* Lattice Periodic Atomic Nodes */}
        {[9, 15, 21, 27].map((cx) => (
          <circle key={`r1-${cx}`} cx={cx} cy={22} r="1.25" fill="#e2e8f0" />
        ))}
        {[12, 18, 24].map((cx) => (
          <circle key={`r2-${cx}`} cx={cx} cy={26.5} r="1" fill="#94a3b8" opacity="0.75" />
        ))}

        {/* Incident X-Ray Beam k0 */}
        <line x1="4" y1="9" x2="18" y2="22" stroke="url(#xrdBeamIn)" strokeWidth="1.75" strokeLinecap="round" />

        {/* Diffracted Bragg Beam k */}
        <line x1="18" y1="22" x2="32" y2="9" stroke="url(#xrdBeamOut)" strokeWidth="1.75" strokeLinecap="round" />
        {/* Secondary higher-order 2θ ray */}
        <line x1="18" y1="22" x2="29" y2="5" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />

        {/* Scattering Vector Q (vertical normal) */}
        <line x1="18" y1="22" x2="18" y2="7" stroke="#f59e0b" strokeWidth="1.1" strokeDasharray="1.5 1" />
        <polygon points="18,5 16.3,8 19.7,8" fill="#f59e0b" />

        {/* Bragg Angle Arc θ */}
        <path d="M 23.5 22 A 5.5 5.5 0 0 0 21.8 18.2" fill="none" stroke="#22d3ee" strokeWidth="0.9" />

        {/* Central Bragg Diffraction Vertex Glow */}
        <circle cx="18" cy="22" r="2.2" fill="#22d3ee" />
        <circle cx="18" cy="22" r="1" fill="#ffffff" />
      </svg>
    </div>
  );
};

/**
 * Mini SVG Diffractogram Stick Preview for Sample Presets
 */
const PresetDiffractogramPreview: React.FC<{ peaksStr: string; isActive?: boolean }> = ({ peaksStr }) => {
  const parsedPeaks = useMemo(() => {
    return peaksStr
      .split(',')
      .map((part) => {
        const [posStr, intStr] = part.trim().split(':');
        const twoTheta = parseFloat(posStr);
        const intensity = intStr ? parseFloat(intStr) : 50;
        return { twoTheta, intensity };
      })
      .filter((p) => !isNaN(p.twoTheta));
  }, [peaksStr]);

  return (
    <svg viewBox="0 0 120 26" className="w-24 h-6 shrink-0 rounded bg-slate-950/90 border border-slate-800/80 overflow-hidden">
      {/* Baseline grid */}
      <line x1="0" y1="23" x2="120" y2="23" stroke="#334155" strokeWidth="0.75" />
      <line x1="30" y1="0" x2="30" y2="26" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="60" y1="0" x2="60" y2="26" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="90" y1="0" x2="90" y2="26" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1 1" />

      {/* Continuous background profile curve */}
      <path
        d={parsedPeaks.reduce((acc, p, idx) => {
          const x = Math.max(4, Math.min(116, ((p.twoTheta - 15) / 80) * 112 + 4));
          const h = Math.max(3, (p.intensity / 100) * 19);
          const yTop = 23 - h;
          if (idx === 0) {
            return `M 0 23 L ${ (x - 2.5).toFixed(1) } 23 L ${ x.toFixed(1) } ${ yTop.toFixed(1) } L ${ (x + 2.5).toFixed(1) } 23`;
          }
          return `${acc} L ${ (x - 2.5).toFixed(1) } 23 L ${ x.toFixed(1) } ${ yTop.toFixed(1) } L ${ (x + 2.5).toFixed(1) } 23`;
        }, '') + ' L 120 23'}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1"
        opacity="0.85"
      />

      {/* Bragg sticks */}
      {parsedPeaks.map((p, i) => {
        const x = Math.max(4, Math.min(116, ((p.twoTheta - 15) / 80) * 112 + 4));
        const h = Math.max(3, (p.intensity / 100) * 19);
        return (
          <g key={i}>
            <line
              x1={x}
              y1={23}
              x2={x}
              y2={23 - h}
              stroke={p.intensity >= 80 ? '#818cf8' : '#38bdf8'}
              strokeWidth="1.3"
            />
            <circle cx={x} cy={23 - h} r="1.1" fill={p.intensity >= 80 ? '#f472b6' : '#22d3ee'} />
          </g>
        );
      })}
    </svg>
  );
};

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
  currentClockTime?: string;
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

const TopAppBarComponent: React.FC<TopAppBarProps> = ({
  theme,
  setTheme,
  activeModule,
  setActiveModule,
  modules,
  getModuleIcon,
  setIsNavigatorOpen,
  isSidebarPinned,
  setIsSidebarPinned,
  setIsExplained,
  currentClockTime,
  isOnline,
  firestoreSyncType,
  firestoreSyncProgress,
  firestoreSyncStatus,
  isSyncingWithFirestore,
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
  sampleId,
  onOpenActivityLedger,
  wavelength = 1.5406,
  setWavelength,
  onExportPdf,
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
  const [showBeamlinePopover, setShowBeamlinePopover] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);

  const [localClockTime, setLocalClockTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  });

  useEffect(() => {
    if (!showSystemMenu && !showBeamlinePopover) return;
    const timer = setInterval(() => {
      setLocalClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, [showSystemMenu, showBeamlinePopover]);

  const themeMenuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const sampleMenuRef = useRef<HTMLDivElement>(null);
  const beamlineMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevSyncTypeRef = useRef<string>(firestoreSyncType);
  const prevOnlineRef = useRef<boolean>(isOnline);
  const toastTimerRef = useRef<any>(null);

  // Derive active anode specification from current wavelength
  const activeAnode = useMemo<AnodeSourceSpec>(() => {
    const matched = ANODE_SOURCES.find((a) => Math.abs(a.ka1 - wavelength) < 0.0025);
    if (matched) return matched;
    const energyKeV = wavelength > 0 ? 12.3984193 / wavelength : 8.0478;
    return {
      id: 'custom-synchrotron',
      element: 'λ',
      atomicNumber: 0,
      label: 'Custom Beam',
      ka1: wavelength,
      ka2: wavelength * 1.0024,
      kb: wavelength * 0.9037,
      energyKeV,
      absorptionEdgeKeV: energyKeV * 1.11,
      color: 'text-amber-500 dark:text-amber-400',
      strokeHex: '#f59e0b',
      notes: 'Tunable monochromatic synchrotron / custom wavelength'
    };
  }, [wavelength]);

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
      if (beamlineMenuRef.current && !beamlineMenuRef.current.contains(e.target as Node)) {
        setShowBeamlinePopover(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModuleObj = modules.find((m) => m.id === activeModule);
  const currentThemeObj = THEME_OPTIONS.find((th) => th.id === theme) || THEME_OPTIONS[0];

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

  const handleSelectAnode = (anode: AnodeSourceSpec) => {
    if (setWavelength) {
      setWavelength(Number(anode.ka1.toFixed(4)));
      playSynthTone('switch');
      showToast({
        type: 'info',
        title: `${anode.label} Source Calibrated`,
        message: `Incident X-ray wavelength set to λ = ${anode.ka1.toFixed(4)} Å (E = ${anode.energyKeV.toFixed(2)} keV).`
      });
    }
    setShowBeamlinePopover(false);
  };

  const totalSyncedRecords = syncStats.syncedAnalyses + syncStats.syncedMaterials;
  const totalPendingRecords = syncStats.pendingAnalyses + syncStats.pendingMaterials;

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
            className="flex items-center gap-1.5 cursor-pointer shrink-0 group"
          >
            <CrystallographicBrandEmblem size="sm" theme={theme} />
            <span className="font-bold text-sm tracking-tight leading-none hidden xs:inline whitespace-nowrap">
              XRD<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-xs font-bold truncate max-w-[165px]"
          >
            <span className="truncate">{activeModuleObj?.label || activeModule}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Mobile Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile Wavelength Readout */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono tabular-nums text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
            {activeAnode.element} {wavelength.toFixed(4)} Å
          </span>

          {onOpenWelcome && (
            <button
              onClick={() => {
                onOpenWelcome();
                playSynthTone('switch');
              }}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
              title={t('Welcome Page & Tour', 'Welcome Page & Tour')}
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

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

          <button
            onClick={() => {
              const nextIdx = (THEME_OPTIONS.findIndex((tItem) => tItem.id === theme) + 1) % THEME_OPTIONS.length;
              setTheme(THEME_OPTIONS[nextIdx].id);
              playSynthTone('switch');
            }}
            className="p-1.5 rounded-lg text-xs font-bold"
            title="Toggle Theme"
          >
            <span>{currentThemeObj.icon}</span>
          </button>

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
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black text-[10.5px] flex items-center justify-center ring-1 ring-indigo-500/40 shadow-xs">
                {userInfo.initials}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 2. Desktop Scientific Instrument Top Bar (Calibrated, single-tier, bespoke graphics) */}
      <header
        id="desktop-top-app-bar"
        className={`relative hidden md:flex items-center justify-between px-4 lg:px-5 h-14 border-b z-20 font-sans transition-all duration-200 shrink-0 select-none ${
          theme === 'cyberpunk'
            ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent shadow-xs'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200/90 dark:border-slate-800/90 text-slate-800 dark:text-slate-100'
        }`}
      >
        {/* Subtle Reciprocal-Lattice Coordinate Rule along Top Edge */}
        <svg
          className="absolute top-0 left-0 right-0 w-full h-[3px] pointer-events-none opacity-45"
          preserveAspectRatio="none"
          viewBox="0 0 1440 3"
          aria-hidden="true"
        >
          <line x1="0" y1="0.5" x2="1440" y2="0.5" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.25" />
          {Array.from({ length: 36 }).map((_, idx) => (
            <rect
              key={idx}
              x={idx * 40}
              y={0}
              width="1.5"
              height={idx % 5 === 0 ? 3 : 1.5}
              fill={idx % 5 === 0 ? '#06b6d4' : '#64748b'}
              opacity={idx % 5 === 0 ? 0.65 : 0.3}
            />
          ))}
        </svg>

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

        {/* ZONE 1 (LEFT): Brand Emblem, Active Workbench Module Controller & Sidebar Toggle */}
        <div className="flex items-center gap-2 shrink-0">
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
              className="flex items-center gap-2 cursor-pointer group shrink-0 py-1 px-1.5 -ml-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
              title={t('Return to Welcome Page & Showcase', 'Return to Welcome Page & Showcase')}
            >
              <CrystallographicBrandEmblem size="md" theme={theme} />
              <div className="flex flex-col">
                <span className={`font-black text-sm tracking-tight leading-none whitespace-nowrap ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'}`}>
                  XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
                </span>
                <span className="text-[9px] font-mono tabular-nums text-slate-400 dark:text-slate-500 leading-none mt-0.5 whitespace-nowrap">
                  2θ · d · (hkl)
                </span>
              </div>
            </div>
          )}

          {!isSidebarPinned && (
            <span className="text-slate-300 dark:text-slate-700 font-mono text-xs select-none">/</span>
          )}

          {/* Sidebar Pin/Collapse Toggle Button */}
          <button
            id="topbar-sidebar-toggle-btn"
            onClick={() => {
              setIsSidebarPinned(!isSidebarPinned);
              playSynthTone('switch');
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shrink-0"
            title={isSidebarPinned ? t('Collapse Sidebar to Mini Rail', 'Collapse Sidebar to Mini Rail') : t('Expand Full Sidebar', 'Expand Full Sidebar')}
          >
            {isSidebarPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Active Module Selector with Mini Category Kicker */}
          <button
            id="topbar-module-trigger-btn"
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-150 cursor-pointer group shrink-0 ${
              theme === 'cyberpunk'
                ? 'bg-black border-cyber-accent/50 hover:border-cyber-accent text-cyber-accent'
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 text-slate-900 dark:text-slate-100'
            }`}
            title={t('Click to browse all 30+ scientific tools (Ctrl+K)', 'Click to browse all tools (Ctrl+K)')}
          >
            <div className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center justify-center">
              {getModuleIcon(activeModule, true)}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              {activeModuleObj?.group && (
                <>
                  <span className="hidden xl:inline text-[10px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {activeModuleObj.group}
                  </span>
                  <span className="hidden xl:inline text-slate-300 dark:text-slate-700 text-[10px]">·</span>
                </>
              )}
              <span className="text-xs font-bold tracking-tight truncate max-w-[140px] lg:max-w-[190px] whitespace-nowrap">
                {activeModuleObj?.label || activeModule}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>

          {/* Welcome Page Showcase Trigger */}
          {onOpenWelcome && (
            <button
              id="topbar-welcome-page-btn"
              onClick={() => {
                onOpenWelcome();
                playSynthTone('switch');
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 font-semibold text-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title={t('Return to Welcome Page & Showcase', 'Return to Welcome Page & Showcase')}
            >
              <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden 2xl:inline">{t('Showcase', 'Showcase')}</span>
            </button>
          )}
        </div>

        {/* ZONE 2 (CENTER): Interactive X-Ray Beamline Telemetry HUD + Command Search */}
        <div className="hidden lg:flex items-center justify-center gap-2.5 flex-1 max-w-xl mx-3">
          {/* Interactive X-Ray Beamline Source & Wavelength Graphic HUD */}
          <div className="relative shrink-0" ref={beamlineMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowBeamlinePopover((prev) => !prev);
                playSynthTone('switch');
              }}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer group ${
                showBeamlinePopover
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 hover:border-cyan-500/50 text-slate-700 dark:text-slate-200'
              }`}
              title={t('Interactive X-Ray Anode Source & Beamline Telemetry (Click to calibrate λ)', 'Interactive X-Ray Anode Source & Beamline Telemetry')}
            >
              {/* Live Mini Bragg Source-to-Detector SVG Schematic */}
              <svg
                viewBox="0 0 44 18"
                className="w-11 h-4.5 shrink-0 rounded bg-slate-950 border border-slate-800 px-0.5"
                aria-hidden="true"
              >
                {/* Lattice plane */}
                <line x1="6" y1="14" x2="38" y2="14" stroke="#475569" strokeWidth="0.9" strokeDasharray="2 1" />
                {[11, 18, 25, 32].map((x) => (
                  <circle key={x} cx={x} cy={14} r="1" fill="#94a3b8" />
                ))}
                {/* Incident X-ray wave */}
                <path
                  d="M 3 4 L 22 14"
                  stroke={activeAnode.strokeHex}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {/* Diffracted Bragg beam */}
                <path
                  d="M 22 14 L 41 4"
                  stroke="#38bdf8"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {/* Bragg vertex */}
                <circle cx="22" cy="14" r="1.6" fill="#22d3ee" />
                {/* 2θ arc */}
                <path d="M 28 14 A 6 6 0 0 0 26.5 11.2" fill="none" stroke="#f59e0b" strokeWidth="0.9" />
              </svg>

              <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                <span className={`font-bold ${activeAnode.color}`}>{activeAnode.label}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                  {wavelength.toFixed(4)}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Å</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showBeamlinePopover ? 'rotate-180 text-cyan-500' : ''}`} />
            </button>

            {/* X-Ray Beamline Optics & Anode Spectrum Graphic Popover */}
            <AnimatePresence>
              {showBeamlinePopover && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-0 mt-2 w-[360px] rounded-xl border p-3.5 shadow-2xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>X-Ray Source & Bragg Optics</span>
                        {sampleId && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            · {sampleId}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        E = {activeAnode.energyKeV.toFixed(3)} keV · k₀ = {((2 * Math.PI) / wavelength).toFixed(3)} Å⁻¹
                      </div>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      ● MONOCHROMATIC
                    </span>
                  </div>

                  {/* Interactive SVG Emission Spectrum & Bragg Goniometer Graphic */}
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 mb-3">
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 mb-1">
                      <span>CHARACTERISTIC EMISSION DOUBLET ({activeAnode.element})</span>
                      <span className="tabular-nums text-cyan-400">λ = {wavelength.toFixed(4)} Å</span>
                    </div>
                    <svg viewBox="0 0 310 76" className="w-full h-[76px] overflow-visible">
                      {/* Grid lines */}
                      <line x1="10" y1="62" x2="300" y2="62" stroke="#334155" strokeWidth="1" />
                      <line x1="10" y1="36" x2="300" y2="36" stroke="#1e293b" strokeWidth="0.6" strokeDasharray="2 2" />
                      <line x1="10" y1="12" x2="300" y2="12" stroke="#1e293b" strokeWidth="0.6" strokeDasharray="2 2" />

                      {/* Bremsstrahlung continuum + Kβ + Kα1 + Kα2 characteristic lines */}
                      <path
                        d="M 15 62 Q 55 48, 85 55 L 92 55 L 96 34 L 100 56 Q 145 50, 195 57 L 204 57 L 210 8 L 215 52 L 220 30 L 225 60 L 295 62"
                        fill="rgba(6, 182, 212, 0.12)"
                        stroke="#22d3ee"
                        strokeWidth="1.4"
                      />

                      {/* Kβ filter cutoff zone */}
                      <rect x="80" y="6" width="32" height="56" fill="#f43f5e" fillOpacity="0.08" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2 2" />
                      <text x="96" y="27" textAnchor="middle" fill="#fb7185" fontSize="7.5" fontFamily="monospace">
                        Kβ ({activeAnode.kb.toFixed(3)}Å)
                      </text>

                      {/* Kα1 Primary Line Marker */}
                      <circle cx="210" cy="8" r="2.5" fill="#22d3ee" />
                      <text x="198" y="14" textAnchor="end" fill="#22d3ee" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        Kα₁ {activeAnode.ka1.toFixed(4)}Å
                      </text>

                      {/* Kα2 Secondary Line Marker */}
                      <circle cx="220" cy="30" r="2" fill="#818cf8" />
                      <text x="230" y="33" textAnchor="start" fill="#a5b4fc" fontSize="7.5" fontFamily="monospace">
                        Kα₂ {activeAnode.ka2.toFixed(4)}Å
                      </text>

                      {/* Axis Labels */}
                      <text x="14" y="72" fill="#64748b" fontSize="7.5" fontFamily="monospace">
                        Short λ (High E)
                      </text>
                      <text x="296" y="72" textAnchor="end" fill="#64748b" fontSize="7.5" fontFamily="monospace">
                        Long λ (2:1 Kα₁/Kα₂)
                      </text>
                    </svg>
                  </div>

                  {/* Standard Anode Target Selector Grid */}
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>Select Standard Anode Target</span>
                    <span>1-Click Calibration</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ANODE_SOURCES.map((anode) => {
                      const isSelected = Math.abs(anode.ka1 - wavelength) < 0.0015;
                      return (
                        <button
                          key={anode.id}
                          type="button"
                          onClick={() => handleSelectAnode(anode)}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1">
                              <span>{anode.label}</span>
                              {anode.atomicNumber > 0 && (
                                <span className="text-[9px] font-mono text-slate-400">Z={anode.atomicNumber}</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              {anode.ka1.toFixed(4)} Å · {anode.energyKeV.toFixed(1)} keV
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Command Palette / Tool Search Bar */}
          <button
            id="topbar-quick-search-btn"
            onClick={() => {
              setIsNavigatorOpen(true);
              playSynthTone('switch');
            }}
            className={`flex-1 max-w-xs flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              theme === 'cyberpunk'
                ? 'border-cyber-accent/40 bg-black/60 text-slate-400 hover:text-cyber-accent hover:border-cyber-accent'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 hover:border-indigo-500/40 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Search suite tools, equations, or methods (Press / or Ctrl+K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs truncate whitespace-nowrap">
                {t('Search 30+ tools, formulas...', 'Search 30+ tools, formulas...')}
              </span>
            </div>
            <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 ml-2 shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* ZONE 3 (RIGHT): Instrument Controls, Sample Data, Theory, Display Mode, Telemetry & Researcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. Standard Reference Samples Dropdown with Live SVG Diffractogram Previews */}
          <div className="relative" ref={sampleMenuRef}>
            <button
              onClick={() => {
                setShowSampleDropdown((prev) => !prev);
                playSynthTone('switch');
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                showSampleDropdown
                  ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title={t('Load pre-configured standard diffraction datasets', 'Load pre-configured standard diffraction datasets')}
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden xl:inline">{t('Standards', 'Standards')}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSampleDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSampleDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-88 rounded-xl border shadow-2xl p-2.5 z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex items-center justify-between">
                    <span>{t('Certified Reference Materials', 'Certified Reference Materials')}</span>
                    <span className="text-cyan-500">I(2θ) Profile</span>
                  </div>

                  <div className="space-y-1">
                    {SAMPLE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/90 transition-all flex items-center justify-between gap-2.5 cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-500 font-semibold shrink-0">
                              {p.chemicalFormula}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {p.crystalSystem} · {p.badge}
                          </div>
                        </div>
                        <PresetDiffractogramPreview peaksStr={p.peaks} />
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
              title={t('Open theoretical principles and formulas for this module', 'Open theoretical principles and formulas')}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden xl:inline">{t('Theory', 'Theory')}</span>
            </button>
          )}

          {/* 3. Display Mode Switcher (Full-Screen vs Half-Screen Mode) */}
          <DisplayModeSwitcher compact={true} />

          {/* 4. Quick Modules Strip Toggle Button */}
          {onToggleQuickRibbon && (
            <button
              onClick={onToggleQuickRibbon}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                showQuickRibbon
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title={showQuickRibbon ? t('Hide Quick Modules Strip', 'Hide Quick Modules Strip') : t('Show Quick Modules Strip', 'Show Quick Modules Strip')}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {/* 5. Cloud & Offline Database Sync Telemetry */}
          <div className="relative" id="indexeddb-sync-container">
            <button
              id="indexeddb-sync-button"
              onClick={() => {
                syncIndexedDBWithFirestore(true);
                playSynthTone('switch');
              }}
              onMouseEnter={() => setShowSyncTooltip(true)}
              onMouseLeave={() => setShowSyncTooltip(false)}
              className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all relative ${
                firestoreSyncType === 'syncing'
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                  : !isOnline
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title="Database Sync & Persistence Telemetry"
            >
              {firestoreSyncType === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Database className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className="hidden 2xl:inline text-[10px] font-mono tabular-nums font-semibold">
                {totalSyncedRecords}
              </span>
            </button>

            {/* Sync Telemetry Popover with Architecture SVG */}
            <AnimatePresence>
              {showSyncTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-76 p-3 rounded-xl border shadow-2xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                      {t('Storage Pipeline', 'Storage Pipeline')}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                      {isOnline ? '● NOMINAL' : '▲ LOCAL CACHE'}
                    </span>
                  </div>

                  {/* Mini Dual-Store Pipeline SVG */}
                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 mb-2.5">
                    <svg viewBox="0 0 240 36" className="w-full h-9">
                      {/* IndexedDB Node */}
                      <rect x="6" y="6" width="76" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                      <text x="44" y="16" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                        IndexedDB
                      </text>
                      <text x="44" y="25" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                        Local Cache
                      </text>

                      {/* Replication Bus */}
                      <line
                        x1="84"
                        y1="18"
                        x2="156"
                        y2="18"
                        stroke={isOnline ? '#10b981' : '#f59e0b'}
                        strokeWidth="1.2"
                        strokeDasharray={isOnline ? 'none' : '3 2'}
                      />
                      <polygon points="156,18 151,15.5 151,20.5" fill={isOnline ? '#10b981' : '#f59e0b'} />
                      <text x="120" y="13" textAnchor="middle" fill={isOnline ? '#34d399' : '#fbbf24'} fontSize="7" fontFamily="monospace">
                        {isOnline ? 'SYNC BUS' : 'OFFLINE'}
                      </text>

                      {/* Firestore Node */}
                      <rect x="158" y="6" width="76" height="24" rx="4" fill="#0f172a" stroke={isOnline ? '#10b981' : '#475569'} strokeWidth="1" />
                      <text x="196" y="16" textAnchor="middle" fill={isOnline ? '#34d399' : '#64748b'} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                        Firestore
                      </text>
                      <text x="196" y="25" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                        Cloud Mirror
                      </text>
                    </svg>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Mirrored Records</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {totalSyncedRecords}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Pending Queue</span>
                      <span className="font-mono tabular-nums font-bold text-amber-500 text-sm">
                        {totalPendingRecords}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono tabular-nums flex items-center justify-between">
                    <span>Last Mirror:</span>
                    <span>{lastSyncTime ? formatLastSyncTimestamp(lastSyncTime) : 'Ready'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 6. System & Diagnostics Popover */}
          <div className="relative" ref={systemMenuRef}>
            <button
              id="topbar-system-menu-btn"
              onClick={() => {
                setShowSystemMenu(!showSystemMenu);
                playSynthTone('switch');
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer relative"
              title={t('System diagnostics & engine options', 'System diagnostics & engine options')}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showSystemMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-68 rounded-xl border p-3 space-y-2.5 shadow-2xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>{t('Instrument Diagnostics', 'Instrument Diagnostics')}</span>
                    <span className="font-mono tabular-nums text-indigo-500">{currentClockTime || localClockTime}</span>
                  </div>

                  {/* Python Engine */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold ${pythonReady ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {pythonReady ? '●' : '▲'}
                      </span>
                      <span className="font-semibold">{t('Python SciPy Runtime', 'Python SciPy Runtime')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowPythonStatus(true);
                        setShowSystemMenu(false);
                        playSynthTone('switch');
                      }}
                      className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 text-[10px] transition-all cursor-pointer"
                    >
                      {pythonReady ? t('Inspect', 'Inspect') : t('Init', 'Init')}
                    </button>
                  </div>

                  {/* Offline Database Hub */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isOnline ? '●' : '▲'}
                      </span>
                      <span className="font-semibold">{t('IndexedDB Storage Hub', 'IndexedDB Storage Hub')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowOfflineHub(true);
                        refreshOfflineAnalyses();
                        setShowSystemMenu(false);
                        playSynthTone('switch');
                      }}
                      className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 text-[10px] transition-all cursor-pointer"
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
                        className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 text-[10px] transition-all cursor-pointer"
                      >
                        {t('Open', 'Open')}
                      </button>
                    </div>
                  )}

                  {/* Consolidated PDF Export */}
                  {onExportPdf && (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileDown className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="font-semibold">{t('Lab Report PDF', 'Lab Report PDF')}</span>
                      </div>
                      <button
                        onClick={() => {
                          onExportPdf();
                          setShowSystemMenu(false);
                        }}
                        className="px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-500/20 text-[10px] transition-all cursor-pointer"
                      >
                        {t('Export', 'Export')}
                      </button>
                    </div>
                  )}

                  {/* Auto-Skip Intros */}
                  {activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings' && (
                    <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-semibold">{t('Skip Module Intros', 'Skip Module Intros')}</span>
                      <button
                        onClick={() => {
                          const nextVal = !skipIntros;
                          setSkipIntros(nextVal);
                          localStorage.setItem('xrd_skip_intros', nextVal.toString());
                          playSynthTone('switch');
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          skipIntros
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {skipIntros ? t('Enabled', 'Enabled') : t('Disabled', 'Disabled')}
                      </button>
                    </div>
                  )}

                  {/* Hotkeys */}
                  <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold">{t('Keyboard Shortcuts', 'Keyboard Shortcuts')}</span>
                    <button
                      onClick={() => {
                        setShowShortcutsModal(true);
                        setShowSystemMenu(false);
                        playSynthTone('switch');
                      }}
                      className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>⌘/</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 7. Language Selector */}
          <LanguageSelector compact={true} />

          {/* 8. Theme Selector Popover with Color Swatch Previews */}
          <div className="relative" ref={themeMenuRef}>
            <button
              id="topbar-theme-selector-btn"
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                playSynthTone('switch');
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all flex items-center justify-center"
              title={t('Change visual theme', 'Change visual theme')}
            >
              <span className="text-sm leading-none">{currentThemeObj.icon}</span>
            </button>

            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-60 p-2 rounded-xl border shadow-2xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex items-center justify-between">
                    <span>{t('Optical Calibration', 'Optical Calibration')}</span>
                    <Palette className="w-3 h-3 text-indigo-400" />
                  </div>

                  <div className="space-y-1 max-h-68 overflow-y-auto custom-scrollbar">
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* 3-Tone Palette Swatch SVG */}
                            <svg viewBox="0 0 18 12" className="w-4.5 h-3 rounded-xs overflow-hidden border border-white/20 shrink-0">
                              <rect x="0" y="0" width="6" height="12" fill={th.swatchHex[0]} />
                              <rect x="6" y="0" width="6" height="12" fill={th.swatchHex[1]} />
                              <rect x="12" y="0" width="6" height="12" fill={th.swatchHex[2]} />
                            </svg>
                            <span>{th.label}</span>
                            <span className={`text-[9.5px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                              · {th.nativeLabel}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 9. Logged-in Researcher Profile Button & Popover */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="topbar-user-avatar-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                playSynthTone('switch');
              }}
              className={`flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border transition-all cursor-pointer group select-none ${
                showUserMenu
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title={`Logged in as ${userInfo.name} (${userInfo.email})`}
            >
              <div className="relative shrink-0">
                {userInfo.photo ? (
                  <img
                    src={userInfo.photo}
                    alt={userInfo.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-300 dark:ring-white/20"
                  />
                ) : (
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10.5px] text-white shadow-xs ${
                      theme === 'cyberpunk'
                        ? 'bg-gradient-to-tr from-pink-500 to-cyan-400 text-black font-extrabold'
                        : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600'
                    }`}
                  >
                    {userInfo.initials}
                  </div>
                )}
              </div>

              <div className="hidden xl:flex flex-col text-left leading-none min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[96px] whitespace-nowrap">
                  {userInfo.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 whitespace-nowrap">
                  {user ? '● VERIFIED' : '● ONLINE'}
                </span>
              </div>

              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 shrink-0 ${showUserMenu ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-72 p-3 rounded-xl border shadow-2xl z-50 ${
                    theme === 'cyberpunk'
                      ? 'bg-black/95 border-cyber-accent text-cyber-accent'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative shrink-0">
                      {userInfo.photo ? (
                        <img
                          src={userInfo.photo}
                          alt={userInfo.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover ring-1 ring-indigo-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                          {userInfo.initials}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {userInfo.name}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-400 truncate mt-0.5">
                        {userInfo.email}
                      </div>
                      <div className="text-[9.5px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        {user ? '● Cloud Node Connected' : '● Laboratory Researcher'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-2">
                    {onOpenWelcome && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenWelcome();
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-500/10 text-amber-600 dark:text-amber-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-amber-500" />
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
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('App Settings & Precision', 'App Settings & Precision')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Config</span>
                    </button>

                    {onOpenActivityLedger && (
                      <button
                        onClick={() => {
                          onOpenActivityLedger();
                          setShowUserMenu(false);
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{t('Activity Ledger', 'Activity Ledger')}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Logs</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    {user || onSignOut ? (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onSignOut) {
                            onSignOut();
                          }
                          playSynthTone('switch');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors border border-rose-500/20 cursor-pointer"
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
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs cursor-pointer"
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
            className={`fixed top-16 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] shadow-xl rounded-xl p-3 border backdrop-blur-xl transition-all select-none ${
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
              {activeToast.actionLabel && activeToast.onAction && (
                <button
                  onClick={() => {
                    activeToast.onAction?.();
                    dismissToast();
                  }}
                  className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                >
                  {activeToast.actionLabel}
                </button>
              )}
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

export const TopAppBar = React.memo(TopAppBarComponent);
export default TopAppBar;
