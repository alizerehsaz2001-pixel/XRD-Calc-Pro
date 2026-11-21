import React, { useState } from 'react';
import { Atom, Filter, Layers, Radio, RotateCcw, SlidersHorizontal } from 'lucide-react';

export interface RadiationSourceOption {
  id: string;
  label: string;
  wavelength: number;
}

export const RADIATION_SOURCES: RadiationSourceOption[] = [
  { id: 'cu', label: 'Cu Kα₁', wavelength: 1.54056 },
  { id: 'co', label: 'Co Kα₁', wavelength: 1.78897 },
  { id: 'mo', label: 'Mo Kα₁', wavelength: 0.71073 },
  { id: 'cr', label: 'Cr Kα₁', wavelength: 2.2897 },
  { id: 'fe', label: 'Fe Kα₁', wavelength: 1.93735 },
  { id: 'sync', label: 'Synchrotron', wavelength: 0.4133 },
];

const QUICK_ELEMENTS = [
  'O', 'Si', 'Ti', 'Fe', 'Al', 'Ca', 'Mg', 'Cu', 'Zn', 'Co',
  'Ni', 'Mn', 'Li', 'Na', 'K', 'C', 'N', 'S', 'P', 'Ba',
  'Pb', 'Zr', 'La', 'Sr', 'Au', 'Ag', 'Cl', 'F',
];

const CRYSTAL_SYSTEMS = [
  'All',
  'Cubic',
  'Tetragonal',
  'Hexagonal',
  'Trigonal',
  'Orthorhombic',
  'Monoclinic',
  'Triclinic',
];

export interface PhaseIDCoreControlStripProps {
  wavelength: number;
  onChangeWavelength: (lambda: number) => void;
  isMixMode: boolean;
  onChangeMixMode: (mix: boolean) => void;
  crystalSystemFilter: string;
  onChangeCrystalSystemFilter: (sys: string) => void;
  requiredElements: string[];
  excludedElements: string[];
  onlyAllowedElements: boolean;
  onUpdateChemistry: (next: {
    requiredElements: string[];
    excludedElements: string[];
    onlyAllowedElements: boolean;
  }) => void;
  totalStandards: number;
  screenedStandards?: number;
  onApplyAndRun: () => void;
  isSimulating: boolean;
}

export const PhaseIDCoreControlStrip: React.FC<PhaseIDCoreControlStripProps> = ({
  wavelength,
  onChangeWavelength,
  isMixMode,
  onChangeMixMode,
  crystalSystemFilter,
  onChangeCrystalSystemFilter,
  requiredElements,
  excludedElements,
  onlyAllowedElements,
  onUpdateChemistry,
  totalStandards,
  screenedStandards,
  onApplyAndRun,
  isSimulating,
}) => {
  const [showElementMatrix, setShowElementMatrix] = useState(false);

  const cycleElementState = (el: string) => {
    const isReq = requiredElements.includes(el);
    const isExc = excludedElements.includes(el);

    if (!isReq && !isExc) {
      onUpdateChemistry({
        requiredElements: [...requiredElements, el],
        excludedElements,
        onlyAllowedElements,
      });
    } else if (isReq) {
      onUpdateChemistry({
        requiredElements: requiredElements.filter((x) => x !== el),
        excludedElements: [...excludedElements, el],
        onlyAllowedElements,
      });
    } else {
      onUpdateChemistry({
        requiredElements,
        excludedElements: excludedElements.filter((x) => x !== el),
        onlyAllowedElements,
      });
    }
  };

  const hasActiveConstraints =
    requiredElements.length > 0 ||
    excludedElements.length > 0 ||
    crystalSystemFilter !== 'All' ||
    Math.abs(wavelength - 1.54056) >= 0.001;

  const activeRadiationId =
    RADIATION_SOURCES.find((r) => Math.abs(r.wavelength - wavelength) < 0.002)?.id || 'custom';

  return (
    <div className="bg-[#070A12] border border-slate-800 rounded-sm p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Source λ</span>
            <div className="flex items-center bg-[#0B0F19] border border-slate-800 rounded-sm p-0.5">
              {RADIATION_SOURCES.map((src) => {
                const active = activeRadiationId === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => onChangeWavelength(src.wavelength)}
                    className={`px-2 py-1 text-[11px] font-mono tabular-nums rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-cyan-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${src.label} (${src.wavelength} Å)`}
                  >
                    {src.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1 bg-[#0B0F19] border border-slate-800 rounded-sm px-2 py-1">
              <input
                type="number"
                step="0.0001"
                min="0.15"
                max="3.5"
                value={wavelength}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (Number.isFinite(val) && val >= 0.15 && val <= 3.5) {
                    onChangeWavelength(val);
                  }
                }}
                aria-label="Custom X-ray wavelength in Angstroms"
                className="w-16 bg-transparent text-xs font-mono tabular-nums text-cyan-300 outline-none text-right"
              />
              <span className="text-[11px] font-mono text-slate-500">Å</span>
            </div>
          </div>

          <span className="hidden xl:inline text-slate-800">|</span>

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="flex items-center bg-[#0B0F19] border border-slate-800 rounded-sm p-0.5">
              <button
                type="button"
                onClick={() => onChangeMixMode(false)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !isMixMode
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Single Phase
              </button>
              <button
                type="button"
                onClick={() => onChangeMixMode(true)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isMixMode
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Multi-Phase Mix
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              aria-label="Filter by crystal system"
              value={crystalSystemFilter}
              onChange={(e) => onChangeCrystalSystemFilter(e.target.value)}
              className="bg-[#0B0F19] border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {CRYSTAL_SYSTEMS.map((sys) => (
                <option key={sys} value={sys}>
                  {sys === 'All' ? 'All Systems' : sys}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowElementMatrix((v) => !v)}
            className={`px-3 py-1.5 rounded-sm border text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showElementMatrix || requiredElements.length > 0 || excludedElements.length > 0
                ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-200'
                : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Atom className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              EDS / XRF Chemistry
              {requiredElements.length + excludedElements.length > 0
                ? ` (${requiredElements.length}+ / ${excludedElements.length}−)`
                : ''}
            </span>
          </button>

          {hasActiveConstraints && (
            <button
              type="button"
              onClick={() => {
                onChangeWavelength(1.54056);
                onChangeCrystalSystemFilter('All');
                onUpdateChemistry({
                  requiredElements: [],
                  excludedElements: [],
                  onlyAllowedElements: false,
                });
              }}
              className="px-2.5 py-1.5 rounded-sm border border-slate-800 bg-[#0B0F19] hover:border-slate-600 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              title="Reset wavelength, symmetry, and elemental constraints"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={onApplyAndRun}
            disabled={isSimulating}
            className="px-3.5 py-1.5 rounded-sm bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Screening...' : 'Run Screened ID'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono tabular-nums text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Reciprocal Mapping: <strong className="text-slate-200">d = λ / (2 sin θ)</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Library Pool:{' '}
            <strong className="text-cyan-300">
              {typeof screenedStandards === 'number' ? `${screenedStandards} / ${totalStandards}` : totalStandards}
            </strong>{' '}
            cards
          </span>
          {requiredElements.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">
                Require: {requiredElements.join(', ')}
                {onlyAllowedElements ? ' (strict closed set)' : ''}
              </span>
            </>
          )}
          {excludedElements.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-rose-400">Exclude: {excludedElements.join(', ')}</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-slate-500">
          Click element once = Require (+) · twice = Exclude (−) · third = Clear
        </span>
      </div>

      {showElementMatrix && (
        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-300">
              Elemental Chemistry Pre-Filter (EDS / XRF / ICP-OES)
            </span>
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAllowedElements}
                onChange={(e) =>
                  onUpdateChemistry({
                    requiredElements,
                    excludedElements,
                    onlyAllowedElements: e.target.checked,
                  })
                }
                disabled={requiredElements.length === 0}
                className="accent-cyan-500"
              />
              <span>Closed-system filter (allow ONLY required elements)</span>
            </label>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
            {QUICK_ELEMENTS.map((el) => {
              const isReq = requiredElements.includes(el);
              const isExc = excludedElements.includes(el);
              return (
                <button
                  key={el}
                  type="button"
                  onClick={() => cycleElementState(el)}
                  className={`py-1.5 rounded-sm border text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center justify-center gap-0.5 ${
                    isReq
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : isExc
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300 line-through'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-100'
                  }`}
                  title={
                    isReq
                      ? `${el}: Required (click to Exclude)`
                      : isExc
                      ? `${el}: Excluded (click to Clear)`
                      : `${el}: Any (click to Require)`
                  }
                >
                  <span>{el}</span>
                  {isReq && <span className="text-[10px]">+</span>}
                  {isExc && <span className="text-[10px]">−</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
