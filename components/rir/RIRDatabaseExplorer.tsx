import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  Plus,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sliders,
  Scale,
  Zap,
  Atom,
  Eye
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export interface RIRDatabaseItem {
  name: string;
  formula: string;
  pdfCard: string;
  crystalSystem: string;
  spaceGroup?: string;
  hkl: string;
  twoTheta: number; // Cu Ka (1.5406 A)
  rir: number; // I / I_corundum
  density: number; // g/cm^3
  macCu: number; // Mass attenuation coefficient for Cu Ka (cm^2/g)
  macMo?: number; // Mo Ka (0.7107 A)
  category: 'Minerals' | 'Oxides & Ceramics' | 'Battery & Energy' | 'Metals & Alloys' | 'Cements' | 'Biomaterials' | 'Pharmaceuticals' | 'Semiconductors';
  notes: string;
}

export const DATABASE_PRESETS: RIRDatabaseItem[] = [
  // MINERALS & GEOLOGY
  { name: 'Quartz (α-SiO₂)', formula: 'SiO2', pdfCard: '01-085-0798', crystalSystem: 'Trigonal', spaceGroup: 'P3₁21', hkl: '(101)', twoTheta: 26.64, rir: 3.41, density: 2.65, macCu: 34.9, macMo: 4.8, category: 'Minerals', notes: 'Benchmark geological standard, rock-forming tectosilicate' },
  { name: 'Calcite', formula: 'CaCO3', pdfCard: '01-083-0578', crystalSystem: 'Trigonal', spaceGroup: 'R-3c', hkl: '(104)', twoTheta: 29.40, rir: 2.98, density: 2.71, macCu: 75.3, macMo: 8.9, category: 'Minerals', notes: 'Primary limestone carbonate, cleavage rhombohedral' },
  { name: 'Aragonite', formula: 'CaCO3', pdfCard: '01-075-2230', crystalSystem: 'Orthorhombic', spaceGroup: 'Pmcn', hkl: '(111)', twoTheta: 26.22, rir: 2.70, density: 2.93, macCu: 75.3, category: 'Minerals', notes: 'High-pressure/biogenic calcium carbonate polymorph' },
  { name: 'Dolomite', formula: 'CaMg(CO3)2', pdfCard: '01-075-1759', crystalSystem: 'Trigonal', spaceGroup: 'R-3', hkl: '(104)', twoTheta: 30.95, rir: 2.65, density: 2.86, macCu: 57.8, category: 'Minerals', notes: 'Ordered double carbonate mineral' },
  { name: 'Microcline (K-Feldspar)', formula: 'KAlSi3O8', pdfCard: '01-076-0823', crystalSystem: 'Triclinic', spaceGroup: 'C-1', hkl: '(002)', twoTheta: 27.50, rir: 0.88, density: 2.56, macCu: 48.2, category: 'Minerals', notes: 'Abundant crustal alkali feldspar' },
  { name: 'Albite (Plagioclase)', formula: 'NaAlSi3O8', pdfCard: '01-089-6427', crystalSystem: 'Triclinic', spaceGroup: 'C-1', hkl: '(-201)', twoTheta: 27.88, rir: 0.94, density: 2.62, macCu: 38.6, category: 'Minerals', notes: 'Sodium endmember plagioclase series' },
  { name: 'Kaolinite', formula: 'Al2Si2O5(OH)4', pdfCard: '01-078-2110', crystalSystem: 'Triclinic', spaceGroup: 'P1', hkl: '(001)', twoTheta: 12.35, rir: 1.05, density: 2.60, macCu: 31.5, category: 'Minerals', notes: 'Layered 1:1 aluminosilicate clay, basal reflection' },
  { name: 'Illite Mica', formula: 'K0.65Al2.0[Al0.65Si3.35O10](OH)2', pdfCard: '00-026-0911', crystalSystem: 'Monoclinic', spaceGroup: 'C2/m', hkl: '(002)', twoTheta: 8.85, rir: 1.80, density: 2.78, macCu: 44.5, category: 'Minerals', notes: 'Non-expanding 2:1 sheet silicate clay' },
  { name: 'Gypsum', formula: 'CaSO4·2H2O', pdfCard: '01-070-0112', crystalSystem: 'Monoclinic', spaceGroup: 'I2/a', hkl: '(020)', twoTheta: 11.60, rir: 1.82, density: 2.32, macCu: 66.8, category: 'Minerals', notes: 'Hydrated calcium sulfate mineral' },
  { name: 'Anhydrite', formula: 'CaSO4', pdfCard: '01-072-0503', crystalSystem: 'Orthorhombic', spaceGroup: 'Amma', hkl: '(020)', twoTheta: 25.45, rir: 2.10, density: 2.97, macCu: 81.2, category: 'Minerals', notes: 'Dehydrated gypsum mineral' },
  { name: 'Fluorite', formula: 'CaF2', pdfCard: '01-075-0363', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', hkl: '(111)', twoTheta: 28.27, rir: 3.50, density: 3.18, macCu: 92.4, category: 'Minerals', notes: 'Optical halide reference standard' },
  { name: 'Pyrite', formula: 'FeS2', pdfCard: '01-071-1680', crystalSystem: 'Cubic', spaceGroup: 'Pa-3', hkl: '(200)', twoTheta: 33.04, rir: 2.70, density: 5.01, macCu: 175.0, category: 'Minerals', notes: 'Iron disulfide mineral (fool\'s gold)' },
  { name: 'Hematite', formula: 'α-Fe2O3', pdfCard: '01-089-0597', crystalSystem: 'Trigonal', spaceGroup: 'R-3c', hkl: '(104)', twoTheta: 33.15, rir: 2.30, density: 5.26, macCu: 215.0, category: 'Minerals', notes: 'Primary iron ore mineral, antiferromagnetic' },
  { name: 'Magnetite', formula: 'Fe3O4', pdfCard: '01-075-0449', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', hkl: '(311)', twoTheta: 35.42, rir: 4.80, density: 5.18, macCu: 220.0, category: 'Minerals', notes: 'Ferrimagnetic inverse spinel oxide' },
  { name: 'Gibbsite', formula: 'Al(OH)3', pdfCard: '01-074-1775', crystalSystem: 'Monoclinic', spaceGroup: 'P2₁/n', hkl: '(002)', twoTheta: 18.28, rir: 1.20, density: 2.42, macCu: 18.5, category: 'Minerals', notes: 'Primary bauxite aluminum ore hydroxide' },
  { name: 'Boehmite', formula: 'AlO(OH)', pdfCard: '01-072-0198', crystalSystem: 'Orthorhombic', spaceGroup: 'Cmcm', hkl: '(020)', twoTheta: 14.48, rir: 1.65, density: 3.02, macCu: 24.1, category: 'Minerals', notes: 'High-temperature bauxite oxyhydroxide' },

  // OXIDES & ADVANCED CERAMICS
  { name: 'Corundum (Universal Standard)', formula: 'α-Al2O3', pdfCard: '01-071-1123', crystalSystem: 'Trigonal', spaceGroup: 'R-3c', hkl: '(113)', twoTheta: 43.34, rir: 1.00, density: 3.99, macCu: 31.8, macMo: 4.1, category: 'Oxides & Ceramics', notes: 'Universal I/Ic reference standard defined as 1.00' },
  { name: 'Anatase (TiO₂)', formula: 'TiO2', pdfCard: '01-071-1166', crystalSystem: 'Tetragonal', spaceGroup: 'I4₁/amd', hkl: '(101)', twoTheta: 25.28, rir: 3.86, density: 3.89, macCu: 124.0, category: 'Oxides & Ceramics', notes: 'Photocatalytic metastable titania polymorph' },
  { name: 'Rutile (TiO₂)', formula: 'TiO2', pdfCard: '01-078-1508', crystalSystem: 'Tetragonal', spaceGroup: 'P4₂/mnm', hkl: '(110)', twoTheta: 27.44, rir: 1.34, density: 4.23, macCu: 124.0, category: 'Oxides & Ceramics', notes: 'High refractive index thermodynamically stable titania' },
  { name: 'Zinc Oxide (Zincite)', formula: 'ZnO', pdfCard: '01-079-0206', crystalSystem: 'Hexagonal', spaceGroup: 'P6₃mc', hkl: '(101)', twoTheta: 36.25, rir: 5.43, density: 5.61, macCu: 58.0, category: 'Oxides & Ceramics', notes: 'Wurtzite structure piezoelectric wide-bandgap oxide' },
  { name: 'Zirconia (Monoclinic)', formula: 'm-ZrO2', pdfCard: '01-072-1669', crystalSystem: 'Monoclinic', spaceGroup: 'P2₁/c', hkl: '(-111)', twoTheta: 28.18, rir: 3.10, density: 5.68, macCu: 142.0, category: 'Oxides & Ceramics', notes: 'Baddeleyite room-temperature refractory ceramic' },
  { name: 'Zirconia (Tetragonal)', formula: 't-ZrO2', pdfCard: '01-080-0965', crystalSystem: 'Tetragonal', spaceGroup: 'P4₂/nmc', hkl: '(101)', twoTheta: 30.27, rir: 3.75, density: 6.10, macCu: 142.0, category: 'Oxides & Ceramics', notes: 'Yttria-stabilized transformation-toughened phase (YSZ)' },
  { name: 'Cubic Zirconia (YSZ)', formula: 'c-ZrO2:8Y2O3', pdfCard: '01-089-9069', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', hkl: '(111)', twoTheta: 30.15, rir: 4.20, density: 5.95, macCu: 138.0, category: 'Oxides & Ceramics', notes: 'Fast oxygen-ion conductor for solid oxide fuel cells' },
  { name: 'Mullite', formula: 'Al6Si2O13', pdfCard: '01-079-1455', crystalSystem: 'Orthorhombic', spaceGroup: 'Pbam', hkl: '(120)', twoTheta: 26.26, rir: 0.60, density: 3.17, macCu: 33.2, category: 'Oxides & Ceramics', notes: 'High-temperature refractory aluminosilicate' },
  { name: 'Spinel (MgAl₂O₄)', formula: 'MgAl2O4', pdfCard: '01-077-1193', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', hkl: '(311)', twoTheta: 36.85, rir: 1.95, density: 3.58, macCu: 32.4, category: 'Oxides & Ceramics', notes: 'Transparent ceramic with high thermal and chemical shock resistance' },
  { name: 'Barium Titanate', formula: 'BaTiO3', pdfCard: '01-074-1956', crystalSystem: 'Tetragonal', spaceGroup: 'P4mm', hkl: '(101)', twoTheta: 31.52, rir: 11.20, density: 6.02, macCu: 285.0, category: 'Oxides & Ceramics', notes: 'Ferroelectric and piezoelectric MLCC capacitor ceramic' },

  // BATTERY & ENERGY MATERIALS
  { name: 'Lithium Iron Phosphate (LFP)', formula: 'LiFePO4', pdfCard: '01-083-2092', crystalSystem: 'Orthorhombic', spaceGroup: 'Pnma', hkl: '(020)', twoTheta: 17.10, rir: 1.85, density: 3.60, macCu: 110.0, category: 'Battery & Energy', notes: 'Olivine structure high-safety Li-ion cathode' },
  { name: 'Lithium Cobalt Oxide (LCO)', formula: 'LiCoO2', pdfCard: '01-075-0532', crystalSystem: 'Trigonal', spaceGroup: 'R-3m', hkl: '(003)', twoTheta: 18.90, rir: 2.10, density: 5.05, macCu: 185.0, category: 'Battery & Energy', notes: 'Layered O3 structure high-energy battery cathode' },
  { name: 'NMC-622 Cathode', formula: 'LiNi0.6Mn0.2Co0.2O2', pdfCard: '04-018-7254', crystalSystem: 'Trigonal', spaceGroup: 'R-3m', hkl: '(003)', twoTheta: 18.72, rir: 2.25, density: 4.75, macCu: 172.0, category: 'Battery & Energy', notes: 'Modern electric vehicle high-capacity layered cathode' },
  { name: 'Graphite (2H)', formula: 'C', pdfCard: '01-075-1621', crystalSystem: 'Hexagonal', spaceGroup: 'P6₃/mmc', hkl: '(002)', twoTheta: 26.54, rir: 5.80, density: 2.26, macCu: 4.6, category: 'Battery & Energy', notes: 'Dominant commercial Li-ion battery anode' },
  { name: 'Silicon Anode (SRM 640)', formula: 'Si', pdfCard: '01-075-0544', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', hkl: '(111)', twoTheta: 28.44, rir: 4.70, density: 2.33, macCu: 60.3, category: 'Battery & Energy', notes: 'High theoretical capacity battery anode (3579 mAh/g)' },
  { name: 'Methylammonium Lead Iodide', formula: 'CH3NH3PbI3', pdfCard: '01-084-7607', crystalSystem: 'Tetragonal', spaceGroup: 'I4/mcm', hkl: '(110)', twoTheta: 14.12, rir: 8.90, density: 4.16, macCu: 245.0, category: 'Battery & Energy', notes: 'High-efficiency hybrid halide perovskite solar absorber' },

  // CEMENTS & BUILDING MATERIALS
  { name: 'Alite / C3S', formula: 'Ca3SiO5', pdfCard: '01-086-0402', crystalSystem: 'Monoclinic', spaceGroup: 'Cm', hkl: '(009)', twoTheta: 32.20, rir: 1.45, density: 3.15, macCu: 92.0, category: 'Cements', notes: 'Primary hydraulic strength phase in Portland cement (50-70%)' },
  { name: 'Belite / C2S', formula: 'Ca2SiO4', pdfCard: '01-083-0461', crystalSystem: 'Monoclinic', spaceGroup: 'P2₁/n', hkl: '(103)', twoTheta: 32.60, rir: 1.25, density: 3.28, macCu: 88.0, category: 'Cements', notes: 'Secondary hydraulic phase for late-age cement strength' },
  { name: 'Aluminate / C3A', formula: 'Ca3Al2O6', pdfCard: '01-074-0570', crystalSystem: 'Cubic', spaceGroup: 'Pa-3', hkl: '(440)', twoTheta: 33.18, rir: 1.60, density: 3.04, macCu: 73.0, category: 'Cements', notes: 'Rapid flash-setting tricalcium aluminate' },
  { name: 'Ferrite / C4AF', formula: 'Ca4Al2Fe2O10', pdfCard: '01-071-0667', crystalSystem: 'Orthorhombic', spaceGroup: 'Ibm2', hkl: '(141)', twoTheta: 33.80, rir: 1.35, density: 3.77, macCu: 120.0, category: 'Cements', notes: 'Brownmillerite ferrite flux phase in clinker' },
  { name: 'Portlandite (CH)', formula: 'Ca(OH)2', pdfCard: '01-072-0156', crystalSystem: 'Trigonal', spaceGroup: 'P-3m1', hkl: '(001)', twoTheta: 18.09, rir: 2.15, density: 2.24, macCu: 68.0, category: 'Cements', notes: 'Major crystalline hydration byproduct of cement pastes' },
  { name: 'Ettringite (AFt)', formula: 'Ca6Al2(SO4)3(OH)12·26H2O', pdfCard: '01-072-0646', crystalSystem: 'Trigonal', spaceGroup: 'P31c', hkl: '(100)', twoTheta: 9.08, rir: 0.95, density: 1.77, macCu: 42.0, category: 'Cements', notes: 'Needle-like early hydration product causing expansion' },

  // METALS & STRUCTURAL ALLOYS
  { name: 'Copper (FCC)', formula: 'Cu', pdfCard: '01-085-1326', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', hkl: '(111)', twoTheta: 43.30, rir: 8.50, density: 8.96, macCu: 52.9, category: 'Metals & Alloys', notes: 'High electrical conductivity FCC metal' },
  { name: 'Ferrite (α-Fe, BCC)', formula: 'α-Fe', pdfCard: '01-087-0721', crystalSystem: 'Cubic', spaceGroup: 'Im-3m', hkl: '(110)', twoTheta: 44.67, rir: 10.80, density: 7.87, macCu: 308.0, category: 'Metals & Alloys', notes: 'BCC ferromagnetic steel matrix phase' },
  { name: 'Austenite (γ-Fe, FCC)', formula: 'γ-Fe', pdfCard: '01-088-2324', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', hkl: '(111)', twoTheta: 43.60, rir: 9.20, density: 8.05, macCu: 305.0, category: 'Metals & Alloys', notes: 'Retained austenitic stainless steel phase' },
  { name: 'Titanium (α-Ti, HCP)', formula: 'α-Ti', pdfCard: '01-089-2762', crystalSystem: 'Hexagonal', spaceGroup: 'P6₃/mmc', hkl: '(101)', twoTheta: 40.17, rir: 2.15, density: 4.51, macCu: 208.0, category: 'Metals & Alloys', notes: 'HCP aerospace alloy base metal' },
  { name: 'Nickel (FCC)', formula: 'Ni', pdfCard: '01-071-4654', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', hkl: '(111)', twoTheta: 44.51, rir: 7.90, density: 8.90, macCu: 49.3, category: 'Metals & Alloys', notes: 'High-temperature superalloy base matrix' },
  { name: 'Tungsten Carbide (WC)', formula: 'WC', pdfCard: '01-089-2727', crystalSystem: 'Hexagonal', spaceGroup: 'P-6m2', hkl: '(100)', twoTheta: 31.51, rir: 14.50, density: 15.63, macCu: 156.0, category: 'Metals & Alloys', notes: 'Ultra-hard cutting tool cermet component' },

  // BIOMATERIALS & PHARMACEUTICALS
  { name: 'Hydroxyapatite (HA)', formula: 'Ca5(PO4)3(OH)', pdfCard: '01-074-0565', crystalSystem: 'Hexagonal', spaceGroup: 'P6₃/m', hkl: '(211)', twoTheta: 31.77, rir: 1.55, density: 3.16, macCu: 82.5, category: 'Biomaterials', notes: 'Major mineral component of human bone and tooth enamel' },
  { name: 'β-Tricalcium Phosphate (β-TCP)', formula: 'β-Ca3(PO4)2', pdfCard: '01-070-2065', crystalSystem: 'Trigonal', spaceGroup: 'R-3c', hkl: '(0 2 10)', twoTheta: 31.02, rir: 1.40, density: 3.07, macCu: 81.5, category: 'Biomaterials', notes: 'Bioresorbable bone graft scaffold ceramic' },
  { name: 'Paracetamol (Form I Monoclinic)', formula: 'C8H9NO2', pdfCard: '00-039-1503', crystalSystem: 'Monoclinic', spaceGroup: 'P2₁/n', hkl: '(020)', twoTheta: 18.25, rir: 2.10, density: 1.29, macCu: 6.8, category: 'Pharmaceuticals', notes: 'Thermodynamically stable analgesic polymorph' },
  { name: 'Paracetamol (Form II Orthorhombic)', formula: 'C8H9NO2', pdfCard: '00-052-2051', crystalSystem: 'Orthorhombic', spaceGroup: 'Pca2₁', hkl: '(002)', twoTheta: 13.80, rir: 2.45, density: 1.33, macCu: 6.8, category: 'Pharmaceuticals', notes: 'Directly compressible metastable drug polymorph' },
  { name: 'Aspirin (Form I)', formula: 'C9H8O4', pdfCard: '00-036-1936', crystalSystem: 'Monoclinic', spaceGroup: 'P2₁/c', hkl: '(100)', twoTheta: 7.78, rir: 3.10, density: 1.40, macCu: 7.1, category: 'Pharmaceuticals', notes: 'Acetylsalicylic acid NSAID drug' },
  { name: 'Ibuprofen (Form I)', formula: 'C13H18O2', pdfCard: '00-055-1563', crystalSystem: 'Monoclinic', spaceGroup: 'P2₁/c', hkl: '(002)', twoTheta: 6.12, rir: 2.80, density: 1.11, macCu: 5.4, category: 'Pharmaceuticals', notes: 'Standard commercial anti-inflammatory active' }
];

interface RIRDatabaseExplorerProps {
  onAddPhasePreset: (item: RIRDatabaseItem) => void;
}

export const RIRDatabaseExplorer: React.FC<RIRDatabaseExplorerProps> = ({
  onAddPhasePreset
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [crystalSystemFilter, setCrystalSystemFilter] = useState<string>('All');
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(DATABASE_PRESETS.map(d => d.category));
    return ['All', ...Array.from(set)];
  }, []);

  const crystalSystems = useMemo(() => {
    const set = new Set(DATABASE_PRESETS.map(d => d.crystalSystem));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredItems = useMemo(() => {
    return DATABASE_PRESETS.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.formula.toLowerCase().includes(search.toLowerCase()) ||
        item.pdfCard.includes(search) ||
        item.notes.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchSystem = crystalSystemFilter === 'All' || item.crystalSystem === crystalSystemFilter;
      return matchSearch && matchCategory && matchSystem;
    });
  }, [search, categoryFilter, crystalSystemFilter]);

  const handleAdd = (item: RIRDatabaseItem) => {
    playSynthTone('success');
    onAddPhasePreset(item);
    setAddedItemName(item.name);
    setTimeout(() => setAddedItemName(null), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>ICDD Reference Intensity Database</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {DATABASE_PRESETS.length} Standards
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Curated library of experimental & calculated $I/I_c$ reference ratios, crystal densities, and Cu Kα mass attenuation coefficients.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, formula, PDF card..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Category & System Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { playSynthTone('tick'); setCategoryFilter(cat); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Crystal System:</span>
          <select
            value={crystalSystemFilter}
            onChange={(e) => { playSynthTone('tick'); setCrystalSystemFilter(e.target.value); }}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-purple-500/60"
          >
            {crystalSystems.map(sys => (
              <option key={sys} value={sys}>{sys}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification */}
      {addedItemName && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Added <strong>{addedItemName}</strong> to current RIR phase mixture!</span>
          </div>
          <button onClick={() => setAddedItemName(null)} className="text-emerald-400 hover:text-emerald-200 font-bold">✕</button>
        </div>
      )}

      {/* Database Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-950/60 hover:bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between group shadow-lg"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm group-hover:text-purple-300 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-purple-400 font-bold">{item.formula}</span>
                    <span className="text-[10px] text-slate-500 font-mono">PDF #{item.pdfCard}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {item.category}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">RIR ($I/I_c$)</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{item.rir.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Peak (hkl)</span>
                  <span className="font-mono font-bold text-slate-300">{item.hkl}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">2θ Angle</span>
                  <span className="font-mono font-bold text-slate-300">{item.twoTheta}°</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
                <span>Density: <strong className="text-slate-300">{item.density} g/cm³</strong></span>
                <span>MAC (Cu): <strong className="text-slate-300">{item.macCu} cm²/g</strong></span>
              </div>

              <p className="text-[11px] text-slate-400 italic line-clamp-2 px-1">
                {item.notes}
              </p>
            </div>

            <button
              onClick={() => handleAdd(item)}
              className="mt-3.5 w-full py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Active Mixture</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
