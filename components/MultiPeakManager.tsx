import React, { useState } from 'react';
import { 
  Plus, Trash2, Copy, Eye, EyeOff, Activity, Layers, 
  FileSpreadsheet, Sparkles, Check, Palette, ChevronDown, ChevronUp,
  SlidersHorizontal, ArrowUpDown, HelpCircle, CornerDownRight, RotateCcw
} from 'lucide-react';
import { CustomPeak, CustomPeakMetrics } from '../types';

export const SCIENTIFIC_PEAK_COLORS = [
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ef4444', name: 'Crimson' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#3b82f6', name: 'Royal Blue' },
  { hex: '#84cc16', name: 'Lime' },
  { hex: '#d946ef', name: 'Fuchsia' },
];

export const MULTI_PEAK_PRESETS: { 
  name: string; 
  badge: string;
  description: string; 
  peaks: Omit<CustomPeak, 'id'>[] 
}[] = [
  {
    name: 'Cu Kα1 / Kα2 Doublet Split',
    badge: '2 Peaks (2:1)',
    description: 'Characteristic X-ray emission doublet split at 69.13° (2:1 intensity ratio, ~0.19° separation).',
    peaks: [
      { name: 'Cu Kα1 (111)', color: '#3b82f6', enabled: true, center: 69.13, fwhm: 0.18, amplitude: 140, shape: 'Pseudo-Voigt', eta: 0.5, asymmetry: 1.0 },
      { name: 'Cu Kα2 (111)', color: '#f59e0b', enabled: true, center: 69.32, fwhm: 0.20, amplitude: 70, shape: 'Pseudo-Voigt', eta: 0.5, asymmetry: 1.0 }
    ]
  },
  {
    name: 'Overlapping Deconvolution Triplet',
    badge: '3 Peaks',
    description: 'Three partially resolved polymorphic reflections centered around 38.2° requiring line profile deconvolution.',
    peaks: [
      { name: 'Phase α (110)', color: '#6366f1', enabled: true, center: 37.85, fwhm: 0.32, amplitude: 85, shape: 'Pseudo-Voigt', eta: 0.6, asymmetry: 1.0 },
      { name: 'Phase β (102)', color: '#ec4899', enabled: true, center: 38.30, fwhm: 0.26, amplitude: 130, shape: 'Pseudo-Voigt', eta: 0.45, asymmetry: 1.0 },
      { name: 'Phase γ (004)', color: '#10b981', enabled: true, center: 38.72, fwhm: 0.38, amplitude: 60, shape: 'Pseudo-Voigt', eta: 0.7, asymmetry: 1.0 }
    ]
  },
  {
    name: 'TiO₂ Anatase / Rutile Phase Mixture',
    badge: '4 Peaks',
    description: 'Multi-phase titanium dioxide system showing characteristic Anatase (101)/(004) and Rutile (110)/(101) reflections.',
    peaks: [
      { name: 'Anatase (101)', color: '#06b6d4', enabled: true, center: 25.28, fwhm: 0.24, amplitude: 150, shape: 'Pseudo-Voigt', eta: 0.55, asymmetry: 1.0 },
      { name: 'Rutile (110)', color: '#f97316', enabled: true, center: 27.44, fwhm: 0.22, amplitude: 95, shape: 'Pseudo-Voigt', eta: 0.5, asymmetry: 1.0 },
      { name: 'Rutile (101)', color: '#ef4444', enabled: true, center: 36.08, fwhm: 0.25, amplitude: 60, shape: 'Pseudo-Voigt', eta: 0.5, asymmetry: 1.0 },
      { name: 'Anatase (004)', color: '#8b5cf6', enabled: true, center: 37.80, fwhm: 0.28, amplitude: 45, shape: 'Gaussian', eta: 0.3, asymmetry: 1.0 }
    ]
  },
  {
    name: '5-Peak High-Entropy Alloy Spectrum',
    badge: '5 Peaks',
    description: 'Complex multi-phase system displaying varying domain sizes, microstrains, and peak broadenings.',
    peaks: [
      { name: 'FCC (111)', color: '#6366f1', enabled: true, center: 43.50, fwhm: 0.28, amplitude: 160, shape: 'Pseudo-Voigt', eta: 0.5, asymmetry: 1.0 },
      { name: 'BCC (110)', color: '#10b981', enabled: true, center: 44.40, fwhm: 0.35, amplitude: 110, shape: 'Pseudo-Voigt', eta: 0.6, asymmetry: 1.0 },
      { name: 'FCC (200)', color: '#ec4899', enabled: true, center: 50.60, fwhm: 0.32, amplitude: 75, shape: 'Pseudo-Voigt', eta: 0.4, asymmetry: 1.0 },
      { name: 'BCC (200)', color: '#f59e0b', enabled: true, center: 64.70, fwhm: 0.42, amplitude: 50, shape: 'Lorentzian', eta: 0.8, asymmetry: 1.0 },
      { name: 'FCC (220)', color: '#06b6d4', enabled: true, center: 74.30, fwhm: 0.48, amplitude: 65, shape: 'Pseudo-Voigt', eta: 0.5, asymmetry: 1.0 }
    ]
  }
];

interface MultiPeakManagerProps {
  peaks: CustomPeak[];
  onPeaksChange: (peaks: CustomPeak[]) => void;
  peakMetrics: CustomPeakMetrics[];
  activeWavelength: number;
  scherrerK: number;
  onExportCsv: () => void;
}

export const MultiPeakManager: React.FC<MultiPeakManagerProps> = ({
  peaks,
  onPeaksChange,
  peakMetrics,
  activeWavelength,
  scherrerK,
  onExportCsv
}) => {
  const [copiedTable, setCopiedTable] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [sortKey, setSortKey] = useState<'center' | 'amplitude' | 'fwhm' | 'area'>('center');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedPeakId, setExpandedPeakId] = useState<string | null>(null);

  // Add a new peak with auto-incremented name, center, and color
  const handleAddPeak = () => {
    const nextIdx = peaks.length + 1;
    const colorObj = SCIENTIFIC_PEAK_COLORS[(nextIdx - 1) % SCIENTIFIC_PEAK_COLORS.length];
    
    const lastPeak = peaks[peaks.length - 1];
    const newCenter = lastPeak ? Math.min(150, lastPeak.center + 2.0) : 38.0;
    
    const newPeak: CustomPeak = {
      id: `peak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Peak #${nextIdx} (hkl)`,
      color: colorObj.hex,
      enabled: true,
      center: parseFloat(newCenter.toFixed(2)),
      fwhm: 0.28,
      amplitude: 100,
      shape: 'Pseudo-Voigt',
      eta: 0.5,
      asymmetry: 1.0
    };

    onPeaksChange([...peaks, newPeak]);
  };

  // Update specific peak property
  const handleUpdatePeak = (id: string, updates: Partial<CustomPeak>) => {
    onPeaksChange(peaks.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Duplicate a peak
  const handleDuplicatePeak = (id: string) => {
    const target = peaks.find(p => p.id === id);
    if (!target) return;
    
    const nextColor = SCIENTIFIC_PEAK_COLORS[peaks.length % SCIENTIFIC_PEAK_COLORS.length].hex;
    const newPeak: CustomPeak = {
      ...target,
      id: `peak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Copy)`,
      color: nextColor,
      center: parseFloat((target.center + 0.35).toFixed(2))
    };
    onPeaksChange([...peaks, newPeak]);
  };

  // Delete a peak
  const handleDeletePeak = (id: string) => {
    if (peaks.length <= 1) {
      alert('At least one peak must remain in the multi-peak configuration.');
      return;
    }
    onPeaksChange(peaks.filter(p => p.id !== id));
  };

  // Toggle all peaks
  const handleToggleAll = (enabled: boolean) => {
    onPeaksChange(peaks.map(p => ({ ...p, enabled })));
  };

  // Load a multi-peak preset
  const handleLoadPreset = (presetIndex: number) => {
    const preset = MULTI_PEAK_PRESETS[presetIndex];
    if (!preset) return;
    
    const newPeaks: CustomPeak[] = preset.peaks.map((p, idx) => ({
      ...p,
      id: `peak-preset-${Date.now()}-${idx}`
    }));
    onPeaksChange(newPeaks);
  };

  // Copy Markdown Table to Clipboard
  const handleCopyTable = () => {
    if (peakMetrics.length === 0) return;
    
    let md = `| Peak Name | 2θ (°) | FWHM β (°) | d-spacing (Å) | Intensity (cps) | Rel Int (%) | Area (cps·deg) | Area (%) | Crystallite D (nm) | Microstrain (%) | Shape |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|\n`;
    
    peakMetrics.forEach(m => {
      md += `| ${m.peak.name} | ${m.peak.center.toFixed(3)} | ${m.peak.fwhm.toFixed(4)} | ${m.dSpacing.toFixed(4)} | ${m.maxIntensity.toFixed(1)} | ${m.relIntensityPercent.toFixed(1)}% | ${m.area.toFixed(2)} | ${m.areaPercent.toFixed(1)}% | ${m.crystalliteSizeNm.toFixed(2)} | ${m.microstrainPercent.toFixed(3)}% | ${m.peak.shape} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2200);
  };

  const totalArea = peakMetrics.reduce((acc, m) => acc + (m.peak.enabled ? m.area : 0), 0);
  const activePeaksCount = peaks.filter(p => p.enabled).length;

  // Sorting
  const sortedMetrics = [...peakMetrics].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'center') diff = a.peak.center - b.peak.center;
    else if (sortKey === 'amplitude') diff = a.maxIntensity - b.maxIntensity;
    else if (sortKey === 'fwhm') diff = a.peak.fwhm - b.peak.fwhm;
    else if (sortKey === 'area') diff = a.area - b.area;
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="space-y-6" id="multi-peak-manager-container">
      {/* Top Banner & Action Controls */}
      <div 
        id="multi-peak-header-banner"
        className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-5 lg:p-6 rounded-2xl border-2 border-purple-500/40 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-300 border border-purple-400/30 shrink-0">
              <Palette className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base lg:text-lg font-extrabold text-white">
                  Multi-Peak Manual Deconvolution
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40 shadow-sm">
                  {activePeaksCount} / {peaks.length} Peaks Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Total Area: {totalArea.toFixed(1)} cps·°
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                Add, customize, and deconvolve multiple Bragg diffraction peaks with distinct scientific colors, profile equations, and individual FWHM curves.
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-new-peak"
              onClick={handleAddPeak}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Add a new peak component"
            >
              <Plus className="w-4 h-4" />
              Add Peak
            </button>

            <button
              id="btn-export-multi-peak-csv"
              onClick={onExportCsv}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Download parameters & crystallographic metrics as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>

            <button
              id="btn-copy-multi-peak-table"
              onClick={handleCopyTable}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Copy Summary Markdown Table to Clipboard"
            >
              {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-300" />}
              {copiedTable ? 'Copied Table!' : 'Copy Table'}
            </button>

            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => handleToggleAll(true)}
                className="px-2 py-1 hover:bg-white/15 rounded-lg text-emerald-300 font-bold transition-colors cursor-pointer text-[11px]"
                title="Enable all peaks"
              >
                All On
              </button>
              <span className="text-white/30">|</span>
              <button
                onClick={() => handleToggleAll(false)}
                className="px-2 py-1 hover:bg-white/15 rounded-lg text-slate-300 font-bold transition-colors cursor-pointer text-[11px]"
                title="Disable all peaks"
              >
                All Off
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Peak Quick Presets */}
        <div className="mt-4 pt-3.5 border-t border-purple-800/50 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Quick Presets:
          </span>
          {MULTI_PEAK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(idx)}
              className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/60 hover:border-purple-400 text-purple-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 shadow-sm"
              title={preset.description}
            >
              <span>{preset.name}</span>
              <span className="bg-purple-950 text-purple-300 text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold border border-purple-700/50">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Relative Area & Height Contribution Stacked Bar */}
      {peakMetrics.length > 0 && totalArea > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider text-[11px]">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              Diffraction Peak Area Share Distribution (%)
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {peaks.filter(p => p.enabled).length} active components
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
            {peakMetrics.map(m => {
              if (!m.peak.enabled || m.areaPercent <= 0) return null;
              return (
                <div
                  key={`bar-${m.peak.id}`}
                  style={{ width: `${m.areaPercent}%`, backgroundColor: m.peak.color }}
                  className="h-full transition-all relative group cursor-pointer hover:brightness-110"
                  title={`${m.peak.name}: ${m.areaPercent.toFixed(1)}% of total area (${m.area.toFixed(1)} cps·°)`}
                />
              );
            })}
          </div>

          {/* Legend Badges Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {peakMetrics.map(m => {
              if (!m.peak.enabled) return null;
              return (
                <div 
                  key={`leg-${m.peak.id}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.peak.color }} />
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{m.peak.name}:</span>
                  <span className="font-extrabold" style={{ color: m.peak.color }}>{m.areaPercent.toFixed(1)}%</span>
                  <span className="text-slate-400 text-[10px]">(β={m.peak.fwhm.toFixed(3)}°)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Peak Cards Header: View Toggle & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-500" />
            Individual Peak Parameters ({peaks.length} Total)
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-400'
              }`}
            >
              Detailed Cards
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compact' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-400'
              }`}
            >
              Compact Grid
            </button>
          </div>
        </div>
      </div>

      {/* Peak Cards Grid */}
      <div className={`grid gap-4 ${viewMode === 'cards' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {peaks.map((peak, idx) => {
          const metrics = peakMetrics.find(m => m.peak.id === peak.id);
          const isExpanded = expandedPeakId === peak.id;

          return (
            <div 
              key={peak.id}
              id={`peak-card-${peak.id}`}
              className={`p-4 lg:p-5 rounded-2xl border-2 transition-all shadow-sm relative flex flex-col justify-between ${
                peak.enabled 
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 hover:shadow-md' 
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/50 dark:border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Card Header: Color Swatch, Editable Name, Quick Actions */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Native & Preset Color Picker Trigger */}
                    <div className="relative group shrink-0">
                      <input 
                        type="color"
                        value={peak.color}
                        onChange={(e) => handleUpdatePeak(peak.id, { color: e.target.value })}
                        className="w-8 h-8 rounded-xl cursor-pointer opacity-0 absolute inset-0 z-10"
                        title="Click to select any custom color"
                      />
                      <div 
                        className="w-8 h-8 rounded-xl shadow-md border-2 border-white dark:border-slate-800 transition-transform group-hover:scale-110 flex items-center justify-center text-white"
                        style={{ backgroundColor: peak.color }}
                      >
                        <Palette className="w-4 h-4 drop-shadow" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <input 
                        type="text"
                        value={peak.name}
                        onChange={(e) => handleUpdatePeak(peak.id, { name: e.target.value })}
                        className="font-extrabold text-xs lg:text-sm text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 focus:outline-none px-1 py-0.5 truncate w-full"
                        placeholder="Peak Name / (hkl)..."
                      />
                      <span className="text-[10px] font-mono text-slate-400 block px-1">
                        #{idx + 1} | {peak.shape}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleUpdatePeak(peak.id, { enabled: !peak.enabled })}
                      className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        peak.enabled 
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                      title={peak.enabled ? 'Disable this peak' : 'Enable this peak'}
                    >
                      {peak.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDuplicatePeak(peak.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Duplicate this peak"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeletePeak(peak.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                      title="Delete this peak"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Color Palette Swatches Row */}
                <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Color:</span>
                  {SCIENTIFIC_PEAK_COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => handleUpdatePeak(peak.id, { color: c.hex })}
                      className={`w-4 h-4 rounded-full transition-all shrink-0 cursor-pointer ${
                        peak.color.toLowerCase() === c.hex.toLowerCase() 
                          ? 'scale-125 ring-2 ring-purple-500 shadow-sm' 
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Main Sliders & Direct Input Fields */}
                <div className="space-y-3.5 pt-3 text-xs">
                  {/* Centroid 2θ */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                        Centroid (2θ₀)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdatePeak(peak.id, { center: parseFloat(Math.max(5, peak.center - 0.1).toFixed(2)) })}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono text-[10px] cursor-pointer"
                          title="Decrease 0.1°"
                        >
                          -0.1°
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="5"
                          max="165"
                          value={peak.center}
                          onChange={(e) => handleUpdatePeak(peak.id, { center: parseFloat(e.target.value) || 0 })}
                          className="w-16 px-1.5 py-0.5 text-right font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                        />
                        <button
                          onClick={() => handleUpdatePeak(peak.id, { center: parseFloat(Math.min(165, peak.center + 0.1).toFixed(2)) })}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono text-[10px] cursor-pointer"
                          title="Increase 0.1°"
                        >
                          +0.1°
                        </button>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="150"
                      step="0.02"
                      value={peak.center}
                      onChange={(e) => handleUpdatePeak(peak.id, { center: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* FWHM Broadening */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                        FWHM (β)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdatePeak(peak.id, { fwhm: parseFloat(Math.max(0.02, peak.fwhm - 0.02).toFixed(3)) })}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono text-[10px] cursor-pointer"
                          title="Decrease 0.02°"
                        >
                          -0.02
                        </button>
                        <input
                          type="number"
                          step="0.005"
                          min="0.02"
                          max="4.0"
                          value={peak.fwhm}
                          onChange={(e) => handleUpdatePeak(peak.id, { fwhm: parseFloat(e.target.value) || 0.05 })}
                          className="w-16 px-1.5 py-0.5 text-right font-mono font-extrabold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                          style={{ color: peak.color }}
                        />
                        <button
                          onClick={() => handleUpdatePeak(peak.id, { fwhm: parseFloat(Math.min(4.0, peak.fwhm + 0.02).toFixed(3)) })}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono text-[10px] cursor-pointer"
                          title="Increase 0.02°"
                        >
                          +0.02
                        </button>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min="0.04"
                      max="2.5"
                      step="0.01"
                      value={peak.fwhm}
                      onChange={(e) => handleUpdatePeak(peak.id, { fwhm: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                      style={{ accentColor: peak.color }}
                    />
                  </div>

                  {/* Peak Intensity / Amplitude */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                        Peak Height (I₀)
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="5"
                          min="5"
                          max="1000"
                          value={peak.amplitude}
                          onChange={(e) => handleUpdatePeak(peak.id, { amplitude: parseFloat(e.target.value) || 10 })}
                          className="w-20 px-1.5 py-0.5 text-right font-mono font-extrabold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                        />
                        <span className="text-[10px] font-mono text-slate-400">cps</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min="5"
                      max="400"
                      step="5"
                      value={peak.amplitude}
                      onChange={(e) => handleUpdatePeak(peak.id, { amplitude: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Profile Shape & Mixing Eta Factor */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Model Shape</span>
                      <select
                        value={peak.shape}
                        onChange={(e) => handleUpdatePeak(peak.id, { shape: e.target.value as any })}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="Pseudo-Voigt">Pseudo-Voigt</option>
                        <option value="Gaussian">Gaussian</option>
                        <option value="Lorentzian">Lorentzian</option>
                        <option value="Pearson VII">Pearson VII</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">
                        {peak.shape === 'Pseudo-Voigt' ? `Mixing η (${(peak.eta * 100).toFixed(0)}%)` : 'Fraction'}
                      </span>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        disabled={peak.shape === 'Gaussian' || peak.shape === 'Lorentzian'}
                        value={peak.eta}
                        onChange={(e) => handleUpdatePeak(peak.id, { eta: parseFloat(e.target.value) })}
                        className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer mt-2 disabled:opacity-30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Physical Metrics Mini-Badge */}
              {metrics && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1.5 text-center font-mono">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">d-spacing</span>
                    <strong className="text-xs text-indigo-600 dark:text-indigo-400">{metrics.dSpacing.toFixed(3)} Å</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Domain (D)</span>
                    <strong className="text-xs text-emerald-600 dark:text-emerald-400">{metrics.crystalliteSizeNm.toFixed(1)} nm</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Area Share</span>
                    <strong className="text-xs text-amber-600 dark:text-amber-400">{metrics.areaPercent.toFixed(1)}%</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Multi-Peak Comprehensive Deconvolution Table */}
      <div 
        id="multi-peak-summary-table-container"
        className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Deconvoluted Line Profile Parameters & Crystallography Metrics
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Sort by:</span>
            <div className="flex items-center gap-1">
              {(['center', 'fwhm', 'amplitude', 'area'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (sortKey === k) setSortAsc(!sortAsc);
                    else { setSortKey(k); setSortAsc(true); }
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] cursor-pointer transition-colors ${
                    sortKey === k ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {k === 'center' ? '2θ' : k} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100/70 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Peak / Color</th>
                <th className="py-3 px-3">2θ₀ (deg)</th>
                <th className="py-3 px-3">FWHM β (deg)</th>
                <th className="py-3 px-3">d-spacing (Å)</th>
                <th className="py-3 px-3">Intensity (cps)</th>
                <th className="py-3 px-3">Rel. Int (%)</th>
                <th className="py-3 px-3">Area (cps·deg)</th>
                <th className="py-3 px-3">Area (%)</th>
                <th className="py-3 px-3">Size D (nm)</th>
                <th className="py-3 px-3">Microstrain (%)</th>
                <th className="py-3 px-4">Profile Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedMetrics.map(m => (
                <tr key={m.peak.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5 font-sans font-bold text-slate-800 dark:text-slate-100">
                    <span 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: m.peak.color }} 
                    />
                    <span className="truncate max-w-[140px]">{m.peak.name}</span>
                    {!m.peak.enabled && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full font-bold">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">{m.peak.center.toFixed(3)}°</td>
                  <td className="py-3 px-3 font-bold" style={{ color: m.peak.color }}>{m.peak.fwhm.toFixed(4)}°</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{m.dSpacing.toFixed(4)}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{m.maxIntensity.toFixed(1)}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{m.relIntensityPercent.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-bold">{m.area.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${m.areaPercent}%`, backgroundColor: m.peak.color }} 
                        />
                      </div>
                      <span>{m.areaPercent.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">{m.crystalliteSizeNm.toFixed(2)}</td>
                  <td className="py-3 px-3 text-purple-600 dark:text-purple-400">{m.microstrainPercent.toFixed(3)}%</td>
                  <td className="py-3 px-4 font-sans text-[11px] text-slate-500 dark:text-slate-400">
                    {m.peak.shape} {m.peak.shape === 'Pseudo-Voigt' ? `(η=${(m.peak.eta*100).toFixed(0)}%)` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
