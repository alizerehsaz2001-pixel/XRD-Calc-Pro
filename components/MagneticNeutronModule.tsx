import React, { useState, useEffect } from 'react';
import { LatticeParameters } from '../types';
import {
  MagneticAtom,
  MagneticReflection,
  PolarizationConfig,
  CriticalExponentModel,
  PRESET_MAGNETIC_STRUCTURES,
  calculateAdvancedMagneticDiffraction,
  calculateMagneticMetrics
} from '../utils/magneticDiffractionPhysics';
import { NEUTRON_SCATTERING_LENGTHS, NEUTRON_WAVELENGTHS } from '../utils/physics';

import { Magnetic3DStructureVisualizer } from './magnetic_diffraction/Magnetic3DStructureVisualizer';
import { MagneticReciprocalSpaceViewer } from './magnetic_diffraction/MagneticReciprocalSpaceViewer';
import { MagneticPolarizationStudio } from './magnetic_diffraction/MagneticPolarizationStudio';
import { MagneticTemperaturePhaseViewer } from './magnetic_diffraction/MagneticTemperaturePhaseViewer';
import { Magnetic2DDetectorRings } from './magnetic_diffraction/Magnetic2DDetectorRings';
import { MagneticRefinementPanel } from './magnetic_diffraction/MagneticRefinementPanel';
import { MagneticCodeExporter } from './magnetic_diffraction/MagneticCodeExporter';
import { MagneticAIAdvisor } from './magnetic_diffraction/MagneticAIAdvisor';

import {
  Layers,
  Compass,
  Radio,
  Thermometer,
  Disc,
  Sliders,
  Code2,
  Sparkles,
  Plus,
  Trash2,
  RotateCw,
  Zap,
  Bookmark,
  ArrowUpRight,
  RefreshCw,
  Atom,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const MagneticNeutronModule: React.FC = () => {
  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mno_afm');

  // Wavelength & Lattice
  const [wavelength, setWavelength] = useState<number>(2.41);
  const [lattice, setLattice] = useState<LatticeParameters>({
    a: 4.445, b: 4.445, c: 4.445, alpha: 90, beta: 90, gamma: 90
  });
  const [kVector, setKVector] = useState({ x: 0.5, y: 0.5, z: 0.5 });

  // Thermal & Polarization parameters
  const [temperature, setTemperature] = useState<number>(10);
  const [criticalTemp, setCriticalTemp] = useState<number>(118);
  const [exponentModel, setExponentModel] = useState<CriticalExponentModel>('3D-Heisenberg');

  const [polarizationConfig, setPolarizationConfig] = useState<PolarizationConfig>({
    mode: 'unpolarized',
    guideFieldDirection: { x: 0, y: 0, z: 1 },
    polarizationEfficiency: 0.96,
    flipperEfficiency: 0.99
  });

  // Atoms State
  const [atoms, setAtoms] = useState<MagneticAtom[]>(
    PRESET_MAGNETIC_STRUCTURES[0].atoms
  );

  // Active Workspace Sub-Tab
  const [activeTab, setActiveTab] = useState<
    '3d_structure' | 'reciprocal_space' | 'polarimetry' | 'temperature_phase' | '2d_detector' | 'refinement' | 'export_code' | 'ai_advisor'
  >('3d_structure');

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = PRESET_MAGNETIC_STRUCTURES.find(item => item.id === presetId);
    if (!p) return;

    setLattice({ ...p.lattice });
    setKVector({ ...p.kVector });
    setTemperature(p.temperature);
    setCriticalTemp(p.criticalTemp);
    setExponentModel(p.exponentModel);
    setAtoms([...p.atoms]);
  };

  // Atom List Operations
  const updateAtom = (id: string, field: keyof MagneticAtom, value: any) => {
    setAtoms(atoms.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: value };
        if (field === 'element' && NEUTRON_SCATTERING_LENGTHS[value]) {
          updated.b = NEUTRON_SCATTERING_LENGTHS[value];
        }
        return updated;
      }
      return a;
    }));
  };

  const handleAddAtom = () => {
    const newId = `atom_${Date.now()}`;
    setAtoms([
      ...atoms,
      {
        id: newId,
        element: 'Fe',
        label: `Fe${atoms.length + 1}`,
        b: 9.45,
        x: 0,
        y: 0,
        z: 0.5,
        B_iso: 0.45,
        mx: 0,
        my: 0,
        mz: 3.5,
        ion: 'Fe3+'
      }
    ]);
  };

  const handleDeleteAtom = (id: string) => {
    if (atoms.length <= 1) return;
    setAtoms(atoms.filter(a => a.id !== id));
  };

  const handleAlignSpins = (axis: 'x' | 'y' | 'z', value: number) => {
    setAtoms(atoms.map(a => ({
      ...a,
      mx: axis === 'x' ? value : 0,
      my: axis === 'y' ? value : 0,
      mz: axis === 'z' ? value : 0
    })));
  };

  const handleInvertSpins = () => {
    setAtoms(atoms.map(a => ({
      ...a,
      mx: -(a.mx || 0),
      my: -(a.my || 0),
      mz: -(a.mz || 0)
    })));
  };

  // Compute Diffraction reflections & metrics
  const { reflections, metrics } = calculateAdvancedMagneticDiffraction(
    wavelength,
    lattice,
    atoms,
    110,
    kVector,
    temperature,
    criticalTemp,
    exponentModel,
    polarizationConfig
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-100 p-2 sm:p-4">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-6 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-rose-500/20 rounded-2xl border border-indigo-500/30 shadow-inner">
              <Atom className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
                Magnetic Neutron Diffraction Studio
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  v3.5 PRO
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-tensor Blume-Halpern magnetic interaction vectors, incommensurate satellites &amp; XYZ polarimetry
              </p>
            </div>
          </div>

          {/* Preset Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <Bookmark className="w-4 h-4 text-indigo-400 ml-2" />
            <select
              value={selectedPresetId}
              onChange={e => handleLoadPreset(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-200 outline-none pr-3 cursor-pointer"
            >
              {PRESET_MAGNETIC_STRUCTURES.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Summary Badge Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-4 border-t border-slate-800/80">
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[8px] font-mono uppercase text-slate-500 block">Magnetic Order</span>
            <span className="text-xs font-black text-amber-400 truncate block mt-0.5">{metrics.orderType}</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[8px] font-mono uppercase text-slate-500 block">Sublattice Moment</span>
            <span className="text-xs font-mono font-black text-rose-400 block mt-0.5">
              {metrics.totalSublatticeMomentT.toFixed(2)} <span className="text-[9px] text-slate-500">μB</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[8px] font-mono uppercase text-slate-500 block">Reduced Order M(T)</span>
            <span className="text-xs font-mono font-black text-indigo-400 block mt-0.5">
              {(metrics.orderParameter * 100).toFixed(1)}%
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[8px] font-mono uppercase text-slate-500 block">k-Propagation Vector</span>
            <span className="text-xs font-mono font-black text-cyan-400 block mt-0.5">
              [{kVector.x.toFixed(2)}, {kVector.y.toFixed(2)}, {kVector.z.toFixed(2)}]
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[8px] font-mono uppercase text-slate-500 block">Cell Volume</span>
            <span className="text-xs font-mono font-black text-slate-200 block mt-0.5">
              {metrics.cellVolume.toFixed(2)} <span className="text-[9px] text-slate-500">Å³</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[8px] font-mono uppercase text-slate-500 block">Reflections Count</span>
            <span className="text-xs font-mono font-black text-emerald-400 block mt-0.5">
              {reflections.length} peaks
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        {[
          { id: '3d_structure', label: '3D Spin Supercell', icon: Layers },
          { id: 'reciprocal_space', label: 'Reciprocal Space Cuts', icon: Compass },
          { id: 'polarimetry', label: 'XYZ Polarimetry', icon: Radio },
          { id: 'temperature_phase', label: 'Phase Boundary & T', icon: Thermometer },
          { id: '2d_detector', label: '2D Powder Rings', icon: Disc },
          { id: 'refinement', label: 'Moment Refinement', icon: Sliders },
          { id: 'export_code', label: 'FullProf / mCIF Export', icon: Code2 },
          { id: 'ai_advisor', label: 'Quantum AI Advisor', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Primary Workspace View Area */}
      <div className="transition-all duration-200">
        {activeTab === '3d_structure' && (
          <Magnetic3DStructureVisualizer
            lattice={lattice}
            atoms={atoms}
            metrics={metrics}
            kVector={kVector}
            temperature={temperature}
            criticalTemp={criticalTemp}
          />
        )}

        {activeTab === 'reciprocal_space' && (
          <MagneticReciprocalSpaceViewer
            lattice={lattice}
            reflections={reflections}
            kVector={kVector}
            wavelength={wavelength}
          />
        )}

        {activeTab === 'polarimetry' && (
          <MagneticPolarizationStudio
            reflections={reflections}
            polarizationConfig={polarizationConfig}
            onPolarizationChange={setPolarizationConfig}
            wavelength={wavelength}
          />
        )}

        {activeTab === 'temperature_phase' && (
          <MagneticTemperaturePhaseViewer
            temperature={temperature}
            criticalTemp={criticalTemp}
            exponentModel={exponentModel}
            metrics={metrics}
            onTemperatureChange={setTemperature}
            onExponentModelChange={setExponentModel}
            onCriticalTempChange={setCriticalTemp}
          />
        )}

        {activeTab === '2d_detector' && (
          <Magnetic2DDetectorRings
            reflections={reflections}
            wavelength={wavelength}
          />
        )}

        {activeTab === 'refinement' && (
          <MagneticRefinementPanel
            lattice={lattice}
            atoms={atoms}
            reflections={reflections}
            onAtomsChange={setAtoms}
            wavelength={wavelength}
          />
        )}

        {activeTab === 'export_code' && (
          <MagneticCodeExporter
            lattice={lattice}
            atoms={atoms}
            metrics={metrics}
            kVector={kVector}
            temperature={temperature}
            criticalTemp={criticalTemp}
            reflections={reflections}
            wavelength={wavelength}
          />
        )}

        {activeTab === 'ai_advisor' && (
          <MagneticAIAdvisor
            lattice={lattice}
            atoms={atoms}
            metrics={metrics}
            kVector={kVector}
            temperature={temperature}
            criticalTemp={criticalTemp}
          />
        )}
      </div>

      {/* Unified Crystallographic & Magnetic Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Lattice & Beamline Parameters */}
        <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Lattice &amp; Beamline Settings</h3>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Neutron Wavelength (λ)</span>
              <span className="text-indigo-400 font-bold">{wavelength.toFixed(3)} Å</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={5.0}
              step={0.01}
              value={wavelength}
              onChange={e => setWavelength(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex gap-1 mt-1.5">
              {[1.54, 2.41, 1.28, 4.0].map(val => (
                <button
                  key={val}
                  onClick={() => setWavelength(val)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                    wavelength === val ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {val}Å
                </button>
              ))}
            </div>
          </div>

          {/* Lattice dimensions */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[9px] font-mono text-slate-400 block mb-1">a (Å)</span>
              <input
                type="number"
                step="0.01"
                value={lattice.a}
                onChange={e => setLattice({ ...lattice, a: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block mb-1">b (Å)</span>
              <input
                type="number"
                step="0.01"
                value={lattice.b}
                onChange={e => setLattice({ ...lattice, b: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block mb-1">c (Å)</span>
              <input
                type="number"
                step="0.01"
                value={lattice.c}
                onChange={e => setLattice({ ...lattice, c: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Propagation vector k */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono font-bold text-rose-400 block mb-1.5">
              Modulation Vector k (kx, ky, kz)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.05"
                value={kVector.x}
                onChange={e => setKVector({ ...kVector, x: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-rose-500"
              />
              <input
                type="number"
                step="0.05"
                value={kVector.y}
                onChange={e => setKVector({ ...kVector, y: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-rose-500"
              />
              <input
                type="number"
                step="0.05"
                value={kVector.z}
                onChange={e => setKVector({ ...kVector, z: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Quick Spin alignment tools */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleAlignSpins('z', 3.0)}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold"
            >
              Align +Z
            </button>
            <button
              onClick={() => handleAlignSpins('x', 3.0)}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold"
            >
              Align +X
            </button>
            <button
              onClick={handleInvertSpins}
              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[9px] font-mono font-bold border border-rose-500/30"
            >
              Invert Spins
            </button>
          </div>
        </div>

        {/* Magnetic Atoms Sublattice Editor */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Magnetic Atoms &amp; Moment Vectors (μB)
                </h3>
              </div>
              <button
                onClick={handleAddAtom}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Atom</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[250px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="text-[9px] font-mono uppercase text-slate-500 bg-slate-950 sticky top-0">
                  <tr>
                    <th className="p-2">Label</th>
                    <th className="p-2">Elem</th>
                    <th className="p-2">Ion</th>
                    <th className="p-2">x</th>
                    <th className="p-2">y</th>
                    <th className="p-2">z</th>
                    <th className="p-2 text-rose-400">mx (μB)</th>
                    <th className="p-2 text-rose-400">my (μB)</th>
                    <th className="p-2 text-rose-400">mz (μB)</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {atoms.map(a => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={a.label}
                          onChange={e => updateAtom(a.id, 'label', e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-800 text-white rounded px-1.5 py-0.5 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={a.element}
                          onChange={e => updateAtom(a.id, 'element', e.target.value)}
                          className="w-10 bg-slate-950 border border-slate-800 text-white rounded px-1.5 py-0.5 text-xs text-center"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={a.ion || ''}
                          onChange={e => updateAtom(a.id, 'ion', e.target.value)}
                          className="w-12 bg-slate-950 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.05"
                          value={a.x}
                          onChange={e => updateAtom(a.id, 'x', Number(e.target.value))}
                          className="w-12 bg-slate-950 border border-slate-800 text-white rounded px-1.5 py-0.5 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.05"
                          value={a.y}
                          onChange={e => updateAtom(a.id, 'y', Number(e.target.value))}
                          className="w-12 bg-slate-950 border border-slate-800 text-white rounded px-1.5 py-0.5 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.05"
                          value={a.z}
                          onChange={e => updateAtom(a.id, 'z', Number(e.target.value))}
                          className="w-12 bg-slate-950 border border-slate-800 text-white rounded px-1.5 py-0.5 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={a.mx || 0}
                          onChange={e => updateAtom(a.id, 'mx', Number(e.target.value))}
                          className="w-12 bg-slate-950 border border-rose-500/30 text-rose-300 rounded px-1.5 py-0.5 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={a.my || 0}
                          onChange={e => updateAtom(a.id, 'my', Number(e.target.value))}
                          className="w-12 bg-slate-950 border border-rose-500/30 text-rose-300 rounded px-1.5 py-0.5 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={a.mz || 0}
                          onChange={e => updateAtom(a.id, 'mz', Number(e.target.value))}
                          className="w-12 bg-slate-950 border border-rose-500/30 text-rose-300 rounded px-1.5 py-0.5 text-xs font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <button
                          onClick={() => handleDeleteAtom(a.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Full Diffraction Spectrum Manifest Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl backdrop-blur-md text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Diffraction Reflections &amp; Intensity Spectrum
            </h3>
            <p className="text-[10px] text-slate-400">
              Separated Nuclear vs Magnetic Bragg peak cross-sections and polarization terms
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-400">
            {reflections.length} Total Reflections
          </span>
        </div>

        {/* Recharts Composite Spectrum */}
        <div className="bg-[#060a14] rounded-2xl border border-slate-800 p-3 h-[240px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={reflections.map(r => ({
              twoTheta: Number(r.twoTheta.toFixed(2)),
              nuclear: Number(r.nuclearIntensity.toFixed(2)),
              magnetic: Number(r.magneticIntensity.toFixed(2)),
              total: Number(r.totalIntensity.toFixed(2)),
              label: r.label
            }))} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
              <XAxis dataKey="twoTheta" stroke="#64748b" fontSize={10} tickFormatter={v => `${v}°`} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
              <Bar dataKey="nuclear" name="Nuclear (I_N)" fill="#38bdf8" stackId="a" barSize={8} />
              <Bar dataKey="magnetic" name="Magnetic (I_M)" fill="#f43f5e" stackId="a" barSize={8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Reflections Manifest Table */}
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs text-left">
            <thead className="text-[9px] font-mono uppercase text-slate-500 bg-slate-950 sticky top-0">
              <tr>
                <th className="p-2.5">Plane / Satellite</th>
                <th className="p-2.5 text-right">2θ (deg)</th>
                <th className="p-2.5 text-right">d-Spacing (Å)</th>
                <th className="p-2.5 text-right text-cyan-400">I_Nuclear</th>
                <th className="p-2.5 text-right text-rose-400">I_Magnetic</th>
                <th className="p-2.5 text-right text-white">I_Total</th>
                <th className="p-2.5 text-right text-indigo-400">|F_M⊥|</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {reflections.map((r, idx) => (
                <tr key={`${r.twoTheta}-${idx}`} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-200">
                    {r.label}
                    {r.isSatellite && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[8px] font-sans">
                        Satellite
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-right text-slate-300">{r.twoTheta.toFixed(2)}°</td>
                  <td className="p-2.5 text-right text-slate-400">{r.dSpacing.toFixed(3)}</td>
                  <td className="p-2.5 text-right text-cyan-400">{r.nuclearIntensity.toFixed(1)}</td>
                  <td className="p-2.5 text-right text-rose-400 font-bold">{r.magneticIntensity.toFixed(1)}</td>
                  <td className="p-2.5 text-right font-black text-white">{r.totalIntensity.toFixed(1)}</td>
                  <td className="p-2.5 text-right text-indigo-400">{r.F_mag_perp_mag.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
