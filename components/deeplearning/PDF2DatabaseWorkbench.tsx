import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  Search,
  Check,
  FileCode,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Layers,
  Award,
  ArrowUpRight,
  Copy,
  RefreshCw,
  X,
  Brain,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  PDF2CardRecord,
  PDF2NeuralMatchResult,
  CURATED_PDF2_SUBFILE_PACKS,
  buildFullPDF2Database,
  formatPDF2CardsAsJCPDS,
  formatPDF2DatabaseAsCSV,
  formatPDF2DatabaseAsCIF,
  formatPDF2DatabaseAsSQL,
  triggerDatabaseFileDownload,
  installPDF2SubfilePackToLocalDB,
  parseExternalPDF2File,
  matchScanAgainstPDF2Database,
  syncPDF2DatabaseWithNeuralNet,
  getLastPDF2NeuralSyncMetadata,
} from '../../utils/pdf2DatabaseEngine';

interface PDF2DatabaseWorkbenchProps {
  materials?: any[];
  activeScanPoints?: { twoTheta: number; intensity: number }[];
  onMaterialsUpdated?: (updatedMaterials: any[]) => void;
  onSelectCardForScan?: (card: PDF2CardRecord) => void;
  onSyncAndTrainNeuralNet?: (cards: PDF2CardRecord[], subfileLabel: string) => void;
  onClose?: () => void;
  compactMode?: boolean;
}

type WorkbenchTab = 'browse' | 'neural_sync' | 'export';

export const PDF2DatabaseWorkbench: React.FC<PDF2DatabaseWorkbenchProps> = ({
  materials,
  activeScanPoints,
  onMaterialsUpdated,
  onSelectCardForScan,
  onSyncAndTrainNeuralNet,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'ALL' | '*' | 'I' | 'C'>('ALL');
  const [subfileFilter, setSubfileFilter] = useState<string>('ALL');
  const [sortByNeuralMatch, setSortByNeuralMatch] = useState<boolean>(true);
  const [hanawaltD1Target, setHanawaltD1Target] = useState<string>('');
  const [hanawaltTolerance, setHanawaltTolerance] = useState<number>(0.08);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [showReflectionTable, setShowReflectionTable] = useState<boolean>(false);
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>('00-046-1045');
  const [installedPacks, setInstalledPacks] = useState<string[]>([]);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [localVersion, setLocalVersion] = useState(0);
  const [exportFilteredOnly, setExportFilteredOnly] = useState<boolean>(false);
  const [overlayScanOnCard, setOverlayScanOnCard] = useState<boolean>(true);

  // Neural Sync & Training state
  const [isSyncingNeural, setIsSyncingNeural] = useState(false);
  const [neuralSyncProgress, setNeuralSyncProgress] = useState(100);
  const [neuralSyncMeta, setNeuralSyncMeta] = useState(() => getLastPDF2NeuralSyncMetadata(215));

  // Listen for external PDF-2 / database sync events
  useEffect(() => {
    const handleDbUpdated = () => {
      setLocalVersion(v => v + 1);
      setNeuralSyncMeta(getLastPDF2NeuralSyncMetadata());
    };
    window.addEventListener('xrd-pdf2-db-updated', handleDbUpdated);
    window.addEventListener('material-learned', handleDbUpdated);
    return () => {
      window.removeEventListener('xrd-pdf2-db-updated', handleDbUpdated);
      window.removeEventListener('material-learned', handleDbUpdated);
    };
  }, []);

  // Build full PDF-2 card catalog from active materials
  const allPDF2Cards = useMemo(() => {
    const built = buildFullPDF2Database(materials);
    const existingNums = new Set(built.map(c => c.pdfCardNumber));
    const curatedExtras: PDF2CardRecord[] = [];
    CURATED_PDF2_SUBFILE_PACKS.forEach(pack => {
      pack.cards.forEach(c => {
        if (c.pdfCardNumber && !existingNums.has(c.pdfCardNumber)) {
          existingNums.add(c.pdfCardNumber);
          curatedExtras.push(buildFullPDF2Database([c])[0] || built[0]);
        }
      });
    });
    return [...curatedExtras, ...built];
  }, [materials, localVersion]);

  // Compute live Neural Cosine-Similarity & Hanawalt scores against the active XRD scan
  const neuralMatchMap = useMemo(() => {
    const map = new Map<string, PDF2NeuralMatchResult>();
    if (!activeScanPoints || activeScanPoints.length === 0) return map;
    const matches = matchScanAgainstPDF2Database(activeScanPoints, allPDF2Cards, allPDF2Cards.length);
    matches.forEach(m => {
      map.set(`${m.card.pdfCardNumber}_${m.card.name}`, m);
      if (!map.has(m.card.pdfCardNumber)) {
        map.set(m.card.pdfCardNumber, m);
      }
    });
    return map;
  }, [activeScanPoints, allPDF2Cards]);

  const topNeuralMatches = useMemo(() => {
    if (!activeScanPoints || activeScanPoints.length === 0) return [];
    return matchScanAgainstPDF2Database(activeScanPoints, allPDF2Cards, 4);
  }, [activeScanPoints, allPDF2Cards]);

  // Filter cards by query, quality mark, subfile, and Hanawalt d1 search
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const targetD1 = parseFloat(hanawaltD1Target);
    const hasD1Search = !isNaN(targetD1) && targetD1 > 0;

    const list = allPDF2Cards.filter(card => {
      if (qualityFilter !== 'ALL' && card.qualityMark !== qualityFilter) return false;
      if (
        subfileFilter !== 'ALL' &&
        subfileFilter !== 'NEURAL_TOP' &&
        !card.subfileCodes.some(s => s.toLowerCase().includes(subfileFilter.toLowerCase())) &&
        !card.category.toLowerCase().includes(subfileFilter.toLowerCase())
      ) {
        return false;
      }
      if (subfileFilter === 'NEURAL_TOP') {
        const match = neuralMatchMap.get(card.pdfCardNumber);
        if (!match || match.compositeNeuralScore < 20) return false;
      }
      if (hasD1Search) {
        const matchesHanawalt = card.hanawaltLines.some(
          line => Math.abs(line.dSpacing - targetD1) <= hanawaltTolerance
        );
        if (!matchesHanawalt) return false;
      }
      if (!q) return true;
      return (
        card.pdfCardNumber.toLowerCase().includes(q) ||
        card.name.toLowerCase().includes(q) ||
        card.formula.toLowerCase().includes(q) ||
        card.crystalSystem.toLowerCase().includes(q) ||
        card.spaceGroup.toLowerCase().includes(q)
      );
    });

    if (sortByNeuralMatch && neuralMatchMap.size > 0) {
      return [...list].sort((a, b) => {
        const scoreA = neuralMatchMap.get(a.pdfCardNumber)?.compositeNeuralScore ?? 0;
        const scoreB = neuralMatchMap.get(b.pdfCardNumber)?.compositeNeuralScore ?? 0;
        return scoreB - scoreA;
      });
    }
    return list;
  }, [
    allPDF2Cards,
    searchQuery,
    qualityFilter,
    subfileFilter,
    hanawaltD1Target,
    hanawaltTolerance,
    sortByNeuralMatch,
    neuralMatchMap,
  ]);

  const activeCard = useMemo(() => {
    return (
      allPDF2Cards.find(c => c.pdfCardNumber === selectedCardNumber) ||
      filteredCards[0] ||
      allPDF2Cards[0]
    );
  }, [allPDF2Cards, filteredCards, selectedCardNumber]);

  const activeCardNeuralMatch = useMemo(() => {
    if (!activeCard) return undefined;
    return (
      neuralMatchMap.get(`${activeCard.pdfCardNumber}_${activeCard.name}`) ||
      neuralMatchMap.get(activeCard.pdfCardNumber)
    );
  }, [activeCard, neuralMatchMap]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setStatusBanner({ type, message });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  // Sync PDF-2 Database with Deep Learning Neural Network
  const handleSyncWithNeuralNetwork = (cardsToSync: PDF2CardRecord[], subfileLabel: string) => {
    if (isSyncingNeural) return;
    setIsSyncingNeural(true);
    setNeuralSyncProgress(25);

    const step1 = setTimeout(() => setNeuralSyncProgress(65), 180);
    const step2 = setTimeout(() => {
      const meta = syncPDF2DatabaseWithNeuralNet({
        subfileFilter: subfileLabel,
        cards: cardsToSync,
      });
      setNeuralSyncMeta(meta);
      setNeuralSyncProgress(100);
      setIsSyncingNeural(false);

      if (onSyncAndTrainNeuralNet) {
        onSyncAndTrainNeuralNet(cardsToSync, subfileLabel);
      }

      showNotification(
        `Synced ${cardsToSync.length} PDF-2 cards into the 128-D Neural Network Dictionary & updated Phase ID!`
      );
    }, 450);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
    };
  };

  // Install curated PDF-2 Subfile Pack(s) into local offline database AND auto-sync with Neural Net
  const handleInstallPacks = (packIds: string[], label: string) => {
    const res = installPDF2SubfilePackToLocalDB(packIds);
    setInstalledPacks(prev => Array.from(new Set([...prev, ...packIds])));
    setLocalVersion(v => v + 1);
    if (onMaterialsUpdated) {
      onMaterialsUpdated(res.updatedMaterials);
    }
    const rebuiltCards = buildFullPDF2Database(res.updatedMaterials);
    const meta = syncPDF2DatabaseWithNeuralNet({
      subfileFilter: label,
      cards: rebuiltCards,
    });
    setNeuralSyncMeta(meta);

    showNotification(
      `Installed ${label} (+${res.addedCount} cards; Total: ${res.totalDatabaseCount}) & synced with Neural Network!`
    );
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setQualityFilter('ALL');
    setSubfileFilter('ALL');
    setHanawaltD1Target('');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    qualityFilter !== 'ALL' ||
    subfileFilter !== 'ALL' ||
    hanawaltD1Target.trim() !== '';

  const cardsForExport = exportFilteredOnly ? filteredCards : allPDF2Cards;

  const handleDownloadFullJSON = () => {
    const target = cardsForExport;
    const payload = {
      databaseStandard: 'ICDD PDF-2 Compatible Reference Database Export',
      version: 'Release 2026.2 (Cu Ka1 = 1.540598 A)',
      exportedAt: new Date().toISOString(),
      totalCards: target.length,
      cards: target,
    };
    const dateTag = new Date().toISOString().split('T')[0];
    triggerDatabaseFileDownload(
      JSON.stringify(payload, null, 2),
      `ICDD_PDF2_Database_${target.length}cards_${dateTag}.pdf2.json`,
      'application/json;charset=utf-8'
    );
    showNotification(`Downloaded ${target.length} PDF-2 cards as JSON (.pdf2.json).`);
  };

  const handleDownloadCSV = () => {
    const target = cardsForExport;
    const csv = formatPDF2DatabaseAsCSV(target);
    const dateTag = new Date().toISOString().split('T')[0];
    triggerDatabaseFileDownload(
      csv,
      `ICDD_PDF2_Hanawalt_Master_Index_${target.length}cards_${dateTag}.csv`,
      'text/csv;charset=utf-8'
    );
    showNotification(`Downloaded ${target.length} PDF-2 cards as Excel CSV (.csv).`);
  };

  const handleDownloadJCPDS = (cardsToExport: PDF2CardRecord[], filenamePrefix: string = 'ICDD_PDF2_Reference_Deck') => {
    const jcpds = formatPDF2CardsAsJCPDS(cardsToExport);
    const dateTag = new Date().toISOString().split('T')[0];
    triggerDatabaseFileDownload(
      jcpds,
      `${filenamePrefix}_${cardsToExport.length}cards_${dateTag}.jcpds`,
      'text/plain;charset=utf-8'
    );
    showNotification(`Downloaded ${cardsToExport.length} PDF-2 card(s) in JCPDS format (.jcpds).`);
  };

  const handleDownloadCIF = (cardsToExport: PDF2CardRecord[], filenamePrefix: string = 'ICDD_PDF2_Crystallographic_Bundle') => {
    const cif = formatPDF2DatabaseAsCIF(cardsToExport);
    const dateTag = new Date().toISOString().split('T')[0];
    triggerDatabaseFileDownload(
      cif,
      `${filenamePrefix}_${cardsToExport.length}cards_${dateTag}.cif`,
      'text/plain;charset=utf-8'
    );
    showNotification(`Downloaded ${cardsToExport.length} PDF-2 card(s) as CIF (.cif).`);
  };

  const handleDownloadSQL = () => {
    const target = cardsForExport;
    const sql = formatPDF2DatabaseAsSQL(target);
    const dateTag = new Date().toISOString().split('T')[0];
    triggerDatabaseFileDownload(
      sql,
      `ICDD_PDF2_Relational_SQLite_${target.length}cards_${dateTag}.sql`,
      'application/sql;charset=utf-8'
    );
    showNotification(`Downloaded SQLite / PostgreSQL dump (${target.length} cards).`);
  };

  const handleImportExternalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const content = String(ev.target?.result || '');
        const imported = parseExternalPDF2File(content, file.name);
        if (imported.length === 0) {
          showNotification('No valid PDF-2 or JCPDS card entries found in uploaded file.', 'info');
          return;
        }
        const currentRaw = localStorage.getItem('crystal_suite_materials_v1');
        const currentList = currentRaw ? JSON.parse(currentRaw) : materials || [];
        const merged = [...imported, ...currentList];
        localStorage.setItem('crystal_suite_materials_v1', JSON.stringify(merged));
        setLocalVersion(v => v + 1);
        if (onMaterialsUpdated) onMaterialsUpdated(merged);

        const rebuilt = buildFullPDF2Database(merged);
        const meta = syncPDF2DatabaseWithNeuralNet({
          subfileFilter: `Imported (${file.name})`,
          cards: rebuilt,
        });
        setNeuralSyncMeta(meta);

        showNotification(`Imported ${imported.length} cards from ${file.name} and synced with Neural Network!`);
      } catch (err) {
        console.error(err);
        showNotification('Failed to parse file. Supported: .pdf2.json or .jcpds.', 'info');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const qualityBadgeStyle = (q: string) => {
    if (q === '*') return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    if (q === 'I') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
    return 'bg-violet-500/15 text-violet-300 border-violet-500/40';
  };

  return (
    <div className="bg-[#080d1a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100">
      {/* Compact Header & 3-Tab Navigation Bar */}
      <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                ICDD PDF-2 Reference Database
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-mono tabular-nums font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {allPDF2Cards.length} Cards
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono tabular-nums font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Neural Synced
              </span>
            </div>
          </div>
        </div>

        {/* Clean 3-Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>1. Browse & Match Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('neural_sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'neural_sync'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>2. Neural Sync & Subfiles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>3. Download / Import DB</span>
          </button>
        </div>

        {/* Quick Sync Action & Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleSyncWithNeuralNetwork(
                filteredCards.length > 0 ? filteredCards : allPDF2Cards,
                subfileFilter === 'ALL' ? 'All PDF-2 Cards' : subfileFilter
              )
            }
            disabled={isSyncingNeural}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Embed active PDF-2 cards into Neural Network and run Phase ID"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSyncingNeural ? `Syncing (${neuralSyncProgress}%)...` : 'Sync to Neural Net'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close PDF-2 Database Manager"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div
          className={`px-5 py-2 border-b text-xs font-mono flex items-center justify-between ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
              : 'bg-cyan-950/70 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {statusBanner.message}
          </span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-5">
        {/* ===================================================================== */}
        {/* TAB 1: BROWSE & MATCH PDF-2 CARDS (DEFAULT, CLEAN 2-COLUMN WORKSPACE) */}
        {/* ===================================================================== */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {/* Compact Top-4 Neural Scan Matches Strip (only when scan is present) */}
            {topNeuralMatches.length > 0 && (
              <div className="bg-slate-900/70 border border-indigo-500/30 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    Best PDF-2 Matches for Current XRD Scan (Click to Inspect):
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ranked by 128-D Neural Cosine Similarity + Hanawalt (d₁, d₂, d₃)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {topNeuralMatches.map((match, idx) => {
                    const isCurrent = activeCard?.pdfCardNumber === match.card.pdfCardNumber;
                    return (
                      <button
                        key={`${match.card.pdfCardNumber}_${idx}`}
                        type="button"
                        onClick={() => setSelectedCardNumber(match.card.pdfCardNumber)}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'bg-indigo-500/20 border-indigo-400/60'
                            : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-amber-300 font-bold">
                            #{idx + 1} • PDF# {match.card.pdfCardNumber}
                          </div>
                          <div className="text-xs font-bold text-white truncate">{match.card.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono tabular-nums font-bold text-emerald-300">
                            {match.compositeNeuralScore.toFixed(0)}%
                          </span>
                          <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">
                            {match.card.formula}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main 2-Column Card Browser & Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Search, Category Pills & Card List (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search PDF# (00-046-1045), formula (SiO2), name..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none font-mono"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 1-Click Category Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', label: 'All Cards' },
                    ...(neuralMatchMap.size > 0 ? [{ id: 'NEURAL_TOP', label: '★ Best Scan Matches' }] : []),
                    { id: 'NBS/NIST Standard', label: 'NIST Standards' },
                    { id: 'Mineral', label: 'Minerals' },
                    { id: 'Metals & Alloys', label: 'Metals' },
                    { id: 'Ceramic', label: 'Ceramics' },
                    { id: 'Battery', label: 'Battery' },
                  ].map(sf => (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => setSubfileFilter(sf.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                        subfileFilter === sf.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {sf.label}
                    </button>
                  ))}
                </div>

                {/* Filter Status Bar + Optional Hanawalt Toggle */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>
                    Showing <strong className="text-amber-300">{filteredCards.length}</strong> of {allPDF2Cards.length} cards
                  </span>
                  <div className="flex items-center gap-3">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="text-rose-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showAdvancedFilters ? 'Hide d-Filter' : 'Filter by d-Spacing'}</span>
                      {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Hanawalt d-Spacing & Quality Filter */}
                {showAdvancedFilters && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <label className="block text-[10px] font-mono uppercase text-slate-400">
                        d-Spacing (Å) ±{hanawaltTolerance}
                      </label>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.01"
                          value={hanawaltD1Target}
                          onChange={e => setHanawaltD1Target(e.target.value)}
                          placeholder="3.343"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono tabular-nums text-amber-300 outline-none"
                        />
                        <select
                          value={hanawaltTolerance}
                          onChange={e => setHanawaltTolerance(parseFloat(e.target.value))}
                          className="bg-slate-900 border border-slate-800 rounded px-1 py-1 text-[10px] font-mono text-slate-300 outline-none"
                        >
                          <option value={0.03}>±0.03</option>
                          <option value={0.08}>±0.08</option>
                          <option value={0.15}>±0.15</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <label className="block text-[10px] font-mono uppercase text-slate-400">
                        Quality Mark
                      </label>
                      <div className="flex gap-1 mt-1">
                        {(['ALL', '*', 'I', 'C'] as const).map(qm => (
                          <button
                            key={qm}
                            type="button"
                            onClick={() => setQualityFilter(qm)}
                            className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
                              qualityFilter === qm
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {qm}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scrollable Card List */}
                <div className="h-[360px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {filteredCards.slice(0, 120).map(card => {
                    const isSelected = activeCard?.pdfCardNumber === card.pdfCardNumber && activeCard?.name === card.name;
                    const [h1, h2, h3] = card.hanawaltLines;
                    const neuralMatch =
                      neuralMatchMap.get(`${card.pdfCardNumber}_${card.name}`) ||
                      neuralMatchMap.get(card.pdfCardNumber);
                    return (
                      <button
                        key={`${card.pdfCardNumber}_${card.name}`}
                        type="button"
                        onClick={() => setSelectedCardNumber(card.pdfCardNumber)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono tabular-nums text-xs font-bold text-amber-400 shrink-0">
                              {card.pdfCardNumber}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded border ${qualityBadgeStyle(
                                card.qualityMark
                              )}`}
                            >
                              {card.qualityMark}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">{card.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {neuralMatch && neuralMatch.compositeNeuralScore >= 15 && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold border ${
                                  neuralMatch.compositeNeuralScore >= 65
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                }`}
                              >
                                {neuralMatch.compositeNeuralScore.toFixed(0)}%
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-cyan-300">{card.formula}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
                          <span>
                            d₁={h1.dSpacing.toFixed(2)}Å • d₂={h2.dSpacing.toFixed(2)}Å • d₃={h3.dSpacing.toFixed(2)}Å
                          </span>
                          <span>
                            {card.crystalSystem} ({card.spaceGroup})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Clean PDF-2 Card Inspector (7 cols) */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3.5">
                {activeCard ? (
                  <>
                    {/* Card Header & Primary Action */}
                    <div className="border-b border-slate-800 pb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono tabular-nums text-xs font-bold text-amber-300">
                            PDF# {activeCard.pdfCardNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono tabular-nums text-cyan-300">
                            {activeCard.crystalSystem} • {activeCard.spaceGroup}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono tabular-nums text-slate-300">
                            RIR (I/Ic) = {activeCard.rirValue.toFixed(2)}
                          </span>
                          {activeCardNeuralMatch && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-xs font-mono tabular-nums font-bold text-emerald-300">
                              {activeCardNeuralMatch.compositeNeuralScore.toFixed(1)}% Neural Match
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white mt-1.5">
                          {activeCard.name} <span className="text-cyan-300 font-mono">({activeCard.formula})</span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {onSelectCardForScan && (
                          <button
                            type="button"
                            onClick={() => onSelectCardForScan(activeCard)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Load Card into Neural Scan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadJCPDS([activeCard], `PDF_${activeCard.pdfCardNumber.replace(/[^0-9]/g, '_')}`)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                          title="Download single card as .JCPDS"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>.JCPDS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(formatPDF2CardsAsJCPDS([activeCard]));
                            setCopiedCard(true);
                            setTimeout(() => setCopiedCard(false), 2000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCard ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Key Metrics Row: Unit Cell + Hanawalt 3 Strongest Lines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Unit Cell Parameters</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums text-[11px] text-slate-300">
                          <div>a = <strong className="text-white">{activeCard.unitCell.a.toFixed(3)} Å</strong></div>
                          <div>b = <strong className="text-white">{activeCard.unitCell.b.toFixed(3)} Å</strong></div>
                          <div>c = <strong className="text-white">{activeCard.unitCell.c.toFixed(3)} Å</strong></div>
                          <div>V = <strong className="text-emerald-300">{activeCard.unitCell.volume.toFixed(1)} Å³</strong></div>
                          <div>Z = <strong className="text-white">{activeCard.unitCell.z}</strong></div>
                          <div>Dx = <strong className="text-emerald-300">{activeCard.densityCalc.toFixed(2)} g/cm³</strong></div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-amber-400">Hanawalt 3 Strongest Lines</div>
                        <div className="grid grid-cols-3 gap-1.5 tabular-nums">
                          {activeCard.hanawaltLines.map((line, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <div className="text-[10px] text-slate-400">
                                d<sub>{idx + 1}</sub> ({line.h}{line.k}{line.l})
                              </div>
                              <div className="text-xs font-bold text-amber-300">{line.dSpacing.toFixed(3)} Å</div>
                              <div className="text-[10px] text-slate-400">{line.twoTheta.toFixed(1)}°</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stick Diffractogram with Scan Overlay */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
                        <span>STICK PATTERN ({activeCard.radiationLabel})</span>
                        <div className="flex items-center gap-3">
                          {activeScanPoints && activeScanPoints.length > 0 && (
                            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300">
                              <input
                                type="checkbox"
                                checked={overlayScanOnCard}
                                onChange={e => setOverlayScanOnCard(e.target.checked)}
                                className="rounded accent-emerald-400"
                              />
                              <span>Overlay Active Scan</span>
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowReflectionTable(!showReflectionTable)}
                            className="text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                          >
                            {showReflectionTable
                              ? 'Hide Peak Table'
                              : `Show Peak Table (${activeCard.reflections.length})`}
                          </button>
                        </div>
                      </div>
                      <svg className="w-full h-32 bg-[#050912] rounded border border-slate-800/80" viewBox="0 0 600 110">
                        <line x1="30" y1="15" x2="585" y2="15" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="30" y1="52" x2="585" y2="52" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="30" y1="90" x2="585" y2="90" stroke="#334155" strokeWidth="1" />
                        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(ang => {
                          const x = 30 + ((ang - 5) / 95) * 555;
                          return (
                            <g key={ang}>
                              <line x1={x} y1="90" x2={x} y2="94" stroke="#475569" strokeWidth="1" />
                              <text x={x} y="105" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                                {ang}°
                              </text>
                            </g>
                          );
                        })}

                        {overlayScanOnCard &&
                          activeCardNeuralMatch?.matchedLines.map((ml, idx) => {
                            const clamped2T = Math.min(100, Math.max(5, ml.scanTwoTheta));
                            const x = 30 + ((clamped2T - 5) / 95) * 555;
                            const barH = Math.max(6, (ml.intensity / 100) * 72);
                            return (
                              <line
                                key={`scan_${idx}`}
                                x1={x}
                                y1="90"
                                x2={x}
                                y2={90 - barH}
                                stroke="#10b981"
                                strokeWidth="4"
                                strokeOpacity="0.35"
                              />
                            );
                          })}

                        {activeCard.reflections.map((r, idx) => {
                          const clamped2T = Math.min(100, Math.max(5, r.twoTheta));
                          const x = 30 + ((clamped2T - 5) / 95) * 555;
                          const barH = Math.max(3, (r.intensity / 100) * 72);
                          const yTop = 90 - barH;
                          const isMajor = r.intensity >= 45;
                          return (
                            <g key={idx}>
                              <line
                                x1={x}
                                y1="90"
                                x2={x}
                                y2={yTop}
                                stroke={isMajor ? '#f59e0b' : '#38bdf8'}
                                strokeWidth={isMajor ? '2.2' : '1.5'}
                              />
                              <circle cx={x} cy={yTop} r="2" fill={isMajor ? '#fbbf24' : '#38bdf8'} />
                              {isMajor && (
                                <text
                                  x={x}
                                  y={Math.max(11, yTop - 4)}
                                  fill="#fde68a"
                                  fontSize="7.5"
                                  fontFamily="monospace"
                                  textAnchor="middle"
                                >
                                  ({r.h}{r.k}{r.l})
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Collapsible Peak Reflection Table */}
                    {showReflectionTable && (
                      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                        <div className="max-h-44 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse font-mono tabular-nums text-xs">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase text-slate-400 sticky top-0">
                                <th className="py-1.5 px-3">#</th>
                                <th className="py-1.5 px-3">2θ (°)</th>
                                <th className="py-1.5 px-3">d (Å)</th>
                                <th className="py-1.5 px-3">Int (I/I₀)</th>
                                <th className="py-1.5 px-3">(h k l)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                              {activeCard.reflections.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/60 text-slate-200">
                                  <td className="py-1 px-3 text-slate-500">{idx + 1}</td>
                                  <td className="py-1 px-3 font-semibold text-white">{r.twoTheta.toFixed(3)}°</td>
                                  <td className="py-1 px-3 font-bold text-amber-300">{r.dSpacing.toFixed(4)} Å</td>
                                  <td className="py-1 px-3 text-cyan-300 font-bold">{r.intensity.toFixed(0)}%</td>
                                  <td className="py-1 px-3 text-indigo-300">
                                    ({r.h} {r.k} {r.l})
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: NEURAL SYNC & CURATED ICDD SUBFILE PACKS                       */}
        {/* ===================================================================== */}
        {activeTab === 'neural_sync' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900/90 to-cyan-950/40 border border-indigo-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Neural Network Dictionary Status
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono tabular-nums font-bold text-emerald-300">
                    {neuralSyncMeta.totalCardsEmbedded} Cards Embedded in z ∈ ℝ¹²⁸
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Install any ICDD Subfile pack below or click <strong>Sync & Train Neural Net</strong> to update the Deep Learning classifier with the latest reference cards.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    handleInstallPacks(
                      CURATED_PDF2_SUBFILE_PACKS.map(p => p.id),
                      'All 4 Curated ICDD PDF-2 Subfiles'
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Install All 4 ICDD Subfiles + Sync Neural Net</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {CURATED_PDF2_SUBFILE_PACKS.map(pack => {
                const isInstalled = installedPacks.includes(pack.id);
                return (
                  <div
                    key={pack.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {pack.code}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {pack.cards.length} Cards
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white leading-snug">{pack.title}</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{pack.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleInstallPacks([pack.id], pack.title)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isInstalled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {isInstalled ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Installed & Synced</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Install & Sync</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: DOWNLOAD OR IMPORT FULL PDF-2 DATABASE                         */}
        {/* ===================================================================== */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Choose Download Scope & File Format ({cardsForExport.length} Cards Ready)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setExportFilteredOnly(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer border ${
                      !exportFilteredOnly
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Full Database ({allPDF2Cards.length} Cards)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFilteredOnly(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer border ${
                      exportFilteredOnly
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Filtered Cards Only ({filteredCards.length} Cards)
                  </button>

                  <label className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Import External .JSON / .JCPDS</span>
                    <input
                      type="file"
                      accept=".json,.jcpds,.pcr,.txt"
                      onChange={handleImportExternalFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel / CSV Table
                    </span>
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Spreadsheet with Hanawalt (d₁, d₂, d₃), RIR & peak lists
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadJCPDS(cardsForExport)}
                  className="p-3.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      JADE / Match! (.JCPDS)
                    </span>
                    <Download className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Standard ASCII Reference Card Deck
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCIF(cardsForExport)}
                  className="p-3.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      Crystal Structure (.CIF)
                    </span>
                    <Download className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Multi-block CIF for VESTA, GSAS-II & FullProf
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFullJSON}
                  className="p-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" />
                      Full Backup (.JSON)
                    </span>
                    <Download className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Complete PDF-2 + Neural Dictionary JSON
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSQL}
                  className="p-3.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                      <Database className="w-4 h-4" />
                      SQLite / SQL (.SQL)
                    </span>
                    <Download className="w-4 h-4 text-violet-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Relational SQL tables & reflection indices
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
