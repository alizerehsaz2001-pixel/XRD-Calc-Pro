import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Zap, 
  ChevronRight, 
  Database, 
  Info, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  X, 
  SlidersHorizontal,
  Layers,
  Sparkles,
  ClipboardCheck,
  Eye
} from 'lucide-react';

interface MaterialPreset {
  name: string;
  formula: string;
  wavelength: number;
  peaks: number[];
  hkls: string[];
  description: string;
  category: 'Standard' | 'Metal' | 'Ceramic' | 'Perovskite' | 'Biomaterial' | 'Nuclear' | 'Thermoelectric' | 'Metallurgy' | 'Polymer' | 'Custom';
  crystalSystem?: string;
  spaceGroup?: string;
  latticeParams?: string;
}

const PRESETS: MaterialPreset[] = [
  {
    name: 'Silicon Standard',
    formula: 'Si',
    wavelength: 1.5406,
    peaks: [28.442, 47.302, 56.123, 69.131, 76.38, 88.03, 94.89],
    hkls: ['111', '220', '311', '400', '331', '422', '511'],
    description: 'Internal reference standard used globally for peak position and line-broadening calibration.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 5.4311 Å'
  },
  {
    name: 'Polyethylene (HDPE)',
    formula: '(C2H4)n',
    wavelength: 1.5406,
    peaks: [21.5, 24.0, 30.1, 36.3, 39.7],
    hkls: ['110', '200', '210', '020', '011'],
    description: 'High-density semi-crystalline polymer showing strong crystalline reflections superimposed on amorphous halo.',
    category: 'Polymer',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pnam (No. 62)',
    latticeParams: 'a = 7.42 Å, b = 4.96 Å, c = 2.54 Å'
  },
  {
    name: 'Polypropylene (Isotactic)',
    formula: '(C3H6)n',
    wavelength: 1.5406,
    peaks: [14.1, 16.9, 18.6, 21.2, 21.8],
    hkls: ['110', '040', '130', '111', '041'],
    description: 'Alpha-form isotactic PP, showing multiple sharp characteristic reflections due to its monoclinic packing.',
    category: 'Polymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/c (No. 14)',
    latticeParams: 'a = 6.65 Å, b = 20.96 Å, c = 6.50 Å, β = 99.3°'
  },
  {
    name: 'PTFE (Teflon)',
    formula: '(CF2)n',
    wavelength: 1.5406,
    peaks: [18.1, 31.5, 36.6, 41.2],
    hkls: ['100', '110', '200', '107'],
    description: 'Highly helical crystalline polymer with a prominent reflection at 18.1° corresponding to interchain packing.',
    category: 'Polymer',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P3121 (No. 152)',
    latticeParams: 'a = 5.66 Å, c = 19.50 Å'
  },
  {
    name: 'Nylon 6',
    formula: '(C6H11NO)n',
    wavelength: 1.5406,
    peaks: [20.3, 23.7],
    hkls: ['200', '002'],
    description: 'Alpha crystalline monoclinic phase structured by hydrogen-bonded molecular chains.',
    category: 'Polymer',
    crystalSystem: 'Monoclinic',
    spaceGroup: 'P21/b (No. 14)',
    latticeParams: 'a = 9.56 Å, b = 17.24 Å, c = 8.01 Å, β = 67.5°'
  },
  {
    name: 'Polyethylene Terephthalate',
    formula: '(C10H8O4)n',
    wavelength: 1.5406,
    peaks: [16.2, 17.5, 22.8, 26.1],
    hkls: ['010', '110', '100', '110'],
    description: 'Semi-crystalline PET showing structural peaks induced via thermal holding or stretch orientation.',
    category: 'Polymer',
    crystalSystem: 'Triclinic',
    spaceGroup: 'P-1 (No. 2)',
    latticeParams: 'a = 4.56 Å, b = 5.94 Å, c = 10.75 Å'
  },
  {
    name: 'Aluminum',
    formula: 'Al',
    wavelength: 1.5406,
    peaks: [38.47, 44.72, 65.10, 78.23, 82.44],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Face-centered cubic metal, ideal for standard cell calculation and educational indexing.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0494 Å'
  },
  {
    name: 'Gold Powder',
    formula: 'Au',
    wavelength: 1.5406,
    peaks: [38.19, 44.39, 64.58, 77.55, 81.72],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Heavy chemical standard. Very high electron density creates brilliant reflections for instrument calibration.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0786 Å'
  },
  {
    name: 'Alpha Iron',
    formula: 'Fe',
    wavelength: 1.5406,
    peaks: [44.67, 65.02, 82.33, 98.94],
    hkls: ['110', '200', '211', '220'],
    description: 'Body-centered cubic Ferrite matrix, standard for structural steel alloying and phase analysis.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    latticeParams: 'a = 2.8664 Å'
  },
  {
    name: 'Cerium Oxide',
    formula: 'CeO2',
    wavelength: 1.5406,
    peaks: [28.55, 33.08, 47.48, 56.33, 59.08, 69.41, 76.70, 79.07],
    hkls: ['111', '200', '220', '311', '222', '400', '331', '420'],
    description: 'Fluorite cubic oxide displaying high catalytic action; excellent for line profile grain size evaluations.',
    category: 'Ceramic',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.4110 Å'
  },
  {
    name: 'Titanium Dioxide (Rutile)',
    formula: 'TiO2',
    wavelength: 1.5406,
    peaks: [27.44, 36.08, 39.18, 41.22, 44.05, 54.31, 56.62, 62.73, 64.03, 68.99],
    hkls: ['110', '101', '200', '111', '210', '211', '220', '002', '310', '301'],
    description: 'Thermally stable tetragonal polymorph of titanium dioxide showing high refractive index.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/mnm (No. 136)',
    latticeParams: 'a = 4.5937 Å, c = 2.9587 Å'
  },
  {
    name: 'Titanium Dioxide (Anatase)',
    formula: 'TiO2',
    wavelength: 1.5406,
    peaks: [25.28, 37.80, 48.05, 53.89, 55.06, 62.69, 68.76, 70.31, 75.03],
    hkls: ['101', '004', '200', '105', '211', '204', '116', '220', '215'],
    description: 'Metastable photoactive polymorph of titania, standard for thin-film solar cell validation and nanotechnology.',
    category: 'Ceramic',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I41/amd (No. 141)',
    latticeParams: 'a = 3.7852 Å, c = 9.5139 Å'
  },
  {
    name: 'Graphite',
    formula: 'C',
    wavelength: 1.5406,
    peaks: [26.54, 42.43, 44.59, 54.67, 77.54],
    hkls: ['002', '100', '101', '004', '110'],
    description: 'In-plane hexagonal sp² carbon displaying enormous basal orientation anisotropy.',
    category: 'Standard',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 2.464 Å, c = 6.708 Å'
  },
  {
    name: 'Sodium Chloride',
    formula: 'NaCl',
    wavelength: 1.5406,
    peaks: [27.35, 31.69, 45.45, 53.89, 56.48, 66.23, 75.31],
    hkls: ['111', '200', '220', '311', '222', '400', '420'],
    description: 'Prototypical rock salt ionic structure, perfect for demonstrating structural factor absences.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.6402 Å'
  },
  {
    name: 'Copper',
    formula: 'Cu',
    wavelength: 1.5406,
    peaks: [43.30, 50.43, 74.13, 89.93, 116.92],
    hkls: ['111', '200', '220', '311', '400'],
    description: 'Highly ordered metallic wire alloy substrate, showing characteristic intense peak shifts.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.6149 Å'
  },
  {
    name: 'Silver',
    formula: 'Ag',
    wavelength: 1.5406,
    peaks: [38.12, 44.30, 64.44, 77.40, 81.54],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Brilliant conductive silver nanoparticles for studying size-strain properties through full-width indices.',
    category: 'Metal',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 4.0862 Å'
  },
  {
    name: 'Zinc Oxide',
    formula: 'ZnO',
    wavelength: 1.5406,
    peaks: [31.77, 34.42, 36.25, 47.54, 56.60, 62.86, 66.38, 67.96, 69.10],
    hkls: ['100', '002', '101', '102', '110', '103', '200', '112', '201'],
    description: 'Hexagonal wurtzite crystal system, important optoelectronic material that shows multiple diagnostic reflections.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.2498 Å, c = 5.2066 Å'
  },
  {
    name: 'Quartz (Alpha)',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [20.86, 26.64, 36.54, 39.46, 40.29, 42.45, 45.79, 50.14, 54.87, 59.95, 60.14],
    hkls: ['100', '101', '110', '102', '111', '200', '201', '112', '202', '211', '103'],
    description: 'Trigonal quartz matrix. Extremely rich in low-symmetry peaks, frequently chosen for indexing exercises.',
    category: 'Ceramic',
    crystalSystem: 'Trigonal',
    spaceGroup: 'P3221 (No. 154)',
    latticeParams: 'a = 4.9134 Å, c = 5.4052 Å'
  },
  {
    name: 'Diamond',
    formula: 'C',
    wavelength: 1.5406,
    peaks: [43.92, 75.30, 91.50, 119.52],
    hkls: ['111', '220', '311', '400'],
    description: 'Sp³ carbon diamond-cubic framework with ultra-small unit cell sizes and sparse peaks.',
    category: 'Standard',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m (No. 227)',
    latticeParams: 'a = 3.5671 Å'
  },
  {
    name: 'Hydroxyapatite',
    formula: 'Ca10(PO4)6(OH)2',
    wavelength: 1.5406,
    peaks: [25.87, 31.77, 32.19, 32.90, 34.04, 39.81],
    hkls: ['002', '211', '112', '300', '202', '310'],
    description: 'Highly relevant bio-mineral form of calcium phosphate used in bone implants and scaffolds.',
    category: 'Biomaterial',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/m (No. 176)',
    latticeParams: 'a = 9.418 Å, c = 6.884 Å'
  },
  {
    name: 'Barium Titanate',
    formula: 'BaTiO3',
    wavelength: 1.5406,
    peaks: [22.20, 31.50, 38.90, 45.30, 50.90, 56.20],
    hkls: ['100', '110', '111', '200', '210', '211'],
    description: 'Classic ferroelectric perovskite demonstrating structural transitions between cubic and tetragonal.',
    category: 'Perovskite',
    crystalSystem: 'Tetragonal / Cubic',
    spaceGroup: 'P4mm / Pm-3m',
    latticeParams: 'a = 3.996 Å, c = 4.036 Å'
  },
  {
    name: 'Uranium Dioxide',
    formula: 'UO2',
    wavelength: 1.5406,
    peaks: [28.2, 32.7, 47.0, 55.8, 58.5],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Fluorite cubic structure. The baseline primary oxide fuel for light water nuclear reactions.',
    category: 'Nuclear',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.470 Å'
  },
  {
    name: 'Thorium Dioxide',
    formula: 'ThO2',
    wavelength: 1.5406,
    peaks: [27.6, 31.9, 45.8, 54.4, 57.0],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'High thermal conductivity nuclear breeding material featuring extremely high melt stability.',
    category: 'Nuclear',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 5.600 Å'
  },
  {
    name: 'Zircaloy-4',
    formula: 'Zr Alloy',
    wavelength: 1.5406,
    peaks: [31.9, 34.8, 36.5, 47.9],
    hkls: ['100', '002', '101', '102'],
    description: 'Corrosion-resistant Zr-matrix alloy for reactor cladding showing Hexagonal-Close-Packed (HCP) structural modes.',
    category: 'Nuclear',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.232 Å, c = 5.147 Å'
  },
  {
    name: 'Stainless Steel 316L',
    formula: 'Fe-Cr-Ni',
    wavelength: 1.5406,
    peaks: [43.6, 50.8, 74.7, 90.7, 95.9],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Low-carbon austenitic alloy with added molybdenum to resist localized pitting corrosion.',
    category: 'Metallurgy',
    crystalSystem: 'Cubic (Austenite)',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.596 Å'
  },
  {
    name: 'Stainless Steel 304',
    formula: 'Fe-Cr-Ni (304)',
    wavelength: 1.5406,
    peaks: [43.5, 50.7, 74.5, 90.5, 95.7],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Classic austenitic alloy highly structured for general structural and household applications.',
    category: 'Metallurgy',
    crystalSystem: 'Cubic (Austenite)',
    spaceGroup: 'Fm-3m (No. 225)',
    latticeParams: 'a = 3.590 Å'
  },
  {
    name: 'Ti-6Al-4V (Grade 5)',
    formula: 'Ti-6Al-4V',
    wavelength: 1.5406,
    peaks: [35.1, 38.4, 40.2, 53.0, 63.3, 70.6, 76.2],
    hkls: ['100', '002', '101', '102', '110', '103', '112'],
    description: 'Standard workhorse aerospace grade alloy highlighting dual HCP alpha and BCC beta crystal mixtures.',
    category: 'Metallurgy',
    crystalSystem: 'Dual Phase HCP + BCC',
    spaceGroup: 'P63/mmc + Im-3m',
    latticeParams: 'a(hcp) = 2.93 Å, a(bcc) = 3.22 Å'
  },
  {
    name: 'Bismuth Telluride',
    formula: 'Bi2Te3',
    wavelength: 1.5406,
    peaks: [17.5, 27.6, 37.8, 41.2, 44.6, 50.3],
    hkls: ['006', '015', '1010', '110', '0015', '205'],
    description: 'Layered rhombohedral structure, foundational thermoelectric and pioneering topological insulator.',
    category: 'Thermoelectric',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3m (No. 166)',
    latticeParams: 'a = 4.384 Å, c = 30.49 Å'
  },
  {
    name: 'Gallium Nitride',
    formula: 'GaN',
    wavelength: 1.5406,
    peaks: [32.39, 34.56, 36.84, 48.08, 57.77, 63.34],
    hkls: ['100', '002', '101', '102', '110', '103'],
    description: 'High-power wide-bandgap semiconductor configured extensively for modern solid-state green/blue lasers and power grids.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal (Wurtzite)',
    spaceGroup: 'P63mc (No. 186)',
    latticeParams: 'a = 3.189 Å, c = 5.185 Å'
  },
  {
    name: 'Molybdenum Disulfide',
    formula: 'MoS2',
    wavelength: 1.5406,
    peaks: [14.38, 29.02, 32.67, 33.51, 35.87, 39.54, 44.15],
    hkls: ['002', '004', '100', '101', '102', '103', '006'],
    description: 'Monolayer transition metal dichalcogenide; prominent hexagonal structural shifts indicate solid-state shearing.',
    category: 'Ceramic',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc (No. 194)',
    latticeParams: 'a = 3.16 Å, c = 12.29 Å'
  }
];

interface TestMaterialsModuleProps {
  onLoadMaterial: (peaks: number[], wavelength: number, hkls: string[], name: string) => void;
}

type TabGroup = 'All' | 'Standards' | 'Metals' | 'Ceramics' | 'Polymers' | 'Custom';

export const TestMaterialsModule: React.FC<TestMaterialsModuleProps> = ({ onLoadMaterial }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabGroup>('All');
  const [customPresets, setCustomPresets] = useState<MaterialPreset[]>([]);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  
  // Custom Preset Creation Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [newWavelength, setNewWavelength] = useState('1.5406');
  const [newPeaks, setNewPeaks] = useState('');
  const [newHkls, setNewHkls] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Standard' | 'Metal' | 'Ceramic' | 'Polymer'>('Standard');
  const [newCrystalSystem, setNewCrystalSystem] = useState('');
  const [newSpaceGroup, setNewSpaceGroup] = useState('');
  const [newLattice, setNewLattice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Load custom presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('xrd_custom_presets');
      if (stored) {
        setCustomPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse custom presets', e);
    }
  }, []);

  // Save custom presets
  const saveCustomPresets = (updated: MaterialPreset[]) => {
    setCustomPresets(updated);
    localStorage.setItem('xrd_custom_presets', JSON.stringify(updated));
  };

  // Convert categories into TabGroups
  const getTabOfPreset = (preset: MaterialPreset): TabGroup => {
    if (preset.category === 'Custom') return 'Custom';
    if (['Standard'].includes(preset.category)) return 'Standards';
    if (['Metal', 'Metallurgy'].includes(preset.category)) return 'Metals';
    if (['Ceramic', 'Perovskite', 'Thermoelectric', 'Biomaterial'].includes(preset.category)) return 'Ceramics';
    if (['Polymer'].includes(preset.category)) return 'Polymers';
    return 'All';
  };

  const handleAddCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!newName.trim()) {
      setFormError('Please enter a material standard name.');
      return;
    }
    if (!newFormula.trim()) {
      setFormError('Please provide a chemical formula (e.g., Al2O3).');
      return;
    }

    const wavelengthFloat = parseFloat(newWavelength);
    if (isNaN(wavelengthFloat) || wavelengthFloat <= 0) {
      setFormError('Please enter a valid radiation wavelength in Angstroms.');
      return;
    }

    // Parse peaks
    const parsedPeaks = newPeaks
      .split(',')
      .map(p => parseFloat(p.trim()))
      .filter(p => !isNaN(p));

    if (parsedPeaks.length === 0) {
      setFormError('Please input at least one numeric diffraction peak (2θ).');
      return;
    }

    // Check peak ranges
    const badPeaks = parsedPeaks.filter(p => p <= 2 || p >= 180);
    if (badPeaks.length > 0) {
      setFormError('Peaks must be in the valid physical 2θ diffraction range (2° to 178°).');
      return;
    }

    // Parse HKLs
    const parsedHkls = newHkls
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    if (parsedHkls.length > 0 && parsedHkls.length !== parsedPeaks.length) {
      setFormError(`HKL count (${parsedHkls.length}) must match the Peak count (${parsedPeaks.length}).`);
      return;
    }

    // Prepare hkls matching length
    const finalHkls = parsedHkls.length > 0 
      ? parsedHkls 
      : Array(parsedPeaks.length).fill('?');

    const newPreset: MaterialPreset = {
      name: newName.trim(),
      formula: newFormula.trim(),
      wavelength: wavelengthFloat,
      peaks: parsedPeaks,
      hkls: finalHkls,
      description: newDesc.trim() || 'Custom user calibration standard.',
      category: 'Custom',
      crystalSystem: newCrystalSystem.trim() || undefined,
      spaceGroup: newSpaceGroup.trim() || undefined,
      latticeParams: newLattice.trim() || undefined,
    };

    const updated = [...customPresets, newPreset];
    saveCustomPresets(updated);

    // Reset Form
    setNewName('');
    setNewFormula('');
    setNewPeaks('');
    setNewHkls('');
    setNewDesc('');
    setNewCrystalSystem('');
    setNewSpaceGroup('');
    setNewLattice('');
    setSuccessMsg('Material suite successfully added directly to local register!');
    setTimeout(() => {
      setIsAdding(false);
      setSuccessMsg(null);
      setActiveTab('Custom');
    }, 1200);
  };

  const handleDeleteCustomPreset = (nameToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${nameToDelete}"?`)) return;
    
    const updated = customPresets.filter(p => p.name !== nameToDelete);
    saveCustomPresets(updated);
    if (expandedMaterial === nameToDelete) {
      setExpandedMaterial(null);
    }
  };

  // Combine standard and custom presets
  const allPresets = [...PRESETS, ...customPresets];

  // Filter based on Tab + Search Query
  const filteredPresets = allPresets.filter(preset => {
    // Tab filtering
    if (activeTab !== 'All') {
      const g = getTabOfPreset(preset);
      if (g !== activeTab) return false;
    }

    // Search query filtering
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const inName = preset.name.toLowerCase().includes(q);
      const inFormula = preset.formula.toLowerCase().includes(q);
      const inDesc = preset.description.toLowerCase().includes(q);
      const inCat = preset.category.toLowerCase().includes(q);
      const inHkls = preset.hkls.some(h => h.toLowerCase().includes(q));
      const inSystem = preset.crystalSystem?.toLowerCase().includes(q) || false;
      return (inName || inFormula || inDesc || inCat || inHkls || inSystem);
    }

    return true;
  });

  const getCountForTab = (tab: TabGroup): number => {
    if (tab === 'All') return allPresets.length;
    return allPresets.filter(p => getTabOfPreset(p) === tab).length;
  };

  // Calculate dynamic d-spacings for a peak array and wavelength
  const calculateDSpacings = (peaks: number[], wl: number) => {
    return peaks.map(twoTheta => {
      const thetaRad = (twoTheta / 2) * (Math.PI / 180);
      if (Math.sin(thetaRad) <= 0) return 0;
      return wl / (2 * Math.sin(thetaRad));
    });
  };

  // Helper code to copy peaks list to clipboard
  const handleCopyPeaksText = (preset: MaterialPreset, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const txt = preset.peaks.join(', ');
    navigator.clipboard.writeText(txt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="bg-[#0A101C]/95 rounded-[2rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden transition-all text-left">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none">Test Data Suites</h3>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">Experimental Presets & Register</span>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setFormError(null);
            setSuccessMsg(null);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border ${
            isAdding 
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30' 
              : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/30'
          }`}
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Close Builder' : 'Build Custom Suite'}
        </button>
      </div>

      {/* Add Custom Preset Form Block */}
      {isAdding && (
        <div className="mb-6 p-5 rounded-2xl bg-[#0F172A]/90 border border-indigo-500/20 shadow-inner relative z-10 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleAddCustomPreset} className="space-y-4">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Define Custom Crystal Suite
            </h4>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] leading-relaxed">
                ⚠ {formError}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-sans text-[10px] flex items-center gap-1.5">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Standard Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Zinc Nitride Reference"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Chemical Formula *</label>
                <input
                  type="text"
                  placeholder="e.g. Zn3N2"
                  value={newFormula}
                  onChange={e => setNewFormula(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Wavelength (Å)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newWavelength}
                  onChange={e => setNewWavelength(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white font-mono focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Crystal System (Opt)</label>
                <input
                  type="text"
                  placeholder="e.g. Cubic"
                  value={newCrystalSystem}
                  onChange={e => setNewCrystalSystem(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Space Group (Opt)</label>
                <input
                  type="text"
                  placeholder="e.g. Ia-3 (No. 206)"
                  value={newSpaceGroup}
                  onChange={e => setNewSpaceGroup(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Lattice Dimensions (Opt)</label>
              <input
                type="text"
                placeholder="e.g. a = 9.78 Å"
                value={newLattice}
                onChange={e => setNewLattice(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Diffraction Peaks (2θ, comma separated) *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 21.24, 30.56, 35.88"
                  value={newPeaks}
                  onChange={e => setNewPeaks(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">HKL Indices (comma separated, matching peaks counter)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 110, 200, 211"
                  value={newHkls}
                  onChange={e => setNewHkls(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Description (Opt)</label>
              <input
                type="text"
                placeholder="Refractory nitride powder prepared by chemical synthesis."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg outline-none text-xs text-white focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" /> Save Suite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-5 z-10 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search suite by element, formula, structural space group, HKL..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-950/60 border border-white/5 text-slate-200 outline-none rounded-xl focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/10 placeholder:text-slate-600 transition-all text-xs font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pill Filters */}
      <div className="relative z-10 flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-none select-none max-w-full">
        {(['All', 'Standards', 'Metals', 'Ceramics', 'Polymers', 'Custom'] as TabGroup[]).map(tab => {
          const count = getCountForTab(tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                  : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-300 hover:bg-black/40'
              }`}
            >
              {tab}
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab 
                  ? 'bg-indigo-400/20 text-indigo-300' 
                  : 'bg-white/5 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Presets List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-800">
        {filteredPresets.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-black/20 border border-white/5 text-slate-500 text-xs flex flex-col items-center gap-2">
            <SlidersHorizontal className="w-8 h-8 text-slate-600 stroke-1" />
            <p className="uppercase font-mono tracking-widest text-[10px]">No material suites found matching terms</p>
            <p className="text-[9px] text-slate-600 font-sans italic">Try resetting query filter parameters</p>
          </div>
        ) : (
          filteredPresets.map((material, idx) => {
            const isExpanded = expandedMaterial === material.name;
            const computedD = calculateDSpacings(material.peaks, material.wavelength);

            return (
              <div
                key={material.name}
                onClick={() => setExpandedMaterial(isExpanded ? null : material.name)}
                className={`group flex flex-col p-4 bg-slate-950/40 border rounded-2xl cursor-pointer hover:bg-slate-950/70 transition-all relative overflow-hidden select-none ${
                  isExpanded 
                    ? 'border-indigo-500/40 ring-1 ring-indigo-500/10' 
                    : 'border-white/5 hover:border-indigo-500/20'
                }`}
              >
                {/* Visual accent left line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
                  isExpanded ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-500/30'
                }`} />

                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                    <span className="text-xs font-black text-white hover:text-indigo-400 transition-colors">
                      {material.name}
                    </span>
                    <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded leading-none">
                      {material.formula}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      material.category === 'Standard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      material.category === 'Metal' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      material.category === 'Ceramic' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      material.category === 'Perovskite' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      material.category === 'Biomaterial' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      material.category === 'Nuclear' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      material.category === 'Polymer' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                      material.category === 'Custom' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {material.category}
                    </span>

                    {material.category === 'Custom' && (
                      <button
                        onClick={(e) => handleDeleteCustomPreset(material.name, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors hover:bg-rose-500/10 rounded-md"
                        title="Delete Custom Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal mb-3 pr-4">
                  {material.description}
                </p>

                {/* Micro metrics view in main state */}
                <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-3">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> λ = {material.wavelength}Å
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" /> {material.peaks.length} Reflections
                    </span>
                    {material.crystalSystem && (
                      <span className="hidden sm:inline-block px-1.5 py-0.2 bg-white/5 text-[9px] font-sans font-bold text-slate-400 rounded">
                        {material.crystalSystem}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-indigo-400 font-sans font-bold uppercase tracking-wider">
                    {isExpanded ? (
                      <span className="flex items-center gap-1"><X className="w-3 h-3 text-rose-400" /> Collapse</span>
                    ) : (
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-indigo-400 animate-pulse" /> Inspect</span>
                    )}
                  </div>
                </div>

                {/* Expanded Crystallographic Details Table */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-4 pt-4 border-t border-white/5 space-y-4 cursor-default animate-in fade-in duration-200"
                  >
                    {/* Structure stats */}
                    {(material.crystalSystem || material.spaceGroup || material.latticeParams) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-black/30 p-3 rounded-xl border border-white/5 text-[10px] leading-tight">
                        {material.crystalSystem && (
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">System</span>
                            <span className="font-sans text-slate-300 font-bold block mt-0.5">{material.crystalSystem}</span>
                          </div>
                        )}
                        {material.spaceGroup && (
                          <div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Space Group</span>
                            <span className="font-mono text-indigo-300 font-bold block mt-0.5">{material.spaceGroup}</span>
                          </div>
                        )}
                        {material.latticeParams && (
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Dimensions</span>
                            <span className="font-mono text-emerald-400 font-bold block mt-0.5">{material.latticeParams}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reflection Table */}
                    <div className="bg-[#050B14] p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Bragg reflection calculations ({material.wavelength} Å):</span>
                      <div className="overflow-x-auto max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        <table className="w-full text-left font-mono text-[10px]">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[8px] text-slate-500 tracking-wider font-sans uppercase">
                              <th className="px-3 py-1.5 text-indigo-400">Reflection (2θ)</th>
                              <th className="px-3 py-1.5">Miller (hkl)</th>
                              <th className="px-3 py-1.5 text-right font-sans font-black text-emerald-400">d-spacing (Å)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {material.peaks.map((peak, pidx) => (
                              <tr key={pidx} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-indigo-300 font-bold">{peak.toFixed(3)}°</td>
                                <td className="px-3 py-2 text-slate-400">{material.hkls[pidx] || '?'}</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-400">
                                  {computedD[pidx] > 0 ? `${computedD[pidx].toFixed(4)} Å` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadMaterial(material.peaks, material.wavelength, material.hkls, material.name);
                        }}
                        className="flex-1 py-2 px-3 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-sans font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Initialize Session
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyPeaksText(material, idx, e)}
                        className="py-2 px-3 bg-slate-900 border border-white/5 text-slate-300 hover:text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" /> List Peaks
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 relative z-10 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-[10px] text-slate-400 leading-normal font-sans text-left">
          <strong>Suite Reference calibration:</strong> Presets default to traditional copper K-alpha (1.5406 Å) wavelengths unless specified. You can load these standards into your active calculator session to test indexing logic, calculate exact grain sizes, or cross-calibrate.
        </div>
      </div>
    </div>
  );
};
