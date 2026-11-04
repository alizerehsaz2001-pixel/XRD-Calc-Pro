import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Sparkles, Zap, Sliders, ArrowRight, RefreshCw,
  Layers, Gauge, Compass, CheckCircle2, Eye, Split
} from 'lucide-react';
import { FWHMResult } from '../../types';

export type ProfileKernelType =
  | 'Gaussian'
  | 'Lorentzian'
  | 'Pseudo-Voigt'
  | 'Thompson-Cox-Hastings'
  | 'Pearson VII';

export interface BraggSavedPeak {
  angle2Theta: number;
  twoTheta?: number;
  theta?: number;
  dSpacing: number;
  hkl?: string;
  relIntensity?: number;
  intensity?: number;
}

export interface BraggSavedSession {
  sampleId?: string;
  materialName?: string;
  wavelength?: number;
  wavelengthAngstrom?: number;
  fwhm?: number;
  peaks?: BraggSavedPeak[];
  results?: {
    twoTheta?: number;
    angle2Theta?: number;
    dSpacing?: number;
    hkl?: string;
    intensity?: number;
  }[];
}

export interface ExtendedProfileStats extends FWHMResult {
  effTchFwhm: number;
  fwtm: number;
  fwtmRatio: number;
  betaInst: number;
  betaSample: number;
  dSpacing: number;
  qVector: number;
  centroid: number;
  skewness: number;
  rWP: number;
  goodnessOfFit: number;
  snr: number;
}

interface LineProfileAnalyticsHeaderProps {
  type: ProfileKernelType;
  setType: React.Dispatch<React.SetStateAction<ProfileKernelType>>;
  center: number;
  setCenter: (c: number) => void;
  fwhm: number;
  setFwhmManual: (f: number) => void;
  eta: number;
  setEta: (e: number) => void;
  pearsonM: number;
  setPearsonM: (m: number) => void;
  amplitude: number;
  activeWavelength: number;
  scherrerK: number;
  stats: ExtendedProfileStats;
  onApplyScenario: (preset: 'silicon' | 'gold_nano' | 'ka_doublet' | 'strain' | 'multi_peak' | 'solitude' | 'tch_lab6' | 'pearson_vii') => void;
  onRunAutoFit: () => void;
  isFitting?: boolean;
}

const KERNEL_SPECS: {
  id: ProfileKernelType;
  displayTitle: string;
  shortLabel: string;
  formula: string;
  phiRange: string;
  fwtmRatio: string;
  physicalOrigin: string;
  accentColor: string;
  badgeClass: string;
}[] = [
  {
    id: 'Gaussian',
    displayTitle: 'Gaussian',
    shortLabel: 'Gaussian (G)',
    formula: 'I(x) = I₀ · exp[−4 ln(2) · (x/β)²]',
    phiRange: 'φ = 0.9394',
    fwtmRatio: '1.823×',
    physicalOrigin: 'Instrumental slit resolution & isotropic Gaussian lattice microstrain ⟨ε²⟩',
    accentColor: '#06b6d4',
    badgeClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
  {
    id: 'Lorentzian',
    displayTitle: 'Lorentzian',
    shortLabel: 'Lorentzian (L)',
    formula: 'I(x) = I₀ · [1 + 4 · (x/β)²]⁻¹',
    phiRange: 'φ = 0.6366',
    fwtmRatio: '3.000×',
    physicalOrigin: 'Finite coherent crystallite domain size D & spectral Kα natural line width',
    accentColor: '#f43f5e',
    badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  },
  {
    id: 'Pseudo-Voigt',
    displayTitle: 'Pseudo-Voigt',
    shortLabel: 'Pseudo-Voigt (pV)',
    formula: 'I(x) = η·L(x, β) + (1 − η)·G(x, β)',
    phiRange: '0.637 – 0.939',
    fwtmRatio: '1.82 – 3.00×',
    physicalOrigin: 'Linear mixing of size (Lorentzian η) and strain/instrument (Gaussian 1−η)',
    accentColor: '#6366f1',
    badgeClass: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  },
  {
    id: 'Thompson-Cox-Hastings',
    displayTitle: 'TCH-pV',
    shortLabel: 'Thompson-Cox-Hastings',
    formula: 'Γ = (Γ_G⁵ + 2.69269 Γ_G⁴Γ_L + ... + Γ_L⁵)¹/⁵',
    phiRange: 'Rietveld Std',
    fwtmRatio: 'Dynamic Γ_G/Γ_L',
    physicalOrigin: 'Independent Gaussian (Γ_G) & Lorentzian (Γ_L) widths for size-strain separation',
    accentColor: '#a855f7',
    badgeClass: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  },
  {
    id: 'Pearson VII',
    displayTitle: 'Pearson VII',
    shortLabel: 'Pearson VII (PVII)',
    formula: 'I(x) = I₀ · [1 + 4(2¹/ᵐ − 1)(x/β)²]⁻ᵐ',
    phiRange: 'm ∈ [0.5, 20]',
    fwtmRatio: 'Variable m',
    physicalOrigin: 'Continuous tail exponent m (m=1 Lorentzian, m→∞ Gaussian, m<1 super-Lorentzian)',
    accentColor: '#10b981',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
];

const SCENARIO_CARDS: {
  id: 'solitude' | 'tch_lab6' | 'silicon' | 'gold_nano' | 'pearson_vii' | 'ka_doublet' | 'strain' | 'multi_peak';
  title: string;
  subtitle: string;
  metrics: string;
  dotColor: string;
}[] = [
  {
    id: 'tch_lab6',
    title: 'NIST LaB₆ 660c',
    subtitle: 'TCH-pV Calibration',
    metrics: '2θ = 30.38° · Γ_G/Γ_L',
    dotColor: 'bg-purple-400',
  },
  {
    id: 'silicon',
    title: 'NIST Si 640f (111)',
    subtitle: 'Instrumental Standard',
    metrics: '2θ = 28.44° · β = 0.08°',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'gold_nano',
    title: 'Au Nanoparticle',
    subtitle: '~10 nm Size Broadening',
    metrics: '2θ = 38.18° · β = 0.85°',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'pearson_vii',
    title: 'Pearson VII Tails',
    subtitle: 'Heavy-Tailed m = 1.8',
    metrics: '2θ = 38.18° · m = 1.80',
    dotColor: 'bg-teal-400',
  },
  {
    id: 'ka_doublet',
    title: 'Cu Kα₁ / Kα₂ Split',
    subtitle: 'Rachinger 2:1 Doublet',
    metrics: '2θ = 44.39° · Δλ Split',
    dotColor: 'bg-sky-400',
  },
  {
    id: 'strain',
    title: 'Microstrain Tailed',
    subtitle: 'Asymmetric Dislocation',
    metrics: '2θ = 42.50° · Asym 1.8',
    dotColor: 'bg-rose-400',
  },
  {
    id: 'multi_peak',
    title: 'Overlapping Cluster',
    subtitle: 'Multi-Peak Deconvolution',
    metrics: '2θ = 35.8° / 36.2°',
    dotColor: 'bg-fuchsia-400',
  },
  {
    id: 'solitude',
    title: 'Solitude Pure Peak',
    subtitle: 'Zero-Noise Ideal Curve',
    metrics: '2θ = 30.00° · SNR ∞',
    dotColor: 'bg-indigo-300',
  },
];

export const LineProfileAnalyticsHeader: React.FC<LineProfileAnalyticsHeaderProps> = ({
  type,
  setType,
  center,
  setCenter,
  fwhm,
  setFwhmManual,
  eta,
  setEta,
  pearsonM,
  setPearsonM,
  activeWavelength,
  scherrerK,
  stats,
  onApplyScenario,
  onRunAutoFit,
  isFitting = false,
}) => {
  const [activeScenario, setActiveScenario] = useState<string>('tch_lab6');
  const [showAnatomyDrawer, setShowAnatomyDrawer] = useState<boolean>(true);
  const [braggSession, setBraggSession] = useState<BraggSavedSession | null>(null);

  // Load saved Bragg Diffractometer peaks so user can pull any (hkl) reflection into Line Profile Analytics
  const refreshBraggSession = () => {
    try {
      const raw = localStorage.getItem('xrd_bragg_current');
      if (!raw) return;
      const parsed = JSON.parse(raw) as BraggSavedSession;
      if (!parsed || typeof parsed !== 'object') return;

      const rawList = Array.isArray(parsed.results)
        ? parsed.results
        : Array.isArray(parsed.peaks)
        ? parsed.peaks
        : [];

      const normalizedPeaks: BraggSavedPeak[] = rawList
        .map((pk): BraggSavedPeak | null => {
          const angle = Number(pk.twoTheta ?? pk.angle2Theta ?? NaN);
          const dVal = Number(pk.dSpacing ?? NaN);
          if (!Number.isFinite(angle) || angle <= 0) return null;
          return {
            angle2Theta: angle,
            dSpacing: Number.isFinite(dVal) && dVal > 0 ? dVal : 1.54056 / (2 * Math.sin((angle / 2) * (Math.PI / 180))),
            hkl: pk.hkl ? String(pk.hkl) : undefined,
          };
        })
        .filter((item): item is BraggSavedPeak => item !== null);

      if (normalizedPeaks.length > 0) {
        setBraggSession({
          ...parsed,
          materialName: parsed.materialName || parsed.sampleId || 'Active Crystal',
          peaks: normalizedPeaks,
        });
      }
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    refreshBraggSession();
    window.addEventListener('focus', refreshBraggSession);
    return () => window.removeEventListener('focus', refreshBraggSession);
  }, []);

  const currentKernel = useMemo(
    () => KERNEL_SPECS.find((k) => k.id === type) || KERNEL_SPECS[2],
    [type]
  );

  // Compute normalized SVG profile curves for the interactive Kernel & Anatomy schematic
  const svgCurveData = useMemo(() => {
    const width = 440;
    const height = 150;
    const padX = 28;
    const padTop = 18;
    const padBottom = 24;
    const plotW = width - padX * 2;
    const plotH = height - padTop - padBottom;

    // Normalized x in units of FWHM: u = (x - x0) / FWHM in [-2.6, +2.6]
    const uMax = 2.6;
    const steps = 120;

    const evalGaussian = (u: number) => Math.exp(-4 * Math.LN2 * u * u);
    const evalLorentzian = (u: number) => 1 / (1 + 4 * u * u);
    const evalActive = (u: number) => {
      if (type === 'Gaussian') return evalGaussian(u);
      if (type === 'Lorentzian') return evalLorentzian(u);
      if (type === 'Pearson VII') {
        const m = Math.max(0.5, pearsonM || 1.5);
        const factor = Math.pow(2, 1 / m) - 1;
        return Math.pow(1 + 4 * factor * u * u, -m);
      }
      // Pseudo-Voigt or Thompson-Cox-Hastings
      const effEta = Math.min(1, Math.max(0, eta));
      return effEta * evalLorentzian(u) + (1 - effEta) * evalGaussian(u);
    };

    const toSvgX = (u: number) => padX + ((u + uMax) / (2 * uMax)) * plotW;
    const toSvgY = (val: number) => padTop + (1 - Math.min(1.05, Math.max(0, val))) * plotH;

    const gaussPts: string[] = [];
    const lorentzPts: string[] = [];
    const activePts: string[] = [];
    const areaPts: string[] = [`${toSvgX(-uMax).toFixed(1)},${toSvgY(0).toFixed(1)}`];

    for (let i = 0; i <= steps; i++) {
      const u = -uMax + (i / steps) * (2 * uMax);
      const sx = toSvgX(u).toFixed(1);
      const gY = toSvgY(evalGaussian(u)).toFixed(1);
      const lY = toSvgY(evalLorentzian(u)).toFixed(1);
      const aY = toSvgY(evalActive(u)).toFixed(1);

      gaussPts.push(`${sx},${gY}`);
      lorentzPts.push(`${sx},${lY}`);
      activePts.push(`${sx},${aY}`);
      areaPts.push(`${sx},${aY}`);
    }
    areaPts.push(`${toSvgX(uMax).toFixed(1)},${toSvgY(0).toFixed(1)}`);

    // Find FWTM half-width u_10 where evalActive(u_10) = 0.1
    let u10 = 0.91;
    for (let u = 0.5; u <= uMax; u += 0.02) {
      if (evalActive(u) <= 0.1) {
        u10 = u;
        break;
      }
    }

    // Integral breadth in units of FWHM: beta_int / FWHM = 1 / phi
    const phiVal = stats.shapeFactor > 0 ? stats.shapeFactor : 0.78;
    const uIntHalf = Math.min(uMax * 0.85, 0.5 / phiVal);

    return {
      width,
      height,
      baseY: toSvgY(0),
      peakY: toSvgY(1),
      halfMaxY: toSvgY(0.5),
      tenthMaxY: toSvgY(0.1),
      centerX: toSvgX(0),
      fwhmLeftX: toSvgX(-0.5),
      fwhmRightX: toSvgX(0.5),
      fwtmLeftX: toSvgX(-u10),
      fwtmRightX: toSvgX(u10),
      intLeftX: toSvgX(-uIntHalf),
      intRightX: toSvgX(uIntHalf),
      gaussPolyline: gaussPts.join(' '),
      lorentzPolyline: lorentzPts.join(' '),
      activePolyline: activePts.join(' '),
      activeAreaPolygon: areaPts.join(' '),
    };
  }, [type, eta, pearsonM, stats.shapeFactor]);

  // Derived physical domain size (nm) and microstrain (x10^-3)
  const physicalReadout = useMemo(() => {
    const thetaRad = ((center / 2) * Math.PI) / 180;
    const betaRad = (Math.max(0.0001, stats.betaSample) * Math.PI) / 180;
    const sizeNm =
      stats.betaSample > 0 && Math.cos(thetaRad) > 0.01
        ? (scherrerK * activeWavelength) / (betaRad * Math.cos(thetaRad))
        : 0;
    const strainMilli =
      stats.betaSample > 0 && Math.tan(thetaRad) > 0.01
        ? (betaRad / (4 * Math.tan(thetaRad))) * 1000
        : 0;
    return {
      sizeNm: sizeNm > 300 ? '>300 nm' : sizeNm > 0 ? `${sizeNm.toFixed(1)} nm` : '—',
      strainMilli: strainMilli > 0 ? `${strainMilli.toFixed(2)}×10⁻³` : '—',
    };
  }, [center, stats.betaSample, scherrerK, activeWavelength]);

  return (
    <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
      {/* Top Instrument Command Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Line Profile Analytics & Kernel Deconvolution Workbench
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-300">
                λ = {(activeWavelength * 10).toFixed(4)} Å
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Quantitative peak shape modeling, Caglioti instrumental stripping, and Voigt size–strain separation
            </p>
          </div>
        </div>

        {/* Live Telemetry Strip & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono tabular-nums">
            <div>
              <span className="text-slate-500 mr-1">2θ₀:</span>
              <span className="font-bold text-white">{center.toFixed(3)}°</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              <span className="text-slate-500 mr-1">β_obs:</span>
              <span className="font-bold text-indigo-400">{stats.effTchFwhm.toFixed(4)}°</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              <span className="text-slate-500 mr-1">φ = FWHM/β_int:</span>
              <span className="font-bold text-emerald-400">{stats.shapeFactor.toFixed(3)}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              <span className="text-slate-500 mr-1">D:</span>
              <span className="font-bold text-amber-300">{physicalReadout.sizeNm}</span>
            </div>
          </div>

          <button
            onClick={onRunAutoFit}
            disabled={isFitting}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Run Levenberg-Marquardt Non-Linear Least Squares (NLLS) profile refinement"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{isFitting ? 'Refining...' : 'Auto-Fit NLLS'}</span>
          </button>

          <button
            onClick={() => setShowAnatomyDrawer((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showAnatomyDrawer
                ? 'bg-slate-800 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Interactive Kernel Comparator & Peak Anatomy Schematic"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showAnatomyDrawer ? 'Hide Kernel Anatomy' : 'Kernel Anatomy'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Interactive Kernel Comparator & Anatomy Workbench */}
      {showAnatomyDrawer && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/70 border-b border-slate-800/80">
          {/* Left 7 Cols: 5 Analytical Kernel Switcher Cards + Active Equation */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  1. Select Analytical Diffraction Kernel Function
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Active: <strong className="text-white">{currentKernel.shortLabel}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {KERNEL_SPECS.map((k) => {
                  const isSelected = type === k.id;
                  return (
                    <button
                      key={k.id}
                      onClick={() => setType(k.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400/50'
                          : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: k.accentColor }}
                        />
                        <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                          {k.fwtmRatio}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-tight truncate">
                        {k.displayTitle}
                      </div>
                      <div className="text-[9px] font-mono text-indigo-300/90 mt-1 truncate">
                        {k.phiRange}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Kernel Mathematical Definition & Interactive Mixing Quick-Sliders */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${currentKernel.badgeClass}`}>
                    {currentKernel.formula}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {currentKernel.physicalOrigin}
                </p>
              </div>

              {/* Direct Quick-Control for Eta or Pearson m or FWHM */}
              <div className="flex items-center gap-3 shrink-0 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-slate-400">FWHM (β):</span>
                    <span className="text-indigo-400 font-bold tabular-nums">{fwhm.toFixed(3)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0.04"
                    max="2.50"
                    step="0.01"
                    value={fwhm}
                    onChange={(e) => setFwhmManual(parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
                  />
                </div>

                {(type === 'Pseudo-Voigt' || type === 'Thompson-Cox-Hastings') && (
                  <div className="flex flex-col border-l border-slate-800 pl-3">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="text-slate-400">Lorentz η:</span>
                      <span className="text-purple-400 font-bold tabular-nums">{(eta * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={eta}
                      onChange={(e) => setEta(parseFloat(e.target.value))}
                      className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-1"
                    />
                  </div>
                )}

                {type === 'Pearson VII' && (
                  <div className="flex flex-col border-l border-slate-800 pl-3">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="text-slate-400">Shape m:</span>
                      <span className="text-emerald-400 font-bold tabular-nums">{pearsonM.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.1"
                      value={pearsonM}
                      onChange={(e) => setPearsonM(parseFloat(e.target.value))}
                      className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sync from Bragg Diffractometer Reflection Strip (if available in localStorage) */}
            {braggSession && braggSession.peaks && braggSession.peaks.length > 0 && (
              <div className="px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-bold text-indigo-200">
                    Bragg Diffractometer Reflections ({braggSession.materialName || 'Active Crystal'}):
                  </span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">
                    Click any (hkl) reflection to inspect its line profile
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {braggSession.peaks.slice(0, 6).map((pk, idx) => {
                    const isCurrentPeak = Math.abs(center - pk.angle2Theta) < 0.08;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCenter(Number(pk.angle2Theta.toFixed(3)));
                          if (braggSession.fwhm && braggSession.fwhm >= 0.05) {
                            setFwhmManual(Number(braggSession.fwhm.toFixed(3)));
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isCurrentPeak
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900/90 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/30'
                        }`}
                        title={`Load reflection (${pk.hkl || idx + 1}) at 2θ = ${pk.angle2Theta.toFixed(3)}° (d = ${pk.dSpacing.toFixed(3)} Å)`}
                      >
                        {pk.hkl && <span className="text-amber-300">({pk.hkl})</span>}
                        <span>{pk.angle2Theta.toFixed(2)}°</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Live Interactive SVG Peak Anatomy & Kernel Overlay Diagram */}
          <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-slate-300">
                Live Kernel Anatomy vs. Gauss/Lorentz Limits
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> G
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-0.5 bg-rose-400 inline-block" /> L
                </span>
                <span className="flex items-center gap-1 text-indigo-300 font-bold">
                  <span className="w-2.5 h-1 bg-indigo-400 inline-block rounded-full" /> Active
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${svgCurveData.width} ${svgCurveData.height}`}
              className="w-full h-36 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="activeKernelFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentKernel.accentColor} stopOpacity="0.38" />
                  <stop offset="100%" stopColor={currentKernel.accentColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Integral Breadth (beta_int) Equivalent Rectangle */}
              <rect
                x={svgCurveData.intLeftX}
                y={svgCurveData.peakY}
                width={svgCurveData.intRightX - svgCurveData.intLeftX}
                height={svgCurveData.baseY - svgCurveData.peakY}
                fill="#10b981"
                fillOpacity="0.06"
                stroke="#10b981"
                strokeOpacity="0.4"
                strokeDasharray="3 3"
                rx="2"
              />
              <text
                x={svgCurveData.intRightX + 4}
                y={svgCurveData.peakY + 11}
                fill="#34d399"
                fontSize="8.5"
                fontFamily="monospace"
              >
                β_int box (A/I₀)
              </text>

              {/* Baseline */}
              <line
                x1={20}
                y1={svgCurveData.baseY}
                x2={svgCurveData.width - 20}
                y2={svgCurveData.baseY}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Reference Gaussian (dashed cyan) */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                strokeOpacity="0.65"
                points={svgCurveData.gaussPolyline}
              />

              {/* Reference Lorentzian (dashed rose) */}
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                strokeOpacity="0.65"
                points={svgCurveData.lorentzPolyline}
              />

              {/* Active Kernel Shaded Area & Solid Curve */}
              <polygon fill="url(#activeKernelFill)" points={svgCurveData.activeAreaPolygon} />
              <polyline
                fill="none"
                stroke={currentKernel.accentColor}
                strokeWidth="2.4"
                points={svgCurveData.activePolyline}
              />

              {/* Centroid Vertical Line */}
              <line
                x1={svgCurveData.centerX}
                y1={svgCurveData.peakY}
                x2={svgCurveData.centerX}
                y2={svgCurveData.baseY}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* FWHM Callout at 50% I_max */}
              <line
                x1={svgCurveData.fwhmLeftX}
                y1={svgCurveData.halfMaxY}
                x2={svgCurveData.fwhmRightX}
                y2={svgCurveData.halfMaxY}
                stroke="#fbbf24"
                strokeWidth="1.8"
              />
              <circle cx={svgCurveData.fwhmLeftX} cy={svgCurveData.halfMaxY} r="2.8" fill="#fbbf24" />
              <circle cx={svgCurveData.fwhmRightX} cy={svgCurveData.halfMaxY} r="2.8" fill="#fbbf24" />
              <text
                x={svgCurveData.centerX}
                y={svgCurveData.halfMaxY - 5}
                textAnchor="middle"
                fill="#fde68a"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                FWHM = {stats.effTchFwhm.toFixed(3)}°
              </text>

              {/* FWTM Callout at 10% I_max */}
              <line
                x1={svgCurveData.fwtmLeftX}
                y1={svgCurveData.tenthMaxY}
                x2={svgCurveData.fwtmRightX}
                y2={svgCurveData.tenthMaxY}
                stroke="#38bdf8"
                strokeWidth="1.3"
              />
              <circle cx={svgCurveData.fwtmLeftX} cy={svgCurveData.tenthMaxY} r="2.2" fill="#38bdf8" />
              <circle cx={svgCurveData.fwtmRightX} cy={svgCurveData.tenthMaxY} r="2.2" fill="#38bdf8" />
              <text
                x={svgCurveData.centerX}
                y={svgCurveData.tenthMaxY - 4}
                textAnchor="middle"
                fill="#7dd3fc"
                fontSize="8.5"
                fontFamily="monospace"
              >
                FWTM = {stats.fwtm.toFixed(3)}° ({stats.fwtmRatio.toFixed(2)}×)
              </text>

              {/* Axis Annotations */}
              <text
                x={svgCurveData.centerX}
                y={svgCurveData.baseY + 14}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="9"
                fontFamily="monospace"
              >
                2θ₀ = {center.toFixed(3)}° (d = {stats.dSpacing.toFixed(4)} Å)
              </text>
            </svg>

            <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-900 text-[10px] font-mono tabular-nums">
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">Integral Breadth β_int</span>
                <span className="text-emerald-400 font-bold">{stats.integralBreadth.toFixed(4)}°</span>
              </div>
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">Voigt Shape φ</span>
                <span className="text-amber-300 font-bold">{stats.shapeFactor.toFixed(4)}</span>
              </div>
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">Sample β_sample</span>
                <span className="text-purple-300 font-bold">{stats.betaSample.toFixed(4)}°</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom 1-Click Standard Specimen & Calibration Scenarios Strip */}
      <div className="px-4 py-2.5 bg-slate-950 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Standard Calibration & Specimen Scenarios:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5 w-full">
          {SCENARIO_CARDS.map((sc) => {
            const isActive = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setActiveScenario(sc.id);
                  onApplyScenario(sc.id);
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-600/25 border-indigo-400 text-white shadow-sm'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
                title={`${sc.title} — ${sc.subtitle} (${sc.metrics})`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dotColor}`} />
                  <span className="text-[10px] font-bold text-white truncate">{sc.title}</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 truncate mt-0.5 tabular-nums">
                  {sc.metrics}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
