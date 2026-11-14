import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';
import { computeBrindleyTau, solveSelfConsistentBrindley } from './rirMathUtils';

interface RIRBrindleyInspectorProps {
  phases: RIRMatrixPhase[];
  particleDiameterUm: number;
  onUpdateParticleDiameter: (d: number) => void;
  useBrindley: boolean;
  onToggleBrindley: (enabled: boolean) => void;
}

export function calcBrindleyTau(sigma_i: number, D_cm: number): number {
  return computeBrindleyTau(sigma_i, D_cm);
}

export const RIRBrindleyInspector: React.FC<RIRBrindleyInspectorProps> = ({
  phases,
  particleDiameterUm,
  onUpdateParticleDiameter,
  useBrindley,
  onToggleBrindley
}) => {
  // Self-consistent fixed-point Brindley solver
  const calculations = useMemo(() => {
    if (!phases || phases.length === 0) {
      return {
        muBar: 0,
        iterations: 0,
        converged: true,
        phaseStats: [],
        uncorrectedWt: [],
        correctedWt: [],
        maxErrorPct: 0
      };
    }

    const sol = solveSelfConsistentBrindley(phases, particleDiameterUm);
    const phaseStats = phases.map((p, idx) => {
      const st = sol.phaseStates[idx];
      return {
        ...p,
        mu: st?.muLinear ?? 150,
        sigma: st?.sigmaContrast ?? 0,
        tau: st?.tau ?? 1,
        correctedI: st?.correctedI100 ?? p.intensity,
        correctedReducedI: st?.correctedReducedI ?? 0,
        critD_um: st?.critDiameterUm ?? 999,
        uncorrectedWtPct: st?.uncorrectedWtPct ?? 0
      };
    });

    return {
      muBar: sol.muBar,
      iterations: sol.iterations,
      converged: sol.converged,
      phaseStats,
      uncorrectedWt: sol.phaseStates.map(s => s.uncorrectedWtPct),
      correctedWt: sol.phaseStates.map(s => s.correctedWtPct),
      maxErrorPct: sol.maxDeltaWtPct
    };
  }, [phases, particleDiameterUm]);

  // Curve of tau vs Diameter for all phases
  const tauVsDiameterData = useMemo(() => {
    if (!phases || phases.length === 0) return [];
    const diameters = [0.2, 0.5, 1.0, 2.0, 3.0, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0, 45.0];

    return diameters.map(d => {
      const D_cm = d * 1e-4;
      const pt: Record<string, number> = { diameter: d };
      calculations.phaseStats.forEach(p => {
        pt[p.name] = Number(calcBrindleyTau(p.sigma, D_cm).toFixed(3));
      });
      return pt;
    });
  }, [phases, calculations]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl flex flex-col gap-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                Brindley Microabsorption &amp; Particle Size Correction
              </h2>
              <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold">
                Self-Consistent ({calculations.iterations} iter{calculations.converged ? ' converged' : ''})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fixed-point spherical grain absorption model (Brindley, 1945) converging mixture linear attenuation μ̄ and phase transmission τᵢ simultaneously.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle */}
        <div className="flex items-center gap-2.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <span className="text-xs font-bold text-slate-300 pl-2">Apply to Quant Engine:</span>
          <button
            onClick={() => {
              playSynthTone('tick');
              onToggleBrindley(!useBrindley);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              useBrindley
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {useBrindley ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
            <span>{useBrindley ? 'Active' : 'Disabled'}</span>
          </button>
        </div>
      </div>

      {/* Control Banner: Mean Grain Size Slider */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Mean Powder Particle Diameter (D):</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Standard grinding produces 2–10 µm; sieve sizes &gt;20 µm exhibit severe microabsorption contrast distortions.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black font-mono tabular-nums text-cyan-300">{particleDiameterUm.toFixed(1)} µm</span>
            <span className="block text-[10px] text-slate-400">
              {particleDiameterUm < 2
                ? 'Fine (< 2 µm) — Negligible'
                : particleDiameterUm < 10
                ? 'Standard (2–10 µm) — Moderate'
                : 'Coarse (> 10 µm) — Severe'}
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0.5"
          max="45"
          step="0.5"
          value={particleDiameterUm}
          onChange={(e) => onUpdateParticleDiameter(parseFloat(e.target.value) || 5.0)}
          className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono tabular-nums">
          <span>0.5 µm (Micronized)</span>
          <span>5.0 µm (Lab standard)</span>
          <span>15.0 µm (Mortar ground)</span>
          <span>45.0 µm (325 mesh)</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Converged Mean Linear Abs. (μ̄)</span>
          <div className="text-lg font-mono tabular-nums font-black text-cyan-300">
            {calculations.muBar.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm⁻¹</span>
          </div>
          <p className="text-[10px] text-slate-400">Self-consistent phase-weighted attenuation</p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Maximum Quant Shift (Δw)</span>
          <div className={`text-lg font-mono tabular-nums font-black ${calculations.maxErrorPct > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {calculations.maxErrorPct.toFixed(2)} wt%
          </div>
          <p className="text-[10px] text-slate-400">Shift from uncorrected to Brindley-corrected wt%</p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Brindley Regime Severity</span>
          <div className="text-lg font-bold text-slate-200">
            {calculations.maxErrorPct < 1 ? (
              <span className="text-emerald-400 text-sm">Negligible (&lt; 1 wt%)</span>
            ) : calculations.maxErrorPct < 5 ? (
              <span className="text-amber-400 text-sm">Noticeable (1–5 wt%)</span>
            ) : (
              <span className="text-rose-400 text-sm">Critical (&gt; 5 wt%)</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">Correction recommended above 2 wt% shift</p>
        </div>
      </div>

      {/* Main Table: Contrast & Transmission Factors */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Phase Microabsorption Parameters & Transmission Factors (τᵢ)</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-sans">Phase</th>
                <th className="px-3 py-3 text-right">μᵢ (cm⁻¹)</th>
                <th className="px-3 py-3 text-right">Contrast Δμ</th>
                <th className="px-3 py-3 text-right text-cyan-300 font-bold">Transmission τᵢ</th>
                <th className="px-3 py-3 text-right text-slate-400">Uncorr. wt%</th>
                <th className="px-3 py-3 text-right text-emerald-300 font-bold">Brindley wt%</th>
                <th className="px-3 py-3 text-right">Δ wt%</th>
                <th className="px-3 py-3 text-right text-amber-300">Crit. D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {calculations.phaseStats.map((p, idx) => {
                const uncorr = calculations.uncorrectedWt[idx];
                const corr = calculations.correctedWt[idx];
                const delta = corr - uncorr;
                return (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-200 font-sans flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span>{p.name}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-400">{p.mu.toFixed(1)}</td>
                    <td className="px-3 py-3 text-right text-slate-400">
                      {p.sigma > 0 ? `+${p.sigma.toFixed(1)}` : p.sigma.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-cyan-300 font-mono">
                      {p.tau.toFixed(4)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-400">{uncorr.toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-300 font-mono">{corr.toFixed(2)}%</td>
                    <td className={`px-3 py-3 text-right font-bold font-mono ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-right text-amber-300 font-mono">
                      {p.critD_um < 100 ? `${p.critD_um.toFixed(1)} µm` : '> 100 µm'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart: Transmission Factor vs Particle Diameter */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Transmission Factor (τᵢ) vs Grain Size (D)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Ideal τ = 1.0 (Zero microabsorption)</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tauVsDiameterData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="diameter"
                label={{ value: 'Particle Diameter D (µm)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                domain={[0.7, 1.3]}
                label={{ value: 'Transmission Factor (τ)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {phases.map((p) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.name}
                  stroke={p.color || '#6366f1'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
