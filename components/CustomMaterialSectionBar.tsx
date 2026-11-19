import React from 'react';
import { Check, FlaskConical, Play, Plus, SlidersHorizontal } from 'lucide-react';
import { useCustomMaterials } from './CustomMaterialContext';

interface CustomMaterialSectionBarProps {
  activeModule: string;
}

const NON_ANALYSIS_MODULES = new Set(['settings', 'profile']);

export const CustomMaterialSectionBar: React.FC<CustomMaterialSectionBarProps> = ({
  activeModule,
}) => {
  const {
    customMaterials,
    activeCustomMaterial,
    setActiveCustomMaterialId,
    applyToSection,
    openEditor,
    lastAppliedBanner,
  } = useCustomMaterials();

  if (NON_ANALYSIS_MODULES.has(activeModule)) return null;

  const isRecentlyApplied =
    lastAppliedBanner &&
    lastAppliedBanner.moduleId === activeModule &&
    Date.now() - lastAppliedBanner.ts < 4500;

  return (
    <div className="mb-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <FlaskConical size={15} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            Custom Material
          </span>
        </div>

        <select
          aria-label="Select user custom material"
          value={activeCustomMaterial?.id ?? ''}
          onChange={(e) => setActiveCustomMaterialId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500 max-w-[260px]"
        >
          {customMaterials.length === 0 && <option value="">No custom materials yet</option>}
          {customMaterials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.formula})
            </option>
          ))}
        </select>

        {activeCustomMaterial && (
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
            <span>{activeCustomMaterial.crystalSystem} ({activeCustomMaterial.centering})</span>
            <span aria-hidden="true">·</span>
            <span>a={activeCustomMaterial.lattice.a.toFixed(3)} Å</span>
            <span aria-hidden="true">·</span>
            <span>ρ={activeCustomMaterial.density.toFixed(2)} g/cm³</span>
            <span aria-hidden="true">·</span>
            <span>E={activeCustomMaterial.youngsModulusGPa} GPa</span>
            <span aria-hidden="true">·</span>
            <span>{activeCustomMaterial.peaks.length} peaks</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isRecentlyApplied && (
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap">
            <Check size={13} /> Loaded {lastAppliedBanner.materialName}
          </span>
        )}

        {activeCustomMaterial && (
          <>
            <button
              type="button"
              onClick={() => applyToSection(activeCustomMaterial, activeModule)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play size={12} /> Apply to Analysis
            </button>

            <button
              type="button"
              onClick={() => openEditor('edit', activeModule, activeCustomMaterial)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-cyan-500 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal size={12} /> Customize
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => openEditor('create', activeModule, null)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus size={13} /> New Material
        </button>
      </div>
    </div>
  );
};
