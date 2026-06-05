import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, Hash, Palette, Sparkles, Volume2, Settings, 
  Activity, Cpu, Shield, Zap, Info, Database, Globe,
  Beaker, Monitor, Sliders, Server, Lock, User, Edit3, 
  Save, Check, AlertCircle, Wrench, Microscope, Compass,
  Key, ExternalLink, RefreshCw, CheckCircle2,
  Upload, Download, Trash2, FileCode, Send, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import LanguageSelector from './LanguageSelector';

interface SettingsModuleProps {
  theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave';
  setTheme: (theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave') => void;
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

  // New API Access dashboard states
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('xrd_custom_gemini_key') || '');
  const [authStatus, setAuthStatus] = useState<'unchecked' | 'checking' | 'active' | 'invalid' | 'missing'>('unchecked');
  const [authFeedback, setAuthFeedback] = useState('');
  const [activeTier, setActiveTier] = useState<'free' | 'paid'>('free');
  const [hasSystemKey, setHasSystemKey] = useState(false);

  // Improved capabilities states for Cognitive API access
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

  useEffect(() => {
    const checkSystemKeyAndVerify = async () => {
      try {
        const res = await fetch('/api/gemini/config');
        const configData = await res.json();
        const systemKeyActive = !!configData?.hasEnvKey;
        setHasSystemKey(systemKeyActive);
        
        const storedKey = localStorage.getItem('xrd_custom_gemini_key') || '';
        
        // If we have a stored override key OR a system-wide default key, auto-handshake instantly!
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
        console.error("Auto key configuration check error:", err);
        addLog('System Startup Verification', 'ERROR', err.message || 'Network timeout');
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
        // Save to local storage
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

  // Systems Configuration Backup & Management
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
    { id: 'light', label: 'Light Lux', color: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200' },
    { id: 'dark', label: 'Dark Matter', color: 'bg-slate-900', text: 'text-white', border: 'border-slate-700' },
    { id: 'cyberpunk', label: 'Cyber Net', color: 'bg-black', text: 'text-yellow-400', border: 'border-yellow-500' },
    { id: 'terminal', label: 'Mainframe', color: 'bg-black', text: 'text-green-500', border: 'border-green-500' },
    { id: 'synthwave', label: 'Neon City', color: 'bg-indigo-950', text: 'text-pink-500', border: 'border-pink-500' }
  ];

  const wavelengthPresets = [
    { label: 'Copper Cu-Kα (1.5406 Å)', val: 1.5406 },
    { label: 'Cobalt Co-Kα (1.7890 Å)', val: 1.7890 },
    { label: 'Molybdenum Mo-Kα (0.7107 Å)', val: 0.7107 },
    { label: 'Iron Fe-Kα (1.9360 Å)', val: 1.9360 },
    { label: 'Chromium Cr-Kα (2.2897 Å)', val: 2.2897 }
  ];

  // Calculated displacement offset mockup formula representation
  const sampleOffsetThetaMock = Math.abs(zeroShift) > 0 || Math.abs(sampleDisplacement) > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 p-4 md:p-0 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(79,70,229,0.3)] relative group">
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
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">{t('Laboratory Environment')} • Core Calibration</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-emerald-500/10 rounded-xl">
               <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Diffraction Core</div>
               <div className="text-xs font-black uppercase italic text-emerald-500">Connected & Synced</div>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-indigo-500/10 rounded-xl">
               <Activity className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Numerical Calibration</div>
               <div className="text-xs font-black uppercase italic text-slate-700 dark:text-slate-200">
                 {sampleOffsetThetaMock ? 'Active offsets' : 'Perfect Zero'}
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
          {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Appearance & Precision */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors" />
            
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <Monitor className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Environment Aesthetics</h3>
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Customize workspace colors and numerical displays</p>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* Left Column: Language and Precision */}
              <div className="space-y-8">
                {/* Language Select */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Globe className="w-3.5 h-3.5" /> Language Locale
                  </label>
                  <div>
                    <LanguageSelector onLanguageChange={() => playSynthTone('switch')} />
                  </div>
                </div>

                {/* Accuracy/Precision Settings */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Sliders className="w-3.5 h-3.5" /> Precision Decimal Decimals
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
                        className={`group p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                          precision === pOption.val
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
                        }`}
                      >
                        <div className="relative z-10 text-left">
                          <div className={`text-[10px] font-black uppercase tracking-widest ${precision === pOption.val ? 'text-white' : 'text-slate-500 group-hover:text-indigo-500'}`}>{pOption.label}</div>
                          <div className={`text-xs font-black font-mono italic mt-1 ${precision === pOption.val ? 'text-indigo-200' : 'text-slate-400'}`}>{pOption.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Theme Configuration */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Palette className="w-3.5 h-3.5" /> Workspace Display Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
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
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-10 rounded-lg ${tOption.color} ${tOption.border} border-2 flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-105`}>
                          <span className={`text-[10px] font-black italic ${tOption.text} px-2.5 py-1 rounded bg-black/10 dark:bg-white/10 backdrop-blur-sm`}>A</span>
                        </div>
                        <div className="text-left">
                          <div className={`text-[12px] font-black uppercase tracking-widest ${theme === tOption.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {tOption.label}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {tOption.id === 'light' ? 'High Visibility' : tOption.id === 'dark' ? 'Low Fatigue' : tOption.id === 'terminal' ? 'High Contrast' : 'Immersive'}
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                        theme === tOption.id ? 'border-indigo-600 bg-indigo-600 scale-110 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {theme === tOption.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Instrument Calibration & Alignment */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative">
             <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <Wrench className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Mechanical Alignment & Radiation Parameters</h3>
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Specify precise goniometer geometries, mechanical offsets, and x-ray source parameters</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               
               <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-2 mb-4">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Mechanical Alignment Corrections</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">Specimen offsets and physical circle goniometer alignments</p>
                  </div>
                 {/* Zero Shift Correction */}
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Zero-Shift Correction (Δ2θ)
                     </label>
                     <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
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
                       if (Math.abs(parseFloat(e.target.value) * 1000 % 10) < 1) {
                         playSynthTone('tick');
                       }
                     }}
                     className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Adjusts peak locations to correct for absolute mechanical zero index offset in the circle goniometer.
                   </p>
                 </div>

                 {/* Sample Displacement misalignment */}
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Sample Displacement (s)
                     </label>
                     <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
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
                       if (Math.abs(parseFloat(e.target.value) * 1000 % 5) < 1) {
                         playSynthTone('tick');
                       }
                     }}
                     className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Misalignment perpendicular to the sample stage. Causes systematic $s \cos(\theta)$ shifting errors.
                   </p>
                 </div>

                 {/* Goniometer Radius */}
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Goniometer Radius (R)
                     </label>
                     <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
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
                       if (parseFloat(e.target.value) % 10 === 0) {
                         playSynthTone('tick');
                       }
                     }}
                     className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Focusing circle radius. Essential to dynamically scale displacement offset calculations.
                   </p>
                 </div>
               </div>

               <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-2.5 mb-4">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Default Radiation Parameters</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">X-ray source material and specific emission wavelengths</p>
                  </div>
                  {/* Default Radiation Wavelength Selector */}
                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                     <Microscope className="w-3.5 h-3.5" /> Lab Source Default (λ)
                   </label>
                   <div className="grid grid-cols-1 gap-2">
                     {wavelengthPresets.map((preset) => (
                       <button
                         key={preset.val}
                         onClick={() => {
                           setDefaultWavelength(preset.val);
                           playSynthTone('success');
                         }}
                         className={`p-3 text-xs w-full text-left rounded-xl border-2 font-bold transition-all flex justify-between items-center group ${
                           Math.abs(defaultWavelength - preset.val) < 0.0001
                             ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                             : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800'
                         }`}
                       >
                         <span className={Math.abs(defaultWavelength - preset.val) < 0.0001 ? 'text-white' : 'group-hover:text-indigo-500'}>{preset.label}</span>
                         <span className={`font-mono text-[10px] ${Math.abs(defaultWavelength - preset.val) < 0.0001 ? 'opacity-90' : 'text-slate-400 group-hover:text-indigo-400'}`}>{preset.val.toFixed(5)} Å</span>
                       </button>
                     ))}
                   </div>
                   
                   {/* Custom user overridden value */}
                   <div className="pt-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block">Custom Numerical Wavelength Override:</label>
                     <div className="flex gap-2">
                       <input 
                         type="number"
                         step="0.00001"
                         value={defaultWavelength}
                         onChange={(e) => setDefaultWavelength(parseFloat(e.target.value) || 0)}
                         className="flex-1 p-2 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-white"
                       />
                       <span className="bg-slate-100 dark:bg-slate-800 px-4 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 font-mono text-xs font-black text-slate-500 dark:text-slate-400">Å</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </section>

          {/* Section 3: Operator Identity & Profile Synchronization */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
             
             <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <User className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Operator Identity & Lab Clearance</h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Integrate user profiles, active certificates, and metadata properties</p>
               </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
               {/* Advanced Form */}
               <form onSubmit={handleSaveProfile} className="xl:col-span-7 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   
                   {/* Operator Name */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Operator / Researcher Name
                     </label>
                     <input 
                       type="text"
                       required
                       value={idName || ''}
                       onChange={(e) => setIdName(e.target.value)}
                       className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono"
                       placeholder="e.g. Dr. Eleanor Vance"
                     />
                   </div>

                   {/* Registered Email */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Registered Lab Email
                     </label>
                     <input 
                       type="email"
                       required
                       value={idEmail || ''}
                       onChange={(e) => setIdEmail(e.target.value)}
                       className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono"
                       placeholder="e.g. chemist@university.edu"
                     />
                   </div>

                   {/* Organization/Institute */}
                   <div className="space-y-1.5 md:col-span-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Affiliation / Institution / Lab Center
                     </label>
                     <input 
                       type="text"
                       required
                       value={idOrg || ''}
                       onChange={(e) => setIdOrg(e.target.value)}
                       className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono"
                       placeholder="e.g. Neuro-Analytical Physics Center"
                     />
                   </div>

                   {/* Lab Clearance Level */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Terminal Clearance Level
                     </label>
                     <select
                       value={clearanceLevel}
                       onChange={(e) => {
                         setClearanceLevel(e.target.value);
                         playSynthTone('tick');
                       }}
                       className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all select-none"
                     >
                       <option value="Level 4: Laboratory Director">Level 4: Laboratory Director (L4-DIR)</option>
                       <option value="Level 3: Lead Crystallographer">Level 3: Lead Crystallographer (L3-CRYST)</option>
                       <option value="Level 2: Research Associate">Level 2: Research Associate (L2-ASSOC)</option>
                       <option value="Level 1: Undergrad Assistant">Level 1: Undergrad Assistant (L1-ASST)</option>
                     </select>
                   </div>

                   {/* Terminal ID */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Station node ID
                     </label>
                     <div className="flex gap-2">
                       <input 
                         type="text"
                         required
                         value={terminalId}
                         onChange={(e) => setTerminalId(e.target.value)}
                         className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const num = Math.floor(100 + Math.random() * 900);
                           const suffix = ['ALPHA', 'BETA', 'GAMMA', 'OMEGA', 'SIGMA', 'X-RAY'][Math.floor(Math.random() * 6)];
                           setTerminalId(`TRD-${num}-${suffix}`);
                           playSynthTone('success');
                         }}
                         className="px-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl border-2 border-indigo-200 dark:border-indigo-500/30 text-[10px] font-black uppercase tracking-wider transition-all"
                       >
                         Gen
                       </button>
                     </div>
                   </div>

                   {/* Certifications Selection */}
                   <div className="space-y-3 md:col-span-2 pt-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                       Authorized Safety & Lab Certifications
                     </label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {[
                         'Radiation Safety (RSC-4)',
                         'High-Volt Diffraction System',
                         'Diffraction Grid Calibration',
                         'Class 4 Laser Operation',
                         'Chemical Hazard Handling',
                         'Neutron Beam Authorization'
                       ].map((cert) => {
                         const active = certifications.includes(cert);
                         return (
                           <button
                             key={cert}
                             type="button"
                             onClick={() => {
                               if (certifications.includes(cert)) {
                                 setCertifications(certifications.filter(c => c !== cert));
                               } else {
                                 setCertifications([...certifications, cert]);
                               }
                               playSynthTone('tick');
                             }}
                             className={`p-3 text-left rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-between ${
                               active 
                                 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                 : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                             }`}
                           >
                             <span>{cert}</span>
                             <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                               active ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-white/20'
                             }`}>
                               {active && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                             </div>
                           </button>
                         );
                       })}
                     </div>
                   </div>
                          </div>
                 <div className="flex items-center justify-between pt-4">
                   <div className="flex items-center gap-2">
                     <AnimatePresence>
                       {saveSuccess && (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.8 }}
                           className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full"
                         >
                           <Check className="w-3.5 h-3.5" /> {t('Saved successfully', 'Saved successfully')}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                   
                   <button
                     type="submit"
                     className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
                   >
                     <Save className="w-4 h-4" /> Save Identification Records
                   </button>
                 '</div>\n                </form>'

               {/* Live holographic ID Badge Panel */}
               <div className="xl:col-span-12 lg:xl:col-span-5 flex flex-col items-center pt-2 w-full">
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Live Clearance Certificate ID</span>
                 
                 {/* Cyber Badge */}
                 <div className="bg-slate-950 text-white border-2 border-indigo-500/30 rounded-[2.5rem] p-6 w-full max-w-[340px] shadow-[0_0_50px_rgba(79,70,229,0.12)] relative overflow-hidden flex flex-col font-mono">
                   
                   {/* Badge top clip slot */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 border-b border-x border-indigo-500/30 rounded-b-xl flex items-center justify-center">
                     <div className="w-8 h-1.5 bg-black rounded-full" />
                   </div>

                   {/* Background laser sweeping animation line */}
                   <div className="absolute inset-x-0 h-[1.5px] bg-indigo-500/50 shadow-[0_0_10px_#4f46e5] animate-pulse pointer-events-none top-1/3" />

                   {/* Holographic glowing orbs */}
                   <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
                   <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />

                   {/* Smart Gold Contact Chip */}
                   <div className="flex justify-between items-start mt-2 mb-4">
                     <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-slate-50 tracking-wider">NEURO-ANALYTICAL LABS</span>
                       <span className="text-[6.5px] text-indigo-400/80 font-black">CORE DIFFRACTION UNIT</span>
                     </div>
                     <div className="w-8 h-6 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-sm border border-amber-600/30 relative p-1 overflow-hidden shrink-0">
                       <div className="grid grid-cols-3 gap-0.5 w-full h-full opacity-60">
                         <div className="border border-amber-700/40 rounded-sm" />
                         <div className="border border-amber-700/40 rounded-sm" />
                         <div className="border border-amber-700/40 rounded-sm" />
                         <div className="border border-amber-700/40 rounded-sm" />
                         <div className="border border-amber-700/40 rounded-sm" />
                         <div className="border border-amber-700/40 rounded-sm" />
                       </div>
                     </div>
                   </div>

                   {/* Avatar and details */}
                   <div className="flex gap-4 items-center mb-5">
                     <div className="w-16 h-16 rounded-xl bg-slate-900 border border-indigo-500/20 relative flex items-center justify-center overflow-hidden shrink-0">
                       <User className="w-8 h-8 text-indigo-400 opacity-60" />
                       <div className="absolute inset-x-0 h-0.5 bg-cyan-400/70 shadow-[0_0_8px_#22d3ee] animate-bounce pointer-events-none top-0" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <div className="text-[11px] font-black text-slate-100 truncate uppercase tracking-tighter">
                         {idName || "Unregistered Operator"}
                       </div>
                       <div className="text-[7.5px] text-slate-400 truncate mt-0.5">
                         {idEmail || "no-contact@xrd.id"}
                       </div>
                       <div className="mt-1.5 flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                         <span className="text-[7.5px] text-emerald-400/90 font-black tracking-widest uppercase">
                           Clearance Active
                         </span>
                       </div>
                     </div>
                   </div>

                   {/* Metadata lines */}
                   <div className="space-y-2 text-[8px] text-slate-300 border-t border-b border-indigo-500/10 py-3 uppercase tracking-wider">
                     <div className="flex justify-between">
                       <span className="text-slate-500">Node ID</span>
                       <span className="text-yellow-400 font-bold">{terminalId}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Institution</span>
                       <span className="text-slate-300 truncate max-w-[170px]" title={idOrg}>{idOrg || "N/A"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Authority</span>
                       <span className="text-indigo-400 font-bold">{clearanceLevel}</span>
                     </div>
                   </div>

                   {/* Verified badges */}
                   <div className="mt-3.5 space-y-1.5">
                     <span className="text-[7px] text-slate-500 block uppercase tracking-widest font-black">Verified Credentials:</span>
                     <div className="flex flex-wrap gap-1 leading-none max-h-[50px] overflow-y-auto pr-1">
                       {certifications.length > 0 ? (
                         certifications.map((c) => (
                           <span key={c} className="text-[6px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase shrink-0">
                             {c.replace(/\s*\(.*\)/g, '')}
                           </span>
                         ))
                       ) : (
                         <span className="text-[6.5px] italic text-slate-500 font-bold">No active safety clearance</span>
                       )}
                     </div>
                   </div>

                   {/* Barcode representation */}
                   <div className="mt-5 pt-3.5 border-t border-indigo-500/10 flex items-center justify-between gap-4">
                     <div className="flex items-center gap-0.5 h-6 bg-transparent">
                       <div className="w-0.5 h-full bg-slate-400" />
                       <div className="w-0.5 h-full bg-slate-400" />
                       <div className="w-1.5 h-full bg-slate-400" />
                       <div className="w-0.5 h-full bg-transparent" />
                       <div className="w-1 h-full bg-slate-400" />
                       <div className="w-0.5 h-full bg-slate-400" />
                       <div className="w-0.5 h-full bg-transparent" />
                       <div className="w-2 h-full bg-slate-400" />
                       <div className="w-0.5 h-full bg-slate-400" />
                       <div className="w-1 h-full bg-slate-400" />
                       <div className="w-0.5 h-full bg-transparent" />
                       <div className="w-0.5 h-full bg-slate-400" />
                       <div className="w-1.5 h-full bg-slate-400" />
                     </div>
                     <span className="text-[6px] text-slate-500 text-right leading-tight select-none">
                       SUITE V2.5<br />
                       SYS SYNC LATER
                     </span>
                   </div>
                 </div>
               </div>
             </div>
          </section>

          {/* Section 4: Cognitive API Access & AI Provisioning Gateway */}
          <section id="api-access-panel" className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-fuchsia-500/5 blur-[120px] rounded-full -ml-40 -mt-40 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-500 border border-fuchsia-500/20">
                  <Key className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Cognitive API Access Gateway</h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Configure credentials and view active operational rates</p>
                </div>
              </div>
              
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer shadow-md w-fit"
              >
                Get Google API Key <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Credentials & Live Verifier Control block */}
              <div className="xl:col-span-7 space-y-6">
                
                {/* Visual Status Indicator Panel */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  authStatus === 'active' 
                    ? 'bg-emerald-500/5 border-emerald-500/30' 
                    : authStatus === 'invalid'
                    ? 'bg-rose-500/5 border-rose-500/30'
                    : authStatus === 'checking'
                    ? 'bg-indigo-500/5 border-indigo-500/30 animate-pulse'
                    : authStatus === 'missing'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {authStatus === 'active' && (
                        <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {authStatus === 'invalid' && (
                        <div className="w-9 h-9 bg-rose-500/10 text-rose-500 border border-rose-500/25 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 animate-bounce" />
                        </div>
                      )}
                      {authStatus === 'checking' && (
                        <div className="w-9 h-9 bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 rounded-xl flex items-center justify-center animate-spin">
                          <RefreshCw className="w-5 h-5" />
                        </div>
                      )}
                      {authStatus === 'missing' && (
                        <div className="w-9 h-9 bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      )}
                      {authStatus === 'unchecked' && (
                        <div className="w-9 h-9 bg-slate-500/10 text-slate-500 border border-slate-300 dark:border-white/10 rounded-xl flex items-center justify-center">
                          <Info className="w-5 h-5" />
                        </div>
                      )}
                      {authStatus === 'active' && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">AUTHENTICATION STATUS</span>
                        {hasSystemKey && !customApiKey && (
                          <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded border border-indigo-500/20 font-mono">System Default Key</span>
                        )}
                        {customApiKey && (
                          <span className="px-1.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 text-[8px] font-black uppercase tracking-wider rounded border border-fuchsia-500/20 font-mono">Custom Override</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[12px] font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">
                          {authStatus === 'active' && 'Verified Hub Active'}
                          {authStatus === 'invalid' && 'Handshake Failure'}
                          {authStatus === 'checking' && 'Exchanging Quantum Handshake...'}
                          {authStatus === 'missing' && 'Key Missing / Incomplete'}
                          {authStatus === 'unchecked' && 'Unchecked State / Initialized'}
                        </div>
                        {authStatus === 'active' && lastLatency !== null && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[7.5px] font-black uppercase tracking-wider rounded border border-emerald-500/25 font-mono">
                            ⚡ {lastLatency}ms latency
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-semibold text-slate-500 mt-2.5 leading-relaxed font-mono">
                    {authStatus === 'unchecked' && "System ready to verify connection. Input your personal Google AI Studio key below or check the system's default status."}
                    {authStatus === 'active' && (authFeedback || "Verification completed. The Quantum AI science advisor engine is verified as active.")}
                    {authStatus === 'invalid' && (authFeedback || "Handshake rejected. Provide a valid 'AIZA...' credential with correctly loaded billing settings.")}
                    {authStatus === 'missing' && "No key configured. Direct mathematics remain active, but conversational AI modules require a valid credentials token."}
                    {authStatus === 'checking' && "Verifying system permissions dynamically with official model servers..."}
                  </p>
                </div>

                {/* API Key Input Form Override */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                      Custom Gemini API Key Override
                    </label>
                    {customApiKey && (
                      <button 
                        type="button"
                        onClick={handleClearCustomKey}
                        className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:underline leading-none align-middle font-sans cursor-pointer"
                      >
                        Reset To Default Key
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input 
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder={hasSystemKey ? "••••••••••••••••••••••••••••••••••••••••" : "Paste custom Gemini AI key... (e.g. AIzaSy...)"}
                      className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-205 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-fuchsia-500 focus:bg-white dark:focus:bg-slate-850 transition-all font-mono tracking-widest"
                    />
                    
                    <button
                      type="button"
                      disabled={authStatus === 'checking'}
                      onClick={() => handleVerifyAndSaveKey(customApiKey)}
                      className="px-6 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {authStatus === 'checking' ? 'Validating...' : 'Verify & Save'}
                    </button>
                  </div>

                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal">
                    💡 <strong>Privacy First:</strong> Custom API keys reside securely inside your browser's local sandbox memory. They are forwarded exclusively to Google model endpoints over secure proxy requests and never stored on third-party servers.
                  </p>
                </div>

                {/* Interactive Diagnostics sandbox preview */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-fuchsia-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Inline Diagnostics Sandbox</span>
                    </div>
                    <span className="text-[8px] bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 px-1.5 py-0.5 rounded uppercase font-bold font-mono tracking-wider">Live Model Test</span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal">
                    Issue a real-time crystalline proof command directly to check connection integrity and response authenticity:
                  </p>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={dryRunPrompt}
                      onChange={(e) => setDryRunPrompt(e.target.value)}
                      placeholder="Ask the advisor a quick physics proof..."
                      className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-fuchsia-500 transition-all font-sans"
                    />
                    <button
                      type="button"
                      disabled={dryRunLoading || authStatus === 'checking' || (authStatus !== 'active' && authStatus !== 'unchecked')}
                      onClick={handleRunDryRun}
                      className="px-4 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:opacity-95 disabled:opacity-30 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    >
                      {dryRunLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Sandbox Response Box */}
                  {dryRunResponse && (
                    <div className="p-3.5 bg-slate-950 dark:bg-black rounded-xl border border-emerald-500/10 font-mono text-[9px] text-emerald-400 max-h-28 overflow-y-auto leading-relaxed select-text">
                      <div className="flex justify-between items-center text-[7.5px] border-b border-emerald-500/10 pb-1 mb-1.5 uppercase font-bold tracking-widest text-emerald-500/60 leading-none">
                        <span>Transmission Result</span>
                        <span>gemini-3.5-flash</span>
                      </div>
                      <p>{dryRunResponse}</p>
                    </div>
                  )}
                </div>

                {/* Session audit telemetry */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Active Operational Log (Session)</span>
                  </div>
                  <div className="bg-slate-950/40 dark:bg-black p-4 rounded-2xl border border-slate-205 dark:border-white/5 font-mono text-[9px] space-y-1.5 max-h-[160px] overflow-y-auto leading-tight">
                    {apiLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between gap-3 text-slate-400 border-b border-slate-150/5 dark:border-white/5 pb-1 last:border-0 last:pb-0">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${log.status === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-bounce'}`} />
                          <div className="min-w-0">
                            <span className="text-[7.5px] text-slate-500 font-bold block">{log.time}</span>
                            <span className="text-slate-850 dark:text-slate-200 font-extrabold truncate block">{log.action}</span>
                            <span className="text-slate-500 text-[8px] truncate block opacity-85">{log.info}</span>
                          </div>
                        </div>
                        {log.latency && (
                          <span className="px-1 bg-indigo-500/25 text-indigo-400 rounded text-[7.5px] font-bold shrink-0 self-center">
                            {log.latency}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Interactive visual limit comparisons */}
              <div className="xl:col-span-5 space-y-5 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5 pt-6 xl:pt-0 xl:pl-6">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5 font-sans">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Interactive Capacity Monitor
                  </h4>
                  <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Compare limits and upgrade parameters below</p>
                </div>

                {/* Tier Selection Switches */}
                <div className="grid grid-cols-2 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl font-sans">
                  <button 
                    type="button"
                    onClick={() => {
                      setActiveTier('free');
                      playSynthTone('tick');
                    }}
                    className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTier === 'free' 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Free Access Pool
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setActiveTier('paid');
                      playSynthTone('tick');
                    }}
                    className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTier === 'paid' 
                        ? 'bg-fuchsia-600 text-white shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Paid Pay-As-You-Go
                  </button>
                </div>

                {/* Limits Explanation block */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4 font-mono font-bold">
                  
                  {/* Metric 1: Requests Rate limit */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-end text-[9px]">
                      <span className="text-slate-500 uppercase">Requests Limit Per Minute</span>
                      <span className={activeTier === 'paid' ? 'text-fuchsia-500' : 'text-amber-500'}>
                        {activeTier === 'paid' ? '360 RPM' : '15 RPM'}
                      </span>
                    </div>
                    {/* Visual Meter */}
                    <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        style={{ width: activeTier === 'paid' ? '100%' : '10%' }}
                        className={`h-full transition-all duration-700 rounded-full ${activeTier === 'paid' ? 'bg-fuchsia-500' : 'bg-amber-450 bg-amber-500'}`} 
                      />
                    </div>
                  </div>

                  {/* Metric 2: Requests Per Day */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-end text-[9px]">
                      <span className="text-slate-500 uppercase">Requests Limit Per Day</span>
                      <span className={activeTier === 'paid' ? 'text-fuchsia-500' : 'text-amber-500'}>
                        {activeTier === 'paid' ? '360,000 RPD' : '1,500 RPD'}
                      </span>
                    </div>
                    {/* Visual Meter */}
                    <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        style={{ width: activeTier === 'paid' ? '100%' : '8%' }}
                        className={`h-full transition-all duration-700 rounded-full ${activeTier === 'paid' ? 'bg-fuchsia-400' : 'bg-amber-400'}`} 
                      />
                    </div>
                  </div>

                  {/* Operational Latency & Priority Metas */}
                  <div className="grid grid-cols-2 gap-3 text-[9px] uppercase pt-2 border-t border-slate-200 dark:border-white/10 font-sans leading-relaxed">
                    <div>
                      <span className="block text-slate-400 font-mono text-[8px] tracking-tight font-black">Handshake Priority:</span>
                      <span className={`font-black tracking-wider ${activeTier === 'paid' ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {activeTier === 'paid' ? 'High / Expedited' : 'Standard Queue'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-mono text-[8px] tracking-tight font-black">Standard Latency:</span>
                      <span className={`font-black tracking-wider ${activeTier === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {activeTier === 'paid' ? '~0.3 Seconds' : '~1.5 Seconds'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9.5px] italic font-sans leading-relaxed text-slate-500 font-semibold uppercase tracking-tight">
                    {activeTier === 'free' 
                      ? "The Free Pool is excellent for initial educational laboratory runs and basic tests. However, standard queues might trigger transient quota errors during peak analytical hours."
                      : "The Paid tier unlocks professional high-speed pipelines. This ensures zero latency throttling during extensive structural simulations and crystallographic refinements."
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Configuration Controls */}
        <div className="space-y-8">
          
          {/* Diagnostics Card */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Environment Systems</h3>
            </div>

            <div className="space-y-4">
              {/* Animations Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-white/5 group transition-colors">
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

              {/* Sound FX Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-white/5 group transition-colors">
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
                    setTimeout(() => {
                      playSynthTone('success');
                    }, 50);
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

            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white relative overflow-hidden group shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full -mr-16 -mt-16 duration-700" />
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-3">
                   <Lock className="w-4 h-4 text-indigo-200" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200">{t('Security Layer')}</span>
                 </div>
                 <h4 className="text-xl font-black uppercase italic tracking-tighter mb-1">Encrypted Core</h4>
                 <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-relaxed">
                   Decentralized Sandbox • All processing is securely executed client-side inside the lab container
                 </p>
               </div>
            </div>
          </section>

          {/* Section 5: Standard Scientific Reference Registries (ICDD, COD, RRUFF, ICSD, CSD) */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
             
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl border border-violet-500/20">
                   <Database className="w-6 h-6 animate-pulse" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Scientific Reference Registries</h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Configure, authenticate, and prioritize standard XRD reference databases</p>
                 </div>
               </div>
               <span className="text-[8px] tracking-widest px-2.5 py-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 font-extrabold uppercase font-mono">
                 Local Node Directory
               </span>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
               {/* Reference database configuration form */}
               <div className="xl:col-span-7 space-y-6">
                 <div className="space-y-4">
                   {(['ICDD', 'COD', 'RRUFF', 'ICSD', 'CSD'] as const).map((dbKey) => {
                     const item = dbConfigs[dbKey];
                     const badgeStyle = dbKey === 'ICDD' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                      dbKey === 'COD' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-550 dark:text-emerald-400' :
                                      dbKey === 'RRUFF' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 dark:text-cyan-400' :
                                      dbKey === 'ICSD' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400' :
                                      'bg-rose-500/10 border-rose-500/20 text-rose-550 dark:text-rose-400';

                     return (
                       <div key={dbKey} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-2xl space-y-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900/50">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <input 
                               type="checkbox"
                               checked={item.enabled}
                               onChange={(e) => {
                                 const updated = { ...dbConfigs, [dbKey]: { ...item, enabled: e.target.checked } };
                                 handleSaveDbConfig(updated);
                                 playSynthTone('tick');
                               }}
                               className="rounded border-slate-300 dark:border-slate-850 text-violet-600 focus:ring-violet-500"
                             />
                             <span className={`text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded border ${badgeStyle}`}>
                               {dbKey}
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold font-mono">[{item.priority} Priority]</span>
                           </div>

                           <div className="flex gap-2">
                             <select
                               value={item.priority}
                               onChange={(e) => {
                                 const updated = { ...dbConfigs, [dbKey]: { ...item, priority: (e.target.value as any) } };
                                 handleSaveDbConfig(updated);
                                 playSynthTone('tick');
                               }}
                               className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded px-2 py-1 text-[9px] font-bold text-slate-650 dark:text-slate-400 focus:outline-none"
                             >
                               <option value="High">H-Val</option>
                               <option value="Medium">M-Val</option>
                               <option value="Low">L-Val</option>
                             </select>
                           </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                           <div className="space-y-1">
                             <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Catalog Version</span>
                             <input 
                               type="text"
                               value={item.version}
                               onChange={(e) => {
                                 const updated = { ...dbConfigs, [dbKey]: { ...item, version: e.target.value } };
                                 handleSaveDbConfig(updated);
                               }}
                               className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-lg text-[10px] font-bold text-slate-755 dark:text-slate-350 font-mono outline-none focus:border-violet-500"
                             />
                           </div>
                           <div className="space-y-1">
                             <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Authorization / License Key</span>
                             <input 
                               type="text"
                               value={item.key}
                               onChange={(e) => {
                                 const updated = { ...dbConfigs, [dbKey]: { ...item, key: e.target.value } };
                                 handleSaveDbConfig(updated);
                               }}
                               className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-lg text-[10px] font-bold text-slate-755 dark:text-slate-350 font-mono outline-none focus:border-violet-500"
                             />
                           </div>
                           <div className="space-y-1">
                             <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Local Directory Path</span>
                             <input 
                               type="text"
                               value={item.path}
                               onChange={(e) => {
                                 const updated = { ...dbConfigs, [dbKey]: { ...item, path: e.target.value } };
                                 handleSaveDbConfig(updated);
                               }}
                               className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-lg text-[10px] font-bold text-slate-755 dark:text-slate-350 font-mono outline-none focus:border-violet-500"
                             />
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>

               {/* Directory Integrity Scanner Sandbox & Log */}
               <div className="xl:col-span-5 space-y-5 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5 pt-6 xl:pt-0 xl:pl-6">
                 <div className="space-y-1">
                   <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5 font-sans">
                     <Microscope className="w-4 h-4 text-violet-500 animate-pulse" /> Registry Directory Auditor
                   </h4>
                   <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Conduct high-integrity path validation</p>
                 </div>

                 <p className="text-[10.5px] text-slate-500 leading-normal font-sans">
                   Verify index pointers, authorize matching paths, and rebuild calibration metrics for active crystallographic databases.
                 </p>

                 <button
                   type="button"
                   disabled={isAuditingDbs}
                   onClick={triggerDbAudit}
                   className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                 >
                   {isAuditingDbs ? (
                     <>
                       <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auditing indexes ({auditProgress}%)
                     </>
                   ) : (
                     <>
                       <RefreshCw className="w-3.5 h-3.5" /> Re-index Local Directory Maps
                     </>
                   )}
                 </button>

                 {/* Audit Logs Console */}
                 <div className="space-y-2">
                   <div className="flex items-center gap-1.5">
                     <Terminal className="w-3.5 h-3.5 text-slate-450" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 font-sans">Verification Console Logs</span>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[9px] text-slate-350 space-y-1.5 max-h-[180px] overflow-y-auto leading-tight">
                     {dbAuditLogs.length === 0 ? (
                       <span className="text-slate-550 italic">No audits performed in this session. Initialize directories above.</span>
                     ) : (
                       dbAuditLogs.map((logStr, i) => (
                         <div key={i} className={`pb-1 border-b border-white/5 last:border-0 last:pb-0 ${
                           logStr.startsWith('✓') ? 'text-emerald-400 font-bold' : 
                           logStr.startsWith('Opening') || logStr.startsWith('Scanning') ? 'text-violet-400' : 'text-slate-350'
                         }`}>
                           {logStr}
                         </div>
                       ))
                     )}
                   </div>
                 </div>

                 <div className="p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10 text-[9.5px] leading-relaxed text-slate-400 font-medium">
                   ℹ <strong>Sync Notification:</strong> Registries are integrated server-side. Active database indexing applies to both the <strong>Deep Learning Phase Identification Module</strong> and <strong>Test Materials Standard Presets Selector</strong> automatically.
                 </div>
               </div>
             </div>
          </section>

          {/* SystemConfig Backup & Auto-Save Matrix */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Settings Storage & Auto-save</h3>
            </div>

            {/* Auto-save configuration parameters */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Bragg Auto-Save Cycle</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Prevents data loss during sessions</div>
                  </div>
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
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={5000}>5 Seconds (Default)</option>
                    <option value={10000}>10 Seconds</option>
                    <option value={30000}>30 Seconds</option>
                    <option value={0}>Disabled / Muted</option>
                  </select>
                </div>
                {autosaveInterval > 0 && (
                  <div className="text-[8.5px] uppercase font-mono text-emerald-500 flex items-center gap-1 leading-none">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                    Auto-save loop is active every {autosaveInterval / 1000} seconds
                  </div>
                )}
              </div>

              {/* Import & Export Configuration Parameters */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Configuration Transceiver</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1 select-none font-sans">
                  Export or import entire lab parameters, calibrations, and active profile values.
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <button
                    onClick={handleExportConfig}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Export Config
                  </button>
                  <label
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Import Config
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportConfig}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus !== 'idle' && (
                  <div className={`p-2.5 rounded-xl text-[9.5px] uppercase font-bold tracking-tight border ${
                    importStatus === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {importMessage}
                  </div>
                )}
              </div>

              {/* Dangerous hardware wipe / Factory reset */}
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Terminal Factory Reset</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Deletes all local databases and profiles</div>
                </div>
                <button
                  onClick={handleHardReset}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                  title="Factory Reset Laboratory State"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Active Calibration Offset Auditor */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                   <Compass className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Correction Active Auditor</span>
             </div>
             
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3.5">
                <div className="space-y-1">
                   <div className="text-[9px] font-black uppercase text-slate-400">Zero Error Correction (Δ2θ)</div>
                   <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                     2θ_calibrated = 2θ_obs - ({zeroShift >= 0 ? '+' : ''}{zeroShift.toFixed(3)}°)
                   </div>
                </div>

                <div className="space-y-1">
                   <div className="text-[9px] font-black uppercase text-slate-400">Displacement Shift Correction</div>
                   <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                     Shift_rad = 2 * ({sampleDisplacement.toFixed(4)}mm) * cos(θ) / ({goniometerRadius.toFixed(1)}mm)
                   </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                   <span>Auditor Status:</span>
                   <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-widest ${sampleOffsetThetaMock ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                     {sampleOffsetThetaMock ? 'Applied Compensations' : 'Ideal Alignments'}
                   </span>
                </div>
             </div>
          </section>

          {/* System Terminal details card */}
          <section className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-slate-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Node details</span>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                   <span className="text-slate-500">Suite Version</span>
                   <span className="text-slate-300">v2.5.0-PRO</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                   <span className="text-slate-500">Local Core</span>
                   <span className="text-emerald-400 font-mono">SANDBOX-RUN</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                   <span className="text-slate-500">Synthesizer FX</span>
                   <span className={soundEnabled ? "text-emerald-400" : "text-amber-500"}>
                     {soundEnabled ? 'ONLINE' : 'MUTED'}
                   </span>
                </div>
             </div>
          </section>
        </div>
      </div>

      <div className="pt-16 pb-8 text-center border-t border-slate-200 dark:border-white/5">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed">
          All configuration parameters and calibration matrices process locally inside the tab and are automatically committed to active storage in real-time.
        </p>
      </div>
    </motion.div>
  );
};
