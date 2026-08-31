import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import {
  Award,
  Layers,
  TrendingUp,
  Ruler,
  CheckCircle,
  Copy,
  Download,
  Atom,
  Sliders,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { DoubleVoigtResult } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';

interface DoubleVoigtMicrostructureSummaryProps {
  result: DoubleVoigtResult;
  wavelength: number;
  onCopyLaTeX: () => void;
  onDownloadCSV: () => void;
  copiedNotification: boolean;
}

export const DoubleVoigtMicrostructureSummary: React.FC<DoubleVoigtMicrostructureSummaryProps> = ({
  result,
  wavelength,
  onCopyLaTeX,
  onDownloadCSV,
  copiedNotification
}) => {
  const { lengthUnit = 'Å' } = useSettings();
  const [burgersVector, setBurgersVector] = useState<number>(result?.burgersVectorNm || 0.25);
  const [youngsModulus, setYoungsModulus] = useState<number>(result?.youngsModulusGpa || 150);

  // Recalculate dislocation density dynamically if Burgers vector changes
  const dvMeters = (result?.volumeSizeDvNm ?? 0) * 1e-9;
  const bMeters = burgersVector * 1e-9;
  const rmsStrain = result?.rmsStrain ?? 0;
  const dynamicDislocationDensityM2 = dvMeters > 0 && bMeters > 0
    ? (2 * Math.sqrt(3) * rmsStrain) / (dvMeters * bMeters)
    : (result?.dislocationDensityM2 ?? 0);
  const dynamicDislocationDensityCm2 = dynamicDislocationDensityM2 * 1e-4;

  // Recalculate strain energy density
  const dynamicStrainEnergyKjM3 = 0.5 * (youngsModulus * 1e9) * Math.pow(rmsStrain, 2) / 1000;

  // Size Comparison data for Bar Chart
  const sizeBarData = [
    { name: 'Volume Size ⟨D_V⟩', size: result?.volumeSizeDvNm ?? 0, color: '#6366f1' },
    { name: 'Area Size ⟨D_A⟩', size: result?.areaSizeDaNm ?? 0, color: '#a855f7' },
    { name: 'Mode Size (Peak)', size: result?.modeSizeNm || (result?.volumeSizeDvNm ?? 0) * 0.7, color: '#10b981' },
    { name: 'Median Size', size: result?.medianSizeNm || (result?.volumeSizeDvNm ?? 0), color: '#f59e0b' },
    { name: 'Gaussian Size D_G', size: result?.gaussianSizeDgNm ?? 0, color: '#06b6d4' }
  ];

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Double_Voigt_Results_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-indigo-500/20 relative shadow-inner">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Microstructural Parameters & Defect Summary
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCopyLaTeX}
            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedNotification ? 'LaTeX Copied!' : 'Copy LaTeX'}</span>
          </button>

          <button
            onClick={onDownloadCSV}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Primary Quantitative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Crystallite Size Metrics */}
        <div className="bg-black/50 p-4 rounded-2xl border border-indigo-500/20 space-y-3 font-mono">
          <div className="flex items-center justify-between text-indigo-400 border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Ruler className="w-4 h-4" />
              <span>Crystallite Dimensions</span>
            </div>
            <span className="text-[10px] text-slate-400">{lengthUnit}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Volume Size ⟨D_V⟩:</span>
              <span className="text-white font-bold text-sm">
                {convertLength((result?.volumeSizeDvNm ?? 0) * 10, lengthUnit).toFixed(1)} {lengthUnit}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Area Size ⟨D_A⟩:</span>
              <span className="text-purple-300 font-bold text-sm">
                {convertLength((result?.areaSizeDaNm ?? 0) * 10, lengthUnit).toFixed(1)} {lengthUnit}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Mode Size (Peak):</span>
              <span className="text-emerald-300 font-bold">
                {convertLength(((result?.modeSizeNm || (result?.volumeSizeDvNm ?? 0) * 0.7)) * 10, lengthUnit).toFixed(1)} {lengthUnit}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-white/5">
              <span className="text-slate-400">Polydispersity ⟨D_V⟩/⟨D_A⟩:</span>
              <span className="text-cyan-300 font-bold">{result?.polydispersityIndex !== undefined ? result.polydispersityIndex.toFixed(2) : '1.00'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Microstrain Breakdown */}
        <div className="bg-black/50 p-4 rounded-2xl border border-purple-500/20 space-y-3 font-mono">
          <div className="flex items-center justify-between text-purple-400 border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>Microstrain & Lattice Distortion</span>
            </div>
            <span className="text-[10px] text-slate-400">% Strain</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">RMS Strain ⟨e²⟩¹/²:</span>
              <span className="text-cyan-300 font-bold text-sm">
                {((result?.rmsStrain ?? 0) * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Cauchy Strain e_C:</span>
              <span className="text-indigo-300 font-bold">
                {((result?.cauchyStrainEc ?? 0) * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Gaussian Strain e_G:</span>
              <span className="text-purple-300 font-bold">
                {((result?.gaussianStrainEg ?? 0) * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-white/5">
              <span className="text-slate-400">Strain Uncertainty:</span>
              <span className="text-slate-300 font-bold">±{((result?.uncertainties?.rmsStrainStdErr ?? 0) * 100).toFixed(4)}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Williamson-Smallman Dislocation Density */}
        <div className="bg-black/50 p-4 rounded-2xl border border-emerald-500/20 space-y-3 font-mono">
          <div className="flex items-center justify-between text-emerald-400 border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Atom className="w-4 h-4" />
              <span>Dislocation Density (ρ_d)</span>
            </div>
            <span className="text-[10px] text-slate-400">Defects</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Total Density ρ_d:</span>
              <span className="text-emerald-300 font-bold text-sm">
                {dynamicDislocationDensityM2.toExponential(2)} <span className="text-[10px] text-slate-400">m⁻²</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">In cm⁻²:</span>
              <span className="text-white font-bold">
                {dynamicDislocationDensityCm2.toExponential(2)} <span className="text-[10px] text-slate-400">cm⁻²</span>
              </span>
            </div>

            {/* Burgers Vector Selector */}
            <div className="pt-2 border-t border-white/5 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Burgers Vector b:</span>
                <span className="text-emerald-300 font-bold">{burgersVector} nm</span>
              </div>
              <div className="flex gap-1">
                {[0.25, 0.28, 0.32].map(bVal => (
                  <button
                    key={bVal}
                    onClick={() => setBurgersVector(bVal)}
                    className={`flex-1 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                      burgersVector === bVal
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                        : 'bg-black/40 text-slate-400 border-white/10'
                    }`}
                  >
                    {bVal} nm
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Elastic Energy & Crystallite Habit */}
        <div className="bg-black/50 p-4 rounded-2xl border border-cyan-500/20 space-y-3 font-mono">
          <div className="flex items-center justify-between text-cyan-400 border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>Strain Energy & Habit</span>
            </div>
            <span className="text-[10px] text-slate-400">Thermodynamics</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Strain Energy W_H:</span>
              <span className="text-cyan-300 font-bold text-sm">
                {dynamicStrainEnergyKjM3.toFixed(2)} <span className="text-[10px] text-slate-400">kJ/m³</span>
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-slate-400">Young&apos;s Modulus E:</span>
              <span className="text-white font-bold">{youngsModulus} GPa</span>
            </div>

            {result.anisotropySummary && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Habit Type:</span>
                  <span className="text-amber-300 font-bold">{result.anisotropySummary.habitType}</span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {result.anisotropySummary.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Comparison Bar Chart Canvas */}
      <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="font-bold uppercase tracking-wider">Crystallite Size Metric Spectrum Comparison</span>
          <span className="text-[11px] text-slate-400">Double-Voigt vs. Balzar Fourier Formulations</span>
        </div>

        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sizeBarData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                label={{
                  value: `Crystallite Size [${lengthUnit}]`,
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  fill: '#818cf8',
                  fontSize: 11,
                  fontFamily: 'monospace'
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl font-mono text-xs text-white space-y-1">
                        <div className="text-indigo-400 font-bold border-b border-white/10 pb-1">{d.name}</div>
                        <div>Calculated Size: <span className="text-white font-bold">{convertLength(d.size * 10, lengthUnit).toFixed(2)} {lengthUnit}</span> ({d.size.toFixed(2)} nm)</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="size" radius={[8, 8, 0, 0]}>
                {sizeBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
