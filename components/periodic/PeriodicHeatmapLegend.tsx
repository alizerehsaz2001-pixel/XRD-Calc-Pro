import React from 'react';
import { Sparkles, X, ArrowUpRight } from 'lucide-react';
import { HeatmapMode, CrystalElement } from './types';

interface PeriodicHeatmapLegendProps {
  mode: HeatmapMode;
  onSelectMode: (mode: HeatmapMode) => void;
  elements: CrystalElement[];
  onSelectElement?: (num: number) => void;
}

export interface HeatmapConfig {
  label: string;
  unit: string;
  description: string;
  getValue: (el: CrystalElement) => number;
  format: (val: number) => string;
}

export function computeUnitCellVolume(el: CrystalElement): number {
  const a = el.a || 0;
  const b = el.b || a;
  const c = el.c || a;
  if (a <= 0) return 0;
  if (el.crystalStructure === 'HCP' || el.crystalStructure === 'Hexagonal') {
    return a * a * c * (Math.sqrt(3) / 2);
  }
  if (el.crystalStructure === 'Rhombohedral' && el.alpha) {
    const rad = (el.alpha * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const factor = Math.sqrt(Math.max(0.01, 1 - 3 * cosA * cosA + 2 * cosA * cosA * cosA));
    return a * a * a * factor;
  }
  return a * b * c;
}

export const HEATMAP_CONFIGS: Record<HeatmapMode, HeatmapConfig | null> = {
  none: null,
  latticeA: {
    label: 'Lattice Constant (a₀)',
    unit: 'Å',
    description: 'Primary crystallographic unit cell edge length a₀ measured by X-ray diffraction at STP.',
    getValue: el => el.a || 0,
    format: v => `${v.toFixed(3)} Å`
  },
  unitCellVolume: {
    label: 'Unit Cell Volume (V_cell)',
    unit: 'Å³',
    description: 'Crystallographic unit cell volume V = a·b·c·f(α,β,γ) accounting for Bravais lattice symmetry.',
    getValue: el => computeUnitCellVolume(el),
    format: v => `${v.toFixed(1)} Å³`
  },
  electronegativity: {
    label: 'Pauling Electronegativity',
    unit: 'χ',
    description: 'Relative chemical tendency of an atom to attract shared electron pairs in a covalent bond.',
    getValue: el => el.electronegativity || 0,
    format: v => v > 0 ? v.toFixed(2) : 'N/A'
  },
  atomicRadius: {
    label: 'Empirical Atomic Radius',
    unit: 'pm',
    description: 'Calculated empirical covalent/metallic radius of neutral ground-state atoms.',
    getValue: el => el.atomicRadius || 0,
    format: v => `${v.toFixed(0)} pm`
  },
  ionizationEnergy: {
    label: '1st Ionization Energy',
    unit: 'eV',
    description: 'Minimal energy required to remove the outermost valence electron from an isolated gaseous atom.',
    getValue: el => el.ionizationEnergy || 0,
    format: v => `${v.toFixed(2)} eV`
  },
  electronAffinity: {
    label: 'Electron Affinity',
    unit: 'eV',
    description: 'Enthalpy change when an electron is attached to a neutral gaseous atom.',
    getValue: el => el.electronAffinity || 0,
    format: v => `${v.toFixed(2)} eV`
  },
  density: {
    label: 'Crystallographic Mass Density',
    unit: 'g/cm³',
    description: 'Theoretical X-ray density ρ = (Z·M)/(N_A·V_cell) at standard conditions.',
    getValue: el => el.density || 0,
    format: v => `${v.toFixed(2)} g/cm³`
  },
  meltingPoint: {
    label: 'Melting Point (T_m)',
    unit: '°C',
    description: 'Standard atmospheric transition temperature from crystalline solid to liquid phase.',
    getValue: el => el.meltingPoint,
    format: v => `${v.toFixed(0)} °C`
  },
  boilingPoint: {
    label: 'Boiling Point (T_b)',
    unit: '°C',
    description: 'Standard vaporization temperature into gaseous state at 1 atm.',
    getValue: el => el.boilingPoint ?? 0,
    format: v => `${v.toFixed(0)} °C`
  },
  scatteringPower: {
    label: 'Thomson Forward Scattering',
    unit: 'f₀(0) = Z e⁻',
    description: 'Forward coherent elastic X-ray scattering amplitude at sin(θ)/λ = 0.',
    getValue: el => el.number,
    format: v => `${v.toFixed(0)} e⁻`
  },
  massAttenuation: {
    label: 'Cu-Kα Mass Attenuation (μ/ρ)',
    unit: 'cm²/g',
    description: 'Total photoelectric absorption and scattering cross-section per unit mass for 8.048 keV X-rays.',
    getValue: el => el.muOverRhoCu || (0.016 * Math.pow(el.number, 3.5)),
    format: v => `${v.toFixed(1)} cm²/g`
  },
  thermalConductivity: {
    label: 'Thermal Conductivity (κ)',
    unit: 'W/(m·K)',
    description: 'Phonon and electronic heat transport rate per unit temperature gradient at 300 K.',
    getValue: el => el.thermalConductivity || 0,
    format: v => `${v.toFixed(1)} W/(m·K)`
  },
  electricalConductivity: {
    label: 'Electrical Conductivity (σ)',
    unit: 'MS/m',
    description: 'Ohmic electrical conductance capability at room temperature.',
    getValue: el => el.electricalConductivity || 0,
    format: v => `${v.toFixed(2)} MS/m`
  }
};

export function getHeatmapColor(value: number, min: number, max: number): string {
  if (value === undefined || isNaN(value) || (value <= 0 && min > 0)) {
    return 'rgba(30, 41, 59, 0.6)';
  }
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  // 4-stop scientific gradient: Deep Indigo/Blue -> Cyan -> Amber -> Crimson
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
  elements,
  onSelectElement
}) => {
  const config = HEATMAP_CONFIGS[mode];
  if (!config) return null;

  const validPairs = elements
    .map(el => ({ el, val: config.getValue(el) }))
    .filter(p => p.val !== undefined && !isNaN(p.val) && p.val !== 0);

  const validValues = validPairs.map(p => p.val);
  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 100;
  const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  const minPair = validPairs.reduce((prev, curr) => (curr.val < prev.val ? curr : prev), validPairs[0]);
  const maxPair = validPairs.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), validPairs[0]);

  return (
    <div className="p-4 rounded-xl bg-[#0B0F19] border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Property Heatmap: {config.label}
          </span>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            [{config.unit}]
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelectMode('none')}
          className="text-[10px] font-mono font-bold uppercase text-slate-400 hover:text-white px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <X className="w-3 h-3" />
          <span>Exit Heatmap</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
        {config.description}
      </p>

      {/* Gradient Color Bar */}
      <div className="space-y-2 pt-1">
        <div className="h-3 w-full rounded-md border border-slate-700/80 shadow-inner overflow-hidden bg-gradient-to-r from-[rgb(20,60,180)] via-[rgb(30,200,220)] via-[rgb(240,150,30)] to-[rgb(255,40,50)]" />
        <div className="grid grid-cols-3 items-center text-[10px] font-mono text-slate-300 font-bold tabular-nums">
          <div className="text-left flex items-center gap-2">
            <div>
              <span className="text-slate-500 text-[8.5px] uppercase block">Minimum</span>
              <span>{config.format(min)}</span>
            </div>
            {minPair && onSelectElement && (
              <button
                type="button"
                onClick={() => onSelectElement(minPair.el.number)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-indigo-950/80 border border-slate-700 hover:border-indigo-500/50 text-[9.5px] text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                title={`Select ${minPair.el.name} (Z=${minPair.el.number})`}
              >
                <span>{minPair.el.symbol}</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <div className="text-center">
            <span className="text-slate-500 text-[8.5px] uppercase block">Periodic Mean ({validPairs.length} el)</span>
            <span className="text-cyan-400">{config.format(avg)}</span>
          </div>
          <div className="text-right flex items-center justify-end gap-2">
            {maxPair && onSelectElement && (
              <button
                type="button"
                onClick={() => onSelectElement(maxPair.el.number)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-[9.5px] text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                title={`Select ${maxPair.el.name} (Z=${maxPair.el.number})`}
              >
                <span>{maxPair.el.symbol}</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            )}
            <div>
              <span className="text-slate-500 text-[8.5px] uppercase block">Maximum</span>
              <span>{config.format(max)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
