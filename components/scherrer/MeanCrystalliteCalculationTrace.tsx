import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  BookOpen,
  Compass,
  AlertTriangle,
  CheckCircle2,
  X,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ScherrerResult } from '../../types';
import { SizingAverageMethod } from './MeanCrystalliteSizingCard';
import { MathFormula, EquationPlate } from '../common/MathFormula';

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

export const MeanCrystalliteCalculationTrace: React.FC<MeanCrystalliteCalculationTraceProps> = ({
  validResults,
  constantK,
  wavelength,
  precision,
  averageType,
  currentSizeNm,
  materialDensity,
  instFwhm = 0.1,
  broadeningModel = 'Gaussian',
  whSlope = 0,
  onClose,
  initialTab = 'trace',
}) => {
  const [activeTab, setActiveTab] = useState<'trace' | 'models' | 'physics' | 'diagnostics'>(initialTab);
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const totalIntensity = useMemo(
    () => validResults.reduce((acc, r) => acc + (r.intensity || 1), 0),
    [validResults]
  );

  const activePeak = validResults[selectedPeakIdx] || validResults[0];

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
    const hklCompact = activePeak.hkl ? activePeak.hkl.join('') : `${selectedPeakIdx + 1}`;
    const hklStr = activePeak.hkl ? `(${hklCompact})` : `Peak #${selectedPeakIdx + 1}`;
    const disloc10_14 = 100 / Math.pow(activePeak.sizeNm, 2);
    const effectiveK = activePeak.effectiveK ?? constantK;
    const ka2Deg = activePeak.kAlpha2BroadeningDeg ?? 0;
    const lambdaNm = wavelength / 10;
    const numeratorNm = effectiveK * lambdaNm;
    const denominatorRad = betaCorrRad * cosTheta;

    return {
      hklCompact,
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
      effectiveK,
      ka2Deg,
      lambdaNm,
      numeratorNm,
      denominatorRad,
      dSpacing: activePeak.dSpacing || wavelength / (2 * Math.sin(thetaRad)),
      planesN:
        activePeak.coherencePlanesN ||
        Math.round((activePeak.sizeNm * 10) / (activePeak.dSpacing || 1)),
      intensity,
      weightPct,
      disloc10_14,
    };
  }, [activePeak, selectedPeakIdx, totalIntensity, wavelength, instFwhm, constantK]);

  const deconvolutionTex = useMemo(() => {
    if (!peakTrace) return '';
    const obs = peakTrace.fwhmObs.toFixed(4);
    const inst = peakTrace.instFwhm.toFixed(4);
    const corrDeg = peakTrace.betaCorrDeg.toFixed(4);
    const corrRad = peakTrace.betaCorrRad.toFixed(6);

    const firstLine =
      broadeningModel === 'Lorentzian'
        ? `\\beta_{\\mathrm{s}} &= \\beta_{\\mathrm{obs}} - \\beta_{\\mathrm{inst}} = ${obs}^\\circ - ${inst}^\\circ = ${corrDeg}^\\circ`
        : broadeningModel === 'Pseudo-Voigt'
        ? `\\beta_{\\mathrm{s}} &= (1-\\eta)\\sqrt{\\beta_{\\mathrm{obs}}^2 - \\beta_{\\mathrm{inst}}^2} + \\eta(\\beta_{\\mathrm{obs}} - \\beta_{\\mathrm{inst}}) = ${corrDeg}^\\circ`
        : broadeningModel === 'Halder-Wagner'
        ? `\\beta_{\\mathrm{s}} &= \\beta_{\\mathrm{obs}} - \\frac{\\beta_{\\mathrm{inst}}^2}{\\beta_{\\mathrm{obs}}} = ${obs}^\\circ - \\frac{(${inst}^\\circ)^2}{${obs}^\\circ} = ${corrDeg}^\\circ`
        : broadeningModel === 'de Keijser'
        ? `\\beta_{C,\\mathrm{s}} &= \\beta_{C}^{\\mathrm{obs}}(\\phi_{\\mathrm{obs}}) - \\beta_{C}^{\\mathrm{inst}}(\\phi_{\\mathrm{inst}}) = ${corrDeg}^\\circ`
        : `\\beta_{\\mathrm{s}} &= \\sqrt{\\beta_{\\mathrm{obs}}^2 - \\beta_{\\mathrm{inst}}^2} = \\sqrt{(${obs}^\\circ)^2 - (${inst}^\\circ)^2} = ${corrDeg}^\\circ`;

    return `\\begin{aligned}
${firstLine} \\\\[4pt]
\\beta_{\\mathrm{rad}} &= ${corrDeg}^\\circ \\times \\frac{\\pi}{180^\\circ} = \\mathbf{${corrRad}\\,\\mathrm{rad}}
\\end{aligned}`;
  }, [peakTrace, broadeningModel]);

  const momentTex = useMemo(() => {
    const n = validResults.length;
    const val = currentSizeNm.toFixed(precision);
    if (averageType === 'weighted') {
      return `D_{\\mathrm{int}} = \\frac{\\sum_{i=1}^{${n}} I_i\\,D_i}{\\sum_{i=1}^{${n}} I_i} = \\mathbf{${val}\\,\\mathrm{nm}}`;
    }
    if (averageType === 'arithmetic') {
      return `D_{\\mathrm{num}} = \\frac{1}{${n}}\\sum_{i=1}^{${n}} D_i = \\mathbf{${val}\\,\\mathrm{nm}}`;
    }
    if (averageType === 'volume') {
      return `D_{V} = \\frac{\\sum_{i=1}^{${n}} D_i^4}{\\sum_{i=1}^{${n}} D_i^3} = \\mathbf{${val}\\,\\mathrm{nm}}`;
    }
    if (averageType === 'area') {
      return `D_{A} = \\frac{\\sum_{i=1}^{${n}} D_i^3}{\\sum_{i=1}^{${n}} D_i^2} = \\mathbf{${val}\\,\\mathrm{nm}}`;
    }
    return `D_{H} = \\left(\\frac{1}{${n}}\\sum_{i=1}^{${n}} \\frac{1}{D_i}\\right)^{-1} = \\mathbf{${val}\\,\\mathrm{nm}}`;
  }, [averageType, validResults.length, currentSizeNm, precision]);

  return (
    <div className="bg-slate-50/70 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Calculation Trace &amp; Physical Derivations
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Step-by-step Scherrer evaluation, statistical moment definitions, microstructural derivations, and metrology audit
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close calculation trace"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
        {(
          [
            { id: 'trace', label: '1. Peak Math Trace', icon: Calculator },
            { id: 'models', label: '2. Why 5 Moments?', icon: BookOpen },
            { id: 'physics', label: '3. Microstructure Physics', icon: Compass },
            { id: 'diagnostics', label: '4. Metrology Audit', icon: ShieldCheck },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PEAK-BY-PEAK MATH TRACE */}
      {activeTab === 'trace' && peakTrace && (
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Peak Selector */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Select Reflection to Audit
            </span>
            <div className="flex flex-wrap gap-1.5">
              {validResults.map((r, i) => {
                const label = r.hkl ? `(${r.hkl.join('')})` : `#${i + 1}`;
                const isSelected = selectedPeakIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPeakIdx(i)}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-sky-500/20 text-white dark:text-sky-200 border-slate-900 dark:border-sky-500/60 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {label} ({r.twoTheta.toFixed(1)}°)
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  01. Instrumental Broadening Deconvolution
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {broadeningModel}
                  {peakTrace.ka2Deg > 0 ? ` · Δ2θ(Kα₂) ${peakTrace.ka2Deg.toFixed(4)}°` : ''}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Subtract finite diffractometer slit width and axial divergence (<MathFormula tex="\beta_{\mathrm{inst}}" />) from the observed breadth (<MathFormula tex="\beta_{\mathrm{obs}}" />) using the{' '}
                <strong>{broadeningModel}</strong> deconvolution law:
              </p>
              <EquationPlate
                tex={deconvolutionTex}
                label={`${broadeningModel} Deconvolution`}
                dimension="[1] · rad"
                eqNumber="(1)"
              />
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-semibold text-slate-900 dark:text-white block">
                02. Bragg Angle &amp; Reciprocal Projection Factor
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Normalize geometric <MathFormula tex="1/\cos\theta" /> angular dispersion along the circular goniometer track:
              </p>
              <EquationPlate
                tex={`\\begin{aligned}
\\theta &= \\frac{2\\theta}{2} = \\frac{${peakTrace.twoTheta.toFixed(3)}^\\circ}{2} = ${peakTrace.thetaDeg.toFixed(3)}^\\circ = ${peakTrace.thetaRad.toFixed(5)}\\,\\mathrm{rad} \\\\[4pt]
\\cos\\theta &= \\mathbf{${peakTrace.cosTheta.toFixed(5)}}, \\qquad d_{${peakTrace.hklCompact}} = \\frac{\\lambda}{2\\sin\\theta} = ${peakTrace.dSpacing.toFixed(3)}\\,\\text{\\AA}
\\end{aligned}`}
                label="Bragg Projection & d-Spacing"
                dimension="θ [rad] · d [Å]"
                eqNumber="(2)"
              />
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Higher <MathFormula tex="2\theta" /> reflections broaden naturally as <MathFormula tex="1/\cos\theta" /> for identical coherent domain dimensions.
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-semibold text-slate-900 dark:text-white block">
                03. Scherrer Sizing Equation Evaluation
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Substituting <MathFormula tex={`K_{hkl} = ${peakTrace.effectiveK.toFixed(3)}`} /> and{' '}
                <MathFormula tex={`\\lambda = ${wavelength}\\,\\text{\\AA} = ${peakTrace.lambdaNm.toFixed(5)}\\,\\mathrm{nm}`} /> for reflection {peakTrace.hklStr}:
              </p>
              <EquationPlate
                tex={`\\begin{aligned}
D_{${peakTrace.hklCompact}} &= \\frac{K_{hkl}\\,\\lambda}{\\beta_{\\mathrm{s}}\\cos\\theta} = \\frac{${peakTrace.effectiveK.toFixed(3)} \\times ${peakTrace.lambdaNm.toFixed(5)}\\,\\mathrm{nm}}{${peakTrace.betaCorrRad.toFixed(6)}\\,\\mathrm{rad} \\times ${peakTrace.cosTheta.toFixed(4)}} \\\\[4pt]
&= \\frac{${peakTrace.numeratorNm.toFixed(5)}\\,\\mathrm{nm}}{${peakTrace.denominatorRad.toFixed(6)}} = \\mathbf{${peakTrace.sizeNm.toFixed(precision)}\\,\\mathrm{nm}}
\\end{aligned}`}
                label={`Scherrer Evaluation · ${peakTrace.hklStr}`}
                dimension="[L] · nm"
                eqNumber="(3)"
                emphasis="result"
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <span>
                  <MathFormula tex="d_{hkl}" /> = <strong className="text-slate-800 dark:text-slate-200">{peakTrace.dSpacing.toFixed(3)} Å</strong>
                </span>
                <span>
                  <MathFormula tex="N" /> ≈ <strong className="text-slate-800 dark:text-slate-200">{peakTrace.planesN} planes</strong>
                </span>
                <span>
                  <MathFormula tex="\delta" /> ≈ <strong className="text-slate-800 dark:text-slate-200">{peakTrace.disloc10_14.toFixed(2)}×10¹⁴ m⁻²</strong>
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-semibold text-slate-900 dark:text-white block">
                04. Ensemble Moment Synthesis ({averageType})
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                This reflection carries relative intensity <MathFormula tex={`I = ${peakTrace.intensity.toFixed(0)}`} /> ({peakTrace.weightPct.toFixed(1)}% pattern weight). Synthesizing across all{' '}
                <MathFormula tex={`N = ${validResults.length}`} /> resolved planes:
              </p>
              <EquationPlate
                tex={momentTex}
                label="Ensemble Crystallite Moment"
                dimension="[L] · nm"
                eqNumber="(4)"
                emphasis="primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHY 5 MOMENTS? */}
      {activeTab === 'models' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="font-semibold text-slate-900 dark:text-white">
              Why XRD Crystallite Sizes Differ from TEM &amp; the Hierarchy of Five Statistical Moments
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              TEM grain counting yields a <strong>Number / Arithmetic Mean (<MathFormula tex="D_{\mathrm{num}}" />)</strong> because each particle is counted once. Powder XRD coherent scattering scales with domain volume, weighting larger crystallites more heavily—producing a strict mathematical ordering for any polydisperse powder:
            </p>
            <EquationPlate
              tex="D_H \;\le\; D_g \;\le\; D_{\mathrm{num}} \;\le\; D_A \;\le\; D_V"
              label="Cauchy–Schwarz / Power-Mean Moment Ordering"
              eqNumber="(M0)"
              copyable={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              {
                title: 'Intensity-Weighted Mean',
                sym: 'D_{\\mathrm{int}}',
                eqNo: '(M1)',
                context: 'Standard XRD practice',
                tex: 'D_{\\mathrm{int}} = \\frac{\\sum_{i=1}^{N} I_i\\,D_i}{\\sum_{i=1}^{N} I_i}',
                desc: 'Weights each reflection by integrated or peak intensity. Suppresses noisy high-angle peaks while tracking the dominant diffracting volume.',
              },
              {
                title: 'Number / Arithmetic Mean',
                sym: 'D_{\\mathrm{num}}',
                eqNo: '(M2)',
                context: 'TEM / SEM comparable',
                tex: 'D_{\\mathrm{num}} = \\frac{1}{N}\\sum_{i=1}^{N} D_i = \\frac{\\langle D^1 \\rangle}{\\langle D^0 \\rangle}',
                desc: 'Assigns uniform 1/N weight to each reflection regardless of intensity. Closest analogue to direct microscopy counting.',
              },
              {
                title: 'Volume-Weighted Moment',
                sym: 'D_V',
                eqNo: '(M3)',
                context: 'ISO 26824 / ASTM E2865',
                tex: 'D_V = \\frac{\\sum_{i=1}^{N} D_i^4}{\\sum_{i=1}^{N} D_i^3} = \\frac{\\langle D^4 \\rangle}{\\langle D^3 \\rangle}',
                desc: 'Fourth-to-third moment ratio (De Brouckere mean). International standard for bulk volume-weighted particle size distributions.',
              },
              {
                title: 'Area-Weighted Moment',
                sym: 'D_A',
                eqNo: '(M4)',
                context: 'Catalysis & surface area',
                tex: 'D_A = \\frac{\\sum_{i=1}^{N} D_i^3}{\\sum_{i=1}^{N} D_i^2} = \\frac{\\langle D^3 \\rangle}{\\langle D^2 \\rangle}',
                desc: 'Sauter mean diameter inversely proportional to specific surface area. Preferred for catalysts, adsorbents, and battery electrodes.',
              },
              {
                title: 'Harmonic Mean',
                sym: 'D_H',
                eqNo: '(M5)',
                context: 'Reciprocal broadening ⟨β cos θ⟩',
                tex: 'D_H = \\frac{N}{\\sum_{i=1}^{N} D_i^{-1}} = \\frac{K\\lambda}{\\langle \\beta_{\\mathrm{s}}\\cos\\theta \\rangle}',
                desc: 'Directly corresponds to averaging reciprocal size (or Scherrer broadening β cos θ) before inversion. Most sensitive to fine nanocrystalline domains.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.title} (<MathFormula tex={item.sym} />)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.context}</span>
                </div>
                <EquationPlate tex={item.tex} eqNumber={item.eqNo} />
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MICROSTRUCTURE PHYSICS */}
      {activeTab === 'physics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {[
            {
              title: 'Dislocation Density',
              sym: '\\delta',
              eqNo: '(P1)',
              dim: '[L⁻²] · m⁻²',
              tex: '\\delta = \\frac{1}{D^2} = \\frac{10^{18}}{\\left(D_{\\mathrm{nm}}\\right)^2}\\;\\mathrm{m}^{-2}',
              body: 'Williamson & Smallman (1956) lower-bound estimate assuming one dislocation line per coherent domain face. Values of 10¹⁴–10¹⁶ m⁻² characterize heavily ball-milled or quenched nanocrystals.',
            },
            {
              title: 'Specific Surface Area',
              sym: '\\mathrm{SSA}',
              eqNo: '(P2)',
              dim: '[L²·M⁻¹] · m²/g',
              tex: '\\mathrm{SSA} = \\frac{4\\pi r^2}{\\frac{4}{3}\\pi r^3 \\rho} = \\frac{6}{\\rho\\,D} = \\frac{6 \\times 10^3}{\\rho_{\\mathrm{g/cm^3}}\\,D_{\\mathrm{nm}}}',
              body: `Derived from the spherical surface-to-mass ratio using crystal density ρ = ${materialDensity} g/cm³. The 6 × 10³ factor converts g/cm³ and nm directly into m²/g.`,
            },
            {
              title: 'Polydispersity Index',
              sym: '\\mathrm{PDI}',
              eqNo: '(P3)',
              dim: 'Dimensionless [1]',
              tex: '\\mathrm{PDI} = \\left(\\frac{\\sigma_D}{\\bar{D}}\\right)^2 = \\mathrm{CV}^2',
              body: 'Normalized variance across resolved reflections: PDI < 0.05 indicates monodisperse equiaxed grains; 0.05–0.20 moderate dispersion; > 0.20 broad or strongly anisotropic facets.',
            },
            {
              title: 'Crystallographic Anisotropy & Surface Fraction',
              sym: 'f_{\\mathrm{surf}}',
              eqNo: '(P4)',
              dim: 'Ratio [1]',
              tex: '\\mathcal{A} = \\frac{D_{\\max}}{D_{\\min}}, \\qquad f_{\\mathrm{surf}} = 1 - \\left(1 - \\frac{2\\,d_{\\mathrm{shell}}}{D}\\right)^3',
              body: 'Anisotropy ratios near 1.0 indicate isotropic spheres or cubes; ratios > 1.4 point to nanorods or platelets. Surface fraction estimates the proportion of atoms within one lattice shell.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                {item.title} (<MathFormula tex={item.sym} />)
              </div>
              <EquationPlate tex={item.tex} dimension={item.dim} eqNumber={item.eqNo} />
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: METROLOGY HEALTH AUDIT */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-2.5 text-xs">
          {[
            {
              ok: currentSizeNm <= 150,
              title: '1. Instrumental Optics Limit (D < 100–150 nm)',
              detail: `Scherrer sizing is reliable for 1–100 nm coherent domains; above ~150 nm sample broadening approaches slit resolution. Current: ${currentSizeNm.toFixed(1)} nm.`,
            },
            {
              ok: Math.abs(whSlope) <= 0.0008,
              title: '2. Microstrain Separation Check',
              detail: `Pure Scherrer assumes zero microstrain. Current Williamson–Hall slope estimate: ${(Math.abs(whSlope) * 100).toFixed(2)}%. Use Williamson–Hall if strain is significant.`,
            },
            {
              ok: validResults.length >= 3,
              title: '3. Multi-Reflection Redundancy (N ≥ 3)',
              detail: `Using at least three resolved reflections guards against texture and facet anisotropy bias. Currently active: ${validResults.length} reflection${validResults.length === 1 ? '' : 's'}.`,
            },
            {
              ok: true,
              title: `4. Shape Factor K Calibration (K = ${constantK})`,
              detail: 'Standard isotropic K = 0.90 (spherical FWHM 0.94, cubic {100} 0.943, platelets 0.89, integral breadth 1.00).',
            },
            {
              ok: true,
              title: `5. X-Ray Wavelength Verification (λ = ${wavelength} Å)`,
              detail: 'Ensure the instrumental standard (e.g., NIST SRM 660c LaB₆ or 640f Si) was measured with the same anode and optics.',
            },
          ].map((rule) => (
            <div
              key={rule.title}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                rule.ok
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 text-amber-950 dark:text-amber-200'
              }`}
            >
              {rule.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{rule.title}</div>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{rule.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
