
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18n } from './components/I18nProvider';
import { FullAppTranslator } from './components/FullAppTranslator';
import { motion, AnimatePresence } from 'motion/react';
import { BraggInput } from './components/BraggInput';
import { ResultsTable } from './components/ResultsTable';
import { DiffractionChart } from './components/DiffractionChart';
import { DiffractionCompareModule } from './components/DiffractionCompareModule';
import { SelectionRulesModule } from './components/SelectionRulesModule';
import { ScherrerModule } from './components/ScherrerModule';
import { WilliamsonHallModule } from './components/WilliamsonHallModule';
import { MonshiScherrerModule } from './components/MonshiScherrerModule';
import { DoubleVoigtModule } from './components/DoubleVoigtModule';
import { IntegralBreadthModule } from './components/IntegralBreadthModule';
import { IntegralBreadthAdvancedModule } from './components/IntegralBreadthAdvancedModule';
import { WarrenAverbachModule } from './components/WarrenAverbachModule';
import { MethodOfMomentsModule } from './components/MethodOfMomentsModule';
import { RietveldModule } from './components/RietveldModule';
import { NeutronModule } from './components/NeutronModule';
import { MagneticNeutronModule } from './components/MagneticNeutronModule';
import { DeepLearningModule } from './components/DeepLearningModule';
import { FWHMModule } from './components/FWHMModule';
import { PreferredOrientationModule } from './components/PreferredOrientationModule';
import { CohenRefinementModule } from './components/CohenRefinementModule';
import { CrystallographicMetricTensorModule } from './components/CrystallographicMetricTensorModule';
import { SupercellTransformationModule } from './components/SupercellTransformationModule';
import { PawleyLeBailDecompositionModule } from './components/PawleyLeBailDecompositionModule';
import { ReferenceIntensityRatioModule } from './components/ReferenceIntensityRatioModule';
import { ImageAnalysisModule } from './components/ImageAnalysisModule';
import { ImageGenerationModule } from './components/ImageGenerationModule';
import { XrdNanoModule } from './components/XrdNanoModule';
import { PythonExportModule } from './components/PythonExportModule';
import { MaterialDatabaseExplorer } from './components/MaterialDatabaseExplorer';

import { SettingsModule } from './components/SettingsModule';
import { ProfilePage } from './components/ProfilePage';
import { LearnModule } from './components/LearnModule';
import { AIChatSupport } from './components/AIChatSupport';
import { ModuleIntro } from './components/ModuleIntro';
import { LandingPage } from './components/LandingPage';
import { RegistrationPage } from './components/RegistrationPage';
import { FooterInfoModal, FooterModalType } from './components/FooterInfoModal';
import { SideSeekBar } from './components/SideSeekBar';
import LanguageSelector from './components/LanguageSelector';
import { BraggHistory } from './components/BraggHistory';
import { BraggVisualization } from './components/BraggVisualization';
import { LatticeEstimator } from './components/LatticeEstimator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsContext, LengthUnit } from './components/SettingsContext';
import { PeriodicTableModule } from './components/PeriodicTableModule';
import { ScientificModuleNavigator } from './components/ScientificModuleNavigator';
import { TopAppBar } from './components/TopAppBar';
import { calculateBragg, parsePeakString, parseSingleHKL, validateHKLAgainstCrystalSystem } from './utils/physics';
import { BraggResult, BraggHistoryItem } from './types';
import { Zap, Terminal, Music, Languages, Palette, Hash, Sparkles, Wand2, Volume2, Settings2, Check, FileDown, FastForward, X, RefreshCw, Activity, BookOpen, Grid, Database, User, Compass, Microscope, TrendingUp, Infinity, Network, Cpu, Orbit, Magnet, Brain, Image as ImageIcon, Sliders, Layers, PieChart as PieChartIcon, Target, CheckCircle2, WifiOff, Mail, ChevronDown, PanelLeftClose, PanelLeftOpen, LayoutGrid, Menu, Command, Atom, Clock, Gauge, Wifi, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { LinkedinIcon, GithubIcon } from './components/SocialIcons';
import { playSynthTone } from './utils/sound';
import { generatePdfReport } from './utils/pdfGenerator';
import { useAuth, db, handleFirestoreError, OperationType } from './services/firebase';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { saveOfflineAnalysis, getOfflineAnalyses, getOfflineMaterials, saveOfflineMaterial, OfflineAnalysisResult, clearOfflineAnalyses } from './utils/offlineDb';
import { syncOfflineHelper } from './utils/materialsHelper';
import { 
  getNetworkQualityInfo, 
  getStoredAutoSyncConfig, 
  saveStoredAutoSyncConfig, 
  measureNetworkLatency, 
  subscribeToNetworkChanges, 
  NetworkQualityInfo, 
  AutoSyncConfig 
} from './utils/networkUtils';

import { ResidualStressModule } from './components/ResidualStressModule';
import { XRRModule } from './components/XRRModule';
import { UserActivityPlugin } from './components/UserActivityPlugin';
import { logNavigation, logAuth, logSystem, logCalculation, logExport } from './services/activityLogger';

type Module = 'bragg' | 'fwhm' | 'selection' | 'compare' | 'scherrer' | 'wh' | 'monshi_scherrer' | 'double_voigt' | 'integral' | 'integral_adv' | 'wa' | 'method_of_moments' | 'preferred_orientation' | 'cohen' | 'metric_tensor' | 'supercell_transform' | 'pawley_lebail' | 'rir' | 'rietveld' | 'neutron' | 'magnetic' | 'dl' | 'image_analysis' | 'image_gen' | 'xrd_nano' | 'python_export' | 'learn' | 'profile' | 'settings' | 'database' | 'periodic_table' | 'residual_stress' | 'xrr';

const getModuleIcon = (id: Module, active: boolean) => {
  const iconProps = {
    className: `w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
      active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300'
    }`
  };

  switch (id) {
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
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(false); // default false: FULL SCREEN for active section!
  const [isActivityLedgerOpen, setIsActivityLedgerOpen] = useState<boolean>(false);
  const prevModuleRef = useRef<Module>(activeModule);

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
  const [currentClockTime, setCurrentClockTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      syncOfflineHelper()
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

      syncOfflineHelper()
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

  useEffect(() => {
    if (autosaveInterval <= 0) {
      setIsSaving(false);
      return;
    }

    const interval = setInterval(() => {
      setIsSaving(true);
      const currentData = braggStateRef.current;
      localStorage.setItem('xrd_bragg_autosave', JSON.stringify(currentData));
      
      const now = new Date();
      setLastAutosaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      setTimeout(() => {
        setIsSaving(false);
      }, 800);
    }, autosaveInterval);

    return () => clearInterval(interval);
  }, [autosaveInterval]);

  const modules = useMemo<{ id: Module; label: string; icon?: string; group?: string }[]>(() => {
    const allModules: { id: Module; label: string; icon?: string; group?: string }[] = [
      { id: 'bragg', label: t('Bragg Basics'), group: t('Fundamentals') },
      { id: 'fwhm', label: t('FWHM Analysis'), group: t('Fundamentals') },
      { id: 'selection', label: t('Selection Rules'), group: t('Fundamentals') },
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
      { id: 'preferred_orientation', label: t('Preferred Orientation'), group: t('Fundamentals') },
      { id: 'cohen', label: t("Cohen's Matrix Method"), group: t('Advanced Refinement') },
      { id: 'metric_tensor', label: t("Metric Tensor Algebra"), group: t('Advanced Refinement') },
      { id: 'supercell_transform', label: t("Supercell & Matrix Engine"), group: t('Advanced Refinement') },
      { id: 'pawley_lebail', label: t("Pawley & Le Bail Fitting"), group: t('Advanced Refinement') },
      { id: 'rir', label: t("Reference Intensity Ratio (RIR)"), group: t('Advanced Refinement') },
      { id: 'rietveld', label: t('Rietveld Setup'), group: t('Advanced Sim') },
      { id: 'neutron', label: t('Neutron Diffraction'), group: t('Advanced Sim') },
      { id: 'magnetic', label: t('Magnetic Diffraction'), group: t('Advanced Sim') },
      { id: 'dl', label: t('PhaseID Neural Net'), group: t('AI Tools') },
      { id: 'image_analysis', label: t('Image Analysis'), group: t('AI Tools') },
      { id: 'image_gen', label: t('Scientific Illustrator'), group: t('AI Tools') },
      { id: 'python_export', label: t('Python Generator'), group: t('Advanced Sim') },
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
  }, [t, pythonFeaturesEnabled]);

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
        <LandingPage
          onEnter={(mode?: 'register' | 'login', targetModule?: Module) => {
            setAuthMode(mode || 'register');
            setHasEntered(true);
            if (targetModule) {
              setActiveModule(targetModule);
            }
          }}
          theme={theme}
          setTheme={setTheme}
          isRegistered={isRegistered}
          onSignOut={() => {
            localStorage.removeItem('xrd_user_registration');
            setIsRegistered(false);
            setHasEntered(false);
          }}
        />
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <RegistrationPage
        initialMode={authMode}
        onRegister={() => setIsRegistered(true)}
        onBack={() => setHasEntered(false)}
      />
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
      <FullAppTranslator />
      <div className={`${theme === 'light' ? '' : theme} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex h-screen ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in duration-700 transition-colors`}>
        
        {/* Sidebar Navigation */}
        <aside className={`${isSidebarPinned ? 'hidden md:flex w-72' : 'hidden'} flex-col ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'} border-r h-full shrink-0 z-20 shadow-2xl relative transition-all duration-300`}>
          <div className={`p-6 border-b ${theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black' : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50'} flex items-center gap-3 backdrop-blur-md group`}>
             <div className={`w-10 h-10 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_15px_rgba(255,0,255,0.5)]' : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/20'} rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative overflow-hidden`}>
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
               <span className="relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">λ</span>
             </div>
             <div>
               <span className={`font-black text-2xl italic tracking-tighter ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'} block leading-none transition-colors group-hover:text-indigo-400`}>
                 XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]' : 'text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]'}>Pro</span>
               </span>
               <span className={`text-[9px] ${theme === 'cyberpunk' ? 'text-cyber-blue' : 'text-slate-500'} font-black font-mono uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5`}>
                 <span className={`w-1 h-1 rounded-full ${theme === 'cyberpunk' ? 'bg-cyber-blue' : 'bg-indigo-500'} animate-pulse`} />
                 Advanced {t('Computational Suite')}
               </span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {Array.from(new Set(modules.map(m => m.group || ''))).map((group) => (
              <div key={group} className="space-y-2">
                <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
                  {group}
                </h3>
                <div className="space-y-1">
                  {modules.filter(m => m.group === group).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveModule(m.id);
                        playSynthTone('switch');
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative flex items-center gap-3 ${
                        activeModule === m.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {activeModule === m.id && (
                        <span className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                      )}
                      {getModuleIcon(m.id, activeModule === m.id)}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-3">
            <button
              id="export-pdf-report-btn"
              onClick={() => {
                playSynthTone('success');
                generatePdfReport();
              }}
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
        
        <SideSeekBar targetRef={mainContentRef} theme={theme} />

        <div className={`flex-1 flex flex-col h-full overflow-hidden ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
          {/* Top App Bar & Navigation Header */}
          <TopAppBar
            theme={theme}
            setTheme={setTheme}
            activeModule={activeModule}
            modules={modules}
            getModuleIcon={getModuleIcon}
            isNavigatorOpen={isNavigatorOpen}
            setIsNavigatorOpen={setIsNavigatorOpen}
            isSidebarPinned={isSidebarPinned}
            setIsSidebarPinned={setIsSidebarPinned}
            isExplained={isExplained}
            setIsExplained={setIsExplained}
            currentClockTime={currentClockTime}
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
          />

          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar relative">
            <div className="max-w-7xl mx-auto relative">
              {!isExplained ? (
                <ModuleIntro 
                  module={activeModule} 
                  onUnderstand={() => setIsExplained(true)} 
                />
              ) : (
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 items-start">
                      <div className="lg:col-span-4 space-y-6">
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
                        <BraggHistory 
                          history={braggHistory} 
                          onRestore={restoreHistory} 
                          onClear={clearHistory} 
                        />
                        
                        <div className="bg-slate-900 dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-800 dark:border-white/5 ring-1 ring-white/10">
                           <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Engine Data Link</span>
                             </div>
                             <button 
                               onClick={() => navigator.clipboard.writeText(JSON.stringify(braggJsonOutput, null, 2))}
                               className="text-[10px] text-white/40 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-md"
                             >
                               Copy Strict JSON
                             </button>
                           </div>
                           <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed h-48 scrollbar-thin scrollbar-thumb-slate-700">
                              {JSON.stringify(braggJsonOutput, null, 2)}
                           </pre>
                        </div>
                      </div>

                      <div className="lg:col-span-8 space-y-6">
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
                    </div>
                  )}

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
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          )}
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
          <AIChatSupport />

          {/* Footer Info Modal for App */}
          <FooterInfoModal 
            isOpen={!!appFooterModal}
            modalType={appFooterModal}
            onClose={() => setAppFooterModal(null)}
            isRTL={i18n.language === 'fa'}
            onActionNavigate={(modKey) => {
              setAppFooterModal(null);
              if (modKey) {
                setActiveModule(modKey as any);
              }
            }}
          />
          
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

          {/* User Activity & Telemetry Plugin */}
          <UserActivityPlugin
            isOpen={isActivityLedgerOpen}
            onClose={() => setIsActivityLedgerOpen(false)}
          />
        </div>
      </div>
    </div>
    </SettingsContext.Provider>
  );
};

export default App;
