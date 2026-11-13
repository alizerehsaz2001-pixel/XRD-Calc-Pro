import React, { useState, useMemo } from 'react';
import { IBAdvancedResult } from '../../types';
import {
  Layers,
  Sliders,
  Compass
} from 'lucide-react';

export type IBSeparationMethod = 'udm' | 'usdm' | 'udedm' | 'ssp' | 'hw' | 'mwh';
export type IBDecouplingMethod = 'none' | 'linear' | 'squared' | 'hw_voigt';

interface IBCadSchematicProps {
  result: IBAdvancedResult | null;
  selectedMaterial: string;
  wavelength: number;
  constantK: number;
  instBetaIB: number;
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

  // Mode 1: Pseudo-Voigt + Equivalent Stokes-Wilson Box geometry
  const stokesCurveData = useMemo(() => {
    const phi = Math.min(0.9394, Math.max(0.6366, voigtShapePhi));
    // Mixing parameter eta from phi (Langford approximation)
    const eta = Math.min(1, Math.max(0, (0.939437 - phi) / (0.939437 - 0.63662)));
    const betaDeg = activePeak ? Math.max(0.08, activePeak.betaSampleDeg || activePeak.betaObsDeg) : 0.35;
    const fwhmDeg = betaDeg * phi;

    // SVG coordinate space: x in [70, 510], center = 290, baseline = 205, peak top = 45 (height = 160)
    const cx = 290;
    const baseY = 205;
    const peakH = 152;
    // Scale so betaDeg corresponds to 136 px width -> 1 deg = 136 / betaDeg px
    const pxPerDeg = 136 / betaDeg;
    const boxHalfW = (betaDeg * pxPerDeg) / 2; // 68 px
    const fwhmHalfW = (fwhmDeg * pxPerDeg) / 2; // 68 * phi px

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

      const yTotal = baseY - pvVal * peakH;
      const yL = baseY - eta * lVal * peakH;
      const yG = baseY - (1 - eta) * gVal * peakH;

      totalPts.push(`${xPx.toFixed(1)},${yTotal.toFixed(1)}`);
      lorentzPts.push(`${xPx.toFixed(1)},${yL.toFixed(1)}`);
      gaussPts.push(`${xPx.toFixed(1)},${yG.toFixed(1)}`);
    }

    return {
      phi,
      eta,
      betaDeg,
      fwhmDeg,
      cx,
      baseY,
      peakH,
      boxHalfW,
      fwhmHalfW,
      totalPolyline: totalPts.join(' '),
      totalAreaPolygon: `65,${baseY} ${totalPts.join(' ')} 515,${baseY}`,
      lorentzPolyline: lorentzPts.join(' '),
      gaussPolyline: gaussPts.join(' ')
    };
  }, [voigtShapePhi, activePeak]);

  // Mode 3: Log-Normal Column Length Distribution curve
  const logNormalCurve = useMemo(() => {
    const dVol = result?.sizeInterceptNm && result.sizeInterceptNm > 0 ? result.sizeInterceptNm : 36;
    const dArea = result?.areaWeightedSizeNm && result.areaWeightedSizeNm > 0 ? result.areaWeightedSizeNm : dVol * 0.66;
    const sigmaG = result?.logNormalSigmaG && result.logNormalSigmaG > 1.0 ? result.logNormalSigmaG : 1.38;
    const d0 = dArea * Math.exp(-2.5 * Math.pow(Math.log(sigmaG), 2));
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
            03. 6-Model Separation &amp; P(L)
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
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase font-bold">Active Deconvolution Law:</span>
              {(
                [
                  { id: 'hw_voigt', label: 'Voigt Parabolic (Halder–Wagner)', eq: 'β_s = β_o[1 - (β_i/β_o)²]' },
                  { id: 'linear', label: 'Cauchy Linear (Lorentz)', eq: 'β_s = β_o - β_i' },
                  { id: 'squared', label: 'Gaussian Quadratic', eq: 'β_s = √(β_o² - β_i²)' },
                  { id: 'none', label: 'No Subtraction', eq: 'β_s = β_o' }
                ] as { id: IBDecouplingMethod; label: string; eq: string }[]
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectDecouplingMethod(m.id)}
                  className={`px-2.5 py-0.5 rounded border transition-colors cursor-pointer ${
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
                : `(β_inst = ${instBetaIB.toFixed(4)}°)`}
            </div>
          </>
        )}

        {activeMode === 'models' && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 uppercase font-bold mr-1">Switch Formalism:</span>
              {(
                [
                  { id: 'udm', label: 'UDM (Isotropic)' },
                  { id: 'usdm', label: 'USDM (E_hkl)' },
                  { id: 'udedm', label: 'UDEDM (Energy u)' },
                  { id: 'ssp', label: 'SSP (Size–Strain)' },
                  { id: 'hw', label: 'H-W (Halder–Wagner)' },
                  { id: 'mwh', label: 'mWH (Ungár C_hkl)' }
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

            {/* Diffraction Peak Shaded Area */}
            <polygon points={stokesCurveData.totalAreaPolygon} fill="url(#ibPeakFill)" />

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
              strokeWidth="1.3"
              strokeDasharray="3 3"
              points={stokesCurveData.lorentzPolyline}
            />
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.3"
              strokeDasharray="2 2"
              points={stokesCurveData.gaussPolyline}
            />

            {/* Total Pseudo-Voigt Profile Curve */}
            <polyline
              fill="none"
              stroke="#F472B6"
              strokeWidth="2.4"
              points={stokesCurveData.totalPolyline}
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

            {/* 4 Metrology Readout Boxes */}
            {(() => {
              const phi = stokesCurveData.phi;
              const betaIB = stokesCurveData.betaDeg;
              const betaC = Math.max(0.001, betaIB * (2.0207 - 0.4803 * phi - 1.7756 * phi * phi));
              const betaG = Math.max(
                0.001,
                betaIB * (0.6442 + 1.4187 * Math.sqrt(Math.max(0, phi - 2 / Math.PI)) - 2.2043 * phi + 1.8706 * phi * phi)
              );
              const thetaRad = ((activePeak ? activePeak.twoTheta : 28.44) * Math.PI) / 360;
              const voigtDvNm = (constantK * (wavelength * 0.1)) / ((betaC * Math.PI) / 180 * Math.cos(thetaRad));
              const voigtStrain = ((betaG * Math.PI) / 180) / (4 * Math.tan(thetaRad));

              return (
                <>
                  <g transform="translate(562, 92)">
                    <rect x="0" y="0" width="176" height="58" rx="3" fill="#070A12" stroke="#1E293B" />
                    <text x="10" y="16" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
                      CAUCHY BREADTH β_C (SIZE)
                    </text>
                    <text x="10" y="35" fill="#38BDF8" fontSize="13" fontWeight="bold">
                      {betaC.toFixed(4)}°
                    </text>
                    <text x="10" y="49" fill="#64748B" fontSize="8">
                      D_v(Voigt) = Kλ / (β_C cosθ) = {voigtDvNm > 0 && voigtDvNm < 1000 ? `${voigtDvNm.toFixed(1)} nm` : 'Bulk'}
                    </text>
                  </g>

                  <g transform="translate(750, 92)">
                    <rect x="0" y="0" width="176" height="58" rx="3" fill="#070A12" stroke="#1E293B" />
                    <text x="10" y="16" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
                      GAUSSIAN BREADTH β_G (STRAIN)
                    </text>
                    <text x="10" y="35" fill="#F59E0B" fontSize="13" fontWeight="bold">
                      {betaG.toFixed(4)}°
                    </text>
                    <text x="10" y="49" fill="#64748B" fontSize="8">
                      ε(Voigt) = β_G / (4 tanθ) = {(voigtStrain * 1000).toFixed(2)}×10⁻³
                    </text>
                  </g>
                </>
              );
            })()}

            {/* Bottom Formula Reference Box */}
            <rect x="562" y="160" width="364" height="60" rx="3" fill="#070A12" stroke="#1E293B" />
            <text x="572" y="176" fill="#10B981" fontSize="8.5" fontWeight="bold">
              DE KEIJSER POLYNOMIAL DECONVOLUTION RELATIONS (J. Appl. Cryst. 15, 308):
            </text>
            <text x="572" y="192" fill="#CBD5E1" fontSize="8.5">
              β_C / β_IB = 2.0207 − 0.4803·φ − 1.7756·φ²   |   Lorentz Fraction η = {(stokesCurveData.eta * 100).toFixed(1)}%
            </text>
            <text x="572" y="208" fill="#CBD5E1" fontSize="8.5">
              β_G / β_IB = 0.6442 + 1.4187·√(φ − 2/π) − 2.2043·φ + 1.8706·φ²
            </text>
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

            {/* Right Frame: Side-by-Side Comparison of the 3 Deconvolution Laws on Active Peak */}
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
              const bVoigt = bObs > bInst ? bObs * (1 - (bInst * bInst) / (bObs * bObs)) : 0;

              const laws: { id: IBDecouplingMethod; title: string; eq: string; val: number; color: string }[] = [
                {
                  id: 'linear',
                  title: '1. Cauchy Linear (Pure Lorentzian)',
                  eq: 'β_s = β_obs − β_inst',
                  val: bCauchy,
                  color: '#38BDF8'
                },
                {
                  id: 'hw_voigt',
                  title: '2. Halder–Wagner Voigt Parabolic',
                  eq: 'β_s = β_obs · [1 − (β_inst / β_obs)²]',
                  val: bVoigt,
                  color: '#10B981'
                },
                {
                  id: 'squared',
                  title: '3. Gaussian Quadratic (Root-Mean-Square)',
                  eq: 'β_s = √(β_obs² − β_inst²)',
                  val: bGauss,
                  color: '#F472B6'
                }
              ];

              return laws.map((law, i) => {
                const y0 = 48 + i * 56;
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
                      height="48"
                      rx="3"
                      fill={isSel ? '#0F172A' : '#070A12'}
                      stroke={isSel ? law.color : '#1E293B'}
                      strokeWidth={isSel ? '1.4' : '1'}
                    />
                    <text x="10" y="16" fill={isSel ? '#F8FAFC' : '#94A3B8'} fontSize="9" fontWeight="bold">
                      {law.title}
                    </text>
                    <text x="330" y="16" textAnchor="end" fill={law.color} fontSize="10.5" fontWeight="bold">
                      β_s = {law.val.toFixed(4)}°
                    </text>
                    <text x="10" y="30" fill="#64748B" fontSize="8">
                      {law.eq}
                    </text>
                    <rect x="10" y="36" width="320" height="5" rx="1.5" fill="#1E293B" />
                    <rect x="10" y="36" width={Math.max(4, ratio * 320)} height="5" rx="1.5" fill={law.color} />
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
            aria-label="6-Model Size-Strain Separation Matrix and Log-Normal Column Length Distribution"
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

            {/* Left Panel: 6-Model Comparative R^2 & D_v Bars */}
            <rect x="20" y="12" width="510" height="220" rx="4" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="30" fill="#F8FAFC" fontSize="10" fontWeight="bold">
              SIMULTANEOUS 6-MODEL SEPARATION SOLVER (CLICK ROW TO ACTIVATE)
            </text>
            <line x1="32" y1="37" x2="516" y2="37" stroke="#1E293B" strokeWidth="1" />

            {(result?.modelComparisons || []).slice(0, 6).map((m, idx) => {
              const y = 44 + idx * 30;
              const methodKey: IBSeparationMethod =
                m.modelName === 'Halder-Wagner' ? 'hw' : (m.modelName.toLowerCase() as IBSeparationMethod);
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
                    height="25"
                    rx="2.5"
                    fill={isSel ? '#1E293B' : '#070A12'}
                    stroke={m.isBestFit ? '#10B981' : isSel ? '#EC4899' : '#1E293B'}
                    strokeWidth={isSel || m.isBestFit ? '1.2' : '0.8'}
                  />
                  <text x="8" y="16" fill={isSel ? '#F472B6' : '#E2E8F0'} fontSize="9" fontWeight="bold">
                    {m.modelName} {m.isBestFit ? '★' : ''}
                  </text>
                  <text x="125" y="16" fill="#10B981" fontSize="9" fontWeight="bold">
                    D_v = {m.sizeNm > 0 ? `${m.sizeNm.toFixed(1)} nm` : 'Bulk'}
                  </text>
                  <text x="235" y="16" fill="#38BDF8" fontSize="9">
                    ε = {((m.strainPercent / 100) * 1000).toFixed(2)}×10⁻³
                  </text>
                  {/* R^2 bar */}
                  <rect x="335" y="8" width="82" height="8" rx="1.5" fill="#0F172A" stroke="#334155" strokeWidth="0.6" />
                  <rect
                    x="335"
                    y="8"
                    width={Math.max(3, r2 * 82)}
                    height="8"
                    rx="1.5"
                    fill={m.isBestFit ? '#10B981' : isSel ? '#EC4899' : '#38BDF8'}
                  />
                  <text x="476" y="16" textAnchor="end" fill="#CBD5E1" fontSize="8.5" fontWeight="bold">
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
