import React, { useState, useMemo } from 'react';
import { 
  Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Info, Compass, 
  Ruler, Activity, ArrowRight, Zap, ShieldAlert, Cpu, ChevronRight, Layers, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface PhysicalCorrectionSuggestion {
  id: string;
  category: 'zero_shift' | 'displacement' | 'lattice' | 'background' | 'profile_shape' | 'asymmetry' | 'texture';
  title: string;
  physicalCause: string;
  residualSignature: string;
  mathematicalFormula: string;
  suggestedAction: string;
  parameterName: string;
  recommendedValue: number | string;
  unit: string;
  confidence: number; // 0 - 100%
  impactSeverity: 'high' | 'medium' | 'low';
  applyFnKey?: string;
}

export function analyzeRietveldResiduals(
  data: Array<{ twoTheta: number; obs: number; calc: number; bkg?: number }>,
  currentZeroShift: number = 0,
  currentDisplacement: number = 0,
  currentFwhm: number = 0.15,
  currentEta: number = 0.5,
  bgTerms: number = 3
): PhysicalCorrectionSuggestion[] {
  if (!data || data.length === 0) return [];

  const suggestions: PhysicalCorrectionSuggestion[] = [];
  const N = data.length;

  const residuals = data.map(d => ({
    twoTheta: d.twoTheta,
    thetaRad: (d.twoTheta / 2) * (Math.PI / 180),
    obs: d.obs,
    calc: d.calc,
    diff: d.obs - d.calc,
    absDiff: Math.abs(d.obs - d.calc)
  }));

  const maxObs = Math.max(...data.map(d => d.obs), 1);
  const avgObs = data.reduce((acc, d) => acc + d.obs, 0) / N;
  const rmsResidual = Math.sqrt(residuals.reduce((acc, r) => acc + r.diff * r.diff, 0) / N);
  const relRms = (rmsResidual / (avgObs || 1)) * 100;

  // Identify local peak maxima in obs/calc data
  const peaks: { twoTheta: number; obsPeakT: number; calcPeakT: number; delta2Theta: number; cosTheta: number; tanTheta: number; height: number }[] = [];

  for (let i = 2; i < N - 2; i++) {
    const isObsPeak = data[i].obs > data[i-1].obs && data[i].obs > data[i-2].obs && data[i].obs > data[i+1].obs && data[i].obs > data[i+2].obs && data[i].obs > avgObs * 1.2;
    if (isObsPeak) {
      let bestCalcT = data[i].twoTheta;
      let maxCalc = data[i].calc;
      for (let j = Math.max(0, i - 10); j <= Math.min(N - 1, i + 10); j++) {
        if (data[j].calc > maxCalc) {
          maxCalc = data[j].calc;
          bestCalcT = data[j].twoTheta;
        }
      }
      const delta2T = data[i].twoTheta - bestCalcT;
      const thetaRad = (data[i].twoTheta / 2) * (Math.PI / 180);
      peaks.push({
        twoTheta: data[i].twoTheta,
        obsPeakT: data[i].twoTheta,
        calcPeakT: bestCalcT,
        delta2Theta: delta2T,
        cosTheta: Math.cos(thetaRad),
        tanTheta: Math.tan(thetaRad),
        height: data[i].obs
      });
    }
  }

  // 1. Zero-Shift Correction
  if (peaks.length >= 2) {
    const meanDelta2T = peaks.reduce((acc, p) => acc + p.delta2Theta, 0) / peaks.length;
    const stdDelta2T = Math.sqrt(peaks.reduce((acc, p) => acc + Math.pow(p.delta2Theta - meanDelta2T, 2), 0) / peaks.length);

    if (Math.abs(meanDelta2T) >= 0.008 && stdDelta2T < 0.12) {
      const suggestedZero = Number((currentZeroShift + meanDelta2T).toFixed(4));
      suggestions.push({
        id: 'corr_zero_shift',
        category: 'zero_shift',
        title: 'Instrumental Zero-Shift Correction (Δ2θ₀)',
        physicalCause: 'Systematic angular misalignment of optical detector, sample stage zero index, or goniometer zero calibration point.',
        residualSignature: `Bragg peaks display a uniform directional position shift across 2θ range (Mean Offset Δ2θ = ${meanDelta2T > 0 ? '+' : ''}${meanDelta2T.toFixed(3)}°).`,
        mathematicalFormula: '\\Delta(2\\theta) = \\Delta 2\\theta_0',
        suggestedAction: `Adjust zero-shift calibration parameter to ${suggestedZero}°2θ to cancel the systematic angular error.`,
        parameterName: 'Zero Shift',
        recommendedValue: suggestedZero,
        unit: '°2θ',
        confidence: Math.min(98, Math.max(68, Math.round(88 - stdDelta2T * 100))),
        impactSeverity: Math.abs(meanDelta2T) > 0.04 ? 'high' : 'medium',
        applyFnKey: 'zeroShift'
      });
    }
  }

  // 2. Sample Displacement (Height Offset) Correction
  if (peaks.length >= 3) {
    let sumCos = 0, sumDelta = 0, sumCosSq = 0, sumCosDelta = 0;
    peaks.forEach(p => {
      sumCos += p.cosTheta;
      sumDelta += p.delta2Theta;
      sumCosSq += p.cosTheta * p.cosTheta;
      sumCosDelta += p.cosTheta * p.delta2Theta;
    });
    const k = peaks.length;
    const slope = (k * sumCosDelta - sumCos * sumDelta) / (k * sumCosSq - sumCos * sumCos + 1e-9);
    const R = 240; // 240 mm diffractometer radius
    const estimatedS = - (slope * (Math.PI / 180) * R) / 2; // in mm

    if (Math.abs(estimatedS) >= 0.008 && Math.abs(slope) > 0.015) {
      const suggestedDisp = Number((currentDisplacement + estimatedS).toFixed(4));
      suggestions.push({
        id: 'corr_displacement',
        category: 'displacement',
        title: 'Sample Displacement Height Correction (s / SyCos)',
        physicalCause: 'Sample surface is physically displaced vertically from the goniometer center of rotation in Bragg-Brentano reflection geometry.',
        residualSignature: `Peak position residuals vary as a function of cos(θ), generating larger peak position errors at low 2θ angles (Slope: ${slope.toFixed(3)}°/cosθ).`,
        mathematicalFormula: '\\Delta(2\\theta) = -\\frac{2s}{R} \\cos(\\theta)',
        suggestedAction: `Apply sample displacement height correction of ${estimatedS > 0 ? '+' : ''}${estimatedS.toFixed(3)} mm (${suggestedDisp} mm total SyCos).`,
        parameterName: 'Sample Displacement',
        recommendedValue: suggestedDisp,
        unit: 'mm',
        confidence: Math.min(95, Math.max(62, Math.round(76 + Math.abs(slope) * 180))),
        impactSeverity: Math.abs(estimatedS) > 0.04 ? 'high' : 'medium',
        applyFnKey: 'sampleDisplacement'
      });
    }
  }

  // 3. Background Chebyshev Order
  const lowIntPoints = residuals.filter(r => r.obs < avgObs * 0.4);
  if (lowIntPoints.length > N * 0.15) {
    const avgLowDiff = lowIntPoints.reduce((acc, r) => acc + r.diff, 0) / lowIntPoints.length;
    const lowDiffRms = Math.sqrt(lowIntPoints.reduce((acc, r) => acc + Math.pow(r.diff - avgLowDiff, 2), 0) / lowIntPoints.length);

    if (Math.abs(avgLowDiff) > maxObs * 0.015 || lowDiffRms > maxObs * 0.025) {
      const recTerms = Math.min(12, Math.max(6, bgTerms + 3));
      suggestions.push({
        id: 'corr_background',
        category: 'background',
        title: 'Background Polynomial / Chebyshev Expansion',
        physicalCause: 'Unmodeled air scattering, specimen fluorescence, amorphous halo, or vacuum chamber window diffuse scattering.',
        residualSignature: `Non-zero baseline residual offset observed between Bragg reflections (Mean Baseline Error: ${avgLowDiff > 0 ? '+' : ''}${avgLowDiff.toFixed(1)} counts).`,
        mathematicalFormula: 'B(2\\theta) = \\sum_{m=0}^{N-1} C_m T_m(x)',
        suggestedAction: `Expand background polynomial representation from ${bgTerms} to ${recTerms} Chebyshev terms.`,
        parameterName: 'Chebyshev Terms',
        recommendedValue: recTerms,
        unit: 'terms',
        confidence: Math.min(92, Math.max(70, Math.round(72 + (Math.abs(avgLowDiff)/maxObs)*400))),
        impactSeverity: Math.abs(avgLowDiff) > maxObs * 0.04 ? 'high' : 'medium',
        applyFnKey: 'bgTerms'
      });
    }
  }

  // 4. Peak Profile Shape & Caglioti Broadening
  let wShapeCount = 0;
  peaks.forEach(p => {
    const peakPoints = residuals.filter(r => Math.abs(r.twoTheta - p.twoTheta) <= 0.3);
    if (peakPoints.length >= 5) {
      const centerRes = peakPoints.find(r => Math.abs(r.twoTheta - p.twoTheta) < 0.05)?.diff || 0;
      const wingResLeft = peakPoints[0]?.diff || 0;
      const wingResRight = peakPoints[peakPoints.length - 1]?.diff || 0;
      if ((centerRes < 0 && wingResLeft > 0 && wingResRight > 0) || (centerRes > 0 && wingResLeft < 0 && wingResRight < 0)) {
        wShapeCount++;
      }
    }
  });

  if (wShapeCount > 0 || relRms > 12) {
    const recEta = Number(Math.max(0.1, Math.min(0.95, currentEta + (wShapeCount > 1 ? 0.15 : -0.1))).toFixed(2));
    suggestions.push({
      id: 'corr_profile_shape',
      category: 'profile_shape',
      title: 'Pseudo-Voigt Profile & Caglioti Broadening (U, V, W, η)',
      physicalCause: 'Mismatch between actual instrument/crystallite profile shape and pseudo-Voigt model (U, V, W Caglioti parameters).',
      residualSignature: `Characteristic W-shaped residual oscillations detected across ${Math.max(1, wShapeCount)} Bragg peak core(s) and wings.`,
      mathematicalFormula: 'pV(2\\theta) = \\eta L(2\\theta) + (1-\\eta) G(2\\theta)',
      suggestedAction: `Refine Caglioti parameters (U, V, W) and adjust Lorentzian mixing fraction η to ${recEta}.`,
      parameterName: 'Lorentzian Mixing (η)',
      recommendedValue: recEta,
      unit: 'ratio',
      confidence: Math.min(90, Math.max(65, 65 + wShapeCount * 8)),
      impactSeverity: wShapeCount > 2 ? 'high' : 'medium',
      applyFnKey: 'eta'
    });
  }

  // 5. Low-Angle Peak Asymmetry
  const lowAnglePeaks = peaks.filter(p => p.twoTheta < 32);
  if (lowAnglePeaks.length > 0) {
    let lowAngleAsym = false;
    lowAnglePeaks.forEach(p => {
      const leftRes = residuals.filter(r => r.twoTheta >= p.twoTheta - 0.4 && r.twoTheta < p.twoTheta);
      const rightRes = residuals.filter(r => r.twoTheta > p.twoTheta && r.twoTheta <= p.twoTheta + 0.4);
      const sumLeft = leftRes.reduce((acc, r) => acc + r.diff, 0);
      const sumRight = rightRes.reduce((acc, r) => acc + r.diff, 0);
      if (Math.abs(sumLeft - sumRight) > maxObs * 0.04) {
        lowAngleAsym = true;
      }
    });

    if (lowAngleAsym) {
      suggestions.push({
        id: 'corr_asymmetry',
        category: 'asymmetry',
        title: 'Low-Angle Axial Divergence & Peak Asymmetry',
        physicalCause: 'Soller slit divergence limits and flat specimen geometry causing asymmetric peak tailing at low 2θ angles (< 30°2θ).',
        residualSignature: 'Asymmetric residual lobes skewed towards lower 2θ angles in reflections below 30°.',
        mathematicalFormula: 'A(2\\theta) = 1 - s \\cdot \\text{sign}(\\Delta) \\cdot \\frac{(\\Delta2\\theta)^2}{\\tan\\theta}',
        suggestedAction: 'Enable low-angle peak asymmetry refinement (Finger-Cox-Jephcoat axial divergence model).',
        parameterName: 'Peak Asymmetry',
        recommendedValue: 'Low-Angle Model',
        unit: 'mode',
        confidence: 84,
        impactSeverity: 'medium',
        applyFnKey: 'asymmetry'
      });
    }
  }

  // 6. Preferred Orientation (Crystallographic Texture)
  if (peaks.length >= 3) {
    const maxPeak = peaks.reduce((prev, curr) => curr.height > prev.height ? curr : prev, peaks[0]);
    const maxPeakRes = residuals.find(r => Math.abs(r.twoTheta - maxPeak.twoTheta) < 0.05)?.diff || 0;
    if (Math.abs(maxPeakRes) > maxPeak.height * 0.12) {
      const suggestedR = maxPeakRes > 0 ? 0.86 : 1.14;
      suggestions.push({
        id: 'corr_texture',
        category: 'texture',
        title: 'Preferred Orientation Texture Correction (March-Dollase)',
        physicalCause: 'Crystallite morphology (platy or needle-like habit) causing preferential alignment along specific crystallographic direction.',
        residualSignature: `Prominent single-reflection intensity mismatch at ${maxPeak.twoTheta.toFixed(1)}°2θ (${maxPeakRes > 0 ? '+' : ''}${maxPeakRes.toFixed(0)} counts).`,
        mathematicalFormula: 'P_K = (r^2 \\cos^2\\alpha + r^{-1} \\sin^2\\alpha)^{-3/2}',
        suggestedAction: `Refine March-Dollase preferred orientation parameter r to ${suggestedR}.`,
        parameterName: 'March-Dollase r',
        recommendedValue: suggestedR,
        unit: 'ratio',
        confidence: 79,
        impactSeverity: 'medium',
        applyFnKey: 'marchDollase'
      });
    }
  }

  return suggestions;
}

interface PhysicalResidualCorrectionsModuleProps {
  data: Array<{ twoTheta: number; obs: number; calc: number; bkg?: number }>;
  currentZeroShift?: number;
  currentDisplacement?: number;
  currentFwhm?: number;
  currentEta?: number;
  bgTerms?: number;
  onApplyCorrection?: (correction: {
    key: string;
    value: any;
    title: string;
  }) => void;
}

export const PhysicalResidualCorrectionsModule: React.FC<PhysicalResidualCorrectionsModuleProps> = ({
  data,
  currentZeroShift = 0,
  currentDisplacement = 0,
  currentFwhm = 0.15,
  currentEta = 0.5,
  bgTerms = 3,
  onApplyCorrection
}) => {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    return analyzeRietveldResiduals(
      data,
      currentZeroShift,
      currentDisplacement,
      currentFwhm,
      currentEta,
      bgTerms
    );
  }, [data, currentZeroShift, currentDisplacement, currentFwhm, currentEta, bgTerms]);

  const handleApply = (s: PhysicalCorrectionSuggestion) => {
    if (onApplyCorrection && s.applyFnKey) {
      onApplyCorrection({
        key: s.applyFnKey,
        value: s.recommendedValue,
        title: s.title
      });
      setAppliedIds(prev => new Set(prev).add(s.id));
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-2">
        <Info className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-xs text-slate-400 font-mono">No diffraction dataset active for residual analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Physical Residual Corrections Advisor
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Diagnostic physical parameter recommendations derived from observed Rietveld residuals ($Y_{'{obs}'} - Y_{'{calc}'}$)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-rose-400 border border-rose-500/20">
            {suggestions.length} Physical Anomaly{suggestions.length !== 1 ? 'ies' : ''} Detected
          </span>
        </div>
      </div>

      {/* Empty State / All Clear */}
      {suggestions.length === 0 ? (
        <div className="p-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center space-y-3 relative z-10">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-emerald-300">Optimal Physical Fit Achieved</h4>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            Residual analysis indicates no major systematic physical discrepancies (Zero-Shift, Sample Displacement, or Profile Shape mismatch). The residual noise is randomly distributed around zero baseline.
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {suggestions.map((s) => {
            const isApplied = appliedIds.has(s.id);
            const isExpanded = expandedId === s.id;

            return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-950/80 border rounded-2xl p-5 transition-all shadow-lg ${
                  isApplied 
                    ? 'border-emerald-500/40 bg-emerald-950/10' 
                    : s.impactSeverity === 'high' 
                      ? 'border-rose-500/40 hover:border-rose-500/60' 
                      : 'border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Title & Icon */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isApplied 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : s.impactSeverity === 'high' 
                          ? 'bg-rose-500/20 text-rose-400' 
                          : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {s.category === 'zero_shift' && <Compass className="w-5 h-5" />}
                      {s.category === 'displacement' && <Ruler className="w-5 h-5" />}
                      {s.category === 'background' && <Sliders className="w-5 h-5" />}
                      {s.category === 'profile_shape' && <Activity className="w-5 h-5" />}
                      {s.category === 'asymmetry' && <Zap className="w-5 h-5" />}
                      {s.category === 'texture' && <Layers className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-100">{s.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          s.impactSeverity === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {s.impactSeverity} severity
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {s.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{s.residualSignature}</p>
                    </div>
                  </div>

                  {/* Recommendation & Apply Action */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Suggested Value</span>
                      <span className="text-sm font-mono font-black text-amber-300">
                        {s.recommendedValue} {s.unit}
                      </span>
                    </div>

                    {onApplyCorrection && s.applyFnKey && (
                      <button
                        onClick={() => handleApply(s)}
                        disabled={isApplied}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md ${
                          isApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white border border-rose-400/30 shadow-rose-500/20'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-200" />
                            <span>Apply Correction</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Toggle Detailed Physical Explanation"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Physical Mechanism & Formula Card */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 overflow-hidden text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider block">Physical Cause</span>
                          <p className="text-slate-300 leading-relaxed">{s.physicalCause}</p>
                        </div>

                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider block">Recommended Refinement Action</span>
                          <p className="text-slate-300 leading-relaxed">{s.suggestedAction}</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center flex items-center justify-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Governing Correction Model:</span>
                        <span 
                          className="text-amber-300"
                          dangerouslySetInnerHTML={{ 
                            __html: katex.renderToString(s.mathematicalFormula, { throwOnError: false, displayMode: false }) 
                          }} 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
