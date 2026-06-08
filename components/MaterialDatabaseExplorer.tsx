import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Search, 
  Filter, 
  Activity, 
  Box, 
  Compass, 
  FlaskConical, 
  Sparkles, 
  Info, 
  Layers, 
  Columns,
  Grid,
  TrendingUp,
  X,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Save,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Undo
} from 'lucide-react';
import { MATERIAL_DB } from '../utils/materialDB';

const LOCAL_STORAGE_KEY = 'crystal_suite_materials_v1';

// Define layout groupings for Crystal Systems
const NORMALIZED_SYSTEMS = [
  { id: 'Cubic', test: (sys: string) => sys.toLowerCase().includes('cubic') },
  { id: 'Hexagonal', test: (sys: string) => sys.toLowerCase().includes('hexagonal') },
  { id: 'Tetragonal', test: (sys: string) => sys.toLowerCase().includes('tetragonal') },
  { id: 'Orthorhombic', test: (sys: string) => sys.toLowerCase().includes('orthorhombic') },
  { id: 'Monoclinic', test: (sys: string) => sys.toLowerCase().includes('monoclinic') },
  { id: 'Triclinic', test: (sys: string) => sys.toLowerCase().includes('triclinic') },
  { id: 'Trigonal & Rhombohedral', test: (sys: string) => sys.toLowerCase().includes('trigonal') || sys.toLowerCase().includes('rhombohedral') },
  { id: 'Amorphous & Misc', test: (sys: string) => sys.toLowerCase().includes('amorphous') || sys.toLowerCase().includes('glass') || sys.toLowerCase().includes('layered') || sys.toLowerCase().includes('mixture') || sys.toLowerCase().includes('complex') || sys.toLowerCase().includes('multiphase') }
];

export const MaterialDatabaseExplorer: React.FC = () => {
  const { t } = useTranslation();

  // Load and preserve materials with local overrides
  const [materials, setMaterials] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load material overrides', e);
    }
    return MATERIAL_DB;
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCrystalSystem, setSelectedCrystalSystem] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'density' | 'molecularWeight' | 'elasticModulus'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected material for deep inspection tracked by name to react beautifully to edits
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>(
    () => MATERIAL_DB[0]?.name || ''
  );

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.name === selectedMaterialName) || materials[0] || null;
  }, [materials, selectedMaterialName]);

  // View style
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFormula, setEditFormula] = useState('');
  const [editCrystalSystem, setEditCrystalSystem] = useState('');
  const [editSpaceGroup, setEditSpaceGroup] = useState('');
  const [editDensity, setEditDensity] = useState('');
  const [editElasticModulus, setEditElasticModulus] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPattern, setEditPattern] = useState('');
  const [editApplications, setEditApplications] = useState<string[]>([]);
  const [newAppText, setNewAppText] = useState('');
  const [editError, setEditError] = useState('');

  // Persists the materials array
  const saveMaterials = (newMaterials: typeof MATERIAL_DB) => {
    setMaterials(newMaterials);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMaterials));
    } catch (e) {
      console.error('Failed to save material overrides', e);
    }
  };

  // Check if active material has been modified compared to default DB
  const isSelectedMaterialModified = useMemo(() => {
    if (!selectedMaterial) return false;
    const original = MATERIAL_DB.find(m => m.name === selectedMaterial.name);
    if (!original) return false;
    // Fast comparison of core properties
    return (
      original.formula !== selectedMaterial.formula ||
      original.crystalSystem !== selectedMaterial.crystalSystem ||
      original.spaceGroup !== selectedMaterial.spaceGroup ||
      original.density !== selectedMaterial.density ||
      original.elasticModulus !== selectedMaterial.elasticModulus ||
      original.description !== selectedMaterial.description ||
      original.pattern !== selectedMaterial.pattern ||
      JSON.stringify(original.applications) !== JSON.stringify(selectedMaterial.applications)
    );
  }, [selectedMaterial, materials]);

  // Check if any materials inside the database has been modified
  const isAnyMaterialModified = useMemo(() => {
    return JSON.stringify(materials) !== JSON.stringify(MATERIAL_DB);
  }, [materials]);

  // Reset selected material to database defaults
  const handleResetSelected = () => {
    if (!selectedMaterial) return;
    const original = MATERIAL_DB.find(m => m.name === selectedMaterial.name);
    if (original) {
      const next = materials.map(m => m.name === selectedMaterial.name ? original : m);
      saveMaterials(next);
      setIsEditing(false);
    }
  };

  // Reset entire database to defaults
  const handleResetAllMaterials = () => {
    if (window.confirm(t('Are you sure you want to restore all materials back to standard defaults?', 'Are you sure you want to restore all materials back to standard defaults?'))) {
      saveMaterials(MATERIAL_DB);
      setIsEditing(false);
    }
  };

  // Parse list of categories from DB
  const categories = useMemo(() => {
    const list = new Set<string>();
    materials.forEach(m => {
      if (m.type) list.add(m.type);
    });
    return Array.from(list).sort();
  }, [materials]);

  // Compute stats across DB
  const stats = useMemo(() => {
    const totalCount = materials.length;
    
    // Category distribution
    const categoryDistribution: { [key: string]: number } = {};
    // Crystal system distribution
    const systemDistribution: { [key: string]: number } = {};
    // Unique chemical elements tracked
    const elementSet = new Set<string>();
    
    let sumDensity = 0;
    let countDensity = 0;
    let maxDensityVal = 0;
    let maxDensityMat = '';

    materials.forEach(m => {
      // Category count
      const cat = m.type || 'Unclassified';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

      // Crystal system normalization
      let matched = false;
      const sysStr = m.crystalSystem || 'Unknown';
      for (const sys of NORMALIZED_SYSTEMS) {
        if (sys.test(sysStr)) {
          systemDistribution[sys.id] = (systemDistribution[sys.id] || 0) + 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        systemDistribution['Other/Mixed'] = (systemDistribution['Other/Mixed'] || 0) + 1;
      }

      // Elements tracking
      if (m.elements && Array.isArray(m.elements)) {
        m.elements.forEach(el => elementSet.add(el));
      }

      // Density calculation
      if (m.density && typeof m.density === 'number' && m.density > 0) {
        sumDensity += m.density;
        countDensity += 1;
        if (m.density > maxDensityVal) {
          maxDensityVal = m.density;
          maxDensityMat = `${m.name} (${m.formula})`;
        }
      }
    });

    return {
      totalCount,
      uniqueElements: elementSet.size,
      avgDensity: countDensity ? (sumDensity / countDensity).toFixed(2) : 'N/A',
      maxDensity: { val: maxDensityVal, mat: maxDensityMat },
      categoryDistribution: Object.entries(categoryDistribution).map(([name, count]) => ({ name, count })),
      systemDistribution: Object.entries(systemDistribution).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count)
    };
  }, [materials]);

  // Filter and Sort dataset
  const filteredAndSortedMaterials = useMemo(() => {
    let list = materials;

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => {
        const nameMatch = m.name?.toLowerCase().includes(q);
        const formulaMatch = m.formula?.toLowerCase().includes(q);
        const elementMatch = m.elements?.some(el => el.toLowerCase() === q);
        const systemMatch = m.crystalSystem?.toLowerCase().includes(q);
        const spaceGroupMatch = m.spaceGroup?.toLowerCase().includes(q);
        const descMatch = m.description?.toLowerCase().includes(q);
        return nameMatch || formulaMatch || elementMatch || systemMatch || spaceGroupMatch || descMatch;
      });
    }

    // Apply Category Filter
    if (selectedCategory !== 'All') {
      list = list.filter(m => m.type === selectedCategory);
    }

    // Apply Crystal System Filter
    if (selectedCrystalSystem !== 'All') {
      list = list.filter(m => {
        const sysStr = m.crystalSystem || '';
        const systemRule = NORMALIZED_SYSTEMS.find(s => s.id === selectedCrystalSystem);
        return systemRule ? systemRule.test(sysStr) : sysStr.toLowerCase().includes(selectedCrystalSystem.toLowerCase());
      });
    }

    // Apply Sorting
    list = [...list].sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      // Handle nulls/undefined
      if (aVal === undefined || aVal === null) aVal = sortBy === 'name' ? '' : -1;
      if (bVal === undefined || bVal === null) bVal = sortBy === 'name' ? '' : -1;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    return list;
  }, [materials, searchQuery, selectedCategory, selectedCrystalSystem, sortBy, sortOrder]);

  // Current page records
  const paginatedMaterials = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMaterials.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedMaterials, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMaterials.length / itemsPerPage));

  // Reset page when queries change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCrystalSystem, sortBy, sortOrder]);

  // Toggle Sorting
  const triggerSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Safe category coloring utilities
  const getCategoryThemeColor = (category: string) => {
    const norm = category.toLowerCase();
    if (norm.includes('metal') || norm.includes('alloy') || norm.includes('metallurgy')) return 'amber';
    if (norm.includes('ceramic') || norm.includes('refractory') || norm.includes('oxide')) return 'blue';
    if (norm.includes('semiconductor') || norm.includes('photonics') || norm.includes('perovskite')) return 'cyan';
    if (norm.includes('polymer') || norm.includes('framework')) return 'fuchsia';
    if (norm.includes('biomaterial') || norm.includes('pharma')) return 'rose';
    if (norm.includes('nuclear') || norm.includes('shielding')) return 'orange';
    if (norm.includes('mineral') || norm.includes('geology')) return 'yellow';
    if (norm.includes('energy') || norm.includes('battery')) return 'emerald';
    if (norm.includes('magnetic') || norm.includes('ferroelectric')) return 'violet';
    if (norm.includes('carbon') || norm.includes('2d')) return 'purple';
    if (norm.includes('calibration') || norm.includes('standard')) return 'teal';
    return 'slate';
  };

  // Peak List Parsing helper for selected material
  const parsedPeaks = useMemo(() => {
    if (!selectedMaterial?.pattern) return [];
    try {
      return selectedMaterial.pattern
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split(',');
          return {
            twoTheta: parseFloat(parts[0]),
            intensity: parseFloat(parts[1])
          };
        })
        .sort((a,b) => a.twoTheta - b.twoTheta);
    } catch {
      return [];
    }
  }, [selectedMaterial]);

  // Validation function for XRD peak lines
  const validatePatternString = (patternStr: string): boolean => {
    const lines = patternStr.split('\n').filter(l => l.trim());
    if (lines.length === 0) return true;
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length !== 2) return false;
      const twoTheta = parseFloat(parts[0]);
      const intensity = parseFloat(parts[1]);
      if (isNaN(twoTheta) || isNaN(intensity)) return false;
      // Normal range checks for 2theta (e.g. 0 to 180 degrees)
      if (twoTheta < 0 || twoTheta > 180) return false;
      if (intensity < 0 || intensity > 100) return false;
    }
    return true;
  };

  // Set up values for edit mode
  const handleStartEdit = () => {
    if (!selectedMaterial) return;
    setEditName(selectedMaterial.name);
    setEditFormula(selectedMaterial.formula || '');
    setEditCrystalSystem(selectedMaterial.crystalSystem || '');
    setEditSpaceGroup(selectedMaterial.spaceGroup || '');
    setEditDensity(selectedMaterial.density?.toString() || '');
    setEditElasticModulus(selectedMaterial.elasticModulus?.toString() || '');
    setEditDescription(selectedMaterial.description || '');
    setEditPattern(selectedMaterial.pattern || '');
    setEditApplications(selectedMaterial.applications || []);
    setNewAppText('');
    setEditError('');
    setIsEditing(true);
  };

  // Save changes to active material
  const handleSaveEdit = () => {
    if (!selectedMaterial) return;

    if (!editName.trim()) {
      setEditError(t('Material name is required', 'Material name is required'));
      return;
    }
    if (!editFormula.trim()) {
      setEditError(t('Formula is required', 'Formula is required'));
      return;
    }

    if (!validatePatternString(editPattern)) {
      setEditError(t('Diffraction pattern must be comma-separated peak pairs (2θ, Intensity) - one pair per line (e.g. 28.3, 100). 2θ must be between 0° and 180°. Intensity must be between 0 and 100.', 'Diffraction pattern must be comma-separated peak pairs (2θ, Intensity) - one pair per line (e.g. 28.3, 100). 2θ must be between 0° and 180°. Intensity must be between 0 and 100.'));
      return;
    }

    // Extract chemical elements automatically from formula
    const elementsRegex = /[A-Z][a-z]?/g;
    const formulaElements = Array.from(new Set(editFormula.match(elementsRegex) || []));

    const updated: any = {
      ...selectedMaterial,
      name: editName.trim(),
      formula: editFormula.trim(),
      crystalSystem: editCrystalSystem.trim(),
      spaceGroup: editSpaceGroup.trim(),
      density: editDensity.trim() ? parseFloat(editDensity) : undefined,
      elasticModulus: editElasticModulus.trim() ? parseFloat(editElasticModulus) : undefined,
      description: editDescription.trim(),
      pattern: editPattern.trim(),
      applications: editApplications,
      elements: formulaElements.length > 0 ? formulaElements : selectedMaterial.elements
    };

    const next = materials.map(m => m.name === selectedMaterial.name ? updated : m);
    saveMaterials(next);
    setSelectedMaterialName(updated.name);
    setIsEditing(false);
  };

  // Tag helper functions
  const handleAddAppTag = () => {
    if (newAppText.trim() && !editApplications.includes(newAppText.trim())) {
      setEditApplications([...editApplications, newAppText.trim()]);
      setNewAppText('');
    }
  };

  const handleRemoveAppTag = (tag: string) => {
    setEditApplications(editApplications.filter(t => t !== tag));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-100">
      
      {/* 1. HERO DIRECTORY HEADER */}
      <div className="relative group p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-[#111A2E]/80 to-[#050B14]/90 border border-slate-800/60 shadow-2xl overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[inset_0_1px_5px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur">
            <Database className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase">
              {t('Scientific Materials Registry', 'Scientific Materials Registry')}
            </h1>
            <p className="text-xs text-indigo-400 font-mono font-bold tracking-widest uppercase mt-1">
              {t('Crystal Suite Database - Index 12.1.0', 'Crystal Suite Database - Index 12.1.0')}
            </p>
          </div>
        </div>

        {/* Global Inventory Counts Banner & Reset options */}
        <div className="flex gap-4 sm:gap-6 flex-wrap relative z-10 w-full md:w-auto mt-4 md:mt-0 items-center">
          <div className="flex-1 min-w-[120px] rounded-2xl bg-black/40 border border-indigo-500/20 px-4 py-3 text-center backdrop-blur">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono tracking-tighter">{stats.totalCount}</span>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Standards Indexed</p>
          </div>
          <div className="flex-1 min-w-[120px] rounded-2xl bg-black/40 border border-cyan-500/20 px-4 py-3 text-center backdrop-blur">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tracking-tighter">{categories.length}</span>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Taxonomy Types</p>
          </div>
          <div className="flex-1 min-w-[120px] rounded-2xl bg-black/40 border border-emerald-500/20 px-4 py-3 text-center backdrop-blur">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tighter">{stats.uniqueElements}</span>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Elements Tracked</p>
          </div>

          {/* Reset All Database Button */}
          {isAnyMaterialModified && (
            <button
              onClick={handleResetAllMaterials}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 shadow-lg"
              title={t('Reset entire database overrides to standard defaults', 'Reset entire database overrides to standard defaults')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset DB Override</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ANALYTICS & DISTRIBUTION METRICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category breakdown progress meter */}
        <div className="lg:col-span-7 bg-[#050B14]/85 border border-[#1e293b] p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base tracking-tight mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Taxonomy Category Breakdown
            </h3>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.categoryDistribution.map(({ name, count }) => {
                const percent = ((count / stats.totalCount) * 100).toFixed(1);
                const color = getCategoryThemeColor(name);
                
                // Color map for tailwind styles
                const textThemes: { [key: string]: string } = {
                  amber: 'text-amber-400', blue: 'text-blue-400', cyan: 'text-cyan-400',
                  fuchsia: 'text-fuchsia-400', rose: 'text-rose-400', orange: 'text-orange-400',
                  yellow: 'text-yellow-400', emerald: 'text-emerald-400', violet: 'text-violet-400',
                  purple: 'text-purple-400', teal: 'text-teal-400', slate: 'text-slate-400'
                };
                
                const bgThemes: { [key: string]: string } = {
                  amber: 'bg-amber-500', blue: 'bg-blue-500', cyan: 'bg-cyan-500',
                  fuchsia: 'bg-fuchsia-500', rose: 'bg-rose-500', orange: 'bg-orange-500',
                  yellow: 'bg-yellow-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500',
                  purple: 'bg-purple-500', teal: 'bg-teal-500', slate: 'bg-slate-500'
                };

                const tc = textThemes[color] || 'text-slate-400';
                const bc = bgThemes[color] || 'bg-slate-500';

                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bc}`} />
                        {name}
                      </span>
                      <span className="font-mono text-slate-400 font-bold">
                        <span className={tc}>{count}</span> <span className="text-[10px] text-slate-500">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900/60 rounded-full overflow-hidden border border-slate-800/50">
                      <div 
                        className={`h-full rounded-full ${bc} opacity-80`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Crystal System & Physical extremes */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Crystal system stats */}
          <div className="bg-[#050B14]/85 border border-[#1e293b] p-6 rounded-[2rem] shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-cyan-400" />
                Crystal System Distribution
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                {stats.systemDistribution.slice(0, 6).map(({ name, count }) => {
                  const percent = ((count / stats.totalCount) * 100).toFixed(1);
                  return (
                    <div key={name} className="p-3 rounded-xl bg-black/40 border border-slate-800/60 flex flex-col justify-between">
                      <span className="text-xs font-black text-slate-400 tracking-tight leading-tight truncate">{name}</span>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-base font-extrabold text-cyan-400 font-mono leading-none">{count}</span>
                        <span className="text-[9px] font-mono text-slate-500 font-bold">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Density metrics/stats extreme */}
          <div className="bg-[#050B14]/85 border border-[#1e293b] p-5 rounded-2xl shadow-xl flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Compass className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Database Density Extremes</h4>
                <p className="text-xs text-emerald-300 font-bold mt-1 max-w-[200px] truncate" title={stats.maxDensity.mat}>
                  {stats.maxDensity.mat || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-white font-mono leading-none">{stats.maxDensity.val || '0.0'}</span>
              <p className="text-[8px] uppercase text-slate-500 font-mono font-bold">g/cm³ (Max)</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. SEARCH, FILTERS & MATERIAL LIST SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FILTERS & DIRECTORY PAGED LIST */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-[#050B14]/80 p-5 rounded-3xl border border-slate-800 flex flex-col gap-4 relative z-20">
            
            {/* Direct Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("Search by formula, standard name, elements (e.g. 'Fe'), crystal systems...", "Search by formula, standard name, elements (e.g. 'Fe'), crystal systems...")}
                className="w-full pl-12 pr-10 py-3 bg-black/60 backdrop-blur border border-indigo-500/20 text-indigo-100 outline-none rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 placeholder:text-slate-500 transition-all text-xs font-mono shadow-inner select-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400 focus:outline-none transition-colors"
                  title="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              
              {/* Category selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-wider text-slate-500 ml-1">Taxonomy Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/50 border border-slate-800 text-slate-300 outline-none rounded-lg text-[10px] font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crystal System Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-wider text-slate-500 ml-1">Crystal Lattice System</label>
                <select
                  value={selectedCrystalSystem}
                  onChange={e => setSelectedCrystalSystem(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/50 border border-slate-800 text-slate-300 outline-none rounded-lg text-[10px] font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                >
                  <option value="All">All Lattice Systems</option>
                  <option value="Cubic">Cubic</option>
                  <option value="Hexagonal">Hexagonal</option>
                  <option value="Tetragonal">Tetragonal</option>
                  <option value="Orthorhombic">Orthorhombic</option>
                  <option value="Monoclinic">Monoclinic</option>
                  <option value="Triclinic">Triclinic</option>
                  <option value="Trigonal & Rhombohedral">Trigonal / Rhombohedral</option>
                  <option value="Amorphous & Misc">Amorphous / Other</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-wider text-slate-500 ml-1">Sort Metric</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-black/50 border border-slate-800 text-slate-300 outline-none rounded-lg text-[10px] font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                >
                  <option value="name">Chemical Name</option>
                  <option value="density">Density</option>
                  <option value="molecularWeight">Molecular Weight</option>
                  <option value="elasticModulus">Elastic Modulus</option>
                </select>
              </div>

            </div>

            {/* Sort order Toggle details */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
              <span>Found <span className="font-bold text-indigo-400 font-mono">{filteredAndSortedMaterials.length}</span> matching materials found</span>
              <button 
                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                className="hover:text-indigo-400 font-bold transition-all underline decoration-dotted capitalize"
              >
                Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          </div>

          {/* Directory Materials List Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedMaterials.map((material) => {
              const themeColor = getCategoryThemeColor(material.type || '');
              const isSelected = selectedMaterialName === material.name;

              // Check if actual item is modified compared to standard db
              const standardItem = MATERIAL_DB.find(m => m.name === material.name);
              const isItemModified = standardItem ? (
                standardItem.formula !== material.formula ||
                standardItem.crystalSystem !== material.crystalSystem ||
                standardItem.spaceGroup !== material.spaceGroup ||
                standardItem.density !== material.density ||
                standardItem.elasticModulus !== material.elasticModulus ||
                standardItem.description !== material.description ||
                standardItem.pattern !== material.pattern ||
                JSON.stringify(standardItem.applications) !== JSON.stringify(material.applications)
              ) : false;

              // Color classes
              const activeBorderColor = isSelected 
                ? 'border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-slate-900/60' 
                : 'border-slate-800/80 hover:border-indigo-500/20 bg-black/30 hover:bg-black/50';

              const indicatorBadgeTheme: any = {
                amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
                fuchsia: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
                rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                orange: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
                yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
                emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
                purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
                slate: 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
              };

              const countOfPeaks = material.pattern.split('\n').filter(p=>p.trim()).length;

              return (
                <div
                  key={material.name}
                  onClick={() => {
                    setSelectedMaterialName(material.name);
                    setIsEditing(false); // Close edit mode on change
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between ${activeBorderColor}`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-black text-white/95 leading-tight truncate max-w-[150px] flex items-center gap-1.5" title={material.name}>
                        {isItemModified && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" title="Has manual overrides" />
                        )}
                        {material.name}
                      </span>
                      <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${indicatorBadgeTheme[themeColor] || indicatorBadgeTheme.slate}`}>
                        {material.type || 'Custom'}
                      </span>
                    </div>

                    {/* Formula standard design */}
                    <div className="flex justify-between items-baseline mt-2 font-mono">
                      <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/5 px-2 py-0.5 rounded-md border border-cyan-500/10 font-mono">
                        {material.formula}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">
                        {material.crystalSystem || 'Crystalline'}
                      </span>
                    </div>

                    <p className="text-[9px] text-slate-400/80 mt-2.5 truncate-2-lines line-clamp-2 leading-relaxed h-8">
                      {material.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-950/20 text-[9px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3" /> SG: <span className="text-slate-300 font-bold">{material.spaceGroup || 'Unknown'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3" /> Peaks: <span className="text-indigo-400 font-bold">{countOfPeaks}</span>
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredAndSortedMaterials.length === 0 && (
              <div className="col-span-2 py-16 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-3xl">
                <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold uppercase tracking-wider font-mono">No matching standards found</p>
                <p className="text-[10px] text-slate-600 font-mono">Try adjusting your filtration criteria or spellings.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-black/40 px-5 py-3 rounded-2xl border border-slate-800/60 font-mono text-xs">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none pb-0.5"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              
              <span className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-widest">
                Page <span className="text-indigo-400">{currentPage}</span> of <span className="text-slate-300">{totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none pb-0.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DETAIL DIRECTORY VIEW & LIVE INTERACTIVE EDITOR FOR SELECTED STANDARD */}
        <div className="lg:col-span-5 relative">
          
          <div className="sticky top-6 space-y-6">
            
            {/* Main inspector panel */}
            <div className="bg-[#050B14]/90 rounded-[2rem] border border-indigo-500/30 p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {!selectedMaterial ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-4">
                  <Database className="w-12 h-12 text-slate-600 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold uppercase text-white tracking-widest text-xs">Crystallographic Inspector</h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-1 max-w-[250px]">Select any material from the database registry grid to view details and live diffraction projection.</p>
                  </div>
                </div>
              ) : isEditing ? (
                
                /* ================= EDIT PARAMETERS MODE ================= */
                <div className="space-y-5 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-extrabold text-white text-sm tracking-tight">
                        {t('Edit Material Attributes', 'Edit Material Attributes')}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title={t('Cancel editing', 'Cancel editing')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {editError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] rounded-xl font-mono leading-relaxed font-bold">
                      {editError}
                    </div>
                  )}

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Material Name input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Material Registry Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors"
                        placeholder="e.g. Uranium Dioxide (UO2 Nuclear Fuel)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Chemical Formula */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Formula</label>
                        <input
                          type="text"
                          value={editFormula}
                          onChange={e => setEditFormula(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors font-mono"
                          placeholder="e.g. UO2"
                        />
                      </div>

                      {/* Space group */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Space Group</label>
                        <input
                          type="text"
                          value={editSpaceGroup}
                          onChange={e => setEditSpaceGroup(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors font-mono"
                          placeholder="e.g. Fm-3m"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Crystal System */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Crystal System</label>
                        <select
                          value={editCrystalSystem}
                          onChange={e => setEditCrystalSystem(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                          <option value="Cubic">Cubic</option>
                          <option value="Hexagonal">Hexagonal</option>
                          <option value="Tetragonal">Tetragonal</option>
                          <option value="Orthorhombic">Orthorhombic</option>
                          <option value="Monoclinic">Monoclinic</option>
                          <option value="Triclinic">Triclinic</option>
                          <option value="Trigonal">Trigonal</option>
                          <option value="Rhombohedral">Rhombohedral</option>
                          <option value="Amorphous">Amorphous</option>
                          <option value="Other">Other / Mixed</option>
                        </select>
                      </div>

                      {/* Density (g/cm3) */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Density (g/cm³)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editDensity}
                          onChange={e => setEditDensity(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors font-mono"
                          placeholder="e.g. 10.97"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Elastic Modulus (GPa) */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Elastic Modulus (GPa)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editElasticModulus}
                          onChange={e => setEditElasticModulus(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors font-mono"
                          placeholder="e.g. 220"
                        />
                      </div>

                      {/* Info block */}
                      <div className="flex items-center justify-center p-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[9px] text-indigo-300 leading-snug font-mono">
                        Elements will auto-derive from the chemical formula format.
                      </div>
                    </div>

                    {/* Description Textarea */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Chemical Description</label>
                      <textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors h-16 resize-none"
                        placeholder="Description of structure and properties..."
                      />
                    </div>

                    {/* XRD Peak settings (2θ, intensity) */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">XRD Diffraction Pattern Peaks (2θ, Intensity)</label>
                        <span className="text-[8px] font-mono text-slate-500 font-bold">One pair per line</span>
                      </div>
                      <textarea
                        value={editPattern}
                        onChange={e => setEditPattern(e.target.value)}
                        className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors h-24 font-mono resize-y"
                        placeholder="Format: 2theta, Intensity&#10;e.g.&#10;28.3, 100&#10;32.8, 45&#10;47.1, 55"
                      />
                    </div>

                    {/* Applications Tag Selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Key Industrial Applications</label>
                      
                      <div className="flex gap-1.5 flex-wrap">
                        {editApplications.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[9px] font-sans font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-slate-100 border border-indigo-500/20">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveAppTag(tag)}
                              className="text-slate-400 hover:text-rose-400 focus:outline-none cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAppText}
                          onChange={e => setNewAppText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAppTag();
                            }
                          }}
                          className="flex-1 bg-black/60 border border-slate-800 text-xs px-3 py-1.5 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors"
                          placeholder="Add custom application role..."
                        />
                        <button
                          type="button"
                          onClick={handleAddAppTag}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Form Trigger Actions */}
                  <div className="flex gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Parameters</span>
                    </button>
                    
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

              ) : (

                /* ================= STANDARD DETAILS & READ MODE ================= */
                <div className="space-y-6 relative z-10">
                  
                  {/* Inspector Actions Bar: Edit and Reset buttons */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md">
                      {selectedMaterial.type || 'Custom Standard'}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-200"
                        title={t('Edit this material parameters', 'Edit this material parameters')}
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Parameters</span>
                      </button>

                      {isSelectedMaterialModified && (
                        <button
                          onClick={handleResetSelected}
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-200"
                          title={t('Reset overrides to default standard specifications', 'Reset overrides to default standard specifications')}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Defaults</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white leading-tight tracking-tight mt-1 flex items-center gap-2">
                      {selectedMaterial.name}
                      {isSelectedMaterialModified && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-sans font-black tracking-normal">
                          Modified
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-md shadow-inner">
                        {selectedMaterial.formula}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-4 border border-slate-900 rounded-xl max-h-[120px] overflow-y-auto">
                    {selectedMaterial.description}
                  </p>

                  {/* Quantitative Profile Grid */}
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    
                    <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Crystal System</span>
                      <span className="text-xs block text-slate-200 mt-1 truncate" title={selectedMaterial.crystalSystem}>
                        {selectedMaterial.crystalSystem || 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Space Group</span>
                      <span className="text-xs block text-slate-200 mt-1 uppercase font-bold">
                        {selectedMaterial.spaceGroup || 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Density</span>
                      <span className="text-xs block text-emerald-400 font-extrabold mt-1">
                        {selectedMaterial.density ? `${selectedMaterial.density} g/cm³` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Elastic Modulus</span>
                      <span className="text-xs block text-amber-400 font-extrabold mt-1">
                        {selectedMaterial.elasticModulus ? `${selectedMaterial.elasticModulus} GPa` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Mol. Weight</span>
                      <span className="text-xs block text-indigo-400 font-extrabold mt-1">
                        {selectedMaterial.molecularWeight ? `${selectedMaterial.molecularWeight} g/mol` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Elements Involved</span>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {selectedMaterial.elements?.map(el => (
                          <span key={el} className="text-[8px] bg-slate-800 border border-slate-700 font-black px-1.5 py-0.5 rounded text-white antialiased">
                            {el}
                          </span>
                        )) || '-'}
                      </div>
                    </div>

                  </div>

                  {/* Scientific Applications list */}
                  {selectedMaterial.applications && selectedMaterial.applications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] tracking-widest font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Key Applications & Roles
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedMaterial.applications.map(app => (
                          <span key={app} className="text-[9px] font-sans font-bold px-2.5 py-1 rounded-lg bg-indigo-500/5 text-slate-300 border border-indigo-500/10 animate-in fade-in zoom-in-95 duration-250">
                            {app}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LIVE DIFFRACTION SIMULATED projection bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-[10px] tracking-widest font-black uppercase text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        Simulated Diffraction projection (2-Theta)
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Cu-Kα (1.5406 Å)</span>
                    </h4>
                    
                    {/* Simulated Spectrum chart peaks */}
                    <div className="relative h-28 w-full bg-slate-950/80 rounded-xl border border-slate-900/80 overflow-hidden px-4">
                      {/* Grid background markers */}
                      <div className="absolute inset-x-0 bottom-0 top-[20%] flex justify-between px-2 text-[8px] font-mono text-slate-800 opacity-60 pointer-events-none">
                        <span>20°</span>
                        <span>40°</span>
                        <span>60°</span>
                        <span>85°</span>
                      </div>
                      
                      {/* Interactive Peak render */}
                      <div className="absolute inset-0 flex items-end justify-center pb-6">
                        {parsedPeaks.map((p, idx) => {
                          // Scale 2-theta to percent. Typical sweep is 10° to 90° for XRD
                          const minTheta = 10;
                          const maxTheta = 90;
                          const percentX = Math.max(0, Math.min(100, ((p.twoTheta - minTheta) / (maxTheta - minTheta)) * 100));
                          const heightPct = Math.max(10, p.intensity); // Intensity is 0 to 100

                          return (
                            <div 
                              key={idx}
                              className="absolute top-0 bottom-6 group/peak flex items-end animate-in slide-in-from-bottom-2 duration-300"
                              style={{ left: `${percentX}%` }}
                            >
                              {/* Peak vertical line */}
                              <div className="relative w-0.5 h-full bg-cyan-500/40 group-hover/peak:bg-indigo-400 transition-colors">
                                <div 
                                  className="absolute bottom-0 w-[2px] bg-gradient-to-t from-cyan-400 to-indigo-500 transition-all shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                  style={{ height: `${heightPct}%`, left: '-0.5px' }}
                                />
                                
                                {/* Live peak badge tooltip hovering */}
                                <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#0B1221] border border-cyan-500/30 text-[8px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover/peak:opacity-100 transition-opacity z-50 shadow-2xl">
                                  2θ: {p.twoTheta.toFixed(2)}° | Int: {p.intensity}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tick axis description */}
                      <div className="absolute bottom-0 inset-x-0 h-5 bg-black/60 border-t border-slate-900/60 flex justify-between px-4 items-center text-[8px] font-mono text-slate-500">
                        <span>10°</span>
                        <span>30°</span>
                        <span>50°</span>
                        <span>70°</span>
                        <span>90° 2θ</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

