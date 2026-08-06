import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MATERIAL_DB } from '../utils/materialDB';
import { BraggResult } from '../types';
import spectralDiffBg from '../src/assets/images/spectral_diff_bg_1786058246516.jpg';
import { 
  Layers, 
  ChevronDown, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Database, 
  Upload, 
  Search, 
  Plus, 
  Sparkles, 
  FlaskConical, 
  FileText, 
  Sliders,
  AlertTriangle,
  Info,
  Activity,
  Grid,
  Eye,
  Download,
  Layers3,
  Maximize2,
  SlidersHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

interface DiffractionCompareModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string | null;
}

export const DiffractionCompareModule: React.FC<DiffractionCompareModuleProps> = ({
  activeResults = [],
  activeMaterialName = null
}) => {
  const { t } = useTranslation();

  // ----------------------------------------------------
  // Robust Dynamic Custom Pattern Parser
  // ----------------------------------------------------
  const parseCustomPattern = (patternStr: string) => {
    if (!patternStr) return [];
    const entries = patternStr.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
    return entries.map(entry => {
      let twoTheta = NaN;
      let hkl = '';
      let intensity = 100;

      const parenIndex = entry.indexOf('(');
      if (parenIndex !== -1) {
        const thetaStr = entry.substring(0, parenIndex).trim();
        twoTheta = parseFloat(thetaStr);

        const insideParen = entry.substring(parenIndex + 1, entry.indexOf(')'));
        const insideParts = insideParen.split(',').map(p => p.trim());
        if (insideParts.length > 0) {
          const numericPart = parseFloat(insideParts[0]);
          if (!isNaN(numericPart) && insideParts.length === 1) {
            intensity = numericPart;
            hkl = '';
          } else if (insideParts.length === 2) {
            hkl = insideParts[0];
            const parsedInt = parseFloat(insideParts[1]);
            if (!isNaN(parsedInt)) {
              intensity = parsedInt;
            }
          } else {
            hkl = insideParts[0];
          }
        }
      } else {
        const parts = entry.replace(/\s+/g, ' ').split(' ');
        if (parts.length >= 1) {
          twoTheta = parseFloat(parts[0]);
        }
        if (parts.length >= 2) {
          const parsedValue = parseFloat(parts[1]);
          if (!isNaN(parsedValue)) {
            intensity = parsedValue;
          } else {
            hkl = parts[1];
          }
        }
        if (parts.length >= 3) {
          const parsedValue = parseFloat(parts[2]);
          if (!isNaN(parsedValue)) {
            intensity = parsedValue;
          }
        }
      }
      return { twoTheta, intensity, hkl };
    }).filter(p => !isNaN(p.twoTheta));
  };

  // ----------------------------------------------------
  // State Initialization
  // ----------------------------------------------------
  
  // Experimental Mode (Sample A)
  const [expMode, setExpMode] = useState<'active' | 'custom'>(() => {
    return activeResults && activeResults.length > 0 ? 'active' : 'custom';
  });
  const [customExpName, setCustomExpName] = useState<string>('My Synthesized Sample (HAp-Exp)');
  const [customExpFormula, setCustomExpFormula] = useState<string>('Ca10(PO4)6(OH)2');
  const [customExpPattern, setCustomExpPattern] = useState<string>(
    '25.87(30), 31.77(100), 32.19(70), 32.90(65), 34.08(45), 46.71(35), 49.46(30)'
  );

  // Database / Reference Mode (Sample B)
  const [refMode, setRefMode] = useState<'preset' | 'custom'>('preset');
  const [selectedMaterialBName, setSelectedMaterialBName] = useState<string>(() => {
    if (activeMaterialName) {
      const match = MATERIAL_DB.find(
        m => m.name.toLowerCase().includes(activeMaterialName.toLowerCase()) || 
             activeMaterialName.toLowerCase().includes(m.name.toLowerCase())
      );
      if (match) return match.name;
    }
    // Preferred default Hydroxyapatite
    const haMatch = MATERIAL_DB.find(m => m.name.toLowerCase().includes('hydroxyapatite'));
    if (haMatch) return haMatch.name;
    return MATERIAL_DB[5].name;
  });

  const [customRefName, setCustomRefName] = useState<string>('Hydroxyapatite PDF Reference (ASTM-09)');
  const [customRefFormula, setCustomRefFormula] = useState<string>('Ca10(PO4)6(OH)2');
  const [customRefCrystalSystem, setCustomRefCrystalSystem] = useState<string>('Hexagonal');
  const [customRefSpaceGroup, setCustomRefSpaceGroup] = useState<string>('P63/m');
  const [customRefPattern, setCustomRefPattern] = useState<string>(
    '25.88(25), 31.78(100), 32.20(60), 32.90(60), 34.00(40), 46.72(30), 49.48(25)'
  );

  const [searchBText, setSearchBText] = useState<string>('');

  // ----------------------------------------------------
  // Material Derivations
  // ----------------------------------------------------
  const userSampleMaterial = useMemo(() => {
    if (!activeResults || activeResults.length === 0) return null;
    return {
      name: 'Active Experimental Results',
      formula: activeMaterialName || 'Unknown Phase',
      crystalSystem: t('Synthesized'),
      spaceGroup: t('Custom Peaks'),
      isUserSample: true,
      pattern: activeResults.map(r => `${r.twoTheta}(${r.hkl || ''})`).join(', '),
      results: activeResults
    };
  }, [activeResults, activeMaterialName, t]);

  const materialA = useMemo(() => {
    if (expMode === 'active' && userSampleMaterial) {
      return userSampleMaterial;
    }
    return {
      name: customExpName,
      formula: customExpFormula,
      crystalSystem: t('Experimental'),
      spaceGroup: t('Custom Peaks'),
      isUserSample: true,
      results: parseCustomPattern(customExpPattern)
    };
  }, [expMode, userSampleMaterial, customExpName, customExpFormula, customExpPattern, t]);

  const materialB = useMemo(() => {
    if (refMode === 'preset') {
      return MATERIAL_DB.find(m => m.name === selectedMaterialBName) || MATERIAL_DB[5];
    }
    return {
      name: customRefName,
      formula: customRefFormula,
      crystalSystem: customRefCrystalSystem,
      spaceGroup: customRefSpaceGroup,
      isUserSample: true,
      results: parseCustomPattern(customRefPattern)
    };
  }, [refMode, selectedMaterialBName, customRefName, customRefFormula, customRefCrystalSystem, customRefSpaceGroup, customRefPattern]);

  // Clone active preset values to custom fields to tweak
  const handleCopyPresetToCustom = () => {
    const activePreset = MATERIAL_DB.find(m => m.name === selectedMaterialBName) || MATERIAL_DB[5];
    setCustomRefName(`${activePreset.name} (Tweak/Import)`);
    setCustomRefFormula(activePreset.formula);
    setCustomRefCrystalSystem(activePreset.crystalSystem || 'Orthorhombic');
    setCustomRefSpaceGroup(activePreset.spaceGroup || 'P21/c');
    setCustomRefPattern(activePreset.pattern || '');
    setRefMode('custom');
  };

  // ----------------------------------------------------
  // Match & Residual Diagnostics Logic
  // ----------------------------------------------------
  const analysis = useMemo(() => {
    const parsePatternToPeaks = (mat: any) => {
      if (!mat) return [];
      if (mat.isUserSample) {
        return (mat.results || []).map((r: any) => ({
          twoTheta: r.twoTheta,
          intensity: r.intensity !== undefined ? r.intensity : 100
        }));
      }
      const pattern = mat.pattern || '';
      return pattern.split(',').map((s: string) => {
        const [thetaStr] = s.split('(');
        return {
          twoTheta: parseFloat(thetaStr.trim()),
          intensity: 100
        };
      }).filter((p: any) => !isNaN(p.twoTheta));
    };

    const pA = parsePatternToPeaks(materialA);
    const pB = parsePatternToPeaks(materialB);

    const shifts: { peak: number; shift: number; type: string }[] = [];
    const missingInA: number[] = [];
    const extraInA: number[] = [];

    // Find shifts and extra peaks in A compared to reference B
    pA.forEach((peakA: any) => {
      // Find closest reference peak in B within 1.0 degrees
      const closestRef = pB.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - peakA.twoTheta) < Math.abs(prev.twoTheta - peakA.twoTheta) ? curr : prev;
      }, null);

      if (closestRef && Math.abs(closestRef.twoTheta - peakA.twoTheta) <= 0.6) {
        const shiftVal = peakA.twoTheta - closestRef.twoTheta;
        if (Math.abs(shiftVal) >= 0.005) {
          shifts.push({
            peak: peakA.twoTheta,
            shift: shiftVal,
            type: shiftVal > 0 ? 'higher' : 'lower'
          });
        }
      } else {
        extraInA.push(peakA.twoTheta);
      }
    });

    // Find missing peaks in A that are expected in Reference B
    pB.forEach((peakB: any) => {
      const closestA = pA.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - peakB.twoTheta) < Math.abs(prev.twoTheta - peakB.twoTheta) ? curr : prev;
      }, null);

      if (!closestA || Math.abs(closestA.twoTheta - peakB.twoTheta) > 0.6) {
        missingInA.push(peakB.twoTheta);
      }
    });

    return { shifts, missingInA, extraInA };
  }, [materialA, materialB]);

  // ----------------------------------------------------
  // Simulated Pattern Generator
  // ----------------------------------------------------
  const generateChartData = (matA: any, matB: any) => {
    const minTheta = 10;
    const maxTheta = 90;
    const step = 0.1;

    const parsePattern = (material: any) => {
      if (!material) return [];
      if (material.isUserSample) {
        return (material.results || []).map((r: any) => ({
          twoTheta: r.twoTheta,
          intensity: r.intensity !== undefined ? r.intensity : 100,
          hkl: r.hkl || ''
        }));
      }
      const pattern = material.pattern || '';
      return pattern.split(',').map((s: string) => {
        const [thetaStr, hklStr] = s.split('(');
        const theta = parseFloat(thetaStr.trim());
        return {
          twoTheta: theta,
          intensity: 100, // standard peak
          hkl: hklStr ? hklStr.replace(')', '').trim() : ''
        };
      }).filter((p: any) => !isNaN(p.twoTheta));
    };

    const peaksA = parsePattern(matA);
    const peaksB = parsePattern(matB);

    const points = [];
    for (let x = minTheta; x <= maxTheta; x += step) {
      let intensityA = Math.random() * 0.5 + 1.5; // low experimental noise
      let intensityB = Math.random() * 0.5 + 1.5; 

      const hwA = 0.12; // narrow width
      peaksA.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
          const g = Math.exp(-Math.log(2) * Math.pow(diff / hwA, 2));
          const l = 1 / (1 + Math.pow(diff / hwA, 2));
          intensityA += p.intensity * (0.5 * g + 0.5 * l);
        }
      });

      const hwB = 0.12;
      peaksB.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
          const g = Math.exp(-Math.log(2) * Math.pow(diff / hwB, 2));
          const l = 1 / (1 + Math.pow(diff / hwB, 2));
          intensityB += p.intensity * (0.5 * g + 0.5 * l);
        }
      });

      const finalA = Math.min(100, intensityA);
      const finalB = Math.min(100, intensityB);
      const difference = finalA - finalB;

      points.push({
        twoTheta: Number(x.toFixed(2)),
        intensityA: Number(finalA.toFixed(1)),
        intensityB: Number(finalB.toFixed(1)),
        mirroredB: Number((-finalB).toFixed(1)),
        difference: Number(difference.toFixed(1)),
      });
    }

    return { points, peaksA, peaksB };
  };

  // ----------------------------------------------------
  // Zooming & UI states
  // ----------------------------------------------------
  const [left, setLeft] = useState<number | string>('dataMin');
  const [right, setRight] = useState<number | string>('dataMax');
  const [refAreaLeft, setRefAreaLeft] = useState<number | string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | string | null>(null);

  // Spectral Diff Custom UI Controls
  const [viewMode, setViewMode] = useState<'stacked' | 'unified' | 'mirrored'>('stacked');
  const [diffTheme, setDiffTheme] = useState<'neon' | 'emerald' | 'amber'>('neon');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDiffArea, setShowDiffArea] = useState<boolean>(true);

  const zoom = () => {
    let zoomLeft = refAreaLeft;
    let zoomRight = refAreaRight;

    if (zoomLeft === zoomRight || zoomRight === null || zoomLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    if (zoomLeft > zoomRight) {
      [zoomLeft, zoomRight] = [zoomRight, zoomLeft];
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
    setLeft(zoomLeft);
    setRight(zoomRight);
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const panLeft = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = Math.max(10, range * 0.1);
      setLeft(left - shift);
      setRight(right - shift);
    }
  };

  const panRight = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = Math.max(10, range * 0.1);
      setLeft(left + shift);
      setRight(right + shift);
    }
  };

  const zoomInStep = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = range * 0.1;
      setLeft(left + shift);
      setRight(right - shift);
    } else {
      setLeft(10);
      setRight(90);
    }
  };

  const zoomOutStep = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = range * 0.1;
      setLeft(Math.max(10, left - shift));
      setRight(Math.min(90, right + shift));
    }
  };

  const isZoomedIn = typeof left === 'number' && typeof right === 'number';

  const { points } = useMemo(() => generateChartData(materialA, materialB), [materialA, materialB]);

  // Real-time scientific residuals & goodness of fit metrics
  const spectralMetrics = useMemo(() => {
    if (!points || points.length === 0) return { rP: '0.00', rWP: '0.00', pearsonR: '0.0', maxDiff: '0.0', rmsd: '0.00' };
    let sumAbsDiff = 0;
    let sumObsA = 0;
    let sumSqDiff = 0;
    let sumSqObsA = 0;
    let sumA = 0;
    let sumB = 0;
    let maxDiff = 0;

    points.forEach(p => {
      const diff = Math.abs(p.difference);
      sumAbsDiff += diff;
      sumObsA += p.intensityA;
      sumSqDiff += Math.pow(p.difference, 2);
      sumSqObsA += Math.pow(p.intensityA, 2);
      sumA += p.intensityA;
      sumB += p.intensityB;
      if (diff > maxDiff) maxDiff = diff;
    });

    const n = points.length;
    const meanA = sumA / n;
    const meanB = sumB / n;

    let numPearson = 0;
    let denA = 0;
    let denB = 0;

    points.forEach(p => {
      const dA = p.intensityA - meanA;
      const dB = p.intensityB - meanB;
      numPearson += dA * dB;
      denA += dA * dA;
      denB += dB * dB;
    });

    const rP = sumObsA > 0 ? (sumAbsDiff / sumObsA) * 100 : 0;
    const rWP = sumSqObsA > 0 ? Math.sqrt(sumSqDiff / sumSqObsA) * 100 : 0;
    const pearsonR = (denA > 0 && denB > 0) ? (numPearson / Math.sqrt(denA * denB)) * 100 : 0;
    const rmsd = Math.sqrt(sumSqDiff / n);

    return {
      rP: rP.toFixed(2),
      rWP: rWP.toFixed(2),
      pearsonR: pearsonR.toFixed(1),
      maxDiff: maxDiff.toFixed(1),
      rmsd: rmsd.toFixed(2)
    };
  }, [points]);

  const filteredPresetMaterials = useMemo(() => {
    if (!searchBText) return MATERIAL_DB;
    const lower = searchBText.toLowerCase();
    return MATERIAL_DB.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.formula.toLowerCase().includes(lower) ||
      (m.crystalSystem && m.crystalSystem.toLowerCase().includes(lower))
    );
  }, [searchBText]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" id="diffraction-compare-module">
      {/* ----------------------------------------------------
          Configuration Header Grid (Two-Column Layout)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sample A: Experimental / Target Data Container */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {t('Sample A: Experimental / Synthesized Data')}
                </label>
              </div>
              
              {/* Tabs for Experimental data origin */}
              <div className="bg-black/40 p-0.5 rounded-lg border border-slate-800 flex gap-1">
                {userSampleMaterial && (
                  <button 
                    onClick={() => setExpMode('active')}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                      expMode === 'active' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('Active Results')}
                  </button>
                )}
                <button 
                  onClick={() => setExpMode('custom')}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                    expMode === 'custom' 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('Paste Peaks')}
                </button>
              </div>
            </div>

            {expMode === 'active' && userSampleMaterial ? (
              <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black">{t('Target Name/Phase')}</span>
                    <span className="text-xs text-white font-bold">{userSampleMaterial.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black">{t('Formula Reference')}</span>
                    <span className="text-xs text-indigo-300 font-mono font-bold">{userSampleMaterial.formula}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase font-black">{t('Peaks Detected')}</span>
                    <span className="text-xs text-indigo-400 font-mono font-bold">
                      {activeResults.length} {t('Peaks')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">{t('Sample Label')}</span>
                    <input 
                      type="text" 
                      value={customExpName}
                      onChange={(e) => setCustomExpName(e.target.value)}
                      placeholder={t('My Phase A')}
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-indigo-500/50 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">{t('Chemical Formula')}</span>
                    <input 
                      type="text" 
                      value={customExpFormula}
                      onChange={(e) => setCustomExpFormula(e.target.value)}
                      placeholder="e.g. Ca5(PO4)3OH"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-indigo-500/50 outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{t('Raw Peaks list')}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{t('Format: 2θ(Relative_Intensity)')}</span>
                  </div>
                  <textarea 
                    value={customExpPattern}
                    onChange={(e) => setCustomExpPattern(e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:border-indigo-500/50 outline-none font-mono tracking-tight resize-none"
                    placeholder="25.87(20), 31.77(100), 32.19(60)"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/60">
            <div className="px-3 py-1.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/15">
              {materialA?.crystalSystem ? t(materialA.crystalSystem) : t("Unknown")}
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-800/40 text-slate-400 text-[10px] font-mono border border-slate-800">
              SG: {materialA?.spaceGroup || "Unknown"}
            </div>
          </div>
        </div>

        {/* Sample B: Dedicated Database / Reference Material Container */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {t('Sample B: Database / Reference Material')}
                </label>
              </div>

              {/* Toggle tabs for preset vs importing reference material */}
              <div className="bg-black/40 p-0.5 rounded-lg border border-slate-800 flex gap-1">
                <button 
                  onClick={() => setRefMode('preset')}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                    refMode === 'preset' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('Preset Database')}
                </button>
                <button 
                  onClick={() => setRefMode('custom')}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                    refMode === 'custom' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('Import / Custom')}
                </button>
              </div>
            </div>

            {refMode === 'preset' ? (
              <div className="space-y-3">
                {/* Search presets bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
                  <input 
                    type="text"
                    value={searchBText}
                    onChange={(e) => setSearchBText(e.target.value)}
                    placeholder={t('Search Database Materials (e.g. Quartz, Hydroxyapatite)...')}
                    className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:border-emerald-500/50 outline-none font-medium placeholder-slate-600 transition-colors"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedMaterialBName}
                    onChange={(e) => setSelectedMaterialBName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-black/60 border border-slate-800 text-slate-200 outline-none rounded-xl text-xs font-mono font-bold appearance-none hover:border-emerald-500/50 transition-colors"
                  >
                    {filteredPresetMaterials.map(m => (
                      <option key={m.name} value={m.name}>
                        {t(m.name)} ({m.formula})
                      </option>
                    ))}
                    {filteredPresetMaterials.length === 0 && (
                      <option value="" disabled>{t('No matching materials found')}</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Reference Name')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefName}
                      onChange={(e) => setCustomRefName(e.target.value)}
                      placeholder={t('PDF Card #09-0432')}
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Ref Formula')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefFormula}
                      onChange={(e) => setCustomRefFormula(e.target.value)}
                      placeholder="Ca10(PO4)6(OH)2"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Crystal System')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefCrystalSystem}
                      onChange={(e) => setCustomRefCrystalSystem(e.target.value)}
                      placeholder="Hexagonal"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Space Group')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefSpaceGroup}
                      onChange={(e) => setCustomRefSpaceGroup(e.target.value)}
                      placeholder="P63/m"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      {t('Peaks or PDF Card Pattern')}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">
                      {t('Format: 2θ(Intensity) or 2θ(HKL, Intensity)')}
                    </span>
                  </div>
                  <textarea 
                    value={customRefPattern}
                    onChange={(e) => setCustomRefPattern(e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-mono tracking-tight resize-none"
                    placeholder="25.88(25), 31.78(100), 32.20(60)"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800/60">
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/15">
                {materialB?.crystalSystem ? t(materialB.crystalSystem) : t("Unknown")}
              </div>
              <div className="px-3 py-1.5 rounded bg-slate-800/40 text-slate-400 text-[10px] font-mono border border-slate-800">
                SG: {materialB?.spaceGroup || "Unknown"}
              </div>
            </div>

            {refMode === 'preset' && (
              <button 
                onClick={handleCopyPresetToCustom}
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors py-1 px-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15"
                title={t('Tweak and modify this preset pattern')}
              >
                <Sparkles className="w-3 h-3" />
                {t('Tweak Reference')}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------
          Diagnostics & Shift Analyzer Panel
          ---------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-black uppercase text-white tracking-wider">{t('Diffraction Match & Residual Diagnostics')}</span>
          </div>
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/15 font-mono">
            {t('Residual Analyzer v1.5')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Position shift analysis column */}
          <div className="bg-black/40 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-amber-500"></span>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Position Shift Analysis')}</h4>
            </div>
            
            <div className="h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
              {analysis.shifts.length > 0 ? (
                analysis.shifts.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <span className="text-[10px] font-mono font-bold text-slate-300">2θ ≈ {s.peak.toFixed(2)}°</span>
                    <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded ${
                      s.shift > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {s.shift > 0 ? `+${s.shift.toFixed(3)}°` : `${s.shift.toFixed(3)}°`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic py-4 text-center">{t('No significant shift detected')}</div>
              )}
            </div>
            <p className="text-[8px] text-slate-500 leading-normal">
              {t('Peak shifts reveal systematic unit cell expansion or contraction, often due to dopant substitution or lattice strains.')}
            </p>
          </div>

          {/* Missing / Suppressed peaks column */}
          <div className="bg-black/40 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-red-500"></span>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Suppressed / Missing Peaks')}</h4>
            </div>

            <div className="h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
              {analysis.missingInA.length > 0 ? (
                analysis.missingInA.map((theta, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{t('Ref Database Peak')}</span>
                    <span className="text-[10px] font-black font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      {theta.toFixed(2)}°
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic py-4 text-center">{t('No suppressed reference peaks')}</div>
              )}
            </div>
            <p className="text-[8px] text-slate-500 leading-normal">
              {t('Suppressed or missing peaks denote low crystallite size/crystallinity, or highly oriented sample alignment.')}
            </p>
          </div>

          {/* Extra secondary phases column */}
          <div className="bg-black/40 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-indigo-500"></span>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Impurities / Extra Peaks')}</h4>
            </div>

            <div className="h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
              {analysis.extraInA.length > 0 ? (
                analysis.extraInA.map((theta, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-450 font-bold">{t('Atypical Peak')}</span>
                    <span className="text-[10px] font-black font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {theta.toFixed(2)}°
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic py-4 text-center">{t('No secondary phases detected')}</div>
              )}
            </div>
            <p className="text-[8px] text-slate-505 leading-normal">
              {t('Atypical peaks point to unreacted precursors, secondary reaction pathways or organic mineral contaminants.')}
            </p>
          </div>

        </div>
      </div>

      {/* ----------------------------------------------------
          Visual Spectral Diff/Compare Charts
          ---------------------------------------------------- */}
      <div className="bg-[#050A14] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden group space-y-6">
        
        {/* Custom Background Graphic */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
          <img src={spectralDiffBg} alt="Spectral Overlay Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/40" />
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />

        {/* Header Title & Badges */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="relative group/icon cursor-default">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover/icon:bg-indigo-400/30 transition-all duration-700 pointer-events-none" />
              <div className="w-14 h-14 bg-[#080d1a] rounded-2xl border border-indigo-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/icon:border-indigo-400 transition-colors duration-500 overflow-hidden">
                <Layers className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] group-hover/icon:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>{t('Spectral Diff Overlay')}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                  v2.0 HUD
                </span>
              </h3>
              <p className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-[pulse_2s_ease-in-out_infinite]" />
                {t('Experimental (Sample A) vs Reference (Sample B) & Intensity Residuals')}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Residual R_p</span>
              <span className="text-sm font-mono font-black text-rose-400">{spectralMetrics.rP}%</span>
            </div>
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Weighted R_wp</span>
              <span className="text-sm font-mono font-black text-amber-400">{spectralMetrics.rWP}%</span>
            </div>
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cross-Corr (r)</span>
              <span className="text-sm font-mono font-black text-emerald-400">{spectralMetrics.pearsonR}%</span>
            </div>
            <div className="bg-[#080E1C]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">RMS Error</span>
              <span className="text-sm font-mono font-black text-cyan-400">{spectralMetrics.rmsd} cnt</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 bg-[#080E1C]/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
          
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('stacked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'stacked' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers3 className="w-3.5 h-3.5" />
              <span>3-Pane Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'unified' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Unified Overlay</span>
            </button>
            <button
              onClick={() => setViewMode('mirrored')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'mirrored' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Butterfly Mirror</span>
            </button>
          </div>

          {/* Theme & Display Options */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Color Palette Selector */}
            <div className="flex items-center gap-1 bg-[#030712] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDiffTheme('neon')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  diffTheme === 'neon' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Neon
              </button>
              <button
                onClick={() => setDiffTheme('emerald')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  diffTheme === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Emerald
              </button>
              <button
                onClick={() => setDiffTheme('amber')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  diffTheme === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Amber
              </button>
            </div>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                showGrid ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
              }`}
              title="Toggle Gridlines"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Diff Fill Toggle */}
            <button
              onClick={() => setShowDiffArea(!showDiffArea)}
              className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                showDiffArea ? 'bg-slate-800 text-amber-400 border-amber-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
              }`}
              title="Toggle Diff Area Fill"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => {
                if (!points || points.length === 0) return;
                const headers = "2Theta_deg,Intensity_A_Exp,Intensity_B_Ref,Delta_Residual\n";
                const rows = points.map(p => `${p.twoTheta},${p.intensityA},${p.intensityB},${p.difference}`).join('\n');
                const blob = new Blob([headers + rows], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `spectral_diff_${materialA.name.replace(/\s+/g, '_')}_vs_${materialB.name.replace(/\s+/g, '_')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border border-indigo-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Zoom Controls */}
            {isZoomedIn && (
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                <button onClick={panLeft} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Pan Left')}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={panRight} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Pan Right')}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomInStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Zoom In')}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOutStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Zoom Out')}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOut} className="flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border border-indigo-500/30" title={t('Reset')}>
                  <RotateCcw className="w-3 h-3" />
                  {t('Reset')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Display Stage */}
        <div className="w-full relative z-10 select-none bg-[#030712] p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col gap-4 min-h-[640px]">
          
          {/* Active Palette Config */}
          {(() => {
            const paletteMap = {
              neon: { colorA: '#f43f5e', colorB: '#06b6d4', colorDiff: '#f59e0b' },
              emerald: { colorA: '#10b981', colorB: '#a855f7', colorDiff: '#3b82f6' },
              amber: { colorA: '#fbbf24', colorB: '#6366f1', colorDiff: '#f43f5e' }
            };
            const pal = paletteMap[diffTheme];

            // Custom Tooltip component inside render scope
            const RenderTooltip = ({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const twoTheta = label;
                const lambda = 1.5406;
                const thetaRad = (twoTheta / 2) * (Math.PI / 180);
                const dSpacing = thetaRad > 0 ? (lambda / (2 * Math.sin(thetaRad))).toFixed(4) : 'N/A';

                const valA = payload.find((p: any) => p.dataKey === 'intensityA')?.value;
                const valB = payload.find((p: any) => p.dataKey === 'intensityB')?.value;
                const valDiff = payload.find((p: any) => p.dataKey === 'difference')?.value;
                const valMirroredB = payload.find((p: any) => p.dataKey === 'mirroredB')?.value;

                return (
                  <div className="bg-[#050A14]/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1.5 z-50 min-w-[210px]">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">2θ Angle</span>
                      <span className="text-cyan-400 font-black text-sm">{twoTheta}°</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">d-spacing:</span>
                      <span className="text-slate-200 font-bold">{dSpacing} Å</span>
                    </div>
                    {valA !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          Sample A (Exp):
                        </span>
                        <span className="font-bold text-white">{valA} %</span>
                      </div>
                    )}
                    {valB !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          Sample B (Ref):
                        </span>
                        <span className="font-bold text-white">{valB} %</span>
                      </div>
                    )}
                    {valMirroredB !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          Sample B (Ref):
                        </span>
                        <span className="font-bold text-white">{Math.abs(valMirroredB)} %</span>
                      </div>
                    )}
                    {valDiff !== undefined && (
                      <div className="flex justify-between items-center text-[11px] border-t border-slate-800/80 pt-1 mt-1">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorDiff }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorDiff }} />
                          Δ Residual:
                        </span>
                        <span className={`font-black ${valDiff > 0 ? 'text-rose-400' : valDiff < 0 ? 'text-cyan-400' : 'text-slate-300'}`}>
                          {valDiff > 0 ? `+${valDiff}` : valDiff} %
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            };

            if (viewMode === 'unified') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* Single Unified Chart */}
                  <div className="w-full h-[400px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          {t('Sample A')}: {materialA.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          {t('Sample B')}: {materialB?.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">Unified Overlay Mode</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          domain={[0, 110]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Counts [%]'), angle: -90, position: 'insideTopLeft', fill: '#94a3b8', fontSize: 10, dy: 20, dx: 10 }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        {showDiffArea && (
                          <Area type="monotone" dataKey="intensityA" fill={pal.colorA} fillOpacity={0.08} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[200px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                      </span>
                      <span className="text-[9px] font-mono text-amber-500/80 font-bold uppercase tracking-wider">Delta Curve</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <YAxis 
                          domain={[-100, 100]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            if (viewMode === 'mirrored') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* Butterfly Mirrored Chart */}
                  <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          {t('Sample A (Exp - Upward)')}: {materialA.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          {t('Sample B (Ref - Downward)')}: {materialB?.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-400/80 font-bold uppercase tracking-widest">Butterfly Mirrored Mode</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          domain={[-110, 110]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                        {showDiffArea && (
                          <>
                            <Area type="monotone" dataKey="intensityA" fill={pal.colorA} fillOpacity={0.15} stroke="none" />
                            <Area type="monotone" dataKey="mirroredB" fill={pal.colorB} fillOpacity={0.15} stroke="none" />
                          </>
                        )}
                        <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="mirroredB" stroke={pal.colorB} strokeWidth={2} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[180px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            // Default Stacked 3-Pane View
            return (
              <div className="w-full flex flex-col gap-3">
                {/* Pane 1: Sample A */}
                <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                      <FlaskConical className="w-3.5 h-3.5" />
                      {t('Sample A (Experimental)')}: {materialA.name} {materialA.formula && '[' + materialA.formula + ']'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 1</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      {showDiffArea && <Area type="monotone" dataKey="intensityA" fill={pal.colorA} fillOpacity={0.12} stroke="none" />}
                      <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pane 2: Sample B */}
                <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                      <Database className="w-3.5 h-3.5" />
                      {t('Sample B (Reference)')}: {materialB?.name} {materialB?.formula && '[' + materialB?.formula + ']'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 2</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      {showDiffArea && <Area type="monotone" dataKey="intensityB" fill={pal.colorB} fillOpacity={0.12} stroke="none" />}
                      <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pane 3: Residual Curve */}
                <div className="w-full h-[200px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 3</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 25, left: 10 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis 
                        dataKey="twoTheta" 
                        type="number"
                        domain={[left, right]}
                        allowDataOverflow={true}
                        tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                        label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                      />
                      <YAxis domain={[-100, 100]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                      {showDiffArea && (
                        <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                      )}
                      <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
