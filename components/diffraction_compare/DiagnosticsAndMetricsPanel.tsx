import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  MoveHorizontal, 
  Layers3, 
  Table, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Zap,
  Scale,
  Crosshair
} from 'lucide-react';
import { 
  SpectralMetrics, 
  IndexedPeakMatch, 
  DiagTabMode, 
  StrainRegressionAnalysis,
  PhaseQuantificationResult
} from './types';

interface DiagnosticsAndMetricsPanelProps {
  metrics: SpectralMetrics;
  meanShift: number;
  avgStrain: number;
  primaryPhasePurity: number;
  secondaryPhaseEst: number;
  extraInA: number[];
  missingInA: number[];
  indexedPeaks: IndexedPeakMatch[];
  strainRegression: StrainRegressionAnalysis;
  phaseQuant: PhaseQuantificationResult;
  materialAName: string;
  materialBName: string;
  materialCName?: string;
  materialDName?: string;
  fracB: number;
  fracC: number;
  fracD?: number;
  onJumpToPeak: (twoTheta: number) => void;
  onApplyZeroShiftCorrection?: (zeroShiftDeg: number) => void;
  onOpenResidualSearch?: () => void;
  onUpdateRir?: (phase: 'B' | 'C' | 'D', value: number) => void;
}

export const DiagnosticsAndMetricsPanel: React.FC<DiagnosticsAndMetricsPanelProps> = ({
  metrics,
  meanShift,
  avgStrain,
  primaryPhasePurity,
  secondaryPhaseEst,
  extraInA,
  indexedPeaks,
  strainRegression,
  phaseQuant,
  materialAName,
  materialBName,
  materialCName,
  materialDName,
  fracB,
  fracC,
  fracD = 0,
  onJumpToPeak,
  onApplyZeroShiftCorrection,
  onOpenResidualSearch,
  onUpdateRir
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DiagTabMode>('cards');
  const [tableFilter, setTableFilter] = useState<'all' | 'matched' | 'shifted' | 'extra' | 'missing'>('all');
  const [tableSearch, setTableSearch] = useState('');

  const pearsonNum = parseFloat(metrics.pearsonR);
  const rpNum = parseFloat(metrics.rP);
  const rwpNum = parseFloat(metrics.rWP);

  const isExcellentMatch = pearsonNum >= 90 && rpNum < 15;
  const isStrained = Math.abs(meanShift) > 0.03 || Math.abs(strainRegression.trueMacrostrainPercent) > 0.05;
  const isMultiphase = extraInA.length > 0 || fracC > 0 || fracD > 0;

  const filteredPeaks = indexedPeaks.filter(p => {
    const matchesStatus = tableFilter === 'all' || p.status === tableFilter;
    const matchesSearch = !tableSearch || 
      (p.twoThetaA && p.twoThetaA.toString().includes(tableSearch)) ||
      (p.twoThetaB && p.twoThetaB.toString().includes(tableSearch)) ||
      (p.hklA && p.hklA.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (p.hklB && p.hklB.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (p.phaseOrigin && p.phaseOrigin.toLowerCase().includes(tableSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getVerdict = () => {
    if (isExcellentMatch && !isStrained && extraInA.length === 0) {
      return {
        type: 'success',
        accentHex: '#10b981',
        title: 'HIGH-PURITY SINGLE-PHASE CONVERGENCE',
        badge: 'CONVERGED MATCH',
        description: `Experimental "${materialAName}" matches "${materialBName}" with strong crystallographic agreement (${pearsonNum.toFixed(1)}% Pearson r, ${metrics.cosineSimilarity}% Cosine similarity, Rwp = ${rwpNum.toFixed(1)}%). Zero significant secondary phases detected.`
      };
    }
    if (isStrained && pearsonNum >= 75) {
      return {
        type: 'warning',
        accentHex: '#f59e0b',
        title: 'LATTICE STRAIN & ZERO-SHIFT DECOMPOSITION ACTIVE',
        badge: 'PEAK SHIFT DETECTED',
        description: `Observed mean displacement of ${meanShift > 0 ? `+${meanShift.toFixed(3)}` : meanShift.toFixed(3)}° 2θ decomposes into Δ2θ₀ = ${strainRegression.zeroShiftDeg > 0 ? `+${strainRegression.zeroShiftDeg.toFixed(3)}` : strainRegression.zeroShiftDeg.toFixed(3)}° instrumental zero-offset and ε = ${strainRegression.trueMacrostrainPercent > 0 ? `+${strainRegression.trueMacrostrainPercent.toFixed(3)}` : strainRegression.trueMacrostrainPercent.toFixed(3)}% true lattice macrostrain.`
      };
    }
    if (isMultiphase) {
      return {
        type: 'purple',
        accentHex: '#a855f7',
        title: 'MULTI-PHASE CERAMIC / COMPOSITE MIXTURE DETECTED',
        badge: 'MULTI-PHASE RIR',
        description: `RIR-corrected weight fractions: Primary ${materialBName} (${phaseQuant.wtPercentB.toFixed(1)} wt%)${fracC > 0 ? ` · Secondary ${materialCName || 'Phase C'} (${phaseQuant.wtPercentC.toFixed(1)} wt%)` : ''}${fracD > 0 ? ` · Tertiary ${materialDName || 'Phase D'} (${phaseQuant.wtPercentD.toFixed(1)} wt%)` : ''}. ${extraInA.length} unindexed reflection(s) remain.`
      };
    }
    return {
      type: 'info',
      accentHex: '#38bdf8',
      title: 'MODERATE PHASE AGREEMENT / RESIDUAL PRESENT',
      badge: 'PARTIAL FIT',
      description: `Comparison yields ${pearsonNum.toFixed(1)}% spectral correlation and Rwp = ${rwpNum.toFixed(1)}%. Inspect residual trace and unindexed reflections table below.`
    };
  };

  const verdict = getVerdict();

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg shadow-xl overflow-hidden">
      {/* Top 2px Status Accent Line */}
      <div className="h-0.5 w-full" style={{ backgroundColor: verdict.accentHex }} />

      <div className="p-4 lg:p-5 space-y-4">
        {/* 1. Executive Metrology Verdict Banner */}
        <div className="p-3.5 rounded-md border border-slate-800 bg-[#070A12] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded border mt-0.5 shrink-0 ${
              verdict.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              verdict.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              verdict.type === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
              'bg-sky-500/10 text-sky-400 border-sky-500/30'
            }`}>
              {verdict.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
               verdict.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
               verdict.type === 'purple' ? <Layers3 className="w-4 h-4" /> :
               <Activity className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">{verdict.title}</h4>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-slate-300 uppercase">
                  {verdict.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-mono">
                {verdict.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center shrink-0 font-mono tabular-nums bg-[#0B0F19] border border-slate-800 px-3 py-2 rounded-md">
            <div className="text-right pr-3 border-r border-slate-800">
              <span className="text-[9px] uppercase text-slate-500 block">Cosine S_cos</span>
              <span className="text-base font-extrabold text-sky-400">{metrics.cosineSimilarity}%</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase text-slate-500 block">Weighted R_wp</span>
              <span className={`text-base font-extrabold ${rwpNum < 15 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.rWP}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Navigation Sub-Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              QUANTITATIVE DIAGNOSTICS, RIR PHASE SOLVER &amp; VEGARD STRAIN ENGINE
            </span>
          </div>

          <div className="flex items-center bg-[#070A12] border border-slate-800 p-0.5 rounded-md overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Overview Matrix
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>(hkl) Reflections ({indexedPeaks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quant')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'quant'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-purple-400" />
              <span>Phase Solver (NNLS + RIR)</span>
            </button>

            <button
              onClick={() => setActiveTab('strain')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'strain'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-Shift &amp; Strain (Δd/d)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: 3-COLUMN DIAGNOSTIC CARDS */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono tabular-nums">
            {/* Card 1: Quantitative Residuals & Rietveld Quality */}
            <div className="bg-[#070A12] p-4 rounded-md border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Rietveld &amp; Profile Residuals
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    isExcellentMatch
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {isExcellentMatch ? 'Rwp < 15%' : 'Rwp > 15%'}
                  </span>
                </div>

                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Profile Residual (R_p):</span>
                    <span className="font-bold text-slate-200">{metrics.rP}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Weighted Profile (R_wp):</span>
                    <span className="font-bold text-sky-400">{metrics.rWP}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Expected (R_exp) · χ²:</span>
                    <span className="font-bold text-amber-400">{metrics.rExp}% · {metrics.chiSquared}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Bragg Integrated (R_B):</span>
                    <span className="font-bold text-indigo-300">{metrics.braggR}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Durbin-Watson (d_DW):</span>
                    <span className="font-bold text-emerald-400">{metrics.durbinWatson}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                <span>Pearson r: <strong className="text-slate-200">{metrics.pearsonR}%</strong></span>
                <span>Spearman ρ: <strong className="text-slate-200">{metrics.spearmanRho}%</strong></span>
              </div>
            </div>

            {/* Card 2: Peak Matching & Zero-Shift / Strain Separation */}
            <div className="bg-[#070A12] p-4 rounded-md border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <MoveHorizontal className="w-3.5 h-3.5" />
                    Zero-Shift vs. Lattice Strain
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    Math.abs(meanShift) > 0.05
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {Math.abs(meanShift) > 0.05 ? 'SHIFT ACTIVE' : 'ALIGNED'}
                  </span>
                </div>

                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Mean Observed Shift (Δ2θ):</span>
                    <span className="font-bold text-sky-400">
                      {meanShift > 0 ? `+${meanShift.toFixed(3)}` : meanShift.toFixed(3)}°
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Goniometer Zero-Offset (Δ2θ₀):</span>
                    <span className="font-bold text-indigo-300">
                      {strainRegression.zeroShiftDeg > 0 ? `+${strainRegression.zeroShiftDeg.toFixed(3)}` : strainRegression.zeroShiftDeg.toFixed(3)}°
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">True Macrostrain (ε = Δd/d):</span>
                    <span className="font-bold text-amber-400">
                      {strainRegression.trueMacrostrainPercent > 0 ? `+${strainRegression.trueMacrostrainPercent.toFixed(3)}` : strainRegression.trueMacrostrainPercent.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Apparent Uncorrected Strain:</span>
                    <span className="font-bold text-slate-300">{avgStrain.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Unmatched Peaks in A:</span>
                    <span className={`font-bold ${extraInA.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {extraInA.length} {extraInA.length > 0 ? '(Impurities)' : '(None)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Regression R² = {strainRegression.regressionR2.toFixed(3)}</span>
                {onApplyZeroShiftCorrection && Math.abs(strainRegression.zeroShiftDeg) >= 0.01 && (
                  <button
                    onClick={() => onApplyZeroShiftCorrection(strainRegression.zeroShiftDeg)}
                    className="text-sky-400 hover:text-sky-300 underline cursor-pointer font-bold"
                  >
                    Compensate Δ2θ₀
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Multi-Phase Purity & RIR Weight Composition */}
            <div className="bg-[#070A12] p-4 rounded-md border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Layers3 className="w-3.5 h-3.5" />
                    RIR Weight &amp; Phase Purity
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] font-bold text-purple-300">
                    {fracC > 0 || fracD > 0 ? 'MULTI-PHASE' : 'SINGLE PHASE'}
                  </span>
                </div>

                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 truncate max-w-[165px]">Primary ({materialBName}):</span>
                    <span className="font-bold text-emerald-400">
                      {phaseQuant.wtPercentB.toFixed(1)} wt% <span className="text-slate-500 text-[10px]">({fracB.toFixed(1)}% area)</span>
                    </span>
                  </div>
                  {fracC > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-slate-400 truncate max-w-[165px]">Phase C ({materialCName || 'Sec'}):</span>
                      <span className="font-bold text-purple-400">
                        {phaseQuant.wtPercentC.toFixed(1)} wt% <span className="text-slate-500 text-[10px]">({fracC.toFixed(1)}% area)</span>
                      </span>
                    </div>
                  )}
                  {fracD > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-slate-400 truncate max-w-[165px]">Phase D ({materialDName || 'Tert'}):</span>
                      <span className="font-bold text-rose-400">
                        {phaseQuant.wtPercentD.toFixed(1)} wt% <span className="text-slate-500 text-[10px]">({fracD.toFixed(1)}% area)</span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Primary Phase Purity:</span>
                    <span className="font-bold text-indigo-400">{primaryPhasePurity.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Figure of Merit (FOM):</span>
                    <span className="font-bold text-sky-400">{metrics.fom} / 100</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Unindexed Intensity: <strong className="text-slate-200">{secondaryPhaseEst.toFixed(1)}%</strong></span>
                {extraInA.length > 0 && onOpenResidualSearch && (
                  <button
                    onClick={onOpenResidualSearch}
                    className="text-amber-400 hover:text-amber-300 underline cursor-pointer font-bold"
                  >
                    Identify Impurities
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INDEXED PEAKS TABLE */}
        {activeTab === 'table' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#070A12] border border-slate-800 p-0.5 rounded-md">
                  {(['all', 'matched', 'shifted', 'extra', 'missing'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTableFilter(filter)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                        tableFilter === filter
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {filter === 'extra' ? `Unindexed (${extraInA.length})` : filter}
                    </button>
                  ))}
                </div>

                {extraInA.length > 0 && onOpenResidualSearch && (
                  <button
                    onClick={onOpenResidualSearch}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Identify {extraInA.length} Unmatched Reflection(s) in DB</span>
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter 2θ, (hkl), or Phase..."
                  className="w-full bg-[#070A12] border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] rounded-md border border-slate-800">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead className="bg-[#070A12] text-slate-400 border-b border-slate-800 sticky top-0 z-10 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">2θ Exp (A)</th>
                    <th className="p-2.5">2θ Ref</th>
                    <th className="p-2.5">d-Spacing (Å)</th>
                    <th className="p-2.5">Shift (Δ2θ)</th>
                    <th className="p-2.5">Strain (Δd/d)</th>
                    <th className="p-2.5">Size D (nm)</th>
                    <th className="p-2.5">(hkl)</th>
                    <th className="p-2.5">Phase Origin</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Focus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-[#0B0F19]">
                  {filteredPeaks.map((p, idx) => {
                    const isExtra = p.status === 'extra';
                    const isMissing = p.status === 'missing';
                    const isShifted = p.status === 'shifted';

                    return (
                      <tr key={idx} className="hover:bg-[#070A12] transition-colors">
                        <td className="p-2.5 text-slate-500">{p.id}</td>
                        <td className="p-2.5 font-bold text-emerald-400">
                          {p.twoThetaA > 0 ? `${p.twoThetaA.toFixed(2)}°` : '-'}
                        </td>
                        <td className="p-2.5 font-bold text-indigo-400">
                          {p.twoThetaB ? `${p.twoThetaB.toFixed(2)}°` : '-'}
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {p.dSpacingA !== '-' ? p.dSpacingA : p.dSpacingB}
                        </td>
                        <td className={`p-2.5 font-bold ${
                          p.shift !== null && Math.abs(p.shift) > 0.05 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {p.shift !== null ? (p.shift > 0 ? `+${p.shift.toFixed(3)}°` : `${p.shift.toFixed(3)}°`) : '-'}
                        </td>
                        <td className={`p-2.5 font-bold ${
                          p.strainPercent !== null && p.strainPercent !== undefined && Math.abs(p.strainPercent) > 0.08
                            ? 'text-purple-300'
                            : 'text-slate-400'
                        }`}>
                          {p.strainPercent !== null && p.strainPercent !== undefined
                            ? `${p.strainPercent > 0 ? `+${p.strainPercent.toFixed(3)}` : p.strainPercent.toFixed(3)}%`
                            : '-'}
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {p.scherrerSizeNm ? `${p.scherrerSizeNm.toFixed(1)}` : '-'}
                        </td>
                        <td className="p-2.5 text-sky-400 font-bold">
                          {p.hklA || p.hklB || '-'}
                        </td>
                        <td className="p-2.5">
                          <span className={`text-[10px] font-bold ${
                            p.phaseOrigin === 'Phase B' ? 'text-indigo-300' :
                            p.phaseOrigin === 'Phase C' ? 'text-purple-300' :
                            p.phaseOrigin === 'Phase D' ? 'text-rose-300' :
                            'text-slate-500'
                          }`}>
                            {p.phaseOrigin || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`text-[10px] font-bold uppercase ${
                            isExtra 
                              ? 'text-rose-400'
                              : isMissing
                              ? 'text-slate-500'
                              : isShifted
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => onJumpToPeak(p.twoThetaA || p.twoThetaB || 25)}
                            className="px-2 py-1 bg-[#070A12] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-500/40 rounded text-[10px] transition-colors cursor-pointer"
                            title="Center chart around this reflection"
                          >
                            Zoom Peak
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICAL NNLS + RIR (I/Ic) SEMI-QUANTITATIVE PHASE SOLVER */}
        {activeTab === 'quant' && (
          <div className="space-y-4 font-mono tabular-nums">
            <div className="p-4 bg-[#070A12] rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4" />
                    Analytical NNLS + Reference Intensity Ratio (I/Ic RIR) Quantification
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Converts non-negative least-squares spectral scale factors S_k into physical weight percentages via wt%_k = (I_k / RIR_k) / Σ(I_j / RIR_j)
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  Residual RMS: <strong className="text-sky-300">{phaseQuant.residualNorm}</strong>
                </span>
              </div>

              {/* Dual Stacked Bar Comparison: RIR Weight % vs Spectral Area % */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      RIR-Corrected Weight Fraction (wt%):
                    </span>
                    <span className="text-slate-400">Corundum (α-Al₂O₃) Normalized</span>
                  </div>
                  <div className="w-full h-6 rounded overflow-hidden flex border border-slate-800 bg-[#0B0F19]">
                    <div 
                      style={{ width: `${phaseQuant.wtPercentB}%` }} 
                      className="bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white transition-all"
                    >
                      {phaseQuant.wtPercentB > 10 ? `${materialBName}: ${phaseQuant.wtPercentB.toFixed(1)} wt%` : ''}
                    </div>
                    {phaseQuant.wtPercentC > 0 && (
                      <div 
                        style={{ width: `${phaseQuant.wtPercentC}%` }} 
                        className="bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white transition-all"
                      >
                        {phaseQuant.wtPercentC > 10 ? `${materialCName || 'Phase C'}: ${phaseQuant.wtPercentC.toFixed(1)} wt%` : ''}
                      </div>
                    )}
                    {phaseQuant.wtPercentD > 0 && (
                      <div 
                        style={{ width: `${phaseQuant.wtPercentD}%` }} 
                        className="bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white transition-all"
                      >
                        {phaseQuant.wtPercentD > 10 ? `${materialDName || 'Phase D'}: ${phaseQuant.wtPercentD.toFixed(1)} wt%` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Uncorrected Spectral Integrated Area Fraction (%):</span>
                    <span>Direct Profile Integral</span>
                  </div>
                  <div className="w-full h-4 rounded overflow-hidden flex border border-slate-800 bg-[#0B0F19] opacity-80">
                    <div 
                      style={{ width: `${fracB}%` }} 
                      className="bg-indigo-500/70 flex items-center justify-center text-[9px] font-bold text-white"
                    >
                      {fracB > 12 ? `${fracB.toFixed(1)}%` : ''}
                    </div>
                    {fracC > 0 && (
                      <div 
                        style={{ width: `${fracC}%` }} 
                        className="bg-purple-500/70 flex items-center justify-center text-[9px] font-bold text-white"
                      >
                        {fracC > 12 ? `${fracC.toFixed(1)}%` : ''}
                      </div>
                    )}
                    {fracD > 0 && (
                      <div 
                        style={{ width: `${fracD}%` }} 
                        className="bg-rose-500/70 flex items-center justify-center text-[9px] font-bold text-white"
                      >
                        {fracD > 12 ? `${fracD.toFixed(1)}%` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phase Cards with Editable RIR (I/Ic) Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Phase B (Primary)</span>
                    <span className="text-[10px] text-indigo-300">S_B = {phaseQuant.scaleFactorB.toFixed(3)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-indigo-400">{phaseQuant.wtPercentB.toFixed(1)} wt%</span>
                    <span className="text-[11px] text-slate-400">Area: {fracB.toFixed(1)}%</span>
                  </div>
                  {onUpdateRir && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">RIR (I/Ic):</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="20"
                        value={phaseQuant.rirB}
                        onChange={(e) => onUpdateRir('B', Math.max(0.1, parseFloat(e.target.value) || 1.0))}
                        className="w-16 bg-[#070A12] border border-slate-700 rounded px-1.5 py-0.5 text-right text-indigo-300 font-bold outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Phase C (Secondary)</span>
                    <span className="text-[10px] text-purple-300">S_C = {phaseQuant.scaleFactorC.toFixed(3)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-purple-400">{phaseQuant.wtPercentC.toFixed(1)} wt%</span>
                    <span className="text-[11px] text-slate-400">Area: {fracC.toFixed(1)}%</span>
                  </div>
                  {onUpdateRir && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">RIR (I/Ic):</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="20"
                        value={phaseQuant.rirC}
                        onChange={(e) => onUpdateRir('C', Math.max(0.1, parseFloat(e.target.value) || 1.0))}
                        className="w-16 bg-[#070A12] border border-slate-700 rounded px-1.5 py-0.5 text-right text-purple-300 font-bold outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Phase D (Tertiary)</span>
                    <span className="text-[10px] text-rose-300">S_D = {phaseQuant.scaleFactorD.toFixed(3)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-rose-400">{phaseQuant.wtPercentD.toFixed(1)} wt%</span>
                    <span className="text-[11px] text-slate-400">Area: {fracD.toFixed(1)}%</span>
                  </div>
                  {onUpdateRir && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">RIR (I/Ic):</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="20"
                        value={phaseQuant.rirD}
                        onChange={(e) => onUpdateRir('D', Math.max(0.1, parseFloat(e.target.value) || 1.0))}
                        className="w-16 bg-[#070A12] border border-slate-700 rounded px-1.5 py-0.5 text-right text-rose-300 font-bold outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ZERO-SHIFT VS. SPECIMEN DISPLACEMENT VS. LATTICE STRAIN (Δd/d) */}
        {activeTab === 'strain' && (
          <div className="space-y-4 font-mono tabular-nums">
            <div className="p-4 bg-[#070A12] rounded-md border border-slate-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Zero-Shift (Δ2θ₀) vs. Specimen Displacement vs. True Lattice Macrostrain (ε = Δd/d)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Weighted linear regression of Δ2θ(θ) = Δ2θ₀ - (2s/R)·cos(θ) - 2ε·tan(θ)·(180/π) across {strainRegression.pairedPoints.length} paired reflections
                  </p>
                </div>

                {onApplyZeroShiftCorrection && Math.abs(strainRegression.zeroShiftDeg) >= 0.01 && (
                  <button
                    onClick={() => onApplyZeroShiftCorrection(strainRegression.zeroShiftDeg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-md text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                    <span>Compensate Zero-Shift ({strainRegression.zeroShiftDeg > 0 ? `-${strainRegression.zeroShiftDeg.toFixed(2)}` : `+${Math.abs(strainRegression.zeroShiftDeg).toFixed(2)}`}°)</span>
                  </button>
                )}
              </div>

              {/* 4-Column Decomposed Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">True Lattice Strain (ε):</span>
                  <span className="text-base font-bold text-amber-400">
                    {strainRegression.trueMacrostrainPercent > 0
                      ? `+${strainRegression.trueMacrostrainPercent.toFixed(4)}%`
                      : `${strainRegression.trueMacrostrainPercent.toFixed(4)}%`}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {strainRegression.trueMacrostrainPercent > 0.02
                      ? 'Tensile Expansion (Slope < 0)'
                      : strainRegression.trueMacrostrainPercent < -0.02
                      ? 'Compressive Contraction (Slope > 0)'
                      : 'Zero Net Physical Strain'}
                  </span>
                </div>

                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Instrumental Zero-Shift (Δ2θ₀):</span>
                  <span className="text-base font-bold text-sky-400">
                    {strainRegression.zeroShiftDeg > 0
                      ? `+${strainRegression.zeroShiftDeg.toFixed(4)}°`
                      : `${strainRegression.zeroShiftDeg.toFixed(4)}°`}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Constant goniometer intercept
                  </span>
                </div>

                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Displacement Coeff (-2s/R):</span>
                  <span className="text-base font-bold text-indigo-300">
                    {strainRegression.specimenDisplacementCos > 0
                      ? `+${strainRegression.specimenDisplacementCos.toFixed(4)}°`
                      : `${strainRegression.specimenDisplacementCos.toFixed(4)}°`}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    cos(θ) sample height term
                  </span>
                </div>

                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Apparent Mean Shift (Δ2θ):</span>
                  <span className="text-base font-bold text-emerald-400">
                    {meanShift > 0 ? `+${meanShift.toFixed(3)}°` : `${meanShift.toFixed(3)}°`}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Fit R² = {strainRegression.regressionR2.toFixed(3)} ({strainRegression.pairedPoints.length} peaks)
                  </span>
                </div>
              </div>

              {/* Interactive Regression Chart */}
              {strainRegression.pairedPoints.length >= 2 && (
                <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-bold text-slate-200">
                      Angular Shift Dispersion Plot: Observed Δ2θ (°) vs. Linear Strain + Zero-Shift Fit
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-sky-400">● Observed Peak Δ2θ</span>
                      <span className="flex items-center gap-1 text-amber-400">— Regression Model Fit</span>
                    </div>
                  </div>
                  <div className="w-full h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={strainRegression.pairedPoints}
                        margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                      >
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.6} />
                        <XAxis
                          dataKey="twoTheta"
                          type="number"
                          domain={['dataMin - 2', 'dataMax + 2']}
                          stroke="#475569"
                          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          unit="°"
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                          unit="°"
                        />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#070A12',
                            borderColor: '#334155',
                            borderRadius: '0.375rem',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="modeledShift"
                          name="Model Fit Δ2θ"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="linear"
                          dataKey="observedShift"
                          name="Observed Δ2θ"
                          stroke="#38bdf8"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={{ r: 4, fill: '#38bdf8' }}
                          isAnimationActive={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Shift Breakdown per reflection */}
              <div className="mt-2">
                <h5 className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                  Individual Reflection Strain &amp; Crystallite Domain Vector Breakdown:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[210px] overflow-y-auto pr-1 text-xs">
                  {indexedPeaks.filter(p => p.shift !== null).map((p, i) => {
                    const shiftDeg = p.shift || 0;
                    const peakStrain = p.strainPercent ?? 0;

                    return (
                      <div key={i} className="p-2.5 rounded bg-[#0B0F19] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sky-300">
                            {p.hklA || p.hklB || `Peak #${p.id}`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            2θ = {(p.twoThetaA || p.twoThetaB || 0).toFixed(2)}°
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">
                            Δ2θ: <strong className={shiftDeg !== 0 ? 'text-amber-400' : 'text-slate-300'}>{shiftDeg > 0 ? `+${shiftDeg.toFixed(3)}°` : `${shiftDeg.toFixed(3)}°`}</strong>
                          </span>
                          <span className="text-slate-400">
                            ε: <strong className={peakStrain > 0 ? 'text-emerald-400' : peakStrain < 0 ? 'text-rose-400' : 'text-slate-300'}>{peakStrain > 0 ? `+${peakStrain.toFixed(3)}%` : `${peakStrain.toFixed(3)}%`}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
