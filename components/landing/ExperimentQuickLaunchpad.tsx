import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Layers,
  Cpu,
  Activity,
  Compass,
  Radio,
  ArrowRight,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { AppSection } from '../../types';

export interface ExperimentPreset {
  id: string;
  title: string;
  material: string;
  formula: string;
  spaceGroup: string;
  category: string;
  targetSection: AppSection;
  description: string;
  keyParameters: { label: string; value: string }[];
  accentColor: string;
  peaksPreview: { twoTheta: number; intensity: number; hkl: string }[];
}

export const EXPERIMENT_PRESETS: ExperimentPreset[] = [
  {
    id: 'si_standard',
    title: 'NIST SRM 640f Instrumental Calibration',
    material: 'Silicon Powder Standard',
    formula: 'Si (Fd-3m)',
    spaceGroup: 'Fd-3m (227)',
    category: 'Bragg & Instrumental',
    targetSection: 'bragg',
    description:
      'Calibrate goniometer zero-shift, Caglioti (U, V, W) resolution function, and axial divergence using strain-free cubic Silicon reflections.',
    keyParameters: [
      { label: 'Lattice a', value: '5.43119 Å' },
      { label: 'Primary (111)', value: '28.44°' },
      { label: 'FWHM (111)', value: '0.072°' },
      { label: 'Radiation', value: 'Cu Kα₁' },
    ],
    accentColor: '#06B6D4',
    peaksPreview: [
      { twoTheta: 28.44, intensity: 100, hkl: '111' },
      { twoTheta: 47.3, intensity: 55, hkl: '220' },
      { twoTheta: 56.12, intensity: 30, hkl: '311' },
      { twoTheta: 69.13, intensity: 12, hkl: '400' },
      { twoTheta: 76.38, intensity: 18, hkl: '331' },
    ],
  },
  {
    id: 'rietveld_batio3',
    title: 'Full-Pattern Rietveld Refinement',
    material: 'BaTiO₃ Tetragonal Perovskite',
    formula: 'BaTiO₃ (P4mm)',
    spaceGroup: 'P4mm (99)',
    category: 'Rietveld Refinement',
    targetSection: 'rietveld',
    description:
      'Refine fractional atomic coordinates, Caglioti UVW peak shapes, Chebyshev background, and (002)/(200) tetragonal spontaneous strain splitting.',
    keyParameters: [
      { label: 'c/a Ratio', value: '1.0110' },
      { label: 'Target Rwp', value: '2.18%' },
      { label: 'Goodness χ²', value: '1.34' },
      { label: 'Split Δ2θ', value: '0.46°' },
    ],
    accentColor: '#10B981',
    peaksPreview: [
      { twoTheta: 22.18, intensity: 20, hkl: '100' },
      { twoTheta: 31.52, intensity: 100, hkl: '110' },
      { twoTheta: 38.88, intensity: 28, hkl: '111' },
      { twoTheta: 45.22, intensity: 36, hkl: '200' },
      { twoTheta: 56.18, intensity: 40, hkl: '211' },
    ],
  },
  {
    id: 'pdf_total_scattering',
    title: 'Total Scattering & Pair Distribution G(r)',
    material: 'Amorphous SiO₂ / Nano-CeO₂',
    formula: 'SiO₂ · CeO₂',
    spaceGroup: 'Short-Range Order',
    category: 'Real-Space PDF',
    targetSection: 'pdf_analysis',
    description:
      'Sine-Fourier transform high-Q synchrotron total scattering S(Q) into real-space atomic pair correlations G(r) with Lorch damping and termination ripple control.',
    keyParameters: [
      { label: 'Qmax Cutoff', value: '24.0 Å⁻¹' },
      { label: 'Si–O Bond r₁', value: '1.61 Å' },
      { label: 'O–O Shell r₂', value: '2.63 Å' },
      { label: 'Damping ξ', value: '18.5 Å' },
    ],
    accentColor: '#F59E0B',
    peaksPreview: [
      { twoTheta: 21.5, intensity: 95, hkl: 'FSDP' },
      { twoTheta: 36.2, intensity: 48, hkl: 'r₁ Shell' },
      { twoTheta: 53.0, intensity: 35, hkl: 'r₂ Shell' },
      { twoTheta: 78.4, intensity: 22, hkl: 'High-Q' },
    ],
  },
  {
    id: 'zno_nanorods',
    title: 'Anisotropic Nanocrystal Line Broadening',
    material: 'ZnO Wurtzite Nanocrystals',
    formula: 'ZnO (P6₃mc)',
    spaceGroup: 'P6₃mc (186)',
    category: 'Size & Microstrain',
    targetSection: 'williamson',
    description:
      'Deconvolve isotropic vs. anisotropic lattice microstrain (ε) and coherent domain size (D) across c-axis (002) and basal (100) reflections.',
    keyParameters: [
      { label: 'Domain ⟨D⟩', value: '24.5 nm' },
      { label: 'Microstrain ε', value: '0.185%' },
      { label: 'c-Axis (002)', value: '34.42°' },
      { label: 'Anisotropy', value: 'c/a = 1.602' },
    ],
    accentColor: '#8B5CF6',
    peaksPreview: [
      { twoTheta: 31.77, intensity: 58, hkl: '100' },
      { twoTheta: 34.42, intensity: 44, hkl: '002' },
      { twoTheta: 36.25, intensity: 100, hkl: '101' },
      { twoTheta: 47.54, intensity: 23, hkl: '102' },
      { twoTheta: 56.6, intensity: 32, hkl: '110' },
    ],
  },
  {
    id: 'xrr_thin_film',
    title: 'Parratt Optical Recursion & Kiessig Fringes',
    material: 'TiO₂ / SiO₂ / Si Wafer Stack',
    formula: '32 nm TiO₂ on Si(100)',
    spaceGroup: 'Specular XRR',
    category: 'Thin-Film Reflectometry',
    targetSection: 'xrr',
    description:
      'Extract sub-nanometer film thickness, critical angle θc mass density, and Nevot–Croce interfacial roughness from low-angle specular reflectivity.',
    keyParameters: [
      { label: 'Critical θc', value: '0.268°' },
      { label: 'Thickness d', value: '32.4 nm' },
      { label: 'Roughness σ', value: '0.45 nm' },
      { label: 'SLD ρₑ', value: '31.8×10⁻⁶ Å⁻²' },
    ],
    accentColor: '#EC4899',
    peaksPreview: [
      { twoTheta: 18.0, intensity: 100, hkl: 'θc Edge' },
      { twoTheta: 32.0, intensity: 74, hkl: 'm = 1' },
      { twoTheta: 46.0, intensity: 52, hkl: 'm = 2' },
      { twoTheta: 60.0, intensity: 34, hkl: 'm = 3' },
      { twoTheta: 74.0, intensity: 20, hkl: 'm = 4' },
    ],
  },
  {
    id: 'pinn_neural_id',
    title: 'Physics-Informed Neural Phase & Space Group ID',
    material: 'Multi-Phase Perovskite + Spinel',
    formula: 'SrTiO₃ + CoFe₂O₄',
    spaceGroup: '230 Space Groups',
    category: 'Deep Learning PINN',
    targetSection: 'dl',
    description:
      'Run 1D-ResNet + Multi-Head Attention inference with extinction-rule masking, Grad-CAM saliency attribution, and Voigt latent disentanglement.',
    keyParameters: [
      { label: 'Architecture', value: 'PINN-ResNet1D' },
      { label: 'Confidence', value: '99.4% Top-1' },
      { label: 'Inference', value: '12.4 ms' },
      { label: 'Latent Dim', value: 'ℝ¹²⁸ Manifold' },
    ],
    accentColor: '#3B82F6',
    peaksPreview: [
      { twoTheta: 32.42, intensity: 100, hkl: '110' },
      { twoTheta: 35.48, intensity: 64, hkl: '311' },
      { twoTheta: 46.48, intensity: 48, hkl: '200' },
      { twoTheta: 57.78, intensity: 38, hkl: '211' },
      { twoTheta: 62.62, intensity: 29, hkl: '440' },
    ],
  },
];

interface ExperimentQuickLaunchpadProps {
  onSelectPreset: (preset: ExperimentPreset) => void;
}

export const ExperimentQuickLaunchpad: React.FC<ExperimentQuickLaunchpadProps> = ({ onSelectPreset }) => {
  const [selectedId, setSelectedId] = useState<string>(EXPERIMENT_PRESETS[0].id);
  const activePreset = EXPERIMENT_PRESETS.find((p) => p.id === selectedId) || EXPERIMENT_PRESETS[0];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-800/80 bg-[#070A12]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
              <span>● VERIFIED REFERENCE DATASETS</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">ZERO-CONFIG BENCHMARK LAUNCHPAD</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Instant Crystallographic Benchmark Suite
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md font-normal leading-relaxed">
            Load curated NIST standards, synchrotron total scattering benchmarks, or thin-film XRR stacks directly into the target physics engine with pre-configured instrumental parameters.
          </p>
        </div>

        {/* 12-Column Precision Split Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-800 bg-[#0B0F19] rounded-sm overflow-hidden shadow-2xl">
          {/* Left Column: 6 Benchmark Preset Selectors */}
          <div className="lg:col-span-5 divide-y divide-slate-800 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#070A12]">
            {EXPERIMENT_PRESETS.map((preset, index) => {
              const isSelected = preset.id === selectedId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedId(preset.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#0F172A] border-l-2 border-l-cyan-400'
                      : 'hover:bg-slate-900/50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                        0{index + 1}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{ color: preset.accentColor }}
                      >
                        {preset.category}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] font-mono text-slate-400">{preset.spaceGroup}</span>
                    </div>
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {preset.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{preset.material}</p>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Benchmark Telemetry & Direct Launch Console */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-[#0B0F19]">
            <div>
              {/* Top Status & Formula Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
                    <span>● READY FOR INITIALIZATION</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-400">MODULE: {activePreset.targetSection.toUpperCase()}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">{activePreset.title}</h3>
                </div>
                <div className="px-3 py-1.5 bg-[#070A12] border border-slate-800 rounded-sm text-right">
                  <div className="text-[10px] font-mono uppercase text-slate-500">Chemical Phase</div>
                  <div className="text-xs font-mono font-bold text-cyan-300">{activePreset.formula}</div>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-6">{activePreset.description}</p>

              {/* 4-Column Parameter Readout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                {activePreset.keyParameters.map((param, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#070A12] border border-slate-800 rounded-sm"
                  >
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      {param.label}
                    </div>
                    <div className="text-sm font-mono font-bold text-white tabular-nums">{param.value}</div>
                  </div>
                ))}
              </div>

              {/* Synthetic Reflection Stick Pattern Preview */}
              <div className="bg-[#070A12] border border-slate-800 rounded-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Primary Diagnostic Signatures &amp; (hkl) Stick Spectrum
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">Cu Kα₁ Reference Scale</span>
                </div>

                <div className="relative h-28 border-b border-slate-800 flex items-end pt-4">
                  {/* Subtle horizontal grid */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-dashed border-slate-600 w-full h-0" />
                    <div className="border-b border-dashed border-slate-600 w-full h-0" />
                    <div className="border-b border-dashed border-slate-600 w-full h-0" />
                  </div>

                  {activePreset.peaksPreview.map((peak, idx) => {
                    const leftPercent = Math.min(94, Math.max(6, ((peak.twoTheta - 15) / 70) * 100));
                    return (
                      <div
                        key={idx}
                        className="absolute bottom-0 flex flex-col items-center group"
                        style={{ left: `${leftPercent}%`, height: `${peak.intensity}%` }}
                      >
                        <span className="text-[9px] font-mono text-slate-300 mb-1 whitespace-nowrap bg-[#0B0F19]/90 px-1 border border-slate-800 rounded-sm">
                          ({peak.hkl})
                        </span>
                        <div
                          className="w-1 rounded-t-xs transition-all"
                          style={{
                            height: '100%',
                            backgroundColor: activePreset.accentColor,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 tabular-nums">
                  <span>15.0° 2θ</span>
                  <span>35.0° 2θ</span>
                  <span>55.0° 2θ</span>
                  <span>85.0° 2θ</span>
                </div>
              </div>
            </div>

            {/* Bottom Launch Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs font-mono text-slate-400">
                Target Engine:{' '}
                <span className="text-white font-bold uppercase">{activePreset.category}</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectPreset(activePreset)}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Load Benchmark &amp; Launch Workstation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
