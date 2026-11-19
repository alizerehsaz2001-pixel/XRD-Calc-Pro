import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Box,
  Check,
  Copy,
  Download,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  computeTheoreticalDensity,
  computeUnitCellVolume,
  CustomCentering,
  CustomCrystalSystem,
  CustomMaterialPeak,
  generateBraggPeaksFromLattice,
  useCustomMaterials,
  UserCustomMaterial,
} from './CustomMaterialContext';

const CRYSTAL_SYSTEMS: CustomCrystalSystem[] = [
  'Cubic',
  'Tetragonal',
  'Hexagonal',
  'Trigonal',
  'Orthorhombic',
  'Monoclinic',
  'Triclinic',
  'Amorphous',
];

const CENTERINGS: CustomCentering[] = ['P', 'I', 'F', 'C', 'R'];

const CATEGORIES = [
  'Custom Standard',
  'Metals, Intermetallics & Metallurgy',
  'Ceramics, Refractories & Oxides',
  'Perovskites & Photovoltaics',
  'Semiconductors & Electronic Materials',
  'Energy Storage & Batteries',
  '2D Materials & Nanomaterials',
  'Magnetic & Multiferroic Materials',
  'Biomaterials & Pharmaceuticals',
  'Minerals, Ores & Geology',
  'Polymers & Soft Matter',
];

const ANODES = [
  { label: 'Cu Kα₁', value: 1.54056 },
  { label: 'Co Kα₁', value: 1.78897 },
  { label: 'Mo Kα₁', value: 0.71073 },
  { label: 'Cr Kα₁', value: 2.2897 },
  { label: 'Fe Kα₁', value: 1.93604 },
];

interface StarterTemplate {
  label: string;
  patch: Partial<UserCustomMaterial>;
}

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    label: 'Cubic FCC Alloy',
    patch: {
      name: 'Custom FCC Alloy',
      formula: 'Ni3Al',
      category: 'Metals, Intermetallics & Metallurgy',
      crystalSystem: 'Cubic',
      centering: 'F',
      spaceGroup: 'Fm-3m',
      spaceGroupNumber: 225,
      zValue: 4,
      lattice: { a: 3.57, b: 3.57, c: 3.57, alpha: 90, beta: 90, gamma: 90 },
      density: 7.5,
      molecularWeight: 203.05,
      youngsModulusGPa: 205,
      poissonRatio: 0.3,
      rir: 3.6,
      massAttenuation: 68,
      crystalliteSizeNm: 26,
      microstrain: 0.0022,
      preferredR: 0.85,
      preferredAxis: '1, 1, 1',
      residualStressMPa: -260,
      filmThicknessNm: 55,
      roughnessNm: 0.6,
      sldXray: 57.4,
      scatteringLengthFm: 8.6,
      magneticMomentMuB: 0.6,
      nearestNeighborA: 2.52,
    },
  },
  {
    label: 'Tetragonal Oxide',
    patch: {
      name: 'Custom Doped TiO2',
      formula: 'Ti0.95Nb0.05O2',
      category: 'Ceramics, Refractories & Oxides',
      crystalSystem: 'Tetragonal',
      centering: 'I',
      spaceGroup: 'I41/amd',
      spaceGroupNumber: 141,
      zValue: 4,
      lattice: { a: 3.792, b: 3.792, c: 9.528, alpha: 90, beta: 90, gamma: 90 },
      density: 3.96,
      molecularWeight: 82.12,
      youngsModulusGPa: 245,
      poissonRatio: 0.27,
      rir: 3.25,
      massAttenuation: 121.4,
      crystalliteSizeNm: 18,
      microstrain: 0.0019,
      preferredR: 0.78,
      preferredAxis: '0, 0, 1',
      residualStressMPa: -140,
      filmThicknessNm: 38,
      roughnessNm: 0.5,
      sldXray: 31.8,
      scatteringLengthFm: 4.1,
      magneticMomentMuB: 0,
      nearestNeighborA: 1.96,
    },
  },
  {
    label: 'Hexagonal Ceramic',
    patch: {
      name: 'Custom Al-Doped ZnO',
      formula: 'Zn0.98Al0.02O',
      category: 'Semiconductors & Electronic Materials',
      crystalSystem: 'Hexagonal',
      centering: 'P',
      spaceGroup: 'P63mc',
      spaceGroupNumber: 186,
      zValue: 2,
      lattice: { a: 3.249, b: 3.249, c: 5.206, alpha: 90, beta: 90, gamma: 120 },
      density: 5.61,
      molecularWeight: 80.6,
      youngsModulusGPa: 142,
      poissonRatio: 0.35,
      rir: 5.2,
      massAttenuation: 51.2,
      crystalliteSizeNm: 34,
      microstrain: 0.0014,
      preferredR: 0.48,
      preferredAxis: '0, 0, 2',
      residualStressMPa: -195,
      filmThicknessNm: 80,
      roughnessNm: 0.85,
      sldXray: 42.1,
      scatteringLengthFm: 5.72,
      magneticMomentMuB: 0,
      nearestNeighborA: 1.98,
    },
  },
  {
    label: 'Magnetic Oxide',
    patch: {
      name: 'Custom Spinel Ferrite',
      formula: 'CoFe2O4',
      category: 'Magnetic & Multiferroic Materials',
      crystalSystem: 'Cubic',
      centering: 'F',
      spaceGroup: 'Fd-3m',
      spaceGroupNumber: 227,
      zValue: 8,
      lattice: { a: 8.392, b: 8.392, c: 8.392, alpha: 90, beta: 90, gamma: 90 },
      density: 5.29,
      molecularWeight: 234.62,
      youngsModulusGPa: 175,
      poissonRatio: 0.28,
      rir: 4.4,
      massAttenuation: 214,
      crystalliteSizeNm: 24,
      microstrain: 0.0021,
      preferredR: 0.95,
      preferredAxis: '3, 1, 1',
      residualStressMPa: -120,
      filmThicknessNm: 50,
      roughnessNm: 0.65,
      sldXray: 39.8,
      scatteringLengthFm: 7.45,
      magneticMomentMuB: 3.4,
      propagationVector: { x: 0, y: 0, z: 0 },
      neelTempK: 790,
      nearestNeighborA: 2.04,
    },
  },
];

function createBlankMaterial(): UserCustomMaterial {
  const lattice = { a: 4.12, b: 4.12, c: 4.12, alpha: 90, beta: 90, gamma: 90 };
  return {
    id: `custom_${Date.now()}`,
    name: 'My Custom Material',
    formula: 'ABO3',
    category: 'Custom Standard',
    description: 'User-defined custom crystalline phase for multi-module XRD analysis.',
    crystalSystem: 'Cubic',
    centering: 'P',
    spaceGroup: 'Pm-3m',
    spaceGroupNumber: 221,
    zValue: 1,
    lattice,
    density: 5.12,
    molecularWeight: 215.4,
    youngsModulusGPa: 180,
    poissonRatio: 0.28,
    rir: 3.1,
    massAttenuation: 95,
    crystalliteSizeNm: 30,
    microstrain: 0.0016,
    wavelength: 1.54056,
    etaMix: 0.45,
    preferredR: 0.8,
    preferredAxis: '0, 0, 1',
    residualStressMPa: -180,
    filmThicknessNm: 45,
    roughnessNm: 0.6,
    sldXray: 38.5,
    scatteringLengthFm: 5.8,
    magneticMomentMuB: 2.0,
    propagationVector: { x: 0.5, y: 0.5, z: 0.5 },
    neelTempK: 180,
    nearestNeighborA: 2.06,
    peaks: generateBraggPeaksFromLattice({
      crystalSystem: 'Cubic',
      centering: 'P',
      lattice,
      wavelength: 1.54056,
      crystalliteSizeNm: 30,
      microstrain: 0.0016,
    }),
    updatedAt: new Date().toISOString(),
    isCustom: true,
  };
}

export const CustomMaterialStudioModal: React.FC = () => {
  const {
    editorOpen,
    editorMode,
    editingMaterial,
    editorTargetModule,
    closeEditor,
    saveCustomMaterial,
    deleteCustomMaterial,
    duplicateCustomMaterial,
  } = useCustomMaterials();

  const [tab, setTab] = useState<'identity' | 'peaks' | 'mechanical' | 'advanced'>('identity');
  const [draft, setDraft] = useState<UserCustomMaterial>(() => createBlankMaterial());
  const [error, setError] = useState<string | null>(null);
  const [rawPeakMode, setRawPeakMode] = useState(false);
  const [rawPeakText, setRawPeakText] = useState('');
  const [newPeak, setNewPeak] = useState({ twoTheta: '', intensity: '80', fwhm: '0.28', h: '1', k: '0', l: '0' });
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editorOpen) return;
    setError(null);
    setTab('identity');
    setRawPeakMode(false);
    if (editorMode === 'edit' && editingMaterial) {
      setDraft({
        ...editingMaterial,
        lattice: { ...editingMaterial.lattice },
        propagationVector: { ...editingMaterial.propagationVector },
        peaks: editingMaterial.peaks.map((p) => ({ ...p })),
      });
    } else {
      setDraft(createBlankMaterial());
    }
  }, [editorOpen, editorMode, editingMaterial]);

  const cellVolume = useMemo(() => computeUnitCellVolume(draft.lattice), [draft.lattice]);
  const calcDensity = useMemo(
    () => computeTheoreticalDensity(draft.zValue, draft.molecularWeight, draft.lattice),
    [draft.zValue, draft.molecularWeight, draft.lattice]
  );

  if (!editorOpen) return null;

  const updateLattice = (key: keyof UserCustomMaterial['lattice'], value: number) => {
    setDraft((prev) => {
      const next = { ...prev.lattice, [key]: value };
      if (prev.crystalSystem === 'Cubic' && (key === 'a' || key === 'b' || key === 'c')) {
        next.a = value;
        next.b = value;
        next.c = value;
        next.alpha = 90;
        next.beta = 90;
        next.gamma = 90;
      } else if (
        (prev.crystalSystem === 'Tetragonal' || prev.crystalSystem === 'Hexagonal') &&
        (key === 'a' || key === 'b')
      ) {
        next.a = value;
        next.b = value;
      }
      return { ...prev, lattice: next };
    });
  };

  const handleSystemChange = (sys: CustomCrystalSystem) => {
    setDraft((prev) => {
      const l = { ...prev.lattice };
      if (sys === 'Cubic') {
        l.b = l.a;
        l.c = l.a;
        l.alpha = 90;
        l.beta = 90;
        l.gamma = 90;
      } else if (sys === 'Tetragonal') {
        l.b = l.a;
        l.alpha = 90;
        l.beta = 90;
        l.gamma = 90;
      } else if (sys === 'Hexagonal' || sys === 'Trigonal') {
        l.b = l.a;
        l.alpha = 90;
        l.beta = 90;
        l.gamma = 120;
      } else if (sys === 'Orthorhombic') {
        l.alpha = 90;
        l.beta = 90;
        l.gamma = 90;
      }
      return { ...prev, crystalSystem: sys, lattice: l };
    });
  };

  const handleRegeneratePeaks = () => {
    const generated = generateBraggPeaksFromLattice({
      crystalSystem: draft.crystalSystem,
      centering: draft.centering,
      lattice: draft.lattice,
      wavelength: draft.wavelength,
      crystalliteSizeNm: draft.crystalliteSizeNm,
      microstrain: draft.microstrain,
      maxPeaks: 10,
    });
    setDraft((prev) => ({ ...prev, peaks: generated }));
    setRawPeakText(
      generated
        .map((p) => `${p.twoTheta.toFixed(3)}, ${p.intensity.toFixed(1)}, ${p.fwhm.toFixed(3)}, ${p.h}, ${p.k}, ${p.l}`)
        .join('\n')
    );
  };

  const handleApplyTemplate = (tpl: StarterTemplate) => {
    setDraft((prev) => {
      const merged: UserCustomMaterial = {
        ...prev,
        ...tpl.patch,
        lattice: tpl.patch.lattice ? { ...tpl.patch.lattice } : prev.lattice,
        propagationVector: tpl.patch.propagationVector
          ? { ...tpl.patch.propagationVector }
          : prev.propagationVector,
      };
      merged.peaks = generateBraggPeaksFromLattice({
        crystalSystem: merged.crystalSystem,
        centering: merged.centering,
        lattice: merged.lattice,
        wavelength: merged.wavelength,
        crystalliteSizeNm: merged.crystalliteSizeNm,
        microstrain: merged.microstrain,
        maxPeaks: 10,
      });
      return merged;
    });
  };

  const handleAddPeak = () => {
    const tt = parseFloat(newPeak.twoTheta);
    const inten = parseFloat(newPeak.intensity);
    const fwhm = parseFloat(newPeak.fwhm);
    const h = parseInt(newPeak.h, 10) || 0;
    const k = parseInt(newPeak.k, 10) || 0;
    const l = parseInt(newPeak.l, 10) || 0;
    if (!Number.isFinite(tt) || tt <= 2 || tt >= 175) {
      setError('Peak 2θ must be between 2° and 175°.');
      return;
    }
    setError(null);
    const dSpacing = draft.wavelength / (2 * Math.sin(((tt / 2) * Math.PI) / 180));
    const added: CustomMaterialPeak = {
      twoTheta: Number(tt.toFixed(3)),
      intensity: Number((Number.isFinite(inten) ? inten : 50).toFixed(1)),
      fwhm: Number((Number.isFinite(fwhm) && fwhm > 0 ? fwhm : 0.25).toFixed(3)),
      h,
      k,
      l,
      dSpacing: Number(dSpacing.toFixed(4)),
    };
    setDraft((prev) => ({
      ...prev,
      peaks: [...prev.peaks, added].sort((a, b) => a.twoTheta - b.twoTheta),
    }));
    setNewPeak({ twoTheta: '', intensity: '70', fwhm: '0.28', h: '1', k: '0', l: '0' });
  };

  const handleParseRawPeaks = () => {
    const parsed: CustomMaterialPeak[] = [];
    rawPeakText.split(/\r?\n/).forEach((line) => {
      const cleaned = line.trim();
      if (!cleaned || cleaned.startsWith('#')) return;
      const parts = cleaned.split(/[\s,;]+/).map(Number);
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        const tt = parts[0];
        const dSpacing = draft.wavelength / (2 * Math.sin(((tt / 2) * Math.PI) / 180));
        parsed.push({
          twoTheta: Number(tt.toFixed(3)),
          intensity: Number(parts[1].toFixed(1)),
          fwhm: Number((Number.isFinite(parts[2]) && parts[2] > 0 ? parts[2] : 0.25).toFixed(3)),
          h: Number.isFinite(parts[3]) ? Math.round(parts[3]) : 1,
          k: Number.isFinite(parts[4]) ? Math.round(parts[4]) : 0,
          l: Number.isFinite(parts[5]) ? Math.round(parts[5]) : 0,
          dSpacing: Number(dSpacing.toFixed(4)),
        });
      }
    });
    if (parsed.length === 0) {
      setError('No valid numeric rows found. Expected: 2θ, Intensity [, FWHM, h, k, l]');
      return;
    }
    setError(null);
    setDraft((prev) => ({ ...prev, peaks: parsed.sort((a, b) => a.twoTheta - b.twoTheta) }));
    setRawPeakMode(false);
  };

  const handleSave = (andApply: boolean) => {
    if (!draft.name.trim()) {
      setError('Material name is required.');
      setTab('identity');
      return;
    }
    if (!draft.formula.trim()) {
      setError('Chemical formula is required.');
      setTab('identity');
      return;
    }
    const finalPeaks =
      draft.peaks.length > 0
        ? draft.peaks
        : generateBraggPeaksFromLattice({
            crystalSystem: draft.crystalSystem,
            centering: draft.centering,
            lattice: draft.lattice,
            wavelength: draft.wavelength,
            crystalliteSizeNm: draft.crystalliteSizeNm,
            microstrain: draft.microstrain,
          });

    saveCustomMaterial(
      {
        ...draft,
        name: draft.name.trim(),
        formula: draft.formula.trim(),
        peaks: finalPeaks,
      },
      andApply ? editorTargetModule : undefined
    );
    closeEditor();
  };

  const handleExportJson = () => {
    const json = JSON.stringify(draft, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'custom_material'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed.name || !parsed.lattice) {
          setError('Invalid custom material JSON file.');
          return;
        }
        setDraft((prev) => ({
          ...prev,
          ...parsed,
          id: editorMode === 'edit' ? prev.id : `custom_${Date.now()}`,
          isCustom: true,
        }));
        setError(null);
      } catch {
        setError('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/80">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {editorMode === 'create' ? 'Create Custom Material' : `Customize Material: ${draft.name}`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
              {draft.formula || '—'} · {draft.crystalSystem} ({draft.centering}) · V = {cellVolume.toFixed(2)} Å³ · ρ = {draft.density.toFixed(2)} g/cm³ · {draft.peaks.length} peaks
            </p>
          </div>
          <button
            type="button"
            onClick={closeEditor}
            aria-label="Close Custom Material Studio"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Starter Templates + Tabs */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'identity' as const, label: 'Identity & Lattice', icon: <Box size={13} /> },
              { id: 'peaks' as const, label: `Bragg Peaks (${draft.peaks.length})`, icon: <Activity size={13} /> },
              { id: 'mechanical' as const, label: 'Mechanical & Quant', icon: <Sliders size={13} /> },
              { id: 'advanced' as const, label: 'Film / Neutron / PDF', icon: <Layers size={13} /> },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  tab === t.id
                    ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">Templates:</span>
            {STARTER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-cyan-500 whitespace-nowrap shrink-0"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-3.5 py-2.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {tab === 'identity' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Name</span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Custom Doped Perovskite"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chemical Formula</span>
                  <input
                    type="text"
                    value={draft.formula}
                    onChange={(e) => setDraft({ ...draft, formula: e.target.value })}
                    placeholder="e.g. La0.8Sr0.2MnO3"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono outline-none focus:border-cyan-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Crystal System</span>
                  <select
                    value={draft.crystalSystem}
                    onChange={(e) => handleSystemChange(e.target.value as CustomCrystalSystem)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-cyan-500"
                  >
                    {CRYSTAL_SYSTEMS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bravais Centering</span>
                  <select
                    value={draft.centering}
                    onChange={(e) => setDraft({ ...draft, centering: e.target.value as CustomCentering })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono outline-none focus:border-cyan-500"
                  >
                    {CENTERINGS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Space Group</span>
                  <input
                    type="text"
                    value={draft.spaceGroup}
                    onChange={(e) => setDraft({ ...draft, spaceGroup: e.target.value })}
                    placeholder="Fm-3m"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono outline-none focus:border-cyan-500"
                  />
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</span>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Unit Cell Parameters (Å & Degrees)
                  </span>
                  <button
                    type="button"
                    onClick={handleRegeneratePeaks}
                    className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-cyan-500/20"
                  >
                    <RefreshCw size={12} /> Auto-Generate Bragg Peaks from Lattice
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {(['a', 'b', 'c'] as const).map((axis) => (
                    <label key={axis} className="space-y-1 block">
                      <span className="text-[11px] font-mono text-slate-500">{axis} (Å)</span>
                      <input
                        type="number"
                        step="0.001"
                        min="1"
                        max="50"
                        value={draft.lattice[axis]}
                        onChange={(e) => updateLattice(axis, Math.max(0.5, parseFloat(e.target.value) || 1))}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums outline-none focus:border-cyan-500"
                      />
                    </label>
                  ))}
                  {(['alpha', 'beta', 'gamma'] as const).map((ang) => (
                    <label key={ang} className="space-y-1 block">
                      <span className="text-[11px] font-mono text-slate-500">
                        {ang === 'alpha' ? 'α' : ang === 'beta' ? 'β' : 'γ'} (°)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="150"
                        value={draft.lattice[ang]}
                        onChange={(e) => updateLattice(ang, Math.max(30, Math.min(150, parseFloat(e.target.value) || 90)))}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums outline-none focus:border-cyan-500"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono text-xs">
                  <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500">Cell Volume V</span>
                    <span className="font-bold tabular-nums">{cellVolume.toFixed(2)} Å³</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500">Calc. Density ρ</span>
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, density: Number(calcDensity.toFixed(3)) }))}
                      className="font-bold tabular-nums text-cyan-600 dark:text-cyan-400 hover:underline"
                      title="Click to copy calculated theoretical density to density field"
                    >
                      {calcDensity.toFixed(3)} g/cm³
                    </button>
                  </div>
                  <label className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Z / SG #</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="64"
                        value={draft.zValue}
                        onChange={(e) => setDraft({ ...draft, zValue: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-12 px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-right tabular-nums"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        min="1"
                        max="230"
                        value={draft.spaceGroupNumber}
                        onChange={(e) =>
                          setDraft({ ...draft, spaceGroupNumber: Math.max(1, Math.min(230, parseInt(e.target.value, 10) || 1)) })
                        }
                        className="w-14 px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-right tabular-nums"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes / Synthesis Description</span>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-cyan-500"
                />
              </label>
            </div>
          )}

          {tab === 'peaks' && (
            <div className="space-y-4">
              {/* Microstructure & Wavelength controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <label className="space-y-1 block">
                  <span className="text-[11px] font-mono text-slate-500">Crystallite Size D (nm)</span>
                  <input
                    type="number"
                    step="1"
                    min="2"
                    max="500"
                    value={draft.crystalliteSizeNm}
                    onChange={(e) => setDraft({ ...draft, crystalliteSizeNm: Math.max(2, parseFloat(e.target.value) || 20) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[11px] font-mono text-slate-500">Microstrain ε</span>
                  <input
                    type="number"
                    step="0.0002"
                    min="0"
                    max="0.05"
                    value={draft.microstrain}
                    onChange={(e) => setDraft({ ...draft, microstrain: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[11px] font-mono text-slate-500">Pseudo-Voigt η</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={draft.etaMix}
                    onChange={(e) => setDraft({ ...draft, etaMix: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.5)) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[11px] font-mono text-slate-500">Wavelength λ (Å)</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.3"
                    max="3.0"
                    value={draft.wavelength}
                    onChange={(e) => setDraft({ ...draft, wavelength: Math.max(0.3, parseFloat(e.target.value) || 1.54056) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {ANODES.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => setDraft({ ...draft, wavelength: a.value })}
                      className={`px-2 py-1 rounded text-[11px] font-mono border ${
                        Math.abs(draft.wavelength - a.value) < 0.001
                          ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 border-transparent'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRegeneratePeaks}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <RefreshCw size={12} /> Recalculate Peaks from Lattice & Size/Strain
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!rawPeakMode) {
                        setRawPeakText(
                          draft.peaks
                            .map((p) => `${p.twoTheta}, ${p.intensity}, ${p.fwhm}, ${p.h}, ${p.k}, ${p.l}`)
                            .join('\n')
                        );
                      }
                      setRawPeakMode((v) => !v);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  >
                    {rawPeakMode ? 'Table View' : 'Bulk Paste'}
                  </button>
                </div>
              </div>

              {/* Live SVG Spectrum Preview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>SYNTHETIC POWDER DIFFRACTION PREVIEW ({draft.formula})</span>
                  <span>10° – 120° 2θ</span>
                </div>
                <svg viewBox="0 0 480 96" className="w-full h-24">
                  <line x1="20" y1="80" x2="465" y2="80" stroke="#334155" strokeWidth="1" />
                  {draft.peaks.map((pk, idx) => {
                    const x = 20 + ((Math.max(10, Math.min(120, pk.twoTheta)) - 10) / 110) * 445;
                    const hPx = Math.max(6, (pk.intensity / 100) * 62);
                    return (
                      <g key={idx}>
                        <line x1={x} y1="80" x2={x} y2={80 - hPx} stroke="#22d3ee" strokeWidth="2.2" />
                        <text x={x} y={Math.max(10, 76 - hPx)} fontSize="7" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">
                          ({pk.h}{pk.k}{pk.l})
                        </text>
                      </g>
                    );
                  })}
                  <text x="20" y="92" fontSize="8" fontFamily="monospace" fill="#64748b">10°</text>
                  <text x="242" y="92" fontSize="8" fontFamily="monospace" fill="#64748b" textAnchor="middle">65°</text>
                  <text x="465" y="92" fontSize="8" fontFamily="monospace" fill="#64748b" textAnchor="end">120° 2θ</text>
                </svg>
              </div>

              {rawPeakMode ? (
                <div className="space-y-2">
                  <p className="text-xs font-mono text-slate-500">
                    Format per line: 2θ, Intensity(%), FWHM(°), h, k, l
                  </p>
                  <textarea
                    value={rawPeakText}
                    onChange={(e) => setRawPeakText(e.target.value)}
                    rows={6}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleParseRawPeaks}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-semibold"
                  >
                    Parse & Update Peak Table
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Add peak row */}
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 items-end">
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-mono text-slate-500">2θ (°)</span>
                      <input type="number" step="0.01" value={newPeak.twoTheta} onChange={(e) => setNewPeak({ ...newPeak, twoTheta: e.target.value })} placeholder="32.45" className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono" />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-mono text-slate-500">I (%)</span>
                      <input type="number" step="1" value={newPeak.intensity} onChange={(e) => setNewPeak({ ...newPeak, intensity: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono" />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-mono text-slate-500">FWHM (°)</span>
                      <input type="number" step="0.01" value={newPeak.fwhm} onChange={(e) => setNewPeak({ ...newPeak, fwhm: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono" />
                    </label>
                    {(['h', 'k', 'l'] as const).map((idxKey) => (
                      <label key={idxKey} className="space-y-1 block">
                        <span className="text-[10px] font-mono text-slate-500">{idxKey}</span>
                        <input type="number" step="1" value={newPeak[idxKey]} onChange={(e) => setNewPeak({ ...newPeak, [idxKey]: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono" />
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddPeak}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>

                  {/* Peak Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">2θ (°)</th>
                          <th className="py-2 px-3">I (%)</th>
                          <th className="py-2 px-3">FWHM (°)</th>
                          <th className="py-2 px-3">(h k l)</th>
                          <th className="py-2 px-3">d (Å)</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                        {draft.peaks.map((pk, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3">{pk.twoTheta.toFixed(3)}</td>
                            <td className="py-1.5 px-3">{pk.intensity.toFixed(1)}</td>
                            <td className="py-1.5 px-3">{pk.fwhm.toFixed(3)}</td>
                            <td className="py-1.5 px-3">({pk.h} {pk.k} {pk.l})</td>
                            <td className="py-1.5 px-3 text-slate-500">
                              {(pk.dSpacing ?? draft.wavelength / (2 * Math.sin(((pk.twoTheta / 2) * Math.PI) / 180))).toFixed(4)}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    peaks: prev.peaks.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="text-rose-500 hover:text-rose-400 p-1"
                                aria-label="Remove peak"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'mechanical' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Density ρ (g/cm³)</span>
                <input type="number" step="0.01" value={draft.density} onChange={(e) => setDraft({ ...draft, density: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Molecular Weight M (g/mol)</span>
                <input type="number" step="0.01" value={draft.molecularWeight} onChange={(e) => setDraft({ ...draft, molecularWeight: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Young&apos;s Modulus E (GPa)</span>
                <input type="number" step="1" value={draft.youngsModulusGPa} onChange={(e) => setDraft({ ...draft, youngsModulusGPa: parseFloat(e.target.value) || 100 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Poisson&apos;s Ratio ν</span>
                <input type="number" step="0.01" min="0.05" max="0.49" value={draft.poissonRatio} onChange={(e) => setDraft({ ...draft, poissonRatio: parseFloat(e.target.value) || 0.28 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Residual Stress σ (MPa)</span>
                <input type="number" step="10" value={draft.residualStressMPa} onChange={(e) => setDraft({ ...draft, residualStressMPa: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">RIR (I / I_corundum)</span>
                <input type="number" step="0.05" min="0.1" value={draft.rir} onChange={(e) => setDraft({ ...draft, rir: parseFloat(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mass Attenuation μ/ρ (cm²/g)</span>
                <input type="number" step="1" min="1" value={draft.massAttenuation} onChange={(e) => setDraft({ ...draft, massAttenuation: parseFloat(e.target.value) || 50 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">March-Dollase Texture r</span>
                <input type="number" step="0.05" min="0.2" max="2.5" value={draft.preferredR} onChange={(e) => setDraft({ ...draft, preferredR: parseFloat(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preferred Orientation Axis</span>
                <input type="text" value={draft.preferredAxis} onChange={(e) => setDraft({ ...draft, preferredAxis: e.target.value })} placeholder="0, 0, 1" className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono" />
              </label>
            </div>
          )}

          {tab === 'advanced' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Thin-Film Thickness (nm, XRR)</span>
                <input type="number" step="1" min="1" value={draft.filmThicknessNm} onChange={(e) => setDraft({ ...draft, filmThicknessNm: parseFloat(e.target.value) || 30 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Interface Roughness σ (nm, XRR)</span>
                <input type="number" step="0.1" min="0" value={draft.roughnessNm} onChange={(e) => setDraft({ ...draft, roughnessNm: parseFloat(e.target.value) || 0.5 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">X-Ray SLD (×10⁻⁶ Å⁻²)</span>
                <input type="number" step="0.5" min="1" value={draft.sldXray} onChange={(e) => setDraft({ ...draft, sldXray: parseFloat(e.target.value) || 30 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Neutron Scattering Length b_c (fm)</span>
                <input type="number" step="0.1" value={draft.scatteringLengthFm} onChange={(e) => setDraft({ ...draft, scatteringLengthFm: parseFloat(e.target.value) || 5.0 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Magnetic Moment (μ_B)</span>
                <input type="number" step="0.1" min="0" value={draft.magneticMomentMuB} onChange={(e) => setDraft({ ...draft, magneticMomentMuB: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Néel / Curie Temp T_c (K)</span>
                <input type="number" step="5" min="1" value={draft.neelTempK} onChange={(e) => setDraft({ ...draft, neelTempK: parseFloat(e.target.value) || 120 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nearest-Neighbor Bond r₁ (Å, PDF)</span>
                <input type="number" step="0.02" min="1" max="5" value={draft.nearestNeighborA} onChange={(e) => setDraft({ ...draft, nearestNeighborA: parseFloat(e.target.value) || 2.1 })} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums" />
              </label>
              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Magnetic Propagation Vector k = (k_x, k_y, k_z)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <input
                      key={axis}
                      type="number"
                      step="0.05"
                      value={draft.propagationVector[axis]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          propagationVector: {
                            ...draft.propagationVector,
                            [axis]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Upload size={13} /> Import JSON
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download size={13} /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(draft, null, 2));
                setCopiedJson(true);
                setTimeout(() => setCopiedJson(false), 1500);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {copiedJson ? <Check size={13} /> : <Copy size={13} />}
              {copiedJson ? 'Copied' : 'Copy JSON'}
            </button>
            {editorMode === 'edit' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    duplicateCustomMaterial(draft.id);
                    closeEditor();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium whitespace-nowrap"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteCustomMaterial(draft.id);
                    closeEditor();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={closeEditor}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Save size={13} /> Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check size={13} /> Save & Apply to Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
