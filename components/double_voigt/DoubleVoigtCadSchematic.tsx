import React, { useState, useId, useMemo } from 'react';
import { DoubleVoigtResult } from '../../types';
import { Layers, Sliders, Compass } from 'lucide-react';
import { useSettings, convertLength } from '../SettingsContext';
import {
  COLOR_VISION_MODES,
  getThemeSpec,
  isDarkTheme,
} from '../../utils/themeSystem';

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
  deconvKernel,
  regressionWeighting,
  selectedPeakIdx,
  onSelectPeakIdx,
  onSelectKernel,
  onSelectWeighting,
}) => {
  const uid = useId().replace(/:/g, '');
  const { theme, colorVisionMode, lengthUnit = 'Å' } = useSettings();
  const dark = isDarkTheme(theme);
  const themeSpec = getThemeSpec(theme);
  const cvdEntry = useMemo(
    () =>
      COLOR_VISION_MODES.find((m) => m.id === colorVisionMode) ||
      COLOR_VISION_MODES[0],
    [colorVisionMode]
  );

  const [activeMode, setActiveMode] = useState<'convolution' | 'dualRegression' | 'fourierEquiv'>('convolution');
  const [hoveredFourierL, setHoveredFourierL] = useState<number | null>(null);

  const palette = useMemo(() => {
    const isCvd = colorVisionMode !== 'normal';
    const [cvdPrimary, cvdHighlight, cvdSecondary] = cvdEntry.swatches;
    const t = themeSpec.tokens;
    if (dark) {
      return {
        shellBg: t.surface,
        canvasBg: t.canvas,
        insetBg: t.surfaceAlt,
        border: t.border,
        grid: '#1e293b',
        axis: '#475569',
        textPrimary: t.textPrimary,
        textSecondary: t.textSecondary,
        textMuted: t.textMuted,
        accent: isCvd ? cvdPrimary : '#818cf8',
        cauchy: isCvd ? cvdPrimary : '#38bdf8',
        gauss: isCvd ? cvdSecondary : '#a855f7',
        emerald: isCvd ? cvdSecondary : '#10b981',
        amber: isCvd ? cvdHighlight : '#f59e0b',
      };
    }
    return {
      shellBg: t.surface,
      canvasBg: t.canvas,
      insetBg: t.surfaceAlt,
      border: t.border,
      grid: '#e2e8f0',
      axis: '#64748b',
      textPrimary: t.textPrimary,
      textSecondary: t.textSecondary,
      textMuted: t.textMuted,
      accent: isCvd ? cvdPrimary : '#4f46e5',
      cauchy: isCvd ? cvdPrimary : '#0284c7',
      gauss: isCvd ? cvdSecondary : '#7c3aed',
      emerald: isCvd ? cvdSecondary : '#059669',
      amber: isCvd ? cvdHighlight : '#d97706',
    };
  }, [dark, colorVisionMode, cvdEntry, themeSpec]);

  const validPoints = useMemo(() => {
    return (result?.points || []).filter((p) => !p.excluded);
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
    const phi =
      activePeak?.shapeFactorPhi ??
      1 / (0.5 * (Math.PI * etaObs + Math.sqrt(Math.PI / Math.LN2) * (1 - etaObs)));
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
      const instVal =
        (instEta * (1 / (1 + uInst * uInst)) + (1 - instEta) * Math.exp(-Math.LN2 * uInst * uInst)) * 0.62;

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
      instPolyline: instPts.join(' '),
    };
  }, [activePeak, instFwhm, instEta]);

  // Mode 3: Exact Balzar-Ledbetter (1993) Analytical Fourier Coefficient A_S(L)
  const fourierGeometry = useMemo(() => {
    const Dv = result?.volumeSizeDvNm && result.volumeSizeDvNm > 0 ? result.volumeSizeDvNm : 28;
    const Da = result?.areaSizeDaNm && result.areaSizeDaNm > 0 ? result.areaSizeDaNm : 16;
    const Dg = result?.gaussianSizeDgNm && result.gaussianSizeDgNm > 0 ? result.gaussianSizeDgNm : 45;
    // Exact intercepts directly from Dual Regression
    const betaCS = result?.betaCSStar ?? 1 / (2 * Math.max(0.5, Da));
    const betaGS = result?.betaGSStar ?? 1 / Math.max(1, Dg);
    const maxL = Math.max(36, Math.max(Dv, Da) * 2.1);

    const x0 = 52;
    const w = 418;
    const yTop = 48;
    const yBase = 198;
    const h = yBase - yTop;

    const asPts: string[] = [];
    for (let i = 0; i <= 88; i++) {
      const L = (i / 88) * maxL;
      const aSize = Math.exp(-2 * L * betaCS - Math.PI * L * L * betaGS * betaGS);
      const x = x0 + (L / maxL) * w;
      const y = yBase - aSize * h;
      asPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // Exact initial tangent from (L=0, A_S=1) to (L=<D>_A, A_S=0) since -dA_S/dL|_{0} = 2*beta_{S,C}* = 1/<D>_A
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
      h,
      asPolyline: asPts.join(' '),
      asPolygon: `${x0},${yBase} ${asPts.join(' ')} ${x0 + w},${yBase}`,
      xDa,
      xDv,
    };
  }, [result]);

  const hoveredFourierMetrics = useMemo(() => {
    if (hoveredFourierL === null) return null;
    const L = hoveredFourierL;
    const { betaCS, betaGS, Da, maxL, x0, w, yBase, h } = fourierGeometry;
    const aSize = Math.exp(-2 * L * betaCS - Math.PI * L * L * betaGS * betaGS);
    const u = 2 * betaCS + 2 * Math.PI * betaGS * betaGS * L;
    const pA = Da * (u * u - 2 * Math.PI * betaGS * betaGS) * aSize;
    const x = x0 + (L / maxL) * w;
    const y = yBase - aSize * h;
    return { L, aSize, pA, x, y };
  }, [hoveredFourierL, fourierGeometry]);

  const handleFourierMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 960;
    const frac = Math.min(1, Math.max(0, (svgX - fourierGeometry.x0) / fourierGeometry.w));
    setHoveredFourierL(frac * fourierGeometry.maxL);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: palette.shellBg,
        borderColor: palette.border,
      }}
    >
      {/* Top Metrology Schematic Header */}
      <div
        className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: palette.insetBg,
          borderColor: palette.border,
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-semibold tracking-tight" style={{ color: palette.textPrimary }}>
            Double-Voigt Reciprocal Convolution &amp; Fourier Equivalence Schematic
          </span>
          <span aria-hidden="true" style={{ color: palette.textMuted }}>·</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: palette.textMuted }}>
            {activePresetName} · λ = {convertLength(wavelength, lengthUnit).toFixed(4)} {lengthUnit} · k_S = {(result?.voigtParameterK ?? 0).toFixed(3)}
          </span>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg border"
          style={{
            backgroundColor: palette.shellBg,
            borderColor: palette.border,
          }}
        >
          {(
            [
              { id: 'convolution', label: 'Voigt Deconvolution', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'dualRegression', label: 'Dual Extrapolation', icon: <Sliders className="w-3.5 h-3.5" /> },
              { id: 'fourierEquiv', label: 'Fourier A_S(L) & erfcx', icon: <Compass className="w-3.5 h-3.5" /> },
            ] as const
          ).map((tab) => {
            const active = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: active ? palette.insetBg : 'transparent',
                  color: active ? palette.textPrimary : palette.textMuted,
                  border: active ? `1px solid ${palette.border}` : '1px solid transparent',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Sub-Toolbar for Active Mode */}
      <div
        className="px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono tabular-nums"
        style={{
          backgroundColor: palette.shellBg,
          borderColor: palette.border,
        }}
      >
        {activeMode === 'convolution' && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span style={{ color: palette.textMuted }}>Inspect Reflection:</span>
              {(result?.points || []).slice(0, 8).map((pt, i) => {
                const active = selectedPeakIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectPeakIdx(i)}
                    className="px-2 py-0.5 rounded border transition-colors cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: active ? palette.insetBg : 'transparent',
                      borderColor: active ? palette.accent : palette.border,
                      color: active ? palette.textPrimary : palette.textMuted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {pt.hkl ? `(${pt.hkl.join('')})` : `#${i + 1}`} {pt.twoTheta.toFixed(1)}°
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span style={{ color: palette.textMuted }}>Kernel:</span>
              {(
                [
                  { id: 'deKeijser-1982', label: 'de Keijser (1982)' },
                  { id: 'Langford-1978', label: 'Langford (1978)' },
                  { id: 'Balzar-1993', label: 'Balzar (1993)' },
                ] as { id: DVDeconvKernel; label: string }[]
              ).map((k) => {
                const active = deconvKernel === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => onSelectKernel(k.id)}
                    className="px-2 py-0.5 rounded border transition-colors cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: active ? palette.insetBg : 'transparent',
                      borderColor: active ? palette.cauchy : palette.border,
                      color: active ? palette.textPrimary : palette.textMuted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {activeMode === 'dualRegression' && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span style={{ color: palette.textMuted }}>Solver Weighting:</span>
              {(
                [
                  { id: 'OLS', label: 'Standard OLS' },
                  { id: 'WLS-LowS', label: '1/s Low-Angle WLS' },
                  { id: 'Huber-Robust', label: 'Huber Robust IRLS' },
                ] as { id: DVRegressionWeighting; label: string }[]
              ).map((w) => {
                const active = regressionWeighting === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWeighting(w.id)}
                    className="px-2.5 py-0.5 rounded border transition-colors cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: active ? palette.insetBg : 'transparent',
                      borderColor: active ? palette.gauss : palette.border,
                      color: active ? palette.textPrimary : palette.textMuted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
            <div style={{ color: palette.textMuted }}>
              Cauchy R² ={' '}
              <strong style={{ color: palette.cauchy }}>
                {result ? (result.cauchyFit.rSquared * 100).toFixed(1) : '—'}%
              </strong>
              {' · '}
              Gaussian R² ={' '}
              <strong style={{ color: palette.gauss }}>
                {result ? (result.gaussianFit.rSquared * 100).toFixed(1) : '—'}%
              </strong>
            </div>
          </>
        )}

        {activeMode === 'fourierEquiv' && (
          <>
            <div style={{ color: palette.textSecondary }}>
              Balzar–Ledbetter (1993):{' '}
              <strong style={{ color: palette.emerald }}>
                A_S(L) = exp(−2L·β_S,C* − πL²·(β_S,G*)²)
              </strong>
            </div>
            <div style={{ color: palette.textMuted }}>
              ⟨D_A⟩ ={' '}
              <strong style={{ color: palette.cauchy }}>
                {convertLength(fourierGeometry.Da * 10, lengthUnit).toFixed(1)} {lengthUnit}
              </strong>
              {' · '}
              ⟨D_V⟩ ={' '}
              <strong style={{ color: palette.accent }}>
                {convertLength(fourierGeometry.Dv * 10, lengthUnit).toFixed(1)} {lengthUnit}
              </strong>
              {' · '}
              κ ={' '}
              <strong style={{ color: palette.amber }}>
                {(result?.polydispersityRatio ?? 1.25).toFixed(2)}
              </strong>
            </div>
          </>
        )}
      </div>

      {/* Main Vector Metrology Canvas */}
      <div className="relative p-3" style={{ backgroundColor: palette.canvasBg }}>
        {activeMode === 'convolution' && (
          <svg
            viewBox="0 0 960 245"
            className="w-full h-auto block select-none font-mono"
            role="img"
            aria-label="Double-Voigt Reciprocal Convolution and Kernel Decomposition Schematic"
          >
            <defs>
              <pattern id={`dvCadGrid1-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke={palette.grid} strokeWidth="0.7" />
              </pattern>
              <linearGradient id={`dvObsFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.accent} stopOpacity={dark ? 0.25 : 0.16} />
                <stop offset="100%" stopColor={palette.accent} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Left Frame: Voigt Profile Decomposition */}
            <rect x="20" y="12" width="505" height="220" rx="6" fill={`url(#dvCadGrid1-${uid})`} stroke={palette.border} strokeWidth="1" />
            <text x="32" y="29" fill={palette.textSecondary} fontSize="9.5" fontWeight="bold">
              VOIGT CONVOLUTION: h(s) = f_size(s) ⊗ f_strain(s) ⊗ g_inst(s)
            </text>

            {/* Baseline */}
            <line x1="40" y1={mode1Geometry.baseY} x2="510" y2={mode1Geometry.baseY} stroke={palette.axis} strokeWidth="1.2" />

            {/* Shaded Observed Voigt Profile */}
            <polygon points={mode1Geometry.obsPolygon} fill={`url(#dvObsFill-${uid})`} />

            {/* Instrumental Kernel Curve */}
            <polyline fill="none" stroke={palette.amber} strokeWidth="1.5" strokeDasharray="2 2" points={mode1Geometry.instPolyline} />
            {/* Cauchy & Gaussian Components */}
            <polyline fill="none" stroke={palette.cauchy} strokeWidth="1.7" strokeDasharray="4 3" points={mode1Geometry.cauchyPolyline} />
            <polyline fill="none" stroke={palette.gauss} strokeWidth="1.7" strokeDasharray="2 2" points={mode1Geometry.gaussPolyline} />
            {/* Total Voigt Profile */}
            <polyline fill="none" stroke={palette.accent} strokeWidth="2.3" points={mode1Geometry.obsPolyline} />

            {/* Centerline */}
            <line x1={mode1Geometry.cx} y1="38" x2={mode1Geometry.cx} y2={mode1Geometry.baseY + 5} stroke={palette.axis} strokeWidth="1" strokeDasharray="3 3" />
            <text x={mode1Geometry.cx} y="222" textAnchor="middle" fill={palette.textPrimary} fontSize="9.5" fontWeight="bold">
              2θ₀ = {activePeak ? `${activePeak.twoTheta.toFixed(2)}°` : '28.55°'}{' '}
              {activePeak?.hkl ? `(${activePeak.hkl.join('')})` : '(111)'} · s = {mode1Geometry.sVal.toFixed(3)} nm⁻¹
            </text>

            {/* Legend in Left Plot */}
            <g transform="translate(34, 42)">
              <rect x="0" y="0" width="154" height="60" rx="4" fill={palette.shellBg} fillOpacity="0.94" stroke={palette.border} />
              <line x1="8" y1="12" x2="24" y2="12" stroke={palette.accent} strokeWidth="2.2" />
              <text x="30" y="15" fill={palette.textPrimary} fontSize="8">Total Voigt V(2θ)</text>
              <line x1="8" y1="25" x2="24" y2="25" stroke={palette.cauchy} strokeWidth="1.6" strokeDasharray="3 2" />
              <text x="30" y="28" fill={palette.cauchy} fontSize="8">Cauchy β_C* (Linear)</text>
              <line x1="8" y1="38" x2="24" y2="38" stroke={palette.gauss} strokeWidth="1.6" strokeDasharray="2 2" />
              <text x="30" y="41" fill={palette.gauss} fontSize="8">Gaussian β_G* (Quad)</text>
              <line x1="8" y1="51" x2="24" y2="51" stroke={palette.amber} strokeWidth="1.4" strokeDasharray="2 2" />
              <text x="30" y="54" fill={palette.amber} fontSize="8">Inst. g(2θ) ({mode1Geometry.fwhmInstVal.toFixed(3)}°)</text>
            </g>

            {/* Right Panel: Exact Additive Algebra of Double-Voigt Method */}
            <rect x="538" y="12" width="402" height="220" rx="6" fill={palette.shellBg} stroke={palette.border} strokeWidth="1" />
            <text x="552" y="30" fill={palette.textPrimary} fontSize="10" fontWeight="bold">
              RECIPROCAL VOIGT DECONVOLUTION ({deconvKernel})
            </text>
            <line x1="552" y1="37" x2="926" y2="37" stroke={palette.border} strokeWidth="1" />

            {/* Step 1 */}
            <rect x="552" y="46" width="374" height="52" rx="4" fill={palette.insetBg} stroke={palette.border} />
            <text x="562" y="61" fill={palette.cauchy} fontSize="8.5" fontWeight="bold">
              1. EXACT INSTRUMENTAL SUBTRACTION (CAUCHY &amp; GAUSSIAN):
            </text>
            <text x="562" y="76" fill={palette.textSecondary} fontSize="8.5">
              β_C,sample = β_C,obs − β_C,inst   (Linear Cauchy Deconvolution)
            </text>
            <text x="562" y="90" fill={palette.textSecondary} fontSize="8.5">
              β_G,sample² = β_G,obs² − β_G,inst²   (Quadratic Gaussian Deconvolution)
            </text>

            {/* Step 2 */}
            <g transform="translate(552, 106)">
              <rect x="0" y="0" width="182" height="56" rx="4" fill={palette.insetBg} stroke={palette.cauchy} strokeOpacity="0.55" />
              <text x="10" y="16" fill={palette.cauchy} fontSize="8.5" fontWeight="bold">
                CAUCHY RECIPROCAL β_C*
              </text>
              <text x="10" y="35" fill={palette.textPrimary} fontSize="13" fontWeight="bold">
                {mode1Geometry.betaCStar.toFixed(4)} nm⁻¹
              </text>
              <text x="10" y="49" fill={palette.textMuted} fontSize="8">
                β_C* = 1/(2⟨D_A⟩) + 2e_C·s
              </text>
            </g>

            <g transform="translate(744, 106)">
              <rect x="0" y="0" width="182" height="56" rx="4" fill={palette.insetBg} stroke={palette.gauss} strokeOpacity="0.55" />
              <text x="10" y="16" fill={palette.gauss} fontSize="8.5" fontWeight="bold">
                GAUSSIAN RECIPROCAL (β_G*)²
              </text>
              <text x="10" y="35" fill={palette.textPrimary} fontSize="13" fontWeight="bold">
                {(mode1Geometry.betaGStar * mode1Geometry.betaGStar).toFixed(5)} nm⁻²
              </text>
              <text x="10" y="49" fill={palette.textMuted} fontSize="8">
                (β_G*)² = (1/D_G)² + 2π⟨ε_G²⟩·s²
              </text>
            </g>

            {/* Step 3 */}
            <rect x="552" y="170" width="374" height="50" rx="4" fill={palette.insetBg} stroke={palette.border} />
            <text x="562" y="186" fill={palette.emerald} fontSize="8.5" fontWeight="bold">
              ACTIVE REFLECTION SHAPE TELEMETRY:
            </text>
            <text x="562" y="201" fill={palette.textSecondary} fontSize="8.5">
              η_obs = {mode1Geometry.etaObs.toFixed(3)}  |  φ = FWHM/β = {mode1Geometry.phi.toFixed(4)}  |  β* = {mode1Geometry.betaStar.toFixed(4)} nm⁻¹
            </text>
            <text x="562" y="214" fill={palette.textMuted} fontSize="8">
              Single-Line Voigt Apparent Size D_V,hkl = {activePeak ? `${convertLength(activePeak.singleDvNm * 10, lengthUnit).toFixed(2)} ${lengthUnit}` : '—'}
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
              <pattern id={`dvCadGrid2-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke={palette.grid} strokeWidth="0.7" />
              </pattern>
            </defs>

            {/* Left Plot: Cauchy Linear Extrapolation beta_C* vs s */}
            <rect x="20" y="12" width="452" height="220" rx="6" fill={`url(#dvCadGrid2-${uid})`} stroke={palette.border} strokeWidth="1" />
            <text x="32" y="29" fill={palette.cauchy} fontSize="9.5" fontWeight="bold">
              CAUCHY REGRESSION: β_C*(s) = 1/(2⟨D_A⟩) + 2e_C·s
            </text>

            <line x1="58" y1="196" x2="452" y2="196" stroke={palette.axis} strokeWidth="1.2" />
            <line x1="58" y1="42" x2="58" y2="196" stroke={palette.cauchy} strokeWidth="1.2" strokeDasharray="3 3" />

            {(() => {
              const pts = validPoints;
              if (pts.length < 2 || !result) return null;
              const maxS = Math.max(4, ...pts.map((p) => p.s)) * 1.12;
              const maxY =
                Math.max(
                  0.02,
                  ...pts.map((p) => p.betaCStar),
                  result.cauchyFit.intercept + result.cauchyFit.slope * maxS
                ) * 1.16;

              const x0 = 58;
              const w = 390;
              const yBase = 196;
              const h = 148;

              const yIntPx = yBase - Math.max(0, Math.min(1, result.cauchyFit.intercept / maxY)) * h;
              const yEndPx =
                yBase -
                Math.max(0, Math.min(1, (result.cauchyFit.intercept + result.cauchyFit.slope * maxS) / maxY)) * h;

              return (
                <>
                  <line x1={x0} y1={yIntPx} x2={x0 + w} y2={yEndPx} stroke={palette.cauchy} strokeWidth="2.2" />
                  <circle cx={x0} cy={yIntPx} r="4" fill={palette.emerald} stroke={palette.canvasBg} strokeWidth="1.2" />
                  <text x={x0 + 8} y={Math.max(54, yIntPx - 6)} fill={palette.emerald} fontSize="8.5" fontWeight="bold">
                    β_S,C* = {result.cauchyFit.intercept.toFixed(4)} nm⁻¹ → ⟨D_A⟩ = {convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(1)} {lengthUnit}
                  </text>

                  {pts.map((p, i) => {
                    const px = x0 + (p.s / maxS) * w;
                    const py = yBase - Math.max(0, Math.min(1, p.betaCStar / maxY)) * h;
                    const origIdx = p.index ?? i;
                    const isSel = origIdx === selectedPeakIdx;
                    return (
                      <g key={i} className="cursor-pointer" onClick={() => onSelectPeakIdx(origIdx)}>
                        <circle
                          cx={px}
                          cy={py}
                          r={isSel ? 5 : 3.8}
                          fill={isSel ? palette.emerald : palette.accent}
                          stroke={palette.canvasBg}
                          strokeWidth="1.4"
                        />
                        <text x={px} y={py - 7} textAnchor="middle" fill={palette.textSecondary} fontSize="7.5">
                          {p.hkl ? `(${p.hkl.join('')})` : ''}
                        </text>
                      </g>
                    );
                  })}

                  <rect x="256" y="156" width="188" height="34" rx="4" fill={palette.shellBg} stroke={palette.border} />
                  <text x="264" y="170" fill={palette.cauchy} fontSize="8" fontWeight="bold">
                    Slope m_C = 2e_C = {result.cauchyFit.slope.toFixed(4)}
                  </text>
                  <text x="264" y="183" fill={palette.textMuted} fontSize="8">
                    e_C = {(result.cauchyStrainEc * 100).toFixed(4)}% · R² = {(result.cauchyFit.rSquared * 100).toFixed(1)}%
                  </text>
                </>
              );
            })()}

            <text x="255" y="218" textAnchor="middle" fill={palette.textMuted} fontSize="8.5" fontWeight="bold">
              Scattering Vector s = 2sinθ / λ [nm⁻¹]
            </text>

            {/* Right Plot: Gaussian Parabolic Extrapolation (beta_G*)^2 vs s^2 */}
            <rect x="488" y="12" width="452" height="220" rx="6" fill={`url(#dvCadGrid2-${uid})`} stroke={palette.border} strokeWidth="1" />
            <text x="500" y="29" fill={palette.gauss} fontSize="9.5" fontWeight="bold">
              GAUSSIAN REGRESSION: (β_G*(s))² = (1/D_G)² + 2π⟨ε_G²⟩·s²
            </text>

            <line x1="526" y1="196" x2="920" y2="196" stroke={palette.axis} strokeWidth="1.2" />
            <line x1="526" y1="42" x2="526" y2="196" stroke={palette.gauss} strokeWidth="1.2" strokeDasharray="3 3" />

            {(() => {
              const pts = validPoints;
              if (pts.length < 2 || !result) return null;
              const maxS2 = Math.max(16, ...pts.map((p) => p.s2)) * 1.12;
              const maxY =
                Math.max(
                  0.0005,
                  ...pts.map((p) => p.betaGStarSq),
                  result.gaussianFit.intercept + result.gaussianFit.slope * maxS2
                ) * 1.16;

              const x0 = 526;
              const w = 390;
              const yBase = 196;
              const h = 148;

              const yIntPx = yBase - Math.max(0, Math.min(1, result.gaussianFit.intercept / maxY)) * h;
              const yEndPx =
                yBase -
                Math.max(0, Math.min(1, (result.gaussianFit.intercept + result.gaussianFit.slope * maxS2) / maxY)) * h;

              return (
                <>
                  <line x1={x0} y1={yIntPx} x2={x0 + w} y2={yEndPx} stroke={palette.gauss} strokeWidth="2.2" />
                  <circle cx={x0} cy={yIntPx} r="4" fill={palette.amber} stroke={palette.canvasBg} strokeWidth="1.2" />
                  <text x={x0 + 8} y={Math.max(54, yIntPx - 6)} fill={palette.amber} fontSize="8.5" fontWeight="bold">
                    (β_S,G*)² = {Math.max(0, result.gaussianFit.intercept).toFixed(5)} → D_G = {convertLength(result.gaussianSizeDgNm * 10, lengthUnit).toFixed(1)} {lengthUnit}
                  </text>

                  {pts.map((p, i) => {
                    const px = x0 + (p.s2 / maxS2) * w;
                    const py = yBase - Math.max(0, Math.min(1, p.betaGStarSq / maxY)) * h;
                    const origIdx = p.index ?? i;
                    const isSel = origIdx === selectedPeakIdx;
                    return (
                      <g key={i} className="cursor-pointer" onClick={() => onSelectPeakIdx(origIdx)}>
                        <circle
                          cx={px}
                          cy={py}
                          r={isSel ? 5 : 3.8}
                          fill={isSel ? palette.amber : palette.gauss}
                          stroke={palette.canvasBg}
                          strokeWidth="1.4"
                        />
                        <text x={px} y={py - 7} textAnchor="middle" fill={palette.textSecondary} fontSize="7.5">
                          {p.hkl ? `(${p.hkl.join('')})` : ''}
                        </text>
                      </g>
                    );
                  })}

                  <rect x="724" y="156" width="188" height="34" rx="4" fill={palette.shellBg} stroke={palette.border} />
                  <text x="732" y="170" fill={palette.gauss} fontSize="8" fontWeight="bold">
                    Slope m_G = 2π⟨ε_G²⟩ = {result.gaussianFit.slope.toFixed(5)}
                  </text>
                  <text x="732" y="183" fill={palette.textMuted} fontSize="8">
                    e_G = {(result.gaussianStrainEg * 100).toFixed(4)}% · R² = {(result.gaussianFit.rSquared * 100).toFixed(1)}%
                  </text>
                </>
              );
            })()}

            <text x="723" y="218" textAnchor="middle" fill={palette.textMuted} fontSize="8.5" fontWeight="bold">
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
              <pattern id={`dvCadGrid3-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke={palette.grid} strokeWidth="0.7" />
              </pattern>
              <linearGradient id={`dvFourierFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.emerald} stopOpacity={dark ? 0.25 : 0.16} />
                <stop offset="100%" stopColor={palette.emerald} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Left Frame: Analytical Fourier Size Coefficient A_S(L) & Exact Initial Slope Intercept */}
            <rect x="20" y="12" width="490" height="220" rx="6" fill={`url(#dvCadGrid3-${uid})`} stroke={palette.border} strokeWidth="1" />
            <text x="32" y="29" fill={palette.emerald} fontSize="9.5" fontWeight="bold">
              FOURIER SIZE COEFFICIENT: A_S(L) = exp(−2L·β_S,C* − πL²·(β_S,G*)²)
            </text>

            {/* Axes */}
            <line x1={fourierGeometry.x0} y1={fourierGeometry.yBase} x2={fourierGeometry.x0 + fourierGeometry.w} y2={fourierGeometry.yBase} stroke={palette.axis} strokeWidth="1.2" />
            <line x1={fourierGeometry.x0} y1={fourierGeometry.yTop} x2={fourierGeometry.x0} y2={fourierGeometry.yBase} stroke={palette.axis} strokeWidth="1.2" />

            {/* Shaded Area under A_S(L) -> 2 * Integral = <D>_V */}
            <polygon points={fourierGeometry.asPolygon} fill={`url(#dvFourierFill-${uid})`} />
            <polyline fill="none" stroke={palette.emerald} strokeWidth="2.4" points={fourierGeometry.asPolyline} />

            {/* Exact Initial Tangent Line from (L=0, A_S=1) to (L=<D>_A, A_S=0) */}
            <line
              x1={fourierGeometry.x0}
              y1={fourierGeometry.yTop}
              x2={fourierGeometry.xDa}
              y2={fourierGeometry.yBase}
              stroke={palette.cauchy}
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />
            <circle cx={fourierGeometry.xDa} cy={fourierGeometry.yBase} r="4" fill={palette.cauchy} />
            <text x={Math.min(fourierGeometry.x0 + fourierGeometry.w - 60, Math.max(fourierGeometry.x0 + 60, fourierGeometry.xDa))} y={fourierGeometry.yBase - 8} textAnchor="middle" fill={palette.cauchy} fontSize="8.5" fontWeight="bold">
              ⟨D_A⟩ = {fourierGeometry.Da.toFixed(1)} nm
            </text>

            {/* Volume-weighted <D>_V = 2 * integral A_S(L) dL marker */}
            <line
              x1={fourierGeometry.xDv}
              y1={fourierGeometry.yTop + 10}
              x2={fourierGeometry.xDv}
              y2={fourierGeometry.yBase}
              stroke={palette.accent}
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
            <text x={Math.min(fourierGeometry.x0 + fourierGeometry.w - 135, fourierGeometry.xDv + 5)} y={fourierGeometry.yTop + 22} fill={palette.accent} fontSize="8.5" fontWeight="bold">
              ⟨D_V⟩ = 2∫A_S dL = {fourierGeometry.Dv.toFixed(1)} nm
            </text>

            {/* Interactive Hover Crosshair on A_S(L) */}
            {hoveredFourierMetrics && (
              <g>
                <line
                  x1={hoveredFourierMetrics.x}
                  y1={fourierGeometry.yTop}
                  x2={hoveredFourierMetrics.x}
                  y2={fourierGeometry.yBase}
                  stroke={palette.textMuted}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle cx={hoveredFourierMetrics.x} cy={hoveredFourierMetrics.y} r="4" fill={palette.emerald} stroke={palette.canvasBg} strokeWidth="1.5" />
                <rect x={fourierGeometry.x0 + fourierGeometry.w - 156} y={fourierGeometry.yTop + 34} width="150" height="44" rx="4" fill={palette.shellBg} stroke={palette.border} />
                <text x={fourierGeometry.x0 + fourierGeometry.w - 148} y={fourierGeometry.yTop + 48} fill={palette.textPrimary} fontSize="8.5" fontWeight="bold">
                  L = {hoveredFourierMetrics.L.toFixed(1)} nm
                </text>
                <text x={fourierGeometry.x0 + fourierGeometry.w - 148} y={fourierGeometry.yTop + 61} fill={palette.emerald} fontSize="8">
                  A_S(L) = {hoveredFourierMetrics.aSize.toFixed(4)}
                </text>
                <text x={fourierGeometry.x0 + fourierGeometry.w - 148} y={fourierGeometry.yTop + 73} fill={palette.cauchy} fontSize="8">
                  p_A(L) = {(hoveredFourierMetrics.pA * 100).toFixed(2)}%
                </text>
              </g>
            )}

            {/* Invisible interactive hover target over A_S(L) plot */}
            <rect
              x={fourierGeometry.x0}
              y={fourierGeometry.yTop}
              width={fourierGeometry.w}
              height={fourierGeometry.h}
              fill="transparent"
              className="cursor-crosshair"
              onMouseMove={handleFourierMouseMove}
              onMouseLeave={() => setHoveredFourierL(null)}
            />

            <text x="265" y="218" textAnchor="middle" fill={palette.textMuted} fontSize="8.5" fontWeight="bold">
              Fourier Column Length L [nm] (Hover curve to probe A_S(L) &amp; p_A(L))
            </text>

            {/* Right Panel: Exact Balzar-Ledbetter erfcx(k_S) Coupling & Size Moments */}
            <rect x="522" y="12" width="418" height="220" rx="6" fill={palette.shellBg} stroke={palette.border} strokeWidth="1" />
            <text x="536" y="30" fill={palette.textPrimary} fontSize="10" fontWeight="bold">
              BALZAR–LEDBETTER (1993) SIZE MOMENT COUPLING
            </text>
            <line x1="536" y1="37" x2="926" y2="37" stroke={palette.border} strokeWidth="1" />

            <rect x="536" y="46" width="390" height="54" rx="4" fill={palette.insetBg} stroke={palette.border} />
            <text x="546" y="61" fill={palette.cauchy} fontSize="8.5" fontWeight="bold">
              EXACT VOLUME &amp; AREA WEIGHTED SIZES FROM DUAL INTERCEPTS:
            </text>
            <text x="546" y="76" fill={palette.textPrimary} fontSize="8.8">
              ⟨D⟩_A = 1 / (2·β_S,C*)  |  ⟨D⟩_V = exp(k_S²)·erfc(k_S) / β_S,G*
            </text>
            <text x="546" y="91" fill={palette.emerald} fontSize="8.3" fontWeight="bold">
              k_S = {(result?.voigtParameterK ?? 0.8).toFixed(3)} · β_S,C* = {fourierGeometry.betaCS.toFixed(4)} · β_S,G* = {fourierGeometry.betaGS.toFixed(4)} nm⁻¹
            </text>

            {/* 4 Crystallite Size Moments Hierarchy */}
            <g transform="translate(536, 108)">
              {[
                {
                  label: 'Number-Weighted ⟨D_N⟩',
                  val: result?.numberSizeDnNm ?? fourierGeometry.Da * 0.72,
                  color: palette.textSecondary,
                  sub: 'D_0 · exp(0.5 σ_LN²)',
                },
                {
                  label: 'Log-Normal Median D_0',
                  val: result?.logNormalMedianNm ?? fourierGeometry.Da * 0.65,
                  color: palette.cauchy,
                  sub: '⟨D_A⟩ · exp(−2.5 σ_LN²)',
                },
                {
                  label: 'Area-Weighted ⟨D_A⟩',
                  val: fourierGeometry.Da,
                  color: palette.emerald,
                  sub: '1 / (2·β_S,C*) = −1/A_S′(0)',
                },
                {
                  label: 'Volume-Weighted ⟨D_V⟩',
                  val: fourierGeometry.Dv,
                  color: palette.accent,
                  sub: 'erfcx(k_S)/β_S,G* = 2∫A_S dL',
                },
              ].map((m, i) => {
                const x = (i % 2) * 198;
                const y = Math.floor(i / 2) * 58;
                return (
                  <g key={m.label} transform={`translate(${x}, ${y})`}>
                    <rect x="0" y="0" width="192" height="52" rx="4" fill={palette.insetBg} stroke={palette.border} />
                    <text x="10" y="15" fill={palette.textMuted} fontSize="8" fontWeight="bold">
                      {m.label}
                    </text>
                    <text x="10" y="33" fill={m.color} fontSize="12.5" fontWeight="bold">
                      {convertLength(m.val * 10, lengthUnit).toFixed(2)} {lengthUnit}
                    </text>
                    <text x="10" y="45" fill={palette.textMuted} fontSize="7.5">
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
