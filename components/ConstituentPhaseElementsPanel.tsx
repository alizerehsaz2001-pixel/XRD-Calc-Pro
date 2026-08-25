import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Atom,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Download,
  Copy,
  Check,
  ChevronRight,
  Info,
  Zap,
  Activity,
  Maximize2,
  X,
  PieChart,
  ShieldAlert,
  Gauge
} from 'lucide-react';
import { parseChemicalFormulaAdvanced, IUPAC_ATOMIC_WEIGHTS } from '../utils/stoichiometry';
import {
  getElementMetrology,
  evaluateFluorescenceRisk,
  calculateIonicityPercentage,
  ElementMetrology,
  ELEMENT_METROLOGY_DB
} from '../utils/elementMetrology';

export interface ConstituentPhaseElementsProps {
  formula: string;
  materialName?: string;
  crystalSystem?: string;
  spaceGroup?: string;
  elements?: string[];
  density?: number;
  compact?: boolean;
  className?: string;
}

type MetricMode = 'weight' | 'atomic' | 'scattering' | 'electrons';

export const ConstituentPhaseElementsPanel: React.FC<ConstituentPhaseElementsProps> = ({
  formula,
  materialName,
  crystalSystem,
  spaceGroup,
  elements: initialElements,
  density,
  compact = false,
  className = ''
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('weight');
  const [selectedElementSym, setSelectedElementSym] = useState<string | null>(null);
  const [selectedAnode, setSelectedAnode] = useState<string>('Cu-Ka');
  const [showDopingSimulator, setShowDopingSimulator] = useState<boolean>(false);
  const [dopantDelta, setDopantDelta] = useState<Record<string, number>>({});
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Parse formula and obtain accurate stoichiometric fractions
  const parsedData = useMemo(() => {
    const raw = (formula || '').trim();
    if (!raw) return null;
    return parseChemicalFormulaAdvanced(raw);
  }, [formula]);

  // Compute elemental constituents with complete crystallographic and physical metrology
  const constituents = useMemo(() => {
    if (!parsedData || !parsedData.valid || parsedData.elements.length === 0) {
      // Fallback: If formula parsing failed or had symbols without numbers, build from initialElements or fallback regex
      const symList = initialElements && initialElements.length > 0
        ? initialElements
        : ((formula || '').match(/([A-Z][a-z]?)/g) || []);
      const uniqueSyms = Array.from(new Set(symList));
      const totalDummy = uniqueSyms.length || 1;

      return uniqueSyms.map(sym => {
        const meta = getElementMetrology(sym);
        return {
          symbol: sym,
          name: meta.name,
          z: meta.z || 1,
          count: 1,
          atomicWeight: meta.atomicWeight || 1,
          mass: meta.atomicWeight || 1,
          massPercent: 100 / totalDummy,
          atomicPercent: 100 / totalDummy,
          scatteringPower: Math.pow(meta.z || 1, 2),
          scatteringPercent: 100 / totalDummy,
          electronCount: meta.z || 1,
          electronPercent: 100 / totalDummy,
          meta
        };
      });
    }

    // Calculate with dynamic doping delta if enabled
    let totalAdjustedMass = 0;
    let totalAdjustedAtoms = 0;
    let totalAdjustedElectrons = 0;
    let totalAdjustedScattering = 0;

    const baseList = parsedData.elements.map(el => {
      const delta = showDopingSimulator ? (dopantDelta[el.symbol] || 0) : 0;
      const count = Math.max(0.01, el.count + delta);
      const meta = getElementMetrology(el.symbol);
      const mass = count * el.atomicWeight;
      const electrons = count * (meta.z || 1);
      const scattering = count * Math.pow(meta.z || 1, 2);

      totalAdjustedMass += mass;
      totalAdjustedAtoms += count;
      totalAdjustedElectrons += electrons;
      totalAdjustedScattering += scattering;

      return {
        symbol: el.symbol,
        name: el.name || meta.name,
        z: meta.z || el.z,
        count,
        baseCount: el.count,
        atomicWeight: el.atomicWeight,
        mass,
        meta,
        electrons,
        scattering
      };
    });

    return baseList.map(item => ({
      ...item,
      massPercent: totalAdjustedMass > 0 ? (item.mass / totalAdjustedMass) * 100 : 0,
      atomicPercent: totalAdjustedAtoms > 0 ? (item.count / totalAdjustedAtoms) * 100 : 0,
      scatteringPercent: totalAdjustedScattering > 0 ? (item.scattering / totalAdjustedScattering) * 100 : 0,
      electronPercent: totalAdjustedElectrons > 0 ? (item.electrons / totalAdjustedElectrons) * 100 : 0,
      totalAdjustedMass,
      totalAdjustedAtoms
    }));
  }, [parsedData, initialElements, formula, showDopingSimulator, dopantDelta]);

  // Overall Phase Crystallographic & Chemical Metrics
  const phaseMetrics = useMemo(() => {
    if (constituents.length === 0) {
      return {
        molarMass: 0,
        averageZ: 0,
        valenceElectronConcentration: 0,
        maxDeltaChi: 0,
        ionicityPercent: 0,
        fluorescenceHazards: []
      };
    }

    const totalMass = constituents.reduce((acc, c) => acc + c.mass, 0);
    const totalAtoms = constituents.reduce((acc, c) => acc + c.count, 0);
    const totalElectrons = constituents.reduce((acc, c) => acc + (c.z * c.count), 0);
    const totalValence = constituents.reduce((acc, c) => acc + (c.meta.valenceElectrons * c.count), 0);

    const averageZ = totalAtoms > 0 ? totalElectrons / totalAtoms : 0;
    const vec = totalAtoms > 0 ? totalValence / totalAtoms : 0;

    // Electronegativities
    const enegs = constituents.map(c => c.meta.electronegativity).filter(en => en > 0);
    const minChi = enegs.length > 0 ? Math.min(...enegs) : 0;
    const maxChi = enegs.length > 0 ? Math.max(...enegs) : 0;
    const maxDeltaChi = enegs.length > 1 ? maxChi - minChi : 0;
    const ionicityPercent = calculateIonicityPercentage(maxDeltaChi);

    // X-ray Fluorescence hazards under selected anode
    const hazards = constituents
      .map(c => ({
        symbol: c.symbol,
        risk: evaluateFluorescenceRisk(c.symbol, selectedAnode)
      }))
      .filter(h => h.risk.isExcited);

    return {
      molarMass: totalMass,
      averageZ,
      valenceElectronConcentration: vec,
      maxDeltaChi,
      ionicityPercent,
      fluorescenceHazards: hazards
    };
  }, [constituents, selectedAnode]);

  // Visual category color palette mapping
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Alkali Metal':
        return {
          glow: 'bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:border-rose-400/60',
          badge: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
          bar: 'bg-gradient-to-r from-rose-600 to-rose-400',
          text: 'text-rose-400'
        };
      case 'Alkaline Earth':
        return {
          glow: 'bg-orange-500/10 text-orange-400 border-orange-500/30 group-hover:border-orange-400/60',
          badge: 'bg-orange-950/80 text-orange-400 border-orange-800/60',
          bar: 'bg-gradient-to-r from-orange-600 to-orange-400',
          text: 'text-orange-400'
        };
      case 'Transition Metal':
        return {
          glow: 'bg-blue-500/10 text-blue-400 border-blue-500/30 group-hover:border-blue-400/60',
          badge: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
          bar: 'bg-gradient-to-r from-blue-600 to-blue-400',
          text: 'text-blue-400'
        };
      case 'Post-Transition Metal':
        return {
          glow: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 group-hover:border-indigo-400/60',
          badge: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60',
          bar: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
          text: 'text-indigo-400'
        };
      case 'Metalloid':
        return {
          glow: 'bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:border-amber-400/60',
          badge: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
          bar: 'bg-gradient-to-r from-amber-600 to-amber-400',
          text: 'text-amber-400'
        };
      case 'Reactive Nonmetal':
        return {
          glow: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:border-emerald-400/60',
          badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
          bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
          text: 'text-emerald-400'
        };
      case 'Halogen':
        return {
          glow: 'bg-teal-500/10 text-teal-400 border-teal-500/30 group-hover:border-teal-400/60',
          badge: 'bg-teal-950/80 text-teal-400 border-teal-800/60',
          bar: 'bg-gradient-to-r from-teal-600 to-teal-400',
          text: 'text-teal-400'
        };
      case 'Lanthanide':
      case 'Actinide':
        return {
          glow: 'bg-purple-500/10 text-purple-400 border-purple-500/30 group-hover:border-purple-400/60',
          badge: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
          bar: 'bg-gradient-to-r from-purple-600 to-purple-400',
          text: 'text-purple-400'
        };
      default:
        return {
          glow: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 group-hover:border-cyan-400/60',
          badge: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60',
          bar: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
          text: 'text-cyan-400'
        };
    }
  };

  const handleCopy = (format: 'summary' | 'cif' | 'csv' | 'json') => {
    let output = '';
    if (format === 'summary') {
      output = `Constituent Elemental Analysis for ${formula} (${materialName || 'Phase'}):\n` +
        `Molar Mass: ${phaseMetrics.molarMass.toFixed(3)} g/mol | Average Z: ${phaseMetrics.averageZ.toFixed(2)} | VEC: ${phaseMetrics.valenceElectronConcentration.toFixed(2)}\n\n` +
        constituents.map(c =>
          `${c.symbol} (${c.name}, Z=${c.z}): ` +
          `Ratio=${c.count.toFixed(3)} | Mass%=${c.massPercent.toFixed(2)}% | At%=${c.atomicPercent.toFixed(2)}% | Electronegativity=${c.meta.electronegativity}`
        ).join('\n');
    } else if (format === 'csv') {
      output = `Symbol,Name,AtomicNumber,StoichiometricCount,AtomicWeight_g_mol,MassPercent,AtomicPercent,ScatteringPowerPercent,PaulingElectronegativity\n` +
        constituents.map(c =>
          `${c.symbol},"${c.name}",${c.z},${c.count.toFixed(3)},${c.atomicWeight.toFixed(3)},${c.massPercent.toFixed(3)},${c.atomicPercent.toFixed(3)},${c.scatteringPercent.toFixed(3)},${c.meta.electronegativity}`
        ).join('\n');
    } else if (format === 'cif') {
      output = `_chemical_formula_sum '${formula}'\n` +
        `_chemical_formula_weight ${phaseMetrics.molarMass.toFixed(3)}\n` +
        `loop_\n` +
        `  _atom_type_symbol\n` +
        `  _atom_type_atomic_number\n` +
        `  _atom_type_atomic_mass\n` +
        `  _atom_type_oxidation_number\n` +
        constituents.map(c => `  ${c.symbol.padEnd(4)} ${c.z.toString().padEnd(3)} ${c.atomicWeight.toFixed(3).padEnd(8)} ${c.meta.commonOxidationStates[0] || 0}`).join('\n');
    } else if (format === 'json') {
      output = JSON.stringify({
        formula,
        materialName,
        molarMass: phaseMetrics.molarMass,
        averageZ: phaseMetrics.averageZ,
        valenceElectronConcentration: phaseMetrics.valenceElectronConcentration,
        ionicityPercent: phaseMetrics.ionicityPercent,
        constituents: constituents.map(c => ({
          symbol: c.symbol,
          name: c.name,
          z: c.z,
          stoichiometricCount: c.count,
          atomicWeight: c.atomicWeight,
          massPercent: c.massPercent,
          atomicPercent: c.atomicPercent,
          scatteringPercent: c.scatteringPercent,
          electronConfig: c.meta.electronConfig,
          electronegativity: c.meta.electronegativity,
          covalentRadiusPm: c.meta.covalentRadiusPm,
          ionicRadiusPm: c.meta.ionicRadiusPm,
          kEdgeKeV: c.meta.kEdgeKeV
        }))
      }, null, 2);
    }

    navigator.clipboard.writeText(output);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const selectedElementDetails = useMemo(() => {
    if (!selectedElementSym) return null;
    const constituent = constituents.find(c => c.symbol === selectedElementSym);
    const meta = getElementMetrology(selectedElementSym);
    const risk = evaluateFluorescenceRisk(selectedElementSym, selectedAnode);
    return { constituent, meta, risk };
  }, [selectedElementSym, constituents, selectedAnode]);

  if (!formula && constituents.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-[#090F1D]/80 border border-slate-800 text-center ${className}`}>
        <FlaskConical className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          No constituent phase chemical data available
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0c1222] via-[#090f1d] to-[#0a1120] p-5 sm:p-6 rounded-3xl border border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 rounded-2xl border border-indigo-500/30 shadow-[inset_0_1px_10px_rgba(99,102,241,0.2)]">
            <Atom className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-black uppercase text-indigo-400/90 tracking-[0.25em]">
                Chemical & Metrological Spectrum
              </span>
              {crystalSystem && (
                <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
                  {crystalSystem}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-serif italic drop-shadow-sm flex items-center gap-2">
              Constituent Phase Elements
              <span className="text-xs font-mono font-bold text-cyan-400 not-italic px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/50">
                {formula}
              </span>
            </h3>
          </div>
        </div>

        {/* Action Toolbars */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => setShowDopingSimulator(!showDopingSimulator)}
            className={`text-xs font-mono font-bold px-3 py-2 rounded-xl border transition-all flex items-center gap-2 ${
              showDopingSimulator
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Stoichiometric Doping & Non-Stoichiometry Simulator"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Doping Tuning</span>
          </button>

          <div className="relative group/export">
            <button className="text-xs font-mono font-bold px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 transition-all">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-[#0d1527] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 hidden group-hover/export:block z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => handleCopy('summary')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>Text Summary</span>
                {copiedFormat === 'summary' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleCopy('csv')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>CSV Table</span>
                {copiedFormat === 'csv' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleCopy('cif')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>CIF Block</span>
                {copiedFormat === 'cif' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleCopy('json')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>JSON Object</span>
                {copiedFormat === 'json' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stoichiometric Physical Chemistry Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Molar Formula Mass
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-mono font-black text-white">
              {phaseMetrics.molarMass.toFixed(3)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">g/mol</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Mean Atomic Number (Z̄)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-mono font-black text-cyan-400">
              {phaseMetrics.averageZ.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">electrons/atom</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Valence Electron Conc. (VEC)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-mono font-black text-indigo-400">
              {phaseMetrics.valenceElectronConcentration.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">e⁻/atom</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Ionicity (Hannay-Smyth)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-mono font-black text-fuchsia-400">
              {phaseMetrics.ionicityPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              (Δχ = {phaseMetrics.maxDeltaChi.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              XRD Fluorescence Audit
            </span>
            <select
              value={selectedAnode}
              onChange={(e) => setSelectedAnode(e.target.value)}
              className="text-[9px] font-mono bg-black/60 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
            >
              <option value="Cu-Ka">Cu-Kα (8.05 keV)</option>
              <option value="Co-Ka">Co-Kα (6.93 keV)</option>
              <option value="Mo-Ka">Mo-Kα (17.48 keV)</option>
              <option value="Cr-Ka">Cr-Kα (5.41 keV)</option>
              <option value="Fe-Ka">Fe-Kα (6.40 keV)</option>
              <option value="Ag-Ka">Ag-Kα (22.16 keV)</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {phaseMetrics.fluorescenceHazards.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                {phaseMetrics.fluorescenceHazards.map(h => h.symbol).join(', ')} Fluoresces!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Minimal background
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Doping & Solid-Solution Playground Drawer (when activated) */}
      {showDopingSimulator && (
        <div className="p-5 bg-gradient-to-br from-[#120d04] via-[#0f0a02] to-[#0a0601] border border-amber-500/30 rounded-3xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-mono font-black text-amber-300 uppercase tracking-wider">
                Stoichiometric Perturbation & Doping Simulator
              </h4>
            </div>
            <button
              onClick={() => setDopantDelta({})}
              className="text-[10px] font-mono uppercase font-bold text-amber-400/70 hover:text-amber-300 px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20"
            >
              Reset to Ideal Stoichiometry
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {constituents.map(c => {
              const delta = dopantDelta[c.symbol] || 0;
              const effective = Math.max(0.01, (c.baseCount || c.count) + delta);
              return (
                <div key={c.symbol} className="p-3 bg-black/60 rounded-xl border border-amber-500/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-amber-400">{c.symbol} ({c.name})</span>
                    <span className="text-white font-mono">
                      n = {effective.toFixed(3)}
                      {delta !== 0 && (
                        <span className={`text-[10px] ml-1 ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)})
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-((c.baseCount || 1) * 0.9)}
                    max={(c.baseCount || 1) * 1.5}
                    step={0.01}
                    value={delta}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDopantDelta(prev => ({ ...prev, [c.symbol]: val }));
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>-90% Deficient</span>
                    <span>Ideal: {(c.baseCount || c.count).toFixed(2)}</span>
                    <span>+150% Rich</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metric Mode Switcher & Segmented Fraction Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-300">
              Constituent Partitioning
            </span>
          </div>

          <div className="flex p-1 bg-black/60 border border-slate-800 rounded-xl gap-1 self-start sm:self-auto">
            <button
              onClick={() => setMetricMode('weight')}
              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'weight'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weight (wt%)
            </button>
            <button
              onClick={() => setMetricMode('atomic')}
              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'atomic'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Atomic (at%)
            </button>
            <button
              onClick={() => setMetricMode('scattering')}
              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'scattering'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="X-ray Thomson scattering cross-section ~ f0²(0) = Z²"
            >
              Scattering Power (f₀²)
            </button>
            <button
              onClick={() => setMetricMode('electrons')}
              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'electrons'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Electrons (e⁻%)
            </button>
          </div>
        </div>

        {/* Segmented Visual Proportion Bar */}
        <div className="w-full h-3 bg-black/60 rounded-full border border-slate-800 overflow-hidden flex shadow-inner">
          {constituents.map(c => {
            const styles = getCategoryStyles(c.meta.category);
            const percent = metricMode === 'weight'
              ? c.massPercent
              : metricMode === 'atomic'
              ? c.atomicPercent
              : metricMode === 'scattering'
              ? c.scatteringPercent
              : c.electronPercent;

            return (
              <div
                key={c.symbol}
                style={{ width: `${percent}%` }}
                className={`h-full ${styles.bar} relative group cursor-pointer transition-all duration-300`}
                onClick={() => setSelectedElementSym(c.symbol)}
                title={`${c.symbol}: ${percent.toFixed(2)}% (${c.name})`}
              />
            );
          })}
        </div>
      </div>

      {/* Constituent Cards Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {constituents.map(c => {
          const styles = getCategoryStyles(c.meta.category);
          const risk = evaluateFluorescenceRisk(c.symbol, selectedAnode);
          const activePercent = metricMode === 'weight'
            ? c.massPercent
            : metricMode === 'atomic'
            ? c.atomicPercent
            : metricMode === 'scattering'
            ? c.scatteringPercent
            : c.electronPercent;

          return (
            <div
              key={c.symbol}
              onClick={() => setSelectedElementSym(c.symbol)}
              className={`p-4 rounded-2xl bg-[#090F1D]/90 border transition-all duration-300 cursor-pointer relative group flex flex-col justify-between min-h-[175px] shadow-[inset_0_1px_15px_rgba(0,0,0,0.4)] ${styles.glow}`}
            >
              {/* Background Accent Glow */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-[25px] opacity-15 group-hover:opacity-35 transition-opacity pointer-events-none" />

              {/* Header: Z Number, Ratio & Fluorescence Flag */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black text-slate-500 group-hover:text-slate-300">
                    Z {c.z}
                  </span>
                  {risk.isExcited && (
                    <span
                      className="p-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px]"
                      title={`${c.symbol} fluoresces under ${selectedAnode}`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-slate-800">
                  n={c.count.toFixed(c.count % 1 === 0 ? 0 : 2)}
                </span>
              </div>

              {/* Symbol & Name */}
              <div className="my-2 relative z-10">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-serif font-black text-white group-hover:scale-105 transition-transform drop-shadow-md">
                    {c.symbol}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold">
                    {c.atomicWeight.toFixed(2)} u
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider truncate mt-0.5 group-hover:text-white">
                  {c.name}
                </div>
              </div>

              {/* Active Metric Percentage & Progress Bar */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-between items-baseline text-[10px] font-mono">
                  <span className="text-slate-500 font-bold uppercase">
                    {metricMode === 'weight' ? 'wt%' : metricMode === 'atomic' ? 'at%' : metricMode === 'scattering' ? 'f₀²%' : 'e⁻%'}
                  </span>
                  <span className="text-white font-black text-xs font-mono">
                    {activePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-black/80 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${Math.min(100, Math.max(2, activePercent))}%` }}
                    className={`h-full ${styles.bar}`}
                  />
                </div>
              </div>

              {/* Footer: Category Badge */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono relative z-10">
                <span className={`px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[85px] ${styles.badge}`}>
                  {c.meta.category}
                </span>
                <span className="text-slate-500 group-hover:text-indigo-400 flex items-center gap-0.5 font-bold">
                  View <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Element Metrology Inspector Modal */}
      {selectedElementDetails && selectedElementDetails.meta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-[#090F1D] border border-slate-700/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0d162b] to-[#090f1d] border-b border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-inner ${getCategoryStyles(selectedElementDetails.meta.category).glow}`}>
                  <span className="text-[10px] font-mono font-black text-slate-400 leading-none">
                    {selectedElementDetails.meta.z}
                  </span>
                  <span className="text-2xl font-serif font-black text-white leading-tight">
                    {selectedElementDetails.meta.symbol}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 leading-none">
                    {selectedElementDetails.meta.atomicWeight.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-black text-indigo-400">
                      Element Deep Metrology
                    </span>
                    <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${getCategoryStyles(selectedElementDetails.meta.category).badge}`}>
                      {selectedElementDetails.meta.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider font-serif">
                    {selectedElementDetails.meta.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedElementSym(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-slate-300">
              {/* Top Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Electron Configuration
                  </span>
                  <span className="text-xs font-mono font-black text-cyan-400">
                    {selectedElementDetails.meta.electronConfig}
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Electronegativity (Pauling)
                  </span>
                  <span className="text-xs font-mono font-black text-yellow-400">
                    χ = {selectedElementDetails.meta.electronegativity || 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Ionic / Covalent Radii
                  </span>
                  <span className="text-xs font-mono font-black text-indigo-400">
                    {selectedElementDetails.meta.ionicRadiusPm} pm / {selectedElementDetails.meta.covalentRadiusPm} pm
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Periodic Location
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    Period {selectedElementDetails.meta.period}, Group {selectedElementDetails.meta.group} ({selectedElementDetails.meta.block}-block)
                  </span>
                </div>
              </div>

              {/* X-Ray Metrology & Fluorescence Box */}
              <div className="p-4 bg-gradient-to-br from-[#0c1220] to-[#070b14] border border-indigo-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    X-ray Metrology & Absorption Edges
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Thomson f₀(0) = {selectedElementDetails.meta.z}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-500 block mb-1">K-Absorption Edge (E_K)</span>
                    <span className="text-white font-black text-sm">
                      {selectedElementDetails.meta.kEdgeKeV ? `${selectedElementDetails.meta.kEdgeKeV.toFixed(3)} keV` : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-500 block mb-1">Kα₁ Emission Line</span>
                    <span className="text-cyan-400 font-black text-sm">
                      {selectedElementDetails.meta.kAlpha1KeV ? `${selectedElementDetails.meta.kAlpha1KeV.toFixed(3)} keV` : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-500 block mb-1">L₃-Edge / Kβ₁</span>
                    <span className="text-purple-400 font-black text-sm">
                      {selectedElementDetails.meta.l3EdgeKeV ? `${selectedElementDetails.meta.l3EdgeKeV.toFixed(3)} keV` : selectedElementDetails.meta.kBeta1KeV ? `${selectedElementDetails.meta.kBeta1KeV.toFixed(3)} keV` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Fluorescence Alert Analysis for Selected Tube */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono ${
                  selectedElementDetails.risk.severity === 'severe'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : selectedElementDetails.risk.severity === 'moderate'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                }`}>
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>{selectedElementDetails.risk.anode} Incident Radiation Check:</span>
                      <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                        {selectedElementDetails.risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {selectedElementDetails.risk.explanation}
                    </p>
                    {selectedElementDetails.risk.recommendedAnodes.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Recommended Alternative Anodes: <span className="text-white font-bold">{selectedElementDetails.risk.recommendedAnodes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Solid-State & Crystal Coordination Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/30 border border-slate-800 rounded-xl">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Pure Standard Structure</span>
                  <span className="text-white font-bold">{selectedElementDetails.meta.pureCrystalStructure}</span>
                </div>
                <div className="p-3 bg-black/30 border border-slate-800 rounded-xl">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Common Oxidation States</span>
                  <span className="text-indigo-400 font-bold">
                    {selectedElementDetails.meta.commonOxidationStates.map(o => (o > 0 ? `+${o}` : o)).join(', ')}
                  </span>
                </div>
                <div className="p-3 bg-black/30 border border-slate-800 rounded-xl">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Mass Attenuation (Cu-Kα)</span>
                  <span className="text-cyan-400 font-bold">
                    {selectedElementDetails.meta.muOverRhoCu ? `${selectedElementDetails.meta.muOverRhoCu.toFixed(1)} cm²/g` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#080d19] border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500">
                Phase: <span className="text-white font-bold">{formula}</span>
              </span>
              <button
                onClick={() => setSelectedElementSym(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
