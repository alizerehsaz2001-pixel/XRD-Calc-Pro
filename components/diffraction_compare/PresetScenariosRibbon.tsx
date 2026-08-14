import React from 'react';
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
  Flame
} from 'lucide-react';

interface PresetScenariosRibbonProps {
  onSelectScenario: (key: string) => void;
  onOpenGuide: () => void;
  onOpenSearchMatch: () => void;
  onExportCSV: () => void;
}

export const PresetScenariosRibbon: React.FC<PresetScenariosRibbonProps> = ({
  onSelectScenario,
  onOpenGuide,
  onOpenSearchMatch,
  onExportCSV
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#080d1a] border border-slate-800/90 p-4 rounded-2xl shadow-xl space-y-3">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
            {t('1-Click Test Scenarios')}:
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
            ({t('Simulate pure, strained, multi-phase mixtures & battery cathode transformations')})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSearchMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95 shadow-sm"
            title="Auto-search entire material database to identify best phase match"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('Search-Match Phase')}</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Guide & Interpretation')}</span>
          </button>
          
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
            title="Download comparison analysis report as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('Export CSV Report')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          onClick={() => onSelectScenario('pure-ha')}
          className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
        >
          <div className="p-1 bg-emerald-500/10 rounded group-hover:bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{t('Pure HAp')}</span>
            <span className="text-[8px] text-slate-500 font-normal">{t('Single Phase 99%')}</span>
          </div>
        </button>

        <button
          onClick={() => onSelectScenario('strained-ha')}
          className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
        >
          <div className="p-1 bg-amber-500/10 rounded group-hover:bg-amber-500/20 text-amber-400 shrink-0">
            <MoveHorizontal className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{t('Strained HAp')}</span>
            <span className="text-[8px] text-slate-500 font-normal">{t('+0.12° 2θ Shift')}</span>
          </div>
        </button>

        <button
          onClick={() => onSelectScenario('biphasic-ha-tcp')}
          className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
        >
          <div className="p-1 bg-indigo-500/10 rounded group-hover:bg-indigo-500/20 text-indigo-400 shrink-0">
            <Layers3 className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{t('HAp + β-TCP')}</span>
            <span className="text-[8px] text-slate-500 font-normal">{t('Biphasic Bioceramic')}</span>
          </div>
        </button>

        <button
          onClick={() => onSelectScenario('tio2-polymorphs')}
          className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
        >
          <div className="p-1 bg-rose-500/10 rounded group-hover:bg-rose-500/20 text-rose-400 shrink-0">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{t('TiO2 Polymorphs')}</span>
            <span className="text-[8px] text-slate-500 font-normal">{t('Rutile vs Anatase')}</span>
          </div>
        </button>

        <button
          onClick={() => onSelectScenario('battery-lifepo4')}
          className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
        >
          <div className="p-1 bg-purple-500/10 rounded group-hover:bg-purple-500/20 text-purple-400 shrink-0">
            <Orbit className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{t('LiFePO4 Cathode')}</span>
            <span className="text-[8px] text-slate-500 font-normal">{t('Olivine Standard')}</span>
          </div>
        </button>

        <button
          onClick={() => onSelectScenario('quartz')}
          className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
        >
          <div className="p-1 bg-cyan-500/10 rounded group-hover:bg-cyan-500/20 text-cyan-400 shrink-0">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{t('Quartz α-SiO2')}</span>
            <span className="text-[8px] text-slate-500 font-normal">{t('Standard Reference')}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
