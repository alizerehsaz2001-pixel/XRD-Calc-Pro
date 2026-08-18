import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Box, 
  Flame, 
  Layers, 
  Activity, 
  Atom, 
  FileText,
  Check,
  ChevronRight,
  Info,
  ShieldAlert,
  Eraser
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

export interface MaterialParameterStudioModalProps {
  isOpen: boolean;
  isCreating: boolean;
  material: any | null;
  allMaterials: any[];
  onClose: () => void;
  onSave: (updatedMaterial: any, isNew: boolean) => void;
  onDelete: (materialName: string) => void;
  onResetDefaults?: (materialName: string) => void;
  isModified?: boolean;
}

const CRYSTAL_SYSTEMS = [
  'Cubic',
  'Hexagonal',
  'Tetragonal',
  'Orthorhombic',
  'Monoclinic',
  'Triclinic',
  'Trigonal',
  'Rhombohedral',
  'Amorphous',
  'Other / Mixed'
];

const STANDARD_STATES = [
  'Solid',
  'Liquid',
  'Gas',
  'Supercritical Fluid',
  'Amorphous Solid'
];

const STABILITY_STATUSES = [
  'STABLE',
  'METASTABLE',
  'UNSTABLE',
  'HIGHLY UNSTABLE'
];

const CATEGORIES = [
  'Minerals, Ores & Geology',
  'Metals, Intermetallics & Metallurgy',
  'Ceramics, Refractories & Oxides',
  'Semiconductors & Electronic Materials',
  'Energy Storage & Batteries',
  'Superconductors & Quantum Materials',
  'Perovskites & Photovoltaics',
  '2D Materials & Nanomaterials',
  'Biomaterials & Pharmaceuticals',
  'Nuclear & Shielding Materials',
  'Magnetic & Multiferroic Materials',
  'Zeolites & MOFs',
  'Polymers & Soft Matter',
  'Custom Standard'
];

export const MaterialParameterStudioModal: React.FC<MaterialParameterStudioModalProps> = ({
  isOpen,
  isCreating,
  material,
  allMaterials,
  onClose,
  onSave,
  onDelete,
  onResetDefaults,
  isModified = false,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'lattice' | 'peaks' | 'thermo' | 'danger'>('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // General fields
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [category, setCategory] = useState('Custom Standard');
  const [crystalSystem, setCrystalSystem] = useState('Cubic');
  const [spaceGroup, setSpaceGroup] = useState('');
  const [description, setDescription] = useState('');
  const [applications, setApplications] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Lattice fields
  const [latticeA, setLatticeA] = useState('');
  const [latticeB, setLatticeB] = useState('');
  const [latticeC, setLatticeC] = useState('');
  const [alpha, setAlpha] = useState('');
  const [beta, setBeta] = useState('');
  const [gamma, setGamma] = useState('');
  const [zValue, setZValue] = useState('');

  // Physical & Thermodynamics
  const [density, setDensity] = useState('');
  const [elasticModulus, setElasticModulus] = useState('');
  const [molecularWeight, setMolecularWeight] = useState('');
  const [standardState, setStandardState] = useState('Solid');
  const [stabilityStatus, setStabilityStatus] = useState('STABLE');
  const [energyAboveHull, setEnergyAboveHull] = useState('');
  const [formationEnergy, setFormationEnergy] = useState('');
  const [formationEnthalpy, setFormationEnthalpy] = useState('');
  const [standardEntropy, setStandardEntropy] = useState('');
  const [heatCapacity, setHeatCapacity] = useState('');
  const [debyeTemperature, setDebyeTemperature] = useState('');
  const [decompositionTemp, setDecompositionTemp] = useState('');

  // XRD Peaks State
  interface PeakRow {
    id: string;
    twoTheta: number;
    intensity: number;
  }
  const [peaks, setPeaks] = useState<PeakRow[]>([]);
  const [rawPatternMode, setRawPatternMode] = useState(false);
  const [rawPatternText, setRawPatternText] = useState('');
  const [newPeakTwoTheta, setNewPeakTwoTheta] = useState('');
  const [newPeakIntensity, setNewPeakIntensity] = useState('100');

  // Initialize or reset form state when material or isOpen changes
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setError('');
      return;
    }

    if (isCreating || !material) {
      setName('');
      setFormula('');
      setCategory('Custom Standard');
      setCrystalSystem('Cubic');
      setSpaceGroup('');
      setDescription('');
      setApplications([]);
      setNewTag('');

      setLatticeA('');
      setLatticeB('');
      setLatticeC('');
      setAlpha('');
      setBeta('');
      setGamma('');
      setZValue('');

      setDensity('');
      setElasticModulus('');
      setMolecularWeight('');
      setStandardState('Solid');
      setStabilityStatus('STABLE');
      setEnergyAboveHull('');
      setFormationEnergy('');
      setFormationEnthalpy('');
      setStandardEntropy('');
      setHeatCapacity('');
      setDebyeTemperature('');
      setDecompositionTemp('');

      setPeaks([]);
      setRawPatternText('');
      setActiveTab('general');
    } else {
      setName(material.name || '');
      setFormula(material.formula || '');
      setCategory(material.type || 'Custom Standard');
      setCrystalSystem(material.crystalSystem || 'Cubic');
      setSpaceGroup(material.spaceGroup || '');
      setDescription(material.description || '');
      setApplications(Array.isArray(material.applications) ? [...material.applications] : []);
      setNewTag('');

      setLatticeA(material.latticeParams?.a?.toString() || '');
      setLatticeB(material.latticeParams?.b?.toString() || '');
      setLatticeC(material.latticeParams?.c?.toString() || '');
      setAlpha(material.latticeParams?.alpha?.toString() || '');
      setBeta(material.latticeParams?.beta?.toString() || '');
      setGamma(material.latticeParams?.gamma?.toString() || '');
      setZValue(material.zValue?.toString() || '');

      setDensity(material.density !== undefined ? material.density.toString() : '');
      setElasticModulus(material.elasticModulus !== undefined ? material.elasticModulus.toString() : '');
      setMolecularWeight(material.molecularWeight !== undefined ? material.molecularWeight.toString() : '');
      setStandardState(material.standardState || 'Solid');
      setStabilityStatus(material.stabilityStatus || 'STABLE');
      setEnergyAboveHull(material.energyAboveHull !== undefined ? material.energyAboveHull.toString() : '');
      setFormationEnergy(material.formationEnergy !== undefined ? material.formationEnergy.toString() : '');
      setFormationEnthalpy(material.formationEnthalpy !== undefined ? material.formationEnthalpy.toString() : '');
      setStandardEntropy(material.standardEntropy !== undefined ? material.standardEntropy.toString() : '');
      setHeatCapacity(material.heatCapacity !== undefined ? material.heatCapacity.toString() : '');
      setDebyeTemperature(material.debyeTemperature !== undefined ? material.debyeTemperature.toString() : '');
      setDecompositionTemp(material.decompositionTemp !== undefined ? material.decompositionTemp.toString() : '');

      // Parse pattern into peak rows
      const patternStr = material.pattern || '';
      setRawPatternText(patternStr);
      const parsed: PeakRow[] = [];
      patternStr.split('\n').forEach((line: string, idx: number) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const tt = parseFloat(parts[0].trim());
          const intVal = parseFloat(parts[1].trim());
          if (!isNaN(tt) && !isNaN(intVal)) {
            parsed.push({
              id: `peak_${idx}_${Date.now()}_${Math.random()}`,
              twoTheta: tt,
              intensity: intVal
            });
          }
        }
      });
      setPeaks(parsed);
      setActiveTab('general');
    }
  }, [isOpen, isCreating, material]);

  // Keep raw text in sync if in raw mode or when peaks change
  const patternStringFromPeaks = useMemo(() => {
    return peaks
      .slice()
      .sort((a, b) => a.twoTheta - b.twoTheta)
      .map(p => `${p.twoTheta.toFixed(2)}, ${p.intensity.toFixed(1)}`)
      .join('\n');
  }, [peaks]);

  // Handler: Add Application Tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tag = newTag.trim();
    if (!applications.includes(tag)) {
      setApplications([...applications, tag]);
    }
    setNewTag('');
  };

  // Handler: Remove Application Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setApplications(applications.filter(t => t !== tagToRemove));
  };

  // Handler: Add Peak
  const handleAddPeak = () => {
    const tt = parseFloat(newPeakTwoTheta);
    const intVal = parseFloat(newPeakIntensity);
    if (isNaN(tt) || tt <= 0 || tt >= 180) {
      setError('Peak 2θ must be a valid number between 0° and 180°');
      return;
    }
    if (isNaN(intVal) || intVal < 0 || intVal > 1000) {
      setError('Peak Intensity must be a valid number between 0 and 1000');
      return;
    }
    setError('');
    const newPeak: PeakRow = {
      id: `peak_${Date.now()}_${Math.random()}`,
      twoTheta: tt,
      intensity: intVal
    };
    setPeaks(prev => [...prev, newPeak].sort((a, b) => a.twoTheta - b.twoTheta));
    setNewPeakTwoTheta('');
    setNewPeakIntensity('100');
  };

  // Handler: Delete Single Peak
  const handleDeletePeak = (idToDelete: string) => {
    setPeaks(prev => prev.filter(p => p.id !== idToDelete));
  };

  // Handler: Clear All Peaks
  const handleClearAllPeaks = () => {
    setPeaks([]);
    setRawPatternText('');
  };

  // Handler: Parse raw text into peaks
  const handleSyncRawTextToPeaks = () => {
    const parsed: PeakRow[] = [];
    rawPatternText.split('\n').forEach((line, idx) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const tt = parseFloat(parts[0].trim());
        const intVal = parseFloat(parts[1].trim());
        if (!isNaN(tt) && !isNaN(intVal)) {
          parsed.push({
            id: `peak_raw_${idx}_${Date.now()}`,
            twoTheta: tt,
            intensity: intVal
          });
        }
      }
    });
    setPeaks(parsed);
    setRawPatternMode(false);
  };

  // Handler: Save
  const handleSave = () => {
    if (!name.trim()) {
      setError('Material Name is required');
      setActiveTab('general');
      return;
    }
    if (!formula.trim()) {
      setError('Chemical Formula is required');
      setActiveTab('general');
      return;
    }

    // Auto extract elements
    const elementsRegex = /[A-Z][a-z]?/g;
    const formulaElements = Array.from(new Set(formula.match(elementsRegex) || []));

    const finalPattern = rawPatternMode ? rawPatternText.trim() : patternStringFromPeaks;

    const updated: any = {
      name: name.trim(),
      type: category.trim(),
      formula: formula.trim(),
      crystalSystem: crystalSystem.trim(),
      spaceGroup: spaceGroup.trim(),
      density: density.trim() ? parseFloat(density) : undefined,
      elasticModulus: elasticModulus.trim() ? parseFloat(elasticModulus) : undefined,
      molecularWeight: molecularWeight.trim() ? parseFloat(molecularWeight) : undefined,
      description: description.trim(),
      pattern: finalPattern,
      applications: applications,
      elements: formulaElements.length > 0 ? formulaElements : (material?.elements || []),

      standardState: standardState.trim(),
      standardEntropy: standardEntropy.trim() ? parseFloat(standardEntropy) : undefined,
      formationEnergy: formationEnergy.trim() ? parseFloat(formationEnergy) : undefined,
      heatCapacity: heatCapacity.trim() ? parseFloat(heatCapacity) : undefined,
      debyeTemperature: debyeTemperature.trim() ? parseFloat(debyeTemperature) : undefined,
      energyAboveHull: energyAboveHull.trim() ? parseFloat(energyAboveHull) : undefined,
      stabilityStatus: stabilityStatus.trim(),
      decompositionTemp: decompositionTemp.trim() ? parseFloat(decompositionTemp) : undefined,
      formationEnthalpy: formationEnthalpy.trim() ? parseFloat(formationEnthalpy) : undefined,
      zValue: zValue.trim() ? parseInt(zValue, 10) : undefined,
      latticeParams: (latticeA.trim() || latticeB.trim() || latticeC.trim() || alpha.trim() || beta.trim() || gamma.trim()) ? {
        a: latticeA.trim() ? parseFloat(latticeA) : 5.0,
        b: latticeB.trim() ? parseFloat(latticeB) : 5.0,
        c: latticeC.trim() ? parseFloat(latticeC) : 5.0,
        alpha: alpha.trim() ? parseFloat(alpha) : 90,
        beta: beta.trim() ? parseFloat(beta) : 90,
        gamma: gamma.trim() ? parseFloat(gamma) : 90,
      } : undefined
    };

    if (isCreating) {
      if (allMaterials.some(m => m.name.toLowerCase() === name.trim().toLowerCase())) {
        setError('A material with this exact name already exists in the database.');
        setActiveTab('general');
        return;
      }
    }

    onSave(updated, isCreating);
    playSynthTone('success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#050B14] border border-indigo-500/40 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(99,102,241,0.2)] overflow-hidden text-slate-200">
        
        {/* Ambient background glows */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-40 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  {isCreating ? 'Create Novel Material Standard' : `Parameter Studio: ${name || material?.name || 'Material'}`}
                </h2>
                {formula && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {formula}
                  </span>
                )}
                {isModified && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Modified Overrides
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Precision parameter curation, peak management, and thermodynamic calibration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Close Parameter Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-black/30 border-b border-white/5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>General & Identity</span>
          </button>

          <button
            onClick={() => setActiveTab('lattice')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lattice'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Lattice & Unit Cell</span>
          </button>

          <button
            onClick={() => setActiveTab('peaks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'peaks'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>XRD Peaks ({peaks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('thermo')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'thermo'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Thermodynamics</span>
          </button>

          {!isCreating && (
            <button
              onClick={() => setActiveTab('danger')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ml-auto cursor-pointer ${
                activeTab === 'danger'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </button>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

          {/* TAB 1: GENERAL & IDENTITY */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                    Material Registry Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Lithium Cobalt Oxide (LiCoO2 HT Phase)"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Chemical Formula */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                    Chemical Formula <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formula}
                    onChange={e => setFormula(e.target.value)}
                    placeholder="e.g. LiCoO2"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-cyan-300 font-mono font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Crystallographic Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Crystal System */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Crystal System
                  </label>
                  <select
                    value={crystalSystem}
                    onChange={e => setCrystalSystem(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {CRYSTAL_SYSTEMS.map(sys => (
                      <option key={sys} value={sys}>{sys}</option>
                    ))}
                  </select>
                </div>

                {/* Space Group */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Space Group (H-M Symbol)
                  </label>
                  <input
                    type="text"
                    value={spaceGroup}
                    onChange={e => setSpaceGroup(e.target.value)}
                    placeholder="e.g. R-3m (166)"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Chemical & Physical Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Comprehensive structural description, synthesis condition, phase notes..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 h-24 resize-y focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              {/* Industrial Application Tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Industrial Application Roles & Tags
                </label>
                
                <div className="flex flex-wrap gap-2">
                  {applications.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="p-0.5 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {applications.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No application tags defined.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add custom application role (e.g. Cathode Material)..."
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LATTICE & UNIT CELL */}
          {activeTab === 'lattice' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl flex items-start gap-3">
                <Box className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-200/90 leading-relaxed">
                  <strong>Unit Cell Parameters:</strong> Direct crystallographic axes ($a, b, c$ in Ångströms) and inter-axial angles ($\alpha, \beta, \gamma$ in degrees) define the direct lattice metric tensor and space transformations.
                </div>
              </div>

              {/* Lattice Constants a, b, c */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Lattice Constants (Å)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLatticeA('');
                      setLatticeB('');
                      setLatticeC('');
                    }}
                    className="text-[10px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3 h-3" /> Clear Axes
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-cyan-300">a (Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latticeA}
                      onChange={e => setLatticeA(e.target.value)}
                      placeholder="e.g. 5.4307"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-cyan-300">b (Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latticeB}
                      onChange={e => setLatticeB(e.target.value)}
                      placeholder="e.g. 5.4307"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-cyan-300">c (Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latticeC}
                      onChange={e => setLatticeC(e.target.value)}
                      placeholder="e.g. 5.4307"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Lattice Angles alpha, beta, gamma */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Unit Cell Angles (Degrees °)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAlpha('90');
                      setBeta('90');
                      setGamma('90');
                    }}
                    className="text-[10px] font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Set Orthogonal (90°, 90°, 90°)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-indigo-300">α (°)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={alpha}
                      onChange={e => setAlpha(e.target.value)}
                      placeholder="90.0"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-indigo-300">β (°)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={beta}
                      onChange={e => setBeta(e.target.value)}
                      placeholder="90.0"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-indigo-300">γ (°)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={gamma}
                      onChange={e => setGamma(e.target.value)}
                      placeholder="90.0"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Z-Value (Formula Units per unit cell) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Z (Formula Units / Cell)
                    </label>
                    {zValue && (
                      <button
                        type="button"
                        onClick={() => setZValue('')}
                        className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={zValue}
                    onChange={e => setZValue(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: XRD DIFFRACTION PEAKS STUDIO */}
          {activeTab === 'peaks' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header with Stick Preview & Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Diffraction Pattern Peaks Calibration
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Manage Bragg diffraction reflections. Delete individual peaks or add new reflections with live spectrum feedback.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRawPatternMode(!rawPatternMode)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    {rawPatternMode ? 'Interactive Table Mode' : 'Raw Text Mode'}
                  </button>
                  {peaks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPeaks}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear All Peaks
                    </button>
                  )}
                </div>
              </div>

              {/* Live Stick Spectrum Visualizer */}
              <div className="p-4 bg-black/60 border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Live Powder XRD Stick Spectrum Preview</span>
                  <span className="text-cyan-400 font-bold">{peaks.length} calibrated peaks</span>
                </div>

                <div className="relative h-28 bg-slate-950/80 rounded-xl border border-white/5 p-2 flex items-end">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-5 p-2">
                    <div className="border-l border-white h-full" />
                    <div className="border-l border-white h-full" />
                    <div className="border-l border-white h-full" />
                    <div className="border-l border-white h-full" />
                  </div>

                  {/* Peaks Sticks */}
                  {peaks.map((p, idx) => {
                    const xPercent = Math.min(98, Math.max(2, ((p.twoTheta - 10) / 80) * 100));
                    const maxInt = Math.max(...peaks.map(pk => pk.intensity), 100);
                    const heightPercent = Math.min(95, Math.max(5, (p.intensity / maxInt) * 90));

                    return (
                      <div
                        key={p.id}
                        className="absolute bottom-2 w-1 bg-cyan-400 hover:bg-cyan-200 rounded-t group transition-all cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        style={{
                          left: `${xPercent}%`,
                          height: `${heightPercent}%`
                        }}
                      >
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-200 rounded-lg whitespace-nowrap z-30 shadow-xl">
                          2θ: {p.twoTheta.toFixed(2)}° | I: {p.intensity.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}

                  {peaks.length === 0 && (
                    <div className="w-full text-center text-xs font-mono text-slate-600 py-6">
                      No peaks calibrated. Add peaks below.
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[8px] font-mono text-slate-600 px-1">
                  <span>10° 2θ</span>
                  <span>Bragg Scattering Angle (Cu-Kα)</span>
                  <span>90° 2θ</span>
                </div>
              </div>

              {/* Peak Management Options */}
              {rawPatternMode ? (
                /* Raw Text Area Mode */
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Batch Peak Entries (2θ, Intensity) - One per line
                    </label>
                    <button
                      type="button"
                      onClick={handleSyncRawTextToPeaks}
                      className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
                    >
                      Convert to Interactive Table →
                    </button>
                  </div>
                  <textarea
                    value={rawPatternText}
                    onChange={e => setRawPatternText(e.target.value)}
                    placeholder="28.4, 100&#10;47.3, 55&#10;56.1, 30"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-200 h-48 focus:border-indigo-500 outline-none leading-relaxed resize-y"
                  />
                </div>
              ) : (
                /* Interactive Peak Table & Add Form */
                <div className="space-y-4">
                  {/* Add New Peak Bar */}
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 flex gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-indigo-300 tracking-wider">
                          2θ Bragg Angle (°)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="5"
                          max="175"
                          value={newPeakTwoTheta}
                          onChange={e => setNewPeakTwoTheta(e.target.value)}
                          placeholder="e.g. 28.44"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-indigo-300 tracking-wider">
                          Intensity (%)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="1000"
                          value={newPeakIntensity}
                          onChange={e => setNewPeakIntensity(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPeak}
                      className="px-5 py-2 sm:self-end bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Peak</span>
                    </button>
                  </div>

                  {/* Peaks Table with Individual Delete Action */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-black/60 text-[9px] uppercase font-black tracking-widest text-slate-400 sticky top-0 border-b border-white/10">
                          <tr>
                            <th className="py-2.5 px-4">#</th>
                            <th className="py-2.5 px-4">2θ Angle (°)</th>
                            <th className="py-2.5 px-4">Intensity (%)</th>
                            <th className="py-2.5 px-4">Est. d-Spacing (Å)</th>
                            <th className="py-2.5 px-4 text-right">Delete Parameter</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {peaks.map((peak, idx) => {
                            const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
                            const dSpacing = thetaRad > 0 ? (1.54059 / (2 * Math.sin(thetaRad))).toFixed(4) : '-';

                            return (
                              <tr key={peak.id} className="hover:bg-white/5 transition-colors group">
                                <td className="py-2 px-4 text-slate-500 font-bold">{idx + 1}</td>
                                <td className="py-2 px-4 text-cyan-300 font-bold">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={peak.twoTheta}
                                    onChange={e => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) {
                                        setPeaks(prev => prev.map(p => p.id === peak.id ? { ...p, twoTheta: val } : p));
                                      }
                                    }}
                                    className="bg-black/40 border border-white/5 focus:border-cyan-500 rounded px-2 py-0.5 w-24 text-xs font-mono text-cyan-300 outline-none"
                                  />
                                </td>
                                <td className="py-2 px-4 text-slate-300">
                                  <input
                                    type="number"
                                    step="1"
                                    value={peak.intensity}
                                    onChange={e => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) {
                                        setPeaks(prev => prev.map(p => p.id === peak.id ? { ...p, intensity: val } : p));
                                      }
                                    }}
                                    className="bg-black/40 border border-white/5 focus:border-cyan-500 rounded px-2 py-0.5 w-20 text-xs font-mono text-slate-200 outline-none"
                                  />
                                </td>
                                <td className="py-2 px-4 text-indigo-300 font-bold">{dSpacing} Å</td>
                                <td className="py-2 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePeak(peak.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer border border-rose-500/20"
                                    title="Delete this peak reflection"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THERMODYNAMICS & PHYSICAL PROPERTIES */}
          {activeTab === 'thermo' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Density & Elastic Modulus */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Physical & Mechanical Constants
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Density */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                        Density (g/cm³)
                      </label>
                      {density && (
                        <button
                          type="button"
                          onClick={() => setDensity('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={density}
                      onChange={e => setDensity(e.target.value)}
                      placeholder="e.g. 5.86"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Elastic Modulus */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                        Elastic Modulus (GPa)
                      </label>
                      {elasticModulus && (
                        <button
                          type="button"
                          onClick={() => setElasticModulus('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={elasticModulus}
                      onChange={e => setElasticModulus(e.target.value)}
                      placeholder="e.g. 182"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Molecular Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Mol. Weight (g/mol)
                      </label>
                      {molecularWeight && (
                        <button
                          type="button"
                          onClick={() => setMolecularWeight('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={molecularWeight}
                      onChange={e => setMolecularWeight(e.target.value)}
                      placeholder="e.g. 97.87"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Thermodynamic Constants */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Thermodynamic & Stability Properties
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Standard State */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Standard Phase State
                    </label>
                    <select
                      value={standardState}
                      onChange={e => setStandardState(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      {STANDARD_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stability Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Phase Stability Status
                    </label>
                    <select
                      value={stabilityStatus}
                      onChange={e => setStabilityStatus(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      {STABILITY_STATUSES.map(stat => (
                        <option key={stat} value={stat}>{stat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Energy Above Hull */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        E Above Hull (eV/atom)
                      </label>
                      {energyAboveHull && (
                        <button
                          type="button"
                          onClick={() => setEnergyAboveHull('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      value={energyAboveHull}
                      onChange={e => setEnergyAboveHull(e.target.value)}
                      placeholder="e.g. 0.000"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Formation Energy */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Formation Energy (eV/atom)
                      </label>
                      {formationEnergy && (
                        <button
                          type="button"
                          onClick={() => setFormationEnergy('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formationEnergy}
                      onChange={e => setFormationEnergy(e.target.value)}
                      placeholder="e.g. -2.35"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Formation Enthalpy */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        ΔH° Formation (kJ/mol)
                      </label>
                      {formationEnthalpy && (
                        <button
                          type="button"
                          onClick={() => setFormationEnthalpy('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={formationEnthalpy}
                      onChange={e => setFormationEnthalpy(e.target.value)}
                      placeholder="e.g. -680.5"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Standard Entropy */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        S° Entropy (J/mol·K)
                      </label>
                      {standardEntropy && (
                        <button
                          type="button"
                          onClick={() => setStandardEntropy('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={standardEntropy}
                      onChange={e => setStandardEntropy(e.target.value)}
                      placeholder="e.g. 52.4"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Heat Capacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Cp Heat Cap. (J/mol·K)
                      </label>
                      {heatCapacity && (
                        <button
                          type="button"
                          onClick={() => setHeatCapacity('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={heatCapacity}
                      onChange={e => setHeatCapacity(e.target.value)}
                      placeholder="e.g. 48.2"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Debye Temp */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Debye Temp (K)
                      </label>
                      {debyeTemperature && (
                        <button
                          type="button"
                          onClick={() => setDebyeTemperature('')}
                          className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={debyeTemperature}
                      onChange={e => setDebyeTemperature(e.target.value)}
                      placeholder="e.g. 645"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE / DELETION & RESET */}
          {activeTab === 'danger' && !isCreating && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Reset to defaults */}
              {isModified && onResetDefaults && (
                <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-black text-amber-200">Reset Local Overrides to Standard Specs</h4>
                  </div>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    This material has custom parameter edits. Clicking Reset Defaults will restore all crystallographic axes, XRD peaks, and properties back to original registry standards.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (material) {
                        onResetDefaults(material.name);
                        playSynthTone('switch');
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Factory Standard Specs</span>
                  </button>
                </div>
              )}

              {/* Permanent Deletion */}
              <div className="p-5 bg-rose-950/25 border border-rose-500/40 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h4 className="text-sm font-black text-rose-200">Delete Material from Registry</h4>
                </div>
                
                <p className="text-xs text-rose-300/80 leading-relaxed">
                  Permanently remove <strong>{material?.name}</strong> ({material?.formula}) from the database. This removes it from phase identification search indices, Vegard mixing calculations, and crystallographic charts.
                </p>

                {showDeleteConfirm ? (
                  <div className="p-4 bg-black/60 border border-rose-500/50 rounded-xl space-y-3 animate-in zoom-in-95 duration-150">
                    <p className="text-xs font-black text-rose-300">
                      ⚠️ Are you absolutely certain? This will delete "{material?.name}".
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (material) {
                            onDelete(material.name);
                            playSynthTone('switch');
                            onClose();
                          }
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Yes, Delete Permanently</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete "{material?.name || 'Material'}"</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/60 backdrop-blur-md relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isCreating ? 'Create & Index Standard' : 'Save Parameters'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
