import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid
} from 'recharts';
import {
  Database,
  Sliders,
  FolderOpen,
  Save,
  Download,
  Upload,
  Trash2,
  Check,
  Copy,
  Search,
  Plus,
  Microscope,
  Layers,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

interface SavedLabSession {
  id: string;
  sampleName: string;
  formula: string;
  wavelength: number;
  instrumentName: string;
  peakData: string;
  notes: string;
  createdAt: string;
  summaryMetrics?: {
    peakCount: number;
    meanSizeNm?: number;
    strainPercent?: number;
  };
}

interface DiffractometerProfile {
  id: string;
  name: string;
  manufacturer: string;
  geometry: string;
  anode: string;
  wavelength: number;
  goniometerRadiusMm: number;
  zeroShiftDeg: number;
  sampleDisplacementMm: number;
  cagliotiU: number;
  cagliotiV: number;
  cagliotiW: number;
  notes: string;
}

interface ReferenceCatalogPhase {
  id: string;
  catalog: 'NIST SRM' | 'ICDD' | 'COD' | 'RRUFF' | 'ICSD';
  name: string;
  formula: string;
  crystalSystem: string;
  spaceGroup: string;
  densityGcm3: number;
  cellSummary: string;
  description: string;
  peaks: { twoTheta: number; intensity: number; fwhm: number; hkl: string }[];
}

const DEFAULT_DIFFRACTOMETER_PROFILES: DiffractometerProfile[] = [
  {
    id: 'bruker_d8_cu',
    name: 'Bruker D8 Advance (LynxEye XE-T)',
    manufacturer: 'Bruker AXS',
    geometry: 'Bragg-Brentano θ/θ',
    anode: 'Cu Kα₁',
    wavelength: 1.5406,
    goniometerRadiusMm: 280.0,
    zeroShiftDeg: 0.0,
    sampleDisplacementMm: 0.0,
    cagliotiU: 0.0042,
    cagliotiV: -0.0021,
    cagliotiW: 0.0038,
    notes: 'Standard high-resolution powder configuration with motorized divergence slit and Ni Kβ filter.'
  },
  {
    id: 'panalytical_empyrean',
    name: 'Malvern Panalytical Empyrean (PIXcel3D)',
    manufacturer: 'Malvern Panalytical',
    geometry: 'Bragg-Brentano HD',
    anode: 'Cu Kα₁',
    wavelength: 1.5406,
    goniometerRadiusMm: 240.0,
    zeroShiftDeg: 0.0,
    sampleDisplacementMm: 0.0,
    cagliotiU: 0.0036,
    cagliotiV: -0.0018,
    cagliotiW: 0.0032,
    notes: 'Incidence-beam Johansson monochromator eliminating Cu Kα₂ doublet.'
  },
  {
    id: 'rigaku_smartlab',
    name: 'Rigaku SmartLab (HyPix-3000)',
    manufacturer: 'Rigaku',
    geometry: 'Parallel Beam / CBO',
    anode: 'Cu Kα₁',
    wavelength: 1.5406,
    goniometerRadiusMm: 300.0,
    zeroShiftDeg: 0.0,
    sampleDisplacementMm: 0.0,
    cagliotiU: 0.0055,
    cagliotiV: -0.0015,
    cagliotiW: 0.0048,
    notes: 'Cross-Beam Optics (CBO) parallel-beam geometry immune to specimen surface displacement.'
  },
  {
    id: 'cobalt_mineralogy',
    name: 'Ferrous & Mineralogy Co-Kα₁ System',
    manufacturer: 'Laboratory Standard',
    geometry: 'Bragg-Brentano θ/2θ',
    anode: 'Co Kα₁',
    wavelength: 1.78897,
    goniometerRadiusMm: 240.0,
    zeroShiftDeg: 0.0,
    sampleDisplacementMm: 0.0,
    cagliotiU: 0.0050,
    cagliotiV: -0.0022,
    cagliotiW: 0.0045,
    notes: 'Eliminates Fe K-edge X-ray fluorescence background in steels, iron oxides, and geological ores.'
  },
  {
    id: 'synchrotron_bm11',
    name: 'Synchrotron High-Resolution Powder (11-BM)',
    manufacturer: 'Synchrotron Beamline',
    geometry: 'Multi-Analyzer Si(111)',
    anode: 'Synchrotron 30 keV',
    wavelength: 0.4133,
    goniometerRadiusMm: 500.0,
    zeroShiftDeg: 0.0,
    sampleDisplacementMm: 0.0,
    cagliotiU: 0.0004,
    cagliotiV: -0.0002,
    cagliotiW: 0.0003,
    notes: 'Ultra-narrow instrumental resolution floor for subtle symmetry lowering and line-profile analysis.'
  }
];

const REFERENCE_PHASES: ReferenceCatalogPhase[] = [
  {
    id: 'NIST-SRM-640f',
    catalog: 'NIST SRM',
    name: 'Silicon Powder Line Position Standard',
    formula: 'Si',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (227)',
    densityGcm3: 2.329,
    cellSummary: 'a = 5.431179(8) Å',
    description: 'Primary NIST SRM 640f line-position and instrumental profile standard.',
    peaks: [
      { twoTheta: 28.443, intensity: 100, fwhm: 0.078, hkl: '1 1 1' },
      { twoTheta: 47.303, intensity: 55, fwhm: 0.086, hkl: '2 2 0' },
      { twoTheta: 56.123, intensity: 30, fwhm: 0.092, hkl: '3 1 1' },
      { twoTheta: 69.131, intensity: 6, fwhm: 0.102, hkl: '4 0 0' },
      { twoTheta: 76.377, intensity: 11, fwhm: 0.109, hkl: '3 3 1' },
      { twoTheta: 88.032, intensity: 12, fwhm: 0.121, hkl: '4 2 2' }
    ]
  },
  {
    id: 'NIST-SRM-660c',
    catalog: 'NIST SRM',
    name: 'Lanthanum Hexaboride Line Profile Standard',
    formula: 'LaB6',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m (221)',
    densityGcm3: 4.711,
    cellSummary: 'a = 4.156826(8) Å',
    description: 'Certified strain-free, macro-crystalline standard for Caglioti (U,V,W) instrumental resolution calibration.',
    peaks: [
      { twoTheta: 21.358, intensity: 58, fwhm: 0.052, hkl: '1 0 0' },
      { twoTheta: 30.385, intensity: 100, fwhm: 0.055, hkl: '1 1 0' },
      { twoTheta: 37.442, intensity: 46, fwhm: 0.058, hkl: '1 1 1' },
      { twoTheta: 43.507, intensity: 28, fwhm: 0.062, hkl: '2 0 0' },
      { twoTheta: 48.958, intensity: 72, fwhm: 0.066, hkl: '2 1 0' },
      { twoTheta: 53.989, intensity: 38, fwhm: 0.070, hkl: '2 1 1' }
    ]
  },
  {
    id: 'NIST-SRM-676a',
    catalog: 'NIST SRM',
    name: 'Alpha-Alumina Quantitative RIR Standard',
    formula: 'Al2O3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c (167)',
    densityGcm3: 3.987,
    cellSummary: 'a = 4.7591 Å, c = 12.9918 Å',
    description: 'International reference standard (I/Ic = 1.00) for Reference Intensity Ratio (RIR) quantitative phase analysis.',
    peaks: [
      { twoTheta: 25.576, intensity: 68, fwhm: 0.145, hkl: '0 1 2' },
      { twoTheta: 35.151, intensity: 92, fwhm: 0.158, hkl: '1 0 4' },
      { twoTheta: 37.776, intensity: 42, fwhm: 0.162, hkl: '1 1 0' },
      { twoTheta: 43.354, intensity: 100, fwhm: 0.172, hkl: '1 1 3' },
      { twoTheta: 52.551, intensity: 46, fwhm: 0.188, hkl: '0 2 4' },
      { twoTheta: 57.502, intensity: 86, fwhm: 0.198, hkl: '1 1 6' }
    ]
  },
  {
    id: 'ICDD-00-021-1272',
    catalog: 'ICDD',
    name: 'Anatase Titanium Dioxide (Nanocrystalline)',
    formula: 'TiO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I41/amd (141)',
    densityGcm3: 3.893,
    cellSummary: 'a = 3.7852 Å, c = 9.5139 Å',
    description: 'Photocatalytic tetragonal TiO2 polymorph exhibiting size and microstrain line broadening.',
    peaks: [
      { twoTheta: 25.281, intensity: 100, fwhm: 0.420, hkl: '1 0 1' },
      { twoTheta: 37.800, intensity: 20, fwhm: 0.465, hkl: '0 0 4' },
      { twoTheta: 48.049, intensity: 35, fwhm: 0.512, hkl: '2 0 0' },
      { twoTheta: 53.890, intensity: 20, fwhm: 0.545, hkl: '1 0 5' },
      { twoTheta: 55.060, intensity: 22, fwhm: 0.555, hkl: '2 1 1' },
      { twoTheta: 62.688, intensity: 14, fwhm: 0.605, hkl: '2 0 4' }
    ]
  },
  {
    id: 'COD-9008234',
    catalog: 'COD',
    name: 'Magnetite Inverse Spinel',
    formula: 'Fe3O4',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (227)',
    densityGcm3: 5.175,
    cellSummary: 'a = 8.3967 Å',
    description: 'Ferrimagnetic inverse spinel iron oxide benchmark for nanocrystalline line-broadening studies.',
    peaks: [
      { twoTheta: 30.095, intensity: 30, fwhm: 0.340, hkl: '2 2 0' },
      { twoTheta: 35.422, intensity: 100, fwhm: 0.365, hkl: '3 1 1' },
      { twoTheta: 43.052, intensity: 22, fwhm: 0.402, hkl: '4 0 0' },
      { twoTheta: 53.391, intensity: 10, fwhm: 0.455, hkl: '4 2 2' },
      { twoTheta: 56.942, intensity: 32, fwhm: 0.478, hkl: '5 1 1' },
      { twoTheta: 62.515, intensity: 40, fwhm: 0.512, hkl: '4 4 0' }
    ]
  },
  {
    id: 'RRUFF-R040085',
    catalog: 'RRUFF',
    name: 'Low-Quartz Alpha-SiO2',
    formula: 'SiO2',
    crystalSystem: 'Trigonal',
    spaceGroup: 'P3221 (154)',
    densityGcm3: 2.648,
    cellSummary: 'a = 4.9134 Å, c = 5.4052 Å',
    description: 'Primary geological and mineralogical diffraction standard.',
    peaks: [
      { twoTheta: 20.860, intensity: 22, fwhm: 0.120, hkl: '1 0 0' },
      { twoTheta: 26.640, intensity: 100, fwhm: 0.125, hkl: '1 0 1' },
      { twoTheta: 36.544, intensity: 8, fwhm: 0.136, hkl: '1 1 0' },
      { twoTheta: 39.465, intensity: 7, fwhm: 0.140, hkl: '1 0 2' },
      { twoTheta: 50.139, intensity: 14, fwhm: 0.155, hkl: '1 1 2' },
      { twoTheta: 59.960, intensity: 9, fwhm: 0.172, hkl: '2 1 1' }
    ]
  },
  {
    id: 'ICSD-88201',
    catalog: 'ICSD',
    name: 'Tetragonal Barium Titanate Perovskite',
    formula: 'BaTiO3',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4mm (99)',
    densityGcm3: 6.017,
    cellSummary: 'a = 3.9945 Å, c = 4.0335 Å',
    description: 'Ferroelectric perovskite standard demonstrating tetragonal (002)/(200) doublet splitting around 45° 2θ.',
    peaks: [
      { twoTheta: 22.178, intensity: 18, fwhm: 0.210, hkl: '1 0 0' },
      { twoTheta: 31.545, intensity: 100, fwhm: 0.235, hkl: '1 1 0' },
      { twoTheta: 38.885, intensity: 26, fwhm: 0.255, hkl: '1 1 1' },
      { twoTheta: 44.925, intensity: 16, fwhm: 0.275, hkl: '0 0 2' },
      { twoTheta: 45.385, intensity: 34, fwhm: 0.278, hkl: '2 0 0' },
      { twoTheta: 56.180, intensity: 30, fwhm: 0.315, hkl: '2 1 1' }
    ]
  }
];

const SESSIONS_STORAGE_KEY = 'xrd_saved_lab_sessions_v1';
const PROFILES_STORAGE_KEY = 'xrd_diffractometer_profiles_v1';

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'instruments' | 'databases'>('sessions');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // 1. Saved Lab Sessions state
  const [sessions, setSessions] = useState<SavedLabSession[]>(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'seed_ceo2_srm',
        sampleName: 'Nanocrystalline CeO₂ Fluorite (Annealed 500°C)',
        formula: 'CeO2',
        wavelength: 1.5406,
        instrumentName: 'Bruker D8 Advance (Cu Kα₁)',
        peakData: '28.55, 0.340, 100, 1, 1, 1\n33.08, 0.365, 30, 2, 0, 0\n47.48, 0.425, 52, 2, 2, 0\n56.33, 0.468, 42, 3, 1, 1\n59.08, 0.485, 10, 2, 2, 2',
        notes: 'Isotropic fluorite nanocubes calibrated against LaB6 SRM 660c.',
        createdAt: '2026-11-01 09:30',
        summaryMetrics: { peakCount: 5, meanSizeNm: 38.5, strainPercent: 0.14 }
      },
      {
        id: 'seed_si_640f',
        sampleName: 'Silicon NIST SRM 640f Verification Run',
        formula: 'Si',
        wavelength: 1.5406,
        instrumentName: 'Malvern Panalytical Empyrean',
        peakData: '28.443, 0.078, 100, 1, 1, 1\n47.303, 0.086, 55, 2, 2, 0\n56.123, 0.092, 30, 3, 1, 1\n69.131, 0.102, 6, 4, 0, 0\n76.377, 0.109, 11, 3, 3, 1',
        notes: 'Zero-shift and goniometer alignment verification dataset.',
        createdAt: '2026-11-04 14:15',
        summaryMetrics: { peakCount: 5, meanSizeNm: 142.1, strainPercent: 0.015 }
      }
    ];
  });

  // New Session Form State
  const [newSampleName, setNewSampleName] = useState<string>('');
  const [newFormula, setNewFormula] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newPeakData, setNewPeakData] = useState<string>(
    '28.44, 0.240, 100, 1, 1, 1\n47.30, 0.290, 55, 2, 2, 0\n56.12, 0.335, 35, 3, 1, 1'
  );

  // 2. Diffractometer Profiles state
  const [instruments, setInstruments] = useState<DiffractometerProfile[]>(() => {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DIFFRACTOMETER_PROFILES;
  });
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(DEFAULT_DIFFRACTOMETER_PROFILES[0].id);

  // 3. Reference Catalog state
  const [selectedCatalog, setSelectedCatalog] = useState<'ALL' | 'NIST SRM' | 'ICDD' | 'COD' | 'RRUFF' | 'ICSD'>('ALL');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<ReferenceCatalogPhase>(REFERENCE_PHASES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(instruments));
    } catch {}
  }, [instruments]);

  // Pull active workspace peaks from Scherrer or Williamson-Hall if available
  const handlePullCurrentWorkspace = () => {
    try {
      const whRaw = localStorage.getItem('xrd_wh_transfer_payload') || localStorage.getItem('xrd_scherrer_current');
      if (!whRaw) {
        notify('No active Scherrer or Williamson-Hall session buffer found.');
        return;
      }
      const parsed = JSON.parse(whRaw);
      if (typeof parsed.inputData === 'string' && parsed.inputData.trim()) {
        setNewPeakData(parsed.inputData.trim());
        setNewSampleName(parsed.selectedMaterial || 'Active XRD Session');
        notify('Pulled active peak buffer from current workspace.');
      } else if (Array.isArray(parsed.results) && parsed.results.length > 0) {
        const lines = parsed.results.map(
          (r: any) =>
            `${Number(r.twoTheta).toFixed(3)}, ${Number(r.fwhmObs || 0.25).toFixed(4)}, ${r.intensity || 100}${
              Array.isArray(r.hkl) ? `, ${r.hkl.join(', ')}` : ''
            }`
        );
        setNewPeakData(lines.join('\n'));
        setNewSampleName(parsed.selectedMaterial || 'Active XRD Session');
        notify(`Pulled ${lines.length} reflections from active workspace.`);
      }
    } catch {
      notify('Could not read active workspace buffer.');
    }
  };

  const handleSaveNewSession = () => {
    const lines = newPeakData
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('!'));
    if (lines.length === 0) {
      notify('Please provide at least one Bragg reflection line.');
      return;
    }
    const activeInst = instruments.find(i => i.id === selectedInstrumentId) || instruments[0];
    const item: SavedLabSession = {
      id: `sess_${Date.now()}`,
      sampleName: newSampleName.trim() || `Diffraction Run ${sessions.length + 1}`,
      formula: newFormula.trim() || 'Unknown Phase',
      wavelength: activeInst.wavelength,
      instrumentName: activeInst.name,
      peakData: lines.join('\n'),
      notes: newNotes.trim() || 'Saved laboratory diffraction dataset.',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      summaryMetrics: {
        peakCount: lines.length
      }
    };
    setSessions([item, ...sessions]);
    setNewSampleName('');
    setNewFormula('');
    setNewNotes('');
    notify(`Saved session "${item.sampleName}" (${lines.length} reflections).`);
  };

  const handleLoadSessionIntoWorkspace = (session: SavedLabSession) => {
    try {
      const payload = {
        inputData: session.peakData,
        wavelength: session.wavelength,
        selectedMaterial: session.sampleName,
        timestamp: Date.now()
      };
      localStorage.setItem('xrd_wh_transfer_payload', JSON.stringify(payload));
      localStorage.setItem('xrd_scherrer_current', JSON.stringify(payload));
      localStorage.setItem('xrd_default_wavelength', String(session.wavelength));
      window.dispatchEvent(new Event('storage'));
      notify(`Loaded "${session.sampleName}" into active Scherrer / Williamson-Hall / Integral Breadth buffers.`);
    } catch {
      notify('Failed to write session to workspace buffer.');
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    notify('Removed saved session.');
  };

  const handleExportSessionsJson = () => {
    const blob = new Blob([JSON.stringify({ sessions, instruments }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xrd_workspace_archive_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSessionsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.sessions)) {
          setSessions(parsed.sessions);
        }
        if (Array.isArray(parsed.instruments)) {
          setInstruments(parsed.instruments);
        }
        notify('Imported XRD workspace archive.');
      } catch {
        notify('Invalid JSON archive file.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyInstrumentProfile = (inst: DiffractometerProfile) => {
    try {
      localStorage.setItem('xrd_default_wavelength', String(inst.wavelength));
      localStorage.setItem('xrd_goniometer_radius', String(inst.goniometerRadiusMm));
      localStorage.setItem('xrd_zero_shift', String(inst.zeroShiftDeg));
      localStorage.setItem('xrd_sample_displacement', String(inst.sampleDisplacementMm));
      localStorage.setItem(
        'xrd_active_caglioti',
        JSON.stringify({ U: inst.cagliotiU, V: inst.cagliotiV, W: inst.cagliotiW, name: inst.name })
      );
      window.dispatchEvent(new Event('storage'));
      notify(
        `Applied "${inst.name}" (λ = ${inst.wavelength} Å, R = ${inst.goniometerRadiusMm} mm, U=${inst.cagliotiU}, V=${inst.cagliotiV}, W=${inst.cagliotiW}).`
      );
    } catch {
      notify('Failed to apply instrument calibration.');
    }
  };

  const handleLoadReferencePhaseToWorkspace = (phase: ReferenceCatalogPhase) => {
    const lines = phase.peaks
      .map(p => `${p.twoTheta.toFixed(3)}, ${p.fwhm.toFixed(4)}, ${p.intensity}, ${p.hkl.split(/\s+/).join(', ')}`)
      .join('\n');
    const payload = {
      inputData: lines,
      wavelength: 1.5406,
      selectedMaterial: `${phase.name} (${phase.id})`,
      materialDensity: phase.densityGcm3,
      timestamp: Date.now()
    };
    localStorage.setItem('xrd_wh_transfer_payload', JSON.stringify(payload));
    localStorage.setItem('xrd_scherrer_current', JSON.stringify(payload));
    window.dispatchEvent(new Event('storage'));
    notify(`Loaded reference standard "${phase.name} (${phase.id})" into active XRD session buffers.`);
  };

  const filteredPhases = useMemo(() => {
    return REFERENCE_PHASES.filter(p => {
      if (selectedCatalog !== 'ALL' && p.catalog !== selectedCatalog) return false;
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.formula.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.spaceGroup.toLowerCase().includes(q)
      );
    });
  }, [selectedCatalog, catalogSearch]);

  const simulatedSpectrum = useMemo(() => {
    const pts: { twoTheta: number; intensity: number }[] = [];
    for (let tt = 15; tt <= 85; tt += 0.25) {
      let sum = 1.5;
      for (const pk of selectedPhase.peaks) {
        const halfW = Math.max(0.08, pk.fwhm) / 2;
        const dx = (tt - pk.twoTheta) / halfW;
        // Pseudo-Voigt 50% Lorentzian + 50% Gaussian
        const lor = 1 / (1 + dx * dx);
        const gau = Math.exp(-Math.LN2 * dx * dx);
        sum += pk.intensity * (0.5 * lor + 0.5 * gau);
      }
      pts.push({ twoTheta: Number(tt.toFixed(2)), intensity: Number(sum.toFixed(1)) });
    }
    return pts;
  }, [selectedPhase]);

  const activeInstrument = instruments.find(i => i.id === selectedInstrumentId) || instruments[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Top Console Header */}
      <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                XRD Laboratory Workspace &amp; Calibration Archive
              </h1>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-300 uppercase">
                Local Session Persistence
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Manage saved diffraction datasets, diffractometer Caglioti (U,V,W) optics profiles, and certified NIST/ICDD reference standards.
            </p>
          </div>
        </div>

        {/* 3-Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#070D18] p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'sessions', label: `Saved Sessions (${sessions.length})`, icon: FolderOpen },
            { id: 'instruments', label: `Diffractometer Optics (${instruments.length})`, icon: Sliders },
            { id: 'databases', label: `Reference Standards (${REFERENCE_PHASES.length})`, icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>● {statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-white ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* =======================================================================
          TAB 1: SAVED DIFFRACTION SESSIONS & WORKSPACE SNAPSHOTS
         ======================================================================= */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Save Current Session Snapshot */}
          <div className="lg:col-span-5 bg-[#050A14] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Save className="w-4 h-4 text-cyan-400" />
                Record New Diffraction Session
              </span>
              <button
                type="button"
                onClick={handlePullCurrentWorkspace}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-300 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Pull Active Peaks
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  Sample / Run Identifier
                </label>
                <input
                  type="text"
                  value={newSampleName}
                  onChange={e => setNewSampleName(e.target.value)}
                  placeholder="e.g. TiO2 Anatase 450°C"
                  className="w-full px-3 py-2 bg-[#0A101C] text-white border border-slate-700/80 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  Chemical Formula
                </label>
                <input
                  type="text"
                  value={newFormula}
                  onChange={e => setNewFormula(e.target.value)}
                  placeholder="e.g. TiO2"
                  className="w-full px-3 py-2 bg-[#0A101C] text-white border border-slate-700/80 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-300">
                  Bragg Peak Table (2θ°, FWHM°, I/I₀, h, k, l)
                </label>
                <span className="text-[9px] font-mono text-slate-500">CSV / Space-delimited</span>
              </div>
              <textarea
                rows={5}
                value={newPeakData}
                onChange={e => setNewPeakData(e.target.value)}
                className="w-full p-3 bg-[#0A101C] text-cyan-200 border border-slate-700/80 rounded-xl text-xs font-mono tabular-nums outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1">
                Experimental Preparation &amp; Slit Notes
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="e.g. 0.02° step size, zero-background Si holder"
                className="w-full px-3 py-2 bg-[#0A101C] text-white border border-slate-700/80 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/60"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNewSession}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Save Session Snapshot
              </button>
            </div>
          </div>

          {/* Right Column: Saved Sessions List & Archive Export/Import */}
          <div className="lg:col-span-7 bg-[#050A14] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Saved Laboratory Sessions ({sessions.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSessionsJson}
                  className="px-3 py-1.5 rounded-xl bg-[#0A101C] hover:bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Archive (.json)
                </button>
                <label className="px-3 py-1.5 rounded-xl bg-[#0A101C] hover:bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import (.json)
                  <input type="file" accept=".json" onChange={handleImportSessionsJson} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {sessions.map(sess => (
                <div
                  key={sess.id}
                  className="p-4 rounded-2xl bg-[#070D18] border border-slate-800/90 hover:border-slate-700 transition-colors space-y-3 font-mono tabular-nums"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-sans font-bold text-white">{sess.sampleName}</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] text-cyan-300 font-bold">
                          {sess.formula}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sess.instrumentName} · λ = {sess.wavelength} Å · Saved {sess.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadSessionIntoWorkspace(sess)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[9.5px] font-bold text-emerald-300 uppercase cursor-pointer"
                      >
                        Load into Active Engine
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 cursor-pointer"
                        title="Delete saved session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-sans text-slate-400">{sess.notes}</p>

                  <div className="p-2.5 rounded-xl bg-[#0A101C] border border-slate-800 text-[10px] text-slate-300 overflow-x-auto whitespace-pre">
                    {sess.peakData}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: DIFFRACTOMETER OPTICS & CAGLIOTI RESOLUTION PROFILES
         ======================================================================= */}
      {activeTab === 'instruments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono tabular-nums">
          {/* Instrument Selector List */}
          <div className="lg:col-span-5 bg-[#050A14] border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="text-xs font-sans font-black text-white uppercase tracking-wider border-b border-white/5 pb-3">
              Calibrated Diffractometer Geometries
            </div>
            <div className="space-y-2">
              {instruments.map(inst => {
                const isSelected = inst.id === activeInstrument.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => setSelectedInstrumentId(inst.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                        : 'bg-[#070D18] border-slate-800/90 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-sans font-bold text-white truncate">{inst.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] text-cyan-300 shrink-0">
                        {inst.anode} ({inst.wavelength} Å)
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{inst.geometry}</span>
                      <span>R = {inst.goniometerRadiusMm} mm</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Instrument Parameter Inspector & Apply */}
          <div className="lg:col-span-7 bg-[#050A14] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider">
                  {activeInstrument.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeInstrument.notes}</p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyInstrumentProfile(activeInstrument)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-black text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Apply to Active Workstation
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#070D18] border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Wavelength (λ)</span>
                <span className="text-sm font-bold text-cyan-300">{activeInstrument.wavelength} Å</span>
                <span className="text-[9px] text-slate-500 block">{activeInstrument.anode}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070D18] border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Goniometer R</span>
                <span className="text-sm font-bold text-white">{activeInstrument.goniometerRadiusMm} mm</span>
                <span className="text-[9px] text-slate-500 block">{activeInstrument.geometry}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070D18] border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Caglioti (U, V)</span>
                <span className="text-sm font-bold text-amber-300">
                  {activeInstrument.cagliotiU}, {activeInstrument.cagliotiV}
                </span>
                <span className="text-[9px] text-slate-500 block">tan²θ, tanθ terms</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070D18] border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Caglioti W (Floor)</span>
                <span className="text-sm font-bold text-emerald-300">{activeInstrument.cagliotiW} deg²</span>
                <span className="text-[9px] text-slate-500 block">
                  FWHM₀ ≈ {Math.sqrt(Math.max(0, activeInstrument.cagliotiW)).toFixed(3)}°
                </span>
              </div>
            </div>

            {/* Caglioti Resolution Preview Table across 2θ */}
            <div className="p-4 rounded-2xl bg-[#070D18] border border-slate-800 space-y-2">
              <div className="text-[10px] font-sans font-bold text-slate-300 uppercase tracking-wider">
                Tabulated Instrumental Resolution Function FWHM_inst(2θ) = √(U·tan²θ + V·tanθ + W)
              </div>
              <div className="grid grid-cols-6 gap-2 text-center pt-1">
                {[20, 35, 50, 65, 80, 100].map(tt => {
                  const t = Math.tan((tt / 2) * (Math.PI / 180));
                  const fwhm = Math.sqrt(
                    Math.max(0, activeInstrument.cagliotiU * t * t + activeInstrument.cagliotiV * t + activeInstrument.cagliotiW)
                  );
                  return (
                    <div key={tt} className="p-2 rounded-lg bg-[#0A101C] border border-white/5">
                      <span className="text-[9px] text-slate-500 block">2θ = {tt}°</span>
                      <span className="text-xs font-bold text-amber-300">{fwhm.toFixed(4)}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: CERTIFIED REFERENCE STANDARDS & CIF CATALOG
         ======================================================================= */}
      {activeTab === 'databases' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Filter & Phase Selector */}
          <div className="lg:col-span-5 bg-[#050A14] border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'NIST SRM', 'ICDD', 'COD', 'RRUFF', 'ICSD'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCatalog(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold uppercase border cursor-pointer ${
                    selectedCatalog === cat
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-[#070D18] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Search SRM 640f, LaB6, Al2O3, TiO2, SiO2..."
                className="w-full pl-9 pr-3 py-2 bg-[#0A101C] text-white border border-slate-700/80 rounded-xl text-xs font-mono outline-none focus:border-cyan-500/60"
              />
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {filteredPhases.map(phase => {
                const isSelected = phase.id === selectedPhase.id;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setSelectedPhase(phase)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer font-mono tabular-nums ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                        : 'bg-[#070D18] border-slate-800/90 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-sans font-bold text-white truncate">{phase.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] text-cyan-300 shrink-0">
                        {phase.id}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>
                        {phase.formula} · {phase.crystalSystem} ({phase.spaceGroup})
                      </span>
                      <span>ρ = {phase.densityGcm3} g/cm³</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Phase Diffractogram & Indexed Reflection Table */}
          <div className="lg:col-span-7 bg-[#050A14] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 font-mono tabular-nums">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider">
                    {selectedPhase.name} ({selectedPhase.formula})
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] text-cyan-300 font-bold">
                    {selectedPhase.id}
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-0.5">{selectedPhase.description}</p>
                <div className="text-[10px] text-slate-400 mt-1">
                  {selectedPhase.crystalSystem} · Space Group {selectedPhase.spaceGroup} · {selectedPhase.cellSummary} · ρ ={' '}
                  {selectedPhase.densityGcm3} g/cm³
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadReferencePhaseToWorkspace(selectedPhase)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase cursor-pointer flex items-center gap-1.5"
                >
                  <Microscope className="w-3.5 h-3.5" /> Load into Active XRD Engine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const txt = selectedPhase.peaks
                      .map(p => `${p.twoTheta.toFixed(3)}, ${p.fwhm.toFixed(4)}, ${p.intensity}, ${p.hkl}`)
                      .join('\n');
                    navigator.clipboard.writeText(txt);
                    setCopiedId(selectedPhase.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0A101C] hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 uppercase cursor-pointer flex items-center gap-1"
                >
                  {copiedId === selectedPhase.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === selectedPhase.id ? 'Copied' : 'Copy Peaks'}
                </button>
              </div>
            </div>

            {/* Simulated Cu-Kα1 Powder Diffractogram */}
            <div className="h-48 w-full bg-[#070D18] rounded-2xl p-3 border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulatedSpectrum} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="twoTheta"
                    type="number"
                    domain={[15, 85]}
                    tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={v => `${v}°`}
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} width={35} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: '#050A14',
                      borderColor: 'rgba(34,211,238,0.35)',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }}
                    labelFormatter={v => `2θ = ${v}°`}
                  />
                  <Area
                    type="monotone"
                    dataKey="intensity"
                    stroke="#22d3ee"
                    strokeWidth={1.8}
                    fill="rgba(34, 211, 238, 0.16)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Indexed Bragg Reflection Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#070D18]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[9px] text-slate-400 font-sans uppercase tracking-wider font-black">
                    <th className="px-3 py-2.5">2θ (Cu Kα₁)</th>
                    <th className="px-3 py-2.5">d-Spacing (Å)</th>
                    <th className="px-3 py-2.5">FWHM (°)</th>
                    <th className="px-3 py-2.5">Rel. Intensity (I/I₀)</th>
                    <th className="px-3 py-2.5">Miller Index (h k l)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {selectedPhase.peaks.map((pk, idx) => {
                    const dVal = 1.5406 / (2 * Math.sin((pk.twoTheta / 2) * (Math.PI / 180)));
                    return (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="px-3 py-2 font-bold text-cyan-300">{pk.twoTheta.toFixed(3)}°</td>
                        <td className="px-3 py-2 text-slate-300">{dVal.toFixed(4)} Å</td>
                        <td className="px-3 py-2 text-amber-300">{pk.fwhm.toFixed(3)}°</td>
                        <td className="px-3 py-2 text-emerald-300">{pk.intensity}%</td>
                        <td className="px-3 py-2 font-bold text-white">({pk.hkl})</td>
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
  );
};

export default ProfilePage;
