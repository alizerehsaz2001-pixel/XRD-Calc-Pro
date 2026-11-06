import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Thermometer,
  Play,
  Pause,
  RotateCcw,
  Award,
  X,
  Box,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Flame
} from 'lucide-react';
import { HeatmapMode, ColorMode, QuickPreset, CrystalElement } from './types';
import { getPhysicalStateAtTemp } from './PeriodicTableGrid';

interface PeriodicFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  heatmapMode: HeatmapMode;
  onHeatmapModeChange: (mode: HeatmapMode) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  blockFilter: string;
  onBlockFilterChange: (block: string) => void;
  structureFilter?: string;
  onStructureFilterChange?: (struct: string) => void;
  temperature: number; // in Celsius
  onTemperatureChange: React.Dispatch<React.SetStateAction<number>> | ((temp: number | ((prev: number) => number)) => void);
  activePreset: QuickPreset | null;
  onSelectPreset: (preset: QuickPreset | null) => void;
  elements?: CrystalElement[];
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'xrd_calibrants',
    label: 'NIST XRD Standards',
    description: 'Primary crystallographic line-position & profile reference elements (Si, Au, La, Ce, Al, Cr, W).',
    elementNumbers: [14, 79, 57, 58, 13, 24, 74]
  },
  {
    id: 'xrd_anodes',
    label: 'X-Ray Tube Anodes',
    description: 'Characteristic Kα emission targets for laboratory X-ray diffractometers (Cu, Co, Mo, Cr, Fe, Ag).',
    elementNumbers: [29, 27, 42, 24, 26, 47]
  },
  {
    id: 'magnetic',
    label: 'Ferromagnetic (3d/4f)',
    description: 'Transition & rare-earth metals exhibiting spontaneous ferromagnetism or giant magnetic moments.',
    elementNumbers: [26, 27, 28, 64, 65, 66]
  },
  {
    id: 'semiconductors',
    label: 'Semiconductors',
    description: 'Elemental and compound semiconductor building blocks for microelectronics and optoelectronics.',
    elementNumbers: [14, 32, 31, 33, 49, 51, 30, 34, 48, 52]
  },
  {
    id: 'noble_metals',
    label: 'Platinum & Noble',
    description: 'Corrosion-resistant precious metals with FCC/HCP packing and high atomic scattering factors.',
    elementNumbers: [79, 47, 78, 46, 45, 77, 44, 76]
  },
  {
    id: 'refractory',
    label: 'BCC Refractory',
    description: 'Body-centered cubic metals possessing extreme melting points (> 2000 °C) and high stiffness.',
    elementNumbers: [74, 73, 42, 41, 75, 23]
  },
  {
    id: 'superconductors',
    label: 'Superconductors',
    description: 'Pure metals displaying zero electrical resistance and Meissner flux expulsion at cryogenic temperatures.',
    elementNumbers: [41, 82, 23, 50, 22, 39, 73]
  }
];

const CRYSTAL_SYSTEM_FILTERS = [
  { id: 'all', label: 'All Lattices', short: 'All' },
  { id: 'FCC', label: 'FCC (cF4)', short: 'FCC' },
  { id: 'BCC', label: 'BCC (cI2)', short: 'BCC' },
  { id: 'HCP', label: 'HCP (hP2)', short: 'HCP' },
  { id: 'Diamond', label: 'Diamond (cF8)', short: 'Diamond' },
  { id: 'Rhombohedral', label: 'Rhombohedral', short: 'Rhombo' },
  { id: 'Orthorhombic', label: 'Orthorhombic', short: 'Ortho' },
  { id: 'Tetragonal', label: 'Tetragonal', short: 'Tetra' },
  { id: 'Hexagonal', label: 'Hexagonal', short: 'Hex' },
  { id: 'Monoclinic', label: 'Monoclinic', short: 'Mono' }
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Chemical Series' },
  { id: 'alkali', label: 'Alkali Metals' },
  { id: 'alkaline_earth', label: 'Alkaline Earth Metals' },
  { id: 'transition_metal', label: 'Transition Metals' },
  { id: 'post_transition', label: 'Post-Transition Metals' },
  { id: 'metalloid', label: 'Metalloids' },
  { id: 'nonmetal', label: 'Reactive Nonmetals' },
  { id: 'noble_gas', label: 'Noble Gases' },
  { id: 'lanthanoid', label: 'Lanthanoids (4f)' },
  { id: 'actinoid', label: 'Actinoids (5f)' }
];

export const PeriodicFilterToolbar: React.FC<PeriodicFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  colorMode,
  onColorModeChange,
  heatmapMode,
  onHeatmapModeChange,
  categoryFilter,
  onCategoryFilterChange,
  blockFilter,
  onBlockFilterChange,
  structureFilter = 'all',
  onStructureFilterChange,
  temperature,
  onTemperatureChange,
  activePreset,
  onSelectPreset,
  elements = []
}) => {
  const [tempUnit, setTempUnit] = useState<'C' | 'K'>('C');
  const [isPlayingHeat, setIsPlayingHeat] = useState<boolean>(false);

  // Auto-heating animation loop
  useEffect(() => {
    if (!isPlayingHeat) return;
    const interval = setInterval(() => {
      onTemperatureChange(prev => {
        if (prev >= 4000) {
          setIsPlayingHeat(false);
          return 4000;
        }
        return prev + (prev < 500 ? 25 : prev < 1500 ? 50 : 100);
      });
    }, 120);
    return () => clearInterval(interval);
  }, [isPlayingHeat, onTemperatureChange]);

  const displayTemp = tempUnit === 'C' ? Math.round(temperature) : Math.round(temperature + 273.15);

  const handleTempSlider = (val: number) => {
    if (tempUnit === 'C') {
      onTemperatureChange(val);
    } else {
      onTemperatureChange(val - 273.15);
    }
  };

  const [showAdvanced, setShowAdvanced] = useState<boolean>(() => {
    return temperature !== 25 || activePreset !== null;
  });

  // Compute live phase counts at current temperature
  const phaseCounts = useMemo(() => {
    if (!elements || elements.length === 0) return { solid: 98, liquid: 2, gas: 11 };
    let solid = 0;
    let liquid = 0;
    let gas = 0;
    elements.forEach(el => {
      const st = getPhysicalStateAtTemp(el.meltingPoint, el.boilingPoint, temperature);
      if (st === 'solid') solid++;
      else if (st === 'liquid') liquid++;
      else gas++;
    });
    return { solid, liquid, gas };
  }, [elements, temperature]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'all' ||
    blockFilter !== 'all' ||
    structureFilter !== 'all' ||
    activePreset !== null ||
    heatmapMode !== 'none' ||
    Math.round(temperature) !== 25;

  const handleResetAll = () => {
    onSearchChange('');
    onCategoryFilterChange('all');
    onBlockFilterChange('all');
    if (onStructureFilterChange) onStructureFilterChange('all');
    onSelectPreset(null);
    onHeatmapModeChange('none');
    onColorModeChange('category');
    onTemperatureChange(25);
    setIsPlayingHeat(false);
  };

  const activeAdvancedCount =
    (activePreset !== null ? 1 : 0) +
    (Math.round(temperature) !== 25 ? 1 : 0) +
    (blockFilter !== 'all' ? 1 : 0);

  return (
    <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 shadow-lg transition-all">
      {/* Row 1: Search + Color Mode Segmented Control + Heatmap + Phase/Cohort Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search symbol (Fe), name, Z (26), space group (Fm-3m), or BCC..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl pl-8.5 pr-7 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Color Coding Mode Segmented Control */}
          <div className="flex items-center bg-[#070b14] p-0.5 rounded-xl border border-slate-800 text-[10.5px] font-mono font-bold">
            {(
              [
                { id: 'category', label: 'Series' },
                { id: 'structure', label: 'Bravais' },
                { id: 'block', label: 'Subshell' },
                { id: 'state', label: 'Phase' }
              ] as const
            ).map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onColorModeChange(mode.id);
                  onHeatmapModeChange('none');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  colorMode === mode.id && heatmapMode === 'none'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Chemical Series Filter Select */}
          <div className="flex items-center gap-1 bg-[#070b14] border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1 transition-colors">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Filter by chemical series"
            >
              {CATEGORY_FILTERS.map(cf => (
                <option key={cf.id} value={cf.id} className="bg-[#080d1a] text-slate-200">
                  {cf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Property Heatmap Dropdown */}
          <select
            value={heatmapMode}
            onChange={(e) => {
              const val = e.target.value as HeatmapMode;
              onHeatmapModeChange(val);
              if (val !== 'none') onColorModeChange('heatmap');
            }}
            aria-label="Property heatmap mode"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#070b14] border transition-all focus:outline-none cursor-pointer ${
              heatmapMode !== 'none'
                ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 shadow-sm'
                : 'border-slate-800 text-cyan-400 hover:border-cyan-500/50'
            }`}
          >
            <option value="none" className="bg-[#080d1a] text-slate-300">Heatmap: Off</option>
            <option value="latticeA" className="bg-[#080d1a] text-white">Heatmap: Lattice a₀ (Å)</option>
            <option value="unitCellVolume" className="bg-[#080d1a] text-white">Heatmap: Cell Volume V (Å³)</option>
            <option value="density" className="bg-[#080d1a] text-white">Heatmap: X-Ray Density (g/cm³)</option>
            <option value="scatteringPower" className="bg-[#080d1a] text-white">Heatmap: Form Factor f₀ (Z e⁻)</option>
            <option value="massAttenuation" className="bg-[#080d1a] text-white">Heatmap: Cu-Kα μ/ρ (cm²/g)</option>
            <option value="atomicRadius" className="bg-[#080d1a] text-white">Heatmap: Atomic Radius (pm)</option>
            <option value="electronegativity" className="bg-[#080d1a] text-white">Heatmap: Electronegativity (χ)</option>
            <option value="ionizationEnergy" className="bg-[#080d1a] text-white">Heatmap: 1st Ionization (eV)</option>
            <option value="electronAffinity" className="bg-[#080d1a] text-white">Heatmap: Electron Affinity (eV)</option>
            <option value="meltingPoint" className="bg-[#080d1a] text-white">Heatmap: Melting Point (°C)</option>
            <option value="boilingPoint" className="bg-[#080d1a] text-white">Heatmap: Boiling Point (°C)</option>
            <option value="thermalConductivity" className="bg-[#080d1a] text-white">Heatmap: Thermal Cond. (W/m·K)</option>
            <option value="electricalConductivity" className="bg-[#080d1a] text-white">Heatmap: Electrical Cond. (MS/m)</option>
          </select>

          {/* Toggle Advanced Simulator & Presets Drawer */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              showAdvanced || activeAdvancedCount > 0
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                : 'bg-[#070b14] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Toggle thermal phase simulator, temperature scrubber, and NIST/XRD cohorts"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Thermal &amp; Cohorts</span>
            {activeAdvancedCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-cyan-300">
                ({activeAdvancedCount})
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Reset All Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Reset all filters, temperature, and search to STP defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: One-Click Bravais Crystal Structure & Orbital Block Quick Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-slate-500 font-bold uppercase flex items-center gap-1 mr-1">
            <Box className="w-3 h-3 text-cyan-400" />
            Lattice Filter:
          </span>
          {CRYSTAL_SYSTEM_FILTERS.map(cs => {
            const isActive = structureFilter === cs.id;
            const count =
              cs.id === 'all'
                ? elements.length || 118
                : elements.filter(e => e.crystalStructure === cs.id).length;
            return (
              <button
                key={cs.id}
                type="button"
                onClick={() =>
                  onStructureFilterChange &&
                  onStructureFilterChange(isActive && cs.id !== 'all' ? 'all' : cs.id)
                }
                className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  isActive
                    ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-sm'
                    : 'bg-[#070b14] border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{cs.short}</span>
                {elements.length > 0 && cs.id !== 'all' && (
                  <span className={`text-[8.5px] tabular-nums ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orbital Subshell Block Segmented Filter */}
        <div className="flex items-center gap-1 bg-[#070b14] p-0.5 rounded-lg border border-slate-800">
          <span className="text-[9px] font-mono uppercase font-bold text-slate-500 px-1.5">Block:</span>
          {(['all', 's', 'p', 'd', 'f'] as const).map(blk => (
            <button
              key={blk}
              type="button"
              onClick={() => onBlockFilterChange(blockFilter === blk && blk !== 'all' ? 'all' : blk)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                blockFilter === blk
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {blk === 'all' ? 'All' : `${blk}-blk`}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Drawer: Thermal Phase State Simulator & Reference Material Cohorts */}
      {showAdvanced && (
        <div className="space-y-3 pt-2.5 border-t border-slate-800/80 animate-in fade-in duration-150">
          {/* Temperature Phase Simulator Bar */}
          <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Thermal Phase Simulator
                  </span>
                  <div className="flex bg-slate-950 rounded border border-slate-800 text-[9px]">
                    <button
                      type="button"
                      onClick={() => setTempUnit('C')}
                      className={`px-1.5 py-0.5 font-bold cursor-pointer ${tempUnit === 'C' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempUnit('K')}
                      className={`px-1.5 py-0.5 font-bold cursor-pointer ${tempUnit === 'K' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      K
                    </button>
                  </div>
                </div>
                <div className="text-sm font-black text-white tabular-nums mt-0.5 flex items-baseline gap-2">
                  <span>
                    {displayTemp} {tempUnit === 'C' ? '°C' : 'K'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {temperature <= -270
                      ? 'Absolute Zero'
                      : temperature < 0
                      ? 'Cryogenic Regime'
                      : temperature <= 35
                      ? 'Standard Ambient (STP)'
                      : temperature <= 1500
                      ? 'High-Temp Furnace'
                      : 'Refractory Melt Regime'}
                  </span>
                </div>
              </div>
            </div>

            {/* Slider & Thermal Benchmark Buttons */}
            <div className="flex-1 max-w-xl flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={tempUnit === 'C' ? -273 : 0}
                  max={tempUnit === 'C' ? 4000 : 4273}
                  step={5}
                  value={displayTemp}
                  onChange={(e) => handleTempSlider(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    onColorModeChange('state');
                    setIsPlayingHeat(!isPlayingHeat);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isPlayingHeat
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                  title={isPlayingHeat ? 'Pause thermal ramp' : 'Sweep temperature from current value to 4000 °C'}
                >
                  {isPlayingHeat ? <Pause className="w-3 h-3" /> : <Flame className="w-3 h-3 text-amber-400" />}
                  <span>{isPlayingHeat ? 'Pause' : 'Sweep T'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 font-bold tabular-nums">
                {[
                  { label: '0 K (-273°C)', tempC: -273.15 },
                  { label: 'LN₂ (-196°C)', tempC: -196 },
                  { label: 'STP (25°C)', tempC: 25 },
                  { label: 'Al Melt (660°C)', tempC: 660 },
                  { label: 'Cu Melt (1085°C)', tempC: 1085 },
                  { label: 'Fe Melt (1538°C)', tempC: 1538 },
                  { label: 'W Melt (3422°C)', tempC: 3422 }
                ].map(bm => (
                  <button
                    key={bm.label}
                    type="button"
                    onClick={() => {
                      onTemperatureChange(bm.tempC);
                      if (bm.tempC !== 25) onColorModeChange('state');
                    }}
                    className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      Math.abs(temperature - bm.tempC) < 3
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 hover:text-white border-slate-800'
                    }`}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Phase State Distribution Readout */}
            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums shrink-0 bg-[#0B0F19] px-3 py-2 rounded-lg border border-slate-800/80">
              <div className="text-emerald-400">
                <span className="text-[9px] text-slate-500 uppercase block">Solid</span>
                <strong>{phaseCounts.solid}</strong>
              </div>
              <span className="text-slate-700">·</span>
              <div className="text-sky-400">
                <span className="text-[9px] text-slate-500 uppercase block">Liquid</span>
                <strong>{phaseCounts.liquid}</strong>
              </div>
              <span className="text-slate-700">·</span>
              <div className="text-rose-400">
                <span className="text-[9px] text-slate-500 uppercase block">Gas</span>
                <strong>{phaseCounts.gas}</strong>
              </div>
            </div>
          </div>

          {/* Crystallographic & Spectroscopic Reference Cohorts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Reference Cohorts:
            </span>
            {QUICK_PRESETS.map(preset => {
              const isActive = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(isActive ? null : preset)}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-[#070b14] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                  title={preset.description}
                >
                  <span>{preset.label}</span>
                  <span className="text-[9px] opacity-75 tabular-nums">({preset.elementNumbers.length})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
