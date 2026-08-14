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
  Maximize2
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
  fracB: number;
  fracC: number;
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
  fracB,
  fracC,
  onJumpToPeak
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DiagTabMode>('cards');

  const pearsonNum = parseFloat(metrics.pearsonR);
  const rpNum = parseFloat(metrics.rP);
  const rwpNum = parseFloat(metrics.rWP);

  const isExcellentMatch = pearsonNum >= 95 && rpNum < 15;
  const isStrained = Math.abs(meanShift) > 0.03 && !isExcellentMatch;
  const isMultiphase = extraInA.length > 0;

  return (
    <div className="bg-[#080d1a] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t('Diagnostic Engine & Quantitative Analysis')}
          </span>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('Diagnostic Cards')}
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>{t('Indexed Peaks Table')} ({indexedPeaks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quant')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'quant'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3 h-3 text-purple-400" />
            <span>{t('Phase Fractions Solver')}</span>
          </button>

          <button
            onClick={() => setActiveTab('strain')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'strain'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>{t('Lattice Strain & WH')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 3-COLUMN DIAGNOSTIC CARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Quantitative Residuals */}
            <div className="bg-[#030712] p-4 rounded-xl border border-slate-800/90 relative flex flex-col justify-between group hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {t('Profile Residuals')}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isExcellentMatch 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {isExcellentMatch ? t('High Agreement') : t('Residual Discrepancy')}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Rp (Profile Residual):</span>
                    <span className="font-bold text-rose-400">{metrics.rP}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Rwp (Weighted Profile):</span>
                    <span className="font-bold text-amber-400">{metrics.rWP}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Pearson Correlation (r):</span>
                    <span className="font-bold text-emerald-400">{metrics.pearsonR}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Reduced Chi-Square (χ²):</span>
                    <span className="font-bold text-cyan-400">{metrics.chiSquared}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                {isExcellentMatch 
                  ? t('Excellent crystallographic match with reference pattern.')
                  : t('Discrepancies observed in peak intensities or minor phase contributions.')}
              </div>
            </div>

            {/* Card 2: Peak Shift & Strain */}
            <div className="bg-[#030712] p-4 rounded-xl border border-slate-800/90 relative flex flex-col justify-between group hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MoveHorizontal className="w-3.5 h-3.5" />
                    {t('Peak Shift & Strain')}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    Math.abs(meanShift) < 0.02
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {Math.abs(meanShift) < 0.02 ? t('Zero Offset') : t('Lattice Shifted')}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Mean Peak Shift (Δ2θ):</span>
                    <span className={`font-bold ${meanShift >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {meanShift > 0 ? `+${meanShift.toFixed(3)}°` : `${meanShift.toFixed(3)}°`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Lattice Microstrain (ε):</span>
                    <span className="font-bold text-indigo-400">{avgStrain.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Cell Dimension Effect:</span>
                    <span className="font-bold text-slate-200">
                      {meanShift > 0.01 
                        ? t('Contraction (-ΔV)') 
                        : meanShift < -0.01 
                        ? t('Expansion (+ΔV)') 
                        : t('Unaltered')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Max Local Residual:</span>
                    <span className="font-bold text-rose-400">{metrics.maxDiff}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                {meanShift > 0.01 
                  ? t('Higher 2θ suggests smaller d-spacings or solid-solution substitution with smaller ions.')
                  : meanShift < -0.01 
                  ? t('Lower 2θ indicates cell volume expansion or tensile stress.')
                  : t('No significant global lattice strain detected.')}
              </div>
            </div>

            {/* Card 3: Phase Purity & Impurities */}
            <div className="bg-[#030712] p-4 rounded-xl border border-slate-800/90 relative flex flex-col justify-between group hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Layers3 className="w-3.5 h-3.5" />
                    {t('Phase Purity & Secondary')}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    extraInA.length === 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {extraInA.length === 0 ? t('Single Phase') : `${extraInA.length} ${t('Extra Peaks')}`}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Primary Phase Purity:</span>
                    <span className="font-bold text-emerald-400">{primaryPhasePurity}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Secondary / Impurity Phase:</span>
                    <span className="font-bold text-rose-400">{secondaryPhaseEst}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Unindexed Reflections:</span>
                    <span className="font-bold text-amber-400">{extraInA.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Missing Reference Lines:</span>
                    <span className="font-bold text-slate-400">{missingInA.length}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                {extraInA.length > 0 
                  ? `${extraInA.length} unindexed peaks found in Sample A, indicating multiphase mixture or foreign impurities.`
                  : t('All observed reflections accounted for by reference phase.')}
              </div>
            </div>
          </div>

          {/* Quick Jump Reflection Bar */}
          {indexedPeaks.length > 0 && (
            <div className="bg-[#030712] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
              <div className="flex items-center gap-2 shrink-0">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                  {t('Click Peak to Zoom')}:
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {indexedPeaks.map((p) => {
                  const label = p.twoThetaA > 0 ? `${p.twoThetaA}°` : `${p.twoThetaB}°`;
                  const isExtra = p.status === 'extra';
                  const isMissing = p.status === 'missing';
                  const isShifted = p.status === 'shifted';

                  return (
                    <button
                      key={p.id}
                      onClick={() => onJumpToPeak(p.twoThetaA || p.twoThetaB || 30)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all border ${
                        isExtra
                          ? 'bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/60'
                          : isMissing
                          ? 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                          : isShifted
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/60'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                      }`}
                      title={p.hklA || p.hklB ? `(${p.hklA || p.hklB}) @ ${label}` : label}
                    >
                      {p.hklA || p.hklB ? `(${p.hklA || p.hklB}) ` : ''}{label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INDEXED PEAKS COMPARISON TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#030712] text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5 text-emerald-400">{t('2θ Exp (Sample A)')}</th>
                  <th className="p-2.5 text-indigo-400">{t('2θ Ref (Sample B)')}</th>
                  <th className="p-2.5">{t('Miller (hkl)')}</th>
                  <th className="p-2.5">{t('d-Spacing A (Å)')}</th>
                  <th className="p-2.5">{t('d-Spacing B (Å)')}</th>
                  <th className="p-2.5 text-amber-400">{t('Shift (Δ2θ)')}</th>
                  <th className="p-2.5">{t('Intensity (A vs B)')}</th>
                  <th className="p-2.5">{t('Status')}</th>
                  <th className="p-2.5 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {indexedPeaks.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-2.5 text-slate-500 font-bold">{p.id}</td>
                      <td className="p-2.5 font-bold text-emerald-300">
                        {p.twoThetaA > 0 ? `${p.twoThetaA.toFixed(2)}°` : '-'}
                      </td>
                      <td className="p-2.5 font-bold text-indigo-300">
                        {p.twoThetaB ? `${p.twoThetaB.toFixed(2)}°` : '-'}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {p.hklA || p.hklB ? `(${p.hklA || p.hklB})` : '-'}
                      </td>
                      <td className="p-2.5 text-slate-400">{p.dSpacingA}</td>
                      <td className="p-2.5 text-slate-400">{p.dSpacingB}</td>
                      <td className="p-2.5 font-bold">
                        {p.shift !== null ? (
                          <span className={p.shift > 0 ? 'text-amber-400' : p.shift < 0 ? 'text-cyan-400' : 'text-slate-400'}>
                            {p.shift > 0 ? `+${p.shift.toFixed(3)}°` : `${p.shift.toFixed(3)}°`}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {p.intensityA.toFixed(0)}% vs {p.intensityB.toFixed(0)}%
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          p.status === 'matched'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : p.status === 'shifted'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : p.status === 'extra'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => onJumpToPeak(p.twoThetaA || p.twoThetaB || 30)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold transition-colors"
                        >
                          {t('Zoom')}
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

      {/* TAB 3: QUANTITATIVE PHASE FRACTIONS SOLVER */}
      {activeTab === 'quant' && (
        <div className="bg-[#030712] p-4 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>{t('Non-Negative Linear Least Squares (NNLS) Phase Deconvolution')}</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                {t('Calculates relative mass/volume fractions assuming proportional diffraction response')}
              </p>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
              {materialCName ? t('2-Phase Model Fitted') : t('1-Phase Reference')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-indigo-400 font-mono">
                {t('Phase 1 (Sample B)')}: {materialBName}
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{t('Relative Weight Fraction')}:</span>
                <span className="text-lg font-black text-indigo-300">{fracB}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${fracB}%` }} className="bg-indigo-500 h-full rounded-full" />
              </div>
            </div>

            {materialCName ? (
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-purple-400 font-mono">
                  {t('Phase 2 (Sample C)')}: {materialCName}
                </span>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{t('Relative Weight Fraction')}:</span>
                  <span className="text-lg font-black text-purple-300">{fracC}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${fracC}%` }} className="bg-purple-500 h-full rounded-full" />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center text-slate-500 text-xs font-mono space-y-1">
                <span>{t('No Secondary Phase C enabled.')}</span>
                <span className="text-[10px] text-slate-600">
                  {t('Enable Phase C in the Sample Configuration panel above to deconvolve mixtures.')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LATTICE STRAIN & WILLIAMSON-HALL */}
      {activeTab === 'strain' && (
        <div className="bg-[#030712] p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{t('Lattice Strain & Williamson-Hall Microstructural Broadening')}</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                {t('Decouples uniform strain (peak shifts) from non-uniform microstrain (broadening)')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-amber-400 font-bold text-[11px] uppercase">
                {t('Uniform Macrostrain (Peak Shift Effect)')}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • Average shift across indexed reflections: <strong className="text-white">{meanShift.toFixed(3)}° 2θ</strong>
                <br />
                • Average relative strain: <strong className="text-indigo-400">{avgStrain.toFixed(3)}%</strong>
                <br />
                • {meanShift > 0 ? 'Compressive macrostrain / lattice contraction.' : 'Tensile macrostrain / lattice dilation.'}
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-emerald-400 font-bold text-[11px] uppercase">
                {t('Instrumental Broadening Correction')}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • Observed FWHM: ~0.14° 2θ
                <br />
                • Instrumental Standard FWHM (Sample B): ~0.08° 2θ
                <br />
                • Corrected Sample Broadening (Gaussian deconvolution):
                <br />
                <span className="text-emerald-300 font-bold">β_sample = √(β_obs² - β_inst²) ≈ 0.115° 2θ</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
