import React, { useState, useRef, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Trash2,
  Copy,
  Check,
  Code2,
  Sparkles,
  Layers,
  HelpCircle,
  FolderOpen,
  ClipboardPaste,
  CheckCircle2,
  Table as TableIcon,
  Plus,
  X,
  Sliders,
  AlignLeft,
  Terminal,
  Hash,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  Info,
  Microscope,
  FileSpreadsheet
} from 'lucide-react';
import { FORMAT_PRESETS, FormatPreset } from './ScientificFormatMenuBar';

interface ReflectionRow {
  twoTheta: string;
  intensity: string;
  h?: string;
  k?: string;
  l?: string;
  hklTuple?: string;
  fwhm?: string;
}

interface ScientificDataIngestionConsoleProps {
  inputData: string;
  setInputData: (data: string) => void;
  selectedFormat: string;
  setSelectedFormat: (formatId: string) => void;
  playSynthTone: (tone: any) => void;
  isMixMode: boolean;
  setIsMixMode: (val: boolean) => void;
  mixtureList: string[];
  setMixtureList: (list: string[]) => void;
  generateMixturePattern: (list: string[]) => void;
  setShowFormatGuide: (show: boolean) => void;
}

export const ScientificDataIngestionConsole: React.FC<ScientificDataIngestionConsoleProps> = ({
  inputData,
  setInputData,
  selectedFormat,
  setSelectedFormat,
  playSynthTone,
  isMixMode,
  setIsMixMode,
  mixtureList,
  setMixtureList,
  generateMixturePattern,
  setShowFormatGuide
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'table' | 'upload'>('editor');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputId = useId();

  const activePreset = FORMAT_PRESETS.find((p) => p.id === selectedFormat) || FORMAT_PRESETS[0];

  // Parse lines to rows for the interactive table
  const parseDataToRows = (text: string, formatId: string): ReflectionRow[] => {
    if (!text) return [];
    const lines = text.split('\n');
    const rows: ReflectionRow[] = [];

    for (const rawLine of lines) {
      let line = (rawLine || '').trim();
      if (!line) continue;
      if (
        line.startsWith('#') ||
        line.startsWith('//') ||
        line.startsWith(';') ||
        line.startsWith('!') ||
        line.startsWith('*') ||
        line.startsWith('_') ||
        line.toLowerCase().startsWith('loop_')
      ) {
        continue;
      }

      // Check for parenthesized hkl
      let extractedTuple = '';
      const parenthesizedHklMatch = line.match(/[\(\[]\s*(-?\d+)[\s,]+(-?\d+)[\s,]+(-?\d+)\s*[\)\]]/);
      if (parenthesizedHklMatch) {
        extractedTuple = `(${parenthesizedHklMatch[1]} ${parenthesizedHklMatch[2]} ${parenthesizedHklMatch[3]})`;
        line = line.replace(parenthesizedHklMatch[0], ' ');
      }

      const tokens = line.split(/[\s,;\t]+/).filter((v) => v !== '');
      if (tokens.length < 2) continue;

      const firstNum = parseFloat(tokens[0]);
      if (isNaN(firstNum)) continue; // Header row

      const twoTheta = tokens[0];
      const intensity = tokens[1];

      let h = '';
      let k = '';
      let l = '';
      let fwhm = '';

      if (tokens.length >= 5) {
        h = tokens[2];
        k = tokens[3];
        l = tokens[4];
        if (tokens.length >= 6) {
          fwhm = tokens[5];
        }
      } else if (tokens.length === 3) {
        if (extractedTuple) {
          // already has tuple
        } else {
          // might be 3rd token is tuple or fwhm
          if (tokens[2].startsWith('(')) {
            extractedTuple = tokens[2];
          } else {
            fwhm = tokens[2];
          }
        }
      }

      rows.push({
        twoTheta,
        intensity,
        h,
        k,
        l,
        hklTuple: extractedTuple || (h && k && l ? `(${h} ${k} ${l})` : ''),
        fwhm
      });
    }

    return rows;
  };

  // Convert table rows back to serialized string in active format
  const serializeRowsToText = (rows: ReflectionRow[], formatId: string): string => {
    const header = activePreset.headerComment;
    const bodyLines = rows.map((r) => {
      const tt = r.twoTheta.trim() || '0.0';
      const int = r.intensity.trim() || '0.0';

      if (formatId === '2col') {
        return `${tt}, ${int}`;
      } else if (formatId === '5col' || formatId === 'lab6_srm') {
        const h = r.h?.trim() || '0';
        const k = r.k?.trim() || '0';
        const l = r.l?.trim() || '0';
        return `${tt}, ${int}, ${h}, ${k}, ${l}`;
      } else if (formatId === '3col') {
        const tuple = r.hklTuple?.trim() || (r.h && r.k && r.l ? `(${r.h} ${r.k} ${r.l})` : '(1 1 1)');
        return `${tt}, ${int}, ${tuple}`;
      } else if (formatId === 'fwhm_profile') {
        const h = r.h?.trim() || '0';
        const k = r.k?.trim() || '0';
        const l = r.l?.trim() || '0';
        const fwhm = r.fwhm?.trim() || '0.15';
        return `${tt}, ${int}, ${h}, ${k}, ${l}, ${fwhm}`;
      }
      return `${tt}, ${int}`;
    });

    return `${header}\n${bodyLines.join('\n')}`;
  };

  const [tableRows, setTableRows] = useState<ReflectionRow[]>(() =>
    parseDataToRows(inputData, selectedFormat)
  );

  // Sync internal table state when inputData changes externally
  useEffect(() => {
    setTableRows(parseDataToRows(inputData, selectedFormat));
  }, [inputData, selectedFormat]);

  const handleUpdateCell = (index: number, field: keyof ReflectionRow, value: string) => {
    const updated = [...tableRows];
    updated[index] = { ...updated[index], [field]: value };
    setTableRows(updated);
    const serialized = serializeRowsToText(updated, selectedFormat);
    setInputData(serialized);
  };

  const handleAddRow = () => {
    const lastRow = tableRows[tableRows.length - 1];
    const newTwoTheta = lastRow ? (parseFloat(lastRow.twoTheta) + 5.0).toFixed(2) : '20.00';
    const newRow: ReflectionRow = {
      twoTheta: newTwoTheta,
      intensity: '50.0',
      h: '1',
      k: '1',
      l: '1',
      hklTuple: '(1 1 1)',
      fwhm: '0.15'
    };
    const updated = [...tableRows, newRow];
    setTableRows(updated);
    setInputData(serializeRowsToText(updated, selectedFormat));
    playSynthTone('switch');
  };

  const handleDeleteRow = (index: number) => {
    const updated = tableRows.filter((_, i) => i !== index);
    setTableRows(updated);
    setInputData(serializeRowsToText(updated, selectedFormat));
    playSynthTone('switch');
  };

  // Compute live statistics
  const lines = inputData ? inputData.split('\n') : [];
  const validDataLines = lines.filter((l) => {
    const t = l.trim();
    return (
      t &&
      !t.startsWith('#') &&
      !t.startsWith('//') &&
      !t.startsWith('_') &&
      !t.startsWith(';') &&
      !t.startsWith('!') &&
      !t.startsWith('*')
    );
  });
  const lineCount = lines.length;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputData(content);
        setActiveTab('editor');
        playSynthTone('success');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputData(text);
        setActiveTab('editor');
        playSynthTone('success');
      }
    } catch {
      // Fallback
    }
  };

  const handleInsertHeaderOnly = () => {
    const header = activePreset.headerComment;
    if (!inputData.trim()) {
      setInputData(header + '\n');
    } else if (!inputData.includes(header)) {
      setInputData(`${header}\n${inputData}`);
    }
    playSynthTone('switch');
  };

  const handleFormatClean = () => {
    if (!inputData) return;
    const cleaned = inputData
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join('\n');
    setInputData(cleaned);
    playSynthTone('switch');
  };

  const handleLoadDemoForActiveFormat = () => {
    setInputData(activePreset.sampleData);
    playSynthTone('success');
  };

  return (
    <div className="w-full space-y-3">
      {/* SCIENTIFIC INGESTION TERMINAL FRAME */}
      <div
        className={`relative bg-[#050A16] border rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isDragOver
            ? 'border-indigo-400 ring-2 ring-indigo-500/40 bg-indigo-950/20'
            : inputData
            ? 'border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.12)]'
            : 'border-slate-700/80 hover:border-slate-600'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
      >
        {/* Hidden File Input */}
        <input
          id={fileInputId}
          aria-label="Upload XRD data file"
          ref={fileInputRef}
          type="file"
          accept=".xy,.csv,.dat,.txt,.cif,.ras,.xrdml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />

        {/* 1. TOP SCIENTIFIC TERMINAL HEADER */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#081024] border-b border-slate-800 text-xs font-mono gap-2">
          {/* Left: Synchronized View Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Matrix Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  activeTab === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Interactive Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>File Ingest</span>
              </button>
            </div>

            {/* Active Schema Sync Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-[10.5px]">
              <span className="text-slate-400">Synced:</span>
              <span className="font-bold text-indigo-300">{activePreset.shortLabel}</span>
            </div>

            {/* Reflection Counter Badge */}
            {validDataLines.length > 0 ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {validDataLines.length} Peaks Parsed
              </span>
            ) : (
              <span className="hidden lg:inline-flex items-center gap-1 text-slate-500 text-[10.5px]">
                <Terminal className="w-3 h-3" /> Ready for diffraction data stream
              </span>
            )}
          </div>

          {/* Right: Format Specific Tools & Ingestion Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInsertHeaderOnly}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-colors"
              title="Insert format schema header comment without sample data"
            >
              <Hash className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">+ Header</span>
            </button>

            <button
              type="button"
              onClick={handleLoadDemoForActiveFormat}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-colors"
              title="Load example pattern values for this active format"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Load Demo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-colors"
              title="Import .xy, .csv, .dat file from disk"
            >
              <Upload className="w-3 h-3 text-indigo-400" />
              <span className="hidden md:inline">Import</span>
            </button>

            <button
              type="button"
              onClick={handlePasteClipboard}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-colors"
              title="Paste from clipboard"
            >
              <ClipboardPaste className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline">Paste</span>
            </button>

            {inputData && (
              <>
                <button
                  type="button"
                  onClick={handleFormatClean}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-colors"
                  title="Format whitespace and trim lines"
                >
                  <AlignLeft className="w-3 h-3 text-emerald-400" />
                  <span className="hidden md:inline">Clean</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputData('');
                    setTableRows([]);
                    playSynthTone('switch');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                  title="Clear all data"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. BODY CONTAINER: DYNAMIC PER ACTIVE TAB */}
        {activeTab === 'upload' ? (
          /* Dedicated Upload & Drag-Drop State */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3 group-hover:scale-110 shadow-lg shadow-indigo-950/50 transition-all">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-200 mb-1">
              Select or Drop Diffraction Dataset File
            </h4>
            <p className="text-xs text-slate-400 max-w-md mb-4 font-sans leading-relaxed">
              Auto-maps continuous diffractograms or discrete peak lists to the active{' '}
              <strong className="text-indigo-300">{activePreset.name}</strong> schema.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10.5px] font-mono text-slate-300">
                .XY / .DAT (ASCII)
              </span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10.5px] font-mono text-slate-300">
                .CSV / .TSV (Delimited)
              </span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10.5px] font-mono text-slate-300">
                .CIF / .XRDML
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Browse Files</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadDemoForActiveFormat();
                  setActiveTab('editor');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-colors"
              >
                Load {activePreset.shortLabel} Demo
              </button>
            </div>
          </div>
        ) : activeTab === 'table' ? (
          /* Interactive Grid Spreadsheet Mode Synchronized with Selected Format */
          <div className="p-3 bg-[#030712] min-h-[220px] max-h-[360px] overflow-auto custom-scrollbar">
            {tableRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-3 rounded-full bg-slate-800 border border-slate-700 text-slate-400 mb-2">
                  <TableIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <h5 className="text-xs font-bold text-slate-300 mb-1">
                  Interactive Grid Empty for {activePreset.shortLabel}
                </h5>
                <p className="text-[11px] text-slate-500 max-w-sm font-sans mb-3">
                  Add custom peak rows or load demo values matching the {activePreset.name} schema.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Reflection Row</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoForActiveFormat}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-colors"
                  >
                    Load Demo Rows
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-2">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                      <th className="p-2 w-10 text-center text-[10px] uppercase font-bold text-slate-500">
                        #
                      </th>
                      <th className="p-2 text-emerald-400 font-bold">2θ (deg)</th>
                      <th className="p-2 text-violet-400 font-bold">Intensity (a.u.)</th>

                      {/* Dynamic Columns based on Selected Format */}
                      {(selectedFormat === '5col' ||
                        selectedFormat === 'fwhm_profile' ||
                        selectedFormat === 'lab6_srm') && (
                        <>
                          <th className="p-2 text-cyan-400 font-bold w-16 text-center">h</th>
                          <th className="p-2 text-cyan-400 font-bold w-16 text-center">k</th>
                          <th className="p-2 text-cyan-400 font-bold w-16 text-center">l</th>
                        </>
                      )}

                      {selectedFormat === '3col' && (
                        <th className="p-2 text-cyan-400 font-bold">(h k l) Tuple</th>
                      )}

                      {selectedFormat === 'fwhm_profile' && (
                        <th className="p-2 text-amber-400 font-bold">FWHM β (deg)</th>
                      )}

                      <th className="p-2 w-12 text-center text-[10px] uppercase font-bold text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tableRows.map((row, rIdx) => (
                      <tr
                        key={`row-${rIdx}`}
                        className="hover:bg-indigo-950/20 group transition-colors"
                      >
                        <td className="p-1.5 text-center text-slate-600 text-[11px] font-bold select-none">
                          {rIdx + 1}
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.twoTheta}
                            onChange={(e) => handleUpdateCell(rIdx, 'twoTheta', e.target.value)}
                            className="w-full bg-[#070E1E] border border-slate-700/80 rounded px-2 py-1 text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none text-xs"
                            placeholder="28.44"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.intensity}
                            onChange={(e) => handleUpdateCell(rIdx, 'intensity', e.target.value)}
                            className="w-full bg-[#070E1E] border border-slate-700/80 rounded px-2 py-1 text-violet-300 font-bold focus:border-violet-400 focus:outline-none text-xs"
                            placeholder="100.0"
                          />
                        </td>

                        {/* Miller Indices for 5-col & Profile */}
                        {(selectedFormat === '5col' ||
                          selectedFormat === 'fwhm_profile' ||
                          selectedFormat === 'lab6_srm') && (
                          <>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.h ?? ''}
                                onChange={(e) => handleUpdateCell(rIdx, 'h', e.target.value)}
                                className="w-full text-center bg-[#070E1E] border border-slate-700/80 rounded px-1.5 py-1 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none text-xs"
                                placeholder="1"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.k ?? ''}
                                onChange={(e) => handleUpdateCell(rIdx, 'k', e.target.value)}
                                className="w-full text-center bg-[#070E1E] border border-slate-700/80 rounded px-1.5 py-1 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none text-xs"
                                placeholder="1"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.l ?? ''}
                                onChange={(e) => handleUpdateCell(rIdx, 'l', e.target.value)}
                                className="w-full text-center bg-[#070E1E] border border-slate-700/80 rounded px-1.5 py-1 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none text-xs"
                                placeholder="1"
                              />
                            </td>
                          </>
                        )}

                        {/* 3-Col Tuple */}
                        {selectedFormat === '3col' && (
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.hklTuple ?? ''}
                              onChange={(e) => handleUpdateCell(rIdx, 'hklTuple', e.target.value)}
                              className="w-full bg-[#070E1E] border border-slate-700/80 rounded px-2 py-1 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none text-xs"
                              placeholder="(1 1 1)"
                            />
                          </td>
                        )}

                        {/* FWHM Profile */}
                        {selectedFormat === 'fwhm_profile' && (
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.fwhm ?? ''}
                              onChange={(e) => handleUpdateCell(rIdx, 'fwhm', e.target.value)}
                              className="w-full bg-[#070E1E] border border-slate-700/80 rounded px-2 py-1 text-amber-300 font-bold focus:border-amber-400 focus:outline-none text-xs"
                              placeholder="0.15"
                            />
                          </td>
                        )}

                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete this row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Table Footer: Add Row & Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Reflection Row</span>
                  </button>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Total: <strong className="text-white">{tableRows.length}</strong> reflections in table
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Scientific Code / Matrix Editor with Line Numbers */
          <div className="relative flex min-h-[190px] max-h-[320px]">
            {/* Line Number Gutter */}
            <div className="select-none py-3 px-2 bg-[#030712] border-r border-slate-800/80 text-right text-[11px] font-mono text-slate-600 space-y-1 w-10 shrink-0 overflow-hidden">
              {Array.from({ length: Math.max(lineCount || 1, 8) }).map((_, i) => (
                <div key={i} className="leading-[1.6]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Empty State Helper when no data exists */}
            {!inputData && (
              <div className="absolute inset-0 left-10 flex flex-col items-center justify-center pointer-events-none p-4 text-center z-0">
                <div className="p-2.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 mb-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-xs font-bold text-slate-200">
                  Ready for {activePreset.name} Data Stream
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono max-w-sm">
                  Columns: <span className="text-indigo-300 font-bold">{activePreset.columns.join(' • ')}</span>
                </p>
                <div className="mt-3 flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleInsertHeaderOnly}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10.5px] font-mono font-bold transition-all flex items-center gap-1"
                  >
                    <Hash className="w-3 h-3 text-cyan-400" />
                    <span>Insert Schema Header</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoForActiveFormat}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 text-[10.5px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Load Demo Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Matrix Textarea */}
            <textarea
              ref={textareaRef}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder=""
              className="w-full py-3 px-4 bg-transparent text-slate-200 focus:ring-0 outline-none font-mono text-[12.5px] leading-[1.6] resize-y custom-scrollbar z-10 relative selection:bg-indigo-500/30"
              spellCheck={false}
            />
          </div>
        )}

        {/* 3. SCIENTIFIC INGESTION FOOTER STATUS */}
        <div className="px-3 py-2 bg-[#030712] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          {/* Dynamic Column Schema Matching Selected Format */}
          <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Active Columns:
            </span>
            {activePreset.columns.map((col, cIdx) => (
              <React.Fragment key={`col-${cIdx}`}>
                {cIdx > 0 && <span className="text-slate-600">→</span>}
                <span
                  className={`px-1.5 py-0.5 rounded border font-bold text-[10.5px] ${
                    cIdx === 0
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : cIdx === 1
                      ? 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                      : cIdx === 5
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                  }`}
                >
                  {col}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFormatGuide(true)}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline underline-offset-2"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Specs Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MULTIPHASE MIXTURE MODE TOGGLE & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsMixMode(!isMixMode);
              if (!isMixMode) setMixtureList([]);
              playSynthTone('switch');
            }}
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all border ${
              isMixMode
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isMixMode ? 'Multiphase Mixture ACTIVE' : 'Enable Multiphase Mix Mode'}</span>
          </button>

          {validDataLines.length > 0 && (
            <div className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>{validDataLines.length} Peak Positions Resolvable</span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Neural Architecture: <span className="text-slate-300 font-bold">Deep MLP / ResNet-XRD</span>
        </div>
      </div>

      {/* Multiphase Mixture Active Tags */}
      {isMixMode && mixtureList.length > 0 && (
        <div className="p-3.5 bg-slate-900/80 border border-indigo-500/30 rounded-xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-2.5 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Constituent Phases in Synthetic Mixture</span>
            </span>
            <button
              type="button"
              onClick={() => setMixtureList([])}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Reset All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mixtureList.map((m, mIdx) => (
              <div
                key={`mix-${m}-${mIdx}`}
                className="flex items-center gap-2 bg-[#050A14] border border-indigo-500/50 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300 shadow-sm"
              >
                <span>{m}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nl = mixtureList.filter((x) => x !== m);
                    setMixtureList(nl);
                    generateMixturePattern(nl);
                  }}
                  className="hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5 text-rose-500/80 hover:text-rose-400 transition-colors" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
