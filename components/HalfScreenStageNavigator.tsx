import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sliders, 
  Play, 
  BarChart2, 
  Table, 
  History, 
  Maximize2, 
  Columns,
  Layers,
  ArrowUp
} from 'lucide-react';
import { useDisplayMode } from './DisplayModeContext';

export interface StageItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  stepNumber: number;
}

interface HalfScreenStageNavigatorProps {
  stages?: StageItem[];
  activeStage?: string;
  className?: string;
}

export const HalfScreenStageNavigator: React.FC<HalfScreenStageNavigatorProps> = ({
  stages = [
    { id: 'stage-inputs', label: 'Inputs', stepNumber: 1, icon: <Sliders className="w-3 h-3" /> },
    { id: 'stage-operations', label: 'Operations', stepNumber: 2, icon: <Play className="w-3 h-3" /> },
    { id: 'stage-visualizer', label: 'Spectrum', stepNumber: 3, icon: <BarChart2 className="w-3 h-3" /> },
    { id: 'stage-results', label: 'Results', stepNumber: 4, icon: <Table className="w-3 h-3" /> },
    { id: 'stage-history', label: 'Archives', stepNumber: 5, icon: <History className="w-3 h-3" /> },
  ],
  activeStage,
  className = ''
}) => {
  const { t } = useTranslation();
  const { displayMode, setDisplayMode } = useDisplayMode();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`sticky top-2 z-30 p-1.5 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl flex items-center justify-between gap-1 mb-4 ${className}`}>
      {/* Quick Stage Jump Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 max-w-full">
        {stages.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleScrollTo(stage.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
              }`}
              title={`Jump to Step ${stage.stepNumber}: ${stage.label}`}
            >
              <span className="opacity-75">{stage.stepNumber}.</span>
              {stage.icon}
              <span>{stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Switch to Fullscreen Quick Action */}
      <button
        type="button"
        onClick={() => setDisplayMode('fullscreen')}
        className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 shrink-0 transition-colors cursor-pointer ml-1"
        title={t('Expand to Full-Screen Mode', 'Expand to Full-Screen Mode')}
      >
        <Maximize2 className="w-3 h-3" />
        <span className="hidden sm:inline">{t('Expand', 'Expand')}</span>
      </button>
    </div>
  );
};
