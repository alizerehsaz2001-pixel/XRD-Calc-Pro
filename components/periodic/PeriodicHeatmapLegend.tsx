import React from 'react';
import { Sparkles, Info, X } from 'lucide-react';
import { HeatmapMode, CrystalElement } from './types';

interface PeriodicHeatmapLegendProps {
  mode: HeatmapMode;
  onSelectMode: (mode: HeatmapMode) => void;
  elements: CrystalElement[];
}

export interface HeatmapConfig {
  label: string;
  unit: string;
  description: string;
  getValue: (el: CrystalElement) => number;
  format: (val: number) => string;
}

export const HEATMAP_CONFIGS: Record<HeatmapMode, HeatmapConfig | null> = {
  none: null,
  electronegativity: {
    label: 'Pauling Electronegativity',
    unit: 'χ',
    description: 'Relative chemical tendency of an atom to attract shared electron pairs.',
    getValue: el => el.electronegativity || 0,
    format: v => v > 0 ? v.toFixed(2) : 'N/A'
  },
  atomicRadius: {
    label: 'Atomic Radius',
    unit: 'pm',
    description: 'Calculated empirical covalent/atomic radius of neutral ground-state atoms.',
    getValue: el => el.atomicRadius || 0,
    format: v => `${v.toFixed(0)} pm`
  },
  ionizationEnergy: {
    label: '1st Ionization Energy',
    unit: 'eV',
    description: 'Minimal energy required to remove the outermost valence electron from an isolated atom.',
    getValue: el => el.ionizationEnergy || 0,
    format: v => `${v.toFixed(2)} eV`
  },
  electronAffinity: {
    label: 'Electron Affinity',
    unit: 'eV',
    description: 'Energy change when an electron is attached to a neutral gaseous atom.',
    getValue: el => el.electronAffinity || 0,
    format: v => `${v.toFixed(2)} eV`
  },
  density: {
    label: 'Mass Density (at 20°C)',
    unit: 'g/cm³',
    description: 'Solid, liquid, or standard state mass density of the element.',
    getValue: el => el.density || 0,
    format: v => `${v.toFixed(2)} g/cm³`
  },
  meltingPoint: {
    label: 'Melting Point',
    unit: '°C',
    description: 'Standard atmospheric transition temperature from crystalline solid to liquid phase.',
    getValue: el => el.meltingPoint,
    format: v => `${v.toFixed(0)} °C`
  },
  boilingPoint: {
    label: 'Boiling Point',
    unit: '°C',
    description: 'Standard boiling temperature into gaseous state at 1 atm.',
    getValue: el => el.boilingPoint ?? 0,
    format: v => `${v.toFixed(0)} °C`
  },
  scatteringPower: {
    label: 'Thomson Scattering Cross-Section',
    unit: 'f₀(0) = Z e⁻',
    description: 'Forward coherent elastic X-ray scattering amplitude proportional to atomic number Z.',
    getValue: el => el.number,
    format: v => `${v.toFixed(0)} e⁻`
  },
  massAttenuation: {
    label: 'Cu-Kα Mass Attenuation Coefficient (μ/ρ)',
    unit: 'cm²/g',
    description: 'Total photoelectric absorption and scattering cross-section per unit mass for 8.048 keV X-rays.',
    getValue: el => el.muOverRhoCu || (0.016 * Math.pow(el.number, 3.5)),
    format: v => `${v.toFixed(1)} cm²/g`
  },
  thermalConductivity: {
    label: 'Thermal Conductivity',
    unit: 'W/(m·K)',
    description: 'Rate of heat transport per unit temperature gradient.',
    getValue: el => el.thermalConductivity || 0,
    format: v => `${v.toFixed(1)} W/(m·K)`
  },
  electricalConductivity: {
    label: 'Electrical Conductivity',
    unit: 'MS/m',
    description: 'Ohmic electrical conductance capability at room temperature.',
    getValue: el => el.electricalConductivity || 0,
    format: v => `${v.toFixed(2)} MS/m`
  }
};

// Interpolates a value between min and max to a color along an aesthetic cool-to-warm gradient
export function getHeatmapColor(value: number, min: number, max: number): string {
  if (value === undefined || isNaN(value) || value <= 0 && min > 0) {
    return 'rgba(30, 41, 59, 0.6)';
  }
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  // 4-stop gradient: Deep Blue -> Cyan -> Yellow -> Orange/Crimson
  if (t < 0.25) {
    const s = t / 0.25;
    return `rgb(${Math.round(20 + s * 10)}, ${Math.round(60 + s * 140)}, ${Math.round(180 + s * 40)})`;
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return `rgb(${Math.round(30 + s * 130)}, ${Math.round(200 + s * 30)}, ${Math.round(220 - s * 120)})`;
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return `rgb(${Math.round(160 + s * 80)}, ${Math.round(230 - s * 80)}, ${Math.round(100 - s * 70)})`;
  } else {
    const s = (t - 0.75) / 0.25;
    return `rgb(${Math.round(240 + s * 15)}, ${Math.round(150 - s * 110)}, ${Math.round(30 + s * 20)})`;
  }
}

export const PeriodicHeatmapLegend: React.FC<PeriodicHeatmapLegendProps> = ({
  mode,
  onSelectMode,
  elements
}) => {
  const config = HEATMAP_CONFIGS[mode];
  if (!config) return null;

  const validValues = elements
    .map(el => config.getValue(el))
    .filter(v => v !== undefined && !isNaN(v) && v !== 0);

  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 100;
  const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d1424] via-[#090e1a] to-[#0d1424] border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
            Property Heatmap: {config.label}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            [{config.unit}]
          </span>
        </div>

        <button
          onClick={() => onSelectMode('none')}
          className="text-[10px] font-mono font-bold uppercase text-slate-400 hover:text-white px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <X className="w-3 h-3" />
          <span>Exit Heatmap</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
        {config.description}
      </p>

      {/* Gradient Color Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-full rounded-full border border-slate-700/80 shadow-inner overflow-hidden bg-gradient-to-r from-[rgb(20,60,180)] via-[rgb(30,200,220)] via-[rgb(240,150,30)] to-[rgb(255,40,50)]" />
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 font-bold">
          <div className="text-left">
            <span className="text-slate-500 text-[8px] uppercase block">Min</span>
            <span>{config.format(min)}</span>
          </div>
          <div className="text-center">
            <span className="text-slate-500 text-[8px] uppercase block">Mean / Median</span>
            <span className="text-cyan-400">{config.format(avg)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[8px] uppercase block">Max</span>
            <span>{config.format(max)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
