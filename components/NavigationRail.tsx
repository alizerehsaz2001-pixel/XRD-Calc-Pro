import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PanelLeftOpen,
  Search,
  BookOpen,
  Sparkles,
  Command,
  Sun,
  Moon,
  Zap,
  Activity,
  Microscope,
  TrendingUp,
  Layers,
  Sliders,
  Grid,
  Database,
  User,
  Settings2,
  Atom,
  Clock,
  Compass
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

interface NavigationRailProps {
  activeModule: string;
  setActiveModule: (mod: any) => void;
  modules: { id: string; label: string; group?: string }[];
  getModuleIcon: (mod: string, isActive?: boolean) => React.ReactNode;
  theme: string;
  onExpandSidebar: () => void;
  onOpenNavigator: () => void;
  onOpenWelcome?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeModule,
  setActiveModule,
  modules,
  getModuleIcon,
  theme,
  onExpandSidebar,
  onOpenNavigator,
  onOpenWelcome
}) => {
  const { t } = useTranslation();

  // Curated list of prominent modules to display in the mini-rail
  const railModules: { id: string; label: string; group: string }[] = [
    { id: 'bragg', label: t('Bragg Basics', 'Bragg Basics'), group: 'Fundamentals' },
    { id: 'fwhm', label: t('FWHM Analysis', 'FWHM Analysis'), group: 'Fundamentals' },
    { id: 'scherrer', label: t('Scherrer Size', 'Scherrer Size'), group: 'Size & Strain' },
    { id: 'wh', label: t('Williamson-Hall', 'Williamson-Hall'), group: 'Size & Strain' },
    { id: 'rir', label: t('RIR Analysis', 'RIR Analysis'), group: 'Refinement' },
    { id: 'pawley_lebail', label: t('Pawley & Le Bail', 'Pawley & Le Bail'), group: 'Refinement' },
    { id: 'cohen', label: t('Cohen Matrix', 'Cohen Matrix'), group: 'Refinement' },
    { id: 'rietveld', label: t('Rietveld Setup', 'Rietveld Setup'), group: 'Simulation' },
    { id: 'dl', label: t('PhaseID Net', 'PhaseID Net'), group: 'AI Tools' },
    { id: 'periodic_table', label: t('Periodic Table', 'Periodic Table'), group: 'Registry' },
    { id: 'database', label: t('Materials', 'Materials'), group: 'Registry' },
    { id: 'settings', label: t('Settings', 'Settings'), group: 'Config' }
  ];

  return (
    <nav
      className={`hidden md:flex flex-col items-center justify-between w-16 border-r py-3 z-20 shrink-0 select-none transition-all duration-300 ${
        theme === 'cyberpunk'
          ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent shadow-lg shadow-cyber-accent/5'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/10 shadow-sm'
      }`}
      aria-label="Compact Navigation Rail"
    >
      {/* Top: Logo & Search Command Trigger */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* App Logo Mini Button */}
        <button
          onClick={onExpandSidebar}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-md ${
            theme === 'cyberpunk'
              ? 'bg-cyber-pink shadow-[0_0_12px_rgba(255,0,255,0.6)]'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/25'
          }`}
          title={t('Expand Full Sidebar (Click to pin)', 'Expand Full Sidebar')}
        >
          <span>λ</span>
        </button>

        {/* Welcome Page Button (Mini Rail) */}
        {onOpenWelcome && (
          <button
            onClick={() => {
              onOpenWelcome();
              playSynthTone('switch');
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer relative group"
            title={t('Welcome Page & Showcase', 'Welcome Page & Showcase')}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
              {t('Welcome Page', 'Welcome Page')}
            </span>
          </button>
        )}

        {/* Quick Search Icon Button */}
        <button
          onClick={() => {
            onOpenNavigator();
            playSynthTone('switch');
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group"
          title={t('Search All 30+ Tools (Ctrl+K)', 'Search All Tools (Ctrl+K)')}
        >
          <Search className="w-4 h-4" />
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
            {t('Search (Ctrl+K)', 'Search (Ctrl+K)')}
          </span>
        </button>

        <div className="w-8 h-px bg-slate-200 dark:bg-white/10" />
      </div>

      {/* Center: Scrollable Icon Rail */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center gap-1.5 py-2 w-full px-2">
        {railModules.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <div key={item.id} className="relative group flex items-center justify-center w-full">
              <button
                onClick={() => {
                  setActiveModule(item.id);
                  playSynthTone('xrd_scan');
                }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5'
                }`}
              >
                {getModuleIcon(item.id, isActive)}
                {isActive && (
                  <span className="absolute -left-2 w-1.5 h-5 bg-indigo-500 rounded-r-full shadow-sm" />
                )}
              </button>

              {/* Hover Tooltip Badge */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex flex-col whitespace-nowrap min-w-max border border-white/10">
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold font-mono">
                  {item.group}
                </span>
                <span className="text-xs font-semibold text-slate-100">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Sidebar Expand / Pin Button */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10 w-full px-2">
        <button
          onClick={onExpandSidebar}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group"
          title={t('Expand Full Sidebar', 'Expand Full Sidebar')}
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
            {t('Expand Sidebar', 'Expand Sidebar')}
          </span>
        </button>
      </div>
    </nav>
  );
};
