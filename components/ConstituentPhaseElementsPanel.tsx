import React, { useState, useMemo, useEffect } from 'react';
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
  PieChart,
  ShieldAlert,
  Compass,
  Table,
  LayoutGrid,
  ArrowUpDown,
  Search,
  RotateCcw,
  FileText
} from 'lucide-react';
import { parseChemicalFormulaAdvanced } from '../utils/stoichiometry';
import {
  getElementMetrology,
  evaluateFluorescenceRisk,
  calculateIonicityPercentage,
  ElementMetrology
} from '../utils/elementMetrology';
import {
  MetricMode,
  ElementSortKey,
  ConstituentViewTab,
  ConstituentElementItem,
  LAB_ANODES
} from './constituent/types';
import { ConstituentAttenuationView } from './constituent/ConstituentAttenuationView';
import { ConstituentBondingView } from './constituent/ConstituentBondingView';
import { ConstituentFluorescenceMatrix } from './constituent/ConstituentFluorescenceMatrix';
import { ConstituentDopingSandbox } from './constituent/ConstituentDopingSandbox';
import { ConstituentElementInspector } from './constituent/ConstituentElementInspector';

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
  const [activeTab, setActiveTab] = useState<ConstituentViewTab>('composition');
  const [metricMode, setMetricMode] = useState<MetricMode>('weight');
  const [selectedElementSym, setSelectedElementSym] = useState<string | null>(null);
  const [selectedAnode, setSelectedAnode] = useState<string>('Cu-Ka');
  const [dopantDelta, setDopantDelta] = useState<Record<string, number>>({});
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
  const [sortKey, setSortKey] = useState<ElementSortKey>('formula');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Parse formula and obtain stoichiometric fractions
  const parsedData = useMemo(() => {
    const raw = (formula || '').trim();
    if (!raw) return null;
    return parseChemicalFormulaAdvanced(raw);
  }, [formula]);

  // Compute elemental constituents with complete crystallographic metrology
  const constituents = useMemo<ConstituentElementItem[]>(() => {
    if (!parsedData || !parsedData.valid || parsedData.elements.length === 0) {
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
          baseCount: 1,
          atomicWeight: meta.atomicWeight || 1,
          mass: meta.atomicWeight || 1,
          massPercent: 100 / totalDummy,
          atomicPercent: 100 / totalDummy,
          scattering: Math.pow(meta.z || 1, 2),
          scatteringPercent: 100 / totalDummy,
          electrons: meta.z || 1,
          electronPercent: 100 / totalDummy,
          meta,
          totalAdjustedMass: meta.atomicWeight || 1,
          totalAdjustedAtoms: 1
        };
      });
    }

    let totalAdjustedMass = 0;
    let totalAdjustedAtoms = 0;
    let totalAdjustedElectrons = 0;
    let totalAdjustedScattering = 0;

    const baseList = parsedData.elements.map(el => {
      const delta = dopantDelta[el.symbol] || 0;
      const count = Math.max(0.001, el.count + delta);
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
        z: meta.z || el.z || 1,
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
  }, [parsedData, initialElements, formula, dopantDelta]);

  // Overall Phase Crystallographic & Chemical Metrics
  const phaseMetrics = useMemo(() => {
    if (constituents.length === 0) {
      return {
        molarMass: 0,
        averageZ: 0,
        valenceElectronConcentration: 0,
        maxDeltaChi: 0,
        ionicityPercent: 0,
        fluorescenceHazards: [],
        compoundMuOverRhoCu: 0
      };
    }

    const totalMass = constituents.reduce((acc, c) => acc + c.mass, 0);
    const totalAtoms = constituents.reduce((acc, c) => acc + c.count, 0);
    const totalElectrons = constituents.reduce((acc, c) => acc + (c.z * c.count), 0);
    const totalValence = constituents.reduce((acc, c) => acc + (c.meta.valenceElectrons * c.count), 0);

    const averageZ = totalAtoms > 0 ? totalElectrons / totalAtoms : 0;
    const vec = totalAtoms > 0 ? totalValence / totalAtoms : 0;

    const enegs = constituents.map(c => c.meta.electronegativity).filter(en => en > 0);
    const minChi = enegs.length > 0 ? Math.min(...enegs) : 0;
    const maxChi = enegs.length > 0 ? Math.max(...enegs) : 0;
    const maxDeltaChi = enegs.length > 1 ? maxChi - minChi : 0;
    const ionicityPercent = calculateIonicityPercentage(maxDeltaChi);

    const hazards = constituents
      .map(c => ({
        symbol: c.symbol,
        risk: evaluateFluorescenceRisk(c.symbol, selectedAnode)
      }))
      .filter(h => h.risk.isExcited);

    const compoundMuOverRhoCu = constituents.reduce((acc, c) => {
      const mu = c.meta.muOverRhoCu || (0.016 * Math.pow(c.z, 3.5));
      return acc + (c.massPercent / 100) * mu;
    }, 0);

    return {
      molarMass: totalMass,
      averageZ,
      valenceElectronConcentration: vec,
      maxDeltaChi,
      ionicityPercent,
      fluorescenceHazards: hazards,
      compoundMuOverRhoCu
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

  // Filtered and sorted constituents
  const displayConstituents = useMemo(() => {
    let list = [...constituents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.meta.category.toLowerCase().includes(q)
      );
    }

    switch (sortKey) {
      case 'mass':
        list.sort((a, b) => b.massPercent - a.massPercent);
        break;
      case 'atomic':
        list.sort((a, b) => b.atomicPercent - a.atomicPercent);
        break;
      case 'z':
        list.sort((a, b) => a.z - b.z);
        break;
      case 'electronegativity':
        list.sort((a, b) => b.meta.electronegativity - a.meta.electronegativity);
        break;
      case 'radius':
        list.sort((a, b) => b.meta.ionicRadiusPm - a.meta.ionicRadiusPm);
        break;
      case 'formula':
      default:
        // Keep natural sequence in chemical formula
        break;
    }

    return list;
  }, [constituents, sortKey, searchQuery]);

  // Selected element metrology & fluorescence risk
  const selectedElementDetails = useMemo(() => {
    if (!selectedElementSym) return null;
    const constituent = constituents.find(c => c.symbol === selectedElementSym);
    const meta = getElementMetrology(selectedElementSym);
    const risk = evaluateFluorescenceRisk(selectedElementSym, selectedAnode);
    return { constituent, meta, risk };
  }, [selectedElementSym, constituents, selectedAnode]);

  // Export handlers
  const handleCopy = (format: 'summary' | 'cif' | 'csv' | 'json' | 'latex' | 'markdown') => {
    let output = '';
    if (format === 'summary') {
      output = `Constituent Elemental Analysis for ${formula} (${materialName || 'Phase'}):\n` +
        `Molar Mass: ${phaseMetrics.molarMass.toFixed(3)} g/mol | Average Z: ${phaseMetrics.averageZ.toFixed(2)} | VEC: ${phaseMetrics.valenceElectronConcentration.toFixed(2)} e/atom\n` +
        `Cu-Ka Mass Attenuation: ${phaseMetrics.compoundMuOverRhoCu.toFixed(1)} cm2/g | Bond Ionicity: ${phaseMetrics.ionicityPercent.toFixed(1)}%\n\n` +
        constituents.map(c =>
          `${c.symbol} (${c.name}, Z=${c.z}): ` +
          `Ratio=${c.count.toFixed(3)} | Mass%=${c.massPercent.toFixed(2)}% | At%=${c.atomicPercent.toFixed(2)}% | Electronegativity=${c.meta.electronegativity}`
        ).join('\n');
    } else if (format === 'csv') {
      output = `Symbol,Name,AtomicNumber,StoichiometricCount,AtomicWeight_g_mol,MassPercent,AtomicPercent,ScatteringPowerPercent,PaulingElectronegativity,CuKa_MassAttenuation_cm2_g\n` +
        constituents.map(c =>
          `${c.symbol},"${c.name}",${c.z},${c.count.toFixed(3)},${c.atomicWeight.toFixed(3)},${c.massPercent.toFixed(3)},${c.atomicPercent.toFixed(3)},${c.scatteringPercent.toFixed(3)},${c.meta.electronegativity},${c.meta.muOverRhoCu || 0}`
        ).join('\n');
    } else if (format === 'latex') {
      output = `\\begin{table}[htbp]\n\\centering\n\\caption{Constituent Elemental Analysis for ${formula}}\n\\begin{tabular}{lcccccc}\n\\hline\n` +
        `Element & $Z$ & Weight (u) & Count ($n$) & Mass (wt\\%) & Atomic (at\\%) & $f_0^2$ (\\%) \\\\\n\\hline\n` +
        constituents.map(c =>
          `${c.symbol} (${c.name}) & ${c.z} & ${c.atomicWeight.toFixed(2)} & ${c.count.toFixed(3)} & ${c.massPercent.toFixed(2)} & ${c.atomicPercent.toFixed(2)} & ${c.scatteringPercent.toFixed(2)} \\\\`
        ).join('\n') +
        `\n\\hline\n\\end{tabular}\n\\end{table}`;
    } else if (format === 'markdown') {
      output = `| Element | Z | Atomic Weight (u) | Stoichiometry (n) | Mass Fraction (wt%) | Atomic Fraction (at%) | Scattering Share (f0^2%) |\n` +
        `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n` +
        constituents.map(c =>
          `| **${c.symbol}** (${c.name}) | ${c.z} | ${c.atomicWeight.toFixed(2)} | ${c.count.toFixed(3)} | ${c.massPercent.toFixed(2)}% | ${c.atomicPercent.toFixed(2)}% | ${c.scatteringPercent.toFixed(2)}% |`
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
        crystalSystem,
        spaceGroup,
        molarMass: phaseMetrics.molarMass,
        averageZ: phaseMetrics.averageZ,
        valenceElectronConcentration: phaseMetrics.valenceElectronConcentration,
        ionicityPercent: phaseMetrics.ionicityPercent,
        compoundMuOverRhoCu: phaseMetrics.compoundMuOverRhoCu,
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
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-black uppercase text-indigo-400/90 tracking-[0.25em]">
                Chemical & Metrological Spectrum
              </span>
              {crystalSystem && (
                <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
                  {crystalSystem}
                </span>
              )}
              {spaceGroup && (
                <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-indigo-300 border border-slate-700">
                  {spaceGroup}
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

        {/* Action Toolbars & Export */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <div className="relative group/export">
            <button className="text-xs font-mono font-bold px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 transition-all">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Ledger</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-[#0d1527] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 hidden group-hover/export:block z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => handleCopy('summary')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>Text Summary</span>
                {copiedFormat === 'summary' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleCopy('markdown')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>Markdown Table</span>
                {copiedFormat === 'markdown' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleCopy('latex')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>LaTeX Table</span>
                {copiedFormat === 'latex' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleCopy('csv')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center justify-between"
              >
                <span>CSV Spreadsheet</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <span className="text-[10px] font-mono text-slate-400 font-bold">e⁻/atom</span>
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
              (Δχ={phaseMetrics.maxDeltaChi.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Cu-Kα Mass Attenuation
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
              {phaseMetrics.compoundMuOverRhoCu.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">cm²/g</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#090F1D]/90 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              XRD Fluorescence Audit
            </span>
            <select
              value={selectedAnode}
              onChange={(e) => setSelectedAnode(e.target.value)}
              className="text-[9px] font-mono bg-black/60 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
            >
              {LAB_ANODES.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {phaseMetrics.fluorescenceHazards.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                {phaseMetrics.fluorescenceHazards.map(h => h.symbol).join(', ')} Fluoresces
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

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('composition')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'composition'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-indigo-400" />
          <span>Composition & Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('attenuation')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'attenuation'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>X-Ray Attenuation & Depth</span>
        </button>

        <button
          onClick={() => setActiveTab('bonding')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'bonding'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Bonding & Coordination</span>
        </button>

        <button
          onClick={() => setActiveTab('fluorescence')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'fluorescence'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Anode Suitability Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('doping')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'doping'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Doping Sandbox</span>
        </button>
      </div>

      {/* TAB 1: COMPOSITION & MATRIX */}
      {activeTab === 'composition' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Controls Bar: Metric Mode, Sort, Search, Layout */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-black/40 p-3 rounded-2xl border border-slate-800">
            {/* Metric Mode Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase mr-1">
                Metric:
              </span>
              <button
                onClick={() => setMetricMode('weight')}
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                  metricMode === 'weight'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weight (wt%)
              </button>
              <button
                onClick={() => setMetricMode('atomic')}
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                  metricMode === 'atomic'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Atomic (at%)
              </button>
              <button
                onClick={() => setMetricMode('scattering')}
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                  metricMode === 'scattering'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Thomson scattering power f0²(0) ~ Z²"
              >
                Scattering (f₀²)
              </button>
              <button
                onClick={() => setMetricMode('electrons')}
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition-all ${
                  metricMode === 'electrons'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Electrons (e⁻%)
              </button>
            </div>

            {/* Sort & Search & Layout Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/60 border border-slate-700/80 rounded-xl pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32 sm:w-40"
                />
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-slate-300">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as ElementSortKey)}
                  className="bg-transparent focus:outline-none text-slate-200"
                >
                  <option value="formula">Formula Order</option>
                  <option value="mass">Mass % (wt↓)</option>
                  <option value="atomic">Atomic % (at↓)</option>
                  <option value="z">Atomic Number Z (↑)</option>
                  <option value="electronegativity">Electronegativity χ (↓)</option>
                  <option value="radius">Ionic Radius (↓)</option>
                </select>
              </div>

              <div className="flex bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Card Bento Matrix View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Tabular Data Sheet View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Segmented Visual Proportion Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3.5 bg-black/60 rounded-full border border-slate-800 overflow-hidden flex shadow-inner">
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
                    className={`h-full ${styles.bar} relative group cursor-pointer transition-all duration-300 ${
                      selectedElementSym === c.symbol ? 'ring-2 ring-white shadow-lg brightness-125' : 'hover:opacity-90'
                    }`}
                    onClick={() => {
                      setSelectedElementSym(selectedElementSym === c.symbol ? null : c.symbol);
                    }}
                    title={`${c.symbol}: ${percent.toFixed(2)}% (${c.name}) - Click to inspect element properties`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>0%</span>
              <span className="uppercase tracking-widest font-bold">
                Partitioning Mode: {metricMode === 'weight' ? 'Mass Fraction (wt%)' : metricMode === 'atomic' ? 'Stoichiometric Atomic Share (at%)' : metricMode === 'scattering' ? 'Scattering Cross-Section (f₀²)' : 'Electron Share (e⁻%)'}
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* GRID LAYOUT */}
          {layoutMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {displayConstituents.map(c => {
                const styles = getCategoryStyles(c.meta.category);
                const risk = evaluateFluorescenceRisk(c.symbol, selectedAnode);
                const isSelected = selectedElementSym === c.symbol;
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
                    onClick={() => setSelectedElementSym(isSelected ? null : c.symbol)}
                    className={`p-4 rounded-2xl bg-[#090F1D]/90 border transition-all duration-300 cursor-pointer relative group flex flex-col justify-between min-h-[185px] shadow-[inset_0_1px_15px_rgba(0,0,0,0.4)] ${
                      isSelected
                        ? 'ring-2 ring-indigo-400 bg-[#0f172a] border-indigo-400/90 shadow-[0_0_25px_rgba(99,102,241,0.5)] scale-[1.02]'
                        : `${styles.glow} hover:border-slate-600`
                    }`}
                  >
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

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono relative z-10">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[85px] ${styles.badge}`}>
                        {c.meta.category}
                      </span>
                      {isSelected ? (
                        <span className="text-indigo-300 font-black flex items-center gap-0.5 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/40">
                          Active <Check className="w-2.5 h-2.5 text-indigo-400" />
                        </span>
                      ) : (
                        <span className="text-slate-500 group-hover:text-indigo-400 flex items-center gap-0.5 font-bold">
                          Inspect <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABULAR LAYOUT */}
          {layoutMode === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#090F1D]/90 shadow-xl custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-black/60 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Element</th>
                    <th className="p-3">Z</th>
                    <th className="p-3">Atomic Wt</th>
                    <th className="p-3">Count (n)</th>
                    <th className="p-3">Mass (wt%)</th>
                    <th className="p-3">Atomic (at%)</th>
                    <th className="p-3">Scattering (f₀²)</th>
                    <th className="p-3">Electronegativity</th>
                    <th className="p-3">Shannon Radius</th>
                    <th className="p-3">Cu-Kα μ/ρ</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {displayConstituents.map(c => {
                    const isSelected = selectedElementSym === c.symbol;
                    const styles = getCategoryStyles(c.meta.category);

                    return (
                      <tr
                        key={c.symbol}
                        onClick={() => setSelectedElementSym(isSelected ? null : c.symbol)}
                        className={`hover:bg-indigo-950/20 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-400 font-bold' : ''
                        }`}
                      >
                        <td className="p-3 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-black text-white text-xs ${styles.badge}`}>
                            {c.symbol}
                          </span>
                          <span className="text-white font-bold">{c.name}</span>
                        </td>
                        <td className="p-3 text-slate-400">{c.z}</td>
                        <td className="p-3">{c.atomicWeight.toFixed(2)}</td>
                        <td className="p-3 font-bold text-white">{c.count.toFixed(3)}</td>
                        <td className="p-3 text-indigo-300 font-bold">{c.massPercent.toFixed(2)}%</td>
                        <td className="p-3 text-cyan-300 font-bold">{c.atomicPercent.toFixed(2)}%</td>
                        <td className="p-3 text-purple-300 font-bold">{c.scatteringPercent.toFixed(2)}%</td>
                        <td className="p-3 text-yellow-300">χ = {c.meta.electronegativity || 'N/A'}</td>
                        <td className="p-3 text-slate-400">{c.meta.ionicRadiusPm} pm</td>
                        <td className="p-3 text-emerald-400">{c.meta.muOverRhoCu ? `${c.meta.muOverRhoCu.toFixed(1)} cm²/g` : 'N/A'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementSym(isSelected ? null : c.symbol);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 bg-indigo-500/10 rounded-lg"
                          >
                            {isSelected ? 'Active' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Periodic Table Distribution Footprint */}
          <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Periodic Table Classification Footprint:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {constituents.map(c => {
                const styles = getCategoryStyles(c.meta.category);
                return (
                  <div
                    key={c.symbol}
                    onClick={() => setSelectedElementSym(c.symbol)}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      selectedElementSym === c.symbol
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-black/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-serif font-black text-sm">{c.symbol}</span>
                    <span className="text-[10px] text-slate-400">
                      Period {c.meta.period}, Grp {c.meta.group} ({c.meta.block}-block)
                    </span>
                    <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${styles.badge}`}>
                      {c.meta.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: X-RAY ATTENUATION & PENETRATION DEPTH */}
      {activeTab === 'attenuation' && (
        <ConstituentAttenuationView
          constituents={constituents}
          density={density}
          formula={formula}
        />
      )}

      {/* TAB 3: CRYSTAL CHEMISTRY & COORDINATION */}
      {activeTab === 'bonding' && (
        <ConstituentBondingView
          constituents={constituents}
          formula={formula}
        />
      )}

      {/* TAB 4: MULTI-ANODE RADIATION MATRIX */}
      {activeTab === 'fluorescence' && (
        <ConstituentFluorescenceMatrix
          constituents={constituents}
          selectedAnode={selectedAnode}
          onSelectAnode={setSelectedAnode}
          formula={formula}
        />
      )}

      {/* TAB 5: STOPICHIOMETRIC DOPING & NON-STOICHIOMETRY SANDBOX */}
      {activeTab === 'doping' && (
        <ConstituentDopingSandbox
          constituents={constituents}
          dopantDelta={dopantDelta}
          onDeltaChange={(sym, delta) => setDopantDelta(prev => ({ ...prev, [sym]: delta }))}
          onReset={() => setDopantDelta({})}
          formula={formula}
        />
      )}

      {/* DEDICATED INLINE ELEMENT PROPERTY INSPECTOR */}
      {selectedElementDetails && selectedElementDetails.meta && (
        <ConstituentElementInspector
          element={selectedElementDetails.constituent!}
          meta={selectedElementDetails.meta}
          risk={selectedElementDetails.risk}
          selectedAnode={selectedAnode}
          onSelectAnode={setSelectedAnode}
          onDeselect={() => setSelectedElementSym(null)}
          formula={formula}
          categoryStyles={getCategoryStyles(selectedElementDetails.meta.category)}
        />
      )}
    </div>
  );
};
