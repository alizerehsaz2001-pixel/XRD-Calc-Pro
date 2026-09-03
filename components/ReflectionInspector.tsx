import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Crosshair, 
  ZoomIn, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  Microscope, 
  Layers, 
  Activity, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { BraggResult } from '../types';
import { convertLength, LengthUnit } from './SettingsContext';
import { CalculatedPeakMetadata, ProfileCalculationParams } from '../utils/calculatedProfileEngine';

interface ReflectionInspectorProps {
  reflection: BraggResult;
  index: number;
  metadata?: CalculatedPeakMetadata;
  params: ProfileCalculationParams;
  wavelength: number;
  lengthUnit: LengthUnit;
  precision: number;
  onUpdateAngle: (newAngle: number) => void;
  onFocusZoom: () => void;
  onClose: () => void;
}

export const ReflectionInspector: React.FC<ReflectionInspectorProps> = ({
  reflection,
  index,
  metadata,
  params,
  wavelength,
  lengthUnit,
  precision,
  onUpdateAngle,
  onFocusZoom,
  onClose,
}) => {
  const { t } = useTranslation();

  const twoTheta = reflection.twoTheta;
  const thetaRad = (twoTheta / 2) * (Math.PI / 180);
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);
  const dSpacing = reflection.dSpacing || (wavelength / (2 * Math.max(0.001, sinTheta)));
  const qVector = reflection.qVector || ((4 * Math.PI * sinTheta) / wavelength);
  const intensity = reflection.intensity !== undefined ? reflection.intensity : 100;

  const fwhm = metadata?.fwhm || 0.18;
  const integralBreadth = metadata?.integralBreadth || 0.20;
  const integratedArea = metadata?.integratedArea || (intensity * fwhm * 1.2);
  const scherrerSizeNm = metadata?.scherrerSizeNm || (
    Number(((0.94 * (wavelength / 10)) / Math.max(0.0001, (integralBreadth * Math.PI / 180) * cosTheta)).toFixed(1))
  );
  const kaSplitDeg = metadata?.kaSplitDeg;

  return (
    <div className="relative z-20 mb-6 bg-gradient-to-br from-[#0b1329] via-[#0d1633] to-[#070d1e] border border-indigo-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {t('Reflection Deconvolution Inspector', 'Reflection Deconvolution Inspector')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Peak #{index + 1}
              </span>
              {reflection.hkl && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ({reflection.hkl})
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">
              2θ = {twoTheta.toFixed(3)}° • d = {convertLength(dSpacing, lengthUnit).toFixed(precision)} {lengthUnit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFocusZoom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30"
            title={t('Zoom diffractogram around this reflection', 'Zoom diffractogram around this reflection')}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{t('Focus Peak', 'Focus Peak')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title={t('Close Inspector', 'Close Inspector')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Crystallite Size */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {t('Domain Size (Dhkl)', 'Domain Size (Dhkl)')}
          </span>
          <span className="text-lg font-mono font-black text-teal-300 tracking-tight block mt-1">
            {scherrerSizeNm} nm
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            Scherrer (K=0.94)
          </span>
        </div>

        {/* FWHM */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {t('Profile FWHM (Γ)', 'Profile FWHM (Γ)')}
          </span>
          <span className="text-lg font-mono font-black text-violet-300 tracking-tight block mt-1">
            {fwhm.toFixed(3)}°
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            Caglioti Function
          </span>
        </div>

        {/* Integral Breadth */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {t('Integral Breadth (β)', 'Integral Breadth (β)')}
          </span>
          <span className="text-lg font-mono font-black text-pink-300 tracking-tight block mt-1">
            {integralBreadth.toFixed(3)}°
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            β = ∫I d(2θ) / Imax
          </span>
        </div>

        {/* Integrated Peak Area */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {t('Integrated Area', 'Integrated Area')}
          </span>
          <span className="text-lg font-mono font-black text-amber-300 tracking-tight block mt-1">
            {integratedArea.toFixed(1)}
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            Rel. Counts · deg
          </span>
        </div>

        {/* Scattering Vector Q */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {t('Scattering Q', 'Scattering Q')}
          </span>
          <span className="text-lg font-mono font-black text-sky-300 tracking-tight block mt-1">
            {qVector.toFixed(4)} Å⁻¹
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            Q = 4π sinθ / λ
          </span>
        </div>

        {/* Kα Doublet Separation */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {t('Kα1-Kα2 Split', 'Kα1-Kα2 Split')}
          </span>
          <span className="text-lg font-mono font-black text-indigo-300 tracking-tight block mt-1">
            {kaSplitDeg !== undefined ? `+${kaSplitDeg.toFixed(3)}°` : 'Monochromatic'}
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            Δ2θ Separation
          </span>
        </div>
      </div>

      {/* Interactive Angle Fine Tuning Bar */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
            {t('Metrological Angle Tuning', 'Metrological Angle Tuning')}:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateAngle(twoTheta - 0.1)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-mono text-[10px] transition-colors"
              title="-0.10°"
            >
              -0.10°
            </button>
            <button
              type="button"
              onClick={() => onUpdateAngle(twoTheta - 0.01)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-mono text-[10px] transition-colors"
              title="-0.01°"
            >
              -0.01°
            </button>
            <input
              type="number"
              step="0.001"
              min="0"
              max="180"
              value={twoTheta.toFixed(3)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onUpdateAngle(val);
              }}
              className="w-20 text-center bg-black/50 border border-indigo-500/40 rounded px-2 py-1 font-mono font-bold text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => onUpdateAngle(twoTheta + 0.01)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-mono text-[10px] transition-colors"
              title="+0.01°"
            >
              +0.01°
            </button>
            <button
              type="button"
              onClick={() => onUpdateAngle(twoTheta + 0.1)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-mono text-[10px] transition-colors"
              title="+0.10°"
            >
              +0.10°
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <span>Shape: <strong className="text-white uppercase">{params.profileShape}</strong></span>
          <span>η = <strong className="text-indigo-300">{(params.eta * 100).toFixed(0)}%</strong></span>
          <span>Asym: <strong className="text-pink-300">{params.asymmetry}</strong></span>
          <span>Scale: <strong className="text-cyan-300 uppercase">{params.intensityScale}</strong></span>
        </div>
      </div>
    </div>
  );
};
