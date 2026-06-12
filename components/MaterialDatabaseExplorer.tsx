import React, { useState, useMemo, useEffect } from 'react';
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
  Undo,
  Atom
} from 'lucide-react';
import { MATERIAL_DB } from '../utils/materialDB';
import { calculateThermodynamics, generateTemperatureSweep } from '../utils/thermodynamics';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const LOCAL_STORAGE_KEY = 'crystal_suite_materials_v1';

// Chemical element lookup for scientific detail overlays
const ELEMENT_DETAILS: Record<string, { name: string; z: number; weight: number; category: string; color: string }> = {
  "H": { name: "Hydrogen", z: 1, weight: 1.008, category: "Nonmetal", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  "Li": { name: "Lithium", z: 3, weight: 6.94, category: "Alkali Metal", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "Be": { name: "Beryllium", z: 4, weight: 9.012, category: "Alkaline Earth", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "B": { name: "Boron", z: 5, weight: 10.81, category: "Metalloid", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "C": { name: "Carbon", z: 6, weight: 12.011, category: "Nonmetal", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "N": { name: "Nitrogen", z: 7, weight: 14.007, category: "Nonmetal", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "O": { name: "Oxygen", z: 8, weight: 15.999, category: "Nonmetal", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "F": { name: "Fluorine", z: 9, weight: 18.998, category: "Halogen", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  "Na": { name: "Sodium", z: 11, weight: 22.990, category: "Alkali Metal", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "Mg": { name: "Magnesium", z: 12, weight: 24.305, category: "Alkaline Earth", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "Al": { name: "Aluminium", z: 13, weight: 26.982, category: "Post-Transition Metal", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "Si": { name: "Silicon", z: 14, weight: 28.085, category: "Metalloid", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "P": { name: "Phosphorus", z: 15, weight: 30.974, category: "Nonmetal", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "S": { name: "Sulfur", z: 16, weight: 32.065, category: "Nonmetal", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "Cl": { name: "Chlorine", z: 17, weight: 35.453, category: "Halogen", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  "K": { name: "Potassium", z: 19, weight: 39.098, category: "Alkali Metal", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "Ca": { name: "Calcium", z: 20, weight: 40.078, category: "Alkaline Earth", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "Sc": { name: "Scandium", z: 21, weight: 44.956, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Ti": { name: "Titanium", z: 22, weight: 47.867, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "V": { name: "Vanadium", z: 23, weight: 50.942, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Cr": { name: "Chromium", z: 24, weight: 51.996, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Mn": { name: "Manganese", z: 25, weight: 54.938, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Fe": { name: "Iron", z: 26, weight: 55.845, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Co": { name: "Cobalt", z: 27, weight: 58.933, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Ni": { name: "Nickel", z: 28, weight: 58.693, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Cu": { name: "Copper", z: 29, weight: 63.546, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Zn": { name: "Zinc", z: 30, weight: 65.38, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Ga": { name: "Gallium", z: 31, weight: 69.723, category: "Post-Transition Metal", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "Ge": { name: "Germanium", z: 32, weight: 72.63, category: "Metalloid", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "As": { name: "Arsenic", z: 33, weight: 74.922, category: "Metalloid", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "Se": { name: "Selenium", z: 34, weight: 78.971, category: "Nonmetal", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "Sr": { name: "Strontium", z: 38, weight: 87.62, category: "Alkaline Earth", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "Y": { name: "Yttrium", z: 39, weight: 88.906, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Zr": { name: "Zirconium", z: 40, weight: 91.224, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Nb": { name: "Niobium", z: 41, weight: 92.906, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Mo": { name: "Molybdenum", z: 42, weight: 95.95, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Ru": { name: "Ruthenium", z: 44, weight: 101.07, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Rh": { name: "Rhodium", z: 45, weight: 102.91, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Pd": { name: "Palladium", z: 46, weight: 106.42, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Ag": { name: "Silver", z: 47, weight: 107.87, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Cd": { name: "Cadmium", z: 48, weight: 112.41, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "In": { name: "Indium", z: 49, weight: 114.82, category: "Post-Transition Metal", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "Sn": { name: "Tin", z: 50, weight: 118.71, category: "Post-Transition Metal", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "Sb": { name: "Antimony", z: 51, weight: 121.76, category: "Metalloid", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "Te": { name: "Tellurium", z: 52, weight: 127.60, category: "Metalloid", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "Ba": { name: "Barium", z: 56, weight: 137.33, category: "Alkaline Earth", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "La": { name: "Lanthanum", z: 57, weight: 138.91, category: "Lanthanide", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "Ce": { name: "Cerium", z: 58, weight: 140.12, category: "Lanthanide", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "Ta": { name: "Tantalum", z: 73, weight: 180.95, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "W": { name: "Tungsten", z: 74, weight: 183.84, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Pt": { name: "Platinum", z: 78, weight: 195.08, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Au": { name: "Gold", z: 79, weight: 196.97, category: "Transition Metal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "Pb": { name: "Lead", z: 82, weight: 207.2, category: "Post-Transition Metal", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "Bi": { name: "Bismuth", z: 83, weight: 208.98, category: "Post-Transition Metal", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  "U": { name: "Uranium", z: 92, weight: 238.03, category: "Actinide", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

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
      let list = MATERIAL_DB;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge any newly introduced materials from MATERIAL_DB that are missing by name
          const parsedNames = new Set(parsed.map(m => m?.name).filter(Boolean));
          const missing = MATERIAL_DB.filter(m => !parsedNames.has(m.name));
          list = [...parsed, ...missing];
        }
      }
      // Guarantee absolute uniqueness by name
      const uniqueMap = new Map<string, any>();
      list.forEach(m => {
        if (m && m.name && !uniqueMap.has(m.name)) {
          uniqueMap.set(m.name, m);
        }
      });
      return Array.from(uniqueMap.values());
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

  // Scientific XRD properties
  const [xrdWavelength, setXrdWavelength] = useState<number>(1.54059);
  const [xrdFwhm, setXrdFwhm] = useState<number>(0.3);
  const [activeDetailTab, setActiveDetailTab] = useState<'spectrum' | 'lattice' | 'composition' | 'thermo'>('spectrum');
  const [thermoTemperature, setThermoTemperature] = useState<number>(298);

  // Smooth continuous spin duration for 3D crystal lattice visualizer
  const [spinTime, setSpinTime] = useState<number>(0);
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setSpinTime(prev => (prev + 0.008) % (Math.PI * 2));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCurationTools, setShowCurationTools] = useState(false);
  const [densityRange, setDensityRange] = useState<string>('All');
  const [elasticRange, setElasticRange] = useState<string>('All');

  const [editName, setEditName] = useState('');
  const [editFormula, setEditFormula] = useState('');
  const [editCrystalSystem, setEditCrystalSystem] = useState('');
  const [editSpaceGroup, setEditSpaceGroup] = useState('');
  const [editDensity, setEditDensity] = useState('');
  const [editElasticModulus, setEditElasticModulus] = useState('');
  const [editMolecularWeight, setEditMolecularWeight] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPattern, setEditPattern] = useState('');
  const [editApplications, setEditApplications] = useState<string[]>([]);
  const [newAppText, setNewAppText] = useState('');
  const [editError, setEditError] = useState('');

  // Database multi-stage automated refinement pipeline states
  const [isRefiningAll, setIsRefiningAll] = useState(false);
  const [refineProgress, setRefineProgress] = useState(0);
  const [refineStageMsg, setRefineStageMsg] = useState('');
  const [refineSummary, setRefineSummary] = useState<{
    totalProcessed: number;
    elementsSynced: number;
    stiffnessImputed: number;
    spaceGroupsNormalized: number;
    mwComputed: number;
    patternsNormalized: number;
    densitiesCalibrated: number;
    thermoRefined: number;
  } | null>(null);

  const computeFormulaWeight = (formula: string): number => {
    if (!formula) return 0;
    const cleanFormula = formula.replace(/\s+/g, '');
    const elementRegex = /([A-Z][a-z]*)(\d*\.?\d*)?/g;
    let match;
    let weight = 0;
    elementRegex.lastIndex = 0;
    let hasMatched = false;
    while ((match = elementRegex.exec(cleanFormula)) !== null) {
      hasMatched = true;
      const element = match[1];
      const countStr = match[2];
      const count = countStr ? parseFloat(countStr) : 1;
      const details = ELEMENT_DETAILS[element];
      if (details) {
        weight += details.weight * count;
      } else {
        const otherElWeights: Record<string, number> = {
          "He": 4.0026, "Ne": 20.180, "Ar": 39.948, "Kr": 83.798, "Xe": 131.29,
          "Rb": 85.468, "Cs": 132.91, "Fr": 223, "Ra": 226, "Ac": 227, "Th": 232.04,
          "Pa": 231.04, "Np": 237, "Pu": 244, "Am": 243, "Cm": 247, "Bk": 247, "Cf": 251,
          "Es": 252, "Fm": 257, "Md": 258, "No": 259, "Lr": 262, "Rf": 267, "Db": 268,
          "Sg": 271, "Bh": 272, "Hs": 270, "Mt": 276, "Ds": 281, "Rg": 280, "Cn": 285,
          "Nh": 284, "Fl": 289, "Mc": 288, "Lv": 293, "Ts": 294, "Og": 294,
          "Pm": 145, "Sm": 150.36, "Eu": 151.96, "Gd": 157.25, "Tb": 158.93,
          "Dy": 162.50, "Ho": 164.93, "Er": 167.26, "Tm": 168.93, "Yb": 173.05, "Lu": 174.97,
          "Hf": 178.49, "Re": 186.21, "Os": 190.23, "Ir": 192.22, "Tl": 204.38, "Po": 209, "At": 210, "Rn": 222
        };
        const guessedWeight = otherElWeights[element] || 40.0;
        weight += guessedWeight * count;
      }
    }
    return hasMatched ? Number(weight.toFixed(3)) : 0;
  };

  const normalizePatternPeaks = (patternStr: string): string => {
    if (!patternStr) return '';
    const lines = patternStr.split('\n').map(l => l.trim()).filter(Boolean);
    const peaks: { angle: number; intensity: number; extra: string }[] = [];
    let maxIntensity = 0;
    for (const line of lines) {
      if (line.includes('(broad)')) {
        peaks.push({ angle: 0, intensity: 0, extra: line });
        continue;
      }
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const angle = parseFloat(parts[0]);
        const intensity = parseFloat(parts[1]);
        if (!isNaN(angle) && !isNaN(intensity)) {
          const extra = parts.slice(2).join(', ');
          peaks.push({ angle, intensity, extra });
          if (intensity > maxIntensity) {
            maxIntensity = intensity;
          }
        }
      }
    }
    if (peaks.length === 0) return patternStr;
    const scaleFactor = maxIntensity > 0 ? 100 / maxIntensity : 1;
    const normalizedLines = peaks.map(p => {
      if (p.angle === 0 && p.intensity === 0 && p.extra.includes('(broad)')) {
        return p.extra;
      }
      const normInt = Math.round(p.intensity * scaleFactor * 10) / 10;
      return p.extra ? `${p.angle}, ${normInt}, ${p.extra}` : `${p.angle}, ${normInt}`;
    });
    return normalizedLines.join('\n');
  };

  const handleRunAllRefinements = () => {
    setIsRefiningAll(true);
    setRefineProgress(0);
    setRefineSummary(null);
    
    let currentData = [...materials];
    
    // Stage counts
    let elementsSynced = 0;
    let stiffnessImputed = 0;
    let spaceGroupsNormalized = 0;
    let mwComputed = 0;
    let patternsNormalized = 0;
    let densitiesCalibrated = 0;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runPipeline = async () => {
      // Step 1: Initialize
      setRefineStageMsg("Initializing database connection & loading records...");
      setRefineProgress(10);
      await delay(600);

      // Step 2: Sync Chemical Elements to formula
      setRefineStageMsg("Stage 1: Scanning chemical formulas and synchronizing element arrays...");
      setRefineProgress(25);
      await delay(800);
      const regex = /[A-Z][a-z]?/g;
      currentData = currentData.map(m => {
        const formulaElements = m.formula ? Array.from(new Set(m.formula.match(regex) || [])) : [];
        const elementsList = m.elements || [];
        const needsSync = formulaElements.some(el => !elementsList.includes(el)) || elementsList.some(el => !formulaElements.includes(el));
        if (needsSync && formulaElements.length > 0) {
          elementsSynced++;
          return { ...m, elements: formulaElements };
        }
        return m;
      });

      // Step 3: Compute Molecular Weights
      setRefineStageMsg("Stage 2: Calculating precise molecular weights from empirical compositions...");
      setRefineProgress(45);
      await delay(800);
      currentData = currentData.map(m => {
        const computed = computeFormulaWeight(m.formula);
        const diff = Math.abs((m.molecularWeight || 0) - computed);
        if (computed > 0 && (!m.molecularWeight || m.molecularWeight <= 0 || diff > 0.5)) {
          mwComputed++;
          return { ...m, molecularWeight: computed };
        }
        return m;
      });

      // Step 4: Impute Mechanical Stiffness
      setRefineStageMsg("Stage 3: Classifying materials and imputing missing mechanical elastic modulus values...");
      setRefineProgress(60);
      await delay(800);
      currentData = currentData.map(m => {
        if (!m.elasticModulus || m.elasticModulus <= 0) {
          stiffnessImputed++;
          const cat = (m.type || '').toLowerCase();
          let est = 45; // Default ceramic
          if (cat.includes('metal') || cat.includes('alloy')) est = 140;
          if (cat.includes('polymer') || cat.includes('chitosan') || cat.includes('silk') || cat.includes('elastomer')) est = 2.5;
          if (cat.includes('perovskite') || cat.includes('conductor')) est = 30;
          if (cat.includes('biological') || cat.includes('protein') || cat.includes('crystallin')) est = 12;
          return { ...m, elasticModulus: est };
        }
        return m;
      });

      // Step 5: Normalize Space Groups & clean formatting
      setRefineStageMsg("Stage 4: Cleansing crystallographic space group syntax and symmetries...");
      setRefineProgress(75);
      await delay(700);
      currentData = currentData.map(m => {
        const rawGroup = m.spaceGroup || '';
        const trimmed = rawGroup.trim();
        const cleaned = trimmed.replace(/\s+/g, '');
        if (!trimmed) {
          spaceGroupsNormalized++;
          return { ...m, spaceGroup: 'P-1' };
        } else if (trimmed !== rawGroup || cleaned !== rawGroup) {
          spaceGroupsNormalized++;
          return { ...m, spaceGroup: cleaned };
        }
        return m;
      });

      // Step 6: Normalize pattern peaks to 100 relative standard
      setRefineStageMsg("Stage 5: Standardizing relative intensities for all XRD diffraction patterns...");
      setRefineProgress(85);
      await delay(900);
      currentData = currentData.map(m => {
        if (m.pattern) {
          const normPattern = normalizePatternPeaks(m.pattern);
          if (normPattern !== m.pattern) {
            patternsNormalized++;
            return { ...m, pattern: normPattern };
          }
        }
        return m;
      });

      // Step 7: Calibrate missing or anomalous densities
      setRefineStageMsg("Stage 6: Verifying structural density constraints and calibrating physical limits...");
      setRefineProgress(90);
      await delay(800);
      currentData = currentData.map(m => {
        const dens = m.density || 0;
        if (dens <= 0 || dens > 22.6) {
          densitiesCalibrated++;
          // High-grade estimation of physical density
          const mw = m.molecularWeight || computeFormulaWeight(m.formula) || 50;
          let atomicVolumeSum = 0;
          const cleanF = (m.formula || '').replace(/\s+/g, '');
          const elementRegex = /([A-Z][a-z]*)(\d*\.?\d*)?/g;
          let match;
          elementRegex.lastIndex = 0;
          while ((match = elementRegex.exec(cleanF)) !== null) {
            const el = match[1];
            const cnt = match[2] ? parseFloat(match[2]) : 1;
            const elWeight = ELEMENT_DETAILS[el]?.weight || 40;
            const singleAtomVol = elWeight > 100 ? 15 : elWeight > 50 ? 12 : 9;
            atomicVolumeSum += singleAtomVol * cnt;
          }
          if (atomicVolumeSum <= 0) atomicVolumeSum = 25;
          const estDensity = Number((mw / atomicVolumeSum * 1.3).toFixed(2));
          return { ...m, density: estDensity > 0 ? (estDensity > 22.5 ? 22.5 : estDensity) : 3.0 };
        }
        return m;
      });

      // Step 8: Calibrate thermodynamic properties
      setRefineStageMsg("Stage 7: Simulating thermodynamic solid-state stability and deriving formation energy curves...");
      setRefineProgress(98);
      await delay(800);
      let thermoRefined = 0;
      currentData = currentData.map(m => {
        const tPkg = calculateThermodynamics(m.formula, m.crystalSystem, m.molecularWeight);
        thermoRefined++;
        return {
          ...m,
          formationEnergy: m.formationEnergy !== undefined ? m.formationEnergy : tPkg.formationEnergy,
          standardEntropy: m.standardEntropy !== undefined ? m.standardEntropy : tPkg.standardEntropy,
          heatCapacity: m.heatCapacity !== undefined ? m.heatCapacity : tPkg.heatCapacity,
          debyeTemperature: m.debyeTemperature !== undefined ? m.debyeTemperature : tPkg.debyeTemperature,
          energyAboveHull: m.energyAboveHull !== undefined ? m.energyAboveHull : tPkg.energyAboveHull,
          stabilityStatus: m.stabilityStatus !== undefined ? m.stabilityStatus : tPkg.stabilityStatus,
          decompositionTemp: m.decompositionTemp !== undefined ? m.decompositionTemp : tPkg.decompositionTemp
        };
      });

      // Save Data
      setRefineStageMsg("Finalizing... Saving synchronized metadata package to the local warehouse...");
      setRefineProgress(100);
      await delay(600);
      saveMaterials(currentData);
      
      setRefineSummary({
        totalProcessed: currentData.length,
        elementsSynced,
        stiffnessImputed,
        spaceGroupsNormalized,
        mwComputed,
        patternsNormalized,
        densitiesCalibrated,
        thermoRefined
      });
      setIsRefiningAll(false);
    };

    runPipeline().catch(err => {
      console.error(err);
      setIsRefiningAll(false);
      setRefineStageMsg("Error occurred during database refinement.");
    });
  };

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

    // Apply Density Range Filter
    if (densityRange !== 'All') {
      list = list.filter(m => {
        const d = m.density;
        if (!d || typeof d !== 'number') return false;
        if (densityRange === 'Ultra-Light') return d < 1.5;
        if (densityRange === 'Light') return d >= 1.5 && d < 4.0;
        if (densityRange === 'Medium-Heavy') return d >= 4.0 && d < 8.0;
        if (densityRange === 'Ultra-Heavy') return d >= 8.0;
        return true;
      });
    }

    // Apply Elastic Modulus Range Filter
    if (elasticRange !== 'All') {
      list = list.filter(m => {
        const e = m.elasticModulus;
        if (!e || typeof e !== 'number') return false;
        if (elasticRange === 'Ultra-Soft') return e < 5;
        if (elasticRange === 'Soft') return e >= 5 && e < 30;
        if (elasticRange === 'Medium') return e >= 30 && e < 120;
        if (elasticRange === 'Ultra-Infinitely-Rigid') return e >= 120;
        return true;
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
  }, [materials, searchQuery, selectedCategory, selectedCrystalSystem, densityRange, elasticRange, sortBy, sortOrder]);

  // Current page records
  const paginatedMaterials = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMaterials.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedMaterials, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMaterials.length / itemsPerPage));

  // Reset page when queries change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCrystalSystem, densityRange, elasticRange, sortBy, sortOrder]);

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

  // Intrinsically calculate d-spacings and shifted peak positions based on radiation source
  const shiftedPeaks = useMemo(() => {
    const defaultLambda = 1.54059; // Reference wavelength of Cu-Ka (standard DB peaks)
    return parsedPeaks.map(p => {
      const thetaRefRad = (p.twoTheta / 2) * (Math.PI / 180);
      if (thetaRefRad <= 0) return null;
      const dSpacing = defaultLambda / (2 * Math.sin(thetaRefRad));
      
      const sinThetaNew = xrdWavelength / (2 * dSpacing);
      if (sinThetaNew > 1) return null; // Peak extinguishes
      const thetaNewRad = Math.asin(sinThetaNew);
      const twoThetaNew = (thetaNewRad * 180 / Math.PI) * 2;
      return {
        twoTheta: twoThetaNew,
        intensity: p.intensity,
        dSpacing
      };
    }).filter((p): p is {twoTheta: number; intensity: number; dSpacing: number} => p !== null);
  }, [parsedPeaks, xrdWavelength]);

  // Validation function for XRD peak lines
  const validatePatternString = (patternStr: string): boolean => {
    const lines = patternStr.split('\n').filter(l => l.trim());
    if (lines.length === 0) return true;
    for (const line of lines) {
      if (line.includes('(broad)')) continue;
      const parts = line.split(',');
      if (parts.length < 2) return false;
      const twoTheta = parseFloat(parts[0]);
      const intensity = parseFloat(parts[1]);
      if (isNaN(twoTheta) || isNaN(intensity)) return false;
      // Normal range checks for 2theta (e.g. 0 to 180 degrees)
      if (twoTheta < 0 || twoTheta > 180) return false;
      if (intensity < 0 || intensity > 1000) return false;
    }
    return true;
  };

  // Set up values for edit mode
  const handleStartEdit = () => {
    if (!selectedMaterial) return;
    setEditName(selectedMaterial.name);
    setEditFormula(selectedMaterial.formula || '');
    setEditCrystalSystem(selectedMaterial.crystalSystem || 'Cubic');
    setEditSpaceGroup(selectedMaterial.spaceGroup || '');
    setEditDensity(selectedMaterial.density?.toString() || '');
    setEditElasticModulus(selectedMaterial.elasticModulus?.toString() || '');
    setEditMolecularWeight(selectedMaterial.molecularWeight?.toString() || '');
    setEditDescription(selectedMaterial.description || '');
    setEditPattern(selectedMaterial.pattern || '');
    setEditApplications(selectedMaterial.applications || []);
    setNewAppText('');
    setEditError('');
    setIsCreating(false);
    setIsEditing(true);
  };

  // Set up value for custom creation mode
  const handleStartCreate = () => {
    setEditName('');
    setEditFormula('');
    setEditCrystalSystem('Cubic');
    setEditSpaceGroup('');
    setEditDensity('');
    setEditElasticModulus('');
    setEditMolecularWeight('');
    setEditDescription('');
    setEditPattern('');
    setEditApplications([]);
    setNewAppText('');
    setEditError('');
    setIsEditing(false);
    setIsCreating(true);
  };

  // Save changes to active material or create a new one
  const handleSaveEdit = () => {
    if (!isCreating && !selectedMaterial) return;

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
      name: editName.trim(),
      type: isCreating ? 'Custom Standard' : (selectedMaterial?.type || 'Custom Standard'),
      formula: editFormula.trim(),
      crystalSystem: editCrystalSystem.trim(),
      spaceGroup: editSpaceGroup.trim(),
      density: editDensity.trim() ? parseFloat(editDensity) : undefined,
      elasticModulus: editElasticModulus.trim() ? parseFloat(editElasticModulus) : undefined,
      molecularWeight: editMolecularWeight.trim() ? parseFloat(editMolecularWeight) : undefined,
      description: editDescription.trim(),
      pattern: editPattern.trim(),
      applications: editApplications,
      elements: formulaElements.length > 0 ? formulaElements : (selectedMaterial?.elements || [])
    };

    let next: any[];
    if (isCreating) {
      // Check for duplicate name
      if (materials.some(m => m.name.toLowerCase() === editName.trim().toLowerCase())) {
        setEditError(t('A material standard with this name already exists.', 'A material standard with this name already exists.'));
        return;
      }
      next = [updated, ...materials];
      setIsCreating(false);
    } else {
      next = materials.map(m => m.name === selectedMaterial?.name ? updated : m);
      setIsEditing(false);
    }

    saveMaterials(next);
    setSelectedMaterialName(updated.name);
  };

  // Delete a material with confirmation support
  const handleDeleteMaterial = (nameToDelete: string) => {
    if (window.confirm(t('Are you sure you want to delete this material standard from the database? This action is reversible by clicking "Reset DB Overrides & Restore standards".', 'Are you sure you want to delete this material standard from the database? This action is reversible by clicking "Reset DB Overrides & Restore standards".'))) {
      const remaining = materials.filter(m => m.name !== nameToDelete);
      saveMaterials(remaining);
      
      // Select another material
      if (selectedMaterialName === nameToDelete) {
        if (remaining.length > 0) {
          setSelectedMaterialName(remaining[0].name);
        } else {
          setSelectedMaterialName('');
        }
      }
      setIsEditing(false);
      setIsCreating(false);
    }
  };

  // Export full DB to custom local JSON file
  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(materials, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `all_materials_db_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Failed to export DB', e);
    }
  };

  // Import custom JSON standards list
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isValid = parsed.every(m => typeof m === 'object' && m !== null && 'name' in m && 'pattern' in m && 'formula' in m);
          if (isValid) {
            const merged = [...parsed];
            const importedNames = new Set(parsed.map(m => m.name.toLowerCase()));
            materials.forEach(m => {
              if (!importedNames.has(m.name.toLowerCase())) {
                merged.push(m);
              }
            });
            saveMaterials(merged);
            setSelectedMaterialName(parsed[0].name);
            alert(t('Database imported and merged successfully!', 'Database imported and merged successfully!'));
          } else {
            alert(t('Invalid database schema. Make sure every material has name, formula, and pattern fields.', 'Invalid database schema. Make sure every material has name, formula, and pattern fields.'));
          }
        } else {
          alert(t('Uploaded file is not a valid JSON array of materials.', 'Uploaded file is not a valid JSON array of materials.'));
        }
      } catch (err) {
        alert(t('Failed to parse the uploaded file as JSON.', 'Failed to parse the uploaded file as JSON.'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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

  // Mathematically projects and renders the 3D rotating Crystal Lattice system wireframe
  const renderCrystalLattice = (system: string) => {
    const norm = (system || '').toLowerCase();
    
    // Euler rotation angles based on spinTime
    const rotX = 0.40; // Fixed tilt on X to get standard isometric-like angle
    const rotY = spinTime; // Continuous rotation on Y
    
    // Helper projection function
    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      
      const scale = 52;
      return {
        x: 100 + x1 * scale,
        y: 100 + y2 * scale,
        z: z2
      };
    };

    let vertices: Array<[number, number, number]> = [];
    let edges: Array<[number, number]> = [];
    let title = "Standard Cubic";
    let desc = "a = b = c (α = β = γ = 90°)";

    if (norm.includes('cubic')) {
      title = "Cubic Lattice";
      desc = "a = b = c (α = β = γ = 90°)";
      vertices = [
        [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
        [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
      ];
      edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ];
    } else if (norm.includes('tetragonal')) {
      title = "Tetragonal Lattice";
      desc = "a = b ≠ c (α = β = γ = 90°)";
      vertices = [
        [-0.4, -0.7, -0.4], [0.4, -0.7, -0.4], [0.4, 0.7, -0.4], [-0.4, 0.7, -0.4],
        [-0.4, -0.7, 0.4], [0.4, -0.7, 0.4], [0.4, 0.7, 0.4], [-0.4, 0.7, 0.4]
      ];
      edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ];
    } else if (norm.includes('orthorhombic')) {
      title = "Orthorhombic Lattice";
      desc = "a ≠ b ≠ c (α = β = γ = 90°)";
      vertices = [
        [-0.3, -0.65, -0.48], [0.3, -0.65, -0.48], [0.3, 0.65, -0.48], [-0.3, 0.65, -0.48],
        [-0.3, -0.65, 0.48], [0.3, -0.65, 0.48], [0.3, 0.65, 0.48], [-0.3, 0.65, 0.48]
      ];
      edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ];
    } else if (norm.includes('hexagonal')) {
      title = "Hexagonal Polytype";
      desc = "a = b ≠ c (α = β = 90°, γ = 120°)";
      const topY = -0.65;
      const botY = 0.65;
      const r = 0.52;
      for (let i = 0; i < 6; i++) {
        const rad = (i * 60) * (Math.PI / 180);
        vertices.push([r * Math.cos(rad), topY, r * Math.sin(rad)]);
      }
      for (let i = 0; i < 6; i++) {
        const rad = (i * 60) * (Math.PI / 180);
        vertices.push([r * Math.cos(rad), botY, r * Math.sin(rad)]);
      }
      edges = [
        [0,1], [1,2], [2,3], [3,4], [4,5], [5,0],
        [6,7], [7,8], [8,9], [9,10], [10,11], [11,6],
        [0,6], [1,7], [2,8], [3,9], [4,10], [5,11]
      ];
    } else if (norm.includes('monoclinic')) {
      title = "Monoclinic Lattice";
      desc = "a ≠ b ≠ c (α = γ = 90°, β ≠ 120°)";
      const skew = 0.28;
      vertices = [
        [-0.32 - skew, -0.5, -0.42], [0.32 - skew, -0.5, -0.42], [0.32 + skew, 0.5, -0.42], [-0.32 + skew, 0.5, -0.42],
        [-0.32 - skew, -0.5, 0.42], [0.32 - skew, -0.5, 0.42], [0.32 + skew, 0.5, 0.42], [-0.32 + skew, 0.5, 0.42]
      ];
      edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ];
    } else if (norm.includes('triclinic')) {
      title = "Triclinic Lattice";
      desc = "a ≠ b ≠ c (α ≠ β ≠ γ ≠ 90°)";
      const hSkew = 0.25;
      const dSkew = 0.20;
      vertices = [
        [-0.3 - hSkew, -0.45, -0.4 - dSkew], [0.3 - hSkew, -0.45, -0.4 - dSkew], [0.3 + hSkew, 0.45, -0.4 + dSkew], [-0.3 + hSkew, 0.45, -0.4 + dSkew],
        [-0.3 - hSkew, -0.45, 0.4 - dSkew], [0.3 - hSkew, -0.45, 0.4 - dSkew], [0.3 + hSkew, 0.45, 0.4 + dSkew], [-0.3 + hSkew, 0.45, 0.4 + dSkew]
      ];
      edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ];
    } else if (norm.includes('trigonal') || norm.includes('rhombohedral')) {
      title = "Rhombohedral System";
      desc = "a = b = c (α = β = γ ≠ 90°)";
      const shear = 0.2;
      vertices = [
        [-0.4 - shear, -0.4 - shear, -0.4], [0.4 - shear, -0.4 - shear, -0.4], [0.4 + shear, 0.4 + shear, -0.4], [-0.4 + shear, 0.4 + shear, -0.4],
        [-0.4 - shear, -0.4 - shear, 0.4], [0.4 - shear, -0.4 - shear, 0.4], [0.4 + shear, 0.4 + shear, 0.4], [-0.4 + shear, 0.4 + shear, 0.4]
      ];
      edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ];
    } else {
      title = "Amorphous / Short-Range";
      desc = "Non-crystalline topology (Short range order)";
      const seedPoints = [
        [-0.32, -0.15, 0.22], [0.12, 0.38, -0.32], [-0.42, 0.28, -0.12], [0.32, -0.28, 0.12],
        [-0.08, -0.48, -0.18], [0.38, 0.18, 0.32], [-0.18, 0.08, 0.42], [0.18, -0.08, -0.32],
        [-0.42, -0.28, -0.38], [0.02, 0.12, -0.08], [0.28, 0.42, -0.08], [-0.15, -0.25, -0.25]
      ];
      vertices = seedPoints.map(([x,y,z], idx) => {
        const jiggle = Math.sin(rotY * 4.5 + idx) * 0.035;
        return [x + jiggle, y + jiggle, z + jiggle];
      });
      edges = [];
      for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
          const dx = vertices[i][0] - vertices[j][0];
          const dy = vertices[i][1] - vertices[j][1];
          const dz = vertices[i][2] - vertices[j][2];
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < 0.62) {
            edges.push([i, j]);
          }
        }
      }
    }

    const projected = vertices.map(v => project(v[0], v[1], v[2]));

    return (
      <div className="flex flex-col items-center justify-center p-5 bg-slate-950/70 rounded-2xl border border-slate-800/80 aspect-square relative max-w-[280px] mx-auto overflow-hidden">
        <div className="absolute top-3 left-3 flex flex-col gap-0.5">
          <span className="text-[10px] font-black uppercase text-indigo-400 font-mono tracking-tight">{title}</span>
          <span className="text-[8px] text-slate-500 font-mono tracking-wide">{desc}</span>
        </div>

        <svg className="w-48 h-48 mt-4" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(99,102,241,0.06)" strokeDasharray="3,5" />

          {/* Core definitions */}
          <defs>
            <radialGradient id="standardAtomGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#A5F3FC" />
              <stop offset="70%" stopColor="#0891B2" />
              <stop offset="100%" stopColor="#155E75" />
            </radialGradient>
            <radialGradient id="anchorAtomGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>
          </defs>

          {/* Draw Edges */}
          {edges.map(([p1, p2], idx) => {
            const v1 = projected[p1];
            const v2 = projected[p2];
            if (!v1 || !v2) return null;
            const avgZ = (v1.z + v2.z) / 2;
            const opacity = Math.max(0.15, Math.min(0.85, (avgZ + 1.2) / 2));
            return (
              <line
                key={`e-${idx}`}
                x1={v1.x.toFixed(1)}
                y1={v1.y.toFixed(1)}
                x2={v2.x.toFixed(1)}
                y2={v2.y.toFixed(1)}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeOpacity={opacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* Draw Atoms */}
          {projected.map((v, idx) => {
            const radius = Math.max(4.5, Math.min(9, 7.5 + v.z * 3));
            const opacity = Math.max(0.3, Math.min(1, (v.z + 1.2) / 2));
            const isAnchor = idx === 0;
            return (
              <g key={`v-${idx}`}>
                <circle
                  cx={v.x.toFixed(1)}
                  cy={v.y.toFixed(1)}
                  r={radius.toFixed(1)}
                  fill={isAnchor ? "url(#anchorAtomGrad)" : "url(#standardAtomGrad)"}
                  fillOpacity={opacity}
                />
                <circle
                  cx={v.x.toFixed(1)}
                  cy={v.y.toFixed(1)}
                  r={(radius + 1.5).toFixed(1)}
                  fill="none"
                  stroke={isAnchor ? "#F59E0B" : "#22D3EE"}
                  strokeOpacity={opacity * 0.4}
                  strokeWidth="0.8"
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 border border-slate-900/60 text-[7px] text-slate-500 font-mono uppercase tracking-widest select-none pointer-events-none">
          Rot X/Y: 23° / {(rotY * 180 / Math.PI).toFixed(1)}°
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-100">
      
      {/* 1. HERO DIRECTORY HEADER */}
      <div className="relative group p-8 sm:p-10 rounded-[3rem] bg-black/40 backdrop-blur-md border border-white/5 hover:border-indigo-500/30 transition-all shadow-2xl overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 opacity-50 z-[-1]" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 shadow-inner flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
            <Database className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-100 to-cyan-100 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              {t('Scientific Materials Registry', 'Scientific Materials Registry')}
            </h1>
            <p className="text-xs md:text-sm text-indigo-400/80 font-mono font-bold tracking-[0.2em] uppercase mt-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
              {t('Crystal Suite Database - Index 12.1.0', 'Crystal Suite Database - Index 12.1.0')}
            </p>
          </div>
        </div>

        {/* Global Inventory Counts Banner & Reset options */}
        <div className="flex gap-4 sm:gap-6 flex-wrap relative z-10 w-full md:w-auto mt-4 md:mt-0 items-center">
          <div className="flex-1 min-w-[120px] rounded-[1.5rem] bg-black/60 border border-white/5 shadow-inner px-5 py-4 text-center hover:border-indigo-500/30 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono tracking-tighter">{stats.totalCount}</span>
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mt-1">Standards</p>
          </div>
          <div className="flex-1 min-w-[120px] rounded-[1.5rem] bg-black/60 border border-white/5 shadow-inner px-5 py-4 text-center hover:border-cyan-500/30 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono tracking-tighter">{categories.length}</span>
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mt-1">Taxonomy</p>
          </div>
          <div className="flex-1 min-w-[120px] rounded-[1.5rem] bg-black/60 border border-white/5 shadow-inner px-5 py-4 text-center hover:border-emerald-500/30 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tighter">{stats.uniqueElements}</span>
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mt-1">Elements</p>
          </div>

          {/* Reset All Database Button */}
          {isAnyMaterialModified && (
            <button
              onClick={handleResetAllMaterials}
              className="flex items-center gap-2 px-6 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-2xl text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 shadow-inner w-full md:w-auto justify-center"
              title={t('Reset entire database overrides to standard defaults', 'Reset entire database overrides to standard defaults')}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset DB Override</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ANALYTICS & DISTRIBUTION METRICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category breakdown progress meter */}
        <div className="lg:col-span-7 bg-black/40 backdrop-blur-md border border-white/5 hover:border-indigo-500/20 transition-all p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between group z-0">
          <div className="absolute top-0 right-0 p-32 opacity-[0.03] bg-gradient-to-bl from-indigo-400 to-purple-400 rounded-bl-[100px] pointer-events-none group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 z-[-1]" />
          <div className="relative z-10">
            <h3 className="font-black text-slate-200 text-sm tracking-widest uppercase mb-6 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              Taxonomy Category Breakdown
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
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
                  <div key={name} className="space-y-2 group/item">
                    <div className="flex justify-between items-center text-[11px] uppercase tracking-wider">
                      <span className="font-bold text-slate-400 group-hover/item:text-slate-200 transition-colors flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${bc} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                        {name}
                      </span>
                      <span className="font-mono text-slate-500 font-bold bg-black/40 px-2 py-0.5 rounded shadow-inner">
                        <span className={tc}>{count}</span> <span className="text-[9px]">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className={`h-full rounded-full ${bc} opacity-80 group-hover/item:opacity-100 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} 
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
          <div className="bg-black/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/20 transition-all p-8 rounded-[3rem] shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden group z-0">
             <div className="absolute top-0 right-0 p-24 opacity-[0.03] bg-gradient-to-bl from-cyan-400 to-blue-400 rounded-bl-[100px] pointer-events-none group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 z-[-1]" />
            <div className="relative z-10">
              <h3 className="font-black text-slate-200 text-sm tracking-widest uppercase mb-6 flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-inner">
                  <Box className="w-5 h-5 text-cyan-400" />
                </div>
                Crystal System Distribution
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.systemDistribution.slice(0, 6).map(({ name, count }) => {
                  const percent = ((count / stats.totalCount) * 100).toFixed(1);
                  return (
                    <div key={name} className="p-4 rounded-2xl bg-black/60 border border-white/5 hover:border-cyan-500/20 flex flex-col justify-between shadow-inner transition-colors group/sys">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover/sys:text-slate-300 transition-colors">{name}</span>
                      <div className="flex justify-between items-baseline mt-3">
                        <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 font-mono leading-none">{count}</span>
                        <span className="text-[9px] font-mono text-cyan-500/50 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Density metrics/stats extreme */}
          <div className="bg-black/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/20 transition-all p-6 rounded-[2.5rem] shadow-2xl flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-inner flex items-center justify-center p-3">
                <Compass className="w-full h-full text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">Database Density Extremes</h4>
                <p className="text-sm text-emerald-300 font-bold max-w-[200px] truncate" title={stats.maxDensity.mat}>
                  {stats.maxDensity.mat || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right pl-4 border-l border-white/5">
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 font-mono leading-none">{stats.maxDensity.val || '0.0'}</span>
              <p className="text-[9px] uppercase text-slate-500 font-mono font-bold tracking-widest mt-1">g/cm³ (Max)</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. SEARCH, FILTERS & MATERIAL LIST SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FILTERS & DIRECTORY PAGED LIST */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-black/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col gap-5 relative z-20 hover:border-indigo-500/20 transition-colors">
            
            {/* Direct Search Input with Custom Standard Add option */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t("Search by formula, standard name, elements (e.g. 'Fe'), crystal systems...", "Search by formula, standard name, elements (e.g. 'Fe'), crystal systems...")}
                  className="w-full pl-14 pr-12 py-3.5 bg-black/60 backdrop-blur border border-white/10 text-slate-100 outline-none rounded-2xl focus:border-indigo-500/50 focus:bg-indigo-950/20 focus:ring-1 focus:ring-indigo-500/30 placeholder:text-slate-600 transition-all text-xs font-mono shadow-inner select-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400 focus:outline-none transition-colors p-1"
                    title="Clear query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={handleStartCreate}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/50 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer whitespace-nowrap h-[46px] select-none"
                title={t('Create a novel custom standard to index in the database', 'Create a novel custom standard to index in the database')}
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Custom Std</span>
              </button>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Taxonomy Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 shadow-inner text-slate-300 outline-none rounded-xl text-[11px] font-mono font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crystal System Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Crystal Lattice System</label>
                <select
                  value={selectedCrystalSystem}
                  onChange={e => setSelectedCrystalSystem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 shadow-inner text-slate-300 outline-none rounded-xl text-[11px] font-mono font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
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
              <div className="col-span-2 md:col-span-1 flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Sort Metric</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 shadow-inner text-slate-300 outline-none rounded-xl text-[11px] font-mono font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                >
                  <option value="name">Chemical Name</option>
                  <option value="density">Density</option>
                  <option value="molecularWeight">Molecular Weight</option>
                  <option value="elasticModulus">Elastic Modulus</option>
                </select>
              </div>

            </div>

            {/* Advanced Filters Toggles */}
            <div className="flex gap-3 items-center flex-wrap pt-4 border-t border-white/5">
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 font-black tracking-widest uppercase rounded-xl transition-colors cursor-pointer text-[10px] leading-none"
              >
                <Sliders className="w-4 h-4" />
                <span>{showAdvancedFilters ? t('Hide Advanced Limits', 'Hide Advanced Limits') : t('Advanced Range Filters', 'Advanced Range Filters')}</span>
              </button>

              <button 
                onClick={() => {
                  setShowCurationTools(!showCurationTools);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-black tracking-widest uppercase rounded-xl transition-colors cursor-pointer text-[10px] leading-none"
              >
                <FlaskConical className="w-4 h-4 animate-pulse" />
                <span>{showCurationTools ? t('Hide DB Curation', 'Hide DB Curation') : t('Audit & Refine DB', 'Audit & Refine DB')}</span>
              </button>
            </div>

            {/* Advanced Range Filters Sub-Drawer */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-2 gap-4 p-5 bg-black/40 rounded-2xl border border-white/5 shadow-inner mt-2 animate-in fade-in slide-in-from-top-1.5 duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Density Threshold</label>
                  <select
                    value={densityRange}
                    onChange={e => setDensityRange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 shadow-inner text-slate-300 outline-none rounded-xl text-[11px] font-mono font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                  >
                    <option value="All">All Densities (No limit)</option>
                    <option value="Ultra-Light">Ultra-Light (&lt; 1.5 g/cm³)</option>
                    <option value="Light">Light (1.5 to 4.0 g/cm³)</option>
                    <option value="Medium-Heavy">Medium-Heavy (4.0 to 8.0 g/cm³)</option>
                    <option value="Ultra-Heavy">Ultra-Heavy (≥ 8.0 g/cm³)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Mechanical Stiffness</label>
                  <select
                    value={elasticRange}
                    onChange={e => setElasticRange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 shadow-inner text-slate-300 outline-none rounded-xl text-[11px] font-mono font-bold cursor-pointer hover:border-indigo-500/30 transition-colors"
                  >
                    <option value="All">All Stiffness Levels</option>
                    <option value="Ultra-Soft">Ultra-Soft (&lt; 5 GPa)</option>
                    <option value="Soft">Soft (5 to 30 GPa)</option>
                    <option value="Medium">Medium (30 to 120 GPa)</option>
                    <option value="Ultra-Infinitely-Rigid">Ultra-Rigid (≥ 120 GPa)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Curation & Database Refiner Area */}
            {showCurationTools && (
              <div className="p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl shadow-inner mt-2 space-y-5 animate-in fade-in slide-in-from-top-1.5 duration-200">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <span className="text-xs uppercase font-black tracking-widest text-[#10b981] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Database Refiner & Curation Panel
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportJSON}
                      className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-[9px] font-mono text-indigo-300 font-bold rounded-lg cursor-pointer transition-all"
                      title={t('Export whole database as a custom JSON standard deck', 'Export whole database as a custom JSON standard deck')}
                    >
                      Export DB JSON
                    </button>
                    
                    <label className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold rounded-lg cursor-pointer transition-all text-center">
                      <span>Import JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <p className="text-[10px] font-sans text-slate-300 leading-relaxed">
                  Analyze inconsistencies across all <strong>{materials.length}</strong> loaded materials. Run a multi-stage refinery cycle to automatically calculate missing parameters, synchronize elements, scale intensities, and align space groups.
                </p>

                {/* Database Refinement Centerpiece */}
                {isRefiningAll ? (
                  <div className="p-4 bg-black/45 border border-emerald-500/30 rounded-xl space-y-3.5 text-center animate-pulse">
                    <div className="flex justify-center items-center gap-2">
                      <Atom className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="font-mono text-[10px] font-extrabold text-white tracking-widest uppercase">
                        Running Database Refinement ({refineProgress}%)
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${refineProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                    
                    <p className="text-[9px] font-mono font-bold text-slate-300 tracking-wide">
                      ⚡ {refineStageMsg}
                    </p>
                  </div>
                ) : refineSummary ? (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4 bg-emerald-500 text-slate-950 p-0.5 rounded-full" />
                        Refinement Cycle Completed Successfully
                      </span>
                      <button 
                        onClick={() => setRefineSummary(null)} 
                        className="text-slate-500 hover:text-slate-300 transition-colors text-[9px] font-mono font-bold"
                      >
                        [Dismiss]
                      </button>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 font-mono text-[9px] text-slate-300 pt-1">
                      <div className="p-2 bg-black/40 border border-emerald-950 rounded-lg">
                        <span className="block text-[7.5px] font-bold text-slate-500 uppercase">Processed</span>
                        <span className="font-extrabold text-white text-xs">{refineSummary.totalProcessed} units</span>
                      </div>
                      <div className="p-2 bg-black/40 border border-emerald-950 rounded-lg">
                        <span className="block text-[7.5px] font-bold text-slate-500 uppercase">Atomic Synced</span>
                        <span className="font-extrabold text-emerald-400 text-xs">+{refineSummary.elementsSynced}</span>
                      </div>
                      <div className="p-2 bg-black/40 border border-emerald-950 rounded-lg">
                        <span className="block text-[7.5px] font-bold text-slate-500 uppercase">Weight Derived</span>
                        <span className="font-extrabold text-indigo-400 text-xs">+{refineSummary.mwComputed}</span>
                      </div>
                      <div className="p-2 bg-black/40 border border-emerald-950 rounded-lg">
                        <span className="block text-[7.5px] font-bold text-slate-500 uppercase">Stiffness Imputed</span>
                        <span className="font-extrabold text-cyan-400 text-xs">+{refineSummary.stiffnessImputed}</span>
                      </div>
                      <div className="p-2 bg-black/40 border border-emerald-950 rounded-lg">
                        <span className="block text-[7.5px] font-bold text-slate-500 uppercase">Symmetries Cleaned</span>
                        <span className="font-extrabold text-amber-400 text-xs">+{refineSummary.spaceGroupsNormalized}</span>
                      </div>
                      <div className="p-2 bg-black/40 border border-emerald-950 rounded-lg">
                        <span className="block text-[7.5px] font-bold text-slate-500 uppercase">XRD Normalized</span>
                        <span className="font-extrabold text-pink-400 text-xs">+{refineSummary.patternsNormalized}</span>
                      </div>
                      <div className="p-2 col-span-2 xs:col-span-3 bg-black/40 border border-emerald-950 rounded-lg flex justify-between items-center">
                        <span className="text-[7.5px] text-slate-500 font-bold uppercase">Theoretical Density Calibration</span>
                        <span className="font-extrabold text-teal-400 text-[10px]">+{refineSummary.densitiesCalibrated} bounds fixed</span>
                      </div>
                      <div className="p-2 col-span-2 xs:col-span-3 bg-black/40 border border-emerald-950 rounded-lg flex justify-between items-center">
                        <span className="text-[7.5px] text-slate-500 font-bold uppercase">Thermodynamic & Stability Refined</span>
                        <span className="font-extrabold text-amber-400 text-[10px]">+{refineSummary.thermoRefined} profiles updated</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Full Stage Refinement Launch Button */}
                    <button
                      onClick={handleRunAllRefinements}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-emerald-500/30 hover:border-emerald-500/50 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.15)] cursor-pointer transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98]"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse group-hover:scale-110 transition-transform" />
                      Run Multi-Stage Database Refinement Cycle
                    </button>

                    {/* Audit Health Cards */}
                    <div className="grid grid-cols-2 gap-3 font-mono text-[9px] text-slate-400">
                      <div className="p-2.5 rounded-lg bg-black/40 border border-slate-900">
                        <span className="block font-bold text-slate-500 uppercase text-[8px]">Elements Mismatches</span>
                        <span className="text-white font-extrabold mt-0.5 block text-xs">
                          {materials.filter(m => {
                            const regex = /[A-Z][a-z]?/g;
                            const formulaElements = m.formula ? Array.from(new Set(m.formula.match(regex) || [])) : [];
                            const elementsList = m.elements || [];
                            return formulaElements.some(el => !elementsList.includes(el)) || elementsList.some(el => !formulaElements.includes(el));
                          }).length} Units
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-slate-900">
                        <span className="block font-bold text-slate-500 uppercase text-[8px]">Missing Stiffness Index</span>
                        <span className="text-white font-extrabold mt-0.5 block text-xs">
                          {materials.filter(m => !m.elasticModulus || m.elasticModulus <= 0).length} Sheets
                        </span>
                      </div>
                    </div>

                    {/* Granular Manual Tools Header */}
                    <div className="pt-2 border-t border-slate-900/50 flex flex-col gap-1.5">
                      <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 text-center">Or Apply Granular Manual Corrections</span>
                      
                      <div className="flex gap-2 flex-wrap justify-between">
                        <button
                          onClick={() => {
                            const regex = /[A-Z][a-z]?/g;
                            const next = materials.map(m => {
                              const formulaElements = m.formula ? Array.from(new Set(m.formula.match(regex) || [])) : [];
                              return {
                                ...m,
                                elements: formulaElements.length > 0 ? formulaElements : m.elements
                              };
                            });
                            saveMaterials(next);
                            alert(t('Chemical Elements have been auto-synchronized for all materials based on their formulas!', 'Chemical Elements have been auto-synchronized for all materials based on their formulas!'));
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-sans font-bold text-emerald-300 rounded-lg cursor-pointer transition-colors text-center"
                        >
                          Sync Elements
                        </button>

                        <button
                          onClick={() => {
                            const next = materials.map(m => {
                              if (!m.elasticModulus || m.elasticModulus <= 0) {
                                const cat = (m.type || '').toLowerCase();
                                let est = 45; // Default ceramic
                                if (cat.includes('metal') || cat.includes('alloy')) est = 140;
                                if (cat.includes('polymer') || cat.includes('chitosan') || cat.includes('silk') || cat.includes('elastomer')) est = 2.5;
                                if (cat.includes('perovskite') || cat.includes('conductor')) est = 30;
                                if (cat.includes('biological') || cat.includes('protein') || cat.includes('crystallin')) est = 12;
                                return { ...m, elasticModulus: est };
                              }
                              return m;
                            });
                            saveMaterials(next);
                            alert(t('Missing mechanical stiffness data has been auto-imputed using taxonomy averages!', 'Missing mechanical stiffness data has been auto-imputed using taxonomy averages!'));
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-sans font-bold text-cyan-300 rounded-lg cursor-pointer transition-colors text-center"
                        >
                          Impute Stiffness
                        </button>

                        <button
                          onClick={() => {
                            const next = materials.map(m => {
                              if (!m.spaceGroup || m.spaceGroup.trim() === '') {
                                return { ...m, spaceGroup: 'P-1' };
                              }
                              return { ...m, spaceGroup: m.spaceGroup.trim().replace(/\s+/g, '') };
                            });
                            saveMaterials(next);
                            alert(t('Missing space groups have been normalized and cleaned!', 'Missing space groups have been normalized and cleaned!'));
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[9px] font-sans font-bold text-amber-300 rounded-lg cursor-pointer transition-colors text-center"
                        >
                          Clean Space Groups
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sort order Toggle details & Grid/Table Switch */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
              <span>Found <span className="font-bold text-indigo-400 font-mono">{filteredAndSortedMaterials.length}</span> matching materials</span>
              
              <div className="flex items-center gap-3">
                {/* View Mode Segmented Control */}
                <div className="flex bg-black/60 p-0.5 rounded-lg border border-slate-800/80">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600/95 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Grid View Cards"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1 rounded-md transition-colors ${viewMode === 'table' ? 'bg-indigo-600/95 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Crystallographic Table View"
                  >
                    <Columns className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button 
                  onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                  className="hover:text-indigo-400 font-bold transition-all underline decoration-dotted capitalize"
                >
                  Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </div>
          </div>

          {/* Directory Materials List Container */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-indigo-950/20' 
                  : 'border-white/5 hover:border-indigo-500/30 bg-black/40 hover:bg-black/60';

                const indicatorBadgeTheme: any = {
                  amber: 'text-amber-300 bg-amber-500/20 border-amber-500/30 text-shadow-amber',
                  blue: 'text-blue-300 bg-blue-500/20 border-blue-500/30 text-shadow-blue',
                  cyan: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30 text-shadow-cyan',
                  fuchsia: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/30 text-shadow-fuchsia',
                  rose: 'text-rose-300 bg-rose-500/20 border-rose-500/30 text-shadow-rose',
                  orange: 'text-orange-300 bg-orange-500/20 border-orange-500/30 text-shadow-orange',
                  yellow: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30 text-shadow-yellow',
                  emerald: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30 text-shadow-emerald',
                  violet: 'text-violet-300 bg-violet-500/20 border-violet-500/30 text-shadow-violet',
                  purple: 'text-purple-300 bg-purple-500/20 border-purple-500/30 text-shadow-purple',
                  teal: 'text-teal-300 bg-teal-500/20 border-teal-500/30 text-shadow-teal',
                  slate: 'text-slate-300 bg-slate-800/50 border-slate-700/50'
                };

                const countOfPeaks = material.pattern.split('\n').filter(p=>p.trim()).length;

                return (
                  <div
                    key={material.name}
                    onClick={() => {
                      setSelectedMaterialName(material.name);
                      setIsEditing(false); // Close edit mode on change
                    }}
                    className={`group relative p-5 rounded-[2rem] cursor-pointer transition-all duration-500 flex flex-col justify-between backdrop-blur-sm border hover:shadow-2xl overflow-hidden ${activeBorderColor}`}
                  >
                    {/* Top decoration line for selected */}
                    {isSelected && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />}
                    
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-[30px] group-hover:bg-indigo-500/10 transition-all duration-700 pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg inline-flex items-center w-fit border shadow-inner ${indicatorBadgeTheme[themeColor] || indicatorBadgeTheme.slate}`}>
                            {material.type || 'Custom'}
                          </span>
                          <span className="text-base font-black text-slate-100 flex items-center gap-2 mt-2 truncate max-w-[180px] drop-shadow-md group-hover:text-indigo-200 transition-colors" title={material.name}>
                            {isItemModified && (
                              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse inline-block shrink-0" title="Has manual overrides" />
                            )}
                            {material.name}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <span className="text-[11px] text-cyan-300 font-bold bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/10 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                            {material.formula}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 bg-black/20 p-3 rounded-2xl border border-white/5 font-mono">
                        <div className="flex flex-col gap-1 text-center border-r border-white/5 pr-3">
                          <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Crystal System</span>
                          <span className="text-[11px] font-bold text-slate-300 truncate rounded">{material.crystalSystem || 'Crystalline'}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-center pl-3">
                          <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Space Group</span>
                          <span className="text-[11px] text-indigo-300 font-bold">{material.spaceGroup || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-500 relative z-10">
                      <span className="flex items-center gap-2 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        ρ: <span className="text-emerald-400 font-bold ml-0.5">{material.density ? material.density.toFixed(2) : '-'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                        <Activity className="w-3.5 h-3.5 text-indigo-400/70" /> 
                        <span className="text-indigo-400 font-black">{countOfPeaks}</span> <span className="text-[8px] uppercase tracking-widest text-slate-500">Peaks</span>
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
          ) : (
            <div className="overflow-x-auto bg-black/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] shadow-2xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-indigo-500/5 text-slate-400 select-none">
                    <th className="py-4 px-6 font-black uppercase tracking-[0.2em] text-[9px] w-5/12">Formula & Name</th>
                    <th className="py-4 px-4 font-black uppercase tracking-[0.2em] text-[9px]">Lattice System</th>
                    <th className="py-4 px-4 font-black uppercase tracking-[0.2em] text-[9px] text-right">Density (g/cm³)</th>
                    <th className="py-4 px-4 font-black uppercase tracking-[0.2em] text-[9px] text-right">Modulus (GPa)</th>
                    <th className="py-4 px-6 font-black uppercase tracking-[0.2em] text-[9px] text-center">XRD Peaks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedMaterials.map((material) => {
                    const isSelected = selectedMaterialName === material.name;
                    const countOfPeaks = material.pattern.split('\n').filter(p=>p.trim()).length;
                    return (
                      <tr
                        key={material.name}
                        onClick={() => {
                          setSelectedMaterialName(material.name);
                          setIsEditing(false);
                        }}
                        className={`cursor-pointer transition-all duration-300 group hover:bg-white/5 text-slate-300 ${isSelected ? 'bg-indigo-500/10 text-indigo-100 font-bold shadow-inner' : 'bg-transparent'}`}
                      >
                        <td className="py-4 px-6 relative">
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
                          <div className="font-extrabold flex items-center gap-3 font-sans text-xs">
                            <span className="text-[10px] text-cyan-300 font-mono font-bold bg-black/60 px-2 py-1 rounded-lg border border-white/10 group-hover:border-cyan-500/30 transition-colors shadow-inner">
                              {material.formula}
                            </span>
                            <span className="truncate max-w-[180px] drop-shadow-md group-hover:text-white transition-colors" title={material.name}>{material.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-200 font-sans text-[11px] font-bold">{material.crystalSystem || 'N/A'}</div>
                          <div className="text-[9px] text-indigo-300 font-mono tracking-wider mt-1">{material.spaceGroup || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-emerald-400 font-bold text-xs">
                          {material.density ? material.density.toFixed(2) : '-'}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-amber-400 font-bold text-xs">
                          {material.elasticModulus || '-'}
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-black text-indigo-400 text-xs">
                          {countOfPeaks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredAndSortedMaterials.length === 0 && (
                <div className="py-20 text-center text-slate-500 space-y-3">
                  <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] font-mono">No matching standards found</p>
                </div>
              )}
            </div>
          )}

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
              
              {isCreating ? (
                
                /* ================= CREATE NOVEL STANDARD MODE ================= */
                <div className="space-y-5 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-extrabold text-white text-sm tracking-tight">
                        {t('Create Novel Material Standard', 'Create Novel Material Standard')}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title={t('Cancel creation', 'Cancel creation')}
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
                        placeholder="e.g. Cobalt Antimonide (CoSb3 Skutterudite)"
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
                          placeholder="e.g. CoSb3"
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
                          placeholder="e.g. Im-3"
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
                          placeholder="e.g. 7.64"
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
                          placeholder="e.g. 138"
                        />
                      </div>

                      {/* Molecular Weight */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Molecular Weight (g/mol)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editMolecularWeight}
                          onChange={e => setEditMolecularWeight(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors font-mono"
                          placeholder="e.g. 424.18"
                        />
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
                        placeholder="Format: 2theta, Intensity&#10;e.g.&#10;15.2, 50&#10;24.8, 100&#10;36.1, 75"
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
                      <Plus className="w-4 h-4" />
                      <span>Create Standard</span>
                    </button>
                    
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

              ) : !selectedMaterial ? (
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

                      {/* Molecular Weight */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Molecular Weight (g/mol)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editMolecularWeight}
                          onChange={e => setEditMolecularWeight(e.target.value)}
                          className="w-full bg-black/60 border border-slate-800 text-xs px-3 py-2 text-white outline-none rounded-lg focus:border-indigo-500 transition-colors font-mono"
                          placeholder="e.g. 270.03"
                        />
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
                    
                    <div className="flex gap-2 flex-wrap justify-end">
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

                      <button
                        onClick={() => handleDeleteMaterial(selectedMaterial.name)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-200"
                        title={t('Delete this standard sheet', 'Delete this standard sheet')}
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Delete</span>
                      </button>
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

                  {/* Core Telemetry Grid (Always Visible) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                    <div className="p-2.5 bg-black/45 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Space Group</span>
                      <span className="text-[11px] block text-indigo-300 font-black mt-1 uppercase truncate">
                        {selectedMaterial.spaceGroup || 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/45 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Crystal System</span>
                      <span className="text-[11px] block text-slate-200 mt-1 uppercase font-extrabold truncate" title={selectedMaterial.crystalSystem}>
                        {selectedMaterial.crystalSystem || 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/45 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Density</span>
                      <span className="text-[11px] block text-emerald-400 font-extrabold mt-1">
                        {selectedMaterial.density ? `${selectedMaterial.density} g/cm³` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/45 border border-slate-800/60 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Elastic Modulus</span>
                      <span className="text-[11px] block text-amber-500 font-extrabold mt-1">
                        {selectedMaterial.elasticModulus ? `${selectedMaterial.elasticModulus} GPa` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Scientific Tabs Switcher */}
                  <div className="border-b border-slate-800/80 flex gap-2">
                    <button
                      onClick={() => setActiveDetailTab('spectrum')}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'spectrum' ? 'border-cyan-500 text-cyan-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      📊 Analyzed XRD Spectrum
                    </button>
                    <button
                      onClick={() => setActiveDetailTab('lattice')}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'lattice' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      💎 Lattice Unit Cell
                    </button>
                    <button
                      onClick={() => setActiveDetailTab('composition')}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'composition' ? 'border-amber-500 text-amber-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      🧪 Composition & Roles
                    </button>
                    <button
                      onClick={() => setActiveDetailTab('thermo')}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${activeDetailTab === 'thermo' ? 'border-orange-500 text-orange-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      🔥 Thermodynamics & Stability
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="space-y-4">
                    {activeDetailTab === 'spectrum' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Parameter Controls Panel */}
                        <div className="p-3 bg-black/35 border border-slate-800/50 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Anode select */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Diffractometer Source (Anode)</label>
                            <select
                              value={xrdWavelength}
                              onChange={e => setXrdWavelength(parseFloat(e.target.value))}
                              className="w-full bg-[#050B14]/80 px-2 py-1.5 border border-slate-800 text-[10px] font-bold text-slate-300 outline-none rounded-lg cursor-pointer"
                            >
                              <option value={1.54059}>Cu-Kα (λ = 1.5406 Å)</option>
                              <option value={0.71073}>Mo-Kα (λ = 0.7107 Å)</option>
                              <option value={1.78896}>Co-Kα (λ = 1.7890 Å)</option>
                              <option value={1.93604}>Fe-Kα (λ = 1.9360 Å)</option>
                            </select>
                          </div>

                          {/* Broadening slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Grain Broadening (FWHM)</label>
                              <span className="text-[8px] text-cyan-400 font-mono font-bold">{xrdFwhm.toFixed(2)}° 2θ</span>
                            </div>
                            <input
                              type="range"
                              min={0.15}
                              max={1.0}
                              step={0.05}
                              value={xrdFwhm}
                              onChange={e => setXrdFwhm(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                          </div>
                        </div>

                        {/* Interactive Continuous Diffractogram Plot */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                            <span>Intensity Trace</span>
                            <span className="text-[8px] text-slate-500">Min 2θ: 10° | Max 2θ: 90°</span>
                          </div>

                          <div className="relative h-44 w-full bg-[#030712] rounded-xl border border-slate-900 overflow-hidden">
                            {/* Grid markers */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none text-slate-900">
                              <line x1="0%" y1="20%" x2="100%" y2="20%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
                              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
                              <line x1="0%" y1="80%" x2="100%" y2="80%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
                              <line x1="25%" y1="0" x2="25%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
                              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
                              <line x1="75%" y1="0" x2="75%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
                            </svg>

                            {/* Spectrum curve paths */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 180" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="xrdSpectrumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
                                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.00" />
                                </linearGradient>
                              </defs>
                              
                              {/* Filled continuous curve area */}
                              <path 
                                d={(() => {
                                  // Live compute continuous Area path inside SVG bounds
                                  const steps = 240;
                                  const min2Theta = 10;
                                  const max2Theta = 90;
                                  const sigma = xrdFwhm / 2.35482;
                                  let path = "M 0,180 ";
                                  for (let i = 0; i <= steps; i++) {
                                    const twoTheta = min2Theta + (i / steps) * (max2Theta - min2Theta);
                                    let intensity = 0;
                                    shiftedPeaks.forEach(p => {
                                      const diff = twoTheta - p.twoTheta;
                                      intensity += p.intensity * Math.exp(-(diff * diff) / (2 * sigma * sigma));
                                    });
                                    const baseline = 2 * Math.exp(-twoTheta / 35);
                                    const pseudoNoise = (Math.sin(twoTheta * 5) * 0.4 + Math.sin(twoTheta * 17) * 0.2 + (Math.sin(twoTheta * 97) * 0.1));
                                    const finalVal = Math.min(100, Math.max(0, intensity + baseline + pseudoNoise + 1));
                                    const x = (i / steps) * 100;
                                    const y = 180 - (finalVal / 100) * 145;
                                    path += `L ${x.toFixed(1)},${y.toFixed(1)} `;
                                  }
                                  path += "L 100,180 Z";
                                  return path;
                                })()} 
                                fill="url(#xrdSpectrumGradient)" 
                              />

                              {/* Crisp glowing line path */}
                              <path 
                                d={(() => {
                                  const steps = 240;
                                  const min2Theta = 10;
                                  const max2Theta = 90;
                                  const sigma = xrdFwhm / 2.35482;
                                  let path = "";
                                  for (let i = 0; i <= steps; i++) {
                                    const twoTheta = min2Theta + (i / steps) * (max2Theta - min2Theta);
                                    let intensity = 0;
                                    shiftedPeaks.forEach(p => {
                                      const diff = twoTheta - p.twoTheta;
                                      intensity += p.intensity * Math.exp(-(diff * diff) / (2 * sigma * sigma));
                                    });
                                    const baseline = 2 * Math.exp(-twoTheta / 35);
                                    const pseudoNoise = (Math.sin(twoTheta * 5) * 0.4 + Math.sin(twoTheta * 17) * 0.2 + (Math.sin(twoTheta * 97) * 0.1));
                                    const finalVal = Math.min(100, Math.max(0, intensity + baseline + pseudoNoise + 1));
                                    const x = (i / steps) * 100;
                                    const y = 180 - (finalVal / 100) * 145;
                                    path += (i === 0 ? "M " : "L ") + `${x.toFixed(1)},${y.toFixed(1)} `;
                                  }
                                  return path;
                                })()} 
                                fill="none" 
                                stroke="#22d3ee" 
                                strokeWidth="2" 
                              />
                            </svg>

                            {/* Individual peak reference points */}
                            <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                              {shiftedPeaks.map((p, idx) => {
                                const minTheta = 10;
                                const maxTheta = 90;
                                const percentX = Math.max(0, Math.min(100, ((p.twoTheta - minTheta) / (maxTheta - minTheta)) * 100));
                                return (
                                  <div 
                                    key={idx}
                                    style={{ left: `${percentX}%` }}
                                    className="absolute bottom-6 top-0 group/pmark w-0 rounded-full"
                                  >
                                    {/* Vertical dashed line marking structural peak position */}
                                    <div className="absolute inset-y-0 w-[1px] border-l border-dashed border-cyan-500/10 group-hover/pmark:border-cyan-500/50" />
                                    
                                    {/* Live Peak metadata flag */}
                                    <div className="absolute bottom-[20%] left-0 -translate-x-1/2 p-1.5 rounded-md bg-[#020617]/90 border border-indigo-500/20 text-[7px] font-mono whitespace-nowrap opacity-0 group-hover/pmark:opacity-100 transition-opacity z-10 shadow-xl">
                                      {p.twoTheta.toFixed(3)}° (Int: {p.intensity.toFixed(1)}%)
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Tick values */}
                            <div className="absolute bottom-0 inset-x-0 h-5 bg-black/85 border-t border-slate-900 flex justify-between px-3 items-center text-[8px] font-mono text-slate-500 select-none">
                              <span>10° 2θ</span>
                              <span>30°</span>
                              <span>50°</span>
                              <span>70°</span>
                              <span>90° 2θ</span>
                            </div>
                          </div>
                        </div>

                        {/* Peak Bragg Spacing Table */}
                        <div className="space-y-1.5 font-mono">
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Simulated Multi-Plane Reflections & spacings</span>
                          <div className="max-h-32 overflow-y-auto border border-slate-900 rounded-xl bg-black/25 custom-scrollbar text-[10px] font-mono">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-900 bg-slate-950/20 text-slate-400 sticky top-0">
                                  <th className="py-2 px-3 text-[9px] uppercase font-bold text-slate-500">2-Theta Angle</th>
                                  <th className="py-2 px-3 text-right text-[9px] uppercase font-bold text-slate-500">d-Spacing (Å)</th>
                                  <th className="py-2 px-3 text-right text-[9px] uppercase font-bold text-slate-500">Relative Int.</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900/60 font-mono">
                                {shiftedPeaks.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-slate-900/20 text-slate-350">
                                    <td className="py-1.5 px-3 font-semibold">{p.twoTheta.toFixed(3)}°</td>
                                    <td className="py-1.5 px-3 text-right text-cyan-400 font-bold">{p.dSpacing.toFixed(5)} Å</td>
                                    <td className="py-1.5 px-3 text-right font-semibold text-indigo-400">{p.intensity.toFixed(1)}%</td>
                                  </tr>
                                ))}
                                {shiftedPeaks.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="py-4 text-center text-slate-500">All Bragg planes extinguished at this wavelength</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDetailTab === 'lattice' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {renderCrystalLattice(selectedMaterial.crystalSystem)}
                        
                        <div className="p-3.5 bg-black/35 border border-slate-900 rounded-xl text-[10px] space-y-2">
                          <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                            <Box className="w-3.5 h-3.5 text-indigo-400" />
                            Unit Cell Lattice Parameters
                          </h4>
                          <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                            Lattice systems govern a material's intrinsic mechanical resilience, packing density, and crystallographic symmetries. The visual wireframe rotating above represents the ideal unit cell projected on a continuous 3D axis.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeDetailTab === 'composition' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Chemical Detail row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl font-mono">
                            <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Molecular Weight</span>
                            <span className="text-xs block text-slate-200 mt-1 uppercase font-bold">
                              {selectedMaterial.molecularWeight ? `${selectedMaterial.molecularWeight.toFixed(3)} g/mol` : 'N/A'}
                            </span>
                          </div>

                          <div className="p-3 bg-black/40 border border-slate-800/60 rounded-xl font-mono">
                            <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Formula Unit</span>
                            <span className="text-xs block text-cyan-400 mt-1 font-bold">
                              {selectedMaterial.formula || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Element Cards Block */}
                        <div className="space-y-2">
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Constituent Element Profiles</span>
                          <div className="grid grid-cols-2 gap-2.5">
                            {selectedMaterial.elements?.map(el => {
                              const detail = ELEMENT_DETAILS[el] || {
                                name: "Unknown Element",
                                z: "?",
                                weight: "?",
                                category: "Unclassified",
                                color: "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              };
                              return (
                                <div key={el} className={`p-2.5 border rounded-xl flex items-center justify-between ${detail.color}`}>
                                  <div>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-sm font-bold uppercase font-mono tracking-tight text-white">{el}</span>
                                      <span className="text-[9px] font-sans text-slate-400 truncate max-w-[80px]">{detail.name}</span>
                                    </div>
                                    <div className="text-[7px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">{detail.category}</div>
                                  </div>
                                  <div className="text-right font-mono">
                                    <div className="text-xs font-black text-white leading-none">Z {detail.z}</div>
                                    <div className="text-[7px] text-slate-500 font-bold mt-1">
                                      {typeof detail.weight === 'number' ? `${detail.weight.toFixed(2)} u` : detail.weight}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {(!selectedMaterial.elements || selectedMaterial.elements.length === 0) && (
                              <div className="col-span-2 py-3 text-center text-slate-600 font-mono text-[9px]">No elemental constituents specified</div>
                            )}
                          </div>
                        </div>

                        {/* Scientific Applications list */}
                        {selectedMaterial.applications && selectedMaterial.applications.length > 0 && (
                          <div className="space-y-2 pt-2.5 border-t border-slate-900">
                            <h4 className="text-[8px] tracking-widest font-black uppercase text-slate-400 flex items-center gap-1.5">
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
                      </div>
                    )}

                    {activeDetailTab === 'thermo' && (() => {
                      const computedThermo = calculateThermodynamics(
                        selectedMaterial.formula || '',
                        selectedMaterial.crystalSystem || 'Cubic',
                        selectedMaterial.molecularWeight
                      );

                      const standardEntropy = selectedMaterial.standardEntropy !== undefined ? Number(selectedMaterial.standardEntropy) : computedThermo.standardEntropy;
                      const formationEnergy = selectedMaterial.formationEnergy !== undefined ? Number(selectedMaterial.formationEnergy) : computedThermo.formationEnergy;
                      const heatCapacity = selectedMaterial.heatCapacity !== undefined ? Number(selectedMaterial.heatCapacity) : computedThermo.heatCapacity;
                      const debyeTemperature = selectedMaterial.debyeTemperature !== undefined ? Number(selectedMaterial.debyeTemperature) : computedThermo.debyeTemperature;
                      const energyAboveHull = selectedMaterial.energyAboveHull !== undefined ? Number(selectedMaterial.energyAboveHull) : computedThermo.energyAboveHull;
                      const stabilityStatus = selectedMaterial.stabilityStatus !== undefined ? selectedMaterial.stabilityStatus : computedThermo.stabilityStatus;
                      const decompositionTemp = selectedMaterial.decompositionTemp !== undefined ? Number(selectedMaterial.decompositionTemp) : computedThermo.decompositionTemp;
                      
                      const elementLength = selectedMaterial.elements?.length || 2;
                      const calculatedEnthalpy = Math.round(formationEnergy * elementLength * 96.485);
                      const formationEnthalpy = selectedMaterial.formationEnthalpy !== undefined ? Number(selectedMaterial.formationEnthalpy) : calculatedEnthalpy;

                      const sweepData = generateTemperatureSweep({
                        formationEnthalpy,
                        formationEnergy,
                        standardEntropy,
                        heatCapacity,
                        debyeTemperature,
                        energyAboveHull,
                        stabilityStatus,
                        decompositionTemp
                      });

                      const selectedPoint = sweepData.find(pt => pt.tempKelvin === Math.floor(thermoTemperature / 50) * 50) || sweepData[0] || { gibbsFreeEnergy: formationEnthalpy, entropy: standardEntropy, heatCapacity };

                      return (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          {/* Thermostat dashboard values */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-3 bg-black/40 border border-slate-800/40 rounded-xl font-mono">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-extrabold">Formation Enthalpy (ΔHf°)</span>
                              <span className="text-xs block text-slate-100 mt-1 font-bold">
                                {formationEnthalpy ? `${formationEnthalpy} kJ/mol` : 'N/A'}
                              </span>
                              <span className="text-[8px] text-slate-400 mt-0.5 block">
                                ~ {formationEnergy.toFixed(3)} eV/atom
                              </span>
                            </div>

                            <div className="p-3 bg-black/40 border border-slate-800/40 rounded-xl font-mono">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-extrabold">Standard Entropy (S°)</span>
                              <span className="text-xs block text-slate-100 mt-1 font-bold">
                                {standardEntropy ? `${standardEntropy} J/mol·K` : 'N/A'}
                              </span>
                              <span className="text-[8px] text-slate-400 mt-0.5 block leading-none">
                                Estimated via Latimer's rule
                              </span>
                            </div>

                            <div className="p-3 bg-black/40 border border-slate-800/40 rounded-xl font-mono">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-transparent">Heat Capacity (Cp, 298)</span>
                              <span className="text-xs block text-slate-100 mt-1 font-bold">
                                {heatCapacity ? `${heatCapacity} J/mol·K` : 'N/A'}
                              </span>
                              <span className="text-[8px] text-slate-400 mt-0.5 block leading-none">
                                Estimated via Kopp's rule
                              </span>
                            </div>

                            <div className="p-3 bg-black/40 border border-slate-800/40 rounded-xl font-mono">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-extrabold">Debye Temp (θD)</span>
                              <span className="text-xs block text-cyan-400 mt-1 font-extrabold">
                                {debyeTemperature ? `${debyeTemperature} K` : 'N/A'}
                              </span>
                              <span className="text-[8px] text-slate-400 mt-0.5 block leading-none">
                                Lattice vibrational limit
                              </span>
                            </div>
                          </div>

                          {/* Phase Stability verdict */}
                          <div className={`p-3.5 border rounded-xl font-sans text-xs flex flex-col gap-2 ${
                            energyAboveHull === 0 && stabilityStatus === "Stable" 
                              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                              : "bg-amber-950/20 border-amber-500/20 text-amber-300"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold uppercase tracking-widest text-[9px]">Phase Stability Analysis</span>
                              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                                energyAboveHull === 0 && stabilityStatus === "Stable" 
                                  ? "bg-emerald-500 text-black"
                                  : "bg-amber-500 text-black"
                              }`}>
                                {energyAboveHull === 0 ? "E-Above-Hull: 0.0 eV/atom" : `E-Above-Hull: +${energyAboveHull.toFixed(3)} eV/atom`}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-300">
                              {energyAboveHull === 0 
                                ? `The formula ${selectedMaterial.formula} crystallizes in a thermodynamically stable ground state configuration conforming to the standard convex hull. It is highly resistant to standard chemical decomposition.`
                                : `The system possesses isostructural polymorphs or mechanical boundaries. With a Hull separation of +${energyAboveHull} eV/atom, it exhibits solid-state metastability.`
                              }
                            </p>
                            <div className="text-[10px] font-mono text-slate-400 flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5 mt-0.5">
                              <span>Thermal Stability Threshold:</span>
                              <span className="font-bold text-white uppercase text-[10px]">
                                Stable up to {decompositionTemp} K ({(decompositionTemp - 273.15).toFixed(0)}°C)
                              </span>
                            </div>
                          </div>

                          {/* Interactive Temperature Sweep Dashboard */}
                          <div className="p-3.5 bg-black/35 border border-slate-900 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white uppercase text-[9px] tracking-wider leading-none">Gibbs Potential Temperature Sweep (0K - 1500K)</h4>
                              <div className="text-slate-400 font-mono text-[9px]">
                                Selected: <span className="text-orange-400 font-black">{thermoTemperature} K</span>
                              </div>
                            </div>

                            {/* Range slider */}
                            <input 
                              type="range" 
                              min="0" 
                              max="1500" 
                              step="50"
                              value={thermoTemperature}
                              onChange={(e) => setThermoTemperature(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />

                            {/* Grid showing swept values */}
                            <div className="grid grid-cols-3 gap-2.5 pt-1 text-[10px] font-mono">
                              <div className="bg-black/40 p-2 border border-slate-900 rounded-lg">
                                <span className="block text-[7.5px] font-bold text-slate-500 uppercase leading-none">Gibbs free energy (ΔG)</span>
                                <span className="font-black text-orange-400 text-xs mt-1 block">
                                  {selectedPoint.gibbsFreeEnergy.toFixed(1)} <span className="text-[8px] font-normal">kJ/mol</span>
                                </span>
                              </div>
                              <div className="bg-black/40 p-2 border border-slate-900 rounded-lg">
                                <span className="block text-[7.5px] font-bold text-slate-500 uppercase leading-none">Swept Entropy (S)</span>
                                <span className="font-black text-slate-350 text-xs mt-1 block">
                                  {selectedPoint.entropy.toFixed(1)} <span className="text-[8px] font-normal">J/mol·K</span>
                                </span>
                              </div>
                              <div className="bg-black/40 p-2 border border-slate-900 rounded-lg">
                                <span className="block text-[7.5px] font-bold text-slate-500 uppercase leading-none">Heat Capacity (Cp)</span>
                                <span className="font-black text-slate-350 text-xs mt-1 block">
                                  {selectedPoint.heatCapacity.toFixed(1)} <span className="text-[8px] font-normal">J/mol·K</span>
                                </span>
                              </div>
                            </div>

                            {/* Recharts Continuous Curve */}
                            <div className="h-40 w-full pt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sweepData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                  <defs>
                                    <linearGradient id="thermoGibbsGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <XAxis 
                                    dataKey="tempKelvin" 
                                    tick={{ fill: '#64748b', fontSize: 8 }} 
                                    stroke="#1e293b" 
                                  />
                                  <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 8 }} 
                                    stroke="#1e293b" 
                                  />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '9px', fontFamily: 'monospace' }}
                                    labelFormatter={(lbl) => `T: ${lbl} K (${(lbl - 273.15).toFixed(0)} °C)`}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="gibbsFreeEnergy" 
                                    stroke="#f97316" 
                                    strokeWidth={1.5} 
                                    fillOpacity={1} 
                                    fill="url(#thermoGibbsGrad)" 
                                    name="Gibbs Potential" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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

