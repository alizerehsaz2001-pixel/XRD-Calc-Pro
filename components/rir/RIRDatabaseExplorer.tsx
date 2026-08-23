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
  BookOpen
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export interface RIRDatabaseItem {
  name: string;
  formula: string;
  pdfCard: string;
  crystalSystem: string;
  hkl: string;
  twoTheta: number; // Cu Ka (1.5406 A)
  rir: number; // I / I_corundum
  density: number; // g/cm^3
  macCu: number; // Mass attenuation coefficient for Cu Ka (cm^2/g)
  category: 'Minerals' | 'Oxides & Ceramics' | 'Metals & Alloys' | 'Cements' | 'Biomaterials' | 'Semiconductors';
  notes: string;
}

export const DATABASE_PRESETS: RIRDatabaseItem[] = [
  { name: 'Quartz (α-SiO2)', formula: 'SiO2', pdfCard: '01-085-0798', crystalSystem: 'Trigonal', hkl: '(101)', twoTheta: 26.64, rir: 3.41, density: 2.65, macCu: 34.9, category: 'Minerals', notes: 'Benchmark geological standard' },
  { name: 'Calcite', formula: 'CaCO3', pdfCard: '01-083-0578', crystalSystem: 'Trigonal', hkl: '(104)', twoTheta: 29.40, rir: 2.98, density: 2.71, macCu: 75.3, category: 'Minerals', notes: 'Common limestone carbonate' },
  { name: 'Corundum (Standard)', formula: 'α-Al2O3', pdfCard: '01-071-1123', crystalSystem: 'Trigonal', hkl: '(113)', twoTheta: 43.34, rir: 1.00, density: 3.99, macCu: 31.8, category: 'Oxides & Ceramics', notes: 'Universal I/Ic reference standard' },
  { name: 'Rutile', formula: 'TiO2', pdfCard: '01-078-1508', crystalSystem: 'Tetragonal', hkl: '(110)', twoTheta: 27.44, rir: 1.34, density: 4.23, macCu: 124.0, category: 'Oxides & Ceramics', notes: 'High refractive index pigment' },
  { name: 'Anatase', formula: 'TiO2', pdfCard: '01-071-1166', crystalSystem: 'Tetragonal', hkl: '(101)', twoTheta: 25.28, rir: 3.86, density: 3.89, macCu: 124.0, category: 'Oxides & Ceramics', notes: 'Photocatalytic titania polymorph' },
  { name: 'Hematite', formula: 'α-Fe2O3', pdfCard: '01-089-0597', crystalSystem: 'Trigonal', hkl: '(104)', twoTheta: 33.15, rir: 2.30, density: 5.26, macCu: 215.0, category: 'Minerals', notes: 'Primary iron ore mineral' },
  { name: 'Magnetite', formula: 'Fe3O4', pdfCard: '01-075-0449', crystalSystem: 'Cubic', hkl: '(311)', twoTheta: 35.42, rir: 4.80, density: 5.18, macCu: 220.0, category: 'Minerals', notes: 'Ferrimagnetic spinel oxide' },
  { name: 'Silicon (Standard)', formula: 'Si', pdfCard: '01-075-0544', crystalSystem: 'Cubic', hkl: '(111)', twoTheta: 28.44, rir: 4.70, density: 2.33, macCu: 60.3, category: 'Semiconductors', notes: 'NIST SRM 640 standard' },
  { name: 'Zinc Oxide (Zincite)', formula: 'ZnO', pdfCard: '01-079-0206', crystalSystem: 'Hexagonal', hkl: '(101)', twoTheta: 36.25, rir: 5.43, density: 5.61, macCu: 58.0, category: 'Oxides & Ceramics', notes: 'Piezoelectric wide-bandgap oxide' },
  { name: 'Fluorite', formula: 'CaF2', pdfCard: '01-075-0363', crystalSystem: 'Cubic', hkl: '(111)', twoTheta: 28.27, rir: 3.50, density: 3.18, macCu: 92.4, category: 'Minerals', notes: 'Optical grade halide standard' },
  { name: 'Gypsum', formula: 'CaSO4·2H2O', pdfCard: '01-070-0112', crystalSystem: 'Monoclinic', hkl: '(020)', twoTheta: 11.60, rir: 1.82, density: 2.32, macCu: 66.8, category: 'Minerals', notes: 'Hydrated calcium sulfate' },
  { name: 'Anhydrite', formula: 'CaSO4', pdfCard: '01-072-0503', crystalSystem: 'Orthorhombic', hkl: '(020)', twoTheta: 25.45, rir: 2.10, density: 2.97, macCu: 81.2, category: 'Minerals', notes: 'Dehydrated gypsum mineral' },
  { name: 'Microcline (K-Feldspar)', formula: 'KAlSi3O8', pdfCard: '01-076-0823', crystalSystem: 'Triclinic', hkl: '(002)', twoTheta: 27.50, rir: 0.88, density: 2.56, macCu: 48.2, category: 'Minerals', notes: 'Abundant crustal silicate' },
  { name: 'Albite (Plagioclase)', formula: 'NaAlSi3O8', pdfCard: '01-089-6427', crystalSystem: 'Triclinic', hkl: '(-201)', twoTheta: 27.88, rir: 0.94, density: 2.62, macCu: 38.6, category: 'Minerals', notes: 'Sodium endmember feldspar' },
  { name: 'Kaolinite', formula: 'Al2Si2O5(OH)4', pdfCard: '01-078-2110', crystalSystem: 'Triclinic', hkl: '(001)', twoTheta: 12.35, rir: 1.05, density: 2.60, macCu: 31.5, category: 'Minerals', notes: 'Layered 1:1 aluminosilicate clay' },
  { name: 'Dolomite', formula: 'CaMg(CO3)2', pdfCard: '01-075-1759', crystalSystem: 'Trigonal', hkl: '(104)', twoTheta: 30.95, rir: 2.65, density: 2.86, macCu: 57.8, category: 'Minerals', notes: 'Double carbonate mineral' },
  { name: 'Alite (C3S)', formula: 'Ca3SiO5', pdfCard: '01-086-0402', crystalSystem: 'Monoclinic', hkl: '(009)', twoTheta: 32.20, rir: 1.45, density: 3.15, macCu: 92.0, category: 'Cements', notes: 'Dominant phase in Portland cement' },
  { name: 'Belite (C2S)', formula: 'Ca2SiO4', pdfCard: '01-083-0461', crystalSystem: 'Monoclinic', hkl: '(103)', twoTheta: 32.60, rir: 1.25, density: 3.28, macCu: 88.0, category: 'Cements', notes: 'Secondary hydraulic cement phase' },
  { name: 'Hydroxyapatite', formula: 'Ca5(PO4)3(OH)', pdfCard: '01-074-0565', crystalSystem: 'Hexagonal', hkl: '(211)', twoTheta: 31.77, rir: 1.55, density: 3.16, macCu: 82.5, category: 'Biomaterials', notes: 'Major mineral component of bone and teeth' },
  { name: 'Lithium Iron Phosphate', formula: 'LiFePO4', pdfCard: '01-083-2092', crystalSystem: 'Orthorhombic', hkl: '(020)', twoTheta: 17.10, rir: 1.85, density: 3.60, macCu: 110.0, category: 'Oxides & Ceramics', notes: 'Olivine structure cathode material' },
  { name: 'Copper', formula: 'Cu', pdfCard: '01-085-1326', crystalSystem: 'Cubic', hkl: '(111)', twoTheta: 43.30, rir: 8.50, density: 8.96, macCu: 52.9, category: 'Metals & Alloys', notes: 'High conductivity FCC metal' },
  { name: 'Iron (α-Ferrite)', formula: 'α-Fe', pdfCard: '01-087-0721', crystalSystem: 'Cubic', hkl: '(110)', twoTheta: 44.67, rir: 10.80, density: 7.87, macCu: 308.0, category: 'Metals & Alloys', notes: 'BCC ferromagnetic steel matrix' },
  { name: 'Austenite (γ-Fe)', formula: 'γ-Fe', pdfCard: '01-088-2324', crystalSystem: 'Cubic', hkl: '(111)', twoTheta: 43.60, rir: 9.20, density: 8.05, macCu: 305.0, category: 'Metals & Alloys', notes: 'Retained FCC austenite phase' },
  { name: 'Titanium (α-Ti)', formula: 'α-Ti', pdfCard: '01-089-2762', crystalSystem: 'Hexagonal', hkl: '(101)', twoTheta: 40.17, rir: 2.15, density: 4.51, macCu: 208.0, category: 'Metals & Alloys', notes: 'HCP aerospace alloy base' },
];

interface RIRDatabaseExplorerProps {
  onAddPhasePreset: (item: RIRDatabaseItem) => void;
}

export const RIRDatabaseExplorer: React.FC<RIRDatabaseExplorerProps> = ({
  onAddPhasePreset
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(DATABASE_PRESETS.map(d => d.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredItems = useMemo(() => {
    return DATABASE_PRESETS.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.formula.toLowerCase().includes(search.toLowerCase()) ||
        item.pdfCard.includes(search);
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [search, categoryFilter]);

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
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              ICDD Reference Intensity Database
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Curated library of experimental and calculated $I/I_c$ reference ratios, crystal densities, and Cu Kα mass attenuation coefficients.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mineral, formula, PDF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { playSynthTone('tick'); setCategoryFilter(cat); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === cat
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notification */}
      {addedItemName && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Added {addedItemName} to active phase mixture!</span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-sm"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm group-hover:text-purple-300 transition-colors">
                    {item.name}
                  </h3>
                  <span className="font-mono text-xs text-purple-400 font-bold">{item.formula}</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                  {item.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/60">
                <div className="text-slate-400">
                  RIR ($I/I_c$): <span className="text-purple-300 font-bold">{item.rir.toFixed(2)}</span>
                </div>
                <div className="text-slate-400">
                  2θ: <span className="text-slate-200 font-bold">{item.twoTheta}°</span>
                </div>
                <div className="text-slate-400">
                  Reflection: <span className="text-slate-200 font-bold">{item.hkl}</span>
                </div>
                <div className="text-slate-400">
                  Density: <span className="text-slate-200 font-bold">{item.density} g/cm³</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic pt-1">{item.notes}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">PDF: {item.pdfCard}</span>
              <button
                onClick={() => handleAdd(item)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-purple-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Mixture</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
