import React, { useState, useMemo } from 'react';
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
  Check,
  Compass,
  FileText
} from 'lucide-react';
import { SpectralMetrics, IndexedPeakMatch, DiagTabMode } from './types';
import { computeNelsonRileyFit } from './compareUtils';

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
  onSearchResiduals?: () => void;
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
  onJumpToPeak,
  onSearchResiduals
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

  // Nelson-Riley Extrapolation Fit
  const nelsonRileyFit = useMemo(() => {
    return computeNelsonRileyFit(indexedPeaks, 4.0);
  }, [indexedPeaks]);

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

          <button
            onClick={() => setActiveTab('refinement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'refinement'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nelson-Riley (a₀)</span>
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

              <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                <span>Secondary / Unmatched: <strong className="text-slate-300">{secondaryPhaseEst.toFixed(1)}%</strong></span>
                {onSearchResiduals && (extraInA.length > 0 || secondaryPhaseEst > 5) && (
                  <button
                    onClick={onSearchResiduals}
                    className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Search database for secondary phases matching unmatched peaks"
                  >
                    <Search className="w-3 h-3 text-purple-400" />
                    <span>Identify Impurities</span>
                  </button>
                )}
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
          <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                <TrendingUp className="w-4 h-4" />
                Williamson-Hall & Microstructural Distortion Engine
              </h4>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded">
                Cu Kα (λ = 1.5406 Å)
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Individual reflection shifts Δ2θ decompose into uniform macrostrain (Δd/d) and size-induced peak broadening via the Williamson-Hall relation: <br />
              <strong className="text-cyan-400">β · cos(θ) = (K · λ / D) + 4 · ε · sin(θ)</strong>, where <strong className="text-amber-300">ε = -½ · Δ2θ · cot(θ)</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Net Microstrain (ε):</span>
                <span className="text-base font-bold text-amber-400">
                  {avgStrain > 0 ? `+${avgStrain.toFixed(4)}%` : `${avgStrain.toFixed(4)}%`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {meanShift < 0 ? 'Tensile Lattice Expansion (+)' : meanShift > 0 ? 'Compressive Contraction (-)' : 'Neutral / Zero Net Strain'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Mean 2θ Shift (Δ2θ):</span>
                <span className="text-base font-bold text-cyan-400">
                  {meanShift > 0 ? `+${meanShift.toFixed(3)}°` : `${meanShift.toFixed(3)}°`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {(meanShift * 60).toFixed(1)} arcminutes
                </span>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Indexed Peak Pairs:</span>
                <span className="text-base font-bold text-emerald-400">
                  {indexedPeaks.filter(p => p.shift !== null).length} paired reflections
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Confidence FOM: {metrics.fom}%
                </span>
              </div>
            </div>

            {/* Shift Breakdown per reflection */}
            <div className="mt-3">
              <h5 className="text-[11px] font-bold uppercase text-slate-400 mb-2 font-mono flex items-center gap-1">
                <span>Individual Peak Strain Vector Breakdown:</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 font-mono text-xs">
                {indexedPeaks.filter(p => p.shift !== null).map((p, i) => {
                  const theta = (p.twoThetaA || p.twoThetaB || 30) / 2;
                  const thetaRad = theta * (Math.PI / 180);
                  const shiftDeg = p.shift || 0;
                  const shiftRad = shiftDeg * (Math.PI / 180);
                  const peakStrain = thetaRad > 0 ? -0.5 * shiftRad * (1 / Math.tan(thetaRad)) * 100 : 0;

                  return (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-cyan-300">
                          {p.hklA || p.hklB || `Peak #${p.id}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          2θ = {(p.twoThetaA || p.twoThetaB || 0).toFixed(2)}°
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Δ2θ: <strong className={shiftDeg !== 0 ? 'text-amber-400' : 'text-slate-300'}>{shiftDeg > 0 ? `+${shiftDeg.toFixed(3)}°` : `${shiftDeg.toFixed(3)}°`}</strong></span>
                        <span className="text-slate-400">ε: <strong className={peakStrain > 0 ? 'text-emerald-400' : peakStrain < 0 ? 'text-rose-400' : 'text-slate-300'}>{peakStrain > 0 ? `+${peakStrain.toFixed(3)}%` : `${peakStrain.toFixed(3)}%`}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NELSON-RILEY LATTICE REFINEMENT */}
      {activeTab === 'refinement' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#030712] border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
                    <span>Nelson-Riley Function Lattice Parameter Extrapolation</span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Zero-Error Limit
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Extrapolates apparent lattice constants to f(θ) = 0 to eliminate systematic diffractometer errors (specimen displacement, absorption, and flat-specimen defocusing).
                  </p>
                </div>
              </div>
            </div>

            {nelsonRileyFit ? (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-500/30">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">True Lattice Constant (a₀):</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {nelsonRileyFit.a0.toFixed(5)} Å
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ± {nelsonRileyFit.stdErrA0.toFixed(5)} Å std error
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Fit Linearity (R²):</span>
                    <span className="text-lg font-bold text-cyan-300">
                      {(nelsonRileyFit.rSquared * 100).toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Slope k = {nelsonRileyFit.slope > 0 ? `+${nelsonRileyFit.slope.toFixed(5)}` : nelsonRileyFit.slope.toFixed(5)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit Cell Volume (V₀):</span>
                    <span className="text-lg font-bold text-purple-300">
                      {nelsonRileyFit.unitCellVolume.toFixed(3)} Å³
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {nelsonRileyFit.deltaVolumePercent > 0 ? `+${nelsonRileyFit.deltaVolumePercent.toFixed(2)}%` : `${nelsonRileyFit.deltaVolumePercent.toFixed(2)}%`} vs ref
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Lattice Distortion (Δa/a):</span>
                    <span className="text-lg font-bold text-amber-300">
                      {nelsonRileyFit.strainPercent > 0 ? `+${nelsonRileyFit.strainPercent.toFixed(3)}%` : `${nelsonRileyFit.strainPercent.toFixed(3)}%`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {nelsonRileyFit.deltaA > 0 ? 'Lattice Expansion' : 'Lattice Contraction'}
                    </span>
                  </div>
                </div>

                {/* Extrapolation Point Matrix */}
                <div>
                  <h5 className="text-[11px] font-mono font-bold uppercase text-slate-300 mb-2 flex items-center justify-between">
                    <span>Nelson-Riley Reflection Points & Residuals</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Function: f(θ) = (cos²θ / sinθ) + (cos²θ / θ)
                    </span>
                  </h5>

                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Reflection (hkl)</th>
                          <th className="p-2.5">2θ (deg)</th>
                          <th className="p-2.5">d-spacing (Å)</th>
                          <th className="p-2.5">Nelson-Riley f(θ)</th>
                          <th className="p-2.5">Apparent a (Å)</th>
                          <th className="p-2.5">Fit Residual Δa (Å)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {nelsonRileyFit.points.map((pt, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-2.5 font-bold text-cyan-300">{pt.hkl}</td>
                            <td className="p-2.5">{pt.twoTheta.toFixed(2)}°</td>
                            <td className="p-2.5">{pt.dSpacing.toFixed(4)}</td>
                            <td className="p-2.5 text-slate-400">{pt.fnr.toFixed(4)}</td>
                            <td className="p-2.5 font-bold text-emerald-400">{pt.apparentA.toFixed(5)}</td>
                            <td className="p-2.5 text-slate-400">
                              {pt.residual > 0 ? `+${pt.residual.toFixed(5)}` : pt.residual.toFixed(5)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <span>Insufficient indexed reflections (≥2 required) to compute Nelson-Riley extrapolation line.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
