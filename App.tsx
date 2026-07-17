
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { BraggInput } from './components/BraggInput';
import { ResultsTable } from './components/ResultsTable';
import { DiffractionChart } from './components/DiffractionChart';
import { DiffractionCompareModule } from './components/DiffractionCompareModule';
import { SelectionRulesModule } from './components/SelectionRulesModule';
import { ScherrerModule } from './components/ScherrerModule';
import { WilliamsonHallModule } from './components/WilliamsonHallModule';
import { IntegralBreadthModule } from './components/IntegralBreadthModule';
import { IntegralBreadthAdvancedModule } from './components/IntegralBreadthAdvancedModule';
import { WarrenAverbachModule } from './components/WarrenAverbachModule';
import { RietveldModule } from './components/RietveldModule';
import { NeutronModule } from './components/NeutronModule';
import { MagneticNeutronModule } from './components/MagneticNeutronModule';
import { DeepLearningModule } from './components/DeepLearningModule';
import { FWHMModule } from './components/FWHMModule';
import { PreferredOrientationModule } from './components/PreferredOrientationModule';
import { ImageAnalysisModule } from './components/ImageAnalysisModule';
import { ImageGenerationModule } from './components/ImageGenerationModule';
import { PythonExportModule } from './components/PythonExportModule';
import { MaterialDatabaseExplorer } from './components/MaterialDatabaseExplorer';

import { SettingsModule } from './components/SettingsModule';
import { ProfilePage } from './components/ProfilePage';
import { LearnModule } from './components/LearnModule';
import { AIChatSupport } from './components/AIChatSupport';
import { ModuleIntro } from './components/ModuleIntro';
import { LandingPage } from './components/LandingPage';
import { RegistrationPage } from './components/RegistrationPage';
import { SideSeekBar } from './components/SideSeekBar';
import LanguageSelector from './components/LanguageSelector';
import { BraggHistory } from './components/BraggHistory';
import { BraggVisualization } from './components/BraggVisualization';
import { LatticeEstimator } from './components/LatticeEstimator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsContext } from './components/SettingsContext';
import { PeriodicTableModule } from './components/PeriodicTableModule';
import { calculateBragg, parsePeakString } from './utils/physics';
import { BraggResult, BraggHistoryItem } from './types';
import { Zap, Terminal, Music, Languages, Palette, Hash, Sparkles, Volume2, Settings2, Check, FileDown, FastForward, X, RefreshCw, Activity, BookOpen, Grid, Database, User, Compass, Microscope, TrendingUp, Infinity, Network, Cpu, Orbit, Magnet, Brain, Image as ImageIcon, Sliders, Layers } from 'lucide-react';
import { playSynthTone } from './utils/sound';
import { generatePdfReport } from './utils/pdfGenerator';
import { useAuth, db, handleFirestoreError, OperationType } from './services/firebase';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { saveOfflineAnalysis, getOfflineAnalyses, getOfflineMaterials, saveOfflineMaterial, OfflineAnalysisResult, clearOfflineAnalyses } from './utils/offlineDb';
import { syncOfflineHelper } from './utils/materialsHelper';

type Module = 'bragg' | 'fwhm' | 'selection' | 'compare' | 'scherrer' | 'wh' | 'integral' | 'integral_adv' | 'wa' | 'preferred_orientation' | 'rietveld' | 'neutron' | 'magnetic' | 'dl' | 'image_analysis' | 'image_gen' | 'python_export' | 'learn' | 'profile' | 'settings' | 'database' | 'periodic_table';

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
    case 'integral':
      return <Infinity {...iconProps} />;
    case 'integral_adv':
      return <Sliders {...iconProps} />;
    case 'wa':
      return <Network {...iconProps} />;
    case 'preferred_orientation':
      return <Compass {...iconProps} />;
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

          const nameParts = defaultReg.name.trim().split(/\s+/);
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
  const [results, setResults] = useState<BraggResult[]>(savedState?.results ?? []);
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
    } catch (e) {
      console.error("IndexedDB stats refresh warn:", e);
    }
  };

  // Monitor online status and retrieve cached records
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOfflineData = async () => {
      try {
        const analyses = await getOfflineAnalyses();
        setOfflineAnalyses(analyses);
        const mats = await getOfflineMaterials();
        setCachedMaterialsCount(mats.length);
      } catch (err) {
        console.error("Failed to load IndexedDB data", err);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineHelper()
        .then(() => updateOfflineData())
        .catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync and fetch
    syncOfflineHelper()
      .then(() => updateOfflineData())
      .catch(console.error);

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
      clearInterval(interval);
    };
  }, [pythonReady]);

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
  const braggStateRef = useRef({ sampleId, wavelength, rawPeaks, rawHKL, results, materialName });

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
            // Assign a natural decreasing simulated default intensity (e.g. 100, 85, 70...) if none is provided
            const assignedIntensity = peakObj.intensity !== undefined 
              ? peakObj.intensity 
              : Math.max(10, 100 - (idx * 15));
            return { 
              ...res, 
              hkl: hklList[idx] || '', 
              intensity: assignedIntensity 
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
          sampleId: sampleId.trim() || undefined,
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
              const assignedIntensity = peakObj.intensity !== undefined 
                ? peakObj.intensity 
                : Math.max(10, 100 - (idx * 15));
              return { 
                ...res, 
                hkl: hklList[idx] || '', 
                intensity: assignedIntensity 
              } as BraggResult;
            }
            return null;
          })
          .filter((res): res is BraggResult => res !== null);

        if (computed.length > 0) {
          const newItem: BraggHistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            sampleId: set.sampleId.trim() || undefined,
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
    braggStateRef.current = { sampleId, wavelength, rawPeaks, rawHKL, results, materialName };
    // Keep xrd_bragg_current updated on-the-fly as well, but the formal autosave ticks periodically
    localStorage.setItem('xrd_bragg_current', JSON.stringify({
      sampleId,
      wavelength,
      rawPeaks,
      rawHKL,
      results,
      materialName
    }));
  }, [sampleId, wavelength, rawPeaks, rawHKL, results, materialName]);

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
      { id: 'integral', label: t('Integral Breadth'), group: t('Size & Strain') },
      { id: 'integral_adv', label: t('IB Advanced (W-H)'), group: t('Size & Strain') },
      { id: 'wa', label: t('Warren-Averbach'), group: t('Size & Strain') },
      { id: 'preferred_orientation', label: t('Preferred Orientation'), group: t('Fundamentals') },
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

  const isRTL = i18n.language === 'he' || i18n.language === 'fa' || i18n.language === 'ar';

  return (
    <SettingsContext.Provider value={{
      precision,
      zeroShift,
      sampleDisplacement,
      goniometerRadius,
      soundEnabled,
      animationsEnabled
    }}>
      <div className={`${theme === 'light' ? '' : theme} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex h-screen ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in duration-700 transition-colors`}>
        
        {/* Sidebar Navigation */}
        <aside className={`hidden md:flex w-72 flex-col ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'} border-r h-full shrink-0 z-20 shadow-2xl relative transition-colors`}>
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
            {[t('Fundamentals'), t('Size & Strain'), t('Advanced Sim'), t('AI Tools'), t('Intelligence')].map((group) => (
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
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              <div className="mb-1 font-bold uppercase tracking-widest">v2.5.0 • {t('Lab Active')}</div>
              <div className="opacity-60">{t('Designed by')} Ali Zerehsaz</div>
            </div>
          </div>
        </aside>
        
        <SideSeekBar targetRef={mainContentRef} theme={theme} />

        <div className={`flex-1 flex flex-col h-full overflow-hidden ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
          <div className={`md:hidden ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30' : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/85 dark:border-white/5'} border-b px-4 py-3 flex flex-col gap-2.5 z-20 shrink-0 shadow-sm transition-colors`}>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className={`w-8 h-8 ${theme === 'cyberpunk' ? 'bg-cyber-pink' : 'bg-gradient-to-tr from-indigo-600 to-violet-500'} rounded-lg flex items-center justify-center text-white font-semibold text-lg shadow-sm shadow-indigo-500/20`}>
                  λ
                </div>
                <span className={`font-bold text-lg tracking-tight ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'} leading-none`}>
                   XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400 font-bold'}>Pro</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                 <LanguageSelector compact={true} />
                 <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className={`block w-[80px] rounded-lg border ${theme !== 'light' && theme !== 'dark' ? 'bg-black border-slate-700 text-white' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'} py-1 px-1.5 text-[10px] outline-none font-medium uppercase tracking-wider bg-transparent hover:border-slate-400 transition-colors cursor-pointer`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="cyberpunk">Cyber</option>
                  <option value="terminal">Term</option>
                  <option value="synthwave">Synth</option>
                  <option value="dracula">Drac</option>
                  <option value="oceanic">Ocean</option>
                  <option value="gruvbox">Gruv</option>
                  <option value="monokai">Mono</option>
                </select>
              </div>
            </div>
            <div className="w-full">
                <select
                  value={activeModule}
                  onChange={(e) => {
                    setActiveModule(e.target.value as Module);
                    playSynthTone('switch');
                  }}
                  className={`block w-full rounded-xl border ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'} py-2 px-3 text-xs outline-none font-medium shadow-inner appearance-none bg-no-repeat transition-all`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundPosition: `right 0.75rem center`,
                    backgroundSize: `1em 1em`
                  }}
                >
                  {Array.from(new Set(modules.map(m => m.group || ''))).map(group => (
                    <optgroup key={group} label={group} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                      {modules.filter(m => (m.group || '') === group).map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
            </div>
          </div>

          {/* Desktop Top Header Bar containing context-aware tools, help and theme guides */}
          <header className={`hidden md:flex items-center px-6 lg:px-8 py-2 border-b z-20 font-sans transition-all duration-300 shrink-0 ${
            theme === 'cyberpunk'
              ? 'bg-black border-cyber-accent/30 text-cyber-accent shadow-md'
              : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-slate-200/50 dark:border-white/5 shadow-sm'
          }`}>
            
            {/* Left: Title & Badge */}
            <div className="flex-1 flex items-center gap-3 justify-start overflow-hidden">
              <div className="flex items-center gap-2">
                <span className={`h-4 w-1 rounded-full ${
                  theme === 'cyberpunk' ? 'bg-cyber-accent animate-pulse' : 'bg-indigo-500'
                }`} />
                {getModuleIcon(activeModule, true)}
                <span className={`text-sm font-bold tracking-tight shrink-0 ${
                  theme === 'cyberpunk' ? 'text-cyber-accent font-black uppercase tracking-wider' : 'text-slate-900 dark:text-white'
                }`}>
                  {modules.find(m => m.id === activeModule)?.label || activeModule}
                </span>
              </div>
            </div>
            
            {/* Center: Theoretical Guide */}
            <div className="flex-1 flex justify-center items-center opacity-90 hover:opacity-100 transition-all duration-200 whitespace-nowrap">
              {activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings' && (
                <button
                  onClick={() => {
                    setIsExplained(false);
                    playSynthTone('switch');
                  }}
                  className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wide cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 shadow-sm ${
                    theme === 'cyberpunk'
                      ? 'border-cyber-accent text-cyber-accent hover:bg-cyber-accent/10 bg-black'
                      : 'border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Open the mathematical and theoretical introduction for this module"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>{t('Guide', 'Guide')}</span>
                </button>
              )}
            </div>
            
            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-3 shrink-0">
              
              {/* Grouped System Tools & Status Dropdown */}
              <div className="relative" ref={systemDropdownRef}>
                <button
                  onClick={() => {
                    setShowSystemDropdown(!showSystemDropdown);
                    playSynthTone('switch');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    theme === 'cyberpunk'
                      ? 'border-cyber-accent text-cyber-accent bg-black hover:bg-cyber-accent/10'
                      : 'border-slate-200/60 dark:border-white/5 bg-slate-100/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 shadow-sm'
                  }`}
                  title="Click to manage system settings, logs and offline databases"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t('System', 'System')}</span>
                  {(!isOnline || !pythonReady) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {showSystemDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-64 rounded-xl border p-3 space-y-2.5 shadow-2xl z-30 ${
                        theme === 'cyberpunk'
                          ? 'bg-black border-cyber-accent text-cyber-accent shadow-[0_0_25px_rgba(0,255,255,0.2)]'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-1.5">
                        {t('System & Integration', 'System & Integration')}
                      </div>

                      {/* Python Integration Row */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${pythonReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span className="font-semibold">{t('Python Engine', 'Python Engine')}</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowPythonStatus(true);
                            setShowSystemDropdown(false);
                            playSynthTone('switch');
                          }}
                          className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 text-[10px] transition-all"
                        >
                          {pythonReady ? t('Inspect', 'Inspect') : t('Init', 'Init')}
                        </button>
                      </div>

                      {/* Offline / Caching Sync Row */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span className="font-semibold">{t('IndexedDB Sync', 'IndexedDB Sync')}</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowOfflineHub(true);
                            refreshOfflineAnalyses();
                            setShowSystemDropdown(false);
                            playSynthTone('switch');
                          }}
                          className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 text-[10px] transition-all"
                        >
                          {isOnline ? t('Sync Hub', 'Sync Hub') : t('Offline Hub', 'Offline Hub')}
                        </button>
                      </div>

                      {/* Auto-Skip Intros Row */}
                      {activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings' && (
                        <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-slate-100 dark:border-white/5">
                          <span className="font-semibold">{t('Skip Module Intros', 'Skip Intros')}</span>
                          <button
                            onClick={() => {
                              const nextVal = !skipIntros;
                              setSkipIntros(nextVal);
                              localStorage.setItem('xrd_skip_intros', nextVal.toString());
                              playSynthTone('switch');
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              skipIntros 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                          >
                            {skipIntros ? t('Enabled', 'Enabled') : t('Disabled', 'Disabled')}
                          </button>
                        </div>
                      )}

                      {/* Shortcuts Row */}
                      <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-slate-100 dark:border-white/5">
                        <span className="font-semibold">{t('Keyboard Hotkeys', 'Hotkeys')}</span>
                        <button
                          onClick={() => {
                            setShowShortcutsModal(true);
                            setShowSystemDropdown(false);
                            playSynthTone('switch');
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-[10px] transition-all flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Cmd+/</span>
                        </button>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <LanguageSelector compact={true} />

              <div className="flex items-center">
                <select
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value as any);
                    playSynthTone('switch');
                  }}
                  className={`block rounded-lg border ${theme !== 'light' && theme !== 'dark' ? 'bg-black border-slate-700 text-white' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300'} py-1 px-2 text-[10px] outline-none font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all`}
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                  <option value="cyberpunk">⚡ Cyber</option>
                  <option value="terminal">📟 Term</option>
                  <option value="synthwave">🌆 Synth</option>
                  <option value="dracula">🦇 Drac</option>
                  <option value="oceanic">🌊 Ocean</option>
                  <option value="gruvbox">📦 Gruvbox</option>
                  <option value="monokai">🎨 Monokai</option>
                </select>
              </div>
            </div>
            
          </header>

          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar relative">
            <div className="max-w-7xl mx-auto">
              {!isExplained ? (
                <ModuleIntro 
                  module={activeModule} 
                  onUnderstand={() => setIsExplained(true)} 
                />
              ) : (
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
                        <DiffractionChart results={results} materialName={materialName} />
                        <ResultsTable results={results} />
                        <LatticeEstimator results={results} />
                      </div>
                    </div>
                  )}

                  {activeModule === 'fwhm' && <FWHMModule />}
                  {activeModule === 'selection' && <SelectionRulesModule />}
                  {activeModule === 'compare' && (
                    <DiffractionCompareModule 
                      activeResults={results} 
                      activeMaterialName={materialName} 
                    />
                  )}
                  {activeModule === 'scherrer' && <ScherrerModule />}
                  {activeModule === 'wh' && <WilliamsonHallModule />}
                  {activeModule === 'integral' && <IntegralBreadthModule />}
                  {activeModule === 'integral_adv' && <IntegralBreadthAdvancedModule />}
                  {activeModule === 'wa' && <WarrenAverbachModule />}
                  {activeModule === 'preferred_orientation' && <PreferredOrientationModule />}
                  {activeModule === 'rietveld' && <RietveldModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                  {activeModule === 'neutron' && <NeutronModule />}
                  {activeModule === 'magnetic' && <MagneticNeutronModule />}
                  {activeModule === 'dl' && <DeepLearningModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                  {activeModule === 'image_analysis' && <ImageAnalysisModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
                  {activeModule === 'image_gen' && <ImageGenerationModule pythonFeaturesEnabled={pythonFeaturesEnabled} />}
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
                    />
                  )}
                </ErrorBoundary>
              )}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                XRD-Calc Pro {t('Laboratory Environment')} • {t('Designed by')} Ali Zerehsaz
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-2xl mx-auto italic leading-relaxed">
                {t('Disclaimer')}
              </p>
            </div>
          </main>
          <AIChatSupport />
          
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
        </div>
      </div>
    </div>
    </SettingsContext.Provider>
  );
};

export default App;
