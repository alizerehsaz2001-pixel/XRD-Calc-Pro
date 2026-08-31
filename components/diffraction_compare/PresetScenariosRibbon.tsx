import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  HelpCircle, 
  FileSpreadsheet, 
  FileText,
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
  Info,
  BookOpen
} from 'lucide-react';

interface PresetScenariosRibbonProps {
  onSelectScenario: (key: string) => void;
  onOpenGuide: () => void;
  onOpenSearchMatch: () => void;
  onExportCSV: () => void;
  onExportMarkdown?: () => void;
}

export interface PresetScenarioItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Biomaterials' | 'Lattice Strain' | 'Multi-Phase' | 'Energy / Battery' | 'Minerals' | 'Electronic' | 'Nanomaterials';
  icon: any;
  outcomeBadge: string;
  outcomeType: 'success' | 'warning' | 'purple' | 'info';
  description: string;
}

export const PRESET_SCENARIOS: PresetScenarioItem[] = [
  {
    id: 'pure-ha',
    title: 'Pure Hydroxyapatite',
    subtitle: 'Standard Reference Comparison',
    category: 'Biomaterials',
    icon: CheckCircle2,
    outcomeBadge: '99.8% Purity Match',
    outcomeType: 'success',
    description: 'Single-phase hexagonal HAp Ca₁₀(PO₄)₆(OH)₂ with zero lattice distortion.'
  },
  {
    id: 'strained-ha',
    title: 'Zn-Doped Strained HAp',
    subtitle: 'Cation Substitution / Strain',
    category: 'Lattice Strain',
    icon: MoveHorizontal,
    outcomeBadge: '+0.12° Tensile Shift',
    outcomeType: 'warning',
    description: 'Simulates lattice expansion and peak displacement from Zn²⁺ dopant incorporation.'
  },
  {
    id: 'biphasic-ha-tcp',
    title: 'Biphasic HAp + β-TCP',
    subtitle: '2-Phase Bioceramic Mixture',
    category: 'Multi-Phase',
    icon: Layers3,
    outcomeBadge: '65% HAp / 35% TCP',
    outcomeType: 'purple',
    description: 'Deconvolutes overlapping reflections of Hydroxyapatite and beta-Tricalcium Phosphate.'
  },
  {
    id: 'triphasic-tio2',
    title: 'TiO₂ Polymorph Trio',
    subtitle: 'Anatase + Rutile + Brookite',
    category: 'Multi-Phase',
    icon: Flame,
    outcomeBadge: '3 Distinct Phases',
    outcomeType: 'purple',
    description: 'Deconvolutes 3 crystal polymorphs of Titanium Dioxide with distinct space groups.'
  },
  {
    id: 'battery-lifepo4',
    title: 'LiFePO₄ Battery Cathode',
    subtitle: 'Delithiation Phase Transition',
    category: 'Energy / Battery',
    icon: Orbit,
    outcomeBadge: 'Two-Phase Region',
    outcomeType: 'info',
    description: 'Models electrochemical delithiation from pristine Triphylite to heterosite FePO₄.'
  },
  {
    id: 'quartz',
    title: 'Alpha-Quartz (α-SiO₂)',
    subtitle: 'NIST Standard Reference',
    category: 'Minerals',
    icon: Database,
    outcomeBadge: 'SRM 1878 Benchmark',
    outcomeType: 'success',
    description: 'Trigonal quartz standard used for zero-point alignment and peak profile verification.'
  },
  {
    id: 'perovskite-batio3',
    title: 'BaTiO₃ Perovskite Split',
    subtitle: 'Tetragonal vs Cubic Polymorph',
    category: 'Electronic',
    icon: SplitSquareVertical,
    outcomeBadge: '(002)/(200) Doublet',
    outcomeType: 'warning',
    description: 'Demonstrates ferroelectric tetragonal doublet peak splitting around 45° 2θ.'
  },
  {
    id: 'graphene-intercalation',
    title: 'Graphite → Graphene Oxide',
    subtitle: 'Interlayer Spacing Expansion',
    category: 'Nanomaterials',
    icon: Zap,
    outcomeBadge: 'd₀₀₂ Shift: 26.6° → 10.8°',
    outcomeType: 'info',
    description: 'Visualizes d-spacing expansion from 3.35 Å to ~8.15 Å due to oxygen functionalization.'
  },
  {
    id: 'mxene-ti3c2',
    title: 'Ti₃AlC₂ MAX → Ti₃C₂Tₓ MXene',
    subtitle: 'Al-Layer Etching & Exfoliation',
    category: 'Nanomaterials',
    icon: Flame,
    outcomeBadge: '(104) Al-Peak Loss',
    outcomeType: 'purple',
    description: 'Selective etching of aluminum layers from Ti₃AlC₂ shifts the (002) reflection from 9.5° to ~6.5° 2θ.'
  },
  {
    id: 'superconductor-ybco',
    title: 'YBa₂Cu₃O₇₋δ (YBCO 93K)',
    subtitle: 'Orthorhombic-I vs Tetragonal-II',
    category: 'Electronic',
    icon: Orbit,
    outcomeBadge: 'Oxygen Vacancy Order',
    outcomeType: 'warning',
    description: 'High-Tc cuprate superconductor transition with distinct (013)/(103)/(110) orthorhombic peak splitting.'
  },
  {
    id: 'hea-cantor',
    title: 'FeCoNiCrMn Cantor Alloy',
    subtitle: 'High-Entropy Single FCC Solid Solution',
    category: 'Lattice Strain',
    icon: MoveHorizontal,
    outcomeBadge: 'Severe Lattice Distortion',
    outcomeType: 'warning',
    description: '5-component equiatomic single-phase FCC matrix exhibiting cocktail effect and anomalous peak broadening.'
  }
];

export const PresetScenariosRibbon: React.FC<PresetScenariosRibbonProps> = ({
  onSelectScenario,
  onOpenGuide,
  onOpenSearchMatch,
  onExportCSV,
  onExportMarkdown
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Benchmarks' },
    { id: 'Biomaterials', label: 'Biomaterials' },
    { id: 'Multi-Phase', label: 'Multi-Phase Mixtures' },
    { id: 'Lattice Strain', label: 'Lattice Strain' },
    { id: 'Energy / Battery', label: 'Battery Cathodes' },
    { id: 'Electronic', label: 'Perovskites & Superconductors' },
    { id: 'Nanomaterials', label: '2D Materials & MXenes' }
  ];

  const filteredPresets = PRESET_SCENARIOS.filter(s => 
    selectedCategory === 'all' || s.category === selectedCategory
  );

  const handleSelect = (scenario: PresetScenarioItem) => {
    setActiveScenarioId(scenario.id);
    onSelectScenario(scenario.id);
  };

  const getBadgeStyle = (type: PresetScenarioItem['outcomeType']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'info':
      default:
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div className="bg-[#080d1a] border-2 border-slate-800/90 rounded-2xl shadow-xl overflow-hidden transition-all">
      {/* Ribbon Header */}
      <div className="p-4 lg:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/80 via-[#080d1a] to-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <span>Quick-Start Benchmark Scenarios</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                1-Click Load
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Explore real-world XRD scenarios: phase identification, lattice strain, multi-phase mixtures, and battery phase transitions.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          <button
            id="btn-open-search-match-top"
            onClick={onOpenSearchMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 shadow-sm cursor-pointer hover:border-amber-400"
            title="Auto-search entire material database to identify best phase match"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Auto Search-Match</span>
          </button>

          <button
            id="btn-open-guide-top"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer hover:border-indigo-400"
            title="Learn how to interpret Rwp, Pearson r, peak shifts, and phase fractions"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>XRD Guide</span>
          </button>
          
          <button
            id="btn-export-csv-top"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer hover:border-emerald-400"
            title="Download full comparison & residual dataset as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {onExportMarkdown && (
            <button
              id="btn-export-md-top"
              onClick={onExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer hover:border-purple-400"
              title="Download publication-grade Markdown scientific report"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Report (.md)</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            title={isExpanded ? 'Collapse Benchmark Library' : 'Expand Benchmark Library'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Benchmark Grid */}
      {isExpanded && (
        <div className="p-4 lg:p-5 space-y-3 bg-[#050914] animate-in fade-in duration-200">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600/90 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {filteredPresets.map((preset) => {
              const IconComp = preset.icon;
              const isSelected = activeScenarioId === preset.id;
              const badgeCls = getBadgeStyle(preset.outcomeType);

              return (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => handleSelect(preset)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Top: Icon + Outcome Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40' 
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60 group-hover:text-cyan-300'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border tracking-tight ${badgeCls}`}>
                      {preset.outcomeBadge}
                    </span>
                  </div>

                  {/* Middle: Title & Subtitle */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {preset.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                      {preset.subtitle}
                    </p>
                  </div>

                  {/* Bottom: Short Description */}
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed border-t border-slate-800/80 pt-2 font-mono">
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
