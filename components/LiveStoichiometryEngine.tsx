import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ArrowRightLeft,
  Sparkles,
  Sliders,
  Flame,
  Layers,
  FlaskConical,
  Beaker,
  Check,
  Copy,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Percent,
  Atom,
  Scale,
  RefreshCw,
  Box,
  Droplets,
  Wind,
  Plus,
  Trash2
} from 'lucide-react';
import {
  parseChemicalFormulaAdvanced,
  balanceChemicalEquation,
  computeReactionStoichiometry,
  PRESET_REACTIONS,
  IUPAC_ATOMIC_WEIGHTS,
  SpeciesQuantityInput,
  YieldAnalysisResult
} from '../utils/stoichiometry';
import { playSynthTone } from '../utils/sound';

interface LiveStoichiometryEngineProps {
  initialElementSymbol?: string;
  onSelectElement?: (atomicNumber: number) => void;
  gasMolarVolumeL?: number; // L/mol (from selected STP standard)
  standardLabel?: string;
}

export const LiveStoichiometryEngine: React.FC<LiveStoichiometryEngineProps> = ({
  initialElementSymbol = 'Fe',
  onSelectElement,
  gasMolarVolumeL = 22.710955, // IUPAC default
  standardLabel = 'IUPAC STP (0°C, 1 bar)'
}) => {
  // Main Sub-Tab Mode
  const [activeSubTab, setActiveSubTab] = useState<'reaction' | 'roadmap' | 'solutions' | 'empirical' | 'ceramics'>('reaction');

  // Reaction Balancing & Limiting Reactant State
  const [equationInput, setEquationInput] = useState<string>('Fe2O3 + 3 CO -> 2 Fe + 3 CO2');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [actualYieldPercent, setActualYieldPercent] = useState<number>(100);
  const [reactionExtentFraction, setReactionExtentFraction] = useState<number>(1.0); // 0 to 1 (fraction of xi_max)
  
  // Reactant Inputs mapping: formula -> SpeciesQuantityInput
  const [speciesInputs, setSpeciesInputs] = useState<Record<string, SpeciesQuantityInput>>({
    'Fe2O3': {
      speciesIndex: 0,
      speciesFormula: 'Fe2O3',
      isReactant: true,
      valueStr: '159.69',
      unit: 'g'
    },
    'CO': {
      speciesIndex: 1,
      speciesFormula: 'CO',
      isReactant: true,
      valueStr: '100.0',
      unit: 'g'
    }
  });

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Conversion Roadmap State
  const [roadmapGivenSpecies, setRoadmapGivenSpecies] = useState<string>('Fe2O3');
  const [roadmapTargetSpecies, setRoadmapTargetSpecies] = useState<string>('Fe');
  const [roadmapGivenValueStr, setRoadmapGivenValueStr] = useState<string>('50.0');
  const [roadmapGivenUnit, setRoadmapGivenUnit] = useState<'g' | 'mol' | 'L_STP' | 'kg'>('g');
  const [roadmapTargetUnit, setRoadmapTargetUnit] = useState<'g' | 'mol' | 'L_STP' | 'kg'>('g');

  // Solution Chemistry State
  const [solSoluteFormula, setSolSoluteFormula] = useState<string>('NaCl');
  const [solTargetMolarity, setSolTargetMolarity] = useState<number>(0.5); // mol/L
  const [solTargetVolumeMl, setSolTargetVolumeMl] = useState<number>(500); // mL
  const [solSolventDensity, setSolventDensity] = useState<number>(1.0); // g/mL

  // Dilution Solver State (M1 V1 = M2 V2)
  const [dilM1, setDilM1] = useState<string>('12.0'); // e.g. Stock HCl
  const [dilV1, setDilV1] = useState<string>(''); // solved or input
  const [dilM2, setDilM2] = useState<string>('1.0');
  const [dilV2, setDilV2] = useState<string>('250.0'); // mL

  // Titration Solver State
  const [titrAcidFormula, setTitrAcidFormula] = useState<string>('HCl');
  const [titrBaseFormula, setTitrBaseFormula] = useState<string>('NaOH');
  const [titrAcidCoeff, setTitrAcidCoeff] = useState<number>(1);
  const [titrBaseCoeff, setTitrBaseCoeff] = useState<number>(1);
  const [titrAcidMolarity, setTitrAcidMolarity] = useState<string>('0.1');
  const [titrAcidVolumeMl, setTitrAcidVolumeMl] = useState<string>('25.0');
  const [titrBaseMolarity, setTitrBaseMolarity] = useState<string>('0.1');
  const [titrBaseVolumeMl, setTitrBaseVolumeMl] = useState<string>(''); // to solve

  // Empirical Formula Calculator State
  const [empiricalRows, setEmpiricalRows] = useState<Array<{ id: string; symbol: string; massOrPercent: string }>>([
    { id: '1', symbol: 'C', massOrPercent: '40.0' },
    { id: '2', symbol: 'H', massOrPercent: '6.7' },
    { id: '3', symbol: 'O', massOrPercent: '53.3' }
  ]);
  const [experimentalMolarMass, setExperimentalMolarMass] = useState<string>('180.16'); // e.g. Glucose

  // Ceramics Solid-State Precursor Batch State
  const [ceramicTargetCompound, setCeramicTargetCompound] = useState<string>('BaTiO3');
  const [ceramicTargetMassG, setCeramicTargetMassG] = useState<number>(10.0);
  const [ceramicPrecursor1, setCeramicPrecursor1] = useState<{ formula: string; stoichiometricCoeff: number }>({ formula: 'BaCO3', stoichiometricCoeff: 1 });
  const [ceramicPrecursor2, setCeramicPrecursor2] = useState<{ formula: string; stoichiometricCoeff: number }>({ formula: 'TiO2', stoichiometricCoeff: 1 });

  // 1. Balance the Chemical Equation
  const balancedResult = useMemo(() => {
    return balanceChemicalEquation(equationInput);
  }, [equationInput]);

  // Synchronize initial species inputs when a new equation is balanced
  const currentReactantFormulas = useMemo(() => {
    return balancedResult.reactants.map(r => r.formula);
  }, [balancedResult]);

  // 2. Compute Limiting Reactant & Theoretical Yield
  const yieldResult = useMemo<YieldAnalysisResult | null>(() => {
    if (!balancedResult.valid || balancedResult.reactants.length === 0) return null;
    return computeReactionStoichiometry(
      balancedResult.reactants,
      balancedResult.products,
      speciesInputs,
      actualYieldPercent,
      gasMolarVolumeL
    );
  }, [balancedResult, speciesInputs, actualYieldPercent, gasMolarVolumeL]);

  // Extent of Reaction simulation values
  const simulatedProgress = useMemo(() => {
    if (!yieldResult || !balancedResult.valid) return null;
    const xi_max = yieldResult.maxReactionExtentMoles;
    const current_xi = xi_max * reactionExtentFraction;

    const reactantsCurrent = balancedResult.reactants.map((r, i) => {
      const nInit = yieldResult.reactantsTable[i]?.initialMoles || 0;
      const nConsumed = current_xi * r.coefficient;
      const nCurrent = Math.max(0, nInit - nConsumed);
      const mCurrent = nCurrent * r.parsed.molarMass;
      return {
        formula: r.formula,
        molarMass: r.parsed.molarMass,
        initialMoles: nInit,
        currentMoles: nCurrent,
        currentMassG: mCurrent,
        consumedMoles: nConsumed
      };
    });

    const productsCurrent = balancedResult.products.map(p => {
      const nGenerated = current_xi * p.coefficient;
      const mGenerated = nGenerated * p.parsed.molarMass;
      const vGenerated = nGenerated * gasMolarVolumeL;
      return {
        formula: p.formula,
        molarMass: p.parsed.molarMass,
        currentMoles: nGenerated,
        currentMassG: mGenerated,
        currentVolumeL: vGenerated
      };
    });

    return {
      currentXi: current_xi,
      maxXi: xi_max,
      fraction: reactionExtentFraction,
      reactantsCurrent,
      productsCurrent
    };
  }, [yieldResult, balancedResult, reactionExtentFraction, gasMolarVolumeL]);

  // 3. Step-by-Step Conversion Roadmap Computation
  const roadmapCalculation = useMemo(() => {
    const givenParsed = parseChemicalFormulaAdvanced(roadmapGivenSpecies);
    const targetParsed = parseChemicalFormulaAdvanced(roadmapTargetSpecies);

    if (!givenParsed.valid || !targetParsed.valid) {
      return { valid: false, error: 'Invalid chemical formulas.' };
    }

    const givenVal = parseFloat(roadmapGivenValueStr) || 0;
    if (givenVal <= 0) {
      return { valid: false, error: 'Enter a positive quantity.' };
    }

    // Determine stoichiometric coefficients from current balanced equation if present, else default 1:1
    let nu_given = 1;
    let nu_target = 1;

    if (balancedResult.valid) {
      const allSpecies = [...balancedResult.reactants, ...balancedResult.products];
      const matchGiven = allSpecies.find(s => s.formula === roadmapGivenSpecies);
      const matchTarget = allSpecies.find(s => s.formula === roadmapTargetSpecies);
      if (matchGiven) nu_given = matchGiven.coefficient;
      if (matchTarget) nu_target = matchTarget.coefficient;
    }

    // Step 1: Given Unit -> Moles of Given (n_A)
    let molesGiven = 0;
    switch (roadmapGivenUnit) {
      case 'g':
        molesGiven = givenVal / givenParsed.molarMass;
        break;
      case 'kg':
        molesGiven = (givenVal * 1000) / givenParsed.molarMass;
        break;
      case 'mol':
        molesGiven = givenVal;
        break;
      case 'L_STP':
        molesGiven = givenVal / gasMolarVolumeL;
        break;
    }

    // Step 2: Mole Ratio -> Moles of Target (n_B = n_A * nu_B / nu_A)
    const moleRatio = nu_target / nu_given;
    const molesTarget = molesGiven * moleRatio;

    // Step 3: Moles of Target -> Target Output Unit
    let targetOutputVal = 0;
    switch (roadmapTargetUnit) {
      case 'g':
        targetOutputVal = molesTarget * targetParsed.molarMass;
        break;
      case 'kg':
        targetOutputVal = (molesTarget * targetParsed.molarMass) / 1000;
        break;
      case 'mol':
        targetOutputVal = molesTarget;
        break;
      case 'L_STP':
        targetOutputVal = molesTarget * gasMolarVolumeL;
        break;
    }

    return {
      valid: true,
      givenParsed,
      targetParsed,
      nu_given,
      nu_target,
      moleRatio,
      molesGiven,
      molesTarget,
      targetOutputVal,
      targetMolecules: molesTarget * 6.02214076e23
    };
  }, [roadmapGivenSpecies, roadmapTargetSpecies, roadmapGivenValueStr, roadmapGivenUnit, roadmapTargetUnit, balancedResult, gasMolarVolumeL]);

  // 4. Solution & Preparation Recipe Calculation
  const solutionPrep = useMemo(() => {
    const solute = parseChemicalFormulaAdvanced(solSoluteFormula);
    if (!solute.valid) return { valid: false, error: solute.error };

    const volL = solTargetVolumeMl / 1000.0;
    const moles = solTargetMolarity * volL;
    const massG = moles * solute.molarMass;
    const massMg = massG * 1000;
    const ppm = volL > 0 ? (massMg / volL) : 0; // mg/L = ppm for aqueous

    // Mass fraction % w/w in water
    const waterMassG = volL * 1000.0 * solSolventDensity;
    const massPercent = (massG / (massG + waterMassG)) * 100.0;
    const molality = waterMassG > 0 ? (moles / (waterMassG / 1000)) : 0;

    return {
      valid: true,
      solute,
      volL,
      moles,
      massG,
      massMg,
      ppm,
      massPercent,
      molality
    };
  }, [solSoluteFormula, solTargetMolarity, solTargetVolumeMl, solSolventDensity]);

  // 5. Dilution Solver (M1 * V1 = M2 * V2)
  const dilutionResult = useMemo(() => {
    const m1 = parseFloat(dilM1) || 0;
    const v1 = parseFloat(dilV1) || 0;
    const m2 = parseFloat(dilM2) || 0;
    const v2 = parseFloat(dilV2) || 0;

    // If V1 is blank/missing and M1, M2, V2 are present -> Solve V1
    if ((!dilV1 || v1 === 0) && m1 > 0 && m2 > 0 && v2 > 0) {
      const solvedV1 = (m2 * v2) / m1;
      const solventToAdd = Math.max(0, v2 - solvedV1);
      return { solvedFor: 'V1', val: solvedV1, solventToAdd, unit: 'mL', valid: true };
    }
    // If M2 is blank -> Solve M2
    if ((!dilM2 || m2 === 0) && m1 > 0 && v1 > 0 && v2 > 0) {
      const solvedM2 = (m1 * v1) / v2;
      return { solvedFor: 'M2', val: solvedM2, unit: 'M', valid: true };
    }
    return { valid: false };
  }, [dilM1, dilV1, dilM2, dilV2]);

  // 6. Empirical Formula Calculator
  const empiricalCalc = useMemo(() => {
    const parsedRows = empiricalRows.map(row => {
      const sym = row.symbol.trim();
      const val = parseFloat(row.massOrPercent) || 0;
      const meta = IUPAC_ATOMIC_WEIGHTS[sym];
      const aw = meta?.weight || 0;
      const moles = aw > 0 ? val / aw : 0;
      return {
        id: row.id,
        symbol: sym,
        name: meta?.name || sym,
        weight: aw,
        inputVal: val,
        moles
      };
    });

    const validRows = parsedRows.filter(r => r.weight > 0 && r.inputVal > 0);
    if (validRows.length === 0) return { valid: false, error: 'Add at least one valid element with non-zero mass or percentage.' };

    const minMoles = Math.min(...validRows.map(r => r.moles));
    if (minMoles <= 0) return { valid: false, error: 'Calculated moles are zero.' };

    // Initial ratios
    const rawRatios = validRows.map(r => r.moles / minMoles);

    // Multiplier scanner to find simplest integer multiplier (1 to 12)
    let bestMult = 1;
    let minDeviation = Infinity;

    for (let mult = 1; mult <= 12; mult++) {
      let maxDev = 0;
      for (const ratio of rawRatios) {
        const scaled = ratio * mult;
        const nearestInt = Math.round(scaled);
        const dev = Math.abs(scaled - nearestInt);
        if (dev > maxDev) maxDev = dev;
      }
      if (maxDev < 0.08 && maxDev < minDeviation) {
        minDeviation = maxDev;
        bestMult = mult;
        break;
      }
    }

    let empiricalMolarMass = 0;
    const finalElements = validRows.map((r, idx) => {
      const rawRatio = rawRatios[idx];
      const integerCount = Math.max(1, Math.round(rawRatio * bestMult));
      empiricalMolarMass += integerCount * r.weight;
      return {
        ...r,
        rawRatio,
        integerCount
      };
    });

    const empiricalFormula = finalElements.map(el => (el.integerCount > 1 ? `${el.symbol}${el.integerCount}` : el.symbol)).join('');

    // Molecular Formula Check
    const expM = parseFloat(experimentalMolarMass) || 0;
    let molecularMultiplier = 1;
    let molecularFormula = empiricalFormula;

    if (expM > 0 && empiricalMolarMass > 0) {
      molecularMultiplier = Math.max(1, Math.round(expM / empiricalMolarMass));
      molecularFormula = finalElements.map(el => {
        const count = el.integerCount * molecularMultiplier;
        return count > 1 ? `${el.symbol}${count}` : el.symbol;
      }).join('');
    }

    return {
      valid: true,
      elements: finalElements,
      empiricalFormula,
      empiricalMolarMass,
      multiplier: bestMult,
      molecularMultiplier,
      molecularFormula,
      molecularMolarMass: empiricalMolarMass * molecularMultiplier
    };
  }, [empiricalRows, experimentalMolarMass]);

  // 7. Ceramics Solid-State Precursor Batch Calculator
  const ceramicsBatch = useMemo(() => {
    const target = parseChemicalFormulaAdvanced(ceramicTargetCompound);
    const p1 = parseChemicalFormulaAdvanced(ceramicPrecursor1.formula);
    const p2 = parseChemicalFormulaAdvanced(ceramicPrecursor2.formula);

    if (!target.valid || !p1.valid || !p2.valid) {
      return { valid: false, error: 'Invalid ceramic compound or precursor formula.' };
    }

    // Target moles
    const targetMoles = ceramicTargetMassG / target.molarMass;
    const p1MolesNeeded = targetMoles * ceramicPrecursor1.stoichiometricCoeff;
    const p2MolesNeeded = targetMoles * ceramicPrecursor2.stoichiometricCoeff;

    const p1MassG = p1MolesNeeded * p1.molarMass;
    const p2MassG = p2MolesNeeded * p2.molarMass;
    const totalPrecursorMassG = p1MassG + p2MassG;
    const massLossG = Math.max(0, totalPrecursorMassG - ceramicTargetMassG);
    const massLossPercent = totalPrecursorMassG > 0 ? (massLossG / totalPrecursorMassG) * 100 : 0;

    return {
      valid: true,
      target,
      p1,
      p2,
      targetMoles,
      p1MassG,
      p2MassG,
      totalPrecursorMassG,
      massLossG,
      massLossPercent
    };
  }, [ceramicTargetCompound, ceramicTargetMassG, ceramicPrecursor1, ceramicPrecursor2]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    playSynthTone('chime');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleLoadPreset = (preset: typeof PRESET_REACTIONS[0]) => {
    setEquationInput(preset.equation);
    playSynthTone('switch');

    // Parse equation to set up default inputs
    const balanced = balanceChemicalEquation(preset.equation);
    if (balanced.valid && preset.defaultAmounts) {
      const newInputs: Record<string, SpeciesQuantityInput> = {};
      balanced.reactants.forEach((r, i) => {
        const def = preset.defaultAmounts?.[r.formula];
        newInputs[r.formula] = {
          speciesIndex: i,
          speciesFormula: r.formula,
          isReactant: true,
          valueStr: def ? def.val : '100.0',
          unit: def ? def.unit : 'g'
        };
      });
      setSpeciesInputs(newInputs);
    }
  };

  const updateSpeciesInput = (formula: string, field: 'valueStr' | 'unit', val: any) => {
    setSpeciesInputs(prev => {
      const existing = prev[formula] || {
        speciesIndex: 0,
        speciesFormula: formula,
        isReactant: true,
        valueStr: '1.0',
        unit: 'mol'
      };
      return {
        ...prev,
        [formula]: {
          ...existing,
          [field]: val
        }
      };
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-200">
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-sky-950/50 p-5 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <FlaskConical className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Live Chemical Stoichiometry & Reaction Suite
              </h3>
            </div>
            <p className="text-xs text-emerald-200/70 max-w-2xl font-sans">
              Dynamic multi-variable stoichiometric balancing, real-time limiting reagent tracking, extent of reaction kinetics, solution molarity preparation, and crystal precursor batch formulations.
            </p>
          </div>

          {/* Reference Environment Badge */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-right">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">STP Gas Standard</span>
              <div className="text-xs font-bold text-emerald-300 font-mono">
                {gasMolarVolumeL.toFixed(4)} <span className="text-[10px] text-slate-400 font-normal">L/mol</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
          {[
            { id: 'reaction', label: 'Reaction Balancer & Limiting Reagent', icon: Calculator },
            { id: 'roadmap', label: 'Step-by-Step Conversion Roadmap', icon: ArrowRightLeft },
            { id: 'solutions', label: 'Solutions, Dilution & Titration', icon: Droplets },
            { id: 'empirical', label: 'Empirical & Molecular Formula', icon: Atom },
            { id: 'ceramics', label: 'Solid-State Ceramic Precursors', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  playSynthTone('tick');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 border border-emerald-400'
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

      {/* SUB-TAB 1: REACTION BALANCER & LIMITING REAGENT */}
      {activeSubTab === 'reaction' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Reaction Presets Library */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Curated Stoichiometric Reaction Library
              </span>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                {['All', 'Materials & Ceramics', 'Semiconductors & CVD', 'Metallurgy & Redox', 'Inorganic & Precipitation', 'Combustion & Energy'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); playSynthTone('tick'); }}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Reaction Pill Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {PRESET_REACTIONS
                .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
                .map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => handleLoadPreset(preset)}
                    className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 font-mono truncate">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5 truncate">
                      {preset.equation}
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                      {preset.description}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Live Chemical Equation Input & Balanced Output */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  Live Chemical Equation Balancer
                </h4>
                <p className="text-xs text-slate-400">
                  Type any unbalanced reaction (e.g. <code className="text-emerald-300">Fe2O3 + CO {'->'} Fe + CO2</code>, <code className="text-emerald-300">Al + HCl {'->'} AlCl3 + H2</code>, <code className="text-emerald-300">BaCO3 + TiO2 {'->'} BaTiO3 + CO2</code>).
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                  balancedResult.valid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {balancedResult.valid ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {balancedResult.valid ? 'Mathematically Balanced' : 'Syntax / Balancing Error'}
                </span>
              </div>
            </div>

            {/* Input Field */}
            <div className="relative">
              <input
                type="text"
                value={equationInput}
                onChange={(e) => setEquationInput(e.target.value)}
                placeholder="Enter reaction (e.g. Y2O3 + BaCO3 + CuO -> YBa2Cu3O7 + CO2)..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-base font-mono focus:border-emerald-500 outline-none shadow-inner"
              />
            </div>

            {/* Balanced Equation Display */}
            {balancedResult.valid && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stoichiometrically Balanced Equation</span>
                  <div className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {balancedResult.reactants.map((r, i) => (
                      <span key={r.formula}>
                        {i > 0 && <span className="text-slate-500 mx-2">+</span>}
                        {r.coefficient > 1 && <span className="text-emerald-400 font-extrabold mr-1">{r.coefficient}</span>}
                        <span className="text-slate-100">{r.formula}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({r.parsed.molarMass.toFixed(2)} g/mol)</span>
                      </span>
                    ))}
                    <span className="text-emerald-400 mx-3 font-black">➔</span>
                    {balancedResult.products.map((p, i) => (
                      <span key={p.formula}>
                        {i > 0 && <span className="text-slate-500 mx-2">+</span>}
                        {p.coefficient > 1 && <span className="text-amber-400 font-extrabold mr-1">{p.coefficient}</span>}
                        <span className="text-slate-100">{p.formula}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({p.parsed.molarMass.toFixed(2)} g/mol)</span>
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(balancedResult.balancedEquationString, 'balanced')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-end md:self-center"
                >
                  {copiedText === 'balanced' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === 'balanced' ? 'Copied' : 'Copy Equation'}
                </button>
              </div>
            )}

            {!balancedResult.valid && balancedResult.error && (
              <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-lg text-xs font-mono text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {balancedResult.error}
              </div>
            )}
          </div>

          {/* Interactive Reactant Feed Amounts (Limiting Reagent Engine) */}
          {balancedResult.valid && yieldResult && (
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    Reactant Feed Quantities & Limiting Reagent Engine
                  </h4>
                  <p className="text-xs text-slate-400">
                    Input initial amounts of each reactant in your preferred unit (g, kg, mol, mmol, L @ STP).
                  </p>
                </div>

                {/* Limiting Reactant Alert Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Limiting Reactant:</span>
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-xs rounded-lg shadow-sm">
                    {yieldResult.limitingReactantFormula}
                  </span>
                </div>
              </div>

              {/* Reactants Input Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balancedResult.reactants.map((r, i) => {
                  const input = speciesInputs[r.formula] || {
                    speciesIndex: i,
                    speciesFormula: r.formula,
                    isReactant: true,
                    valueStr: '100.0',
                    unit: 'g'
                  };
                  const isLimiting = yieldResult.limitingReactantIndex === i;

                  return (
                    <div
                      key={r.formula}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isLimiting
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/20'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white font-mono">
                            {r.coefficient > 1 && <span className="text-emerald-400 font-extrabold mr-1">{r.coefficient}</span>}
                            {r.formula}
                          </span>
                          {isLimiting && (
                            <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black tracking-wider">
                              Limiting
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          M = {r.parsed.molarMass.toFixed(3)} g/mol
                        </span>
                      </div>

                      {/* Input Value & Unit Selector */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={input.valueStr}
                          onChange={(e) => updateSpeciesInput(r.formula, 'valueStr', e.target.value)}
                          placeholder="Amount..."
                          className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500"
                        />
                        <select
                          value={input.unit}
                          onChange={(e) => updateSpeciesInput(r.formula, 'unit', e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="mg">mg</option>
                          <option value="mol">mol</option>
                          <option value="mmol">mmol</option>
                          <option value="L_STP">L (gas STP)</option>
                          <option value="mL_STP">mL (gas STP)</option>
                        </select>
                      </div>

                      {/* Summary Metrics */}
                      <div className="text-[10px] text-slate-400 font-mono space-y-1 pt-1 border-t border-slate-800/60">
                        <div className="flex justify-between">
                          <span>Initial Moles:</span>
                          <span className="text-slate-200 font-bold">
                            {(yieldResult.reactantsTable[i]?.initialMoles || 0).toFixed(4)} mol
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Initial Mass:</span>
                          <span className="text-emerald-300 font-bold">
                            {(yieldResult.reactantsTable[i]?.initialMassG || 0).toFixed(3)} g
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining Unreacted:</span>
                          <span className={`font-bold ${isLimiting ? 'text-slate-500' : 'text-amber-400'}`}>
                            {(yieldResult.reactantsTable[i]?.remainingMassG || 0).toFixed(3)} g ({yieldResult.reactantsTable[i]?.percentExcess.toFixed(1)}% excess)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reaction Progress & Actual Yield Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                {/* 1. Actual Reaction Yield Slider */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      Actual Laboratory Yield
                    </span>
                    <span className="text-emerald-400 font-black text-sm">{actualYieldPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={actualYieldPercent}
                    onChange={(e) => setActualYieldPercent(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (No Reaction)</span>
                    <span>50%</span>
                    <span>75% (Typical Organic)</span>
                    <span>100% (Theoretical Max)</span>
                  </div>
                </div>

                {/* 2. Reaction Extent Progress Slider */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      Reaction Extent (ξ = {(yieldResult.maxReactionExtentMoles * reactionExtentFraction).toFixed(4)} mol)
                    </span>
                    <span className="text-sky-400 font-black text-sm">{(reactionExtentFraction * 100).toFixed(0)}% Completion</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={reactionExtentFraction}
                    onChange={(e) => setReactionExtentFraction(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Initial (t=0)</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>Complete (ξ_max)</span>
                  </div>
                </div>
              </div>

              {/* Theoretical vs Actual Products Yield Table */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Product Yields & Output Quantities
                </h5>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Molar Mass</th>
                        <th className="py-2.5 px-3">Theoretical Moles</th>
                        <th className="py-2.5 px-3">Theoretical Mass</th>
                        <th className="py-2.5 px-3">Gas Volume ({standardLabel})</th>
                        <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Actual Yield ({actualYieldPercent}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {yieldResult.productsTable.map(p => (
                        <tr key={p.formula} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                            {p.coefficient > 1 && <span className="text-amber-400 font-bold mr-1">{p.coefficient}</span>}
                            <span>{p.formula}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {p.theoreticalMoles > 0 ? (p.theoreticalMassG / p.theoreticalMoles).toFixed(3) : '0'} g/mol
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{p.theoreticalMoles.toFixed(4)} mol</td>
                          <td className="py-2.5 px-3 text-slate-200 font-semibold">{p.theoreticalMassG.toFixed(3)} g</td>
                          <td className="py-2.5 px-3 text-sky-300">{p.theoreticalVolumeL_STP.toFixed(3)} L</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-300">
                            {p.actualMassG.toFixed(3)} g <span className="text-[10px] text-slate-400 font-normal">({p.actualMoles.toFixed(4)} mol)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mass Conservation Law Audit */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-slate-300 font-bold block">Lavoisier Law of Conservation of Mass</span>
                    <span className="text-slate-500 text-[11px]">
                      Total Initial Reactants ({yieldResult.totalInitialReactantMassG.toFixed(3)} g) = Total Products Formed + Excess Unreacted (Δm = {yieldResult.massConservationDeltaG.toFixed(6)} g)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(
                    `Stoichiometric Reaction Summary for ${balancedResult.balancedEquationString}:\n` +
                    `Limiting Reactant: ${yieldResult.limitingReactantFormula}\n` +
                    `Actual Yield: ${actualYieldPercent}%\n` +
                    `Products:\n` +
                    yieldResult.productsTable.map(p => ` - ${p.formula}: ${p.actualMassG.toFixed(3)} g (${p.actualMoles.toFixed(4)} mol)`).join('\n'),
                    'report'
                  )}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40 flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-center"
                >
                  {copiedText === 'report' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === 'report' ? 'Copied Report' : 'Copy Stoichiometry Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: STEP-BY-STEP CONVERSION ROADMAP */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                  Visual Step-by-Step Stoichiometric Conversion Pathway
                </h4>
                <p className="text-xs text-slate-400">
                  Select your given reactant/product and target species to visualize the dimensional analysis pathway with exact numerical substitution.
                </p>
              </div>
            </div>

            {/* Selection Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Given Species Card */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-sky-500/20 space-y-3">
                <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider block">
                  1. Given Substance (Species A)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roadmapGivenSpecies}
                    onChange={(e) => setRoadmapGivenSpecies(e.target.value)}
                    placeholder="Formula (e.g. Fe2O3)..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-sky-500 outline-none"
                  />
                  <input
                    type="number"
                    step="any"
                    value={roadmapGivenValueStr}
                    onChange={(e) => setRoadmapGivenValueStr(e.target.value)}
                    placeholder="Value..."
                    className="w-24 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-sky-500 outline-none"
                  />
                  <select
                    value={roadmapGivenUnit}
                    onChange={(e) => setRoadmapGivenUnit(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mol">mol</option>
                    <option value="L_STP">L (gas)</option>
                  </select>
                </div>
              </div>

              {/* Target Species Card */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider block">
                  2. Target Substance (Species B)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roadmapTargetSpecies}
                    onChange={(e) => setRoadmapTargetSpecies(e.target.value)}
                    placeholder="Formula (e.g. Fe)..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                  />
                  <select
                    value={roadmapTargetUnit}
                    onChange={(e) => setRoadmapTargetUnit(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="g">Convert to Grams (g)</option>
                    <option value="kg">Convert to Kilograms (kg)</option>
                    <option value="mol">Convert to Moles (mol)</option>
                    <option value="L_STP">Convert to Gas Volume (L)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Visual Roadmap Diagram */}
            {roadmapCalculation.valid && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
                  {/* Step 1 */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 relative">
                    <span className="text-[10px] text-sky-400 uppercase tracking-wider font-bold block">
                      Step 1: Convert Given to Moles
                    </span>
                    <div className="text-sm font-bold text-white">
                      {roadmapGivenValueStr} {roadmapGivenUnit} of {roadmapGivenSpecies}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      n_A = {roadmapCalculation.molesGiven.toFixed(4)} mol
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                    <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold block">
                      Step 2: Apply Mole Ratio (ν_B / ν_A)
                    </span>
                    <div className="text-sm font-bold text-indigo-300">
                      Ratio: {roadmapCalculation.nu_target} : {roadmapCalculation.nu_given}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      n_B = {roadmapCalculation.molesGiven.toFixed(4)} × ({roadmapCalculation.nu_target}/{roadmapCalculation.nu_given})
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold block">
                      Step 3: Moles of Target Produced
                    </span>
                    <div className="text-sm font-bold text-amber-300">
                      {roadmapCalculation.molesTarget.toFixed(4)} mol of {roadmapTargetSpecies}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      N = {roadmapCalculation.targetMolecules.toExponential(4)} molecules
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 space-y-2 shadow-md">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">
                      Step 4: Final Target Quantity
                    </span>
                    <div className="text-base font-black text-emerald-300">
                      {roadmapCalculation.targetOutputVal.toFixed(4)} {roadmapTargetUnit}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      M_B = {roadmapCalculation.targetParsed.molarMass.toFixed(3)} g/mol
                    </div>
                  </div>
                </div>

                {/* Mathematical Dimensional Analysis Equation */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 font-mono block">
                    Dimensional Analysis Substitution Formula:
                  </span>
                  <div className="text-xs text-emerald-300 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                    {roadmapGivenValueStr} {roadmapGivenUnit} × (1 mol {roadmapGivenSpecies} / {roadmapCalculation.givenParsed.molarMass.toFixed(2)} g) × ({roadmapCalculation.nu_target} mol {roadmapTargetSpecies} / {roadmapCalculation.nu_given} mol {roadmapGivenSpecies}) × ({roadmapCalculation.targetParsed.molarMass.toFixed(2)} g / 1 mol {roadmapTargetSpecies}) = <strong className="text-white text-sm">{roadmapCalculation.targetOutputVal.toFixed(4)} {roadmapTargetUnit}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SOLUTIONS, DILUTION & TITRATION */}
      {activeSubTab === 'solutions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Solution Molarity Preparation Calculator */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Beaker className="w-4 h-4 text-sky-400" />
              Volumetric Solution Preparation Recipe
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Solute Chemical Formula</span>
                <input
                  type="text"
                  value={solSoluteFormula}
                  onChange={(e) => setSolSoluteFormula(e.target.value)}
                  placeholder="e.g. NaCl, CuSO4, NaOH..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-sky-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Target Molarity (M = mol/L)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={solTargetMolarity}
                  onChange={(e) => setSolTargetMolarity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-sky-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Target Solution Volume (mL)</span>
                <input
                  type="number"
                  step="10"
                  min="1"
                  value={solTargetVolumeMl}
                  onChange={(e) => setSolTargetVolumeMl(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            {/* Recipe Output Card */}
            {solutionPrep.valid && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-sky-500/30 space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs text-sky-400 font-bold">Standard Lab Preparation Protocol</span>
                  <span className="text-xs text-slate-400">Solute Molar Mass: {solutionPrep.solute.molarMass.toFixed(3)} g/mol</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-2 text-slate-200">
                  <p>
                    1. Accurately weigh <strong className="text-emerald-400 text-sm font-bold">{solutionPrep.massG.toFixed(4)} g</strong> of analytical grade <strong className="text-white">{solSoluteFormula}</strong> on an analytical balance.
                  </p>
                  <p>
                    2. Transfer into a <strong className="text-sky-300">{solTargetVolumeMl} mL volumetric flask</strong> containing ~50% deionized water and swirl to dissolve completely.
                  </p>
                  <p>
                    3. Dilute with deionized water to the calibrated meniscus line, invert 10 times to homogenize.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                    <span className="text-[9.5px] text-slate-500 uppercase block">Moles</span>
                    <span className="text-xs font-bold text-white">{solutionPrep.moles.toFixed(4)} mol</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                    <span className="text-[9.5px] text-slate-500 uppercase block">Mass Fraction</span>
                    <span className="text-xs font-bold text-emerald-400">{solutionPrep.massPercent.toFixed(2)}% w/w</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                    <span className="text-[9.5px] text-slate-500 uppercase block">Molality</span>
                    <span className="text-xs font-bold text-amber-400">{solutionPrep.molality.toFixed(4)} m</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                    <span className="text-[9.5px] text-slate-500 uppercase block">PPM (mg/L)</span>
                    <span className="text-xs font-bold text-purple-400">{solutionPrep.ppm.toFixed(0)} ppm</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dilution Calculator (M1 V1 = M2 V2) */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              Stock Solution Serial Dilution Solver (M₁ · V₁ = M₂ · V₂)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Stock Conc (M₁)</span>
                <input
                  type="number"
                  step="any"
                  value={dilM1}
                  onChange={(e) => setDilM1(e.target.value)}
                  placeholder="M1 (mol/L)..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Stock Vol (V₁)</span>
                <input
                  type="number"
                  step="any"
                  value={dilV1}
                  onChange={(e) => setDilV1(e.target.value)}
                  placeholder="Leave empty to solve"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Target Conc (M₂)</span>
                <input
                  type="number"
                  step="any"
                  value={dilM2}
                  onChange={(e) => setDilM2(e.target.value)}
                  placeholder="M2 (mol/L)..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Target Vol (V₂)</span>
                <input
                  type="number"
                  step="any"
                  value={dilV2}
                  onChange={(e) => setDilV2(e.target.value)}
                  placeholder="V2 (mL)..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {dilutionResult.valid && (
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/30 text-xs font-mono text-slate-200">
                Dilution Result: Pipette <strong className="text-emerald-400 text-sm">{dilutionResult.val.toFixed(2)} mL</strong> of Stock Solution (M₁) and dilute with <strong className="text-sky-300">{dilutionResult.solventToAdd?.toFixed(2)} mL</strong> of solvent to obtain <strong className="text-white">{dilV2} mL</strong> of {dilM2} M solution.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: EMPIRICAL & MOLECULAR FORMULA */}
      {activeSubTab === 'empirical' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Atom className="w-4 h-4 text-purple-400" />
                  Empirical & Molecular Formula Determination
                </h4>
                <p className="text-xs text-slate-400">
                  Input elemental mass percentages (% w/w) or sample masses in grams to determine simplest integer ratios and true molecular formulas.
                </p>
              </div>

              <button
                onClick={() => {
                  setEmpiricalRows(prev => [
                    ...prev,
                    { id: String(Date.now()), symbol: 'N', massOrPercent: '10.0' }
                  ]);
                  playSynthTone('tick');
                }}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Element
              </button>
            </div>

            {/* Elements Inputs Table */}
            <div className="space-y-2">
              {empiricalRows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    value={row.symbol}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmpiricalRows(prev => prev.map(r => r.id === row.id ? { ...r, symbol: val } : r));
                    }}
                    placeholder="Symbol (e.g. C)..."
                    className="w-24 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-purple-500 outline-none uppercase font-bold"
                  />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={row.massOrPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmpiricalRows(prev => prev.map(r => r.id === row.id ? { ...r, massOrPercent: val } : r));
                    }}
                    placeholder="Mass % or grams..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-purple-500 outline-none"
                  />
                  <span className="text-xs font-mono text-slate-400 w-16">
                    {IUPAC_ATOMIC_WEIGHTS[row.symbol.trim()]?.weight ? `${IUPAC_ATOMIC_WEIGHTS[row.symbol.trim()].weight.toFixed(2)} g/mol` : '—'}
                  </span>
                  {empiricalRows.length > 1 && (
                    <button
                      onClick={() => {
                        setEmpiricalRows(prev => prev.filter(r => r.id !== row.id));
                        playSynthTone('tick');
                      }}
                      className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Experimental Molecular Mass Input */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-300 font-mono block">Experimental Molecular Mass (Optional)</span>
                <span className="text-[11px] text-slate-500 font-sans">
                  From mass spectrometry or freezing point depression to calculate true molecular formula.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={experimentalMolarMass}
                  onChange={(e) => setExperimentalMolarMass(e.target.value)}
                  placeholder="e.g. 180.16 g/mol..."
                  className="w-40 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-purple-500 outline-none"
                />
                <span className="text-xs text-slate-400 font-mono">g/mol</span>
              </div>
            </div>

            {/* Calculated Results Card */}
            {empiricalCalc.valid && (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 space-y-4 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Empirical Formula</span>
                    <div className="text-xl font-black text-purple-300">
                      {empiricalCalc.empiricalFormula}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      M_empirical = {empiricalCalc.empiricalMolarMass.toFixed(3)} g/mol
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">True Molecular Formula</span>
                    <div className="text-xl font-black text-emerald-400">
                      {empiricalCalc.molecularFormula}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Multiplier n = {empiricalCalc.molecularMultiplier}× (M_molecular = {empiricalCalc.molecularMolarMass.toFixed(3)} g/mol)
                    </span>
                  </div>
                </div>

                {/* Step Breakdown Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <th className="py-2 px-3">Element</th>
                        <th className="py-2 px-3">Input Mass / %</th>
                        <th className="py-2 px-3">Moles (n = m / M)</th>
                        <th className="py-2 px-3">Mole Ratio (÷ min)</th>
                        <th className="py-2 px-3 text-right">Subscript</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {empiricalCalc.elements.map(el => (
                        <tr key={el.symbol} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-bold text-white">{el.symbol} ({el.name})</td>
                          <td className="py-2 px-3 text-slate-300">{el.inputVal}</td>
                          <td className="py-2 px-3 text-slate-400">{el.moles.toFixed(4)} mol</td>
                          <td className="py-2 px-3 text-purple-300">{el.rawRatio.toFixed(3)}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-white">{el.integerCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SOLID-STATE CERAMIC PRECURSORS */}
      {activeSubTab === 'ceramics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Solid-State Ceramics & Thin-Film Precursor Batch Weigher
                </h4>
                <p className="text-xs text-slate-400">
                  Calculate precise precursor weights to synthesize a target quantity of ceramic materials with volatile carbonate/gas mass-loss compensation.
                </p>
              </div>
            </div>

            {/* Target Ceramic Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Target Ceramic Phase Formula</span>
                <input
                  type="text"
                  value={ceramicTargetCompound}
                  onChange={(e) => setCeramicTargetCompound(e.target.value)}
                  placeholder="e.g. BaTiO3, YBa2Cu3O7, LiFePO4..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-300 font-semibold">Desired Target Mass (grams)</span>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={ceramicTargetMassG}
                  onChange={(e) => setCeramicTargetMassG(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Precursors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-300">Precursor 1 (e.g. Carbonate / Oxide)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ceramicPrecursor1.formula}
                    onChange={(e) => setCeramicPrecursor1(prev => ({ ...prev, formula: e.target.value }))}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={ceramicPrecursor1.stoichiometricCoeff}
                    onChange={(e) => setCeramicPrecursor1(prev => ({ ...prev, stoichiometricCoeff: parseFloat(e.target.value) || 1 }))}
                    className="w-16 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                    title="Stoichiometric coefficient"
                  />
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-300">Precursor 2 (e.g. Refractory Oxide)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ceramicPrecursor2.formula}
                    onChange={(e) => setCeramicPrecursor2(prev => ({ ...prev, formula: e.target.value }))}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={ceramicPrecursor2.stoichiometricCoeff}
                    onChange={(e) => setCeramicPrecursor2(prev => ({ ...prev, stoichiometricCoeff: parseFloat(e.target.value) || 1 }))}
                    className="w-16 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                    title="Stoichiometric coefficient"
                  />
                </div>
              </div>
            </div>

            {/* Batch Results Card */}
            {ceramicsBatch.valid && (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold">Solid-State Batch Preparation Recipe</span>
                  <span className="text-slate-400">Target Moles: {ceramicsBatch.targetMoles.toFixed(4)} mol</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-semibold block">Weigh Precursor 1 ({ceramicPrecursor1.formula}):</span>
                    <div className="text-lg font-bold text-emerald-300">
                      {ceramicsBatch.p1MassG.toFixed(4)} g
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-semibold block">Weigh Precursor 2 ({ceramicPrecursor2.formula}):</span>
                    <div className="text-lg font-bold text-sky-300">
                      {ceramicsBatch.p2MassG.toFixed(4)} g
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-lg text-[11px] text-slate-300 space-y-1 border border-slate-800/80 font-sans">
                  <p>
                    • <strong>Total Precursor Batch Mass:</strong> {ceramicsBatch.totalPrecursorMassG.toFixed(4)} g
                  </p>
                  <p>
                    • <strong>Expected Calcination Gas Mass Loss (CO₂ / H₂O):</strong> {ceramicsBatch.massLossG.toFixed(4)} g ({ceramicsBatch.massLossPercent.toFixed(1)}% LOI)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
