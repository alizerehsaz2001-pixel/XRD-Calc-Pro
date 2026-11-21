import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pin,
  PinOff,
  ArrowLeftRight,
  Database,
  Play,
  Plus,
  Check,
  X,
  Columns3,
  Radiation
} from 'lucide-react';
import { CrystalElement, ColorMode, HeatmapMode, XRayAnodeType } from './types';
import {
  HEATMAP_CONFIGS,
  getHeatmapColor,
  computeUnitCellVolume,
  getElementKEdgeKeV
} from './PeriodicHeatmapLegend';
import {
  XRAY_ANODES,
  isRadioactiveElement,
  getElementMuRhoForAnode,
  getAnodeFluorescenceAssessment,
  DbPhaseSummary
} from './xrayAnodePhysics';
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
  selectedAnode?: XRayAnodeType;
  dbPhaseCounts?: Record<string, number>;
  dbPhases?: DbPhaseSummary[];
  composerSymbols?: string[];
  onToggleComposerSymbol?: (symbol: string) => void;
  onClearComposerSymbols?: () => void;
  onLoadDbPhase?: (phase: DbPhaseSummary) => void;
  onSimulateElementXrd?: (el: CrystalElement) => void;
  onFocusSearch?: () => void;
}

type TileViewMode = 'crystallographic' | 'diffraction' | 'electronic' | 'spectroscopy' | 'database';

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
  onToggleBlockFilter,
  selectedAnode = 'Cu',
  dbPhaseCounts = {},
  dbPhases = [],
  composerSymbols = [],
  onToggleComposerSymbol,
  onClearComposerSymbols,
  onLoadDbPhase,
  onSimulateElementXrd,
  onFocusSearch
}) => {
  const [hoveredElement, setHoveredElement] = useState<CrystalElement | null>(null);
  const [highlightedGroup, setHighlightedGroup] = useState<number | null>(null);
  const [highlightedPeriod, setHighlightedPeriod] = useState<number | null>(null);
  const [tileViewMode, setTileViewMode] = useState<TileViewMode>('crystallographic');
  const [pinnedElementZ, setPinnedElementZ] = useState<number | null>(null);
  const [tableFormat, setTableFormat] = useState<'18col' | '32col'>('18col');
  const [composerMode, setComposerMode] = useState<boolean>(false);
  const [phaseSearchFilter, setPhaseSearchFilter] = useState<string>('');

  const valueCtx = useMemo(
    () => ({ anode: selectedAnode, dbPhaseCounts }),
    [selectedAnode, dbPhaseCounts]
  );

  // Pre-calculate heatmap min/max
  const heatmapConfig = HEATMAP_CONFIGS[heatmapMode];
  let heatmapMin = 0;
  let heatmapMax = 100;
  if (heatmapConfig) {
    const vals = elements
      .map(e => heatmapConfig.getValue(e, valueCtx))
      .filter(v => v !== undefined && !isNaN(v) && v !== 0);
    if (vals.length > 0) {
      heatmapMin = Math.min(...vals);
      heatmapMax = Math.max(...vals);
    }
  }

  // Group elements by 18-col grid coordinate key: `${gridX}_${gridY}`
  const elementGridMap = useMemo(() => {
    const map = new Map<string, CrystalElement>();
    elements.forEach(el => {
      map.set(`${el.gridX}_${el.gridY}`, el);
    });
    return map;
  }, [elements]);

  // Group elements by 32-col wide IUPAC coordinate key: `${wideX}_${wideY}`
  const wideElementGridMap = useMemo(() => {
    const map = new Map<string, CrystalElement>();
    elements.forEach(el => {
      let wx = el.gridX;
      let wy = el.gridY;
      if (el.number >= 57 && el.number <= 71) {
        wx = el.number - 54; // 3..17
        wy = 6;
      } else if (el.number >= 89 && el.number <= 103) {
        wx = el.number - 86; // 3..17
        wy = 7;
      } else if (el.gridX >= 3) {
        wx = el.gridX + 14; // 17..32
      }
      map.set(`${wx}_${wy}`, el);
    });
    return map;
  }, [elements]);

  const selectedElObj = elements.find(e => e.number === selectedElement) || elements[13];
  const activeOrHovered = hoveredElement || selectedElObj;
  const pinnedElement = pinnedElementZ ? elements.find(e => e.number === pinnedElementZ) || null : null;

  // Matching phases from the live 1,454-phase XRD library
  const activeComposerSet = useMemo(() => new Set(composerSymbols), [composerSymbols]);
  const querySymbols = useMemo(() => {
    if (composerSymbols.length > 0) return composerSymbols;
    return selectedElObj ? [selectedElObj.symbol] : [];
  }, [composerSymbols, selectedElObj]);

  const matchingDbPhases = useMemo(() => {
    if (!dbPhases.length || querySymbols.length === 0) return [];
    const qLower = phaseSearchFilter.trim().toLowerCase();
    return dbPhases
      .filter(ph => {
        for (const sym of querySymbols) {
          if (!ph.elements.includes(sym)) return false;
        }
        if (qLower) {
          const hay = `${ph.name} ${ph.formula} ${ph.crystalSystem} ${ph.spaceGroup}`.toLowerCase();
          if (!hay.includes(qLower)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Prioritize simpler/closer element counts first
        const diff = a.elements.length - b.elements.length;
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
  }, [dbPhases, querySymbols, phaseSearchFilter]);

  // Keyboard navigation & power shortcuts across the periodic table
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '/' && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
      } else if (e.key.toLowerCase() === 'p' && selectedElObj) {
        e.preventDefault();
        setPinnedElementZ(prev => (prev === selectedElObj.number ? null : selectedElObj.number));
      } else if (e.key === 'Escape') {
        setHighlightedGroup(null);
        setHighlightedPeriod(null);
        if (composerSymbols.length > 0 && onClearComposerSymbols) {
          onClearComposerSymbols();
        }
      } else if (e.key === 'ArrowRight') {
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
    [selectedElement, selectedElObj, elements, onSelectElement, onFocusSearch, composerSymbols.length, onClearComposerSymbols]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderElementButton = (
    el: CrystalElement,
    gridPositionStyle?: React.CSSProperties,
    compactWide = false
  ) => {
    const isSelected = selectedElement === el.number;
    const isPinned = pinnedElementZ === el.number;
    const isInComposer = activeComposerSet.has(el.symbol);
    const isRad = isRadioactiveElement(el.number);
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
      const val = heatmapConfig.getValue(el, valueCtx);
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
      ? 'ring-2 ring-cyan-400 bg-cyan-950/55 shadow-[0_0_14px_rgba(34,211,238,0.35)] scale-[1.06] z-20'
      : isInComposer
      ? 'ring-2 ring-emerald-400/90 bg-emerald-950/45 z-10'
      : isPinned
      ? 'ring-2 ring-amber-400/90 z-10'
      : 'hover:scale-[1.04] hover:z-10';

    // Determine primary & secondary micro-labels based on tileViewMode & active color/heatmap mode
    let leftSubText = el.name;
    let rightSubText = `${el.a.toFixed(2)}Å`;
    const phaseCount = dbPhaseCounts[el.symbol] || 0;

    if (heatmapMode !== 'none' && heatmapConfig) {
      leftSubText = el.symbol;
      rightSubText = heatmapConfig.format(heatmapConfig.getValue(el, valueCtx)).replace(/ /g, '');
    } else if (tileViewMode === 'database') {
      leftSubText = el.crystalStructure;
      rightSubText = phaseCount > 0 ? `${phaseCount} ph` : '—';
    } else if (tileViewMode === 'diffraction') {
      leftSubText = el.spaceGroup.split(' ')[0];
      rightSubText = `${el.density.toFixed(1)}`;
    } else if (tileViewMode === 'electronic') {
      leftSubText = getShortValenceConfig(el.electronConfig);
      rightSubText = el.electronegativity > 0 ? `χ${el.electronegativity.toFixed(1)}` : '—';
    } else if (tileViewMode === 'spectroscopy') {
      const kEdge = getElementKEdgeKeV(el);
      const muAnode = getElementMuRhoForAnode(el, selectedAnode);
      leftSubText = kEdge >= 1 ? `K${kEdge.toFixed(1)}` : `${Math.round(kEdge * 1000)}e`;
      rightSubText = `μ${muAnode >= 100 ? Math.round(muAnode) : muAnode.toFixed(1)}`;
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
        onClick={(e) => {
          if ((e.shiftKey || composerMode) && onToggleComposerSymbol) {
            onToggleComposerSymbol(el.symbol);
          }
          onSelectElement(el.number);
        }}
        onMouseEnter={() => setHoveredElement(el)}
        onMouseLeave={() => setHoveredElement(null)}
        style={customInlineStyle}
        title={`${el.name} (Z=${el.number}) · ${el.crystalStructure} (${el.spaceGroup}) · ${phaseCount} XRD DB phases${isRad ? ' · Radioactive' : ''} · Shift+Click to add to Phase Finder`}
        className={`${
          compactWide ? 'min-h-[44px] p-0.5' : 'min-h-[50px] sm:min-h-[56px] p-1'
        } rounded-lg border flex flex-col justify-between transition-all duration-150 relative text-left group select-none cursor-pointer overflow-hidden ${cellBg} ${cellBorder} ${opacityClass} ${selectionRing}`}
      >
        {/* Top Calibrated Spectral Bar */}
        {heatmapMode === 'none' && (
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] opacity-80 group-hover:opacity-100 transition-opacity ${
              isSelected
                ? 'bg-cyan-400 h-[2.5px]'
                : isInComposer
                ? 'bg-emerald-400 h-[2.5px]'
                : isPinned
                ? 'bg-amber-400 h-[2.5px]'
                : topAccentClass
            }`}
          />
        )}

        {/* Row 1: Atomic Number Z + Radioactivity / Composer / Pin / Lattice Glyph */}
        <div className="flex items-center justify-between w-full leading-none pt-0.5">
          <span
            className={`text-[8.5px] font-mono font-bold tabular-nums ${
              isSelected ? 'text-cyan-300' : 'text-slate-300/95'
            }`}
          >
            {el.number}
          </span>
          <div className="flex items-center gap-0.5">
            {isInComposer && <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />}
            {isPinned && <Pin className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
            {isRad && (
              <span
                className="text-[8px] leading-none text-amber-400/90"
                title="Radioactive element"
              >
                ☢
              </span>
            )}
            {!compactWide &&
              (colorMode === 'structure' || tileViewMode === 'diffraction' ? (
                <MicroLatticeGlyph structure={el.crystalStructure} size={9} className={symbolColor} />
              ) : (
                <PhaseStateGlyph state={stateAtTemp} size={7.5} />
              ))}
          </div>
        </div>

        {/* Row 2: Prominent Chemical Symbol */}
        <div
          className={`${
            compactWide ? 'text-[12px]' : 'text-[15px] sm:text-base'
          } font-black tracking-tight text-center leading-none my-auto ${
            isSelected ? 'text-white' : symbolColor
          }`}
        >
          {el.symbol}
        </div>

        {/* Row 3: High-Legibility Micro Footer */}
        {!compactWide ? (
          <div className="flex justify-between items-baseline w-full leading-none overflow-hidden gap-0.5 pt-0.5">
            <span className="text-[7px] text-slate-300/85 truncate max-w-[54%] font-medium">
              {leftSubText}
            </span>
            <span
              className={`text-[7px] font-mono font-bold ml-auto truncate tabular-nums ${
                tileViewMode === 'database' && phaseCount > 0 ? 'text-emerald-300' : 'text-slate-100'
              }`}
            >
              {rightSubText}
            </span>
          </div>
        ) : (
          <div className="w-full text-center text-[6.5px] font-mono text-slate-300/85 truncate leading-none tabular-nums">
            {tileViewMode === 'database' ? (phaseCount > 0 ? `${phaseCount}` : '—') : `${el.a.toFixed(1)}Å`}
          </div>
        )}

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
          className={`min-h-[50px] sm:min-h-[56px] p-1 rounded-lg border flex flex-col items-center justify-between transition-all duration-150 bg-fuchsia-950/35 text-fuchsia-200 border-fuchsia-500/40 hover:border-fuchsia-400 hover:bg-fuchsia-900/40 cursor-pointer relative overflow-hidden ${
            isSeriesActive ? 'ring-2 ring-fuchsia-400 shadow-sm' : ''
          }`}
          title="Jump to Lanthanoid series (Z = 57–71, La to Lu)"
        >
          <div className="w-full flex items-center justify-between text-[7.5px] font-mono text-fuchsia-300 font-bold tabular-nums leading-none">
            <span>57–71</span>
            <span>4f</span>
          </div>
          <span className="text-[11px] font-black tracking-tight text-white leading-none my-auto">
            La–Lu
          </span>
          <div className="w-full text-center text-[7px] font-mono text-fuchsia-300/90 uppercase leading-none">
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
          className={`min-h-[50px] sm:min-h-[56px] p-1 rounded-lg border flex flex-col items-center justify-between transition-all duration-150 bg-orange-950/35 text-orange-200 border-orange-500/40 hover:border-orange-400 hover:bg-orange-900/40 cursor-pointer relative overflow-hidden ${
            isSeriesActive ? 'ring-2 ring-orange-400 shadow-sm' : ''
          }`}
          title="Jump to Actinoid series (Z = 89–103, Ac to Lr)"
        >
          <div className="w-full flex items-center justify-between text-[7.5px] font-mono text-orange-300 font-bold tabular-nums leading-none">
            <span>89–103</span>
            <span>5f</span>
          </div>
          <span className="text-[11px] font-black tracking-tight text-white leading-none my-auto">
            Ac–Lr
          </span>
          <div className="w-full text-center text-[7px] font-mono text-orange-300/90 uppercase leading-none">
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
          className="min-h-[50px] sm:min-h-[56px] opacity-0 pointer-events-none"
        />
      );
    }

    return renderElementButton(el, gridPositionStyle, false);
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

        {/* Right: Tile Sub-Metric Readout Mode Switcher + 18/32-Col Toggle + Phase Composer Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto shrink-0">
          {(highlightedGroup !== null || highlightedPeriod !== null) && (
            <button
              type="button"
              onClick={() => {
                setHighlightedGroup(null);
                setHighlightedPeriod(null);
              }}
              className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[9.5px] font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear ({highlightedGroup ? `G${highlightedGroup}` : ''}{highlightedPeriod ? ` P${highlightedPeriod}` : ''})
            </button>
          )}

          {/* Phase Composer Click Mode Toggle */}
          {onToggleComposerSymbol && (
            <button
              type="button"
              onClick={() => setComposerMode(m => !m)}
              className={`px-2 py-1 rounded-lg border text-[9.5px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                composerMode || composerSymbols.length > 0
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle multi-element click mode (or Shift+Click any tile) to filter the 1,454-phase XRD library by elemental composition"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Phase Finder</span>
              {composerSymbols.length > 0 && (
                <span className="text-emerald-300 tabular-nums">({composerSymbols.length})</span>
              )}
            </button>
          )}

          {/* 18-Column vs 32-Column Wide IUPAC Layout Toggle */}
          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800 text-[9.5px] font-mono">
            <button
              type="button"
              onClick={() => setTableFormat('18col')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                tableFormat === '18col'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard compact 18-column IUPAC layout with separate 4f/5f rows"
            >
              18-Col
            </button>
            <button
              type="button"
              onClick={() => setTableFormat('32col')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                tableFormat === '32col'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Wide 32-column IUPAC layout with 4f Lanthanoids and 5f Actinoids inline"
            >
              <Columns3 className="w-2.5 h-2.5" />
              <span>32-Col</span>
            </button>
          </div>

          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800 text-[9.5px] font-mono">
            <span className="text-slate-500 px-1.5 uppercase font-bold hidden sm:inline">Tile:</span>
            {(
              [
                { id: 'crystallographic', label: 'a₀' },
                { id: 'diffraction', label: 'SG & ρ' },
                { id: 'electronic', label: 'Orb & χ' },
                { id: 'spectroscopy', label: `E_K & μ` },
                { id: 'database', label: 'DB Phases' }
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

      {/* 18-Column Standard OR 32-Column Wide IUPAC Matrix */}
      {tableFormat === '32col' ? (
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="min-w-[1260px] w-full space-y-1">
            {/* 32-Column Wide Header Row */}
            <div
              className="grid gap-1 items-center"
              style={{ gridTemplateColumns: '24px repeat(32, minmax(0, 1fr))' }}
            >
              <div className="text-[7px] font-mono font-bold text-slate-500 text-center">P\C</div>
              {Array.from({ length: 32 }, (_, i) => {
                const col = i + 1;
                const isFBlock = col >= 3 && col <= 16;
                const iupacGroup = col <= 2 ? col : col >= 17 ? col - 14 : null;
                return (
                  <div
                    key={`wcol-${col}`}
                    className={`py-0.5 rounded border text-center font-mono text-[8px] font-bold tabular-nums ${
                      isFBlock
                        ? 'bg-fuchsia-950/30 border-fuchsia-800/40 text-fuchsia-300'
                        : 'bg-slate-900/70 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    {iupacGroup !== null ? iupacGroup : `f${col - 2}`}
                  </div>
                );
              })}
            </div>

            {/* 7 Periods in 32-Column Wide Inline Layout */}
            <div
              className="grid gap-1 items-stretch"
              style={{
                gridTemplateColumns: '24px repeat(32, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(7, minmax(0, 1fr))'
              }}
            >
              {Array.from({ length: 7 }, (_, rowIdx) => {
                const y = rowIdx + 1;
                return (
                  <React.Fragment key={`wide-row-${y}`}>
                    <div
                      style={{ gridColumn: 1, gridRow: y }}
                      className="rounded border bg-slate-900/70 border-slate-800/80 text-slate-400 flex items-center justify-center font-mono text-[8.5px] font-bold"
                    >
                      {y}
                    </div>
                    {Array.from({ length: 32 }, (_, colIdx) => {
                      const wx = colIdx + 1;
                      const el = wideElementGridMap.get(`${wx}_${y}`);
                      if (!el) {
                        return (
                          <div
                            key={`wempty-${wx}-${y}`}
                            style={{ gridColumn: wx + 1, gridRow: y }}
                            className="min-h-[44px] opacity-0 pointer-events-none"
                          />
                        );
                      }
                      return renderElementButton(el, { gridColumn: wx + 1, gridRow: y }, true);
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-1 custom-scrollbar">
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
              {/* Calibrated Specimen & Multi-Anode Diffraction HUD inside Groups 3–12, Periods 1–3 */}
              {activeOrHovered && (
                <div
                  style={{ gridColumn: '4 / span 10', gridRow: '1 / span 3' }}
                  className="rounded-xl bg-[#070b14] border border-slate-800/95 p-2.5 flex items-center justify-between gap-2.5 relative overflow-hidden"
                >
                  {/* Left: Specimen Identity Plate + Telemetry */}
                  <div className="flex items-center gap-2.5 shrink-0 z-10">
                    <div className="w-[74px] h-[94px] rounded-xl bg-[#0B0F19] border border-cyan-500/45 p-2 flex flex-col justify-between relative shadow-md shrink-0">
                      <div className="flex items-center justify-between text-[8.5px] font-mono font-bold text-slate-300 leading-none tabular-nums">
                        <span>Z={activeOrHovered.number}</span>
                        <div className="flex items-center gap-0.5">
                          {isRadioactiveElement(activeOrHovered.number) && (
                            <Radiation className="w-2.5 h-2.5 text-amber-400" />
                          )}
                          <PhaseStateGlyph state={activeStateAtTemp} size={8.5} />
                        </div>
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

                    {/* Unboxed Scientific Metadata & Quick Actions */}
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
                          className={`px-1.5 py-0.5 rounded border text-[8.5px] flex items-center gap-1 transition-colors cursor-pointer ${
                            pinnedElementZ === activeOrHovered.number
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          title="Pin element as reference to compare lattice mismatch & Hume-Rothery rules (hotkey: P)"
                        >
                          <Pin className="w-2.5 h-2.5" />
                          <span>{pinnedElementZ === activeOrHovered.number ? 'Pinned' : 'Pin'}</span>
                        </button>
                        {onToggleComposerSymbol && (
                          <button
                            type="button"
                            onClick={() => onToggleComposerSymbol(activeOrHovered.symbol)}
                            className={`px-1.5 py-0.5 rounded border text-[8.5px] flex items-center gap-0.5 transition-colors cursor-pointer ${
                              activeComposerSet.has(activeOrHovered.symbol)
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-300'
                            }`}
                            title="Add/remove element in multi-element XRD Database Phase Finder (or Shift+Click any tile)"
                          >
                            {activeComposerSet.has(activeOrHovered.symbol) ? (
                              <Check className="w-2.5 h-2.5" />
                            ) : (
                              <Plus className="w-2.5 h-2.5" />
                            )}
                            <span>DB</span>
                          </button>
                        )}
                      </div>

                      <div className="text-slate-400 tabular-nums">
                        <span>{activeOrHovered.weight.toFixed(4)} u</span>
                        <span className="mx-1 text-slate-600">·</span>
                        <span className="text-amber-300 uppercase">{activeOrHovered.block}-block</span>
                        <span className="mx-1 text-slate-600">·</span>
                        <span className="text-emerald-300 font-bold">
                          {dbPhaseCounts[activeOrHovered.symbol] || 0} DB phases
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
                        ρ = <strong className="text-white">{activeOrHovered.density.toFixed(3)} g/cm³</strong>
                        <span className="mx-1 text-slate-600">·</span>
                        T<sub>m</sub> = <strong className="text-amber-200">{activeOrHovered.meltingPoint}°C</strong>
                        <span className="mx-1 text-slate-600">·</span>
                        r = <strong className="text-slate-200">{activeOrHovered.atomicRadius} pm</strong>
                      </div>

                      <div className="text-slate-400 truncate max-w-[215px]">
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

                  {/* Right: Live Multi-Anode Powder XRD Stick Pattern & X-Ray Telemetry */}
                  <div className="flex-1 min-w-[165px] max-w-[260px] z-10 flex flex-col justify-between h-full py-0.5">
                    <LiveMiniXrdStickPattern element={activeOrHovered} anode={selectedAnode} />
                    {(() => {
                      const kEdge = getElementKEdgeKeV(activeOrHovered);
                      const muVal = getElementMuRhoForAnode(activeOrHovered, selectedAnode);
                      const fluo = getAnodeFluorescenceAssessment(activeOrHovered, selectedAnode);
                      return (
                        <div className="grid grid-cols-4 gap-1 pt-1 text-[7.5px] font-mono text-center tabular-nums">
                          <div className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5">
                            <span className="text-slate-500 block">χ Pauling</span>
                            <span className="text-amber-300 font-bold">
                              {activeOrHovered.electronegativity
                                ? activeOrHovered.electronegativity.toFixed(2)
                                : '—'}
                            </span>
                          </div>
                          <div className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5">
                            <span className="text-slate-500 block">E_K Edge</span>
                            <span className={fluo.score >= 55 ? 'text-rose-300 font-bold' : 'text-indigo-300 font-bold'}>
                              {kEdge >= 1 ? `${kEdge.toFixed(2)}k` : `${Math.round(kEdge * 1000)}e`}
                            </span>
                          </div>
                          <div className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5">
                            <span className="text-slate-500 block">μ/ρ {selectedAnode}</span>
                            <span className="text-cyan-300 font-bold">
                              {muVal >= 100 ? Math.round(muVal) : muVal.toFixed(1)}
                            </span>
                          </div>
                          <div
                            className="bg-[#0B0F19] border border-slate-800/90 rounded px-1 py-0.5"
                            title={fluo.detail}
                          >
                            <span className="text-slate-500 block">{selectedAnode} Tube</span>
                            <span
                              className={
                                fluo.score >= 70
                                  ? 'text-rose-400 font-bold'
                                  : fluo.score >= 45
                                  ? 'text-amber-300 font-bold'
                                  : 'text-emerald-400 font-bold'
                              }
                            >
                              {fluo.score >= 70 ? 'Fluo!' : fluo.score >= 45 ? 'L-Fluo' : 'Clear'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
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
      )}

      {/* Bottom Live XRD Database Phase Explorer & Pinned Reference Differential Dock */}
      {activeOrHovered && (
        <div className="p-3 bg-[#070b14] border border-slate-800/90 rounded-xl space-y-2.5 text-xs font-mono tabular-nums">
          {/* Pinned Reference Hume-Rothery Differential Strip (shown when an element is pinned) */}
          {pinnedElement && pinnedElement.number !== activeOrHovered.number && (
            <div className="pb-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-[10.5px]">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {activeOrHovered.symbol} vs Pinned {pinnedElement.symbol} ({pinnedElement.crystalStructure}):
                </span>
              </div>

              {(() => {
                const daPct =
                  ((activeOrHovered.a - pinnedElement.a) / (pinnedElement.a || 1)) * 100;
                const aVegard50 = 0.5 * (activeOrHovered.a + pinnedElement.a);
                const drPct =
                  ((activeOrHovered.atomicRadius - pinnedElement.atomicRadius) /
                    (pinnedElement.atomicRadius || 1)) *
                  100;
                const dChi =
                  (activeOrHovered.electronegativity || 0) -
                  (pinnedElement.electronegativity || 0);
                const mu1 = getElementMuRhoForAnode(pinnedElement, selectedAnode);
                const mu2 = getElementMuRhoForAnode(activeOrHovered, selectedAnode);
                const muRatio = mu2 / Math.max(0.01, mu1);
                const sameLattice =
                  activeOrHovered.crystalStructure === pinnedElement.crystalStructure;
                const hrFavorable = Math.abs(drPct) <= 15 && Math.abs(dChi) <= 0.4 && sameLattice;
                const hrPartial = Math.abs(drPct) <= 15 && Math.abs(dChi) <= 0.4 && !sameLattice;

                return (
                  <div className="flex flex-wrap items-center gap-3 text-slate-300">
                    <span>
                      <span className="text-slate-500">Δa₀ </span>
                      <strong className={daPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {daPct >= 0 ? `+${daPct.toFixed(2)}%` : `${daPct.toFixed(2)}%`}
                      </strong>
                    </span>
                    <span>
                      <span className="text-slate-500">Vegard 50/50 </span>
                      <strong className="text-cyan-300">{aVegard50.toFixed(3)} Å</strong>
                    </span>
                    <span>
                      <span className="text-slate-500">Δr </span>
                      <strong className={Math.abs(drPct) <= 15 ? 'text-emerald-300' : 'text-amber-400'}>
                        {drPct >= 0 ? `+${drPct.toFixed(1)}%` : `${drPct.toFixed(1)}%`}
                      </strong>
                    </span>
                    <span>
                      <span className="text-slate-500">Δχ </span>
                      <strong className="text-white">
                        {dChi >= 0 ? `+${dChi.toFixed(2)}` : dChi.toFixed(2)}
                      </strong>
                    </span>
                    <span>
                      <span className="text-slate-500">μ/ρ({selectedAnode}) </span>
                      <strong className="text-indigo-300">{muRatio.toFixed(2)}×</strong>
                    </span>
                    <strong
                      className={
                        hrFavorable
                          ? 'text-emerald-400'
                          : hrPartial
                          ? 'text-cyan-300'
                          : 'text-amber-400'
                      }
                    >
                      {hrFavorable
                        ? 'Complete Solid Solution'
                        : hrPartial
                        ? 'Partial (ΔLattice)'
                        : 'Limited Solubility'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setPinnedElementZ(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title="Unpin reference element"
                    >
                      <PinOff className="w-3 h-3" />
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Live XRD Database Phase Finder Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>XRD Library Phases</span>
              </div>
              <span className="text-slate-600">·</span>
              {composerSymbols.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400">Containing:</span>
                  {composerSymbols.map(sym => (
                    <button
                      key={`comp-${sym}`}
                      type="button"
                      onClick={() => onToggleComposerSymbol && onToggleComposerSymbol(sym)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-[10px] font-bold hover:bg-rose-950/50 hover:border-rose-500/50 hover:text-rose-200 transition-colors cursor-pointer"
                      title={`Remove ${sym} from multi-element filter`}
                    >
                      <span>{sym}</span>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  ))}
                  {onClearComposerSymbols && (
                    <button
                      type="button"
                      onClick={onClearComposerSymbols}
                      className="text-[10px] text-slate-400 hover:text-rose-300 underline ml-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[10.5px] text-slate-300">
                  Showing phases containing{' '}
                  <strong className="text-cyan-300">{selectedElObj.symbol}</strong>{' '}
                  <span className="text-slate-500">
                    (Shift+Click any tile to combine elements, e.g. Ti + Al or Zn + Mg)
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-400">
                <strong className="text-white">{matchingDbPhases.length}</strong> / {dbPhases.length} matches
              </span>
              {matchingDbPhases.length > 6 && (
                <input
                  type="text"
                  value={phaseSearchFilter}
                  onChange={(e) => setPhaseSearchFilter(e.target.value)}
                  placeholder="Filter matched phases..."
                  className="bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-lg px-2 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 outline-none w-36"
                />
              )}
              {onSimulateElementXrd && (
                <button
                  type="button"
                  onClick={() => onSimulateElementXrd(selectedElObj)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title={`Simulate pure ${selectedElObj.symbol} powder XRD pattern under ${XRAY_ANODES[selectedAnode].shortLabel}`}
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Pure {selectedElObj.symbol} ({selectedAnode})</span>
                </button>
              )}
            </div>
          </div>

          {/* Matching XRD Phases Compact Grid */}
          {matchingDbPhases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 max-h-[156px] overflow-y-auto pr-1 custom-scrollbar">
              {matchingDbPhases.slice(0, 24).map((phase, idx) => (
                <div
                  key={`${phase.name}-${idx}`}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0B0F19] border border-slate-800/90 hover:border-emerald-500/45 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-sans font-semibold text-slate-100 truncate" title={phase.name}>
                      {phase.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      <span className="text-cyan-300 font-bold">{phase.formula}</span>
                      <span className="mx-1 text-slate-600">·</span>
                      <span>{phase.spaceGroup}</span>
                      {phase.primaryTwoTheta > 0 && (
                        <>
                          <span className="mx-1 text-slate-600">·</span>
                          <span className="text-amber-300">2θ={phase.primaryTwoTheta.toFixed(1)}°</span>
                        </>
                      )}
                    </div>
                  </div>
                  {onLoadDbPhase && phase.peaks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onLoadDbPhase(phase)}
                      className="px-2 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      title={`Load ${phase.name} (${phase.peaks.length} Bragg peaks) into diffraction spectrometer`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Load</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10.5px] text-slate-500 py-2 text-center bg-[#0B0F19] rounded-lg border border-slate-800/70">
              No phases in the active XRD library match all selected elements ({querySymbols.join(' + ')}).
            </div>
          )}
        </div>
      )}
    </div>
  );
};
