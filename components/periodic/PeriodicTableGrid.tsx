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
  activeCategoryFilter?: string;
  onToggleCategoryFilter?: (cat: string) => void;
  activeStructureFilter?: string;
  onToggleStructureFilter?: (struct: string) => void;
  activeBlockFilter?: string;
  onToggleBlockFilter?: (block: string) => void;
}

const CATEGORY_COLORS: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  alkali: { label: 'Alkali Metal', bg: 'bg-red-950/45', border: 'border-red-500/40 hover:border-red-400', text: 'text-red-300', dot: 'bg-red-400' },
  alkaline_earth: { label: 'Alkaline Earth', bg: 'bg-amber-950/45', border: 'border-amber-500/40 hover:border-amber-400', text: 'text-amber-300', dot: 'bg-amber-400' },
  transition_metal: { label: 'Transition Metal', bg: 'bg-sky-950/45', border: 'border-sky-500/40 hover:border-sky-400', text: 'text-sky-300', dot: 'bg-sky-400' },
  post_transition: { label: 'Post-Transition', bg: 'bg-emerald-950/45', border: 'border-emerald-500/40 hover:border-emerald-400', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  metalloid: { label: 'Metalloid', bg: 'bg-teal-950/45', border: 'border-teal-500/40 hover:border-teal-400', text: 'text-teal-300', dot: 'bg-teal-400' },
  nonmetal: { label: 'Reactive Nonmetal', bg: 'bg-fuchsia-950/45', border: 'border-fuchsia-500/40 hover:border-fuchsia-400', text: 'text-fuchsia-300', dot: 'bg-fuchsia-400' },
  noble_gas: { label: 'Noble Gas', bg: 'bg-indigo-950/45', border: 'border-indigo-500/40 hover:border-indigo-400', text: 'text-indigo-300', dot: 'bg-indigo-400' },
  lanthanoid: { label: 'Lanthanoid (4f)', bg: 'bg-pink-950/45', border: 'border-pink-500/40 hover:border-pink-400', text: 'text-pink-300', dot: 'bg-pink-400' },
  actinoid: { label: 'Actinoid (5f)', bg: 'bg-rose-950/45', border: 'border-rose-500/40 hover:border-rose-400', text: 'text-rose-300', dot: 'bg-rose-400' }
};

const BLOCK_COLORS: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  s: { label: 's-Block (l=0)', bg: 'bg-amber-950/45', border: 'border-amber-500/50', text: 'text-amber-300', dot: 'bg-amber-400' },
  p: { label: 'p-Block (l=1)', bg: 'bg-emerald-950/45', border: 'border-emerald-500/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  d: { label: 'd-Block (l=2)', bg: 'bg-blue-950/45', border: 'border-blue-500/50', text: 'text-blue-300', dot: 'bg-blue-400' },
  f: { label: 'f-Block (l=3)', bg: 'bg-purple-950/45', border: 'border-purple-500/50', text: 'text-purple-300', dot: 'bg-purple-400' }
};

const STRUCTURE_COLORS: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  FCC: { label: 'FCC (Fm-3m)', bg: 'bg-blue-950/45', border: 'border-blue-500/50', text: 'text-blue-300', dot: 'bg-blue-400' },
  BCC: { label: 'BCC (Im-3m)', bg: 'bg-purple-950/45', border: 'border-purple-500/50', text: 'text-purple-300', dot: 'bg-purple-400' },
  HCP: { label: 'HCP (P6₃/mmc)', bg: 'bg-emerald-950/45', border: 'border-emerald-500/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  Diamond: { label: 'Diamond (Fd-3m)', bg: 'bg-amber-950/45', border: 'border-amber-500/50', text: 'text-amber-300', dot: 'bg-amber-400' },
  Hexagonal: { label: 'Hexagonal', bg: 'bg-teal-950/45', border: 'border-teal-500/50', text: 'text-teal-300', dot: 'bg-teal-400' },
  Orthorhombic: { label: 'Orthorhombic', bg: 'bg-orange-950/45', border: 'border-orange-500/50', text: 'text-orange-300', dot: 'bg-orange-400' },
  Rhombohedral: { label: 'Rhombohedral', bg: 'bg-cyan-950/45', border: 'border-cyan-500/50', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  Tetragonal: { label: 'Tetragonal', bg: 'bg-indigo-950/45', border: 'border-indigo-500/50', text: 'text-indigo-300', dot: 'bg-indigo-400' },
  Monoclinic: { label: 'Monoclinic', bg: 'bg-rose-950/45', border: 'border-rose-500/50', text: 'text-rose-300', dot: 'bg-rose-400' },
  Cubic: { label: 'Simple/Prim. Cubic', bg: 'bg-sky-950/45', border: 'border-sky-500/50', text: 'text-sky-300', dot: 'bg-sky-400' }
};

const GROUP_ROMAN: Record<number, string> = {
  1: 'IA', 2: 'IIA', 3: 'IIIB', 4: 'IVB', 5: 'VB', 6: 'VIB', 7: 'VIIB', 8: 'VIIIB',
  9: 'VIIIB', 10: 'VIIIB', 11: 'IB', 12: 'IIB', 13: 'IIIA', 14: 'IVA', 15: 'VA', 16: 'VIA', 17: 'VIIA', 18: 'VIIIA'
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
  matchedElementNumbers,
  activeCategoryFilter = 'all',
  onToggleCategoryFilter,
  activeStructureFilter = 'all',
  onToggleStructureFilter,
  activeBlockFilter = 'all',
  onToggleBlockFilter
}) => {
  const [hoveredElement, setHoveredElement] = useState<CrystalElement | null>(null);
  const [highlightedGroup, setHighlightedGroup] = useState<number | null>(null);
  const [highlightedPeriod, setHighlightedPeriod] = useState<number | null>(null);

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

  const activeOrHovered = hoveredElement || elements.find(e => e.number === selectedElement) || elements[13];

  const renderCell = (x: number, y: number) => {
    // Check for Lanthanide placeholder (x: 3, y: 6)
    if (x === 3 && y === 6) {
      const isSeriesActive = selectedElement >= 57 && selectedElement <= 71;
      return (
        <button
          key="placeholder-lanthanides"
          type="button"
          onClick={() => onSelectElement(57)}
          className={`aspect-square p-1 rounded-lg border flex flex-col items-center justify-center transition-all duration-200 bg-pink-950/25 text-pink-300 border-pink-800/40 hover:bg-pink-900/35 cursor-pointer ${
            isSeriesActive ? 'ring-2 ring-pink-500 shadow-md shadow-pink-500/30' : ''
          }`}
          title="Lanthanoid series (Z = 57–71, La to Lu)"
        >
          <span className="text-[7px] font-mono text-slate-400 font-bold tabular-nums">57-71</span>
          <span className="text-[9px] font-black tracking-tight">La-Lu</span>
          <span className="text-[5.5px] font-mono text-pink-400/90 uppercase">4f Series</span>
        </button>
      );
    }

    // Check for Actinide placeholder (x: 3, y: 7)
    if (x === 3 && y === 7) {
      const isSeriesActive = selectedElement >= 89 && selectedElement <= 103;
      return (
        <button
          key="placeholder-actinides"
          type="button"
          onClick={() => onSelectElement(89)}
          className={`aspect-square p-1 rounded-lg border flex flex-col items-center justify-center transition-all duration-200 bg-rose-950/25 text-rose-300 border-rose-800/40 hover:bg-rose-900/35 cursor-pointer ${
            isSeriesActive ? 'ring-2 ring-rose-500 shadow-md shadow-rose-500/30' : ''
          }`}
          title="Actinoid series (Z = 89–103, Ac to Lr)"
        >
          <span className="text-[7px] font-mono text-slate-400 font-bold tabular-nums">89-103</span>
          <span className="text-[9px] font-black tracking-tight">Ac-Lr</span>
          <span className="text-[5.5px] font-mono text-rose-400/90 uppercase">5f Series</span>
        </button>
      );
    }

    const el = elementGridMap.get(`${x}_${y}`);
    if (!el) {
      return <div key={`empty-${x}-${y}`} className="aspect-square opacity-0 pointer-events-none" />;
    }

    const isSelected = selectedElement === el.number;
    const isGroupOrPeriodMatch =
      (highlightedGroup === null || el.group === highlightedGroup) &&
      (highlightedPeriod === null || el.period === highlightedPeriod);
    const isMatched = matchedElementNumbers.has(el.number) && isGroupOrPeriodMatch;
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
        backgroundColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.24)')}`,
        borderColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.68)')}`
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

    // State indicator square
    let stateDotColor = 'bg-slate-400';
    if (stateAtTemp === 'liquid') stateDotColor = 'bg-blue-500';
    if (stateAtTemp === 'gas') stateDotColor = 'bg-rose-500';

    const opacityClass = isMatched ? 'opacity-100' : 'opacity-20 grayscale hover:grayscale-0 hover:opacity-85';
    const selectionRing = isSelected
      ? 'ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/35 scale-[1.06] z-20 font-black'
      : '';

    // Value to show in the lower right corner
    let subValueText = `${el.a.toFixed(2)}Å`;
    if (heatmapMode !== 'none' && heatmapConfig) {
      subValueText = heatmapConfig.format(heatmapConfig.getValue(el)).replace(/ /g, '');
    } else if (colorMode === 'structure') {
      subValueText = el.crystalStructure;
    } else if (colorMode === 'state') {
      subValueText = stateAtTemp.toUpperCase();
    } else if (colorMode === 'block') {
      subValueText = `${el.block}-blk`;
    }

    return (
      <button
        key={`el-${el.number}`}
        type="button"
        onClick={() => onSelectElement(el.number)}
        onMouseEnter={() => setHoveredElement(el)}
        onMouseLeave={() => setHoveredElement(null)}
        style={customInlineStyle}
        className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-150 relative text-left group select-none cursor-pointer ${cellBg} ${cellBorder} ${opacityClass} ${selectionRing}`}
      >
        {/* Top Row: Z & Crystal/State Indicator */}
        <div className="flex items-center justify-between w-full leading-none">
          <span className="text-[7.5px] font-mono text-slate-400 font-bold tabular-nums">
            {el.number}
          </span>
          <span className={`w-1.5 h-1.5 rounded-[2px] ${stateDotColor}`} title={`Phase at ${temperature}°C: ${stateAtTemp}`} />
        </div>

        {/* Chemical Symbol */}
        <div className={`text-sm sm:text-base font-black tracking-tight text-center leading-none my-auto ${symbolColor}`}>
          {el.symbol}
        </div>

        {/* Micro footer: Name & Lattice / Property */}
        <div className="flex justify-between items-end w-full leading-none overflow-hidden gap-0.5">
          <span className="text-[5.5px] text-slate-400 truncate max-w-[52%] font-medium">
            {el.name}
          </span>
          <span className="text-[5.5px] font-mono font-bold text-slate-300 ml-auto truncate tabular-nums">
            {subValueText}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Interactive Color Legend Strip (adapts to active ColorMode) */}
      {heatmapMode === 'none' && (
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800/80 text-[10px] font-mono">
          <span className="text-slate-500 font-bold uppercase text-[9px] mr-1">
            {colorMode === 'structure' ? 'Bravais Legend:' : colorMode === 'block' ? 'Subshell Legend:' : 'Series Legend:'}
          </span>

          {colorMode === 'structure' &&
            Object.entries(STRUCTURE_COLORS).map(([key, cfg]) => {
              const count = elements.filter(e => e.crystalStructure === key).length;
              const isActive = activeStructureFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleStructureFilter && onToggleStructureFilter(isActive ? 'all' : key)}
                  className={`px-2 py-0.5 rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-900/60 border-sky-400 text-white font-bold'
                      : `${cfg.bg} border-slate-800 ${cfg.text} hover:border-slate-600`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-[2px] ${cfg.dot}`} />
                  <span>{key}</span>
                  <span className="text-[8.5px] opacity-70 tabular-nums">({count})</span>
                </button>
              );
            })}

          {colorMode === 'category' &&
            Object.entries(CATEGORY_COLORS).map(([key, cfg]) => {
              const count = elements.filter(e => e.category === key).length;
              const isActive = activeCategoryFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleCategoryFilter && onToggleCategoryFilter(isActive ? 'all' : key)}
                  className={`px-2 py-0.5 rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-900/60 border-indigo-400 text-white font-bold'
                      : `${cfg.bg} border-slate-800 ${cfg.text} hover:border-slate-600`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-[2px] ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                  <span className="text-[8.5px] opacity-70 tabular-nums">({count})</span>
                </button>
              );
            })}

          {colorMode === 'block' &&
            Object.entries(BLOCK_COLORS).map(([key, cfg]) => {
              const count = elements.filter(e => e.block === key).length;
              const isActive = activeBlockFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleBlockFilter && onToggleBlockFilter(isActive ? 'all' : key)}
                  className={`px-2.5 py-0.5 rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-900/60 border-indigo-400 text-white font-bold'
                      : `${cfg.bg} border-slate-800 ${cfg.text} hover:border-slate-600`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-[2px] ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                  <span className="text-[8.5px] opacity-70 tabular-nums">({count})</span>
                </button>
              );
            })}

          {(highlightedGroup !== null || highlightedPeriod !== null) && (
            <button
              type="button"
              onClick={() => {
                setHighlightedGroup(null);
                setHighlightedPeriod(null);
              }}
              className="ml-auto px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[9px] font-bold cursor-pointer"
            >
              Clear Axis Highlight
            </button>
          )}
        </div>
      )}

      {/* 18-Column IUPAC Standard Table Grid with Group & Period Coordinate Axes */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[960px] space-y-1.5">
          {/* Top IUPAC Group Header Row (1 to 18) */}
          <div
            className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: '28px repeat(18, minmax(0, 1fr))' }}
          >
            <div className="text-[8px] font-mono font-bold text-slate-600 text-center uppercase">
              P\G
            </div>
            {Array.from({ length: 18 }, (_, i) => {
              const g = i + 1;
              const isHighlighted = highlightedGroup === g;
              return (
                <button
                  key={`grp-${g}`}
                  type="button"
                  onClick={() => setHighlightedGroup(isHighlighted ? null : g)}
                  className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={`Toggle highlight for Group ${g} (${GROUP_ROMAN[g]})`}
                >
                  <div className="text-[9px] font-mono font-bold leading-none tabular-nums">{g}</div>
                  <div className="text-[6.5px] font-mono opacity-70 leading-none mt-0.5">{GROUP_ROMAN[g]}</div>
                </button>
              );
            })}
          </div>

          {/* Main 7 Periods (Rows 1 to 7) */}
          {Array.from({ length: 7 }, (_, rowIndex) => {
            const y = rowIndex + 1;
            const isPeriodHighlighted = highlightedPeriod === y;
            return (
              <div
                key={`period-row-${y}`}
                className="grid gap-1.5 items-center"
                style={{ gridTemplateColumns: '28px repeat(18, minmax(0, 1fr))' }}
              >
                {/* Period Coordinate Button */}
                <button
                  type="button"
                  onClick={() => setHighlightedPeriod(isPeriodHighlighted ? null : y)}
                  className={`h-full rounded border flex flex-col items-center justify-center font-mono transition-colors cursor-pointer ${
                    isPeriodHighlighted
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={`Toggle highlight for Period ${y} (n = ${y})`}
                >
                  <span className="text-[9px] font-bold leading-none">{y}</span>
                  <span className="text-[6.5px] opacity-60 leading-none mt-0.5">n={y}</span>
                </button>

                {Array.from({ length: 18 }, (_, colIndex) => {
                  const x = colIndex + 1;
                  return renderCell(x, y);
                })}
              </div>
            );
          })}

          {/* Separation Gap before f-block series */}
          <div
            className="grid gap-1.5 pt-2 pb-0.5 items-center"
            style={{ gridTemplateColumns: '28px repeat(18, minmax(0, 1fr))' }}
          >
            <div />
            <div style={{ gridColumn: 'span 3' }} className="border-b border-dashed border-slate-800" />
            <div
              style={{ gridColumn: 'span 15' }}
              className="border-b border-dashed border-slate-800 flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 pb-0.5"
            >
              <span>Inner Transition Elements (f-block Lanthanoids & Actinoids)</span>
              <span>Z = 57–71 & Z = 89–103</span>
            </div>
          </div>

          {/* Lanthanide Series (Row 8, x = 4 to 18) */}
          <div
            className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: '28px repeat(18, minmax(0, 1fr))' }}
          >
            <div className="text-[8px] font-mono font-bold text-pink-400 text-center">6f</div>
            <div style={{ gridColumn: 'span 3' }} className="flex items-center justify-end pr-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-pink-300 bg-pink-950/40 px-2 py-1 rounded border border-pink-800/50">
                Lanthanoids (57–71)
              </span>
            </div>
            {Array.from({ length: 15 }, (_, i) => renderCell(i + 4, 8))}
          </div>

          {/* Actinide Series (Row 9, x = 4 to 18) */}
          <div
            className="grid gap-1.5 items-center"
            style={{ gridTemplateColumns: '28px repeat(18, minmax(0, 1fr))' }}
          >
            <div className="text-[8px] font-mono font-bold text-rose-400 text-center">7f</div>
            <div style={{ gridColumn: 'span 3' }} className="flex items-center justify-end pr-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-800/50">
                Actinoids (89–103)
              </span>
            </div>
            {Array.from({ length: 15 }, (_, i) => renderCell(i + 4, 9))}
          </div>
        </div>
      </div>

      {/* Persistent Crystallographic Telemetry Dock for Hovered or Active Element */}
      {activeOrHovered && (
        <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-inner tabular-nums">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex flex-col items-center justify-center font-black text-indigo-300 shrink-0">
              <span className="text-[8px] text-slate-400 leading-none">{activeOrHovered.number}</span>
              <span className="text-base leading-none mt-0.5">{activeOrHovered.symbol}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeOrHovered.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">({activeOrHovered.weight.toFixed(4)} u)</span>
                {hoveredElement && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Hover Preview
                  </span>
                )}
              </div>
              <div className="text-[10px] text-indigo-300 font-semibold">
                {activeOrHovered.category.replace('_', ' ').toUpperCase()} • {activeOrHovered.crystalStructure} ({activeOrHovered.spaceGroup})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 text-[9px] uppercase block">Lattice Constants</span>
              <span className="font-bold text-white">
                a={activeOrHovered.a.toFixed(3)}Å{activeOrHovered.c && Math.abs(activeOrHovered.c - activeOrHovered.a) > 0.01 ? `, c=${activeOrHovered.c.toFixed(3)}Å` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] uppercase block">X-Ray Density</span>
              <span className="font-bold text-emerald-400">{activeOrHovered.density.toFixed(3)} g/cm³</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] uppercase block">Atomic Radius</span>
              <span className="font-bold text-amber-300">{activeOrHovered.atomicRadius} pm</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] uppercase block">Melting / Boiling</span>
              <span className="font-bold text-white">{activeOrHovered.meltingPoint}°C / {activeOrHovered.boilingPoint ?? 'N/A'}°C</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px] uppercase block">Ground Config</span>
              <span className="font-bold text-cyan-400">{activeOrHovered.electronConfig}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
