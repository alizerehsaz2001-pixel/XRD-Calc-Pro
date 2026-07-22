import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Grid, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Info, 
  Cpu, 
  Database,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  FileText,
  X,
  Edit3,
  Tag,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { ScientificMathControl } from './ScientificMathControl';

type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic' | 'Monoclinic';
type DriftFunctionType = 'nelson_riley' | 'bradley_jay' | 'sample_displacement' | 'hess_hagg' | 'zero_shift';

interface PeakInput {
  id: string;
  twoTheta: number;
  h: number;
  k: number;
  l: number;
  intensity?: number;
}

interface PresetSample {
  name: string;
  system: CrystalSystem;
  refLattice?: { a?: number; b?: number; c?: number };
  wavelength: number;
  peaks: PeakInput[];
}

interface CohenRefinementModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string | null;
}

// ----------------------------------------------------
// Helper: Scientific Exponent & Superscript Formatter
// ----------------------------------------------------
const FormatSci: React.FC<{ val: number; digits?: number; className?: string }> = ({ val, digits = 3, className = '' }) => {
  if (val === undefined || val === null || isNaN(val)) return <span className="font-mono text-slate-400">-</span>;
  if (val === 0) return <span className={`font-mono ${className}`}>0</span>;
  
  // Standard decimal representation for moderate numbers
  if (Math.abs(val) >= 0.001 && Math.abs(val) < 10000) {
    return <span className={`font-mono ${className}`}>{val.toFixed(digits)}</span>;
  }
  
  const expStr = val.toExponential(digits);
  const [mantissa, exponent] = expStr.split('e');
  const expNum = parseInt(exponent, 10);
  
  return (
    <span className={`inline-flex items-baseline gap-0.5 font-mono tracking-tight ${className}`}>
      <span>{mantissa}</span>
      <span className="text-slate-400 dark:text-slate-500 text-[0.85em] mx-0.5">×10</span>
      <sup className="text-[0.75em] font-black text-indigo-400 dark:text-indigo-300">{expNum}</sup>
    </span>
  );
};

// ----------------------------------------------------
// Helper: Matrix Display with Authentic Linear Algebra Brackets & Headers
// ----------------------------------------------------
const MatrixBox: React.FC<{
  title: string;
  matrix: number[][];
  accentColor?: 'indigo' | 'emerald' | 'amber';
  labels?: string[];
}> = ({ title, matrix, accentColor = 'indigo', labels }) => {
  const accentClasses = {
    indigo: {
      title: 'text-indigo-400',
      diag: 'text-indigo-300 bg-indigo-500/10 font-black border border-indigo-500/20',
      val: 'text-indigo-200/90'
    },
    emerald: {
      title: 'text-emerald-400',
      diag: 'text-emerald-300 bg-emerald-500/10 font-black border border-emerald-500/20',
      val: 'text-emerald-200/90'
    },
    amber: {
      title: 'text-amber-400',
      diag: 'text-amber-300 bg-amber-500/10 font-black border border-amber-500/20',
      val: 'text-amber-200/90'
    }
  }[accentColor];

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest font-black flex items-center justify-between">
        <span className={accentClasses.title}>{title}</span>
        <span className="text-slate-500 font-mono text-[9px]">{matrix.length}×{matrix[0]?.length || 0}</span>
      </div>

      <div className="relative p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-center overflow-x-auto">
        {/* Left Matrix Bracket */}
        <div className="w-2 border-l-2 border-t-2 border-b-2 border-slate-500/60 rounded-l self-stretch my-0.5 shrink-0" />

        {/* Matrix Grid */}
        <div className="overflow-x-auto px-2 py-1 my-0.5">
          <table className="border-collapse text-center">
            {labels && labels.length === matrix[0]?.length && (
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {labels.map((lbl, idx) => (
                    <th key={idx} className="px-2 py-1 text-[9px] font-mono text-slate-400 font-bold border-b border-slate-800">
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {matrix.map((row, rIdx) => (
                <tr key={rIdx}>
                  {labels && labels[rIdx] && (
                    <td className="px-2 py-1 text-[9px] font-mono text-slate-400 font-bold text-right border-r border-slate-800 whitespace-nowrap">
                      {labels[rIdx]}
                    </td>
                  )}
                  {row.map((val, cIdx) => {
                    const isDiagonal = rIdx === cIdx;
                    return (
                      <td
                        key={cIdx}
                        title={`Element [Row ${rIdx+1}, Col ${cIdx+1}]: ${val}`}
                        className={`px-3 py-2 text-xs transition-colors rounded-sm ${
                          isDiagonal ? accentClasses.diag : accentClasses.val
                        }`}
                      >
                        <FormatSci val={val} digits={3} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Matrix Bracket */}
        <div className="w-2 border-r-2 border-t-2 border-b-2 border-slate-500/60 rounded-r self-stretch my-0.5 shrink-0" />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Linear Algebra Solver: Gaussian Elimination with Pivoting
// ----------------------------------------------------
function solveLinearSystem(M: number[][], Y: number[]): { X: number[]; M_inv: number[][] } | null {
  const n = M.length;
  // Create augmented matrix [M | I | Y]
  const aug: number[][] = Array.from({ length: n }, (_, i) => [
    ...M[i],
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    Y[i]
  ]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    if (Math.abs(aug[maxRow][col]) < 1e-12) {
      return null; // Singular matrix
    }
    // Swap rows
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Normalize pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n + 1; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n + 1; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  const X = aug.map(row => row[2 * n]);
  const M_inv = aug.map(row => row.slice(n, 2 * n));

  return { X, M_inv };
}

// ----------------------------------------------------
// Drift Function Calculation
// ----------------------------------------------------
function calculateDrift(twoThetaDeg: number, type: DriftFunctionType): number {
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;

  const cosTh = Math.cos(thetaRad);
  const sinTh = Math.sin(thetaRad);

  switch (type) {
    case 'nelson_riley': {
      // f(theta) = 0.5 * ( (cos^2 theta / sin theta) + (cos^2 theta / theta) )
      const term1 = (cosTh * cosTh) / sinTh;
      const term2 = (cosTh * cosTh) / thetaRad;
      return 0.5 * (term1 + term2);
    }
    case 'bradley_jay':
      return cosTh * cosTh;
    case 'sample_displacement':
      return cosTh * cosTh * sinTh;
    case 'hess_hagg':
      return Math.sin(2 * thetaRad) * Math.sin(2 * thetaRad);
    case 'zero_shift':
      return cosTh;
    default:
      return 0.5 * ((cosTh * cosTh) / sinTh + (cosTh * cosTh) / thetaRad);
  }
}

// Preset Materials Database for Cohen's Method
const PRESET_SAMPLES = [
  {
    name: 'Silicon (NIST SRM 640e)',
    system: 'Cubic' as CrystalSystem,
    refLattice: { a: 5.43119 },
    wavelength: 1.54056,
    peaks: [
      { id: '1', twoTheta: 28.442, h: 1, k: 1, l: 1, intensity: 100 },
      { id: '2', twoTheta: 47.302, h: 2, k: 2, l: 0, intensity: 55 },
      { id: '3', twoTheta: 56.121, h: 3, k: 1, l: 1, intensity: 30 },
      { id: '4', twoTheta: 69.130, h: 4, k: 0, l: 0, intensity: 6 },
      { id: '5', twoTheta: 76.377, h: 3, k: 3, l: 1, intensity: 11 },
      { id: '6', twoTheta: 88.031, h: 4, k: 2, l: 2, intensity: 12 },
      { id: '7', twoTheta: 94.953, h: 5, k: 1, l: 1, intensity: 6 },
      { id: '8', twoTheta: 106.709, h: 4, k: 4, l: 0, intensity: 3 },
      { id: '9', twoTheta: 114.093, h: 5, k: 3, l: 1, intensity: 7 },
      { id: '10', twoTheta: 127.546, h: 6, k: 2, l: 0, intensity: 8 },
      { id: '11', twoTheta: 136.895, h: 5, k: 3, l: 3, intensity: 3 }
    ]
  },
  {
    name: 'Cerium Dioxide (CeO2 - Fluorite)',
    system: 'Cubic' as CrystalSystem,
    refLattice: { a: 5.41110 },
    wavelength: 1.54056,
    peaks: [
      { id: '1', twoTheta: 28.553, h: 1, k: 1, l: 1, intensity: 100 },
      { id: '2', twoTheta: 33.082, h: 2, k: 0, l: 0, intensity: 28 },
      { id: '3', twoTheta: 47.483, h: 2, k: 2, l: 0, intensity: 52 },
      { id: '4', twoTheta: 56.342, h: 3, k: 1, l: 1, intensity: 44 },
      { id: '5', twoTheta: 59.088, h: 2, k: 2, l: 2, intensity: 5 },
      { id: '6', twoTheta: 69.406, h: 4, k: 0, l: 0, intensity: 7 },
      { id: '7', twoTheta: 76.701, h: 3, k: 3, l: 1, intensity: 14 },
      { id: '8', twoTheta: 79.070, h: 4, k: 2, l: 0, intensity: 12 },
      { id: '9', twoTheta: 88.423, h: 4, k: 2, l: 2, intensity: 10 }
    ]
  },
  {
    name: 'Rutile Titanium Dioxide (TiO2)',
    system: 'Tetragonal' as CrystalSystem,
    refLattice: { a: 4.5937, c: 2.9587 },
    wavelength: 1.54056,
    peaks: [
      { id: '1', twoTheta: 27.446, h: 1, k: 1, l: 0, intensity: 100 },
      { id: '2', twoTheta: 36.085, h: 1, k: 0, l: 1, intensity: 50 },
      { id: '3', twoTheta: 39.187, h: 2, k: 0, l: 0, intensity: 8 },
      { id: '4', twoTheta: 41.225, h: 1, k: 1, l: 1, intensity: 25 },
      { id: '5', twoTheta: 54.322, h: 2, k: 1, l: 1, intensity: 60 },
      { id: '6', twoTheta: 56.640, h: 2, k: 2, l: 0, intensity: 20 },
      { id: '7', twoTheta: 62.740, h: 0, k: 0, l: 2, intensity: 10 },
      { id: '8', twoTheta: 64.038, h: 3, k: 1, l: 0, intensity: 10 },
      { id: '9', twoTheta: 69.010, h: 3, k: 0, l: 1, intensity: 20 },
      { id: '10', twoTheta: 69.789, h: 1, k: 1, l: 2, intensity: 12 }
    ]
  },
  {
    name: 'Zinc Oxide (ZnO Wurtzite)',
    system: 'Hexagonal' as CrystalSystem,
    refLattice: { a: 3.2498, c: 5.2066 },
    wavelength: 1.54056,
    peaks: [
      { id: '1', twoTheta: 31.770, h: 1, k: 0, l: 0, intensity: 57 },
      { id: '2', twoTheta: 34.422, h: 0, k: 0, l: 2, intensity: 44 },
      { id: '3', twoTheta: 36.253, h: 1, k: 0, l: 1, intensity: 100 },
      { id: '4', twoTheta: 47.538, h: 1, k: 0, l: 2, intensity: 23 },
      { id: '5', twoTheta: 56.603, h: 1, k: 1, l: 0, intensity: 32 },
      { id: '6', twoTheta: 62.862, h: 1, k: 0, l: 3, intensity: 29 },
      { id: '7', twoTheta: 66.380, h: 2, k: 0, l: 0, intensity: 4 },
      { id: '8', twoTheta: 67.963, h: 1, k: 1, l: 2, intensity: 23 },
      { id: '9', twoTheta: 69.100, h: 2, k: 0, l: 1, intensity: 11 },
      { id: '10', twoTheta: 72.561, h: 0, k: 0, l: 4, intensity: 2 }
    ]
  },
  {
    name: 'YBCO High-Tc Superconductor (YBa2Cu3O7)',
    system: 'Orthorhombic' as CrystalSystem,
    refLattice: { a: 3.822, b: 3.891, c: 11.681 },
    wavelength: 1.54056,
    peaks: [
      { id: '1', twoTheta: 22.82, h: 0, k: 0, l: 3, intensity: 15 },
      { id: '2', twoTheta: 27.88, h: 1, k: 0, l: 2, intensity: 20 },
      { id: '3', twoTheta: 32.51, h: 1, k: 0, l: 3, intensity: 100 },
      { id: '4', twoTheta: 32.84, h: 0, k: 1, l: 3, intensity: 85 },
      { id: '5', twoTheta: 38.51, h: 1, k: 0, l: 4, intensity: 25 },
      { id: '6', twoTheta: 46.54, h: 2, k: 0, l: 0, intensity: 35 },
      { id: '7', twoTheta: 47.47, h: 0, k: 2, l: 0, intensity: 35 },
      { id: '8', twoTheta: 58.12, h: 2, k: 1, l: 3, intensity: 30 },
      { id: '9', twoTheta: 68.32, h: 2, k: 2, l: 0, intensity: 15 }
    ]
  }
];

export const CohenRefinementModule: React.FC<CohenRefinementModuleProps> = ({
  activeResults = [],
  activeMaterialName = null
}) => {
  const { t } = useTranslation();
  const { precision } = useSettings();

  // State
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [driftType, setDriftType] = useState<DriftFunctionType>('nelson_riley');
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);

  // Peak Inputs
  const [peaks, setPeaks] = useState<PeakInput[]>(() => PRESET_SAMPLES[0].peaks);
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_SAMPLES[0].name);

  // Manual New Peak Creation State
  const [newH, setNewH] = useState<number>(1);
  const [newK, setNewK] = useState<number>(1);
  const [newL, setNewL] = useState<number>(1);
  const [newTwoTheta, setNewTwoTheta] = useState<string>('30.00');
  const [newIntensity, setNewIntensity] = useState<number>(100);  // Notifications and Modal
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  // Saved Custom Presets
  const [customPresets, setCustomPresets] = useState<PresetSample[]>([]);

  // Comprehensive Import & Custom Configuration Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importSampleName, setImportSampleName] = useState<string>('');
  const [importCrystalSystem, setImportCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [importDriftType, setImportDriftType] = useState<DriftFunctionType>('nelson_riley');
  const [importWavelength, setImportWavelength] = useState<number>(1.54056);
  const [importPeaks, setImportPeaks] = useState<PeakInput[]>([]);

  // Derivation Breakdown Controls
  const [showMatrixDerivation, setShowMatrixDerivation] = useState<boolean>(true);
  const [showPeakTermTable, setShowPeakTermTable] = useState<boolean>(false);

  const matrixLabels = useMemo(() => {
    if (crystalSystem === 'Cubic') return ['g₀ (h²+k²+l²)', 'g₁ f(θ)'];
    if (crystalSystem === 'Tetragonal') return ['g₀ (h²+k²)', 'g₁ (l²)', 'g₂ f(θ)'];
    if (crystalSystem === 'Hexagonal') return ['g₀ (h²+hk+k²)', 'g₁ (l²)', 'g₂ f(θ)'];
    if (crystalSystem === 'Orthorhombic') return ['g₀ (h²)', 'g₁ (k²)', 'g₂ (l²)', 'g₃ f(θ)'];
    if (crystalSystem === 'Monoclinic') return ['g₀ (h²)', 'g₁ (k²)', 'g₂ (l²)', 'g₃ (hk)', 'g₄ f(θ)'];
    return ['g₀', 'g₁'];
  }, [crystalSystem]);

  // Open Import & Custom Specification Configuration Modal
  const openImportModal = (fromActive: boolean = false) => {
    if (fromActive && activeResults && activeResults.length > 0) {
      const imported: PeakInput[] = activeResults.map((r, idx) => {
        let h = 1, k = 1, l = 1;
        if (r.hkl) {
          const clean = r.hkl.replace(/[()]/g, '').trim();
          const parts = clean.split(/[\s,]+/).filter(Boolean);
          if (parts.length === 3) {
            h = parseInt(parts[0], 10) || 1;
            k = parseInt(parts[1], 10) || 1;
            l = parseInt(parts[2], 10) || 1;
          } else if (clean.length === 3) {
            h = parseInt(clean[0], 10) || 1;
            k = parseInt(clean[1], 10) || 1;
            l = parseInt(clean[2], 10) || 1;
          }
        }
        return {
          id: `imp-${idx}-${Date.now()}`,
          twoTheta: r.twoTheta,
          h, k, l,
          intensity: r.intensity || 100
        };
      });
      setImportPeaks(imported);
      setImportSampleName(
        activeMaterialName ? `${activeMaterialName} (Active Bragg)` : 'Active Bragg Peaks Sample'
      );
    } else {
      setImportPeaks(peaks.map(p => ({ ...p })));
      setImportSampleName(
        selectedPreset && selectedPreset !== 'Custom / Imported'
          ? `${selectedPreset} (Custom Spec)`
          : (activeMaterialName ? `${activeMaterialName} (Custom)` : 'Custom Metallurgical Sample')
      );
    }
    setImportCrystalSystem(crystalSystem);
    setImportDriftType(driftType);
    setImportWavelength(wavelength);
    setShowImportModal(true);
  };

  // Apply Imported & Configured Specs to Cohen Refinement
  const handleApplyImportedSpecs = () => {
    if (!importPeaks || importPeaks.length < 2) {
      alert('At least 2 Bragg reflection peaks are required for least squares matrix refinement calculation.');
      return;
    }

    const invalidPeak = importPeaks.find(p => isNaN(p.twoTheta) || p.twoTheta <= 0 || p.twoTheta >= 180);
    if (invalidPeak) {
      alert('All 2θ angles must be valid positive numbers between 0° and 180°.');
      return;
    }

    const finalName = importSampleName.trim() || 'Custom Sample';

    setCrystalSystem(importCrystalSystem);
    setDriftType(importDriftType);
    setWavelength(importWavelength);
    setPeaks(importPeaks.map(p => ({ ...p })));

    const newPreset: PresetSample = {
      name: finalName,
      system: importCrystalSystem,
      wavelength: importWavelength,
      peaks: importPeaks.map(p => ({ ...p }))
    };

    setCustomPresets(prev => {
      const existingIdx = prev.findIndex(p => p.name.toLowerCase() === finalName.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newPreset;
        return copy;
      }
      return [...prev, newPreset];
    });

    setSelectedPreset(finalName);
    setShowImportModal(false);

    setImportNotification(`Successfully configured and imported "${finalName}" (${importPeaks.length} reflections)!`);
    setTimeout(() => setImportNotification(null), 4500);
  };

  // Modal Table Actions
  const handleModalAddPeak = () => {
    const last = importPeaks[importPeaks.length - 1];
    const new2Th = last ? Math.min(160, parseFloat((last.twoTheta + 4).toFixed(2))) : 30;
    setImportPeaks([
      ...importPeaks,
      {
        id: `modal-p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        twoTheta: new2Th,
        h: 1, k: 1, l: 1,
        intensity: 100
      }
    ]);
  };

  const handleModalRemovePeak = (id: string) => {
    if (importPeaks.length <= 2) {
      alert('Cohen refinement requires at least 2 peaks.');
      return;
    }
    setImportPeaks(importPeaks.filter(p => p.id !== id));
  };

  const handleModalSortPeaks = () => {
    setImportPeaks([...importPeaks].sort((a, b) => a.twoTheta - b.twoTheta));
  };

  const handleModalUpdatePeak = (id: string, field: keyof PeakInput, value: number) => {
    setImportPeaks(importPeaks.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Load preset sample handler
  const handleLoadPreset = (presetName: string) => {
    if (presetName === 'Custom / Imported' || presetName === '__CREATE_CUSTOM__') {
      openImportModal(false);
      return;
    }

    setSelectedPreset(presetName);

    const foundBuiltIn = PRESET_SAMPLES.find(p => p.name === presetName);
    if (foundBuiltIn) {
      setCrystalSystem(foundBuiltIn.system);
      setWavelength(foundBuiltIn.wavelength);
      setPeaks(foundBuiltIn.peaks.map(p => ({ ...p })));
      return;
    }

    const foundCustom = customPresets.find(p => p.name === presetName);
    if (foundCustom) {
      setCrystalSystem(foundCustom.system);
      setWavelength(foundCustom.wavelength);
      setPeaks(foundCustom.peaks.map(p => ({ ...p })));
      return;
    }
  };

  // Import active Bragg results handler
  const handleImportActiveResults = () => {
    openImportModal(true);
  };

  // Add Peak (quick button)
  const handleAddPeak = () => {
    const newId = `peak-${Date.now()}`;
    const lastPeak = peaks[peaks.length - 1];
    const new2Th = lastPeak ? Math.min(160, parseFloat((lastPeak.twoTheta + 5).toFixed(3))) : 30;
    setPeaks([...peaks, { id: newId, twoTheta: new2Th, h: 1, k: 1, l: 1, intensity: 100 }]);
    setSelectedPreset('Custom / Imported');
  };

  // Add Custom Manual Peak Form Submission
  const handleAddCustomPeak = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedTwoTheta = parseFloat(newTwoTheta);
    if (isNaN(parsedTwoTheta) || parsedTwoTheta <= 0 || parsedTwoTheta >= 180) {
      alert('Please enter a valid 2θ angle between 0° and 180°.');
      return;
    }
    const newPeakItem: PeakInput = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      twoTheta: parsedTwoTheta,
      h: newH,
      k: newK,
      l: newL,
      intensity: newIntensity
    };
    setPeaks(prev => [...prev, newPeakItem]);
    setSelectedPreset('Custom / Imported');

    // Auto-advance 2Theta for convenience
    setNewTwoTheta((parsedTwoTheta + 5).toFixed(2));
  };

  // Clear All Peaks
  const handleClearAllPeaks = () => {
    if (window.confirm('Are you sure you want to clear all peaks? You can then enter custom ones or load a preset.')) {
      setPeaks([
        { id: `custom-1`, twoTheta: 28.44, h: 1, k: 1, l: 1, intensity: 100 },
        { id: `custom-2`, twoTheta: 47.30, h: 2, k: 2, l: 0, intensity: 60 }
      ]);
      setSelectedPreset('Custom / Imported');
    }
  };

  // Parse Bulk Text Input
  const handleParseBulkPeaks = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const parsed: PeakInput[] = [];

    lines.forEach((line, idx) => {
      const clean = line.trim();
      if (!clean) return;
      const parts = clean.split(/[\s,\t]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));
      if (parts.length >= 4) {
        let tt = parts[0];
        let h = Math.round(parts[1]);
        let k = Math.round(parts[2]);
        let l = Math.round(parts[3]);
        if (tt < 5 && parts[3] > 5) {
          h = Math.round(parts[0]);
          k = Math.round(parts[1]);
          l = Math.round(parts[2]);
          tt = parts[3];
        }
        parsed.push({
          id: `bulk-${idx}-${Date.now()}`,
          twoTheta: tt,
          h, k, l,
          intensity: parts[4] || 100
        });
      } else if (parts.length === 1 && parts[0] > 0 && parts[0] < 180) {
        parsed.push({
          id: `bulk-${idx}-${Date.now()}`,
          twoTheta: parts[0],
          h: 1, k: 1, l: 1,
          intensity: 100
        });
      }
    });

    if (parsed.length > 0) {
      setPeaks(parsed);
      setSelectedPreset('Custom / Imported');
      setShowBulkModal(false);
      setBulkText('');
      setImportNotification(`Successfully parsed ${parsed.length} reflection peaks!`);
      setTimeout(() => setImportNotification(null), 4000);
    } else {
      alert('Could not parse any valid peaks. Use "2Theta, h, k, l" or "h, k, l, 2Theta" format.');
    }
  };

  // Delete Peak
  const handleDeletePeak = (id: string) => {
    if (peaks.length <= 2) {
      alert('At least 2 peaks are required for matrix refinement equations.');
      return;
    }
    setPeaks(peaks.filter(p => p.id !== id));
  };

  // Update Peak Field
  const handleUpdatePeak = (id: string, field: keyof PeakInput, value: number) => {
    setPeaks(peaks.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // ----------------------------------------------------
  // COHEN LEAST SQUARES MATRIX REFINEMENT COMPUTATION
  // ----------------------------------------------------
  const refinementResult = useMemo(() => {
    if (peaks.length < 2) {
      return { error: 'At least 2 or more reflection peaks are required for matrix refinement.' };
    }

    const lambda = wavelength;
    const N = peaks.length;

    // Filter valid peaks
    const validPeaks = peaks.filter(p => p.twoTheta > 0 && p.twoTheta < 180);
    if (validPeaks.length < 2) {
      return { error: 'Invalid 2Theta angles detected. Peaks must be strictly between 0° and 180°.' };
    }

    // Build Basis Vectors per reflection
    // For each peak i, we compute sin^2(theta_i) and the coefficient basis g_{j, i}
    // Equation: sin^2(theta_i) = \sum_j X_j * g_{j,i}
    
    // Basis definitions:
    // Cubic: X = [A, D]^T
    //   g_0 = h^2 + k^2 + l^2
    //   g_1 = f(theta)
    //   where A = lambda^2 / (4 * a^2)  =>  a = lambda / (2 * sqrt(A))

    // Tetragonal: X = [A, C, D]^T
    //   g_0 = h^2 + k^2
    //   g_1 = l^2
    //   g_2 = f(theta)
    //   where A = lambda^2 / (4 * a^2)  =>  a = lambda / (2 * sqrt(A))
    //   where C = lambda^2 / (4 * c^2)  =>  c = lambda / (2 * sqrt(C))

    // Hexagonal: X = [A, C, D]^T
    //   g_0 = h^2 + h*k + k^2
    //   g_1 = l^2
    //   g_2 = f(theta)
    //   where A = lambda^2 / (3 * a^2)  =>  a = lambda / sqrt(3 * A)
    //   where C = lambda^2 / (4 * c^2)  =>  c = lambda / (2 * sqrt(C))

    // Orthorhombic: X = [A, B, C, D]^T
    //   g_0 = h^2
    //   g_1 = k^2
    //   g_2 = l^2
    //   g_3 = f(theta)
    //   where A = lambda^2 / (4 * a^2)  =>  a = lambda / (2 * sqrt(A))
    //   where B = lambda^2 / (4 * b^2)  =>  b = lambda / (2 * sqrt(B))
    //   where C = lambda^2 / (4 * c^2)  =>  c = lambda / (2 * sqrt(C))

    // Monoclinic (unique b-axis): X = [A, B, C, E, D]^T
    //   g_0 = h^2
    //   g_1 = k^2
    //   g_2 = l^2
    //   g_3 = h * l
    //   g_4 = f(theta)

    let numParams = 2; // Default cubic
    if (crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal') numParams = 3;
    if (crystalSystem === 'Orthorhombic') numParams = 4;
    if (crystalSystem === 'Monoclinic') numParams = 5;

    if (validPeaks.length <= numParams - 1) {
      return { 
        error: `Insufficient reflections (${validPeaks.length}). ${crystalSystem} crystal system with drift refinement requires at least ${numParams} non-co-linear peaks.` 
      };
    }

    const sin2Obs: number[] = [];
    const driftVals: number[] = [];
    const basisMatrix: number[][] = []; // [numPeaks][numParams]

    for (let i = 0; i < validPeaks.length; i++) {
      const p = validPeaks[i];
      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const sinTh = Math.sin(thetaRad);
      const s2 = sinTh * sinTh;
      sin2Obs.push(s2);

      const fTh = calculateDrift(p.twoTheta, driftType);
      driftVals.push(fTh);

      let row: number[] = [];
      const h2 = p.h * p.h;
      const k2 = p.k * p.k;
      const l2 = p.l * p.l;

      if (crystalSystem === 'Cubic') {
        const s = h2 + k2 + l2;
        row = [s, fTh];
      } else if (crystalSystem === 'Tetragonal') {
        const s = h2 + k2;
        row = [s, l2, fTh];
      } else if (crystalSystem === 'Hexagonal') {
        const s = h2 + p.h * p.k + k2;
        row = [s, l2, fTh];
      } else if (crystalSystem === 'Orthorhombic') {
        row = [h2, k2, l2, fTh];
      } else if (crystalSystem === 'Monoclinic') {
        row = [h2, k2, l2, p.h * p.l, fTh];
      }

      basisMatrix.push(row);
    }

    // Build Normal Equations Matrix M (numParams x numParams) and RHS Vector Y (numParams)
    const M: number[][] = Array.from({ length: numParams }, () => Array(numParams).fill(0));
    const Y: number[] = Array(numParams).fill(0);

    for (let j = 0; j < numParams; j++) {
      for (let k = 0; k < numParams; k++) {
        let sum = 0;
        for (let i = 0; i < validPeaks.length; i++) {
          sum += basisMatrix[i][j] * basisMatrix[i][k];
        }
        M[j][k] = sum;
      }

      let ySum = 0;
      for (let i = 0; i < validPeaks.length; i++) {
        ySum += basisMatrix[i][j] * sin2Obs[i];
      }
      Y[j] = ySum;
    }

    // Solve M * X = Y
    const solved = solveLinearSystem(M, Y);
    if (!solved) {
      return { error: 'Matrix M is singular or poorly conditioned. Check if peak HKL indices are linearly dependent.' };
    }

    const { X, M_inv } = solved;

    // Interpret Parameters X
    let a = 0, b = 0, c = 0, betaDeg = 90, D = 0;
    let sigmaA = 0, sigmaB = 0, sigmaC = 0, sigmaD = 0;

    // Calculate residuals
    let sumResidualSquare = 0;
    let sumTwoThetaShiftSquare = 0;

    const peakRefiningDetails = validPeaks.map((p, idx) => {
      let sin2Calc = 0;
      for (let j = 0; j < numParams; j++) {
        sin2Calc += X[j] * basisMatrix[idx][j];
      }
      sin2Calc = Math.max(1e-7, Math.min(0.999999, sin2Calc));

      const sinThCalc = Math.sqrt(sin2Calc);
      const thetaCalcRad = Math.asin(sinThCalc);
      const twoThetaCalc = 2 * thetaCalcRad * (180 / Math.PI);
      const deltaTwoTheta = p.twoTheta - twoThetaCalc;

      const residualSin2 = sin2Obs[idx] - sin2Calc;
      sumResidualSquare += residualSin2 * residualSin2;
      sumTwoThetaShiftSquare += deltaTwoTheta * deltaTwoTheta;

      return {
        ...p,
        sin2Obs: sin2Obs[idx],
        sin2Calc,
        twoThetaCalc,
        deltaTwoTheta,
        driftVal: driftVals[idx],
        residualSin2
      };
    });

    const dof = Math.max(1, validPeaks.length - numParams);
    const variance = sumResidualSquare / dof;
    const rmsTwoThetaShift = Math.sqrt(sumTwoThetaShiftSquare / validPeaks.length);

    // Extract lattice constants and error propagation
    if (crystalSystem === 'Cubic') {
      const A = X[0];
      D = X[1];
      if (A <= 0) return { error: 'Refined parameter A <= 0. Unphysical solution.' };

      a = lambda / (2 * Math.sqrt(A));
      const varA = variance * M_inv[0][0];
      const varD = variance * M_inv[1][1];
      
      const sigA_val = varA > 0 ? Math.sqrt(varA) : 0;
      sigmaA = (a / (2 * A)) * sigA_val;
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
      b = a;
      c = a;
    } else if (crystalSystem === 'Tetragonal') {
      const A = X[0];
      const C = X[1];
      D = X[2];
      if (A <= 0 || C <= 0) return { error: 'Refined parameters A or C <= 0. Unphysical solution.' };

      a = lambda / (2 * Math.sqrt(A));
      c = lambda / (2 * Math.sqrt(C));
      b = a;

      const varA = variance * M_inv[0][0];
      const varC = variance * M_inv[1][1];
      const varD = variance * M_inv[2][2];

      sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
      sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
      sigmaB = sigmaA;
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    } else if (crystalSystem === 'Hexagonal') {
      const A = X[0];
      const C = X[1];
      D = X[2];
      if (A <= 0 || C <= 0) return { error: 'Refined parameters A or C <= 0. Unphysical solution.' };

      a = lambda / Math.sqrt(3 * A);
      c = lambda / (2 * Math.sqrt(C));
      b = a;

      const varA = variance * M_inv[0][0];
      const varC = variance * M_inv[1][1];
      const varD = variance * M_inv[2][2];

      sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
      sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
      sigmaB = sigmaA;
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    } else if (crystalSystem === 'Orthorhombic') {
      const A = X[0];
      const B = X[1];
      const C = X[2];
      D = X[3];
      if (A <= 0 || B <= 0 || C <= 0) return { error: 'Refined parameters A, B, or C <= 0. Unphysical solution.' };

      a = lambda / (2 * Math.sqrt(A));
      b = lambda / (2 * Math.sqrt(B));
      c = lambda / (2 * Math.sqrt(C));

      const varA = variance * M_inv[0][0];
      const varB = variance * M_inv[1][1];
      const varC = variance * M_inv[2][2];
      const varD = variance * M_inv[3][3];

      sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
      sigmaB = varB > 0 ? (b / (2 * B)) * Math.sqrt(varB) : 0;
      sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    } else if (crystalSystem === 'Monoclinic') {
      const A = X[0];
      const B = X[1];
      const C = X[2];
      const E = X[3];
      D = X[4];
      if (A <= 0 || B <= 0 || C <= 0) return { error: 'Refined parameters A, B, or C <= 0. Unphysical solution.' };

      b = lambda / (2 * Math.sqrt(B));
      // For monoclinic beta angle estimation
      const cosBeta = -E / (2 * Math.sqrt(A * C));
      const clampedCos = Math.max(-0.9999, Math.min(0.9999, cosBeta));
      const betaRad = Math.acos(clampedCos);
      betaDeg = betaRad * (180 / Math.PI);
      const sinBeta = Math.sin(betaRad);

      a = lambda / (2 * Math.sqrt(A) * sinBeta);
      c = lambda / (2 * Math.sqrt(C) * sinBeta);

      const varA = variance * M_inv[0][0];
      const varB = variance * M_inv[1][1];
      const varC = variance * M_inv[2][2];
      const varD = variance * M_inv[4][4];

      sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
      sigmaB = varB > 0 ? (b / (2 * B)) * Math.sqrt(varB) : 0;
      sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }

    // Unit Cell Volume Calculation
    let volume = 0;
    let sigmaVolume = 0;
    if (crystalSystem === 'Cubic') {
      volume = a * a * a;
      sigmaVolume = 3 * a * a * sigmaA;
    } else if (crystalSystem === 'Tetragonal') {
      volume = a * a * c;
      sigmaVolume = Math.sqrt(Math.pow(2 * a * c * sigmaA, 2) + Math.pow(a * a * sigmaC, 2));
    } else if (crystalSystem === 'Hexagonal') {
      volume = (Math.sqrt(3) / 2) * a * a * c;
      sigmaVolume = (Math.sqrt(3) / 2) * Math.sqrt(Math.pow(2 * a * c * sigmaA, 2) + Math.pow(a * a * sigmaC, 2));
    } else if (crystalSystem === 'Orthorhombic') {
      volume = a * b * c;
      sigmaVolume = Math.sqrt(
        Math.pow(b * c * sigmaA, 2) + Math.pow(a * c * sigmaB, 2) + Math.pow(a * b * sigmaC, 2)
      );
    } else if (crystalSystem === 'Monoclinic') {
      const sinB = Math.sin(betaDeg * Math.PI / 180);
      volume = a * b * c * sinB;
      sigmaVolume = Math.sqrt(
        Math.pow(b * c * sinB * sigmaA, 2) + Math.pow(a * c * sinB * sigmaB, 2) + Math.pow(a * b * sinB * sigmaC, 2)
      );
    }

    return {
      lattice: { a, b, c, betaDeg },
      sigma: { sigmaA, sigmaB, sigmaC, sigmaD, sigmaVolume },
      D,
      volume,
      variance,
      rmsTwoThetaShift,
      sumResidualSquare,
      dof,
      matrixM: M,
      matrixMInv: M_inv,
      vectorY: Y,
      vectorX: X,
      peakDetails: peakRefiningDetails,
      numParams,
      validPeaks,
      basisMatrix
    };
  }, [peaks, crystalSystem, driftType, wavelength]);

  // Export mathematical report as text
  const handleExportTextReport = () => {
    if (!refinementResult || 'error' in refinementResult) return;
    const { lattice, sigma, D, volume, rmsTwoThetaShift, peakDetails } = refinementResult;

    let text = `========================================================\n`;
    text += `COHEN'S LEAST SQUARES MATRIX REFINEMENT REPORT\n`;
    text += `Crystal System: ${crystalSystem}\n`;
    text += `Drift Function: ${driftType}\n`;
    text += `Wavelength: ${wavelength} Å\n`;
    text += `Refined Parameters:\n`;
    text += `  a = ${lattice.a.toFixed(precision + 1)} ± ${sigma.sigmaA.toFixed(precision + 2)} Å\n`;
    if (crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic') {
      text += `  b = ${lattice.b.toFixed(precision + 1)} ± ${sigma.sigmaB.toFixed(precision + 2)} Å\n`;
    }
    if (crystalSystem !== 'Cubic') {
      text += `  c = ${lattice.c.toFixed(precision + 1)} ± ${sigma.sigmaC.toFixed(precision + 2)} Å\n`;
    }
    if (crystalSystem === 'Monoclinic') {
      text += `  beta = ${lattice.betaDeg.toFixed(3)}°\n`;
    }
    text += `  Volume V = ${volume.toFixed(precision)} ± ${sigma.sigmaVolume.toFixed(precision)} Å³\n`;
    text += `  Drift Error Parameter D = ${D.toExponential(4)}\n`;
    text += `  RMS 2Theta Shift = ${rmsTwoThetaShift.toFixed(4)}°\n\n`;
    text += `Peak Residual Details:\n`;
    text += `HKL\t2Th_Obs(deg)\t2Th_Calc(deg)\tDelta2Th(deg)\tsin2_Obs\tsin2_Calc\tResidual\n`;
    peakDetails.forEach(p => {
      text += `(${p.h} ${p.k} ${p.l})\t${p.twoTheta.toFixed(3)}\t${p.twoThetaCalc.toFixed(3)}\t${p.deltaTwoTheta.toFixed(4)}\t${p.sin2Obs.toFixed(5)}\t${p.sin2Calc.toFixed(5)}\t${p.residualSin2.toExponential(3)}\n`;
    });
    text += `========================================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohen_matrix_refinement_${crystalSystem.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy LaTeX equations
  const handleCopyLatex = () => {
    const latex = `\\begin{pmatrix} \\sum g_1^2 & \\sum g_1 g_2 & \\dots \\\\ \\sum g_2 g_1 & \\sum g_2^2 & \\dots \\end{pmatrix} \\begin{pmatrix} A \\\\ D \\end{pmatrix} = \\begin{pmatrix} \\sum g_1 \\sin^2\\theta \\\\ \\sum g_2 \\sin^2\\theta \\end{pmatrix}`;
    navigator.clipboard.writeText(latex);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none mix-blend-screen">
          <Grid className="w-64 h-64 text-indigo-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Pure Linear Algebra • Matrix Refinement
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Cohen's Method
            </h2>
            <p className="text-indigo-200/80 text-sm md:text-base font-medium leading-relaxed">
              Analytical matrix elimination of systematic X-ray diffraction errors (sample displacement, zero shift, absorption). Solves normal equations $M \cdot X = Y$ to derive exact lattice parameters $(a, b, c)$ with variance-covariance error estimates.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            {activeResults && activeResults.length > 0 && (
              <button
                onClick={handleImportActiveResults}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 border border-indigo-400/30 w-full"
              >
                <Activity className="w-4 h-4" />
                Import Active Bragg Peaks ({activeResults.length})
              </button>
            )}
            <button
              onClick={handleExportTextReport}
              disabled={'error' in refinementResult}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40 w-full"
            >
              <Download className="w-3.5 h-3.5" />
              Export Text Report
            </button>
          </div>
        </div>
      </div>

      {/* Import Toast Notification */}
      <AnimatePresence>
        {importNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-xs flex items-center justify-between gap-3 border border-emerald-400/30"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>{importNotification}</span>
            </div>
            <button onClick={() => setImportNotification(null)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scientific Math Control Explanation */}
      <ScientificMathControl
        title="Cohen's Least Squares Formulation"
        formula="\sin^2\theta_i = \sin^2\theta_{\text{ideal}, i} + D \cdot f(\theta_i) \implies [M] \mathbf{X} = \mathbf{Y}"
        description="Transforms Bragg's condition with systematic drift function f(θ) into a linear matrix system. Matrix inversion M⁻¹ yields refined lattice coefficients and parameter standard errors."
        variables={[
          { symbol: 'λ', name: 'X-Ray Wavelength', value: wavelength, unit: 'Å' },
          { symbol: 'f(θ)', name: 'Systematic Error Drift Function', value: 0.5 * ((Math.cos(0.5) ** 2 / Math.sin(0.5)) + (Math.cos(0.5) ** 2 / 0.5)), unit: '' },
          { symbol: 'D', name: 'Systematic Error Parameter', value: 'error' in refinementResult ? 0 : refinementResult.D, unit: '' },
          { symbol: 'M', name: 'Normal Equations Matrix Dimension', value: 'error' in refinementResult ? 0 : refinementResult.numParams, unit: 'x' + ('error' in refinementResult ? 0 : refinementResult.numParams) }
        ]}
        result={'error' in refinementResult ? 0 : refinementResult.lattice.a}
        resultUnit="Å"
        resultName="Refined Lattice Parameter a"
      />

      {/* Controls & Preset Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 relative z-10">
          <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
          Method Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Crystal System Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
              1. Crystal System
            </label>
            <div className="relative">
              <select
                value={crystalSystem}
                onChange={(e) => setCrystalSystem(e.target.value as CrystalSystem)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-colors"
              >
                <option value="Cubic">Cubic (a)</option>
                <option value="Tetragonal">Tetragonal (a, c)</option>
                <option value="Hexagonal">Hexagonal (a, c)</option>
                <option value="Orthorhombic">Orthorhombic (a, b, c)</option>
                <option value="Monoclinic">Monoclinic (a, b, c, β)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <ArrowUpDown className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </div>

          {/* Drift Function Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
              2. Drift Error Function f(θ)
            </label>
            <div className="relative">
              <select
                value={driftType}
                onChange={(e) => setDriftType(e.target.value as DriftFunctionType)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-colors"
              >
                <option value="nelson_riley">Nelson-Riley: ½(cos²θ/sinθ + cos²θ/θ)</option>
                <option value="bradley_jay">Bradley-Jay: cos²θ</option>
                <option value="sample_displacement">Sample Displacement: cos²θ sinθ</option>
                <option value="hess_hagg">Hess-Hägg: sin²(2θ)</option>
                <option value="zero_shift">Pure Zero Shift: cosθ</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <ArrowUpDown className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </div>

          {/* Wavelength Input - Prominent Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                3. Wavelength λ (Å)
              </label>
            </div>
            
            <div className="relative">
              <input
                type="number"
                step="0.00001"
                value={wavelength}
                onChange={(e) => setWavelength(parseFloat(e.target.value) || 1.54056)}
                className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-colors"
              />
            </div>

            {/* Radiation Source Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { name: 'Cu Kα1', val: 1.54056 },
                { name: 'Cu Kα', val: 1.54184 },
                { name: 'Co Kα1', val: 1.78896 },
                { name: 'Mo Kα1', val: 0.70930 },
              ].map(source => (
                <button
                  key={source.name}
                  onClick={() => setWavelength(source.val)}
                  title={`${source.name}: ${source.val} Å`}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    Math.abs(wavelength - source.val) < 0.0001
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Sample Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                4. Reference Material
              </label>
              <button
                type="button"
                onClick={() => openImportModal(false)}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                Configure
              </button>
            </div>
            <div className="relative">
              <select
                value={selectedPreset}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-colors"
              >
                <optgroup label="Standard Reference Presets">
                  {PRESET_SAMPLES.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </optgroup>
                {customPresets.length > 0 && (
                  <optgroup label="My Custom & Imported Samples">
                    {customPresets.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Custom Options">
                  <option value="Custom / Imported">+ Custom Sample...</option>
                </optgroup>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-indigo-400">
                <ArrowUpDown className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Display */}
      {refinementResult && 'error' in refinementResult ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Refinement Error</h4>
            <p className="text-xs">{refinementResult.error}</p>
          </div>
        </div>
      ) : refinementResult && (
        <div className="space-y-6">
          {/* Refinement Conditions Banner */}
          <div className="bg-slate-900/90 text-white p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px]">Setup Parameters:</span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30 flex items-center gap-1.5">
                <span className="text-slate-400">λ =</span>
                <span className="text-sm font-black text-white">{wavelength}</span>
                <span className="text-[10px] text-slate-300">Å</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                Symmetry: {crystalSystem}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                Drift Model: {driftType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span>Reflections <i>N</i> = <strong className="text-white">{peaks.length}</strong></span>
              <span>•</span>
              <span>Matrix = <strong className="text-indigo-400">{refinementResult.numParams}×{refinementResult.numParams}</strong></span>
            </div>
          </div>
          {/* Top Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Parameter a */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                    Refined Parameter <i>a</i>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50">
                    Matrix $X_0$
                  </span>
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400 mt-2">
                  {refinementResult.lattice.a.toFixed(precision + 1)} <span className="text-sm font-sans text-slate-500">Å</span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span>±</span>
                  <FormatSci val={refinementResult.sigma.sigmaA} digits={precision + 1} />
                  <span>Å</span>
                </div>
              </div>

              {/* Underlying Logic Explanation */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Logic &amp; Derivation:</span>
                </div>
                <p className="leading-snug">
                  Derived from solved matrix variable <strong className="font-mono text-indigo-600 dark:text-indigo-400">X₀</strong> via <code className="font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.2 rounded">a = λ / (2√X₀)</code>.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  X₀ represents the refined h²+k²+l² metric constant after removing systematic angular drift D · f(θ).
                </p>
              </div>
            </div>

            {/* Parameter b or c or Symmetry Constraint */}
            {(crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic') ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                      Refined Parameter <i>b</i>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200 dark:border-cyan-800/50">
                      Matrix X₁
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-cyan-600 dark:text-cyan-400 mt-2">
                    {refinementResult.lattice.b.toFixed(precision + 1)} <span className="text-sm font-sans text-slate-500">Å</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span>±</span>
                    <FormatSci val={refinementResult.sigma.sigmaB} digits={precision + 1} />
                    <span>Å</span>
                  </div>
                </div>

                {/* Underlying Logic Explanation */}
                <div className="p-3 bg-cyan-50/50 dark:bg-cyan-900/20 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>Logic &amp; Derivation:</span>
                  </div>
                  <p className="leading-snug">
                    Calculated from second diagonal solution variable <strong className="font-mono text-cyan-600 dark:text-cyan-400">X₁</strong> via <code className="font-mono bg-cyan-100 dark:bg-cyan-900/60 px-1 py-0.2 rounded">b = λ / (2√X₁)</code>.
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Accounts for independent k² reciprocal lattice dimension in lower-symmetry systems.
                  </p>
                </div>
              </div>
            ) : (crystalSystem !== 'Cubic') ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                      Refined Parameter <i>c</i>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold border border-purple-200 dark:border-purple-800/50">
                      Matrix {crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'X₁' : 'X₂'}
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-purple-600 dark:text-purple-400 mt-2">
                    {refinementResult.lattice.c.toFixed(precision + 1)} <span className="text-sm font-sans text-slate-500">Å</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span>±</span>
                    <FormatSci val={refinementResult.sigma.sigmaC} digits={precision + 1} />
                    <span>Å</span>
                  </div>
                </div>

                {/* Underlying Logic Explanation */}
                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Logic &amp; Derivation:</span>
                  </div>
                  <p className="leading-snug">
                    {crystalSystem === 'Hexagonal' ? (
                      <>Derived via <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 py-0.2 rounded">c = λ / (2√X₁)</code> where X₁ = λ² / (4c²) for hexagonal l².</>
                    ) : (
                      <>Derived via <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 py-0.2 rounded">c = λ / (2√X_c)</code> for the l² Miller axis coefficient.</>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Refines the unique longitudinal c-axis parameter independently from a.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                  <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                    Symmetry Constraint
                  </span>
                  <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-slate-700 dark:text-slate-300 mt-2">
                    a = b = c
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-1">
                    Isometric Cubic System
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Cubic Symmetry Logic:</span>
                  </div>
                  <p className="leading-snug">
                    In cubic crystals, symmetry mandates identical unit cell dimensions in all 3 directions (a = b = c).
                  </p>
                </div>
              </div>
            )}

            {/* Unit Cell Volume V */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                    Unit Cell Volume <i>V</i>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/50">
                    3D Space
                  </span>
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">
                  {refinementResult.volume.toFixed(precision)} <span className="text-sm font-sans text-slate-500">Å³</span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span>±</span>
                  <FormatSci val={refinementResult.sigma.sigmaVolume} digits={precision} />
                  <span>Å³</span>
                </div>
              </div>

              {/* Underlying Logic Explanation */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Logic &amp; Formula:</span>
                </div>
                <p className="leading-snug font-mono">
                  {crystalSystem === 'Cubic' && 'V = a³'}
                  {crystalSystem === 'Tetragonal' && 'V = a² · c'}
                  {crystalSystem === 'Hexagonal' && 'V = (√3/2)a²c ≈ 0.866a²c'}
                  {crystalSystem === 'Orthorhombic' && 'V = a · b · c'}
                  {crystalSystem === 'Monoclinic' && 'V = a · b · c · sin(β)'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Calculated directly from the refined lattice parameters. Error σ_V propagates covariance matrix terms.
                </p>
              </div>
            </div>

            {/* Drift Error Constant D */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest font-black text-slate-400">
                    Drift Parameter <i>D</i>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800/50">
                    Systematic Error
                  </span>
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-2">
                  <FormatSci val={refinementResult.D} digits={3} />
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  RMS 2θ Shift: {refinementResult.rmsTwoThetaShift.toFixed(4)}°
                </div>
              </div>

              {/* Underlying Logic Explanation */}
              <div className="p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Physical Drift Logic:</span>
                </div>
                <p className="leading-snug">
                  Solved as final column variable in vector <strong className="font-mono text-amber-600 dark:text-amber-400">X</strong>. Multiplies f(θ) to correct sample displacement &amp; absorption.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  A non-zero D removes residual slope in Bradley-Jay / Nelson-Riley extrapolation plots.
                </p>
              </div>
            </div>
          </div>

          {/* Matrix Algebra Mechanics Panel */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Linear System Normal Matrix [M] & Inverse Covariance Matrix [M⁻¹]
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMatrixDerivation(!showMatrixDerivation)}
                  className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {showMatrixDerivation ? 'Hide Derivation Logic' : 'Explain Matrix Values'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLatex}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  {copiedMatrix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMatrix ? 'Copied LaTeX' : 'Copy LaTeX'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Normal Matrix M */}
              <MatrixBox
                title="1. Normal Equation Matrix [M] (M_{j,k} = ∑ g_j g_k)"
                matrix={refinementResult.matrixM}
                accentColor="indigo"
                labels={matrixLabels}
              />

              {/* Inverse Matrix M^-1 */}
              <MatrixBox
                title="2. Inverse Covariance Matrix [M⁻¹] (Var(X_i) = σ² M⁻¹_{i,i})"
                matrix={refinementResult.matrixMInv}
                accentColor="emerald"
                labels={matrixLabels}
              />
            </div>

            {/* Vector Solution */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1.5">Right-Hand Side Vector [Y]:</span>
                <div className="flex flex-wrap gap-2">
                  {refinementResult.vectorY.map((y, idx) => (
                    <div key={idx} className="bg-slate-800/90 text-indigo-300 px-2.5 py-1 rounded border border-slate-700/80 flex items-center gap-1.5 font-mono text-xs shadow-inner">
                      <span>Y<sub>{idx}</sub> =</span>
                      <FormatSci val={y} digits={4} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1.5">Parameter Solution Vector [X = M⁻¹ Y]:</span>
                <div className="flex flex-wrap gap-2">
                  {refinementResult.vectorX.map((x, idx) => (
                    <div key={idx} className="bg-indigo-950/90 text-amber-300 px-2.5 py-1 rounded border border-indigo-800/60 flex items-center gap-1.5 font-mono text-xs shadow-inner">
                      <span>X<sub>{idx}</sub> =</span>
                      <FormatSci val={x} digits={4} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deep Mathematical Derivation & Matrix Numbers Logic Box */}
            {showMatrixDerivation && (
              <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-indigo-900/40 text-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Matrix Elements Derivation &amp; Scientific Values Logic</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPeakTermTable(!showPeakTermTable)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    {showPeakTermTable ? 'Hide Reflection Terms Table' : 'Show Peak-by-Peak Contribution Table'}
                  </button>
                </div>

                {/* Why are values like 7814.000 so large? */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-slate-300 space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Why is M₀,₀ = {refinementResult.matrixM[0]?.[0]?.toFixed(3)}? (Origin of Large Numbers in [M])</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    The top-left matrix entry <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-300">M₀,₀</code> is calculated as the sum of squared Miller basis terms across all {refinementResult.validPeaks?.length} measured reflections:
                    <span className="block font-mono bg-slate-900/90 p-2 rounded border border-slate-800 my-1 text-indigo-300 text-center">
                      M₀,₀ = ∑<sub>i=1</sub><sup>N</sup> (g₀,i)²
                    </span>
                    For cubic crystals, <code className="font-mono text-cyan-300">g₀,i = h_i² + k_i² + l_i²</code>. High-order reflections have large index sums (e.g., peak (4,2,2) has g₀ = 16+4+4 = 24, which squared becomes 24² = 576). Summing these squared terms across all reflections yields values like <strong className="font-mono text-amber-300">{refinementResult.matrixM[0]?.[0]?.toFixed(3)}</strong>. This represents the total geometric spectral weight of the crystal lattice dataset.
                  </p>
                </div>

                {/* Matrix Element Formula Definitions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-300">1. Normal Matrix Elements M<sub>j,k</sub></div>
                    <p className="text-slate-400 leading-snug">
                      Defined as the dot product sum of basis function vectors across all reflections:
                    </p>
                    <code className="block font-mono text-indigo-200 bg-slate-950 p-1.5 rounded text-[10.5px]">
                      M<sub>j,k</sub> = ∑<sub>i=1</sub><sup>N</sup> g<sub>j,i</sub> · g<sub>k,i</sub>
                    </code>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[10px] mt-1">
                      <li><strong className="text-slate-200">Diagonal M<sub>j,j</sub>:</strong> Measure total magnitude of basis function g<sub>j</sub></li>
                      <li><strong className="text-slate-200">Off-diagonal M<sub>j,k</sub>:</strong> Measure cross-coupling between parameter j and parameter k</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-300">2. Inverse Matrix [M⁻¹] &amp; Parameter Errors</div>
                    <p className="text-slate-400 leading-snug">
                      Inverse matrix satisfying <code className="font-mono text-emerald-300">[M][M⁻¹] = I</code>. Its diagonal elements act as error multipliers:
                    </p>
                    <code className="block font-mono text-emerald-200 bg-slate-950 p-1.5 rounded text-[10.5px]">
                      σ(X<sub>j</sub>) = √( s² · M⁻¹<sub>j,j</sub> )
                    </code>
                    <p className="text-[10px] text-slate-400">
                      Because M has large entries (~10³), M⁻¹ has small entries (~10⁻⁴), scaling residual variance s² to precise standard deviations for lattice constants.
                    </p>
                  </div>
                </div>

                {/* Peak-by-Peak Term Contributions Table */}
                {showPeakTermTable && refinementResult.validPeaks && refinementResult.basisMatrix && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Reflection-by-Reflection Contribution Breakdown Table:</span>
                      <span className="text-[10px] font-mono text-indigo-400">Summing columns directly equals M matrix entries</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900">
                      <table className="w-full text-left border-collapse text-[10.5px] font-mono">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <th className="p-2">Peak #</th>
                            <th className="p-2">(h, k, l)</th>
                            <th className="p-2">2θ (°)</th>
                            <th className="p-2">sin²θ</th>
                            <th className="p-2 text-indigo-300">g₀,i</th>
                            <th className="p-2 text-amber-300">g₁,i (f(θ))</th>
                            <th className="p-2 text-indigo-400 font-bold">(g₀,i)² [→ M₀,₀]</th>
                            <th className="p-2 text-purple-400">g₀,i · g₁,i [→ M₀,₁]</th>
                            <th className="p-2 text-amber-400">(g₁,i)² [→ M₁,₁]</th>
                            <th className="p-2 text-cyan-400">g₀,i · sin²θ [→ Y₀]</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refinementResult.validPeaks.map((p, idx) => {
                            const basis = refinementResult.basisMatrix[idx];
                            const g0 = basis[0] || 0;
                            const g1 = basis[basis.length - 1] || 0;
                            const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
                            const sin2 = Math.sin(thetaRad) * Math.sin(thetaRad);

                            return (
                              <tr key={p.id || idx} className="border-b border-slate-800/50 hover:bg-slate-800/40 text-slate-300">
                                <td className="p-2 text-slate-500">#{idx + 1}</td>
                                <td className="p-2 font-bold text-indigo-300">({p.h}, {p.k}, {p.l})</td>
                                <td className="p-2">{p.twoTheta.toFixed(3)}°</td>
                                <td className="p-2">{sin2.toFixed(5)}</td>
                                <td className="p-2 text-indigo-300">{g0.toFixed(2)}</td>
                                <td className="p-2 text-amber-300">{g1.toFixed(4)}</td>
                                <td className="p-2 font-bold text-indigo-400 bg-indigo-950/20">{(g0 * g0).toFixed(2)}</td>
                                <td className="p-2 text-purple-300">{(g0 * g1).toFixed(4)}</td>
                                <td className="p-2 text-amber-300">{(g1 * g1).toFixed(5)}</td>
                                <td className="p-2 text-cyan-300">{(g0 * sin2).toFixed(5)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-indigo-950/80 font-bold text-white border-t-2 border-indigo-500/50 text-[11px]">
                            <td colSpan={6} className="p-2.5 text-right uppercase tracking-wider text-indigo-300">
                              TOTAL SUM (Matrix Entries):
                            </td>
                            <td className="p-2.5 text-indigo-300 font-extrabold text-xs">
                              {refinementResult.matrixM[0]?.[0]?.toFixed(3)}
                            </td>
                            <td className="p-2.5 text-purple-300 font-extrabold">
                              {refinementResult.matrixM[0]?.[1]?.toFixed(3)}
                            </td>
                            <td className="p-2.5 text-amber-300 font-extrabold">
                              {refinementResult.matrixM[1]?.[1]?.toFixed(4)}
                            </td>
                            <td className="p-2.5 text-cyan-300 font-extrabold">
                              {refinementResult.vectorY[0]?.toFixed(4)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Peak Entry Bar & Custom Controls */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 relative z-10">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  Manual Reflection Entry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add custom peak observations $(h, k, l, 2\theta)$ directly or paste bulk diffraction datasets
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Paste Bulk Data
                </button>
                <button
                  type="button"
                  onClick={handleClearAllPeaks}
                  className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>

            {/* Manual Peak Inputs Grid Form */}
            <form onSubmit={handleAddCustomPeak} className="grid grid-cols-2 sm:grid-cols-6 gap-4 items-end relative z-10">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  Miller <i>h</i>
                </label>
                <input
                  type="number"
                  value={newH}
                  onChange={(e) => setNewH(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  Miller <i>k</i>
                </label>
                <input
                  type="number"
                  value={newK}
                  onChange={(e) => setNewK(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  Miller <i>l</i>
                </label>
                <input
                  type="number"
                  value={newL}
                  onChange={(e) => setNewL(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  2θ Observed (°)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-sm font-black font-mono text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  Intensity (%)
                </label>
                <input
                  type="number"
                  value={newIntensity}
                  onChange={(e) => setNewIntensity(parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Peak
                </button>
              </div>
            </form>
          </div>

          {/* Table of Reflection Residuals & Peaks Editing */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Diffraction Reflection Data ({peaks.length} Peaks)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Observed vs Calculated 2θ angles, drift functions <i>f</i>(θ), and residuals (Δsin²θ)
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {activeResults && activeResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportActiveResults}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    Import Bragg ({activeResults.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddPeak}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">HKL (<i>h</i>, <i>k</i>, <i>l</i>)</th>
                    <th className="p-3">2θ<sub>Obs</sub> (°)</th>
                    <th className="p-3">2θ<sub>Calc</sub> (°)</th>
                    <th className="p-3">Δ2θ (°)</th>
                    <th className="p-3">sin²θ<sub>Obs</sub></th>
                    <th className="p-3">sin²θ<sub>Calc</sub></th>
                    <th className="p-3">Drift <i>f</i>(θ)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {refinementResult.peakDetails.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={p.h}
                            onChange={(e) => handleUpdatePeak(p.id, 'h', parseInt(e.target.value) || 0)}
                            className="w-10 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-bold"
                          />
                          <input
                            type="number"
                            value={p.k}
                            onChange={(e) => handleUpdatePeak(p.id, 'k', parseInt(e.target.value) || 0)}
                            className="w-10 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-bold"
                          />
                          <input
                            type="number"
                            value={p.l}
                            onChange={(e) => handleUpdatePeak(p.id, 'l', parseInt(e.target.value) || 0)}
                            className="w-10 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-bold"
                          />
                        </div>
                      </td>
                      <td className="p-3 font-bold">
                        <input
                          type="number"
                          step="0.001"
                          value={p.twoTheta}
                          onChange={(e) => handleUpdatePeak(p.id, 'twoTheta', parseFloat(e.target.value) || 30)}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold text-indigo-600 dark:text-indigo-400"
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {p.twoThetaCalc.toFixed(Math.min(precision, 3))}
                      </td>
                      <td className={`p-3 font-bold ${
                        Math.abs(p.deltaTwoTheta) < 0.05 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {p.deltaTwoTheta > 0 ? `+${p.deltaTwoTheta.toFixed(4)}` : p.deltaTwoTheta.toFixed(4)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400"><FormatSci val={p.sin2Obs} digits={5} /></td>
                      <td className="p-3 text-slate-600 dark:text-slate-400"><FormatSci val={p.sin2Calc} digits={5} /></td>
                      <td className="p-3 text-slate-500"><FormatSci val={p.driftVal} digits={4} /></td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeletePeak(p.id)}
                          disabled={peaks.length <= 2}
                          className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                          title="Delete Reflection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational Methodological Guide */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Theoretical Foundation: Why Cohen's Method is the Ultimate Matrix Approach
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Unlike graphical extrapolation (which requires manual fitting of high-angle reflections above 2θ &gt; 60°), 
              <strong> Cohen's Least Squares Method</strong> utilizes all measured reflections across the entire pattern simultaneously. By expressing Bragg's Law with an additive systematic error term D · f(θ), it sets up a system of linear normal equations [M]X = Y.
              The inverse matrix [M⁻¹] directly supplies the parameter covariance, allowing analytical computation of standard errors ± σ(a), ± σ(b), ± σ(c) without subjective graph interpretation or plotting bias.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Peak Import Modal Overlay */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Paste Bulk Reflection Data
                  </h3>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Paste rows of peak data. Formats supported (one reflection per line):
                  <br />
                  <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold">2Theta, h, k, l</code> or <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold">h, k, l, 2Theta</code>
                </p>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 space-y-1">
                  <div>Example lines:</div>
                  <div className="text-indigo-600 dark:text-indigo-300">28.442, 1, 1, 1</div>
                  <div className="text-indigo-600 dark:text-indigo-300">47.302, 2, 2, 0</div>
                  <div className="text-indigo-600 dark:text-indigo-300">56.121, 3, 1, 1</div>
                </div>

                <textarea
                  rows={7}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste diffraction reflections here..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleParseBulkPeaks}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Parse & Load Reflections
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comprehensive Import Active Bragg & Custom Spec Configuration Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden text-white flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-amber-300">
                    <Zap className="w-5 h-5 fill-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                      Import Active Bragg &amp; Custom Spec Configuration
                    </h3>
                    <p className="text-xs text-indigo-200/80">
                      Specify material name, crystal symmetry, X-ray wavelength, error drift model, and customize HKL reflection peaks.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-6">
                {/* Section 1: Sample Parameters */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Tag className="w-4 h-4" />
                    <span>1. Material &amp; Instrumental Specifications</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sample Name */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-300">
                        Sample / Material Name:
                      </label>
                      <input
                        type="text"
                        value={importSampleName}
                        onChange={(e) => setImportSampleName(e.target.value)}
                        placeholder="e.g. Silicon Powder Standard (SRM 640) / Custom Alloy"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Crystal System Symmetry */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Crystal System Symmetry:
                      </label>
                      <select
                        value={importCrystalSystem}
                        onChange={(e) => setImportCrystalSystem(e.target.value as CrystalSystem)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Cubic">Cubic (a = b = c, α=β=γ=90°)</option>
                        <option value="Tetragonal">Tetragonal (a = b ≠ c, α=β=γ=90°)</option>
                        <option value="Hexagonal">Hexagonal (a = b ≠ c, α=β=90°, γ=120°)</option>
                        <option value="Orthorhombic">Orthorhombic (a ≠ b ≠ c, α=β=γ=90°)</option>
                        <option value="Monoclinic">Monoclinic (a ≠ b ≠ c, α=γ=90°, β≠90°)</option>
                      </select>
                    </div>

                    {/* Systematic Error Drift Function */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Systematic Error Drift Model f(θ):
                      </label>
                      <select
                        value={importDriftType}
                        onChange={(e) => setImportDriftType(e.target.value as DriftFunctionType)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="nelson_riley">Nelson-Riley: ½(cos²θ/sinθ + cos²θ/θ)</option>
                        <option value="bradley_jay">Bradley-Jay: cos²θ</option>
                        <option value="sample_displacement">Sample Displacement: cos²θ sinθ</option>
                        <option value="hess_hagg">Hess-Hägg: sin²(2θ)</option>
                        <option value="zero_shift">Pure Zero Shift: cosθ</option>
                      </select>
                    </div>

                    {/* Radiation Source Wavelength */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-300">
                          X-Ray Wavelength λ (Å):
                        </label>
                        <span className="text-xs font-mono font-bold text-indigo-300">
                          Current: {importWavelength} Å
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="number"
                          step="0.00001"
                          value={importWavelength}
                          onChange={(e) => setImportWavelength(parseFloat(e.target.value) || 1.54056)}
                          className="w-36 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-black text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { name: 'Cu Kα1', val: 1.54056 },
                            { name: 'Cu Kα', val: 1.54184 },
                            { name: 'Co Kα1', val: 1.78896 },
                            { name: 'Mo Kα1', val: 0.70930 },
                            { name: 'Fe Kα1', val: 1.93604 },
                          ].map(src => (
                            <button
                              type="button"
                              key={src.name}
                              onClick={() => setImportWavelength(src.val)}
                              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                Math.abs(importWavelength - src.val) < 0.0001
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {src.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Bragg Reflections HKL & 2Theta Table */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        2. Bragg Reflection Peaks Table ({importPeaks.length} Reflections)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleModalSortPeaks}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg flex items-center gap-1 border border-slate-700 transition-colors"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                        Sort 2θ
                      </button>
                      <button
                        type="button"
                        onClick={handleModalAddPeak}
                        className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1 border border-emerald-800/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Peak
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                        <tr>
                          <th className="p-2.5 text-center w-12">#</th>
                          <th className="p-2.5">Miller Index (h)</th>
                          <th className="p-2.5">Miller Index (k)</th>
                          <th className="p-2.5">Miller Index (l)</th>
                          <th className="p-2.5">Diffraction 2θ (°)</th>
                          <th className="p-2.5">Intensity (%)</th>
                          <th className="p-2.5 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {importPeaks.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-2 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={p.h}
                                onChange={(e) => handleModalUpdatePeak(p.id, 'h', parseInt(e.target.value, 10) || 0)}
                                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-indigo-300 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={p.k}
                                onChange={(e) => handleModalUpdatePeak(p.id, 'k', parseInt(e.target.value, 10) || 0)}
                                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-indigo-300 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={p.l}
                                onChange={(e) => handleModalUpdatePeak(p.id, 'l', parseInt(e.target.value, 10) || 0)}
                                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-indigo-300 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.001"
                                value={p.twoTheta}
                                onChange={(e) => handleModalUpdatePeak(p.id, 'twoTheta', parseFloat(e.target.value) || 0)}
                                className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-amber-300 font-bold outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={p.intensity}
                                onChange={(e) => handleModalUpdatePeak(p.id, 'intensity', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-slate-300 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleModalRemovePeak(p.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                                title="Remove peak"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-400">
                  Ready to configure <strong className="text-indigo-300">{importSampleName || 'Custom Sample'}</strong> ({importPeaks.length} reflections, {importCrystalSystem} system).
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyImportedSpecs}
                    className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Apply &amp; Import to Refinement
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
