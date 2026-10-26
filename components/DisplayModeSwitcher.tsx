import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Maximize2, 
  Minimize2, 
  PanelLeft, 
  PanelRight, 
  Columns, 
  Layers, 
  ArrowRight,
  Monitor,
  Smartphone,
  SplitSquareVertical
} from 'lucide-react';
import { useDisplayMode, DisplayMode, HalfScreenPosition } from './DisplayModeContext';

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
    setHalfScreenPosition,
    isBrowserFullscreen,
    toggleBrowserFullscreen
  } = useDisplayMode();

  return (
    <div className={`flex items-center gap-1.5 p-1 bg-slate-900/90 dark:bg-black/80 rounded-xl border border-white/10 shadow-lg backdrop-blur-md ${className}`}>
      {/* Mode Segmented Buttons */}
      <div className="flex items-center gap-0.5">
        {/* Full-Screen Mode Button */}
        <button
          type="button"
          onClick={() => setDisplayMode('fullscreen')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            displayMode === 'fullscreen'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title={t('Full-Screen Mode: Complete sequential view with full dependency pipeline (Alt+F)', 'Full-Screen Mode: Complete sequential view with full dependency pipeline (Alt+F)')}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {!compact && (
            <span className="hidden sm:inline">
              {t('Full-Screen', 'Full-Screen')}
            </span>
          )}
        </button>

        {/* Half-Screen Mode Button */}
        <button
          type="button"
          onClick={() => setDisplayMode('halfscreen')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            displayMode === 'halfscreen'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title={t('Half-Screen Mode: 50% split multitasking workspace for side-by-side analysis (Alt+F)', 'Half-Screen Mode: 50% split multitasking workspace for side-by-side analysis (Alt+F)')}
        >
          <Columns className="w-3.5 h-3.5" />
          {!compact && (
            <span className="hidden sm:inline">
              {t('Half-Screen', 'Half-Screen')}
            </span>
          )}
        </button>
      </div>

      {/* Half-Screen Docking Position Selectors (Only shown in half-screen mode) */}
      {displayMode === 'halfscreen' && (
        <div className="flex items-center gap-0.5 pl-1 border-l border-white/10 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setHalfScreenPosition('left')}
            className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              halfScreenPosition === 'left'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={t('Dock to Left 50%', 'Dock to Left 50%')}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setHalfScreenPosition('center')}
            className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              halfScreenPosition === 'center'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={t('Center 50% Multitasking Width', 'Center 50% Multitasking Width')}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setHalfScreenPosition('right')}
            className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              halfScreenPosition === 'right'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={t('Dock to Right 50%', 'Dock to Right 50%')}
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
