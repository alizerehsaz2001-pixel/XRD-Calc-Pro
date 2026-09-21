import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Table, 
  FileText, 
  Sparkles, 
  Sliders, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  Upload, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Flame, 
  Binary, 
  Wand2, 
  TrendingDown, 
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { WAInputPoint, WAHarmonicDeconvolvedPoint, WAResult } from '../types';
import { parseWAInput } from '../utils/physics';

interface WarrenAverbachHarmonicsManagerProps {
  inputData: string;
  onChangeInputData: (newData: string) => void;
  d1: number;
  d2: number;
  d3?: number;
  d4?: number;
  result: WAResult | null;
  onOpenPeakConverter: () => void;
}

export const WarrenAverbachHarmonicsManager: React.FC<WarrenAverbachHarmonicsManagerProps> = ({
  inputData,
  onChangeInputData,
  d1,
  d2,
  d3,
  d4,
  result,
  onOpenPeakConverter
}) => {
  const [editorMode, setEditorMode] = useState<'grid' | 'raw_text'>('grid');
  const [copiedData, setCopiedData] = useState(false);
  const [gridGeneratorOpen, setGridGeneratorOpen] = useState(false);
  const [gridStartL, setGridStartL] = useState(1);
  const [gridEndL, setGridEndL] = useState(30);
  const [gridStepL, setGridStepL] = useState(2);
  const [gridSizeNm, setGridSizeNm] = useState(25);
  const [gridStrain, setGridStrain] = useState(0.002);

  // Parse points from inputData string
  const points: WAInputPoint[] = useMemo(() => {
    return parseWAInput(inputData);
  }, [inputData]);

  // Convert points array back to formatted text string
  const updatePoints = (newPoints: WAInputPoint[]) => {
    const hasOrder3 = d3 !== undefined && d3 > 0;
    const hasOrder4 = d4 !== undefined && d4 > 0;

    let header = '# L[nm], A(d1), A(d2)';
    if (hasOrder3 && hasOrder4) header = '# L[nm], A(d1), A(d2), A(d3), A(d4)';
    else if (hasOrder3) header = '# L[nm], A(d1), A(d2), A(d3)';

    const rows = newPoints.map(p => {
      const prefix = p.isExcluded ? '! ' : '';
      const a1 = p.A1 !== undefined ? p.A1.toFixed(4) : '1.0000';
      const a2 = p.A2 !== undefined ? p.A2.toFixed(4) : '1.0000';
      let row = `${prefix}${p.L_nm.toFixed(1)}, ${a1}, ${a2}`;
      if (hasOrder3) {
        row += `, ${(p.A3 ?? 0.001).toFixed(4)}`;
      }
      if (hasOrder4) {
        row += `, ${(p.A4 ?? 0.001).toFixed(4)}`;
      }
      return row;
    });

    onChangeInputData([header, ...rows].join('\n'));
  };

  const handleCellChange = (index: number, field: keyof WAInputPoint, value: number) => {
    const nextPoints = [...points];
    nextPoints[index] = {
      ...nextPoints[index],
      [field]: Math.max(0, value)
    };
    updatePoints(nextPoints);
  };

  const handleToggleExclude = (index: number) => {
    const nextPoints = [...points];
    nextPoints[index] = {
      ...nextPoints[index],
      isExcluded: !nextPoints[index].isExcluded
    };
    updatePoints(nextPoints);
  };

  const handleDeleteRow = (index: number) => {
    const nextPoints = points.filter((_, idx) => idx !== index);
    updatePoints(nextPoints);
  };

  const handleAddRow = () => {
    const lastL = points.length > 0 ? points[points.length - 1].L_nm : 0;
    const newL = lastL + 2;
    const newPoint: WAInputPoint = {
      L_nm: newL,
      A1: points.length > 0 ? Math.max(0.01, points[points.length - 1].A1 * 0.85) : 0.95,
      A2: points.length > 0 ? Math.max(0.01, points[points.length - 1].A2 * 0.75) : 0.90,
      A3: d3 && d3 > 0 ? 0.80 : undefined,
      A4: d4 && d4 > 0 ? 0.70 : undefined
    };
    updatePoints([...points, newPoint]);
  };

  const handleNormalizeA0 = () => {
    if (points.length === 0) return;
    const maxA1 = Math.max(...points.map(p => p.A1), 0.001);
    const maxA2 = Math.max(...points.map(p => p.A2), 0.001);
    const maxA3 = d3 ? Math.max(...points.map(p => p.A3 || 0.001), 0.001) : 1;
    const maxA4 = d4 ? Math.max(...points.map(p => p.A4 || 0.001), 0.001) : 1;

    const normalized = points.map(p => ({
      ...p,
      A1: Math.min(1.0, p.A1 / maxA1),
      A2: Math.min(1.0, p.A2 / maxA2),
      A3: p.A3 !== undefined ? Math.min(1.0, p.A3 / maxA3) : undefined,
      A4: p.A4 !== undefined ? Math.min(1.0, p.A4 / maxA4) : undefined
    }));
    updatePoints(normalized);
  };

  const handleMonotonicFilter = () => {
    if (points.length === 0) return;
    let prevA1 = 1.0;
    let prevA2 = 1.0;
    let prevA3 = 1.0;
    let prevA4 = 1.0;

    const smoothed = points.map(p => {
      const a1 = Math.min(prevA1, p.A1);
      const a2 = Math.min(prevA2, p.A2);
      const a3 = p.A3 !== undefined ? Math.min(prevA3, p.A3) : undefined;
      const a4 = p.A4 !== undefined ? Math.min(prevA4, p.A4) : undefined;

      prevA1 = a1;
      prevA2 = a2;
      if (a3 !== undefined) prevA3 = a3;
      if (a4 !== undefined) prevA4 = a4;

      return {
        ...p,
        A1: a1,
        A2: a2,
        A3: a3,
        A4: a4
      };
    });
    updatePoints(smoothed);
  };

  const handleGenerateUniformGrid = () => {
    const generated: WAInputPoint[] = [];
    const s1 = 1 / d1;
    const s2 = 1 / d2;
    const s3 = d3 ? 1 / d3 : undefined;
    const s4 = d4 ? 1 / d4 : undefined;

    for (let L = gridStartL; L <= gridEndL; L += gridStepL) {
      const sizeCoeff = Math.max(0.01, 1 - L / gridSizeNm);
      const decay1 = Math.exp(-2 * Math.PI * Math.PI * (L ** 2) * (gridStrain ** 2) * (s1 ** 2));
      const decay2 = Math.exp(-2 * Math.PI * Math.PI * (L ** 2) * (gridStrain ** 2) * (s2 ** 2));
      
      const pt: WAInputPoint = {
        L_nm: L,
        A1: Math.max(0.005, Math.min(1.0, sizeCoeff * decay1)),
        A2: Math.max(0.005, Math.min(1.0, sizeCoeff * decay2))
      };

      if (s3 !== undefined) {
        const decay3 = Math.exp(-2 * Math.PI * Math.PI * (L ** 2) * (gridStrain ** 2) * (s3 ** 2));
        pt.A3 = Math.max(0.005, Math.min(1.0, sizeCoeff * decay3));
      }
      if (s4 !== undefined) {
        const decay4 = Math.exp(-2 * Math.PI * Math.PI * (L ** 2) * (gridStrain ** 2) * (s4 ** 2));
        pt.A4 = Math.max(0.005, Math.min(1.0, sizeCoeff * decay4));
      }

      generated.push(pt);
    }

    updatePoints(generated);
    setGridGeneratorOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputData);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  const harmonicsTable = result?.harmonicsTable || [];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
      {/* Header with Mode Toggle & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Binary className="w-4 h-4" />
            </span>
            <h4 className="text-base font-semibold text-slate-100 tracking-tight">
              Fourier Harmonic Coefficients Editor
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-white/5">
              {points.length} Harmonics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Edit harmonic decay coefficients $A_n(L)$, inspect live Stokes deconvolution, and eliminate Hook effect artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setEditorMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                editorMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Spreadsheet
            </button>
            <button
              onClick={() => setEditorMode('raw_text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                editorMode === 'raw_text'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Raw Text / CSV
            </button>
          </div>

          <button
            onClick={onOpenPeakConverter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-medium transition-all"
            title="Synthesize Fourier coefficients from 2θ peak profiles or instrumental standards"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Stokes Synthesizer</span>
          </button>
        </div>
      </div>

      {/* Quick Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Add Row
          </button>
          <button
            onClick={handleNormalizeA0}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/5 transition-all"
            title="Normalize all orders so max A is 1.0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Normalize A(0)=1.0
          </button>
          <button
            onClick={handleMonotonicFilter}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/5 transition-all"
            title="Clamp unphysical positive fluctuations to enforce monotonic Fourier decay"
          >
            <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
            Enforce Decay
          </button>
          <button
            onClick={() => setGridGeneratorOpen(!gridGeneratorOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Generate Grid
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/5 transition-all"
          >
            {copiedData ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedData ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Grid Generator Expandable Panel */}
      <AnimatePresence>
        {gridGeneratorOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-slate-950/70 rounded-xl border border-indigo-500/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Parametric Harmonic Grid Generator
              </span>
              <button
                onClick={() => setGridGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Start L (nm)</label>
                <input
                  type="number"
                  value={gridStartL}
                  onChange={(e) => setGridStartL(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">End L (nm)</label>
                <input
                  type="number"
                  value={gridEndL}
                  onChange={(e) => setGridEndL(Math.max(gridStartL + 1, parseFloat(e.target.value) || 30))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Step ΔL (nm)</label>
                <input
                  type="number"
                  value={gridStepL}
                  onChange={(e) => setGridStepL(Math.max(0.5, parseFloat(e.target.value) || 2))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Domain Size (nm)</label>
                <input
                  type="number"
                  value={gridSizeNm}
                  onChange={(e) => setGridSizeNm(Math.max(5, parseFloat(e.target.value) || 25))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Microstrain ⟨ε²⟩½</label>
                <input
                  type="number"
                  step="0.0005"
                  value={gridStrain}
                  onChange={(e) => setGridStrain(Math.max(0, parseFloat(e.target.value) || 0.002))}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleGenerateUniformGrid}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
              >
                Apply Generated Harmonic Series
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {editorMode === 'grid' ? (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/60 max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900/90 sticky top-0 z-10 text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">Active</th>
                <th className="py-2.5 px-3">L (nm)</th>
                <th className="py-2.5 px-3">Order 1 (d={d1.toFixed(3)}Å)</th>
                <th className="py-2.5 px-3">Order 2 (d={d2.toFixed(3)}Å)</th>
                {d3 && <th className="py-2.5 px-3">Order 3 (d={d3.toFixed(3)}Å)</th>}
                {d4 && <th className="py-2.5 px-3">Order 4 (d={d4.toFixed(3)}Å)</th>}
                <th className="py-2.5 px-3 text-indigo-300 bg-indigo-950/30">Pure A_S(L)</th>
                <th className="py-2.5 px-3 text-emerald-300 bg-emerald-950/30">RMS Strain</th>
                <th className="py-2.5 px-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {points.map((pt, idx) => {
                const decon = harmonicsTable.find(h => Math.abs(h.L_nm - pt.L_nm) < 1e-4);
                const isExcluded = pt.isExcluded;

                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors hover:bg-white/[0.02] ${
                      isExcluded ? 'opacity-40 bg-rose-950/10' : ''
                    }`}
                  >
                    {/* Active Toggle */}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleToggleExclude(idx)}
                        className={`p-1 rounded transition-colors ${
                          isExcluded 
                            ? 'text-rose-400 hover:bg-rose-500/20' 
                            : 'text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={isExcluded ? 'Excluded from analysis. Click to include.' : 'Active. Click to exclude.'}
                      >
                        {isExcluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Column Length L */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.5"
                        value={pt.L_nm}
                        onChange={(e) => handleCellChange(idx, 'L_nm', parseFloat(e.target.value) || 0)}
                        className="w-16 bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-100 font-mono focus:border-indigo-500 text-xs"
                      />
                    </td>

                    {/* A1 */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.005"
                        max="1.0"
                        min="0.0"
                        value={pt.A1}
                        onChange={(e) => handleCellChange(idx, 'A1', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-100 font-mono focus:border-indigo-500 text-xs"
                      />
                    </td>

                    {/* A2 */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.005"
                        max="1.0"
                        min="0.0"
                        value={pt.A2}
                        onChange={(e) => handleCellChange(idx, 'A2', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-100 font-mono focus:border-indigo-500 text-xs"
                      />
                    </td>

                    {/* A3 */}
                    {d3 && (
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.005"
                          max="1.0"
                          min="0.0"
                          value={pt.A3 ?? 0.001}
                          onChange={(e) => handleCellChange(idx, 'A3', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-100 font-mono focus:border-indigo-500 text-xs"
                        />
                      </td>
                    )}

                    {/* A4 */}
                    {d4 && (
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.005"
                          max="1.0"
                          min="0.0"
                          value={pt.A4 ?? 0.001}
                          onChange={(e) => handleCellChange(idx, 'A4', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-100 font-mono focus:border-indigo-500 text-xs"
                        />
                      </td>
                    )}

                    {/* Deconvolved Pure Size A_S(L) */}
                    <td className="py-2 px-3 bg-indigo-950/20 text-indigo-300 font-medium">
                      {decon ? decon.A_size.toFixed(4) : '---'}
                    </td>

                    {/* Live RMS Strain */}
                    <td className="py-2 px-3 bg-emerald-950/20 text-emerald-300 font-medium">
                      {decon ? decon.rmsStrain.toExponential(3) : '---'}
                    </td>

                    {/* Delete Action */}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        title="Delete harmonic row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={inputData}
            onChange={(e) => onChangeInputData(e.target.value)}
            rows={12}
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y leading-relaxed"
            placeholder="# L[nm], A(d1), A(d2), [A(d3), A(d4)]&#10;1, 0.985, 0.952&#10;2, 0.960, 0.895&#10;! 4, 0.901, 0.774  (prefix with ! to exclude)"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Syntax: <code className="text-indigo-300">L, A1, A2 [, A3, A4]</code> &bull; Prefix line with <code className="text-rose-400">!</code> to exclude outlier</span>
            <span>{points.length} data points recognized</span>
          </div>
        </div>
      )}

      {/* Diagnostics Bar */}
      {result?.hookDiagnostics && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/50 rounded-xl border border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${result.hookDiagnostics.hookDetected ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            <span className="text-slate-300">
              Hook Effect Diagnostic: {result.hookDiagnostics.hookDetected ? (
                <strong className="text-amber-400 font-medium">Hook Artifact Detected (A₀* = {result.hookDiagnostics.extrapolatedIntercept.toFixed(3)})</strong>
              ) : (
                <strong className="text-emerald-400 font-medium">Physically Well-Behaved Decay (A₀ ≈ 1.00)</strong>
              )}
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Apparent ⟨D⟩_A: <span className="text-slate-200">{result.hookDiagnostics.apparentSizeDaNm.toFixed(1)} nm</span>
          </div>
        </div>
      )}
    </div>
  );
};
