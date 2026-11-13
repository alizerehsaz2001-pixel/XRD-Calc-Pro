import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  MoveHorizontal, 
  Layers3, 
  Database,
  Search,
  Orbit,
  Flame,
  Zap,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sliders
} from 'lucide-react';

interface PresetScenariosRibbonProps {
  onSelectScenario: (key: string) => void;
  onOpenGuide: () => void;
  onOpenSearchMatch: () => void;
  onExportCSV: () => void;
}

export interface PresetScenarioItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  spaceGroup: string;
  category: 'Biomaterials' | 'Lattice Strain' | 'Multi-Phase' | 'Energy / Battery' | 'Minerals' | 'Electronic' | 'Nanomaterials';
  icon: any;
  outcomeBadge: string;
  outcomeType: 'success' | 'warning' | 'purple' | 'info';
  description: string;
  peaksA: { pos: number; h: number }[];
  peaksB: { pos: number; h: number }[];
  peaksC?: { pos: number; h: number }[];
}

export const PRESET_SCENARIOS: PresetScenarioItem[] = [
  {
    id: 'pure-ha',
    code: 'BM-01',
    title: 'Pure Hydroxyapatite',
    subtitle: 'Ca₁₀(PO₄)₆(OH)₂ · ICDD 09-0432',
    spaceGroup: 'P6₃/m (176)',
    category: 'Biomaterials',
    icon: CheckCircle2,
    outcomeBadge: 'Rwp 2.4% · Pure',
    outcomeType: 'success',
    description: 'Single-phase hexagonal HAp reference standard with zero lattice distortion.',
    peaksA: [{ pos: 26, h: 35 }, { pos: 31.8, h: 100 }, { pos: 32.2, h: 70 }, { pos: 32.9, h: 60 }, { pos: 46.7, h: 40 }, { pos: 49.5, h: 35 }],
    peaksB: [{ pos: 26, h: 35 }, { pos: 31.8, h: 100 }, { pos: 32.2, h: 70 }, { pos: 32.9, h: 60 }, { pos: 46.7, h: 40 }, { pos: 49.5, h: 35 }]
  },
  {
    id: 'strained-ha',
    code: 'BM-02',
    title: 'Zn-Doped Strained HAp',
    subtitle: 'Ca₉.₅Zn₀.₅(PO₄)₆(OH)₂ · Vegard Shift',
    spaceGroup: 'P6₃/m (176)',
    category: 'Lattice Strain',
    icon: MoveHorizontal,
    outcomeBadge: 'Δ2θ +0.12° Shift',
    outcomeType: 'warning',
    description: 'Models substitutional Zn²⁺ lattice contraction and uniform Bragg peak displacement.',
    peaksA: [{ pos: 28, h: 35 }, { pos: 34.2, h: 100 }, { pos: 35.8, h: 70 }, { pos: 37.2, h: 60 }, { pos: 49.2, h: 40 }, { pos: 52.0, h: 35 }],
    peaksB: [{ pos: 25.5, h: 35 }, { pos: 31.5, h: 100 }, { pos: 33.0, h: 70 }, { pos: 34.5, h: 60 }, { pos: 46.5, h: 40 }, { pos: 49.3, h: 35 }]
  },
  {
    id: 'biphasic-ha-tcp',
    code: 'BM-03',
    title: 'Biphasic HAp + β-TCP',
    subtitle: '65 wt% HAp / 35 wt% β-Ca₃(PO₄)₂',
    spaceGroup: 'P6₃/m + R3c',
    category: 'Multi-Phase',
    icon: Layers3,
    outcomeBadge: '65:35 wt% RIR',
    outcomeType: 'purple',
    description: 'Deconvolutes overlapping bioceramic reflections of HAp and rhombohedral β-TCP.',
    peaksA: [{ pos: 25.8, h: 30 }, { pos: 27.8, h: 30 }, { pos: 31.0, h: 58 }, { pos: 31.8, h: 100 }, { pos: 32.9, h: 50 }, { pos: 34.4, h: 42 }, { pos: 46.7, h: 35 }],
    peaksB: [{ pos: 25.8, h: 30 }, { pos: 31.8, h: 100 }, { pos: 32.9, h: 50 }, { pos: 46.7, h: 35 }],
    peaksC: [{ pos: 27.8, h: 30 }, { pos: 31.0, h: 58 }, { pos: 34.4, h: 42 }]
  },
  {
    id: 'triphasic-tio2',
    code: 'BM-04',
    title: 'TiO₂ Polymorph Trio',
    subtitle: 'Anatase + Rutile + Brookite',
    spaceGroup: 'I4₁/amd + P4₂/mnm',
    category: 'Multi-Phase',
    icon: Flame,
    outcomeBadge: '3 Polymorphs',
    outcomeType: 'purple',
    description: 'Simultaneous 3-phase NNLS+RIR partitioning of Titanium Dioxide crystal polymorphs.',
    peaksA: [{ pos: 25.3, h: 100 }, { pos: 27.5, h: 55 }, { pos: 30.8, h: 32 }, { pos: 37.8, h: 30 }, { pos: 48.0, h: 40 }, { pos: 54.3, h: 65 }],
    peaksB: [{ pos: 25.3, h: 100 }, { pos: 37.8, h: 30 }, { pos: 48.0, h: 40 }],
    peaksC: [{ pos: 27.5, h: 55 }, { pos: 30.8, h: 32 }, { pos: 54.3, h: 65 }]
  },
  {
    id: 'battery-lifepo4',
    code: 'BM-05',
    title: 'LiFePO₄ Battery Cathode',
    subtitle: 'Li₁₋ₓFePO₄ Olivine Delithiation',
    spaceGroup: 'Pnma (62)',
    category: 'Energy / Battery',
    icon: Orbit,
    outcomeBadge: 'ΔV = -6.8% Shift',
    outcomeType: 'info',
    description: 'Models orthorhombic unit-cell contraction during Li⁺ extraction to heterosite FePO₄.',
    peaksA: [{ pos: 20.5, h: 35 }, { pos: 26.8, h: 100 }, { pos: 31.2, h: 50 }, { pos: 37.4, h: 82 }, { pos: 39.2, h: 45 }],
    peaksB: [{ pos: 18.5, h: 30 }, { pos: 24.8, h: 100 }, { pos: 29.2, h: 45 }, { pos: 35.4, h: 78 }, { pos: 37.2, h: 40 }]
  },
  {
    id: 'quartz',
    code: 'BM-06',
    title: 'Alpha-Quartz (α-SiO₂)',
    subtitle: 'NIST SRM 1878a Calibration',
    spaceGroup: 'P3₁21 (152)',
    category: 'Minerals',
    icon: Database,
    outcomeBadge: 'RIR 3.60 Std',
    outcomeType: 'success',
    description: 'Trigonal α-quartz line-position and intensity standard for goniometer verification.',
    peaksA: [{ pos: 20.9, h: 25 }, { pos: 26.6, h: 100 }, { pos: 36.5, h: 18 }, { pos: 39.5, h: 15 }, { pos: 50.1, h: 22 }, { pos: 60.0, h: 16 }],
    peaksB: [{ pos: 20.9, h: 25 }, { pos: 26.6, h: 100 }, { pos: 36.5, h: 18 }, { pos: 39.5, h: 15 }, { pos: 50.1, h: 22 }, { pos: 60.0, h: 16 }]
  },
  {
    id: 'perovskite-batio3',
    code: 'BM-07',
    title: 'BaTiO₃ Tetragonal Split',
    subtitle: 'P4mm Ferroelectric vs Pm-3m Cubic',
    spaceGroup: 'P4mm vs Pm-3m',
    category: 'Electronic',
    icon: SplitSquareVertical,
    outcomeBadge: '(002)/(200) Split',
    outcomeType: 'warning',
    description: 'Demonstrates c/a tetragonality peak splitting of the {200} reflection at ~45.2° 2θ.',
    peaksA: [{ pos: 22.1, h: 30 }, { pos: 31.4, h: 100 }, { pos: 38.9, h: 25 }, { pos: 44.5, h: 45 }, { pos: 46.2, h: 75 }, { pos: 56.2, h: 42 }],
    peaksB: [{ pos: 22.1, h: 30 }, { pos: 31.5, h: 100 }, { pos: 38.9, h: 25 }, { pos: 45.3, h: 95 }, { pos: 56.2, h: 42 }]
  },
  {
    id: 'graphene-intercalation',
    code: 'BM-08',
    title: 'Graphite → Graphene Oxide',
    subtitle: 'Basal (002) Interlayer Expansion',
    spaceGroup: 'P6₃/mmc → Turbostratic',
    category: 'Nanomaterials',
    icon: Zap,
    outcomeBadge: 'd₀₀₂ 3.35→8.15 Å',
    outcomeType: 'info',
    description: 'Tracks extreme low-angle (002) basal reflection shift from 26.55° to 10.85° 2θ.',
    peaksA: [{ pos: 14.5, h: 100 }, { pos: 24.0, h: 18 }, { pos: 43.0, h: 22 }],
    peaksB: [{ pos: 28.5, h: 100 }, { pos: 43.0, h: 18 }, { pos: 54.6, h: 30 }]
  }
];

export const PresetScenariosRibbon: React.FC<PresetScenariosRibbonProps> = ({
  onSelectScenario,
  onOpenGuide,
  onOpenSearchMatch,
  onExportCSV
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('pure-ha');

  const categories = [
    { id: 'all', label: 'ALL BENCHMARKS (8)' },
    { id: 'Biomaterials', label: 'BIOMATERIALS' },
    { id: 'Multi-Phase', label: 'MULTI-PHASE RIR' },
    { id: 'Lattice Strain', label: 'LATTICE STRAIN' },
    { id: 'Energy / Battery', label: 'BATTERY CATHODES' },
    { id: 'Electronic', label: 'PEROVSKITES / NANO' }
  ];

  const filteredPresets = PRESET_SCENARIOS.filter(s => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'Electronic') return s.category === 'Electronic' || s.category === 'Nanomaterials' || s.category === 'Minerals';
    return s.category === selectedCategory;
  });

  const handleSelect = (scenario: PresetScenarioItem) => {
    setActiveScenarioId(scenario.id);
    onSelectScenario(scenario.id);
  };

  const getBadgeStyle = (type: PresetScenarioItem['outcomeType']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'info':
      default:
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800 bg-[#070A12]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-slate-900 border border-slate-700/80 text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-100">
                CALIBRATED XRD BENCHMARK LIBRARY &amp; SCENARIO MATRIX
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-sky-400 border border-slate-800 tabular-nums">
                8 STANDARDS · Cu Kα₁
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Load validated experimental vs. reference diffraction pairs: Vegard strain, RIR mixtures, and polymorph transitions.
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          <button
            id="btn-open-search-match-top"
            onClick={onOpenSearchMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Auto-search entire material database to identify best phase match"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Search-Match DB</span>
          </button>

          <button
            id="btn-open-guide-top"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Read crystallographic equations for Rwp, Pearson r, peak shifts, and RIR phase fractions"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Metrology Guide</span>
          </button>
          
          <button
            id="btn-export-csv-top"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Download full comparison, RIR weight %, and residual report as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Benchmark Matrix' : 'Expand Benchmark Matrix'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Benchmark Grid */}
      {isExpanded && (
        <div className="p-3.5 lg:p-4 space-y-3 bg-[#0B0F19]">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-[#070A12] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="hidden xl:flex items-center gap-3 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Sample A (Exp)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" /> Ref B (Std)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-purple-400 inline-block" /> Phase C (Sec)
              </span>
            </div>
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {filteredPresets.map((preset) => {
              const IconComp = preset.icon;
              const isSelected = activeScenarioId === preset.id;
              const badgeCls = getBadgeStyle(preset.outcomeType);

              return (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => handleSelect(preset)}
                  className={`p-3 rounded-md border text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#070A12] border-sky-400 ring-1 ring-sky-500/30'
                      : 'bg-[#070A12]/80 border-slate-800 hover:border-slate-700 hover:bg-[#070A12]'
                  }`}
                >
                  {/* Top Row: Code + SG + Outcome Metric */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 group-hover:text-slate-200'
                      }`}>
                        {preset.code}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 truncate max-w-[85px]">
                        {preset.spaceGroup}
                      </span>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border tabular-nums ${badgeCls}`}>
                      {preset.outcomeBadge}
                    </span>
                  </div>

                  {/* Middle: Title & Formula Subtitle */}
                  <div className="flex items-start gap-2">
                    <IconComp className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      isSelected ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-300'
                    }`} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                        {preset.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {preset.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Live Miniature SVG Stick-and-Profile Preview */}
                  <div className="w-full h-9 bg-[#050811] border border-slate-800/80 rounded px-1.5 py-1 flex items-end relative overflow-hidden">
                    <svg viewBox="10 0 55 32" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <line x1="10" y1="30" x2="65" y2="30" stroke="#1e293b" strokeWidth="1" />
                      {/* Reference B sticks (Indigo) */}
                      {preset.peaksB.map((pk, idx) => (
                        <line
                          key={`b-${idx}`}
                          x1={pk.pos}
                          y1={30}
                          x2={pk.pos}
                          y2={30 - (pk.h / 100) * 24}
                          stroke="#818cf8"
                          strokeWidth="1.2"
                          strokeDasharray="2 1"
                          opacity="0.85"
                        />
                      ))}
                      {/* Secondary C sticks (Purple) */}
                      {preset.peaksC?.map((pk, idx) => (
                        <line
                          key={`c-${idx}`}
                          x1={pk.pos}
                          y1={30}
                          x2={pk.pos}
                          y2={30 - (pk.h / 100) * 24}
                          stroke="#c084fc"
                          strokeWidth="1.2"
                          opacity="0.9"
                        />
                      ))}
                      {/* Sample A sticks (Laser Cyan) */}
                      {preset.peaksA.map((pk, idx) => (
                        <g key={`a-${idx}`}>
                          <line
                            x1={pk.pos}
                            y1={30}
                            x2={pk.pos}
                            y2={30 - (pk.h / 100) * 26}
                            stroke="#38bdf8"
                            strokeWidth="1.4"
                          />
                          <circle
                            cx={pk.pos}
                            cy={30 - (pk.h / 100) * 26}
                            r="1.1"
                            fill="#38bdf8"
                          />
                        </g>
                      ))}
                    </svg>
                    <span className="absolute top-0.5 right-1.5 text-[8px] font-mono text-slate-500">
                      10°–65° 2θ
                    </span>
                  </div>

                  {/* Bottom: Technical Description */}
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug font-mono">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
