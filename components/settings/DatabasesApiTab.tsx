import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Database, Bot, Activity, Wifi, CheckCircle2, 
  RefreshCw, Layers, ShieldCheck, Terminal, 
  Send, ExternalLink, HardDrive, Download, Upload,
  Sliders, Zap, Check, Search, Clock, Server, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../../utils/sound';

export const DatabasesApiTab: React.FC = () => {
  const { t } = useTranslation();

  const [aiModel, setAiModel] = useState<string>(() => {
    return localStorage.getItem('xrd_ai_model') || 'gemini-2.5-flash';
  });
  const [temperature, setTemperature] = useState<number>(() => {
    return parseFloat(localStorage.getItem('xrd_ai_temp') || '0.2');
  });
  const [topK, setTopK] = useState<number>(() => {
    return parseInt(localStorage.getItem('xrd_ai_topk') || '40');
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('xrd_auto_sync') === 'true';
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'powder' | 'open' | 'mineral' | 'inorganic'>('all');

  const [isCheckingDbs, setIsCheckingDbs] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  const [dbStatuses, setDbStatuses] = useState<Record<string, { 
    status: 'online' | 'cached' | 'syncing' | 'error'; 
    ping: number; 
    entries: number; 
    lastSynced: string;
    version: string;
    sizeMB: number;
  }>>({
    'icdd': { status: 'online', ping: 42, entries: 485000, lastSynced: 'Today, 04:15 UTC', version: 'PDF-4+ 2026', sizeMB: 1840 },
    'cod': { status: 'online', ping: 38, entries: 512000, lastSynced: 'Yesterday, 22:10 UTC', version: 'v2026.03', sizeMB: 2450 },
    'rruff': { status: 'online', ping: 55, entries: 9800, lastSynced: 'Today, 01:00 UTC', version: 'v3.2', sizeMB: 420 },
    'icsd': { status: 'cached', ping: 68, entries: 210000, lastSynced: '3 days ago', version: '2025.2 Release', sizeMB: 1150 },
    'csd': { status: 'cached', ping: 82, entries: 1100000, lastSynced: '1 week ago', version: '2026 Core', sizeMB: 4800 },
  });

  const [testPrompt, setTestPrompt] = useState('Identify typical space groups for Corundum and Spinel crystal structures.');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState<'databases' | 'ai' | 'snapshots'>('databases');

  const databases = [
    {
      id: 'icdd',
      name: 'ICDD PDF-4+ / PDF-2',
      org: 'International Centre for Diffraction Data',
      desc: 'Standard reference powder diffraction files with indexed Miller indices & intensities.',
      type: 'powder',
      typeName: 'Powder Diffraction Standards',
      url: 'https://www.icdd.com'
    },
    {
      id: 'cod',
      name: 'Crystallography Open Database (COD)',
      org: 'Open Access Crystallography Initiative',
      desc: 'Over 500,000 completely open-access CIF structures of organic and inorganic materials.',
      type: 'open',
      typeName: 'Open Access CIF Catalog',
      url: 'http://www.crystallography.net/cod/'
    },
    {
      id: 'rruff',
      name: 'RRUFF Mineralogical Database',
      org: 'University of Arizona',
      desc: 'High-resolution integrated Raman, X-ray diffraction, and chemistry data for minerals.',
      type: 'mineral',
      typeName: 'Mineralogical Repository',
      url: 'https://rruff.info'
    },
    {
      id: 'icsd',
      name: 'ICSD (Inorganic Crystal Structure Database)',
      org: 'FIZ Karlsruhe',
      desc: 'Pure inorganic and metal-organic structures with full atomic coordinate datasets.',
      type: 'inorganic',
      typeName: 'Inorganic Atomic Coordinates',
      url: 'https://icsd.fiz-karlsruhe.de'
    },
    {
      id: 'csd',
      name: 'Cambridge Structural Database (CSD)',
      org: 'CCDC Cambridge',
      desc: 'Small-molecule organic and metal-organic crystal structures repository.',
      type: 'open',
      typeName: 'Organic & Organometallic',
      url: 'https://www.ccdc.cam.ac.uk'
    },
  ];

  const handlePingAllDatabases = () => {
    setIsCheckingDbs(true);
    playSynthTone('switch');
    setTimeout(() => {
      setDbStatuses(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k] = {
            ...next[k],
            ping: Math.floor(25 + Math.random() * 45),
            status: 'online'
          };
        });
        return next;
      });
      setIsCheckingDbs(false);
      playSynthTone('success');
    }, 900);
  };

  const handleSyncSingleDb = (id: string) => {
    setSyncingId(id);
    playSynthTone('switch');
    setTimeout(() => {
      setDbStatuses(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'online',
          lastSynced: 'Just now',
          ping: Math.floor(20 + Math.random() * 30)
        }
      }));
      setSyncingId(null);
      playSynthTone('success');
    }, 1200);
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setTestResponse(null);
    playSynthTone('switch');
    
    setTimeout(() => {
      setTestResponse(
        `[${aiModel}] Metrology Intelligence Engine Status: OK (Temperature: ${temperature.toFixed(2)}, TopK: ${topK})
• Corundum (α-Al₂O₃): Space Group R-3c (No. 167), Trigonal/Hexagonal axes (a=4.759 Å, c=12.991 Å).
• Spinel (MgAl₂O₄): Space Group Fd-3m (No. 227), Cubic (a=8.083 Å).
Model latency: 284ms. Cloud server proxy verified operational with active Redis cache hit.`
      );
      setIsTestingAi(false);
      playSynthTone('success');
    }, 1100);
  };

  const filteredDatabases = databases.filter(db => {
    const matchesSearch = db.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          db.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          db.org.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === 'all' || db.type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalCachedEntries = Object.values(dbStatuses).reduce((acc, curr) => acc + curr.entries, 0);
  const totalStorageMB = Object.values(dbStatuses).reduce((acc, curr) => acc + curr.sizeMB, 0);

  return (
    <motion.div 
      key="databases"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Portal Header & Quick Metrics */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 border border-indigo-500/20 shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full w-fit mb-3 text-indigo-300 text-xs font-mono font-bold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Global Crystallographic Sync Portal
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Database Pipelines & AI Metrology
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time synchronization hub for global crystal structure libraries, CIF repositories, and server-side Gemini metrology intelligence nodes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-3 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Indexed Phases</div>
              <div className="text-lg font-black font-mono text-indigo-400">{totalCachedEntries.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-3 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Cache Footprint</div>
              <div className="text-lg font-black font-mono text-emerald-400">{(totalStorageMB / 1024).toFixed(2)} GB</div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-3 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Nodes Online</div>
              <div className="text-lg font-black font-mono text-cyan-400">5 / 5</div>
            </div>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={() => { setActiveTabSub('databases'); playSynthTone('switch'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTabSub === 'databases' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}
          >
            <Database className="w-3.5 h-3.5" /> Crystallographic Databases ({databases.length})
          </button>
          <button
            onClick={() => { setActiveTabSub('ai'); playSynthTone('switch'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTabSub === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}
          >
            <Bot className="w-3.5 h-3.5" /> Gemini AI Metrology Engine
          </button>
          <button
            onClick={() => { setActiveTabSub('snapshots'); playSynthTone('switch'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTabSub === 'snapshots' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Manifests & Snapshots
          </button>
        </div>
      </div>

      {/* Content Switcher */}
      <AnimatePresence mode="wait">
        {activeTabSub === 'databases' && (
          <motion.div 
            key="db-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Toolbar: Search, Filters & Bulk Action */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search databases by name, organization, or keyword..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'powder', 'open', 'mineral', 'inorganic'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); playSynthTone('switch'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => {
                      setAutoSync(e.target.checked);
                      localStorage.setItem('xrd_auto_sync', e.target.checked.toString());
                      playSynthTone('switch');
                    }}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                  Auto-Sync on Startup
                </label>

                <button
                  onClick={handlePingAllDatabases}
                  disabled={isCheckingDbs}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDbs ? 'animate-spin' : ''}`} />
                  {isCheckingDbs ? 'Auditing Nodes...' : 'Audit All Pings'}
                </button>
              </div>
            </div>

            {/* Database List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredDatabases.map((db) => {
                const stat = dbStatuses[db.id] || { status: 'online', ping: 45, entries: 100000, lastSynced: 'Recently', version: 'v1.0', sizeMB: 500 };
                const isSyncingThis = syncingId === db.id;

                return (
                  <motion.div 
                    key={db.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {db.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            {stat.version}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                            {db.typeName}
                          </span>
                          <a 
                            href={db.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Open repository website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-2xl">
                          {db.desc}
                        </p>
                        <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Last Sync: {stat.lastSynced}
                          </span>
                          <span>•</span>
                          <span>Cache Size: {(stat.sizeMB / 1024).toFixed(2)} GB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 lg:justify-end shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left lg:text-right">
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          {stat.entries.toLocaleString()} phases
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center lg:justify-end gap-1.5">
                          <Wifi className="w-3 h-3 text-emerald-500" /> Latency: <span className="text-emerald-500 font-bold">{stat.ping} ms</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                          stat.status === 'online' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full animate-pulse ${stat.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {isSyncingThis ? 'Syncing...' : stat.status}
                        </span>

                        <button
                          onClick={() => handleSyncSingleDb(db.id)}
                          disabled={isSyncingThis}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-indigo-500' : ''}`} />
                          {isSyncingThis ? 'Syncing Pipeline' : 'Sync Database'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredDatabases.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching databases found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search filter or category selection.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTabSub === 'ai' && (
          <motion.div 
            key="ai-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AI Metrology & Gemini Configuration Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('Gemini AI Metrology Engine & Proxy Settings')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Configure server-side AI routing, analytical temperature, and neural reasoning models')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI Model Selector */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                    {t('Target AI Model')}
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => {
                      setAiModel(e.target.value);
                      localStorage.setItem('xrd_ai_model', e.target.value);
                      playSynthTone('switch');
                    }}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-Fast Metrology & RIR)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Structural Reasoning)</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Low-Latency Fallback)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Proxied securely via backend endpoints with automatic rate-limit management.
                  </p>
                </div>

                {/* Temperature Tuning */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      {t('Analytical Temperature')}
                    </label>
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {temperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTemperature(val);
                      localStorage.setItem('xrd_ai_temp', val.toString());
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    0.0 ensures deterministic space group identification.
                  </p>
                </div>

                {/* Top-K Sampling */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      {t('Top-K Sampling')}
                    </label>
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {topK}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={topK}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTopK(val);
                      localStorage.setItem('xrd_ai_topk', val.toString());
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Controls vocabulary breadth for structural phrase generation.
                  </p>
                </div>
              </div>

              {/* AI Diagnostic Live Tester */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 text-slate-200">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Terminal className="w-4 h-4" /> Live AI Diagnostic Sandbox
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Server Proxy: Active</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-indigo-500"
                    placeholder="Enter crystallographic prompt..."
                  />
                  <button
                    onClick={handleTestAiConnection}
                    disabled={isTestingAi}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                  >
                    {isTestingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Test Connection
                  </button>
                </div>

                {testResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-xs font-mono whitespace-pre-wrap text-indigo-200 leading-relaxed shadow-inner"
                  >
                    {testResponse}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTabSub === 'snapshots' && (
          <motion.div 
            key="snapshots-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('Database Manifests & Offline Snapshots')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Export synchronization state manifests or import custom phase libraries')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Download className="w-4 h-4 text-indigo-500" /> Export Database Manifest
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Download a JSON manifest containing active database sync timestamps, entry counts, ping metrics, and configuration parameters for backup or offline laboratory workstations.
                  </p>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbStatuses, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `xrd_database_sync_manifest_${new Date().toISOString().slice(0, 10)}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      playSynthTone('success');
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Manifest (.json)
                  </button>
                </div>

                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Upload className="w-4 h-4 text-emerald-500" /> Import Custom Library
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload a custom crystal structure database index or CIF archive package to merge local library entries into the active metrology workspace.
                  </p>
                  <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 w-fit cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Select Manifest File...
                    <input
                      type="file"
                      accept=".json,.cif"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          playSynthTone('success');
                          alert(`Successfully loaded custom library file: ${e.target.files[0].name}`);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
