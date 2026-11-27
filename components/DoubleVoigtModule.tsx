import React, { useState, useEffect, useMemo } from 'react';
import { useCustomMaterialApply } from './CustomMaterialContext';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseDoubleVoigtInput, calculateDoubleVoigt, DoubleVoigtPeakInput } from '../utils/physics';
import { DoubleVoigtResult } from '../types';
import { COLOR_VISION_MODES, getThemeSpec, isDarkTheme } from '../utils/themeSystem';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  Area
} from 'recharts';
import {
  Activity,
  Atom,
  Copy,
  Database,
  FlaskConical,
  Layers,
  Ruler,
  Trash2,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Download,
  Sliders,
  BookOpen,
  RotateCcw,
  Plus,
  Filter,
  Table,
  FileText,
  LayoutGrid,
  ArrowUpDown,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';
import { DoubleVoigtCadSchematic } from './double_voigt/DoubleVoigtCadSchematic';
import { DVReflectionsGraphic, DVGraphicMode } from './double_voigt/DVReflectionsGraphic';

const XRAY_WAVELENGTHS = [
  { label: 'Cu Kα1', value: 1.54056 },
  { label: 'Cu Kα (avg)', value: 1.5418 },
  { label: 'Mo Kα1', value: 0.7093 },
  { label: 'Co Kα1', value: 1.78897 },
  { label: 'Fe Kα1', value: 1.93604 },
  { label: 'Cr Kα1', value: 2.2897 },
  { label: 'Ag Kα1', value: 0.55941 }
];

const DV_PRESETS = [
  {
    name: 'CeO2 Fluorite SRM',
    tag: 'Mixed Size + Strain',
    wavelength: 1.54056,
    instFwhm: 0.05,
    data: "28.55, 0.320, 1, 1, 1, 0.65\n33.08, 0.350, 2, 0, 0, 0.60\n47.48, 0.420, 2, 2, 0, 0.55\n56.34, 0.480, 3, 1, 1, 0.50\n59.09, 0.510, 2, 2, 2, 0.48\n69.41, 0.580, 4, 0, 0, 0.45",
    desc: 'Cubic fluorite CeO2 reference powder exhibiting balanced Cauchy size and Gaussian microstrain broadening.'
  },
  {
    name: 'Ball-Milled Ni',
    tag: 'High Dislocation ρ',
    wavelength: 1.54056,
    instFwhm: 0.08,
    data: "44.51, 0.450, 1, 1, 1, 0.70\n51.85, 0.520, 2, 0, 0, 0.62\n76.37, 0.710, 2, 2, 0, 0.52\n92.94, 0.880, 3, 1, 1, 0.45\n98.44, 0.950, 2, 2, 2, 0.42",
    desc: 'Severely deformed FCC nickel powder with high Gaussian microstrain and elevated dislocation density.'
  },
  {
    name: 'Sol-Gel TiO2 Anatase',
    tag: 'Tetragonal Oxide',
    wavelength: 1.54056,
    instFwhm: 0.06,
    data: "25.28, 0.380, 1, 0, 1, 0.58\n37.80, 0.420, 0, 0, 4, 0.55\n48.05, 0.490, 2, 0, 0, 0.51\n53.89, 0.540, 1, 0, 5, 0.48\n55.08, 0.560, 2, 1, 1, 0.47\n62.69, 0.620, 2, 0, 4, 0.44",
    desc: 'Tetragonal nanocrystals synthesized by sol-gel calcination.'
  },
  {
    name: 'ZnO Nanorods',
    tag: 'Cauchy Size Dom.',
    wavelength: 1.54056,
    instFwhm: 0.07,
    data: "31.77, 0.300, 1, 0, 0, 0.62\n34.42, 0.280, 0, 0, 2, 0.68\n36.25, 0.330, 1, 0, 1, 0.60\n47.54, 0.400, 1, 0, 2, 0.54\n56.60, 0.450, 1, 1, 0, 0.51\n62.86, 0.500, 1, 0, 3, 0.48",
    desc: 'Hexagonal wurtzite nanoparticles showing Cauchy-dominated domain broadening.'
  },
  {
    name: 'Cold-Rolled α-Brass',
    tag: 'Fault + Strain',
    wavelength: 1.54056,
    instFwhm: 0.07,
    data: "42.32, 0.510, 1, 1, 1, 0.56\n49.28, 0.640, 2, 0, 0, 0.48\n72.25, 0.890, 2, 2, 0, 0.41\n87.46, 1.150, 3, 1, 1, 0.36\n92.42, 1.260, 2, 2, 2, 0.34",
    desc: 'Cold-rolled Cu-Zn alloy with pronounced Gaussian and Cauchy strain slopes.'
  },
  {
    name: 'Pt/C Fuel Catalyst',
    tag: 'Ultrafine ~6 nm',
    wavelength: 1.54056,
    instFwhm: 0.08,
    data: "39.76, 1.420, 1, 1, 1, 0.78\n46.24, 1.480, 2, 0, 0, 0.75\n67.45, 1.690, 2, 2, 0, 0.71\n81.29, 1.920, 3, 1, 1, 0.68\n85.71, 2.020, 2, 2, 2, 0.66",
    desc: 'Ultrafine carbon-supported platinum electrocatalyst nanoparticles with high Lorentzian tail fraction.'
  }
];

const serializeDvPeaksToText = (peaks: DoubleVoigtPeakInput[]): string => {
  return peaks
    .map(p => {
      const etaVal = (p.eta !== undefined ? p.eta : 0.5).toFixed(2);
      if (p.hkl && p.hkl.length === 3) {
        return `${p.twoTheta.toFixed(2)}, ${p.fwhmObs.toFixed(3)}, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}, ${etaVal}`;
      }
      return `${p.twoTheta.toFixed(2)}, ${p.fwhmObs.toFixed(3)}, ${etaVal}`;
    })
    .join('\n');
};

export const DoubleVoigtModule: React.FC = () => {
  const { lengthUnit = 'Å', theme, colorVisionMode } = useSettings();
  const dark = isDarkTheme(theme);
  const themeSpec = getThemeSpec(theme);
  const cvdEntry = useMemo(
    () => COLOR_VISION_MODES.find(m => m.id === colorVisionMode) || COLOR_VISION_MODES[0],
    [colorVisionMode]
  );

  // Calibrated theme & CVD-safe palette for all Recharts visualizations
  const chartPalette = useMemo(() => {
    const isCvd = colorVisionMode !== 'normal';
    const [cvdPrimary, cvdHighlight, cvdSecondary] = cvdEntry.swatches;
    const t = themeSpec.tokens;
    return {
      grid: dark ? 'rgba(148,163,184,0.16)' : 'rgba(100,116,139,0.2)',
      axis: dark ? '#64748b' : '#475569',
      tick: dark ? '#94a3b8' : '#334155',
      tooltipBg: t.surface,
      tooltipBorder: t.border,
      tooltipText: t.textPrimary,
      tooltipMuted: t.textMuted,
      cauchy: isCvd ? cvdPrimary : dark ? '#6366f1' : '#4f46e5',
      cauchyDark: isCvd ? cvdPrimary : '#3730a3',
      gauss: isCvd ? cvdSecondary : dark ? '#a855f7' : '#7c3aed',
      gaussDark: isCvd ? cvdSecondary : '#6b21a8',
      emerald: isCvd ? cvdSecondary : dark ? '#10b981' : '#059669',
      cyan: isCvd ? cvdPrimary : dark ? '#38bdf8' : '#0284c7',
      amber: isCvd ? cvdHighlight : dark ? '#f59e0b' : '#d97706',
      slate: dark ? '#94a3b8' : '#64748b',
    };
  }, [dark, colorVisionMode, cvdEntry, themeSpec]);

  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [instFwhm, setInstFwhm] = useState<number>(0.05);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [instEta, setInstEta] = useState<number>(0.5);
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0);
  const [applyLPFactor, setApplyLPFactor] = useState<boolean>(false);
  const [monochromatorAngle, setMonochromatorAngle] = useState<number>(26.4);
  const [kAlpha2Correction, setKAlpha2Correction] = useState<boolean>(false);
  const [shapeK, setShapeK] = useState<number>(1.0);
  const [burgersVectorNm, setBurgersVectorNm] = useState<number>(0.25);

  const [deconvKernel, setDeconvKernel] = useState<'deKeijser-1982' | 'Langford-1978' | 'Balzar-1993'>('deKeijser-1982');
  const [regressionWeighting, setRegressionWeighting] = useState<'OLS' | 'WLS-LowS' | 'Huber-Robust'>('OLS');
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);

  const [expSubTab, setExpSubTab] = useState<'wavelength' | 'instrument' | 'corrections'>('wavelength');
  const [inputEditorMode, setInputEditorMode] = useState<'cards' | 'matrix' | 'csv'>('cards');
  const [graphicMode, setGraphicMode] = useState<DVGraphicMode>('spectrum');

  const [inputData, setInputData] = useState<string>(DV_PRESETS[0].data);
  const [activePresetName, setActivePresetName] = useState<string>(DV_PRESETS[0].name);
  const [activePlotTab, setActivePlotTab] = useState<'cauchy' | 'gaussian' | 'summary' | 'profile' | 'kernelMatrix' | 'concept'>('cauchy');
  const [summarySubView, setSummarySubView] = useState<'distribution' | 'fourier' | 'strainCurve' | 'bars'>('distribution');
  const [distModelMode, setDistModelMode] = useState<'lognormal' | 'analytical'>('lognormal');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);
  const [interactiveEta, setInteractiveEta] = useState<number>(0.60);
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Draft row for adding a reflection
  const [newTwoTheta, setNewTwoTheta] = useState<string>('47.48');
  const [newFwhm, setNewFwhm] = useState<string>('0.420');
  const [newEta, setNewEta] = useState<string>('0.55');
  const [newHkl, setNewHkl] = useState<string>('220');

  const [result, setResult] = useState<DoubleVoigtResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_double_voigt_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const showTransientStatus = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 3200);
  };

  useCustomMaterialApply('double_voigt', (mat) => {
    setWavelength(mat.wavelength || 1.54056);
    setActivePresetName(`${mat.name} (${mat.formula})`);
    setExcludedIndices([]);
    if (mat.peaks.length > 0) {
      const formatted = mat.peaks
        .map((p, idx) => {
          const baseEta = mat.etaMix ?? 0.55;
          const eta = Math.max(0.2, Math.min(0.9, baseEta - idx * 0.03));
          return `${p.twoTheta.toFixed(2)}, ${Math.max(0.09, p.fwhm || 0.3).toFixed(3)}, ${p.h}, ${p.k}, ${p.l}, ${eta.toFixed(2)}`;
        })
        .join('\n');
      setInputData(formatted);
      showTransientStatus(`Applied custom material: ${mat.name} (${mat.peaks.length} peaks)`);
    }
  });

  const parsedPeaks = useMemo(() => {
    return parseDoubleVoigtInput(inputData);
  }, [inputData]);

  useEffect(() => {
    if (parsedPeaks.length >= 2) {
      const computed = calculateDoubleVoigt(
        wavelength,
        instFwhm,
        parsedPeaks,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        {
          zeroShiftDeg,
          instEta,
          applyLPFactor,
          monochromatorAngleDeg: monochromatorAngle,
          kAlpha2Correction,
          shapeK,
          deconvKernel,
          regressionWeighting,
          burgersVectorNm,
          excludedIndices
        }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_double_voigt_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
  }, [
    wavelength,
    instFwhm,
    parsedPeaks,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    instEta,
    zeroShiftDeg,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    shapeK,
    deconvKernel,
    regressionWeighting,
    burgersVectorNm,
    excludedIndices
  ]);

  const handleApplyPreset = (preset: typeof DV_PRESETS[0]) => {
    setActivePresetName(preset.name);
    setWavelength(preset.wavelength);
    setInstFwhm(preset.instFwhm);
    setExcludedIndices([]);
    setInputData(preset.data);
    setSelectedPeakIdx(0);
    showTransientStatus(`Loaded standard preset: ${preset.name}`);
  };

  const handleTogglePeakExclusion = (idx: number) => {
    setExcludedIndices(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      }
      const activeCount = parsedPeaks.length - prev.length;
      if (activeCount <= 2) {
        showTransientStatus('Minimum 2 active reflections required for Double-Voigt regression.');
        return prev;
      }
      return [...prev, idx];
    });
  };

  const handleAutoPruneOutliers = () => {
    if (!result || !result.points) return;
    const outlierIndices = result.points
      .filter(p => !p.excluded && p.isOutlier && p.index !== undefined)
      .map(p => p.index as number);

    if (outlierIndices.length === 0) {
      showTransientStatus('No statistical outliers (|z| > 2.0) detected in Cauchy or Gaussian regressions.');
      return;
    }

    const remaining = parsedPeaks.length - (excludedIndices.length + outlierIndices.length);
    if (remaining < 2) {
      showTransientStatus('Cannot prune outliers: at least 2 reflections must remain active.');
      return;
    }

    setExcludedIndices(prev => Array.from(new Set([...prev, ...outlierIndices])));
    showTransientStatus(`Excluded ${outlierIndices.length} statistical outlier reflection(s).`);
  };

  const handleUpdatePeakRow = (idx: number, field: 'twoTheta' | 'fwhmObs' | 'eta' | 'hkl', rawVal: string) => {
    const updated = [...parsedPeaks];
    if (!updated[idx]) return;
    if (field === 'twoTheta') {
      const val = parseFloat(rawVal);
      if (!isNaN(val) && val > 0 && val < 180) updated[idx] = { ...updated[idx], twoTheta: val };
    } else if (field === 'fwhmObs') {
      const val = parseFloat(rawVal);
      if (!isNaN(val) && val > 0) updated[idx] = { ...updated[idx], fwhmObs: val };
    } else if (field === 'eta') {
      const val = parseFloat(rawVal);
      if (!isNaN(val)) updated[idx] = { ...updated[idx], eta: Math.min(0.99, Math.max(0.01, val)) };
    } else if (field === 'hkl') {
      const clean = rawVal.replace(/[^0-9-]/g, '');
      if (clean.length === 3) {
        updated[idx] = {
          ...updated[idx],
          hkl: [parseInt(clean[0], 10) || 0, parseInt(clean[1], 10) || 0, parseInt(clean[2], 10) || 0]
        };
      } else {
        const parts = rawVal.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        if (parts.length === 3) {
          updated[idx] = { ...updated[idx], hkl: [parts[0], parts[1], parts[2]] };
        }
      }
    }
    setInputData(serializeDvPeaksToText(updated));
  };

  const handleDeletePeakRow = (idx: number) => {
    const updated = parsedPeaks.filter((_, i) => i !== idx);
    setExcludedIndices(prev => prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i)));
    setInputData(serializeDvPeaksToText(updated));
  };

  const handleAddPeakRow = () => {
    const tt = parseFloat(newTwoTheta);
    const fw = parseFloat(newFwhm);
    const et = Math.min(0.99, Math.max(0.01, parseFloat(newEta) || 0.5));
    if (isNaN(tt) || tt <= 0 || tt >= 180 || isNaN(fw) || fw <= 0) {
      showTransientStatus('Enter valid 2θ (1–179°) and FWHM (> 0°) values.');
      return;
    }
    let hklArr: [number, number, number] | undefined = undefined;
    const cleanHkl = newHkl.trim().replace(/[()[\]]/g, '');
    if (/^\d{3}$/.test(cleanHkl)) {
      hklArr = [parseInt(cleanHkl[0], 10), parseInt(cleanHkl[1], 10), parseInt(cleanHkl[2], 10)];
    } else {
      const parts = cleanHkl.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      if (parts.length === 3) hklArr = [parts[0], parts[1], parts[2]];
    }
    const updated = [...parsedPeaks, { twoTheta: tt, fwhmObs: fw, eta: et, hkl: hklArr }];
    setInputData(serializeDvPeaksToText(updated));
    showTransientStatus(`Added reflection at 2θ = ${tt.toFixed(2)}° (η = ${et.toFixed(2)})`);
  };

  const handleSortPeaksByAngle = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    setExcludedIndices([]);
    setInputData(serializeDvPeaksToText(sorted));
    showTransientStatus('Sorted reflections in ascending 2θ order.');
  };

  const handleSyncFromWorkspace = () => {
    try {
      const fwhmSaved = localStorage.getItem('xrd_fwhm_current');
      if (fwhmSaved) {
        const parsed = JSON.parse(fwhmSaved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const imported: DoubleVoigtPeakInput[] = parsed
            .filter((item: any) => item.twoTheta > 0 && item.fwhm > 0)
            .map((item: any) => ({
              twoTheta: Number(item.twoTheta),
              fwhmObs: Number(item.fwhm),
              eta: item.eta !== undefined ? Number(item.eta) : 0.55,
              hkl: item.hkl
            }));
          if (imported.length >= 2) {
            setExcludedIndices([]);
            setInputData(serializeDvPeaksToText(imported));
            setActivePresetName('Workspace Import');
            showTransientStatus(`Imported ${imported.length} reflections from FWHM Workspace.`);
            return;
          }
        }
      }
      showTransientStatus('No external multi-peak Voigt profile found in local workspace.');
    } catch {
      showTransientStatus('Could not read workspace storage.');
    }
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Cauchy Regression: } \\beta_C^*(s) &= \\frac{1}{2\\langle D \\rangle_A} + 2 e_C s \\quad (m_C = ${result.cauchyFit.slope.toFixed(4)},\\, \\beta_{S,C}^* = ${result.cauchyFit.intercept.toFixed(4)}\\text{ nm}^{-1},\\, R^2 = ${(result.cauchyFit.rSquared * 100).toFixed(2)}\\%) \\\\
\\text{Gaussian Regression: } (\\beta_G^*(s))^2 &= \\left(\\frac{1}{D_G}\\right)^2 + 2\\pi \\langle\\varepsilon_G^2\\rangle s^2 \\quad (m_G = ${result.gaussianFit.slope.toFixed(5)},\\, (\\beta_{S,G}^*)^2 = ${result.gaussianFit.intercept.toFixed(5)}\\text{ nm}^{-2},\\, R^2 = ${(result.gaussianFit.rSquared * 100).toFixed(2)}\\%) \\\\
\\langle D \\rangle_V &= \\frac{\\exp(k_S^2)\\,\\mathrm{erfc}(k_S)}{\\beta_{S,G}^*} = ${result.volumeSizeDvNm.toFixed(2)} \\pm ${(result.volumeSizeUncertaintyNm || 0).toFixed(2)} \\text{ nm}, \\quad \\langle D \\rangle_A = ${result.areaSizeDaNm.toFixed(2)} \\pm ${(result.areaSizeUncertaintyNm || 0).toFixed(2)} \\text{ nm}, \\quad k_S = ${(result.voigtParameterK || 0).toFixed(3)} \\\\
e_C &= ${(result.cauchyStrainEc * 100).toFixed(4)}\\%, \\quad e_G = ${(result.gaussianStrainEg * 100).toFixed(4)}\\%, \\quad \\langle \\varepsilon^2(D_A/2) \\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\%
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    showTransientStatus('Copied publication-ready Balzar–Ledbetter Double-Voigt LaTeX equations.');
  };

  const handleDownloadCSV = () => {
    if (!result || !result.points) return;
    let csv = "Index,Status,2Theta (deg),hkl,d_hkl (A),FWHM_obs (deg),FWHM_inst (deg),eta_obs,Shape_Phi,s (nm^-1),s^2 (nm^-2),beta* (nm^-1),beta_C* (nm^-1),(beta_G*)^2 (nm^-2),beta_G* (nm^-1),Single_D_V (nm),Cauchy_z,Gaussian_z\n";
    result.points.forEach((p, idx) => {
      const hklStr = p.hkl ? `"(${p.hkl.join('')})"` : '""';
      const state = p.excluded ? 'Excluded' : p.isOutlier ? 'Outlier' : 'Nominal';
      csv += `${idx + 1},${state},${p.twoTheta.toFixed(4)},${hklStr},${(p.dSpacingAngstrom || 0).toFixed(4)},${(p.fwhmObs || 0).toFixed(4)},${(p.fwhmInst || 0).toFixed(4)},${(p.etaObs || 0.5).toFixed(3)},${(p.shapeFactorPhi || 0).toFixed(4)},${p.s.toFixed(6)},${p.s2.toFixed(6)},${p.betaStar.toFixed(6)},${p.betaCStar.toFixed(6)},${p.betaGStarSq.toFixed(6)},${p.betaGStar.toFixed(6)},${p.singleDvNm.toFixed(4)},${(p.cauchyStdResidual || 0).toFixed(4)},${(p.gaussianStdResidual || 0).toFixed(4)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Double_Voigt_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showTransientStatus('Exported full Double-Voigt CSV report.');
  };

  // Exact Analytical Double-Voigt A_S(L), p_A(L), p_V(L) & Krill-Birringer Log-Normal P_A(L), P_V(L)
  const columnLengthData = useMemo(() => {
    if (!result || !result.volumeSizeDvNm || !result.areaSizeDaNm) return null;
    const Dv = result.volumeSizeDvNm;
    const Da = result.areaSizeDaNm;
    const Dn = result.numberSizeDnNm || Da * 0.72;
    const betaCS = result.betaCSStar ?? 1 / (2 * Math.max(0.5, Da));
    const betaGS = result.betaGSStar ?? 1 / Math.max(1, result.gaussianSizeDgNm || Dv);
    const ratio = Math.max(1.005, Dv / Math.max(0.1, Da));

    const sigmaSq = Math.max(0.01, Math.min(1.6, Math.log(ratio)));
    const sigma = Math.sqrt(sigmaSq);
    const muArea = Math.log(Da) - 0.5 * sigmaSq;
    const muVol = Math.log(Dv) - 0.5 * sigmaSq;
    const modeL = Math.exp(muArea - sigmaSq);
    const medianL = result.logNormalMedianNm || Math.exp(muArea);

    const maxL = Math.max(Math.max(Dv, Da) * 2.5, 40);
    const numPoints = 72;
    const points = [];

    for (let i = 1; i <= numPoints; i++) {
      const L = (i / numPoints) * maxL;
      if (L <= 0) continue;
      const diffA = Math.log(L) - muArea;
      const diffV = Math.log(L) - muVol;
      const pAreaLn = (1 / (L * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-(diffA * diffA) / (2 * sigmaSq));
      const pVolLn = (1 / (L * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-(diffV * diffV) / (2 * sigmaSq));

      // Exact Balzar-Ledbetter (1993) A_S(L) & exact Bertaut second derivative p_A(L) = <D>_A * d^2 A_S / dL^2
      const aSize = Math.exp(-2 * L * betaCS - Math.PI * L * L * betaGS * betaGS);
      const u = 2 * betaCS + 2 * Math.PI * betaGS * betaGS * L;
      const pAreaAnalytical = Da * (u * u - 2 * Math.PI * betaGS * betaGS) * aSize;
      const pVolAnalytical = (L / Math.max(0.5, Da)) * pAreaAnalytical;
      const aTangent = Math.max(0, 1 - L / Math.max(0.5, Da));

      points.push({
        L: parseFloat(L.toFixed(2)),
        areaDensity: parseFloat((pAreaLn * 100).toFixed(3)),
        volumeDensity: parseFloat((pVolLn * 100).toFixed(3)),
        analyticalArea: parseFloat((pAreaAnalytical * 100).toFixed(3)),
        analyticalVol: parseFloat((pVolAnalytical * 100).toFixed(3)),
        aSize: parseFloat(aSize.toFixed(4)),
        aTangent: parseFloat(aTangent.toFixed(4))
      });
    }

    return { points, modeL, medianL, sigma, Dv, Da, Dn, ratio };
  }, [result]);

  // Simultaneous 3-Kernel x Weighting Benchmark Matrix
  const kernelComparisonMatrix = useMemo(() => {
    if (parsedPeaks.length < 2) return [];
    const combos: {
      kernel: 'deKeijser-1982' | 'Langford-1978' | 'Balzar-1993';
      weighting: 'OLS' | 'WLS-LowS' | 'Huber-Robust';
      label: string;
    }[] = [
      { kernel: 'deKeijser-1982', weighting: 'OLS', label: 'de Keijser (1982) · Standard OLS' },
      { kernel: 'deKeijser-1982', weighting: 'WLS-LowS', label: 'de Keijser (1982) · 1/s Low-Angle WLS' },
      { kernel: 'deKeijser-1982', weighting: 'Huber-Robust', label: 'de Keijser (1982) · Huber Robust IRLS' },
      { kernel: 'Langford-1978', weighting: 'OLS', label: 'Langford (1978) Exact Voigt · OLS' },
      { kernel: 'Balzar-1993', weighting: 'OLS', label: 'Balzar–Ledbetter (1993) TCH · OLS' },
      { kernel: 'Balzar-1993', weighting: 'Huber-Robust', label: 'Balzar–Ledbetter (1993) TCH · Huber IRLS' }
    ];

    return combos
      .map(c => {
        const res = calculateDoubleVoigt(
          wavelength,
          instFwhm,
          parsedPeaks,
          instrumentalMode,
          { U: cagliotiU, V: cagliotiV, W: cagliotiW },
          {
            zeroShiftDeg,
            instEta,
            applyLPFactor,
            monochromatorAngleDeg: monochromatorAngle,
            kAlpha2Correction,
            shapeK,
            deconvKernel: c.kernel,
            regressionWeighting: c.weighting,
            burgersVectorNm,
            excludedIndices
          }
        );
        return res
          ? {
              ...c,
              dvNm: res.volumeSizeDvNm,
              daNm: res.areaSizeDaNm,
              dgNm: res.gaussianSizeDgNm,
              ecPct: res.cauchyStrainEc * 100,
              egPct: res.gaussianStrainEg * 100,
              rmsPct: res.rmsStrain * 100,
              cauchyR2: res.cauchyFit.rSquared,
              gaussR2: res.gaussianFit.rSquared,
              meanR2: 0.5 * (res.cauchyFit.rSquared + res.gaussianFit.rSquared),
              kParam: res.voigtParameterK || 0
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [
    parsedPeaks,
    wavelength,
    instFwhm,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    zeroShiftDeg,
    instEta,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    shapeK,
    burgersVectorNm,
    excludedIndices
  ]);

  // Cauchy chart data with 95% CI band
  const cauchyChartData = useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const activePts = result.points.filter(p => !p.excluded);
    if (activePts.length < 2) return null;

    const xVals = result.points.map(p => p.s);
    const maxX = Math.max(...xVals);
    const startX = 0;
    const endX = maxX * 1.12;

    const n = activePts.length;
    const meanX = activePts.reduce((s, p) => s + p.s, 0) / n;
    const ssX = activePts.reduce((s, p) => s + Math.pow(p.s - meanX, 2), 0);
    const rmse = result.cauchyFit.rmse || 0.002;
    const tCrit = n <= 3 ? 4.303 : n === 4 ? 3.182 : n === 5 ? 2.776 : 2.3;

    const steps = 25;
    const band = [];
    for (let i = 0; i <= steps; i++) {
      const sVal = startX + (i / steps) * (endX - startX);
      const fitY = result.cauchyFit.slope * sVal + result.cauchyFit.intercept;
      const se = ssX > 0 ? rmse * Math.sqrt(1 / n + Math.pow(sVal - meanX, 2) / ssX) : rmse;
      const delta = tCrit * se;
      band.push({
        x: sVal,
        fitY,
        ciRange: [fitY - delta, fitY + delta]
      });
    }

    const activeScatter = activePts.map(p => ({
      index: p.index,
      x: p.s,
      y: p.betaCStar,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      singleDvNm: p.singleDvNm,
      stdRes: p.cauchyStdResidual
    }));

    const excludedScatter = result.points
      .filter(p => p.excluded)
      .map(p => ({
        index: p.index,
        x: p.s,
        y: p.betaCStar,
        twoTheta: p.twoTheta,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        singleDvNm: p.singleDvNm,
        stdRes: p.cauchyStdResidual
      }));

    return { activeScatter, excludedScatter, band, startX, endX };
  }, [result]);

  // Gaussian chart data with 95% CI band
  const gaussianChartData = useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const activePts = result.points.filter(p => !p.excluded);
    if (activePts.length < 2) return null;

    const xVals = result.points.map(p => p.s2);
    const maxX = Math.max(...xVals);
    const startX = 0;
    const endX = maxX * 1.12;

    const n = activePts.length;
    const meanX = activePts.reduce((s, p) => s + p.s2, 0) / n;
    const ssX = activePts.reduce((s, p) => s + Math.pow(p.s2 - meanX, 2), 0);
    const rmse = result.gaussianFit.rmse || 0.0005;
    const tCrit = n <= 3 ? 4.303 : n === 4 ? 3.182 : n === 5 ? 2.776 : 2.3;

    const steps = 25;
    const band = [];
    for (let i = 0; i <= steps; i++) {
      const s2Val = startX + (i / steps) * (endX - startX);
      const fitY = result.gaussianFit.slope * s2Val + result.gaussianFit.intercept;
      const se = ssX > 0 ? rmse * Math.sqrt(1 / n + Math.pow(s2Val - meanX, 2) / ssX) : rmse;
      const delta = tCrit * se;
      band.push({
        x: s2Val,
        fitY,
        ciRange: [fitY - delta, fitY + delta]
      });
    }

    const activeScatter = activePts.map(p => ({
      index: p.index,
      x: p.s2,
      y: p.betaGStarSq,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      betaGStar: p.betaGStar,
      stdRes: p.gaussianStdResidual
    }));

    const excludedScatter = result.points
      .filter(p => p.excluded)
      .map(p => ({
        index: p.index,
        x: p.s2,
        y: p.betaGStarSq,
        twoTheta: p.twoTheta,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        betaGStar: p.betaGStar,
        stdRes: p.gaussianStdResidual
      }));

    return { activeScatter, excludedScatter, band, startX, endX };
  }, [result]);

  // Concept simulation profile data
  const conceptProfileData = useMemo(() => {
    const numPoints = 100;
    const center = 38.0;
    const fwhm = 0.40;
    const halfWidth = fwhm * 3.5;
    const gamma = fwhm / 2;
    const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const x = (center - halfWidth) + (i / (numPoints - 1)) * (2 * halfWidth);
      const dx = x - center;
      const cauchy = (gamma * gamma) / (dx * dx + gamma * gamma);
      const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));
      const voigt = interactiveEta * cauchy + (1 - interactiveEta) * gaussian;

      points.push({
        twoTheta: parseFloat(x.toFixed(3)),
        voigt: parseFloat(voigt.toFixed(4)),
        cauchySize: parseFloat((interactiveEta * cauchy).toFixed(4)),
        gaussianStrain: parseFloat(((1 - interactiveEta) * gaussian).toFixed(4))
      });
    }

    return points;
  }, [interactiveEta]);

  // Single-peak Voigt deconvolution curve simulation
  const selectedPeakProfileData = useMemo(() => {
    if (!result || !result.points || result.points.length === 0) return null;
    const peakIdx = Math.min(selectedPeakIdx, result.points.length - 1);
    const peak = result.points[peakIdx];
    if (!peak) return null;

    const eta = peak.etaObs ?? 0.5;
    const fwhm = peak.fwhmObs ?? 0.4;
    const instW = peak.fwhmInst ?? instFwhm;
    const center = peak.twoTheta;

    const numPoints = 120;
    const halfWidth = fwhm * 3;
    const profilePoints = [];

    const gamma = fwhm / 2;
    const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));
    const gammaInst = Math.max(0.01, instW) / 2;
    const sigmaInst = Math.max(0.01, instW) / (2 * Math.sqrt(2 * Math.LN2));

    for (let i = 0; i < numPoints; i++) {
      const x = (center - halfWidth) + (i / (numPoints - 1)) * (2 * halfWidth);
      const dx = x - center;
      const cauchy = (gamma * gamma) / (dx * dx + gamma * gamma);
      const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));
      const voigt = eta * cauchy + (1 - eta) * gaussian;
      const instL = (gammaInst * gammaInst) / (dx * dx + gammaInst * gammaInst);
      const instG = Math.exp(-(dx * dx) / (2 * sigmaInst * sigmaInst));
      const instCurve = (instEta * instL + (1 - instEta) * instG) * 0.65;

      profilePoints.push({
        twoTheta: parseFloat(x.toFixed(3)),
        voigt: parseFloat(voigt.toFixed(4)),
        cauchy: parseFloat((eta * cauchy).toFixed(4)),
        gaussian: parseFloat(((1 - eta) * gaussian).toFixed(4)),
        instrumental: parseFloat(instCurve.toFixed(4))
      });
    }

    return { peak, eta, fwhm, data: profilePoints };
  }, [result, selectedPeakIdx, instFwhm, instEta]);

  // Size Comparison Data for Bar Chart
  const sizeComparisonData = useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Number ⟨D_N⟩', size: result.numberSizeDnNm || result.areaSizeDaNm * 0.72, color: chartPalette.slate },
      { name: 'Median D_0', size: result.logNormalMedianNm || result.areaSizeDaNm * 0.65, color: chartPalette.cyan },
      { name: 'Area ⟨D_A⟩', size: result.areaSizeDaNm, color: chartPalette.emerald },
      { name: 'Volume ⟨D_V⟩', size: result.volumeSizeDvNm, color: chartPalette.cauchy },
      { name: 'Gaussian D_G', size: result.gaussianSizeDgNm, color: chartPalette.gauss }
    ];
  }, [result, chartPalette]);

  const activeCount = result ? result.points.filter(p => !p.excluded).length : 0;
  const totalCount = result ? result.points.length : parsedPeaks.length;
  const outlierCount = result ? result.points.filter(p => !p.excluded && p.isOutlier).length : 0;

  const dvWalkthroughSteps: WizardStep[] = [
    {
      title: 'Prepare Observed Peaks & Instrumental Breadth',
      subtitle: 'Input (2θ, FWHM_obs, η_obs, hkl)',
      explanation: 'Every Bragg reflection is modeled as a Voigt profile characterized by its FWHM and Lorentzian mixing fraction η. The instrumental broadening kernel g(2θ) is subtracted linearly from the Cauchy component and quadratically from the Gaussian component.',
      tip: 'Higher η values indicate Lorentzian-dominated tails typical of crystallite size broadening.'
    },
    {
      title: 'Voigt Deconvolution (de Keijser / Langford / Balzar)',
      subtitle: 'Separating Cauchy (β_C*) & Gaussian (β_G*) Integral Breadths',
      explanation: 'Using exact Voigt integral breadth inversions, each reflection is split into reciprocal-space Cauchy breadth β_C* (nm⁻¹) and Gaussian breadth β_G* (nm⁻¹).',
      tip: 'Compare de Keijser (1982), Langford (1978) exact numerical Voigt inversion, and Balzar–Ledbetter (1993) TCH side by side in the Kernel Matrix tab.'
    },
    {
      title: 'Dual Reciprocal Extrapolations: β_C* vs s and (β_G*)² vs s²',
      subtitle: 'Intercepts = Crystallite Sizes; Slopes = Microstrains',
      explanation: '1. Cauchy plot: β_C*(s) = 1/(2⟨D_A⟩) + 2e_C·s yields Area-Weighted Size ⟨D_A⟩ directly from the intercept and Cauchy strain e_C from the slope.\n2. Gaussian plot: (β_G*(s))² = (1/D_G)² + 2π⟨ε_G²⟩·s² yields Gaussian size D_G and RMS strain.',
      tip: 'Combine β_S,C* and β_S,G* via Langford’s erfcx(k_S) = exp(k_S²)erfc(k_S) to obtain exact Volume-Weighted Size ⟨D_V⟩ = erfcx(k_S)/β_S,G*.'
    },
    {
      title: 'Column-Length Distribution P(L) & Strain Profile ⟨ε²(L)⟩¹/²',
      subtitle: 'Analytical d²A_S/dL², Log-Normal Moments & Distance-Dependent Strain',
      explanation: 'Synthesizes the analytical Fourier size curve A_S(L), exact surface/volume column-length distributions, and the Balzar–Ledbetter Warren–Averbach equivalent RMS microstrain curve ⟨ε²(L)⟩¹/².',
      tip: 'A Voigt size parameter k_S ≥ 0.707 guarantees a strictly non-negative analytical column-length distribution p_A(L) near L = 0.'
    }
  ];

  const tooltipStyle = {
    backgroundColor: chartPalette.tooltipBg,
    borderColor: chartPalette.tooltipBorder,
    color: chartPalette.tooltipText,
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 px-2 sm:px-4 text-slate-900 dark:text-slate-100">
      {/* Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Double-Voigt Method (Langford / Balzar–Ledbetter Formalism)"
        description="Master Voigt–Voigt profile deconvolution, reciprocal Cauchy and Gaussian regressions, exact Fourier size coefficients, and column-length distributions."
        steps={dvWalkthroughSteps}
        presetNames={DV_PRESETS.map(p => p.name)}
        onLoadBenchmarkPreset={(idx) => {
          const p = DV_PRESETS[idx];
          if (p) handleApplyPreset(p);
        }}
      />

      {/* Top Telemetry & Calibration Ribbon */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
            Double-Voigt Deconvolution Console
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            {result ? `k_S = ${(result.voigtParameterK || 0).toFixed(3)}` : 'Awaiting Input'}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">
            Reflections <strong className="text-slate-900 dark:text-white">{activeCount}/{totalCount}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-600 dark:text-slate-400">
            Kernel <strong className="text-indigo-600 dark:text-indigo-400">{deconvKernel}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncFromWorkspace}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-500/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Sync Workspace</span>
          </button>

          {outlierCount > 0 && (
            <button
              type="button"
              onClick={handleAutoPruneOutliers}
              className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Prune {outlierCount} Outlier{outlierCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {excludedIndices.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setExcludedIndices([]);
                showTransientStatus('Restored all excluded reflections.');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-500/40 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore ({excludedIndices.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={!result}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-500/50 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLaTeX}
            disabled={!result}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy LaTeX</span>
          </button>
        </div>
      </div>

      {/* Transient Feedback Banner */}
      <AnimatePresence>
        {statusBanner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-200 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Physical Meaning Summary Verdict */}
      {result && (
        <PhysicalMeaningSummary
          title="Double-Voigt Crystallite Size Moments & Strain Verdict"
          tone={result.rmsStrain > 0.003 || result.voigtConvexityValid === false ? 'warning' : 'success'}
          statement={`Sample exhibits volume-weighted size ⟨D_V⟩ = ${convertLength(result.volumeSizeDvNm * 10, lengthUnit).toFixed(1)} ${lengthUnit}, area-weighted size ⟨D_A⟩ = ${convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(1)} ${lengthUnit}, and number-weighted size ⟨D_N⟩ = ${convertLength((result.numberSizeDnNm || result.areaSizeDaNm * 0.72) * 10, lengthUnit).toFixed(1)} ${lengthUnit} with characteristic RMS microstrain ⟨ε²(D_A/2)⟩¹/² = ${(result.rmsStrain * 100).toFixed(3)}%.`}
          contextNote={`Polydispersity κ = ⟨D_V⟩/⟨D_A⟩ = ${(result.polydispersityRatio || 1.2).toFixed(2)} (Log-normal σ_LN = ${(result.logNormalSigma || 0.3).toFixed(3)}, k_S = ${(result.voigtParameterK || 0).toFixed(3)} ${result.voigtConvexityValid ? '≥ 0.707 convex' : '< 0.707 hook regime'}). Williamson–Smallman dislocation density ρ = ${((result.dislocationDensityM2 || 0) / 1e15).toFixed(2)} × 10¹⁵ m⁻².`}
          metrics={[
            { label: '⟨D_V⟩ Volume Size', value: convertLength(result.volumeSizeDvNm * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: '⟨D_A⟩ Area Size', value: convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: 'RMS Strain', value: (result.rmsStrain * 100).toFixed(3), unit: '%' },
            { label: 'Polydispersity κ', value: (result.polydispersityRatio || 1.2).toFixed(2), unit: '' }
          ]}
        />
      )}

      {/* Architectural Header & Dual Voigt Formulation — Full Light/Dark Parity */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
              <span>Reciprocal-Space Voigt Convolution</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span>Langford (1978, 1992) &amp; Balzar–Ledbetter (1993)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Double-Voigt Method Workstation
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Models both size-broadened and strain-broadened diffraction profiles as Voigt functions in reciprocal space <span className="font-mono text-indigo-700 dark:text-indigo-300">s = 2sinθ/λ</span>. Cauchy integral breadths add linearly while Gaussian breadths add quadratically—yielding exact area-weighted <span className="font-mono text-emerald-700 dark:text-emerald-300">⟨D_A⟩</span>, volume-weighted <span className="font-mono text-indigo-700 dark:text-indigo-300">⟨D_V⟩</span>, and distance-dependent RMS microstrain <span className="font-mono text-purple-700 dark:text-purple-300">⟨ε²(L)⟩¹/²</span>.
            </p>
          </div>

          <div className="lg:col-span-6 bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span>Balzar–Ledbetter Dual Reciprocal Separation</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">s = 2sinθ / λ [nm⁻¹]</span>
            </div>
            <div
              className="py-1.5 px-3 bg-white dark:bg-[#0B0F19] rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto text-center text-slate-900 dark:text-slate-100 text-xs"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\beta_C^*(s) = \\frac{1}{2\\langle D \\rangle_A} + 2 e_C s, \\qquad \\big(\\beta_G^*(s)\\big)^2 = \\left(\\frac{1}{D_G}\\right)^2 + 2\\pi\\langle\\varepsilon_G^2\\rangle s^2',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <div
              className="py-1.5 px-3 bg-white dark:bg-[#0B0F19] rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto text-center text-slate-900 dark:text-slate-100 text-xs"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\langle D \\rangle_V = \\frac{\\exp(k_S^2)\\,\\text{erfc}(k_S)}{\\beta_{S,G}^*}, \\qquad k_S = \\frac{\\beta_{S,C}^*}{\\sqrt{\\pi}\\,\\beta_{S,G}^*}',
                  { throwOnError: false, displayMode: false }
                )
              }}
            />
          </div>
        </div>

        {/* 6 Curated Reference Standards */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 font-semibold">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Reference Standards</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
            {DV_PRESETS.map((p) => {
              const isSelected = activePresetName === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-[#070A12] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-[11px] font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">{p.tag}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive 3-Mode Double-Voigt Metrology Schematic */}
      <DoubleVoigtCadSchematic
        result={result}
        activePresetName={activePresetName}
        wavelength={wavelength}
        instFwhm={instFwhm}
        instEta={instEta}
        instrumentalMode={instrumentalMode}
        cagliotiU={cagliotiU}
        cagliotiV={cagliotiV}
        cagliotiW={cagliotiW}
        shapeK={shapeK}
        deconvKernel={deconvKernel}
        regressionWeighting={regressionWeighting}
        selectedPeakIdx={selectedPeakIdx}
        onSelectPeakIdx={(idx) => setSelectedPeakIdx(idx)}
        onSelectKernel={(k) => setDeconvKernel(k)}
        onSelectWeighting={(w) => setRegressionWeighting(w)}
      />

      {/* Main Split Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calibration, Instrumental Kernel & Upgraded Reflections Data Manager */}
        <div className="lg:col-span-5 space-y-6">
          {/* Instrument & Voigt Physics Card */}
          <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Voigt Deconvolution &amp; Optics
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                λ = {convertLength(wavelength, lengthUnit).toFixed(4)} {lengthUnit} · K = {shapeK.toFixed(2)}
              </span>
            </div>

            {/* Sub-tab Segmented Control */}
            <div className="flex p-1 bg-slate-100 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setExpSubTab('wavelength')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  expSubTab === 'wavelength'
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Radiation &amp; Habit</span>
              </button>

              <button
                type="button"
                onClick={() => setExpSubTab('instrument')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  expSubTab === 'instrument'
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Inst. Kernel</span>
              </button>

              <button
                type="button"
                onClick={() => setExpSubTab('corrections')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  expSubTab === 'corrections'
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Solver &amp; Optics</span>
              </button>
            </div>

            {/* Subtab 1: Wavelength, Shape K, Burgers Vector, Zero Shift */}
            {expSubTab === 'wavelength' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    X-Ray Anode Wavelength (λ) [{lengthUnit}]
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-indigo-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {XRAY_WAVELENGTHS.map((w) => (
                        <option key={w.label} value={convertLength(w.value, lengthUnit)}>
                          {w.label} ({convertLength(w.value, lengthUnit).toFixed(4)} {lengthUnit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.00001"
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value) || 1.54056, lengthUnit))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Shape Habit Multiplier K & Burgers Vector b */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Habit K</span>
                      <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">{shapeK.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.20"
                      step="0.01"
                      value={shapeK}
                      onChange={(e) => setShapeK(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Burgers b</span>
                      <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">{burgersVectorNm.toFixed(2)} nm</span>
                    </div>
                    <input
                      type="range"
                      min="0.15"
                      max="0.45"
                      step="0.01"
                      value={burgersVectorNm}
                      onChange={(e) => setBurgersVectorNm(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Goniometer Zero-Shift Correction */}
                <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Goniometer Zero-Shift (Δ2θ₀)
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {zeroShiftDeg > 0 ? `+${zeroShiftDeg.toFixed(2)}` : zeroShiftDeg.toFixed(2)}° 2θ
                      </span>
                      {zeroShiftDeg !== 0 && (
                        <button
                          type="button"
                          onClick={() => setZeroShiftDeg(0)}
                          className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={zeroShiftDeg}
                    onChange={(e) => setZeroShiftDeg(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Subtab 2: Instrumental Broadening & Caglioti */}
            {expSubTab === 'instrument' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Instrumental Profile g(2θ)
                    </label>
                    <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setInstrumentalMode('constant')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          instrumentalMode === 'constant'
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Constant
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          instrumentalMode === 'caglioti'
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Caglioti (U,V,W)
                      </button>
                    </div>
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.005"
                          min="0"
                          value={instFwhm}
                          onChange={(e) => setInstFwhm(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums"
                        />
                        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">°2θ FWHM</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 0.05, 0.08, 0.12].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setInstFwhm(val)}
                            className={`py-1.5 rounded-lg border text-xs font-mono tabular-nums cursor-pointer ${
                              instFwhm === val
                                ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {val === 0 ? '0° (Raw)' : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-500">FWHM² = U·tan²θ + V·tanθ + W</span>
                        <div className="flex gap-1">
                          {[
                            { name: 'LaB6 SRM', u: 0.004, v: -0.0015, w: 0.006 },
                            { name: 'Lab XRD', u: 0.005, v: -0.002, w: 0.015 },
                            { name: 'Synchrotron', u: 0.0002, v: -0.0001, w: 0.001 }
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setCagliotiU(preset.u);
                                setCagliotiV(preset.v);
                                setCagliotiW(preset.w);
                              }}
                              className="px-2 py-0.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 hover:border-indigo-500 cursor-pointer whitespace-nowrap"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-500 font-mono mb-1">U (tan²θ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiU}
                            onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-mono mb-1">V (tanθ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiV}
                            onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-mono mb-1">W (const)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiW}
                            onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instrumental Voigt Fraction (instEta) */}
                <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Instrumental Lorentzian Fraction (η_inst)</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums font-bold">{instEta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.95"
                    step="0.05"
                    value={instEta}
                    onChange={(e) => setInstEta(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.05 (Gaussian Slits)</span>
                    <span>0.95 (Lorentzian Spectral)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab 3: Voigt Inversion Kernel, Regression Weighting & Optical Corrections */}
            {expSubTab === 'corrections' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Voigt Integral Breadth Inversion Kernel
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'deKeijser-1982' as const, label: 'de Keijser (1982)', desc: 'Polynomial φ ratios' },
                      { id: 'Langford-1978' as const, label: 'Langford (1978)', desc: 'Exact Voigt k-solve' },
                      { id: 'Balzar-1993' as const, label: 'Balzar (1993)', desc: 'TCH η → β_C, β_G' }
                    ].map(k => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setDeconvKernel(k.id)}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          deconvKernel === k.id
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] font-mono font-semibold truncate">{k.label}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{k.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Dual Regression Solver Weighting
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'OLS' as const, label: 'Standard OLS', desc: 'Uniform weight' },
                      { id: 'WLS-LowS' as const, label: '1/s Weighted', desc: 'Low-angle priority' },
                      { id: 'Huber-Robust' as const, label: 'Huber IRLS', desc: 'Outlier resistant' }
                    ].map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setRegressionWeighting(w.id)}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          regressionWeighting === w.id
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] font-mono font-semibold truncate">{w.label}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{w.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* L-P & K-Alpha2 toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyLPFactor(!applyLPFactor)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      applyLPFactor
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-semibold">L-P Polarization</div>
                    <div className="text-[10px] font-mono mt-0.5">{applyLPFactor ? `Enabled (${monochromatorAngle}°)` : 'Disabled'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      kAlpha2Correction
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-semibold">Rachinger Kα₂</div>
                    <div className="text-[10px] font-mono mt-0.5">{kAlpha2Correction ? 'Stripping Active' : 'Disabled'}</div>
                  </button>
                </div>

                {applyLPFactor && (
                  <div className="p-2.5 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Monochromator 2θ_M</span>
                    <input
                      type="number"
                      step="0.2"
                      value={monochromatorAngle}
                      onChange={(e) => setMonochromatorAngle(parseFloat(e.target.value) || 26.4)}
                      className="w-20 px-2 py-1 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded text-xs font-mono tabular-nums text-right"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upgraded Reflections Data Manager with Interactive Graphic + 3-Way Cards | Matrix | CSV */}
          <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Voigt Reflections ({parsedPeaks.length})
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  {(
                    [
                      { id: 'cards', label: 'Cards', icon: <LayoutGrid className="w-3 h-3" /> },
                      { id: 'matrix', label: 'Matrix', icon: <Table className="w-3 h-3" /> },
                      { id: 'csv', label: 'CSV', icon: <FileText className="w-3 h-3" /> },
                    ] as const
                  ).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setInputEditorMode(v.id)}
                      className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                        inputEditorMode === v.id
                          ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white font-semibold border border-slate-200/80 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 border border-transparent'
                      }`}
                    >
                      {v.icon}
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSortPeaksByAngle}
                  title="Sort by 2θ ascending"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] hover:border-indigo-500/50 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExcludedIndices([]);
                    setInputData('');
                  }}
                  title="Clear all reflections"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] hover:border-rose-500/50 text-slate-600 dark:text-slate-300 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive 4-Mode Voigt Reflections Metrology Graphic */}
            {result && result.points.length > 0 && (
              <DVReflectionsGraphic
                points={result.points}
                selectedPeakIdx={selectedPeakIdx}
                onSelectPeakIdx={(idx) => setSelectedPeakIdx(idx)}
                hoveredPeakIdx={hoveredPeakIdx}
                onHoverPeakIdx={(idx) => setHoveredPeakIdx(idx)}
                wavelength={wavelength}
                shapeK={shapeK}
                deconvKernel={deconvKernel}
                instEta={instEta}
                onToggleExcludePeak={handleTogglePeakExclusion}
                controlledMode={graphicMode}
                onModeChange={setGraphicMode}
              />
            )}

            {/* View 1: Scientific Metrology Cards */}
            {inputEditorMode === 'cards' && (
              <div className="space-y-3">
                <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5">
                  {parsedPeaks.map((peak, idx) => {
                    const pt = result?.points[idx];
                    const isExcl = excludedIndices.includes(idx);
                    const isSelected = selectedPeakIdx === idx;
                    const betaC = pt?.betaCStar ?? 0;
                    const betaG = pt?.betaGStar ?? 0;
                    const betaSum = Math.max(1e-6, betaC + betaG);
                    const cPct = Math.round((betaC / betaSum) * 100);
                    const gPct = 100 - cPct;

                    return (
                      <div
                        key={`dv-card-${idx}`}
                        onMouseEnter={() => setHoveredPeakIdx(idx)}
                        onMouseLeave={() => setHoveredPeakIdx(null)}
                        onClick={() => setSelectedPeakIdx(idx)}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer font-mono tabular-nums ${
                          isExcl
                            ? 'opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                            : isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-500/70'
                            : 'bg-slate-50/70 dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-indigo-400/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              {peak.hkl ? `(${peak.hkl.join('')})` : `#${idx + 1}`}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {peak.twoTheta.toFixed(2)}°
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              FWHM {peak.fwhmObs.toFixed(3)}°
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              η {(peak.eta ?? 0.5).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPeakIdx(idx);
                                setActivePlotTab('profile');
                              }}
                              title="Inspect Voigt profile deconvolution"
                              className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePeakExclusion(idx)}
                              title={isExcl ? 'Restore reflection' : 'Exclude reflection'}
                              className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              {isExcl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePeakRow(idx)}
                              title="Delete reflection"
                              className="p-1 rounded hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cauchy vs Gaussian Reciprocal Partition Bar */}
                        {pt && (
                          <div className="mt-2 space-y-1">
                            <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${cPct}%` }}
                              />
                              <div
                                className="h-full bg-purple-500"
                                style={{ width: `${gPct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                              <span>
                                β_C* <strong className="text-indigo-600 dark:text-indigo-300">{pt.betaCStar.toFixed(4)}</strong> ({cPct}%)
                                {' · '}
                                β_G* <strong className="text-purple-600 dark:text-purple-300">{pt.betaGStar.toFixed(4)}</strong> ({gPct}%)
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                D_V {convertLength(pt.singleDvNm * 10, lengthUnit).toFixed(1)} {lengthUnit}
                                {pt.isOutlier && !isExcl ? ' · ▲ Outlier' : ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add Reflection Bar */}
                <div className="p-2.5 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2θ (°)"
                    value={newTwoTheta}
                    onChange={(e) => setNewTwoTheta(e.target.value)}
                    className="w-17 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="number"
                    step="0.005"
                    placeholder="FWHM"
                    value={newFwhm}
                    onChange={(e) => setNewFwhm(e.target.value)}
                    className="w-17 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="number"
                    step="0.02"
                    placeholder="η"
                    value={newEta}
                    onChange={(e) => setNewEta(e.target.value)}
                    className="w-15 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="hkl"
                    value={newHkl}
                    onChange={(e) => setNewHkl(e.target.value)}
                    className="w-14 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPeakRow}
                    className="ml-auto px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* View 2: Inline-Editable Matrix Table */}
            {inputEditorMode === 'matrix' && (
              <div className="space-y-3">
                <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-2">Use</th>
                        <th className="py-2 px-1.5">2θ (°)</th>
                        <th className="py-2 px-1.5">FWHM (°)</th>
                        <th className="py-2 px-1.5">η [0–1]</th>
                        <th className="py-2 px-1.5">hkl</th>
                        <th className="py-2 px-1.5 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                      {parsedPeaks.map((peak, idx) => {
                        const isExcl = excludedIndices.includes(idx);
                        return (
                          <tr
                            key={`dv-peak-row-${idx}`}
                            onMouseEnter={() => setHoveredPeakIdx(idx)}
                            onMouseLeave={() => setHoveredPeakIdx(null)}
                            className={`transition-colors ${
                              isExcl
                                ? 'opacity-45 bg-slate-100/50 dark:bg-slate-900/40'
                                : selectedPeakIdx === idx
                                ? 'bg-indigo-50/70 dark:bg-indigo-500/10'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-1.5 px-2">
                              <button
                                type="button"
                                onClick={() => handleTogglePeakExclusion(idx)}
                                className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                              >
                                {isExcl ? <Square className="w-4 h-4 text-slate-400" /> : <CheckSquare className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="number"
                                step="0.01"
                                value={peak.twoTheta}
                                onFocus={() => setSelectedPeakIdx(idx)}
                                onChange={(e) => handleUpdatePeakRow(idx, 'twoTheta', e.target.value)}
                                className="w-16 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tabular-nums"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="number"
                                step="0.005"
                                value={peak.fwhmObs}
                                onFocus={() => setSelectedPeakIdx(idx)}
                                onChange={(e) => handleUpdatePeakRow(idx, 'fwhmObs', e.target.value)}
                                className="w-16 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tabular-nums"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="number"
                                step="0.02"
                                min="0.01"
                                max="0.99"
                                value={peak.eta ?? 0.5}
                                onFocus={() => setSelectedPeakIdx(idx)}
                                onChange={(e) => handleUpdatePeakRow(idx, 'eta', e.target.value)}
                                className="w-14 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-mono tabular-nums"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="text"
                                value={peak.hkl ? peak.hkl.join('') : ''}
                                placeholder="hkl"
                                onFocus={() => setSelectedPeakIdx(idx)}
                                onChange={(e) => handleUpdatePeakRow(idx, 'hkl', e.target.value)}
                                className="w-12 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono"
                              />
                            </td>
                            <td className="py-1.5 px-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePeakRow(idx)}
                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Quick Add Reflection Bar */}
                <div className="p-2.5 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2θ (°)"
                    value={newTwoTheta}
                    onChange={(e) => setNewTwoTheta(e.target.value)}
                    className="w-17 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="number"
                    step="0.005"
                    placeholder="FWHM"
                    value={newFwhm}
                    onChange={(e) => setNewFwhm(e.target.value)}
                    className="w-17 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="number"
                    step="0.02"
                    placeholder="η"
                    value={newEta}
                    onChange={(e) => setNewEta(e.target.value)}
                    className="w-15 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="hkl"
                    value={newHkl}
                    onChange={(e) => setNewHkl(e.target.value)}
                    className="w-14 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPeakRow}
                    className="ml-auto px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* View 3: CSV Raw Batch Editor */}
            {inputEditorMode === 'csv' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format: <code className="font-mono text-indigo-600 dark:text-indigo-400">2θ [deg], FWHM [deg], h, k, l, η [0..1]</code>
                </p>
                <textarea
                  value={inputData}
                  onChange={(e) => {
                    setExcludedIndices([]);
                    setInputData(e.target.value);
                  }}
                  rows={8}
                  spellCheck={false}
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-indigo-300 font-mono text-xs border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-500 dark:text-slate-400">
              <span>
                Active Reflections: <strong className="text-slate-900 dark:text-white tabular-nums">{activeCount}</strong> / {totalCount}
              </span>
              {activeCount >= 2 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ● Dual Fits Converged
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  ▲ Need ≥ 2 Reflections
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 5-Card Telemetry Strip, 6 Interactive Chart Views & Deconvolution Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* 5-Card Flat Metrology Telemetry Strip — Full Light/Dark Parity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                {/* 1. Volume-Weighted Size <D>_V */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono tabular-nums">
                  <div className="flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>Volume ⟨D_V⟩</span>
                    <Ruler className="w-3.5 h-3.5" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {convertLength(result.volumeSizeDvNm * 10, lengthUnit).toFixed(2)}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-1.5 font-semibold">
                      {lengthUnit}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>±ΔD_V</span>
                      <span className="text-slate-700 dark:text-slate-200">
                        ±{convertLength((result.volumeSizeUncertaintyNm || 0) * 10, lengthUnit).toFixed(2)} {lengthUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gauss D_G</span>
                      <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                        {convertLength(result.gaussianSizeDgNm * 10, lengthUnit).toFixed(1)} {lengthUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Area-Weighted Size <D>_A */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono tabular-nums">
                  <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Area ⟨D_A⟩</span>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(2)}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5 font-semibold">
                      {lengthUnit}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Number ⟨D_N⟩</span>
                      <span className="text-slate-700 dark:text-slate-200">
                        {convertLength((result.numberSizeDnNm || result.areaSizeDaNm * 0.72) * 10, lengthUnit).toFixed(1)} {lengthUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Median D_0</span>
                      <span className="text-emerald-600 dark:text-emerald-300 font-semibold">
                        {convertLength((result.logNormalMedianNm || result.areaSizeDaNm * 0.65) * 10, lengthUnit).toFixed(1)} {lengthUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Voigt Ratio k_S & Polydispersity */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono tabular-nums">
                  <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Voigt Ratio k_S</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {(result.voigtParameterK || 0).toFixed(3)}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1.5">
                      erfcx
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Polydisp. κ</span>
                      <span className="text-amber-600 dark:text-amber-300 font-semibold">
                        {(result.polydispersityRatio || 1.2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>LogNorm σ</span>
                      <span className="text-slate-700 dark:text-slate-200">
                        {(result.logNormalSigma || 0.3).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Deconvolved Microstrains */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono tabular-nums">
                  <div className="flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                    <span>RMS ⟨ε²⟩¹/²</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {(result.rmsStrain * 100).toFixed(3)}
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 ml-1 font-semibold">
                      %
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Cauchy e_C</span>
                      <span className="text-indigo-600 dark:text-indigo-300">{(result.cauchyStrainEc * 100).toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gauss e_G</span>
                      <span className="text-purple-600 dark:text-purple-300">{(result.gaussianStrainEg * 100).toFixed(3)}%</span>
                    </div>
                  </div>
                </div>

                {/* 5. Dislocation Density & Dual Fit R^2 */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono tabular-nums">
                  <div className="flex items-center justify-between text-[11px] text-sky-600 dark:text-cyan-400 font-semibold">
                    <span>Dislocation ρ</span>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {((result.dislocationDensityM2 || 0) / 1e15).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-sky-600 dark:text-cyan-400 ml-1 font-semibold">
                      ×10¹⁵ m⁻²
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Cauchy R²</span>
                      <span className="text-slate-700 dark:text-slate-200">{(result.cauchyFit.rSquared * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gauss R²</span>
                      <span className="text-slate-700 dark:text-slate-200">{(result.gaussianFit.rSquared * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Tab Interactive Visualization Stage — Full Light/Dark Parity */}
              <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800">
                    {[
                      { id: 'cauchy' as const, label: 'Cauchy Fit (β_C* vs s)' },
                      { id: 'gaussian' as const, label: 'Gaussian Fit ((β_G*)² vs s²)' },
                      { id: 'summary' as const, label: 'A_S(L), P(L) & Strain' },
                      { id: 'profile' as const, label: 'Peak Voigt Profile' },
                      { id: 'kernelMatrix' as const, label: 'Kernel Matrix' },
                      { id: 'concept' as const, label: 'Voigt Sandbox' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActivePlotTab(tab.id)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          activePlotTab === tab.id
                            ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab 1: Cauchy Linear Regression */}
                {activePlotTab === 'cauchy' && cauchyChartData && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                      <span className="text-slate-600 dark:text-slate-300">
                        Cauchy Fit:{' '}
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          β_C*(s) = {result.cauchyFit.slope.toFixed(4)}·s + {result.cauchyFit.intercept.toFixed(4)} nm⁻¹
                        </strong>
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={showConfidenceBand}
                          onChange={(e) => setShowConfidenceBand(e.target.checked)}
                          className="accent-indigo-500 rounded"
                        />
                        <span>95% Confidence Band</span>
                      </label>
                    </div>

                    <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={cauchyChartData.band} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                          <XAxis
                            dataKey="x"
                            type="number"
                            domain={[cauchyChartData.startX, cauchyChartData.endX]}
                            tickFormatter={(v) => Number(v).toFixed(2)}
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Scattering Vector s = 2 sin θ / λ [nm⁻¹]',
                              position: 'insideBottom',
                              offset: -15,
                              fill: chartPalette.cauchy,
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <YAxis
                            type="number"
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => Number(v).toFixed(3)}
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Cauchy Breadth β_C* [nm⁻¹]',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: chartPalette.cauchy,
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const pt = payload.find(p => p.payload && p.payload.twoTheta !== undefined)?.payload || payload[0].payload;
                                if (pt.twoTheta !== undefined) {
                                  return (
                                    <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                      <div className="font-bold border-b pb-1" style={{ color: chartPalette.cauchy, borderColor: chartPalette.tooltipBorder }}>
                                        {pt.hkl} · 2θ = {pt.twoTheta.toFixed(2)}°
                                      </div>
                                      <div>s: <strong>{pt.x.toFixed(4)} nm⁻¹</strong></div>
                                      <div>β_C*: <strong style={{ color: chartPalette.cauchy }}>{pt.y.toFixed(4)} nm⁻¹</strong></div>
                                      <div>Single D_V: <strong style={{ color: chartPalette.emerald }}>{pt.singleDvNm.toFixed(2)} nm</strong></div>
                                      <div>Std Residual z_C: <span>{pt.stdRes?.toFixed(2)}</span></div>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="border p-2.5 rounded-lg font-mono text-xs tabular-nums shadow-sm" style={tooltipStyle}>
                                    <div style={{ color: chartPalette.cauchy }}>s = {Number(pt.x).toFixed(3)} nm⁻¹</div>
                                    <div>Fit β_C* = {Number(pt.fitY).toFixed(4)} nm⁻¹</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine x={0} stroke={chartPalette.cauchy} strokeDasharray="4 4" label={{ value: 's = 0 (1/2D_A)', fill: chartPalette.cauchy, fontSize: 10 }} />

                          {showConfidenceBand && (
                            <Area
                              type="monotone"
                              dataKey="ciRange"
                              name="95% Confidence Band"
                              stroke="none"
                              fill={chartPalette.cauchy}
                              fillOpacity={0.14}
                            />
                          )}

                          <Line
                            type="linear"
                            dataKey="fitY"
                            name={`Cauchy Linear Fit (R² = ${(result.cauchyFit.rSquared * 100).toFixed(1)}%)`}
                            stroke={chartPalette.cauchy}
                            strokeWidth={2.5}
                            dot={false}
                          />

                          <Scatter
                            data={cauchyChartData.activeScatter}
                            dataKey="y"
                            name="Active Reflections (Click to Toggle)"
                            fill={chartPalette.cauchy}
                            stroke={chartPalette.cauchyDark}
                            strokeWidth={1.8}
                            onClick={(data: any) => {
                              if (data && typeof data.index === 'number') {
                                handleTogglePeakExclusion(data.index);
                              }
                            }}
                            cursor="pointer"
                          />

                          {cauchyChartData.excludedScatter.length > 0 && (
                            <Scatter
                              data={cauchyChartData.excludedScatter}
                              dataKey="y"
                              name="Excluded Reflections"
                              fill={chartPalette.amber}
                              stroke={chartPalette.amber}
                              strokeWidth={1.5}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 2: Gaussian Parabolic Regression */}
                {activePlotTab === 'gaussian' && gaussianChartData && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                      <span className="text-slate-600 dark:text-slate-300">
                        Gaussian Fit:{' '}
                        <strong className="text-purple-600 dark:text-purple-400">
                          (β_G*)² = {result.gaussianFit.slope.toFixed(5)}·s² + {result.gaussianFit.intercept.toFixed(5)} nm⁻²
                        </strong>
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={showConfidenceBand}
                          onChange={(e) => setShowConfidenceBand(e.target.checked)}
                          className="accent-purple-500 rounded"
                        />
                        <span>95% Confidence Band</span>
                      </label>
                    </div>

                    <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={gaussianChartData.band} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                          <XAxis
                            dataKey="x"
                            type="number"
                            domain={[gaussianChartData.startX, gaussianChartData.endX]}
                            tickFormatter={(v) => Number(v).toFixed(2)}
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Squared Scattering Vector s² [nm⁻²]',
                              position: 'insideBottom',
                              offset: -15,
                              fill: chartPalette.gauss,
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <YAxis
                            type="number"
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => Number(v).toFixed(4)}
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Gaussian Breadth Squared (β_G*)² [nm⁻²]',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: chartPalette.gauss,
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const pt = payload.find(p => p.payload && p.payload.twoTheta !== undefined)?.payload || payload[0].payload;
                                if (pt.twoTheta !== undefined) {
                                  return (
                                    <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                      <div className="font-bold border-b pb-1" style={{ color: chartPalette.gauss, borderColor: chartPalette.tooltipBorder }}>
                                        {pt.hkl} · 2θ = {pt.twoTheta.toFixed(2)}°
                                      </div>
                                      <div>s²: <strong>{pt.x.toFixed(4)} nm⁻²</strong></div>
                                      <div>(β_G*)²: <strong style={{ color: chartPalette.gauss }}>{pt.y.toFixed(5)} nm⁻²</strong></div>
                                      <div>β_G*: <span>{pt.betaGStar?.toFixed(4)} nm⁻¹</span></div>
                                      <div>Std Residual z_G: <span>{pt.stdRes?.toFixed(2)}</span></div>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="border p-2.5 rounded-lg font-mono text-xs tabular-nums shadow-sm" style={tooltipStyle}>
                                    <div style={{ color: chartPalette.gauss }}>s² = {Number(pt.x).toFixed(3)} nm⁻²</div>
                                    <div>Fit (β_G*)² = {Number(pt.fitY).toFixed(5)} nm⁻²</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine x={0} stroke={chartPalette.gauss} strokeDasharray="4 4" label={{ value: 's² = 0 (1/D_G²)', fill: chartPalette.gauss, fontSize: 10 }} />

                          {showConfidenceBand && (
                            <Area
                              type="monotone"
                              dataKey="ciRange"
                              name="95% Confidence Band"
                              stroke="none"
                              fill={chartPalette.gauss}
                              fillOpacity={0.14}
                            />
                          )}

                          <Line
                            type="linear"
                            dataKey="fitY"
                            name={`Gaussian Linear Fit (R² = ${(result.gaussianFit.rSquared * 100).toFixed(1)}%)`}
                            stroke={chartPalette.gauss}
                            strokeWidth={2.5}
                            dot={false}
                          />

                          <Scatter
                            data={gaussianChartData.activeScatter}
                            dataKey="y"
                            name="Active Reflections (Click to Toggle)"
                            fill={chartPalette.gauss}
                            stroke={chartPalette.gaussDark}
                            strokeWidth={1.8}
                            onClick={(data: any) => {
                              if (data && typeof data.index === 'number') {
                                handleTogglePeakExclusion(data.index);
                              }
                            }}
                            cursor="pointer"
                          />

                          {gaussianChartData.excludedScatter.length > 0 && (
                            <Scatter
                              data={gaussianChartData.excludedScatter}
                              dataKey="y"
                              name="Excluded Reflections"
                              fill={chartPalette.amber}
                              stroke={chartPalette.amber}
                              strokeWidth={1.5}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 3: Column-Length Distribution P(L), Analytical Fourier A_S(L), Warren-Averbach Strain Curve & Moments */}
                {activePlotTab === 'summary' && columnLengthData && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        ⟨D_A⟩ = {columnLengthData.Da.toFixed(2)} nm · ⟨D_V⟩ = {columnLengthData.Dv.toFixed(2)} nm · σ_LN = {columnLengthData.sigma.toFixed(3)}
                      </span>
                      <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                        {[
                          { id: 'distribution' as const, label: 'Column P(L)' },
                          { id: 'fourier' as const, label: 'Fourier A_S(L)' },
                          { id: 'strainCurve' as const, label: 'RMS ⟨ε²(L)⟩¹/²' },
                          { id: 'bars' as const, label: 'Size Moments' }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSummarySubView(sub.id)}
                            className={`px-2.5 py-1 rounded-md cursor-pointer whitespace-nowrap ${
                              summarySubView === sub.id
                                ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700'
                                : 'text-slate-600 dark:text-slate-400 border border-transparent'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {summarySubView === 'distribution' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setDistModelMode('lognormal')}
                              className={`px-2.5 py-1 rounded-md cursor-pointer whitespace-nowrap ${
                                distModelMode === 'lognormal'
                                  ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700'
                                  : 'text-slate-600 dark:text-slate-400 border border-transparent'
                              }`}
                            >
                              Log-Normal (Krill–Birringer)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDistModelMode('analytical')}
                              className={`px-2.5 py-1 rounded-md cursor-pointer whitespace-nowrap ${
                                distModelMode === 'analytical'
                                  ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700'
                                  : 'text-slate-600 dark:text-slate-400 border border-transparent'
                              }`}
                            >
                              Analytical Exact (d²A_S/dL²)
                            </button>
                          </div>
                          <span className={result.voigtConvexityValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                            {result.voigtConvexityValid
                              ? `● Convex (k_S = ${(result.voigtParameterK || 0).toFixed(3)} ≥ 0.707)`
                              : `▲ Hook Regime (k_S = ${(result.voigtParameterK || 0).toFixed(3)} < 0.707)`}
                          </span>
                        </div>

                        <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={columnLengthData.points} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                              <XAxis
                                dataKey="L"
                                type="number"
                                domain={[0, 'auto']}
                                stroke={chartPalette.axis}
                                tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                                label={{
                                  value: 'Column Length L [nm]',
                                  position: 'insideBottom',
                                  offset: -15,
                                  fill: chartPalette.emerald,
                                  fontSize: 12,
                                  fontFamily: 'monospace'
                                }}
                              />
                              <YAxis
                                stroke={chartPalette.axis}
                                tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                                label={{
                                  value: 'Probability Density P(L) [%]',
                                  angle: -90,
                                  position: 'insideLeft',
                                  offset: -5,
                                  fill: chartPalette.emerald,
                                  fontSize: 12,
                                  fontFamily: 'monospace'
                                }}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                      <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                        <div className="font-bold border-b pb-1" style={{ color: chartPalette.emerald, borderColor: chartPalette.tooltipBorder }}>
                                          Column Length L = {d.L} nm
                                        </div>
                                        {distModelMode === 'lognormal' ? (
                                          <>
                                            <div>Area-Weighted P_A(L): <strong style={{ color: chartPalette.emerald }}>{d.areaDensity}%</strong></div>
                                            <div>Volume-Weighted P_V(L): <strong style={{ color: chartPalette.cauchy }}>{d.volumeDensity}%</strong></div>
                                          </>
                                        ) : (
                                          <>
                                            <div>Analytical p_A(L): <strong style={{ color: chartPalette.emerald }}>{d.analyticalArea}%</strong></div>
                                            <div>Analytical p_V(L): <strong style={{ color: chartPalette.cauchy }}>{d.analyticalVol}%</strong></div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                              <ReferenceLine x={columnLengthData.Da} stroke={chartPalette.emerald} strokeDasharray="4 4" label={{ value: `⟨D_A⟩ = ${columnLengthData.Da.toFixed(1)} nm`, fill: chartPalette.emerald, fontSize: 10, position: 'top' }} />
                              <ReferenceLine x={columnLengthData.Dv} stroke={chartPalette.cauchy} strokeDasharray="4 4" label={{ value: `⟨D_V⟩ = ${columnLengthData.Dv.toFixed(1)} nm`, fill: chartPalette.cauchy, fontSize: 10, position: 'top' }} />
                              {distModelMode === 'lognormal' ? (
                                <>
                                  <Area type="monotone" dataKey="areaDensity" name="Area-Weighted Log-Normal P_A(L)" stroke={chartPalette.emerald} fill={chartPalette.emerald} fillOpacity={0.18} strokeWidth={2} />
                                  <Area type="monotone" dataKey="volumeDensity" name="Volume-Weighted Log-Normal P_V(L)" stroke={chartPalette.cauchy} fill={chartPalette.cauchy} fillOpacity={0.18} strokeWidth={2} />
                                </>
                              ) : (
                                <>
                                  <ReferenceLine y={0} stroke={chartPalette.axis} strokeWidth={1} />
                                  <Area type="monotone" dataKey="analyticalArea" name="Exact Double-Voigt p_A(L) = ⟨D_A⟩·A_S″(L)" stroke={chartPalette.emerald} fill={chartPalette.emerald} fillOpacity={0.18} strokeWidth={2} />
                                  <Area type="monotone" dataKey="analyticalVol" name="Exact Double-Voigt p_V(L) = (L/⟨D_A⟩)·p_A(L)" stroke={chartPalette.cauchy} fill={chartPalette.cauchy} fillOpacity={0.18} strokeWidth={2} />
                                </>
                              )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {summarySubView === 'fourier' && (
                      <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={columnLengthData.points} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                            <XAxis
                              dataKey="L"
                              type="number"
                              domain={[0, 'auto']}
                              stroke={chartPalette.axis}
                              tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                              label={{
                                value: 'Fourier Column Length L [nm]',
                                position: 'insideBottom',
                                offset: -15,
                                fill: chartPalette.cyan,
                                fontSize: 12,
                                fontFamily: 'monospace'
                              }}
                            />
                            <YAxis
                              domain={[0, 1.05]}
                              stroke={chartPalette.axis}
                              tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                              label={{
                                value: 'Size Fourier Coefficient A_S(L)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: -5,
                                fill: chartPalette.cyan,
                                fontSize: 12,
                                fontFamily: 'monospace'
                              }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                      <div className="font-bold border-b pb-1" style={{ color: chartPalette.cyan, borderColor: chartPalette.tooltipBorder }}>
                                        Fourier Distance L = {d.L} nm
                                      </div>
                                      <div>Analytical A_S(L): <strong style={{ color: chartPalette.emerald }}>{d.aSize}</strong></div>
                                      <div>Initial Tangent (1 − L/⟨D_A⟩): <strong style={{ color: chartPalette.cyan }}>{d.aTangent}</strong></div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                            <ReferenceLine x={columnLengthData.Da} stroke={chartPalette.cyan} strokeDasharray="4 4" label={{ value: `Tangent ⟨D_A⟩ = ${columnLengthData.Da.toFixed(1)} nm`, fill: chartPalette.cyan, fontSize: 10, position: 'top' }} />
                            <Area type="monotone" dataKey="aSize" name="Double-Voigt A_S(L) = exp(−2Lβ_S,C* − πL²(β_S,G*)²)" stroke={chartPalette.emerald} fill={chartPalette.emerald} fillOpacity={0.16} strokeWidth={2.4} />
                            <Line type="monotone" dataKey="aTangent" name="Exact Initial Tangent (Intercept = ⟨D_A⟩)" stroke={chartPalette.cyan} strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {summarySubView === 'strainCurve' && result.strainDistributionCurve && (
                      <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.strainDistributionCurve} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                            <XAxis
                              dataKey="L"
                              type="number"
                              stroke={chartPalette.axis}
                              tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                              label={{
                                value: 'Correlation Distance / Column Length L [nm]',
                                position: 'insideBottom',
                                offset: -15,
                                fill: chartPalette.gauss,
                                fontSize: 12,
                                fontFamily: 'monospace'
                              }}
                            />
                            <YAxis
                              stroke={chartPalette.axis}
                              tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                              label={{
                                value: 'RMS Microstrain ⟨ε²(L)⟩¹/² [%]',
                                angle: -90,
                                position: 'insideLeft',
                                offset: -5,
                                fill: chartPalette.gauss,
                                fontSize: 12,
                                fontFamily: 'monospace'
                              }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                      <div className="font-bold border-b pb-1" style={{ color: chartPalette.gauss, borderColor: chartPalette.tooltipBorder }}>
                                        Column Distance L = {d.L} nm
                                      </div>
                                      <div>Total RMS Strain ⟨ε_L⟩: <strong>{d.rmsStrainPct.toFixed(4)}%</strong></div>
                                      <div>Cauchy L⁻¹/² Term: <span style={{ color: chartPalette.cauchy }}>{d.cauchyContribPct.toFixed(4)}%</span></div>
                                      <div>Gaussian Limit: <span style={{ color: chartPalette.emerald }}>{d.gaussianContribPct.toFixed(4)}%</span></div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                            <ReferenceLine x={Number((result.areaSizeDaNm / 2).toFixed(2))} stroke={chartPalette.amber} strokeDasharray="3 3" label={{ value: 'L = D_A/2', fill: chartPalette.amber, fontSize: 10, position: 'top' }} />
                            <Line type="monotone" dataKey="rmsStrainPct" name="Total Balzar RMS ⟨ε²(L)⟩¹/² [%]" stroke={chartPalette.gauss} strokeWidth={2.5} dot={false} />
                            <Line type="monotone" dataKey="cauchyContribPct" name="Cauchy Decay (∝ L⁻¹/²)" stroke={chartPalette.cauchy} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                            <Line type="monotone" dataKey="gaussianContribPct" name="Gaussian RMS Asymptote" stroke={chartPalette.emerald} strokeWidth={1.6} strokeDasharray="2 2" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {summarySubView === 'bars' && (
                      <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sizeComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                            <XAxis
                              dataKey="name"
                              stroke={chartPalette.axis}
                              tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            />
                            <YAxis
                              stroke={chartPalette.axis}
                              tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                              label={{
                                value: 'Crystallite Size [nm]',
                                angle: -90,
                                position: 'insideLeft',
                                offset: -5,
                                fill: chartPalette.emerald,
                                fontSize: 12,
                                fontFamily: 'monospace'
                              }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                      <div className="font-bold border-b pb-1" style={{ color: chartPalette.emerald, borderColor: chartPalette.tooltipBorder }}>{d.name}</div>
                                      <div>Calculated Size: <strong>{d.size.toFixed(2)} nm</strong></div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="size" name="Crystallite Size Moment [nm]" radius={[6, 6, 0, 0]} maxBarSize={54}>
                              {sizeComparisonData.map((entry, index) => (
                                <Cell key={`size-cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Single-Peak Voigt Deconvolution Profile */}
                {activePlotTab === 'profile' && selectedPeakProfileData && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-300">
                        Inspecting Reflection Voigt Kernel Decomposition:
                      </span>
                      <select
                        value={selectedPeakIdx}
                        onChange={(e) => setSelectedPeakIdx(parseInt(e.target.value, 10))}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-[#111827] text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs cursor-pointer"
                      >
                        {result.points.map((p, idx) => (
                          <option key={`sel-pk-${idx}`} value={idx}>
                            Peak #{idx + 1}: 2θ = {p.twoTheta.toFixed(2)}° {p.hkl ? `(${p.hkl.join('')})` : ''} · η = {(p.etaObs ?? 0.5).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-80 sm:h-96 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedPeakProfileData.data} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                          <XAxis
                            dataKey="twoTheta"
                            type="number"
                            domain={['auto', 'auto']}
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Diffraction Angle 2θ [°]',
                              position: 'insideBottom',
                              offset: -15,
                              fill: chartPalette.cyan,
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <YAxis
                            type="number"
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Normalized Intensity [a.u.]',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: chartPalette.cyan,
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="border p-3 rounded-lg font-mono text-xs space-y-1 tabular-nums shadow-sm" style={tooltipStyle}>
                                    <div className="font-bold border-b pb-1" style={{ color: chartPalette.cyan, borderColor: chartPalette.tooltipBorder }}>2θ = {d.twoTheta}°</div>
                                    <div>Total Voigt V(2θ): <strong>{d.voigt}</strong></div>
                                    <div>Cauchy L(2θ) [Size]: <span style={{ color: chartPalette.cauchy }}>{d.cauchy}</span></div>
                                    <div>Gaussian G(2θ) [Strain]: <span style={{ color: chartPalette.gauss }}>{d.gaussian}</span></div>
                                    <div>Inst. Kernel g(2θ): <span style={{ color: chartPalette.amber }}>{d.instrumental}</span></div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <Line type="monotone" dataKey="voigt" name="Composite Voigt V(2θ)" stroke={chartPalette.cyan} strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="cauchy" name="Cauchy Component L(2θ)" stroke={chartPalette.cauchy} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                          <Line type="monotone" dataKey="gaussian" name="Gaussian Component G(2θ)" stroke={chartPalette.gauss} strokeWidth={1.8} strokeDasharray="2 2" dot={false} />
                          <Line type="monotone" dataKey="instrumental" name="Instrumental g(2θ)" stroke={chartPalette.amber} strokeWidth={1.4} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 5: Simultaneous 3-Kernel & Weighting Comparative Matrix — Full Light/Dark Parity */}
                {activePlotTab === 'kernelMatrix' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                      <span>Simultaneous Double-Voigt Inversion Kernel &amp; Regression Weighting Benchmark</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Click any row to apply</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070A12]">
                      <table className="w-full text-left font-mono text-xs tabular-nums">
                        <thead className="bg-slate-100 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Kernel &amp; Solver Configuration</th>
                            <th className="py-2.5 px-2.5 text-indigo-600 dark:text-indigo-400">⟨D_V⟩ (nm)</th>
                            <th className="py-2.5 px-2.5 text-emerald-600 dark:text-emerald-400">⟨D_A⟩ (nm)</th>
                            <th className="py-2.5 px-2.5 text-amber-600 dark:text-amber-400">k_S</th>
                            <th className="py-2.5 px-2.5 text-sky-600 dark:text-cyan-400">e_C (%)</th>
                            <th className="py-2.5 px-2.5 text-purple-600 dark:text-purple-400">e_G (%)</th>
                            <th className="py-2.5 px-2.5 text-slate-900 dark:text-white">RMS ⟨ε⟩ (%)</th>
                            <th className="py-2.5 px-2.5">Cauchy R²</th>
                            <th className="py-2.5 px-2.5">Gauss R²</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                          {kernelComparisonMatrix.map((row, i) => {
                            const isCurrent = deconvKernel === row.kernel && regressionWeighting === row.weighting;
                            return (
                              <tr
                                key={`${row.kernel}-${row.weighting}-${i}`}
                                onClick={() => {
                                  setDeconvKernel(row.kernel);
                                  setRegressionWeighting(row.weighting);
                                }}
                                className={`cursor-pointer transition-colors ${
                                  isCurrent
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15'
                                    : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                  <span>{row.label}</span>
                                  {isCurrent && (
                                    <span className="ml-2 text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold">
                                      · Active
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2.5 font-semibold text-indigo-700 dark:text-indigo-300">{row.dvNm.toFixed(2)}</td>
                                <td className="py-2.5 px-2.5 font-semibold text-emerald-700 dark:text-emerald-300">{row.daNm.toFixed(2)}</td>
                                <td className="py-2.5 px-2.5 text-amber-700 dark:text-amber-300">{row.kParam.toFixed(3)}</td>
                                <td className="py-2.5 px-2.5 text-sky-700 dark:text-cyan-300">{row.ecPct.toFixed(4)}</td>
                                <td className="py-2.5 px-2.5 text-purple-700 dark:text-purple-300">{row.egPct.toFixed(4)}</td>
                                <td className="py-2.5 px-2.5 font-semibold text-slate-900 dark:text-white">{row.rmsPct.toFixed(4)}</td>
                                <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300">{(row.cauchyR2 * 100).toFixed(1)}%</td>
                                <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300">{(row.gaussR2 * 100).toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 6: Interactive Voigt Physics Sandbox */}
                {activePlotTab === 'concept' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-50 dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex flex-wrap justify-between items-center text-xs font-mono">
                        <span className="text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Lorentzian Mixing Parameter η = {interactiveEta.toFixed(2)}</span>
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">
                          Shape Factor φ = FWHM/β = {(1 / (0.5 * (Math.PI * interactiveEta + Math.sqrt(Math.PI / Math.LN2) * (1 - interactiveEta)))).toFixed(4)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.95"
                        step="0.01"
                        value={interactiveEta}
                        onChange={(e) => setInteractiveEta(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>← η = 0.05 (Gaussian Strain Core, φ → 0.9394)</span>
                        <span>η = 0.95 (Cauchy Size Wings, φ → 0.6366) →</span>
                      </div>
                    </div>

                    <div className="h-72 sm:h-80 w-full bg-slate-50/70 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={conceptProfileData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                          <XAxis
                            dataKey="twoTheta"
                            type="number"
                            domain={['auto', 'auto']}
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                          />
                          <YAxis
                            type="number"
                            stroke={chartPalette.axis}
                            tick={{ fill: chartPalette.tick, fontSize: 11, fontFamily: 'monospace' }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <Line type="monotone" dataKey="voigt" name="Total Voigt Profile V(2θ)" stroke={chartPalette.cyan} strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="cauchySize" name="Cauchy Component (Size)" stroke={chartPalette.cauchy} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                          <Line type="monotone" dataKey="gaussianStrain" name="Gaussian Component (Strain)" stroke={chartPalette.gauss} strokeWidth={2} strokeDasharray="2 2" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Reflection Parameters & Residual Diagnostic Table */}
              <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Double-Voigt Reciprocal Deconvolution &amp; Diagnostic Table</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Click any row to inspect its Voigt peak profile
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Use</th>
                        <th className="py-2.5 px-3">2θ (°)</th>
                        <th className="py-2.5 px-3">hkl</th>
                        <th className="py-2.5 px-3">η / φ</th>
                        <th className="py-2.5 px-3">s (nm⁻¹)</th>
                        <th className="py-2.5 px-3 text-indigo-600 dark:text-indigo-400">β_C* (nm⁻¹)</th>
                        <th className="py-2.5 px-3 text-purple-600 dark:text-purple-400">(β_G*)² (nm⁻²)</th>
                        <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">D_V,hkl (nm)</th>
                        <th className="py-2.5 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {result.points.map((p, idx) => {
                        const rowIndex = p.index !== undefined ? p.index : idx;
                        const isSelected = selectedPeakIdx === idx;
                        return (
                          <tr
                            key={`dv-ext-${rowIndex}-${p.twoTheta}`}
                            onMouseEnter={() => setHoveredPeakIdx(idx)}
                            onMouseLeave={() => setHoveredPeakIdx(null)}
                            onClick={() => {
                              setSelectedPeakIdx(idx);
                              setActivePlotTab('profile');
                            }}
                            className={`transition-colors cursor-pointer ${
                              p.excluded
                                ? 'opacity-45 bg-slate-100/50 dark:bg-slate-900/40'
                                : isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td
                              className="py-2 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePeakExclusion(rowIndex);
                              }}
                            >
                              <button type="button" className="text-indigo-600 dark:text-indigo-400 cursor-pointer">
                                {p.excluded ? <Square className="w-4 h-4 text-slate-400" /> : <CheckSquare className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{p.twoTheta.toFixed(2)}°</td>
                            <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 font-semibold">{p.hkl ? `(${p.hkl.join('')})` : '—'}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              {(p.etaObs ?? 0.5).toFixed(2)} / {(p.shapeFactorPhi ?? 0.75).toFixed(3)}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{p.s.toFixed(4)}</td>
                            <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-300">{p.betaCStar.toFixed(4)}</td>
                            <td className="py-2 px-3 font-semibold text-purple-600 dark:text-purple-300">{p.betaGStarSq.toFixed(5)}</td>
                            <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">{p.singleDvNm.toFixed(2)}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {p.excluded ? (
                                <span className="text-slate-400">○ Excluded</span>
                              ) : p.isOutlier ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">▲ Outlier</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">● Nominal</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scientific Math Control, AI Analysis & Python Exporter */}
              <div className="space-y-4">
                <ScientificMathControl
                  title="Double-Voigt Reciprocal-Space Extrapolation"
                  formula="\begin{aligned} \beta_C^*(s) &= \frac{1}{2\langle D \rangle_A} + 2e_C s \\ (\beta_G^*(s))^2 &= \left(\frac{1}{D_G}\right)^2 + 2\pi\langle\varepsilon_G^2\rangle s^2 \\ \langle D \rangle_V &= \frac{\exp(k_S^2)\,\mathrm{erfc}(k_S)}{\beta_{S,G}^*} \end{aligned}"
                  description="Deconvolutes instrumental broadening independently in Cauchy and Gaussian channels to separate area-weighted size, volume-weighted size, and microstrain."
                  variables={[
                    { symbol: 'D_V', name: 'Volume Size', value: convertLength(result.volumeSizeDvNm * 10, lengthUnit), unit: lengthUnit },
                    { symbol: 'D_A', name: 'Area Size', value: convertLength(result.areaSizeDaNm * 10, lengthUnit), unit: lengthUnit },
                    { symbol: 'e_C', name: 'Cauchy Strain', value: result.cauchyStrainEc * 100, unit: '%' },
                    { symbol: 'e_G', name: 'Gaussian Strain', value: result.gaussianStrainEg * 100, unit: '%' }
                  ]}
                  result={convertLength(result.volumeSizeDvNm * 10, lengthUnit)}
                  resultUnit={lengthUnit}
                  resultName="⟨D_V⟩ (Volume-Weighted Size)"
                />

                <AIAnalysis methodName="Double-Voigt Method (Langford / Balzar-Ledbetter)" resultData={result} />

                <PythonCodeExporter
                  methodName="Double-Voigt Method"
                  parameters={{
                    wavelength: Number(wavelength),
                    twoTheta: result.points.filter(p => !p.excluded).map(p => p.twoTheta),
                    betaL: result.points[0]?.betaCStar || 0.18,
                    betaG: result.points[0]?.betaGStar || 0.12,
                    x: result.points.filter(p => !p.excluded).map(p => p.s),
                    yCauchy: result.points.filter(p => !p.excluded).map(p => p.betaCStar),
                    yGaussian: result.points.filter(p => !p.excluded).map(p => p.betaGStarSq)
                  }}
                />
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#0B0F19] p-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Minimum 2 Active Voigt Reflections Required
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Provide at least two reflections with valid 2θ, FWHM, and Lorentzian mixing fraction η, or select one of the Reference Standards above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
