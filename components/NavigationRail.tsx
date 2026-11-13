import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PanelLeftOpen,
  Search
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';
import { CrystallographicBrandEmblem } from './TopAppBar';
import { getModuleScientificMeta } from './LeftSidebarGraphics';

interface NavigationRailProps {
  activeModule: string;
  setActiveModule: (mod: any) => void;
  modules: { id: string; label: string; group?: string }[];
  getModuleIcon: (mod: string, isActive?: boolean) => React.ReactNode;
  theme: string;
  onExpandSidebar: () => void;
  onOpenNavigator: () => void;
  onOpenWelcome?: () => void;
  onOpenWhyXrd?: () => void;
}

const NavigationRailComponent: React.FC<NavigationRailProps> = ({
  activeModule,
  setActiveModule,
  getModuleIcon,
  theme,
  onExpandSidebar,
  onOpenNavigator,
  onOpenWelcome,
  onOpenWhyXrd
}) => {
  const { t } = useTranslation();
  const isCyber = theme === 'cyberpunk';

  // Curated list of prominent modules to display in the mini-rail
  const railModules: { id: string; label: string; group: string }[] = [
    { id: 'bragg', label: t('Bragg Basics', 'Bragg Basics'), group: 'Fundamentals' },
    { id: 'unit_cells', label: t('14 Bravais Lattices', '14 Bravais Lattices'), group: 'Fundamentals' },
    { id: 'fwhm', label: t('FWHM Analysis', 'FWHM Analysis'), group: 'Fundamentals' },
    { id: 'scherrer', label: t('Scherrer Size', 'Scherrer Size'), group: 'Size & Strain' },
    { id: 'wh', label: t('Williamson-Hall', 'Williamson-Hall'), group: 'Size & Strain' },
    { id: 'integral_adv', label: t('IB Advanced (SSP)', 'IB Advanced (SSP)'), group: 'Size & Strain' },
    { id: 'rir', label: t('RIR Analysis', 'RIR Analysis'), group: 'Refinement' },
    { id: 'pawley_lebail', label: t('Pawley & Le Bail', 'Pawley & Le Bail'), group: 'Refinement' },
    { id: 'rietveld', label: t('Rietveld Fit', 'Rietveld Fit'), group: 'Refinement' },
    { id: 'pdf_analysis', label: t('Pair Dist. G(r)', 'Pair Dist. G(r)'), group: 'Refinement' },
    { id: 'cohen', label: t('Cohen Matrix', 'Cohen Matrix'), group: 'Refinement' },
    { id: 'dl', label: t('PhaseID Net', 'PhaseID Net'), group: 'AI Tools' },
    { id: 'periodic_table', label: t('Periodic Table', 'Periodic Table'), group: 'Registry' },
    { id: 'database', label: t('Materials', 'Materials'), group: 'Registry' },
    { id: 'settings', label: t('Settings', 'Settings'), group: 'Config' }
  ];

  return (
    <nav
      className={`hidden md:flex flex-col items-center justify-between w-16 border-r py-3 z-20 shrink-0 select-none transition-all duration-300 relative ${
        isCyber
          ? 'bg-black/95 border-cyber-accent/30 text-cyber-accent shadow-lg shadow-cyber-accent/5'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800/90 shadow-xs'
      }`}
      aria-label="Compact Navigation Rail"
    >
      {/* Subtle Vertical Goniometer 2θ Vernier Scale SVG along right border */}
      <svg
        viewBox="0 0 10 400"
        fill="none"
        preserveAspectRatio="none"
        className="w-2.5 h-full absolute right-0 top-0 pointer-events-none opacity-25 dark:opacity-35"
        aria-hidden="true"
      >
        {Array.from({ length: 41 }).map((_, idx) => {
          const y = idx * 10;
          const isMajor = idx % 5 === 0;
          return (
            <line
              key={idx}
              x1={isMajor ? 2 : 6}
              y1={y}
              x2="10"
              y2={y}
              stroke="currentColor"
              strokeWidth={isMajor ? '1.2' : '0.7'}
              className="text-slate-400 dark:text-slate-600"
            />
          );
        })}
      </svg>

      {/* Top: Bespoke Crystallographic Emblem & Scientific Portal Triggers */}
      <div className="flex flex-col items-center gap-2 w-full z-10">
        {/* App Logo Mini Button */}
        <button
          onClick={onExpandSidebar}
          className="group cursor-pointer transition-transform active:scale-95 relative"
          title={t('Expand Full Instrument Sidebar', 'Expand Full Instrument Sidebar')}
        >
          <CrystallographicBrandEmblem size="lg" theme={theme} />
        </button>

        {/* Why XRD? Disciplines Button (Mini Rail) */}
        {onOpenWhyXrd && (
          <button
            onClick={() => {
              onOpenWhyXrd();
              playSynthTone('switch');
            }}
            className="w-10 h-9 rounded-xl flex items-center justify-center text-amber-500 dark:text-amber-400 bg-amber-500/[0.06] hover:bg-amber-500/15 transition-all cursor-pointer relative group border border-amber-500/25"
            title={t('Why XRD? 8+ Scientific Disciplines', 'Why XRD? 8+ Scientific Disciplines')}
          >
            <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4">
              <circle cx="9" cy="9" r="2" fill="currentColor" />
              <ellipse cx="9" cy="9" rx="7" ry="2.8" transform="rotate(30 9 9)" stroke="currentColor" strokeWidth="1.2" />
              <ellipse cx="9" cy="9" rx="7" ry="2.8" transform="rotate(-30 9 9)" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-950 text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 border border-amber-500/30 text-left">
              <div className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                DISCIPLINE ATLAS
              </div>
              <div className="text-[11px] font-semibold">
                {t('Why XRD? Disciplines', 'Why XRD? Disciplines')}
              </div>
            </div>
          </button>
        )}

        {/* Welcome Page & 3D Lab Tour Button (Mini Rail) */}
        {onOpenWelcome && (
          <button
            onClick={() => {
              onOpenWelcome();
              playSynthTone('switch');
            }}
            className="w-10 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer relative group border border-transparent hover:border-indigo-500/25"
            title={t('3D Interactive Welcome Showcase', '3D Interactive Welcome Showcase')}
          >
            <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4">
              <polygon
                points="9,1.5 15.5,5.2 15.5,12.8 9,16.5 2.5,12.8 2.5,5.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <polyline points="2.5,5.2 9,9 15.5,5.2" stroke="currentColor" strokeWidth="1.1" />
              <line x1="9" y1="9" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-950 text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 border border-slate-700 text-left">
              <div className="text-[9px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                3D LAB SHOWCASE
              </div>
              <div className="text-[11px] font-semibold">
                {t('Welcome & Lab Tour', 'Welcome & Lab Tour')}
              </div>
            </div>
          </button>
        )}

        {/* Quick Search Icon Button */}
        <button
          onClick={() => {
            onOpenNavigator();
            playSynthTone('switch');
          }}
          className="w-10 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group border border-slate-200/70 dark:border-slate-800"
          title={t('Search All 30+ Tools (Ctrl+K)', 'Search All Tools (Ctrl+K)')}
        >
          <Search className="w-3.5 h-3.5" />
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-950 text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 border border-slate-700 text-left">
            <div className="text-[9px] font-mono uppercase tracking-wider text-sky-400 font-bold">
              COMMAND PALETTE · CTRL+K
            </div>
            <div className="text-[11px] font-semibold">
              {t('Search All 33 Modules', 'Search All 33 Modules')}
            </div>
          </div>
        </button>

        {/* Wavevector SVG Divider */}
        <svg viewBox="0 0 40 6" fill="none" className="w-10 h-1.5 text-slate-300 dark:text-slate-700">
          <line x1="2" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="1" />
          <circle cx="20" cy="3" r="1.5" fill="currentColor" />
          <line x1="25" y1="3" x2="38" y2="3" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Center: Scrollable Scientific Icon Rail */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center gap-1.5 py-1.5 w-full px-2 z-10">
        {railModules.map((item, index) => {
          const isActive = activeModule === item.id;
          const meta = getModuleScientificMeta(item.id);
          const prevGroup = index > 0 ? railModules[index - 1].group : item.group;
          const showGroupDivider = index > 0 && prevGroup !== item.group;

          return (
            <React.Fragment key={item.id}>
              {showGroupDivider && (
                <div className="w-6 h-px bg-slate-200/80 dark:bg-slate-800/90 my-0.5 shrink-0" />
              )}
              <div className="relative group flex items-center justify-center w-full">
                <button
                  onClick={() => {
                    setActiveModule(item.id);
                    playSynthTone('xrd_scan');
                  }}
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative border ${
                    isActive
                      ? isCyber
                        ? 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent shadow-[0_0_12px_rgba(0,255,159,0.3)]'
                        : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {getModuleIcon(item.id, isActive)}
                  <span
                    className={`text-[7.5px] font-mono font-bold tracking-tighter leading-none mt-0.5 tabular-nums ${
                      isActive
                        ? isCyber
                          ? 'text-cyber-accent'
                          : 'text-indigo-100'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300'
                    }`}
                  >
                    {meta.symbol}
                  </span>
                  {isActive && (
                    <span
                      className={`absolute -left-2 w-1 h-6 rounded-r-full ${
                        isCyber ? 'bg-cyber-accent shadow-[0_0_8px_#00ff9f]' : 'bg-indigo-500'
                      }`}
                    />
                  )}
                </button>

                {/* Scientific Telemetry Hover Flyout */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 dark:bg-slate-950 text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex flex-col whitespace-nowrap min-w-[180px] border border-slate-700/90">
                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold font-mono">
                      {item.group}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                      {meta.categoryCode}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-100">
                    {item.label}
                  </span>
                  <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between gap-2 text-[9.5px] font-mono text-amber-300/90">
                    <span>{meta.formula}</span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom: Sidebar Expand / Pin Button */}
      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 w-full px-2 z-10">
        <button
          onClick={onExpandSidebar}
          className="w-10 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer relative group border border-slate-200/60 dark:border-slate-800"
          title={t('Expand Full Instrument Sidebar', 'Expand Full Instrument Sidebar')}
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50 border border-slate-700">
            {t('Pin Full Sidebar', 'Pin Full Sidebar')}
          </span>
        </button>
      </div>
    </nav>
  );
};

export const NavigationRail = React.memo(NavigationRailComponent);
export default NavigationRail;
