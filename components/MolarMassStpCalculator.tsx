import React, { useState, useMemo } from 'react';
import { 
  Cloud, 
  Layers, 
  Droplets, 
  Sparkles, 
  Activity, 
  ArrowRightLeft, 
  Zap, 
  Gauge, 
  Wind, 
  Calculator, 
  Compass, 
  Check, 
  Copy, 
  HelpCircle,
  TrendingUp,
  Box,
  Scale,
  RefreshCw,
  Sliders,
  Atom,
  FlaskConical
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';
import { LiveStoichiometryEngine } from './LiveStoichiometryEngine';

export interface ElementStpInfo {
  number: number;
  symbol: string;
  name: string;
  weight: number; // atomic weight in g/mol
  meltingPoint: number; // °C
  boilingPoint?: number; // °C
  density: number; // g/cm³
  crystalStructure?: string;
  category?: string;
}

interface MolarMassStpCalculatorProps {
  element: ElementStpInfo;
  allElements?: ElementStpInfo[];
  onSelectElement?: (atomicNumber: number) => void;
}

// Standards of Temperature and Pressure
export type StpStandardType = 'IUPAC' | 'STP_CLASSIC' | 'SATP' | 'NTP' | 'CUSTOM';

interface StandardSpec {
  id: StpStandardType;
  label: string;
  shortLabel: string;
  tempC: number;
  tempK: number;
  pressKPa: number;
  pressAtm: number;
  pressBar: number;
  idealMolarVolumeL: number; // L/mol
  description: string;
}

const STANDARDS_SPECS: Record<StpStandardType, StandardSpec> = {
  IUPAC: {
    id: 'IUPAC',
    label: 'IUPAC Standard (1982–Present)',
    shortLabel: 'IUPAC (0°C, 1 bar)',
    tempC: 0,
    tempK: 273.15,
    pressKPa: 100.0,
    pressAtm: 0.986923,
    pressBar: 1.0,
    idealMolarVolumeL: 22.710955,
    description: 'Current IUPAC international standard benchmark (0 °C, 100 kPa / 1 bar).'
  },
  STP_CLASSIC: {
    id: 'STP_CLASSIC',
    label: 'Classic STP (NIST / 1 atm)',
    shortLabel: 'STP (0°C, 1 atm)',
    tempC: 0,
    tempK: 273.15,
    pressKPa: 101.325,
    pressAtm: 1.0,
    pressBar: 1.01325,
    idealMolarVolumeL: 22.413962,
    description: 'Traditional standard temperature and pressure at sea-level atmosphere (0 °C, 1 atm).'
  },
  SATP: {
    id: 'SATP',
    label: 'SATP (Standard Ambient)',
    shortLabel: 'SATP (25°C, 1 bar)',
    tempC: 25,
    tempK: 298.15,
    pressKPa: 100.0,
    pressAtm: 0.986923,
    pressBar: 1.0,
    idealMolarVolumeL: 24.789570,
    description: 'Standard Ambient Temperature and Pressure used in modern thermodynamics (25 °C, 1 bar).'
  },
  NTP: {
    id: 'NTP',
    label: 'NTP (Normal Temp & Pressure)',
    shortLabel: 'NTP (20°C, 1 atm)',
    tempC: 20,
    tempK: 293.15,
    pressKPa: 101.325,
    pressAtm: 1.0,
    pressBar: 1.01325,
    idealMolarVolumeL: 24.054714,
    description: 'Normal temperature and pressure standard widely used in engineering and ventilation (20 °C, 1 atm).'
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom In-Situ State (T, P)',
    shortLabel: 'Custom (T, P)',
    tempC: 25,
    tempK: 298.15,
    pressKPa: 101.325,
    pressAtm: 1.0,
    pressBar: 1.01325,
    idealMolarVolumeL: 24.4654,
    description: 'User-specified arbitrary temperature and pressure conditions.'
  }
};

// Allotropic/Natural state at standard condition
interface AllotropeSpec {
  formula: string;
  atomsPerMolecule: number;
  name: string;
  vanDerWaalsA?: number; // L²·bar/mol²
  vanDerWaalsB?: number; // L/mol
  kineticDiameterPm?: number; // pm
}

const NATURAL_GAS_MOLECULES: Record<string, AllotropeSpec> = {
  H: { formula: 'H₂', atomsPerMolecule: 2, name: 'Dihydrogen gas', vanDerWaalsA: 0.2476, vanDerWaalsB: 0.0266, kineticDiameterPm: 289 },
  N: { formula: 'N₂', atomsPerMolecule: 2, name: 'Dinitrogen gas', vanDerWaalsA: 1.370, vanDerWaalsB: 0.0387, kineticDiameterPm: 364 },
  O: { formula: 'O₂', atomsPerMolecule: 2, name: 'Dioxygen gas', vanDerWaalsA: 1.382, vanDerWaalsB: 0.0319, kineticDiameterPm: 346 },
  F: { formula: 'F₂', atomsPerMolecule: 2, name: 'Difluorine gas', vanDerWaalsA: 1.171, vanDerWaalsB: 0.0290, kineticDiameterPm: 330 },
  Cl: { formula: 'Cl₂', atomsPerMolecule: 2, name: 'Dichlorine gas', vanDerWaalsA: 6.579, vanDerWaalsB: 0.0562, kineticDiameterPm: 420 },
  He: { formula: 'He', atomsPerMolecule: 1, name: 'Helium gas (monatomic)', vanDerWaalsA: 0.0346, vanDerWaalsB: 0.0238, kineticDiameterPm: 140 },
  Ne: { formula: 'Ne', atomsPerMolecule: 1, name: 'Neon gas (monatomic)', vanDerWaalsA: 0.2135, vanDerWaalsB: 0.0171, kineticDiameterPm: 154 },
  Ar: { formula: 'Ar', atomsPerMolecule: 1, name: 'Argon gas (monatomic)', vanDerWaalsA: 1.355, vanDerWaalsB: 0.0320, kineticDiameterPm: 188 },
  Kr: { formula: 'Kr', atomsPerMolecule: 1, name: 'Krypton gas (monatomic)', vanDerWaalsA: 2.349, vanDerWaalsB: 0.0398, kineticDiameterPm: 202 },
  Xe: { formula: 'Xe', atomsPerMolecule: 1, name: 'Xenon gas (monatomic)', vanDerWaalsA: 4.250, vanDerWaalsB: 0.0510, kineticDiameterPm: 216 },
  Rn: { formula: 'Rn', atomsPerMolecule: 1, name: 'Radon gas (monatomic)', vanDerWaalsA: 6.600, vanDerWaalsB: 0.0624, kineticDiameterPm: 220 },
  Br: { formula: 'Br₂', atomsPerMolecule: 2, name: 'Dibromine (volatile liquid)', vanDerWaalsA: 9.750, vanDerWaalsB: 0.0591, kineticDiameterPm: 450 },
  I: { formula: 'I₂', atomsPerMolecule: 2, name: 'Diiodine crystal', vanDerWaalsA: 12.0, vanDerWaalsB: 0.068, kineticDiameterPm: 480 },
  P: { formula: 'P₄', atomsPerMolecule: 4, name: 'White Phosphorus', vanDerWaalsA: 15.0, vanDerWaalsB: 0.090, kineticDiameterPm: 500 },
  S: { formula: 'S₈', atomsPerMolecule: 8, name: 'Octasulfur ring', vanDerWaalsA: 20.0, vanDerWaalsB: 0.120, kineticDiameterPm: 550 },
};

// Physical Constants (CODATA Recommended)
const R_IDEAL_J_MOL_K = 8.314462618; // J/(mol·K) or L·kPa/(mol·K)
const R_IDEAL_L_BAR_MOL_K = 0.083144626; // L·bar/(mol·K)
const N_AVOGADRO = 6.02214076e23; // mol⁻¹
const K_BOLTZMANN = 1.380649e-23; // J/K
const F_FARADAY = 96485.33212; // C/mol

// Helper to parse chemical formulas into elemental composition
function parseChemicalFormula(formula: string, elementWeights: Record<string, number>): {
  valid: boolean;
  molarMass: number;
  elements: { symbol: string; count: number; massPercent: number; atomicWeight: number }[];
  totalAtomsPerFormula: number;
} {
  try {
    const clean = formula.trim().replace(/\s+/g, '');
    if (!clean) return { valid: false, molarMass: 0, elements: [], totalAtomsPerFormula: 0 };

    // Matches ElementSymbol followed by optional integer/decimal count
    const regex = /([A-Z][a-z]*)(\d*\.?\d*)/g;
    let match;
    const counts: Record<string, number> = {};
    let matchedLength = 0;

    while ((match = regex.exec(clean)) !== null) {
      const sym = match[1];
      const count = match[2] ? parseFloat(match[2]) : 1;
      matchedLength += match[0].length;
      counts[sym] = (counts[sym] || 0) + count;
    }

    if (matchedLength !== clean.length || Object.keys(counts).length === 0) {
      return { valid: false, molarMass: 0, elements: [], totalAtomsPerFormula: 0 };
    }

    let totalMass = 0;
    let totalAtoms = 0;
    const elementsList: { symbol: string; count: number; massPercent: number; atomicWeight: number }[] = [];

    for (const [sym, count] of Object.entries(counts)) {
      const aw = elementWeights[sym] || 0;
      if (aw === 0) return { valid: false, molarMass: 0, elements: [], totalAtomsPerFormula: 0 };
      const elMass = count * aw;
      totalMass += elMass;
      totalAtoms += count;
    }

    for (const [sym, count] of Object.entries(counts)) {
      const aw = elementWeights[sym] || 0;
      const elMass = count * aw;
      elementsList.push({
        symbol: sym,
        count,
        massPercent: totalMass > 0 ? (elMass / totalMass) * 100 : 0,
        atomicWeight: aw
      });
    }

    return {
      valid: true,
      molarMass: totalMass,
      elements: elementsList.sort((a, b) => b.massPercent - a.massPercent),
      totalAtomsPerFormula: totalAtoms
    };
  } catch (e) {
    return { valid: false, molarMass: 0, elements: [], totalAtomsPerFormula: 0 };
  }
}

export const MolarMassStpCalculator: React.FC<MolarMassStpCalculatorProps> = ({
  element,
  allElements = [],
  onSelectElement
}) => {
  // Mode selection
  const [activeTab, setActiveTab] = useState<'reactions' | 'single' | 'thermo' | 'condensed' | 'compound'>('reactions');
  const [selectedStandard, setSelectedStandard] = useState<StpStandardType>('IUPAC');
  const [basisMode, setBasisMode] = useState<'atomic' | 'molecular'>('molecular');
  
  // Custom T & P states
  const [customTempC, setCustomTempC] = useState<number>(25);
  const [customPressKPa, setCustomPressKPa] = useState<number>(101.325);

  // Stoichiometry Calculator input state
  const [molesStr, setMolesStr] = useState<string>('1.0');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Compound Formula Analyzer state
  const [compoundFormula, setCompoundFormula] = useState<string>(
    element.symbol === 'Si' ? 'SiO2' :
    element.symbol === 'Ti' ? 'TiO2' :
    element.symbol === 'Ba' ? 'BaTiO3' :
    element.symbol === 'Fe' ? 'Fe2O3' :
    element.symbol === 'Cu' ? 'YBa2Cu3O7' :
    `${element.symbol}2O3`
  );

  // Map element weights for the formula parser
  const elementWeightsMap = useMemo(() => {
    const map: Record<string, number> = {};
    allElements.forEach(el => {
      map[el.symbol] = el.weight;
    });
    // Ensure current element is definitely present
    map[element.symbol] = element.weight;
    return map;
  }, [allElements, element]);

  // Current active standard parameters
  const currentStandard = useMemo(() => {
    if (selectedStandard === 'CUSTOM') {
      const tempK = customTempC + 273.15;
      const pressBar = customPressKPa / 100.0;
      const pressAtm = customPressKPa / 101.325;
      const idealMolarVolumeL = pressBar > 0 ? (R_IDEAL_L_BAR_MOL_K * tempK) / pressBar : 24.789;
      return {
        id: 'CUSTOM' as StpStandardType,
        label: `Custom In-Situ (${customTempC.toFixed(1)}°C, ${customPressKPa.toFixed(2)} kPa)`,
        shortLabel: `Custom (${customTempC.toFixed(1)}°C, ${customPressKPa.toFixed(1)} kPa)`,
        tempC: customTempC,
        tempK,
        pressKPa: customPressKPa,
        pressAtm,
        pressBar,
        idealMolarVolumeL,
        description: `Custom environment at ${customTempC.toFixed(2)} °C (${tempK.toFixed(2)} K) and ${customPressKPa.toFixed(2)} kPa (${pressAtm.toFixed(3)} atm).`
      };
    }
    return STANDARDS_SPECS[selectedStandard];
  }, [selectedStandard, customTempC, customPressKPa]);

  // Allotrope / Molecular info
  const allotropeInfo = useMemo<AllotropeSpec>(() => {
    return NATURAL_GAS_MOLECULES[element.symbol] || {
      formula: element.symbol,
      atomsPerMolecule: 1,
      name: `${element.name} (Atomic/Crystalline)`
    };
  }, [element]);

  const hasDistinctMolecularForm = allotropeInfo.atomsPerMolecule > 1;

  // Effective Active Species Molar Mass & Multiplier
  const effectiveMultiplier = (basisMode === 'molecular' && hasDistinctMolecularForm) 
    ? allotropeInfo.atomsPerMolecule 
    : 1;

  const effectiveMolarMass = element.weight * effectiveMultiplier;
  const effectiveSpeciesFormula = (basisMode === 'molecular' && hasDistinctMolecularForm)
    ? allotropeInfo.formula
    : element.symbol;

  // State of matter at the selected temperature
  const stateOfMatter = useMemo<'solid' | 'liquid' | 'gas'>(() => {
    const tempC = currentStandard.tempC;
    const mp = element.meltingPoint;
    const bp = element.boilingPoint ?? 3000;

    if (tempC < mp) return 'solid';
    if (tempC < bp) return 'liquid';
    return 'gas';
  }, [currentStandard.tempC, element.meltingPoint, element.boilingPoint]);

  // Van der Waals real gas calculations
  const vanDerWaalsCalc = useMemo(() => {
    const a = allotropeInfo.vanDerWaalsA ?? 1.5;
    const b = allotropeInfo.vanDerWaalsB ?? 0.035;
    const T = currentStandard.tempK;
    const P_bar = currentStandard.pressBar;
    const R = R_IDEAL_L_BAR_MOL_K;

    const V_ideal = (R * T) / P_bar;

    // Cubic solver for Van der Waals: P*V^3 - (P*b + R*T)*V^2 + a*V - a*b = 0
    // Simplified iterative Newton-Raphson approximation starting from V_ideal
    let V_real = V_ideal;
    for (let iter = 0; iter < 10; iter++) {
      const f = P_bar * Math.pow(V_real, 3) - (P_bar * b + R * T) * Math.pow(V_real, 2) + a * V_real - a * b;
      const fPrime = 3 * P_bar * Math.pow(V_real, 2) - 2 * (P_bar * b + R * T) * V_real + a;
      if (Math.abs(fPrime) < 1e-9) break;
      const nextV = V_real - f / fPrime;
      if (nextV <= b) break;
      V_real = nextV;
    }

    const compressibilityZ = (P_bar * V_real) / (R * T);
    const deviationPercent = ((V_real - V_ideal) / V_ideal) * 100;
    const realGasDensityGL = V_real > 0 ? effectiveMolarMass / V_real : 0;
    const idealGasDensityGL = V_ideal > 0 ? effectiveMolarMass / V_ideal : 0;

    return {
      a,
      b,
      idealMolarVolumeL: V_ideal,
      realMolarVolumeL: V_real,
      compressibilityZ,
      deviationPercent,
      realGasDensityGL,
      idealGasDensityGL
    };
  }, [allotropeInfo, currentStandard, effectiveMolarMass]);

  // Kinetic Theory of Gases Microscopic Dynamics
  const kineticTheory = useMemo(() => {
    const M_kg = effectiveMolarMass / 1000.0; // kg/mol
    const T = currentStandard.tempK;
    const P_pa = currentStandard.pressKPa * 1000.0;
    const d_m = (allotropeInfo.kineticDiameterPm ?? 300) * 1e-12; // meters

    // Speeds in m/s
    const vRms = Math.sqrt((3 * R_IDEAL_J_MOL_K * T) / M_kg);
    const vAvg = Math.sqrt((8 * R_IDEAL_J_MOL_K * T) / (Math.PI * M_kg));
    const vMp = Math.sqrt((2 * R_IDEAL_J_MOL_K * T) / M_kg);

    // Mean Free Path (m) = (k_B * T) / (sqrt(2) * pi * d^2 * P)
    const crossSection = Math.PI * Math.pow(d_m, 2);
    const meanFreePathM = (K_BOLTZMANN * T) / (Math.SQRT2 * crossSection * P_pa);
    const meanFreePathNm = meanFreePathM * 1e9;

    // Collision Frequency (s⁻¹) = vAvg / lambda
    const collisionFrequencyHz = meanFreePathM > 0 ? vAvg / meanFreePathM : 0;

    // Average Kinetic Energy per Molecule (Joules and meV)
    const energyJoules = 1.5 * K_BOLTZMANN * T;
    const energyMilliEV = (energyJoules / 1.602176634e-19) * 1000;

    return {
      vRms,
      vAvg,
      vMp,
      meanFreePathNm,
      collisionFrequencyHz,
      energyJoules,
      energyMilliEV,
      diameterPm: allotropeInfo.kineticDiameterPm ?? 300
    };
  }, [effectiveMolarMass, currentStandard, allotropeInfo]);

  // Condensed Phase (Solid/Liquid) Crystallographic parameters
  const condensedProperties = useMemo(() => {
    const density = element.density > 0 ? element.density : 1.0; // g/cm³
    // Molar Volume in cm³/mol = (M g/mol) / (density g/cm³)
    const molarVolumeCm3 = effectiveMolarMass / density;
    const molarVolumeL = molarVolumeCm3 / 1000.0; // L/mol

    // Unit cell volume per atom/molecule (in Å³)
    // Omega = (MolarVolume in cm³/mol * 1e24 Å³/cm³) / N_A
    const volumePerAtomAngstrom3 = (molarVolumeCm3 * 1e24) / (N_AVOGADRO * effectiveMultiplier);

    // Wigner-Seitz radius r_WS = (3*Omega / 4*pi)^(1/3)
    const wignerSeitzRadiusAngstrom = Math.cbrt((3 * volumePerAtomAngstrom3) / (4 * Math.PI));

    // Number density (atoms/cm³ and atoms/Å³)
    const numberDensityAtomsCm3 = (density * N_AVOGADRO) / element.weight;
    const numberDensityAtomsAngstrom3 = numberDensityAtomsCm3 * 1e-24;

    // Solid-to-Gas Expansion Ratio
    const gasVolumeL = currentStandard.idealMolarVolumeL;
    const expansionRatio = molarVolumeL > 0 ? gasVolumeL / molarVolumeL : 1;

    return {
      density,
      molarVolumeCm3,
      molarVolumeL,
      volumePerAtomAngstrom3,
      wignerSeitzRadiusAngstrom,
      numberDensityAtomsCm3,
      numberDensityAtomsAngstrom3,
      expansionRatio
    };
  }, [element, effectiveMolarMass, effectiveMultiplier, currentStandard]);

  // Stoichiometry Dynamic Multi-Unit Conversions
  const parsedMoles = parseFloat(molesStr) || 0;

  const stoichiometricValues = useMemo(() => {
    const n = Math.max(0, parsedMoles);
    const massG = n * effectiveMolarMass;
    const massKg = massG / 1000.0;
    
    // Volume depending on state
    const effectiveMolarVolL = stateOfMatter === 'gas' 
      ? vanDerWaalsCalc.realMolarVolumeL 
      : condensedProperties.molarVolumeL;

    const volumeL = n * effectiveMolarVolL;
    const volumeCm3 = volumeL * 1000.0;
    const volumeM3 = volumeL / 1000.0;

    const totalMolecules = n * N_AVOGADRO;
    const totalAtoms = totalMolecules * effectiveMultiplier;

    const totalElectrons = totalAtoms * element.number;
    const totalFaradayChargeC = n * element.number * effectiveMultiplier * F_FARADAY;

    return {
      moles: n,
      massG,
      massKg,
      volumeL,
      volumeCm3,
      volumeM3,
      totalMolecules,
      totalAtoms,
      totalElectrons,
      totalFaradayChargeC,
      effectiveMolarVolL
    };
  }, [parsedMoles, effectiveMolarMass, stateOfMatter, vanDerWaalsCalc, condensedProperties, effectiveMultiplier, element.number]);

  // Compound Formula Parser
  const parsedCompound = useMemo(() => {
    return parseChemicalFormula(compoundFormula, elementWeightsMap);
  }, [compoundFormula, elementWeightsMap]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    playSynthTone('chime');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-200">
      {/* Header Banner & Sub-Navigation */}
      <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-purple-900/40 p-5 rounded-2xl border border-sky-500/20 shadow-lg relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300">
                <Cloud className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Molar Mass & Standard State (STP / SATP / In-Situ)
              </h3>
            </div>
            <p className="text-xs text-sky-200/70 max-w-2xl font-sans">
              Rigorous stoichiometric conversions, real-gas Van der Waals corrections, Maxwell-Boltzmann microscopic kinetics, and condensed matter unit cell volume metrics.
            </p>
          </div>

          {/* Quick Species Badge */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-sky-500/30 px-3.5 py-2 rounded-xl text-right">
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Selected Element</span>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <span className="text-sky-400 font-black">{element.symbol}</span>
                <span className="text-xs text-slate-300 font-normal">({element.name}, Z={element.number})</span>
              </div>
            </div>
            <div className="pl-3 border-l border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-sky-400 font-mono block">Standard A_r</span>
              <span className="text-sm font-extrabold text-sky-300 font-mono">{element.weight.toFixed(4)} <span className="text-[10px] text-slate-400 font-normal">g/mol</span></span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
          {[
            { id: 'reactions', label: 'Live Reaction & Stoichiometry Suite', icon: FlaskConical },
            { id: 'single', label: 'Single-Species Converter', icon: Calculator },
            { id: 'thermo', label: 'Gas Thermodynamics & Kinetics', icon: Wind },
            { id: 'condensed', label: 'Condensed Phase (Solid/Liquid)', icon: Box },
            { id: 'compound', label: 'Compound Formula Analyzer', icon: Atom }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playSynthTone('tick');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 border border-sky-400'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Environment Condition Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Thermodynamic Reference Environment
            </span>
          </div>
          
          {/* Atomic vs Molecular Species Toggle (if applicable) */}
          {hasDistinctMolecularForm && (
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500 px-1 text-[10px]">Natural Species:</span>
              <button
                onClick={() => { setBasisMode('molecular'); playSynthTone('tick'); }}
                className={`px-2.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  basisMode === 'molecular'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Molecular ({allotropeInfo.formula}, {allotropeInfo.atomsPerMolecule}×)
              </button>
              <button
                onClick={() => { setBasisMode('atomic'); playSynthTone('tick'); }}
                className={`px-2.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  basisMode === 'atomic'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Atomic ({element.symbol}, 1×)
              </button>
            </div>
          )}
        </div>

        {/* Standard Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['IUPAC', 'STP_CLASSIC', 'SATP', 'NTP', 'CUSTOM'] as StpStandardType[]).map(stdKey => {
            const spec = STANDARDS_SPECS[stdKey];
            const isSelected = selectedStandard === stdKey;
            return (
              <button
                key={stdKey}
                onClick={() => {
                  setSelectedStandard(stdKey);
                  playSynthTone('tick');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 shadow-inner'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold font-mono truncate">{spec.shortLabel}</div>
                <div className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                  {stdKey === 'CUSTOM' ? 'Interactive Custom' : `${spec.tempC}°C • ${spec.pressKPa} kPa`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Controls Slider / Input if Custom is Selected */}
        {selectedStandard === 'CUSTOM' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800 animate-fadeIn">
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Custom Temperature:</span>
                <span className="font-bold text-amber-400">{customTempC.toFixed(1)} °C ({currentStandard.tempK.toFixed(2)} K)</span>
              </div>
              <input
                type="range"
                min="-270"
                max="3000"
                step="1"
                value={customTempC}
                onChange={(e) => setCustomTempC(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex gap-2 justify-between text-[10px] text-slate-500 font-mono">
                <span>-270°C (Deep Cryo)</span>
                <span>0°C</span>
                <span>25°C</span>
                <span>100°C</span>
                <span>1000°C</span>
                <span>3000°C</span>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Custom Pressure:</span>
                <span className="font-bold text-sky-400">{customPressKPa.toFixed(2)} kPa ({currentStandard.pressAtm.toFixed(3)} atm)</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5000"
                step="0.5"
                value={customPressKPa}
                onChange={(e) => setCustomPressKPa(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex gap-2 justify-between text-[10px] text-slate-500 font-mono">
                <span>0.1 kPa (Vacuum)</span>
                <span>100 kPa (1 bar)</span>
                <span>101.3 kPa (1 atm)</span>
                <span>1 MPa (10 bar)</span>
                <span>5 MPa (50 bar)</span>
              </div>
            </div>
          </div>
        )}

        {/* Environmental Summary Description */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500">Physical Phase:</span>
            <span className={`font-bold flex items-center gap-1 ${
              stateOfMatter === 'gas' ? 'text-sky-400' :
              stateOfMatter === 'liquid' ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {stateOfMatter === 'gas' && <Cloud className="w-3.5 h-3.5" />}
              {stateOfMatter === 'liquid' && <Droplets className="w-3.5 h-3.5" />}
              {stateOfMatter === 'solid' && <Layers className="w-3.5 h-3.5" />}
              {stateOfMatter.toUpperCase()} (T_melt = {element.meltingPoint}°C, T_boil = {element.boilingPoint ?? 'N/A'}°C)
            </span>
          </div>
          <div className="font-mono text-slate-400">
            Ideal Gas V_m = <span className="text-sky-300 font-bold">{currentStandard.idealMolarVolumeL.toFixed(4)} L/mol</span>
          </div>
        </div>
      </div>

      {/* TAB 0: LIVE REACTION & STOICHIOMETRY SUITE */}
      {activeTab === 'reactions' && (
        <LiveStoichiometryEngine
          initialElementSymbol={element.symbol}
          onSelectElement={onSelectElement}
          gasMolarVolumeL={currentStandard.idealMolarVolumeL}
          standardLabel={currentStandard.shortLabel}
        />
      )}

      {/* TAB 1: STOICHIOMETRY & MULTI-DIMENSIONAL CONVERTER */}
      {activeTab === 'single' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Effective Molar Mass</span>
              <div className="text-xl font-black text-sky-400 font-mono flex items-baseline gap-1">
                {effectiveMolarMass.toFixed(4)}
                <span className="text-xs text-slate-400 font-normal">g/mol</span>
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Basis: <strong className="text-slate-300 font-mono">{effectiveSpeciesFormula}</strong> ({basisMode} mode)
              </span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Molar Volume (V_m)</span>
              <div className="text-xl font-black text-amber-400 font-mono flex items-baseline gap-1">
                {stateOfMatter === 'gas' 
                  ? vanDerWaalsCalc.realMolarVolumeL.toFixed(4) 
                  : (condensedProperties.molarVolumeCm3).toFixed(3)
                }
                <span className="text-xs text-slate-400 font-normal">
                  {stateOfMatter === 'gas' ? 'L/mol' : 'cm³/mol'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">
                {stateOfMatter === 'gas' ? 'Real Gas (Van der Waals)' : 'Crystallographic Density'}
              </span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Density at Conditions</span>
              <div className="text-xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
                {stateOfMatter === 'gas' 
                  ? vanDerWaalsCalc.realGasDensityGL.toFixed(4) 
                  : condensedProperties.density.toFixed(3)
                }
                <span className="text-xs text-slate-400 font-normal">
                  {stateOfMatter === 'gas' ? 'g/L' : 'g/cm³'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">
                {stateOfMatter === 'gas' 
                  ? `${(vanDerWaalsCalc.realGasDensityGL * 1000).toFixed(2)} g/m³` 
                  : `${(condensedProperties.density * 1000).toFixed(0)} kg/m³`
                }
              </span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Elementary Entities per Mole</span>
              <div className="text-xl font-black text-purple-400 font-mono flex items-baseline gap-1">
                6.0221<span className="text-sm font-normal text-purple-300">×10²³</span>
                <span className="text-xs text-slate-400 font-normal">mol⁻¹</span>
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Exact SI Definition (CODATA)
              </span>
            </div>
          </div>

          {/* Interactive Multi-Field Converter */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sky-400" />
                  Live Stoichiometric Quantity Synchronizer
                </h4>
                <p className="text-xs text-slate-400">
                  Update any field to compute all corresponding quantities instantly across all physical dimensions.
                </p>
              </div>

              {/* Quick Preset Multipliers */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '0.1 mol', val: '0.1' },
                  { label: '1 mol', val: '1.0' },
                  { label: '10 mol', val: '10.0' },
                  { label: '100g', val: String(100.0 / effectiveMolarMass) },
                  { label: '1 kg', val: String(1000.0 / effectiveMolarMass) },
                  { label: '22.4 L', val: String(22.413962 / (stateOfMatter === 'gas' ? vanDerWaalsCalc.realMolarVolumeL : condensedProperties.molarVolumeL)) }
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setMolesStr(p.val);
                      playSynthTone('tick');
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] font-mono font-bold text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Amount of Substance (Moles) */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-sky-500/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Amount of Substance (n)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">mol</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={molesStr}
                  onChange={(e) => setMolesStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-sky-500 outline-none"
                  placeholder="Enter moles..."
                />
                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>{(stoichiometricValues.moles * 1000).toPrecision(4)} mmol</span>
                  <span>{(stoichiometricValues.moles * 1e6).toPrecision(4)} µmol</span>
                </div>
              </div>

              {/* 2. Mass (Grams / Kilograms) */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Mass (m = n × M)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">grams</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={stoichiometricValues.massG > 0 ? Number(stoichiometricValues.massG.toFixed(6)) : (molesStr === '0' ? '0' : '')}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) setMolesStr('');
                    else setMolesStr(String(Math.max(0, val / effectiveMolarMass)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                  placeholder="Enter mass in g..."
                />
                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>{stoichiometricValues.massKg.toPrecision(5)} kg</span>
                  <span>{(stoichiometricValues.massG * 1000).toPrecision(5)} mg</span>
                </div>
              </div>

              {/* 3. Volume at Conditions */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Volume at Conditions (V)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Liters</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={stoichiometricValues.volumeL > 0 ? Number(stoichiometricValues.volumeL.toFixed(6)) : (molesStr === '0' ? '0' : '')}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) setMolesStr('');
                    else setMolesStr(String(Math.max(0, val / stoichiometricValues.effectiveMolarVolL)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none"
                  placeholder="Enter volume in L..."
                />
                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>{stoichiometricValues.volumeCm3.toPrecision(5)} cm³ (mL)</span>
                  <span>{stoichiometricValues.volumeM3.toPrecision(5)} m³</span>
                </div>
              </div>

              {/* 4. Particle Count (Molecules / Atoms) */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-purple-500/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Particle Count (N = n × N_A)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">entities</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={stoichiometricValues.totalMolecules > 0 ? stoichiometricValues.totalMolecules.toExponential(4) : (molesStr === '0' ? '0' : '')}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) setMolesStr('');
                    else setMolesStr(String(Math.max(0, val / N_AVOGADRO)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none"
                  placeholder="Enter particle count..."
                />
                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>{stoichiometricValues.totalAtoms.toExponential(4)} Atoms</span>
                  <span>{hasDistinctMolecularForm ? `${stoichiometricValues.totalMolecules.toExponential(4)} ${allotropeInfo.formula}` : 'Single Atom'}</span>
                </div>
              </div>

              {/* 5. Total Electron Count */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Total Bound Electrons</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">e⁻</span>
                </div>
                <div className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold flex items-center justify-between">
                  <span>{stoichiometricValues.totalElectrons.toExponential(4)}</span>
                  <span className="text-xs text-rose-400 font-normal">{element.number} e⁻/atom</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  <span>Moles of electrons: {(stoichiometricValues.moles * element.number * effectiveMultiplier).toFixed(3)} mol e⁻</span>
                </div>
              </div>

              {/* 6. Total Faraday Charge */}
              <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-blue-500/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Nuclear / Electronic Charge</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Coulombs</span>
                </div>
                <div className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold flex items-center justify-between">
                  <span>{stoichiometricValues.totalFaradayChargeC.toExponential(4)}</span>
                  <span className="text-xs text-blue-400 font-normal">Q = n·Z·F</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>F = 96,485 C/mol</span>
                  <span>{(stoichiometricValues.totalFaradayChargeC / 3600).toFixed(2)} A·h</span>
                </div>
              </div>
            </div>

            {/* Quick Export / Summary Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="text-slate-400">
                Summary: <span className="text-white font-bold">{stoichiometricValues.moles.toFixed(4)} mol</span> of {effectiveSpeciesFormula} = <span className="text-emerald-400 font-bold">{stoichiometricValues.massG.toFixed(4)} g</span> = <span className="text-amber-400 font-bold">{stoichiometricValues.volumeL.toFixed(4)} L</span> ({currentStandard.shortLabel})
              </div>
              <button
                onClick={() => handleCopyText(
                  `Stoichiometric calculation for ${effectiveSpeciesFormula} at ${currentStandard.label}:\n` +
                  `Amount: ${stoichiometricValues.moles} mol\n` +
                  `Mass: ${stoichiometricValues.massG.toFixed(6)} g\n` +
                  `Volume: ${stoichiometricValues.volumeL.toFixed(6)} L\n` +
                  `Entities: ${stoichiometricValues.totalMolecules.toExponential(6)} (${effectiveSpeciesFormula})\n` +
                  `Atoms: ${stoichiometricValues.totalAtoms.toExponential(6)}\n` +
                  `Electrons: ${stoichiometricValues.totalElectrons.toExponential(6)} e-\n` +
                  `Molar Mass: ${effectiveMolarMass.toFixed(6)} g/mol`,
                  'summary'
                )}
                className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded border border-sky-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'summary' ? 'Copied to Clipboard!' : 'Copy Stoichiometry Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GAS THERMODYNAMICS & KINETIC THEORY */}
      {activeTab === 'thermo' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Comparison Cards: Ideal Gas vs Real Gas (Van der Waals) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ideal Gas Model */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-400" />
                  Ideal Gas Equation of State (PV = nRT)
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">Ideal Limit</span>
              </div>
              <div className="space-y-2 pt-2 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Ideal Molar Volume (V_m,ideal):</span>
                  <span className="text-sky-300 font-bold">{vanDerWaalsCalc.idealMolarVolumeL.toFixed(5)} L/mol</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Ideal Gas Density (ρ_ideal = P·M / R·T):</span>
                  <span className="text-slate-200 font-bold">{vanDerWaalsCalc.idealGasDensityGL.toFixed(5)} g/L</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Compressibility Factor (Z):</span>
                  <span className="text-emerald-400 font-bold">1.00000 (Exact)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Assumption:</span>
                  <span className="text-slate-400 italic font-sans text-right text-[11px]">Point particles with zero finite volume and zero intermolecular interactions.</span>
                </div>
              </div>
            </div>

            {/* Real Gas Model (Van der Waals) */}
            <div className="bg-slate-900/80 border border-indigo-500/20 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Real Gas Model (Van der Waals Equation)
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">Real Correction</span>
              </div>
              <div className="space-y-2 pt-2 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Real Molar Volume (V_m,real):</span>
                  <span className="text-indigo-300 font-bold">{vanDerWaalsCalc.realMolarVolumeL.toFixed(5)} L/mol</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Real Gas Density (ρ_real):</span>
                  <span className="text-slate-200 font-bold">{vanDerWaalsCalc.realGasDensityGL.toFixed(5)} g/L</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Compressibility Factor (Z = P·V_m / R·T):</span>
                  <span className={`font-bold ${Math.abs(vanDerWaalsCalc.compressibilityZ - 1.0) < 0.005 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {vanDerWaalsCalc.compressibilityZ.toFixed(5)} ({vanDerWaalsCalc.deviationPercent > 0 ? '+' : ''}{vanDerWaalsCalc.deviationPercent.toFixed(3)}% dev)
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Parameters (a, b):</span>
                  <span className="text-indigo-200 font-bold text-right">
                    a = {vanDerWaalsCalc.a.toFixed(3)} L²·bar/mol² • b = {vanDerWaalsCalc.b.toFixed(4)} L/mol
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Microscopic Kinetics of Gas Molecules */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Maxwell-Boltzmann Microscopic Kinetic Dynamics ({currentStandard.shortLabel})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Root-Mean-Square Speed (v_rms)</span>
                <div className="text-lg font-bold text-emerald-400">
                  {kineticTheory.vRms.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m/s</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {(kineticTheory.vRms * 3.6).toFixed(1)} km/h • Mach {(kineticTheory.vRms / 343).toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average Molecular Speed (⟨v⟩)</span>
                <div className="text-lg font-bold text-sky-400">
                  {kineticTheory.vAvg.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m/s</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  v_avg = √(8·R·T / π·M)
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Most Probable Speed (v_mp)</span>
                <div className="text-lg font-bold text-amber-400">
                  {kineticTheory.vMp.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m/s</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Peak of Maxwell-Boltzmann Curve
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono pt-2">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Free Path (λ)</span>
                <div className="text-base font-bold text-purple-400">
                  {kineticTheory.meanFreePathNm.toFixed(2)} <span className="text-xs text-slate-400 font-normal">nm</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  d_kinetic ≈ {kineticTheory.diameterPm} pm
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Collision Frequency (Z_coll)</span>
                <div className="text-base font-bold text-rose-400">
                  {(kineticTheory.collisionFrequencyHz / 1e9).toFixed(2)} <span className="text-xs text-slate-400 font-normal">GHz (10⁹ s⁻¹)</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Collisions per particle per second
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average Translational Energy (⟨E_k⟩)</span>
                <div className="text-base font-bold text-blue-400">
                  {kineticTheory.energyMilliEV.toFixed(2)} <span className="text-xs text-slate-400 font-normal">meV / particle</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {(kineticTheory.energyJoules * 1e21).toFixed(2)} × 10⁻²¹ J (3/2 k_B T)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONDENSED PHASE (SOLID/LIQUID) CRYSTALLOGRAPHY */}
      {activeTab === 'condensed' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Condensed Matter Volumetrics & Unit Cell Metrics */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-400" />
                  Condensed Matter Unit Cell Volumetrics & Packing
                </h4>
                <p className="text-xs text-slate-400">
                  Derived from crystallographic room-temperature density and atomic weight.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                {element.crystalStructure || 'Crystalline Solid'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Crystallographic Density</span>
                <div className="text-lg font-bold text-emerald-400">
                  {condensedProperties.density.toFixed(4)} <span className="text-xs text-slate-400 font-normal">g/cm³</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {(condensedProperties.density * 1000).toFixed(1)} kg/m³
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Condensed Molar Volume (V_m)</span>
                <div className="text-lg font-bold text-sky-400">
                  {condensedProperties.molarVolumeCm3.toFixed(3)} <span className="text-xs text-slate-400 font-normal">cm³/mol</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {(condensedProperties.molarVolumeL * 1000).toFixed(3)} mL/mol
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volume per Atom (Ω)</span>
                <div className="text-lg font-bold text-amber-400">
                  {condensedProperties.volumePerAtomAngstrom3.toFixed(3)} <span className="text-xs text-slate-400 font-normal">Å³/atom</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Ω = (M / ρ·N_A)
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wigner-Seitz Radius (r_WS)</span>
                <div className="text-lg font-bold text-purple-400">
                  {condensedProperties.wignerSeitzRadiusAngstrom.toFixed(3)} <span className="text-xs text-slate-400 font-normal">Å ({ (condensedProperties.wignerSeitzRadiusAngstrom * 100).toFixed(1) } pm)</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  r_WS = ∛(3·Ω / 4π)
                </div>
              </div>
            </div>

            {/* Atomic Number Density & Phase Expansion Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-indigo-400" />
                  Atomic Number Density (n_V)
                </span>
                <div className="text-sm font-mono text-slate-200">
                  <span className="text-indigo-300 font-bold">{condensedProperties.numberDensityAtomsAngstrom3.toFixed(4)} atoms/Å³</span>
                  <div className="text-xs text-slate-400 mt-1">
                    = {condensedProperties.numberDensityAtomsCm3.toExponential(4)} atoms/cm³
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Fundamental parameter for X-ray linear attenuation coefficients (μ = n_V · σ_a) and neutron scattering length density (SLD).
                </p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  Phase Expansion Ratio (Condensed ➔ Ideal Gas)
                </span>
                <div className="text-sm font-mono text-slate-200">
                  <span className="text-rose-400 font-bold">{condensedProperties.expansionRatio.toFixed(1)}× Volumetric Expansion</span>
                  <div className="text-xs text-slate-400 mt-1">
                    1 cm³ condensed {element.symbol} expands to {(condensedProperties.expansionRatio).toFixed(1)} cm³ of vapor at {currentStandard.shortLabel}.
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Represents the vast intermolecular void expansion when transitioning from crystallographic lattice packing into free gas state.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPOUND FORMULA ANALYZER */}
      {activeTab === 'compound' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Compound Input & Parser */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Atom className="w-4 h-4 text-purple-400" />
                  Multi-Element Compound Molar Mass & Stoichiometry Engine
                </h4>
                <p className="text-xs text-slate-400">
                  Type any stoichiometry formula (e.g., BaTiO3, YBa2Cu3O7, LiFePO4, CaCO3, SiO2) for full atomic weight summation and elemental mass fraction analysis.
                </p>
              </div>

              {/* Sample Compound Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  element.symbol === 'Si' ? 'SiO2' : `${element.symbol}2O3`,
                  'BaTiO3',
                  'YBa2Cu3O7',
                  'LiFePO4',
                  'CaCO3',
                  'NaCl'
                ].map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setCompoundFormula(preset);
                      playSynthTone('tick');
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] font-mono font-bold text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={compoundFormula}
                onChange={(e) => setCompoundFormula(e.target.value)}
                placeholder="Enter chemical formula (e.g. YBa2Cu3O7)..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-base font-mono focus:border-purple-500 outline-none shadow-inner"
              />
              <span className="absolute right-3 top-3.5 text-xs font-mono text-purple-400 font-bold">
                {parsedCompound.valid ? 'Valid Stoichiometry' : 'Invalid / Incomplete'}
              </span>
            </div>

            {parsedCompound.valid && (
              <div className="space-y-4 pt-2">
                {/* Main Results Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Compound Molar Mass (M)</span>
                    <div className="text-xl font-black text-purple-300 font-mono flex items-baseline gap-1">
                      {parsedCompound.molarMass.toFixed(4)}
                      <span className="text-xs text-slate-400 font-normal">g/mol</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      Sum of IUPAC Standard Atomic Weights
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Total Atoms / Formula Unit</span>
                    <div className="text-xl font-black text-sky-400 font-mono">
                      {parsedCompound.totalAtomsPerFormula.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      {parsedCompound.elements.length} Distinct Chemical Elements
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Gas Volume if Vaporized</span>
                    <div className="text-xl font-black text-amber-400 font-mono flex items-baseline gap-1">
                      {currentStandard.idealMolarVolumeL.toFixed(3)}
                      <span className="text-xs text-slate-400 font-normal">L/mol</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      At {currentStandard.shortLabel}
                    </span>
                  </div>
                </div>

                {/* Elemental Mass Fractions Visual Breakdown */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold">Elemental Mass Fraction Distribution (% w/w)</span>
                    <span className="text-slate-400">Total = 100.00%</span>
                  </div>

                  {/* Multi-Segment Color Bar */}
                  <div className="h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                    {parsedCompound.elements.map((el, i) => {
                      const colors = [
                        'bg-sky-500',
                        'bg-purple-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-rose-500',
                        'bg-indigo-500'
                      ];
                      const bg = colors[i % colors.length];
                      return (
                        <div
                          key={el.symbol}
                          style={{ width: `${el.massPercent}%` }}
                          className={`${bg} transition-all relative group cursor-pointer`}
                          title={`${el.symbol}: ${el.massPercent.toFixed(2)}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Detailed Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-2 px-2">Element</th>
                          <th className="py-2 px-2">Stoichiometric Coeff</th>
                          <th className="py-2 px-2">Atomic Weight</th>
                          <th className="py-2 px-2">Subtotal Mass</th>
                          <th className="py-2 px-2 text-right">Mass Percent (% w/w)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedCompound.elements.map((el, i) => {
                          const subtotal = el.count * el.atomicWeight;
                          return (
                            <tr key={el.symbol} className="border-b border-slate-900 hover:bg-slate-900/40">
                              <td className="py-2 px-2 font-bold text-white flex items-center gap-1.5">
                                <span className="text-purple-400">{el.symbol}</span>
                              </td>
                              <td className="py-2 px-2 text-slate-300">{el.count}</td>
                              <td className="py-2 px-2 text-slate-400">{el.atomicWeight.toFixed(4)} g/mol</td>
                              <td className="py-2 px-2 text-slate-300 font-semibold">{subtotal.toFixed(4)} g/mol</td>
                              <td className="py-2 px-2 text-right font-bold text-purple-300">{el.massPercent.toFixed(2)}%</td>
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
        </div>
      )}
    </div>
  );
};
