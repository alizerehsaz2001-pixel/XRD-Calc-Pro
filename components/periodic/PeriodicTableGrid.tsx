import React, { useState, useEffect, useCallback } from 'react';
import { Pin, PinOff, ArrowLeftRight, Sparkles, Compass } from 'lucide-react';
import { CrystalElement, ColorMode, HeatmapMode } from './types';
import { HEATMAP_CONFIGS, getHeatmapColor, computeUnitCellVolume } from './PeriodicHeatmapLegend';
import {
  MicroLatticeGlyph,
  PhaseStateGlyph,
  ElectronShellRingGraphic,
  LiveMiniXrdStickPattern
} from './PeriodicGraphics';

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

type TileViewMode = 'crystallographic' | 'diffraction' | 'electronic';

const CATEGORY_COLORS: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string; accent: string }
> = {
  alkali: {
    label: 'Alkali Metal',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/35 hover:border-rose-400',
    text: 'text-rose-200',
    dot: 'bg-rose-400',
    accent: 'bg-rose-500'
  },
  alkaline_earth: {
    label: 'Alkaline Earth',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/35 hover:border-amber-400',
    text: 'text-amber-200',
    dot: 'bg-amber-400',
    accent: 'bg-amber-500'
  },
  transition_metal: {
    label: 'Transition Metal',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/35 hover:border-sky-400',
    text: 'text-sky-200',
    dot: 'bg-sky-400',
    accent: 'bg-sky-500'
  },
  post_transition: {
    label: 'Post-Transition',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/35 hover:border-emerald-400',
    text: 'text-emerald-200',
    dot: 'bg-emerald-400',
    accent: 'bg-emerald-500'
  },
  metalloid: {
    label: 'Metalloid',
    bg: 'bg-teal-950/45',
    border: 'border-teal-500/40 hover:border-teal-400',
    text: 'text-teal-200',
    dot: 'bg-teal-400',
    accent: 'bg-teal-500'
  },
  nonmetal: {
    label: 'Reactive Nonmetal',
    bg: 'bg-indigo-950/45',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    text: 'text-indigo-200',
    dot: 'bg-indigo-400',
    accent: 'bg-indigo-500'
  },
  noble_gas: {
    label: 'Noble Gas',
    bg: 'bg-violet-950/40',
    border: 'border-violet-500/35 hover:border-violet-400',
    text: 'text-violet-200',
    dot: 'bg-violet-400',
    accent: 'bg-violet-500'
  },
  lanthanoid: {
    label: 'Lanthanoid (4f)',
    bg: 'bg-fuchsia-950/40',
    border: 'border-fuchsia-500/35 hover:border-fuchsia-400',
    text: 'text-fuchsia-200',
    dot: 'bg-fuchsia-400',
    accent: 'bg-fuchsia-500'
  },
  actinoid: {
    label: 'Actinoid (5f)',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/35 hover:border-orange-400',
    text: 'text-orange-200',
    dot: 'bg-orange-400',
    accent: 'bg-orange-500'
  }
};

const BLOCK_COLORS: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string; accent: string }
> = {
  s: {
    label: 's-Block (l=0)',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/45 hover:border-amber-400',
    text: 'text-amber-200',
    dot: 'bg-amber-400',
    accent: 'bg-amber-500'
  },
  p: {
    label: 'p-Block (l=1)',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/45 hover:border-emerald-400',
    text: 'text-emerald-200',
    dot: 'bg-emerald-400',
    accent: 'bg-emerald-500'
  },
  d: {
    label: 'd-Block (l=2)',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/45 hover:border-sky-400',
    text: 'text-sky-200',
    dot: 'bg-sky-400',
    accent: 'bg-sky-500'
  },
  f: {
    label: 'f-Block (l=3)',
    bg: 'bg-fuchsia-950/40',
    border: 'border-fuchsia-500/45 hover:border-fuchsia-400',
    text: 'text-fuchsia-200',
    dot: 'bg-fuchsia-400',
    accent: 'bg-fuchsia-500'
  }
};

const STRUCTURE_COLORS: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string; accent: string }
> = {
  FCC: {
    label: 'FCC (Fm-3m)',
    bg: 'bg-sky-950/45',
    border: 'border-sky-500/45 hover:border-sky-400',
    text: 'text-sky-200',
    dot: 'bg-sky-400',
    accent: 'bg-sky-500'
  },
  BCC: {
    label: 'BCC (Im-3m)',
    bg: 'bg-violet-950/45',
    border: 'border-violet-500/45 hover:border-violet-400',
    text: 'text-violet-200',
    dot: 'bg-violet-400',
    accent: 'bg-violet-500'
  },
  HCP: {
    label: 'HCP (P6₃/mmc)',
    bg: 'bg-emerald-950/45',
    border: 'border-emerald-500/45 hover:border-emerald-400',
    text: 'text-emerald-200',
    dot: 'bg-emerald-400',
    accent: 'bg-emerald-500'
  },
  Diamond: {
    label: 'Diamond (Fd-3m)',
    bg: 'bg-amber-950/45',
    border: 'border-amber-500/45 hover:border-amber-400',
    text: 'text-amber-200',
    dot: 'bg-amber-400',
    accent: 'bg-amber-500'
  },
  Hexagonal: {
    label: 'Hexagonal',
    bg: 'bg-teal-950/45',
    border: 'border-teal-500/45 hover:border-teal-400',
    text: 'text-teal-200',
    dot: 'bg-teal-400',
    accent: 'bg-teal-500'
  },
  Orthorhombic: {
    label: 'Orthorhombic',
    bg: 'bg-orange-950/45',
    border: 'border-orange-500/45 hover:border-orange-400',
    text: 'text-orange-200',
    dot: 'bg-orange-400',
    accent: 'bg-orange-500'
  },
  Rhombohedral: {
    label: 'Rhombohedral',
    bg: 'bg-cyan-950/45',
    border: 'border-cyan-500/45 hover:border-cyan-400',
    text: 'text-cyan-200',
    dot: 'bg-cyan-400',
    accent: 'bg-cyan-500'
  },
  Tetragonal: {
    label: 'Tetragonal',
    bg: 'bg-indigo-950/45',
    border: 'border-indigo-500/45 hover:border-indigo-400',
    text: 'text-indigo-200',
    dot: 'bg-indigo-400',
    accent: 'bg-indigo-500'
  },
  Monoclinic: {
    label: 'Monoclinic',
    bg: 'bg-rose-950/45',
    border: 'border-rose-500/45 hover:border-rose-400',
    text: 'text-rose-200',
    dot: 'bg-rose-400',
    accent: 'bg-rose-500'
  },
  Cubic: {
    label: 'Simple Cubic',
    bg: 'bg-blue-950/45',
    border: 'border-blue-500/45 hover:border-blue-400',
    text: 'text-blue-200',
    dot: 'bg-blue-400',
    accent: 'bg-blue-500'
  }
};

const GROUP_ROMAN: Record<number, string> = {
  1: 'IA',
  2: 'IIA',
  3: 'IIIB',
  4: 'IVB',
  5: 'VB',
  6: 'VIB',
  7: 'VIIB',
  8: 'VIIIB',
  9: 'VIIIB',
  10: 'VIIIB',
  11: 'IB',
  12: 'IIB',
  13: 'IIIA',
  14: 'IVA',
  15: 'VA',
  16: 'VIA',
  17: 'VIIA',
  18: 'VIIIA'
};

export function getPhysicalStateAtTemp(
  meltingPoint: number,
  boilingPoint: number | undefined,
  currentTempC: number
): 'solid' | 'liquid' | 'gas' {
  const bp = boilingPoint ?? meltingPoint + 1500;
  if (currentTempC < meltingPoint) return 'solid';
  if (currentTempC >= meltingPoint && currentTempC < bp) return 'liquid';
  return 'gas';
}

function getShortValenceConfig(config: string): string {
  if (!config) return '';
  const cleaned = config.replace(/\[[A-Za-z]+\]\s*/, '').trim();
  return cleaned || config;
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
  const [tileViewMode, setTileViewMode] = useState<TileViewMode>('crystallographic');
  const [pinnedElementZ, setPinnedElementZ] = useState<number | null>(null);

  // Pre-calculate heatmap min/max
  const heatmapConfig = HEATMAP_CONFIGS[heatmapMode];
  let heatmapMin = 0;
  let heatmapMax = 100;
  if (heatmapConfig) {
    const vals = elements
      .map(e => heatmapConfig.getValue(e))
      .filter(v => v !== undefined && !isNaN(v) && v !== 0);
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

  const selectedElObj = elements.find(e => e.number === selectedElement) || elements[13];
  const activeOrHovered = hoveredElement || selectedElObj;
  const pinnedElement = pinnedElementZ ? elements.find(e => e.number === pinnedElementZ) || null : null;

  // Keyboard navigation across the periodic table when not typing in an input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelectElement(selectedElement < 118 ? selectedElement + 1 : 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelectElement(selectedElement > 1 ? selectedElement - 1 : 118);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const cur = elements.find(el => el.number === selectedElement);
        if (!cur) return;
        const deltaY = e.key === 'ArrowDown' ? 1 : -1;
        const target = elements.find(el => el.gridX === cur.gridX && el.gridY === cur.gridY + deltaY);
        if (target) {
          e.preventDefault();
          onSelectElement(target.number);
        }
      }
    },
    [selectedElement, elements, onSelectElement]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderCell = (x: number, y: number, gridPositionStyle?: React.CSSProperties) => {
    // Check for Lanthanide placeholder (x: 3, y: 6)
    if (x === 3 && y === 6) {
      const isSeriesActive = selectedElement >= 57 && selectedElement <= 71;
      return (
        <button
          key="placeholder-lanthanides"
          type="button"
          style={gridPositionStyle}
          onClick={() => onSelectElement(57)}
          className={`min-h-[48px] sm:min-h-[54px] p-1 rounded-lg border flex flex-col items-center justify-between transition-all duration-150 bg-fuchsia-950/35 text-fuchsia-200 border-fuchsia-500/40 hover:border-fuchsia-400 hover:bg-fuchsia-900/40 cursor-pointer relative overflow-hidden ${
            isSeriesActive ? 'ring-2 ring-fuchsia-400 shadow-sm' : ''
          }`}
          title="Jump to Lanthanoid series (Z = 57–71, La to Lu)"
        >
          <div className="w-full flex items-center justify-between text-[7px] font-mono text-fuchsia-300 font-bold tabular-nums leading-none">
            <span>57–71</span>
            <span>4f</span>
          </div>
          <span className="text-[11px] font-black tracking-tight text-white leading-none my-auto">
            La–Lu
          </span>
          <div className="w-full text-center text-[6.5px] font-mono text-fuchsia-300/90 uppercase leading-none">
            Row 6f ▾
          </div>
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
          style={gridPositionStyle}
          onClick={() => onSelectElement(89)}
          className={`min-h-[48px] sm:min-h-[54px] p-1 rounded-lg border flex flex-col items-center justify-between transition-all duration-150 bg-orange-950/35 text-orange-200 border-orange-500/40 hover:border-orange-400 hover:bg-orange-900/40 cursor-pointer relative overflow-hidden ${
            isSeriesActive ? 'ring-2 ring-orange-400 shadow-sm' : ''
          }`}
          title="Jump to Actinoid series (Z = 89–103, Ac to Lr)"
        >
          <div className="w-full flex items-center justify-between text-[7px] font-mono text-orange-300 font-bold tabular-nums leading-none">
            <span>89–103</span>
            <span>5f</span>
          </div>
          <span className="text-[11px] font-black tracking-tight text-white leading-none my-auto">
            Ac–Lr
          </span>
          <div className="w-full text-center text-[6.5px] font-mono text-orange-300/90 uppercase leading-none">
            Row 7f ▾
          </div>
        </button>
      );
    }

    const el = elementGridMap.get(`${x}_${y}`);
    if (!el) {
      return (
        <div
          key={`empty-${x}-${y}`}
          style={gridPositionStyle}
          className="min-h-[48px] sm:min-h-[54px] opacity-0 pointer-events-none"
        />
      );
    }

    const isSelected = selectedElement === el.number;
    const isPinned = pinnedElementZ === el.number;
    const isGroupOrPeriodMatch =
      (highlightedGroup === null || el.group === highlightedGroup) &&
      (highlightedPeriod === null || el.period === highlightedPeriod);
    const isMatched = matchedElementNumbers.has(el.number) && isGroupOrPeriodMatch;
    const stateAtTemp = getPhysicalStateAtTemp(el.meltingPoint, el.boilingPoint, temperature);

    // Compute styling depending on color mode
    let cellBg = 'bg-[#0b101d]';
    let cellBorder = 'border-slate-800 hover:border-slate-600';
    let symbolColor = 'text-slate-100';
    let topAccentClass = 'bg-slate-600';
    let customInlineStyle: React.CSSProperties | undefined = gridPositionStyle
      ? { ...gridPositionStyle }
      : undefined;
    let barFillFraction = 0;
    let barFillColor = '#06b6d4';

    if (heatmapMode !== 'none' && heatmapConfig) {
      const val = heatmapConfig.getValue(el);
      const color = getHeatmapColor(val, heatmapMin, heatmapMax);
      barFillFraction = Math.max(
        0.06,
        Math.min(1, (val - heatmapMin) / (heatmapMax - heatmapMin || 1))
      );
      barFillColor = color;
      customInlineStyle = {
        ...gridPositionStyle,
        backgroundColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.24)')}`,
        borderColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.75)')}`
      };
      symbolColor = 'text-white';
    } else if (colorMode === 'category') {
      const col = CATEGORY_COLORS[el.category] || {
        bg: 'bg-slate-900/40',
        border: 'border-slate-700',
        text: 'text-slate-200',
        accent: 'bg-slate-500'
      };
      cellBg = col.bg;
      cellBorder = col.border;
      symbolColor = col.text;
      topAccentClass = col.accent;
    } else if (colorMode === 'block') {
      const col = BLOCK_COLORS[el.block] || {
        bg: 'bg-slate-900/40',
        border: 'border-slate-700',
        text: 'text-slate-200',
        accent: 'bg-slate-500'
      };
      cellBg = col.bg;
      cellBorder = col.border;
      symbolColor = col.text;
      topAccentClass = col.accent;
    } else if (colorMode === 'structure') {
      const col = STRUCTURE_COLORS[el.crystalStructure] || {
        bg: 'bg-slate-900/40',
        border: 'border-slate-700',
        text: 'text-slate-200',
        accent: 'bg-slate-500'
      };
      cellBg = col.bg;
      cellBorder = col.border;
      symbolColor = col.text;
      topAccentClass = col.accent;
    } else if (colorMode === 'state') {
      if (stateAtTemp === 'solid') {
        cellBg = 'bg-emerald-950/35';
        cellBorder = 'border-emerald-500/40 hover:border-emerald-400';
        symbolColor = 'text-emerald-200';
        topAccentClass = 'bg-emerald-400';
      } else if (stateAtTemp === 'liquid') {
        cellBg = 'bg-sky-950/50';
        cellBorder = 'border-sky-500/60 hover:border-sky-400';
        symbolColor = 'text-sky-200';
        topAccentClass = 'bg-sky-400';
      } else {
        cellBg = 'bg-rose-950/50';
        cellBorder = 'border-rose-500/60 hover:border-rose-400';
        symbolColor = 'text-rose-200';
        topAccentClass = 'bg-rose-400';
      }
    }

    const opacityClass = isMatched
      ? 'opacity-100'
      : 'opacity-20 grayscale hover:grayscale-0 hover:opacity-85';

    const selectionRing = isSelected
      ? 'ring-2 ring-cyan-400 bg-cyan-950/55 shadow-[0_0_16px_rgba(34,211,238,0.4)] scale-[1.06] z-20'
      : isPinned
      ? 'ring-2 ring-amber-400/90 z-10'
      : 'hover:scale-[1.04] hover:z-10';

    // Determine primary & secondary micro-labels based on tileViewMode & active color/heatmap mode
    let leftSubText = el.name;
    let rightSubText = `${el.a.toFixed(2)}Å`;

    if (heatmapMode !== 'none' && heatmapConfig) {
      leftSubText = el.symbol;
      rightSubText = heatmapConfig.format(heatmapConfig.getValue(el)).replace(/ /g, '');
    } else if (tileViewMode === 'diffraction') {
      leftSubText = el.spaceGroup.split(' ')[0];
      rightSubText = `${el.density.toFixed(1)}`;
    } else if (tileViewMode === 'electronic') {
      leftSubText = getShortValenceConfig(el.electronConfig);
      rightSubText = el.electronegativity > 0 ? `χ${el.electronegativity.toFixed(1)}` : '—';
    } else {
      if (colorMode === 'structure') {
        rightSubText = el.crystalStructure;
      } else if (colorMode === 'state') {
        rightSubText = stateAtTemp.toUpperCase();
      } else if (colorMode === 'block') {
        rightSubText = `${el.block}-blk`;
      }
    }

    return (
      <button
        key={`el-${el.number}`}
        type="button"
        onClick={() => onSelectElement(el.number)}
        onMouseEnter={() => setHoveredElement(el)}
        onMouseLeave={() => setHoveredElement(null)}
        style={customInlineStyle}
        className={`min-h-[48px] sm:min-h-[54px] p-1 rounded-lg border flex flex-col justify-between transition-all duration-150 relative text-left group select-none cursor-pointer overflow-hidden ${cellBg} ${cellBorder} ${opacityClass} ${selectionRing}`}
      >
        {/* Top Calibrated Spectral Bar */}
        {heatmapMode === 'none' && (
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] opacity-80 group-hover:opacity-100 transition-opacity ${
              isSelected ? 'bg-cyan-400 h-[2.5px]' : isPinned ? 'bg-amber-400 h-[2.5px]' : topAccentClass
            }`}
          />
        )}

        {/* Row 1: Atomic Number Z + Micro Lattice / Phase Glyph */}
        <div className="flex items-center justify-between w-full leading-none pt-0.5">
          <span
            className={`text-[8px] font-mono font-bold tabular-nums ${
              isSelected ? 'text-cyan-300' : 'text-slate-300/95'
            }`}
          >
            {el.number}
          </span>
          <div className="flex items-center gap-0.5">
            {isPinned && <Pin className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
            {colorMode === 'structure' || tileViewMode === 'diffraction' ? (
              <MicroLatticeGlyph structure={el.crystalStructure} size={9} className={symbolColor} />
            ) : (
              <PhaseStateGlyph state={stateAtTemp} size={7.5} />
            )}
          </div>
        </div>

        {/* Row 2: Prominent Chemical Symbol */}
        <div
          className={`text-[15px] sm:text-base font-black tracking-tight text-center leading-none my-auto ${
            isSelected ? 'text-white' : symbolColor
          }`}
        >
          {el.symbol}
        </div>

        {/* Row 3: High-Legibility Micro Footer */}
        <div className="flex justify-between items-baseline w-full leading-none overflow-hidden gap-0.5 pt-0.5">
          <span className="text-[6.5px] text-slate-300/85 truncate max-w-[54%] font-medium">
            {leftSubText}
          </span>
          <span className="text-[6.5px] font-mono font-bold text-slate-100 ml-auto truncate tabular-nums">
            {rightSubText}
          </span>
        </div>

        {/* Heatmap Magnitude Progress Bar */}
        {heatmapMode !== 'none' && (
          <div className="w-full h-[2.5px] bg-slate-950/90 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(barFillFraction * 100)}%`,
                backgroundColor: barFillColor
              }}
            />
          </div>
        )}
      </button>
    );
  };

  const activeStateAtTemp = activeOrHovered
    ? getPhysicalStateAtTemp(activeOrHovered.meltingPoint, activeOrHovered.boilingPoint, temperature)
    : 'solid';

  const activeVolume = activeOrHovered ? computeUnitCellVolume(activeOrHovered) : 0;

  return (
    <div className="space-y-3">
      {/* Top Interactive Legend & Tile Telemetry Mode Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 text-[10px] font-mono">
        {/* Left: Interactive Color Key */}
        <div className="flex flex-wrap items-center gap-1.5">
          {heatmapMode === 'none' && (
            <>
              <span className="text-slate-500 font-bold uppercase text-[9px] mr-0.5">
                {colorMode === 'structure'
                  ? 'Bravais Key:'
                  : colorMode === 'block'
                  ? 'Subshell Key:'
                  : colorMode === 'state'
                  ? 'Phase Key:'
                  : 'Series Key:'}
              </span>

              {colorMode === 'structure' &&
                Object.entries(STRUCTURE_COLORS).map(([key, cfg]) => {
                  const count = elements.filter(e => e.crystalStructure === key).length;
                  const isActive = activeStructureFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        onToggleStructureFilter &&
                        onToggleStructureFilter(isActive ? 'all' : key)
                      }
                      className={`px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-sky-900/80 border-sky-400 text-white font-bold shadow-sm'
                          : `${cfg.bg} border-slate-800 ${cfg.text} hover:border-slate-600`
                      }`}
                    >
                      <MicroLatticeGlyph structure={key} size={11} />
                      <span>{key}</span>
                      <span className="text-[8.5px] opacity-75 tabular-nums">({count})</span>
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
                      onClick={() =>
                        onToggleCategoryFilter &&
                        onToggleCategoryFilter(isActive ? 'all' : key)
                      }
                      className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-indigo-900/80 border-indigo-400 text-white font-bold shadow-sm'
                          : `${cfg.bg} border-slate-800 ${cfg.text} hover:border-slate-600`
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-[2px] ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                      <span className="text-[8.5px] opacity-75 tabular-nums">({count})</span>
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
                      onClick={() =>
                        onToggleBlockFilter && onToggleBlockFilter(isActive ? 'all' : key)
                      }
                      className={`px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-indigo-900/80 border-indigo-400 text-white font-bold shadow-sm'
                          : `${cfg.bg} border-slate-800 ${cfg.text} hover:border-slate-600`
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-[2px] ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                      <span className="text-[8.5px] opacity-75 tabular-nums">({count})</span>
                    </button>
                  );
                })}

              {colorMode === 'state' && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                    <PhaseStateGlyph state="solid" size={9} /> Solid Crystalline
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-500/30 text-sky-300">
                    <PhaseStateGlyph state="liquid" size={9} /> Liquid Melt
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                    <PhaseStateGlyph state="gas" size={9} /> Gaseous Vapor
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Tile Sub-Metric Readout Mode Switcher + Clear Axis Highlight */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {(highlightedGroup !== null || highlightedPeriod !== null) && (
            <button
              type="button"
              onClick={() => {
                setHighlightedGroup(null);
                setHighlightedPeriod(null);
              }}
              className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[9.5px] font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear Group/Period ({highlightedGroup ? `G${highlightedGroup}` : ''}{highlightedPeriod ? ` P${highlightedPeriod}` : ''})
            </button>
          )}

          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800 text-[9.5px] font-mono">
            <span className="text-slate-500 px-1.5 uppercase font-bold">Tile Data:</span>
            {(
              [
                { id: 'crystallographic', label: 'a₀ & Lattice' },
                { id: 'diffraction', label: 'SG & ρ_XRD' },
                { id: 'electronic', label: 'Orbital & χ' }
              ] as const
            ).map(tm => (
              <button
                key={tm.id}
                type="button"
                onClick={() => setTileViewMode(tm.id)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tileViewMode === tm.id
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 18-Column IUPAC Standard Matrix with Responsive Precision Layout */}
      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[740px] lg:min-w-0 w-full space-y-1">
          {/* Top IUPAC Group Header Row (1 to 18) */}
          <div
            className="grid gap-1 items-center"
            style={{ gridTemplateColumns: '26px repeat(18, minmax(0, 1fr))' }}
          >
            <div className="text-[7.5px] font-mono font-bold text-slate-500 text-center uppercase">
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
                  className={`py-0.5 rounded border text-center transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-sm'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={`Highlight Group ${g} (${GROUP_ROMAN[g]})`}
                >
                  <div className="text-[8.5px] font-mono font-bold leading-none tabular-nums">
                    {g}
                  </div>
                  <div className="text-[6px] font-mono opacity-75 leading-none mt-0.5">
                    {GROUP_ROMAN[g]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Unified 7-Period Grid with Embedded d-Block Basin Console (Groups 3–12, Periods 1–3) */}
          <div
            className="grid gap-1 items-stretch"
            style={{
              gridTemplateColumns: '26px repeat(18, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(7, minmax(0, 1fr))'
            }}
          >
            {/* Calibrated Specimen & Diffraction HUD inside Groups 3–12, Periods 1–3 */}
            {activeOrHovered && (
              <div
                style={{ gridColumn: '4 / span 10', gridRow: '1 / span 3' }}
                className="rounded-xl bg-[#070b14] border border-slate-800/95 p-2.5 flex items-center justify-between gap-2.5 relative overflow-hidden"
              >
                {/* Left: Specimen Identity Plate + Telemetry */}
                <div className="flex items-center gap-2.5 shrink-0 z-10">
                  <div className="w-[74px] h-[88px] rounded-xl bg-[#0B0F19] border border-cyan-500/45 p-2 flex flex-col justify-between relative shadow-md shrink-0">
                    <div className="flex items-center justify-between text-[8.5px] font-mono font-bold text-slate-300 leading-none tabular-nums">
                      <span>Z={activeOrHovered.number}</span>
                      <PhaseStateGlyph state={activeStateAtTemp} size={8.5} />
                    </div>
                    <div className="my-auto flex items-center justify-between">
                      <span className="text-2xl font-black text-white tracking-tight leading-none">
                        {activeOrHovered.symbol}
                      </span>
                      <MicroLatticeGlyph
                        structure={activeOrHovered.crystalStructure}
                        size={18}
                        className="text-cyan-400"
                      />
                    </div>
                    <div className="space-y-0.5 leading-none">
                      <div className="text-[8px] font-bold text-slate-200 truncate">
                        {activeOrHovered.name}
                      </div>
                      <div className="text-[7px] font-mono text-cyan-300 font-bold tabular-nums">
                        {activeOrHovered.crystalStructure} · {activeOrHovered.a.toFixed(2)}Å
                      </div>
                    </div>
                  </div>

                  {/* Unboxed Scientific Metadata & Metrics */}
                  <div className="space-y-1 font-mono text-[9.5px] leading-tight">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-white font-sans">
                        {activeOrHovered.name}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-300 font-bold">{activeOrHovered.spaceGroup}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPinnedElementZ(
                            pinnedElementZ === activeOrHovered.number
                              ? null
                              : activeOrHovered.number
                          )
                        }
                        className={`ml-1 px-1.5 py-0.5 rounded border text-[8.5px] flex items-center gap-1 transition-colors cursor-pointer ${
                          pinnedElementZ === activeOrHovered.number
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                        title="Pin element as reference to compare lattice mismatch & Hume-Rothery rules"
                      >
                        <Pin className="w-2.5 h-2.5" />
                        <span>{pinnedElementZ === activeOrHovered.number ? 'Pinned' : 'Pin Ref'}</span>
                      </button>
                    </div>

                    <div className="text-slate-400 tabular-nums">
                      <span>{activeOrHovered.weight.toFixed(4)} u</span>
                      <span className="mx-1 text-slate-600">·</span>
                      <span className="text-amber-300 uppercase">{activeOrHovered.block}-block</span>
                      <span className="mx-1 text-slate-600">·</span>
                      <span className="text-slate-300 capitalize">
                        {activeOrHovered.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-slate-400 tabular-nums">
                      a₀ = <strong className="text-emerald-300">{activeOrHovered.a.toFixed(3)} Å</strong>
                      {activeOrHovered.c && Math.abs(activeOrHovered.c - activeOrHovered.a) > 0.01
                        ? ` · c₀ = ${activeOrHovered.c.toFixed(3)} Å`
                        : ''}
                      <span className="mx-1 text-slate-600">·</span>
                      V = <strong className="text-slate-200">{activeVolume.toFixed(1)} Å³</strong>
                    </div>

                    <div className="text-slate-400 tabular-nums">
                      ρ<sub>XRD</sub> ={' '}
                      <strong className="text-white">{activeOrHovered.density.toFixed(3)} g/cm³</strong>
                      <span className="mx-1 text-slate-600">·</span>
                      r<sub>at</sub> ={' '}
                      <strong className="text-amber-200">{activeOrHovered.atomicRadius} pm</strong>
                    </div>

                    <div className="text-slate-400 truncate max-w-[195px]">
                      Config: <strong className="text-indigo-300">{activeOrHovered.electronConfig}</strong>
                    </div>
                  </div>
                </div>

                {/* Center: 2D Bohr Electron Shell Ring Diagram */}
                <div className="hidden xl:flex flex-col items-center justify-center px-2 border-x border-slate-800/80 z-10 shrink-0">
                  <ElectronShellRingGraphic
                    atomicNumber={activeOrHovered.number}
                    symbol={activeOrHovered.symbol}
                    size={82}
                  />
                </div>

                {/* Right: Live Powder XRD Stick Pattern Preview */}
                <div className="flex-1 min-w-[150px] max-w-[230px] z-10 flex flex-col justify-between h-full py-0.5">
                  <LiveMiniXrdStickPattern element={activeOrHovered} />
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[8px] font-mono text-center tabular-nums">
                    <div className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5">
                      <span className="text-slate-500 block">χ Pauling</span>
                      <span className="text-amber-300 font-bold">
                        {activeOrHovered.electronegativity
                          ? activeOrHovered.electronegativity.toFixed(2)
                          : '—'}
                      </span>
                    </div>
                    <div className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5">
                      <span className="text-slate-500 block">T_melt</span>
                      <span className="text-rose-300 font-bold">
                        {activeOrHovered.meltingPoint}°C
                      </span>
                    </div>
                    <div className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5">
                      <span className="text-slate-500 block">f₀(0)</span>
                      <span className="text-cyan-300 font-bold">{activeOrHovered.number} e⁻</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Render Period Headers & Element Cells for Rows 1..7 */}
            {Array.from({ length: 7 }, (_, rowIndex) => {
              const y = rowIndex + 1;
              const isPeriodHighlighted = highlightedPeriod === y;

              return (
                <React.Fragment key={`period-row-${y}`}>
                  {/* Period Coordinate Button at Column 1 */}
                  <button
                    type="button"
                    style={{ gridColumn: 1, gridRow: y }}
                    onClick={() => setHighlightedPeriod(isPeriodHighlighted ? null : y)}
                    className={`h-full rounded border flex flex-col items-center justify-center font-mono transition-colors cursor-pointer ${
                      isPeriodHighlighted
                        ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-sm'
                        : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                    title={`Highlight Period ${y} (Principal Quantum Shell n = ${y})`}
                  >
                    <span className="text-[8.5px] font-bold leading-none tabular-nums">{y}</span>
                    <span className="text-[6px] opacity-65 leading-none mt-0.5">n={y}</span>
                  </button>

                  {/* Element Columns 1..18 (Grid Columns 2..19) */}
                  {Array.from({ length: 18 }, (_, colIndex) => {
                    const x = colIndex + 1;
                    // Skip cells inside the embedded d-block basin HUD (x: 3..12, y: 1..3)
                    if (y <= 3 && x >= 3 && x <= 12) {
                      return null;
                    }
                    return renderCell(x, y, { gridColumn: x + 1, gridRow: y });
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {/* Separation Gap before f-block Inner Transition Series */}
          <div
            className="grid gap-1 pt-1.5 pb-0.5 items-center"
            style={{ gridTemplateColumns: '26px repeat(18, minmax(0, 1fr))' }}
          >
            <div />
            <div style={{ gridColumn: 'span 3' }} className="border-b border-dashed border-slate-800" />
            <div
              style={{ gridColumn: 'span 15' }}
              className="border-b border-dashed border-slate-800 flex items-center justify-between text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-wider px-1 pb-0.5"
            >
              <span>f-Block Inner Transition Series (4f Lanthanoids · 5f Actinoids)</span>
              <span>Columns 4–18</span>
            </div>
          </div>

          {/* Lanthanide Series (Row 8, x = 4 to 18) */}
          <div
            className="grid gap-1 items-stretch"
            style={{ gridTemplateColumns: '26px repeat(18, minmax(0, 1fr))' }}
          >
            <div className="text-[8px] font-mono font-bold text-fuchsia-400 flex items-center justify-center">
              4f
            </div>
            <div style={{ gridColumn: 'span 3' }} className="flex items-center justify-end pr-1.5">
              <button
                type="button"
                onClick={() =>
                  onToggleCategoryFilter &&
                  onToggleCategoryFilter(activeCategoryFilter === 'lanthanoid' ? 'all' : 'lanthanoid')
                }
                className={`w-full h-full rounded-lg border px-2 py-1 flex flex-col justify-center text-right font-mono transition-colors cursor-pointer ${
                  activeCategoryFilter === 'lanthanoid'
                    ? 'bg-fuchsia-900/60 border-fuchsia-400 text-white'
                    : 'bg-fuchsia-950/25 border-fuchsia-800/40 text-fuchsia-300 hover:border-fuchsia-600'
                }`}
              >
                <span className="text-[8.5px] font-bold uppercase leading-none">Lanthanoids</span>
                <span className="text-[7px] text-fuchsia-400/80 tabular-nums mt-0.5">Z = 57–71</span>
              </button>
            </div>
            {Array.from({ length: 15 }, (_, i) => renderCell(i + 4, 8))}
          </div>

          {/* Actinide Series (Row 9, x = 4 to 18) */}
          <div
            className="grid gap-1 items-stretch"
            style={{ gridTemplateColumns: '26px repeat(18, minmax(0, 1fr))' }}
          >
            <div className="text-[8px] font-mono font-bold text-orange-400 flex items-center justify-center">
              5f
            </div>
            <div style={{ gridColumn: 'span 3' }} className="flex items-center justify-end pr-1.5">
              <button
                type="button"
                onClick={() =>
                  onToggleCategoryFilter &&
                  onToggleCategoryFilter(activeCategoryFilter === 'actinoid' ? 'all' : 'actinoid')
                }
                className={`w-full h-full rounded-lg border px-2 py-1 flex flex-col justify-center text-right font-mono transition-colors cursor-pointer ${
                  activeCategoryFilter === 'actinoid'
                    ? 'bg-orange-900/60 border-orange-400 text-white'
                    : 'bg-orange-950/25 border-orange-800/40 text-orange-300 hover:border-orange-600'
                }`}
              >
                <span className="text-[8.5px] font-bold uppercase leading-none">Actinoids</span>
                <span className="text-[7px] text-orange-400/80 tabular-nums mt-0.5">Z = 89–103</span>
              </button>
            </div>
            {Array.from({ length: 15 }, (_, i) => renderCell(i + 4, 9))}
          </div>
        </div>
      </div>

      {/* Bottom Crystallographic & Differential Telemetry Dock */}
      {activeOrHovered && (
        <div className="p-3 bg-[#070b14] border border-slate-800/90 rounded-xl space-y-2.5 text-xs font-mono tabular-nums">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex flex-col items-center justify-center font-black text-cyan-300 shrink-0">
                <span className="text-[8px] text-slate-400 leading-none">{activeOrHovered.number}</span>
                <span className="text-base leading-none mt-0.5 text-white">{activeOrHovered.symbol}</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  <span>{activeOrHovered.name}</span>
                  <span className="text-slate-500 font-mono text-xs">·</span>
                  <span className="text-xs text-slate-300 font-mono font-normal">
                    {activeOrHovered.weight.toFixed(4)} u
                  </span>
                  {hoveredElement && (
                    <span className="text-[9.5px] font-mono text-cyan-300">
                      (Hover Preview)
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MicroLatticeGlyph
                    structure={activeOrHovered.crystalStructure}
                    size={11}
                    className="text-cyan-400"
                  />
                  <span className="text-indigo-300 font-semibold">
                    {activeOrHovered.crystalStructure} ({activeOrHovered.spaceGroup})
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="capitalize">{activeOrHovered.category.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-500 text-[9px] uppercase block">Lattice Constants</span>
                <span className="font-bold text-white">
                  a={activeOrHovered.a.toFixed(3)}Å
                  {activeOrHovered.c && Math.abs(activeOrHovered.c - activeOrHovered.a) > 0.01
                    ? `, c=${activeOrHovered.c.toFixed(3)}Å`
                    : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] uppercase block">X-Ray Density</span>
                <span className="font-bold text-emerald-400">
                  {activeOrHovered.density.toFixed(3)} g/cm³
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] uppercase block">Atomic Radius</span>
                <span className="font-bold text-amber-300">{activeOrHovered.atomicRadius} pm</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] uppercase block">Melting / Boiling</span>
                <span className="font-bold text-white">
                  {activeOrHovered.meltingPoint}°C / {activeOrHovered.boilingPoint ?? 'N/A'}°C
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block">Ground Config</span>
                  <span className="font-bold text-cyan-300">{activeOrHovered.electronConfig}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPinnedElementZ(
                      pinnedElementZ === selectedElObj.number ? null : selectedElObj.number
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                    pinnedElement
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Pin currently selected element to compare lattice & Hume-Rothery deltas against any hovered/selected element"
                >
                  {pinnedElement ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  <span>{pinnedElement ? `Unpin ${pinnedElement.symbol}` : `Pin ${selectedElObj.symbol}`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Pinned Reference Differential Strip */}
          {pinnedElement && pinnedElement.number !== activeOrHovered.number && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10.5px]">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>
                  Differential vs Pinned {pinnedElement.symbol} (Z={pinnedElement.number}, {pinnedElement.crystalStructure}):
                </span>
              </div>

              {(() => {
                const daPct =
                  ((activeOrHovered.a - pinnedElement.a) / (pinnedElement.a || 1)) * 100;
                const drPct =
                  ((activeOrHovered.atomicRadius - pinnedElement.atomicRadius) /
                    (pinnedElement.atomicRadius || 1)) *
                  100;
                const dChi =
                  (activeOrHovered.electronegativity || 0) -
                  (pinnedElement.electronegativity || 0);
                const sameLattice =
                  activeOrHovered.crystalStructure === pinnedElement.crystalStructure;
                const hrFavorable = Math.abs(drPct) <= 15 && Math.abs(dChi) <= 0.4;

                return (
                  <div className="flex flex-wrap items-center gap-4 text-slate-300">
                    <div>
                      <span className="text-slate-500">Lattice Δa₀: </span>
                      <strong className={daPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {daPct >= 0 ? `+${daPct.toFixed(2)}%` : `${daPct.toFixed(2)}%`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Size Δr: </span>
                      <strong
                        className={Math.abs(drPct) <= 15 ? 'text-cyan-300' : 'text-amber-400'}
                      >
                        {drPct >= 0 ? `+${drPct.toFixed(1)}%` : `${drPct.toFixed(1)}%`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Δχ Pauling: </span>
                      <strong className="text-white">
                        {dChi >= 0 ? `+${dChi.toFixed(2)}` : dChi.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Symmetry: </span>
                      <strong className={sameLattice ? 'text-emerald-400' : 'text-slate-400'}>
                        {sameLattice ? `Isomorphous (${pinnedElement.crystalStructure})` : 'Heteromorphous'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Hume-Rothery: </span>
                      <strong className={hrFavorable ? 'text-emerald-400' : 'text-amber-400'}>
                        {hrFavorable ? '● High Solubility (≤15%)' : '▲ Limited Solubility'}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
