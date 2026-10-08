import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { X, Layers } from 'lucide-react';
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

export interface QuickWorkflowRibbonProps {
  activeModule: string;
  setActiveModule: (mod: any) => void;
  modules: { id: string; label: string; group?: string }[];
  getModuleIcon: (mod: string, isActive?: boolean) => React.ReactNode;
  theme: string;
  onClose?: () => void;
  isExplained?: boolean;
  setIsExplained?: (exp: boolean) => void;
  onLoadPreset?: (preset: SamplePreset) => void;
  onOpenNavigator?: () => void;
}

export const QuickWorkflowRibbon: React.FC<QuickWorkflowRibbonProps> = ({
  activeModule,
  setActiveModule,
  modules,
  getModuleIcon,
  theme,
  onClose
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory>('all');

  const categories: { id: WorkflowCategory; label: string; groupMatches: string[] }[] = [
    { id: 'all', label: t('All Tools', 'All Tools'), groupMatches: [] },
    { id: 'fundamentals', label: t('Fundamentals', 'Fundamentals'), groupMatches: ['Fundamentals'] },
    { id: 'size_strain', label: t('Size & Strain', 'Size & Strain'), groupMatches: ['Size & Strain'] },
    { id: 'refinement', label: t('Refinement', 'Refinement'), groupMatches: ['Advanced Refinement'] },
    { id: 'simulation_ai', label: t('Simulation & AI', 'Simulation & AI'), groupMatches: ['Advanced Sim', 'AI Tools'] },
    { id: 'intelligence', label: t('Registry & Learn', 'Registry & Learn'), groupMatches: ['Intelligence'] }
  ];

  const filteredModules = React.useMemo(() => {
    if (selectedCategory === 'all') {
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

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full border-b select-none overflow-hidden z-10 shrink-0 ${
        theme === 'cyberpunk'
          ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent'
          : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
        {/* Left: Category Filter Pills */}
        <div className="flex items-center gap-1 shrink-0 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                playSynthTone('switch');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Center: Module Chips */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto py-0.5">
          {filteredModules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id);
                  playSynthTone('xrd_scan');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 border-slate-200/70 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                {getModuleIcon(m.id, isActive)}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Close Ribbon */}
        {onClose && (
          <button
            onClick={() => {
              onClose();
              playSynthTone('switch');
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title={t('Close Quick Ribbon', 'Close Quick Ribbon')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
