import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Shield,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  User,
  Compass,
  Sliders,
  FileSpreadsheet,
  Database,
  Cpu,
  Layers,
  Zap,
  Maximize2,
  X,
  Copy,
  Check,
  Radio,
  FileCode,
  Calendar,
  BarChart2,
  ListFilter
} from 'lucide-react';
import {
  UserActivity,
  ActivityCategory,
  getLocalActivities,
  fetchCloudActivities,
  subscribeToActivities,
  clearAllActivities,
  exportActivitiesAsJson,
  exportActivitiesAsCsv,
  syncPendingActivities,
  logActivity
} from '../services/activityLogger';
import { useAuth } from '../services/firebase';

interface UserActivityPluginProps {
  isOpen?: boolean;
  onClose?: () => void;
  floatingButtonOnly?: boolean;
}

export const UserActivityPlugin: React.FC<UserActivityPluginProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  floatingButtonOnly = false
}) => {
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (controlledOnClose && !val) {
      controlledOnClose();
    } else {
      setInternalIsOpen(val);
    }
  };

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'analytics' | 'compliance'>('feed');

  // Subscribe to live activity stream
  useEffect(() => {
    const unsub = subscribeToActivities((updated) => {
      setActivities(updated);
    });
    // Fetch initial from cloud if user is logged in
    if (user) {
      fetchCloudActivities().then(fetched => {
        setActivities(fetched);
      });
    }
    return () => unsub();
  }, [user]);

  // Sync on manual trigger
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const syncedCount = await syncPendingActivities();
      const freshCloud = await fetchCloudActivities();
      setActivities(freshCloud);
      setSyncFeedback(syncedCount > 0 ? `Synced ${syncedCount} acts to cloud` : 'All acts up to date in Firestore');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (e) {
      setSyncFeedback('Sync completed locally');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear the local activity log? This will reset local audit trails.')) {
      await clearAllActivities();
      setActivities([]);
    }
  };

  const handleCopyDetails = (act: UserActivity) => {
    navigator.clipboard.writeText(JSON.stringify(act, null, 2));
    setCopiedId(act.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Test event trigger
  const handleTestEvent = () => {
    logActivity({
      category: 'CALCULATION',
      action: 'Executed Scherrer Peak Crystallite Size Verification',
      module: 'Scherrer',
      details: {
        method: 'Scherrer Standard Formula',
        peak2Theta: 38.45,
        fwhm: 0.28,
        wavelength: 1.5406,
        crystalliteSize_nm: 31.42,
        kFactor: 0.94,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const matchesSearch =
        !searchQuery ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.module && item.module.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesMod = selectedModule === 'ALL' || item.module === selectedModule;

      return matchesSearch && matchesCat && matchesMod;
    });
  }, [activities, searchQuery, selectedCategory, selectedModule]);

  // Unique modules in logs
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.module) set.add(a.module);
    });
    return Array.from(set).sort();
  }, [activities]);

  // Analytics Metrics
  const stats = useMemo(() => {
    const total = activities.length;
    const catCounts: Record<string, number> = {};
    const modCounts: Record<string, number> = {};
    let syncedCount = 0;

    activities.forEach(a => {
      catCounts[a.category] = (catCounts[a.category] || 0) + 1;
      if (a.module) {
        modCounts[a.module] = (modCounts[a.module] || 0) + 1;
      }
      if (a.synced) syncedCount++;
    });

    const topModules = Object.entries(modCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      catCounts,
      topModules,
      syncedCount,
      syncPercentage: total > 0 ? Math.round((syncedCount / total) * 100) : 100
    };
  }, [activities]);

  const getCategoryColor = (cat: ActivityCategory) => {
    switch (cat) {
      case 'AUTH':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'NAVIGATION':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'CALCULATION':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'PARAMETER':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'EXPORT':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'AI_ANALYSIS':
        return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
      case 'DATABASE':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'SYSTEM':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryIcon = (cat: ActivityCategory) => {
    switch (cat) {
      case 'AUTH':
        return <Shield className="w-3.5 h-3.5" />;
      case 'NAVIGATION':
        return <Compass className="w-3.5 h-3.5" />;
      case 'CALCULATION':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'PARAMETER':
        return <Sliders className="w-3.5 h-3.5" />;
      case 'EXPORT':
        return <Download className="w-3.5 h-3.5" />;
      case 'AI_ANALYSIS':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'DATABASE':
        return <Database className="w-3.5 h-3.5" />;
      case 'SYSTEM':
        return <Activity className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${date} ${time}`;
    } catch {
      return ts;
    }
  };

  return (
    <>
      {/* Floating Action / Telemetry Button (when collapsed) */}
      <div className="fixed bottom-5 right-5 z-40">
        <motion.button
          id="user-activity-plugin-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 font-mono text-xs ${
            isOpen
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 hover:border-indigo-500/50 text-slate-200 shadow-black/50'
          }`}
          title="User Activity & Audit Telemetry Ledger"
        >
          <div className="relative flex items-center justify-center">
            <Activity className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-indigo-400'} animate-pulse`} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <span className="font-bold tracking-wider hidden sm:inline">Activity Ledger</span>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {activities.length}
          </span>
        </motion.button>
      </div>

      {/* Main Activity Modal / Drawer Inspector */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-5xl h-[90vh] max-h-[850px] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
            >
              {/* Top Header */}
              <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-white font-mono">
                        User Activity & Action Telemetry Plugin
                      </h2>
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Recording
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Deterministic audit log tracking logins, navigation, calculation parameters, and data exports.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
                    title="Sync with Firestore Cloud"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Sync Cloud</span>
                  </button>

                  <button
                    onClick={() => exportActivitiesAsJson(activities)}
                    className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
                    title="Export JSON Audit Ledger"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  <button
                    onClick={() => exportActivitiesAsCsv(activities)}
                    className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
                    title="Export CSV Spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-slate-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Banner (if feedback exists) */}
              {syncFeedback && (
                <div className="bg-indigo-950/70 border-b border-indigo-500/30 px-6 py-2 flex items-center justify-between text-xs font-mono text-indigo-300 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{syncFeedback}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400">Authenticated: {user?.email || 'Guest Profile'}</span>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800/80 px-4 sm:px-6 bg-slate-900/30">
                <div className="flex items-center gap-1 py-2">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'feed'
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    Action Feed ({filteredActivities.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'analytics'
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Audit Analytics & Metrics
                  </button>

                  <button
                    onClick={() => setActiveTab('compliance')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'compliance'
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Security & Firestore Status
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestEvent}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                    title="Trigger a simulated calculation event"
                  >
                    <Zap className="w-3 h-3" />
                    + Test Event
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Local
                  </button>
                </div>
              </div>

              {/* Tab 1: Action Feed */}
              {activeTab === 'feed' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Filters and Search Bar */}
                  <div className="p-4 border-b border-slate-800/80 bg-slate-950 flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search user acts, modules, parameters, or payloads..."
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1">
                      {['ALL', 'AUTH', 'NAVIGATION', 'CALCULATION', 'PARAMETER', 'EXPORT', 'AI_ANALYSIS', 'DATABASE'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap ${
                            selectedCategory === cat
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Module Filter */}
                    {availableModules.length > 0 && (
                      <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">All Modules</option>
                        {availableModules.map((m) => (
                          <option key={m} value={m}>
                            Module: {m}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Activity List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                    {filteredActivities.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                        <Activity className="w-12 h-12 stroke-[1.2] text-slate-600 mb-3" />
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono">
                          No Activity Records Found
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mt-1">
                          {searchQuery
                            ? 'No logs matched the current search query or active filter.'
                            : 'Perform calculations, switch modules, or log in to record interaction telemetry.'}
                        </p>
                      </div>
                    ) : (
                      filteredActivities.map((act) => {
                        const isExpanded = expandedActivityId === act.id;
                        let parsedDetails: any = null;
                        if (act.details) {
                          try {
                            parsedDetails = JSON.parse(act.details);
                          } catch {
                            parsedDetails = act.details;
                          }
                        }

                        return (
                          <div
                            key={act.id}
                            className={`rounded-2xl border transition-all duration-200 bg-slate-900/50 hover:bg-slate-900/80 ${
                              isExpanded ? 'border-indigo-500/50 bg-slate-900/90 shadow-lg' : 'border-slate-800/80'
                            }`}
                          >
                            {/* Card Row Header */}
                            <div
                              onClick={() => setExpandedActivityId(isExpanded ? null : act.id)}
                              className="p-3.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                            >
                              <div className="flex items-start sm:items-center gap-3 flex-1">
                                <div className={`p-1.5 rounded-xl border ${getCategoryColor(act.category)} mt-0.5 sm:mt-0`}>
                                  {getCategoryIcon(act.category)}
                                </div>

                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-slate-100 font-sans tracking-wide">
                                      {act.action}
                                    </span>
                                    {act.module && (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                        {act.module}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      {formatTimestamp(act.timestamp)}
                                    </span>

                                    {act.userEmail && (
                                      <span className="flex items-center gap-1 text-slate-400">
                                        <User className="w-3 h-3 text-slate-500" />
                                        {act.userEmail}
                                      </span>
                                    )}

                                    {act.synced ? (
                                      <span className="text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Cloud Synced
                                      </span>
                                    ) : (
                                      <span className="text-amber-400/80">Local Buffer</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyDetails(act);
                                  }}
                                  className="p-1 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Copy JSON Payload"
                                >
                                  {copiedId === act.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 font-mono text-xs animate-fadeIn">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/60 text-[11px]">
                                  <div>
                                    <span className="text-slate-500 uppercase block text-[9px]">Event ID</span>
                                    <span className="text-slate-300 font-bold break-all">{act.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase block text-[9px]">User Identity</span>
                                    <span className="text-slate-300 truncate block">
                                      {act.userName || act.userEmail || act.userId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase block text-[9px]">Client Info</span>
                                    <span className="text-slate-400 truncate block">{act.clientInfo || 'Standard Web Node'}</span>
                                  </div>
                                </div>

                                {parsedDetails && (
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                                      Action Parameters & Payload Metadata:
                                    </span>
                                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 overflow-x-auto text-[11px] text-cyan-300 font-mono max-h-48 custom-scrollbar">
                                      {typeof parsedDetails === 'object' ? (
                                        <pre>{JSON.stringify(parsedDetails, null, 2)}</pre>
                                      ) : (
                                        <p className="text-slate-300 whitespace-pre-wrap">{parsedDetails}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Analytics & Metrics */}
              {activeTab === 'analytics' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Total Acts Logged</span>
                      <span className="text-2xl font-black text-white">{stats.total}</span>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Cloud Synced</span>
                      <span className="text-2xl font-black text-emerald-400">{stats.syncedCount}</span>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Distinct Modules</span>
                      <span className="text-2xl font-black text-indigo-400">{availableModules.length}</span>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Sync Reliability</span>
                      <span className="text-2xl font-black text-cyan-400">{stats.syncPercentage}%</span>
                    </div>
                  </div>

                  {/* Actions by Category */}
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Actions Distribution by Category
                    </h4>

                    <div className="space-y-2 font-mono">
                      {Object.entries(stats.catCounts).map(([cat, count]) => {
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span className="font-bold text-slate-300">{cat}</span>
                              <span>
                                {count} acts ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Most Visited Scientific Modules */}
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Top Interaction Modules
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                      {stats.topModules.map(([mod, count]) => (
                        <div
                          key={mod}
                          className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-200">{mod}</span>
                          <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                            {count} events
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Security & Compliance */}
              {activeTab === 'compliance' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono">
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-bold uppercase text-white">
                        Attribute-Based Access Control (ABAC) Security Guard
                      </h4>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      All user activity streams are guarded under zero-trust ABAC Firestore security rules. Every event is validated for strict field boundaries, user ownership matching <code className="text-emerald-400">request.auth.uid == userId</code>, and immutable append-only constraints.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Firestore Collection</span>
                        <span className="text-slate-200 font-bold block">/userActivities/{'{activityId}'}</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Immutable Rule Constraint</span>
                        <span className="text-emerald-400 font-bold block">allow update: if false (Append-Only)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-300">
                      Compliance Audit Export
                    </h4>
                    <p className="text-xs text-slate-400 font-sans">
                      Export full laboratory session history and analytical telemetry for regulatory compliance, lab notebooks, or academic reproducibility.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => exportActivitiesAsJson(activities)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" /> Download Complete JSON Ledger
                      </button>

                      <button
                        onClick={() => exportActivitiesAsCsv(activities)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" /> Download CSV Spreadsheet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Footer Bar */}
              <div className="p-3.5 px-6 border-t border-slate-800/80 bg-slate-950 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Telemetry Engine Active: {activities.length} Recorded Acts</span>
                </div>
                <span>XRD-Calc Pro Telemetry v2.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
