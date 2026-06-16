import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MATERIAL_DB } from '../utils/materialDB';
import { BraggResult } from '../types';
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
  Sliders 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  ReferenceArea 
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
      let intensityA = Math.random() * 1.5 + 2; // simulated instrument noise floor
      let intensityB = Math.random() * 1.5 + 2; 

      const hwA = 0.08; // width factor
      peaksA.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
          const g = Math.exp(-Math.log(2) * Math.pow(diff / hwA, 2));
          const l = 1 / (1 + Math.pow(diff / hwA, 2));
          intensityA += p.intensity * (0.5 * g + 0.5 * l);
        }
      });

      const hwB = 0.08;
      peaksB.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
          const g = Math.exp(-Math.log(2) * Math.pow(diff / hwB, 2));
          const l = 1 / (1 + Math.pow(diff / hwB, 2));
          intensityB += p.intensity * (0.5 * g + 0.5 * l);
        }
      });

      points.push({
        twoTheta: Number(x.toFixed(2)),
        intensityA: Number(intensityA.toFixed(1)),
        intensityB: Number(intensityB.toFixed(1)),
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
          Visual Spectral Diff/Compare Charts
          ---------------------------------------------------- */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[800px] w-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">
                {t('Spectral Diff Overlay')}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex gap-2 items-center">
                <span>{t('Experimental (Sample A) vs Reference (Sample B)')}</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[8px] text-slate-400 border border-slate-700">{t('Drag to Zoom')}</span>
              </p>
            </div>
          </div>

          {isZoomedIn && (
            <div className="flex items-center gap-2">
              <button onClick={panLeft} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Pan Left">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={panRight} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Pan Right">
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button onClick={zoomInStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={zoomOutStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Zoom Out">
                 <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={zoomOut} className="flex items-center gap-1.5 ml-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-indigo-500/30" title="Reset">
                 <RotateCcw className="w-3 h-3" />
                 {t('Reset Zoom')}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col gap-0 relative z-10 select-none bg-[#e6e6e6] p-1 border-2 border-slate-400">
          
          {/* Top Chart: Target/Synthesized Sample A */}
          <div className="flex-[3] w-full bg-white relative border-2 border-slate-500">
            <div className="absolute top-2 left-16 text-red-600 text-[11px] font-mono font-black z-10 px-1.5 py-0.5 rounded bg-white/90 border border-slate-300 shadow-sm flex items-center gap-1.5">
              <FlaskConical className="w-3 h-3" />
              <span>{t('Sample A (Experimental)')}: {t(materialA.name)}</span>
              {materialA.formula && <span className="text-slate-500 font-normal">[{materialA.formula}]</span>}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                syncId="compareSync"
                data={points} 
                margin={{ top: 25, right: 10, bottom: 20, left: 10 }}
                onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                onMouseUp={zoom}
                onMouseLeave={() => {
                  setRefAreaLeft(null);
                  setRefAreaRight(null);
                }}
              >
                <XAxis 
                  dataKey="twoTheta" 
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow={true}
                  tick={{ fontSize: 11, fill: '#000', fontFamily: 'sans-serif' }}
                  axisLine={{ stroke: '#000' }}
                  tickLine={{ stroke: '#000' }}
                  label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 0, fill: '#000', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 120]} 
                  tick={{ fontSize: 11, fill: '#000' }}
                  axisLine={{ stroke: '#000' }}
                  tickLine={{ stroke: '#000' }}
                  label={{ value: t('Counts'), angle: -90, position: 'insideTopLeft', fill: '#000', fontSize: 12, dy: 30, dx: 15 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensityA" 
                  stroke="#ef4444" 
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                 />
                 {refAreaLeft && refAreaRight ? (
                   <ReferenceArea
                     x1={refAreaLeft}
                     x2={refAreaRight}
                     strokeOpacity={0.5}
                     fill="#1d4ed8"
                     fillOpacity={0.2}
                   />
                 ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* HighScore Analyze Control Separation Interstitial Panel */}
          <div className="bg-[#f0f0f0] border-x border-slate-400 h-7 flex items-end">
            <div className="flex h-5 items-center gap-1 px-2 border-b-2 border-transparent">
               <div className="px-2 h-full text-[10px] text-gray-500 font-sans border-r border-[#ccc] flex items-center bg-white rounded-t-sm border border-b-0 border-slate-300">Default</div>
               <div className="px-2 h-full text-[10px] text-gray-800 font-sans border-t border-x border-slate-400 flex items-center bg-[#e6e6e6] font-bold">IdeAll</div>
               <div className="px-2 h-full text-[10px] text-gray-500 font-sans border border-[#ccc] flex items-center bg-white rounded-t-sm border-b-0">IdeCom</div>
            </div>
            <div className="h-full border-b border-slate-400 flex-1 ml-1" />
          </div>

          <div className="bg-[#e6e6e6] text-[#333] px-2 py-0.5 text-[10px] font-sans border-x border-slate-400 font-bold flex justify-between">
            <span>{t('Reference PDF Overlay Band')}</span>
            <span className="text-[9px] text-emerald-800 uppercase font-black tracking-widest">{t('PDF Card Reference')}</span>
          </div>

          {/* Bottom Chart: Reference Material B (usually cyan/cyan-black HighScore styling) */}
          <div className="flex-[2] w-full bg-black relative border-2 border-slate-400">
            <div className="absolute top-2 left-16 text-cyan-400 text-[11px] font-mono font-black z-10 px-1.5 py-0.5 rounded bg-black/90 border border-slate-800 shadow-sm flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>{t('Sample B (Reference)')}: {t(materialB?.name)}</span>
              {materialB?.formula && <span className="text-slate-400 font-normal">[{materialB?.formula}]</span>}
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none z-0">
               <div className="w-2 h-[2px] bg-white"></div>
               <div className="w-2 h-[2px] bg-white"></div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                syncId="compareSync"
                data={points} 
                margin={{ top: 25, right: 10, bottom: 10, left: 10 }}
                onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                onMouseUp={zoom}
                onMouseLeave={() => {
                  setRefAreaLeft(null);
                  setRefAreaRight(null);
                }}
              >
                <XAxis 
                  dataKey="twoTheta" 
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow={true}
                  tick={{ fontSize: 11, fill: '#fff', fontFamily: 'sans-serif' }}
                  axisLine={{ stroke: '#fff' }}
                  tickLine={{ stroke: '#fff' }}
                />
                <YAxis 
                  domain={[0, 120]} 
                  tick={{ fontSize: 11, fill: '#fff' }}
                  axisLine={{ stroke: '#fff' }}
                  tickLine={{ stroke: '#fff' }}
                  label={{ value: t('Counts'), angle: -90, position: 'insideTopLeft', fill: '#fff', fontSize: 12, dy: 30, dx: 15 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensityB" 
                  stroke="#00ffff" 
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                 />
                 {refAreaLeft && refAreaRight ? (
                   <ReferenceArea
                     x1={refAreaLeft}
                     x2={refAreaRight}
                     strokeOpacity={0.5}
                     fill="#1d4ed8"
                     fillOpacity={0.5}
                   />
                 ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#f0f0f0] border-t border-slate-400 h-6 flex items-center px-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-700 font-sans mt-0.5">
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">Default</span>
               <span className="cursor-pointer bg-slate-300 px-1 py-0.5 border border-slate-400 shadow-sm font-bold">IdeAll</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">IdeCom</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">IdeMin</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">MinorMinerals</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent text-slate-400">PrintIdeAll</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
