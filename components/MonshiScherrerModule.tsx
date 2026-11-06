import React, { useState, useEffect, useMemo } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseScherrerInput, calculateMonshiScherrer } from '../utils/physics';
import { MonshiScherrerResult, ScherrerInput } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Info,
  AlertTriangle,
  TrendingUp,
  Ruler,
  ChevronDown,
  Atom,
  Download,
  Trash2,
  Database,
  FlaskConical,
  Activity,
  Layers,
  CheckCircle,
  Copy,
  Sliders,
  HelpCircle,
  Plus,
  Filter,
  RotateCcw,
  Table,
  FileText,
  ArrowUpDown,
  CheckSquare,
  Square,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';

const XRAY_WAVELENGTHS = [
  { label: 'Cu Kα1', value: 1.54056 },
  { label: 'Cu Kα (avg)', value: 1.5418 },
  { label: 'Mo Kα1', value: 0.7093 },
  { label: 'Co Kα1', value: 1.78897 },
  { label: 'Fe Kα1', value: 1.93604 },
  { label: 'Cr Kα1', value: 2.2897 },
  { label: 'Ag Kα1', value: 0.55941 }
];

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies' },
  { label: 'Spherical (FWHM)', value: 0.94, desc: 'Optimized for isotropic spherical crystallites' },
  { label: 'Spherical (Integral)', value: 0.89, desc: 'Scherrer constant for spherical integral breadth' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites terminated by {100} facets' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic crystals along {111} orientation' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel and fluorite structured nanocrystals' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for tetrahedral/triangular habit geometries' },
  { label: 'Nanowires / Rods', value: 1.1, desc: 'High-anisotropy 1D fibrillar or rod-like crystals' },
];

const MS_PRESETS = [
  {
    name: 'ZnO Wurtzite',
    tag: 'Isotropic (m ≈ 1.0)',
    wavelength: 1.54056,
    k: 0.9,
    instFwhm: 0.08,
    data: "31.77, 0.280, 1, 0, 0\n34.42, 0.283, 0, 0, 2\n36.25, 0.285, 1, 0, 1\n47.54, 0.296, 1, 0, 2\n56.60, 0.308, 1, 1, 0\n62.86, 0.317, 1, 0, 3\n67.96, 0.326, 1, 1, 2",
    desc: 'Hexagonal wurtzite ZnO nanoparticles exhibiting near-ideal isotropic size broadening (m ≈ 1.0).'
  },
  {
    name: 'TiO2 Anatase',
    tag: 'Tetragonal Oxide',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.07,
    data: "25.28, 0.350, 1, 0, 1\n37.80, 0.375, 0, 0, 4\n48.05, 0.402, 2, 0, 0\n53.89, 0.422, 1, 0, 5\n55.08, 0.428, 2, 1, 1\n62.69, 0.455, 2, 0, 4\n68.76, 0.482, 1, 1, 6",
    desc: 'Tetragonal Anatase TiO2 nanocrystallites with moderate microstrain broadening at high 2θ.'
  },
  {
    name: 'CeO2 SRM 674b',
    tag: 'Fluorite Standard',
    wavelength: 1.54056,
    k: 0.943,
    instFwhm: 0.06,
    data: "28.55, 0.220, 1, 1, 1\n33.08, 0.223, 2, 0, 0\n47.48, 0.235, 2, 2, 0\n56.34, 0.244, 3, 1, 1\n59.09, 0.248, 2, 2, 2\n69.41, 0.262, 4, 0, 0\n76.70, 0.275, 3, 3, 1",
    desc: 'Cubic fluorite CeO2 reference powder showing high-linearity logarithmic regression.'
  },
  {
    name: 'Fe3O4 Spinel',
    tag: 'Magnetic Ferrite',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.08,
    data: "30.10, 0.320, 2, 2, 0\n35.45, 0.340, 3, 1, 1\n43.08, 0.375, 4, 0, 0\n53.45, 0.425, 4, 2, 2\n56.96, 0.450, 5, 1, 1\n62.58, 0.490, 4, 4, 0",
    desc: 'Inverse spinel magnetite nanoparticles with lattice strain excess (m > 1.0).'
  },
  {
    name: 'Cold-Worked α-Fe',
    tag: 'High Strain (m > 1.8)',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.07,
    data: "44.67, 0.340, 1, 1, 0\n65.02, 0.480, 2, 0, 0\n82.33, 0.670, 2, 1, 1\n98.94, 0.950, 2, 2, 0\n116.38, 1.420, 3, 1, 0",
    desc: 'Severely plastically deformed BCC α-Iron demonstrating steep slope m > 1.8 due to dislocation microstrain.'
  },
  {
    name: 'Ultrafine Au FCC',
    tag: 'Sub-10nm Colloid',
    wavelength: 1.54056,
    k: 0.94,
    instFwhm: 0.08,
    data: "38.18, 0.960, 1, 1, 1\n44.39, 0.985, 2, 0, 0\n64.57, 1.095, 2, 2, 0\n77.54, 1.195, 3, 1, 1\n81.72, 1.238, 2, 2, 2",
    desc: 'Sub-10 nm colloidal gold nanocrystals where instrumental broadening is <10% of total peak width.'
  }
];

const serializePeaksToText = (peaks: ScherrerInput[]): string => {
  return peaks
    .map(p => {
      if (p.hkl && p.hkl.length === 3) {
        return `${p.twoTheta.toFixed(2)}, ${p.fwhmObs.toFixed(4)}, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}`;
      }
      return `${p.twoTheta.toFixed(2)}, ${p.fwhmObs.toFixed(4)}`;
    })
    .join('\n');
};

export const MonshiScherrerModule: React.FC = () => {
  const { lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [instFwhm, setInstFwhm] = useState<number>(0.08);
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);

  const [inputData, setInputData] = useState<string>(MS_PRESETS[0].data);
  const [activePresetName, setActivePresetName] = useState<string>(MS_PRESETS[0].name);
  const [inputEditorMode, setInputEditorMode] = useState<'table' | 'raw'>('table');
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);
  const [regressionWeighting, setRegressionWeighting] = useState<'OLS' | 'WLS-CosTheta' | 'Huber-Robust'>('OLS');

  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Voigt'>('Gaussian');
  const [pvEta, setPvEta] = useState<number>(0.5);
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0);
  const [applyLPFactor, setApplyLPFactor] = useState<boolean>(false);
  const [monochromatorAngle, setMonochromatorAngle] = useState<number>(26.4);
  const [kAlpha2Correction, setKAlpha2Correction] = useState<boolean>(false);

  const [physicsSubTab, setPhysicsSubTab] = useState<'setup' | 'profiles' | 'corrections'>('setup');
  const [activeTab, setActiveTab] = useState<'logPlot' | 'comparison' | 'residuals' | 'deconvolution' | 'spectrum'>('logPlot');
  const [residualPlotMode, setResidualPlotMode] = useState<'raw' | 'standardized'>('standardized');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showConstrainedLine, setShowConstrainedLine] = useState<boolean>(true);

  const [result, setResult] = useState<MonshiScherrerResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_monshi_scherrer_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // New peak draft state for interactive table mode
  const [newPeakTwoTheta, setNewPeakTwoTheta] = useState<string>('42.50');
  const [newPeakFwhm, setNewPeakFwhm] = useState<string>('0.320');
  const [newPeakHkl, setNewPeakHkl] = useState<string>('200');

  const parsedPeaks = useMemo(() => parseScherrerInput(inputData), [inputData]);

  const showTransientStatus = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 3200);
  };

  // Recalculate Monshi-Scherrer results whenever parameters or data change
  useEffect(() => {
    if (parsedPeaks.length >= 2) {
      const computed = calculateMonshiScherrer(
        wavelength,
        constantK,
        instFwhm,
        parsedPeaks,
        broadeningModel,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        {
          zeroShiftDeg,
          pvEta,
          applyLPFactor,
          monochromatorAngleDeg: monochromatorAngle,
          kAlpha2Correction,
          regressionWeighting,
          excludedIndices
        }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_monshi_scherrer_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
  }, [
    wavelength,
    constantK,
    instFwhm,
    parsedPeaks,
    broadeningModel,
    pvEta,
    zeroShiftDeg,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    regressionWeighting,
    excludedIndices
  ]);

  const handleApplyPreset = (preset: typeof MS_PRESETS[0]) => {
    setActivePresetName(preset.name);
    setWavelength(preset.wavelength);
    setConstantK(preset.k);
    setInstFwhm(preset.instFwhm);
    setExcludedIndices([]);
    setInputData(preset.data);
    showTransientStatus(`Loaded standard preset: ${preset.name}`);
  };

  const handleTogglePeakExclusion = (idx: number) => {
    setExcludedIndices(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      }
      // Prevent excluding if fewer than 2 active peaks would remain
      const currentActiveCount = parsedPeaks.length - prev.length;
      if (currentActiveCount <= 2) {
        showTransientStatus('Minimum 2 active reflections required for linear regression.');
        return prev;
      }
      return [...prev, idx];
    });
  };

  const handleAutoPruneOutliers = () => {
    if (!result || !result.pointsExtended) return;
    const outlierIndices = result.pointsExtended
      .filter(p => !p.excluded && p.isOutlier && p.index !== undefined)
      .map(p => p.index as number);

    if (outlierIndices.length === 0) {
      showTransientStatus('No statistical outliers (|z| > 2.0) detected in current fit.');
      return;
    }

    const remaining = parsedPeaks.length - (excludedIndices.length + outlierIndices.length);
    if (remaining < 2) {
      showTransientStatus('Cannot prune outliers: at least 2 reflections must remain active.');
      return;
    }

    setExcludedIndices(prev => Array.from(new Set([...prev, ...outlierIndices])));
    showTransientStatus(`Excluded ${outlierIndices.length} statistical outlier reflection(s) (|z| > 2.0).`);
  };

  const handleUpdatePeakRow = (idx: number, field: 'twoTheta' | 'fwhmObs' | 'hkl', rawVal: string) => {
    const updated = [...parsedPeaks];
    if (!updated[idx]) return;
    if (field === 'twoTheta') {
      const val = parseFloat(rawVal);
      if (!isNaN(val) && val > 0 && val < 180) updated[idx] = { ...updated[idx], twoTheta: val };
    } else if (field === 'fwhmObs') {
      const val = parseFloat(rawVal);
      if (!isNaN(val) && val > 0) updated[idx] = { ...updated[idx], fwhmObs: val };
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
    setInputData(serializePeaksToText(updated));
  };

  const handleDeletePeakRow = (idx: number) => {
    const updated = parsedPeaks.filter((_, i) => i !== idx);
    setExcludedIndices(prev => prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i)));
    setInputData(serializePeaksToText(updated));
  };

  const handleAddPeakRow = () => {
    const tt = parseFloat(newPeakTwoTheta);
    const fw = parseFloat(newPeakFwhm);
    if (isNaN(tt) || tt <= 0 || tt >= 180 || isNaN(fw) || fw <= 0) {
      showTransientStatus('Enter valid 2θ (1–179°) and FWHM (> 0°) values.');
      return;
    }
    let hklArr: [number, number, number] | undefined = undefined;
    const cleanHkl = newPeakHkl.trim().replace(/[()[\]]/g, '');
    if (/^\d{3}$/.test(cleanHkl)) {
      hklArr = [parseInt(cleanHkl[0], 10), parseInt(cleanHkl[1], 10), parseInt(cleanHkl[2], 10)];
    } else {
      const parts = cleanHkl.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      if (parts.length === 3) hklArr = [parts[0], parts[1], parts[2]];
    }
    const updated = [...parsedPeaks, { twoTheta: tt, fwhmObs: fw, hkl: hklArr }];
    setInputData(serializePeaksToText(updated));
    showTransientStatus(`Added reflection at 2θ = ${tt.toFixed(2)}°`);
  };

  const handleSortPeaksByAngle = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    setExcludedIndices([]);
    setInputData(serializePeaksToText(sorted));
    showTransientStatus('Sorted reflections in ascending 2θ order.');
  };

  const handleImportFromWorkspace = () => {
    try {
      const fwhmSaved = localStorage.getItem('xrd_fwhm_current');
      if (fwhmSaved) {
        const parsed = JSON.parse(fwhmSaved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const imported: ScherrerInput[] = parsed
            .filter((item: any) => item.twoTheta > 0 && item.fwhm > 0)
            .map((item: any) => ({
              twoTheta: Number(item.twoTheta),
              fwhmObs: Number(item.fwhm),
              hkl: item.hkl
            }));
          if (imported.length >= 2) {
            setExcludedIndices([]);
            setInputData(serializePeaksToText(imported));
            setActivePresetName('Workspace Import');
            showTransientStatus(`Imported ${imported.length} peaks from FWHM Workspace.`);
            return;
          }
        }
      }
      const whSaved = localStorage.getItem('xrd_wh_input_data');
      if (whSaved && parseScherrerInput(whSaved).length >= 2) {
        setExcludedIndices([]);
        setInputData(whSaved);
        setActivePresetName('Williamson-Hall Import');
        showTransientStatus('Imported diffraction peaks from Williamson-Hall workspace.');
        return;
      }
      showTransientStatus('No external multi-peak profile found in local workspace; using current dataset.');
    } catch {
      showTransientStatus('Could not read workspace storage.');
    }
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Monshi-Scherrer Equation: } \\ln(\\beta) &= m \\cdot \\ln\\left(\\frac{1}{\\cos\\theta}\\right) + \\ln\\left(\\frac{K\\lambda}{D}\\right) \\\\
\\text{Slope } m &= ${result.slope.toFixed(4)} \\pm ${(result.slopeStdErr || 0).toFixed(4)}, \\quad \\text{Intercept } C = ${result.intercept.toFixed(4)} \\pm ${(result.interceptStdErr || 0).toFixed(4)} \\\\
\\text{Goodness of Fit } R^2 &= ${(result.rSquared * 100).toFixed(2)}\\%, \\quad \\text{RMSE} = ${(result.rmse || 0).toFixed(5)} \\\\
\\text{Free-Slope Size } D &= ${result.sizeNm.toFixed(2)} \\pm ${(result.sizeUncertaintyNm || 0).toFixed(2)} \\text{ nm}, \\quad D_{m=1} = ${(result.constrainedSizeNm || result.sizeNm).toFixed(2)} \\text{ nm}
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    showTransientStatus('Copied publication-ready LaTeX equations to clipboard.');
  };

  const handleDownloadCSV = () => {
    if (!result || !result.pointsExtended) return;
    let csv = "Index,Status,2Theta (deg),hkl,d_hkl (A),q (A^-1),FWHM_obs (deg),FWHM_inst (deg),Inst_Fraction (%),beta_sample (rad),X=ln(1/cos theta),Y=ln(beta_sample),Fitted_Y,Constrained_Y (m=1),Residual_dY,Std_Residual_z,Single_Peak_D (nm),Dislocation_Density (m^-2)\n";
    result.pointsExtended.forEach((p, i) => {
      const hklStr = p.hkl ? `"(${p.hkl.join('')})"` : '""';
      const status = p.excluded ? 'Excluded' : p.isOutlier ? 'Outlier' : 'Active';
      csv += `${i + 1},${status},${p.twoTheta.toFixed(4)},${hklStr},${(p.dSpacingAngstrom || 0).toFixed(4)},${(p.qVectorInvAngstrom || 0).toFixed(4)},${p.fwhmObs.toFixed(4)},${p.fwhmInst.toFixed(4)},${(p.instFractionPct || 0).toFixed(2)},${p.betaCorrectedRad.toFixed(6)},${p.x.toFixed(6)},${p.y.toFixed(6)},${(p.yFitted || 0).toFixed(6)},${(p.yConstrained || 0).toFixed(6)},${(p.residual || 0).toFixed(6)},${(p.standardizedResidual || 0).toFixed(4)},${p.singlePeakSizeNm.toFixed(4)},${(p.dislocationDensityHkl || 0).toExponential(4)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monshi_Scherrer_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showTransientStatus('Exported full Monshi-Scherrer CSV report.');
  };

  // Generate chart regression points + 95% Confidence Band for Tab 1 (Log Plot)
  const chartData = useMemo(() => {
    if (!result || result.points.length < 2) return null;

    const allX = result.pointsExtended.map(p => p.x);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const span = Math.max(0.01, maxX - minX);
    const padding = span * 0.14;

    const startX = Math.max(0, minX - padding);
    const endX = maxX + padding;

    const activePts = result.pointsExtended.filter(p => !p.excluded);
    const n = activePts.length;
    const meanX = activePts.reduce((s, p) => s + p.x, 0) / Math.max(1, n);
    const ssX = activePts.reduce((s, p) => s + Math.pow(p.x - meanX, 2), 0);
    const rmse = result.rmse || 0.01;
    // Approximate t-critical for 95% CI (df = n - 2)
    const tCrit = n <= 3 ? 4.303 : n === 4 ? 3.182 : n === 5 ? 2.776 : n <= 7 ? 2.447 : 2.15;

    const gridSteps = 28;
    const regressionBand = [];
    for (let i = 0; i <= gridSteps; i++) {
      const xVal = startX + (i / gridSteps) * (endX - startX);
      const fitY = result.slope * xVal + result.intercept;
      const constrainedY = 1.0 * xVal + (result.constrainedIntercept ?? result.intercept);
      const seFit = ssX > 0 ? rmse * Math.sqrt(1 / n + Math.pow(xVal - meanX, 2) / ssX) : rmse;
      const halfBand = tCrit * seFit;
      regressionBand.push({
        x: xVal,
        fitY,
        constrainedY,
        ciUpper: fitY + halfBand,
        ciLower: fitY - halfBand,
        ciRange: [fitY - halfBand, fitY + halfBand]
      });
    }

    const activeScatter = result.pointsExtended
      .filter(p => !p.excluded)
      .map(p => ({
        index: p.index,
        x: p.x,
        y: p.y,
        fittedY: p.yFitted,
        constrainedY: p.yConstrained,
        residual: p.residual,
        stdResidual: p.standardizedResidual,
        isOutlier: p.isOutlier,
        twoTheta: p.twoTheta,
        dSpacing: p.dSpacingAngstrom,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        singleSize: p.singlePeakSizeNm,
        fwhmObs: p.fwhmObs,
        fwhmInst: p.fwhmInst,
        instFractionPct: p.instFractionPct,
        betaCorrectedDeg: p.betaCorrectedDeg,
        dislocationDensityHkl: p.dislocationDensityHkl,
        excluded: false
      }));

    const excludedScatter = result.pointsExtended
      .filter(p => p.excluded)
      .map(p => ({
        index: p.index,
        x: p.x,
        y: p.y,
        fittedY: p.yFitted,
        constrainedY: p.yConstrained,
        residual: p.residual,
        stdResidual: p.standardizedResidual,
        isOutlier: p.isOutlier,
        twoTheta: p.twoTheta,
        dSpacing: p.dSpacingAngstrom,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        singleSize: p.singlePeakSizeNm,
        fwhmObs: p.fwhmObs,
        fwhmInst: p.fwhmInst,
        instFractionPct: p.instFractionPct,
        betaCorrectedDeg: p.betaCorrectedDeg,
        dislocationDensityHkl: p.dislocationDensityHkl,
        excluded: true
      }));

    return {
      activeScatter,
      excludedScatter,
      allPoints: result.pointsExtended.map(p => ({
        index: p.index,
        x: p.x,
        y: p.y,
        fittedY: p.yFitted ?? (result.slope * p.x + result.intercept),
        residual: p.residual ?? 0,
        stdResidual: p.standardizedResidual ?? 0,
        isOutlier: p.isOutlier ?? false,
        twoTheta: p.twoTheta,
        dSpacing: p.dSpacingAngstrom ?? 0,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        singleSize: p.singlePeakSizeNm,
        fwhmObs: p.fwhmObs,
        fwhmInst: p.fwhmInst,
        instFractionPct: p.instFractionPct ?? 0,
        betaCorrectedDeg: p.betaCorrectedDeg,
        dislocationDensitye15: (p.dislocationDensityHkl || 0) / 1e15,
        excluded: p.excluded ?? false
      })),
      regressionBand,
      startX,
      endX
    };
  }, [result]);

  // Single-Peak Size Comparison Data for Tab 2
  const singlePeakComparisonData = useMemo(() => {
    if (!result || !result.pointsExtended) return [];
    return result.pointsExtended
      .filter(p => !p.excluded)
      .map(p => ({
        index: p.index,
        twoTheta: p.twoTheta,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
        singleSize: p.singlePeakSizeNm,
        monshiSize: result.sizeNm,
        constrainedSize: result.constrainedSizeNm ?? result.sizeNm,
        meanSize: result.meanSinglePeakSizeNm ?? result.sizeNm,
        diff: p.singlePeakSizeNm - result.sizeNm,
        dislocationDensitye15: (p.dislocationDensityHkl || 0) / 1e15
      }));
  }, [result]);

  const activeCount = result ? result.points.length : 0;
  const totalCount = result ? result.pointsExtended.length : parsedPeaks.length;
  const outlierCount = result ? result.pointsExtended.filter(p => !p.excluded && p.isOutlier).length : 0;

  const slopeRegime = useMemo(() => {
    if (!result) return { label: '● Awaiting Data', tone: 'text-slate-500 dark:text-slate-400' };
    const diff = Math.abs(result.slope - 1.0);
    if (diff <= 0.15) {
      return { label: '● Nominal Isotropic (m ≈ 1.0)', tone: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (result.slope > 1.15) {
      return { label: '▲ Strain-Broadened (m > 1.0)', tone: 'text-amber-600 dark:text-amber-400' };
    }
    return { label: '▲ Sub-Unity / Faulted (m < 1.0)', tone: 'text-cyan-600 dark:text-cyan-400' };
  }, [result]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 px-2 sm:px-4 text-slate-900 dark:text-slate-100">
      {/* Top Telemetry & Calibration Ribbon */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
            MONSHI-SCHERRER LOGARITHMIC ENGINE
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className={`font-semibold ${slopeRegime.tone}`}>
            {slopeRegime.label}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">
            REFLECTIONS: <strong className="text-slate-900 dark:text-white">{activeCount}/{totalCount}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-600 dark:text-slate-400">
            SOLVER: <strong className="text-cyan-600 dark:text-cyan-400">{regressionWeighting}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImportFromWorkspace}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-cyan-500/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-cyan-500/40 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore ({excludedIndices.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={!result}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-cyan-500/50 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLaTeX}
            disabled={!result}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
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
            className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-200 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs underline opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architectural Header & Governing Formulation */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Crystallographic Line Profile Analysis</span>
              <span aria-hidden="true">·</span>
              <span>Monshi et al. (2012) Logarithmic Linearization</span>
              <span aria-hidden="true">·</span>
              <span>Weighted &amp; Constrained Least Squares</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Monshi-Scherrer Logarithmic Scheme
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Classical single-peak Scherrer calculations suffer from systematic divergence as <span className="font-mono text-cyan-600 dark:text-cyan-400">cos θ → 0</span> at high Bragg angles. By taking the natural logarithm of the Scherrer relation, the Monshi-Scherrer transform equalizes reflection variance across all <span className="font-mono">{'{hkl}'}</span> planes, extracts consensus crystallite size <span className="font-mono text-cyan-600 dark:text-cyan-400">D = Kλ·exp(-C)</span> from the zero-angle intercept, and isolates microstrain or stacking-fault departures via the logarithmic slope <span className="font-mono text-cyan-600 dark:text-cyan-400">m</span>.
            </p>
          </div>

          <div className="lg:col-span-5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>GOVERNING LINEARIZATION</span>
              <span>Y = m·X + C</span>
            </div>
            <div
              className="py-2 px-3 bg-white dark:bg-[#070A12] rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto text-center text-slate-900 dark:text-slate-100"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\ln(\\beta_{hkl}) = m \\cdot \\ln\\!\\left(\\frac{1}{\\cos\\theta_{hkl}}\\right) + \\underbrace{\\ln\\!\\left(\\frac{K\\lambda}{D}\\right)}_{C}',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">UNCONSTRAINED SIZE (m FREE)</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">D = K·λ·exp(-C)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">CONSTRAINED SIZE (m = 1.0)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">D = (∏ D_hkl)^(1/N)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curated Reference Standards Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
            <FlaskConical className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>REFERENCE STANDARDS:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
            {MS_PRESETS.map((p) => {
              const isSelected = activePresetName === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">{p.tag}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asymmetric Split Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calibration, Broadening Physics & Interactive Peak Editor */}
        <div className="lg:col-span-5 space-y-6">
          {/* Instrument & Physical Calibration Card */}
          <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Instrument &amp; Regression Physics
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                λ = {convertLength(wavelength, lengthUnit).toFixed(4)} {lengthUnit} · K = {constantK}
              </span>
            </div>

            {/* Sub-tab Segmented Control */}
            <div className="flex p-1 bg-slate-100 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setPhysicsSubTab('setup')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  physicsSubTab === 'setup'
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Geometry &amp; K</span>
              </button>

              <button
                type="button"
                onClick={() => setPhysicsSubTab('profiles')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  physicsSubTab === 'profiles'
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Deconvolution</span>
              </button>

              <button
                type="button"
                onClick={() => setPhysicsSubTab('corrections')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  physicsSubTab === 'corrections'
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Solver &amp; Optics</span>
              </button>
            </div>

            {/* Subtab 1: Geometry & K */}
            {physicsSubTab === 'setup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    X-Ray Anode Wavelength (λ) [{lengthUnit}]
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-cyan-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-cyan-500 cursor-pointer"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-cyan-500"
                      placeholder={`Custom ${lengthUnit}`}
                    />
                  </div>
                </div>

                {/* Shape Factor K */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Scherrer Shape Constant (K)
                    </label>
                    <span className="text-xs font-mono tabular-nums text-cyan-600 dark:text-cyan-400 font-semibold">
                      K = {constantK}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 relative">
                      <button
                        type="button"
                        onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-left border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-cyan-500/50 transition-colors cursor-pointer"
                      >
                        <span className="truncate">{K_FACTORS.find(k => k.value === constantK)?.label || 'Custom Shape'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isKTypeMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 space-y-1 max-h-60 overflow-y-auto"
                          >
                            {K_FACTORS.map((k) => (
                              <button
                                key={k.label}
                                type="button"
                                onClick={() => {
                                  setConstantK(k.value);
                                  setIsKTypeMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors block cursor-pointer ${
                                  constantK === k.value
                                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{k.label}</span>
                                  <span className="tabular-nums text-cyan-600 dark:text-cyan-400">K = {k.value}</span>
                                </div>
                                <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">{k.desc}</div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="2.0"
                      value={constantK}
                      onChange={(e) => setConstantK(Math.max(0.1, parseFloat(e.target.value) || 0.9))}
                      className="px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Zero-Point Goniometer Shift Correction */}
                <div className="p-3.5 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Goniometer Zero-Shift (Δ2θ₀)
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
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
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Applies specimen displacement / zero-point correction: 2θ_corr = 2θ_obs + Δ2θ₀
                  </p>
                </div>
              </div>
            )}

            {/* Subtab 2: Deconvolution & Instrumental Profile */}
            {physicsSubTab === 'profiles' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Instrumental Function β_inst(2θ)
                    </label>
                    <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setInstrumentalMode('constant')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          instrumentalMode === 'constant'
                            ? 'bg-cyan-600 text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Constant
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          instrumentalMode === 'caglioti'
                            ? 'bg-cyan-600 text-white font-semibold'
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
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-cyan-500"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">°2θ FWHM</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 0.05, 0.08, 0.12].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setInstFwhm(val)}
                            className={`py-1.5 rounded-lg border text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                              instFwhm === val
                                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold'
                                : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {val === 0 ? '0° (Raw)' : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          FWHM² = U·tan²θ + V·tanθ + W
                        </span>
                        <div className="flex gap-1">
                          {[
                            { name: 'LaB6 SRM', u: 0.004, v: -0.0015, w: 0.006 },
                            { name: 'Lab Bragg', u: 0.005, v: -0.002, w: 0.015 },
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
                              className="px-2 py-0.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 hover:border-cyan-500 cursor-pointer"
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

                {/* Profile Deconvolution Model */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Intrinsic Line Profile Deconvolution
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Gaussian' as const, label: 'Gaussian (β² = βₒ² - βᵢ²)' },
                      { id: 'Lorentzian' as const, label: 'Lorentzian (β = βₒ - βᵢ)' },
                      { id: 'Pseudo-Voigt' as const, label: 'Pseudo-Voigt (η Linear Mix)' },
                      { id: 'Voigt' as const, label: 'Voigt (Olivero-Longbothum)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setBroadeningModel(m.id)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-mono transition-colors text-center cursor-pointer ${
                          broadeningModel === m.id
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold'
                            : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {broadeningModel === 'Pseudo-Voigt' && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Lorentzian Mixing Fraction (η):</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-mono tabular-nums font-bold">{pvEta.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={pvEta}
                        onChange={(e) => setPvEta(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtab 3: Solver Weighting & Optical Corrections */}
            {physicsSubTab === 'corrections' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Least-Squares Regression Weighting Scheme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'OLS' as const, label: 'Standard OLS', desc: 'Equal log weight' },
                      { id: 'WLS-CosTheta' as const, label: 'cos²θ WLS', desc: 'Low-2θ priority' },
                      { id: 'Huber-Robust' as const, label: 'Huber IRLS', desc: 'Outlier resistant' }
                    ].map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setRegressionWeighting(w.id)}
                        className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          regressionWeighting === w.id
                            ? 'bg-cyan-500/15 border-cyan-500 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-mono font-semibold">{w.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{w.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lorentz-Polarization (L-P) Factor Toggle */}
                <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        Lorentz-Polarization (L-P) Weighting
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Compensates breadth for diffractometer optical polarization
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyLPFactor(!applyLPFactor)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        applyLPFactor ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          applyLPFactor ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {applyLPFactor && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMonochromatorAngle(0)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono border cursor-pointer ${
                          monochromatorAngle === 0
                            ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500'
                            : 'bg-white dark:bg-[#0B0F19] text-slate-500 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Unpolarized (0°)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonochromatorAngle(26.4)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono border cursor-pointer ${
                          monochromatorAngle === 26.4
                            ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500'
                            : 'bg-white dark:bg-[#0B0F19] text-slate-500 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Graphite Mono (26.4°)
                      </button>
                    </div>
                  )}
                </div>

                {/* K-Alpha2 Doublet Wavelength Correction */}
                <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Rachinger Kα₂ Doublet Stripping
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Subtracts Cu Kα₁/Kα₂ spectral splitting at 2θ &gt; 30°
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      kAlpha2Correction ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        kAlpha2Correction ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dual-Mode Diffraction Peak Manager (Interactive Table vs Raw Batch Input) */}
          <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Diffraction Reflections ({parsedPeaks.length})
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputEditorMode('table')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                      inputEditorMode === 'table'
                        ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Table className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputEditorMode('raw')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                      inputEditorMode === 'raw'
                        ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Raw Text</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSortPeaksByAngle}
                  title="Sort by 2θ ascending"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] hover:border-cyan-500/50 text-slate-600 dark:text-slate-300 cursor-pointer"
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

            {inputEditorMode === 'table' ? (
              <div className="space-y-3">
                <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-2.5">Fit</th>
                        <th className="py-2 px-2">2θ (°)</th>
                        <th className="py-2 px-2">FWHM (°)</th>
                        <th className="py-2 px-2">hkl</th>
                        <th className="py-2 px-2 text-right">D_hkl</th>
                        <th className="py-2 px-2 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                      {parsedPeaks.map((peak, idx) => {
                        const isExcl = excludedIndices.includes(idx);
                        const ext = result?.pointsExtended?.find(pe => pe.index === idx);
                        return (
                          <tr
                            key={`peak-row-${idx}`}
                            className={`transition-colors ${
                              isExcl
                                ? 'opacity-45 bg-slate-100/50 dark:bg-slate-900/40'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-1.5 px-2.5">
                              <button
                                type="button"
                                onClick={() => handleTogglePeakExclusion(idx)}
                                className="text-cyan-600 dark:text-cyan-400 hover:opacity-80 cursor-pointer"
                                title={isExcl ? 'Include reflection in regression' : 'Exclude reflection from regression'}
                              >
                                {isExcl ? <Square className="w-4 h-4 text-slate-400" /> : <CheckSquare className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                step="0.01"
                                value={peak.twoTheta}
                                onChange={(e) => handleUpdatePeakRow(idx, 'twoTheta', e.target.value)}
                                className="w-18 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tabular-nums"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                step="0.005"
                                value={peak.fwhmObs}
                                onChange={(e) => handleUpdatePeakRow(idx, 'fwhmObs', e.target.value)}
                                className="w-18 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tabular-nums"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={peak.hkl ? peak.hkl.join('') : ''}
                                placeholder="hkl"
                                onChange={(e) => handleUpdatePeakRow(idx, 'hkl', e.target.value)}
                                className="w-14 px-1.5 py-1 rounded bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 text-xs font-mono"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {ext ? `${ext.singlePeakSizeNm.toFixed(1)} nm` : '—'}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePeakRow(idx)}
                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete reflection"
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
                <div className="p-2.5 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2θ (°)"
                    value={newPeakTwoTheta}
                    onChange={(e) => setNewPeakTwoTheta(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="number"
                    step="0.005"
                    placeholder="FWHM (°)"
                    value={newPeakFwhm}
                    onChange={(e) => setNewPeakFwhm(e.target.value)}
                    className="w-22 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="hkl (e.g. 111)"
                    value={newPeakHkl}
                    onChange={(e) => setNewPeakHkl(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPeakRow}
                    className="ml-auto px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Peak</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format per line: <code className="font-mono text-cyan-600 dark:text-cyan-400">2θ [deg], FWHM [deg], h, k, l</code>
                </p>
                <textarea
                  value={inputData}
                  onChange={(e) => {
                    setExcludedIndices([]);
                    setInputData(e.target.value);
                  }}
                  rows={8}
                  spellCheck={false}
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#111827] text-slate-900 dark:text-cyan-300 font-mono text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-500 dark:text-slate-400">
              <span>
                Active Fit Reflections: <strong className="text-slate-900 dark:text-white tabular-nums">{activeCount}</strong> / {totalCount}
              </span>
              {activeCount >= 2 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ● Regression Converged
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  ▲ Need ≥ 2 Reflections
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Precision Telemetry Strip, Multi-Tab Visualizers & Diagnostic Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* 4-Card Precision Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1: Monshi-Scherrer Size D */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>MONSHI SIZE (D)</span>
                    <Ruler className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {convertLength(result.sizeNm * 10, lengthUnit).toFixed(2)}
                    </span>
                    <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
                      {lengthUnit}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Std Error (±ΔD):</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        ±{convertLength((result.sizeUncertaintyNm || 0) * 10, lengthUnit).toFixed(2)} {lengthUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fixed (m=1) D:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {convertLength((result.constrainedSizeNm || result.sizeNm) * 10, lengthUnit).toFixed(2)} {lengthUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Logarithmic Slope m */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>LOG SLOPE (m)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {result.slope.toFixed(4)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 ml-1.5 tabular-nums">
                      ±{(result.slopeStdErr || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Offset (m - 1):</span>
                      <span className={result.slope - 1 >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}>
                        {result.slope - 1 >= 0 ? `+${(result.slope - 1).toFixed(4)}` : (result.slope - 1).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intercept C:</span>
                      <span className="text-slate-800 dark:text-slate-200">{result.intercept.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Fit Quality R^2 & RMSE */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>FIT QUALITY (R²)</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {(result.rSquared * 100).toFixed(2)}
                    </span>
                    <span className="text-xs uppercase font-mono text-slate-400 ml-1">
                      %
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Pearson r:</span>
                      <span className="text-slate-800 dark:text-slate-200">{(result.pearsonR || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Log RMSE:</span>
                      <span className="text-slate-800 dark:text-slate-200">{(result.rmse || 0).toFixed(5)}</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Dislocation Density & Strain */}
                <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>DISLOCATION (ρ)</span>
                    <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="my-2 flex items-baseline">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {((result.dislocationDensityM2 || 0) / 1e15).toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 ml-1.5">
                      ×10¹⁵ m⁻²
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Monshi ⟨ε⟩:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {((result.estimatedStrain || 0) * 100).toFixed(4)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>W-H Strain ε:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {((result.whStrain || 0) * 100).toFixed(4)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Visualization Stage */}
              <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                {/* Visualization Mode Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'logPlot' as const, label: '01. Log Regression & CI' },
                      { id: 'comparison' as const, label: '02. Multi-Method Benchmark' },
                      { id: 'residuals' as const, label: '03. Residuals & Outliers' },
                      { id: 'deconvolution' as const, label: '04. Broadening Profile' },
                      { id: 'spectrum' as const, label: '05. Anisotropy & ρ_hkl' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab 1: Logarithmic Regression Plot with 95% Confidence Band */}
                {activeTab === 'logPlot' && chartData && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="text-slate-600 dark:text-slate-300 tabular-nums">
                        Fit: <strong className="text-cyan-600 dark:text-cyan-400">ln(β) = {result.slope.toFixed(4)}·ln(1/cosθ) + ({result.intercept.toFixed(4)})</strong>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={showConfidenceBand}
                            onChange={(e) => setShowConfidenceBand(e.target.checked)}
                            className="accent-cyan-500 rounded"
                          />
                          <span>95% CI Band</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={showConstrainedLine}
                            onChange={(e) => setShowConstrainedLine(e.target.checked)}
                            className="accent-emerald-500 rounded"
                          />
                          <span>Ideal Slope (m = 1.0)</span>
                        </label>
                      </div>
                    </div>

                    <div className="h-80 sm:h-96 w-full bg-slate-50/60 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800/80 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={chartData.regressionBand}
                          margin={{ top: 15, right: 25, bottom: 25, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            domain={[chartData.startX, chartData.endX]}
                            tickFormatter={(v) => Number(v).toFixed(3)}
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'X = ln(1 / cos θ)',
                              position: 'insideBottom',
                              offset: -15,
                              fill: '#06b6d4',
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <YAxis
                            type="number"
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => Number(v).toFixed(2)}
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Y = ln(β_sample [rad])',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: '#06b6d4',
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
                                    <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl shadow-xl font-mono text-xs space-y-1 tabular-nums">
                                      <div className="text-cyan-400 font-bold border-b border-slate-700 pb-1">
                                        Reflection {pt.hkl} · 2θ = {pt.twoTheta.toFixed(2)}°
                                      </div>
                                      <div>X = ln(1/cosθ): <span className="text-cyan-300">{pt.x.toFixed(5)}</span></div>
                                      <div>Y = ln(β_sample): <span className="text-cyan-300 font-bold">{pt.y.toFixed(5)}</span></div>
                                      <div>Fitted Ŷ: <span className="text-slate-300">{pt.fittedY?.toFixed(5)}</span></div>
                                      <div>Single-Peak D: <span className="text-emerald-400 font-bold">{pt.singleSize?.toFixed(2)} nm</span></div>
                                      <div>Std Residual z: <span className={Math.abs(pt.stdResidual || 0) > 2 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{pt.stdResidual?.toFixed(3)}</span></div>
                                      <div className="text-[10px] text-slate-400 pt-1">Click point in table to toggle inclusion</div>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="bg-slate-900 text-white border border-slate-700 p-2.5 rounded-xl font-mono text-xs space-y-1 tabular-nums">
                                    <div className="text-cyan-400">X = {Number(pt.x).toFixed(4)}</div>
                                    <div>Fit Ŷ = {Number(pt.fitY).toFixed(4)}</div>
                                    {showConfidenceBand && (
                                      <div className="text-slate-400">95% CI: [{Number(pt.ciLower).toFixed(4)}, {Number(pt.ciUpper).toFixed(4)}]</div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                          {showConfidenceBand && (
                            <Area
                              type="monotone"
                              dataKey="ciRange"
                              name="95% Confidence Band"
                              stroke="none"
                              fill="#06b6d4"
                              fillOpacity={0.14}
                            />
                          )}

                          <Line
                            type="linear"
                            dataKey="fitY"
                            name={`Free-Slope Fit (m = ${result.slope.toFixed(3)})`}
                            stroke="#06b6d4"
                            strokeWidth={2.5}
                            dot={false}
                          />

                          {showConstrainedLine && (
                            <Line
                              type="linear"
                              dataKey="constrainedY"
                              name={`Constrained Fit (m = 1.0, D = ${(result.constrainedSizeNm || result.sizeNm).toFixed(1)} nm)`}
                              stroke="#10b981"
                              strokeWidth={1.8}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                          )}

                          <Scatter
                            data={chartData.activeScatter}
                            dataKey="y"
                            name="Active Reflections"
                            fill="#06b6d4"
                            stroke="#0e7490"
                            strokeWidth={2}
                            onClick={(data: any) => {
                              if (data && typeof data.index === 'number') {
                                handleTogglePeakExclusion(data.index);
                              }
                            }}
                            cursor="pointer"
                          />

                          {chartData.excludedScatter.length > 0 && (
                            <Scatter
                              data={chartData.excludedScatter}
                              dataKey="y"
                              name="Excluded Reflections"
                              fill="#f59e0b"
                              stroke="#b45309"
                              strokeWidth={1.5}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 mr-2">DIAGNOSTIC INTERPRETATION:</span>
                      {result.slopeInterpretation}
                    </div>
                  </div>
                )}

                {/* Tab 2: Multi-Method Benchmark Comparison */}
                {activeTab === 'comparison' && (
                  <div className="space-y-5">
                    {/* 5-Method Benchmark Table */}
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left font-mono text-xs tabular-nums">
                        <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Method Formulation</th>
                            <th className="py-2.5 px-3">Linearized Relation</th>
                            <th className="py-2.5 px-3 text-right">Size D (nm)</th>
                            <th className="py-2.5 px-3 text-right">±ΔD (nm)</th>
                            <th className="py-2.5 px-3 text-right">Strain ⟨ε⟩</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {(result.methodBenchmarks || []).map((bm) => (
                            <tr
                              key={bm.methodId}
                              className={
                                bm.methodId === 'monshi_free'
                                  ? 'bg-cyan-500/10 font-semibold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }
                            >
                              <td className="py-2.5 px-3 text-slate-900 dark:text-white">
                                {bm.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {bm.formula}
                              </td>
                              <td className="py-2.5 px-3 text-right text-cyan-600 dark:text-cyan-400 font-bold">
                                {bm.sizeNm.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                                ±{bm.uncertaintyNm.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">
                                {bm.strain !== undefined ? `${(bm.strain * 100).toFixed(4)}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Reflection-by-Reflection vs Consensus Size Plot */}
                    <div className="h-72 sm:h-80 w-full bg-slate-50/60 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800/80 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={singlePeakComparisonData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                          <XAxis
                            dataKey="hkl"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          />
                          <YAxis
                            type="number"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Crystallite Size D [nm]',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: '#06b6d4',
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl font-mono text-xs space-y-1 tabular-nums">
                                    <div className="text-cyan-400 font-bold border-b border-slate-700 pb-1">
                                      {d.hkl} (2θ = {d.twoTheta.toFixed(2)}°)
                                    </div>
                                    <div>Single-Peak D_hkl: <span className="font-bold text-white">{d.singleSize.toFixed(2)} nm</span></div>
                                    <div>Monshi Free-Slope D: <span className="text-cyan-400 font-bold">{d.monshiSize.toFixed(2)} nm</span></div>
                                    <div>Monshi Fixed (m=1) D: <span className="text-emerald-400 font-bold">{d.constrainedSize.toFixed(2)} nm</span></div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine
                            y={result.sizeNm}
                            stroke="#06b6d4"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            label={{ value: `Monshi D = ${result.sizeNm.toFixed(2)} nm`, fill: '#06b6d4', fontSize: 11, position: 'top' }}
                          />
                          <ReferenceLine
                            y={result.constrainedSizeNm || result.sizeNm}
                            stroke="#10b981"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            label={{ value: `m=1 D = ${(result.constrainedSizeNm || result.sizeNm).toFixed(2)} nm`, fill: '#10b981', fontSize: 11, position: 'bottom' }}
                          />
                          <Bar dataKey="singleSize" name="Single-Peak Scherrer D_hkl [nm]" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={42} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 3: Standardized Residuals & Leverage Diagnostics */}
                {activeTab === 'residuals' && chartData && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        Outlier threshold: <strong className="text-amber-600 dark:text-amber-400">|z_i| &gt; 2.0</strong> (95% Gaussian residual interval)
                      </span>
                      <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setResidualPlotMode('standardized')}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${
                            residualPlotMode === 'standardized'
                              ? 'bg-cyan-600 text-white font-semibold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Standardized (z_i)
                        </button>
                        <button
                          type="button"
                          onClick={() => setResidualPlotMode('raw')}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${
                            residualPlotMode === 'raw'
                              ? 'bg-cyan-600 text-white font-semibold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Raw ΔY = ln(β) - Ŷ
                        </button>
                      </div>
                    </div>

                    <div className="h-72 sm:h-80 w-full bg-slate-50/60 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800/80 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.activeScatter} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                          <XAxis
                            dataKey="hkl"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          />
                          <YAxis
                            type="number"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: residualPlotMode === 'standardized' ? 'Standardized Residual z_i' : 'Raw Log Residual ΔY',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: '#06b6d4',
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl font-mono text-xs space-y-1 tabular-nums">
                                    <div className="text-cyan-400 font-bold border-b border-slate-700 pb-1">
                                      Reflection {d.hkl} (2θ = {d.twoTheta.toFixed(2)}°)
                                    </div>
                                    <div>Raw ΔY: <span className="text-white">{d.residual?.toFixed(5)}</span></div>
                                    <div>Std Residual z_i: <span className={d.isOutlier ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{d.stdResidual?.toFixed(3)}</span></div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                          {residualPlotMode === 'standardized' && (
                            <>
                              <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '+2σ Outlier', fill: '#f59e0b', fontSize: 10 }} />
                              <ReferenceLine y={-2.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '-2σ Outlier', fill: '#f59e0b', fontSize: 10 }} />
                            </>
                          )}
                          <Bar
                            dataKey={residualPlotMode === 'standardized' ? 'stdResidual' : 'residual'}
                            name={residualPlotMode === 'standardized' ? 'Standardized Residual z_i' : 'Log Residual ΔY'}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={44}
                          >
                            {chartData.activeScatter.map((entry, idx) => (
                              <Cell
                                key={`res-cell-${idx}`}
                                fill={entry.isOutlier ? '#f59e0b' : (entry.residual || 0) >= 0 ? '#06b6d4' : '#3b82f6'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 4: Broadening Deconvolution Profile across 2Theta */}
                {activeTab === 'deconvolution' && chartData && (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      Comparison of Observed Breadth <strong className="text-slate-900 dark:text-white">FWHM_obs</strong>, Instrumental Baseline <strong className="text-amber-600 dark:text-amber-400">FWHM_inst</strong>, and Intrinsic Sample Broadening <strong className="text-cyan-600 dark:text-cyan-400">β_sample (°2θ)</strong>
                    </div>

                    <div className="h-72 sm:h-80 w-full bg-slate-50/60 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800/80 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData.allPoints} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                          <XAxis
                            dataKey="hkl"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          />
                          <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Line Breadth [°2θ]',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: '#06b6d4',
                              fontSize: 12,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl font-mono text-xs space-y-1 tabular-nums">
                                    <div className="text-cyan-400 font-bold border-b border-slate-700 pb-1">
                                      {d.hkl} · 2θ = {d.twoTheta.toFixed(2)}°
                                    </div>
                                    <div>Observed FWHM_obs: <span className="text-white font-bold">{d.fwhmObs.toFixed(4)}°</span></div>
                                    <div>Instrumental FWHM_inst: <span className="text-amber-400">{d.fwhmInst.toFixed(4)}° ({d.instFractionPct.toFixed(1)}%)</span></div>
                                    <div>Sample β_sample: <span className="text-cyan-400 font-bold">{d.betaCorrectedDeg.toFixed(4)}°</span></div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <Bar dataKey="fwhmObs" name="Observed FWHM_obs (°)" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="betaCorrectedDeg" name="Deconvolved β_sample (°)" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          <Line type="monotone" dataKey="fwhmInst" name="Instrumental Baseline (°)" stroke="#f59e0b" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab 5: Anisotropic Size & Dislocation Density Spectrum */}
                {activeTab === 'spectrum' && singlePeakComparisonData && (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      Crystallographic directional domain size <strong className="text-emerald-600 dark:text-emerald-400">D_hkl [nm]</strong> and local dislocation density <strong className="text-amber-600 dark:text-amber-400">ρ_hkl = 1/D_hkl² [×10¹⁵ m⁻²]</strong>
                    </div>

                    <div className="h-72 sm:h-80 w-full bg-slate-50/60 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-slate-800/80 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={singlePeakComparisonData} margin={{ top: 15, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                          <XAxis
                            dataKey="hkl"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#10b981"
                            tick={{ fill: '#10b981', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'Domain Size D_hkl [nm]',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -5,
                              fill: '#10b981',
                              fontSize: 11,
                              fontFamily: 'monospace'
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#f59e0b"
                            tick={{ fill: '#f59e0b', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: 'ρ_hkl [×10¹⁵ m⁻²]',
                              angle: 90,
                              position: 'insideRight',
                              offset: -5,
                              fill: '#f59e0b',
                              fontSize: 11,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl font-mono text-xs space-y-1 tabular-nums">
                                    <div className="text-emerald-400 font-bold border-b border-slate-700 pb-1">
                                      {d.hkl} (2θ = {d.twoTheta.toFixed(2)}°)
                                    </div>
                                    <div>Domain Size D_hkl: <span className="text-emerald-400 font-bold">{d.singleSize.toFixed(2)} nm</span></div>
                                    <div>Dislocation ρ_hkl: <span className="text-amber-400 font-bold">{d.dislocationDensitye15.toFixed(3)} ×10¹⁵ m⁻²</span></div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                          <ReferenceLine yAxisId="left" y={result.sizeNm} stroke="#10b981" strokeDasharray="4 4" />
                          <Bar yAxisId="left" dataKey="singleSize" name="Domain Size D_hkl (nm)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
                          <Line yAxisId="right" type="monotone" dataKey="dislocationDensitye15" name="Dislocation Density ρ_hkl (×10¹⁵ m⁻²)" stroke="#f59e0b" strokeWidth={2.5} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Extended Reflections Deconvolution & Diagnostic Matrix */}
              <div className="bg-white dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Reflections Deconvolution &amp; Residual Diagnostic Matrix</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Click any row checkbox to include/exclude from live regression
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead className="bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Use</th>
                        <th className="py-2.5 px-3">2θ (°)</th>
                        <th className="py-2.5 px-3">hkl</th>
                        <th className="py-2.5 px-3">d (Å)</th>
                        <th className="py-2.5 px-3">FWHM_obs</th>
                        <th className="py-2.5 px-3">β_sample (rad)</th>
                        <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">X = ln(1/cosθ)</th>
                        <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">Y = ln(β)</th>
                        <th className="py-2.5 px-3">z-Score</th>
                        <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">D_hkl (nm)</th>
                        <th className="py-2.5 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {result.pointsExtended.map((p, idx) => {
                        const rowIndex = p.index !== undefined ? p.index : idx;
                        return (
                          <tr
                            key={`ext-row-${rowIndex}-${p.twoTheta}`}
                            className={`transition-colors ${
                              p.excluded
                                ? 'opacity-45 bg-slate-100/50 dark:bg-slate-900/40'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2 px-3">
                              <button
                                type="button"
                                onClick={() => handleTogglePeakExclusion(rowIndex)}
                                className="text-cyan-600 dark:text-cyan-400 cursor-pointer"
                              >
                                {p.excluded ? <Square className="w-4 h-4 text-slate-400" /> : <CheckSquare className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{p.twoTheta.toFixed(2)}</td>
                            <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-semibold">{p.hkl ? `(${p.hkl.join('')})` : '—'}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{(p.dSpacingAngstrom || 0).toFixed(3)}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{p.fwhmObs.toFixed(3)}°</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{p.betaCorrectedRad.toExponential(3)}</td>
                            <td className="py-2 px-3 font-semibold text-cyan-700 dark:text-cyan-300">{p.x.toFixed(4)}</td>
                            <td className="py-2 px-3 font-semibold text-cyan-700 dark:text-cyan-300">{p.y.toFixed(4)}</td>
                            <td className="py-2 px-3">
                              <span className={p.isOutlier ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                                {(p.standardizedResidual || 0) >= 0 ? `+${(p.standardizedResidual || 0).toFixed(2)}` : (p.standardizedResidual || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">{p.singlePeakSizeNm.toFixed(2)}</td>
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

              {/* Interactive Mathematical Explorer, AI Interpretation & Python Script Exporter */}
              <div className="space-y-4">
                <ScientificMathControl
                  title="Monshi-Scherrer Logarithmic Transformation"
                  formula="\ln(\beta) = m \cdot \ln\left(\frac{1}{\cos\theta}\right) + \ln\left(\frac{K \lambda}{D}\right)"
                  description="Logarithmic linear regression across multiple reflections. The intercept C yields the zero-angle crystallite size D = Kλ·exp(-C), while the slope m diagnoses strain and planar faults."
                  variables={[
                    { symbol: 'm', name: 'Regression Slope (m)', value: result.slope, unit: '' },
                    { symbol: 'C', name: 'Log Intercept (C)', value: result.intercept, unit: '' },
                    { symbol: 'R²', name: 'Linear Fit Quality', value: result.rSquared, unit: '' },
                    { symbol: 'K', name: 'Shape Factor', value: constantK, unit: '' },
                    { symbol: 'λ', name: 'Wavelength', value: wavelength, unit: lengthUnit }
                  ]}
                  result={result.sizeNm}
                  resultUnit="nm"
                  resultName="Crystallite Grain Size (D)"
                />

                <AIAnalysis methodName="Monshi-Scherrer Logarithmic Scheme" resultData={result} />

                <PythonCodeExporter
                  methodName="Monshi-Scherrer Scheme"
                  parameters={{
                    wavelength: Number(wavelength),
                    twoTheta: result.pointsExtended.filter(p => !p.excluded).map(p => p.twoTheta),
                    beta: result.pointsExtended.filter(p => !p.excluded).map(p => p.fwhmObs),
                    shapeFactor: Number(constantK),
                    x: result.pointsExtended.filter(p => !p.excluded).map(p => p.x),
                    y: result.pointsExtended.filter(p => !p.excluded).map(p => p.y)
                  }}
                />
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#0B0F19] p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Minimum 2 Active Diffraction Reflections Required
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Add at least two reflections with valid 2θ and FWHM values (where FWHM_obs exceeds instrumental broadening) or select one of the Reference Standards above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
