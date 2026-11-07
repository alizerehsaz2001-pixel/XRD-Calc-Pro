import React, { useState, useMemo } from "react";
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
  ReferenceLine
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
  RefreshCw,
  Zap,
  Layers,
  Thermometer,
  Timer,
  Droplets,
  Wind,
  Sliders,
  CheckCircle2,
  Atom,
  Calculator,
  TrendingUp,
  AlertTriangle,
  Beaker,
  Gauge,
  Compass,
  RotateCcw
} from "lucide-react";
import { DLPhaseCandidate } from "../types";
import { PRECURSOR_DATABASE, parseChemicalFormula } from "./DeepLearningModule";

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
  { id: "ctab", name: "CTAB (Cetyltrimethylammonium Bromide)", role: "Cationic Surfactant · {100}/{111} Selective Adsorption", charge: "+ (Cationic)" },
  { id: "pvp", name: "PVP (Polyvinylpyrrolidone, MW 40k)", role: "Steric Stabilizer · {100} Nanocube Facet Passivation", charge: "Neutral" },
  { id: "oleic_acid", name: "Oleic Acid (OA)", role: "Carboxylic Capping · Monodisperse Quantum Dot Passivation", charge: "Hydrophobic" },
  { id: "citric_acid", name: "Citric Acid Monohydrate", role: "Chelating Agent · Sol-Gel Pechini Polymeric Network", charge: "Anionic" },
  { id: "oleylamine", name: "Oleylamine (OLA)", role: "Reducing & Coordinating Ligand · Ultrathin Nanosheets", charge: "Amine" },
  { id: "peg_400", name: "PEG-400 (Polyethylene Glycol)", role: "Steric Dispersion & 1D Nanowire Template", charge: "Non-ionic" }
];

interface SynthesisMethodPreset {
  id: string;
  label: string;
  subtitle: string;
  temp: number;
  time: number;
  ph: number;
  size: number;
  morphology: SynthMorphologyType;
  atmosphere: SynthAtmosphereType;
  solvent: string;
  surfactant: string;
  rampRate: number;
}

const SYNTHESIS_METHOD_PRESETS: SynthesisMethodPreset[] = [
  {
    id: "hydrothermal",
    label: "Hydrothermal Autoclave",
    subtitle: "Subcritical aqueous nucleation",
    temp: 180,
    time: 12.0,
    ph: 9.5,
    size: 18.0,
    morphology: "octahedral",
    atmosphere: "air",
    solvent: "deionized_water",
    surfactant: "ctab",
    rampRate: 3.0
  },
  {
    id: "solvothermal_polyol",
    label: "Polyol Solvothermal",
    subtitle: "Reductive glycol growth",
    temp: 200,
    time: 8.0,
    ph: 7.2,
    size: 12.5,
    morphology: "cuboidal",
    atmosphere: "nitrogen",
    solvent: "ethylene_glycol",
    surfactant: "pvp",
    rampRate: 4.0
  },
  {
    id: "sol_gel_pechini",
    label: "Sol-Gel Pechini",
    subtitle: "Citrate-nitrate polymer calcination",
    temp: 650,
    time: 4.0,
    ph: 4.5,
    size: 28.0,
    morphology: "spherical",
    atmosphere: "oxygen",
    solvent: "deionized_water",
    surfactant: "citric_acid",
    rampRate: 5.0
  },
  {
    id: "solid_state",
    label: "Solid-State Ceramic",
    subtitle: "High-T interdiffusion sintering",
    temp: 950,
    time: 16.0,
    ph: 7.0,
    size: 45.0,
    morphology: "hexagonal",
    atmosphere: "air",
    solvent: "ethanol",
    surfactant: "peg_400",
    rampRate: 8.0
  },
  {
    id: "hot_injection",
    label: "Colloidal Hot-Injection",
    subtitle: "LaMer burst quantum dot synthesis",
    temp: 280,
    time: 1.5,
    ph: 7.0,
    size: 4.5,
    morphology: "spherical",
    atmosphere: "argon",
    solvent: "oleic_acid_octadecene",
    surfactant: "oleic_acid",
    rampRate: 15.0
  }
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
  const { t } = useTranslation();

  // Active studio view tab
  const [activeSubTab, setActiveSubTab] = useState<
    "autoclave" | "ai_route" | "stoichiometry" | "kinetics" | "sop_protocol"
  >("autoclave");

  // Selected solvent, surfactant, and method preset
  const [selectedSolvent, setSelectedSolvent] = useState<string>("deionized_water");
  const [selectedSurfactant, setSelectedSurfactant] = useState<string>("pvp");
  const [activePresetId, setActivePresetId] = useState<string>("hydrothermal");
  const [heatingRampRate, setHeatingRampRate] = useState<number>(5.0); // °C/min
  const [solutionVolumeMl, setSolutionVolumeMl] = useState<number>(50); // mL

  // Wulff 3D Polyhedron Interactive Rotation & Surface Energy Ratio
  const [wulffRotYaw, setWulffRotYaw] = useState<number>(28);
  const [wulffRotPitch, setWulffRotPitch] = useState<number>(22);
  const [gammaRatio111To100, setGammaRatio111To100] = useState<number>(1.15);

  // Local deterministic protocol fallback
  const [localBlueprintResult, setLocalBlueprintResult] = useState<string | null>(null);

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

  const applyMethodPreset = (preset: SynthesisMethodPreset) => {
    setActivePresetId(preset.id);
    setSynthTemp(preset.temp);
    setSynthTime(preset.time);
    setSynthPH(preset.ph);
    setSynthSize(preset.size);
    setSynthMorphology(preset.morphology);
    setSynthAtmosphere(preset.atmosphere);
    setSelectedSolvent(preset.solvent);
    setSelectedSurfactant(preset.surfactant);
    setHeatingRampRate(preset.rampRate);
    if (preset.morphology === "cuboidal") setGammaRatio111To100(1.52);
    else if (preset.morphology === "octahedral") setGammaRatio111To100(0.68);
    else setGammaRatio111To100(1.12);
  };

  // Calculate stoichiometry derived values
  const stoichCalculation = useMemo(() => {
    if (!selectedCandidate) {
      return {
        success: false,
        mwProduct: 100,
        molesProduct: 0,
        precursors: [],
        totalPrecursorMassGrams: 0,
        atomEconomyPct: 100,
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
    const volLiters = Math.max(0.005, solutionVolumeMl / 1000);

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
          precursorFormula = "Custom Salt";
          precursorMw = customPrecursorMws[el] || ATOMIC_WEIGHTS[el] || 100.0;
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
        const molarityMolL = molesPrecursor / volLiters;
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
          massMilligrams,
          molarityMolL
        };
      });

    const atomEconomyPct =
      totalPrecursorMassGrams > 0
        ? Math.min(100, (synthTargetMass / totalPrecursorMassGrams) * 100)
        : 100;

    return {
      success: true,
      errors: [],
      mwProduct,
      molesProduct,
      stoichCoeffs,
      precursors: precursorsList,
      totalPrecursorMassGrams,
      atomEconomyPct,
      actualSubstitutedSite
    };
  }, [
    selectedCandidate,
    synthTargetMass,
    synthDoping,
    dopantElement,
    dopedSubstitutedElement,
    selectedPrecursors,
    customPrecursorMws,
    solutionVolumeMl
  ]);

  // JMAK Kinetics & Furnace Thermal Schedule dataset generator
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
      const t_scaled = t_hr * 10;
      const term = -k_rate * Math.pow(t_scaled, n_exp);
      const X_frac = Math.max(0, Math.min(1.0, 1.0 - Math.exp(term)));
      const X_pct = X_frac * 100;
      const rate_dxdt =
        n_exp * k_rate * Math.pow(Math.max(0.1, t_scaled), n_exp - 1) * Math.exp(term) * 100;

      // LaMer Supersaturation Curve S(t)
      const burstPeakTime = 1.5;
      const lamerSupersat =
        t_hr <= burstPeakTime
          ? 1.0 + 2.8 * (t_hr / burstPeakTime)
          : 1.35 + 2.45 * Math.exp(-(t_hr - burstPeakTime) / Math.max(1.2, synthTime * 0.35));

      points.push({
        time: t_hr,
        crystallinity: parseFloat(X_pct.toFixed(2)),
        growthRate: parseFloat(rate_dxdt.toFixed(3)),
        supersaturation: parseFloat(lamerSupersat.toFixed(2)),
        currentDwell: Math.abs(t_hr - synthTime) < 0.26
      });
    }

    // Furnace Temperature Ramp Profile (Time in hours vs Temperature in °C)
    const rampUpHrs = Math.max(0.25, (synthTemp - 25) / (heatingRampRate * 60));
    const coolDownHrs = Math.max(0.5, (synthTemp - 25) / (3.5 * 60));
    const furnaceSchedule = [
      { stage: "Ambient Start", timeHr: 0, tempC: 25 },
      { stage: "Nucleation Soak", timeHr: Number((rampUpHrs * 0.6).toFixed(2)), tempC: Math.round(25 + (synthTemp - 25) * 0.65) },
      { stage: "Dwell Start", timeHr: Number(rampUpHrs.toFixed(2)), tempC: synthTemp },
      { stage: "Dwell End", timeHr: Number((rampUpHrs + synthTime).toFixed(2)), tempC: synthTemp },
      { stage: "Anneal Cool", timeHr: Number((rampUpHrs + synthTime + coolDownHrs).toFixed(2)), tempC: 25 }
    ];

    const currentYield = Math.min(
      99.9,
      Math.max(0.1, (1.0 - Math.exp(-k_rate * Math.pow(synthTime * 10, n_exp))) * 100)
    );

    return {
      points,
      furnaceSchedule,
      rampUpHrs,
      coolDownHrs,
      k_rate,
      n_exp,
      baseEa,
      currentYield
    };
  }, [synthTemp, synthAtmosphere, synthPH, synthSize, synthMorphology, synthTime, heatingRampRate]);

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
        estPressureBar: 1.0,
        scherrerFwhmDeg: 0.25
      };
    }

    const density = selectedCandidate.density || 4.5;
    const bulkEg = selectedCandidate.bandGap || 0;
    const size = Math.max(2.0, synthSize);

    // Brus Equation Quantum Confinement Shift (~ h^2 / 8m*R^2)
    const confinementShift = bulkEg > 0 ? parseFloat((15.55 / Math.pow(size, 2)).toFixed(3)) : 0;
    const effectiveEg = parseFloat((bulkEg + confinementShift).toFixed(3));

    // Specific Surface Area (BET) = 6000 / (density * diameter_nm) m^2/g
    const morphFactor =
      synthMorphology === "nanosheet"
        ? 1.65
        : synthMorphology === "nanowire"
        ? 1.3
        : synthMorphology === "octahedral"
        ? 1.15
        : 1.0;
    const ssa = parseFloat(((6000.0 * morphFactor) / (density * size)).toFixed(1));

    // Microstrain (lattice mismatch and surface tension ~ 1 / D + Vegard dopant shift)
    const strainPct = parseFloat(
      ((0.12 + (14.0 / size) * 0.08) * (1.0 + synthDoping * 0.14)).toFixed(3)
    );

    // Dislocation density delta = 1 / D^2 (lines / m^2)
    const dislocationDensity = parseFloat(
      ((1.0 / Math.pow(size * 1e-9, 2)) * 1e-14).toFixed(2)
    );

    // Scherrer FWHM at 2theta = 30 deg (Cu Ka = 0.15406 nm)
    const thetaRad = (15.0 * Math.PI) / 180;
    const betaRad = (0.9 * 0.15406) / (size * Math.cos(thetaRad));
    const scherrerFwhmDeg = parseFloat(((betaRad * 180) / Math.PI).toFixed(3));

    // Saturated vapor pressure estimate for selected solvent
    const solventObj = SOLVENT_OPTIONS.find((s) => s.id === selectedSolvent) || SOLVENT_OPTIONS[0];
    const T_C = synthTemp;
    let estPressureBar = 1.0;
    if (T_C > solventObj.bp) {
      estPressureBar = Math.min(
        250.0,
        1.0 + Math.pow((T_C - solventObj.bp) / 28.0, 2.15)
      );
    }

    return {
      bulkEg,
      confinementShift,
      effectiveEg,
      ssa,
      dislocationDensity,
      strainPct,
      estPressureBar: parseFloat(estPressureBar.toFixed(1)),
      scherrerFwhmDeg
    };
  }, [selectedCandidate, synthSize, synthDoping, synthTemp, synthMorphology, selectedSolvent]);

  // 3D Wulff Polyhedron SVG Projection Geometry
  const wulffProjection = useMemo(() => {
    const yaw = (wulffRotYaw * Math.PI) / 180;
    const pitch = (wulffRotPitch * Math.PI) / 180;

    const project3D = (x: number, y: number, z: number, scale: number = 68) => {
      // Rotate Y (yaw)
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
      // Rotate X (pitch)
      const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
      const perspective = 260 / (260 - z2 * 35);
      return {
        x: 130 + x1 * scale * perspective,
        y: 120 - y2 * scale * perspective,
        z: z2
      };
    };

    const sizeScale = Math.max(0.65, Math.min(1.22, 0.72 + synthSize / 95));
    const faces: { points: string; fill: string; stroke: string; label?: string; zAvg: number; cx: number; cy: number }[] = [];

    const addFace = (verts: [number, number, number][], fill: string, stroke: string, label?: string) => {
      const proj = verts.map(([vx, vy, vz]) => project3D(vx, vy, vz, 68 * sizeScale));
      const zAvg = proj.reduce((s, p) => s + p.z, 0) / proj.length;
      const cx = proj.reduce((s, p) => s + p.x, 0) / proj.length;
      const cy = proj.reduce((s, p) => s + p.y, 0) / proj.length;
      faces.push({
        points: proj.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
        fill,
        stroke,
        label,
        zAvg,
        cx,
        cy
      });
    };

    if (synthMorphology === "octahedral") {
      const top: [number, number, number] = [0, 1.25, 0];
      const bot: [number, number, number] = [0, -1.25, 0];
      const v1: [number, number, number] = [1.15, 0, 0];
      const v2: [number, number, number] = [0, 0, 1.15];
      const v3: [number, number, number] = [-1.15, 0, 0];
      const v4: [number, number, number] = [0, 0, -1.15];
      addFace([top, v1, v2], "rgba(6,182,212,0.28)", "#22d3ee", "{111}");
      addFace([top, v2, v3], "rgba(99,102,241,0.26)", "#818cf8", "{111}");
      addFace([top, v3, v4], "rgba(6,182,212,0.18)", "#38bdf8");
      addFace([top, v4, v1], "rgba(99,102,241,0.18)", "#6366f1");
      addFace([bot, v2, v1], "rgba(16,185,129,0.24)", "#34d399", "{111}");
      addFace([bot, v3, v2], "rgba(6,182,212,0.22)", "#22d3ee");
      addFace([bot, v4, v3], "rgba(15,23,42,0.45)", "#475569");
      addFace([bot, v1, v4], "rgba(15,23,42,0.45)", "#475569");
    } else if (synthMorphology === "hexagonal" || synthMorphology === "nanosheet") {
      const h = synthMorphology === "nanosheet" ? 0.22 : 0.65;
      const r = synthMorphology === "nanosheet" ? 1.25 : 1.05;
      const topRing: [number, number, number][] = [];
      const botRing: [number, number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        topRing.push([r * Math.cos(ang), h, r * Math.sin(ang)]);
        botRing.push([r * Math.cos(ang), -h, r * Math.sin(ang)]);
      }
      addFace(topRing, "rgba(6,182,212,0.30)", "#22d3ee", "{0001}");
      addFace([...botRing].reverse(), "rgba(15,23,42,0.5)", "#38bdf8");
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        addFace(
          [topRing[i], topRing[next], botRing[next], botRing[i]],
          i % 2 === 0 ? "rgba(99,102,241,0.25)" : "rgba(16,185,129,0.22)",
          "#818cf8",
          i === 0 ? "{10-10}" : undefined
        );
      }
    } else if (synthMorphology === "nanowire") {
      const h = 1.38;
      const r = 0.42;
      const topRing: [number, number, number][] = [];
      const botRing: [number, number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        topRing.push([r * Math.cos(ang), h, r * Math.sin(ang)]);
        botRing.push([r * Math.cos(ang), -h, r * Math.sin(ang)]);
      }
      addFace(topRing, "rgba(16,185,129,0.35)", "#34d399", "[001] Tip");
      addFace([...botRing].reverse(), "rgba(15,23,42,0.5)", "#34d399");
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        addFace(
          [topRing[i], topRing[next], botRing[next], botRing[i]],
          "rgba(6,182,212,0.24)",
          "#22d3ee",
          i === 1 ? "{110}" : undefined
        );
      }
    } else {
      // Cuboidal / Spherical / Core-Shell (Truncated Cube controlled by gammaRatio111To100)
      const s = 0.88;
      const c: [number, number, number][] = [
        [-s, -s, s],
        [s, -s, s],
        [s, s, s],
        [-s, s, s],
        [-s, -s, -s],
        [s, -s, -s],
        [s, s, -s],
        [-s, s, -s]
      ];
      addFace([c[0], c[1], c[2], c[3]], "rgba(6,182,212,0.26)", "#22d3ee", "{100}");
      addFace([c[1], c[5], c[6], c[2]], "rgba(99,102,241,0.26)", "#818cf8", "{010}");
      addFace([c[3], c[2], c[6], c[7]], "rgba(16,185,129,0.26)", "#34d399", "{001}");
      addFace([c[4], c[0], c[3], c[7]], "rgba(15,23,42,0.45)", "#475569");
      addFace([c[5], c[4], c[7], c[6]], "rgba(15,23,42,0.45)", "#475569");
      addFace([c[4], c[5], c[1], c[0]], "rgba(15,23,42,0.45)", "#475569");
    }

    faces.sort((a, b) => a.zAvg - b.zAvg);
    return faces;
  }, [synthMorphology, synthSize, wulffRotYaw, wulffRotPitch]);

  // Generate Instant Deterministic Synthesis Blueprint
  const generateDeterministicBlueprint = () => {
    if (!selectedCandidate) return;
    const solventObj = SOLVENT_OPTIONS.find((s) => s.id === selectedSolvent) || SOLVENT_OPTIONS[0];
    const surfObj = SURFACTANT_OPTIONS.find((s) => s.id === selectedSurfactant) || SURFACTANT_OPTIONS[0];
    const precursorLines = stoichCalculation.precursors
      .map(
        (p, idx) =>
          `${idx + 1}. **${p.precursorName}** (\`${p.precursorFormula}\`, MW = ${p.precursorMw.toFixed(2)} g/mol): Weigh **${p.massGrams.toFixed(4)} g** (${p.massMilligrams.toFixed(1)} mg) for ${p.molarityMolL.toFixed(3)} M in ${solutionVolumeMl} mL.`
      )
      .join("\n");

    const md = `## Quantitative Synthesis Protocol: ${selectedCandidate.phase_name} (${selectedCandidate.formula})

### 1. Crystallographic Target & Phase Stability
- **Target Phase**: ${selectedCandidate.phase_name} (\`${selectedCandidate.formula}\`) · Crystal System: **${selectedCandidate.crystalSystem || "Crystalline"}** · Space Group: \`${selectedCandidate.spaceGroup || "P1"}\`
- **Target Morphology**: **${synthMorphology.toUpperCase()}** · Mean Domain Size $D = ${synthSize.toFixed(1)}\\text{ nm}$ · Expected Scherrer $\\text{FWHM} \\approx ${physicsReadouts.scherrerFwhmDeg}^{\\circ}\\ 2\\theta$
- **Optimization Focus**: ${synthAiFocus === "purity" ? "Single-Phase Crystallographic Purity" : synthAiFocus === "defects" ? "Oxygen Vacancy & Dopant Defect Engineering" : "Brus Quantum Size Confinement ($\\Delta E_g = +" + physicsReadouts.confinementShift + "\\text{ eV}$)"}

### 2. Stoichiometric Precursor Formulation (Batch Yield: ${synthTargetMass.toFixed(2)} g)
${precursorLines}
- **Carrier Solvent**: ${solventObj.name} (${solutionVolumeMl} mL, BP = ${solventObj.bp} °C, $\\varepsilon_r = ${solventObj.dielectric}$)
- **Capping Agent / Structure Director**: ${surfObj.name} (${surfObj.role})

### 3. Reaction & Thermal Ramp Schedule
1. **Solvation & Complexation**: Dissolve weighed precursors in ${solutionVolumeMl} mL of ${solventObj.name} under vigorous magnetic stirring (600 RPM). Adjust solution to **pH ${synthPH.toFixed(1)}** dropwise.
2. **Thermal Ramp**: Heat at **${heatingRampRate.toFixed(1)} °C/min** (${jmakKineticsData.rampUpHrs.toFixed(2)} hrs ramp) to target reaction temperature of **${synthTemp} °C** (${synthTemp + 273.15} K) under **${synthAtmosphere.toUpperCase()}** atmosphere (Est. $P_{\\text{sat}} = ${physicsReadouts.estPressureBar}\\text{ bar}$).
3. **Isothermal Crystallization Dwell**: Hold at **${synthTemp} °C** for **${synthTime.toFixed(1)} hours** (Predicted JMAK Crystalline Yield: **${jmakKineticsData.currentYield.toFixed(1)}%**, Avrami exponent $n = ${jmakKineticsData.n_exp.toFixed(2)}$).

### 4. Powder XRD Verification Checkpoints
- Confirm primary diagnostic Bragg reflections for **${selectedCandidate.phase_name}** with zero secondary oxide/hydroxide impurity peaks.
- Verify grain size via Scherrer/Williamson-Hall broadening ($\\beta_{hkl} \\approx ${physicsReadouts.scherrerFwhmDeg}^{\\circ}$, microstrain $\\varepsilon \\approx ${physicsReadouts.strainPct}\\%$).`;

    setLocalBlueprintResult(md);
  };

  // Copy synthesis AI recipe to clipboard
  const handleCopyRecipe = () => {
    const activeText = synthAiResult || localBlueprintResult;
    if (!activeText) return;
    navigator.clipboard.writeText(activeText);
    setCopiedRecipe(true);
    setTimeout(() => setCopiedRecipe(false), 2000);
  };

  // Copy stoichiometric table to clipboard
  const handleCopyStoichTable = () => {
    const header = `Element\tPrecursor\tFormula\tMW (g/mol)\tMolar Ratio\tMass (g)\tMass (mg)\tMolarity (M in ${solutionVolumeMl}mL)`;
    const rows = stoichCalculation.precursors.map(
      (p) =>
        `${p.element}\t${p.precursorName}\t${p.precursorFormula}\t${p.precursorMw.toFixed(2)}\t${p.stoichCoeff.toFixed(4)}\t${p.massGrams.toFixed(4)}\t${p.massMilligrams.toFixed(1)}\t${p.molarityMolL.toFixed(4)}`
    );
    navigator.clipboard.writeText([header, ...rows].join("\n"));
    setCopiedStoich(true);
    setTimeout(() => setCopiedStoich(false), 2000);
  };

  // Download recipe as markdown
  const handleDownloadRecipe = () => {
    const activeText = synthAiResult || localBlueprintResult;
    if (!activeText) return;
    const header = `# XRD-Calc Pro - Synthesis Formulation Route\nTarget Phase: ${selectedCandidate?.phase_name} (${selectedCandidate?.formula})\nDate: ${new Date().toISOString()}\n\n`;
    const blob = new Blob([header + activeText], { type: "text/markdown;charset=utf-8" });
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
    const activeText = synthAiResult || localBlueprintResult;

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
Heating Ramp Rate       : ${heatingRampRate.toFixed(1)} °C/min
Autoclave Duration      : ${synthTime.toFixed(1)} hours
Solution pH Level       : ${synthPH.toFixed(1)}
Reaction Atmosphere     : ${synthAtmosphere.toUpperCase()}
Target Batch Mass       : ${synthTargetMass.toFixed(2)} g
Solution Volume         : ${solutionVolumeMl} mL
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
      `${i + 1}. [${p.element}] ${p.precursorName} (${p.precursorFormula}) | MW: ${p.precursorMw.toFixed(2)} g/mol | Req Mass: ${p.massGrams.toFixed(4)} g (${p.massMilligrams.toFixed(1)} mg) | Molarity: ${p.molarityMolL.toFixed(4)} M`
  )
  .join("\n")}
Total Precursor Mass Sum: ${stoichCalculation.totalPrecursorMassGrams.toFixed(4)} g

--- JMAK CRYSTALLIZATION KINETICS ---
Kinetic Rate Constant k : ${jmakKineticsData.k_rate.toExponential(3)} s⁻¹
Avrami Exponent (n)     : ${jmakKineticsData.n_exp.toFixed(2)}
Activation Energy (Ea)  : ${(jmakKineticsData.baseEa / 1000).toFixed(1)} kJ/mol
Simulated Yield at ${synthTime}h: ${jmakKineticsData.currentYield.toFixed(2)} %

${activeText ? `\n--- SYNTHESIS FORMULATION ROUTE ---\n${activeText}\n` : ""}
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
      <div className="p-12 text-center bg-[#070B14] rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
        <Atom className="w-12 h-12 text-indigo-400/50 mb-3" />
        <h4 className="text-lg font-bold text-white mb-1.5">
          {t("No Predicted Phase Selected", "No Predicted Phase Selected")}
        </h4>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          {t(
            "Execute the Convolutional Phase Identification Neural Net or select a candidate phase from the identification board to activate Synthesis Intelligence.",
            "Execute the Convolutional Phase Identification Neural Net or select a candidate phase from the identification board to activate Synthesis Intelligence."
          )}
        </p>
      </div>
    );
  }

  const completedSopCount = Object.values(sopChecked).filter(Boolean).length;
  const totalSopCount = Object.keys(sopChecked).length;
  const activeMarkdownRecipe = synthAiResult || localBlueprintResult;

  return (
    <div className="w-full space-y-5">
      {/* 1. Executive Telemetry Header & Candidate Switcher */}
      <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
        {/* Candidate Switcher Strip */}
        {candidates.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-thin">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Target Phase:
            </span>
            {candidates.map((c, idx) => {
              const isSelected = c.phase_name === selectedCandidate.phase_name;
              return (
                <button
                  key={`${c.phase_name}-${idx}`}
                  type="button"
                  onClick={() => onSelectCandidate && onSelectCandidate(c)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <span>{c.phase_name}</span>
                  <span className="font-mono tabular-nums text-[11px] opacity-85">
                    {c.confidence_score.toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Header Identity & Executive Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-cyan-400">
              <FlaskConical className="w-7 h-7" />
            </div>

            <div>
              {/* Clean unboxed metadata line with typographic separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-400 mb-1">
                <span className="text-emerald-400 font-semibold">● Synthesis Ready</span>
                <span aria-hidden="true">·</span>
                <span>C-Score {selectedCandidate.confidence_score.toFixed(1)}%</span>
                {selectedCandidate.crystalSystem && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">{selectedCandidate.crystalSystem}</span>
                  </>
                )}
                {selectedCandidate.spaceGroup && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-300">SG {selectedCandidate.spaceGroup}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300">MW {stoichCalculation.mwProduct.toFixed(2)} g/mol</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-baseline gap-2.5">
                <span>{selectedCandidate.phase_name}</span>
                <span className="text-indigo-400 font-mono text-base sm:text-lg font-semibold">
                  {selectedCandidate.formula}
                </span>
              </h2>

              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {selectedCandidate.description ||
                  "Thermodynamic synthesis reactor, Wulff crystal habit simulator, and stoichiometric precursor formulation console."}
              </p>
            </div>
          </div>

          {/* Primary Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                generateDeterministicBlueprint();
                setActiveSubTab("ai_route");
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Instant Protocol Blueprint</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab("ai_route");
                onRunSynthesisAI();
              }}
              disabled={synthAiLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {synthAiLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              )}
              <span>
                {synthAiLoading
                  ? t("Formulating AI Recipe...", "Formulating AI Recipe...")
                  : t("Generate AI Synthesis Route", "Generate AI Synthesis Route")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAuditReport}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Download Full Synthesis Protocol & SOP"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("Export Audit Report", "Export Audit Report")}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Synthesis Method Preset Strip */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Synthesis Route Presets:
            </span>
            {SYNTHESIS_METHOD_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyMethodPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                  title={preset.subtitle}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-400 flex items-center gap-2">
            <span>T = <strong className="text-amber-400">{synthTemp} °C</strong></span>
            <span>·</span>
            <span>P_sat = <strong className="text-cyan-400">{physicsReadouts.estPressureBar} bar</strong></span>
            <span>·</span>
            <span>Yield = <strong className="text-emerald-400">{jmakKineticsData.currentYield.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* 2. Studio Sub-Navigation Tabs */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            {
              id: "autoclave",
              label: t("1. Reactor & 3D Wulff Habit", "1. Reactor & 3D Wulff Habit"),
              icon: FlaskConical,
              color: "text-cyan-400",
              meta: `${synthSize.toFixed(0)} nm`
            },
            {
              id: "stoichiometry",
              label: t("2. Stoichiometric Batcher", "2. Stoichiometric Batcher"),
              icon: Scale,
              color: "text-emerald-400",
              meta: `${synthTargetMass.toFixed(1)} g`
            },
            {
              id: "kinetics",
              label: t("3. JMAK Kinetics & Ramp", "3. JMAK Kinetics & Ramp"),
              icon: TrendingUp,
              color: "text-amber-400",
              meta: `${jmakKineticsData.currentYield.toFixed(0)}%`
            },
            {
              id: "ai_route",
              label: t("4. Protocol & AI Formulation", "4. Protocol & AI Formulation"),
              icon: Sparkles,
              color: "text-indigo-400",
              meta: activeMarkdownRecipe ? "Ready" : undefined
            },
            {
              id: "sop_protocol",
              label: t("5. Lab SOP Checklist", "5. Lab SOP Checklist"),
              icon: FileText,
              color: "text-pink-400",
              meta: `${completedSopCount}/${totalSopCount}`
            }
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
                {tab.meta && (
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    ({tab.meta})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Tab Content Router */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: AUTOCLAVE REACTOR & 3D WULFF HABIT */}
        {activeSubTab === "autoclave" && (
          <motion.div
            key="tab-autoclave"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
          >
            {/* Left Column: Reaction Parameters & Autoclave Controls (5 cols) */}
            <div className="lg:col-span-5 bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {t("Autoclave & Reaction Boundaries", "Autoclave & Reaction Boundaries")}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {t("Thermodynamic & chemical potential parameters", "Thermodynamic & chemical potential parameters")}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono tabular-nums text-cyan-400 font-semibold">
                    P_sat = {physicsReadouts.estPressureBar} bar
                  </span>
                </div>

                {/* Morphology Selector Grid */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    {t("Target Crystal Habit & Nanostructure", "Target Crystal Habit & Nanostructure")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "spherical", label: "Quantum Dot", facet: "Isotropic" },
                      { key: "cuboidal", label: "Nanocube", facet: "{100}" },
                      { key: "octahedral", label: "Octahedral", facet: "{111}" },
                      { key: "hexagonal", label: "Hex Prism", facet: "{0001}" },
                      { key: "nanosheet", label: "2D Nanosheet", facet: "(001)" },
                      { key: "nanowire", label: "1D Nanowire", facet: "[001]" },
                      { key: "core_shell", label: "Core-Shell", facet: "Hetero" }
                    ].map((m) => {
                      const isSelected = synthMorphology === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSynthMorphology(m.key as any)}
                          className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-cyan-500/15 border-cyan-500 text-white"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">{m.label}</div>
                          <div className="text-[10px] font-mono text-cyan-400/90 mt-0.5">{m.facet}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider 1: Crystallite Size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Atom className="w-3.5 h-3.5 text-cyan-400" />
                      {t("Target Crystallite Domain Size (D)", "Target Crystallite Domain Size (D)")}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-cyan-400">
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
                    className="w-full accent-cyan-400 bg-slate-900 rounded-lg h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>2.0 nm (Quantum Dot)</span>
                    <span>FWHM ≈ {physicsReadouts.scherrerFwhmDeg}°</span>
                    <span>50.0 nm (Bulk)</span>
                  </div>
                </div>

                {/* Slider 2: Temperature */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      {t("Reaction / Calcination Temperature", "Reaction / Calcination Temperature")}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-amber-400">
                      {synthTemp} °C ({(synthTemp + 273.15).toFixed(0)} K)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="1200"
                    step="10"
                    value={synthTemp}
                    onChange={(e) => setSynthTemp(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 bg-slate-900 rounded-lg h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>80 °C (Solvothermal)</span>
                    <span>550 °C (Oxide Calcination)</span>
                    <span>1200 °C (Solid-State)</span>
                  </div>
                </div>

                {/* Slider 3: Duration */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-400" />
                      {t("Isothermal Dwell Time", "Isothermal Dwell Time")}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-emerald-400">
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
                    className="w-full accent-emerald-400 bg-slate-900 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                {/* Slider 4: pH */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-pink-400" />
                      {t("Precursor Solution pH", "Precursor Solution pH")}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-200">
                      pH {synthPH.toFixed(1)} · {synthPH < 6 ? "Acidic" : synthPH > 8 ? "Alkaline" : "Neutral"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="14.0"
                    step="0.1"
                    value={synthPH}
                    onChange={(e) => setSynthPH(parseFloat(e.target.value))}
                    className="w-full accent-pink-400 bg-slate-900 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                {/* Atmosphere Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" />
                    {t("Furnace / Autoclave Atmosphere", "Furnace / Autoclave Atmosphere")}
                  </label>
                  <select
                    value={synthAtmosphere}
                    onChange={(e) => setSynthAtmosphere(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 outline-none"
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
            </div>

            {/* Right Column: Interactive 3D Wulff Crystal Habit Canvas & Metrology Readouts (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              {/* Interactive 3D Wulff Polyhedron & Surface Energy Studio */}
              <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span>3D Wulff Construction & Crystallographic Facet Habit</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Gibbs-Wulff theorem: d_hkl ∝ γ_hkl · Surface energy ratio γ_{"{111}"} / γ_{"{100}"} = {gammaRatio111To100.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWulffRotYaw(28);
                        setWulffRotPitch(22);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset View</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* 3D SVG Polyhedron Canvas */}
                  <div className="md:col-span-7 bg-slate-950 rounded-xl border border-slate-800/90 p-3 flex flex-col items-center justify-center relative">
                    <svg viewBox="0 0 260 240" className="w-full h-56 overflow-visible">
                      <defs>
                        <radialGradient id="wulffGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <circle cx="130" cy="120" r="95" fill="url(#wulffGlow)" />

                      {/* Crystallographic Reference Axes */}
                      <line x1="25" y1="215" x2="65" y2="215" stroke="#38bdf8" strokeWidth="1.5" />
                      <text x="70" y="218" fill="#38bdf8" fontSize="9" fontFamily="monospace">[100]</text>
                      <line x1="25" y1="215" x2="25" y2="175" stroke="#34d399" strokeWidth="1.5" />
                      <text x="16" y="170" fill="#34d399" fontSize="9" fontFamily="monospace">[001]</text>

                      {wulffProjection.map((face, idx) => (
                        <g key={idx}>
                          <polygon
                            points={face.points}
                            fill={face.fill}
                            stroke={face.stroke}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                          {face.label && face.zAvg > -0.1 && (
                            <text
                              x={face.cx}
                              y={face.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#e2e8f0"
                              fontSize="9.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {face.label}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>

                    {/* Yaw / Pitch Scrubbers */}
                    <div className="w-full grid grid-cols-2 gap-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>Yaw:</span>
                        <input
                          type="range"
                          min="-90"
                          max="90"
                          value={wulffRotYaw}
                          onChange={(e) => setWulffRotYaw(parseInt(e.target.value, 10))}
                          className="w-full accent-cyan-400 h-1 cursor-pointer"
                        />
                        <span className="tabular-nums w-8 text-right">{wulffRotYaw}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Pitch:</span>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={wulffRotPitch}
                          onChange={(e) => setWulffRotPitch(parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-400 h-1 cursor-pointer"
                        />
                        <span className="tabular-nums w-8 text-right">{wulffRotPitch}°</span>
                      </div>
                    </div>
                  </div>

                  {/* Right 5 cols inside Wulff Card: Physical Metrology Readouts */}
                  <div className="md:col-span-5 space-y-2.5">
                    {[
                      {
                        label: "Specific Surface Area (BET)",
                        val: `${physicsReadouts.ssa}`,
                        unit: "m²/g",
                        sub: `Morphology factor applied`,
                        tone: "text-cyan-400"
                      },
                      {
                        label: "Effective Band Gap (Brus)",
                        val: physicsReadouts.effectiveEg > 0 ? `${physicsReadouts.effectiveEg}` : "Metallic",
                        unit: physicsReadouts.effectiveEg > 0 ? "eV" : "",
                        sub: `ΔE_g = +${physicsReadouts.confinementShift} eV shift`,
                        tone: "text-indigo-400"
                      },
                      {
                        label: "Scherrer Peak Broadening",
                        val: `${physicsReadouts.scherrerFwhmDeg}`,
                        unit: "° 2θ",
                        sub: `Lattice strain ε = ${physicsReadouts.strainPct}%`,
                        tone: "text-emerald-400"
                      },
                      {
                        label: "Dislocation Density (δ)",
                        val: `${physicsReadouts.dislocationDensity}`,
                        unit: "×10¹⁴ m⁻²",
                        sub: `δ = 1 / D² estimate`,
                        tone: "text-amber-400"
                      }
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          {m.label}
                        </span>
                        <div className="flex items-baseline justify-between mt-1">
                          <div>
                            <span className={`text-lg font-mono tabular-nums font-bold ${m.tone}`}>
                              {m.val}
                            </span>
                            {m.unit && (
                              <span className="text-[11px] font-mono text-slate-400 ml-1">
                                {m.unit}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{m.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Solvents & Capping Matrix Selector */}
              <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white">
                      {t("Solvent & Surfactant Capping Matrix", "Solvent & Surfactant Capping Matrix")}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Facet-Selective Passivation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Carrier Solvent
                    </label>
                    <select
                      value={selectedSolvent}
                      onChange={(e) => setSelectedSolvent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 outline-none"
                    >
                      {SOLVENT_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (BP: {s.bp}°C, ε: {s.dielectric})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Capping Surfactant / Ligand
                    </label>
                    <select
                      value={selectedSurfactant}
                      onChange={(e) => setSelectedSurfactant(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 outline-none"
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

        {/* SUBTAB 2: STOICHIOMETRIC PRECURSOR BATCHER */}
        {activeSubTab === "stoichiometry" && (
          <motion.div
            key="tab-stoichiometry"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Batch Scale, Solution Volume & Dopant Controls Bar */}
            <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Target Batch Mass */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    {t("Target Product Yield", "Target Product Yield")}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400">
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
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono tabular-nums font-bold text-white outline-none"
                  />
                  <div className="flex gap-1">
                    {[0.5, 1.0, 5.0].map((mass) => (
                      <button
                        key={mass}
                        type="button"
                        onClick={() => setSynthTargetMass(mass)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
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

              {/* Solution Volume (mL) for Molarity Calculation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Solvent Volume</span>
                  </span>
                  <span className="font-mono tabular-nums font-bold text-cyan-400">
                    {solutionVolumeMl} mL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="2000"
                    step="5"
                    value={solutionVolumeMl}
                    onChange={(e) => setSolutionVolumeMl(Math.max(5, parseInt(e.target.value, 10) || 50))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono tabular-nums font-bold text-white outline-none"
                  />
                  {[25, 50, 100].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setSolutionVolumeMl(vol)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                        solutionVolumeMl === vol
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {vol}mL
                    </button>
                  ))}
                </div>
              </div>

              {/* Dopant Element & Concentration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {t("Dopant Substitution", "Dopant Substitution")}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-amber-400">
                    {synthDoping.toFixed(1)} mol%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Dopant (e.g. Fe, Nd)"
                    value={dopantElement}
                    onChange={(e) => setDopantElement(e.target.value.trim())}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white outline-none"
                  />
                  <input
                    type="range"
                    min="0.0"
                    max="20.0"
                    step="0.5"
                    value={synthDoping}
                    onChange={(e) => setSynthDoping(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 rounded-lg h-1.5 cursor-pointer self-center"
                  />
                </div>
              </div>

              {/* Substituted Cation Site */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-indigo-400" />
                  {t("Host Lattice Site", "Host Lattice Site")}
                </span>
                <select
                  value={dopedSubstitutedElement}
                  onChange={(e) => setDopedSubstitutedElement(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 outline-none"
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
            <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {t("Precursor Formulation & Analytical Balance Weighing Sheet", "Precursor Formulation & Analytical Balance Weighing Sheet")}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                    Product MW = {stoichCalculation.mwProduct.toFixed(2)} g/mol · Target Moles = {(stoichCalculation.molesProduct * 1000).toFixed(2)} mmol · Atom Economy = {stoichCalculation.atomEconomyPct.toFixed(1)}%
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono tabular-nums font-bold text-emerald-400">
                    Total Reagents: {stoichCalculation.totalPrecursorMassGrams.toFixed(4)} g
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStoichTable}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedStoich ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStoich ? "Copied TSV" : "Copy Weighing Table"}</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                      <th className="pb-3 pr-3">Cation</th>
                      <th className="pb-3 pr-3">Stoich ν</th>
                      <th className="pb-3 pr-3">Precursor Salt Selection</th>
                      <th className="pb-3 pr-3">Formula</th>
                      <th className="pb-3 pr-3">MW (g/mol)</th>
                      <th className="pb-3 pr-3 text-right">Molarity (M)</th>
                      <th className="pb-3 pr-3 text-right">Mass (g)</th>
                      <th className="pb-3 text-right">Mass (mg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stoichCalculation.precursors.map((prec, idx) => {
                      const dbList = PRECURSOR_DATABASE[prec.element] || [];
                      const isCustom = (selectedPrecursors[prec.element] || prec.precursorName) === "Custom Precursor";
                      return (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 pr-3 font-bold text-white">
                            {prec.element}
                          </td>
                          <td className="py-3 pr-3 text-slate-300">{prec.stoichCoeff.toFixed(4)}</td>
                          <td className="py-3 pr-3">
                            <select
                              value={selectedPrecursors[prec.element] || prec.precursorName}
                              onChange={(e) =>
                                setSelectedPrecursors((prev) => ({
                                  ...prev,
                                  [prec.element]: e.target.value
                                }))
                              }
                              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 outline-none max-w-[230px]"
                            >
                              {dbList.map((item) => (
                                <option key={item.name} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                              <option value="Custom Precursor">Custom Precursor (Manual MW)</option>
                            </select>
                          </td>
                          <td className="py-3 pr-3 text-slate-400">{prec.precursorFormula}</td>
                          <td className="py-3 pr-3 text-slate-300">
                            {isCustom ? (
                              <input
                                type="number"
                                min="1"
                                step="0.1"
                                value={customPrecursorMws[prec.element] || prec.precursorMw}
                                onChange={(e) => {
                                  const val = Math.max(1, parseFloat(e.target.value) || 50);
                                  setCustomPrecursorMws((prev) => ({ ...prev, [prec.element]: val }));
                                }}
                                className="w-20 px-2 py-1 bg-slate-950 border border-indigo-500/50 rounded text-xs font-mono text-white"
                              />
                            ) : (
                              prec.precursorMw.toFixed(2)
                            )}
                          </td>
                          <td className="py-3 pr-3 text-right text-indigo-300">
                            {prec.molarityMolL.toFixed(4)} M
                          </td>
                          <td className="py-3 pr-3 text-right font-bold text-emerald-400 text-sm">
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

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Hygroscopic Precursor Advisory:</strong> Hydrated nitrate and chloride salts absorb ambient moisture rapidly. Weigh immediately from a vacuum desiccator or standardize water of hydration by thermogravimetric analysis (TGA).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: JMAK KINETICS & FURNACE THERMAL SCHEDULE */}
        {activeSubTab === "kinetics" && (
          <motion.div
            key="tab-kinetics"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 Cols: Interactive JMAK Sigmoid Crystallization & LaMer Curve */}
              <div className="lg:col-span-7 bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>JMAK Crystallization Kinetics & Avrami Transformation</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                      X_C(t) = 1 - exp(-k·t^n) · Avrami n = {jmakKineticsData.n_exp.toFixed(2)} · k = {jmakKineticsData.k_rate.toExponential(2)} s⁻¹
                    </p>
                  </div>

                  <span className="text-xs font-mono tabular-nums font-bold text-emerald-400">
                    Yield @ {synthTime}h: {jmakKineticsData.currentYield.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={jmakKineticsData.points} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="crystGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748B"
                        fontSize={10}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#64748B"
                        fontSize={10}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0B132B", borderColor: "#1E293B", borderRadius: "10px", fontSize: "11px" }}
                        formatter={(val: any, name: string) => [
                          name === "crystallinity" ? `${val}%` : `${val} %/h`,
                          name === "crystallinity" ? "Crystalline Fraction X_C" : "Transformation Rate dX/dt"
                        ]}
                        labelFormatter={(label) => `Reaction Time: ${label} hours`}
                      />
                      <ReferenceLine
                        x={synthTime}
                        stroke="#F59E0B"
                        strokeDasharray="3 3"
                        label={{ value: `Dwell (${synthTime}h)`, fill: "#F59E0B", fontSize: 10 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="crystallinity"
                        stroke="#10B981"
                        strokeWidth={2.2}
                        fillOpacity={1}
                        fill="url(#crystGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right 5 Cols: Multi-Stage Furnace Thermal Ramp & Dwell Profiler */}
              <div className="lg:col-span-5 bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      <span>Furnace Thermal Ramp Schedule</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                      Ramp: {heatingRampRate.toFixed(1)} °C/min · Dwell: {synthTemp} °C for {synthTime}h
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-400">Ramp:</span>
                    <input
                      type="number"
                      min="1"
                      max="25"
                      step="0.5"
                      value={heatingRampRate}
                      onChange={(e) => setHeatingRampRate(Math.max(0.5, parseFloat(e.target.value) || 5))}
                      className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 font-bold text-right"
                    />
                    <span className="text-[10px] text-slate-400">°C/m</span>
                  </div>
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={jmakKineticsData.furnaceSchedule} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey="timeHr"
                        stroke="#64748B"
                        fontSize={10}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <YAxis
                        domain={[0, Math.max(250, synthTemp + 100)]}
                        stroke="#64748B"
                        fontSize={10}
                        tickFormatter={(v) => `${v}°`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0B132B", borderColor: "#1E293B", borderRadius: "10px", fontSize: "11px" }}
                        formatter={(val: any) => [`${val} °C`, "Setpoint Temperature"]}
                        labelFormatter={(label) => `Elapsed Time: ${label} hrs`}
                      />
                      <Line
                        type="linear"
                        dataKey="tempC"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#F59E0B" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom 3 Cards: Arrhenius, Gibbs-Thomson Critical Radius & Autoclave Pressure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#070B14] p-5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
                  Arrhenius Activation Barrier (E_a)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    {(jmakKineticsData.baseEa / 1000).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">kJ/mol</span>
                </div>
                <p className="text-xs text-slate-400">
                  Energy barrier for homogeneous nucleation and lattice diffusion in {selectedCandidate.phase_name}.
                </p>
              </div>

              <div className="bg-[#070B14] p-5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Gibbs-Thomson Critical Nucleus (r*)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    {(synthSize * 0.35).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">nm</span>
                </div>
                <p className="text-xs text-slate-400">
                  Minimum stable cluster radius required to overcome surface free energy and prevent Ostwald dissolution.
                </p>
              </div>

              <div className="bg-[#070B14] p-5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
                  Autoclave Saturated Vapor Pressure
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    {physicsReadouts.estPressureBar}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">bar</span>
                </div>
                <p className="text-xs text-slate-400">
                  Autogenous vessel pressure at {synthTemp} °C. Use PTFE-lined reactor rated ≥ 200 bar.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: PROTOCOL & AI SYNTHESIS FORMULATION */}
        {activeSubTab === "ai_route" && (
          <motion.div
            key="tab-ai-route"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Control Bar for Formulation */}
            <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{t("Synthesis Route Formulation Engine", "Synthesis Route Formulation Engine")}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {t(
                    "Synthesizes exact precursor weights, solvent chemistry, thermal ramp profiles, and powder XRD verification checkpoints.",
                    "Synthesizes exact precursor weights, solvent chemistry, thermal ramp profiles, and powder XRD verification checkpoints."
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 mr-1">Regime:</span>
                {[
                  { id: "purity", label: "Phase Purity" },
                  { id: "defects", label: "Defect Engineering" },
                  { id: "confinement", label: "Quantum Confinement" }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSynthAiFocus(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      synthAiFocus === f.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={generateDeterministicBlueprint}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Instant Blueprint
                </button>

                <button
                  type="button"
                  onClick={onRunSynthesisAI}
                  disabled={synthAiLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {synthAiLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{synthAiLoading ? "Formulating..." : "Run Deep AI Route"}</span>
                </button>
              </div>
            </div>

            {/* AI Generation Loading State */}
            {synthAiLoading && (
              <div className="bg-[#070B14] p-10 rounded-2xl border border-indigo-500/30 text-center flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-white">
                    {synthAiStep || "Computing Phase Boundaries & Precursor Kinetics..."}
                  </h5>
                  <p className="text-xs text-slate-400 font-mono">
                    Target: {selectedCandidate.formula} · {synthMorphology} · {synthTemp} °C · {synthAtmosphere}
                  </p>
                </div>
              </div>
            )}

            {/* Markdown Viewer */}
            {!synthAiLoading && activeMarkdownRecipe && (
              <div className="bg-[#070B14] p-5 sm:p-7 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {synthAiResult
                        ? "AI Synthesis Formulation Complete"
                        : "Quantitative Synthesis Protocol Blueprint"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyRecipe}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedRecipe ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRecipe ? "Copied" : "Copy Protocol"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadRecipe}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Export Markdown</span>
                    </button>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none prose-headings:text-indigo-200 prose-h2:text-base prose-h2:font-bold prose-h3:text-sm prose-p:text-slate-300 prose-p:text-xs prose-li:text-slate-300 prose-li:text-xs prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                  <ReactMarkdown>{activeMarkdownRecipe}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!synthAiLoading && !activeMarkdownRecipe && (
              <div className="bg-[#070B14] p-10 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
                <FlaskConical className="w-10 h-10 text-indigo-400/50" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {t("No Synthesis Route Formulated Yet", "No Synthesis Route Formulated Yet")}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Generate an instant stoichiometric & thermal protocol blueprint or run the deep AI synthesis formulation engine.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={generateDeterministicBlueprint}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    Generate Instant Blueprint
                  </button>
                  <button
                    type="button"
                    onClick={onRunSynthesisAI}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    {t("Generate AI Synthesis Route", "Generate AI Synthesis Route")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBTAB 5: LABORATORY SOP & AUDIT PROTOCOL */}
        {activeSubTab === "sop_protocol" && (
          <motion.div
            key="tab-sop"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <div className="bg-[#070B14] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pink-400" />
                    <span>{t("Standard Operating Procedure (SOP) Checklist", "Standard Operating Procedure (SOP) Checklist")}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Step-by-step laboratory verification workflow for {selectedCandidate.phase_name} ({selectedCandidate.formula}) · Progress: {completedSopCount}/{totalSopCount}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("Print SOP", "Print SOP")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAuditReport}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("Download Audit Report", "Download Audit Report")}</span>
                  </button>
                </div>
              </div>

              {/* SOP Step-by-step Interactive Checklist */}
              <div className="space-y-2.5">
                {[
                  {
                    id: "step_ppe",
                    step: "01. Safety & Chemical PPE Preparation",
                    desc: "Wear nitrile gloves, splash goggles, and flame-retardant lab coat. Perform acid digestion and solvent handling inside a certified fume hood."
                  },
                  {
                    id: "step_weighing",
                    step: "02. Analytical Balance Precursor Weighing",
                    desc: `Weigh target reagents on a 0.1 mg analytical balance: ${stoichCalculation.precursors
                      .map((p) => `${p.precursorName} = ${p.massGrams.toFixed(4)} g (${p.massMilligrams.toFixed(1)} mg)`)
                      .join("; ")}.`
                  },
                  {
                    id: "step_dissolution",
                    step: "03. Solvation & Chelation",
                    desc: `Dissolve precursors in ${solutionVolumeMl} mL of ${
                      SOLVENT_OPTIONS.find((s) => s.id === selectedSolvent)?.name || selectedSolvent
                    }. Adjust solution to pH ${synthPH.toFixed(1)} under 500 RPM magnetic stirring for 30 minutes.`
                  },
                  {
                    id: "step_autoclave",
                    step: "04. Reactor Vessel Loading",
                    desc: `Transfer precursor solution into a PTFE-lined autoclave (fill factor: 65%). Seal torque bolts evenly for estimated pressure of ${physicsReadouts.estPressureBar} bar.`
                  },
                  {
                    id: "step_calcination",
                    step: "05. Controlled Thermal Ramp & Dwell",
                    desc: `Ramp temperature at ${heatingRampRate.toFixed(1)} °C/min to ${synthTemp} °C. Hold isothermally for ${synthTime.toFixed(
                      1
                    )} hours under ${synthAtmosphere.toUpperCase()} atmosphere.`
                  },
                  {
                    id: "step_washing",
                    step: "06. Centrifugation, Washing & Drying",
                    desc: "Wash precipitate 3× with deionized water and 2× with anhydrous ethanol at 8,000 RPM for 10 min. Dry in vacuum oven at 80 °C for 6 hours."
                  },
                  {
                    id: "step_xrd",
                    step: "07. Powder XRD Phase & Broadening Verification",
                    desc: `Grind powder in an agate mortar and scan 2θ = 10°–90° to verify ${selectedCandidate.phase_name} reflections and expected Scherrer FWHM ≈ ${physicsReadouts.scherrerFwhmDeg}°.`
                  }
                ].map((item) => {
                  const isDone = !!sopChecked[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSopChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                        isDone
                          ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? "bg-emerald-500 border-emerald-400 text-black"
                            : "border-slate-700 bg-slate-800"
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-0.5">
                        <h5 className={`text-xs font-bold ${isDone ? "text-emerald-300 line-through" : "text-white"}`}>
                          {item.step}
                        </h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
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
