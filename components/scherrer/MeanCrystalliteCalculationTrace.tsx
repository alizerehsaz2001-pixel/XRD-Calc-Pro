import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Calculator, BookOpen, Compass, AlertTriangle, CheckCircle2, 
  HelpCircle, ChevronRight, Sparkles, Scale, Atom, Layers, 
  Activity, ArrowRight, X, Info, ShieldCheck
} from 'lucide-react';
import { ScherrerResult } from '../../types';
import { SizingAverageMethod } from './MeanCrystalliteSizingCard';

export interface MeanCrystalliteCalculationTraceProps {
  validResults: ScherrerResult[];
  constantK: number;
  wavelength: number;
  precision: number;
  averageType: SizingAverageMethod;
  currentSizeNm: number;
  materialDensity: number;
  selectedMaterial: string;
  instFwhm?: number;
  broadeningModel?: string;
  whSlope?: number;
  onClose?: () => void;
  initialTab?: 'trace' | 'models' | 'physics' | 'diagnostics';
}

const renderTex = (tex: string, display: boolean = false): string => {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    return tex;
  }
};

export const MeanCrystalliteCalculationTrace: React.FC<MeanCrystalliteCalculationTraceProps> = ({
  validResults,
  constantK,
  wavelength,
  precision,
  averageType,
  currentSizeNm,
  materialDensity,
  selectedMaterial,
  instFwhm = 0.1,
  broadeningModel = 'Gaussian',
  whSlope = 0,
  onClose,
  initialTab = 'trace'
}) => {
  const [activeTab, setActiveTab] = useState<'trace' | 'models' | 'physics' | 'diagnostics'>(initialTab);
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);

  const totalIntensity = useMemo(() => {
    return validResults.reduce((acc, r) => acc + (r.intensity || 1), 0);
  }, [validResults]);

  const activePeak = validResults[selectedPeakIdx] || validResults[0];

  // Calculations for the selected peak
  const peakTrace = useMemo(() => {
    if (!activePeak) return null;
    const twoTheta = activePeak.twoTheta;
    const thetaDeg = twoTheta / 2;
    const thetaRad = thetaDeg * (Math.PI / 180);
    const cosTheta = Math.cos(thetaRad);
    const fwhmObs = activePeak.fwhmObs;
    const betaCorrDeg = activePeak.betaCorrected;
    const betaCorrRad = betaCorrDeg * (Math.PI / 180);
    const intensity = activePeak.intensity || 1;
    const weightPct = totalIntensity > 0 ? (intensity / totalIntensity) * 100 : 0;
    const hklStr = activePeak.hkl ? `(${activePeak.hkl.join(' ')})` : `Peak #${selectedPeakIdx + 1}`;
    const disloc10_14 = 100 / Math.pow(activePeak.sizeNm, 2);

    return {
      hklStr,
      twoTheta,
      thetaDeg,
      thetaRad,
      cosTheta,
      fwhmObs,
      instFwhm,
      betaCorrDeg,
      betaCorrRad,
      sizeNm: activePeak.sizeNm,
      dSpacing: activePeak.dSpacing || (wavelength / (2 * Math.sin(thetaRad))),
      planesN: activePeak.coherencePlanesN || Math.round((activePeak.sizeNm * 10) / (activePeak.dSpacing || 1)),
      intensity,
      weightPct,
      disloc10_14
    };
  }, [activePeak, selectedPeakIdx, totalIntensity, wavelength, instFwhm]);

  return (
    <div className="mt-6 pt-6 border-t border-slate-800/80 bg-slate-950/80 rounded-3xl p-5 sm:p-7 border border-amber-500/20 shadow-2xl relative">
      {/* Header with Close option */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>Calculation Trace & Physical Explainer</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Live Audit
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Complete mathematical derivation, peak deconvolution, and physical justification of crystallite sizing
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Explainer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 my-4">
        {[
          { id: 'trace', label: '1. Peak-by-Peak Math Trace', icon: <Calculator className="w-3.5 h-3.5" /> },
          { id: 'models', label: '2. Sizing Averages (Why 5?)', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'physics', label: '3. Physical Meaning of Metrics', icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'diagnostics', label: '4. Scientific Diagnostics & Caveats', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === t.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Peak-by-Peak Math Trace */}
      {activeTab === 'trace' && peakTrace && (
        <div className="space-y-5 text-xs text-slate-300">
          {/* Peak Selector */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
              Select Reflection to Audit:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {validResults.map((r, i) => {
                const label = r.hkl ? `(${r.hkl.join('')})` : `#${i + 1}`;
                const isSelected = selectedPeakIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPeakIdx(i)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {label} ({r.twoTheta.toFixed(1)}°)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Instrument Deconvolution */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
                Step 1: Instrumental Line Broadening Deconvolution
              </span>
              <span className="text-[10px] font-mono text-slate-400">Model: {broadeningModel}</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Real diffractometers possess finite slit widths, X-ray tube focal spot size, and axial beam divergence that broaden diffraction peaks independently of the specimen. We subtract instrumental broadening to isolate pure sample broadening (β):
            </p>
            <div 
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 text-center text-cyan-300 font-mono overflow-x-auto text-xs"
              dangerouslySetInnerHTML={{
                __html: renderTex(
                  `\\beta = \\sqrt{\\beta_{obs}^2 - \\beta_{inst}^2} = \\sqrt{(${peakTrace.fwhmObs.toFixed(4)}^\\circ)^2 - (${peakTrace.instFwhm.toFixed(4)}^\\circ)^2} = ${peakTrace.betaCorrDeg.toFixed(4)}^\\circ = ${peakTrace.betaCorrRad.toFixed(6)}\\text{ rad}`,
                  true
                )
              }}
            />
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong>Why:</strong> If instrumental broadening is not subtracted, apparent crystallite size will be severely underestimated because machine optics are mistaken for tiny grains.
              </span>
            </div>
          </div>

          {/* Step 2: Bragg Angle & Projection Geometry */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-black text-amber-400 uppercase tracking-wider text-[11px] block">
              Step 2: Bragg Angle & Reciprocal Projection Factor
            </span>
            <p className="text-slate-300 text-xs leading-relaxed">
              The Bragg angle θ is half of the detector 2θ angle. The projection factor cos θ accounts for how the finite coherent column length projects onto the circular diffractometer coordinate:
            </p>
            <div 
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 text-center text-indigo-300 font-mono overflow-x-auto text-xs"
              dangerouslySetInnerHTML={{
                __html: renderTex(
                  `\\theta = \\frac{2\\theta}{2} = \\frac{${peakTrace.twoTheta.toFixed(3)}^\\circ}{2} = ${peakTrace.thetaDeg.toFixed(3)}^\\circ, \\quad \\cos\\theta = \\cos(${peakTrace.thetaDeg.toFixed(3)}^\\circ) = ${peakTrace.cosTheta.toFixed(4)}`,
                  true
                )
              }}
            />
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                <strong>Why:</strong> Peaks at higher 2θ angles naturally broaden as 1/cos θ. The cos θ term normalizes this geometric angular dispersion.
              </span>
            </div>
          </div>

          {/* Step 3: Scherrer Formula Evaluation */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-black text-amber-400 uppercase tracking-wider text-[11px] block">
              Step 3: Scherrer Sizing Equation Evaluation
            </span>
            <p className="text-slate-300 text-xs leading-relaxed">
              Substituting the shape factor (K = {constantK}), X-ray probe wavelength (λ = {wavelength} Å = {(wavelength / 10).toFixed(5)} nm), sample broadening in radians, and cos θ yields the crystallite dimension perpendicular to the {peakTrace.hklStr} plane:
            </p>
            <div 
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 text-center text-emerald-300 font-mono overflow-x-auto text-xs"
              dangerouslySetInnerHTML={{
                __html: renderTex(
                  `D_{${peakTrace.hklStr}} = \\frac{K \\cdot \\lambda}{\\beta \\cdot \\cos\\theta} = \\frac{${constantK} \\times ${(wavelength / 10).toFixed(5)}\\text{ nm}}{${peakTrace.betaCorrRad.toFixed(6)}\\text{ rad} \\times ${peakTrace.cosTheta.toFixed(4)}} = \\mathbf{${peakTrace.sizeNm.toFixed(precision)}\\text{ nm}}`,
                  true
                )
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Interplanar Spacing:</span>
                <span className="font-bold text-white">d = {peakTrace.dSpacing.toFixed(3)} Å</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Coherent Lattice Layers:</span>
                <span className="font-bold text-indigo-300">N ≈ {peakTrace.planesN} planes</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Facet Dislocation Density:</span>
                <span className="font-bold text-amber-300">δ ≈ {peakTrace.disloc10_14.toFixed(2)} ×10¹⁴ m⁻²</span>
              </div>
            </div>
          </div>

          {/* Step 4: Multi-Peak Averaging Ensemble */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-black text-amber-400 uppercase tracking-wider text-[11px] block">
              Step 4: Synthesis into Overall Mean ({averageType.toUpperCase()})
            </span>
            <p className="text-slate-300 text-xs leading-relaxed">
              This reflection has intensity I = {peakTrace.intensity.toFixed(0)}, representing <strong>{peakTrace.weightPct.toFixed(1)}%</strong> of total diffraction pattern intensity. Under the active <strong>{averageType.toUpperCase()}</strong> averaging model:
            </p>
            <div 
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 text-center text-amber-300 font-mono overflow-x-auto text-xs"
              dangerouslySetInnerHTML={{
                __html: renderTex(
                  averageType === 'weighted'
                    ? `D_{int} = \\frac{\\sum_{i=1}^{${validResults.length}} I_i D_i}{\\sum I_i} = \\mathbf{${currentSizeNm.toFixed(precision)}\\text{ nm}}`
                    : averageType === 'arithmetic'
                    ? `D_{num} = \\frac{1}{${validResults.length}} \\sum_{i=1}^{${validResults.length}} D_i = \\mathbf{${currentSizeNm.toFixed(precision)}\\text{ nm}}`
                    : averageType === 'volume'
                    ? `D_{V} = \\frac{\\sum D_i^4}{\\sum D_i^3} = \\mathbf{${currentSizeNm.toFixed(precision)}\\text{ nm}}`
                    : averageType === 'area'
                    ? `D_{A} = \\frac{\\sum D_i^3}{\\sum D_i^2} = \\mathbf{${currentSizeNm.toFixed(precision)}\\text{ nm}}`
                    : `D_{H} = \\frac{${validResults.length}}{\\sum (1/D_i)} = \\mathbf{${currentSizeNm.toFixed(precision)}\\text{ nm}}`,
                  true
                )
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Sizing Averages Comparison */}
      {activeTab === 'models' && (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-slate-300 space-y-1.5">
            <span className="font-black text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Why XRD Sizing Differs from TEM & Why 5 Different Averages Exist
            </span>
            <p className="text-[11px] leading-relaxed">
              In TEM microscopy, you count individual crystallites one-by-one, yielding an <strong>Arithmetic / Number Mean (D_num)</strong>. In powder XRD, the diffraction signal is coherent scattering proportional to crystal volume (or volume squared). Larger crystallites scatter much more strongly than smaller ones! Consequently, XRD powder patterns naturally yield <strong>Intensity- or Volume-Weighted sizes</strong> that are almost always larger than TEM averages for the same sample.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Intensity Weighted */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">Intensity-Weighted (D_int)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">Standard XRD</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-slate-300"
                dangerouslySetInnerHTML={{ __html: renderTex('D_{int} = \\frac{\\sum I_i D_i}{\\sum I_i}', true) }}
              />
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Weights each crystallite dimension by the Bragg reflection intensity. Highly robust because strong reflections have superior signal-to-noise ratio and dominate the physical diffracting volume.
              </p>
            </div>

            {/* 2. Arithmetic Mean */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400">Number / Arithmetic (D_num)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">TEM Equivalent</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-slate-300"
                dangerouslySetInnerHTML={{ __html: renderTex('D_{num} = \\frac{1}{N} \\sum_{i=1}^N D_i', true) }}
              />
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Gives equal 1/N weight to every observed reflection regardless of intensity. Directly comparable to manual grain counting in TEM/SEM, but vulnerable to noisy, low-intensity peaks.
              </p>
            </div>

            {/* 3. Volume-Weighted */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">Volume-Weighted (D_V)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">ASTM / ISO</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-slate-300"
                dangerouslySetInnerHTML={{ __html: renderTex('D_V = \\frac{\\sum D_i^4}{\\sum D_i^3}', true) }}
              />
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Formal ISO 26824 and ASTM E2865 standard for particle volume distribution. Crucial when reporting bulk mass-transport properties and composite packing densities.
              </p>
            </div>

            {/* 4. Area-Weighted */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">Area-Weighted (D_A)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">Surface / Catalysis</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-slate-300"
                dangerouslySetInnerHTML={{ __html: renderTex('D_A = \\frac{\\sum D_i^3}{\\sum D_i^2}', true) }}
              />
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Proportional to total surface area. Essential for catalysis, battery electrode active surface area, and chemical adsorption where outer facet exposure dictates performance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Physical Meaning of Microstructural Metrics */}
      {activeTab === 'physics' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Metric 1: Dislocation Density */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-[11px] uppercase">Dislocation Density (δ = 1/D²)</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-amber-300"
                dangerouslySetInnerHTML={{ __html: renderTex('\\delta = \\frac{1}{D^2} \\quad [\\text{lines / m}^2]', true) }}
              />
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Physical Basis:</strong> Developed by Williamson & Smallman (1956). In nanocrystalline powders, crystallite boundaries function as dislocation sinks or barriers. As crystallite size D shrinks, the boundary density increases quadratically, causing δ to rise dramatically.
              </p>
              <div className="text-[10px] text-slate-400 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <strong>Rule of Thumb:</strong> Values of 10¹⁴ to 10¹⁶ m⁻² indicate severe defect pinning, mechanical ball milling strain, or rapid quenching.
              </div>
            </div>

            {/* Metric 2: Specific Surface Area */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-[11px] uppercase">Specific Surface Area (SSA)</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-emerald-300"
                dangerouslySetInnerHTML={{ __html: renderTex('\\text{SSA} = \\frac{6 \\times 10^3}{\\rho \\cdot D} \\quad [\\text{m}^2/\\text{g}]', true) }}
              />
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Derivation:</strong> For a sphere of diameter D: Surface Area A = πD², Volume V = (π/6)D³ → A/V = 6/D. Since Mass m = ρV, SSA = A/m = 6/(ρD). The 6000 factor converts g/cm³ and nm to m²/g.
              </p>
              <div className="text-[10px] text-slate-400 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <strong>Rule of Thumb:</strong> High SSA (&gt;50 m²/g) is desired for catalytic converters, battery electrodes, and sensor active layers.
              </div>
            </div>

            {/* Metric 3: Polydispersity Index */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-[11px] uppercase">Polydispersity Index (PDI)</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-purple-300"
                dangerouslySetInnerHTML={{ __html: renderTex('\\text{PDI} = \\left(\\frac{\\sigma}{\\bar{D}}\\right)^2', true) }}
              />
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Statistical Meaning:</strong> The normalized variance of the crystallite size distribution across measured Bragg peaks.
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1 pl-2">
                <li>• <strong>PDI &lt; 0.05:</strong> Monodisperse, highly uniform grain growth.</li>
                <li>• <strong>0.05 – 0.20:</strong> Moderate polydispersity (typical synthesis).</li>
                <li>• <strong>PDI &gt; 0.20:</strong> Broad or bimodal size distribution.</li>
              </ul>
            </div>

            {/* Metric 4: Anisotropy Ratio */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-[11px] uppercase">Crystallographic Anisotropy</span>
              </div>
              <div 
                className="bg-slate-950 p-2 rounded-xl text-center text-xs font-mono text-cyan-300"
                dangerouslySetInnerHTML={{ __html: renderTex('\\text{Anisotropy} = \\frac{D_{max}}{D_{min}}', true) }}
              />
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Habit & Morphology:</strong> If all reflections yield equal size (~1.0), crystallites are isotropic equiaxed spheres or cubes. If ratio &gt; 1.4, grains are non-spherical:
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1 pl-2">
                <li>• <strong>Nanorods / Wires:</strong> Elongated along c-axis (e.g. ZnO [0001]).</li>
                <li>• <strong>Nanosheets / Platelets:</strong> Thin along normal plane (e.g. clays, MoS₂).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Diagnostics & Golden Rules */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-white uppercase text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Diffraction Metrology Health Check: 5 Golden Rules
            </span>
            <p className="text-slate-400 text-[11px]">
              Every scientific paper applying the Scherrer formula must satisfy these 5 experimental criteria to guarantee validity:
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Rule 1: Optics Resolution */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              currentSizeNm > 150 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <div className="mt-0.5">
                {currentSizeNm > 150 ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">
                  1. Instrumental Optics Limit (D &lt; 100–150 nm)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scherrer is strictly valid for nanoscale crystals (1–100 nm). Above 100–150 nm, sample broadening (β) becomes smaller than experimental slit optics, causing subtraction noise. Current sample: <strong>{currentSizeNm.toFixed(1)} nm</strong>.
                </p>
              </div>
            </div>

            {/* Rule 2: Microstrain Contamination */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              Math.abs(whSlope) > 0.0008 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <div className="mt-0.5">
                {Math.abs(whSlope) > 0.0008 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">
                  2. Microstrain & Defect Separation
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scherrer assumes 100% of peak broadening is caused by size. In reality, lattice strain (ε) broadens peaks as 4ε tan θ. If Williamson-Hall slope is non-zero (current: {(Math.abs(whSlope) * 100).toFixed(2)}%), use Williamson-Hall or Rietveld to decouple strain from size.
                </p>
              </div>
            </div>

            {/* Rule 3: Reflection Sufficiency */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              validResults.length < 3 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <div className="mt-0.5">
                {validResults.length < 3 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <span className="font-bold block text-white text-[11px]">
                  3. Multiple Reflection Redundancy (N ≥ 3)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Single-peak Scherrer calculations are notoriously unreliable due to preferred orientation, facet anisotropy, or overlap. Currently using <strong>{validResults.length} reflection{validResults.length === 1 ? '' : 's'}</strong>.
                </p>
              </div>
            </div>

            {/* Rule 4: Shape Factor K Appropriateness */}
            <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 text-slate-300 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block text-white text-[11px]">
                  4. Shape Factor K Selection (Current K = {constantK})
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  K is typically 0.9 for spherical or unknown morphology. If your material forms cubic cubes (K=0.943), platelets (K=0.89), or nanowires (K=1.1), switch the shape factor in the settings.
                </p>
              </div>
            </div>

            {/* Rule 5: Wavelength Calibration */}
            <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 text-slate-300 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block text-white text-[11px]">
                  5. X-Ray Wavelength Calibration (λ = {wavelength} Å)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verified Cu Kα₁/α₂ weighted wavelength ({wavelength} Å). Ensure your instrumental calibrant (e.g. NIST SRM 660 LaB₆ or 640 Si) matches the radiation source.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
