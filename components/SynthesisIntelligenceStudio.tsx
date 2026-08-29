import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from "recharts";
import {
  Sparkles,
  FlaskConical,
  Scale,
  Activity,
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  ChevronDown,
  RefreshCw,
  Zap,
  Layers,
  Thermometer,
  Timer,
  Droplets,
  Wind,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Atom,
  Eye,
  Info,
  Maximize2,
  Cpu,
  Brain,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Beaker,
  Gauge
} from "lucide-react";
import { DLPhaseCandidate } from "../types";
import { PRECURSOR_DATABASE, parseChemicalFormula, PrecursorInfo } from "./DeepLearningModule";

export type SynthMorphologyType =
  | "spherical"
  | "nanowire"
  | "nanosheet"
  | "cuboidal"
  | "octahedral"
  | "hexagonal"
  | "core_shell";

export type SynthAtmosphereType =
  | "air"
  | "argon"
  | "nitrogen"
  | "oxygen"
  | "forming_gas"
  | "vacuum";

export interface SynthesisIntelligenceStudioProps {
  selectedCandidate: DLPhaseCandidate | null;
  candidates?: DLPhaseCandidate[];
  onSelectCandidate?: (candidate: DLPhaseCandidate) => void;
  // Morphology & Autoclave parameters
  synthMorphology: SynthMorphologyType;
  setSynthMorphology: (m: SynthMorphologyType) => void;
  synthSize: number;
  setSynthSize: (size: number) => void;
  synthTemp: number;
  setSynthTemp: (temp: number) => void;
  synthDoping: number;
  setSynthDoping: (doping: number) => void;
  synthTime: number;
  setSynthTime: (time: number) => void;
  synthPH: number;
  setSynthPH: (ph: number) => void;
  synthAtmosphere: SynthAtmosphereType;
  setSynthAtmosphere: (atm: SynthAtmosphereType) => void;
  // Stoichiometry & Batch
  synthTargetMass: number;
  setSynthTargetMass: (mass: number) => void;
  selectedPrecursors: Record<string, string>;
  setSelectedPrecursors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  customPrecursorMws: Record<string, number>;
  setCustomPrecursorMws: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  dopantElement: string;
  setDopantElement: (el: string) => void;
  dopedSubstitutedElement: string;
  setDopedSubstitutedElement: (el: string) => void;
  // AI Formulation Result & Handlers
  synthAiResult: string | null;
  synthAiLoading: boolean;
  synthAiFocus: "purity" | "defects" | "confinement";
  setSynthAiFocus: (focus: "purity" | "defects" | "confinement") => void;
  synthAiStep: string;
  onRunSynthesisAI: () => Promise<void>;
  onSimulateXRD?: () => void;
}

// Available standard solvents for synthesis selection
const SOLVENT_OPTIONS = [
  { id: "deionized_water", name: "Deionized Water (Milli-Q)", bp: 100, dielectric: 80.1, polarity: "High", type: "Aqueous" },
  { id: "ethanol", name: "Absolute Ethanol (99.9%)", bp: 78.4, dielectric: 24.5, polarity: "Moderate", type: "Alcohol" },
  { id: "ethylene_glycol", name: "Ethylene Glycol (EG)", bp: 197.3, dielectric: 37.7, polarity: "High/Polyol", type: "Polyol" },
  { id: "dmf", name: "N,N-Dimethylformamide (DMF)", bp: 153.0, dielectric: 36.7, polarity: "High Polar Aprotic", type: "Aprotic" },
  { id: "benzyl_ether", name: "Benzyl Ether", bp: 298.0, dielectric: 3.8, polarity: "Low Non-polar", type: "High-Boiling Organic" },
  { id: "isopropanol", name: "Isopropanol (IPA)", bp: 82.6, dielectric: 17.9, polarity: "Moderate", type: "Alcohol" },
  { id: "oleic_acid_octadecene", name: "Oleic Acid / 1-Octadecene", bp: 315.0, dielectric: 2.1, polarity: "Non-polar Ligand", type: "Colloidal" }
];

// Common capping agents / surfactants
const SURFACTANT_OPTIONS = [
  { id: "ctab", name: "CTAB (Cetyltrimethylammonium Bromide)", role: "Cationic Surfactant • Facet [111] Directional Growth", charge: "+ (Cationic)" },
  { id: "pvp", name: "PVP (Polyvinylpyrrolidone, MW 40k)", role: "Steric Stabilizer • Anti-Aggregation & Nanocube Faceting", charge: "Neutral" },
  { id: "oleic_acid", name: "Oleic Acid (OA)", role: "Carboxylic Capping • Monodisperse Quantum Dot Passivation", charge: "Hydrophobic" },
  { id: "citric_acid", name: "Citric Acid Monohydrate", role: "Chelating & Complexing Agent • Sol-Gel Pechini Route", charge: "Anionic" },
  { id: "oleylamine", name: "Oleylamine (OLA)", role: "Reducing & Coordinating Solvent • Metal Nanocrystals", charge: "Amine" },
  { id: "peg_400", name: "PEG-400 (Polyethylene Glycol)", role: "Viscosity Modifier & Mild Dispersant", charge: "Non-ionic" }
];

export const SynthesisIntelligenceStudio: React.FC<SynthesisIntelligenceStudioProps> = ({
  selectedCandidate,
  candidates = [],
  onSelectCandidate,
  synthMorphology,
  setSynthMorphology,
  synthSize,
  setSynthSize,
  synthTemp,
  setSynthTemp,
  synthDoping,
  setSynthDoping,
  synthTime,
  setSynthTime,
  synthPH,
  setSynthPH,
  synthAtmosphere,
  setSynthAtmosphere,
  synthTargetMass,
  setSynthTargetMass,
  selectedPrecursors,
  setSelectedPrecursors,
  customPrecursorMws,
  setCustomPrecursorMws,
  dopantElement,
  setDopantElement,
  dopedSubstitutedElement,
  setDopedSubstitutedElement,
  synthAiResult,
  synthAiLoading,
  synthAiFocus,
  setSynthAiFocus,
  synthAiStep,
  onRunSynthesisAI,
  onSimulateXRD
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "fa";

  // Active studio view tab
  const [activeSubTab, setActiveSubTab] = useState<
    "autoclave" | "ai_route" | "stoichiometry" | "kinetics" | "sop_protocol"
  >("autoclave");

  // Selected solvent and surfactant
  const [selectedSolvent, setSelectedSolvent] = useState<string>("deionized_water");
  const [selectedSurfactant, setSelectedSurfactant] = useState<string>("pvp");

  // Copy status indicators
  const [copiedRecipe, setCopiedRecipe] = useState<boolean>(false);
  const [copiedStoich, setCopiedStoich] = useState<boolean>(false);

  // SOP interactive checklist states
  const [sopChecked, setSopChecked] = useState<Record<string, boolean>>({
    step_ppe: true,
    step_weighing: false,
    step_dissolution: false,
    step_autoclave: false,
    step_calcination: false,
    step_washing: false,
    step_xrd: false
  });

  // Calculate stoichiometry derived values
  const stoichCalculation = useMemo(() => {
    if (!selectedCandidate) {
      return {
        success: false,
        mwProduct: 100,
        precursors: [],
        totalPrecursorMassGrams: 0,
        errors: ["No candidate phase selected"]
      };
    }

    const formula = selectedCandidate.formula;
    const parsedElements = parseChemicalFormula(formula);
    const activeElements = Object.keys(parsedElements).filter((el) => el !== "O" && el !== "H");

    const dopingFraction = synthDoping / 100.0;
    const actualSubstitutedSite = dopedSubstitutedElement || activeElements[0] || "";

    const stoichCoeffs: Record<string, number> = {};
    let mwProduct = 0;

    Object.entries(parsedElements).forEach(([el, count]) => {
      if (el === actualSubstitutedSite && dopantElement && dopingFraction > 0) {
        stoichCoeffs[el] = count * (1.0 - dopingFraction);
      } else {
        stoichCoeffs[el] = count;
      }
    });

    if (dopantElement && dopingFraction > 0 && actualSubstitutedSite) {
      const parentCoeff = parsedElements[actualSubstitutedSite] || 1.0;
      stoichCoeffs[dopantElement] = parentCoeff * dopingFraction;
    }

    // Atomic weights helper
    const ATOMIC_WEIGHTS: Record<string, number> = {
      H: 1.008, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998,
      Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45,
      K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938,
      Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.63,
      As: 74.922, Se: 78.971, Br: 79.904, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
      Nb: 92.906, Mo: 95.95, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41,
      In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.6, Ba: 137.33, La: 138.91, Ce: 140.12,
      Pr: 140.91, Nd: 144.24, Sm: 150.36, Eu: 151.96, Gd: 157.25, Tb: 158.93, Dy: 162.5,
      Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49, Ta: 180.95,
      W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Pb: 207.2,
      Bi: 208.98, Th: 232.04, U: 238.03
    };

    Object.entries(stoichCoeffs).forEach(([el, coeff]) => {
      const w = ATOMIC_WEIGHTS[el] || 50.0;
      mwProduct += coeff * w;
    });

    if (mwProduct === 0) mwProduct = selectedCandidate.molecularWeight || 100;

    const molesProduct = synthTargetMass / mwProduct;

    let totalPrecursorMassGrams = 0;

    const precursorsList = Object.entries(stoichCoeffs)
      .filter(([el]) => el !== "O" && el !== "H")
      .map(([el, coeff]) => {
        const molesElement = molesProduct * coeff;
        const dbPrecursors = PRECURSOR_DATABASE[el] || [];
        const chosenPrecursorName =
          selectedPrecursors[el] || (dbPrecursors[0] ? dbPrecursors[0].name : "Custom Precursor");

        let precursorFormula = "";
        let precursorMw = 0;
        let atomsPerMolecule = 1;

        if (chosenPrecursorName === "Custom Precursor") {
          precursorFormula = "Custom";
          precursorMw = customPrecursorMws[el] || ATOMIC_WEIGHTS[el] || 50.0;
          atomsPerMolecule = 1;
        } else {
          const found = dbPrecursors.find((p) => p.name === chosenPrecursorName);
          if (found) {
            precursorFormula = found.formula;
            precursorMw = found.mw;
            atomsPerMolecule = found.atomsPerMolecule;
          } else {
            precursorFormula = el;
            precursorMw = ATOMIC_WEIGHTS[el] || 50.0;
            atomsPerMolecule = 1;
          }
        }

        const molesPrecursor = molesElement / atomsPerMolecule;
        const massGrams = molesPrecursor * precursorMw;
        const massMilligrams = massGrams * 1000;
        totalPrecursorMassGrams += massGrams;

        return {
          element: el,
          stoichCoeff: coeff,
          molesElement,
          precursorName: chosenPrecursorName,
          precursorFormula,
          precursorMw,
          atomsPerMolecule,
          molesPrecursor,
          massGrams,
          massMilligrams
        };
      });

    return {
      success: true,
      errors: [],
      mwProduct,
      stoichCoeffs,
      precursors: precursorsList,
      totalPrecursorMassGrams,
      actualSubstitutedSite
    };
  }, [
    selectedCandidate,
    synthTargetMass,
    synthDoping,
    dopantElement,
    dopedSubstitutedElement,
    selectedPrecursors,
    customPrecursorMws
  ]);

  // JMAK Kinetics Curve dataset generator
  const jmakKineticsData = useMemo(() => {
    const T_K = 273.15 + synthTemp;
    const baseEa = 45000; // 45 kJ/mol
    const atmFactor =
      synthAtmosphere === "oxygen"
        ? 1.25
        : synthAtmosphere === "argon"
        ? 0.8
        : synthAtmosphere === "nitrogen"
        ? 0.85
        : synthAtmosphere === "forming_gas"
        ? 1.15
        : 1.0;

    const phFactor =
      synthPH < 6 ? 1 + (6 - synthPH) * 0.1 : synthPH > 8 ? 1 + (synthPH - 8) * 0.15 : 0.9;

    const k_rate =
      0.005 *
      Math.exp(-baseEa / (8.314 * T_K)) *
      1e4 *
      atmFactor *
      phFactor *
      (1.0 + (50.0 - synthSize) * 0.02);

    let n_exp = 3.0; // 3D sphere
    if (synthMorphology === "nanowire") n_exp = 1.5; // 1D
    else if (synthMorphology === "nanosheet") n_exp = 2.0; // 2D
    else if (synthMorphology === "cuboidal") n_exp = 2.8;
    else if (synthMorphology === "octahedral") n_exp = 3.2;
    else if (synthMorphology === "hexagonal") n_exp = 2.4;
    else if (synthMorphology === "core_shell") n_exp = 3.5;

    const points = [];
    const totalHours = 24.0;
    const step = 0.5;

    for (let t_hr = 0; t_hr <= totalHours; t_hr += step) {
      // JMAK equation: X(t) = 1 - exp(-k * t^n)
      const t_scaled = t_hr * 10;
      const term = -k_rate * Math.pow(t_scaled, n_exp);
      const X_frac = Math.max(0, Math.min(1.0, 1.0 - Math.exp(term)));
      const X_pct = X_frac * 100;
      const rate_dxdt = n_exp * k_rate * Math.pow(Math.max(0.1, t_scaled), n_exp - 1) * Math.exp(term) * 100;

      points.push({
        time: t_hr,
        crystallinity: parseFloat(X_pct.toFixed(2)),
        growthRate: parseFloat(rate_dxdt.toFixed(3)),
        currentDwell: Math.abs(t_hr - synthTime) < 0.26
      });
    }

    const currentYield = Math.min(
      99.9,
      Math.max(
        0.1,
        (1.0 - Math.exp(-k_rate * Math.pow(synthTime * 10, n_exp))) * 100
      )
    );

    return {
      points,
      k_rate,
      n_exp,
      baseEa,
      currentYield
    };
  }, [synthTemp, synthAtmosphere, synthPH, synthSize, synthMorphology, synthTime]);

  // Derived quantum confinement & physical metrics
  const physicsReadouts = useMemo(() => {
    if (!selectedCandidate) {
      return {
        bulkEg: 0,
        confinementShift: 0,
        effectiveEg: 0,
        ssa: 0,
        dislocationDensity: 0,
        strainPct: 0,
        estPressureBar: 1.0
      };
    }

    const density = selectedCandidate.density || 4.5;
    const bulkEg = selectedCandidate.bandGap || 0;
    const size = Math.max(2.0, synthSize);

    // Quantum confinement shift (effective mass model ~ h^2 / 8m*r^2)
    const confinementShift = bulkEg > 0 ? parseFloat((15.55 / Math.pow(size, 2)).toFixed(3)) : 0;
    const effectiveEg = parseFloat((bulkEg + confinementShift).toFixed(3));

    // Specific Surface Area (BET) = 6000 / (density * diameter_nm) m^2/g
    const ssa = parseFloat((6000.0 / (density * size)).toFixed(1));

    // Microstrain (lattice mismatch and surface tension ~ 1 / D)
    const strainPct = parseFloat(((0.15 + (15.0 / size) * 0.08) * (1.0 + synthDoping * 0.12)).toFixed(3));

    // Dislocation density delta = 1 / D^2 (lines / m^2)
    const dislocationDensity = parseFloat(((1.0 / Math.pow(size * 1e-9, 2)) * 1e-14).toFixed(2));

    // Saturated vapor pressure estimate for hydrothermal water/solvent
    const T_C = synthTemp;
    let estPressureBar = 1.0;
    if (T_C > 100) {
      // Antoine equation approximation for water
      estPressureBar = Math.min(
        250.0,
        Math.exp(11.6834 - 3816.44 / (T_C + 227.02))
      );
    }

    return {
      bulkEg,
      confinementShift,
      effectiveEg,
      ssa,
      dislocationDensity,
      strainPct,
      estPressureBar: parseFloat(estPressureBar.toFixed(1))
    };
  }, [selectedCandidate, synthSize, synthDoping, synthTemp]);

  // Copy synthesis AI recipe to clipboard
  const handleCopyRecipe = () => {
    if (!synthAiResult) return;
    navigator.clipboard.writeText(synthAiResult);
    setCopiedRecipe(true);
    setTimeout(() => setCopiedRecipe(false), 2000);
  };

  // Download recipe as markdown
  const handleDownloadRecipe = () => {
    if (!synthAiResult) return;
    const header = `# XRD-Calc Pro - AI Synthesis Formulation Route\nTarget Phase: ${selectedCandidate?.phase_name} (${selectedCandidate?.formula})\nDate: ${new Date().toISOString()}\n\n`;
    const blob = new Blob([header + synthAiResult], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Synthesis_Recipe_${selectedCandidate?.phase_name || "Material"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download complete characterization & SOP audit report
  const handleDownloadAuditReport = () => {
    if (!selectedCandidate) return;

    const content = `================================================================================
XRD-CALC PRO - QUANTUM SYNTHESIS & CHARACTERIZATION AUDIT REPORT
================================================================================
Generated: ${new Date().toLocaleString()}
Target Material Phase: ${selectedCandidate.phase_name}
Chemical Formula     : ${selectedCandidate.formula}
Space Group          : ${selectedCandidate.spaceGroup || "Unknown"}
Crystal System       : ${selectedCandidate.crystalSystem || "Unknown"}
Confidence C-Score   : ${selectedCandidate.confidence_score.toFixed(1)}%

--- SYNTHESIS AUTOCLAVE & REACTION BOUNDARIES ---
Target Morphology       : ${synthMorphology.toUpperCase()}
Target Crystallite Size : ${synthSize.toFixed(1)} nm
Reaction Temperature    : ${synthTemp} °C (${synthTemp + 273.15} K)
Autoclave Duration      : ${synthTime.toFixed(1)} hours
Solution pH Level       : ${synthPH.toFixed(1)}
Reaction Atmosphere     : ${synthAtmosphere.toUpperCase()}
Target Batch Mass       : ${synthTargetMass.toFixed(2)} g
Lattice Dopant Level    : ${synthDoping.toFixed(1)} mol% ${dopantElement ? `(${dopantElement} on ${dopedSubstitutedElement} site)` : ""}

--- QUANTUM CONFINEMENT & PHYSICAL METROLOGY ---
Bulk Band Gap (Eg_bulk) : ${physicsReadouts.bulkEg.toFixed(3)} eV
Confinement Shift (ΔEg) : +${physicsReadouts.confinementShift.toFixed(3)} eV
Effective Nanocrystal Eg: ${physicsReadouts.effectiveEg.toFixed(3)} eV
Specific Surface Area   : ${physicsReadouts.ssa.toFixed(1)} m²/g
Estimated Microstrain   : ${physicsReadouts.strainPct.toFixed(3)} %
Dislocation Density     : ${physicsReadouts.dislocationDensity.toFixed(2)} × 10¹⁴ lines/m²
Hydrothermal Est. Press : ${physicsReadouts.estPressureBar} bar

--- STOICHIOMETRIC PRECURSOR BATCH FORMULATION ---
Target Product Mass: ${synthTargetMass.toFixed(3)} g
Molecular Weight   : ${stoichCalculation.mwProduct.toFixed(2)} g/mol
Required Precursors:
${stoichCalculation.precursors
  .map(
    (p, i) =>
      `${i + 1}. [${p.element}] ${p.precursorName} (${p.precursorFormula}) | MW: ${p.precursorMw.toFixed(2)} g/mol | Req Mass: ${p.massGrams.toFixed(4)} g (${p.massMilligrams.toFixed(1)} mg)`
  )
  .join("\n")}
Total Precursor Mass Sum: ${stoichCalculation.totalPrecursorMassGrams.toFixed(4)} g

--- JMAK CRYSTALLIZATION KINETICS ---
Kinetic Rate Constant k : ${jmakKineticsData.k_rate.toExponential(3)} s⁻¹
Avrami Exponent (n)     : ${jmakKineticsData.n_exp.toFixed(2)}
Activation Energy (Ea)  : ${(jmakKineticsData.baseEa / 1000).toFixed(1)} kJ/mol
Simulated Yield at ${synthTime}h: ${jmakKineticsData.currentYield.toFixed(2)} %

${synthAiResult ? `\n--- GEMINI AI SYNTHESIS FORMULATION ROUTE ---\n${synthAiResult}\n` : ""}
================================================================================
XRD Scientific Intelligence Suite • Laboratory Protocol Approved
================================================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Synthesis_Audit_Report_${selectedCandidate.phase_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!selectedCandidate) {
    return (
      <div className="p-12 text-center bg-[#070D18]/80 rounded-3xl border border-slate-800 flex flex-col items-center justify-center">
        <Atom className="w-16 h-16 text-indigo-400/40 mb-4 animate-pulse" />
        <h4 className="text-xl font-bold text-white mb-2">
          {t("No Predicted Phase Selected", "No Predicted Phase Selected")}
        </h4>
        <p className="text-sm text-slate-400 max-w-md">
          {t(
            "Execute the Convolutional Phase Identification Neural Net or select a candidate phase from the identification board to activate Synthesis Intelligence.",
            "Execute the Convolutional Phase Identification Neural Net or select a candidate phase from the identification board to activate Synthesis Intelligence."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* 1. Executive Material Header & Candidate Switcher */}
      <div className="bg-[#050A14]/90 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-20 translate-x-20" />

        {/* Phase candidate chips switcher if multiple exist */}
        {candidates.length > 1 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mr-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {t("Candidate Phases:", "Candidate Phases:")}
            </span>
            {candidates.map((c, idx) => {
              const isSelected = c.phase_name === selectedCandidate.phase_name;
              return (
                <button
                  key={`${c.phase_name}-${idx}`}
                  onClick={() => onSelectCandidate && onSelectCandidate(c)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-indigo-600/30 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <span>{c.phase_name}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-indigo-500/40 text-indigo-200" : "bg-black/30 text-slate-500"
                    }`}
                  >
                    {c.confidence_score.toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-indigo-500/40 flex items-center justify-center relative shadow-[0_0_30px_rgba(99,102,241,0.25)] shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_70%)] animate-pulse" />
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)] relative z-10" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Synthesis Ready
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-300">
                  C-Score: {selectedCandidate.confidence_score.toFixed(1)}%
                </span>
                {selectedCandidate.crystalSystem && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                    {selectedCandidate.crystalSystem}
                  </span>
                )}
                {selectedCandidate.spaceGroup && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                    SG: {selectedCandidate.spaceGroup}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
                {selectedCandidate.phase_name}{" "}
                <span className="text-indigo-400 font-mono font-bold text-xl sm:text-2xl ml-2">
                  [{selectedCandidate.formula}]
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl line-clamp-2">
                {selectedCandidate.description ||
                  "Crystallographic phase formulation and morphological growth optimization engine."}
              </p>
            </div>
          </div>

          {/* Quick executive actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onRunSynthesisAI}
              disabled={synthAiLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {synthAiLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
              )}
              <span>{synthAiLoading ? t("Formulating AI Recipe...", "Formulating AI Recipe...") : t("Run Gemini Synthesis AI", "Run Gemini Synthesis AI")}</span>
            </button>

            <button
              onClick={handleDownloadAuditReport}
              className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
              title="Download Full Synthesis Protocol & SOP"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{t("Audit Report", "Audit Report")}</span>
            </button>
          </div>
        </div>

        {/* 2. Studio Sub-Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            {
              id: "autoclave",
              label: t("Autoclave & Morphology", "Autoclave & Morphology"),
              icon: FlaskConical,
              color: "text-cyan-400",
              badge: synthMorphology.toUpperCase()
            },
            {
              id: "ai_route",
              label: t("Gemini AI Recipe", "Gemini AI Recipe"),
              icon: Sparkles,
              color: "text-indigo-400",
              badge: synthAiResult ? t("Generated", "Generated") : undefined
            },
            {
              id: "stoichiometry",
              label: t("Stoichiometric Batcher", "Stoichiometric Batcher"),
              icon: Scale,
              color: "text-emerald-400",
              badge: `${synthTargetMass}g`
            },
            {
              id: "kinetics",
              label: t("JMAK Kinetics & Thermo", "JMAK Kinetics & Thermo"),
              icon: TrendingUp,
              color: "text-amber-400",
              badge: `${jmakKineticsData.currentYield.toFixed(0)}% Yield`
            },
            {
              id: "sop_protocol",
              label: t("Laboratory SOP Protocol", "Laboratory SOP Protocol"),
              icon: FileText,
              color: "text-pink-400",
              badge: undefined
            }
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shrink-0 flex items-center gap-2.5 relative ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40" : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="synthesisActiveTabIndicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Tab Content Router */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: AUTOCLAVE & MORPHOLOGY STUDIO */}
        {activeSubTab === "autoclave" && (
          <motion.div
            key="tab-autoclave"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Reaction Parameters & Autoclave Controls (5 cols) */}
            <div className="lg:col-span-5 bg-[#050A14]/90 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      {t("Autoclave & Reaction Controls", "Autoclave & Reaction Controls")}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {t("Hydrothermal & Calcination Boundaries", "Hydrothermal & Calcination Boundaries")}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {physicsReadouts.estPressureBar} bar P_sat
                </span>
              </div>

              {/* Morphology Selector Grid */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                  {t("Target Nanostructure Morphology", "Target Nanostructure Morphology")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "spherical", label: "Quantum Dot", icon: "●" },
                    { key: "nanowire", label: "Nanowire", icon: "▮" },
                    { key: "nanosheet", label: "2D Nanosheet", icon: "▰" },
                    { key: "cuboidal", label: "Nanocube", icon: "■" },
                    { key: "octahedral", label: "Octahedral", icon: "◆" },
                    { key: "hexagonal", label: "Hex Platelet", icon: "⬡" },
                    { key: "core_shell", label: "Core-Shell", icon: "◎" }
                  ].map((m) => {
                    const isSelected = synthMorphology === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSynthMorphology(m.key as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-[10px] tracking-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider 1: Crystallite Size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Atom className="w-3.5 h-3.5 text-cyan-400" />
                    {t("Target Crystallite Size", "Target Crystallite Size")}
                  </span>
                  <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {synthSize.toFixed(1)} nm
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="50.0"
                  step="0.5"
                  value={synthSize}
                  onChange={(e) => setSynthSize(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-900 rounded-lg h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>2.0 nm (Quantum Dot)</span>
                  <span>25.0 nm</span>
                  <span>50.0 nm (Bulk-like)</span>
                </div>
              </div>

              {/* Slider 2: Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    {t("Calcination / Autoclave Temp", "Calcination / Autoclave Temp")}
                  </span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {synthTemp} °C ({synthTemp + 273.15} K)
                  </span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="1200"
                  step="10"
                  value={synthTemp}
                  onChange={(e) => setSynthTemp(parseInt(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-900 rounded-lg h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>80°C (Solvothermal)</span>
                  <span>500°C (Oxides)</span>
                  <span>1200°C (Ceramics)</span>
                </div>
              </div>

              {/* Slider 3: Duration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-emerald-400" />
                    {t("Reaction Duration (Dwell Time)", "Reaction Duration (Dwell Time)")}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {synthTime.toFixed(1)} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="48.0"
                  step="0.5"
                  value={synthTime}
                  onChange={(e) => setSynthTime(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-900 rounded-lg h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>0.5 hr (Fast Microwave)</span>
                  <span>6.0 hrs</span>
                  <span>48.0 hrs (Ostwald Limit)</span>
                </div>
              </div>

              {/* Slider 4: pH */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-pink-400" />
                    {t("Precursor Solution pH", "Precursor Solution pH")}
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                      synthPH < 6
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        : synthPH > 8
                        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    pH {synthPH.toFixed(1)} ({synthPH < 6 ? "Acidic" : synthPH > 8 ? "Alkaline" : "Neutral"})
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="14.0"
                  step="0.1"
                  value={synthPH}
                  onChange={(e) => setSynthPH(parseFloat(e.target.value))}
                  className="w-full accent-pink-400 bg-slate-900 rounded-lg h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>pH 1.0 (Strong Acid)</span>
                  <span>pH 7.0</span>
                  <span>pH 14.0 (Strong Base)</span>
                </div>
              </div>

              {/* Atmosphere Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-indigo-400" />
                  {t("Furnace / Autoclave Atmosphere", "Furnace / Autoclave Atmosphere")}
                </label>
                <select
                  value={synthAtmosphere}
                  onChange={(e) => setSynthAtmosphere(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-indigo-500/40 outline-none"
                >
                  <option value="air">Air (Ambient Oxidizing)</option>
                  <option value="argon">Argon (Pure Inert Shielding, 99.999%)</option>
                  <option value="nitrogen">Nitrogen (Inert Purge)</option>
                  <option value="oxygen">Pure Oxygen (High-Pressure Oxidation)</option>
                  <option value="forming_gas">Forming Gas (5% H₂ / 95% N₂ Reducing)</option>
                  <option value="vacuum">High Vacuum (10⁻⁵ mbar)</option>
                </select>
              </div>
            </div>

            {/* Right Column: 3D Nanostructure Lattice Visualizer & Physics Metrics (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dynamic Animated SVG Nanostructure Visualizer */}
              <div className="bg-[#050A14]/90 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-lg relative overflow-hidden flex flex-col items-center justify-between min-h-[380px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06),transparent_70%)] pointer-events-none" />

                <div className="w-full flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Atom className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
                    {synthMorphology.toUpperCase()} CRYSTAL LATTICE
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    D = {synthSize.toFixed(1)} nm • T = {synthTemp}°C
                  </span>
                </div>

                {/* Animated Nanostructure Graphics */}
                <div className="relative w-64 h-64 flex items-center justify-center my-4">
                  {/* Spherical Quantum Dot */}
                  {synthMorphology === "spherical" && (
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <motion.div
                        className="absolute rounded-full border border-cyan-500/30"
                        style={{
                          width: `${Math.max(60, Math.min(220, synthSize * 4 + 40))}px`,
                          height: `${Math.max(60, Math.min(220, synthSize * 4 + 40))}px`
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)]" />
                      </motion.div>

                      <motion.div
                        className="rounded-full bg-gradient-to-br from-indigo-500/40 via-cyan-500/40 to-emerald-500/30 border-2 border-cyan-400/60 backdrop-blur-md relative flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.35)]"
                        style={{
                          width: `${Math.max(45, Math.min(180, synthSize * 3.4 + 30))}px`,
                          height: `${Math.max(45, Math.min(180, synthSize * 3.4 + 30))}px`
                        }}
                        animate={{ scale: [0.98, 1.02, 0.98] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="grid grid-cols-3 gap-2 p-2">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i % 2 === 0 ? "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-indigo-300"
                              } animate-pulse`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* 1D Nanowire / Nanorod */}
                  {synthMorphology === "nanowire" && (
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <motion.div
                        className="w-10 bg-gradient-to-b from-cyan-400 via-indigo-500 to-cyan-500 rounded-full border-2 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex flex-col items-center justify-between py-3 relative"
                        style={{
                          height: `${Math.max(90, Math.min(220, synthSize * 4.2 + 60))}px`
                        }}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-4 h-0.5 bg-white/60 rounded-full" />
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {/* 2D Nanosheet */}
                  {synthMorphology === "nanosheet" && (
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <motion.div
                        className="rounded-2xl bg-gradient-to-tr from-indigo-500/50 via-cyan-500/40 to-emerald-400/30 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.3)] relative flex items-center justify-center"
                        style={{
                          width: `${Math.max(80, Math.min(200, synthSize * 3.8 + 40))}px`,
                          height: `${Math.max(50, Math.min(140, synthSize * 2.5 + 30))}px`,
                          transform: "rotateX(55deg) rotateZ(-20deg)"
                        }}
                        animate={{ rotateZ: [-25, -15, -25] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="text-[10px] font-mono font-bold text-cyan-200 uppercase tracking-widest">
                          (001) BASAL PLANE
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Nanocube / Cuboidal */}
                  {synthMorphology === "cuboidal" && (
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <motion.div
                        className="rounded-xl bg-gradient-to-br from-cyan-600/40 via-indigo-600/30 to-slate-900/90 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] flex items-center justify-center relative backdrop-blur-md"
                        style={{
                          width: `${Math.max(60, Math.min(150, synthSize * 3.0 + 30))}px`,
                          height: `${Math.max(60, Math.min(150, synthSize * 3.0 + 30))}px`
                        }}
                        animate={{ rotate: [0, 4, -4, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="text-[9px] font-mono font-bold text-cyan-200 text-center">
                          {100} FACET
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Octahedral / Hexagonal / Core-Shell fallback */}
                  {(synthMorphology === "octahedral" ||
                    synthMorphology === "hexagonal" ||
                    synthMorphology === "core_shell") && (
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <motion.div
                        className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-indigo-500/40 via-cyan-400/30 to-fuchsia-500/30 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-center relative rotate-45"
                        animate={{ rotate: [45, 50, 40, 45] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-16 h-16 rounded-full bg-cyan-400/60 border border-white/80 animate-ping -rotate-45" />
                      </motion.div>
                    </div>
                  )}
                </div>

                <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Specific Surface (BET)</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">{physicsReadouts.ssa} m²/g</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Effective Bandgap</span>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {physicsReadouts.effectiveEg > 0 ? `${physicsReadouts.effectiveEg} eV` : "Metallic"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Lattice Microstrain</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">{physicsReadouts.strainPct} %</span>
                  </div>
                </div>
              </div>

              {/* Solvents & Capping Matrix Selector */}
              <div className="bg-[#050A14]/90 p-6 rounded-3xl border border-slate-800/80 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Beaker className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      {t("Solvent & Surfactant Capping Matrix", "Solvent & Surfactant Capping Matrix")}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Growth Directional Control</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Carrier Solvent
                    </label>
                    <select
                      value={selectedSolvent}
                      onChange={(e) => setSelectedSolvent(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-indigo-500/40 outline-none"
                    >
                      {SOLVENT_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (BP: {s.bp}°C, ε: {s.dielectric})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Capping Surfactant / Ligand
                    </label>
                    <select
                      value={selectedSurfactant}
                      onChange={(e) => setSelectedSurfactant(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-indigo-500/40 outline-none"
                    >
                      {SURFACTANT_OPTIONS.map((sur) => (
                        <option key={sur.id} value={sur.id}>
                          {sur.name} ({sur.charge})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: GEMINI AI SYNTHESIS FORMULATION */}
        {activeSubTab === "ai_route" && (
          <motion.div
            key="tab-ai-route"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Control Bar for AI Generation */}
            <div className="bg-[#050A14]/90 p-6 rounded-3xl border border-slate-800/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    {t("Gemini Deep Synthesis Formulation Engine", "Gemini Deep Synthesis Formulation Engine")}
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  {t(
                    "Generates an elite academic recipe combining thermodynamic phase boundaries, solvent selection, temperature ramps, and XRD verification.",
                    "Generates an elite academic recipe combining thermodynamic phase boundaries, solvent selection, temperature ramps, and XRD verification."
                  )}
                </p>
              </div>

              {/* Optimization Strategic Focus presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Focus:</span>
                {[
                  { id: "purity", label: "Phase Purity & Single Crystal" },
                  { id: "defects", label: "Defect & Vacancy Engineering" },
                  { id: "confinement", label: "Quantum Size Confinement" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSynthAiFocus(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      synthAiFocus === f.id
                        ? "bg-indigo-600/40 border border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <button
                  onClick={onRunSynthesisAI}
                  disabled={synthAiLoading}
                  className="ml-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {synthAiLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{synthAiLoading ? t("Formulating...", "Formulating...") : t("Formulate Recipe", "Formulate Recipe")}</span>
                </button>
              </div>
            </div>

            {/* AI Generation Loading State with timeline */}
            {synthAiLoading && (
              <div className="bg-[#050A14]/90 p-10 rounded-3xl border border-indigo-500/30 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-base font-bold text-white">
                    {synthAiStep || t("Analyzing Phase Boundaries with Gemini...", "Analyzing Phase Boundaries with Gemini...")}
                  </h5>
                  <p className="text-xs text-slate-400 font-mono">
                    Applying thermodynamic constraints for {selectedCandidate.formula} ({synthMorphology}, {synthTemp}°C, {synthAtmosphere})
                  </p>
                </div>
              </div>
            )}

            {/* AI Result Markdown Viewer */}
            {!synthAiLoading && synthAiResult && (
              <div className="bg-[#050A14]/90 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                      Synthesis Formulation Ready • Model: Gemini 2.5 / 3.1 Pro
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyRecipe}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedRecipe ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRecipe ? t("Copied!", "Copied!") : t("Copy Recipe", "Copy Recipe")}</span>
                    </button>

                    <button
                      onClick={handleDownloadRecipe}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Download Markdown"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("Export Markdown", "Export Markdown")}</span>
                    </button>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none prose-headings:text-indigo-200 prose-h2:text-lg prose-h2:font-black prose-h3:text-base prose-p:text-slate-300 prose-p:text-sm prose-li:text-slate-300 prose-li:text-sm prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                  <ReactMarkdown>{synthAiResult}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Empty state prompt */}
            {!synthAiLoading && !synthAiResult && (
              <div className="bg-[#050A14]/90 p-12 rounded-3xl border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-4">
                <FlaskConical className="w-12 h-12 text-indigo-400/40 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {t("No Synthesis Route Formulated Yet", "No Synthesis Route Formulated Yet")}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    {t(
                      "Click 'Formulate Recipe' above to have Gemini AI calculate exact chemical quantities, solvent recipes, and temperature schedules for your target phase.",
                      "Click 'Formulate Recipe' above to have Gemini AI calculate exact chemical quantities, solvent recipes, and temperature schedules for your target phase."
                    )}
                  </p>
                </div>
                <button
                  onClick={onRunSynthesisAI}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all"
                >
                  {t("Generate AI Synthesis Route", "Generate AI Synthesis Route")}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBTAB 3: STOICHIOMETRIC PRECURSOR BATCHER */}
        {activeSubTab === "stoichiometry" && (
          <motion.div
            key="tab-stoichiometry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Batch Scale & Dopant Controls Bar */}
            <div className="bg-[#050A14]/90 p-6 rounded-3xl border border-slate-800/80 shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target Batch Mass */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    {t("Target Product Batch Yield", "Target Product Batch Yield")}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {synthTargetMass.toFixed(2)} g
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.01"
                    max="500.0"
                    step="0.1"
                    value={synthTargetMass}
                    onChange={(e) => setSynthTargetMass(Math.max(0.01, parseFloat(e.target.value) || 0.1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                  <div className="flex gap-1">
                    {[0.5, 1.0, 5.0, 10.0].map((mass) => (
                      <button
                        key={mass}
                        onClick={() => setSynthTargetMass(mass)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border ${
                          synthTargetMass === mass
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {mass}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dopant Element & Concentration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {t("Lattice Dopant Substitution", "Lattice Dopant Substitution")}
                  </span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {synthDoping.toFixed(1)} mol%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Dopant (e.g. Fe, Mn, Co)"
                    value={dopantElement}
                    onChange={(e) => setDopantElement(e.target.value.trim())}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500/40 outline-none uppercase"
                  />
                  <input
                    type="range"
                    min="0.0"
                    max="20.0"
                    step="0.5"
                    value={synthDoping}
                    onChange={(e) => setSynthDoping(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 rounded-lg h-2 cursor-pointer self-center"
                  />
                </div>
              </div>

              {/* Substituted Cation Site */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-indigo-400" />
                  {t("Target Host Lattice Site", "Target Host Lattice Site")}
                </span>
                <select
                  value={dopedSubstitutedElement}
                  onChange={(e) => setDopedSubstitutedElement(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/40 outline-none"
                >
                  {Object.keys(parseChemicalFormula(selectedCandidate.formula))
                    .filter((el) => el !== "O" && el !== "H")
                    .map((el) => (
                      <option key={el} value={el}>
                        Substitute on {el} site
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Precursor Selection & Mass Calculation Table */}
            <div className="bg-[#050A14]/90 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {t("Precursor Formulation & Weighing Table", "Precursor Formulation & Weighing Table")}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Calculated for MW = {stoichCalculation.mwProduct.toFixed(2)} g/mol of {selectedCandidate.formula}
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  Total Precursors: {stoichCalculation.totalPrecursorMassGrams.toFixed(4)} g
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                      <th className="pb-3">Element / Cation</th>
                      <th className="pb-3">Stoich Ratio</th>
                      <th className="pb-3">Precursor Selection</th>
                      <th className="pb-3">Formula</th>
                      <th className="pb-3">MW (g/mol)</th>
                      <th className="pb-3 text-right">Required Mass (g)</th>
                      <th className="pb-3 text-right">Mass (mg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {stoichCalculation.precursors.map((prec, idx) => {
                      const dbList = PRECURSOR_DATABASE[prec.element] || [];
                      return (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                              {prec.element}
                            </span>
                            <span>{prec.element}</span>
                          </td>
                          <td className="py-3 text-slate-300">{prec.stoichCoeff.toFixed(4)}</td>
                          <td className="py-3">
                            <select
                              value={selectedPrecursors[prec.element] || prec.precursorName}
                              onChange={(e) =>
                                setSelectedPrecursors((prev) => ({
                                  ...prev,
                                  [prec.element]: e.target.value
                                }))
                              }
                              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none max-w-[200px]"
                            >
                              {dbList.map((item) => (
                                <option key={item.name} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                              <option value="Custom Precursor">Custom Precursor (Set MW)</option>
                            </select>
                          </td>
                          <td className="py-3 text-slate-400 text-[11px]">{prec.precursorFormula}</td>
                          <td className="py-3 text-slate-300">{prec.precursorMw.toFixed(2)}</td>
                          <td className="py-3 text-right font-bold text-emerald-400 text-sm">
                            {prec.massGrams.toFixed(4)} g
                          </td>
                          <td className="py-3 text-right font-bold text-cyan-300">
                            {prec.massMilligrams.toFixed(1)} mg
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mt-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-amber-300">
                    Laboratory Precision & Hygroscopic Salts Warning
                  </h6>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Hydrated nitrate and chloride salts (e.g. Co(NO₃)₂·6H₂O, Al(NO₃)₃·9H₂O) rapidly absorb atmospheric moisture. Always dry precursors in a vacuum desiccator before weighing or verify moisture content via thermogravimetric analysis (TGA).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: JMAK KINETICS & THERMODYNAMICS */}
        {activeSubTab === "kinetics" && (
          <motion.div
            key="tab-kinetics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Top row: Interactive JMAK Sigmoid Crystallization Curve (Recharts) */}
            <div className="bg-[#050A14]/90 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {t("Johnson-Mehl-Avrami-Kolmogorov (JMAK) Crystallization Kinetics", "Johnson-Mehl-Avrami-Kolmogorov (JMAK) Crystallization Kinetics")}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Model: X_C(t) = 1 - exp(-k · t^n) • Avrami n = {jmakKineticsData.n_exp.toFixed(2)} • Rate k = {jmakKineticsData.k_rate.toExponential(3)} s⁻¹
                  </p>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Yield at {synthTime}h: {jmakKineticsData.currentYield.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={jmakKineticsData.points} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="crystGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis
                      dataKey="time"
                      stroke="#64748B"
                      fontSize={10}
                      tickFormatter={(v) => `${v}h`}
                      label={{ value: "Reaction Duration (Hours)", position: "insideBottom", offset: -2, fill: "#64748B", fontSize: 10 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#64748B"
                      fontSize={10}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: "Crystallization Yield X_C", angle: -90, position: "insideLeft", offset: 15, fill: "#64748B", fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0B132B", borderColor: "#1E293B", borderRadius: "12px", fontSize: "11px" }}
                      formatter={(val: any, name: string) => [
                        name === "crystallinity" ? `${val}%` : `${val} %/h`,
                        name === "crystallinity" ? "Crystalline Fraction" : "Growth Velocity"
                      ]}
                      labelFormatter={(label) => `Reaction Time: ${label} hours`}
                    />
                    <ReferenceLine x={synthTime} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: `Dwell (${synthTime}h)`, fill: "#F59E0B", fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="crystallinity"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#crystGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom 3 Cards: Arrhenius, Ostwald Ripening & Thermodynamics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#050A14]/90 p-6 rounded-3xl border border-slate-800/80 shadow-lg space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  Arrhenius Activation Barrier
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-white">
                    {(jmakKineticsData.baseEa / 1000).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">kJ/mol</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Thermal energy barrier for homogeneous nucleation and atomic rearrangement in the {selectedCandidate.phase_name} lattice.
                </p>
              </div>

              <div className="bg-[#050A14]/90 p-6 rounded-3xl border border-slate-800/80 shadow-lg space-y-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                  Gibbs-Thomson Critical Radius
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-white">
                    {(synthSize * 0.35).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">nm (r*)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Critical nucleus radius above which nanocrystals grow spontaneously without Ostwald dissolution.
                </p>
              </div>

              <div className="bg-[#050A14]/90 p-6 rounded-3xl border border-slate-800/80 shadow-lg space-y-2">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                  Autoclave Saturated Vapor P_sat
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-white">
                    {physicsReadouts.estPressureBar}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">bar</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Estimated hydrothermal vessel pressure at {synthTemp}°C. Ensure Teflon liner is rated ≥ 200 bar.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 5: LABORATORY SOP & AUDIT PROTOCOL */}
        {activeSubTab === "sop_protocol" && (
          <motion.div
            key="tab-sop"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#050A14]/90 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-5 h-5 text-pink-400" />
                    {t("Standard Operating Procedure (SOP) Protocol", "Standard Operating Procedure (SOP) Protocol")}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Step-by-step verified laboratory workflow for {selectedCandidate.phase_name} ({selectedCandidate.formula})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("Print Protocol", "Print Protocol")}</span>
                  </button>

                  <button
                    onClick={handleDownloadAuditReport}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("Download Audit Report", "Download Audit Report")}</span>
                  </button>
                </div>
              </div>

              {/* SOP Step-by-step Interactive Checklist */}
              <div className="space-y-3">
                {[
                  {
                    id: "step_ppe",
                    step: "1. Safety & Chemical PPE Preparation",
                    desc: "Wear nitrile gloves, splash goggles, and lab coat. Perform organic solvent and acid handling inside a certified chemical fume hood."
                  },
                  {
                    id: "step_weighing",
                    step: "2. Analytical Balance Precursor Weighing",
                    desc: `Accurately weigh target precursors on a 4-decimal analytical balance: ${stoichCalculation.precursors
                      .map((p) => `${p.precursorName} = ${p.massGrams.toFixed(4)} g`)
                      .join("; ")}.`
                  },
                  {
                    id: "step_dissolution",
                    step: "3. Solvation & Magnetic Stirring",
                    desc: `Dissolve precursors in 50 mL of selected solvent (${selectedSolvent}). Adjust solution to pH ${synthPH.toFixed(
                      1
                    )} under continuous stirring at 500 RPM for 30 minutes.`
                  },
                  {
                    id: "step_autoclave",
                    step: "4. Hydrothermal Autoclave Sealing",
                    desc: `Transfer solution into a Teflon-lined stainless steel autoclave (fill fraction: 60-70%). Seal securely to withstand estimated pressure of ~${physicsReadouts.estPressureBar} bar.`
                  },
                  {
                    id: "step_calcination",
                    step: "5. Thermal Calcination Schedule",
                    desc: `Ramp temperature to ${synthTemp} °C (ramp rate: 5 °C/min). Hold at ${synthTemp} °C for ${synthTime.toFixed(
                      1
                    )} hours under ${synthAtmosphere.toUpperCase()} atmosphere. Allow furnace to cool naturally to room temperature.`
                  },
                  {
                    id: "step_washing",
                    step: "6. Centrifugation & Washing Cycles",
                    desc: "Wash precipitate 3 times with deionized water and twice with absolute ethanol via centrifugation at 8,000 RPM for 10 minutes to remove unreacted ions."
                  },
                  {
                    id: "step_xrd",
                    step: "7. Powder XRD Phase Confirmation",
                    desc: `Grind dried powder in an agate mortar. Scan on XRD diffractometer (2θ = 10° - 90°) to verify primary Bragg reflections of ${selectedCandidate.phase_name} and absence of secondary impurities.`
                  }
                ].map((item) => {
                  const isDone = !!sopChecked[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSopChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isDone
                          ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? "bg-emerald-500 border-emerald-400 text-black"
                            : "border-slate-700 bg-slate-800"
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <h5 className={`text-xs font-bold ${isDone ? "text-emerald-300 line-through" : "text-white"}`}>
                          {item.step}
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
