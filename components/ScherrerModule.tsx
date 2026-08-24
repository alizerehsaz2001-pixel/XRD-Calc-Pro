import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer, XRAY_WAVELENGTHS } from '../utils/physics';
import { 
  Info, BookOpen, AlertTriangle, ChevronDown, Check, Atom, Binary, ShieldQuestion, 
  Settings, Ruler, FlaskConical, Database, Network, Activity, Zap, Download, 
  BarChart2, X, Copy, CheckCircle2, Sparkles, TrendingUp, Compass, Sliders, Layers, 
  Share2, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, ReferenceLine, Legend, Area, ComposedChart 
} from 'recharts';
import { MorphologyVisualizer } from './MorphologyVisualizer';
import { ScientificMathControl } from './ScientificMathControl';
import { PythonCodeExporter } from './PythonCodeExporter';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import scherrerBg from '../src/assets/images/scherrer_bg_1785502401694.jpg';
import { logCalculation, logExport } from '../services/activityLogger';

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles (FWHM-based)', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Integral Breadth', value: 1.0, desc: 'Theoretical value when using Integral Breadth instead of FWHM', icon: '∫' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const CAGLIOTI_PRESETS = [
  { label: '0 (Raw)', u: 0, v: 0, w: 0 },
  { label: 'Lab Diffractometer', u: 0.004, v: -0.002, w: 0.01 },
  { label: 'Synchrotron (High Res)', u: 0.0001, v: -0.00005, w: 0.0002 },
  { label: 'Neutron Diffractometer', u: 0.02, v: -0.01, w: 0.05 },
];

const MATERIAL_DENSITIES = [
  { label: 'Silicon (Si)', density: 2.33, crystal: 'Diamond Cubic' },
  { label: 'TiO₂ Anatase', density: 3.89, crystal: 'Tetragonal' },
  { label: 'TiO₂ Rutile', density: 4.23, crystal: 'Tetragonal' },
  { label: 'Zinc Oxide (ZnO)', density: 5.61, crystal: 'Wurtzite Hex' },
  { label: 'Gold (Au)', density: 19.30, crystal: 'FCC' },
  { label: 'Iron (α-Fe)', density: 7.87, crystal: 'BCC' },
  { label: 'Copper (Cu)', density: 8.96, crystal: 'FCC' },
  { label: 'Alumina (α-Al₂O₃)', density: 3.95, crystal: 'Trigonal' },
  { label: 'Custom Density', density: 2.33, crystal: 'User-defined' }
];

const SCHERRER_PRESETS = [
  { 
    name: 'Silicon (NIST 640d)', 
    data: "28.442, 0.125, 100, 1, 1, 1\n47.302, 0.152, 55, 2, 2, 0\n56.123, 0.180, 32, 3, 1, 1\n69.130, 0.210, 18, 4, 0, 0\n76.377, 0.235, 12, 3, 3, 1", 
    wavelength: 1.5406, 
    k: 0.94, 
    kLabel: 'Spherical',
    density: 2.33,
    materialLabel: 'Silicon (Si)',
    desc: 'High-crystallinity standard with indexed (hkl) planes.',
    icon: '💎'
  },
  { 
    name: 'Zinc Oxide (Nano)', 
    data: "31.77, 0.38, 57, 1, 0, 0\n34.42, 0.32, 44, 0, 0, 2\n36.25, 0.42, 100, 1, 0, 1\n47.54, 0.48, 23, 1, 0, 2\n56.60, 0.52, 32, 1, 1, 0\n62.86, 0.55, 28, 1, 0, 3", 
    wavelength: 1.5406, 
    k: 0.94, 
    kLabel: 'Spherical',
    density: 5.61,
    materialLabel: 'Zinc Oxide (ZnO)',
    desc: 'Hexagonal wurtzite nanoparticles with (hkl) anisotropic growth.',
    icon: '⚪'
  },
  { 
    name: 'TiO₂ Anatase Nano', 
    data: "25.28, 0.48, 100, 1, 0, 1\n37.80, 0.54, 20, 0, 0, 4\n48.05, 0.58, 35, 2, 0, 0\n53.89, 0.62, 20, 1, 0, 5\n55.06, 0.63, 20, 2, 1, 1", 
    wavelength: 1.5406, 
    k: 0.943, 
    kLabel: 'Cubic {100}',
    density: 3.89,
    materialLabel: 'TiO₂ Anatase',
    desc: 'Photocatalytic titania with facet-dependent broadening.',
    icon: '✨'
  },
  { 
    name: 'Au Nanorods', 
    data: "38.19, 0.35, 100, 1, 1, 1\n44.39, 0.68, 52, 2, 0, 0\n64.58, 0.42, 31, 2, 2, 0\n77.55, 0.74, 36, 3, 1, 1", 
    wavelength: 1.5406, 
    k: 1.1, 
    kLabel: 'Nanowires/Rods',
    density: 19.30,
    materialLabel: 'Gold (Au)',
    desc: 'High aspect ratio 1D gold nanorods with anisotropic axial growth.',
    icon: '┃'
  }
];

export const ScherrerModule: React.FC = () => {
  const { precision, lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1); // Instrumental broadening
  const [useCaglioti, setUseCaglioti] = useState(false);
  const [caglioti, setCaglioti] = useState({ u: 0.004, v: -0.002, w: 0.01 });
  const [inputData, setInputData] = useState<string>(
    "28.442, 0.125, 100, 1, 1, 1\n47.302, 0.152, 55, 2, 2, 0\n56.123, 0.180, 32, 3, 1, 1\n69.130, 0.210, 18, 4, 0, 0\n76.377, 0.235, 12, 3, 3, 1"
  );
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'de Keijser' | 'Halder-Wagner'>('Gaussian');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  
  // Material density state for Specific Surface Area (SSA) calculation
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Silicon (Si)');
  const [materialDensity, setMaterialDensity] = useState<number>(2.33);

  // Active visualization tab for right panel charts
  const [chartViewMode, setChartViewMode] = useState<'histogram' | 'trend' | 'microstructure' | 'anisotropy'>('histogram');

  // Derivation interactive simulator parameters
  const [simPlaneCount, setSimPlaneCount] = useState<number>(25);
  const [simDSpacing, setSimDSpacing] = useState<number>(3.135); // Si (111) in Å

  const [results, setResults] = useState<ScherrerResult[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_scherrer_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.results)) return parsed.results;
      }
    } catch (e) {}
    return [];
  });

  const [averageType, setAverageType] = useState<'weighted' | 'arithmetic'>(() => {
    try {
      const saved = localStorage.getItem('xrd_scherrer_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.averageType === 'weighted' || parsed.averageType === 'arithmetic')) {
          return parsed.averageType;
        }
      }
    } catch (e) {}
    return 'weighted';
  });

  const [avgSize, setAvgSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('xrd_scherrer_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.avgSize === 'number') return parsed.avgSize;
      }
    } catch (e) {}
    return 0;
  });

  const isFirstRender = useRef(true);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isDerivationModalOpen, setIsDerivationModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Pre-render mathematical formulas using KaTeX
  const formulas = useMemo(() => {
    const render = (tex: string, display: boolean = false) => {
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode: display });
      } catch (e) {
        return tex;
      }
    };
    return {
      braggLawOrder1: render("2d \\sin\\theta_0 = \\lambda", true),
      finiteSize1: render("2Nd \\sin\\theta_1 = (N + 1)\\lambda", true),
      finiteSize2: render("2Nd \\sin\\theta_2 = (N - 1)\\lambda", true),
      subtraction: render("2Nd(\\sin\\theta_1 - \\sin\\theta_2) = 2\\lambda", true),
      reducedSub: render("Nd(\\sin\\theta_1 - \\sin\\theta_2) = \\lambda", true),
      trigIdentity: render("\\sin\\theta_1 - \\sin\\theta_2 = 2 \\cos\\left(\\frac{\\theta_1 + \\theta_2}{2}\\right) \\sin\\left(\\frac{\\theta_1 - \\theta_2}{2}\\right)", true),
      trigSub: render("\\theta_1 + \\theta_2 = 2\\theta_0 \\quad \\text{and} \\quad \\theta_1 - \\theta_2 = 2\\Delta\\theta", true),
      trigResult: render("\\sin\\theta_1 - \\sin\\theta_2 = 2 \\cos\\theta_0 \\sin(\\Delta\\theta)", true),
      approx: render("\\sin(\\Delta\\theta) \\approx \\Delta\\theta", true),
      combinedtrig: render("\\sin\\theta_1 - \\sin\\theta_2 \\approx 2 \\Delta\\theta \\cos\\theta_0", true),
      finalSubstitution: render("Nd(2 \\Delta\\theta \\cos\\theta_0) = \\lambda", true),
      rearranged: render("(Nd)(2 \\Delta\\theta) \\cos\\theta_0 = \\lambda", true),
      fwhmDefinition: render("\\beta \\approx 2 \\Delta\\theta", true),
      crystalliteThickness: render("D = N \\cdot d", true),
      noShapeFactor: render("D \\cdot \\beta \\cdot \\cos\\theta_0 = \\lambda \\implies D = \\frac{\\lambda}{\\beta \\cos\\theta_0}", true),
      shapeFactorK: render("D = \\frac{K \\cdot \\lambda}{\\beta \\cos\\theta}", true),
      dislocationFormula: render("\\delta = \\frac{1}{D^2} \\quad \\left[\\text{lines/m}^2\\right]", true),
      ssaFormula: render("\\text{SSA} = \\frac{6 \\times 10^3}{\\rho \\cdot D} \\quad \\left[\\text{m}^2/\\text{g}\\right]", true),
      deKeijserFormula: render("D_L = \\frac{K \\lambda}{\\beta_L \\cos\\theta}, \\quad \\epsilon_G = \\frac{\\beta_G}{4 \\tan\\theta}", true),
      halderWagnerFormula: render("\\left(\\frac{\\beta_s}{\\beta_o}\\right)^2 = 1 - \\left(\\frac{\\beta_i}{\\beta_o}\\right)^2", true)
    };
  }, []);

  const validResults = useMemo(() => results.filter(r => !r.error && r.sizeNm > 0), [results]);

  const { exactArithmetic, exactWeighted, volumeWeighted, areaWeighted, geometricMean, geometricStdDev } = useMemo(() => {
    if (validResults.length === 0) {
      return { exactArithmetic: 0, exactWeighted: 0, volumeWeighted: 0, areaWeighted: 0, geometricMean: 0, geometricStdDev: 1 };
    }
    
    // 1. Arithmetic Mean
    const sum = validResults.reduce((acc, curr) => acc + curr.sizeNm, 0);
    const arithmetic = sum / validResults.length;
    
    // 2. Intensity-Weighted Mean
    let totalWeight = 0;
    let weightedSum = 0;
    validResults.forEach(r => {
      const weight = r.intensity || 1;
      weightedSum += r.sizeNm * weight;
      totalWeight += weight;
    });
    const weighted = totalWeight > 0 ? (weightedSum / totalWeight) : arithmetic;

    // 3. Volume-Weighted Mean (D_V = sum(D^4) / sum(D^3))
    const sumD4 = validResults.reduce((acc, r) => acc + Math.pow(r.sizeNm, 4), 0);
    const sumD3 = validResults.reduce((acc, r) => acc + Math.pow(r.sizeNm, 3), 0);
    const volumeW = sumD3 > 0 ? sumD4 / sumD3 : arithmetic;

    // 4. Area-Weighted Mean (D_A = sum(D^3) / sum(D^2))
    const sumD2 = validResults.reduce((acc, r) => acc + Math.pow(r.sizeNm, 2), 0);
    const areaW = sumD2 > 0 ? sumD3 / sumD2 : arithmetic;

    // 5. Geometric Mean & Log-Normal Std Dev
    const logSum = validResults.reduce((acc, r) => acc + Math.log(Math.max(0.1, r.sizeNm)), 0);
    const geomMean = Math.exp(logSum / validResults.length);
    const logVar = validResults.reduce((acc, r) => acc + Math.pow(Math.log(Math.max(0.1, r.sizeNm)) - Math.log(geomMean), 2), 0) / validResults.length;
    const geomSd = Math.exp(Math.sqrt(logVar));

    return { 
      exactArithmetic: arithmetic, 
      exactWeighted: weighted, 
      volumeWeighted: volumeW, 
      areaWeighted: areaW,
      geometricMean: geomMean,
      geometricStdDev: geomSd
    };
  }, [validResults]);

  const stats = useMemo(() => {
    if (validResults.length === 0) {
      return { 
        count: 0, min: 0, max: 0, stdDev: 0, relDispersion: 0, delta: 0, deltaPct: 0, 
        avgDislocation10_14: 0, avgSSA: 0, avgCoherentPlanes: 0, anisotropyIndex: 1 
      };
    }
    const sizes = validResults.map(r => r.sizeNm);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    const count = validResults.length;
    const currentMean = averageType === 'weighted' ? exactWeighted : exactArithmetic;
    const variance = count > 1 
      ? validResults.reduce((acc, r) => acc + Math.pow(r.sizeNm - currentMean, 2), 0) / count 
      : 0;
    const stdDev = Math.sqrt(variance);
    const relDispersion = currentMean > 0 ? (stdDev / currentMean) * 100 : 0;
    const delta = Math.abs(exactWeighted - exactArithmetic);
    const deltaPct = exactArithmetic > 0 ? (delta / exactArithmetic) * 100 : 0;

    // Average dislocation density (10^14 m^-2)
    const avgDisloc = validResults.reduce((acc, r) => acc + (r.dislocationDensity10_14 || 0), 0) / count;
    // Average Specific Surface Area (m^2/g)
    const avgSsaVal = validResults.reduce((acc, r) => acc + (r.specificSurfaceAreaM2g || 0), 0) / count;
    // Average coherent plane count
    const avgPlanes = validResults.reduce((acc, r) => acc + (r.coherencePlanesN || 0), 0) / count;
    // Anisotropy index
    const anisotropyIdx = min > 0 ? max / min : 1;

    return { 
      count, min, max, stdDev, relDispersion, delta, deltaPct, 
      avgDislocation10_14: avgDisloc, avgSSA: avgSsaVal, avgCoherentPlanes: Math.round(avgPlanes),
      anisotropyIndex: anisotropyIdx
    };
  }, [validResults, averageType, exactWeighted, exactArithmetic]);

  // Williamson-Hall strain triage to verify if Scherrer assumption is physically sound
  const whStrainTriage = useMemo(() => {
    if (validResults.length < 2) return { slope: 0, rSquared: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    validResults.forEach(r => {
      const theta = (r.twoTheta / 2) * (Math.PI / 180);
      const x = 4 * Math.sin(theta);
      const y = r.betaCorrected * (Math.PI / 180) * Math.cos(theta);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const n = validResults.length;
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return { slope: 0, rSquared: 0 };
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    let ssTot = 0, ssRes = 0;
    const meanY = sumY / n;
    validResults.forEach(r => {
      const theta = (r.twoTheta / 2) * (Math.PI / 180);
      const x = 4 * Math.sin(theta);
      const y = r.betaCorrected * (Math.PI / 180) * Math.cos(theta);
      const f = slope * x + intercept;
      ssTot += Math.pow(y - meanY, 2);
      ssRes += Math.pow(y - f, 2);
    });
    
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    return { slope: Math.max(0, slope), rSquared };
  }, [validResults]);

  // Histogram data with Log-Normal fitting curve overlay
  const histogramData = useMemo(() => {
    if (validResults.length === 0) return [];
    
    const sizes = validResults.map(r => r.sizeNm);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    
    const numBins = Math.max(5, Math.min(12, Math.ceil(Math.sqrt(validResults.length))));
    let binWidth = (max - min) / numBins;
    if (binWidth === 0) binWidth = 1; 

    const rangeStart = Math.max(0, min - binWidth * 0.1);

    const bins = Array.from({ length: numBins }, (_, i) => ({
      rangeStart: rangeStart + i * binWidth,
      rangeEnd: rangeStart + (i + 1) * binWidth,
      center: rangeStart + (i + 0.5) * binWidth,
      count: 0
    }));

    validResults.forEach(r => {
      let binIndex = Math.floor((r.sizeNm - rangeStart) / binWidth);
      if (binIndex >= numBins) binIndex = numBins - 1;
      if (binIndex < 0) binIndex = 0;
      if (bins[binIndex]) {
        bins[binIndex].count += 1;
      }
    });

    const mu = Math.log(Math.max(0.1, geometricMean));
    const sigma = Math.max(0.01, Math.log(Math.max(1.01, geometricStdDev)));

    return bins.map(b => {
      const x = b.center;
      // Log-normal PDF
      const pdf = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma));
      const normalizedPdfCount = pdf * binWidth * validResults.length;

      return {
        name: `${b.rangeStart.toFixed(1)}-${b.rangeEnd.toFixed(1)} nm`,
        center: parseFloat(b.center.toFixed(1)),
        count: b.count,
        fittedPdf: parseFloat(normalizedPdfCount.toFixed(2))
      };
    });
  }, [validResults, geometricMean, geometricStdDev]);

  // Size vs 2θ chart data points including theoretical instrument resolution threshold curve
  const sizeTrendData = useMemo(() => {
    if (validResults.length === 0) return [];
    
    return validResults.map((r, idx) => {
      const thetaRad = (r.twoTheta / 2) * (Math.PI / 180);
      const curInstFwhm = useCaglioti 
        ? Math.sqrt(Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w))
        : instFwhm;
      const instLimitNm = (constantK * wavelength) / (curInstFwhm * (Math.PI / 180) * Math.cos(thetaRad)) / 10;
      
      const hklLabel = r.hkl ? `(${r.hkl.join('')})` : `#${idx + 1}`;

      return {
        twoTheta: parseFloat(r.twoTheta.toFixed(2)),
        sizeNm: parseFloat(r.sizeNm.toFixed(2)),
        instLimitNm: parseFloat(instLimitNm.toFixed(1)),
        intensity: r.intensity || 0,
        fwhmObs: parseFloat(r.fwhmObs.toFixed(3)),
        dSpacing: r.dSpacing ? parseFloat(r.dSpacing.toFixed(3)) : 0,
        label: `${hklLabel} @ ${r.twoTheta.toFixed(1)}°`,
        hkl: hklLabel,
        dislocation: r.dislocationDensity10_14 ? parseFloat(r.dislocationDensity10_14.toFixed(2)) : 0,
        ssa: r.specificSurfaceAreaM2g ? parseFloat(r.specificSurfaceAreaM2g.toFixed(1)) : 0,
        planes: r.coherencePlanesN || 0
      };
    }).sort((a, b) => a.twoTheta - b.twoTheta);
  }, [validResults, useCaglioti, caglioti, instFwhm, constantK, wavelength]);

  // Anisotropic Facet Breakdown Data (grouped by hkl)
  const anisotropyData = useMemo(() => {
    return validResults.map((r, idx) => ({
      name: r.hkl ? `(${r.hkl.join('')})` : `Peak #${idx + 1}`,
      size: parseFloat(r.sizeNm.toFixed(2)),
      twoTheta: parseFloat(r.twoTheta.toFixed(2)),
      dSpacing: r.dSpacing ? parseFloat(r.dSpacing.toFixed(3)) : 0,
      planes: r.coherencePlanesN || 0,
      relDiff: avgSize > 0 ? parseFloat((((r.sizeNm - avgSize) / avgSize) * 100).toFixed(1)) : 0
    }));
  }, [validResults, avgSize]);

  // Simulated finite-size interference profile for the derivation modal
  const simDiffractionProfile = useMemo(() => {
    const d = simDSpacing; // in Angstroms
    const N = simPlaneCount;
    const lambda = wavelength;
    const sinTheta0 = lambda / (2 * d);
    if (sinTheta0 >= 1) return { points: [], twoTheta0: 0, expectedFwhm: 0 };
    
    const theta0Deg = Math.asin(sinTheta0) * (180 / Math.PI);
    const twoTheta0 = 2 * theta0Deg;

    const points = [];
    const deltaRange = Math.max(1.5, 40 / N); // angular scan range around 2theta0
    const start2T = Math.max(1, twoTheta0 - deltaRange);
    const end2T = twoTheta0 + deltaRange;
    const steps = 120;
    const stepSize = (end2T - start2T) / steps;

    for (let i = 0; i <= steps; i++) {
      const cur2T = start2T + i * stepSize;
      const theta = (cur2T / 2) * (Math.PI / 180);
      const deltaSin = Math.sin(theta) - sinTheta0;
      const alpha = (Math.PI * d * deltaSin) / lambda;

      let intensity = 0;
      if (Math.abs(alpha) < 1e-6) {
        intensity = 1.0;
      } else {
        const num = Math.sin(N * alpha);
        const den = Math.sin(alpha);
        if (Math.abs(den) < 1e-6) {
          intensity = 1.0;
        } else {
          intensity = Math.pow(num / (N * den), 2);
        }
      }

      points.push({
        twoTheta: parseFloat(cur2T.toFixed(3)),
        intensity: parseFloat((intensity * 100).toFixed(2))
      });
    }

    return { points, twoTheta0, expectedFwhm: parseFloat(((0.9 * lambda) / (N * d * Math.cos(theta0Deg * Math.PI / 180)) * (180 / Math.PI)).toFixed(3)) };
  }, [simPlaneCount, simDSpacing, wavelength]);

  // Ref for clicking outside the shape factor dropdown
  const kMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (results.length === 0) return;
    
    const csvHeader = "2θ [deg],(hkl),d-Spacing [Å],FWHM Obs [deg],FWHM Corr [deg],Intensity,Crystallite Size [nm],Dislocation Density [10^14 m^-2],SSA [m^2/g],Coherent Planes N,Error\n";
    const csvRows = results.map(res => {
      const hklStr = res.hkl ? `"${res.hkl.join(' ')}"` : 'N/A';
      return `${res.twoTheta.toFixed(precision)},${hklStr},${res.dSpacing ? res.dSpacing.toFixed(precision) : 'N/A'},${res.fwhmObs.toFixed(precision)},${res.betaCorrected.toFixed(precision)},${res.intensity !== undefined ? res.intensity.toFixed(1) : 'N/A'},${res.error ? 'N/A' : res.sizeNm.toFixed(precision)},${res.dislocationDensity10_14 ? res.dislocationDensity10_14.toFixed(precision) : 'N/A'},${res.specificSurfaceAreaM2g ? res.specificSurfaceAreaM2g.toFixed(precision) : 'N/A'},${res.coherencePlanesN !== undefined ? res.coherencePlanesN : 'N/A'},"${res.error || ''}"`;
    }).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scherrer_comprehensive_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCalculate = () => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 500);
    setTimeout(() => setSimulationStep(3), 1100);
    setTimeout(() => setSimulationStep(4), 1800);
    setTimeout(() => setSimulationStep(5), 2500);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      const peaks = parseScherrerInput(inputData);
      const computed = peaks
        .map(p => {
          const thetaRad = (p.twoTheta / 2) * Math.PI / 180;
          const currentInstFwhm = useCaglioti 
            ? Math.sqrt(Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w))
            : instFwhm;
          return calculateScherrer(wavelength, constantK, currentInstFwhm, p, broadeningModel, materialDensity);
        })
        .filter((r): r is ScherrerResult => r !== null); 
      
      setResults(computed);
      
      const valid = computed.filter(r => !r.error && r.sizeNm > 0);
      let calculatedAvg = 0;
      if (valid.length > 0) {
        if (averageType === 'weighted') {
          const hasIntensities = valid.some(r => r.intensity !== undefined && r.intensity > 0);
          if (hasIntensities) {
            let totalWeight = 0;
            let weightedSum = 0;
            valid.forEach(r => {
              const weight = r.intensity || 1;
              weightedSum += r.sizeNm * weight;
              totalWeight += weight;
            });
            calculatedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
          } else {
            const sum = valid.reduce((acc, curr) => acc + curr.sizeNm, 0);
            calculatedAvg = sum / valid.length;
          }
        } else {
          const sum = valid.reduce((acc, curr) => acc + curr.sizeNm, 0);
          calculatedAvg = sum / valid.length;
        }
      }
      setAvgSize(calculatedAvg);

      // Record activity telemetry
      logCalculation('Scherrer', 'Scherrer Crystallite Size Calculation', {
        wavelength,
        constantK,
        instFwhm,
        broadeningModel,
        peaksCount: peaks.length,
        selectedMaterial
      }, {
        averageSize_nm: calculatedAvg,
        validPeaksCount: valid.length
      });

      localStorage.setItem('xrd_scherrer_current', JSON.stringify({
        wavelength,
        constantK,
        instFwhm,
        useCaglioti,
        caglioti,
        broadeningModel,
        results: computed,
        avgSize: calculatedAvg,
        averageType,
        materialDensity,
        selectedMaterial
      }));
    }, 3200);
  };

  useEffect(() => {
    const valid = results.filter(r => !r.error && r.sizeNm > 0);
    let calculatedAvg = 0;
    if (valid.length > 0) {
      if (averageType === 'weighted') {
        const hasIntensities = valid.some(r => r.intensity !== undefined && r.intensity > 0);
        if (hasIntensities) {
          let totalWeight = 0;
          let weightedSum = 0;
          valid.forEach(r => {
            const weight = r.intensity || 1;
            weightedSum += r.sizeNm * weight;
            totalWeight += weight;
          });
          calculatedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
        } else {
          const sum = valid.reduce((acc, curr) => acc + curr.sizeNm, 0);
          calculatedAvg = sum / valid.length;
        }
      } else {
        const sum = valid.reduce((acc, curr) => acc + curr.sizeNm, 0);
        calculatedAvg = sum / valid.length;
      }
    }
    setAvgSize(calculatedAvg);
  }, [results, averageType]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setResults([]);
    localStorage.removeItem('xrd_scherrer_current');
  }, [wavelength, constantK, instFwhm, inputData, useCaglioti, caglioti, broadeningModel, materialDensity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Left Column: Configuration Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050A14] p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
            <img src={scherrerBg} alt="Scherrer Diffraction" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/85 to-[#050A14]/30" />
          </div>

          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="relative group/title-icon cursor-default">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full group-hover/title-icon:bg-amber-400/30 transition-all duration-700 pointer-events-none" />
              <div className="w-14 h-14 bg-[#0a0500] rounded-2xl border border-amber-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/title-icon:border-amber-400 transition-colors duration-500 overflow-hidden">
                <Settings className="w-6 h-6 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover/title-icon:rotate-90 transition-transform duration-700" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
                Scherrer Studio
              </h2>
              <p className="flex items-center gap-2 text-[10px] font-mono text-amber-500/80 uppercase tracking-[0.25em]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_2s_ease-in-out_infinite]" />
                Physics Sizing Engine
              </p>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            {/* Source Wavelength */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Source Wavelength [{lengthUnit}]
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Source</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none z-10">
                    <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Energy</span>
                    <span className="text-xs font-black text-emerald-400 font-mono tracking-tighter">
                      {(12.398 / (wavelength || 1.5406)).toFixed(2)} keV
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={String(wavelength) === 'NaN' ? '' : convertLength(wavelength, lengthUnit)}
                    onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                    className="w-full pl-24 pr-4 py-3.5 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-base font-black transition-all shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <div className="h-4 w-[1px] bg-slate-800 mr-2" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Lambda</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(XRAY_WAVELENGTHS).map(([name, val]) => (
                    <button
                      key={name}
                      onClick={() => setWavelength(val)}
                      className={`py-2 px-1 rounded-xl border text-[8px] font-black uppercase tracking-tight transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer
                        ${Math.abs(wavelength - val) < 0.0001 
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold' 
                          : 'bg-black/20 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                        }
                      `}
                    >
                      <span className="truncate w-full text-center">{name.replace(' Kα', '').replace(' (avg)', '')}</span>
                      <span className="opacity-60 text-[7px] font-mono">{convertLength(val, lengthUnit).toFixed(lengthUnit === 'nm' ? 4 : 2)} {lengthUnit}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shape Factor K Dropdown */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Atom className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Shape Factor [K]
                </label>
              </div>
              <div className="space-y-3 relative" ref={kMenuRef}>
                <button
                  onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl outline-none transition-all flex items-center justify-between group shadow-inner cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                      {K_FACTORS.find(k => k.label === selectedKType)?.icon || '✎'}
                    </span>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-bold text-white leading-none">
                        {selectedKType}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isKTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 left-0 right-0 mt-2 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 py-1 max-h-72 overflow-y-auto custom-scrollbar"
                    >
                      {K_FACTORS.map((k) => (
                        <button
                          key={k.label}
                          onClick={() => {
                            setSelectedKType(k.label);
                            if (k.value !== 0) setConstantK(k.value);
                            setIsKTypeMenuOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors group/item cursor-pointer text-left
                            ${selectedKType === k.label ? 'bg-amber-500/10' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl bg-slate-950 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 group-hover/item:border-amber-500/30 shrink-0">
                              {k.icon}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-bold transition-colors ${selectedKType === k.label ? 'text-amber-400' : 'text-slate-200'}`}>
                                {k.label} {k.value !== 0 && `(K = ${k.value})`}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate mt-0.5">
                                {k.desc}
                              </span>
                            </div>
                          </div>
                          {selectedKType === k.label && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3">
                  <div className="relative w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={String(constantK) === 'NaN' ? '' : constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value));
                        setSelectedKType('Custom');
                      }}
                      className="w-full px-3 py-2.5 bg-black/60 text-amber-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none font-mono text-xs font-black transition-all text-center"
                    />
                  </div>
                  <div className="flex-1 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 min-h-[44px]">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-tight uppercase tracking-wider">
                       {K_FACTORS.find(k => k.label.includes(selectedKType) || k.label === selectedKType)?.desc || 'Dimensionless shape factor.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decoupling & Broadening Kernel Models */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                   <Settings className="w-3.5 h-3.5 text-amber-400" />
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Convolution Kernel
                   </label>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                  {broadeningModel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                 {[
                   { id: 'Gaussian', label: 'Gaussian', tag: 'β²_s = β²_o - β²_i' },
                   { id: 'Lorentzian', label: 'Lorentzian', tag: 'β_s = β_o - β_i' },
                   { id: 'Pseudo-Voigt', label: 'Pseudo-Voigt', tag: 'Mixed Paraboloid' },
                   { id: 'de Keijser', label: 'de Keijser', tag: 'Voigt Size + Strain' },
                   { id: 'Halder-Wagner', label: 'Halder-Wag.', tag: 'Voigt Paraboloid' }
                 ].map(model => (
                   <button
                     key={model.id}
                     onClick={() => setBroadeningModel(model.id as any)}
                     className={`py-2 px-1.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5
                       ${broadeningModel === model.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold' : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-300'}
                     `}
                   >
                     <span>{model.label}</span>
                   </button>
                 ))}
              </div>
              <div className="mt-3 p-3 bg-black/40 rounded-xl border border-slate-800/50 text-[9px] font-mono text-slate-400 leading-relaxed">
                {broadeningModel === 'Gaussian' && 'Quadratic subtraction (β²_s = β²_o - β²_i). Best for strain dominance.'}
                {broadeningModel === 'Lorentzian' && 'Linear subtraction (β_s = β_o - β_i). Best for small crystallite size dominance.'}
                {broadeningModel === 'Pseudo-Voigt' && 'Mixed Voigt decoupling: β_s = β_o (1 - (β_i/β_o)²). Optimal for general XRD.'}
                {broadeningModel === 'de Keijser' && 'Rigorous Voigt deconvolution separating Lorentzian (Size) & Gaussian (Microstrain RMS).'}
                {broadeningModel === 'Halder-Wagner' && 'Parabolic Voigt approximation (β_s / β_o)² = 1 - (β_i / β_o)². Simultaneous size/strain.'}
              </div>
            </div>

            {/* Resolution Profile (Instrument Broadening / Caglioti) */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Instrument Broadening (β_inst)
                  </label>
                </div>
                <div className="flex p-0.5 bg-black/40 rounded-lg border border-slate-700/50">
                   <button 
                     onClick={() => setUseCaglioti(false)}
                     className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all cursor-pointer ${!useCaglioti ? 'bg-amber-500 text-black font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Fixed
                   </button>
                   <button 
                     onClick={() => setUseCaglioti(true)}
                     className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all cursor-pointer ${useCaglioti ? 'bg-amber-500 text-black font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Caglioti
                   </button>
                </div>
              </div>

              {!useCaglioti ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={String(instFwhm) === 'NaN' ? '' : instFwhm}
                      onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm font-black transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">deg (β_inst)</span>
                  </div>
                  <div className="flex gap-1.5">
                     {[0, 0.05, 0.08, 0.12].map(val => (
                       <button 
                         key={val}
                         onClick={() => setInstFwhm(val)}
                         className={`flex-1 py-1 rounded-lg border text-[9px] font-mono font-black transition-all cursor-pointer ${instFwhm === val ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                       >
                         {val === 0 ? '0 (Raw)' : `${val}°`}
                       </button>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {CAGLIOTI_PRESETS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setCaglioti({ u: p.u, v: p.v, w: p.w })}
                        className={`px-2 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-tight text-center leading-tight transition-all cursor-pointer
                          ${caglioti.u === p.u ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}
                        `}
                      >
                        {p.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">U (tan²θ)</label>
                      <input 
                        type="number" step="0.001" value={String(caglioti.u) === 'NaN' ? '' : caglioti.u} 
                        onChange={(e) => setCaglioti({...caglioti, u: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1.5 bg-black/40 text-amber-400 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">V (tanθ)</label>
                      <input 
                        type="number" step="0.001" value={String(caglioti.v) === 'NaN' ? '' : caglioti.v} 
                        onChange={(e) => setCaglioti({...caglioti, v: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1.5 bg-black/40 text-amber-400 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">W (const)</label>
                      <input 
                        type="number" step="0.001" value={String(caglioti.w) === 'NaN' ? '' : caglioti.w} 
                        onChange={(e) => setCaglioti({...caglioti, w: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1.5 bg-black/40 text-amber-400 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Material Density Preset for SSA Calculation */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Material Density (ρ for SSA)
                  </label>
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-400">{materialDensity.toFixed(2)} g/cm³</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {MATERIAL_DENSITIES.slice(0, 6).map(mat => (
                  <button
                    key={mat.label}
                    onClick={() => {
                      setSelectedMaterial(mat.label);
                      setMaterialDensity(mat.density);
                    }}
                    className={`px-1.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-tight text-center transition-all cursor-pointer truncate
                      ${selectedMaterial === mat.label ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-300'}
                    `}
                  >
                    {mat.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={String(materialDensity) === 'NaN' ? '' : materialDensity}
                  onChange={(e) => {
                    setMaterialDensity(parseFloat(e.target.value) || 2.33);
                    setSelectedMaterial('Custom Density');
                  }}
                  className="w-full px-3 py-2 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-xl outline-none font-mono text-xs font-black"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500">g/cm³</span>
              </div>
            </div>

            {/* Peak Data Input & Presets */}
            <div className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                   <Database className="w-4 h-4 text-amber-400" />
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Diffraction Peaks
                   </label>
                </div>
                <span className="text-[8px] font-mono font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-slate-700/50">
                  2θ, FWHM, Int, h, k, l
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {SCHERRER_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setInputData(p.data);
                      setWavelength(p.wavelength);
                      setConstantK(p.k);
                      setSelectedKType(p.kLabel);
                      setMaterialDensity(p.density);
                      setSelectedMaterial(p.materialLabel);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-slate-800 hover:border-amber-500/30 hover:bg-black/60 transition-all text-left group/btn cursor-pointer"
                  >
                    <span className="text-base bg-slate-900 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-800 group-hover/btn:border-amber-500/20 shrink-0">
                      {p.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black text-slate-200 truncate">{p.name}</span>
                      <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider truncate">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.25, 100, 1, 1, 1&#10;47.30, 0.28, 45, 2, 2, 0"
                className="w-full h-28 px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/40 rounded-2xl focus:ring-2 focus:ring-amber-500/10 outline-none font-mono text-xs leading-relaxed resize-none transition-all shadow-inner custom-scrollbar"
                spellCheck={false}
              />
            </div>

            {/* Execute Analysis Action */}
            {!isSimulationRunning ? (
              <button
                onClick={handleCalculate}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="uppercase tracking-[0.2em] text-sm">Calculate Sizing & Microstructure</span>
              </button>
            ) : (
              <div className="bg-[#070D18] p-5 rounded-2xl border border-amber-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" /> Scherrer Analysis Running
                </h4>
                <div className="space-y-3 relative z-10 w-full flex flex-col">
                  {[
                    { step: 1, label: 'Evaluating Peak Centroids & (hkl)', icon: Database },
                    { step: 2, label: 'Deconvoluting Instrumental Kernel', icon: Settings },
                    { step: 3, label: 'Executing Scherrer & Voigt Decoupling', icon: Atom },
                    { step: 4, label: 'Computing Dislocation & Surface Density', icon: Zap },
                    { step: 5, label: 'Synthesizing Log-Normal Distribution', icon: Check }
                  ].map((s) => {
                     const Icon = s.icon;
                     const isActive = simulationStep === s.step;
                     const isDone = simulationStep > s.step;
                     return (
                       <div key={s.step} className={`flex items-center gap-3 w-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                         <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                           <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                             {s.label}
                           </span>
                           {isActive && <div className="h-0.5 bg-gradient-to-r from-amber-500 to-transparent w-full mt-1.5 animate-pulse rounded-full" />}
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Master Formula Context Card */}
        <div className="bg-[#050A14] p-6 rounded-3xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Theory & Formula</h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Master Scherrer Law</p>
              </div>
            </div>
            <button
              onClick={() => setIsDerivationModalOpen(true)}
              className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              Derivation Proof
            </button>
          </div>

          <div className="bg-[#0a0f16] p-3.5 rounded-2xl font-mono text-sm text-emerald-300 border border-emerald-900/40 text-center font-bold">
            D = (K · λ) / (β_sample · cosθ)
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block font-sans uppercase font-bold text-[8px]">Dislocation (δ):</span>
              <span className="text-amber-300 font-bold">δ = 1 / D²</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block font-sans uppercase font-bold text-[8px]">Specific Surface Area:</span>
              <span className="text-indigo-300 font-bold">SSA = 6000 / (ρ·D)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Results, Multi-View Charts, and Microstructural Databank */}
      <div className="lg:col-span-8 space-y-6">
        
        {results && results.length > 0 && results[0] && !results[0].error && (
          <ScientificMathControl
            title="Scherrer Equation Verification"
            formula="D = \frac{K \cdot \lambda}{\beta_{\text{sample}} \cdot \cos(\theta)}"
            description="Scientific mathematical verification showing exact values calculated for the primary resolved diffraction reflection."
            variables={[
              { symbol: 'K', name: 'Shape Factor', value: constantK, unit: '' },
              { symbol: 'λ', name: 'Wavelength', value: convertLength(wavelength, lengthUnit), unit: lengthUnit },
              { symbol: 'β', name: 'Corrected Sample Broadening', value: (results[0].betaCorrected * Math.PI / 180), unit: 'rad' },
              { symbol: 'θ', name: 'Bragg Angle', value: ((results[0].twoTheta / 2) * Math.PI / 180), unit: 'rad' }
            ]}
            result={results[0].sizeNm}
            resultUnit="nm"
            resultName="Crystallite Size (D)"
          />
        )}

        {/* Average Size Summary Card */}
        <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group/size-card">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute top-0 left-1/4 w-60 h-60 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* Summary Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/30 to-amber-600/10 rounded-2xl border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Zap className="h-5 w-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Mean Crystallite Sizing</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                    {stats.count} {stats.count === 1 ? 'Peak' : 'Peaks'} Resolved
                  </span>
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Microstructure Synthesis ({averageType === 'weighted' ? 'Intensity-Weighted Volume' : 'Arithmetic Peak Mean'})
                </p>
              </div>
            </div>

            {/* Actions: Copy & Regime Tag */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${
                avgSize < 10 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' :
                avgSize < 50 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                avgSize < 100 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                avgSize < 200 ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                'bg-slate-500/20 border-slate-500/40 text-slate-300'
              }`}>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {avgSize < 10 ? 'Quantum Domain (<10nm)' : 
                   avgSize < 50 ? 'Fine Nanoparticle (10-50nm)' : 
                   avgSize < 100 ? 'Medium Nanocrystal (50-100nm)' : 
                   avgSize < 200 ? 'Sub-Micron Domain (100-200nm)' : 'Bulk Limit (>200nm)'}
                </span>
              </div>

              <button
                onClick={() => {
                  const summaryStr = `Scherrer Mean Crystallite Size: ${avgSize.toFixed(precision)} nm (±${stats.stdDev.toFixed(2)} nm, N=${stats.count} reflections, K=${constantK}, λ=${wavelength} Å, SSA=${stats.avgSSA.toFixed(1)} m²/g, δ=${stats.avgDislocation10_14.toFixed(2)}×10¹⁴ m⁻²)`;
                  navigator.clipboard.writeText(summaryStr);
                  setCopiedSummary(true);
                  setTimeout(() => setCopiedSummary(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Copy comprehensive summary metrics to clipboard"
              >
                {copiedSummary ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Grid: Hero Metric + Key Microstructural Properties */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Hero Size Badge */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-3 bg-black/50 p-5 rounded-2xl border border-amber-500/20 shadow-inner">
              <span className="text-[9px] font-black text-amber-500/90 uppercase tracking-[0.25em]">Mean Crystallite Size (D)</span>
              
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter" style={{ textShadow: '0 0 25px rgba(245,158,11,0.25)' }}>
                  {avgSize.toFixed(precision)}
                </span>
                <span className="text-2xl font-black text-amber-400 font-mono">nm</span>
              </div>

              {/* Unit conversions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                  {(avgSize * 10).toFixed(Math.max(1, precision - 1))} Å
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {(avgSize * 1000).toFixed(0)} pm
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {(avgSize / 1000).toFixed(4)} µm
                </span>
              </div>
            </div>

            {/* 4 Microstructural Property Cards */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Dislocation Density (δ)</span>
                <span className="text-sm font-mono font-bold text-amber-300">{stats.avgDislocation10_14.toFixed(2)}</span>
                <span className="text-[9px] text-slate-500 block font-mono">×10¹⁴ m⁻²</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Specific Surface (SSA)</span>
                <span className="text-sm font-mono font-bold text-emerald-300">{stats.avgSSA.toFixed(1)}</span>
                <span className="text-[9px] text-slate-500 block font-mono">m² / g</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Coherent Planes (N)</span>
                <span className="text-sm font-mono font-bold text-indigo-300">~{stats.avgCoherentPlanes}</span>
                <span className="text-[9px] text-slate-500 block font-mono">lattice layers</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Anisotropy Ratio</span>
                <span className="text-sm font-mono font-bold text-purple-300">{stats.anisotropyIndex.toFixed(2)}:1</span>
                <span className="text-[9px] text-slate-500 block font-mono">D_max / D_min</span>
              </div>
            </div>
          </div>

          {/* Statistical Averages Bar & Method Selector */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Averaging Method:</span>
              <div className="flex bg-black/60 p-1 rounded-xl border border-slate-800 gap-1">
                <button
                  onClick={() => setAverageType('weighted')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    averageType === 'weighted'
                      ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Intensity Weighted</span>
                  <span className="font-mono text-[9px]">({exactWeighted.toFixed(1)} nm)</span>
                </button>
                <button
                  onClick={() => setAverageType('arithmetic')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    averageType === 'arithmetic'
                      ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Arithmetic Mean</span>
                  <span className="font-mono text-[9px]">({exactArithmetic.toFixed(1)} nm)</span>
                </button>
              </div>
            </div>

            {/* Volume-Weighted & Area-Weighted Display */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>D_V: <strong className="text-amber-300">{volumeWeighted.toFixed(1)} nm</strong></span>
              <span className="text-slate-600">•</span>
              <span>D_A: <strong className="text-indigo-300">{areaWeighted.toFixed(1)} nm</strong></span>
            </div>
          </div>
        </div>

        {/* Multi-Tab Visualization Panels (Histogram, Trend vs 2θ, Microstructure, Anisotropy) */}
        {results.length > 0 && validResults.length > 0 && (
          <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            {/* View Selector Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                  <BarChart2 className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Crystallite Visualizer & Diagnostics</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Multi-Peak Distribution & Facet Profiles</p>
                </div>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
                {[
                  { id: 'histogram', label: 'Size Distribution & PDF', icon: BarChart2 },
                  { id: 'trend', label: 'Size vs 2θ & Inst. Limit', icon: TrendingUp },
                  { id: 'microstructure', label: 'Dislocation & SSA', icon: Zap },
                  { id: 'anisotropy', label: 'Anisotropic (hkl) Facets', icon: Compass }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = chartViewMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setChartViewMode(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: Size Distribution with Fitted Log-Normal PDF */}
            {chartViewMode === 'histogram' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Log-Normal Median: <strong className="text-indigo-400">{geometricMean.toFixed(1)} nm</strong> (σ_g = {geometricStdDev.toFixed(2)})</span>
                  <span>Spread: <strong className="text-amber-400">±{stats.stdDev.toFixed(1)} nm</strong> ({stats.relDispersion.toFixed(1)}%)</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="center" 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Crystallite Size [nm]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Peak Count / Frequency', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono">
                                <p className="text-slate-400 uppercase font-bold text-[9px] mb-1">Range: {data.name}</p>
                                <p className="text-indigo-400 font-bold">Observed Count: {data.count} Peaks</p>
                                <p className="text-amber-400">Fitted Log-Normal PDF: {data.fittedPdf}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                      <Bar name="Observed Peak Count" dataKey="count" fill="rgba(99, 102, 241, 0.85)" radius={[4, 4, 0, 0]} />
                      <Line name="Log-Normal Fit Curve" type="monotone" dataKey="fittedPdf" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 2: Crystallite Size vs 2θ Bragg Angle */}
            {chartViewMode === 'trend' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Instrumental Decoupling Threshold (<strong className="text-rose-400">dashed red line</strong>)</span>
                  <span>Scherrer Size Points vs 2θ</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sizeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="twoTheta" 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        unit="°"
                        label={{ value: 'Diffraction Angle 2θ [°]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        label={{ value: 'Size [nm]', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                                <p className="text-white font-bold">{d.label}</p>
                                <p className="text-amber-400 font-bold">Crystallite Size: {d.sizeNm} nm</p>
                                <p className="text-slate-400">Observed FWHM: {d.fwhmObs}°</p>
                                <p className="text-indigo-400">d-Spacing: {d.dSpacing} Å ({d.planes} planes)</p>
                                <p className="text-rose-400">Inst. Limit: {d.instLimitNm} nm</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                      <Line name="Crystallite Size [nm]" type="monotone" dataKey="sizeNm" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: '#10b981' }} />
                      <Line name="Inst. Resolution Limit [nm]" type="monotone" dataKey="instLimitNm" stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 3: Microstructural Dislocation & Surface Area */}
            {chartViewMode === 'microstructure' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Dislocation Density δ (lines/m²) & Specific Surface Area (m²/g)</span>
                  <span>Density: <strong>{materialDensity} g/cm³</strong></span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sizeTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="twoTheta" 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        unit="°"
                        label={{ value: '2θ [°]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: '#f59e0b', fontSize: 10, fontFamily: 'monospace' }}
                        label={{ value: 'Dislocation δ [10¹⁴ m⁻²]', angle: -90, position: 'insideLeft', offset: 15, fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                        label={{ value: 'SSA [m²/g]', angle: 90, position: 'insideRight', offset: 15, fill: '#06b6d4', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                                <p className="text-white font-bold">{d.label}</p>
                                <p className="text-amber-400 font-bold">Dislocation (δ): {d.dislocation} × 10¹⁴ m⁻²</p>
                                <p className="text-cyan-400 font-bold">Specific Surface Area: {d.ssa} m²/g</p>
                                <p className="text-emerald-400">Coherent Planes: ~{d.planes}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                      <Bar yAxisId="left" name="Dislocation δ [10¹⁴ m⁻²]" dataKey="dislocation" fill="rgba(245, 158, 11, 0.8)" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" name="Specific Surface Area [m²/g]" type="monotone" dataKey="ssa" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 4: Anisotropic (hkl) Facet Breakdown */}
            {chartViewMode === 'anisotropy' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Crystallite Size by Lattice Direction (D_hkl)</span>
                  <span>Anisotropy Index: <strong className="text-purple-400">{stats.anisotropyIndex.toFixed(2)}</strong></span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anisotropyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                        label={{ value: 'Lattice Facet / Reflection', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        label={{ value: 'D_hkl [nm]', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                                <p className="text-white font-bold">{d.name} @ {d.twoTheta}°</p>
                                <p className="text-purple-400 font-bold">Directional Size: {d.size} nm</p>
                                <p className="text-slate-400">d-Spacing: {d.dSpacing} Å ({d.planes} planes)</p>
                                <p className={d.relDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  Deviation from Mean: {d.relDiff > 0 ? `+${d.relDiff}` : d.relDiff}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={avgSize} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Mean: ${avgSize.toFixed(1)}nm`, fill: '#f59e0b', fontSize: 10 }} />
                      <Bar dataKey="size" fill="rgba(168, 85, 247, 0.85)" radius={[4, 4, 0, 0]}>
                        {anisotropyData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.size >= avgSize ? 'rgba(168, 85, 247, 0.9)' : 'rgba(99, 102, 241, 0.9)'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Morphology Visualizer & WH Strain Triage Card */}
        {results.length > 0 && validResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morphological 3D Visualizer */}
            <div className="bg-[#050b14] border border-blue-900/30 rounded-3xl p-6 shadow-2xl relative flex flex-col h-60 overflow-hidden group">
              <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 relative z-10">
                <Atom className="w-3.5 h-3.5" /> Morphological Simulation
              </h3>
              <div className="flex-1 w-full relative z-10 border border-blue-900/40 rounded-xl bg-black/40 overflow-hidden">
                <MorphologyVisualizer kType={selectedKType} sizeNm={avgSize} />
              </div>
            </div>

            {/* Williamson-Hall Strain Triage Assessment */}
            <div className={`rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between ${
              whStrainTriage.slope > 0.0002 
                ? 'bg-[#1a0f14] border border-rose-900/40' 
                : 'bg-[#0a1410] border border-emerald-900/40'
            }`}>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2">
                   <Activity className={`w-4 h-4 ${whStrainTriage.slope > 0.0002 ? 'text-rose-400' : 'text-emerald-400'}`} />
                   <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Strain Triage & Validity</h3>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-widest ${
                  whStrainTriage.slope > 0.0002 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  R² = {whStrainTriage.rSquared.toFixed(2)}
                </span>
              </div>
              
              {whStrainTriage.slope > 0.0002 ? (
                <div className="relative z-10 bg-black/30 p-3.5 rounded-xl border border-rose-900/30 space-y-2">
                  <p className="text-xs text-rose-200/80 font-medium leading-relaxed">
                    Lattice microstrain detected (<span className="font-mono text-rose-400 font-bold">ε ≈ {(whStrainTriage.slope * 100).toPrecision(2)}%</span>). Scherrer model may underestimate true crystallite dimensions due to uncoupled microstrain.
                  </p>
                  <div className="text-[9px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                     <Zap className="w-3 h-3" /> Deconvolution Model Recommended
                  </div>
                </div>
              ) : (
                <div className="relative z-10 bg-black/30 p-3.5 rounded-xl border border-emerald-900/30 space-y-2">
                  <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
                    Microstrain is negligible (<span className="font-mono text-emerald-400 font-bold">ε &lt; 0.02%</span>). Pure size-broadening assumption is physically sound with high confidence.
                  </p>
                  <div className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                     <Check className="w-3 h-3" /> High Physical Validity
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Python Exporter */}
        {results.length > 0 && (
          <PythonCodeExporter 
            methodName="Scherrer Particle Sizing"
            parameters={{
              wavelength: Number(wavelength),
              twoTheta: results.map(r => r.twoTheta),
              beta: results.map(r => r.fwhmObs),
              shapeFactor: Number(constantK)
            }}
          />
        )}

        {/* Detailed Analytical Databank Table */}
        <div className="bg-[#050A14] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[350px] relative group">
          <div className="p-6 border-b border-slate-800 bg-black/40 flex justify-between items-center backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1">Analytical Databank</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Peak-by-peak Resolution & Microstructure</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={results.length === 0}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-black rounded-xl transition-all border border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed group/save shadow-inner uppercase tracking-widest cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                Export CSV
              </button>
            </div>
            {results.some(r => r.error) && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
                <span>Boundary Overflow Warnings</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
             {results.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-8 text-center bg-slate-900/50 border border-slate-800/40 rounded-2xl m-6 border-dashed">
                 <Ruler className="w-8 h-8 text-slate-700 mb-3" />
                 <p className="text-[11px] font-bold uppercase tracking-widest">Input diffraction peaks above to execute analysis</p>
               </div>
             ) : (
              <table className="w-full text-left text-slate-300 border-collapse text-xs">
                <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950/90 sticky top-0 backdrop-blur-xl z-20 border-b border-slate-800">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-black">2θ [deg]</th>
                    <th scope="col" className="px-5 py-4 font-black">(hkl)</th>
                    <th scope="col" className="px-5 py-4 font-black">d-Spacing [Å]</th>
                    <th scope="col" className="px-5 py-4 font-black">FWHM Obs [°]</th>
                    <th scope="col" className="px-5 py-4 font-black">β_corr [°]</th>
                    <th scope="col" className="px-5 py-4 font-black">Dislocation (δ)</th>
                    <th scope="col" className="px-5 py-4 font-black">SSA [m²/g]</th>
                    <th scope="col" className="px-5 py-4 font-black text-right"><span className="text-amber-400 font-extrabold">Size D [nm]</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {results.map((row, index) => (
                    <tr key={`${row.twoTheta}-${index}`} className="bg-slate-900/10 hover:bg-slate-800/30 transition-all">
                      <td className="px-5 py-3.5 font-mono text-sm font-bold text-white">{row.twoTheta.toFixed(precision)}°</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-400">
                        {row.hkl ? `(${row.hkl.join('')})` : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {row.dSpacing ? `${row.dSpacing.toFixed(3)} Å` : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{row.fwhmObs.toFixed(precision)}°</td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{row.betaCorrected.toFixed(precision)}°</td>
                      <td className="px-5 py-3.5 font-mono text-amber-300">
                        {row.dislocationDensity10_14 ? `${row.dislocationDensity10_14.toFixed(2)} ×10¹⁴` : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-cyan-300">
                        {row.specificSurfaceAreaM2g ? `${row.specificSurfaceAreaM2g.toFixed(1)}` : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {row.error ? (
                          <span className="text-rose-400 text-[10px] font-black bg-rose-500/10 px-2.5 py-1 rounded-md uppercase tracking-widest inline-block whitespace-nowrap border border-rose-500/20">
                            Limit Exceeded
                          </span>
                        ) : (
                          <span className="bg-[#0f1520] text-amber-400 font-mono font-black text-sm px-3 py-1.5 rounded-xl border border-amber-900/30 inline-block">
                            {row.sizeNm.toFixed(precision)} nm
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             )}
          </div>
        </div>
      </div>

      {/* Interactive Mathematical Derivation Modal with Finite-Lattice Simulator */}
      <AnimatePresence>
        {isDerivationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Scherrer Derivation & Physics Proof</h2>
                    <p className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">Theoretical Derivation & Multi-Slit Interference Simulator</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDerivationModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-8 text-slate-300 text-sm leading-relaxed custom-scrollbar">
                
                {/* Intro Card */}
                <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5 rounded-2xl border border-emerald-500/20">
                  <p className="text-slate-200 leading-relaxed">
                    The Scherrer formula is an analytical approximation relating the average size of sub-micrometer crystallites (<span className="text-amber-400 font-mono font-bold">D</span>) in a powder sample to the broadening of the diffraction peak (<span className="text-emerald-400 font-mono font-bold">β</span>). It was first derived by Paul Scherrer in 1918. Below is the full mathematical and wave interference proof.
                  </p>
                </div>

                {/* Interactive Wave Interference Simulator */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Interactive Finite-Lattice Interference Simulator
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">Total Thickness D = </span>
                      <strong className="text-amber-400">{(simPlaneCount * simDSpacing / 10).toFixed(2)} nm</strong>
                      <span className="text-slate-500">({simPlaneCount} planes × {simDSpacing} Å)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1 text-slate-400 font-bold">
                        <span>Lattice Plane Count (N):</span>
                        <span className="text-indigo-400 font-mono font-black">{simPlaneCount} planes</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="80" 
                        value={simPlaneCount}
                        onChange={(e) => setSimPlaneCount(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-slate-400 font-bold">
                        <span>Interplanar Spacing (d):</span>
                        <span className="text-emerald-400 font-mono font-black">{simDSpacing.toFixed(3)} Å</span>
                      </div>
                      <input 
                        type="range" 
                        min="1.0" 
                        max="5.0" 
                        step="0.05"
                        value={simDSpacing}
                        onChange={(e) => setSimDSpacing(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Simulated Profile Chart */}
                  <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={simDiffractionProfile.points} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="twoTheta" tick={{ fill: '#64748b', fontSize: 9 }} unit="°" />
                        <YAxis tick={{ fill: '#64748b', fontSize: 9 }} domain={[0, 105]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                          formatter={(val: any) => [`${val}%`, 'Intensity']}
                          labelFormatter={(l) => `2θ = ${l}°`}
                        />
                        <Area type="monotone" dataKey="intensity" fill="#6366f1" stroke="#6366f1" fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-mono">
                    Predicted Scherrer FWHM for N={simPlaneCount} planes: <strong className="text-amber-400">β ≈ {simDiffractionProfile.expectedFwhm}°</strong>. As N decreases, the peak broadens!
                  </p>
                </div>

                {/* Section 1: Physical Setup */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    1. Physical Setup & Bragg Scattering
                  </h3>
                  <p>
                    Consider a crystalline domain of finite thickness <span className="font-mono text-slate-100">$D$</span> composed of <span className="font-mono text-slate-100">$N$</span> parallel lattice planes separated by an interplanar spacing <span className="font-mono text-slate-100">$d$</span>:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.crystalliteThickness }} />
                  <p>
                    When monochromatic X-rays of wavelength <span className="font-mono text-slate-100">$\lambda$</span> impinge on these planes, the first-order peak occurs at the exact Bragg angle <span className="font-mono text-emerald-400 font-bold">$\theta_0$</span>:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.braggLawOrder1 }} />
                </div>

                {/* Section 2: Destructive Boundaries */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    2. Peak Broadening & Zero-Intensity Boundaries
                  </h3>
                  <p>
                    For an infinite crystal, diffraction occurs strictly at <span className="font-mono text-slate-100">$\theta_0$</span>. For a finite crystal of $N$ planes, intensity drops to zero at the angular boundaries $\theta_1$ and $\theta_2$ where waves from opposite crystal halves cancel:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.finiteSize1 }} />
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.finiteSize2 }} />
                  </div>
                </div>

                {/* Section 3: Trigonometric Operations */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    3. Trigonometric Identities & Small-Angle Approximation
                  </h3>
                  <p>
                    Subtracting the boundary conditions removes the $N$ offset:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.reducedSub }} />
                  <p>
                    Applying the sum-to-product trigonometric identity with small angle approximation $\sin(\Delta\theta) \approx \Delta\theta$:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.combinedtrig }} />
                </div>

                {/* Section 4: Final Formulation with K Factor */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    4. Master Equation & Scherrer Constant (K)
                  </h3>
                  <p>
                    Substituting back with $D = N \cdot d$ and FWHM $\beta \approx 2\Delta\theta$, we incorporate the crystal shape factor <span className="text-amber-400 font-bold">$K$</span>:
                  </p>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 shadow-md text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: formulas.shapeFactorK }} />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                <button
                  onClick={() => setIsDerivationModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white uppercase tracking-wider rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
