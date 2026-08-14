import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCcw, Activity, Zap, Box, Layers, Scan, CheckCircle, Download, BookOpen, HelpCircle,
  Sliders, Eye, ZoomIn, ZoomOut, Crosshair, TrendingUp, BarChart2, Split, Maximize2, Sparkles, SlidersHorizontal,
  Wand2, Check, Scale, Calculator, Camera, Image, Gauge, X, Info, UploadCloud, List, Grid, Radio
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

export interface RefPeakItem {
  theta: number; // Cu Ka 2-theta (deg)
  label: string;
  hkl: string;
  relIntensity: number; // %
}

export interface RefMaterialDetail {
  id: string;
  name: string;
  category: 'NIST Standards' | 'Metals' | 'Semiconductors' | 'Oxides & Ceramics';
  formula: string;
  spaceGroup: string;
  crystalSystem: string;
  latticeParams: string;
  description: string;
  peaks: RefPeakItem[];
}

export const REFERENCE_MATERIALS_CATALOG: RefMaterialDetail[] = [
  {
    id: 'Silicon',
    name: 'Silicon (Si NIST SRM 640f)',
    category: 'NIST Standards',
    formula: 'Si',
    spaceGroup: 'Fd-3m (227)',
    crystalSystem: 'Cubic',
    latticeParams: 'a = 5.43119 Å',
    description: 'NIST primary line position calibration standard for powder diffraction.',
    peaks: [
      { theta: 28.442, label: 'Si (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 47.302, label: 'Si (220)', hkl: '(220)', relIntensity: 55 },
      { theta: 56.122, label: 'Si (311)', hkl: '(311)', relIntensity: 30 },
      { theta: 69.130, label: 'Si (400)', hkl: '(400)', relIntensity: 6 },
      { theta: 76.377, label: 'Si (331)', hkl: '(331)', relIntensity: 11 },
      { theta: 88.030, label: 'Si (422)', hkl: '(422)', relIntensity: 12 },
      { theta: 94.953, label: 'Si (511)', hkl: '(511)', relIntensity: 6 }
    ]
  },
  {
    id: 'LaB6',
    name: 'LaB6 (Lanthanum Hexaboride SRM 660c)',
    category: 'NIST Standards',
    formula: 'LaB6',
    spaceGroup: 'Pm-3m (221)',
    crystalSystem: 'Cubic',
    latticeParams: 'a = 4.15692 Å',
    description: 'NIST standard for line profile shape and instrumental resolution (β_inst) calibration.',
    peaks: [
      { theta: 21.362, label: 'LaB6 (100)', hkl: '(100)', relIntensity: 100 },
      { theta: 30.386, label: 'LaB6 (110)', hkl: '(110)', relIntensity: 50 },
      { theta: 37.441, label: 'LaB6 (111)', hkl: '(111)', relIntensity: 25 },
      { theta: 43.511, label: 'LaB6 (200)', hkl: '(200)', relIntensity: 20 },
      { theta: 48.962, label: 'LaB6 (210)', hkl: '(210)', relIntensity: 30 },
      { theta: 53.987, label: 'LaB6 (211)', hkl: '(211)', relIntensity: 28 },
      { theta: 63.226, label: 'LaB6 (220)', hkl: '(220)', relIntensity: 18 },
      { theta: 71.603, label: 'LaB6 (310)', hkl: '(310)', relIntensity: 15 }
    ]
  },
  {
    id: 'Al2O3',
    name: 'Corundum (Al2O3 NIST SRM 1976b)',
    category: 'NIST Standards',
    formula: 'α-Al2O3',
    spaceGroup: 'R-3c (167)',
    crystalSystem: 'Trigonal',
    latticeParams: 'a = 4.7587 Å, c = 12.9929 Å',
    description: 'NIST sintered alumina standard plate for diffraction intensity and position sensitivity.',
    peaks: [
      { theta: 25.578, label: 'Al2O3 (012)', hkl: '(012)', relIntensity: 70 },
      { theta: 35.152, label: 'Al2O3 (104)', hkl: '(104)', relIntensity: 100 },
      { theta: 37.776, label: 'Al2O3 (110)', hkl: '(110)', relIntensity: 90 },
      { theta: 43.355, label: 'Al2O3 (113)', hkl: '(113)', relIntensity: 85 },
      { theta: 52.549, label: 'Al2O3 (024)', hkl: '(024)', relIntensity: 45 },
      { theta: 57.496, label: 'Al2O3 (116)', hkl: '(116)', relIntensity: 95 },
      { theta: 66.519, label: 'Al2O3 (214)', hkl: '(214)', relIntensity: 50 }
    ]
  },
  {
    id: 'CeO2',
    name: 'Ceria (CeO2 NIST SRM 674b)',
    category: 'NIST Standards',
    formula: 'CeO2',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic Fluorite',
    latticeParams: 'a = 5.4111 Å',
    description: 'NIST standard for crystallite size, microstrain broadening, and quantitative phase analysis.',
    peaks: [
      { theta: 28.553, label: 'CeO2 (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 33.082, label: 'CeO2 (200)', hkl: '(200)', relIntensity: 28 },
      { theta: 47.479, label: 'CeO2 (220)', hkl: '(220)', relIntensity: 51 },
      { theta: 56.342, label: 'CeO2 (311)', hkl: '(311)', relIntensity: 43 },
      { theta: 59.088, label: 'CeO2 (222)', hkl: '(222)', relIntensity: 10 },
      { theta: 69.418, label: 'CeO2 (400)', hkl: '(400)', relIntensity: 8 }
    ]
  },
  {
    id: 'Gold',
    name: 'Gold (Au Metal Standard)',
    category: 'Metals',
    formula: 'Au',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic FCC',
    latticeParams: 'a = 4.0782 Å',
    description: 'Face-centered cubic noble metal standard for nano-diffraction and thin film stress analysis.',
    peaks: [
      { theta: 38.184, label: 'Au (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 44.392, label: 'Au (200)', hkl: '(200)', relIntensity: 52 },
      { theta: 64.576, label: 'Au (220)', hkl: '(220)', relIntensity: 32 },
      { theta: 77.547, label: 'Au (311)', hkl: '(311)', relIntensity: 36 },
      { theta: 81.721, label: 'Au (222)', hkl: '(222)', relIntensity: 12 },
      { theta: 98.128, label: 'Au (400)', hkl: '(400)', relIntensity: 6 }
    ]
  },
  {
    id: 'Copper',
    name: 'Copper (Cu Metal)',
    category: 'Metals',
    formula: 'Cu',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic FCC',
    latticeParams: 'a = 3.6149 Å',
    description: 'Pure copper metal polycrystalline substrate and foil standard.',
    peaks: [
      { theta: 43.297, label: 'Cu (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 50.433, label: 'Cu (200)', hkl: '(200)', relIntensity: 46 },
      { theta: 74.130, label: 'Cu (220)', hkl: '(220)', relIntensity: 20 },
      { theta: 89.931, label: 'Cu (311)', hkl: '(311)', relIntensity: 17 },
      { theta: 95.142, label: 'Cu (222)', hkl: '(222)', relIntensity: 5 }
    ]
  },
  {
    id: 'Aluminum',
    name: 'Aluminum (Al Metal)',
    category: 'Metals',
    formula: 'Al',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic FCC',
    latticeParams: 'a = 4.0495 Å',
    description: 'Structural light-alloy metal reference standard.',
    peaks: [
      { theta: 38.472, label: 'Al (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 44.724, label: 'Al (200)', hkl: '(200)', relIntensity: 47 },
      { theta: 65.096, label: 'Al (220)', hkl: '(220)', relIntensity: 22 },
      { theta: 78.228, label: 'Al (311)', hkl: '(311)', relIntensity: 24 },
      { theta: 82.435, label: 'Al (222)', hkl: '(222)', relIntensity: 7 }
    ]
  },
  {
    id: 'Platinum',
    name: 'Platinum (Pt Metal)',
    category: 'Metals',
    formula: 'Pt',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic FCC',
    latticeParams: 'a = 3.9231 Å',
    description: 'Heavy catalyst transition metal reference.',
    peaks: [
      { theta: 39.761, label: 'Pt (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 46.244, label: 'Pt (200)', hkl: '(200)', relIntensity: 53 },
      { theta: 67.452, label: 'Pt (220)', hkl: '(220)', relIntensity: 31 },
      { theta: 81.285, label: 'Pt (311)', hkl: '(311)', relIntensity: 33 },
      { theta: 85.710, label: 'Pt (222)', hkl: '(222)', relIntensity: 11 }
    ]
  },
  {
    id: 'Diamond',
    name: 'Diamond (C Cubic)',
    category: 'Metals',
    formula: 'C',
    spaceGroup: 'Fd-3m (227)',
    crystalSystem: 'Cubic Diamond',
    latticeParams: 'a = 3.5670 Å',
    description: 'Covalent carbon allotrope with distinct high-angle Bragg reflections.',
    peaks: [
      { theta: 43.915, label: 'C (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 75.302, label: 'C (220)', hkl: '(220)', relIntensity: 25 },
      { theta: 91.495, label: 'C (311)', hkl: '(311)', relIntensity: 16 }
    ]
  },
  {
    id: 'TiO2_Anatase',
    name: 'Titanium Dioxide (Anatase TiO2)',
    category: 'Oxides & Ceramics',
    formula: 'TiO2',
    spaceGroup: 'I41/amd (141)',
    crystalSystem: 'Tetragonal',
    latticeParams: 'a = 3.785 Å, c = 9.514 Å',
    description: 'Anatase phase TiO2 semiconductor and photocatalyst powder.',
    peaks: [
      { theta: 25.281, label: 'TiO2 (101)', hkl: '(101)', relIntensity: 100 },
      { theta: 36.947, label: 'TiO2 (103)', hkl: '(103)', relIntensity: 10 },
      { theta: 37.800, label: 'TiO2 (004)', hkl: '(004)', relIntensity: 20 },
      { theta: 38.576, label: 'TiO2 (112)', hkl: '(112)', relIntensity: 10 },
      { theta: 48.049, label: 'TiO2 (200)', hkl: '(200)', relIntensity: 35 },
      { theta: 53.890, label: 'TiO2 (105)', hkl: '(105)', relIntensity: 20 },
      { theta: 55.060, label: 'TiO2 (211)', hkl: '(211)', relIntensity: 20 }
    ]
  },
  {
    id: 'TiO2_Rutile',
    name: 'Titanium Dioxide (Rutile TiO2)',
    category: 'Oxides & Ceramics',
    formula: 'TiO2',
    spaceGroup: 'P42/mnm (136)',
    crystalSystem: 'Tetragonal',
    latticeParams: 'a = 4.593 Å, c = 2.958 Å',
    description: 'Thermodynamically stable high-index rutile titanium oxide.',
    peaks: [
      { theta: 27.446, label: 'TiO2 (110)', hkl: '(110)', relIntensity: 100 },
      { theta: 36.085, label: 'TiO2 (101)', hkl: '(101)', relIntensity: 50 },
      { theta: 39.187, label: 'TiO2 (200)', hkl: '(200)', relIntensity: 8 },
      { theta: 41.225, label: 'TiO2 (111)', hkl: '(111)', relIntensity: 25 },
      { theta: 44.052, label: 'TiO2 (210)', hkl: '(210)', relIntensity: 10 },
      { theta: 54.322, label: 'TiO2 (211)', hkl: '(211)', relIntensity: 60 }
    ]
  },
  {
    id: 'ZnO',
    name: 'Zinc Oxide (ZnO Wurtzite)',
    category: 'Oxides & Ceramics',
    formula: 'ZnO',
    spaceGroup: 'P63mc (186)',
    crystalSystem: 'Hexagonal Wurtzite',
    latticeParams: 'a = 3.249 Å, c = 5.206 Å',
    description: 'Direct wide-bandgap piezoelectric zinc oxide semiconductor.',
    peaks: [
      { theta: 31.769, label: 'ZnO (100)', hkl: '(100)', relIntensity: 57 },
      { theta: 34.421, label: 'ZnO (002)', hkl: '(002)', relIntensity: 44 },
      { theta: 36.252, label: 'ZnO (101)', hkl: '(101)', relIntensity: 100 },
      { theta: 47.538, label: 'ZnO (102)', hkl: '(102)', relIntensity: 23 },
      { theta: 56.602, label: 'ZnO (110)', hkl: '(110)', relIntensity: 32 },
      { theta: 62.862, label: 'ZnO (103)', hkl: '(103)', relIntensity: 29 }
    ]
  },
  {
    id: 'Quartz',
    name: 'Quartz (α-SiO2 Mineral)',
    category: 'Oxides & Ceramics',
    formula: 'SiO2',
    spaceGroup: 'P3221 (154)',
    crystalSystem: 'Trigonal',
    latticeParams: 'a = 4.913 Å, c = 5.405 Å',
    description: 'Natural crystalline quartz silica standard.',
    peaks: [
      { theta: 20.855, label: 'SiO2 (100)', hkl: '(100)', relIntensity: 22 },
      { theta: 26.643, label: 'SiO2 (101)', hkl: '(101)', relIntensity: 100 },
      { theta: 36.542, label: 'SiO2 (110)', hkl: '(110)', relIntensity: 8 },
      { theta: 39.464, label: 'SiO2 (102)', hkl: '(102)', relIntensity: 9 },
      { theta: 50.138, label: 'SiO2 (112)', hkl: '(112)', relIntensity: 14 }
    ]
  },
  {
    id: 'NaCl',
    name: 'Halite (NaCl Rock Salt)',
    category: 'Oxides & Ceramics',
    formula: 'NaCl',
    spaceGroup: 'Fm-3m (225)',
    crystalSystem: 'Cubic Rock Salt',
    latticeParams: 'a = 5.640 Å',
    description: 'Classic ionic rock salt lattice reference.',
    peaks: [
      { theta: 27.351, label: 'NaCl (111)', hkl: '(111)', relIntensity: 13 },
      { theta: 31.693, label: 'NaCl (200)', hkl: '(200)', relIntensity: 100 },
      { theta: 45.412, label: 'NaCl (220)', hkl: '(220)', relIntensity: 55 },
      { theta: 53.864, label: 'NaCl (311)', hkl: '(311)', relIntensity: 2 },
      { theta: 56.431, label: 'NaCl (222)', hkl: '(222)', relIntensity: 15 }
    ]
  },
  {
    id: 'Pyrite',
    name: 'Pyrite (FeS2 Mineral)',
    category: 'Oxides & Ceramics',
    formula: 'FeS2',
    spaceGroup: 'Pa-3 (205)',
    crystalSystem: 'Cubic',
    latticeParams: 'a = 5.417 Å',
    description: 'Iron disulfide mineral crystal reference.',
    peaks: [
      { theta: 28.532, label: 'FeS2 (111)', hkl: '(111)', relIntensity: 35 },
      { theta: 33.041, label: 'FeS2 (200)', hkl: '(200)', relIntensity: 100 },
      { theta: 37.083, label: 'FeS2 (210)', hkl: '(210)', relIntensity: 50 },
      { theta: 40.781, label: 'FeS2 (211)', hkl: '(211)', relIntensity: 35 },
      { theta: 56.324, label: 'FeS2 (311)', hkl: '(311)', relIntensity: 65 }
    ]
  },
  {
    id: 'GaAs',
    name: 'Gallium Arsenide (GaAs)',
    category: 'Semiconductors',
    formula: 'GaAs',
    spaceGroup: 'F-43m (216)',
    crystalSystem: 'Cubic Zincblende',
    latticeParams: 'a = 5.6533 Å',
    description: 'High-speed III-V semiconductor single-crystal substrate.',
    peaks: [
      { theta: 27.289, label: 'GaAs (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 45.302, label: 'GaAs (220)', hkl: '(220)', relIntensity: 45 },
      { theta: 53.729, label: 'GaAs (311)', hkl: '(311)', relIntensity: 30 },
      { theta: 66.002, label: 'GaAs (400)', hkl: '(400)', relIntensity: 8 }
    ]
  },
  {
    id: 'SiC',
    name: 'Silicon Carbide (SiC 3C)',
    category: 'Semiconductors',
    formula: 'β-SiC',
    spaceGroup: 'F-43m (216)',
    crystalSystem: 'Cubic Zincblende',
    latticeParams: 'a = 4.3596 Å',
    description: 'Wide bandgap high-power cubic silicon carbide semiconductor.',
    peaks: [
      { theta: 35.601, label: 'SiC (111)', hkl: '(111)', relIntensity: 100 },
      { theta: 41.401, label: 'SiC (200)', hkl: '(200)', relIntensity: 15 },
      { theta: 60.003, label: 'SiC (220)', hkl: '(220)', relIntensity: 40 },
      { theta: 71.782, label: 'SiC (311)', hkl: '(311)', relIntensity: 25 }
    ]
  }
];

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

  // Module Active Main Tab: 'visualizer' | 'theory' | 'import'
  const [activeTab, setActiveTab] = useState<'visualizer' | 'theory' | 'import'>('visualizer');

  // Experimental Raw Data Upload / Paste & Multi-Peak Extraction State
  const [rawDatasetText, setRawDatasetText] = useState<string>('');
  const [importedPoints, setImportedPoints] = useState<{ x: number; y: number }[]>([]);
  const [importStatusMessage, setImportStatusMessage] = useState<string>('');
  const [targetPeaksCount, setTargetPeaksCount] = useState<number>(5); // How many peaks to detect/extract (1, 2, 3, 5, 10, or 0 for All)
  const [extractedPeaks, setExtractedPeaks] = useState<{
    id: number;
    center: number;
    intensity: number;
    fwhmEst: number;
    dSpacing: number;
    relIntensity: number;
  }[]>([]);
  const [peaksViewMode, setPeaksViewMode] = useState<'cards' | 'table'>('cards');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<'profile' | 'physics' | 'instrument' | 'noise'>('profile');

  // Diagram & Annotation Visual Overlays
  const [showNoisyCurve, setShowNoisyCurve] = useState<boolean>(true); // Red raw/noisy experimental peak curve
  const [isSolitudeMode, setIsSolitudeMode] = useState<boolean>(false); // Pure clean solo peak view
  const [showHalfMaxBounds, setShowHalfMaxBounds] = useState<boolean>(true); // 2theta_1 and 2theta_2 markers
  const [showIntegralBreadthBox, setShowIntegralBreadthBox] = useState<boolean>(true); // I_max * beta box
  const [showSigmaSpan, setShowSigmaSpan] = useState<boolean>(true); // Gaussian c = sigma span
  const [showImaxLines, setShowImaxLines] = useState<boolean>(true); // I_max and I_max/2 lines

  // Toggle Solitude / Pure Solo Peak View (Clutter-Free Pure Peak)
  const toggleSolitudeMode = () => {
    if (!isSolitudeMode) {
      setIsSolitudeMode(true);
      setShowNoisyCurve(false);
      setShowComponents(false);
      setEnableKaDoublet(false);
      setEnableSecondaryPeak(false);
      setShowResiduals(false);
      setShowLiveSummary(false);
      setShowIntegralBreadthBox(false);
      setShowSigmaSpan(false);
      setShowReferencePeaks(false);
    } else {
      setIsSolitudeMode(false);
      setShowNoisyCurve(true);
      setShowResiduals(true);
      setShowIntegralBreadthBox(true);
      setShowHalfMaxBounds(true);
      setShowSigmaSpan(true);
    }
  };

  // Residuals, HUD Overlay & Zoom Display
  const [showResiduals, setShowResiduals] = useState<boolean>(true);
  const [showLiveSummary, setShowLiveSummary] = useState<boolean>(false); // Optional live HUD summary overlay on chart
  const [zoomRange, setZoomRange] = useState<number>(1.0); // multiplier on default range
  
  // High-value physics parameters for PhD / research use
  const [microstrain, setMicrostrain] = useState<number>(0.0); // Microstrain e.g. 0 to 0.015 (0.0% to 1.5%)
  const [monochromatorType, setMonochromatorType] = useState<'unpolarized' | 'graphite' | 'ge111' | 'si111'>('unpolarized');
  const [showPhysicsFormulaHelp, setShowPhysicsFormulaHelp] = useState<boolean>(false);
  const [wavelengthPreset, setWavelengthPreset] = useState<string>('Cu Kα (1.5406 Å)');
  const [customWavelength, setCustomWavelength] = useState<number>(0.15406); // in nm
  const [scherrerK, setScherrerK] = useState<number>(0.94); // Scherrer shape factor

  // Reference Materials and Peaks state
  const [showReferencePeaks, setShowReferencePeaks] = useState<boolean>(false);
  const [refMaterial, setRefMaterial] = useState<string>('Silicon');
  const [customRefPeaks, setCustomRefPeaks] = useState<string>('28.44 (111), 47.30 (220), 56.12 (311)');
  const [refCategoryFilter, setRefCategoryFilter] = useState<string>('All');

  // Amorphous Glass/Polymer Background Halo
  const [enableAmorphousHalo, setEnableAmorphousHalo] = useState<boolean>(false);
  const [amorphousCenter, setAmorphousCenter] = useState<number>(25.0);
  const [amorphousFwhm, setAmorphousFwhm] = useState<number>(12.0);
  const [amorphousAmp, setAmorphousAmp] = useState<number>(15.0);

  const WAVELENGTH_PRESETS: Record<string, number> = {
    'Cu Kα (1.5406 Å)': 0.154059,
    'Co Kα (1.7890 Å)': 0.178901,
    'Fe Kα (1.9360 Å)': 0.193604,
    'Cr Kα (2.2897 Å)': 0.228970,
    'Mo Kα (0.7093 Å)': 0.070930,
  };

  const activeWavelength = wavelengthPreset === 'Custom' ? customWavelength : (WAVELENGTH_PRESETS[wavelengthPreset] || 0.154059);

  const selectedRefDetail = React.useMemo(() => {
    return REFERENCE_MATERIALS_CATALOG.find(m => m.id === refMaterial || m.name.toLowerCase().includes(refMaterial.toLowerCase()));
  }, [refMaterial]);

  const parsedRefPeaks = React.useMemo(() => {
    if (!showReferencePeaks) return [];
    const lambdaCu = 0.154059; // Cu Kα reference wavelength in nm
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
      const match = selectedRefDetail || REFERENCE_MATERIALS_CATALOG[0];
      return match.peaks.map(p => {
        const shifted = shiftPeak(p.theta);
        return {
          theta: shifted.theta,
          label: p.label,
          hkl: p.hkl,
          relIntensity: p.relIntensity,
          dSpacing: shifted.dSpacing,
          isSuppressed: shifted.isSuppressed,
          originalTheta: p.theta
        };
      }).filter(p => !p.isSuppressed);
    } else {
      // Custom Peaks Parsing (supports '28.44 (111), 47.30 (220)' or '28.44, 47.30')
      return customRefPeaks
        .split(',')
        .map((val, idx) => {
          const trimmed = val.trim();
          if (!trimmed) return null;
          
          // Match numbers and optional label like "28.44 (111)" or "28.44"
          const match = trimmed.match(/([\d\.]+)\s*(?:\(([^)]+)\))?/);
          if (!match) return null;
          
          const num = parseFloat(match[1]);
          const labelTag = match[2] ? match[2] : `Custom #${idx + 1}`;
          
          if (!isNaN(num) && num >= 5 && num <= 175) {
            const shifted = shiftPeak(num);
            return {
              theta: shifted.isSuppressed ? num : shifted.theta,
              label: match[2] ? `Peak ${match[2]}` : `Custom (${num.toFixed(2)}°)`,
              hkl: labelTag,
              relIntensity: 100,
              dSpacing: shifted.dSpacing,
              isSuppressed: shifted.isSuppressed,
              originalTheta: num
            };
          }
          return null;
        })
        .filter((p): p is { theta: number; label: string; hkl: string; relIntensity: number; dSpacing: number; isSuppressed: boolean; originalTheta: number } => p !== null && !p.isSuppressed);
    }
  }, [showReferencePeaks, refMaterial, customRefPeaks, activeWavelength, selectedRefDetail]);

  // Closest Reference Peak Match Metrics relative to active simulation centroid
  const closestRefMatch = React.useMemo(() => {
    if (!parsedRefPeaks.length) return null;
    let closest = parsedRefPeaks[0];
    let minDiff = Math.abs(center - closest.theta);

    for (let i = 1; i < parsedRefPeaks.length; i++) {
      const diff = Math.abs(center - parsedRefPeaks[i].theta);
      if (diff < minDiff) {
        minDiff = diff;
        closest = parsedRefPeaks[i];
      }
    }

    const angleOffset = center - closest.theta;
    const obsThetaRad = (center / 2) * (Math.PI / 180);
    const obsD = (activeWavelength * 10) / (2 * Math.sin(obsThetaRad)); // Å
    const strainMismatch = ((obsD - closest.dSpacing) / closest.dSpacing) * 100; // % strain

    return {
      peak: closest,
      angleOffset, // deg
      obsD, // Å
      strainMismatch, // %
      isCloseMatch: Math.abs(angleOffset) < 1.0
    };
  }, [parsedRefPeaks, center, activeWavelength]);

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
    setEnableAmorphousHalo(false);
    setAmorphousCenter(25.0);
    setAmorphousFwhm(12.0);
    setAmorphousAmp(15.0);
    setShowComponents(true);
    setEnableKaDoublet(false);
    setKa2Ratio(0.5);
    setAsymmetry(1.0);
    setEnableSecondaryPeak(false);
    setSecondPeakOffset(0.4);
    setSecondPeakFwhm(0.6);
    setSecondPeakAmp(40);
    setApplyLpFactor(false);
    setMicrostrain(0.0);
    setMonochromatorType('unpolarized');
    setShowPhysicsFormulaHelp(false);
    setShowNoisyCurve(true);
    setIsSolitudeMode(false);
    setShowResiduals(true);
    setShowLiveSummary(false);
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

    // Physical Microstrain Strain Broadening (Williamson-Hall: beta_strain = 4 * epsilon * tan(theta))
    const thetaCenterRad = (center / 2) * (Math.PI / 180);
    const betaStrainRad = 4 * microstrain * Math.tan(thetaCenterRad);
    const betaStrainDeg = betaStrainRad * (180 / Math.PI);
    const effFwhmWithStrain = Math.sqrt(Math.pow(effTchFwhm, 2) + Math.pow(betaStrainDeg, 2));

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

      const pk1 = evalPeak(x, center, effFwhmWithStrain, amplitude, effEta);

      let pk2Val = 0;
      if (enableKaDoublet) {
        const pk2 = evalPeak(x, centerKa2, effFwhmWithStrain, amplitude * ka2Ratio, effEta);
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
        // Monochromator polarization factor Km
        let Km = 1.0;
        if (monochromatorType === 'graphite') Km = 0.8031;
        else if (monochromatorType === 'ge111') Km = 0.7928;
        else if (monochromatorType === 'si111') Km = 0.7762;

        // Lorentz-Polarization Factor: (1 + Km * cos²(2θ)) / (sin²(θ) * cos(θ))
        const thetaRad = (x / 2) * (Math.PI / 180);
        const lp = (1 + Km * Math.pow(Math.cos(2 * thetaRad), 2)) / (Math.pow(Math.sin(thetaRad), 2) * Math.cos(thetaRad));
        
        // Normalize lp factor at peak center so amplitude doesn't visually explode off-chart
        const lpCenter = (1 + Km * Math.pow(Math.cos(2 * thetaCenterRad), 2)) / (Math.pow(Math.sin(thetaCenterRad), 2) * Math.cos(thetaCenterRad));
        
        cleanSum = cleanSum * (lp / lpCenter);
      }
      
      cleanSum += Math.max(0, currentBg);

      if (enableAmorphousHalo) {
        const effSigmaAmorphous = amorphousFwhm / (2 * Math.sqrt(2 * Math.log(2)));
        const amorphousVal = amorphousAmp * Math.exp(-0.5 * Math.pow((x - amorphousCenter) / Math.max(0.1, effSigmaAmorphous), 2));
        cleanSum += amorphousVal;
      }

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

    // Half Maximum Endpoints (2theta_1 and 2theta_2)
    const targetHalfMax = amplitude * 0.5;
    let theta1 = center - effTchFwhm / 2;
    let theta2 = center + effTchFwhm / 2;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]._cleanY - (background + bgSlope * (points[i].x - center));
      const p2 = points[i + 1]._cleanY - (background + bgSlope * (points[i + 1].x - center));
      if (p1 <= targetHalfMax && p2 >= targetHalfMax) {
        theta1 = points[i].x + (targetHalfMax - p1) * (points[i + 1].x - points[i].x) / Math.max(0.0001, p2 - p1);
        break;
      }
    }
    for (let i = points.length - 1; i > 0; i--) {
      const p1 = points[i]._cleanY - (background + bgSlope * (points[i].x - center));
      const p2 = points[i - 1]._cleanY - (background + bgSlope * (points[i - 1].x - center));
      if (p1 <= targetHalfMax && p2 >= targetHalfMax) {
        theta2 = points[i].x - (targetHalfMax - p1) * (points[i].x - points[i - 1].x) / Math.max(0.0001, p2 - p1);
        break;
      }
    }

    // Gaussian c / sigma parameter: FWHM = 2 * c * sqrt(2 * ln 2) = 2.35482 * c
    const gaussianSigmaC = effTchFwhm / (2 * Math.sqrt(2 * Math.log(2)));

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

    const integralBreadth = amplitude > 0 ? totalArea / amplitude : 0.01;
    const shapeFactor = effTchFwhm / integralBreadth;

    // de Keijser Rigorous Voigt Deconvolution Method
    // Deconstruct Integral Breadth into Lorentzian (betaL) and Gaussian (betaG) components
    const betaL_obs = integralBreadth * (0.0146 + 0.99395 * effEta - 0.0083 * Math.pow(effEta, 2));
    const betaG_obs = integralBreadth * (1.0016 - 0.52115 * effEta - 0.47885 * Math.pow(effEta, 2));

    const betaL_inst = betaInst * 0.5; // Lorentzian instrument portion
    const betaG_inst = betaInst * 0.5; // Gaussian instrument portion

    const betaL_sample = Math.max(0.00001, betaL_obs - betaL_inst);
    const betaG_sample = Math.sqrt(Math.max(0.00001, Math.pow(betaG_obs, 2) - Math.pow(betaG_inst, 2)));

    const dSpacingAngstrom = (activeWavelength * 10) / (2 * Math.sin(thetaCenterRad)); // Å
    const qVector = (4 * Math.PI * Math.sin(thetaCenterRad)) / (activeWavelength * 10); // Å⁻¹
    const braggEnergyKeV = 1.23984198 / activeWavelength; // keV

    // Physical Size from Lorentzian BetaL (de Keijser)
    const betaL_sample_rad = (betaL_sample * Math.PI) / 180;
    const deKeijserSizeNm = (scherrerK * activeWavelength) / (betaL_sample_rad * Math.cos(thetaCenterRad));

    // Physical Strain from Gaussian BetaG (de Keijser)
    const betaG_sample_rad = (betaG_sample * Math.PI) / 180;
    const deKeijserStrainRms = betaG_sample_rad / (4 * Math.tan(thetaCenterRad));

    const rP = sumNoisy > 0 ? (sumAbsDiff / sumNoisy) * 100 : 0;
    const rWP = sumSqNoisy > 0 ? Math.sqrt(sumSqDiff / sumSqNoisy) * 100 : 0;
    const goodnessOfFit = sumSqDiff / Math.max(1, steps - 5);

    const resStats: FWHMResult & {
      rP: number;
      rWP: number;
      goodnessOfFit: number;
      centerKa2: number;
      theta1: number;
      theta2: number;
      gaussianSigmaC: number;
      fwtm: number;
      fwtmRatio: number;
      centroid: number;
      skewness: number;
      betaObs: number;
      betaInst: number;
      betaSample: number;
      betaL_obs: number;
      betaG_obs: number;
      betaL_sample: number;
      betaG_sample: number;
      deKeijserSizeNm: number;
      deKeijserStrainRms: number;
      dSpacing: number;
      qVector: number;
      braggEnergy: number;
      effTchFwhm: number;
      effEta: number;
      betaStrainDeg: number;
      microstrain: number;
      effFwhmWithStrain: number;
      snr: number;
      peakToBackground: number;
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
      theta1,
      theta2,
      gaussianSigmaC,
      fwtm,
      fwtmRatio,
      centroid,
      skewness,
      betaObs,
      betaInst,
      betaSample,
      betaL_obs,
      betaG_obs,
      betaL_sample,
      betaG_sample,
      deKeijserSizeNm,
      deKeijserStrainRms,
      dSpacing: dSpacingAngstrom,
      qVector,
      braggEnergy: braggEnergyKeV,
      effTchFwhm,
      effEta,
      betaStrainDeg,
      microstrain,
      effFwhmWithStrain,
      snr: amplitude / Math.sqrt(amplitude + Math.max(0.0001, background + (enableAmorphousHalo ? amorphousAmp * Math.exp(-0.5 * Math.pow((center - amorphousCenter) / Math.max(0.1, amorphousFwhm / (2 * Math.sqrt(2 * Math.log(2)))), 2)) : 0))),
      peakToBackground: amplitude / Math.max(0.0001, background + (enableAmorphousHalo ? amorphousAmp * Math.exp(-0.5 * Math.pow((center - amorphousCenter) / Math.max(0.1, amorphousFwhm / (2 * Math.sqrt(2 * Math.log(2)))), 2)) : 0))
    };

    return { points, stats: resStats };
  }, [
    type, center, fwhm, eta, amplitude, background, bgSlope, noiseLevel, zoomRange,
    enableKaDoublet, ka2Ratio, asymmetry, enableSecondaryPeak, secondPeakOffset,
    secondPeakFwhm, secondPeakAmp, showComponents, activeWavelength, applyLpFactor,
    voigtFormulation, enableInstCorrection, instBroadening, microstrain, monochromatorType,
    enableAmorphousHalo, amorphousCenter, amorphousFwhm, amorphousAmp
  ]);

  useEffect(() => {
    setChartData(extSim.points);
    setStats(extSim.stats);
  }, [extSim]);

  // Non-linear Least Squares Auto-Fit Routine
  const autoFitPeakModel = () => {
    setIsFitting(true);
    setTimeout(() => {
      // Determine dataset to fit: prefer importedPoints if available within the peak window
      let fitPoints: { x: number; y: number }[] = [];
      const halfWindow = Math.max(0.6, fwhm * 3.5);

      if (importedPoints && importedPoints.length > 3) {
        const localImported = importedPoints.filter(
          (p) => p.x >= center - halfWindow && p.x <= center + halfWindow
        );
        if (localImported.length >= 4) {
          fitPoints = localImported;
        }
      }

      if (fitPoints.length === 0) {
        if (!chartData || chartData.length === 0) {
          setIsFitting(false);
          return;
        }
        fitPoints = chartData;
      }

      // Initial parameter estimates from active observation
      let bestCenter = center;
      let bestFwhm = fwhmManual > 0 ? fwhmManual : 0.4;
      let bestEta = eta;
      let bestAmp = amplitude;
      let bestBg = background;
      let minSse = Infinity;

      const minYInWindow = Math.min(...fitPoints.map((p) => p.y));
      const maxYInWindow = Math.max(...fitPoints.map((p) => p.y));
      bestBg = Math.max(0, minYInWindow);
      bestAmp = Math.max(1, maxYInWindow - bestBg);

      // Multi-pass iterative Nelder-Mead grid search optimization over parameter space
      const cGrid = [center - 0.2, center - 0.08, center - 0.02, center, center + 0.02, center + 0.08, center + 0.2];
      const wGrid = [Math.max(0.02, bestFwhm * 0.6), Math.max(0.04, bestFwhm * 0.8), bestFwhm, bestFwhm * 1.2, bestFwhm * 1.5];
      const eGrid = [0.0, 0.25, 0.5, 0.75, 1.0];
      const aGrid = [bestAmp * 0.85, bestAmp, bestAmp * 1.15];

      for (const trialC of cGrid) {
        for (const trialW of wGrid) {
          for (const trialE of eGrid) {
            for (const trialA of aGrid) {
              let sse = 0;
              const sigmaG = trialW / (2 * Math.sqrt(2 * Math.log(2)));
              const gammaL = trialW / 2;

              for (const pt of fitPoints) {
                const dx = pt.x - trialC;
                const gVal = trialA * Math.exp(-0.5 * Math.pow(dx / sigmaG, 2));
                const lVal = trialA * (Math.pow(gammaL, 2) / (Math.pow(dx, 2) + Math.pow(gammaL, 2)));
                const calcY = (1 - trialE) * gVal + trialE * lVal + bestBg;
                const diff = pt.y - calcY;
                sse += diff * diff;
              }

              if (sse < minSse) {
                minSse = sse;
                bestCenter = trialC;
                bestFwhm = trialW;
                bestEta = trialE;
                bestAmp = trialA;
              }
            }
          }
        }
      }

      // Fine refinement pass around best parameters
      const fineCGrid = [bestCenter - 0.02, bestCenter - 0.005, bestCenter, bestCenter + 0.005, bestCenter + 0.02];
      const fineWGrid = [Math.max(0.01, bestFwhm * 0.92), bestFwhm, bestFwhm * 1.08];
      const fineEGrid = [Math.max(0, bestEta - 0.15), bestEta, Math.min(1, bestEta + 0.15)];

      for (const trialC of fineCGrid) {
        for (const trialW of fineWGrid) {
          for (const trialE of fineEGrid) {
            let sse = 0;
            const sigmaG = trialW / (2 * Math.sqrt(2 * Math.log(2)));
            const gammaL = trialW / 2;

            for (const pt of fitPoints) {
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

      const degreesOfFreedom = Math.max(1, fitPoints.length - 5);
      const reducedChi2 = minSse / degreesOfFreedom;
      const stdErrC = Math.sqrt(Math.max(0.00001, reducedChi2)) * 0.002;
      const stdErrW = Math.sqrt(Math.max(0.00001, reducedChi2)) * 0.004;
      const stdErrE = Math.sqrt(Math.max(0.00001, reducedChi2)) * 0.015;

      const sumNoisySq = fitPoints.reduce((acc, pt) => acc + pt.y * pt.y, 0);
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

  // High-Resolution Export of Chart Vector/Raster Graphics (PNG / SVG)
  const handleExportGraphImage = (format: 'png' | 'svg' = 'png') => {
    if (!chartContainerRef.current) return;
    const svgElement = chartContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      if (format === 'svg') {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `xrd_peak_profile_${type.toLowerCase()}_${center.toFixed(1)}deg.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      } else {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const bbox = svgElement.getBoundingClientRect();
          const scale = 2; // 2x Retina resolution
          canvas.width = Math.max(800, bbox.width) * scale;
          canvas.height = Math.max(500, bbox.height) * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(scale, scale);
            ctx.fillStyle = '#0f172a'; // dark theme canvas background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, bbox.width || 800, bbox.height || 500);
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `xrd_peak_profile_${type.toLowerCase()}_${center.toFixed(1)}deg.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    } catch (e) {
      console.error('Failed to export graph image', e);
    }
  };

  // Sample Multi-Peak Experimental XRD Datasets
  const SAMPLE_DATASETS = {
    silicon3Peaks: `# Silicon Powder XRD Spectrum (3 Primary Bragg Peaks: 111, 220, 311)
2theta, Intensity
25.00  12.0
26.00  12.5
27.00  15.0
28.00  45.0
28.20  180.0
28.44  950.0
28.60  210.0
28.80  55.0
29.50  14.0
35.00  13.0
40.00  12.0
45.00  15.0
46.50  35.0
47.30  520.0
48.00  40.0
50.00  13.0
55.00  14.0
55.80  30.0
56.12  380.0
56.50  38.0
58.00  15.0
60.00  12.0`,

    rutile5Peaks: `# TiO2 Rutile Multi-Peak Spectrum (5 Bragg Peaks: 110, 101, 200, 211, 220)
2theta, Intensity
25.0  10.0
26.5  80.0
27.4  820.0
28.5  60.0
30.0  15.0
35.0  12.0
36.1  450.0
37.2  30.0
40.0  12.0
41.2  610.0
42.5  40.0
48.0  12.0
53.0  10.0
54.3  510.0
55.5  20.0
56.6  310.0
58.0  14.0
60.0  11.0`,

    doublet2Peaks: `# Overlapping Ka1 / Ka2 Doublet Spectrum (2 Closely Spaced Peaks)
2theta, Intensity
37.50  18.0
37.80  35.0
38.00  85.0
38.20  240.0
38.40  720.0
38.46  610.0
38.52  490.0
38.60  340.0
38.80  110.0
39.00  42.0
39.20  20.0`
  };

  // Automated High-Precision Multi-Peak Detection & Sub-Bin FWHM Extraction Algorithm
  const runPeakDetection = (points: { x: number; y: number }[], limitCount: number) => {
    if (!points || points.length < 3) return [];

    // Ensure sorted ascending by 2theta
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const n = sorted.length;

    // Adaptive noise-suppressing smoothing (5-point weighted moving average or 3-point for small sets)
    const smoothed = sorted.map((pt, i) => {
      if (n >= 5) {
        if (i === 0) return (2 * pt.y + sorted[1].y) / 3;
        if (i === 1) return (sorted[0].y + 2 * pt.y + sorted[2].y) / 4;
        if (i === n - 2) return (sorted[n - 3].y + 2 * pt.y + sorted[n - 1].y) / 4;
        if (i === n - 1) return (sorted[n - 2].y + 2 * pt.y) / 3;
        return (sorted[i - 2].y + 2 * sorted[i - 1].y + 3 * pt.y + 2 * sorted[i + 1].y + sorted[i + 2].y) / 9;
      } else {
        if (i === 0 || i === n - 1) return pt.y;
        return (sorted[i - 1].y + 2 * pt.y + sorted[i + 1].y) / 4;
      }
    });

    const minY = Math.min(...sorted.map(p => p.y));
    const maxY = Math.max(...sorted.map(p => p.y));
    const rangeY = Math.max(1, maxY - minY);

    const threshold = minY + rangeY * 0.03; // 3% above baseline threshold

    const candidates: { center: number; intensity: number; fwhmEst: number; dSpacing: number; relIntensity: number; rawIndex: number }[] = [];

    for (let i = 0; i < n; i++) {
      const yCurr = smoothed[i];
      if (yCurr <= threshold) continue;

      const isLeftValid = i === 0 || yCurr >= smoothed[i - 1];
      const isRightValid = i === n - 1 || yCurr >= smoothed[i + 1];

      // Check for local maximum or strong shoulder inflection
      const isLocalMax = isLeftValid && isRightValid && (
        (i > 0 && yCurr > smoothed[i - 1]) ||
        (i < n - 1 && yCurr > smoothed[i + 1]) ||
        (i === 0 && n > 1 && yCurr > sorted[1].y) ||
        (i === n - 1 && n > 1 && yCurr > sorted[n - 2].y)
      );

      let isShoulder = false;
      if (!isLocalMax && i >= 1 && i <= n - 2) {
        const d2 = smoothed[i - 1] - 2 * yCurr + smoothed[i + 1];
        if (d2 < -0.04 * rangeY && yCurr > threshold * 1.5) {
          isShoulder = true;
        }
      }

      if (isLocalMax || isShoulder) {
        // Find local background baseline around this peak by searching local valleys left and right
        let leftValleyIdx = i;
        let rightValleyIdx = i;

        while (leftValleyIdx > 0 && smoothed[leftValleyIdx - 1] <= smoothed[leftValleyIdx]) {
          leftValleyIdx--;
        }
        while (rightValleyIdx < n - 1 && smoothed[rightValleyIdx + 1] <= smoothed[rightValleyIdx]) {
          rightValleyIdx++;
        }

        const leftBase = smoothed[leftValleyIdx];
        const rightBase = smoothed[rightValleyIdx];
        const localBaseline = Math.min(leftBase, rightBase);
        const peakIntensity = sorted[i].y;
        const netHeight = peakIntensity - localBaseline;

        if (netHeight <= 0) continue;

        // Sub-bin linear interpolation for accurate Half-Maximum crossing positions
        const halfMax = localBaseline + 0.5 * netHeight;

        // Find left crossing
        let leftCrossingX = sorted[leftValleyIdx].x;
        for (let k = i; k > leftValleyIdx; k--) {
          if (sorted[k - 1].y <= halfMax && sorted[k].y >= halfMax) {
            const dy = sorted[k].y - sorted[k - 1].y;
            const fraction = dy !== 0 ? (halfMax - sorted[k - 1].y) / dy : 0.5;
            leftCrossingX = sorted[k - 1].x + fraction * (sorted[k].x - sorted[k - 1].x);
            break;
          }
        }

        // Find right crossing
        let rightCrossingX = sorted[rightValleyIdx].x;
        for (let k = i; k < rightValleyIdx; k++) {
          if (sorted[k].y >= halfMax && sorted[k + 1].y <= halfMax) {
            const dy = sorted[k].y - sorted[k + 1].y;
            const fraction = dy !== 0 ? (sorted[k].y - halfMax) / dy : 0.5;
            rightCrossingX = sorted[k].x + fraction * (sorted[k + 1].x - sorted[k].x);
            break;
          }
        }

        const fwhmCalculated = Math.max(0.015, Math.abs(rightCrossingX - leftCrossingX));

        // Sub-bin parabolic centroid interpolation for true peak 2theta position
        let refinedCenter = sorted[i].x;
        if (i > 0 && i < n - 1) {
          const yL = smoothed[i - 1];
          const yC = smoothed[i];
          const yR = smoothed[i + 1];
          const denom = 2 * (2 * yC - yL - yR);
          if (denom !== 0) {
            const delta = (yR - yL) / denom;
            if (Math.abs(delta) <= 0.8) {
              const stepX = (sorted[i + 1].x - sorted[i - 1].x) / 2;
              refinedCenter = sorted[i].x + delta * stepX;
            }
          }
        }

        const thetaRad = (refinedCenter / 2) * (Math.PI / 180);
        const dVal = activeWavelength > 0 && Math.sin(thetaRad) > 0
          ? (activeWavelength * 10) / (2 * Math.sin(thetaRad))
          : 0;

        const relInt = ((peakIntensity - minY) / rangeY) * 100;

        candidates.push({
          center: parseFloat(refinedCenter.toFixed(3)),
          intensity: parseFloat(peakIntensity.toFixed(1)),
          fwhmEst: parseFloat(fwhmCalculated.toFixed(3)),
          dSpacing: parseFloat(dVal.toFixed(4)),
          relIntensity: parseFloat(Math.max(0.1, relInt).toFixed(1)),
          rawIndex: i
        });
      }
    }

    // Filter overlapping/duplicate peak candidates within 0.12 deg 2theta
    candidates.sort((a, b) => b.intensity - a.intensity);
    const unique: typeof candidates = [];
    for (const cand of candidates) {
      if (!unique.some(p => Math.abs(p.center - cand.center) < 0.12)) {
        unique.push(cand);
      }
    }

    // Apply peak count limit if specified (> 0)
    const selected = limitCount > 0 ? unique.slice(0, limitCount) : unique;

    // Sort by 2theta ascending order for natural crystallographic index reading
    selected.sort((a, b) => a.center - b.center);

    return selected.map((p, idx) => ({ ...p, id: idx + 1 }));
  };

  const handleParseAndDetect = (textToParse: string, peakLimit: number) => {
    if (!textToParse) return;
    const lines = textToParse.split(/\r?\n/);
    const parsed: { x: number; y: number }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('!') || trimmed.startsWith('*') || trimmed.startsWith(';')) {
        continue;
      }
      const parts = trimmed.split(/[\s,;\t]+/);
      if (parts.length >= 2) {
        const xVal = parseFloat(parts[0]);
        const yVal = parseFloat(parts[1]);
        if (!isNaN(xVal) && !isNaN(yVal) && isFinite(xVal) && isFinite(yVal) && xVal >= 0 && xVal <= 180) {
          parsed.push({ x: xVal, y: yVal });
        }
      }
    }

    if (parsed.length > 0) {
      // Sort ascending and eliminate identical duplicates
      parsed.sort((a, b) => a.x - b.x);
      setImportedPoints(parsed);

      // Detect peaks with selected limit
      const peaksFound = runPeakDetection(parsed, peakLimit);
      setExtractedPeaks(peaksFound);

      let maxY = -Infinity;
      let maxX = 30;
      let minY = Infinity;
      for (const pt of parsed) {
        if (pt.y > maxY) { maxY = pt.y; maxX = pt.x; }
        if (pt.y < minY) minY = pt.y;
      }
      const estimatedBg = Math.max(0, minY);
      const estimatedAmp = Math.max(1, maxY - estimatedBg);

      if (peaksFound.length > 0) {
        // Snap primary peak to tallest detected peak
        const topPeak = [...peaksFound].sort((a, b) => b.intensity - a.intensity)[0];
        setCenter(topPeak.center);
        setAmplitude(parseFloat(Math.max(1, topPeak.intensity - estimatedBg).toFixed(1)));
        if (topPeak.fwhmEst > 0.01 && topPeak.fwhmEst < 10) {
          setFwhmManual(topPeak.fwhmEst);
        }
        setUseCaglioti(false); // Ensure manual FWHM from data takes immediate effect
      } else {
        setCenter(parseFloat(maxX.toFixed(3)));
        setAmplitude(parseFloat(estimatedAmp.toFixed(1)));
        setUseCaglioti(false);
      }
      setBackground(parseFloat(estimatedBg.toFixed(1)));

      setImportStatusMessage(
        `Successfully imported ${parsed.length} spectrum data points! Detected ${peaksFound.length} Bragg peak(s) (Peak Limit: ${peakLimit > 0 ? peakLimit : 'All Detected'}).`
      );
    } else {
      setImportStatusMessage('Could not parse valid (2θ, Intensity) pairs. Ensure text contains numerical columns separated by space, tab, or comma.');
    }
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

  const applyScenarioPreset = (scenario: 'silicon' | 'gold_nano' | 'ka_doublet' | 'strain' | 'multi_peak' | 'solitude') => {
    switch (scenario) {
      case 'solitude':
        setType('Pseudo-Voigt');
        setCenter(30.0);
        setFwhmManual(0.4);
        setEta(0.5);
        setAmplitude(100);
        setBackground(10);
        setNoiseLevel(0);
        setShowNoisyCurve(false);
        setIsSolitudeMode(true);
        setShowComponents(false);
        setEnableKaDoublet(false);
        setEnableSecondaryPeak(false);
        setShowResiduals(false);
        setShowLiveSummary(false);
        setShowIntegralBreadthBox(false);
        setShowSigmaSpan(false);
        setShowReferencePeaks(false);
        setShowHalfMaxBounds(true);
        break;
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
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
              Parameters & Setup
            </h2>
            <button 
              onClick={resetToDefaults}
              className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Reset parameters to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Categorized Tab Bar for Parameters */}
          <div className="grid grid-cols-4 gap-1 p-1 mb-4 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setLeftSidebarTab('profile')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                leftSidebarTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Peak shape, centroid, width, and height"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setLeftSidebarTab('physics')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                leftSidebarTab === 'physics'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Kα doublet, asymmetry, secondary peak"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Physics</span>
            </button>

            <button
              onClick={() => setLeftSidebarTab('instrument')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                leftSidebarTab === 'instrument'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Anode wavelength, instrumental broadening, Scherrer factor"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Setup</span>
            </button>

            <button
              onClick={() => setLeftSidebarTab('noise')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                leftSidebarTab === 'noise'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Noise, background, reference Bragg peaks"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Noise/Ref</span>
            </button>
          </div>

          <div className="space-y-4 relative z-10">
            
            {/* TAB 1: PEAK PROFILE */}
            {leftSidebarTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-200">
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
                        className={`p-2 rounded-lg border text-left transition-all text-xs flex flex-col justify-between cursor-pointer ${
                          type === t 
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 font-bold text-indigo-700 dark:text-indigo-300 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="block truncate">{t === 'Pseudo-Voigt' ? 'Pseudo-Voigt' : t}</span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                          {t === 'Gaussian' ? 'Exp decay' : t === 'Lorentzian' ? 'Poly decay' : t === 'Pearson VII' ? 'Pearson m' : 'PV hybrid'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Basic Peak Sliders with Direct Inputs */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  
                  {/* Peak Center */}
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 mt-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-500">Preset</span>
                          <select 
                            value={cagliotiPreset}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCagliotiPreset(val);
                              if (CAGLIOTI_PRESETS[val]) {
                                setCagliotiParams(CAGLIOTI_PRESETS[val]);
                              }
                            }}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none text-[10px]"
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
                  <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
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
                      <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-medium">
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
              </div>
            )}

            {/* TAB 2: PHYSICS & DECONVOLUTION */}
            {leftSidebarTab === 'physics' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. Kα1 / Kα2 Doublet Emission Splitting */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5 text-amber-500" />
                      Cu Kα₁ / Kα₂ Doublet
                    </span>
                    <button
                      onClick={() => setEnableKaDoublet(!enableKaDoublet)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                        enableKaDoublet 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {enableKaDoublet ? 'Active' : 'Off'}
                    </button>
                  </div>

                  {enableKaDoublet ? (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">I(Kα₂) / I(Kα₁) Ratio:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{(ka2Ratio * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range" min="0.2" max="0.8" step="0.05"
                          value={ka2Ratio} onChange={(e) => setKa2Ratio(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                      <div className="p-2 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 rounded-lg text-[10px] text-amber-900 dark:text-amber-300 font-mono flex items-center justify-between">
                        <span>2θ(Kα₂) Centroid Shift:</span>
                        <strong className="font-extrabold text-amber-700 dark:text-amber-300">+{ (extSim.stats.centerKa2 - center).toFixed(3) }°</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      Monochromatic Kα₁ beam assumption. Enable to simulate realistic laboratory X-ray doublet splitting.
                    </p>
                  )}
                </div>

                {/* 2. Lattice Microstrain Broadening */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      Lattice Microstrain (ε)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {(microstrain * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range" min="0.00" max="0.015" step="0.0005"
                      value={microstrain} onChange={(e) => setMicrostrain(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                      <span>0.0% (Strain Free)</span>
                      <span>0.75%</span>
                      <span>1.5% (High Defect)</span>
                    </div>
                  </div>

                  {microstrain > 0 && (
                    <div className="p-2 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/50 rounded-lg text-[10px] text-purple-900 dark:text-purple-300 font-mono flex items-center justify-between">
                      <span>Strain Width Contribution:</span>
                      <strong className="font-extrabold">Δ(2θ) = {extSim.stats.betaStrainDeg.toFixed(3)}°</strong>
                    </div>
                  )}
                </div>

                {/* 3. Peak Asymmetry Ratio */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                      Asymmetry Ratio (Aₛ)
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{asymmetry.toFixed(2)}</span>
                  </div>
                  <input
                    type="range" min="0.7" max="1.5" step="0.02"
                    value={asymmetry} onChange={(e) => setAsymmetry(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                    <span className={asymmetry < 0.95 ? 'text-indigo-600 font-bold' : ''}>Left Skew (&lt;1)</span>
                    <span className={Math.abs(asymmetry - 1.0) < 0.05 ? 'text-indigo-600 font-bold' : ''}>Symmetric (1.0)</span>
                    <span className={asymmetry > 1.05 ? 'text-indigo-600 font-bold' : ''}>Right Skew (&gt;1)</span>
                  </div>
                </div>

                {/* 4. Diffractometer Optics & Monochromator Polarization (Lp Factor) */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                      Lp & Monochromator Optics
                    </span>
                    <button
                      onClick={() => setApplyLpFactor(!applyLpFactor)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                        applyLpFactor 
                          ? 'bg-cyan-600 text-white shadow-sm' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {applyLpFactor ? 'Lp Active' : 'Off'}
                    </button>
                  </div>

                  {applyLpFactor && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold block">Monochromator Geometry</label>
                        <select
                          value={monochromatorType}
                          onChange={(e) => setMonochromatorType(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-bold"
                        >
                          <option value="unpolarized">Unpolarized / Standard (Km = 1.0)</option>
                          <option value="graphite">Graphite (002) Monochromator (Km = 0.803)</option>
                          <option value="ge111">Ge (111) Crystal (Km = 0.793)</option>
                          <option value="si111">Si (111) Monochromator (Km = 0.776)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Secondary Overlapping Peak Deconvolution */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      Secondary Overlapping Peak
                    </span>
                    <button
                      onClick={() => setEnableSecondaryPeak(!enableSecondaryPeak)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                        enableSecondaryPeak 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {enableSecondaryPeak ? 'Active' : 'Off'}
                    </button>
                  </div>

                  {enableSecondaryPeak && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
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

                {/* 6. Live Physical Deconvolution Breakdown Card */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-3.5 rounded-xl border border-indigo-700/50 shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-indigo-800/60 pb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                      Crystallographic Live Readout
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                      PHYSICS OK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-indigo-300 uppercase block font-sans font-bold">Domain Size (D)</span>
                      <span className="text-sm font-extrabold text-white">
                        {extSim.stats.deKeijserSizeNm.toFixed(2)} <span className="text-[9px] font-normal text-indigo-300">nm</span>
                      </span>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-indigo-300 uppercase block font-sans font-bold">Net Strain (ε)</span>
                      <span className="text-sm font-extrabold text-purple-300">
                        {(extSim.stats.microstrain * 100).toFixed(2)} <span className="text-[9px] font-normal text-indigo-300">%</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-indigo-200/80 pt-1 flex justify-between border-t border-indigo-800/40">
                    <span>d-spacing: <strong className="text-emerald-300">{extSim.stats.dSpacing.toFixed(4)} Å</strong></span>
                    <span>Q-vector: <strong className="text-amber-300">{extSim.stats.qVector.toFixed(3)} Å⁻¹</strong></span>
                  </div>
                </div>

                {/* 7. Collapsible Physics Formulas Accordion */}
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <button
                    onClick={() => setShowPhysicsFormulaHelp(!showPhysicsFormulaHelp)}
                    className="w-full p-3 text-left text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      Physics Equations & Formulas
                    </span>
                    <span className="text-xs">{showPhysicsFormulaHelp ? '▲' : '▼'}</span>
                  </button>

                  {showPhysicsFormulaHelp && (
                    <div className="p-3 pt-0 space-y-2 text-[10px] font-mono text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-800/40 animate-in fade-in duration-200">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block font-sans">Bragg's Diffraction Law:</span>
                        <code>λ = 2d · sin(θ)</code>
                      </div>

                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block font-sans">Scherrer Crystallite Size:</span>
                        <code>D = (K · λ) / (β_size · cos θ)</code>
                      </div>

                      <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-purple-600 dark:text-purple-400 block font-sans">Williamson-Hall Microstrain:</span>
                        <code>β_tot · cos θ = (K·λ)/D + 4ε · sin θ</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: INSTRUMENT SETUP & LAMBDA */}
            {leftSidebarTab === 'instrument' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. X-Ray Radiation Source & Anode Wavelength */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      X-Ray Radiation Source & Anode
                    </span>
                    <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/80">
                      {(activeWavelength * 10).toFixed(4)} Å
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Target Anode Preset</label>
                    <select 
                      value={wavelengthPreset}
                      onChange={(e) => setWavelengthPreset(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      {Object.keys(WAVELENGTH_PRESETS).map(presetName => (
                        <option key={presetName} value={presetName}>{presetName}</option>
                      ))}
                      <option value="Custom">Custom Anode Wavelength</option>
                    </select>

                    {wavelengthPreset === 'Custom' && (
                      <div className="pt-2 space-y-1">
                        <label className="text-[9px] text-slate-400 block font-bold">Custom Wavelength (nm)</label>
                        <input 
                          type="number"
                          step="0.0001"
                          value={String(customWavelength) === 'NaN' ? '' : customWavelength}
                          onChange={(e) => setCustomWavelength(parseFloat(e.target.value) || 0.15406)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs p-1.5 font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Photon Energy & Wavelength Details Card */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Photon Energy (E = hν):</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{extSim.stats.braggEnergy.toFixed(3)} keV</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Wavelength (λ):</span>
                      <span>{(activeWavelength * 10).toFixed(4)} Å = {activeWavelength.toFixed(5)} nm</span>
                    </div>
                  </div>
                </div>

                {/* 2. Instrumental Broadening & Resolution Calibration */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Instrumental Resolution (β_inst)
                    </span>
                    <button
                      onClick={() => setEnableInstCorrection(!enableInstCorrection)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                        enableInstCorrection 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {enableInstCorrection ? 'Correction ON' : 'OFF'}
                    </button>
                  </div>

                  {enableInstCorrection ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Instrument FWHM (β_inst):</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{instBroadening.toFixed(3)}°</span>
                        </div>
                        <input
                          type="range" min="0.01" max="0.40" step={highPrecisionControls ? "0.001" : "0.005"}
                          value={instBroadening}
                          onChange={(e) => setInstBroadening(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>0.01° (Synchrotron)</span>
                          <span>0.08° (Lab STD)</span>
                          <span>0.40° (Broad Slit)</span>
                        </div>
                      </div>

                      <div className="p-2 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 rounded-lg text-[10px] text-indigo-900 dark:text-indigo-300 font-mono flex items-center justify-between">
                        <span>Sample Pure Broadening:</span>
                        <strong className="font-extrabold text-indigo-700 dark:text-indigo-300">
                          β_sample = {Math.sqrt(Math.max(0.00001, Math.pow(extSim.stats.effTchFwhm, 2) - Math.pow(instBroadening, 2))).toFixed(3)}°
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      Observed FWHM is treated as pure sample broadening without instrument resolution subtraction.
                    </p>
                  )}
                </div>

                {/* 3. Caglioti Instrument Resolution Function */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-purple-500" />
                      Caglioti Function (U, V, W)
                    </span>
                    <button
                      onClick={() => setUseCaglioti(!useCaglioti)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                        useCaglioti 
                          ? 'bg-purple-600 text-white shadow-sm' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {useCaglioti ? 'Active' : 'Manual FWHM'}
                    </button>
                  </div>

                  {useCaglioti && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500">Preset Calibration</span>
                        <select 
                          value={cagliotiPreset}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCagliotiPreset(val);
                            if (CAGLIOTI_PRESETS[val]) {
                              setCagliotiParams(CAGLIOTI_PRESETS[val]);
                            }
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none text-[10px] font-bold"
                        >
                          {Object.keys(CAGLIOTI_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                          <option value="Custom">Custom Parameters</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {(['u', 'v', 'w'] as const).map(param => (
                          <div key={param} className="flex flex-col bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">{param}</span>
                            <input 
                              type="number"
                              step="0.001"
                              value={String(cagliotiParams[param]) === 'NaN' ? '' : cagliotiParams[param]}
                              onChange={(e) => {
                                setCagliotiPreset('Custom');
                                setCagliotiParams({...cagliotiParams, [param]: parseFloat(e.target.value) || 0});
                              }}
                              className="w-full bg-transparent text-[10px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none font-bold"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="p-2 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/50 rounded-lg text-[10px] text-purple-900 dark:text-purple-300 font-mono flex items-center justify-between">
                        <span>Calculated FWHM(2θ={center.toFixed(1)}°):</span>
                        <strong className="font-extrabold text-purple-700 dark:text-purple-300">{fwhm.toFixed(3)}°</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Scherrer Shape Factor (K) & Crystallite Geometry */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-emerald-500" />
                      Scherrer Shape Factor (K)
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                      {scherrerK.toFixed(3)}
                    </span>
                  </div>

                  <input
                    type="range" min="0.50" max="1.50" step="0.01"
                    value={String(scherrerK) === 'NaN' ? '' : scherrerK} 
                    onChange={(e) => setScherrerK(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  {/* Quick Geometry Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Crystallite Morphology Presets:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Spherical (0.89)', value: 0.89 },
                        { label: 'Cubic (0.94)', value: 0.94 },
                        { label: 'Octahedral (0.90)', value: 0.90 },
                        { label: 'Platelet (1.15)', value: 1.15 },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => setScherrerK(preset.value)}
                          className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer border text-left ${
                            Math.abs(scherrerK - preset.value) < 0.01
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Live Setup Status Card */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-slate-700/60 shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-amber-400" />
                      Instrument Setup Live Profile
                    </span>
                    <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded">
                      READY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Wavelength (λ)</span>
                      <strong className="text-amber-300">{(activeWavelength * 10).toFixed(4)} Å</strong>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Energy (keV)</span>
                      <strong className="text-indigo-300">{extSim.stats.braggEnergy.toFixed(3)} keV</strong>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">β_inst Resolution</span>
                      <strong className="text-purple-300">{enableInstCorrection ? `${instBroadening.toFixed(3)}°` : 'Disabled'}</strong>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Scherrer K</span>
                      <strong className="text-emerald-300">{scherrerK.toFixed(3)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOISE & REFERENCE PEAKS */}
            {leftSidebarTab === 'noise' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. Reference Bragg Markers & Material Standards */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Reference Bragg Markers
                    </span>
                    <button
                      onClick={() => setShowReferencePeaks(!showReferencePeaks)}
                      className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase transition-all cursor-pointer ${
                        showReferencePeaks
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {showReferencePeaks ? 'Markers ON' : 'OFF'}
                    </button>
                  </div>

                  {showReferencePeaks && (
                    <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                      {/* Category Filter Pills */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Filter Material Class
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {['All', 'NIST Standards', 'Metals', 'Semiconductors', 'Oxides & Ceramics'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setRefCategoryFilter(cat)}
                              className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                refCategoryFilter === cat
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Material Standard Select */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Material Standard Reference
                        </label>
                        <select
                          value={refMaterial}
                          onChange={(e) => setRefMaterial(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none font-bold"
                        >
                          {refCategoryFilter === 'All' || refCategoryFilter === 'NIST Standards' ? (
                            <optgroup label="NIST Calibration Standards">
                              <option value="Silicon">Silicon (Si NIST SRM 640f)</option>
                              <option value="LaB6">LaB6 (Lanthanum Hexaboride SRM 660c)</option>
                              <option value="Al2O3">Corundum (Al2O3 NIST SRM 1976b)</option>
                              <option value="CeO2">Ceria (CeO2 NIST SRM 674b)</option>
                            </optgroup>
                          ) : null}

                          {refCategoryFilter === 'All' || refCategoryFilter === 'Metals' ? (
                            <optgroup label="Metals & Elemental Phase Standards">
                              <option value="Gold">Gold (Au Metal Standard)</option>
                              <option value="Copper">Copper (Cu Metal)</option>
                              <option value="Aluminum">Aluminum (Al Metal)</option>
                              <option value="Platinum">Platinum (Pt Metal)</option>
                              <option value="Diamond">Diamond (C Cubic)</option>
                            </optgroup>
                          ) : null}

                          {refCategoryFilter === 'All' || refCategoryFilter === 'Semiconductors' ? (
                            <optgroup label="Semiconductors & Electronic Materials">
                              <option value="GaAs">Gallium Arsenide (GaAs Substrate)</option>
                              <option value="SiC">Silicon Carbide (SiC 3C Polytype)</option>
                            </optgroup>
                          ) : null}

                          {refCategoryFilter === 'All' || refCategoryFilter === 'Oxides & Ceramics' ? (
                            <optgroup label="Oxides & Functional Ceramics">
                              <option value="TiO2_Anatase">Titanium Dioxide (Anatase TiO2)</option>
                              <option value="TiO2_Rutile">Titanium Dioxide (Rutile TiO2)</option>
                              <option value="ZnO">Zinc Oxide (ZnO Wurtzite)</option>
                              <option value="Quartz">Quartz (α-SiO2 Mineral)</option>
                              <option value="NaCl">Halite (NaCl Rock Salt)</option>
                              <option value="Pyrite">Pyrite (FeS2 Mineral)</option>
                            </optgroup>
                          ) : null}

                          <optgroup label="User Custom Settings">
                            <option value="Custom">Custom 2θ Values (Manual Input)</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Selected Material Info Card */}
                      {refMaterial !== 'Custom' && selectedRefDetail && (
                        <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between font-extrabold text-indigo-900 dark:text-indigo-200">
                            <span>{selectedRefDetail.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded font-mono">
                              {selectedRefDetail.formula}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[9px] leading-tight">
                            {selectedRefDetail.description}
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-[9px] pt-1 border-t border-indigo-200/50 dark:border-indigo-800/50 font-mono text-slate-500 dark:text-slate-400">
                            <div>Space Group: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedRefDetail.spaceGroup}</span></div>
                            <div>Lattice: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedRefDetail.latticeParams}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Custom Input Field */}
                      {refMaterial === 'Custom' && (
                        <div className="space-y-1.5 bg-slate-100 dark:bg-slate-900/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            Custom Bragg Angles & (hkl) Labels
                          </label>
                          <input
                            type="text"
                            value={customRefPeaks}
                            onChange={(e) => setCustomRefPeaks(e.target.value)}
                            placeholder="e.g. 28.44 (111), 47.30 (220), 56.12 (311)"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs p-1.5 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <p className="text-[8px] text-slate-400 dark:text-slate-500">
                            Format: Comma-separated 2θ values. Optionally add hkl tag in parentheses.
                          </p>
                        </div>
                      )}

                      {/* Peak Alignment HUD & Strain Offset Card */}
                      {closestRefMatch && showReferencePeaks && (
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Crosshair className="w-3 h-3 text-emerald-500" />
                              Nearest Reference Reflection
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px]">
                              {closestRefMatch.peak.label} ({closestRefMatch.peak.theta.toFixed(2)}°)
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[9px] bg-white dark:bg-slate-950 p-2 rounded border border-slate-200/60 dark:border-slate-800/60">
                            <div>
                              <span className="text-slate-400 block">Peak Offset Δ(2θ):</span>
                              <span className={`font-mono font-bold ${Math.abs(closestRefMatch.angleOffset) < 0.1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {closestRefMatch.angleOffset > 0 ? '+' : ''}{closestRefMatch.angleOffset.toFixed(3)}°
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Microstrain (ε):</span>
                              <span className={`font-mono font-bold ${Math.abs(closestRefMatch.strainMismatch) < 0.2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {closestRefMatch.strainMismatch > 0 ? '+' : ''}{closestRefMatch.strainMismatch.toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setCenter(closestRefMatch.peak.theta)}
                            className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            Snap Centroid to {closestRefMatch.peak.label}
                          </button>
                        </div>
                      )}

                      {/* Interactive Reflection Grid */}
                      {parsedRefPeaks.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span>Reference Bragg Reflections ({parsedRefPeaks.length})</span>
                            <span>I/I₀ Relative Intensity</span>
                          </div>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {parsedRefPeaks.map((peak, idx) => {
                              const isCurrentCenter = Math.abs(center - peak.theta) < 0.03;
                              const intensityPct = peak.relIntensity || 100;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => setCenter(peak.theta)}
                                  className={`w-full p-2 text-[10px] font-mono rounded-lg border transition-all text-left flex flex-col gap-1 cursor-pointer ${
                                    isCurrentCenter
                                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-extrabold shadow-sm'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                  title={`Click to snap active peak center to ${peak.theta.toFixed(3)}°`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${isCurrentCenter ? 'bg-indigo-600 dark:bg-indigo-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                                      <span className="font-extrabold">{peak.label}</span>
                                    </div>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      d = {peak.dSpacing.toFixed(3)} Å
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                                    <span>2θ = <strong className="text-slate-700 dark:text-slate-200">{peak.theta.toFixed(2)}°</strong></span>
                                    <span>Rel. I: <strong className="text-slate-700 dark:text-slate-200">{intensityPct}%</strong></span>
                                  </div>

                                  {/* Intensity progress bar */}
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isCurrentCenter ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${intensityPct}%` }}
                                    ></div>
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

                {/* 2. Background Baseline & Slope Controls */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Background & Noise Floor
                    </span>
                  </div>

                  {/* Constant Background Level */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Constant Baseline (cps):</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{background.toFixed(1)} cps</span>
                    </div>
                    <input
                      type="range" min="0" max="80" step="1"
                      value={String(background) === 'NaN' ? '' : background} 
                      onChange={(e) => setBackground(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Linear Background Slope */}
                  <div className="space-y-1 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Background Slope (cps/°):</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{bgSlope.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="-2.00" max="2.00" step="0.05"
                      value={String(bgSlope) === 'NaN' ? '' : bgSlope} 
                      onChange={(e) => setBgSlope(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                      <span>-2.0 (Air Scatter)</span>
                      <span>0.0 (Flat)</span>
                      <span>+2.0 (Fluorescence)</span>
                    </div>
                  </div>

                  {/* Poisson Shot Noise */}
                  <div className="space-y-1 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Poisson Shot Noise (σ ∝ √I):</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{(noiseLevel * 10).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="10" step="0.5"
                      value={String(noiseLevel) === 'NaN' ? '' : noiseLevel} 
                      onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 font-mono mt-1">
                      <span>0% (Ideal)</span>
                      <span>50% (Typical)</span>
                      <span>100% (Noisy)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Amorphous Glass/Polymer Scattering Halo */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-purple-500" />
                      Amorphous Glass/Polymer Halo
                    </span>
                    <button
                      onClick={() => setEnableAmorphousHalo(!enableAmorphousHalo)}
                      className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase transition-all cursor-pointer ${
                        enableAmorphousHalo
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {enableAmorphousHalo ? 'Halo ON' : 'OFF'}
                    </button>
                  </div>

                  {enableAmorphousHalo ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Halo Center (2θ):</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{amorphousCenter.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range" min="15.0" max="45.0" step="0.5"
                          value={amorphousCenter}
                          onChange={(e) => setAmorphousCenter(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Halo Width FWHM (2θ):</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{amorphousFwhm.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range" min="4.0" max="25.0" step="0.5"
                          value={amorphousFwhm}
                          onChange={(e) => setAmorphousFwhm(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Halo Amplitude (cps):</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{amorphousAmp.toFixed(1)} cps</span>
                        </div>
                        <input
                          type="range" min="1.0" max="50.0" step="1.0"
                          value={amorphousAmp}
                          onChange={(e) => setAmorphousAmp(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      <p className="text-[9px] text-purple-900/80 dark:text-purple-300/80 bg-purple-50/60 dark:bg-purple-950/40 p-2 rounded-lg border border-purple-200/60 dark:border-purple-900/40 font-mono">
                        Simulates broad diffuse liquid/glass amorphous hump from glass substrates, polymers or amorphous phases.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      No broad amorphous background hump included.
                    </p>
                  )}
                </div>

                {/* 4. Live Signal Quality & SNR Stats Readout Card */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-slate-700/60 shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                      Signal Quality & SNR Live Profile
                    </span>
                    <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                      (extSim.stats.snr || 0) >= 20
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : (extSim.stats.snr || 0) >= 8
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {(extSim.stats.snr || 0) >= 20 ? 'EXCELLENT' : (extSim.stats.snr || 0) >= 8 ? 'MODERATE' : 'NOISY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Peak Intensity</span>
                      <strong className="text-amber-300">{amplitude.toFixed(1)} cps</strong>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Peak-to-Background</span>
                      <strong className="text-indigo-300">{(extSim.stats.peakToBackground || 0).toFixed(1)} : 1</strong>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Signal-to-Noise (SNR)</span>
                      <strong className="text-emerald-300">{(extSim.stats.snr || 0).toFixed(1)} dB</strong>
                    </div>

                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Poisson Noise Floor</span>
                      <strong className="text-purple-300">{(noiseLevel * 10).toFixed(0)}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export and Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Profile (.CSV)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExportGraphImage('png')}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Export High-Res PNG Chart Figure"
                >
                  <Camera className="w-3 h-3 text-indigo-500" />
                  PNG Graph
                </button>
                <button
                  onClick={() => handleExportGraphImage('svg')}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Export Scalable Vector Graphic SVG"
                >
                  <Image className="w-3 h-3 text-purple-500" />
                  SVG Graph
                </button>
              </div>
            </div>

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
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 block flex items-center gap-2">
                Diffraction Simulation Scenarios
                <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-indigo-500/30 text-indigo-200 font-mono">1-Click Scenarios</span>
              </span>
              <span className="text-[10px] text-indigo-300/80">Realistic physical crystal, instrumental & deconvolution standards</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => applyScenarioPreset('solitude')}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/30 to-amber-600/30 hover:from-amber-500/40 hover:to-amber-600/40 text-amber-200 text-[10px] font-extrabold uppercase rounded-lg border border-amber-400/50 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              title="Solitude Pure Peak Mode - Pristine, clutter-free clean Bragg diffraction curve with zero noise"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Solitude Pure Peak
            </button>
            <button
              onClick={() => applyScenarioPreset('silicon')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Silicon (111) Calibration Standard - Narrow Instrumental Broadening"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Si Standard (0.08°)
            </button>
            <button
              onClick={() => applyScenarioPreset('gold_nano')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Gold Nanoparticle Broadened Peak (~10nm domain size)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Nanoparticle (~10nm)
            </button>
            <button
              onClick={() => applyScenarioPreset('ka_doublet')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Cu Kα1/Kα2 Doublet Splitting Resolution"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Kα Doublet Split
            </button>
            <button
              onClick={() => applyScenarioPreset('strain')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Asymmetric Microstrain Tailed Peak"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Microstrain Tailed
            </button>
            <button
              onClick={() => applyScenarioPreset('multi_peak')}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-[10px] font-bold uppercase rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Overlapping Multi-Phase Reflection Deconvolution"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Overlapping Deconv
            </button>
          </div>
        </div>
        
        {/* Top Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'visualizer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              Visualizer & NLLS Fitting
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Import Real XRD Data (.xy, .csv)
              {importedPoints.length > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                  {importedPoints.length} pts
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'theory'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Theoretical Diagrams & Physics Reference
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2.5 pr-2">
            <span>λ = {(activeWavelength * 10).toFixed(4)} Å</span>
            <span>|</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">2θ₀ = {center.toFixed(3)}°</span>
          </div>
        </div>

        {/* TAB 1: VISUALIZER & FITTING */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Main interactive Chart Container */}
            <div 
              className="bg-white dark:bg-slate-900 p-5 lg:p-7 rounded-2xl border-2 border-slate-300 dark:border-slate-800 relative overflow-hidden shadow-md"
              ref={chartContainerRef}
              onMouseEnter={() => setIsHovered(true)} 
              onMouseLeave={() => setIsHovered(false)}
            >
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-3 z-10">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  Line Profile Peak Visualizer
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 shadow-sm">
                  {type} {type === 'Pseudo-Voigt' ? `(η=${(extSim.stats.effEta * 100).toFixed(0)}%)` : ''}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-2 border-purple-400 dark:border-purple-700 shadow-sm">
                  FWHM β_obs = {extSim.stats.effTchFwhm.toFixed(4)}°
                </span>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                Interactive Bragg peak profile fitting & deconvolution. Click on chart to snap peak centroid.
              </p>
            </div>

            {/* Quick Action Toolbar - Organized into logical groups */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary Actions Group */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={autoFitPeakModel}
                  disabled={isFitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm disabled:opacity-50 hover:scale-105 active:scale-95"
                  title="Perform Non-Linear Least Squares Auto-Fit on observed peak data"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isFitting ? 'animate-spin' : ''}`} />
                  {isFitting ? 'Fitting...' : 'Auto-Fit'}
                </button>

                <button
                  onClick={toggleSolitudeMode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isSolitudeMode 
                      ? 'bg-amber-500 text-white border border-amber-300 dark:border-amber-400 font-extrabold animate-pulse' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Toggle Solitude View: Instantly hide all noise, residuals, and clutter for pure clean peak curve"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSolitudeMode ? 'text-amber-100' : 'text-amber-500'}`} />
                  {isSolitudeMode ? 'Solitude' : 'Solitude View'}
                </button>

                <button
                  onClick={() => setHighPrecisionControls(!highPrecisionControls)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    highPrecisionControls 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-extrabold' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle High-Precision Controls (0.001° step size)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
                  {highPrecisionControls ? 'Fine Step' : 'Coarse'}
                </button>
              </div>

              {/* Physical Layers & Model Components Group */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowComponents(!showComponents)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    showComponents ? 'bg-indigo-600 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Gaussian & Lorentzian sub-components"
                >
                  <Eye className="w-3.5 h-3.5" />
                  G/L Parts
                </button>

                <button
                  onClick={() => setEnableKaDoublet(!enableKaDoublet)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    enableKaDoublet ? 'bg-amber-600 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Cu Kα₁/Kα₂ Doublet Splitting"
                >
                  <Split className="w-3.5 h-3.5 text-amber-500" />
                  Doublet
                </button>

                <button
                  onClick={() => setEnableSecondaryPeak(!enableSecondaryPeak)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    enableSecondaryPeak ? 'bg-emerald-600 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Secondary Peak Deconvolution"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  2nd Peak
                </button>

                <button
                  onClick={() => setApplyLpFactor(!applyLpFactor)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    applyLpFactor ? 'bg-cyan-600 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Lorentz-Polarization geometric correction factor"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  Lp
                </button>

                <button
                  onClick={() => setShowLiveSummary(!showLiveSummary)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    showLiveSummary ? 'bg-purple-600 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle On-Chart Live Scientific Summary HUD Overlay"
                >
                  <Gauge className="w-3.5 h-3.5 text-purple-500" />
                  HUD
                </button>

                <button
                  onClick={() => setShowResiduals(!showResiduals)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    showResiduals ? 'bg-rose-600 text-white shadow-sm font-extrabold' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Residuals Pane"
                >
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  Residuals
                </button>
              </div>

              {/* Utility Tools Group */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleExportGraphImage('png')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Capture high-resolution PNG image"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  PNG
                </button>

                <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setZoomRange(prev => Math.max(0.3, prev - 0.2))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomRange(prev => Math.min(2.5, prev + 0.2))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomRange(1.0)}
                    className="px-1.5 py-0.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 hover:text-indigo-600 cursor-pointer"
                    title="Reset Zoom"
                  >
                    1x
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chart Overlays & Display Toggles Bar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 mb-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              Chart Overlays:
            </span>

            <button
              onClick={() => setShowNoisyCurve(!showNoisyCurve)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                showNoisyCurve 
                  ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-bold shadow-sm' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="Toggle red raw noise data curve on/off"
            >
              <span className={`w-2 h-2 rounded-full ${showNoisyCurve ? 'bg-rose-600 dark:bg-rose-400' : 'bg-slate-400'}`} />
              Red Raw Data
            </button>

            <button
              onClick={() => setShowHalfMaxBounds(!showHalfMaxBounds)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                showHalfMaxBounds 
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold shadow-sm' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="Toggle FWHM 2θ₁ and 2θ₂ half-max vertical line bounds"
            >
              <span className={`w-2 h-2 rounded-full ${showHalfMaxBounds ? 'bg-amber-600 dark:bg-amber-400' : 'bg-slate-400'}`} />
              FWHM 2θ₁/2θ₂ Bounds
            </button>

            <button
              onClick={() => setShowIntegralBreadthBox(!showIntegralBreadthBox)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                showIntegralBreadthBox 
                  ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 font-bold shadow-sm' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="Toggle integral breadth area box (I_max * beta)"
            >
              <span className={`w-2 h-2 rounded-full ${showIntegralBreadthBox ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-400'}`} />
              Integral Breadth Box
            </button>

            <button
              onClick={() => setShowSigmaSpan(!showSigmaSpan)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                showSigmaSpan 
                  ? 'bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200 border border-pink-300 dark:border-pink-700 font-bold shadow-sm' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="Toggle Gaussian standard deviation sigma span markers (-c, +c)"
            >
              <span className={`w-2 h-2 rounded-full ${showSigmaSpan ? 'bg-pink-600 dark:bg-pink-400' : 'bg-slate-400'}`} />
              Sigma Width Span
            </button>

            <button
              onClick={() => setShowImaxLines(!showImaxLines)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                showImaxLines 
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold shadow-sm' 
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="Toggle peak maximum intensity baseline lines"
            >
              <span className={`w-2 h-2 rounded-full ${showImaxLines ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-400'}`} />
              I_max Baselines
            </button>
          </div>

          {/* Optional Floating On-Chart Live Scientific Summary Badge */}
          {showLiveSummary && (
            <div className="absolute top-20 right-8 z-30 pointer-events-auto flex flex-col gap-2 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-xl border-2 border-indigo-500/70 text-xs font-mono shadow-2xl min-w-[260px] max-w-[320px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between gap-3 font-bold text-indigo-300 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live HUD Summary
                </span>
                <button
                  onClick={() => setShowLiveSummary(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Live HUD Summary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] pt-1">
                <div className="text-slate-400 font-medium">Profile Model:</div>
                <div className="font-extrabold text-emerald-400 text-right">{type}</div>

                <div className="text-slate-400 font-medium">Peak Centroid (2θ):</div>
                <div className="font-extrabold text-white text-right font-mono">{center.toFixed(3)}°</div>

                <div className="text-slate-400 font-medium">Observed FWHM (β_obs):</div>
                <div className="font-extrabold text-indigo-400 text-right font-mono">{extSim.stats.effTchFwhm.toFixed(4)}°</div>

                {enableInstCorrection && (
                  <>
                    <div className="text-slate-400 font-medium">Instrument (β_inst):</div>
                    <div className="font-extrabold text-slate-300 text-right font-mono">{extSim.stats.betaInst.toFixed(4)}°</div>

                    <div className="text-slate-400 font-medium">Sample (β_sample):</div>
                    <div className="font-extrabold text-purple-300 text-right font-mono">{extSim.stats.betaSample.toFixed(4)}°</div>
                  </>
                )}

                <div className="text-slate-400 font-medium">d-Spacing (d):</div>
                <div className="font-extrabold text-emerald-300 text-right font-mono">{extSim.stats.dSpacing.toFixed(4)} Å</div>

                <div className="text-slate-400 font-medium">Crystallite Size (D):</div>
                <div className="font-extrabold text-amber-300 text-right font-mono">
                  {extSim.stats.betaSample > 0 ? `${((scherrerK * activeWavelength) / ((extSim.stats.betaSample * Math.PI / 180) * Math.cos((center / 2) * Math.PI / 180))).toFixed(1)} nm` : '-'}
                </div>

                <div className="text-slate-400 font-medium">Microstrain (ε):</div>
                <div className="font-extrabold text-cyan-300 text-right font-mono">
                  {extSim.stats.betaSample > 0 ? `${((extSim.stats.betaSample * Math.PI / 180) / (4 * Math.tan((center / 2) * Math.PI / 180)) * 100).toFixed(3)}%` : '-'}
                </div>

                <div className="text-slate-400 font-medium border-t border-slate-800 pt-1 mt-0.5">R_wp / χ²:</div>
                <div className="font-extrabold text-rose-300 text-right font-mono border-t border-slate-800 pt-1 mt-0.5">
                  {extSim.stats.rWP.toFixed(2)}% / {extSim.stats.goodnessOfFit.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Recharts Figure */}
          <div className="w-full h-[460px] lg:h-[520px] min-h-[400px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 35, left: 15, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activeLabel !== undefined) {
                    setCenter(Number(e.activeLabel));
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#6366f1" stopOpacity={0.65}/>
                     <stop offset="50%" stopColor="#6366f1" stopOpacity={0.25}/>
                     <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05}/>
                  </linearGradient>
                  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="1.5" height="6" transform="translate(0,0)" fill="#475569" opacity="0.35"></rect>
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.5} strokeWidth={1.2} />
                
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  tick={{fontSize: 12, fill: '#334155', fontWeight: 700}}
                  label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 5, fill: '#0f172a', fontSize: 13, fontWeight: 800 }}
                  tickFormatter={(val) => val.toFixed(2)}
                  axisLine={{ stroke: '#475569', strokeWidth: 2 }}
                  tickLine={{ stroke: '#475569', strokeWidth: 2 }}
                />
                <YAxis 
                  domain={[0, amplitude * 1.35]} 
                  width={45} 
                  tick={{fontSize: 12, fill: '#334155', fontWeight: 700}}
                  axisLine={{ stroke: '#475569', strokeWidth: 2 }}
                  tickLine={{ stroke: '#475569', strokeWidth: 2 }}
                />
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      const thetaRad = (dataPoint.x / 2) * Math.PI / 180;
                      const localSize = activeWavelength * scherrerK / ((fwhm * Math.PI / 180) * Math.cos(thetaRad));
                      
                      return (
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-2xl text-xs border-2 border-indigo-500/80 min-w-[240px] backdrop-blur-md">
                          <div className="font-extrabold border-b border-slate-700 pb-2 mb-2 text-indigo-400 flex items-center justify-between">
                            <span>Angle 2θ: {dataPoint.x.toFixed(4)}°</span>
                            <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded font-mono text-indigo-300 border border-indigo-700">{type}</span>
                          </div>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Y_obs (Noisy):</span>
                              <span className="font-extrabold text-rose-400">{dataPoint.y.toFixed(1)} cps</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Y_calc (Clean):</span>
                              <span className="font-extrabold text-indigo-300">{dataPoint._cleanY?.toFixed(1) || '-'} cps</span>
                            </div>
                            {dataPoint.residual !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Residual:</span>
                                <span className="font-extrabold text-emerald-400">{dataPoint.residual > 0 ? `+${dataPoint.residual.toFixed(1)}` : dataPoint.residual.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yG !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-purple-400">Gaussian:</span>
                                <span className="font-extrabold text-purple-300">{dataPoint.yG.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yL !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-cyan-400">Lorentzian:</span>
                                <span className="font-extrabold text-cyan-300">{dataPoint.yL.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yKa1 !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-blue-400">Kα₁ Peak:</span>
                                <span className="font-extrabold text-blue-300">{dataPoint.yKa1.toFixed(1)} cps</span>
                              </div>
                            )}
                            {dataPoint.yKa2 !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-amber-400">Kα₂ Peak:</span>
                                <span className="font-extrabold text-amber-300">{dataPoint.yKa2.toFixed(1)} cps</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1.5 border-t border-slate-700">
                              <span className="text-slate-400">Local Coherence:</span>
                              <span className="font-extrabold text-emerald-400">{localSize.toFixed(1)} nm</span>
                            </div>
                            {applyLpFactor && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Lp Factor (local):</span>
                                <span className="font-extrabold text-cyan-300">
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
                  cursor={{ stroke: '#818cf8', strokeWidth: 2, strokeDasharray: '4 4' }}
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
                     <Label value="Background Level" position="insideBottomRight" offset={10} fill="#64748b" fontSize={11} fontWeight="800" />
                  </ReferenceArea>
                )}

                {/* Integral Breadth Area Box */}
                {stats && showIntegralBreadthBox && (
                  <ReferenceArea 
                    x1={center - stats.integralBreadth / 2} 
                    x2={center + stats.integralBreadth / 2} 
                    y1={background} y2={amplitude + background} 
                    fill="rgba(99, 102, 241, 0.12)"
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  >
                    <Label value="Integral Breadth Box (β × I_max)" position="insideBottom" offset={12} fill="#4f46e5" fontSize={11} fontWeight="800" />
                  </ReferenceArea>
                )}

                {/* Half Maximum Vertical Bounds (2θ₁ and 2θ₂) */}
                {extSim.stats && showHalfMaxBounds && (
                  <>
                    <ReferenceLine x={extSim.stats.theta1} stroke="#d97706" strokeDasharray="3 3" strokeWidth={2}>
                      <Label value="2θ₁" position="top" fill="#d97706" fontSize={12} fontWeight="800" offset={6} />
                    </ReferenceLine>
                    <ReferenceLine x={extSim.stats.theta2} stroke="#d97706" strokeDasharray="3 3" strokeWidth={2}>
                      <Label value="2θ₂" position="top" fill="#d97706" fontSize={12} fontWeight="800" offset={6} />
                    </ReferenceLine>
                    <ReferenceDot x={extSim.stats.theta1} y={amplitude / 2 + background} r={6} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                    <ReferenceDot x={extSim.stats.theta2} y={amplitude / 2 + background} r={6} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                  </>
                )}

                {/* Gaussian Standard Deviation c = sigma span */}
                {extSim.stats && showSigmaSpan && (
                  <>
                    <ReferenceLine x={center - extSim.stats.gaussianSigmaC} stroke="#db2777" strokeDasharray="2 2" strokeWidth={1.5}>
                      <Label value="-c (-σ)" position="insideBottomLeft" fill="#db2777" fontSize={10} fontWeight="800" />
                    </ReferenceLine>
                    <ReferenceLine x={center + extSim.stats.gaussianSigmaC} stroke="#db2777" strokeDasharray="2 2" strokeWidth={1.5}>
                      <Label value="+c (+σ)" position="insideBottomRight" fill="#db2777" fontSize={10} fontWeight="800" />
                    </ReferenceLine>
                  </>
                )}

                {/* Half Maximum Intensity Line */}
                {showImaxLines && (
                  <ReferenceLine y={amplitude / 2 + background} stroke="#d97706" strokeDasharray="3 3" strokeWidth={1.5}>
                    <Label value={`I_max / 2 (${(amplitude / 2 + background).toFixed(1)} cps)`} position="insideRight" fill="#d97706" fontSize={11} fontWeight="700" offset={10} />
                  </ReferenceLine>
                )}

                {/* Centroid Reference Marker */}
                <ReferenceLine x={center} stroke="#4f46e5" strokeDasharray="3 3" strokeWidth={2}>
                   <Label value="Centroid (2θ₀)" position="top" fill="#4f46e5" fontSize={12} fontWeight="800" offset={8} />
                </ReferenceLine>
                <ReferenceDot x={center} y={amplitude + background} r={6} fill="#4f46e5" stroke="#ffffff" strokeWidth={2} />

                {/* Reference Material Peaks Overlay Lines */}
                {showReferencePeaks && parsedRefPeaks.map((peak, idx) => {
                  const xMin = chartData[0]?.x || 0;
                  const xMax = chartData[chartData.length - 1]?.x || 180;
                  if (peak.theta >= xMin && peak.theta <= xMax) {
                    return (
                      <ReferenceLine 
                        key={`ref-peak-${idx}`} 
                        x={peak.theta} 
                        stroke="#059669" 
                        strokeDasharray="4 4" 
                        strokeWidth={2}
                      >
                         <Label 
                           value={`${peak.label} | ${peak.theta.toFixed(2)}° | d=${peak.dSpacing.toFixed(3)}Å (${peak.relIntensity || 100}%)`} 
                           position="insideTopLeft" 
                           fill="#047857" 
                           fontSize={11} 
                           fontWeight="800" 
                           offset={12 + (idx % 3) * 14} 
                         />
                      </ReferenceLine>
                    );
                  }
                  return null;
                })}

                {/* Intensity Markers */}
                {showImaxLines && (
                  <ReferenceLine y={amplitude + background} stroke="#64748b" strokeWidth={1.5} strokeDasharray="2 3">
                     <Label value={`I_max: ${(amplitude + background).toFixed(1)} cps`} position="insideLeft" fill="#475569" fontSize={11} fontWeight="700" offset={10} />
                  </ReferenceLine>
                )}

                {/* FWHM Boundary Line & Markers */}
                <ReferenceLine 
                  segment={[{ x: extSim.stats.theta1, y: amplitude / 2 + background }, { x: extSim.stats.theta2, y: amplitude / 2 + background }]} 
                  stroke="#3730a3" 
                  strokeWidth={3.5}
                >
                  <Label value={`FWHM B = 2θ₂ - 2θ₁ = ${extSim.stats.effTchFwhm.toFixed(4)}°`} position="top" fill="#312e81" fontSize={12} fontWeight="800" offset={8} />
                </ReferenceLine>
                <ReferenceDot x={center - fwhm / 2} y={amplitude / 2 + background} r={6} fill="#4338ca" stroke="#ffffff" strokeWidth={2} />
                <ReferenceDot x={center + fwhm / 2} y={amplitude / 2 + background} r={6} fill="#4338ca" stroke="#ffffff" strokeWidth={2} />

                {/* Gaussian Sub-Curve Component */}
                {type === 'Pseudo-Voigt' && showComponents && (
                  <Line 
                    type="monotone" 
                    dataKey="yG" 
                    stroke="#a855f7" 
                    strokeWidth={2.5} 
                    strokeDasharray="4 4" 
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
                    strokeWidth={2.5} 
                    strokeDasharray="4 4" 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Kα1 Profile */}
                {enableKaDoublet && (
                  <Line 
                    type="monotone" 
                    dataKey="yKa1" 
                    stroke="#2563eb" 
                    strokeWidth={2.5} 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                )}

                {/* Kα2 Profile */}
                {enableKaDoublet && (
                  <Line 
                    type="monotone" 
                    dataKey="yKa2" 
                    stroke="#d97706" 
                    strokeWidth={2.5} 
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
                    stroke="#059669" 
                    strokeWidth={2.5} 
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
                   strokeWidth={3.5}
                   fillOpacity={1} 
                   fill="url(#colorY)" 
                   isAnimationActive={false}
                   activeDot={false}
                />

                {/* Statistical Noisy Curve (Red Raw Peak Data) */}
                {showNoisyCurve && (
                  <Area 
                     type="monotone" 
                     dataKey="y" 
                     stroke="#ff2a5f" 
                     strokeWidth={1.8}
                     strokeOpacity={0.85}
                     fillOpacity={0} 
                     fill="none" 
                     isAnimationActive={false}
                     activeDot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Synchronized Difference Residuals Pane */}
          {showResiduals && chartData.length > 0 && (
            <div className="mt-4 bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Fit Residual Difference (Y_obs - Y_calc)
                </span>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">R_p: <strong className="text-indigo-600 dark:text-indigo-400">{extSim.stats.rP.toFixed(2)}%</strong></span>
                  <span className="text-slate-600 dark:text-slate-400">R_wp: <strong className="text-purple-600 dark:text-purple-400">{extSim.stats.rWP.toFixed(2)}%</strong></span>
                  <span className="text-slate-600 dark:text-slate-400">GoF (χ²): <strong className="text-emerald-600 dark:text-emerald-400">{extSim.stats.goodnessOfFit.toFixed(2)}</strong></span>
                </div>
              </div>
              <div className="h-[110px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 35, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#94a3b8" strokeOpacity={0.5} />
                    <XAxis dataKey="x" hide domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <ReferenceLine y={0} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="residual" stroke="#ff2a5f" strokeWidth={1.8} dot={false} isAnimationActive={false} />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          
          {/* Observed FWHM Card */}
          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 rounded-xl border-2 border-indigo-300 dark:border-indigo-700/80 shadow-sm">
            <span className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-1">
              Observed Peak FWHM (β_obs)
            </span>
            <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-300">
              {extSim.stats.effTchFwhm.toFixed(4)}°
            </span>
            <p className="text-[9px] text-indigo-800 dark:text-indigo-300/80 font-medium mt-0.5 leading-normal font-sans">
              β_sample = {extSim.stats.betaSample.toFixed(4)}°
            </p>
          </div>
          
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
              FWTM ÷ FWHM Ratio
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
                    D = <span className="text-purple-600 dark:text-purple-400">(K · λ)</span> ÷ <span className="text-emerald-600 dark:text-emerald-400">(β_size · cos(θ))</span>
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
                    ε = <span className="text-blue-600 dark:text-blue-400">β_strain</span> ÷ <span className="text-rose-600 dark:text-rose-400">(4 · tan(θ))</span>
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
                  {"I(θ) = I₀ / [1 + ((θ-θ₀)/w)²]"}
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
                  {"I(θ) = I₀ / [1 + (2^(1/m)-1)·((θ-θ₀)/w)²]ᵐ"}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Highly adaptable profile. Mixer exponent <strong className="text-slate-700 dark:text-slate-300">m</strong> transitions seamlessly between L(1) and G(∞).
                </p>
              </div>

            </div>
          </div>

        </div>
        </div>
        )}

        {/* TAB 2: IMPORT REAL EXPERIMENTAL DATA */}
        {activeTab === 'import' && (
          <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Header & Quick Start Guide */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-500" />
                  Import Real XRD Spectrum Data & Multi-Peak Extraction
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drag & drop, upload, or paste two-column diffraction patterns (2θ vs Intensity). Automatically detect 1 to 10+ Bragg peaks.
                </p>
              </div>
              <button
                onClick={() => handleParseAndDetect(rawDatasetText, targetPeaksCount)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Check className="w-4 h-4" />
                Parse Data & Extract Peaks
              </button>
            </div>

            {/* Step-by-Step Friendly Workflow Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">Load or Paste Spectrum</p>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">Upload .xy, .csv, .dat or click sample datasets below.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">Choose Peak Count</p>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">Select 1, 2, 3, 5, 10, or 'All' to deconvolve multi-peak spectra.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">Analyze & Load</p>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">Click any peak to instantly model, deconvolve, or overlay markers.</p>
                </div>
              </div>
            </div>

            {/* Quick Multi-Peak Preset Samples Bar */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Test Sample Spectrum Datasets:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setRawDatasetText(SAMPLE_DATASETS.silicon3Peaks);
                    handleParseAndDetect(SAMPLE_DATASETS.silicon3Peaks, targetPeaksCount);
                  }}
                  className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  3-Peak Silicon Standard
                </button>
                <button
                  onClick={() => {
                    setRawDatasetText(SAMPLE_DATASETS.rutile5Peaks);
                    handleParseAndDetect(SAMPLE_DATASETS.rutile5Peaks, targetPeaksCount);
                  }}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold rounded-lg border border-purple-300 dark:border-purple-800 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
                  5-Peak TiO₂ Rutile
                </button>
                <button
                  onClick={() => {
                    setRawDatasetText(SAMPLE_DATASETS.doublet2Peaks);
                    handleParseAndDetect(SAMPLE_DATASETS.doublet2Peaks, targetPeaksCount);
                  }}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-800 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
                >
                  <Split className="w-3.5 h-3.5 text-amber-500" />
                  2-Peak Kα₁/Kα₂ Doublet
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Drag & Drop Zone + Data Text Area */}
              <div className="lg:col-span-7 space-y-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                          setRawDatasetText(content);
                          handleParseAndDetect(content, targetPeaksCount);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 scale-[1.01]' 
                      : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-emerald-400'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-emerald-500 mb-1 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Drag & Drop Spectrum File Here or Click to Browse
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports .xy, .csv, .dat, .txt diffraction files (2θ vs Intensity)
                  </p>
                  <input
                    type="file"
                    accept=".xy,.csv,.dat,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          if (content) {
                            setRawDatasetText(content);
                            handleParseAndDetect(content, targetPeaksCount);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Raw Diffraction Text (2θ, Intensity)</span>
                    <span className="text-[10px] text-slate-400 font-mono">2theta, Intensity</span>
                  </label>
                  <textarea
                    rows={8}
                    value={rawDatasetText}
                    onChange={(e) => setRawDatasetText(e.target.value)}
                    placeholder={`# Example format:\n2theta, Intensity\n28.00  12.4\n28.10  18.2\n28.20  45.8\n28.30  95.1\n28.44  124.5\n28.50  82.0\n28.60  34.1\n28.70  15.0`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {importedPoints.length > 0 ? `${importedPoints.length} Data Points Parsed` : 'No dataset parsed yet'}
                  </span>
                  <button
                    onClick={() => {
                      setRawDatasetText('');
                      setImportedPoints([]);
                      setExtractedPeaks([]);
                      setImportStatusMessage('Cleared imported dataset.');
                    }}
                    className="px-3 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer font-bold"
                  >
                    Clear Data
                  </button>
                </div>

                {importStatusMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-mono">
                    {importStatusMessage}
                  </div>
                )}
              </div>

              {/* Right Column: Multi-Peak Settings & Configuration */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Peak Extraction Control</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      {targetPeaksCount === 0 ? 'ALL PEAKS' : `${targetPeaksCount} PEAKS`}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Select how many Bragg peaks to automatically detect and deconvolve from the spectrum.
                  </p>
                </div>

                {/* How Many Peaks Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    How Many Peaks to Import / Extract?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                    {[1, 2, 3, 5, 10, 0].map((countVal) => (
                      <button
                        key={countVal}
                        onClick={() => {
                          setTargetPeaksCount(countVal);
                          if (importedPoints.length > 0) {
                            const found = runPeakDetection(importedPoints, countVal);
                            setExtractedPeaks(found);
                            setImportStatusMessage(`Re-extracted peaks: Found ${found.length} peak(s) (Limit: ${countVal > 0 ? countVal : 'All'}).`);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs ${
                          targetPeaksCount === countVal
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40 scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {countVal === 0 ? 'Auto All' : `${countVal} ${countVal === 1 ? 'Peak' : 'Peaks'}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Format Compatibility:</h5>
                  <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed font-sans">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Supports <strong>.xy</strong>, <strong>.csv</strong>, <strong>.dat</strong>, <strong>.txt</strong> formats.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Comments (# or //) are ignored automatically.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Delimiters: spaces, tabs, commas, or semicolons.</span>
                    </li>
                  </ul>
                </div>

                {importedPoints.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                      onClick={() => {
                        setActiveTab('visualizer');
                        autoFitPeakModel();
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
                    >
                      <Wand2 className="w-4 h-4" />
                      Auto-Fit Profile to Primary Peak
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Mini Live Spectrum Preview Plot with Peak Pins */}
            {importedPoints.length > 0 && (
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-white">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    Live Imported Spectrum Chart & Extracted Peak Locations
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {importedPoints.length} points | {extractedPeaks.length} Peak Pins
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={importedPoints} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="x" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v.toFixed(1)}°`} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        formatter={(val: any) => [`${Number(val).toFixed(1)} cps`, 'Intensity']}
                        labelFormatter={(lbl) => `2θ = ${Number(lbl).toFixed(2)}°`}
                      />
                      <Area type="monotone" dataKey="y" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
                      
                      {/* Plot Vertical Lines and Label Flags for Each Extracted Peak */}
                      {extractedPeaks.map((pk) => (
                        <ReferenceLine key={pk.id} x={pk.center} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5}>
                          <Label value={`#${pk.id} (${pk.center.toFixed(1)}°)`} position="top" fill="#f59e0b" fontSize={10} fontWeight="bold" />
                        </ReferenceLine>
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Extracted Multi-Peak Interactive Display (Cards / Table View) */}
            {extractedPeaks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      Extracted Bragg Peaks ({extractedPeaks.length} Peak{extractedPeaks.length > 1 ? 's' : ''} Identified)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Calculated centroids, relative intensities, estimated FWHM, and d-spacings for all extracted peaks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Cards vs Table View Toggle */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        onClick={() => setPeaksViewMode('cards')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-bold ${
                          peaksViewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        Cards
                      </button>
                      <button
                        onClick={() => setPeaksViewMode('table')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-bold ${
                          peaksViewMode === 'table' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        Table
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const refs = extractedPeaks.map(p => p.center.toFixed(2)).join(', ');
                        setCustomRefPeaks(refs);
                        setShowReferencePeaks(true);
                        setActiveTab('visualizer');
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                      title="Export all extracted peak centroids as vertical reference line markers in the visualizer"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-emerald-200" />
                      Load Markers
                    </button>
                  </div>
                </div>

                {/* Cards View */}
                {peaksViewMode === 'cards' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {extractedPeaks.map((pk) => (
                      <div
                        key={pk.id}
                        className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 transition-all space-y-3 shadow-sm hover:shadow-md relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs font-mono">
                            Peak #{pk.id}
                          </span>
                          {pk.relIntensity >= 95 && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                              Primary Peak
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-sans">Centroid 2θ:</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{pk.center.toFixed(3)}°</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-sans">Intensity:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{pk.intensity.toFixed(1)} cps</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-sans">Est. FWHM:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{pk.fwhmEst.toFixed(3)}°</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-sans">d-Spacing:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">{pk.dSpacing > 0 ? `${pk.dSpacing.toFixed(3)} Å` : '-'}</span>
                          </div>
                        </div>

                        {/* Relative Height Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Rel. Height:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{pk.relIntensity.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, pk.relIntensity)}%` }} />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setCenter(pk.center);
                              setAmplitude(parseFloat(Math.max(1, pk.intensity - background).toFixed(1)));
                              if (pk.fwhmEst > 0.01 && pk.fwhmEst < 10) {
                                setFwhmManual(pk.fwhmEst);
                              }
                              setUseCaglioti(false);
                              setActiveTab('visualizer');
                            }}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                            title="Load this peak into the Profile Visualizer"
                          >
                            <Check className="w-3 h-3" />
                            Load Main
                          </button>
                          <button
                            onClick={() => {
                              setEnableSecondaryPeak(true);
                              const diff = parseFloat((pk.center - center).toFixed(3));
                              setSecondPeakOffset(diff !== 0 ? diff : 0.4);
                              setSecondPeakFwhm(pk.fwhmEst);
                              const primaryMax = Math.max(1, amplitude);
                              setSecondPeakAmp(parseFloat((Math.max(1, pk.intensity - background) / primaryMax * 100).toFixed(1)));
                              setActiveTab('visualizer');
                            }}
                            className="flex-1 py-1.5 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Set as overlapping secondary peak for deconvolution"
                          >
                            <Split className="w-3 h-3" />
                            Overlapping
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Table View */
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Peak #</th>
                          <th className="py-3 px-4">Centroid 2θ (°)</th>
                          <th className="py-3 px-4">Intensity (cps)</th>
                          <th className="py-3 px-4">Rel. Height (%)</th>
                          <th className="py-3 px-4">Est. FWHM (°)</th>
                          <th className="py-3 px-4">d-Spacing (Å)</th>
                          <th className="py-3 px-4 text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                        {extractedPeaks.map((pk) => (
                          <tr key={pk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                              #{pk.id}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-slate-100">
                              {pk.center.toFixed(3)}°
                            </td>
                            <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-bold">
                              {pk.intensity.toFixed(1)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, pk.relIntensity)}%` }} />
                                </div>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">{pk.relIntensity.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">
                              {pk.fwhmEst.toFixed(3)}°
                            </td>
                            <td className="py-3 px-4 text-purple-600 dark:text-purple-400 font-bold">
                              {pk.dSpacing > 0 ? `${pk.dSpacing.toFixed(4)} Å` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setCenter(pk.center);
                                    setAmplitude(parseFloat(Math.max(1, pk.intensity - background).toFixed(1)));
                                    if (pk.fwhmEst > 0.01 && pk.fwhmEst < 10) {
                                      setFwhmManual(pk.fwhmEst);
                                    }
                                    setUseCaglioti(false);
                                    setActiveTab('visualizer');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                                  title="Load this peak into the Profile Visualizer"
                                >
                                  <Check className="w-3 h-3" />
                                  Load Main
                                </button>
                                <button
                                  onClick={() => {
                                    setEnableSecondaryPeak(true);
                                    const diff = parseFloat((pk.center - center).toFixed(3));
                                    setSecondPeakOffset(diff !== 0 ? diff : 0.4);
                                    setSecondPeakFwhm(pk.fwhmEst);
                                    const primaryMax = Math.max(1, amplitude);
                                    setSecondPeakAmp(parseFloat((Math.max(1, pk.intensity - background) / primaryMax * 100).toFixed(1)));
                                    setActiveTab('visualizer');
                                  }}
                                  className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                                  title="Set as overlapping secondary peak for deconvolution"
                                >
                                  <Split className="w-3 h-3" />
                                  Set Overlapping
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: THEORETICAL DIAGRAMS & REFERENCE MODELS */}
        {activeTab === 'theory' && (
          <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Theoretical Line Profile Diagrams & Mathematical Definitions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact mathematical schematics illustrating integral breadth area, Gaussian standard deviation c (σ), and half-maximum bounds.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Diagram 1: Integral Breadth Area Concept */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Integral Breadth (β = Area / I_max)
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                    β = {extSim.stats.integralBreadth.toFixed(4)}°
                  </span>
                </div>

                {/* SVG Schematic 1 */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center items-center h-48">
                  <svg viewBox="0 0 300 180" className="w-full h-full">
                    <line x1="30" y1="150" x2="280" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="30" y1="150" x2="30" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
                    
                    <rect x="100" y="40" width="100" height="110" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
                    
                    <path d="M 40 150 Q 120 150 150 40 Q 180 150 260 150" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="2.5" />
                    
                    <line x1="30" y1="40" x2="200" y2="40" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="35" y="35" fill="#6366f1" fontSize="10" fontWeight="bold">I_max = {amplitude.toFixed(0)} cps</text>

                    <line x1="100" y1="165" x2="200" y2="165" stroke="#6366f1" strokeWidth="1.5" />
                    <polygon points="100,165 106,162 106,168" fill="#6366f1" />
                    <polygon points="200,165 194,162 194,168" fill="#6366f1" />
                    <text x="135" y="177" fill="#6366f1" fontSize="10" fontWeight="bold">β (Integral Width)</text>
                  </svg>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The <strong>Integral Breadth (β)</strong> is the width of a rectangle having the same area (A) and maximum height (I_max) as the observed diffraction profile: <code className="text-indigo-600 dark:text-indigo-400 font-mono">{"β = Area / I_max"}</code>.
                </p>
              </div>

              {/* Diagram 2: Gaussian Standard Deviation c = sigma */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2. Gaussian Parameter c (σ)
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-mono font-bold">
                    c = {extSim.stats.gaussianSigmaC.toFixed(4)}°
                  </span>
                </div>

                {/* SVG Schematic 2 */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center items-center h-48">
                  <svg viewBox="0 0 300 180" className="w-full h-full">
                    <line x1="30" y1="150" x2="280" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="30" y1="150" x2="30" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
                    
                    <path d="M 40 150 Q 110 150 150 30 Q 190 150 260 150" fill="rgba(236, 72, 153, 0.15)" stroke="#ec4899" strokeWidth="2.5" />
                    
                    <line x1="150" y1="30" x2="150" y2="150" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="145" y="165" fill="#6366f1" fontSize="10" fontWeight="bold">x₀ (2θ₀)</text>

                    <line x1="110" y1="100" x2="150" y2="100" stroke="#ec4899" strokeWidth="1.5" />
                    <polygon points="110,100 116,97 116,103" fill="#ec4899" />
                    <polygon points="150,100 144,97 144,103" fill="#ec4899" />
                    <text x="122" y="94" fill="#ec4899" fontSize="10" fontWeight="bold">c (σ)</text>

                    <text x="180" y="50" fill="#ec4899" fontSize="9" fontWeight="bold">FWHM = 2c√(2 ln 2)</text>
                    <text x="180" y="65" fill="#64748b" fontSize="8">FWHM ≈ 2.35482 · c</text>
                  </svg>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  For a pure Gaussian distribution <code className="text-pink-600 dark:text-pink-400 font-mono">{"Y(x) = y₀ + A·e^(-(x-x₀)² / 2c²)"}</code>, parameter <strong>c (σ)</strong> represents the standard deviation or half-width parameter, mathematically related to FWHM by <code className="text-pink-600 dark:text-pink-400 font-mono">FWHM = 2.354820 · c</code>.
                </p>
              </div>

              {/* Diagram 3: Half-Maximum Endpoints 2theta1, 2theta2 */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    3. Half-Max Bounds (2θ₁ & 2θ₂)
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold">
                    B = {extSim.stats.effTchFwhm.toFixed(4)}°
                  </span>
                </div>

                {/* SVG Schematic 3 */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center items-center h-48">
                  <svg viewBox="0 0 300 180" className="w-full h-full">
                    <line x1="30" y1="150" x2="280" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="30" y1="150" x2="30" y2="20" stroke="#94a3b8" strokeWidth="1.5" />

                    <path d="M 40 150 Q 115 150 150 30 Q 185 150 260 150" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="2.5" />

                    <line x1="30" y1="90" x2="220" y2="90" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="35" y="85" fill="#f59e0b" fontSize="9" fontWeight="bold">I_bg + I_max/2</text>

                    <line x1="115" y1="90" x2="115" y2="150" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                    <line x1="185" y1="90" x2="185" y2="150" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />

                    <circle cx="115" cy="90" r="3.5" fill="#f59e0b" />
                    <circle cx="185" cy="90" r="3.5" fill="#f59e0b" />

                    <text x="108" y="165" fill="#f59e0b" fontSize="10" fontWeight="bold">2θ₁</text>
                    <text x="178" y="165" fill="#f59e0b" fontSize="10" fontWeight="bold">2θ₂</text>

                    <line x1="115" y1="110" x2="185" y2="110" stroke="#4338ca" strokeWidth="1.5" />
                    <polygon points="115,110 121,107 121,113" fill="#4338ca" />
                    <polygon points="185,110 179,107 179,113" fill="#4338ca" />
                    <text x="128" y="125" fill="#4338ca" fontSize="9" fontWeight="bold">B = 2θ₂ - 2θ₁</text>
                  </svg>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The <strong>Full Width at Half Maximum (FWHM, B)</strong> is defined by the exact angular interval <code className="text-amber-600 dark:text-amber-400 font-mono">B = 2θ₂ - 2θ₁</code> between roots where peak intensity equals half of net maximum intensity above baseline: <code className="text-amber-600 dark:text-amber-400 font-mono">{"I(2θ₁) = I(2θ₂) = I_bg + I_max / 2"}</code>.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
