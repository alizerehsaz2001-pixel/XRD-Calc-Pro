import React, { useState, useMemo } from 'react';
import { Activity, X, ArrowUpRight, BarChart3, ScatterChart } from 'lucide-react';
import { HeatmapMode, CrystalElement, XRayAnodeType } from './types';
import {
  XRAY_ANODES,
  getAnodeFluorescenceAssessment,
  getElementMuRhoForAnode
} from './xrayAnodePhysics';

interface PeriodicHeatmapLegendProps {
  mode: HeatmapMode;
  onSelectMode: (mode: HeatmapMode) => void;
  elements: CrystalElement[];
  selectedElement?: number;
  onSelectElement?: (num: number) => void;
  selectedAnode?: XRayAnodeType;
  dbPhaseCounts?: Record<string, number>;
}

export interface HeatmapConfig {
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  getValue: (el: CrystalElement, ctx?: { anode?: XRayAnodeType; dbPhaseCounts?: Record<string, number> }) => number;
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

export function getElementKEdgeKeV(el: CrystalElement): number {
  if (el.kEdgeKeV && el.kEdgeKeV > 0) return el.kEdgeKeV;
  const z = el.number;
  if (z <= 1) return 0.0136;
  // Moseley-Dirac relativistic K-edge scaling approximation calibrated across Z = 2..118
  const effZ = Math.max(0.8, z - 1.15);
  return 0.013605 * effZ * effZ * (1 + 0.000042 * z * z);
}

export function getElementKAlpha1KeV(el: CrystalElement): number {
  if (el.kAlpha1KeV && el.kAlpha1KeV > 0) return el.kAlpha1KeV;
  const z = el.number;
  if (z <= 2) return 0.0102 * Math.pow(z - 0.5, 2);
  // Moseley's Law K_alpha1 approximation: 10.2 eV * (Z - 1)^2 with high-Z relativistic term
  return 0.010204 * Math.pow(z - 1, 2) * (1 + 0.000038 * z * z);
}

export function getElementMuRhoCu(el: CrystalElement): number {
  if (el.muOverRhoCu && el.muOverRhoCu > 0) return el.muOverRhoCu;
  const z = el.number;
  // Photoelectric Z^3.5 jump drop above Cu K-alpha 8.048 keV
  if (z <= 29) return Number((0.014 * Math.pow(z, 3.35)).toFixed(2));
  return Number((0.0038 * Math.pow(z, 3.25)).toFixed(2));
}

export function getCuFluorescenceScore(el: CrystalElement): number {
  const kEdge = getElementKEdgeKeV(el);
  const cuKa = 8.048;
  // Secondary fluorescence peaks sharply when K-edge lies just below 8.048 keV (Sc=4.49 .. Co=7.71 keV)
  if (kEdge > 1.5 && kEdge < cuKa) {
    return Number((100 * Math.exp(-Math.pow((cuKa - kEdge) / 3.4, 1.3))).toFixed(1));
  }
  // L-edge excitation near Cu Ka (rare earths / heavy metals around Z=55..72)
  const estL3 = kEdge * 0.145;
  if (estL3 > 2.5 && estL3 < cuKa) {
    return Number((42 * Math.exp(-Math.pow((cuKa - estL3) / 3.0, 1.4))).toFixed(1));
  }
  return 2;
}

export const HEATMAP_CONFIGS: Record<HeatmapMode, HeatmapConfig | null> = {
  none: null,
  dbPhaseCount: {
    label: 'XRD Database Phase Coverage',
    shortLabel: 'DB Phases',
    unit: 'phases',
    description: 'Number of crystalline phases, alloys, oxides, and compounds in the built-in XRD library containing each element.',
    getValue: (el, ctx) => ctx?.dbPhaseCounts?.[el.symbol] || 0,
    format: v => `${Math.round(v)} ph`
  },
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
  molarVolume: {
    label: 'Lothar Meyer Molar Volume (V_m = M/ρ)',
    shortLabel: 'V_m (cm³/mol)',
    unit: 'cm³/mol',
    description: 'Volume occupied by 1 mole of atoms at STP, revealing classic shell-closure periodicity maxima at alkali metals.',
    getValue: el => (el.density > 0 ? el.weight / el.density : 0),
    format: v => `${v.toFixed(2)} cm³/mol`
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
    label: 'X-Ray Mass Attenuation (μ/ρ)',
    shortLabel: 'μ/ρ Anode',
    unit: 'cm²/g',
    description: 'Photoelectric absorption and scattering cross-section per unit mass recalculated dynamically for the selected X-ray tube anode.',
    getValue: (el, ctx) => getElementMuRhoForAnode(el, ctx?.anode || 'Cu'),
    format: v => `${v.toFixed(1)} cm²/g`
  },
  kEdgeKeV: {
    label: 'K-Shell Absorption Edge (E_K)',
    shortLabel: 'E_K Edge (keV)',
    unit: 'keV',
    description: 'Minimum photon energy needed to eject a 1s K-shell photoelectron (obeys Moseley scaling E_K ∝ Z²).',
    getValue: el => getElementKEdgeKeV(el),
    format: v => (v >= 1 ? `${v.toFixed(2)} keV` : `${(v * 1000).toFixed(0)} eV`)
  },
  kAlpha1KeV: {
    label: 'Characteristic Kα₁ Emission (E_Kα₁)',
    shortLabel: 'Kα₁ (keV)',
    unit: 'keV',
    description: 'Principal 2p₃/₂ → 1s XRF emission energy governing elemental identification and Moseley’s law.',
    getValue: el => getElementKAlpha1KeV(el),
    format: v => (v >= 1 ? `${v.toFixed(2)} keV` : `${(v * 1000).toFixed(0)} eV`)
  },
  cuFluorescenceRisk: {
    label: 'Anode Secondary Fluorescence Index',
    shortLabel: 'Fluo. Risk',
    unit: '%',
    description: 'Relative K/L-edge fluorescence background severity under the active X-ray tube anode. Switch anodes (Cu/Co/Mo/Cr/Fe/Ag) to eliminate fluorescence.',
    getValue: (el, ctx) => getAnodeFluorescenceAssessment(el, ctx?.anode || 'Cu').score,
    format: v => `${v.toFixed(0)}%`
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
  'dbPhaseCount',
  'latticeA',
  'unitCellVolume',
  'molarVolume',
  'density',
  'atomicRadius',
  'electronegativity',
  'ionizationEnergy',
  'meltingPoint',
  'massAttenuation',
  'kEdgeKeV',
  'cuFluorescenceRisk',
  'thermalConductivity',
  'electricalConductivity'
];

type CorrelationPreset =
  | 'metric_vs_z'
  | 'moseley_law'
  | 'density_vs_radius'
  | 'melt_vs_chi'
  | 'molar_vol_vs_z';

const BLOCK_DOT_COLOR: Record<string, string> = {
  s: '#f59e0b',
  p: '#10b981',
  d: '#38bdf8',
  f: '#e879f9'
};

export const PeriodicHeatmapLegend: React.FC<PeriodicHeatmapLegendProps> = ({
  mode,
  onSelectMode,
  elements,
  selectedElement,
  onSelectElement,
  selectedAnode = 'Cu',
  dbPhaseCounts
}) => {
  const [hoveredSparkEl, setHoveredSparkEl] = useState<CrystalElement | null>(null);
  const [chartView, setChartView] = useState<'sparkbar' | 'correlation'>('sparkbar');
  const [corrPreset, setCorrPreset] = useState<CorrelationPreset>('metric_vs_z');

  const config = HEATMAP_CONFIGS[mode];
  const valueCtx = useMemo(
    () => ({ anode: selectedAnode, dbPhaseCounts }),
    [selectedAnode, dbPhaseCounts]
  );

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.number - b.number),
    [elements]
  );

  // Build 2D Correlation coordinates
  const scatterData = useMemo(() => {
    const activeCfg = config || HEATMAP_CONFIGS.molarVolume!;
    const pts = sortedElements
      .map(el => {
        let x = el.number;
        let y = activeCfg.getValue(el, valueCtx);
        if (corrPreset === 'moseley_law') {
          x = el.number;
          y = Math.sqrt(Math.max(0, getElementKEdgeKeV(el)));
        } else if (corrPreset === 'density_vs_radius') {
          x = el.atomicRadius || 0;
          y = el.density || 0;
        } else if (corrPreset === 'melt_vs_chi') {
          x = el.electronegativity || 0;
          y = el.meltingPoint;
        } else if (corrPreset === 'molar_vol_vs_z') {
          x = el.number;
          y = el.density > 0 ? el.weight / el.density : 0;
        }
        return { el, x, y };
      })
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x > 0 && (corrPreset === 'melt_vs_chi' || p.y > 0));

    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 118;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 1;

    let xLabel = 'Atomic Number Z';
    let yLabel = `${activeCfg.shortLabel}`;
    if (corrPreset === 'moseley_law') {
      xLabel = 'Atomic Number Z';
      yLabel = '√E_K (keV¹/²) — Moseley Law';
    } else if (corrPreset === 'density_vs_radius') {
      xLabel = 'Atomic Radius r_at (pm)';
      yLabel = 'Density ρ (g/cm³)';
    } else if (corrPreset === 'melt_vs_chi') {
      xLabel = 'Pauling Electronegativity χ';
      yLabel = 'Melting Point T_m (°C)';
    } else if (corrPreset === 'molar_vol_vs_z') {
      xLabel = 'Atomic Number Z';
      yLabel = 'Molar Volume V_m (cm³/mol)';
    }

    return { pts, minX, maxX, minY, maxY, xLabel, yLabel };
  }, [sortedElements, config, corrPreset, valueCtx]);

  if (!config) return null;

  const validPairs = sortedElements
    .map(el => ({ el, val: config.getValue(el, valueCtx) }))
    .filter(p => p.val !== undefined && !isNaN(p.val) && p.val !== 0);

  const validValues = validPairs.map(p => p.val);
  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 100;
  const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  const minPair = validPairs.reduce((prev, curr) => (curr.val < prev.val ? curr : prev), validPairs[0]);
  const maxPair = validPairs.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), validPairs[0]);

  const activeEl = hoveredSparkEl || sortedElements.find(e => e.number === selectedElement) || sortedElements[13];
  const activeVal = activeEl ? config.getValue(activeEl, valueCtx) : 0;

  // Period start atomic numbers for visual shell markers
  const periodStarts = new Set([1, 3, 11, 19, 37, 55, 87]);

  // SVG plot geometry
  const svgW = 720;
  const svgH = 148;
  const pad = { l: 46, r: 18, t: 14, b: 24 };
  const plotW = svgW - pad.l - pad.r;
  const plotH = svgH - pad.t - pad.b;

  const mapX = (x: number) =>
    pad.l + ((x - scatterData.minX) / Math.max(1e-6, scatterData.maxX - scatterData.minX)) * plotW;
  const mapY = (y: number) =>
    pad.t + plotH - ((y - scatterData.minY) / Math.max(1e-6, scatterData.maxY - scatterData.minY)) * plotH;

  const activeScatterPt = activeEl
    ? scatterData.pts.find(p => p.el.number === activeEl.number) || null
    : null;

  return (
    <div className="p-4 rounded-2xl bg-[#0B0F19] border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-150">
      {/* Header + Quick Property Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
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
          {/* Chart View Switcher: Sparkbar vs 2D XY Correlation */}
          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setChartView('sparkbar')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                chartView === 'sparkbar'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Z-Wave</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('correlation')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                chartView === 'correlation'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScatterChart className="w-3 h-3" />
              <span>XY Correlation</span>
            </button>
          </div>

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

      {chartView === 'sparkbar' ? (
        /* Interactive 118-Element Periodic Trend Sparkbar Spectrum (Z = 1..118) */
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
              const val = config.getValue(el, valueCtx);
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
      ) : (
        /* Interactive 2D Periodic Correlation & Moseley Law Plot */
        <div className="space-y-2 bg-[#060911] border border-slate-800/90 rounded-xl p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'metric_vs_z', label: `${config.shortLabel} vs Z` },
                  { id: 'moseley_law', label: 'Moseley √E_K vs Z' },
                  { id: 'molar_vol_vs_z', label: 'Lothar Meyer V_m vs Z' },
                  { id: 'density_vs_radius', label: 'ρ vs r_at' },
                  { id: 'melt_vs_chi', label: 'T_melt vs χ' }
                ] as const
              ).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCorrPreset(p.id)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    corrPreset === p.id
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 text-[9.5px] text-slate-400 tabular-nums">
              {(['s', 'p', 'd', 'f'] as const).map(b => (
                <span key={b} className="inline-flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: BLOCK_DOT_COLOR[b] }}
                  />
                  <span>{b}-blk</span>
                </span>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36 min-w-[540px] select-none">
              {/* Horizontal Gridlines & Y-ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((f, idx) => {
                const y = pad.t + plotH * (1 - f);
                const val = scatterData.minY + f * (scatterData.maxY - scatterData.minY);
                return (
                  <g key={`yg-${idx}`}>
                    <line
                      x1={pad.l}
                      y1={y}
                      x2={svgW - pad.r}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray={idx === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={pad.l - 5}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-500 font-mono text-[8px] tabular-nums"
                    >
                      {Math.abs(val) >= 100 ? val.toFixed(0) : val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Gridlines & X-ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((f, idx) => {
                const x = pad.l + plotW * f;
                const val = scatterData.minX + f * (scatterData.maxX - scatterData.minX);
                return (
                  <g key={`xg-${idx}`}>
                    <line
                      x1={x}
                      y1={pad.t}
                      x2={x}
                      y2={pad.t + plotH}
                      stroke="#1e293b"
                      strokeDasharray={idx === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={x}
                      y={svgH - 6}
                      textAnchor="middle"
                      className="fill-slate-500 font-mono text-[8px] tabular-nums"
                    >
                      {Math.abs(val) >= 10 ? val.toFixed(0) : val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Active Anode Energy Threshold Marker in Moseley Law view */}
              {corrPreset === 'moseley_law' && (() => {
                const tube = XRAY_ANODES[selectedAnode];
                const sqrtTube = Math.sqrt(tube.energyKeV);
                if (sqrtTube < scatterData.minY || sqrtTube > scatterData.maxY) return null;
                const yTube = mapY(sqrtTube);
                return (
                  <g>
                    <line
                      x1={pad.l}
                      y1={yTube}
                      x2={svgW - pad.r}
                      y2={yTube}
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={svgW - pad.r - 4}
                      y={yTube - 4}
                      textAnchor="end"
                      className="fill-rose-400 font-mono text-[8px] font-bold"
                    >
                      {tube.shortLabel} = {tube.energyKeV.toFixed(3)} keV (Fluorescence boundary)
                    </text>
                  </g>
                );
              })()}

              {/* Continuous Z-trend polyline for Z-ordered presets */}
              {(corrPreset === 'metric_vs_z' || corrPreset === 'moseley_law' || corrPreset === 'molar_vol_vs_z') && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeOpacity="0.35"
                  strokeWidth="1.2"
                  points={scatterData.pts.map(p => `${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`).join(' ')}
                />
              )}

              {/* Active / Hovered Crosshair Probe */}
              {activeScatterPt && (
                <g className="pointer-events-none">
                  <line
                    x1={mapX(activeScatterPt.x)}
                    y1={pad.t}
                    x2={mapX(activeScatterPt.x)}
                    y2={pad.t + plotH}
                    stroke="#22d3ee"
                    strokeWidth="0.9"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={pad.l}
                    y1={mapY(activeScatterPt.y)}
                    x2={svgW - pad.r}
                    y2={mapY(activeScatterPt.y)}
                    stroke="#22d3ee"
                    strokeWidth="0.9"
                    strokeDasharray="2 2"
                  />
                </g>
              )}

              {/* Data Points */}
              {scatterData.pts.map(pt => {
                const cx = mapX(pt.x);
                const cy = mapY(pt.y);
                const isSel = selectedElement === pt.el.number;
                const isHov = hoveredSparkEl?.number === pt.el.number;
                const fill = BLOCK_DOT_COLOR[pt.el.block] || '#94a3b8';
                return (
                  <g
                    key={`sc-${pt.el.number}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSparkEl(pt.el)}
                    onMouseLeave={() => setHoveredSparkEl(null)}
                    onClick={() => onSelectElement && onSelectElement(pt.el.number)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSel || isHov ? 5 : 2.6}
                      fill={isSel ? '#ffffff' : fill}
                      fillOpacity={isSel || isHov ? 1 : 0.85}
                      stroke={isSel ? '#22d3ee' : '#060911'}
                      strokeWidth={isSel ? 1.5 : 0.7}
                    />
                    {(isSel || isHov) && (
                      <text
                        x={cx + 7}
                        y={Math.max(pad.t + 9, cy - 5)}
                        className="fill-cyan-200 font-mono text-[8.5px] font-bold pointer-events-none"
                      >
                        {pt.el.symbol} ({pt.x.toFixed(1)}, {pt.y.toFixed(2)})
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Axis Caption */}
              <text x={pad.l + 4} y={pad.t + 9} className="fill-slate-400 font-mono text-[8px] font-bold">
                {scatterData.yLabel} vs {scatterData.xLabel}
              </text>
            </svg>
          </div>
        </div>
      )}

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

