import React from 'react';
import { 
  ProfileCalculationParams, 
  ProfileShape, 
  BackgroundType, 
  XAxisUnit,
  identifyAnode 
} from '../utils/calculatedProfileEngine';
import { 
  Sliders, 
  Sparkles, 
  Activity, 
  Layers, 
  Radio, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Flame, 
  Atom, 
  HelpCircle 
} from 'lucide-react';

interface ProfileTuningPanelProps {
  params: ProfileCalculationParams;
  onChange: (newParams: ProfileCalculationParams) => void;
  onReset: () => void;
  xAxisUnit: XAxisUnit;
  onXAxisUnitChange: (unit: XAxisUnit) => void;
  onClose: () => void;
}

export const ProfileTuningPanel: React.FC<ProfileTuningPanelProps> = ({
  params,
  onChange,
  onReset,
  xAxisUnit,
  onXAxisUnitChange,
  onClose,
}) => {
  const anode = identifyAnode(params.wavelength);

  const updateParam = <K extends keyof ProfileCalculationParams>(
    key: K,
    val: ProfileCalculationParams[K]
  ) => {
    onChange({ ...params, [key]: val });
  };

  return (
    <div className="bg-[#090f20]/95 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 shadow-2xl relative z-30 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Diffraction Profile Optics & Synthesis Tuning
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Configure crystallographic line shapes, Caglioti/Scherrer broadening, Ka doublets, and background models.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono font-bold uppercase transition-all"
            title="Reset to default synthesis parameters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Column 1: Peak Profile Shape */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              1. Profile Line Shape
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'pseudo_voigt', label: 'Pseudo-Voigt', desc: 'Gaussian + Lorentzian' },
              { id: 'gaussian', label: 'Gaussian', desc: 'Exp(-u²)' },
              { id: 'lorentzian', label: 'Lorentzian', desc: 'Cauchy 1/(1+u²)' },
              { id: 'pearson_vii', label: 'Pearson VII', desc: 'Decay exponent m' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateParam('profileShape', item.id as ProfileShape)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  params.profileShape === item.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-[10px] font-bold block">{item.label}</span>
                <span className="text-[8px] text-slate-500 block truncate">{item.desc}</span>
              </button>
            ))}
          </div>

          {params.profileShape === 'pseudo_voigt' && (
            <div className="space-y-1 pt-2 border-t border-white/5">
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Mixing Factor η (Lorentzian %)</span>
                <span className="text-indigo-400 font-bold">{(params.eta * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.eta}
                onChange={(e) => updateParam('eta', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                <span>0% (Pure Gaussian)</span>
                <span>100% (Pure Lorentzian)</span>
              </div>
            </div>
          )}

          {params.profileShape === 'pearson_vii' && (
            <div className="space-y-1 pt-2 border-t border-white/5">
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Exponent (m)</span>
                <span className="text-indigo-400 font-bold">{params.pearsonM.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="0.1"
                value={params.pearsonM}
                onChange={(e) => updateParam('pearsonM', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Column 2: Line Broadening (Instrumental & Sample) */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5 text-emerald-400" />
              2. Broadening Mechanism
            </span>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
            {[
              { id: 'manual_fwhm', label: 'Constant FWHM' },
              { id: 'physical_scherrer', label: 'Size & Strain' },
              { id: 'caglioti', label: 'Caglioti UVW' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateParam('broadeningMode', m.id as any)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-mono font-bold transition-all ${
                  params.broadeningMode === m.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {params.broadeningMode === 'manual_fwhm' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Instrument FWHM (2θ)</span>
                <span className="text-emerald-400 font-bold">{params.manualFwhm.toFixed(3)}°</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="1.20"
                step="0.01"
                value={params.manualFwhm}
                onChange={(e) => updateParam('manualFwhm', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: 'Ultra Sharp', val: 0.08 },
                  { label: 'Standard Lab', val: 0.18 },
                  { label: 'Nanocrystal', val: 0.45 }
                ].map(pre => (
                  <button
                    key={pre.label}
                    type="button"
                    onClick={() => updateParam('manualFwhm', pre.val)}
                    className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded text-[8px] font-mono text-slate-300"
                  >
                    {pre.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {params.broadeningMode === 'physical_scherrer' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>Crystallite Size (D)</span>
                  <span className="text-emerald-400 font-bold">{params.crystalliteSizeNm.toFixed(0)} nm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="1"
                  value={params.crystalliteSizeNm}
                  onChange={(e) => updateParam('crystalliteSizeNm', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>Microstrain (ε)</span>
                  <span className="text-sky-400 font-bold">{(params.microstrain * 1000).toFixed(2)} ×10⁻³</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.005"
                  step="0.0001"
                  value={params.microstrain}
                  onChange={(e) => updateParam('microstrain', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          )}

          {params.broadeningMode === 'caglioti' && (
            <div className="space-y-2 font-mono text-[9px]">
              <div className="text-slate-400 text-[8px]">
                FWHM²(θ) = U·tan²θ + V·tanθ + W
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">U</span>
                  <input
                    type="number"
                    step="0.001"
                    value={params.cagliotiU}
                    onChange={(e) => updateParam('cagliotiU', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">V</span>
                  <input
                    type="number"
                    step="0.001"
                    value={params.cagliotiV}
                    onChange={(e) => updateParam('cagliotiV', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">W</span>
                  <input
                    type="number"
                    step="0.001"
                    value={params.cagliotiW}
                    onChange={(e) => updateParam('cagliotiW', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-white text-center font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Radiation Optics & Ka Doublet */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              3. Radiation & Ka Doublet
            </span>
            <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {anode.anode} Anode
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/60 cursor-pointer group hover:border-indigo-500/30 transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white group-hover:text-indigo-300">
                  Kα₁ / Kα₂ Characteristic Doublet
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  λ₁={anode.ka1.toFixed(5)} Å • λ₂={anode.ka2.toFixed(5)} Å
                </span>
              </div>
              <input
                type="checkbox"
                checked={params.enableKaDoublet}
                onChange={(e) => updateParam('enableKaDoublet', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-white/10 focus:ring-0 cursor-pointer"
              />
            </label>

            {params.enableKaDoublet && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>I(Kα₂) / I(Kα₁) Ratio</span>
                  <span className="text-amber-400 font-bold">{params.ka2Ratio.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.6"
                  step="0.02"
                  value={params.ka2Ratio}
                  onChange={(e) => updateParam('ka2Ratio', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono text-slate-400 block">X-Axis Coordinate Unit:</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                {[
                  { id: 'twoTheta', label: '2θ (°)' },
                  { id: 'q', label: 'Q (Å⁻¹)' },
                  { id: 'dSpacing', label: 'd (Å)' },
                ].map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onXAxisUnitChange(u.id as XAxisUnit)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-mono font-bold transition-all ${
                      xAxisUnit === u.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Background & Noise Model */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              4. Background & Noise
            </span>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
            {[
              { id: 'none', label: 'None' },
              { id: 'flat', label: 'Flat' },
              { id: 'sloped', label: 'Sloped' },
              { id: 'amorphous_halo', label: 'Halo' },
            ].map(bg => (
              <button
                key={bg.id}
                type="button"
                onClick={() => updateParam('backgroundType', bg.id as BackgroundType)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                  params.backgroundType === bg.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>

          {params.backgroundType !== 'none' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>Baseline Level</span>
                  <span className="text-cyan-400 font-bold">{params.backgroundLevel.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={params.backgroundLevel}
                  onChange={(e) => updateParam('backgroundLevel', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {params.backgroundType === 'amorphous_halo' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Amorphous Hump (2θ)</span>
                    <span className="text-cyan-400 font-bold">{params.haloCenter2Theta.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="35"
                    step="0.5"
                    value={params.haloCenter2Theta}
                    onChange={(e) => updateParam('haloCenter2Theta', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Noise Injection */}
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Poisson Noise Factor</span>
              <span className="text-indigo-400 font-bold">{params.noiseLevel.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.2"
              value={params.noiseLevel}
              onChange={(e) => updateParam('noiseLevel', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[8px] text-slate-600 font-mono">
              <span>0% (Pristine Theory)</span>
              <span>5% (Real Lab Count Noise)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
