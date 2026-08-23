import React, { useState } from 'react';
import { WAMetrics, WAResult } from '../types';
import { ShieldCheck, AlertCircle, Copy, Check, FileSpreadsheet, Atom, Ruler, Activity, Layers, Flame, ArrowUpRight, Award } from 'lucide-react';

interface WarrenAverbachMetricsSummaryProps {
  metrics: WAMetrics;
  result: WAResult;
  materialName: string;
  d1: number;
  d2: number;
  d3?: number;
  d4?: number;
  burgersVector: number;
  youngsModulus: number;
  onDownloadCSV: () => void;
}

export const WarrenAverbachMetricsSummary: React.FC<WarrenAverbachMetricsSummaryProps> = ({
  metrics,
  result,
  materialName,
  d1,
  d2,
  d3,
  d4,
  burgersVector,
  youngsModulus,
  onDownloadCSV
}) => {
  const [copiedLatex, setCopiedLatex] = useState(false);

  const generateLatex = () => {
    const tex = `\\begin{table}[htbp]
\\centering
\\caption{Warren-Averbach Crystallographic Analysis: ${materialName}}
\\begin{tabular}{lcc}
\\hline
\\textbf{Parameter} & \\textbf{Symbol} & \\textbf{Value} \\\\
\\hline
Area-Weighted Column Length & $\\langle D \\rangle_A$ & ${metrics.areaWeightedColumnLengthNm.toFixed(2)}~\\text{nm} \\\\
Volume-Weighted Column Length & $\\langle D \\rangle_V$ & ${metrics.volumeWeightedColumnLengthNm.toFixed(2)}~\\text{nm} \\\\
Crystallite Size Distribution Mode & $D_{\\text{mode}}$ & ${metrics.crystalliteSizeDistributionModeNm.toFixed(2)}~\\text{nm} \\\\
Dislocation Density & $\\rho$ & ${metrics.dislocationDensity10_14.toFixed(3)} \\times 10^{14}~\\text{m}^{-2} \\\\
Wilkens Cutoff Radius & $R_e$ & ${metrics.wilkensCutoffRadiusNm.toFixed(1)}~\\text{nm} \\\\
Wilkens Arrangement Parameter & $M = R_e \\sqrt{\\rho}$ & ${metrics.wilkensArrangementParameterM.toFixed(2)} \\\\
Dislocation Character & --- & ${metrics.wilkensDislocationCharacter || 'mixed'} \\\\
Strain Energy Density & $W_H$ & ${metrics.apparentStrainEnergyKJm3.toFixed(2)}~\\text{kJ/m}^3 \\\\
Specific Surface Area & $S_V$ & ${metrics.specificSurfaceAreaM2g ? metrics.specificSurfaceAreaM2g.toFixed(1) : '---'}~\\text{m}^2/\\text{g} \\\\
Hook Effect Extrapolated $A_0^*$ & $A_0^*$ & ${metrics.hookEffectExtrapolatedIntercept.toFixed(4)} \\\\
Harmonic Regression Fit Quality & $\\bar{R}^2$ & ${metrics.r2_average.toFixed(4)} \\\\
\\hline
\\end{tabular}
\\label{tab:warren_averbach_${materialName.toLowerCase().replace(/[^a-z0-9]/g, '_')}}
\\end{table}`;

    navigator.clipboard.writeText(tex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-2xl p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl border border-rose-500/30 text-rose-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-slate-100 tracking-tight font-sans flex items-center gap-2">
              Warren-Averbach Quantitative Report
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                {materialName}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono mt-1">
              Rigorous Fourier Deconvolution & Wilkens Dislocation State
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={generateLatex}
            className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-2 shadow-sm"
            title="Copy publication-ready LaTeX table"
          >
            {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLatex ? 'LaTeX Copied!' : 'Export LaTeX'}</span>
          </button>

          <button
            onClick={onDownloadCSV}
            className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Hook Effect Status Banner */}
      <div className="mb-6 relative z-10">
        {metrics.hookEffectDetected ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-200 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold font-mono uppercase tracking-wider text-[11px] text-amber-300">
                Hook Effect Corrected (A₀* = {metrics.hookEffectExtrapolatedIntercept.toFixed(3)})
              </span>
              <p className="text-[11px] text-amber-200/80 font-sans leading-relaxed">
                Initial upward concavity from peak truncation or background over-subtraction has been linearized via tangent extrapolation to ensure physical column size distribution.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold font-mono uppercase tracking-wider text-[11px] text-emerald-300">
                Coherent Fourier Decay Detected (No Hook Effect)
              </span>
              <p className="text-[11px] text-emerald-200/80 font-sans leading-relaxed">
                Fourier coefficients exhibit physical convex-downward decay starting at L = 0.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        
        {/* Card 1: Area-Weighted Size */}
        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2 hover:border-rose-500/20 transition-colors">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span>⟨D⟩_A (Area Mean)</span>
            <Ruler className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-rose-400">
              {metrics.areaWeightedColumnLengthNm.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-sans font-medium">nm</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Initial slope: {metrics.initialSlope.toFixed(4)} nm⁻¹
          </p>
        </div>

        {/* Card 2: Volume-Weighted Size */}
        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2 hover:border-rose-500/20 transition-colors">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span>⟨D⟩_V (Volume Mean)</span>
            <Atom className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-orange-400">
              {metrics.volumeWeightedColumnLengthNm.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-sans font-medium">nm</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            2 × Integral of A_size(L)
          </p>
        </div>

        {/* Card 3: Dislocation Density */}
        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2 hover:border-cyan-500/20 transition-colors">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span>Dislocation Density (ρ)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-cyan-400">
              {metrics.dislocationDensity10_14.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">×10¹⁴ m⁻²</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Wilkens log-strain fit
          </p>
        </div>

        {/* Card 4: Wilkens Arrangement M */}
        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2 hover:border-purple-500/20 transition-colors">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span>Wilkens Param (M)</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-400">
              {metrics.wilkensArrangementParameterM.toFixed(2)}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono uppercase">
              {metrics.wilkensDislocationCharacter || 'mixed'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            R_e = {metrics.wilkensCutoffRadiusNm.toFixed(1)} nm
          </p>
        </div>

      </div>

      {/* Extended Crystallographic Metrics Table */}
      <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative z-10">
        <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
            Full Microstructural Parameters
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Harmonic regression fit: <span className="text-emerald-400 font-bold">R² = {metrics.r2_average.toFixed(4)}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 text-xs font-mono">
          <div className="divide-y divide-white/5 p-2">
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Primary Reflection Spacing (d₁):</span>
              <span className="text-slate-200 font-bold">{d1.toFixed(4)} Å</span>
            </div>
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Secondary Reflection Spacing (d₂):</span>
              <span className="text-slate-200 font-bold">{d2.toFixed(4)} Å</span>
            </div>
            {d3 && (
              <div className="flex justify-between py-2.5 px-3">
                <span className="text-slate-400">Third Reflection Spacing (d₃):</span>
                <span className="text-slate-200 font-bold">{d3.toFixed(4)} Å</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Column Length Dist. Mode (D_mode):</span>
              <span className="text-rose-400 font-bold">{metrics.crystalliteSizeDistributionModeNm.toFixed(1)} nm</span>
            </div>
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Size Distribution FWHM:</span>
              <span className="text-rose-400 font-bold">{metrics.crystalliteSizeDistributionFWHMNm.toFixed(1)} nm</span>
            </div>
          </div>

          <div className="divide-y divide-white/5 p-2">
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Burgers Vector Magnitude (b):</span>
              <span className="text-slate-200 font-bold">{burgersVector.toFixed(3)} nm</span>
            </div>
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Young's Modulus (E):</span>
              <span className="text-slate-200 font-bold">{youngsModulus} GPa</span>
            </div>
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Apparent Strain Energy Density (W_H):</span>
              <span className="text-cyan-400 font-bold">{metrics.apparentStrainEnergyKJm3.toFixed(2)} kJ/m³</span>
            </div>
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Estimated Specific Surface Area (S_V):</span>
              <span className="text-emerald-400 font-bold">
                {metrics.specificSurfaceAreaM2g ? `${metrics.specificSurfaceAreaM2g.toFixed(1)} m²/g` : '---'}
              </span>
            </div>
            <div className="flex justify-between py-2.5 px-3">
              <span className="text-slate-400">Hook Tangent Intercept (A₀*):</span>
              <span className="text-amber-400 font-bold">{metrics.hookEffectExtrapolatedIntercept.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
