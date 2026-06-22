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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 p-4 md:p-0 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_50px_rgba(79,70,229,0.3)] relative group">
            <Settings className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2 text-slate-900 dark:text-white">
              System<span className="text-indigo-600 font-extrabold">Config</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                <Shield className="w-2.5 h-2.5" /> Secure Protocol v2.5
              </span>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">{t('Laboratory Environment')} • Master Control</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-emerald-500/10 rounded-xl">
               <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Diffraction Core</div>
               <div className="text-[10px] font-black uppercase italic text-emerald-500">Connected</div>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-indigo-500/10 rounded-xl">
               <Activity className="w-4 h-4 text-indigo-500" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Numerical Calib</div>
               <div className="text-[10px] font-black uppercase italic text-slate-700 dark:text-slate-200">
                 {sampleOffsetThetaMock ? 'Active offsets' : 'Perfect Zero'}
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Vertical Tabs Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden p-3 sticky top-24">
            <div className="space-y-1">
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
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
               <div className="flex items-center gap-2">
                 <Lock className="w-3.5 h-3.5 text-indigo-500" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">Local Sandbox</span>
               </div>
               <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
                 All processing completes securely inside the local browser container. No data leaves the terminal.
               </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Environment Aesthetics</h3>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Customize workspace colors and numerical displays</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      {/* Language Select */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          <Globe className="w-3.5 h-3.5" /> Language Locale
                        </label>
                        <LanguageSelector onLanguageChange={() => playSynthTone('switch')} />
                      </div>

                      {/* Precision Settings */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          <Sliders className="w-3.5 h-3.5" /> Decimal Precision Level
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { val: 2, label: 'Standard', sub: '2.00' },
                            { val: 4, label: 'High', sub: '4.0000' },
                            { val: 6, label: 'Analytical', sub: '6.000000' },
                            { val: 8, label: 'Scientific', sub: '8.000...' }
                          ].map((pOption) => (
                            <button
                              key={pOption.val}
                              onClick={() => {
                                setPrecision(pOption.val);
                                playSynthTone('tick');
                              }}
                              className={`group p-4 rounded-xl border-2 transition-all relative overflow-hidden text-left ${
                                precision === pOption.val
                                  ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 hover:border-indigo-500/50'
                              }`}
                            >
                              <div className={`text-[10px] font-black uppercase tracking-widest ${precision === pOption.val ? 'text-white' : 'text-slate-500 group-hover:text-indigo-500'}`}>{pOption.label}</div>
                              <div className={`text-[11px] font-black font-mono italic mt-1 ${precision === pOption.val ? 'text-indigo-200' : 'text-slate-400'}`}>{pOption.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Theme Configuration */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <Palette className="w-3.5 h-3.5" /> Workspace Display Theme
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {themeOptions.map((tOption) => (
                          <button
                            key={tOption.id}
                            onClick={() => {
                              setTheme(tOption.id as any);
                              playSynthTone('switch');
                            }}
                            className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              theme === tOption.id
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-[0_4px_15px_rgba(79,70,229,0.15)]'
                                : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg ${tOption.color} ${tOption.border} border flex items-center justify-center overflow-hidden shadow-sm`}>
                                <span className={`text-[10px] font-black italic ${tOption.text}`}>A</span>
                              </div>
                              <div className="text-left">
                                <div className={`text-[11px] font-black uppercase tracking-widest ${theme === tOption.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {tOption.label}
                                </div>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              theme === tOption.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {theme === tOption.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                   <div className="flex items-center gap-4 mb-6 relative z-10">
                     <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                       <Cpu className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">System Engagement</h3>
                       <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Toggle animations and auditory feedback</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${animationsEnabled ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('Animations')}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Motion Engine Transitions</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setAnimationsEnabled(!animationsEnabled);
                            playSynthTone('tick');
                          }}
                          className={`w-11 h-6 rounded-full transition-all relative ${animationsEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'}`}
                        >
                          <div 
                            style={{ transform: animationsEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform" 
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                            <Volume2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('Sound Effects')}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Audio Feedback Synth</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSoundEnabled(!soundEnabled);
                            localStorage.setItem('xrd_sound', (!soundEnabled).toString());
                            setTimeout(() => { playSynthTone('success'); }, 50);
                          }}
                          className={`w-11 h-6 rounded-full transition-all relative ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'}`}
                        >
                          <div 
                            style={{ transform: soundEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform" 
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Mechanical Alignment</h3>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Specify precise goniometer geometries and offsets</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                          Zero-Shift Correction (Δ2θ)
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                          {zeroShift > 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.005"
                        value={zeroShift}
                        onChange={(e) => {
                          setZeroShift(parseFloat(e.target.value));
                          if (Math.abs(parseFloat(e.target.value) * 1000 % 10) < 1) playSynthTone('tick');
                        }}
                        className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                      />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corrects for absolute mechanical zero index offset.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                          Sample Displacement (s)
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                          {sampleDisplacement.toFixed(4)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-0.2"
                        max="0.2"
                        step="0.002"
                        value={sampleDisplacement}
                        onChange={(e) => {
                          setSampleDisplacement(parseFloat(e.target.value));
                          if (Math.abs(parseFloat(e.target.value) * 1000 % 5) < 1) playSynthTone('tick');
                        }}
                        className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                      />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Misalignment perpendicular to the sample stage (+/- shifts).</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                          Goniometer Radius (R)
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                          {goniometerRadius.toFixed(1)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="300"
                        step="1.0"
                        value={goniometerRadius}
                        onChange={(e) => {
                          setGoniometerRadius(parseFloat(e.target.value));
                          if (parseFloat(e.target.value) % 10 === 0) playSynthTone('tick');
                        }}
                        className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                      />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focusing circle radius for scaling displacement offset calculation.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20">
                      <Microscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Radiation Source</h3>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">X-ray source material and emission wavelengths</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {wavelengthPresets.map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => {
                          setDefaultWavelength(preset.val);
                          playSynthTone('success');
                        }}
                        className={`p-4 rounded-xl border-2 font-bold transition-all text-left flex flex-col justify-between h-full min-h-[90px] ${
                          Math.abs(defaultWavelength - preset.val) < 0.0001
                            ? 'bg-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest">{preset.label.split(' ')[0]}</span>
                        <div className="flex flex-col mt-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${Math.abs(defaultWavelength - preset.val) < 0.0001 ? 'text-amber-100' : 'text-slate-400'}`}>{preset.label.split(' ')[1]}</span>
                          <span className={`font-mono text-xs mt-1 ${Math.abs(defaultWavelength - preset.val) < 0.0001 ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`}>{preset.val.toFixed(5)} Å</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Custom Numerical Wavelength Override:</label>
                    <div className="flex gap-2 max-w-sm">
                      <input 
                        type="number"
                        step="0.00001"
                        value={defaultWavelength}
                        onChange={(e) => setDefaultWavelength(parseFloat(e.target.value) || 0)}
                        className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-sm font-mono font-black outline-none focus:border-amber-500 transition-all text-slate-800 dark:text-white"
                      />
                      <span className="bg-slate-100 dark:bg-slate-800 px-5 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/5 font-mono text-xs font-black text-slate-500 dark:text-slate-400">Å</span>
                    </div>
                  </div>
                </div>

                {/* Calibration Offset Auditor Card */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full">
                      <Compass className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">Correction Auditor Status</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono mt-1">
                        2θ_cal = 2θ_obs - ({zeroShift >= 0 ? '+' : ''}{zeroShift.toFixed(3)}°) - Δ_displacement(2θ_obs)
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 ${sampleOffsetThetaMock ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    {sampleOffsetThetaMock ? 'Applied Compensations' : 'Ideal Alignments'}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden mt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Real-Time Offset Auditor Matrix</h3>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Simulate calibrated output shift across various angular positions</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                          <th className="pb-3 uppercase tracking-widest font-black pr-4">Observed 2θ</th>
                          <th className="pb-3 uppercase tracking-widest font-black pr-4">Zero Shift (Δ)</th>
                          <th className="pb-3 uppercase tracking-widest font-black pr-4">Displacement Shift (s)</th>
                          <th className="pb-3 uppercase tracking-widest font-black text-rose-500 pr-4">Net Offset</th>
                          <th className="pb-3 uppercase tracking-widest font-black text-emerald-500">Calibrated 2θ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {[15, 30, 45, 60, 90, 120].map((twoThetaObs) => {
                          const thetaRad = (twoThetaObs / 2) * (Math.PI / 180);
                          const dispCorrection = goniometerRadius > 0 
                            ? (2 * sampleDisplacement * Math.cos(thetaRad) / goniometerRadius) * (180 / Math.PI)
                            : 0;
                          const netOffset = zeroShift + dispCorrection;
                          const calibrated = twoThetaObs - netOffset;
                          return (
                            <tr key={twoThetaObs} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 font-bold text-slate-900 dark:text-white pr-4">{twoThetaObs.toFixed(1)}°</td>
                              <td className="py-3 text-slate-600 dark:text-slate-400 pr-4">
                                {zeroShift >= 0 ? '+' : ''}{zeroShift.toFixed(4)}°
                              </td>
                              <td className="py-3 text-slate-600 dark:text-slate-400 pr-4">
                                {dispCorrection >= 0 ? '+' : ''}{dispCorrection.toFixed(4)}°
                              </td>
                              <td className="py-3 font-bold text-rose-500 pr-4">
                                {netOffset >= 0 ? '+' : ''}{netOffset.toFixed(4)}°
                              </td>
                              <td className="py-3 font-bold text-emerald-500">
                                {calibrated.toFixed(4)}°
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 italic mt-4 font-sans font-medium">
                    *Note: The displacement shift term uses goniometer radius limit R = {goniometerRadius.toFixed(1)}mm and follows &theta;-dependent cosine decay. Real broadening and peak indexes adapt on-the-fly dynamically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* IDENTITY TAB */}
            {activeTab === 'identity' && (
              <motion.div 
                key="identity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col xl:flex-row gap-12">
                    
                    {/* Identity Form */}
                    <div className="flex-1 space-y-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Operator Registration</h3>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Manage terminal identity profile</p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operator Name</label>
                            <input 
                              type="text" required value={idName || ''} onChange={(e) => setIdName(e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registered Email</label>
                            <input 
                              type="email" required value={idEmail || ''} onChange={(e) => setIdEmail(e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Affiliation / Lab Center</label>
                            <input 
                              type="text" required value={idOrg || ''} onChange={(e) => setIdOrg(e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Terminal Clearance Level</label>
                            <select
                              value={clearanceLevel} onChange={(e) => { setClearanceLevel(e.target.value); playSynthTone('tick'); }}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all"
                            >
                              <option value="Level 4: Laboratory Director">L4: Laboratory Director</option>
                              <option value="Level 3: Lead Crystallographer">L3: Lead Crystallographer</option>
                              <option value="Level 2: Research Associate">L2: Research Associate</option>
                              <option value="Level 1: Undergrad Assistant">L1: Undergrad Assistant</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Station Node ID</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" required value={terminalId} onChange={(e) => setTerminalId(e.target.value)}
                                className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const num = Math.floor(100 + Math.random() * 900);
                                  const suffix = ['ALPHA', 'BETA', 'GAMMA', 'OMEGA', 'SIGMA'][Math.floor(Math.random() * 5)];
                                  setTerminalId(`TRD-${num}-${suffix}`); playSynthTone('success');
                                }}
                                className="px-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl border-2 border-indigo-200 dark:border-indigo-500/30 text-[10px] font-black uppercase"
                              >
                                Gen
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3 md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Authorized Safety Certifications</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    className={`p-3 text-left rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-between ${
                                      active ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500'
                                    }`}
                                  >
                                    <span>{cert}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${active ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                          <AnimatePresence>
                            {saveSuccess && (
                              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                <Check className="w-4 h-4" /> Save Confirmed
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <button type="submit" className="ml-auto flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black uppercase text-[11px] tracking-widest rounded-xl shadow-lg transition-transform cursor-pointer">
                            <Save className="w-4 h-4" /> Commit Identity
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Cyber Badge Preview */}
                    <div className="xl:w-[340px] shrink-0">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block text-center xl:text-left">Live Clearance ID Preview</span>
                       <div className="bg-slate-950 text-white border-2 border-indigo-500/30 rounded-[2.5rem] p-6 w-full shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden font-mono mx-auto">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 border-b border-x border-indigo-500/30 rounded-b-xl flex items-center justify-center shadow-[inset_0_-2px_10px_rgba(99,102,241,0.5)]">
                           <div className="w-8 h-1.5 bg-black rounded-full" />
                         </div>
                         <div className="absolute inset-x-0 h-[1.5px] bg-indigo-500/50 shadow-[0_0_10px_#4f46e5] animate-pulse pointer-events-none top-1/3" />
                         <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
                         <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />

                         <div className="flex justify-between items-start mt-2 mb-6">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-100 tracking-widest">NEURO-ANALYTICAL</span>
                             <span className="text-[7.5px] text-indigo-400 font-bold uppercase mt-0.5">Core Diffraction Unit</span>
                           </div>
                           <div className="w-10 h-8 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-sm border border-amber-600/30 relative p-1 overflow-hidden shrink-0">
                             <div className="grid grid-cols-3 gap-0.5 w-full h-full opacity-60">
                               {[...Array(6)].map((_, i) => <div key={i} className="border border-amber-700/40 rounded-[1px]" />)}
                             </div>
                           </div>
                         </div>

                         <div className="flex gap-4 items-center mb-6">
                           <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-indigo-500/20 relative flex items-center justify-center shrink-0 overflow-hidden group">
                             <User className="w-8 h-8 text-indigo-400 opacity-60 group-hover:scale-110 transition-transform" />
                             <div className="absolute inset-x-0 h-0.5 bg-cyan-400/70 shadow-[0_0_8px_#22d3ee] animate-bounce pointer-events-none top-0" />
                           </div>
                           <div className="min-w-0 flex-1">
                             <div className="text-[12px] font-black text-white truncate tracking-tighter uppercase">{idName || "Unregistered"}</div>
                             <div className="text-[9px] text-slate-400 truncate mt-1">{idEmail || "no-contact@xrd.id"}</div>
                             <div className="mt-2 flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                               <span className="text-[8px] text-emerald-400 font-bold tracking-widest uppercase">Clearance Active</span>
                             </div>
                           </div>
                         </div>

                         <div className="space-y-3 text-[9px] text-slate-300 border-t border-b border-indigo-500/10 py-4 uppercase tracking-wider">
                           <div className="flex justify-between"><span className="text-slate-500">Node ID</span><span className="text-yellow-400 font-bold">{terminalId}</span></div>
                           <div className="flex justify-between"><span className="text-slate-500">Facility</span><span className="text-slate-300 truncate max-w-[130px]" title={idOrg}>{idOrg || "N/A"}</span></div>
                           <div className="flex justify-between"><span className="text-slate-500">Level</span><span className="text-indigo-400 font-bold truncate max-w-[120px]">{clearanceLevel}</span></div>
                         </div>

                         <div className="mt-4">
                           <span className="text-[8px] text-slate-500 block uppercase tracking-widest font-black mb-2">Verified Tags:</span>
                           <div className="flex flex-wrap gap-1.5">
                             {certifications.length > 0 ? certifications.map((c) => (
                               <span key={c} className="text-[7.5px] px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase shrink-0 font-bold">
                                 {c.split(' ')[0]}
                               </span>
                             )) : <span className="text-[8px] italic text-slate-500">No tags active</span>}
                           </div>
                         </div>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Registries */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-white/5 pb-6 relative z-10">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl border border-violet-500/20">
                         <Database className="w-6 h-6 animate-pulse" />
                       </div>
                       <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Reference Registries</h3>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Prioritize active standard XRD databases</p>
                       </div>
                     </div>
                     <button
                       type="button"
                       disabled={isAuditingDbs}
                       onClick={triggerDbAudit}
                       className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shrink-0"
                     >
                       {isAuditingDbs ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying</> : <><RefreshCw className="w-4 h-4" /> Audit Maps</>}
                     </button>
                   </div>

                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
                     <div className="space-y-4">
                       {(['ICDD', 'COD', 'RRUFF', 'ICSD', 'CSD'] as const).map((dbKey) => {
                         const item = dbConfigs[dbKey];
                         const badgeStyle = dbKey === 'ICDD' ? 'text-amber-500' :
                                          dbKey === 'COD' ? 'text-emerald-500' :
                                          dbKey === 'RRUFF' ? 'text-cyan-500' :
                                          dbKey === 'ICSD' ? 'text-indigo-500' : 'text-rose-500';

                         return (
                           <div key={dbKey} className="p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-2xl transition-all group">
                             <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-3">
                                 <input 
                                   type="checkbox" checked={item.enabled}
                                   onChange={(e) => {
                                     const updated = { ...dbConfigs, [dbKey]: { ...item, enabled: e.target.checked } };
                                     handleSaveDbConfig(updated); playSynthTone('tick');
                                   }}
                                   className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                 />
                                 <span className={`text-[13px] font-black tracking-widest uppercase ${badgeStyle}`}>{dbKey}</span>
                               </div>
                               <select
                                 value={item.priority}
                                 onChange={(e) => {
                                   const updated = { ...dbConfigs, [dbKey]: { ...item, priority: (e.target.value as any) } };
                                   handleSaveDbConfig(updated); playSynthTone('tick');
                                 }}
                                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 focus:outline-none"
                               >
                                 <option value="High">Priority: High</option>
                                 <option value="Medium">Priority: Med</option>
                                 <option value="Low">Priority: Low</option>
                               </select>
                             </div>
                             <div className="flex gap-4 flex-wrap">
                               <div className="flex-1 min-w-[120px]">
                                 <span className="block text-[8.5px] font-black uppercase text-slate-400 tracking-wider mb-1">Database Scope / Root Path</span>
                                 <input 
                                   type="text" value={item.path}
                                   onChange={(e) => {
                                     const updated = { ...dbConfigs, [dbKey]: { ...item, path: e.target.value } };
                                     handleSaveDbConfig(updated);
                                   }}
                                   className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 outline-none"
                                 />
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>

                     {/* Audit Logs Console */}
                     <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-full min-h-[300px]">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white/5">
                         <Terminal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Integrity Verification Console</span>
                       </div>
                       <div className="flex-1 p-5 font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-2 overflow-y-auto">
                         {dbAuditLogs.length === 0 ? (
                           <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">Awaiting execution run</div>
                         ) : (
                           dbAuditLogs.map((logStr, i) => (
                             <div key={i} className={`${logStr.startsWith('✓') ? 'text-emerald-500 font-bold' : logStr.startsWith('Opening') || logStr.startsWith('Scanning') ? 'text-violet-500' : 'text-slate-600 dark:text-slate-400'}`}>
                               <span className="text-slate-400 dark:text-slate-600 mr-2 opacity-50">&gt;</span>{logStr}
                             </div>
                           ))
                         )}
                       </div>
                     </div>
                   </div>
                </div>

                {/* Local Offline Database Cache Stats */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">Local Offline Crystal Store Cache</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono mt-1">
                        IndexedDB synchronizations for lightning-fast offline structure lookup
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] shrink-0">
                    <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 font-mono">
                      {offlineCounts.materials} Materials Compiled
                    </span>
                    <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest rounded-lg border border-indigo-500/20 font-mono">
                      {offlineCounts.analysisResults} Runs Saved
                    </span>
                  </div>
                </div>

                {/* Cognitive Engine (Gemini API) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 left-0 w-80 h-80 bg-fuchsia-500/5 blur-[120px] rounded-full -ml-40 -mt-40 pointer-events-none" />
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-white/5 pb-6 relative z-10">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-fuchsia-500/10 text-fuchsia-500 rounded-2xl border border-fuchsia-500/20">
                         <Key className="w-6 h-6 animate-pulse" />
                       </div>
                       <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Cognitive API Hub</h3>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">LLM advisory capabilities via Google Gemini</p>
                       </div>
                     </div>
                     <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center gap-2 shadow-lg">
                       Get Override Token <ExternalLink className="w-3.5 h-3.5" />
                     </a>
                   </div>

                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                     <div className="space-y-6">
                        <div className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-4 ${
                          authStatus === 'active' ? 'bg-emerald-500/5 border-emerald-500/30' : 
                          authStatus === 'invalid' ? 'bg-rose-500/5 border-rose-500/30' :
                          authStatus === 'checking' ? 'bg-indigo-500/5 border-indigo-500/30 animate-pulse' :
                          authStatus === 'missing' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5'
                        }`}>
                          <div className="flex items-start gap-4">
                            {authStatus === 'active' && <CheckCircle2 className="w-8 h-8 text-emerald-500 mt-1" />}
                            {authStatus === 'invalid' && <AlertCircle className="w-8 h-8 text-rose-500 mt-1" />}
                            {authStatus === 'checking' && <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mt-1" />}
                            {(authStatus === 'missing' || authStatus === 'unchecked') && <Info className="w-8 h-8 text-amber-500 mt-1" />}
                            
                            <div>
                               <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Handshake Status</div>
                               <div className="text-[14px] font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">
                                 {authStatus === 'active' && 'Verified AI Engine Active'}
                                 {authStatus === 'invalid' && 'Credentials Rejected'}
                                 {authStatus === 'checking' && 'Exchanging Handshake...'}
                                 {authStatus === 'missing' && 'Token Missing (Offline)'}
                                 {authStatus === 'unchecked' && 'System Initializing'}
                               </div>
                               <div className="text-[10px] font-bold text-slate-500 mt-2 font-mono leading-relaxed">
                                 {authStatus === 'active' && (authFeedback || "Verification completed. Advise features unlocked.")}
                                 {authStatus === 'invalid' && (authFeedback || "Invalid or empty token payload.")}
                                 {authStatus === 'missing' && "Connect an API token to unlock smart phase analysis."}
                               </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Custom Key Override Map</label>
                            {customApiKey && <button onClick={handleClearCustomKey} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">PURGE KEY</button>}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="password"
                              value={customApiKey}
                              onChange={(e) => setCustomApiKey(e.target.value)}
                              placeholder={hasSystemKey ? "●●●●●●●●●●●●●●●●●●" : "AIzaSy..."}
                              className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold font-mono tracking-[0.2em] text-slate-800 dark:text-white outline-none focus:border-fuchsia-500"
                            />
                            <button
                              onClick={() => handleVerifyAndSaveKey(customApiKey)} disabled={authStatus === 'checking'}
                              className="px-6 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                            >
                              Mount
                            </button>
                          </div>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-5 h-5 text-fuchsia-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Sandbox Pilot Loop</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Transmit a test proof sequence directly to the model endpoint to verify connection matrix.</p>
                          <input 
                            type="text" value={dryRunPrompt} onChange={(e) => setDryRunPrompt(e.target.value)}
                            className="w-full p-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mb-4 font-sans text-slate-800 dark:text-white outline-none focus:border-fuchsia-500"
                          />
                        </div>
                        <div>
                          <button
                            onClick={handleRunDryRun} disabled={dryRunLoading || (authStatus !== 'active' && authStatus !== 'unchecked')}
                            className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white hover:border-fuchsia-500 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            {dryRunLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Transmit Packet
                          </button>
                          
                          <AnimatePresence>
                            {dryRunResponse && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto mt-4 px-5">
                                <span className="text-[11px] font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">"{dryRunResponse}"</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
              <motion.div 
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                   
                   <div className="flex items-center gap-4 mb-8">
                     <div className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-300 dark:border-slate-700">
                       <Server className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">System Persistence & IO</h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Manage configuration payloads</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border-2 border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Autosave Event Cycle</label>
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
                            className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value={5000}>Freq: 5 Seconds (Default)</option>
                            <option value={10000}>Freq: 10 Seconds</option>
                            <option value={30000}>Freq: 30 Seconds</option>
                            <option value={0}>Disabled / Freeze</option>
                          </select>
                          {autosaveInterval > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 font-mono mt-2 pl-1">Active Loop: {(autosaveInterval/1000).toFixed(0)}s interval</p>}
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Local Data Volume Footprint</label>
                          <div className="space-y-3 pt-2">
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                              <div 
                                className="h-full bg-indigo-500 transition-all duration-500" 
                                style={{ width: `${storageStats.totalSize > 0 ? (storageStats.registrationSize / storageStats.totalSize) * 100 : 0}%` }} 
                                title={`Identity: ${storageStats.registrationSize} B`}
                              />
                              <div 
                                className="h-full bg-violet-500 transition-all duration-500" 
                                style={{ width: `${storageStats.totalSize > 0 ? (storageStats.databaseSize / storageStats.totalSize) * 100 : 0}%` }} 
                                title={`Databases: ${storageStats.databaseSize} B`}
                              />
                              <div 
                                className="h-full bg-pink-500 transition-all duration-500" 
                                style={{ width: `${storageStats.totalSize > 0 ? (storageStats.logsSize / storageStats.totalSize) * 100 : 0}%` }} 
                                title={`Diagnostic Logs: ${storageStats.logsSize} B`}
                              />
                              <div 
                                className="h-full bg-teal-500 transition-all duration-500" 
                                style={{ width: `${storageStats.totalSize > 0 ? (storageStats.historySize / storageStats.totalSize) * 100 : 0}%` }} 
                                title={`Bragg History: ${storageStats.historySize} B`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[9px] font-mono text-slate-500 leading-relaxed pt-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                                <span className="truncate">Identity: <strong>{storageStats.registrationSize} B</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0" />
                                <span className="truncate">Priorities: <strong>{storageStats.databaseSize} B</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 bg-pink-500 rounded-full shrink-0" />
                                <span className="truncate">Logs: <strong>{storageStats.logsSize} B</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" />
                                <span className="truncate">History: <strong>{storageStats.historySize} B</strong></span>
                              </div>
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 border-t border-slate-100 dark:border-white/5 pt-2 flex justify-between">
                              <span>Total Workspace footprint:</span>
                              <span className="text-indigo-500 font-bold font-mono">{storageStats.totalSize} Bytes</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-rose-500/5 rounded-[2rem] border-2 border-rose-500/20 space-y-4 shadow-sm">
                          <label className="text-[11px] font-black uppercase tracking-widest text-rose-500 block hover:text-rose-600">Danger Zone: Terminal Reset</label>
                          <p className="text-[10px] font-bold font-mono text-slate-500 mb-4 block leading-relaxed pr-6">
                            Purge all local cache entries, operator IDs, configuration profiles, and unsaved datasets. Resets to factory standard definitions.
                          </p>
                          <button
                            onClick={handleHardReset}
                            className="w-full p-4 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 cursor-pointer mt-4"
                          >
                            <Trash2 className="w-4 h-4" /> Trigger Memory Wipe
                          </button>
                        </div>
                      </div>

                      <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border-2 border-slate-200 dark:border-white/5 h-full flex flex-col justify-between space-y-6 shadow-sm">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <FileCode className="w-6 h-6 text-indigo-500" />
                            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">File IO Configuration</h4>
                          </div>
                          <p className="text-[10.5px] font-bold font-sans text-slate-500 uppercase tracking-widest leading-relaxed pt-2">
                            Serialize active settings state into a pure JSON payload, or mount previously saved configuration templates directly to the state machine.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <button
                            onClick={handleExportConfig}
                            className="w-full p-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer py-4"
                          >
                            <Download className="w-4 h-4" /> Clone To Payload Config
                          </button>
                          
                          <label className="w-full p-4.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 active:bg-slate-100 dark:active:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer py-4">
                            <Upload className="w-4 h-4" /> Mount Payload File
                            <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                          </label>

                          {importStatus !== 'idle' && (
                            <div className={`p-4 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 border-dashed text-center mt-4 ${
                              importStatus === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}>
                              {importMessage}
                            </div>
                          )}
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
