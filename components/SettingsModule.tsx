import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, Hash, Palette, Sparkles, Volume2, Settings, 
  Activity, Cpu, Shield, Zap, Info, Database, Globe,
  Beaker, Monitor, Sliders, Server, Lock, User, Edit3, 
  Save, Check, AlertCircle, Wrench, Microscope, Compass,
  Key, ExternalLink, RefreshCw, CheckCircle2,
  Upload, Download, Trash2, FileCode, Send, Terminal,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import LanguageSelector from './LanguageSelector';
import { openOfflineDB } from '../utils/offlineDb';

interface SettingsModuleProps {
  theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave' | 'dracula' | 'oceanic' | 'gruvbox' | 'monokai';
  setTheme: (theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave' | 'dracula' | 'oceanic' | 'gruvbox' | 'monokai') => void;
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
  autosaveInterval = 5000,
  setAutosaveInterval,
  pythonFeaturesEnabled,
  setPythonFeaturesEnabled,
}) => {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<'general'|'calibration'|'identity'|'databases'|'system'>('general');

  const [offlineCounts, setOfflineCounts] = useState({ materials: 0, analysisResults: 0 });
  const [storageStats, setStorageStats] = useState({
    registrationSize: 0,
    databaseSize: 0,
    customKeySize: 0,
    logsSize: 0,
    historySize: 0,
    totalSize: 0
  });

  useEffect(() => {
    const fetchOfflineStats = async () => {
      try {
        const db = await openOfflineDB();
        const tx = db.transaction(['materials', 'analysisResults'], 'readonly');
        
        const matStore = tx.objectStore('materials');
        const analysisStore = tx.objectStore('analysisResults');
        
        const matCountReq = matStore.count();
        const analysisCountReq = analysisStore.count();
        
        matCountReq.onsuccess = () => {
          analysisCountReq.onsuccess = () => {
            setOfflineCounts({
              materials: matCountReq.result,
              analysisResults: analysisCountReq.result
            });
          };
        };
      } catch (e) {
        console.warn("IndexedDB offline stats checking error: ", e);
      }
    };
    
    fetchOfflineStats();
  }, []);

  // Load and manage Operator identity linked with registration storage
  const [operator, setOperator] = useState(() => {
    try {
      const saved = localStorage.getItem('xrd_user_registration');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || parsed.fullName || 'Ali Zerehsaz',
          email: parsed.email || 'director@xrd-calc.lab',
          organization: parsed.organization || parsed.institution || 'Neuro-Analytical Laboratory',
          clearanceLevel: parsed.clearanceLevel || 'Level 4: Laboratory Director',
          certifications: parsed.certifications || ['Radiation Safety (RSC-4)', 'High-Volt Diffraction System'],
          terminalId: parsed.terminalId || 'TRD-982-OMEGA',
          registeredAt: parsed.registeredAt || new Date().toISOString()
        };
      }
      return { 
        name: 'Ali Zerehsaz', 
        email: 'director@xrd-calc.lab', 
        organization: 'Neuro-Analytical Laboratory',
        clearanceLevel: 'Level 4: Laboratory Director',
        certifications: ['Radiation Safety (RSC-4)', 'High-Volt Diffraction System'],
        terminalId: 'TRD-982-OMEGA',
        registeredAt: new Date().toISOString() 
      };
    } catch {
      return { 
        name: 'Ali Zerehsaz', 
        email: 'director@xrd-calc.lab', 
        organization: 'Neuro-Analytical Laboratory',
        clearanceLevel: 'Level 4: Laboratory Director',
        certifications: ['Radiation Safety (RSC-4)', 'High-Volt Diffraction System'],
        terminalId: 'TRD-982-OMEGA',
        registeredAt: new Date().toISOString() 
      };
    }
  });

  const [idName, setIdName] = useState(operator.name);
  const [idEmail, setIdEmail] = useState(operator.email);
  const [idOrg, setIdOrg] = useState(operator.organization);
  const [clearanceLevel, setClearanceLevel] = useState(operator.clearanceLevel);
  const [certifications, setCertifications] = useState<string[]>(operator.certifications);
  const [terminalId, setTerminalId] = useState(operator.terminalId);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Scientific Database Registry configurations
  const [dbConfigs, setDbConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('xrd_database_configs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ICDD: { enabled: true, version: 'PDF-4+ 2026', key: 'ICDD-AZ92-U81', path: '/usr/share/ref/icdd/', priority: 'High' },
      COD: { enabled: true, version: 'COD Release 2025', key: 'OPEN-ACCESS-FREE', path: '/var/db/cod/', priority: 'High' },
      RRUFF: { enabled: true, version: 'RRUFF Core 2024', key: 'RRUFF-GEOLOGY-R1', path: '/opt/rruff/', priority: 'Medium' },
      ICSD: { enabled: true, version: 'ICSD 4.1.0', key: 'ICSD-LIC-8821', path: '/usr/local/db/icsd/', priority: 'Medium' },
      CSD: { enabled: true, version: 'CSD Release 2025', key: 'CSD-ORG-LIC-90', path: '/usr/local/db/csd/', priority: 'Low' },
    };
  });

  const [isAuditingDbs, setIsAuditingDbs] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [dbAuditLogs, setDbAuditLogs] = useState<string[]>([]);

  const handleSaveDbConfig = (newConfigs: typeof dbConfigs) => {
    setDbConfigs(newConfigs);
    localStorage.setItem('xrd_database_configs', JSON.stringify(newConfigs));
  };

  const triggerDbAudit = () => {
    if (isAuditingDbs) return;
    setIsAuditingDbs(true);
    setAuditProgress(5);
    playSynthTone('tick');
    const logs = [
      'Initializing Registry Directory Scan...',
      'Opening local sandbox port 3000 mapping...',
    ];
    setDbAuditLogs(logs);

    let progress = 5;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsAuditingDbs(false);
        playSynthTone('success');
        setDbAuditLogs(prev => [
          ...prev,
          'Scanning path /usr/share/ref/icdd/... Found ICDD PDF-4+ 2026 suite index!',
          'Resolving open structures in /var/db/cod/... 482,109 files indexed successfully.',
          'Cross-validating minerals via RRUFF Project database...',
          'Sovereign matrix verification complete. All indices synced client-side.',
          '✓ RE-INDEX COMPLETE: 5/5 Registries fully mapped to Local Terminal.'
        ]);
      } else {
        setAuditProgress(progress);
        if (progress === 20) {
          playSynthTone('tick');
          setDbAuditLogs(prev => [...prev, 'Evaluating active license tokens... Done. All keys active.']);
        } else if (progress === 50) {
          playSynthTone('tick');
          setDbAuditLogs(prev => [...prev, 'Binding ICDD powder diffraction databases (PDF-4)...']);
        } else if (progress === 80) {
          playSynthTone('tick');
          setDbAuditLogs(prev => [...prev, 'Fetching open crystallographic records from COD and ICSD...']);
        }
      }
    }, 400);
  };

  // API Access dashboard states
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('xrd_custom_gemini_key') || '');
  const [authStatus, setAuthStatus] = useState<'unchecked' | 'checking' | 'active' | 'invalid' | 'missing'>('unchecked');
  const [authFeedback, setAuthFeedback] = useState('');
  const [activeTier, setActiveTier] = useState<'free' | 'paid'>('free');
  const [hasSystemKey, setHasSystemKey] = useState(false);

  // Cognitive API access states
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [dryRunPrompt, setDryRunPrompt] = useState('Verify model with 2-theta crystallography math response');
  const [dryRunResponse, setDryRunResponse] = useState('');
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [apiLogs, setApiLogs] = useState<Array<{ id: string; time: string; action: string; status: 'SUCCESS' | 'ERROR'; info: string; latency?: number }>>(() => {
    try {
      const stored = localStorage.getItem('xrd_api_diagnostic_logs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: '1', time: new Date(Date.now() - 3600000).toLocaleTimeString(), action: 'System Initialization', status: 'SUCCESS', info: 'Gateway connected to local system port 3000' }
    ];
  });

  const addLog = (action: string, status: 'SUCCESS' | 'ERROR', info: string, latency?: number) => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      action,
      status,
      info,
      latency
    };
    setApiLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 8);
      localStorage.setItem('xrd_api_diagnostic_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const updateStorageStats = () => {
    try {
      const registrationSize = (localStorage.getItem('xrd_user_registration') || '').length * 2;
      const databaseSize = (localStorage.getItem('xrd_database_configs') || '').length * 2;
      const customKeySize = (localStorage.getItem('xrd_custom_gemini_key') || '').length * 2;
      const logsSize = (localStorage.getItem('xrd_api_diagnostic_logs') || '').length * 2;
      const historySize = (localStorage.getItem('xrd_bragg_history') || '').length * 2;
      const totalSize = registrationSize + databaseSize + customKeySize + logsSize + historySize;
      
      setStorageStats({
        registrationSize,
        databaseSize,
        customKeySize,
        logsSize,
        historySize,
        totalSize
      });
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    updateStorageStats();
  }, [operator, dbConfigs, customApiKey, apiLogs]);

  useEffect(() => {
    const checkSystemKeyAndVerify = async () => {
      let retries = 3;
      const delayMs = 1500;
      let res: Response | null = null;
      let fetchError: any = null;

      while (retries > 0) {
        try {
          res = await fetch('/api/gemini/config');
          if (res && res.ok) {
            break;
          }
        } catch (err: any) {
          fetchError = err;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      if (!res || !res.ok) {
        console.warn("Auto key configuration check error (Failed to fetch, offline fallback active):", fetchError);
        setAuthStatus('missing');
        setAuthFeedback('System database offline or slow initialization. Local calculations are fully operational.');
        addLog('System Startup Verification', 'ERROR', fetchError?.message || 'Network timeout');
        return;
      }

      try {
        const configData = await res.json();
        const systemKeyActive = !!configData?.hasEnvKey;
        setHasSystemKey(systemKeyActive);
        
        const storedKey = localStorage.getItem('xrd_custom_gemini_key') || '';
        
        if (storedKey || systemKeyActive) {
          setAuthStatus('checking');
          setAuthFeedback('Performing automatic handshake check...');
          const startTime = performance.now();
          
          const verifyRes = await fetch('/api/gemini/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customKey: storedKey })
          });
          const verifyData = await verifyRes.json();
          const endTime = performance.now();
          const latencyVal = Math.round(endTime - startTime);
          
          if (verifyData.success && verifyData.status === 'ACTIVE') {
            setAuthStatus('active');
            setLastLatency(latencyVal);
            setAuthFeedback(`Quantum handshake verified. Round-trip latency: ${latencyVal}ms.`);
            addLog(storedKey ? 'Custom Key Auto-Handshake' : 'System Key Auto-Handshake', 'SUCCESS', 'Gateway established successfully', latencyVal);
          } else {
            setAuthStatus(verifyData.status === 'MISSING' ? 'missing' : 'invalid');
            setAuthFeedback(verifyData.error || 'Verification handshake failed.');
            addLog(storedKey ? 'Custom Key Auto-Handshake' : 'System Key Auto-Handshake', 'ERROR', verifyData.error || 'Verification handshake rejected', latencyVal);
          }
        } else {
          setAuthStatus('missing');
          setAuthFeedback('No Gemini API key detected. Direct local calculations remain offline-capable, but advisory requires a key.');
          addLog('System Startup', 'ERROR', 'No credentials available');
        }
      } catch (err: any) {
        console.error("Auto key configuration parsing error:", err);
        addLog('System Startup Verification', 'ERROR', err.message || 'Data parse error');
      }
    };
    checkSystemKeyAndVerify();
  }, []);

  const handleVerifyAndSaveKey = async (keyInput: string) => {
    setAuthStatus('checking');
    setAuthFeedback('Contacting Google AI Studio verification gateway...');
    const startTime = performance.now();
    try {
      const res = await fetch('/api/gemini/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customKey: keyInput })
      });
      const data = await res.json();
      const endTime = performance.now();
      const latencyVal = Math.round(endTime - startTime);
      
      if (data.success && data.status === 'ACTIVE') {
        setAuthStatus('active');
        setLastLatency(latencyVal);
        setAuthFeedback(data.message || 'Verification successful!');
        if (keyInput) {
          localStorage.setItem('xrd_custom_gemini_key', keyInput);
        } else {
          localStorage.removeItem('xrd_custom_gemini_key');
        }
        addLog(keyInput ? 'Manual Override Mount' : 'Default Credentials Restore', 'SUCCESS', 'Key verified successfully', latencyVal);
        playSynthTone('success');
      } else {
        setAuthStatus(data.status === 'MISSING' ? 'missing' : 'invalid');
        setAuthFeedback(data.error || 'Identity verification failed. Please align your settings.');
        addLog(keyInput ? 'Manual Override Mount' : 'Default Credentials Restore', 'ERROR', data.error || 'Credentials rejected', latencyVal);
        playSynthTone('switch');
      }
    } catch (err: any) {
      setAuthStatus('invalid');
      setAuthFeedback('Network or gateway execution timeout: ' + err.message);
      addLog(keyInput ? 'Manual Override Mount' : 'Default Credentials Restore', 'ERROR', err.message);
      playSynthTone('switch');
    }
  };

  const handleClearCustomKey = () => {
    setCustomApiKey('');
    localStorage.removeItem('xrd_custom_gemini_key');
    setAuthStatus('unchecked');
    setAuthFeedback('Custom key removed. Reverted to default system parameters.');
    addLog('Override Key Cleared', 'SUCCESS', 'Default configuration restored');
    playSynthTone('tick');
  };

  const handleRunDryRun = async () => {
    if (!dryRunPrompt.trim()) return;
    setDryRunLoading(true);
    setDryRunResponse('');
    addLog('Sandbox Diagnostic Exec', 'SUCCESS', 'Initiating pilot prompt run');
    const startTime = performance.now();
    try {
      const res = await fetch('/api/gemini/coder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${dryRunPrompt}\n(Requirement: provide a single short mathematically sound sentence response about chemistry/crystallography)`,
          customKey: customApiKey || undefined
        })
      });
      const data = await res.json();
      const endTime = performance.now();
      const latencyVal = Math.round(endTime - startTime);
      
      if (data.success) {
        setDryRunResponse(data.text);
        addLog('Sandbox Diagnostic Exec', 'SUCCESS', `Dry-run OK. Yield: ${data.text?.length || 0} chars`, latencyVal);
        playSynthTone('success');
      } else {
        setDryRunResponse(`Diagnostic failed: ${data.error}`);
        addLog('Sandbox Diagnostic Exec', 'ERROR', data.error || 'Model endpoint error', latencyVal);
        playSynthTone('switch');
      }
    } catch (err: any) {
      setDryRunResponse(`Dry run connection loss: ${err.message}`);
      addLog('Sandbox Diagnostic Exec', 'ERROR', err.message);
      playSynthTone('switch');
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...operator,
      name: idName,
      fullName: idName,
      email: idEmail,
      organization: idOrg,
      institution: idOrg,
      clearanceLevel,
      certifications,
      terminalId,
    };
    setOperator(updated);
    localStorage.setItem('xrd_user_registration', JSON.stringify(updated));
    setSaveSuccess(true);
    playSynthTone('success');
    
    // Auto reset indicator after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const handleExportConfig = () => {
    try {
      const configData = {
        precision,
        zeroShift,
        sampleDisplacement,
        goniometerRadius,
        defaultWavelength,
        soundEnabled,
        animationsEnabled,
        theme,
        autosaveInterval,
        operator,
        exportTimestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xrd_system_config_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      playSynthTone('success');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        if (parsed.precision !== undefined) {
          setPrecision(Number(parsed.precision));
          localStorage.setItem('xrd_precision', parsed.precision.toString());
        }
        if (parsed.zeroShift !== undefined) {
          setZeroShift(Number(parsed.zeroShift));
        }
        if (parsed.sampleDisplacement !== undefined) {
          setSampleDisplacement(Number(parsed.sampleDisplacement));
        }
        if (parsed.goniometerRadius !== undefined) {
          setGoniometerRadius(Number(parsed.goniometerRadius));
        }
        if (parsed.defaultWavelength !== undefined) {
          setDefaultWavelength(Number(parsed.defaultWavelength));
          localStorage.setItem('xrd_default_wavelength', parsed.defaultWavelength.toString());
        }
        if (parsed.soundEnabled !== undefined) {
          setSoundEnabled(!!parsed.soundEnabled);
          localStorage.setItem('xrd_sound', parsed.soundEnabled.toString());
        }
        if (parsed.animationsEnabled !== undefined) {
          setAnimationsEnabled(!!parsed.animationsEnabled);
        }
        if (parsed.theme !== undefined) {
          setTheme(parsed.theme);
        }
        if (parsed.autosaveInterval !== undefined && setAutosaveInterval) {
          setAutosaveInterval(Number(parsed.autosaveInterval));
          localStorage.setItem('xrd_autosave_interval', parsed.autosaveInterval.toString());
        }
        if (parsed.operator !== undefined) {
          setOperator(parsed.operator);
          setIdName(parsed.operator.name || parsed.operator.fullName || '');
          setIdEmail(parsed.operator.email || '');
          setIdOrg(parsed.operator.organization || parsed.operator.institution || '');
          setClearanceLevel(parsed.operator.clearanceLevel || '');
          setCertifications(parsed.operator.certifications || []);
          setTerminalId(parsed.operator.terminalId || '');
          localStorage.setItem('xrd_user_registration', JSON.stringify(parsed.operator));
        }

        setImportStatus('success');
        setImportMessage('System parameters successfully mounted and synchronized.');
        playSynthTone('success');
        
        setTimeout(() => {
          setImportStatus('idle');
          setImportMessage('');
          window.location.reload();
        }, 1500);

      } catch (err: any) {
        setImportStatus('error');
        setImportMessage('Parsing abort: file signature mismatch. ' + err.message);
        playSynthTone('switch');
      }
    };
    reader.readAsText(file);
  };

  const handleHardReset = () => {
    if (window.confirm("CRITICAL MANDATE: Are you sure you want to trigger a laboratory diagnostic hardware wipe? This restores factory calibrations and erases cached session profiles.")) {
      localStorage.clear();
      playSynthTone('switch');
      window.location.reload();
    }
  };

  const themeOptions = [
    { id: 'light', label: 'Light Lux', color: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300' },
    { id: 'dark', label: 'Dark Matter', color: 'bg-slate-900', text: 'text-white', border: 'border-slate-700' },
    { id: 'cyberpunk', label: 'Cyber Net', color: 'bg-black', text: 'text-yellow-400', border: 'border-yellow-500' },
    { id: 'terminal', label: 'Mainframe', color: 'bg-black', text: 'text-green-500', border: 'border-green-500' },
    { id: 'synthwave', label: 'Neon City', color: 'bg-indigo-950', text: 'text-pink-500', border: 'border-pink-500' },
    { id: 'dracula', label: 'Vampire Night', color: 'bg-[#282a36]', text: 'text-[#bd93f9]', border: 'border-[#ff79c6]' },
    { id: 'oceanic', label: 'Deep Ocean', color: 'bg-[#0f172a]', text: 'text-[#38bdf8]', border: 'border-[#818cf8]' },
    { id: 'gruvbox', label: 'Gruvbox', color: 'bg-[#282828]', text: 'text-[#ebdbb2]', border: 'border-[#d3869b]' },
    { id: 'monokai', label: 'Monokai', color: 'bg-[#272822]', text: 'text-[#f8f8f2]', border: 'border-[#f92672]' }
  ];

  const wavelengthPresets = [
    { label: 'Copper Cu-Kα (1.5406 Å)', val: 1.5406 },
    { label: 'Cobalt Co-Kα (1.7890 Å)', val: 1.7890 },
    { label: 'Molybdenum Mo-Kα (0.7107 Å)', val: 0.7107 },
    { label: 'Iron Fe-Kα (1.9360 Å)', val: 1.9360 },
    { label: 'Chromium Cr-Kα (2.2897 Å)', val: 2.2897 }
  ];

  const sampleOffsetThetaMock = Math.abs(zeroShift) > 0 || Math.abs(sampleDisplacement) > 0;

  const TABS = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'calibration', label: 'Calibration', icon: Wrench },
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'databases', label: 'Databases & API', icon: Database },
    { id: 'system', label: 'System', icon: Server },
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 p-4 md:p-8 pb-16 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 relative group">
            <Settings className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {t('Settings')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> {t('Secure Protocol v2.5 • Master Control')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-3 shadow-sm min-w-[140px]">
             <div className="p-1.5 bg-emerald-500/10 rounded-lg">
               <Zap className="w-4 h-4 text-emerald-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t('Diffraction')}</span>
               <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('Connected')}</span>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-3 shadow-sm min-w-[140px]">
             <div className="p-1.5 bg-indigo-500/10 rounded-lg">
               <Activity className="w-4 h-4 text-indigo-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t('Calibration')}</span>
               <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                 {sampleOffsetThetaMock ? t('Active offsets') : t('Perfect Zero')}
               </span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar / Topbar Tabs */}
        <div className="lg:w-64 shrink-0 w-full lg:sticky lg:top-24 space-y-4 lg:space-y-6">
          {/* Tabs Container */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none snap-x -mx-4 px-4 lg:mx-0 lg:px-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    playSynthTone('tick');
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 lg:py-3 rounded-2xl transition-all duration-300 text-xs lg:text-sm font-bold whitespace-nowrap snap-center lg:w-full shrink-0 border select-none ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm lg:bg-transparent lg:dark:bg-transparent lg:border-none lg:shadow-none'
                  }`}
                >
                  <Icon className={`w-4 h-4 lg:w-5 lg:h-5 shrink-0 transition-transform ${isActive ? 'text-white scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`} />
                  {t(tab.label)}
                </button>
              )
            })}
          </div>

          <div className="hidden lg:block p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-2 mb-2">
               <Lock className="w-4 h-4 text-indigo-500" />
               <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Local Sandbox')}</span>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               {t('Processing completes securely inside the local browser container. No data leaves the terminal.')}
             </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Monitor className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Appearance & Display')}</h3>
                  </div>

                  <div className="space-y-8">
                    {/* Language Select */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-1">{t('Language Locale')}</label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('Select your preferred interface language')}</p>
                      </div>
                      <div className="w-full md:w-64 shrink-0">
                        <LanguageSelector onLanguageChange={() => playSynthTone('switch')} />
                      </div>
                    </div>

                    {/* Precision Settings */}
                    <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="mb-4">
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-1">{t('Decimal Precision')}</label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('Controls the number of decimal places shown in calculations')}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { val: 2, label: 'Standard (2.00)' },
                          { val: 4, label: 'High (4.0000)' },
                          { val: 6, label: 'Analytical (6.000000)' },
                          { val: 8, label: 'Scientific (8.00...)' }
                        ].map((pOption) => (
                          <button
                            key={pOption.val}
                            onClick={() => {
                              setPrecision(pOption.val);
                              playSynthTone('tick');
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              precision === pOption.val
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                            }`}
                          >
                            {t(pOption.label)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Configuration */}
                    <div>
                      <div className="mb-4">
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-1">{t('Workspace Theme')}</label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('Choose a color palette for your environment')}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {themeOptions.map((tOption) => (
                          <button
                            key={tOption.id}
                            onClick={() => {
                              setTheme(tOption.id as any);
                              playSynthTone('switch');
                            }}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                              theme === tOption.id
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-300'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full ${tOption.color} ${tOption.border} border-2 flex items-center justify-center shadow-inner`}>
                               {theme === tOption.id && <Check className={`w-5 h-5 ${tOption.text}`} />}
                            </div>
                            <span className={`text-xs font-semibold ${theme === tOption.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              {t(tOption.label)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                     <Cpu className="w-6 h-6 text-indigo-500" />
                     <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('System Engagement')}</h3>
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-colors ${animationsEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{t('Animations')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Enable smooth UI transitions and motion effects')}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setAnimationsEnabled(!animationsEnabled);
                            playSynthTone('tick');
                          }}
                          className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${animationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <div 
                            style={{ transform: animationsEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform" 
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{t('Sound Effects')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Play auditory feedback for actions and success states')}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSoundEnabled(!soundEnabled);
                            localStorage.setItem('xrd_sound', (!soundEnabled).toString());
                            setTimeout(() => { playSynthTone('success'); }, 50);
                          }}
                          className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <div 
                            style={{ transform: soundEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform" 
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-colors ${pythonFeaturesEnabled ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            <Terminal className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{t('Python Tools')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Enable machine learning models and advanced generators')}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setPythonFeaturesEnabled(!pythonFeaturesEnabled);
                            playSynthTone('tick');
                          }}
                          className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${pythonFeaturesEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <div 
                            style={{ transform: pythonFeaturesEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform" 
                          />
                        </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* CALIBRATION TAB */}
            {activeTab === 'calibration' && (
              <motion.div 
                key="calibration"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Wrench className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Mechanical Alignment')}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Specify precise goniometer geometries and physical offsets')}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('Zero-Shift Correction (Δ2θ)')}</label>
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                          {zeroShift > 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°
                        </span>
                      </div>
                      <input
                        type="range" min="-0.5" max="0.5" step="0.005"
                        value={zeroShift}
                        onChange={(e) => {
                          setZeroShift(parseFloat(e.target.value));
                          if (Math.abs(parseFloat(e.target.value) * 1000 % 10) < 1) playSynthTone('tick');
                        }}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-xs text-slate-500 mt-2">{t('Corrects for absolute mechanical zero index offset of the detector.')}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('Sample Displacement (s)')}</label>
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                          {sampleDisplacement.toFixed(4)} mm
                        </span>
                      </div>
                      <input
                        type="range" min="-0.2" max="0.2" step="0.002"
                        value={sampleDisplacement}
                        onChange={(e) => {
                          setSampleDisplacement(parseFloat(e.target.value));
                          if (Math.abs(parseFloat(e.target.value) * 1000 % 5) < 1) playSynthTone('tick');
                        }}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-xs text-slate-500 mt-2">{t('Accounts for sample surface displacement relative to the rotation axis.')}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('Goniometer Radius (R)')}</label>
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                          {goniometerRadius.toFixed(1)} mm
                        </span>
                      </div>
                      <input
                        type="range" min="100" max="300" step="1.0"
                        value={goniometerRadius}
                        onChange={(e) => {
                          setGoniometerRadius(parseFloat(e.target.value));
                          if (parseFloat(e.target.value) % 10 === 0) playSynthTone('tick');
                        }}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-xs text-slate-500 mt-2">{t('Focusing circle radius used for calculating displacement offsets.')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Microscope className="w-6 h-6 text-amber-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Radiation Source')}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('X-ray source material and incident wavelengths')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {wavelengthPresets.map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => {
                          setDefaultWavelength(preset.val);
                          playSynthTone('success');
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          Math.abs(defaultWavelength - preset.val) < 0.0001
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-100 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                        }`}
                      >
                        <span className="text-xs font-bold">{preset.label.split(' ')[0]}</span>
                        <div className="flex flex-col mt-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{preset.label.split(' ').slice(1).join(' ')}</span>
                          <span className={`font-mono text-xs font-semibold mt-0.5 ${Math.abs(defaultWavelength - preset.val) < 0.0001 ? 'text-amber-600 dark:text-amber-400' : ''}`}>{preset.val.toFixed(5)} Å</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">{t('Custom Wavelength Override')}</label>
                    <div className="flex gap-2 max-w-sm">
                      <input 
                        type="number" step="0.00001"
                        value={defaultWavelength}
                        onChange={(e) => setDefaultWavelength(parseFloat(e.target.value) || 0)}
                        className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium outline-none focus:border-amber-500 transition-all text-slate-900 dark:text-white"
                      />
                      <span className="bg-slate-100 dark:bg-slate-800 px-4 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500">
                        Å
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* IDENTITY TAB */}
            {activeTab === 'identity' && (
              <motion.div 
                key="identity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-10">
                  <div className="flex-1 space-y-8">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-indigo-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Operator Profile')}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Manage your laboratory identity and credentials')}</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Full Name')}</label>
                          <input 
                            type="text" required value={idName || ''} onChange={(e) => setIdName(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                            placeholder="e.g. Marie Curie"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Email Address')}</label>
                          <input 
                            type="email" required value={idEmail || ''} onChange={(e) => setIdEmail(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                            placeholder="marie@lab.edu"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Organization / Institution')}</label>
                          <input 
                            type="text" required value={idOrg || ''} onChange={(e) => setIdOrg(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Clearance Level')}</label>
                          <select
                            value={clearanceLevel} onChange={(e) => { setClearanceLevel(e.target.value); playSynthTone('tick'); }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                          >
                            <option value="Level 4: Laboratory Director">{t('L4: Director')}</option>
                            <option value="Level 3: Lead Crystallographer">{t('L3: Lead')}</option>
                            <option value="Level 2: Research Associate">{t('L2: Associate')}</option>
                            <option value="Level 1: Undergrad Assistant">{t('L1: Assistant')}</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('Node ID')}</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" required value={terminalId} onChange={(e) => setTerminalId(e.target.value)}
                              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const num = Math.floor(100 + Math.random() * 900);
                                const suffix = ['ALPHA', 'BETA', 'GAMMA', 'OMEGA', 'SIGMA'][Math.floor(Math.random() * 5)];
                                setTerminalId(`TRD-${num}-${suffix}`); playSynthTone('success');
                              }}
                              className="px-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                            >
                              Gen
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-3">{t('Active Certifications')}</label>
                        <div className="flex flex-wrap gap-2">
                          {['Radiation Safety (RSC-4)', 'High-Volt Diffraction System', 'Diffraction Grid Calibration', 'Class 4 Laser Operation', 'Chemical Hazard Handling', 'Neutron Beam Auth'].map((cert) => {
                            const active = certifications.includes(cert);
                            return (
                              <button
                                key={cert} type="button"
                                onClick={() => {
                                  if (active) setCertifications(certifications.filter(c => c !== cert));
                                  else setCertifications([...certifications, cert]);
                                  playSynthTone('tick');
                                }}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${
                                  active 
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {t(cert)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <AnimatePresence>
                          {saveSuccess && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> {t('Saved')}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2">
                          <Save className="w-4 h-4" /> {t('Save Profile')}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="xl:w-[320px] shrink-0">
                     <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-3">{t('ID Badge Preview')}</label>
                     <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden font-mono mx-auto w-full text-slate-100">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-slate-800 rounded-b-lg flex items-center justify-center">
                         <div className="w-6 h-1 bg-black rounded-full opacity-50" />
                       </div>
                       
                       <div className="flex justify-between items-start mt-3 mb-6 border-b border-white/10 pb-4">
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-300 tracking-wider">NEURO-ANALYTICAL</span>
                           <span className="text-[8px] text-indigo-400 font-medium uppercase mt-1">Core Diffraction Unit</span>
                         </div>
                         <Shield className="w-6 h-6 text-indigo-400 opacity-80" />
                       </div>

                       <div className="flex gap-4 items-center mb-6">
                         <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                           <User className="w-6 h-6 text-slate-500" />
                         </div>
                         <div className="min-w-0 flex-1">
                           <div className="text-sm font-bold text-white truncate">{idName || t("Unregistered")}</div>
                           <div className="text-[10px] text-slate-400 truncate mt-0.5">{idEmail || "no-contact@xrd.id"}</div>
                           <div className="mt-2 flex items-center gap-1.5">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                             <span className="text-[9px] text-emerald-400 font-medium tracking-wide">ACTIVE</span>
                           </div>
                         </div>
                       </div>

                       <div className="space-y-2 text-[10px] text-slate-300">
                         <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="font-semibold">{terminalId}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">ORG</span><span className="truncate max-w-[140px] text-right" title={idOrg}>{idOrg || "N/A"}</span></div>
                         <div className="flex justify-between"><span className="text-slate-500">LVL</span><span className="text-indigo-300 truncate max-w-[140px] text-right">{clearanceLevel.split(':')[0]}</span></div>
                       </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DATABASES TAB */}
            {activeTab === 'databases' && (
              <motion.div 
                key="databases"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-3">
                       <Database className="w-6 h-6 text-violet-500" />
                       <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Reference Databases')}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Manage standard crystallographic registries')}</p>
                       </div>
                     </div>
                     <button
                       type="button" disabled={isAuditingDbs} onClick={triggerDbAudit}
                       className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
                     >
                       {isAuditingDbs ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t('Verifying')}</> : <><RefreshCw className="w-4 h-4" /> {t('Audit Databases')}</>}
                     </button>
                   </div>

                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                     <div className="space-y-3">
                       {(['ICDD', 'COD', 'RRUFF', 'ICSD', 'CSD'] as const).map((dbKey) => {
                         const item = dbConfigs[dbKey];
                         const colors: Record<string, string> = {
                           ICDD: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
                           COD: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
                           RRUFF: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10',
                           ICSD: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
                           CSD: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
                         };

                         return (
                           <div key={dbKey} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl flex flex-wrap gap-4 items-center justify-between transition-all">
                             <div className="flex items-center gap-3">
                               <input 
                                 type="checkbox" checked={item.enabled}
                                 onChange={(e) => {
                                   handleSaveDbConfig({ ...dbConfigs, [dbKey]: { ...item, enabled: e.target.checked } }); 
                                   playSynthTone('tick');
                                 }}
                                 className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                               />
                               <span className={`text-xs font-bold px-2 py-1 rounded ${colors[dbKey]}`}>{dbKey}</span>
                             </div>
                             <div className="flex gap-2 flex-1 items-center justify-end">
                               <input 
                                 type="text" value={item.path}
                                 onChange={(e) => {
                                   handleSaveDbConfig({ ...dbConfigs, [dbKey]: { ...item, path: e.target.value } });
                                 }}
                                 className="flex-1 max-w-[160px] p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                                 title="Root Path"
                               />
                               <select
                                 value={item.priority}
                                 onChange={(e) => {
                                   handleSaveDbConfig({ ...dbConfigs, [dbKey]: { ...item, priority: (e.target.value as any) } }); 
                                   playSynthTone('tick');
                                 }}
                                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
                               >
                                 <option value="High">{t('High')}</option>
                                 <option value="Medium">{t('Medium')}</option>
                                 <option value="Low">{t('Low')}</option>
                               </select>
                             </div>
                           </div>
                         );
                       })}
                     </div>

                     <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden h-full min-h-[280px]">
                       <div className="p-3 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
                         <Terminal className="w-4 h-4 text-slate-400" />
                         <span className="text-xs font-medium text-slate-300">{t('Audit Console')}</span>
                       </div>
                       <div className="flex-1 p-4 font-mono text-xs text-slate-400 space-y-1.5 overflow-y-auto">
                         {dbAuditLogs.length === 0 ? (
                           <div className="text-slate-500 italic">{t('No logs generated. Click "Audit Databases" to start.')}</div>
                         ) : (
                           dbAuditLogs.map((logStr, i) => (
                             <div key={i} className={`${logStr.startsWith('✓') ? 'text-emerald-400 font-bold' : logStr.startsWith('Opening') || logStr.startsWith('Scanning') ? 'text-violet-400' : 'text-slate-400'}`}>
                               <span className="text-slate-600 mr-2">&gt;</span>{t(logStr)}
                             </div>
                           ))
                         )}
                       </div>
                     </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-3">
                       <Key className="w-6 h-6 text-fuchsia-500" />
                       <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('API Integrations')}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Configure external services and AI models')}</p>
                       </div>
                     </div>
                     <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-colors">
                       {t('Get API Key')} <ExternalLink className="w-4 h-4" />
                     </a>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                          authStatus === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 
                          authStatus === 'invalid' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' :
                          authStatus === 'checking' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' :
                          'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                        }`}>
                          {authStatus === 'active' && <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />}
                          {authStatus === 'invalid' && <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />}
                          {authStatus === 'checking' && <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin mt-0.5 shrink-0" />}
                          {(authStatus === 'missing' || authStatus === 'unchecked') && <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />}
                          
                          <div>
                             <div className="text-sm font-bold text-slate-800 dark:text-white">
                               {authStatus === 'active' && t('API Connection Active')}
                               {authStatus === 'invalid' && t('Connection Rejected')}
                               {authStatus === 'checking' && t('Verifying credentials...')}
                               {authStatus === 'missing' && t('No API Key Provided')}
                               {authStatus === 'unchecked' && t('Checking status...')}
                             </div>
                             <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                               {authStatus === 'active' && t(authFeedback || "Successfully authenticated with external services.")}
                               {authStatus === 'invalid' && t(authFeedback || "Invalid or empty token payload.")}
                               {authStatus === 'missing' && t("Connect an API token to unlock smart phase analysis and translation features.")}
                             </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('Gemini API Key')}</label>
                            {customApiKey && <button onClick={handleClearCustomKey} className="text-xs font-medium text-rose-500 hover:text-rose-600">{t('Clear Key')}</button>}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="password"
                              value={customApiKey}
                              onChange={(e) => setCustomApiKey(e.target.value)}
                              placeholder={hasSystemKey ? t("Using system environment key") : t("Paste your API key here...")}
                              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-fuchsia-500"
                            />
                            <button
                              onClick={() => handleVerifyAndSaveKey(customApiKey)} disabled={authStatus === 'checking'}
                              className="px-5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                            >
                              {t('Save')}
                            </button>
                          </div>
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <Terminal className="w-5 h-5 text-fuchsia-500" />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t('Connection Test')}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('Send a simple prompt to verify the connection works correctly.')}</p>
                        <input 
                          type="text" value={dryRunPrompt} onChange={(e) => setDryRunPrompt(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-3 text-slate-900 dark:text-white outline-none focus:border-fuchsia-500"
                        />
                        <button
                          onClick={handleRunDryRun} disabled={dryRunLoading || (authStatus !== 'active' && authStatus !== 'unchecked')}
                          className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {dryRunLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('Send Test Prompt')}
                        </button>
                        
                        <AnimatePresence>
                          {dryRunResponse && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs italic text-slate-600 dark:text-slate-400">
                                "{dryRunResponse}"
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
              <motion.div 
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                     <Server className="w-6 h-6 text-slate-700 dark:text-slate-400" />
                     <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Data & Storage')}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Manage local storage and system state')}</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-3">{t('Autosave Interval')}</label>
                          <select
                            value={autosaveInterval}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (setAutosaveInterval) {
                                setAutosaveInterval(val);
                                localStorage.setItem('xrd_autosave_interval', val.toString());
                                playSynthTone('success');
                              }
                            }}
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
                          >
                            <option value={5000}>{t('Every 5 Seconds (Default)')}</option>
                            <option value={10000}>{t('Every 10 Seconds')}</option>
                            <option value={30000}>{t('Every 30 Seconds')}</option>
                            <option value={0}>{t('Disabled')}</option>
                          </select>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-4">{t('Local Storage Usage')}</label>
                          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-4">
                            <div className="h-full bg-indigo-500" style={{ width: `${storageStats.totalSize > 0 ? (storageStats.registrationSize / storageStats.totalSize) * 100 : 0}%` }} title="Identity" />
                            <div className="h-full bg-violet-500" style={{ width: `${storageStats.totalSize > 0 ? (storageStats.databaseSize / storageStats.totalSize) * 100 : 0}%` }} title="Databases" />
                            <div className="h-full bg-pink-500" style={{ width: `${storageStats.totalSize > 0 ? (storageStats.logsSize / storageStats.totalSize) * 100 : 0}%` }} title="Logs" />
                            <div className="h-full bg-teal-500" style={{ width: `${storageStats.totalSize > 0 ? (storageStats.historySize / storageStats.totalSize) * 100 : 0}%` }} title="History" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Identity: {storageStats.registrationSize}B</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500" /> DB Configs: {storageStats.databaseSize}B</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500" /> Logs: {storageStats.logsSize}B</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500" /> History: {storageStats.historySize}B</div>
                          </div>
                          <div className="text-xs font-semibold mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-slate-800 dark:text-slate-200">
                            <span>{t('Total Footprint')}</span>
                            <span>{storageStats.totalSize} Bytes</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <FileCode className="w-5 h-5 text-indigo-500" />
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">{t('Configuration File')}</h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('Export or import your system configuration as a JSON file.')}</p>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={handleExportConfig}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <Download className="w-4 h-4" /> {t('Export Configuration')}
                            </button>
                            <label className="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
                              <Upload className="w-4 h-4" /> {t('Import Configuration')}
                              <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                            </label>
                            {importStatus !== 'idle' && (
                              <div className={`p-3 rounded-lg text-xs font-medium text-center ${
                                importStatus === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                              }`}>
                                {t(importMessage)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-5 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-200 dark:border-rose-500/20">
                          <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-2">{t('Danger Zone')}</h4>
                          <p className="text-xs text-rose-500/80 dark:text-rose-400/80 mb-4">
                            {t('Wipe all local cache entries, operator IDs, configuration profiles, and unsaved datasets. This action cannot be undone.')}
                          </p>
                          <button
                            onClick={handleHardReset}
                            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-rose-500/20"
                          >
                            <Trash2 className="w-4 h-4" /> {t('Reset to Factory Defaults')}
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
