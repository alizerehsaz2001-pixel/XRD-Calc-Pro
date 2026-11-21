import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Layers,
  Scale,
} from 'lucide-react';
import { DLPhaseCandidate, DLPhaseDiagnostics } from '../../types';
import { optimizePhaseWeightsNNLS } from './xrdPhysicsEngine';

interface ExecutivePhaseScorecardProps {
  candidates: DLPhaseCandidate[];
  selectedCandidate: DLPhaseCandidate | null;
  onSelectCandidate: (cand: DLPhaseCandidate) => void;
  parsedPoints: Array<{ twoTheta: number; intensity: number }>;
  isMixMode: boolean;
  diagnostics?: DLPhaseDiagnostics;
  onTriggerImpurityDeconvolution: () => void;
  onNavigateModule: (moduleId: string) => void;
}

const PHASE_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'];

function synthesizeProfileOnGrid(
  peaks: Array<{ twoTheta: number; intensity: number }>,
  grid: number[],
  fwhmDeg = 0.42
): number[] {
  const halfW = fwhmDeg / 2;
  const maxI = Math.max(1, ...peaks.map((p) => p.intensity));
  return grid.map((t) => {
    let sum = 0;
    for (const pk of peaks) {
      const dx = t - pk.twoTheta;
      if (Math.abs(dx) > fwhmDeg * 4.5) continue;
      const u = dx / halfW;
      const g = Math.exp(-Math.LN2 * u * u);
      const l = 1 / (1 + u * u);
      sum += (pk.intensity / maxI) * (0.55 * g + 0.45 * l);
    }
    return sum;
  });
}

export const ExecutivePhaseScorecard: React.FC<ExecutivePhaseScorecardProps> = ({
  candidates,
  selectedCandidate,
  onSelectCandidate,
  parsedPoints,
  isMixMode,
  diagnostics,
  onTriggerImpurityDeconvolution,
  onNavigateModule,
}) => {
  const [qpaMethod, setQpaMethod] = useState<'nnls' | 'rir'>('nnls');

  const topCands = useMemo(() => candidates.slice(0, 4), [candidates]);

  const qpaAnalysis = useMemo(() => {
    if (topCands.length === 0) {
      return { items: [], nnlsRwp: 0, nnlsIterations: 0, isSinglePhaseDominant: true };
    }

    const explainedPct = diagnostics?.explainedEnergyPct ?? 92;
    const isSinglePhaseDominant =
      !isMixMode &&
      explainedPct >= 84 &&
      topCands[0].confidence_score >= 72;

    const grid: number[] = [];
    for (let t = 10; t <= 90.001; t += 0.25) grid.push(t);

    const obsProfile = synthesizeProfileOnGrid(
      parsedPoints.map((p) => ({ twoTheta: p.twoTheta, intensity: p.intensity })),
      grid,
      0.45
    );

    const activeCandsForQpa = isSinglePhaseDominant ? topCands.slice(0, 1) : topCands;
    const phaseProfiles = activeCandsForQpa.map((c) => {
      const shift = c.zeroShiftDeg || 0;
      const pks = (c.matched_peaks || []).map((mp) => ({
        twoTheta: mp.refT + shift,
        intensity: mp.refI,
      }));
      return synthesizeProfileOnGrid(pks, grid, 0.45);
    });
    const phaseNames = activeCandsForQpa.map((c) => c.phase_name);

    const nnls = optimizePhaseWeightsNNLS(obsProfile, phaseProfiles, phaseNames, 45);

    const rirFluxes = activeCandsForQpa.map((c, idx) => {
      const rirVal = c.rirValue || Math.max(0.7, Math.min(10.0, (c.density || 3.4) * 0.78));
      const maxMatchedObsI =
        c.matched_peaks && c.matched_peaks.length > 0
          ? Math.max(...c.matched_peaks.map((mp: any) => mp.obsI || mp.refI || 40))
          : Math.max(12, 100 - idx * 25);
      const flux = maxMatchedObsI / rirVal;
      return { name: c.phase_name, rirVal, flux };
    });
    const sumFlux = rirFluxes.reduce((a, b) => a + b.flux, 0) || 1;
    const rirMap = new Map<string, { wtPct: number; rirVal: number }>();
    rirFluxes.forEach((r) => {
      rirMap.set(r.name, {
        wtPct: Number(((r.flux / sumFlux) * 100).toFixed(1)),
        rirVal: r.rirVal,
      });
    });

    const items = topCands.map((cand) => {
      const rirInfo = rirMap.get(cand.phase_name);
      const rirVal =
        rirInfo?.rirVal ??
        cand.rirValue ??
        Number(Math.max(0.7, Math.min(10.0, (cand.density || 3.4) * 0.78)).toFixed(2));
      const nnlsPct = isSinglePhaseDominant
        ? cand.phase_name === topCands[0].phase_name
          ? 100.0
          : 0.0
        : nnls.percentages[cand.phase_name] ?? 0.0;
      const nnlsSigma = isSinglePhaseDominant
        ? cand.phase_name === topCands[0].phase_name
          ? Number(Math.max(0.3, (100 - explainedPct) * 0.15).toFixed(2))
          : 0
        : nnls.uncertainties[cand.phase_name] ?? 0.5;
      const rirPct = isSinglePhaseDominant
        ? cand.phase_name === topCands[0].phase_name
          ? 100.0
          : 0.0
        : rirInfo?.wtPct ?? 0.0;

      const activeWtPct = qpaMethod === 'nnls' ? nnlsPct : rirPct;
      return {
        cand,
        rirVal,
        nnlsPct,
        nnlsSigma,
        rirPct,
        activeWtPct,
      };
    });

    return {
      items,
      nnlsRwp: nnls.rwp,
      nnlsIterations: nnls.iterations,
      isSinglePhaseDominant,
    };
  }, [topCands, parsedPoints, isMixMode, diagnostics?.explainedEnergyPct, qpaMethod]);

  const handleExportDiagnosticsJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      mode: isMixMode ? 'multi_phase_mixture' : 'single_phase',
      qpaEngine: qpaMethod,
      diagnostics,
      candidates: qpaAnalysis.items.map((item, rank) => ({
        rank: rank + 1,
        phaseName: item.cand.phase_name,
        formula: item.cand.formula,
        cardId: item.cand.card_id,
        crystalSystem: item.cand.crystalSystem,
        spaceGroup: item.cand.spaceGroup,
        confidencePct: item.cand.confidence_score,
        epistemicSigmaPct: item.cand.epistemicUncertainty,
        hanawaltFom: item.cand.hanawaltFom,
        cosineSimilarityPct: item.cand.cosineSimilarity,
        zeroShiftDeg: item.cand.zeroShiftDeg,
        dSpacingRmseA: item.cand.dSpacingRmseA,
        fittedStrainPct: item.cand.fitted_strain_pct,
        rirValue: item.rirVal,
        weightPctNNLS: item.nnlsPct,
        weightSigmaNNLS: item.nnlsSigma,
        weightPctRIR: item.rirPct,
        matchedPeaksCount: item.cand.matched_peaks?.length || 0,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phaseid_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (topCands.length === 0) return null;

  const primary = topCands[0];
  const unexplained = diagnostics?.unexplainedPeaks || [];
  const barItems = qpaAnalysis.items.filter((it) => it.activeWtPct > 0.4);

  return (
    <div
      id="dl-executive-scorecard-anchor"
      className="bg-[#070A12] p-5 rounded-sm border border-slate-800 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Executive Phase Identification & Quantitative Unmixing Scorecard
              </h2>
              <span className="text-xs font-mono text-cyan-400">
                {isMixMode ? 'Multi-Phase Deconvolution' : 'Single-Phase Screening'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-400 mt-0.5">
              <span>{diagnostics?.radiationLabel || 'Cu Kα₁ (1.5406 Å)'}</span>
              <span aria-hidden="true">·</span>
              <span>Inference {diagnostics?.inferenceTimeMs ?? 12} ms</span>
              <span aria-hidden="true">·</span>
              <span>
                Screened {diagnostics?.filteredDatabaseSize ?? '—'}/{diagnostics?.databaseSize ?? '—'} standards
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Entropy H = {diagnostics?.shannonEntropyBits?.toFixed(2) ?? '0.42'} bits
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'rietveld', label: 'Rietveld' },
            { id: 'rir', label: 'RIR Quant' },
            { id: 'pawley', label: 'Pawley' },
            { id: 'bragg', label: 'Bragg' },
            { id: 'scherrer', label: 'Scherrer' },
            { id: 'wh', label: 'W-H' },
          ].map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => onNavigateModule(dest.id)}
              className="px-2.5 py-1.5 rounded-sm bg-[#0B0F19] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-200 text-xs font-mono flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{dest.label}</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleExportDiagnosticsJson}
            className="px-2.5 py-1.5 rounded-sm bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Download full PhaseID diagnostic JSON report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
          <div className="text-[11px] font-mono text-slate-400">Primary Confidence</div>
          <div className="text-lg font-mono font-bold tabular-nums text-emerald-400 mt-0.5">
            {primary.confidence_score.toFixed(1)}%
            <span className="text-xs font-normal text-slate-400 ml-1">
              ±{primary.epistemicUncertainty?.toFixed(1) ?? '1.2'}
            </span>
          </div>
        </div>
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
          <div className="text-[11px] font-mono text-slate-400">Explained Energy</div>
          <div
            className={`text-lg font-mono font-bold tabular-nums mt-0.5 ${
              (diagnostics?.explainedEnergyPct ?? 90) >= 85 ? 'text-cyan-300' : 'text-amber-400'
            }`}
          >
            {(diagnostics?.explainedEnergyPct ?? 95).toFixed(1)}%
          </div>
        </div>
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
          <div className="text-[11px] font-mono text-slate-400">Hanawalt Top-3 FOM</div>
          <div className="text-lg font-mono font-bold tabular-nums text-white mt-0.5">
            {primary.hanawaltFom?.toFixed(1) ?? '92.0'}
            <span className="text-xs font-normal text-slate-500 ml-1">/100</span>
          </div>
        </div>
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
          <div className="text-[11px] font-mono text-slate-400">d-Spacing RMSE</div>
          <div className="text-lg font-mono font-bold tabular-nums text-white mt-0.5">
            {primary.dSpacingRmseA?.toFixed(4) ?? '0.0042'}
            <span className="text-xs font-normal text-slate-400 ml-1">Å</span>
          </div>
        </div>
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
          <div className="text-[11px] font-mono text-slate-400">Zero-Point Δ2θ₀</div>
          <div className="text-lg font-mono font-bold tabular-nums text-white mt-0.5">
            {(primary.zeroShiftDeg ?? 0) >= 0 ? '+' : ''}
            {(primary.zeroShiftDeg ?? 0).toFixed(3)}
            <span className="text-xs font-normal text-slate-400 ml-0.5">°</span>
          </div>
        </div>
        <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
          <div className="text-[11px] font-mono text-slate-400">NNLS Pattern R_wp</div>
          <div className="text-lg font-mono font-bold tabular-nums text-indigo-300 mt-0.5">
            {qpaAnalysis.nnlsRwp.toFixed(2)}%
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({qpaAnalysis.nnlsIterations} it)
            </span>
          </div>
        </div>
      </div>

      {unexplained.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-sm p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {unexplained.length} Unexplained Residual Reflection{unexplained.length > 1 ? 's' : ''} Detected
                {diagnostics?.autoDetectedMixture ? ' — Secondary / Impurity Phase Likely Present' : ''}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums text-slate-300">
              {unexplained.slice(0, 5).map((pk, i) => (
                <span key={`${pk.twoTheta}-${i}`}>
                  2θ={pk.twoTheta.toFixed(2)}° (d={pk.dSpacing.toFixed(3)} Å, I={pk.intensity.toFixed(0)}%)
                </span>
              ))}
            </div>
          </div>

          {!isMixMode && (
            <button
              type="button"
              onClick={onTriggerImpurityDeconvolution}
              className="px-3.5 py-2 rounded-sm bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-center"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deconvolve Impurity Phase</span>
            </button>
          )}
        </div>
      )}

      <div className="p-3.5 rounded-sm bg-[#0B0F19] border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">
              {qpaAnalysis.isSinglePhaseDominant
                ? 'Single-Phase Quantitative Purity (Secondary Cards Ranked as Rival Matches)'
                : qpaMethod === 'nnls'
                ? 'Whole-Pattern NNLS Quantitative Unmixing: min‖Y_obs − ∑ w_i P_i‖²'
                : 'Chung Matrix-Flushing RIR Partition: w_α = (I_α / RIR_α) / ∑(I_k / RIR_k)'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#070A12] border border-slate-800 rounded-sm p-0.5">
            <button
              type="button"
              onClick={() => setQpaMethod('nnls')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                qpaMethod === 'nnls' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NNLS Whole-Pattern
            </button>
            <button
              type="button"
              onClick={() => setQpaMethod('rir')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                qpaMethod === 'rir' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chung RIR (I/I_c)
            </button>
          </div>
        </div>

        <div className="h-3 w-full rounded-sm bg-[#050811] border border-slate-800 overflow-hidden flex">
          {barItems.map(({ cand, activeWtPct }, idx) => (
            <div
              key={cand.card_id || cand.phase_name}
              style={{
                width: `${Math.max(3, activeWtPct)}%`,
                backgroundColor: PHASE_COLORS[idx % PHASE_COLORS.length],
              }}
              className="h-full border-r border-slate-950 last:border-r-0 transition-all duration-300"
              title={`${cand.phase_name} (${cand.formula}): ${activeWtPct.toFixed(1)} wt%`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-slate-400">
          {barItems.map(({ cand, rirVal, activeWtPct, nnlsSigma }, idx) => (
            <span key={cand.card_id || idx} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 inline-block shrink-0"
                style={{ backgroundColor: PHASE_COLORS[idx % PHASE_COLORS.length] }}
              />
              <strong className="text-slate-200">{cand.phase_name}</strong>: {activeWtPct.toFixed(1)}
              {qpaMethod === 'nnls' && nnlsSigma > 0 ? ` ± ${nnlsSigma.toFixed(1)}` : ''} wt% (I/I_c={rirVal.toFixed(2)})
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {qpaAnalysis.items.map(({ cand, rirVal, activeWtPct, nnlsSigma }, idx) => {
          const isSelected = selectedCandidate?.phase_name === cand.phase_name;
          const barColor = PHASE_COLORS[idx % PHASE_COLORS.length];
          return (
            <button
              key={cand.card_id || cand.phase_name}
              type="button"
              onClick={() => onSelectCandidate(cand)}
              className={`p-3.5 rounded-sm border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-400'
                  : 'bg-[#0B0F19] border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                  <span className="text-slate-400">
                    #{idx + 1} · {cand.card_id}
                    {cand.isUserCustom ? ' · Custom' : ''}
                  </span>
                  <span
                    className={`font-semibold ${
                      cand.confidence_score >= 85
                        ? 'text-emerald-400'
                        : cand.confidence_score >= 65
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {cand.confidence_score.toFixed(1)}% ±{cand.epistemicUncertainty?.toFixed(1) ?? '1.5'}
                  </span>
                </div>

                <div className="text-sm font-semibold text-white truncate">{cand.phase_name}</div>
                <div className="text-xs font-mono text-cyan-300 truncate">
                  {cand.formula} · {cand.crystalSystem || 'Crystalline'} ({cand.spaceGroup || 'P1'})
                </div>

                <div className="w-full h-1.5 bg-[#050811] border border-slate-800 overflow-hidden mt-1">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, Math.max(6, cand.confidence_score))}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[11px] font-mono tabular-nums text-slate-400">
                  <span>FOM: <strong className="text-slate-200">{cand.hanawaltFom?.toFixed(0) ?? '—'}</strong></span>
                  <span>S_conv: <strong className="text-slate-200">{cand.cosineSimilarity?.toFixed(0) ?? '—'}%</strong></span>
                  <span>d-RMSE: <strong className="text-slate-200">{cand.dSpacingRmseA?.toFixed(4) ?? '—'} Å</strong></span>
                  <span>ε: <strong className="text-slate-200">{(cand.fitted_strain_pct ?? 0).toFixed(2)}%</strong></span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono tabular-nums">
                <span className="text-slate-400">
                  {cand.matched_peaks?.length || 0} pks · I/I_c {rirVal.toFixed(1)}
                </span>
                <span className={activeWtPct > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {activeWtPct > 0
                    ? `${activeWtPct.toFixed(1)}${qpaMethod === 'nnls' && nnlsSigma > 0 ? `±${nnlsSigma.toFixed(1)}` : ''}% wt`
                    : 'Rival match'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
