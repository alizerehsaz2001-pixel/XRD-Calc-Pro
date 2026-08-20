import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  HelpCircle, 
  FileSpreadsheet, 
  CheckCircle2, 
  MoveHorizontal, 
  Layers3, 
  Database,
  Search,
  Orbit,
  Flame,
  Layers,
  Zap,
  SplitSquareVertical
} from 'lucide-react';

interface PresetScenariosRibbonProps {
  onSelectScenario: (key: string) => void;
  onOpenGuide: () => void;
  onOpenSearchMatch: () => void;
  onExportCSV: () => void;
}

export const PRESET_SCENARIOS = [
  {
    id: 'pure-ha',
    title: 'Pure Hydroxyapatite',
    subtitle: 'Single Phase 99.8%',
    category: 'Biomaterials',
    icon: CheckCircle2,
    colorClass: 'emerald',
    badge: '1 Phase'
  },
  {
    id: 'strained-ha',
    title: 'Zn-Doped Strained HAp',
    subtitle: '+0.12° 2θ Tensile Shift',
    category: 'Lattice Strain',
    icon: MoveHorizontal,
    colorClass: 'amber',
    badge: 'Strain'
  },
  {
    id: 'biphasic-ha-tcp',
    title: 'Biphasic HAp + β-TCP',
    subtitle: '65% HAp / 35% β-TCP',
    category: 'Multi-Phase',
    icon: Layers3,
    colorClass: 'indigo',
    badge: '2 Phases'
  },
  {
    id: 'triphasic-tio2',
    title: 'TiO₂ Anatase / Rutile / Brookite',
    subtitle: '3-Polymorph Mixture',
    category: 'Multi-Phase',
    icon: Flame,
    colorClass: 'rose',
    badge: '3 Phases'
  },
  {
    id: 'battery-lifepo4',
    title: 'LiFePO₄ Cathode Phase Transition',
    subtitle: 'Delithiation to FePO₄',
    category: 'Energy / Battery',
    icon: Orbit,
    colorClass: 'purple',
    badge: 'Redox'
  },
  {
    id: 'quartz',
    title: 'Alpha-Quartz α-SiO₂',
    subtitle: 'NIST Standard Reference',
    category: 'Minerals',
    icon: Database,
    colorClass: 'cyan',
    badge: 'Standard'
  },
  {
    id: 'perovskite-batio3',
    title: 'BaTiO₃ Tetragonal Split',
    subtitle: 'Ferroelectric (002)/(200) Split',
    category: 'Electronic',
    icon: SplitSquareVertical,
    colorClass: 'fuchsia',
    badge: 'Tetragonal'
  },
  {
    id: 'graphene-intercalation',
    title: 'Graphite → Graphene Oxide',
    subtitle: 'Intercalation 26.6° to 10.8°',
    category: 'Nanomaterials',
    icon: Zap,
    colorClass: 'teal',
    badge: 'Expansion'
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

  const filteredPresets = PRESET_SCENARIOS.filter(s => 
    selectedCategory === 'all' || s.category.toLowerCase().includes(selectedCategory.toLowerCase())
  );

  return (
    <div className="bg-[#080d1a] border-2 border-slate-800/90 p-4 lg:p-5 rounded-2xl shadow-xl space-y-4">
      {/* Top Controls & Category Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-100">
                1-Click Crystallography Comparison Scenarios
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {PRESET_SCENARIOS.length} Benchmark Scenarios
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Simulate pure standards, microstrains, 2-phase & 3-phase mixtures, and battery cathode phase transitions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSearchMatch}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 shadow-sm cursor-pointer hover:scale-105"
            title="Auto-search entire material database to identify best phase match"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Search-Match Database</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Interpretation Guide</span>
          </button>
          
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer"
            title="Download full comparison & residual report as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {filteredPresets.map(preset => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectScenario(preset.id)}
              className="flex items-start gap-2.5 p-2.5 bg-[#030712] hover:bg-slate-900/90 border border-slate-800 hover:border-slate-600 rounded-xl text-left transition-all group hover:scale-[1.02] active:scale-98 cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-white truncate">
                    {preset.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-slate-400 shrink-0">
                    {preset.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  {preset.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
