import React, { useState, useMemo } from 'react';
import { DoubleVoigtResult } from '../../types';
import {
  Layers,
  Sliders,
  Compass
} from 'lucide-react';

export type DVDeconvKernel = 'deKeijser-1982' | 'Langford-1978' | 'Balzar-1993';
export type DVRegressionWeighting = 'OLS' | 'WLS-LowS' | 'Huber-Robust';

interface DoubleVoigtCadSchematicProps {
  result: DoubleVoigtResult | null;
  activePresetName: string;
  wavelength: number;
  instFwhm: number;
  instEta: number;
  instrumentalMode: 'constant' | 'caglioti';
  cagliotiU: number;
  cagliotiV: number;
  cagliotiW: number;
  shapeK: number;
  deconvKernel: DVDeconvKernel;
  regressionWeighting: DVRegressionWeighting;
  selectedPeakIdx: number;
  onSelectPeakIdx: (idx: number) => void;
  onSelectKernel: (kernel: DVDeconvKernel) => void;
  onSelectWeighting: (weighting: DVRegressionWeighting) => void;
}

export const DoubleVoigtCadSchematic: React.FC<DoubleVoigtCadSchematicProps> = ({
  result,
  activePresetName,
  wavelength,
  instFwhm,
  instEta,
  instrumentalMode,
  cagliotiU,
  cagliotiV,
  cagliotiW,
  shapeK,
  deconvKernel,
  regressionWeighting,
  selectedPeakIdx,
  onSelectPeakIdx,
  onSelectKernel,
  onSelectWeighting
}) => {
  const [activeMode, setActiveMode] = useState<'convolution' | 'dualRegression' | 'fourierEquiv'>('convolution');

  const validPoints = useMemo(() => {
    return (result?.points || []).filter(p => !p.excluded);
  }, [result]);

  const activePeak = useMemo(() => {
    const allPts = result?.points || [];
    if (allPts.length === 0) return null;
    const idx = Math.min(selectedPeakIdx, allPts.length - 1);
    return allPts[idx] || allPts[0];
  }, [result, selectedPeakIdx]);

  // Mode 1: Voigt-Voigt Convolution & Reciprocal Breadth Decomposition
  const mode1Geometry = useMemo(() => {
    const etaObs = activePeak?.etaObs ?? 0.58;
    const fwhmObs = activePeak?.fwhmObs ?? 0.42;
    const fwhmInstVal = activePeak?.fwhmInst ?? instFwhm;
    const phi = activePeak?.shapeFactorPhi ?? 1 / (0.5 * (Math.PI * etaObs + Math.sqrt(Math.PI / Math.LN2) * (1 - etaObs)));
    const sVal = activePeak?.s ?? 3.2;
    const betaStar = activePeak?.betaStar ?? 0.045;
    const betaCStar = activePeak?.betaCStar ?? 0.026;
    const betaGStar = activePeak?.betaGStar ?? 0.024;

    const cx = 275;
    const baseY = 204;
    const peakH = 148;
    const pxPerDeg = 128 / Math.max(0.08, fwhmObs);

    const obsPts: string[] = [];
    const cauchyPts: string[] = [];
    const gaussPts: string[] = [];
    const instPts: string[] = [];

    const steps = 110;
    for (let i = 0; i <= steps; i++) {
      const xPx = 45 + (i / steps) * 460;
      const dxDeg = (xPx - cx) / pxPerDeg;
      const u = dxDeg / (fwhmObs / 2);
      const uInst = dxDeg / (Math.max(0.02, fwhmInstVal) / 2);

      const lVal = 1 / (1 + u * u);
      const gVal = Math.exp(-Math.LN2 * u * u);
      const pvVal = etaObs * lVal + (1 - etaObs) * gVal;
      const instVal = (instEta * (1 / (1 + uInst * uInst)) + (1 - instEta) * Math.exp(-Math.LN2 * uInst * uInst)) * 0.62;

      obsPts.push(`${xPx.toFixed(1)},${(baseY - pvVal * peakH).toFixed(1)}`);
      cauchyPts.push(`${xPx.toFixed(1)},${(baseY - etaObs * lVal * peakH).toFixed(1)}`);
      gaussPts.push(`${xPx.toFixed(1)},${(baseY - (1 - etaObs) * gVal * peakH).toFixed(1)}`);
      instPts.push(`${xPx.toFixed(1)},${(baseY - instVal * peakH).toFixed(1)}`);
    }

    return {
      etaObs,
      fwhmObs,
      fwhmInstVal,
      phi,
      sVal,
      betaStar,
      betaCStar,
      betaGStar,
      cx,
      baseY,
      peakH,
      obsPolyline: obsPts.join(' '),
      obsPolygon: `45,${baseY} ${obsPts.join(' ')} 505,${baseY}`,
      cauchyPolyline: cauchyPts.join(' '),
      gaussPolyline: gaussPts.join(' '),
      instPolyline: instPts.join(' ')
    };
  }, [activePeak, instFwhm, instEta]);

  // Mode 3: Analytical Fourier Coefficient A_S(L) & Strain Decay Curve
  const fourierGeometry = useMemo(() => {
    const Dv = result?.volumeSizeDvNm && result.volumeSizeDvNm > 0 ? result.volumeSizeDvNm : 28;
    const Da = result?.areaSizeDaNm && result.areaSizeDaNm > 0 ? result.areaSizeDaNm : 19;
    const Dg = result?.gaussianSizeDgNm && result.gaussianSizeDgNm > 0 ? result.gaussianSizeDgNm : 34;
    const betaCS = 1 / Math.max(1, Dv);
    const betaGS = 1 / (Math.PI * Math.max(1, Dg));
    const maxL = Math.max(40, Dv * 1.9);

    // Left frame x: [52, 470], y: [46, 198]
    const x0 = 52;
    const w = 418;
    const yTop = 48;
    const yBase = 198;
    const h = yBase - yTop;

    const asPts: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const L = (i / 80) * maxL;
      // Exact Double-Voigt analytical size Fourier coefficient:
      // A_S(L) = exp(-2 * L * beta_{C,S}* - pi * L^2 * (beta_{G,S}*)^2)
      const aSize = Math.exp(-2 * L * betaCS - Math.PI * L * L * betaGS * betaGS);
      const x = x0 + (L / maxL) * w;
      const y = yBase - aSize * h;
      asPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // Initial tangent from (0, 1) to (Da, 0) where -dA_S/dL|_{L->0} = 1 / <D>_A
    const xDa = x0 + Math.min(1, Da / maxL) * w;
    const xDv = x0 + Math.min(1, Dv / maxL) * w;

    return {
      Dv,
      Da,
      Dg,
      betaCS,
      betaGS,
      maxL,
      x0,
      w,
      yTop,
      yBase,
      asPolyline: asPts.join(' '),
      asPolygon: `${x0},${yBase} ${asPts.join(' ')} ${x0 + w},${yBase}`,
      xDa,
      xDv
    };
  }, [result]);

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      {/* Top CAD Header Bar */}
      <div className="px-4 py-2.5 bg-[#070A12] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-sm bg-indigo-500" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            CAD Double-Voigt Reciprocal Convolution &amp; Fourier Equivalence Schematic
          </span>
          <span className="text-[10px] font-mono text-slate-400 border-l border-slate-800 pl-2.5">
            {activePresetName} &bull; λ = {wavelength.toFixed(4)} Å &bull; k = {(result?.voigtParameterK ?? 0.5).toFixed(3)}
          </span>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('convolution')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'convolution'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3" />
            01. Voigt Kernel Deconvolution
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('dualRegression')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'dualRegression'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sliders className="w-3 h-3" />
            02. Dual Reciprocal Extrapolation
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('fourierEquiv')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'fourierEquiv'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Compass className="w-3 h-3" />
            03. Fourier A_S(L) &amp; erfc(k) Coupling
          </button>
        </div>
      </div>

      {/* Interactive Sub-Toolbar for Active Mode */}
      <div className="px-4 py-2 bg-[#070A12]/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono tabular-nums">
        {activeMode === 'convolution' && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 uppercase font-bold">Inspect Reflection:</span>
              {(result?.points || []).slice(0, 8).map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectPeakIdx(i)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedPeakIdx === i
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pt.hkl ? `(${pt.hkl.join('')})` : `#${i + 1}`} {pt.twoTheta.toFixed(1)}°
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase font-bold">Inversion Kernel:</span>
              {(
                [
                  { id: 'deKeijser-1982', label: 'de Keijser (1982)' },
                  { id: 'Langford-1978', label: 'Langford (1978)' },
                  { id: 'Balzar-1993', label: 'Balzar (1993)' }
                ] as { id: DVDeconvKernel; label: string }[]
              ).map(k => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onSelectKernel(k.id)}
                  className={`px-2 py-0.5 rounded border cursor-pointer ${
                    deconvKernel === k.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </>
        )}

        {activeMode === 'dualRegression' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase font-bold">Solver Weighting:</span>
              {(
                [
                  { id: 'OLS', label: 'Standard OLS (Uniform)' },
                  { id: 'WLS-LowS', label: '1/s Weighted (Low-Angle Priority)' },
                  { id: 'Huber-Robust', label: 'Huber IRLS (Outlier Resistant)' }
                ] as { id: DVRegressionWeighting; label: string }[]
              ).map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWeighting(w.id)}
                  className={`px-2.5 py-0.5 rounded border cursor-pointer ${
                    regressionWeighting === w.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <div className="text-slate-400">
              Cauchy R² = <span className="text-indigo-400 font-bold">{result ? (result.cauchyFit.rSquared * 100).toFixed(1) : '—'}%</span>
              {' '}&bull;{' '}
              Gaussian R² = <span className="text-purple-400 font-bold">{result ? (result.gaussianFit.rSquared * 100).toFixed(1) : '—'}%</span>
            </div>
          </>
        )}

        {activeMode === 'fourierEquiv' && (
          <>
            <div className="flex items-center gap-3 text-slate-300">
              <span>
                Analytical Warren–Averbach Equivalence:{' '}
                <strong className="text-emerald-400">A_S(L) = exp(−2L·β_C,S* − πL²·(β_G,S*)²)</strong>
              </span>
            </div>
            <div className="text-slate-400">
              ⟨D_A⟩ = <span className="text-emerald-400 font-bold">{fourierGeometry.Da.toFixed(2)} nm</span>
              {' '}&bull;{' '}
              ⟨D_V⟩ = <span className="text-indigo-400 font-bold">{fourierGeometry.Dv.toFixed(2)} nm</span>
              {' '}&bull;{' '}
              κ = ⟨D_V⟩/⟨D_A⟩ = <span className="text-amber-300 font-bold">{(result?.polydispersityRatio ?? 1.25).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Main Vector CAD Canvas */}
      <div className="relative bg-[#070A12] p-3">
        {activeMode === 'convolution' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="Double-Voigt Reciprocal Convolution and Kernel Decomposition Schematic"
          >
            <defs>
              <pattern id="dvCadGrid1" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeOpacity="0.55" />
              </pattern>
              <linearGradient id="dvObsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Left Frame: Voigt Profile Decomposition */}
            <rect x="20" y="12" width="505" height="220" rx="4" fill="url(#dvCadGrid1)" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="29" fill="#94A3B8" fontSize="9.5" fontWeight="bold">
              VOIGT CONVOLUTION: h(s) = f_size(s) ⊗ f_strain(s) ⊗ g_inst(s)
            </text>

            {/* Baseline */}
            <line x1="40" y1={mode1Geometry.baseY} x2="510" y2={mode1Geometry.baseY} stroke="#475569" strokeWidth="1.2" />

            {/* Shaded Observed Voigt Profile */}
            <polygon points={mode1Geometry.obsPolygon} fill="url(#dvObsFill)" />

            {/* Instrumental Kernel Curve */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.4"
              strokeDasharray="2 2"
              points={mode1Geometry.instPolyline}
            />

            {/* Cauchy & Gaussian Sample Components */}
            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              points={mode1Geometry.cauchyPolyline}
            />
            <polyline
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.6"
              strokeDasharray="2 2"
              points={mode1Geometry.gaussPolyline}
            />

            {/* Total Voigt Profile */}
            <polyline
              fill="none"
              stroke="#818CF8"
              strokeWidth="2.4"
              points={mode1Geometry.obsPolyline}
            />

            {/* Centerline */}
            <line
              x1={mode1Geometry.cx}
              y1="38"
              x2={mode1Geometry.cx}
              y2={mode1Geometry.baseY + 5}
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text x={mode1Geometry.cx} y="222" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontWeight="bold">
              2θ₀ = {activePeak ? `${activePeak.twoTheta.toFixed(2)}°` : '28.55°'}{' '}
              {activePeak?.hkl ? `(${activePeak.hkl.join('')})` : '(111)'} &bull; s = {mode1Geometry.sVal.toFixed(3)} nm⁻¹
            </text>

            {/* Legend in Left Plot */}
            <g transform="translate(34, 42)">
              <rect x="0" y="0" width="142" height="58" rx="3" fill="#070A12" fillOpacity="0.9" stroke="#1E293B" />
              <line x1="8" y1="12" x2="24" y2="12" stroke="#818CF8" strokeWidth="2.2" />
              <text x="30" y="15" fill="#E2E8F0" fontSize="8">Total Voigt V(2θ)</text>
              <line x1="8" y1="25" x2="24" y2="25" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="30" y="28" fill="#38BDF8" fontSize="8">Cauchy β_C* (Linear)</text>
              <line x1="8" y1="38" x2="24" y2="38" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="30" y="41" fill="#A855F7" fontSize="8">Gaussian β_G* (Quad)</text>
              <line x1="8" y1="50" x2="24" y2="50" stroke="#F59E0B" strokeWidth="1.3" strokeDasharray="2 2" />
              <text x="30" y="53" fill="#F59E0B" fontSize="8">Inst. g(2θ) ({mode1Geometry.fwhmInstVal.toFixed(3)}°)</text>
            </g>

            {/* Right Panel: Exact Additive Algebra of Double-Voigt Method */}
            <rect x="538" y="12" width="402" height="220" rx="4" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
            <text x="552" y="30" fill="#F8FAFC" fontSize="10" fontWeight="bold">
              RECIPROCAL VOIGT DECONVOLUTION ALGEBRA ({deconvKernel})
            </text>
            <line x1="552" y1="37" x2="926" y2="37" stroke="#1E293B" strokeWidth="1" />

            {/* Step 1: Instrumental Subtraction */}
            <rect x="552" y="46" width="374" height="52" rx="3" fill="#070A12" stroke="#1E293B" />
            <text x="562" y="61" fill="#38BDF8" fontSize="8.5" fontWeight="bold">
              1. EXACT INSTRUMENTAL SUBTRACTION IN CAUCHY &amp; GAUSSIAN CHANNELS:
            </text>
            <text x="562" y="76" fill="#CBD5E1" fontSize="8.5">
              β_C,sample = β_C,obs − β_C,inst   (Linear Lorentzian Addition)
            </text>
            <text x="562" y="90" fill="#CBD5E1" fontSize="8.5">
              β_G,sample² = β_G,obs² − β_G,inst²   (Quadratic Gaussian Addition)
            </text>

            {/* Step 2: Reciprocal Transformation */}
            <g transform="translate(552, 106)">
              <rect x="0" y="0" width="182" height="56" rx="3" fill="#070A12" stroke="#38BDF8" strokeOpacity="0.45" />
              <text x="10" y="16" fill="#38BDF8" fontSize="8.5" fontWeight="bold">
                CAUCHY RECIPROCAL β_C*
              </text>
              <text x="10" y="35" fill="#F8FAFC" fontSize="13" fontWeight="bold">
                {mode1Geometry.betaCStar.toFixed(4)} nm⁻¹
              </text>
              <text x="10" y="49" fill="#64748B" fontSize="8">
                β_C* = β_C·cosθ / λ = 1/⟨D_V⟩ + 2e_C·s
              </text>
            </g>

            <g transform="translate(744, 106)">
              <rect x="0" y="0" width="182" height="56" rx="3" fill="#070A12" stroke="#A855F7" strokeOpacity="0.45" />
              <text x="10" y="16" fill="#A855F7" fontSize="8.5" fontWeight="bold">
                GAUSSIAN RECIPROCAL (β_G*)²
              </text>
              <text x="10" y="35" fill="#F8FAFC" fontSize="13" fontWeight="bold">
                {(mode1Geometry.betaGStar * mode1Geometry.betaGStar).toFixed(5)} nm⁻²
              </text>
              <text x="10" y="49" fill="#64748B" fontSize="8">
                (β_G*)² = (1/πD_G)² + 8πe_G²·s²
              </text>
            </g>

            {/* Step 3: Shape Parameter Readout */}
            <rect x="552" y="170" width="374" height="50" rx="3" fill="#070A12" stroke="#1E293B" />
            <text x="562" y="186" fill="#10B981" fontSize="8.5" fontWeight="bold">
              ACTIVE REFLECTION SHAPE TELEMETRY:
            </text>
            <text x="562" y="201" fill="#CBD5E1" fontSize="8.5">
              η_obs = {mode1Geometry.etaObs.toFixed(3)}  |  Shape φ = FWHM/β = {mode1Geometry.phi.toFixed(4)}  |  β* = {mode1Geometry.betaStar.toFixed(4)} nm⁻¹
            </text>
            <text x="562" y="214" fill="#94A3B8" fontSize="8">
              Apparent Single-Line Size D_V,hkl = {activePeak ? `${activePeak.singleDvNm.toFixed(2)} nm` : '—'}
            </text>
          </svg>
        )}

        {activeMode === 'dualRegression' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="Dual Reciprocal Space Cauchy and Gaussian Regression Plots"
          >
            <defs>
              <pattern id="dvCadGrid2" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeOpacity="0.55" />
              </pattern>
            </defs>

            {/* Left Plot: Cauchy Linear Extrapolation beta_C* vs s */}
            <rect x="20" y="12" width="452" height="220" rx="4" fill="url(#dvCadGrid2)" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="29" fill="#38BDF8" fontSize="9.5" fontWeight="bold">
              01. CAUCHY REGRESSION: β_C*(s) = 1/⟨D_V⟩ + 2e_C·s
            </text>

            <line x1="58" y1="196" x2="452" y2="196" stroke="#475569" strokeWidth="1.2" />
            <line x1="58" y1="42" x2="58" y2="196" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3 3" />

            {(() => {
              const pts = validPoints;
              if (pts.length < 2 || !result) return null;
              const maxS = Math.max(4, ...pts.map(p => p.s)) * 1.12;
              const maxY = Math.max(0.03, ...pts.map(p => p.betaCStar), result.cauchyFit.intercept + result.cauchyFit.slope * maxS) * 1.15;

              const x0 = 58;
              const w = 390;
              const yBase = 196;
              const h = 148;

              const yIntPx = yBase - Math.max(0, Math.min(1, result.cauchyFit.intercept / maxY)) * h;
              const yEndPx = yBase - Math.max(0, Math.min(1, (result.cauchyFit.intercept + result.cauchyFit.slope * maxS) / maxY)) * h;

              return (
                <>
                  {/* Fit Line */}
                  <line x1={x0} y1={yIntPx} x2={x0 + w} y2={yEndPx} stroke="#38BDF8" strokeWidth="2.2" />
                  {/* Intercept Callout */}
                  <circle cx={x0} cy={yIntPx} r="4" fill="#10B981" stroke="#070A12" strokeWidth="1.2" />
                  <text x={x0 + 8} y={Math.max(54, yIntPx - 6)} fill="#10B981" fontSize="8.5" fontWeight="bold">
                    β_C,S* = {result.cauchyFit.intercept.toFixed(4)} nm⁻¹ → ⟨D_V⟩ = {result.volumeSizeDvNm.toFixed(1)} nm
                  </text>

                  {/* Points */}
                  {pts.map((p, i) => {
                    const px = x0 + (p.s / maxS) * w;
                    const py = yBase - Math.max(0, Math.min(1, p.betaCStar / maxY)) * h;
                    return (
                      <g key={i}>
                        <circle cx={px} cy={py} r="4" fill="#6366F1" stroke="#E0E7FF" strokeWidth="1.2" />
                        <text x={px} y={py - 7} textAnchor="middle" fill="#CBD5E1" fontSize="7.5">
                          {p.hkl ? `(${p.hkl.join('')})` : ''}
                        </text>
                      </g>
                    );
                  })}

                  {/* Slope Box */}
                  <rect x="260" y="156" width="184" height="34" rx="2.5" fill="#070A12" stroke="#1E293B" />
                  <text x="268" y="170" fill="#38BDF8" fontSize="8" fontWeight="bold">
                    Slope m_C = 2e_C = {result.cauchyFit.slope.toFixed(4)}
                  </text>
                  <text x="268" y="183" fill="#94A3B8" fontSize="8">
                    e_C = {(result.cauchyStrainEc * 100).toFixed(4)}%  |  R² = {(result.cauchyFit.rSquared * 100).toFixed(1)}%
                  </text>
                </>
              );
            })()}

            <text x="255" y="218" textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
              Scattering Vector s = 2sinθ / λ [nm⁻¹]
            </text>

            {/* Right Plot: Gaussian Parabolic Extrapolation (beta_G*)^2 vs s^2 */}
            <rect x="488" y="12" width="452" height="220" rx="4" fill="url(#dvCadGrid2)" stroke="#1E293B" strokeWidth="1" />
            <text x="500" y="29" fill="#A855F7" fontSize="9.5" fontWeight="bold">
              02. GAUSSIAN REGRESSION: (β_G*(s))² = (1/πD_G)² + 8πe_G²·s²
            </text>

            <line x1="526" y1="196" x2="920" y2="196" stroke="#475569" strokeWidth="1.2" />
            <line x1="526" y1="42" x2="526" y2="196" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="3 3" />

            {(() => {
              const pts = validPoints;
              if (pts.length < 2 || !result) return null;
              const maxS2 = Math.max(16, ...pts.map(p => p.s2)) * 1.12;
              const maxY = Math.max(0.001, ...pts.map(p => p.betaGStarSq), result.gaussianFit.intercept + result.gaussianFit.slope * maxS2) * 1.15;

              const x0 = 526;
              const w = 390;
              const yBase = 196;
              const h = 148;

              const yIntPx = yBase - Math.max(0, Math.min(1, result.gaussianFit.intercept / maxY)) * h;
              const yEndPx = yBase - Math.max(0, Math.min(1, (result.gaussianFit.intercept + result.gaussianFit.slope * maxS2) / maxY)) * h;

              return (
                <>
                  {/* Fit Line */}
                  <line x1={x0} y1={yIntPx} x2={x0 + w} y2={yEndPx} stroke="#A855F7" strokeWidth="2.2" />
                  {/* Intercept Callout */}
                  <circle cx={x0} cy={yIntPx} r="4" fill="#F59E0B" stroke="#070A12" strokeWidth="1.2" />
                  <text x={x0 + 8} y={Math.max(54, yIntPx - 6)} fill="#F59E0B" fontSize="8.5" fontWeight="bold">
                    (β_G,S*)² = {result.gaussianFit.intercept.toFixed(5)} → D_G = {result.gaussianSizeDgNm.toFixed(1)} nm
                  </text>

                  {/* Points */}
                  {pts.map((p, i) => {
                    const px = x0 + (p.s2 / maxS2) * w;
                    const py = yBase - Math.max(0, Math.min(1, p.betaGStarSq / maxY)) * h;
                    return (
                      <g key={i}>
                        <circle cx={px} cy={py} r="4" fill="#A855F7" stroke="#F3E8FF" strokeWidth="1.2" />
                        <text x={px} y={py - 7} textAnchor="middle" fill="#CBD5E1" fontSize="7.5">
                          {p.hkl ? `(${p.hkl.join('')})` : ''}
                        </text>
                      </g>
                    );
                  })}

                  {/* Slope Box */}
                  <rect x="728" y="156" width="184" height="34" rx="2.5" fill="#070A12" stroke="#1E293B" />
                  <text x="736" y="170" fill="#A855F7" fontSize="8" fontWeight="bold">
                    Slope m_G = 8πe_G² = {result.gaussianFit.slope.toFixed(5)}
                  </text>
                  <text x="736" y="183" fill="#94A3B8" fontSize="8">
                    e_G = {(result.gaussianStrainEg * 100).toFixed(4)}%  |  R² = {(result.gaussianFit.rSquared * 100).toFixed(1)}%
                  </text>
                </>
              );
            })()}

            <text x="723" y="218" textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
              Squared Scattering Vector s² = 4sin²θ / λ² [nm⁻²]
            </text>
          </svg>
        )}

        {activeMode === 'fourierEquiv' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="Double-Voigt Analytical Fourier Size Coefficients and Complementary Error Function Coupling"
          >
            <defs>
              <pattern id="dvCadGrid3" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeOpacity="0.55" />
              </pattern>
              <linearGradient id="dvFourierFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Left Frame: Analytical Fourier Size Coefficient A_S(L) & Initial Slope Intercept */}
            <rect x="20" y="12" width="490" height="220" rx="4" fill="url(#dvCadGrid3)" stroke="#1E293B" strokeWidth="1" />
            <text x="32" y="29" fill="#10B981" fontSize="9.5" fontWeight="bold">
              FOURIER SIZE COEFFICIENT: A_S(L) = exp(−2L·β_C,S* − πL²·(β_G,S*)²)
            </text>

            {/* Axes */}
            <line x1={fourierGeometry.x0} y1={fourierGeometry.yBase} x2={fourierGeometry.x0 + fourierGeometry.w} y2={fourierGeometry.yBase} stroke="#475569" strokeWidth="1.2" />
            <line x1={fourierGeometry.x0} y1={fourierGeometry.yTop} x2={fourierGeometry.x0} y2={fourierGeometry.yBase} stroke="#475569" strokeWidth="1.2" />

            {/* Shaded Area under A_S(L) -> Integral = <D>_V / 2 */}
            <polygon points={fourierGeometry.asPolygon} fill="url(#dvFourierFill)" />
            <polyline fill="none" stroke="#10B981" strokeWidth="2.4" points={fourierGeometry.asPolyline} />

            {/* Initial Tangent Line from (L=0, A_S=1) to (L=<D>_A, A_S=0) */}
            <line
              x1={fourierGeometry.x0}
              y1={fourierGeometry.yTop}
              x2={fourierGeometry.xDa}
              y2={fourierGeometry.yBase}
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />
            <circle cx={fourierGeometry.xDa} cy={fourierGeometry.yBase} r="4" fill="#38BDF8" />
            <text x={fourierGeometry.xDa} y={fourierGeometry.yBase - 8} textAnchor="middle" fill="#38BDF8" fontSize="8.5" fontWeight="bold">
              Tangent Intercept ⟨D_A⟩ = {fourierGeometry.Da.toFixed(1)} nm
            </text>

            {/* Volume-weighted <D>_V = 2 * integral A_S(L) dL marker */}
            <line
              x1={fourierGeometry.xDv}
              y1={fourierGeometry.yTop + 10}
              x2={fourierGeometry.xDv}
              y2={fourierGeometry.yBase}
              stroke="#818CF8"
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
            <text x={fourierGeometry.xDv + 5} y={fourierGeometry.yTop + 22} fill="#818CF8" fontSize="8.5" fontWeight="bold">
              ⟨D_V⟩ = 2∫A_S(L)dL = {fourierGeometry.Dv.toFixed(1)} nm
            </text>

            <text x="265" y="218" textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontWeight="bold">
              Fourier Column Length L [nm] (0 to {fourierGeometry.maxL.toFixed(0)} nm)
            </text>

            {/* Right Panel: Langford erfc(k) Coupling & Log-Normal Hierarchy */}
            <rect x="522" y="12" width="418" height="220" rx="4" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
            <text x="536" y="30" fill="#F8FAFC" fontSize="10" fontWeight="bold">
              LANGFORD COMPLEMENTARY ERROR FUNCTION COUPLING
            </text>
            <line x1="536" y1="37" x2="926" y2="37" stroke="#1E293B" strokeWidth="1" />

            <rect x="536" y="46" width="390" height="54" rx="3" fill="#070A12" stroke="#1E293B" />
            <text x="546" y="62" fill="#38BDF8" fontSize="8.5" fontWeight="bold">
              EXACT AREA-WEIGHTED SIZE FROM DUAL INTERCEPTS (β_C,S*, β_G,S*):
            </text>
            <text x="546" y="77" fill="#E2E8F0" fontSize="9">
              ⟨D⟩_A = [1 / (π · β_G,S*)] · exp(k²) · erfc(k),   k = β_C,S* / (√π · β_G,S*)
            </text>
            <text x="546" y="92" fill="#10B981" fontSize="8.5" fontWeight="bold">
              Active k = {(result?.voigtParameterK ?? 0.5).toFixed(4)}  |  β_C,S* = {fourierGeometry.betaCS.toFixed(4)} nm⁻¹  |  β_G,S* = {fourierGeometry.betaGS.toFixed(4)} nm⁻¹
            </text>

            {/* 4 Crystallite Size Moments Hierarchy */}
            <g transform="translate(536, 108)">
              {[
                {
                  label: 'Number-Weighted ⟨D_N⟩',
                  val: result?.numberSizeDnNm ?? fourierGeometry.Da * 0.72,
                  color: '#94A3B8',
                  sub: 'D_0 · exp(0.5 σ_LN²)'
                },
                {
                  label: 'Log-Normal Median M',
                  val: result?.logNormalMedianNm ?? fourierGeometry.Da * 0.84,
                  color: '#38BDF8',
                  sub: '50th Percentile Column'
                },
                {
                  label: 'Area-Weighted ⟨D_A⟩',
                  val: fourierGeometry.Da,
                  color: '#10B981',
                  sub: '−1 / (dA_S/dL)|_{L→0}'
                },
                {
                  label: 'Volume-Weighted ⟨D_V⟩',
                  val: fourierGeometry.Dv,
                  color: '#818CF8',
                  sub: '1 / β_C,S* = 2∫A_S(L)dL'
                }
              ].map((m, i) => {
                const x = (i % 2) * 198;
                const y = Math.floor(i / 2) * 58;
                return (
                  <g key={m.label} transform={`translate(${x}, ${y})`}>
                    <rect x="0" y="0" width="192" height="52" rx="3" fill="#070A12" stroke="#1E293B" />
                    <text x="10" y="15" fill="#94A3B8" fontSize="8" fontWeight="bold">
                      {m.label}
                    </text>
                    <text x="10" y="33" fill={m.color} fontSize="12.5" fontWeight="bold">
                      {m.val.toFixed(2)} nm
                    </text>
                    <text x="10" y="45" fill="#64748B" fontSize="7.5">
                      {m.sub}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
