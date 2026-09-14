import React, { useState } from 'react';
import { CrystalElement, ColorMode, HeatmapMode } from './types';
import { HEATMAP_CONFIGS, getHeatmapColor } from './PeriodicHeatmapLegend';

interface PeriodicTableGridProps {
  elements: CrystalElement[];
  selectedElement: number;
  onSelectElement: (num: number) => void;
  colorMode: ColorMode;
  heatmapMode: HeatmapMode;
  temperature: number; // in Celsius
  matchedElementNumbers: Set<number>;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  alkali: { bg: 'bg-red-950/40', border: 'border-red-500/40 hover:border-red-400', text: 'text-red-300' },
  alkaline_earth: { bg: 'bg-amber-950/40', border: 'border-amber-500/40 hover:border-amber-400', text: 'text-amber-300' },
  transition_metal: { bg: 'bg-sky-950/40', border: 'border-sky-500/40 hover:border-sky-400', text: 'text-sky-300' },
  post_transition: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40 hover:border-emerald-400', text: 'text-emerald-300' },
  metalloid: { bg: 'bg-teal-950/40', border: 'border-teal-500/40 hover:border-teal-400', text: 'text-teal-300' },
  nonmetal: { bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-500/40 hover:border-fuchsia-400', text: 'text-fuchsia-300' },
  noble_gas: { bg: 'bg-indigo-950/40', border: 'border-indigo-500/40 hover:border-indigo-400', text: 'text-indigo-300' },
  lanthanoid: { bg: 'bg-pink-950/40', border: 'border-pink-500/40 hover:border-pink-400', text: 'text-pink-300' },
  actinoid: { bg: 'bg-rose-950/40', border: 'border-rose-500/40 hover:border-rose-400', text: 'text-rose-300' }
};

const BLOCK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  s: { bg: 'bg-amber-950/40', border: 'border-amber-500/50', text: 'text-amber-300' },
  p: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  d: { bg: 'bg-blue-950/40', border: 'border-blue-500/50', text: 'text-blue-300' },
  f: { bg: 'bg-purple-950/40', border: 'border-purple-500/50', text: 'text-purple-300' }
};

const STRUCTURE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  FCC: { bg: 'bg-blue-950/40', border: 'border-blue-500/50', text: 'text-blue-300' },
  BCC: { bg: 'bg-purple-950/40', border: 'border-purple-500/50', text: 'text-purple-300' },
  HCP: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  Diamond: { bg: 'bg-amber-950/40', border: 'border-amber-500/50', text: 'text-amber-300' },
  Hexagonal: { bg: 'bg-teal-950/40', border: 'border-teal-500/50', text: 'text-teal-300' },
  Orthorhombic: { bg: 'bg-orange-950/40', border: 'border-orange-500/50', text: 'text-orange-300' },
  Rhombohedral: { bg: 'bg-cyan-950/40', border: 'border-cyan-500/50', text: 'text-cyan-300' },
  Tetragonal: { bg: 'bg-indigo-950/40', border: 'border-indigo-500/50', text: 'text-indigo-300' },
  Monoclinic: { bg: 'bg-rose-950/40', border: 'border-rose-500/50', text: 'text-rose-300' },
  Cubic: { bg: 'bg-sky-950/40', border: 'border-sky-500/50', text: 'text-sky-300' }
};

export function getPhysicalStateAtTemp(
  meltingPoint: number,
  boilingPoint: number | undefined,
  currentTempC: number
): 'solid' | 'liquid' | 'gas' {
  const bp = boilingPoint ?? (meltingPoint + 1500);
  if (currentTempC < meltingPoint) return 'solid';
  if (currentTempC >= meltingPoint && currentTempC < bp) return 'liquid';
  return 'gas';
}

export const PeriodicTableGrid: React.FC<PeriodicTableGridProps> = ({
  elements,
  selectedElement,
  onSelectElement,
  colorMode,
  heatmapMode,
  temperature,
  matchedElementNumbers
}) => {
  const [hoveredElement, setHoveredElement] = useState<CrystalElement | null>(null);

  // Pre-calculate heatmap min/max
  const heatmapConfig = HEATMAP_CONFIGS[heatmapMode];
  let heatmapMin = 0;
  let heatmapMax = 100;
  if (heatmapConfig) {
    const vals = elements.map(e => heatmapConfig.getValue(e)).filter(v => v !== undefined && !isNaN(v) && v !== 0);
    if (vals.length > 0) {
      heatmapMin = Math.min(...vals);
      heatmapMax = Math.max(...vals);
    }
  }

  // Group elements by grid coordinate key: `${gridX}_${gridY}`
  const elementGridMap = new Map<string, CrystalElement>();
  elements.forEach(el => {
    elementGridMap.set(`${el.gridX}_${el.gridY}`, el);
  });

  const renderCell = (x: number, y: number) => {
    // Check for Lanthanide placeholder (x: 3, y: 6)
    if (x === 3 && y === 6) {
      const isSeriesActive = selectedElement >= 57 && selectedElement <= 71;
      return (
        <button
          key="placeholder-lanthanides"
          onClick={() => onSelectElement(57)}
          className={`aspect-square p-1 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 bg-pink-950/20 text-pink-400 border-pink-800/40 hover:bg-pink-900/30 ${
            isSeriesActive ? 'ring-2 ring-pink-500 shadow-md shadow-pink-500/30' : ''
          }`}
          title="Lanthanide series (Z = 57-71 La to Lu)"
        >
          <span className="text-[7px] font-mono text-slate-400 font-bold">57-71</span>
          <span className="text-[9px] font-black tracking-tight">La-Lu</span>
          <span className="text-[6px] font-mono text-pink-400/80 uppercase">Lanthan</span>
        </button>
      );
    }

    // Check for Actinide placeholder (x: 3, y: 7)
    if (x === 3 && y === 7) {
      const isSeriesActive = selectedElement >= 89 && selectedElement <= 103;
      return (
        <button
          key="placeholder-actinides"
          onClick={() => onSelectElement(89)}
          className={`aspect-square p-1 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 bg-rose-950/20 text-rose-400 border-rose-800/40 hover:bg-rose-900/30 ${
            isSeriesActive ? 'ring-2 ring-rose-500 shadow-md shadow-rose-500/30' : ''
          }`}
          title="Actinide series (Z = 89-103 Ac to Lr)"
        >
          <span className="text-[7px] font-mono text-slate-400 font-bold">89-103</span>
          <span className="text-[9px] font-black tracking-tight">Ac-Lr</span>
          <span className="text-[6px] font-mono text-rose-400/80 uppercase">Actin</span>
        </button>
      );
    }

    const el = elementGridMap.get(`${x}_${y}`);
    if (!el) {
      return <div key={`empty-${x}-${y}`} className="aspect-square opacity-0 pointer-events-none" />;
    }

    const isSelected = selectedElement === el.number;
    const isMatched = matchedElementNumbers.has(el.number);
    const stateAtTemp = getPhysicalStateAtTemp(el.meltingPoint, el.boilingPoint, temperature);

    // Compute styling depending on color mode
    let cellBg = 'bg-[#0b101d]';
    let cellBorder = 'border-slate-800 hover:border-slate-600';
    let symbolColor = 'text-slate-200';
    let customInlineStyle: React.CSSProperties | undefined = undefined;

    if (heatmapMode !== 'none' && heatmapConfig) {
      const val = heatmapConfig.getValue(el);
      const color = getHeatmapColor(val, heatmapMin, heatmapMax);
      customInlineStyle = {
        backgroundColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.22)')}`,
        borderColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.65)')}`
      };
      symbolColor = 'text-white';
    } else if (colorMode === 'category') {
      const col = CATEGORY_COLORS[el.category] || { bg: 'bg-slate-900/40', border: 'border-slate-700', text: 'text-slate-300' };
      cellBg = col.bg;
      cellBorder = col.border;
      symbolColor = col.text;
    } else if (colorMode === 'block') {
      const col = BLOCK_COLORS[el.block] || { bg: 'bg-slate-900/40', border: 'border-slate-700', text: 'text-slate-300' };
      cellBg = col.bg;
      cellBorder = col.border;
      symbolColor = col.text;
    } else if (colorMode === 'structure') {
      const col = STRUCTURE_COLORS[el.crystalStructure] || { bg: 'bg-slate-900/40', border: 'border-slate-700', text: 'text-slate-300' };
      cellBg = col.bg;
      cellBorder = col.border;
      symbolColor = col.text;
    } else if (colorMode === 'state') {
      if (stateAtTemp === 'solid') {
        cellBg = 'bg-slate-900/50';
        cellBorder = 'border-slate-700 hover:border-slate-500';
        symbolColor = 'text-slate-200';
      } else if (stateAtTemp === 'liquid') {
        cellBg = 'bg-blue-950/50';
        cellBorder = 'border-blue-500 hover:border-blue-400';
        symbolColor = 'text-blue-300';
      } else {
        cellBg = 'bg-rose-950/50';
        cellBorder = 'border-rose-500 hover:border-rose-400';
        symbolColor = 'text-rose-300';
      }
    }

    // State dot indicator
    let stateDotColor = 'bg-slate-400';
    if (stateAtTemp === 'liquid') stateDotColor = 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]';
    if (stateAtTemp === 'gas') stateDotColor = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]';

    // Highlight matches / selection
    const opacityClass = isMatched ? 'opacity-100' : 'opacity-25 grayscale hover:grayscale-0 hover:opacity-90';
    const selectionRing = isSelected
      ? 'ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/40 scale-105 z-20 font-black'
      : '';

    // Value to show in the lower line
    let subValueText = `${el.weight.toFixed(1)}`;
    if (heatmapMode !== 'none' && heatmapConfig) {
      subValueText = heatmapConfig.format(heatmapConfig.getValue(el));
    } else if (colorMode === 'structure') {
      subValueText = el.crystalStructure;
    } else if (colorMode === 'state') {
      subValueText = stateAtTemp.toUpperCase();
    }

    return (
      <button
        key={`el-${el.number}`}
        onClick={() => onSelectElement(el.number)}
        onMouseEnter={() => setHoveredElement(el)}
        onMouseLeave={() => setHoveredElement(null)}
        style={customInlineStyle}
        className={`aspect-square p-1 rounded-xl border flex flex-col justify-between transition-all duration-150 relative text-left group select-none ${cellBg} ${cellBorder} ${opacityClass} ${selectionRing}`}
      >
        {/* State indicator dot */}
        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-black/80 ${stateDotColor} transition-colors`} />

        {/* Atomic Number */}
        <div className="text-[7.5px] font-mono text-slate-400 font-bold leading-none">
          {el.number}
        </div>

        {/* Chemical Symbol */}
        <div className={`text-base font-black tracking-tight text-center leading-none my-auto ${symbolColor}`}>
          {el.symbol}
        </div>

        {/* Micro footer: Name & property */}
        <div className="flex justify-between items-end w-full leading-none overflow-hidden">
          <span className="text-[6px] text-slate-400 truncate max-w-[55%] font-medium">
            {el.name}
          </span>
          <span className="text-[5.5px] font-mono font-bold text-slate-300 ml-auto truncate">
            {subValueText}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* 18-Column IUPAC Standard Table Grid */}
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[940px] space-y-2">
          {/* Main 7 Periods (Rows 1 to 7) */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          >
            {Array.from({ length: 7 }, (_, rowIndex) => {
              const y = rowIndex + 1;
              return Array.from({ length: 18 }, (_, colIndex) => {
                const x = colIndex + 1;
                return renderCell(x, y);
              });
            })}
          </div>

          {/* Separation Gap before f-block series */}
          <div
            className="grid gap-1.5 pt-3 pb-1 items-center"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          >
            <div style={{ gridColumn: 'span 3' }} className="border-b border-dashed border-slate-700/60" />
            <div
              style={{ gridColumn: 'span 15' }}
              className="border-b border-dashed border-slate-700/60 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2"
            >
              <span>Inner Transition Elements (f-block Lanthanoids & Actinoids)</span>
              <span>15 Elements per series</span>
            </div>
          </div>

          {/* Lanthanide Series (Row 8, x = 4 to 18) */}
          <div
            className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          >
            <div style={{ gridColumn: 'span 3' }} className="flex items-center justify-end pr-3">
              <span className="text-[9px] font-mono uppercase font-black tracking-wider text-pink-400 bg-pink-950/40 px-2 py-1 rounded-lg border border-pink-800/50">
                Lanthanoids (57–71)
              </span>
            </div>
            {Array.from({ length: 15 }, (_, i) => renderCell(i + 4, 8))}
          </div>

          {/* Actinide Series (Row 9, x = 4 to 18) */}
          <div
            className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          >
            <div style={{ gridColumn: 'span 3' }} className="flex items-center justify-end pr-3">
              <span className="text-[9px] font-mono uppercase font-black tracking-wider text-rose-400 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-800/50">
                Actinoids (89–103)
              </span>
            </div>
            {Array.from({ length: 15 }, (_, i) => renderCell(i + 4, 9))}
          </div>
        </div>
      </div>

      {/* Floating or Hover Element Quick Metrology Card */}
      {hoveredElement && (
        <div className="p-3 bg-[#0a1020] border border-indigo-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-xl animate-in fade-in duration-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex flex-col items-center justify-center font-black text-indigo-300">
              <span className="text-[8px] text-slate-400">{hoveredElement.number}</span>
              <span className="text-base leading-none">{hoveredElement.symbol}</span>
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{hoveredElement.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">({hoveredElement.weight.toFixed(3)} u)</span>
              </div>
              <div className="text-[10px] text-indigo-300 font-bold">
                {hoveredElement.category.replace('_', ' ').toUpperCase()} • {hoveredElement.crystalStructure} ({hoveredElement.spaceGroup})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 text-[9px] block">Lattice (a)</span>
              <span className="font-bold text-white">{hoveredElement.a.toFixed(3)} Å</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] block">Density</span>
              <span className="font-bold text-white">{hoveredElement.density.toFixed(2)} g/cm³</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] block">Melting Pt</span>
              <span className="font-bold text-white">{hoveredElement.meltingPoint} °C</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] block">Electron Config</span>
              <span className="font-bold text-cyan-400">{hoveredElement.electronConfig}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
