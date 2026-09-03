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

interface RIRBrindleyInspectorProps {
  phases: RIRMatrixPhase[];
  particleDiameterUm: number;
  onUpdateParticleDiameter: (d: number) => void;
  useBrindley: boolean;
  onToggleBrindley: (enabled: boolean) => void;
}

// Spherical particle Brindley factor
export function calcBrindleyTau(sigma_i: number, D_cm: number): number {
  const x = sigma_i * D_cm;
  if (Math.abs(x) < 1e-4) {
    return 1.0 - (9.0 / 16.0) * x + (1.0 / 6.0) * (x * x);
  }
  // Numerical stability clamp
  if (x > 50) return 0.01;
  if (x < -20) return 5.0;

  const tau = (3.0 / (2.0 * Math.pow(x, 3))) * (Math.pow(x, 2) - 2.0 + 2.0 * (1.0 + x) * Math.exp(-x));
  return Math.max(0.01, Math.min(10.0, tau));
}

export const RIRBrindleyInspector: React.FC<RIRBrindleyInspectorProps> = ({
  phases,
  particleDiameterUm,
  onUpdateParticleDiameter,
  useBrindley,
  onToggleBrindley
}) => {
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number>(0);

  // Computations
  const calculations = useMemo(() => {
    if (!phases || phases.length === 0) {
      return {
        muBar: 0,
        phaseStats: [],
        uncorrectedWt: [],
        correctedWt: [],
        maxErrorPct: 0
      };
    }

    const D_cm = (particleDiameterUm || 5.0) * 1e-4;

    // 1. Calculate linear absorption coefficient mu_i = rho_i * MAC_i
    const phaseProps = phases.map(p => {
      const rho = p.density && p.density > 0 ? p.density : 3.0;
      const mac = p.mac && p.mac > 0 ? p.mac : 50.0;
      const mu = rho * mac; // cm^-1
      const reducedI = (p.intensity || 0) / (p.rir > 0 ? p.rir : 1.0);
      return {
        ...p,
        rho,
        mac,
        mu,
        reducedI
      };
    });

    // 2. Uncorrected weight fractions
    const totalReducedI = phaseProps.reduce((sum, p) => sum + p.reducedI, 0);
    const uncorrectedWt = phaseProps.map(p =>
      totalReducedI > 0 ? (p.reducedI / totalReducedI) * 100 : 0
    );

    // 3. Sample mean linear absorption coefficient muBar = sum(w_i * mu_i)
    const muBar = uncorrectedWt.reduce((sum, w, idx) => sum + (w / 100) * phaseProps[idx].mu, 0);

    // 4. Contrast sigma_i = mu_i - muBar and Brindley factor tau_i
    const phaseStats = phaseProps.map((p, idx) => {
      const sigma = p.mu - muBar; // cm^-1
      const tau = calcBrindleyTau(sigma, D_cm);
      const correctedI = p.intensity / tau;
      const correctedReducedI = correctedI / (p.rir > 0 ? p.rir : 1.0);
      const critD_um = Math.abs(sigma) > 0.1 ? (0.1 / Math.abs(sigma)) * 1e4 : 999;

      return {
        ...p,
        uncorrectedWtPct: uncorrectedWt[idx],
        sigma,
        tau,
        correctedI,
        correctedReducedI,
        critD_um
      };
    });

    // 5. Corrected weight fractions
    const totalCorrectedReducedI = phaseStats.reduce((sum, p) => sum + p.correctedReducedI, 0);
    const correctedWt = phaseStats.map(p =>
      totalCorrectedReducedI > 0 ? (p.correctedReducedI / totalCorrectedReducedI) * 100 : 0
    );

    let maxErrorPct = 0;
    phaseStats.forEach((p, idx) => {
      const diff = Math.abs(correctedWt[idx] - uncorrectedWt[idx]);
      if (diff > maxErrorPct) maxErrorPct = diff;
    });

    return {
      muBar,
      phaseStats,
      uncorrectedWt,
      correctedWt,
      maxErrorPct
    };
  }, [phases, particleDiameterUm]);

  // Curve of tau vs Diameter for all phases
  const tauVsDiameterData = useMemo(() => {
    if (!phases || phases.length === 0) return [];
    const pts = [];
    const diameters = [0.2, 0.5, 1.0, 2.0, 3.0, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0, 45.0];

    diameters.forEach(d => {
      const D_cm = d * 1e-4;
      const pt: Record<string, any> = { diameter: d };
      calculations.phaseStats.forEach(p => {
        const tau = calcBrindleyTau(p.sigma, D_cm);
        pt[p.name] = Number(tau.toFixed(3));
      });
      pts.push(pt);
    });
    return pts;
  }, [phases, calculations]);

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              Brindley Microabsorption & Particle Size Correction
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Rigorous analytical model (Brindley, 1945) correcting for grain-size-dependent intensity damping in multiphase mixtures with large linear absorption contrasts.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300">Apply to Quant Engine:</span>
          <button
            onClick={() => {
              playSynthTone('tick');
              onToggleBrindley(!useBrindley);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              useBrindley
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {useBrindley ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
            <span>{useBrindley ? 'Active' : 'Disabled'}</span>
          </button>
        </div>
      </div>

      {/* Control Banner: Mean Grain Size Slider */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Mean Powder Particle Diameter (D):</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Standard grinding produces 2–10 µm; sieve sizes &gt;20 µm exhibit severe microabsorption distortions.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black font-mono text-cyan-300">{particleDiameterUm.toFixed(1)} µm</span>
            <span className="block text-[10px] text-slate-400">
              {particleDiameterUm < 2
                ? 'Fine (< 2 µm) - Negligible Effect'
                : particleDiameterUm < 10
                ? 'Standard powder (2-10 µm) - Moderate Effect'
                : 'Coarse powder (> 10 µm) - Severe Effect'}
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

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0.5 µm (Micronized)</span>
          <span>5.0 µm (Lab standard)</span>
          <span>15.0 µm (Mortar ground)</span>
          <span>45.0 µm (325 mesh sieve)</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Sample Mean Linear Absorption (μ̄)</span>
          <div className="text-lg font-mono font-black text-cyan-300">
            {calculations.muBar.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm⁻¹</span>
          </div>
          <p className="text-[10px] text-slate-400">Weighted sum of crystallographic linear absorptions</p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Maximum Quant Error (Δw)</span>
          <div className={`text-lg font-mono font-black ${calculations.maxErrorPct > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {calculations.maxErrorPct.toFixed(2)} wt%
          </div>
          <p className="text-[10px] text-slate-400">Difference between uncorrected and Brindley-corrected wt%</p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Brindley Regime Severity</span>
          <div className="text-lg font-bold text-slate-200">
            {calculations.maxErrorPct < 1 ? (
              <span className="text-emerald-400 text-sm">Negligible (&lt; 1%)</span>
            ) : calculations.maxErrorPct < 5 ? (
              <span className="text-amber-400 text-sm">Noticeable (1–5%)</span>
            ) : (
              <span className="text-rose-400 text-sm">Critical (&gt; 5%)</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">Correction recommended if discrepancy &gt; 2 wt%</p>
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
