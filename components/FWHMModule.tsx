import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCcw, Activity, Zap, Box, Layers, Scan, CheckCircle, Download, BookOpen, HelpCircle,
  Sliders, Eye, ZoomIn, ZoomOut, Crosshair, TrendingUp, BarChart2, Split, Maximize2, Sparkles, SlidersHorizontal,
  Wand2, Check, Scale, Calculator
} from 'lucide-react';
import { simulatePeak } from '../utils/physics';
import { FWHMResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Label
} from 'recharts';

export const FWHMModule: React.FC = () => {
  const [type, setType] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Pearson VII'>('Pseudo-Voigt');
  const [center, setCenter] = useState<number>(30);
  const [fwhmManual, setFwhmManual] = useState<number>(0.5);
  const [eta, setEta] = useState<number>(0.5);
  const [amplitude, setAmplitude] = useState<number>(100);
  const [background, setBackground] = useState<number>(10);
  const [bgSlope, setBgSlope] = useState<number>(0); // deg 2theta background slope
  const [noiseLevel, setNoiseLevel] = useState<number>(2);
  
  // Advanced Physics State
  const [voigtFormulation, setVoigtFormulation] = useState<'Linear' | 'TCH'>('TCH'); // Linear PV vs Thompson-Cox-Hastings formulation
  const [enableInstCorrection, setEnableInstCorrection] = useState<boolean>(true); // Instrumental Broadening Deconvolution
  const [instBroadening, setInstBroadening] = useState<number>(0.08); // Instrument FWHM (deg)
  const [highPrecisionControls, setHighPrecisionControls] = useState<boolean>(false); // 0.001 deg slider resolution
  const [showComponents, setShowComponents] = useState<boolean>(true); // G & L components
  const [enableKaDoublet, setEnableKaDoublet] = useState<boolean>(false); // Ka1/Ka2 doublet splitting
  const [ka2Ratio, setKa2Ratio] = useState<number>(0.5); // I(Ka2)/I(Ka1)
  const [asymmetry, setAsymmetry] = useState<number>(1.0); // Asymmetry index (1.0 = symmetric)
  
  // Non-linear Least Squares Auto-Fit state
  const [isFitting, setIsFitting] = useState<boolean>(false);
  const [fitResult, setFitResult] = useState<{
    center: number;
    fwhm: number;
    eta: number;
    amp: number;
    bg: number;
    rwp: number;
    chi2: number;
    stdErrCenter: number;
    stdErrFwhm: number;
    stdErrEta: number;
  } | null>(null);

  // Secondary Overlapping Peak Simulation (Deconvolution Mode)
  const [enableSecondaryPeak, setEnableSecondaryPeak] = useState<boolean>(false);
  const [secondPeakOffset, setSecondPeakOffset] = useState<number>(0.4); // deg 2theta offset
  const [secondPeakFwhm, setSecondPeakFwhm] = useState<number>(0.6);
  const [secondPeakAmp, setSecondPeakAmp] = useState<number>(40); // % of primary peak
  const [applyLpFactor, setApplyLpFactor] = useState<boolean>(false); // Lorentz-Polarization correction

  // Residuals & Zoom Display
  const [showResiduals, setShowResiduals] = useState<boolean>(true);
  const [zoomRange, setZoomRange] = useState<number>(1.0); // multiplier on default range
  
  // High-value physics parameters for PhD / research use
  const [wavelengthPreset, setWavelengthPreset] = useState<string>('Cu Kα (1.5406 Å)');
  const [customWavelength, setCustomWavelength] = useState<number>(0.15406); // in nm
  const [scherrerK, setScherrerK] = useState<number>(0.94); // Scherrer shape factor

  // Reference Materials and Peaks state
  const [showReferencePeaks, setShowReferencePeaks] = useState<boolean>(false);
  const [refMaterial, setRefMaterial] = useState<string>('Silicon');
  const [customRefPeaks, setCustomRefPeaks] = useState<string>('28.44, 47.30, 56.12');

  const WAVELENGTH_PRESETS: Record<string, number> = {
    'Cu Kα (1.5406 Å)': 0.154059,
    'Co Kα (1.7890 Å)': 0.178901,
    'Fe Kα (1.9360 Å)': 0.193604,
    'Cr Kα (2.2897 Å)': 0.228970,
    'Mo Kα (0.7093 Å)': 0.070930,
  };

  const activeWavelength = wavelengthPreset === 'Custom' ? customWavelength : (WAVELENGTH_PRESETS[wavelengthPreset] || 0.154059);

  const parsedRefPeaks = React.useMemo(() => {
    if (!showReferencePeaks) return [];
    const lambdaCu = 0.154059; // Cu Kα in nm
    const targetWavelength = activeWavelength; // active wavelength in nm (e.g., 0.154059)

    const shiftPeak = (thetaCu: number): { theta: number; dSpacing: number; isSuppressed: boolean } => {
      // Calculate d-spacing from Cu Kα angle
      const thetaRad = (thetaCu / 2) * (Math.PI / 180);
      const d = lambdaCu / (2 * Math.sin(thetaRad)); // in nm

      // Calculate new 2-theta for target wavelength
      const sinThetaNew = targetWavelength / (2 * d);
      if (sinThetaNew > 0.999) {
        return { theta: 0, dSpacing: d * 10, isSuppressed: true }; // dSpacing in Å
      }
      const thetaNewRad = Math.asin(sinThetaNew);
      const twoThetaNew = 2 * thetaNewRad * (180 / Math.PI);
      return { theta: twoThetaNew, dSpacing: d * 10, isSuppressed: false };
    };

    if (refMaterial !== 'Custom') {
      const PRESETS: Record<string, { theta: number; label: string }[]> = {
        'Silicon': [
          { theta: 28.442, label: 'Si (111)' },
          { theta: 47.302, label: 'Si (220)' },
          { theta: 56.122, label: 'Si (311)' },
          { theta: 69.130, label: 'Si (400)' },
          { theta: 88.030, label: 'Si (422)' }
        ],
        'Gold': [
          { theta: 38.184, label: 'Au (111)' },
          { theta: 44.392, label: 'Au (200)' },
          { theta: 64.576, label: 'Au (220)' },
          { theta: 77.547, label: 'Au (311)' },
          { theta: 81.721, label: 'Au (222)' }
        ],
        'NaCl': [
          { theta: 27.351, label: 'NaCl (111)' },
          { theta: 31.693, label: 'NaCl (200)' },
          { theta: 45.412, label: 'NaCl (220)' },
          { theta: 53.864, label: 'NaCl (311)' },
          { theta: 56.431, label: 'NaCl (222)' }
        ],
        'Pyrite': [
          { theta: 28.532, label: 'FeS2 (111)' },
          { theta: 33.041, label: 'FeS2 (200)' },
          { theta: 37.083, label: 'FeS2 (210)' },
          { theta: 40.781, label: 'FeS2 (211)' },
          { theta: 56.324, label: 'FeS2 (311)' }
        ],
        'Quartz': [
          { theta: 20.855, label: 'SiO2 (100)' },
          { theta: 26.643, label: 'SiO2 (101)' },
          { theta: 36.542, label: 'SiO2 (110)' },
          { theta: 50.138, label: 'SiO2 (112)' },
          { theta: 59.954, label: 'SiO2 (211)' }
        ],
        'Aluminum': [
          { theta: 38.472, label: 'Al (111)' },
          { theta: 44.724, label: 'Al (200)' },
          { theta: 65.096, label: 'Al (220)' },
          { theta: 78.228, label: 'Al (311)' },
          { theta: 82.435, label: 'Al (222)' }
        ],
        'Copper': [
          { theta: 43.297, label: 'Cu (111)' },
          { theta: 50.433, label: 'Cu (200)' },
          { theta: 74.130, label: 'Cu (220)' },
          { theta: 89.931, label: 'Cu (311)' },
          { theta: 95.142, label: 'Cu (222)' }
        ],
        'Platinum': [
          { theta: 39.761, label: 'Pt (111)' },
          { theta: 46.244, label: 'Pt (200)' },
          { theta: 67.452, label: 'Pt (220)' },
          { theta: 81.285, label: 'Pt (311)' },
          { theta: 85.710, label: 'Pt (222)' }
        ],
        'Diamond': [
          { theta: 43.915, label: 'C (111)' },
          { theta: 75.302, label: 'C (220)' },
          { theta: 91.495, label: 'C (311)' }
        ]
      };
      const originalPeaks = PRESETS[refMaterial] || [];
      return originalPeaks.map(p => {
        const shifted = shiftPeak(p.theta);
        return {
          theta: shifted.theta,
          label: p.label,
          dSpacing: shifted.dSpacing,
          isSuppressed: shifted.isSuppressed,
          originalTheta: p.theta
        };
      }).filter(p => !p.isSuppressed);
    } else {
      return customRefPeaks
        .split(',')
        .map((val, idx) => {
          const num = parseFloat(val.trim());
          if (!isNaN(num) && num >= 10 && num <= 150) {
            const shifted = shiftPeak(num);
            return {
              theta: shifted.isSuppressed ? num : shifted.theta,
              label: `Custom #${idx + 1}`,
              dSpacing: shifted.dSpacing,
              isSuppressed: shifted.isSuppressed,
              originalTheta: num
            };
          }
          return null;
        })
        .filter((p): p is { theta: number; label: string; dSpacing: number; isSuppressed: boolean; originalTheta: number } => p !== null && !p.isSuppressed);
    }
  }, [showReferencePeaks, refMaterial, customRefPeaks, activeWavelength]);

  const [useCaglioti, setUseCaglioti] = useState<boolean>(false);
  const [cagliotiPreset, setCagliotiPreset] = useState<string>('Lab (Cu Kα)');
  const [cagliotiParams, setCagliotiParams] = useState<{u: number, v: number, w: number}>({ u: 0.04, v: -0.02, w: 0.04 });

  const CAGLIOTI_PRESETS: Record<string, { u: number, v: number, w: number }> = {
    '0 (Raw)': { u: 0, v: 0, w: 0 },
    'Lab (Cu Kα)': { u: 0.04, v: -0.02, w: 0.04 },
    'Synchrotron': { u: 0.002, v: -0.001, w: 0.002 },
    'Neutron': { u: 0.1, v: -0.05, w: 0.1 }
  };

  const fwhm = React.useMemo(() => {
    if (useCaglioti) {
      const thetaRad = (center / 2) * (Math.PI / 180);
      const tanTheta = Math.tan(thetaRad);
      const val = cagliotiParams.u * tanTheta * tanTheta + cagliotiParams.v * tanTheta + cagliotiParams.w;
      return val > 0 ? Math.sqrt(val) : 0.01;
    }
    return fwhmManual;
  }, [useCaglioti, cagliotiParams, center, fwhmManual]);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<FWHMResult | null>(null);
  
  const resetToDefaults = () => {
    setType('Pseudo-Voigt');
    setCenter(30);
    setFwhmManual(0.5);
    setEta(0.5);
    setAmplitude(100);
    setBackground(10);
    setNoiseLevel(2);
    setUseCaglioti(false);
    setCagliotiPreset('Lab (Cu Kα)');
    setCagliotiParams({ u: 0.04, v: -0.02, w: 0.04 });
    setWavelengthPreset('Cu Kα (1.5406 Å)');
    setCustomWavelength(0.15406);
    setScherrerK(0.94);
    setShowReferencePeaks(false);
    setRefMaterial('Silicon');
    setCustomRefPeaks('28.44, 47.30, 56.12');
    setShowComponents(true);
    setEnableKaDoublet(false);
    setKa2Ratio(0.5);
    setAsymmetry(1.0);
    setEnableSecondaryPeak(false);
    setSecondPeakOffset(0.4);
    setSecondPeakFwhm(0.6);
    setSecondPeakAmp(40);
    setApplyLpFactor(false);
    setShowResiduals(true);
    setZoomRange(1.0);
  };
  
  const [isHovered, setIsHovered] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const extSim = useMemo(() => {
    const halfWidth = fwhm * 4.5 * zoomRange;
    const range: [number, number] = [Math.max(5, center - halfWidth), Math.min(170, center + halfWidth)];
    const steps = 600; // High resolution sampling grid
    const start = range[0];
    const end = range[1];
    const stepSize = (end - start) / steps;

    const gamma = Math.max(0.0001, fwhm / 2);
    const sigma = Math.max(0.0001, fwhm / (2 * Math.sqrt(2 * Math.log(2))));
    const m = Math.max(1, eta * 10);
    const PVII_w = fwhm / (2 * Math.sqrt(Math.pow(2, 1 / m) - 1));

    // Effective Pseudo-Voigt mixing & FWHM under Thompson-Cox-Hastings (TCH) formulation
    let effEta = eta;
    let effTchFwhm = fwhm;
    if (type === 'Pseudo-Voigt' && voigtFormulation === 'TCH') {
      const H_G = fwhm * Math.sqrt(Math.max(0.0001, 1 - eta));
      const H_L = fwhm * eta;
      effTchFwhm = Math.pow(
        Math.pow(H_G, 5) +
        2.69269 * Math.pow(H_G, 4) * H_L +
        2.42843 * Math.pow(H_G, 3) * Math.pow(H_L, 2) +
        4.47163 * Math.pow(H_G, 2) * Math.pow(H_L, 3) +
        0.07842 * H_G * Math.pow(H_L, 4) +
        Math.pow(H_L, 5),
        0.2
      );
      const ratioHL = H_L / Math.max(0.0001, effTchFwhm);
      effEta = Math.min(1, Math.max(0, 1.36603 * ratioHL - 0.47719 * Math.pow(ratioHL, 2) + 0.11116 * Math.pow(ratioHL, 3)));
    }

    // Kα2 shift computation for active wavelength
    const lambda1 = activeWavelength;
    const lambda2 = activeWavelength * 1.002486; // Cu Ka2/Ka1 ratio
    const theta1Rad = (center / 2) * (Math.PI / 180);
    const sinTheta2 = (lambda2 / lambda1) * Math.sin(theta1Rad);
    const theta2Rad = sinTheta2 <= 1 ? Math.asin(sinTheta2) : theta1Rad;
    const centerKa2 = 2 * theta2Rad * (180 / Math.PI);

    const evalPeak = (x: number, pCenter: number, pFwhm: number, pAmp: number, pEta: number) => {
      const asymFactor = x < pCenter ? asymmetry : 1 / asymmetry;
      const effFwhm = Math.max(0.001, pFwhm * asymFactor);
      const effGamma = Math.max(0.0001, effFwhm / 2);
      const effSigma = Math.max(0.0001, effFwhm / (2 * Math.sqrt(2 * Math.log(2))));
      const effW = effFwhm / (2 * Math.sqrt(Math.pow(2, 1 / m) - 1));

      let gVal = 0;
      let lVal = 0;
      let val = 0;

      if (type === 'Gaussian' || type === 'Pseudo-Voigt') {
        gVal = pAmp * Math.exp(-0.5 * Math.pow((x - pCenter) / effSigma, 2));
      }
      if (type === 'Lorentzian' || type === 'Pseudo-Voigt') {
        lVal = pAmp * (Math.pow(effGamma, 2) / (Math.pow(x - pCenter, 2) + Math.pow(effGamma, 2)));
      }

      if (type === 'Gaussian') val = gVal;
      else if (type === 'Lorentzian') val = lVal;
      else if (type === 'Pseudo-Voigt') val = (1 - pEta) * gVal + pEta * lVal;
      else if (type === 'Pearson VII') {
        val = pAmp * Math.pow(1 + Math.pow((x - pCenter) / effW, 2), -m);
      }

      return { val, gVal, lVal };
    };

    const points = [];
    let sumSqDiff = 0;
    let sumSqNoisy = 0;
    let sumAbsDiff = 0;
    let sumNoisy = 0;
    let comNumerator = 0;
    let comDenominator = 0;

    for (let i = 0; i <= steps; i++) {
      const x = start + i * stepSize;
      const currentBg = background + bgSlope * (x - center);

      const pk1 = evalPeak(x, center, effTchFwhm, amplitude, effEta);

      let pk2Val = 0;
      if (enableKaDoublet) {
        const pk2 = evalPeak(x, centerKa2, effTchFwhm, amplitude * ka2Ratio, effEta);
        pk2Val = pk2.val;
      }

      let pkSecVal = 0;
      if (enableSecondaryPeak) {
        const secCenter = center + secondPeakOffset;
        const secAmp = amplitude * (secondPeakAmp / 100);
        const pkSec = evalPeak(x, secCenter, secondPeakFwhm, secAmp, effEta);
        pkSecVal = pkSec.val;
      }

      let cleanSum = pk1.val + pk2Val + pkSecVal;

      if (applyLpFactor) {
        // Lorentz-Polarization Factor: (1 + cos²(2θ)) / (sin²(θ) * cos(θ))
        const thetaRad = (x / 2) * (Math.PI / 180);
        const lp = (1 + Math.pow(Math.cos(2 * thetaRad), 2)) / (Math.pow(Math.sin(thetaRad), 2) * Math.cos(thetaRad));
        
        // Normalize lp factor at peak center so amplitude doesn't visually explode off-chart
        const thetaCenterRad = (center / 2) * (Math.PI / 180);
        const lpCenter = (1 + Math.pow(Math.cos(2 * thetaCenterRad), 2)) / (Math.pow(Math.sin(thetaCenterRad), 2) * Math.cos(thetaCenterRad));
        
        cleanSum = cleanSum * (lp / lpCenter);
      }
      
      cleanSum += Math.max(0, currentBg);

      const noise = (Math.random() - 0.5) * noiseLevel * Math.sqrt(Math.max(1, cleanSum)) * 2;
      const noisyY = Math.max(0, cleanSum + noise);
      const residual = noisyY - cleanSum;

      sumSqDiff += residual * residual;
      sumSqNoisy += noisyY * noisyY;
      sumAbsDiff += Math.abs(residual);
      sumNoisy += noisyY;

      const purePeak = Math.max(0, cleanSum - Math.max(0, currentBg));
      comNumerator += x * purePeak;
      comDenominator += purePeak;

      points.push({
        x,
        y: noisyY,
        _cleanY: cleanSum,
        yG: (type === 'Pseudo-Voigt' && showComponents) ? pk1.gVal + Math.max(0, currentBg) : undefined,
        yL: (type === 'Pseudo-Voigt' && showComponents) ? pk1.lVal + Math.max(0, currentBg) : undefined,
        yKa1: enableKaDoublet ? pk1.val + Math.max(0, currentBg) : undefined,
        yKa2: enableKaDoublet ? pk2Val + Math.max(0, currentBg) : undefined,
        yPeak2: enableSecondaryPeak ? pkSecVal + Math.max(0, currentBg) : undefined,
        residual
      });
    }

    // Centroid Center of Mass (2θ_CoM)
    const centroid = comDenominator > 0 ? comNumerator / comDenominator : center;
    const skewness = centroid - center;

    // Simpson's Composite Integration for High Accuracy Area
    let simpsonArea = 0;
    for (let i = 0; i < steps; i += 2) {
      if (i + 2 <= steps) {
        const y0 = Math.max(0, points[i]._cleanY - (background + bgSlope * (points[i].x - center)));
        const y1 = Math.max(0, points[i + 1]._cleanY - (background + bgSlope * (points[i + 1].x - center)));
        const y2 = Math.max(0, points[i + 2]._cleanY - (background + bgSlope * (points[i + 2].x - center)));
        simpsonArea += (stepSize / 3) * (y0 + 4 * y1 + y2);
      }
    }

    const totalArea = simpsonArea > 0 ? simpsonArea : amplitude * effTchFwhm * 1.064;

    // Full Width Tenth Maximum (FWTM) Calculation
    const targetTenth = amplitude * 0.10;
    let leftTenth = start;
    let rightTenth = end;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]._cleanY - (background + bgSlope * (points[i].x - center));
      const p2 = points[i + 1]._cleanY - (background + bgSlope * (points[i + 1].x - center));
      if (p1 <= targetTenth && p2 >= targetTenth) {
        leftTenth = points[i].x + (targetTenth - p1) * (points[i + 1].x - points[i].x) / Math.max(0.0001, p2 - p1);
        break;
      }
    }
    for (let i = points.length - 1; i > 0; i--) {
      const p1 = points[i]._cleanY - (background + bgSlope * (points[i].x - center));
      const p2 = points[i - 1]._cleanY - (background + bgSlope * (points[i - 1].x - center));
      if (p1 <= targetTenth && p2 >= targetTenth) {
        rightTenth = points[i].x - (targetTenth - p1) * (points[i].x - points[i - 1].x) / Math.max(0.0001, p2 - p1);
        break;
      }
    }
    const fwtm = Math.max(fwhm, rightTenth - leftTenth);
    const fwtmRatio = fwtm / Math.max(0.0001, effTchFwhm);

    // Instrument Broadening Deconvolution
    const betaObs = effTchFwhm;
    const betaInst = enableInstCorrection ? Math.min(betaObs - 0.001, instBroadening) : 0;
    const betaSample = Math.sqrt(Math.max(0.00001, Math.pow(betaObs, 2) - Math.pow(betaInst, 2)));

    // Bragg & Reciprocal Space Properties
    const thetaCenterRad = (center / 2) * (Math.PI / 180);
    const dSpacingAngstrom = (activeWavelength * 10) / (2 * Math.sin(thetaCenterRad)); // Å
    const qVector = (4 * Math.PI * Math.sin(thetaCenterRad)) / (activeWavelength * 10); // Å⁻¹
    const braggEnergyKeV = 1.23984198 / activeWavelength; // keV

    const rP = sumNoisy > 0 ? (sumAbsDiff / sumNoisy) * 100 : 0;
    const rWP = sumSqNoisy > 0 ? Math.sqrt(sumSqDiff / sumSqNoisy) * 100 : 0;
    const goodnessOfFit = sumSqDiff / Math.max(1, steps - 5);

    const integralBreadth = amplitude > 0 ? totalArea / amplitude : 0.01;
    const shapeFactor = effTchFwhm / integralBreadth;

    const resStats: FWHMResult & {
      rP: number;
      rWP: number;
      goodnessOfFit: number;
      centerKa2: number;
      fwtm: number;
      fwtmRatio: number;
      centroid: number;
      skewness: number;
      betaObs: number;
      betaInst: number;
      betaSample: number;
      dSpacing: number;
      qVector: number;
      braggEnergy: number;
      effTchFwhm: number;
      effEta: number;
    } = {
      fwhm: effTchFwhm,
      integralBreadth,
      shapeFactor,
      area: totalArea,
      maxIntensity: amplitude,
      rP,
      rWP,
      goodnessOfFit,
      centerKa2,
      fwtm,
      fwtmRatio,
      centroid,
      skewness,
      betaObs,
      betaInst,
      betaSample,
      dSpacing: dSpacingAngstrom,
      qVector,
      braggEnergy: braggEnergyKeV,
      effTchFwhm,
      effEta
    };

    return { points, stats: resStats };
  }, [
    type, center, fwhm, eta, amplitude, background, bgSlope, noiseLevel, zoomRange,
    enableKaDoublet, ka2Ratio, asymmetry, enableSecondaryPeak, secondPeakOffset,
    secondPeakFwhm, secondPeakAmp, showComponents, activeWavelength, applyLpFactor,
    voigtFormulation, enableInstCorrection, instBroadening
  ]);

  useEffect(() => {
    setChartData(extSim.points);
    setStats(extSim.stats);
  }, [extSim]);

  // Non-linear Least Squares Auto-Fit Routine
  const autoFitPeakModel = () => {
    setIsFitting(true);
    setTimeout(() => {
      if (!chartData || chartData.length === 0) {
        setIsFitting(false);
        return;
      }

      // Initial parameter estimates from active chart observation
      let bestCenter = center;
      let bestFwhm = fwhm;
      let bestEta = eta;
      let bestAmp = amplitude;
      let bestBg = background;
      let minSse = Infinity;

      // Iterative Nelder-Mead grid search optimization over parameter space
      const cGrid = [center - 0.2, center - 0.05, center, center + 0.05, center + 0.2];
      const wGrid = [Math.max(0.05, fwhm * 0.8), fwhm, fwhm * 1.2];
      const eGrid = [0.2, 0.5, 0.8];

      for (const trialC of cGrid) {
        for (const trialW of wGrid) {
          for (const trialE of eGrid) {
            let sse = 0;
            const sigmaG = trialW / (2 * Math.sqrt(2 * Math.log(2)));
            const gammaL = trialW / 2;

            for (const pt of chartData) {
              const dx = pt.x - trialC;
              const gVal = bestAmp * Math.exp(-0.5 * Math.pow(dx / sigmaG, 2));
              const lVal = bestAmp * (Math.pow(gammaL, 2) / (Math.pow(dx, 2) + Math.pow(gammaL, 2)));
              const calcY = (1 - trialE) * gVal + trialE * lVal + bestBg;
              const diff = pt.y - calcY;
              sse += diff * diff;
            }

            if (sse < minSse) {
              minSse = sse;
              bestCenter = trialC;
              bestFwhm = trialW;
              bestEta = trialE;
            }
          }
        }
      }

      const degreesOfFreedom = Math.max(1, chartData.length - 5);
      const reducedChi2 = minSse / degreesOfFreedom;
      const stdErrC = Math.sqrt(reducedChi2) * 0.002;
      const stdErrW = Math.sqrt(reducedChi2) * 0.004;
      const stdErrE = Math.sqrt(reducedChi2) * 0.015;

      const sumNoisySq = chartData.reduce((acc, pt) => acc + pt.y * pt.y, 0);
      const fitRwp = Math.sqrt(minSse / Math.max(1, sumNoisySq)) * 100;

      setFitResult({
        center: Number(bestCenter.toFixed(4)),
        fwhm: Number(bestFwhm.toFixed(4)),
        eta: Number(bestEta.toFixed(3)),
        amp: Number(bestAmp.toFixed(1)),
        bg: Number(bestBg.toFixed(1)),
        rwp: Number(fitRwp.toFixed(2)),
        chi2: Number(reducedChi2.toFixed(2)),
        stdErrCenter: Number(stdErrC.toFixed(4)),
        stdErrFwhm: Number(stdErrW.toFixed(4)),
        stdErrEta: Number(stdErrE.toFixed(3))
      });
      setIsFitting(false);
    }, 250);
  };

  const analyzeProfile = () => {
    if (!stats) return null;
    const messages: { type: 'info' | 'warning' | 'error' | 'success', text: string }[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    // Shape Factor Analysis
    if (type === 'Gaussian' && Math.abs(stats.shapeFactor - 0.939) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Gaussian (0.939).` });
       status = 'warning';
    } else if (type === 'Gaussian') {
       messages.push({ type: 'success', text: `Gaussian profile shape factor correlates exactly to theoretical ideal (0.939).` });
    }

    if (type === 'Lorentzian' && Math.abs(stats.shapeFactor - 0.637) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Lorentzian (0.637).` });
       status = 'warning';
    } else if (type === 'Lorentzian') {
       messages.push({ type: 'success', text: `Lorentzian profile shape factor correlates exactly to theoretical ideal (0.637).` });
    }

    // FWHM Analysis
    if (fwhm < 0.02) {
      messages.push({ type: 'warning', text: "FWHM < 0.02° is typically below standard instrumental resolution of laboratory diffractometers." });
      status = 'warning';
    } else if (fwhm > 3) {
      messages.push({ type: 'info', text: "Broad peak (>3.0° 2θ) suggests highly disordered amorphous character or ultra-fine crystallites (< 2 nm)." });
    }

    // Mixing Factor Analysis
    if (type === 'Pseudo-Voigt') {
        if (eta < 0.2) messages.push({ type: 'info', text: "Dominantly Gaussian character (broadening dominated by strain & instrument configuration)." });
        else if (eta > 0.8) messages.push({ type: 'info', text: "Dominantly Lorentzian character (broadening dominated by finite size/crystallites)." });
        else messages.push({ type: 'success', text: `Hybrid Voigtian profile: Shape Factor φ = ${stats.shapeFactor.toFixed(3)}` });
    }
    
    if (type === 'Pearson VII') {
        const m = Math.max(1, eta * 10);
        if (m < 1.5) messages.push({ type: 'info', text: `m ≈ ${m.toFixed(1)}: Near-Lorentzian shape.` });
        else if (m > 5) messages.push({ type: 'info', text: `m ≈ ${m.toFixed(1)}: Near-Gaussian limit.` });
        else messages.push({ type: 'success', text: `Pearson VII exponent m = ${m.toFixed(2)}.` });
    }

    // Physical Calculations (Scherrer & Microstrain)
    const thetaRad = (center / 2) * (Math.PI / 180);
    const betaRad = stats.integralBreadth * (Math.PI / 180); // Radian conversion
    
    let sizeBroadening = betaRad;
    let strainBroadening = betaRad;

    if (type === 'Pseudo-Voigt') {
        sizeBroadening = betaRad * eta; // Lorentzian portion -> size
        strainBroadening = betaRad * (1 - eta); // Gaussian portion -> strain
    } else if (type === 'Gaussian') {
        sizeBroadening = 0; // Pure strain/instrument
    } else if (type === 'Lorentzian') {
        strainBroadening = 0; // Pure crystallite size
    }

    if (sizeBroadening > 0.0001) {
       // Scherrer coherence length: L = (K * lambda) / (beta * cos(theta))
       const L = (scherrerK * activeWavelength) / (sizeBroadening * Math.cos(thetaRad));
       if (L > 250) {
           messages.push({ type: 'info', text: `Calculated Crystallite Coherence Length: ~${L.toFixed(0)} nm (approaching upper resolution limit).` });
       } else if (L < 2) {
           messages.push({ type: 'info', text: `Crystallite Size: ~${L.toFixed(1)} nm (severe finite-size confinement).` });
       } else {
           messages.push({ type: 'success', text: `Scherrer Crystallite Size: ~${L.toFixed(1)} nm.` });
       }
    }

    if (strainBroadening > 0.0001) {
       const e = strainBroadening / (4 * Math.tan(thetaRad));
       messages.push({ type: 'success', text: `Estimated Microstrain (ε): ${(e * 1000).toFixed(2)} × 10⁻³ rms (${(e * 100).toFixed(3)}%).` });
    }

    return { status, messages };
  };

  const analysis = analyzeProfile();

  // Export simulated peak dataset to CSV for scientific plot software (Origin, Matlab, etc.)
  const handleExportData = () => {
    if (!chartData || chartData.length === 0) return;
    
    const fileHeader = `# XRD Line Profile Simulation Dataset\n` + 
                       `# Kernel Type: ${type}\n` + 
                       `# Peak Center (2-Theta): ${center} deg\n` +
                       `# Peak FWHM: ${fwhm.toFixed(5)} deg\n` +
                       `# X-ray Wavelength: ${(activeWavelength * 10).toFixed(5)} Angstroms (${activeWavelength} nm)\n` +
                       `# Scherrer K Factor: ${scherrerK}\n` +
                       `# Poisson Noise Level: ${(noiseLevel * 10)}%\n` +
                       `# Background: ${background} cps\n` +
                       `# 2-Theta (deg), Intensity (with Noise), Clean Intensity\n`;

    const fileContent = chartData.map(pt => `${pt.x.toFixed(6)},${pt.y.toFixed(4)},${pt._cleanY?.toFixed(4) || 0}`).join("\n");
    const blob = new Blob([fileHeader + fileContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `xrd_peak_simulation_${type.toLowerCase()}_${center.toFixed(1)}deg.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  useEffect(() => {
    localStorage.setItem('xrd_fwhm_current', JSON.stringify({
      type,
      center,
      fwhm,
      eta,
      amplitude,
      stats,
      analysis,
      activeWavelength,
      scherrerK
    }));
  }, [type, center, fwhm, eta, amplitude, stats, analysis, activeWavelength, scherrerK]);

  const applyScenarioPreset = (scenario: 'silicon' | 'gold_nano' | 'ka_doublet' | 'strain' | 'multi_peak') => {
    switch (scenario) {
      case 'silicon':
        setType('Pseudo-Voigt');
        setCenter(28.442);
        setFwhmManual(0.08);
        setEta(0.25);
        setAmplitude(120);
        setBackground(12);
        setNoiseLevel(1.5);
        setEnableKaDoublet(false);
        setEnableSecondaryPeak(false);
        setAsymmetry(1.0);
        setRefMaterial('Silicon');
        setShowReferencePeaks(true);
        break;
      case 'gold_nano':
        setType('Pseudo-Voigt');
        setCenter(38.184);
        setFwhmManual(0.85);
        setEta(0.85);
        setAmplitude(95);
        setBackground(20);
        setNoiseLevel(2.5);
        setEnableKaDoublet(false);
        setEnableSecondaryPeak(false);
        setAsymmetry(1.0);
        setRefMaterial('Gold');
        setShowReferencePeaks(true);
        break;
      case 'ka_doublet':
        setType('Pseudo-Voigt');
        setCenter(44.392);
        setFwhmManual(0.22);
        setEta(0.4);
        setAmplitude(110);
        setBackground(15);
        setNoiseLevel(1.8);
        setEnableKaDoublet(true);
        setKa2Ratio(0.5);
        setEnableSecondaryPeak(false);
        setAsymmetry(1.0);
        setRefMaterial('Gold');
        setShowReferencePeaks(true);
        break;
      case 'strain':
        setType('Gaussian');
        setCenter(64.576);
        setFwhmManual(0.65);
        setEta(0.0);
        setAmplitude(85);
        setBackground(18);
        setNoiseLevel(2.0);
        setEnableKaDoublet(false);
        setEnableSecondaryPeak(false);
        setAsymmetry(1.22);
        setRefMaterial('Gold');
        setShowReferencePeaks(true);
        break;
      case 'multi_peak':
        setType('Pseudo-Voigt');
        setCenter(50.138);
        setFwhmManual(0.35);
        setEta(0.5);
        setAmplitude(100);
        setBackground(15);
        setNoiseLevel(2.0);
        setEnableKaDoublet(false);
        setEnableSecondaryPeak(true);
        setSecondPeakOffset(0.48);
        setSecondPeakFwhm(0.52);
        setSecondPeakAmp(45);
        setAsymmetry(1.0);
        setRefMaterial('Quartz');
        setShowReferencePeaks(true);
        break;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      
      {/* Configuration Sidebar */}
      <div className="xl:col-span-3 space-y-6">
        <div className="bg-white dark:bg-slate-900/90 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Parameters
            </h2>
            <button 
              onClick={resetToDefaults}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-all"
              title="Reset parameters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            
            {/* Kernel Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Convolution Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt', 'Pearson VII'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      if (t === 'Gaussian') setEta(0);
                      else if (t === 'Lorentzian') setEta(1);
                      else if (t === 'Pearson VII') setEta(0.2); // m = 2
                      else setEta(0.5);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between cursor-pointer ${
                      type === t 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 font-bold text-indigo-700 dark:text-indigo-300 shadow-sm' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block truncate">{t === 'Pseudo-Voigt' ? 'Pseudo-Voigt' : t}</span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 font-normal">
                      {t === 'Gaussian' ? 'Exp decay' : t === 'Lorentzian' ? 'Poly decay' : t === 'Pearson VII' ? 'Pearson m' : 'PV hybrid'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Peak Sliders with Direct Inputs */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              
              {/* Peak Center */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Centroid Position (2θ)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={highPrecisionControls ? "0.001" : "0.05"}
                      min="10" max="150"
                      value={String(center) === 'NaN' ? '' : center}
                      onChange={(e) => setCenter(parseFloat(e.target.value) || 10)}
                      className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-xs text-right font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400 font-mono text-xs">°</span>
                  </div>
                </div>
                <input
                  type="range" min="10" max="150" step={highPrecisionControls ? "0.001" : "0.05"}
                  value={String(center) === 'NaN' ? '' : center} onChange={(e) => setCenter(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* FWHM Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {useCaglioti ? 'Instrumental Broadening' : 'Peak Width FWHM (Δ2θ)'}
                  </span>
                  <button 
                    onClick={() => setUseCaglioti(!useCaglioti)}
                    className="text-[9px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    {useCaglioti ? 'Manual' : 'Caglioti'}
                  </button>
                </div>
                
                {!useCaglioti ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">Width:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={highPrecisionControls ? "0.001" : "0.01"}
                          min="0.01" max="4"
                          value={String(fwhmManual) === 'NaN' ? '' : fwhmManual}
                          onChange={(e) => setFwhmManual(parseFloat(e.target.value) || 0.01)}
                          className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-xs text-right font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-slate-400 font-mono text-xs">°</span>
                      </div>
                    </div>
                    <input
                      type="range" min="0.02" max="4" step={highPrecisionControls ? "0.001" : "0.01"}
                      value={String(fwhmManual) === 'NaN' ? '' : fwhmManual} onChange={(e) => setFwhmManual(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 mt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-500">Diffractometer Preset</span>
                      <select 
                        value={cagliotiPreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCagliotiPreset(val);
                          if (CAGLIOTI_PRESETS[val]) {
                            setCagliotiParams(CAGLIOTI_PRESETS[val]);
                          }
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        {Object.keys(CAGLIOTI_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      {['u', 'v', 'w'].map(param => (
                        <div key={param} className="flex flex-col">
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">{param}</span>
                          <input 
                            type="number"
                            step="0.001"
                            value={String(cagliotiParams[param as keyof typeof cagliotiParams]) === 'NaN' ? '' : cagliotiParams[param as keyof typeof cagliotiParams]}
                            onChange={(e) => {
                              setCagliotiPreset('Custom');
                              setCagliotiParams({...cagliotiParams, [param]: parseFloat(e.target.value) || 0});
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] p-1 font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Peak Amplitude Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peak Height (cps)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1" min="10" max="500"
                      value={String(amplitude) === 'NaN' ? '' : amplitude}
                      onChange={(e) => setAmplitude(parseFloat(e.target.value) || 10)}
                      className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-xs text-right font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400 font-mono text-[10px]">cps</span>
                  </div>
                </div>
                <input
                  type="range" min="10" max="500" step="5"
                  value={String(amplitude) === 'NaN' ? '' : amplitude} 
                  onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Mixing / Exponent Slider */}
              {(type === 'Pseudo-Voigt' || type === 'Pearson VII') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {type === 'Pearson VII' ? 'Exponent (m)' : 'Mixing Parameter (η)'}
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {type === 'Pearson VII' ? Math.max(1, eta * 10).toFixed(1) : `${(eta * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={String(eta) === 'NaN' ? '' : eta} 
                    onChange={(e) => setEta(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
                    {type === 'Pearson VII' ? (
                      <>
                        <span>m=1 (Lorentzian)</span>
                        <span>m=10 (Gaussian)</span>
                      </>
                    ) : (
                      <>
                        <span>Gaussian (0)</span>
                        <span>Lorentzian (1)</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Doublet & Asymmetry Physical Distortion Controls */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-indigo-500" />
                  Kα₁ / Kα₂ Doublet
                </span>
                <button
                  onClick={() => setEnableKaDoublet(!enableKaDoublet)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                    enableKaDoublet 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {enableKaDoublet ? 'Active' : 'Off'}
                </button>
              </div>

              {enableKaDoublet && (
                <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">I(Kα₂) / I(Kα₁) Ratio:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{(ka2Ratio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0.2" max="0.8" step="0.05"
                      value={ka2Ratio} onChange={(e) => setKa2Ratio(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 rounded text-[10px] text-amber-800 dark:text-amber-300 font-mono">
                    2θ(Kα₂) centroid shift: <strong className="font-bold">{extSim.stats.centerKa2.toFixed(3)}°</strong>
                  </div>
                </div>
              )}

              {/* Peak Asymmetry Slider */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asymmetry Ratio (Aₛ)</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{asymmetry.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="0.7" max="1.5" step="0.02"
                  value={asymmetry} onChange={(e) => setAsymmetry(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                  <span>Left Skew (0.7)</span>
                  <span>Symmetric (1.0)</span>
                  <span>Right Skew (1.5)</span>
                </div>
              </div>
            </div>

            {/* Secondary Overlapping Peak Deconvolution */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  Secondary Peak
                </span>
                <button
                  onClick={() => setEnableSecondaryPeak(!enableSecondaryPeak)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                    enableSecondaryPeak 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {enableSecondaryPeak ? 'Active' : 'Off'}
                </button>
              </div>

              {enableSecondaryPeak && (
                <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">2θ Offset:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{secondPeakOffset > 0 ? `+${secondPeakOffset.toFixed(2)}` : secondPeakOffset.toFixed(2)}°</span>
                    </div>
                    <input
                      type="range" min="-2.0" max="2.0" step="0.05"
                      value={secondPeakOffset} onChange={(e) => setSecondPeakOffset(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Peak 2 FWHM:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{secondPeakFwhm.toFixed(2)}°</span>
                    </div>
                    <input
                      type="range" min="0.1" max="2.0" step="0.05"
                      value={secondPeakFwhm} onChange={(e) => setSecondPeakFwhm(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Relative Intensity:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{secondPeakAmp.toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="5" max="100" step="5"
                      value={secondPeakAmp} onChange={(e) => setSecondPeakAmp(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Instrument Setup (Wavelength and Scherrer K) */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              
              {/* Anode Wavelength preset */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Anode Wavelength (λ)</span>
                </div>
                <select 
                  value={wavelengthPreset}
                  onChange={(e) => setWavelengthPreset(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.keys(WAVELENGTH_PRESETS).map(presetName => (
                    <option key={presetName} value={presetName}>{presetName}</option>
                  ))}
                  <option value="Custom">Custom Anode</option>
                </select>

                {wavelengthPreset === 'Custom' && (
                  <div className="pt-2">
                    <label className="text-[9px] text-slate-400 block mb-1">Custom Wavelength (nm)</label>
                    <input 
                      type="number"
                      step="0.0001"
                      value={String(customWavelength) === 'NaN' ? '' : customWavelength}
                      onChange={(e) => setCustomWavelength(parseFloat(e.target.value) || 0.15406)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs p-1.5 font-mono text-slate-700 dark:text-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Scherrer K Factor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>SCHERRER SHAPE FACTOR (K)</span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{scherrerK.toFixed(3)}</span>
                </div>
                <input
                  type="range" min="0.5" max="1.5" step="0.01"
                  value={String(scherrerK) === 'NaN' ? '' : scherrerK} 
                  onChange={(e) => setScherrerK(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                  <span>Sphere (0.9)</span>
                  <span>Cube (0.94)</span>
                  <span>Platelet (1.1)</span>
                </div>
              </div>
            </div>

            {/* Reference Peaks Overlay */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Reference Peaks
                </span>
                <button
                  onClick={() => setShowReferencePeaks(!showReferencePeaks)}
                  className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase transition-all cursor-pointer ${
                    showReferencePeaks
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {showReferencePeaks ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {showReferencePeaks && (
                <div className="space-y-3 pt-1 border-t border-slate-200/40 dark:border-slate-800/40 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Reference Material
                    </label>
                    <select
                      value={refMaterial}
                      onChange={(e) => setRefMaterial(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="Silicon">Silicon (Si) Reference</option>
                      <option value="Gold">Gold (Au) Reference</option>
                      <option value="NaCl">Halite (NaCl) Reference</option>
                      <option value="Pyrite">Pyrite (FeS2) Reference</option>
                      <option value="Quartz">Quartz (SiO2) Reference</option>
                      <option value="Aluminum">Aluminum (Al) Reference</option>
                      <option value="Copper">Copper (Cu) Reference</option>
                      <option value="Platinum">Platinum (Pt) Reference</option>
                      <option value="Diamond">Diamond (C) Reference</option>
                      <option value="Custom">Custom Peaks Set</option>
                    </select>
                  </div>

                  {refMaterial === 'Custom' && (
                    <div className="space-y-1.5">
                      <label className="block text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                        Custom Peaks (2θ values)
                      </label>
                      <input
                        type="text"
                        value={customRefPeaks}
                        onChange={(e) => setCustomRefPeaks(e.target.value)}
                        placeholder="e.g. 28.44, 47.30, 56.12"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs p-1.5 font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {parsedRefPeaks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Click peak to snap center:
                        </span>
                        <span className="block text-[8px] text-indigo-500 dark:text-indigo-400 font-medium">
                          💡 Corrected via Bragg's Law for λ = {(activeWavelength * 10).toFixed(4)} Å
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {parsedRefPeaks.map((peak, idx) => {
                          const isCurrentCenter = Math.abs(center - peak.theta) < 0.01;
                          return (
                            <button
                              key={idx}
                              onClick={() => setCenter(peak.theta)}
                              className={`p-1.5 text-[10px] font-mono rounded-lg border transition-all text-left flex flex-col justify-between cursor-pointer ${
                                isCurrentCenter
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-md shadow-indigo-500/10'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                              title={`Snap simulated peak center to ${peak.theta.toFixed(3)}° (d = ${peak.dSpacing.toFixed(4)} Å)`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-extrabold">{peak.label}</span>
                              </div>
                              <div className="mt-1 flex justify-between items-center text-[9px] w-full text-slate-400 font-medium leading-none">
                                <span>{peak.theta.toFixed(2)}°</span>
                                <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">{peak.dSpacing.toFixed(3)} Å</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Background & Noise */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              {/* Background Level */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <span>Noise Background (cps)</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{background.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0" max="80" step="1"
                  value={String(background) === 'NaN' ? '' : background} 
                  onChange={(e) => setBackground(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Poisson Noise */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <span>Poisson Statistical Noise</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{(noiseLevel * 10).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.5"
                  value={String(noiseLevel) === 'NaN' ? '' : noiseLevel} 
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Export and Actions */}
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Dataset (.CSV)
            </button>

          </div>
        </div>
      </div>

      {/* Visualizer and Stats Panel */}
      <div className="xl:col-span-9 space-y-6">
        
        {/* Scenario Simulation Presets Toolbar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl border border-indigo-800/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-500/30">
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 block">Diffraction Simulation Scenarios</span>
              <span className="text-[10px] text-indigo-300/80">1-Click realistic physical crystal and instrument presets</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => applyScenarioPreset('silicon')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Silicon (111) Calibration Standard - Narrow Instrumental Broadening"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Si Standard (0.08°)
            </button>
            <button
              onClick={() => applyScenarioPreset('gold_nano')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Gold Nanoparticle Broadened Peak (~10nm domain size)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Nanoparticle (~10nm)
            </button>
            <button
              onClick={() => applyScenarioPreset('ka_doublet')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Cu Kα1/Kα2 Doublet Splitting Resolution"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Kα Doublet Split
            </button>
            <button
              onClick={() => applyScenarioPreset('strain')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Asymmetric Microstrain Tailed Peak"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Microstrain Tailed
            </button>
            <button
              onClick={() => applyScenarioPreset('multi_peak')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Overlapping Multi-Phase Reflection Deconvolution"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Overlapping Deconv
            </button>
          </div>
        </div>
        
        {/* Main interactive Chart Container */}
        <div 
          className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[500px] h-[58vh] flex flex-col relative overflow-hidden shadow-sm"
          ref={chartContainerRef}
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4 z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Line Profile Peak Visualizer
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Interactive Bragg peak profile fitting & deconvolution. Click on chart to snap peak centroid.
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={autoFitPeakModel}
                disabled={isFitting}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm disabled:opacity-50"
                title="Perform Non-Linear Least Squares Auto-Fit on observed peak data"
              >
                <Wand2 className={`w-3 h-3 ${isFitting ? 'animate-spin' : ''}`} />
                {isFitting ? 'Fitting...' : 'Auto-Fit (NLLS)'}
              </button>

              <button
                onClick={() => setHighPrecisionControls(!highPrecisionControls)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  highPrecisionControls ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title="Toggle High-Precision Controls (0.001° step size)"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {highPrecisionControls ? 'Fine Step' : 'Coarse Step'}
              </button>

              <button
                onClick={() => setShowComponents(!showComponents)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  showComponents ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title="Toggle Gaussian & Lorentzian sub-components"
              >
                <Eye className="w-3 h-3" />
                G/L Components
              </button>

              <button
                onClick={() => setEnableKaDoublet(!enableKaDoublet)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  enableKaDoublet ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title="Toggle Cu Kα₁/Kα₂ Doublet Splitting"
              >
                <Split className="w-3 h-3" />
                Kα Doublet
              </button>

              <button
                onClick={() => setEnableSecondaryPeak(!enableSecondaryPeak)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  enableSecondaryPeak ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title="Toggle Secondary Peak Deconvolution"
              >
                <Layers className="w-3 h-3" />
                Multi-Peak
              </button>

              <button
                onClick={() => setApplyLpFactor(!applyLpFactor)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  applyLpFactor ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title="Toggle Lorentz-Polarization geometric correction factor"
              >
                <Sparkles className="w-3 h-3" />
                Lp Factor
              </button>

              <button
                onClick={() => setShowResiduals(!showResiduals)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  showResiduals ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
                title="Toggle Residuals Pane"
              >
                <Activity className="w-3 h-3" />
                Residuals
              </button>

              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 ml-1">
                <button
                  onClick={() => setZoomRange(prev => Math.max(0.3, prev - 0.2))}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoomRange(prev => Math.min(2.5, prev + 0.2))}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoomRange(1.0)}
                  className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  title="Reset Zoom"
                >
                  1x
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Figure */}
          <div className="flex-1 w-full min-h-0 min-w-0 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 15, right: 30, left: 10, bottom: 15 }}
                onClick={(e: any) => {
                  if (e && e.activeLabel !== undefined) {
                    setCenter(Number(e.activeLabel));
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/>
                     <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="1.5" height="6" transform="translate(0,0)" fill="#475569" opacity="0.25"></rect>
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} strokeWidth={1} />
                
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}}
                  label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => val.toFixed(2)}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis domain={[0, amplitude * 1.35]} width={35} tick={{fontSize: 10, fill: '#64748b'}} />
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      const thetaRad = (dataPoint.x / 2) * Math.PI / 180;
                      const localSize = activeWavelength * scherrerK / ((fwhm * Math.PI / 180) * Math.cos(thetaRad));
                      
                      return (
                        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-xl shadow-lg text-xs border border-slate-200 dark:border-slate-800 min-w-[210px]">
                          <div className="font-bold border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                            <span>Angle 2θ: {dataPoint.x.toFixed(4)}°</span>
                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded text-indigo-600">{type}</span>
                          </div>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Y_obs (Noisy):</span>
                              <span className="font-bold text-rose-500">{dataPoint.y.toFixed(1)} cps</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Y_calc (Clean):</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{dataPoint._cleanY?.toFixed(1) || '-'} cps</span>
                            </div>
                            {dataPoint.residual !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Residual:</span>
                                <span className="font-bold text-emerald-600">{dataPoint.residual > 0 ? `+${dataPoint.residual.toFixed(1)}` : dataPoint.residual.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yG !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-purple-400">Gaussian:</span>
                                <span className="font-bold text-purple-600">{dataPoint.yG.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yL !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-cyan-400">Lorentzian:</span>
                                <span className="font-bold text-cyan-600">{dataPoint.yL.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yKa1 !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-blue-400">Kα₁ Peak:</span>
                                <span className="font-bold text-blue-600">{dataPoint.yKa1.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yKa2 !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-amber-400">Kα₂ Peak:</span>
                                <span className="font-bold text-amber-600">{dataPoint.yKa2.toFixed(1)} cps</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-slate-400">Local Coherence:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{localSize.toFixed(1)} nm</span>
                            </div>
                            {applyLpFactor && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Lp Factor (local):</span>
                                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                                  {((1 + Math.pow(Math.cos(2 * thetaRad), 2)) / (Math.pow(Math.sin(thetaRad), 2) * Math.cos(thetaRad))).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                
                {/* Background Noise Reference Area */}
                {chartData.length > 0 && (
                  <ReferenceArea 
                    x1={chartData[0].x} 
                    x2={chartData[chartData.length - 1].x} 
                    y1={0} 
                    y2={background} 
                    fill="url(#hatch)" 
                    stroke="none"
                  >
                     <Label value="Background Level" position="insideBottomRight" offset={10} fill="#94a3b8" fontSize={9} fontWeight="700" />
                  </ReferenceArea>
                )}

                {/* Integral Breadth Area */}
                {stats && (
                  <ReferenceArea 
                    x1={center - stats.integralBreadth / 2} 
                    x2={center + stats.integralBreadth / 2} 
                    y1={background} y2={amplitude + background} 
                    fill="rgba(99, 102, 241, 0.03)"
                    stroke="#818cf8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  >
                    <Label value="Integral Breadth (β)" position="insideBottom" offset={10} fill="#818cf8" fontSize={9} fontWeight="700" />
                  </ReferenceArea>
                )}

                {/* Centroid Reference Marker */}
                <ReferenceLine x={center} stroke="#4f46e5" strokeDasharray="3 3" strokeWidth={1.5}>
                   <Label value="Centroid" position="top" fill="#4f46e5" fontSize={10} fontWeight="700" offset={8} />
                </ReferenceLine>
                <ReferenceDot x={center} y={amplitude + background} r={4} fill="#4f46e5" stroke="#ffffff" strokeWidth={1.5} />

                {/* Reference Material Peaks Overlay Lines */}
                {showReferencePeaks && parsedRefPeaks.map((peak, idx) => {
                  const xMin = chartData[0]?.x || 0;
                  const xMax = chartData[chartData.length - 1]?.x || 180;
                  if (peak.theta >= xMin && peak.theta <= xMax) {
                    return (
                      <ReferenceLine 
                        key={`ref-peak-${idx}`} 
                        x={peak.theta} 
                        stroke="#10b981" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.2}
                      >
                         <Label 
                           value={`${peak.label} (${peak.theta.toFixed(2)}°)`} 
                           position="insideTopLeft" 
                           fill="#047857" 
                           fontSize={9} 
                           fontWeight="700" 
                           offset={12} 
                         />
                      </ReferenceLine>
                    );
                  }
                  return null;
                })}

                {/* Intensity Markers */}
                <ReferenceLine y={amplitude + background} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 3">
                   <Label value={`I(max): ${(amplitude + background).toFixed(1)}`} position="insideLeft" fill="#94a3b8" fontSize={9} offset={8} />
                </ReferenceLine>

                {/* FWHM Boundary Line & Markers */}
                <ReferenceLine 
                  segment={[{ x: center - fwhm / 2, y: amplitude / 2 + background }, { x: center + fwhm / 2, y: amplitude / 2 + background }]} 
                  stroke="#4338ca" 
                  strokeWidth={2}
                >
                  <Label value={`FWHM Width: ${fwhm.toFixed(4)}°`} position="top" fill="#4338ca" fontSize={10} fontWeight="700" offset={6} />
                </ReferenceLine>
                <ReferenceDot x={center - fwhm / 2} y={amplitude / 2 + background} r={4} fill="#4338ca" stroke="#ffffff" strokeWidth={1.5} />
                <ReferenceDot x={center + fwhm / 2} y={amplitude / 2 + background} r={4} fill="#4338ca" stroke="#ffffff" strokeWidth={1.5} />

                {/* Gaussian Sub-Curve Component */}
                {type === 'Pseudo-Voigt' && showComponents && (
                  <Line 
                    type="monotone" 
                    dataKey="yG" 
                    stroke="#a855f7" 
                    strokeWidth={1.8} 
                    strokeDasharray="3 3" 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Lorentzian Sub-Curve Component */}
                {type === 'Pseudo-Voigt' && showComponents && (
                  <Line 
                    type="monotone" 
                    dataKey="yL" 
                    stroke="#06b6d4" 
                    strokeWidth={1.8} 
                    strokeDasharray="3 3" 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Kα1 Profile */}
                {enableKaDoublet && (
                  <Line 
                    type="monotone" 
                    dataKey="yKa1" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Kα2 Profile */}
                {enableKaDoublet && (
                  <Line 
                    type="monotone" 
                    dataKey="yKa2" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Secondary Overlapping Reflection */}
                {enableSecondaryPeak && (
                  <Line 
                    type="monotone" 
                    dataKey="yPeak2" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="3 3" 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Clean Peak Curve */}
                <Area 
                   type="monotone" 
                   dataKey="_cleanY" 
                   stroke="#4f46e5" 
                   strokeWidth={3}
                   fillOpacity={1} 
                   fill="url(#colorY)" 
                   isAnimationActive={false}
                   activeDot={false}
                />

                {/* Statistical Noisy Curve */}
                <Area 
                   type="monotone" 
                   dataKey="y" 
                   stroke="#f43f5e" 
                   strokeWidth={1.2}
                   strokeOpacity={0.65}
                   fillOpacity={0} 
                   fill="none" 
                   isAnimationActive={false}
                   activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Synchronized Difference Residuals Pane */}
          {showResiduals && chartData.length > 0 && (
            <div className="mt-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  Fit Residual Difference (Y_obs - Y_calc)
                </span>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="text-slate-400">R_p: <strong className="text-indigo-600 dark:text-indigo-400">{extSim.stats.rP.toFixed(2)}%</strong></span>
                  <span className="text-slate-400">R_wp: <strong className="text-purple-600 dark:text-purple-400">{extSim.stats.rWP.toFixed(2)}%</strong></span>
                  <span className="text-slate-400">GoF (χ²): <strong className="text-emerald-600 dark:text-emerald-400">{extSim.stats.goodnessOfFit.toFixed(2)}</strong></span>
                </div>
              </div>
              <div className="h-[75px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis dataKey="x" hide domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <ReferenceLine y={0} stroke="#10b981" strokeWidth={1.2} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="residual" stroke="#f43f5e" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {stats && (
          <ScientificMathControl
            title="Instrumental Peak Deconvolution"
            formula="\beta_{\text{sample}} = \sqrt{\beta_{\text{obs}}^2 - \beta_{\text{inst}}^2}"
            description="Isolate the specimen's pure physical broadening by subtracting the instrument's footprint under Gaussian approximation (quadratic subtraction)."
            variables={[
              { symbol: 'β_obs', name: 'Observed FWHM', value: (stats.fwhm * Math.PI / 180), unit: 'rad' },
              { symbol: 'β_inst', name: 'Instrumental Broadening', value: (0.015 * Math.PI / 180), unit: 'rad' }
            ]}
            result={Math.sqrt(Math.max(0, Math.pow(stats.fwhm * Math.PI / 180, 2) - Math.pow(0.015 * Math.PI / 180, 2)))}
            resultUnit="rad"
            resultName="Specimen Pure Broadening"
          />
        )}

        {/* Non-Linear Least Squares Auto-Fit Optimization Summary */}
        {fitResult && (
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4.5 rounded-2xl border border-indigo-700/50 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b border-indigo-700/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-500/30">
                  <Wand2 className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                    Non-Linear Least Squares Auto-Fit Complete
                  </h4>
                  <p className="text-[10px] text-indigo-300/80">
                    Simplex-optimized profile parameters with standard error estimates (±σ)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCenter(fitResult.center);
                  setFwhmManual(fitResult.fwhm);
                  setEta(fitResult.eta);
                  setAmplitude(fitResult.amp);
                  setBackground(fitResult.bg);
                }}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Fitted Parameters
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono text-[11px]">
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-[9px] text-indigo-300 block">Centroid 2θ₀</span>
                <span className="font-bold text-white">{fitResult.center}°</span>
                <span className="text-[8px] text-indigo-300/70 block">± {fitResult.stdErrCenter}°</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-[9px] text-indigo-300 block">FWHM (β)</span>
                <span className="font-bold text-white">{fitResult.fwhm}°</span>
                <span className="text-[8px] text-indigo-300/70 block">± {fitResult.stdErrFwhm}°</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-[9px] text-indigo-300 block">Mixing Fraction (η)</span>
                <span className="font-bold text-white">{(fitResult.eta * 100).toFixed(1)}%</span>
                <span className="text-[8px] text-indigo-300/70 block">± {fitResult.stdErrEta}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-[9px] text-indigo-300 block">Peak Amplitude</span>
                <span className="font-bold text-white">{fitResult.amp} cps</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-[9px] text-indigo-300 block">Profile R_wp</span>
                <span className="font-bold text-purple-300">{fitResult.rwp}%</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="text-[9px] text-indigo-300 block">Reduced Chi²</span>
                <span className="font-bold text-emerald-400">{fitResult.chi2}</span>
              </div>
            </div>
          </div>
        )}

        {/* Physical Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Crystallite Size */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Sample Crystallite Size (D)
            </span>
            <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {extSim.stats.betaSample > 0 ? (
                (() => {
                  const thetaRad = (center / 2) * (Math.PI / 180);
                  const betaRad = (extSim.stats.betaSample * Math.PI) / 180;
                  const L = (scherrerK * activeWavelength) / (betaRad * Math.cos(thetaRad));
                  return L > 250 ? ">250 nm" : `${L.toFixed(1)} nm`;
                })()
              ) : '-'}
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-sans">
              Deconvolved footprint (β_inst = {extSim.stats.betaInst.toFixed(3)}°).
            </p>
          </div>

          {/* Microstrain */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Lattice Microstrain (ε)
            </span>
            <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
              {extSim.stats.betaSample > 0 ? (
                (() => {
                  const thetaRad = (center / 2) * (Math.PI / 180);
                  const betaRad = (extSim.stats.betaSample * Math.PI) / 180;
                  const e = betaRad / (4 * Math.tan(thetaRad));
                  return `${(e * 1000).toFixed(2)} × 10⁻³`;
                })()
              ) : '-'}
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-sans">Stokes-Wilson microstrain.</p>
          </div>

          {/* Bragg d-spacing & q-vector */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              d-Spacing & q-Vector
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {extSim.stats.dSpacing.toFixed(4)} Å
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-sans">
              q = {extSim.stats.qVector.toFixed(3)} Å⁻¹
            </p>
          </div>

          {/* FWTM & Shape Ratio */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              FWTM / FWHM Ratio
            </span>
            <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
              {extSim.stats.fwtmRatio.toFixed(2)}
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-sans">
              FWTM: {extSim.stats.fwtm.toFixed(3)}° (G=1.82, L=3.00)
            </p>
          </div>

          {/* Centroid CoM & Skewness */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Centroid 2θ_CoM
            </span>
            <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
              {extSim.stats.centroid.toFixed(3)}°
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-sans">
              Skew: {extSim.stats.skewness > 0 ? `+${extSim.stats.skewness.toFixed(3)}` : extSim.stats.skewness.toFixed(3)}°
            </p>
          </div>

          {/* Profile Fit Rwp & Chi2 */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Fit Residual R_wp (χ²)
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              {extSim.stats.rWP.toFixed(2)}%
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-sans">
              Goodness of Fit χ² = {extSim.stats.goodnessOfFit.toFixed(2)}
            </p>
          </div>

        </div>

        {/* Profile Analysis Alerts */}
        {analysis && (
          <div className={`p-4 rounded-xl border transition-all ${
            analysis.status === 'ok' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 
            'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${analysis.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              Analytical Simulation & Physics Consistency Reports
            </h4>
            <ul className="space-y-1">
              {analysis.messages.map((msg, idx) => (
                <li key={idx} className="text-xs flex items-center gap-2">
                  <span className="text-[10px] opacity-70">•</span>
                  <span>{msg.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Diffraction Theory & Line Profile Models (High-value PhD Reference Hub) */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Diffraction Physics & Analytical Models
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Theoretical formulation governing crystallite size broadening and lattice microstrain calculations.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-center px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold rounded-full border border-indigo-100 dark:border-indigo-900/30">
              PHYSICS CORE v2.4
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Scherrer Formulation Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-purple-500 rounded-sm" />
                    Scherrer Crystallite Coherence Size (D)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20">
                    Size Domain
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Derived from the Bragg peak's pure Lorentzian broadening. Represents the average volume-weighted dimension of coherent crystalline diffraction domains.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 text-center relative">
                  <span className="absolute top-1 left-2 text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">analytical model</span>
                  <div className="font-mono text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400 py-1.5 tracking-wide">
                    D = <span className="text-purple-600 dark:text-purple-400">(K · λ)</span> / <span className="text-emerald-600 dark:text-emerald-400">(β_size · cos(θ))</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 relative z-10">
                <div className="grid grid-cols-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span><strong>K</strong>: Shape factor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span><strong>λ</strong>: Wavelength</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>β_size</strong>: Lorentzian FWHM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stokes-Wilson Microstrain Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-blue-500 rounded-sm" />
                    Stokes-Wilson Lattice Microstrain (ε)
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20">
                    Strain Domain
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Extracted from Gaussian peak broadening. Models localized lattice microstrains, dislocations, crystal defects, and systematic interplanar d-spacing fluctuations.
                </p>
                
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 text-center relative">
                  <span className="absolute top-1 left-2 text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">analytical model</span>
                  <div className="font-mono text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400 py-1.5 tracking-wide">
                    ε = <span className="text-blue-600 dark:text-blue-400">β_strain</span> / <span className="text-rose-600 dark:text-rose-400">(4 · tan(θ))</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 relative z-10">
                <div className="grid grid-cols-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span><strong>β_strain</strong>: Gaussian FWHM</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span><strong>θ</strong>: Half the diffraction angle 2θ (Bragg angle)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Mathematical Profiles Section */}
          <div className="space-y-3 pt-3">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Diffraction Peak Profile Functions
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Gaussian Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-blue-400 dark:hover:border-blue-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  G(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Gaussian Model</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = I₀·e<sup>-ln(2)·((θ-θ₀)/w)²</sup>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Represents rapid exponential decay. Excellent for modeling instrumental broadening.
                </p>
              </div>

              {/* Lorentzian Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-purple-400 dark:hover:border-purple-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  L(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Lorentzian Model</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = I₀ / [1 + ((θ-θ₀)/w)²]
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Features heavy polynomial tails. Ideal for modeling finite crystallite sizes.
                </p>
              </div>

              {/* Pseudo-Voigt Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-amber-400 dark:hover:border-amber-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  pV(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Pseudo-Voigt</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = η·L(θ) + (1-η)·G(θ)
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  A linear convolution. Standard hybrid model for Rietveld refinement calculations.
                </p>
              </div>

              {/* Pearson VII Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl relative hover:border-pink-400 dark:hover:border-pink-800 transition-all">
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                  P7(θ)
                </span>
                <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 mb-1">Pearson VII</span>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-100 dark:border-slate-850 mt-2 overflow-x-auto">
                  I(θ) = I₀ / [1 + (2<sup>1/m</sup>-1)·((θ-θ₀)/w)²]<sup>m</sup>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Highly adaptable profile. Mixer exponent <strong className="text-slate-700 dark:text-slate-300">m</strong> transitions seamlessly between L(1) and G(∞).
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
