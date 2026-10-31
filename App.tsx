
import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18n } from './components/I18nProvider';
import { motion, AnimatePresence } from 'motion/react';
import { BraggInput } from './components/BraggInput';

// Lazy-loaded core Bragg components to prevent initial bundle bloat
const ResultsTable = lazy(() => import('./components/ResultsTable').then(m => ({ default: m.ResultsTable })));
const DiffractionChart = lazy(() => import('./components/DiffractionChart').then(m => ({ default: m.DiffractionChart })));
const BraggHistory = lazy(() => import('./components/BraggHistory').then(m => ({ default: m.BraggHistory })));
const BraggVisualization = lazy(() => import('./components/BraggVisualization').then(m => ({ default: m.BraggVisualization })));
const LatticeEstimator = lazy(() => import('./components/LatticeEstimator').then(m => ({ default: m.LatticeEstimator })));

// Lazy-loaded modules for lightning-fast initial page load and memory optimization
const DiffractionCompareModule = lazy(() => import('./components/DiffractionCompareModule').then(m => ({ default: m.DiffractionCompareModule })));
const SelectionRulesModule = lazy(() => import('./components/SelectionRulesModule').then(m => ({ default: m.SelectionRulesModule })));
const ScherrerModule = lazy(() => import('./components/ScherrerModule').then(m => ({ default: m.ScherrerModule })));
const WilliamsonHallModule = lazy(() => import('./components/WilliamsonHallModule').then(m => ({ default: m.WilliamsonHallModule })));
const MonshiScherrerModule = lazy(() => import('./components/MonshiScherrerModule').then(m => ({ default: m.MonshiScherrerModule })));
const DoubleVoigtModule = lazy(() => import('./components/DoubleVoigtModule').then(m => ({ default: m.DoubleVoigtModule })));
const IntegralBreadthModule = lazy(() => import('./components/IntegralBreadthModule').then(m => ({ default: m.IntegralBreadthModule })));
const IntegralBreadthAdvancedModule = lazy(() => import('./components/IntegralBreadthAdvancedModule').then(m => ({ default: m.IntegralBreadthAdvancedModule })));
const WarrenAverbachModule = lazy(() => import('./components/WarrenAverbachModule').then(m => ({ default: m.WarrenAverbachModule })));
const MethodOfMomentsModule = lazy(() => import('./components/MethodOfMomentsModule').then(m => ({ default: m.MethodOfMomentsModule })));
const RietveldModule = lazy(() => import('./components/RietveldModule').then(m => ({ default: m.RietveldModule })));
const NeutronModule = lazy(() => import('./components/NeutronModule').then(m => ({ default: m.NeutronModule })));
const MagneticNeutronModule = lazy(() => import('./components/MagneticNeutronModule').then(m => ({ default: m.MagneticNeutronModule })));
const DeepLearningModule = lazy(() => import('./components/DeepLearningModule').then(m => ({ default: m.DeepLearningModule })));
const FWHMModule = lazy(() => import('./components/FWHMModule').then(m => ({ default: m.FWHMModule })));
const PreferredOrientationModule = lazy(() => import('./components/PreferredOrientationModule').then(m => ({ default: m.PreferredOrientationModule })));
const CohenRefinementModule = lazy(() => import('./components/CohenRefinementModule').then(m => ({ default: m.CohenRefinementModule })));
const CrystallographicMetricTensorModule = lazy(() => import('./components/CrystallographicMetricTensorModule').then(m => ({ default: m.CrystallographicMetricTensorModule })));
const SupercellTransformationModule = lazy(() => import('./components/SupercellTransformationModule').then(m => ({ default: m.SupercellTransformationModule })));
const PawleyLeBailDecompositionModule = lazy(() => import('./components/PawleyLeBailDecompositionModule').then(m => ({ default: m.PawleyLeBailDecompositionModule })));
const ReferenceIntensityRatioModule = lazy(() => import('./components/ReferenceIntensityRatioModule').then(m => ({ default: m.ReferenceIntensityRatioModule })));
const ImageAnalysisModule = lazy(() => import('./components/ImageAnalysisModule').then(m => ({ default: m.ImageAnalysisModule })));
const ImageGenerationModule = lazy(() => import('./components/ImageGenerationModule').then(m => ({ default: m.ImageGenerationModule })));
const XrdNanoModule = lazy(() => import('./components/XrdNanoModule').then(m => ({ default: m.XrdNanoModule })));
const PythonExportModule = lazy(() => import('./components/PythonExportModule').then(m => ({ default: m.PythonExportModule })));
const MaterialDatabaseExplorer = lazy(() => import('./components/MaterialDatabaseExplorer').then(m => ({ default: m.MaterialDatabaseExplorer })));

const SettingsModule = lazy(() => import('./components/SettingsModule').then(m => ({ default: m.SettingsModule })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LearnModule = lazy(() => import('./components/LearnModule').then(m => ({ default: m.LearnModule })));
const AIChatSupport = lazy(() => import('./components/AIChatSupport').then(m => ({ default: m.AIChatSupport })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const RegistrationPage = lazy(() => import('./components/RegistrationPage').then(m => ({ default: m.RegistrationPage })));
const FooterInfoModal = lazy(() => import('./components/FooterInfoModal').then(m => ({ default: m.FooterInfoModal })));
import type { FooterModalType } from './components/FooterInfoModal';

import { ModuleIntro } from './components/ModuleIntro';
import { SideSeekBar } from './components/SideSeekBar';
import LanguageSelector from './components/LanguageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsContext, LengthUnit } from './components/SettingsContext';
const PeriodicTableModule = lazy(() => import('./components/PeriodicTableModule').then(m => ({ default: m.PeriodicTableModule })));
const ScientificModuleNavigator = lazy(() => import('./components/ScientificModuleNavigator').then(m => ({ default: m.ScientificModuleNavigator })));
import { TopAppBar } from './components/TopAppBar';
import { QuickWorkflowRibbon, SamplePreset } from './components/QuickWorkflowRibbon';
import { NavigationRail } from './components/NavigationRail';
import { calculateBragg, parsePeakString, parseSingleHKL, validateHKLAgainstCrystalSystem } from './utils/physics';
import { BraggResult, BraggHistoryItem } from './types';
import { Zap, Terminal, Music, Languages, Palette, Hash, Sparkles, Wand2, Volume2, Settings2, Check, FileDown, FastForward, X, RefreshCw, RotateCcw, Activity, BookOpen, Grid, Database, User, Compass, Microscope, TrendingUp, Infinity, Network, Cpu, Orbit, Magnet, Brain, Image as ImageIcon, Sliders, Layers, PieChart as PieChartIcon, Target, CheckCircle2, WifiOff, Mail, ChevronDown, PanelLeftClose, PanelLeftOpen, LayoutGrid, Menu, Command, Atom, Clock, Gauge, Wifi, ShieldCheck, SlidersHorizontal, Box, Search } from 'lucide-react';
import { LinkedinIcon, GithubIcon } from './components/SocialIcons';
import { playSynthTone } from './utils/sound';
import { useAuth, db, handleFirestoreError, OperationType, signIn, logOut } from './services/firebase';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { saveOfflineAnalysis, getOfflineAnalyses, getOfflineMaterials, saveOfflineMaterial, OfflineAnalysisResult, clearOfflineAnalyses } from './utils/offlineDb';
// Defer materialsHelper loading to dynamic import to keep initial bundle tiny and lightning-fast
const triggerSyncOfflineHelper = async () => {
  try {
    const { syncOfflineHelper } = await import('./utils/materialsHelper');
    return await syncOfflineHelper();
  } catch (err) {
    console.warn('[Sync] Deferred materials sync warning:', err);
    return [];
  }
};
import { 
  getNetworkQualityInfo, 
  getStoredAutoSyncConfig, 
  saveStoredAutoSyncConfig, 
  measureNetworkLatency, 
  subscribeToNetworkChanges, 
  NetworkQualityInfo, 
  AutoSyncConfig 
} from './utils/networkUtils';

const ResidualStressModule = lazy(() => import('./components/ResidualStressModule').then(m => ({ default: m.ResidualStressModule })));
const XRRModule = lazy(() => import('./components/XRRModule').then(m => ({ default: m.XRRModule })));
const UserActivityPlugin = lazy(() => import('./components/UserActivityPlugin').then(m => ({ default: m.UserActivityPlugin })));
import { XRDSectionScanAnimation } from './components/XRDSectionScanAnimation';
import { logNavigation, logAuth, logSystem, logCalculation, logExport } from './services/activityLogger';
const UnitCellsSection = lazy(() => import('./components/fundamentals/UnitCellsSection').then(m => ({ default: m.UnitCellsSection })));
import { useDisplayMode } from './components/DisplayModeContext';
import { DisplayModeSwitcher } from './components/DisplayModeSwitcher';
import { WorkflowStageHeader } from './components/WorkflowStageHeader';
import { HalfScreenStageNavigator } from './components/HalfScreenStageNavigator';

type Module = 'bragg' | 'unit_cells' | 'fwhm' | 'selection' | 'compare' | 'scherrer' | 'wh' | 'monshi_scherrer' | 'double_voigt' | 'integral' | 'integral_adv' | 'wa' | 'method_of_moments' | 'preferred_orientation' | 'cohen' | 'metric_tensor' | 'supercell_transform' | 'pawley_lebail' | 'rir' | 'rietveld' | 'neutron' | 'magnetic' | 'dl' | 'image_analysis' | 'image_gen' | 'xrd_nano' | 'python_export' | 'learn' | 'profile' | 'settings' | 'database' | 'periodic_table' | 'residual_stress' | 'xrr';

const ModuleLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 min-h-[380px] rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/5 animate-pulse">
    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="h-4 w-48 bg-slate-300 dark:bg-slate-700 rounded-full mb-2" />
    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
  </div>
);

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Loading XRD-Calc Pro...</span>
    </div>
  </div>
);

const getModuleIcon = (id: Module, active: boolean) => {
  const iconProps = {
    className: `w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
      active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300'
    }`
  };

  switch (id) {
    case 'unit_cells':
      return <Box {...iconProps} />;
    case 'bragg':
      return <Activity {...iconProps} />;
    case 'fwhm':
      return <Sliders {...iconProps} />;
    case 'selection':
      return <Hash {...iconProps} />;
    case 'compare':
      return <Layers {...iconProps} />;
    case 'scherrer':
      return <Microscope {...iconProps} />;
    case 'wh':
      return <TrendingUp {...iconProps} />;
    case 'monshi_scherrer':
      return <Activity {...iconProps} />;
    case 'double_voigt':
      return <Layers {...iconProps} />;
    case 'integral':
      return <Infinity {...iconProps} />;
    case 'integral_adv':
      return <Sliders {...iconProps} />;
    case 'wa':
      return <Network {...iconProps} />;
    case 'method_of_moments':
      return <Activity {...iconProps} />;
    case 'preferred_orientation':
      return <Compass {...iconProps} />;
    case 'residual_stress':
      return <Activity {...iconProps} />;
    case 'xrr':
      return <Activity {...iconProps} />;
    case 'cohen':
      return <Grid {...iconProps} />;
    case 'metric_tensor':
      return <Sparkles {...iconProps} />;
    case 'supercell_transform':
      return <Grid {...iconProps} />;
    case 'pawley_lebail':
      return <Activity {...iconProps} />;
    case 'rir':
      return <Layers {...iconProps} />;
    case 'rietveld':
      return <Sliders {...iconProps} />;
    case 'neutron':
      return <Orbit {...iconProps} />;
    case 'magnetic':
      return <Magnet {...iconProps} />;
    case 'dl':
      return <Brain {...iconProps} />;
    case 'image_analysis':
      return <ImageIcon {...iconProps} />;
    case 'image_gen':
      return <Sparkles {...iconProps} />;
    case 'xrd_nano':
      return <Wand2 {...iconProps} />;
    case 'python_export':
      return <Terminal {...iconProps} />;
    case 'learn':
      return <BookOpen {...iconProps} />;
    case 'periodic_table':
      return <Grid {...iconProps} />;
    case 'database':
      return <Database {...iconProps} />;
    case 'profile':
      return <User {...iconProps} />;
    case 'settings':
      return <Settings2 {...iconProps} />;
    default:
      return <Activity {...iconProps} />;
  }
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { displayMode, halfScreenPosition } = useDisplayMode();
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return !!localStorage.getItem('xrd_user_registration');
  });

  useEffect(() => {
     if (user) {
        const savedReg = localStorage.getItem('xrd_user_registration');
        if (!savedReg) {
          const defaultReg = {
            name: user.displayName || user.email?.split('@')[0] || 'Researcher',
            email: user.email || '',
            organization: 'Quantum Crystallography Labs',
            nationality: 'American',
            researchRole: 'Lead Investigator',
            researchField: 'Condensed Matter Physics',
            registeredAt: new Date().toISOString()
          };
          localStorage.setItem('xrd_user_registration', JSON.stringify(defaultReg));

          const nameParts = (defaultReg.name || '').trim().split(/\s+/);
          const first = nameParts[0] || 'Crystallographer';
          const last = nameParts.slice(1).join(' ') || 'Node';
          const initialReference = `${first[0]?.toUpperCase() || 'X'}${last[0]?.toUpperCase() || 'R'}-${new Date().getFullYear()}-CLOUD`;

          const defaultProfile = {
            firstName: first,
            lastName: last,
            title: 'Lead Investigator in Condensed Matter Physics',
            subDescription: `Leading specialized material characterization in Condensed Matter Physics within Quantum Crystallography Labs.`,
            classification: 'L-5 Senior Director',
            idReference: initialReference,
            status: 'Active',
            mission: 'To systematically resolve structural Overlapping peaks and lattice microstrains, empowering Quantum Crystallography Labs with high-fidelity scientific discoveries in Condensed Matter Physics.',
            skills: [
              { name: 'Diffraction Physics', level: 90 },
              { name: 'Symmetry Logic', level: 88 },
              { name: 'Phase Identification', level: 85 },
              { name: 'Spectrum Deconvolution', level: 82 },
              { name: 'Lattice Topology', level: 78 },
              { name: 'Atomic Peak Refining', level: 92 }
            ],
            research: [
              { title: 'Project CONDENSED', status: 'In Optimization', progress: 50, color: 'indigo' },
              { title: 'Structural Characterization at Quantum Crystallography Labs', status: 'In Progress', progress: 30, color: 'emerald' }
            ],
            links: [
              { label: 'Authorized Node', val: defaultReg.email, icon: 'Mail', url: `mailto:${defaultReg.email}` },
              { label: 'Academic Network', val: defaultReg.name.toLowerCase().replace(/\s+/g, '-'), icon: 'Linkedin', url: 'https://linkedin.com' },
              { label: 'Research Repositories', val: first.toLowerCase() + '-lab', icon: 'Github', url: 'https://github.com' }
            ],
            publications: [
              { title: 'High-resolution powder diffraction profile of Condensed Matter Physics lattices', journal: 'Journal of Applied Crystallography', date: '2026' }
            ],
            archive: [
              { year: '2026', title: 'Authorized Node Provisioning', desc: 'Successfully completed onboarding of cloud researcher node for Quantum Crystallography Labs with classification L-5 Senior Director.' }
            ],
            stats: {
              hIndex: 12,
              citations: 340,
              peerReviews: 18,
              scansAnalyzed: 1450
            }
          };
          localStorage.setItem('lab_director_profile_payload', JSON.stringify(defaultProfile));
        }
        setIsRegistered(true);
     }
  }, [user]);

  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [activeModule, setActiveModule] = useState<Module>('bragg');
  const [isNavigatorOpen, setIsNavigatorOpen] = useState<boolean>(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem('xrd_sidebar_pinned');
    return saved !== null ? saved === 'true' : true; // Default pinned for clean orientation
  });
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [isActivityLedgerOpen, setIsActivityLedgerOpen] = useState<boolean>(false);
  const prevModuleRef = useRef<Module>(activeModule);

  useEffect(() => {
    localStorage.setItem('xrd_sidebar_pinned', isSidebarPinned ? 'true' : 'false');
  }, [isSidebarPinned]);

  useEffect(() => {
    if (hasEntered) {
      localStorage.setItem('xrd_has_entered', 'true');
    }
  }, [hasEntered]);

  // Automatic user activity telemetry for module navigation
  useEffect(() => {
    if (hasEntered && isRegistered) {
      if (prevModuleRef.current !== activeModule) {
        logNavigation(activeModule, prevModuleRef.current);
        prevModuleRef.current = activeModule;
      }
    }
  }, [activeModule, hasEntered, isRegistered]);

  // Global Ctrl+K / Cmd+K listener to trigger module navigator
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsNavigatorOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  const [skipIntros, setSkipIntros] = useState<boolean>(() => {
    return localStorage.getItem('xrd_skip_intros') === 'true';
  });
  const [showQuickRibbon, setShowQuickRibbon] = useState<boolean>(() => {
    return localStorage.getItem('xrd_show_quick_ribbon_tools') === 'true';
  });

  const toggleQuickRibbon = () => {
    setShowQuickRibbon(prev => {
      const next = !prev;
      localStorage.setItem('xrd_show_quick_ribbon_tools', String(next));
      return next;
    });
    playSynthTone('switch');
  };
  const [isExplained, setIsExplained] = useState<boolean>(false);

  // Load persistent configurations from localStorage with robust safety fallbacks
  const [theme, setTheme] = useState<'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave' | 'dracula' | 'oceanic' | 'gruvbox' | 'monokai'>(() => {
    return (localStorage.getItem('xrd_theme') as any) || 'light';
  });
  const [precision, setPrecision] = useState<number>(() => {
    const val = localStorage.getItem('xrd_precision');
    return val ? parseInt(val, 10) : 4;
  });
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('xrd_animations');
    return val !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('xrd_sound');
    return val === 'true';
  });
  const [pythonFeaturesEnabled, setPythonFeaturesEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('xrd_python_features');
    return val === 'true'; // default to false
  });
  const [appFooterModal, setAppFooterModal] = useState<FooterModalType>(null);
  
  // Calibration, Geometry offsets and Defaults
  const [zeroShift, setZeroShift] = useState<number>(() => {
    const val = localStorage.getItem('xrd_zero_shift');
    return val ? parseFloat(val) : 0.0;
  });
  const [sampleDisplacement, setSampleDisplacement] = useState<number>(() => {
    const val = localStorage.getItem('xrd_sample_displacement');
    return val ? parseFloat(val) : 0.0;
  });
  const [goniometerRadius, setGoniometerRadius] = useState<number>(() => {
    const val = localStorage.getItem('xrd_goniometer_radius');
    return val ? parseFloat(val) : 180.0;
  });
  const [defaultWavelength, setDefaultWavelength] = useState<number>(() => {
    const val = localStorage.getItem('xrd_default_wavelength');
    return val ? parseFloat(val) : 1.5406;
  });
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(() => {
    try {
      const val = localStorage.getItem('xrd_length_unit');
      if (val === 'nm' || val === 'pm' || val === 'Å') return val as LengthUnit;
    } catch {}
    return 'Å';
  });

  useEffect(() => {
    try {
      localStorage.setItem('xrd_length_unit', lengthUnit);
    } catch {}
  }, [lengthUnit]);

  // Language & RTL Document Attributes Sync for logical UI rendering
  useEffect(() => {
    const rtlLangs = ['he', 'fa', 'ar', 'ur', 'ps', 'yi', 'sd', 'ku', 'ug'];
    const isRTLActive = rtlLangs.includes(i18n.language);
    document.documentElement.dir = isRTLActive ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // Bragg State initialized with saved state from previous session or defaults
  const savedState = (() => {
    try {
      const saved = localStorage.getItem('xrd_bragg_autosave') || localStorage.getItem('xrd_bragg_current');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  const [sampleId, setSampleId] = useState<string>(savedState?.sampleId ?? '');
  const [wavelength, setWavelength] = useState<number>(() => {
    if (savedState?.wavelength) return parseFloat(savedState.wavelength);
    const val = localStorage.getItem('xrd_default_wavelength');
    return val ? parseFloat(val) : 1.5406;
  });
  const [rawPeaks, setRawPeaks] = useState<string>(savedState?.rawPeaks ?? '28.44, 47.30, 56.12, 69.13, 76.38'); 
  const [rawHKL, setRawHKL] = useState<string>(savedState?.rawHKL ?? '111, 220, 311, 400, 331');
  const [materialName, setMaterialName] = useState<string | null>(savedState?.materialName ?? null);
  const [crystalSystem, setCrystalSystem] = useState<string>(savedState?.crystalSystem ?? 'SC');
  const [results, setResults] = useState<BraggResult[]>(savedState?.results ?? []);
  const [comparePeaks, setComparePeaks] = useState<BraggResult[] | null>(null);
  const [compareMaterialName, setCompareMaterialName] = useState<string | null>(null);
  const [braggHistory, setBraggHistory] = useState<BraggHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_bragg_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Offline and Local Database states
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineAnalyses, setOfflineAnalyses] = useState<OfflineAnalysisResult[]>([]);
  const [cachedMaterialsCount, setCachedMaterialsCount] = useState<number>(0);
  const [showOfflineHub, setShowOfflineHub] = useState<boolean>(false);

  // IndexedDB <-> Firestore Synchronization states
  const [isSyncingWithFirestore, setIsSyncingWithFirestore] = useState<boolean>(false);
  const [firestoreSyncProgress, setFirestoreSyncProgress] = useState<number>(0);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<string>('');
  const [firestoreSyncType, setFirestoreSyncType] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [totalSyncItems, setTotalSyncItems] = useState<number>(0);
  const [syncedItemsCount, setSyncedItemsCount] = useState<number>(0);

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('xrd_last_sync_time') || null;
  });
  const [syncStats, setSyncStats] = useState({
    totalAnalyses: 0,
    pendingAnalyses: 0,
    syncedAnalyses: 0,
    totalMaterials: 0,
    pendingMaterials: 0,
    syncedMaterials: 0,
  });

  // Automatic Sync & Network Quality Detection States
  const [autoSyncConfig, setAutoSyncConfig] = useState<AutoSyncConfig>(() => getStoredAutoSyncConfig());
  const [networkQuality, setNetworkQuality] = useState<NetworkQualityInfo>(() => getNetworkQualityInfo());
  const [isTestingSpeed, setIsTestingSpeed] = useState<boolean>(false);

  const runSpeedTest = async () => {
    setIsTestingSpeed(true);
    try {
      const latency = await measureNetworkLatency();
      const quality = getNetworkQualityInfo(latency, autoSyncConfig);
      setNetworkQuality(quality);
      return quality;
    } catch (e) {
      const quality = getNetworkQualityInfo(null, autoSyncConfig);
      setNetworkQuality(quality);
      return quality;
    } finally {
      setIsTestingSpeed(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = saveStoredAutoSyncConfig({ enabled });
    setAutoSyncConfig(updated);
    playSynthTone('switch');

    const quality = getNetworkQualityInfo(networkQuality.measuredLatencyMs, updated);
    setNetworkQuality(quality);

    if (enabled && isOnline && (!updated.highSpeedOnly || quality.isHighSpeed)) {
      triggerSyncOfflineHelper()
        .then(() => syncIndexedDBWithFirestore(false))
        .then(() => refreshOfflineAnalyses())
        .catch(console.error);
    }
  };

  const handleToggleHighSpeedOnly = (highSpeedOnly: boolean) => {
    const updated = saveStoredAutoSyncConfig({ highSpeedOnly });
    setAutoSyncConfig(updated);
    playSynthTone('switch');

    const quality = getNetworkQualityInfo(networkQuality.measuredLatencyMs, updated);
    setNetworkQuality(quality);
  };

  const formatLastSyncTimestamp = (timestamp: string | null) => {
    if (!timestamp) return t('Never synced yet', 'Never synced yet');
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (isToday) {
        return `${t('Today at', 'Today at')} ${timeStr}`;
      }
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      return `${dateStr} ${t('at', 'at')} ${timeStr}`;
    } catch (e) {
      return timestamp;
    }
  };

  // Python Engine States
  const [pythonReady, setPythonReady] = useState<boolean>(false);
  const [pythonLogs, setPythonLogs] = useState<string[]>([]);
  const [showPythonStatus, setShowPythonStatus] = useState<boolean>(false);
  const [showSystemDropdown, setShowSystemDropdown] = useState<boolean>(false);
  const systemDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (systemDropdownRef.current && !systemDropdownRef.current.contains(event.target as Node)) {
        setShowSystemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const refreshOfflineAnalyses = async () => {
    try {
      const analyses = await getOfflineAnalyses();
      setOfflineAnalyses(analyses);
      const mats = await getOfflineMaterials();
      setCachedMaterialsCount(mats.length);

      const pendingAnalyses = analyses.filter(a => !a.isSynced).length;
      const syncedAnalyses = analyses.filter(a => a.isSynced).length;
      const pendingMaterials = mats.filter(m => !m.isSynced).length;
      const syncedMaterials = mats.filter(m => m.isSynced).length;

      setSyncStats({
        totalAnalyses: analyses.length,
        pendingAnalyses,
        syncedAnalyses,
        totalMaterials: mats.length,
        pendingMaterials,
        syncedMaterials
      });
    } catch (e) {
      console.error("IndexedDB stats refresh warn:", e);
    }
  };

  /**
   * Synchronizes local IndexedDB records (calculations & materials) with Firestore
   * and provides live progress tracking for top bar feedback.
   */
  const syncIndexedDBWithFirestore = async (isManual = false) => {
    if (isSyncingWithFirestore) return;

    if (!isOnline) {
      setFirestoreSyncType('error');
      setFirestoreSyncStatus(t('Offline: Cannot sync IndexedDB with Firestore', 'Offline: Cannot sync IndexedDB with Firestore'));
      setTimeout(() => setFirestoreSyncType('idle'), 4000);
      return;
    }

    setIsSyncingWithFirestore(true);
    setFirestoreSyncType('syncing');
    setFirestoreSyncProgress(15);
    setFirestoreSyncStatus(t('Scanning local IndexedDB records...', 'Scanning local IndexedDB records...'));

    try {
      const offlineAnalyses = await getOfflineAnalyses();
      const offlineMaterials = await getOfflineMaterials();

      const unsyncedAnalyses = offlineAnalyses.filter(a => !a.isSynced);
      const unsyncedMaterials = offlineMaterials.filter(m => !m.isSynced);
      const pendingCount = unsyncedAnalyses.length + unsyncedMaterials.length;

      setTotalSyncItems(pendingCount || 1);
      setSyncedItemsCount(0);

      if (pendingCount === 0) {
        setFirestoreSyncProgress(50);
        setFirestoreSyncStatus(t('IndexedDB is up to date with Firestore', 'IndexedDB is up to date with Firestore'));
      }

      let processed = 0;

      // 1. Sync local calculations to Firestore if user is authenticated
      if (user && unsyncedAnalyses.length > 0) {
        for (const item of unsyncedAnalyses) {
          setFirestoreSyncStatus(t(`Syncing calculation "${item.title}"...`, `Syncing calculation "${item.title}"...`));
          const docData: any = {
            id: item.id,
            userId: user.uid,
            timestamp: item.timestamp,
            wavelength: item.wavelength || 1.5406,
            rawPeaks: item.inputData?.rawPeaks || '',
            rawHKL: item.inputData?.rawHKL || '',
            resultsJson: JSON.stringify(item.results || [])
          };
          if (item.title && item.title.startsWith('Bragg: ')) {
            docData.sampleId = item.title.replace('Bragg: ', '');
          }

          try {
            await setDoc(doc(db, 'braggHistory', item.id), docData);
            await saveOfflineAnalysis({ ...item, isSynced: true });
          } catch (err) {
            console.error("Firestore sync error for analysis:", err);
          }

          processed++;
          setSyncedItemsCount(processed);
          setFirestoreSyncProgress(Math.min(85, 15 + Math.round((processed / (pendingCount || 1)) * 60)));
        }
      }

      // 2. Sync materials to Firestore
      if (user && unsyncedMaterials.length > 0) {
        for (const mat of unsyncedMaterials) {
          setFirestoreSyncStatus(t(`Syncing material "${mat.name}"...`, `Syncing material "${mat.name}"...`));
          try {
            await setDoc(doc(db, 'customMaterials', mat.name), {
              ...mat,
              userId: user.uid,
              syncedAt: new Date().toISOString()
            });
            await saveOfflineMaterial({ ...mat, isSynced: true });
          } catch (err) {
            console.error("Firestore material sync error:", err);
          }

          processed++;
          setSyncedItemsCount(processed);
          setFirestoreSyncProgress(Math.min(85, 15 + Math.round((processed / (pendingCount || 1)) * 60)));
        }
      }

      // 3. Pull/Merge remote Firestore records into local IndexedDB
      if (user) {
        setFirestoreSyncProgress(90);
        setFirestoreSyncStatus(t('Synchronizing Firestore remote state with IndexedDB...', 'Synchronizing Firestore remote state with IndexedDB...'));
        try {
          const q = query(
            collection(db, 'braggHistory'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            let results: any = [];
            if (data.resultsJson) {
              try { results = JSON.parse(data.resultsJson); } catch (e) {}
            }
            const offlineRecord: OfflineAnalysisResult = {
              id: docSnap.id,
              type: 'bragg',
              title: data.sampleId ? `Bragg: ${data.sampleId}` : 'Bragg Calculation',
              timestamp: data.timestamp || new Date().toISOString(),
              wavelength: data.wavelength,
              inputData: { rawPeaks: data.rawPeaks, rawHKL: data.rawHKL },
              results: results,
              isSynced: true
            };
            await saveOfflineAnalysis(offlineRecord);
          }
        } catch (err) {
          console.warn("Firestore pull warn:", err);
        }
      }

      setFirestoreSyncProgress(100);
      setFirestoreSyncType('success');
      const syncCompletedTime = new Date().toISOString();
      setLastSyncTime(syncCompletedTime);
      try {
        localStorage.setItem('xrd_last_sync_time', syncCompletedTime);
      } catch (e) {}

      const finalMsg = pendingCount > 0
        ? t(`Successfully synced ${pendingCount} local item(s) with Firestore!`, `Successfully synced ${pendingCount} local item(s) with Firestore!`)
        : t('IndexedDB and Firestore are fully synchronized', 'IndexedDB and Firestore are fully synchronized');
      
      setFirestoreSyncStatus(finalMsg);
      await refreshOfflineAnalyses();

      setTimeout(() => {
        setIsSyncingWithFirestore(false);
        setFirestoreSyncType('idle');
      }, 3500);

    } catch (err: any) {
      console.error("IndexedDB Firestore sync error:", err);
      setFirestoreSyncType('error');
      setFirestoreSyncStatus(t(`Sync error: ${err?.message || 'Failed to sync'}`, `Sync error: ${err?.message || 'Failed to sync'}`));
      setTimeout(() => {
        setIsSyncingWithFirestore(false);
        setFirestoreSyncType('idle');
      }, 4500);
    }
  };

  // Monitor online status, network speed quality, and retrieve cached records
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOfflineData = async () => {
      try {
        await refreshOfflineAnalyses();
      } catch (err) {
        console.error("Failed to load IndexedDB data", err);
      }
    };

    const triggerAutoSyncIfEligible = (quality: NetworkQualityInfo) => {
      if (!autoSyncConfig.enabled) {
        setFirestoreSyncStatus(t('Auto-Sync Disabled (Manual Sync Only)', 'Auto-Sync Disabled (Manual Sync Only)'));
        updateOfflineData();
        return;
      }

      if (autoSyncConfig.highSpeedOnly && !quality.isHighSpeed) {
        setFirestoreSyncStatus(t('Auto-Sync Paused (Slow Network / Data Saver Active)', 'Auto-Sync Paused (Slow Network / Data Saver Active)'));
        updateOfflineData();
        return;
      }

      triggerSyncOfflineHelper()
        .then(() => syncIndexedDBWithFirestore(false))
        .then(() => updateOfflineData())
        .catch(console.error);
    };

    const handleOnline = () => {
      setIsOnline(true);
      const quality = getNetworkQualityInfo(null, autoSyncConfig);
      setNetworkQuality(quality);
      triggerAutoSyncIfEligible(quality);
    };

    const handleOffline = () => {
      setIsOnline(false);
      const quality = getNetworkQualityInfo(null, autoSyncConfig);
      setNetworkQuality(quality);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check & auto-sync trigger
    const initialQuality = getNetworkQualityInfo(null, autoSyncConfig);
    setNetworkQuality(initialQuality);
    triggerAutoSyncIfEligible(initialQuality);

    // Subscribe to network connection speed/type changes (W3C Network Information API)
    const unsubscribeNetwork = subscribeToNetworkChanges(() => {
      const q = getNetworkQualityInfo(null, autoSyncConfig);
      setNetworkQuality(q);
      if (autoSyncConfig.enabled && (!autoSyncConfig.highSpeedOnly || q.isHighSpeed)) {
        triggerAutoSyncIfEligible(q);
      }
    });

    // Initial check for Python Engine
    const checkPythonStatus = async () => {
      try {
        const res = await fetch("/api/python/status");
        if (res.ok) {
          const data = await res.json();
          setPythonReady(data.ready);
          setPythonLogs(data.logs || []);
        }
      } catch (e) {
        console.log("Python engine status pending (waiting for server boot)...");
      }
    };

    checkPythonStatus();
    const interval = setInterval(() => {
      if (!pythonReady) checkPythonStatus();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeNetwork();
      clearInterval(interval);
    };
  }, [pythonReady, autoSyncConfig]);

  // Fetch Bragg history when user logs in
  useEffect(() => {
    let active = true;
    const fetchFirestoreBraggHistory = async () => {
      if (!user) {
        // Fallback to local storage if user is logged out
        try {
          const saved = localStorage.getItem('xrd_bragg_history');
          if (saved) {
            setBraggHistory(JSON.parse(saved));
          } else {
            setBraggHistory([]);
          }
        } catch (e) {
          setBraggHistory([]);
        }
        return;
      }

      const path = 'braggHistory';
      try {
        const q = query(
          collection(db, 'braggHistory'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!active) return;

        const fetchedSessions: BraggHistoryItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let results: BraggResult[] = [];
          if (data.resultsJson) {
            try {
              results = JSON.parse(data.resultsJson);
            } catch (e) {
              console.error("Failed to parse resultsJson", e);
            }
          }
          fetchedSessions.push({
            id: docSnap.id,
            timestamp: data.timestamp || new Date().toISOString(),
            sampleId: data.sampleId,
            materialName: data.materialName,
            wavelength: data.wavelength,
            rawPeaks: data.rawPeaks,
            rawHKL: data.rawHKL,
            results: results
          });
        });

        // Sort by timestamp descending
        fetchedSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setBraggHistory(fetchedSessions);
      } catch (error) {
        if (active) {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      }
    };

    fetchFirestoreBraggHistory();

    return () => {
      active = false;
    };
  }, [user]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);
  const braggStateRef = useRef({ sampleId, wavelength, rawPeaks, rawHKL, results, materialName, crystalSystem });

  const [autosaveInterval, setAutosaveInterval] = useState<number>(() => {
    const val = localStorage.getItem('xrd_autosave_interval');
    return val ? parseInt(val) : 5000;
  });

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const handleClearAll = () => {
    setSampleId('');
    setRawPeaks('');
    setRawHKL('');
    setResults([]);
    setComparePeaks(null);
    setCompareMaterialName(null);
    setMaterialName(null);
    setWavelength(defaultWavelength);
    playSynthTone('switch');
  };

  const handleLoadPreset = (preset: SamplePreset) => {
    setActiveModule(preset.targetModule as Module);
    setSampleId(preset.name);
    setMaterialName(preset.chemicalFormula);
    setCrystalSystem(preset.crystalSystem);
    setWavelength(preset.wavelength);
    setRawPeaks(preset.peaks);
    setRawHKL(preset.hkl);
    setTimeout(() => {
      handleCalculate(true);
    }, 100);
    // Broadcast event for other listening modules
    window.dispatchEvent(new CustomEvent('xrd-load-preset', { detail: preset }));
    playSynthTone('chime');
  };

  // Keep state variables synchronized cleanly in localStorage
  useEffect(() => {
    localStorage.setItem('xrd_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('xrd_precision', precision.toString());
  }, [precision]);

  useEffect(() => {
    localStorage.setItem('xrd_animations', animationsEnabled.toString());
  }, [animationsEnabled]);

  useEffect(() => {
    localStorage.setItem('xrd_sound', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('xrd_python_features', pythonFeaturesEnabled.toString());
  }, [pythonFeaturesEnabled]);

  useEffect(() => {
    localStorage.setItem('xrd_zero_shift', zeroShift.toString());
  }, [zeroShift]);

  useEffect(() => {
    localStorage.setItem('xrd_sample_displacement', sampleDisplacement.toString());
  }, [sampleDisplacement]);

  useEffect(() => {
    localStorage.setItem('xrd_goniometer_radius', goniometerRadius.toString());
  }, [goniometerRadius]);

  useEffect(() => {
    localStorage.setItem('xrd_default_wavelength', defaultWavelength.toString());
  }, [defaultWavelength]);

  // Handle updates to default wavelength from settings
  useEffect(() => {
    setWavelength(defaultWavelength);
  }, [defaultWavelength]);

  // Reset explanation state when module changes (except for profile/learn/settings)
  useEffect(() => {
    if (activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings') {
      setIsExplained(skipIntros);
    } else {
      setIsExplained(true); // Auto-explain profile/learn/settings
    }
  }, [activeModule, skipIntros]);

  // Support programmatic module switching via custom events
  useEffect(() => {
    const handleModuleChange = (e: Event) => {
      const customEvent = e as CustomEvent<Module>;
      if (customEvent.detail) {
        setActiveModule(customEvent.detail);
      }
    };
    window.addEventListener('xrd-change-module', handleModuleChange);
    return () => window.removeEventListener('xrd-change-module', handleModuleChange);
  }, []);

  // Apply theme classes to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'cyberpunk', 'terminal', 'synthwave', 'dracula', 'oceanic', 'gruvbox', 'monokai');
    if (theme !== 'light') {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleCalculate = (saveToHistory = true) => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 600);
    setTimeout(() => setSimulationStep(3), 1400);
    setTimeout(() => setSimulationStep(4), 2200);
    setTimeout(() => setSimulationStep(5), 3000);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      
      // Parse peaks supporting both "twoTheta" and optional ":intensity" format (e.g., "28.44:100, 47.30:80")
      const parsedPeaks = rawPeaks
        .split(/[,;\s]+/)
        .map(pString => pString.trim())
        .filter(s => s !== '')
        .map(pString => {
          const parts = pString.split(':');
          const thetaVal = parseFloat(parts[0]);
          let intensityVal: number | undefined = undefined;
          if (parts.length > 1) {
            const parsedInt = parseFloat(parts[1]);
            if (!isNaN(parsedInt)) {
              intensityVal = parsedInt;
            }
          }
          return { twoTheta: thetaVal, intensity: intensityVal };
        })
        .filter(p => !isNaN(p.twoTheta) && p.twoTheta > 0 && p.twoTheta < 180)
        .sort((a, b) => a.twoTheta - b.twoTheta);

      const hklList = rawHKL
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '');

      const computed = parsedPeaks
        .map((peakObj, idx) => {
          // Apply Zero-Shift and Sample-Displacement errors based on the goniometer geometry settings
          // Equation: 2theta_calibrated = 2theta_obs - zero_shift - (2 * s * cos(theta_rad) / R) * (180 / PI)
          const thetaRad = (peakObj.twoTheta / 2) * (Math.PI / 180);
          const displacementTerm = goniometerRadius > 0 
            ? (2 * sampleDisplacement * Math.cos(thetaRad) / goniometerRadius) * (180 / Math.PI)
            : 0;
          const calibratedTwoTheta = peakObj.twoTheta - zeroShift - displacementTerm;

          const res = calculateBragg(wavelength, calibratedTwoTheta);
          if (res) {
            const hklValue = hklList[idx] || '';
            let validationError: string | undefined = undefined;
            if (hklValue) {
              const parsed = parseSingleHKL(hklValue);
              if (parsed) {
                const check = validateHKLAgainstCrystalSystem(parsed.h, parsed.k, parsed.l, crystalSystem);
                if (!check.valid) {
                  validationError = check.reason;
                }
              }
            }
            // Assign a natural decreasing simulated default intensity (e.g. 100, 85, 70...) if none is provided
            const assignedIntensity = peakObj.intensity !== undefined 
              ? peakObj.intensity 
              : Math.max(10, 100 - (idx * 15));
            return { 
              ...res, 
              hkl: hklValue, 
              intensity: assignedIntensity,
              validationError
            } as BraggResult;
          }
          return null;
        })
        .filter((res): res is BraggResult => res !== null);
      
      setResults(computed);

      if (computed.length > 0) {
        playSynthTone('success');
      } else {
        playSynthTone('error');
      }

      // Save to history
      if (saveToHistory && computed.length > 0) {
        const newItem: BraggHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          sampleId: (sampleId || '').trim() || undefined,
          materialName: (materialName || '').trim() || undefined,
          wavelength,
          rawPeaks,
          rawHKL,
          results: computed
        };
        
        setBraggHistory(prev => {
          const updated = [newItem, ...prev].slice(0, 10); // Keep last 10
          localStorage.setItem('xrd_bragg_history', JSON.stringify(updated));
          return updated;
        });

        // Save to IndexedDB (Offline cache)
        const offlineResult: OfflineAnalysisResult = {
          id: newItem.id,
          type: 'bragg',
          title: newItem.sampleId ? `Bragg: ${newItem.sampleId}` : `Bragg Calculation`,
          timestamp: newItem.timestamp,
          wavelength: newItem.wavelength,
          inputData: { rawPeaks: newItem.rawPeaks, rawHKL: newItem.rawHKL },
          results: newItem.results
        };
        saveOfflineAnalysis(offlineResult)
          .then(() => refreshOfflineAnalyses())
          .catch(err => console.error("IndexedDB cache save failed:", err));

        if (user) {
          const path = `braggHistory/${newItem.id}`;
          const resultsJson = JSON.stringify(computed);
          const docData: any = {
            id: newItem.id,
            userId: user.uid,
            timestamp: newItem.timestamp,
            wavelength: newItem.wavelength,
            rawPeaks: newItem.rawPeaks,
            rawHKL: newItem.rawHKL,
            resultsJson: resultsJson
          };
          if (newItem.sampleId) {
            docData.sampleId = newItem.sampleId;
          }
          setDoc(doc(db, 'braggHistory', newItem.id), docData).catch((error) => {
            handleFirestoreError(error, OperationType.CREATE, path);
          });
        }
      }
    }, 3800);
  };

  const handleBatchCalculate = async (batchSets: Array<{ sampleId: string; rawPeaks: string; rawHKL: string }>) => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 600);
    setTimeout(() => setSimulationStep(3), 1400);
    setTimeout(() => setSimulationStep(4), 2200);
    setTimeout(() => setSimulationStep(5), 3000);
    
    setTimeout(async () => {
      setIsSimulationRunning(false);
      
      const newHistoryItems: BraggHistoryItem[] = [];
      const offlineItems: OfflineAnalysisResult[] = [];
      
      for (const set of batchSets) {
        const parsedPeaks = set.rawPeaks
          .split(/[,;\s]+/)
          .map(pString => pString.trim())
          .filter(s => s !== '')
          .map(pString => {
            const parts = pString.split(':');
            const thetaVal = parseFloat(parts[0]);
            let intensityVal: number | undefined = undefined;
            if (parts.length > 1) {
              const parsedInt = parseFloat(parts[1]);
              if (!isNaN(parsedInt)) {
                intensityVal = parsedInt;
              }
            }
            return { twoTheta: thetaVal, intensity: intensityVal };
          })
          .filter(p => !isNaN(p.twoTheta) && p.twoTheta > 0 && p.twoTheta < 180)
          .sort((a, b) => a.twoTheta - b.twoTheta);

        const hklList = set.rawHKL
          .split(',')
          .map(s => s.trim())
          .filter(s => s !== '');

        const computed = parsedPeaks
          .map((peakObj, idx) => {
            const thetaRad = (peakObj.twoTheta / 2) * (Math.PI / 180);
            const displacementTerm = goniometerRadius > 0 
              ? (2 * sampleDisplacement * Math.cos(thetaRad) / goniometerRadius) * (180 / Math.PI)
              : 0;
            const calibratedTwoTheta = peakObj.twoTheta - zeroShift - displacementTerm;

            const res = calculateBragg(wavelength, calibratedTwoTheta);
            if (res) {
              const hklValue = hklList[idx] || '';
              let validationError: string | undefined = undefined;
              if (hklValue) {
                const parsed = parseSingleHKL(hklValue);
                if (parsed) {
                  const check = validateHKLAgainstCrystalSystem(parsed.h, parsed.k, parsed.l, crystalSystem);
                  if (!check.valid) {
                    validationError = check.reason;
                  }
                }
              }
              const assignedIntensity = peakObj.intensity !== undefined 
                ? peakObj.intensity 
                : Math.max(10, 100 - (idx * 15));
              return { 
                ...res, 
                hkl: hklValue, 
                intensity: assignedIntensity,
                validationError
              } as BraggResult;
            }
            return null;
          })
          .filter((res): res is BraggResult => res !== null);

        if (computed.length > 0) {
          const newItem: BraggHistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            sampleId: (set.sampleId || '').trim() || undefined,
            wavelength,
            rawPeaks: set.rawPeaks,
            rawHKL: set.rawHKL,
            results: computed
          };
          newHistoryItems.push(newItem);
          
          offlineItems.push({
            id: newItem.id,
            type: 'bragg',
            title: newItem.sampleId ? `Bragg: ${newItem.sampleId}` : `Bragg Calculation`,
            timestamp: newItem.timestamp,
            wavelength: newItem.wavelength,
            inputData: { rawPeaks: newItem.rawPeaks, rawHKL: newItem.rawHKL },
            results: newItem.results
          });
        }
      }

      if (newHistoryItems.length > 0) {
        setBraggHistory(prev => {
          const updated = [...newHistoryItems.reverse(), ...prev].slice(0, 50);
          localStorage.setItem('xrd_bragg_history', JSON.stringify(updated));
          return updated;
        });
        
        for (const item of offlineItems) {
          await saveOfflineAnalysis(item).catch(console.error);
        }
        refreshOfflineAnalyses();
        
        if (user) {
          for (const newItem of newHistoryItems) {
            const path = `braggHistory/${newItem.id}`;
            const resultsJson = JSON.stringify(newItem.results);
            const docData: any = {
              id: newItem.id,
              userId: user.uid,
              timestamp: newItem.timestamp,
              wavelength: newItem.wavelength,
              rawPeaks: newItem.rawPeaks,
              rawHKL: newItem.rawHKL,
              resultsJson: resultsJson
            };
            if (newItem.sampleId) {
              docData.sampleId = newItem.sampleId;
            }
            setDoc(doc(db, 'braggHistory', newItem.id), docData).catch((error) => {
              handleFirestoreError(error, OperationType.CREATE, path);
            });
          }
        }
        
        const last = newHistoryItems[0];
        setSampleId(last.sampleId || "");
        setRawPeaks(last.rawPeaks);
        setRawHKL(last.rawHKL);
        setResults(last.results);
        
        playSynthTone('success');
      } else {
        playSynthTone('error');
      }
    }, 3800);
  };


  const restoreHistory = (item: BraggHistoryItem) => {
    if (item.sampleId) setSampleId(item.sampleId);
    if (item.materialName) setMaterialName(item.materialName);
    setWavelength(item.wavelength);
    setRawPeaks(item.rawPeaks);
    setRawHKL(item.rawHKL);
    setResults(item.results);
  };

  const clearHistory = async () => {
    const listToDelete = [...braggHistory];
    setBraggHistory([]);
    localStorage.removeItem('xrd_bragg_history');

    // Clear IndexedDB calculations as well
    try {
      await clearOfflineAnalyses();
      await refreshOfflineAnalyses();
    } catch (e) {
      console.error("IndexedDB clear failed:", e);
    }

    if (user && listToDelete.length > 0) {
      for (const item of listToDelete) {
        const path = `braggHistory/${item.id}`;
        try {
          await deleteDoc(doc(db, 'braggHistory', item.id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    }
  };

  const handleAILoad = (peaks: number[], newWavelength?: number, hkls?: string[], material?: string) => {
    if (newWavelength) setWavelength(newWavelength);
    setRawPeaks(peaks.join(', '));
    if (hkls && hkls.length > 0) {
      setRawHKL(hkls.join(', '));
    }
    if (material) {
      setMaterialName(material);
    }
  };

  const handleGeneratePdf = async () => {
    playSynthTone('success');
    try {
      const { generatePdfReport } = await import('./utils/pdfGenerator');
      generatePdfReport();
    } catch (err) {
      console.error('Failed to load PDF generator:', err);
    }
  };

  const braggJsonOutput = {
    module: "Bragg-Basics",
    material: materialName || "Unknown",
    wavelength_angstrom: wavelength,
    results: results.map(r => ({
      "hkl": r.hkl,
      "2theta_deg": r.twoTheta,
      "d_spacing_angstrom": r.dSpacing,
      "q_vector_inverse_angstrom": r.qVector,
      "sin_theta_over_lambda": r.sinThetaOverLambda
    }))
  };

  useEffect(() => {
    braggStateRef.current = { sampleId, wavelength, rawPeaks, rawHKL, results, materialName, crystalSystem };
    // Keep xrd_bragg_current updated on-the-fly as well, but the formal autosave ticks periodically
    localStorage.setItem('xrd_bragg_current', JSON.stringify({
      sampleId,
      wavelength,
      rawPeaks,
      rawHKL,
      results,
      materialName,
      crystalSystem
    }));
  }, [sampleId, wavelength, rawPeaks, rawHKL, results, materialName, crystalSystem]);

  const lastSavedJsonRef = useRef<string>('');

  useEffect(() => {
    if (autosaveInterval <= 0) {
      setIsSaving(false);
      return;
    }

    const interval = setInterval(() => {
      const currentData = braggStateRef.current;
      const currentJson = JSON.stringify(currentData);
      
      // Skip state update and storage write if no changes have occurred
      if (currentJson === lastSavedJsonRef.current) {
        return;
      }
      
      lastSavedJsonRef.current = currentJson;
      setIsSaving(true);
      localStorage.setItem('xrd_bragg_autosave', currentJson);
      
      const now = new Date();
      setLastAutosaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      setTimeout(() => {
        setIsSaving(false);
      }, 600);
    }, autosaveInterval);

    return () => clearInterval(interval);
  }, [autosaveInterval]);

  const modules = useMemo<{ id: Module; label: string; icon?: string; group?: string }[]>(() => {
    const allModules: { id: Module; label: string; icon?: string; group?: string }[] = [
      { id: 'bragg', label: t('Bragg Basics'), group: t('Fundamentals') },
      { id: 'unit_cells', label: t('14 Bravais & Crystal Systems'), group: t('Fundamentals') },
      { id: 'fwhm', label: t('FWHM Analysis'), group: t('Fundamentals') },
      { id: 'selection', label: t('Selection Rules'), group: t('Fundamentals') },
      { id: 'preferred_orientation', label: t('Preferred Orientation'), group: t('Fundamentals') },
      { id: 'compare', label: t('Diffraction Compare'), group: t('Fundamentals') },
      { id: 'scherrer', label: t('Scherrer Method'), group: t('Size & Strain') },
      { id: 'wh', label: t('Williamson-Hall'), group: t('Size & Strain') },
      { id: 'monshi_scherrer', label: t('Monshi-Scherrer Scheme'), group: t('Size & Strain') },
      { id: 'double_voigt', label: t('Double-Voigt Method'), group: t('Size & Strain') },
      { id: 'integral', label: t('Integral Breadth'), group: t('Size & Strain') },
      { id: 'integral_adv', label: t('IB Advanced (W-H)'), group: t('Size & Strain') },
      { id: 'wa', label: t('Warren-Averbach'), group: t('Size & Strain') },
      { id: 'method_of_moments', label: t('Method of Moments'), group: t('Size & Strain') },
      { id: 'residual_stress', label: t('Residual Stress'), group: t('Size & Strain') },
      { id: 'xrr', label: t('X-Ray Reflectometry (XRR)'), group: t('Size & Strain') },
      { id: 'cohen', label: t("Cohen's Matrix Method"), group: t('Advanced Refinement') },
      { id: 'metric_tensor', label: t("Metric Tensor Algebra"), group: t('Advanced Refinement') },
      { id: 'supercell_transform', label: t("Supercell & Matrix Engine"), group: t('Advanced Refinement') },
      { id: 'pawley_lebail', label: t("Pawley & Le Bail Fitting"), group: t('Advanced Refinement') },
      { id: 'rir', label: t("Reference Intensity Ratio (RIR)"), group: t('Advanced Refinement') },
      { id: 'rietveld', label: t('Rietveld Setup'), group: t('Advanced Sim') },
      { id: 'neutron', label: t('Neutron Diffraction'), group: t('Advanced Sim') },
      { id: 'magnetic', label: t('Magnetic Diffraction'), group: t('Advanced Sim') },
      { id: 'xrd_nano', label: t('Nano-Crystallite Simulator'), group: t('Advanced Sim') },
      { id: 'python_export', label: t('Python Generator'), group: t('Advanced Sim') },
      { id: 'dl', label: t('PhaseID Neural Net'), group: t('AI Tools') },
      { id: 'image_analysis', label: t('Image Analysis'), group: t('AI Tools') },
      { id: 'image_gen', label: t('Scientific Illustrator'), group: t('AI Tools') },
      { id: 'learn', label: t('Protocol Guide'), group: t('Intelligence') },
      { id: 'periodic_table', label: t('Periodic Table'), group: t('Intelligence') },
      { id: 'database', label: t('Material Registry'), group: t('Intelligence') },
      { id: 'profile', label: t('Laboratory Director'), group: t('Intelligence') },
      { id: 'settings', label: t('Settings'), group: t('Intelligence') },
    ];
    
    if (!pythonFeaturesEnabled) {
      return allModules.filter(m => m.id !== 'python_export');
    }
    return allModules;
  }, [t, i18n.language, pythonFeaturesEnabled]);

  const stateRef = useRef({
    activeModule,
    modules,
    handleCalculate,
    handleClearAll,
    setShowShortcutsModal
  });

  useEffect(() => {
    stateRef.current = {
      activeModule,
      modules,
      handleCalculate,
      handleClearAll,
      setShowShortcutsModal
    };
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const { activeModule, modules, handleCalculate, handleClearAll, setShowShortcutsModal } = stateRef.current;
      // 1. Calculate shortcut: Cmd + Enter or Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCalculate(true);
        playSynthTone('success');
        return;
      }

      // 2. Clear All shortcut: Cmd + Delete or Cmd + Backspace or Ctrl + Delete or Ctrl + Backspace
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleClearAll();
        return;
      }

      // 3. Toggle Shortcuts HUD: Cmd + / or Alt + /
      if (e.key === '/' && (e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        playSynthTone('switch');
        return;
      }

      // 4. Switch between primary modules: Alt + [1-9]
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        const mappedModules: Module[] = [
          'bragg',
          'fwhm',
          'selection',
          'scherrer',
          'wh',
          'rietveld',
          'dl',
          'database',
          'settings'
        ];
        if (mappedModules[index]) {
          e.preventDefault();
          setActiveModule(mappedModules[index]);
          playSynthTone('switch');
        }
        return;
      }

      // 5. Cycling modules with Alt + ArrowRight/Left
      if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const currentIndex = modules.findIndex(m => m.id === activeModule);
        if (currentIndex !== -1) {
          let nextIndex = currentIndex;
          if (e.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % modules.length;
          } else {
            nextIndex = (currentIndex - 1 + modules.length) % modules.length;
          }
          setActiveModule(modules[nextIndex].id);
          playSynthTone('switch');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    handleCalculate(false);
  }, []);

  useEffect(() => {
    if (!hasEntered || !isRegistered) {
      document.body.classList.remove('overflow-hidden', 'h-screen');
      document.body.classList.add('overflow-y-auto', 'min-h-screen');
      document.documentElement.classList.remove('overflow-hidden', 'h-screen');
    } else {
      document.body.classList.add('overflow-hidden', 'h-screen');
      document.body.classList.remove('overflow-y-auto', 'min-h-screen');
      document.documentElement.classList.add('overflow-hidden', 'h-screen');
    }
    return () => {
      document.body.classList.remove('overflow-hidden', 'h-screen', 'overflow-y-auto', 'min-h-screen');
      document.documentElement.classList.remove('overflow-hidden', 'h-screen');
    };
  }, [hasEntered, isRegistered]);

  if (!hasEntered) {
    return (
      <div className={theme === 'light' ? '' : theme}>
        <Suspense fallback={<PageLoadingFallback />}>
          <LandingPage
            onEnter={(mode?: 'register' | 'login', targetModule?: Module) => {
              localStorage.setItem('xrd_has_entered', 'true');
              const savedReg = localStorage.getItem('xrd_user_registration');
              if (!savedReg) {
                const defaultGuest = {
                  name: 'Guest Crystallographer',
                  email: 'guest@quantum-crystallography.org',
                  organization: 'Quantum Crystallography Labs',
                  nationality: 'American',
                  researchRole: 'Lead Investigator',
                  researchField: 'Condensed Matter Physics',
                  registeredAt: new Date().toISOString()
                };
                localStorage.setItem('xrd_user_registration', JSON.stringify(defaultGuest));
                setIsRegistered(true);
              }
              setAuthMode(mode || 'register');
              setHasEntered(true);
              if (targetModule) {
                setActiveModule(targetModule);
              }
            }}
            theme={theme}
            setTheme={setTheme}
            isRegistered={isRegistered}
            activeModule={activeModule}
            onReturnToApp={(targetModule?: Module) => {
              if (targetModule) {
                setActiveModule(targetModule);
              }
              setHasEntered(true);
              playSynthTone('switch');
            }}
            onSignOut={() => {
              localStorage.removeItem('xrd_user_registration');
              setIsRegistered(false);
              setHasEntered(false);
            }}
          />
        </Suspense>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <RegistrationPage
          initialMode={authMode}
          onRegister={() => setIsRegistered(true)}
          onBack={() => setHasEntered(false)}
        />
      </Suspense>
    );
  }

  return (
    <SettingsContext.Provider value={{
      precision,
      zeroShift,
      sampleDisplacement,
      goniometerRadius,
      soundEnabled,
      animationsEnabled,
      lengthUnit,
      setLengthUnit
    }}>
      <div className={`${theme === 'light' ? '' : theme} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex h-screen ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in duration-700 transition-colors`}>
        
        {/* Responsive Sidebar Navigation: Full Sidebar or Compact Mini Rail */}
        {isSidebarPinned ? (
          <aside className="hidden md:flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 h-full shrink-0 z-20 shadow-2xl relative transition-all duration-300">
            <div className={`p-4 border-b ${theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black' : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50'} flex items-center justify-between gap-3 backdrop-blur-md group`}>
               <div className="flex items-center gap-3">
                 <div className={`w-9 h-9 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_15px_rgba(255,0,255,0.5)]' : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20'} rounded-xl flex items-center justify-center text-white font-bold text-lg border border-white/10 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
                   <span className="relative z-10">λ</span>
                 </div>
                 <div>
                   <span className={`font-black text-xl italic tracking-tighter ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'} block leading-none`}>
                     XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
                   </span>
                   <span className="text-[8.5px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-0.5">
                     v2.5 Lab Suite
                   </span>
                 </div>
               </div>

               {/* Collapse to Mini Rail Button */}
               <button
                 onClick={() => {
                   setIsSidebarPinned(false);
                   playSynthTone('switch');
                 }}
                 className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                 title={t('Collapse to Mini Rail', 'Collapse to Mini Rail')}
               >
                 <PanelLeftClose className="w-4 h-4" />
               </button>
            </div>

            {/* Direct Link to Welcome Page & Showcase */}
            <div className="px-4 pt-3 shrink-0">
              <button
                onClick={() => {
                  setHasEntered(false);
                  playSynthTone('switch');
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 cursor-pointer shadow-xs active:scale-95 group"
                title={t('Return to Welcome Page & Scientific Tour', 'Return to Welcome Page & Scientific Tour')}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse group-hover:rotate-12 transition-transform" />
                  <span>{t('Welcome Page & Tour', 'Welcome Page & Tour')}</span>
                </div>
                <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Home</span>
              </button>
            </div>

            {/* Quick Search / Filter Bar */}
            <div className="px-4 pt-2 pb-1 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder={t('Filter 30+ modules...', 'Filter 30+ modules...')}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors"
                />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              {Array.from(new Set(
                (sidebarSearch.trim()
                  ? modules.filter(m => m.label.toLowerCase().includes(sidebarSearch.toLowerCase()) || (m.group && m.group.toLowerCase().includes(sidebarSearch.toLowerCase())))
                  : modules
                ).map(m => m.group || '')
              )).map((group) => {
                const groupFiltered = (sidebarSearch.trim()
                  ? modules.filter(m => m.label.toLowerCase().includes(sidebarSearch.toLowerCase()) || (m.group && m.group.toLowerCase().includes(sidebarSearch.toLowerCase())))
                  : modules
                ).filter(m => m.group === group);
                
                if (groupFiltered.length === 0) return null;

                return (
                  <div key={group} className="space-y-2">
                    <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
                      {group}
                    </h3>
                    <div className="space-y-1">
                      {groupFiltered.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setActiveModule(m.id);
                            playSynthTone('xrd_scan');
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative flex items-center gap-3 cursor-pointer ${
                            activeModule === m.id
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {activeModule === m.id && (
                            <span className="absolute left-0 w-1 h-4 bg-white rounded-r-full" />
                          )}
                          {getModuleIcon(m.id, activeModule === m.id)}
                          <span className="truncate">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-2.5">
              <button
                id="export-pdf-report-btn"
                onClick={handleGeneratePdf}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border ${
                  theme === 'cyberpunk'
                    ? 'bg-cyber-pink hover:bg-cyber-pink/85 border-cyber-accent text-white shadow-[0_0_15px_rgba(255,0,255,0.3)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 border-emerald-500 dark:border-emerald-400 text-white shadow-md'
                }`}
                title="Compile and download consolidated XRD Lab Report (PDF)"
              >
                <FileDown className="w-4 h-4 animate-bounce" />
                {t('Export PDF Report', 'Export PDF Report')}
              </button>

              <button
                onClick={() => {
                  setHasEntered(false);
                  playSynthTone('switch');
                }}
                className="w-full py-1.5 px-3 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                title="View interactive 3D hero showcase and tutorial workflows"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('Product Showcase & Tour', 'Product Showcase & Tour')}</span>
              </button>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center space-y-1">
                <div className="font-bold uppercase tracking-widest">v2.5.0 • {t('Lab Active')}</div>
                <div 
                  onClick={() => setAppFooterModal('about-creator')}
                  className="opacity-80 hover:opacity-100 hover:text-violet-400 transition-all cursor-pointer font-medium"
                >
                  {t('Designed by')} Ali Zerehsaz
                </div>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <a href="mailto:alizerehsaz2001@gmail.com" title="Gmail: alizerehsaz2001@gmail.com" className="hover:text-rose-400 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://www.linkedin.com/in/ali-zerehsaz-60818b249" target="_blank" rel="noopener noreferrer" title="LinkedIn: ali-zerehsaz-60818b249" className="hover:text-blue-400 transition-colors">
                    <LinkedinIcon className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://github.com/alizerehsaz2001-pixel" target="_blank" rel="noopener noreferrer" title="GitHub: alizerehsaz2001-pixel" className="hover:text-purple-400 transition-colors">
                    <GithubIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        ) : (
          <NavigationRail
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            modules={modules}
            getModuleIcon={getModuleIcon}
            theme={theme}
            onExpandSidebar={() => setIsSidebarPinned(true)}
            onOpenNavigator={() => setIsNavigatorOpen(true)}
            onOpenWelcome={() => {
              setHasEntered(false);
              playSynthTone('switch');
            }}
          />
        )}
        
        <SideSeekBar targetRef={mainContentRef} theme={theme} />

        <div className={`flex-1 flex flex-col h-full overflow-hidden ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
          {/* Top App Bar & Navigation Header */}
          <TopAppBar
            theme={theme}
            setTheme={setTheme}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            modules={modules}
            getModuleIcon={getModuleIcon}
            isNavigatorOpen={isNavigatorOpen}
            setIsNavigatorOpen={setIsNavigatorOpen}
            isSidebarPinned={isSidebarPinned}
            setIsSidebarPinned={setIsSidebarPinned}
            isExplained={isExplained}
            setIsExplained={setIsExplained}
            isOnline={isOnline}
            firestoreSyncType={firestoreSyncType}
            firestoreSyncProgress={firestoreSyncProgress}
            firestoreSyncStatus={firestoreSyncStatus}
            isSyncingWithFirestore={isSyncingWithFirestore}
            syncedItemsCount={syncedItemsCount}
            totalSyncItems={totalSyncItems}
            syncStats={syncStats}
            lastSyncTime={lastSyncTime}
            formatLastSyncTimestamp={formatLastSyncTimestamp}
            syncIndexedDBWithFirestore={syncIndexedDBWithFirestore}
            refreshOfflineAnalyses={refreshOfflineAnalyses}
            pythonReady={pythonReady}
            setShowPythonStatus={setShowPythonStatus}
            setShowOfflineHub={setShowOfflineHub}
            skipIntros={skipIntros}
            setSkipIntros={setSkipIntros}
            setShowShortcutsModal={setShowShortcutsModal}
            playSynthTone={playSynthTone}
            isRTL={isRTL}
            t={t}
            sampleId={sampleId}
            onOpenActivityLedger={() => setIsActivityLedgerOpen(true)}
            wavelength={wavelength}
            setWavelength={setWavelength}
            onCalculate={() => handleCalculate(true)}
            onClearAll={handleClearAll}
            onExportPdf={handleGeneratePdf}
            onLoadPreset={handleLoadPreset}
            showQuickRibbon={showQuickRibbon}
            onToggleQuickRibbon={toggleQuickRibbon}
            user={user}
            onSignOut={() => {
              logOut().catch(console.error);
              localStorage.removeItem('xrd_user_registration');
              setIsRegistered(false);
              setHasEntered(false);
            }}
            onSignIn={() => {
              signIn().catch(console.error);
            }}
            onOpenWelcome={() => {
              setHasEntered(false);
              playSynthTone('switch');
            }}
          />

          {/* User-Friendly Quick Tools Module Strip (Collapsible) */}
          <AnimatePresence>
            {showQuickRibbon && (
              <QuickWorkflowRibbon
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                modules={modules}
                getModuleIcon={getModuleIcon}
                theme={theme}
                onClose={() => {
                  setShowQuickRibbon(false);
                  localStorage.setItem('xrd_show_quick_ribbon_tools', 'false');
                  playSynthTone('switch');
                }}
              />
            )}
          </AnimatePresence>

          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 custom-scrollbar relative">
            <div className={
              displayMode === 'fullscreen' 
                ? 'w-full max-w-[1850px] mx-auto px-2 sm:px-4 lg:px-8 relative transition-all duration-300' 
                : halfScreenPosition === 'left' 
                ? 'w-full lg:w-1/2 mr-auto px-2 sm:px-4 border-r border-indigo-500/20 bg-slate-900/10 dark:bg-slate-950/30 shadow-2xl relative transition-all duration-300 min-h-full' 
                : halfScreenPosition === 'right' 
                ? 'w-full lg:w-1/2 ml-auto px-2 sm:px-4 border-l border-indigo-500/20 bg-slate-900/10 dark:bg-slate-950/30 shadow-2xl relative transition-all duration-300 min-h-full' 
                : 'w-full max-w-[860px] mx-auto px-2 sm:px-4 border-x border-indigo-500/20 bg-slate-900/10 dark:bg-slate-950/30 shadow-2xl relative transition-all duration-300 min-h-full'
            }>
              {/* Half-Screen Quick Stage Navigation Bar */}
              {displayMode === 'halfscreen' && (
                <HalfScreenStageNavigator />
              )}

              {/* Non-destructive Theory & Mathematical Basis Modal Overlay */}
              <AnimatePresence>
                {!isExplained && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 lg:p-10 flex justify-center items-start"
                  >
                    <div className="relative w-full max-w-5xl my-auto animate-in zoom-in-95 duration-200">
                      <button
                        onClick={() => {
                          setIsExplained(true);
                          playSynthTone('switch');
                        }}
                        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-950 transition-all cursor-pointer shadow-xl border border-white/20 hover:scale-105"
                        title={t('Return to Workspace (Esc)', 'Return to Workspace')}
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <ModuleIntro 
                        module={activeModule} 
                        onUnderstand={() => setIsExplained(true)} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic XRD Section Diffraction Scan Animation upon Section Click */}
              <XRDSectionScanAnimation activeModule={activeModule} theme={theme} />

              <AnimatePresence mode="wait">
                  <motion.div
                    key={activeModule}
                    initial={animationsEnabled ? { opacity: 0, scale: 0.93, y: 15, filter: 'blur(8px)' } : false}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={animationsEnabled ? { opacity: 0, scale: 0.97, y: -10, filter: 'blur(4px)' } : { opacity: 1 }}
                    transition={{
                      duration: 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-full origin-center"
                  >
                    <ErrorBoundary key={activeModule}>
                  {activeModule === 'bragg' && (
                    displayMode === 'fullscreen' ? (
                      /* Full-Screen Mode: Strict Functional Sequential Dependency Pipeline */
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stage 1: Numerical Inputs & Goniometer Geometry */}
                        <div id="stage-inputs" className="space-y-3">
                          <WorkflowStageHeader 
                            step={1} 
                            totalSteps={5} 
                            title={t('Stage 1: Numerical Inputs & Goniometer Geometry', 'Stage 1: Numerical Inputs & Goniometer Geometry')} 
                            subtitle={t('Radiation source wavelength (λ), goniometer radius (R), instrument zero-offset, and 2θ reflection angles', 'Radiation source wavelength (λ), goniometer radius (R), instrument zero-offset, and 2θ reflection angles')} 
                            badge="Inputs & Geometry" 
                            badgeColor="indigo" 
                            isComplete={results.length > 0} 
                          />
                          <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xl backdrop-blur-md">
                            <BraggInput 
                              sampleId={sampleId}
                              setSampleId={setSampleId}
                              wavelength={wavelength}
                              setWavelength={setWavelength}
                              rawPeaks={rawPeaks}
                              setRawPeaks={setRawPeaks}
                              rawHKL={rawHKL}
                              setRawHKL={setRawHKL}
                              onCalculate={() => handleCalculate(true)}
                              onBatchCalculate={handleBatchCalculate}
                              zeroShift={zeroShift}
                              setZeroShift={setZeroShift}
                              sampleDisplacement={sampleDisplacement}
                              setSampleDisplacement={setSampleDisplacement}
                              goniometerRadius={goniometerRadius}
                              setGoniometerRadius={setGoniometerRadius}
                              isSimulationRunning={isSimulationRunning}
                              simulationStep={simulationStep}
                              isSaving={isSaving}
                              lastAutosaved={lastAutosaved}
                              crystalSystem={crystalSystem}
                              setCrystalSystem={setCrystalSystem}
                            />
                          </div>
                        </div>

                        {/* Stage 2: Operational Controls & Processing Console */}
                        <div id="stage-operations" className="space-y-3">
                          <WorkflowStageHeader 
                            step={2} 
                            totalSteps={5} 
                            title={t('Stage 2: Operational Controls & Processing Console', 'Stage 2: Operational Controls & Processing Console')} 
                            subtitle={t('Execute Bragg diffraction solver, run batch array evaluation, and review instrument calibration', 'Execute Bragg diffraction solver, run batch array evaluation, and review instrument calibration')} 
                            badge="Execution Pipeline" 
                            badgeColor="cyan" 
                            isComplete={results.length > 0} 
                          />
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-indigo-950/90 border border-cyan-500/30 shadow-xl backdrop-blur-md text-white">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                              {/* Real-time telemetry badges */}
                              <div className="flex flex-wrap items-center gap-2.5">
                                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs flex items-center gap-2">
                                  <span className="text-slate-400">Radiation Source:</span>
                                  <span className="font-bold text-cyan-400">λ = {wavelength.toFixed(5)} Å</span>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs flex items-center gap-2">
                                  <span className="text-slate-400">Zero Offset:</span>
                                  <span className="font-bold text-emerald-400">{zeroShift > 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°</span>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs flex items-center gap-2">
                                  <span className="text-slate-400">Goniometer Radius:</span>
                                  <span className="font-bold text-indigo-400">{goniometerRadius} mm</span>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs flex items-center gap-2">
                                  <span className="text-slate-400">Loaded Peaks:</span>
                                  <span className="font-bold text-amber-400">{results.length} Indexed</span>
                                </div>
                              </div>

                              {/* Direct execution triggers */}
                              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleCalculate(true)}
                                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer hover:scale-[1.02] transition-all"
                                >
                                  <Zap className="w-4 h-4 text-cyan-200 animate-pulse" />
                                  <span>{t('Execute Solver (Enter)', 'Execute Solver')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleGeneratePdf}
                                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 cursor-pointer transition-colors"
                                  title={t('Export Certified PDF Report', 'Export Certified PDF Report')}
                                >
                                  <FileDown className="w-3.5 h-3.5 text-indigo-300" />
                                  <span>PDF Report</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearAll}
                                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 font-bold text-xs flex items-center gap-1.5 border border-white/5 cursor-pointer transition-colors"
                                  title={t('Reset inputs and calculated results', 'Reset inputs and calculated results')}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reset</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stage 3: High-Refresh 120 FPS Visualizer & Diffraction Profile */}
                        <div id="stage-visualizer" className="space-y-3">
                          <WorkflowStageHeader 
                            step={3} 
                            totalSteps={5} 
                            title={t('Stage 3: High-Refresh 120 FPS Visualizer & Diffraction Profile', 'Stage 3: High-Refresh 120 FPS Visualizer & Diffraction Profile')} 
                            subtitle={t('Sub-8ms real-time ray-tracing goniometer and high-precision interactive spectrum chart', 'Sub-8ms real-time ray-tracing goniometer and high-precision interactive spectrum chart')} 
                            badge="120 FPS Interactive" 
                            badgeColor="emerald" 
                            isComplete={results.length > 0} 
                          />
                          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                            <div className="xl:col-span-5">
                              <Suspense fallback={<ModuleLoadingFallback />}>
                                <BraggVisualization 
                                  wavelength={wavelength} 
                                  twoTheta={results.length > 0 ? results[0].twoTheta : 20} 
                                />
                              </Suspense>
                            </div>
                            <div className="xl:col-span-7">
                              <Suspense fallback={<ModuleLoadingFallback />}>
                                <DiffractionChart 
                                  results={results} 
                                  materialName={materialName} 
                                  wavelength={wavelength} 
                                  onResultsChange={setResults} 
                                />
                              </Suspense>
                            </div>
                          </div>
                        </div>

                        {/* Stage 4: Quantitative Results & Lattice Refinement */}
                        <div id="stage-results" className="space-y-3">
                          <WorkflowStageHeader 
                            step={4} 
                            totalSteps={5} 
                            title={t('Stage 4: Quantitative Results & Lattice Parameter Refinement', 'Stage 4: Quantitative Results & Lattice Parameter Refinement')} 
                            subtitle={t('Calculated interplanar d-spacing (Å), scattering vectors Q (Å⁻¹), and unit cell indexing', 'Calculated interplanar d-spacing (Å), scattering vectors Q (Å⁻¹), and unit cell indexing')} 
                            badge="Quantitative Data" 
                            badgeColor="amber" 
                            isComplete={results.length > 0} 
                          />
                          <Suspense fallback={<ModuleLoadingFallback />}>
                            <ResultsTable 
                              results={results} 
                              onExportCompare={(selectedResults) => {
                                setComparePeaks(selectedResults);
                                setCompareMaterialName(materialName ? `${materialName} (Selected Peaks)` : 'Selected Peaks');
                                setActiveModule('compare');
                              }}
                            />
                            <div className="mt-6">
                              <LatticeEstimator results={results} />
                            </div>
                          </Suspense>
                        </div>

                        {/* Stage 5: Engine Data Link & Audit Archives */}
                        <div id="stage-history" className="space-y-3">
                          <WorkflowStageHeader 
                            step={5} 
                            totalSteps={5} 
                            title={t('Stage 5: Engine Data Link & Historical Audit Trail', 'Stage 5: Engine Data Link & Historical Audit Trail')} 
                            subtitle={t('Strict JSON export and reproducible calculation history with point-in-time restore points', 'Strict JSON export and reproducible calculation history with point-in-time restore points')} 
                            badge="Data & Archives" 
                            badgeColor="purple" 
                            isComplete={braggHistory.length > 0} 
                          />
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-6">
                              <Suspense fallback={<div className="h-44 rounded-2xl bg-white/20 dark:bg-slate-900/20 animate-pulse border border-slate-200/40 dark:border-white/5" />}>
                                <BraggHistory 
                                  history={braggHistory} 
                                  onRestore={restoreHistory} 
                                  onClear={clearHistory} 
                                />
                              </Suspense>
                            </div>
                            <div className="lg:col-span-6">
                              <div className="bg-slate-900 dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-800 dark:border-white/5 ring-1 ring-white/10">
                                 <div className="flex justify-between items-center mb-3">
                                   <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                     <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Engine Data Link (Strict JSON)</span>
                                   </div>
                                   <button 
                                     onClick={() => navigator.clipboard.writeText(JSON.stringify(braggJsonOutput, null, 2))}
                                     className="text-[10px] text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md font-mono cursor-pointer"
                                   >
                                     Copy Strict JSON
                                   </button>
                                 </div>
                                 <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed h-56 scrollbar-thin scrollbar-thumb-slate-700 p-2 bg-black/40 rounded-xl">
                                    {JSON.stringify(braggJsonOutput, null, 2)}
                                 </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Half-Screen Mode (50% Split Width Multitasking Flow) */
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Stage 1: Numerical Inputs & Parameters */}
                        <div id="stage-inputs" className="space-y-2">
                          <WorkflowStageHeader 
                            step={1} 
                            totalSteps={5} 
                            title={t('Stage 1: Inputs & Goniometer Geometry', 'Stage 1: Inputs & Goniometer Geometry')} 
                            badge="Inputs" 
                            badgeColor="indigo" 
                            isComplete={results.length > 0} 
                          />
                          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-3 sm:p-4 shadow-md backdrop-blur-md">
                            <BraggInput 
                              sampleId={sampleId}
                              setSampleId={setSampleId}
                              wavelength={wavelength}
                              setWavelength={setWavelength}
                              rawPeaks={rawPeaks}
                              setRawPeaks={setRawPeaks}
                              rawHKL={rawHKL}
                              setRawHKL={setRawHKL}
                              onCalculate={() => handleCalculate(true)}
                              onBatchCalculate={handleBatchCalculate}
                              zeroShift={zeroShift}
                              setZeroShift={setZeroShift}
                              sampleDisplacement={sampleDisplacement}
                              setSampleDisplacement={setSampleDisplacement}
                              goniometerRadius={goniometerRadius}
                              setGoniometerRadius={setGoniometerRadius}
                              isSimulationRunning={isSimulationRunning}
                              simulationStep={simulationStep}
                              isSaving={isSaving}
                              lastAutosaved={lastAutosaved}
                              crystalSystem={crystalSystem}
                              setCrystalSystem={setCrystalSystem}
                            />
                          </div>
                        </div>

                        {/* Stage 2: Operational Controls & Processing Console */}
                        <div id="stage-operations" className="space-y-2">
                          <WorkflowStageHeader 
                            step={2} 
                            totalSteps={5} 
                            title={t('Stage 2: Operational Controls', 'Stage 2: Operational Controls')} 
                            badge="Operations" 
                            badgeColor="cyan" 
                            isComplete={results.length > 0} 
                          />
                          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-white space-y-3">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-400">λ: <strong className="text-cyan-400">{wavelength.toFixed(4)} Å</strong></span>
                              <span className="text-slate-400">Zero: <strong className="text-emerald-400">{zeroShift}°</strong></span>
                              <span className="text-slate-400">Peaks: <strong className="text-amber-400">{results.length}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCalculate(true)}
                                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5 text-cyan-200" />
                                <span>{t('Calculate', 'Calculate')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleClearAll}
                                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stage 3: Visualizer & Spectrum */}
                        <div id="stage-visualizer" className="space-y-2">
                          <WorkflowStageHeader 
                            step={3} 
                            totalSteps={5} 
                            title={t('Stage 3: 120 FPS Visualizer & Spectrum', 'Stage 3: 120 FPS Visualizer & Spectrum')} 
                            badge="Visualizer" 
                            badgeColor="emerald" 
                            isComplete={results.length > 0} 
                          />
                          <Suspense fallback={<ModuleLoadingFallback />}>
                            <div className="space-y-4">
                              <BraggVisualization 
                                wavelength={wavelength} 
                                twoTheta={results.length > 0 ? results[0].twoTheta : 20} 
                              />
                              <DiffractionChart 
                                results={results} 
                                materialName={materialName} 
                                wavelength={wavelength} 
                                onResultsChange={setResults} 
                              />
                            </div>
                          </Suspense>
                        </div>

                        {/* Stage 4: Results & Lattice Solver */}
                        <div id="stage-results" className="space-y-2">
                          <WorkflowStageHeader 
                            step={4} 
                            totalSteps={5} 
                            title={t('Stage 4: Quantitative Results & Lattice', 'Stage 4: Quantitative Results & Lattice')} 
                            badge="Results" 
                            badgeColor="amber" 
                            isComplete={results.length > 0} 
                          />
                          <Suspense fallback={<ModuleLoadingFallback />}>
                            <div className="space-y-4">
                              <ResultsTable 
                                results={results} 
                                onExportCompare={(selectedResults) => {
                                  setComparePeaks(selectedResults);
                                  setCompareMaterialName(materialName ? `${materialName} (Selected Peaks)` : 'Selected Peaks');
                                  setActiveModule('compare');
                                }}
                              />
                              <LatticeEstimator results={results} />
                            </div>
                          </Suspense>
                        </div>

                        {/* Stage 5: Archives & JSON Data */}
                        <div id="stage-history" className="space-y-2">
                          <WorkflowStageHeader 
                            step={5} 
                            totalSteps={5} 
                            title={t('Stage 5: History & Engine Data', 'Stage 5: History & Engine Data')} 
                            badge="Archives" 
                            badgeColor="purple" 
                            isComplete={braggHistory.length > 0} 
                          />
                          <div className="space-y-4">
                            <Suspense fallback={<div className="h-44 rounded-2xl bg-white/20 dark:bg-slate-900/20 animate-pulse border border-slate-200/40 dark:border-white/5" />}>
                              <BraggHistory 
                                history={braggHistory} 
                                onRestore={restoreHistory} 
                                onClear={clearHistory} 
                              />
                            </Suspense>
                            <div className="bg-slate-900 dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-800 dark:border-white/5">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Engine Data Link</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(braggJsonOutput, null, 2))}
                                  className="text-[10px] text-white/60 hover:text-white transition-colors bg-white/10 px-2 py-1 rounded cursor-pointer"
                                >
                                  Copy JSON
                                </button>
                              </div>
                              <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed h-40 scrollbar-thin scrollbar-thumb-slate-700 p-2 bg-black/40 rounded-lg">
                                {JSON.stringify(braggJsonOutput, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <Suspense fallback={<ModuleLoadingFallback />}>
                    {activeModule === 'fwhm' && <FWHMModule />}
                    {activeModule === 'selection' && <SelectionRulesModule />}
                    {activeModule === 'compare' && (
                      <DiffractionCompareModule 
                        activeResults={comparePeaks || results} 
                        activeMaterialName={compareMaterialName || materialName} 
                      />
                    )}
                    {activeModule === 'scherrer' && <ScherrerModule />}
                    {activeModule === 'wh' && <WilliamsonHallModule />}
                    {activeModule === 'monshi_scherrer' && <MonshiScherrerModule />}
                    {activeModule === 'double_voigt' && <DoubleVoigtModule />}
                    {activeModule === 'integral' && <IntegralBreadthModule />}
                    {activeModule === 'integral_adv' && <IntegralBreadthAdvancedModule />}
                    {activeModule === 'wa' && <WarrenAverbachModule />}
                    {activeModule === 'method_of_moments' && <MethodOfMomentsModule />}
                    {activeModule === 'residual_stress' && <ResidualStressModule />}
                    {activeModule === 'xrr' && <XRRModule />}
                    {activeModule === 'preferred_orientation' && <PreferredOrientationModule />}
                    {activeModule === 'cohen' && (
                      <CohenRefinementModule 
                        activeResults={results} 
                        activeMaterialName={materialName} 
                      />
                    )}
                    {activeModule === 'metric_tensor' && (
                      <CrystallographicMetricTensorModule pythonFeaturesEnabled={pythonFeaturesEnabled} />
                    )}
                    {activeModule === 'supercell_transform' && (
                      <SupercellTransformationModule pythonFeaturesEnabled={pythonFeaturesEnabled} />
                    )}
                    {activeModule === 'pawley_lebail' && (
                      <PawleyLeBailDecompositionModule pythonFeaturesEnabled={pythonFeaturesEnabled} />
                    )}
                    {activeModule === 'rir' && <ReferenceIntensityRatioModule />}
                    {activeModule === 'rietveld' && <RietveldModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                    {activeModule === 'neutron' && <NeutronModule />}
                    {activeModule === 'magnetic' && <MagneticNeutronModule />}
                    {activeModule === 'dl' && <DeepLearningModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                    {activeModule === 'image_analysis' && (
                      <ImageAnalysisModule 
                        pythonFeaturesEnabled={pythonFeaturesEnabled} 
                        onLoadPeaks={(peaksStr, hklStr, matName) => {
                          setRawPeaks(peaksStr);
                          if (hklStr) setRawHKL(hklStr);
                          if (matName) setMaterialName(matName);
                          setActiveModule('bragg');
                        }}
                      />
                    )}
                    {activeModule === 'image_gen' && <ImageGenerationModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                    {activeModule === 'xrd_nano' && <XrdNanoModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                    {activeModule === 'python_export' && <PythonExportModule />}
                    {activeModule === 'learn' && <LearnModule />}
                    {activeModule === 'unit_cells' && <UnitCellsSection />}
                    {activeModule === 'database' && <MaterialDatabaseExplorer pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                    {activeModule === 'periodic_table' && (
                      <PeriodicTableModule
                        onLoadPeaks={(peaksStr, hklStr, matName) => {
                          setRawPeaks(peaksStr);
                          setRawHKL(hklStr);
                          setMaterialName(matName);
                          setActiveModule('bragg');
                        }}
                      />
                    )}
                    {activeModule === 'profile' && <ProfilePage />}
                    {activeModule === 'settings' && (
                      <SettingsModule 
                        theme={theme}
                        setTheme={setTheme}
                        precision={precision}
                        setPrecision={setPrecision}
                        animationsEnabled={animationsEnabled}
                        setAnimationsEnabled={setAnimationsEnabled}
                        soundEnabled={soundEnabled}
                        setSoundEnabled={setSoundEnabled}
                        zeroShift={zeroShift}
                        setZeroShift={setZeroShift}
                        sampleDisplacement={sampleDisplacement}
                        setSampleDisplacement={setSampleDisplacement}
                        goniometerRadius={goniometerRadius}
                        setGoniometerRadius={setGoniometerRadius}
                        defaultWavelength={defaultWavelength}
                        setDefaultWavelength={setDefaultWavelength}
                        autosaveInterval={autosaveInterval}
                        setAutosaveInterval={setAutosaveInterval}
                        pythonFeaturesEnabled={pythonFeaturesEnabled}
                        setPythonFeaturesEnabled={setPythonFeaturesEnabled}
                        lengthUnit={lengthUnit}
                        setLengthUnit={setLengthUnit}
                      />
                    )}
                  </Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p 
                onClick={() => setAppFooterModal('about-creator')}
                className="text-slate-400 dark:text-slate-500 hover:text-violet-400 transition-colors text-xs cursor-pointer inline-block"
              >
                XRD-Calc Pro {t('Laboratory Environment')} • {t('Designed by')} Ali Zerehsaz
              </p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <a 
                  href="mailto:alizerehsaz2001@gmail.com" 
                  className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-400" /> Gmail
                </a>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <a 
                  href="https://www.linkedin.com/in/ali-zerehsaz-60818b249" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
                >
                  <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
                </a>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <a 
                  href="https://github.com/alizerehsaz2001-pixel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
                >
                  <GithubIcon className="w-3.5 h-3.5 text-purple-400" /> GitHub
                </a>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-2xl mx-auto italic leading-relaxed">
                {t('Disclaimer')}
              </p>
            </div>
          </main>
          <Suspense fallback={null}>
            <AIChatSupport />

            {/* Footer Info Modal for App */}
            <FooterInfoModal 
              isOpen={!!appFooterModal}
              modalType={appFooterModal}
              onClose={() => setAppFooterModal(null)}
              isRTL={isRTL}
              onActionNavigate={(modKey) => {
                setAppFooterModal(null);
                if (modKey) {
                  setActiveModule(modKey as any);
                }
              }}
            />
          </Suspense>
          
          {/* Global Keyboard Shortcut Modal / Cheat Sheet Overlay */}
          {showShortcutsModal && (
            <div 
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-200" 
              onClick={() => setShowShortcutsModal(false)}
            >
              <div 
                className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border cursor-default animate-in zoom-in-95 duration-200 ${
                  theme === 'cyberpunk'
                    ? 'bg-black border-cyber-accent text-cyber-accent shadow-[0_0_50px_rgba(255,0,255,0.15)]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-500 animate-pulse" />
                    {t('Keyboard Shortcuts', 'Keyboard Shortcuts')}
                  </h3>
                  <button 
                    onClick={() => setShowShortcutsModal(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-bold p-1 bg-slate-150 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all w-6 h-6 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{t('Calculate', 'Calculate')}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{t('Submit or run structural modeling analyses', 'Submit or run structural modeling analyses')}</p>
                    </div>
                    <kbd className="px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/55 rounded-lg text-xs font-mono text-indigo-300 shadow-sm shrink-0">
                      ⌘ + Enter
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 hover:border-rose-500/30 transition-all">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-rose-500">{t('Clear All Inputs', 'Clear All Inputs')}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{t('Reset laboratory outputs back to default', 'Reset laboratory inputs back to default')}</p>
                    </div>
                    <kbd className="px-2.5 py-1 bg-rose-600/20 border border-rose-500/55 rounded-lg text-xs font-mono text-rose-300 shadow-sm shrink-0">
                      ⌘ + Backspace
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 hover:border-slate-400/30 transition-all">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">{t('Cycle Modules', 'Cycle Modules')}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{t('Navigate backward or forward through components', 'Navigate backward or forward')}</p>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm shrink-0">
                      Alt + ← / →
                    </kbd>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('Direct Module Hotkeys', 'Direct Module Hotkeys')}</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-[170px] overflow-y-auto custom-scrollbar p-1.5 bg-slate-100/50 dark:bg-black/30 rounded-2xl border border-dotted border-slate-250 dark:border-white/5">
                      {[
                        { key: 'Alt+1', name: t('Bragg Basics') },
                        { key: 'Alt+2', name: t('FWHM Analysis') },
                        { key: 'Alt+3', name: t('Selection Rules') },
                        { key: 'Alt+4', name: t('Scherrer Method') },
                        { key: 'Alt+5', name: t('Williamson-Hall') },
                        { key: 'Alt+6', name: t('Rietveld Setup') },
                        { key: 'Alt+7', name: t('PhaseID Neural Net') },
                        { key: 'Alt+8', name: t('Material Registry') },
                        { key: 'Alt+9', name: t('Laboratory Settings') },
                      ].map((jump) => (
                        <div key={jump.key} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-xs">
                          <span className="text-[11px] font-medium truncate max-w-[100px] text-slate-700 dark:text-slate-300">{jump.name}</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono text-slate-500 select-none">{jump.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('Toggle Shortcuts Panel', 'Toggle Shortcuts Panel')}</p>
                    <kbd className="px-2.5 py-1 bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm shrink-0">
                      ⌘ + / or Alt + /
                    </kbd>
                  </div>
                </div>

                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-6 uppercase tracking-wider font-mono animate-pulse">{t('Click anywhere to dismiss', 'Click anywhere to dismiss')}</p>
              </div>
            </div>
          )}

          {/* Offline Sync & IndexedDB Caching Hub overlay */}
          <AnimatePresence>
            {showOfflineHub && (
              <div 
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
                onClick={() => setShowOfflineHub(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative text-left"
                >
                  <button
                    onClick={() => setShowOfflineHub(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3.5 border-b border-white/5 pb-4 mb-4">
                    <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400 animate-pulse'}`}>
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        {t('Offline Caching & Sync Hub', 'Offline Caching & Sync Hub')}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Powered by IndexedDB & Progressive Service Worker
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Calculations, materials database additions, and analysis result parameters are cached locally. You can conduct new analyses, manage databases, and access history entirely without an internet connection.
                    </p>

                    {/* Simulated Offline Toggle */}
                    <div className="p-3.5 bg-black/45 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-white uppercase tracking-wide">
                          {t('Simulate Offline Mode', 'Simulate Offline Mode')}
                        </span>
                        <span className="block text-[9.5px] text-slate-500 font-mono mt-0.5">
                          Force local cache-first operations for deep testing
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const nextOnline = !isOnline;
                          setIsOnline(nextOnline);
                          playSynthTone('success');
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                          !isOnline 
                            ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 font-extrabold shadow'
                            : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                        }`}
                      >
                        {!isOnline ? t('Offline Mode Active', 'Offline Mode Active') : t('Force Offline', 'Force Offline')}
                      </button>
                    </div>

                    {/* Automatic Sync & Network Guard Controls */}
                    <div className="p-4 bg-slate-950/60 border border-indigo-500/20 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wide">
                            {t('Automatic Sync Settings', 'Automatic Sync Settings')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                            !autoSyncConfig.enabled
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : networkQuality.isHighSpeed
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {!autoSyncConfig.enabled
                              ? t('Auto-Sync OFF', 'Auto-Sync OFF')
                              : networkQuality.isHighSpeed
                              ? t('High-Speed Active', 'High-Speed Active')
                              : t('Data Guard Active', 'Data Guard Active')}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch 1: Automatic Sync */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="block text-xs font-bold text-slate-200">
                            {t('Automatic Background Sync', 'Automatic Background Sync')}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">
                            {t('Automatically sync IndexedDB data with Firestore when online.', 'Automatically sync IndexedDB data with Firestore when online.')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAutoSync(!autoSyncConfig.enabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            autoSyncConfig.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              autoSyncConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Toggle Switch 2: High-Speed Network Requirement */}
                      {autoSyncConfig.enabled && (
                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                          <div>
                            <span className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              {t('Require High-Speed Network (4G/5G/WiFi)', 'Require High-Speed Network (4G/5G/WiFi)')}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {t('Pauses auto-sync on metered/slow connections (2G/3G) or when Data Saver is active to conserve mobile bandwidth.', 'Pauses auto-sync on metered/slow connections (2G/3G) or when Data Saver is active to conserve mobile bandwidth.')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleHighSpeedOnly(!autoSyncConfig.highSpeedOnly)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              autoSyncConfig.highSpeedOnly ? 'bg-emerald-600' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                autoSyncConfig.highSpeedOnly ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}

                      {/* Network Quality & Live Diagnostics Box */}
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 font-mono text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                            {t('Live Connection Diagnostics', 'Live Connection Diagnostics')}
                          </span>
                          <button
                            type="button"
                            onClick={runSpeedTest}
                            disabled={isTestingSpeed}
                            className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-bold border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTestingSpeed ? 'animate-spin' : ''}`} />
                            {isTestingSpeed ? t('Testing...', 'Testing...') : t('Test Speed', 'Test Speed')}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                            <span className="text-slate-500 block text-[9px] uppercase">{t('Speed & Quality', 'Speed & Quality')}</span>
                            <span className="font-bold text-white text-xs block mt-0.5 capitalize">
                              {networkQuality.speedCategory.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                            <span className="text-slate-500 block text-[9px] uppercase">{t('Connection Type', 'Connection Type')}</span>
                            <span className="font-bold text-indigo-300 text-xs block mt-0.5 uppercase">
                              {networkQuality.effectiveType} ({networkQuality.connectionType})
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                            <span className="text-slate-500 block text-[9px] uppercase">{t('Est. Bandwidth', 'Est. Bandwidth')}</span>
                            <span className="font-bold text-emerald-400 text-xs block mt-0.5">
                              {networkQuality.downlink ? `${networkQuality.downlink.toFixed(1)} Mbps` : 'N/A'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                            <span className="text-slate-500 block text-[9px] uppercase">{t('Latency (RTT)', 'Latency (RTT)')}</span>
                            <span className="font-bold text-cyan-400 text-xs block mt-0.5">
                              {networkQuality.rtt ? `${networkQuality.rtt} ms` : networkQuality.measuredLatencyMs ? `${Math.round(networkQuality.measuredLatencyMs)} ms` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="text-[9.5px] text-slate-400 pt-1 flex items-start gap-1.5 leading-relaxed border-t border-white/5">
                          <span className="shrink-0 text-indigo-400">ℹ️</span>
                          <span>{networkQuality.reason}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live IndexedDB <-> Firestore Sync Status Card */}
                    <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className={`w-4 h-4 ${isSyncingWithFirestore ? 'text-indigo-400 animate-spin' : 'text-indigo-400'}`} />
                          <span className="text-xs font-bold text-white uppercase tracking-wide">
                            {t('IndexedDB <-> Firestore Sync Status', 'IndexedDB <-> Firestore Sync Status')}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            syncIndexedDBWithFirestore(true);
                            playSynthTone('switch');
                          }}
                          disabled={isSyncingWithFirestore || !isOnline}
                          className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            isSyncingWithFirestore 
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : !isOnline
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                              : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-sm'
                          }`}
                        >
                          {isSyncingWithFirestore ? t('Syncing...', 'Syncing...') : t('Sync Now', 'Sync Now')}
                        </button>
                      </div>

                      {/* Sync Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span className="truncate max-w-[320px]">
                            {firestoreSyncStatus || (isOnline ? t('Ready to sync IndexedDB with Firestore', 'Ready to sync IndexedDB with Firestore') : t('Offline mode - local cache active', 'Offline mode - local cache active'))}
                          </span>
                          <span className="font-bold text-indigo-400">{firestoreSyncProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              firestoreSyncType === 'error'
                                ? 'bg-amber-500'
                                : firestoreSyncType === 'success'
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                            }`}
                            style={{ width: `${firestoreSyncProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Storage & Caching Information */}
                    <div>
                      <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                        {t('IndexedDB Storage Integrity', 'IndexedDB Storage Integrity')}
                      </span>
                      <div className="grid grid-cols-2 gap-3 font-mono text-[10.5px]">
                        <div className="p-3 bg-black/30 border border-white/5 rounded-xl text-left">
                          <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wider leading-none">Recent Materials</span>
                          <span className="block text-lg font-black text-white mt-1.5">{cachedMaterialsCount} cached</span>
                        </div>

                        <div className="p-3 bg-black/30 border border-white/5 rounded-xl text-left">
                          <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wider leading-none">Analysis Records</span>
                          <span className="block text-lg font-black text-white mt-1.5">{offlineAnalyses.length} cached</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Offline Actions Log */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">
                          {t('Recent Cached Calculations', 'Recent Cached Calculations')}
                        </span>
                        {offlineAnalyses.length > 0 && (
                          <button
                            onClick={async () => {
                              await clearHistory();
                            }}
                            className="text-[9.5px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                          >
                            {t('Clear Cache', 'Clear Cache')}
                          </button>
                        )}
                      </div>

                      {offlineAnalyses.length === 0 ? (
                        <div className="text-center p-6 bg-black/25 border border-white/5 rounded-xl text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">
                          {t('No offline records cached yet. Run a calculation!', 'No offline records cached yet. Run a calculation!')}
                        </div>
                      ) : (
                        <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                          {offlineAnalyses.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 bg-black/20 border border-white/5 hover:border-indigo-500/20 rounded-xl flex justify-between items-center text-left text-[11px] font-mono relative group transition-colors"
                            >
                              <div>
                                <span className="block font-bold text-white text-xs leading-none">{item.title}</span>
                                <span className="block text-[9.5px] text-slate-500 mt-1">
                                  Peaks: {item.inputData?.rawPeaks || 'N/A'} • {item.results?.length || 0} details
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  const mapped: BraggHistoryItem = {
                                    id: item.id,
                                    timestamp: item.timestamp,
                                    sampleId: item.title.startsWith('Bragg:') ? item.title.replace('Bragg: ', '') : undefined,
                                    wavelength: item.wavelength || 1.5406,
                                    rawPeaks: item.inputData?.rawPeaks || '',
                                    rawHKL: item.inputData?.rawHKL || '',
                                    results: item.results || []
                                  };
                                  restoreHistory(mapped);
                                  setShowOfflineHub(false);
                                  playSynthTone('switch');
                                }}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9.5px] rounded border border-indigo-500/20 cursor-pointer transition-colors font-bold uppercase"
                              >
                                Restore
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 mt-5 text-center">
                    <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Service Worker actively intercepting static resources.
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Python Engine Status Hub overlay */}
          <AnimatePresence>
            {showPythonStatus && (
              <div 
                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 text-left"
                onClick={() => setShowPythonStatus(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500" />
                  
                  <button
                    onClick={() => setShowPythonStatus(false)}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-5 border-b border-white/5 pb-6 mb-6">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg ${pythonReady ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20' : 'bg-amber-500/20 text-amber-400 shadow-amber-500/20 animate-pulse'}`}>
                      <Terminal className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                          Computational Engine Status
                        </h3>
                        {pythonReady ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-black tracking-widest uppercase">Operational</span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-black tracking-widest uppercase animate-pulse">Initializing</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        High-performance Python backend for Rietveld, Phase-ID, and Neural Net Training
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</span>
                        <div className="mt-1 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${pythonReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="text-sm font-bold text-slate-200">Python 3.10 Runtime</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compiler</span>
                        <div className="mt-1 flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-sm font-bold text-slate-200">Pip Package Manager</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3 px-1 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <RefreshCw className={`w-3 h-3 ${!pythonReady ? 'animate-spin' : ''}`} />
                          System Boot Sequential Log
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {pythonLogs.length} entries captured
                        </span>
                      </div>
                      <div className="bg-black/60 rounded-3xl p-5 border border-white/5 font-mono text-[11px] h-64 overflow-y-auto custom-scrollbar shadow-inner text-left">
                        {pythonLogs.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-600 italic">
                            Waiting for log stream...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {pythonLogs.map((log, i) => (
                              <div key={i} className="flex gap-3 leading-relaxed">
                                <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                                <span className={
                                  log.toLowerCase().includes('error') ? 'text-rose-400' : 
                                  log.toLowerCase().includes('warning') ? 'text-amber-400' : 
                                  log.toLowerCase().includes('success') ? 'text-emerald-400' :
                                  'text-slate-300'
                                }>
                                  {log}
                                </span>
                              </div>
                            ))}
                            {!pythonReady && (
                              <div className="flex gap-3 text-indigo-400 animate-pulse mt-2">
                                <span className="shrink-0 select-none">...</span>
                                <span>Processing background installation task...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <Activity className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wide text-left">Analysis Ready Status</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-left">
                            Most analysis modules require scientific libraries (NumPy, SciPy, Pandas). If your module is not responding, check the logs above to ensure the setup is complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Scientific Module Navigator Modal */}
          <Suspense fallback={null}>
            <ScientificModuleNavigator
              isOpen={isNavigatorOpen}
              onClose={() => setIsNavigatorOpen(false)}
              activeModule={activeModule}
              onSelectModule={(modId) => {
                setActiveModule(modId as Module);
                playSynthTone('switch');
              }}
              theme={theme}
            />
          </Suspense>

          {/* User Activity & Telemetry Plugin */}
          {isActivityLedgerOpen && (
            <Suspense fallback={null}>
              <UserActivityPlugin
                isOpen={isActivityLedgerOpen}
                onClose={() => setIsActivityLedgerOpen(false)}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
    </SettingsContext.Provider>
  );
};

export default App;
