import React, { useState, useEffect } from 'react';
import {
  Search,
  Thermometer,
  Play,
  Pause,
  RotateCcw,
  Award,
  Filter,
  X,
  Box,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HeatmapMode, ColorMode, QuickPreset } from './types';

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
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'xrd_calibrants',
    label: 'XRD Reference Standards',
    description: 'NIST-grade primary crystallographic reference elements (Si, Au, La, Ce, Al, Cr, W).',
    elementNumbers: [14, 79, 57, 58, 13, 24, 74]
  },
  {
    id: 'xrd_anodes',
    label: 'XRD Tube Targets (Anodes)',
    description: 'Characteristic Kα emission targets for laboratory X-ray diffractometers (Cu, Co, Mo, Cr, Fe, Ag).',
    elementNumbers: [29, 27, 42, 24, 26, 47]
  },
  {
    id: 'magnetic',
    label: 'Ferromagnetic (3d / 4f)',
    description: 'Transition & rare-earth metals exhibiting spontaneous ferromagnetism or giant magnetic moments.',
    elementNumbers: [26, 27, 28, 64, 65, 66]
  },
  {
    id: 'semiconductors',
    label: 'Semiconductors (IV / III-V / II-VI)',
    description: 'Elemental and compound semiconductor building blocks for microelectronics and optoelectronics.',
    elementNumbers: [14, 32, 31, 33, 49, 51, 30, 34, 48, 52]
  },
  {
    id: 'noble_metals',
    label: 'Platinum Group & Noble Metals',
    description: 'Corrosion-resistant precious metals with FCC/HCP packing and high scattering factors.',
    elementNumbers: [79, 47, 78, 46, 45, 77, 44, 76]
  },
  {
    id: 'refractory',
    label: 'BCC Refractory Metals',
    description: 'Body-centered cubic metals possessing extreme melting points (> 2000 °C) and high stiffness.',
    elementNumbers: [74, 73, 42, 41, 75, 23]
  },
  {
    id: 'superconductors',
    label: 'Elemental Superconductors',
    description: 'Pure metals displaying zero electrical resistance and Meissner flux expulsion at cryogenic temperatures.',
    elementNumbers: [41, 82, 23, 50, 22, 39, 73]
  }
];

const CRYSTAL_SYSTEM_FILTERS = [
  { id: 'all', label: 'All Lattices' },
  { id: 'FCC', label: 'FCC (cF4)' },
  { id: 'BCC', label: 'BCC (cI2)' },
  { id: 'HCP', label: 'HCP (hP2)' },
  { id: 'Diamond', label: 'Diamond (cF8)' },
  { id: 'Rhombohedral', label: 'Rhombohedral' },
  { id: 'Orthorhombic', label: 'Orthorhombic' },
  { id: 'Tetragonal', label: 'Tetragonal' },
  { id: 'Hexagonal', label: 'Hexagonal' },
  { id: 'Monoclinic', label: 'Monoclinic' }
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Families' },
  { id: 'alkali', label: 'Alkali Metals' },
  { id: 'alkaline_earth', label: 'Alkaline Earth' },
  { id: 'transition_metal', label: 'Transition Metals' },
  { id: 'post_transition', label: 'Post-Transition' },
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
  onSelectPreset
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

  const activeAdvancedCount = (activePreset !== null ? 1 : 0) + (Math.round(temperature) !== 25 ? 1 : 0) + (blockFilter !== 'all' ? 1 : 0);

  return (
    <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-3.5 space-y-3 shadow-xl transition-all">
      {/* Primary Control Row: Search + Key Scientific Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symbol, name, Z, space group..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#070b14] border border-slate-700/70 rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Views */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chemical Family Dropdown */}
          <div className="flex items-center gap-1 bg-[#070b14] border border-slate-800 rounded-xl px-2 py-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Family:</span>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer py-1 pr-1"
            >
              {CATEGORY_FILTERS.map(cf => (
                <option key={cf.id} value={cf.id} className="bg-[#080d1a] text-slate-200">
                  {cf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Crystal System Dropdown */}
          <div className="flex items-center gap-1 bg-[#070b14] border border-slate-800 rounded-xl px-2 py-0.5">
            <Box className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Lattice:</span>
            <select
              value={structureFilter}
              onChange={(e) => onStructureFilterChange && onStructureFilterChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer py-1 pr-1"
            >
              {CRYSTAL_SYSTEM_FILTERS.map(cs => (
                <option key={cs.id} value={cs.id} className="bg-[#080d1a] text-slate-200">
                  {cs.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color Mode Segmented Control */}
          <div className="hidden sm:flex items-center bg-[#070b14] p-0.5 rounded-xl border border-slate-800 text-[10px] font-mono font-bold">
            {(
              [
                { id: 'category', label: 'Family' },
                { id: 'structure', label: 'Lattice' },
                { id: 'block', label: 'Block' },
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
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  colorMode === mode.id && heatmapMode === 'none'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Property Heatmap Dropdown */}
          <select
            value={heatmapMode}
            onChange={(e) => {
              const val = e.target.value as HeatmapMode;
              onHeatmapModeChange(val);
              if (val !== 'none') onColorModeChange('heatmap');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#070b14] border transition-all focus:outline-none cursor-pointer ${
              heatmapMode !== 'none'
                ? 'bg-cyan-950 text-cyan-200 border-cyan-500 font-black shadow-sm'
                : 'border-slate-800 text-cyan-400 hover:border-cyan-500/50'
            }`}
          >
            <option value="none" className="bg-[#080d1a] text-slate-300">Heatmap Mode (Off)</option>
            <option value="latticeA" className="bg-[#080d1a] text-white">Lattice Constant a₀ (Å)</option>
            <option value="unitCellVolume" className="bg-[#080d1a] text-white">Unit Cell Volume V_cell (Å³)</option>
            <option value="density" className="bg-[#080d1a] text-white">X-Ray Density (g/cm³)</option>
            <option value="scatteringPower" className="bg-[#080d1a] text-white">Scattering Factor f₀ (Z e⁻)</option>
            <option value="massAttenuation" className="bg-[#080d1a] text-white">Cu-Kα Attenuation μ/ρ (cm²/g)</option>
            <option value="atomicRadius" className="bg-[#080d1a] text-white">Atomic Radius (pm)</option>
            <option value="electronegativity" className="bg-[#080d1a] text-white">Electronegativity (χ)</option>
            <option value="ionizationEnergy" className="bg-[#080d1a] text-white">1st Ionization (eV)</option>
            <option value="electronAffinity" className="bg-[#080d1a] text-white">Electron Affinity (eV)</option>
            <option value="meltingPoint" className="bg-[#080d1a] text-white">Melting Point (°C)</option>
            <option value="boilingPoint" className="bg-[#080d1a] text-white">Boiling Point (°C)</option>
            <option value="thermalConductivity" className="bg-[#080d1a] text-white">Thermal Cond. (W/m·K)</option>
            <option value="electricalConductivity" className="bg-[#080d1a] text-white">Electrical Cond. (MS/m)</option>
          </select>

          {/* Toggle Advanced Simulator & Presets Drawer */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showAdvanced || activeAdvancedCount > 0
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Toggle thermal phase simulator, temperature controls, and material cohorts"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Phase Sim & Cohorts</span>
            {activeAdvancedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[9px] font-mono font-bold">
                {activeAdvancedCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Reset All Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Reset all filters, temperature and search to standard STP defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Advanced Drawer: Phase Simulation & Crystallographic Cohorts */}
      {showAdvanced && (
        <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Temperature Phase Simulator Bar */}
          <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Phase State Simulator:
                  </span>
                  <div className="flex bg-black/60 rounded border border-slate-700 text-[9px]">
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
                <div className="text-sm font-black text-white tabular-nums mt-0.5">
                  {displayTemp} {tempUnit === 'C' ? '°C' : 'K'}
                  <span className="text-[10px] text-slate-400 ml-2 font-normal">
                    ({temperature <= -270 ? 'Absolute Zero' : temperature < 0 ? 'Cryogenic' : temperature <= 35 ? 'STP (25°C)' : temperature <= 1500 ? 'Furnace' : 'Plasma Melt'})
                  </span>
                </div>
              </div>
            </div>

            {/* Slider & Thermal Quick Buttons */}
            <div className="flex-1 max-w-xl flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={tempUnit === 'C' ? -273 : 0}
                  max={tempUnit === 'C' ? 4000 : 4273}
                  step={5}
                  value={displayTemp}
                  onChange={(e) => handleTempSlider(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setIsPlayingHeat(!isPlayingHeat)}
                  className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                    isPlayingHeat
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                  title={isPlayingHeat ? 'Pause thermal ramp' : 'Play thermal ramp simulation'}
                >
                  {isPlayingHeat ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 font-bold tabular-nums">
                <button type="button" onClick={() => onTemperatureChange(-273.15)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  0 K (-273°C)
                </button>
                <button type="button" onClick={() => onTemperatureChange(-196)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  LN₂ (-196°C)
                </button>
                <button type="button" onClick={() => onTemperatureChange(25)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  STP (25°C)
                </button>
                <button type="button" onClick={() => onTemperatureChange(660)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  Al (660°C)
                </button>
                <button type="button" onClick={() => onTemperatureChange(1085)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  Cu (1085°C)
                </button>
                <button type="button" onClick={() => onTemperatureChange(1538)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  Fe (1538°C)
                </button>
                <button type="button" onClick={() => onTemperatureChange(3422)} className="hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                  W (3422°C)
                </button>
              </div>
            </div>

            {/* Phase State Legend */}
            <div className="flex items-center gap-3 text-[10px] font-bold shrink-0">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-slate-300" />
                <span className="text-slate-300">Solid</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-blue-500" />
                <span className="text-blue-300">Liquid</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-500" />
                <span className="text-rose-300">Gas</span>
              </div>
            </div>
          </div>

          {/* Cohorts & Block Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Quick Cohorts */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Cohorts:
              </span>
              {QUICK_PRESETS.map(preset => {
                const isActive = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(isActive ? null : preset)}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                    title={preset.description}
                  >
                    <span>{preset.label}</span>
                    <span className="text-[8.5px] opacity-70">({preset.elementNumbers.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Orbital Block Filter */}
            <div className="flex items-center gap-1 bg-[#070b14] p-0.5 rounded-lg border border-slate-800">
              <span className="text-[9px] font-mono uppercase font-bold text-slate-500 px-1.5">Block:</span>
              {(['all', 's', 'p', 'd', 'f'] as const).map(blk => (
                <button
                  key={blk}
                  type="button"
                  onClick={() => onBlockFilterChange(blockFilter === blk && blk !== 'all' ? 'all' : blk)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    blockFilter === blk
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {blk === 'all' ? 'All' : `${blk}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
