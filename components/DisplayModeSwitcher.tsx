import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDisplayMode } from './DisplayModeContext';

interface DisplayModeSwitcherProps {
  className?: string;
  compact?: boolean;
}

export const DisplayModeSwitcher: React.FC<DisplayModeSwitcherProps> = ({
  className = '',
  compact = false
}) => {
  const { t } = useTranslation();
  const {
    displayMode,
    setDisplayMode,
    halfScreenPosition,
    setHalfScreenPosition
  } = useDisplayMode();

  return (
    <div
      className={`flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 ${className}`}
    >
      {/* Mode Segmented Buttons */}
      <div className="flex items-center gap-0.5">
        {/* Full-Screen Mode Button with Custom Viewport SVG */}
        <button
          type="button"
          onClick={() => setDisplayMode('fullscreen')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            displayMode === 'fullscreen'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title={t(
            'Full-Screen Mode: Complete sequential view with full dependency pipeline (Alt+F)',
            'Full-Screen Mode: Complete sequential view with full dependency pipeline (Alt+F)'
          )}
        >
          <svg viewBox="0 0 16 14" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="14"
              height="12"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <rect
              x="3"
              y="3"
              width="10"
              height="8"
              rx="1"
              fill="currentColor"
              fillOpacity={displayMode === 'fullscreen' ? '0.25' : '0.08'}
            />
            <path
              d="M 4 9 L 6.5 6.5 L 8.5 8 L 12 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!compact && (
            <span className="hidden sm:inline">
              {t('Full-Screen', 'Full-Screen')}
            </span>
          )}
        </button>

        {/* Half-Screen Mode Button with Custom Split-Stage SVG */}
        <button
          type="button"
          onClick={() => setDisplayMode('halfscreen')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            displayMode === 'halfscreen'
              ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title={t(
            'Half-Screen Mode: 50% split multitasking workspace for side-by-side analysis (Alt+F)',
            'Half-Screen Mode: 50% split multitasking workspace for side-by-side analysis (Alt+F)'
          )}
        >
          <svg viewBox="0 0 16 14" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="14"
              height="12"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <line x1="8" y1="1.5" x2="8" y2="12.5" stroke="currentColor" strokeWidth="1.3" />
            <rect
              x="2.5"
              y="2.5"
              width="4.2"
              height="9"
              rx="0.7"
              fill="currentColor"
              fillOpacity={displayMode === 'halfscreen' ? '0.35' : '0.12'}
            />
          </svg>
          {!compact && (
            <span className="hidden sm:inline">
              {t('Half-Screen', 'Half-Screen')}
            </span>
          )}
        </button>
      </div>

      {/* Half-Screen Docking Position Selectors (Only shown in half-screen mode) */}
      {displayMode === 'halfscreen' && (
        <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setHalfScreenPosition('left')}
            className={`p-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              halfScreenPosition === 'left'
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('Dock to Left 50%', 'Dock to Left 50%')}
          >
            <svg viewBox="0 0 14 12" className="w-3.5 h-3" aria-hidden="true">
              <rect x="1" y="1" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <rect x="2" y="2" width="5" height="8" rx="0.5" fill="currentColor" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setHalfScreenPosition('center')}
            className={`p-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              halfScreenPosition === 'center'
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('Center 50% Multitasking Width', 'Center 50% Multitasking Width')}
          >
            <svg viewBox="0 0 14 12" className="w-3.5 h-3" aria-hidden="true">
              <rect x="1" y="1" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <rect x="4.5" y="2" width="5" height="8" rx="0.5" fill="currentColor" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setHalfScreenPosition('right')}
            className={`p-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              halfScreenPosition === 'right'
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('Dock to Right 50%', 'Dock to Right 50%')}
          >
            <svg viewBox="0 0 14 12" className="w-3.5 h-3" aria-hidden="true">
              <rect x="1" y="1" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <rect x="7" y="2" width="5" height="8" rx="0.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
