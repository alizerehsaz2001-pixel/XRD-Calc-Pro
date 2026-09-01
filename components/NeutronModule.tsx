import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { LatticeParameters, CrystalSystem, StandardWavelength } from '../types';
import {
  NeutronAtomExtended,
  NIST_ISOTOPE_DB,
  NUCLEAR_PRESETS,
  NuclearPreset,
  NuclearMetrics,
  DetailedDiffractionSpectrum,
  calculateComprehensiveNuclearMetrics,
  calculateDetailedNuclearDiffraction
} from '../utils/neutronDiffractionPhysics';
import { calculateCellVolume } from '../utils/physics';
import { ScientificMathControl } from './ScientificMathControl';
import { fetchStandardWavelengths } from '../services/geminiService';

// Subcomponents
import { ReciprocalScatterPlaneView } from './neutron_diffraction/ReciprocalScatterPlaneView';
import { NeutronKinematicsCalculator } from './neutron_diffraction/NeutronKinematicsCalculator';
import { IsotopeContrastWorkbench } from './neutron_diffraction/IsotopeContrastWorkbench';
import { UnitCellFourierMap } from './neutron_diffraction/UnitCellFourierMap';
import { DebyeScherrerRings2D } from './neutron_diffraction/DebyeScherrerRings2D';
import { SolventContrastMatchingTool } from './neutron_diffraction/SolventContrastMatchingTool';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import {
  Layers,
  Zap,
  Atom,
  Upload,
  Download,
  Info,
  ChevronDown,
  CheckCircle,
  Database,
  Grid,
  Disc,
  Activity,
  Droplet,
  Compass,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Share2,
  Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NeutronModule: React.FC = () => {
  const { lengthUnit = 'Å' } = useSettings();

  // Wavelength & Beamline State
  const [wavelength, setWavelength] = useState<number>(1.54);
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>([
    { label: 'Thermal Powder (D2B / POWGEN)', value: 1.54, type: 'Neutron' },
    { label: 'Standard Thermal (2200 m/s)', value: 1.798, type: 'Neutron' },
    { label: 'Cold Neutron (Be Filter)', value: 3.96, type: 'Neutron' },
    { label: 'Cold SANS (5.0 Å)', value: 5.0, type: 'Neutron' }
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Crystal Lattice & Structure State
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [lattice, setLattice] = useState<LatticeParameters>({
    a: 4.21,
    b: 4.21,
    c: 4.21,
    alpha: 90,
    beta: 90,
    gamma: 90
  });

  const [atoms, setAtoms] = useState<NeutronAtomExtended[]>([
    { id: '1', element: 'Mg', label: 'Mg1', b: 5.38, x: 0, y: 0, z: 0, B_iso: 0.35 },
    { id: '2', element: 'O', label: 'O1', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.45 }
  ]);

  const [activePresetId, setActivePresetId] = useState<string>('mgo_rocksalt');

  // UI Tabs & Views
  const [activeTab, setActiveTab] = useState<
    'scatter_plane' | 'pattern' | 'rings' | 'isotopes' | 'fourier' | 'solvent' | 'kinematics'
  >('scatter_plane');

  const [comparisonMode, setComparisonMode] = useState<boolean>(true);
  const [ringRadiationMode, setRingRadiationMode] = useState<'neutron' | 'xray' | 'dual'>('neutron');
  const [d2oFraction, setD2oFraction] = useState<number>(50);

  // Import / Export modals
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Symmetry Constraint Enforcement
  const applySymmetry = (system: CrystalSystem, l: LatticeParameters): LatticeParameters => {
    switch (system) {
      case 'Cubic':
        return { ...l, b: l.a, c: l.a, alpha: 90, beta: 90, gamma: 90 };
      case 'Tetragonal':
        return { ...l, b: l.a, alpha: 90, beta: 90, gamma: 90 };
      case 'Hexagonal':
        return { ...l, b: l.a, alpha: 90, beta: 90, gamma: 120 };
      case 'Orthorhombic':
        return { ...l, alpha: 90, beta: 90, gamma: 90 };
      case 'Monoclinic':
        return { ...l, alpha: 90, gamma: 90 };
      default:
        return l;
    }
  };

  const handleLatticeChange = (field: keyof LatticeParameters, value: number) => {
    const nextLattice = { ...lattice, [field]: value };
    setLattice(applySymmetry(crystalSystem, nextLattice));
  };

  const handleSystemChange = (system: CrystalSystem) => {
    setCrystalSystem(system);
    setLattice(applySymmetry(system, lattice));
  };

  // Atom Management
  const addAtom = () => {
    const newId = String(Date.now());
    setAtoms([
      ...atoms,
      { id: newId, element: 'O', label: `O${atoms.length + 1}`, b: 5.80, x: 0, y: 0, z: 0, B_iso: 0.5 }
    ]);
  };

  const removeAtom = (id: string) => {
    if (atoms.length <= 1) return;
    setAtoms(atoms.filter(a => a.id !== id));
  };

  const updateAtom = (id: string, field: keyof NeutronAtomExtended, value: any) => {
    setAtoms(
      atoms.map(a => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          if (field === 'element') {
            const iso = NIST_ISOTOPE_DB[value];
            if (iso) {
              updated.b = iso.b_c;
            }
          }
          return updated;
        }
        return a;
      })
    );
  };

  // Apply Benchmark Preset
  const handleApplyPreset = (preset: NuclearPreset) => {
    setActivePresetId(preset.id);
    setCrystalSystem(preset.crystalSystem);
    setLattice(preset.lattice);
    setWavelength(preset.wavelength);
    setAtoms(preset.atoms);
  };

  // Synchronize Wavelengths
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const latest = await fetchStandardWavelengths();
      if (latest && latest.length > 0) {
        setAvailableWavelengths(latest.filter(w => w.type === 'Neutron'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Computations
  const detailedReflections: DetailedDiffractionSpectrum[] = useMemo(() => {
    return calculateDetailedNuclearDiffraction(wavelength, lattice, atoms, 110);
  }, [wavelength, lattice, atoms]);

  const metrics: NuclearMetrics = useMemo(() => {
    return calculateComprehensiveNuclearMetrics(lattice, atoms, wavelength);
  }, [lattice, atoms, wavelength]);

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      title: 'Neutron Scatter Plane Crystal Dataset',
      timestamp: new Date().toISOString(),
      crystalSystem,
      wavelength,
      lattice,
      atoms,
      metrics
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neutron-scatter-plane-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV of diffraction reflections
  const handleExportCSV = () => {
    const headers = ['h', 'k', 'l', '2Theta_deg', 'd_spacing_A', 'q_mag_A-1', 'F_nuc_sq', 'Phase_deg', 'Intensity_nuc_pct', 'Intensity_xray_pct'];
    const rows = detailedReflections.map(r => [
      r.hkl[0],
      r.hkl[1],
      r.hkl[2],
      r.twoTheta.toFixed(4),
      r.dSpacing.toFixed(4),
      r.qMag.toFixed(4),
      r.F_nuc_sq.toFixed(2),
      r.phase_nuc_deg.toFixed(1),
      r.intensity_nuc.toFixed(2),
      r.intensity_xray.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neutron-reflections-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed.lattice) setLattice(parsed.lattice);
      if (parsed.atoms) setAtoms(parsed.atoms);
      if (parsed.wavelength) setWavelength(parsed.wavelength);
      if (parsed.crystalSystem) setCrystalSystem(parsed.crystalSystem);
      setShowImport(false);
      setImportError(null);
    } catch (e: any) {
      setImportError('Invalid JSON structure. Please verify formatting.');
    }
  };

  const activePreset = NUCLEAR_PRESETS.find(p => p.id === activePresetId) || NUCLEAR_PRESETS[0];

  return (
    <div className="flex flex-col gap-6 text-slate-100 max-w-7xl mx-auto w-full pb-16">
      {/* Top Banner & Header */}
      <div className="bg-[#070D18] p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Nuclear Analytics & Kinematics
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Isotope-Sensitive Scatter Plane
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Neutron Scatter Plane Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Model nuclear bound scattering lengths b_c, destructive negative phase interference (¹H, ⁴⁸Ti, ⁶²Ni), 2D reciprocal space slices (HK0, H0L), Ewald limits, 2D Debye-Scherrer detector halos, and solvent SANS contrast matching.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10 text-xs font-bold transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10 text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Reflections CSV
            </button>
          </div>
        </div>

        {/* Benchmark Presets Carousel */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-3 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Benchmark Nuclear Materials & Case Studies:
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {NUCLEAR_PRESETS.length} Validated Crystals
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
            {NUCLEAR_PRESETS.map(p => {
              const isSelected = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all flex flex-col justify-between max-w-[210px] ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-white font-mono block truncate">
                      {p.name.split('(')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block truncate">
                      {p.category}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-blue-400 mt-2 font-bold block">
                    {p.crystalSystem} • {p.atoms.length} sites
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Preset Scientific Insight Banner */}
          {activePreset && (
            <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-left text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-bold">{activePreset.name}: </strong>
                <span className="text-slate-300 leading-relaxed font-normal">{activePreset.scientificInsight}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Left Config Panel + Right Analytics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Unit Cell & Lattice Configuration (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Unit Cell & Beamline Parameters */}
          <div className="bg-[#0B1528] p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                  Diffractometer & Cell Setup
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {crystalSystem}
              </span>
            </div>

            {/* Wavelength Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Neutron Wavelength (λ):</span>
                <span className="font-mono text-blue-400 font-bold">{wavelength.toFixed(3)} {lengthUnit}</span>
              </div>

              <div className="flex gap-2">
                <select
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500/40"
                >
                  {availableWavelengths.map(w => (
                    <option key={`${w.label}-${w.value}`} value={w.value}>
                      {w.label} ({w.value} Å)
                    </option>
                  ))}
                  <option value={1.54}>Thermal Powder (1.54 Å)</option>
                  <option value={1.798}>Standard 2200 m/s (1.798 Å)</option>
                  <option value={2.41}>Filter Cutoff (2.41 Å)</option>
                  <option value={3.96}>Cold Be-Filter (3.96 Å)</option>
                  <option value={5.0}>Cold SANS (5.00 Å)</option>
                </select>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="p-2 rounded-xl bg-black/40 border border-white/10 text-slate-400 hover:text-white"
                  title="Sync Wavelengths"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Crystal System Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                Crystal Symmetry Class
              </label>
              <select
                value={crystalSystem}
                onChange={(e) => handleSystemChange(e.target.value as CrystalSystem)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40"
              >
                <option value="Cubic">Cubic (a = b = c, α = β = γ = 90°)</option>
                <option value="Tetragonal">Tetragonal (a = b ≠ c, 90°)</option>
                <option value="Hexagonal">Hexagonal (a = b, γ = 120°)</option>
                <option value="Orthorhombic">Orthorhombic (a ≠ b ≠ c, 90°)</option>
                <option value="Monoclinic">Monoclinic (β ≠ 90°)</option>
                <option value="Triclinic">Triclinic (Arbitrary)</option>
              </select>
            </div>

            {/* Lattice Dimensions */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                Direct Lattice Constants ({lengthUnit} / °)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['a', 'b', 'c'] as const).map(param => (
                  <div key={param} className="space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">{param} ({lengthUnit})</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      value={lattice[param]}
                      onChange={(e) => handleLatticeChange(param, parseFloat(e.target.value) || 1)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['alpha', 'beta', 'gamma'] as const).map(param => (
                  <div key={param} className="space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">{param}°</span>
                    <input
                      type="number"
                      step="0.1"
                      value={lattice[param]}
                      disabled={crystalSystem === 'Cubic' || (crystalSystem === 'Hexagonal' && param !== 'gamma')}
                      onChange={(e) => handleLatticeChange(param, parseFloat(e.target.value) || 90)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-300 disabled:opacity-50 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unit Cell Physical Signatures & Metrics */}
          <div className="bg-[#0B1528] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Computed Nuclear Physical Signatures
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase block">Cell Volume</span>
                <span className="text-xs font-mono font-black text-blue-400 mt-0.5 block">
                  {metrics.cellVolume.toFixed(2)} <span className="text-[9px] text-slate-500 font-sans">Å³</span>
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase block">Net Bound b</span>
                <span className={`text-xs font-mono font-black mt-0.5 block ${metrics.totalBoundScatLength < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metrics.totalBoundScatLength.toFixed(2)} <span className="text-[9px] text-slate-500 font-sans">fm</span>
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase block">Nuclear SLD</span>
                <span className="text-xs font-mono font-black text-amber-400 mt-0.5 block">
                  {metrics.cellSLD.toFixed(3)} <span className="text-[8px] text-slate-500 font-sans">10⁻⁶Å⁻²</span>
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase block">X-ray Electron SLD</span>
                <span className="text-xs font-mono font-black text-purple-400 mt-0.5 block">
                  {metrics.xraySLD.toFixed(3)} <span className="text-[8px] text-slate-500 font-sans">10⁻⁶Å⁻²</span>
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase block">Est. Coherent σ</span>
                <span className="text-xs font-mono font-black text-emerald-400 mt-0.5 block">
                  {metrics.totalCoherentSigma.toFixed(2)} <span className="text-[9px] text-slate-500 font-sans">barns</span>
                </span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase block">1mm Transmission</span>
                <span className="text-xs font-mono font-black text-cyan-400 mt-0.5 block">
                  {metrics.transmission1mm.toFixed(1)}% <span className="text-[8px] text-slate-500 font-sans">T</span>
                </span>
              </div>
            </div>
          </div>

          {/* Asymmetric Atomic Sites Manager */}
          <div className="bg-[#0B1528] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                  Atomic Scatterer Sites ({atoms.length})
                </h3>
              </div>
              <button
                onClick={addAtom}
                className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold"
              >
                + Add Site
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {atoms.map((atom) => (
                <div key={atom.id} className="bg-black/40 p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={atom.label}
                        onChange={(e) => updateAtom(atom.id, 'label', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={atom.element}
                        onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                        className="w-14 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                        placeholder="El/Iso"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-[11px] font-mono font-black ${atom.b < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          b = {atom.b.toFixed(2)} fm
                        </span>
                      </div>
                      {atoms.length > 1 && (
                        <button
                          onClick={() => removeAtom(atom.id)}
                          className="text-slate-600 hover:text-rose-400 p-1 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono">
                    {(['x', 'y', 'z', 'B_iso'] as const).map(field => (
                      <div key={field} className="space-y-0.5">
                        <span className="text-slate-500 uppercase block">{field === 'B_iso' ? 'B_iso' : field}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={atom[field]}
                          onChange={(e) => updateAtom(atom.id, field, parseFloat(e.target.value) || 0)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-1.5 py-1 text-blue-300 focus:outline-none font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Interactive Visualizer Workspace (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Primary Navigation Bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B1528] p-2 rounded-2xl border border-white/10 shadow-xl">
            {[
              { id: 'scatter_plane', label: 'Reciprocal Scatter Plane', icon: Compass, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
              { id: 'pattern', label: '1D Powder Spectrum', icon: Activity, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
              { id: 'rings', label: '2D Debye-Scherrer Rings', icon: Disc, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
              { id: 'isotopes', label: 'Isotopes & Cross Sections', icon: Database, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
              { id: 'fourier', label: 'Unit Cell & SLD Map', icon: Layers, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
              { id: 'solvent', label: 'Solvent SANS Contrast', icon: Droplet, color: 'text-pink-400 bg-pink-500/15 border-pink-500/30' },
              { id: 'kinematics', label: 'Neutron Kinematics', icon: Zap, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none ${
                    isActive
                      ? `${tab.color} border shadow-md`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Active Tab View Rendering */}
          <div className="bg-[#0B1528] p-6 rounded-3xl border border-white/10 shadow-2xl min-h-[520px]">
            {activeTab === 'scatter_plane' && (
              <ReciprocalScatterPlaneView
                lattice={lattice}
                atoms={atoms}
                wavelength={wavelength}
                lengthUnit={lengthUnit}
              />
            )}

            {activeTab === 'pattern' && (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      1D Nuclear Powder Diffraction Spectrum
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Synthesized neutron powder pattern with optional X-ray dual overlay.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setComparisonMode(!comparisonMode)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        comparisonMode
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-black/40 text-slate-400 border-white/10 hover:text-slate-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {comparisonMode ? 'X-Ray Compare: ON' : 'Compare with X-Ray'}
                    </button>
                  </div>
                </div>

                {/* 1D Recharts Plot */}
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={detailedReflections} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                      <XAxis
                        dataKey="twoTheta"
                        label={{ value: '2θ (degrees)', position: 'bottom', offset: 5, fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                        type="number"
                        domain={[0, 'auto']}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis
                        label={{ value: 'Normalized Intensity (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as DetailedDiffractionSpectrum;
                            return (
                              <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 text-xs space-y-2">
                                <p className="font-extrabold border-b border-slate-800 pb-1.5 text-slate-300">
                                  Plane {d.hklStr} at {d.twoTheta.toFixed(2)}°
                                </p>
                                <div className="space-y-1">
                                  <p className="text-blue-400 font-bold flex justify-between gap-4">
                                    <span>Neutron Intensity:</span> <span>{d.intensity_nuc.toFixed(1)}%</span>
                                  </p>
                                  {comparisonMode && (
                                    <p className="text-purple-400 font-bold flex justify-between gap-4">
                                      <span>X-Ray Intensity:</span> <span>{d.intensity_xray.toFixed(1)}%</span>
                                    </p>
                                  )}
                                  <div className="w-full h-px bg-slate-800 my-1" />
                                  <p className="text-slate-400 text-[10px] font-mono flex justify-between">
                                    <span>d-spacing:</span> <span>{d.dSpacing.toFixed(4)} Å</span>
                                  </p>
                                  <p className="text-slate-400 text-[10px] font-mono flex justify-between">
                                    <span>Phase:</span> <span>{d.phase_nuc_deg.toFixed(1)}°</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }} />
                      <Bar name="Neutron Intensity" dataKey="intensity_nuc" barSize={8} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      {comparisonMode && (
                        <Bar name="X-Ray Intensity" dataKey="intensity_xray" barSize={8} fill="#a855f7" radius={[4, 4, 0, 0]} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Reflections Data Table */}
                <div className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-3 border-b border-white/10 bg-black/60 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                      <Table className="w-3.5 h-3.5 text-blue-400" />
                      Reflections Table ({detailedReflections.length} Peaks)
                    </span>
                    <button
                      onClick={handleExportCSV}
                      className="text-[10px] font-mono text-blue-400 hover:text-blue-300 font-bold"
                    >
                      Export CSV
                    </button>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs text-left text-slate-300 border-collapse">
                      <thead className="text-[9px] text-slate-500 uppercase tracking-widest bg-black/80 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="px-4 py-2.5 font-black border-b border-white/10">HKL</th>
                          <th className="px-4 py-2.5 font-black border-b border-white/10 text-center">2θ (°)</th>
                          <th className="px-4 py-2.5 font-black border-b border-white/10 text-center">d (Å)</th>
                          <th className="px-4 py-2.5 font-black border-b border-white/10 text-center">Phase</th>
                          <th className="px-4 py-2.5 font-black border-b border-white/10 text-right text-blue-400">Neutron %</th>
                          {comparisonMode && (
                            <th className="px-4 py-2.5 font-black border-b border-white/10 text-right text-purple-400">X-Ray %</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {detailedReflections.map((r, i) => (
                          <tr key={`${r.hklStr}-${i}`} className="hover:bg-white/5">
                            <td className="px-4 py-2 font-bold text-white">[{r.hkl.join(' ')}]</td>
                            <td className="px-4 py-2 text-center text-slate-400">{r.twoTheta.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center text-slate-400">{r.dSpacing.toFixed(3)}</td>
                            <td className={`px-4 py-2 text-center ${r.phase_nuc_deg < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {r.phase_nuc_deg.toFixed(0)}°
                            </td>
                            <td className="px-4 py-2 text-right font-black text-blue-400">{r.intensity_nuc.toFixed(1)}</td>
                            {comparisonMode && (
                              <td className="px-4 py-2 text-right font-black text-purple-400">{r.intensity_xray.toFixed(1)}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rings' && (
              <DebyeScherrerRings2D
                neutronReflections={detailedReflections}
                radiationMode={ringRadiationMode}
                onRadiationModeChange={setRingRadiationMode}
                metrics={metrics}
                lengthUnit={lengthUnit}
              />
            )}

            {activeTab === 'isotopes' && (
              <IsotopeContrastWorkbench
                atoms={atoms}
                onUpdateAtom={updateAtom}
                onBulkUpdateAtoms={setAtoms}
                lattice={lattice}
                wavelength={wavelength}
                lengthUnit={lengthUnit}
              />
            )}

            {activeTab === 'fourier' && (
              <UnitCellFourierMap
                lattice={lattice}
                atoms={atoms}
                wavelength={wavelength}
                lengthUnit={lengthUnit}
              />
            )}

            {activeTab === 'solvent' && (
              <SolventContrastMatchingTool
                cellSLD={metrics.cellSLD}
                d2oFraction={d2oFraction}
                onD2oFractionChange={setD2oFraction}
              />
            )}

            {activeTab === 'kinematics' && (
              <NeutronKinematicsCalculator
                wavelength={wavelength}
                onWavelengthChange={setWavelength}
                lengthUnit={lengthUnit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-white/10 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Import Crystal & Nuclear Dataset
            </h3>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste JSON configuration containing lattice and atoms..."
              className="w-full h-48 bg-black/60 border border-white/10 rounded-2xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500/40"
            />
            {importError && (
              <p className="text-xs text-rose-400 font-bold">{importError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 rounded-xl bg-black/40 text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                Load Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
