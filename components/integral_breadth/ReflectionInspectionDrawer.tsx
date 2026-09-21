import React from 'react';
import { 
  X, 
  Activity, 
  Layers, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  Atom,
  Scale,
  Compass,
  Zap,
  HelpCircle,
  Copy
} from 'lucide-react';
import { IntegralBreadthResult } from '../../types';
import katex from 'katex';

interface ReflectionInspectionDrawerProps {
  reflection: IntegralBreadthResult | null;
  index: number;
  wavelength: number;
  constantK: number;
  materialDensity: number;
  instFwhm: number;
  onClose: () => void;
}

const renderKatex = (latex: string) => {
  try {
    return {
      __html: katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false
      })
    };
  } catch {
    return { __html: latex };
  }
};

const renderKatexBlock = (latex: string) => {
  try {
    return {
      __html: katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true
      })
    };
  } catch {
    return { __html: latex };
  }
};

export const ReflectionInspectionDrawer: React.FC<ReflectionInspectionDrawerProps> = ({
  reflection,
  index,
  wavelength,
  constantK,
  materialDensity,
  instFwhm,
  onClose
}) => {
  if (!reflection) return null;

  const twoTheta = reflection.twoTheta;
  const thetaDeg = twoTheta / 2;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const tanTheta = Math.tan(thetaRad);
  const sinTheta = Math.sin(thetaRad);
  const dSpacing = reflection.dSpacing || (wavelength / (2 * sinTheta));
  const betaObs = reflection.betaObsDeg || reflection.integralBreadthDeg;
  const fwhm = reflection.fwhmObs || (betaObs * reflection.shapeFactorPhi);
  const phi = reflection.shapeFactorPhi;
  const eta = reflection.pseudoVoigtEta ?? Math.max(0, Math.min(1, (0.9394 - phi) / (0.9394 - 0.6366)));
  const betaL = reflection.cauchyBetaL_deg || 0;
  const betaG = reflection.gaussianBetaG_deg || 0;
  const dv = reflection.volumeWeightedSizeDvNm || reflection.calcSizeNm;
  const da = reflection.areaWeightedSizeDaNm || (dv / 2);
  const eRms = reflection.apparentRmsStrain || 0;
  const dislocation = reflection.dislocationDensity10_14 || (dv > 0 ? 1 / ((dv * 1e-9) ** 2) / 1e14 : 0);
  const ssa = reflection.specificSurfaceAreaM2g || (dv > 0 ? 6000 / (materialDensity * dv) : 0);
  const layersN = reflection.coherencePlanesN || (dv > 0 && dSpacing > 0 ? (dv * 10) / dSpacing : 0);

  // Profile classification
  let shapeDesc = 'Intermediate Voigt (Mixed Size & Strain)';
  let shapeBadgeColor = 'text-purple-300 bg-purple-500/20 border-purple-500/40';
  if (phi <= 0.67) {
    shapeDesc = 'Cauchy / Lorentzian Dominant (Pure Size Broadening)';
    shapeBadgeColor = 'text-blue-300 bg-blue-500/20 border-blue-500/40';
  } else if (phi >= 0.88) {
    shapeDesc = 'Gaussian Dominant (Pure Lattice Strain Broadening)';
    shapeBadgeColor = 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#050A14] border border-purple-500/40 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl space-y-5 text-slate-200 max-h-[90vh] overflow-y-auto relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-sm">
              #{index + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Reflection {reflection.hklString ? `(${reflection.hklString})` : `Peak #${index + 1}`}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300">
                  2θ = {twoTheta.toFixed(3)}°
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Detailed Single-Line Voigt & de Keijser Analytical Deconvolution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#0A101C] p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Volume Size (Dv)</span>
            <span className="text-lg font-black text-pink-400 font-mono">{dv.toFixed(2)} nm</span>
            <span className="text-[9px] text-slate-500 block font-mono">Scherrer Volume Domain</span>
          </div>

          <div className="bg-[#0A101C] p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Area Size (Da)</span>
            <span className="text-lg font-black text-purple-300 font-mono">{da.toFixed(2)} nm</span>
            <span className="text-[9px] text-slate-500 block font-mono">Da = Dv / 2 (Column)</span>
          </div>

          <div className="bg-[#0A101C] p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">RMS Microstrain</span>
            <span className="text-lg font-black text-cyan-300 font-mono">{eRms.toExponential(2)}</span>
            <span className="text-[9px] text-slate-500 block font-mono">{(eRms * 100).toFixed(3)}% lattice strain</span>
          </div>

          <div className="bg-[#0A101C] p-3 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Dislocation (δ)</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{dislocation.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 block font-mono">×10¹⁴ lines/m²</span>
          </div>
        </div>

        {/* Step-by-Step Mathematical Flow */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Complete Deconvolution Derivation Chain
          </h4>

          {/* STEP 1: Peak Geometry */}
          <div className="bg-[#0A101C] p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                Bragg Geometry & d-Spacing
              </span>
              <span className="text-[10px] font-mono text-slate-500">λ = {wavelength} Å</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="bg-[#050A14] p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Bragg Angle θ</span>
                <span className="text-white font-bold">{thetaDeg.toFixed(3)}°</span>
              </div>
              <div className="bg-[#050A14] p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">cos(θ)</span>
                <span className="text-slate-300">{cosTheta.toFixed(4)}</span>
              </div>
              <div className="bg-[#050A14] p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">tan(θ)</span>
                <span className="text-slate-300">{tanTheta.toFixed(4)}</span>
              </div>
              <div className="bg-[#050A14] p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">d-spacing</span>
                <span className="text-amber-400 font-bold">{dSpacing.toFixed(4)} Å</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Integral Breadth & Shape Factor */}
          <div className="bg-[#0A101C] p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                Integral Breadth & Apparent Shape Factor (φ)
              </span>
              <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold ${shapeBadgeColor}`}>
                {shapeDesc}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Observed Integral Breadth</span>
                <span className="text-amber-300 font-bold">{betaObs.toFixed(4)}°</span>
                <span className="text-[9px] text-slate-500 block">β = Area / I_max</span>
              </div>

              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Observed FWHM (2w)</span>
                <span className="text-slate-200 font-bold">{fwhm.toFixed(4)}°</span>
                <span className="text-[9px] text-slate-500 block">Full Width at Half Max</span>
              </div>

              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Shape Factor φ = 2w / β</span>
                <span className="text-purple-300 font-bold">{phi.toFixed(4)}</span>
                <span className="text-[9px] text-slate-500 block">Cauchy: 0.637 | Gauss: 0.939</span>
              </div>
            </div>

            {/* Shape indicator bar */}
            <div className="pt-2">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                <span>Pure Cauchy (0.6366)</span>
                <span className="text-purple-300 font-bold">Current φ = {phi.toFixed(3)} (η = {eta.toFixed(3)})</span>
                <span>Pure Gauss (0.9394)</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10 relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" 
                  style={{ width: '100%' }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md -ml-1"
                  style={{ left: `${Math.max(0, Math.min(100, ((phi - 0.6366) / (0.9394 - 0.6366)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* STEP 3: de Keijser Single-Line Voigt Deconvolution */}
          <div className="bg-[#0A101C] p-4 rounded-2xl border border-white/5 space-y-2">
            <span className="font-bold text-pink-300 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
              de Keijser Single-Line Analytical Voigt Separation
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Using the Langford & de Keijser polynomial approximations, the total Voigt profile is split into pure Cauchy component <span className="font-mono text-pink-300">β_L</span> (crystallite size) and Gaussian component <span className="font-mono text-cyan-300">β_G</span> (lattice microstrain):
            </p>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs pt-1">
              <div className="bg-[#050A14] p-3 rounded-xl border border-pink-500/20">
                <span className="text-[10px] text-pink-400 font-bold block mb-0.5">Cauchy Breadth β_L (Size)</span>
                <span className="text-base text-pink-300 font-bold">{betaL.toFixed(4)}°</span>
                <span className="text-[9px] text-slate-500 block mt-1">D_v = (K·λ) / (β_L · cos θ)</span>
              </div>
              <div className="bg-[#050A14] p-3 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] text-cyan-400 font-bold block mb-0.5">Gaussian Breadth β_G (Strain)</span>
                <span className="text-base text-cyan-300 font-bold">{betaG.toFixed(4)}°</span>
                <span className="text-[9px] text-slate-500 block mt-1">e_rms = β_G / (2√(2π)·tan θ)</span>
              </div>
            </div>
          </div>

          {/* STEP 4: Microstructural Defect Metrics */}
          <div className="bg-[#0A101C] p-4 rounded-2xl border border-white/5 space-y-2">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
              Derived Physical Defects & Morphology
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Specific Surface Area</span>
                <span className="text-emerald-400 font-bold">{ssa.toFixed(2)} m²/g</span>
                <span className="text-[9px] text-slate-500 block">SSA = 6000 / (ρ · D)</span>
              </div>
              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Coherent Planes (N)</span>
                <span className="text-indigo-400 font-bold">{layersN.toFixed(1)}</span>
                <span className="text-[9px] text-slate-500 block">N = D / d_hkl</span>
              </div>
              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block">Domain Volume (V)</span>
                <span className="text-purple-400 font-bold">{((4/3) * Math.PI * ((dv/2) ** 3)).toFixed(1)} nm³</span>
                <span className="text-[9px] text-slate-500 block">Spherical Domain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Reflection Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
