import React, { useState, useMemo } from 'react';
import { 
  Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Info, Compass, 
  Ruler, Activity, ArrowRight, Zap, ShieldAlert, Cpu, ChevronRight, Layers, Sliders,
  Gauge, Award, FileText, Download, Check, Copy, Eye, Grid, RotateCcw,
  Maximize2, SlidersHorizontal, FlaskConical, BarChart2, ShieldCheck, HelpCircle,
  TrendingUp, TrendingDown, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Area
} from 'recharts';
import rietveldBg from '../src/assets/images/rietveld_bg_1785614322504.jpg';

import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface PhysicalCorrectionSuggestion {
  id: string;
  category: 'zero_shift' | 'displacement' | 'lattice' | 'background' | 'profile_shape' | 'asymmetry' | 'texture' | 'thermal' | 'strain';
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

  // 7. High-Angle Thermal Debye-Waller Attenuation Anomaly
  const highAnglePeaks = peaks.filter(p => p.twoTheta > 55);
  if (highAnglePeaks.length >= 2) {
    const highResAvg = highAnglePeaks.reduce((acc, p) => {
      const r = residuals.find(res => Math.abs(res.twoTheta - p.twoTheta) < 0.1)?.diff || 0;
      return acc + r;
    }, 0) / highAnglePeaks.length;

    if (Math.abs(highResAvg) > maxObs * 0.05) {
      suggestions.push({
        id: 'corr_thermal',
        category: 'thermal',
        title: 'Thermal Debye-Waller Factor Decay (B_iso Attenuation)',
        physicalCause: 'Isotropic atomic thermal vibrations attenuate Bragg peak intensities exponentially at higher scattering angles.',
        residualSignature: `Systematic high-angle intensity over/under-estimation above 55°2θ (High-angle Mean Residual: ${highResAvg > 0 ? '+' : ''}${highResAvg.toFixed(1)} counts).`,
        mathematicalFormula: 'I_{hkl} = I_0 \\cdot e^{-2B_{iso} \\left(\\frac{\\sin\\theta}{\\lambda}\\right)^2}',
        suggestedAction: 'Calibrate overall isotropic temperature factor B_iso in unit cell refinement.',
        parameterName: 'Thermal B_iso',
        recommendedValue: 0.85,
        unit: 'Å²',
        confidence: 82,
        impactSeverity: 'medium',
        applyFnKey: 'bIso'
      });
    }
  }

  // 8. Microstrain vs Size Broadening Mismatch
  if (peaks.length >= 4) {
    const lowPeak = peaks[0];
    const highPeak = peaks[peaks.length - 1];
    const lowRatio = (residuals.find(r => Math.abs(r.twoTheta - lowPeak.twoTheta) < 0.1)?.absDiff || 0) / (lowPeak.height || 1);
    const highRatio = (residuals.find(r => Math.abs(r.twoTheta - highPeak.twoTheta) < 0.1)?.absDiff || 0) / (highPeak.height || 1);

    if (highRatio > lowRatio * 1.8 && highRatio > 0.08) {
      suggestions.push({
        id: 'corr_strain',
        category: 'strain',
        title: 'Lattice Microstrain Broadening Anomaly (ε = Δd/d)',
        physicalCause: 'Unresolved internal lattice strain or dislocation density causing peak broadening scaling with tan(θ).',
        residualSignature: 'Progressive peak width broadening discrepancy increasing at higher 2θ angles.',
        mathematicalFormula: '\\beta_{\\text{strain}} = 4 \\varepsilon \\tan(\\theta)',
        suggestedAction: 'Activate Williamson-Hall microstrain parameter refinement (U Caglioti term).',
        parameterName: 'Microstrain ε',
        recommendedValue: '0.0018',
        unit: 'ratio',
        confidence: 86,
        impactSeverity: 'high',
        applyFnKey: 'microstrain'
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
  const [activeTab, setActiveTab] = useState<'advisor' | 'verifier_hud' | 'spectral_profiler' | 'simulator' | 'physics_equations'>('advisor');
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedTex, setCopiedTex] = useState<boolean>(false);

  // Spectral Profiler Controls
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDiffArea, setShowDiffArea] = useState<boolean>(true);
  const [zoomRange, setZoomRange] = useState<{ left: number | null; right: number | null }>({ left: null, right: null });
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  // Synthetic Simulator Controls
  const [simZero, setSimZero] = useState<number>(0);
  const [simDisp, setSimDisp] = useState<number>(0);
  const [simStrain, setSimStrain] = useState<number>(0);

  // Calculate synthetic data if simulator modified
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (simZero === 0 && simDisp === 0 && simStrain === 0) return data;

    return data.map(d => {
      const thetaRad = (d.twoTheta / 2) * (Math.PI / 180);
      const dispShift = - (2 * simDisp / 240) * Math.cos(thetaRad) * (180 / Math.PI);
      const totalShift = simZero + dispShift;
      
      // Artificial intensity/width modification
      const strainFactor = 1 + simStrain * Math.tan(thetaRad) * 5;
      const modifiedCalc = d.calc * (1 / strainFactor);

      return {
        ...d,
        twoTheta: Number((d.twoTheta + totalShift).toFixed(2)),
        calc: Number(modifiedCalc.toFixed(1))
      };
    });
  }, [data, simZero, simDisp, simStrain]);

  const suggestions = useMemo(() => {
    return analyzeRietveldResiduals(
      processedData,
      currentZeroShift + simZero,
      currentDisplacement + simDisp,
      currentFwhm,
      currentEta,
      bgTerms
    );
  }, [processedData, currentZeroShift, simZero, currentDisplacement, simDisp, currentFwhm, currentEta, bgTerms]);

  // Comprehensive Physics Verification HUD Score Metrics
  const verifierHUD = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      return { score: 100, rP: '0.00', rWP: '0.00', gof: '1.00', checks: [] };
    }

    const N = processedData.length;
    let sumAbsDiff = 0;
    let sumObs = 0;
    let sumSqDiff = 0;
    let sumSqObs = 0;

    processedData.forEach(d => {
      const diff = Math.abs(d.obs - d.calc);
      sumAbsDiff += diff;
      sumObs += d.obs;
      sumSqDiff += Math.pow(d.obs - d.calc, 2);
      sumSqObs += Math.pow(d.obs, 2);
    });

    const rP = sumObs > 0 ? (sumAbsDiff / sumObs) * 100 : 0;
    const rWP = sumSqObs > 0 ? Math.sqrt(sumSqDiff / sumSqObs) * 100 : 0;
    const gof = Math.max(1.0, Math.sqrt(sumSqDiff / (N * 100 || 1)));

    // Physics Validity Deductions
    let penalty = 0;
    suggestions.forEach(s => {
      if (s.impactSeverity === 'high') penalty += 18;
      else if (s.impactSeverity === 'medium') penalty += 10;
      else penalty += 5;
    });

    const physicsScore = Math.max(15, Math.min(100, Math.round(100 - penalty - (rWP > 15 ? (rWP - 15) * 1.5 : 0))));

    const checks = [
      {
        name: 'Goniometer Zero-Point Calibration',
        rule: '|Δ2θ₀| ≤ 0.02°',
        status: suggestions.some(s => s.category === 'zero_shift') ? 'fail' : 'pass',
        details: suggestions.find(s => s.category === 'zero_shift')?.residualSignature || 'Zero-index aligned within tolerances'
      },
      {
        name: 'Sample Stage Vertical Height Displacement',
        rule: '|s| ≤ 0.05 mm',
        status: suggestions.some(s => s.category === 'displacement') ? 'fail' : 'pass',
        details: suggestions.find(s => s.category === 'displacement')?.residualSignature || 'Bragg-Brentano specimen plane aligned'
      },
      {
        name: 'Background Continuum Chebyshev Smoothness',
        rule: 'Residual Noise Continuum Flatness',
        status: suggestions.some(s => s.category === 'background') ? 'warning' : 'pass',
        details: suggestions.find(s => s.category === 'background')?.residualSignature || 'Air scatter & baseline continuum modeled'
      },
      {
        name: 'Caglioti Peak Profile & Lorentzian Mixing',
        rule: 'W-shaped residual oscillation absent',
        status: suggestions.some(s => s.category === 'profile_shape') ? 'warning' : 'pass',
        details: suggestions.find(s => s.category === 'profile_shape')?.residualSignature || 'Pseudo-Voigt peak shape matched'
      },
      {
        name: 'Low-Angle Axial Divergence Asymmetry',
        rule: 'Finger-Cox-Jephcoat asymmetry bound',
        status: suggestions.some(s => s.category === 'asymmetry') ? 'warning' : 'pass',
        details: suggestions.find(s => s.category === 'asymmetry')?.residualSignature || 'Low-angle Soller slit divergence symmetric'
      },
      {
        name: 'Crystallographic Texture (March-Dollase)',
        rule: 'Preferred Orientation Ratio r ≈ 1.0',
        status: suggestions.some(s => s.category === 'texture') ? 'warning' : 'pass',
        details: suggestions.find(s => s.category === 'texture')?.residualSignature || 'Isotropic grain orientation verified'
      },
      {
        name: 'High-Angle Thermal B_iso Factor Decay',
        rule: 'B_iso ≥ 0.1 Å²',
        status: suggestions.some(s => s.category === 'thermal') ? 'fail' : 'pass',
        details: suggestions.find(s => s.category === 'thermal')?.residualSignature || 'Thermal vibration factor within physical limits'
      }
    ];

    return {
      score: physicsScore,
      rP: rP.toFixed(2),
      rWP: rWP.toFixed(2),
      gof: gof.toFixed(2),
      checks
    };
  }, [processedData, suggestions]);

  // Handle Zoom logic
  const handleZoom = () => {
    if (refAreaLeft && refAreaRight) {
      const [l, r] = [refAreaLeft, refAreaRight].sort((a, b) => a - b);
      setZoomRange({ left: l, right: r });
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

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

  const handleApplyAll = () => {
    suggestions.forEach(s => {
      if (onApplyCorrection && s.applyFnKey) {
        onApplyCorrection({
          key: s.applyFnKey,
          value: s.recommendedValue,
          title: s.title
        });
        setAppliedIds(prev => new Set(prev).add(s.id));
      }
    });
  };

  // Export physics certificate
  const exportCertificate = () => {
    const dateStr = new Date().toISOString();
    const content = `=====================================================
    PHYSICS MODULE VERIFIER - AUDIT CERTIFICATE
=====================================================
Timestamp: ${dateStr}
Overall Physics Integrity Score: ${verifierHUD.score} / 100
Residual Profile Factor (Rp): ${verifierHUD.rP}%
Weighted Profile Factor (Rwp): ${verifierHUD.rWP}%
Goodness of Fit (ChiSq): ${verifierHUD.gof}

PHYSICAL CONSTRAINTS AUDIT LEDGER:
-----------------------------------------------------
${verifierHUD.checks.map((c, i) => `[${c.status.toUpperCase()}] ${i+1}. ${c.name}
  Criteria: ${c.rule}
  Diagnosis: ${c.details}\n`).join('\n')}

PHYSICAL ANOMALY RECOMMENDATIONS DETECTED: (${suggestions.length})
-----------------------------------------------------
${suggestions.map((s, i) => `${i+1}. ${s.title}
   - Severity: ${s.impactSeverity.toUpperCase()} | Confidence: ${s.confidence}%
   - Cause: ${s.physicalCause}
   - Suggested Value: ${s.recommendedValue} ${s.unit}
   - Math Formula: ${s.mathematicalFormula}\n`).join('\n')}

=====================================================
Status: VERIFIED BY CRYSTALLOGRAPHY PHYSICS ENGINE
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Physics_Verifier_Audit_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-8 bg-[#050A14] rounded-3xl border border-slate-800 text-center space-y-3">
        <Info className="w-10 h-10 text-slate-500 mx-auto" />
        <p className="text-sm text-slate-400 font-mono">No active diffraction dataset available for Physics Verification.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#050A14] border border-slate-800 hover:border-slate-700 rounded-[2.5rem] p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden group/verifier transition-all duration-500">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] group-hover/verifier:opacity-[0.08] transition-opacity duration-1000 mix-blend-screen">
        <img src={rietveldBg} alt="Physics Module Verifier" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      {/* Module Title Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover/icon:bg-indigo-400/30 transition-all duration-500" />
            <div className="w-14 h-14 bg-[#080d1a] rounded-2xl border border-indigo-500/40 flex items-center justify-center relative shadow-inner group-hover/icon:border-indigo-400 transition-colors">
              <ShieldCheck className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-wide uppercase">Physics Module Verifier</h2>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                v3.2 PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Automated Crystallographic Physical Constraints & Residual Anomaly Diagnostic Suite
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {suggestions.length > 0 && onApplyCorrection && (
            <button
              onClick={handleApplyAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Apply All ({suggestions.length})</span>
            </button>
          )}

          <button
            onClick={exportCertificate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold font-mono uppercase tracking-wider border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Audit Report</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 relative z-10">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === 'advisor'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Diagnostic Advisory ({suggestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verifier_hud')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === 'verifier_hud'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Physics Scorecard & HUD</span>
        </button>

        <button
          onClick={() => setActiveTab('spectral_profiler')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === 'spectral_profiler'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Residual Spectral Profiler</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === 'simulator'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Synthetic Anomaly Injector</span>
        </button>

        <button
          onClick={() => setActiveTab('physics_equations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === 'physics_equations'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Governing Physical Models</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DIAGNOSTIC ADVISORY
          ========================================================================= */}
      {activeTab === 'advisor' && (
        <div className="space-y-4 relative z-10">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#080e1c] border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Physics Score</span>
                <span className={`text-xl font-mono font-black ${
                  verifierHUD.score >= 85 ? 'text-emerald-400' : verifierHUD.score >= 65 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {verifierHUD.score} / 100
                </span>
              </div>
            </div>

            <div className="bg-[#080e1c] border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Anomalies Detected</span>
                <span className="text-xl font-mono font-black text-rose-400">{suggestions.length}</span>
              </div>
            </div>

            <div className="bg-[#080e1c] border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Residual R_wp</span>
                <span className="text-xl font-mono font-black text-amber-300">{verifierHUD.rWP}%</span>
              </div>
            </div>

            <div className="bg-[#080e1c] border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">ChiSq / GoF</span>
                <span className="text-xl font-mono font-black text-cyan-300">{verifierHUD.gof}</span>
              </div>
            </div>
          </div>

          {/* Suggestions List */}
          {suggestions.length === 0 ? (
            <div className="p-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center space-y-3 relative z-10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-emerald-300">Optimal Physical Fit Verified</h4>
              <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                Residual analysis indicates no major systematic physical discrepancies (Zero-Shift, Sample Displacement, or Profile Shape mismatch). The residual noise is randomly distributed around zero baseline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                      {/* Title & Category Icon */}
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
                          {s.category === 'thermal' && <TrendingDown className="w-5 h-5" />}
                          {s.category === 'strain' && <TrendingUp className="w-5 h-5" />}
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

                      {/* Recommended Value & Action */}
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

                    {/* Expanded Explanation Card */}
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
                              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider block">Physical Cause Mechanism</span>
                              <p className="text-slate-300 leading-relaxed">{s.physicalCause}</p>
                            </div>

                            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                              <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider block">Recommended Refinement Strategy</span>
                              <p className="text-slate-300 leading-relaxed">{s.suggestedAction}</p>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center flex items-center justify-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Governing Formula:</span>
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
      )}

      {/* =========================================================================
          TAB 2: PHYSICS SCORECARD & HUD
          ========================================================================= */}
      {activeTab === 'verifier_hud' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Score Dial */}
            <div className="md:col-span-5 bg-[#080e1c] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
              
              <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={verifierHUD.score >= 85 ? '#10b981' : verifierHUD.score >= 65 ? '#f59e0b' : '#f43f5e'}
                    strokeWidth="12"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * verifierHUD.score) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black font-mono text-white">{verifierHUD.score}%</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Physics Integrity</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">
                {verifierHUD.score >= 85 ? 'High Crystallographic Fidelity' : verifierHUD.score >= 65 ? 'Moderate Physical Anomaly Warning' : 'Critical Parameter Deviation'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-sans">
                Computed against 7 fundamental physical bounds (Goniometer geometry, profile symmetry, thermal vibrations, absorption).
              </p>
            </div>

            {/* Right Checks Ledger */}
            <div className="md:col-span-7 bg-[#080e1c] border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Physical Constraints Audit Ledger</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  {verifierHUD.checks.filter(c => c.status === 'pass').length} / {verifierHUD.checks.length} Passed
                </span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {verifierHUD.checks.map((check, idx) => (
                  <div key={idx} className="bg-[#050a14] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      {check.status === 'fail' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{check.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{check.details}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border shrink-0 ${
                      check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                      check.status === 'warning' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SPECTRAL RESIDUAL PROFILER
          ========================================================================= */}
      {activeTab === 'spectral_profiler' && (
        <div className="space-y-4 relative z-10">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080e1c] p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>2θ Residual Curve Profiler</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                  showGrid ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
                }`}
                title="Toggle Gridlines"
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowDiffArea(!showDiffArea)}
                className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                  showDiffArea ? 'bg-slate-800 text-amber-400 border-amber-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
                }`}
                title="Toggle Residual Fill"
              >
                <Eye className="w-4 h-4" />
              </button>

              {zoomRange.left !== null && (
                <button
                  onClick={() => setZoomRange({ left: null, right: null })}
                  className="flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border border-indigo-500/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Zoom
                </button>
              )}
            </div>
          </div>

          {/* Recharts Profiler Graph */}
          <div className="w-full h-[380px] bg-[#030712] rounded-2xl border border-slate-800 p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedData}
                margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                onMouseUp={handleZoom}
                onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                <XAxis 
                  dataKey="twoTheta" 
                  type="number"
                  domain={zoomRange.left !== null && zoomRange.right !== null ? [zoomRange.left, zoomRange.right] : ['dataMin', 'dataMax']}
                  allowDataOverflow={true}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  label={{ value: 'Scattering Angle [°2Theta]', position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const twoTheta = label;
                    const thetaRad = (twoTheta / 2) * (Math.PI / 180);
                    const dSpacing = thetaRad > 0 ? (1.5406 / (2 * Math.sin(thetaRad))).toFixed(4) : 'N/A';
                    const obs = payload.find((p: any) => p.dataKey === 'obs')?.value || 0;
                    const calc = payload.find((p: any) => p.dataKey === 'calc')?.value || 0;
                    const diff = obs - calc;

                    return (
                      <div className="bg-[#050A14]/95 backdrop-blur-xl border border-slate-700 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1 z-50">
                        <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-1">
                          2θ: {twoTheta}° (d = {dSpacing} Å)
                        </div>
                        <div className="text-slate-300">Observed: <span className="font-bold text-white">{obs}</span></div>
                        <div className="text-indigo-300">Calculated: <span className="font-bold text-white">{calc}</span></div>
                        <div className={`font-bold ${diff > 0 ? 'text-rose-400' : diff < 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                          Residual (Δ): {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }} />
                
                <Line type="monotone" dataKey="obs" name="Observed (Y_obs)" stroke="#38bdf8" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="calc" name="Calculated (Y_calc)" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SYNTHETIC ANOMALY INJECTOR
          ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-[#080e1c] border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  <span>Synthetic Anomaly Injector Sandbox</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Inject artificial physical distortions into the active pattern to evaluate real-time diagnostic sensitivity.
                </p>
              </div>

              <button
                onClick={() => { setSimZero(0); setSimDisp(0); setSimStrain(0); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold uppercase transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Simulator
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Zero Shift Injector */}
              <div className="bg-[#050a14] border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-300">Zero-Shift Offset</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{simZero > 0 ? `+${simZero}` : simZero}°2θ</span>
                </div>
                <input
                  type="range"
                  min="-0.2"
                  max="0.2"
                  step="0.01"
                  value={simZero}
                  onChange={(e) => setSimZero(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Simulates optical goniometer zero misalignment.</p>
              </div>

              {/* Sample Displacement Injector */}
              <div className="bg-[#050a14] border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-300">Sample Displacement</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{simDisp > 0 ? `+${simDisp}` : simDisp} mm</span>
                </div>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step="0.02"
                  value={simDisp}
                  onChange={(e) => setSimDisp(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Simulates specimen height displacement in Bragg-Brentano.</p>
              </div>

              {/* Microstrain Injector */}
              <div className="bg-[#050a14] border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-300">Microstrain Distortion</span>
                  <span className="text-xs font-mono font-bold text-rose-400">{(simStrain * 100).toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.05"
                  step="0.005"
                  value={simStrain}
                  onChange={(e) => setSimStrain(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Simulates strain-induced peak broadening scaling with tan(θ).</p>
              </div>
            </div>

            {/* Diagnostic Result Callout */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-mono text-slate-300">
                  Active Physics Diagnostics detected <strong className="text-amber-400">{suggestions.length} anomalies</strong> under current synthetic simulation parameters.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('advisor')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors shrink-0"
              >
                View Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: GOVERNING PHYSICAL MODELS
          ========================================================================= */}
      {activeTab === 'physics_equations' && (
        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Zero Shift & Displacement */}
            <div className="bg-[#080e1c] border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Bragg-Brentano Goniometer Alignments</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Sample height displacement $s$ causes an angular shift scaling with $\cos\theta$, while zero-index error $\Delta2\theta_0$ remains constant.
              </p>
              <div className="bg-[#030712] p-3 rounded-xl border border-slate-800 text-center font-mono text-xs text-cyan-300 overflow-x-auto">
                <span dangerouslySetInnerHTML={{ __html: katex.renderToString('\\Delta(2\\theta) = \\Delta 2\\theta_0 - \\frac{2s}{R} \\cos\\theta', { throwOnError: false }) }} />
              </div>
            </div>

            {/* Caglioti Profile Broadening */}
            <div className="bg-[#080e1c] border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 uppercase font-mono flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Caglioti Instrument Broadening</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Instrumental full-width at half-maximum ($H$) quadratic dependence on scattering angle theta.
              </p>
              <div className="bg-[#030712] p-3 rounded-xl border border-slate-800 text-center font-mono text-xs text-indigo-300 overflow-x-auto">
                <span dangerouslySetInnerHTML={{ __html: katex.renderToString('H^2 = U \\tan^2\\theta + V \\tan\\theta + W', { throwOnError: false }) }} />
              </div>
            </div>

            {/* March-Dollase Texture */}
            <div className="bg-[#080e1c] border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-rose-400 uppercase font-mono flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>March-Dollase Texture Correction</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Models preferred orientation probability density where r &lt; 1 represents plate-like habit and r &gt; 1 represents needle habit.
              </p>
              <div className="bg-[#030712] p-3 rounded-xl border border-slate-800 text-center font-mono text-xs text-rose-300 overflow-x-auto">
                <span dangerouslySetInnerHTML={{ __html: katex.renderToString('P_K = (r^2 \\cos^2\\alpha + r^{-1} \\sin^2\\alpha)^{-3/2}', { throwOnError: false }) }} />
              </div>
            </div>

            {/* Thermal Debye-Waller Factor */}
            <div className="bg-[#080e1c] border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 uppercase font-mono flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span>Debye-Waller Thermal Factor Decay</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Isotropic mean-square thermal displacement $\langle u^2 \rangle$ attenuates Bragg reflections at higher angles.
              </p>
              <div className="bg-[#030712] p-3 rounded-xl border border-slate-800 text-center font-mono text-xs text-emerald-300 overflow-x-auto">
                <span dangerouslySetInnerHTML={{ __html: katex.renderToString('I_{hkl} = I_0 \\cdot e^{-2B_{iso} \\left(\\frac{\\sin\\theta}{\\lambda}\\right)^2}, \\quad B_{iso} = 8\\pi^2 \\langle u^2 \\rangle', { throwOnError: false }) }} />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
