import React, { useState, useMemo } from 'react';
import {
  NIST_ISOTOPE_DB,
  IsotopeData,
  NeutronAtomExtended,
  NuclearMetrics,
  calculateComprehensiveNuclearMetrics
} from '../../utils/neutronDiffractionPhysics';
import { LatticeParameters } from '../../types';
import { Database, Search, ArrowRightLeft, ShieldAlert, Zap, Layers, Sparkles, Filter } from 'lucide-react';

interface IsotopeContrastWorkbenchProps {
  atoms: NeutronAtomExtended[];
  onUpdateAtom: (id: string, field: keyof NeutronAtomExtended, value: any) => void;
  onBulkUpdateAtoms: (newAtoms: NeutronAtomExtended[]) => void;
  lattice: LatticeParameters;
  wavelength: number;
  lengthUnit: string;
}

export const IsotopeContrastWorkbench: React.FC<IsotopeContrastWorkbenchProps> = ({
  atoms,
  onUpdateAtom,
  onBulkUpdateAtoms,
  lattice,
  wavelength,
  lengthUnit
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIsotope, setSelectedIsotope] = useState<IsotopeData | null>(NIST_ISOTOPE_DB['D']);
  const [sampleThicknessMm, setSampleThicknessMm] = useState<number>(1.0);

  const metrics: NuclearMetrics = useMemo(() => {
    return calculateComprehensiveNuclearMetrics(lattice, atoms, wavelength);
  }, [lattice, atoms, wavelength]);

  // Filter isotopes list
  const filteredIsotopes = useMemo(() => {
    return Object.values(NIST_ISOTOPE_DB).filter(iso => {
      const matchSearch =
        iso.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iso.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(iso.Z).includes(searchTerm);
      const matchCat = selectedCategory === 'All' || iso.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategory]);

  // Transmission at user thickness
  const transmissionUser = useMemo(() => {
    const mu_mm = metrics.attenuationLength1_e > 0 ? (1 / metrics.attenuationLength1_e) : 0.01;
    return Math.max(0, Math.min(100, Math.exp(-mu_mm * sampleThicknessMm) * 100));
  }, [metrics, sampleThicknessMm]);

  // Quick swap presets
  const performHydrogenDeuteriumSwap = () => {
    const updated = atoms.map(a => {
      if (a.element === 'H' || a.element.includes('1H')) {
        return { ...a, element: 'D', b: NIST_ISOTOPE_DB['D'].b_c, label: a.label.replace('H', 'D') };
      } else if (a.element === 'D' || a.element.includes('2H')) {
        return { ...a, element: 'H', b: NIST_ISOTOPE_DB['H'].b_c, label: a.label.replace('D', 'H') };
      }
      return a;
    });
    onBulkUpdateAtoms(updated);
  };

  const performNickelIsotopicSwap = (targetIso: '58Ni' | '62Ni' | 'Ni') => {
    const data = NIST_ISOTOPE_DB[targetIso];
    if (!data) return;
    const updated = atoms.map(a => {
      if (a.element.includes('Ni')) {
        return { ...a, element: targetIso, b: data.b_c, label: a.label };
      }
      return a;
    });
    onBulkUpdateAtoms(updated);
  };

  const applySelectedIsotopeToAtom = (atomId: string, iso: IsotopeData) => {
    onUpdateAtom(atomId, 'element', iso.symbol);
    onUpdateAtom(atomId, 'b', iso.b_c);
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Header & Sub-Bar */}
      <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
              NIST Nuclear Cross Section & Isotope Workbench
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Bound Coherent $b_c$, Incoherent $\sigma_i$, and $1/v$ Absorption
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore isotope scattering parameters, perform contrast variation swaps, and calculate beamline sample transmission.
          </p>
        </div>

        {/* Quick Batch Isotope Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={performHydrogenDeuteriumSwap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-[10px] font-black uppercase tracking-wider transition-all"
            title="Toggle between Protonated (1H) and Deuterated (2H/D) sites"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Toggle ¹H ↔ ²D (Deuteration)
          </button>
          <button
            onClick={() => performNickelIsotopicSwap('62Ni')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider transition-all"
            title="Swap Ni to 62Ni with negative scattering length (-8.7 fm)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ⁶²Ni (Neg b Swap)
          </button>
        </div>
      </div>

      {/* Main Grid: NIST Database Browser & Current Crystal Isotope Assignment */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: NIST Database Browser (7 Cols) */}
        <div className="xl:col-span-7 bg-[#070D18] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                NCNR Isotope Catalog ({filteredIsotopes.length})
              </h4>
            </div>

            {/* Search and Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by element, isotope..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-40 font-mono"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="All">All Classes</option>
                <option value="Light">Light Elements</option>
                <option value="Transition">Transition</option>
                <option value="Alkali">Alkali / Alkaline</option>
                <option value="RareEarth">Rare Earth</option>
                <option value="Halogen">Halogen</option>
              </select>
            </div>
          </div>

          {/* Isotopes Scroll List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredIsotopes.map(iso => {
              const isSelected = selectedIsotope?.symbol === iso.symbol;
              const isNegative = iso.b_c < 0;
              const isHighAbsorber = iso.sigma_abs_thermal > 100;
              const isHighIncoherent = iso.sigma_inc > 10;

              return (
                <div
                  key={iso.symbol}
                  onClick={() => setSelectedIsotope(iso)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-md'
                      : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-black text-white flex items-center gap-1.5">
                        {iso.symbol}
                        <span className="text-[9px] font-sans text-slate-400 font-medium">({iso.name})</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block">Z = {iso.Z} | A = {iso.A}</span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-mono font-black ${isNegative ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}`}>
                        b = {iso.b_c.toFixed(2)} fm
                      </span>
                      {isNegative && (
                        <span className="text-[7px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1 rounded">
                          Phase Inverted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cross-section indicators */}
                  <div className="grid grid-cols-3 gap-1 text-[8px] font-mono bg-black/40 p-1.5 rounded-lg border border-white/5">
                    <div>
                      <span className="text-slate-500 block">σ_coh</span>
                      <span className="text-slate-300 font-bold">{iso.sigma_coh.toFixed(1)} b</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">σ_inc</span>
                      <span className={`font-bold ${isHighIncoherent ? 'text-amber-400' : 'text-slate-300'}`}>
                        {iso.sigma_inc.toFixed(1)} b
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">σ_abs</span>
                      <span className={`font-bold ${isHighAbsorber ? 'text-rose-400' : 'text-slate-300'}`}>
                        {iso.sigma_abs_thermal > 1000 ? `${(iso.sigma_abs_thermal / 1000).toFixed(1)}k` : iso.sigma_abs_thermal.toFixed(1)} b
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Isotope Inspector & Cell Assignment (5 Cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Selected Isotope Card */}
          {selectedIsotope && (
            <div className="bg-[#0B1528] p-5 rounded-3xl border border-amber-500/20 shadow-xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white font-mono">{selectedIsotope.symbol} — {selectedIsotope.name}</h4>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">NCNR Physics Constants</span>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
                  selectedIsotope.b_c < 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  b = {selectedIsotope.b_c.toFixed(2)} fm
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase block">Coherent σ_coh</span>
                  <span className="text-xs font-mono font-black text-emerald-400">{selectedIsotope.sigma_coh.toFixed(3)} <span className="text-[9px] text-slate-500">barns</span></span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase block">Incoherent σ_inc</span>
                  <span className={`text-xs font-mono font-black ${selectedIsotope.sigma_inc > 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {selectedIsotope.sigma_inc.toFixed(3)} <span className="text-[9px] text-slate-500">barns</span>
                  </span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase block">Thermal Absorption</span>
                  <span className={`text-xs font-mono font-black ${selectedIsotope.sigma_abs_thermal > 100 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {selectedIsotope.sigma_abs_thermal.toFixed(2)} <span className="text-[9px] text-slate-500">barns</span>
                  </span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase block">X-ray Atomic No.</span>
                  <span className="text-xs font-mono font-black text-purple-400">Z = {selectedIsotope.Z}</span>
                </div>
              </div>

              {/* Assign to crystal atoms */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  Assign {selectedIsotope.symbol} to Crystal Site:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                  {atoms.map(atom => (
                    <button
                      key={atom.id}
                      onClick={() => applySelectedIsotopeToAtom(atom.id, selectedIsotope)}
                      className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-amber-500/20 text-[9px] font-mono font-bold text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all"
                    >
                      {atom.label} ({atom.element})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sample Transmission & Attenuation Calculator */}
          <div className="bg-[#070D18] p-5 rounded-3xl border border-white/10 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Beam Transmission
              </span>
              <span className="text-xs font-mono font-black text-cyan-400">
                {transmissionUser.toFixed(1)}% T
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Sample Thickness (t)</span>
                <span className="font-mono text-white">{sampleThicknessMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={sampleThicknessMm}
                onChange={(e) => setSampleThicknessMm(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500 block">1/e Attenuation Depth:</span>
                <span className="text-slate-300 font-black">{metrics.attenuationLength1_e.toFixed(2)} mm</span>
              </div>
              <div>
                <span className="text-slate-500 block">Inc. Haze Ratio:</span>
                <span className={`font-black ${metrics.incoherentHazeRatio > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {(metrics.incoherentHazeRatio * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
