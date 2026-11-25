import React, { useState, useMemo } from 'react';
import { IBAdvancedResult } from '../../types';
import {
  IB_PHI_CAUCHY,
  IB_PHI_GAUSS,
  IBSeparationMethodKey,
  IBDecouplingMethodKey,
  computeExactPseudoVoigtEtaFromPhi,
  computeDeKeijserVoigtFractions,
  computeVoigtH,
  computeErfcx,
  computeLangfordVoigtBreadth
} from '../../utils/physics';
import {
  Layers,
  Sliders,
  Compass
} from 'lucide-react';

export type IBSeparationMethod = IBSeparationMethodKey;
export type IBDecouplingMethod = IBDecouplingMethodKey;

interface IBCadSchematicProps {
  result: IBAdvancedResult | null;
  selectedMaterial: string;
  wavelength: number;
  constantK: number;
  instBetaIB: number;
  instVoigtPhi?: number;
  instrumentalMode: 'constant' | 'caglioti';
  cagliotiU: number;
  cagliotiV: number;
  cagliotiW: number;
  decouplingMethod: IBDecouplingMethod;
  separationMethod: IBSeparationMethod;
  voigtShapePhi: number;
  onSelectDecouplingMethod: (m: IBDecouplingMethod) => void;
  onSelectSeparationMethod: (m: IBSeparationMethod) => void;
  onChangeVoigtPhi: (phi: number) => void;
}

export const IBCadSchematic: React.FC<IBCadSchematicProps> = ({
  result,
  selectedMaterial,
  wavelength,
  constantK,
  instBetaIB,
  instVoigtPhi = 0.8226,
  instrumentalMode,
  cagliotiU,
  cagliotiV,
  cagliotiW,
  decouplingMethod,
  separationMethod,
  voigtShapePhi,
  onSelectDecouplingMethod,
  onSelectSeparationMethod,
  onChangeVoigtPhi
}) => {
  const [activeMode, setActiveMode] = useState<'stokes' | 'deconv' | 'models'>('stokes');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);

  const validPoints = useMemo(() => {
    return (result?.pointsExtended || []).filter(p => !p.isExcluded);
  }, [result]);

  const activePeak = useMemo(() => {
    if (validPoints.length === 0) return null;
    const idx = Math.min(selectedPeakIdx, validPoints.length - 1);
    return validPoints[idx] || validPoints[0];
  }, [validPoints, selectedPeakIdx]);

  // Mode 1: Exact Faddeeva-Voigt + Pseudo-Voigt + Equivalent Stokes-Wilson Box geometry
  const stokesCurveData = useMemo(() => {
    const phi = Math.min(IB_PHI_GAUSS, Math.max(IB_PHI_CAUCHY, voigtShapePhi));
    // Exact 1/phi inversion for Pseudo-Voigt mixing parameter eta
    const eta = computeExactPseudoVoigtEtaFromPhi(phi);
    // Exact Faddeeva-Voigt component fractions (f_C, f_G, k)
    const voigtFrac = computeDeKeijserVoigtFractions(phi);
    const betaDeg = activePeak ? Math.max(0.08, activePeak.betaSampleDeg || activePeak.betaObsDeg) : 0.35;
    const fwhmDeg = betaDeg * phi;
    const betaCDeg = betaDeg * voigtFrac.fCauchy;
    const betaGDeg = betaDeg * voigtFrac.fGauss;
    const voigtK = voigtFrac.voigtK;
    const h0 = voigtK > 100 ? 1 : computeErfcx(voigtK);

    // SVG coordinate space: x in [65, 515], center = 290, baseline = 205, peak top = 53 (height = 152)
    const cx = 290;
    const baseY = 205;
    const peakH = 152;
    const pxPerDeg = 136 / betaDeg;
    const boxHalfW = (betaDeg * pxPerDeg) / 2; // 68 px
    const fwhmHalfW = (fwhmDeg * pxPerDeg) / 2; // 68 * phi px

    const voigtPts: string[] = [];
    const totalPts: string[] = [];
    const lorentzPts: string[] = [];
    const gaussPts: string[] = [];

    const numSteps = 120;
    for (let i = 0; i <= numSteps; i++) {
      const xPx = 65 + (i / numSteps) * 450;
      const dxDeg = (xPx - cx) / pxPerDeg;
      const u = dxDeg / (fwhmDeg / 2);

      const gVal = Math.exp(-Math.LN2 * u * u);
      const lVal = 1 / (1 + u * u);
      const pvVal = eta * lVal + (1 - eta) * gVal;

      let vVal = pvVal;
      if (betaGDeg < 1e-6) {
        const gammaL = Math.max(1e-6, betaCDeg / Math.PI);
        vVal = 1 / (1 + (dxDeg / gammaL) * (dxDeg / gammaL));
      } else if (betaCDeg < 1e-6) {
        const uG = (Math.sqrt(Math.PI) * dxDeg) / betaGDeg;
        vVal = Math.exp(-uG * uG);
      } else {
        const uV = (Math.sqrt(Math.PI) * dxDeg) / betaGDeg;
        vVal = Math.min(1, Math.max(0, computeVoigtH(voigtK, uV) / Math.max(1e-12, h0)));
      }

      const yVoigt = baseY - vVal * peakH;
      const yTotal = baseY - pvVal * peakH;
      const yL = baseY - eta * lVal * peakH;
      const yG = baseY - (1 - eta) * gVal * peakH;

      voigtPts.push(`${xPx.toFixed(1)},${yVoigt.toFixed(1)}`);
      totalPts.push(`${xPx.toFixed(1)},${yTotal.toFixed(1)}`);
      lorentzPts.push(`${xPx.toFixed(1)},${yL.toFixed(1)}`);
      gaussPts.push(`${xPx.toFixed(1)},${yG.toFixed(1)}`);
    }

    return {
      phi,
      eta,
      voigtFrac,
      betaDeg,
      fwhmDeg,
      cx,
      baseY,
      peakH,
      boxHalfW,
      fwhmHalfW,
      voigtPolyline: voigtPts.join(' '),
      voigtAreaPolygon: `65,${baseY} ${voigtPts.join(' ')} 515,${baseY}`,
      totalPolyline: totalPts.join(' '),
      totalAreaPolygon: `65,${baseY} ${totalPts.join(' ')} 515,${baseY}`,
      lorentzPolyline: lorentzPts.join(' '),
      gaussPolyline: gaussPts.join(' ')
    };
  }, [voigtShapePhi, activePeak]);

  // Mode 3: Krill-Birringer Log-Normal Column Length Distribution curve
  const logNormalCurve = useMemo(() => {
    const dVol = result?.sizeInterceptNm && result.sizeInterceptNm > 0 ? result.sizeInterceptNm : 36;
    const dArea = result?.areaWeightedSizeNm && result.areaWeightedSizeNm > 0 ? result.areaWeightedSizeNm : dVol * 0.66;
    const sigmaG = result?.logNormalSigmaG && result.logNormalSigmaG > 1.0 ? result.logNormalSigmaG : 1.38;
    // Exact Krill-Birringer (1998) median sphere diameter: D0 = (3/2) * <D>_A * exp(-2.5 ln^2(sigma_g))
    const d0 =
      result?.logNormalMedianD0Nm && result.logNormalMedianD0Nm > 0
        ? result.logNormalMedianD0Nm
        : 1.5 * dArea * Math.exp(-2.5 * Math.pow(Math.log(sigmaG), 2));
    const lnSigma = Math.max(0.12, Math.log(sigmaG));

    const maxD = Math.max(80, dVol * 2.4);
    const pts: string[] = [];
    let maxDensity = 1e-9;
    const raw: { d: number; p: number }[] = [];

    for (let i = 1; i <= 90; i++) {
      const d = (i / 90) * maxD;
      const z = Math.log(d / Math.max(1, d0)) / lnSigma;
      const p = (1 / (d * lnSigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
      if (p > maxDensity) maxDensity = p;
      raw.push({ d, p });
    }

    // Plot inside x: [560, 935], y: [52, 202]
    const x0 = 560;
    const w = 375;
    const yBase = 202;
    const h = 138;

    raw.forEach(item => {
      const x = x0 + (item.d / maxD) * w;
      const y = yBase - (item.p / maxDensity) * h;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });

    const xArea = x0 + Math.min(1, dArea / maxD) * w;
    const xVol = x0 + Math.min(1, dVol / maxD) * w;

    return {
      dArea,
      dVol,
      sigmaG,
      d0,
      maxD,
      polyline: pts.join(' '),
      polygon: `${x0},${yBase} ${pts.join(' ')} ${x0 + w},${yBase}`,
      xArea,
      xVol,
      yBase
    };
  }, [result]);

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      {/* Top CAD Header Bar */}
      <div className="px-4 py-2.5 bg-[#070A12] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-sm bg-pink-500" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            CAD Integral Breadth &amp; Voigt Metrology Schematic
          </span>
          <span className="text-[10px] font-mono text-slate-400 border-l border-slate-800 pl-2.5">
            {selectedMaterial} &bull; λ = {wavelength.toFixed(4)} Å &bull; K_IB = {constantK.toFixed(2)}
            {result && (
              <>
                {' '}&bull;{' '}
                <span className="text-purple-300 font-bold">
                  R² = {result.regression.rSquared.toFixed(4)}
                </span>
              </>
            )}
          </span>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('stokes')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'stokes'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3" />
            01. Stokes–Wilson Box &amp; Voigt φ
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('deconv')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'deconv'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sliders className="w-3 h-3" />
            02. Instrumental Deconvolution
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('models')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'models'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Compass className="w-3 h-3" />
            03. 7-Model Separation &amp; P(L)
          </button>
        </div>
      </div>

      {/* Interactive Sub-Toolbar for Active Mode */}
      <div className="px-4 py-2 bg-[#070A12]/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono tabular-nums">
        {activeMode === 'stokes' && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 uppercase font-bold">Inspect Reflection:</span>
              {validPoints.slice(0, 8).map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPeakIdx(i)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedPeakIdx === i
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-200 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pt.hkl ? `(${pt.hkl.join('')})` : `#${i + 1}`} {pt.twoTheta.toFixed(1)}°
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Langford Shape φ = FWHM/β_IB:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'Lorentz (0.64)', val: 0.64 },
                  { label: 'Mixed (0.76)', val: 0.76 },
                  { label: 'Gauss (0.93)', val: 0.93 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onChangeVoigtPhi(preset.val)}
                    className={`px-2 py-0.5 rounded border text-[9.5px] cursor-pointer ${
                      Math.abs(voigtShapePhi - preset.val) < 0.03
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeMode === 'deconv' && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 uppercase font-bold">Active Deconvolution Law:</span>
              {(
                [
                  { id: 'voigt_exact', label: 'Exact Voigt (Langford)' },
                  { id: 'hw_voigt', label: 'Parabolic Voigt (H-W)' },
                  { id: 'linear', label: 'Cauchy Linear' },
                  { id: 'squared', label: 'Gaussian Quad' },
                  { id: 'none', label: 'Raw' }
                ] as { id: IBDecouplingMethod; label: string }[]
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectDecouplingMethod(m.id)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    decouplingMethod === m.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="text-slate-400">
              IRF Mode: <span className="text-amber-300 font-bold uppercase">{instrumentalMode}</span>{' '}
              {instrumentalMode === 'caglioti'
                ? `(U=${cagliotiU.toFixed(3)}, V=${cagliotiV.toFixed(3)}, W=${cagliotiW.toFixed(3)})`
                : `(β_inst = ${instBetaIB.toFixed(4)}° · φ_i = ${instVoigtPhi.toFixed(2)})`}
            </div>
          </>
        )}

        {activeMode === 'models' && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 uppercase font-bold mr-1">Switch Formalism:</span>
              {(
                [
                  { id: 'udm', label: 'UDM' },
                  { id: 'usdm', label: 'USDM' },
                  { id: 'udedm', label: 'UDEDM' },
                  { id: 'ssp', label: 'SSP' },
                  { id: 'hw', label: 'H-W' },
                  { id: 'mwh', label: 'mWH' },
                  { id: 'gwh', label: 'GWH (Gauss²)' }
                ] as { id: IBSeparationMethod; label: string }[]
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectSeparationMethod(m.id)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    separationMethod === m.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="text-slate-400">
              Active R² ={' '}
              <span className="text-emerald-400 font-bold">
                {result ? result.regression.rSquared.toFixed(4) : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main Vector CAD Canvas */}
      <div className="relative bg-[#070A12] p-3">
        {activeMode === 'stokes' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="Stokes-Wilson Integral Breadth Equivalent Box and Voigt Deconvolution Schematic"
          >
            <defs>
              <pattern id="ibCadGrid1" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeOpacity="0.55" />
              </pattern>
              <linearGradient id="ibPeakFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.02" />
              </linearGradient>
              <pattern id="stokesHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.35" />
              </pattern>
            </defs>

            {/* Left Plot Frame: Diffraction Peak vs Stokes-Wilson Rectangle */}
            <rect x="20" y="12" width="515" height="220" rx="4" fill="url(#ibCadGrid1)" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="28" fill="#94A3B8" fontSize="9.5" fontWeight="bold">
              STOKES–WILSON EQUIVALENT RECTANGLE: Area = ∫ I(2θ) d(2θ) = I_max × β_IB
            </text>

            {/* Baseline */}
            <line x1="45" y1={stokesCurveData.baseY} x2="520" y2={stokesCurveData.baseY} stroke="#475569" strokeWidth="1.2" />

            {/* Diffraction Peak Shaded Area (Exact Faddeeva-Voigt) */}
            <polygon points={stokesCurveData.voigtAreaPolygon} fill="url(#ibPeakFill)" />

            {/* Equivalent Stokes-Wilson Box (Same Area, Height = I_max, Width = beta_IB) */}
            <rect
              x={stokesCurveData.cx - stokesCurveData.boxHalfW}
              y={stokesCurveData.baseY - stokesCurveData.peakH}
              width={stokesCurveData.boxHalfW * 2}
              height={stokesCurveData.peakH}
              fill="url(#stokesHatch)"
              stroke="#10B981"
              strokeWidth="1.6"
              strokeDasharray="5 3"
            />

            {/* Lorentzian & Gaussian Component Curves */}
            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              points={stokesCurveData.lorentzPolyline}
            />
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              points={stokesCurveData.gaussPolyline}
            />

            {/* Pseudo-Voigt Reference Curve */}
            <polyline
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.2"
              strokeDasharray="4 2"
              strokeOpacity="0.8"
              points={stokesCurveData.totalPolyline}
            />

            {/* Exact Faddeeva-Voigt Profile Curve */}
            <polyline
              fill="none"
              stroke="#F472B6"
              strokeWidth="2.4"
              points={stokesCurveData.voigtPolyline}
            />

            {/* Centerline Bragg 2theta_0 */}
            <line
              x1={stokesCurveData.cx}
              y1="36"
              x2={stokesCurveData.cx}
              y2={stokesCurveData.baseY + 6}
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text x={stokesCurveData.cx} y="222" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontWeight="bold">
              2θ₀ = {activePeak ? `${activePeak.twoTheta.toFixed(2)}°` : '28.44°'}{' '}
              {activePeak?.hkl ? `(${activePeak.hkl.join(' ')})` : '(111)'}
            </text>

            {/* I_max Dimension Callout */}
            <line
              x1="54"
              y1={stokesCurveData.baseY - stokesCurveData.peakH}
              x2={stokesCurveData.cx}
              y2={stokesCurveData.baseY - stokesCurveData.peakH}
              stroke="#64748B"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <text x="50" y={stokesCurveData.baseY - stokesCurveData.peakH + 3} textAnchor="end" fill="#F472B6" fontSize="9" fontWeight="bold">
              I_max
            </text>

            {/* FWHM Caliper at 0.5 I_max */}
            <line
              x1={stokesCurveData.cx - stokesCurveData.fwhmHalfW}
              y1={stokesCurveData.baseY - stokesCurveData.peakH * 0.5}
              x2={stokesCurveData.cx + stokesCurveData.fwhmHalfW}
              y2={stokesCurveData.baseY - stokesCurveData.peakH * 0.5}
              stroke="#38BDF8"
              strokeWidth="1.8"
            />
            <circle cx={stokesCurveData.cx - stokesCurveData.fwhmHalfW} cy={stokesCurveData.baseY - stokesCurveData.peakH * 0.5} r="3" fill="#38BDF8" />
            <circle cx={stokesCurveData.cx + stokesCurveData.fwhmHalfW} cy={stokesCurveData.baseY - stokesCurveData.peakH * 0.5} r="3" fill="#38BDF8" />
            <rect x={stokesCurveData.cx - 48} y={stokesCurveData.baseY - stokesCurveData.peakH * 0.5 - 16} width="96" height="13" rx="2" fill="#070A12" stroke="#38BDF8" strokeWidth="0.8" />
            <text x={stokesCurveData.cx} y={stokesCurveData.baseY - stokesCurveData.peakH * 0.5 - 6.5} textAnchor="middle" fill="#38BDF8" fontSize="8.5" fontWeight="bold">
              FWHM = {stokesCurveData.fwhmDeg.toFixed(4)}°
            </text>

            {/* Integral Breadth beta_IB Caliper across Equivalent Box */}
            <line
              x1={stokesCurveData.cx - stokesCurveData.boxHalfW}
              y1={stokesCurveData.baseY - 26}
              x2={stokesCurveData.cx + stokesCurveData.boxHalfW}
              y2={stokesCurveData.baseY - 26}
              stroke="#10B981"
              strokeWidth="2"
            />
            <rect x={stokesCurveData.cx - 56} y={stokesCurveData.baseY - 33} width="112" height="14" rx="2" fill="#070A12" stroke="#10B981" strokeWidth="1" />
            <text x={stokesCurveData.cx} y={stokesCurveData.baseY - 23} textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold">
              β_IB = {stokesCurveData.betaDeg.toFixed(4)}°
            </text>

            {/* Right Panel: Langford / de Keijser Voigt Decomposition Telemetry */}
            <rect x="548" y="12" width="392" height="220" rx="4" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
            <text x="562" y="30" fill="#F8FAFC" fontSize="10" fontWeight="bold">
              LANGFORD &amp; DE KEIJSER SINGLE-LINE VOIGT DECOMPOSITION
            </text>
            <line x1="562" y1="37" x2="926" y2="37" stroke="#1E293B" strokeWidth="1" />

            {/* Shape Factor Gauge Bar */}
            <text x="562" y="54" fill="#94A3B8" fontSize="9">
              Voigt Shape Factor φ = FWHM / β_IB = {stokesCurveData.phi.toFixed(4)}
            </text>
            <text x="926" y="54" textAnchor="end" fill="#38BDF8" fontSize="9" fontWeight="bold">
              η_L = {(stokesCurveData.eta * 100).toFixed(0)}% / Gauss = {((1 - stokesCurveData.eta) * 100).toFixed(0)}%
            </text>

            <rect x="562" y="61" width="364" height="10" rx="2" fill="#070A12" stroke="#334155" strokeWidth="1" />
            <rect
              x="562"
              y="61"
              width={Math.max(6, ((stokesCurveData.phi - 0.6366) / (0.9394 - 0.6366)) * 364)}
              height="10"
              rx="2"
              fill="#EC4899"
            />
            <text x="562" y="82" fill="#38BDF8" fontSize="8">
              0.6366 (Pure Cauchy / Size)
            </text>
            <text x="926" y="82" textAnchor="end" fill="#F59E0B" fontSize="8">
              0.9394 (Pure Gaussian / Strain)
            </text>

            {/* Exact Faddeeva-Voigt Component Readout Boxes */}
            {(() => {
              const phi = stokesCurveData.phi;
              const betaIB = stokesCurveData.betaDeg;
              const { fCauchy, fGauss, voigtK } = stokesCurveData.voigtFrac;
              const betaC = Math.max(0.0001, betaIB * fCauchy);
              const betaG = Math.max(0.0001, betaIB * fGauss);
              const thetaRad = ((activePeak ? activePeak.twoTheta : 28.44) * Math.PI) / 360;
              const voigtDvNm = (constantK * (wavelength * 0.1)) / (((betaC * Math.PI) / 180) * Math.cos(thetaRad));
              const voigtStrain = ((betaG * Math.PI) / 180) / (4 * Math.tan(thetaRad));

              return (
                <>
                  <g transform="translate(562, 92)">
                    <rect x="0" y="0" width="176" height="58" rx="3" fill="#070A12" stroke="#1E293B" />
                    <text x="10" y="16" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
                      EXACT CAUCHY β_C (SIZE)
                    </text>
                    <text x="10" y="35" fill="#38BDF8" fontSize="13" fontWeight="bold">
                      {betaC.toFixed(4)}°
                    </text>
                    <text x="10" y="49" fill="#64748B" fontSize="8">
                      D_v = Kλ/(β_C cosθ) = {voigtDvNm > 0 && voigtDvNm < 1000 ? `${voigtDvNm.toFixed(1)} nm` : 'Bulk'}
                    </text>
                  </g>

                  <g transform="translate(750, 92)">
                    <rect x="0" y="0" width="176" height="58" rx="3" fill="#070A12" stroke="#1E293B" />
                    <text x="10" y="16" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
                      EXACT GAUSS β_G (STRAIN)
                    </text>
                    <text x="10" y="35" fill="#F59E0B" fontSize="13" fontWeight="bold">
                      {betaG.toFixed(4)}°
                    </text>
                    <text x="10" y="49" fill="#64748B" fontSize="8">
                      ε = β_G/(4 tanθ) = {(voigtStrain * 1000).toFixed(2)}×10⁻³
                    </text>
                  </g>

                  {/* Bottom Exact Langford–Voigt Reference Box */}
                  <rect x="562" y="160" width="364" height="60" rx="3" fill="#070A12" stroke="#1E293B" />
                  <text x="572" y="176" fill="#10B981" fontSize="8.5" fontWeight="bold">
                    EXACT FADDEEVA–VOIGT INVERSION (Langford 1978 · k = β_C / (√π·β_G)):
                  </text>
                  <text x="572" y="192" fill="#CBD5E1" fontSize="8.5">
                    k = {voigtK < 50 ? voigtK.toFixed(4) : '∞'}  |  f_C = {(fCauchy * 100).toFixed(1)}%  |  f_G = {(fGauss * 100).toFixed(1)}%  |  η(1/φ) = {(stokesCurveData.eta * 100).toFixed(1)}%
                  </text>
                  <text x="572" y="208" fill="#94A3B8" fontSize="8">
                    β_V = β_G / erfcx(k)  |  erfcx(k) = {voigtK < 50 ? computeErfcx(voigtK).toFixed(4) : '0.0000'}  |  φ(k) = {phi.toFixed(4)}
                  </text>
                </>
              );
            })()}
          </svg>
        )}

        {activeMode === 'deconv' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="Instrumental Broadening Deconvolution and Caglioti Dispersion"
          >
            <defs>
              <pattern id="ibCadGrid2" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeOpacity="0.55" />
              </pattern>
            </defs>

            {/* Left Frame: Multi-Peak Breadth Dispersion Stack */}
            <rect x="20" y="12" width="540" height="220" rx="4" fill="url(#ibCadGrid2)" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="29" fill="#94A3B8" fontSize="9.5" fontWeight="bold">
              MULTI-REFLECTION BREADTH DECONVOLUTION: β_obs(2θ) = β_sample(2θ) ⊕ β_inst(2θ)
            </text>

            {/* Axes */}
            <line x1="55" y1="198" x2="540" y2="198" stroke="#475569" strokeWidth="1.2" />
            <line x1="55" y1="42" x2="55" y2="198" stroke="#475569" strokeWidth="1.2" />

            {(() => {
              const pts = validPoints.slice(0, 8);
              if (pts.length === 0) return null;
              const maxBeta = Math.max(0.25, ...pts.map(p => p.betaObsDeg)) * 1.15;
              const colW = 460 / Math.max(1, pts.length);

              return pts.map((p, idx) => {
                const cx = 75 + idx * colW + colW * 0.25;
                const hObs = Math.min(145, (p.betaObsDeg / maxBeta) * 145);
                const hInst = Math.min(145, (p.betaInstDeg / maxBeta) * 145);
                const hSamp = Math.min(145, (Math.max(0, p.betaSampleDeg) / maxBeta) * 145);

                return (
                  <g key={idx} className="cursor-pointer" onClick={() => setSelectedPeakIdx(idx)}>
                    {/* Observed bar */}
                    <rect
                      x={cx - 14}
                      y={198 - hObs}
                      width="8"
                      height={hObs}
                      rx="1"
                      fill="#94A3B8"
                      fillOpacity={selectedPeakIdx === idx ? '0.95' : '0.55'}
                    />
                    {/* Instrumental bar */}
                    <rect
                      x={cx - 4}
                      y={198 - hInst}
                      width="8"
                      height={hInst}
                      rx="1"
                      fill="#F59E0B"
                      fillOpacity={selectedPeakIdx === idx ? '0.95' : '0.7'}
                    />
                    {/* Deconvolved Sample bar */}
                    <rect
                      x={cx + 6}
                      y={198 - hSamp}
                      width="8"
                      height={hSamp}
                      rx="1"
                      fill="#22D3EE"
                      fillOpacity="0.95"
                    />
                    <text x={cx} y="212" textAnchor="middle" fill={selectedPeakIdx === idx ? '#F8FAFC' : '#94A3B8'} fontSize="8.5" fontWeight="bold">
                      {p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(0)}°`}
                    </text>
                    <text x={cx} y="223" textAnchor="middle" fill="#64748B" fontSize="7.5">
                      {p.twoTheta.toFixed(1)}°
                    </text>
                  </g>
                );
              });
            })()}

            {/* Legend inside Left Plot */}
            <g transform="translate(325, 20)">
              <rect x="0" y="0" width="8" height="8" fill="#94A3B8" />
              <text x="12" y="7.5" fill="#CBD5E1" fontSize="8">β_obs</text>
              <rect x="52" y="0" width="8" height="8" fill="#F59E0B" />
              <text x="64" y="7.5" fill="#F59E0B" fontSize="8">β_inst</text>
              <rect x="106" y="0" width="8" height="8" fill="#22D3EE" />
              <text x="118" y="7.5" fill="#22D3EE" fontSize="8" fontWeight="bold">β_sample ({decouplingMethod.toUpperCase()})</text>
            </g>

            {/* Right Frame: Side-by-Side Comparison of the 4 Deconvolution Laws on Active Peak */}
            <rect x="572" y="12" width="368" height="220" rx="4" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
            <text x="586" y="30" fill="#F8FAFC" fontSize="10" fontWeight="bold">
              DECONVOLUTION OPERATOR COMPARISON ({activePeak?.hkl ? `(${activePeak.hkl.join(' ')})` : 'PEAK #1'})
            </text>
            <line x1="586" y1="37" x2="926" y2="37" stroke="#1E293B" strokeWidth="1" />

            {(() => {
              const bObs = activePeak ? activePeak.betaObsDeg : 0.35;
              const bInst = activePeak ? activePeak.betaInstDeg : instBetaIB;
              const bCauchy = Math.max(0, bObs - bInst);
              const bGauss = bObs > bInst ? Math.sqrt(bObs * bObs - bInst * bInst) : 0;
              const bVoigtHW = bObs > bInst ? bObs * (1 - (bInst * bInst) / (bObs * bObs)) : 0;
              const obsFrac = computeDeKeijserVoigtFractions(activePeak?.shapeFactorPhi ?? voigtShapePhi);
              const instFrac = computeDeKeijserVoigtFractions(instVoigtPhi);
              const bCs = Math.max(0, bObs * obsFrac.fCauchy - bInst * instFrac.fCauchy);
              const bGs = Math.sqrt(Math.max(0, Math.pow(bObs * obsFrac.fGauss, 2) - Math.pow(bInst * instFrac.fGauss, 2)));
              const bVoigtExact = computeLangfordVoigtBreadth(bCs, bGs);

              const laws: { id: IBDecouplingMethod; title: string; eq: string; val: number; color: string }[] = [
                {
                  id: 'voigt_exact',
                  title: '1. Exact Langford–Voigt (Component)',
                  eq: 'β_C,s = β_C,o−β_C,i ; β_G,s = √(β_G,o²−β_G,i²)',
                  val: bVoigtExact,
                  color: '#22D3EE'
                },
                {
                  id: 'hw_voigt',
                  title: '2. Halder–Wagner Parabolic Voigt',
                  eq: 'β_s = β_obs · [1 − (β_inst / β_obs)²]',
                  val: bVoigtHW,
                  color: '#10B981'
                },
                {
                  id: 'linear',
                  title: '3. Cauchy Linear (Pure Lorentzian)',
                  eq: 'β_s = β_obs − β_inst',
                  val: bCauchy,
                  color: '#38BDF8'
                },
                {
                  id: 'squared',
                  title: '4. Gaussian Quadratic (RMS)',
                  eq: 'β_s = √(β_obs² − β_inst²)',
                  val: bGauss,
                  color: '#F472B6'
                }
              ];

              return laws.map((law, i) => {
                const y0 = 44 + i * 45;
                const isSel = decouplingMethod === law.id;
                const ratio = bObs > 0 ? Math.min(1, law.val / bObs) : 0;
                return (
                  <g
                    key={law.id}
                    transform={`translate(586, ${y0})`}
                    className="cursor-pointer"
                    onClick={() => onSelectDecouplingMethod(law.id)}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="340"
                      height="40"
                      rx="3"
                      fill={isSel ? '#0F172A' : '#070A12'}
                      stroke={isSel ? law.color : '#1E293B'}
                      strokeWidth={isSel ? '1.4' : '1'}
                    />
                    <text x="9" y="14" fill={isSel ? '#F8FAFC' : '#94A3B8'} fontSize="8.5" fontWeight="bold">
                      {law.title}
                    </text>
                    <text x="331" y="14" textAnchor="end" fill={law.color} fontSize="10" fontWeight="bold">
                      β_s = {law.val.toFixed(4)}°
                    </text>
                    <text x="9" y="26" fill="#64748B" fontSize="7.5">
                      {law.eq}
                    </text>
                    <rect x="9" y="31" width="322" height="4" rx="1.5" fill="#1E293B" />
                    <rect x="9" y="31" width={Math.max(4, ratio * 322)} height="4" rx="1.5" fill={law.color} />
                  </g>
                );
              });
            })()}
          </svg>
        )}

        {activeMode === 'models' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="7-Model Size-Strain Separation Matrix and Log-Normal Column Length Distribution"
          >
            <defs>
              <pattern id="ibCadGrid3" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeOpacity="0.55" />
              </pattern>
              <linearGradient id="logNormFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Left Panel: 7-Model Comparative R^2 & D_v Bars */}
            <rect x="20" y="12" width="510" height="220" rx="4" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="29" fill="#F8FAFC" fontSize="9.5" fontWeight="bold">
              SIMULTANEOUS 7-MODEL SEPARATION SOLVER (CLICK ROW TO ACTIVATE)
            </text>
            <line x1="32" y1="35" x2="516" y2="35" stroke="#1E293B" strokeWidth="1" />

            {(result?.modelComparisons || []).slice(0, 7).map((m, idx) => {
              const y = 41 + idx * 26.5;
              const methodKey: IBSeparationMethod =
                m.modelName === 'Halder-Wagner'
                  ? 'hw'
                  : m.modelName === 'Gaussian-WH'
                  ? 'gwh'
                  : (m.modelName.toLowerCase() as IBSeparationMethod);
              const isSel = separationMethod === methodKey;
              const r2 = Math.max(0, Math.min(1, m.rSquared || 0));

              return (
                <g
                  key={m.modelName}
                  transform={`translate(32, ${y})`}
                  className="cursor-pointer"
                  onClick={() => onSelectSeparationMethod(methodKey)}
                >
                  <rect
                    x="0"
                    y="0"
                    width="484"
                    height="22.5"
                    rx="2.5"
                    fill={isSel ? '#1E293B' : '#070A12'}
                    stroke={m.isBestFit ? '#10B981' : isSel ? '#EC4899' : '#1E293B'}
                    strokeWidth={isSel || m.isBestFit ? '1.2' : '0.8'}
                  />
                  <text x="8" y="14.5" fill={isSel ? '#F472B6' : '#E2E8F0'} fontSize="8.5" fontWeight="bold">
                    {m.modelName} {m.isBestFit ? '★' : ''}
                  </text>
                  <text x="125" y="14.5" fill="#10B981" fontSize="8.5" fontWeight="bold">
                    D_v = {m.sizeNm > 0 ? `${m.sizeNm.toFixed(1)} nm` : 'Bulk'}
                  </text>
                  <text x="235" y="14.5" fill="#38BDF8" fontSize="8.5">
                    ε = {((m.strainPercent / 100) * 1000).toFixed(2)}×10⁻³
                  </text>
                  {/* R^2 bar */}
                  <rect x="335" y="7" width="82" height="7.5" rx="1.5" fill="#0F172A" stroke="#334155" strokeWidth="0.6" />
                  <rect
                    x="335"
                    y="7"
                    width={Math.max(3, r2 * 82)}
                    height="7.5"
                    rx="1.5"
                    fill={m.isBestFit ? '#10B981' : isSel ? '#EC4899' : '#38BDF8'}
                  />
                  <text x="476" y="14.5" textAnchor="end" fill="#CBD5E1" fontSize="8.5" fontWeight="bold">
                    R²={r2.toFixed(3)}
                  </text>
                </g>
              );
            })}

            {/* Right Panel: Krill-Birringer Log-Normal Crystallite Size Distribution P(D) */}
            <rect x="542" y="12" width="398" height="220" rx="4" fill="url(#ibCadGrid3)" stroke="#1E293B" strokeWidth="1" />
            <text x="556" y="29" fill="#94A3B8" fontSize="9.5" fontWeight="bold">
              LOG-NORMAL CRYSTALLITE DISTRIBUTION P(D) (σ_g = {logNormalCurve.sigmaG.toFixed(2)})
            </text>

            <line x1="560" y1={logNormalCurve.yBase} x2="935" y2={logNormalCurve.yBase} stroke="#475569" strokeWidth="1.2" />
            <line x1="560" y1="45" x2="560" y2={logNormalCurve.yBase} stroke="#475569" strokeWidth="1.2" />

            <polygon points={logNormalCurve.polygon} fill="url(#logNormFill)" />
            <polyline fill="none" stroke="#10B981" strokeWidth="2.2" points={logNormalCurve.polyline} />

            {/* Area-weighted D_a marker */}
            <line
              x1={logNormalCurve.xArea}
              y1="52"
              x2={logNormalCurve.xArea}
              y2={logNormalCurve.yBase}
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text x={logNormalCurve.xArea - 4} y="62" textAnchor="end" fill="#38BDF8" fontSize="8.5" fontWeight="bold">
              ⟨D⟩_A = {logNormalCurve.dArea.toFixed(1)} nm
            </text>

            {/* Volume-weighted D_v marker */}
            <line
              x1={logNormalCurve.xVol}
              y1="52"
              x2={logNormalCurve.xVol}
              y2={logNormalCurve.yBase}
              stroke="#F472B6"
              strokeWidth="1.6"
              strokeDasharray="4 2"
            />
            <text x={logNormalCurve.xVol + 4} y="78" textAnchor="start" fill="#F472B6" fontSize="8.5" fontWeight="bold">
              ⟨D⟩_V = {logNormalCurve.dVol.toFixed(1)} nm
            </text>

            {/* Bottom axis labels */}
            <text x="560" y="218" fill="#64748B" fontSize="8">0 nm</text>
            <text x="747" y="218" textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
              Crystallite Column Diameter D (nm) — D₀ = {logNormalCurve.d0.toFixed(1)} nm
            </text>
            <text x="935" y="218" textAnchor="end" fill="#64748B" fontSize="8">
              {logNormalCurve.maxD.toFixed(0)} nm
            </text>
          </svg>
        )}
      </div>
    </div>
  );
};
