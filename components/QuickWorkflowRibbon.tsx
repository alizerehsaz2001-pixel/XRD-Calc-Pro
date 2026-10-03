import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  Database,
  FlaskConical,
  Zap,
  Activity,
  Microscope,
  TrendingUp,
  Sliders,
  Grid,
  Search,
  BookOpen,
  Keyboard,
  CheckCircle2,
  Bookmark,
  Share2,
  HelpCircle,
  X
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

export type WorkflowCategory = 'all' | 'fundamentals' | 'size_strain' | 'refinement' | 'simulation_ai' | 'intelligence';

export interface SamplePreset {
  id: string;
  name: string;
  chemicalFormula: string;
  category: string;
  crystalSystem: string;
  description: string;
  wavelength: number;
  peaks: string;
  hkl: string;
  targetModule: string;
  badge: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'nist-si-640d',
    name: 'Silicon (NIST SRM 640d)',
    chemicalFormula: 'Si',
    category: 'Lattice Standard',
    crystalSystem: 'FCC',
    description: 'NIST certified standard reference material. Sharp Bragg reflections with negligible microstrain (a = 5.4312 Å).',
    wavelength: 1.5406,
    peaks: '28.44:100, 47.30:55, 56.12:30, 69.13:8, 76.38:12, 88.03:15',
    hkl: '111, 220, 311, 400, 331, 422',
    targetModule: 'bragg',
    badge: 'NIST Standard'
  },
  {
    id: 'anatase-nano-tio2',
    name: 'Anatase Titanium Dioxide',
    chemicalFormula: 'TiO₂',
    category: 'Nanomaterial',
    crystalSystem: 'TETRAGONAL_P',
    description: 'Nanocrystalline photocatalytic anatase. Exhibits pronounced size broadening with subtle strain.',
    wavelength: 1.5406,
    peaks: '25.28:100, 37.80:20, 48.05:35, 53.89:20, 55.06:20, 62.69:15',
    hkl: '101, 004, 200, 105, 211, 204',
    targetModule: 'scherrer',
    badge: 'Size-Broadened'
  },
  {
    id: 'corundum-al2o3',
    name: 'Corundum α-Alumina',
    chemicalFormula: 'α-Al₂O₃',
    category: 'RIR Standard',
    crystalSystem: 'HEXAGONAL',
    description: 'Universal Reference Intensity Ratio standard (I/Ic = 1.00). High hardness, hexagonal lattice.',
    wavelength: 1.5406,
    peaks: '25.58:75, 35.15:100, 37.78:40, 43.35:80, 52.55:45, 57.50:80, 66.52:35, 68.21:45',
    hkl: '012, 104, 110, 113, 024, 116, 214, 300',
    targetModule: 'rir',
    badge: 'RIR Benchmark'
  },
  {
    id: 'alpha-quartz-sio2',
    name: 'α-Quartz (Low Quartz)',
    chemicalFormula: 'SiO₂',
    category: 'Mineral Standard',
    crystalSystem: 'TRIGONAL',
    description: 'Trigonal silica standard (P3221). Prominent (101) reflection at 26.64° 2θ.',
    wavelength: 1.5406,
    peaks: '20.85:22, 26.64:100, 36.54:8, 39.46:12, 40.29:8, 42.45:9, 45.79:4, 50.14:14',
    hkl: '100, 101, 110, 102, 111, 200, 201, 112',
    targetModule: 'bragg',
    badge: 'Mineral Standard'
  },
  {
    id: 'retained-austenite-steel',
    name: 'Duplex Steel (Austenite + Ferrite)',
    chemicalFormula: 'γ-Fe + α-Fe',
    category: 'Engineering Alloy',
    crystalSystem: 'FCC',
    description: 'Dual-phase structural steel for residual stress, retained austenite quantification and lattice distortion.',
    wavelength: 1.5406,
    peaks: '43.60:85, 44.67:100, 50.70:45, 64.90:35, 74.60:25, 82.30:20',
    hkl: '111, 110, 200, 200, 220, 211',
    targetModule: 'wh',
    badge: 'Dual Phase'
  }
];

interface QuickWorkflowRibbonProps {
  activeModule: string;
  setActiveModule: (mod: any) => void;
  modules: { id: string; label: string; group?: string }[];
  getModuleIcon: (mod: string, isActive?: boolean) => React.ReactNode;
  theme: string;
  isExplained: boolean;
  setIsExplained: (exp: boolean) => void;
  onLoadPreset?: (preset: SamplePreset) => void;
  onOpenNavigator?: () => void;
}

export const QuickWorkflowRibbon: React.FC<QuickWorkflowRibbonProps> = ({
  activeModule,
  setActiveModule,
  modules,
  getModuleIcon,
  theme,
  isExplained,
  setIsExplained,
  onLoadPreset,
  onOpenNavigator
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory>('all');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [presetSuccessToast, setPresetSuccessToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<any>(null);

  const activeModuleObj = modules.find(m => m.id === activeModule);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPresetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories: { id: WorkflowCategory; label: string; groupMatches: string[] }[] = [
    { id: 'all', label: t('All Suites', 'All Suites'), groupMatches: [] },
    { id: 'fundamentals', label: t('Fundamentals', 'Fundamentals'), groupMatches: ['Fundamentals'] },
    { id: 'size_strain', label: t('Size & Strain', 'Size & Strain'), groupMatches: ['Size & Strain'] },
    { id: 'refinement', label: t('Refinement', 'Refinement'), groupMatches: ['Advanced Refinement'] },
    { id: 'simulation_ai', label: t('Simulation & AI', 'Simulation & AI'), groupMatches: ['Advanced Sim', 'AI Tools'] },
    { id: 'intelligence', label: t('Databases & Learn', 'Databases & Learn'), groupMatches: ['Intelligence'] }
  ];

  const filteredModules = React.useMemo(() => {
    if (selectedCategory === 'all') {
      // Pick top 12 most active tools for the clean horizontal ribbon
      const priorityIds = [
        'bragg', 'scherrer', 'wh', 'rir', 'pawley_lebail', 'cohen', 
        'rietveld', 'fwhm', 'compare', 'periodic_table', 'database', 'settings'
      ];
      return modules.filter(m => priorityIds.includes(m.id));
    }
    const catObj = categories.find(c => c.id === selectedCategory);
    if (!catObj) return modules;
    return modules.filter(m => m.group && catObj.groupMatches.includes(m.group));
  }, [selectedCategory, modules]);

  const handleApplyPreset = (preset: SamplePreset) => {
    setShowPresetDropdown(false);
    playSynthTone('chime');

    if (onLoadPreset) {
      onLoadPreset(preset);
    }

    setPresetSuccessToast(`${preset.name} (${preset.chemicalFormula}) loaded!`);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setPresetSuccessToast(null);
    }, 4000);
  };

  return (
    <div className={`w-full border-b select-none transition-colors duration-200 z-10 shrink-0 ${
      theme === 'cyberpunk'
        ? 'bg-black/90 border-cyber-accent/20 text-cyber-accent'
        : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-200'
    }`}>
      {/* Upper Breadcrumbs & Quick Action Controls Row */}
      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Breadcrumbs Trail */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-mono font-medium hover:text-indigo-500 cursor-pointer" onClick={onOpenNavigator}>
            XRD-CalcPro
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-slate-500 dark:text-slate-400 font-semibold">
            {activeModuleObj?.group || t('Suite')}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/20">
            {getModuleIcon(activeModule, true)}
            <span className="text-xs">{activeModuleObj?.label || activeModule}</span>
          </div>
        </div>

        {/* Right: Quick Demo Sample Presets & Interactive Guide Trigger */}
        <div className="flex items-center gap-2 relative">
          {/* Quick Demo Dataset Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowPresetDropdown(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${
                showPresetDropdown
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/30'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 hover:border-amber-400'
              }`}
              title={t('Load pre-configured NIST or standard diffraction datasets', 'Load pre-configured NIST or standard diffraction datasets')}
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('Load Sample Data', 'Load Sample Data')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPresetDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showPresetDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl p-3 z-50 overflow-hidden ${
                    theme === 'cyberpunk'
                      ? 'bg-black border-cyber-accent text-cyber-accent shadow-[0_0_25px_rgba(0,255,255,0.25)]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-slate-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        {t('Standard Reference Datasets', 'Standard Reference Datasets')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">1-Click Load</span>
                  </div>

                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                    {SAMPLE_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className="p-2.5 rounded-xl border border-transparent hover:border-indigo-500/30 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                            {preset.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 font-bold border border-indigo-500/20">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                          {preset.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[9.5px] font-mono text-slate-400 dark:text-slate-500">
                          <span>λ: {preset.wavelength} Å</span>
                          <span>•</span>
                          <span>Lattice: {preset.crystalSystem}</span>
                          <span>•</span>
                          <span className="text-indigo-500 dark:text-indigo-400 font-bold uppercase">→ {preset.targetModule}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theory & Guide Drawer Toggle */}
          <button
            onClick={() => {
              setIsExplained(!isExplained);
              playSynthTone('switch');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${
              !isExplained
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={t('Toggle mathematical equations & theory guide', 'Toggle mathematical equations & theory guide')}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{!isExplained ? t('Hide Theory', 'Hide Theory') : t('Theory & Math', 'Theory & Math')}</span>
          </button>

          {/* Quick Command Palette Button */}
          <button
            onClick={onOpenNavigator}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Search all modules (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Toast Confirmation Banner */}
      <AnimatePresence>
        {presetSuccessToast && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-500/10 border-t border-b border-emerald-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{presetSuccessToast} - Ready for live calculation and visualization.</span>
            </div>
            <button onClick={() => setPresetSuccessToast(null)} className="p-0.5 hover:text-emerald-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lower Row: Workflow Category Switcher & Fast-Switch Module Pills */}
      <div className="max-w-7xl mx-auto px-4 lg:px-10 pb-2 flex items-center gap-3 overflow-x-auto custom-scrollbar">
        {/* Category Selector Tabs */}
        <div className="flex items-center gap-1 shrink-0 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                playSynthTone('switch');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

        {/* Horizontal Quick-Switch Module Chips */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto py-0.5">
          {filteredModules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id);
                  playSynthTone('switch');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                {getModuleIcon(m.id, isActive)}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
