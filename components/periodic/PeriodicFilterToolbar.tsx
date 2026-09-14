import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Thermometer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Magnet,
  Cpu,
  Zap,
  Flame,
  Award,
  Filter,
  X
} from 'lucide-react';
import { HeatmapMode, ColorMode, ElementCategory, QuickPreset } from './types';

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
  temperature: number; // in Celsius
  onTemperatureChange: React.Dispatch<React.SetStateAction<number>> | ((temp: number | ((prev: number) => number)) => void);
  activePreset: QuickPreset | null;
  onSelectPreset: (preset: QuickPreset | null) => void;
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'magnetic',
    label: 'Ferromagnetic & Magnetic',
    description: 'Transition & rare-earth metals exhibiting spontaneous ferromagnetism or giant magnetic moments.',
    elementNumbers: [26, 27, 28, 64, 65, 66] // Fe, Co, Ni, Gd, Tb, Dy
  },
  {
    id: 'semiconductors',
    label: 'Semiconductors (IV / III-V / II-VI)',
    description: 'Elemental and compound semiconductor building blocks for microelectronics and optoelectronics.',
    elementNumbers: [14, 32, 31, 33, 49, 51, 30, 34, 48, 52] // Si, Ge, Ga, As, In, Sb, Zn, Se, Cd, Te
  },
  {
    id: 'xrd_anodes',
    label: 'XRD Tube Targets (Anodes)',
    description: 'Universal characteristic emission targets for laboratory X-ray diffractometers.',
    elementNumbers: [29, 27, 42, 24, 26, 47] // Cu, Co, Mo, Cr, Fe, Ag
  },
  {
    id: 'noble_metals',
    label: 'Noble & Precious Metals',
    description: 'Corrosion-resistant precious metals with high work functions and chemical nobility.',
    elementNumbers: [79, 47, 78, 46, 45, 77, 44, 76] // Au, Ag, Pt, Pd, Rh, Ir, Ru, Os
  },
  {
    id: 'refractory',
    label: 'Refractory Superalloys',
    description: 'Metals possessing exceptional melting points (> 2000 °C) and high creep resistance.',
    elementNumbers: [74, 73, 42, 41, 75] // W, Ta, Mo, Nb, Re
  },
  {
    id: 'superconductors',
    label: 'Elemental Superconductors',
    description: 'Pure metals displaying zero electrical resistance and Meissner effect at cryogenic temperatures.',
    elementNumbers: [41, 82, 23, 50, 22, 39] // Nb, Pb, V, Sn, Ti, Y
  }
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

  const displayTemp = tempUnit === 'C' ? temperature : Math.round(temperature + 273.15);

  const handleTempSlider = (val: number) => {
    if (tempUnit === 'C') {
      onTemperatureChange(val);
    } else {
      onTemperatureChange(val - 273.15);
    }
  };

  return (
    <div className="space-y-3.5 bg-black/40 border border-slate-800 p-4 rounded-3xl">
      {/* Top Controls: Search, View Mode, Heatmap Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search element by name, symbol, or Z (e.g. Fe, Iron, 26)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#080d1a] border border-slate-700/80 rounded-2xl pl-9 pr-8 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Color / View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#080d1a] p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              onColorModeChange('category');
              onHeatmapModeChange('none');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
              colorMode === 'category' && heatmapMode === 'none'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Family / Category
          </button>

          <button
            onClick={() => {
              onColorModeChange('block');
              onHeatmapModeChange('none');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
              colorMode === 'block' && heatmapMode === 'none'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orbital Block (s,p,d,f)
          </button>

          <button
            onClick={() => {
              onColorModeChange('structure');
              onHeatmapModeChange('none');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
              colorMode === 'structure' && heatmapMode === 'none'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crystal Structure
          </button>

          <button
            onClick={() => {
              onColorModeChange('state');
              onHeatmapModeChange('none');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${
              colorMode === 'state' && heatmapMode === 'none'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            State of Matter
          </button>

          {/* Heatmap Mode Dropdown */}
          <div className="relative">
            <select
              value={heatmapMode}
              onChange={(e) => {
                const val = e.target.value as HeatmapMode;
                onHeatmapModeChange(val);
                if (val !== 'none') onColorModeChange('heatmap');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase bg-transparent border transition-all focus:outline-none ${
                heatmapMode !== 'none'
                  ? 'bg-cyan-600 text-white border-cyan-400 font-black'
                  : 'border-slate-700/80 text-cyan-400 hover:border-cyan-500/60'
              }`}
            >
              <option value="none" className="bg-[#080d1a] text-slate-300">⚡ Property Heatmap...</option>
              <option value="electronegativity" className="bg-[#080d1a] text-white">Pauling Electronegativity (χ)</option>
              <option value="atomicRadius" className="bg-[#080d1a] text-white">Atomic Radius (pm)</option>
              <option value="ionizationEnergy" className="bg-[#080d1a] text-white">1st Ionization Energy (eV)</option>
              <option value="electronAffinity" className="bg-[#080d1a] text-white">Electron Affinity (eV)</option>
              <option value="density" className="bg-[#080d1a] text-white">Density (g/cm³)</option>
              <option value="meltingPoint" className="bg-[#080d1a] text-white">Melting Point (°C)</option>
              <option value="boilingPoint" className="bg-[#080d1a] text-white">Boiling Point (°C)</option>
              <option value="scatteringPower" className="bg-[#080d1a] text-white">Thomson Scattering (Z e⁻)</option>
              <option value="massAttenuation" className="bg-[#080d1a] text-white">Cu-Kα Mass Attenuation (cm²/g)</option>
              <option value="thermalConductivity" className="bg-[#080d1a] text-white">Thermal Conductivity (W/m·K)</option>
              <option value="electricalConductivity" className="bg-[#080d1a] text-white">Electrical Conductivity (MS/m)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Temperature Control Bar (Dynamic State of Matter) */}
      <div className="p-3 bg-[#080d1a] rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400">
                Phase Transition Temperature:
              </span>
              <div className="flex bg-black/60 rounded border border-slate-700 text-[9px]">
                <button
                  onClick={() => setTempUnit('C')}
                  className={`px-1.5 py-0.5 font-bold ${tempUnit === 'C' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  °C
                </button>
                <button
                  onClick={() => setTempUnit('K')}
                  className={`px-1.5 py-0.5 font-bold ${tempUnit === 'K' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  K
                </button>
              </div>
            </div>
            <div className="text-base font-black text-white">
              {displayTemp} {tempUnit === 'C' ? '°C' : 'K'}
              <span className="text-[10px] text-slate-500 ml-2 font-normal">
                ({temperature <= -273 ? 'Absolute Zero' : temperature < 0 ? 'Cryogenic' : temperature <= 35 ? 'Room Temp' : temperature <= 1500 ? 'Furnace' : 'Plasma'})
              </span>
            </div>
          </div>
        </div>

        {/* Range Slider & Quick Presets */}
        <div className="flex-1 max-w-xl flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={tempUnit === 'C' ? -273 : 0}
              max={tempUnit === 'C' ? 4000 : 4273}
              step={10}
              value={displayTemp}
              onChange={(e) => handleTempSlider(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setIsPlayingHeat(!isPlayingHeat)}
              className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                isPlayingHeat
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                  : 'bg-white/5 text-slate-300 border-slate-700 hover:bg-white/10'
              }`}
              title={isPlayingHeat ? 'Pause thermal ramp' : 'Play thermal ramp simulation'}
            >
              {isPlayingHeat ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-400 font-bold">
            <button onClick={() => onTemperatureChange(-273.15)} className="hover:text-white px-1.5 py-0.5 bg-black/40 rounded border border-slate-800">
              0 K (-273°C)
            </button>
            <button onClick={() => onTemperatureChange(-196)} className="hover:text-white px-1.5 py-0.5 bg-black/40 rounded border border-slate-800">
              Liq N₂ (-196°C)
            </button>
            <button onClick={() => onTemperatureChange(25)} className="hover:text-white px-1.5 py-0.5 bg-black/40 rounded border border-slate-800">
              RT (25°C)
            </button>
            <button onClick={() => onTemperatureChange(100)} className="hover:text-white px-1.5 py-0.5 bg-black/40 rounded border border-slate-800">
              Boil (100°C)
            </button>
            <button onClick={() => onTemperatureChange(1538)} className="hover:text-white px-1.5 py-0.5 bg-black/40 rounded border border-slate-800">
              Fe Melt (1538°C)
            </button>
            <button onClick={() => onTemperatureChange(3422)} className="hover:text-white px-1.5 py-0.5 bg-black/40 rounded border border-slate-800">
              W Melt (3422°C)
            </button>
          </div>
        </div>

        {/* State Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-300">Solid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            <span className="text-blue-300">Liquid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
            <span className="text-rose-300">Gas</span>
          </div>
        </div>
      </div>

      {/* Quick Crystallography & Materials Presets */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-[10px] font-mono uppercase font-black text-slate-500 flex items-center gap-1 mr-1">
          <Award className="w-3.5 h-3.5 text-indigo-400" />
          Material Presets:
        </span>
        {QUICK_PRESETS.map(preset => {
          const isActive = activePreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(isActive ? null : preset)}
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                  : 'bg-black/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={preset.description}
            >
              <span>{preset.label}</span>
            </button>
          );
        })}
        {activePreset && (
          <button
            onClick={() => onSelectPreset(null)}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-0.5 ml-auto"
          >
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );
};
