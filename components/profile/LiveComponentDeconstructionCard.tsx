import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Sliders,
  Download,
  Copy,
  Check,
  Sparkles,
  Info,
  Scale,
  Flame,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Table
} from 'lucide-react';

export interface DeconstructedComponentItem {
  id: string;
  name: string;
  formula: string;
  color: string;
  enabled: boolean;
  visible: boolean;
  center: number;
  fwhm: number;
  amplitude: number;
  area: number;
  fractionPercent: number;
  integralBreadth: number;
  shapeFactor: number;
}

export interface LiveComponentDeconstructionCardProps {
  components: DeconstructedComponentItem[];
  onToggleVisibility: (id: string) => void;
  onToggleAllVisibility: (visible: boolean) => void;
  // Interactive shape parameters
  type: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Pearson VII' | 'Thompson-Cox-Hastings';
  onTypeChange: (t: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Pearson VII' | 'Thompson-Cox-Hastings') => void;
  eta: number;
  onEtaChange: (eta: number) => void;
  pearsonM: number;
  onPearsonMChange: (m: number) => void;
  asymmetry: number;
  onAsymmetryChange: (asym: number) => void;
  background: number;
  onBackgroundChange: (bg: number) => void;
  bgSlope: number;
  onBgSlopeChange: (slope: number) => void;
  bgCurvature: number;
  onBgCurvatureChange: (curv: number) => void;
  // Total stats
  totalModelArea: number;
  observedTotalArea: number;
}

export const LiveComponentDeconstructionCard: React.FC<LiveComponentDeconstructionCardProps> = ({
  components,
  onToggleVisibility,
  onToggleAllVisibility,
  type,
  onTypeChange,
  eta,
  onEtaChange,
  pearsonM,
  onPearsonMChange,
  asymmetry,
  onAsymmetryChange,
  background,
  onBackgroundChange,
  bgSlope,
  onBgSlopeChange,
  bgCurvature,
  onBgCurvatureChange,
  totalModelArea,
  observedTotalArea
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showSlidersTray, setShowSlidersTray] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'budget' | 'parameters'>('budget');

  const activeComponents = components.filter((c) => c.enabled);

  const handleCopyTable = () => {
    const headers = 'Component,Formula,2Theta_deg,FWHM_deg,I_max_cps,Area_cps_deg,Area_Share_Pct\n';
    const rows = activeComponents
      .map(
        (c) =>
          `"${c.name}","${c.formula}",${c.center.toFixed(3)},${c.fwhm.toFixed(4)},${c.amplitude.toFixed(1)},${c.area.toFixed(2)},${c.fractionPercent.toFixed(1)}%`
      )
      .join('\n');
    navigator.clipboard.writeText(headers + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const headers = 'Component,Formula,2Theta_deg,FWHM_deg,I_max_cps,Area_cps_deg,Area_Share_Pct\n';
    const rows = activeComponents
      .map(
        (c) =>
          `"${c.name}","${c.formula}",${c.center.toFixed(3)},${c.fwhm.toFixed(4)},${c.amplitude.toFixed(1)},${c.area.toFixed(2)},${c.fractionPercent.toFixed(1)}%`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xrd_peak_deconvolution_budget_${type.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4 bg-slate-900 text-slate-100 rounded-2xl border-2 border-indigo-500/40 shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Live Peak Component Deconstruction & Energy Budget
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {activeComponents.length} Active Layers
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Independent spectral breakdown of Bragg reflections, Voigt parts, satellite doublets, and baseline
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Component Table
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parameters')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'parameters' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tuning Sliders
            </button>
          </div>

          <button
            type="button"
            onClick={() => onToggleAllVisibility(true)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all cursor-pointer"
            title="Show all components in chart"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={handleCopyTable}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Copy component table to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Download CSV table"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Component Energy Budget Stacked Progress Bar */}
      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            Integrated Area Contribution Partition
          </span>
          <span className="text-slate-400">
            Total Model Area: <strong className="text-indigo-300">{totalModelArea.toFixed(1)} cps·°</strong>
          </span>
        </div>

        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-700/60 p-0.5">
          {activeComponents.map((c) => {
            if (c.fractionPercent <= 0) return null;
            return (
              <div
                key={`bar-seg-${c.id}`}
                style={{
                  width: `${Math.max(1, c.fractionPercent)}%`,
                  backgroundColor: c.color
                }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-80"
                title={`${c.name}: ${c.fractionPercent.toFixed(1)}% (${c.area.toFixed(1)} cps·°)`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
          {activeComponents.map((c) => (
            <div key={`legend-pill-${c.id}`} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-slate-300 font-medium">{c.name}:</span>
              <strong style={{ color: c.color }}>{c.fractionPercent.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'budget' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">View</th>
                <th className="py-2.5 px-3">Component Layer</th>
                <th className="py-2.5 px-3">Model Equation</th>
                <th className="py-2.5 px-3 text-right">Center (2θ)</th>
                <th className="py-2.5 px-3 text-right">FWHM (β)</th>
                <th className="py-2.5 px-3 text-right">I_max</th>
                <th className="py-2.5 px-3 text-right">Area (cps·°)</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeComponents.map((c) => (
                <tr
                  key={`tbl-comp-${c.id}`}
                  className={`hover:bg-slate-800/40 transition-colors ${!c.visible ? 'opacity-40' : ''}`}
                >
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => onToggleVisibility(c.id)}
                      className="p-1 rounded hover:bg-slate-700 transition-colors cursor-pointer"
                      title={c.visible ? 'Hide from chart' : 'Show in chart'}
                    >
                      {c.visible ? (
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="font-bold text-white text-xs">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{c.formula}</td>
                  <td className="py-2 px-3 text-right text-indigo-300 font-bold">{c.center.toFixed(3)}°</td>
                  <td className="py-2 px-3 text-right text-purple-300 font-bold">{c.fwhm.toFixed(4)}°</td>
                  <td className="py-2 px-3 text-right text-cyan-300">{c.amplitude.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right text-emerald-300 font-bold">{c.area.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className="px-1.5 py-0.5 rounded font-bold text-xs"
                      style={{
                        backgroundColor: `${c.color}20`,
                        color: c.color,
                        border: `1px solid ${c.color}50`
                      }}
                    >
                      {c.fractionPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tuning Sliders Tab */}
      {activeTab === 'parameters' && (
        <div className="p-4 bg-slate-950/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Profile Shape Function Selector */}
          <div className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Analytical Shape Function
            </span>
            <div className="grid grid-cols-2 gap-1 font-mono text-xs">
              {(['Pseudo-Voigt', 'Thompson-Cox-Hastings', 'Pearson VII', 'Gaussian', 'Lorentzian'] as const).map(
                (shapeName) => (
                  <button
                    key={shapeName}
                    type="button"
                    onClick={() => onTypeChange(shapeName)}
                    className={`p-2 rounded-lg text-left transition-all cursor-pointer border ${
                      type === shapeName
                        ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    } ${shapeName === 'Thompson-Cox-Hastings' ? 'col-span-2' : ''}`}
                  >
                    <div className="font-semibold">{shapeName === 'Thompson-Cox-Hastings' ? 'Thompson-Cox-Hastings (TCH-pV)' : shapeName}</div>
                    <div className="text-[9px] opacity-75">
                      {shapeName === 'Thompson-Cox-Hastings'
                        ? 'Rietveld Caglioti & de Keijser breadth'
                        : shapeName === 'Pearson VII'
                        ? 'Variable power-law exponent m'
                        : shapeName === 'Pseudo-Voigt'
                        ? 'Linear combination (1-η)G + ηL'
                        : shapeName === 'Gaussian'
                        ? 'Exponential decay tails'
                        : 'Heavy Lorentzian tail decay'}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* 2. Model Specific Sliders (TCH, Pearson VII, or Pseudo-Voigt) */}
          <div className="space-y-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
            {type === 'Pearson VII' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Pearson VII Shape Exponent (m)
                  </span>
                  <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    m = {pearsonM.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={pearsonM}
                  onChange={(e) => onPearsonMChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                  {[
                    { m: 1.0, label: 'm=1 (Cauchy)' },
                    { m: 2.0, label: 'm=2 (Standard XRD)' },
                    { m: 5.0, label: 'm=5 (Intermediate)' },
                    { m: 10.0, label: 'm=10 (Gaussian)' }
                  ].map((btn) => (
                    <button
                      key={btn.m}
                      type="button"
                      onClick={() => onPearsonMChange(btn.m)}
                      className={`p-1 rounded text-center transition-all cursor-pointer border ${
                        Math.abs(pearsonM - btn.m) < 0.05
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(type === 'Pseudo-Voigt' || type === 'Thompson-Cox-Hastings') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {type === 'Thompson-Cox-Hastings' ? 'Lorentzian Breadth Fraction (η_L)' : 'Voigt Mixing Factor (η)'}
                  </span>
                  <span className="font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    {(eta * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={eta}
                  onChange={(e) => onEtaChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>0% (100% Gaussian)</span>
                  <span>50% (Equal Mix)</span>
                  <span>100% (100% Lorentzian)</span>
                </div>
              </div>
            )}

            {/* Asymmetry Parameter */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                  Peak Asymmetry Ratio (A)
                </span>
                <span className="font-mono font-bold text-cyan-400">
                  {asymmetry.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.01"
                value={asymmetry}
                onChange={(e) => onAsymmetryChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0.5 (Left skew)</span>
                <span>1.0 (Symmetric)</span>
                <span>2.0 (Right skew)</span>
              </div>
            </div>
          </div>

          {/* 3. Polynomial Background Controls */}
          <div className="space-y-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Background Polynomial: B(2θ) = b₀ + b₁(2θ - 2θ₀) + b₂(2θ - 2θ₀)²
            </span>

            {/* Baseline b0 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Baseline (b₀):</span>
                <span className="text-white font-bold">{background.toFixed(1)} cps</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={background}
                onChange={(e) => onBackgroundChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Linear Slope b1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Linear Slope (b₁):</span>
                <span className="text-white font-bold">{bgSlope.toFixed(2)} cps/°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.1"
                value={bgSlope}
                onChange={(e) => onBgSlopeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Quadratic Curvature b2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Quadratic Curvature (b₂):</span>
                <span className="text-white font-bold">{bgCurvature.toFixed(3)} cps/°²</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={bgCurvature}
                onChange={(e) => onBgCurvatureChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
