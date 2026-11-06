import React, { useState } from 'react';
import { Sparkles, X, ArrowUpRight } from 'lucide-react';
import { HeatmapMode, CrystalElement } from './types';

interface PeriodicHeatmapLegendProps {
  mode: HeatmapMode;
  onSelectMode: (mode: HeatmapMode) => void;
  elements: CrystalElement[];
  selectedElement?: number;
  onSelectElement?: (num: number) => void;
}

export interface HeatmapConfig {
  label: string;
  shortLabel: string;
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
    shortLabel: 'a₀ (Å)',
    unit: 'Å',
    description: 'Primary crystallographic unit cell edge length a₀ measured by X-ray diffraction at STP.',
    getValue: el => el.a || 0,
    format: v => `${v.toFixed(3)} Å`
  },
  unitCellVolume: {
    label: 'Unit Cell Volume (V_cell)',
    shortLabel: 'V_cell (Å³)',
    unit: 'Å³',
    description: 'Crystallographic unit cell volume V = a·b·c·f(α,β,γ) accounting for Bravais lattice symmetry.',
    getValue: el => computeUnitCellVolume(el),
    format: v => `${v.toFixed(1)} Å³`
  },
  density: {
    label: 'Crystallographic Mass Density',
    shortLabel: 'ρ_XRD',
    unit: 'g/cm³',
    description: 'Theoretical X-ray density ρ = (Z·M)/(N_A·V_cell) at standard conditions.',
    getValue: el => el.density || 0,
    format: v => `${v.toFixed(2)} g/cm³`
  },
  atomicRadius: {
    label: 'Empirical Atomic Radius',
    shortLabel: 'r_at (pm)',
    unit: 'pm',
    description: 'Calculated empirical covalent/metallic radius of neutral ground-state atoms.',
    getValue: el => el.atomicRadius || 0,
    format: v => `${v.toFixed(0)} pm`
  },
  electronegativity: {
    label: 'Pauling Electronegativity',
    shortLabel: 'χ Pauling',
    unit: 'χ',
    description: 'Relative chemical tendency of an atom to attract shared electron pairs in a covalent bond.',
    getValue: el => el.electronegativity || 0,
    format: v => (v > 0 ? v.toFixed(2) : 'N/A')
  },
  ionizationEnergy: {
    label: '1st Ionization Energy',
    shortLabel: 'E_ion (eV)',
    unit: 'eV',
    description: 'Minimal energy required to remove the outermost valence electron from an isolated gaseous atom.',
    getValue: el => el.ionizationEnergy || 0,
    format: v => `${v.toFixed(2)} eV`
  },
  electronAffinity: {
    label: 'Electron Affinity',
    shortLabel: 'E_aff (eV)',
    unit: 'eV',
    description: 'Enthalpy change when an electron is attached to a neutral gaseous atom.',
    getValue: el => el.electronAffinity || 0,
    format: v => `${v.toFixed(2)} eV`
  },
  meltingPoint: {
    label: 'Melting Point (T_m)',
    shortLabel: 'T_melt (°C)',
    unit: '°C',
    description: 'Standard atmospheric transition temperature from crystalline solid to liquid phase.',
    getValue: el => el.meltingPoint,
    format: v => `${v.toFixed(0)} °C`
  },
  boilingPoint: {
    label: 'Boiling Point (T_b)',
    shortLabel: 'T_boil (°C)',
    unit: '°C',
    description: 'Standard vaporization temperature into gaseous state at 1 atm.',
    getValue: el => el.boilingPoint ?? 0,
    format: v => `${v.toFixed(0)} °C`
  },
  scatteringPower: {
    label: 'Thomson Forward Scattering',
    shortLabel: 'f₀(0) = Z',
    unit: 'f₀(0) = Z e⁻',
    description: 'Forward coherent elastic X-ray scattering amplitude at sin(θ)/λ = 0.',
    getValue: el => el.number,
    format: v => `${v.toFixed(0)} e⁻`
  },
  massAttenuation: {
    label: 'Cu-Kα Mass Attenuation (μ/ρ)',
    shortLabel: 'μ/ρ Cu-Kα',
    unit: 'cm²/g',
    description: 'Total photoelectric absorption and scattering cross-section per unit mass for 8.048 keV X-rays.',
    getValue: el => el.muOverRhoCu || 0.016 * Math.pow(el.number, 3.5),
    format: v => `${v.toFixed(1)} cm²/g`
  },
  thermalConductivity: {
    label: 'Thermal Conductivity (κ)',
    shortLabel: 'κ_therm',
    unit: 'W/(m·K)',
    description: 'Phonon and electronic heat transport rate per unit temperature gradient at 300 K.',
    getValue: el => el.thermalConductivity || 0,
    format: v => `${v.toFixed(1)} W/(m·K)`
  },
  electricalConductivity: {
    label: 'Electrical Conductivity (σ)',
    shortLabel: 'σ_elec',
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

  // 4-stop calibrated scientific gradient: Deep Cobalt -> Cyan -> Amber -> Crimson
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

const HEATMAP_MODE_KEYS: Exclude<HeatmapMode, 'none'>[] = [
  'latticeA',
  'unitCellVolume',
  'density',
  'atomicRadius',
  'electronegativity',
  'ionizationEnergy',
  'meltingPoint',
  'massAttenuation',
  'thermalConductivity',
  'electricalConductivity'
];

export const PeriodicHeatmapLegend: React.FC<PeriodicHeatmapLegendProps> = ({
  mode,
  onSelectMode,
  elements,
  selectedElement,
  onSelectElement
}) => {
  const [hoveredSparkEl, setHoveredSparkEl] = useState<CrystalElement | null>(null);
  const config = HEATMAP_CONFIGS[mode];
  if (!config) return null;

  const sortedElements = [...elements].sort((a, b) => a.number - b.number);

  const validPairs = sortedElements
    .map(el => ({ el, val: config.getValue(el) }))
    .filter(p => p.val !== undefined && !isNaN(p.val) && p.val !== 0);

  const validValues = validPairs.map(p => p.val);
  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 100;
  const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  const minPair = validPairs.reduce((prev, curr) => (curr.val < prev.val ? curr : prev), validPairs[0]);
  const maxPair = validPairs.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), validPairs[0]);

  const activeEl = hoveredSparkEl || sortedElements.find(e => e.number === selectedElement) || sortedElements[13];
  const activeVal = activeEl ? config.getValue(activeEl) : 0;

  // Period start atomic numbers for visual shell markers
  const periodStarts = new Set([1, 3, 11, 19, 37, 55, 87]);

  return (
    <div className="p-4 rounded-2xl bg-[#0B0F19] border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-150">
      {/* Header + Quick Property Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-white tracking-wider">
              <span>Periodic Property Spectrum: {config.label}</span>
              <span className="text-[10px] text-cyan-300 font-normal">
                [{config.unit}]
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onSelectMode('none')}
            className="text-[10px] font-mono font-bold uppercase text-slate-300 hover:text-white px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-3 h-3" />
            <span>Exit Heatmap</span>
          </button>
        </div>
      </div>

      {/* Quick Property Mode Switcher Strip */}
      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
        <span className="text-slate-500 uppercase font-bold mr-1">Metric:</span>
        {HEATMAP_MODE_KEYS.map(mKey => {
          const mCfg = HEATMAP_CONFIGS[mKey];
          if (!mCfg) return null;
          const isCurrent = mode === mKey;
          return (
            <button
              key={mKey}
              type="button"
              onClick={() => onSelectMode(mKey)}
              className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isCurrent
                  ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-sm'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {mCfg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Interactive 118-Element Periodic Trend Sparkbar Spectrum (Z = 1..118) */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 tabular-nums">
          <span>PERIODIC WAVE PROFILE (Z = 1 → 118 · VERTICAL TICKS MARK ALKALI SHELL STARTS)</span>
          {activeEl && (
            <span className="text-cyan-300 font-bold">
              Z={activeEl.number} {activeEl.symbol} ({activeEl.name}): {config.format(activeVal)}
            </span>
          )}
        </div>
        <div className="h-14 w-full bg-[#060911] border border-slate-800/90 rounded-xl px-2 pt-2.5 pb-1 flex items-end gap-[1.5px] overflow-x-auto relative">
          {sortedElements.map(el => {
            const val = config.getValue(el);
            const norm = Math.max(0.08, Math.min(1, (val - min) / (max - min || 1)));
            const color = getHeatmapColor(val, min, max);
            const isSel = selectedElement === el.number;
            const isPeriodStart = periodStarts.has(el.number);
            return (
              <button
                key={`spark-${el.number}`}
                type="button"
                onClick={() => onSelectElement && onSelectElement(el.number)}
                onMouseEnter={() => setHoveredSparkEl(el)}
                onMouseLeave={() => setHoveredSparkEl(null)}
                title={`Z=${el.number} ${el.symbol} (${el.name}): ${config.format(val)}`}
                className={`flex-1 min-w-[3.5px] rounded-t-[1.5px] transition-all cursor-pointer relative ${
                  isSel ? 'ring-1 ring-white z-10 scale-y-105' : 'opacity-85 hover:opacity-100'
                } ${isPeriodStart && el.number > 1 ? 'border-l border-slate-600/60' : ''}`}
                style={{
                  height: `${Math.round(norm * 100)}%`,
                  backgroundColor: isSel ? '#ffffff' : color
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Calibrated Color Ramp & Min / Mean / Max Readout */}
      <div className="space-y-1.5 pt-0.5">
        <div className="h-2 w-full rounded-full border border-slate-700/80 overflow-hidden bg-gradient-to-r from-[rgb(20,60,180)] via-[rgb(30,200,220)] via-[rgb(240,150,30)] to-[rgb(255,40,50)]" />
        <div className="grid grid-cols-3 items-center text-[10.5px] font-mono text-slate-300 font-bold tabular-nums">
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
