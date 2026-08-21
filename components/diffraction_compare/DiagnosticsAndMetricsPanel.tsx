import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, 
  MoveHorizontal, 
  Layers3, 
  Table, 
  Sliders, 
  Sparkles, 
  Microscope, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle,
  FileDown,
  Info,
  Maximize2,
  Filter,
  Search,
  ArrowRight,
  HelpCircle,
  Zap,
  Check
} from 'lucide-react';
import { SpectralMetrics, IndexedPeakMatch, DiagTabMode } from './types';

interface DiagnosticsAndMetricsPanelProps {
  metrics: SpectralMetrics;
  meanShift: number;
  avgStrain: number;
  primaryPhasePurity: number;
  secondaryPhaseEst: number;
  extraInA: number[];
  missingInA: number[];
  indexedPeaks: IndexedPeakMatch[];
  materialAName: string;
  materialBName: string;
  materialCName?: string;
  materialDName?: string;
  fracB: number;
  fracC: number;
  fracD?: number;
  onJumpToPeak: (twoTheta: number) => void;
}

export const DiagnosticsAndMetricsPanel: React.FC<DiagnosticsAndMetricsPanelProps> = ({
  metrics,
  meanShift,
  avgStrain,
  primaryPhasePurity,
  secondaryPhaseEst,
  extraInA,
  missingInA,
  indexedPeaks,
  materialAName,
  materialBName,
  materialCName,
  materialDName,
  fracB,
  fracC,
  fracD = 0,
  onJumpToPeak
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DiagTabMode>('cards');
  const [tableFilter, setTableFilter] = useState<'all' | 'matched' | 'shifted' | 'extra' | 'missing'>('all');
  const [tableSearch, setTableSearch] = useState('');

  const pearsonNum = parseFloat(metrics.pearsonR);
  const rpNum = parseFloat(metrics.rP);
  const rwpNum = parseFloat(metrics.rWP);
  const chiNum = parseFloat(metrics.chiSquared);
  const fomNum = parseFloat(metrics.fom || '0');

  const isExcellentMatch = pearsonNum >= 90 && rpNum < 15;
  const isStrained = Math.abs(meanShift) > 0.03;
  const isMultiphase = extraInA.length > 0 || fracC > 0 || fracD > 0;

  const filteredPeaks = indexedPeaks.filter(p => {
    const matchesStatus = tableFilter === 'all' || p.status === tableFilter;
    const matchesSearch = !tableSearch || 
      (p.twoThetaA && p.twoThetaA.toString().includes(tableSearch)) ||
      (p.twoThetaB && p.twoThetaB.toString().includes(tableSearch)) ||
      (p.hklA && p.hklA.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (p.hklB && p.hklB.toLowerCase().includes(tableSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Plain-English Verdict Generator
  const getVerdict = () => {
    if (isExcellentMatch && !isStrained && extraInA.length === 0) {
      return {
        type: 'success',
        title: 'High-Purity Single Phase Match',
        badge: 'High Fidelity Match',
        description: `Experimental "${materialAName}" matches the standard "${materialBName}" with excellent crystallographic agreement (${pearsonNum.toFixed(1)}% correlation, Rwp = ${rwpNum.toFixed(1)}%). Zero significant secondary phases detected.`
      };
    }
    if (isStrained && pearsonNum >= 80) {
      return {
        type: 'warning',
        title: 'Lattice Strain / Solid Solution Detected',
        badge: 'Peak Shift Detected',
        description: `Systematic peak displacement of ${meanShift > 0 ? `+${meanShift.toFixed(3)}` : meanShift.toFixed(3)}° 2θ indicates uniform lattice ${meanShift < 0 ? 'expansion (tensile strain)' : 'contraction (compressive strain)'} of ~${Math.abs(avgStrain).toFixed(3)}% Δd/d, characteristic of cation substitution or thermal residual strain.`
      };
    }
    if (isMultiphase) {
      return {
        type: 'purple',
        title: 'Multi-Phase Ceramic / Mixture Detected',
        badge: 'Multi-Phase Composite',
        description: `Sample contains composite phases: Primary ${materialBName} (~${fracB.toFixed(1)}%)${fracC > 0 ? ` + Secondary ${materialCName || 'Phase C'} (~${fracC.toFixed(1)}%)` : ''}${fracD > 0 ? ` + Tertiary ${materialDName || 'Phase D'} (~${fracD.toFixed(1)}%)` : ''}. ${extraInA.length} unindexed reflection(s) identified.`
      };
    }
    return {
      type: 'info',
      title: 'Moderate Phase Agreement',
      badge: 'Partial Fit',
      description: `Comparison yields ${pearsonNum.toFixed(1)}% spectral correlation and Rwp = ${rwpNum.toFixed(1)}%. Inspect residual trace and unindexed reflections table below.`
    };
  };

  const verdict = getVerdict();

  return (
    <div className="bg-[#080d1a] border-2 border-slate-800/90 p-4 lg:p-5 rounded-2xl shadow-xl space-y-4">
      {/* 1. Executive Plain-English Summary Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        verdict.type === 'success'
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          : verdict.type === 'warning'
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          : verdict.type === 'purple'
          ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
          : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg mt-0.5 ${
            verdict.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
            verdict.type === 'warning' ? 'bg-amber-500/20 text-amber-300' :
            verdict.type === 'purple' ? 'bg-purple-500/20 text-purple-300' :
            'bg-cyan-500/20 text-cyan-300'
          }`}>
            {verdict.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
             verdict.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
             verdict.type === 'purple' ? <Layers3 className="w-5 h-5" /> :
             <Activity className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-100">{verdict.title}</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                verdict.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                verdict.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                verdict.type === 'purple' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {verdict.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans font-medium">
              {verdict.description}
            </p>
          </div>
        </div>

        <div className="text-right sm:self-center shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Spectral Match</span>
          <span className="text-xl font-mono font-extrabold text-cyan-400">{pearsonNum.toFixed(1)}%</span>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Quantitative Diagnostics & Microstructure Engine
          </span>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview Cards
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>(hkl) Indexing Table ({indexedPeaks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quant'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-purple-400" />
            <span>Phase Solver (NNLS)</span>
          </button>

          <button
            onClick={() => setActiveTab('strain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'strain'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Strain (Δd/d)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 3-COLUMN DIAGNOSTIC CARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Quantitative Residuals & Rietveld Quality */}
            <div className="bg-[#030712] p-4 rounded-xl border border-slate-800/90 relative flex flex-col justify-between group hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Rietveld & Profile Residuals
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isExcellentMatch 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {isExcellentMatch ? 'Rwp < 15% (Good)' : 'Rwp > 15% (Moderate)'}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400 flex items-center gap-1" title="Profile Residual Factor">
                      <span>Profile R-factor (R_p):</span>
                    </span>
                    <span className="font-bold text-slate-200">{metrics.rP}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400" title="Weighted Profile Residual Factor">Weighted Profile (R_wp):</span>
                    <span className="font-bold text-cyan-400">{metrics.rWP}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400" title="Goodness of Fit">Goodness of Fit (χ²):</span>
                    <span className="font-bold text-amber-400">{metrics.chiSquared}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Figure of Merit (FOM):</span>
                    <span className="font-bold text-emerald-400">{metrics.fom} / 100</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono flex justify-between">
                <span>Pearson Correlation (r):</span>
                <strong className="text-slate-300">{metrics.pearsonR}%</strong>
              </div>
            </div>

            {/* Card 2: Peak Matching & Crystallographic Shifts */}
            <div className="bg-[#030712] p-4 rounded-xl border border-slate-800/90 relative flex flex-col justify-between group hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <MoveHorizontal className="w-3.5 h-3.5" />
                    Lattice Shift & Strain
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    Math.abs(meanShift) > 0.05 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {Math.abs(meanShift) > 0.05 ? 'Shift Detected' : 'Aligned (Δ2θ ≈ 0)'}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Mean 2θ Shift (Δ2θ):</span>
                    <span className="font-bold text-cyan-400">
                      {meanShift > 0 ? `+${meanShift.toFixed(3)}` : meanShift.toFixed(3)}°
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Estimated Strain (Δd/d):</span>
                    <span className="font-bold text-amber-400">{avgStrain.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Total Indexed Peaks:</span>
                    <span className="font-bold text-slate-200">{indexedPeaks.length} reflections</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Unmatched Peaks in A:</span>
                    <span className={`font-bold ${extraInA.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {extraInA.length} {extraInA.length > 0 ? '(Impurities)' : '(None)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                {meanShift < -0.02 ? 'Lattice Expansion (Tensile)' : meanShift > 0.02 ? 'Lattice Contraction (Compressive)' : 'Zero Net Lattice Shift'}
              </div>
            </div>

            {/* Card 3: Multi-Phase Purity & Phase Composition */}
            <div className="bg-[#030712] p-4 rounded-xl border border-slate-800/90 relative flex flex-col justify-between group hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Layers3 className="w-3.5 h-3.5" />
                    Phase Composition & Purity
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {fracC > 0 || fracD > 0 ? 'Multi-Phase' : 'Single Phase'}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Primary Phase ({materialBName}):</span>
                    <span className="font-bold text-emerald-400">{fracB.toFixed(1)}%</span>
                  </div>
                  {fracC > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-slate-400">Secondary ({materialCName || 'Phase C'}):</span>
                      <span className="font-bold text-purple-400">{fracC.toFixed(1)}%</span>
                    </div>
                  )}
                  {fracD > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-slate-400">Tertiary ({materialDName || 'Phase D'}):</span>
                      <span className="font-bold text-rose-400">{fracD.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Primary Phase Purity:</span>
                    <span className="font-bold text-indigo-400">{primaryPhasePurity.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                Secondary Phase / Unmatched: <strong className="text-slate-300">{secondaryPhaseEst.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDEXED PEAKS TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-3">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              {(['all', 'matched', 'shifted', 'extra', 'missing'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setTableFilter(filter)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold capitalize transition-all cursor-pointer ${
                    tableFilter === filter
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter === 'extra' ? 'Extra (Impurities)' : filter}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search 2θ or (hkl)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[380px] rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#030712] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">2θ Exp (A)</th>
                  <th className="p-2.5">2θ Ref (B)</th>
                  <th className="p-2.5">d-Spacing (Å)</th>
                  <th className="p-2.5">Shift (Δ2θ)</th>
                  <th className="p-2.5">(hkl) Index</th>
                  <th className="p-2.5">Intensity</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#080d1a]">
                {filteredPeaks.map((p, idx) => {
                  const isExtra = p.status === 'extra';
                  const isMissing = p.status === 'missing';
                  const isShifted = p.status === 'shifted';

                  return (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
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
                      <td className="p-2.5 text-cyan-400 font-bold">
                        {p.hklA || p.hklB || '-'}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {p.intensityA > 0 ? `${p.intensityA.toFixed(0)}%` : `${p.intensityB.toFixed(0)}% (Ref)`}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isExtra 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isMissing
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : isShifted
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => onJumpToPeak(p.twoThetaA || p.twoThetaB || 25)}
                          className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-[10px] transition-all cursor-pointer"
                          title="Center chart around this peak"
                        >
                          Zoom to Peak
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

      {/* TAB 3: MULTI-PHASE FRACTIONS SOLVER */}
      {activeTab === 'quant' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <PieChart className="w-4 h-4" />
              Non-Negative Least Squares (NNLS) Phase Fraction Breakdown
            </h4>

            {/* Visual Fraction Bars */}
            <div className="w-full h-6 rounded-lg overflow-hidden flex border border-slate-800">
              <div 
                style={{ width: `${fracB}%` }} 
                className="bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white font-mono"
              >
                {fracB > 10 ? `${materialBName}: ${fracB.toFixed(1)}%` : ''}
              </div>
              {fracC > 0 && (
                <div 
                  style={{ width: `${fracC}%` }} 
                  className="bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                >
                  {fracC > 10 ? `${materialCName || 'Phase C'}: ${fracC.toFixed(1)}%` : ''}
                </div>
              )}
              {fracD > 0 && (
                <div 
                  style={{ width: `${fracD}%` }} 
                  className="bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                >
                  {fracD > 10 ? `${materialDName || 'Phase D'}: ${fracD.toFixed(1)}%` : ''}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Phase B (Standard):</span>
                <span className="text-base font-bold text-indigo-400">{fracB.toFixed(1)}%</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Phase C (Secondary):</span>
                <span className="text-base font-bold text-purple-400">{fracC.toFixed(1)}%</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Phase D (Tertiary):</span>
                <span className="text-base font-bold text-rose-400">{fracD.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LATTICE STRAIN & WILLIAMSON-HALL */}
      {activeTab === 'strain' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Lattice Strain & Microstructural Distortion Model
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Peak shift Δ2θ relates to uniform lattice strain via Bragg&apos;s differential law: <br />
              <strong className="text-cyan-400">ε = Δd / d = - (Δ2θ / 2) · cot(θ)</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-2">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Net Lattice Strain (ε):</span>
                <span className="text-base font-bold text-amber-400">{avgStrain.toFixed(4)}%</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Dominant Shift Vector:</span>
                <span className="text-base font-bold text-cyan-400">
                  {meanShift > 0 ? `+${meanShift.toFixed(3)}° (Lattice Contraction)` : `${meanShift.toFixed(3)}° (Lattice Expansion)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
